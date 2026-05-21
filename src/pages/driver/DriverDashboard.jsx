import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import driverAvatar from "../../assets/driver-avatar.png";
import { getDriverDashboard } from "../../api/driverApi";

export default function DriverDashboard({ onLogout }) {
  const [data, setData] = useState(null);
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
              Xin chào, {user.name}
            </h2>

            <p className="text-slate-300">
              Chúc bạn có trải nghiệm gửi xe thuận tiện hôm nay.
            </p>
          </section>

          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Tổng lượt gửi xe</p>
              <h3 className="mt-2 text-3xl font-bold">
                {stats.totalParking}
              </h3>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Tổng giờ gửi</p>
              <h3 className="mt-2 text-3xl font-bold">
                {stats.totalHours}
              </h3>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Tổng chi phí</p>
              <h3 className="mt-2 text-3xl font-bold">
                {stats.totalCost}
              </h3>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">Chỗ trống hiện tại</p>
              <h3 className="mt-2 text-3xl font-bold">
                {stats.availableSlots}
              </h3>
            </div>
          </section>

          {currentSession && (
            <section className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-bold">Phiên gửi xe hiện tại</h3>

                <span className="rounded-full bg-green-100 px-4 py-1 text-sm font-medium text-green-700">
                  {currentSession.status}
                </span>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-sm text-slate-500">Vị trí</p>
                  <p className="mt-1 font-semibold">
                    {currentSession.slot}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Tầng</p>
                  <p className="mt-1 font-semibold">
                    {currentSession.floor}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Khu vực</p>
                  <p className="mt-1 font-semibold">
                    {currentSession.area}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Biển số xe</p>
                  <p className="mt-1 font-semibold">
                    {currentSession.vehicle}
                  </p>
                </div>
              </div>
            </section>
          )}

          {currentBooking && (
            <section className="rounded-2xl bg-white p-8 shadow-sm">
              <h3 className="mb-6 text-xl font-bold">
                Đặt chỗ hiện tại
              </h3>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-sm text-slate-500">Mã đặt chỗ</p>
                  <p className="mt-1 font-semibold">
                    {currentBooking.bookingCode}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Vị trí</p>
                  <p className="mt-1 font-semibold">
                    {currentBooking.slot}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Tầng</p>
                  <p className="mt-1 font-semibold">
                    {currentBooking.floor}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500">Trạng thái</p>
                  <p className="mt-1 font-semibold">
                    {currentBooking.status}
                  </p>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}