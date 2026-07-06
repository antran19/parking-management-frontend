# 🏗️ ADMIN DASHBOARD — LUỒNG DỮ LIỆU CHI TIẾT

---

## 1. KIẾN TRÚC TỔNG QUAN

```
React (AdminDashboard.jsx — Layout Controller)
   ↓ quản lý state + routing giữa 10 tab component
   ↓ mỗi tab là 1 file riêng (AdminUsers.jsx, AdminZones.jsx, ...)
   ↓ gọi hàm staffApi.xxx()
Axios Interceptor (axiosClient.js)
   ↓ tự gắn JWT Bearer token
HTTP Request → Spring Boot Controller
   ↓ JwtAuthFilter kiểm tra token
   ↓ @PreAuthorize kiểm tra role
AdminManagementController.java
   ↓ xử lý nghiệp vụ
JPA Repository → PostgreSQL
   ↓ trả về Entity
Controller chuyển Entity → Map (DTO thủ công)
   ↓ Jackson serialize → JSON
HTTP Response → Axios → React State → UI
```

| Tầng | File chính | Vai trò |
|------|-----------|---------|
| Layout Controller | `AdminDashboard.jsx` (~1574 dòng) | Sidebar, state, modals, routing giữa tabs |
| Tab Components | `AdminOverview.jsx` (6.4KB) | Dashboard stats, zone occupancy, barrier control |
| | `AdminUsers.jsx` (4.5KB) | CRUD quản lý tài khoản |
| | `AdminZones.jsx` (5.2KB) | Quản lý phân khu đỗ xe |
| | `AdminGates.jsx` (4.5KB) | Quản lý cổng barrier |
| | `AdminTariffs.jsx` (3.4KB) | Bảng biểu phí |
| | `AdminPasses.jsx` (4.4KB) | Vé định kỳ (tháng/quý/năm) |
| | `AdminExceptionLogs.jsx` (21.6KB) | Nhật ký sự cố an ninh |
| | `AdminBlacklist.jsx` (13KB) | Danh sách cấm biển số |
| | `AdminReports.jsx` (10.8KB) | Báo cáo & phân tích doanh thu |
| | `AdminSettings.jsx` (23.5KB) | Cấu hình hệ thống (4 sub-tab) |
| HTTP Client | `axiosClient.js` (64 dòng) | Tự gắn JWT, xử lý 401/403 |
| API Layer | `parkingApi.js` (dòng 123–213) | Định nghĩa endpoint `/admin/*` |
| Security Filter | `JwtAuthFilter.java` (77 dòng) | Validate JWT mỗi request |
| Controller | `AdminManagementController.java` (594 dòng) | CRUD + helper methods |
| Database | PostgreSQL | Lưu trữ dữ liệu |

---

## 2. CƠ CHẾ BẢO MẬT — 3 LỚP

### Lớp 1: Axios Interceptor (FE — `axiosClient.js` dòng 37–46)
```javascript
axiosClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```
> Mỗi request từ React tự động gắn `Authorization: Bearer <JWT>` vào header.

### Lớp 2: JwtAuthFilter (BE — `JwtAuthFilter.java` dòng 38–75)
```
Request đến → Đọc header Authorization → Tách "Bearer " lấy JWT
→ jwtUtil.extractUsername(jwt) → lấy email
→ userDetailsService.loadUserByUsername(email) → lấy UserDetails từ DB
→ jwtUtil.isTokenValid(jwt, userDetails) → kiểm tra hạn + chữ ký
→ Set SecurityContext → cho phép đi tiếp vào Controller
```

### Lớp 3: @PreAuthorize (BE — trên mỗi endpoint)
```java
@PreAuthorize("hasRole('ADMIN')")          // Chỉ ADMIN
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")  // ADMIN hoặc MANAGER
```
> Nếu role không khớp → Spring trả 403 Forbidden → Axios interceptor bắt 403 → logout.

---

## 3. CƠ CHẾ TẢI DỮ LIỆU KHI MỞ TRANG

**File:** `AdminDashboard.jsx` — `useEffect` dòng 309–363

Khi component mount, React gọi **8 API song song** (được kích hoạt tại dòng 272–279):

| # | Hàm fetch | Dòng gọi API | API Endpoint | State được cập nhật |
|---|-----------|-------------|-------------|-------------------|
| 1 | `fetchAdminUsers()` | dòng 240 gọi `staffApi.getAdminUsers()` · kích hoạt tại dòng 272 | `GET /admin/users` | `users` |
| 2 | `fetchPasses()` | dòng 249 gọi `staffApi.getParkingPasses()` · kích hoạt tại dòng 273 | `GET /admin/parking-passes` | `passes` |
| 3 | `fetchConfig()` → `reloadAdminConfig()` | dòng 258 → dòng 351 gọi `staffApi.getParkingConfig()` · kích hoạt tại dòng 274 | `GET /parking/config` | `zones`, `gates`, `tariffs`, `parkingConfig` |
| 4 | `fetchSettings()` | dòng 266 gọi `staffApi.getAdminSettings()` · kích hoạt tại dòng 275 | `GET /admin/settings` | `settings` |
| 5 | `fetchLogs()` | dòng 184 gọi `staffApi.getSecurityExceptions()` · kích hoạt tại dòng 276 | `GET /security/exceptions` | `logs` |
| 6 | `fetchSessions()` | dòng 203 gọi `staffApi.getAllSessionsHistory()` · kích hoạt tại dòng 277 | `GET /staff/sessions/history` | `sessions` |
| 7 | `fetchPayments()` | dòng 224 gọi `staffApi.getAdminPayments()` · kích hoạt tại dòng 278 | `GET /admin/payments` | `payments` |
| 8 | `fetchBlacklist()` | dòng 194 gọi `staffApi.getBlacklist()` · kích hoạt tại dòng 279 | `GET /security/blacklist` | `blacklist` |

### Auto-refresh mỗi 5 giây (dòng 280–289):
```javascript
const interval = setInterval(() => {
  fetchAdminUsers();
  fetchPasses();
  fetchLogs();
  fetchSessions();
  fetchPayments();
  fetchBlacklist();
}, 5000);
return () => clearInterval(interval);
```

> **🗣️ Giải thích:** Khi Admin mở trang Dashboard, React tự động gọi 8 API song song xuống Backend để lấy toàn bộ dữ liệu hệ thống. Sau đó, cứ mỗi 5 giây, 6 API quan trọng được gọi lại để cập nhật dữ liệu real-time. Khi Admin rời trang, `clearInterval` được gọi để dọn dẹp timer tránh rò rỉ bộ nhớ.

---

## 4. LUỒNG TỪNG CHỨC NĂNG

---

### 4.1 QUẢN LÝ TÀI KHOẢN (Users)

**FE UI:** `AdminUsers.jsx` (hiển thị) + `AdminDashboard.jsx` (state + CRUD handlers + modal)

**API Endpoints (BE = `AdminManagementController.java`):**

| Hành động | Method | Endpoint | FE gọi tại dòng | BE Method |
|-----------|--------|----------|-----------------|----------|
| Xem DS | GET | `/admin/users` | dòng 240 (`staffApi.getAdminUsers()`) | `getUsers()` BE dòng 80 |
| Thêm mới | POST | `/admin/users` | dòng 409 (`staffApi.createAdminUser(userForm)`) | `createUser()` BE dòng 89 |
| Cập nhật | PUT | `/admin/users/{id}` | dòng 405 (`staffApi.updateAdminUser(id, userForm)`) | `updateUser()` BE dòng 130 |
| Xóa | DELETE | `/admin/users/{id}` | dòng 452 (`staffApi.deleteAdminUser(id)`) | `deleteUser()` BE dòng 147 |
| Reset MK | POST | `/admin/users/{id}/reset-password` | dòng 436 (`staffApi.resetAdminUserPassword(id, data)`) | `resetUserPassword()` BE dòng 114 |
| Khóa/Mở | PUT | `/admin/users/{id}` | dòng 427 (`staffApi.updateAdminUser(id, {...status})`) | `updateUser()` BE dòng 138 |

#### Luồng THÊM MỚI User:

**Bước 1 — [FE] Admin nhấn "Thêm mới" (dòng 394–399)**
```
handleOpenAddUser() → reset userForm state → mở modal
```

**Bước 2 — [FE] Admin điền form → nhấn "Lưu" (dòng 401–422)**
```
handleSaveUser(e) → staffApi.createAdminUser(userForm)
→ Axios POST /api/v1/admin/users + Bearer JWT
→ Payload JSON: { name, email, role, phone }
```

**Bước 3 — [BE] Controller nhận request (dòng 89–108)**
```
createUser(@RequestBody Map<String, Object> body)
  → Kiểm tra email trùng: userRepository.existsByEmail(email)
  → Tạo mật khẩu tạm: generateTemporaryPassword() → "Smart@xxxxxxxx"
  → Hash mật khẩu: passwordEncoder.encode(temporaryPassword)
  → Build Entity User → userRepository.save(user) → INSERT INTO users
  → Trả về: userMap(user) + temporaryPassword (plain-text, chỉ 1 lần)
```

**Bước 4 — [FE] Nhận response (dòng 410–416)**
```
resCreate.data.data → lấy temporaryPassword
→ setCreatedCredentials({name, email, password})
→ Hiển thị popup mật khẩu tạm cho Admin copy
→ Gọi lại getAdminUsers() để refresh danh sách
```

> **🗣️ Giải thích:** Khi Admin tạo tài khoản mới, FE gửi thông tin (tên, email, role, SĐT) xuống BE. Controller kiểm tra email có trùng không, nếu không trùng thì tự sinh mật khẩu tạm dạng "Smart@xxxxxxxx", hash bằng BCrypt rồi lưu vào DB. Response trả về chứa mật khẩu tạm dạng plain-text (chỉ hiện 1 lần duy nhất). FE bắt lấy và hiển thị popup cho Admin copy gửi cho người dùng mới.

#### Luồng KHÓA/MỞ TÀI KHOẢN (dòng 424–431):
```
toggleUserStatus(id)
  → Tìm user trong state → đảo status: "active" ↔ "suspended"
  → staffApi.updateAdminUser(id, { ...target, status: newStatus })
  → PUT /admin/users/{id} + payload JSON
  → BE dòng 138: user.setIsActive(!"suspended".equals(status))
  → userRepository.save(user) → UPDATE users SET is_active = false
  → FE gọi lại getAdminUsers() refresh UI
```

---

### 4.2 QUẢN LÝ KHU ĐỖ XE (Zones)

**FE UI:** `AdminZones.jsx` (hiển thị) + `AdminDashboard.jsx` (state + CRUD handlers + modal)

**API Endpoints (BE = `AdminManagementController.java`):**

| Hành động | Method | Endpoint | FE gọi tại dòng | BE Method |
|-----------|--------|----------|-----------------|----------|
| Xem DS | GET | `/parking/config` | dòng 351 (`staffApi.getParkingConfig()`) | `ParkingConfigController` |
| Thêm mới | POST | `/admin/zones` | dòng 481 (`staffApi.createZone(payload)`) | `createZone()` BE dòng 160 |
| Cập nhật | PUT | `/admin/zones/{id}` | dòng 480 (`staffApi.updateZone(id, payload)`) | `updateZone()` BE dòng 182 |
| Xóa | DELETE | `/admin/zones/{id}` | dòng 491 (`staffApi.deleteZone(id)`) | `deleteZone()` BE dòng 195 |

#### Luồng THÊM Zone (dòng 469–488):

**Bước 1 — [FE] Chuẩn bị payload:**
```javascript
const payload = {
  floorId: zoneForm.floorId,        // UUID tầng
  vehicleTypeId: zoneForm.vehicleTypeId,  // UUID loại xe
  zoneCode: toZoneCode(zoneForm.name),    // Chuẩn hóa tên → mã zone
  zoneName: zoneForm.name,
  capacity: zoneForm.capacity,
  status: "ACTIVE"
};
```

**Bước 2 — [BE] Controller (dòng 160–176):**
```
→ Tìm Floor: floorRepository.findById(floorId)
→ Tìm VehicleType: vehicleTypeRepository.findById(vehicleTypeId)
→ Build Zone entity (currentCount=0, reservedCount=0, status=ACTIVE)
→ zoneRepository.save(zone) → INSERT INTO zones
→ Trả về zoneMap(zone) chứa: id, zoneCode, zoneName, capacity, floorName, vehicleTypeName
```

**Bước 3 — [FE] Sau khi tạo xong:**
```
→ reloadAdminConfig() → GET /parking/config
→ Cập nhật lại state zones, gates, tariffs từ dữ liệu mới nhất
```

> **🗣️ Giải thích:** Admin chọn tầng, loại xe, đặt tên khu và sức chứa. FE chuẩn hóa tên thành mã zone (bỏ dấu, viết hoa). BE kiểm tra tầng và loại xe có tồn tại trong DB không, rồi tạo zone với currentCount=0. Sau khi lưu xong, FE gọi lại API config để tải lại toàn bộ danh sách zone, gate, tariff mới nhất.

---

### 4.3 QUẢN LÝ CỔNG (Gates)

**FE UI:** `AdminGates.jsx` (hiển thị) + `AdminDashboard.jsx` (state + CRUD handlers + modal)

**API Endpoints (BE = `AdminManagementController.java`):**

| Hành động | Method | Endpoint | FE gọi tại dòng | BE Method |
|-----------|--------|----------|-----------------|----------|
| Xem DS | GET | `/parking/config` | dòng 351 (`staffApi.getParkingConfig()`) | `ParkingConfigController` |
| Thêm | POST | `/admin/gates` | dòng 517 (`staffApi.createGate(payload)`) | `createGate()` BE dòng 208 |
| Sửa | PUT | `/admin/gates/{id}` | dòng 516 (`staffApi.updateGate(id, payload)`) | `updateGate()` BE dòng 231 |
| Xóa | DELETE | `/admin/gates/{id}` | dòng 527 (`staffApi.deleteGate(id)`) | `deleteGate()` BE dòng 253 |
| Barrier | PUT | `/admin/gates/{id}/barrier` | dòng 535 (`staffApi.controlBarrier(id, state)`) | `controlBarrier()` BE dòng 262 |
| Bật/Tắt | PUT | `/admin/gates/{id}` | dòng 546 (`staffApi.updateGate(id, {isActive})`) | `updateGate()` BE dòng 236 |

#### Luồng ĐIỀU KHIỂN BARRIER (dòng 532–541):

```
[FE] toggleBarrier(gateId, "CLOSED")
  → staffApi.controlBarrier(gateId, "OPEN")
  → PUT /admin/gates/{id}/barrier + { state: "OPEN" }

[BE] controlBarrier() dòng 262:
  → Tìm gate → Validate state phải là "OPEN" hoặc "CLOSED"
  → Trả response: { gateId, gateName, barrierState: "OPEN", gateType }

[FE] Cập nhật state local: gate.barrier = "OPEN"
```

#### Luồng BẬT/TẮT CỔNG (dòng 543–558):

```
[FE] toggleGateStatus(gate)
  → Đảo: gate.status === "active" ? false : true
  → staffApi.updateGate(gate.id, { ...payload, isActive: newActive })

[BE] updateGate() dòng 236:
  → gate.setIsActive(Boolean.parseBoolean(...))
  → gateRepository.save(gate)

[FE] Cập nhật state local: gate.status = "active" | "inactive"
```

> **🗣️ Giải thích:** Admin có thể điều khiển barrier (mở/đóng thanh chắn) và bật/tắt cổng (đặt chế độ bảo trì). Khi điều khiển barrier, BE chỉ validate trạng thái hợp lệ rồi trả response xác nhận — việc điều khiển vật lý sẽ do thiết bị IoT xử lý. Khi tắt cổng, isActive được set false trong DB để các module khác biết cổng đang bảo trì.

---

### 4.4 QUẢN LÝ BIỂU PHÍ (Pricing Rules / Tariffs)

**FE UI:** `AdminTariffs.jsx` (hiển thị) + `AdminDashboard.jsx` (state + CRUD handlers + modal)

**API Endpoints (BE = `AdminManagementController.java`):**

| Hành động | Method | Endpoint | FE gọi tại dòng | BE Method |
|-----------|--------|----------|-----------------|----------|
| Xem DS | GET | `/parking/config` | dòng 351 (`staffApi.getParkingConfig()`) | `ParkingConfigController` |
| Thêm | POST | `/admin/pricing-rules` | dòng 582 (`staffApi.createPricingRule(payload)`) | `createPricingRule()` BE dòng 292 |
| Sửa | PUT | `/admin/pricing-rules/{id}` | dòng 581 (`staffApi.updatePricingRule(id, payload)`) | `updatePricingRule()` BE dòng 311 |
| Xóa | DELETE | `/admin/pricing-rules/{id}` | (cùng pattern `staffApi.deletePricingRule(id)`) | `deletePricingRule()` BE dòng 324 |

#### Luồng TẠO BIỂU PHÍ (dòng 571–589):

**[FE] Payload:**
```javascript
{
  buildingId: tariffForm.buildingId,
  vehicleTypeId: tariffForm.vehicleTypeId,
  pricingType: "HOURLY" | "DAILY" | "MONTHLY",
  pricePerUnit: 5000,
  freeMinutes: 15
}
```

**[BE] Controller (dòng 292–305):**
```
→ Tìm Building, VehicleType từ DB
→ Build PricingRule entity
→ pricingRuleRepository.save(rule) → INSERT INTO pricing_rules
→ Trả về pricingMap(rule): { id, pricingType, pricePerUnit, freeMinutes, vehicleTypeName }
```

> **🗣️ Giải thích:** Admin chọn loại xe (xe máy, ô tô...), chọn kiểu tính phí (theo giờ/ngày/tháng), nhập đơn giá và số phút miễn phí đầu. BE tìm building và vehicleType trong DB, tạo bản ghi pricing rule và lưu xuống. Sau đó FE reload config để hiển thị biểu phí mới trên bảng.

---

### 4.5 QUẢN LÝ VÉ ĐỊNH KỲ (Parking Passes)

**FE UI:** `AdminPasses.jsx` (hiển thị) + `AdminDashboard.jsx` (state + CRUD handlers + modal)

**API Endpoints (BE = `AdminManagementController.java`):**

| Hành động | Method | Endpoint | FE gọi tại dòng | BE Method |
|-----------|--------|----------|-----------------|----------|
| Xem DS | GET | `/admin/parking-passes` | dòng 249 (`staffApi.getParkingPasses()`) | `getPasses()` BE dòng 336 |
| Thêm | POST | `/admin/parking-passes` | dòng 670 (`staffApi.createParkingPass(payload)`) | `createPass()` BE dòng 345 |
| Sửa | PUT | `/admin/parking-passes/{id}` | dòng 657 (`staffApi.updateParkingPass(id, payload)`) | `updatePass()` BE dòng 371 |
| Xóa | DELETE | `/admin/parking-passes/{id}` | dòng 699 (`staffApi.deleteParkingPass(id)`) | `deletePass()` BE dòng 393 |
| Gia hạn | POST | `/admin/parking-passes/{id}/renew` | dòng 690 (`staffApi.renewParkingPass(id)`) | `renewPass()` BE dòng 402 |

#### Luồng PHÁT HÀNH VÉ MỚI (dòng 653–687):

**[FE] Payload:**
```javascript
{
  userId: passForm.userId,
  buildingId: passForm.buildingId,
  vehicleTypeId: passForm.vehicleTypeId,
  licensePlate: "51H12345",
  startDate: "2026-06-27",
  endDate: "2026-07-26",    // FE tự tính từ passType
  passType: "MONTHLY",
  fee: 200000
}
```

**[BE] Controller (dòng 345–365):**
```
→ Tìm User, Building, VehicleType từ DB
→ Chuẩn hóa biển số: toUpperCase + xóa khoảng trắng
→ Sinh QR code: "PASS-" + UUID 8 ký tự
→ Build ParkingPass entity (status = ACTIVE)
→ parkingPassRepository.save(pass) → INSERT INTO parking_passes
→ Trả về passMap(pass): { id, userName, licensePlate, qrCode, startDate, endDate, fee, status }
```

#### Luồng GIA HẠN VÉ (dòng 688–696 FE, dòng 398–414 BE):

```
[FE] handleRenewPass(id) → staffApi.renewParkingPass(id)
     → POST /admin/parking-passes/{id}/renew (không cần body)

[BE] renewPass(id):
  → Tìm pass → Tính số ngày gia hạn dựa trên passType:
     MONTHLY → +30 ngày | QUARTERLY → +90 ngày | YEARLY → +365 ngày
  → pass.setEndDate(endDate.plusDays(days))
  → pass.setStatus(ACTIVE)  // Kích hoạt lại nếu đang expired
  → parkingPassRepository.save(pass)
```

> **🗣️ Giải thích:** Khi phát hành vé mới, Admin chọn driver, loại xe, nhập biển số và ngày bắt đầu. FE tự tính ngày kết thúc dựa trên loại vé (tháng/quý/năm). BE tạo mã QR tự động, lưu vào DB. Khi gia hạn, BE chỉ cần cộng thêm số ngày tương ứng vào ngày hết hạn hiện tại và đặt lại trạng thái ACTIVE.

---

### 4.6 XEM THANH TOÁN (Payments)

**API Endpoint:** `GET /admin/payments` → `getPayments()` dòng 420

**[BE] Controller (dòng 420–439):**
```
→ paymentRepository.findAll()
→ Lọc: chỉ lấy status == COMPLETED
→ Map sang DTO: { id, referenceType, amount, paymentMethod, transactionId, paidAt }
```

**[FE] fetchPayments() (dòng 222–234):**
```
→ Nhận mảng payments → chuyển amount thành Number, paidAt thành Date
→ setPayments(...)
```

**[FE] Tính doanh thu hôm nay (dòng 704–727):**
```javascript
todayRevenue = todaySessionRevenue + todayPaymentRevenue
// todaySessionRevenue: tổng fee từ sessions có exitTime hôm nay
// todayPaymentRevenue: tổng amount từ payments có paidAt hôm nay
```

> **🗣️ Giải thích:** Trang Admin không tạo thanh toán mà chỉ xem. Doanh thu hôm nay được tính bằng cách cộng phí từ các phiên đã checkout trong ngày (sessions) với tổng thanh toán đã hoàn tất (payments). Biểu đồ 7 ngày gần nhất cũng tính tương tự cho từng ngày.

---

### 4.7 CÀI ĐẶT HỆ THỐNG (Settings)

**FE UI:** `AdminSettings.jsx` (hiển thị 4 sub-tab: Nghiệp vụ, VNPAY, An ninh, Hệ thống) + `AdminDashboard.jsx` (state)

**API Endpoints (BE = `AdminManagementController.java`):**

| Hành động | Method | Endpoint | FE gọi tại dòng | BE Method |
|-----------|--------|----------|-----------------|----------|
| Xem | GET | `/admin/settings` | dòng 266 (`staffApi.getAdminSettings()`) | `getSettings()` BE dòng 448 |
| Cập nhật | PUT | `/admin/settings` | (`staffApi.updateAdminSettings(data)`) | `updateSettings()` BE dòng 456 |

**[FE] Payload khi lưu cài đặt:**
```javascript
{ gracePeriod: 10, currency: "VND", vat: 10, systemName: "SmartParking v2", sosEnabled: true }
```

**[BE] Controller (dòng 456–465):**
```
→ Lấy SystemSettings hiện tại từ DB (hoặc tạo mới nếu chưa có)
→ Cập nhật từng field nếu body chứa key tương ứng
→ systemSettingsRepository.save(settings)
→ Trả về settingsMap(settings)
```

> **🗣️ Giải thích:** Admin có thể thay đổi các thông số hệ thống như thời gian ân hạn (grace period), loại tiền tệ, thuế VAT, tên hệ thống, và bật/tắt chế độ SOS khẩn cấp. BE lưu vào bảng system_settings duy nhất 1 bản ghi.

---

### 4.8 QUẢN LÝ DANH SÁCH ĐEN (Blacklist)

**FE UI:** `AdminBlacklist.jsx` (hiển thị + CRUD tự quản lý) + `AdminExceptionLogs.jsx` (nhật ký sự cố)

**API Endpoints (BE = `SecurityController.java`):**

| Hành động | Method | Endpoint | FE gọi tại dòng | BE Method | Phân quyền |
|-----------|--------|----------|-----------------|-----------|------------|
| Xem DS | GET | `/security/blacklist` | dòng 197 (`staffApi.getBlacklist()`) | `getBlacklist()` BE dòng 200 | SECURITY, MANAGER, ADMIN |
| Thêm mới | POST | `/security/blacklist` | dòng 214 (`staffApi.addBlacklistPlate()`) | `addBlacklistPlate()` BE dòng 210 | SECURITY, MANAGER, ADMIN |
| Gỡ chặn | DELETE | `/security/blacklist/{id}` | dòng 234 (`staffApi.removeBlacklistPlate()`) | `removeBlacklistPlate()` BE dòng 221 | ADMIN, MANAGER |

#### Luồng THÊM BIỂN SỐ VÀO BLACKLIST (dòng 206–229 FE, dòng 210–215 BE):

**Bước 1 — [FE] Admin mở modal thêm mới (dòng 220)**
```
setIsBlacklistModalOpen(true) → reset blacklistForm state (reason mặc định = "STOLEN")
```

**Bước 2 — [FE] Điền biển số, lý do cấm, mô tả → nhấn "Thêm vào blacklist" (dòng 206–229)**
```
handleSaveBlacklist(e) → staffApi.addBlacklistPlate(blacklistForm)
→ Axios POST /api/v1/security/blacklist + Bearer JWT
→ Payload JSON: { licensePlate, reason, description, addedByUserId }
```

**Bước 3 — [BE] SecurityController nhận request (dòng 210–215)**
```
addBlacklistPlate(@RequestBody BlacklistPlateRequest request)
  → Chuẩn hóa biển số xe (viết hoa, bỏ khoảng trắng)
  → Kiểm tra nếu đã có biển số này trong danh sách đen đang hoạt động (isActive = true)
  → Khởi tạo BlacklistPlate entity với isActive = true
  → blacklistPlateRepository.save(plate) → INSERT INTO blacklist_plates
  → Phát sự kiện WebSocket thông báo đồng bộ danh sách
```

**Bước 4 — [FE] Nhận response (dòng 220–223)**
```
→ Đóng modal, reset form
→ Hiển thị toast thông báo thành công
→ Gọi fetchBlacklist() để cập nhật lại bảng danh sách
```

#### Luồng GỠ CHẶN BIỂN SỐ (GỠ CẤM) (dòng 231–242 FE, dòng 221–227 BE):

**Bước 1 — [FE] Admin nhấn nút "Gỡ chặn" cạnh biển số xe (dòng 231)**
```
handleRemoveBlacklist(id, plate) → Hiện popup confirm gỡ chặn
```

**Bước 2 — [FE] Admin xác nhận → Gửi request (dòng 233–236)**
```
staffApi.removeBlacklistPlate(id, { removedByUserId: user.id })
→ Axios DELETE /api/v1/security/blacklist/{id} + Bearer JWT
```

**Bước 3 — [BE] Controller & Service nhận request (dòng 221–227)**
```
removeBlacklistPlate(@PathVariable UUID id, @RequestBody BlacklistRemoveRequest request)
  → Xác thực quyền qua @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')") (Security staff sẽ bị lỗi 403)
  → blacklistService.removeFromBlacklist(id, request)
  → Tìm BlacklistPlate theo ID. Cập nhật:
      · isActive = false
      · removedByUserId = request.removedByUserId
      · removedAt = LocalDateTime.now()
  → blacklistPlateRepository.save(plate) → UPDATE blacklist_plates
  → Phát sự kiện WebSocket đồng bộ cho tất cả các máy trạm giám sát
```

**Bước 4 — [FE] Cập nhật UI (dòng 237–238)**
```
→ Hiển thị toast thông báo gỡ chặn thành công
→ Gọi fetchBlacklist() tải lại danh sách
→ Bảng render cập nhật biển số đó thành trạng thái "Đã gỡ" (làm mờ dòng với opacity-45)
```

---

## 5. LUỒNG PHẢN HỒI DỮ LIỆU (Response Flow)

```
Database (PostgreSQL)
  ↓ JPA/Hibernate thực thi SELECT → trả về Java Entity (nằm trong RAM)
  ↓
Controller gọi helper method (userMap, zoneMap, passMap, ...)
  ↓ Chuyển Entity → LinkedHashMap<String, Object> (DTO thủ công)
  ↓
ApiResponse.success(map) → bọc trong cấu trúc chuẩn:
  { "status": "success", "message": "...", "data": { ... } }
  ↓
Spring Jackson Serializer tự động chuyển Map → JSON string
  ↓
HTTP Response (200 OK, Content-Type: application/json)
  ↓
Axios nhận response → response.data.data chứa payload
  ↓
React setState() → Virtual DOM so sánh → Render UI mới
```

---

## 6. BẢNG TỔNG HỢP TẤT CẢ API CỦA ADMIN

| # | Method | Endpoint | Mô tả | Phân quyền |
|---|--------|----------|-------|-----------|
| 1 | GET | `/admin/users` | Danh sách tài khoản | ADMIN |
| 2 | POST | `/admin/users` | Tạo tài khoản | ADMIN |
| 3 | PUT | `/admin/users/{id}` | Cập nhật tài khoản | ADMIN |
| 4 | DELETE | `/admin/users/{id}` | Xóa tài khoản | ADMIN |
| 5 | POST | `/admin/users/{id}/reset-password` | Reset mật khẩu | ADMIN |
| 6 | POST | `/admin/zones` | Tạo khu đỗ xe | ADMIN, MANAGER |
| 7 | PUT | `/admin/zones/{id}` | Cập nhật zone | ADMIN, MANAGER |
| 8 | DELETE | `/admin/zones/{id}` | Xóa zone | ADMIN, MANAGER |
| 9 | POST | `/admin/gates` | Tạo cổng | ADMIN, MANAGER |
| 10 | PUT | `/admin/gates/{id}` | Cập nhật cổng | ADMIN, MANAGER |
| 11 | DELETE | `/admin/gates/{id}` | Xóa cổng | ADMIN, MANAGER |
| 12 | PUT | `/admin/gates/{id}/barrier` | Điều khiển barrier | ADMIN, MANAGER |
| 13 | GET | `/admin/pricing-rules` | Danh sách biểu phí | ADMIN, MANAGER |
| 14 | POST | `/admin/pricing-rules` | Tạo biểu phí | ADMIN, MANAGER |
| 15 | PUT | `/admin/pricing-rules/{id}` | Cập nhật biểu phí | ADMIN, MANAGER |
| 16 | DELETE | `/admin/pricing-rules/{id}` | Xóa biểu phí | ADMIN, MANAGER |
| 17 | GET | `/admin/parking-passes` | Danh sách vé định kỳ | ADMIN, MANAGER |
| 18 | POST | `/admin/parking-passes` | Phát hành vé | ADMIN, MANAGER |
| 19 | PUT | `/admin/parking-passes/{id}` | Cập nhật vé | ADMIN, MANAGER |
| 20 | DELETE | `/admin/parking-passes/{id}` | Xóa vé | ADMIN, MANAGER |
| 21 | POST | `/admin/parking-passes/{id}/renew` | Gia hạn vé | ADMIN, MANAGER |
| 22 | GET | `/admin/payments` | Xem thanh toán | ADMIN, MANAGER |
| 23 | GET | `/admin/settings` | Xem cài đặt | ADMIN |
| 24 | PUT | `/admin/settings` | Cập nhật cài đặt | ADMIN |
| 25 | GET | `/security/blacklist` | Xem danh sách đen | ADMIN, MANAGER, SECURITY |
| 26 | POST | `/security/blacklist` | Thêm biển số vào blacklist | ADMIN, MANAGER, SECURITY |
| 27 | DELETE | `/security/blacklist/{id}` | Gỡ biển số khỏi blacklist | ADMIN, MANAGER |

**Tổng: 27 API endpoints cho module Admin (bao gồm 3 API Blacklist).**

---

## 7. CÁC API BỔ TRỢ (Admin Dashboard cũng gọi)

| API | Endpoint | Mục đích |
|-----|----------|---------|
| `getParkingConfig()` | `GET /parking/config` | Lấy buildings, floors, zones, gates, vehicleTypes, pricingRules |
| `getAllSessionsHistory()` | `GET /staff/sessions/history` | Lấy toàn bộ phiên gửi xe (để tính doanh thu, lượt xe) |
| `getSecurityExceptions()` | `GET /security/exceptions` | Lấy log sự cố an ninh |

---

## 8. LUỒNG ĐĂNG NHẬP (Login)

**Files liên quan:**

| Tầng | File | Vai trò |
|------|------|---------|
| FE UI | `LoginScreen.jsx` (2393 dòng) | Giao diện đăng nhập + đăng ký |
| FE HTTP | `axiosClient.js` (64 dòng) | Gửi request, lưu JWT |
| BE Controller | `AuthController.java` (79 dòng) | Nhận request, điều phối |
| BE Service | `AuthService.java` (179 dòng) | Xác thực, sinh JWT |
| BE DTO | `LoginRequest.java`, `LoginResponse.java` | Validate + format response |
| BE Security | `JwtUtil.java` | Sinh & validate JWT token |

**API Endpoints (Public — không cần JWT):**

| Hành động | Method | Endpoint | FE gọi tại dòng | BE Method |
|-----------|--------|----------|-----------------|-----------|
| Đăng nhập | POST | `/auth/login` | `LoginScreen.jsx` dòng 609 (`axiosClient.post("/auth/login", {email, password})`) | `AuthController.login()` BE dòng 28 → `AuthService.login()` dòng 70 |
| Đăng ký | POST | `/auth/register` | `LoginScreen.jsx` dòng 655 (`axiosClient.post("/auth/register", {...})`) | `AuthController.register()` BE dòng 39 → `AuthService.register()` dòng 49 |
| OAuth2 | POST | `/auth/oauth2` | `LoginScreen.jsx` dòng 679 (`axiosClient.post("/auth/oauth2", {...})`) | `AuthController.oauth2Login()` BE dòng 50 → `AuthService.oauth2Login()` dòng 138 |
| Refresh Token | POST | `/auth/refresh` | (Axios interceptor khi token hết hạn) | `AuthController.refresh()` BE dòng 62 → `AuthService.refreshToken()` dòng 105 |
| Logout | POST | `/auth/logout` | FE xóa `localStorage` | `AuthController.logout()` BE dòng 74 (stateless, không làm gì) |

### 8.1 Luồng ĐĂNG NHẬP THỦ CÔNG (Email + Password)

```
Bước 1 — [FE] User nhập email + password → nhấn "Đăng nhập"
  → LoginScreen.jsx dòng 604: handleLogin(e)
  → Dòng 609: axiosClient.post("/auth/login", { email, password })
  → HTTP POST /api/v1/auth/login (KHÔNG CẦN JWT — endpoint public)

Bước 2 — [BE] AuthController nhận request (dòng 28-31)
  → @Valid @RequestBody LoginRequest request
  → LoginRequest validate: email @NotBlank + @Email, password @NotBlank
  → Nếu validation fail → Spring trả 400 Bad Request tự động

Bước 3 — [BE] AuthService.login() (dòng 70-99)
  → authenticationManager.authenticate(email, password)
     → Spring Security tự tìm user trong DB, so sánh BCrypt hash
     → Sai mật khẩu → throw BusinessException("Email hoặc mật khẩu không đúng")
  → Đúng → userDetailsService.loadUserByUsername(email)
  → jwtUtil.generateAccessToken(userDetails)    → JWT 1 giờ
  → jwtUtil.generateRefreshToken(userDetails)   → JWT dài hạn
  → Build LoginResponse: { accessToken, refreshToken, tokenType, expiresIn, user }

Bước 4 — [FE] Nhận response (dòng 610-631)
  → const { accessToken, user } = res.data.data
  → localStorage.setItem("accessToken", accessToken)         // Lưu token chung
  → localStorage.setItem("accessToken_ADMIN", accessToken)   // Lưu theo role
  → localStorage.setItem("user", JSON.stringify({id, role, fullName, email}))
  → roleMap chuyển "ADMIN" → "admin"
  → onLogin("admin") → React Router chuyển hướng tới /admin/dashboard
```

**JSON Response từ BE:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "user": {
      "id": "a1b2c3d4-...",
      "email": "admin@parking.vn",
      "fullName": "Trần Ngọc An",
      "role": "ADMIN"
    }
  }
}
```

> **🗣️ Giải thích:** Khi user nhập email và mật khẩu, FE gửi POST request tới `/auth/login` (endpoint public, không cần JWT). BE dùng `AuthenticationManager` của Spring Security để xác thực — nó tự tìm user trong database theo email, lấy `passwordHash` và so sánh với mật khẩu nhập vào bằng BCrypt. Nếu khớp, BE sinh 2 JWT token: `accessToken` (hạn 1 giờ, dùng cho mọi request API) và `refreshToken` (dùng để lấy accessToken mới khi hết hạn). FE lưu token vào `localStorage` và chuyển hướng user tới dashboard tương ứng với role.

---

### 8.2 Luồng ĐĂNG KÝ TÀI KHOẢN (Register — chỉ Driver)

```
Bước 1 — [FE] User chuyển sang tab "Đăng ký" → nhập thông tin
  → LoginScreen.jsx dòng 641: handleSignUp(e)
  → Dòng 648: Kiểm tra password === confirmPassword (FE validate)
  → Dòng 655: axiosClient.post("/auth/register", {
       email, password, fullName, licensePlate: "", role: "DRIVER"
     })

Bước 2 — [BE] AuthController.register() (dòng 39-42)
  → @Valid @RequestBody RegisterRequest request
  → RegisterRequest validate:
     · email: @NotBlank + @Email
     · password: @NotBlank + @Size(min=8)
     · fullName: @NotBlank

Bước 3 — [BE] AuthService.register() (dòng 49-64)
  → Kiểm tra email trùng: userRepository.existsByEmail(email)
     → Trùng → throw BusinessException("Email đã được sử dụng")
  → Build User entity:
     · role = DRIVER (cố định, không cho phép đăng ký role khác)
     · passwordHash = passwordEncoder.encode(password)
     · isActive = true
  → userRepository.save(newUser) → INSERT INTO users
  → Không trả token (user cần quay lại form đăng nhập)

Bước 4 — [FE] Nhận response (dòng 662-664)
  → setSignupSuccess(true)
  → setIsSignUp(false) → chuyển về form đăng nhập
  → alert("Đăng ký thành công! Bạn có thể sử dụng tài khoản này để đăng nhập.")
```

> **🗣️ Giải thích:** Đăng ký chỉ cho phép tạo tài khoản DRIVER. FE validate mật khẩu xác nhận ở client-side, BE validate email format và mật khẩu tối thiểu 8 ký tự qua annotation `@Valid`. Sau khi đăng ký, user KHÔNG được tự động đăng nhập mà phải quay lại form login — đây là thiết kế có chủ đích để đảm bảo user xác nhận lại thông tin đăng nhập.

---

### 8.3 Luồng ĐĂNG NHẬP GOOGLE OAuth2

**Thư viện FE:** `@react-oauth/google` (import tại `LoginScreen.jsx` dòng 3)

```
Bước 1 — [FE] User nhấn nút "Google" (dòng 2178)
  → Dòng 711: googleLogin() — mở popup Google OAuth consent
  → Google xác thực → trả về tokenResponse.access_token

Bước 2 — [FE] Lấy thông tin user từ Google API (dòng 716-720)
  → fetch("https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: "Bearer " + access_token } })
  → Nhận: { email: "user@gmail.com", name: "Nguyễn Văn A" }

Bước 3 — [FE] Gửi thông tin xuống Backend (dòng 722 → dòng 675-709)
  → processOAuth2Login("google", userInfo.email, userInfo.name)
  → Dòng 679: axiosClient.post("/auth/oauth2", {
       provider: "google", email, fullName
     })

Bước 4 — [BE] AuthService.oauth2Login() (dòng 138-176)
  → Tìm user trong DB: userRepository.findByEmail(email)
  → Nếu CHƯA CÓ → Tự tạo tài khoản DRIVER mới:
     · passwordHash = encode(UUID.randomUUID()) — mật khẩu ngẫu nhiên
     · role = DRIVER, isActive = true
  → Nếu ĐÃ CÓ → Dùng tài khoản hiện tại (kể cả là ADMIN/STAFF)
  → Sinh JWT tokens (accessToken + refreshToken)
  → Trả LoginResponse giống login thường

Bước 5 — [FE] Nhận response (dòng 684-703)
  → Lưu accessToken vào localStorage (giống login thường)
  → onLogin(roleMap[user.role] || "driver")
```

> **🗣️ Giải thích:** OAuth2 Google sử dụng thư viện `@react-oauth/google`. Khi user nhấn nút Google, FE mở popup OAuth → Google xác thực → trả về access_token → FE dùng token này gọi Google API lấy email/tên → gửi xuống Backend. BE tìm email trong DB: nếu chưa có thì tự tạo tài khoản DRIVER mới (mật khẩu ngẫu nhiên vì user OAuth không cần mật khẩu), nếu đã có thì dùng luôn. Cuối cùng sinh JWT token và trả về cho FE giống login thường.

---

### 8.4 Luồng ĐĂNG NHẬP FACEBOOK OAuth2

```
Bước 1 — [FE] Load Facebook SDK (dòng 766-784)
  → useEffect tự load script "https://connect.facebook.net/vi_VN/sdk.js"
  → FB.init({ appId: VITE_FACEBOOK_APP_ID, version: "v19.0" })

Bước 2 — [FE] User nhấn nút "Facebook" (dòng 2216)
  → Dòng 734: handleFacebookLogin()
  → Dòng 739: window.FB.login(..., { scope: "email,public_profile" })
  → Facebook mở popup xác thực

Bước 3 — [FE] Nhận response từ Facebook (dòng 741-756)
  → FB.api("/me", { fields: "id,name,email" })
  → Nhận: { email: "user@facebook.com", name: "Nguyễn Văn A" }
  → Dòng 749: processOAuth2Login("facebook", fbUser.email, fbUser.name)

Bước 4 — [BE] Xử lý giống Google OAuth2 (AuthService.oauth2Login())
  → Tìm/tạo user → Sinh JWT → Trả LoginResponse
```

> **🗣️ Giải thích:** Facebook OAuth2 dùng Facebook JavaScript SDK (load từ CDN). FE khởi tạo SDK với App ID, khi user nhấn nút Facebook sẽ mở popup xác thực, sau đó gọi Graph API lấy email/tên. Phần còn lại giống Google OAuth2 — gửi xuống endpoint `/auth/oauth2` duy nhất, BE xử lý chung cho cả 2 provider.

---

## 9. LUỒNG THANH TOÁN VNPAY

**Files liên quan:**

| Tầng | File | Vai trò |
|------|------|---------|
| FE UI | `PaymentReturnPage.jsx` | Trang callback sau khi thanh toán VNPay |
| FE UI | `DriverDashboard.jsx` | Nút tạo URL thanh toán VNPay |
| BE Controller | `PaymentController.java` (174 dòng) | Nhận callback từ VNPay |
| BE Service | `VnPayService.java` (122 dòng) | Tạo URL, verify chữ ký HMAC-SHA512 |
| BE Config | `application.yml` | Cấu hình tmnCode, hashSecret, returnUrl |

**API Endpoints:**

| Hành động | Method | Endpoint | Mô tả | Phân quyền |
|-----------|--------|----------|-------|-----------|
| Xác nhận CK | POST | `/driver/payments/confirm` | Driver xác nhận chuyển khoản thường | DRIVER, STAFF, MANAGER, ADMIN |
| VNPay Return | GET | `/driver/payments/vnpay-return` | Callback khi user quay về từ VNPay | Public |
| VNPay IPN | GET | `/driver/payments/vnpay-ipn` | Callback server-to-server từ VNPay | Public |

### 9.1 Cấu hình VNPay Sandbox (VnPayService.java dòng 23-36)

```java
@Value("${vnpay.tmn-code:2AS5E3Q3}")           // Mã merchant (sandbox)
private String tmnCode;

@Value("${vnpay.hash-secret:5DJ4Q95ESAEMBAM3H68QBKQ616DHTSZ4}")  // Secret key
private String hashSecret;

@Value("${vnpay.payment-url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
private String paymentUrl;                       // URL cổng thanh toán

@Value("${vnpay.return-url:http://localhost:5173/driver/payment-return}")
private String returnUrl;                        // URL FE redirect sau thanh toán
```

### 9.2 Luồng THANH TOÁN QUA VNPAY (toàn bộ)

```
Bước 1 — [FE] Driver nhấn "Thanh toán VNPay"
  → Gọi API tạo payment URL
  → BE tạo Payment entity (status = PENDING)
  → BE gọi VnPayService.createPaymentUrl() (dòng 38-73):
     · Tạo TreeMap params: Version, Command, TmnCode, Amount (×100), CurrCode...
     · vnp_TxnRef = orderCode (mã đơn hàng)
     · vnp_ReturnUrl = "http://localhost:5173/driver/payment-return"
     · Tính HMAC-SHA512: hmacSHA512(hashSecret, hashData) → vnp_SecureHash
     · Ghép thành URL: "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Version=..."
  → Trả URL cho FE

Bước 2 — [FE] Redirect tới VNPay
  → window.location.href = vnpayUrl
  → User thấy trang thanh toán VNPay Sandbox
  → Chọn ngân hàng → nhập OTP → xác nhận

Bước 3 — [VNPay] Redirect user về FE
  → VNPay redirect tới: http://localhost:5173/driver/payment-return?vnp_ResponseCode=00&vnp_TxnRef=...
  → PaymentReturnPage.jsx nhận URL params

Bước 4 — [FE] PaymentReturnPage gọi API xác nhận
  → Gửi params từ URL xuống BE
  → GET /driver/payments/vnpay-return?vnp_ResponseCode=00&...

Bước 5 — [BE] PaymentController.vnpayReturn() (dòng 75-82)
  → vnPayService.extractParams(request)    — lấy tất cả query params
  → processPassPaymentCallback(params)     — xử lý logic (dòng 97-172)

Bước 6 — [BE] processPassPaymentCallback() (dòng 97-172)
  → vnPayService.verifySignature(params)   — Tính lại HMAC-SHA512 và so sánh
     · Nếu KHÔNG KHỚP → { success: false, message: "Sai chữ ký VNPay" }
  → Tìm Payment: paymentRepository.findByTransactionId(orderCode)
     · Nếu KHÔNG TÌM THẤY → { success: false, message: "Không tìm thấy đơn" }
  → Kiểm tra: vnp_ResponseCode == "00" && vnp_TransactionStatus == "00"
     · Nếu ĐÃ THANH TOÁN (paid = true):

       [Trường hợp A — Thanh toán phí gửi xe (SESSION)]: (dòng 124-138)
         → parkingSessionService.completeOnlineCheckoutPayment(payment)
         → Tự động checkout session + cập nhật payment status = COMPLETED

       [Trường hợp B — Mua vé định kỳ (PASS)]: (dòng 141-163)
         → payment.setStatus(COMPLETED), payment.setPaidAt(now())
         → pass.setStartDate(today), pass.setEndDate(today + months)
         → pass.setStatus(ACTIVE)
         → Lưu cả payment + pass vào DB

     · Nếu CHƯA THANH TOÁN (paid = false):
         → payment.setStatus(FAILED)
```

### 9.3 Xác minh chữ ký VNPay (VnPayService.verifySignature — dòng 86-107)

```
→ Lấy vnp_SecureHash từ response VNPay
→ Xóa vnp_SecureHash + vnp_SecureHashType khỏi params
→ Sắp xếp params theo alphabet (TreeMap)
→ Ghép thành chuỗi: "vnp_Amount=100000&vnp_BankCode=NCB&..."
→ Tính HMAC-SHA512 bằng hashSecret
→ So sánh với vnp_SecureHash nhận được
→ Khớp = chữ ký hợp lệ (không bị giả mạo)
```

> **🗣️ Giải thích:** VNPay sử dụng cơ chế chữ ký số HMAC-SHA512 để đảm bảo an toàn. Khi tạo URL thanh toán, BE dùng `hashSecret` (chỉ BE và VNPay biết) để ký toàn bộ tham số. Khi VNPay redirect user về, BE tính lại chữ ký từ params nhận được và so sánh với chữ ký VNPay gửi kèm — nếu khớp nghĩa là dữ liệu không bị thay đổi giữa đường. Ngoài ra VNPay còn gửi IPN (Instant Payment Notification) server-to-server để đảm bảo xử lý ngay cả khi user đóng trình duyệt trước khi redirect.

### 9.4 Hai loại thanh toán VNPay trong hệ thống

| Loại | referenceType | Khi nào dùng | Sau khi thành công |
|------|-------------|-------------|-------------------|
| **Phí gửi xe** | `SESSION` | Driver checkout xe, chọn thanh toán online | Tự động hoàn tất checkout + mở barrier |
| **Vé định kỳ** | `PASS` | Driver mua vé tháng/quý/năm | Kích hoạt pass, set ngày bắt đầu/kết thúc |

---

## 10. BẢNG TỔNG HỢP TOÀN BỘ API CỦA BẠN (AN) ĐẢM NHIỆM

| # | Module | Method | Endpoint | Mô tả |
|---|--------|--------|----------|-------|
| 1 | Auth | POST | `/auth/login` | Đăng nhập email/password |
| 2 | Auth | POST | `/auth/register` | Đăng ký tài khoản Driver |
| 3 | Auth | POST | `/auth/oauth2` | Đăng nhập Google/Facebook |
| 4 | Auth | POST | `/auth/refresh` | Làm mới access token |
| 5 | Auth | POST | `/auth/logout` | Đăng xuất (stateless) |
| 6 | Payment | POST | `/driver/payments/confirm` | Xác nhận chuyển khoản |
| 7 | Payment | GET | `/driver/payments/vnpay-return` | VNPay callback (user redirect) |
| 8 | Payment | GET | `/driver/payments/vnpay-ipn` | VNPay callback (server-to-server) |
| 9-32 | Admin | ... | `/admin/*` | 24 endpoints CRUD (xem mục 6) |
| 33 | Blacklist | GET | `/security/blacklist` | Xem danh sách đen |
| 34 | Blacklist | POST | `/security/blacklist` | Thêm biển số vào blacklist |
| 35 | Blacklist | DELETE | `/security/blacklist/{id}` | Gỡ biển số khỏi blacklist |

**Tổng: 35 API endpoints do bạn đảm nhiệm (5 Auth + 3 Payment + 24 Admin + 3 Blacklist).**
