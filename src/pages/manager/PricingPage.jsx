import React, { useState, useContext } from "react";
import { managerApi } from "../../api/parkingApi";
import { ManagerContext } from "./ManagerLayout";

const PRICING_TYPE_LABELS = {
  HOURLY: "Theo giờ",
  DAILY: "Theo ngày",
  MONTHLY: "Theo tháng",
};

const EMPTY_FORM = {
  vehicleTypeId: "",
  pricingType: "HOURLY",
  pricePerUnit: 0,
  freeMinutes: 0,
};

const PricingPage = () => {
  const { priceRules, syncConfig, triggerToast } = useContext(ManagerContext);
  const [editingPrice, setEditingPrice] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newRule, setNewRule] = useState(EMPTY_FORM);
  const [filterVehicle, setFilterVehicle] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");

  const vehicleTypes = [...new Set(priceRules.map(r => r.vehicleTypeName))];
  const pricingTypes = [...new Set(priceRules.map(r => r.pricingType))];

  const filtered = priceRules.filter(r => {
    if (filterVehicle !== "ALL" && r.vehicleTypeName !== filterVehicle) return false;
    if (filterType !== "ALL" && r.pricingType !== filterType) return false;
    return true;
  });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await managerApi.updatePricingRule(editingPrice.id, {
        pricingType: editingPrice.pricingType,
        pricePerUnit: editingPrice.pricePerUnit,
        freeMinutes: editingPrice.freeMinutes || 0,
      });
      await syncConfig();
      setEditingPrice(null);
      triggerToast("Đã cập nhật bảng giá", "success");
    } catch (err) {
      triggerToast(err.response?.data?.message || "Cập nhật thất bại", "error");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await managerApi.createPricingRule(newRule);
      await syncConfig();
      setCreating(false);
      setNewRule(EMPTY_FORM);
      triggerToast("Đã tạo bảng giá", "success");
    } catch (err) {
      triggerToast(err.response?.data?.message || "Tạo thất bại", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Xác nhận xóa biểu phí này?")) return;
    try {
      await managerApi.deletePricingRule(id);
      await syncConfig();
      triggerToast("Đã xóa bảng giá", "success");
    } catch (err) {
      triggerToast(err.response?.data?.message || "Xóa thất bại", "error");
    }
  };

  return (
    <section className="flex-1 space-y-8 p-8">
      <div className="space-y-6 fade-up-element">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Cấu hình Biểu phí</h3>
            <p className="text-xs text-slate-500 mt-1">Thiết lập giá cước theo giờ, ngày, tháng cho từng loại phương tiện.</p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            + Thêm biểu phí
          </button>
        </div>

        {/* Bộ lọc */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Phương tiện</span>
            <div className="flex gap-2">
              <button onClick={() => setFilterVehicle("ALL")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterVehicle === "ALL" ? "bg-indigo-600 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Tất cả</button>
              {vehicleTypes.map(v => (
                <button key={v} onClick={() => setFilterVehicle(v)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterVehicle === v ? "bg-indigo-600 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{v}</button>
              ))}
            </div>
          </div>

          <div className="w-px h-5 bg-slate-200" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loại vé</span>
            <div className="flex gap-2">
              <button onClick={() => setFilterType("ALL")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterType === "ALL" ? "bg-indigo-600 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Tất cả</button>
              {pricingTypes.map(t => (
                <button key={t} onClick={() => setFilterType(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterType === t ? "bg-indigo-600 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{PRICING_TYPE_LABELS[t] || t}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-slate-400 text-sm">Không có biểu phí nào phù hợp.</div>
          ) : filtered.map(rule => (
            <div key={rule.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${rule.vehicleTypeName === "Ô tô" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                  {rule.vehicleTypeName}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {PRICING_TYPE_LABELS[rule.pricingType] || rule.pricingType}
                </span>
              </div>

              <h4 className="text-3xl font-black text-slate-800 font-mono tracking-tighter mb-1">
                {Number(rule.pricePerUnit).toLocaleString("vi-VN")}
                <span className="text-base text-slate-400 font-bold ml-1">đ</span>
              </h4>
              <p className="text-xs text-slate-500 font-medium mb-6">
                {PRICING_TYPE_LABELS[rule.pricingType] || rule.pricingType}
                {rule.freeMinutes > 0 && ` • Miễn phí ${rule.freeMinutes} phút đầu`}
              </p>

              <div className="flex gap-2">
                <button onClick={() => setEditingPrice(rule)} className="flex-1 py-2.5 rounded-xl border border-indigo-200 text-indigo-600 text-xs font-bold hover:bg-indigo-50 transition-colors cursor-pointer">Sửa giá</button>
                <button onClick={() => handleDelete(rule.id)} className="px-4 py-2.5 rounded-xl border border-red-200 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors cursor-pointer">Xóa</button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal sửa */}
        {editingPrice && (
          <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
              <h4 className="text-lg font-black text-slate-800 mb-4">Cập nhật bảng giá</h4>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Loại phương tiện</label>
                  <input disabled type="text" value={editingPrice.vehicleTypeName} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-100 text-slate-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Loại vé</label>
                  <input disabled type="text" value={PRICING_TYPE_LABELS[editingPrice.pricingType] || editingPrice.pricingType} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-100 text-slate-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Đơn giá (VNĐ)</label>
                  <input required type="number" min="0" step="1000" value={editingPrice.pricePerUnit} onChange={e => setEditingPrice({ ...editingPrice, pricePerUnit: e.target.value })} className="w-full border border-indigo-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-indigo-700" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Phút miễn phí đầu tiên</label>
                  <input required type="number" min="0" value={editingPrice.freeMinutes || 0} onChange={e => setEditingPrice({ ...editingPrice, freeMinutes: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setEditingPrice(null)} className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer">Hủy</button>
                  <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer">Lưu thay đổi</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal tạo mới */}
        {creating && (
          <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
              <h4 className="text-lg font-black text-slate-800 mb-4">Thêm biểu phí mới</h4>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Vehicle Type ID</label>
                  <input required type="text" value={newRule.vehicleTypeId} onChange={e => setNewRule({ ...newRule, vehicleTypeId: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500" placeholder="UUID loại xe" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Loại vé</label>
                  <select value={newRule.pricingType} onChange={e => setNewRule({ ...newRule, pricingType: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500">
                    <option value="HOURLY">Theo giờ</option>
                    <option value="DAILY">Theo ngày</option>
                    <option value="MONTHLY">Theo tháng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Đơn giá (VNĐ)</label>
                  <input required type="number" min="0" step="1000" value={newRule.pricePerUnit} onChange={e => setNewRule({ ...newRule, pricePerUnit: e.target.value })} className="w-full border border-indigo-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-indigo-700" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Phút miễn phí đầu tiên</label>
                  <input required type="number" min="0" value={newRule.freeMinutes} onChange={e => setNewRule({ ...newRule, freeMinutes: e.target.value })} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setCreating(false); setNewRule(EMPTY_FORM); }} className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer">Hủy</button>
                  <button type="submit" className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer">Tạo mới</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default PricingPage;