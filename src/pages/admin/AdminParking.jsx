// src/pages/admin/AdminParking.jsx

import { useMemo, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import AdminStatCard from "../../components/admin/AdminStatCard";
import CapacityBar from "../../components/CapacityBar";
import { getFloorAvailable, getFloorPercent } from "../../data/parkingData";
import {
  getAdminParkingFloors,
  resetAdminParkingFloors,
  updateAdminParkingFloor,
} from "../../services/adminStorage";

export default function AdminParking({ onLogout }) {
  const [floors, setFloors] = useState(() => getAdminParkingFloors());
  const [selectedFloorId, setSelectedFloorId] = useState(floors[0]?.id || "A1");
  const [message, setMessage] = useState("");

  const selectedFloor = floors.find((floor) => floor.id === selectedFloorId) || floors[0];

  const [form, setForm] = useState(() => ({
    capacity: selectedFloor?.capacity || 0,
    occupied: selectedFloor?.occupied || 0,
    reserved: selectedFloor?.reserved || 0,
    title: selectedFloor?.title || "",
    vehicleLabel: selectedFloor?.vehicleLabel || "",
    description: selectedFloor?.description || "",
  }));

  const summary = useMemo(() => {
    const capacity = floors.reduce((sum, floor) => sum + Number(floor.capacity || 0), 0);
    const occupied = floors.reduce((sum, floor) => sum + Number(floor.occupied || 0), 0);
    const reserved = floors.reduce((sum, floor) => sum + Number(floor.reserved || 0), 0);

    return {
      capacity,
      occupied,
      reserved,
      available: capacity - occupied - reserved,
      nearFull: floors.filter((floor) => getFloorPercent(floor) >= 70).length,
    };
  }, [floors]);

  const handleSelectFloor = (floor) => {
    setSelectedFloorId(floor.id);
    setForm({
      capacity: floor.capacity,
      occupied: floor.occupied,
      reserved: floor.reserved,
      title: floor.title,
      vehicleLabel: floor.vehicleLabel,
      description: floor.description,
    });
    setMessage("");
  };

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const capacity = Number(form.capacity);
    const occupied = Number(form.occupied);
    const reserved = Number(form.reserved);

    if (capacity <= 0) {
      setMessage("Tổng slot phải lớn hơn 0.");
      return;
    }

    if (occupied < 0 || reserved < 0) {
      setMessage("Slot đã chiếm và slot đặt trước không được âm.");
      return;
    }

    if (occupied + reserved > capacity) {
      setMessage("Slot đã chiếm + đã đặt không được lớn hơn tổng slot.");
      return;
    }

    const nextFloors = updateAdminParkingFloor(selectedFloorId, {
      ...form,
      capacity,
      occupied,
      reserved,
    });

    setFloors(nextFloors);
    setMessage(`Đã cập nhật capacity cho ${selectedFloorId}.`);
  };

  const handleReset = () => {
    const nextFloors = resetAdminParkingFloors();
    setFloors(nextFloors);
    handleSelectFloor(nextFloors[0]);
    setMessage("Đã reset dữ liệu tầng/capacity về mẫu ban đầu.");
  };

  return (
    <AdminLayout
      title="Quản lý tầng / capacity"
      description="Admin xem và chỉnh tổng slot, slot đã chiếm, slot đặt trước và slot chưa chiếm theo từng tầng."
      eyebrow="Admin / Parking Configuration"
      onLogout={onLogout}
      actions={
        <button
          type="button"
          onClick={handleReset}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-600 shadow-sm hover:bg-slate-50"
        >
          Reset dữ liệu mẫu
        </button>
      }
    >
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="Tổng slot"
          value={summary.capacity}
          description="Tổng sức chứa toàn bộ các tầng."
          icon="🅿️"
          tone="slate"
        />
        <AdminStatCard
          label="Đã chiếm"
          value={summary.occupied + summary.reserved}
          description="Xe đang gửi + slot đã đặt trước."
          icon="🚗"
          tone="blue"
        />
        <AdminStatCard
          label="Chưa chiếm"
          value={summary.available}
          description="Slot còn trống có thể nhận xe."
          icon="✅"
          tone="emerald"
        />
        <AdminStatCard
          label="Tầng gần đầy"
          value={summary.nearFull}
          description="Tầng có tỷ lệ sử dụng từ 70% trở lên."
          icon="⚠️"
          tone="amber"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h3 className="text-2xl font-black text-slate-950">Danh sách tầng</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Theo yêu cầu hiện tại: A1/A2 cho xe nhỏ, B1/B2 cho ô tô, C1 cho xe 16 chỗ.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {floors.map((floor) => {
                const available = getFloorAvailable(floor);
                const used = floor.occupied + floor.reserved;
                const percent = getFloorPercent(floor);
                const active = selectedFloorId === floor.id;

                return (
                  <button
                    key={floor.id}
                    type="button"
                    onClick={() => handleSelectFloor(floor)}
                    className={`rounded-3xl border p-5 text-left transition hover:-translate-y-1 hover:shadow-md ${
                      active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-900"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{floor.icon}</span>
                        <div>
                          <p className={`text-xs font-black uppercase tracking-widest ${active ? "text-slate-300" : "text-slate-400"}`}>
                            {floor.id}
                          </p>
                          <h4 className="text-xl font-black">{floor.label}</h4>
                          <p className={`mt-1 text-sm font-semibold ${active ? "text-slate-300" : "text-slate-500"}`}>
                            {floor.vehicleLabel}
                          </p>
                        </div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600"}`}>
                        {percent}%
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                      <Mini label="Tổng" value={floor.capacity} active={active} />
                      <Mini label="Chiếm" value={used} active={active} />
                      <Mini label="Trống" value={available} active={active} />
                    </div>

                    <div className="mt-5">
                      <div className="mb-2 flex justify-between text-xs font-black opacity-70">
                        <span>Tỷ lệ sử dụng</span>
                        <span>{percent}%</span>
                      </div>
                      <CapacityBar percent={percent} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-2xl font-black text-slate-950">Map khu A/B/C/D của tầng</h3>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Admin cũng quản lý theo tầng. Khu A/B/C/D là layout định hướng trong tầng, không phải slot riêng.
            </p>
            <div className="mt-6 grid min-h-[430px] grid-cols-2 gap-5 rounded-[2rem] border-4 border-slate-200 bg-slate-100 p-5">
              {['A', 'B', 'C', 'D'].map((area) => (
                <div key={area} className="flex items-center justify-center rounded-3xl border border-white bg-white/90 shadow-sm">
                  <div className="text-center">
                    <p className="text-5xl font-black text-slate-950">{area}</p>
                    <p className="mt-2 text-sm font-black uppercase tracking-widest text-slate-400">
                      Khu {area}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Layout {selectedFloor?.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="xl:col-span-4">
          <form onSubmit={handleSubmit} className="sticky top-28 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="text-5xl">{selectedFloor?.icon}</span>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Đang chỉnh
                </p>
                <h3 className="text-2xl font-black text-slate-950">{selectedFloor?.label}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">{selectedFloor?.vehicleLabel}</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <Field label="Tên / mục đích tầng">
                <input
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  className="input-admin"
                />
              </Field>

              <Field label="Loại xe áp dụng">
                <input
                  value={form.vehicleLabel}
                  onChange={(event) => updateForm("vehicleLabel", event.target.value)}
                  className="input-admin"
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                <Field label="Tổng slot">
                  <input
                    type="number"
                    value={form.capacity}
                    onChange={(event) => updateForm("capacity", event.target.value)}
                    className="input-admin"
                  />
                </Field>
                <Field label="Đã chiếm">
                  <input
                    type="number"
                    value={form.occupied}
                    onChange={(event) => updateForm("occupied", event.target.value)}
                    className="input-admin"
                  />
                </Field>
                <Field label="Đã đặt">
                  <input
                    type="number"
                    value={form.reserved}
                    onChange={(event) => updateForm("reserved", event.target.value)}
                    className="input-admin"
                  />
                </Field>
              </div>

              <Field label="Mô tả">
                <textarea
                  value={form.description}
                  onChange={(event) => updateForm("description", event.target.value)}
                  rows={4}
                  className="input-admin resize-none"
                />
              </Field>
            </div>

            <div className="mt-5 rounded-3xl bg-slate-50 p-5">
              <div className="mb-3 flex justify-between text-sm font-black text-slate-600">
                <span>Preview sau khi lưu</span>
                <span>
                  {Math.round(((Number(form.occupied) + Number(form.reserved)) / Math.max(Number(form.capacity), 1)) * 100)}%
                </span>
              </div>
              <CapacityBar
                percent={Math.round(((Number(form.occupied) + Number(form.reserved)) / Math.max(Number(form.capacity), 1)) * 100)}
              />
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-black">
                <span className="rounded-xl bg-white py-2 text-slate-500">Tổng {form.capacity || 0}</span>
                <span className="rounded-xl bg-white py-2 text-red-600">Chiếm {Number(form.occupied || 0) + Number(form.reserved || 0)}</span>
                <span className="rounded-xl bg-white py-2 text-emerald-600">
                  Trống {Math.max(Number(form.capacity || 0) - Number(form.occupied || 0) - Number(form.reserved || 0), 0)}
                </span>
              </div>
            </div>

            {message && (
              <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm font-bold text-blue-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="mt-5 w-full rounded-2xl bg-slate-950 py-4 text-base font-black text-white shadow-sm hover:bg-slate-800"
            >
              Lưu cấu hình tầng
            </button>
          </form>
        </aside>
      </section>
    </AdminLayout>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function Mini({ label, value, active }) {
  return (
    <div className={`rounded-2xl p-3 ${active ? "bg-white/10" : "bg-slate-50"}`}>
      <p className="text-[11px] font-black uppercase opacity-60">{label}</p>
      <p className="mt-1 text-lg font-black">{value}</p>
    </div>
  );
}
