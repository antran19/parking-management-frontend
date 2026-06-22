/**
 * StaffCheckIn — Trang check-in xe vào bãi (Tùng phụ trách)
 *
 * TODO (Tùng): Implement:
 * 1. Form nhập biển số (3 cách: thủ công, quét QR, AI OCR Tesseract.js)
 * 2. Chọn loại xe + cổng vào (load từ GET /parking/config)
 * 3. Hỗ trợ nhập mã đặt chỗ (reservationCode)
 * 4. Gọi POST /staff/sessions/checkin
 * 5. Hiển thị kết quả: zone, tầng, hướng dẫn đỗ xe
 */
export default function StaffCheckIn({ onLogout }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold">🚗 Check-in xe vào</h1>
      <p className="text-gray-400 mt-2">Coming soon — Tùng phụ trách</p>
    </div>
  );
}
