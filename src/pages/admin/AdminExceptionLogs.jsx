import React, { useEffect, useState } from "react";
import { staffApi } from "../../api/parkingApi";

const EXCEPTION_LABELS = {
  LOST_TICKET: "Mất thẻ / mất QR",
  WRONG_PLATE: "Sai biển số",
  OVERTIME: "Quá giờ",
  WRONG_ZONE: "Sai khu vực",
  UNPAID: "Chưa thanh toán",
  SUSPICIOUS_BEHAVIOR: "Hành vi đáng ngờ",
  OTHER: "Khác",
};

const BADGE_COLOR = {
  LOST_TICKET: "bg-amber-50 text-amber-700 border-amber-200",
  WRONG_PLATE: "bg-red-50 text-red-700 border-red-200",
  OVERTIME: "bg-orange-50 text-orange-700 border-orange-200",
  WRONG_ZONE: "bg-purple-50 text-purple-700 border-purple-200",
  UNPAID: "bg-rose-50 text-rose-700 border-rose-200",
  SUSPICIOUS_BEHAVIOR: "bg-red-50 text-red-800 border-red-300",
  OTHER: "bg-slate-100 text-slate-600 border-slate-200",
};

const formatTime = (v) => (v ? new Date(v).toLocaleString("vi-VN") : "—");

export default function AdminExceptionLogs({ showToast, user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchText, setSearchText] = useState("");

  // Create / Edit form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    exceptionType: "LOST_TICKET",
    description: "",
    licensePlate: "",
  });

  // Resolve modal
  const [resolvingLog, setResolvingLog] = useState(null);
  const [resolveNote, setResolveNote] = useState("");
  const [resolvingSubmitting, setResolvingSubmitting] = useState(false);

  // Detail modal
  const [viewingLog, setViewingLog] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await staffApi.getSecurityExceptions();
      const sorted = (res.data.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setLogs(sorted);
    } catch (err) {
      console.warn("Failed to load exception logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const resetForm = () => {
    setForm({ exceptionType: "LOST_TICKET", description: "", licensePlate: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) { showToast("Vui lòng nhập mô tả sự cố", "warning"); return; }
    if (!user?.id) { showToast("Thiếu thông tin người dùng", "warning"); return; }
    setSubmitting(true);
    try {
      const payload = {
        exceptionType: form.exceptionType,
        description: form.description.trim(),
        licensePlate: form.licensePlate.trim().toUpperCase() || undefined,
        handledByUserId: user.id,
      };
      if (editingId) {
        await staffApi.updateSecurityException(editingId, payload);
        showToast("Đã cập nhật sự cố", "success");
      } else {
        await staffApi.logSecurityException(payload);
        showToast("Đã ghi nhận sự cố mới", "success");
      }
      resetForm();
      fetchLogs();
    } catch (err) {
      showToast(err.response?.data?.message || "Thao tác thất bại", "warning");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (log) => {
    setEditingId(log.id);
    setForm({
      exceptionType: log.exceptionType || "OTHER",
      description: log.description || "",
      licensePlate: log.licensePlate || "",
    });
    setShowForm(true);
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!user?.id) { showToast("Thiếu thông tin người dùng", "warning"); return; }
    setResolvingSubmitting(true);
    try {
      await staffApi.resolveSecurityException(resolvingLog.id, {
        handledByUserId: user.id,
        resolutionNote: resolveNote.trim() || undefined,
      });
      showToast("Đã giải quyết sự cố!", "success");
      setResolvingLog(null);
      setResolveNote("");
      fetchLogs();
    } catch (err) {
      showToast(err.response?.data?.message || "Giải quyết thất bại", "warning");
    } finally {
      setResolvingSubmitting(false);
    }
  };

  const filtered = logs.filter((log) => {
    const matchType = filterType === "all" || log.exceptionType === filterType;
    const matchStatus = filterStatus === "all"
      || (filterStatus === "pending" && log.status !== "RESOLVED")
      || (filterStatus === "resolved" && log.status === "RESOLVED");
    const matchSearch = !searchText
      || (log.description || "").toLowerCase().includes(searchText.toLowerCase())
      || (log.licensePlate || "").toLowerCase().includes(searchText.toLowerCase());
    return matchType && matchStatus && matchSearch;
  });

  return (
    <div className="space-y-5">
      {/* Header + Create button */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-slate-400">Quản lý tất cả nhật ký sự cố an ninh trong hệ thống.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors shadow-lg shadow-red-500/10"
        >
          Ghi nhận sự cố mới
        </button>
      </div>

      {/* Inline Create/Edit Form */}
      {showForm && (
        <div className="rounded-2xl border border-red-200 bg-red-50/30 p-5 space-y-4">
          <h4 className="text-sm font-extrabold text-slate-900">
            {editingId ? " Chỉnh sửa sự cố" : " Ghi nhận sự cố mới"}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Loại sự cố</label>
                <select
                  value={form.exceptionType}
                  onChange={(e) => setForm({ ...form, exceptionType: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-800 focus:outline-none focus:border-slate-400"
                >
                  {Object.entries(EXCEPTION_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Biển số xe (tuỳ chọn)</label>
                <input
                  type="text"
                  value={form.licensePlate}
                  onChange={(e) => setForm({ ...form, licensePlate: e.target.value })}
                  placeholder="VD: 30A-12345"
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-800 focus:outline-none uppercase font-mono"
                />
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" disabled={submitting}
                  className="flex-1 rounded-xl bg-red-600 text-white py-3 text-xs font-bold cursor-pointer transition-colors disabled:opacity-50">
                  {submitting ? "Đang lưu..." : editingId ? " Lưu chỉnh sửa" : " Ghi nhận"}
                </button>
                <button type="button" onClick={resetForm}
                  className="rounded-xl border border-slate-200 bg-white py-3 px-4 text-xs font-bold text-slate-500 cursor-pointer hover:bg-slate-50">
                  Hủy
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Mô tả chi tiết sự cố</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows="3"
                placeholder="Ghi rõ tình huống xảy ra..."
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-800 focus:outline-none"
              />
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder=" Tìm theo mô tả hoặc biển số..."
          className="flex-1 min-w-[200px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-700 focus:outline-none"
        />
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 focus:outline-none min-w-[130px]">
          <option value="all">Tất cả loại</option>
          {Object.entries(EXCEPTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 focus:outline-none min-w-[140px]">
          <option value="all">Tất cả trạng thái</option>
          <option value="pending"> Đang xử lý</option>
          <option value="resolved"> Đã giải quyết</option>
        </select>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-3">
        <span className="rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-bold text-blue-600">
          Tổng: {logs.length}
        </span>
        <span className="rounded-full bg-amber-50 border border-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
          Đang xử lý: {logs.filter(l => l.status !== "RESOLVED").length}
        </span>
        <span className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
          Đã giải quyết: {logs.filter(l => l.status === "RESOLVED").length}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-center text-sm text-slate-400 py-8">Đang tải danh sách sự cố...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-8">Không tìm thấy sự cố nào phù hợp.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th className="p-4">Loại sự cố</th>
                <th className="p-4">Biển số</th>
                <th className="p-4">Mô tả</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4">Người xử lý</th>
                <th className="p-4">Thời gian tạo</th>
                <th className="p-4">Thời gian giải quyết</th>
                <th className="p-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
              {filtered.map((log) => {
                const isResolved = log.status === "RESOLVED";
                return (
                  <tr key={log.id} className={`hover:bg-slate-50/50 transition-colors ${isResolved ? "opacity-60" : ""}`}>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${BADGE_COLOR[log.exceptionType] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                        {EXCEPTION_LABELS[log.exceptionType] || log.exceptionType}
                      </span>
                    </td>
                    <td className="p-4">
                      {log.licensePlate ? (
                        <span className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2 py-0.5 font-mono text-[10px] font-black tracking-wider text-slate-900 shadow-sm">
                          {log.licensePlate}
                        </span>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="p-4 max-w-[250px]">
                      <p className="text-xs text-slate-700 truncate" title={log.description}>{log.description || "—"}</p>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase border ${isResolved
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${isResolved ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                        {isResolved ? "Đã giải quyết" : "Đang xử lý"}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500">{log.handledBy || "—"}</td>
                    <td className="p-4 text-xs text-slate-500 font-mono">{formatTime(log.createdAt)}</td>
                    <td className="p-4 text-xs text-slate-500 font-mono">{formatTime(log.resolvedAt)}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => setViewingLog(log)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                        >Chi tiết</button>
                        {!isResolved && (
                          <>
                            <button
                              onClick={() => handleEdit(log)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-100 cursor-pointer transition-colors"
                            >Sửa</button>
                            <button
                              onClick={() => { setResolvingLog(log); setResolveNote(""); }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-100 cursor-pointer transition-colors"
                            >Giải quyết</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Resolve Modal */}
      {resolvingLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-left border border-slate-200">
            <h3 className="font-extrabold text-slate-900 text-base"> Giải quyết sự cố</h3>
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 space-y-2">
              <div className="flex gap-2 items-center">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${BADGE_COLOR[resolvingLog.exceptionType] || ""}`}>
                  {EXCEPTION_LABELS[resolvingLog.exceptionType] || resolvingLog.exceptionType}
                </span>
                {resolvingLog.licensePlate && (
                  <span className="font-mono text-xs font-bold text-slate-800">{resolvingLog.licensePlate}</span>
                )}
              </div>
              <p className="text-xs text-slate-600">{resolvingLog.description}</p>
            </div>
            <form onSubmit={handleResolve} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Ghi chú giải quyết (tuỳ chọn)</label>
                <textarea
                  rows="3"
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  placeholder="Mô tả cách xử lý, biện pháp áp dụng..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-800 focus:outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setResolvingLog(null)} disabled={resolvingSubmitting}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-500 cursor-pointer hover:bg-slate-100">
                  Hủy
                </button>
                <button type="submit" disabled={resolvingSubmitting}
                  className="flex-1 rounded-xl bg-emerald-600 text-white py-3 text-xs font-bold cursor-pointer transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/10">
                  {resolvingSubmitting ? "Đang lưu..." : " Xác nhận giải quyết"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {viewingLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingLog(null)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-left border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-slate-900 text-base"> Chi tiết sự cố</h3>
              <button onClick={() => setViewingLog(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer text-lg font-bold">✕</button>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${BADGE_COLOR[viewingLog.exceptionType] || ""}`}>
                  {EXCEPTION_LABELS[viewingLog.exceptionType] || viewingLog.exceptionType}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${viewingLog.status === "RESOLVED"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                  {viewingLog.status === "RESOLVED" ? " Đã giải quyết" : " Đang xử lý"}
                </span>
              </div>
              {viewingLog.licensePlate && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Biển số:</span>
                  <span className="font-mono text-sm font-black text-slate-900">{viewingLog.licensePlate}</span>
                </div>
              )}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Mô tả:</span>
                <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 rounded-xl p-3 border border-slate-100">{viewingLog.description || "—"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Người xử lý</span>
                  <p className="font-bold text-slate-800 mt-0.5">{viewingLog.handledBy || "—"}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Tạo lúc</span>
                  <p className="font-mono text-slate-600 mt-0.5">{formatTime(viewingLog.createdAt)}</p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Giải quyết lúc</span>
                  <p className="font-mono text-slate-600 mt-0.5">{formatTime(viewingLog.resolvedAt)}</p>
                </div>
              </div>
              {viewingLog.imageUrls && viewingLog.imageUrls.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Ảnh đính kèm:</span>
                  <div className="flex flex-wrap gap-2">
                    {viewingLog.imageUrls.map((url, i) => (
                      <img key={i} src={url.replace("[RESOLVE]", "")} alt={`Evidence ${i + 1}`}
                        className="h-20 w-auto object-cover rounded-lg border border-slate-200 shadow-sm" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
