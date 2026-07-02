// src/pages/driver/DriverDashboard.jsx
import DriverSosBanner from "./DriverSosBanner";
import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import driverAvatar from "../../assets/driver-avatar.png";
import { staffApi } from "../../api/parkingApi";
import gsap from "gsap";
import ProfileTab from "./ProfileTab";
import { QRCodeCanvas } from "qrcode.react";

import {
  normalizeLicensePlate as normalizePlateForApi,
  formatLicensePlate,
  getLicensePlateValidationError,
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


const getVehicleIdentifierLabel = (vehicleTypeName) =>
  isBicycleVehicleTypeName(vehicleTypeName) ? "Mã xe đạp" : "Biển số";

const getVehicleIdentifierValue = (item) => {
  const vehicleTypeName =
    item?.vehicleTypeName || item?.vehicleType || item?.vehicle || "";

  if (isBicycleVehicleTypeName(vehicleTypeName)) {
    return item?.licensePlate || "--";
  }

  return formatLicensePlate(item?.licensePlate, vehicleTypeName);
};

const normalizeDriverSearchText = (value) => {
  const normalized = String(value || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Đ/g, "D")
    .replace(/đ/g, "D")
    .trim();

  const compact = normalized.replace(/[^A-Z0-9]/g, "");

  return `${normalized} ${compact}`;
};

const matchesDriverSearch = (keyword, fields = []) => {
  const rawKeyword = String(keyword || "").trim();

  if (!rawKeyword) return true;

  const normalizedKeyword = normalizeDriverSearchText(rawKeyword);
  const keywordTokens = normalizedKeyword
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const searchableText = fields
    .filter((value) => value !== null && value !== undefined)
    .map((value) => normalizeDriverSearchText(value))
    .join(" ");

  const compactSearchableText = searchableText.replace(/[^A-Z0-9]/g, "");

  return keywordTokens.every((token) => {
    const compactToken = token.replace(/[^A-Z0-9]/g, "");

    return (
      searchableText.includes(token) ||
      compactSearchableText.includes(compactToken)
    );
  });
};

const getCompactSearchText = (value) =>
  String(value || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Đ/g, "D")
    .replace(/đ/g, "D")
    .replace(/[^A-Z0-9]/g, "");

const isPlateLikeSearchKeyword = (keyword) => {
  const raw = String(keyword || "").trim();
  const compact = getCompactSearchText(raw);

  if (!compact) return false;

  // Có dấu / hoặc : thì thường là tìm theo ngày giờ, không xem là biển số.
  if (/[/:]/.test(raw)) return false;

  // Có số thì ưu tiên xem là tìm biển số/mã đặt chỗ/mã phiên/khu.
  return /\d/.test(compact);
};

const matchesDriverSmartSearch = ({
  keyword,
  primaryFields = [],
  secondaryFields = [],
}) => {
  const rawKeyword = String(keyword || "").trim();

  if (!rawKeyword) return true;

  const plateLike = isPlateLikeSearchKeyword(rawKeyword);

  // Nếu user gõ kiểu 50, 50AB, 50AB12345, B010720260001, B1-A
  // thì chỉ tìm trong nhóm chính: biển số/mã xe/mã phiên/mã đặt chỗ/khu.
  // Không search ngày giờ để tránh ra kết quả sai.
  if (plateLike) {
    return matchesDriverSearch(rawKeyword, primaryFields);
  }

  // Nếu user gõ completed, xe máy, hoàn tất, đã hủy...
  // thì cho search rộng hơn.
  return matchesDriverSearch(rawKeyword, [
    ...primaryFields,
    ...secondaryFields,
  ]);
};

const formatDateTimeText = (value) => {
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

const formatDurationText = (minutes) => {
  const totalMinutes = Number(minutes || 0);
  if (totalMinutes <= 0) return "--";

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours <= 0) return `${mins} phút`;
  if (mins <= 0) return `${hours} giờ`;
  return `${hours} giờ ${mins} phút`;
};

const getSessionStatusLabel = (status) => {
  const value = String(status || "").toUpperCase();

  if (value === "ACTIVE") return "Đang gửi";
  if (value === "COMPLETED") return "Đã hoàn tất";
  if (value === "CANCELLED") return "Đã hủy";

  return value || "--";
};

const getPaymentStatusLabel = (status) => {
  const value = String(status || "").toUpperCase();

  if (!value || value === "--") return "Chưa có thanh toán";
  if (value === "PAID" || value === "COMPLETED" || value === "SUCCESS") {
    return "Đã thanh toán";
  }
  if (value === "PENDING") return "Chờ thanh toán";
  if (value === "FAILED") return "Thanh toán thất bại";

  return value;
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

function DriverMobileInlineCSS() {
  return (
    <style>{`
      :root {
        --driver-bottom-nav-height: 76px;
      }

      .mobile-driver-nav {
        position: fixed;
        left: 10px;
        right: 10px;
        bottom: max(10px, env(safe-area-inset-bottom));
        z-index: 9990;
        display: none;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 6px;
        padding: 8px;
        border: 1px solid rgba(226, 232, 240, 0.9);
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 -14px 44px rgba(15, 23, 42, 0.16);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
      }

      .mobile-nav-item {
        min-width: 0;
        min-height: 56px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        border: 0;
        border-radius: 18px;
        background: transparent;
        color: #64748b;
        font-weight: 900;
        line-height: 1;
        text-decoration: none;
        transition: all 0.16s ease;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }

      .mobile-nav-item:active {
        transform: scale(0.95);
      }

      .mobile-nav-active {
        background: linear-gradient(135deg, #4f46e5, #2563eb);
        color: #ffffff;
        box-shadow: 0 12px 24px rgba(37, 99, 235, 0.26);
      }

      .mobile-nav-danger {
        color: #e11d48;
      }

      .mobile-nav-icon {
        display: block;
        font-size: 18px;
        line-height: 1;
      }

      .mobile-nav-label {
        display: block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 10px;
        letter-spacing: -0.01em;
      }

      .mobile-floor-scroll {
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
      }

      .mobile-floor-scroll::-webkit-scrollbar {
        display: none;
      }

      @media (max-width: 767px) {
        html,
        body,
        #root {
          width: 100%;
          min-width: 320px;
          overflow-x: hidden;
        }

        body {
          background: #f8fafc;
        }

        .driver-mobile-shell {
          display: block;
          width: 100%;
          min-height: 100dvh;
          padding-bottom: calc(var(--driver-bottom-nav-height) + 22px + env(safe-area-inset-bottom));
        }

        .main-content-area {
          width: 100%;
          min-width: 0;
          margin-left: 0 !important;
          padding-bottom: calc(var(--driver-bottom-nav-height) + 18px + env(safe-area-inset-bottom));
        }

        .main-content-area > header {
          min-height: 64px;
          align-items: center;
          padding: 12px 14px;
          border-bottom-color: rgba(226, 232, 240, 0.75);
          border-bottom-left-radius: 22px;
          border-bottom-right-radius: 22px;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
        }

        .main-content-area > header h2 {
          max-width: 58vw;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 16px;
          line-height: 1.2;
        }

        .main-content-area > header p {
          max-width: 58vw;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .main-content-area > header > div:last-child {
          gap: 8px;
        }

        .main-content-area > header button {
          min-width: 40px;
          min-height: 40px;
        }

        .driver-content-section {
          padding: 14px 14px calc(var(--driver-bottom-nav-height) + 28px + env(safe-area-inset-bottom)) !important;
          min-height: auto !important;
        }

        .welcome-banner,
        .action-panel-item,
        .stat-card-item,
        .zone-card-mobile,
        .profile-mobile-root > section,
        .profile-mobile-root > div {
          border-radius: 22px !important;
        }

        .welcome-banner {
          padding: 18px !important;
        }

        .welcome-banner h1,
        .profile-mobile-root h3 {
          font-size: clamp(22px, 7vw, 30px) !important;
          line-height: 1.08 !important;
        }

        .welcome-banner p,
        .profile-mobile-root p {
          line-height: 1.6;
        }

        .stat-card-item,
        .action-panel-item,
        .zone-card-mobile {
          padding: 16px !important;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
        }

        .profile-mobile-root {
          gap: 18px;
        }

        .profile-mobile-root .grid {
          min-width: 0;
        }

        .profile-mobile-root input,
        .profile-mobile-root select,
        .driver-content-section input,
        .driver-content-section select {
          font-size: 16px;
        }

        .profile-mobile-root input,
        .profile-mobile-root select,
        .profile-mobile-root button,
        .driver-content-section input,
        .driver-content-section select,
        .driver-content-section button {
          touch-action: manipulation;
        }

        .mobile-driver-nav {
          display: grid;
        }

        .mobile-driver-nav .mobile-nav-item {
          min-height: 54px;
        }

        .mobile-driver-nav .mobile-nav-label {
          font-size: 9.5px;
        }

        .zone-card-head,
        .zone-card-footer {
          gap: 10px;
        }

        .zone-card-metrics {
          gap: 8px !important;
        }

        .zone-card-legend {
          transform: none !important;
          transform-origin: center !important;
        }

        .fixed.inset-0[class*="z-[9998]"],
        .fixed.inset-0[class*="z-[100]"],
        .fixed.inset-0[class*="z-[9999]"] {
          align-items: flex-end !important;
          padding: 12px !important;
        }

        .fixed.inset-0[class*="z-[9998]"] > div,
        .fixed.inset-0[class*="z-[100]"] > div,
        .fixed.inset-0[class*="z-[9999]"] > div {
          max-height: calc(100dvh - 24px);
          overflow-y: auto;
          border-radius: 28px !important;
        }
      }

      @media (max-width: 380px) {
        .mobile-driver-nav {
          left: 6px;
          right: 6px;
          gap: 4px;
          padding: 6px;
          border-radius: 20px;
        }

        .mobile-nav-icon {
          font-size: 16px;
        }

        .mobile-nav-label {
          font-size: 9px;
        }

        .driver-content-section {
          padding-left: 10px !important;
          padding-right: 10px !important;
        }
      }
    `}</style>
  );
}

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
  const [showAllReservations, setShowAllReservations] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

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
  const [historyQuickFilter, setHistoryQuickFilter] = useState("ALL");
  const [reservationSearchTerm, setReservationSearchTerm] = useState("");
  const [qrModalData, setQrModalData] = useState(null);
  const [sessionTicketModal, setSessionTicketModal] = useState(null);
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
    let registryPlates = [];
    let plates = [];
    let activeSession = null;
    let activeSessions = [];
    let activeReservation = null;
    let reservations = [];
    let parkingPasses = [];
    let historyList = [];
    let totalAvailable = 0;
    let dashboardPricingPlans = [];
    let dashboardPricingConfig = {
      buildings: [],
      vehicleTypes: [],
    };
    try {
      const resPlates = await staffApi.getDriverPlates();

      // NOTE Quảng - Driver:
      // registryPlates là biển số thật trong hồ sơ Driver, dùng cho ProfileTab thêm/xóa.
      // plates là danh sách lookup mở rộng, dùng nội bộ để tra cứu session/history.
      registryPlates = resPlates.data?.data || [];
      plates = [...registryPlates];
    } catch (err) {
      console.error("Không thể tải biển số từ backend:", err);
      registryPlates = [];
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

    // Xe đạp không nằm trong /driver/plates.
    // Vì vậy phải lấy mã xe đạp từ reservations và parkingPasses để query active/history.
    const passRes = await staffApi.getDriverPasses().catch(() => null);
    parkingPasses = passRes?.data?.data || [];

    const getLookupVehicleTypeName = (item, source = "UNKNOWN") => {
      return (
        item?.vehicleTypeName ||
        item?.vehicleType?.name ||
        item?.vehicleType?.vehicleTypeName ||
        (typeof item?.vehicleType === "string" ? item.vehicleType : "") ||
        (source === "PASS" ? "Xe theo vé đăng ký" : "Xe đặt chỗ")
      );
    };

    const addLookupIdentifierIfMissing = (item, source = "UNKNOWN") => {
      const rawIdentifier = item?.licensePlate;
      const normalizedIdentifier = normalizePlateForApi(rawIdentifier);

      if (!normalizedIdentifier || normalizedIdentifier === "--") return;

      const existed = plates.some(
        (plate) =>
          normalizePlateForApi(getPlateValue(plate)) === normalizedIdentifier,
      );

      if (existed) return;

      plates = [
        ...plates,
        {
          licensePlate: normalizedIdentifier,
          vehicleTypeId: item?.vehicleTypeId || item?.vehicleType?.id || null,
          vehicleTypeName: getLookupVehicleTypeName(item, source),
          source,
        },
      ];
    };

    reservations
      .filter((item) =>
        ["PENDING", "CONFIRMED", "COMPLETED"].includes(
          String(item?.status || "").toUpperCase(),
        ),
      )
      .forEach((item) => addLookupIdentifierIfMissing(item, "RESERVATION"));

    parkingPasses
      .filter((item) => Boolean(item?.licensePlate))
      .forEach((item) => addLookupIdentifierIfMissing(item, "PASS"));

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
          source: "RESERVATION",
        },
      ];
    }

    const uniqueLookupPlates = Array.from(
      new Map(
        plates
          .map((plate) => {
            const normalizedValue = normalizePlateForApi(getPlateValue(plate));

            if (!normalizedValue || normalizedValue === "--") return null;

            return [
              normalizedValue,
              typeof plate === "string"
                ? normalizedValue
                : {
                  ...plate,
                  licensePlate: normalizedValue,
                },
            ];
          })
          .filter(Boolean),
      ).values(),
    );

    if (uniqueLookupPlates.length > 0) {
      const toDriverActiveSession = (backendSession) => {
        if (!backendSession) return null;

        const vehicleTypeName =
          backendSession.vehicleType ||
          backendSession.vehicleTypeName ||
          "--";

        const compactPlate = normalizePlateForApi(backendSession.licensePlate);

        const createdTimestamp = backendSession.entryTime
          ? new Date(backendSession.entryTime).getTime()
          : Date.now();

        return {
          id: [
            backendSession.sessionId ||
            backendSession.id ||
            backendSession.sessionCode ||
            "session",
            compactPlate,
            backendSession.entryTime || "",
          ]
            .filter(Boolean)
            .join("-"),

          sessionId: backendSession.sessionId || backendSession.id || null,
          sessionCode: backendSession.sessionCode || "--",

          zoneCode: backendSession.zoneCode || "--",
          zoneName: backendSession.zoneName || "--",
          floor: backendSession.floorName || "--",
          floorName: backendSession.floorName || "--",
          area: backendSession.zoneName || "--",

          vehicle: vehicleTypeName,
          vehicleTypeName,

          identifierLabel: getVehicleIdentifierLabel(vehicleTypeName),
          identifierValue: getVehicleIdentifierValue({
            licensePlate: compactPlate,
            vehicleTypeName,
          }),

          licensePlate: compactPlate || backendSession.licensePlate || "--",

          entryTime: backendSession.entryTime,
          startTime: formatDateTimeText(backendSession.entryTime),
          zoneEntryTime: formatDateTimeText(backendSession.zoneEntryTime),

          estimatedFee: Number(backendSession.totalFee || 0),
          totalFee: Number(backendSession.totalFee || 0),

          status: getSessionStatusLabel(backendSession.status),
          rawStatus: backendSession.status,

          buildingName: backendSession.buildingName || "Smart Parking",
          buildingAddress: backendSession.buildingAddress || "--",

          entryMainGateName: backendSession.entryMainGateName || "--",
          entryZoneGateName: backendSession.entryZoneGateName || "--",

          driverType: backendSession.driverType || "--",
          passType: backendSession.passType || "Vé lượt",
          paymentStatus: getPaymentStatusLabel(backendSession.paymentStatus),

          createdTimestamp,
        };
      };

      const sessionResults = await Promise.all(
        uniqueLookupPlates.map((plate) =>
          staffApi
            .getActiveSession(getPlateValue(plate))
            .then((res) => toDriverActiveSession(res.data?.data))
            .catch(() => null),
        ),
      );

      activeSessions = sessionResults
        .filter(Boolean)
        .sort((a, b) => {
          return Number(b.createdTimestamp || 0) - Number(a.createdTimestamp || 0);
        });

      activeSession = activeSessions[0] || null;

      if (activeSession) {
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
        uniqueLookupPlates.map(async (plate) => {
          const lookupPlate = normalizePlateForApi(getPlateValue(plate));
          const lookupVehicleTypeName =
            typeof plate === "string"
              ? ""
              : plate?.vehicleTypeName || plate?.vehicleType || "";

          try {
            const res = await staffApi.getSessionHistory(lookupPlate);
            const rows = res.data?.data || [];

            return rows
              .filter((session) => {
                const sessionPlate = normalizePlateForApi(session.licensePlate);

                // Nếu backend trả đúng plate thì giữ.
                // Nếu backend trả record khác plate đang query thì bỏ để tránh hiển thị sai.
                return !sessionPlate || sessionPlate === lookupPlate;
              })
              .map((session) => ({
                ...session,
                licensePlate: normalizePlateForApi(session.licensePlate || lookupPlate),
                _lookupPlate: lookupPlate,
                _lookupVehicleTypeName: lookupVehicleTypeName,
              }));
          } catch {
            return [];
          }
        }),
      );

      /// xếp cái lịch sử của xe sort theo thời gian 
      // mới nhất sẽ ở trên, cũ hơn sẽ ở dupwsi....

      const getHistoryTime = (session) => {
        const rawTime =
          session.exitTime ||
          session.zoneExitTime ||
          session.entryTime ||
          session.zoneEntryTime ||
          session.sessionCreatedAt;

        const time = new Date(rawTime || 0).getTime();
        return Number.isFinite(time) ? time : 0;
      };

      const uniqueHistorySessions = Array.from(
        new Map(
          historyResults
            .flat()
            .map((session, index) => {
              const uniqueKey =
                [
                  session.sessionId,
                  session.sessionCode,
                  normalizePlateForApi(session.licensePlate),
                  session.entryTime,
                  session.exitTime,
                ]
                  .filter(Boolean)
                  .join("|") || `history-${index}`;

              return [uniqueKey, session];
            }),
        ).values(),
      );

      historyList = uniqueHistorySessions
        .slice()
        .sort((a, b) => getHistoryTime(b) - getHistoryTime(a))
        .map((s, idx) => {
          const vehicleTypeName =
            s.vehicleType || s.vehicleTypeName || s._lookupVehicleTypeName || "--";

          const normalizedHistoryPlate = normalizePlateForApi(
            s.licensePlate || s._lookupPlate,
          );

          const durationMinutes = Number(s.durationMinutes || 0);

          return {
            id: [
              s.sessionId || s.sessionCode || "history",
              normalizedHistoryPlate,
              s.entryTime || s.sessionCreatedAt || "",
              s.exitTime || "",
            ]
              .filter(Boolean)
              .join("-"),
            sessionCode: s.sessionCode || "--",
            sessionId: s.sessionId || null,

            licensePlate: normalizedHistoryPlate || "--",
            identifierLabel: getVehicleIdentifierLabel(vehicleTypeName),
            identifierValue: getVehicleIdentifierValue({
              licensePlate: normalizedHistoryPlate,
              vehicleTypeName,
            }),

            entryTime: s.entryTime,
            exitTime: s.exitTime,
            zoneEntryTime: s.zoneEntryTime,
            zoneExitTime: s.zoneExitTime,
            sessionCreatedAt: s.sessionCreatedAt,

            date: formatDateTimeText(s.entryTime),
            exitDate: formatDateTimeText(s.exitTime),
            zoneEntryDate: formatDateTimeText(s.zoneEntryTime),
            zoneExitDate: formatDateTimeText(s.zoneExitTime),
            registeredAt: formatDateTimeText(s.sessionCreatedAt),

            zoneCode: s.zoneCode || "--",
            zoneName: s.zoneName || "--",
            floorName: s.floorName || "--",
            building: s.buildingName || "Smart Parking",
            buildingAddress: s.buildingAddress || "--",

            vehicle: vehicleTypeName,
            driverType: s.driverType || "--",
            passType: s.passType || "Vãng lai / Đặt chỗ",
            paymentStatus: getPaymentStatusLabel(s.paymentStatus),

            entryMainGateName: s.entryMainGateName || "--",
            exitMainGateName: s.exitMainGateName || "--",
            entryZoneGateName: s.entryZoneGateName || "--",
            exitZoneGateName: s.exitZoneGateName || "--",

            cost: s.totalFee
              ? `${Number(s.totalFee).toLocaleString("vi-VN")}đ`
              : "0đ",

            durationMinutes,
            durationText: formatDurationText(durationMinutes),
            status: getSessionStatusLabel(s.status),
            notes: s.notes || "--",
          };
        });
    }

    try {
      const configRes = await staffApi.getParkingConfig();
      const configData = configRes.data?.data || {};
      const zones = configData.zones || [];

      dashboardPricingConfig = {
        buildings: configData.buildings || [],
        vehicleTypes: configData.vehicleTypes || [],
      };

      totalAvailable = zones.reduce((sum, z) => {
        const available =
          (z.capacity || 0) - (z.currentCount || 0) - (z.reservedCount || 0);
        return sum + Math.max(0, available);
      }, 0);
    } catch (err) {
      console.error("Không thể tải cấu hình zone từ backend:", err);
      totalAvailable = 0;
    }

    try {
      const pricingRes = await staffApi.getDriverPricingPlans();
      dashboardPricingPlans = pricingRes.data?.data || [];
    } catch (err) {
      console.error("Không thể tải bảng giá driver từ backend:", err);
      dashboardPricingPlans = [];
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

        // NOTE Quảng - Driver:
        // ProfileTab chỉ được nhận biển số thật từ /driver/plates để thêm/xóa.
        // Không truyền plates mở rộng từ reservation/pass xuống ProfileTab,
        // tránh lỗi xóa thất bại "Không tìm thấy biển số cần xóa".
        licensePlates: registryPlates,
      },
      currentSession: activeSession,
      activeSessions,
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
      pricingPlans: dashboardPricingPlans,
      pricingConfig: dashboardPricingConfig,
    });
    setLoading(false);
  };

  /**
  * Hàm: handleAddPlate
  * Note Quảng - Driver:
  * Thêm biển số xe vào hồ sơ Driver.
  * - Input UI được normalize nhẹ bằng normalizePlateInput().
  * - Dữ liệu gửi API dùng normalizePlateForApi() để compact giống Staff.
  * - Validate dùng getLicensePlateValidationError() từ utils/licensePlate.js
  *   để đồng bộ với Staff check-in.
  */
  const handleAddPlate = async (e, vehicleTypeId, vehicleTypeName) => {
    e.preventDefault();

    const inputPlate = normalizePlateInput(newPlateInput);
    const compactPlate = normalizePlateForApi(inputPlate);

    if (!compactPlate) {
      alert("Vui lòng nhập biển số xe.");
      return false;
    }

    if (!vehicleTypeId) {
      alert("Vui lòng chọn loại xe trước khi thêm biển số.");
      return false;
    }

    const plateError = getLicensePlateValidationError(
      compactPlate,
      vehicleTypeName,
    );

    if (plateError) {
      alert(plateError);
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
        `Đăng ký biển số ${formatLicensePlate(compactPlate, vehicleTypeName)} thành công!`,
      );
      return true;
    } catch (err) {
      console.error("Failed to add driver plate", err);
      alert(err?.response?.data?.message || "Không thể thêm biển số xe.");
      return false;
    }
  };

  /**
 * Hàm: handleDeletePlate
 * Note Quảng - Driver:
 * Xóa biển số thật trong hồ sơ Driver.
 * Chỉ xóa những biển số lấy từ /driver/plates.
 * Trước khi gửi API, biển số được normalize compact để khớp backend.
 */
  const handleDeletePlate = async (plateToDelete) => {
    const plateValue = getPlateValue(plateToDelete);
    const compactPlate = normalizePlateForApi(plateValue);

    if (!compactPlate) {
      alert("Không tìm thấy biển số xe để xóa.");
      return;
    }

    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa biển số ${formatLicensePlate(
          compactPlate,
        )} khỏi tài khoản không?`,
      )
    ) {
      return;
    }

    try {
      await staffApi.deleteDriverPlate(compactPlate);
      await loadUserData();

      alert(
        `Đã xóa biển số xe ${formatLicensePlate(
          compactPlate,
        )} thành công khỏi hồ sơ!`,
      );
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || "Lỗi xóa biển số xe";

      // Nếu FE đang hiển thị dữ liệu cũ, reload lại danh sách cho sạch.
      if (String(errorMsg).toLowerCase().includes("không tìm thấy")) {
        await loadUserData();
      }

      alert(`Xóa thất bại: ${errorMsg}`);
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

    // Nạp dữ liệu khởi tạo, gom dữ liệu cho dashboard, phiên đang gửi, đặt chỗ, lịch sử, hồ sơ.
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
    activeSessions = [],
    currentBooking,
    stats,
    history,
    reservations = [],
    pricingPlans = [],
    pricingConfig = { buildings: [], vehicleTypes: [] },
  } = data;


  // Format Timer Seconds
  const formatTimer = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // tính thời gian gửi xe thực tế từ thời điểm tạo session đến hiện tại
  const formatSessionTimer = (session) => {
    const startTimestamp = Number(session?.createdTimestamp || 0);

    if (!startTimestamp) return "00:00:00";

    const elapsedSeconds = Math.max(
      0,
      Math.floor((Date.now() - startTimestamp) / 1000),
    );

    return formatTimer(elapsedSeconds);
  };

  const formatMoney = (value) => {
    return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
  };

  const isPassBasedSession = (session) => {
    const passType = normalizeVehicleTypeText(session?.passType);

    return (
      passType.includes("MONTHLY") ||
      passType.includes("QUARTERLY") ||
      passType.includes("YEARLY") ||
      passType.includes("THANG") ||
      passType.includes("QUY") ||
      passType.includes("NAM")
    );
  };

  const getPassTypeDisplay = (passType) => {
    const value = normalizeVehicleTypeText(passType);

    if (value.includes("MONTHLY") || value.includes("THANG")) {
      return "Gói tháng";
    }

    if (value.includes("QUARTERLY") || value.includes("QUY")) {
      return "Gói quý";
    }

    if (value.includes("YEARLY") || value.includes("NAM")) {
      return "Gói năm";
    }

    return passType || "Vé lượt";
  };

  const getActiveSessionFeeText = (session) => {
    if (isPassBasedSession(session)) {
      return "Đã bao gồm trong gói";
    }

    return formatMoney(session?.estimatedFee || session?.totalFee || 0);
  };

  const getActiveSessionPaymentText = (session) => {
    if (isPassBasedSession(session)) {
      return "Đã thanh toán bằng gói";
    }

    return session?.paymentStatus || "Chưa có thanh toán";
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
      return "border-indigo-100 bg-indigo-50 text-indigo-700";
    }

    if (normalizedStatus === "COMPLETED") {
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    }

    if (normalizedStatus === "CANCELLED") {
      return "border-rose-100 bg-rose-50 text-rose-700";
    }

    if (normalizedStatus === "EXPIRED") {
      return "border-amber-100 bg-amber-50 text-amber-700";
    }

    return "border-slate-200 bg-slate-50 text-slate-500";
  };

  const isReservationCancelable = (status) => {
    return ["PENDING", "CONFIRMED"].includes(
      String(status || "").toUpperCase(),
    );
  };

  const filteredReservations = reservations.filter((item) => {
    const keyword = reservationSearchTerm.trim();

    if (!keyword) return true;

    return matchesDriverSmartSearch({
      keyword,
      primaryFields: [
        item.reservationCode,
        item.licensePlate,
        getVehicleIdentifierValue(item),
        item.zoneCode,
        item.zoneName,
        item.floorName,
        `${item.floorName}-${item.zoneCode}`,
        item.vehicleTypeName,
        item.vehicleType,
      ],
      secondaryFields: [
        item.buildingName,
        item.status,
        formatDateTime(item.reservedFrom),
        formatDateTime(item.reservedTo),
        formatDateTime(item.createdAt),
      ],
    });
  });

  const RESERVATION_PREVIEW_LIMIT = 4;

  const visibleReservations = showAllReservations
    ? filteredReservations
    : filteredReservations.slice(0, RESERVATION_PREVIEW_LIMIT);

  const hasMoreReservations =
    filteredReservations.length > RESERVATION_PREVIEW_LIMIT;

  const historySearchKeyword = searchTerm.trim();

  const matchesHistoryQuickFilter = (item) => {
    const statusText = normalizeVehicleTypeText(item.status);
    const paymentText = normalizeVehicleTypeText(item.paymentStatus);

    if (historyQuickFilter === "ALL") return true;

    if (historyQuickFilter === "ACTIVE") {
      return statusText.includes("DANG GUI") || statusText.includes("ACTIVE");
    }

    if (historyQuickFilter === "COMPLETED") {
      return statusText.includes("HOAN TAT") || statusText.includes("COMPLETED");
    }

    if (historyQuickFilter === "CANCELLED") {
      return statusText.includes("HUY") || statusText.includes("CANCEL");
    }

    if (historyQuickFilter === "PENDING_PAYMENT") {
      return paymentText.includes("CHO THANH TOAN") || paymentText.includes("PENDING");
    }

    return true;
  };

  const filteredHistory = history.filter((item) => {
    const matchesFilter = matchesHistoryQuickFilter(item);

    if (!matchesFilter) return false;

    if (!historySearchKeyword.trim()) return true;

    return matchesDriverSmartSearch({
      keyword: historySearchKeyword,
      primaryFields: [
        item.sessionCode,
        item.identifierValue,
        item.licensePlate,
        item.floorName,
        item.zoneCode,
        item.zoneName,
        `${item.floorName}-${item.zoneCode}`,
      ],
      secondaryFields: [
        item.vehicle,
        item.driverType,
        item.passType,
        item.paymentStatus,
        item.status,
        item.building,
        item.buildingAddress,
        item.entryMainGateName,
        item.exitMainGateName,
        item.notes,
        item.date,
        item.exitDate,
        item.registeredAt,
      ],
    });
  });

  const HISTORY_PREVIEW_LIMIT = 4;

  const visibleHistory = showAllHistory
    ? filteredHistory
    : filteredHistory.slice(0, HISTORY_PREVIEW_LIMIT);

  const hasMoreHistory = filteredHistory.length > HISTORY_PREVIEW_LIMIT;

  const isHistorySearchActive =
    searchTerm.trim() || historyQuickFilter !== "ALL";

  const getHistoryStatusStyle = (status) => {
    const value = normalizeVehicleTypeText(status);

    if (value.includes("DANG GUI") || value.includes("ACTIVE")) {
      return "border-blue-100 bg-blue-50 text-blue-700";
    }

    if (value.includes("HOAN TAT") || value.includes("COMPLETED")) {
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    }

    if (value.includes("HUY") || value.includes("CANCEL")) {
      return "border-rose-100 bg-rose-50 text-rose-700";
    }

    return "border-slate-200 bg-slate-100 text-slate-600";
  };

  const getHistoryPaymentStyle = (paymentStatus) => {
    const value = normalizeVehicleTypeText(paymentStatus);

    if (value.includes("DA THANH TOAN") || value.includes("PAID")) {
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    }

    if (value.includes("CHO THANH TOAN") || value.includes("PENDING")) {
      return "border-amber-100 bg-amber-50 text-amber-700";
    }

    if (value.includes("THAT BAI") || value.includes("FAILED")) {
      return "border-rose-100 bg-rose-50 text-rose-700";
    }

    return "border-slate-200 bg-slate-100 text-slate-600";
  };

  const completedHistoryCount = history.filter((item) =>
    normalizeVehicleTypeText(item.status).includes("HOAN TAT"),
  ).length;

  return (
    <div
      ref={containerRef}
      className="driver-mobile-shell min-h-screen overflow-x-hidden bg-[#f8fafc] text-slate-900 flex font-sans"
    >
      <DriverMobileInlineCSS />

      {/* Sidebar - Đồng bộ 100% với DriverMapping.jsx */}
      <DriverSosBanner />
      <aside
        className={`aside-panel fixed left-0 top-0 bottom-0 z-50 hidden h-screen flex-col bg-slate-900 text-white shadow-xl transition-all duration-300 md:flex ${collapsed ? "w-20" : "w-72"
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
            className={`nav-link-item w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${activeTab === "dashboard"
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
            className={`nav-link-item w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${activeTab === "session"
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
            className={`nav-link-item w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${activeTab === "reservations"
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
            className={`nav-link-item w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${activeTab === "history"
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
            className={`nav-link-item w-full flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${activeTab === "profile"
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
            className={`mx-4 mb-4 rounded-2xl border p-4 shadow-lg ${emergencyStatus.active
              ? "border-rose-500/60 bg-rose-950/70 shadow-rose-950/30"
              : "border-slate-800 bg-slate-950/70"
              }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${emergencyStatus.loading
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
              className={`mt-2 text-xs font-black ${emergencyStatus.active ? "text-rose-200" : "text-emerald-300"
                }`}
            >
              {emergencyStatus.loading
                ? "Đang kiểm tra..."
                : emergencyStatus.active
                  ? "🚨 SOS / Khẩn cấp"
                  : "Bình thường"}
            </p>

            <p
              className={`mt-1 line-clamp-3 text-[10px] font-semibold leading-4 ${emergencyStatus.active ? "text-rose-100" : "text-slate-500"
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
        className={`main-content-area flex-1 min-h-screen flex flex-col pb-24 transition-all duration-300 md:pb-0 ${collapsed ? "md:ml-20" : "md:ml-72"
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
                className={`relative rounded-full p-2.5 transition-colors ${emergencyStatus.active
                  ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                  : "hover:bg-slate-100/80"
                  }`}
              >
                <IconBell />
                <span
                  className={`absolute right-2 top-2 h-2.5 w-2.5 rounded-full ring-2 ring-white ${emergencyStatus.loading
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
                  icon="🅿️"
                  desc="Cập nhật tự động"
                />
                <StatItem
                  title="Tổng giờ đỗ"
                  value={stats.totalHours}
                  icon="⏱️"
                  desc="Tích lũy từ đầu năm"
                />
                <StatItem
                  title="Tổng chi tiêu"
                  value={stats.totalCost}
                  icon="💳"
                  desc="Đã thanh toán online"
                />
                <StatItem
                  title="Sức chứa trống"
                  value={stats.availableSlots}
                  icon="🚦"
                  desc="Đề xuất zone tối ưu"
                />
              </div>

              <DashboardPricingBoard
                pricingPlans={pricingPlans}
                pricingConfig={pricingConfig}
              />

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
                          <p className="text-sm font-bold text-emerald-600 mt-1">
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
                        history.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center bg-slate-50 border border-slate-200 p-4 rounded-2xl"
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
                              {currentSession.identifierLabel || "Biển số"}:
                            </span>
                            <span className="font-mono font-black text-slate-800">
                              {currentSession.identifierValue || "--"}
                            </span>
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
                  <h3 className="text-2xl font-black text-blue-600 tracking-tight">
                    Phiên gửi xe & Vé của bạn
                  </h3>
                </div>

                <button
                  onClick={() => setActiveTab("dashboard")}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all animate-pulse"
                >
                  ← Bảng điều khiển chính
                </button>
              </div>

              <div className="grid grid-cols-1 gap-8 items-start">
                <div className="action-panel-item">
                  {activeSessions.length > 0 ? (
                    <div className="space-y-4">
                      <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50/60 p-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-600">
                              Active sessions
                            </p>
                            <h4 className="mt-1 text-xl font-black text-slate-950">
                              Danh sách xe đang gửi
                            </h4>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              Hiện có {activeSessions.length} phiên gửi xe đang hoạt động.
                            </p>
                          </div>

                          <span className="w-fit rounded-full border border-emerald-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                            Đang gửi
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {activeSessions.map((session) => (
                          <ActiveSessionCard
                            key={session.id}
                            session={session}
                            elapsedText={formatSessionTimer(session)}
                            feeText={getActiveSessionFeeText(session)}
                            onViewDetail={() => setSessionTicketModal(session)}
                          />
                        ))}
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
                        Bạn chưa có xe nào đỗ trong hệ thống bãi đỗ. Hãy quét QR ở trạm kiểm
                        soát hoặc đăng ký trước.
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


              </div>
            </div>
          )}

          {activeTab === "reservations" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-2xl font-black text-blue-600 tracking-tight">
                    Đặt chỗ của tôi
                  </h3>
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

              <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/70">
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                      My reservations
                    </p>

                    <h4 className="mt-1 text-xl font-black text-slate-950">
                      Danh sách đặt chỗ
                    </h4>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      Theo dõi vé đặt chỗ còn hiệu lực, đã hoàn tất hoặc đã hủy.
                    </p>
                  </div>

                  <div className="relative w-full lg:max-w-md">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                      🔍
                    </span>

                    <input
                      value={reservationSearchTerm}
                      onChange={(e) => {
                        setReservationSearchTerm(e.target.value);
                        setShowAllReservations(false);
                      }}
                      placeholder="Tìm mã đặt chỗ, biển số/mã xe, khu vực, trạng thái..."
                      className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-xs font-bold text-slate-700 outline-none shadow-sm transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
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
                  <>
                    <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
                      {visibleReservations.map((reservation) => {
                        const canCancel = isReservationCancelable(
                          reservation.status,
                        );

                        return (
                          <div
                            key={[
                              reservation.reservationId || reservation.id || reservation.reservationCode || "reservation",
                              reservation.licensePlate || "",
                              reservation.createdAt || reservation.reservedFrom || "",
                            ].join("-")}
                            className="group rounded-[1.75rem] border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50 p-5 text-xs shadow-sm shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/60"
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
                                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-widest ${getReservationStatusStyle(reservation.status)}`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
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
                                className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5 hover:from-indigo-700 hover:to-blue-700 active:scale-[0.98]"
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
                                <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400 shadow-sm">
                                  Không thể hủy
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {hasMoreReservations && (
                      <div className="mt-5 flex justify-center border-t border-slate-100 pt-5">
                        <button
                          type="button"
                          onClick={() =>
                            setShowAllReservations((prev) => !prev)
                          }
                          className="inline-flex items-center justify-center rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-[11px] font-bold text-blue-600 transition-all hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-sm"
                        >
                          {showAllReservations ? "Thu gọn" : "Xem thêm"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-blue-600 tracking-tight">
                    Lịch sử gửi xe của bạn
                  </h3>
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

              <div className="action-panel-item overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
                <div className="border-b border-slate-100 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Parking history
                      </span>

                      <h4 className="mt-3 text-xl font-black tracking-tight">
                        Nhật ký gửi xe
                      </h4>

                      <p className="mt-1 max-w-2xl text-xs font-medium leading-5 text-slate-300">
                        Theo dõi từng lượt vào bãi, ra bãi, vị trí gửi xe, trạng thái thanh toán
                        và chi phí phát sinh.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[560px]">
                      <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          Tổng lượt
                        </p>
                        <p className="mt-1 text-lg font-black text-white">
                          {history.length}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          Hiển thị
                        </p>
                        <p className="mt-1 text-lg font-black text-white">
                          {filteredHistory.length}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          Hoàn tất
                        </p>
                        <p className="mt-1 text-lg font-black text-emerald-300">
                          {completedHistoryCount}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                          Tổng phí
                        </p>
                        <p className="mt-1 text-lg font-black text-indigo-200">
                          {stats.totalCost}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-white/10 p-3 shadow-inner shadow-black/10">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                      <div className="relative flex-1">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                          🔍
                        </span>

                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setShowAllHistory(false);
                          }}
                          placeholder="Tìm mã phiên, mã xe đạp, biển số, khu, tầng..."
                          className="h-11 w-full rounded-2xl border border-white/20 bg-white/95 pl-11 pr-11 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-400/20"
                        />

                        {searchTerm && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchTerm("");
                              setShowAllHistory(false);
                            }}
                            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: "ALL", label: "Tất cả" },
                          { value: "ACTIVE", label: "Đang gửi" },
                          { value: "COMPLETED", label: "Hoàn tất" },
                          { value: "CANCELLED", label: "Đã hủy" },
                          { value: "PENDING_PAYMENT", label: "Chờ thanh toán" },
                        ].map((filter) => (
                          <button
                            key={filter.value}
                            type="button"
                            onClick={() => {
                              setHistoryQuickFilter(filter.value);
                              setShowAllHistory(false);
                            }}
                            className={`rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-wider transition ${historyQuickFilter === filter.value
                              ? "border-blue-300 bg-blue-500 text-white shadow-md shadow-blue-950/20"
                              : "border-white/10 bg-white/10 text-slate-200 hover:bg-white/20"
                              }`}
                          >
                            {filter.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3 text-[11px] font-bold text-slate-300 sm:flex-row sm:items-center sm:justify-between">
                      <span>
                        Đang hiển thị{" "}
                        <span className="font-black text-white">{visibleHistory.length}</span>
                        /{filteredHistory.length} kết quả lọc · Tổng {history.length} lượt
                      </span>

                      {isHistorySearchActive && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm("");
                            setHistoryQuickFilter("ALL");
                            setShowAllHistory(false);
                          }}
                          className="w-fit rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white transition hover:bg-white/20"
                        >
                          Xóa bộ lọc
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {filteredHistory.length === 0 ? (
                  <div className="bg-slate-50 px-6 py-16 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white text-xl">
                      🅿️
                    </div>

                    <h4 className="mt-4 text-sm font-black text-slate-900">
                      Không tìm thấy dữ liệu đỗ xe phù hợp
                    </h4>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      Thử đổi từ khóa tìm kiếm hoặc kiểm tra lại biển số/mã phiên.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 bg-slate-50 p-4 xl:grid-cols-2">
                      {visibleHistory.map((item) => (
                        <article
                          key={item.id}
                          className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-lg hover:shadow-slate-200/70"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Mã phiên
                              </p>

                              <p className="mt-1 font-mono text-base font-black text-slate-950">
                                {item.sessionCode}
                              </p>

                              <p className="mt-1 text-[11px] font-semibold text-slate-500">
                                Tạo lúc {item.registeredAt}
                              </p>
                            </div>

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${getHistoryStatusStyle(
                                item.status,
                              )}`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {item.status}
                            </span>
                          </div>

                          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">
                                {item.identifierLabel}
                              </p>

                              <p className="mt-1 font-mono text-sm font-black text-indigo-800">
                                {item.identifierValue}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                Vị trí
                              </p>

                              <p className="mt-1 font-mono text-sm font-black text-slate-900">
                                {item.floorName}-{item.zoneCode}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">
                                Chi phí
                              </p>

                              <p className="mt-1 text-sm font-black text-emerald-800">
                                {item.cost}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                  Timeline
                                </p>

                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">
                                  {item.durationText}
                                </span>
                              </div>

                              <div className="mt-3 space-y-2 text-xs font-semibold text-slate-600">
                                <div className="flex justify-between gap-3">
                                  <span className="text-slate-400">Vào bãi</span>
                                  <span className="text-right font-black text-slate-800">
                                    {item.date}
                                  </span>
                                </div>

                                <div className="flex justify-between gap-3">
                                  <span className="text-slate-400">Ra bãi</span>
                                  <span className="text-right font-black text-slate-800">
                                    {item.exitDate}
                                  </span>
                                </div>

                                <div className="flex justify-between gap-3">
                                  <span className="text-slate-400">Vào zone</span>
                                  <span className="text-right font-black text-slate-800">
                                    {item.zoneEntryDate}
                                  </span>
                                </div>

                                <div className="flex justify-between gap-3">
                                  <span className="text-slate-400">Ra zone</span>
                                  <span className="text-right font-black text-slate-800">
                                    {item.zoneExitDate}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-4">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                  Thông tin xe
                                </p>

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${getHistoryPaymentStyle(
                                    item.paymentStatus,
                                  )}`}
                                >
                                  {item.paymentStatus}
                                </span>
                              </div>

                              <div className="mt-3 space-y-2 text-xs font-semibold text-slate-600">
                                <div className="flex justify-between gap-3">
                                  <span className="text-slate-400">Loại xe</span>
                                  <span className="text-right font-black text-slate-800">
                                    {item.vehicle}
                                  </span>
                                </div>

                                <div className="flex justify-between gap-3">
                                  <span className="text-slate-400">Loại khách</span>
                                  <span className="text-right font-black text-slate-800">
                                    {item.driverType}
                                  </span>
                                </div>

                                <div className="flex justify-between gap-3">
                                  <span className="text-slate-400">Hình thức</span>
                                  <span className="text-right font-black text-slate-800">
                                    {item.passType}
                                  </span>
                                </div>

                                <div className="flex justify-between gap-3">
                                  <span className="text-slate-400">Khu</span>
                                  <span className="text-right font-black text-slate-800">
                                    {item.zoneName}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="grid grid-cols-1 gap-3 text-[11px] font-semibold text-slate-500 sm:grid-cols-2">
                              <p>
                                <span className="font-black text-slate-700">Tòa nhà:</span>{" "}
                                {item.building}
                              </p>

                              <p>
                                <span className="font-black text-slate-700">Cổng vào:</span>{" "}
                                {item.entryMainGateName}
                              </p>

                              <p>
                                <span className="font-black text-slate-700">Cổng ra:</span>{" "}
                                {item.exitMainGateName}
                              </p>

                              <p>
                                <span className="font-black text-slate-700">Ghi chú:</span>{" "}
                                {item.notes}
                              </p>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>

                    {hasMoreHistory && (
                      <div className="flex justify-center border-t border-slate-100 bg-slate-50 px-4 pb-6 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAllHistory((prev) => !prev)}
                          className="inline-flex items-center justify-center rounded-xl border border-blue-100 bg-blue-50 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-blue-600 transition-all hover:-translate-y-0.5 hover:bg-blue-100 hover:shadow-sm"
                        >
                          {showAllHistory
                            ? "Thu gọn"
                            : `Xem thêm ${filteredHistory.length - HISTORY_PREVIEW_LIMIT} lượt`}
                        </button>
                      </div>
                    )}
                  </>
                )}
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

      {
        qrModalData && (
          <DriverQrModal
            data={qrModalData}
            userName={user.name}
            onClose={() => setQrModalData(null)}
          />
        )
      }

      {sessionTicketModal && (
        <ActiveSessionTicketModal
          session={sessionTicketModal}
          userName={user.name}
          elapsedText={formatSessionTimer(sessionTicketModal)}
          onClose={() => setSessionTicketModal(null)}
        />
      )}

    </div >
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
    : formatLicensePlate(booking.licensePlate, vehicleTypeName);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-left">
      <div className="rounded-[1.5rem] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-5 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-600">
          Reservation Ticket
        </p>

        <h3 className="mt-2 text-xl font-black text-slate-950">Vé giữ chỗ</h3>

        <p className="mt-1 font-mono text-xs font-black text-slate-500">
          {booking.reservationCode || booking.bookingCode || "--"}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
        <InfoRow label="Chủ xe" value={userName || "--"} tone="primary" />
        <InfoRow label="Loại xe" value={vehicleTypeName || "--"} />
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

function InfoRow({ label, value, mono = false, tone = "default" }) {
  const toneClass =
    tone === "primary"
      ? "border-indigo-100 bg-indigo-50/70 text-indigo-800"
      : tone === "success"
        ? "border-emerald-100 bg-emerald-50 text-emerald-800"
        : tone === "warning"
          ? "border-amber-100 bg-amber-50 text-amber-800"
          : "border-slate-200 bg-white text-slate-800";

  const labelClass =
    tone === "primary"
      ? "text-indigo-500"
      : tone === "success"
        ? "text-emerald-500"
        : tone === "warning"
          ? "text-amber-500"
          : "text-slate-500";

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${toneClass}`}
    >
      <p className={`text-[9px] font-black uppercase tracking-widest ${labelClass}`}>
        {label}
      </p>

      <p className={`mt-1 text-xs font-black ${mono ? "font-mono" : ""}`}>
        {value || "--"}
      </p>
    </div>
  );
}

function ActiveSessionCard({ session, elapsedText, feeText, onViewDetail }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-gradient-to-br from-white via-white to-emerald-50/40 p-6 shadow-lg shadow-slate-200/70">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-100/60 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>

            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">
              Trạng thái gửi thực tế
            </p>
          </div>

          <h4 className="mt-2 font-mono text-lg font-black text-slate-950">
            {session.sessionCode || "--"}
          </h4>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            {session.buildingName || "Smart Parking"} ·{" "}
            {session.floorName || session.floor}-{session.zoneCode}
          </p>
        </div>

        <span className="w-fit rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-700">
          {session.status || "Đang gửi"}
        </span>
      </div>

      <div className="relative z-10 mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoRow
          label={session.identifierLabel || "Biển số"}
          value={session.identifierValue || "--"}
          mono
        />

        <InfoRow label="Loại xe" value={session.vehicle || "--"} />

        <InfoRow
          label="Vị trí đỗ"
          value={`${session.floor || "--"} - ${session.zoneCode || "--"}`}
          mono
        />

        <InfoRow label="Thời điểm vào" value={session.startTime || "--"} />

        <InfoRow label="Thời gian gửi" value={elapsedText} mono />

        <InfoRow label="Chi phí tạm tính" value={feeText} mono />
      </div>

      <button
        type="button"
        onClick={onViewDetail}
        className="relative z-10 mt-5 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5 hover:from-indigo-700 hover:to-blue-700 hover:shadow-blue-500/35 active:scale-[0.98]"
      >
        Xem chi tiết vé
      </button>
    </div>
  );
}

function ActiveSessionTicketModal({ session, userName, elapsedText, onClose }) {
  if (!session) return null;

  const normalizeTicketText = (value) => {
    return String(value || "")
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/Đ/g, "D")
      .replace(/đ/g, "D")
      .trim();
  };

  const isPassBased = (() => {
    const passType = normalizeTicketText(session?.passType);

    return (
      passType.includes("MONTHLY") ||
      passType.includes("QUARTERLY") ||
      passType.includes("YEARLY") ||
      passType.includes("THANG") ||
      passType.includes("QUY") ||
      passType.includes("NAM")
    );
  })();

  const getTicketPassTypeDisplay = () => {
    const value = normalizeTicketText(session?.passType);

    if (value.includes("MONTHLY") || value.includes("THANG")) {
      return "Gói tháng";
    }

    if (value.includes("QUARTERLY") || value.includes("QUY")) {
      return "Gói quý";
    }

    if (value.includes("YEARLY") || value.includes("NAM")) {
      return "Gói năm";
    }

    return session?.passType || "Vé lượt";
  };

  const getTicketPaymentText = () => {
    if (isPassBased) {
      return "Đã thanh toán bằng gói";
    }

    return session?.paymentStatus || "Chưa có thanh toán";
  };

  const totalFee = isPassBased
    ? 0
    : Number(session.estimatedFee || session.totalFee || 0);

  const buildSessionQrValue = () => {
    return JSON.stringify({
      type: "SMART_PARKING_SESSION_TICKET",
      sessionCode: session.sessionCode || "",
      ownerName: userName || "",
      identifierLabel: session.identifierLabel || "Biển số",
      identifierValue: session.identifierValue || "",
      vehicleType: session.vehicle || "",
      ticketType: getTicketPassTypeDisplay(),
      location: `${session.floor || "--"}-${session.zoneCode || "--"}`,
      checkInTime: session.startTime || "",
      elapsedTime: elapsedText || "",
      paymentStatus: getTicketPaymentText(),
      estimatedFee: isPassBased ? 0 : totalFee,
      status: session.status || "Đang gửi",
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-[2px]">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[1.75rem] bg-white shadow-2xl">
        <div className="h-3 bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-7 text-3xl font-light leading-none text-slate-400 transition hover:text-slate-700"
        >
          ×
        </button>

        <div className="px-8 pb-8 pt-7">
          <div className="text-center">
            <h3 className="text-lg font-black uppercase tracking-[0.12em] text-slate-800">
              Smart Session Ticket
            </h3>

            <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
              {session.status || "Đang gửi"}
            </p>
          </div>

          <div className="my-5 border-t border-dashed border-slate-200" />

          <div className="space-y-3 text-sm">
            <TicketLine
              label="Mã phiên gửi:"
              value={`#${session.sessionCode || "--"}`}
              mono
            />

            <TicketLine
              label={`${session.identifierLabel || "Biển số"}:`}
              value={session.identifierValue || "--"}
              mono
              highlight
            />

            <TicketLine label="Loại xe:" value={session.vehicle || "--"} />

            <TicketLine label="Loại vé:" value={getTicketPassTypeDisplay()} />

            <TicketLine
              label="Vị trí đỗ:"
              value={`${session.floor || "--"}-${session.zoneCode || "--"}`}
              mono
            />

            <TicketLine
              label="Thời gian vào:"
              value={session.startTime || "--"}
            />

            <TicketLine label="Thời gian gửi:" value={elapsedText || "--"} />

            <TicketLine label="Hình thức:" value={getTicketPaymentText()} />
          </div>

          <div className="my-5 border-t border-dashed border-slate-200" />

          {/* QR vé xe */}
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50 px-4 py-5 text-center shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-500">
              Mã QR vé xe
            </p>

            <div className="mt-3 flex justify-center">
              <div className="rounded-2xl border border-indigo-100 bg-white p-3 shadow-md shadow-indigo-100/70">
                <QRCodeCanvas
                  value={buildSessionQrValue()}
                  size={140}
                  level="M"
                  includeMargin={true}
                />
              </div>
            </div>

            <p className="mt-3 font-mono text-xs font-black text-indigo-700">
              {session.sessionCode || "--"}
            </p>

            <p className="mt-1 text-[11px] font-semibold text-slate-500">
              Quét mã để tra cứu nhanh thông tin vé
            </p>
          </div>

          <div className="my-5 border-t border-dashed border-slate-200" />

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">
              Tổng tạm tính:
            </p>

            <p className="mt-1 text-2xl font-black text-slate-900">
              {isPassBased ? "0đ" : `${totalFee.toLocaleString("vi-VN")}đ`}
            </p>

            {isPassBased && (
              <p className="mt-1 text-xs font-bold text-emerald-600">
                Phí gửi xe đã được bao gồm trong gói đăng ký.
              </p>
            )}
          </div>

          <div className="mt-7">
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:from-indigo-700 hover:to-blue-700"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TicketLine({ label, value, mono = false, highlight = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-bold text-slate-500">{label}</span>

      <span
        className={`text-right text-sm font-black text-slate-800 ${mono ? "font-mono" : ""
          } ${highlight
            ? "rounded-lg bg-slate-100 px-3 py-1 text-slate-900"
            : ""
          }`}
      >
        {value || "--"}
      </span>
    </div>
  );
}

function DriverQrModal({ data, userName, onClose }) {
  const isSession = data.type === "SESSION";
  const item = isSession ? data.session : data.reservation;

  const code = isSession
    ? item.sessionCode
    : item.reservationCode || item.bookingCode;

  const vehicleTypeName =
    item.vehicleTypeName || item.vehicleType || item.vehicle || "--";

  const identifierLabel = getVehicleIdentifierLabel(vehicleTypeName);

  const identifierValue = isBicycleVehicleTypeName(vehicleTypeName)
    ? item.licensePlate || "--"
    : formatLicensePlate(item.licensePlate, vehicleTypeName);

  const qrPayload = JSON.stringify(
    isSession
      ? {
        type: "SMART_PARKING_SESSION",
        sessionCode: item.sessionCode || "",
        driverName: userName || "",
        identifierLabel,
        identifierValue,
        licensePlate: item.licensePlate || "",
        vehicleType: vehicleTypeName,
        zoneCode: item.zoneCode || "",
        floor: item.floorName || item.floor || "",
        status: item.status || "",
      }
      : {
        type: "SMART_PARKING_RESERVATION",
        reservationCode: code || "",
        driverName: userName || "",
        identifierLabel,
        identifierValue,
        licensePlate: item.licensePlate || "",
        vehicleType: vehicleTypeName,
        zoneCode: item.zoneCode || "",
        zoneName: item.zoneName || "",
        floor: item.floorName || item.floor || "",
        reservedFrom: item.reservedFrom || "",
        reservedTo: item.reservedTo || "",
        status: item.status || "",
      },
  );
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-md">
      <div className="w-full max-w-lg max-h-[90vh] overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl shadow-slate-950/30">
        <div className="flex items-start justify-between bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-950 px-6 py-5 text-white">
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
            className="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-black text-white shadow-sm transition hover:bg-white/25"
          >
            Đóng
          </button>
        </div>

        <div className="max-h-[calc(90vh-112px)] overflow-y-auto bg-gradient-to-b from-white via-slate-50 to-white p-7 text-center">
          {isSession ? (
            <>
              <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-3xl border border-slate-200 bg-white p-4 shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrPayload)}`}
                  alt="Driver QR Code"
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
                <InfoRow label="Tài xế" value={userName} />
                <InfoRow
                  label={identifierLabel}
                  value={
                    isBicycleVehicleTypeName(vehicleTypeName)
                      ? item.licensePlate || "--"
                      : formatLicensePlate(
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
                <InfoRow label="Trạng thái" value={item.status} />
              </div>

              <p className="mt-5 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs font-semibold leading-5 text-indigo-700">
                Xuất trình mã QR phiên gửi xe cho nhân viên tại cổng khi cần hỗ
                trợ.
              </p>
            </>
          ) : (
            <>
              <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-white via-slate-50 to-indigo-50/50 p-5 text-left shadow-lg shadow-indigo-100/40">
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-600">
                    Reservation Ticket
                  </p>
                  <h3 className="mt-2 text-lg font-black text-slate-900">
                    Vé giữ chỗ
                  </h3>
                  <p className="mt-1 font-mono text-xs font-black text-indigo-500">
                    {code || "--"}
                  </p>
                </div>

                {/* QR vé đặt chỗ */}
                <div className="mt-5 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-blue-50 px-4 py-5 text-center shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-500">
                    Mã QR vé đặt chỗ
                  </p>

                  <div className="mt-3 flex justify-center">
                    <div className="rounded-2xl border border-indigo-100 bg-white p-3 shadow-md shadow-indigo-100/70">
                      <QRCodeCanvas
                        value={qrPayload}
                        size={150}
                        level="M"
                        includeMargin={true}
                      />
                    </div>
                  </div>

                  <p className="mt-3 font-mono text-xs font-black text-indigo-700">
                    {code || "--"}
                  </p>

                  <p className="mt-1 text-[11px] font-semibold text-slate-500">
                    Quét mã để xem nhanh thông tin đặt chỗ
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                  <InfoRow label="Chủ xe" value={userName || "--"} tone="primary" />
                  <InfoRow label="Loại xe" value={vehicleTypeName || "--"} />
                  <InfoRow
                    label={identifierLabel}
                    value={identifierValue}
                    mono
                    tone="primary"
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
                  <InfoRow label="Trạng thái" value={item.status || "--"} tone="warning" />
                </div>

                <p className="mt-5 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 text-center text-xs font-bold leading-5 text-indigo-700 shadow-sm">
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
      className={`nav-link-item flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${active
        ? "bg-slate-800 text-blue-400 border border-slate-700 shadow-inner"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
        }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </Link>
  );
}

function DashboardPricingBoard({
  pricingPlans = [],
  pricingConfig = { buildings: [], vehicleTypes: [] },
}) {
  const getRawVehicleTypeName = (plan) => {
    return (
      plan.vehicleType?.name ||
      plan.vehicleTypeName ||
      pricingConfig.vehicleTypes.find((v) => v.id === plan.vehicleTypeId)
        ?.name ||
      "Phương tiện"
    );
  };

  const getDisplayVehicleTypeName = (name) => {
    const text = normalizeVehicleTypeText(name);

    if (text.includes("XE DAP") || text.includes("BICYCLE")) return "Xe đạp";
    if (text.includes("XE MAY") || text.includes("MOTORBIKE")) return "Xe máy";
    if (text.includes("O TO") || text.includes("OTO") || text.includes("CAR")) {
      return "Ô tô";
    }
    if (text.includes("XE TAI") || text.includes("TRUCK")) return "Xe tải";

    return name || "Phương tiện";
  };

  const getBuildingName = (plan) => {
    return (
      plan.building?.name ||
      plan.building?.buildingName ||
      plan.buildingName ||
      pricingConfig.buildings.find((b) => b.id === plan.buildingId)?.name ||
      pricingConfig.buildings.find((b) => b.id === plan.buildingId)
        ?.buildingName ||
      "Smart Parking"
    );
  };

  const getPriceValue = (plan) => {
    return Number(plan.pricePerUnit ?? plan.price ?? plan.amount ?? 0);
  };

  const formatPrice = (price) => {
    return `${Number(price || 0).toLocaleString("vi-VN")}đ`;
  };

  const getPricingTypeLabel = (type) => {
    const value = String(type || "").toUpperCase();

    if (value === "HOURLY") return "Theo giờ";
    if (value === "DAILY") return "Theo ngày";
    if (value === "MONTHLY") return "Theo tháng";
    if (value === "QUARTERLY") return "Theo quý";
    if (value === "YEARLY") return "Theo năm";

    return value || "Không rõ";
  };

  const getPricingUnitLabel = (type) => {
    const value = String(type || "").toUpperCase();

    if (value === "HOURLY") return "/ giờ";
    if (value === "DAILY") return "/ ngày";
    if (value === "MONTHLY") return "/ tháng";
    if (value === "QUARTERLY") return "/ quý";
    if (value === "YEARLY") return "/ năm";

    return "";
  };

  const getPricingOrder = (type) => {
    const value = String(type || "").toUpperCase();

    if (value === "HOURLY") return 1;
    if (value === "DAILY") return 2;
    if (value === "MONTHLY") return 3;
    if (value === "QUARTERLY") return 4;
    if (value === "YEARLY") return 5;

    return 99;
  };

  const getVehicleIcon = (vehicleTypeName) => {
    const text = normalizeVehicleTypeText(vehicleTypeName);

    if (text.includes("XE DAP")) return "🚲";
    if (text.includes("XE MAY")) return "🛵";
    if (text.includes("O TO")) return "🚗";
    if (text.includes("XE TAI")) return "🚚";

    return "🅿️";
  };

  const getPricingBadgeStyle = (type) => {
    const value = String(type || "").toUpperCase();

    if (value === "HOURLY") {
      return "border-blue-100 bg-blue-50 text-blue-700";
    }

    if (value === "DAILY") {
      return "border-emerald-100 bg-emerald-50 text-emerald-700";
    }

    if (value === "MONTHLY") {
      return "border-indigo-100 bg-indigo-50 text-indigo-700";
    }

    if (value === "QUARTERLY" || value === "YEARLY") {
      return "border-amber-100 bg-amber-50 text-amber-700";
    }

    return "border-slate-200 bg-slate-50 text-slate-600";
  };

  const normalizedPlans = pricingPlans
    .map((plan, index) => {
      const vehicleTypeName = getDisplayVehicleTypeName(
        getRawVehicleTypeName(plan),
      );

      return {
        ...plan,
        _key:
          plan.id ||
          `${plan.vehicleTypeId || vehicleTypeName}-${plan.pricingType}-${index}`,
        _vehicleTypeName: vehicleTypeName,
        _vehicleKey: normalizeVehicleTypeText(vehicleTypeName),
        _buildingName: getBuildingName(plan),
        _price: getPriceValue(plan),
        _pricingType: String(plan.pricingType || "").toUpperCase(),
      };
    })
    .sort((a, b) => {
      const vehicleCompare = a._vehicleTypeName.localeCompare(
        b._vehicleTypeName,
        "vi",
      );

      if (vehicleCompare !== 0) return vehicleCompare;

      return getPricingOrder(a._pricingType) - getPricingOrder(b._pricingType);
    });

  const groupedPlans = Object.values(
    normalizedPlans.reduce((groups, plan) => {
      if (!groups[plan._vehicleKey]) {
        groups[plan._vehicleKey] = {
          vehicleTypeName: plan._vehicleTypeName,
          buildingName: plan._buildingName,
          plans: [],
        };
      }

      groups[plan._vehicleKey].plans.push(plan);
      return groups;
    }, {}),
  ).map((group) => ({
    ...group,
    plans: group.plans.sort(
      (a, b) => getPricingOrder(a._pricingType) - getPricingOrder(b._pricingType),
    ),
  }));

  return (
    <div className="action-panel-item overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-sm shadow-slate-200/70">
      <div className="bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="mt-1 text-xl font-black text-slate-950">
              Bảng giá xe
            </h3>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-full border border-indigo-100 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-indigo-600 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {groupedPlans.length} loại xe
          </div>
        </div>

        {groupedPlans.length === 0 ? (
          <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-xl">
              💳
            </div>

            <h4 className="mt-4 text-sm font-black text-slate-900">
              Chưa có bảng giá
            </h4>

            <p className="mt-1 text-xs font-semibold text-slate-400">
              Kiểm tra lại API bảng giá hoặc dữ liệu pricing plan.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {groupedPlans.map((group) => {
              const primaryPlan =
                group.plans.find((plan) => plan._pricingType === "HOURLY") ||
                group.plans.find((plan) => plan._pricingType === "DAILY") ||
                group.plans[0];

              return (
                <div
                  key={group.vehicleTypeName}
                  className="rounded-[1.5rem] border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/70 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {group.vehicleTypeName}
                      </p>

                      <p className="mt-2 text-2xl font-black text-slate-950">
                        {formatPrice(primaryPlan?._price)}
                      </p>

                      <p className="mt-1 text-[11px] font-bold text-slate-400">
                        {getPricingUnitLabel(primaryPlan?._pricingType)}
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-lg">
                      {getVehicleIcon(group.vehicleTypeName)}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {group.plans.map((plan) => (
                      <span
                        key={plan._key}
                        className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${getPricingBadgeStyle(
                          plan._pricingType,
                        )}`}
                      >
                        {getPricingTypeLabel(plan._pricingType)} ·{" "}
                        {formatPrice(plan._price)}
                      </span>
                    ))}
                  </div>

                  <p className="mt-4 truncate border-t border-slate-100 pt-3 text-[10px] font-bold text-slate-400">
                    {group.buildingName}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatItem({ title, value, icon, desc }) {
  return (
    <div className="stat-card-item group rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-lg hover:shadow-slate-200/80">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            {title}
          </p>

          <p className="mt-4 font-mono text-2xl font-black leading-tight text-slate-950">
            {value}
          </p>

          <p className="mt-2 text-[11px] font-semibold text-slate-400">
            {desc}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-base shadow-sm transition group-hover:border-indigo-100 group-hover:bg-indigo-50">
          {icon}
        </div>
      </div>
    </div>
  );
}