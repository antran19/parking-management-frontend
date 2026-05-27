import { useState } from "react";
import Panel from "../../../shared/components/Panel";
import AdminShell from "../AdminShell";

export default function AdminSystemSettingPage({ onLogout }) {
  const [settings,setSettings]=useState({systemName:'SmartParking', qrConfirm:true, notifyFull:true, allowDriverBooking:true, defaultTheme:'Navy Unified'});
  return <AdminShell title="Cài đặt hệ thống" subtitle="Cấu hình giao diện, QR và quy tắc vận hành" onLogout={onLogout}>
    <div className="grid gap-6 xl:grid-cols-2"><Panel title="Thông tin hệ thống"><div className="space-y-4"><label className="space-y-2 block"><span className="text-sm font-black">Tên hệ thống</span><input className="input-pro" value={settings.systemName} onChange={(e)=>setSettings({...settings,systemName:e.target.value})}/></label><label className="space-y-2 block"><span className="text-sm font-black">Theme</span><input className="input-pro" value={settings.defaultTheme} onChange={(e)=>setSettings({...settings,defaultTheme:e.target.value})}/></label><button className="rounded-2xl bg-[#001e40] px-5 py-3 text-sm font-black text-white">Lưu cài đặt</button></div></Panel><Panel title="Quy tắc vận hành"><Toggle label="Bắt buộc xác nhận QR" checked={settings.qrConfirm} onChange={()=>setSettings({...settings,qrConfirm:!settings.qrConfirm})}/><Toggle label="Thông báo khi tầng gần đầy" checked={settings.notifyFull} onChange={()=>setSettings({...settings,notifyFull:!settings.notifyFull})}/><Toggle label="Cho Driver đặt chỗ trước" checked={settings.allowDriverBooking} onChange={()=>setSettings({...settings,allowDriverBooking:!settings.allowDriverBooking})}/></Panel></div>
  </AdminShell>;
}
function Toggle({label,checked,onChange}){return <button onClick={onChange} className="mb-3 flex w-full items-center justify-between rounded-3xl border border-slate-200 p-4 text-left"><span className="font-black text-slate-700">{label}</span><span className={`rounded-full px-3 py-1 text-xs font-black ${checked?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-500'}`}>{checked?'BẬT':'TẮT'}</span></button>}
