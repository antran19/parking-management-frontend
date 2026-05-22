import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";

export default function StaffCheckIn({ onLogout }) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState("ĐANG CHỜ QUÉT...");
  const scannerRef = useRef(null);

  const [formData, setFormData] = useState({
    plateNumber: "",
    vehicleType: "car",
    gate: "Cổng A Lê Văn Lương",
    slot: "A-102",
    floor: "Hầm B1",
    ticketCode: "",
    checkInTime: "",
  });

  const parseQrData = (qrText) => {
    try {
      const data = JSON.parse(qrText);

      setFormData({
        plateNumber: data.plateNumber || "",
        vehicleType: data.vehicleType || "car",
        gate: data.gate || "Cổng A Lê Văn Lương",
        slot: data.slot || "A-102",
        floor: data.floor || "Hầm B1",
        ticketCode: data.ticketCode || `APX-${Date.now().toString().slice(-4)}`,
        checkInTime: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });

      setScanMessage("QUÉT QR THÀNH CÔNG");
    } catch {
      setFormData((prev) => ({
        ...prev,
        ticketCode: qrText,
        checkInTime: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));

      setScanMessage("ĐÃ NHẬN MÃ QR");
    }
  };

  const startScanner = async () => {
    try {
      setIsScanning(true);
      setScanMessage("ĐANG MỞ CAMERA...");

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          parseQrData(decodedText);

          if (scannerRef.current) {
            await scannerRef.current.stop();
            scannerRef.current.clear();
            scannerRef.current = null;
          }

          setIsScanning(false);
        },
        () => {}
      );

      setScanMessage("ĐƯA MÃ QR VÀO KHUNG QUÉT");
    } catch (error) {
      console.error(error);
      setScanMessage("KHÔNG MỞ ĐƯỢC CAMERA");
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      scannerRef.current.clear();
      scannerRef.current = null;
    }

    setIsScanning(false);
    setScanMessage("ĐÃ TẮT CAMERA");
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleCheckIn = () => {
    setIsSuccess(true);
  };

  const getVehicleLabel = (type) => {
    if (type === "car") return "Ô tô";
    if (type === "motorbike") return "Xe máy";
    if (type === "bicycle") return "Xe đạp";
    if (type === "ebike") return "Xe điện";
    return "Không xác định";
  };

  return (
    <div className="min-h-screen bg-[#faf9fc] text-slate-950">
      <aside className="fixed bottom-0 left-0 top-0 z-40 w-72 border-r border-slate-200 bg-white">
        <div className="flex items-center gap-3 border-b border-slate-200 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-xl font-bold text-white">
            P
          </div>

          <div>
            <h2 className="text-xl font-black">Smart Parking</h2>
            <p className="text-sm text-slate-500">Cổng nhân viên</p>
          </div>
        </div>

        <nav className="space-y-3 p-5">
          <Link to="/staff/dashboard" className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-500 hover:bg-slate-100">
            📊 Bảng điều khiển
          </Link>

          <Link to="/staff/map" className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-500 hover:bg-slate-100">
            🅿️ Sơ đồ bãi xe
          </Link>

          <Link to="/staff/check-in" className="flex items-center gap-3 rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white">
            🚗 Check-in xe vào
          </Link>

          <Link to="/staff/check-out" className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-500 hover:bg-slate-100">
            💳 Check-out thanh toán
          </Link>

          <Link to="/staff/history" className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-500 hover:bg-slate-100">
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

      <main className="min-h-screen pl-72">
        <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-10">
          <h1 className="text-3xl font-black">Check-in xe vào</h1>

          <div className="flex items-center gap-6">
            <span>🔔</span>
            <span>⚙️</span>

            <div>
              <p className="font-bold">Nguyễn Văn A</p>
              <p className="text-sm text-slate-500">Nhân viên bãi xe</p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 font-black text-purple-700">
              A
            </div>
          </div>
        </header>

        <section className="space-y-8 p-10">
          <div className="rounded-3xl bg-slate-950 p-8 text-white">
            <h2 className="text-3xl font-black">Check-in phương tiện</h2>
            <p className="mt-2 text-slate-300">
              Quét mã QR của driver để nhận diện thông tin xe.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-3">
              <div className="border-b-2 border-purple-600 px-4 py-4 text-center font-black text-slate-950">
                ❖ Quét mã QR của driver
              </div>

              <div className="p-6">
                <div className="relative overflow-hidden rounded-xl bg-slate-950 p-4">
                  <div id="qr-reader" className="min-h-56 w-full overflow-hidden rounded-xl bg-slate-900" />

                  {!isScanning && (
                    <div className="absolute inset-4 flex items-center justify-center rounded-xl bg-slate-950">
                      <div className="text-center text-white">
                        <div className="text-5xl">▣</div>
                        <p className="mt-3 font-black text-purple-300">
                          CAMERA QR SCANNER
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-8 border-2 border-purple-500">
                    <span className="absolute -left-1 -top-1 h-6 w-6 border-l-4 border-t-4 border-purple-500" />
                    <span className="absolute -right-1 -top-1 h-6 w-6 border-r-4 border-t-4 border-purple-500" />
                    <span className="absolute -bottom-1 -left-1 h-6 w-6 border-b-4 border-l-4 border-purple-500" />
                    <span className="absolute -bottom-1 -right-1 h-6 w-6 border-b-4 border-r-4 border-purple-500" />
                  </div>
                </div>

                <p className="mt-4 text-center text-sm font-bold text-purple-700">
                  🟣 {scanMessage}
                </p>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={startScanner}
                    disabled={isScanning}
                    className="flex-1 rounded-xl bg-purple-600 py-3 font-black text-white hover:bg-purple-700 disabled:bg-slate-400"
                  >
                    Mở camera quét QR
                  </button>

                  <button
                    onClick={stopScanner}
                    disabled={!isScanning}
                    className="flex-1 rounded-xl border border-slate-300 py-3 font-black text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    Tắt camera
                  </button>
                </div>

                <div className="mt-6 space-y-5">
                  <div>
                    <label className="mb-2 block font-bold">Biển số xe</label>
                    <input
                      value={formData.plateNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, plateNumber: e.target.value })
                      }
                      placeholder="VD: 30A-123.45"
                      className="w-full rounded-xl border border-slate-300 px-4 py-4 text-lg font-bold outline-none focus:ring-2 focus:ring-purple-200"
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block font-bold">Loại xe</label>
                      <select
                        value={formData.vehicleType}
                        onChange={(e) =>
                          setFormData({ ...formData, vehicleType: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 px-4 py-4 outline-none"
                      >
                        <option value="car">🚗 Ô tô Sedan/SUV</option>
                        <option value="motorbike">🏍️ Xe máy</option>
                        <option value="bicycle">🚲 Xe đạp</option>
                        <option value="ebike">⚡ Xe điện</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block font-bold">Cổng vào</label>
                      <select
                        value={formData.gate}
                        onChange={(e) =>
                          setFormData({ ...formData, gate: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 px-4 py-4 outline-none"
                      >
                        <option>Cổng A Lê Văn Lương</option>
                        <option>Cổng B Nguyễn Trãi</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block font-bold">Mã QR / thẻ xe</label>
                    <input
                      value={formData.ticketCode}
                      readOnly
                      placeholder="Mã QR sẽ tự điền sau khi quét"
                      className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-4 font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5 lg:col-span-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <h3 className="text-xl font-black">Vị trí đỗ</h3>
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                    {formData.floor}
                  </span>
                </div>

                <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
                  <p className="font-black text-green-900">
                    🎯 Gợi ý: Ô [{formData.slot}]
                  </p>
                  <p className="text-xs text-green-700">
                    Gần lối thang máy nhất
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold">Tầng</label>
                    <input
                      value={formData.floor}
                      readOnly
                      className="w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">Ô đỗ</label>
                    <input
                      value={`${formData.slot} (Đang chờ)`}
                      readOnly
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 font-bold"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCheckIn}
                  className="mt-6 w-full rounded-xl bg-slate-950 py-4 text-lg font-black text-white hover:bg-slate-800"
                >
                  ◎ ✔ Check-in
                </button>
              </div>

              {isSuccess && (
                <div className="rounded-2xl bg-green-600 p-6 text-white shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-2xl">
                      ✅
                    </div>

                    <div>
                      <h3 className="text-2xl font-black">
                        Check-in thành công!
                      </h3>

                      <p className="text-sm text-green-100">
                        Xe {formData.plateNumber || "chưa có biển số"} đã vào bãi lúc{" "}
                        {formData.checkInTime || "vừa xong"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4 rounded-xl bg-green-700/50 p-4">
                    <div>
                      <p className="text-xs text-green-100">Thẻ xe</p>
                      <p className="font-black">
                        #{formData.ticketCode || "APX-0000"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-green-100">Vị trí</p>
                      <p className="font-black">
                        {formData.slot} ({formData.floor})
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-green-100">Loại xe</p>
                      <p className="font-black">
                        {getVehicleLabel(formData.vehicleType)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-green-100">Cổng vào</p>
                      <p className="font-black">{formData.gate}</p>
                    </div>
                  </div>

                  <button className="mt-5 w-full rounded-xl bg-white py-3 font-black text-green-700 hover:bg-green-50">
                    🖨️ In vé
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}