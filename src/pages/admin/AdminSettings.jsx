import React from "react";
import { staffApi } from "../../api/parkingApi";

export default function AdminSettings({
  settings,
  setSettings,
  users,
  zones,
  gates,
  tariffs,
  passes,
  parkingConfig,
  showToast,
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm text-left">
        <h3 className="font-extrabold text-slate-950 text-base">Cấu hình hệ thống</h3>
        <p className="text-xs text-slate-600 mt-1">Các tham số vận hành thực sự có tác dụng tới hệ thống. Giá gửi/miễn phí phút đầu cấu hình riêng ở "Bảng biểu giá gửi".</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden text-left">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Chính sách an ninh & Cứu hộ</h4>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Chế độ SOS khẩn cấp</label>
                <div
                  onClick={() => setSettings({ ...settings, sosEnabled: !settings.sosEnabled })}
                  className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${settings.sosEnabled ? "border-red-200 bg-red-50/50" : "border-slate-200 bg-slate-50"}`}
                >
                  <div className={`w-9 h-5 rounded-full relative transition-colors ${settings.sosEnabled ? "bg-red-500" : "bg-slate-300"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${settings.sosEnabled ? "left-[18px]" : "left-0.5"}`} />
                  </div>
                  <span className="text-sm font-extrabold text-slate-850">{settings.sosEnabled ? "Bật khẩn cấp" : "Tắt khẩn cấp"}</span>
                </div>
                <p className="text-[10px] text-slate-500">Tắt sẽ chặn hẳn Security kích hoạt SOS ở mọi cổng, kể cả khi có sự cố thật.</p>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="flex items-center gap-4 text-left">
            <button
              onClick={async () => {
                try {
                  const res = await staffApi.updateAdminSettings(settings);
                  setSettings(res.data.data || settings);
                  showToast("Đã lưu cài đặt hệ thống thành công!");
                } catch (err) {
                  showToast(err.response?.data?.message || "Lưu cài đặt thất bại", "warning");
                }
              }}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 px-8 py-3 text-xs font-extrabold text-white cursor-pointer transition-colors"
            >
              Lưu thiết lập
            </button>
          </div>
        </div>

        {/* Right Column - System Info & Stats */}
        <div className="space-y-6 text-left">
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Trạng thái hạ tầng</h4>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: "Tổng người dùng", value: users.length },
                { label: "Tổng khu đỗ xe", value: zones.length },
                { label: "Tổng cổng kiểm soát", value: gates.length },
                { label: "Biểu phí đã cấu hình", value: tariffs.length },
                { label: "Vé định kỳ đang hoạt động", value: passes.filter(p => p.status === "active").length },
                { label: "Tổng sức chứa thiết kế", value: `${zones.reduce((s, z) => s + (z.capacity || 0), 0)} chỗ` },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-xs text-slate-600 font-bold">{item.label}</span>
                  <span className="text-sm font-extrabold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Thời gian hoạt động</h4>
            </div>
            <div className="p-6 space-y-3">
              {parkingConfig.buildings.map(b => (
                <div key={b.id} className="space-y-2 border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                  <p className="text-xs font-extrabold text-slate-800">{b.name}</p>
                  <p className="text-[10px] text-slate-600 font-semibold">{b.address}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {b.operatingHoursStart || "06:00"} — {b.operatingHoursEnd || "22:00"}
                    </span>
                  </div>
                </div>
              ))}
              {parkingConfig.buildings.length === 0 && <p className="text-xs text-slate-500">Chưa cấu hình tòa nhà nào.</p>}
            </div>
          </div>

          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Chi tiết máy chủ & Module</p>
            <p className="text-base font-black text-white mt-1">SmartParking Enterprise</p>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">Core Service: Java Spring Boot 3.3</p>
            <p className="text-[10px] text-slate-400 font-medium">Database: PostgreSQL 16</p>
            <p className="text-[10px] text-slate-400 font-medium">Frontend Engine: React 18 + Vite</p>
            <p className="text-[10px] text-slate-400 font-medium">Tích hợp VNPay & WebSocket Terminal</p>
          </div>
        </div>
      </div>
    </div>
  );
}
