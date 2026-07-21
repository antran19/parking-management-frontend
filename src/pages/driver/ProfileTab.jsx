/**
 * ProfileTab — Quản lý hồ sơ Driver (Quảng phụ trách)
 *
 * TODO (Quảng): Implement:
 * - Quản lý biển số xe (thêm/xóa)
 * - Đăng ký Parking Pass (gói tháng/quý/năm) + thanh toán VNPAY
 * - Xem danh sách parking pass đã mua
 */
import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { staffApi } from "../../api/parkingApi";
import {
  normalizeLicensePlate as normalizePlateForApi,
  formatLicensePlate,
  getLicensePlateValidationError,
} from "../../utils/licensePlate";



/**
 * NOTE Quảng - Driver:
 * Chỉ chuẩn hóa input lúc người dùng nhập để UI dễ nhìn.
 * Không dùng hàm này để validate biển số.
 * Validate chính dùng chung từ utils/licensePlate.js để đồng bộ với Staff check-in.
 */
const normalizePlateInput = (value) => {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[–—]/g, "-");
};

const BICYCLE_IDENTIFIER_HINT =
  "Xe đạp không có biển số. Backend sẽ tự sinh mã dạng BCyymmdd-nnnn, ví dụ: BC260702-0001.";

const normalizeVehicleTypeText = (value) => {
  return String(value || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Đ/g, "D")
    .replace(/đ/g, "D")
    .trim();
};

const getVehicleTypeText = (vehicleType) => {
  if (typeof vehicleType === "object") {
    return normalizeVehicleTypeText(
      [
        vehicleType?.displayName,
        vehicleType?.name,
        vehicleType?.vehicleTypeName,
        vehicleType?.code,
        vehicleType?.type,
        vehicleType?.description,
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  return normalizeVehicleTypeText(vehicleType);
};

const getVehicleTypeDisplayName = (vehicleType) => {
  const text = getVehicleTypeText(vehicleType);

  if (text.includes("XE DAP") || text.includes("BICYCLE") || text === "BIKE") {
    return "Xe đạp";
  }

  if (
    text.includes("XE MAY") ||
    text.includes("MOTORBIKE") ||
    text.includes("MOTORCYCLE")
  ) {
    return "Xe máy";
  }

  if (
    text.includes("O TO") ||
    text.includes("OTO") ||
    text.includes("CAR") ||
    text === "O"
  ) {
    return "Ô tô";
  }

  if (
    text.includes("XE TAI") ||
    text.includes("TRUCK") ||
    text.includes("VAN") ||
    text === "XE"
  ) {
    return "Xe tải";
  }

  if (typeof vehicleType === "object") {
    return vehicleType?.name || vehicleType?.vehicleTypeName || "Xe";
  }

  return vehicleType || "Xe";
};

const getVehicleTypeKey = (vehicleType) => {
  const displayName = getVehicleTypeDisplayName(vehicleType);
  const text = normalizeVehicleTypeText(displayName);

  if (text.includes("XE DAP")) return "BICYCLE";
  if (text.includes("XE MAY")) return "MOTORBIKE";
  if (text.includes("XE TAI")) return "TRUCK";
  if (text.includes("O TO")) return "CAR";

  return "UNKNOWN";
};

const isBicycleVehicleTypeName = (value) => {
  return getVehicleTypeKey(value) === "BICYCLE";
};

const ACTIVE_PASS_GROUP_INFO = [
  {
    key: "MOTORBIKE",
    label: "Xe máy",
  },
  {
    key: "CAR",
    label: "Ô tô",
  },
  {
    key: "BICYCLE",
    label: "Xe đạp",
  },
  {
    key: "TRUCK",
    label: "Xe tải",
  },
  {
    key: "UNKNOWN",
    label: "Loại xe khác",
  },
];


const PASS_TYPE_INFO = {
  MONTHLY: {
    label: "Gói tháng",
    months: 1,
    code: "M",
    color: "from-slate-800 to-slate-950",
    discount: null,
  },
  QUARTERLY: {
    label: "Gói quý",
    months: 3,
    code: "Q",
    color: "from-cyan-800 to-slate-950",
    discount: null,
  },
  YEARLY: {
    label: "Gói năm",
    months: 12,
    code: "Y",
    color: "from-amber-700 to-slate-950",
    discount: "Giảm 10%",
  },
};

const LicensePlate = ({ plate, vehicleTypeName }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-200 bg-white font-mono font-bold text-slate-800 shadow-sm text-xs tracking-widest">
    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block mr-0.5 animate-pulse"></span>
    {formatLicensePlate(plate, vehicleTypeName)}
  </span>
);

export default function ProfileTab({
  user,
  newPlateInput,
  setNewPlateInput,
  handleAddPlate,
  handleDeletePlate,
  setActiveTab,
  loadUserData,
}) {
  const [pricingPlans, setPricingPlans] = useState([]);
  const [myPasses, setMyPasses] = useState([]);
  const [config, setConfig] = useState({ buildings: [], vehicleTypes: [] });
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPassType, setSelectedPassType] = useState("MONTHLY");
  const [regPlate, setRegPlate] = useState("");
  const [plateInputMode, setPlateInputMode] = useState("MANAGED");
  const [showPassModal, setShowPassModal] = useState(false);
  const [showAddPlateModal, setShowAddPlateModal] = useState(false);
  const [addPlateVehicleTypeId, setAddPlateVehicleTypeId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [expiredPassesPage, setExpiredPassesPage] = useState(1);
  const [selectedActivePassGroupKey, setSelectedActivePassGroupKey] = useState(null);
  const [selectedPassDetail, setSelectedPassDetail] = useState(null);
  const [selectedVehicleDetail, setSelectedVehicleDetail] = useState(null);
  const [profileSectionTab, setProfileSectionTab] = useState("MARKETPLACE");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAddPlateFromPopup = async (event) => {
    event.preventDefault();

    if (!addPlateVehicleTypeId) {
      showToast("Vui lòng chọn loại xe cho biển số", "error");
      return;
    }

    const selectedVehicleType = plateVehicleTypes.find(
      (vehicleType) => String(vehicleType.id) === String(addPlateVehicleTypeId),
    );

    const selectedVehicleTypeName =
      selectedVehicleType?.displayName ||
      getVehicleTypeDisplayName(selectedVehicleType);

    const ok = await handleAddPlate(
      event,
      addPlateVehicleTypeId,
      selectedVehicleTypeName,
    );

    if (ok) {
      setShowAddPlateModal(false);
      setAddPlateVehicleTypeId("");
    }
  };

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

  const normalizeVehicleTypeId = (value) => String(value || "");

  const getPlateSource = (plate) => {
    if (typeof plate === "string") return "PROFILE";
    return String(plate?.source || "PROFILE").toUpperCase();
  };

  const getPlateReadOnly = (plate) => {
    if (typeof plate === "string") return false;
    return Boolean(
      plate?.readOnly || getPlateSource(plate) === "BICYCLE_PASS",
    );
  };

  const vehicleRegistryEntries = (user?.licensePlates || [])
    .map((plate) => ({
      raw: plate,
      source: getPlateSource(plate),
      readOnly: getPlateReadOnly(plate),
      licensePlate: getPlateValue(plate),
      vehicleTypeId: getPlateVehicleTypeId(plate),
      vehicleTypeName: getPlateVehicleTypeName(plate),
      parkingPassId:
        typeof plate === "string" ? null : plate?.parkingPassId || null,
      parkingPassCode:
        typeof plate === "string" ? null : plate?.parkingPassCode || null,
      passType: typeof plate === "string" ? null : plate?.passType || null,
      passStatus:
        typeof plate === "string" ? null : plate?.passStatus || null,
      startDate: typeof plate === "string" ? null : plate?.startDate || null,
      endDate: typeof plate === "string" ? null : plate?.endDate || null,
    }))
    .filter((plate) => Boolean(plate.licensePlate));

  const managedPlates = vehicleRegistryEntries
    .filter((plate) => plate.source === "PROFILE")
    .filter((plate) => !isBicycleVehicleTypeName(plate.vehicleTypeName));

  const bicyclePassCodes = vehicleRegistryEntries
    .filter((plate) => plate.source === "BICYCLE_PASS")
    .filter((plate) => isBicycleVehicleTypeName(plate.vehicleTypeName));

  const displayedVehicleRegistry = [
    ...managedPlates,
    ...bicyclePassCodes,
  ];

  const plateVehicleTypes = (config.vehicleTypes || [])
    .map((vehicleType) => ({
      ...vehicleType,
      displayName: getVehicleTypeDisplayName(vehicleType),
    }))
    .filter((vehicleType) => !isBicycleVehicleTypeName(vehicleType));

  const getManagedPlatesByVehicleType = (vehicleTypeId) => {
    const targetTypeId = normalizeVehicleTypeId(vehicleTypeId);

    return managedPlates.filter((plate) => {
      return normalizeVehicleTypeId(plate.vehicleTypeId) === targetTypeId;
    });
  };

  const selectedPlanPlateOptions = selectedPlan
    ? getManagedPlatesByVehicleType(selectedPlan.vehicleTypeId)
    : managedPlates;

  const selectedPlanIsBicycle = selectedPlan
    ? isBicycleVehicleTypeName(selectedPlan.vehicleTypeName)
    : false;

  const isSameUserPlateDuplicateMessage = (message) => {
    const normalizedMessage = String(message || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");

    return normalizedMessage.includes("bien so da ton tai trong tai khoan cua ban");
  };

  const addPlateToDriverProfile = async (plate, vehicleTypeId) => {
    try {
      await staffApi.addDriverPlate(plate, vehicleTypeId);
    } catch (err) {
      const message = err.response?.data?.message || err.message || "";

      if (isSameUserPlateDuplicateMessage(message)) {
        return;
      }

      throw err;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [plansRes, passesRes, configRes] = await Promise.all([
          staffApi.getDriverPricingPlans(),
          staffApi.getDriverPasses(),
          staffApi.getParkingConfig(),
        ]);

        /**
         * NOTE Quảng - Driver:
         * Màn đăng ký gói tháng/quý/năm chỉ dùng pricingType MONTHLY.
         * Không lấy HOURLY/DAILY để tránh tính sai giá pass.
         */
        const plans = plansRes.data?.data || [];

        /**
         * NOTE Quảng - Driver:
         * - allPricingPlans dùng để hiển thị toàn bộ bảng giá xe cho Driver xem.
         * - pricingPlans chỉ lấy MONTHLY để đăng ký gói tháng/quý/năm.
         * - Không dùng HOURLY/DAILY để tính pass, tránh sai nghiệp vụ.
         */
        setPricingPlans(
          plans.filter(
            (plan) =>
              String(plan.pricingType || "").toUpperCase() === "MONTHLY",
          ),
        );
        setMyPasses(passesRes.data?.data || []);
        const c = configRes.data?.data || {};
        setConfig({
          buildings: c.buildings || [],
          vehicleTypes: c.vehicleTypes || [],
        });
      } catch (err) {
        console.warn("ProfileTab: Failed to load data", err);
      }
    })();
  }, []);

  // Auto-cancel expired pending payments (older than 15 minutes)
  useEffect(() => {
    if (!myPasses || myPasses.length === 0) return;

    const checkAndCancelExpiredPasses = async () => {
      const pendingPasses = myPasses.filter((p) => p.status === "PENDING_PAYMENT");
      const EXPIRE_TIMEOUT = 15 * 60 * 1000; // 15 minutes
      
      const expiredList = pendingPasses.filter((pass) => {
        if (!pass.createdAt) return false;
        const createdTime = new Date(pass.createdAt).getTime();
        return Date.now() - createdTime > EXPIRE_TIMEOUT;
      });

      if (expiredList.length === 0) return;

      console.log(`Auto-cancelling ${expiredList.length} expired pending payments`);
      
      let hasCancelledAny = false;
      for (const pass of expiredList) {
        try {
          await staffApi.cancelDriverPass(pass.id);
          hasCancelledAny = true;
        } catch (err) {
          console.error(`Failed to auto-cancel pass ${pass.id}`, err);
        }
      }

      if (hasCancelledAny) {
        try {
          showToast("Đơn chờ thanh toán đã hết hạn và tự động hủy.", "info");
          const passesRes = await staffApi.getDriverPasses();
          setMyPasses(passesRes.data?.data || []);
          if (typeof loadUserData === "function") {
            loadUserData();
          }
        } catch (err) {
          console.warn("Failed to reload passes after auto-cancellation", err);
        }
      }
    };

    checkAndCancelExpiredPasses();

    const interval = setInterval(checkAndCancelExpiredPasses, 15000);
    return () => clearInterval(interval);
  }, [myPasses, loadUserData]);

  const calcFee = (monthlyPrice, passType) => {
    const mp = Number(monthlyPrice || 0);
    if (passType === "QUARTERLY") return mp * 3;
    if (passType === "YEARLY") return Math.round(mp * 12 * 0.9);
    return mp;
  };


  /**
   * NOTE Quảng - Driver:
   * Đăng ký Parking Pass cho Driver.
   * - Xe đạp: không nhập biển số, backend tự sinh mã.
   * - Xe máy / ô tô / xe tải: validate bằng getLicensePlateValidationError()
   *   từ utils/licensePlate.js để đồng bộ với Staff check-in.
   * - Nếu nhập biển mới khi mua pass, hệ thống tự thêm biển đó vào hồ sơ Driver trước.
   */
  const handleRegister = async (e) => {
    e.preventDefault();

    if (!selectedPlan) {
      showToast("Vui lòng chọn gói cần đăng ký", "error");
      return;
    }

    const isBicyclePass = isBicycleVehicleTypeName(
      selectedPlan.vehicleTypeName,
    );
    const normalizedPlate = normalizePlateForApi(regPlate);

    if (!isBicyclePass) {
      if (!normalizedPlate) {
        showToast("Vui lòng chọn biển số xe đã đăng ký trong hồ sơ", "error");
        return;
      }

      const plateError = getLicensePlateValidationError(
        normalizedPlate,
        selectedPlan.vehicleTypeName,
      );

      if (plateError) {
        showToast(plateError, "error");
        return;
      }
    }

    const plateBelongsToDriver =
      !isBicyclePass &&
      selectedPlanPlateOptions.some((plate) => {
        return (
          normalizePlateForApi(plate.licensePlate) ===
          normalizePlateForApi(normalizedPlate)
        );
      });

    if (
      !isBicyclePass &&
      plateInputMode === "MANAGED" &&
      !plateBelongsToDriver
    ) {
      showToast(
        "Biển số đã chọn không khớp loại xe của gói. Vui lòng chọn đúng biển số hoặc nhập biển mới.",
        "error",
      );
      return;
    }

    setSubmitting(true);

    try {
      if (
        !isBicyclePass &&
        plateInputMode === "MANUAL" &&
        !plateBelongsToDriver
      ) {
        await addPlateToDriverProfile(
          normalizedPlate,
          selectedPlan.vehicleTypeId,
        );

        if (typeof loadUserData === "function") {
          await loadUserData();
        }
      }

      const res = await staffApi.registerDriverPass({
        buildingId: selectedPlan.buildingId,
        vehicleTypeId: selectedPlan.vehicleTypeId,
        licensePlate: isBicyclePass ? "" : normalizedPlate,
        passType: selectedPassType,
      });

      const paymentUrl = res.data?.data?.paymentUrl;

      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }

      showToast("Đã tạo đơn thanh toán thành công!");
      setSelectedPlan(null);
      setShowPassModal(false);
      setRegPlate("");

      const passesRes = await staffApi.getDriverPasses();
      setMyPasses(passesRes.data?.data || []);

      if (typeof loadUserData === "function") {
        loadUserData();
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || err.message || "Đăng ký thất bại",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinuePayment = async (passId) => {
    setSubmitting(true);
    try {
      const res = await staffApi.continueDriverPassPayment(passId);
      const paymentUrl = res.data?.data?.paymentUrl;
      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }
      showToast("Không lấy được liên kết thanh toán", "error");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Không thể tiếp tục thanh toán",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelPendingPayment = async (passId) => {
    if (!confirm("Bạn có chắc muốn hủy đơn chờ thanh toán này không?")) {
      return;
    }

    setSubmitting(true);

    try {
      await staffApi.cancelDriverPass(passId);

      showToast("Đã hủy đơn thanh toán thành công!");

      const passesRes = await staffApi.getDriverPasses();
      setMyPasses(passesRes.data?.data || []);

      if (typeof loadUserData === "function") {
        loadUserData();
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || err.message || "Hủy thanh toán thất bại",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const activePasses = myPasses.filter((p) => p.status === "ACTIVE");
  const getVehiclePassHistory = (vehicle) => {
    const targetPlate = normalizePlateForApi(vehicle?.licensePlate);

    if (!targetPlate) {
      return [];
    }

    return myPasses
      .filter(
        (pass) =>
          normalizePlateForApi(pass.licensePlate) === targetPlate,
      )
      .sort((firstPass, secondPass) => {
        const firstDate = new Date(
          firstPass.createdAt || firstPass.startDate || 0,
        );

        const secondDate = new Date(
          secondPass.createdAt || secondPass.startDate || 0,
        );

        return secondDate - firstDate;
      });
  };

  const groupedActivePasses = ACTIVE_PASS_GROUP_INFO.map((group) => {
    const passes = activePasses
      .filter((pass) => {
        const vehicleType =
          pass.vehicleTypeName ||
          pass.vehicleType?.name ||
          pass.vehicleType;

        return getVehicleTypeKey(vehicleType) === group.key;
      })
      .sort((firstPass, secondPass) => {
        return new Date(firstPass.endDate) - new Date(secondPass.endDate);
      });

    return {
      ...group,
      passes,
    };
  }).filter((group) => group.passes.length > 0);

  const pendingPasses = myPasses.filter((p) => p.status === "PENDING_PAYMENT");
  const expiredPasses = myPasses.filter(
    (p) => !["ACTIVE", "PENDING_PAYMENT"].includes(p.status),
  );

  const EXPIRED_PASS_PAGE_SIZE = 5;
  const totalExpiredPassesPages = Math.ceil(expiredPasses.length / EXPIRED_PASS_PAGE_SIZE);
  const currentExpiredPassesPage = Math.max(1, Math.min(expiredPassesPage, totalExpiredPassesPages || 1));

  const visibleExpiredPasses = expiredPasses.slice(
    (currentExpiredPassesPage - 1) * EXPIRED_PASS_PAGE_SIZE,
    currentExpiredPassesPage * EXPIRED_PASS_PAGE_SIZE,
  );

  const primaryPass = activePasses[0];
  const totalActiveValue = activePasses.reduce(
    (sum, pass) => sum + Number(pass.fee || 0),
    0,
  );
  const nearestExpiry = activePasses.reduce(
    (min, pass) => {
      const days = Math.max(
        0,
        Math.ceil(
          (new Date(pass.endDate) - new Date()) / (1000 * 60 * 60 * 24),
        ),
      );
      return Math.min(min, days);
    },
    activePasses.length ? 9999 : 0,
  );

  const profileSectionTabs = [
    {
      id: "MARKETPLACE",
      label: "Mua gói",
      description: "Đăng ký gói",
      count: pricingPlans.length,
    },
    {
      id: "ACTIVE_PASSES",
      label: "Gói của tôi",
      description: "Đang hiệu lực",
      count: activePasses.length,
    },
    {
      id: "PLATES",
      label: "Biển số",
      description: "Xe đã lưu",
      count: displayedVehicleRegistry.length,
    },
    {
      id: "PENDING",
      label: "Chờ thanh toán",
      description: "Đơn chưa trả",
      count: pendingPasses.length,
    },
    {
      id: "EXPIRED",
      label: "Gói cũ",
      description: "Hết hạn / hủy",
      count: expiredPasses.length,
    },
  ];

  return (
    <div className="profile-mobile-root space-y-6 sm:space-y-8 animate-fadeIn">
      {toast && (
        <div
          className={`fixed left-4 right-4 top-4 z-[9999] flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-center text-xs font-bold text-white shadow-2xl animate-bounce sm:left-auto sm:right-5 sm:top-5 sm:px-5 sm:py-3.5 ${toast.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}
        >
          <span>{toast.msg}</span>
        </div>
      )}

      <section className="relative overflow-hidden rounded-[1.5rem] border border-slate-900/10 bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/15 sm:rounded-[2rem] sm:p-6 md:p-8">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute left-1/2 top-10 h-48 w-48 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.9)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.9)_1px,transparent_1px)] [background-size:42px_42px]" />

        <div className="relative grid gap-7 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,.9)]" />
              Driver Membership Console
            </div>
            <h3 className="mt-5 max-w-2xl text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl md:text-5xl">
              Hồ sơ hội viên & đặc quyền gửi xe
            </h3>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
              Quản lý biển số, theo dõi gói định kỳ và đăng ký gói thành viên
              theo dữ liệu giá thực tế của hệ thống.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
              <HeroMetric label="Biển số" value={(user?.licensePlates || []).length} />
              <HeroMetric
                label="Gói hiệu lực"
                value={activePasses.length}
                tone="text-emerald-200"
              />
              <HeroMetric
                label="Sắp hết hạn"
                value={activePasses.length ? `${nearestExpiry} ngày` : "—"}
                tone="text-amber-200"
              />
              <HeroMetric
                label="Giá trị gói"
                value={`${totalActiveValue.toLocaleString("vi-VN")}đ`}
                tone="text-cyan-200"
              />
            </div>
          </div>

          <div className="relative rounded-3xl border border-white/10 bg-white/[0.07] p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Trạng thái hội viên
                </p>
                <p className="mt-1 text-2xl font-black text-white">
                  {primaryPass ? "Premium Active" : "Standard"}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 text-2xl shadow-lg shadow-amber-500/20">
                {primaryPass ? "VIP" : "STD"}
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Gói nổi bật
              </p>
              <p className="mt-2 text-sm font-black text-white">
                {primaryPass
                  ? `${PASS_TYPE_INFO[primaryPass.passType]?.label || primaryPass.passType} · ${formatLicensePlate(
                    primaryPass.licensePlate,
                    primaryPass.vehicleTypeName ||
                    primaryPass.vehicleType?.name,
                  )}`
                  : "Chưa có gói định kỳ"}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                {primaryPass
                  ? `Hiệu lực đến ${new Date(primaryPass.endDate).toLocaleDateString("vi-VN")}`
                  : "Chọn một gói bên dưới để nâng cấp trải nghiệm gửi xe."}
              </p>
            </div>
            <button
              onClick={() => setActiveTab("dashboard")}
              className="mt-5 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition-all hover:bg-white/15 cursor-pointer"
            >
              Quay lại bảng điều khiển
            </button>
          </div>
        </div>
      </section>

      {/* ===== THANH CHỌN MỤC HỒ SƠ ===== */}
      <div className="sticky top-[84px] z-30">
        <div className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-2.5 shadow-xl shadow-slate-200/70 backdrop-blur-xl">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
            {profileSectionTabs.map((tab) => {
              const active = profileSectionTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setProfileSectionTab(tab.id)}
                  className={`group relative overflow-hidden rounded-[1.25rem] border px-3.5 py-3 text-left transition-all duration-200 ${active
                    ? "border-indigo-500 bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 text-white shadow-lg shadow-blue-500/25"
                    : "border-slate-200 bg-white text-slate-600 shadow-sm hover:-translate-y-0.5 hover:border-indigo-100 hover:bg-indigo-50/60 hover:shadow-md"
                    }`}
                >
                  {active && (
                    <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/20 blur-2xl" />
                  )}

                  <div className="relative flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`truncate text-[11px] font-black uppercase tracking-[0.12em] ${active ? "text-white" : "text-slate-700"
                            }`}
                        >
                          {tab.label}
                        </p>

                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${active
                            ? "bg-white/20 text-white"
                            : "bg-slate-100 text-slate-500"
                            }`}
                        >
                          {tab.count}
                        </span>
                      </div>

                      <p
                        className={`mt-1 truncate text-[10px] font-semibold ${active ? "text-white/75" : "text-slate-400"
                          }`}
                      >
                        {tab.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== GÓI DỊCH VỤ ===== */}
      {profileSectionTab === "MARKETPLACE" && (
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[2rem] sm:p-6 md:p-8">
          <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-[0.18em]">
                Marketplace gói dịch vụ
              </h4>
              <p className="mt-2 text-xs text-slate-400">
                Chọn loại xe và gói phù hợp để đăng ký gói gửi xe định kỳ. Giá lấy từ bảng
                giá thật trên hệ thống.
              </p>
            </div>

            <span className="w-fit rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-700">
              Live pricing
            </span>
          </div>

          {pricingPlans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
              Chưa có gói dịch vụ nào được cấu hình. Liên hệ Admin.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {pricingPlans.map((plan) => {
                const planVehicleType =
                  plan.vehicleType ||
                  config.vehicleTypes.find((v) => v.id === plan.vehicleTypeId);

                const vtName = getVehicleTypeDisplayName(planVehicleType);

                const buildingName =
                  plan.building?.name ||
                  plan.building?.buildingName ||
                  config.buildings.find((b) => b.id === plan.buildingId)?.name ||
                  config.buildings.find((b) => b.id === plan.buildingId)
                    ?.buildingName ||
                  "Bãi xe";

                const monthlyPrice = Number(plan.pricePerUnit || 0);
                const planVehicleTypeId = plan.vehicleType?.id || plan.vehicleTypeId;

                return (
                  <div
                    key={plan.id}
                    className="action-panel-item group relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-950/10"
                  >
                    <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-indigo-100 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />

                    <div className="relative mb-4 flex items-center justify-between">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-500 to-blue-600 text-xs font-black tracking-widest text-white shadow-lg shadow-indigo-500/20">
                        PASS
                      </span>

                      <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-indigo-700">
                        {vtName}
                      </span>
                    </div>

                    <h5 className="relative text-lg font-black text-slate-950">
                      {buildingName}
                    </h5>

                    <p className="relative mb-4 mt-1 text-xs text-slate-400">
                      Giá cơ bản:{" "}
                      <span className="font-black text-indigo-700">
                        {monthlyPrice.toLocaleString("vi-VN")}đ/tháng
                      </span>
                    </p>

                    <div className="mb-5 space-y-2.5">
                      {Object.entries(PASS_TYPE_INFO).map(([type, info]) => {
                        const fee = calcFee(monthlyPrice, type);
                        const selected =
                          selectedPlan?.vehicleTypeId === planVehicleTypeId &&
                          selectedPassType === type;

                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              const matchingPlates =
                                getManagedPlatesByVehicleType(planVehicleTypeId);

                              setSelectedPlan({
                                vehicleTypeId: planVehicleTypeId,
                                vehicleTypeName: vtName,
                                monthlyPrice,
                                buildingId: plan.building?.id || plan.buildingId,
                                buildingName,
                              });

                              setSelectedPassType(type);

                              if (isBicycleVehicleTypeName(vtName)) {
                                setPlateInputMode("AUTO_BICYCLE");
                                setRegPlate("");
                              } else if (matchingPlates.length > 0) {
                                setPlateInputMode("MANAGED");
                                setRegPlate(matchingPlates[0].licensePlate);
                              } else {
                                setPlateInputMode("MANUAL");
                                setRegPlate("");
                              }

                              setShowPassModal(true);
                            }}
                            className={`flex w-full cursor-pointer items-center justify-between rounded-xl border p-3 text-left transition-all ${selected
                              ? "border-indigo-300 bg-indigo-50 shadow-md shadow-indigo-100/60"
                              : "border-slate-100 bg-slate-50/50 hover:border-indigo-100 hover:bg-white"
                              }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-[10px] font-black tracking-widest text-indigo-700">
                                {info.code}
                              </span>

                              <div>
                                <span className="text-xs font-black text-slate-800">
                                  {info.label}
                                </span>

                                {info.discount && (
                                  <span className="ml-2 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-black text-amber-600">
                                    {info.discount}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span className="text-sm font-black text-slate-900">
                              {fee.toLocaleString("vi-VN")}đ
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== QUẢN LÝ BIỂN SỐ XE ===== */}
      {profileSectionTab === "PLATES" && (
        <div className="action-panel-item overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 to-slate-800 p-6 text-white md:p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
              Vehicle Registry
            </p>
            <h4 className="mt-2 text-xl font-black tracking-tight">
              Danh sách biển số xe đăng ký
            </h4>
            <p className="mt-2 text-xs font-medium text-slate-400">
              Các biển số này được dùng khi đặt chỗ, check-in và tra cứu phiên gửi
              xe.
            </p>
          </div>
          <div className="space-y-6 p-6 md:p-8">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-3.5">
                Phương tiện và mã xe đạp đã đăng ký
              </span>
              {displayedVehicleRegistry.length === 0 ? (
                <p className="text-slate-400 font-bold italic py-2 text-xs">
                  Chưa có phương tiện nào được liên kết với tài khoản.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedVehicleRegistry.map((plate, idx) => {
                    const isBicyclePass = plate.source === "BICYCLE_PASS";
                    const passLabel =
                      PASS_TYPE_INFO[plate.passType]?.label || "Gói hội viên";

                    return (
                      <div
                        key={`${plate.source}-${plate.licensePlate}-${idx}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedVehicleDetail(plate)}
                        onKeyDown={(event) => {
                          // Không xử lý sự kiện phát sinh từ nút con, ví dụ nút Xóa
                          if (event.target !== event.currentTarget) {
                            return;
                          }

                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedVehicleDetail(plate);
                          }
                        }}
                        className={`flex cursor-pointer justify-between items-center border p-4 rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-md ${isBicyclePass
                          ? "border-cyan-200 bg-cyan-50/60 hover:border-cyan-400"
                          : "border-slate-200 bg-slate-50 hover:border-indigo-300"
                          }`}
                      >
                        <div>
                          <LicensePlate
                            plate={plate.licensePlate}
                            vehicleTypeName={plate.vehicleTypeName}
                          />
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {plate.vehicleTypeName}
                          </p>
                          <p className="mt-2 text-[9px] font-bold uppercase tracking-wider text-indigo-500">
                            Nhấn để xem lịch sử gói
                          </p>
                          {isBicyclePass && (
                            <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-cyan-700">
                              Mã xe đạp từ {passLabel}
                            </p>
                          )}
                        </div>

                        {!plate.readOnly && plate.source === "PROFILE" ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeletePlate(plate.licensePlate);
                            }}
                            className="text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-2 rounded-xl transition-all cursor-pointer"
                            title="Xóa biển số này"
                          >
                            Xóa
                          </button>
                        ) : (
                          <span
                            className="rounded-xl border border-cyan-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wider text-cyan-700"
                            title="Mã được hệ thống cấp từ gói xe đạp và không thể xóa tại đây"
                          >
                            Mã từ gói
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="pt-6 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-3">
                Thêm biển số xe
              </span>
              <div className="flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black text-slate-900">
                    Thêm biển số xe
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Biển số được dùng khi đặt chỗ, check-in và tra cứu phiên gửi
                    xe.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (plateVehicleTypes.length === 0) {
                      alert("Không có loại xe cần đăng ký biển số");
                      return;
                    }

                    setShowAddPlateModal(true);
                    setAddPlateVehicleTypeId(plateVehicleTypes[0]?.id || "");
                  }}
                  className="rounded-xl bg-indigo-600 px-5 py-3 text-xs font-extrabold text-white shadow-md shadow-indigo-600/15 transition-colors hover:bg-indigo-700 cursor-pointer"
                >
                  + Thêm biển số
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== FORM ĐĂNG KÝ ===== */}
      {showPassModal && selectedPlan && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-cyan-100 bg-white shadow-2xl shadow-slate-950/30">
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-200/50 blur-3xl" />
            <div className="absolute -left-16 -bottom-16 h-44 w-44 rounded-full bg-amber-200/50 blur-3xl" />

            <div className="relative border-b border-slate-100 bg-slate-950 px-6 py-5 text-white">
              <button
                type="button"
                onClick={() => {
                  setShowPassModal(false);
                  setSelectedPlan(null);
                  setRegPlate("");
                  setPlateInputMode("MANAGED");
                }}
                className="absolute right-5 top-5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-black text-white transition hover:bg-white/20"
              >
                Đóng
              </button>

              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                Secure checkout
              </p>

              <h4 className="mt-2 pr-20 text-xl font-black">
                Đăng ký {PASS_TYPE_INFO[selectedPassType].label}
              </h4>

              <p className="mt-1 text-xs font-semibold text-slate-400">
                {selectedPlan.vehicleTypeName} ·{" "}
                {selectedPlan.buildingName || "Smart Parking"}
              </p>
            </div>

            <form onSubmit={handleRegister} className="relative space-y-6 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Loại gói
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-950">
                    {PASS_TYPE_INFO[selectedPassType].label}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Thời hạn: {PASS_TYPE_INFO[selectedPassType].months} tháng
                  </p>
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                    Tổng thanh toán
                  </p>
                  <p className="mt-2 text-2xl font-black text-indigo-700">
                    {calcFee(
                      selectedPlan.monthlyPrice,
                      selectedPassType,
                    ).toLocaleString("vi-VN")}
                    đ
                  </p>
                  <p className="mt-1 text-xs font-semibold text-indigo-400">
                    Tính theo bảng giá MONTHLY thật từ backend
                  </p>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {selectedPlanIsBicycle
                    ? "Mã xe đạp tự động"
                    : "Chọn biển số xe đã quản lý"}
                </label>

                <div className="space-y-3">
                  {selectedPlanIsBicycle ? (
                    <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-xs font-bold leading-6 text-cyan-800">
                      {BICYCLE_IDENTIFIER_HINT}
                      <br />
                      Mã này sẽ được lưu vào gói sau khi tạo đơn, ví dụ:{" "}
                      <span className="font-mono font-black">BC260701-0001</span>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => {
                            setPlateInputMode("MANAGED");
                            setRegPlate(
                              selectedPlanPlateOptions[0]?.licensePlate || "",
                            );
                          }}
                          disabled={selectedPlanPlateOptions.length === 0}
                          className={`rounded-2xl border px-4 py-3 text-left text-xs font-black transition ${plateInputMode === "MANAGED"
                            ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          Chọn biển số đã quản lý
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setPlateInputMode("MANUAL");
                            setRegPlate("");
                          }}
                          className={`rounded-2xl border px-4 py-3 text-left text-xs font-black transition ${plateInputMode === "MANUAL"
                            ? "border-cyan-400 bg-cyan-50 text-cyan-700"
                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                            }`}
                        >
                          Nhập biển số mới
                        </button>
                      </div>

                      {plateInputMode === "MANAGED" ? (
                        selectedPlanPlateOptions.length > 0 ? (
                          <select
                            value={regPlate}
                            onChange={(e) => setRegPlate(e.target.value)}
                            required
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm font-black tracking-wider text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                          >
                            <option value="">-- Chọn biển số --</option>
                            {selectedPlanPlateOptions.map((plate) => {
                              const vehicleTypeName =
                                plate.vehicleTypeName ||
                                plate.vehicleType?.name ||
                                selectedPlan?.vehicleTypeName ||
                                "Xe";

                              return (
                                <option
                                  key={plate.licensePlate}
                                  value={plate.licensePlate}
                                >
                                  {formatLicensePlate(
                                    plate.licensePlate,
                                    vehicleTypeName,
                                  )}{" "}
                                  · {vehicleTypeName}
                                </option>
                              );
                            })}
                          </select>
                        ) : (
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-700">
                            Bạn chưa có biển số nào trong hồ sơ. Hãy chọn “Nhập
                            biển số mới” để mua gói và tự động thêm biển số vào
                            tài khoản.
                          </div>
                        )
                      ) : (
                        <input
                          type="text"
                          value={regPlate}
                          onChange={(e) =>
                            setRegPlate(normalizePlateInput(e.target.value))
                          }
                          placeholder="Ví dụ: 51F-123.45 hoặc 30A-12345"
                          required
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm font-black tracking-wider text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
                        />
                      )}

                      <p className="text-[10px] font-semibold text-slate-400">
                        Nếu nhập biển số mới, hệ thống sẽ tự thêm biển số vào
                        danh sách quản lý xe trước khi đăng ký gói.
                      </p>

                      <p className="mt-2 text-[10px] font-semibold text-slate-400">
                        Chỉ được mua gói cho biển số đã liên kết với tài khoản
                        Driver.
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowPassModal(false);
                    setSelectedPlan(null);
                    setRegPlate("");
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500 transition hover:bg-slate-50"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={submitting || (!selectedPlanIsBicycle && !regPlate)}
                  className="rounded-xl bg-indigo-600 px-7 py-3 text-xs font-black uppercase tracking-[0.14em] text-white shadow-xl shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Đang xử lý..." : "Xác nhận đăng ký"}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                * Gói sẽ ở trạng thái chờ thanh toán. Link VNPay thật phụ thuộc
                module Payment của team.
              </p>
            </form>
          </div>
        </div>
      )}

      {profileSectionTab === "PENDING" && (
        pendingPasses.length > 0 ? (
          <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-6 md:p-8">
            <h4 className="text-sm font-extrabold text-amber-900 uppercase tracking-[0.18em]">
              Đơn chờ thanh toán ({pendingPasses.length})
            </h4>
            <p className="mt-1 text-xs font-medium text-amber-700/70">
              Các gói này đã tạo đơn nhưng chưa được VNPay xác nhận thanh toán
              thành công.
            </p>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingPasses.map((pass) => (
                <div
                  key={pass.id}
                  className="rounded-2xl border border-amber-200 bg-white p-5 text-xs shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                        Pending Payment
                      </p>
                      <p className="mt-2 text-base font-black text-slate-900">
                        {PASS_TYPE_INFO[pass.passType]?.label || pass.passType}
                      </p>
                      <p className="mt-1 font-mono font-black tracking-wider text-slate-600">
                        {formatLicensePlate(
                          pass.licensePlate,
                          pass.vehicleTypeName || pass.vehicleType?.name,
                        )}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-amber-700">
                      Chờ thanh toán
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-amber-100 pt-4">
                    <span className="font-bold text-slate-500">Số tiền</span>
                    <span className="text-sm font-black text-slate-950">
                      {Number(pass.fee || 0).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleContinuePayment(pass.id)}
                      className="w-full rounded-xl bg-amber-600 px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-amber-700 disabled:opacity-50 cursor-pointer"
                    >
                      Thanh toán tiếp qua VNPay
                    </button>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleCancelPendingPayment(pass.id)}
                      className="w-full rounded-xl border border-rose-200 bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 cursor-pointer"
                    >
                      Hủy thanh toán
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyProfileSection
            title="Không có đơn chờ thanh toán"
            description="Các đơn mua gói chưa thanh toán sẽ xuất hiện tại đây."
          />
        )
      )}
      {/* ===== VÉ ĐÃ MUA ===== */}
      {profileSectionTab === "ACTIVE_PASSES" && (
        activePasses.length > 0 ? (
          (() => {
            const currentActivePassGroupKey = selectedActivePassGroupKey || groupedActivePasses[0]?.key;
            const currentActiveGroup = groupedActivePasses.find((g) => g.key === currentActivePassGroupKey) || groupedActivePasses[0];

            return (
              <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 md:p-8 animate-fadeIn">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-[0.18em]">
                      Gói đang hoạt động ({activePasses.length})
                    </h4>
                    <p className="mt-1 text-xs font-medium text-slate-400">
                      Chọn loại xe để xem chi tiết các gói đăng ký tương ứng.
                    </p>
                  </div>
                </div>

                {/* Grid of vehicle types */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {groupedActivePasses.map((group) => {
                    const isActive = group.key === currentActivePassGroupKey;
                    return (
                      <button
                        key={group.key}
                        type="button"
                        onClick={() => setSelectedActivePassGroupKey(group.key)}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-center cursor-pointer ${
                          isActive
                            ? "border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-350 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-xs font-black uppercase tracking-widest">
                          {group.label}
                        </span>
                        <span className={`mt-2 rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                          isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}>
                          {group.passes.length} gói
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Group Passes */}
                {currentActiveGroup && (
                  <div className="space-y-4 animate-fadeIn" key={currentActiveGroup.key}>
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <div>
                        <h5 className="text-sm font-black uppercase tracking-[0.12em] text-slate-900">
                          {currentActiveGroup.label}
                        </h5>
                        <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                          Các gói đang hoạt động dành cho {currentActiveGroup.label.toLowerCase()}
                        </p>
                      </div>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black text-blue-600">
                        {currentActiveGroup.passes.length} gói
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {currentActiveGroup.passes.map((pass) => {
                        const info =
                          PASS_TYPE_INFO[pass.passType] || PASS_TYPE_INFO.MONTHLY;

                        const vehicleTypeName =
                          pass.vehicleTypeName ||
                          pass.vehicleType?.name ||
                          currentActiveGroup.label;

                        const daysLeft = Math.max(
                          0,
                          Math.ceil(
                            (new Date(pass.endDate) - new Date()) /
                            (1000 * 60 * 60 * 24),
                          ),
                        );

                        return (
                          <button
                            type="button"
                            key={pass.id}
                            onClick={() => setSelectedPassDetail(pass)}
                            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${info.color} p-6 text-left text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-2xl active:scale-[0.98] cursor-pointer`}
                          >
                            <div className="absolute right-0 top-0 -mr-10 -mt-10 h-28 w-28 rounded-full bg-white/10 blur-xl" />

                            <div className="mb-4 flex items-start justify-between">
                              <div>
                                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">
                                  {info.label}
                                </span>

                                <p className="mt-2 text-lg font-black">
                                  {vehicleTypeName}
                                </p>
                              </div>

                              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-xs font-black tracking-widest text-white">
                                {info.code}
                              </span>
                            </div>

                            <div className="space-y-1 text-xs font-semibold text-white/85">
                              <p>
                                Biển số:{" "}
                                <span className="font-mono font-black text-white">
                                  {formatLicensePlate(
                                    pass.licensePlate,
                                    vehicleTypeName,
                                  )}
                                </span>
                              </p>

                              <p>
                                Hiệu lực:{" "}
                                {new Date(pass.startDate).toLocaleDateString("vi-VN")} →{" "}
                                {new Date(pass.endDate).toLocaleDateString("vi-VN")}
                              </p>

                              <p>
                                Phí:{" "}
                                <span className="font-black text-white">
                                  {Number(pass.fee || 0).toLocaleString("vi-VN")}đ
                                </span>
                              </p>
                            </div>

                            <div className="mt-4 flex items-center gap-2">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
                                <div
                                  className="h-full rounded-full bg-white/80 transition-all"
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      (daysLeft / (info.months * 30)) * 100,
                                    )}%`,
                                  }}
                                />
                              </div>

                              <span className="text-[10px] font-black">
                                {daysLeft} ngày
                              </span>
                            </div>

                            <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-white/70">
                              Nhấn để xem chi tiết
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          <EmptyProfileSection
            title="Chưa có gói đang hoạt động"
            description="Các gói gửi xe đã thanh toán và còn hiệu lực sẽ hiển thị tại đây."
          />
        )
      )}



      {profileSectionTab === "EXPIRED" && (
        expiredPasses.length > 0 ? (
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm shadow-slate-200/70">
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-rose-50/40 p-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-rose-500">
                  Expired / Cancelled Passes
                </p>

                <h4 className="mt-1 text-xl font-black text-slate-950">
                  Gói hết hạn / đã hủy
                </h4>

                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Danh sách các gói không còn hiệu lực hoặc đã bị hủy thanh toán.
                </p>
              </div>

              <span className="w-fit rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-rose-600">
                {expiredPasses.length} gói
              </span>
            </div>

            <div className="space-y-3 bg-slate-50/60 p-4 md:p-5">
              {visibleExpiredPasses.map((pass) => {
                const vehicleTypeName =
                  pass.vehicleTypeName || pass.vehicleType?.name || "Xe";

                const passLabel =
                  PASS_TYPE_INFO[pass.passType]?.label || pass.passType;

                const startDate = pass.startDate
                  ? new Date(pass.startDate).toLocaleDateString("vi-VN")
                  : "--";

                const endDate = pass.endDate
                  ? new Date(pass.endDate).toLocaleDateString("vi-VN")
                  : "--";

                return (
                  <div
                    key={pass.id}
                    className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-100 hover:shadow-lg hover:shadow-slate-200/70 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-[10px] font-black uppercase tracking-widest text-rose-500">
                        OLD
                      </span>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-black text-slate-900">
                            {vehicleTypeName}
                          </p>

                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-500">
                            {passLabel}
                          </span>
                        </div>

                        <p className="mt-2 font-mono text-xs font-black tracking-wider text-slate-700">
                          {formatLicensePlate(pass.licensePlate, vehicleTypeName)}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-400">
                          <span>
                            Bắt đầu:{" "}
                            <span className="font-black text-slate-600">
                              {startDate}
                            </span>
                          </span>

                          <span className="hidden text-slate-300 sm:inline">
                            •
                          </span>

                          <span>
                            Kết thúc:{" "}
                            <span className="font-black text-slate-600">
                              {endDate}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0">
                      <span className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-rose-600">
                        {pass.status}
                      </span>

                      <span className="text-right text-[11px] font-bold text-slate-400">
                        Không còn hiệu lực
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalExpiredPassesPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 bg-white px-6 py-4">
                <div className="text-xs font-semibold text-slate-500">
                  Trang <span className="font-bold text-slate-800">{currentExpiredPassesPage}</span> / <span className="font-bold text-slate-850">{totalExpiredPassesPages}</span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentExpiredPassesPage === 1}
                    onClick={() => setExpiredPassesPage(1)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
                  >
                    «
                  </button>
                  
                  <button
                    type="button"
                    disabled={currentExpiredPassesPage === 1}
                    onClick={() => setExpiredPassesPage((prev) => Math.max(prev - 1, 1))}
                    className="flex h-9 px-3 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
                  >
                    Trước
                  </button>

                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    let start = Math.max(1, currentExpiredPassesPage - 2);
                    let end = Math.min(totalExpiredPassesPages, start + maxVisible - 1);
                    
                    if (end - start < maxVisible - 1) {
                      start = Math.max(1, end - maxVisible + 1);
                    }

                    for (let p = start; p <= end; p++) {
                      pages.push(
                        <button
                          key={p}
                          type="button"
                          onClick={() => setExpiredPassesPage(p)}
                          className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black transition-all cursor-pointer ${
                            currentExpiredPassesPage === p
                              ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    }
                    return pages;
                  })()}

                  <button
                    type="button"
                    disabled={currentExpiredPassesPage === totalExpiredPassesPages}
                    onClick={() => setExpiredPassesPage((prev) => Math.min(prev + 1, totalExpiredPassesPages))}
                    className="flex h-9 px-3 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
                  >
                    Sau
                  </button>
                  
                  <button
                    type="button"
                    disabled={currentExpiredPassesPage === totalExpiredPassesPages}
                    onClick={() => setExpiredPassesPage(totalExpiredPassesPages)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer"
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyProfileSection
            title="Chưa có gói cũ"
            description="Gói hết hạn, đã hủy hoặc không còn hiệu lực sẽ nằm ở đây."
          />
        )
      )}


      {selectedPassDetail && (
        <ParkingPassDetailModal
          pass={selectedPassDetail}
          onClose={() => setSelectedPassDetail(null)}
        />
      )}

      {selectedVehicleDetail && (
        <VehiclePassHistoryModal
          vehicle={selectedVehicleDetail}
          passes={getVehiclePassHistory(selectedVehicleDetail)}
          onClose={() => setSelectedVehicleDetail(null)}
          onSelectPass={(pass) => {
            setSelectedVehicleDetail(null);
            setSelectedPassDetail(pass);
          }}
        />
      )}

      {showAddPlateModal && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-indigo-100 bg-white shadow-2xl shadow-slate-950/30">
            <div className="flex items-start justify-between bg-slate-950 px-6 py-5 text-white">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-200">
                  Thêm biển số xe
                </p>
                <h4 className="mt-2 text-xl font-black">Thêm biển số xe</h4>
                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Biển số sẽ được kiểm tra và chuẩn hóa trước khi lưu vào tài
                  khoản.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddPlateModal(false)}
                className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-black text-white transition hover:bg-white/20"
              >
                Đóng
              </button>
            </div>

            <form onSubmit={handleAddPlateFromPopup} className="space-y-4 p-6">
              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Biển số xe
                </span>

                <input
                  type="text"
                  value={newPlateInput}
                  onChange={(e) =>
                    setNewPlateInput(normalizePlateInput(e.target.value))
                  }
                  placeholder="Ví dụ: 51F-123.45 hoặc 51F12345"
                  required
                  autoFocus
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm font-black uppercase tracking-wider text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Loại xe
                </span>

                <select
                  value={addPlateVehicleTypeId}
                  onChange={(e) => setAddPlateVehicleTypeId(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                >
                  <option value="">-- Chọn loại xe --</option>
                  {plateVehicleTypes.map((vehicleType) => (
                    <option key={vehicleType.id} value={vehicleType.id}>
                      {vehicleType.displayName}
                    </option>
                  ))}
                </select>
              </label>

              <p className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-[11px] font-semibold leading-5 text-slate-500">
                Hệ thống sẽ lưu biển số kèm loại xe để chỉ đề xuất đúng xe khi
                mua gói hoặc đặt chỗ.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPlateModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-600 transition hover:bg-slate-50"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-3 text-xs font-black text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700"
                >
                  Lưu biển số
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyProfileSection({ title, description }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
      <h4 className="text-sm font-black text-slate-900">
        {title}
      </h4>

      <p className="mx-auto mt-2 max-w-md text-xs font-semibold leading-6 text-slate-400">
        {description}
      </p>
    </div>
  );
}


function VehiclePassHistoryModal({
  vehicle,
  passes,
  onClose,
  onSelectPass,
}) {
  if (!vehicle) return null;

  const vehicleTypeName = vehicle.vehicleTypeName || "Chưa gán loại xe";

  const isBicycle = isBicycleVehicleTypeName(vehicleTypeName);

  const identifierLabel = isBicycle ? "Mã xe đạp" : "Biển số";

  const identifierValue = formatLicensePlate(
    vehicle.licensePlate,
    vehicleTypeName,
  );

  const statusInfo = {
    ACTIVE: {
      label: "Đang hoạt động",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    PENDING_PAYMENT: {
      label: "Chờ thanh toán",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    EXPIRED: {
      label: "Đã hết hạn",
      className: "bg-slate-100 text-slate-600 border-slate-200",
    },
    CANCELLED: {
      label: "Đã hủy",
      className: "bg-rose-50 text-rose-600 border-rose-200",
    },
  };

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between bg-gradient-to-r from-slate-950 to-slate-800 px-6 py-5 text-white">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
              Vehicle Package History
            </p>

            <h4 className="mt-2 text-xl font-black">
              Lịch sử gói của phương tiện
            </h4>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 font-mono text-sm font-black tracking-wider">
                {identifierValue}
              </span>

              <span className="text-xs font-bold text-slate-300">
                {identifierLabel} · {vehicleTypeName}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/10 px-3 py-2 text-sm font-black transition hover:bg-white/20"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h5 className="text-sm font-black uppercase tracking-wider text-slate-900">
                Các gói đã đăng ký
              </h5>

              <p className="mt-1 text-xs font-semibold text-slate-400">
                Bao gồm gói đang hoạt động, chờ thanh toán, hết hạn và đã hủy.
              </p>
            </div>

            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-600">
              {passes.length} gói
            </span>
          </div>

          {passes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
              <h5 className="mt-3 text-sm font-black text-slate-800">
                Chưa từng đăng ký gói
              </h5>

              <p className="mt-1 text-xs font-semibold text-slate-400">
                Phương tiện này chưa có lịch sử đăng ký gói gửi xe.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {passes.map((pass) => {
                const passInfo =
                  PASS_TYPE_INFO[pass.passType] || PASS_TYPE_INFO.MONTHLY;

                const status =
                  statusInfo[pass.status] || {
                    label: pass.status || "Không xác định",
                    className:
                      "bg-slate-100 text-slate-600 border-slate-200",
                  };

                const startDate = pass.startDate
                  ? new Date(pass.startDate).toLocaleDateString("vi-VN")
                  : "--";

                const endDate = pass.endDate
                  ? new Date(pass.endDate).toLocaleDateString("vi-VN")
                  : "--";

                return (
                  <button
                    type="button"
                    key={pass.id || pass.passId}
                    onClick={() => onSelectPass(pass)}
                    className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                  >
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-black text-slate-900">
                            {passInfo.label || pass.passType}
                          </span>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <p className="mt-2 text-xs font-bold text-slate-500">
                          {pass.buildingName || "Chưa xác định bãi đỗ"}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          Hiệu lực: {startDate} → {endDate}
                        </p>

                        {pass.parkingPassCode && (
                          <p className="mt-1 font-mono text-[10px] font-bold text-indigo-500">
                            Mã gói: {pass.parkingPassCode}
                          </p>
                        )}
                      </div>

                      <div className="sm:text-right">
                        <p className="text-sm font-black text-slate-900">
                          {Number(pass.fee || 0).toLocaleString("vi-VN")}đ
                        </p>

                        <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-indigo-500">
                          Xem chi tiết →
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-slate-700"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function ParkingPassDetailModal({ pass, onClose }) {
  if (!pass) return null;

  const info = PASS_TYPE_INFO[pass.passType] || PASS_TYPE_INFO.MONTHLY;
  const vehicleTypeName =
    pass.vehicleTypeName || pass.vehicleType?.name || pass.vehicleType || "Xe";

  const isBike = isBicycleVehicleTypeName(vehicleTypeName);
  const identifierLabel = isBike ? "Mã xe đạp" : "Biển số";
  const identifierValue = formatLicensePlate(pass.licensePlate, vehicleTypeName);

  const startDate = pass.startDate
    ? new Date(pass.startDate).toLocaleDateString("vi-VN")
    : "--";

  const endDate = pass.endDate
    ? new Date(pass.endDate).toLocaleDateString("vi-VN")
    : "--";

  const feeText = `${Number(pass.fee || 0).toLocaleString("vi-VN")}đ`;

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(pass.endDate) - new Date()) / (1000 * 60 * 60 * 24)),
  );

  const passCode = pass.parkingPassCode || pass.id || "PP-TEMP";

  const statusClass =
    pass.status === "ACTIVE"
      ? "text-emerald-600"
      : pass.status === "PENDING_PAYMENT"
        ? "text-amber-600"
        : pass.status === "EXPIRED"
          ? "text-slate-600"
          : "text-rose-600";
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-md">
      <div className="relative w-full max-w-xs overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl flex flex-col gap-4 border-t-8 border-t-indigo-600 animate-scale-in">
        {/* Decorative punch holes */}
        <div className="absolute left-0 top-[105px] -ml-2.5 w-5 h-5 rounded-full bg-[#020617] border-r border-slate-200/80 z-10"></div>
        <div className="absolute right-0 top-[105px] -mr-2.5 w-5 h-5 rounded-full bg-[#020617] border-l border-slate-200/80 z-10"></div>

        {/* Close icon button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-655 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Ticket Header */}
        <div className="text-center border-b border-dashed border-slate-200 pb-3">
          <h4 className="font-extrabold text-sm text-slate-800 tracking-wider">
            {info.label.toUpperCase()}
          </h4>
          <p className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider mt-1">
            GÓI GỬI XE ĐỊNH KỲ
          </p>
        </div>

        {/* QR Code at the top - encodes ONLY the monthly pass code starting with PP */}
        <div className="flex flex-col items-center justify-center py-1">
          <div className="p-1.5 bg-white rounded-xl shadow-inner border border-slate-100 flex items-center justify-center">
            <QRCodeCanvas
              value={passCode}
              size={120}
              level="M"
              includeMargin={true}
            />
          </div>
          <span className="font-mono text-[10px] text-slate-600 font-black tracking-wider mt-2 uppercase">
            {passCode}
          </span>
        </div>

        {/* Ticket Details */}
        <div className="space-y-2.5 text-xs font-semibold text-slate-500 pt-1">
          <div className="flex justify-between items-center">
            <span>Mã gói:</span>
            <span className="text-slate-800 font-mono font-black">
              #{passCode}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span>{identifierLabel}:</span>
            <span className="text-slate-850 text-xs font-black tracking-wide uppercase px-2 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono">
              {identifierValue}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Loại xe:</span>
            <span className="text-slate-800 font-extrabold">
              {vehicleTypeName}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Loại gói:</span>
            <span className="text-slate-800 font-extrabold">
              {info.label || pass.passType}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Hiệu lực:</span>
            <span className="text-slate-800 font-mono font-semibold">
              {startDate} → {endDate}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Còn lại:</span>
            <span className="text-indigo-650 font-extrabold">
              {daysLeft} ngày
            </span>
          </div>

          <div className="flex justify-between">
            <span>Phí gói:</span>
            <span className="text-indigo-650 font-mono font-black">
              {feeText}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Trạng thái:</span>
            <span
              className={`font-extrabold uppercase text-[10px] ${statusClass}`}
            >
              {pass.status || "ACTIVE"}
            </span>
          </div>

          <div className="border-t border-dashed border-slate-200 pt-3 text-center text-[10px] text-slate-400 font-medium leading-normal mt-1">
            Quét mã này tại cổng để check-in tự động.
          </div>
        </div>

        <div className="flex border-t border-slate-100 pt-3 mt-1 shrink-0 animate-pulse">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-slate-250 bg-slate-50 py-2 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer text-center"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function PassInfoRow({ label, value, mono = false, tone = "default" }) {
  const toneClass =
    tone === "primary"
      ? "border-indigo-100 bg-indigo-50/80 text-indigo-800"
      : tone === "status"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : tone === "money"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-white text-slate-800";

  const labelClass =
    tone === "primary"
      ? "text-indigo-500"
      : tone === "status"
        ? "text-emerald-500"
        : tone === "money"
          ? "text-amber-500"
          : "text-slate-400";

  return (
    <div
      className={`rounded-2xl border px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${toneClass}`}
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

function HeroMetric({ label, value, tone = "text-white" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className={`mt-2 text-lg font-black ${tone}`}>{value}</p>
    </div>
  );
}
