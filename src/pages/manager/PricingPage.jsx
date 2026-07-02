import React, { useState, useContext } from "react";
import { managerApi } from "../../api/parkingApi";
import { ManagerContext } from "./ManagerLayout";

const PRICING_TYPE_LABELS = {
  HOURLY: "Theo giờ",
  DAILY: "Theo ngày",
  MONTHLY: "Vé tháng",
  QUARTERLY: "Vé quý",
  YEARLY: "Vé năm",
};

const EMPTY_FORM = {
  vehicleTypeId: "",
  pricingType: "HOURLY",
  pricePerUnit: 0,
  freeMinutes: 0,
  buildingId: "",
};

const PricingPage = () => {
  const { buildings, priceRules, vehicleTypes, syncConfig, triggerToast } = useContext(ManagerContext);
  const [editingPrice, setEditingPrice] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newRule, setNewRule] = useState(EMPTY_FORM);

  // Group price rules by vehicleTypeName
  const grouped = priceRules.reduce((acc, rule) => {
    const key = rule.vehicleTypeName || "Khác";
    if (!acc[key]) acc[key] = [];
    acc[key].push(rule);
    return acc;
  }, {});

  const handleUpdate = async (e) => {
    e.preventDefault();
    const price = parseFloat(editingPrice.pricePerUnit);
    if (isNaN(price) || price <= 0) {
      triggerToast("Đơn giá phải lớn hơn 0", "error");
      return;
    }
    try {
      await managerApi.updatePricingRule(editingPrice.id, {
        pricingType: editingPrice.pricingType,
        pricePerUnit: price,
        freeMinutes: parseInt(editingPrice.freeMinutes) || 0,
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
      // Kiểm tra vehicleTypeId
      if (!newRule.vehicleTypeId) {
        triggerToast("Vui lòng chọn loại phương tiện", "error");
        return;
      }

      // Kiểm tra pricePerUnit
      const price = parseFloat(newRule.pricePerUnit);
      if (isNaN(price) || price <= 0) {
        triggerToast("Đơn giá phải lớn hơn 0", "error");
        return;
      }

      // Lấy buildingId từ buildings hoặc từ newRule
      const buildingId = newRule.buildingId || (buildings.length > 0 ? buildings[0].id : "");
      if (!buildingId) {
        triggerToast("Không tìm thấy tòa nhà", "error");
        return;
      }

      // Kiểm tra xem combination này đã tồn tại hay chưa
      const isDuplicate = priceRules.some(
        rule =>
          rule.buildingId === buildingId &&
          rule.vehicleTypeId === newRule.vehicleTypeId &&
          rule.pricingType === newRule.pricingType
      );

      if (isDuplicate) {
        const vehicleTypeName = vehicleTypes.find((vt) => vt.id === newRule.vehicleTypeId)?.name || "phương tiện";
        triggerToast(`Biểu phí cho ${vehicleTypeName} (${PRICING_TYPE_LABELS[newRule.pricingType]}) đã tồn tại. Vui lòng sửa biểu phí hiện có.`, "error");
        return;
      }
      
      await managerApi.createPricingRule({
        buildingId: buildingId,
        vehicleTypeId: newRule.vehicleTypeId,
        pricingType: newRule.pricingType,
        pricePerUnit: price,
        freeMinutes: parseInt(newRule.freeMinutes) || 0,
      });
      await syncConfig();
      setCreating(false);
      setNewRule(EMPTY_FORM);
      triggerToast("Đã tạo bảng giá", "success");
    } catch (err) {
      triggerToast(err.response?.data?.message || "Tạo thất bại", "error");
    }
  };

  const handleDelete = async (id, vehicleType) => {
    if (!window.confirm(`Xóa biểu phí ${vehicleType}?`)) return;
    try {
      await managerApi.deletePricingRule(id);
      await syncConfig();
      triggerToast("Đã xóa bảng giá", "success");
    } catch (err) {
      triggerToast(err.response?.data?.message || "Xóa thất bại", "error");
    }
  };

  return (
    <section className="flex-1 p-8 space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 space-y-6">
        <div className="flex justify-between items-center text-left">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Bảng biểu phí đỗ xe</h3>
            <p className="text-xs text-slate-400 mt-1">Giá gửi xe theo từng loại phương tiện. Áp dụng cho tất cả cổng trong bãi.</p>
          </div>
          <button
            onClick={() => { 
              const initialForm = {
                ...EMPTY_FORM,
                buildingId: buildings.length > 0 ? buildings[0].id : "",
              };
              setNewRule(initialForm); 
              setCreating(true); 
            }}
            className="rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors"
          >
            Thêm biểu phí
          </button>
        </div>

        {/* Grouped pricing table */}
        <div className="space-y-4">
          {Object.keys(grouped).length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-8">Chưa có biểu phí nào.</p>
          ) : (
            Object.entries(grouped).map(([vehicleType, items]) => (
              <div key={vehicleType} className="rounded-xl border border-slate-200 overflow-hidden">
                {/* Group header */}
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                    {vehicleType}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{items.length} mức giá</span>
                </div>

                {/* Price rows */}
                <div className="divide-y divide-slate-100">
                  {items.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-6 min-w-0">
                        <span className="text-sm text-slate-700 font-semibold w-28 flex-shrink-0">
                          {PRICING_TYPE_LABELS[rule.pricingType] || rule.pricingType}
                        </span>
                        <span className="text-base font-extrabold text-slate-900 tabular-nums">
                          {Number(rule.pricePerUnit).toLocaleString("vi-VN")}{" "}
                          <span className="text-slate-500 font-semibold text-sm">VNĐ</span>
                        </span>
                        {rule.freeMinutes > 0 && (
                          <span className="text-xs text-slate-500 font-medium">
                            miễn phí {rule.freeMinutes} phút đầu
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => setEditingPrice({ ...rule })}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id, vehicleType)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary stats */}
        {priceRules.length > 0 && (
          <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng cộng</span>
            <span className="text-xs font-bold text-slate-700">{priceRules.length} mức giá</span>
            <span className="text-[10px] text-slate-400">·</span>
            <span className="text-xs font-bold text-slate-700">{Object.keys(grouped).length} loại phương tiện</span>
          </div>
        )}
      </div>

      {/* --- MODAL SỬA --- */}
      {editingPrice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-6 text-left border border-slate-200">
            <h3 className="font-extrabold text-slate-900 text-base">Cập nhật biểu phí</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Loại phương tiện</label>
                <input
                  disabled
                  type="text"
                  value={editingPrice.vehicleTypeName}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 p-3 text-xs font-bold text-slate-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Kiểu thu phí</label>
                <input
                  disabled
                  type="text"
                  value={PRICING_TYPE_LABELS[editingPrice.pricingType] || editingPrice.pricingType}
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 p-3 text-xs font-bold text-slate-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Đơn giá (VNĐ)</label>
                <input
                  required
                  type="number"
                  min="1000"
                  step="1000"
                  value={editingPrice.pricePerUnit}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val !== "" && parseFloat(val) < 0) return;
                    setEditingPrice({ ...editingPrice, pricePerUnit: val });
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Số phút miễn phí</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={editingPrice.freeMinutes || 0}
                  onChange={(e) => setEditingPrice({ ...editingPrice, freeMinutes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPrice(null)}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-3 text-xs font-bold cursor-pointer transition-colors"
                >
                  Lưu lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL TẠO MỚI --- */}
      {creating && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-6 text-left border border-slate-200">
            <h3 className="font-extrabold text-slate-900 text-base">Cài đặt biểu phí mới</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              {/* Tòa nhà - chỉ hiển thị nếu có > 1 tòa */}
              {buildings.length > 1 && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Tòa nhà</label>
                  <select
                    required
                    value={newRule.buildingId}
                    onChange={(e) => setNewRule({ ...newRule, buildingId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="">— Chọn —</option>
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Loại phương tiện</label>
                  <select
                    required
                    value={newRule.vehicleTypeId}
                    onChange={(e) => setNewRule({ ...newRule, vehicleTypeId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="">— Chọn —</option>
                    {vehicleTypes.map((vt) => (
                      <option key={vt.id} value={vt.id}>{vt.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Kiểu thu phí</label>
                  <select
                    value={newRule.pricingType}
                    onChange={(e) => setNewRule({ ...newRule, pricingType: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="HOURLY">Theo Giờ</option>
                    <option value="DAILY">Theo Ngày</option>
                    <option value="MONTHLY">Vé Tháng</option>
                    <option value="QUARTERLY">Vé Quý</option>
                    <option value="YEARLY">Vé Năm</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Đơn giá (VNĐ)</label>
                <input
                  required
                  type="number"
                  min="1000"
                  step="1000"
                  value={newRule.pricePerUnit}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val !== "" && parseFloat(val) < 0) return;
                    setNewRule({ ...newRule, pricePerUnit: val });
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Số phút miễn phí</label>
                <input
                  required
                  type="number"
                  min="0"
                  value={newRule.freeMinutes}
                  onChange={(e) => setNewRule({ ...newRule, freeMinutes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setCreating(false); setNewRule({ ...EMPTY_FORM, buildingId: buildings.length > 0 ? buildings[0].id : "" }); }}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-3 text-xs font-bold cursor-pointer transition-colors"
                >
                  Lưu lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default PricingPage;