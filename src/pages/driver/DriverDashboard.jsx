import { useState, useEffect } from 'react';
import { staffApi } from '../../api/parkingApi';

/**
 * DriverDashboard — Trang chính của Driver (Quảng phụ trách)
 *
 * TODO (Quảng): Implement các tính năng:
 * 1. Hiển thị biển số xe đã đăng ký (GET /driver/plates)
 * 2. Hiển thị session đang gửi (GET /driver/sessions/active)
 * 3. Hiển thị reservation đang chờ (GET /driver/reservations)
 * 4. Hiển thị lịch sử gửi xe (GET /driver/sessions/history)
 * 5. Thống kê: tổng lần gửi, tổng giờ, tổng chi phí, chỗ trống
 * 6. Chức năng thanh toán chuyển khoản + VNPAY
 * 7. WebSocket listener: /topic/payments/confirmed
 */
export default function DriverDashboard({ onLogout }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold">🚗 Driver Dashboard</h1>
      <p className="text-gray-400 mt-2">Coming soon — Quảng phụ trách</p>
      <button onClick={onLogout} className="mt-4 px-4 py-2 bg-red-600 rounded">Đăng xuất</button>
    </div>
  );
}
