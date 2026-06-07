// src/pages/admin/AdminDashboard.jsx

import { Link } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminStatCard from "../../components/admin/AdminStatCard";
import CapacityBar from "../../components/CapacityBar";
import { getFloorAvailable, getFloorPercent } from "../../data/parkingData";
import {
  formatAdminDateTime,
  getAdminAuditLogs,
  getAdminEmployees,
  getAdminParkingFloors,
  getEmployeeSummary,
  roleCatalog,
} from "../../services/adminStorage";

export default function AdminDashboard({ onLogout }) {
  const employees = getAdminEmployees();
  const employeeSummary = getEmployeeSummary(employees);
  const floors = getAdminParkingFloors();
  const parkingSummary = floors.reduce(
    (summary, floor) => {
      summary.capacity += Number(floor.capacity || 0);
      summary.occupied += Number(floor.occupied || 0);
      summary.reserved += Number(floor.reserved || 0);
      return summary;
    },
    { capacity: 0, occupied: 0, reserved: 0 }
  );
  parkingSummary.available = parkingSummary.capacity - parkingSummary.occupied - parkingSummary.reserved;
  const auditLogs = getAdminAuditLogs();

  const activeFloors = floors.filter((floor) => getFloorPercent(floor) >= 70);

  return (
    <AdminLayout
      title="Admin Dashboard"
      description="Tổng quan vận hành, nhân viên, phân quyền và capacity của hệ thống SmartParking."
      eyebrow="SmartParking v2"
      onLogout={onLogout}
      actions={
        <Link
          to="/admin/employees"
          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800"
        >
          + Quản lý nhân viên
        </Link>
      }
    >
      <section className="overflow-hidden rounded-2rem bg-slate-950 shadow-sm">
        <div className="grid gap-6 p-8 text-white xl:grid-cols-12 xl:p-10">
          <div className="xl:col-span-7">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-blue-300">
              Admin Control Center
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">
              Quản trị nhân viên, role và bãi xe trong một kiến trúc gọn hơn
            </h1>
            <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-slate-300">
              Phần “Thêm role / sửa role” đã được gom vào “Quản lý nhân viên”. Admin thêm nhân viên, sửa thông tin, đổi role và khóa tài khoản trong cùng một luồng.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/admin/employees"
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 hover:bg-slate-100"
              >
                Mở quản lý nhân viên
              </Link>
              <Link
                to="/admin/parking"
                className="rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white hover:bg-white/10"
              >
                Cấu hình bãi xe
              </Link>
            </div>
          </div>

          <div className="grid gap-3 xl:col-span-5">
            <HeroMini label="Tổng slot" value={parkingSummary.capacity} />
            <HeroMini label="Slot đã chiếm / đặt" value={parkingSummary.occupied + parkingSummary.reserved} />
            <HeroMini label="Slot chưa chiếm" value={parkingSummary.available} />
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Nhân viên nội bộ"
          value={employeeSummary.total}
          description="Admin, Manager, Staff và Security đang được quản lý."
          icon="👥"
          tone="slate"
        />
        <AdminStatCard
          label="Tài khoản active"
          value={employeeSummary.active}
          description="Có thể đăng nhập và thao tác theo role được gán."
          icon="✅"
          tone="emerald"
        />
        <AdminStatCard
          label="Tổng capacity"
          value={parkingSummary.capacity}
          description="Tổng sức chứa của các tầng A1, A2, B1, B2, C1."
          icon="🅿️"
          tone="blue"
        />
        <AdminStatCard
          label="Tầng gần đầy"
          value={activeFloors.length}
          description="Các tầng có tỷ lệ sử dụng từ 70% trở lên."
          icon="⚠️"
          tone="amber"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-slate-950">Cấu trúc nhân sự theo role</h3>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Role không tách trang riêng nữa, được quản lý trực tiếp theo từng nhân viên.
                </p>
              </div>
              <Link
                to="/admin/employees"
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800"
              >
                Chỉnh role
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {roleCatalog.map((role) => {
                const count = employeeSummary.byRole[role.value] || 0;
                return (
                  <article key={role.value} className="rounded-3xl bg-slate-50 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                          {role.value}
                        </p>
                        <h4 className="mt-2 text-lg font-black text-slate-950">{role.label}</h4>
                        <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                          {role.description}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm">
                        <p className="text-2xl font-black text-slate-950">{count}</p>
                        <p className="text-[11px] font-black uppercase text-slate-400">người</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>

        <div className="xl:col-span-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-slate-950">Capacity theo tầng</h3>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Theo mô hình 5 tầng: A1, A2, B1, B2, C1.
                </p>
              </div>
              <Link to="/admin/parking" className="text-sm font-black text-blue-600 hover:underline">
                Sửa
              </Link>
            </div>

            <div className="space-y-4">
              {floors.map((floor) => {
                const used = floor.occupied + floor.reserved;
                const percent = getFloorPercent(floor);
                const available = getFloorAvailable(floor);

                return (
                  <div key={floor.id} className="rounded-3xl border border-slate-200 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{floor.icon}</span>
                        <div>
                          <p className="font-black text-slate-950">{floor.label}</p>
                          <p className="text-xs font-semibold text-slate-500">{floor.vehicleLabel}</p>
                        </div>
                      </div>
                      <p className="text-sm font-black text-slate-700">
                        {available}/{floor.capacity} trống
                      </p>
                    </div>
                    <CapacityBar percent={percent} />
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-black">
                      <span className="rounded-xl bg-slate-50 py-2 text-slate-500">Tổng {floor.capacity}</span>
                      <span className="rounded-xl bg-red-50 py-2 text-red-600">Chiếm {used}</span>
                      <span className="rounded-xl bg-emerald-50 py-2 text-emerald-600">Trống {available}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-2xl font-black text-slate-950">Hoạt động quản trị gần đây</h3>
            <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-4">Hoạt động</th>
                    <th className="px-5 py-4">Người thực hiện</th>
                    <th className="px-5 py-4">Thời gian</th>
                    <th className="px-5 py-4">Loại</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.slice(0, 6).map((log) => (
                    <tr key={log.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-5 py-4 font-bold text-slate-800">{log.title}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-500">{log.actor}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-500">{formatAdminDateTime(log.time)}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                          {log.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="xl:col-span-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-2xl font-black text-slate-950">Chức năng Admin tiếp theo</h3>
            <div className="mt-5 space-y-3">
              <QuickAction to="/admin/employees" label="Quản lý nhân viên + role" description="Thêm, sửa, khóa, đổi quyền" />
              <QuickAction to="/admin/parking" label="Quản lý tầng / capacity" description="Xem và chỉnh A1, A2, B1, B2, C1" />
              <QuickAction to="/admin/employees" label="Kiểm tra role Staff" description="Đảm bảo Staff có quyền quét QR" />
            </div>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}

function HeroMini({ label, value }) {
  return (
    <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-300">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function QuickAction({ to, label, description }) {
  return (
    <Link
      to={to}
      className="block rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:border-slate-950 hover:bg-slate-950 hover:text-white"
    >
      <p className="font-black">{label}</p>
      <p className="mt-1 text-sm font-medium opacity-70">{description}</p>
    </Link>
  );
}
