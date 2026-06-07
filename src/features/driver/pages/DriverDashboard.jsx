import { Link } from "react-router-dom";
import Badge from "../../../shared/components/Badge";
import CapacityBar from "../../../shared/components/CapacityBar";
import Panel from "../../../shared/components/Panel";
import StatCard from "../../../shared/components/StatCard";
import { getAnalytics, getFloorUsage, getReservations, getPasses, formatVnd } from "../../../shared/services/smartParkingStore";
import DriverShell from "../DriverShell";

export default function DriverDashboard({ onLogout }) {
  const analytics = getAnalytics();
  const reservations = getReservations().filter((item) => item.status === "CONFIRMED");
  const passes = getPasses().filter((item) => item.status === "ACTIVE");
  const recommendedFloor = analytics.floors
    .map((floor) => ({ ...floor, usage: getFloorUsage(floor) }))
    .sort((a, b) => b.usage.available - a.usage.available)[0];

  return (
    <DriverShell title="Driver Dashboard" subtitle="Đặt chỗ, mua gói thành viên và theo dõi xe của bạn" onLogout={onLogout}>
      <div className="space-y-6">
        <div className="overflow-hidden rounded-2rem bg-[#001e40] p-6 text-white shadow-lg">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
            <div>
              <Badge variant="primary" className="bg-white/10 text-white ring-white/20">SmartParking Driver</Badge>
              <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">Chào Quảng, đặt chỗ nhanh và vào bãi bằng QR.</h1>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/driver/reservation" className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#001e40]">Đặt chỗ ngay</Link>
                <Link to="/driver/pass" className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white ring-1 ring-white/20">Mua gói thành viên</Link>
              </div>
            </div>
            <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-100">Gợi ý tầng</p>
              <h3 className="mt-3 text-3xl font-black">{recommendedFloor?.name}</h3>
              <p className="mt-2 text-sm font-semibold text-blue-100">{recommendedFloor?.title}</p>
              <div className="mt-5 rounded-2xl bg-white p-4 text-slate-950">
                <CapacityBar used={recommendedFloor?.usage.used} label="Độ đầy" />
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-black">
                  <div><p className="text-slate-400">Tổng</p><p>{recommendedFloor?.usage.capacity}</p></div>
                  <div><p className="text-slate-400">Đã chiếm</p><p>{recommendedFloor?.usage.occupied}</p></div>
                  <div><p className="text-slate-400">Còn</p><p>{recommendedFloor?.usage.available}</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon="▦" label="Slot còn trống" value={analytics.totalAvailable} hint={`Tổng ${analytics.totalCapacity} slot`} />
          <StatCard icon="◇" label="Đặt chỗ active" value={reservations.length} hint="Có QR xác nhận" />
          <StatCard icon="★" label="Gói đang dùng" value={passes.length} hint="Tháng / quý / năm" />
          <StatCard icon="₫" label="Đã thanh toán" value={formatVnd(analytics.totalRevenue)} hint="Dữ liệu demo local" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Panel title="Tình trạng tầng">
            <div className="grid gap-4 md:grid-cols-2">
              {analytics.floors.map((floor) => {
                const usage = getFloorUsage(floor);
                return (
                  <div key={floor.id} className="rounded-3xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-slate-950">{floor.name}</h3>
                        <p className="text-sm font-semibold text-slate-500">{floor.title}</p>
                      </div>
                      <Badge variant={usage.used >= 75 ? "warning" : "active"}>{floor.status}</Badge>
                    </div>
                    <div className="mt-4"><CapacityBar used={usage.used} /></div>
                    <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs font-black text-slate-600">
                      <div className="rounded-2xl bg-slate-50 p-2"><p>Tổng</p><p className="text-slate-950">{usage.capacity}</p></div>
                      <div className="rounded-2xl bg-slate-50 p-2"><p>Đã chiếm</p><p className="text-slate-950">{usage.occupied}</p></div>
                      <div className="rounded-2xl bg-slate-50 p-2"><p>Đã đặt</p><p className="text-slate-950">{usage.reserved}</p></div>
                      <div className="rounded-2xl bg-slate-50 p-2"><p>Còn</p><p className="text-slate-950">{usage.available}</p></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Thao tác nhanh" subtitle="Những chức năng Driver thường dùng nhất">
            <div className="space-y-3">
              {[
                ["Đặt chỗ trước", "Chọn tầng, khu A/B/C/D và nhận QR", "/driver/reservation"],
                ["Mua gói thành viên", "Gói tháng, quý, năm cho xe của bạn", "/driver/pass"],
                ["Thanh toán", "Tạo QR thanh toán / xác nhận ra bãi", "/driver/payment"],
                ["Xem lịch sử", "Tra cứu các lần gửi xe", "/driver/history"],
              ].map(([title, desc, to]) => (
                <Link key={to} to={to} className="block rounded-3xl border border-slate-200 p-4 transition hover:border-[#001e40] hover:bg-[#eaf2ff]">
                  <p className="font-black text-slate-950">{title}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{desc}</p>
                </Link>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </DriverShell>
  );
}
