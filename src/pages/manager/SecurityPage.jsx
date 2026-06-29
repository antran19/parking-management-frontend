import React, { useState, useEffect, useContext } from "react";
import { managerApi } from "../../api/parkingApi";
import { Spinner } from "../components/Spinner";
import { ManagerContext } from "./ManagerLayout";

const INCIDENT_TYPE_LABELS = {
  BLACKLIST_DETECTED:    "Phát hiện biển số đen",
  UNAUTHORIZED_ACCESS:   "Truy cập trái phép",
  TAILGATING:            "Xe theo đuôi",
  OVERSTAY:              "Quá giờ",
  SUSPICIOUS_ACTIVITY:   "Hoạt động đáng ngờ",
};

const SecurityPage = () => {
  const { triggerToast } = useContext(ManagerContext);
  const [summary, setSummary] = useState(null);
  const [blacklist, setBlacklist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("summary");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterFrom) params.from = new Date(filterFrom).toISOString();
      if (filterTo)   params.to   = new Date(filterTo).toISOString();
      const res = await managerApi.getSecuritySummary(params);
      setSummary(res.data.data);
    } catch (err) {
      triggerToast("Lỗi lấy dữ liệu sự cố", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchBlacklist = async () => {
    setLoading(true);
    try {
      const res = await managerApi.getBlacklist();
      setBlacklist(res.data.data);
    } catch (err) {
      triggerToast("Lỗi lấy danh sách đen", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "summary") fetchSummary();
    if (tab === "blacklist") fetchBlacklist();
  }, [tab, filterFrom, filterTo]);

  return (
    <section className="flex-1 space-y-8 p-8">
      <div className="space-y-6 fade-up-element">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Quản lý Sự cố An ninh</h3>
          <p className="text-xs text-slate-500 mt-1">Tổng hợp sự cố và danh sách biển số đen.</p>
        </div>

        {/* Tab */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
          {[
            { value: "summary",   label: "Tổng hợp sự cố" },
            { value: "blacklist", label: "Biển số đen"     },
          ].map(t => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.value
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}

          {tab === "summary" && (
            <div className="flex items-center gap-2 ml-auto">
              <input
                type="date"
                value={filterFrom}
                onChange={e => setFilterFrom(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
              <span className="text-sm text-slate-500">đến</span>
              <input
                type="date"
                value={filterTo}
                onChange={e => setFilterTo(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}
        </div>

        {loading ? <Spinner /> : (
          <>
            {/* Tab: Tổng hợp sự cố */}
            {tab === "summary" && summary && (
              <div className="space-y-6">
                {/* KPI cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-rose-500 to-rose-700 rounded-2xl p-6 text-white shadow-lg shadow-rose-500/30">
                    <p className="text-rose-100 text-xs font-bold uppercase tracking-widest mb-2">Tổng sự cố</p>
                    <h4 className="text-3xl font-black">{summary.totalIncidents}</h4>
                  </div>
                  <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-6 text-white shadow-lg shadow-amber-500/30">
                    <p className="text-amber-100 text-xs font-bold uppercase tracking-widest mb-2">Chưa giải quyết</p>
                    <h4 className="text-3xl font-black">{summary.unresolvedIncidents}</h4>
                  </div>
                </div>

                {/* Phân loại theo type */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h4 className="text-sm font-bold text-slate-700 mb-4">Phân loại theo loại sự cố</h4>
                  <div className="space-y-3">
                    {Object.entries(summary.byType || {}).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <span className="text-sm text-slate-600">
                          {INCIDENT_TYPE_LABELS[type] || type}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          count > 0
                            ? "bg-rose-100 text-rose-700"
                            : "bg-slate-100 text-slate-400"
                        }`}>
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Biển số đen */}
            {tab === "blacklist" && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {blacklist.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-sm">Không có biển số nào trong danh sách đen.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Biển số</th>
                        <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Lý do</th>
                        <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Ngày thêm</th>
                        <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {blacklist.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-slate-800">{item.licensePlate}</td>
                          <td className="px-6 py-4 text-slate-600">{item.reason || "—"}</td>
                          <td className="px-6 py-4 text-slate-500 text-xs">
                            {item.addedAt ? new Date(item.addedAt).toLocaleDateString("vi-VN") : "—"}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                              item.isActive
                                ? "bg-rose-100 text-rose-700"
                                : "bg-slate-100 text-slate-400"
                            }`}>
                              {item.isActive ? "Đang chặn" : "Đã gỡ"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default SecurityPage;