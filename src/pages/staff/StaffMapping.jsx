import { useMemo, useState } from "react";
import { Link } from "react-router-dom";


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

  const [allSlots, setAllSlots] = useState(() =>
    Object.values(floorData)
      .flat()
      .flatMap((group) => group.zones)
      .flatMap((zone) => createMockSlots(zone))
  );

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
          <button className="rounded-full p-2 hover:bg-slate-100">🔔</button>
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
            <SideLink collapsed={collapsed} to="/staff/dashboard" icon="📊" label="Bảng điều khiển" />
            <SideLink collapsed={collapsed} to="/staff/map" icon="🅿️" label="Sơ đồ bãi xe" active />
            <SideLink collapsed={collapsed} to="/staff/check-in" icon="🚗" label="Check-in" />
            <SideLink collapsed={collapsed} to="/staff/check-out" icon="💳" label="Check-out" />
            <SideLink collapsed={collapsed} to="/staff/history" icon="📋" label="Lịch sử phiên gửi" />
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

      <main
        className={`min-h-screen pt-24 transition-all ${
          collapsed ? "pl-24" : "pl-80"
        } px-8 pb-12`}
      >
        <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex rounded-2xl bg-slate-200 p-1">
            <FloorButton active={activeFloor === 1} onClick={() => setActiveFloor(1)} icon="🚲" label="Tầng 1" />
            <FloorButton active={activeFloor === 2} onClick={() => setActiveFloor(2)} icon="🏍️" label="Tầng 2" />
            <FloorButton active={activeFloor === 3} onClick={() => setActiveFloor(3)} icon="🚗" label="Tầng 3" />
          </div>

          <div className="flex flex-wrap gap-4">
            <Badge color="green" label={`Trống: ${counts.available}`} />
            <Badge color="red" label={`Có xe: ${counts.occupied}`} />
            <Badge color="amber" label={`Đã đặt: ${counts.reserved}`} />
          </div>
        </div>

        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm ô đỗ hoặc biển số xe..."
            className="flex-1 rounded-xl border-none bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-200"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border-none bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-200"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="available">Trống</option>
            <option value="occupied">Có xe</option>
            <option value="reserved">Đã đặt</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border-none bg-slate-100 px-4 py-3 outline-none focus:ring-2 focus:ring-purple-200"
          >
            <option value="all">Tất cả loại xe</option>
            <option value="bicycle">Xe đạp</option>
            <option value="ebike">Xe đạp điện</option>
            <option value="motorbike">Xe máy</option>
            <option value="car">Ô tô</option>
          </select>
        </div>

        <div className="space-y-12">
          {groups.map((group) => (
            <section key={group.category} className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{group.icon}</span>
                <h2 className="text-xl font-black uppercase text-slate-950">
                  {group.category}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-10 xl:grid-cols-2">
                {group.zones.map((zone) => {
                  const zoneSlots = allSlots
                    .filter((slot) => slot.id.startsWith(zone.prefix))
                    .filter(filterSlot);

                  return (
                    <div key={zone.prefix} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                          {zone.section} ({zoneSlots.length}/{zone.slots} ô)
                        </h3>
                        <div className="h-px flex-1 bg-slate-200" />
                      </div>

                      <div
                        className={`grid gap-2 ${
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
      </main>

      {selectedSlot && (
        <SlotModal
          slot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onReserve={() => handleReserveSlot(selectedSlot.id)}
          onCancelReserve={() => handleCancelReserveSlot(selectedSlot.id)}
          onPayment={() => setPaymentSlot(selectedSlot)}
        />
      )}

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

function FloorButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-6 py-3 font-semibold transition ${
        active
          ? "bg-white text-slate-950 shadow-sm"
          : "text-slate-500 hover:bg-white/50"
      }`}
    >
      <span>{icon}</span>
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
    <div className={`rounded-full border px-4 py-2 text-xs font-black uppercase ${classes[color]}`}>
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
        <div className="mt-1 text-[10px] font-black">{slot.plate}</div>
      )}
    </button>
  );
}

function SlotModal({ slot, onClose, onReserve, onCancelReserve, onPayment }) {
  const isAvailable = slot.status === "available";
  const isReserved = slot.status === "reserved";
  const isOccupied = slot.status === "occupied";

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
          <button onClick={onClose} className="rounded-full p-2 hover:bg-white/10">
            ✕
          </button>
        </div>

        <div className="space-y-5 p-8">
          {isAvailable ? (
            <>
              <div className="rounded-2xl bg-green-50 p-5 text-center text-green-700">
                <div className="text-4xl">✅</div>
                <h4 className="mt-2 text-lg font-bold">Vị trí đang trống</h4>
              </div>
              <Info label="Trạng thái" value="Trống" />
              <Info label="Đơn giá" value="15.000đ / giờ" />
            </>
          ) : (
            <>
              <Info label="Trạng thái" value={getStatusLabel(slot.status)} />
              <Info label="Biển số xe" value={slot.plate || "Chưa có biển số"} />
              <Info
                label="Giờ vào"
                value={isReserved ? "Chưa vào bãi" : slot.startTime || "--"}
              />
              <Info label="Phí hiện tại" value={slot.fee || "0đ"} />
            </>
          )}
        </div>

        <div className="flex gap-3 bg-slate-50 p-6">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-300 py-3 font-bold text-slate-600 hover:bg-white"
          >
            Hủy bỏ
          </button>

          {isAvailable && (
            <button
              onClick={onReserve}
              className="flex-1 rounded-xl bg-slate-950 py-3 font-bold text-white hover:bg-slate-800"
            >
              Đặt chỗ
            </button>
          )}

          {isReserved && (
            <button
              onClick={onCancelReserve}
              className="flex-1 rounded-xl bg-amber-500 py-3 font-bold text-white hover:bg-amber-600"
            >
              Hủy đặt chỗ
            </button>
          )}

          {isOccupied && (
            <button
              onClick={onPayment}
              className="flex-1 rounded-xl bg-slate-950 py-3 font-bold text-white hover:bg-slate-800"
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
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="bg-slate-950 p-6 text-white">
          <h3 className="text-xl font-bold">Thanh toán ô {slot.id}</h3>
          <p className="text-sm text-slate-300">
            Quét mã QR để hoàn tất thanh toán
          </p>
        </div>

        <div className="space-y-5 p-8">
          <div className="flex justify-center">
            <img
              src={qrUrl}
              alt="QR thanh toán"
              className="h-56 w-56 rounded-2xl border border-slate-200 bg-white p-3"
            />
          </div>

          <Info label="Biển số xe" value={slot.plate || "Chưa có biển số"} />
          <Info label="Giờ vào" value={slot.startTime || "--"} />
          <Info label="Giờ ra" value={exitTime} />
          <Info label="Số tiền" value={amount} />
        </div>

        <div className="flex gap-3 bg-slate-50 p-6">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-300 py-3 font-bold text-slate-600 hover:bg-white"
          >
            Đóng
          </button>

          <button
            onClick={onDone}
            className="flex-1 rounded-xl bg-green-600 py-3 font-bold text-white hover:bg-green-700"
          >
            Hoàn tất thanh toán
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