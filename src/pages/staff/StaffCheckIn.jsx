import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";

// Custom SVG Icons for Premium UI
const IconDashboard = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const IconMap = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const IconCheckIn = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </svg>
);

const IconCheckOut = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconHistory = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconLogout = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const IconBell = () => (
  <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const IconSettings = () => (
  <svg className="w-6 h-6 text-slate-500 hover:rotate-45 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 01-6 0z" />
  </svg>
);

export default function StaffCheckIn({ onLogout }) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState("ĐANG CHỜ QUÉT...");
  const [collapsed, setCollapsed] = useState(false);
  const scannerRef = useRef(null);

  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [liveDate, setLiveDate] = useState("");

  const [formData, setFormData] = useState({
    plateNumber: "",
    vehicleType: "car",
    gate: "Cổng A Lê Văn Lương",
    slot: "A-102",
    floor: "Hầm B1",
    ticketCode: "",
    checkInTime: "",
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setLiveDate(today.toLocaleDateString('vi-VN', options));

    return () => {
      clearInterval(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

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

      setScanMessage("ĐÃ NHẬN MÃ QR THẺ");
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans">
      {/* Sidebar - Dark Glassmorphism style */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-50 flex h-screen flex-col bg-slate-900 text-white shadow-xl transition-all duration-300 ${
          collapsed ? "w-20" : "w-72"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center gap-3.5 px-6 py-6 border-b border-slate-800 overflow-hidden">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20 font-black text-lg flex-shrink-0"
          >
            P
          </button>
          {!collapsed && (
            <div className="animate-fade-in-fast">
              <h1 className="text-md font-extrabold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent whitespace-nowrap">
                Smart Parking
              </h1>
              <p className="text-xs text-blue-400 font-semibold tracking-wider uppercase whitespace-nowrap">
                Cổng nhân viên
              </p>
            </div>
          )}
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-x-hidden">
          <SideLink collapsed={collapsed} to="/staff/dashboard" icon={<IconDashboard />} label="Bảng điều khiển" />
          <SideLink collapsed={collapsed} to="/staff/map" icon={<IconMap />} label="Sơ đồ bãi xe" />
          <SideLink collapsed={collapsed} to="/staff/check-in" icon={<IconCheckIn />} label="Check-in xe vào" active />
          <SideLink collapsed={collapsed} to="/staff/check-out" icon={<IconCheckOut />} label="Check-out xe ra" />
          <SideLink collapsed={collapsed} to="/staff/history" icon={<IconHistory />} label="Lịch sử phiên gửi" />
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-800 p-4 overflow-hidden">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold text-rose-400 hover:bg-rose-955/30 hover:text-rose-300 transition-all duration-200"
          >
            <IconLogout />
            {!collapsed && <span className="whitespace-nowrap">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main
        className={`flex-1 min-h-screen flex flex-col transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-72"
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/80 px-8 backdrop-blur-md">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-900">Check-in xe vào</h2>
            <p className="text-xs text-slate-500 mt-0.5">{liveDate}</p>
          </div>

          <div className="flex items-center gap-6">
            {/* Live Clock Widget */}
            <div className="hidden md:flex flex-col items-end border-r border-slate-200 pr-6">
              <span className="font-mono text-lg font-bold text-indigo-600 bg-indigo-50/50 px-3 py-1 rounded-lg border border-indigo-100">
                {liveTime}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative rounded-full p-2.5 hover:bg-slate-100/80 transition-colors">
                <IconBell />
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              </button>

              <button className="rounded-full p-2.5 hover:bg-slate-100/80 transition-colors">
                <IconSettings />
              </button>
            </div>

            {/* Profile Avatar */}
            <div className="flex items-center gap-3.5 border-l border-slate-200 pl-6">
              <div className="text-right">
                <p className="font-semibold text-sm text-slate-900">Nguyễn Văn A</p>
                <p className="text-xs text-slate-400 font-medium">Nhân viên bãi xe</p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-650 font-bold text-white shadow-md shadow-indigo-500/20">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Content Section */}
        <section className="flex-1 space-y-6 p-8">
          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-8 text-white shadow-lg border border-slate-800">
            {/* Mesh Glow Background */}
            <div className="absolute right-0 top-0 -mr-20 -mt-20 h-60 w-60 rounded-full bg-blue-600/30 blur-3xl" />
            <div className="absolute left-1/3 bottom-0 -mb-20 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />

            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl font-extrabold tracking-tight">Ghi nhận phương tiện vào bãi</h2>
              <p className="mt-2 text-slate-300 text-sm leading-relaxed">
                Sử dụng camera quét mã QR của tài xế để tự động nhận dạng thông tin đăng ký, hoặc nhập tay biển số xe để phân phối ô đỗ trống.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Left Content Area (Camera & Inputs) */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-3 flex flex-col overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
                  ❖ Quét mã QR & Nhập liệu
                </h3>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isScanning ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
                  {isScanning ? 'Đang mở cam' : 'Chờ quét'}
                </span>
              </div>

              <div className="p-6 space-y-6 flex-1">
                {/* Scanner Screen Box */}
                <div className="relative overflow-hidden rounded-2xl bg-slate-950 p-3 shadow-inner border border-slate-800">
                  <div id="qr-reader" className="min-h-[260px] w-full overflow-hidden rounded-xl bg-slate-900" />

                  {!isScanning && (
                    <div className="absolute inset-3 flex flex-col items-center justify-center rounded-xl bg-slate-950/95 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-950 text-indigo-400 border border-indigo-500/30 text-3xl mb-4">
                        ▣
                      </div>
                      <p className="font-bold text-white text-md">CAMERA ĐANG TẮT</p>
                      <p className="text-slate-400 text-xs mt-1 max-w-xs px-4">
                        Nhấn nút bắt đầu quét phía dưới để bật máy quét mã QR
                      </p>
                    </div>
                  )}

                  {/* Corner brackets */}
                  <div className="pointer-events-none absolute inset-6 border border-white/10">
                    <span className="absolute -left-1 -top-1 h-5 w-5 border-l-2 border-t-2 border-indigo-400" />
                    <span className="absolute -right-1 -top-1 h-5 w-5 border-r-2 border-t-2 border-indigo-400" />
                    <span className="absolute -bottom-1 -left-1 h-5 w-5 border-b-2 border-l-2 border-indigo-400" />
                    <span className="absolute -bottom-1 -right-1 h-5 w-5 border-b-2 border-r-2 border-indigo-400" />
                  </div>
                </div>

                {/* Scan Message Alert */}
                <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3.5 flex items-center justify-center gap-2 text-sm font-semibold text-slate-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  Trạng thái: <span className="text-indigo-600 font-bold">{scanMessage}</span>
                </div>

                {/* Trigger Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={startScanner}
                    disabled={isScanning}
                    className="rounded-xl bg-indigo-600 py-3 font-bold text-white shadow-md shadow-indigo-500/10 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-colors cursor-pointer"
                  >
                    Bật máy quét QR
                  </button>

                  <button
                    onClick={stopScanner}
                    disabled={!isScanning}
                    className="rounded-xl border border-slate-200 py-3 font-bold text-slate-650 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    Tắt camera
                  </button>
                </div>

                {/* Main Form Fields */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Biển số xe</label>
                    <input
                      value={formData.plateNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, plateNumber: e.target.value })
                      }
                      placeholder="Nhập biển số, ví dụ: 30A-123.45"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-md font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Loại xe</label>
                      <select
                        value={formData.vehicleType}
                        onChange={(e) =>
                          setFormData({ ...formData, vehicleType: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                      >
                        <option value="car">🚗 Ô tô Sedan/SUV</option>
                        <option value="motorbike">🏍️ Xe máy</option>
                        <option value="bicycle">🚲 Xe đạp</option>
                        <option value="ebike">⚡ Xe điện</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Cổng vào</label>
                      <select
                        value={formData.gate}
                        onChange={(e) =>
                          setFormData({ ...formData, gate: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 transition-all"
                      >
                        <option>Cổng A Lê Văn Lương</option>
                        <option>Cổng B Nguyễn Trãi</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Mã vé / thẻ xe (QR)</label>
                    <input
                      value={formData.ticketCode}
                      readOnly
                      placeholder="Mã thẻ tự động nhận diện từ camera"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content Area (Status & Summary) */}
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Đề xuất bãi đỗ</h3>
                    <span className="rounded-full bg-indigo-550/10 border border-indigo-100 px-3 py-1 text-xs font-bold text-indigo-600">
                      {formData.floor}
                    </span>
                  </div>

                  {/* Suggestion Box */}
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 mb-6">
                    <p className="font-bold text-emerald-950 flex items-center gap-1.5 text-sm">
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                      Gợi ý tối ưu: Ô [{formData.slot}]
                    </p>
                    <p className="text-xs text-emerald-600 mt-1">
                      Khu vực gần trục thang máy, trống và dễ đỗ nhất
                    </p>
                  </div>

                  {/* Grid Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Tầng</label>
                      <input
                        value={formData.floor}
                        readOnly
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-650 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase">Ô đỗ xe</label>
                      <input
                        value={`${formData.slot} (Chờ)`}
                        readOnly
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckIn}
                  className="mt-8 w-full rounded-xl bg-slate-900 py-3.5 text-md font-bold text-white shadow-lg hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Xác nhận Check-in
                </button>
              </div>

              {/* Success Result Component */}
              {isSuccess && (
                <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 p-6 text-white shadow-lg border border-emerald-500/20 relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 -mb-8 -mr-8 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-xl flex-shrink-0">
                      ✓
                    </div>

                    <div>
                      <h3 className="text-lg font-bold">Check-in thành công!</h3>
                      <p className="text-xs text-emerald-100 mt-0.5">
                        Xe đã vào bến và ghi nhận thành công trong ca trực.
                      </p>
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="mt-5 grid grid-cols-2 gap-4 rounded-xl bg-black/10 p-4 text-xs">
                    <div>
                      <p className="text-emerald-200 font-medium">Mã vé xe</p>
                      <p className="font-bold text-sm mt-0.5">#{formData.ticketCode || "APX-9281"}</p>
                    </div>

                    <div>
                      <p className="text-emerald-200 font-medium">Vị trí đỗ</p>
                      <p className="font-bold text-sm mt-0.5">{formData.slot} ({formData.floor})</p>
                    </div>

                    <div>
                      <p className="text-emerald-200 font-medium">Loại xe</p>
                      <p className="font-bold text-sm mt-0.5">{getVehicleLabel(formData.vehicleType)}</p>
                    </div>

                    <div>
                      <p className="text-emerald-200 font-medium">Biển số</p>
                      <p className="font-bold text-sm mt-0.5">{formData.plateNumber || "--"}</p>
                    </div>
                  </div>

                  <button className="mt-5 w-full rounded-xl bg-white py-2.5 font-bold text-emerald-700 text-sm hover:bg-emerald-50 active:scale-[0.98] transition-all cursor-pointer">
                    🖨️ In vé gửi xe
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

function SideLink({ to, icon, label, active, collapsed }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${
        active
          ? "bg-slate-800 text-blue-400 border border-slate-700 shadow-inner"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </Link>
  );
}