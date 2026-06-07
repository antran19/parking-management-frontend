import Panel from "../../../shared/components/Panel";
import StatCard from "../../../shared/components/StatCard";
import { formatVnd, getAnalytics } from "../../../shared/services/smartParkingStore";
import AdminShell from "../AdminShell";

export default function AdminFinance({ onLogout }) {
  const a=getAnalytics();
  const rows=[...a.payments.map(p=>({id:p.id,type:'Payment',plate:p.licensePlate,amount:p.amount,date:p.paidAt})),...a.history.map(h=>({id:h.id,type:'Session',plate:h.licensePlate,amount:h.amount,date:h.checkOut}))];
  const max=Math.max(...rows.map(r=>Number(r.amount)||0),1);
  return <AdminShell title="Thanh toán & doanh thu" subtitle="Admin theo dõi giao dịch, doanh thu gửi xe và thanh toán QR" onLogout={onLogout}>
    <div className="grid gap-4 md:grid-cols-3"><StatCard label="Tổng doanh thu" value={formatVnd(a.totalRevenue)} icon="₫"/><StatCard label="Giao dịch" value={rows.length} icon="≡"/><StatCard label="Thanh toán QR" value={a.payments.length} icon="▣"/></div>
    <Panel title="Biểu đồ doanh thu demo" className="mt-6"><div className="space-y-3">{rows.map(r=><div key={r.id} className="grid grid-cols-[150px_1fr_140px] items-center gap-3 text-sm font-bold"><span>{r.plate}</span><div className="h-4 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#001e40]" style={{width:`${Math.max(8,(Number(r.amount)||0)/max*100)}%`}} /></div><span className="text-right font-black">{formatVnd(r.amount)}</span></div>)}</div></Panel>
    <Panel title="Danh sách giao dịch" className="mt-6"><div className="overflow-hidden rounded-3xl border border-slate-200"><table className="w-full min-w-720px text-left text-sm"><thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.16em] text-slate-500"><tr><th className="p-4">Mã</th><th>Loại</th><th>Biển số</th><th>Số tiền</th><th>Thời gian</th></tr></thead><tbody className="divide-y divide-slate-100 bg-white">{rows.map(r=><tr key={r.id} className="font-semibold text-slate-600"><td className="p-4 font-black text-slate-950">{r.id}</td><td>{r.type}</td><td>{r.plate}</td><td className="font-black text-slate-950">{formatVnd(r.amount)}</td><td>{r.date}</td></tr>)}</tbody></table></div></Panel>
  </AdminShell>;
}
