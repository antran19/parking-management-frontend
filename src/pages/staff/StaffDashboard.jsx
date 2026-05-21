import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { staffApi } from "../../api/staffApi";

export default function StaffDashboard({ onLogout }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staffApi
      .getDashboard()
      .then(setDashboardData)
      .catch((error) => {
        console.error("Lỗi gọi API staff dashboard:", error);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8">Đang tải dữ liệu...</div>;
  }

  if (!dashboardData) {
    return (
      <div className="p-8 text-red-600">
        Không lấy được dữ liệu từ API.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9fc] text-slate-900">
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-80 flex-col border-r border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
            P
          </div>

          <div>
            <h1 className="text-lg font-black text-slate-950">
              Smart Parking
            </h1>

            <p className="text-sm text-slate-500">Cổng nhân viên</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-4">
          <Link
            to="/staff/dashboard"
            className="flex items-center gap-3 rounded-xl border-l-4 border-purple-600 bg-slate-950 px-4 py-3 font-semibold text-white"
          >
            <span>📊</span>
            <span>Bảng điều khiển</span>
          </Link>

          <Link
            to="/staff/map"
            className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-950"
          >
            <span>🅿️</span>
            <span>Sơ đồ bãi xe</span>
          </Link>

          <Link
            to="/staff/check-in"
            className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-950"
          >
            <span>🚗</span>
            <span>Check-in xe vào</span>
          </Link>

          <Link
            to="/staff/check-out"
            className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-950"
          >
            <span>💳</span>
            <span>Check-out thanh toán</span>
          </Link>

          <Link
            to="/staff/history"
            className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-950"
          >
            <span>📋</span>
            <span>Lịch sử phiên gửi</span>
          </Link>
        </nav>

        <div className="border-t border-slate-200 p-4">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold text-red-600 hover:bg-red-50"
          >
            <span>⏻</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <main className="ml-80 min-h-screen">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-8 backdrop-blur">
          <h2 className="text-2xl font-bold text-slate-950">
            Bảng điều khiển
          </h2>

          <div className="flex items-center gap-4">
            <button className="rounded-full p-2 hover:bg-slate-100">
              🔔
            </button>

            <button className="rounded-full p-2 hover:bg-slate-100">
              ⚙️
            </button>

            <div className="border-l border-slate-200 pl-4 text-right">
              <p className="font-semibold">
                {dashboardData.staffName}
              </p>

              <p className="text-xs text-slate-500">
                {dashboardData.role}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-700">
              A
            </div>
          </div>
        </header>

        <section className="space-y-8 p-8">
          <div className="rounded-2xl bg-slate-950 p-8 text-white">
            <h1 className="text-3xl font-bold">
              Xin chào, {dashboardData.staffName} 👋
            </h1>

            <p className="mt-2 text-slate-300">
              Theo dõi tình trạng bãi xe, hỗ trợ check-in/check-out
              và xử lý các phiên gửi xe trong ngày.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3 xl:grid-cols-6">
            <StatCard
              title="Chỗ trống"
              value={dashboardData.stats.availableSlots}
            />

            <StatCard
              title="Đang có xe"
              value={dashboardData.stats.occupiedSlots}
            />

            <StatCard
              title="Đã đặt"
              value={dashboardData.stats.reservedSlots}
            />

            <StatCard
              title="Xe vào hôm nay"
              value={dashboardData.stats.todayCheckIn}
            />

            <StatCard
              title="Xe ra hôm nay"
              value={dashboardData.stats.todayCheckOut}
            />

            <StatCard
              title="Doanh thu hôm nay"
              value={dashboardData.stats.revenue}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h3 className="mb-5 text-xl font-bold">
                Thao tác nhanh
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <QuickAction
                  to="/staff/check-in"
                  title="Check-in xe vào"
                  desc="Quét QR hoặc nhập biển số"
                />

                <QuickAction
                  to="/staff/check-out"
                  title="Check-out xe ra"
                  desc="Tính phí và xác nhận thanh toán"
                />

                <QuickAction
                  to="/staff/map"
                  title="Xem sơ đồ bãi xe"
                  desc="Theo dõi slot trống/có xe/đã đặt"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold">
                Trạng thái vận hành
              </h3>

              <div className="space-y-4">
                <StatusRow
                  label="Cổng vào"
                  status="Đang hoạt động"
                />

                <StatusRow
                  label="Cổng ra"
                  status="Đang hoạt động"
                />

                <StatusRow
                  label="Thanh toán QR"
                  status="Sẵn sàng"
                />

                <StatusRow
                  label="Camera nhận diện"
                  status="Sẵn sàng"
                />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <h3 className="text-xl font-bold">
                Hoạt động gần đây
              </h3>
            </div>

            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4">Thời gian</th>
                  <th className="px-6 py-4">Thao tác</th>
                  <th className="px-6 py-4">Loại xe</th>
                  <th className="px-6 py-4">Biển số</th>
                  <th className="px-6 py-4">Vị trí</th>
                  <th className="px-6 py-4">Trạng thái</th>
                </tr>
              </thead>

              <tbody>
                {dashboardData.recentActivities.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-slate-200 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">{item.time}</td>

                    <td className="px-6 py-4 font-semibold">
                      {item.action}
                    </td>

                    <td className="px-6 py-4">
                      {item.vehicle}
                    </td>

                    <td className="px-6 py-4 font-bold">
                      {item.plate}
                    </td>

                    <td className="px-6 py-4">{item.slot}</td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase text-slate-400">
        {title}
      </p>

      <p className="mt-3 text-2xl font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function QuickAction({ title, desc, to }) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-slate-200 p-5 transition hover:border-slate-950 hover:bg-slate-50"
    >
      <p className="font-bold text-slate-950">{title}</p>

      <p className="mt-2 text-sm text-slate-500">{desc}</p>
    </Link>
  );
}

function StatusRow({ label, status }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
      <span className="text-slate-600">{label}</span>

      <span className="font-semibold text-green-600">
        {status}
      </span>
    </div>
  );
}