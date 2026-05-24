import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DriverSidebar from "../../components/DriverSidebar";
import {
  confirmDriverPayment,
  getDriverPaymentInfo,
} from "../../api/driverPaymentApi";

export default function DriverPayment({ onLogout }) {
  const navigate = useNavigate();

  const [currentSession, setCurrentSession] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [bankInfo, setBankInfo] = useState(null);

  const [paymentMethod, setPaymentMethod] = useState("qr");
  const [isPaid, setIsPaid] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    const loadPaymentInfo = async () => {
      try {
        setLoading(true);
        setApiError("");

        const result = await getDriverPaymentInfo();

        setCurrentSession(result?.currentSession || null);
        setDriverInfo(result?.driver || null);
        setBankInfo(result?.bankInfo || null);
        setPaymentMethod(result?.defaultPaymentMethod || "qr");
        setIsPaid(Boolean(result?.isPaid));
      } catch (error) {
        console.error("Driver payment API error:", error);
        setApiError("Không thể tải dữ liệu thanh toán từ hệ thống.");
      } finally {
        setLoading(false);
      }
    };

    loadPaymentInfo();
  }, []);

  const totalFee = useMemo(() => {
    if (!currentSession) return 0;

    return (
      Number(currentSession.baseFee || 0) +
      Number(currentSession.extraFee || 0) +
      Number(currentSession.serviceFee || 0)
    );
  }, [currentSession]);

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

  const handleConfirmPayment = async () => {
    if (!currentSession) return;

    try {
      setSubmitting(true);
      setApiError("");

      const payload = {
        sessionCode: currentSession.sessionCode,
        paymentMethod,
        amount: totalFee,
      };

      const result = await confirmDriverPayment(payload);

      setIsPaid(Boolean(result?.isPaid ?? true));
    } catch (error) {
      console.error("Confirm driver payment API error:", error);
      setApiError("Không thể xác nhận thanh toán. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-800">
        <DriverSidebar active="payment" onLogout={handleLogout} />

        <div className="ml-64 flex-1">
          <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-white px-8">
            <div>
              <h2 className="text-2xl font-bold">Thanh toán</h2>
              <p className="text-sm text-slate-500">
                Kiểm tra phí gửi xe và thanh toán online
              </p>
            </div>
          </header>

          <main className="p-8">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              Đang tải dữ liệu thanh toán...
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (apiError && !currentSession) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-800">
        <DriverSidebar active="payment" onLogout={handleLogout} />

        <div className="ml-64 flex-1">
          <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-white px-8">
            <div>
              <h2 className="text-2xl font-bold">Thanh toán</h2>
              <p className="text-sm text-slate-500">
                Kiểm tra phí gửi xe và thanh toán online
              </p>
            </div>
          </header>

          <main className="p-8">
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
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

  if (!currentSession) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-800">
        <DriverSidebar active="payment" onLogout={handleLogout} />

        <div className="ml-64 flex-1">
          <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-white px-8">
            <div>
              <h2 className="text-2xl font-bold">Thanh toán</h2>
              <p className="text-sm text-slate-500">
                Kiểm tra phí gửi xe và thanh toán online
              </p>
            </div>
          </header>

          <main className="p-8">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              Không có phiên gửi xe cần thanh toán.
            </div>
          </main>
        </div>
      </div>
    );
  }

  const locationText = `${currentSession.floor || "--"} - ${
    currentSession.area || "--"
  }`;

  const checkInText = `${currentSession.checkInTime || "--"} - ${
    currentSession.checkInDate || "--"
  }`;

  const durationText = `${currentSession.durationHours || 0} giờ ${
    currentSession.durationMinutes || 0
  } phút`;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <DriverSidebar active="payment" onLogout={handleLogout} />

      <div className="ml-64 flex-1">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-white px-8">
          <div>
            <h2 className="text-2xl font-bold">Thanh toán</h2>
            <p className="text-sm text-slate-500">
              Kiểm tra phí gửi xe và thanh toán online
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold">
                {driverInfo?.name || "Tài xế"}
              </p>
              <p className="text-xs text-slate-500">
                {driverInfo?.membership || "Thành viên"}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-slate-100 font-bold text-slate-700">
              D
            </div>
          </div>
        </header>

        <main className="space-y-8 p-8">
          <section className="rounded-3xl bg-slate-900 p-8 text-white">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-300">
              Driver Payment
            </p>
            <h1 className="mt-2 text-3xl font-black">
              Thanh toán phiên gửi xe
            </h1>
            <p className="mt-2 max-w-3xl text-slate-300">
              Driver có thể kiểm tra thông tin phiên gửi xe, xem phí tạm tính và
              thanh toán bằng QR, ví điện tử hoặc tiền mặt tại quầy.
            </p>
          </section>

          {apiError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
              {apiError}
            </div>
          )}

          <section className="grid gap-6 xl:grid-cols-12">
            <div className="space-y-6 xl:col-span-7">
              <section className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-950">
                      Thông tin phiên gửi xe
                    </h3>
                    <p className="text-sm text-slate-500">
                      Kiểm tra lại thông tin trước khi thanh toán.
                    </p>
                  </div>

                  <span className="rounded-full bg-green-100 px-4 py-2 text-xs font-black uppercase text-green-700">
                    {currentSession.status || "Đang gửi xe"}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoBox
                    label="Mã phiên"
                    value={currentSession.sessionCode}
                  />
                  <InfoBox
                    label="Biển số"
                    value={currentSession.plateNumber}
                  />
                  <InfoBox
                    label="Loại xe"
                    value={currentSession.vehicleType}
                  />
                  <InfoBox label="Vị trí" value={locationText} />
                  <InfoBox label="Thời gian vào" value={checkInText} />
                  <InfoBox label="Thời lượng" value={durationText} />
                </div>
              </section>

              <section className="rounded-3xl border bg-white p-6 shadow-sm">
                <h3 className="text-xl font-black text-slate-950">
                  Chi tiết phí
                </h3>

                <div className="mt-6 space-y-4">
                  <FeeRow
                    label="Phí gửi xe cơ bản"
                    value={currentSession.baseFee}
                  />
                  <FeeRow
                    label="Phí phát sinh theo thời gian"
                    value={currentSession.extraFee}
                  />
                  <FeeRow
                    label="Phí dịch vụ"
                    value={currentSession.serviceFee}
                  />

                  <div className="border-t pt-5">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-sm font-bold uppercase text-slate-400">
                          Tổng cần thanh toán
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Đã bao gồm toàn bộ phí gửi xe hiện tại
                        </p>
                      </div>

                      <p className="text-4xl font-black text-blue-600">
                        {totalFee.toLocaleString("vi-VN")}đ
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
                    active={paymentMethod === "qr"}
                    icon="▦"
                    title="QR Banking"
                    desc="Quét mã chuyển khoản"
                    onClick={() => setPaymentMethod("qr")}
                  />

                  <PaymentMethodCard
                    active={paymentMethod === "momo"}
                    icon="🟣"
                    title="Momo"
                    desc="Thanh toán ví điện tử"
                    onClick={() => setPaymentMethod("momo")}
                  />

                  <PaymentMethodCard
                    active={paymentMethod === "cash"}
                    icon="💵"
                    title="Tiền mặt"
                    desc="Thanh toán tại quầy"
                    onClick={() => setPaymentMethod("cash")}
                  />
                </div>
              </section>
            </div>

            <div className="space-y-6 xl:col-span-5">
              <section className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="text-center">
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-400">
                    Thanh toán
                  </p>

                  <h3 className="mt-2 text-3xl font-black text-slate-950">
                    {totalFee.toLocaleString("vi-VN")}đ
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Mã phiên: {currentSession.sessionCode || "--"}
                  </p>
                </div>

                {paymentMethod === "qr" && (
                  <div className="mt-8">
                    <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-3xl border-8 border-white bg-slate-950 text-7xl text-white shadow-lg">
                      ▦
                    </div>

                    <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                      <PaymentInfo
                        label="Ngân hàng"
                        value={bankInfo?.bankName || "--"}
                      />
                      <PaymentInfo
                        label="Số tài khoản"
                        value={bankInfo?.accountNumber || "--"}
                      />
                      <PaymentInfo
                        label="Nội dung"
                        value={currentSession.sessionCode || "--"}
                      />
                    </div>

                    <p className="mt-4 text-center text-sm text-slate-500">
                      Quét mã QR và nhập đúng nội dung chuyển khoản.
                    </p>
                  </div>
                )}

                {paymentMethod === "momo" && (
                  <div className="mt-8 rounded-3xl bg-purple-50 p-6 text-center">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-purple-600 text-5xl text-white">
                      M
                    </div>

                    <h4 className="mt-5 text-xl font-black text-purple-900">
                      Thanh toán bằng Momo
                    </h4>

                    <p className="mt-2 text-sm text-purple-700">
                      Chọn xác nhận để gửi yêu cầu thanh toán qua ví điện tử.
                    </p>
                  </div>
                )}

                {paymentMethod === "cash" && (
                  <div className="mt-8 rounded-3xl bg-amber-50 p-6">
                    <h4 className="text-xl font-black text-amber-900">
                      Thanh toán tại quầy
                    </h4>

                    <p className="mt-2 text-sm leading-6 text-amber-700">
                      Driver vui lòng đến quầy hoặc cổng ra để thanh toán tiền
                      mặt. Staff sẽ xác nhận thanh toán và check-out xe khỏi bãi.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={submitting || isPaid}
                  className="mt-8 w-full rounded-2xl bg-slate-950 py-4 text-lg font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {submitting
                    ? "Đang xác nhận..."
                    : isPaid
                    ? "Đã thanh toán"
                    : "Xác nhận thanh toán"}
                </button>
              </section>

              <section className="rounded-3xl border bg-white p-6 shadow-sm">
                <h3 className="text-lg font-black text-slate-950">
                  Trạng thái thanh toán
                </h3>

                <div
                  className={`mt-5 rounded-2xl p-5 ${
                    isPaid
                      ? "bg-green-50 text-green-800"
                      : "bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
                        isPaid
                          ? "bg-green-600 text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isPaid ? "✓" : "!"}
                    </div>

                    <div>
                      <p className="font-black">
                        {isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                      </p>
                      <p className="text-sm">
                        {isPaid
                          ? "Thanh toán đã được ghi nhận thành công."
                          : "Vui lòng hoàn tất thanh toán trước khi rời bãi."}
                      </p>
                    </div>
                  </div>
                </div>

                {isPaid && (
                  <div className="mt-5 space-y-3">
                    <button
                      type="button"
                      onClick={() => navigate("/driver/history")}
                      className="w-full rounded-xl bg-green-600 py-3 font-black text-white hover:bg-green-700"
                    >
                      Xem lịch sử thanh toán
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/driver/dashboard")}
                      className="w-full rounded-xl border border-slate-300 py-3 font-black text-slate-600 hover:bg-slate-50"
                    >
                      Về bảng điều khiển
                    </button>
                  </div>
                )}
              </section>
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
      <p className="mt-2 font-black text-slate-950">{value || "--"}</p>
    </div>
  );
}

function FeeRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-5">
      <span className="font-semibold text-slate-600">{label}</span>
      <span className="font-black text-slate-950">
        {Number(value || 0).toLocaleString("vi-VN")}đ
      </span>
    </div>
  );
}

function PaymentMethodCard({ active, icon, title, desc, onClick }) {
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
      <div className="text-3xl">{icon}</div>
      <p className="mt-4 font-black">{title}</p>
      <p className="mt-1 text-sm opacity-80">{desc}</p>
    </button>
  );
}

function PaymentInfo({ label, value }) {
  return (
    <div className="flex justify-between border-b border-slate-200 py-3 last:border-b-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-black text-slate-950">{value}</span>
    </div>
  );
}