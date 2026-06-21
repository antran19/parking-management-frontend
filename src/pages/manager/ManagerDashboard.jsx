import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { staffApi, managerApi } from "../../api/parkingApi";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import gsap from "gsap";

// --- Icons ---
const IconDashboard = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const IconRevenue = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconOccupancy = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const IconLayout = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </svg>
);

const IconPricing = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconGates = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const IconVisits = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H3a2 2 0 01-2-2V5a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1a2 2 0 002 2h4a2 2 0 012 2v6a2 2 0 01-2 2z" />
  </svg>
);

const IconPayments = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
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

const Spinner = () => (
  <div className="flex justify-center items-center py-10">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);

export default function ManagerDashboard({ onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const containerRef = useRef(null);

  // States: Giờ & ngày
  const [liveDate, setLiveDate] = useState("");
  const [liveTime, setLiveTime] = useState("");
  const [toast, setToast] = useState(null);

  // Dữ liệu config (dùng chung cho tab công suất và CRUD)
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [zones, setZones] = useState([]);
  const [priceRules, setPriceRules] = useState([]);
  const [gates, setGates] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);

  // States CRUD
  const [newZone, setNewZone] = useState({ buildingId: "", floor: "Tầng 1", name: "", type: "XE_MAY", capacity: 100, priceRuleId: "" });
  const [editingPrice, setEditingPrice] = useState(null);

  // States dữ liệu từng tab
  const [dashboardData, setDashboardData] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [visitsData, setVisitsData] = useState(null);
  const [occupancyData, setOccupancyData] = useState(null); // data building/floors
  const [paymentsData, setPaymentsData] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState({
    dashboard: false,
    revenue: false,
    visits: false,
    occupancy: false,
    payments: false,
  });

  // Bộ lọc
  const [filterType, setFilterType] = useState("today"); // today, month, year, custom
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [paymentDetail, setPaymentDetail] = useState(null);

  const triggerToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Cập nhật ngày giờ
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setLiveDate(d.toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
      setLiveTime(d.toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // GSAP Animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".aside-panel", { x: -120, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: "power4.out" });
      gsap.fromTo(".main-content-area", { opacity: 0 }, { opacity: 1, duration: 0.6 });
      gsap.fromTo(".nav-link-item", { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out", delay: 0.25 });
      gsap.fromTo(".welcome-banner", { scale: 0.96, opacity: 0, y: 15 }, { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: "back.out(1.15)", delay: 0.3 });
      gsap.fromTo(".stat-card-item", { y: 35, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.65, stagger: 0.07, ease: "power3.out", delay: 0.45 });
      gsap.fromTo(".fade-up-element", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.1 });
    }, containerRef);
    return () => ctx.revert();
  }, [activeTab]);

  // Lấy config (buildings) lần đầu
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await staffApi.getParkingConfig();
        const config = res.data.data;
        if (config?.buildings?.length > 0) {
          setBuildings(config.buildings);
          setSelectedBuilding(config.buildings[0].id);
        }
        if (config?.floors) setFloors(config.floors);
        if (config?.zones) setZones(config.zones);
        if (config?.pricingRules) setPriceRules(config.pricingRules);
        if (config?.gates) setGates(config.gates);
        if (config?.vehicleTypes) setVehicleTypes(config.vehicleTypes);
      } catch (err) {
        // triggerToast("Lỗi lấy cấu hình hệ thống", "error");
      }
    };
    fetchConfig();
  }, []);

  // Gọi API tương ứng khi đổi tab hoặc đổi filter
  useEffect(() => {
    loadTabData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filterType, filterFrom, filterTo, selectedBuilding]);

  const loadTabData = async () => {
    const params = { type: filterType };
    if (filterType === "custom" && filterFrom && filterTo) {
      params.from = filterFrom;
      params.to = filterTo;
    }

    try {
      if (activeTab === "dashboard") {
        setLoading(prev => ({ ...prev, dashboard: true }));
        const res = await managerApi.getDashboard();
        setDashboardData(res.data.data);
        setLoading(prev => ({ ...prev, dashboard: false }));
      }
      else if (activeTab === "revenue") {
        setLoading(prev => ({ ...prev, revenue: true }));
        const res = await managerApi.getRevenue(params);
        setRevenueData(res.data.data);
        setLoading(prev => ({ ...prev, revenue: false }));
      }
      else if (activeTab === "visits") {
        setLoading(prev => ({ ...prev, visits: true }));
        const res = await managerApi.getVisits(params);
        setVisitsData(res.data.data);
        setLoading(prev => ({ ...prev, visits: false }));
      }
      else if (activeTab === "occupancy") {
        if (!selectedBuilding) return;
        setLoading(prev => ({ ...prev, occupancy: true }));
        const res = await managerApi.getBuildingOccupancy(selectedBuilding);
        const bData = res.data.data;
        
        // Lấy danh sách floors của building này
        const buildingFloors = floors.filter(f => f.buildingId === selectedBuilding);
        const floorPromises = buildingFloors.map(f => managerApi.getFloorOccupancy(f.id));
        const floorsRes = await Promise.all(floorPromises);
        
        bData.floorDetails = floorsRes.map(r => r.data.data);
        setOccupancyData(bData);
        setLoading(prev => ({ ...prev, occupancy: false }));
      }
      else if (activeTab === "payments") {
        setLoading(prev => ({ ...prev, payments: true }));
        const res = await managerApi.getPayments();
        setPaymentsData(res.data.data || []);
        setLoading(prev => ({ ...prev, payments: false }));
      }
    } catch (err) {
      triggerToast("Lỗi lấy dữ liệu từ server", "error");
      setLoading(prev => ({ ...prev, [activeTab]: false }));
    }
  };

  const handleViewPaymentDetail = async (id) => {
    try {
      const res = await managerApi.getPaymentDetail(id);
      setPaymentDetail(res.data.data);
      setSelectedPaymentId(id);
    } catch (err) {
      triggerToast("Không thể lấy chi tiết thanh toán", "error");
    }
  };

  const closePaymentModal = () => {
    setSelectedPaymentId(null);
    setPaymentDetail(null);
  };

  const syncConfig = async () => {
    try {
      const res = await staffApi.getParkingConfig();
      const config = res.data.data;
      if (config?.zones) setZones(config.zones);
      if (config?.pricingRules) setPriceRules(config.pricingRules);
      if (config?.gates) setGates(config.gates);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddZone = async (e) => {
    e.preventDefault();
    try {
      const floorId = floors.find(f => f.floorName === newZone.floor.replace("Tầng ", ""))?.id || floors[0]?.id;
      const vehicleTypeId = vehicleTypes.find(v => v.name === (newZone.type === "XE_MAY" ? "Xe máy" : "Ô tô"))?.id || vehicleTypes[0]?.id;
      
      const safeCode = `${newZone.name.trim().toUpperCase().replace(/\s+/g, "-")}-${newZone.type === "XE_MAY" ? "XM" : "OTO"}`.slice(0, 20);

      await managerApi.createZone({
        floorId,
        vehicleTypeId,
        zoneCode: safeCode,
        zoneName: newZone.name,
        capacity: newZone.capacity,
        status: "ACTIVE"
      });
      await syncConfig();
      setNewZone({ buildingId: buildings[0]?.id || "", floor: "Tầng 1", name: "", type: "XE_MAY", capacity: 100, priceRuleId: "" });
      triggerToast("Đã tạo khu vực mới thành công", "success");
    } catch (err) {
      let msg = err.response?.data?.message || "Tạo khu vực thất bại";
      if (msg.includes("duplicate key value violates unique constraint") || msg.includes("already exists")) {
        msg = "Mã khu vực này đã tồn tại trên cùng một tầng. Vui lòng đặt tên khác!";
      }
      triggerToast(msg, "error");
    }
  };

  const handleDeleteZone = async (id, name) => {
    if (!window.confirm(`Xác nhận xóa khu vực ${name}?`)) return;
    try {
      await managerApi.deleteZone(id);
      await syncConfig();
      triggerToast(`Đã xóa ${name}`, "success");
    } catch (err) {
      triggerToast(err.response?.data?.message || "Xóa khu vực thất bại", "error");
    }
  };

  const handlePriceUpdate = async (e) => {
    e.preventDefault();
    try {
      const rate = editingPrice.pricingType === "MONTHLY" ? editingPrice.pricePerUnit : editingPrice.pricePerUnit;
      await managerApi.updatePricingRule(editingPrice.id, {
        pricingType: editingPrice.pricingType,
        pricePerUnit: rate,
        freeMinutes: editingPrice.freeMinutes || 0
      });
      await syncConfig();
      setEditingPrice(null);
      triggerToast("Đã cập nhật bảng giá", "success");
    } catch (err) {
      triggerToast(err.response?.data?.message || "Cập nhật bảng giá thất bại", "error");
    }
  };

  const toggleGateStatus = async (gate) => {
    const newStatus = gate.isActive === false ? "ACTIVE" : "INACTIVE";
    try {
      await managerApi.updateGate(gate.id, { isActive: newStatus === "ACTIVE" });
      await syncConfig();
      triggerToast(`Đã ${newStatus === "ACTIVE" ? "kích hoạt" : "tạm dừng"} cổng`, "success");
    } catch (err) {
      triggerToast(err.response?.data?.message || "Cập nhật cổng thất bại", "error");
    }
  };

  // Mock dữ liệu cho biểu đồ Line/Bar vì API chỉ trả về tổng (Dựa vào tổng để chia đều mô phỏng biểu đồ)
  const generateChartData = (totalValue, count = 7) => {
    return Array.from({ length: count }).map((_, i) => ({
      name: `Ngày ${i + 1}`,
      value: Math.round(totalValue / count) + Math.floor(Math.random() * (totalValue * 0.1))
    }));
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans antialiased">
      
      {/* Toast Alert */}
      {toast && (
        <div className="fixed right-6 top-6 z-50 animate-bounce">
          <div className={`rounded-2xl border px-6 py-4 shadow-xl flex items-center gap-3 text-xs font-bold backdrop-blur-md ${toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-700 shadow-rose-100"
              : "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-emerald-100"
            }`}>
            <span>{toast.type === "error" ? "❌" : "✓"}</span>
            <p>{toast.msg}</p>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`aside-panel fixed left-0 top-0 bottom-0 z-50 flex h-screen flex-col bg-slate-900 text-white shadow-xl transition-all duration-300 ${collapsed ? "w-20" : "w-72"}`}>
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
          {[
            { id: "dashboard", label: "Tổng quan", icon: <IconDashboard /> },
            { id: "revenue", label: "Doanh thu", icon: <IconRevenue /> },
            { id: "occupancy", label: "Công suất", icon: <IconOccupancy /> },
            { id: "visits", label: "Lượt gửi xe", icon: <IconVisits /> },
            { id: "payments", label: "Thanh toán", icon: <IconPayments /> },
            { id: "layout", label: "Cấu hình bãi đỗ", icon: <IconLayout /> },
            { id: "pricing", label: "Biểu phí", icon: <IconPricing /> },
            { id: "gates", label: "Giám sát cổng", icon: <IconGates /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-link-item w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 cursor-pointer ${activeTab === tab.id
                  ? "bg-slate-800 text-blue-400 border border-slate-700 shadow-inner"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
            >
              {tab.icon}
              {!collapsed && <span className="whitespace-nowrap">{tab.label}</span>}
            </button>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-4 overflow-hidden">
          <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold text-rose-400 hover:bg-rose-955/30 hover:text-rose-300 transition-all duration-200 cursor-pointer">
            <IconLogout />
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
            <div className="flex items-center gap-3">
              <button className="relative rounded-full p-2.5 hover:bg-slate-100/80 transition-colors">
                <IconBell />
              </button>
              <button className="rounded-full p-2.5 hover:bg-slate-100/80 transition-colors">
                <IconSettings />
              </button>
            </div>
            <div className="flex items-center gap-3.5 border-l border-slate-200 pl-6">
              <div className="text-right hidden sm:block">
                <p className="font-semibold text-sm text-slate-900">Quản lý Hệ thống</p>
                <p className="text-xs text-slate-450 font-semibold tracking-wide uppercase">Manager</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-650 font-bold text-white shadow-md shadow-indigo-500/20">
                MG
              </div>
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <section className="flex-1 space-y-8 p-8">
          
          {/* TAB 1: TỔNG QUAN */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fade-in-fast">
              <div className="welcome-banner relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="absolute right-0 top-0 -mr-24 -mt-24 h-64 w-64 rounded-full bg-indigo-500/5 blur-3xl" />
                <div className="space-y-2 max-w-2xl relative z-10">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Xin chào, Quản lý!</h3>
                  <p className="text-slate-500 leading-relaxed text-xs">
                    Đây là báo cáo tổng quan hoạt động bãi đỗ xe theo thời gian thực (Real-time).
                  </p>
                </div>
              </div>

              {loading.dashboard ? <Spinner /> : dashboardData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="stat-card-item rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Doanh thu hôm nay</span>
                      <span className="text-sm bg-indigo-50 p-2.5 rounded-xl border border-indigo-100">💰</span>
                    </div>
                    <div className="mt-4 flex flex-col">
                      <span className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">{(dashboardData.todayRevenue || 0).toLocaleString("vi-VN")} đ</span>
                    </div>
                  </div>

                  <div className="stat-card-item rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Session Active</span>
                      <span className="text-sm bg-blue-50 p-2.5 rounded-xl border border-blue-100">🚗</span>
                    </div>
                    <div className="mt-4 flex flex-col">
                      <span className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">{dashboardData.activeSessions || 0} xe</span>
                    </div>
                  </div>

                  <div className="stat-card-item rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Tỷ lệ lấp đầy</span>
                      <span className="text-sm bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">🏢</span>
                    </div>
                    <div className="mt-4 flex flex-col">
                      <span className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">{dashboardData.occupancyPercent || 0}%</span>
                    </div>
                  </div>

                  <div className="stat-card-item rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Lượt xe hoàn thành</span>
                      <span className="text-sm bg-teal-50 p-2.5 rounded-xl border border-teal-100">✅</span>
                    </div>
                    <div className="mt-4 flex flex-col">
                      <span className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">{dashboardData.completedSessionsToday || 0} lượt</span>
                    </div>
                  </div>

                  <div className="stat-card-item rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Sự cố an ninh hôm nay</span>
                      <span className="text-sm bg-amber-50 p-2.5 rounded-xl border border-amber-100">⚠️</span>
                    </div>
                    <div className="mt-4 flex flex-col">
                      <span className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">{dashboardData.securityIncidentsToday || 0} vụ</span>
                    </div>
                  </div>

                  <div className={`stat-card-item rounded-2xl border p-5 shadow-sm transition-all duration-200 ${dashboardData.activeEmergency ? 'bg-rose-50 border-rose-200 animate-pulse' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Trạng thái SOS</span>
                      <span className="text-sm bg-rose-100 p-2.5 rounded-xl border border-rose-200">🚨</span>
                    </div>
                    <div className="mt-4 flex flex-col">
                      <span className={`text-xl font-extrabold font-mono tracking-tight ${dashboardData.activeEmergency ? 'text-rose-600' : 'text-slate-900'}`}>
                        {dashboardData.activeEmergency ? "CÓ BÁO ĐỘNG" : "An toàn"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DOANH THU */}
          {activeTab === "revenue" && (
            <div className="space-y-6 fade-up-element">
              {/* Bộ lọc */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="today">Hôm nay</option>
                  <option value="month">Tháng này</option>
                  <option value="year">Năm nay</option>
                  <option value="custom">Tùy chỉnh</option>
                </select>
                {filterType === "custom" && (
                  <>
                    <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                    <span>đến</span>
                    <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                  </>
                )}
              </div>

              {loading.revenue ? <Spinner /> : revenueData && (
                <>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Biểu đồ doanh thu</h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={generateChartData(revenueData.totalRevenue)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#94a3b8" />
                          <YAxis tick={{fontSize: 12}} stroke="#94a3b8" width={80} tickFormatter={(val) => val.toLocaleString('vi-VN')} />
                          <RechartsTooltip formatter={(value) => [`${value.toLocaleString('vi-VN')} đ`, 'Doanh thu']} />
                          <Legend />
                          <Line type="monotone" dataKey="value" name="Doanh thu" stroke="#6366f1" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Tổng quan doanh thu</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold">
                          <tr>
                            <th className="px-6 py-3 rounded-tl-lg">Thời gian</th>
                            <th className="px-6 py-3">Tổng số phiên</th>
                            <th className="px-6 py-3 rounded-tr-lg">Tổng tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-6 py-4">{new Date(revenueData.from).toLocaleDateString('vi-VN')} - {new Date(revenueData.to).toLocaleDateString('vi-VN')}</td>
                            <td className="px-6 py-4">{revenueData.totalSessions}</td>
                            <td className="px-6 py-4 font-bold text-indigo-650">{(revenueData.totalRevenue || 0).toLocaleString('vi-VN')} đ</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: CÔNG SUẤT */}
          {activeTab === "occupancy" && (
            <div className="space-y-6 fade-up-element">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <span className="font-bold text-sm">Chọn tòa nhà:</span>
                <select 
                  value={selectedBuilding} 
                  onChange={(e) => setSelectedBuilding(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">-- Chọn tòa nhà --</option>
                  {buildings.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {loading.occupancy ? <Spinner /> : occupancyData && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-8">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{occupancyData.name}</h3>
                      <p className="text-sm text-slate-500 mt-1">Tổng công suất tòa nhà</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-indigo-650">{occupancyData.percent}%</p>
                      <p className="text-xs text-slate-500">{occupancyData.totalOccupied} / {occupancyData.totalCapacity} chỗ</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <h4 className="font-bold text-slate-700">Chi tiết các tầng</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(occupancyData.floorDetails || []).map((floor, idx) => {
                        const pct = floor.percent || 0;
                        let barColor = "bg-emerald-500";
                        if (pct > 75 && pct < 95) barColor = "bg-amber-500";
                        else if (pct >= 95) barColor = "bg-rose-500";

                        return (
                          <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-sm text-slate-800">{floor.floorName}</span>
                              <span className="text-xs font-mono font-bold">{floor.occupied} / {floor.capacity}</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <div className="text-[10px] font-bold text-slate-500 text-right">Lấp đầy: {pct}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LƯỢT GỬI XE */}
          {activeTab === "visits" && (
            <div className="space-y-6 fade-up-element">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 outline-none"
                >
                  <option value="today">Hôm nay</option>
                  <option value="month">Tháng này</option>
                  <option value="year">Năm nay</option>
                  <option value="custom">Tùy chỉnh</option>
                </select>
                {filterType === "custom" && (
                  <>
                    <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                    <span>đến</span>
                    <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                  </>
                )}
              </div>

              {loading.visits ? <Spinner /> : visitsData && (
                <>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Biểu đồ Lượt gửi xe</h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={generateChartData(visitsData.totalSessions, 7)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#94a3b8" />
                          <YAxis tick={{fontSize: 12}} stroke="#94a3b8" />
                          <RechartsTooltip formatter={(value) => [`${value} lượt`, 'Lượt gửi']} cursor={{fill: '#f8fafc'}} />
                          <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 5: THANH TOÁN */}
          {activeTab === "payments" && (
            <div className="space-y-6 fade-up-element">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Danh sách Giao dịch</h3>
                {loading.payments ? <Spinner /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4">Mã GD</th>
                          <th className="px-6 py-4">Số tiền</th>
                          <th className="px-6 py-4">Phương thức</th>
                          <th className="px-6 py-4">Trạng thái</th>
                          <th className="px-6 py-4">Thời gian</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentsData.length === 0 ? (
                          <tr><td colSpan="5" className="text-center py-8 text-slate-500">Chưa có dữ liệu</td></tr>
                        ) : (
                          paymentsData.map(p => (
                            <tr key={p.id} onClick={() => handleViewPaymentDetail(p.id)} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                              <td className="px-6 py-4 font-mono text-xs">{p.transactionId || p.id.split('-')[0]}</td>
                              <td className="px-6 py-4 font-bold text-indigo-650">{Number(p.amount).toLocaleString('vi-VN')} đ</td>
                              <td className="px-6 py-4">{p.paymentMethod}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${p.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                  {p.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-xs">{new Date(p.createdAt).toLocaleString('vi-VN')}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: LAYOUT (CẤU HÌNH BÃI ĐỖ) */}
          {activeTab === "layout" && (
            <div className="space-y-8 fade-up-element">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Cấu hình Thiết lập Bãi đỗ xe</h3>
                  <p className="text-xs text-slate-500 mt-1">Cập nhật danh sách cơ sở, phân chia tầng và gán định mức sức chứa.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Tạo Khu vực */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-800 mb-5">Thêm phân khu mới</h4>
                    <form onSubmit={handleAddZone} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Tên khu vực (Zone)</label>
                        <input required type="text" value={newZone.name} onChange={e => setNewZone({...newZone, name: e.target.value})} placeholder="VD: Khu A1" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-slate-50 focus:bg-white" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1.5">Tầng (Floor)</label>
                          <select value={newZone.floor} onChange={e => setNewZone({...newZone, floor: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50">
                            {floors.map(f => <option key={f.id} value={`Tầng ${f.floorName}`}>Tầng {f.floorName}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1.5">Loại xe</label>
                          <select value={newZone.type} onChange={e => setNewZone({...newZone, type: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-slate-50">
                            <option value="XE_MAY">Xe máy</option>
                            <option value="O_TO">Ô tô</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">Sức chứa tối đa (Capacity)</label>
                        <input required type="number" min="1" value={newZone.capacity} onChange={e => setNewZone({...newZone, capacity: parseInt(e.target.value) || 0})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white" />
                      </div>
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-4 py-3 rounded-xl transition-all shadow-sm shadow-indigo-600/20 mt-2">
                        + Tạo phân khu
                      </button>
                    </form>
                  </div>
                </div>

                {/* Danh sách Zones */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h4 className="text-sm font-bold text-slate-800">Danh sách phân khu đang hoạt động</h4>
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">{zones.length} khu vực</span>
                    </div>
                    <div className="flex-1 overflow-auto p-0">
                      <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-white sticky top-0 z-10 shadow-sm">
                          <tr>
                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-slate-400">Khu vực</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-slate-400">Vị trí</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-slate-400">Loại xe</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-slate-400 text-right">Sức chứa</th>
                            <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-slate-400 text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {zones.map(zone => (
                            <tr key={zone.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="px-6 py-4 font-bold text-slate-800">{zone.zoneName || `Khu ${zone.zoneCode}`}</td>
                              <td className="px-6 py-4">Tầng {zone.floorName || "B1"}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${zone.vehicleTypeName === "Ô tô" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                  {zone.vehicleTypeName === "Ô tô" ? "🚗 Ô tô" : "🏍️ Xe máy"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">{zone.capacity}</td>
                              <td className="px-6 py-4 text-right">
                                <button onClick={() => handleDeleteZone(zone.id, zone.zoneName)} className="text-[10px] font-bold text-rose-500 hover:text-white border border-rose-200 hover:bg-rose-500 px-3 py-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                  Xóa
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PRICING (BIỂU PHÍ) */}
          {activeTab === "pricing" && (
            <div className="space-y-8 fade-up-element">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Cấu hình Biểu phí (Pricing Rules)</h3>
                <p className="text-xs text-slate-500 mt-1">Thiết lập giá cước theo giờ, ngày, tháng cho từng loại phương tiện.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {priceRules.map(rule => (
                  <div key={rule.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <span className="text-6xl">{rule.vehicleTypeName === "Ô tô" ? "🚗" : "🏍️"}</span>
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${rule.vehicleTypeName === "Ô tô" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                          {rule.vehicleTypeName}
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{rule.pricingType}</span>
                      </div>
                      
                      <h4 className="text-3xl font-black text-slate-800 font-mono tracking-tighter mb-1">
                        {Number(rule.pricePerUnit).toLocaleString("vi-VN")} <span className="text-base text-slate-400 font-bold">đ</span>
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mb-6">
                        {rule.pricingType === "HOURLY" ? "Mỗi giờ tiếp theo" : rule.pricingType === "MONTHLY" ? "Mỗi tháng" : "Mỗi ngày"} 
                        {rule.freeMinutes > 0 && ` • Miễn phí ${rule.freeMinutes} phút đầu`}
                      </p>
                      
                      <button 
                        onClick={() => setEditingPrice(rule)}
                        className="w-full py-2.5 rounded-xl border border-indigo-200 text-indigo-600 text-xs font-bold hover:bg-indigo-50 transition-colors"
                      >
                        Sửa giá
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Form sửa giá (Modal inline) */}
              {editingPrice && (
                <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center animate-fade-in-fast p-4">
                  <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-slide-up">
                    <h4 className="text-lg font-black text-slate-800 mb-4">Cập nhật bảng giá</h4>
                    <form onSubmit={handlePriceUpdate} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Loại phương tiện</label>
                        <input disabled type="text" value={editingPrice.vehicleTypeName} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-100 text-slate-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Loại vé ({editingPrice.pricingType})</label>
                        <input disabled type="text" value={editingPrice.pricingType} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-100 text-slate-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Đơn giá (VNĐ)</label>
                        <input required type="number" min="0" step="1000" value={editingPrice.pricePerUnit} onChange={e => setEditingPrice({...editingPrice, pricePerUnit: e.target.value})} className="w-full border border-indigo-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50/30 font-mono font-bold text-indigo-700" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Phút miễn phí đầu tiên</label>
                        <input required type="number" min="0" value={editingPrice.freeMinutes || 0} onChange={e => setEditingPrice({...editingPrice, freeMinutes: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setEditingPrice(null)} className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors">Hủy</button>
                        <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-600/20 transition-all">Lưu thay đổi</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: GATES (GIÁM SÁT CỔNG) */}
          {activeTab === "gates" && (
            <div className="space-y-8 fade-up-element">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Giám sát Trạm Barrier & Cổng chính</h3>
                  <p className="text-xs text-slate-500 mt-1">Điều khiển thiết bị cổng và quản lý trạng thái luồng ra/vào.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gates.map(gate => (
                  <div key={gate.id} className={`bg-white rounded-3xl border p-6 shadow-sm transition-all ${gate.isActive === false ? 'border-rose-200 bg-rose-50/30 opacity-80' : 'border-slate-200 hover:border-indigo-200 hover:shadow-md'}`}>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-lg font-black text-slate-800">{gate.gateName || gate.gateCode}</h4>
                        <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">{gate.gateType}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${gate.isActive !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {gate.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-6">
                      <div className={`w-3 h-3 rounded-full ${gate.isActive !== false ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
                      <div className="text-xs font-semibold text-slate-600">
                        Camera LPR: <span className="text-slate-800 font-bold">Sẵn sàng</span><br/>
                        Barrier: <span className="text-slate-800 font-bold">{gate.isActive !== false ? 'Đang mở luồng' : 'Khóa đóng'}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => toggleGateStatus(gate)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${gate.isActive !== false ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100'}`}
                      >
                        {gate.isActive !== false ? 'Khóa cổng (Disable)' : 'Mở cổng (Enable)'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </section>
      </main>

      {/* Modal Chi tiết Thanh toán */}
      {selectedPaymentId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fade-in-fast">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-bold">Chi tiết thanh toán</h3>
              <button onClick={closePaymentModal} className="text-indigo-200 hover:text-white transition-colors cursor-pointer">✕</button>
            </div>
            <div className="p-6">
              {!paymentDetail ? <Spinner /> : (
                <div className="space-y-4 text-sm text-slate-700">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold">Mã GD:</span>
                    <span className="font-mono">{paymentDetail.transactionId || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold">Số tiền:</span>
                    <span className="font-bold text-indigo-650">{Number(paymentDetail.amount).toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold">Phương thức:</span>
                    <span>{paymentDetail.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="font-semibold">Trạng thái:</span>
                    <span className={`font-bold ${paymentDetail.status === 'COMPLETED' ? 'text-emerald-600' : 'text-rose-600'}`}>{paymentDetail.status}</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="font-semibold">Thời gian thanh toán:</span>
                    <span>{paymentDetail.paidAt ? new Date(paymentDetail.paidAt).toLocaleString('vi-VN') : 'N/A'}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-slate-50 px-6 py-4 text-right">
              <button onClick={closePaymentModal} className="px-4 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
