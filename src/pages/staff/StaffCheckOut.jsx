import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function StaffCheckOut({ onLogout }) {
  const [lookupMode, setLookupMode] = useState("qr");
  const [paymentMethod, setPaymentMethod] =
    useState("qr");

  const [showSuccess, setShowSuccess] =
    useState(false);

  const [timer, setTimer] = useState(
    4 * 3600 + 45 * 60 + 12
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTimer = (seconds) => {
    const h = Math.floor(seconds / 3600);

    const m = Math.floor(
      (seconds % 3600) / 60
    );

    const s = seconds % 60;

    return `${String(h).padStart(
      2,
      "0"
    )}:${String(m).padStart(
      2,
      "0"
    )}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#faf9fc] text-slate-950">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 z-40 w-72 border-r border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-200 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-xl font-bold text-white">
            P
          </div>

          <div>
            <h2 className="text-xl font-black">
              Smart Parking
            </h2>

            <p className="text-sm text-slate-500">
              Cổng nhân viên
            </p>
          </div>
        </div>

        <nav className="space-y-3 p-5">
          <Link
            to="/staff/dashboard"
            className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-500 hover:bg-slate-100"
          >
            📊 Bảng điều khiển
          </Link>

          <Link
            to="/staff/map"
            className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-500 hover:bg-slate-100"
          >
            🅿️ Sơ đồ bãi xe
          </Link>

          <Link
            to="/staff/check-in"
            className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-500 hover:bg-slate-100"
          >
            🚗 Check-in xe vào
          </Link>

          <Link
            to="/staff/check-out"
            className="flex items-center gap-3 rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white"
          >
            💳 Check-out thanh toán
          </Link>

          <Link
            to="/staff/history"
            className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-500 hover:bg-slate-100"
          >
            📋 Lịch sử phiên gửi
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-5">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold text-red-600 hover:bg-red-50"
          >
            ⏻ Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="min-h-screen pl-72">
        {/* Header */}
        <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-10">
          <h1 className="text-3xl font-black">
            Check-out xe ra
          </h1>

          <div className="flex items-center gap-6">
            <span>🔔</span>

            <span>⚙️</span>

            <div>
              <p className="font-bold">
                Nguyễn Văn A
              </p>

              <p className="text-sm text-slate-500">
                Nhân viên bãi xe
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 font-black text-purple-700">
              A
            </div>
          </div>
        </header>

        {/* Content */}
        <section className="space-y-8 p-10">
          {/* Hero */}
          <div className="rounded-3xl bg-slate-950 p-8 text-white">
            <h2 className="text-3xl font-black">
              Thanh toán & Check-out
            </h2>

            <p className="mt-2 text-slate-300">
              Quét mã vé hoặc tìm biển số để
              tính phí và xác nhận xe ra.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left */}
            <div className="space-y-6 lg:col-span-4">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Tabs */}
                <div className="grid grid-cols-2 border-b border-slate-200">
                  <button
                    onClick={() =>
                      setLookupMode("qr")
                    }
                    className={`px-4 py-4 font-black ${lookupMode === "qr"
                        ? "border-b-2 border-purple-600 bg-slate-50 text-slate-950"
                        : "text-slate-500"
                      }`}
                  >
                    ▦ Quét mã QR
                  </button>

                  <button
                    onClick={() =>
                      setLookupMode("plate")
                    }
                    className={`px-4 py-4 font-black ${lookupMode === "plate"
                        ? "border-b-2 border-purple-600 bg-slate-50 text-slate-950"
                        : "text-slate-500"
                      }`}
                  >
                    🔎 Tìm biển số
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  {lookupMode === "qr" ? (
                    <div className="space-y-4">
                      <div className="relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
                        <div className="absolute left-0 right-0 top-8 h-1 animate-bounce bg-purple-600 shadow-[0_0_15px_#7c3aed]" />

                        <div className="text-center">
                          <div className="text-6xl">
                            📷
                          </div>

                          <p className="mt-3 px-6 font-semibold text-slate-500">
                            Đưa vé vào vùng quét
                            camera
                          </p>
                        </div>
                      </div>

                      <button className="w-full rounded-xl bg-slate-950 py-4 font-black text-white hover:bg-slate-800">
                        ▦ Bắt đầu quét
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block font-bold text-slate-500">
                          Nhập biển số xe
                        </label>

                        <input
                          placeholder="30A-123.45"
                          className="w-full rounded-xl border border-slate-300 px-4 py-4 text-center text-xl font-black tracking-widest outline-none focus:ring-2 focus:ring-purple-200"
                        />
                      </div>

                      <button className="w-full rounded-xl bg-slate-950 py-4 font-black text-white hover:bg-slate-800">
                        Tra cứu thông tin
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="rounded-2xl bg-purple-600 p-6 text-white shadow-sm">
                <p className="text-sm font-bold uppercase tracking-widest text-purple-100">
                  Check-out hôm nay
                </p>

                <div className="mt-2 flex items-end justify-between">
                  <span className="text-4xl font-black">
                    128
                  </span>

                  <span className="rounded-lg bg-white/20 px-3 py-1 text-sm font-bold">
                    +12% vs qua
                  </span>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="space-y-6 lg:col-span-8">
              <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-8 xl:flex-row">
                  {/* Info */}
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                      <h2 className="text-2xl font-black">
                        Thông tin xe ra
                      </h2>

                      <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-700">
                        Sắp quá giờ
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                      <InfoBlock
                        label="Biển số"
                        value="30A-888.68"
                      />

                      <InfoBlock
                        label="Mã vé"
                        value="TK-2901-X"
                      />

                      <InfoBlock
                        label="Thời gian vào"
                        value="10:15:30 • 24/10/2023"
                      />

                      <InfoBlock
                        label="Cổng vào"
                        value="Cổng số 02 (Bắc)"
                      />
                    </div>

                    {/* Camera */}
                    <div className="h-44 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950">
                      <div className="flex h-full items-center justify-center bg-[url('/src/assets/parking-bg.jpg')] bg-cover bg-center text-white">
                        <div className="rounded-xl bg-black/50 px-5 py-3 font-black">
                          CCTV xe vào
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fee */}
                  <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-6 xl:w-80">
                    <div className="mb-5 flex items-center justify-between">
                      <span className="font-bold text-slate-500">
                        Thời gian đỗ
                      </span>

                      <span className="font-black text-purple-700">
                        ⏱ {formatTimer(timer)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <FeeRow
                        label="Phí cơ bản (2h đầu)"
                        value="40.000đ"
                      />

                      <FeeRow
                        label="Phí cộng thêm (3h)"
                        value="45.000đ"
                      />

                      <FeeRow
                        label="Phụ phí giờ cao điểm"
                        value="5.000đ"
                      />

                      <div className="mt-4 flex items-end justify-between border-t border-slate-200 pt-4">
                        <span className="font-black">
                          TỔNG CỘNG
                        </span>

                        <span className="text-3xl font-black text-purple-700">
                          90.000đ
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div className="mt-8 space-y-6 border-t border-slate-200 pt-8">
                  <h3 className="font-black uppercase tracking-widest text-slate-500">
                    Phương thức thanh toán
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() =>
                        setPaymentMethod("qr")
                      }
                      className={`rounded-2xl border-2 p-6 font-black ${paymentMethod === "qr"
                          ? "border-purple-600 bg-purple-100 text-purple-900"
                          : "border-slate-200 bg-white text-slate-600"
                        }`}
                    >
                      <div className="text-3xl">
                        ▦
                      </div>

                      QR / Chuyển khoản
                    </button>

                    <button
                      onClick={() =>
                        setPaymentMethod("cash")
                      }
                      className={`rounded-2xl border-2 p-6 font-black ${paymentMethod === "cash"
                          ? "border-purple-600 bg-purple-100 text-purple-900"
                          : "border-slate-200 bg-white text-slate-600"
                        }`}
                    >
                      <div className="text-3xl">
                        💵
                      </div>

                      Tiền mặt
                    </button>
                  </div>

                  {/* QR */}
                  {paymentMethod === "qr" ? (
                    <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 shadow-inner">
                      <div className="flex h-48 w-48 items-center justify-center rounded-xl border-4 border-white bg-slate-950 text-6xl text-white shadow-sm">
                        ▦
                      </div>

                      <p className="mt-4 text-slate-500">
                        Quét mã để thanh toán{" "}
                        <span className="font-black text-slate-950">
                          90.000đ
                        </span>
                      </p>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                      <input
                        type="checkbox"
                        className="h-6 w-6 rounded border-slate-300 text-purple-600"
                      />

                      <span className="font-bold">
                        Tôi đã nhận đủ 90.000đ từ
                        khách hàng
                      </span>
                    </label>
                  )}

                  <button
                    onClick={() =>
                      setShowSuccess(true)
                    }
                    className="flex h-16 w-full items-center justify-center gap-3 rounded-2xl bg-slate-950 text-xl font-black text-white shadow-lg hover:bg-slate-800"
                  >
                    ✅ Xác nhận Check-out
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* History */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <h3 className="text-2xl font-black">
                Lịch sử check-out hôm nay
              </h3>

              <button className="font-bold text-purple-700 hover:underline">
                🕘 Xem tất cả
              </button>
            </div>

            <table className="w-full text-left">
              <thead className="bg-slate-50 text-sm text-slate-500">
                <tr>
                  <th className="p-4">Thời gian ra</th>
                  <th className="p-4">Biển số</th>
                  <th className="p-4">Loại xe</th>
                  <th className="p-4">Tổng tiền</th>
                  <th className="p-4">PTTT</th>
                  <th className="p-4 text-right">Hành động</th>
                </tr>
              </thead>

              <tbody>
                {[
                  ["14:20:05", "30G-445.12", "Ô tô 4 chỗ", "45.000đ", "Chuyển khoản"],
                  ["14:15:22", "29D-889.34", "Ô tô SUV", "120.000đ", "Tiền mặt"],
                  ["14:02:10", "59A1-223.45", "Xe máy", "12.000đ", "Tiền mặt"],
                ].map((row) => (
                  <tr
                    key={row[1]}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="p-4">{row[0]}</td>
                    <td className="p-4 font-black">{row[1]}</td>
                    <td className="p-4 text-slate-500">{row[2]}</td>
                    <td className="p-4 font-bold">{row[3]}</td>
                    <td className="p-4">
                      <span className="rounded bg-purple-100 px-2 py-1 text-xs font-black uppercase text-purple-700">
                        {row[4]}
                      </span>
                    </td>
                    <td className="p-4 text-right">🖨️</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-5xl">
              ✅
            </div>

            <h2 className="text-2xl font-black">
              Check-out thành công!
            </h2>

            <p className="mt-2 text-slate-500">
              Xe 30A-888.68 đã thanh toán đầy
              đủ 90.000đ.
            </p>

            <div className="my-8 rounded-2xl border-2 border-dashed border-green-200 bg-green-50 p-6 text-left">
              <div className="mb-4 flex justify-between">
                <span className="text-sm font-black uppercase text-green-700">
                  Biên lai điện tử
                </span>

                <span className="text-sm text-slate-500">
                  #99283-A
                </span>
              </div>

              <p className="flex justify-between">
                <span>Phí:</span>

                <span className="font-black">
                  90.000đ
                </span>
              </p>

              <p className="flex justify-between">
                <span>PTTT:</span>

                <span className="font-black">
                  {paymentMethod === "qr"
                    ? "QR Payment"
                    : "Tiền mặt"}
                </span>
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() =>
                  setShowSuccess(false)
                }
                className="flex-1 rounded-xl border border-slate-300 py-3 font-black hover:bg-slate-50"
              >
                Đóng
              </button>

              <button className="flex-1 rounded-xl bg-purple-600 py-3 font-black text-white hover:bg-purple-700">
                🖨️ In biên lai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div>
      <p className="text-xs font-black uppercase text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function FeeRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">
        {label}
      </span>

      <span className="font-bold">
        {value}
      </span>
    </div>
  );
}