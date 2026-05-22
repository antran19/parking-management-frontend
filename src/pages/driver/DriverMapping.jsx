// src/pages/driver/DriverMapping.jsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";


export default function DriverMapping() {
  const [floors, setFloors] = useState([]);
  const [activeFloorId, setActiveFloorId] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockFloors = [
      {
        id: 1,
        name: "Tầng 1",
        vehicleType: "Xe máy / Xe đạp",
        slots: [
          {
            id: "1",
            code: "M1",
            floorName: "Tầng 1",
            vehicleType: "Xe máy",
            status: "available",
            pricePerHour: 5000,
          },
          {
            id: "2",
            code: "M2",
            floorName: "Tầng 1",
            vehicleType: "Xe máy",
            status: "occupied",
            pricePerHour: 5000,
          },
          {
            id: "3",
            code: "M3",
            floorName: "Tầng 1",
            vehicleType: "Xe máy",
            status: "reserved",
            pricePerHour: 5000,
          },
          {
            id: "4",
            code: "M4",
            floorName: "Tầng 1",
            vehicleType: "Xe máy",
            status: "available",
            pricePerHour: 5000,
          },
          {
            id: "5",
            code: "B1",
            floorName: "Tầng 1",
            vehicleType: "Xe đạp",
            status: "available",
            pricePerHour: 2000,
          },
          {
            id: "6",
            code: "B2",
            floorName: "Tầng 1",
            vehicleType: "Xe đạp",
            status: "occupied",
            pricePerHour: 2000,
          },
        ],
      },

      {
        id: 2,
        name: "Tầng 2",
        vehicleType: "Xe điện",
        slots: [
          {
            id: "7",
            code: "E1",
            floorName: "Tầng 2",
            vehicleType: "Xe điện",
            status: "available",
            pricePerHour: 8000,
          },
          {
            id: "8",
            code: "E2",
            floorName: "Tầng 2",
            vehicleType: "Xe điện",
            status: "reserved",
            pricePerHour: 8000,
          },
          {
            id: "9",
            code: "E3",
            floorName: "Tầng 2",
            vehicleType: "Xe điện",
            status: "occupied",
            pricePerHour: 8000,
          },
          {
            id: "10",
            code: "E4",
            floorName: "Tầng 2",
            vehicleType: "Xe điện",
            status: "available",
            pricePerHour: 8000,
          },
        ],
      },

      {
        id: 3,
        name: "Tầng 3",
        vehicleType: "Xe hơi",
        slots: [
          {
            id: "11",
            code: "C1",
            floorName: "Tầng 3",
            vehicleType: "Xe hơi",
            status: "available",
            pricePerHour: 15000,
          },
          {
            id: "12",
            code: "C2",
            floorName: "Tầng 3",
            vehicleType: "Xe hơi",
            status: "occupied",
            pricePerHour: 15000,
          },
          {
            id: "13",
            code: "C3",
            floorName: "Tầng 3",
            vehicleType: "Xe hơi",
            status: "reserved",
            pricePerHour: 15000,
          },
          {
            id: "14",
            code: "C4",
            floorName: "Tầng 3",
            vehicleType: "Xe hơi",
            status: "available",
            pricePerHour: 15000,
          },
        ],
      },
    ];

    setFloors(mockFloors);
    setActiveFloorId(mockFloors[0].id);
    setLoading(false);
  }, []);

  function handleReserve(slotId) {
    setFloors((prevFloors) =>
      prevFloors.map((floor) => ({
        ...floor,
        slots: floor.slots.map((slot) =>
          slot.id === slotId
            ? { ...slot, status: "reserved" }
            : slot
        ),
      }))
    );

    setSelectedSlot(null);

    alert("Đặt chỗ thành công!");
  }

  const activeFloor = floors.find(
    (floor) => floor.id === activeFloorId
  );

  const availableCount =
    activeFloor?.slots.filter(
      (slot) => slot.status === "available"
    ).length ?? 0;

  const occupiedCount =
    activeFloor?.slots.filter(
      (slot) => slot.status === "occupied"
    ).length ?? 0;

  const reservedCount =
    activeFloor?.slots.filter(
      (slot) => slot.status === "reserved"
    ).length ?? 0;

  if (loading) {
    return (
      <div className="p-8 text-lg font-semibold">
        Đang tải sơ đồ bãi xe...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-20 flex h-full w-64 flex-col bg-slate-900 text-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold">
            Smart Park
          </h1>

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
          </nav>
        </div>

        <div className="mt-auto p-6">
          <button className="w-full rounded-lg border border-slate-700 px-4 py-3 text-slate-300 hover:bg-white/5">
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800">
            Sơ đồ bãi xe
          </h2>

          <p className="mt-2 text-slate-500">
            Chọn tầng và đặt vị trí phù hợp với
            phương tiện của bạn.
          </p>
        </div>

        {/* Floor Tabs */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex rounded-xl bg-slate-200 p-1">
            {floors.map((floor) => (
              <button
                key={floor.id}
                onClick={() =>
                  setActiveFloorId(floor.id)
                }
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

        {/* Map */}
        {activeFloor && (
          <section className="rounded-2xl border bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">
                  {activeFloor.name}
                </h3>

                <p className="text-slate-500">
                  {activeFloor.vehicleType}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
              {activeFloor.slots.map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  onClick={() =>
                    setSelectedSlot(slot)
                  }
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-2xl font-bold">
              Ô đỗ {selectedSlot.code}
            </h3>

            <p className="mb-4 text-slate-500">
              {selectedSlot.floorName} •{" "}
              {selectedSlot.vehicleType}
            </p>

            <div className="space-y-3 rounded-xl bg-slate-50 p-4">
              <InfoRow
                label="Trạng thái"
                value={getStatusText(
                  selectedSlot.status
                )}
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
                onClick={() =>
                  setSelectedSlot(null)
                }
                className="flex-1 rounded-lg border py-3 font-semibold"
              >
                Hủy
              </button>

              {selectedSlot.status ===
                "available" && (
                <button
                  onClick={() =>
                    handleReserve(selectedSlot.id)
                  }
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
      <div className="text-lg font-bold">
        {slot.code}
      </div>

      <div className="mt-1 text-xs font-semibold">
        {getStatusText(slot.status)}
      </div>
    </button>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">
        {label}
      </span>

      <span className="font-bold">
        {value}
      </span>
    </div>
  );
}

function getStatusText(status) {
  if (status === "available") return "Trống";

  if (status === "reserved") return "Đã đặt";

  return "Có xe";
}