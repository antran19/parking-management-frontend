// src/pages/driver/DriverMapping.jsx

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DriverSidebar from "../../components/DriverSidebar";
import CapacityBar from "../../components/CapacityBar";
import {
  getFloorAvailable,
  getFloorPercent,
  getParkingSummary,
  mapAreas,
  parkingFloors,
} from "../../data/parkingData";

export default function DriverMapping({ onLogout }) {
  const navigate = useNavigate();
  const [activeFloorId, setActiveFloorId] = useState(parkingFloors[0].id);
  const [selectedArea, setSelectedArea] = useState(null);

  const activeFloor =
    parkingFloors.find((floor) => floor.id === activeFloorId) || parkingFloors[0];

  const summary = useMemo(() => getParkingSummary(), []);
  const activeAvailable = getFloorAvailable(activeFloor);
  const activePercent = getFloorPercent(activeFloor);

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    if (onLogout) onLogout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <DriverSidebar active="map" onLogout={handleLogout} />

      <div className="ml-64 flex-1">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-white px-8">
          <div>
            <h2 className="text-2xl font-bold">Sơ đồ bãi xe</h2>
            <p className="text-sm text-slate-500">
              Driver xem số slot theo tầng, khu A/B/C/D chỉ là map của tầng
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-slate-100 font-bold text-slate-700">
            Q
          </div>
        </header>

        <main className="space-y-8 p-8">
          <section className="rounded-3xl bg-slate-900 p-8 text-white shadow-sm">
            <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-blue-300">
                  Driver Mapping
                </p>
                <h1 className="mt-2 text-3xl font-black">
                  Chọn tầng để xem tổng slot, slot đã chiếm và slot chưa chiếm
                </h1>
                <p className="mt-2 max-w-3xl text-slate-300">
                  Theo mô hình v2, driver không chọn từng slot nhỏ. Hệ thống chỉ
                  hiển thị capacity theo tầng và dùng A/B/C/D để định hướng mặt
                  bằng của tầng đang chọn.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <SummaryBox label="Tổng slot" value={summary.capacity} />
                <SummaryBox label="Đã chiếm" value={summary.occupied + summary.reserved} />
                <SummaryBox label="Chưa chiếm" value={summary.available} />
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {parkingFloors.map((floor) => {
              const available = getFloorAvailable(floor);
              const percent = getFloorPercent(floor);
              const used = floor.occupied + floor.reserved;
              const isActive = activeFloorId === floor.id;

              return (
                <button
                  key={floor.id}
                  type="button"
                  onClick={() => {
                    setActiveFloorId(floor.id);
                    setSelectedArea(null);
                  }}
                  className={`rounded-3xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-md ${
                    isActive
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-4xl">{floor.icon}</span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        isActive ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {floor.id}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-black">{floor.label}</h3>
                  <p className={`mt-1 text-sm ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                    {floor.vehicleLabel}
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    <MiniStat label="Tổng" value={floor.capacity} active={isActive} />
                    <MiniStat label="Chiếm" value={used} active={isActive} />
                    <MiniStat label="Trống" value={available} active={isActive} />
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex justify-between text-xs font-bold opacity-80">
                      <span>Tỷ lệ đã dùng</span>
                      <span>{percent}%</span>
                    </div>
                    <CapacityBar percent={percent} />
                  </div>
                </button>
              );
            })}
          </section>

          <section className="grid gap-6 xl:grid-cols-12">
            <div className="xl:col-span-4">
              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-5xl">{activeFloor.icon}</span>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
                      {activeFloor.label}
                    </p>
                    <h2 className="text-2xl font-black text-slate-950">
                      {activeFloor.title}
                    </h2>
                  </div>
                </div>

                <p className="mt-4 text-slate-500">{activeFloor.description}</p>

                <div className="mt-6 grid gap-4">
                  <FloorStat label="Tổng slot tầng" value={activeFloor.capacity} />
                  <FloorStat
                    label="Slot đã chiếm"
                    value={activeFloor.occupied + activeFloor.reserved}
                  />
                  <FloorStat label="Slot chưa chiếm" value={activeAvailable} />
                </div>

                <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                  <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Thanh năng lượng tầng</span>
                    <span>{activePercent}%</span>
                  </div>
                  <CapacityBar percent={activePercent} />
                  <p className="mt-3 text-xs text-slate-500">
                    Thanh này tính theo slot đã chiếm + slot đã đặt trước.
                  </p>
                </div>
              </div>
            </div>

            <div className="xl:col-span-8">
              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
                      Map tầng đang chọn
                    </p>
                    <h3 className="text-xl font-black text-slate-950">
                      Layout {activeFloor.label}: khu A / B / C / D
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/driver/reservation")}
                    className="rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-800"
                  >
                    Đặt chỗ tầng này
                  </button>
                </div>

                <div className="relative overflow-hidden rounded-3xl border-4 border-slate-200 bg-slate-100 p-5">
                  <div className="absolute left-1/2 top-0 h-full w-6 -translate-x-1/2 bg-slate-300" />
                  <div className="absolute left-0 top-1/2 h-6 w-full -translate-y-1/2 bg-slate-300" />

                  <div className="relative z-10 grid min-h-[520px] grid-cols-2 gap-8">
                    {mapAreas.map((area) => (
                      <MapArea
                        key={area.id}
                        area={area}
                        selected={selectedArea === area.id}
                        onClick={() => setSelectedArea(area.id)}
                      />
                    ))}
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-500">
                  A/B/C/D chỉ giúp driver biết khu vực trong tầng. Số slot không
                  chia theo khu ở màn Driver Mapping.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>

      {selectedArea && (
        <AreaModal
          floor={activeFloor}
          area={mapAreas.find((item) => item.id === selectedArea)}
          onClose={() => setSelectedArea(null)}
        />
      )}
    </div>
  );
}

function SummaryBox({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/10 px-5 py-4">
      <p className="text-xs font-bold uppercase text-slate-300">{label}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function MiniStat({ label, value, active }) {
  return (
    <div className={`rounded-2xl p-3 ${active ? "bg-white/10" : "bg-slate-50"}`}>
      <p className="text-[11px] font-bold uppercase opacity-70">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}

function FloorStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function MapArea({ area, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center rounded-3xl border-2 p-8 text-center transition hover:-translate-y-1 hover:shadow-lg ${
        selected
          ? "border-blue-500 bg-blue-100 text-blue-900"
          : "border-white bg-white text-slate-800 hover:border-blue-200 hover:bg-blue-50"
      }`}
    >
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-3xl text-4xl font-black ${
          selected ? "bg-blue-600 text-white" : "bg-slate-900 text-white"
        }`}
      >
        {area.id}
      </div>

      <h4 className="mt-5 text-2xl font-black">{area.name}</h4>
      <p className="mt-2 text-sm font-semibold text-slate-500">{area.position}</p>
      <p className="mt-4 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500">
        {area.note}
      </p>
    </button>
  );
}

function AreaModal({ floor, area, onClose }) {
  if (!area) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-slate-950 p-6 text-white">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-300">
              {floor.label} - {floor.vehicleLabel}
            </p>
            <h3 className="mt-1 text-2xl font-black">{area.name}</h3>
          </div>

          <button type="button" onClick={onClose} className="rounded-full px-3 py-2 text-xl hover:bg-white/10">
            ×
          </button>
        </div>

        <div className="space-y-5 p-6">
          <ModalInfo label="Tầng" value={floor.label} />
          <ModalInfo label="Loại xe phù hợp" value={floor.vehicleLabel} />
          <ModalInfo label="Vị trí khu" value={area.position} />
          <ModalInfo label="Ghi chú" value={area.note} />
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

function ModalInfo({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className="text-right font-black text-slate-950">{value}</span>
    </div>
  );
}
