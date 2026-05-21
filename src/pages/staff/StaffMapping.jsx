import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getStaffParkingMap } from "../../api/staffMappingApi";

function getVehicleLabel(type) {
  if (type === "bicycle") return "Xe đạp";
  if (type === "ebike") return "Xe đạp điện";
  if (type === "motorbike") return "Xe máy";
  return "Ô tô";
}

function getStatusLabel(status) {
  if (status === "available") return "Trống";
  if (status === "occupied") return "Có xe";
  return "Đã đặt";
}

export default function StaffMapping({ onLogout }) {
  const [activeFloor, setActiveFloor] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const [zones, setZones] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchParkingMap = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getStaffParkingMap();

      setZones(data.zones);
      setSlots(data.slots);

      if (data.zones.length > 0) {
        setActiveFloor(data.zones[0].floor);
      }
    } catch {
      setError("Không tải được dữ liệu sơ đồ bãi xe từ backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParkingMap();
  }, []);

  const floors = useMemo(() => {
    return Array.from(new Set(zones.map((zone) => zone.floor))).sort(
      (a, b) => a - b
    );
  }, [zones]);

  const floorZones = zones.filter((zone) => zone.floor === activeFloor);
  const floorSlots = slots.filter((slot) => slot.floor === activeFloor);

  const groups = useMemo(() => {
    return Array.from(
      new Map(
        floorZones.map((zone) => [
          zone.category,
          {
            category: zone.category,
            icon: zone.icon,
            zones: floorZones.filter((z) => z.category === zone.category),
          },
        ])
      ).values()
    );
  }, [floorZones]);

  const counts = {
    available: floorSlots.filter((slot) => slot.status === "available").length,
    occupied: floorSlots.filter((slot) => slot.status === "occupied").length,
    reserved: floorSlots.filter((slot) => slot.status === "reserved").length,
  };

  const filterSlot = (slot) => {
    const keyword = search.toLowerCase();

    const matchSearch =
      slot.id.toLowerCase().includes(keyword) ||
      slot.plate?.toLowerCase().includes(keyword);

    const matchStatus =
      statusFilter === "all" ? true : slot.status === statusFilter;

    const matchType =
      typeFilter === "all" ? true : slot.type === typeFilter;

    return matchSearch && matchStatus && matchType;
  };

  return (
    <div className="min-h-screen bg-[#faf9fc] text-slate-900">
      <header className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-8 backdrop-blur">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-full p-2 hover:bg-slate-100"
          >
            ☰
          </button>

          <h1 className="text-xl font-black">SmartParking</h1>
        </div>

        <nav className="hidden gap-4 md:flex">
          <Link
            to="/staff/dashboard"
            className="rounded-lg px-3 py-2 font-semibold text-slate-500 hover:bg-slate-100"
          >
            Bảng điều khiển
          </Link>

          <Link
            to="/staff/map"
            className="border-b-2 border-purple-600 px-3 py-2 font-bold text-slate-950"
          >
            Sơ đồ bãi xe
          </Link>

          <Link
            to="/staff/check-in"
            className="rounded-lg px-3 py-2 font-semibold text-slate-500 hover:bg-slate-100"
          >
            Check-in
          </Link>

          <Link
            to="/staff/check-out"
            className="rounded-lg px-3 py-2 font-semibold text-slate-500 hover:bg-slate-100"
          >
            Check-out
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <button className="rounded-full p-2 hover:bg-slate-100">
            🔔
          </button>

          <div className="h-9 w-9 rounded-full bg-purple-100 text-center font-bold leading-9 text-purple-700">
            A
          </div>
        </div>
      </header>

      <aside
        className={`fixed bottom-0 left-0 top-0 z-40 border-r border-slate-200 bg-white pt-20 shadow-sm transition-all ${
          collapsed ? "w-20" : "w-80"
        }`}
      >
        <div className="px-4 pb-6">
          {!collapsed && (
            <div className="mb-8 px-2">
              <h2 className="font-black">APEX AUTOMOTIVE</h2>

              <p className="text-xs font-bold uppercase tracking-widest text-purple-600">
                SmartParking Pro
              </p>
            </div>
          )}

          <nav className="space-y-2">
            <SideLink
              collapsed={collapsed}
              to="/staff/dashboard"
              icon="📊"
              label="Bảng điều khiển"
            />

            <SideLink
              collapsed={collapsed}
              to="/staff/map"
              icon="🅿️"
              label="Sơ đồ bãi xe"
              active
            />

            <SideLink
              collapsed={collapsed}
              to="/staff/check-in"
              icon="🚗"
              label="Check-in"
            />

            <SideLink
              collapsed={collapsed}
              to="/staff/check-out"
              icon="💳"
              label="Check-out"
            />

            <SideLink
              collapsed={collapsed}
              to="/staff/history"
              icon="📋"
              label="Lịch sử phiên gửi"
            />
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-4">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold text-red-600 hover:bg-red-50"
          >
            <span>⏻</span>
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>
    </div>
  );
}

function SideLink({
  to,
  icon,
  label,
  active,
  collapsed,
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition ${
        active
          ? "bg-slate-950 text-white"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
      }`}
    >
      <span>{icon}</span>

      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

function FloorButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition ${
        active
          ? "bg-white text-slate-950 shadow-sm"
          : "text-slate-500 hover:bg-white/50"
      }`}
    >
      {label}
    </button>
  );
}

function Badge({ color, label }) {
  const classes = {
    green: "bg-green-100 text-green-700 border-green-200",
    red: "bg-red-100 text-red-700 border-red-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
  };

  return (
    <div
      className={`rounded-full border px-4 py-2 text-xs font-black uppercase ${classes[color]}`}
    >
      {label}
    </div>
  );
}

function SlotCard({ slot, onClick }) {
  const style =
    slot.status === "available"
      ? "bg-green-100 border-green-200 text-green-800 hover:bg-green-200"
      : slot.status === "occupied"
      ? "bg-red-100 border-red-200 text-red-800 hover:bg-red-200"
      : "bg-amber-100 border-amber-200 text-amber-800 hover:bg-amber-200";

  return (
    <button
      onClick={onClick}
      className={`min-h-16 rounded-lg border p-2 text-center transition ${style}`}
    >
      <div className="text-xs font-black">{slot.id}</div>

      <div className="text-[10px] font-bold uppercase">
        {getStatusLabel(slot.status)}
      </div>

      {slot.plate && (
        <div className="mt-1 text-[10px] font-black">
          {slot.plate}
        </div>
      )}
    </button>
  );
}

function SlotModal({ slot, onClose }) {
  const isAvailable = slot.status === "available";
  const isReserved = slot.status === "reserved";

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-slate-950 p-6 text-white">
          <div>
            <h3 className="text-xl font-bold">
              Ô đỗ {slot.id}
            </h3>

            <p className="text-xs uppercase tracking-widest text-slate-300">
              {getVehicleLabel(slot.type)}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-white/10"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex justify-between rounded-xl bg-slate-100 p-4">
      <span className="text-slate-500">{label}</span>

      <span className="font-bold">{value}</span>
    </div>
  );
}