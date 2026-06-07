import { useMemo, useState } from "react";
import Badge from "../../../shared/components/Badge";
import Panel from "../../../shared/components/Panel";
import { PERMISSIONS, ROLE_LABELS } from "../../../shared/data/smartParkingSeed";
import { getEmployees, saveEmployees, uid, normalizeText, addActivity } from "../../../shared/services/smartParkingStore";
import AdminShell from "../AdminShell";

const emptyForm = { fullName: "", email: "", phone: "", role: "STAFF", department: "Bãi xe", shift: "Ca sáng", status: "ACTIVE" };

export default function AdminEmployees({ onLogout }) {
  const [employees, setEmployees] = useState(getEmployees());
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ keyword: "", role: "ALL", status: "ALL" });

  const filtered = useMemo(() => employees.filter((item) => {
    const keyword = normalizeText(`${item.fullName} ${item.email} ${item.phone} ${item.role}`);
    const okKeyword = !filters.keyword || keyword.includes(normalizeText(filters.keyword));
    const okRole = filters.role === "ALL" || item.role === filters.role;
    const okStatus = filters.status === "ALL" || item.status === filters.status;
    return okKeyword && okRole && okStatus;
  }), [employees, filters]);

  function submit(event) {
    event.preventDefault();
    let next;
    if (editingId) {
      next = employees.map((item) => item.id === editingId ? { ...item, ...form } : item);
      addActivity(`Admin sửa nhân viên ${form.fullName}`);
    } else {
      next = [{ id: uid("EMP"), ...form, createdAt: new Date().toISOString().slice(0, 10) }, ...employees];
      addActivity(`Admin thêm nhân viên ${form.fullName}`);
    }
    saveEmployees(next);
    setEmployees(next);
    setForm(emptyForm);
    setEditingId(null);
  }

  function edit(item) {
    setEditingId(item.id);
    setForm({ fullName: item.fullName, email: item.email, phone: item.phone, role: item.role, department: item.department, shift: item.shift, status: item.status });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleLock(id) {
    const next = employees.map((item) => item.id === id ? { ...item, status: item.status === "ACTIVE" ? "LOCKED" : "ACTIVE" } : item);
    saveEmployees(next);
    setEmployees(next);
  }

  function remove(id) {
    const next = employees.filter((item) => item.id !== id);
    saveEmployees(next);
    setEmployees(next);
  }

  return (
    <AdminShell title="Nhân viên & phân quyền" onLogout={onLogout}>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title={editingId ? "Sửa nhân viên" : "Thêm nhân viên"}>
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <Field label="Họ tên"><input className="input-pro" value={form.fullName} onChange={(e)=>setForm({...form, fullName:e.target.value})} required /></Field>
            <Field label="Email"><input type="email" className="input-pro" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} required /></Field>
            <Field label="Số điện thoại"><input className="input-pro" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} /></Field>
            <Field label="Role"><select className="input-pro" value={form.role} onChange={(e)=>setForm({...form, role:e.target.value})}>{["ADMIN","MANAGER","STAFF","SECURITY"].map((role)=><option key={role} value={role}>{ROLE_LABELS[role]}</option>)}</select></Field>
            <Field label="Bộ phận"><input className="input-pro" value={form.department} onChange={(e)=>setForm({...form, department:e.target.value})} /></Field>
            <Field label="Ca làm"><select className="input-pro" value={form.shift} onChange={(e)=>setForm({...form, shift:e.target.value})}><option>Full-time</option><option>Ca sáng</option><option>Ca chiều</option><option>Ca đêm</option></select></Field>
            <Field label="Trạng thái"><select className="input-pro" value={form.status} onChange={(e)=>setForm({...form, status:e.target.value})}><option value="ACTIVE">Đang hoạt động</option><option value="LOCKED">Đã khóa</option></select></Field>
            <div className="flex items-end gap-2"><button className="flex-1 rounded-2xl bg-[#001e40] px-5 py-4 text-sm font-black text-white">{editingId ? "Lưu thay đổi" : "Thêm nhân viên"}</button>{editingId && <button type="button" onClick={()=>{setEditingId(null);setForm(emptyForm)}} className="rounded-2xl border border-slate-200 px-4 py-4 text-sm font-black">Hủy</button>}</div>
          </form>
        </Panel>

        <Panel title="Ma trận quyền">
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(PERMISSIONS).filter(([role]) => role !== "DRIVER").map(([role, items]) => <div key={role} className="rounded-3xl border border-slate-200 p-4"><Badge variant="primary">{ROLE_LABELS[role]}</Badge><ul className="mt-4 space-y-2 text-sm font-semibold text-slate-600">{items.map((item)=><li key={item} className="flex gap-2"><span>✓</span>{item}</li>)}</ul></div>)}
          </div>
        </Panel>
      </div>

      <Panel title="Danh sách nhân viên" subtitle="Tìm kiếm, lọc role, khóa/mở khóa, sửa/xóa" className="mt-6">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <input className="input-pro" placeholder="Tìm tên, email, role..." value={filters.keyword} onChange={(e)=>setFilters({...filters, keyword:e.target.value})}/>
          <select className="input-pro" value={filters.role} onChange={(e)=>setFilters({...filters, role:e.target.value})}><option value="ALL">Tất cả role</option>{["ADMIN","MANAGER","STAFF","SECURITY"].map((role)=><option key={role} value={role}>{role}</option>)}</select>
          <select className="input-pro" value={filters.status} onChange={(e)=>setFilters({...filters, status:e.target.value})}><option value="ALL">Tất cả trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="LOCKED">Đã khóa</option></select>
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-200">
          <table className="w-full min-w-980px text-left text-sm"><thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.16em] text-slate-500"><tr><th className="p-4">Nhân viên</th><th>Liên hệ</th><th>Role</th><th>Bộ phận</th><th>Ca</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100 bg-white">{filtered.map((item)=><tr key={item.id} className="font-semibold text-slate-600"><td className="p-4"><p className="font-black text-slate-950">{item.fullName}</p><p className="text-xs text-slate-400">{item.id}</p></td><td><p>{item.email}</p><p className="text-xs text-slate-400">{item.phone}</p></td><td><Badge variant="primary">{ROLE_LABELS[item.role]}</Badge></td><td>{item.department}</td><td>{item.shift}</td><td><Badge variant={item.status === "ACTIVE" ? "active" : "danger"}>{item.status === "ACTIVE" ? "Hoạt động" : "Đã khóa"}</Badge></td><td><div className="flex gap-2"><button onClick={()=>edit(item)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black hover:bg-slate-50">Sửa</button><button onClick={()=>toggleLock(item.id)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black hover:bg-amber-50">{item.status === "ACTIVE" ? "Khóa" : "Mở"}</button><button onClick={()=>remove(item.id)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black hover:bg-rose-50 hover:text-rose-600">Xóa</button></div></td></tr>)}</tbody></table>
        </div>
      </Panel>
    </AdminShell>
  );
}
function Field({ label, children }) { return <label className="space-y-2"><span className="text-sm font-black text-slate-700">{label}</span>{children}</label>; }
