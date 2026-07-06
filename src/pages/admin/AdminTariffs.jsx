import React from "react";
import { staffApi } from "../../api/parkingApi";

export default function AdminTariffs({ tariffs, settings, handleOpenAddTariff, handleOpenEditTariff, reloadAdminConfig, showToast }) {
  const grouped = tariffs.reduce((acc, t) => {
    const key = t.vehicleType || "Khác";
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 space-y-6">
      <div className="flex justify-between items-center text-left">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base">Bảng biểu phí đỗ xe</h3>
          <p className="text-xs text-slate-400 mt-1">Giá gửi xe theo từng loại phương tiện.</p>
        </div>
        <button onClick={handleOpenAddTariff} className="rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors">
          Thêm biểu phí
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([vehicleType, items]) => (
          <div key={vehicleType} className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">{vehicleType}</span>
              <span className="text-xs text-slate-500 font-medium">{items.length} mức giá</span>
            </div>
            <div className="divide-y divide-slate-100">
              {items.map(t => (
                <div key={t.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-6 min-w-0">
                    <span className="text-sm text-slate-700 font-semibold w-24 flex-shrink-0">{t.type === "HOURLY" ? "Theo giờ" : t.type === "DAILY" ? "Theo ngày" : t.type === "MONTHLY" ? "Vé tháng" : t.type === "QUARTERLY" ? "Vé quý" : "Vé năm"}</span>
                    <span className="text-base font-extrabold text-slate-900 tabular-nums">{t.price.toLocaleString("vi-VN")} <span className="text-slate-500 font-semibold text-sm">{settings.currency}</span></span>
                    {t.freeMinutes > 0 && <span className="text-xs text-slate-500 font-medium">miễn phí {t.freeMinutes} phút đầu</span>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => handleOpenEditTariff(t)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors">Sửa</button>
                    <button onClick={async () => { if (window.confirm(`Xóa biểu phí ${t.vehicleType}?`)) { await staffApi.deletePricingRule(t.id); await reloadAdminConfig(); showToast("Đã xóa biểu phí", "warning"); } }} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 cursor-pointer transition-colors">Xóa</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {tariffs.length === 0 && (
        <p className="text-center text-sm text-slate-400 py-8">Chưa có biểu phí nào.</p>
      )}
    </div>
  );
}
