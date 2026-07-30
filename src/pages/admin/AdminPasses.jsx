import React from "react";

const LicensePlate = ({ plate }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono font-bold text-slate-800 shadow-sm text-xs tracking-widest">
    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block mr-1"></span>
    {plate}
  </span>
);

// Ánh xạ trạng thái vé → nhãn + màu. CANCELLED (vé bị Admin hủy/soft-delete) hiển thị
// riêng "Đã hủy" (xám) thay vì gộp chung "Hết hạn" như trước.
const PASS_STATUS_STYLE = {
  active: { label: "Còn hạn", dot: "bg-emerald-500", cls: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "Đã hủy", dot: "bg-slate-400", cls: "bg-slate-100 text-slate-600" },
  pending_payment: { label: "Chờ thanh toán", dot: "bg-amber-500", cls: "bg-amber-50 text-amber-700" },
};
const passStatusStyle = (status) =>
  PASS_STATUS_STYLE[status] || { label: "Hết hạn", dot: "bg-red-500", cls: "bg-red-50 text-red-700" };

export default function AdminPasses({
  passes,
  handleOpenAddPass,
  handleOpenEditPass,
  handleRenewPass,
  handleDeletePass,
  handleReactivatePass,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 space-y-6">
      <div className="flex justify-between items-center text-left">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base">Quản lý vé định kỳ (Tháng / Quý / Năm)</h3>
          <p className="text-xs text-slate-400">Kiểm soát vé định kỳ theo tháng, quý, năm cho biển số đăng ký và cấp quyền ra vào tự động.</p>
        </div>
        <button onClick={handleOpenAddPass} className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors shadow-lg shadow-purple-500/10">
          Phát hành vé định kỳ mới
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
            <tr>
              <th className="p-4">Chủ sở hữu</th>
              <th className="p-4">Đăng ký Biển số</th>
              <th className="p-4">Loại xe</th>
              <th className="p-4">Gói vé</th>
              <th className="p-4">Thời điểm cấp</th>
              <th className="p-4">Hạn sử dụng</th>
              <th className="p-4">Tình trạng</th>
              <th className="p-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
            {passes.map(p => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-bold text-slate-900">{p.owner}</td>
                <td className="p-4">
                  <LicensePlate plate={p.plate} />
                </td>
                <td className="p-4 font-bold text-slate-500">{p.type}</td>
                <td className="p-4 font-bold text-slate-500">{p.passType === "YEARLY" ? "Vé năm" : p.passType === "QUARTERLY" ? "Vé quý" : "Vé tháng"}</td>
                <td className="p-4 text-slate-500 font-mono">{p.start}</td>
                <td className="p-4 text-slate-500 font-mono">{p.end}</td>
                <td className="p-4">
                  {(() => {
                    const s = passStatusStyle(p.status);
                    return (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    );
                  })()}
                </td>
                <td className="p-4">
                  <div className="flex justify-center gap-2">
                    {p.status === "cancelled" ? (
                      // Vé đã hủy: chỉ còn 1 hành động — kích hoạt lại (không xóa cứng khỏi DB)
                      <button onClick={() => handleReactivatePass(p.id)} className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 cursor-pointer transition-colors">Kích hoạt lại</button>
                    ) : (
                      <>
                        <button onClick={() => handleRenewPass(p.id)} className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 cursor-pointer transition-colors">Gia hạn {p.passType === "YEARLY" ? "1 năm" : p.passType === "QUARTERLY" ? "1 quý" : "1 tháng"}</button>
                        {/* Vé ACTIVE (còn hạn) = hợp đồng đã chốt → KHÔNG cho Sửa. Chỉ vé chưa chốt mới cho sửa. */}
                        {p.status !== "active" && (
                          <button onClick={() => handleOpenEditPass(p)} className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 cursor-pointer transition-colors">Sửa</button>
                        )}
                        <button onClick={() => handleDeletePass(p.id, p.plate)} className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold border border-amber-200 cursor-pointer transition-colors">Hủy</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
