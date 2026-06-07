# SmartParking — Chức năng Quảng phụ trách và QA test

## 1. Phần Quảng được phân công

### Driver UI
- Xem mapping theo tầng: tổng slot, slot đã chiếm, slot chưa chiếm.
- Đặt chỗ trước: chọn tầng/khu, loại xe, thời gian và sinh QR cho Staff xác nhận.
- Mua vé tháng/quý/năm: chọn biển số, loại xe, gói vé và sinh QR thanh toán.
- Xem vé đang active: hiển thị QR ParkingPass để Staff nhận diện khách có vé.
- Thanh toán / rời bãi: tạo QR thanh toán và QR xác nhận rời bãi.
- Lịch sử gửi xe: xem session cũ, phí, trạng thái thanh toán.

### Admin UI
- Quản lý user: xem danh sách, thêm/sửa/khóa UI demo.
- Quản lý role: xem quyền theo ADMIN/MANAGER/STAFF/DRIVER/SECURITY.
- Quản lý bãi xe: xem capacity từng tầng và nút sửa capacity UI demo.

### Manager UI
- Dashboard thống kê: tổng xe trong bãi, slot còn trống, doanh thu demo, tỷ lệ lấp đầy.
- Capacity theo tầng.

### QA
- Test Staff check-in xe vãng lai.
- Test Staff check-out xe vãng lai.
- Test Driver đặt chỗ trước.
- Test Driver mua vé tháng/quý/năm.
- Test Security xử lý mất QR: hiện chưa làm UI riêng, cần bổ sung sau.

## 2. Các QR đã thêm

### Reservation QR
- File: `src/pages/driver/DriverReservation.jsx`
- Dùng khi driver đặt chỗ trước.
- Staff đọc tại `src/pages/staff/StaffCheckin.jsx`.

### ParkingPass Payment QR
- File: `src/pages/driver/DriverPass.jsx`
- Dùng khi driver thanh toán mua vé tháng/quý/năm.

### Active ParkingPass QR
- File: `src/pages/driver/DriverActivePass.jsx`
- Dùng cho Staff xác nhận driver có vé active.

### Checkout Payment QR
- File: `src/pages/driver/DriverPayment.jsx`
- Dùng khi driver thanh toán phí gửi xe.

### Exit Confirmation QR
- File: `src/pages/driver/DriverPayment.jsx`
- Sinh sau khi thanh toán để Staff xác nhận xe rời bãi.
- Staff đọc tại `src/pages/staff/StaffCheckout.jsx`.

## 3. Test case nhanh

### TC01 — Driver Mapping
1. Login role DRIVER.
2. Vào `/driver/map`.
3. Bấm từng tầng B1/B2/B3/B4.
4. Kiểm tra mỗi tầng có: Tổng slot, Đã chiếm, Chưa chiếm, thanh năng lượng.
5. Kiểm tra map A/B/C/D chỉ là layout, không chia slot riêng.

### TC02 — Driver đặt chỗ trước
1. Vào `/driver/reservation`.
2. Nhập biển số, chọn loại xe, tầng, khu, thời gian.
3. Bấm “Xác nhận đặt chỗ và tạo QR”.
4. Kiểm tra QR và mã `RSV-...` xuất hiện.

### TC03 — Staff xác nhận đặt chỗ
1. Login role STAFF.
2. Vào `/staff/check-in`.
3. Dán QR payload hoặc mã `RSV-...` từ Driver Reservation.
4. Bấm “Quét / đọc mã QR”.
5. Bấm “Xác nhận check-in”.
6. Kiểm tra sinh QR session.

### TC04 — Driver mua vé tháng/quý/năm
1. Vào `/driver/pass`.
2. Nhập biển số, chọn loại xe, chọn gói MONTHLY/QUARTERLY/YEARLY.
3. Bấm “Tạo QR thanh toán vé”.
4. Bấm “Demo xác nhận đã thanh toán”.
5. Kiểm tra sinh QR ParkingPass active.

### TC05 — Staff xác nhận vé active
1. Vào `/driver/active-pass`.
2. Copy QR payload hoặc mã `PASS-...`.
3. Staff vào `/staff/check-in`.
4. Dán QR hoặc mã pass.
5. Bấm xác nhận check-in.
6. Kiểm tra loại khách là `SUBSCRIBER`.

### TC06 — Driver thanh toán check-out
1. Vào `/driver/payment`.
2. Chọn phương thức thanh toán.
3. Bấm “Tạo QR thanh toán”.
4. Bấm “Demo xác nhận đã thanh toán”.
5. Kiểm tra sinh QR `EXIT-...`.

### TC07 — Staff xác nhận xe rời bãi
1. Staff vào `/staff/check-out`.
2. Dán QR exit hoặc mã `OUT-PAY-/EXIT-...`.
3. Bấm quét QR.
4. Bấm xác nhận cho xe rời bãi.

## 4. Những phần còn thiếu thật sự

- Chưa nối API backend thật cho Reservation, ParkingPass, Payment, Zone API.
- Chưa có Security UI riêng để xử lý mất QR, sai biển số, xe quá hạn.
- Chưa có camera/OCR thật, hiện là nhập tay hoặc dán QR payload.
- Chưa có Redis counter thật ở frontend, hiện capacity là dữ liệu demo.
- Chưa có biểu đồ doanh thu nâng cao, chỉ có dashboard demo.
