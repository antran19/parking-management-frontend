import React, { useState, useEffect, useContext } from "react";
import { managerApi } from "../../api/parkingApi";
import { Spinner } from "../components/Spinner";
import { ManagerContext } from "./ManagerLayout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";

const formatVND = (value) =>
  new Intl.NumberFormat("vi-VN").format(value) + " đ";

const FILTER_OPTIONS = [
  { value: "today",  label: "Hôm nay"   },
  { value: "month",  label: "Tháng này" },
  { value: "year",   label: "Năm nay"   },
  { value: "custom", label: "Tùy chỉnh" },
];

const getXAxisLabel = (type) => {
  switch (type) {
    case "today":  return "giờ";
    case "month":  return "ngày";
    case "year":   return "tháng";
    case "custom": return "ngày";
    default: return "";
  }
};

const getPlaceholderData = (type, from, to) => {
  switch (type) {
    case "today":
      return Array.from({ length: 24 }, (_, i) => ({
        label: `${String(i).padStart(2, "0")}:00`,
        revenue: 0,
      }));
    case "month": {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      return Array.from({ length: daysInMonth }, (_, i) => ({
        label: `${String(i + 1).padStart(2, "0")}/${mm}`,
        revenue: 0,
      }));
    }
    case "year": {
      const year = new Date().getFullYear();
      return Array.from({ length: 12 }, (_, i) => ({
        label: `${String(i + 1).padStart(2, "0")}/${year}`,
        revenue: 0,
      }));
    }
    case "custom": {
      if (!from || !to) return [];
      const result = [];
      const current = new Date(from);
      const end = new Date(to);
      while (current <= end) {
        const dd = String(current.getDate()).padStart(2, "0");
        const mm = String(current.getMonth() + 1).padStart(2, "0");
        result.push({ label: `${dd}/${mm}`, revenue: 0 });
        current.setDate(current.getDate() + 1);
      }
      return result;
    }
    default:
      return [];
  }
};

const RevenuePage = () => {
  const { triggerToast } = useContext(ManagerContext);
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("today");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  useEffect(() => {
    if (filterType === "custom" && (!filterFrom || !filterTo)) return;

    const fetchRevenue = async () => {
      setLoading(true);
      try {
        const params = { type: filterType };
        if (filterType === "custom") {
          params.from = filterFrom;
          params.to = filterTo;
        }
        const res = await managerApi.getRevenue(params);
        setRevenueData(res.data.data);
      } catch (err) {
        triggerToast("Lỗi lấy dữ liệu doanh thu", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchRevenue();
  }, [filterType, filterFrom, filterTo]);

  const getFilterLabel = () => {
    switch (filterType) {
      case "today":  return "Hôm nay";
      case "month":  return "Tháng này";
      case "year":   return "Năm nay";
      case "custom":
        if (filterFrom && filterTo)
          return `Từ ${new Date(filterFrom).toLocaleDateString("vi-VN")} đến ${new Date(filterTo).toLocaleDateString("vi-VN")}`;
        return "Tùy chỉnh";
      default: return "";
    }
  };

  const chartData = (() => {
    const placeholder = getPlaceholderData(filterType, filterFrom, filterTo);
    const raw = (revenueData?.chartData || []);

    if (raw.length === 0) return placeholder;

    const dataMap = {};
    raw.forEach(d => {
      dataMap[d.label] = Number(d.value ?? d.revenue ?? 0);
    });

    if (placeholder.length > 0) {
      return placeholder.map(p => ({
        label: p.label,
        revenue: dataMap[p.label] ?? 0,
      }));
    }

    return raw.map(d => ({
      label: d.label,
      revenue: Number(d.value ?? d.revenue ?? 0),
    }));
  })();

  return (
    <section className="flex-1 space-y-8 p-8">
      <div className="space-y-6 fade-up-element">

        {/* Bộ lọc */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterType(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterType === opt.value
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}

          {filterType === "custom" && (
            <div className="flex items-center gap-2">
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

        {loading ? <Spinner /> : revenueData && (
          <div className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-3 bg-indigo-50 text-indigo-650 rounded-xl">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Tổng doanh thu</p>
                  <h4 className="text-xl font-extrabold text-slate-800 mt-0.5">{formatVND(revenueData.totalRevenue || 0)}</h4>
                  <p className="text-slate-500 text-[10px] mt-0.5">{getFilterLabel()}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-3 bg-emerald-50 text-emerald-650 rounded-xl">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Tổng phiên gửi xe</p>
                  <h4 className="text-xl font-extrabold text-slate-800 mt-0.5">
                    {new Intl.NumberFormat("vi-VN").format(revenueData.totalSessions || 0)}
                    <span className="text-xs text-slate-500 font-bold ml-1">phiên</span>
                  </h4>
                  <p className="text-slate-500 text-[10px] mt-0.5">{getFilterLabel()}</p>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Biểu đồ doanh thu</h3>
              <p className="text-xs text-slate-500 mb-6">
                Dữ liệu theo {getXAxisLabel(filterType)} — {getFilterLabel()}
              </p>

              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="40%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                      width={90}
                      tickFormatter={(val) => new Intl.NumberFormat("vi-VN").format(val)}
                    />
                    <RechartsTooltip
                      formatter={(value) => [formatVND(value), "Doanh thu"]}
                      labelStyle={{ fontWeight: "bold", color: "#1e293b" }}
                      cursor={{ fill: "#f1f5f9" }}
                    />
                    <Bar dataKey="revenue" name="Doanh thu" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default RevenuePage;