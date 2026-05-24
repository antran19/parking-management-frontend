import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DriverSidebar from "../../components/DriverSidebar";
import { getDriverParkingMap } from "../../api/driverMappingApi";

export default function DriverMapping({ onLogout }) {
  const navigate = useNavigate();

  const [parkingFloors, setParkingFloors] = useState([]);
  const [activeFloorId, setActiveFloorId] = useState("");
  const [selectedArea, setSelectedArea] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    const loadParkingMap = async () => {
      try {
        setLoading(true);
        setApiError("");

        const result = await getDriverParkingMap();

        const floors = Array.isArray(result?.floors) ? result.floors : [];

        setParkingFloors(floors);
        setDriverInfo(result?.driver || null);

        if (floors.length > 0) {
          setActiveFloorId(result?.defaultFloorId || floors[0].id);
        }
      } catch (error) {
        console.error("Driver parking map API error:", error);
        setApiError("Không thể tải dữ liệu sơ đồ bãi xe từ hệ thống.");
        setParkingFloors([]);
      } finally {
        setLoading(false);
      }
    };

    loadParkingMap();
  }, []);

  const activeFloor =
    parkingFloors.find((floor) => floor.id === activeFloorId) ||
    parkingFloors[0];

  const allSummary = useMemo(() => {
    const total = parkingFloors.reduce(
      (sum, floor) => sum + Number(floor.total || 0),
      0
    );

    const occupied = parkingFloors.reduce(
      (sum, floor) => sum + Number(floor.occupied || 0),
      0
    );

    return {
      total,
      occupied,
      available: total - occupied,
    };
  }, [parkingFloors]);

  const available = activeFloor
    ? Number(activeFloor.total || 0) - Number(activeFloor.occupied || 0)
    : 0;

  const percent =
    activeFloor && Number(activeFloor.total || 0) > 0
      ? Math.round(
          (Number(activeFloor.occupied || 0) /
            Number(activeFloor.total || 0)) *
            100
        )
      : 0;

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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-800">
        <DriverSidebar active="map" onLogout={handleLogout} />

        <div className="ml-64 flex-1">
          <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-white px-8">
            <h2 className="text-2xl font-bold">Sơ đồ bãi xe</h2>
          </header>

          <main className="p-8">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              Đang tải sơ đồ bãi xe...
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-800">
        <DriverSidebar active="map" onLogout={handleLogout} />

        <div className="ml-64 flex-1">
          <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-white px-8">
            <h2 className="text-2xl font-bold">Sơ đồ bãi xe</h2>
          </header>

          <main className="p-8">
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
              <p className="font-bold">Lỗi tải dữ liệu</p>
              <p className="mt-1 text-sm">{apiError}</p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
              >
                Tải lại
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!activeFloor) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-800">
        <DriverSidebar active="map" onLogout={handleLogout} />

        <div className="ml-64 flex-1">
          <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-white px-8">
            <h2 className="text-2xl font-bold">Sơ đồ bãi xe</h2>
          </header>

          <main className="p-8">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              Không có dữ liệu sơ đồ bãi xe.
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <DriverSidebar active="map" onLogout={handleLogout} />

      <div className="ml-64 flex-1">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-white px-8">
          <h2 className="text-2xl font-bold">Sơ đồ bãi xe</h2>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold">
                {driverInfo?.name || "Tài xế"}
              </p>
              <p className="text-xs text-slate-500">
                {driverInfo?.membership || "Thành viên"}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-slate-100 font-bold text-slate-700">
              D
            </div>
          </div>
        </header>

        <main className="space-y-8 p-8">
          <section className="rounded-3xl bg-slate-900 p-8 text-white shadow-sm">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-blue-300">
                  Bản đồ tổng quan
                </p>

                <h1 className="mt-2 text-3xl font-black">
                  Smart Park - Sơ đồ 5 tầng hầm
                </h1>

                <p className="mt-2 max-w-2xl text-slate-300">
                  Driver chỉ xem được số lượng chỗ còn trống và đã chiếm theo
                  từng tầng. Khu A/B/C/D chỉ dùng để hiển thị sơ đồ vị trí trong
                  tầng, không quản lý số lượng riêng.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <SummaryBox label="Tổng chỗ" value={allSummary.total} />
                <SummaryBox label="Đã chiếm" value={allSummary.occupied} />
                <SummaryBox label="Còn trống" value={allSummary.available} />
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-5">
            {parkingFloors.map((floor) => {
              const floorAvailable =
                Number(floor.total || 0) - Number(floor.occupied || 0);

              return (
                <button
                  key={floor.id}
                  type="button"
                  onClick={() => {
                    setActiveFloorId(floor.id);
                    setSelectedArea(null);
                  }}
                  className={`rounded-2xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-md ${
                    activeFloorId === floor.id
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{floor.icon}</span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        activeFloorId === floor.id
                          ? "bg-white/15 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {floor.id}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-black">{floor.label}</h3>

                  <p
                    className={`mt-1 text-sm ${
                      activeFloorId === floor.id
                        ? "text-slate-300"
                        : "text-slate-500"
                    }`}
                  >
                    {floor.vehicleLabel}
                  </p>

                  <p
                    className={`mt-3 text-xs font-semibold ${
                      activeFloorId === floor.id
                        ? "text-green-300"
                        : "text-green-600"
                    }`}
                  >
                    Còn trống: {floorAvailable}/{floor.total}
                  </p>
                </button>
              );
            })}
          </section>

          <section className="grid gap-6 xl:grid-cols-12">
            <div className="xl:col-span-4">
              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{activeFloor.icon}</span>

                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
                      {activeFloor.label}
                    </p>

                    <h2 className="text-2xl font-black text-slate-950">
                      {activeFloor.title}
                    </h2>
                  </div>
                </div>

                <p className="mt-4 text-slate-500">
                  {activeFloor.description}
                </p>

                <div className="mt-6 grid gap-4">
                  <FloorStat label="Tổng slot" value={activeFloor.total} />
                  <FloorStat label="Đã chiếm" value={activeFloor.occupied} />
                  <FloorStat label="Còn trống" value={available} />
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Tỷ lệ sử dụng</span>
                    <span>{percent}%</span>
                  </div>

                  <div className="h-4 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        percent >= 80
                          ? "bg-red-500"
                          : percent >= 50
                          ? "bg-amber-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="xl:col-span-8">
              <div className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
                      Sơ đồ mặt bằng
                    </p>

                    <h3 className="text-xl font-black text-slate-950">
                      Layout {activeFloor.label}
                    </h3>
                  </div>

                  <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600">
                    Khu A / B / C / D
                  </span>
                </div>

                <div className="relative overflow-hidden rounded-3xl border-4 border-slate-200 bg-slate-100 p-5">
                  <div className="absolute left-1/2 top-0 h-full w-6 -translate-x-1/2 bg-slate-300" />
                  <div className="absolute left-0 top-1/2 h-6 w-full -translate-y-1/2 bg-slate-300" />

                  <div className="relative z-10 grid min-h-520px grid-cols-2 gap-8">
                    <MapArea
                      area="A"
                      title="Khu A"
                      position="Trái trên"
                      selected={selectedArea === "A"}
                      onClick={() => setSelectedArea("A")}
                    />

                    <MapArea
                      area="B"
                      title="Khu B"
                      position="Phải trên"
                      selected={selectedArea === "B"}
                      onClick={() => setSelectedArea("B")}
                    />

                    <MapArea
                      area="C"
                      title="Khu C"
                      position="Trái dưới"
                      selected={selectedArea === "C"}
                      onClick={() => setSelectedArea("C")}
                    />

                    <MapArea
                      area="D"
                      title="Khu D"
                      position="Phải dưới"
                      selected={selectedArea === "D"}
                      onClick={() => setSelectedArea("D")}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {selectedArea && (
        <AreaModal
          floor={activeFloor}
          area={selectedArea}
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

function FloorStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function MapArea({ area, title, position, selected, onClick }) {
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
        {area}
      </div>

      <h4 className="mt-5 text-2xl font-black">{title}</h4>

      <p className="mt-2 text-sm font-semibold text-slate-500">{position}</p>

      <p className="mt-4 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500">
        Khu định hướng
      </p>
    </button>
  );
}

function AreaModal({ floor, area, onClose }) {
  const available = Number(floor.total || 0) - Number(floor.occupied || 0);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-slate-950 p-6 text-white">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-300">
              {floor.label} - {floor.vehicleLabel}
            </p>

            <h3 className="mt-1 text-2xl font-black">Khu {area}</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-2 text-xl hover:bg-white/10"
          >
            ×
          </button>
        </div>

        <div className="space-y-5 p-6">
          <ModalInfo label="Loại xe" value={floor.vehicleLabel} />
          <ModalInfo label="Tổng slot tầng này" value={`${floor.total} chỗ`} />
          <ModalInfo label="Đã chiếm" value={`${floor.occupied} chỗ`} />
          <ModalInfo label="Còn trống" value={`${available} chỗ`} />
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
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className="font-black text-slate-950">{value}</span>
    </div>
  );
}