import { useState } from "react";
import Badge from "../../../shared/components/Badge";
import Panel from "../../../shared/components/Panel";
import QrDisplay from "../../../shared/components/QrDisplay";
import { VEHICLE_TYPES } from "../../../shared/data/smartParkingSeed";
import { createPass, formatVnd, getMembershipPlans, getPasses, getVehicleTypeLabel } from "../../../shared/services/smartParkingStore";
import DriverShell from "../DriverShell";

export default function DriverPass({ onLogout }) {
  const [plans] = useState(getMembershipPlans());
  const [form, setForm] = useState({ licensePlate: "59A1-123.45", vehicleType: "MOTORBIKE", paymentMethod: "BANK_TRANSFER" });
  const [selectedPlan, setSelectedPlan] = useState("QUARTERLY");
  const [latest, setLatest] = useState(null);
  const [passes, setPasses] = useState(getPasses());

  function buy(planId) {
    const pass = createPass({ ...form, planId });
    setSelectedPlan(planId);
    setLatest(pass);
    setPasses(getPasses());
  }

  return (
    <DriverShell title="Gói thành viên" subtitle="Mua gói gửi xe tháng, quý, năm và nhận QR vé thành viên" onLogout={onLogout}>
      <div className="space-y-6">
        <Panel title="Thông tin xe đăng ký gói" subtitle="Một QR vé thành viên gắn với biển số xe">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2"><span className="text-sm font-black">Biển số</span><input className="input-pro" value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })} /></label>
            <label className="space-y-2"><span className="text-sm font-black">Loại xe</span><select className="input-pro" value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>{VEHICLE_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
            <label className="space-y-2"><span className="text-sm font-black">Thanh toán</span><select className="input-pro" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}><option value="BANK_TRANSFER">Chuyển khoản</option><option value="CASH">Tiền mặt tại quầy</option></select></label>
          </div>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.65fr]">
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.id} className={`relative rounded-[2rem] border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${selectedPlan === plan.id ? "border-[#001e40] ring-4 ring-[#eaf2ff]" : "border-slate-200"}`}>
                {plan.popular && <Badge variant="dark" className="absolute right-5 top-5">Phổ biến</Badge>}
                <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">{plan.durationLabel}</p>
                <h3 className="mt-3 text-2xl font-black text-slate-950">{plan.name}</h3>
                <p className="mt-3 text-3xl font-black text-[#001e40]">{formatVnd(plan.price)}</p>
                <p className="mt-3 min-h-10 text-sm font-semibold text-slate-500">{plan.highlight}</p>
                <ul className="mt-5 space-y-3 text-sm font-semibold text-slate-600">
                  {plan.benefits.map((benefit) => <li key={benefit} className="flex gap-2"><span className="text-[#001e40]">✓</span>{benefit}</li>)}
                </ul>
                <button onClick={() => buy(plan.id)} className="mt-6 w-full rounded-2xl bg-[#001e40] px-5 py-3 text-sm font-black text-white">Mua {plan.name}</button>
              </div>
            ))}
          </div>
          <div className="space-y-6">
            {latest ? <QrDisplay title="QR vé thành viên" value={latest.qrCode} description={`${latest.planName} • ${latest.licensePlate} • hết hạn ${latest.endDate}`} /> : <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><p className="text-lg font-black">Chọn gói để tạo QR</p><p className="mt-2 text-sm font-semibold text-slate-500">QR này dùng để Staff xác nhận xe có vé.</p></div>}
          </div>
        </div>

        <Panel title="Vé thành viên đã mua" subtitle="Dữ liệu demo lưu localStorage">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {passes.map((pass) => <div key={pass.id} className="rounded-3xl border border-slate-200 bg-white p-5"><div className="flex justify-between"><h3 className="font-black text-slate-950">{pass.planName}</h3><Badge variant="active">{pass.status}</Badge></div><p className="mt-3 text-sm font-semibold text-slate-500">{pass.licensePlate} • {getVehicleTypeLabel(pass.vehicleType)}</p><p className="mt-2 text-sm font-bold text-slate-600">Hiệu lực: {pass.startDate} → {pass.endDate}</p><p className="mt-3 font-mono text-xs font-black text-[#001e40]">{pass.qrCode}</p></div>)}
          </div>
        </Panel>
      </div>
    </DriverShell>
  );
}
