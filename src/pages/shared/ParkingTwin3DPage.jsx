import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { staffApi } from "../../api/parkingApi";
import ParkingDigitalTwin3D from "../manager/ParkingDigitalTwin3D";

/**
 * ParkingTwin3DPage
 *
 * NOTE Quảng - Driver:
 * - File này là shared page đang được route /driver/3d-map sử dụng.
 * - Không sửa component 3D của Manager.
 * - Chỉ normalize dữ liệu /parking/config để Driver 3D map nhận được zones thật.
 */
export default function ParkingTwin3DPage() {
  const navigate = useNavigate();
  const [zones, setZones] = useState([]);
  const [floors, setFloors] = useState([]);
  const [gates, setGates] = useState([]);
  const [sessions, setSessions] = useState([]);

  const normalizeConfigPayload = (raw) => {
    const payload = raw?.data?.data || raw?.data || raw || {};

    const rawZones = Array.isArray(payload.zones) ? payload.zones : [];
    const rawFloors = Array.isArray(payload.floors) ? payload.floors : [];
    const rawGates = Array.isArray(payload.gates) ? payload.gates : [];

    const normalizedZones = rawZones.map((z, index) => {
      const floorName =
        z.floorName ||
        z.floor_name ||
        z.floor ||
        z.floorCode ||
        z.level ||
        "B1";

      const currentCount =
        z.currentCount ??
        z.current_count ??
        z.occupied ??
        z.occupiedCount ??
        0;

      const reservedCount =
        z.reservedCount ??
        z.reserved_count ??
        z.reserved ??
        0;

      const capacity =
        z.capacity ??
        z.totalSlots ??
        z.total_slots ??
        0;

      return {
        id: z.id || z.zoneId || `${floorName}-${z.zoneCode || index}`,
        zoneName: z.zoneName || z.name || `Khu ${z.zoneCode || index + 1}`,
        zoneCode: z.zoneCode || z.code || String(index + 1),
        floorName,
        vehicleTypeName:
          z.vehicleTypeName ||
          z.vehicleType?.name ||
          z.vehicle_type_name ||
          z.type ||
          "Phương tiện",
        capacity: Number(capacity || 0),
        currentCount: Number(currentCount || 0),
        reservedCount: Number(reservedCount || 0),
        status: z.status || "ACTIVE",
      };
    });

    const floorMap = new Map();

    rawFloors.forEach((f, index) => {
      const floorName =
        f.floorName ||
        f.name ||
        f.floorCode ||
        f.code ||
        `Tầng ${index + 1}`;

      floorMap.set(floorName, {
        id: f.id || floorName,
        floorName,
        floorNumber: Number(f.floorNumber ?? f.level ?? index + 1),
      });
    });

    normalizedZones.forEach((z, index) => {
      if (!floorMap.has(z.floorName)) {
        floorMap.set(z.floorName, {
          id: z.floorName,
          floorName: z.floorName,
          floorNumber: index + 1,
        });
      }
    });

    const normalizedGates = rawGates.map((g, index) => ({
      id: g.id || g.gateId || `gate-${index + 1}`,
      gateCode: g.gateCode || g.code || `G${index + 1}`,
      gateName: g.gateName || g.name || `Cổng ${index + 1}`,
      gateType: g.gateType || g.type || "ENTRY",
      status: g.isActive === false || g.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    }));

    return {
      zones: normalizedZones,
      floors: Array.from(floorMap.values()),
      gates: normalizedGates,
    };
  };

  const fetchData = async () => {
    try {
      const res = await staffApi.getParkingConfig();
      const normalized = normalizeConfigPayload(res);

      setZones(normalized.zones);
      setFloors(normalized.floors);
      setGates(normalized.gates);

      console.log("3D parking config normalized:", normalized);
    } catch (err) {
      console.warn("3D Page: Failed to load parking config", err);
      setZones([]);
      setFloors([]);
      setGates([]);
    }

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = String(user.role || localStorage.getItem("role") || "").toLowerCase();
    const canReadAllSessions = ["staff", "manager", "admin"].includes(role);

    if (!canReadAllSessions) {
      setSessions([]);
      return;
    }

    try {
      const res = await staffApi.getAllSessionsHistory();
      const data = res.data?.data || [];
      setSessions(
        data.map((s) => ({
          id: s.sessionId || s.id,
          status: s.status || (s.exitTime ? "COMPLETED" : "ACTIVE"),
        }))
      );
    } catch (err) {
      console.warn("3D Page: Failed to load sessions", err);
      setSessions([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const goBack = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = String(user.role || localStorage.getItem("role") || "driver").toLowerCase();
    navigate(`/${role}/dashboard`);
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
    </div>
  );
}