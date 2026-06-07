// src/pages/driver/DriverHistory.jsx

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DriverSidebar from "../../components/DriverSidebar";
import { formatCurrency, formatDateTime, getHistory } from "../../services/smartParkingStorage";

export default function DriverHistory({ onLogout }) {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [history] = useState(() => getHistory());

  const filteredHistory = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    if (!search) return history;

    return history.filter((item) => {
      return (
        item.sessionCode.toLowerCase().includes(search) ||
        item.licensePlate.toLowerCase().includes(search) ||
        item.floorLabel.toLowerCase().includes(search) ||
        item.vehicleLabel.toLowerCase().includes(search)
      );
    });
  }, [history, keyword]);

  const totalFee = filteredHistory.reduce((sum, item) => sum + item.fee, 0);

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
      <DriverSidebar active="history" onLogout={handleLogout} />

      <div className="ml-64 flex-1">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-white px-8">
          <div>
            <h2 className="text-2xl font-bold">Lịch sử gửi xe</h2>
            <p className="text-sm text-slate-500">
              Danh sách session cũ, phí và phương thức thanh toán
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-slate-100 font-bold">
            Q
          </div>
        </header>

        <main className="space-y-8 p-8">
          <section className="rounded-3xl bg-slate-900 p-8 text-white">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-300">
              Parking History
            </p>
            <h1 className="mt-2 text-3xl font-black">
              Theo dõi lịch sử gửi xe của Driver
            </h1>
            <p className="mt-2 max-w-3xl text-slate-300">
              Lịch sử được thêm tự động sau khi Driver thanh toán và lấy QR xác
              nhận rời bãi.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <StatCard label="Số phiên" value={filteredHistory.length} />
            <StatCard label="Tổng chi phí" value={formatCurrency(totalFee)} />
            <StatCard label="Trạng thái" value="Đã thanh toán" />
          </section>

          <section className="rounded-3xl border bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h3 className="text-xl font-black text-slate-950">Danh sách session</h3>
                <p className="text-sm text-slate-500">
                  Tìm theo mã phiên, biển số, tầng hoặc loại xe.
                </p>
              </div>

              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm kiếm..."
                className="w-full rounded-2xl border px-4 py-3 font-semibold outline-none focus:border-slate-900 md:w-80"
              />
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                    <th className="px-5 py-4">Mã phiên</th>
                    <th className="px-5 py-4">Biển số</th>
                    <th className="px-5 py-4">Loại xe</th>
                    <th className="px-5 py-4">Vị trí</th>
                    <th className="px-5 py-4">Thời gian</th>
                    <th className="px-5 py-4 text-right">Phí</th>
                    <th className="px-5 py-4">Trạng thái</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-slate-50">
                      <td className="px-5 py-4 font-bold">{item.sessionCode}</td>
                      <td className="px-5 py-4">{item.licensePlate}</td>
                      <td className="px-5 py-4">{item.vehicleLabel}</td>
                      <td className="px-5 py-4">
                        <p className="font-bold">{item.floorLabel}</p>
                        <p className="text-xs text-slate-500">Khu {item.areaId}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm">Vào: {formatDateTime(item.checkInAt)}</p>
                        <p className="text-sm text-slate-500">Ra: {formatDateTime(item.checkOutAt)}</p>
                      </td>
                      <td className="px-5 py-4 text-right font-black">
                        {formatCurrency(item.fee)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                          {item.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredHistory.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  Không tìm thấy lịch sử phù hợp.
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <p className="text-sm font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
    </div>
  );
}
