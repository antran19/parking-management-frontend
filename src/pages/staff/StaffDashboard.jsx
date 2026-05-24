import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const dashboardData = {
  staffName: "Nguyễn Văn A",
  role: "Nhân viên bãi xe",
  stats: {
    availableSlots: 124,
    occupiedSlots: 42,
    reservedSlots: 12,
    todayCheckIn: 86,
    todayCheckOut: 64,
    revenue: "3.250.000đ",
  },
  recentActivities: [
    {
      id: 1,
      time: "08:30",
      action: "Check-in",
      vehicle: "Xe máy",
      plate: "59A1-12345",
      slot: "M-A12",
      status: "Thành công",
    },
    {
      id: 2,
      time: "09:10",
      action: "Check-out",
      vehicle: "Xe hơi",
      plate: "51A-67890",
      slot: "C-B03",
      status: "Đã thanh toán",
    },
    {
      id: 3,
      time: "10:05",
      action: "Đặt chỗ",
      vehicle: "Xe điện",
      plate: "72E-45678",
      slot: "E-A07",
      status: "Đang giữ chỗ",
    },
  ],
};

// Custom SVG Icons for Premium UI
const IconDashboard = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const IconMap = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const IconCheckIn = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </svg>
);

const IconCheckOut = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconHistory = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconLogout = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const IconBell = () => (
  <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const IconSettings = () => (
  <svg className="w-6 h-6 text-slate-500 hover:rotate-45 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 01-6 0z" />
  </svg>
);

const LicensePlate = ({ plate }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-350 bg-white font-mono font-bold text-slate-800 shadow-sm text-xs tracking-widest">
    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block mr-1"></span>
    {plate}
  </span>
);

export default function StaffDashboard({ onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [liveDate, setLiveDate] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setLiveDate(today.toLocaleDateString('vi-VN', options));

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans">
      {/* Sidebar - Dark Glassmorphism style */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-50 flex h-screen flex-col bg-slate-900 text-white shadow-xl transition-all duration-300 ${
          collapsed ? "w-20" : "w-72"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center gap-3.5 px-6 py-6 border-b border-slate-800 overflow-hidden">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20 font-black text-lg flex-shrink-0"
          >
            P
          </button>
          {!collapsed && (
            <div className="animate-fade-in-fast">
              <h1 className="text-md font-extrabold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent whitespace-nowrap">
                Smart Parking
              </h1>
              <p className="text-xs text-blue-400 font-semibold tracking-wider uppercase whitespace-nowrap">
                Cổng nhân viên
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-x-hidden">
          <SideLink collapsed={collapsed} to="/staff/dashboard" icon={<IconDashboard />} label="Bảng điều khiển" active />
          <SideLink collapsed={collapsed} to="/staff/map" icon={<IconMap />} label="Sơ đồ bãi xe" />
          <SideLink collapsed={collapsed} to="/staff/check-in" icon={<IconCheckIn />} label="Check-in xe vào" />
          <SideLink collapsed={collapsed} to="/staff/check-out" icon={<IconCheckOut />} label="Check-out xe ra" />
          <SideLink collapsed={collapsed} to="/staff/history" icon={<IconHistory />} label="Lịch sử phiên gửi" />
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-800 p-4 overflow-hidden">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold text-rose-400 hover:bg-rose-955/30 hover:text-rose-300 transition-all duration-200"
          >
            <IconLogout />
            {!collapsed && <span className="whitespace-nowrap">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main
        className={`flex-1 min-h-screen flex flex-col transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-72"
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/80 px-8 backdrop-blur-md">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-900">
              Hệ thống vận hành
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{liveDate}</p>
          </div>

          <div className="flex items-center gap-6">
            {/* Live Clock Widget */}
            <div className="hidden md:flex flex-col items-end border-r border-slate-200 pr-6">
              <span className="font-mono text-lg font-bold text-indigo-600 bg-indigo-50/50 px-3 py-1 rounded-lg border border-indigo-100">
                {liveTime}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative rounded-full p-2.5 hover:bg-slate-100/80 transition-colors">
                <IconBell />
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              </button>

              <button className="rounded-full p-2.5 hover:bg-slate-100/80 transition-colors">
                <IconSettings />
              </button>
            </div>

            {/* Profile Avatar */}
            <div className="flex items-center gap-3.5 border-l border-slate-200 pl-6">
              <div className="text-right">
                <p className="font-semibold text-sm text-slate-900">
                  {dashboardData.staffName}
                </p>
                <p className="text-xs text-slate-400 font-medium">
                  {dashboardData.role}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 font-bold text-white shadow-md shadow-indigo-500/20">
                {dashboardData.staffName.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Content Section */}
        <section className="flex-1 space-y-6 p-8">
          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-lg border border-slate-800">
            {/* Mesh Glow Background */}
            <div className="absolute right-0 top-0 -mr-20 -mt-20 h-60 w-60 rounded-full bg-indigo-600/30 blur-3xl" />
            <div className="absolute left-1/3 bottom-0 -mb-20 h-40 w-40 rounded-full bg-blue-500/20 blur-3xl" />

            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-4 border border-emerald-500/20">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                🟢 Hệ thống đang trực tuyến
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Xin chào, {dashboardData.staffName} 👋
              </h1>
              <p className="mt-2.5 text-slate-300 text-sm leading-relaxed max-w-lg">
                Chào mừng trở lại ca trực. Theo dõi trạng thái đỗ xe thời gian thực, quản lý yêu cầu ra vào cổng và theo dõi thống kê hôm nay.
              </p>
            </div>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard
              title="Chỗ trống"
              value={dashboardData.stats.availableSlots}
              icon="🟢"
              accentColor="bg-emerald-500"
              subtext="Sẵn sàng gửi xe"
            />
            <StatCard
              title="Đang có xe"
              value={dashboardData.stats.occupiedSlots}
              icon="🚗"
              accentColor="bg-blue-500"
              subtext="Đang đỗ trong bãi"
            />
            <StatCard
              title="Đã đặt"
              value={dashboardData.stats.reservedSlots}
              icon="📅"
              accentColor="bg-amber-500"
              subtext="Chờ khách lái tới"
            />
            <StatCard
              title="Xe vào hôm nay"
              value={dashboardData.stats.todayCheckIn}
              icon="📥"
              accentColor="bg-indigo-500"
              subtext="Đã quét cổng vào"
            />
            <StatCard
              title="Xe ra hôm nay"
              value={dashboardData.stats.todayCheckOut}
              icon="📤"
              accentColor="bg-sky-500"
              subtext="Đã tính tiền xuất bãi"
            />
            <StatCard
              title="Doanh thu"
              value={dashboardData.stats.revenue}
              icon="💰"
              accentColor="bg-violet-500"
              subtext="Doanh số trong ca"
            />
          </div>

          {/* Quick Actions & Status */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Quick Actions Panel */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-100 lg:col-span-2">
              <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-indigo-600 block"></span>
                Thao tác vận hành nhanh
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <QuickAction
                  to="/staff/check-in"
                  title="Check-in xe vào"
                  desc="Quét mã QR của tài xế hoặc nhập tay biển số để ghi nhận xe vào."
                  colorClass="from-emerald-500 to-teal-600"
                  icon="🚗"
                />

                <QuickAction
                  to="/staff/check-out"
                  title="Check-out xe ra"
                  desc="Tính toán chi phí đỗ xe dựa trên thời lượng và xác nhận thanh toán."
                  colorClass="from-blue-500 to-indigo-600"
                  icon="💳"
                />

                <QuickAction
                  to="/staff/map"
                  title="Xem sơ đồ bãi xe"
                  desc="Bản đồ trực quan trạng thái từng ô đỗ và tầng hầm hiện tại."
                  colorClass="from-purple-500 to-indigo-600"
                  icon="🅿️"
                />
              </div>
            </div>

            {/* Status Panel */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-100">
              <h3 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-indigo-600 block"></span>
                Trạng thái thiết bị
              </h3>

              <div className="space-y-3.5">
                <StatusRow label="Cổng vào A" status="Đang hoạt động" type="success" />
                <StatusRow label="Cổng ra B" status="Đang hoạt động" type="success" />
                <StatusRow label="Cổng thanh toán QR" status="Sẵn sàng" type="success" />
                <StatusRow label="Camera AI nhận diện" status="Sẵn sàng" type="success" />
              </div>
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Hoạt động gần đây
                </h3>
                <p className="text-xs text-slate-400 mt-1">Các phiên check-in / check-out vừa diễn ra trong ca</p>
              </div>
              <Link to="/staff/history" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
                Xem toàn bộ lịch sử
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Thời gian</th>
                    <th className="px-6 py-4">Thao tác</th>
                    <th className="px-6 py-4">Loại xe</th>
                    <th className="px-6 py-4">Biển số</th>
                    <th className="px-6 py-4">Vị trí đỗ</th>
                    <th className="px-6 py-4">Trạng thái</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {dashboardData.recentActivities.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 text-slate-500 font-medium font-mono">
                        {item.time}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.action === "Check-in"
                              ? "bg-emerald-50 text-emerald-700"
                              : item.action === "Check-out"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.action === "Check-in"
                                ? "bg-emerald-500"
                                : item.action === "Check-out"
                                ? "bg-blue-500"
                                : "bg-amber-500"
                            }`}
                          ></span>
                          {item.action}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {item.vehicle}
                      </td>

                      <td className="px-6 py-4">
                        <LicensePlate plate={item.plate} />
                      </td>

                      <td className="px-6 py-4 text-slate-600 font-semibold font-mono">
                        {item.slot}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function SideLink({ to, icon, label, active, collapsed }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${
        active
          ? "bg-slate-800 text-blue-400 border border-slate-700 shadow-inner"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </Link>
  );
}

function StatCard({ title, value, icon, accentColor, subtext }) {
  return (
    <div className="group relative rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm shadow-slate-100/50 hover:shadow-md hover:border-slate-300 transition-all duration-300 overflow-hidden">
      {/* Top accent highlight */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${accentColor}`} />

      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold uppercase tracking-wide text-slate-400 group-hover:text-slate-500 transition-colors">
          {title}
        </span>
        <span className="text-xl">{icon}</span>
      </div>

      <div className="mt-4 flex flex-col">
        <span className="text-2xl font-black text-slate-900 group-hover:scale-[1.02] origin-left transition-transform duration-300">
          {value}
        </span>
        <span className="text-[10px] font-medium text-slate-400 mt-1">
          {subtext}
        </span>
      </div>
    </div>
  );
}

function QuickAction({ title, desc, to, colorClass, icon }) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-inner hover:shadow-lg hover:border-slate-900/10 transition-all duration-300 overflow-hidden"
    >
      <div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr ${colorClass} text-white text-lg shadow-sm shadow-indigo-500/10 group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <h4 className="font-extrabold text-slate-900 mt-4 group-hover:text-indigo-600 transition-colors">
          {title}
        </h4>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          {desc}
        </p>
      </div>
      <div className="mt-4 flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-1.5 transition-transform duration-300">
        <span>Bắt đầu thao tác</span>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

function StatusRow({ label, status, type }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50/50 border border-slate-100 p-3.5 hover:bg-slate-50 transition-colors">
      <span className="text-slate-600 text-sm font-semibold">
        {label}
      </span>

      <span className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-semibold text-xs text-emerald-600">
          {status}
        </span>
      </span>
    </div>
  );
}