# SmartParking Admin & Driver

Bản này tập trung vào phần Quảng phụ trách: giao diện Admin, giao diện Driver và QA.

## Kiến trúc hiện tại

- React + Vite
- React Router
- Không dùng mock data cho nghiệp vụ Admin/Driver
- Dữ liệu lấy qua API trong `src/shared/services/httpClient.js` và `src/shared/services/smartParkingStore.js`

## Cấu hình API

Tạo file `.env` từ `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## Route chính

- `/admin/dashboard`
- `/admin/mapping`
- `/admin/drivers`
- `/admin/employees`
- `/driver/dashboard`
- `/driver/mapping`
- `/driver/reservation`
- `/driver/pass`
- `/driver/payment`
