import React, { useEffect, useRef, useState } from "react";
import { staffApi } from "../../api/parkingApi";

// Định dạng thời gian sang locale tiếng Việt
const formatTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN");
};

// Panel container dùng chung (giống các trang khác)
function Panel({ title, children, className }) {
  return (
    <div className={`action-panel-item rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className || ""}`}>
      <h3 className="mb-5 text-base font-bold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

// Empty state khi không có dữ liệu
function Empty({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-400">
      {text}
    </div>
  );
}

// Map dịch lý do khẩn cấp sang tiếng Việt
const REASON_VI = {
  FIRE_OR_FLOOD: "Cháy / ngập / sơ tán khẩn cấp",
  SECURITY_THREAT: "Đe dọa an ninh",
  MEDICAL_EMERGENCY: "Cấp cứu y tế",
  OTHER_EMERGENCY: "Khẩn cấp khác"
};

// Danh sách lịch sử SOS
function SosHistoryList({ logs }) {
  if (!logs.length) return <Empty text="Chưa có lịch sử SOS nào." />;
  return (
    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
      {logs.slice(0, 15).map((log, idx) => (
        <div
          key={log.eventId || idx}
          className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900">{log.active ? "🚨 ĐANG KÍCH HOẠT SOS" : "✅ ĐÃ GIẢI QUYẾT"}</p>
              <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">
                {REASON_VI[log.reason] || log.reason || "Khẩn cấp"} · {log.buildingName || "—"}
              </p>
              {log.notes && (
                <p className="mt-1 text-xs text-slate-400 italic">{log.notes}</p>
              )}
            </div>
            {/* Badge người kích hoạt */}
            {log.activatedBy && (
              <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700 border border-red-100 whitespace-nowrap flex-shrink-0">
                {log.activatedBy}
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-400">
            <span>Kích hoạt: {formatTime(log.activatedAt)}</span>
            {log.deactivatedAt && <span>Hủy: {formatTime(log.deactivatedAt)}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ==============================================================
// COMPONENT CHÍNH — Trang điều khiển SOS khẩn cấp (Emergency)
// ==============================================================
export default function EmergencyPage({ showToast, user, emergencyStatus, onStatusChange }) {
  const holdTimerRef = useRef(null);
  const holdIntervalRef = useRef(null);

  // State nút SOS giữ 3 giây
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHoldingSos, setIsHoldingSos] = useState(false);
  const [sosReason, setSosReason] = useState("FIRE_OR_FLOOD");

  // State cấu hình bật/tắt SOS từ backend
  const [sosEnabled, setSosEnabled] = useState(true);
  const [sosSettingLoaded, setSosSettingLoaded] = useState(false);
  const [updatingSosSetting, setUpdatingSosSetting] = useState(false);

  // Lịch sử SOS
  const [emergencyHistory, setEmergencyHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);



  // Thông tin user
  const userRole = String(user?.role || "").toUpperCase();
  const canManageSos = userRole === "ADMIN" || userRole === "MANAGER" || userRole === "SECURITY";
  const fullName = user?.fullName || "Bảo vệ";

  // Phát âm thanh cảnh báo khi kích hoạt SOS
  const playAlarm = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const gain = ctx.createGain();
      gain.gain.value = 0.08;
      gain.connect(ctx.destination);
      [0, 220, 440].forEach((delay) => {
        const oscillator = ctx.createOscillator();
        oscillator.type = "square";
        oscillator.frequency.value = 880;
        oscillator.connect(gain);
        oscillator.start(ctx.currentTime + delay / 1000);
        oscillator.stop(ctx.currentTime + delay / 1000 + 0.16);
      });
      window.setTimeout(() => ctx.close().catch(() => {}), 1200);
    } catch (err) {
      console.warn("Cannot play browser alarm:", err);
    }
  };

  // Fetch cấu hình SOS, lịch sử SOS và danh sách cổng khi mount
  useEffect(() => {
    const fetchEmergencyData = async () => {
      try {
        const [settingsRes, historyRes, configRes] = await Promise.allSettled([
          staffApi.getEmergencySettings(),
          staffApi.getEmergencyHistory(),
          staffApi.getParkingConfig(),
        ]);

        // Xử lý cấu hình bật/tắt SOS
        if (settingsRes.status === "fulfilled") {
          setSosEnabled(settingsRes.value.data.data?.sosEnabled !== false);
          setSosSettingLoaded(true);
        } else {
          setSosSettingLoaded(false);
          console.warn("Không tải được cấu hình SOS:", settingsRes.reason);
        }

        // Xử lý lịch sử SOS
        if (historyRes.status === "fulfilled") {
          setEmergencyHistory(historyRes.value.data.data || []);
        } else {
          console.warn("Không tải được lịch sử SOS:", historyRes.reason);
        }


      } catch (err) {
        console.error("Fetch emergency data failed:", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchEmergencyData();
  }, []);



  // ==============================================================
  // LOGIC GIỮ NÚT 3 GIÂY ĐỂ KÍCH HOẠT SOS
  // ==============================================================

  // Bắt đầu giữ nút SOS
  const startSosHold = () => {
    if (!user?.id) {
      showToast("Thiếu user.id, vui lòng đăng nhập lại.", "error");
      return;
    }
    if (emergencyStatus?.active) return;
    if (!sosSettingLoaded) {
      showToast("Chưa tải được cấu hình SOS. Kiểm tra backend.", "error");
      return;
    }
    if (!sosEnabled) {
      showToast("Chức năng SOS đang bị khóa.", "error");
      return;
    }

    setIsHoldingSos(true);
    setHoldProgress(0);
    const startedAt = Date.now();

    // Cập nhật progress bar mỗi 60ms
    holdIntervalRef.current = window.setInterval(() => {
      setHoldProgress(Math.min(100, ((Date.now() - startedAt) / 3000) * 100));
    }, 60);

    // Sau 3 giây → kích hoạt SOS
    holdTimerRef.current = window.setTimeout(async () => {
      clearSosHold(false);
      await activateSos();
    }, 3000);
  };

  // Hủy giữ nút (thả tay sớm hoặc rời chuột)
  const clearSosHold = (reset = true) => {
    if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current);
    if (holdIntervalRef.current) window.clearInterval(holdIntervalRef.current);
    holdTimerRef.current = null;
    holdIntervalRef.current = null;
    setIsHoldingSos(false);
    if (reset) setHoldProgress(0);
  };

  // Gọi API kích hoạt SOS
  const activateSos = async () => {
    if (!sosSettingLoaded || !sosEnabled) return;
    try {
      const res = await staffApi.activateEmergency({
        activatedByUserId: user.id,
        reason: sosReason,
        notes: `Security Dashboard SOS hold-3s by ${fullName}`,
      });
      // Cập nhật trạng thái SOS lên component cha
      onStatusChange?.(res.data.data);
      showToast("🚨 SOS đã kích hoạt — toàn bộ dashboard sẽ nhận cảnh báo", "danger");
      playAlarm();
      // Reload lịch sử sau khi kích hoạt
      const historyRes = await staffApi.getEmergencyHistory();
      setEmergencyHistory(historyRes.data.data || []);
    } catch (err) {
      console.error("Activate SOS failed:", err);
      showToast(err.response?.data?.message || "Kích hoạt SOS thất bại", "error");
    }
  };

  // Gọi API hủy SOS đang active
  const deactivateSos = async () => {
    if (!canManageSos) {
      showToast("Chỉ Security/Manager/Admin được hủy SOS.", "error");
      return;
    }
    if (!user?.id) {
      showToast("Thiếu user.id, vui lòng đăng nhập lại.", "error");
      return;
    }
    try {
      const res = await staffApi.deactivateEmergency({
        deactivatedByUserId: user.id,
        notes: `SOS cancelled from Security Dashboard by ${fullName}`,
      });
      onStatusChange?.(res.data.data);
      showToast("✅ SOS đã được hủy", "success");
      // Reload lịch sử sau khi hủy SOS
      const historyRes = await staffApi.getEmergencyHistory();
      setEmergencyHistory(historyRes.data.data || []);
    } catch (err) {
      console.error("Deactivate SOS failed:", err);
      showToast(err.response?.data?.message || "Hủy SOS thất bại", "error");
    }
  };

  // Cập nhật cài đặt bật/tắt chức năng SOS
  const updateSosEnabled = async (enabled) => {
    if (!sosSettingLoaded) {
      showToast("Chưa tải được cấu hình SOS.", "error");
      return;
    }
    setUpdatingSosSetting(true);
    try {
      const res = await staffApi.updateEmergencySettings({ sosEnabled: enabled });
      setSosEnabled(res.data.data?.sosEnabled !== false);
      setSosSettingLoaded(true);
      showToast(enabled ? "✅ Đã mở khóa kích hoạt SOS" : "🔒 Đã khóa kích hoạt SOS", enabled ? "success" : "warning");
    } catch (err) {
      console.error("Update SOS setting failed:", err);
      showToast(err.response?.data?.message || "Cập nhật trạng thái SOS thất bại", "error");
    } finally {
      setUpdatingSosSetting(false);
    }
  };

  return (
    <div className="space-y-6 mt-8">
      {/* ── Banner SOS chính — nút giữ to màu đỏ ── */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-8 shadow-xl">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-red-600/20 to-transparent pointer-events-none" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          {/* Thông tin + controls */}
          <div>
            <p className="text-xs font-black uppercase tracking-[0.45em] text-red-400">Emergency Control</p>
            <h1 className="mt-3 text-4xl font-black text-white">SOS KHẨN CẤP</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-300">
              {!sosSettingLoaded
                ? "Chưa tải được cấu hình bật/tắt SOS từ backend. Vui lòng kiểm tra kết nối hoặc đăng nhập lại."
                : sosEnabled
                  ? "Nhấn giữ nút SOS đủ 3 giây để kích hoạt chế độ sơ tán. Backend sẽ mở toàn bộ barrier và broadcast tới mọi dashboard qua WebSocket."
                  : "Chức năng kích hoạt SOS đang bị khóa. Dashboard vẫn theo dõi trạng thái realtime, nhưng không thể kích hoạt SOS cho đến khi được mở khóa."}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {/* Chọn lý do kích hoạt SOS */}
              <select
                value={sosReason}
                onChange={(e) => setSosReason(e.target.value)}
                disabled={emergencyStatus?.active}
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-bold text-white outline-none disabled:opacity-50"
              >
                <option value="FIRE_OR_FLOOD">Cháy / ngập / sơ tán khẩn cấp</option>
                <option value="SECURITY_THREAT">Đe dọa an ninh</option>
                <option value="MEDICAL_EMERGENCY">Cấp cứu y tế</option>
                <option value="OTHER_EMERGENCY">Khẩn cấp khác</option>
              </select>

              {/* Nút khóa/mở khóa SOS (chỉ Security/Manager/Admin) */}
              {canManageSos && (
                <button
                  onClick={() => updateSosEnabled(!sosEnabled)}
                  disabled={updatingSosSetting || emergencyStatus?.active || !sosSettingLoaded}
                  title={!sosSettingLoaded ? "Chưa tải được cấu hình SOS" : emergencyStatus?.active ? "Cần hủy SOS active trước khi tắt chức năng" : "Bật/tắt quyền kích hoạt SOS toàn hệ thống"}
                  className={`rounded-2xl px-5 py-3 text-sm font-black shadow-xl disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${sosEnabled ? "bg-amber-400 text-slate-950" : "bg-emerald-400 text-slate-950"}`}
                >
                  {updatingSosSetting
                    ? "Đang cập nhật..."
                    : !sosSettingLoaded
                      ? "Không tải được cấu hình SOS"
                      : sosEnabled
                        ? "🔒 Khóa kích hoạt SOS"
                        : "🔓 Mở khóa kích hoạt SOS"}
                </button>
              )}

              {/* Nút hủy SOS — chỉ hiện khi đang active */}
              {emergencyStatus?.active && (
                <button
                  onClick={deactivateSos}
                  disabled={!canManageSos}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-red-700 shadow-xl disabled:cursor-not-allowed disabled:opacity-50 hover:bg-red-50 transition-colors"
                >
                  {canManageSos ? "✕ Hủy SOS đang active" : "Chỉ Security/Manager/Admin được hủy"}
                </button>
              )}
            </div>
          </div>

          {/* Nút giữ 3 giây để kích hoạt SOS */}
          <button
            type="button"
            onMouseDown={startSosHold}
            onMouseUp={() => clearSosHold()}
            onMouseLeave={() => clearSosHold()}
            onTouchStart={startSosHold}
            onTouchEnd={() => clearSosHold()}
            disabled={emergencyStatus?.active || !sosSettingLoaded || !sosEnabled}
            className={`relative flex min-h-56 flex-col items-center justify-center overflow-hidden rounded-[2rem] border-4 text-white shadow-[0_0_60px_rgba(239,68,68,0.55)] transition hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${sosSettingLoaded && sosEnabled ? "border-red-300 bg-red-600" : "border-slate-500 bg-slate-700"}`}
          >
            {/* Progress fill khi giữ nút */}
            <div className="absolute bottom-0 left-0 top-0 bg-white/25 transition-all" style={{ width: `${holdProgress}%` }} />
            <span className="relative text-6xl">🔴</span>
            <span className="relative mt-3 text-2xl font-black">
              {!sosSettingLoaded ? "CHƯA TẢI CẤU HÌNH" : sosEnabled ? "GIỮ 3 GIÂY" : "SOS ĐÃ KHÓA"}
            </span>
            <span className="relative mt-1 text-xs font-black uppercase tracking-[0.35em] text-red-100">
              {!sosSettingLoaded ? "KIỂM TRA BACKEND" : sosEnabled ? "SOS KHẨN CẤP" : "SECURITY ĐÃ KHÓA"}
            </span>
            {/* Đếm ngược khi đang giữ nút */}
            {isHoldingSos && (
              <span className="relative mt-3 font-mono text-lg font-black">
                {Math.ceil((3000 - (holdProgress / 100) * 3000) / 1000)}s
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Trạng thái SOS + Lịch sử ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trạng thái SOS hiện tại */}
        <Panel title="📡 Trạng thái SOS hiện tại">
          <div className={`rounded-2xl border p-6 ${emergencyStatus?.active ? "border-red-300 bg-red-50" : sosEnabled ? "border-emerald-200 bg-emerald-50" : "border-slate-300 bg-slate-50"}`}>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">Current State</p>
            <h3 className={`mt-3 text-3xl font-black ${emergencyStatus?.active ? "text-red-700" : sosEnabled ? "text-emerald-700" : "text-slate-700"}`}>
              {emergencyStatus?.active ? "🚨 SOS ACTIVE" : sosEnabled ? "✅ SOS READY" : "🔒 SOS DISABLED"}
            </h3>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              {emergencyStatus?.active
                ? (emergencyStatus.message || "Hệ thống đang ở trạng thái khẩn cấp. Tất cả barrier đã mở.")
                : sosEnabled
                  ? "Chức năng SOS đang sẵn sàng. Security có thể kích hoạt khi xảy ra khẩn cấp."
                  : "Chức năng kích hoạt SOS đang bị khóa bởi Security/Manager/Admin."}
            </p>
            {emergencyStatus?.buildingName && (
              <p className="mt-4 text-xs text-slate-500">Building: {emergencyStatus.buildingName}</p>
            )}
            {emergencyStatus?.reason && (
              <p className="mt-1 text-xs font-bold text-red-600">Lý do: {emergencyStatus.reason}</p>
            )}
          </div>
        </Panel>

        {/* Lịch sử SOS */}
        <Panel title="🚨 Lịch sử SOS">
          {loadingHistory ? (
            <div className="py-8 text-center text-sm text-slate-400">Đang tải lịch sử...</div>
          ) : (
            <SosHistoryList logs={emergencyHistory} />
          )}
        </Panel>
      </div>

    </div>
  );
}
