import { Link, useLocation, useNavigate } from "react-router-dom";

const navItems = [
  {
    label: "Tổng quan",
    path: "/admin/dashboard",
    icon: "📊",
    description: "Dashboard hệ thống",
  },
  {
    label: "Quản lý nhân viên",
    path: "/admin/employees",
    icon: "👥",
    description: "Tài khoản + phân quyền",
    aliases: ["/admin/users", "/admin/roles", "/admin/staff"],
  },
  {
    label: "Quản lý bãi xe",
    path: "/admin/parking",
    icon: "🅿️",
    description: "Tầng, khu, capacity",
  },
  {
    label: "Báo cáo hệ thống",
    path: "/admin/reports",
    icon: "📈",
    description: "Doanh thu, lượt xe",
    disabled: true,
  },
  {
    label: "Cài đặt",
    path: "/admin/settings",
    icon: "⚙️",
    description: "Cấu hình chung",
    disabled: true,
  },
];

function isActivePath(locationPath, item) {
  if (locationPath === item.path) return true;
  if (item.aliases?.includes(locationPath)) return true;
  return false;
}

export default function AdminLayout({
  title,
  description,
  eyebrow = "Admin Portal",
  children,
  actions,
  onLogout,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    if (onLogout) onLogout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-72 flex-col border-r border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
        <div className="border-b border-slate-100 p-6">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-xl font-black text-white shadow-sm">
              P
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-950">
                ParkSystem
              </h1>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                Admin Console
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
          {navItems.map((item) => {
            const active = isActivePath(location.pathname, item);

            if (item.disabled) {
              return (
                <div
                  key={item.label}
                  className="flex cursor-not-allowed items-center gap-3 rounded-2xl px-4 py-3 opacity-45"
                  title="Sẽ nối API ở phase sau"
                >
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-black text-slate-500">{item.label}</p>
                    <p className="text-[11px] font-semibold text-slate-400">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                  active
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-sm font-black">{item.label}</p>
                  <p className={`text-[11px] font-semibold ${active ? "text-slate-300" : "text-slate-400"}`}>
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 rounded-3xl bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                AD
              </div>
              <div>
                <p className="text-sm font-black text-slate-950">System Admin</p>
                <p className="text-xs font-semibold text-slate-500">Quản trị viên</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-2xl px-4 py-3 text-left text-sm font-black text-red-600 transition hover:bg-red-50"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="min-h-screen pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/85 px-8 py-5 backdrop-blur">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                {eyebrow}
              </p>
              <h2 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                {title}
              </h2>
              <p className="mt-1 max-w-3xl text-sm font-medium text-slate-500">
                {description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {actions}
              <button
                type="button"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-600 shadow-sm hover:bg-slate-50"
              >
                🔔 Thông báo
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] space-y-8 p-8">{children}</main>
      </div>
    </div>
  );
}
