import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { staffApi } from "../../api/parkingApi";

function normalizeEmergencyStatus(payload) {
  const data = payload?.data || payload || {};
  const active = Boolean(data.active || data.isActive || data.sosActive);

  return {
    active,
    message:
      data.message ||
      data.reason ||
      "Hệ thống đang trong trạng thái khẩn cấp. Vui lòng dừng thao tác và theo hướng dẫn của Staff/Security.",
    reason: data.reason || "",
    updatedAt: data.activatedAt || data.updatedAt || data.timestamp || null,
  };
}

export default function DriverSosBanner() {
  const navigate = useNavigate();

  const [status, setStatus] = useState({
    loading: true,
    active: false,
    message: "",
  });

  const loadStatus = async () => {
    try {
      const res = await staffApi.getEmergencyStatus();
      setStatus({
        loading: false,
        ...normalizeEmergencyStatus(res.data),
      });
    } catch (err) {
      console.warn("Không thể tải SOS banner cho Driver:", err);
      setStatus({
        loading: false,
        active: false,
        message: "",
      });
    }
  };

  useEffect(() => {
    loadStatus();

    const timer = window.setInterval(() => {
      loadStatus();
    }, 15000);

    return () => window.clearInterval(timer);
  }, []);

  if (!status.active) return null;

  return (
    <button
      type="button"
      onClick={() => navigate("/driver/dashboard")}
      className="fixed inset-x-0 top-0 z-[9998] flex items-center justify-center gap-3 bg-rose-600 px-4 py-2.5 text-center text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-xl shadow-rose-900/30 transition hover:bg-rose-700"
      title="Bấm để quay về bảng điều khiển tài xế"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
      </span>

      <span>
        SOS đang bật — tạm khóa đặt chỗ, thanh toán và thao tác bãi xe
      </span>

      <span className="hidden text-rose-100 sm:inline">
        Bấm để về Dashboard →
      </span>
    </button>
  );
}
