import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { staffApi } from "../../api/parkingApi";
import ParkingDigitalTwin3D from "../manager/ParkingDigitalTwin3D";
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

  // Cài đặt hệ thống chung
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("admin_settings");
    return saved ? JSON.parse(saved) : { gracePeriod: 10, currency: "VND", vat: 10, systemName: "Bãi xe Thông minh SmartParking v2" };
  });

  const [settingsSubTab, setSettingsSubTab] = useState("business");
  const [enterpriseSettings, setEnterpriseSettings] = useState(() => {
    const saved = localStorage.getItem("admin_enterprise_settings");
    return saved ? JSON.parse(saved) : {
      vnpTmnCode: "TC202391",
      vnpHashSecret: "AB8972C10F928D37E82810CBE4D3E83B",
      vnpUrl: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
      autoLockBlacklist: true,
      occupancyAlertThreshold: 90,
      alertEmail: "admin@smartparking.com",
      backupInterval: "daily",
      enableApiLogging: true
    };
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
        setSettings(res.data.data || { gracePeriod: 10, currency: "VND", vat: 10, systemName: "Bãi xe Thông minh SmartParking v2" });
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
  const firstFloorId = () => parkingConfig.floors?.[0]?.id || "";
  const vehicleTypeNameById = (id) => parkingConfig.vehicleTypes?.find((v) => v.id === id)?.name || "Xe máy";
  const toZoneCode = (name) => {
    const normalized = String(name || "ZONE")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toUpperCase()
      .replace(/Đ/g, "D")
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return (normalized || "ZONE").slice(0, 10);
  };

  const mapPasses = (items) => (items || []).map((p) => ({
    id: p.id,
    owner: p.user?.fullName || "--",
    userId: p.user?.id || "",
    buildingId: p.building?.id || "",
    vehicleTypeId: p.vehicleType?.id || "",
    plate: p.licensePlate,
    type: p.vehicleType?.name || "--",
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

  const handleOpenAddZone = () => {
    const vehicleTypeId = firstVehicleTypeId();
    setZoneForm({ id: "", name: "", type: vehicleTypeNameById(vehicleTypeId), capacity: 100, occupied: 0, floorId: firstFloorId(), vehicleTypeId, status: "ACTIVE" });
    setIsEditingZone(false);
    setIsZoneModalOpen(true);
  };
  const handleOpenEditZone = (zone) => {
    setZoneForm({ ...zone, vehicleTypeId: zone.vehicleTypeId || firstVehicleTypeId(), floorId: zone.floorId || firstFloorId() });
    setIsEditingZone(true);
    setIsZoneModalOpen(true);
  };
  const handleSaveZone = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        floorId: zoneForm.floorId || firstFloorId(),
        vehicleTypeId: zoneForm.vehicleTypeId || firstVehicleTypeId(),
        zoneCode: toZoneCode(zoneForm.name),
        zoneName: zoneForm.name,
        capacity: zoneForm.capacity,
        status: zoneForm.status || "ACTIVE"
      };
      if (isEditingZone) await staffApi.updateZone(zoneForm.id, payload);
      else await staffApi.createZone(payload);
      await reloadAdminConfig();
      setIsZoneModalOpen(false);
      showToast(isEditingZone ? "Đã cập nhật zone" : "Đã tạo zone mới");
    } catch (err) {
      showToast(err.response?.data?.message || "Thao tác zone thất bại", "warning");
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

  const handleOpenAddPass = () => {
    const driver = users.find((u) => u.role === "driver") || users[0];
    const vehicleTypeId = firstVehicleTypeId();
    const todayStr = new Date().toISOString().split("T")[0];
    const defaultPassType = "MONTHLY";
    const calculatedEnd = calculateEndDate(todayStr, defaultPassType);
    
    setPassForm({ 
      id: "", 
      owner: driver?.name || "", 
      userId: driver?.id || "", 
      plate: "", 
      type: vehicleTypeNameById(vehicleTypeId), 
      vehicleTypeId, 
      buildingId: firstBuildingId(), 
      start: todayStr, 
      end: calculatedEnd, 
      status: "active", 
      passType: defaultPassType, 
      fee: 0 
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

  // Calculate dynamic stats from real backend data
  const todaySessionRevenue = sessions
    .filter(s => {
      if (!s.exitTime) return false;
      const exitDate = new Date(s.exitTime);
      const today = new Date();
      return exitDate.getDate() === today.getDate() &&
        exitDate.getMonth() === today.getMonth() &&
        exitDate.getFullYear() === today.getFullYear();
    })
    .reduce((acc, curr) => acc + (curr.fee || 0), 0);

  const todayPaymentRevenue = payments
    .filter(p => {
      if (!p.paidAt) return false;
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

      const dailySessionRevenue = sessions
        .filter(s => {
          if (!s.exitTime) return false;
          const exitDate = new Date(s.exitTime);
          return exitDate.getDate() === d.getDate() &&
            exitDate.getMonth() === d.getMonth() &&
            exitDate.getFullYear() === d.getFullYear();
        })
        .reduce((acc, curr) => acc + (curr.fee || 0), 0);

      const dailyPaymentRevenue = payments
        .filter(p => {
          if (!p.paidAt) return false;
          const paidDate = p.paidAt;
          return paidDate.getDate() === d.getDate() &&
            paidDate.getMonth() === d.getMonth() &&
            paidDate.getFullYear() === d.getFullYear();
        })
        .reduce((acc, curr) => acc + curr.amount, 0);

      const dailyRevenue = dailySessionRevenue + dailyPaymentRevenue;

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
          <SidebarBtn active={activeTab === "passes"} collapsed={collapsed} label="Vé định kỳ" icon={<IconPasses />} onClick={() => setActiveTab("passes")} />
          <SidebarBtn active={activeTab === "exceptions"} collapsed={collapsed} label="Nhật ký sự cố" icon={<IconExceptions />} onClick={() => setActiveTab("exceptions")} />
          <SidebarBtn active={activeTab === "reports"} collapsed={collapsed} label="Báo cáo doanh thu" icon={<IconReports />} onClick={() => setActiveTab("reports")} />
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
                🛡️ TRUNG TÂM QUẢN TRỊ CAO CẤP
              </span>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Hệ thống Quản trị SmartParking 👋
              </h1>
              <p className="mt-2.5 text-slate-300 text-sm leading-relaxed max-w-lg">
                Chào mừng trở lại trung tâm kiểm soát {settings.systemName}. Giám sát hoạt động an ninh, doanh thu, thiết lập giá gửi, phân quyền nhân sự, và cứu hộ barrier trực tuyến.
              </p>
            </div>
          </div>

          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Tổng người dùng" value={`${users.length} tài khoản`} icon="" accentColor="bg-blue-500" subtext="Staff, Security & Drivers" />
                <StatCard title="Số cổng kiểm soát" value={`${gates.length} làn trực tuyến`} icon="" accentColor="bg-purple-500" subtext="Hệ thống barrier AI live" />
                <StatCard title="Doanh thu hôm nay" value={`${todayRevenue.toLocaleString("vi-VN")}đ`} icon="" accentColor="bg-emerald-500" subtext={`Bypass ${settings.gracePeriod} phút đầu`} />
                <StatCard title="Log an ninh khẩn" value={`${logs.length} biên bản`} icon="" accentColor="bg-rose-500" subtext="Cần giám sát khẩn cấp" />
              </div>

              {/* Grid 2 Columns */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Phân khu đỗ */}
                <div className="action-panel-item lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 space-y-4">
                  <h3 className="font-extrabold text-slate-900 text-base text-left flex items-center gap-2">
                    <span className="w-1 h-5 rounded-full bg-purple-600 block"></span>
                    Công suất đỗ thực tế các phân khu
                  </h3>
                  <div className="space-y-5">
                    {(() => {
                      const floorOrder = (name) => {
                        if (!name) return 999;
                        const match = name.match(/^([BT])(\d+)$/i);
                        if (!match) return 999;
                        const [, prefix, num] = match;
                        return prefix.toUpperCase() === "B" ? -parseInt(num) : 100 + parseInt(num);
                      };
                      const sorted = [...zones].sort((a, b) => floorOrder(a.floorName) - floorOrder(b.floorName));
                      const grouped = [];
                      let lastFloor = null;
                      sorted.forEach(z => {
                        if (z.floorName !== lastFloor) {
                          grouped.push({ type: "header", floorName: z.floorName });
                          lastFloor = z.floorName;
                        }
                        grouped.push({ type: "zone", ...z });
                      });
                      return grouped.map((item, idx) => {
                        if (item.type === "header") {
                          return (
                            <div key={`hdr-${idx}`} className="pt-1">
                              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-1.5">
                                Tầng {item.floorName}
                              </p>
                            </div>
                          );
                        }
                        const percent = Math.min(100, Math.round((item.occupied / item.capacity) * 100));
                        return (
                          <div key={item.id} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className="text-slate-800">
                                {item.floorName} · {item.name} ({item.type})
                              </span>
                              <span className="text-slate-500">{item.occupied}/{item.capacity} xe ({percent}%)</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${percent > 90 ? "bg-red-500" : percent > 75 ? "bg-amber-500" : "bg-indigo-500"
                                }`} style={{ width: `${percent}%` }} />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Barrier Control Panel */}
                <div className="action-panel-item bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 flex flex-col space-y-4 text-left">
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <span className="w-1 h-5 rounded-full bg-purple-600 block"></span>
                    Khống chế Barrier cưỡng chế
                  </h3>
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
                    {gates.map(g => (
                      <div key={g.id} className="p-3.5 bg-slate-50/50 rounded-xl flex items-center justify-between border border-slate-100 hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{g.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Camera: {g.cameraIp}</p>
                        </div>
                        <button
                          onClick={() => toggleBarrier(g.id, g.barrier)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border cursor-pointer transition-colors ${g.barrier === "OPEN"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                            }`}
                        >
                          {g.barrier === "OPEN" ? "ĐANG MỞ" : "ĐANG ĐÓNG"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: USERS MANAGEMENT */}
          {activeTab === "users" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 space-y-6">
              <div className="flex justify-between items-center text-left">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Danh sách tài khoản hệ thống</h3>
                  <p className="text-xs text-slate-400">Quản trị phân quyền, gán vai trò & trạng thái các nhân viên bãi đỗ.</p>
                </div>
                <button onClick={handleOpenAddUser} className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors shadow-lg shadow-purple-500/10">
                  ➕ Thêm tài khoản mới
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="p-4">Họ và Tên</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Số điện thoại</th>
                      <th className="p-4">Phân quyền (Role)</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-900">{u.name}</td>
                        <td className="p-4 text-slate-500">{u.email}</td>
                        <td className="p-4 text-slate-500 font-mono">{u.phone}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${u.role === "admin" ? "bg-red-50 text-red-700 border border-red-100" :
                            u.role === "security" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                              u.role === "staff" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                                "bg-slate-100 text-slate-700"
                            }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 text-xs">
                          <span className={`inline-flex items-center gap-1 font-bold ${u.status === "active" ? "text-emerald-600" : "text-rose-600"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${u.status === "active" ? "bg-emerald-500" : "bg-rose-500"}`} />
                            {u.status === "active" ? "Hoạt động" : "Bị Khóa"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center gap-2 text-xs font-bold">
                            <button onClick={() => handleOpenEditUser(u)} className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors">Sửa</button>
                            <button onClick={() => handleResetPassword(u)} className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-100 cursor-pointer transition-colors">Reset MK</button>
                            <button onClick={() => toggleUserStatus(u.id)} className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors">Khóa/Mở</button>
                            {u.role !== "admin" && (
                              <button onClick={() => handleDeleteUser(u.id, u.name)} className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 cursor-pointer transition-colors">Xóa</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ZONES CONFIGURATION */}
          {activeTab === "zones" && (() => {
            // Group zones by floor, sorted logically
            const floorOrder = (name) => {
              const n = (name || "").toUpperCase();
              if (n.includes("B2")) return 1;
              if (n.includes("B1")) return 2;
              if (n.includes("T1") || n.includes("1")) return 3;
              if (n.includes("T2") || n.includes("2")) return 4;
              if (n.includes("T3") || n.includes("3")) return 5;
              return 99;
            };
            const grouped = {};
            zones.forEach(z => {
              const key = z.floorName || "Chưa phân tầng";
              if (!grouped[key]) grouped[key] = [];
              grouped[key].push(z);
            });
            // Sort floors, then sort zones within each floor by name
            const sortedFloors = Object.keys(grouped).sort((a, b) => floorOrder(a) - floorOrder(b));
            sortedFloors.forEach(f => grouped[f].sort((a, b) => (a.name || "").localeCompare(b.name || "")));

            return (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 space-y-6">
                <div className="flex justify-between items-center text-left">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Quy hoạch phân khu đỗ xe</h3>
                    <p className="text-xs text-slate-400">Phân định quy chuẩn sức chứa từng zone đỗ riêng biệt trong bãi. Tổng {zones.length} khu vực.</p>
                  </div>
                  <button onClick={handleOpenAddZone} className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors shadow-lg shadow-purple-500/10">
                    Thêm khu vực mới
                  </button>
                </div>

                {sortedFloors.map(floorName => {
                  const floorZones = grouped[floorName];
                  const floorCapacity = floorZones.reduce((s, z) => s + (z.capacity || 0), 0);
                  const floorOccupied = floorZones.reduce((s, z) => s + (z.occupied || 0), 0);
                  const floorPercent = floorCapacity > 0 ? Math.round((floorOccupied / floorCapacity) * 100) : 0;
                  return (
                    <div key={floorName} className="rounded-xl border border-slate-200 overflow-hidden">
                      {/* Floor header */}
                      <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 text-purple-700 font-black text-xs">
                            {floorName.replace(/Tầng\s*/i, "").trim() || "?"}
                          </span>
                          <div>
                            <span className="text-sm font-extrabold text-slate-800">{floorName}</span>
                            <span className="text-xs text-slate-400 ml-2">· {floorZones[0]?.buildingName}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-slate-500 font-semibold">{floorZones.length} khu vực</span>
                          <span className="text-xs font-bold text-slate-600">{floorOccupied}/{floorCapacity} xe</span>
                          <span className={`text-xs font-black ${floorPercent > 90 ? "text-red-500" : floorPercent > 75 ? "text-amber-500" : "text-emerald-500"}`}>{floorPercent}%</span>
                        </div>
                      </div>
                      {/* Zone cards in this floor */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {floorZones.map(z => {
                          const percent = z.capacity > 0 ? Math.min(100, Math.round((z.occupied / z.capacity) * 100)) : 0;
                          return (
                            <div key={z.id} className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3 hover:shadow-md transition-shadow text-left">
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">{z.type}</span>
                                <div className="flex gap-3 text-xs font-bold">
                                  <button onClick={() => handleOpenEditZone(z)} className="text-slate-500 hover:text-slate-900 cursor-pointer transition-colors">Sửa</button>
                                  <button onClick={() => handleDeleteZone(z.id, z.name)} className="text-red-500 hover:text-red-700 cursor-pointer transition-colors">Xóa</button>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-extrabold text-slate-900 text-sm">{z.name}</h4>
                                <p className="text-[10px] text-slate-400 font-mono mt-1.5">Sức chứa: {z.occupied} / {z.capacity} xe ({percent}%)</p>
                              </div>
                              <div className="h-1.5 w-full bg-slate-200/60 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-500 ${percent > 90 ? "bg-red-500" : percent > 75 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${percent}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* TAB 4: GATES CONTROL */}
          {activeTab === "gates" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 space-y-6">
              <div className="flex justify-between items-center text-left">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Cổng kiểm soát & Làn Barrier</h3>
                  <p className="text-xs text-slate-400">Giám sát các camera IP nhận diện AI & thiết bị ngoại vi làn vào/ra.</p>
                </div>
                <button onClick={handleOpenAddGate} className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors shadow-lg shadow-purple-500/10">
                  🚧 Thêm làn mới
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {gates.map(g => (
                  <div key={g.id} className={`rounded-2xl border p-5 flex justify-between items-center transition-colors ${g.status === "active" ? "border-slate-200/80 bg-slate-50/50 hover:bg-slate-50" : "border-amber-200 bg-amber-50/30 opacity-75"}`}>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${g.type.includes("ENTRY")
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : g.type.includes("BOTH")
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          }`}>
                          {g.type.startsWith("ZONE_") ? "ZONE" : "CHÍNH"} · {g.type.includes("ENTRY") ? "VÀO" : g.type.includes("BOTH") ? "2 CHIỀU" : "RA"}
                        </span>
                        <span className={`h-2 w-2 rounded-full ${g.status === "active" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                      </div>
                      <h4 className={`font-extrabold text-sm ${g.status === "active" ? "text-slate-900" : "text-slate-500 line-through"}`}>{g.name}</h4>
                      <p className="text-[10px] text-slate-450 font-mono">Địa chỉ IP Camera: {g.cameraIp}</p>
                      {g.zoneId && (() => { const z = zones.find(z => z.id === g.zoneId); return z ? <p className="text-[10px] text-blue-600 font-bold">📍 Zone: {z.name} ({z.floorName})</p> : null; })()}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => toggleBarrier(g.id, g.barrier)}
                        disabled={g.status === "inactive"}
                        className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${g.status === "inactive"
                          ? "bg-slate-300 text-slate-500 border-slate-300 cursor-not-allowed"
                          : g.barrier === "OPEN"
                            ? "bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/10"
                            : "bg-slate-800 text-white hover:bg-slate-700"
                          }`}
                      >
                        {g.status === "inactive" ? "⛔ ĐANG BẢO TRÌ" : g.barrier === "OPEN" ? "🔓 OVERRIDE MỞ" : "🔒 KHÓA BẢO VỆ"}
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleGateStatus(g)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors border ${g.status === "active"
                            ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                            }`}
                        >
                          {g.status === "active" ? "🔧 Tắt (Bảo trì)" : "✅ Kích hoạt"}
                        </button>
                        <button onClick={() => handleDeleteGate(g.id, g.name)} className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-200 cursor-pointer transition-colors text-xs">Xóa</button>
                      </div>
                      <span className={`text-[9px] font-black uppercase ${g.status === "active" ? "text-emerald-500" : "text-amber-500"}`}>{g.status === "active" ? "● Online" : "● Bảo trì"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: TARIFFS (Cấu hình bảng biểu giá) */}
          {activeTab === "tariffs" && (() => {
            const grouped = tariffs.reduce((acc, t) => {
              const key = t.vehicleType || "Khác";
              if (!acc[key]) acc[key] = [];
              acc[key].push(t);
              return acc;
            }, {});
            return (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 space-y-6">
                <div className="flex justify-between items-center text-left">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Bảng biểu phí đỗ xe</h3>
                    <p className="text-xs text-slate-400 mt-1">Giá gửi xe theo từng loại phương tiện.</p>
                  </div>
                  <button onClick={handleOpenAddTariff} className="rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors">
                    Thêm biểu phí
                  </button>
                </div>

                <div className="space-y-4">
                  {Object.entries(grouped).map(([vehicleType, items]) => (
                    <div key={vehicleType} className="rounded-xl border border-slate-200 overflow-hidden">
                      <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">{vehicleType}</span>
                        <span className="text-xs text-slate-500 font-medium">{items.length} mức giá</span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {items.map(t => (
                          <div key={t.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-6 min-w-0">
                              <span className="text-sm text-slate-700 font-semibold w-24 flex-shrink-0">{t.type === "HOURLY" ? "Theo giờ" : t.type === "DAILY" ? "Theo ngày" : t.type === "MONTHLY" ? "Vé tháng" : t.type === "QUARTERLY" ? "Vé quý" : "Vé năm"}</span>
                              <span className="text-base font-extrabold text-slate-900 tabular-nums">{t.price.toLocaleString("vi-VN")} <span className="text-slate-500 font-semibold text-sm">{settings.currency}</span></span>
                              {t.freeMinutes > 0 && <span className="text-xs text-slate-500 font-medium">miễn phí {t.freeMinutes} phút đầu</span>}
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button onClick={() => handleOpenEditTariff(t)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors">Sửa</button>
                              <button onClick={async () => { if (window.confirm(`Xóa biểu phí ${t.vehicleType}?`)) { await staffApi.deletePricingRule(t.id); await reloadAdminConfig(); showToast("Đã xóa biểu phí", "warning"); } }} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer transition-colors">Xóa</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {tariffs.length === 0 && (
                  <p className="text-center text-sm text-slate-400 py-8">Chưa có biểu phí nào.</p>
                )}
              </div>
            );
          })()}

          {/* TAB 6: PERIODIC PASSES (Vé tháng/quý/năm) */}
          {activeTab === "passes" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 space-y-6">
              <div className="flex justify-between items-center text-left">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Quản lý vé định kỳ (Tháng / Quý / Năm)</h3>
                  <p className="text-xs text-slate-400">Kiểm soát vé định kỳ theo tháng, quý, năm cho biển số đăng ký và cấp quyền ra vào tự động.</p>
                </div>
                <button onClick={handleOpenAddPass} className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors shadow-lg shadow-purple-500/10">
                  🎫 Phát hành vé định kỳ mới
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="p-4">Chủ sở hữu</th>
                      <th className="p-4">Đăng ký Biển số</th>
                      <th className="p-4">Loại xe</th>
                      <th className="p-4">Gói vé</th>
                      <th className="p-4">Thời điểm cấp</th>
                      <th className="p-4">Hạn sử dụng</th>
                      <th className="p-4">Tình trạng</th>
                      <th className="p-4 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                    {passes.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold text-slate-900">{p.owner}</td>
                        <td className="p-4">
                          <LicensePlate plate={p.plate} />
                        </td>
                        <td className="p-4 font-bold text-slate-500">{p.type}</td>
                        <td className="p-4 font-bold text-slate-500">{p.passType === "YEARLY" ? "Vé năm" : p.passType === "QUARTERLY" ? "Vé quý" : "Vé tháng"}</td>
                        <td className="p-4 text-slate-500 font-mono">{p.start}</td>
                        <td className="p-4 text-slate-500 font-mono">{p.end}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${p.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                            }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${p.status === "active" ? "bg-emerald-500" : "bg-red-500"}`} />
                            {p.status === "active" ? "Còn hạn" : "Hết hạn"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => handleRenewPass(p.id)} className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 cursor-pointer transition-colors">Gia hạn {p.passType === "YEARLY" ? "1 năm" : p.passType === "QUARTERLY" ? "1 quý" : "1 tháng"}</button>
                            <button onClick={() => handleOpenEditPass(p)} className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 cursor-pointer transition-colors">Sửa</button>
                            <button onClick={() => handleDeletePass(p.id, p.plate)} className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-200 cursor-pointer transition-colors">Xóa</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: EXCEPTIONS LOGS */}
          {activeTab === "exceptions" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 space-y-6">
              <div className="flex justify-between items-center text-left border-b border-slate-100 pb-5">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">🚨 Log an ninh & Danh sách chặn (Blacklist)</h3>
                  <p className="text-xs text-slate-400 mt-1">Quản lý các sự cố an ninh và kiểm soát các phương tiện nằm trong danh sách đen của tòa nhà.</p>
                </div>
                {exceptionsSubTab === "blacklist" && (
                  <button onClick={() => {
                    setBlacklistForm({ licensePlate: "", reason: "STOLEN", description: "" });
                    setIsBlacklistModalOpen(true);
                  }} className="rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors shadow-lg shadow-red-500/10">
                    ➕ Thêm biển số blacklist
                  </button>
                )}
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
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="p-4">Mã Log</th>
                        <th className="p-4">Thời gian</th>
                        <th className="p-4">Biển số</th>
                        <th className="p-4">Bảo an xử lý</th>
                        <th className="p-4">Chi tiết sự cố</th>
                        <th className="p-4">Mức độ nguy cấp</th>
                        <th className="p-4">Giải pháp xử lý</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 font-medium text-slate-600">
                      {logs.map(l => (
                        <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-400">{l.id}</td>
                          <td className="p-4 text-slate-550 font-mono">{l.time}</td>
                          <td className="p-4">
                            <LicensePlate plate={l.plate} />
                          </td>
                          <td className="p-4 text-slate-800 font-extrabold">{l.handler}</td>
                          <td className="p-4 text-slate-700 font-semibold">{l.issue}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider inline-block ${l.severity === "high" ? "bg-red-50 text-red-700 border border-red-200 animate-pulse" :
                              l.severity === "medium" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}>
                              {l.severity === "high" ? "Khẩn cấp" : l.severity === "medium" ? "Cần lưu ý" : "Thấp"}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-emerald-600">{l.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {logs.length === 0 && (
                    <p className="text-center text-sm text-slate-400 py-8">Chưa có nhật ký sự cố nào.</p>
                  )}
                </div>
              )}

              {exceptionsSubTab === "blacklist" && (
                <div className="space-y-4">
                  {/* Summary badges */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-red-50 border border-red-100 px-3 py-1 text-xs font-bold text-red-700">
                      🚫 Đang chặn: {blacklist.filter(item => item.isActive !== false).length}
                    </span>
                    <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-500">
                      ✅ Đã gỡ: {blacklist.filter(item => item.isActive === false).length}
                    </span>
                    <span className="rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-bold text-blue-600">
                      📋 Tổng cộng: {blacklist.length}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                        <tr>
                          <th className="p-4">Biển số</th>
                          <th className="p-4">Lý do cấm</th>
                          <th className="p-4">Người thêm</th>
                          <th className="p-4">Ngày thêm</th>
                          <th className="p-4">Trạng thái</th>
                          <th className="p-4 text-center">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
                        {blacklist.map((item) => (
                          <tr
                            key={item.id}
                            className={`hover:bg-slate-50/50 transition-colors ${item.isActive === false ? "opacity-45" : ""}`}
                          >
                            <td className="p-4">
                              <LicensePlate plate={item.licensePlate} />
                            </td>
                            <td className="p-4">
                              <p className="font-bold text-slate-900">
                                {item.reason === "STOLEN" ? "Xe trộm cắp" :
                                 item.reason === "DISTURBANCE" ? "Gây rối / nguy cơ an ninh" :
                                 item.reason === "UNPAID_FEE" ? "Nợ phí / chưa thanh toán" :
                                 item.reason === "SECURITY_RISK" ? "Rủi ro an ninh" : "Lý do khác"}
                              </p>
                              <p className="mt-0.5 text-xs text-slate-400 font-medium">{item.description}</p>
                            </td>
                            <td className="p-4 font-bold text-slate-800">{item.addedBy || "Hệ thống"}</td>
                            <td className="p-4 text-slate-500 font-mono text-xs">
                              {item.addedAt ? new Date(item.addedAt).toLocaleString("vi-VN") : "—"}
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${item.isActive !== false ? "bg-red-50 text-red-700 border border-red-200" : "bg-slate-150 text-slate-500 border border-slate-200"}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${item.isActive !== false ? "bg-red-500" : "bg-slate-400"}`} />
                                {item.isActive !== false ? "Đang chặn" : "Đã gỡ"}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex justify-center">
                                {item.isActive !== false ? (
                                  <button
                                    onClick={() => handleRemoveBlacklist(item.id, item.licensePlate)}
                                    className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-200 cursor-pointer transition-colors"
                                  >
                                    🔓 Gỡ chặn
                                  </button>
                                ) : (
                                  <span className="text-xs text-slate-400 font-semibold">—</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {blacklist.length === 0 && (
                      <p className="text-center text-sm text-slate-400 py-8">Chưa có biển số nào bị cấm.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 8: REPORTS & REVENUE ANALYSIS */}
          {activeTab === "reports" && (() => {
            const weekTotal = weeklyRevenueData.reduce((s, d) => s + d.raw, 0);
            const monthlyPaymentRevenue = payments
              .filter(p => { if (!p.paidAt) return false; const d = p.paidAt; const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
              .reduce((s, p) => s + p.amount, 0);
            const monthlySessionRevenue = sessions
              .filter(s => { if (!s.exitTime) return false; const d = new Date(s.exitTime); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
              .reduce((s, c) => s + (c.fee || 0), 0);
            const monthlyTotal = monthlySessionRevenue + monthlyPaymentRevenue;
            const recentPayments = [...payments].sort((a, b) => (b.paidAt || 0) - (a.paidAt || 0)).slice(0, 8);

            return (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm text-left">
                  <h3 className="font-extrabold text-slate-900 text-base">Báo cáo doanh thu</h3>
                  <p className="text-xs text-slate-400 mt-1">Tổng hợp doanh thu từ phí gửi xe lượt và thanh toán vé định kỳ.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl border border-slate-200/80 p-5 text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Doanh thu hôm nay</p>
                    <h4 className="text-xl font-extrabold text-slate-900 mt-2 tabular-nums">{todayRevenue.toLocaleString("vi-VN")}đ</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-semibold text-slate-500">Lượt: {todaySessionRevenue.toLocaleString("vi-VN")}đ</span>
                      <span className="text-[10px] text-slate-300">|</span>
                      <span className="text-[10px] font-semibold text-indigo-500">Vé: {todayPaymentRevenue.toLocaleString("vi-VN")}đ</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200/80 p-5 text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Doanh thu tháng</p>
                    <h4 className="text-xl font-extrabold text-slate-900 mt-2 tabular-nums">{monthlyTotal.toLocaleString("vi-VN")}đ</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-semibold text-slate-500">Lượt: {monthlySessionRevenue.toLocaleString("vi-VN")}đ</span>
                      <span className="text-[10px] text-slate-300">|</span>
                      <span className="text-[10px] font-semibold text-indigo-500">Vé: {monthlyPaymentRevenue.toLocaleString("vi-VN")}đ</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200/80 p-5 text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Hiệu suất lấp đầy</p>
                    <h4 className="text-xl font-extrabold text-slate-900 mt-2">{occupancyPercent}%</h4>
                    <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(occupancyPercent, 100)}%`, background: occupancyPercent > 90 ? '#f59e0b' : '#10b981' }} />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200/80 p-5 text-left">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Vé định kỳ</p>
                    <h4 className="text-xl font-extrabold text-slate-900 mt-2">{activePassesCount} đang hoạt động</h4>
                    <p className="text-[10px] font-semibold text-amber-500 mt-2">{expiringPassesCount > 0 ? `${expiringPassesCount} vé sắp hết hạn` : "Không có vé sắp hết hạn"}</p>
                  </div>
                </div>

                {/* Chart + Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Weekly Chart */}
                  <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-800 p-6 text-white text-left">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Doanh thu 7 ngày qua</h4>
                        <p className="text-2xl font-extrabold text-white mt-1 tabular-nums">{weekTotal.toLocaleString("vi-VN")}đ</p>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">Đơn vị: VND</span>
                    </div>

                    <div className="h-48 flex items-end justify-between gap-3 px-2 border-b border-white/10">
                      {weeklyRevenueData.map((d, index) => {
                        const isToday = index === weeklyRevenueData.length - 1;
                        const barMaxPx = 170;
                        const barH = maxWeeklyVal > 0 ? Math.max(6, Math.round((parseFloat(d.val) / maxWeeklyVal) * barMaxPx)) : 6;
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center justify-end gap-1.5 group" style={{ height: '100%' }}>
                            <span className="text-[10px] font-bold text-slate-400 tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">{d.raw.toLocaleString("vi-VN")}đ</span>
                            <div
                              className="w-full rounded-t-md transition-all duration-500"
                              style={{
                                height: `${barH}px`,
                                background: isToday ? 'linear-gradient(to top, #6366f1, #818cf8)' : 'linear-gradient(to top, #334155, #475569)',
                              }}
                            />
                            <span className={`text-[10px] font-bold ${isToday ? "text-indigo-400" : "text-slate-500"}`}>{d.day}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Revenue Breakdown */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-left space-y-5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Cơ cấu doanh thu tháng</h4>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-semibold text-slate-700">Phí gửi xe lượt</span>
                          <span className="font-bold text-slate-900 tabular-nums">{monthlySessionRevenue.toLocaleString("vi-VN")}đ</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-600 rounded-full transition-all duration-500" style={{ width: monthlyTotal > 0 ? `${(monthlySessionRevenue / monthlyTotal * 100)}%` : '0%' }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-semibold text-slate-700">Thanh toán vé định kỳ</span>
                          <span className="font-bold text-slate-900 tabular-nums">{monthlyPaymentRevenue.toLocaleString("vi-VN")}đ</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: monthlyTotal > 0 ? `${(monthlyPaymentRevenue / monthlyTotal * 100)}%` : '0%' }} />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex justify-between">
                        <span className="text-sm font-bold text-slate-700">Tổng tháng</span>
                        <span className="text-sm font-extrabold text-slate-900 tabular-nums">{monthlyTotal.toLocaleString("vi-VN")}đ</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Thống kê nhanh</p>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Lượt xe trong tháng</span>
                        <span className="font-bold text-slate-800">{displayMonthlyCount}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Giao dịch online</span>
                        <span className="font-bold text-slate-800">{payments.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Transactions */}
                {recentPayments.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-left">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Giao dịch thanh toán gần đây</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                          <tr>
                            <th className="pb-3 text-left">Loại</th>
                            <th className="pb-3 text-left">Phương thức</th>
                            <th className="pb-3 text-right">Số tiền</th>
                            <th className="pb-3 text-right">Thời gian</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {recentPayments.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 text-left">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${p.referenceType === "MONTHLY_PASS" ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-600"}`}>
                                  {p.referenceType === "MONTHLY_PASS" ? "Vé định kỳ" : p.referenceType === "SESSION" ? "Phí lượt" : p.referenceType}
                                </span>
                              </td>
                              <td className="py-3 text-left text-slate-600 font-medium">{p.paymentMethod === "ONLINE" ? "VNPAY" : p.paymentMethod}</td>
                              <td className="py-3 text-right font-bold text-slate-900 tabular-nums">{p.amount.toLocaleString("vi-VN")}đ</td>
                              <td className="py-3 text-right text-slate-400 text-xs tabular-nums">{p.paidAt ? p.paidAt.toLocaleString("vi-VN") : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 9: SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm text-left">
                <h3 className="font-extrabold text-slate-950 text-base">Cấu hình hệ thống</h3>
                <p className="text-xs text-slate-600 mt-1">Quản lý toàn bộ tham số vận hành, tài chính, bảo mật và tích hợp bên thứ ba.</p>
              </div>

              {/* Sub Navigation Tabs */}
              <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
                {[
                  { id: "business", label: "Nghiệp vụ & Hiển thị" },
                  { id: "vnpay", label: "Thanh toán & VNPAY" },
                  { id: "security", label: "An ninh & Tự động hóa" },
                  { id: "maintenance", label: "Hệ thống & Dữ liệu" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSettingsSubTab(tab.id)}
                    className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${settingsSubTab === tab.id
                      ? "border-slate-900 text-slate-950"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Sub Tab Contents */}
                <div className="lg:col-span-2 space-y-6">

                  {/* Sub Tab: Business & UI Settings */}
                  {settingsSubTab === "business" && (
                    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden text-left">
                      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Cấu hình nghiệp vụ & Giao diện</h4>
                      </div>
                      <div className="p-6 space-y-5">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Tên hệ thống quản trị</label>
                          <input
                            type="text"
                            value={settings.systemName}
                            onChange={e => setSettings({ ...settings, systemName: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                          />
                          <p className="text-[10px] text-slate-600">Hiển thị trên tiêu đề bảng điều khiển và báo cáo PDF.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Ngôn ngữ giao diện</label>
                            <select
                              value="vi"
                              disabled
                              className="w-full rounded-xl border border-slate-200 bg-slate-100 p-3 text-sm font-bold text-slate-900 focus:outline-none"
                            >
                              <option value="vi">Tiếng Việt (Mặc định)</option>
                              <option value="en">English (US)</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Múi giờ hệ thống</label>
                            <select
                              value="GMT+7"
                              disabled
                              className="w-full rounded-xl border border-slate-200 bg-slate-100 p-3 text-sm font-bold text-slate-900 focus:outline-none"
                            >
                              <option value="GMT+7">GMT+7 (Asia/Ho_Chi_Minh)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sub Tab: Payments & VNPAY */}
                  {settingsSubTab === "vnpay" && (
                    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden text-left space-y-6">
                      <div className="p-6 space-y-5">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b pb-3">Tài chính bãi đỗ</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Đơn vị tiền tệ</label>
                            <select
                              value={settings.currency}
                              onChange={e => setSettings({ ...settings, currency: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white transition-all cursor-pointer"
                            >
                              <option value="VND">VND (đ)</option>
                              <option value="USD">USD ($)</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Thuế suất VAT (%)</label>
                            <input
                              type="number"
                              value={settings.vat}
                              onChange={e => setSettings({ ...settings, vat: parseInt(e.target.value) || 0 })}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Miễn phí đỗ (Phút)</label>
                            <input
                              type="number"
                              value={settings.gracePeriod}
                              onChange={e => setSettings({ ...settings, gracePeriod: parseInt(e.target.value) || 0 })}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-600">Thời gian miễn phí áp dụng cho xe ra/vào nhanh trong bãi không tính phí.</p>
                      </div>

                      <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-5">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b pb-3">Tích hợp cổng thanh toán VNPAY</h4>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">VNP_TMNCODE (Merchant ID)</label>
                              <input
                                type="text"
                                value={enterpriseSettings.vnpTmnCode}
                                onChange={e => setEnterpriseSettings({ ...enterpriseSettings, vnpTmnCode: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 transition-all font-mono"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">VNP_HASHSECRET (Secret Key)</label>
                              <input
                                type="password"
                                value={enterpriseSettings.vnpHashSecret}
                                onChange={e => setEnterpriseSettings({ ...enterpriseSettings, vnpHashSecret: e.target.value })}
                                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 transition-all font-mono"
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">VNPAY Payment Endpoint URL</label>
                            <input
                              type="text"
                              value={enterpriseSettings.vnpUrl}
                              onChange={e => setEnterpriseSettings({ ...enterpriseSettings, vnpUrl: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 transition-all font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sub Tab: Security & Automation */}
                  {settingsSubTab === "security" && (
                    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden text-left space-y-6">
                      <div className="p-6 space-y-5">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b pb-3">Chính sách bảo mật & Cứu hộ</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Chế độ SOS khẩn cấp</label>
                            <div
                              onClick={() => setSettings({ ...settings, sosEnabled: !settings.sosEnabled })}
                              className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${settings.sosEnabled ? "border-red-200 bg-red-50/50" : "border-slate-200 bg-slate-50"}`}
                            >
                              <div className={`w-9 h-5 rounded-full relative transition-colors ${settings.sosEnabled ? "bg-red-500" : "bg-slate-300"}`}>
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.sosEnabled ? "left-[18px]" : "left-0.5"}`} />
                              </div>
                              <span className="text-sm font-extrabold text-slate-850">{settings.sosEnabled ? "Bật khẩn cấp" : "Tắt khẩn cấp"}</span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Tự khóa cổng khi biển số Blacklist</label>
                            <div
                              onClick={() => setEnterpriseSettings({ ...enterpriseSettings, autoLockBlacklist: !enterpriseSettings.autoLockBlacklist })}
                              className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${enterpriseSettings.autoLockBlacklist ? "border-amber-200 bg-amber-50/50" : "border-slate-200 bg-slate-50"}`}
                            >
                              <div className={`w-9 h-5 rounded-full relative transition-colors ${enterpriseSettings.autoLockBlacklist ? "bg-amber-500" : "bg-slate-300"}`}>
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enterpriseSettings.autoLockBlacklist ? "left-[18px]" : "left-0.5"}`} />
                              </div>
                              <span className="text-sm font-extrabold text-slate-850">{enterpriseSettings.autoLockBlacklist ? "Tự động khóa" : "Bỏ qua cảnh báo"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-4">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b pb-3">Thông báo & Cảnh báo khẩn</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Email nhận log khẩn cấp</label>
                            <input
                              type="email"
                              value={enterpriseSettings.alertEmail}
                              onChange={e => setEnterpriseSettings({ ...enterpriseSettings, alertEmail: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Ngưỡng báo động đầy bãi (%)</label>
                            <input
                              type="number"
                              value={enterpriseSettings.occupancyAlertThreshold}
                              onChange={e => setEnterpriseSettings({ ...enterpriseSettings, occupancyAlertThreshold: parseInt(e.target.value) || 0 })}
                              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Sub Tab: Maintenance & System */}
                  {settingsSubTab === "maintenance" && (
                    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden text-left space-y-6">
                      <div className="p-6 space-y-5">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b pb-3">Sao lưu & Bảo trì</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Tự động sao lưu dữ liệu</label>
                            <select
                              value={enterpriseSettings.backupInterval}
                              onChange={e => setEnterpriseSettings({ ...enterpriseSettings, backupInterval: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white transition-all cursor-pointer"
                            >
                              <option value="daily">Hàng ngày (00:00)</option>
                              <option value="weekly">Hàng tuần (Chủ nhật)</option>
                              <option value="monthly">Hàng tháng (Ngày 1)</option>
                              <option value="none">Tắt tự động sao lưu</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Log API Request/Response</label>
                            <div
                              onClick={() => setEnterpriseSettings({ ...enterpriseSettings, enableApiLogging: !enterpriseSettings.enableApiLogging })}
                              className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${enterpriseSettings.enableApiLogging ? "border-indigo-200 bg-indigo-50/50" : "border-slate-200 bg-slate-50"}`}
                            >
                              <div className={`w-9 h-5 rounded-full relative transition-colors ${enterpriseSettings.enableApiLogging ? "bg-indigo-500" : "bg-slate-300"}`}>
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enterpriseSettings.enableApiLogging ? "left-[18px]" : "left-0.5"}`} />
                              </div>
                              <span className="text-sm font-extrabold text-slate-850">{enterpriseSettings.enableApiLogging ? "Ghi log chi tiết" : "Tắt ghi log"}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-4">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b pb-3">Thao tác cơ sở dữ liệu</h4>
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              showToast("Bắt đầu kết xuất dữ liệu cấu hình hệ thống JSON...", "info");
                              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ settings, enterpriseSettings, tariffs, zones, gates }));
                              const dlAnchorElem = document.createElement('a');
                              dlAnchorElem.setAttribute("href", dataStr);
                              dlAnchorElem.setAttribute("download", `smartparking_config_backup_${new Date().toISOString().slice(0, 10)}.json`);
                              dlAnchorElem.click();
                              showToast("Xuất cấu hình thành công!", "success");
                            }}
                            className="px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-sm transition-all"
                          >
                            Xuất cấu hình hệ thống
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm("Bạn có chắc chắn muốn dọn dẹp các log bảo mật đã xử lý? Hành động này không thể hoàn tác.")) {
                                showToast("Đang dọn dẹp nhật ký sự cố cũ...", "info");
                                setTimeout(() => showToast("Đã xóa 0 log lịch sử chưa sử dụng.", "success"), 800);
                              }
                            }}
                            className="px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-red-650 hover:text-red-700 shadow-sm transition-all"
                          >
                            Dọn dẹp Exception Logs
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Save button */}
                  <div className="flex items-center gap-4 text-left">
                    <button
                      onClick={async () => {
                        try {
                          const res = await staffApi.updateAdminSettings(settings);
                          setSettings(res.data.data || settings);
                          localStorage.setItem("admin_enterprise_settings", JSON.stringify(enterpriseSettings));
                          showToast("Đã lưu cài đặt hệ thống thành công!");
                        } catch (err) {
                          showToast(err.response?.data?.message || "Lưu cài đặt thất bại", "warning");
                        }
                      }}
                      className="rounded-xl bg-slate-900 hover:bg-slate-800 px-8 py-3 text-xs font-extrabold text-white cursor-pointer transition-colors"
                    >
                      Lưu thiết lập
                    </button>
                    <p className="text-[10px] text-slate-650 font-bold">Thay đổi sẽ áp dụng ngay lập tức cho toàn bộ các cổng và phiên làm việc.</p>
                  </div>
                </div>

                {/* Right Column - System Info & Stats */}
                <div className="space-y-6 text-left">
                  <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Trạng thái hạ tầng</h4>
                    </div>
                    <div className="p-6 space-y-4">
                      {[
                        { label: "Tổng người dùng", value: users.length },
                        { label: "Tổng khu đỗ xe", value: zones.length },
                        { label: "Tổng cổng kiểm soát", value: gates.length },
                        { label: "Biểu phí đã cấu hình", value: tariffs.length },
                        { label: "Vé định kỳ đang hoạt động", value: passes.filter(p => p.status === "active").length },
                        { label: "Tổng sức chứa thiết kế", value: `${zones.reduce((s, z) => s + (z.capacity || 0), 0)} chỗ` },
                      ].map((item, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-xs text-slate-600 font-bold">{item.label}</span>
                          <span className="text-sm font-extrabold text-slate-900">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Thời gian hoạt động</h4>
                    </div>
                    <div className="p-6 space-y-3">
                      {parkingConfig.buildings.map(b => (
                        <div key={b.id} className="space-y-2 border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                          <p className="text-xs font-extrabold text-slate-800">{b.name}</p>
                          <p className="text-[10px] text-slate-600 font-semibold">{b.address}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                              {b.operatingHoursStart || "06:00"} — {b.operatingHoursEnd || "22:00"}
                            </span>
                          </div>
                        </div>
                      ))}
                      {parkingConfig.buildings.length === 0 && <p className="text-xs text-slate-500">Chưa cấu hình tòa nhà nào.</p>}
                    </div>
                  </div>

                  <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Chi tiết máy chủ & Module</p>
                    <p className="text-base font-black text-white mt-1">SmartParking Enterprise</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">Core Service: Java Spring Boot 3.3</p>
                    <p className="text-[10px] text-slate-400 font-medium">Database: PostgreSQL 16</p>
                    <p className="text-[10px] text-slate-400 font-medium">Frontend Engine: React 18 + Vite</p>
                    <p className="text-[10px] text-slate-400 font-medium">Tích hợp VNPay & WebSocket Terminal</p>
                  </div>
                </div>
              </div>
            </div>
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

      {/* 2. ZONE MODAL */}
      {isZoneModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-6 text-left border border-slate-200">
            <h3 className="font-extrabold text-slate-900 text-base">{isEditingZone ? "Sửa khu vực" : "Thêm khu vực"}</h3>
            <form onSubmit={handleSaveZone} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tên phân khu đỗ</label>
                <input type="text" required value={zoneForm.name} onChange={e => setZoneForm({ ...zoneForm, name: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Tầng áp dụng</label>
                <select value={zoneForm.floorId} onChange={e => setZoneForm({ ...zoneForm, floorId: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                  {parkingConfig.floors.map((floor) => (
                    <option key={floor.id} value={floor.id}>{floor.buildingName} · {floor.floorName}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Loại xe đỗ</label>
                  <select value={zoneForm.vehicleTypeId} onChange={e => setZoneForm({ ...zoneForm, vehicleTypeId: e.target.value, type: vehicleTypeNameById(e.target.value) })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                    {parkingConfig.vehicleTypes.map((vehicleType) => (
                      <option key={vehicleType.id} value={vehicleType.id}>{vehicleType.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Sức chứa tối đa</label>
                  <input type="number" required min="1" value={zoneForm.capacity} onChange={e => setZoneForm({ ...zoneForm, capacity: parseInt(e.target.value) || 0 })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
                </div>
              </div>
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
                <select value={passForm.buildingId} onChange={e => setPassForm({ ...passForm, buildingId: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                  {parkingConfig.buildings.map((building) => (
                    <option key={building.id} value={building.id}>{building.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Biển số đăng ký</label>
                  <input type="text" required value={passForm.plate} onChange={e => setPassForm({ ...passForm, plate: e.target.value.toUpperCase() })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Loại xe</label>
                  <select value={passForm.vehicleTypeId} onChange={e => setPassForm({ ...passForm, vehicleTypeId: e.target.value, type: vehicleTypeNameById(e.target.value) })} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white">
                    {parkingConfig.vehicleTypes.map((vehicleType) => (
                      <option key={vehicleType.id} value={vehicleType.id}>{vehicleType.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Gói vé định kỳ</label>
                  <select value={passForm.passType} onChange={e => {
                    const newType = e.target.value;
                    const newEnd = calculateEndDate(passForm.start, newType);
                    setPassForm({ ...passForm, passType: newType, end: newEnd });
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

function StatCard({ title, value, icon, accentColor, subtext }) {
  return (
    <div className="stat-card-item group relative rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm shadow-slate-100/50 hover:shadow-md hover:border-slate-300 transition-all duration-300 overflow-hidden text-left">
      {/* Top accent highlight */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${accentColor}`} />

      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold uppercase tracking-wide text-slate-400 group-hover:text-slate-500 transition-colors">
          {title}
        </span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>

      <div className="mt-4 flex flex-col">
        <span className="text-2xl font-black text-slate-900 group-hover:scale-[1.02] origin-left transition-transform duration-300">
          {value}
        </span>
        <span className="text-[10px] font-semibold text-slate-400 mt-1">
          {subtext}
        </span>
      </div>
    </div>
  );
}

function ChartBar({ day, val, height, active }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
      <div className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 px-1.5 py-0.5 rounded text-white mb-1 shadow-lg">
        {val}tr
      </div>
      <div
        className={`w-full rounded-t-lg transition-all duration-700 cursor-pointer ${active
          ? "bg-purple-500 shadow-lg shadow-purple-500/30"
          : "bg-slate-800 hover:bg-slate-700"
          }`}
        style={{ height }}
      />
      <span className={`text-[10px] font-extrabold mt-1 ${active ? "text-purple-400" : "text-slate-500"}`}>{day}</span>
    </div>
  );
}