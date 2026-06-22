import React, { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import gsap from "gsap";
import { staffApi } from "../../api/parkingApi";
import BlacklistPage from "./BlacklistPage";

gsap.config({ nullTargetWarn: false });
import EmergencyPage from "./EmergencyPage";
import ExceptionLogsPage from "./ExceptionLogsPage";


/**
 * SecurityDashboard — Dashboard bảo vệ (Thiên phụ trách)
 *
 * TODO (Thiên): Implement:
 * 1. Tab Giám sát cổng: WebSocket listener, duyệt xe ra/vào
 * 2. Tab Báo cáo sự cố: Form báo sự cố + danh sách sự cố đã ghi
 * 3. Tab SOS khẩn cấp: Nút kích hoạt/hủy SOS + lịch sử SOS
 * 4. Tab Blacklist: CRUD biển số đen + lý do
 * 5. WebSocket listeners: /topic/emergency, /topic/blacklist
 */

// Danh sách 5 cổng barrier mặc định dùng khi backend chưa trả về đủ gate
const DEFAULT_GATES = [
  { id: "gate-1", gateName: "Tầng A1", gateCode: "BASEMENT_A1", gateType: "BOTH", isActive: true, barrier: "CLOSED", buildingId: "BLD_1" },
  { id: "gate-2", gateName: "Tầng A2", gateCode: "BASEMENT_A2", gateType: "BOTH", isActive: true, barrier: "CLOSED", buildingId: "BLD_1" },
  { id: "gate-3", gateName: "Tầng B1", gateCode: "BASEMENT_B1", gateType: "BOTH", isActive: true, barrier: "CLOSED", buildingId: "BLD_1" },
  { id: "gate-4", gateName: "Tầng B2", gateCode: "BASEMENT_B2", gateType: "BOTH", isActive: true, barrier: "CLOSED", buildingId: "BLD_1" },
  { id: "gate-5", gateName: "Tầng C", gateCode: "BASEMENT_C", gateType: "BOTH", isActive: true, barrier: "CLOSED", buildingId: "BLD_1" },
];

// ==============================================================
// ICONS — SVG inline, giống hệt project cũ
// ==============================================================
const IconOverview = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const IconBlacklist = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

const IconLogs = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const IconSOS = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const IconLogout = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

// ==============================================================
// Stat card — hiển thị số liệu tổng quan
// ==============================================================
function Stat({ title, value, tone }) {
  const tones = {
    red: "border-red-100 bg-red-50/30 text-red-700",
    blue: "border-blue-100 bg-blue-50/30 text-blue-700",
    amber: "border-amber-100 bg-amber-50/30 text-amber-700",
    emerald: "border-emerald-100 bg-emerald-50/30 text-emerald-700",
  };
  return (
    <div className={`stat-card-item rounded-2xl border p-5 shadow-sm space-y-2.5 transition-all hover:translate-y-[-2px] duration-200 bg-white ${tones[tone]}`}>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{title}</p>
      <p className="text-xl font-black text-slate-900 tracking-tight">{value}</p>
    </div>
  );
}

// ==============================================================
// Panel container — dùng chung cho tất cả tab
// ==============================================================
function Panel({ title, children, className }) {
  return (
    <div className={`action-panel-item rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className || ""}`}>
      <h3 className="mb-5 text-base font-bold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

// ==============================================================
// COMPONENT CHÍNH — Security Dashboard (Thiên phụ trách)
// ==============================================================
export default function SecurityDashboard({ onLogout }) {
  // Lấy thông tin user từ localStorage (đã được set khi đăng nhập)
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const fullName = user.fullName || "Bảo vệ";
  const userRole = String(user.role || "").toUpperCase();

  const containerRef = useRef(null);
  const stompClientRef = useRef(null);

  // State giao diện chính
  const [collapsed, setCollapsed] = useState(window.innerWidth < 768);
  const [activeTab, setActiveTab] = useState("overview");
  const [liveTime, setLiveTime] = useState("");
  const [liveDate, setLiveDate] = useState("");

  // Toast notification toàn cục — truyền xuống cho các tab con
  const [toast, setToast] = useState(null);

  // Trạng thái SOS — dùng chung, chia sẻ với EmergencyPage
  const [emergencyStatus, setEmergencyStatus] = useState({ active: false });

  // Cảnh báo xe blacklist cố gắng vào bãi — popup khẩn cấp
  const [blacklistAlert, setBlacklistAlert] = useState(null);


  // Dữ liệu tổng quan cho tab Giám sát
  const [overviewStats, setOverviewStats] = useState({
    gates: [],
    zones: [],
    blacklistCount: 0,
    logCount: 0,
  });
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Hàm hiển thị toast notification (dùng chung cho toàn dashboard)
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  // Phát âm thanh cảnh báo bằng Web Audio API
  const playAlarm = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const gain = ctx.createGain();
      gain.gain.value = 0.08;
      gain.connect(ctx.destination);
      [0, 220, 440].forEach((delay) => {
        const oscillator = ctx.createOscillator();
        oscillator.type = "square";
        oscillator.frequency.value = 880;
        oscillator.connect(gain);
        oscillator.start(ctx.currentTime + delay / 1000);
        oscillator.stop(ctx.currentTime + delay / 1000 + 0.16);
      });
      window.setTimeout(() => ctx.close().catch(() => { }), 1200);
    } catch (err) {
      console.warn("Cannot play browser alarm:", err);
    }
  };

  // Fetch dữ liệu cho tab Giám sát (stat cards + danh sách cổng)
  const fetchOverview = async () => {
    setLoadingOverview(true);
    try {
      const [configRes, blacklistRes, logsRes, statusRes] = await Promise.allSettled([
        staffApi.getParkingConfig(),
        staffApi.getBlacklist(),
        staffApi.getSecurityExceptions(),
        staffApi.getEmergencyStatus(),
      ]);

      const fetchedGates = configRes.status === "fulfilled" ? (configRes.value.data.data?.gates || []) : [];

      setOverviewStats({
        gates: fetchedGates.length > 0 ? fetchedGates : DEFAULT_GATES,
        zones: configRes.status === "fulfilled" ? (configRes.value.data.data?.zones || []) : [],
        blacklistCount:
          blacklistRes.status === "fulfilled"
            ? (blacklistRes.value.data.data || []).filter((p) => p.isActive !== false).length
            : 0,
        logCount:
          logsRes.status === "fulfilled" ? (logsRes.value.data.data || []).length : 0,
      });

      // Cập nhật trạng thái SOS từ API (nếu fetch thành công)
      if (statusRes.status === "fulfilled") {
        setEmergencyStatus(statusRes.value.data.data || { active: false });
      }
    } catch (err) {
      console.error("Fetch overview failed:", err);
    } finally {
      setLoadingOverview(false);
    }
  };

  const handleDeactivateSOS = async () => {
    if (userRole !== "SECURITY" && userRole !== "MANAGER" && userRole !== "ADMIN") {
      showToast("Chỉ Security/Manager/Admin được hủy SOS.", "error");
      return;
    }
    if (!user.id) {
      showToast("Thiếu user.id, vui lòng đăng nhập lại.", "error");
      return;
    }
    try {
      const res = await staffApi.deactivateEmergency({
        deactivatedByUserId: user.id,
        notes: `SOS cancelled from dashboard top banner by ${fullName}`,
      });
      setEmergencyStatus(res.data.data || { active: false });
      showToast("✅ SOS đã được hủy", "success");
      fetchOverview();
    } catch (err) {
      showToast(err.response?.data?.message || "Hủy SOS thất bại", "error");
    }
  };

  // GSAP Animation — chạy lại mỗi khi chuyển tab (giống project cũ)
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Sidebar slide vào từ trái
      gsap.fromTo(".aside-panel", { x: -120, opacity: 0 }, { x: 0, opacity: 1, duration: 0.9, ease: "power4.out" });
      // Main content fade in
      gsap.fromTo(".main-content-area", { opacity: 0 }, { opacity: 1, duration: 0.6 });
      // Nav links stagger từ trái
      gsap.fromTo(".nav-link-item", { x: -40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out", delay: 0.25 });
      // Welcome banner scale bounce
      gsap.fromTo(".welcome-banner", { scale: 0.96, opacity: 0, y: 15 }, { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: "back.out(1.15)", delay: 0.3 });
      // Stat cards stagger bounce
      gsap.fromTo(".stat-card-item", { y: 35, opacity: 0, scale: 0.98 }, { y: 0, opacity: 1, scale: 1, duration: 0.65, stagger: 0.07, ease: "power3.out", delay: 0.45 });
      // Action panels slide lên
      gsap.fromTo(".action-panel-item", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75, stagger: 0.1, ease: "power3.out", delay: 0.65 });
    }, containerRef);
    return () => ctx.revert();
  }, [activeTab]);

  // Cập nhật đồng hồ + fetch dữ liệu overview khi mount
  useEffect(() => {
    fetchOverview();
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    setLiveDate(new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
    return () => clearInterval(timer);
  }, []);

  // Kết nối WebSocket để nhận cảnh báo real-time
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => { if (str.includes("ERROR")) console.error("[SECURITY-STOMP]", str); },
    });

    client.onConnect = () => {
      // Lắng nghe sự kiện SOS khẩn cấp broadcast toàn hệ thống
      client.subscribe("/topic/emergency", (message) => {
        try {
          const data = JSON.parse(message.body);
          const active = Boolean(data.active);
          setEmergencyStatus({ active, ...data });
          showToast(active ? "🚨 SOS đã được kích hoạt toàn hệ thống" : "✅ SOS đã được hủy", active ? "danger" : "success");
          if (active) playAlarm();
          // Refresh overview stats sau sự kiện SOS
          fetchOverview();
        } catch (err) {
          console.error("Emergency WS parse error:", err);
        }
      });

      // Lắng nghe cảnh báo xe blacklist cố gắng qua cổng
      client.subscribe("/topic/security/blacklist-alerts", (message) => {
        try {
          const data = JSON.parse(message.body);
          setBlacklistAlert(data);
          playAlarm();
          showToast(`🚫 Phát hiện xe blacklist: ${data.licensePlate}`, "danger");
        } catch (err) {
          console.error("Blacklist WS parse error:", err);
        }
      });
    };

    client.activate();
    stompClientRef.current = client;
    return () => { if (client.active) client.deactivate(); };
  }, []);

  // Tính số liệu cho stat cards
  const openGates = overviewStats.gates.filter((g) => g.isActive).length;

  // Danh sách các tab trong sidebar
  const NAV_TABS = [
    { key: "overview", label: "Giám sát an ninh", Icon: IconOverview },
    { key: "exception", label: "Sự cố an ninh", Icon: IconLogs },
    { key: "emergency", label: "SOS Khẩn cấp", Icon: IconSOS },
    { key: "blacklist", label: "Danh sách đen", Icon: IconBlacklist },
  ];

  return (
    <div ref={containerRef} className={`min-h-screen w-full overflow-x-hidden bg-[#f8fafc] text-slate-900 flex font-sans ${emergencyStatus.active ? "animate-pulse" : ""}`}>

      {/* Toast notification — góc trên phải */}
      {toast && (
        <div className={`fixed right-5 top-5 z-[80] rounded-xl px-5 py-3 text-sm font-bold text-white shadow-xl transition-all ${toast.type === "danger" || toast.type === "error" ? "bg-red-600" : toast.type === "warning" ? "bg-amber-500" : "bg-emerald-600"}`}>
          {toast.message}
        </div>
      )}

      {/* Banner SOS khẩn cấp — cố định trên cùng khi active */}
      {emergencyStatus.active && (
        <div className="fixed inset-x-0 top-0 z-[70] border-b-4 border-red-300 bg-red-700 px-4 md:px-6 py-3 shadow-2xl flex flex-col md:flex-row items-center justify-between">
          <div className="text-white text-left">
            <p className="text-xl md:text-2xl font-black tracking-wide">🚨 {emergencyStatus.message || "KHẨN CẤP — TOÀN BỘ BARRIER ĐÃ MỞ — SƠ TÁN NGAY"}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.35em] text-red-100">
              Hệ thống bị khóa thao tác thường cho đến khi Security/Manager/Admin hủy SOS
            </p>
          </div>
          {(userRole === "SECURITY" || userRole === "MANAGER" || userRole === "ADMIN") && (
            <button
              onClick={handleDeactivateSOS}
              className="mt-3 md:mt-0 rounded-xl bg-white px-5 py-2.5 text-sm font-black text-red-700 shadow-lg hover:bg-red-50 transition-colors whitespace-nowrap"
            >
              ✕ Hủy SOS
            </button>
          )}
        </div>
      )}

      {/* Popup cảnh báo xe blacklist cố gắng vào bãi — toàn màn hình */}
      {blacklistAlert && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-red-950/90 p-6 backdrop-blur-md">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border-4 border-red-300 bg-red-700 p-8 text-white shadow-[0_0_80px_rgba(239,68,68,0.85)]">
            <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
            <p className="text-xs md:text-sm font-black uppercase tracking-[0.45em] text-red-100">Blacklist Alert</p>
            <h2 className="mt-2 md:mt-3 text-3xl md:text-5xl font-black">🚫 XE BLACKLIST</h2>
            <div className="mt-4 md:mt-6 grid gap-3 md:gap-4 rounded-2xl bg-black/20 p-4 md:p-5 text-left text-sm md:text-base">
              <p><span className="text-red-100">Biển số:</span> <span className="font-mono text-3xl font-black">{blacklistAlert.licensePlate}</span></p>
              <p><span className="text-red-100">Lý do:</span> <span className="font-bold">{blacklistAlert.reason}</span></p>
              <p><span className="text-red-100">Cổng:</span> <span className="font-bold">{blacklistAlert.gateName || blacklistAlert.gateCode || "Không rõ cổng"}</span></p>
              <p><span className="text-red-100">Tòa nhà:</span> <span className="font-bold">{blacklistAlert.buildingName || "—"}</span></p>
            </div>
            <button onClick={() => setBlacklistAlert(null)} className="mt-6 w-full rounded-2xl bg-white py-4 text-sm font-black uppercase tracking-widest text-red-700 hover:bg-red-50">
              Đã tiếp nhận cảnh báo
            </button>
          </div>
        </div>
      )}

      {/* ============================================================
          SIDEBAR (CHỈ HIỂN THỊ TRÊN DESKTOP)
      ============================================================ */}
      <aside className={`aside-panel hidden md:flex fixed bottom-0 left-0 top-0 z-50 h-screen flex-col bg-slate-900 text-white shadow-xl transition-all duration-300 ${collapsed ? "w-20 overflow-hidden" : "w-72"}`}>
        {/* Logo + tên hệ thống */}
        <div className="flex items-center gap-3.5 px-6 py-6 border-b border-slate-800 overflow-hidden">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-red-500 to-rose-600 text-white shadow-md shadow-red-500/20 font-black text-lg flex-shrink-0"
          >
            S
          </button>
          {!collapsed && (
            <div className="animate-fade-in-fast">
              <h1 className="text-md font-extrabold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent whitespace-nowrap">
                Smart Parking
              </h1>
              <p className="text-xs text-red-400 font-semibold tracking-wider uppercase whitespace-nowrap">
                Cổng an ninh
              </p>
            </div>
          )}
        </div>

        {/* Navigation tabs */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-x-hidden">
          {/* Chỉ báo SOS trong sidebar */}
          {emergencyStatus.active && !collapsed && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-900/40 px-3 py-2 text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-red-400 animate-pulse">🚨 SOS ĐANG ACTIVE</p>
            </div>
          )}

          {NAV_TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`nav-link-item flex items-center gap-3 w-full rounded-xl px-4 py-3 text-left font-semibold transition-all duration-200 ${activeTab === key ? "bg-slate-800 text-red-400 border border-slate-700 shadow-inner" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
            >
              <span className="flex-shrink-0"><Icon /></span>
              {!collapsed && <span className="whitespace-nowrap">{label}</span>}
              {/* Badge SOS cho tab Emergency */}
              {key === "emergency" && emergencyStatus.active && !collapsed && (
                <span className="ml-auto h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
          ))}
        </nav>

        {/* Nút đăng xuất */}
        <div className="border-t border-slate-800 p-4 overflow-hidden">
          <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-all duration-200">
            <IconLogout />
            {!collapsed && <span className="whitespace-nowrap">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* ============================================================
          NỘI DUNG CHÍNH
      ============================================================ */}
      <main className={`main-content-area min-h-screen min-w-0 flex-1 flex flex-col transition-all duration-300 ${collapsed ? "ml-0 md:ml-20" : "ml-0 md:ml-72"} ${emergencyStatus.active ? "pt-28 md:pt-24" : ""} pb-20 md:pb-0`}>
        {/* Header sticky */}
        <header className="sticky top-0 z-40 flex h-16 md:h-20 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 md:px-8 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* Tên màn hình */}
            <div className="flex flex-col">
              <h2 className="text-lg md:text-xl font-bold text-slate-900">Chốt An Ninh</h2>
              <p className="hidden md:block text-xs text-slate-500 mt-0.5">{liveDate}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            {/* Đồng hồ realtime */}
            <div className="hidden md:flex flex-col items-end border-r border-slate-200 pr-6">
              <span className="font-mono text-lg font-bold text-red-600 bg-red-50/50 px-3 py-1 rounded-lg border border-red-100">{liveTime}</span>
            </div>
            {/* Thông tin user */}
            <div className="flex items-center gap-3 md:gap-3.5 md:border-l md:border-slate-200 md:pl-6">
              <div className="text-right hidden sm:block">
                <p className="font-semibold text-sm text-slate-900">{fullName}</p>
                <p className="text-xs text-slate-400 font-medium">{userRole === "SECURITY" ? "Nhân viên an ninh" : userRole}</p>
              </div>
              <div className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-red-500 to-rose-600 font-bold text-white shadow-md shadow-red-500/20">
                {fullName.charAt(0).toUpperCase()}
              </div>
              {/* Nút Đăng xuất trên Mobile (do Sidebar bị ẩn) */}
              <button 
                onClick={onLogout} 
                className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-rose-500 hover:bg-rose-50 transition-colors"
                title="Đăng xuất"
              >
                <IconLogout />
              </button>
            </div>
          </div>
        </header>

        {/* Nội dung theo tab */}
        <section className="space-y-6 md:space-y-8 p-4 md:p-8 flex-1">

          {/* ──────────── TAB: GIÁM SÁT ──────────── */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Welcome banner */}
              <div className="welcome-banner relative overflow-hidden rounded-3xl bg-slate-950 p-6 md:p-8 shadow-xl">
                <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-red-600/20 to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.45em] text-red-400">Security Dashboard</p>
                  <h1 className="mt-2 md:mt-3 text-3xl md:text-4xl font-black text-white">Trung tâm An Ninh</h1>
                  <p className="mt-2 max-w-2xl text-xs md:text-sm font-medium leading-relaxed text-slate-300">
                    Giám sát toàn bộ cổng ra vào, quản lý danh sách đen và điều hành tình huống khẩn cấp SOS. Trạng thái:{" "}
                    <span className={`font-bold ${emergencyStatus.active ? "text-red-400" : "text-emerald-400"}`}>
                      {emergencyStatus.active ? "⚠️ SOS ACTIVE" : "✅ Bình thường"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Stat cards — 4 chỉ số quan trọng */}
              <div className="grid grid-cols-2 gap-3 md:gap-5 md:grid-cols-4">
                <Stat title="Cổng hoạt động" value={loadingOverview ? "..." : `${openGates}/${overviewStats.gates.length}`} tone="red" />
                <Stat title="Zone giám sát" value={loadingOverview ? "..." : overviewStats.zones.length} tone="blue" />
                <Stat title="Blacklist active" value={loadingOverview ? "..." : overviewStats.blacklistCount} tone="amber" />
                <Stat title="Security logs" value={loadingOverview ? "..." : overviewStats.logCount} tone="emerald" />
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Danh sách cổng ra/vào từ backend */}
                <Panel title="🚧 Cổng ra/vào (dữ liệu thật backend)">
                  {loadingOverview ? (
                    <div className="text-center text-sm text-slate-400 py-6">Đang tải...</div>
                  ) : overviewStats.gates.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-400">
                      Backend chưa trả về gate nào.
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {overviewStats.gates.map((gate) => {
                        const isSosOpen = emergencyStatus.active;
                        return (
                          <div key={gate.id} className={`rounded-xl border p-4 shadow-sm transition-all duration-300 ${isSosOpen ? "border-red-300 bg-red-50/50" : "border-slate-200 bg-white"}`}>
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-slate-900">{gate.gateName || gate.gateCode}</p>
                              {isSosOpen ? (
                                <span className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-[9px] font-black uppercase text-red-700">
                                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                  Mở (SOS)
                                </span>
                              ) : (
                                <span className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${gate.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                                  <span className={`h-2 w-2 rounded-full ${gate.isActive ? "bg-emerald-400" : "bg-slate-400"}`} />
                                  {gate.isActive ? "Online" : "Offline"}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs font-semibold text-slate-500">{gate.gateType} · {gate.gateCode}</p>
                            <p className="mt-2 text-xs text-slate-400">Building ID: {gate.buildingId}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Panel>

                {/* Trạng thái SOS realtime */}
                <Panel title="📡 Trạng thái SOS">
                  <div className={`rounded-2xl border p-5 md:p-6 ${emergencyStatus.active ? "border-red-300 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.35em] text-slate-400">Current State</p>
                    <h3 className={`mt-2 md:mt-3 text-2xl md:text-3xl font-black ${emergencyStatus.active ? "text-red-700" : "text-emerald-700"}`}>
                      {emergencyStatus.active ? "🚨 SOS ACTIVE" : "✅ BÌNH THƯỜNG"}
                    </h3>
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      {emergencyStatus.active
                        ? (emergencyStatus.message || "Hệ thống đang ở trạng thái khẩn cấp.")
                        : "Hệ thống đang hoạt động bình thường. Chọn tab SOS để kích hoạt khi cần."}
                    </p>
                    {emergencyStatus.buildingName && (
                      <p className="mt-4 text-xs text-slate-500">Building: {emergencyStatus.buildingName}</p>
                    )}
                  </div>
                  {/* Nút chuyển nhanh sang tab SOS */}
                  <button
                    onClick={() => setActiveTab("emergency")}
                    className="mt-4 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Đến trang điều khiển SOS →
                  </button>
                </Panel>
              </div>
            </div>
          )}

          {/* ──────────── TAB: SỰ CỐ AN NINH ──────────── */}
          {activeTab === "exception" && (
            <ExceptionLogsPage showToast={showToast} user={user} />
          )}

          {/* ──────────── TAB: SOS KHẨN CẤP ──────────── */}
          {activeTab === "emergency" && (
            <EmergencyPage
              showToast={showToast}
              user={user}
              emergencyStatus={emergencyStatus}
              onStatusChange={setEmergencyStatus}
            />
          )}

          {/* ──────────── TAB: DANH SÁCH ĐEN ──────────── */}
          {activeTab === "blacklist" && (
            <BlacklistPage showToast={showToast} user={user} />
          )}

        </section>
      </main>

      {/* ============================================================
          BOTTOM NAVIGATION (CHỈ HIỂN THỊ TRÊN MOBILE)
      ============================================================ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-white border-t border-slate-200 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        {NAV_TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex flex-col items-center justify-center w-full py-3 gap-1 relative transition-colors ${
              activeTab === key ? "text-red-600" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <span className="relative">
              <Icon />
              {key === "emergency" && emergencyStatus.active && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500 animate-pulse" />
              )}
            </span>
            <span className={`text-[10px] font-bold ${activeTab === key ? "text-red-600" : "font-semibold"}`}>
              {key === "overview" ? "Giám sát" : key === "exception" ? "Sự cố" : key === "emergency" ? "SOS" : "Blacklist"}
            </span>
            {activeTab === key && (
              <span className="absolute top-0 inset-x-0 mx-auto h-[3px] w-8 bg-red-600 rounded-b-md" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
