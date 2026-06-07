import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { APP_THEME } from "../data/smartParkingSeed";

function getInitialCollapsed(role) {
  try {
    return localStorage.getItem(`smartparking:${role}:sidebar-collapsed`) === "true";
  } catch {
    return false;
  }
}

export default function AppShell({
  role = "driver",
  title,
  subtitle,
  navItems = [],
  userName = "Ngọc Quảng",
  userLabel = "Driver",
  onLogout,
  children,
  actions,
}) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => getInitialCollapsed(role));

  useEffect(() => {
    localStorage.setItem(`smartparking:${role}:sidebar-collapsed`, String(collapsed));
  }, [collapsed, role]);

  const sidebarWidth = useMemo(() => (collapsed ? "5.25rem" : "17rem"), [collapsed]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside
        className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-200/80 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.05)] backdrop-blur transition-all duration-300"
        style={{ width: sidebarWidth }}
      >
        <div className="flex h-18 items-center gap-3 border-b border-slate-100 px-4 py-4">
          <Link
            to={role === "admin" ? "/admin/dashboard" : "/driver/dashboard"}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-xl font-black text-white shadow-sm">
              P
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="truncate text-base font-black tracking-tight text-slate-950">{APP_THEME.brand}</h1>
                <p className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  {APP_THEME.version}
                </p>
              </div>
            )}
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-extrabold transition-all duration-200 ${
                  active
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
                title={item.label}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-base transition ${
                    active ? "bg-white/12 text-white" : "bg-slate-50 text-slate-500 group-hover:bg-white group-hover:text-slate-950"
                  }`}
                >
                  {item.icon}
                </span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <div className="rounded-3xl bg-slate-50 p-3 ring-1 ring-slate-200/70">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                {userName.slice(0, 1)}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">{userName}</p>
                  <p className="truncate text-xs font-bold text-slate-500">{userLabel}</p>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                type="button"
                onClick={onLogout}
                className="mt-3 w-full rounded-2xl bg-white px-3 py-2 text-sm font-black text-slate-600 ring-1 ring-slate-200 transition hover:bg-rose-50 hover:text-rose-600"
              >
                Đăng xuất
              </button>
            )}
          </div>
        </div>
      </aside>

      <header
        className="fixed right-0 top-0 z-30 border-b border-slate-200/80 bg-white/90 px-5 py-4 backdrop-blur-xl transition-all duration-300"
        style={{ left: sidebarWidth }}
      >
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-base font-black text-slate-700 transition hover:bg-slate-50"
              title="Thu gọn / mở menu"
            >
              {collapsed ? "☰" : "‹"}
            </button>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-black tracking-tight text-slate-950 md:text-2xl">{title}</h2>
              {subtitle && <p className="truncate text-sm font-semibold text-slate-500">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      </header>

      <main className="min-h-screen pt-[76px] transition-all duration-300" style={{ paddingLeft: sidebarWidth }}>
        <div className="mx-auto max-w-[1480px] p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
