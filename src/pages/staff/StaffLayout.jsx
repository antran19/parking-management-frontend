import { useEffect, useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";

// Icons tùy chỉnh dạng SVG cao cấp
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
  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const IconSettings = () => (
  <svg className="w-5 h-5 text-slate-500 hover:rotate-45 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0a3 3 0 01-6 0z" />
  </svg>
);

export default function StaffLayout({ onLogout }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("staff_sidebar_collapsed") === "true");
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [liveDate, setLiveDate] = useState("");

  // Lấy thông tin tài khoản đăng nhập từ localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const fullName = user.fullName || "Nguyễn Văn A";
  const userRole = user.role || "STAFF";
  const roleLabel = userRole === "STAFF" ? "Nhân viên bãi xe" : (userRole === "ADMIN" ? "Quản trị viên" : (userRole === "MANAGER" ? "Quản lý" : "Tài xế"));
  const avatarChar = fullName.charAt(0).toUpperCase();

  // Bảng map tiêu đề dựa trên route hiện tại
  const pageTitles = {
    "/staff/dashboard": "Bảng điều khiển tác nghiệp",
    "/staff/map": "Sơ đồ phân khu thực tế",
    "/staff/check-in": "Check-in xe vào bãi",
    "/staff/zone-entry": "Quét Barie Cổng Zone",
    "/staff/check-out": "Check-out xe ra",
    "/staff/history": "Lịch sử phiên gửi xe",
  };
  const pageTitle = pageTitles[location.pathname] || "Cổng nhân viên";

  // Cập nhật đồng hồ và ngày tháng
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setLiveDate(today.toLocaleDateString('vi-VN', options));

    return () => {
      clearInterval(clockTimer);
    };
  }, []);

  const handleToggleSidebar = () => {
    const val = !collapsed;
    setCollapsed(val);
    localStorage.setItem("staff_sidebar_collapsed", val ? "true" : "false");
  };

  return (
    <div className="m-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      {/* Sidebar - Royal Indigo Premium style */}
      <aside
        className={`aside-panel fixed left-0 top-0 bottom-0 z-50 flex h-screen flex-col bg-gradient-to-b from-indigo-900 to-[#16143c] text-white shadow-xl transition-all duration-300 ${collapsed ? "w-14" : "w-60"
          }`}
      >
        {/* Sidebar Header */}
        <div className={`flex items-center border-b border-indigo-950/40 overflow-hidden ${collapsed ? "justify-center py-6 px-0" : "gap-3.5 px-6 py-6"}`}>
          <button
            onClick={handleToggleSidebar}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20 font-black text-lg flex-shrink-0 cursor-pointer"
          >
            P
          </button>
          {!collapsed && (
            <div className="animate-fade-in-fast">
              <h1 className="text-md font-extrabold bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent whitespace-nowrap">
                Smart Parking
              </h1>
              <p className="text-xs text-indigo-300 font-semibold tracking-wider uppercase whitespace-nowrap">
                Cổng nhân viên
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Navigation Links */}
        <nav className={`flex-1 space-y-1.5 py-6 overflow-x-hidden ${collapsed ? "px-2" : "px-4"}`}>
          <SideLink collapsed={collapsed} to="/staff/dashboard" icon={<IconDashboard />} label="Bảng điều khiển" active={location.pathname === "/staff/dashboard"} />
          <SideLink collapsed={collapsed} to="/staff/map" icon={<IconMap />} label="Sơ đồ bãi xe" active={location.pathname === "/staff/map"} />
          <SideLink collapsed={collapsed} to="/staff/check-in" icon={<IconCheckIn />} label="Check-in xe vào" active={location.pathname === "/staff/check-in"} />
          <SideLink
            collapsed={collapsed}
            to="/staff/zone-entry"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h.01M16 20h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Cổng Zone"
            active={location.pathname === "/staff/zone-entry"}
          />
          <SideLink collapsed={collapsed} to="/staff/check-out" icon={<IconCheckOut />} label="Check-out xe ra" active={location.pathname === "/staff/check-out"} />
          <SideLink collapsed={collapsed} to="/staff/history" icon={<IconHistory />} label="Lịch sử phiên gửi" active={location.pathname === "/staff/history"} />
          <SideLink
            collapsed={collapsed}
            to="/staff/3d-map"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 00-1-1.732l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.732l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.3 7L12 12l8.7-5M12 22V12" />
              </svg>
            }
            label="Mô phỏng 3D"
            active={location.pathname === "/staff/3d-map"}
          />
        </nav>

        {/* Sidebar Footer */}
        <div className={`border-t border-indigo-950/40 overflow-hidden ${collapsed ? "p-2" : "p-4"}`}>
          <button
            onClick={onLogout}
            className={`flex w-full items-center rounded-xl py-3 font-semibold text-rose-350 hover:bg-rose-950/30 hover:text-rose-200 transition-all duration-200 cursor-pointer ${collapsed ? "justify-center px-0" : "gap-3 px-4"}`}
          >
            <IconLogout />
            {!collapsed && <span className="whitespace-nowrap">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main
        className={`main-content-area flex-1 min-h-screen flex flex-col transition-all duration-300 ${collapsed ? "ml-14" : "ml-60"
          }`}
      >
        {/* Header bar - Glassmorphism sáng rõ ràng */}
        <header className="sticky top-0 z-40 flex h-15 items-center justify-between border-b border-indigo-200 bg-indigo-100 px-4 backdrop-blur-md">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">{pageTitle}</h2>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">{liveDate}</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end border-r border-indigo-200 pr-6">
              <span className="font-mono text-base font-bold text-indigo-800 bg-white px-3.5 py-1 rounded-lg border border-indigo-300/60">
                {liveTime}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button className="relative rounded-xl p-2.5 text-indigo-700 hover:text-indigo-900 hover:bg-indigo-200/60 transition-all cursor-pointer">
                <IconBell />
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              </button>
              <button className="rounded-xl p-2.5 text-indigo-700 hover:text-indigo-900 hover:bg-indigo-200/60 transition-all cursor-pointer">
                <IconSettings />
              </button>
            </div>

            <div className="flex items-center gap-3.5 border-l border-indigo-200 pl-6">
              <div className="text-right">
                <p className="font-bold text-sm text-slate-900">{fullName}</p>
                <p className="text-[10px] text-slate-500 font-bold tracking-wider uppercase mt-0.5">{roleLabel}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 font-bold text-white shadow-md shadow-indigo-500/10">
                {avatarChar}
              </div>
            </div>
          </div>
        </header>

        {/* Nơi hiển thị ruột của từng trang con */}
        <Outlet />
      </main>
    </div>
  );
}

// SideLink helper component
function SideLink({ to, icon, label, active, collapsed }) {
  return (
    <Link
      to={to}
      className={`nav-link-item flex items-center rounded-xl py-3 font-semibold transition-all duration-200 ${collapsed ? "justify-center px-0" : "gap-3 px-4"
        } ${active
          ? "bg-indigo-800 text-white shadow-md shadow-indigo-950/30 border border-indigo-700/30"
          : "text-indigo-200/80 hover:bg-indigo-950/40 hover:text-white"
        }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </Link>
  );
}
