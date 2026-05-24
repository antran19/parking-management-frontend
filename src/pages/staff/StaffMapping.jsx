import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getStaffParkingMap } from "../../api/staffMappingApi";

function getVehicleLabel(type) {
  if (type === "bicycle") return "Xe đạp";
  if (type === "ebike") return "Xe đạp điện";
  if (type === "motorbike") return "Xe máy";
  if (type === "car") return "Ô tô";
  return "Không rõ";
}

function getStatusLabel(status) {
  if (status === "available") return "Trống";
  if (status === "occupied") return "Có xe";
  if (status === "reserved") return "Đã đặt";
  return "Không rõ";
}

export default function StaffMapping({ onLogout }) {
  const navigate = useNavigate();

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

      const apiZones = Array.isArray(data?.zones) ? data.zones : [];
      const apiSlots = Array.isArray(data?.slots) ? data.slots : [];

      setZones(apiZones);
      setSlots(apiSlots);

      if (apiZones.length > 0) {
        setActiveFloor(apiZones[0].floor);
      }
    } catch (err) {
      console.error("Staff parking map API error:", err);
      setError("Không tải được dữ liệu sơ đồ bãi xe từ backend.");
      setZones([]);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParkingMap();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    localStorage.removeItem("role");

    if (typeof onLogout === "function") {
      onLogout();
    }

    navigate("/login", { replace: true });
  };

  const floors = useMemo(() => {
    return Array.from(new Set(zones.map((zone) => zone.floor))).sort(
      (a, b) => Number(a) - Number(b)
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

  const filteredSlots = floorSlots.filter((slot) => {
    const keyword = search.toLowerCase();

    const matchSearch =
      String(slot.id || "").toLowerCase().includes(keyword) ||
      String(slot.plate || "").toLowerCase().includes(keyword);

    const matchStatus =
      statusFilter === "all" ? true : slot.status === statusFilter;

    const matchType = typeFilter === "all" ? true : slot.type === typeFilter;

    return matchSearch && matchStatus && matchType;
  });

  return (
    <div className="min-h-screen bg-[#faf9fc] text-slate-900">
      <header className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-8 backdrop-blur">
        <div className="flex items-center gap-4">
          <button
            type="button"
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
          <button
            type="button"
            className="rounded-full p-2 hover:bg-slate-100"
          >
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
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold text-red-600 hover:bg-red-50"
          >
            <span>⏻</span>
            {!collapsed && <span>Đăng xuất</span>}
          </button>
        </div>
      </aside>

      <main
        className={`min-h-screen pt-20 transition-all ${
          collapsed ? "ml-20" : "ml-80"
        }`}
      >
        <section className="space-y-6 p-8">
          <div className="rounded-3xl bg-slate-950 p-8 text-white">
            <p className="text-sm font-bold uppercase tracking-widest text-purple-300">
              Staff Parking Map
            </p>

            <h1 className="mt-2 text-3xl font-black">Sơ đồ bãi xe</h1>

            <p className="mt-2 text-slate-300">
              Staff có thể xem trạng thái từng ô đỗ, tìm theo biển số, lọc theo
              trạng thái và loại xe.
            </p>
          </div>

          {loading && (
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              Đang tải dữ liệu sơ đồ bãi xe...
            </div>
          )}

          {error && !loading && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
              <p className="font-bold">Lỗi tải dữ liệu</p>
              <p className="mt-1 text-sm">{error}</p>

              <button
                type="button"
                onClick={fetchParkingMap}
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
              >
                Tải lại
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Badge color="green" label={`Trống: ${counts.available}`} />
                <Badge color="red" label={`Có xe: ${counts.occupied}`} />
                <Badge color="amber" label={`Đã đặt: ${counts.reserved}`} />
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-950">
                      Bộ lọc sơ đồ
                    </h2>
                    <p className="text-sm text-slate-500">
                      Lọc slot theo tầng, trạng thái, loại xe hoặc biển số.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Tìm slot hoặc biển số..."
                      className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-200"
                    />

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-200"
                    >
                      <option value="all">Tất cả trạng thái</option>
                      <option value="available">Trống</option>
                      <option value="occupied">Có xe</option>
                      <option value="reserved">Đã đặt</option>
                    </select>

                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-200"
                    >
                      <option value="all">Tất cả loại xe</option>
                      <option value="bicycle">Xe đạp</option>
                      <option value="ebike">Xe đạp điện</option>
                      <option value="motorbike">Xe máy</option>
                      <option value="car">Ô tô</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 rounded-2xl bg-slate-100 p-2">
                {floors.length > 0 ? (
                  floors.map((floor) => (
                    <FloorButton
                      key={floor}
                      label={`Tầng ${floor}`}
                      active={activeFloor === floor}
                      onClick={() => {
                        setActiveFloor(floor);
                        setSelectedSlot(null);
                      }}
                    />
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-500">
                    Chưa có dữ liệu tầng.
                  </div>
                )}
              </div>

              <section className="grid gap-6 xl:grid-cols-12">
                <div className="space-y-6 xl:col-span-3">
                  {groups.length > 0 ? (
                    groups.map((group) => (
                      <div
                        key={group.category}
                        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{group.icon}</span>

                          <div>
                            <p className="text-xs font-bold uppercase text-slate-400">
                              Khu vực
                            </p>
                            <h3 className="font-black text-slate-950">
                              {group.category}
                            </h3>
                          </div>
                        </div>

                        <p className="mt-3 text-sm text-slate-500">
                          {group.zones.length} khu thuộc tầng {activeFloor}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
                      Không có khu vực cho tầng này.
                    </div>
                  )}
                </div>

                <div className="xl:col-span-9">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-black text-slate-950">
                          Layout tầng {activeFloor}
                        </h3>
                        <p className="text-sm text-slate-500">
                          Bấm vào từng slot để xem chi tiết.
                        </p>
                      </div>

                      <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600">
                        {filteredSlots.length} slot
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-3 md:grid-cols-6 xl:grid-cols-8">
                      {filteredSlots.length > 0 ? (
                        filteredSlots.map((slot) => (
                          <SlotCard
                            key={slot.id}
                            slot={slot}
                            onClick={() => setSelectedSlot(slot)}
                          />
                        ))
                      ) : (
                        <div className="col-span-full rounded-2xl bg-slate-50 p-8 text-center text-slate-500">
                          Không có slot phù hợp bộ lọc.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </section>
      </main>

      {selectedSlot && (
        <SlotModal slot={selectedSlot} onClose={() => setSelectedSlot(null)} />
      )}
    </div>
  );
}

function SideLink({ to, icon, label, active = false, collapsed }) {
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
      type="button"
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
    green: "border-green-200 bg-green-100 text-green-700",
    red: "border-red-200 bg-red-100 text-red-700",
    amber: "border-amber-200 bg-amber-100 text-amber-700",
  };

  return (
    <div
      className={`rounded-full border px-4 py-2 text-xs font-black uppercase ${
        classes[color] || "border-slate-200 bg-slate-100 text-slate-700"
      }`}
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
      type="button"
      onClick={onClick}
      className={`min-h-16 rounded-lg border p-2 text-center transition ${style}`}
    >
      <div className="text-xs font-black">{slot.id}</div>

      <div className="text-[10px] font-bold uppercase">
        {getStatusLabel(slot.status)}
      </div>

      {slot.plate && (
        <div className="mt-1 text-[10px] font-black">{slot.plate}</div>
      )}
    </button>
  );
}

function SlotModal({ slot, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-slate-950 p-6 text-white">
          <div>
            <h3 className="text-xl font-bold">Ô đỗ {slot.id}</h3>

            <p className="text-xs uppercase tracking-widest text-slate-300">
              {getVehicleLabel(slot.type)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 p-6">
          <Info label="Trạng thái" value={getStatusLabel(slot.status)} />
          <Info label="Loại xe" value={getVehicleLabel(slot.type)} />
          <Info label="Biển số" value={slot.plate || "--"} />
          <Info label="Tầng" value={slot.floor || "--"} />
          <Info label="Khu vực" value={slot.zone || slot.area || "--"} />
        </div>

        <div className="bg-slate-50 p-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-950 py-3 font-bold text-white hover:bg-slate-800"
          >
            Đóng
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