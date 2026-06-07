// src/pages/staff/StaffCheckin.jsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import QrDisplay from "../../components/QrDisplay";
import { mapAreas, vehicleOptions } from "../../data/parkingData";
import {
  confirmReservationCheckIn,
  createManualCheckIn,
  formatDateTime,
  lookupQr,
} from "../../services/smartParkingStorage";

export default function StaffCheckin({ onLogout }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("QR");
  const [qrText, setQrText] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [confirmedSession, setConfirmedSession] = useState(null);
  const [message, setMessage] = useState("");

  const [licensePlate, setLicensePlate] = useState("59X2-456.78");
  const [vehicleType, setVehicleType] = useState("MOTORBIKE");
  const [areaId, setAreaId] = useState("A");

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
    setConfirmedSession(null);

    if (!qrText.trim()) {
      setMessage("Vui lòng dán mã QR hoặc nhập mã test.");
      return;
    }

    const result = lookupQr(qrText);
    setScanResult(result);

    if (!result.found) {
      setMessage("Không tìm thấy dữ liệu QR trong localStorage demo.");
    }
  };

  const handleConfirmQr = () => {
    if (!scanResult?.found) return;

    if (scanResult.type === "RESERVATION_CONFIRM") {
      const session = confirmReservationCheckIn(scanResult.data.reservationCode);
      setConfirmedSession(session);
      setMessage("Đã xác nhận check-in cho xe đặt trước.");
      return;
    }

    if (scanResult.type === "PARKING_PASS_CONFIRM") {
      const session = createManualCheckIn({
        licensePlate: scanResult.data.licensePlate,
        vehicleType: scanResult.data.vehicleType,
        areaId: "A",
      });
      setConfirmedSession({ ...session, driverType: "SUBSCRIBER" });
      setMessage("Đã xác nhận check-in cho khách có vé tháng/quý/năm.");
      return;
    }

    setMessage("QR này không dùng cho check-in. Hãy dùng QR đặt chỗ hoặc QR ParkingPass.");
  };

  const handleManualCheckIn = (event) => {
    event.preventDefault();
    setMessage("");
    setScanResult(null);

    if (!licensePlate.trim()) {
      setMessage("Vui lòng nhập biển số xe.");
      return;
    }

    const session = createManualCheckIn({ licensePlate, vehicleType, areaId });
    setConfirmedSession(session);
    setMessage("Đã tạo session vãng lai và sinh QR phiên gửi xe.");
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b bg-white px-8">
        <div>
          <h1 className="text-2xl font-black">Staff Check-in</h1>
          <p className="text-sm text-slate-500">
            Quét QR đặt chỗ / QR vé active hoặc nhập thủ công xe vãng lai
          </p>
        </div>

        <nav className="flex items-center gap-3">
          <Link to="/staff/dashboard" className="rounded-xl px-4 py-2 font-bold text-slate-600 hover:bg-slate-100">
            Dashboard
          </Link>
          <Link to="/staff/check-out" className="rounded-xl px-4 py-2 font-bold text-slate-600 hover:bg-slate-100">
            Check-out
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
            QR Confirmation
          </p>
          <h2 className="mt-2 text-3xl font-black">
            Staff xác nhận đúng 3 loại driver
          </h2>
          <p className="mt-2 max-w-3xl text-slate-300">
            PRE_BOOKED dùng QR đặt chỗ. SUBSCRIBER dùng QR ParkingPass. GUEST
            nhập biển số thủ công và hệ thống sinh QR session mới.
          </p>
        </section>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setMode("QR")}
            className={`rounded-2xl px-5 py-3 font-black ${mode === "QR" ? "bg-slate-950 text-white" : "bg-white text-slate-600"}`}
          >
            Quét QR
          </button>
          <button
            type="button"
            onClick={() => setMode("MANUAL")}
            className={`rounded-2xl px-5 py-3 font-black ${mode === "MANUAL" ? "bg-slate-950 text-white" : "bg-white text-slate-600"}`}
          >
            Xe vãng lai
          </button>
        </div>

        <section className="grid gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-7">
            {mode === "QR" ? (
              <section className="rounded-3xl border bg-white p-6 shadow-sm">
                <h3 className="text-xl font-black">Nhập dữ liệu QR</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Demo chưa dùng camera thật. Copy mã QR hoặc mã test từ Driver rồi dán vào đây.
                </p>

                <textarea
                  value={qrText}
                  onChange={(event) => setQrText(event.target.value)}
                  rows={8}
                  placeholder="Dán QR payload hoặc nhập mã RSV-/PASS-..."
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
            ) : (
              <form onSubmit={handleManualCheckIn} className="rounded-3xl border bg-white p-6 shadow-sm">
                <h3 className="text-xl font-black">Check-in xe vãng lai</h3>
                <p className="mt-2 text-sm text-slate-500">
                  Driver vãng lai không cần account. Staff nhập biển số và loại xe.
                </p>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <Field label="Biển số">
                    <input
                      value={licensePlate}
                      onChange={(event) => setLicensePlate(event.target.value)}
                      className="w-full rounded-2xl border px-4 py-3 font-semibold outline-none focus:border-slate-950"
                    />
                  </Field>

                  <Field label="Loại xe">
                    <select
                      value={vehicleType}
                      onChange={(event) => setVehicleType(event.target.value)}
                      className="w-full rounded-2xl border px-4 py-3 font-semibold outline-none focus:border-slate-950"
                    >
                      {vehicleOptions.map((vehicle) => (
                        <option key={vehicle.value} value={vehicle.value}>
                          {vehicle.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Khu định hướng">
                    <select
                      value={areaId}
                      onChange={(event) => setAreaId(event.target.value)}
                      className="w-full rounded-2xl border px-4 py-3 font-semibold outline-none focus:border-slate-950"
                    >
                      {mapAreas.map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <button
                  type="submit"
                  className="mt-6 w-full rounded-2xl bg-slate-950 py-4 font-black text-white hover:bg-slate-800"
                >
                  Xác nhận check-in và sinh QR session
                </button>
              </form>
            )}

            {message && (
              <div className="rounded-2xl bg-blue-50 p-5 font-bold text-blue-800">
                {message}
              </div>
            )}

            {scanResult?.found && (
              <section className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold uppercase text-slate-400">Kết quả QR</p>
                    <h3 className="mt-1 text-xl font-black">{scanResult.type}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleConfirmQr}
                    className="rounded-xl bg-green-600 px-5 py-3 font-black text-white hover:bg-green-700"
                  >
                    Xác nhận check-in
                  </button>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <InfoBox label="Biển số" value={scanResult.data.licensePlate} />
                  <InfoBox label="Loại xe" value={scanResult.data.vehicleLabel} />
                  <InfoBox label="Tầng" value={scanResult.data.floorLabel || "Theo vé active"} />
                  <InfoBox label="Khu" value={scanResult.data.areaId ? `Khu ${scanResult.data.areaId}` : "Theo điều phối"} />
                </div>
              </section>
            )}
          </div>

          <div className="xl:col-span-5">
            {confirmedSession ? (
              <QrDisplay
                title="QR phiên gửi xe"
                description="QR này dùng để check-out hoặc đối soát khi ra cổng."
                value={confirmedSession.qrPayload || JSON.stringify(confirmedSession)}
                code={confirmedSession.sessionCode}
              >
                <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-5">
                  <Info label="Biển số" value={confirmedSession.licensePlate} />
                  <Info label="Loại khách" value={confirmedSession.driverType} />
                  <Info label="Tầng" value={confirmedSession.floorLabel} />
                  <Info label="Khu" value={`Khu ${confirmedSession.areaId}`} />
                  <Info label="Giờ vào" value={formatDateTime(confirmedSession.checkInAt)} />
                </div>
              </QrDisplay>
            ) : (
              <section className="rounded-3xl border bg-white p-6 shadow-sm">
                <h3 className="text-xl font-black">QR session sẽ hiện ở đây</h3>
                <p className="mt-3 text-slate-500">
                  Sau khi Staff xác nhận, hệ thống tạo session đang gửi xe và QR
                  dùng cho check-out.
                </p>
              </section>
            )}
          </div>
        </section>
      </main>
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

function InfoBox({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-2 font-black text-slate-950">{value || "-"}</p>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-200 py-2 last:border-b-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-black text-slate-950">{value || "-"}</span>
    </div>
  );
}
