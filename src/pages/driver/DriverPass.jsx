// src/pages/driver/DriverPass.jsx

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DriverSidebar from "../../components/DriverSidebar";
import QrDisplay from "../../components/QrDisplay";
import { calculatePassPrice, passPlans, vehicleOptions } from "../../data/parkingData";
import {
  activatePassFromPayment,
  createPassPayment,
  formatCurrency,
  formatDateTime,
} from "../../services/smartParkingStorage";

export default function DriverPass({ onLogout }) {
  const navigate = useNavigate();
  const [licensePlate, setLicensePlate] = useState("59X2-456.78");
  const [vehicleType, setVehicleType] = useState("MOTORBIKE");
  const [passType, setPassType] = useState("MONTHLY");
  const [paymentMethod, setPaymentMethod] = useState("QR_BANKING");
  const [paymentResult, setPaymentResult] = useState(null);
  const [activePass, setActivePass] = useState(null);
  const [error, setError] = useState("");

  const passPrice = useMemo(
    () => calculatePassPrice(vehicleType, passType),
    [vehicleType, passType]
  );

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    if (onLogout) onLogout();
    navigate("/login", { replace: true });
  };

  const handleCreatePayment = (event) => {
    event.preventDefault();
    setError("");
    setActivePass(null);

    if (!licensePlate.trim()) {
      setError("Vui lòng nhập biển số xe.");
      return;
    }

    const payment = createPassPayment({
      licensePlate,
      vehicleType,
      passType,
      paymentMethod,
    });

    setPaymentResult(payment);
  };

  const handleConfirmPayment = () => {
    if (!paymentResult) return;
    const pass = activatePassFromPayment(paymentResult.paymentCode);
    setActivePass(pass);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <DriverSidebar active="pass" onLogout={handleLogout} />

      <div className="ml-64 flex-1">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-white px-8">
          <div>
            <h2 className="text-2xl font-bold">Mua vé gửi xe</h2>
            <p className="text-sm text-slate-500">
              Vé tháng/quý/năm có QR để Staff nhận diện khách SUBSCRIBER
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-slate-100 font-bold">
            Q
          </div>
        </header>

        <main className="space-y-8 p-8">
          <section className="rounded-3xl bg-slate-900 p-8 text-white">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-300">
              ParkingPass QR
            </p>
            <h1 className="mt-2 text-3xl font-black">
              Thanh toán vé gửi xe và sinh QR vé active
            </h1>
            <p className="mt-2 max-w-3xl text-slate-300">
              Driver mua vé tháng/quý/năm. Sau khi xác nhận thanh toán, hệ thống
              sinh QR ParkingPass để Staff quét khi xe vào bãi.
            </p>
          </section>

          <section className="grid gap-6 xl:grid-cols-12">
            <form onSubmit={handleCreatePayment} className="space-y-6 xl:col-span-7">
              <section className="rounded-3xl border bg-white p-6 shadow-sm">
                <h3 className="text-xl font-black text-slate-950">
                  Thông tin mua vé
                </h3>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <Field label="Biển số xe">
                    <input
                      value={licensePlate}
                      onChange={(event) => setLicensePlate(event.target.value)}
                      className="w-full rounded-2xl border px-4 py-3 font-semibold outline-none focus:border-slate-900"
                    />
                  </Field>

                  <Field label="Loại xe">
                    <select
                      value={vehicleType}
                      onChange={(event) => setVehicleType(event.target.value)}
                      className="w-full rounded-2xl border px-4 py-3 font-semibold outline-none focus:border-slate-900"
                    >
                      {vehicleOptions.map((vehicle) => (
                        <option key={vehicle.value} value={vehicle.value}>
                          {vehicle.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Gói vé">
                    <select
                      value={passType}
                      onChange={(event) => setPassType(event.target.value)}
                      className="w-full rounded-2xl border px-4 py-3 font-semibold outline-none focus:border-slate-900"
                    >
                      {passPlans.map((plan) => (
                        <option key={plan.value} value={plan.value}>
                          {plan.label} - {plan.durationLabel}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Phương thức thanh toán">
                    <select
                      value={paymentMethod}
                      onChange={(event) => setPaymentMethod(event.target.value)}
                      className="w-full rounded-2xl border px-4 py-3 font-semibold outline-none focus:border-slate-900"
                    >
                      <option value="QR_BANKING">QR Banking</option>
                      <option value="CASH">Tiền mặt tại quầy</option>
                      <option value="BANK_TRANSFER">Chuyển khoản</option>
                    </select>
                  </Field>
                </div>

                {error && (
                  <div className="mt-5 rounded-2xl bg-red-50 p-4 font-bold text-red-700">
                    {error}
                  </div>
                )}

                <div className="mt-6 rounded-3xl bg-slate-50 p-6">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold uppercase text-slate-400">
                        Số tiền cần thanh toán
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Giá demo FE, sau này đổi sang API Payment backend
                      </p>
                    </div>
                    <p className="text-4xl font-black text-blue-600">
                      {formatCurrency(passPrice)}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className="mt-6 w-full rounded-2xl bg-slate-950 py-4 text-lg font-black text-white hover:bg-slate-800"
                >
                  Tạo QR thanh toán vé
                </button>
              </section>
            </form>

            <div className="space-y-6 xl:col-span-5">
              {paymentResult && !activePass && (
                <QrDisplay
                  title="QR thanh toán vé"
                  description="Driver quét QR để thanh toán. Demo: bấm xác nhận để sinh vé active."
                  value={paymentResult.qrPayload}
                  code={paymentResult.paymentCode}
                >
                  <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-5">
                    <Info label="Biển số" value={paymentResult.licensePlate} />
                    <Info label="Loại xe" value={paymentResult.vehicleLabel} />
                    <Info label="Gói vé" value={paymentResult.passLabel} />
                    <Info label="Số tiền" value={formatCurrency(paymentResult.amount)} />
                    <Info label="Trạng thái" value="Chờ thanh toán" />
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    className="mt-6 w-full rounded-2xl bg-green-600 py-4 font-black text-white hover:bg-green-700"
                  >
                    Demo xác nhận đã thanh toán
                  </button>
                </QrDisplay>
              )}

              {activePass && (
                <QrDisplay
                  title="QR vé đang active"
                  description="Dùng QR này để Staff xác nhận khách có vé tháng/quý/năm."
                  value={activePass.qrPayload}
                  code={activePass.passCode}
                >
                  <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-5">
                    <Info label="Biển số" value={activePass.licensePlate} />
                    <Info label="Loại xe" value={activePass.vehicleLabel} />
                    <Info label="Gói vé" value={activePass.passLabel} />
                    <Info label="Hết hạn" value={formatDateTime(activePass.endDate)} />
                    <Info label="Trạng thái" value={activePass.status} />
                  </div>
                </QrDisplay>
              )}

              {!paymentResult && !activePass && (
                <section className="rounded-3xl border bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-black text-slate-950">
                    QR thanh toán sẽ hiện ở đây
                  </h3>
                  <p className="mt-3 text-slate-500">
                    Chọn gói vé rồi bấm tạo QR thanh toán. Sau khi xác nhận,
                    hệ thống sẽ sinh QR ParkingPass active.
                  </p>
                </section>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-600">{label}</span>
      {children}
    </label>
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
