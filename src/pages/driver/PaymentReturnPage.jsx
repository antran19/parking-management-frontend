/**
 * PaymentReturnPage — Trang kết quả thanh toán VNPAY (Quảng phụ trách)
 *
 * TODO (Quảng): Implement:
 * - Đọc query params từ URL (vnp_ResponseCode, vnp_Amount...)
 * - Hiển thị kết quả: thành công (confetti) hoặc thất bại (thông báo lỗi)
 * - Nút quay về Dashboard
 */
export default function PaymentReturnPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <h1 className="text-2xl font-bold">💳 Kết quả thanh toán</h1>
      <p className="text-gray-400 mt-2">Coming soon — Quảng phụ trách</p>
    </div>
  );
}
