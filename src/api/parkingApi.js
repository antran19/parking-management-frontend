import axiosClient from "./axiosClient";

/**
 * parkingApi (Trước đây là staffApi) - Cung cấp tất cả các API kết nối tới Java Spring Boot backend.
 * Được tổ chức khoa học theo đúng chuẩn phân quyền RESTful namespace của hệ thống Enterprise:
 *   - /parking/**: Cấu hình dùng chung
 *   - /driver/**: API dành cho Tài xế (hoặc Staff tra cứu thông tin Driver)
 *   - /staff/**: API tác nghiệp dành riêng cho Nhân viên bãi xe
 */
export const staffApi = {
  // === Cấu hình bãi xe (vehicle types, gates, zones) ===
  getParkingConfig() {
    return axiosClient.get("/parking/config");
  },

  // Lấy dữ liệu thống kê cho Staff Dashboard
  getStaffDashboardStats() {
    return axiosClient.get("/staff/dashboard");
  },

  // === Tác vụ của Nhân viên (Staff) ===
  // Check-in xe vào bãi (UC-04)
  checkIn(data) {
    return axiosClient.post("/staff/sessions/checkin", data);
  },

  // Check-out xe ra bãi (UC-05)
  checkOut(data) {
    return axiosClient.post("/staff/sessions/checkout", data);
  },

  // Check-in xe vào Zone (Check-in lần 2)
  zoneEntry(data) {
    return axiosClient.post("/staff/sessions/zone-entry", data);
  },

  // Check-out xe ra khỏi Zone (Check-out lần 2)
  zoneExit(data) {
    return axiosClient.post("/staff/sessions/zone-exit", data);
  },

  // Lấy danh sách phân khu khả dụng để thay đổi gợi ý
  getEligibleZones(sessionId) {
    return axiosClient.get(`/staff/sessions/${sessionId}/eligible-zones`);
  },

  // Thay đổi phân khu đỗ xe chỉ định cho session
  changeZone(sessionId, zoneId) {
    return axiosClient.put(`/staff/sessions/${sessionId}/change-zone?zoneId=${zoneId}`);
  },

  // Cập nhật URL ảnh lên Cloudinary sau khi check-in/out thành công
  updateSessionImages(sessionId, data) {
    return axiosClient.put(`/staff/sessions/${sessionId}/images`, data);
  },

  // === Tác vụ của Tài xế (Driver) / Tra cứu session ===
  // Tra cứu session đang hoạt động
  getActiveSession(licensePlate, code = null, vehicleTypeId = null) {
    let url = `/driver/sessions/active?`;
    const params = [];
    if (licensePlate) params.push(`plate=${encodeURIComponent(licensePlate)}`);
    if (code) params.push(`code=${encodeURIComponent(code)}`);
    if (vehicleTypeId) params.push(`vehicleTypeId=${encodeURIComponent(vehicleTypeId)}`);
    return axiosClient.get(url + params.join("&"));
  },

  // Xác nhận thanh toán chuyển khoản (Real-time)
  confirmPayment(data) {
    return axiosClient.post("/driver/payments/confirm", data);
  },

  // Khởi tạo thanh toán VNPay sandbox cho driver check-out
  initiateVnPayCheckout(data) {
    return axiosClient.post("/driver/sessions/checkout/vnpay", data);
  },

  // Lịch sử gửi xe theo biển số
  getSessionHistory(licensePlate) {
    return axiosClient.get(`/driver/sessions/history?plate=${encodeURIComponent(licensePlate)}`);
  },

  // === Quản lý biển số xe cá nhân của Tài xế (Driver) — Lưu DB ===
  getDriverPlates() {
    return axiosClient.get("/driver/plates");
  },

  // === thêm biển số xe và loại xe
  addDriverPlate(licensePlate, vehicleTypeId) {
    return axiosClient.post("/driver/plates", { licensePlate, vehicleTypeId });
  },

  deleteDriverPlate(licensePlate) {
    return axiosClient.delete(`/driver/plates?plate=${encodeURIComponent(licensePlate)}`);
  },

  createReservation(data) {
    return axiosClient.post("/driver/reservations", data);
  },

  getDriverReservations() {
    return axiosClient.get("/driver/reservations");
  },

  cancelReservation(reservationId) {
    return axiosClient.delete(`/driver/reservations/${reservationId}`);
  },

  // === Vé gửi xe theo gói (Parking Pass) cho Driver ===
  getDriverPasses() {
    return axiosClient.get("/driver/parking-passes");
  },

  getDriverPricingPlans() {
    return axiosClient.get("/driver/pricing-plans");
  },

  registerDriverPass(data) {
    return axiosClient.post("/driver/parking-passes", data);
  },

  continueDriverPassPayment(passId) {
    return axiosClient.post(`/driver/parking-passes/${passId}/pay`);
  },

  cancelDriverPass(passId) {
    return axiosClient.delete(`/driver/parking-passes/${passId}/cancel`);
  },

  getVnPayPassReturn(queryString) {
    return axiosClient.get(`/driver/payments/vnpay-return${queryString}`);
  },

  getAdminUsers() {
    return axiosClient.get("/admin/users");
  },

  createAdminUser(data) {
    return axiosClient.post("/admin/users", data);
  },

  updateAdminUser(id, data) {
    return axiosClient.put(`/admin/users/${id}`, data);
  },

  deleteAdminUser(id) {
    return axiosClient.delete(`/admin/users/${id}`);
  },

  resetAdminUserPassword(id, data) {
    return axiosClient.post(`/admin/users/${id}/reset-password`, data);
  },

  getAdminPayments() {
    return axiosClient.get("/admin/payments");
  },

  createZone(data) {
    return axiosClient.post("/admin/zones", data);
  },

  updateZone(id, data) {
    return axiosClient.put(`/admin/zones/${id}`, data);
  },

  deleteZone(id) {
    return axiosClient.delete(`/admin/zones/${id}`);
  },

  createGate(data) {
    return axiosClient.post("/admin/gates", data);
  },

  updateGate(id, data) {
    return axiosClient.put(`/admin/gates/${id}`, data);
  },

  deleteGate(id) {
    return axiosClient.delete(`/admin/gates/${id}`);
  },

  controlBarrier(id, state) {
    return axiosClient.put(`/admin/gates/${id}/barrier`, { state });
  },

  createPricingRule(data) {
    return axiosClient.post("/admin/pricing-rules", data);
  },

  updatePricingRule(id, data) {
    return axiosClient.put(`/admin/pricing-rules/${id}`, data);
  },

  deletePricingRule(id) {
    return axiosClient.delete(`/admin/pricing-rules/${id}`);
  },

  getParkingPasses() {
    return axiosClient.get("/admin/parking-passes");
  },

  createParkingPass(data) {
    return axiosClient.post("/admin/parking-passes", data);
  },

  updateParkingPass(id, data) {
    return axiosClient.put(`/admin/parking-passes/${id}`, data);
  },

  deleteParkingPass(id) {
    return axiosClient.delete(`/admin/parking-passes/${id}`);
  },

  renewParkingPass(id) {
    return axiosClient.post(`/admin/parking-passes/${id}/renew`);
  },

  getAdminSettings() {
    return axiosClient.get("/admin/settings");
  },

  updateAdminSettings(data) {
    return axiosClient.put("/admin/settings", data);
  },

  getMyPermissions() {
    return axiosClient.get("/me/permissions");
  },

  // === Cấu hình hạ tầng (MỚI — theo góp ý giảng viên 18/07) ===
  // Buildings
  getBuildings() {
    return axiosClient.get("/admin/buildings");
  },
  createBuilding(data) {
    return axiosClient.post("/admin/buildings", data);
  },
  updateBuilding(id, data) {
    return axiosClient.put(`/admin/buildings/${id}`, data);
  },
  deleteBuilding(id) {
    return axiosClient.delete(`/admin/buildings/${id}`);
  },

  // Floors
  getFloors(buildingId) {
    const params = buildingId ? { buildingId } : {};
    return axiosClient.get("/admin/floors", { params });
  },
  createFloor(data) {
    return axiosClient.post("/admin/floors", data);
  },
  updateFloor(id, data) {
    return axiosClient.put(`/admin/floors/${id}`, data);
  },
  deleteFloor(id) {
    return axiosClient.delete(`/admin/floors/${id}`);
  },

  // Quy hoạch zone theo diện tích tầng
  getFloorCapacitySummary(floorId) {
    return axiosClient.get(`/admin/floors/${floorId}/capacity-summary`);
  },
  previewFloorZones(floorId, data) {
    return axiosClient.post(`/admin/floors/${floorId}/zones/preview`, data);
  },
  generateFloorZones(floorId, data) {
    return axiosClient.post(`/admin/floors/${floorId}/zones/generate`, data);
  },

  // Vehicle Types
  getVehicleTypes() {
    return axiosClient.get("/admin/vehicle-types");
  },
  createVehicleType(data) {
    return axiosClient.post("/admin/vehicle-types", data);
  },
  updateVehicleType(id, data) {
    return axiosClient.put(`/admin/vehicle-types/${id}`, data);
  },
  deleteVehicleType(id) {
    return axiosClient.delete(`/admin/vehicle-types/${id}`);
  },

  // Auto-calculate slots: maxSlots = floor(zoneArea / slotAreaSqm)
  calculateSlots(data) {
    return axiosClient.post("/admin/calculate-slots", data);
  },

  // === Quản lý toàn bộ phiên gửi xe dành cho Staff/Manager — Lưu DB ===
  getAllSessionsHistory(params) {
    return axiosClient.get("/staff/sessions/history", { params });
  },

  getAllReservations(params) {
    return axiosClient.get("/staff/reservations", { params });
  },

  // === Quản lý Exception Logs dành cho Security & Admin — Lưu DB thật ===
  logSecurityException(data) {
    return axiosClient.post("/security/exceptions", data);
  },

  getSecurityExceptions() {
    return axiosClient.get("/security/exceptions");
  },

  updateSecurityException(id, data) {
    return axiosClient.put(`/security/exceptions/${id}`, data);
  },

  resolveSecurityException(id, data) {
    return axiosClient.put(`/security/exceptions/${id}/resolve`, data);
  },

  // === Phiên đỗ xe của Staff ===
  getActiveSessionByPlate(licensePlate) {
    return axiosClient.get(`/staff/sessions/active?plate=${encodeURIComponent(licensePlate)}`);
  },

  // === Emergency SOS Mode — Security/Manager/Admin ===
  activateEmergency(data) {
    return axiosClient.post("/security/emergency/activate", data);
  },

  deactivateEmergency(data) {
    return axiosClient.post("/security/emergency/deactivate", data);
  },

  getEmergencyStatus() {
    return axiosClient.get("/emergency/status");
  },

  getEmergencyHistory() {
    return axiosClient.get("/security/emergency/history");
  },

  getEmergencySettings() {
    return axiosClient.get("/security/emergency/settings");
  },

  updateEmergencySettings(data) {
    return axiosClient.put("/security/emergency/settings", data);
  },

  // === Blacklist Plates — Security/Manager/Admin ===
  getBlacklist() {
    return axiosClient.get("/security/blacklist");
  },
  removeFromBlacklist(id, data) {
    return axiosClient.put(`/manager/blacklist/${id}/status`, data);
  },

  addBlacklistPlate(data) {
    return axiosClient.post("/security/blacklist", data);
  },

  removeBlacklistPlate(id, data) {
    return axiosClient.delete(`/security/blacklist/${id}`, { data });
  },

  updateBlacklistPlate(id, data) {
    return axiosClient.put(`/security/blacklist/${id}`, data);
  },
};

export default staffApi;
// === API DÀNH RIÊNG CHO MANAGER ===
export const managerApi = {
  getMyPermissions() {
    return axiosClient.get("/me/permissions");
  },
  // Tổng quan
  getDashboard() {
    return axiosClient.get("/manager/dashboard");
  },

  // Doanh thu
  getRevenue(params) {
    // params: { type, from, to }
    return axiosClient.get("/manager/dashboard/revenue", { params });
  },

  // Lượt gửi xe
  getVisits(params) {
    // params: { type, from, to }
    return axiosClient.get("/manager/dashboard/visits", { params });
  },

  // Công suất
  getBuildingOccupancy(buildingId) {
    return axiosClient.get(`/manager/dashboard/buildings/${buildingId}/occupancy`);
  },
  getFloorOccupancy(floorId) {
    return axiosClient.get(`/manager/dashboard/floors/${floorId}/occupancy`);
  },

  // Thanh toán
  getPayments() {
    return axiosClient.get("/manager/dashboard/payments");
  },
  getPaymentDetail(id) {
    return axiosClient.get(`/manager/dashboard/payments/${id}`);
  },

  // An ninh
  getSecuritySummary(params) {
    return axiosClient.get("/manager/security/summary", { params });
  },
  getSecurityIncidents(params) {
    return axiosClient.get("/manager/security/incidents", { params });
  },
  getSecurityIncidentDetail(id) {
    return axiosClient.get(`/manager/security/incidents/${id}`);
  },
  resolveIncident(id, data) {
    return axiosClient.put(`/security/exceptions/${id}/resolve`, data);
  },
  getBlacklist() {
    return axiosClient.get("/manager/blacklist");
  },
  removeFromBlacklist(id, data) {
    return axiosClient.put(`/manager/blacklist/${id}/status`, data);
  },

  // === CRUD TÀI NGUYÊN (Zone, PricingRule, Gate) ===
  // Zone
  createZone(data) {
    return axiosClient.post("/manager/zones", data);
  },
  updateZone(id, data) {
    return axiosClient.put(`/manager/zones/${id}`, data);
  },
  deleteZone(id) {
    return axiosClient.delete(`/manager/zones/${id}`);
  },

  // PricingRule
  createPricingRule(data) {
    return axiosClient.post("/manager/pricing-rules", data);
  },
  updatePricingRule(id, data) {
    return axiosClient.put(`/manager/pricing-rules/${id}`, data);
  },
  deletePricingRule(id) {
    return axiosClient.delete(`/manager/pricing-rules/${id}`);
  },

  // Gate
  createGate(data) {
    return axiosClient.post("/manager/gate", data);
  },
  updateGate(id, data) {
    return axiosClient.put(`/manager/gate/${id}`, data);
  },
  deleteGate(id) {
    return axiosClient.delete(`/manager/gate/${id}`);
  }



};
