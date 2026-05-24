import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DriverSidebar from "../../components/DriverSidebar";
import {
  createDriverReservation,
  getDriverReservationOptions,
} from "../../api/driverReservationApi";

export default function DriverReservation({ onLogout }) {
  const navigate = useNavigate();

  const [floors, setFloors] = useState([]);
  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [driverInfo, setDriverInfo] = useState(null);

  const [vehicleType, setVehicleType] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [duration, setDuration] = useState("2");
  const [selectedFloorId, setSelectedFloorId] = useState("");
  const [successBooking, setSuccessBooking] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    const loadReservationOptions = async () => {
      try {
        setLoading(true);
        setApiError("");

        const result = await getDriverReservationOptions();

        const apiFloors = Array.isArray(result?.floors) ? result.floors : [];
        const apiVehicleOptions = Array.isArray(result?.vehicleOptions)
          ? result.vehicleOptions
          : [];

        setFloors(apiFloors);
        setVehicleOptions(apiVehicleOptions);
        setDriverInfo(result?.driver || null);

        const defaultVehicle =
          result?.defaultVehicleType || apiVehicleOptions[0]?.value || "";

        setVehicleType(defaultVehicle);

        const defaultVehicleOption = apiVehicleOptions.find(
          (item) => item.value === defaultVehicle
        );

        const firstSuitableFloor =
          defaultVehicleOption?.suitableFloors?.[0] || apiFloors[0]?.id || "";

        setSelectedFloorId(result?.defaultFloorId || firstSuitableFloor);

        setPlateNumber(result?.defaultPlateNumber || "");
        setArrivalDate(result?.defaultArrivalDate || "");
        setArrivalTime(result?.defaultArrivalTime || "");
        setDuration(String(result?.defaultDuration || "2"));
      } catch (error) {
        console.error("Driver reservation options API error:", error);
        setApiError("Không thể tải dữ liệu đặt chỗ từ hệ thống.");
      } finally {
        setLoading(false);
      }
    };

    loadReservationOptions();
  }, []);

  const selectedVehicle = vehicleOptions.find(
    (item) => item.value === vehicleType
  );

  const availableFloors = useMemo(() => {
    if (!selectedVehicle) return [];

    return floors.filter((floor) =>
      selectedVehicle.suitableFloors?.includes(floor.id)
    );
  }, [floors, selectedVehicle]);

  const selectedFloor =
    availableFloors.find((floor) => floor.id === selectedFloorId) ||
    availableFloors[0];

  const recommendedFloor = useMemo(() => {
    if (availableFloors.length === 0) return null;

    return [...availableFloors].sort((a, b) => {
      const availableA = Number(a.total || 0) - Number(a.occupied || 0);
      const availableB = Number(b.total || 0) - Number(b.occupied || 0);
      return availableB - availableA;
    })[0];
  }, [availableFloors]);

  const estimatedPrice = useMemo(() => {
    const hours = Number(duration) || 1;
    const pricePerHour = Number(selectedVehicle?.pricePerHour || 0);

    return hours * pricePerHour;
  }, [selectedVehicle, duration]);

  const handleVehicleChange = (value) => {
    setVehicleType(value);

    const nextVehicle = vehicleOptions.find((item) => item.value === value);

    if (nextVehicle?.suitableFloors?.length > 0) {
      setSelectedFloorId(nextVehicle.suitableFloors[0]);
    } else {
      setSelectedFloorId("");
    }

    setSuccessBooking(null);
  };

  const handleBooking = async (e) => {
    e.preventDefault();

    if (!plateNumber.trim()) {
      alert("Vui lòng nhập biển số xe.");
      return;
    }

    if (!selectedVehicle) {
      alert("Vui lòng chọn loại xe.");
      return;
    }

    if (!selectedFloor) {
      alert("Không có tầng phù hợp với loại xe này.");
      return;
    }

    try {
      setSubmitting(true);
      setApiError("");

      const payload = {
        plateNumber,
        vehicleType,
        vehicleLabel: selectedVehicle.label,
        floorId: selectedFloor.id,
        floorName: selectedFloor.name,
        arrivalDate,
        arrivalTime,
        duration: Number(duration),
        estimatedPrice,
      };

      const result = await createDriverReservation(payload);

      setSuccessBooking({
        bookingCode: result?.bookingCode || "BOOKING-TEMP",
        plateNumber: result?.plateNumber || plateNumber,
        vehicleLabel: result?.vehicleLabel || selectedVehicle.label,
        floor: result?.floor || selectedFloor.name,
        arrivalDate: result?.arrivalDate || arrivalDate,
        arrivalTime: result?.arrivalTime || arrivalTime,
        duration: result?.duration || duration,
        estimatedPrice: result?.estimatedPrice ?? estimatedPrice,
      });
    } catch (error) {
      console.error("Create driver reservation API error:", error);
      setApiError("Không thể tạo đặt chỗ. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-800">
        <DriverSidebar active="reservation" onLogout={handleLogout} />

        <div className="ml-64 flex-1">
          <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-white px-8">
            <h2 className="text-2xl font-bold">Đặt chỗ gửi xe</h2>
          </header>

          <main className="p-8">
            <div className="rounded-3xl border bg-white p-6 shadow-sm">
              Đang tải dữ liệu đặt chỗ...
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (apiError && floors.length === 0) {
    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-800">
        <DriverSidebar active="reservation" onLogout={handleLogout} />

        <div className="ml-64 flex-1">
          <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-white px-8">
            <h2 className="text-2xl font-bold">Đặt chỗ gửi xe</h2>
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

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <DriverSidebar active="reservation" onLogout={handleLogout} />

      <div className="ml-64 flex-1">
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b bg-white px-8">
          <div>
            <h2 className="text-2xl font-bold">Đặt chỗ gửi xe</h2>
            <p className="text-sm text-slate-500">
              Chọn loại xe, thời gian đến và tầng phù hợp để đặt chỗ trước
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
              Driver Reservation
            </p>
            <h1 className="mt-2 text-3xl font-black">
              Đặt chỗ trước trong Smart Parking
            </h1>
            <p className="mt-2 max-w-3xl text-slate-300">
              Driver chỉ đặt chỗ theo tầng phù hợp với loại xe. Hệ thống giữ chỗ
              tạm thời, còn Staff sẽ xử lý check-in khi xe đến bãi.
            </p>
          </section>

          {apiError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
              {apiError}
            </div>
          )}

          <section className="grid gap-6 xl:grid-cols-12">
            <form
              onSubmit={handleBooking}
              className="space-y-6 rounded-3xl border bg-white p-6 shadow-sm xl:col-span-5"
            >
              <div>
                <h3 className="text-xl font-black text-slate-950">
                  Thông tin đặt chỗ
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Nhập thông tin xe và thời gian dự kiến đến.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  Biển số xe
                </label>
                <input
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  placeholder="Ví dụ: 30A-123.45"
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  Loại xe
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => handleVehicleChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {vehicleOptions.length > 0 ? (
                    vehicleOptions.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))
                  ) : (
                    <option value="">Không có loại xe</option>
                  )}
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-600">
                    Ngày đến
                  </label>
                  <input
                    type="date"
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-600">
                    Giờ đến
                  </label>
                  <input
                    type="time"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  Thời lượng dự kiến
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 font-semibold outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="1">1 giờ</option>
                  <option value="2">2 giờ</option>
                  <option value="3">3 giờ</option>
                  <option value="4">4 giờ</option>
                  <option value="8">8 giờ</option>
                  <option value="24">Cả ngày</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  Chọn tầng phù hợp
                </label>

                <div className="grid gap-3">
                  {availableFloors.length > 0 ? (
                    availableFloors.map((floor) => {
                      const available =
                        Number(floor.total || 0) -
                        Number(floor.occupied || 0);
                      const isSelected = selectedFloorId === floor.id;
                      const isRecommended = recommendedFloor?.id === floor.id;

                      return (
                        <button
                          key={floor.id}
                          type="button"
                          onClick={() => {
                            setSelectedFloorId(floor.id);
                            setSuccessBooking(null);
                          }}
                          className={`rounded-2xl border p-4 text-left transition hover:-translate-y-1 hover:shadow-md ${
                            isSelected
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-200 bg-slate-50 text-slate-800"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{floor.icon}</span>
                              <div>
                                <p className="font-black">{floor.name}</p>
                                <p
                                  className={`text-xs ${
                                    isSelected
                                      ? "text-slate-300"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {floor.vehicleType}
                                </p>
                              </div>
                            </div>

                            {isRecommended && (
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${
                                  isSelected
                                    ? "bg-white/15 text-white"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                Gợi ý
                              </span>
                            )}
                          </div>

                          <p
                            className={`mt-3 text-sm font-bold ${
                              isSelected ? "text-green-300" : "text-green-600"
                            }`}
                          >
                            Còn trống: {available}/{floor.total} chỗ
                          </p>
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                      Không có tầng phù hợp với loại xe này.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-5">
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-slate-500">
                    Phí tạm tính
                  </span>
                  <span className="text-2xl font-black text-slate-950">
                    {estimatedPrice.toLocaleString("vi-VN")}đ
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Phí thực tế có thể thay đổi theo thời gian gửi xe thực tế.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-slate-950 py-4 text-lg font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {submitting ? "Đang đặt chỗ..." : "Xác nhận đặt chỗ"}
              </button>
            </form>

            <div className="space-y-6 xl:col-span-7">
              <section className="rounded-3xl border bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-slate-950">
                      Tầng phù hợp
                    </h3>
                    <p className="text-sm text-slate-500">
                      Hệ thống lọc tầng theo loại xe bạn chọn.
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-100 px-4 py-2 text-xs font-black uppercase text-blue-700">
                    {selectedVehicle?.label || "Chưa chọn"}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {availableFloors.length > 0 ? (
                    availableFloors.map((floor) => {
                      const available =
                        Number(floor.total || 0) -
                        Number(floor.occupied || 0);

                      const percent =
                        Number(floor.total || 0) > 0
                          ? Math.round(
                              (Number(floor.occupied || 0) /
                                Number(floor.total || 0)) *
                                100
                            )
                          : 0;

                      return (
                        <div
                          key={floor.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold uppercase text-slate-400">
                                {floor.name}
                              </p>
                              <h4 className="mt-1 text-lg font-black text-slate-950">
                                {floor.vehicleType}
                              </h4>
                            </div>

                            <span className="text-3xl">{floor.icon}</span>
                          </div>

                          <div className="mt-5 grid grid-cols-3 gap-3">
                            <MiniStat label="Tổng" value={floor.total} />
                            <MiniStat label="Đã chiếm" value={floor.occupied} />
                            <MiniStat label="Trống" value={available} />
                          </div>

                          <div className="mt-5">
                            <div className="mb-2 flex justify-between text-xs font-bold text-slate-500">
                              <span>Tỷ lệ sử dụng</span>
                              <span>{percent}%</span>
                            </div>

                            <div className="h-3 overflow-hidden rounded-full bg-white">
                              <div
                                className={`h-full rounded-full ${
                                  percent >= 80
                                    ? "bg-red-500"
                                    : percent >= 50
                                    ? "bg-amber-500"
                                    : "bg-green-500"
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 md:col-span-2">
                      Không có tầng phù hợp để hiển thị.
                    </div>
                  )}
                </div>
              </section>

              {successBooking && (
                <section className="rounded-3xl bg-green-600 p-6 text-white shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-3xl">
                      ✅
                    </div>

                    <div>
                      <h3 className="text-2xl font-black">
                        Đặt chỗ thành công!
                      </h3>
                      <p className="mt-1 text-green-100">
                        Hệ thống đã giữ chỗ tạm thời cho bạn.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 rounded-2xl bg-green-700/50 p-5 md:grid-cols-2">
                    <BookingInfo
                      label="Mã đặt chỗ"
                      value={successBooking.bookingCode}
                    />
                    <BookingInfo
                      label="Biển số"
                      value={successBooking.plateNumber}
                    />
                    <BookingInfo
                      label="Loại xe"
                      value={successBooking.vehicleLabel}
                    />
                    <BookingInfo label="Tầng" value={successBooking.floor} />
                    <BookingInfo
                      label="Thời gian đến"
                      value={`${successBooking.arrivalTime} - ${successBooking.arrivalDate}`}
                    />
                    <BookingInfo
                      label="Phí tạm tính"
                      value={`${Number(
                        successBooking.estimatedPrice || 0
                      ).toLocaleString("vi-VN")}đ`}
                    />
                  </div>

                  <div className="mt-5 flex gap-3">
                    <button
                      type="button"
                      onClick={() => navigate("/driver/current-session")}
                      className="flex-1 rounded-xl bg-white py-3 font-black text-green-700 hover:bg-green-50"
                    >
                      Xem phiên gửi xe
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/driver/map")}
                      className="flex-1 rounded-xl border border-white/40 py-3 font-black text-white hover:bg-white/10"
                    >
                      Xem sơ đồ bãi xe
                    </button>
                  </div>
                </section>
              )}

              <section className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
                <h3 className="text-lg font-black text-blue-900">
                  Quy trình đặt chỗ
                </h3>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <StepCard
                    number="1"
                    title="Chọn loại xe"
                    desc="Hệ thống lọc tầng phù hợp với loại xe."
                  />
                  <StepCard
                    number="2"
                    title="Chọn thời gian"
                    desc="Nhập thời gian dự kiến bạn sẽ đến bãi."
                  />
                  <StepCard
                    number="3"
                    title="Xác nhận"
                    desc="Hệ thống giữ chỗ và tạo mã đặt chỗ."
                  />
                </div>
              </section>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-white p-3 text-center">
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function BookingInfo({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-green-100">{label}</p>
      <p className="mt-1 font-black text-white">{value || "--"}</p>
    </div>
  );
}

function StepCard({ number, title, desc }) {
  return (
    <div className="rounded-2xl bg-white p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-black text-white">
        {number}
      </div>
      <h4 className="font-black text-blue-950">{title}</h4>
      <p className="mt-2 text-sm leading-6 text-blue-700">{desc}</p>
    </div>
  );
}