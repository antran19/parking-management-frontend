/**
 * StaffDashboard — Dashboard nhân viên (Tùng phụ trách)
 *
 * TODO (Tùng): Implement:
 * - Thống kê: doanh thu hôm nay, lượt gửi xe, xe đang đỗ, công suất
 * - Dữ liệu real-time từ API (không dùng mock data)
 * - Animation GSAP cho dashboard cards
 */
export default function StaffDashboard({ onLogout }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold">📋 Staff Dashboard</h1>
      <p className="text-gray-400 mt-2">Coming soon — Tùng phụ trách</p>
      <button onClick={onLogout} className="mt-4 px-4 py-2 bg-red-600 rounded">Đăng xuất</button>
    </div>
  );
}
