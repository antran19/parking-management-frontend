import { Link } from "react-router-dom";
import Badge from "../../../shared/components/Badge";
import CapacityBar from "../../../shared/components/CapacityBar";
import Panel from "../../../shared/components/Panel";
import StatCard from "../../../shared/components/StatCard";
import { formatVnd, getActivity, getAnalytics, getFloorUsage } from "../../../shared/services/smartParkingStore";
import AdminShell from "../AdminShell";

export default function AdminDashboard({ onLogout }) {
  const analytics = getAnalytics();
  const activity = getActivity();
  const roleSummary = analytics.employees.reduce((acc, item) => ({ ...acc, [item.role]: (acc[item.role] || 0) + 1 }), {});
  return (
    <AdminShell title="Admin Dashboard"  onLogout={onLogout}>
      <div className="space-y-6">
        <div className="rounded-2rem bg-[#001e40] p-6 text-white shadow-lg">
          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
            <div>
              <Badge variant="primary" className="bg-white/10 text-white ring-white/20">SmartParking Admin</Badge>
              <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-tight md:text-5xl">Quản trị nhân viên, tài xế, tầng/khu và doanh thu trong một nơi.</h1> 
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/admin/employees" className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-[#001e40]">Quản lý nhân viên</Link>
                <Link to="/admin/parking" className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white ring-1 ring-white/20">Quản lý tầng/khu</Link>
              </div>
            </div>
            <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-100">Tổng quan bãi xe</p>
              <div className="mt-4 rounded-2xl bg-white p-4 text-slate-950">
                <CapacityBar used={Math.round(((analytics.totalOccupied + analytics.totalReserved) / Math.max(analytics.totalCapacity, 1)) * 100)} label="Mức sử dụng toàn hệ thống" />
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-black">
                  <div><p className="text-slate-400">Tổng</p><p>{analytics.totalCapacity}</p></div>
                  <div><p className="text-slate-400">Đã dùng</p><p>{analytics.totalOccupied + analytics.totalReserved}</p></div>
                  <div><p className="text-slate-400">Còn</p><p>{analytics.totalAvailable}</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon="◎" label="Nhân viên" value={analytics.employees.length} hint="Admin / Manager / Staff / Security" />
          <StatCard icon="◉" label="Tài xế" value={analytics.drivers.length} hint="Tài khoản khách hàng" />
          <StatCard icon="▦" label="Slot còn lại" value={analytics.totalAvailable} hint={`${analytics.totalCapacity} slot toàn hệ thống`} />
          <StatCard icon="₫" label="Doanh thu" value={formatVnd(analytics.totalRevenue)} hint="Payment + History demo" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel title="Tầng/khu cần theo dõi" subtitle="Admin xem capacity và tình trạng gần đầy">
            <div className="space-y-4">
              {analytics.floors.map((floor) => {
                const usage = getFloorUsage(floor);
                return <div key={floor.id} className="rounded-3xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-3"><div><h3 className="font-black text-slate-950">{floor.name} • {floor.title}</h3><p className="text-sm font-semibold text-slate-500">{floor.vehicleGroup}</p></div><Badge variant={usage.used >= 75 ? "warning" : "active"}>{usage.used}%</Badge></div><div className="mt-4"><CapacityBar used={usage.used} /></div></div>;
              })}
            </div>
          </Panel>

          <Panel title="Role trong hệ thống" subtitle="Tóm tắt số lượng từng quyền">
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries({ ADMIN: "Quản trị", MANAGER: "Quản lý", STAFF: "Nhân viên", SECURITY: "An ninh" }).map(([role, label]) => (
                <div key={role} className="rounded-3xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{role}</p><p className="mt-2 text-2xl font-black text-slate-950">{roleSummary[role] || 0}</p><p className="text-sm font-semibold text-slate-500">{label}</p></div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title="Nhật ký hoạt động">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">{activity.map((item, index) => <div key={`${item}-${index}`} className="rounded-3xl bg-slate-50 p-4 text-sm font-bold text-slate-600">{item}</div>)}</div>
        </Panel>
      </div>
    </AdminShell>
  );
}
