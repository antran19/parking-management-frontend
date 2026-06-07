import { useState } from "react";
import Badge from "../../../shared/components/Badge";
import Panel from "../../../shared/components/Panel";
import { VEHICLE_TYPES } from "../../../shared/data/smartParkingSeed";
import { getVehicles, saveVehicles, uid, getVehicleTypeLabel } from "../../../shared/services/smartParkingStore";
import DriverShell from "../DriverShell";

export default function DriverProfile({ onLogout }) {
  const [vehicles, setVehicles] = useState(getVehicles());
  const [form, setForm] = useState({ licensePlate: "", vehicleType: "MOTORBIKE", brand: "", color: "" });

  function addVehicle(event) {
    event.preventDefault();
    const next = [{ id: uid("VEH"), ...form, licensePlate: form.licensePlate.toUpperCase(), default: vehicles.length === 0 }, ...vehicles];
    saveVehicles(next);
    setVehicles(next);
    setForm({ licensePlate: "", vehicleType: "MOTORBIKE", brand: "", color: "" });
  }

  function remove(id) {
    const next = vehicles.filter((item) => item.id !== id);
    saveVehicles(next);
    setVehicles(next);
  }

  return (
    <DriverShell title="Hồ sơ xe" subtitle="Quản lý thông tin cá nhân và danh sách xe của Driver" onLogout={onLogout}>
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Panel title="Thông tin Driver" subtitle="Dữ liệu demo cho tài khoản Quảng">
          <div className="space-y-4">
            <Info label="Họ tên" value="Ngọc Quảng" />
            <Info label="Email" value="quang.driver@example.com" />
            <Info label="Số điện thoại" value="0912 000 001" />
            <Info label="Trạng thái" value={<Badge variant="active">Đang hoạt động</Badge>} />
          </div>
        </Panel>
        <Panel title="Thêm phương tiện" subtitle="Driver có thể quản lý nhiều xe">
          <form onSubmit={addVehicle} className="grid gap-4 md:grid-cols-2">
            <input className="input-pro" placeholder="Biển số" value={form.licensePlate} onChange={(e) => setForm({ ...form, licensePlate: e.target.value })} required />
            <select className="input-pro" value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>{VEHICLE_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>
            <input className="input-pro" placeholder="Hãng xe" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            <input className="input-pro" placeholder="Màu xe" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            <button className="rounded-2xl bg-[#001e40] px-5 py-4 text-sm font-black text-white md:col-span-2">Thêm xe</button>
          </form>
        </Panel>
      </div>
      <Panel title="Danh sách xe" subtitle="Dùng để đặt chỗ, mua gói và thanh toán" className="mt-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {vehicles.map((vehicle) => <div key={vehicle.id} className="rounded-3xl border border-slate-200 p-5"><div className="flex justify-between gap-3"><h3 className="font-black text-slate-950">{vehicle.licensePlate}</h3>{vehicle.default && <Badge variant="primary">Mặc định</Badge>}</div><p className="mt-2 text-sm font-semibold text-slate-500">{getVehicleTypeLabel(vehicle.vehicleType)}</p><p className="mt-2 text-sm font-semibold text-slate-500">{vehicle.brand || "Chưa nhập hãng"} • {vehicle.color || "Chưa nhập màu"}</p><button onClick={() => remove(vehicle.id)} className="mt-4 rounded-2xl border border-slate-200 px-4 py-2 text-xs font-black hover:bg-rose-50 hover:text-rose-600">Xóa</button></div>)}
        </div>
      </Panel>
    </DriverShell>
  );
}
function Info({ label, value }) { return <div className="rounded-3xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</p><div className="mt-2 font-black text-slate-950">{value}</div></div>; }
