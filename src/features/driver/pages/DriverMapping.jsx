import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import CapacityBar from "../../../shared/components/CapacityBar";
import { VEHICLE_TYPES } from "../../../shared/data/smartParkingSeed";
import { getFloors, getFloorUsage } from "../../../shared/services/smartParkingStore";
import DriverShell from "../DriverShell";
import DriverParkingMap3D from "../components/DriverParkingMap3D";

const ZONE_INFO = {
  A: {
    title: "Khu A - Gần lối vào",
    subtitle: "Dễ tiếp cận, phù hợp tài xế cần gửi nhanh.",
  },
  B: {
    title: "Khu B - Trung tâm tầng",
    subtitle: "Dễ xoay đầu xe, giao thông cân bằng ở giữa tầng.",
  },
  C: {
    title: "Khu C - Gần lõi thang máy",
    subtitle: "Thuận tiện cho khách đi lên sảnh và khu thương mại.",
  },
  D: {
    title: "Khu D - Gần cổng ra",
    subtitle: "Phù hợp khi cần ra vào nhanh trong khung giờ cao điểm.",
  },
};

export default function DriverMapping({ onLogout }) {
  const [selectedVehicleType, setSelectedVehicleType] = useState("ALL");
  const [selectedFloorId, setSelectedFloorId] = useState("B1");
  const [viewMode, setViewMode] = useState("3D");
  const floors = getFloors();

  const filteredFloors = useMemo(() => {
    if (selectedVehicleType === "ALL") return floors;
    const vehicleType = VEHICLE_TYPES.find((item) => item.id === selectedVehicleType);
    return floors.filter((floor) => vehicleType?.floorIds.includes(floor.id));
  }, [floors, selectedVehicleType]);

  useEffect(() => {
    if (!filteredFloors.some((floor) => floor.id === selectedFloorId)) {
      setSelectedFloorId(filteredFloors[0]?.id || floors[0]?.id || "");
    }
  }, [filteredFloors, floors, selectedFloorId]);

  const selectedFloor =
    filteredFloors.find((floor) => floor.id === selectedFloorId) ||
    filteredFloors[0] ||
    floors[0];

  const summary = selectedFloor
    ? getFloorUsage(selectedFloor)
    : { capacity: 0, occupied: 0, reserved: 0, available: 0, used: 0 };

  return (
    <DriverShell
      title="Sơ đồ bãi xe"
      subtitle="Xem sức chứa theo tầng, A/B/C/D chỉ là sơ đồ khu vực trong tầng"
      onLogout={onLogout}
      actions={
        <Link
          to="/driver/reservation"
          className="hidden rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 md:block"
        >
          Đặt chỗ ngay
        </Link>
      }
    >
      <div className="space-y-6 text-slate-900">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Tầng đang xem" value={selectedFloor?.name || "-"} />
          <SummaryCard label="Còn trống" value={`${summary.available}/${summary.capacity}`} color="green" />
          <SummaryCard label="Tỷ lệ sử dụng" value={`${summary.used}%`} color="blue" />
          <SummaryCard label="Trạng thái" value={selectedFloor?.status || "-"} color="amber" />
        </section>

        <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="w-full xl:max-w-md">
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Chọn tầng
              </label>
              <select
                value={selectedFloorId}
                onChange={(event) => setSelectedFloorId(event.target.value)}
                className="w-full rounded-2xl border-none bg-slate-100 px-4 py-3 font-bold text-slate-900 outline-none transition focus:ring-2 focus:ring-sky-200"
              >
                {filteredFloors.map((floor) => (
                  <option key={floor.id} value={floor.id}>
                    {floor.name} - {floor.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              <FilterButton active={selectedVehicleType === "ALL"} onClick={() => setSelectedVehicleType("ALL")}>
                Tất cả
              </FilterButton>
              {VEHICLE_TYPES.map((type) => (
                <FilterButton
                  key={type.id}
                  active={selectedVehicleType === type.id}
                  onClick={() => setSelectedVehicleType(type.id)}
                >
                  <span className="mr-1">{type.icon}</span>
                  {type.label}
                </FilterButton>
              ))}
            </div>
          </div>

          <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
            {filteredFloors.map((floor) => {
              const floorUsage = getFloorUsage(floor);
              const active = selectedFloor?.id === floor.id;
              return (
                <button
                  key={floor.id}
                  onClick={() => setSelectedFloorId(floor.id)}
                  className={`min-w-[230px] rounded-3xl border p-4 text-left transition ${
                    active
                      ? "border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-200"
                      : "border-slate-200 bg-white text-slate-950 shadow-sm hover:border-slate-400 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-2xl font-black">{floor.id}</p>
                      <p className={`mt-1 text-sm font-bold ${active ? "text-white/70" : "text-slate-500"}`}>
                        {floor.title}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {floorUsage.used}%
                    </span>
                  </div>
                  <div className="mt-4">
                    <CapacityBar used={floorUsage.used} />
                  </div>
                  <p
                    className={`mt-3 text-xs font-black uppercase tracking-[0.16em] ${
                      active ? "text-white/50" : "text-slate-400"
                    }`}
                  >
                    Còn {floorUsage.available}/{floorUsage.capacity} slot
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Bản đồ bãi xe</p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">Tầng {selectedFloor?.id}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {selectedFloor?.vehicleGroup} · Cổng {selectedFloor?.gate}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
                    <button
                      type="button"
                      onClick={() => setViewMode("3D")}
                      className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                        viewMode === "3D"
                          ? "bg-slate-950 text-white"
                          : "text-slate-500 hover:text-slate-950"
                      }`}
                    >
                      3D thật
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("2D")}
                      className={`rounded-xl px-4 py-2 text-xs font-black transition ${
                        viewMode === "2D"
                          ? "bg-slate-950 text-white"
                          : "text-slate-500 hover:text-slate-950"
                      }`}
                    >
                      Tổng quan 2D
                    </button>
                  </div>

                  <Link
                    to="/driver/reservation"
                    className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                  >
                    Đặt chỗ ngay
                  </Link>
                </div>
              </div>

              {viewMode === "3D" ? (
                <DriverParkingMap3D floor={selectedFloor} summary={summary} />
              ) : (
                <FloorMap2D floor={selectedFloor} summary={summary} />
              )}
            </section>
          </div>

          <FloorDetailPanel floor={selectedFloor} summary={summary} />
        </section>
      </div>
    </DriverShell>
  );
}

function SummaryCard({ label, value, color = "slate" }) {
  const colorMap = {
    slate: "border-slate-200 bg-white text-slate-950",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    blue: "border-sky-200 bg-sky-50 text-sky-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
  };

  return (
    <div className={`rounded-[1.6rem] border p-5 shadow-sm ${colorMap[color] || colorMap.slate}`}>
      <p className="text-xs font-black uppercase tracking-[0.2em] opacity-65">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
        active
          ? "bg-slate-950 text-white shadow-lg shadow-slate-200"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function FloorMap2D({ floor, summary }) {
  const zones = floor?.zones || ["A", "B", "C", "D"];
  const perZone = Math.max(Math.round(summary.available / zones.length), 0);
  const zoneCards = zones.map((zone) => ({
    zone,
    title: ZONE_INFO[zone]?.title || `Khu ${zone}`,
    subtitle: ZONE_INFO[zone]?.subtitle || "Khu định hướng trong tầng",
    free: perZone,
  }));

  return (
    <div className="rounded-[1.9rem] border border-slate-200 bg-slate-50 p-5 shadow-inner">
      <div className="grid gap-4 md:grid-cols-2">
        {zoneCards.map((item) => (
          <div key={item.zone} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Khu {item.zone}</p>
                <h3 className="mt-2 text-lg font-black text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{item.subtitle}</p>
              </div>
              <div className="rounded-2xl bg-slate-950 px-3 py-2 text-center text-white shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/60">Trống</p>
                <p className="text-2xl font-black">{item.free}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }, (_, index) => (
                <div
                  key={`${item.zone}-${index}`}
                  className={`h-12 rounded-xl border border-slate-200 ${
                    index < item.free ? "bg-emerald-100" : index % 3 === 0 ? "bg-amber-100" : "bg-rose-100"
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FloorDetailPanel({ floor, summary }) {
  return (
    <aside className="space-y-5">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Thông tin tầng</p>
        <h3 className="mt-2 text-2xl font-black text-slate-950">{floor?.name}</h3>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{floor?.note}</p>

        <div className="mt-5 space-y-3">
          <InfoRow label="Nhóm xe" value={floor?.vehicleGroup} />
          <InfoRow label="Cổng tầng" value={floor?.gate} />
          <InfoRow label="Khu vực" value="A, B, C, D" />
          <InfoRow label="Tổng slot" value={summary.capacity} />
          <InfoRow label="Còn trống" value={summary.available} />
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Hướng dẫn tài xế</p>
        <div className="mt-4 space-y-4 text-sm font-semibold leading-6 text-slate-500">
          <p>1. Chọn loại xe để lọc tầng phù hợp.</p>
          <p>2. Xem số slot ở cấp tầng trước khi đặt chỗ.</p>
          <p>3. Bản 3D có thể xoay, zoom để quan sát cổng và các khu.</p>
        </div>
        <Link
          to="/driver/reservation"
          className="mt-5 block rounded-2xl bg-slate-950 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-slate-800"
        >
          Đặt chỗ ngay
        </Link>
      </div>
    </aside>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</span>
      <span className="text-right text-sm font-black text-slate-900">{value}</span>
    </div>
  );
}
