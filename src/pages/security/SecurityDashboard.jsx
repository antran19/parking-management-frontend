/**
 * SecurityDashboard — Dashboard bảo vệ (Thiên phụ trách)
 *
 * TODO (Thiên): Implement:
 * 1. Tab Giám sát cổng: WebSocket listener, duyệt xe ra/vào
 * 2. Tab Báo cáo sự cố: Form báo sự cố + danh sách sự cố đã ghi
 * 3. Tab SOS khẩn cấp: Nút kích hoạt/hủy SOS + lịch sử SOS
 * 4. Tab Blacklist: CRUD biển số đen + lý do
 * 5. WebSocket listeners: /topic/emergency, /topic/blacklist
 */
export default function SecurityDashboard({ onLogout }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold">🛡️ Security Dashboard</h1>
      <p className="text-gray-400 mt-2">Coming soon — Thiên phụ trách</p>
      <button onClick={onLogout} className="mt-4 px-4 py-2 bg-red-600 rounded">Đăng xuất</button>
    </div>
  );
}
