import { useState } from "react";
import Badge from "../../../shared/components/Badge";
import Panel from "../../../shared/components/Panel";
import { formatVnd, getMembershipPlans, saveMembershipPlans } from "../../../shared/services/smartParkingStore";
import AdminShell from "../AdminShell";

export default function AdminPackages({ onLogout }) {
  const [plans, setPlans] = useState(getMembershipPlans());
  function update(id, field, value){ const next=plans.map(p=>p.id===id?{...p,[field]:field==='price'||field==='months'?Number(value):value}:p); saveMembershipPlans(next); setPlans(next); }
  return <AdminShell title="Gói & bảng giá"  onLogout={onLogout}>
    <div className="grid gap-6 md:grid-cols-3">{plans.map(plan=><Panel key={plan.id} title={plan.name} subtitle={plan.durationLabel}>{plan.popular&&<Badge variant="dark">Phổ biến</Badge>}<div className="mt-4 space-y-4"><label className="space-y-2 block"><span className="text-sm font-black">Tên gói</span><input className="input-pro" value={plan.name} onChange={(e)=>update(plan.id,'name',e.target.value)}/></label><label className="space-y-2 block"><span className="text-sm font-black">Số tháng</span><input type="number" className="input-pro" value={plan.months} onChange={(e)=>update(plan.id,'months',e.target.value)}/></label><label className="space-y-2 block"><span className="text-sm font-black">Giá</span><input type="number" className="input-pro" value={plan.price} onChange={(e)=>update(plan.id,'price',e.target.value)}/></label><p className="rounded-2xl bg-[#eaf2ff] p-4 text-xl font-black text-[#001e40]">{formatVnd(plan.price)}</p><ul className="space-y-2 text-sm font-semibold text-slate-600">{plan.benefits.map(b=><li key={b}>✓ {b}</li>)}</ul></div></Panel>)}</div>
  </AdminShell>;
}
