import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { staffApi } from "../../api/parkingApi";
import ParkingDigitalTwin3D from "../manager/ParkingDigitalTwin3D";

export default function ParkingTwin3DPage() {
  const navigate = useNavigate();
  const [zones, setZones] = useState([]);
  const [floors, setFloors] = useState([]);
  const [gates, setGates] = useState([]);
  const [sessions, setSessions] = useState([]);

  // States cho tính năng SOS
  const [sosActive, setSosActive] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0); // 0 -> 100
  const holdTimerRef = useRef(null);

  const fetchData = async () => {
    try {
      const res = await staffApi.getParkingConfig();
      const config = res.data.data || {};
      setFloors(config.floors || []);
      setZones(
        (config.zones || []).map((z) => ({
          id: z.id,
          zoneName: z.zoneName || `Khu ${z.zoneCode}`,
          zoneCode: z.zoneCode,
          floorName: z.floorName || "B1",
          vehicleTypeName: z.vehicleTypeName || "Xe máy",
          capacity: z.capacity || 0,
          currentCount: z.currentCount || 0,
          reservedCount: z.reservedCount || 0,
          status: z.status || "ACTIVE",
        }))
      );
      setGates(
        (config.gates || []).map((g) => ({
          id: g.id,
          gateCode: g.gateCode,
          gateName: g.gateName,
          gateType: g.gateType,
          status: g.isActive === false ? "INACTIVE" : "ACTIVE",
        }))
      );
    } catch (err) {
      console.warn("3D Page: Failed to load config", err);
    }

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = String(user.role || "").toLowerCase();
    const canReadAllSessions = ["staff", "manager", "admin"].includes(role);

    if (!canReadAllSessions) {
      setSessions([]);
      return;
    }

    try {
      const res = await staffApi.getAllSessionsHistory();
      setSessions(
        (res.data.data || []).map((s) => ({
          id: s.sessionId,
          status: s.status || (s.exitTime ? "COMPLETED" : "ACTIVE"),
        }))
      );
    } catch (err) {
      console.warn("3D Page: Failed to load sessions", err);
    }
  };

  const checkSosStatus = async () => {
    try {
      const res = await staffApi.getEmergencyStatus();
      setSosActive(res.data.data?.active || false);
    } catch (err) {
      console.warn("Failed to check SOS status", err);
    }
  };

  useEffect(() => {
    fetchData();
    checkSosStatus();
    const interval = setInterval(checkSosStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const startHold = () => {
    if (sosActive) return;
    setHoldProgress(0);
    const startTime = Date.now();
    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const percent = Math.min((elapsed / 3000) * 100, 100);
      setHoldProgress(percent);
      if (elapsed >= 3000) {
        clearInterval(holdTimerRef.current);
        holdTimerRef.current = null;
        triggerSos();
      }
    }, 50);
  };

  const stopHold = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldProgress(0);
  };

  const triggerSos = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      await staffApi.activateEmergency({
        activatedByUserId: user.id,
        reason: "Kích hoạt khẩn cấp SOS từ Bản đồ 3D",
        notes: "Giữ đè nút báo động 3 giây."
      });
      setSosActive(true);
      setHoldProgress(0);
      fetchData(); // làm mới cấu trúc 3D (mở barrier)
    } catch (err) {
      console.error("Failed to activate SOS", err);
    }
  };

  const handleDeactivate = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      await staffApi.deactivateEmergency({
        deactivatedByUserId: user.id,
        notes: "Hủy kích hoạt SOS từ Bản đồ 3D"
      });
      setSosActive(false);
      fetchData(); // làm mới
    } catch (err) {
      console.error("Failed to deactivate SOS", err);
    }
  };

  // Detect which role's dashboard to go back to
  const goBack = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = String(user.role || "staff").toLowerCase();
    if (role === "manager") {
      navigate("/manager");
    } else {
      navigate(`/${role}/dashboard`);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#020617]">
      <button
        onClick={goBack}
        className="fixed top-5 left-5 z-[10000] flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold backdrop-blur-xl transition-all cursor-pointer shadow-xl"
      >
        ← Quay lại Dashboard
      </button>

      <ParkingDigitalTwin3D
        zones={zones}
        floors={floors}
        gates={gates}
        sessions={sessions}
        onRefresh={fetchData}
      />

      {/* SOS Panel Overlay */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] bg-slate-950/90 border border-slate-800/80 backdrop-blur-2xl px-5 py-3.5 rounded-3xl shadow-2xl flex items-center gap-5 min-w-[320px]">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trạng thái SOS</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`h-2 w-2 rounded-full ${sosActive ? "bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]" : "bg-emerald-500"}`} />
            <span className={`text-xs font-bold ${sosActive ? "text-rose-400" : "text-emerald-400"}`}>
              {sosActive ? "ĐANG BÁO ĐỘNG" : "Hệ thống an toàn"}
            </span>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-850" />

        {sosActive ? (
          <button
            onClick={handleDeactivate}
            className="flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 transition-colors shadow shadow-rose-900/40 animate-pulse cursor-pointer border border-rose-500/20"
          >
            Hủy báo động
          </button>
        ) : (
          <div className="relative flex-1">
            <button
              onMouseDown={startHold}
              onMouseUp={stopHold}
              onMouseLeave={stopHold}
              onTouchStart={startHold}
              onTouchEnd={stopHold}
              className="w-full py-2 px-4 rounded-xl text-[10px] font-black uppercase text-white bg-slate-900 hover:bg-slate-850 active:bg-slate-800 transition-colors select-none cursor-pointer border border-slate-800"
            >
              {holdProgress > 0 ? `Kích hoạt (${Math.round(holdProgress)}%)` : "Báo động SOS (Giữ 3s)"}
            </button>

            {/* Progress bar overlay */}
            {holdProgress > 0 && (
              <div
                className="absolute bottom-0 left-0 h-[3px] bg-rose-500 rounded-b-xl transition-all duration-75"
                style={{ width: `${holdProgress}%` }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
