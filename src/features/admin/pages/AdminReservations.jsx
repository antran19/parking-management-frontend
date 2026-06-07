import { useState } from "react";
import Badge from "../../../shared/components/Badge";
import Panel from "../../../shared/components/Panel";
import QrDisplay from "../../../shared/components/QrDisplay";
import { cancelReservation, getReservations, getPasses, getVehicleTypeLabel } from "../../../shared/services/smartParkingStore";
import AdminShell from "../AdminShell";

export default function AdminReservations({ onLogout }) {
  const [reservations,setReservations]=useState(getReservations());
  const passes=getPasses();
  const [qr,setQr]=useState(null);
  function cancel(id){cancelReservation(id);setReservations(getReservations());}
  return <AdminShell title="Đặt chỗ & QR" subtitle="Admin theo dõi QR đặt chỗ và QR vé thành viên" onLogout={onLogout}>
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]"><Panel title="Danh sách đặt chỗ"><div className="space-y-3">{reservations.map(r=><div key={r.id} className="rounded-3xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black text-slate-950">{r.licensePlate}</h3><p className="text-sm font-semibold text-slate-500">{getVehicleTypeLabel(r.vehicleType)} • {r.floorId} / Khu {r.zone}</p></div><Badge variant={r.status==='CONFIRMED'?'active':'danger'}>{r.status}</Badge></div><p className="mt-3 font-mono text-xs font-black text-[#001e40]">{r.qrCode}</p><div className="mt-3 flex gap-2"><button onClick={()=>setQr({title:'QR đặt chỗ',code:r.qrCode,desc:`${r.licensePlate} • ${r.floorId} / ${r.zone}`})} className="rounded-xl border px-3 py-2 text-xs font-black">Xem QR</button>{r.status==='CONFIRMED'&&<button onClick={()=>cancel(r.id)} className="rounded-xl border px-3 py-2 text-xs font-black hover:text-rose-600">Hủy</button>}</div></div>)}</div></Panel><div className="space-y-6">{qr?<QrDisplay title={qr.title} value={qr.code} description={qr.desc}/>:<div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center font-black">Chọn một QR để xem</div>}<Panel title="QR vé thành viên"><div className="space-y-3">{passes.map(p=><button key={p.id} onClick={()=>setQr({title:'QR vé thành viên',code:p.qrCode,desc:`${p.licensePlate} • ${p.planName}`})} className="block w-full rounded-2xl border border-slate-200 p-3 text-left text-sm font-black hover:bg-slate-50">{p.licensePlate} • {p.planName}</button>)}</div></Panel></div></div>
  </AdminShell>;
}
