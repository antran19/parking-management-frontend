import { Link } from "react-router-dom";

export default function AdminDashboard() {
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
          <SidebarItem label="Quản lý người dùng" path="#" />
          <SidebarItem label="Quản lý nhân viên" path="#" />
          <SidebarItem label="Quản lý bãi xe" path="#" />
          <SidebarItem label="Quản lý tầng / khu vực" path="#" />
          <SidebarItem label="Quản lý ô đỗ xe" path="#" />
          <SidebarItem label="Quản lý giá gửi xe" path="#" />
          <SidebarItem label="Quản lý đặt chỗ" path="#" />
          <SidebarItem label="Quản lý thanh toán" path="#" />
          <SidebarItem label="Báo cáo & thống kê" path="#" />
          <SidebarItem label="Cài đặt hệ thống" path="#" />
        </nav>

        <div className="border-t border-slate-200 p-4">
          <button className="w-full rounded-xl px-4 py-3 text-left font-semibold text-red-600 hover:bg-red-50">
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
                Admin Nguyễn Văn A
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
                Xin chào, Admin Nguyễn Văn A 👋
              </h1>
              <p className="mt-2 text-slate-300">
                Quản lý toàn bộ hệ thống bãi xe, người dùng, thanh toán và báo cáo.
              </p>
            </div>

            <div className="rounded-xl bg-white/10 px-5 py-3">
              <p className="text-sm text-slate-300">Trạng thái hệ thống</p>
              <p className="font-bold text-green-300">Đang hoạt động ổn định</p>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Tổng người dùng" value="1,248" note="+36 người dùng mới trong tuần" tone="blue" />
            <StatCard title="Tổng nhân viên" value="42" note="Staff: 34 • Manager: 8" tone="purple" />
            <StatCard title="Tổng bãi xe" value="6" note="3 cơ sở đang hoạt động" tone="green" />
            <StatCard title="Tổng ô đỗ" value="720" note="Xe máy, xe điện, xe hơi" tone="orange" />
            <StatCard title="Doanh thu hôm nay" value="12.500.000đ" note="+8% so với hôm qua" tone="green" />
            <StatCard title="Doanh thu tháng" value="286.000.000đ" note="Đạt 76% mục tiêu tháng" tone="blue" />
            <StatCard title="Giao dịch chờ xử lý" value="18" note="Cần kiểm tra thanh toán" tone="orange" />
            <StatCard title="Cảnh báo hệ thống" value="3" note="2 slot lỗi, 1 thanh toán lỗi" tone="red" />
          </section>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ label, path, active = false }) {
  if (path === "#") {
    return (
      <button
        type="button"
        className={`flex w-full items-center rounded-xl px-4 py-3 text-left font-semibold transition-all ${
          active
            ? "bg-slate-900 text-white"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        {label}
      </button>
    );
  }

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