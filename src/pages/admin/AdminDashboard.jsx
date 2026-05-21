import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAdminDashboard } from "../../api/adminApi";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminDashboard()
      .then((data) => setDashboard(data))
      .catch((error) => {
        console.error(error);
        setDashboard(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-900">
        <p className="text-lg font-bold">Đang tải dữ liệu...</p>
      </div>
    );
  }

  const stats = dashboard?.stats || [];
  const revenues = dashboard?.revenues || [];
  const vehicleTypes = dashboard?.vehicleTypes || [];
  const floorUsage = dashboard?.floorUsage || [];
  const activities = dashboard?.activities || [];
  const recentUsers = dashboard?.recentUsers || [];
  const recentPayments = dashboard?.recentPayments || [];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-xl font-bold text-white">
            P
          </div>

          <div>
            <h1 className="text-lg font-black text-slate-900">ParkSystem</h1>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Admin Portal
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-4">
          <SidebarItem active label="Dashboard" path="/admin/dashboard" />
          <SidebarItem label="Quản lý người dùng" path="/admin/users" />
          <SidebarItem label="Quản lý nhân viên" path="/admin/staffs" />
          <SidebarItem label="Quản lý bãi xe" path="/admin/parking-lots" />
          <SidebarItem label="Quản lý tầng / khu vực" path="/admin/floors" />
          <SidebarItem label="Quản lý ô đỗ xe" path="/admin/slots" />
          <SidebarItem label="Quản lý giá gửi xe" path="/admin/prices" />
          <SidebarItem label="Quản lý đặt chỗ" path="/admin/bookings" />
          <SidebarItem label="Quản lý thanh toán" path="/admin/payments" />
          <SidebarItem label="Báo cáo & thống kê" path="/admin/reports" />
          <SidebarItem label="Cài đặt hệ thống" path="/admin/settings" />
        </nav>

        <div className="border-t border-slate-200 p-4">
          <button
            onClick={handleLogout}
            className="w-full rounded-xl px-4 py-3 text-left font-semibold text-red-600 hover:bg-red-50"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="ml-72 min-h-screen">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-8 backdrop-blur">
          <h2 className="text-xl font-bold text-slate-900">Admin Dashboard</h2>

          <div className="flex items-center gap-5">
            <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              🔔
            </button>

            <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              ⚙️
            </button>

            <div className="h-6 w-px bg-slate-200" />

            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">
                {dashboard?.adminName || "Admin"}
              </p>
              <p className="text-xs text-slate-500">Quản trị hệ thống</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 font-bold text-white">
              A
            </div>
          </div>
        </header>

        <div className="space-y-8 p-8">
          <section className="flex flex-col justify-between gap-4 rounded-2xl bg-slate-900 p-8 text-white md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-bold">
                Xin chào, {dashboard?.adminName || "Admin"} 👋
              </h1>
              <p className="mt-2 text-slate-300">
                Quản lý toàn bộ hệ thống bãi xe, người dùng, thanh toán và báo cáo.
              </p>
            </div>

            <div className="rounded-xl bg-white/10 px-5 py-3">
              <p className="text-sm text-slate-300">Trạng thái hệ thống</p>
              <p className="font-bold text-green-300">
                {dashboard?.systemStatus || "Đang hoạt động ổn định"}
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => (
              <StatCard
                key={item.title}
                title={item.title}
                value={item.value}
                note={item.note}
                tone={item.tone}
              />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-8">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">
                  Doanh thu theo ngày trong tuần
                </h3>
                <button className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white">
                  Tuần này
                </button>
              </div>

              <div className="flex h-72 items-end gap-4 border-b border-l border-slate-200 px-4 pb-4">
                {revenues.map((item) => (
                  <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-lg bg-blue-600 transition-all hover:bg-blue-700"
                      style={{ height: `${item.value}%` }}
                    />
                    <span className="text-xs font-bold text-slate-500">
                      {item.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-4">
              <h3 className="mb-8 text-lg font-bold text-slate-900">
                Tỷ lệ loại phương tiện
              </h3>

              <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-full border-24 border-blue-600">
                <div className="flex h-32 w-32 items-center justify-center rounded-full border-20 border-purple-500">
                  <div className="text-center">
                    <p className="text-3xl font-black text-slate-900">
                      {dashboard?.parkingNow || 0}
                    </p>
                    <p className="text-xs font-bold uppercase text-slate-500">
                      Đang đỗ
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
                {vehicleTypes.map((item) => (
                  <Legend
                    key={item.label}
                    color={item.color}
                    label={item.label}
                    value={item.value}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-5">
              <h3 className="mb-6 text-lg font-bold text-slate-900">
                Tỷ lệ sử dụng bãi xe theo tầng
              </h3>

              <div className="space-y-6">
                {floorUsage.map((item) => (
                  <ProgressRow
                    key={item.title}
                    title={item.title}
                    value={item.value}
                    color={item.color}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-7">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">
                  Hoạt động quản trị gần đây
                </h3>
              </div>

              <div className="space-y-4">
                {activities.map((item) => (
                  <ActivityItem
                    key={item.title}
                    icon={item.icon}
                    title={item.title}
                    desc={item.desc}
                    time={item.time}
                  />
                ))}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900">
                  Người dùng mới gần đây
                </h3>
              </div>

              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Tên</th>
                    <th className="px-6 py-4">Vai trò</th>
                    <th className="px-6 py-4">Trạng thái</th>
                  </tr>
                </thead>

                <tbody>
                  {recentUsers.map((user) => (
                    <TableRow
                      key={user.name}
                      name={user.name}
                      role={user.role}
                      status={user.status}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900">
                  Giao dịch thanh toán gần đây
                </h3>
              </div>

              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Mã GD</th>
                    <th className="px-6 py-4">Số tiền</th>
                    <th className="px-6 py-4">Trạng thái</th>
                  </tr>
                </thead>

                <tbody>
                  {recentPayments.map((payment) => (
                    <PaymentRow
                      key={payment.id}
                      id={payment.id}
                      amount={payment.amount}
                      status={payment.status}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ label, path, active = false }) {
  return (
    <Link
      to={path}
      className={`flex items-center rounded-xl px-4 py-3 font-semibold transition-all ${
        active
          ? "bg-slate-900 text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {label}
    </Link>
  );
}

function StatCard({ title, value, note, tone }) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
    green: "bg-green-50 text-green-700",
    orange: "bg-orange-50 text-orange-700",
    red: "bg-red-50 text-red-700",
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className={`mb-4 inline-flex rounded-full px-3 py-1 text-xs font-bold ${toneClass}`}>
        ADMIN
      </div>

      <p className="text-sm font-bold uppercase tracking-wider text-slate-500">
        {title}
      </p>

      <h3 className="mt-2 text-3xl font-black text-slate-900">{value}</h3>

      <p className="mt-2 text-sm text-slate-500">{note}</p>
    </div>
  );
}

function Legend({ color, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span className="text-slate-600">
        {label} ({value})
      </span>
    </div>
  );
}

function ProgressRow({ title, value, color }) {
  const numericValue = Number(String(value).replace("%", ""));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold text-slate-700">{title}</span>
        <span className="font-bold text-slate-900">{value}</span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${numericValue}%` }}
        />
      </div>
    </div>
  );
}

function ActivityItem({ icon, title, desc, time }) {
  return (
    <div className="flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-slate-50">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-xl">
        {icon}
      </div>

      <div className="flex-1">
        <p className="font-bold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{desc}</p>
      </div>

      <span className="text-xs font-semibold text-slate-400">{time}</span>
    </div>
  );
}

function TableRow({ name, role, status }) {
  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50">
      <td className="px-6 py-4 font-semibold text-slate-900">{name}</td>
      <td className="px-6 py-4 text-slate-500">{role}</td>
      <td className="px-6 py-4">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            status === "Active"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {status}
        </span>
      </td>
    </tr>
  );
}

function PaymentRow({ id, amount, status }) {
  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50">
      <td className="px-6 py-4 font-semibold text-slate-900">{id}</td>
      <td className="px-6 py-4 text-slate-500">{amount}</td>
      <td className="px-6 py-4">
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            status === "Success"
              ? "bg-green-100 text-green-700"
              : "bg-orange-100 text-orange-700"
          }`}
        >
          {status}
        </span>
      </td>
    </tr>
  );
}