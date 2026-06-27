// src/pages/driver/DriverDashboard.jsx
import DriverSosBanner from "./DriverSosBanner";
import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import driverAvatar from "../../assets/driver-avatar.png";
import { staffApi } from "../../api/parkingApi";
import gsap from "gsap";
import ProfileTab from "./ProfileTab";

import {
  isValidVietnamLicensePlate,
  normalizeLicensePlate as normalizePlateForApi,
  LICENSE_PLATE_HINT,
} from "../../utils/licensePlate";

// Hàm: normalizePlateInput
// Note: Chỉ dùng cho input UI Driver.
// API/DB vẫn dùng normalizePlateForApi() để ra format compact giống Staff.
const normalizePlateInput = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[–—]/g, "-");

const getPlateValue = (plate) => {
  if (typeof plate === "string") return plate;
  return plate?.licensePlate || plate?.plateNumber || plate?.plate || "";
};

const getPlateVehicleTypeId = (plate) => {
  if (typeof plate === "string") return null;
  return plate?.vehicleTypeId || plate?.vehicleType?.id || null;
};

const getPlateVehicleTypeName = (plate) => {
  if (typeof plate === "string") return "Chưa gán loại xe";
  return (
    plate?.vehicleTypeName || plate?.vehicleType?.name || "Chưa gán loại xe"
  );
};

const normalizeVehicleTypeText = (value) => {
  return String(value || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Đ/g, "D")
    .replace(/đ/g, "D")
    .trim();
};

const isBicycleVehicleTypeName = (value) => {
  const text = normalizeVehicleTypeText(value);
  return text.includes("XE DAP") || text.includes("BICYCLE") || text === "BIKE";
};

const formatPlateForDisplay = (value, vehicleTypeName) => {
  const clean = normalizePlateForApi(value);
  if (!clean) return "--";

  if (isBicycleVehicleTypeName(vehicleTypeName)) {
    return clean;
  }

  // Xe máy cũ 5 số: 59X112345 -> 59X1-123.45
  if (/^\d{2}[A-Z]\d\d{5}$/.test(clean)) {
    return clean.replace(/^(\d{2})([A-Z])(\d)(\d{3})(\d{2})$/, "$1$2$3-$4.$5");
  }

  // Xe máy cũ 4 số: 50H12345 -> 50H1-2345
  if (/^\d{2}[A-Z]\d\d{4}$/.test(clean)) {
    return clean.replace(/^(\d{2})([A-Z])(\d)(\d{4})$/, "$1$2$3-$4");
  }

  // Xe máy mới / ô tô 2 chữ 5 số: 50AB12345 -> 50AB-123.45
  if (/^\d{2}[A-Z]{2}\d{5}$/.test(clean)) {
    return clean.replace(/^(\d{2})([A-Z]{2})(\d{3})(\d{2})$/, "$1$2-$3.$4");
  }

  // 2 chữ 4 số: 50AB1234 -> 50AB-1234
  if (/^\d{2}[A-Z]{2}\d{4}$/.test(clean)) {
    return clean.replace(/^(\d{2})([A-Z]{2})(\d{4})$/, "$1$2-$3");
  }

  // Ô tô / xe tải 1 chữ 5 số: 30A99988 -> 30A-999.88
  if (/^\d{2}[A-Z]\d{5}$/.test(clean)) {
    return clean.replace(/^(\d{2})([A-Z])(\d{3})(\d{2})$/, "$1$2-$3.$4");
  }

  // Ô tô / xe tải 1 chữ 4 số: 30A1234 -> 30A-1234
  if (/^\d{2}[A-Z]\d{4}$/.test(clean)) {
    return clean.replace(/^(\d{2})([A-Z])(\d{4})$/, "$1$2-$3");
  }

  return clean;
};

const getVehicleIdentifierLabel = (vehicleTypeName) =>
  isBicycleVehicleTypeName(vehicleTypeName) ? "Mã xe đạp" : "Biển số";

const getVehicleIdentifierValue = (item) => {
  const vehicleTypeName =
    item?.vehicleTypeName || item?.vehicleType || item?.vehicle || "";

  if (isBicycleVehicleTypeName(vehicleTypeName)) {
    return item?.licensePlate || "--";
  }

  return formatPlateForDisplay(item?.licensePlate, vehicleTypeName);
};
// Custom SVG Icons for Premium UI
const IconDashboard = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
    />
  </svg>
);

const IconMap = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
    />
  </svg>
);

const IconSession = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const IconHistory = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
    />
  </svg>
);

const IconProfile = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

const IconLogout = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

const IconBell = () => (
  <svg
    className="w-6 h-6 text-slate-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

const IconSettings = () => (
  <svg
    className="w-6 h-6 text-slate-500 hover:rotate-45 transition-transform duration-300"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 01-6 0z"
    />
  </svg>
);

const LicensePlate = ({ plate, vehicleTypeName }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-200 bg-white font-mono font-bold text-slate-800 shadow-sm text-xs tracking-widest">
    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block mr-0.5 animate-pulse"></span>
    {formatPlateForDisplay(plate, vehicleTypeName)}
  </span>
);

const getReservationStatusLabel = (status) => {
  const normalizedStatus = String(status || "").toUpperCase();

  if (normalizedStatus === "PENDING") return "Pending";
  if (normalizedStatus === "CONFIRMED") return "Confirmed";
  if (normalizedStatus === "CANCELLED") return "Cancelled";
  if (normalizedStatus === "EXPIRED") return "Expired";
  if (normalizedStatus === "COMPLETED") return "Completed";

  return normalizedStatus || "--";
};

export default function DriverDashboard({ onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [liveTime, setLiveTime] = useState("");
  const [liveDate, setLiveDate] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(0); // Bắt đầu đếm từ 0 giây thực tế
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard', 'session', 'history', 'profile'

  const [emergencyStatus, setEmergencyStatus] = useState({
    loading: true,
    active: false,
    message: "Đang kiểm tra trạng thái hệ thống",
    reason: "",
    updatedAt: null,
  });

  // GSAP Animation container reference
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Sidebar slide-in
      gsap.fromTo(
        ".aside-panel",
        { x: -120, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.9, ease: "power4.out" },
      );

      // 2. Main content area fade-in
      gsap.fromTo(
        ".main-content-area",
        { opacity: 0 },
        { opacity: 1, duration: 0.6 },
      );

      // 3. Stagger animate the navigation links
      gsap.fromTo(
        ".nav-link-item",
        { x: -40, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: "power2.out",
          delay: 0.25,
        },
      );

      // 4. Welcome banner scale up with a beautiful bounce
      gsap.fromTo(
        ".welcome-banner",
        { scale: 0.96, opacity: 0, y: 15 },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "back.out(1.15)",
          delay: 0.3,
        },
      );

      // 5. Stats cards stagger bounce
      gsap.fromTo(
        ".stat-card-item",
        { y: 35, opacity: 0, scale: 0.98 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.65,
          stagger: 0.07,
          ease: "power3.out",
          delay: 0.45,
        },
      );

      // 6. Action panels slide up
      gsap.fromTo(
        ".action-panel-item",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.75,
          stagger: 0.1,
          ease: "power3.out",
          delay: 0.65,
        },
      );
    }, containerRef);

    return () => ctx.revert();
  }, [activeTab]);
  const [newPlateInput, setNewPlateInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [reservationSearchTerm, setReservationSearchTerm] = useState("");
  const [qrModalData, setQrModalData] = useState(null);
  // Tự động chuyển hướng tab
  const handleScrollTo = (tabId) => {
    if (tabId === "current-session") setActiveTab("session");
    else if (tabId === "my-reservations") setActiveTab("reservations");
    else if (tabId === "history-table") setActiveTab("history");
    else if (tabId === "profile-vip") setActiveTab("profile");
    else setActiveTab("dashboard");
  };

  // Đọc hash fragment từ URL để chuyển tab đng khi navigate từ trang khc
  useEffect(() => {
    const hash = location.hash?.replace("#", "");
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");

    if (hash) {
      handleScrollTo(hash);
      return;
    }

    // NOTE:
    // Hỗ trợ cả dạng /driver/dashboard?tab=profile nếu sau này có chỗ khác dùng.
    if (tab === "profile") setActiveTab("profile");
    else if (tab === "history") setActiveTab("history");
    else if (tab === "reservations") setActiveTab("reservations");
    else if (tab === "session") setActiveTab("session");
  }, [location.hash, location.search]);

  const loadEmergencyStatus = async () => {
    try {
      const res = await staffApi.getEmergencyStatus();
      const data = res.data?.data || res.data || {};

      const isActive = Boolean(data.active || data.isActive || data.sosActive);

      setEmergencyStatus({
        loading: false,
        active: isActive,
        message: isActive
          ? data.message ||
            data.reason ||
            "Hệ thống đang trong trạng thái khẩn cấp. Vui lòng theo dõi hướng dẫn sơ tán."
          : "Hệ thống đang vận hành ổn định",
        reason: data.reason || "",
        updatedAt: data.activatedAt || data.updatedAt || data.timestamp || null,
      });
    } catch (err) {
      console.warn("Không thể tải trạng thái SOS cho Driver:", err);

      setEmergencyStatus({
        loading: false,
        active: false,
        message: "Không thể đồng bộ trạng thái hệ thống",
        reason: "",
        updatedAt: null,
      });
    }
  };

  const loadUserData = async () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    let plates = [];
    let activeSession = null;
    let activeReservation = null;
    let reservations = [];
    let historyList = [];
    let totalAvailable = 0;

    try {
      const resPlates = await staffApi.getDriverPlates();
      plates = resPlates.data?.data || [];
    } catch (err) {
      console.error("Không thể tải biển số từ backend:", err);
      plates = [];
    }

    const reservationRes = await staffApi
      .getDriverReservations()
      .catch(() => null);

    reservations = (reservationRes?.data?.data || []).slice().sort((a, b) => {
      return (
        new Date(b.createdAt || b.createdTime || b.reservedFrom || 0) -
        new Date(a.createdAt || a.createdTime || a.reservedFrom || 0)
      );
    });

    activeReservation =
      reservations.find((item) =>
        ["CONFIRMED", "PENDING"].includes(
          String(item.status || "").toUpperCase(),
        ),
      ) || null;

    if (
      activeReservation?.licensePlate &&
      !plates.some(
        (plate) =>
          normalizePlateForApi(getPlateValue(plate)) ===
          normalizePlateForApi(activeReservation.licensePlate),
      )
    ) {
      plates = [
        ...plates,
        {
          licensePlate: activeReservation.licensePlate,
          vehicleTypeId: activeReservation.vehicleTypeId,
          vehicleTypeName: activeReservation.vehicleTypeName,
        },
      ];
    }

    if (plates.length > 0) {
      const sessionResults = await Promise.all(
        plates.map((plate) =>
          staffApi
            .getActiveSession(getPlateValue(plate))
            .then((res) => res.data?.data)
            .catch(() => null),
        ),
      );
      const backendSession = sessionResults.find(Boolean);

      if (backendSession) {
        activeSession = {
          zoneCode: backendSession.zoneCode || "--",
          floor: backendSession.floorName || "--",
          area: backendSession.zoneName || "--",
          vehicle: backendSession.vehicleType || "--",
          startTime: backendSession.entryTime
            ? new Date(backendSession.entryTime).toLocaleString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
                day: "2-digit",
                month: "2-digit",
              })
            : "--",
          estimatedFee: Number(backendSession.totalFee || 0),
          status:
            backendSession.status === "ACTIVE"
              ? "Đang gửi xe"
              : backendSession.status,
          buildingName: "Smart Parking",
          licensePlate: backendSession.licensePlate,
          sessionCode: backendSession.sessionCode,
          createdTimestamp: backendSession.entryTime
            ? new Date(backendSession.entryTime).getTime()
            : Date.now(),
        };
        setTimerSeconds(
          Math.max(
            0,
            Math.floor((Date.now() - activeSession.createdTimestamp) / 1000),
          ),
        );
      } else {
        setTimerSeconds(0);
      }

      const historyResults = await Promise.all(
        plates.map((plate) =>
          staffApi
            .getSessionHistory(getPlateValue(plate))
            .then((res) => res.data?.data || [])
            .catch(() => []),
        ),
      );

      historyList = historyResults.flat().map((s, idx) => ({
        id: `${s.sessionId || s.sessionCode || idx}`,
        date: s.entryTime
          ? new Date(s.entryTime).toLocaleString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "--",
        zoneCode: s.zoneCode || "--",
        zoneName: s.zoneName || "--",
        floorName: s.floorName || "--",
        vehicle: s.vehicleType || "--",
        cost: s.totalFee
          ? `${Number(s.totalFee).toLocaleString("vi-VN")}đ`
          : "0đ",
        durationMinutes: Number(s.durationMinutes || 0),
        status:
          s.status === "COMPLETED"
            ? "Đã thanh toán"
            : s.status === "ACTIVE"
              ? "Đang gửi"
              : s.status || "--",
        building: "Smart Parking",
      }));
    }

    try {
      const configRes = await staffApi.getParkingConfig();
      const zones = configRes.data?.data?.zones || [];
      totalAvailable = zones.reduce((sum, z) => {
        const available =
          (z.capacity || 0) - (z.currentCount || 0) - (z.reservedCount || 0);
        return sum + Math.max(0, available);
      }, 0);
    } catch (err) {
      console.error("Không thể tải cấu hình zone từ backend:", err);
      totalAvailable = 0;
    }

    const totalCost = historyList.reduce(
      (sum, h) => sum + Number(String(h.cost).replace(/[^\d]/g, "") || 0),
      0,
    );
    const totalMinutes = historyList.reduce(
      (sum, h) => sum + (h.durationMinutes || 0),
      0,
    );

    setData({
      user: {
        id: storedUser.id,
        name: storedUser.fullName || storedUser.email || "Tài xế",
        avatar: driverAvatar,
        membership: "Tài khoản tài xế",
        vipExpiry: "--",
        licensePlates: plates,
      },
      currentSession: activeSession,
      currentBooking: activeReservation
        ? {
            id: activeReservation.id || activeReservation.reservationId,
            bookingCode: activeReservation.reservationCode,
            licensePlate: activeReservation.licensePlate,
            vehicleTypeId: activeReservation.vehicleTypeId,
            vehicleType: activeReservation.vehicleTypeName,
            floor: activeReservation.floorName,
            zoneCode: activeReservation.zoneCode,
            zoneName: activeReservation.zoneName,
            status: String(activeReservation.status || "--").toUpperCase(),
            createdTime: activeReservation.createdAt
              ? new Date(activeReservation.createdAt).toLocaleTimeString(
                  "vi-VN",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )
              : "--",
            reservedFrom: activeReservation.reservedFrom,
            reservedTo: activeReservation.reservedTo,
          }
        : null,

      reservations: reservations.map((reservation, idx) => ({
        id:
          reservation.id ||
          reservation.reservationId ||
          reservation.reservationCode ||
          idx,
        reservationId: reservation.id || reservation.reservationId,
        reservationCode:
          reservation.reservationCode || reservation.code || "--",
        licensePlate: reservation.licensePlate || "--",
        zoneCode: reservation.zoneCode || "--",
        zoneName: reservation.zoneName || "--",
        floorName: reservation.floorName || "--",
        buildingName:
          reservation.buildingName ||
          reservation.building?.name ||
          "Smart Parking",
        vehicleTypeId: reservation.vehicleTypeId,
        vehicleTypeName:
          reservation.vehicleTypeName || reservation.vehicleType || "--",
        reservedFrom: reservation.reservedFrom,
        reservedTo: reservation.reservedTo,
        status: String(reservation.status || "--").toUpperCase(),
        createdAt: reservation.createdAt || reservation.createdTime,
      })),
      stats: {
        totalParking: historyList.length,
        totalHours:
          totalMinutes > 0 ? `${Math.round(totalMinutes / 60)} giờ` : "0 giờ",
        totalCost: `${totalCost.toLocaleString("vi-VN")}đ`,
        availableSlots: `${totalAvailable} chỗ trống`,
      },
      history: historyList,
    });
    setLoading(false);
  };

  // Hàm: handleAddPlate
  // Note: Driver đăng ký biển số phải gửi compact uppercase giống StaffCheckIn.
  // Ví dụ: "51H-123.45" hoặc "51h12345" -> "51H12345".
  const handleAddPlate = async (e, vehicleTypeId, vehicleTypeName) => {
    e.preventDefault();

    const inputPlate = normalizePlateInput(newPlateInput);
    const compactPlate = normalizePlateForApi(inputPlate);

    if (!compactPlate) {
      return false;
    }

    if (!vehicleTypeId) {
      alert("Vui lòng chọn loại xe trước khi thêm biển số.");
      return false;
    }

    if (!isValidVietnamLicensePlate(compactPlate, vehicleTypeName)) {
      alert(
        `Biển số không đúng định dạng cho ${vehicleTypeName || "loại xe đã chọn"}.\n\n` +
          "Ví dụ xe máy: 51H1-2345, 59X1-123.45, 59AA-729.32\n" +
          "Ví dụ ô tô: 30A-1234, 30A-123.45, 50AB-123.45\n" +
          "Ví dụ xe tải: 51C-123.45, 60C-456.78",
      );
      return false;
    }

    const existedPlate = data?.user?.licensePlates?.some((plate) => {
      const currentPlate = getPlateValue(plate);
      return normalizePlateForApi(currentPlate) === compactPlate;
    });

    if (existedPlate) {
      alert("Biển số này đã tồn tại trong hồ sơ của bạn.");
      return false;
    }

    try {
      await staffApi.addDriverPlate(compactPlate, vehicleTypeId);
      setNewPlateInput("");
      await loadUserData();
      alert(
        `Đăng ký biển số ${formatPlateForDisplay(compactPlate, vehicleTypeName)} thành công!`,
      );
      return true;
    } catch (err) {
      console.error("Failed to add driver plate", err);
      alert(err?.response?.data?.message || "Không thể thêm biển số xe.");
      return false;
    }
  };

  // Xóa biển số xe khỏi Database
  const handleDeletePlate = async (plateToDelete) => {
    const plateValue = getPlateValue(plateToDelete);

    if (!plateValue) {
      alert("Không tìm thấy biển số xe để xóa.");
      return;
    }

    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa biển số ${plateValue} khỏi tài khoản không?`,
      )
    ) {
      return;
    }

    try {
      await staffApi.deleteDriverPlate(plateValue);
      await loadUserData();
      alert(`Đã xóa biển số xe ${plateValue} thành công khỏi Database!`);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Lỗi xóa biển số xe";
      alert(`Xóa thất bại: ${errorMsg}`);
    }
  };

  const handleVnPayCheckout = async () => {
    if (!currentSession) return;
    if (
      !confirm("Bạn muốn chuyển sang VNPay sandbox để thanh toán phí ra bãi?")
    )
      return;

    try {
      const res = await staffApi.initiateVnPayCheckout({
        sessionCode: currentSession.sessionCode,
        licensePlate: currentSession.licensePlate,
      });
      const paymentUrl = res.data?.data?.paymentUrl;
      if (!paymentUrl) {
        throw new Error("Backend chưa trả về link thanh toán VNPay");
      }
      window.location.href = paymentUrl;
    } catch (err) {
      alert(
        "❌ Không thể tạo thanh toán VNPay: " +
          (err.response?.data?.message || err.message),
      );
    }
  };

  const handleCancelReservation = async (reservation) => {
    const reservationId = reservation?.reservationId || reservation?.id;

    if (!reservationId) {
      alert("Không tìm thấy ID đặt chỗ để hủy.");
      return;
    }

    const code = reservation.reservationCode || reservationId;

    if (!confirm(`Bạn có chắc muốn hủy đặt chỗ ${code} không?`)) {
      return;
    }

    try {
      await staffApi.cancelReservation(reservationId);
      alert("Đã hủy đặt chỗ thành công!");
      await loadUserData();
    } catch (err) {
      alert(
        "Hủy đặt chỗ thất bại: " + (err.response?.data?.message || err.message),
      );
    }
  };

  useEffect(() => {
    // Style laser scan line hiệu ứng cho QR ticket
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `
      @keyframes scan {
        0% { top: 0%; }
        50% { top: 100%; }
        100% { top: 0%; }
      }
      .scanline {
        position: absolute;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, transparent, #4f46e5, transparent);
        box-shadow: 0 0 10px 1px rgba(79, 70, 229, 0.6);
        animation: scan 3.5s linear infinite;
      }
    `;
    document.head.appendChild(styleEl);

    // Đồng hồ thời gian thực
    const clockInterval = setInterval(() => {
      const now = new Date();
      setLiveTime(
        now.toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    }, 1000);

    const today = new Date();
    setLiveDate(
      today.toLocaleDateString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    );

    // Đếm giây đỗ xe thực tế
    const timerInterval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);

    // Nạp dữ liệu khởi tạo
    loadUserData();
    loadEmergencyStatus();

    const emergencyInterval = setInterval(() => {
      loadEmergencyStatus();
    }, 15000);

    const handleStorageChange = (e) => {
      if (e.key === "user") {
        loadUserData();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    const syncInterval = setInterval(() => {
      loadUserData();
    }, 10000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(timerInterval);
      clearInterval(syncInterval);
      clearInterval(emergencyInterval);
      window.removeEventListener("storage", handleStorageChange);
      document.head.removeChild(styleEl);
    };
  }, []);

  // Tự động chuyển tab khi nhận tham số scrollTo từ trang khác
  useEffect(() => {
    if (!loading && data) {
      const params = new URLSearchParams(location.search);
      const scrollToId = params.get("scrollTo");
      if (scrollToId) {
        if (scrollToId === "current-session") setActiveTab("session");
        else if (scrollToId === "my-reservations") setActiveTab("reservations");
        else if (scrollToId === "history-table") setActiveTab("history");
        else if (scrollToId === "profile-vip") setActiveTab("profile");
      }
    }
  }, [location.search, loading, data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-t-indigo-600 border-slate-200 animate-spin" />
          <p className="text-sm font-semibold tracking-wider text-slate-500">
            Đang tải bảng điều khiển tài xế...
          </p>
        </div>
      </div>
    );
  }

  const {
    user,
    currentSession,
    currentBooking,
    stats,
    history,
    reservations = [],
  } = data;

  const qrPayload = currentSession
    ? JSON.stringify({
        type: "SESSION",
        sessionCode: currentSession.sessionCode,
        licensePlate: currentSession.licensePlate,
        vehicleType: currentSession.vehicle,
        zoneCode: currentSession.zoneCode,
        floor: currentSession.floor,
      })
    : "";

  // Format Timer Seconds
  const formatTimer = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Chi phí thực tế tạm tính lấy trực tiếp từ hệ thống tính phí Backend
  const realTimeFee = currentSession ? currentSession.estimatedFee : 0;
  const formatDateTime = (value) => {
    if (!value) return "--";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";

    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getReservationStatusStyle = (status) => {
    const normalizedStatus = String(status || "").toUpperCase();

    if (["PENDING", "CONFIRMED"].includes(normalizedStatus)) {
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    }

    if (normalizedStatus === "CANCELLED") {
      return "bg-rose-50 text-rose-700 border-rose-100";
    }

    if (normalizedStatus === "EXPIRED") {
      return "bg-amber-50 text-amber-700 border-amber-100";
    }

    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  const isReservationCancelable = (status) => {
    return ["PENDING", "CONFIRMED"].includes(
      String(status || "").toUpperCase(),
    );
  };

  const filteredReservations = reservations.filter((item) => {
    const keyword = reservationSearchTerm.trim().toLowerCase();

    if (!keyword) return true;

    return [
      item.reservationCode,
      item.licensePlate,
      item.zoneCode,
      item.zoneName,
      item.floorName,
      item.status,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword));
  });

  return (
    <div
      ref={containerRef}
      className="driver-mobile-shell min-h-screen overflow-x-hidden bg-[#f8fafc] text-slate-900 flex font-sans"
    >
      {/* Sidebar - Đồng bộ 100% với DriverMapping.jsx */}
      <DriverSosBanner />
      <aside
        className={`aside-panel fixed left-0 top-0 bottom-0 z-50 hidden h-screen flex-col bg-slate-900 text-white shadow-xl transition-all duration-300 md:flex ${
          collapsed ? "w-20" : "w-72"
        }`}
      >
        <div className="flex items-center gap-3.5 px-6 py-6 border-b border-slate-800 overflow-hidden">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20 font-black text-lg flex-shrink-0"
          >
            D
          </button>
          {!collapsed && (
            <div>
              <h1 className="text-md font-extrabold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent whitespace-nowrap">
                Smart Parking
              </h1>
              <p className="text-xs text-blue-400 font-semibold tracking-wider uppercase whitespace-nowrap">
                Cổng tài xế
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-x-hidden">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`nav-link-item w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${
              activeTab === "dashboard"
                ? "bg-slate-800 text-blue-400 border border-slate-700 shadow-inner"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span className="flex-shrink-0">
              <IconDashboard />
            </span>
            {!collapsed && (
              <span className="whitespace-nowrap">Bảng điều khiển</span>
            )}
          </button>

          <SideLink
            collapsed={collapsed}
            to="/driver/map"
            icon={<IconMap />}
            label="Sơ đồ bãi xe"
          />
          <SideLink
            collapsed={collapsed}
            to="/driver/3d-map"
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 16V8a2 2 0 00-1-1.732l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.732l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.3 7L12 12l8.7-5M12 22V12"
                />
              </svg>
            }
            label="Mô phỏng 3D"
          />

          <button
            onClick={() => setActiveTab("session")}
            className={`nav-link-item w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${
              activeTab === "session"
                ? "bg-slate-800 text-blue-400 border border-slate-700 shadow-inner"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span className="flex-shrink-0">
              <IconSession />
            </span>
            {!collapsed && (
              <span className="whitespace-nowrap">Phiên gửi xe</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("reservations")}
            className={`nav-link-item w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${
              activeTab === "reservations"
                ? "bg-slate-800 text-blue-400 border border-slate-700 shadow-inner"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span className="flex-shrink-0">
              <IconSession />
            </span>
            {!collapsed && (
              <span className="whitespace-nowrap">Đặt chỗ của tôi</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`nav-link-item w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${
              activeTab === "history"
                ? "bg-slate-800 text-blue-400 border border-slate-700 shadow-inner"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span className="flex-shrink-0">
              <IconHistory />
            </span>
            {!collapsed && (
              <span className="whitespace-nowrap">Lịch sử đỗ xe</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`nav-link-item w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${
              activeTab === "profile"
                ? "bg-slate-800 text-blue-400 border border-slate-700 shadow-inner"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span className="flex-shrink-0">
              <IconProfile />
            </span>
            {!collapsed && (
              <span className="whitespace-nowrap">Hồ sơ & hội viên</span>
            )}
          </button>
        </nav>

        {!collapsed && (
          <div
            className={`mx-4 mb-4 rounded-2xl border p-4 shadow-lg ${
              emergencyStatus.active
                ? "border-rose-500/60 bg-rose-950/70 shadow-rose-950/30"
                : "border-slate-800 bg-slate-950/70"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  emergencyStatus.loading
                    ? "bg-slate-500"
                    : emergencyStatus.active
                      ? "bg-rose-400 animate-pulse"
                      : "bg-emerald-400"
                }`}
              />

              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                Trạng thái hệ thống
              </p>
            </div>

            <p
              className={`mt-2 text-xs font-black ${
                emergencyStatus.active ? "text-rose-200" : "text-emerald-300"
              }`}
            >
              {emergencyStatus.loading
                ? "Đang kiểm tra..."
                : emergencyStatus.active
                  ? "🚨 SOS / Khẩn cấp"
                  : "Bình thường"}
            </p>

            <p
              className={`mt-1 line-clamp-3 text-[10px] font-semibold leading-4 ${
                emergencyStatus.active ? "text-rose-100" : "text-slate-500"
              }`}
            >
              {emergencyStatus.active
                ? "Đang có cảnh báo khẩn cấp. Hệ thống tạm khóa tạo đặt chỗ mới cho tài xế."
                : emergencyStatus.message}
            </p>

            {emergencyStatus.active && (
              <div className="mt-3 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-200">
                  Hướng dẫn tài xế
                </p>
                <p className="mt-1 text-[10px] font-semibold leading-4 text-rose-100">
                  Không tạo đặt chỗ mới trong lúc SOS đang bật. Vui lòng theo
                  dõi hướng dẫn của Staff/Security và di chuyển theo lối an
                  toàn.{" "}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-slate-800 p-4 overflow-hidden">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-all duration-200"
          >
            <IconLogout />
            {!collapsed && <span className="whitespace-nowrap">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`main-content-area flex-1 min-h-screen flex flex-col pb-24 transition-all duration-300 md:pb-0 ${
          collapsed ? "md:ml-20" : "md:ml-72"
        }`}
      >
        {/* Header - Đồng bộ 100% với DriverMapping.jsx */}
        <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md sm:px-6 md:h-20 md:px-8 md:py-0">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              Bảng điều khiển tài xế
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{liveDate}</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end border-r border-slate-200 pr-6">
              <span className="font-mono text-lg font-bold text-indigo-600 bg-indigo-50/50 px-3 py-1 rounded-lg border border-indigo-100">
                {liveTime}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                title={
                  emergencyStatus.active
                    ? "Hệ thống đang khẩn cấp"
                    : "Hệ thống bình thường"
                }
                className={`relative rounded-full p-2.5 transition-colors ${
                  emergencyStatus.active
                    ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                    : "hover:bg-slate-100/80"
                }`}
              >
                <IconBell />
                <span
                  className={`absolute right-2 top-2 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                    emergencyStatus.loading
                      ? "bg-slate-400"
                      : emergencyStatus.active
                        ? "bg-rose-500 animate-pulse"
                        : "bg-emerald-500"
                  }`}
                />
              </button>
              <button className="rounded-full p-2.5 hover:bg-slate-100/80 transition-colors">
                <IconSettings />
              </button>
            </div>

            <div className="hidden items-center gap-3.5 border-l border-slate-200 pl-6 sm:flex">
              <div className="text-right">
                <p className="font-semibold text-sm text-slate-900">
                  {user.name}
                </p>
                <p className="text-xs text-slate-400 font-medium">
                  Thành viên VIP
                </p>
              </div>
              <img
                src={user.avatar}
                alt="avatar"
                className="h-11 w-11 rounded-xl object-cover ring-2 ring-indigo-500/20"
              />
            </div>
          </div>
        </header>

        {/* Dashboard Panels */}
        <section
          className="driver-content-section flex-1 space-y-5 p-4 pb-28 sm:p-6 md:space-y-6 md:p-8 md:pb-8"
          style={{
            minHeight: "calc(100vh - 120px)",
            transition: "all 0.2s ease-in-out",
          }}
        >
          {activeTab === "dashboard" && (
            <>
              {/* Welcome Banner */}
              <div className="welcome-banner relative overflow-hidden rounded-[1.5rem] bg-slate-900 p-5 text-white shadow-lg border border-slate-800 flex flex-col justify-between gap-5 sm:p-6 md:flex-row md:items-center md:gap-6 md:rounded-3xl md:p-8">
                <div className="absolute right-0 top-0 -mr-20 -mt-20 h-60 w-60 rounded-full bg-indigo-600/30 blur-3xl" />
                <div className="relative z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4 border border-indigo-500/30">
                    💡 Driver Hub v2
                  </span>
                  <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                    Xin chào, {user.name} 👋
                  </h1>
                  <p className="mt-2.5 text-slate-350 text-sm leading-relaxed max-w-2xl">
                    Cập nhật thông tin phiên đỗ xe thực tế, quét mã QR vào bãi
                    và quản lý lịch sử thông tin hội viên VIP.
                  </p>
                </div>
                {user.licensePlates.length === 0 && (
                  <div className="relative z-10 flex-shrink-0 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-xs max-w-xs">
                    <p className="font-bold text-yellow-400">
                      💡 Chưa có biển số xe
                    </p>
                    <p className="mt-1 text-slate-300">
                      Vui lòng đăng ký biển số xe tại mục "Hồ sơ & Hội viên" để
                      bắt đầu sử dụng dịch vụ.
                    </p>
                    <button
                      onClick={() => setActiveTab("profile")}
                      className="mt-3 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black py-2 rounded-xl transition-all shadow-md shadow-indigo-500/20"
                    >
                      📋 Đăng ký biển số xe
                    </button>
                  </div>
                )}
              </div>

              {/* Stats Badges Grid */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatItem
                  title="Tổng lượt đỗ"
                  value={stats.totalParking}
                  icon="🟢"
                  desc="Cập nhật tự động"
                />
                <StatItem
                  title="Tổng số giờ đỗ"
                  value={stats.totalHours}
                  icon="🕒"
                  desc="Tích lũy từ đầu năm"
                />
                <StatItem
                  title="Tổng chi tiêu"
                  value={stats.totalCost}
                  icon="💰"
                  desc="Đã thanh toán online"
                />
                <StatItem
                  title="Sức chứa trống"
                  value={stats.availableSlots}
                  icon="CAP"
                  desc="Đề xuất zone tối ưu"
                />
              </div>

              {/* Main Interactive Row */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                {/* Left Content Column */}
                <div className="xl:col-span-8 space-y-8">
                  {/* Current Parking Session Summary */}
                  {currentSession ? (
                    <div className="action-panel-item rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </span>
                          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                            Phiên Đỗ Xe Đang Hoạt Động
                          </h3>
                        </div>
                        <button
                          onClick={() => setActiveTab("session")}
                          className="text-xs font-bold text-indigo-600 hover:underline"
                        >
                          Chi tiết phiên đỗ →
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 text-xs font-semibold sm:grid-cols-3 sm:gap-4">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Vị trí đỗ
                          </p>
                          <p className="text-sm font-black text-slate-955 mt-1">
                            {currentSession.floor} - {currentSession.zoneCode}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Chi phí tạm tính
                          </p>
                          <p className="text-sm font-bold text-emerald-650 mt-1">
                            {realTimeFee.toLocaleString("vi-VN")}đ
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Đã đỗ
                          </p>
                          <p className="text-sm font-bold text-slate-700 mt-1 font-mono">
                            {formatTimer(timerSeconds)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-center flex flex-col items-center justify-center py-8">
                      <div className="h-12 w-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-400 tracking-widest mb-3 shadow-inner">
                        CAR
                      </div>
                      <h3 className="text-xs font-bold text-slate-900">
                        Không có xe đang gửi
                      </h3>
                      <button
                        onClick={() => navigate("/driver/map")}
                        className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] px-4 py-2.5 shadow-md shadow-indigo-600/20 transition-all"
                      >
                        Đặt chỗ trước bãi xe →
                      </button>
                    </div>
                  )}

                  {/* Quick Parking History (Last 2 items) */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                      <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                        Lịch Sử Gửi Gần Đây
                      </h3>
                      <button
                        onClick={() => setActiveTab("history")}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        Xem tất cả lịch sử →
                      </button>
                    </div>

                    <div className="space-y-4">
                      {history.length === 0 ? (
                        <p className="text-xs text-slate-400 font-bold italic text-center py-4">
                          Chưa có lịch sử gửi xe nào.
                        </p>
                      ) : (
                        history.slice(0, 2).map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center bg-slate-50 border border-slate-150 p-4 rounded-2xl"
                          >
                            <div>
                              <p className="font-bold text-xs text-slate-900">
                                {item.building} •{" "}
                                <span className="text-indigo-600 font-mono font-black">
                                  {item.floorName}-{item.zoneCode}
                                </span>
                              </p>
                              <p className="text-[10px] text-slate-450 mt-1 font-semibold">
                                {item.date}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-extrabold text-xs text-slate-900">
                                {item.cost}
                              </p>
                              <span className="inline-block text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full mt-1.5 uppercase tracking-wide">
                                {item.status}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="xl:col-span-4 space-y-6">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-6 -mr-6 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl" />

                    {currentBooking ? (
                      <>
                        <span className="text-[9px] font-black text-indigo-700 tracking-widest uppercase bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 inline-block mb-4">
                          Vé giữ chỗ hiện tại
                        </span>

                        <ReservationTicketPreview
                          booking={currentBooking}
                          userName={user.name}
                        />

                        <button
                          onClick={() => setActiveTab("reservations")}
                          className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs transition-all"
                        >
                          Xem danh sách đặt chỗ →
                        </button>
                      </>
                    ) : currentSession ? (
                      <>
                        <span className="text-[9px] font-black text-indigo-700 tracking-widest uppercase bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 inline-block mb-4">
                          Phiên gửi xe hiện tại
                        </span>

                        <h4 className="text-sm font-extrabold text-slate-900">
                          Thông tin phiên gửi xe
                        </h4>

                        <p className="mt-1 text-[10px] font-semibold font-mono text-slate-400">
                          {currentSession.sessionCode || "--"}
                        </p>

                        <div className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-xs font-semibold">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-450 font-bold">
                              Chủ xe:
                            </span>
                            <span className="text-slate-800">{user.name}</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-450 font-bold">
                              Biển số:
                            </span>
                            <LicensePlate
                              plate={currentSession.licensePlate}
                              vehicleTypeName={currentSession.vehicle}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-450 font-bold">
                              Zone:
                            </span>
                            <span className="font-bold text-indigo-600 font-mono">
                              {currentSession.floor} - {currentSession.zoneCode}
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-450 font-bold">
                              Trạng thái:
                            </span>
                            <span className="text-emerald-600 font-extrabold">
                              {currentSession.status}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setActiveTab("session")}
                          className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs transition-all"
                        >
                          Xem chi tiết phiên →
                        </button>
                      </>
                    ) : (
                      <div className="py-8 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-[10px] font-black tracking-widest text-slate-400 shadow-inner">
                          TICKET
                        </div>

                        <h4 className="text-xs font-bold text-slate-950">
                          Chưa có phiên hoặc giữ chỗ
                        </h4>

                        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                          Khi có đặt chỗ hoặc phiên gửi xe thật từ backend,
                          thông tin vé sẽ hiển thị tại đây.
                        </p>

                        <button
                          onClick={() => navigate("/driver/map")}
                          className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs transition-all"
                        >
                          Tạo đặt chỗ →
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Member Card Summary */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <span className="text-[9px] font-black text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-100 tracking-wider uppercase inline-block mb-3.5">
                      🌟 VIP Member
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">
                      Quyền lợi VIP hoạt động
                    </h4>
                    <p className="text-[10px] text-slate-450 mt-1 font-semibold leading-relaxed">
                      Giảm giá 15% tất cả các lượt gửi xe và giữ chỗ trước bãi
                      đỗ hoàn toàn miễn phí.
                    </p>
                    <button
                      onClick={() => setActiveTab("profile")}
                      className="mt-4 w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2 rounded-xl text-xs transition-all"
                    >
                      Quản lý xe & hồ sơ →
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "session" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-950 tracking-tight">
                    Phiên gửi xe & Vé QR
                  </h3>
                  <p className="text-xs text-slate-455 mt-1">
                    Quản lý và sử dụng mã QR để tự động ra vào bãi đỗ xe qua
                    trạm barrier AI.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all animate-pulse"
                >
                  ← Bảng điều khiển chính
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Phiên gửi xe hiện tại */}
                <div className="action-panel-item lg:col-span-7">
                  {currentSession ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </span>
                          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                            Trạng thái gửi thực tế
                          </h3>
                        </div>
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
                          {currentSession.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-6 text-xs font-semibold">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Vị trí đỗ của bạn
                          </p>
                          <p className="text-lg font-black text-slate-905 mt-1">
                            {currentSession.floor} - {currentSession.zoneCode}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Tòa nhà
                          </p>
                          <p className="text-sm font-bold text-slate-800 mt-2">
                            {currentSession.buildingName}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Phương tiện
                          </p>
                          <p className="text-sm font-bold text-slate-800 mt-2">
                            {currentSession.vehicle}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Thời điểm vào
                          </p>
                          <p className="text-sm font-semibold text-slate-650 mt-2">
                            {currentSession.startTime}
                          </p>
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-150">
                        <div className="flex items-center gap-4">
                          <div className="p-3.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 text-lg">
                            ⏱️
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">
                              Thời gian gửi xe
                            </span>
                            <span className="font-mono text-2xl font-black text-slate-900 tracking-widest">
                              {formatTimer(timerSeconds)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 md:border-l md:border-slate-200 md:pl-6">
                          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-650 border border-emerald-100 text-lg">
                            💰
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">
                              Chi phí tạm tính
                            </span>
                            <span className="font-mono text-2xl font-black text-emerald-700">
                              {realTimeFee.toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* === THANH TOÁN CHUYỂN KHOẢN REALTIME === */}
                      <div className="mt-6 pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-lg">💳</span>
                          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                            Thanh toán khi ra bãi
                          </h4>
                        </div>

                        {!data?.paymentConfirmed ? (
                          <div className="space-y-4">
                            {/* VietQR hiển thị */}
                            <div className="flex flex-col items-center bg-indigo-50/50 rounded-2xl border border-indigo-100 p-5">
                              <img
                                src={`https://api.vietqr.io/image/970422-0974114657-compact.png?amount=${Math.round(realTimeFee)}&addInfo=${encodeURIComponent(currentSession?.licensePlate || "SMART PARKING")}&accountName=TRAN%20NGUYEN%20MINH%20AN`}
                                alt="VietQR Payment"
                                className="w-36 h-36 object-contain rounded-lg shadow-sm"
                                onError={(e) => {
                                  e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`STK: 0974114657 | MB BANK | TRAN NGUYEN MINH AN | So tien: ${Math.round(realTimeFee)}`)}`;
                                }}
                              />
                              <div className="text-center mt-3 space-y-1">
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                                  Quét QR để chuyển khoản
                                </p>
                                <p className="text-xs font-bold text-slate-700">
                                  MB Bank -{" "}
                                  <span className="font-mono">0974114657</span>
                                </p>
                                <p className="text-xs font-semibold text-slate-500">
                                  TRAN NGUYEN MINH AN
                                </p>
                                <p className="text-sm font-black text-indigo-600 mt-1">
                                  {Math.round(realTimeFee).toLocaleString(
                                    "vi-VN",
                                  )}
                                  đ
                                </p>
                              </div>
                            </div>

                            {/* Nút thanh toán VNPay sandbox thật */}
                            <button
                              onClick={handleVnPayCheckout}
                              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 text-white font-extrabold text-sm py-4 shadow-lg shadow-indigo-600/20 transition-all duration-200 active:scale-[0.97] cursor-pointer"
                            >
                              <span className="text-lg">💳</span>
                              Thanh toán VNPay Sandbox
                            </button>

                            {/* Nút xác nhận đã chuyển khoản */}
                            <button
                              onClick={async () => {
                                if (
                                  !confirm(
                                    "Bạn đã chuyển khoản thành công? Hệ thống sẽ xác nhận và tự động check-out xe cho bạn.",
                                  )
                                )
                                  return;
                                try {
                                  await staffApi.confirmPayment({
                                    sessionCode: currentSession?.sessionCode,
                                    licensePlate: currentSession?.licensePlate,
                                  });
                                  // Cập nhật UI
                                  setData((prev) => ({
                                    ...prev,
                                    paymentConfirmed: true,
                                  }));
                                  alert(
                                    "✅ Thanh toán đã được xác nhận! Nhân viên bãi xe đã nhận thông báo. Xe của bạn sẽ được mở barrier tự động.",
                                  );
                                  // Reload dữ liệu
                                  setTimeout(() => loadUserData(), 2000);
                                } catch (err) {
                                  alert(
                                    "❌ Lỗi xác nhận thanh toán: " +
                                      (err.response?.data?.message ||
                                        err.message),
                                  );
                                }
                              }}
                              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm py-4 shadow-lg shadow-emerald-600/20 transition-all duration-200 active:scale-[0.97] cursor-pointer"
                            >
                              <span className="text-lg">✅</span>
                              Tôi đã chuyển khoản xong
                            </button>

                            <p className="text-[10px] text-slate-400 text-center font-medium leading-relaxed">
                              Sau khi bạn bấm xác nhận, nhân viên bãi xe sẽ tự
                              động nhận thông báo <strong>real-time</strong> và
                              mở barrier cho xe ra.
                            </p>
                          </div>
                        ) : (
                          <div className="text-center py-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-[10px] font-black tracking-widest text-emerald-600">
                              OK
                            </div>
                            <h4 className="font-extrabold text-emerald-800 text-sm">
                              Thanh toán thành công!
                            </h4>
                            <p className="text-xs text-emerald-600 mt-1">
                              Barrier sẽ tự động mở khi bạn đến cổng ra.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center py-16 flex flex-col items-center justify-center">
                      <div className="h-16 w-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-[10px] font-black text-slate-400 tracking-widest mb-4 shadow-inner">
                        CAR
                      </div>
                      <h3 className="text-md font-bold text-slate-900">
                        Không có phiên gửi xe
                      </h3>
                      <p className="text-xs text-slate-400 font-medium max-w-sm mt-1.5 leading-relaxed">
                        Bạn chưa có xe nào đỗ trong hệ thống bãi đỗ. Hãy quét QR
                        ở trạm kiểm soát hoặc đăng ký trước.
                      </p>
                      <button
                        onClick={() => navigate("/driver/map")}
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-3 shadow-md shadow-indigo-600/20 transition-all duration-200"
                      >
                        Đến sơ đồ bãi xe ngay
                      </button>
                    </div>
                  )}
                </div>

                <div className="action-panel-item lg:col-span-5">
                  {currentBooking ? (
                    <ReservationTicketPreview
                      booking={currentBooking}
                      userName={user.name}
                    />
                  ) : currentSession ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-20 h-20 bg-indigo-500/10 rounded-full blur-xl" />

                      <span className="text-[9px] font-black text-indigo-700 tracking-widest uppercase bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 inline-block mb-4">
                        Session Ticket
                      </span>

                      <h4 className="text-md font-extrabold text-slate-900">
                        Thông tin phiên gửi xe
                      </h4>
                      <p className="text-xs text-slate-400 font-semibold font-mono mt-1">
                        {currentSession.sessionCode || "--"}
                      </p>

                      <div className="mt-6 space-y-3.5 border-t border-slate-100 pt-4 text-left text-xs font-semibold">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-450 font-bold">
                            Chủ xe:
                          </span>
                          <span className="text-slate-800">{user.name}</span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-450 font-bold">
                            Biển số:
                          </span>
                          <LicensePlate
                            plate={currentSession.licensePlate}
                            vehicleTypeName={currentSession.vehicle}
                          />
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-450 font-bold">
                            Zone:
                          </span>
                          <span className="font-bold text-indigo-600 font-mono">
                            {currentSession.floor} - {currentSession.zoneCode}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-slate-450 font-bold">
                            Trạng thái:
                          </span>
                          <span className="text-emerald-600 font-extrabold">
                            {currentSession.status}
                          </span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-4 border-t border-slate-100 pt-3">
                        Thông tin phiên gửi xe dùng để nhân viên kiểm tra tại
                        cổng.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-[10px] font-black tracking-widest text-slate-400 shadow-inner">
                        TICKET
                      </div>
                      <h4 className="text-sm font-bold text-slate-950">
                        Chưa có vé giữ chỗ
                      </h4>
                      <p className="mt-1 text-xs font-medium leading-relaxed text-slate-400">
                        Khi bạn đặt chỗ thành công, vé giữ chỗ sẽ hiển thị tại
                        đây.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "reservations" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-950 tracking-tight">
                    Đặt chỗ của tôi
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Xem thông tin đặt chỗ, mã QR và hủy các đặt chỗ còn hiệu
                    lực.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate("/driver/map")}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700"
                  >
                    Tạo đặt chỗ mới
                  </button>

                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    ← Bảng điều khiển chính
                  </button>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="mt-1 text-lg font-black text-slate-950">
                      Danh sách đặt chỗ
                    </h4>
                  </div>

                  <input
                    value={reservationSearchTerm}
                    onChange={(e) => setReservationSearchTerm(e.target.value)}
                    placeholder="Tìm theo mã đặt chỗ, biển số, khu vực hoặc trạng thái..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 md:max-w-sm"
                  />
                </div>

                {filteredReservations.length === 0 ? (
                  <div className="py-14 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-[10px] font-black tracking-widest text-slate-400">
                      RES
                    </div>
                    <h4 className="text-sm font-black text-slate-900">
                      Chưa có đặt chỗ phù hợp
                    </h4>
                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      Bạn có thể tạo đặt chỗ mới từ Sơ đồ bãi xe.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {filteredReservations.map((reservation) => {
                      const canCancel = isReservationCancelable(
                        reservation.status,
                      );

                      return (
                        <div
                          key={reservation.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 text-xs shadow-sm transition hover:border-indigo-100 hover:bg-white"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Mã đặt chỗ
                              </p>
                              <p className="mt-1 font-mono text-lg font-black text-slate-950">
                                {reservation.reservationCode}
                              </p>
                              <p className="mt-1 font-semibold text-slate-500">
                                {reservation.buildingName} ·{" "}
                                {reservation.floorName}-{reservation.zoneCode}
                              </p>
                            </div>

                            <span
                              className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest ${getReservationStatusStyle(reservation.status)}`}
                            >
                              {reservation.status}
                            </span>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
                            <InfoRow
                              label={getVehicleIdentifierLabel(
                                reservation.vehicleTypeName,
                              )}
                              value={getVehicleIdentifierValue(reservation)}
                              mono
                            />
                            <InfoRow
                              label="Loại phương tiện"
                              value={reservation.vehicleTypeName}
                            />
                            <InfoRow
                              label="Thời gian bắt đầu"
                              value={formatDateTime(reservation.reservedFrom)}
                            />
                            <InfoRow
                              label="Thời gian kết thúc"
                              value={formatDateTime(reservation.reservedTo)}
                            />
                            <InfoRow
                              label="Thời gian tạo"
                              value={formatDateTime(reservation.createdAt)}
                            />
                            <InfoRow
                              label="Khu vực"
                              value={`${reservation.floorName}-${reservation.zoneCode}`}
                              mono
                            />
                          </div>

                          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <button
                              type="button"
                              onClick={() =>
                                setQrModalData({
                                  type: "RESERVATION",
                                  reservation,
                                })
                              }
                              className="rounded-xl bg-slate-900 px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-white transition hover:bg-slate-800"
                            >
                              Xem vé đặt chỗ
                            </button>

                            {canCancel ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleCancelReservation(reservation)
                                }
                                className="rounded-xl border border-rose-200 bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-rose-600 transition hover:bg-rose-50"
                              >
                                Hủy đặt chỗ
                              </button>
                            ) : (
                              <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                                Không thể hủy
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-950 tracking-tight">
                    Lịch sử gửi xe của bạn
                  </h3>
                  <p className="text-xs text-slate-455 mt-1">
                    Truy lục, kiểm soát toàn bộ lịch sử chi tiêu và thời gian
                    gửi xe tại hệ thống bãi đỗ.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all whitespace-nowrap"
                  >
                    ← Bảng điều khiển chính
                  </button>
                </div>
              </div>

              {/* Lịch Sử Gửi Xe Expanded */}
              <div className="action-panel-item rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="🔍 Tìm kiếm theo cơ sở hoặc vị trí đỗ (Ví dụ: FPT Landmark)..."
                    className="w-full md:max-w-md rounded-xl border border-slate-200 px-4 py-2.5 outline-none text-xs font-semibold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all bg-slate-50 text-slate-800"
                  />
                  <div className="text-[10px] font-black text-slate-500 bg-slate-100 px-3.5 py-2 rounded-xl">
                    TỔNG LƯỢT ĐỖ: {history.length} LƯỢT
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-150 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3 pl-2">Thời Gian Vào</th>
                        <th className="pb-3">Cơ Sở</th>
                        <th className="pb-3">Vị Trí Đỗ</th>
                        <th className="pb-3">Phương Tiện</th>
                        <th className="pb-3">Chi Phí</th>
                        <th className="pb-3 text-right pr-2">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {history.filter(
                        (item) =>
                          item.building
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()) ||
                          `${item.floorName} ${item.zoneCode} ${item.zoneName}`
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()),
                      ).length === 0 ? (
                        <tr>
                          <td
                            colSpan="6"
                            className="py-8 text-center text-slate-400 font-bold italic"
                          >
                            Không tìm thấy dữ liệu đỗ xe phù hợp.
                          </td>
                        </tr>
                      ) : (
                        history
                          .filter(
                            (item) =>
                              item.building
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase()) ||
                              `${item.floorName} ${item.zoneCode} ${item.zoneName}`
                                .toLowerCase()
                                .includes(searchTerm.toLowerCase()),
                          )
                          .map((item) => (
                            <tr
                              key={item.id}
                              className="hover:bg-slate-50 transition-colors duration-150"
                            >
                              <td className="py-4 pl-2 font-mono font-medium text-slate-500">
                                {item.date}
                              </td>
                              <td className="py-4 font-bold text-slate-900">
                                {item.building}
                              </td>
                              <td className="py-4 font-mono text-indigo-600 font-bold">
                                {item.floorName}-{item.zoneCode}
                              </td>
                              <td className="py-4 text-slate-650">
                                {item.vehicle || "Xe ô tô"}
                              </td>
                              <td className="py-4 font-bold text-slate-900">
                                {item.cost}
                              </td>
                              <td className="py-4 text-right pr-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <ProfileTab
              user={user}
              newPlateInput={newPlateInput}
              setNewPlateInput={setNewPlateInput}
              handleAddPlate={handleAddPlate}
              handleDeletePlate={handleDeletePlate}
              setActiveTab={setActiveTab}
              loadUserData={loadUserData}
            />
          )}
        </section>
      </main>

      <MobileDriverNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        navigate={navigate}
        onLogout={onLogout}
      />

      {qrModalData && (
        <DriverQrModal
          data={qrModalData}
          userName={user.name}
          onClose={() => setQrModalData(null)}
        />
      )}
    </div>
  );
}
function ReservationTicketPreview({ booking, userName }) {
  if (!booking) return null;

  const vehicleTypeName =
    booking.vehicleTypeName || booking.vehicleType || "--";
  const isBike = isBicycleVehicleTypeName(vehicleTypeName);
  const identifierLabel = isBike ? "Mã xe đạp" : "Biển số";
  const identifierValue = isBike
    ? booking.licensePlate || "--"
    : formatPlateForDisplay(booking.licensePlate, vehicleTypeName);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-left">
      <div className="rounded-[1.5rem] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-5 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-500">
          Reservation Ticket
        </p>

        <h3 className="mt-2 text-xl font-black text-slate-950">Vé giữ chỗ</h3>

        <p className="mt-1 font-mono text-xs font-black text-slate-500">
          {booking.reservationCode || booking.bookingCode || "--"}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
        <InfoRow label="Chủ xe" value={userName || "--"} />
        <InfoRow label="Loại xe" value={vehicleTypeName} />
        <InfoRow label={identifierLabel} value={identifierValue} mono />
        <InfoRow
          label="Zone"
          value={`${booking.floorName || booking.floor || "--"} - ${booking.zoneCode || "--"}`}
          mono
        />
        <InfoRow
          label="Bắt đầu"
          value={
            booking.reservedFrom
              ? new Date(booking.reservedFrom).toLocaleString("vi-VN")
              : "--"
          }
        />
        <InfoRow
          label="Kết thúc"
          value={
            booking.reservedTo
              ? new Date(booking.reservedTo).toLocaleString("vi-VN")
              : "--"
          }
        />
        <InfoRow label="Trạng thái" value={booking.status || "--"} />
      </div>

      <p className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs font-semibold leading-5 text-slate-600">
        Xuất trình mã đặt chỗ hoặc {isBike ? "mã xe đạp" : "biển số"} cho nhân
        viên tại cổng.
      </p>
    </div>
  );
}

function InfoRow({ label, value, mono = false }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p
        className={`mt-1 text-xs font-black text-slate-800 ${mono ? "font-mono" : ""}`}
      >
        {value || "--"}
      </p>
    </div>
  );
}

function DriverQrModal({ data, userName, onClose }) {
  const isSession = data.type === "SESSION";
  const item = isSession ? data.session : data.reservation;
  const code = isSession
    ? item.sessionCode
    : item.reservationCode || item.bookingCode;

  const payload = isSession
    ? JSON.stringify({
        type: "SESSION",
        sessionCode: item.sessionCode,
        licensePlate: item.licensePlate,
        vehicleType: item.vehicle,
        zoneCode: item.zoneCode,
        floor: item.floor,
      })
    : "";

  const vehicleTypeName =
    item.vehicleTypeName || item.vehicleType || item.vehicle;
  const identifierLabel = getVehicleIdentifierLabel(vehicleTypeName);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between bg-slate-950 px-6 py-5 text-white">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">
              {isSession ? "Mã QR phiên gửi xe" : "Vé giữ chỗ"}
            </p>
            <h3 className="mt-2 text-xl font-black">
              {isSession ? "Mã phiên gửi xe" : "Thông tin vé đặt chỗ"}
            </h3>
            <p className="mt-1 font-mono text-xs font-bold text-slate-300">
              {code || "--"}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-black transition hover:bg-white/20"
          >
            Đóng
          </button>
        </div>

        <div className="p-7 text-center">
          {isSession ? (
            <>
              <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-3xl border border-slate-200 bg-white p-4 shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(payload)}`}
                  alt="Driver QR Code"
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
                <InfoRow label="Tài xế" value={userName} />
                <InfoRow
                  label="Biển số"
                  value={formatPlateForDisplay(
                    item.licensePlate,
                    vehicleTypeName,
                  )}
                  mono
                />
                <InfoRow
                  label="Khu vực"
                  value={`${item.floorName || item.floor || "--"}-${item.zoneCode || "--"}`}
                  mono
                />
                <InfoRow label="Trạng thái" value={item.status} />
              </div>

              <p className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs font-semibold leading-5 text-indigo-700">
                Xuất trình mã QR phiên gửi xe cho nhân viên tại cổng khi cần hỗ
                trợ.
              </p>
            </>
          ) : (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm">
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-500">
                    Reservation Ticket
                  </p>
                  <h3 className="mt-2 text-lg font-black text-slate-900">
                    Vé giữ chỗ
                  </h3>
                  <p className="mt-1 font-mono text-xs font-bold text-slate-400">
                    {code || "--"}
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                  <InfoRow label="Chủ xe" value={userName || "--"} />
                  <InfoRow label="Loại xe" value={vehicleTypeName || "--"} />
                  <InfoRow
                    label={identifierLabel}
                    value={
                      isBicycleVehicleTypeName(vehicleTypeName)
                        ? item.licensePlate || "--"
                        : formatPlateForDisplay(
                            item.licensePlate,
                            vehicleTypeName,
                          )
                    }
                    mono
                  />
                  <InfoRow
                    label="Khu vực"
                    value={`${item.floorName || item.floor || "--"}-${item.zoneCode || "--"}`}
                    mono
                  />
                  <InfoRow
                    label="Bắt đầu"
                    value={
                      item.reservedFrom
                        ? new Date(item.reservedFrom).toLocaleString("vi-VN")
                        : "--"
                    }
                  />
                  <InfoRow
                    label="Kết thúc"
                    value={
                      item.reservedTo
                        ? new Date(item.reservedTo).toLocaleString("vi-VN")
                        : "--"
                    }
                  />
                  <InfoRow label="Trạng thái" value={item.status || "--"} />
                </div>

                <p className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-center text-xs font-semibold leading-5 text-indigo-700">
                  Xuất trình mã đặt chỗ hoặc {identifierLabel.toLowerCase()} cho
                  nhân viên tại cổng.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MobileDriverNav({ activeTab, setActiveTab, navigate, onLogout }) {
  const itemClass = (active) =>
    `mobile-nav-item ${active ? "mobile-nav-active" : ""}`;

  return (
    <nav className="mobile-driver-nav md:hidden">
      <button
        type="button"
        onClick={() => setActiveTab("dashboard")}
        className={itemClass(activeTab === "dashboard")}
      >
        <span className="mobile-nav-icon">🏠</span>
        <span className="mobile-nav-label">Home</span>
      </button>

      <button
        type="button"
        onClick={() => navigate("/driver/map")}
        className={itemClass(false)}
      >
        <span className="mobile-nav-icon">🗺️</span>
        <span className="mobile-nav-label">Map</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab("session")}
        className={itemClass(activeTab === "session")}
      >
        <span className="mobile-nav-icon">🎫</span>
        <span className="mobile-nav-label">Vé</span>
      </button>

      <button
        type="button"
        onClick={() => setActiveTab("profile")}
        className={itemClass(activeTab === "profile")}
      >
        <span className="mobile-nav-icon">👤</span>
        <span className="mobile-nav-label">Hồ sơ</span>
      </button>

      <button
        type="button"
        onClick={onLogout}
        className="mobile-nav-item mobile-nav-danger"
      >
        <span className="mobile-nav-icon">↪</span>
        <span className="mobile-nav-label">Thoát</span>
      </button>
    </nav>
  );
}

// Side Navigation helper components
function SideLink({ to, icon, label, active, collapsed }) {
  return (
    <Link
      to={to}
      className={`nav-link-item flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${
        active
          ? "bg-slate-800 text-blue-400 border border-slate-700 shadow-inner"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </Link>
  );
}

function ButtonLink({ icon, label, collapsed, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-all duration-200"
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}

function StatItem({ title, value, icon, desc }) {
  return (
    <div className="stat-card-item rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <span className="text-md bg-slate-50 p-2 rounded-xl border border-slate-100">
          {icon}
        </span>
      </div>
      <div className="mt-4 flex flex-col">
        <span className="text-2xl font-black text-slate-900 font-mono">
          {value}
        </span>
        <span className="text-[10px] font-semibold text-slate-400 mt-1">
          {desc}
        </span>
      </div>
    </div>
  );
}
