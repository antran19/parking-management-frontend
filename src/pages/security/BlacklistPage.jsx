import React, { useEffect, useState } from "react";
import { staffApi } from "../../api/parkingApi";

// ==============================================================
// CONSTANTS — Labels nhãn cho lý do blacklist
// ==============================================================
export const REASON_LABELS = {
  STOLEN: "Xe trộm cắp",
  DISTURBANCE: "Gây rối / nguy cơ an ninh",
  UNPAID_FEE: "Nợ phí / chưa thanh toán",
  SECURITY_RISK: "Rủi ro an ninh",
  OTHER: "Khác",
};

// Định dạng thời gian sang tiếng Việt
export const formatTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN");
};

// Component hiển thị biển số xe (giống project cũ)
export const LicensePlate = ({ plate }) => (
  <span className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2.5 py-1 font-mono text-xs font-black tracking-widest text-slate-900 shadow-sm">
    <span className="mr-1.5 h-2 w-2 rounded-full bg-blue-600" />
    {plate || "—"}
  </span>
);

// Panel container dùng chung
export function Panel({ title, children, className }) {
  return (
    <div className={`action-panel-item rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className || ""}`}>
      <h3 className="mb-5 text-base font-bold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

// Field label wrapper cho form
export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      {children}
    </label>
  );
}

// Empty state placeholder
export function Empty({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-400">
      {text}
    </div>
  );
}

// ==============================================================
// COMPONENT CHÍNH — Quản lý danh sách đen (Blacklist)
// ==============================================================
export default function BlacklistPage({ showToast, user }) {
  const [blacklist, setBlacklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingBlacklist, setSubmittingBlacklist] = useState(false);

  // State form thêm biển số mới vào blacklist
  const [blacklistForm, setBlacklistForm] = useState({
    licensePlate: "",
    reason: "STOLEN",
    description: "",
  });

  // State filter/search để lọc danh sách
  const [searchText, setSearchText] = useState("");
  const [filterActive, setFilterActive] = useState("all"); // "all" | "active" | "removed"

  // Lấy danh sách blacklist từ backend
  const fetchBlacklist = async () => {
    setLoading(true);
    try {
      const res = await staffApi.getBlacklist();
      setBlacklist(res.data.data || []);
    } catch (err) {
      console.error("Fetch blacklist error:", err);
      showToast(err.response?.data?.message || "Không tải được danh sách đen.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlacklist();
  }, []);

  // Thêm biển số vào blacklist
  const addBlacklist = async (e) => {
    e.preventDefault();
    if (!blacklistForm.licensePlate.trim()) {
      showToast("Vui lòng nhập biển số", "error");
      return;
    }
    if (!user?.id) {
      showToast("Thiếu thông tin người dùng, vui lòng đăng nhập lại.", "error");
      return;
    }

    setSubmittingBlacklist(true);
    try {
      await staffApi.addBlacklistPlate({
        licensePlate: blacklistForm.licensePlate.trim().toUpperCase(),
        reason: blacklistForm.reason,
        description: blacklistForm.description || REASON_LABELS[blacklistForm.reason],
        addedByUserId: user.id,
      });
      // Reset form sau khi thêm thành công
      setBlacklistForm({ licensePlate: "", reason: "STOLEN", description: "" });
      showToast("Đã thêm biển số vào blacklist", "success");
      fetchBlacklist();
    } catch (err) {
      console.error("Add blacklist failed:", err);
      showToast(err.response?.data?.message || "Thêm blacklist thất bại", "error");
    } finally {
      setSubmittingBlacklist(false);
    }
  };

  // Lưu ý: Chức năng gỡ blacklist chỉ dành cho Manager/Admin
  // Security chỉ có quyền thêm biển số vào danh sách đen

  // Lọc danh sách theo search và trạng thái
  const filteredBlacklist = blacklist.filter((item) => {
    const matchSearch =
      !searchText ||
      (item.licensePlate || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(searchText.toLowerCase());

    const matchStatus =
      filterActive === "all" ||
      (filterActive === "active" && item.isActive !== false) ||
      (filterActive === "removed" && item.isActive === false);

    return matchSearch && matchStatus;
  });

  // Số liệu tổng hợp
  const activeCount = blacklist.filter((p) => p.isActive !== false).length;
  const removedCount = blacklist.filter((p) => p.isActive === false).length;

  return (
    <div className="space-y-6 mt-8">
      {/* Summary badges */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-red-50 border border-red-100 px-4 py-1.5 text-sm font-bold text-red-700">
          🚫 Đang chặn: {activeCount}
        </span>
        <span className="rounded-full bg-slate-100 border border-slate-200 px-4 py-1.5 text-sm font-bold text-slate-500">
          ✅ Đã gỡ: {removedCount}
        </span>
        <span className="rounded-full bg-blue-50 border border-blue-100 px-4 py-1.5 text-sm font-bold text-blue-600">
          📋 Tổng cộng: {blacklist.length}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        {/* ── Form thêm blacklist ── */}
        <Panel title="➕ Thêm biển số blacklist">
          <form onSubmit={addBlacklist} className="space-y-4">
            <Field label="Biển số xe">
              <input
                value={blacklistForm.licensePlate}
                onChange={(e) => setBlacklistForm({ ...blacklistForm, licensePlate: e.target.value.toUpperCase() })}
                placeholder="VD: 29A-666.66"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono font-bold text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </Field>
            <Field label="Lý do">
              <select
                value={blacklistForm.reason}
                onChange={(e) => setBlacklistForm({ ...blacklistForm, reason: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              >
                {Object.entries(REASON_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
            <Field label="Mô tả chi tiết">
              <textarea
                value={blacklistForm.description}
                onChange={(e) => setBlacklistForm({ ...blacklistForm, description: e.target.value })}
                rows="4"
                placeholder="Ghi rõ lý do, biên bản, tình huống..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </Field>
            <button
              disabled={submittingBlacklist}
              className="w-full rounded-xl bg-red-600 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-red-600/20 hover:bg-red-700 disabled:opacity-60 transition-colors"
            >
              {submittingBlacklist ? "Đang lưu..." : "Thêm vào blacklist"}
            </button>
          </form>
        </Panel>

        {/* ── Danh sách blacklist từ database ── */}
        <Panel title="🚫 Danh sách đen từ database">
          {/* Thanh tìm kiếm + filter */}
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Tìm biển số hoặc mô tả..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
            />
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-600 outline-none"
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang chặn</option>
              <option value="removed">Đã gỡ</option>
            </select>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-slate-400">Đang tải danh sách đen...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="p-3">Biển số</th>
                    <th className="p-3">Lý do</th>
                    <th className="p-3">Ngày thêm</th>
                    <th className="p-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBlacklist.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/50 transition-colors ${item.isActive === false ? "opacity-45" : ""}`}
                    >
                      <td className="p-3"><LicensePlate plate={item.licensePlate} /></td>
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{REASON_LABELS[item.reason] || item.reason}</p>
                        <p className="mt-1 max-w-xs text-xs text-slate-500">{item.description}</p>
                      </td>
                      <td className="p-3 text-xs font-semibold text-slate-500">{formatTime(item.addedAt)}</td>
                      <td className="p-3">
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${item.isActive === false ? "bg-slate-100 text-slate-500 border border-slate-200" : "bg-red-50 text-red-700 border border-red-100"}`}>
                          {item.isActive === false ? "Đã gỡ" : "Đang chặn"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filteredBlacklist.length && (
                <Empty text={searchText ? "Không tìm thấy biển số phù hợp." : "Chưa có biển số nào trong blacklist."} />
              )}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
