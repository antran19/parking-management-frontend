/**
 * ManagerDashboard — Dashboard quản lý (Toàn phụ trách)
 *
 * TODO (Toàn): Implement:
 * - Thống kê doanh thu (theo ngày/tuần/tháng)
 * - Biểu đồ công suất bãi xe
 * - Lịch sử giao dịch thanh toán
 * - Quản lý zone + cổng
 */
export default function ManagerDashboard({ onLogout }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold">📊 Manager Dashboard</h1>
      <p className="text-gray-400 mt-2">Coming soon — Toàn phụ trách</p>
      <button onClick={onLogout} className="mt-4 px-4 py-2 bg-red-600 rounded">Đăng xuất</button>
    </div>
  );
}
