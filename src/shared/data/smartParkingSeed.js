export const APP_THEME = {
  brand: "SmartParking",
  version: "Admin & Driver Portal",
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
  MANAGER: ["Xem tổng quan", "Xem báo cáo", "Điều phối tầng/khu", "Theo dõi doanh thu"],
  STAFF: ["Check-in", "Check-out", "Xác nhận QR", "Cập nhật trạng thái xe"],
  SECURITY: ["Xử lý ngoại lệ", "Mở cổng thủ công", "Ghi nhận sự cố"],
  DRIVER: ["Đặt chỗ", "Mua gói thành viên", "Thanh toán", "Xem lịch sử"],
};

export const VEHICLE_TYPES = [
  { id: "BIKE", label: "Xe đạp", floorIds: ["A1"], icon: "🚲" },
  { id: "EBIKE", label: "Xe điện", floorIds: ["A1"], icon: "🛵" },
  { id: "MOTORBIKE", label: "Xe máy", floorIds: ["A2"], icon: "🏍️" },
  { id: "CAR_4", label: "Ô tô 4 chỗ", floorIds: ["B1", "B2"], icon: "🚗" },
  { id: "CAR_5", label: "Ô tô 5 chỗ", floorIds: ["B1", "B2"], icon: "🚙" },
  { id: "CAR_7", label: "Ô tô 7 chỗ", floorIds: ["B1", "B2"], icon: "🚘" },
  { id: "VAN_16", label: "Xe 16 chỗ", floorIds: ["C1"], icon: "🚐" },
];
