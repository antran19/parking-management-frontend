import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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

const LicensePlate = ({ plate }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-350 bg-white font-mono font-bold text-slate-800 shadow-sm text-xs tracking-widest">
    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block mr-1"></span>
    {plate}
  </span>
);

export default function StaffCheckOut({ onLogout }) {
  const [lookupMode, setLookupMode] = useState("qr");
  const [paymentMethod, setPaymentMethod] = useState("qr");
  const [showSuccess, setShowSuccess] = useState(false);
  const [timer, setTimer] = useState(4 * 3600 + 45 * 60 + 12);
  const [collapsed, setCollapsed] = useState(false);

  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [liveDate, setLiveDate] = useState("");

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    const timerInterval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);

    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setLiveDate(today.toLocaleDateString('vi-VN', options));

    return () => {
      clearInterval(clockTimer);
      clearInterval(timerInterval);
    };
  }, []);

  const formatTimer = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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
          <SideLink collapsed={collapsed} to="/staff/check-in" icon={<IconCheckIn />} label="Check-in xe vào" />
          <SideLink collapsed={collapsed} to="/staff/check-out" icon={<IconCheckOut />} label="Check-out xe ra" active />
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
            <h2 className="text-xl font-bold text-slate-900">Check-out xe ra</h2>
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
              <h2 className="text-3xl font-extrabold tracking-tight">Thanh toán & Check-out</h2>
              <p className="mt-2 text-slate-300 text-sm leading-relaxed">
                Tra cứu mã vé gửi xe (QR) hoặc tìm kiếm theo biển số xe đang gửi để lập hóa đơn tính toán chi phí, xác nhận thanh toán cổng ra.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column (Search / QR Scanner / Mini Stat) */}
            <div className="space-y-6 lg:col-span-4 flex flex-col">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col">
                {/* Tabs Selector */}
                <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50">
                  <button
                    onClick={() => setLookupMode("qr")}
                    className={`px-4 py-4 font-bold text-sm tracking-wide transition-all cursor-pointer ${
                      lookupMode === "qr"
                        ? "border-b-2 border-indigo-600 bg-white text-indigo-650"
                        : "text-slate-500 hover:text-slate-850"
                    }`}
                  >
                    ▣ Quét mã QR
                  </button>

                  <button
                    onClick={() => setLookupMode("plate")}
                    className={`px-4 py-4 font-bold text-sm tracking-wide transition-all cursor-pointer ${
                      lookupMode === "plate"
                        ? "border-b-2 border-indigo-600 bg-white text-indigo-655"
                        : "text-slate-500 hover:text-slate-850"
                    }`}
                  >
                    🔍 Tìm biển số
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-6 flex-1 flex flex-col justify-between min-h-[280px]">
                  {lookupMode === "qr" ? (
                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                      <div className="relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100/50 transition-colors">
                        <div className="absolute left-0 right-0 top-6 h-0.5 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] animate-pulse" />
                        <div className="text-center">
                          <div className="text-5xl mb-3">📷</div>
                          <p className="px-6 text-xs font-semibold text-slate-500">
                            Đưa mã vé QR của tài xế vào vùng ống kính camera
                          </p>
                        </div>
                      </div>

                      <button className="w-full rounded-xl bg-slate-900 py-3.5 font-bold text-white shadow-md hover:bg-slate-800 transition-colors text-sm cursor-pointer">
                        Bắt đầu quét QR
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5 flex-1 flex flex-col justify-between">
                      <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                          Nhập biển số xe cần tìm
                        </label>
                        <input
                          placeholder="Ví dụ: 30A-123.45"
                          className="w-full rounded-xl border border-slate-200 px-4 py-4 text-center text-xl font-bold tracking-widest text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all uppercase"
                        />
                      </div>

                      <button className="w-full rounded-xl bg-slate-900 py-3.5 font-bold text-white shadow-md hover:bg-slate-800 transition-colors text-sm cursor-pointer">
                        Tra cứu hệ thống
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Card */}
              <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 p-6 text-white shadow-lg relative overflow-hidden">
                <div className="absolute right-0 bottom-0 -mb-6 -mr-6 h-20 w-20 rounded-full bg-white/10 blur-lg" />
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-100">
                  Check-out trong ca trực
                </p>
                <div className="mt-2.5 flex items-end justify-between">
                  <span className="text-4xl font-extrabold tracking-tight">128 xe</span>
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold border border-white/10">
                    +12% so với hôm qua
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column (Info Display & Bill) */}
            <div className="space-y-6 lg:col-span-8">
              <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex flex-col gap-8 xl:flex-row">
                  {/* Left block Info */}
                  <div className="flex-1 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Thông tin xe ra</h3>
                      <span className="rounded-full bg-rose-50 border border-rose-100 px-3 py-1 text-xs font-bold text-rose-600 animate-pulse">
                        Sắp quá giờ
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      <InfoBlock label="Biển số" value={<LicensePlate plate="30A-888.68" />} />
                      <InfoBlock label="Mã vé xe" value="#TK-2901-X" />
                      <InfoBlock label="Thời gian vào" value="10:15:30 • 24/10/2023" />
                      <InfoBlock label="Cổng vào" value="Cổng số 02 (Bắc)" />
                    </div>

                    {/* Camera view screen */}
                    <div className="h-44 overflow-hidden rounded-xl border border-slate-250 bg-slate-950 shadow-inner relative group">
                      <div className="flex h-full items-center justify-center bg-[url('/src/assets/parking-bg.jpg')] bg-cover bg-center text-white">
                        <div className="absolute inset-0 bg-slate-950/30 group-hover:bg-slate-950/10 transition-colors" />
                        <div className="relative z-10 rounded-lg bg-slate-900/80 px-4 py-2 text-xs font-bold tracking-wide uppercase border border-white/10 shadow">
                          📹 Camera nhận diện cổng vào
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right block Fees */}
                  <div className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-6 xl:w-80 flex flex-col justify-between">
                    <div>
                      <div className="mb-5 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Thời gian đỗ</span>
                        <span className="font-mono text-sm font-bold text-indigo-650 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                          ⏱ {formatTimer(timer)}
                        </span>
                      </div>

                      <div className="space-y-3.5">
                        <FeeRow label="Phí cơ bản (2h đầu)" value="40.000đ" />
                        <FeeRow label="Phí cộng thêm (3h)" value="45.000đ" />
                        <FeeRow label="Phụ phí giờ cao điểm" value="5.000đ" />
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col border-t border-slate-200/80 pt-5">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng thanh toán</span>
                      <span className="text-3xl font-black text-indigo-600 tracking-tight mt-1">90.000đ</span>
                    </div>
                  </div>
                </div>

                {/* Payments options */}
                <div className="mt-8 space-y-5 border-t border-slate-100 pt-8">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Phương thức thanh toán
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setPaymentMethod("qr")}
                      className={`rounded-xl border-2 p-5 font-bold transition-all text-sm flex flex-col items-center gap-2 cursor-pointer ${
                        paymentMethod === "qr"
                          ? "border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-350"
                      }`}
                    >
                      <div className="text-2xl">▣</div>
                      <span>QR Code / Chuyển khoản</span>
                    </button>

                    <button
                      onClick={() => setPaymentMethod("cash")}
                      className={`rounded-xl border-2 p-5 font-bold transition-all text-sm flex flex-col items-center gap-2 cursor-pointer ${
                        paymentMethod === "cash"
                          ? "border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-350"
                      }`}
                    >
                      <div className="text-2xl">💵</div>
                      <span>Tiền mặt tại quầy</span>
                    </button>
                  </div>

                  {/* QR view or Cash checklist */}
                  {paymentMethod === "qr" ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-150 bg-slate-50 p-6 shadow-inner">
                      <div className="flex h-44 w-44 items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 shadow-md">
                        {/* Mock QR grid icon */}
                        <div className="grid grid-cols-2 gap-1.5 w-full h-full opacity-80">
                          <span className="border-2 border-slate-900 rounded"></span>
                          <span className="border-2 border-slate-900 rounded"></span>
                          <span className="border-2 border-slate-900 rounded"></span>
                          <span className="bg-slate-900 rounded"></span>
                        </div>
                      </div>
                      <p className="mt-4 text-xs font-semibold text-slate-500">
                        Quét mã trên để chuyển khoản số tiền: <span className="font-bold text-slate-800 text-sm">90.000đ</span>
                      </p>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-center gap-3.5 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 hover:bg-slate-100/50 transition-colors">
                      <input
                        type="checkbox"
                        className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-slate-700">
                        Xác nhận đã nhận đủ số tiền mặt <span className="font-bold text-slate-900">90.000đ</span> từ tài xế.
                      </span>
                    </label>
                  )}

                  <button
                    onClick={() => setShowSuccess(true)}
                    className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-bold text-white shadow-lg hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    Xác nhận xuất bãi (Check-out)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* History Section */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h3 className="text-md font-bold text-slate-850">
                  Lịch sử check-out hôm nay
                </h3>
                <p className="text-xs text-slate-400 mt-1">Các phương tiện đã hoàn tất thủ tục xuất bãi gần đây</p>
              </div>

              <button className="text-xs font-bold text-indigo-600 hover:text-indigo-750 hover:underline cursor-pointer">
                Xem toàn bộ lịch sử
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Thời gian ra</th>
                    <th className="px-6 py-4">Biển số</th>
                    <th className="px-6 py-4">Loại xe</th>
                    <th className="px-6 py-4">Tổng phí</th>
                    <th className="px-6 py-4">Hình thức thanh toán</th>
                    <th className="px-6 py-4 text-right">Biên lai</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {[
                    ["14:20:05", "30G-445.12", "Ô tô 4 chỗ", "45.000đ", "Chuyển khoản"],
                    ["14:15:22", "29D-889.34", "Ô tô SUV", "120.000đ", "Tiền mặt"],
                    ["14:02:10", "59A1-223.45", "Xe máy", "12.000đ", "Tiền mặt"],
                  ].map((row) => (
                    <tr
                      key={row[1]}
                      className="hover:bg-slate-50/50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 text-slate-500 font-medium font-mono">
                        {row[0]}
                      </td>
                      <td className="px-6 py-4">
                        <LicensePlate plate={row[1]} />
                      </td>
                      <td className="px-6 py-4 text-slate-655 font-semibold">
                        {row[2]}
                      </td>
                      <td className="px-6 py-4 text-slate-800 font-bold">
                        {row[3]}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 border border-slate-200">
                          {row[4]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-405 hover:text-indigo-600 p-1.5 rounded hover:bg-slate-100 cursor-pointer">
                          🖨️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* Success Receipt Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl border border-slate-100 flex flex-col relative overflow-hidden">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-3xl">
              ✓
            </div>

            <h3 className="text-xl font-extrabold text-slate-900">Check-out thành công!</h3>
            <p className="mt-1.5 text-xs text-slate-400">
              Xe 30A-888.68 đã hoàn tất thanh toán và được cấp quyền mở barie.
            </p>

            {/* Receipt info */}
            <div className="my-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-left text-xs space-y-3 font-medium">
              <div className="flex justify-between border-b border-slate-200/80 pb-2.5">
                <span className="font-bold text-slate-700 uppercase">Hóa đơn điện tử</span>
                <span className="font-mono text-slate-400 font-bold">#99283-A</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Số tiền thanh toán:</span>
                <span className="font-bold text-slate-900 text-sm">90.000đ</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Hình thức:</span>
                <span className="font-bold text-slate-900">
                  {paymentMethod === "qr" ? "QR Chuyển khoản" : "Tiền mặt tại quầy"}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSuccess(false)}
                className="flex-1 rounded-xl border border-slate-250 py-3 font-semibold text-slate-600 hover:bg-slate-50 text-sm cursor-pointer"
              >
                Đóng
              </button>

              <button className="flex-1 rounded-xl bg-indigo-650 py-3 font-bold text-white shadow-md shadow-indigo-500/10 hover:bg-indigo-700 text-sm cursor-pointer">
                In hóa đơn
              </button>
            </div>
          </div>
        </div>
      )}
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

function InfoBlock({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span className="font-bold text-slate-850 text-sm">
        {value}
      </span>
    </div>
  );
}

function FeeRow({ label, value }) {
  return (
    <div className="flex justify-between text-xs font-semibold">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-800">{value}</span>
    </div>
  );
}