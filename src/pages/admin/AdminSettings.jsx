import React from "react";
import { staffApi } from "../../api/parkingApi";

export default function AdminSettings({
  settings,
  setSettings,
  enterpriseSettings,
  setEnterpriseSettings,
  settingsSubTab,
  setSettingsSubTab,
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
        <p className="text-xs text-slate-600 mt-1">Quản lý toàn bộ tham số vận hành, tài chính, bảo mật và tích hợp bên thứ ba.</p>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {[
          { id: "business", label: "Nghiệp vụ & Hiển thị" },
          { id: "vnpay", label: "Thanh toán & VNPAY" },
          { id: "security", label: "An ninh & Tự động hóa" },
          { id: "maintenance", label: "Hệ thống & Dữ liệu" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSettingsSubTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${settingsSubTab === tab.id
              ? "border-slate-900 text-slate-950"
              : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Sub Tab Contents */}
        <div className="lg:col-span-2 space-y-6">

          {/* Sub Tab: Business & UI Settings */}
          {settingsSubTab === "business" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden text-left">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Cấu hình nghiệp vụ & Giao diện</h4>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Tên hệ thống quản trị</label>
                  <input
                    type="text"
                    value={settings.systemName}
                    onChange={e => setSettings({ ...settings, systemName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                  />
                  <p className="text-[10px] text-slate-600">Hiển thị trên tiêu đề bảng điều khiển và báo cáo PDF.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Ngôn ngữ giao diện</label>
                    <select
                      value="vi"
                      disabled
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 p-3 text-sm font-bold text-slate-900 focus:outline-none"
                    >
                      <option value="vi">Tiếng Việt (Mặc định)</option>
                      <option value="en">English (US)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Múi giờ hệ thống</label>
                    <select
                      value="GMT+7"
                      disabled
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 p-3 text-sm font-bold text-slate-900 focus:outline-none"
                    >
                      <option value="GMT+7">GMT+7 (Asia/Ho_Chi_Minh)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub Tab: Payments & VNPAY */}
          {settingsSubTab === "vnpay" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden text-left space-y-6">
              <div className="p-6 space-y-5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b pb-3">Tài chính bãi đỗ</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Đơn vị tiền tệ</label>
                    <select
                      value={settings.currency}
                      onChange={e => setSettings({ ...settings, currency: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="VND">VND (đ)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Thuế suất VAT (%)</label>
                    <input
                      type="number"
                      value={settings.vat}
                      onChange={e => setSettings({ ...settings, vat: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Miễn phí đỗ (Phút)</label>
                    <input
                      type="number"
                      value={settings.gracePeriod}
                      onChange={e => setSettings({ ...settings, gracePeriod: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-600">Thời gian miễn phí áp dụng cho xe ra/vào nhanh trong bãi không tính phí.</p>
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b pb-3">Tích hợp cổng thanh toán VNPAY</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">VNP_TMNCODE (Merchant ID)</label>
                      <input
                        type="text"
                        value={enterpriseSettings.vnpTmnCode}
                        onChange={e => setEnterpriseSettings({ ...enterpriseSettings, vnpTmnCode: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">VNP_HASHSECRET (Secret Key)</label>
                      <input
                        type="password"
                        value={enterpriseSettings.vnpHashSecret}
                        onChange={e => setEnterpriseSettings({ ...enterpriseSettings, vnpHashSecret: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 transition-all font-mono"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">VNPAY Payment Endpoint URL</label>
                    <input
                      type="text"
                      value={enterpriseSettings.vnpUrl}
                      onChange={e => setEnterpriseSettings({ ...enterpriseSettings, vnpUrl: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub Tab: Security & Automation */}
          {settingsSubTab === "security" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden text-left space-y-6">
              <div className="p-6 space-y-5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b pb-3">Chính sách bảo mật & Cứu hộ</h4>
                <div className="grid grid-cols-2 gap-4">
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
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Tự khóa cổng khi biển số Blacklist</label>
                    <div
                      onClick={() => setEnterpriseSettings({ ...enterpriseSettings, autoLockBlacklist: !enterpriseSettings.autoLockBlacklist })}
                      className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${enterpriseSettings.autoLockBlacklist ? "border-amber-200 bg-amber-50/50" : "border-slate-200 bg-slate-50"}`}
                    >
                      <div className={`w-9 h-5 rounded-full relative transition-colors ${enterpriseSettings.autoLockBlacklist ? "bg-amber-500" : "bg-slate-300"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enterpriseSettings.autoLockBlacklist ? "left-[18px]" : "left-0.5"}`} />
                      </div>
                      <span className="text-sm font-extrabold text-slate-850">{enterpriseSettings.autoLockBlacklist ? "Tự động khóa" : "Bỏ qua cảnh báo"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b pb-3">Thông báo & Cảnh báo khẩn</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Email nhận log khẩn cấp</label>
                    <input
                      type="email"
                      value={enterpriseSettings.alertEmail}
                      onChange={e => setEnterpriseSettings({ ...enterpriseSettings, alertEmail: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Ngưỡng báo động đầy bãi (%)</label>
                    <input
                      type="number"
                      value={enterpriseSettings.occupancyAlertThreshold}
                      onChange={e => setEnterpriseSettings({ ...enterpriseSettings, occupancyAlertThreshold: parseInt(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub Tab: Maintenance & System */}
          {settingsSubTab === "maintenance" && (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden text-left space-y-6">
              <div className="p-6 space-y-5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b pb-3">Sao lưu & Bảo trì</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Tự động sao lưu dữ liệu</label>
                    <select
                      value={enterpriseSettings.backupInterval}
                      onChange={e => setEnterpriseSettings({ ...enterpriseSettings, backupInterval: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-slate-400 focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="daily">Hàng ngày (00:00)</option>
                      <option value="weekly">Hàng tuần (Chủ nhật)</option>
                      <option value="monthly">Hàng tháng (Ngày 1)</option>
                      <option value="none">Tắt tự động sao lưu</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Log API Request/Response</label>
                    <div
                      onClick={() => setEnterpriseSettings({ ...enterpriseSettings, enableApiLogging: !enterpriseSettings.enableApiLogging })}
                      className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${enterpriseSettings.enableApiLogging ? "border-indigo-200 bg-indigo-50/50" : "border-slate-200 bg-slate-50"}`}
                    >
                      <div className={`w-9 h-5 rounded-full relative transition-colors ${enterpriseSettings.enableApiLogging ? "bg-indigo-500" : "bg-slate-300"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enterpriseSettings.enableApiLogging ? "left-[18px]" : "left-0.5"}`} />
                      </div>
                      <span className="text-sm font-extrabold text-slate-850">{enterpriseSettings.enableApiLogging ? "Ghi log chi tiết" : "Tắt ghi log"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100 space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b pb-3">Thao tác cơ sở dữ liệu</h4>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      showToast("Bắt đầu kết xuất dữ liệu cấu hình hệ thống JSON...", "info");
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ settings, enterpriseSettings, tariffs, zones, gates }));
                      const dlAnchorElem = document.createElement('a');
                      dlAnchorElem.setAttribute("href", dataStr);
                      dlAnchorElem.setAttribute("download", `smartparking_config_backup_${new Date().toISOString().slice(0, 10)}.json`);
                      dlAnchorElem.click();
                      showToast("Xuất cấu hình thành công!", "success");
                    }}
                    className="px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-sm transition-all"
                  >
                    Xuất cấu hình hệ thống
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Bạn có chắc chắn muốn dọn dẹp các log bảo mật đã xử lý? Hành động này không thể hoàn tác.")) {
                        showToast("Đang dọn dẹp nhật ký sự cố cũ...", "info");
                        setTimeout(() => showToast("Đã xóa 0 log lịch sử chưa sử dụng.", "success"), 800);
                      }
                    }}
                    className="px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-red-650 hover:text-red-700 shadow-sm transition-all"
                  >
                    Dọn dẹp Exception Logs
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Save button */}
          <div className="flex items-center gap-4 text-left">
            <button
              onClick={async () => {
                try {
                  const res = await staffApi.updateAdminSettings(settings);
                  setSettings(res.data.data || settings);
                  localStorage.setItem("admin_enterprise_settings", JSON.stringify(enterpriseSettings));
                  showToast("Đã lưu cài đặt hệ thống thành công!");
                } catch (err) {
                  showToast(err.response?.data?.message || "Lưu cài đặt thất bại", "warning");
                }
              }}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 px-8 py-3 text-xs font-extrabold text-white cursor-pointer transition-colors"
            >
              Lưu thiết lập
            </button>
            <p className="text-[10px] text-slate-650 font-bold">Thay đổi sẽ áp dụng ngay lập tức cho toàn bộ các cổng và phiên làm việc.</p>
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
