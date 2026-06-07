// src/pages/admin/AdminEmployees.jsx

import { useMemo, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminStatCard from "../../components/admin/AdminStatCard";
import RoleBadge from "../../components/admin/RoleBadge";
import StatusBadge from "../../components/admin/StatusBadge";
import {
  createAdminEmployee,
  deleteAdminEmployee,
  formatAdminDateTime,
  getAdminAuditLogs,
  getAdminEmployees,
  getEmployeeSummary,
  getRoleMeta,
  roleCatalog,
  toggleEmployeeStatus,
  updateAdminEmployee,
} from "../../services/adminStorage";

const blankForm = {
  fullName: "",
  email: "",
  phone: "",
  role: "STAFF",
  department: "Cổng chính",
  shift: "Ca sáng",
  status: "ACTIVE",
  note: "",
};

const statusOptions = [
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "LOCKED", label: "Đã khóa" },
  { value: "PENDING", label: "Chờ kích hoạt" },
];

export default function AdminEmployees({ onLogout }) {
  const [employees, setEmployees] = useState(() => getAdminEmployees());
  const [auditLogs, setAuditLogs] = useState(() => getAdminAuditLogs());
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(employees[0]?.id || null);
  const [message, setMessage] = useState("");

  const summary = useMemo(() => getEmployeeSummary(employees), [employees]);

  const filteredEmployees = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchKeyword =
        !keyword ||
        employee.fullName.toLowerCase().includes(keyword) ||
        employee.email.toLowerCase().includes(keyword) ||
        employee.phone.toLowerCase().includes(keyword) ||
        employee.department.toLowerCase().includes(keyword);

      const matchRole = roleFilter === "ALL" || employee.role === roleFilter;
      const matchStatus = statusFilter === "ALL" || employee.status === statusFilter;

      return matchKeyword && matchRole && matchStatus;
    });
  }, [employees, search, roleFilter, statusFilter]);

  const selectedEmployee =
    employees.find((employee) => employee.id === selectedEmployeeId) || filteredEmployees[0] || employees[0];

  const selectedRole = getRoleMeta(form.role);
  const detailRole = getRoleMeta(selectedEmployee?.role);

  const reloadAuditLogs = () => setAuditLogs(getAdminAuditLogs());

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(blankForm);
    setEditingId(null);
    setMessage("");
  };

  const handleEdit = (employee) => {
    setEditingId(employee.id);
    setSelectedEmployeeId(employee.id);
    setForm({
      fullName: employee.fullName,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      department: employee.department,
      shift: employee.shift,
      status: employee.status,
      note: employee.note || "",
    });
    setMessage(`Đang sửa nhân viên ${employee.fullName}. Bạn có thể đổi role ngay trong form này.`);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage("");

    if (!form.fullName.trim()) {
      setMessage("Vui lòng nhập họ tên nhân viên.");
      return;
    }

    if (!form.email.trim() || !form.email.includes("@")) {
      setMessage("Email không hợp lệ.");
      return;
    }

    if (editingId) {
      const nextEmployees = updateAdminEmployee(editingId, form);
      setEmployees(nextEmployees);
      setSelectedEmployeeId(editingId);
      setMessage("Đã cập nhật nhân viên và role trong cùng một màn hình.");
    } else {
      const nextEmployees = createAdminEmployee(form);
      setEmployees(nextEmployees);
      setSelectedEmployeeId(nextEmployees[0]?.id || null);
      setMessage("Đã thêm nhân viên mới và gán role thành công.");
    }

    reloadAuditLogs();
    setEditingId(null);
    setForm(blankForm);
  };

  const handleToggleStatus = (employee) => {
    const nextEmployees = toggleEmployeeStatus(employee.id);
    setEmployees(nextEmployees);
    setSelectedEmployeeId(employee.id);
    reloadAuditLogs();
  };

  const handleDelete = (employee) => {
    const confirmed = window.confirm(`Xóa nhân viên ${employee.fullName}?`);
    if (!confirmed) return;

    const nextEmployees = deleteAdminEmployee(employee.id);
    setEmployees(nextEmployees);
    setSelectedEmployeeId(nextEmployees[0]?.id || null);
    reloadAuditLogs();
  };

  return (
    <AdminLayout
      title="Quản lý nhân viên & phân quyền"
      description="Gộp quản lý tài khoản, thêm nhân viên, sửa thông tin, khóa tài khoản và đổi role vào một màn hình duy nhất."
      eyebrow="Admin / Employee Management"
      onLogout={onLogout}
      actions={
        <button
          type="button"
          onClick={resetForm}
          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800"
        >
          + Thêm nhân viên
        </button>
      }
    >
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Tổng nhân viên"
          value={summary.total}
          description="Bao gồm Admin, Manager, Staff và Security nội bộ."
          icon="👥"
          tone="slate"
        />
        <AdminStatCard
          label="Đang hoạt động"
          value={summary.active}
          description="Tài khoản có thể đăng nhập và thao tác hệ thống."
          icon="✅"
          tone="emerald"
        />
        <AdminStatCard
          label="Staff vận hành"
          value={summary.byRole.STAFF}
          description="Nhân viên check-in/check-out, xác nhận QR."
          icon="🎫"
          tone="blue"
        />
        <AdminStatCard
          label="Tài khoản bị khóa"
          value={summary.locked}
          description="Tài khoản tạm dừng quyền truy cập hệ thống."
          icon="🔒"
          tone="rose"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-950">Danh sách nhân viên</h3>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Thêm nhân viên, sửa role, khóa/mở khóa và xóa tài khoản tại đây.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3 xl:min-w-[660px]">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm tên, email, phòng ban..."
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
                />
                <select
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
                >
                  <option value="ALL">Tất cả role</option>
                  {roleCatalog.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-xs font-black uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-4">Nhân viên</th>
                    <th className="px-5 py-4">Role</th>
                    <th className="px-5 py-4">Phòng ban / Ca</th>
                    <th className="px-5 py-4">Trạng thái</th>
                    <th className="px-5 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      onClick={() => setSelectedEmployeeId(employee.id)}
                      className={`cursor-pointer border-t border-slate-100 transition hover:bg-slate-50 ${
                        selectedEmployee?.id === employee.id ? "bg-blue-50/60" : "bg-white"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                            {employee.fullName
                              .split(" ")
                              .slice(-2)
                              .map((part) => part[0])
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-slate-950">{employee.fullName}</p>
                            <p className="text-sm font-medium text-slate-500">{employee.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <RoleBadge role={employee.role} />
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-700">{employee.department}</p>
                        <p className="text-sm text-slate-500">{employee.shift}</p>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={employee.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEdit(employee);
                          }}
                          className="rounded-xl px-3 py-2 text-sm font-black text-blue-600 hover:bg-blue-50"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleToggleStatus(employee);
                          }}
                          className="rounded-xl px-3 py-2 text-sm font-black text-amber-600 hover:bg-amber-50"
                        >
                          {employee.status === "ACTIVE" ? "Khóa" : "Mở"}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDelete(employee);
                          }}
                          className="rounded-xl px-3 py-2 text-sm font-black text-red-600 hover:bg-red-50"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredEmployees.length === 0 && (
                <div className="p-10 text-center font-bold text-slate-500">
                  Không tìm thấy nhân viên phù hợp bộ lọc.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-black text-slate-950">Ma trận quyền theo role</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Không cần tách trang “Quản lý vai trò” riêng. Admin đổi role trực tiếp ở form, còn quyền của role được hiển thị tại đây.
            </p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {roleCatalog.map((role) => (
                <article key={role.value} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <RoleBadge role={role.value} />
                      <h4 className="mt-3 text-lg font-black text-slate-950">{role.label}</h4>
                      <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                        {role.description}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500">
                      {role.group}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {role.permissions.map((permission) => (
                      <span
                        key={permission}
                        className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-600"
                      >
                        ✓ {permission}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6 xl:col-span-4">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-slate-950">
                  {editingId ? "Sửa nhân viên" : "Thêm nhân viên"}
                </h3>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Role được gán cùng lúc khi thêm hoặc sửa nhân viên.
                </p>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-200"
                >
                  Hủy sửa
                </button>
              )}
            </div>

            <div className="mt-6 space-y-4">
              <Field label="Họ tên">
                <input
                  value={form.fullName}
                  onChange={(event) => updateForm("fullName", event.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="input-admin"
                />
              </Field>

              <Field label="Email đăng nhập">
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateForm("email", event.target.value)}
                  placeholder="staff@smartparking.local"
                  className="input-admin"
                />
              </Field>

              <Field label="Số điện thoại">
                <input
                  value={form.phone}
                  onChange={(event) => updateForm("phone", event.target.value)}
                  placeholder="0900 000 000"
                  className="input-admin"
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Role / Quyền">
                  <select
                    value={form.role}
                    onChange={(event) => updateForm("role", event.target.value)}
                    className="input-admin"
                  >
                    {roleCatalog.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Trạng thái">
                  <select
                    value={form.status}
                    onChange={(event) => updateForm("status", event.target.value)}
                    className="input-admin"
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Phòng ban / vị trí">
                  <input
                    value={form.department}
                    onChange={(event) => updateForm("department", event.target.value)}
                    placeholder="Cổng chính"
                    className="input-admin"
                  />
                </Field>

                <Field label="Ca làm">
                  <select
                    value={form.shift}
                    onChange={(event) => updateForm("shift", event.target.value)}
                    className="input-admin"
                  >
                    <option>Ca sáng</option>
                    <option>Ca chiều</option>
                    <option>Ca đêm</option>
                    <option>Giờ hành chính</option>
                  </select>
                </Field>
              </div>

              <Field label="Ghi chú">
                <textarea
                  value={form.note}
                  onChange={(event) => updateForm("note", event.target.value)}
                  placeholder="Ghi chú nội bộ cho admin"
                  rows={3}
                  className="input-admin resize-none"
                />
              </Field>
            </div>

            <div className="mt-5 rounded-3xl bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">Quyền của role đang chọn</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{selectedRole.description}</p>
                </div>
                <RoleBadge role={selectedRole.value} />
              </div>
              <div className="mt-4 space-y-2">
                {selectedRole.permissions.map((permission) => (
                  <p key={permission} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-600">
                    ✓ {permission}
                  </p>
                ))}
              </div>
            </div>

            {message && (
              <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm font-bold text-blue-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="mt-5 w-full rounded-2xl bg-slate-950 py-4 text-base font-black text-white shadow-sm hover:bg-slate-800"
            >
              {editingId ? "Lưu thay đổi" : "Thêm nhân viên và gán role"}
            </button>
          </form>

          {selectedEmployee && (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-black text-slate-950">Chi tiết nhanh</h3>
              <div className="mt-5 flex items-center gap-4 rounded-3xl bg-slate-50 p-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-lg font-black text-white">
                  {selectedEmployee.fullName
                    .split(" ")
                    .slice(-2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-black text-slate-950">{selectedEmployee.fullName}</p>
                  <p className="text-sm font-medium text-slate-500">{selectedEmployee.email}</p>
                  <div className="mt-2 flex gap-2">
                    <RoleBadge role={selectedEmployee.role} />
                    <StatusBadge status={selectedEmployee.status} />
                  </div>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                <Info label="SĐT" value={selectedEmployee.phone} />
                <Info label="Phòng ban" value={selectedEmployee.department} />
                <Info label="Ca làm" value={selectedEmployee.shift} />
                <Info label="Đăng nhập cuối" value={formatAdminDateTime(selectedEmployee.lastLogin)} />
                <Info label="Ghi chú" value={selectedEmployee.note || "Không có"} />
              </div>
              <div className="mt-5 rounded-3xl bg-slate-50 p-5">
                <p className="text-sm font-black text-slate-950">Nhóm quyền hiện tại</p>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">{detailRole.description}</p>
              </div>
            </section>
          )}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-black text-slate-950">Nhật ký Admin</h3>
            <div className="mt-5 space-y-3">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-800">{log.title}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {formatAdminDateTime(log.time)} · {log.actor}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>
    </AdminLayout>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
      <span className="text-sm font-bold text-slate-500">{label}</span>
      <span className="max-w-[220px] text-right text-sm font-black text-slate-800">{value}</span>
    </div>
  );
}
