import React, { useEffect, useState } from "react";
import { staffApi } from "../../api/parkingApi";

const REASON_LABELS = {
  STOLEN: "Xe trộm cắp",
  DISTURBANCE: "Gây rối / nguy cơ an ninh",
  UNPAID_FEE: "Nợ phí / chưa thanh toán",
  SECURITY_RISK: "Rủi ro an ninh",
  OTHER: "Lý do khác",
};

export default function AdminBlacklist({ showToast, user }) {
  const [blacklist, setBlacklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Create / Edit
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    licensePlate: "",
    reason: "STOLEN",
    description: "",
  });

  const fetchBlacklist = async () => {
    setLoading(true);
    try {
      const res = await staffApi.getBlacklist();
      setBlacklist(res.data.data || []);
    } catch (err) {
      console.warn("Failed to fetch blacklist:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBlacklist(); }, []);

  const resetForm = () => {
    setForm({ licensePlate: "", reason: "STOLEN", description: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.licensePlate.trim()) { showToast("Vui lòng nhập biển số xe", "warning"); return; }
    if (!user?.id) { showToast("Thiếu thông tin người dùng", "warning"); return; }
    setSubmitting(true);
    try {
      const payload = {
        licensePlate: form.licensePlate.trim().toUpperCase(),
        reason: form.reason,
        description: form.description.trim() || form.reason,
        addedByUserId: user.id,
      };
      if (editingId) {
        await staffApi.updateBlacklistPlate(editingId, payload);
        showToast("Đã cập nhật blacklist", "success");
      } else {
        await staffApi.addBlacklistPlate(payload);
        showToast("Đã thêm biển số vào blacklist", "success");
      }
      resetForm();
      fetchBlacklist();
    } catch (err) {
      showToast(err.response?.data?.message || "Thao tác thất bại", "warning");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setForm({
      licensePlate: item.licensePlate || "",
      reason: item.reason || "OTHER",
      description: item.description || "",
    });
    setShowForm(true);
  };

  const handleRemove = async (id, plate) => {
    if (!window.confirm(`Xác nhận gỡ biển số ${plate} khỏi blacklist?`)) return;
    try {
      await staffApi.removeBlacklistPlate(id, {
        removedByUserId: user?.id,
        reason: "Admin gỡ chặn",
      });
      showToast("Đã gỡ biển số khỏi blacklist", "success");
      fetchBlacklist();
    } catch (err) {
      showToast(err.response?.data?.message || "Gỡ cấm thất bại", "warning");
    }
  };

  const filtered = blacklist.filter((item) => {
    const matchSearch = !searchText
      || (item.licensePlate || "").toLowerCase().includes(searchText.toLowerCase())
      || (item.description || "").toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = filterStatus === "all"
      || (filterStatus === "active" && item.isActive !== false)
      || (filterStatus === "removed" && item.isActive === false);
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      {/* Header + Create button */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-slate-400">Quản lý toàn bộ biển số xe bị cấm ra/vào bãi đỗ.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors shadow-lg shadow-red-500/10"
        >
          Thêm biển số blacklist
        </button>
      </div>

      {/* Inline Create/Edit Form */}
      {showForm && (
        <div className="rounded-2xl border border-red-200 bg-red-50/30 p-5 space-y-4">
          <h4 className="text-sm font-extrabold text-slate-900">
            {editingId ? " Chỉnh sửa blacklist" : " Thêm biển số vào blacklist"}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Biển số xe</label>
                <input
                  type="text"
                  required
                  value={form.licensePlate}
                  onChange={(e) => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })}
                  placeholder="VD: 30A-12345"
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold text-slate-800 focus:outline-none uppercase font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Lý do cấm</label>
                <select
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-800 focus:outline-none"
                >
                  {Object.entries(REASON_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" disabled={submitting}
                  className="flex-1 rounded-xl bg-red-600 text-white py-3 text-xs font-bold cursor-pointer transition-colors disabled:opacity-50">
                  {submitting ? "Đang lưu..." : editingId ? " Lưu" : " Thêm"}
                </button>
                <button type="button" onClick={resetForm}
                  className="rounded-xl border border-slate-200 bg-white py-3 px-4 text-xs font-bold text-slate-500 cursor-pointer hover:bg-slate-50">
                  Hủy
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Mô tả chi tiết (tuỳ chọn)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows="2"
                placeholder="Nhập thông tin chi tiết sự cố, biên bản hoặc hình thức xử phạt..."
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
          placeholder=" Tìm theo biển số hoặc mô tả..."
          className="flex-1 min-w-[200px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-700 focus:outline-none"
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 focus:outline-none min-w-[140px]">
          <option value="all">Tất cả trạng thái</option>
          <option value="active"> Đang chặn</option>
          <option value="removed"> Đã gỡ</option>
        </select>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-3">
        <span className="rounded-full bg-red-50 border border-red-100 px-3 py-1 text-xs font-bold text-red-700">
          Đang chặn: {blacklist.filter(item => item.isActive !== false).length}
        </span>
        <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-500">
          Đã gỡ: {blacklist.filter(item => item.isActive === false).length}
        </span>
        <span className="rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-bold text-blue-600">
          Tổng: {blacklist.length}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-center text-sm text-slate-400 py-8">Đang tải danh sách blacklist...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-8">Không tìm thấy biển số nào.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
              <tr>
                <th className="p-4">Biển số</th>
                <th className="p-4">Lý do cấm</th>
                <th className="p-4">Mô tả</th>
                <th className="p-4">Người thêm</th>
                <th className="p-4">Ngày thêm</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-600">
              {filtered.map((item) => (
                <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors ${item.isActive === false ? "opacity-45" : ""}`}>
                  <td className="p-4">
                    <span className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2 py-0.5 font-mono text-xs font-black tracking-wider text-slate-900 shadow-sm">
                      {item.licensePlate}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-slate-900 text-xs">
                      {REASON_LABELS[item.reason] || item.reason || "—"}
                    </span>
                  </td>
                  <td className="p-4 max-w-[200px]">
                    <p className="text-xs text-slate-500 truncate" title={item.description}>{item.description || "—"}</p>
                  </td>
                  <td className="p-4 text-xs font-bold text-slate-800">{item.addedBy || "Hệ thống"}</td>
                  <td className="p-4 text-xs text-slate-500 font-mono">
                    {item.addedAt ? new Date(item.addedAt).toLocaleString("vi-VN") : "—"}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase border ${item.isActive !== false
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${item.isActive !== false ? "bg-red-500" : "bg-slate-400"}`} />
                      {item.isActive !== false ? "Đang chặn" : "Đã gỡ"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      {item.isActive !== false && (
                        <>
                          <button
                            onClick={() => handleEdit(item)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-100 cursor-pointer transition-colors"
                          >Sửa</button>
                          <button
                            onClick={() => handleRemove(item.id, item.licensePlate)}
                            className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 cursor-pointer transition-colors"
                          > Gỡ chặn</button>
                        </>
                      )}
                      {item.isActive === false && (
                        <span className="text-xs text-slate-400 font-semibold">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
