// src/pages/driver/DriverActivePass.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DriverSidebar from "../../components/DriverSidebar";
import QrDisplay from "../../components/QrDisplay";
import { formatCurrency, formatDateTime, getPasses } from "../../services/smartParkingStorage";

export default function DriverActivePass({ onLogout }) {
  const navigate = useNavigate();
  const [activePasses, setActivePasses] = useState([]);
  const [selectedPass, setSelectedPass] = useState(null);

  useEffect(() => {
    const passes = getPasses();
    setActivePasses(passes);
    setSelectedPass(passes[0] || null);
  }, []);

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
      <DriverSidebar active="active-pass" onLogout={handleLogout} />

      <div className="ml-64 flex-1">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-white px-8">
          <div>
            <h2 className="text-2xl font-bold">Vé đang active</h2>
            <p className="text-sm text-slate-500">
              ParkingPass còn hiệu lực và QR xác nhận cho Staff
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-slate-100 font-bold">
            Q
          </div>
        </header>

        <main className="space-y-8 p-8">
          <section className="rounded-3xl bg-slate-900 p-8 text-white">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-300">
              Active ParkingPass
            </p>
            <h1 className="mt-2 text-3xl font-black">
              Xem vé active và QR để Staff nhận diện khách có vé
            </h1>
            <p className="mt-2 max-w-3xl text-slate-300">
              Khi Staff quét QR này, hệ thống biết driverType = SUBSCRIBER và
              không cần gộp chung với vãng lai hoặc đặt trước.
            </p>
          </section>

          {activePasses.length === 0 ? (
            <section className="rounded-3xl border bg-white p-8 text-center shadow-sm">
              <h3 className="text-2xl font-black text-slate-950">
                Chưa có vé active
              </h3>
              <p className="mt-2 text-slate-500">
                Vào trang “Mua vé gửi xe” để tạo QR thanh toán và active vé.
              </p>
              <button
                type="button"
                onClick={() => navigate("/driver/pass")}
                className="mt-6 rounded-2xl bg-slate-950 px-6 py-3 font-black text-white hover:bg-slate-800"
              >
                Mua vé ngay
              </button>
            </section>
          ) : (
            <section className="grid gap-6 xl:grid-cols-12">
              <div className="space-y-4 xl:col-span-7">
                {activePasses.map((pass) => (
                  <button
                    key={pass.passCode}
                    type="button"
                    onClick={() => setSelectedPass(pass)}
                    className={`w-full rounded-3xl border p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md ${
                      selectedPass?.passCode === pass.passCode
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-800"
                    }`}
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                      <div>
                        <p className="text-sm font-bold uppercase opacity-70">Mã vé</p>
                        <h3 className="mt-1 text-2xl font-black">{pass.passCode}</h3>
                      </div>
                      <span className="rounded-full bg-green-500 px-4 py-2 text-xs font-black text-white">
                        {pass.status}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      <PassMini label="Biển số" value={pass.licensePlate} />
                      <PassMini label="Gói vé" value={pass.passLabel} />
                      <PassMini label="Hết hạn" value={formatDateTime(pass.endDate)} />
                    </div>
                  </button>
                ))}
              </div>

              <div className="xl:col-span-5">
                {selectedPass && (
                  <QrDisplay
                    title="QR ParkingPass active"
                    description="Đưa QR này cho Staff quét để xác nhận vé còn hiệu lực."
                    value={selectedPass.qrPayload}
                    code={selectedPass.passCode}
                  >
                    <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-5">
                      <Info label="Biển số" value={selectedPass.licensePlate} />
                      <Info label="Loại xe" value={selectedPass.vehicleLabel} />
                      <Info label="Gói vé" value={selectedPass.passLabel} />
                      <Info label="Giá vé" value={formatCurrency(selectedPass.price)} />
                      <Info label="Bắt đầu" value={formatDateTime(selectedPass.startDate)} />
                      <Info label="Hết hạn" value={formatDateTime(selectedPass.endDate)} />
                    </div>
                  </QrDisplay>
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function PassMini({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <p className="text-xs font-bold uppercase opacity-70">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-200 py-2 last:border-b-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-black text-slate-950">{value}</span>
    </div>
  );
}
