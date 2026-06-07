// src/components/DriverSidebar.jsx

import { Link, useNavigate } from "react-router-dom";

export default function DriverSidebar({ active, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    if (onLogout) {
      onLogout();
    }

    navigate("/login", { replace: true });
  };

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-64 flex-col bg-slate-900 text-white">
      <div className="p-6">
        <h1 className="text-xl font-bold">Smart Park</h1>
        <p className="mb-8 text-xs text-slate-400">CỔNG TÀI XẾ</p>

        <nav className="space-y-1">
          <MenuItem
            to="/driver/dashboard"
            label="Bảng điều khiển"
            active={active === "dashboard"}
          />

          <MenuItem
            to="/driver/map"
            label="Sơ đồ bãi xe"
            active={active === "map"}
          />

          <MenuItem
            to="/driver/reservation"
            label="Đặt chỗ trước"
            active={active === "reservation"}
          />

          <MenuItem
            to="/driver/pass"
            label="Mua vé gửi xe"
            active={active === "pass"}
          />

          <MenuItem
            to="/driver/active-pass"
            label="Vé đang active"
            active={active === "active-pass"}
          />

          <MenuItem
            to="/driver/payment"
            label="Thanh toán"
            active={active === "payment"}
          />

          <MenuItem
            to="/driver/history"
            label="Lịch sử gửi xe"
            active={active === "history"}
          />
        </nav>
      </div>

      <div className="mt-auto p-6">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-lg px-4 py-3 text-left font-medium text-slate-400 hover:bg-white/5 hover:text-white"
        >
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}

function MenuItem({ to, label, active }) {
  return (
    <Link
      to={to}
      className={`block rounded-lg px-4 py-3 font-medium ${
        active
          ? "border-l-4 border-blue-600 bg-white/10 text-white"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}