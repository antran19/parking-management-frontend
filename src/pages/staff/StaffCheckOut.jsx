/**
 * StaffCheckOut — Trang check-out xe ra bãi (Tùng phụ trách)
 *
 * TODO (Tùng): Implement:
 * 1. Tìm kiếm session theo biển số/mã phiên
 * 2. Hiển thị thông tin: thời gian gửi, phí, zone
 * 3. Chọn phương thức thanh toán (CASH/BANK_TRANSFER)
 * 4. Gọi POST /staff/sessions/checkout
 * 5. WebSocket listener: /topic/payments/confirmed (nhận thông báo CK từ Driver)
 */
export default function StaffCheckOut({ onLogout }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold">🅿️ Check-out xe ra</h1>
      <p className="text-gray-400 mt-2">Coming soon — Tùng phụ trách</p>
    </div>
  );
}
