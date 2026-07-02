# TÀI LIỆU HƯỚNG DẪN MODULE SECURITY ROLE (THIÊN PHỤ TRÁCH)

## 1. Tổng quan Security Role

**Security Role (Bảo vệ / An ninh)** đóng vai trò giám sát, xử lý các tình huống bất thường và đảm bảo an toàn cho bãi đỗ xe. 

**Các chức năng chính của module này bao gồm:**
- **Giám sát tổng quan (Dashboard):** Xem trạng thái các cổng, số lượng xe trong danh sách đen, sự cố đang diễn ra.
- **Tra cứu phương tiện (Vehicle Search) [MỚI]:** Kiểm tra nhanh xem một xe (dựa vào biển số) có đang nằm trong bãi không, đang đỗ ở vị trí nào, và lịch sử ra/vào của xe đó ra sao.
- **Quản lý sự cố (Exception Logs):** Ghi nhận các vấn đề như mất vé, sai biển số, xe nằm vùng sai quy định.
- **Danh sách đen (Blacklist):** Chặn các biển số xe vi phạm (nợ phí, trộm cắp, gây rối). Nếu xe trong danh sách đen đi qua cổng, hệ thống sẽ phát cảnh báo.
- **Khẩn cấp (Emergency SOS):** Khi có hỏa hoạn hoặc đe dọa an ninh, bảo vệ nhấn nút SOS để hệ thống mở toàn bộ barrier, phát thông báo cho mọi người sơ tán. Có thể bật/tắt quyền dùng tính năng này thông qua Cài đặt.

**Mối quan hệ giữa các file:**
- Frontend gọi API từ `parkingApi.js` để gửi yêu cầu lên Backend.
- Backend tiếp nhận tại các Controller (`SecurityController`, `SessionController`), xử lý logic qua các Service tương ứng.
- Khi có sự kiện quan trọng (như SOS, thêm xe vào Blacklist), Service Backend sẽ broadcast thông báo qua WebSocket (`SimpMessagingTemplate`) để Frontend cập nhật realtime (thông qua component `SecurityDashboard` và các component con).

---

## 2. Backend — Giải thích từng file

### `controller/SecurityController.java`
- **Nhiệm vụ:** Là điểm tiếp nhận các request từ phía Frontend cho nghiệp vụ an ninh (bảo vệ, quản lý).
- **Hàm chính:**
  - `logException()`: Báo cáo sự cố an ninh mới (gọi `SecurityExceptionService.logException`).
  - `getAllExceptions()`: Lấy danh sách sự cố.
  - `activateEmergency()` / `deactivateEmergency()`: Bật / tắt chế độ SOS (gọi `EmergencyService`).
  - `getEmergencyStatus()`: Lấy trạng thái SOS hiện tại.
  - `getEmergencySettings()` / `updateEmergencySettings()` **[MỚI]**: Lấy cấu hình và cập nhật trạng thái bật/tắt (Enable/Disable) toàn bộ chức năng SOS (tránh bị bảo vệ bấm nhầm nếu không cần thiết).
  - `addBlacklistPlate()` / `getBlacklist()`: Thêm / xem danh sách biển số đen (gọi `BlacklistService`).
- **Xử lý lỗi:** Ném ra các Exception nếu có lỗi logic, Spring sẽ handle và trả về `ApiResponse` tương ứng.
- **Lưu ý quan trọng:** Cần kiểm tra kỹ `@PreAuthorize` để đảm bảo chỉ các role được phép (SECURITY, MANAGER, ADMIN) mới gọi được.

### `controller/SessionController.java` (Phần liên quan Tra cứu)
- **Nhiệm vụ:** Phục vụ các nghiệp vụ liên quan đến phiên gửi xe. Đối với Security, Controller này hỗ trợ API tìm kiếm (Tra cứu) xe.
- **Hàm chính:**
  - `getActiveSessionByPlate`: API giúp Security nhập biển số và tra ra ngay xem chiếc xe đó có đang nằm trong bãi hay không, nằm ở Zone/Khu vực nào, vào cổng lúc mấy giờ, có kèm theo ảnh biển số lúc vào.
  - `getSessionsHistory`: Lấy lịch sử ra vào bãi của một biển số.

### `service/BlacklistService.java`
- **Nhiệm vụ:** Xử lý nghiệp vụ liên quan đến danh sách đen.
- **Hàm chính:**
  - `addToBlacklist(request)`: Chuẩn hóa biển số xe, kiểm tra xem đã nằm trong danh sách đen chưa. Nếu hợp lệ, lưu vào DB và **gửi tin nhắn WebSocket** báo có biển số mới (`/topic/blacklist`).
  - `isBlacklisted(licensePlate)` **[MỚI]**: Hàm kiểm tra cực nhanh trả về boolean xem xe có bị chặn không. Hàm này rất tiện để gọi chéo từ các Service khác (như CheckInService) mà không cần chọc sâu vào DB lấy cả Object ra, giúp tăng hiệu năng cho API IoT.
  - `ensurePlateNotBlacklisted()`: Gọi từ hàm trên, văng `BusinessException` nếu xe bị chặn.
  - `alertBlacklistAttempt()`: Phát tín hiệu cảnh báo khẩn qua WebSocket (`/topic/security/blacklist-alerts`) khi phát hiện xe đen cố gắng đi qua cổng.

### `service/EmergencyService.java`
- **Nhiệm vụ:** Xử lý logic phức tạp của tính năng SOS khẩn cấp.
- **Hàm chính:**
  - `activateEmergency(request)`: Kiểm tra cấu hình xem tính năng SOS có đang mở không. Tìm building, cập nhật **tất cả Gates thuộc Building đó thành trạng thái Mở (isActive = true)**, lưu `EmergencyEvent` vào DB, rồi broadcast qua WebSocket (`/topic/emergency`).
  - `deactivateEmergency(request)`: Hủy sự kiện SOS gần nhất đang `ACTIVE`, broadcast trạng thái hủy qua WS.
  - `getCurrentStatus()`: Trả về trạng thái SOS hiện tại.
  - `isSosEnabled()` / `updateSosEnabled()` **[MỚI]**: Quản lý bật/tắt cấu hình SOS vào DB (Bảng `system_settings`). Dành cho chức năng Settings để Admin có quyền khoá chức năng SOS.

---

## 3. Frontend — Giải thích từng file (Chi tiết Giao Diện / Routing)

### `src/pages/security/SecurityDashboard.jsx`
- **Vị trí hiển thị:** Route chính `/security`.
- **Nhiệm vụ:** Đây là Component gốc (Layout Layout cha) của module Security, chứa thanh Menu điều hướng (Sidebar) bên trái và màn hình nội dung bên phải.
- **State quan trọng:**
  - `activeTab`: Quản lý việc người dùng bấm vào tab nào trên menu để chuyển đổi nội dung hiển thị ("overview", "map3d", "search", "exception", "emergency", "blacklist").
  - `emergencyStatus`: Lưu trạng thái SOS, chia sẻ xuống các trang con.
  - `blacklistAlert`: Lưu cảnh báo xe đen xâm nhập (hiển thị Popup to đùng che cả màn hình).
- **Xử lý WebSocket:** Lắng nghe `/topic/emergency` và `/topic/security/blacklist-alerts`.

### `src/pages/security/VehicleSearchPage.jsx` [MỚI]
- **Vị trí hiển thị:** Người dùng nhấn vào Tab **"Tra cứu"** ở menu trái.
- **Nhiệm vụ:** Màn hình "Tra cứu phương tiện". Hỗ trợ bảo vệ kiểm tra xem 1 chiếc xe đang ở đâu trong bãi, hoặc đã ra vào những lần nào.
- **Hàm xử lý:**
  - `handleSearch()`: 
    1. Validation biển số xe xem có hợp lệ (Format biển VN) không.
    2. Gọi đồng thời 2 API cùng lúc bằng `Promise.allSettled`: `staffApi.getActiveSessionByPlate` (để xem xe có trong bãi không) và `staffApi.getAllSessionsHistory` (để lấy lịch sử).
    3. Hiển thị UI kết quả: Xe đang trong bãi thì báo Xanh (kèm ảnh), xe đã ra bãi thì báo lịch sử.

### `src/pages/security/BlacklistPage.jsx`
- **Vị trí hiển thị:** Người dùng nhấn vào Tab **"Danh sách đen"** ở menu trái.
- **Nhiệm vụ:** Giao diện thêm biển số vào danh sách cấm (cần nhập lý do và tải ảnh bằng chứng lên) và xem lịch sử các xe bị cấm.
- **Xử lý Logic ảnh:** Import hàm `uploadToCloudinary` từ `cloudinary.js` để upload ảnh biên bản vi phạm và lấy link URL trước khi gửi JSON thông tin Blacklist về Backend.

### `src/pages/security/EmergencyPage.jsx`
- **Vị trí hiển thị:** Người dùng nhấn vào Tab **"Khẩn cấp"** (Icon Còi báo động) ở menu trái.
- **Nhiệm vụ:** Giao diện có một nút bấm to đùng màu Đỏ để kích hoạt/hủy SOS. Có cơ chế bắt buộc phải **nhấn giữ chuột trong 3 giây** để thanh progress chạy đầy thì mới kích hoạt (Tránh vô tình click chuột nhầm gây loạn bãi đỗ xe).

### `src/pages/security/ExceptionLogsPage.jsx`
- **Vị trí hiển thị:** Người dùng nhấn vào Tab **"Sự cố"** ở menu trái.
- **Nhiệm vụ:** Form nhập sự cố an ninh (mất thẻ, hỏng xe, va quẹt) và xem danh sách sự cố đã giải quyết. Cần tải ảnh bằng chứng tương tự Blacklist.

### `src/utils/cloudinary.js` [MỚI]
- **Nhiệm vụ:** File cấu hình và tiện ích chung để xử lý việc đẩy file hình ảnh từ Frontend trực tiếp lên nền tảng Cloudinary.
- **Hàm `getCloudinaryFolder(isActionIn, isCameraPlate)`:**
  - Tự động lấy ngày tháng năm hiện tại sinh ra cấu trúc thư mục quản lý ảnh trên Cloud cực kỳ khoa học (VD: `parking/2026-07-01/IN/plate`).
- **Hàm `uploadToCloudinary(file)`:**
  - Đóng gói file thành `FormData` và dùng `fetch` đẩy API thẳng lên Cloudinary mà không qua Backend Spring Boot của chúng ta.

---

## 4. API Contract — Danh sách endpoint Security

| Method | URL | Mô tả | 
|---|---|---|
| **POST** | `/api/v1/security/exceptions` | Ghi nhận sự cố |
| **GET** | `/api/v1/security/exceptions` | Lấy danh sách sự cố | 
| **POST** | `/api/v1/security/emergency/activate` | Kích hoạt SOS khẩn cấp | 
| **POST** | `/api/v1/security/emergency/deactivate` | Hủy chế độ SOS |
| **GET** | `/api/v1/security/emergency/status` | Xem trạng thái SOS hiện tại | 
| **GET** | `/api/v1/security/emergency/history` | Xem lịch sử SOS | 
| **GET** | `/api/v1/security/emergency/settings` | **[MỚI]** Lấy cấu hình SOS (bật/tắt) |
| **PUT** | `/api/v1/security/emergency/settings` | **[MỚI]** Cập nhật cấu hình SOS (`sosEnabled`) |
| **POST** | `/api/v1/security/blacklist` | Thêm vào blacklist | 
| **GET** | `/api/v1/security/blacklist` | Danh sách Blacklist | 
| **GET** | `/api/v1/staff/sessions/active?licensePlate=...` | **[MỚI]** Tra cứu xe xem có đang trong bãi không |
| **GET** | `/api/v1/staff/sessions/history?licensePlate=...` | **[MỚI]** Tra cứu lịch sử gửi xe |

---

## 5. WebSocket Topics

Hệ thống cung cấp tính năng Real-time dựa trên WebSocket (Spring Boot STOMP).

### 1. `/topic/emergency`
- **Khi nào BE broadcast:** Khi gọi hàm `activateEmergency()` hoặc `deactivateEmergency()`.
- **FE nhận data gì:** Object `{ "type": "EMERGENCY_SOS", "active": true/false, "message": "...", "reason": "..." }`.
- **FE xử lý thế nào:** Component `SecurityDashboard` bắt sự kiện, cập nhật state `emergencyStatus` toàn cục, hiện Banner đỏ rực trên UI và bật loa cảnh báo.

### 2. `/topic/blacklist`
- **Khi nào BE broadcast:** Khi thêm mới một biển số vào danh sách đen.
- **FE nhận data gì:** Object `{ "action": "ADDED", "data": { ...BlacklistPlateResponse } }`.
- **FE xử lý thế nào:** Component `BlacklistPage` lắng nghe để cập nhật danh sách đen realtime.

### 3. `/topic/security/blacklist-alerts`
- **Khi nào BE broadcast:** Khi xe đang có biển trong danh sách đen cố gắng quẹt thẻ ra/vào tại Cổng (do Service Checkin gọi hàm `alertBlacklistAttempt`).
- **FE nhận data gì:** Object `BlacklistAlertResponse` có chứa biển số, lý do và cổng phát hiện.
- **FE xử lý thế nào:** `SecurityDashboard` bật một màn hình đen/đỏ đè toàn bộ UI (FullScreen Popup) và kêu tiếng Alarm bíp bíp liên tục, bắt bảo vệ phải nhấn nút "Đã tiếp nhận" mới tắt được.

---

## 6. Luồng hoạt động nghiệp vụ chi tiết (Dành cho thuyết trình)

### 6.1. Luồng "Tra cứu phương tiện" (Vehicle Search) [MỚI ĐƯỢC BỔ SUNG]
- **Mục đích:** Khi có khách phàn nàn "Tôi để quên đồ trên xe mà không nhớ đậu ở đâu", hoặc an ninh nghi ngờ một chiếc xe trộm cắp, cần xem lại lịch sử ra vào.
- **Thao tác thực tế:** Bảo vệ vào Tab "Tra cứu", nhập biển số xe vào ô và bấm Enter.
- **Hệ thống xử lý ngầm (Flow):**
  1. Frontend gọi hàm JavaScript `formatLicensePlate` để tự động chuẩn hóa biển số (VD nhập `30a 12345` tự format thành `30A-123.45`).
  2. Dùng kỹ thuật bất đồng bộ (`Promise.allSettled`) gọi thẳng xuống 2 API cùng một lúc: API kiểm tra trạng thái trong bãi và API lấy lịch sử. Việc gọi song song giúp tiết kiệm 50% thời gian load so với gọi tuần tự.
  3. Nếu xe đang đỗ trong bãi: UI sẽ highlight màu xanh, show hình ảnh khuôn mặt / biển số lúc đi qua camera vào bãi, mã vé, và vị trí đỗ.
  4. Nếu có lịch sử: Đổ ra một bảng danh sách các lần check-in / check-out trước đó và phí đã thanh toán.

### 6.2. Luồng "SOS Khẩn Cấp" (Emergency)
- **Cập nhật MỚI:** Có thêm API cấu hình Settings cho phép Admin khóa/bật nút SOS (lưu vào bảng `system_settings`).
- **Thao tác thực tế:** Bảo vệ chuyển sang Tab "Khẩn cấp", nhấn **và giữ chặt** nút SOS lớn trong đúng 3 giây (tránh vô ý bấm nhầm).
- **Hệ thống xử lý ngầm (Flow):** 
  1. Frontend gửi API `POST` báo động xuống Backend.
  2. Backend ra lệnh đổi trạng thái tất cả các Barrier thành mở, chặn tính năng thanh toán.
  3. Phát tín hiệu qua WebSocket, màn hình của mọi nhân viên hiện cảnh báo đỏ và còi hú.

### 6.3. Luồng "Danh sách đen" (Blacklist)
- **Cập nhật MỚI:** Bổ sung hàm tiện ích `isBlacklisted(plate)` phía Backend.
- **Lợi ích:** Các trạm Barrier IoT khi check-in sẽ gọi vào backend, thay vì phải query ra một bộ dữ liệu khổng lồ (ảnh biên bản, người lập, thời gian...), Backend chỉ cần dùng hàm `isBlacklisted` lấy nhanh kết quả `True/False` trả về. Tối ưu độ trễ xử lý IoT tại cổng chỉ mất dưới vài mili-giây.
- **Hệ thống xử lý ngầm (Flow):** Khi quét biển, nếu vướng Blacklist, cổng bị khóa và Popup báo động được Push realtime về phòng Điều khiển an ninh qua WebSocket.

### 6.4. Luồng "Ghi nhận sự cố" (Exception Logs)
- **Mục đích:** Ghi sổ nhật ký các sự cố như mất thẻ xe.
- **Hệ thống xử lý ngầm (Flow):**
  1. Ảnh chụp từ Camera được đẩy qua hàm `uploadToCloudinary` trong `cloudinary.js` để đẩy lên Cloud lấy Link URL lưu trữ.
  2. Thông tin sự cố (kèm Link URL hình ảnh) sẽ được gửi xuống API Backend để lưu vào Database.

---

## 7. Giải thích kỹ thuật chuyên sâu (Dành cho thuyết trình/vấn đáp)

**Câu 1: "Tại sao ở chức năng Tra cứu xe, em lại gọi 2 API cùng 1 lúc? Sao không gộp chung vào 1 API cho nhàn?"**
> **Trả lời:** Dạ, hệ thống của em thiết kế chuẩn RESTful API theo hướng Micro-service. API `ActiveSession` lấy data real-time, còn API `HistorySession` lấy dữ liệu lịch sử cực lớn. Nếu gộp chung sẽ làm chậm thời gian phản hồi. Việc em tách riêng 2 API và gọi song song bằng lệnh `Promise.allSettled()` ở Frontend giúp tách biệt logic. Lỡ Database bị nghẽn load lịch sử chậm, thì bảo vệ vẫn thấy ngay được trạng thái "Xe đang trong bãi" ngay lập tức để xử lý sự cố.

**Câu 2: "Hàm kiểm tra Blacklist (`isBlacklisted`) mới thêm khác gì với cái API Get Blacklist cũ?"**
> **Trả lời:** Dạ API `getBlacklist` là dùng để lấy toàn bộ dữ liệu (ảnh, lý do, người lập...) hiển thị lên màn hình. Còn hàm `isBlacklisted` ở Backend là hàm nội bộ tối ưu hóa, nó chỉ dùng câu lệnh truy vấn boolean (`existsBy...`) dưới Database để trả về kết quả `True/False` một cách nhanh nhất. Điều này giúp hệ thống IoT Camera khi quẹt thẻ không bị độ trễ lớn khi check biển số cấm ạ.

**Câu 3: "Biển số xe có các ký tự đặc biệt, hoặc người thì nhập chữ thường, chữ hoa. Vậy làm sao em tra cứu chính xác được?"**
> **Trả lời:** Dạ, hệ thống của em xử lý chuẩn hóa ở cả Frontend và Backend. Khi tra cứu, Frontend đã ép viết hoa và dùng Regex để format chuỗi. Dưới DB, em lưu thêm 1 cột tên là `normalizedPlate` (Biển số chuẩn hóa: cắt bỏ mọi dấu cách, dấu chấm, viết IN HOA toàn bộ). Nên "30A-123.45" và "30A 12345" đều biến thành "30A12345" và matching tuyệt đối ạ.

**Câu 4: "Hình ảnh biển số hay khuôn mặt (khi thêm Blacklist/Sự cố/Xe ra vào) được lưu trữ như thế nào? Tại sao em không gửi file ảnh thẳng xuống Backend Spring Boot?"**
> **Trả lời:** Dạ, em thiết kế tách biệt phần lưu trữ Media (Hình ảnh/Video) và Dữ liệu Text để tối ưu máy chủ. 
> - Ở Frontend (file `src/utils/cloudinary.js`), em dùng trực tiếp API (Upload REST Endpoint) của Cloudinary để đẩy file ảnh từ trình duyệt thẳng lên Cloud.
> - Sau khi upload thành công, Cloudinary trả về một đường link URL (vd: *https://res.cloudinary.com/....*). 
> - Frontend mới lấy đường link URL này nhét vào chuỗi JSON (cùng với biển số, lý do...) rồi gửi xuống Backend Spring Boot.
> - **Lợi ích cực lớn:** Giúp server Spring Boot của em không bị quá tải bộ nhớ RAM khi phải đọc luồng byte của hàng nghìn file ảnh nặng. Database Postgres/MySQL cũng nhỏ gọn vì chỉ lưu chuỗi text (URL), và quan trọng là tốc độ tải ảnh trên web rất nhanh vì được hỗ trợ bởi hệ thống CDN toàn cầu của Cloudinary ạ.

**Câu 5: "Trong hàm xử lý ở phía Backend, ngoài việc gọi Database ra thì em có xử lý logic nghiệp vụ gì đặc biệt ở phần Tra cứu xe không?"**
> **Trả lời:** Dạ thưa thầy/cô, ở Backend (file `ParkingSessionService.java`) em thực hiện 2 logic "ăn tiền" quan trọng nhất:
> 1. **Logic chuẩn hoá dữ liệu (Data Normalization):** Backend tự động dùng Regex cắt bỏ toàn bộ ký tự đặc biệt và in hoa để đối soát 100% với biển số lưu trong DB, phòng trường hợp bảo vệ ấn nhầm phím khoảng trắng.
> 2. **Logic tính toán Phí Tạm tính (Real-time Estimation):** Khi API lấy thông tin xe đang trong bãi, Backend không chỉ trả về thông tin thông thường mà sẽ gọi qua hệ thống bảng giá (`PricingService`). Nó lấy thời điểm bảo vệ bấm Tra cứu, trừ đi thời điểm xe mới vào bãi để ra tổng số phút, từ đó tính ra số tiền Phí tạm tính. Điều này giúp bảo vệ báo thẳng số tiền cho khách ngay tại quầy mà không cần khách phải quẹt thẻ ra cổng.

**Câu 6: "Tại sao khi ghi nhận sự cố an ninh (Exception Logs) lại không cần lưu Session ID (mã phiên gửi xe) nữa?"**
> **Trả lời:** Dạ, trước đây hệ thống có lưu `sessionId` để biết sự cố thuộc về phiên gửi xe nào. Tuy nhiên trong quá trình làm thực tế, nhóm em nhận ra nhiều sự cố an ninh xảy ra mà xe **chưa hề được tạo phiên** (ví dụ: xe vãng lai cố tình đâm hỏng barrier rồi bỏ chạy, xe đậu sai quy định chặn lối ra vào cổng, hoặc khách chưa quẹt thẻ đã gây rối). Do đó, thiết kế mới đã loại bỏ sự phụ thuộc vào `sessionId` trong `ExceptionLog`, thay vào đó chỉ ghi nhận `licensePlate` (biển số xe) và hình ảnh bằng chứng. Điều này giúp bảo vệ linh hoạt ghi nhận mọi sự cố mà không bị ràng buộc bởi việc xe đó đã quẹt thẻ vào bãi hay chưa ạ.
