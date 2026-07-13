import { useEffect, useState, useRef } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { staffApi } from "../../api/parkingApi";
import { formatLicensePlate, getLicensePlateValidationError } from "../../utils/licensePlate";

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

  // Format thời gian đếm giờ ca làm việc
  const formatDuration = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const formatRealTime = (date = new Date()) => {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Khởi tạo thời gian bắt đầu ca làm việc
  const [loginTime] = useState(() => {
    const stored = localStorage.getItem("staff_login_time");
    if (stored) return parseInt(stored, 10);
    const now = Date.now();
    localStorage.setItem("staff_login_time", now.toString());
    return now;
  });

  const [liveTime, setLiveTime] = useState(() => formatRealTime());
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
    "/staff/zone-entry": "Quét Cổng Zone Vào",
    "/staff/zone-exit": "Quét Cổng Zone Ra",
    "/staff/check-out": "Check-out xe ra",
    "/staff/history": "Lịch sử phiên gửi xe",
  };
  const pageTitle = pageTitles[location.pathname] || "Cổng nhân viên";

  // System SOS State
  const [systemSosStatus, setSystemSosStatus] = useState({ active: false });
  const [showSystemSosModal, setShowSystemSosModal] = useState(false);

  // Exception Modal States
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [exceptionData, setExceptionData] = useState({ type: "LOST_TICKET", description: "", plate: "", vehicleType: "NONE" });
  const [exceptionSubmitting, setExceptionSubmitting] = useState(false);
  const [apiMessage, setApiMessage] = useState("");
  const [vehicleTypes, setVehicleTypes] = useState([]);

  // Modal Dragging State
  const modalPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const modalRef = useRef(null);
  const headerRef = useRef(null);

  const handlePointerDown = (e) => {
    isDragging.current = true;
    dragStartPos.current = {
      x: e.clientX - modalPos.current.x,
      y: e.clientY - modalPos.current.y,
    };
    e.target.setPointerCapture(e.pointerId);
    if (headerRef.current) headerRef.current.style.cursor = "grabbing";
    if (modalRef.current) modalRef.current.style.transition = "none"; // Bỏ CSS transition để kéo ko bị lag
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    const newX = e.clientX - dragStartPos.current.x;
    const newY = e.clientY - dragStartPos.current.y;
    modalPos.current = { x: newX, y: newY };
    if (modalRef.current) {
      modalRef.current.style.transform = `translate(${newX}px, ${newY}px)`;
    }
  };

  const handlePointerUp = (e) => {
    isDragging.current = false;
    e.target.releasePointerCapture(e.pointerId);
    if (headerRef.current) headerRef.current.style.cursor = "grab";
  };

  const submitException = async () => {
    if (!exceptionData.description) return;

    const selectedVt = vehicleTypes.find(vt => vt.id === exceptionData.vehicleType);
    const isBicycle = selectedVt && (
      selectedVt.name.toUpperCase().includes("XE ĐẠP") || 
      selectedVt.name.toUpperCase().includes("BICYCLE")
    );
    const isPlateRequired = exceptionData.vehicleType !== "NONE" && !isBicycle;

    // Nếu chọn loại xe cần biển thì bắt buộc nhập biển số
    if (isPlateRequired && (!exceptionData.plate || exceptionData.plate.trim() === "")) {
      setApiMessage("❌ Lỗi: Bạn phải nhập biển số xe khi chọn loại phương tiện!");
      setTimeout(() => setApiMessage(""), 5000);
      return;
    }

    // Validate biển số nếu có nhập biển số
    if (exceptionData.plate && exceptionData.plate.trim() !== "") {
      const plateError = getLicensePlateValidationError(exceptionData.plate);
      if (plateError) {
        setApiMessage(`❌ Lỗi biển số: ${plateError}`);
        setTimeout(() => setApiMessage(""), 5000);
        return;
      }
    }

    setExceptionSubmitting(true);
    try {
      const vehicleTypeLabel = selectedVt ? selectedVt.name : "Không áp dụng";

      await staffApi.logSecurityException({
        exceptionType: exceptionData.type,
        description: exceptionData.description,
        licensePlate: exceptionData.plate && exceptionData.plate.trim() !== "" ? exceptionData.plate : "Chưa xác định",
        vehicleType: vehicleTypeLabel, // Gửi loại phương tiện lên backend
        gateId: "staff-ui", // Gửi từ Header UI chung
        images: []
      });
      setApiMessage("✅ Báo sự cố thành công tới Bảo vệ!");
      setShowExceptionModal(false);
      modalPos.current = { x: 0, y: 0 }; // reset position on close
      const bicycle = vehicleTypes.find(vt => {
        const nameNorm = vt.name ? vt.name.toUpperCase() : "";
        return nameNorm.includes("XE ĐẠP") || nameNorm.includes("BICYCLE");
      });
      setExceptionData({ type: "LOST_TICKET", description: "", plate: "", vehicleType: bicycle ? bicycle.id : "NONE" });
      setTimeout(() => setApiMessage(""), 10000);
    } catch (err) {
      setApiMessage("❌ Lỗi khi báo sự cố. Vui lòng thử lại!");
      setTimeout(() => setApiMessage(""), 10000);
    } finally {
      setExceptionSubmitting(false);
    }
  };

  // Tải cấu hình loại xe từ API
  useEffect(() => {
    (async () => {
      try {
        const res = await staffApi.getParkingConfig();
        const types = res.data?.data?.vehicleTypes || [];
        setVehicleTypes(types);

        // Mặc định chọn Xe đạp khi mở hoặc tải xong danh sách
        const bicycle = types.find(vt => {
          const nameNorm = vt.name ? vt.name.toUpperCase() : "";
          return nameNorm.includes("XE ĐẠP") || nameNorm.includes("BICYCLE");
        });
        if (bicycle) {
          setExceptionData(prev => ({ ...prev, vehicleType: bicycle.id }));
        }
      } catch (err) {
        console.warn("Failed to load vehicle types for Exception Modal", err);
      }
    })();
  }, []);

  // Cập nhật đồng hồ xem giờ thực tế và ngày tháng
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setLiveTime(formatRealTime());
    }, 1000);

    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setLiveDate(today.toLocaleDateString('vi-VN', options));

    return () => {
      clearInterval(clockTimer);
    };
  }, []);

  // Lắng nghe SOS từ hệ thống qua WebSocket
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";
        let wsUrl = apiBaseUrl.replace("/api/v1", "/ws");
        if (wsUrl.includes("localhost") && typeof window !== "undefined" && window.location.hostname !== "localhost") {
          wsUrl = wsUrl.replace("localhost", window.location.hostname);
        }
        return new SockJS(wsUrl);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => { if (str.includes("ERROR")) console.error("[STAFF-STOMP]", str); },
    });

    client.onConnect = () => {
      client.subscribe("/topic/emergency", (message) => {
        try {
          const data = JSON.parse(message.body);
          const active = Boolean(data.active);
          setSystemSosStatus({ active, ...data });

          if (active) {
            setShowSystemSosModal(true); // Tự động mở Modal khi có SOS
          } else {
            setShowSystemSosModal(false); // Tự động đóng Modal khi hết SOS
          }
        } catch (err) {
          console.error("Emergency WS parse error:", err);
        }
      });
    };

    client.activate();
    return () => {
      if (client.active) client.deactivate();
    };
  }, []);

  const selectedVtForRender = vehicleTypes.find(vt => vt.id === exceptionData.vehicleType);
  const isBicycleForRender = selectedVtForRender && (
    selectedVtForRender.name.toUpperCase().includes("XE ĐẠP") || 
    selectedVtForRender.name.toUpperCase().includes("BICYCLE")
  );
  const isPlateRequiredForRender = exceptionData.vehicleType !== "NONE" && !isBicycleForRender;

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
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h.01M16 20h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Zone Vào"
            active={location.pathname === "/staff/zone-entry"}
          />
          <SideLink
            collapsed={collapsed}
            to="/staff/zone-exit"
            icon={
              <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h.01M16 20h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Zone Ra"
            active={location.pathname === "/staff/zone-exit"}
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
            onClick={() => {
              localStorage.removeItem("staff_login_time");
              if (onLogout) onLogout();
            }}
            className={`flex w-full items-center rounded-xl py-3 font-semibold text-rose-400 hover:bg-rose-950 hover:text-rose-200 transition-all duration-200 cursor-pointer ${collapsed ? "justify-center px-0" : "gap-3 px-4"}`}
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
          {/* Nút báo SOS — chỉ hiện khi đang có SOS active */}
          {systemSosStatus.active && (
            <button
              onClick={() => setShowSystemSosModal(true)}
              className="mr-2 flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-black text-white hover:bg-rose-700 transition-all cursor-pointer shadow-lg animate-pulse border-2 border-rose-400"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              ĐANG CÓ SOS
            </button>
          )}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end border-r border-indigo-200 pr-6">
              <span className="font-mono text-base font-bold text-indigo-800 bg-white px-3.5 py-1 rounded-lg border border-indigo-300/60">
                {liveTime}
              </span>
            </div>

            <div className="flex items-center gap-2">


              {/* Nút báo sự cố (SOS cá nhân) */}
              <button
                onClick={() => {
                  setShowExceptionModal(true);
                  modalPos.current = { x: 0, y: 0 }; // reset position on open
                  if (modalRef.current) modalRef.current.style.transform = `translate(0px, 0px)`;
                }}
                className="mr-2 flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-2 text-xs font-bold text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white transition-all cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>

              </button>

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

        {/* Modal Báo sự cố */}
        {showExceptionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 pointer-events-none">
            <div
              ref={modalRef}
              className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 pointer-events-auto"
              style={{ transform: `translate(${modalPos.current.x}px, ${modalPos.current.y}px)` }}
            >
              <div
                ref={headerRef}
                className="bg-rose-50 border-b border-rose-100 p-4 flex justify-between items-center cursor-grab select-none touch-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <h3 className="font-bold text-rose-800 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  GỌI BẢO VỆ / BÁO SỰ CỐ
                </h3>
                <button onClick={() => setShowExceptionModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Loại sự cố *</label>
                  <select
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-slate-50"
                    value={exceptionData.type}
                    onChange={(e) => setExceptionData({ ...exceptionData, type: e.target.value })}
                  >
                    <option value="LOST_TICKET">Khách làm mất vé</option>
                    <option value="WRONG_PLATE">Sai lệch biển số vào/ra</option>
                    <option value="OVERTIME">Gửi xe quá hạn</option>
                    <option value="WRONG_ZONE">Đỗ sai phân khu quy định</option>
                    <option value="UNPAID">Khách không chịu thanh toán phí</option>
                    <option value="SUSPICIOUS_BEHAVIOR">Hành vi đáng ngờ (Trộm cắp, Phá hoại)</option>
                    <option value="OTHER">Lý do khác</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isPlateRequiredForRender ? "Biển số xe (Bắt buộc) *" : "Biển số xe (Nếu có)"}
                    </label>
                    <input
                      type="text"
                      className="w-full text-sm font-mono border border-slate-300 rounded-lg p-2.5 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                      placeholder="VD: 30A-123.45"
                      value={exceptionData.plate}
                      onChange={(e) => setExceptionData({ ...exceptionData, plate: formatLicensePlate(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Loại phương tiện</label>
                    <select
                      className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-slate-50"
                      value={exceptionData.vehicleType}
                      onChange={(e) => setExceptionData({ ...exceptionData, vehicleType: e.target.value })}
                    >
                      {vehicleTypes.map((vt) => (
                        <option key={vt.id} value={vt.id}>
                          {vt.name}
                        </option>
                      ))}
                      <option value="NONE">Không có xe / Không áp dụng</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả tình hình (Bắt buộc) *</label>
                  <textarea
                    className="w-full text-sm border border-slate-300 rounded-lg p-2.5 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 min-h-[80px]"
                    placeholder="Ghi chú thêm thông tin cho bảo vệ..."
                    value={exceptionData.description}
                    onChange={(e) => setExceptionData({ ...exceptionData, description: e.target.value })}
                  ></textarea>
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowExceptionModal(false);
                    modalPos.current = { x: 0, y: 0 };
                  }}
                  className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={submitException}
                  disabled={
                    !exceptionData.description ||
                    (isPlateRequiredForRender && !exceptionData.plate?.trim()) ||
                    exceptionSubmitting
                  }
                  className="px-4 py-2 text-sm font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {exceptionSubmitting ? "Đang gửi..." : "GỬI BÁO CÁO TỚI BẢO VỆ"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Message Notification */}
        {apiMessage && (
          <div className="fixed top-16 right-30 z-[100] animate-in slide-in-from-top-5">
            <div className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-bold flex items-center gap-3 ${apiMessage.includes("✅")
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
              }`}>
              {apiMessage}
              <button onClick={() => setApiMessage("")} className="opacity-50 hover:opacity-100 cursor-pointer">✕</button>
            </div>
          </div>
        )}

        {/* Tạm thời comment Modal custom SOS theo yêu cầu
        {showSystemSosModal && systemSosStatus.active && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-rose-900/40 p-4 backdrop-blur-sm pointer-events-auto">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border-4 border-rose-600 overflow-hidden animate-in zoom-in duration-300">
              <div className="bg-rose-600 text-white p-5 flex flex-col items-center justify-center gap-2">
                <svg className="w-12 h-12 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h2 className="text-2xl font-black uppercase tracking-wider text-center">Hệ thống đang báo động!</h2>
              </div>
              <div className="p-6 bg-rose-50 flex flex-col items-center gap-4 text-center">
                <p className="text-rose-900 font-medium text-lg">
                  Lý do: <span className="font-bold">{systemSosStatus.reason || "Sự cố khẩn cấp"}</span>
                </p>
                <p className="text-rose-800 text-sm">
                  Đã được kích hoạt bởi: <strong>{systemSosStatus.triggeredBy || "Hệ thống"}</strong>
                </p>
                <p className="text-rose-800 text-sm bg-white px-4 py-3 rounded-lg border border-rose-200 shadow-sm w-full font-semibold">
                  Vui lòng chú ý quan sát và làm theo hướng dẫn của quản lý / bảo vệ.
                </p>
                <button
                  onClick={() => setShowSystemSosModal(false)}
                  className="mt-2 px-8 py-3 text-sm font-black text-white bg-rose-700 rounded-xl hover:bg-rose-800 transition-colors cursor-pointer shadow-lg w-full uppercase tracking-wider"
                >
                  Đã hiểu & Đóng bảng này
                </button>
              </div>
            </div>
          </div>
        )}
        */}
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
