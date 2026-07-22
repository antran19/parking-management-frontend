import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { staffApi } from "../../api/parkingApi";
import { getLicensePlateValidationError } from "../../utils/licensePlate";
import ParkingDigitalTwin3D from "../manager/ParkingDigitalTwin3D";
import AdminOverview from "./AdminOverview";
import AdminUsers from "./AdminUsers";
import AdminZones from "./AdminZones";
import AdminGates from "./AdminGates";
import AdminTariffs from "./AdminTariffs";
import AdminPasses from "./AdminPasses";
import AdminExceptionLogs from "./AdminExceptionLogs";
import AdminBlacklist from "./AdminBlacklist";
import AdminReports from "./AdminReports";
import AdminSettings from "./AdminSettings";
import AdminInfrastructure from "./AdminInfrastructure";
import gsap from "gsap";

// Icons
const IconDashboard = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);
const IconUsers = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const IconZones = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);
const IconGates = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);
const IconTariffs = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconPasses = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>
);
const IconExceptions = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);
const IconReports = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
  </svg>
);
const IconSettings = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 01-6 0z" />
  </svg>
);
const IconDigitalTwin = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 00-1-1.732l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.732l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.3 7L12 12l8.7-5M12 22V12" />
  </svg>
);
const IconLogout = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const LicensePlate = ({ plate }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono font-bold text-slate-800 shadow-sm text-xs tracking-widest">
    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block mr-1"></span>
    {plate}
  </span>
);

export default function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [liveTime, setLiveTime] = useState("");
  const [liveDate, setLiveDate] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const fullName = user.fullName || "Admin Hệ Thống";

  // GSAP Animation container reference
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Sidebar slide-in (only on mount)
      gsap.fromTo(".aside-panel",
        { x: -120, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.9, ease: "power4.out" }
      );

      // 2. Main content area fade-in
      gsap.fromTo(".main-content-area",
        { opacity: 0 },
        { opacity: 1, duration: 0.6 }
      );

      // 3. Stagger animate the navigation links
      gsap.fromTo(".nav-link-item",
        { x: -40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out", delay: 0.25 }
      );

      // 4. Welcome banner scale up with a beautiful bounce
      gsap.fromTo(".welcome-banner",
        { scale: 0.96, opacity: 0, y: 15 },
        { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: "back.out(1.15)", delay: 0.3 }
      );

      // 5. Stats cards stagger bounce
      gsap.fromTo(".stat-card-item",
        { y: 35, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.65, stagger: 0.07, ease: "power3.out", delay: 0.45 }
      );

      // 6. Action panels slide up
      gsap.fromTo(".action-panel-item",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.75, stagger: 0.1, ease: "power3.out", delay: 0.65 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [activeTab]);

  // --- STATE QUẢN LÝ ---
  const [users, setUsers] = useState([]);
  const [zones, setZones] = useState([]);
  const [gates, setGates] = useState([]);
  const [tariffs, setTariffs] = useState([]);
  const [passes, setPasses] = useState([]);
  const [parkingConfig, setParkingConfig] = useState({ buildings: [], floors: [], vehicleTypes: [] });
  const [logs, setLogs] = useState([]);

  const [sessions, setSessions] = useState([]);
  const [payments, setPayments] = useState([]);

  // Cài đặt hệ thống chung — chỉ còn sosEnabled là có tác dụng thật (chặn/cho phép Security
  // kích hoạt SOS), gracePeriod/currency/vat giữ lại cho tương thích API cũ nhưng không còn
  // form nào chỉnh sửa nữa (đã dời "phút miễn phí" thật sang freeMinutes theo từng biểu giá).
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("admin_settings");
    return saved ? JSON.parse(saved) : { gracePeriod: 10, currency: "VND", vat: 10, sosEnabled: true };
  });

  // --- MODAL STATES ---
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({ id: "", name: "", email: "", role: "staff", status: "active", phone: "", password: "" });
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [zoneForm, setZoneForm] = useState({ id: "", name: "", type: "Xe máy", capacity: 100, occupied: 0, floorId: "", vehicleTypeId: "", status: "ACTIVE" });
  const [isEditingZone, setIsEditingZone] = useState(false);

  const [isGateModalOpen, setIsGateModalOpen] = useState(false);
  const [gateForm, setGateForm] = useState({ id: "", name: "", type: "MAIN_ENTRY", status: "active", barrier: "CLOSED", cameraIp: "", buildingId: "", zoneId: "" });
  const [isEditingGate, setIsEditingGate] = useState(false);

  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);
  const [tariffForm, setTariffForm] = useState({ id: "", vehicleType: "Xe máy", vehicleTypeId: "", buildingId: "", type: "HOURLY", price: 0, freeMinutes: 0, description: "" });
  const [isEditingTariff, setIsEditingTariff] = useState(false);

  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [passForm, setPassForm] = useState({ id: "", owner: "", userId: "", plate: "", type: "Xe máy", vehicleTypeId: "", buildingId: "", start: "", end: "", status: "active", passType: "MONTHLY", fee: 0 });
  const [isEditingPass, setIsEditingPass] = useState(false);

  // Blacklist state & functions
  const [exceptionsSubTab, setExceptionsSubTab] = useState("logs");
  const [blacklist, setBlacklist] = useState([]);
  const [loadingBlacklist, setLoadingBlacklist] = useState(false);
  const [submittingBlacklist, setSubmittingBlacklist] = useState(false);
  const [isBlacklistModalOpen, setIsBlacklistModalOpen] = useState(false);
  const [blacklistForm, setBlacklistForm] = useState({
    licensePlate: "",
    reason: "STOLEN",
    description: "",
  });

  const fetchBlacklist = async () => {
    setLoadingBlacklist(true);
    try {
      const res = await staffApi.getBlacklist();
      setBlacklist(res.data.data || []);
    } catch (err) {
      console.warn("Failed to fetch blacklist for Admin Dashboard:", err);
    } finally {
      setLoadingBlacklist(false);
    }
  };

  const handleSaveBlacklist = async (e) => {
    e.preventDefault();
    if (!blacklistForm.licensePlate.trim()) {
      showToast("Vui lòng nhập biển số xe", "warning");
      return;
    }
    setSubmittingBlacklist(true);
    try {
      await staffApi.addBlacklistPlate({
        licensePlate: blacklistForm.licensePlate.trim().toUpperCase(),
        reason: blacklistForm.reason,
        description: blacklistForm.description || blacklistForm.reason,
        addedByUserId: user.id || "00000000-0000-0000-0000-000000000000",
      });
      setIsBlacklistModalOpen(false);
      setBlacklistForm({ licensePlate: "", reason: "STOLEN", description: "" });
      showToast("Đã thêm biển số vào blacklist thành công!");
      fetchBlacklist();
    } catch (err) {
      showToast(err.response?.data?.message || "Thêm vào blacklist thất bại", "warning");
    } finally {
      setSubmittingBlacklist(false);
    }
  };

  const handleRemoveBlacklist = async (id, plate) => {
    if (!window.confirm(`Gỡ biển số ${plate} khỏi danh sách đen?`)) return;
    try {
      await staffApi.removeBlacklistPlate(id, {
        removedByUserId: user.id || "00000000-0000-0000-0000-000000000000",
      });
      showToast(`Đã gỡ biển số ${plate} khỏi danh sách đen`);
      fetchBlacklist();
    } catch (err) {
      showToast(err.response?.data?.message || "Gỡ cấm thất bại", "warning");
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await staffApi.getSecurityExceptions();
      const backendLogs = res.data.data || [];
      const mappedLogs = backendLogs.map(l => ({
        id: l.id ? l.id.toString().substring(0, 8).toUpperCase() : "EX-DB",
        time: l.resolvedAt ? new Date(l.resolvedAt).toLocaleString("vi-VN") : "—",
        plate: l.licensePlate || l.session?.licensePlate || "KHÔNG RÕ BIỂN",
        handler: l.handledBy || "Phạm Văn Bảo Vệ",
        issue: l.exceptionType === "LOST_TICKET" ? "Mất thẻ QR vãng lai" : l.exceptionType === "WRONG_PLATE" ? "AI đọc lệch biển số" : "Sự cố an ninh",
        severity: l.description?.includes("severity: high") || l.description?.includes("severity: \"high\"") || l.description?.includes("Mức độ: high") ? "high" : "medium",
        action: l.description || "Đã giải quyết"
      }));
      setLogs(mappedLogs);
    } catch (err) {
      console.warn("Failed to load real exception logs from backend for Admin Dashboard:", err);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await staffApi.getAllSessionsHistory();
      const backendSessions = res.data.data || [];
      const formattedSessions = backendSessions.map(s => ({
        id: s.sessionId || `s_${s.sessionCode}`,
        plate: s.licensePlate,
        building: "SmartParking Tower",
        zone: s.floorName && s.zoneName ? `${s.floorName} - ${s.zoneName}` : s.zoneName || "—",
        type: s.driverType || "WALK_IN",
        entryTime: s.entryTime ? new Date(s.entryTime) : null,
        exitTime: s.exitTime ? new Date(s.exitTime) : null,
        fee: s.totalFee || 0,
        status: s.status || (s.exitTime ? "COMPLETED" : "ACTIVE")
      }));
      setSessions(formattedSessions);
    } catch (err) {
      console.warn("Failed to fetch sessions for Admin Dashboard:", err);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await staffApi.getAdminPayments();
      setPayments((res.data.data || []).map(p => ({
        ...p,
        amount: Number(p.amount || 0),
        paidAt: p.paidAt ? new Date(p.paidAt) : null,
        createdAt: p.createdAt ? new Date(p.createdAt) : null,
      })));
    } catch (err) {
      console.warn("Failed to fetch payments:", err);
    }
  };

  // Load cấu hình bãi xe thực tế từ Backend (Zones, Gates)
  useEffect(() => {
    const fetchAdminUsers = async () => {
      try {
        const res = await staffApi.getAdminUsers();
        setUsers(res.data.data || []);
      } catch (err) {
        console.warn("Failed to load users from backend:", err);
      }
    };

    const fetchPasses = async () => {
      try {
        const res = await staffApi.getParkingPasses();
        setPasses(mapPasses(res.data.data));
      } catch (err) {
        console.warn("Failed to load parking passes from backend:", err);
      }
    };

    const fetchConfig = async () => {
      try {
        await reloadAdminConfig();
      } catch (err) {
        console.warn("Failed to load real config from backend for Admin Dashboard:", err);
      }
    };

    const fetchSettings = async () => {
      try {
        const res = await staffApi.getAdminSettings();
        setSettings(res.data.data || { gracePeriod: 10, currency: "VND", vat: 10 });
      } catch (err) {
        console.warn("Failed to load settings from backend:", err);
      }
    };
    fetchAdminUsers();
    fetchPasses();
    fetchConfig();
    fetchSettings();
    fetchLogs();
    fetchBlacklist();
    fetchSessions();
    fetchPayments();

    // Auto refresh exceptions logs & sessions every 5 seconds
    const interval = setInterval(() => {
      fetchAdminUsers();
      fetchPasses();
      fetchLogs();
      fetchBlacklist();
      fetchSessions();
      fetchPayments();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Đồng bộ hóa thời gian
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setLiveDate(today.toLocaleDateString('vi-VN', options));

    return () => clearInterval(timer);
  }, []);

  // --- TOAST NOTIFICATION ---
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const unavailableAdminAction = (message = "Chức năng này cần API admin thật từ backend. Frontend không cập nhật dữ liệu giả.") => {
    showToast(message, "warning");
  };

  const firstBuildingId = () => parkingConfig.buildings?.[0]?.id || "";
  const firstVehicleTypeId = () => parkingConfig.vehicleTypes?.[0]?.id || "";
  const vehicleTypeNameById = (id) => parkingConfig.vehicleTypes?.find((v) => v.id === id)?.name || "Xe máy";

  const mapPasses = (items) => (items || []).map((p) => ({
    id: p.id,
    owner: p.userName || "--",
    userId: p.userId || "",
    buildingId: p.buildingId || "",
    vehicleTypeId: p.vehicleTypeId || "",
    plate: p.licensePlate,
    type: p.vehicleTypeName || "--",
    start: p.startDate,
    end: p.endDate,
    status: String(p.status || "active").toLowerCase(),
    passType: p.passType || "MONTHLY",
    fee: Number(p.fee || 0),
  }));

  const reloadPasses = async () => {
    const res = await staffApi.getParkingPasses();
    setPasses(mapPasses(res.data.data));
  };

  const reloadAdminConfig = async () => {
    const res = await staffApi.getParkingConfig();
    const config = res.data.data || {};
    setParkingConfig({
      buildings: config.buildings || [],
      floors: config.floors || [],
      vehicleTypes: config.vehicleTypes || [],
    });
    setZones((config.zones || []).map(z => {
      const floor = (config.floors || []).find(f => f.id === z.floorId);
      return {
        id: z.id,
        name: z.zoneName || `Khu ${z.zoneCode}`,
        type: z.vehicleTypeName || "Xe máy",
        vehicleTypeId: z.vehicleTypeId,
        floorId: z.floorId,
        floorName: z.floorName || floor?.floorName || "Chưa rõ tầng",
        floorNumber: floor?.floorNumber,
        buildingName: z.buildingName || floor?.buildingName || "Smart Parking",
        status: z.status || "ACTIVE",
        capacity: z.capacity || 100,
        occupied: z.currentCount || 0
      };
    }));
    setGates((config.gates || []).map((g, idx) => ({
      id: g.id,
      name: g.gateName || `Cổng ${g.gateCode}`,
      type: g.gateType || "MAIN_ENTRY",
      status: g.isActive === false ? "inactive" : "active",
      barrier: g.barrierState || "CLOSED",
      cameraIp: `192.168.1.${50 + idx}`,
      buildingId: g.buildingId,
      zoneId: g.zoneId || ""
    })));
    setTariffs((config.pricingRules || []).map((r) => ({
      id: r.id,
      buildingId: r.buildingId,
      vehicleTypeId: r.vehicleTypeId,
      vehicleType: r.vehicleTypeName || "Xe máy",
      type: r.pricingType || "HOURLY",
      price: Number(r.pricePerUnit || 0),
      freeMinutes: r.freeMinutes || 0,
      description: `${r.pricingType === "MONTHLY" ? "Vé tháng" : r.pricingType === "DAILY" ? "Theo ngày" : "Theo giờ"} · miễn phí ${r.freeMinutes || 0} phút đầu`
    })));
  };

  const handleOpenAddUser = () => {
    setUserForm({ id: "", name: "", email: "", role: "staff", status: "active", phone: "", password: "" });
    setCreatedCredentials(null);
    setIsEditingUser(false);
    setIsUserModalOpen(true);
  };
  const handleOpenEditUser = (u) => { setUserForm({ ...u, password: "" }); setIsEditingUser(true); setIsUserModalOpen(true); };
  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!/^[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}$/.test(userForm.email)) {
      showToast("Email không hợp lệ (thiếu tên miền, vd: ...@gmail.com)", "warning");
      return;
    }
    if (!/^(0|\+84)\d{9}$/.test(userForm.phone)) {
      showToast("Số điện thoại không hợp lệ (định dạng: 0xxxxxxxxx hoặc +84xxxxxxxxx)", "warning");
      return;
    }
    try {
      if (isEditingUser) {
        await staffApi.updateAdminUser(userForm.id, userForm);
        showToast(`Cập nhật thành công ${userForm.name}`);
        setIsUserModalOpen(false);
      } else {
        const resCreate = await staffApi.createAdminUser(userForm);
        const created = resCreate.data?.data;
        setCreatedCredentials(created?.temporaryPassword ? {
          name: created.name,
          email: created.email,
          password: created.temporaryPassword,
        } : null);
        showToast(`Tạo tài khoản ${userForm.name} thành công`);
      }
      const res = await staffApi.getAdminUsers();
      setUsers(res.data.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || "Thao tác tài khoản thất bại", "warning");
    }
  };
  const toggleUserStatus = async (id) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    await staffApi.updateAdminUser(id, { ...target, status: target.status === "active" ? "suspended" : "active" });
    const res = await staffApi.getAdminUsers();
    setUsers(res.data.data || []);
    showToast("Đã cập nhật trạng thái hoạt động người dùng!");
  };
  const handleResetPassword = async (user) => {
    const password = window.prompt(`Nhập mật khẩu tạm mới cho ${user.name}. Để trống để hệ thống tự sinh:`, "");
    if (password === null) return;
    try {
      const res = await staffApi.resetAdminUserPassword(user.id, { password });
      const data = res.data?.data || {};
      const credentials = {
        name: data.name || user.name,
        email: data.email || user.email,
        password: data.temporaryPassword,
      };
      setCreatedCredentials(credentials);
      window.alert(`Mật khẩu tạm mới cho ${credentials.name}:\n\nEmail: ${credentials.email}\nMật khẩu: ${credentials.password}\n\nHãy lưu lại ngay, hệ thống sẽ không hiển thị lại mật khẩu này.`);
      showToast(`Đã reset mật khẩu cho ${user.name}`);
    } catch (err) {
      showToast(err.response?.data?.message || "Reset mật khẩu thất bại", "warning");
    }
  };
  const handleDeleteUser = async (id, name) => {
    if (window.confirm(`Xóa tài khoản ${name}?`)) {
      await staffApi.deleteAdminUser(id);
      setUsers(users.filter(u => u.id !== id));
      showToast(`Đã xóa ${name}`, "warning");
    }
  };

  // Tạo zone mới đã chuyển sang wizard "Quy hoạch zone" (AdminInfrastructure/ZonePlanningWizard) —
  // ở đây chỉ còn giữ chức năng Sửa tên/trạng thái cho zone đã có. Sức chứa (capacity) sửa riêng
  // ở tab "Cấu hình hạ tầng" vì cần tính lại zoneArea + validate diện tích tầng còn trống.
  const handleOpenEditZone = (zone) => {
    setZoneForm({ ...zone });
    setIsEditingZone(true);
    setIsZoneModalOpen(true);
  };
  const handleSaveZone = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        zoneName: zoneForm.name,
        status: zoneForm.status || "ACTIVE"
      };
      await staffApi.updateZone(zoneForm.id, payload);
      await reloadAdminConfig();
      setIsZoneModalOpen(false);
      showToast("Đã cập nhật zone");
    } catch (err) {
      showToast(err.response?.data?.message || "Cập nhật zone thất bại", "warning");
    }
  };
  const handleDeleteZone = async (id, name) => {
    if (!window.confirm(`Xóa khu vực ${name}?`)) return;
    await staffApi.deleteZone(id);
    await reloadAdminConfig();
    showToast(`Đã xóa ${name}`, "warning");
  };

  const handleOpenAddGate = () => {
    setGateForm({ id: "", name: "", type: "MAIN_ENTRY", status: "active", barrier: "CLOSED", cameraIp: "", buildingId: firstBuildingId(), zoneId: "" });
    setIsEditingGate(false);
    setIsGateModalOpen(true);
  };
  const handleOpenEditGate = (gate) => {
    setGateForm({ ...gate, buildingId: gate.buildingId || firstBuildingId(), zoneId: gate.zoneId || "" });
    setIsEditingGate(true);
    setIsGateModalOpen(true);
  };
  const handleSaveGate = async (e) => {
    e.preventDefault();
    try {
      const isZoneGate = gateForm.type.startsWith("ZONE_");
      const payload = {
        buildingId: gateForm.buildingId || firstBuildingId(),
        gateCode: gateForm.name.trim().toUpperCase().replace(/\s+/g, "-").slice(0, 20),
        gateName: gateForm.name,
        gateType: gateForm.type,
        isActive: gateForm.status === "active",
        ...(isZoneGate && gateForm.zoneId ? { zoneId: gateForm.zoneId } : {})
      };
      if (isEditingGate) await staffApi.updateGate(gateForm.id, payload);
      else await staffApi.createGate(payload);
      await reloadAdminConfig();
      setIsGateModalOpen(false);
      showToast(isEditingGate ? "Đã cập nhật cổng" : "Đã tạo cổng mới");
    } catch (err) {
      showToast(err.response?.data?.message || "Thao tác cổng thất bại", "warning");
    }
  };
  const handleDeleteGate = async (id, name) => {
    if (!window.confirm(`Xóa cổng ${name}?`)) return;
    await staffApi.deleteGate(id);
    await reloadAdminConfig();
    showToast(`Đã xóa cổng ${name}`, "warning");
  };

  const toggleBarrier = async (gateId, currentState) => {
    const newState = currentState === "OPEN" ? "CLOSED" : "OPEN";
    try {
      await staffApi.controlBarrier(gateId, newState);
      setGates(gates.map((g) => g.id === gateId ? { ...g, barrier: newState } : g));
      showToast(`Đã ${newState === "OPEN" ? "mở" : "khóa"} barrier`);
    } catch (err) {
      showToast(err.response?.data?.message || "Điều khiển barrier thất bại", "warning");
    }
  };

  const toggleGateStatus = async (gate) => {
    const newActive = gate.status === "active" ? false : true;
    try {
      await staffApi.updateGate(gate.id, {
        buildingId: gate.buildingId || firstBuildingId(),
        gateCode: gate.name.trim().toUpperCase().replace(/\s+/g, "-").slice(0, 20),
        gateName: gate.name,
        gateType: gate.type,
        isActive: newActive
      });
      setGates(gates.map((g) => g.id === gate.id ? { ...g, status: newActive ? "active" : "inactive" } : g));
      showToast(newActive ? `Đã kích hoạt cổng ${gate.name}` : `Đã tắt cổng ${gate.name} (bảo trì)`);
    } catch (err) {
      showToast(err.response?.data?.message || "Cập nhật trạng thái cổng thất bại", "warning");
    }
  };

  const handleOpenAddTariff = () => {
    const vehicleTypeId = firstVehicleTypeId();
    setTariffForm({ id: "", vehicleType: vehicleTypeNameById(vehicleTypeId), vehicleTypeId, buildingId: firstBuildingId(), type: "HOURLY", price: 0, freeMinutes: 0, description: "" });
    setIsEditingTariff(false);
    setIsTariffModalOpen(true);
  };
  const handleOpenEditTariff = (tariff) => {
    setTariffForm({ ...tariff, vehicleTypeId: tariff.vehicleTypeId || firstVehicleTypeId(), buildingId: tariff.buildingId || firstBuildingId() });
    setIsEditingTariff(true);
    setIsTariffModalOpen(true);
  };
  const handleSaveTariff = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        buildingId: tariffForm.buildingId || firstBuildingId(),
        vehicleTypeId: tariffForm.vehicleTypeId || firstVehicleTypeId(),
        pricingType: tariffForm.type,
        pricePerUnit: tariffForm.price,
        freeMinutes: tariffForm.freeMinutes || 0
      };
      if (isEditingTariff) await staffApi.updatePricingRule(tariffForm.id, payload);
      else await staffApi.createPricingRule(payload);
      await reloadAdminConfig();
      setIsTariffModalOpen(false);
      showToast(isEditingTariff ? "Đã cập nhật biểu phí" : "Đã tạo biểu phí mới");
    } catch (err) {
      showToast(err.response?.data?.message || "Thao tác biểu phí thất bại", "warning");
    }
  };

  const calculateEndDate = (startDateStr, passType) => {
    if (!startDateStr) return "";
    const date = new Date(startDateStr);
    if (isNaN(date.getTime())) return "";

    if (passType === "MONTHLY") {
      date.setMonth(date.getMonth() + 1);
    } else if (passType === "QUARTERLY") {
      date.setMonth(date.getMonth() + 3);
    } else if (passType === "YEARLY") {
      date.setFullYear(date.getFullYear() + 1);
    }
    date.setDate(date.getDate() - 1);

    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const getPricingRuleFee = (buildingId, vehicleTypeId, passType) => {
    const rule = tariffs.find(
      t => t.buildingId === buildingId &&
        t.vehicleTypeId === vehicleTypeId &&
        t.type === passType
    );
    if (rule) return rule.price;

    const monthlyRule = tariffs.find(
      t => t.buildingId === buildingId &&
        t.vehicleTypeId === vehicleTypeId &&
        t.type === "MONTHLY"
    );
    if (monthlyRule) {
      if (passType === "QUARTERLY") return monthlyRule.price * 3;
      if (passType === "YEARLY") return monthlyRule.price * 12;
      return monthlyRule.price;
    }
    return 0;
  };

  const handleOpenAddPass = () => {
    const driver = users.find((u) => u.role === "driver") || users[0];
    const vehicleTypeId = firstVehicleTypeId();
    const todayStr = new Date().toISOString().split("T")[0];
    const defaultPassType = "MONTHLY";
    const calculatedEnd = calculateEndDate(todayStr, defaultPassType);

    const bId = firstBuildingId();
    const defaultFee = getPricingRuleFee(bId, vehicleTypeId, defaultPassType);

    setPassForm({
      id: "",
      owner: driver?.name || "",
      userId: driver?.id || "",
      plate: "",
      type: vehicleTypeNameById(vehicleTypeId),
      vehicleTypeId,
      buildingId: bId,
      start: todayStr,
      end: calculatedEnd,
      status: "active",
      passType: defaultPassType,
      fee: defaultFee
    });
    setIsEditingPass(false);
    setIsPassModalOpen(true);
  };
  const handleOpenEditPass = (pass) => {
    setPassForm({
      id: pass.id,
      owner: pass.owner,
      userId: pass.userId || "",
      plate: pass.plate,
      type: pass.type,
      vehicleTypeId: pass.vehicleTypeId || firstVehicleTypeId(),
      buildingId: pass.buildingId || firstBuildingId(),
      start: pass.start,
      originalStart: pass.start,
      end: pass.end,
      status: pass.status,
      passType: pass.passType || "MONTHLY",
      fee: pass.fee || 0
    });
    setIsEditingPass(true);
    setIsPassModalOpen(true);
  };
  const handleSavePass = async (e) => {
    e.preventDefault();
    const selectedVT = parkingConfig.vehicleTypes.find(v => v.id === passForm.vehicleTypeId);
    const isBike = selectedVT?.name?.toLowerCase().includes("đạp") || selectedVT?.name?.toLowerCase().includes("dap");
    if (!isBike) {
      const plateError = getLicensePlateValidationError(passForm.plate, selectedVT?.name);
      if (plateError) { showToast(plateError, "warning"); return; }
    }
    const todayStr = new Date().toISOString().split("T")[0];
    const startDateChanged = !isEditingPass || passForm.start !== passForm.originalStart;
    if (startDateChanged && passForm.start < todayStr) {
      showToast("Ngày bắt đầu không được ở quá khứ", "warning");
      return;
    }
    try {
      if (isEditingPass) {
        await staffApi.updateParkingPass(passForm.id, {
          userId: passForm.userId,
          buildingId: passForm.buildingId || firstBuildingId(),
          vehicleTypeId: passForm.vehicleTypeId || firstVehicleTypeId(),
          licensePlate: passForm.plate,
          startDate: passForm.start,
          endDate: passForm.end,
          passType: passForm.passType || "MONTHLY",
          fee: passForm.fee || 0,
          status: passForm.status
        });
        showToast("Đã cập nhật vé định kỳ");
      } else {
        await staffApi.createParkingPass({
          userId: passForm.userId,
          buildingId: passForm.buildingId || firstBuildingId(),
          vehicleTypeId: passForm.vehicleTypeId || firstVehicleTypeId(),
          licensePlate: passForm.plate,
          startDate: passForm.start,
          endDate: passForm.end,
          passType: passForm.passType || "MONTHLY",
          fee: passForm.fee || 0
        });
        showToast("Đã phát hành vé định kỳ mới");
      }
      await reloadPasses();
      setIsPassModalOpen(false);
    } catch (err) {
      showToast(err.response?.data?.message || "Thao tác vé định kỳ thất bại", "warning");
    }
  };
  const handleRenewPass = async (id) => {
    try {
      await staffApi.renewParkingPass(id);
      await reloadPasses();
      showToast("Đã gia hạn vé định kỳ");
    } catch (err) {
      showToast(err.response?.data?.message || "Gia hạn vé định kỳ thất bại", "warning");
    }
  };
  const handleDeletePass = async (id, plate) => {
    if (!window.confirm(`Xóa vé định kỳ ${plate}?`)) return;
    await staffApi.deleteParkingPass(id);
    await reloadPasses();
    showToast(`Đã xóa vé định kỳ ${plate}`, "warning");
  };

  // Calculate dynamic stats from real backend data.
  // QUAN TRỌNG: mỗi lượt checkout (tiền mặt/VietQR/VNPay) backend đều ghi CẢ session.totalFee
  // LẪN 1 Payment record riêng (referenceType="SESSION") cho CÙNG 1 giao dịch — nên doanh thu
  // chỉ được cộng từ `payments` (nguồn duy nhất, không trùng lặp), KHÔNG được cộng thêm từ
  // sessions.fee nữa, nếu không sẽ bị tính gấp đôi mọi lượt gửi xe. `payments.referenceType`
  // phân biệt "SESSION" (phí gửi xe lượt) và "MONTHLY_PASS" (vé định kỳ) để giữ nguyên phần
  // hiển thị tách "Lượt" / "Vé" như cũ.
  const todaySessionRevenue = payments
    .filter(p => {
      if (!p.paidAt || p.referenceType !== "SESSION") return false;
      const paidDate = p.paidAt;
      const today = new Date();
      return paidDate.getDate() === today.getDate() &&
        paidDate.getMonth() === today.getMonth() &&
        paidDate.getFullYear() === today.getFullYear();
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  const todayPaymentRevenue = payments
    .filter(p => {
      // referenceType thật của Payment vé định kỳ là "PASS" (không phải "MONTHLY_PASS"
      // như comment trong Payment.java ghi — đã kiểm tra trực tiếp DriverController.java:634)
      if (!p.paidAt || p.referenceType !== "PASS") return false;
      const paidDate = p.paidAt;
      const today = new Date();
      return paidDate.getDate() === today.getDate() &&
        paidDate.getMonth() === today.getMonth() &&
        paidDate.getFullYear() === today.getFullYear();
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  const todayRevenue = todaySessionRevenue + todayPaymentRevenue;

  // Hiệu suất lấp đầy bình quân: Tổng số xe đang đỗ / tổng capacity thực tế
  const totalCapacity = zones.reduce((acc, z) => acc + (z.capacity || 0), 0);
  const totalOccupied = zones.reduce((acc, z) => acc + (z.occupied || 0), 0);
  const occupancyPercent = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 1000) / 10 : 0;

  // Lượt xe trong tháng: số lượng sessions có entryTime thuộc tháng hiện tại
  const monthlySessionsCount = sessions.filter(s => {
    if (!s.entryTime) return false;
    const entryDate = new Date(s.entryTime);
    const today = new Date();
    return entryDate.getMonth() === today.getMonth() && entryDate.getFullYear() === today.getFullYear();
  }).length;

  const displayMonthlyCount = monthlySessionsCount;

  // Số lượng vé tháng hoạt động thực tế
  const activePassesCount = passes.filter(p => p.status === "active").length;
  // Số lượng vé tháng chờ gia hạn tuần này (hết hạn trong 7 ngày tới)
  const expiringPassesCount = passes.filter(p => {
    if (p.status !== "active") return false;
    const endDate = new Date(p.end);
    const diffTime = endDate.getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }).length;

  // Thống kê doanh thu 7 ngày qua (cho biểu đồ cột tuần)
  const getLast7DaysRevenue = () => {
    const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    const result = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayLabel = days[d.getDay()];

      // Cùng lý do như todayRevenue phía trên: chỉ cộng từ payments (nguồn không trùng lặp),
      // không cộng thêm sessions.fee nữa.
      const dailyRevenue = payments
        .filter(p => {
          if (!p.paidAt) return false;
          const paidDate = p.paidAt;
          return paidDate.getDate() === d.getDate() &&
            paidDate.getMonth() === d.getMonth() &&
            paidDate.getFullYear() === d.getFullYear();
        })
        .reduce((acc, curr) => acc + curr.amount, 0);

      result.push({
        day: dayLabel,
        val: (dailyRevenue / 1000000).toFixed(2), // triệu đồng
        raw: dailyRevenue
      });
    }
    return result;
  };

  const weeklyRevenueData = getLast7DaysRevenue();
  const maxWeeklyVal = Math.max(...weeklyRevenueData.map(d => parseFloat(d.val)), 0.1);

  // Memoize zones cho 3D Twin — tránh tạo array mới mỗi lần render gây rebuild scene
  const twinZones = React.useMemo(() =>
    zones.map(z => ({
      ...z,
      currentCount: z.occupied,
      floorName: parkingConfig.floors?.find(f => f.id === z.floorId)?.floorName || "B1",
      vehicleTypeName: z.type,
    })),
    [zones, parkingConfig.floors]
  );

  return (
    <div ref={containerRef} className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans">

      {/* FULLSCREEN 3D DIGITAL TWIN OVERLAY */}
      {activeTab === "digitalTwin" && (
        <div className="fixed inset-0 z-[9999] bg-[#020617]">
          <button
            onClick={() => setActiveTab("dashboard")}
            className="fixed top-5 left-5 z-[10000] flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold backdrop-blur-xl transition-all cursor-pointer shadow-xl"
          >
            ← Quay lại Dashboard
          </button>
          <ParkingDigitalTwin3D
            zones={twinZones}
            floors={parkingConfig.floors || []}
            gates={gates}
            sessions={sessions}
            onRefresh={reloadAdminConfig}
          />
        </div>
      )}

      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-55 flex items-center gap-2 rounded-2xl px-5 py-3.5 text-xs font-bold text-white shadow-xl animate-bounce ${toast.type === "success" ? "bg-emerald-500" : toast.type === "warning" ? "bg-amber-500" : "bg-red-500"
          }`}>
          <span>{toast.type === "success" ? "✅" : toast.type === "warning" ? "⚠️" : "❌"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sidebar - Dark Glassmorphism style */}
      <aside
        className={`aside-panel fixed left-0 top-0 bottom-0 z-50 flex h-screen flex-col bg-slate-900 text-white shadow-xl transition-all duration-300 ${collapsed ? "w-20" : "w-72"
          }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center gap-3.5 px-6 py-6 border-b border-slate-800 overflow-hidden">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/20 font-black text-lg flex-shrink-0 cursor-pointer"
          >
            A
          </button>
          {!collapsed && (
            <div className="animate-fade-in-fast text-left">
              <h1 className="text-md font-extrabold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent whitespace-nowrap">
                Smart Parking
              </h1>
              <p className="text-xs text-purple-400 font-bold tracking-wider uppercase whitespace-nowrap">
                Hệ thống quản trị
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-y-auto overflow-x-hidden">
          <SidebarBtn active={activeTab === "dashboard"} collapsed={collapsed} label="Bảng tổng quan" icon={<IconDashboard />} onClick={() => setActiveTab("dashboard")} />
          <SidebarBtn active={activeTab === "digitalTwin"} collapsed={collapsed} label="Mô phỏng 3D" icon={<IconDigitalTwin />} onClick={() => setActiveTab("digitalTwin")} />
          <SidebarBtn active={activeTab === "users"} collapsed={collapsed} label="Quản lý người dùng" icon={<IconUsers />} onClick={() => setActiveTab("users")} />
          <SidebarBtn active={activeTab === "zones"} collapsed={collapsed} label="Phân khu đỗ xe" icon={<IconZones />} onClick={() => setActiveTab("zones")} />
          <SidebarBtn active={activeTab === "gates"} collapsed={collapsed} label="Cổng kiểm soát" icon={<IconGates />} onClick={() => setActiveTab("gates")} />
          <SidebarBtn active={activeTab === "tariffs"} collapsed={collapsed} label="Bảng biểu giá gửi" icon={<IconTariffs />} onClick={() => setActiveTab("tariffs")} />
          <SidebarBtn active={activeTab === "passes"} collapsed={collapsed} label="Gói định kỳ" icon={<IconPasses />} onClick={() => setActiveTab("passes")} />
          <SidebarBtn active={activeTab === "exceptions"} collapsed={collapsed} label="Nhật ký sự cố" icon={<IconExceptions />} onClick={() => setActiveTab("exceptions")} />
          <SidebarBtn active={activeTab === "reports"} collapsed={collapsed} label="Báo cáo doanh thu" icon={<IconReports />} onClick={() => setActiveTab("reports")} />
          <SidebarBtn active={activeTab === "infrastructure"} collapsed={collapsed} label="Cấu hình hạ tầng" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} onClick={() => setActiveTab("infrastructure")} />
          <SidebarBtn active={activeTab === "settings"} collapsed={collapsed} label="Cấu hình hệ thống" icon={<IconSettings />} onClick={() => setActiveTab("settings")} />
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-800 p-4 overflow-hidden">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-all duration-200 cursor-pointer"
          >
            <IconLogout />
            {!collapsed && <span className="whitespace-nowrap">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main
        className={`main-content-area flex-1 min-h-screen flex flex-col transition-all duration-300 ${collapsed ? "ml-20" : "ml-72"
          }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/80 px-8 backdrop-blur-md">
          <div className="flex flex-col text-left">
            <h2 className="text-xl font-bold text-slate-900">
              {activeTab === "dashboard" && "Hệ thống vận hành tổng quan"}
              {activeTab === "users" && "Quản lý nhân sự & Quyền hạn"}
              {activeTab === "zones" && "Thiết lập Phân khu đỗ xe"}
              {activeTab === "gates" && "Cổng kiểm soát Barrier & Camera AI"}
              {activeTab === "tariffs" && "Cấu hình Giá đỗ xe"}
              {activeTab === "passes" && "Danh sách Vé định kỳ Cư dân"}
              {activeTab === "exceptions" && "Nhật ký Ngoại lệ & Log an ninh"}
              {activeTab === "reports" && "Phân tích Số liệu Doanh thu"}
              {activeTab === "settings" && "Cài đặt Nghiệp vụ Bãi xe"}
              {activeTab === "infrastructure" && "Cấu hình Hạ tầng Bãi đỗ xe"}
              {activeTab === "digitalTwin" && "Mô phỏng 3D Digital Twin"}
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

            {/* Profile Avatar */}
            <div className="flex items-center gap-3.5 pl-6">
              <div className="text-right">
                <p className="font-semibold text-sm text-slate-900">
                  {fullName}
                </p>
                <p className="text-xs text-slate-400 font-medium">
                  System Admin
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 font-bold text-white shadow-md shadow-purple-500/20">
                {fullName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content Section */}
        <section className="flex-1 space-y-6 p-8">

          {/* Welcome Banner */}
          <div className="welcome-banner relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-lg border border-slate-800">
            {/* Mesh Glow Background */}
            <div className="absolute right-0 top-0 -mr-20 -mt-20 h-60 w-60 rounded-full bg-purple-600/30 blur-3xl" />
            <div className="absolute left-1/3 bottom-0 -mb-20 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />

            <div className="relative z-10 max-w-2xl text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-semibold mb-4 border border-purple-500/20">
                <span className="h-2 w-2 rounded-full bg-purple-500 animate-ping"></span>
                TRUNG TÂM QUẢN TRỊ CAO CẤP
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Hệ thống Quản trị SmartParking
              </h1>
              <p className="mt-2.5 text-slate-300 text-sm leading-relaxed max-w-lg">
                Chào mừng trở lại trung tâm kiểm soát {parkingConfig.buildings[0]?.name || "SmartParking"}. Giám sát hoạt động an ninh, doanh thu, thiết lập giá gửi, phân quyền nhân sự, và cứu hộ barrier trực tuyến.
              </p>
            </div>
          </div>

          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <AdminOverview
              users={users}
              gates={gates}
              zones={zones}
              logs={logs}
              todayRevenue={todayRevenue}
              settings={settings}
            />
          )}

          {/* TAB 2: USERS */}
          {activeTab === "users" && (
            <AdminUsers
              users={users}
              handleOpenAddUser={handleOpenAddUser}
              handleOpenEditUser={handleOpenEditUser}
              handleResetPassword={handleResetPassword}
              toggleUserStatus={toggleUserStatus}
              handleDeleteUser={handleDeleteUser}
            />
          )}

          {/* TAB 3: ZONES */}
          {activeTab === "zones" && (
            <AdminZones
              zones={zones}
              handleOpenEditZone={handleOpenEditZone}
              handleDeleteZone={handleDeleteZone}
            />
          )}

          {/* TAB 4: GATES */}
          {activeTab === "gates" && (
            <AdminGates
              gates={gates}
              zones={zones}
              handleOpenAddGate={handleOpenAddGate}
              handleOpenEditGate={handleOpenEditGate}
              handleDeleteGate={handleDeleteGate}
              toggleBarrier={toggleBarrier}
              toggleGateStatus={toggleGateStatus}
            />
          )}

          {/* TAB 5: TARIFFS */}
          {activeTab === "tariffs" && (
            <AdminTariffs
              tariffs={tariffs}
              settings={settings}
              handleOpenAddTariff={handleOpenAddTariff}
              handleOpenEditTariff={handleOpenEditTariff}
              reloadAdminConfig={reloadAdminConfig}
              showToast={showToast}
            />
          )}

          {/* TAB 6: PASSES */}
          {activeTab === "passes" && (
            <AdminPasses
              passes={passes}
              handleOpenAddPass={handleOpenAddPass}
              handleOpenEditPass={handleOpenEditPass}
              handleRenewPass={handleRenewPass}
              handleDeletePass={handleDeletePass}
            />
          )}


          {/* TAB 7: EXCEPTIONS & BLACKLIST */}
          {activeTab === "exceptions" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 space-y-6">
              <div className="flex justify-between items-center text-left border-b border-slate-100 pb-5">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base"> Log an ninh & Danh sách chặn (Blacklist)</h3>
                  <p className="text-xs text-slate-400 mt-1">Quản lý các sự cố an ninh và kiểm soát các phương tiện nằm trong danh sách đen của tòa nhà.</p>
                </div>
              </div>

              {/* Sub tabs navigation */}
              <div className="flex gap-1 border-b border-slate-200">
                {[
                  { id: "logs", label: "Nhật ký sự cố" },
                  { id: "blacklist", label: "Danh sách cấm (Blacklist)" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setExceptionsSubTab(tab.id)}
                    className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${exceptionsSubTab === tab.id
                      ? "border-red-600 text-red-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {exceptionsSubTab === "logs" && (
                <AdminExceptionLogs showToast={showToast} user={user} />
              )}

              {exceptionsSubTab === "blacklist" && (
                <AdminBlacklist showToast={showToast} user={user} />
              )}
            </div>
          )}

          {/* TAB 8: REPORTS */}
          {activeTab === "reports" && (
            <AdminReports
              todayRevenue={todayRevenue}
              todaySessionRevenue={todaySessionRevenue}
              todayPaymentRevenue={todayPaymentRevenue}
              payments={payments}
              occupancyPercent={occupancyPercent}
              activePassesCount={activePassesCount}
              expiringPassesCount={expiringPassesCount}
              displayMonthlyCount={displayMonthlyCount}
              weeklyRevenueData={weeklyRevenueData}
              maxWeeklyVal={maxWeeklyVal}
            />
          )}

          {/* TAB 9: SETTINGS */}
          {activeTab === "settings" && (
            <AdminSettings
              settings={settings}
              setSettings={setSettings}
              users={users}
              zones={zones}
              gates={gates}
              tariffs={tariffs}
              passes={passes}
              parkingConfig={parkingConfig}
              showToast={showToast}
            />
          )}

          {/* TAB 10: INFRASTRUCTURE */}
          {activeTab === "infrastructure" && (
            <AdminInfrastructure showToast={showToast} reloadAdminConfig={reloadAdminConfig} />
          )}

        </section>
      </main>

      {/* --- CÁC DIALOG MODAL CHO CÁC PHẦN CRUD KHÁC --- */}
      {/* 1. USER MODAL */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 text-left border border-slate-200">
            <h3 className="font-extrabold text-slate-900 text-base">{isEditingUser ? "Sửa tài khoản" : "Tạo tài khoản mới"}</h3>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Họ và tên</label>
                <input type="text" required value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Email đăng nhập</label>
                  <input type="email" required value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Điện thoại</label>
                  <input type="text" required value={userForm.phone} onChange={e => setUserForm({ ...userForm, phone: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Phân quyền (Role)</label>
                  <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                    <option value="driver">Driver</option>
                    <option value="staff">Staff</option>
                    <option value="security">Security</option>
                    <option value="manager">Manager</option>
                    <option value="admin">System Admin</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Trạng thái</label>
                  <select value={userForm.status} onChange={e => setUserForm({ ...userForm, status: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                    <option value="active">Hoạt động</option>
                    <option value="suspended">Khóa tài khoản</option>
                  </select>
                </div>
              </div>
              {!isEditingUser && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Mật khẩu tạm thời</label>
                  <input
                    type="text"
                    value={userForm.password}
                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="Để trống để hệ thống tự sinh"
                    className="w-full rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                  <p className="text-[10px] font-semibold text-amber-600">Mật khẩu chỉ hiển thị lúc tạo/reset, không thể xem lại từ DB.</p>
                </div>
              )}
              {createdCredentials && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
                  <p className="font-black uppercase tracking-wider">Thông tin đăng nhập mới tạo</p>
                  <p className="mt-2">Email: <span className="font-mono font-black">{createdCredentials.email}</span></p>
                  <p>Mật khẩu tạm: <span className="font-mono font-black text-emerald-900">{createdCredentials.password}</span></p>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(`${createdCredentials.email} / ${createdCredentials.password}`)}
                    className="mt-3 rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white"
                  >
                    Copy email / mật khẩu
                  </button>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setCreatedCredentials(null); setIsUserModalOpen(false); }} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-550 hover:bg-slate-100 transition-colors cursor-pointer">Hủy</button>
                <button type="submit" className="flex-1 rounded-xl bg-purple-600 text-white py-3 text-xs font-bold cursor-pointer transition-colors">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ZONE MODAL — chỉ sửa tên zone đã có. Sức chứa sửa ở tab "Cấu hình hạ tầng" (cần tính lại
          diện tích/validate theo diện tích tầng thật). Tạo zone mới dùng wizard "Quy hoạch zone". */}
      {isZoneModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-6 text-left border border-slate-200">
            <h3 className="font-extrabold text-slate-900 text-base">Sửa khu vực</h3>
            <form onSubmit={handleSaveZone} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tên phân khu đỗ</label>
                <input type="text" required value={zoneForm.name} onChange={e => setZoneForm({ ...zoneForm, name: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
              </div>
              <p className="text-[10px] text-slate-400">Muốn đổi sức chứa, vào tab "Cấu hình hạ tầng" → bấm vào zone tương ứng.</p>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsZoneModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-550 hover:bg-slate-100 transition-colors cursor-pointer">Hủy</button>
                <button type="submit" className="flex-1 rounded-xl bg-purple-600 text-white py-3 text-xs font-bold cursor-pointer transition-colors">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. GATE MODAL */}
      {isGateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-6 text-left border border-slate-200">
            <h3 className="font-extrabold text-slate-900 text-base">{isEditingGate ? "Cấu hình cổng" : "Thêm làn kiểm soát"}</h3>
            <form onSubmit={handleSaveGate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tòa nhà</label>
                <select value={gateForm.buildingId} onChange={e => setGateForm({ ...gateForm, buildingId: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                  {parkingConfig.buildings.map((building) => (
                    <option key={building.id} value={building.id}>{building.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tên Cổng / Làn</label>
                <input type="text" required value={gateForm.name} onChange={e => setGateForm({ ...gateForm, name: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Loại Cổng</label>
                <select value={gateForm.type} onChange={e => setGateForm({ ...gateForm, type: e.target.value, zoneId: e.target.value.startsWith("ZONE_") ? gateForm.zoneId : "" })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                  <option value="MAIN_ENTRY">Cổng chính — Vào</option>
                  <option value="MAIN_EXIT">Cổng chính — Ra</option>
                  <option value="MAIN_BOTH">Cổng chính — Hai chiều</option>
                  <option value="ZONE_ENTRY">Cổng Zone — Vào</option>
                  <option value="ZONE_EXIT">Cổng Zone — Ra</option>
                  <option value="ZONE_BOTH">Cổng Zone — Hai chiều</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Camera IP Address</label>
                <input type="text" required value={gateForm.cameraIp} onChange={e => setGateForm({ ...gateForm, cameraIp: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
              </div>
              {gateForm.type.startsWith("ZONE_") && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Gán vào Zone <span className="text-rose-500">*</span></label>
                  <select required value={gateForm.zoneId} onChange={e => setGateForm({ ...gateForm, zoneId: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                    <option value="">— Chọn zone —</option>
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.name} ({z.floorName} · {z.type})</option>
                    ))}
                  </select>
                  <p className="text-[9px] text-amber-600 font-medium">⚠ Cổng Zone phải gán vào zone để Staff check-in biết xe vào khu nào</p>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsGateModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">Hủy</button>
                <button type="submit" className="flex-1 rounded-xl bg-purple-600 text-white py-3 text-xs font-bold cursor-pointer transition-colors">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. TARIFF MODAL */}
      {isTariffModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-6 text-left border border-slate-200">
            <h3 className="font-extrabold text-slate-900 text-base">Cài đặt biểu phí mới</h3>
            <form onSubmit={handleSaveTariff} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tòa nhà</label>
                <select value={tariffForm.buildingId} onChange={e => setTariffForm({ ...tariffForm, buildingId: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                  {parkingConfig.buildings.map((building) => (
                    <option key={building.id} value={building.id}>{building.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Loại phương tiện</label>
                  <select value={tariffForm.vehicleTypeId} onChange={e => setTariffForm({ ...tariffForm, vehicleTypeId: e.target.value, vehicleType: vehicleTypeNameById(e.target.value) })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                    {parkingConfig.vehicleTypes.map((vehicleType) => (
                      <option key={vehicleType.id} value={vehicleType.id}>{vehicleType.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Kiểu thu phí</label>
                  <select value={tariffForm.type} onChange={e => setTariffForm({ ...tariffForm, type: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                    <option value="HOURLY">Theo Giờ</option>
                    <option value="DAILY">Theo Ngày</option>
                    <option value="MONTHLY">Vé Tháng</option>
                    <option value="QUARTERLY">Vé Quý</option>
                    <option value="YEARLY">Vé Năm</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Đơn giá ({settings.currency})</label>
                <input type="number" required min="0" value={tariffForm.price} onChange={e => setTariffForm({ ...tariffForm, price: parseInt(e.target.value) || 0 })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Số phút miễn phí</label>
                <input type="number" required min="0" value={tariffForm.freeMinutes} onChange={e => setTariffForm({ ...tariffForm, freeMinutes: parseInt(e.target.value) || 0 })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsTariffModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">Hủy</button>
                <button type="submit" className="flex-1 rounded-xl bg-purple-600 text-white py-3 text-xs font-bold cursor-pointer transition-colors">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MONTHLY PASS MODAL */}
      {isPassModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-6 text-left border border-slate-200">
            <h3 className="font-extrabold text-slate-900 text-base">{isEditingPass ? "Sửa vé định kỳ" : "Cấp vé định kỳ mới"}</h3>
            <form onSubmit={handleSavePass} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tài khoản khách hàng</label>
                <select required value={passForm.userId} onChange={e => { const selected = users.find((u) => u.id === e.target.value); setPassForm({ ...passForm, userId: e.target.value, owner: selected?.name || "" }); }} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                  <option value="">Chọn khách hàng</option>
                  {users.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.name} · {customer.email}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tòa nhà</label>
                <select value={passForm.buildingId} onChange={e => {
                  const bId = e.target.value;
                  const newFee = getPricingRuleFee(bId, passForm.vehicleTypeId, passForm.passType);
                  setPassForm({ ...passForm, buildingId: bId, fee: newFee });
                }} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                  {parkingConfig.buildings.map((building) => (
                    <option key={building.id} value={building.id}>{building.name}</option>
                  ))}
                </select>
              </div>
              {(() => {
                const selectedVT = parkingConfig.vehicleTypes.find(v => v.id === passForm.vehicleTypeId);
                const isBike = selectedVT?.name?.toLowerCase().includes("đạp") || selectedVT?.name?.toLowerCase().includes("dap");
                return (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        {isBike ? "Mã định danh (Hệ thống tự sinh)" : "Biển số đăng ký"}
                      </label>
                      <input
                        type="text"
                        required={!isBike}
                        disabled={isBike}
                        placeholder={isBike ? "Sẽ tự sinh khi lưu (VD: BC260701-0001)" : "VD: 30E-12345"}
                        value={isBike ? (passForm.plate || "") : passForm.plate}
                        onChange={e => setPassForm({ ...passForm, plate: e.target.value.toUpperCase() })}
                        className={`w-full rounded-xl border border-slate-200 p-3 text-xs font-bold focus:outline-none ${isBike ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-slate-50 text-slate-800"}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Loại xe</label>
                      <select
                        value={passForm.vehicleTypeId}
                        onChange={e => {
                          const vId = e.target.value;
                          const vType = parkingConfig.vehicleTypes.find(v => v.id === vId);
                          const nextIsBike = vType?.name?.toLowerCase().includes("đạp") || vType?.name?.toLowerCase().includes("dap");
                          const newFee = getPricingRuleFee(passForm.buildingId, vId, passForm.passType);
                          setPassForm({
                            ...passForm,
                            vehicleTypeId: vId,
                            type: vType?.name || "Xe máy",
                            plate: nextIsBike ? "" : passForm.plate,
                            fee: newFee
                          });
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white"
                      >
                        {parkingConfig.vehicleTypes.map((vehicleType) => (
                          <option key={vehicleType.id} value={vehicleType.id}>{vehicleType.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })()}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Gói vé định kỳ</label>
                  <select value={passForm.passType} onChange={e => {
                    const newType = e.target.value;
                    const newEnd = calculateEndDate(passForm.start, newType);
                    const newFee = getPricingRuleFee(passForm.buildingId, passForm.vehicleTypeId, newType);
                    setPassForm({ ...passForm, passType: newType, end: newEnd, fee: newFee });
                  }} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                    <option value="MONTHLY">Vé tháng</option>
                    <option value="QUARTERLY">Vé quý</option>
                    <option value="YEARLY">Vé năm</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Phí gói vé ({settings.currency})</label>
                  <input type="number" required min="0" value={passForm.fee} onChange={e => setPassForm({ ...passForm, fee: parseInt(e.target.value) || 0 })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Ngày bắt đầu</label>
                  <input type="date" required value={passForm.start} onChange={e => {
                    const newStart = e.target.value;
                    const newEnd = calculateEndDate(newStart, passForm.passType);
                    setPassForm({ ...passForm, start: newStart, end: newEnd });
                  }} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Ngày hết hạn</label>
                  <input type="date" required readOnly value={passForm.end} className="w-full rounded-xl border border-slate-200 bg-slate-100 p-3 text-xs font-bold text-slate-500 cursor-not-allowed focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsPassModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">Hủy</button>
                <button type="submit" className="flex-1 rounded-xl bg-purple-600 text-white py-3 text-xs font-bold cursor-pointer transition-colors">{isEditingPass ? "Lưu lại" : "Cấp vé"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. BLACKLIST MODAL */}
      {isBlacklistModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-6 text-left border border-slate-200">
            <h3 className="font-extrabold text-slate-900 text-base">Thêm biển số xe vào Blacklist</h3>
            <form onSubmit={handleSaveBlacklist} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Biển số xe</label>
                <input
                  type="text"
                  required
                  placeholder="VD: 30A-12345"
                  value={blacklistForm.licensePlate}
                  onChange={e => setBlacklistForm({ ...blacklistForm, licensePlate: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none uppercase font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Lý do cấm</label>
                <select
                  value={blacklistForm.reason}
                  onChange={e => setBlacklistForm({ ...blacklistForm, reason: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white"
                >
                  <option value="STOLEN">Xe trộm cắp</option>
                  <option value="DISTURBANCE">Gây rối / nguy cơ an ninh</option>
                  <option value="UNPAID_FEE">Nợ phí / chưa thanh toán</option>
                  <option value="SECURITY_RISK">Rủi ro an ninh</option>
                  <option value="OTHER">Lý do khác</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Mô tả chi tiết</label>
                <textarea
                  rows="3"
                  placeholder="Nhập thông tin chi tiết sự cố, biên bản hoặc hình thức xử phạt..."
                  value={blacklistForm.description}
                  onChange={e => setBlacklistForm({ ...blacklistForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-800 focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBlacklistModalOpen(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                  disabled={submittingBlacklist}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-red-600 text-white py-3 text-xs font-bold cursor-pointer transition-colors shadow-lg shadow-red-500/10"
                  disabled={submittingBlacklist}
                >
                  {submittingBlacklist ? "Đang lưu..." : "Thêm vào blacklist"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTS ---
function SidebarBtn({ label, active, onClick, collapsed, icon }) {
  return (
    <button
      onClick={onClick}
      className={`nav-link-item flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold transition-all duration-200 cursor-pointer ${active
        ? "bg-slate-800 text-purple-400 border border-slate-700 shadow-inner"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
        }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}

