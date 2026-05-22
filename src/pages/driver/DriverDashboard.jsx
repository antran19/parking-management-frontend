// src/pages/driver/DriverDashboard.jsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import driverAvatar from "../../assets/driver-avatar.png";

export default function DriverDashboard({ onLogout }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockData = {
      user: {
        id: 1,
        name: "Nguyễn Văn A",
        avatar: driverAvatar,
        membership: "Thành viên thường",
      },

      currentSession: {
        slot: "A12",
        floor: "Tầng 1",
        area: "Khu A",
        vehicle: "Xe hơi",
        startTime: "08:30",
        duration: "2 giờ 15 phút",
        estimatedFee: "35.000đ",
        status: "Đang gửi xe",
      },

      currentBooking: {
        bookingCode: "BK-20260521-001",
        slot: "A12",
        floor: "Tầng 1",
        vehicleType: "Xe hơi",
        status: "Đã check-in",
      },

      stats: {
        totalParking: 24,
        totalHours: "58 giờ",
        totalCost: "720.000đ",
        availableSlots: "124 chỗ",
      },

      history: [
        {
          id: 1,
          date: "20/05/2026 - 08:30",
          slot: "A12",
          vehicle: "Xe hơi",
          cost: "35.000đ",
          status: "Đã thanh toán",
        },

        {
          id: 2,
          date: "19/05/2026 - 14:20",
          slot: "B08",
          vehicle: "Xe máy",
          cost: "25.000đ",
          status: "Đã thanh toán",
        },

        {
          id: 3,
          date: "18/05/2026 - 09:10",
          slot: "C04",
          vehicle: "Xe điện",
          cost: "40.000đ",
          status: "Đã thanh toán",
        },
      ],
    };

    setData(mockData);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="p-8">Đang tải bảng điều khiển...</div>;
  }

  if (!data) {
    return <div className="p-8">Không có dữ liệu</div>;
  }

  const { user, currentSession, currentBooking, stats, history } = data;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-20 flex h-full w-64 flex-col bg-slate-900 text-white">
        <div className="p-6">
          <h1 className="text-xl font-bold">Smart Park</h1>

          <p className="mb-8 text-xs text-slate-400">
            CỔNG TÀI XẾ
          </p>

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

        <div className="mt-auto border-t border-white/10 p-6">
          <button
            onClick={onLogout}
            className="w-full rounded-lg bg-red-500 px-4 py-3 font-semibold text-white hover:bg-red-600"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">
              Xin chào, {user.name}
            </h2>

            <p className="mt-1 text-slate-500">
              Chúc bạn có trải nghiệm gửi xe thuận tiện 🚗
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
            <img
              src={user.avatar}
              alt="avatar"
              className="h-14 w-14 rounded-full object-cover"
            />

            <div>
              <p className="font-semibold">{user.name}</p>

              <p className="text-sm text-slate-500">
                {user.membership}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Tổng lượt gửi"
            value={stats.totalParking}
          />

          <StatCard
            title="Tổng thời gian"
            value={stats.totalHours}
          />

          <StatCard
            title="Tổng chi phí"
            value={stats.totalCost}
          />

          <StatCard
            title="Chỗ trống hiện tại"
            value={stats.availableSlots}
          />
        </div>

        {/* Current Session */}
        {currentSession && (
          <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-6 text-xl font-bold">
              Phiên gửi xe hiện tại
            </h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              <InfoItem
                label="Vị trí"
                value={`${currentSession.floor} - ${currentSession.slot}`}
              />

              <InfoItem
                label="Khu vực"
                value={currentSession.area}
              />

              <InfoItem
                label="Loại xe"
                value={currentSession.vehicle}
              />

              <InfoItem
                label="Trạng thái"
                value={currentSession.status}
              />

              <InfoItem
                label="Bắt đầu"
                value={currentSession.startTime}
              />

              <InfoItem
                label="Thời gian"
                value={currentSession.duration}
              />

              <InfoItem
                label="Phí dự kiến"
                value={currentSession.estimatedFee}
              />
            </div>
          </div>
        )}

        {/* Booking */}
        {currentBooking && (
          <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-bold">
              Đặt chỗ hiện tại
            </h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              <InfoItem
                label="Mã đặt chỗ"
                value={currentBooking.bookingCode}
              />

              <InfoItem
                label="Slot"
                value={currentBooking.slot}
              />

              <InfoItem
                label="Tầng"
                value={currentBooking.floor}
              />

              <InfoItem
                label="Loại xe"
                value={currentBooking.vehicleType}
              />

              <InfoItem
                label="Trạng thái"
                value={currentBooking.status}
              />
            </div>
          </div>
        )}

        {/* History */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="mb-6 text-xl font-bold">
            Lịch sử gửi xe
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="pb-3">Ngày</th>
                  <th className="pb-3">Slot</th>
                  <th className="pb-3">Loại xe</th>
                  <th className="pb-3">Chi phí</th>
                  <th className="pb-3">Trạng thái</th>
                </tr>
              </thead>

              <tbody>
                {history.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100"
                  >
                    <td className="py-4">{item.date}</td>

                    <td className="py-4">{item.slot}</td>

                    <td className="py-4">{item.vehicle}</td>

                    <td className="py-4">{item.cost}</td>

                    <td className="py-4">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>

      <h3 className="mt-2 text-3xl font-bold text-slate-900">
        {value}
      </h3>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>

      <p className="mt-1 font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}