// src/pages/driver/DriverPayment.jsx

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DriverSidebar from "../../components/DriverSidebar";
import QrDisplay from "../../components/QrDisplay";
import {
  confirmCheckoutPayment,
  createCheckoutPayment,
  formatCurrency,
  formatDateTime,
  getActiveSession,
} from "../../services/smartParkingStorage";

export default function DriverPayment({ onLogout }) {
  const navigate = useNavigate();
  const [session] = useState(() => getActiveSession());
  const [paymentMethod, setPaymentMethod] = useState("QR_BANKING");
  const [payment, setPayment] = useState(null);
  const [paidPayment, setPaidPayment] = useState(null);

  const totalFee = useMemo(
    () => session.baseFee + session.extraFee + session.serviceFee,
    [session]
  );

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    if (onLogout) onLogout();
    navigate("/login", { replace: true });
  };

  const handleCreatePayment = () => {
    const result = createCheckoutPayment({ session, paymentMethod });
    setPayment(result);
    setPaidPayment(null);
  };

  const handleConfirmPayment = () => {
    if (!payment) return;
    const result = confirmCheckoutPayment(payment.paymentCode);
    setPaidPayment(result);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <DriverSidebar active="payment" onLogout={handleLogout} />

      <div className="ml-64 flex-1">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-white px-8">
          <div>
            <h2 className="text-2xl font-bold">Thanh toán / Rời bãi</h2>
            <p className="text-sm text-slate-500">
              Thanh toán xong sẽ có QR để Staff xác nhận xe rời bãi
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-slate-100 font-bold">
            Q
          </div>
        </header>

        <main className="space-y-8 p-8">
          <section className="rounded-3xl bg-slate-900 p-8 text-white">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-300">
              Checkout QR
            </p>
            <h1 className="mt-2 text-3xl font-black">
              Thanh toán phí gửi xe và lấy QR xác nhận rời bãi
            </h1>
            <p className="mt-2 max-w-3xl text-slate-300">
              Driver tạo QR thanh toán. Sau khi thanh toán thành công, hệ thống
              sinh QR EXIT_CONFIRM để Staff kiểm tra tại cổng ra.
            </p>
          </section>

          <section className="grid gap-6 xl:grid-cols-12">
            <div className="space-y-6 xl:col-span-7">
              <section className="rounded-3xl border bg-white p-6 shadow-sm">
                <h3 className="text-xl font-black text-slate-950">
                  Phiên gửi xe hiện tại
                </h3>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <InfoBox label="Mã phiên" value={session.sessionCode} />
                  <InfoBox label="Biển số" value={session.licensePlate} />
                  <InfoBox label="Loại xe" value={session.vehicleLabel} />
                  <InfoBox label="Tầng / khu" value={`${session.floorLabel} - Khu ${session.areaId}`} />
                  <InfoBox label="Cổng vào" value={session.gateIn} />
                  <InfoBox label="Thời gian vào" value={formatDateTime(session.checkInAt)} />
                </div>
              </section>

              <section className="rounded-3xl border bg-white p-6 shadow-sm">
                <h3 className="text-xl font-black text-slate-950">Chi tiết phí</h3>

                <div className="mt-6 space-y-4">
                  <FeeRow label="Phí gửi xe cơ bản" value={session.baseFee} />
                  <FeeRow label="Phí phát sinh" value={session.extraFee} />
                  <FeeRow label="Phí dịch vụ" value={session.serviceFee} />

                  <div className="border-t pt-5">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-sm font-bold uppercase text-slate-400">
                          Tổng cần thanh toán
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Số tiền demo, sau này gọi PricingService backend
                        </p>
                      </div>
                      <p className="text-4xl font-black text-blue-600">
                        {formatCurrency(totalFee)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border bg-white p-6 shadow-sm">
                <h3 className="text-xl font-black text-slate-950">
                  Phương thức thanh toán
                </h3>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <PaymentMethodCard
                    active={paymentMethod === "QR_BANKING"}
                    title="QR Banking"
                    desc="Quét mã chuyển khoản"
                    onClick={() => setPaymentMethod("QR_BANKING")}
                  />
                  <PaymentMethodCard
                    active={paymentMethod === "CASH"}
                    title="Tiền mặt"
                    desc="Staff xác nhận tại cổng"
                    onClick={() => setPaymentMethod("CASH")}
                  />
                  <PaymentMethodCard
                    active={paymentMethod === "BANK_TRANSFER"}
                    title="Chuyển khoản"
                    desc="Nhập mã phiên"
                    onClick={() => setPaymentMethod("BANK_TRANSFER")}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCreatePayment}
                  className="mt-6 w-full rounded-2xl bg-slate-950 py-4 text-lg font-black text-white hover:bg-slate-800"
                >
                  Tạo QR thanh toán
                </button>
              </section>
            </div>

            <div className="space-y-6 xl:col-span-5">
              {payment && !paidPayment && (
                <QrDisplay
                  title="QR thanh toán check-out"
                  description="Driver thanh toán bằng QR này. Demo: bấm xác nhận để tạo QR rời bãi."
                  value={payment.qrPayload}
                  code={payment.paymentCode}
                >
                  <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-5">
                    <Info label="Mã phiên" value={payment.sessionCode} />
                    <Info label="Biển số" value={payment.licensePlate} />
                    <Info label="Số tiền" value={formatCurrency(payment.amount)} />
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

              {paidPayment && (
                <QrDisplay
                  title="QR xác nhận rời bãi"
                  description="Đưa QR này cho Staff ở cổng ra để xác nhận xe đã thanh toán."
                  value={paidPayment.exitQrPayload}
                  code={paidPayment.exitCode}
                >
                  <div className="mt-6 space-y-3 rounded-2xl bg-green-50 p-5 text-green-900">
                    <Info label="Mã thanh toán" value={paidPayment.paymentCode} />
                    <Info label="Biển số" value={paidPayment.licensePlate} />
                    <Info label="Số tiền" value={formatCurrency(paidPayment.amount)} />
                    <Info label="Trạng thái" value="Đã thanh toán" />
                  </div>
                </QrDisplay>
              )}

              {!payment && !paidPayment && (
                <section className="rounded-3xl border bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-black text-slate-950">
                    QR thanh toán sẽ hiện ở đây
                  </h3>
                  <p className="mt-3 text-slate-500">
                    Bấm tạo QR thanh toán. Sau khi trả phí thành công, hệ thống
                    sẽ sinh QR xác nhận rời bãi cho Staff.
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

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-2 font-black text-slate-950">{value}</p>
    </div>
  );
}

function FeeRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-5">
      <span className="font-semibold text-slate-600">{label}</span>
      <span className="font-black text-slate-950">{formatCurrency(value)}</span>
    </div>
  );
}

function PaymentMethodCard({ active, title, desc, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border-2 p-5 text-left transition hover:-translate-y-1 hover:shadow-md ${
        active
          ? "border-blue-600 bg-blue-50 text-blue-900"
          : "border-slate-200 bg-white text-slate-700"
      }`}
    >
      <p className="font-black">{title}</p>
      <p className="mt-1 text-sm opacity-80">{desc}</p>
    </button>
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
