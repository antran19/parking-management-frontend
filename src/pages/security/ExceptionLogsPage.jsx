import React, { useEffect, useState } from "react";
import { staffApi } from "../../api/parkingApi";

// ==============================================================
// CONSTANTS — Nhãn hiển thị cho từng loại sự cố an ninh
// ==============================================================
const EXCEPTION_LABELS = {
  LOST_TICKET: "Mất thẻ / mất QR",
  WRONG_PLATE: "Sai biển số",
  OVERTIME: "Quá giờ",
  WRONG_ZONE: "Sai khu vực",
  UNPAID: "Chưa thanh toán",
  SUSPICIOUS_BEHAVIOR: "Hành vi đáng ngờ",
  OTHER: "Khác",
};

// Badge màu theo loại sự cố (để dễ phân biệt mức độ)
const EXCEPTION_BADGE_COLOR = {
  LOST_TICKET: "bg-amber-50 text-amber-700 border-amber-100",
  WRONG_PLATE: "bg-red-50 text-red-700 border-red-100",
  OVERTIME: "bg-orange-50 text-orange-700 border-orange-100",
  WRONG_ZONE: "bg-purple-50 text-purple-700 border-purple-100",
  UNPAID: "bg-rose-50 text-rose-700 border-rose-100",
  SUSPICIOUS_BEHAVIOR: "bg-red-50 text-red-800 border-red-200",
  OTHER: "bg-slate-100 text-slate-600 border-slate-200",
};

// Định dạng thời gian sang locale tiếng Việt
const formatTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN");
};

// Panel container — giống hệt các trang khác trong Security
function Panel({ title, children, className }) {
  return (
    <div className={`action-panel-item rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className || ""}`}>
      <h3 className="mb-5 text-base font-bold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

// Field label wrapper cho form
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      {children}
    </label>
  );
}

// Empty state khi không có dữ liệu
function Empty({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-400">
      {text}
    </div>
  );
}

// ==============================================================
// COMPONENT CHÍNH — Trang ghi nhận sự cố an ninh (Exception Logs)
// ==============================================================
export default function ExceptionLogsPage({ showToast, user }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // State filter để lọc danh sách sự cố
  const [filterType, setFilterType] = useState("all");
  const [searchText, setSearchText] = useState("");

  // Form ghi nhận sự cố mới
  const [form, setForm] = useState({
    exceptionType: "LOST_TICKET",
    description: "",
    sessionId: "",
    licensePlate: "",
  });

  // Lấy danh sách sự cố từ backend
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await staffApi.getSecurityExceptions();
      setLogs(res.data.data || []);
    } catch (err) {
      console.error("Fetch exception logs error:", err);
      showToast(err.response?.data?.message || "Không tải được danh sách sự cố.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Ghi nhận sự cố mới vào DB
  const submitException = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) {
      showToast("Vui lòng nhập mô tả sự cố", "error");
      return;
    }
    if (!user?.id) {
      showToast("Thiếu thông tin người dùng, vui lòng đăng nhập lại.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await staffApi.logSecurityException({
        exceptionType: form.exceptionType,
        description: form.description.trim(),
        // Chỉ gửi sessionId nếu người dùng có nhập (không bắt buộc)
        ...(form.sessionId.trim() && { sessionId: form.sessionId.trim() }),
        // Chỉ gửi licensePlate nếu có nhập
        ...(form.licensePlate.trim() && { licensePlate: form.licensePlate.trim().toUpperCase() }),
        handledByUserId: user.id,
      });
      // Reset form sau khi ghi nhận thành công
      setForm({ exceptionType: "LOST_TICKET", description: "", sessionId: "", licensePlate: "" });
      showToast("✅ Đã ghi nhận sự cố an ninh", "success");
      fetchLogs();
    } catch (err) {
      console.error("Log exception failed:", err);
      showToast(err.response?.data?.message || "Ghi nhận sự cố thất bại", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Lọc danh sách sự cố theo type + search text
  const filteredLogs = logs.filter((log) => {
    const matchType = filterType === "all" || log.exceptionType === filterType;
    const matchSearch =
      !searchText ||
      (log.description || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (log.session?.licensePlate || log.licensePlate || "").toLowerCase().includes(searchText.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] mt-8">
      {/* ── Form ghi nhận sự cố mới ── */}
      <Panel title="📝 Ghi nhận sự cố mới">
        <form onSubmit={submitException} className="space-y-4">
          <Field label="Loại sự cố">
            <select
              value={form.exceptionType}
              onChange={(e) => setForm({ ...form, exceptionType: e.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            >
              {Object.entries(EXCEPTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>

          <Field label="Mô tả chi tiết sự cố">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows="5"
              placeholder="Ghi rõ tình huống xảy ra, xe liên quan, cách xử lý ban đầu..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </Field>

          <Field label="Biển số xe (tuỳ chọn)">
            <input
              value={form.licensePlate}
              onChange={(e) => setForm({ ...form, licensePlate: e.target.value.toUpperCase() })}
              placeholder="VD: 29A-666.66"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm font-bold text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </Field>

          <Field label="ID Phiên gửi xe (tuỳ chọn)">
            <input
              value={form.sessionId}
              onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
              placeholder="Nhập session ID nếu có (để truy vết camera)"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-mono font-medium text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </Field>

          <button
            disabled={submitting}
            className="w-full rounded-xl bg-red-600 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-red-600/20 hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {submitting ? "Đang lưu..." : "Ghi nhận sự cố"}
          </button>
        </form>

        {/* Hướng dẫn nhanh */}
        <div className="mt-6 rounded-xl bg-amber-50 border border-amber-100 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-amber-600 mb-2">📋 Lưu ý</p>
          <ul className="space-y-1 text-xs text-amber-700 font-medium">
            <li>• Ghi nhận ngay khi phát hiện sự cố</li>
            <li>• Biển số và Session ID giúp truy vết qua camera</li>
            <li>• Mọi sự cố đều được lưu vào database thật</li>
          </ul>
        </div>
      </Panel>

      {/* ── Danh sách sự cố đã ghi nhận ── */}
      <Panel title="📋 Danh sách sự cố an ninh">
        {/* Thanh filter + search */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Tìm theo mô tả hoặc biển số..."
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-600 outline-none"
          >
            <option value="all">Tất cả loại</option>
            {Object.entries(EXCEPTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Đếm số kết quả */}
        {!loading && (
          <p className="mb-3 text-xs text-slate-400 font-semibold">
            Hiển thị {filteredLogs.length}/{logs.length} sự cố
          </p>
        )}

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-400">Đang tải danh sách sự cố...</div>
        ) : !filteredLogs.length ? (
          <Empty text={searchText || filterType !== "all" ? "Không tìm thấy sự cố phù hợp." : "Chưa có sự cố nào được ghi nhận."} />
        ) : (
          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            {filteredLogs.map((log, idx) => (
              <div
                key={log.id || idx}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    {/* Loại sự cố với badge màu */}
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border mb-2 ${EXCEPTION_BADGE_COLOR[log.exceptionType] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {EXCEPTION_LABELS[log.exceptionType] || log.exceptionType}
                    </span>
                    <p className="text-sm font-medium leading-relaxed text-slate-700">
                      {log.description || "—"}
                    </p>
                  </div>
                  {/* Biển số xe nếu có liên kết session hoặc trường riêng */}
                  {(log.session?.licensePlate || log.licensePlate) && (
                    <span className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2 py-1 font-mono text-xs font-black tracking-widest text-slate-900 shadow-sm flex-shrink-0">
                      <span className="mr-1 h-2 w-2 rounded-full bg-blue-600" />
                      {log.session?.licensePlate || log.licensePlate}
                    </span>
                  )}
                </div>

                {/* Footer: người xử lý + thời gian */}
                <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <span>Xử lý bởi: {log.handledBy?.fullName || "—"}</span>
                  <span>{formatTime(log.resolvedAt || log.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
