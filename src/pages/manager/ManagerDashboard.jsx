// src/pages/manager/ManagerDashboard.jsx

import { useNavigate } from "react-router-dom";
import CapacityBar from "../../components/CapacityBar";
import { getFloorAvailable, getFloorPercent, getParkingSummary, parkingFloors } from "../../data/parkingData";
import { formatCurrency } from "../../services/smartParkingStorage";

export default function ManagerDashboard({ onLogout }) {
  const navigate = useNavigate();
  const summary = getParkingSummary();

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    if (onLogout) onLogout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8 text-slate-900">
      <div className="mb-8 flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-3xl font-black">Manager Dashboard</h1>
          <p className="mt-1 text-slate-500">
            Tổng quan vận hành, doanh thu và capacity theo tầng
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl bg-red-50 px-5 py-3 font-bold text-red-600 hover:bg-red-100"
        >
          Đăng xuất
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <StatCard title="Tổng xe trong bãi" value={summary.occupied + summary.reserved} />
        <StatCard title="Slot còn trống" value={summary.available} />
        <StatCard title="Doanh thu hôm nay" value={formatCurrency(8500000)} />
        <StatCard title="Tỷ lệ lấp đầy" value={`${Math.round(((summary.occupied + summary.reserved) / summary.capacity) * 100)}%`} />
      </div>

      <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-black">Zone capacity theo tầng</h2>
        <p className="mt-1 text-sm text-slate-500">
          Dữ liệu demo FE, sau này gọi API /api/v1/manager/dashboard.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {parkingFloors.map((floor) => {
            const available = getFloorAvailable(floor);
            const used = floor.occupied + floor.reserved;
            const percent = getFloorPercent(floor);

            return (
              <article key={floor.id} className="rounded-3xl border p-5">
                <div className="flex items-center justify-between">
                  <span className="text-4xl">{floor.icon}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{floor.id}</span>
                </div>
                <h3 className="mt-4 font-black">{floor.label}</h3>
                <p className="text-sm text-slate-500">{floor.vehicleLabel}</p>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Mini label="Tổng" value={floor.capacity} />
                  <Mini label="Chiếm" value={used} />
                  <Mini label="Trống" value={available} />
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex justify-between text-xs font-bold text-slate-500">
                    <span>Sử dụng</span>
                    <span>{percent}%</span>
                  </div>
                  <CapacityBar percent={percent} />
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <p className="text-sm font-bold uppercase text-slate-400">{title}</p>
      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-[11px] font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 font-black text-slate-950">{value}</p>
    </div>
  );
}
