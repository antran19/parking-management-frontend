// src/pages/driver/DriverReservation.jsx

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DriverSidebar from "../../components/DriverSidebar";
import QrDisplay from "../../components/QrDisplay";
import { getFloorAvailable, getSuggestedFloor, mapAreas, parkingFloors, vehicleOptions } from "../../data/parkingData";
import { createReservation, formatDateTime } from "../../services/smartParkingStorage";

export default function DriverReservation({ onLogout }) {
  const navigate = useNavigate();

  const [licensePlate, setLicensePlate] = useState("30A-123.45");
  const [vehicleType, setVehicleType] = useState("CAR_4");
  const [floorId, setFloorId] = useState(() => getSuggestedFloor("CAR_4").id);
  const [areaId, setAreaId] = useState("A");
  const [startTime, setStartTime] = useState(() => {
    const date = new Date(Date.now() + 30 * 60 * 1000);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  });
  const [note, setNote] = useState("");
  const [bookingResult, setBookingResult] = useState(null);
  const [error, setError] = useState("");

  const suggestedFloor = useMemo(() => getSuggestedFloor(vehicleType), [vehicleType]);
  const selectedFloor = parkingFloors.find((floor) => floor.id === floorId) || suggestedFloor;
  const available = getFloorAvailable(selectedFloor);

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    if (onLogout) onLogout();
    navigate("/login", { replace: true });
  };

  const handleVehicleChange = (value) => {
    const nextSuggestedFloor = getSuggestedFloor(value);
    setVehicleType(value);
    setFloorId(nextSuggestedFloor.id);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (!licensePlate.trim()) {
      setError("Vui lòng nhập biển số xe.");
      return;
    }

    if (available <= 0) {
      setError("Tầng đang chọn đã hết slot trống. Vui lòng chọn tầng khác.");
      return;
    }

    const reservation = createReservation({
      licensePlate,
      vehicleType,
      floorId,
      areaId,
      startTime,
      note,
    });

    setBookingResult(reservation);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <DriverSidebar active="reservation" onLogout={handleLogout} />

      <div className="ml-64 flex-1">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-white px-8">
          <div>
            <h2 className="text-2xl font-bold">Đặt chỗ trước</h2>
            <p className="text-sm text-slate-500">
              Đặt chỗ theo tầng/khu và nhận QR để Staff xác nhận
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-slate-100 font-bold">
            Q
          </div>
        </header>

        <main className="space-y-8 p-8">
          <section className="rounded-3xl bg-slate-900 p-8 text-white">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-300">
              Reservation QR
            </p>
            <h1 className="mt-2 text-3xl font-black">
              Driver đặt trước, Staff quét QR để check-in đúng loại khách
            </h1>
            <p className="mt-2 max-w-3xl text-slate-300">
              Sau khi đặt, hệ thống sinh QR chứa mã đặt chỗ, biển số, loại xe,
              tầng và khu A/B/C/D. Staff dùng mã này để xác nhận driverType =
              PRE_BOOKED.
            </p>
          </section>

          <section className="grid gap-6 xl:grid-cols-12">
            <form onSubmit={handleSubmit} className="space-y-6 xl:col-span-7">
              <section className="rounded-3xl border bg-white p-6 shadow-sm">
                <h3 className="text-xl font-black text-slate-950">
                  Thông tin đặt chỗ
                </h3>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <Field label="Biển số xe">
                    <input
                      value={licensePlate}
                      onChange={(event) => setLicensePlate(event.target.value)}
                      placeholder="VD: 30A-123.45"
                      className="w-full rounded-2xl border px-4 py-3 font-semibold outline-none focus:border-slate-900"
                    />
                  </Field>

                  <Field label="Loại xe">
                    <select
                      value={vehicleType}
                      onChange={(event) => handleVehicleChange(event.target.value)}
                      className="w-full rounded-2xl border px-4 py-3 font-semibold outline-none focus:border-slate-900"
                    >
                      {vehicleOptions.map((vehicle) => (
                        <option key={vehicle.value} value={vehicle.value}>
                          {vehicle.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Tầng gửi xe">
                    <select
                      value={floorId}
                      onChange={(event) => setFloorId(event.target.value)}
                      className="w-full rounded-2xl border px-4 py-3 font-semibold outline-none focus:border-slate-900"
                    >
                      {parkingFloors.map((floor) => (
                        <option key={floor.id} value={floor.id}>
                          {floor.label} - còn {getFloorAvailable(floor)} slot
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Khu trong tầng">
                    <select
                      value={areaId}
                      onChange={(event) => setAreaId(event.target.value)}
                      className="w-full rounded-2xl border px-4 py-3 font-semibold outline-none focus:border-slate-900"
                    >
                      {mapAreas.map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.name} - {area.position}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Thời gian dự kiến vào">
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(event) => setStartTime(event.target.value)}
                      className="w-full rounded-2xl border px-4 py-3 font-semibold outline-none focus:border-slate-900"
                    />
                  </Field>

                  <Field label="Ghi chú">
                    <input
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="VD: cần gần thang máy"
                      className="w-full rounded-2xl border px-4 py-3 font-semibold outline-none focus:border-slate-900"
                    />
                  </Field>
                </div>

                {error && (
                  <div className="mt-5 rounded-2xl bg-red-50 p-4 font-bold text-red-700">
                    {error}
                  </div>
                )}

                <div className="mt-6 rounded-2xl bg-blue-50 p-5 text-blue-900">
                  <p className="font-black">Gợi ý hệ thống</p>
                  <p className="mt-1 text-sm">
                    Loại xe này phù hợp nhất với {suggestedFloor.label}. Tầng
                    đang chọn còn {available} slot chưa chiếm.
                  </p>
                </div>

                <button
                  type="submit"
                  className="mt-6 w-full rounded-2xl bg-slate-950 py-4 text-lg font-black text-white hover:bg-slate-800"
                >
                  Xác nhận đặt chỗ và tạo QR
                </button>
              </section>
            </form>

            <div className="space-y-6 xl:col-span-5">
              {bookingResult ? (
                <QrDisplay
                  title="QR đặt chỗ cho Staff"
                  description="Đưa QR này cho Staff quét ở cổng để xác nhận xe đã đặt trước."
                  value={bookingResult.qrPayload}
                  code={bookingResult.reservationCode}
                >
                  <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-5">
                    <Info label="Biển số" value={bookingResult.licensePlate} />
                    <Info label="Loại xe" value={bookingResult.vehicleLabel} />
                    <Info label="Tầng" value={bookingResult.floorLabel} />
                    <Info label="Khu" value={`Khu ${bookingResult.areaId}`} />
                    <Info label="Giờ vào" value={formatDateTime(bookingResult.startTime)} />
                    <Info label="Trạng thái" value="Chờ Staff xác nhận" />
                  </div>
                </QrDisplay>
              ) : (
                <section className="rounded-3xl border bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-black text-slate-950">
                    QR sẽ hiện ở đây
                  </h3>
                  <p className="mt-3 text-slate-500">
                    Sau khi driver bấm đặt chỗ, mã QR sẽ hiện ra. Staff chỉ cần
                    quét hoặc nhập mã test để xác nhận xe đã đặt trước.
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
