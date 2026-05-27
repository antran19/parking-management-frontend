import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import CapacityBar from "../../../shared/components/CapacityBar";
import { VEHICLE_TYPES } from "../../../shared/data/smartParkingSeed";
import { getFloors, getFloorUsage } from "../../../shared/services/smartParkingStore";
import DriverShell from "../DriverShell";

const ZONE_INFO = {
  A: {
    title: "Khu A - Gần lối vào",
    subtitle: "Dễ tiếp cận, phù hợp tài xế cần gửi nhanh.",
    marker: "Cổng vào",
  },
  B: {
    title: "Khu B - Trung tâm tầng",
    subtitle: "Khu cân bằng, dễ di chuyển đến các lối phụ.",
    marker: "Trung tâm",
  },
  C: {
    title: "Khu C - Gần thang máy",
    subtitle: "Thuận tiện khi đi vào khu thương mại hoặc sảnh chính.",
    marker: "Thang máy",
  },
  D: {
    title: "Khu D - Gần lối ra",
    subtitle: "Phù hợp tài xế lấy xe thường xuyên.",
    marker: "Cổng ra",
  },
};

const STATUS_META = {
  AVAILABLE: {
    label: "Trống",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-400",
  },
  OCCUPIED: {
    label: "Có xe",
    className: "border-rose-200 bg-rose-50 text-rose-700",
    dot: "bg-rose-400",
  },
  RESERVED: {
    label: "Đã đặt",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-400",
  },
};

function buildLayoutSlots(floor, zone, usage) {
  const seed = `${floor?.id || "F"}-${zone}`
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const occupiedRatio = usage.capacity ? usage.occupied / usage.capacity : 0;
  const reservedRatio = usage.capacity ? usage.reserved / usage.capacity : 0;

  return Array.from({ length: 10 }, (_, index) => {
    const score = ((seed + index * 19) % 100) / 100;
    let status = "AVAILABLE";

    if (score < occupiedRatio) status = "OCCUPIED";
    else if (score < occupiedRatio + reservedRatio) status = "RESERVED";

    return {
      id: `${zone}-${String(index + 1).padStart(2, "0")}`,
      status,
    };
  });
}

export default function DriverMappingPage({ onLogout }) {
  const [selectedVehicleType, setSelectedVehicleType] = useState("ALL");
  const [selectedFloorId, setSelectedFloorId] = useState("");
  const [floors, setFloors] = useState([]);

  useEffect(() => {
    let mounted = true;
    getFloors().then((data) => {
      if (!mounted) return;
      setFloors(data);
      setSelectedFloorId((current) => current || data[0]?.id || "");
    });
    return () => { mounted = false; };
  }, []);

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

  const selectedFloor = filteredFloors.find((floor) => floor.id === selectedFloorId) || filteredFloors[0] || floors[0];
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
          <SummaryCard label="Tổng sức chứa" value={summary.capacity} />
          <SummaryCard label="Còn trống" value={summary.available} color="green" />
          <SummaryCard label="Đã đặt" value={summary.reserved} color="amber" />
          <SummaryCard label="Đã có xe" value={summary.occupied} color="red" />
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
                className="w-full rounded-2xl border-none bg-slate-100 px-4 py-3 font-bold text-slate-900 outline-none transition focus:ring-2 focus:ring-purple-200"
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
                  className={`min-w-230px rounded-3xl border p-4 text-left transition ${
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
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-500"}`}>
                      {floorUsage.used}%
                    </span>
                  </div>
                  <div className="mt-4">
                    <CapacityBar used={floorUsage.used} />
                  </div>
                  <p className={`mt-3 text-xs font-black uppercase tracking-[0.16em] ${active ? "text-white/50" : "text-slate-400"}`}>
                    Còn {floorUsage.available}/{floorUsage.capacity} slot
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-400">Tầng đang chọn</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">{selectedFloor?.name}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">{selectedFloor?.title}</p>
            </div>

            <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">
              A/B/C/D là khu định hướng
            </div>
          </div>

          <FloorOverviewCard floor={selectedFloor} summary={summary} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Sơ đồ khu vực</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">Tầng {selectedFloor?.id}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {selectedFloor?.vehicleGroup} · Cổng {selectedFloor?.gate}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                <LegendItem status="AVAILABLE" />
                <LegendItem status="OCCUPIED" />
                <LegendItem status="RESERVED" />
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 md:p-6">
              <MapGate label="Lối vào" active />

              <div className="grid min-h-520px gap-4 lg:grid-cols-2">
                {(selectedFloor?.zones || []).map((zone) => (
                  <ZoneBlueprint key={zone} floor={selectedFloor} zone={zone} summary={summary} />
                ))}
              </div>

              <MapGate label="Lối ra" />
            </div>
          </div>

          <FloorDetailPanel floor={selectedFloor} summary={summary} />
        </section>
      </div>
    </DriverShell>
  );
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl px-4 py-2.5 text-sm font-black ring-1 transition ${
        active
          ? "bg-slate-950 text-white ring-slate-950"
          : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 hover:text-slate-950"
      }`}
    >
      {children}
    </button>
  );
}

function SummaryCard({ label, value, color = "slate" }) {
  const classes = {
    slate: "border-slate-200 bg-white text-slate-950",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <div className={`rounded-[1.75rem] border p-5 shadow-sm ${classes[color]}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em]">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function FloorOverviewCard({ floor, summary }) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
      <div className="grid gap-5 xl:grid-cols-[1fr_320px] xl:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white">{floor?.id}</span>
            <span className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-600">
              {floor?.status}
            </span>
          </div>
          <h3 className="mt-4 text-2xl font-black text-slate-950">{floor?.vehicleGroup}</h3>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-500">{floor?.note}</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex justify-between text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            <span>Mức sử dụng tầng</span>
            <span>{summary.used}%</span>
          </div>
          <CapacityBar used={summary.used} />
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-black">
            <MiniStat label="Đã dùng" value={summary.occupied + summary.reserved} />
            <MiniStat label="Còn lại" value={summary.available} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 text-center ring-1 ring-slate-200">
      <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function MapGate({ label, active = false }) {
  return (
    <div className="my-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 first:mt-0 last:mb-0">
      <div className="h-2 rounded-full bg-slate-200" />
      <div
        className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.2em] ${
          active ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-600"
        }`}
      >
        {label}
      </div>
      <div className="h-2 rounded-full bg-slate-200" />
    </div>
  );
}

function ZoneBlueprint({ floor, zone, summary }) {
  const info = ZONE_INFO[zone];
  const slots = buildLayoutSlots(floor, zone, summary);

  return (
    <article className="relative overflow-hidden rounded-1.5rem border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="absolute right-5 top-4 text-7xl font-black leading-none text-slate-100">{zone}</div>

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white">
              Khu {zone}
            </span>
            <h3 className="mt-4 text-lg font-black text-slate-950">{info.title}</h3>
            <p className="mt-1 max-w-sm text-xs font-semibold leading-5 text-slate-500">{info.subtitle}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-slate-600">
            {info.marker}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-5 gap-2">
          {slots.map((slot) => (
            <div
              key={slot.id}
              className={`rounded-xl border px-2 py-3 text-center text-[11px] font-black ${STATUS_META[slot.status].className}`}
              title={`${slot.id} - ${STATUS_META[slot.status].label}`}
            >
              {slot.id}
            </div>
          ))}
        </div>

        <div className="mt-5 h-3 rounded-full bg-slate-100">
          <div className="h-full w-2/3 rounded-full bg-slate-950/80" />
        </div>
        <p className="mt-2 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Làn di chuyển nội bộ</p>
      </div>
    </article>
  );
}

function LegendItem({ status }) {
  const meta = STATUS_META[status];
  return (
    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
      <span className={`h-3 w-3 rounded-full ${meta.dot}`} />
      {meta.label}
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
          <p>3. Dùng A/B/C/D để định hướng khi vào tầng.</p>
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
      <span className="text-right text-sm font-black text-slate-800">{value}</span>
    </div>
  );
}
