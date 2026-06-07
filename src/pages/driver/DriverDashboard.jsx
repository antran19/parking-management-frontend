// src/pages/driver/DriverDashboard.jsx

import { Link, useNavigate } from "react-router-dom";
import driverAvatar from "../../assets/driver-avatar.png";
import DriverSidebar from "../../components/DriverSidebar";
import { getParkingSummary } from "../../data/parkingData";
import {
  formatCurrency,
  formatDateTime,
  getActiveSession,
  getHistory,
  getPasses,
  getReservations,
} from "../../services/smartParkingStorage";

export default function DriverDashboard({ onLogout }) {
  const navigate = useNavigate();
  const summary = getParkingSummary();
  const currentSession = getActiveSession();
  const history = getHistory().slice(0, 3);
  const reservations = getReservations().slice(0, 2);
  const activePasses = getPasses().filter((pass) => pass.status === "ACTIVE");

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    if (onLogout) onLogout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <DriverSidebar active="dashboard" onLogout={handleLogout} />

      <div className="ml-64 flex-1">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-white px-8">
          <h2 className="text-2xl font-bold">Bảng điều khiển</h2>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold">Ngọc Quảng</p>
              <p className="text-xs text-slate-500">Frontend Driver / Admin / QA</p>
            </div>
            <img src={driverAvatar} alt="Ảnh đại diện" className="h-10 w-10 rounded-full border object-cover" />
          </div>
        </header>

        <main className="space-y-8 p-8">
          <section className="rounded-3xl bg-slate-900 px-10 py-9 text-white">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-300">
              SmartParking Driver
            </p>
            <h1 className="mt-2 text-3xl font-black">Xin chào, Quảng 👋</h1>
            <p className="mt-2 max-w-3xl text-slate-300">
              Khu Driver có các chức năng chính: xem mapping theo tầng, đặt chỗ
              bằng QR, mua vé tháng/quý/năm, thanh toán và xem lịch sử.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-4">
            <StatCard title="Tổng slot" value={summary.capacity} />
            <StatCard title="Đã chiếm" value={summary.occupied + summary.reserved} />
            <StatCard title="Chưa chiếm" value={summary.available} />
            <StatCard title="Vé active" value={activePasses.length} />
          </section>

          <section className="grid gap-6 xl:grid-cols-12">
            <div className="xl:col-span-5">
              <section className="rounded-3xl border bg-white p-6 shadow-sm">
                <h3 className="text-xl font-black text-slate-950">Phiên gửi xe hiện tại</h3>

                {currentSession ? (
                  <div className="mt-5 space-y-4">
                    <InfoRow label="Mã phiên" value={currentSession.sessionCode} />
                    <InfoRow label="Biển số" value={currentSession.licensePlate} />
                    <InfoRow label="Loại xe" value={currentSession.vehicleLabel} />
                    <InfoRow label="Vị trí" value={`${currentSession.floorLabel} - Khu ${currentSession.areaId}`} />
                    <InfoRow label="Thời gian vào" value={formatDateTime(currentSession.checkInAt)} />
                    <InfoRow
                      label="Phí tạm tính"
                      value={formatCurrency(currentSession.baseFee + currentSession.extraFee + currentSession.serviceFee)}
                    />

                    <Link
                      to="/driver/payment"
                      className="block w-full rounded-2xl bg-slate-950 py-3 text-center font-black text-white hover:bg-slate-800"
                    >
                      Thanh toán / Lấy QR rời bãi
                    </Link>
                  </div>
                ) : (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-slate-500">
                    Bạn chưa có phiên gửi xe đang hoạt động.
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-6 xl:col-span-7">
              <section className="grid gap-4 md:grid-cols-3">
                <ActionCard to="/driver/map" title="Xem mapping" desc="Slot theo tầng" />
                <ActionCard to="/driver/reservation" title="Đặt chỗ" desc="Sinh QR Staff" />
                <ActionCard to="/driver/pass" title="Mua vé" desc="QR ParkingPass" />
              </section>

              <section className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-950">Đặt chỗ gần đây</h3>
                    <p className="text-sm text-slate-500">Các reservation đã tạo QR</p>
                  </div>
                  <Link to="/driver/reservation" className="font-bold text-blue-600 hover:underline">
                    Tạo mới
                  </Link>
                </div>

                <div className="mt-5 space-y-3">
                  {reservations.length === 0 ? (
                    <p className="rounded-2xl bg-slate-50 p-4 text-slate-500">Chưa có đặt chỗ.</p>
                  ) : (
                    reservations.map((item) => (
                      <div key={item.reservationCode} className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex justify-between gap-4">
                          <div>
                            <p className="font-black">{item.reservationCode}</p>
                            <p className="text-sm text-slate-500">{item.licensePlate} • {item.vehicleLabel}</p>
                          </div>
                          <span className="text-sm font-bold text-blue-600">{item.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </section>

          <section className="rounded-3xl border bg-white p-6 shadow-sm">
            <h3 className="text-xl font-black text-slate-950">Lịch sử gần đây</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {history.map((item) => (
                <article key={item.id} className="rounded-2xl bg-slate-50 p-5">
                  <p className="font-black">{item.sessionCode}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.licensePlate} • {item.vehicleLabel}</p>
                  <p className="mt-3 text-lg font-black text-blue-600">{formatCurrency(item.fee)}</p>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <p className="text-sm font-bold uppercase text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className="text-right font-black text-slate-950">{value}</span>
    </div>
  );
}

function ActionCard({ to, title, desc }) {
  return (
    <Link to={to} className="rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <p className="text-lg font-black text-slate-950">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
    </Link>
  );
}
