import { useMemo, useState } from "react";
import Badge from "../../../shared/components/Badge";
import Panel from "../../../shared/components/Panel";
import { VEHICLE_TYPES } from "../../../shared/data/smartParkingSeed";
import { getDrivers, saveDrivers, uid, normalizeText, getVehicleTypeLabel } from "../../../shared/services/smartParkingStore";
import AdminShell from "../AdminShell";

const empty = { fullName: "", phone: "", email: "", licensePlate: "", vehicleType: "MOTORBIKE", status: "ACTIVE", memberTier: "NONE" };
export default function AdminDrivers({ onLogout }) {
  const [drivers, setDrivers] = useState(getDrivers());
  const [form, setForm] = useState(empty);
  const [keyword, setKeyword] = useState("");
  const filtered = useMemo(() => drivers.filter((item) => normalizeText(`${item.fullName} ${item.phone} ${item.licensePlate}`).includes(normalizeText(keyword))), [drivers, keyword]);
  function submit(e){ e.preventDefault(); const next=[{id:uid("DRV"),...form,licensePlate:form.licensePlate.toUpperCase()},...drivers]; saveDrivers(next); setDrivers(next); setForm(empty); }
  function toggle(id){ const next=drivers.map((d)=>d.id===id?{...d,status:d.status==="ACTIVE"?"LOCKED":"ACTIVE"}:d); saveDrivers(next); setDrivers(next); }
  function remove(id){ const next=drivers.filter((d)=>d.id!==id); saveDrivers(next); setDrivers(next); }
  return <AdminShell title="Quản lý tài xế" subtitle="Admin quản lý tài khoản Driver, biển số, loại xe và gói thành viên" onLogout={onLogout}>
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Panel title="Thêm Driver"><form onSubmit={submit} className="grid gap-4 md:grid-cols-2"><input className="input-pro" placeholder="Họ tên" value={form.fullName} onChange={(e)=>setForm({...form,fullName:e.target.value})} required/><input className="input-pro" placeholder="Số điện thoại" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})}/><input className="input-pro" placeholder="Email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}/><input className="input-pro" placeholder="Biển số" value={form.licensePlate} onChange={(e)=>setForm({...form,licensePlate:e.target.value})} required/><select className="input-pro" value={form.vehicleType} onChange={(e)=>setForm({...form,vehicleType:e.target.value})}>{VEHICLE_TYPES.map((v)=><option key={v.id} value={v.id}>{v.label}</option>)}</select><select className="input-pro" value={form.memberTier} onChange={(e)=>setForm({...form,memberTier:e.target.value})}><option value="NONE">Chưa có gói</option><option value="MONTHLY">Gói tháng</option><option value="QUARTERLY">Gói quý</option><option value="YEARLY">Gói năm</option></select><button className="rounded-2xl bg-[#001e40] px-5 py-4 text-sm font-black text-white md:col-span-2">Thêm Driver</button></form></Panel>
      <Panel title="Vai trò Admin với Driver" subtitle="Theo dõi tài khoản khách hàng, khóa tài khoản vi phạm, kiểm tra gói"><div className="grid gap-3 md:grid-cols-2"><Info label="Driver active" value={drivers.filter(d=>d.status==='ACTIVE').length}/><Info label="Driver bị khóa" value={drivers.filter(d=>d.status==='LOCKED').length}/><Info label="Có gói thành viên" value={drivers.filter(d=>d.memberTier!=='NONE').length}/><Info label="Tổng tài xế" value={drivers.length}/></div></Panel>
    </div>
    <Panel title="Danh sách Driver" className="mt-6"><input className="input-pro mb-4 max-w-xl" placeholder="Tìm theo tên, SĐT, biển số" value={keyword} onChange={(e)=>setKeyword(e.target.value)}/><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((d)=><div key={d.id} className="rounded-3xl border border-slate-200 p-5"><div className="flex justify-between gap-3"><h3 className="font-black text-slate-950">{d.fullName}</h3><Badge variant={d.status==='ACTIVE'?'active':'danger'}>{d.status}</Badge></div><p className="mt-2 text-sm font-semibold text-slate-500">{d.licensePlate} • {getVehicleTypeLabel(d.vehicleType)}</p><p className="text-sm font-semibold text-slate-500">{d.phone} • {d.email}</p><p className="mt-3 font-black text-[#001e40]">{d.memberTier==='NONE'?'Chưa có gói':d.memberTier}</p><div className="mt-4 flex gap-2"><button onClick={()=>toggle(d.id)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black">{d.status==='ACTIVE'?'Khóa':'Mở'}</button><button onClick={()=>remove(d.id)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black hover:text-rose-600">Xóa</button></div></div>)}</div></Panel>
  </AdminShell>;
}
function Info({label,value}){return <div className="rounded-3xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p></div>}
