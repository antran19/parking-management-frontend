/**
 * DriverMapping — Bản đồ bãi xe cho Driver (Quảng phụ trách)
 *
 * TODO (Quảng): Implement sơ đồ bãi xe visual
 * - Hiển thị zones theo tầng, màu sắc theo trạng thái
 * - Chức năng đặt giữ chỗ (reservation) trực tiếp từ sơ đồ
 * - WebSocket listener: /topic/zones/{buildingId} để cập nhật real-time
 */

import DriverSosBanner from "./DriverSosBanner";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState, useRef } from "react";
import { staffApi } from "../../api/parkingApi";
import gsap from "gsap";
import {
  normalizeLicensePlate as normalizePlateForApi,
  formatLicensePlate,
  getLicensePlateValidationError,
} from "../../utils/licensePlate";


/**
 * Hàm: normalizePlateInput
 * Note Quảng - Driver:
 * Chỉ chuẩn hóa nhẹ input UI khi tài xế nhập biển số mới.
 * Không dùng hàm này để validate.
 * Validate chính dùng getLicensePlateValidationError() từ utils/licensePlate.js
 * để đồng bộ với Staff check-in.
 */
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

const normalizeVehicleTypeId = (value) => String(value || "");
const isBicycleZone = (zone) => zone?.type === "bicycle";
// Sắp xếp các tầng theo thứ tự logic từ sâu nhất dưới hầm lên trên cao (B2, B1, G, 1, 2,...)
export const getFloorWeight = (key) => {
  if (key === "B2") return -2;
  if (key === "B1") return -1;
  if (key === "G") return 0;
  const num = parseInt(key.replace(/[^\d-]/g, ""));
  if (!isNaN(num)) return num;
  if (key.startsWith("T")) {
    const tNum = parseInt(key.substring(1));
    if (!isNaN(tNum)) return tNum;
  }
  return 999;
};

export const getSortedFloorKeys = (floorsObj) => {
  return Object.keys(floorsObj || {}).sort(
    (a, b) => getFloorWeight(a) - getFloorWeight(b),
  );
};

const DRIVER_RESERVATION_HOLD_MINUTES = 60;

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
  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-300 bg-white font-mono font-bold text-slate-800 text-[9px] tracking-wide shadow-sm scale-95 origin-center">
    {formatLicensePlate(plate, vehicleTypeName)}
  </span>
);

const emptyFloors = {};

/**
 * Hàm: getVehicleLabel
 * Note Quảng - Driver:
 * Map loại zone nội bộ sang tên loại xe tiếng Việt.
 * Tên này được truyền vào getLicensePlateValidationError()
 * nên phải đúng với loại xe Staff dùng khi check-in.
 */
function getVehicleLabel(type) {
  if (type === "bicycle") return "Xe đạp";
  if (type === "ebike") return "Xe đạp điện";
  if (type === "motorbike") return "Xe máy";
  if (type === "truck") return "Xe tải";
  if (type === "car") return "Ô tô";
  return "Ô tô";
}

// Hàm: toSafeNumber
// Note: Chuẩn hóa số zone từ backend, tránh NaN khi capacity/currentCount/reservedCount là null/string.
function toSafeNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getZoneAvailability(zone) {
  const capacity = toSafeNumber(zone?.capacity);
  const currentCount = toSafeNumber(zone?.currentCount);
  const reservedCount = toSafeNumber(zone?.reservedCount);

  return Math.max(capacity - currentCount - reservedCount, 0);
}

// Hàm: getZoneAvailability
// Fix: tránh phép trừ với null/undefined/string.

// Hàm: getZoneUsagePercent
// Fix: tránh chia cho 0, tránh NaN, tránh Infinity.

function getZoneUsagePercent(zone) {
  const capacity = toSafeNumber(zone?.capacity);

  if (capacity <= 0) {
    return 0;
  }

  const currentCount = toSafeNumber(zone?.currentCount);

  return Math.min(
    100,
    Math.max(0, Math.round((currentCount / capacity) * 100)),
  );
}

function getZoneStatus(zone) {
  if (["MAINTENANCE", "LOCKED", "CLOSED"].includes(zone.status)) {
    return "closed";
  }

  const available = getZoneAvailability(zone);

  if (available === 0 || zone.status === "FULL") return "full";
  if (
    zone.status === "NEAR_FULL" ||
    available <= Math.ceil(zone.capacity * 0.1)
  ) {
    return "nearFull";
  }

  return "available";
}

function toSpringLocalDateTime(date) {
  const pad = (value) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function toDateTimeLocalInputValue(date) {
  const pad = (value) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getStatusLabel(status) {
  if (status === "closed") return "Đã tạm đóng";
  if (status === "available") return "Còn sức chứa";
  if (status === "nearFull") return "Sắp đầy";
  return "Đã đầy";
}

function getPricingVehicleTypeName(plan) {
  const rawName =
    plan?.vehicleType?.name ||
    plan?.vehicleTypeName ||
    plan?.vehicleType?.vehicleTypeName ||
    "Phương tiện";

  const text = normalizeVehicleTypeText(rawName);

  if (text.includes("XE DAP") || text.includes("BICYCLE")) return "Xe đạp";
  if (text.includes("XE MAY") || text.includes("MOTORBIKE")) return "Xe máy";
  if (text.includes("O TO") || text.includes("OTO") || text.includes("CAR")) {
    return "Ô tô";
  }
  if (text.includes("XE TAI") || text.includes("TRUCK")) return "Xe tải";

  return rawName;
}

function getPricingTypeLabel(type) {
  const value = String(type || "").toUpperCase();

  if (value === "HOURLY") return "Theo giờ";
  if (value === "DAILY") return "Theo ngày";
  if (value === "MONTHLY") return "Theo tháng";
  if (value === "QUARTERLY") return "Theo quý";
  if (value === "YEARLY") return "Theo năm";

  return value || "Không rõ";
}

function getPricingUnitLabel(type) {
  const value = String(type || "").toUpperCase();

  if (value === "HOURLY") return "/ giờ";
  if (value === "DAILY") return "/ ngày";
  if (value === "MONTHLY") return "/ tháng";
  if (value === "QUARTERLY") return "/ quý";
  if (value === "YEARLY") return "/ năm";

  return "";
}

function getPricingOrder(type) {
  const value = String(type || "").toUpperCase();

  if (value === "HOURLY") return 1;
  if (value === "DAILY") return 2;
  if (value === "MONTHLY") return 3;
  if (value === "QUARTERLY") return 4;
  if (value === "YEARLY") return 5;

  return 99;
}

function getPricingPrice(plan) {
  return Number(plan?.pricePerUnit ?? plan?.price ?? plan?.amount ?? 0);
}

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

export default function DriverMapping({ onLogout }) {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [activeFloor, setActiveFloor] = useState("B1");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedZone, setSelectedZone] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [liveTime, setLiveTime] = useState(
    new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  );
  const [liveDate, setLiveDate] = useState("");
  const [floors, setFloors] = useState(emptyFloors);
  const [activeSession, setActiveSession] = useState(null);
  const [pricingPlans, setPricingPlans] = useState([]);
  const [emergencyStatus, setEmergencyStatus] = useState({
    active: false,
    message: "",
  });

  // Quản lý thông tin tài xế dưới dạng state động để đồng bộ real-time
  const [userState, setUserState] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "{}"),
  );
  // NOTE:
  // Biển số phải lấy từ backend vì localStorage.user thường chỉ chứa email/role,
  // không chắc có licensePlates. Nếu vẫn đọc localStorage thì màn đặt chỗ có thể trống biển số.
  const [driverPlates, setDriverPlates] = useState([]);

  const plates = useMemo(() => {
    return driverPlates.length > 0
      ? driverPlates
      : userState.licensePlates || [];
  }, [driverPlates, userState]);

  const currentDriver = useMemo(() => {
    const firstPlate = plates[0];

    return {
      name: userState.fullName || "Tài xế",
      role: "Tài xế",
      currentZoneId: userState.currentZoneId || null,
      plate: getPlateValue(firstPlate),
      vehicleTypeName: getPlateVehicleTypeName(firstPlate),
    };
  }, [userState, plates]);

  const loadEmergencyStatus = async () => {
    try {
      const res = await staffApi.getEmergencyStatus();
      const data = res.data?.data || res.data || {};

      setEmergencyStatus({
        active: Boolean(data.active || data.isActive || data.sosActive),
        message:
          data.message ||
          data.reason ||
          "Hệ thống đang trong trạng thái khẩn cấp.",
      });
    } catch (err) {
      console.warn("Không thể tải trạng thái SOS ở DriverMapping:", err);

      setEmergencyStatus({
        active: false,
        message: "",
      });
    }
  };

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
  }, [activeFloor]);

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setLiveTime(
        new Date().toLocaleTimeString("vi-VN", {
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

    const handleStorageChange = (e) => {
      if (e.key === "user") {
        setUserState(JSON.parse(localStorage.getItem("user") || "{}"));
      }
    };
    window.addEventListener("storage", handleStorageChange);

    const syncInterval = setInterval(() => {
      setUserState(JSON.parse(localStorage.getItem("user") || "{}"));
    }, 10000);

    const fetchDriverPlates = async () => {
      try {
        const res = await staffApi.getDriverPlates();
        const backendPlates = res.data?.data || [];

        setDriverPlates(backendPlates);

        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

        const updatedUser = {
          ...storedUser,
          licensePlates: backendPlates,
        };

        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUserState((prev) => ({
          ...prev,
          licensePlates: backendPlates,
        }));

        return backendPlates;
      } catch (err) {
        console.error("Không thể tải biển số driver:", err);
        return [];
      }
    };

    // ĐỒNG BỘ THỜI GIAN THỰC VỚI SPRING BOOT BACKEND:
    // Tải cấu hình bãi đỗ xe động từ API thực tế
    const fetchRealtimeConfig = async () => {
      try {
        const res = await staffApi.getParkingConfig();
        const config = res.data.data || {};
        const backendZones = config.zones;
        if (backendZones && backendZones.length > 0) {
          const floorMap = {};
          backendZones.forEach((z) => {
            let fName = z.floorName || "T1";
            // Đồng bộ hóa tên tầng: Backend dùng "T1" -> Client hiển thị "1" (Tầng 1)
            if (fName === "T1") {
              fName = "1";
            }

            if (!floorMap[fName]) {
              floorMap[fName] = [];
            }
            const vName = z.vehicleTypeName || "";
            const categoryMap = {
              "Xe đạp": "Khu vực Xe Đạp",
              "Xe máy": "Khu vực Xe Máy",
              "Ô tô": "Khu vực Ô Tô",
              "Xe tải": "Khu vực Xe Tải",
            };
            const typeMap = {
              "Xe đạp": "bicycle",
              "Xe máy": "motorbike",
              "Ô tô": "car",
              "Xe tải": "truck",
            };
            const category = categoryMap[vName] || `Khu vực ${vName}`;
            let group = floorMap[fName].find((g) => g.category === category);
            if (!group) {
              group = { category, zones: [] };
              floorMap[fName].push(group);
            }
            group.zones.push({
              id: z.id,
              zoneCode: `${fName}-ZONE-${z.zoneCode}`,
              name: z.zoneName,
              type: typeMap[vName] || "car",
              vehicleTypeId: z.vehicleTypeId,
              capacity: z.capacity,
              currentCount: z.currentCount,
              reservedCount: z.reservedCount,
              status: z.status,
            });
          });

          setFloors(floorMap);
          const sortedFloorKeys = getSortedFloorKeys(floorMap);
          if (sortedFloorKeys.length > 0 && !floorMap[activeFloor]) {
            setActiveFloor(sortedFloorKeys[0]);
          }
        }
      } catch (err) {
        console.error("Không thể tải cấu hình bãi xe từ backend:", err);
        setFloors({});
      }
    };

    const fetchDriverPricingPlans = async () => {
      try {
        const res = await staffApi.getDriverPricingPlans();
        setPricingPlans(res.data?.data || []);
      } catch (err) {
        console.error("Không thể tải bảng giá driver:", err);
        setPricingPlans([]);
      }
    };

    const fetchActiveSession = async (inputPlates) => {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const registeredPlates = inputPlates || storedUser.licensePlates || [];

      if (registeredPlates.length === 0) {
        setActiveSession(null);
        return;
      }

      const results = await Promise.all(
        registeredPlates.map((plate) =>
          staffApi
            .getActiveSession(getPlateValue(plate))
            .then((res) => res.data?.data)
            .catch(() => null),
        ),
      );

      setActiveSession(results.find(Boolean) || null);
    };
    // NOTE:
    // Khi vào trang map, tải song song:
    // 1. Biển số của driver từ backend
    // 2. Cấu hình tầng/zone từ backend
    // 3. Phiên gửi xe đang active nếu có
    const bootstrapDriverMap = async () => {
      const freshPlates = await fetchDriverPlates();

      await Promise.all([
        fetchRealtimeConfig(),
        fetchActiveSession(freshPlates),
        fetchDriverPricingPlans(),
        loadEmergencyStatus(),
      ]);
    };

    bootstrapDriverMap();

    const configInterval = setInterval(() => {
      const bootstrapDriverMap = async () => {
        const freshPlates = await fetchDriverPlates();

        await Promise.all([
          fetchRealtimeConfig(),
          fetchActiveSession(freshPlates),
          fetchDriverPricingPlans(),
          loadEmergencyStatus(),
        ]);
      };

      bootstrapDriverMap();
    }, 10000);

    return () => {
      clearInterval(clockTimer);
      clearInterval(syncInterval);
      clearInterval(configInterval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const groups = floors[activeFloor] || [];

  const allZones = useMemo(
    () =>
      Object.values(floors)
        .flat()
        .flatMap((group) => group.zones),
    [floors],
  );
  const floorZones = useMemo(
    () => groups.flatMap((group) => group.zones),
    [groups],
  );

  const currentZoneId = useMemo(() => {
    if (!activeSession?.zoneCode) return null;
    const found = allZones.find(
      (zone) =>
        zone.zoneCode.endsWith(`ZONE-${activeSession.zoneCode}`) ||
        zone.zoneCode === activeSession.zoneCode,
    );
    return found?.id || null;
  }, [activeSession, allZones]);

  const currentZone = allZones.find((zone) => zone.id === currentZoneId);
  const pricingRows = useMemo(() => {
    const hourlyRows = (pricingPlans || [])
      .map((plan, index) => {
        const pricingType = String(plan.pricingType || "").toUpperCase();
        const price = getPricingPrice(plan);
        const vehicleTypeName = getPricingVehicleTypeName(plan);

        return {
          key: plan.id || `${plan.vehicleTypeId || vehicleTypeName}-${pricingType}-${index}`,
          vehicleTypeName,
          pricingType,
          pricingTypeLabel: getPricingTypeLabel(pricingType),
          unitLabel: getPricingUnitLabel(pricingType),
          price,
        };
      })
      .filter((row) => row.price > 0 && row.pricingType === "HOURLY")
      .sort((a, b) => a.vehicleTypeName.localeCompare(b.vehicleTypeName, "vi"));

    // Tránh trường hợp cùng một loại xe có nhiều dòng HOURLY bị lặp.
    return Array.from(
      new Map(hourlyRows.map((row) => [row.vehicleTypeName, row])).values(),
    );
  }, [pricingPlans]);

  // Vị trí: phần thống kê tầng trong DriverMapping.
  const counts = {
    available: floorZones.reduce(
      (sum, zone) => sum + getZoneAvailability(zone),
      0,
    ),
    occupied: floorZones.reduce(
      (sum, zone) => sum + toSafeNumber(zone.currentCount),
      0,
    ),
    reserved: floorZones.reduce(
      (sum, zone) => sum + toSafeNumber(zone.reservedCount),
      0,
    ),
  };

  const filterZone = (zone) => {
    const keyword = search.toLowerCase();
    const zoneStatus = getZoneStatus(zone);
    const driverPlateText = String(currentDriver.plate || "").toLowerCase();

    const matchSearch =
      zone.zoneCode.toLowerCase().includes(keyword) ||
      zone.name.toLowerCase().includes(keyword) ||
      driverPlateText.includes(keyword);
    const matchStatus =
      statusFilter === "all" ||
      zoneStatus === statusFilter ||
      (statusFilter === "mine" && zone.id === currentZoneId);
    const matchType = typeFilter === "all" || zone.type === typeFilter;

    return matchSearch && matchStatus && matchType;
  };

  const handleReserveZone = async (zoneId, licensePlate) => {
    // nếu SOS đang hoạt động thì driver không được đặt chỗ
    if (emergencyStatus.active) {
      alert(
        "Hệ thống đang SOS. Tài xế không thể tạo đặt chỗ mới trong lúc báo động. Vui lòng quay về Dashboard và làm theo hướng dẫn an toàn.",
      );
      navigate("/driver/dashboard");
      return;
    }

    const zone = allZones.find((item) => String(item.id) === String(zoneId));
    if (!zone) {
      alert("Không tìm thấy zone để tạo đặt chỗ.");
      return;
    }

    const isBicycle = isBicycleZone(zone);
    const plate = isBicycle ? "" : normalizePlateForApi(licensePlate);

    if (!isBicycle && !plate) {
      alert("Vui lòng chọn hoặc nhập biển số xe");
      return;
    }

    const vehicleTypeName = getVehicleLabel(zone.type);

    const plateError = !isBicycle
      ? getLicensePlateValidationError(plate, vehicleTypeName)
      : null;

    if (plateError) {
      alert(plateError);
      return;
    }

    try {
      if (!isBicycle) {
        const plateAlreadyManaged = plates.some((item) => {
          return normalizePlateForApi(getPlateValue(item)) === plate;
        });

        if (!plateAlreadyManaged) {
          await staffApi
            .addDriverPlate(plate, zone.vehicleTypeId)
            .catch((err) => {
              const message =
                err?.response?.data?.message || err?.message || "";

              if (
                message.includes("đã tồn tại") ||
                message.includes("đã được đăng ký") ||
                message.includes("Biển số đã tồn tại")
              ) {
                return;
              }

              throw err;
            });

          const res = await staffApi.getDriverPlates().catch(() => null);
          const backendPlates = res?.data?.data || [...plates, plate];

          setDriverPlates(backendPlates);

          const updatedUser = {
            ...userState,
            licensePlates: backendPlates,
          };

          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUserState(updatedUser);
        }
      }

      const reservedFrom = new Date();
      const reservedTo = new Date(
        reservedFrom.getTime() + DRIVER_RESERVATION_HOLD_MINUTES * 60 * 1000,
      );

      if (
        Number.isNaN(reservedFrom.getTime()) ||
        Number.isNaN(reservedTo.getTime())
      ) {
        alert("Thời gian giữ chỗ không hợp lệ.");
        return;
      }

      if (reservedTo <= reservedFrom) {
        alert("Thời gian kết thúc phải sau thời gian bắt đầu.");
        return;
      }

      const reservationRes = await staffApi.createReservation({
        zoneId,
        vehicleTypeId: zone.vehicleTypeId,
        licensePlate: isBicycle ? null : plate,
        reservedFrom: toSpringLocalDateTime(reservedFrom),
        reservedTo: toSpringLocalDateTime(reservedTo),
      });

      const savedReservation = reservationRes?.data?.data;
      const vehicleIdentifier = savedReservation?.licensePlate || plate;

      setSelectedZone(null);

      alert(
        isBicycle
          ? `Đã giữ chỗ tại ${zone.zoneCode}. Mã xe đạp của bạn là ${vehicleIdentifier}.`
          : `Đã giữ chỗ tại ${zone.zoneCode} cho xe ${formatLicensePlate(
            plate,
            getVehicleLabel(zone.type),
          )} từ ${reservedFrom.toLocaleString("vi-VN")} đến ${reservedTo.toLocaleString("vi-VN")}`,
      );

      navigate("/driver/dashboard#my-reservations");
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "Không thể giữ chỗ";
      alert(`Giữ chỗ thất bại: ${message}`);
    }
  };

  return (
    <div
      ref={containerRef}
      className="driver-mobile-shell min-h-screen overflow-x-hidden bg-[#f8fafc] text-slate-900 flex font-sans"
    >
      <DriverMobileInlineCSS />

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
          <SideLink
            collapsed={collapsed}
            to="/driver/dashboard"
            icon={<IconDashboard />}
            label="Bảng điều khiển"
          />
          <SideLink
            collapsed={collapsed}
            to="/driver/map"
            icon={<IconMap />}
            label="Sơ đồ bãi xe"
            active
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
          <SideLink
            collapsed={collapsed}
            to="/driver/dashboard#current-session"
            icon={<IconSession />}
            label="Phiên gửi xe"
          />
          <SideLink
            collapsed={collapsed}
            to="/driver/dashboard#my-reservations"
            icon={<IconSession />}
            label="Đặt chỗ của tôi"
          />
          <SideLink
            collapsed={collapsed}
            to="/driver/dashboard#history-table"
            icon={<IconHistory />}
            label="Lịch sử đỗ xe"
          />
          <SideLink
            collapsed={collapsed}
            to="/driver/dashboard#profile-vip"
            icon={<IconProfile />}
            label="Hồ sơ & hội viên"
          />
        </nav>

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

      <main
        className={`main-content-area flex-1 min-h-screen flex flex-col pb-24 transition-all duration-300 md:pb-0 ${collapsed ? "md:ml-20" : "md:ml-72"
          }`}
      >
        <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md sm:px-6 md:h-20 md:px-8 md:py-0">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
              Sơ đồ bãi xe cho tài xế
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
              <button className="relative rounded-full p-2.5 hover:bg-slate-100/80 transition-colors">
                <IconBell />
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              </button>
              <button className="rounded-full p-2.5 hover:bg-slate-100/80 transition-colors">
                <IconSettings />
              </button>
            </div>

            <div className="hidden items-center gap-3.5 border-l border-slate-200 pl-6 sm:flex">
              <div className="text-right">
                <p className="font-semibold text-sm text-slate-900">
                  {currentDriver.name}
                </p>
                <p className="text-xs text-slate-400 font-medium">
                  {currentDriver.role}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 font-bold text-white shadow-md shadow-indigo-500/20">
                A
              </div>
            </div>
          </div>
        </header>

        <section className="driver-content-section flex-1 space-y-5 p-4 pb-28 sm:p-6 md:space-y-6 md:p-8 md:pb-8">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="welcome-banner relative overflow-hidden rounded-[1.5rem] bg-slate-900 p-5 text-white shadow-lg border border-slate-800 sm:p-6 md:rounded-3xl md:p-8 xl:col-span-2">
              <div className="absolute right-0 top-0 -mr-20 -mt-20 h-60 w-60 rounded-full bg-indigo-600/30 blur-3xl" />
              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-4 border border-emerald-500/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  Driver parking map
                </span>
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Xem sức chứa theo zone
                </h1>
                <p className="mt-2.5 text-slate-300 text-sm leading-relaxed max-w-2xl">
                  Tài xế xem tình trạng từng tầng/khu theo sức chứa thực tế,
                  chọn zone phù hợp và dùng QR để vào đúng khu đã được giữ chỗ.
                </p>
              </div>
            </div>

            <div className="stat-card-item rounded-3xl border border-indigo-100 bg-indigo-50 p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">
                Zone xe hiện tại
              </p>
              <h3 className="mt-2 text-2xl font-black text-indigo-900">
                {currentZone?.zoneCode || "--"}
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {currentDriver.plate ? (
                  <LicensePlate
                    plate={currentDriver.plate}
                    vehicleTypeName={currentDriver.vehicleTypeName}
                  />
                ) : (
                  <span className="rounded border border-slate-300 bg-white px-2 py-1 text-[9px] font-bold text-slate-500">
                    Chưa đăng ký
                  </span>
                )}
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-100">
                  {currentZone
                    ? getVehicleLabel(currentZone.type)
                    : "Chưa có phiên"}
                </span>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-indigo-700/80">
                Zone được viền xanh dương là khu xe của bạn đang gửi. Hệ thống
                không gán ô cụ thể, chỉ quản lý sức chứa theo khu/tầng.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="mobile-floor-scroll flex max-w-full overflow-x-auto rounded-2xl bg-slate-200/80 p-1 border border-slate-300/30">
              {getSortedFloorKeys(floors).length > 0 ? (
                getSortedFloorKeys(floors).map((floorKey) => {
                  const labelMap = {
                    B1: "Hầm B1",
                    B2: "Hầm B2",
                    G: "Tầng G",
                    1: "Tầng 1",
                    T1: "Tầng 1",
                    T2: "Tầng 2",
                  };
                  return (
                    <FloorButton
                      key={floorKey}
                      active={activeFloor === floorKey}
                      onClick={() => setActiveFloor(floorKey)}
                      icon={floorKey}
                      label={labelMap[floorKey] || `Tầng ${floorKey}`}
                    />
                  );
                })
              ) : (
                <div className="px-4 py-2 text-sm text-slate-500">
                  Đang tải dữ liệu tầng...
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Badge
                color="green"
                label={`Còn sức chứa: ${counts.available}`}
              />
              <Badge color="red" label={`Đang gửi: ${counts.occupied}`} />
              <Badge color="amber" label={`Đã giữ chỗ: ${counts.reserved}`} />
              {currentZone && <Badge color="blue" label="Zone của bạn" />}
            </div>
          </div>

          <div className="action-panel-item grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-12">
            <div className="md:col-span-6">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm zone, khu hoặc biển số xe..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all text-sm font-medium"
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none text-sm font-semibold text-slate-700 focus:border-indigo-500 transition-all"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="available">Còn sức chứa</option>
                <option value="nearFull">Sắp đầy</option>
                <option value="full">Đã đầy</option>
                <option value="mine">Zone của bạn</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none text-sm font-semibold text-slate-700 focus:border-indigo-500 transition-all"
              >
                <option value="all">Tất cả loại xe</option>
                <option value="bicycle">Xe đạp</option>
                <option value="motorbike">Xe máy</option>
                <option value="car">Ô tô</option>
                <option value="truck">Xe tải</option>
              </select>
            </div>
          </div>

          {/* Bố cục 2 cột tối ưu hóa khoảng trắng và hiển thị Premium */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Cột trái: Bảng thống kê các Zone và chi tiết sức chứa */}
            <div className="action-panel-item lg:col-span-8 space-y-10">
              {groups.map((group) => (
                <section key={group.category} className="space-y-6">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{group.icon}</span>
                    <h2 className="text-md font-extrabold uppercase text-slate-900 tracking-wide">
                      {group.category}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {group.zones.filter(filterZone).map((zone) => (
                      <ZoneCard
                        key={zone.id}
                        zone={zone}
                        isCurrent={zone.id === currentZoneId}
                        onClick={() => setSelectedZone(zone)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* Cột phải: Bản đồ dẫn đường SVG mini, biểu phí bãi đỗ & hướng dẫn sử dụng */}
            <div className="action-panel-item lg:col-span-4 space-y-6">
              {/* Bản đồ định vị nhanh */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <span className="text-xl">🗺️</span>
                  <h3 className="text-sm font-bold text-slate-800">
                    Định vị nhanh (
                    {activeFloor === "B1" || activeFloor === "B2"
                      ? "Tầng Hầm"
                      : "Tầng Nổi"}
                    )
                  </h3>
                </div>

                {/* SVG Live Direction Map */}
                <div className="relative rounded-2xl bg-slate-900 aspect-[4/3] w-full flex items-center justify-center border border-slate-800 overflow-hidden shadow-inner">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.05)_1px,transparent_1px)] bg-[size:16px_16px]" />

                  <svg
                    className="w-4/5 h-4/5 text-slate-600 z-10"
                    viewBox="0 0 200 150"
                  >
                    <rect
                      x="10"
                      y="10"
                      width="180"
                      height="130"
                      rx="8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />

                    <text
                      x="25"
                      y="25"
                      className="fill-emerald-400 font-sans text-[7px] font-black tracking-widest"
                    >
                      CỔNG VÀO
                    </text>
                    <path
                      d="M 10 30 L 40 30"
                      stroke="#34d399"
                      strokeWidth="1.5"
                    />

                    <text
                      x="130"
                      y="138"
                      className="fill-rose-400 font-sans text-[7px] font-black tracking-widest"
                    >
                      CỔNG RA
                    </text>
                    <path
                      d="M 160 120 L 190 120"
                      stroke="#f87171"
                      strokeWidth="1.5"
                    />

                    <line
                      x1="85"
                      y1="10"
                      x2="85"
                      y2="140"
                      stroke="#475569"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />

                    <g className="opacity-50">
                      <rect
                        x="25"
                        y="45"
                        width="20"
                        height="12"
                        rx="1.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                      <rect
                        x="25"
                        y="65"
                        width="20"
                        height="12"
                        rx="1.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                      <rect
                        x="25"
                        y="85"
                        width="20"
                        height="12"
                        rx="1.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                      />

                      <rect
                        x="155"
                        y="45"
                        width="20"
                        height="12"
                        rx="1.5"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="1.5"
                      />
                      <text
                        x="157"
                        y="53"
                        className="fill-indigo-400 font-mono text-[5px] font-bold"
                      >
                        B1-B
                      </text>
                      <rect
                        x="155"
                        y="65"
                        width="20"
                        height="12"
                        rx="1.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                      <rect
                        x="155"
                        y="85"
                        width="20"
                        height="12"
                        rx="1.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                      />
                    </g>

                    <circle
                      cx="100"
                      cy="75"
                      r="16"
                      className="fill-indigo-500/10 stroke-indigo-500/30"
                      strokeWidth="1"
                    />
                    <text
                      x="100"
                      y="78"
                      textAnchor="middle"
                      className="fill-indigo-400 font-sans text-[8px] font-bold"
                    >
                      Lối di chuyển
                    </text>
                  </svg>

                  <div className="absolute bottom-3 left-4 text-[9px] font-semibold text-slate-400 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Hệ thống lưu thông thông minh
                  </div>
                </div>
              </div>

              {/* Biểu phí áp dụng */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <span className="text-xl">💳</span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Biểu phí gửi xe theo giờ
                    </h3>
                    <p className="mt-0.5 text-[10px] font-semibold text-slate-400">
                      Hiển thị phí theo giờ của từng loại xe
                    </p>
                  </div>
                </div>

                {pricingRows.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
                    <p className="text-xs font-black text-slate-700">
                      Chưa có dữ liệu phí theo giờ
                    </p>
                    <p className="mt-1 text-[11px] font-semibold text-slate-400">
                      Kiểm tra bảng giá HOURLY trong cấu hình pricing plans.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {pricingRows.map((row) => (
                      <div
                        key={row.key}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs"
                      >
                        <div>
                          <p className="font-black text-slate-800">
                            {row.vehicleTypeName}
                          </p>
                          <p className="mt-0.5 text-[10px] font-bold text-slate-400">
                            {row.pricingTypeLabel}
                          </p>
                        </div>

                        <span className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-1.5 font-black text-indigo-700">
                          {row.price.toLocaleString("vi-VN")}đ / giờ
                        </span>
                      </div>
                    ))}

                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs">
                      <span className="font-semibold text-emerald-700">
                        Thời gian giữ chỗ
                      </span>
                      <span className="rounded-xl bg-white px-3 py-1.5 font-black text-emerald-700 shadow-sm">
                        {DRIVER_RESERVATION_HOLD_MINUTES} phút
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Hướng dẫn di chuyển thông minh */}
              <div className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-6 shadow-sm space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">
                  💡 Chỉ dẫn điều hướng Smart
                </h4>
                <p className="text-xs text-indigo-900/80 leading-relaxed font-medium">
                  Chọn khu vực còn chỗ để tạo đặt chỗ. Sau khi đặt chỗ thành
                  công, hệ thống sẽ tạo mã QR để hỗ trợ check-in.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {selectedZone && (
        <ZoneModal
          zone={selectedZone}
          isCurrent={selectedZone.id === currentZoneId}
          onClose={() => setSelectedZone(null)}
          onReserve={(plate) => handleReserveZone(selectedZone.id, plate)}
          plates={plates}
          emergencyActive={emergencyStatus.active}
          emergencyMessage={emergencyStatus.message}
        />
      )}

      <MobileMapNav onLogout={onLogout} />
    </div>
  );
}

function MobileMapNav({ onLogout }) {
  return (
    <nav className="mobile-driver-nav md:hidden">
      <Link to="/driver/dashboard" className="mobile-nav-item">
        <span className="mobile-nav-icon">🏠</span>
        <span className="mobile-nav-label">Home</span>
      </Link>

      <Link to="/driver/map" className="mobile-nav-item mobile-nav-active">
        <span className="mobile-nav-icon">🗺️</span>
        <span className="mobile-nav-label">Map</span>
      </Link>

      <Link to="/driver/dashboard#current-session" className="mobile-nav-item">
        <span className="mobile-nav-icon">🎫</span>
        <span className="mobile-nav-label">Vé</span>
      </Link>

      <Link to="/driver/dashboard#profile-vip" className="mobile-nav-item">
        <span className="mobile-nav-icon">👤</span>
        <span className="mobile-nav-label">Hồ sơ</span>
      </Link>

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

function FloorButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-150 ${active
        ? "bg-white text-indigo-600 shadow-sm border border-slate-200"
        : "text-slate-500 hover:bg-white/40"
        }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function Badge({ color, label }) {
  const classes = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    red: "bg-rose-50 text-rose-700 border-rose-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    blue: "bg-indigo-50 text-indigo-700 border-indigo-100",
  };

  return (
    <div
      className={`rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-wider ${classes[color]}`}
    >
      {label}
    </div>
  );
}

function ZoneCard({ zone, isCurrent, onClick }) {
  const available = getZoneAvailability(zone);
  const usagePercent = getZoneUsagePercent(zone);
  const status = getZoneStatus(zone);
  const isClosed = getZoneStatus(zone) === "closed";
  const style = isClosed
    ? "border-slate-300 bg-slate-100 opacity-60 hover:opacity-80"
    : isCurrent
      ? "border-indigo-400 bg-indigo-50 ring-4 ring-indigo-100 shadow-md shadow-indigo-100"
      : status === "available"
        ? "border-emerald-100 bg-white hover:border-emerald-200 hover:shadow-md"
        : status === "nearFull"
          ? "border-amber-100 bg-amber-50/40 hover:border-amber-200 hover:shadow-md"
          : "border-rose-100 bg-rose-50/40 hover:border-rose-200 hover:shadow-md";
  const barColor = isClosed
    ? "bg-slate-400"
    : status === "available"
      ? "bg-emerald-500"
      : status === "nearFull"
        ? "bg-amber-500"
        : "bg-rose-500";

  return (
    <button
      onClick={onClick}
      className={`zone-card-mobile rounded-2xl border p-6 text-left transition-all ${style}`}
    >
      <div className="zone-card-head flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-black uppercase tracking-wider text-slate-500">
            {zone.zoneCode}
          </p>
          <h3 className="mt-1 text-lg font-black text-slate-900">
            {zone.name}
          </h3>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            {getVehicleLabel(zone.type)}
          </p>
        </div>
        <span
          className={`zone-card-status rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${isClosed ? "bg-slate-600 text-white" : isCurrent ? "bg-indigo-600 text-white" : "bg-white text-slate-600 border border-slate-100"}`}
        >
          {isClosed
            ? "Đã đóng"
            : isCurrent
              ? "Xe của bạn"
              : getStatusLabel(status)}
        </span>
      </div>

      <div className="zone-card-metrics mt-6 grid grid-cols-3 gap-3">
        <MiniMetric label="Sức chứa" value={zone.capacity} />
        <MiniMetric label="Đang gửi" value={zone.currentCount} />
        <MiniMetric label="Còn lại" value={available} strong />
      </div>

      {/* Tỷ lệ phần trăm và thanh tiến trình */}
      <div className="mt-5 flex items-center justify-between text-xs font-bold text-slate-500">
        <span>Tỉ lệ sử dụng</span>
        <span>{usagePercent}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${usagePercent}%` }}
        />
      </div>

      {/* Bản đồ ô lưới chỗ đỗ xe trực quan - Siêu cao cấp */}
      <div className="mt-5 border-t border-slate-100/80 pt-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Phân bổ chỗ đỗ thực tế
          </p>
          {/* Chú thích màu sắc (Legend) */}
          <div className="zone-card-legend flex items-center gap-2 text-[9px] font-bold text-slate-500 scale-90 origin-right">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2 rounded-[2px] bg-rose-500 inline-block"></span>
              🔴 Đang đỗ
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2 rounded-[2px] bg-amber-400 inline-block"></span>
              🟡 Giữ chỗ
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2 rounded-[2px] bg-emerald-400 inline-block"></span>
              🟢 Trống
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {Array.from({ length: 24 }).map((_, idx) => {
            const capacity = Math.max(toSafeNumber(zone.capacity), 1);
            const occupiedSlots = Math.round(
              (toSafeNumber(zone.currentCount) / capacity) * 24,
            );
            const reservedSlots = Math.round(
              ((toSafeNumber(zone.currentCount) +
                toSafeNumber(zone.reservedCount)) /
                capacity) *
              24,
            );

            const isOccupied = idx < occupiedSlots;
            const isReserved = !isOccupied && idx < reservedSlots;
            return (
              <span
                key={idx}
                className={`w-3.5 h-3.5 rounded-[3px] inline-block border transition-all duration-200 ${isOccupied
                  ? "bg-rose-500 border-rose-600 shadow-sm"
                  : isReserved
                    ? "bg-amber-400 border-amber-500 shadow-sm animate-pulse"
                    : "bg-emerald-400 border-emerald-500 hover:scale-110"
                  }`}
                title={
                  isOccupied
                    ? "Đang đỗ"
                    : isReserved
                      ? "Đã giữ chỗ trước"
                      : "Chỗ trống"
                }
              />
            );
          })}
        </div>
      </div>

      <div className="zone-card-footer mt-4 flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>Đã giữ chỗ: {zone.reservedCount}</span>
        <span>{available > 0 ? "Có thể đặt zone" : "Tạm hết sức chứa"}</span>
      </div>
    </button>
  );
}

function ZoneModal({
  zone,
  isCurrent,
  onClose,
  onReserve,
  plates = [],
  emergencyActive = false,
  emergencyMessage = "",
}) {
  const available = getZoneAvailability(zone);
  const status = getZoneStatus(zone);
  const canReserve =
    !emergencyActive && available > 0 && !isCurrent && zone.status === "ACTIVE";
  const isBicycle = isBicycleZone(zone);

  const [selectedPlate, setSelectedPlate] = useState("");
  const [newPlate, setNewPlate] = useState("");
  const [realtimeNow, setRealtimeNow] = useState(new Date());

  useEffect(() => {
    const tick = () => setRealtimeNow(new Date());

    tick();

    const intervalId = window.setInterval(tick, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const reservedToPreview = useMemo(() => {
    return new Date(
      realtimeNow.getTime() + DRIVER_RESERVATION_HOLD_MINUTES * 60 * 1000,
    );
  }, [realtimeNow]);

  const formatReservationTimeLabel = (value) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "--";

    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  };

  const formatReservationDateTimeFull = (value) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "--";

    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const plateOptions = isBicycle
    ? []
    : (plates || [])
      .map((plate) => ({
        licensePlate: getPlateValue(plate),
        vehicleTypeId: getPlateVehicleTypeId(plate),
        vehicleTypeName: getPlateVehicleTypeName(plate),
      }))
      .filter((plate) => Boolean(plate.licensePlate))
      .filter(
        (plate) =>
          normalizeVehicleTypeId(plate.vehicleTypeId) ===
          normalizeVehicleTypeId(zone.vehicleTypeId),
      );

  useEffect(() => {
    if (isBicycle) {
      setSelectedPlate("");
      setNewPlate("");
      return;
    }

    if (!selectedPlate && plateOptions.length > 0) {
      setSelectedPlate(plateOptions[0].licensePlate);
    }
  }, [isBicycle, selectedPlate, plateOptions]);

  const finalPlate = isBicycle
    ? ""
    : normalizePlateForApi(newPlate || selectedPlate);

  const submitReservation = async () => {
    if (isSubmitting) return;

    if (!isBicycle && !finalPlate) {
      alert("Vui lòng chọn hoặc nhập biển số xe");
      return;
    }

    const plateError = !isBicycle
      ? getLicensePlateValidationError(finalPlate, getVehicleLabel(zone.type))
      : null;

    if (plateError) {
      alert(plateError);
      return;
    }

    setIsSubmitting(true);

    try {
      await onReserve(isBicycle ? null : finalPlate);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/30">
        <div className="flex items-center justify-between bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-5 text-white">
          <div>
            <h3 className="text-lg font-bold">Zone {zone.zoneCode}</h3>
            <p className="mt-0.5 text-xs uppercase tracking-widest text-slate-400">
              {zone.name} • {getVehicleLabel(zone.type)}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-white transition-colors hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[68vh] space-y-4 overflow-y-auto bg-slate-50 p-5">
          {emergencyActive && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-left">
              <p className="text-xs font-black uppercase tracking-widest text-rose-700">
                🚨 Đang báo động khẩn cấp
              </p>
              <p className="mt-2 text-xs font-semibold leading-5 text-rose-800">
                Tài xế không thể tạo đặt chỗ mới trong lúc SOS đang bật. Vui
                lòng quay về Dashboard và làm theo hướng dẫn an toàn.
              </p>
              {emergencyMessage && (
                <p className="mt-2 rounded-xl bg-white/70 px-3 py-2 text-[11px] font-bold text-rose-700">
                  {emergencyMessage}
                </p>
              )}
            </div>
          )}
          <div
            className={`rounded-2xl border p-5 text-center flex flex-col items-center ${zone.status === "CLOSED"
              ? "bg-slate-100 border-slate-200 text-slate-600"
              : isCurrent
                ? "bg-indigo-50 border-indigo-100 text-indigo-800"
                : status === "available"
                  ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                  : status === "nearFull"
                    ? "bg-amber-50 border-amber-100 text-amber-800"
                    : "bg-rose-50 border-rose-100 text-rose-800"
              }`}
          >
            <div className="text-[11px] font-black tracking-widest">
              {zone.status === "CLOSED"
                ? "CLOSED"
                : isCurrent
                  ? "ACTIVE"
                  : available > 0
                    ? "OPEN"
                    : "FULL"}
            </div>

            <h4 className="mt-2 text-sm font-bold uppercase tracking-wider">
              {zone.status === "CLOSED"
                ? "Zone này đã tạm đóng bởi nhân viên"
                : isCurrent
                  ? "Xe của bạn đang ở zone này"
                  : getStatusLabel(status)}
            </h4>
          </div>

          <Info label="Tổng sức chứa" value={zone.capacity} />
          <Info label="Đang gửi" value={zone.currentCount} />
          <Info label="Đã giữ chỗ" value={zone.reservedCount} />
          <Info label="Còn nhận thêm" value={available} />

          {canReserve && (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
              {!isBicycle && (
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-600">
                    Biển số được quản lý
                  </p>

                  {plateOptions.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {plateOptions.map((plate) => (
                        <button
                          key={plate.licensePlate}
                          type="button"
                          onClick={() => {
                            setSelectedPlate(plate.licensePlate);
                            setNewPlate("");
                          }}
                          className={`rounded-lg border px-3 py-2 text-xs font-bold transition-all ${selectedPlate === plate.licensePlate && !newPlate
                            ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                            }`}
                        >
                          {formatLicensePlate(
                            plate.licensePlate,
                            plate.vehicleTypeName,
                          )}
                          <span className="ml-1 text-[9px] font-black uppercase text-slate-400">
                            {plate.vehicleTypeName}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700">
                      Chưa có biển số {getVehicleLabel(zone.type)} trong hồ sơ.
                      Bạn có thể nhập biển số mới, hệ thống sẽ lưu kèm loại xe
                      của zone này.
                    </p>
                  )}

                  <div className="mt-3">
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Đăng ký biển số mới
                    </label>
                    <input
                      value={newPlate}
                      onChange={(event) =>
                        setNewPlate(normalizePlateInput(event.target.value))
                      }
                      placeholder="Ví dụ: 59A1-12345"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold uppercase tracking-wider text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                    />

                  </div>
                </div>
              )}

              <div className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm shadow-slate-200/70">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Thời gian giữ chỗ
                    </p>
                  </div>

                </div>

                <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/80 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                    Thời điểm hiện tại
                  </p>
                  <p className="mt-2 text-base font-black text-indigo-900">
                    {formatReservationDateTimeFull(realtimeNow)}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Bắt đầu
                    </p>
                    <p className="mt-2 text-sm font-black text-slate-900">
                      {formatReservationDateTimeFull(realtimeNow)}
                    </p>

                  </div>

                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                      Hết hạn
                    </p>
                    <p className="mt-2 text-sm font-black text-indigo-900">
                      {formatReservationDateTimeFull(reservedToPreview)}
                    </p>

                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">
                    Lưu ý check-in
                  </p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-amber-800">
                    Vui lòng{" "}
                    <span className="font-black">
                      check-in đúng trong khoảng thời gian từ{" "}
                      {formatReservationDateTimeFull(realtimeNow)} đến{" "}
                      {formatReservationDateTimeFull(reservedToPreview)}
                    </span>
                    . Nếu quá thời gian này, đặt chỗ có thể hết hiệu lực và hệ thống có quyền
                    từ chối giữ chỗ.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-slate-200 bg-white p-5">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-white"
          >
            Đóng
          </button>

          {emergencyActive ? (
            <button
              type="button"
              disabled
              className="flex-1 rounded-xl bg-rose-100 py-3 text-sm font-black text-rose-700 opacity-80"
            >
              Đặt chỗ đang tạm khóa
            </button>
          ) : canReserve ? (
            <button
              type="button"
              onClick={submitReservation}
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Đang tạo..." : "Tạo đặt chỗ"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, strong }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white/70 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p
        className={`mt-1 text-lg font-black ${strong ? "text-indigo-700" : "text-slate-800"}`}
      >
        {value}
      </p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex justify-between items-center rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs font-semibold">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800">{value}</span>
    </div>
  );
}
