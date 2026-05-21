import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import driverAvatar from "../../assets/driver-avatar.png";
import {
  getDriverDashboard,
  type DriverDashboardData,
} from "../../api/driverApi";

interface DriverDashboardProps {
  onLogout?: () => void;
}

export default function DriverDashboard({ onLogout }: DriverDashboardProps) {
  const [data, setData] = useState<DriverDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getDriverDashboard();
        setData(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Có lỗi xảy ra khi tải dữ liệu."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="p-8">Đang tải bảng điều khiển...</div>;
  }

  if (error || !data) {
    return (
      <div className="p-8 text-red-600">
        {error || "Không có dữ liệu bảng điều khiển."}
      </div>
    );
  }

  const { user, currentSession, currentBooking, stats, history } = data;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <aside className="fixed left-0 top-0 z-20 flex h-full w-64 flex-col bg-slate-900 text-white">
        <div className="p-6">
          <h1 className="text-xl font-bold">Smart Park</h1>
          <p className="mb-8 text-xs text-slate-400">CỔNG TÀI XẾ</p>

          <nav className="space-y-1">
            <Link
              to="/driver/dashboard"
              className="block rounded-lg border-l-4 border-blue-600 bg-white/10 px-4 py-3 font-medium text-white"
            >
              Bảng điều khiển
            </Link>

            <Link
              to="/driver/map"
              className="block rounded-lg px-4 py-3 font-medium text-slate-400 hover:bg-white/5 hover:text-white"
            >
              Sơ đồ bãi xe
            </Link>

            <Link
              to="/driver/current-session"
              className="block rounded-lg px-4 py-3 font-medium text-slate-400 hover:bg-white/5 hover:text-white"
            >
              Phiên gửi xe
            </Link>

            <Link
              to="/driver/history"
              className="block rounded-lg px-4 py-3 font-medium text-slate-400 hover:bg-white/5 hover:text-white"
            >
              Lịch sử gửi xe
            </Link>

            <Link
              to="/driver/profile"
              className="block rounded-lg px-4 py-3 font-medium text-slate-400 hover:bg-white/5 hover:text-white"
            >
              Hồ sơ cá nhân
            </Link>
          </nav>
        </div>

        <div className="mt-auto p-6">
          <button
            onClick={onLogout}
            className="px-4 py-3 text-slate-400 hover:text-white"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="ml-64 flex-1">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-white px-8">
          <h2 className="text-2xl font-bold">Bảng điều khiển</h2>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-slate-500">{user.membership}</p>
            </div>

            <img
              src={user.avatar || driverAvatar}
              alt="Ảnh đại diện tài xế"
              className="h-10 w-10 rounded-full border object-cover"
            />
          </div>
        </header>

        <main className="space-y-8 p-8">
          <section className="rounded-2xl bg-slate-900 px-12 py-10 text-white">
            <h2 className="mb-2 text-3xl font-bold">
              Xin chào, {user.name} 👋
            </h2>
            <p className="text-slate-300">
              Bạn có thể xem vị trí xe, đặt chỗ và theo dõi chi phí gửi xe tại
              đây.
            </p>
          </section>

          <div className="grid grid-cols-12 gap-6">
            <section className="col-span-12 rounded-2xl border bg-white p-6 shadow-sm lg:col-span-4">
              <h3 className="mb-6 text-lg font-bold">Phiên gửi xe hiện tại</h3>

              {currentSession ? (
                <>
                  <InfoRow label="Trạng thái:" value={currentSession.status} />
                  <InfoRow
                    label="Vị trí:"
                    value={`${currentSession.slot} | ${currentSession.floor}`}
                  />
                  <InfoRow label="Khu vực:" value={currentSession.area} />
                  <InfoRow label="Loại xe:" value={currentSession.vehicle} />
                  <InfoRow
                    label="Thời gian vào:"
                    value={currentSession.startTime}
                  />
                  <InfoRow
                    label="Thời lượng:"
                    value={currentSession.duration}
                  />
                  <InfoRow
                    label="Phí tạm tính:"
                    value={currentSession.estimatedFee}
                  />

                  <Link
                    to="/driver/payment"
                    className="mt-6 block w-full rounded-lg bg-slate-900 py-2.5 text-center text-white hover:bg-slate-800"
                  >
                    Thanh toán / Rời bãi
                  </Link>
                </>
              ) : (
                <div>
                  <p className="text-slate-500">
                    Bạn chưa có phiên gửi xe đang hoạt động.
                  </p>
                  <Link
                    to="/driver/map"
                    className="mt-6 block w-full rounded-lg bg-slate-900 py-2.5 text-center text-white hover:bg-slate-800"
                  >
                    Tìm chỗ đỗ xe
                  </Link>
                </div>
              )}
            </section>

            <div className="col-span-12 space-y-6 lg:col-span-8">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <ActionCard to="/driver/map" title="Đặt chỗ gửi xe" />
                <ActionCard to="/driver/map" title="Xem chỗ trống" />
                <ActionCard
                  to="/driver/current-session"
                  title="Xem vị trí xe"
                />
                <ActionCard to="/driver/history" title="Xem lịch sử" />
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard
                  title="Tổng lượt gửi"
                  value={String(stats.totalParking)}
                />
                <StatCard title="Tổng giờ gửi" value={stats.totalHours} />
                <StatCard title="Tổng chi phí" value={stats.totalCost} />
                <StatCard
                  title="Chỗ trống hiện tại"
                  value={stats.availableSlots}
                />
              </div>

              <section className="rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold">Đặt chỗ hiện tại</h3>

                {currentBooking ? (
                  <div className="grid grid-cols-2 gap-4">
                    <InfoBox
                      label="Mã đặt chỗ"
                      value={currentBooking.bookingCode}
                    />
                    <InfoBox label="Trạng thái" value={currentBooking.status} />
                    <InfoBox
                      label="Vị trí"
                      value={`${currentBooking.slot} | ${currentBooking.floor}`}
                    />
                    <InfoBox
                      label="Loại xe"
                      value={currentBooking.vehicleType}
                    />
                  </div>
                ) : (
                  <p className="text-slate-500">Bạn chưa có đặt chỗ nào.</p>
                )}
              </section>
            </div>
          </div>

          <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="border-b p-6">
              <h3 className="text-lg font-bold">Lịch sử gửi xe gần đây</h3>
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-400">
                  <th className="px-6 py-4">Ngày/Giờ</th>
                  <th className="px-6 py-4">Vị trí</th>
                  <th className="px-6 py-4">Loại xe</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Chi phí</th>
                </tr>
              </thead>

              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-t hover:bg-slate-50">
                    <td className="px-6 py-4">{item.date}</td>
                    <td className="px-6 py-4 font-bold">{item.slot}</td>
                    <td className="px-6 py-4">{item.vehicle}</td>
                    <td className="px-6 py-4">{item.status}</td>
                    <td className="px-6 py-4 text-right font-bold">
                      {item.cost}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b py-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function ActionCard({ title, to }: { title: string; to: string }) {
  return (
    <Link
      to={to}
      className="flex h-24 items-center justify-center rounded-xl bg-slate-900 text-center text-sm font-semibold text-white hover:bg-slate-800"
    >
      {title}
    </Link>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="mb-2 text-xs font-bold uppercase text-slate-400">
        {title}
      </p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}