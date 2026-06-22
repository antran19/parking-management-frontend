/**
 * AdminDashboard — Dashboard quản trị (An phụ trách)
 *
 * TODO (An): Implement CRUD cho:
 * 1. Quản lý Users (tạo/sửa/xóa/phân quyền)
 * 2. Quản lý Zones (tạo zone mới, sửa capacity, đổi status)
 * 3. Quản lý Gates (tạo/sửa cổng, điều khiển barrier)
 * 4. Quản lý Pricing Rules (bảng giá theo loại xe)
 * 5. Quản lý Parking Passes (duyệt/gia hạn/hủy vé tháng)
 * 6. System Settings (cấu hình chung)
 */
export default function AdminDashboard({ onLogout }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold">⚙️ Admin Dashboard</h1>
      <p className="text-gray-400 mt-2">Coming soon — An phụ trách</p>
      <button onClick={onLogout} className="mt-4 px-4 py-2 bg-red-600 rounded">Đăng xuất</button>
    </div>
  );
}
