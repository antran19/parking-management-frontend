import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import driverAvatar from "../../assets/driver-avatar.png";
import DriverSidebar from "../../components/DriverSidebar";
import { getDriverDashboard } from "../../api/driverApi";

export default function DriverDashboard({ onLogout }) {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    localStorage.removeItem("role");

    if (typeof onLogout === "function") {
      onLogout();
    }

    navigate("/login", { replace: true });
  };

  useEffect(() => {
    const loadDriverDashboard = async () => {
      try {
        setLoading(true);
        setApiError("");

        const result = await getDriverDashboard();

        setData({
          user: {
            id: result?.user?.id,
            name: result?.user?.name || result?.user?.fullName || "Tài xế",
            avatar: result?.user?.avatar || driverAvatar,
            membership: result?.user?.membership || "Thành viên",
          },
          currentSession: result?.currentSession || null,
          currentBooking: result?.currentBooking || null,
          stats: result?.stats || {
            totalParking: 0,
            totalHours: "0 giờ",
            totalCost: "0đ",
            availableSlots: "0 chỗ",
          },
          history: Array.isArray(result?.history) ? result.history : [],
        });
      } catch (error) {
        console.error("Driver dashboard API error:", error);
        setApiError("Không thể tải dữ liệu bảng điều khiển từ hệ thống.");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    loadDriverDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-800">
        <DriverSidebar active="dashboard" onLogout={handleLogout} />

        <div className="ml-64 flex-1">
          <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-white px-8">
            <h2 className="text-2xl font-bold">Bảng điều khiển</h2>
          </header>

          <main className="p-8">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              Đang tải bảng điều khiển...
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-800">
        <DriverSidebar active="dashboard" onLogout={handleLogout} />

        <div className="ml-64 flex-1">
          <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-white px-8">
            <h2 className="text-2xl font-bold">Bảng điều khiển</h2>
          </header>

          <main className="p-8">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
              <p className="font-bold">Lỗi tải dữ liệu</p>
              <p className="mt-1 text-sm">{apiError}</p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
              >
                Tải lại
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-800">
        <DriverSidebar active="dashboard" onLogout={handleLogout} />

        <div className="ml-64 flex-1">
          <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-white px-8">
            <h2 className="text-2xl font-bold">Bảng điều khiển</h2>
          </header>

          <main className="p-8">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              Không có dữ liệu.
            </div>
          </main>
        </div>
      </div>
    );
  }

  const { user, currentSession, currentBooking, stats, history } = data;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <DriverSidebar active="dashboard" onLogout={handleLogout} />

      <div className="ml-64 flex-1">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-white px-8">
          <h2 className="text-2xl font-bold">Bảng điều khiển</h2>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold">{user?.name || "Tài xế"}</p>
              <p className="text-xs text-slate-500">
                {user?.membership || "Thành viên"}
              </p>
            </div>

            <img
              src={user?.avatar || driverAvatar}
              alt="Ảnh đại diện tài xế"
              className="h-10 w-10 rounded-full border object-cover"
            />
          </div>
        </header>

        <main className="space-y-8 p-8">
          <section className="rounded-2xl bg-slate-900 px-12 py-10 text-white">
            <h2 className="mb-2 text-3xl font-bold">
              Xin chào, {user?.name || "Tài xế"} 👋
            </h2>
            <p className="text-slate-300">
              Bạn có thể xem vị trí xe, đặt chỗ và theo dõi chi phí gửi xe tại
              đây.
            </p>
          </section>

          <div className="grid grid-cols-12 gap-6">
            <section className="col-span-12 rounded-2xl border bg-white p-6 shadow-sm lg:col-span-4">
              <h3 className="mb-6 text-lg font-bold">
                Phiên gửi xe hiện tại
              </h3>

              {currentSession ? (
                <>
                  <InfoRow label="Trạng thái:" value={currentSession.status} />
                  <InfoRow
                    label="Vị trí:"
                    value={`${currentSession.slot || "--"} | ${
                      currentSession.floor || "--"
                    }`}
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
                <ActionCard to="/driver/reservation" title="Đặt chỗ gửi xe" />
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
                  value={String(stats?.totalParking ?? 0)}
                />
                <StatCard
                  title="Tổng giờ gửi"
                  value={stats?.totalHours || "0 giờ"}
                />
                <StatCard
                  title="Tổng chi phí"
                  value={stats?.totalCost || "0đ"}
                />
                <StatCard
                  title="Chỗ trống hiện tại"
                  value={stats?.availableSlots || "0 chỗ"}
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
                    <InfoBox
                      label="Trạng thái"
                      value={currentBooking.status}
                    />
                    <InfoBox
                      label="Vị trí"
                      value={`${currentBooking.slot || "--"} | ${
                        currentBooking.floor || "--"
                      }`}
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
                {history.length > 0 ? (
                  history.map((item, index) => (
                    <tr
                      key={item.id || index}
                      className="border-t hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">{item.date || "--"}</td>
                      <td className="px-6 py-4 font-bold">
                        {item.slot || "--"}
                      </td>
                      <td className="px-6 py-4">{item.vehicle || "--"}</td>
                      <td className="px-6 py-4">{item.status || "--"}</td>
                      <td className="px-6 py-4 text-right font-bold">
                        {item.cost || "0đ"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      Chưa có lịch sử gửi xe.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </main>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between border-b py-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-bold">{value || "--"}</span>
    </div>
  );
}

function ActionCard({ title, to }) {
  return (
    <Link
      to={to}
      className="flex h-24 items-center justify-center rounded-xl bg-slate-900 text-center text-sm font-semibold text-white hover:bg-slate-800"
    >
      {title}
    </Link>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="mb-2 text-xs font-bold uppercase text-slate-400">
        {title}
      </p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-bold">{value || "--"}</p>
    </div>
  );
}