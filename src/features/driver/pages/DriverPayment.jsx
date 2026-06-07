import { useState } from "react";
import Panel from "../../../shared/components/Panel";
import QrDisplay from "../../../shared/components/QrDisplay";
import { createPayment, formatVnd, getPayments } from "../../../shared/services/smartParkingStore";
import DriverShell from "../DriverShell";

export default function DriverPayment({ onLogout }) {
  const [form, setForm] = useState({ licensePlate: "59A1-123.45", amount: 18000, method: "BANK_TRANSFER", reason: "Thanh toán lượt gửi xe" });
  const [payments, setPayments] = useState(getPayments());
  const [latest, setLatest] = useState(null);

  function submit(event) {
    event.preventDefault();
    const payment = createPayment(form);
    setLatest(payment);
    setPayments(getPayments());
  }

  return (
    <DriverShell title="Thanh toán" subtitle="Tạo QR thanh toán hoặc QR xác nhận đã thanh toán khi ra bãi" onLogout={onLogout}>
      <div className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
        <Panel title="Tạo giao dịch thanh toán" subtitle="Demo hỗ trợ tiền mặt và chuyển khoản">
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2"><span className="text-sm font-black">Biển số</span><input className="input-pro" value={form.licensePlate} onChange={(e)=>setForm({...form, licensePlate:e.target.value.toUpperCase()})}/></label>
            <label className="space-y-2"><span className="text-sm font-black">Số tiền</span><input type="number" className="input-pro" value={form.amount} onChange={(e)=>setForm({...form, amount:Number(e.target.value)})}/></label>
            <label className="space-y-2"><span className="text-sm font-black">Phương thức</span><select className="input-pro" value={form.method} onChange={(e)=>setForm({...form, method:e.target.value})}><option value="BANK_TRANSFER">Chuyển khoản</option><option value="CASH">Tiền mặt</option></select></label>
            <label className="space-y-2"><span className="text-sm font-black">Nội dung</span><input className="input-pro" value={form.reason} onChange={(e)=>setForm({...form, reason:e.target.value})}/></label>
            <button className="rounded-2xl bg-[#001e40] px-5 py-4 text-sm font-black text-white md:col-span-2">Xác nhận thanh toán và tạo QR</button>
          </form>
        </Panel>
        {latest ? <QrDisplay title="QR xác nhận thanh toán" value={latest.qrCode} description={`${latest.licensePlate} • ${formatVnd(latest.amount)} • ${latest.method}`} /> : <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><p className="text-lg font-black">QR thanh toán sẽ hiện ở đây</p><p className="mt-2 text-sm font-semibold text-slate-500">Sau khi thanh toán, đưa Staff xác nhận khi ra bãi.</p></div>}
      </div>
      <Panel title="Lịch sử thanh toán" subtitle="Các giao dịch đã tạo" className="mt-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {payments.map((payment) => <div key={payment.id} className="rounded-3xl border border-slate-200 p-5"><h3 className="font-black text-slate-950">{formatVnd(payment.amount)}</h3><p className="mt-2 text-sm font-semibold text-slate-500">{payment.licensePlate} • {payment.method}</p><p className="mt-2 font-mono text-xs font-black text-[#001e40]">{payment.qrCode}</p></div>)}
        </div>
      </Panel>
    </DriverShell>
  );
}
