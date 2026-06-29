import React, { useState, useEffect, useRef, createContext } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { staffApi } from "../../api/parkingApi";
import { IconDashboard, IconRevenue, IconOccupancy, IconVisits, IconPayments, IconPricing, IconGates } from "../components/Icons"; // adjust path if needed

export const ManagerContext = createContext(null);

const ManagerLayout = ({ onLogout }) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const containerRef = useRef(null);

  // Header date/time
  const [liveDate, setLiveDate] = useState("");
  const [liveTime, setLiveTime] = useState("");

  // Toast handling
  const [toast, setToast] = useState(null);
  const triggerToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Shared configuration data
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [zones, setZones] = useState([]);
  const [priceRules, setPriceRules] = useState([]);
  const [gates, setGates] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);

  const fetchConfig = async () => {
    try {
      const res = await staffApi.getParkingConfig();
      const cfg = res.data.data;
      if (cfg?.buildings?.length > 0) setBuildings(cfg.buildings);
      if (cfg?.floors) setFloors(cfg.floors);
      if (cfg?.zones) setZones(cfg.zones);
      if (cfg?.pricingRules) setPriceRules(cfg.pricingRules);
      if (cfg?.gates) setGates(cfg.gates);
      if (cfg?.vehicleTypes) setVehicleTypes(cfg.vehicleTypes);
    } catch (err) {
      console.error("Failed to fetch parking config", err);
    }
  };

  const syncConfig = async () => {
    await fetchConfig();
  };

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setLiveDate(d.toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
      setLiveTime(d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchConfig();
  }, []);

  const tabs = [
    { id: "dashboard", label: "Tổng quan", icon: <IconDashboard />, path: "/manager" },
    { id: "revenue", label: "Doanh thu", icon: <IconRevenue />, path: "/manager/revenue" },
    { id: "capacity", label: "Công suất", icon: <IconOccupancy />, path: "/manager/capacity" },
    { id: "traffic", label: "Lượt gửi xe", icon: <IconVisits />, path: "/manager/traffic" },
    { id: "payments", label: "Thanh toán", icon: <IconPayments />, path: "/manager/payments" },
    { id: "pricing", label: "Biểu phí", icon: <IconPricing />, path: "/manager/pricing" },
    { id: "gates", label: "Giám sát cổng", icon: <IconGates />, path: "/manager/gates" },
    { id: "security", label: "An ninh", icon: <IconGates />, path: "/manager/security" },
  ];

  return (
    <ManagerContext.Provider value={{ buildings, setBuildings, floors, setFloors, zones, setZones, priceRules, setPriceRules, gates, setGates, vehicleTypes, setVehicleTypes, syncConfig, triggerToast, toast }}>
      <div ref={containerRef} className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans antialiased">
        {/* Sidebar */}
        <aside className={`aside-panel fixed left-0 top-0 bottom-0 z-50 flex h-screen flex-col bg-slate-900 text-white transition-all duration-300 ${collapsed ? "w-20" : "w-72"}`}>
          <div className="flex items-center gap-3.5 px-6 py-6 border-b border-slate-800 overflow-hidden relative">
            <button onClick={() => setCollapsed(!collapsed)} className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-650 text-white shadow-md shadow-blue-500/20 font-black text-lg flex-shrink-0 cursor-pointer">
              M
            </button>
            {!collapsed && (
              <div className="animate-fade-in-fast">
                <h1 className="text-md font-extrabold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent whitespace-nowrap">Smart Parking</h1>
                <p className="text-xs text-blue-400 font-semibold tracking-wider uppercase whitespace-nowrap">Quản lý cấp cao</p>
              </div>
            )}
          </div>
          <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-x-hidden">
            {tabs.map(tab => (
              <NavLink key={tab.id} to={tab.path} className={({ isActive }) => `nav-link-item w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 cursor-pointer ${isActive ? "bg-slate-800 text-blue-400 border border-slate-700 shadow-inner" : "text-slate-400 hover:bg-slate-800 hover:text-white"}` }>
                {tab.icon}
                {!collapsed && <span className="whitespace-nowrap">{tab.label}</span>}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-slate-800 p-4 overflow-hidden">
            <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold text-rose-400 hover:bg-rose-955/30 hover:text-rose-300 transition-all duration-200 cursor-pointer">
              <span>🔓</span>
              {!collapsed && <span className="whitespace-nowrap">Đăng xuất</span>}
            </button>
          </div>
        </aside>
        {/* Main Content */}
        <main className={`main-content-area flex-1 min-h-screen flex flex-col transition-all duration-300 ${collapsed ? "ml-20" : "ml-72"}`}>
          {/* Header */}
          <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/80 px-8 backdrop-blur-md">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Khu vực quản lý vận hành</h2>
              <p className="text-xs text-slate-500 mt-0.5">{liveDate}</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end border-r border-slate-200 pr-6">
                <span className="font-mono text-lg font-bold text-indigo-650 bg-indigo-50/50 px-3 py-1 rounded-lg border border-indigo-100">{liveTime}</span>
              </div>
            </div>
          </header>
          {/* Toast */}
          {toast && (
            <div className="fixed right-6 top-6 z-50 animate-bounce">
              <div className={`rounded-2xl border px-6 py-4 shadow-xl flex items-center gap-3 text-xs font-bold backdrop-blur-md ${toast.type === "error" ? "bg-rose-50 border-rose-200 text-rose-700 shadow-rose-100" : "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-emerald-100"}`}>
                <span>{toast.type === "error" ? "❌" : "✓"}</span>
                <p>{toast.msg}</p>
              </div>
            </div>
          )}
          {/* Page Content */}
          <Outlet />
        </main>
      </div>
    </ManagerContext.Provider>
  );
};

export default ManagerLayout;
