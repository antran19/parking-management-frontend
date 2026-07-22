import React, { useEffect, useRef, useState } from "react";
import { staffApi } from "../../api/parkingApi";

/**
 * EmergencyPage — Trang điều khiển SOS khẩn cấp
 *
 * Chức năng chính:
 *   1. Nút SOS lớn — phải giữ đủ 3 giây mới kích hoạt (tránh bấm nhầm)
 *   2. Nút khóa/mở khóa chức năng SOS (chỉ Security/Manager/Admin)
 *   3. Nút hủy SOS khi đang active
 *   4. Lịch sử các lần SOS đã xảy ra
 *
 * Props nhận vào:
 *   showToast     — hàm hiện thông báo (từ SecurityDashboard cha)
 *   user          — object thông tin người dùng đang đăng nhập
 *   emergencyStatus — trạng thái SOS hiện tại { active: true/false }
 *   onStatusChange  — hàm cập nhật emergencyStatus lên component cha
 */

// ---------------------------------------------------------------
// HÀM TIỆN ÍCH: formatTime — Định dạng thời gian sang tiếng Việt
// VD: "2024-01-15T10:30:00" → "15/01/2024, 10:30:00"
// ---------------------------------------------------------------
const formatTime = (value) => {
  if (!value) return "—"; // Nếu không có giá trị, trả về dấu gạch ngang
  return new Date(value).toLocaleString("vi-VN");
};

// ---------------------------------------------------------------
// COMPONENT: Panel — Hộp trắng bọc ngoài khối nội dung
// ---------------------------------------------------------------
function Panel({ title, children, className }) {
  const extraClass = className || "";
  return (
    <div className={`action-panel-item rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${extraClass}`}>
      <h3 className="mb-5 text-base font-bold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------
// COMPONENT: Empty — Hiển thị khi không có dữ liệu
// ---------------------------------------------------------------
function Empty({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-400">
      {text}
    </div>
  );
}

// ---------------------------------------------------------------
// Object dịch lý do SOS từ mã backend sang tiếng Việt
// Key = mã backend, Value = văn bản hiển thị
// ---------------------------------------------------------------
const REASON_VI = {
  FIRE_OR_FLOOD:      "Cháy / ngập / sơ tán khẩn cấp",
  SECURITY_THREAT:    "Đe dọa an ninh",
  MEDICAL_EMERGENCY:  "Cấp cứu y tế",
  OTHER_EMERGENCY:    "Khẩn cấp khác",
};

// ---------------------------------------------------------------
// COMPONENT: SosHistoryList — Danh sách lịch sử SOS
//
// Props: logs — mảng các sự kiện SOS đã xảy ra
// ---------------------------------------------------------------
function SosHistoryList({ logs }) {
  const [currentPage, setCurrentPage] = useState(1);

  // Nếu mảng rỗng, hiện thông báo "chưa có dữ liệu"
  if (logs.length === 0) {
    return <Empty text="Chưa có lịch sử SOS nào." />;
  }

  const itemsPerPage = 10;
  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = logs.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <p className="mb-3 text-xs text-slate-400 font-semibold">
        Hiển thị {logs.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + itemsPerPage, logs.length)} trên tổng số {logs.length} sự cố (Trang {currentPage}/{totalPages || 1})
      </p>
      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {paginatedLogs.map((log, idx) => {
        // log.eventId là ID duy nhất — nếu không có thì dùng idx (vị trí trong mảng)
        const itemKey = log.eventId || idx;

        // Dịch lý do sang tiếng Việt, nếu không có trong REASON_VI thì dùng giá trị gốc
        const reasonText = REASON_VI[log.reason] || log.reason || "Khẩn cấp";

        return (
          <div
            key={itemKey}
            className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900">
                  {log.active ? "🚨 ĐANG KÍCH HOẠT SOS" : "✅ ĐÃ GIẢI QUYẾT"}
                </p>
                <p className="mt-1 text-xs font-medium leading-relaxed text-slate-500">
                  {reasonText} · {log.buildingName || "—"}
                </p>
                {log.notes && (
                  <p className="mt-1 text-xs text-slate-400 italic">{log.notes}</p>
                )}
              </div>
              {/* Badge tên người kích hoạt — chỉ hiện nếu có */}
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
        );
      })}
      </div>
      
      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-colors"
          >
            Trước
          </button>
          <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-none custom-scrollbar pb-1 sm:pb-0">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                  currentPage === page
                    ? "border-red-600 bg-red-600 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-colors"
          >
            Tiếp
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// COMPONENT CHÍNH — EmergencyPage
// ---------------------------------------------------------------
export default function EmergencyPage({ showToast, user, emergencyStatus, onStatusChange }) {

  // === REFS cho logic giữ nút 3 giây ===
  // holdTimerRef: lưu ID của setTimeout (sau 3s kích hoạt SOS)
  // holdIntervalRef: lưu ID của setInterval (cập nhật progress bar mỗi 60ms)
  // Dùng useRef thay useState vì không cần re-render khi thay đổi
  const holdTimerRef    = useRef(null);
  const holdIntervalRef = useRef(null);

  // === STATE nút SOS giữ 3 giây ===
  // holdProgress: phần trăm tiến trình (0 → 100) khi đang giữ nút
  // isHoldingSos: true khi đang giữ nút, false khi thả ra
  // sosReason: lý do SOS đang chọn trong dropdown
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHoldingSos, setIsHoldingSos]  = useState(false);
  const [sosReason, setSosReason]        = useState("FIRE_OR_FLOOD");

  // === STATE cấu hình SOS ===
  // sosEnabled: true = SOS đang được bật (có thể kích hoạt), false = bị khóa
  // sosSettingLoaded: true khi đã tải được cấu hình từ backend
  // updatingSosSetting: true khi đang gọi API bật/tắt SOS
  const [sosEnabled, setSosEnabled]             = useState(true);
  const [sosSettingLoaded, setSosSettingLoaded] = useState(false);
  const [updatingSosSetting, setUpdatingSosSetting] = useState(false);

  // === STATE lịch sử SOS ===
  const [emergencyHistory, setEmergencyHistory] = useState([]);
  const [loadingHistory, setLoadingHistory]     = useState(true);

  // === THÔNG TIN USER ===
  const userRole = String(user?.role || "").toUpperCase();
  // canManageSos: chỉ 3 role này mới được bật/tắt/hủy SOS
  const canManageSos = (
    userRole === "ADMIN"    ||
    userRole === "MANAGER"  ||
    userRole === "SECURITY"
  );
  const fullName = user?.fullName || "Bảo vệ";


  // ---------------------------------------------------------------
  // HÀM: playAlarm — Phát âm thanh cảnh báo (giống SecurityDashboard)
  // ---------------------------------------------------------------
  const playAlarm = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const gain = ctx.createGain();
      gain.gain.value = 0.08;
      gain.connect(ctx.destination);
      const delays = [0, 220, 440];
      delays.forEach((delay) => {
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


  // ---------------------------------------------------------------
  // useEffect — Tải dữ liệu khi component xuất hiện lần đầu
  //
  // Tải cùng lúc 3 thứ:
  //   1. Cấu hình SOS (sosEnabled)
  //   2. Lịch sử SOS
  //   3. Cấu hình cổng (không dùng trong UI, chỉ prefetch)
  // ---------------------------------------------------------------
  useEffect(() => {
    const fetchEmergencyData = async () => {
      try {
        const results = await Promise.allSettled([
          staffApi.getEmergencySettings(),  // [0] Cấu hình bật/tắt SOS
          staffApi.getEmergencyHistory(),    // [1] Lịch sử SOS
          staffApi.getParkingConfig(),       // [2] Cấu hình cổng
        ]);

        const settingsRes = results[0];
        const historyRes  = results[1];
        // results[2] (configRes) hiện chưa dùng trong UI

        // Xử lý cấu hình SOS
        if (settingsRes.status === "fulfilled") {
          // sosEnabled !== false: nếu backend không trả về false thì coi là true
          const isEnabled = settingsRes.value.data.data?.sosEnabled !== false;
          setSosEnabled(isEnabled);
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
  }, []); // [] = chỉ chạy 1 lần khi mount


  // ---------------------------------------------------------------
  // HÀM: startSosHold — Bắt đầu giữ nút SOS
  //
  // Làm gì: Khi ngón tay/chuột nhấn xuống nút SOS:
  //   1. Kiểm tra các điều kiện (có user.id, SOS chưa active, đã load config)
  //   2. Bắt đầu interval cập nhật thanh progress (mỗi 60ms)
  //   3. Set timeout 3000ms — sau 3 giây tự động kích hoạt SOS
  //
  // Khi nào gọi: onMouseDown hoặc onTouchStart trên nút SOS
  // ---------------------------------------------------------------
  const startSosHold = () => {
    // Kiểm tra điều kiện trước khi cho giữ nút
    if (!user?.id) {
      showToast("Thiếu user.id, vui lòng đăng nhập lại.", "error");
      return;
    }
    if (emergencyStatus?.active) {
      return; // SOS đã đang active rồi, không cần kích hoạt thêm
    }
    if (!sosSettingLoaded) {
      showToast("Chưa tải được cấu hình SOS. Kiểm tra backend.", "error");
      return;
    }
    if (!sosEnabled) {
      showToast("Chức năng SOS đang bị khóa.", "error");
      return;
    }

    // Bắt đầu giữ nút
    setIsHoldingSos(true);
    setHoldProgress(0);

    // Lưu thời điểm bắt đầu giữ để tính phần trăm tiến trình
    const startedAt = Date.now();

    // Cập nhật thanh progress mỗi 60ms
    holdIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAt; // Số ms đã trôi qua
      const percent = (elapsed / 3000) * 100; // 3000ms = 100%
      const capped  = Math.min(100, percent);  // Không vượt quá 100%
      setHoldProgress(capped);
    }, 60);

    // Sau 3000ms = 3 giây → kích hoạt SOS
    holdTimerRef.current = window.setTimeout(async () => {
      clearSosHold(false); // Dọn sạch interval (false = không reset progress về 0)
      await activateSos();
    }, 3000);
  };


  // ---------------------------------------------------------------
  // HÀM: clearSosHold — Hủy giữ nút (thả tay sớm)
  //
  // Làm gì: Xóa timer và interval, reset trạng thái đang giữ nút.
  //
  // Khi nào gọi: onMouseUp, onMouseLeave, onTouchEnd trên nút SOS
  //
  // reset = true: xóa thanh progress (thả tay giữa chừng)
  // reset = false: giữ nguyên progress = 100% (khi đã đủ 3s)
  // ---------------------------------------------------------------
  const clearSosHold = (reset = true) => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
    }
    if (holdIntervalRef.current) {
      window.clearInterval(holdIntervalRef.current);
    }
    holdTimerRef.current    = null;
    holdIntervalRef.current = null;
    setIsHoldingSos(false);
    if (reset) {
      setHoldProgress(0);
    }
  };


  // ---------------------------------------------------------------
  // HÀM: activateSos — Gọi API kích hoạt SOS
  //
  // Làm gì: Gửi request POST lên backend để kích hoạt SOS,
  //         cập nhật trạng thái lên component cha, phát âm thanh,
  //         tải lại lịch sử SOS.
  //
  // Khi nào gọi: Chỉ được gọi từ startSosHold sau 3 giây.
  // ---------------------------------------------------------------
  const activateSos = async () => {
    // Kiểm tra lại lần nữa (phòng trường hợp state thay đổi trong 3s giữ nút)
    if (!sosSettingLoaded || !sosEnabled) return;

    try {
      const res = await staffApi.activateEmergency({
        activatedByUserId: user.id,
        reason: sosReason,
        notes: `Security Dashboard SOS hold-3s by ${fullName}`,
      });

      // Cập nhật trạng thái SOS lên component cha (SecurityDashboard)
      onStatusChange?.(res.data.data);
      showToast("🚨 SOS đã kích hoạt — toàn bộ dashboard sẽ nhận cảnh báo", "danger");
      playAlarm();

      // Tải lại lịch sử SOS sau khi kích hoạt
      const historyRes = await staffApi.getEmergencyHistory();
      setEmergencyHistory(historyRes.data.data || []);
    } catch (err) {
      console.error("Activate SOS failed:", err);
      showToast(err.response?.data?.message || "Kích hoạt SOS thất bại", "error");
    }
  };


  // ---------------------------------------------------------------
  // HÀM: deactivateSos — Gọi API hủy SOS đang active
  //
  // Làm gì: Kiểm tra quyền → gọi API hủy SOS → cập nhật state.
  //
  // Khi nào gọi: Bấm nút "✕ Hủy SOS đang active"
  // ---------------------------------------------------------------
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

      // Tải lại lịch sử sau khi hủy SOS
      const historyRes = await staffApi.getEmergencyHistory();
      setEmergencyHistory(historyRes.data.data || []);
    } catch (err) {
      console.error("Deactivate SOS failed:", err);
      showToast(err.response?.data?.message || "Hủy SOS thất bại", "error");
    }
  };


  // ---------------------------------------------------------------
  // HÀM: updateSosEnabled — Bật/tắt chức năng SOS toàn hệ thống
  //
  // Làm gì: Gọi API cập nhật cấu hình, cập nhật state sosEnabled.
  //
  // Khi nào gọi: Bấm nút "🔒 Khóa kích hoạt SOS" hoặc "🔓 Mở khóa"
  //
  // Tham số enabled: true = mở khóa, false = khóa
  // ---------------------------------------------------------------
  const updateSosEnabled = async (enabled) => {
    if (!sosSettingLoaded) {
      showToast("Chưa tải được cấu hình SOS.", "error");
      return;
    }

    setUpdatingSosSetting(true);
    try {
      const res = await staffApi.updateEmergencySettings({ sosEnabled: enabled });
      const newEnabled = res.data.data?.sosEnabled !== false;
      setSosEnabled(newEnabled);
      setSosSettingLoaded(true);

      if (enabled) {
        showToast("✅ Đã mở khóa kích hoạt SOS", "success");
      } else {
        showToast("🔒 Đã khóa kích hoạt SOS", "warning");
      }
    } catch (err) {
      console.error("Update SOS setting failed:", err);
      showToast(err.response?.data?.message || "Cập nhật trạng thái SOS thất bại", "error");
    } finally {
      setUpdatingSosSetting(false);
    }
  };


  // ---------------------------------------------------------------
  // Tính text hiển thị trên nút SOS lớn (đơn giản hóa thay vì ternary lồng)
  // ---------------------------------------------------------------
  let sosButtonLabel = "GIỮ 3 GIÂY";     // Mặc định khi SOS sẵn sàng
  if (!sosSettingLoaded) {
    sosButtonLabel = "CHƯA TẢI CẤU HÌNH";
  } else if (!sosEnabled) {
    sosButtonLabel = "SOS ĐÃ KHÓA";
  }

  let sosButtonSubLabel = "SOS KHẨN CẤP"; // Dòng nhỏ bên dưới
  if (!sosSettingLoaded) {
    sosButtonSubLabel = "KIỂM TRA BACKEND";
  } else if (!sosEnabled) {
    sosButtonSubLabel = "SECURITY ĐÃ KHÓA";
  }

  // Class màu nền cho nút SOS lớn
  const sosButtonColorClass = (sosSettingLoaded && sosEnabled)
    ? "border-red-300 bg-red-600"    // Đỏ khi sẵn sàng
    : "border-slate-500 bg-slate-700"; // Xám khi bị khóa hoặc chưa tải

  // Text cho nút bật/tắt SOS
  let toggleSosLabel = "";
  if (updatingSosSetting) {
    toggleSosLabel = "Đang cập nhật...";
  } else if (!sosSettingLoaded) {
    toggleSosLabel = "Không tải được cấu hình SOS";
  } else if (sosEnabled) {
    toggleSosLabel = "🔒 Khóa kích hoạt SOS";
  } else {
    toggleSosLabel = "🔓 Mở khóa kích hoạt SOS";
  }

  // Class màu nền cho nút bật/tắt SOS
  const toggleSosColorClass = sosEnabled
    ? "bg-amber-400 text-slate-950"  // Vàng khi đang bật (bấm sẽ khóa)
    : "bg-emerald-400 text-slate-950"; // Xanh khi đang khóa (bấm sẽ mở)

  // Tính số giây còn lại khi đang giữ nút
  const secondsLeft = Math.ceil((3000 - (holdProgress / 100) * 3000) / 1000);

  // Text trạng thái SOS hiện tại trong panel bên dưới
  let sosStatusLabel = "✅ SOS READY";
  if (emergencyStatus?.active) {
    sosStatusLabel = "🚨 SOS ACTIVE";
  } else if (!sosEnabled) {
    sosStatusLabel = "🔒 SOS DISABLED";
  }

  // Class màu cho text trạng thái SOS
  let sosStatusColorClass = "text-emerald-700";
  if (emergencyStatus?.active) {
    sosStatusColorClass = "text-red-700";
  } else if (!sosEnabled) {
    sosStatusColorClass = "text-slate-700";
  }

  // Class màu cho vùng nền panel trạng thái
  let sosStatusBgClass = "border-emerald-200 bg-emerald-50";
  if (emergencyStatus?.active) {
    sosStatusBgClass = "border-red-300 bg-red-50";
  } else if (!sosEnabled) {
    sosStatusBgClass = "border-slate-300 bg-slate-50";
  }

  // Text mô tả trạng thái SOS
  let sosStatusDesc = "Chức năng SOS đang sẵn sàng. Security có thể kích hoạt khi xảy ra khẩn cấp.";
  if (emergencyStatus?.active) {
    sosStatusDesc = emergencyStatus.message || "Hệ thống đang ở trạng thái khẩn cấp. Tất cả barrier đã mở.";
  } else if (!sosEnabled) {
    sosStatusDesc = "Chức năng kích hoạt SOS đang bị khóa bởi Security/Manager/Admin.";
  }


  return (
    <div className="space-y-6 mt-8">

      {/* ── BANNER SOS CHÍNH ── */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 md:p-8 shadow-xl">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-red-600/20 to-transparent pointer-events-none" />

        {/* Responsive:
            Mặc định: flex-col (mobile) — các phần tử xếp dọc
            lg:grid lg:grid-cols-[1.3fr_0.7fr] — từ 1024px: 2 cột, cột trái chiếm 1.3 phần
        */}
        <div className="relative z-10 flex flex-col gap-6 lg:grid lg:grid-cols-[1.3fr_0.7fr]">

          {/* Cột trái: thông tin + controls */}
          <div>
            <p className="text-xs font-black uppercase tracking-[0.45em] text-red-400">Emergency Control</p>
            {/* text-2xl (mobile) vs text-4xl (desktop) */}
            <h1 className="mt-3 text-2xl md:text-4xl font-black text-white">SOS KHẨN CẤP</h1>
            <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-300">
              {!sosSettingLoaded
                ? "Chưa tải được cấu hình bật/tắt SOS từ backend. Vui lòng kiểm tra kết nối hoặc đăng nhập lại."
                : sosEnabled
                  ? "Nhấn giữ nút SOS đủ 3 giây để kích hoạt chế độ sơ tán. Backend sẽ mở toàn bộ barrier và broadcast tới mọi dashboard qua WebSocket."
                  : "Chức năng kích hoạt SOS đang bị khóa. Dashboard vẫn theo dõi trạng thái realtime, nhưng không thể kích hoạt SOS cho đến khi được mở khóa."}
            </p>

            {/* Controls: select lý do + nút khóa/mở + nút hủy SOS
                grid-cols-1 (mobile) → md:flex md:flex-wrap (desktop)
            */}
            <div className="mt-5 grid grid-cols-1 gap-3 md:flex md:flex-wrap md:gap-3">

              {/* Dropdown chọn lý do SOS */}
              <select
                value={sosReason}
                onChange={(e) => setSosReason(e.target.value)}
                disabled={emergencyStatus?.active}
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-bold text-white outline-none disabled:opacity-50 w-full md:w-auto"
              >
                <option value="FIRE_OR_FLOOD">Cháy / ngập / sơ tán khẩn cấp</option>
                <option value="SECURITY_THREAT">Đe dọa an ninh</option>
                <option value="MEDICAL_EMERGENCY">Cấp cứu y tế</option>
                <option value="OTHER_EMERGENCY">Khẩn cấp khác</option>
              </select>

              {/* Nút khóa/mở khóa SOS — chỉ hiện với role có quyền */}
              {canManageSos && (
                <button
                  onClick={() => updateSosEnabled(!sosEnabled)}
                  disabled={updatingSosSetting || emergencyStatus?.active || !sosSettingLoaded}
                  className={`rounded-2xl px-5 py-3 text-sm font-black shadow-xl disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${toggleSosColorClass}`}
                >
                  {toggleSosLabel}
                </button>
              )}

              {/* Nút hủy SOS — chỉ hiện khi đang có SOS active */}
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

          {/* ── NÚT SOS GIỮ 3 GIÂY ──
              Responsive:
                min-h-14  = tối thiểu 56px (dễ bấm ngón cái trên mobile)
                lg:min-h-56 = 224px trên desktop (to, ấn tượng)

              Events:
                onMouseDown / onTouchStart = bắt đầu giữ
                onMouseUp / onMouseLeave / onTouchEnd = thả ra
          */}
          <button
            type="button"
            onMouseDown={startSosHold}
            onMouseUp={() => clearSosHold()}
            onMouseLeave={() => clearSosHold()}
            onTouchStart={startSosHold}
            onTouchEnd={() => clearSosHold()}
            disabled={emergencyStatus?.active || !sosSettingLoaded || !sosEnabled}
            className={`relative flex min-h-14 lg:min-h-56 flex-col items-center justify-center overflow-hidden rounded-[2rem] border-4 text-white shadow-[0_0_60px_rgba(239,68,68,0.55)] transition hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${sosButtonColorClass}`}
          >
            {/* Thanh tiến trình fill từ trái sang phải khi đang giữ nút
                style={{ width: `${holdProgress}%` }}: rộng bao nhiêu % thì fill bấy nhiêu
            */}
            <div
              className="absolute bottom-0 left-0 top-0 bg-white/25 transition-all"
              style={{ width: `${holdProgress}%` }}
            />
            {/* Icon và text — text lớn hơn trên desktop */}
            <span className="relative text-4xl md:text-6xl">🔴</span>
            <span className="relative mt-2 md:mt-3 text-lg md:text-2xl font-black">{sosButtonLabel}</span>
            <span className="relative mt-1 text-xs font-black uppercase tracking-[0.35em] text-red-100">{sosButtonSubLabel}</span>
            {/* Đếm ngược số giây — chỉ hiện khi đang giữ nút */}
            {isHoldingSos && (
              <span className="relative mt-3 font-mono text-lg font-black">{secondsLeft}s</span>
            )}
          </button>

        </div>
      </div>

      {/* ── PANEL TRẠNG THÁI + LỊCH SỬ ──
          1 cột trên mobile, 2 cột từ lg (1024px)
      */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Panel trạng thái SOS hiện tại */}
        <Panel title="📡 Trạng thái SOS hiện tại">
          <div className={`rounded-2xl border p-6 ${sosStatusBgClass}`}>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">Current State</p>
            <h3 className={`mt-3 text-3xl font-black ${sosStatusColorClass}`}>
              {sosStatusLabel}
            </h3>
            <p className="mt-2 text-sm font-semibold text-slate-600">{sosStatusDesc}</p>
            {emergencyStatus?.buildingName && (
              <p className="mt-4 text-xs text-slate-500">Building: {emergencyStatus.buildingName}</p>
            )}
            {emergencyStatus?.reason && (
              <p className="mt-1 text-xs font-bold text-red-600">Lý do: {emergencyStatus.reason}</p>
            )}
          </div>
        </Panel>

        {/* Panel lịch sử SOS */}
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
