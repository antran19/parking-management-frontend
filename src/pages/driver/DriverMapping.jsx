/**
 * DriverMapping — Bản đồ bãi xe cho Driver (Quảng phụ trách)
 *
 * TODO (Quảng): Implement sơ đồ bãi xe visual
 * - Hiển thị zones theo tầng, màu sắc theo trạng thái
 * - Chức năng đặt giữ chỗ (reservation) trực tiếp từ sơ đồ
 * - WebSocket listener: /topic/zones/{buildingId} để cập nhật real-time
 */
export default function DriverMapping({ onLogout }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold">🗺️ Sơ đồ bãi xe</h1>
      <p className="text-gray-400 mt-2">Coming soon — Quảng phụ trách</p>
    </div>
  );
}
