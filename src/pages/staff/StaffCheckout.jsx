// src/pages/staff/StaffCheckout.jsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatCurrency, lookupQr } from "../../services/smartParkingStorage";

export default function StaffCheckout({ onLogout }) {
  const navigate = useNavigate();
  const [qrText, setQrText] = useState("");
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    if (onLogout) onLogout();
    navigate("/login", { replace: true });
  };

  const handleScan = () => {
    setMessage("");

    if (!qrText.trim()) {
      setMessage("Vui lòng dán QR thanh toán hoặc QR rời bãi.");
      return;
    }

    const lookup = lookupQr(qrText);
    setResult(lookup);

    if (!lookup.found) {
      setMessage("Không tìm thấy dữ liệu QR.");
    }
  };

  const isValidCheckoutQr =
    result?.found && ["CHECKOUT_PAYMENT", "EXIT_CONFIRM"].includes(result.type);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b bg-white px-8">
        <div>
          <h1 className="text-2xl font-black">Staff Check-out</h1>
          <p className="text-sm text-slate-500">
            Quét QR thanh toán hoặc QR xác nhận rời bãi
          </p>
        </div>

        <nav className="flex items-center gap-3">
          <Link to="/staff/check-in" className="rounded-xl px-4 py-2 font-bold text-slate-600 hover:bg-slate-100">
            Check-in
          </Link>
          <Link to="/staff/map" className="rounded-xl px-4 py-2 font-bold text-slate-600 hover:bg-slate-100">
            Mapping
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl bg-red-50 px-4 py-2 font-bold text-red-600 hover:bg-red-100"
          >
            Đăng xuất
          </button>
        </nav>
      </header>

      <main className="space-y-8 p-8">
        <section className="rounded-3xl bg-slate-950 p-8 text-white">
          <p className="text-sm font-bold uppercase tracking-widest text-blue-300">
            Exit QR Confirmation
          </p>
          <h2 className="mt-2 text-3xl font-black">
            Staff xác nhận xe đã thanh toán trước khi rời bãi
          </h2>
          <p className="mt-2 max-w-3xl text-slate-300">
            QR từ Driver Payment sẽ chứa mã thanh toán, biển số, số tiền và trạng
            thái thanh toán để Staff đối chiếu tại cổng ra.
          </p>
        </section>

        <section className="grid gap-6 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <section className="rounded-3xl border bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black">Nhập QR check-out</h3>
              <textarea
                value={qrText}
                onChange={(event) => setQrText(event.target.value)}
                rows={8}
                placeholder="Dán QR payload hoặc nhập mã OUT-PAY-/EXIT-..."
                className="mt-5 w-full rounded-2xl border px-4 py-3 font-mono text-sm outline-none focus:border-slate-950"
              />

              <button
                type="button"
                onClick={handleScan}
                className="mt-5 w-full rounded-2xl bg-slate-950 py-4 font-black text-white hover:bg-slate-800"
              >
                Quét / đọc mã QR
              </button>
            </section>

            {message && (
              <div className="mt-6 rounded-2xl bg-blue-50 p-5 font-bold text-blue-800">
                {message}
              </div>
            )}
          </div>

          <div className="xl:col-span-5">
            <section className="rounded-3xl border bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black">Kết quả xác nhận</h3>

              {!result?.found && (
                <p className="mt-3 text-slate-500">
                  Chưa có dữ liệu. Hãy quét QR thanh toán hoặc QR rời bãi từ Driver.
                </p>
              )}

              {result?.found && !isValidCheckoutQr && (
                <div className="mt-5 rounded-2xl bg-red-50 p-5 text-red-700">
                  QR này không dùng cho check-out. Loại QR: {result.type}
                </div>
              )}

              {isValidCheckoutQr && (
                <div className="mt-5 space-y-4">
                  <Info label="Loại QR" value={result.type} />
                  <Info label="Mã thanh toán" value={result.data.paymentCode} />
                  <Info label="Mã phiên" value={result.data.sessionCode} />
                  <Info label="Biển số" value={result.data.licensePlate} />
                  <Info label="Số tiền" value={formatCurrency(result.data.amount)} />
                  <Info label="Trạng thái" value={result.data.status || "PAID"} />

                  <button
                    type="button"
                    className="w-full rounded-2xl bg-green-600 py-4 font-black text-white hover:bg-green-700"
                    onClick={() => setMessage("Đã xác nhận cho xe rời bãi.")}
                  >
                    Xác nhận cho xe rời bãi
                  </button>
                </div>
              )}
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className="text-right font-black text-slate-950">{value || "-"}</span>
    </div>
  );
}
