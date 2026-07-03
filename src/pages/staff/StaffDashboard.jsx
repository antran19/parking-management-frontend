import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { staffApi } from "../../api/parkingApi";
import { formatLicensePlate } from "../../utils/licensePlate";

// Component render Biển số xe tiêu chuẩn Việt Nam
const LicensePlate = ({ plate, vehicleType }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded border-2 border-slate-700 bg-white font-mono font-extrabold text-slate-800 shadow-sm text-[11px] tracking-widest scale-95 origin-center select-none">
    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block"></span>
    {formatLicensePlate(plate, vehicleType)}
  </span>
);

/**
 * StaffDashboard — Giao diện bảng điều khiển chính dành cho nhân viên tác nghiệp.
 */
export default function StaffDashboard() {
  // Lấy thông tin tài khoản đăng nhập từ localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const fullName = user.fullName || "Nguyễn Văn A";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  // Thống kê bãi xe và hoạt động
  const [stats, setStats] = useState({
    availableSlots: 0,
    occupiedSlots: 0,
    reservedSlots: 0,
    todayCheckIn: 0,
    todayCheckOut: 0,
    revenue: "0đ",
  });
  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState([]);
  const [gates, setGates] = useState([]);
  const [recentExceptions, setRecentExceptions] = useState([]);
  const [closedZones, setClosedZones] = useState([]);
  const [upcomingReservations, setUpcomingReservations] = useState([]);

  // Đồng bộ dữ liệu hiển thị realtime với backend
  const syncDashboardData = async () => {
    try {
      // 1. Tải số liệu thống kê Dashboard trực tiếp từ Backend
      const statsRes = await staffApi.getStaffDashboardStats();
      const backendStats = statsRes.data.data || {};

      // 2. Tải danh sách Zone và tính toán phân khu bảo trì
      const closedZonesArray = JSON.parse(localStorage.getItem("closedZones") || "[]");
      setClosedZones(closedZonesArray);

      let zonesData = [];
      let closedCapacity = 0;
      try {
        const configRes = await staffApi.getParkingConfig();
        zonesData = configRes.data.data?.zones || [];

        // Sắp xếp các zone theo thứ tự tầng từ cao xuống thấp (T2 -> T1 -> B1 -> B2)
        zonesData.sort((a, b) => {
          const getFloorVal = (z) => {
            const name = String(z.floorName || (z.floor && z.floor.floorName) || "").toUpperCase();
            if (name.includes("B") || name.includes("HẦM")) {
              const m = name.match(/\d+/);
              return m ? -parseInt(m[0], 10) : -1;
            }
            const m = name.match(/\d+/);
            return m ? parseInt(m[0], 10) : 0;
          };
          const valA = getFloorVal(a);
          const valB = getFloorVal(b);
          if (valA !== valB) return valB - valA; // Cao xuống thấp
          
          // Cùng tầng thì sắp xếp theo tên khu
          const nameA = String(a.zoneName || "");
          const nameB = String(b.zoneName || "");
          return nameA.localeCompare(nameB);
        });

        setZones(zonesData);
        setGates(configRes.data.data?.gates || []);

        const closedZonesSet = new Set(closedZonesArray);
        zonesData.forEach(z => {
          if (closedZonesSet.has(z.id)) {
            closedCapacity += ((z.capacity || 0) - (z.currentCount || 0) - (z.reservedCount || 0));
          }
        });
      } catch (configErr) {
        console.warn("Lỗi tải config phân khu:", configErr);
      }

      let totalAvailable = backendStats.availableSlots || 0;
      totalAvailable = Math.max(totalAvailable - closedCapacity, 0);

      setStats({
        availableSlots: totalAvailable,
        occupiedSlots: backendStats.occupiedSlots || 0,
        reservedSlots: backendStats.reservedSlots || 0,
        todayCheckIn: backendStats.todayCheckIn || 0,
        todayCheckOut: backendStats.todayCheckOut || 0,
        revenue: `${(backendStats.todayRevenue || 0).toLocaleString("vi-VN")}đ`
      });

      // 3. Tải danh sách ngoại lệ an ninh (Cảnh báo sai Zone, SOS, etc.)
      let backendExceptions = [];
      try {
        const exceptionsRes = await staffApi.getSecurityExceptions();
        backendExceptions = exceptionsRes.data.data || [];
      } catch (err) {
        console.warn("Lỗi tải exceptions:", err);
      }

      const formattedBackend = backendExceptions.map(ex => {
        const date = new Date(ex.createdAt);
        const diff = Date.now() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        let timeAgo = "Vừa xong";
        if (minutes >= 1440) {
          // Lớn hơn 24 giờ thì hiển thị số ngày
          const days = Math.floor(minutes / 1440);
          timeAgo = `${days} ngày trước`;
        } else if (minutes >= 60) {
          const hours = Math.floor(minutes / 60);
          timeAgo = `${hours} giờ trước`;
        } else if (minutes > 0) {
          timeAgo = `${minutes} phút trước`;
        }
        return {
          ...ex,
          timeAgo
        };
      });

      setRecentExceptions(formattedBackend.slice(0, 5));

      // 4. Đồng bộ hàng đợi đặt trước (Reservations Queue) từ Backend
      try {
        const reservationsRes = await staffApi.getStaffUpcomingReservations();
        const activeReservations = reservationsRes.data.data || [];
        const mappedReservations = activeReservations.map(res => {
          const reservedTo = new Date(res.reservedTo).getTime();
          const now = Date.now();
          const diffMins = Math.max(0, Math.floor((reservedTo - now) / 60000));
          let countdownStr = "Hết hạn";
          if (diffMins > 0) {
            if (diffMins > 60) {
              countdownStr = `Còn ${Math.floor(diffMins / 60)}h ${diffMins % 60}p`;
            } else {
              countdownStr = `Còn ${diffMins}p`;
            }
          }
          return {
            licensePlate: res.licensePlate || "Không rõ",
            customerName: res.customerName || "Khách đặt trước",
            zoneName: res.zoneName || "Khu vực chung",
            status: res.status === "CONFIRMED" ? "VIP" : "PRE_BOOKED",
            countdown: countdownStr
          };
        });
        setUpcomingReservations(mappedReservations);
      } catch (resErr) {
        console.warn("Lỗi tải danh sách đặt trước:", resErr);
      }

    } catch (err) {
      console.warn("Lỗi khi tải dữ liệu thời gian thực cho Staff Dashboard:", err);
    } finally {
      setLoading(false);
    }
  };



  // Thiết lập interval tự động cập nhật dữ liệu sau mỗi 2 giây
  useEffect(() => {
    syncDashboardData();
    const configInterval = setInterval(syncDashboardData, 2000);
    return () => {
      clearInterval(configInterval);
    };
  }, []);

  return (
    <section className="space-y-8 p-3 flex-1">
      {/* Welcome Banner - Cải thiện với dải chuyển màu hiện đại, sang trọng hơn */}
      <div className="welcome-banner rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-8 text-white relative overflow-hidden shadow-lg shadow-indigo-900/10">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-black/10 to-transparent pointer-events-none" />
        <h1 className="text-2xl font-bold tracking-tight">
          {getGreeting()}, {fullName}! 👋
        </h1>
        <p className="mt-2.5 text-sm text-indigo-100/90 max-w-2xl leading-relaxed font-normal">
          Chào mừng bạn đến với cổng quản trị thông tin điều phối SmartParking. Hãy theo dõi trực tiếp tình trạng các zone đỗ xe, hỗ trợ check-in xe vào và xử lý thanh toán check-out đúng quy trình.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-6">
        <StatCard title="Chỗ trống" value={stats.availableSlots} color="emerald" />
        <StatCard title="Đang có xe" value={stats.occupiedSlots} color="rose" />
        <StatCard title="Đã giữ chỗ" value={stats.reservedSlots} color="amber" />
        <StatCard title="Xe vào hôm nay" value={stats.todayCheckIn} color="blue" />
        <StatCard title="Xe ra hôm nay" value={stats.todayCheckOut} color="indigo" />
        <StatCard title="Doanh thu ngày" value={stats.revenue} color="purple" />
      </div>

      {/* Action Hub & Operation Health */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="action-panel-item rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm lg:col-span-2 space-y-5">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">Thao tác tác nghiệp nhanh</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <QuickAction
              to="/staff/check-in"
              title="Check-in xe vào"
              desc="Quét mã đặt chỗ hoặc nhập biển số"
              icon="🚗"
            />
            <QuickAction
              to="/staff/check-out"
              title="Check-out xe ra"
              desc="Tính toán biểu phí & thu phí"
              icon="💳"
            />
            <QuickAction
              to="/staff/map"
              title="Sơ đồ phân khu"
              desc="Điều phối vị trí trống"
              icon="🅿️"
            />
          </div>
        </div>

        <div className="action-panel-item rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm flex flex-col space-y-5 h-full max-h-[250px]">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 shrink-0">Trạng thái vận hành IoT</h3>
          <div className="space-y-3 overflow-y-auto pr-1 scrollbar-thin pb-1">
            {gates.length > 0 ? (
              gates.map(gate => (
                <StatusRow 
                  key={gate.id} 
                  label={`Barrier ${gate.gateName || gate.name || "Cổng"}`} 
                  status={gate.isActive ? "Hoạt động" : "Bảo trì"} 
                  isError={!gate.isActive} 
                />
              ))
            ) : (
              <div className="text-center py-4 text-slate-400 text-[11px] font-bold animate-pulse">
                Đang tải trạng thái cổng...
              </div>
            )}
            {/* Luôn hiển thị các hệ thống phụ trợ */}
            <StatusRow label="Cổng thanh toán QR" status="Sẵn sàng" />
            <StatusRow label="Camera AI nhận diện" status="Sẵn sàng" />
          </div>
        </div>
      </div>

      {/* Lưới các chức năng điều phối cao cấp */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Cột 1: Live Zone Occupancy Grid */}
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm flex flex-col space-y-5 h-[420px] overflow-hidden">
          <div className="flex justify-between items-center shrink-0">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Tải trọng Phân khu</h3>
            
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
            {zones.map((zone) => {
              const isClosed = closedZones.includes(zone.id);
              const occupied = (zone.currentCount || 0) + (zone.reservedCount || 0);
              const total = zone.capacity || 1;
              const pct = Math.min(Math.round((occupied / total) * 100), 100);

              let barColor = "bg-emerald-500";
              if (pct >= 90) barColor = "bg-rose-500";
              else if (pct >= 75) barColor = "bg-amber-500";

              return (
                <div key={zone.id} className="space-y-2 border-b border-slate-100/40 pb-3.5 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-[12px] font-extrabold text-slate-800">{zone.floorName || (zone.floor && zone.floor.floorName) || "?"} - {zone.zoneName} ({zone.zoneCode})</span>
                      <span className="text-[10px] text-slate-500 font-bold mt-0.5">
                        Chứa: {occupied}/{total} xe • Loại: {zone.vehicleTypeName || (zone.type === "O_TO" ? "Ô tô" : zone.type === "XE_MAY" ? "Xe máy" : zone.type) || 'Không rõ'}
                      </span>
                    </div>
                  </div>

                  {!isClosed ? (
                    <div className="relative pt-1">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }}></div>
                      </div>
                      <span className="absolute right-0 top-3 text-[20px] font-extrabold text-slate-650">{pct}% </span>
                    </div>
                  ) : (
                    <div className="text-[9px] font-bold text-rose-500 italic bg-rose-50/50 py-1 px-2.5 rounded border border-rose-100/40">
                      Khu đỗ tạm khóa phục vụ bảo trì
                    </div>
                  )}
                </div>
              );
            })}
            {zones.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs font-bold animate-pulse">
                Đang tải trạng thái phân khu...
              </div>
            )}
          </div>
        </div>

        {/* Cột 2: Operations Alert Feed */}
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm flex flex-col space-y-5 h-[420px] overflow-hidden">
          <div className="flex justify-between items-center shrink-0">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Cảnh báo & Ngoại lệ an ninh</h3>
            <span className="text-[9px] font-extrabold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-100">Cấp bách</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
            {recentExceptions.map((ex, idx) => {
              const typeColors = {
                WRONG_ZONE: "bg-amber-50/50 border-amber-200/60 text-amber-900",
                WRONG_PLATE: "bg-amber-50/50 border-amber-200/60 text-amber-900",
                LOST_TICKET: "bg-blue-50/50 border-blue-200 text-blue-900",
                OVERTIME: "bg-indigo-50/50 border-indigo-200 text-indigo-900",
                UNPAID: "bg-rose-50/50 border-rose-200 text-rose-900",
                SUSPICIOUS_BEHAVIOR: "bg-rose-50/70 border-rose-200 text-rose-900 animate-pulse",
                OTHER: "bg-slate-50 border-slate-200 text-slate-800"
              };
              const typeLabels = {
                LOST_TICKET: "🎟️ Mất vé/thẻ",
                WRONG_PLATE: "🔍 Sai biển số",
                OVERTIME: "⏳ Gửi quá hạn",
                WRONG_ZONE: "⚠️ Sai phân khu",
                UNPAID: "💸 Trốn/quỵt phí",
                SUSPICIOUS_BEHAVIOR: "🚨 Đáng nghi ngờ",
                OTHER: "📝 Sự cố khác"
              };

              const colorClass = typeColors[ex.exceptionType] || typeColors.OTHER;

              const vehicleTypeMatch = ex.description ? ex.description.match(/^\[Loại xe:\s*([^\]]+)\]/) : null;
              const vehicleType = vehicleTypeMatch ? vehicleTypeMatch[1] : "";
              const cleanDescription = ex.description 
                ? ex.description.replace(/^\[Loại xe:\s*[^\]]+\]\s*/, "") 
                : "";

              return (
                <div key={ex.id || idx} className={`p-3.5 rounded-2xl border text-xs leading-relaxed space-y-2 relative overflow-hidden ${colorClass}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold uppercase text-[9px] tracking-wider bg-white/70 px-1.5 py-0.5 rounded border border-black/5">
                      {typeLabels[ex.exceptionType] || `⚠️ ${ex.exceptionType}`}
                    </span>
                    <span className="text-[11px] font-mono font-bold opacity-75">{ex.timeAgo}</span>
                  </div>
                  <p className="font-bold text-slate-800 text-[11px] leading-tight">
                    {vehicleType && <span className="text-rose-700 font-extrabold mr-1">[{vehicleType}]</span>}
                    {cleanDescription}
                  </p>
                  {ex.licensePlate && ex.licensePlate !== "Chưa xác định" && (
                    <div className="flex justify-between items-center pt-2 border-t border-black/5">
                      <LicensePlate plate={ex.licensePlate} vehicleType={vehicleType} />
                    </div>
                  )}
                </div>
              );
            })}
            {recentExceptions.length === 0 && (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <span className="text-2xl block">🎉</span>
                <p className="text-xs font-bold uppercase tracking-wider">Hệ thống an toàn</p>
                <p className="text-[10px] text-slate-400 mt-1">Không ghi nhận sự cố chưa xử lý.</p>
              </div>
            )}
          </div>
        </div>

        

      </div>
    </section>
  );
}

// Component thẻ thống kê
function StatCard({ title, value, color }) {
  const styles = {
    emerald: "border-emerald-500/20 bg-emerald-50/15 text-emerald-700 hover:shadow-emerald-500/5",
    rose: "border-rose-500/20 bg-rose-50/15 text-rose-700 hover:shadow-rose-500/5",
    amber: "border-amber-500/20 bg-amber-50/15 text-amber-700 hover:shadow-amber-500/5",
    blue: "border-blue-500/20 bg-blue-50/15 text-blue-700 hover:shadow-blue-500/5",
    indigo: "border-indigo-500/20 bg-indigo-50/15 text-indigo-700 hover:shadow-indigo-500/5",
    purple: "border-purple-500/20 bg-purple-50/15 text-purple-700 hover:shadow-purple-500/5",
  };

  const borderAccents = {
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
    amber: "bg-amber-500",
    blue: "bg-blue-500",
    indigo: "bg-indigo-500",
    purple: "bg-purple-500",
  };

  return (
    <div className={`relative stat-card-item rounded-2xl border p-5 shadow-sm space-y-2 transition-all hover:-translate-y-0.5 duration-300 bg-white overflow-hidden ${styles[color] || ""}`}>
      {/* Vạch màu chỉ thị hiện đại ở cạnh trái */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${borderAccents[color] || "bg-slate-300"}`} />

      <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 pl-1">
        {title}
      </p>
      <p className="text-xl font-black text-slate-900 tracking-tight pl-1">
        {value}
      </p>
    </div>
  );
}

// Component liên kết thao tác nhanh
function QuickAction({ title, desc, to, icon }) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-slate-200/65 p-6 transition-all hover:border-indigo-500/35 hover:shadow-lg hover:shadow-indigo-500/5 flex flex-col group h-full bg-white shadow-sm"
    >
      <span className="text-2xl mb-4 p-2 bg-slate-50 rounded-xl w-fit group-hover:bg-indigo-50 transition-colors duration-250">{icon}</span>
      <p className="font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
        {title}
      </p>
      <p className="mt-2 text-xs text-slate-500 leading-relaxed font-medium">
        {desc}
      </p>
    </Link>
  );
}

// Component dòng trạng thái IoT
function StatusRow({ label, status, isError }) {
  return (
    <div className={`flex items-center justify-between rounded-xl p-3.5 border hover:bg-slate-50/85 transition-colors duration-200 ${isError ? "bg-rose-50/40 border-rose-100" : "bg-slate-50/40 border-slate-100"}`}>
      <span className="text-xs font-bold text-slate-600">
        {label}
      </span>
      <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${isError ? "text-rose-700 bg-rose-50 border-rose-100/50" : "text-emerald-700 bg-emerald-50 border-emerald-100/50"}`}>
        <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${isError ? "bg-rose-500" : "bg-emerald-500"}`} />
        {status}
      </span>
    </div>
  );
}