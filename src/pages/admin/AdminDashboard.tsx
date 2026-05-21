import { Link } from "react-router-dom";

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Sidebar */}
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

      {/* Main */}
      <main className="ml-72 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-8 backdrop-blur">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Admin Dashboard
            </h2>
          </div>

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
          {/* Welcome */}
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

          {/* Stats */}
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Tổng người dùng"
              value="1,248"
              note="+36 người dùng mới trong tuần"
              tone="blue"
            />

            <StatCard
              title="Tổng nhân viên"
              value="42"
              note="Staff: 34 • Manager: 8"
              tone="purple"
            />

            <StatCard
              title="Tổng bãi xe"
              value="6"
              note="3 cơ sở đang hoạt động"
              tone="green"
            />

            <StatCard
              title="Tổng ô đỗ"
              value="720"
              note="Xe máy, xe điện, xe hơi"
              tone="orange"
            />

            <StatCard
              title="Doanh thu hôm nay"
              value="12.500.000đ"
              note="+8% so với hôm qua"
              tone="green"
            />

            <StatCard
              title="Doanh thu tháng"
              value="286.000.000đ"
              note="Đạt 76% mục tiêu tháng"
              tone="blue"
            />

            <StatCard
              title="Giao dịch chờ xử lý"
              value="18"
              note="Cần kiểm tra thanh toán"
              tone="orange"
            />

            <StatCard
              title="Cảnh báo hệ thống"
              value="3"
              note="2 slot lỗi, 1 thanh toán lỗi"
              tone="red"
            />
          </section>

          {/* Charts */}
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
                {[
                  { day: "T2", value: 42 },
                  { day: "T3", value: 58 },
                  { day: "T4", value: 76 },
                  { day: "T5", value: 64 },
                  { day: "T6", value: 88 },
                  { day: "T7", value: 96 },
                  { day: "CN", value: 70 },
                ].map((item) => (
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
                    <p className="text-3xl font-black text-slate-900">684</p>
                    <p className="text-xs font-bold uppercase text-slate-500">
                      Đang đỗ
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
                <Legend color="bg-blue-600" label="Xe hơi" value="320" />
                <Legend color="bg-purple-500" label="Xe máy" value="240" />
                <Legend color="bg-green-500" label="Xe điện" value="84" />
                <Legend color="bg-slate-400" label="Xe đạp" value="40" />
              </div>
            </div>
          </section>

          {/* Bottom */}
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-5">
              <h3 className="mb-6 text-lg font-bold text-slate-900">
                Tỷ lệ sử dụng bãi xe theo tầng
              </h3>

              <div className="space-y-6">
                <ProgressRow title="Tầng 1 - Xe máy / Xe đạp" value="82%" color="bg-red-500" />
                <ProgressRow title="Tầng 2 - Xe điện" value="68%" color="bg-purple-500" />
                <ProgressRow title="Tầng 3 - Xe hơi" value="74%" color="bg-blue-600" />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-7">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">
                  Hoạt động quản trị gần đây
                </h3>

                <button className="text-sm font-bold text-blue-600 hover:underline">
                  Xem tất cả
                </button>
              </div>

              <div className="space-y-4">
                <ActivityItem
                  icon="👤"
                  title="Tạo tài khoản Staff mới"
                  desc="Admin Nguyễn Văn A đã tạo tài khoản cho Trần Minh Khang"
                  time="2 phút trước"
                />

                <ActivityItem
                  icon="💰"
                  title="Cập nhật giá gửi xe"
                  desc="Giá xe hơi tầng 3 được cập nhật thành 15.000đ / giờ"
                  time="15 phút trước"
                />

                <ActivityItem
                  icon="🅿️"
                  title="Thêm khu vực đỗ xe"
                  desc="Tầng 2 - Khu xe điện đã được thêm 12 ô đỗ mới"
                  time="40 phút trước"
                />

                <ActivityItem
                  icon="⚠️"
                  title="Cảnh báo thanh toán lỗi"
                  desc="Giao dịch #PAY-1024 cần được kiểm tra thủ công"
                  time="1 giờ trước"
                />
              </div>
            </div>
          </section>

          {/* Tables */}
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
                  <TableRow name="Lê Hoàng Nam" role="Driver" status="Active" />
                  <TableRow name="Phạm Thu Trang" role="Staff" status="Active" />
                  <TableRow name="Nguyễn Minh Tú" role="Manager" status="Pending" />
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
                  <PaymentRow id="PAY-1021" amount="45.000đ" status="Success" />
                  <PaymentRow id="PAY-1022" amount="25.000đ" status="Success" />
                  <PaymentRow id="PAY-1024" amount="60.000đ" status="Pending" />
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({
  label,
  path,
  active = false,
}: {
  label: string;
  path: string;
  active?: boolean;
}) {
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

function StatCard({
  title,
  value,
  note,
  tone,
}: {
  title: string;
  value: string;
  note: string;
  tone: "blue" | "purple" | "green" | "orange" | "red";
}) {
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

function Legend({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full ${color}`} />
      <span className="text-slate-600">
        {label} ({value})
      </span>
    </div>
  );
}

function ProgressRow({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: string;
}) {
  const numericValue = Number(value.replace("%", ""));

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

function ActivityItem({
  icon,
  title,
  desc,
  time,
}: {
  icon: string;
  title: string;
  desc: string;
  time: string;
}) {
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

function TableRow({
  name,
  role,
  status,
}: {
  name: string;
  role: string;
  status: string;
}) {
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

function PaymentRow({
  id,
  amount,
  status,
}: {
  id: string;
  amount: string;
  status: string;
}) {
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