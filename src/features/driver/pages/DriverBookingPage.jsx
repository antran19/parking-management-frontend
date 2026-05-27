import { useEffect, useMemo, useState } from "react";
import Badge from "../../../shared/components/Badge";
import Panel from "../../../shared/components/Panel";
import QrDisplay from "../../../shared/components/QrDisplay";
import { VEHICLE_TYPES } from "../../../shared/data/smartParkingSeed";
import { createReservation, cancelReservation, getFloors, getFloorUsage, getReservations, getVehicleTypeLabel } from "../../../shared/services/smartParkingStore";
import DriverShell from "../DriverShell";

const initialForm = { licensePlate: "", vehicleType: "MOTORBIKE", floorId: "", zone: "A", startAt: "" };

export default function DriverBookingPage({ onLogout }) {
  const [form, setForm] = useState(initialForm);
  const [reservations, setReservations] = useState([]);
  const [latest, setLatest] = useState(null);
  const [floors, setFloors] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      const [nextFloors, nextReservations] = await Promise.all([getFloors(), getReservations()]);
      if (!mounted) return;
      setFloors(nextFloors);
      setReservations(nextReservations);
      setForm((current) => ({ ...current, floorId: current.floorId || nextFloors[0]?.id || "" }));
    }
    loadData();
    return () => { mounted = false; };
  }, []);
  const allowedFloors = useMemo(() => {
    const type = VEHICLE_TYPES.find((item) => item.id === form.vehicleType);
    return floors.filter((floor) => type?.floorIds.includes(floor.id));
  }, [floors, form.vehicleType]);
  const selectedFloor = floors.find((floor) => floor.id === form.floorId) || allowedFloors[0];

  function update(field, value) {
    const next = { ...form, [field]: value };
    if (field === "vehicleType") {
      const type = VEHICLE_TYPES.find((item) => item.id === value);
      next.floorId = type?.floorIds[0] || "A1";
      next.zone = "A";
    }
    setForm(next);
  }

  async function submit(event) {
    event.preventDefault();
    const reservation = await createReservation({ ...form, floorName: selectedFloor?.name || form.floorId });
    setLatest(reservation);
    setReservations(await getReservations());
  }

  async function handleCancel(id) {
    await cancelReservation(id);
    setReservations(await getReservations());
  }

  return (
    <DriverShell title="Đặt chỗ trước" subtitle="Chọn tầng, khu A/B/C/D và nhận mã QR để Staff xác nhận" onLogout={onLogout}>
      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Panel title="Thông tin đặt chỗ" subtitle="QR xuất hiện sau khi đặt chỗ thành công">
          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <Field label="Biển số xe"><input value={form.licensePlate} onChange={(e) => update("licensePlate", e.target.value.toUpperCase())} className="input-pro" required /></Field>
            <Field label="Loại xe"><select value={form.vehicleType} onChange={(e) => update("vehicleType", e.target.value)} className="input-pro">{VEHICLE_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>
            <Field label="Tầng phù hợp"><select value={form.floorId} onChange={(e) => update("floorId", e.target.value)} className="input-pro">{allowedFloors.map((floor) => <option key={floor.id} value={floor.id}>{floor.name} - {floor.title}</option>)}</select></Field>
            <Field label="Khu trong tầng"><select value={form.zone} onChange={(e) => update("zone", e.target.value)} className="input-pro">{(selectedFloor?.zones || []).map((zone) => <option key={zone} value={zone}>Khu {zone}</option>)}</select></Field>
            <Field label="Thời gian dự kiến"><input type="datetime-local" value={form.startAt} onChange={(e) => update("startAt", e.target.value)} className="input-pro" /></Field>
            <div className="flex items-end"><button className="w-full rounded-2xl bg-[#001e40] px-5 py-4 text-sm font-black text-white transition hover:opacity-95">Xác nhận đặt chỗ và tạo QR</button></div>
          </form>
        </Panel>

        <div className="space-y-6">
          {latest ? (
            <QrDisplay title="QR đặt chỗ" value={latest.qrCode} description={`${latest.licensePlate} • ${latest.floorId} • Khu ${latest.zone}`} />
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center"><p className="text-lg font-black text-slate-950">QR sẽ hiện ở đây</p><p className="mt-2 text-sm font-semibold text-slate-500">Sau khi bấm xác nhận, đưa QR cho Staff để check-in.</p></div>
          )}
          {selectedFloor && <FloorPreview floor={selectedFloor} />}
        </div>
      </div>

      <Panel title="Danh sách đặt chỗ của tôi" subtitle="Có thể hủy đặt chỗ nếu chưa check-in" className="mt-6">
        <div className="overflow-hidden rounded-3xl border border-slate-200">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-black uppercase tracking-[0.16em] text-slate-500"><tr><th className="p-4">Mã</th><th>Biển số</th><th>Xe</th><th>Tầng/Khu</th><th>Trạng thái</th><th>QR</th><th></th></tr></thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {reservations.map((item) => <tr key={item.id} className="font-semibold text-slate-600"><td className="p-4 font-black text-slate-950">{item.id}</td><td>{item.licensePlate}</td><td>{getVehicleTypeLabel(item.vehicleType)}</td><td>{item.floorId} / Khu {item.zone}</td><td><Badge variant={item.status === "CONFIRMED" ? "active" : "danger"}>{item.status}</Badge></td><td className="font-mono text-xs">{item.qrCode}</td><td>{item.status === "CONFIRMED" && <button onClick={() => handleCancel(item.id)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black hover:bg-rose-50 hover:text-rose-600">Hủy</button>}</td></tr>)}
            </tbody>
          </table>
        </div>
      </Panel>
    </DriverShell>
  );
}

function Field({ label, children }) { return <label className="space-y-2"><span className="text-sm font-black text-slate-700">{label}</span>{children}</label>; }
function FloorPreview({ floor }) { const usage = getFloorUsage(floor); return <div className="rounded-3xl border border-slate-200 bg-white p-5"><div className="flex justify-between gap-3"><div><h3 className="font-black text-slate-950">{floor.name}</h3><p className="text-sm font-semibold text-slate-500">{floor.title}</p></div><Badge variant="primary">Còn {usage.available}</Badge></div><div className="mt-4 grid grid-cols-4 gap-2">{(floor.zones || []).map((zone) => <div key={zone} className="rounded-2xl bg-slate-50 p-4 text-center text-xl font-black text-[#001e40]">{zone}</div>)}</div></div>; }
