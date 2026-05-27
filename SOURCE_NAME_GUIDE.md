# Source naming guide

Project folder: `frontendParking_Admin_Driver`

## Rule đặt tên source

- Trang tổng quan đặt theo mẫu: `RoleDashboardPage.jsx`
- Trang sơ đồ bãi xe đặt theo mẫu: `RoleMappingPage.jsx`
- Các trang nghiệp vụ khác đặt theo mẫu: `Role + chức năng + Page.jsx`

## Driver pages

- `DriverDashboardPage.jsx`: dashboard của tài xế
- `DriverMappingPage.jsx`: sơ đồ tầng/khu dành cho tài xế
- `DriverBookingPage.jsx`: đặt chỗ trước và tạo QR
- `DriverPassBuyPage.jsx`: mua gói thành viên
- `DriverQrPassPage.jsx`: vé/QR đang dùng
- `DriverPaymentPage.jsx`: thanh toán
- `DriverHistoryPage.jsx`: lịch sử gửi xe
- `DriverProfilePage.jsx`: hồ sơ xe

## Admin pages

- `AdminDashboardPage.jsx`: dashboard quản trị
- `AdminStaffPage.jsx`: nhân viên và phân quyền
- `AdminDriverListPage.jsx`: danh sách tài xế
- `AdminMappingPage.jsx`: quản lý tầng/khu/slot
- `AdminPackagePlanPage.jsx`: gói gửi xe và bảng giá
- `AdminBookingListPage.jsx`: đặt chỗ và QR
- `AdminRevenuePage.jsx`: thanh toán và doanh thu
- `AdminSystemSettingPage.jsx`: cài đặt hệ thống

## API

Source đã bỏ dữ liệu demo/localStorage cho nghiệp vụ Admin/Driver. Các màn lấy dữ liệu qua `src/shared/services/httpClient.js` và `src/shared/services/smartParkingStore.js`.

Cấu hình API base URL trong `.env`:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```
