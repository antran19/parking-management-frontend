export const APP_THEME = {
  brand: "SmartParking",
  version: "Driver & Admin Portal",
  primary: "#001e40",
  primarySoft: "#eaf2ff",
  surface: "#f7f9fb",
  text: "#0f172a",
};

export const ROLE_LABELS = {
  ADMIN: "Quản trị hệ thống",
  MANAGER: "Quản lý vận hành",
  STAFF: "Nhân viên bãi xe",
  SECURITY: "Bảo vệ / an ninh",
  DRIVER: "Tài xế",
};

export const PERMISSIONS = {
  ADMIN: ["Toàn quyền hệ thống", "Quản lý nhân viên", "Quản lý tài xế", "Cấu hình tầng/khu", "Quản lý bảng giá", "Xem báo cáo tài chính"],
  MANAGER: ["Xem dashboard", "Xem báo cáo", "Điều phối tầng/khu", "Theo dõi doanh thu"],
  STAFF: ["Check-in", "Check-out", "Xác nhận QR", "Cập nhật trạng thái xe"],
  SECURITY: ["Xử lý ngoại lệ", "Mở cổng thủ công", "Ghi nhận sự cố"],
  DRIVER: ["Đặt chỗ", "Mua gói thành viên", "Thanh toán", "Xem lịch sử"],
};

export const VEHICLE_TYPES = [
  { id: "MOTORBIKE", label: "Xe máy", floorIds: ["B2", "B3"], icon: "🏍️" },
  { id: "EBIKE", label: "Xe điện", floorIds: ["B2", "B3"], icon: "🛵" },
  { id: "CAR_2", label: "Ô tô 2 chỗ", floorIds: ["B4", "B5"], icon: "🚗" },
  { id: "CAR_4", label: "Ô tô 4 chỗ", floorIds: ["B4", "B5"], icon: "🚙" },
  { id: "CAR_5", label: "Ô tô 5 chỗ", floorIds: ["B4", "B5"], icon: "🚘" },
  { id: "CAR_7_14", label: "Xe 7 - 14 chỗ", floorIds: ["B1"], icon: "🚐" },
];

export const DEFAULT_FLOORS = [
  {
    id: "B1",
    name: "Tầng B1",
    title: "Xe 7 - 14 chỗ",
    vehicleGroup: "Xe 7 - 14 chỗ",
    gate: "GATE_B1",
    capacity: 72,
    occupied: 38,
    reserved: 8,
    status: "Ổn định",
    zones: ["A", "B", "C", "D"],
    note: "Làn rộng, trần cao, dành cho xe gia đình lớn và xe 7 - 14 chỗ.",
  },
  {
    id: "B2",
    name: "Tầng B2",
    title: "Xe máy & xe điện",
    vehicleGroup: "Xe máy, xe điện",
    gate: "GATE_B2",
    capacity: 210,
    occupied: 126,
    reserved: 22,
    status: "Đang hoạt động",
    zones: ["A", "B", "C", "D"],
    note: "Khu gửi xe hai bánh gần lối lên xuống, phù hợp khách gửi nhanh.",
  },
  {
    id: "B3",
    name: "Tầng B3",
    title: "Xe máy & xe điện",
    vehicleGroup: "Xe máy, xe điện",
    gate: "GATE_B3",
    capacity: 230,
    occupied: 148,
    reserved: 18,
    status: "Thoáng",
    zones: ["A", "B", "C", "D"],
    note: "Sức chứa lớn, ưu tiên xe máy và xe điện trong giờ cao điểm.",
  },
  {
    id: "B4",
    name: "Tầng B4",
    title: "Ô tô 2 - 5 chỗ",
    vehicleGroup: "Ô tô 2 - 5 chỗ",
    gate: "GATE_B4",
    capacity: 98,
    occupied: 55,
    reserved: 11,
    status: "Ổn định",
    zones: ["A", "B", "C", "D"],
    note: "Dành cho xe cá nhân cỡ nhỏ, bố trí lối đi rộng và dễ ra cổng.",
  },
  {
    id: "B5",
    name: "Tầng B5",
    title: "Ô tô 2 - 5 chỗ",
    vehicleGroup: "Ô tô 2 - 5 chỗ",
    gate: "GATE_B5",
    capacity: 104,
    occupied: 69,
    reserved: 9,
    status: "Gần đầy",
    zones: ["A", "B", "C", "D"],
    note: "Khu ô tô 2 - 5 chỗ, thường đông vào cuối ngày nên nên đặt chỗ trước.",
  },
];

export const DEFAULT_MEMBERSHIP_PLANS = [
  {
    id: "MONTHLY",
    name: "Gói tháng",
    durationLabel: "30 ngày",
    months: 1,
    price: 450000,
    highlight: "Phù hợp sử dụng ngắn hạn",
    benefits: ["Không cần trả phí từng lượt", "Có QR vé tháng", "Ưu tiên giữ chỗ trong giờ cao điểm"],
  },
  {
    id: "QUARTERLY",
    name: "Gói quý",
    durationLabel: "90 ngày",
    months: 3,
    price: 1200000,
    popular: true,
    highlight: "Tiết kiệm hơn gói tháng",
    benefits: ["Giảm chi phí trung bình", "QR vé quý", "Ưu tiên khu gần cổng", "Gia hạn nhanh"],
  },
  {
    id: "YEARLY",
    name: "Gói năm",
    durationLabel: "365 ngày",
    months: 12,
    price: 4200000,
    highlight: "Tối ưu cho khách thường xuyên",
    benefits: ["Tiết kiệm nhiều nhất", "Hỗ trợ đổi biển số", "Ưu tiên xử lý sự cố", "Báo cáo lịch sử đầy đủ"],
  },
];

export const DEFAULT_EMPLOYEES = [
  { id: "EMP-001", fullName: "Nguyễn Minh An", email: "admin@smartparking.vn", phone: "0901000001", role: "ADMIN", department: "Hệ thống", status: "ACTIVE", shift: "Full-time", createdAt: "2026-05-20" },
  { id: "EMP-002", fullName: "Lê Duy Tùng", email: "manager@smartparking.vn", phone: "0901000002", role: "MANAGER", department: "Vận hành", status: "ACTIVE", shift: "Ca sáng", createdAt: "2026-05-21" },
  { id: "EMP-003", fullName: "Tá Thiên", email: "staff@smartparking.vn", phone: "0901000003", role: "STAFF", department: "Bãi xe", status: "ACTIVE", shift: "Ca chiều", createdAt: "2026-05-22" },
  { id: "EMP-004", fullName: "Khắc Toàn", email: "security@smartparking.vn", phone: "0901000004", role: "SECURITY", department: "An ninh", status: "LOCKED", shift: "Ca đêm", createdAt: "2026-05-22" },
];

export const DEFAULT_DRIVERS = [
  { id: "DRV-001", fullName: "Ngọc Quảng", phone: "0912000001", email: "quang.driver@example.com", licensePlate: "59A1-123.45", vehicleType: "MOTORBIKE", status: "ACTIVE", memberTier: "QUARTERLY" },
  { id: "DRV-002", fullName: "Trần Gia Bảo", phone: "0912000002", email: "bao.driver@example.com", licensePlate: "51F-888.88", vehicleType: "CAR_5", status: "ACTIVE", memberTier: "MONTHLY" },
  { id: "DRV-003", fullName: "Phạm Hoàng", phone: "0912000003", email: "hoang.driver@example.com", licensePlate: "16B-456.78", vehicleType: "VAN_16", status: "LOCKED", memberTier: "NONE" },
];

export const DEFAULT_VEHICLES = [
  { id: "VEH-001", licensePlate: "59A1-123.45", vehicleType: "MOTORBIKE", brand: "Honda Vision", color: "Đen", default: true },
  { id: "VEH-002", licensePlate: "51F-888.88", vehicleType: "CAR_5", brand: "Toyota Vios", color: "Trắng", default: false },
];

export const DEFAULT_RESERVATIONS = [
  { id: "RSV-1001", licensePlate: "59A1-123.45", vehicleType: "MOTORBIKE", floorId: "A2", zone: "B", startAt: "2026-05-26T18:00", status: "CONFIRMED", qrCode: "SP-RSV-1001", createdAt: "2026-05-26 09:00" },
];

export const DEFAULT_HISTORY = [
  { id: "HIS-001", licensePlate: "59A1-123.45", floorId: "A2", zone: "A", checkIn: "2026-05-24 07:30", checkOut: "2026-05-24 17:10", amount: 18000, status: "COMPLETED" },
  { id: "HIS-002", licensePlate: "51F-888.88", floorId: "B1", zone: "C", checkIn: "2026-05-22 09:12", checkOut: "2026-05-22 12:35", amount: 60000, status: "COMPLETED" },
];

export const DEFAULT_ACTIVITY = [
  "Admin cập nhật capacity tầng B2",
  "Driver tạo đặt chỗ mới tại tầng A2",
  "Staff xác nhận QR vé quý",
  "Hệ thống ghi nhận tầng B2 gần đầy",
];
