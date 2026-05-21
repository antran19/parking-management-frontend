import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getDriverParkingMap,
  reserveDriverSlot,
} from "../../api/driverMappingApi";

export default function DriverMapping() {
  const [floors, setFloors] = useState([]);
  const [activeFloorId, setActiveFloorId] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchParkingMap = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getDriverParkingMap();

      setFloors(data);

      if (data.length > 0) {
        setActiveFloorId(data[0].id);
      }
    } catch {
      setError("Không tải được sơ đồ bãi xe từ backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParkingMap();
  }, []);

  async function handleReserve(slotId) {
    try {
      await reserveDriverSlot(slotId);
      setSelectedSlot(null);
      alert("Đặt chỗ thành công!");
      fetchParkingMap();
    } catch {
      alert("Đặt chỗ thất bại. Kiểm tra lại API backend.");
    }
  }

  const activeFloor = floors.find((floor) => floor.id === activeFloorId);

  const availableCount =
    activeFloor?.slots.filter((slot) => slot.status === "available").length ?? 0;

  const occupiedCount =
    activeFloor?.slots.filter((slot) => slot.status === "occupied").length ?? 0;

  const reservedCount =
    activeFloor?.slots.filter((slot) => slot.status === "reserved").length ?? 0;

  if (loading) {
    return (
      <div className="p-8 text-lg font-semibold">
        Đang tải sơ đồ bãi xe...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-lg font-semibold text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 z-20 flex h-full w-64 flex-col bg-slate-900 text-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Smart Park</h1>

          <p className="mb-8 text-xs tracking-widest text-slate-400">
            DRIVER PORTAL
          </p>

          <nav className="space-y-2">
            <Link
              to="/driver/dashboard"
              className="block rounded-lg px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              Dashboard
            </Link>

            <Link
              to="/driver/map"
              className="block rounded-lg border-l-4 border-blue-600 bg-white/10 px-4 py-3 font-semibold text-white"
            >
              Parking Map
            </Link>

            <a
              href="#"
              className="block rounded-lg px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              Current Session
            </a>

            <a
              href="#"
              className="block rounded-lg px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              Booking History
            </a>

            <a
              href="#"
              className="block rounded-lg px-4 py-3 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              Profile
            </a>
          </nav>
        </div>

        <div className="mt-auto p-6">
          <button className="w-full rounded-lg border border-slate-700 px-4 py-3 text-slate-300 hover:bg-white/5">
            Logout
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800">Sơ đồ bãi xe</h2>

          <p className="mt-2 text-slate-500">
            Chọn tầng và đặt vị trí phù hợp với phương tiện của bạn.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex rounded-xl bg-slate-200 p-1">
            {floors.map((floor) => (
              <button
                key={floor.id}
                onClick={() => setActiveFloorId(floor.id)}
                className={`rounded-lg px-5 py-2 font-semibold transition-all ${
                  activeFloorId === floor.id
                    ? "bg-white text-blue-600 shadow"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {floor.name}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700">
              Trống: {availableCount}
            </div>

            <div className="rounded-full bg-red-100 px-4 py-2 text-sm font-bold text-red-700">
              Có xe: {occupiedCount}
            </div>

            <div className="rounded-full bg-yellow-100 px-4 py-2 text-sm font-bold text-yellow-700">
              Đã đặt: {reservedCount}
            </div>
          </div>
        </div>

        {activeFloor && (
          <section className="rounded-2xl border bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{activeFloor.name}</h3>
                <p className="text-slate-500">{activeFloor.vehicleType}</p>
              </div>

              <div className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                🚪 GATE-A vào / GATE-B ra
              </div>
            </div>

            <div className="mb-6 text-sm font-bold text-slate-500">
              🚪 GATE-A (Vào)
            </div>

            <div className="grid grid-cols-6 gap-4">
              {activeFloor.slots.slice(0, 6).map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  onClick={() => setSelectedSlot(slot)}
                />
              ))}
            </div>

            <div className="my-8 border-t-2 border-dashed border-slate-300 text-center">
              <span className="-mt-3 inline-block bg-white px-4 text-sm font-bold text-slate-500">
                LỐI ĐI XE
              </span>
            </div>

            <div className="grid grid-cols-6 gap-4">
              {activeFloor.slots.slice(6, 12).map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  onClick={() => setSelectedSlot(slot)}
                />
              ))}
            </div>

            <div className="mt-6 text-sm font-bold text-slate-500">
              🚪 GATE-B (Ra)
            </div>
          </section>
        )}
      </main>

      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-2xl font-bold">
              Ô đỗ {selectedSlot.code}
            </h3>

            <p className="mb-4 text-slate-500">
              {selectedSlot.floorName} • {selectedSlot.vehicleType}
            </p>

            <div className="space-y-3 rounded-xl bg-slate-50 p-4">
              <InfoRow
                label="Trạng thái"
                value={getStatusText(selectedSlot.status)}
              />

              <InfoRow
                label="Đơn giá"
                value={`${selectedSlot.pricePerHour.toLocaleString(
                  "vi-VN"
                )}đ / giờ`}
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSelectedSlot(null)}
                className="flex-1 rounded-lg border py-3 font-semibold"
              >
                Hủy
              </button>

              {selectedSlot.status === "available" && (
                <button
                  onClick={() => handleReserve(selectedSlot.id)}
                  className="flex-1 rounded-lg bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800"
                >
                  Đặt chỗ
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SlotCard({ slot, onClick }) {
  const color =
    slot.status === "available"
      ? "bg-green-100 border-green-300 text-green-700"
      : slot.status === "reserved"
      ? "bg-yellow-100 border-yellow-300 text-yellow-700"
      : "bg-red-100 border-red-300 text-red-700";

  return (
    <button
      onClick={onClick}
      className={`min-h-20 rounded-xl border p-3 text-center transition-all hover:scale-105 ${color}`}
    >
      <div className="text-lg font-bold">{slot.code}</div>

      <div className="mt-1 text-xs font-semibold">
        {getStatusText(slot.status)}
      </div>
    </button>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function getStatusText(status) {
  if (status === "available") return "Trống";
  if (status === "reserved") return "Đã đặt";
  return "Có xe";
}