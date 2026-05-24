import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

// Custom SVG Icons for Premium UI
const IconDashboard = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const IconMap = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const IconCheckIn = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </svg>
);

const IconCheckOut = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconHistory = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconLogout = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const IconBell = () => (
  <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const IconSettings = () => (
  <svg className="w-6 h-6 text-slate-500 hover:rotate-45 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 01-6 0z" />
  </svg>
);

const LicensePlate = ({ plate }) => (
  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-300 bg-white font-mono font-bold text-slate-800 text-[9px] tracking-wide shadow-sm scale-95 origin-center">
    {plate}
  </span>
);

const floorData = {
  1: [
    {
      category: "Khu vực xe đạp",
      icon: "🚲",
      zones: [
        { section: "Khu vực A - Lối vào 01", prefix: "D-A", slots: 10, cols: 5, type: "bicycle" },
        { section: "Khu vực B - Trung tâm", prefix: "D-B", slots: 10, cols: 5, type: "bicycle" },
      ],
    },
    {
      category: "Khu vực xe đạp điện",
      icon: "🔋",
      zones: [
        { section: "Khu vực A - Dành riêng", prefix: "E-A", slots: 30, cols: 5, type: "ebike" },
        { section: "Khu vực B - Gần lối ra", prefix: "E-B", slots: 30, cols: 5, type: "ebike" },
      ],
    },
  ],
  2: [
    {
      category: "Khu vực xe máy",
      icon: "🏍️",
      zones: [
        { section: "Khu vực A", prefix: "M-A", slots: 20, cols: 5, type: "motorbike" },
        { section: "Khu vực B", prefix: "M-B", slots: 20, cols: 5, type: "motorbike" },
        { section: "Khu vực C", prefix: "M-C", slots: 20, cols: 5, type: "motorbike" },
        { section: "Khu vực D", prefix: "M-D", slots: 20, cols: 5, type: "motorbike" },
      ],
    },
  ],
  3: [
    {
      category: "Khu vực ô tô",
      icon: "🚗",
      zones: [
        { section: "Khu vực A", prefix: "C-A", slots: 20, cols: 4, type: "car" },
        { section: "Khu vực B", prefix: "C-B", slots: 20, cols: 4, type: "car" },
        { section: "Khu vực C", prefix: "C-C", slots: 20, cols: 4, type: "car" },
        { section: "Khu vực D", prefix: "C-D", slots: 20, cols: 4, type: "car" },
      ],
    },
  ],
};

function createMockSlots(zone) {
  return Array.from({ length: zone.slots }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    const id = `${zone.prefix}${number}`;

    const mod = index % 6;
    const status =
      mod === 0 || mod === 3
        ? "occupied"
        : mod === 2
        ? "reserved"
        : "available";

    return {
      id,
      status,
      type: zone.type,
      plate:
        status === "occupied"
          ? zone.type === "car"
            ? `51A-${12000 + index}`
            : `59A1-${23000 + index}`
          : undefined,
      startTime: status === "occupied" ? "08:15" : undefined,
      fee: status === "occupied" ? `${15000 + index * 1000}đ` : "0đ",
    };
  });
}

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
  const [activeFloor, setActiveFloor] = useState(3);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [paymentSlot, setPaymentSlot] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [liveDate, setLiveDate] = useState("");

  const [allSlots, setAllSlots] = useState(() =>
    Object.values(floorData)
      .flat()
      .flatMap((group) => group.zones)
      .flatMap((zone) => createMockSlots(zone))
  );

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setLiveDate(today.toLocaleDateString('vi-VN', options));

    return () => {
      clearInterval(clockTimer);
    };
  }, []);

  const groups = floorData[activeFloor];

  const floorPrefixes = groups.flatMap((group) =>
    group.zones.map((zone) => zone.prefix)
  );

  const floorSlots = useMemo(() => {
    return allSlots.filter((slot) =>
      floorPrefixes.some((prefix) => slot.id.startsWith(prefix))
    );
  }, [allSlots, activeFloor]);

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

    const matchStatus = statusFilter === "all" || slot.status === statusFilter;
    const matchType = typeFilter === "all" || slot.type === typeFilter;

    return matchSearch && matchStatus && matchType;
  };

  const handleReserveSlot = (slotId) => {
    setAllSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              status: "reserved",
              plate: undefined,
              startTime: undefined,
              fee: "0đ",
            }
          : slot
      )
    );
    setSelectedSlot(null);
  };

  const handleCancelReserveSlot = (slotId) => {
    setAllSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              status: "available",
              plate: undefined,
              startTime: undefined,
              fee: "0đ",
            }
          : slot
      )
    );
    setSelectedSlot(null);
  };

  const handleDonePayment = (slotId) => {
    setAllSlots((prev) =>
      prev.map((slot) =>
        slot.id === slotId
          ? {
              ...slot,
              status: "available",
              plate: undefined,
              startTime: undefined,
              fee: "0đ",
            }
          : slot
      )
    );

    setPaymentSlot(null);
    setSelectedSlot(null);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans">
      {/* Sidebar - Dark Glassmorphism style */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-50 flex h-screen flex-col bg-slate-900 text-white shadow-xl transition-all duration-300 ${
          collapsed ? "w-20" : "w-72"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center gap-3.5 px-6 py-6 border-b border-slate-800 overflow-hidden">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20 font-black text-lg flex-shrink-0"
          >
            P
          </button>
          {!collapsed && (
            <div className="animate-fade-in-fast">
              <h1 className="text-md font-extrabold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent whitespace-nowrap">
                Smart Parking
              </h1>
              <p className="text-xs text-blue-400 font-semibold tracking-wider uppercase whitespace-nowrap">
                Cổng nhân viên
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-x-hidden">
          <SideLink collapsed={collapsed} to="/staff/dashboard" icon={<IconDashboard />} label="Bảng điều khiển" />
          <SideLink collapsed={collapsed} to="/staff/map" icon={<IconMap />} label="Sơ đồ bãi xe" active />
          <SideLink collapsed={collapsed} to="/staff/check-in" icon={<IconCheckIn />} label="Check-in xe vào" />
          <SideLink collapsed={collapsed} to="/staff/check-out" icon={<IconCheckOut />} label="Check-out xe ra" />
          <SideLink collapsed={collapsed} to="/staff/history" icon={<IconHistory />} label="Lịch sử phiên gửi" />
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-800 p-4 overflow-hidden">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-all duration-200"
          >
            <IconLogout />
            {!collapsed && <span className="whitespace-nowrap">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main
        className={`flex-1 min-h-screen flex flex-col transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-72"
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/80 px-8 backdrop-blur-md">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-900">Sơ đồ vị trí đỗ xe</h2>
            <p className="text-xs text-slate-500 mt-0.5">{liveDate}</p>
          </div>

          <div className="flex items-center gap-6">
            {/* Live Clock Widget */}
            <div className="hidden md:flex flex-col items-end border-r border-slate-200 pr-6">
              <span className="font-mono text-lg font-bold text-indigo-600 bg-indigo-50/50 px-3 py-1 rounded-lg border border-indigo-100">
                {liveTime}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative rounded-full p-2.5 hover:bg-slate-100/80 transition-colors">
                <IconBell />
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              </button>

              <button className="rounded-full p-2.5 hover:bg-slate-100/80 transition-colors">
                <IconSettings />
              </button>
            </div>

            {/* Profile Avatar */}
            <div className="flex items-center gap-3.5 border-l border-slate-200 pl-6">
              <div className="text-right">
                <p className="font-semibold text-sm text-slate-900">Nguyễn Văn A</p>
                <p className="text-xs text-slate-400 font-medium">Nhân viên bãi xe</p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-650 font-bold text-white shadow-md shadow-indigo-500/20">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Content Section */}
        <section className="flex-1 space-y-6 p-8">
          {/* Top Floor pill switcher */}
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex rounded-2xl bg-slate-200/80 p-1 border border-slate-300/30">
              <FloorButton active={activeFloor === 1} onClick={() => setActiveFloor(1)} icon="🚲" label="Tầng 1" />
              <FloorButton active={activeFloor === 2} onClick={() => setActiveFloor(2)} icon="🏍️" label="Tầng 2" />
              <FloorButton active={activeFloor === 3} onClick={() => setActiveFloor(3)} icon="🚗" label="Tầng 3" />
            </div>

            <div className="flex flex-wrap gap-3">
              <Badge color="green" label={`Trống: ${counts.available}`} />
              <Badge color="red" label={`Có xe: ${counts.occupied}`} />
              <Badge color="amber" label={`Đã đặt: ${counts.reserved}`} />
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-12">
            <div className="md:col-span-6">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm ô đỗ hoặc biển số xe..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all text-sm font-medium"
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none text-sm font-semibold text-slate-700 focus:border-indigo-500 transition-all"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="available">Trống</option>
                <option value="occupied">Có xe</option>
                <option value="reserved">Đã đặt</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none text-sm font-semibold text-slate-700 focus:border-indigo-500 transition-all"
              >
                <option value="all">Tất cả loại xe</option>
                <option value="bicycle">Xe đạp</option>
                <option value="ebike">Xe đạp điện</option>
                <option value="motorbike">Xe máy</option>
                <option value="car">Ô tô</option>
              </select>
            </div>
          </div>

          {/* Zones layout */}
          <div className="space-y-10">
            {groups.map((group) => (
              <section key={group.category} className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{group.icon}</span>
                  <h2 className="text-md font-extrabold uppercase text-slate-900 tracking-wide">
                    {group.category}
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                  {group.zones.map((zone) => {
                    const zoneSlots = allSlots
                      .filter((slot) => slot.id.startsWith(zone.prefix))
                      .filter(filterSlot);

                    return (
                      <div key={zone.prefix} className="space-y-4 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {zone.section}
                          </h3>
                          <span className="text-xs font-semibold text-slate-400">
                            {zoneSlots.length}/{zone.slots} ô đỗ
                          </span>
                        </div>

                        <div className="h-px bg-slate-100 mb-2" />

                        <div
                          className={`grid gap-2.5 ${
                            zone.cols === 4 ? "grid-cols-4" : "grid-cols-5"
                          }`}
                        >
                          {zoneSlots.map((slot) => (
                            <SlotCard
                              key={slot.id}
                              slot={slot}
                              onClick={() => setSelectedSlot(slot)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>
      </main>

      {/* Detail Slot Modal */}
      {selectedSlot && (
        <SlotModal
          slot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onReserve={() => handleReserveSlot(selectedSlot.id)}
          onCancelReserve={() => handleCancelReserveSlot(selectedSlot.id)}
          onPayment={() => setPaymentSlot(selectedSlot)}
        />
      )}

      {/* Payment Slot Modal */}
      {paymentSlot && (
        <PaymentModal
          slot={paymentSlot}
          onClose={() => setPaymentSlot(null)}
          onDone={() => handleDonePayment(paymentSlot.id)}
        />
      )}
    </div>
  );
}

function SideLink({ to, icon, label, active, collapsed }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${
        active
          ? "bg-slate-800 text-blue-400 border border-slate-700 shadow-inner"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </Link>
  );
}

function FloorButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-150 ${
        active
          ? "bg-white text-indigo-650 shadow-sm border border-slate-200"
          : "text-slate-550 hover:bg-white/40"
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function Badge({ color, label }) {
  const classes = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    red: "bg-rose-50 text-rose-700 border-rose-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  };

  return (
    <div className={`rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-wider ${classes[color]}`}>
      {label}
    </div>
  );
}

function SlotCard({ slot, onClick }) {
  const isAvailable = slot.status === "available";
  const isOccupied = slot.status === "occupied";

  const style = isAvailable
    ? "bg-emerald-50/50 border-emerald-100 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-200"
    : isOccupied
    ? "bg-rose-50/50 border-rose-100 text-rose-800 hover:bg-rose-100 hover:border-rose-200"
    : "bg-amber-50/50 border-amber-100 text-amber-800 hover:bg-amber-100 hover:border-amber-200";

  const statusIndicator = isAvailable
    ? "bg-emerald-500"
    : isOccupied
    ? "bg-rose-500"
    : "bg-amber-500";

  return (
    <button
      onClick={onClick}
      className={`min-h-16 rounded-xl border p-2.5 text-center flex flex-col justify-between items-center transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer ${style}`}
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-[10px] font-black tracking-wide font-mono">{slot.id}</span>
        <span className={`h-1.5 w-1.5 rounded-full ${statusIndicator}`} />
      </div>
      
      {slot.plate ? (
        <LicensePlate plate={slot.plate} />
      ) : (
        <span className="text-[9px] font-bold uppercase opacity-65 tracking-wider mt-1.5">
          {getStatusLabel(slot.status)}
        </span>
      )}
    </button>
  );
}

function SlotModal({ slot, onClose, onReserve, onCancelReserve, onPayment }) {
  const isAvailable = slot.status === "available";
  const isReserved = slot.status === "reserved";
  const isOccupied = slot.status === "occupied";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-slate-900 p-6 text-white">
          <div>
            <h3 className="text-lg font-bold">Vị trí ô đỗ {slot.id}</h3>
            <p className="text-xs uppercase tracking-widest text-slate-400 mt-0.5">
              Phân loại: {getVehicleLabel(slot.type)}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/10 text-white transition-colors">
            ✕
          </button>
        </div>

        <div className="space-y-4 p-8">
          {isAvailable ? (
            <>
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-5 text-center text-emerald-800 flex flex-col items-center">
                <div className="text-3xl">✓</div>
                <h4 className="mt-2 text-sm font-bold uppercase tracking-wider">Khu vực khả dụng</h4>
              </div>
              <Info label="Trạng thái" value="Đang trống" />
              <Info label="Đơn giá tham chiếu" value="15.000đ / giờ" />
            </>
          ) : (
            <>
              <Info label="Trạng thái" value={getStatusLabel(slot.status)} />
              <Info label="Phương tiện" value={slot.plate ? <LicensePlate plate={slot.plate} /> : "Chưa đăng ký"} />
              <Info
                label="Thời điểm vào"
                value={isReserved ? "Đang đặt trước" : slot.startTime || "--"}
              />
              <Info label="Tạm tính" value={slot.fee || "0đ"} />
            </>
          )}
        </div>

        <div className="flex gap-3 bg-slate-50 p-6 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-250 py-3 font-semibold text-slate-600 hover:bg-white text-sm transition-colors"
          >
            Đóng
          </button>

          {isAvailable && (
            <button
              onClick={onReserve}
              className="flex-1 rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-slate-800 text-sm transition-colors"
            >
              Đặt chỗ
            </button>
          )}

          {isReserved && (
            <button
              onClick={onCancelReserve}
              className="flex-1 rounded-xl bg-amber-500 py-3 font-bold text-white hover:bg-amber-600 text-sm transition-colors"
            >
              Hủy đặt chỗ
            </button>
          )}

          {isOccupied && (
            <button
              onClick={onPayment}
              className="flex-1 rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-slate-800 text-sm transition-colors"
            >
              Thanh toán
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentModal({ slot, onClose, onDone }) {
  const now = new Date();
  const exitTime = now.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const amount = slot.fee || "0đ";
  const qrText = encodeURIComponent(
    `Thanh toán ô ${slot.id} - Biển số ${slot.plate || "N/A"} - Số tiền ${amount}`
  );
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${qrText}`;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
        <div className="bg-slate-900 p-6 text-white">
          <h3 className="text-lg font-bold">Thanh toán vé ô đỗ {slot.id}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Mã QR thanh toán trực tuyến qua ngân hàng liên kết
          </p>
        </div>

        <div className="space-y-4 p-8">
          <div className="flex justify-center mb-2">
            <img
              src={qrUrl}
              alt="QR thanh toán"
              className="h-48 w-48 rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm"
            />
          </div>

          <Info label="Phương tiện" value={slot.plate ? <LicensePlate plate={slot.plate} /> : "Chưa có"} />
          <Info label="Giờ vào bãi" value={slot.startTime || "--"} />
          <Info label="Giờ ra (Dự tính)" value={exitTime} />
          <Info label="Tổng chi phí" value={amount} />
        </div>

        <div className="flex gap-3 bg-slate-50 p-6 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-250 py-3 font-semibold text-slate-600 hover:bg-white text-sm transition-colors"
          >
            Hủy
          </button>

          <button
            onClick={onDone}
            className="flex-1 rounded-xl bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-700 text-sm transition-colors"
          >
            Hoàn tất gửi xe
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex justify-between items-center rounded-xl bg-slate-50 border border-slate-150 p-4 text-xs font-semibold">
      <span className="text-slate-550">{label}</span>
      <span className="text-slate-800">{value}</span>
    </div>
  );
}