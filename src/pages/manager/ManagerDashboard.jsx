export default function ManagerDashboard() {
  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Manager Dashboard
        </h1>
        <p className="mt-2 text-slate-500">
          Đây là giao diện dành cho Manager
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Tổng bãi xe</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">3</h2>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Nhân viên</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">12</h2>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Doanh thu hôm nay</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            8.500.000đ
          </h2>
        </div>
      </div>
    </div>
  );
}