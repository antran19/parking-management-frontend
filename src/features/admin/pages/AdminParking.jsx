import { useState } from "react";
import Badge from "../../../shared/components/Badge";
import CapacityBar from "../../../shared/components/CapacityBar";
import Panel from "../../../shared/components/Panel";
import { getFloors, getFloorUsage, updateFloorCapacity, resetDemoData } from "../../../shared/services/smartParkingStore";
import AdminShell from "../AdminShell";

export default function AdminParking({ onLogout }) {
  const [floors, setFloors] = useState(getFloors());
  function change(id, field, value) { setFloors(updateFloorCapacity(id, { [field]: Number(value) })); }
  function reset(){ resetDemoData(); setFloors(getFloors()); }
  return <AdminShell title="Quản lý tầng & khu" onLogout={onLogout} actions={<button onClick={reset} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black">Reset demo</button>}>
    <div className="grid gap-6 xl:grid-cols-2">
      {floors.map((floor)=>{ const usage=getFloorUsage(floor); return <Panel key={floor.id} title={`${floor.name} • ${floor.title}`} subtitle={floor.note}>
        <div className="space-y-4"><div className="flex items-center justify-between"><Badge variant={usage.used>=80?'warning':'active'}>{floor.status}</Badge><span className="text-sm font-black text-slate-500">Gate: {floor.gate}</span></div><CapacityBar used={usage.used}/><div className="grid grid-cols-4 gap-2 text-center"><Stat label="Tổng" value={usage.capacity}/><Stat label="Đã chiếm" value={usage.occupied}/><Stat label="Đã đặt" value={usage.reserved}/><Stat label="Còn" value={usage.available}/></div><div className="grid gap-3 md:grid-cols-3"><label className="space-y-2"><span className="text-xs font-black text-slate-500">Capacity</span><input type="number" className="input-pro" value={floor.capacity} onChange={(e)=>change(floor.id,'capacity',e.target.value)}/></label><label className="space-y-2"><span className="text-xs font-black text-slate-500">Đã chiếm</span><input type="number" className="input-pro" value={floor.occupied} onChange={(e)=>change(floor.id,'occupied',e.target.value)}/></label><label className="space-y-2"><span className="text-xs font-black text-slate-500">Đã đặt</span><input type="number" className="input-pro" value={floor.reserved} onChange={(e)=>change(floor.id,'reserved',e.target.value)}/></label></div><div className="grid grid-cols-4 gap-3">{floor.zones.map((zone)=><div key={zone} className="rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 text-center text-2xl font-black text-[#001e40]">{zone}</div>)}</div></div>
      </Panel>})}
    </div>
  </AdminShell>
}
function Stat({label,value}){return <div className="rounded-3xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p></div>}
