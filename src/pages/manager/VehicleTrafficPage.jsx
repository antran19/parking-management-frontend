import React, { useState, useEffect, useContext, useMemo } from "react";
import staffApi, { managerApi } from "../../api/parkingApi";
import { Spinner } from "../components/Spinner";
import { ManagerContext } from "./ManagerLayout";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";

const FILTER_OPTIONS = [
  { value: "today", label: "Hôm nay" },
  { value: "month", label: "Tháng này" },
  { value: "year", label: "Năm nay" },
  { value: "custom", label: "Tùy chỉnh" },
];

const DRIVER_TYPE_LABELS = {
  WALK_IN: "Vãng lai",
  PRE_BOOKED: "Đặt trước",
  SUBSCRIBER: "Thuê bao",
};

const STATUS_LABELS = {
  ACTIVE: "Đang đỗ",
  COMPLETED: "Đã rời bãi",
  CANCELLED: "Đã hủy",
};

const PAYMENT_STATUS_LABELS = {
  PAID: "Đã thanh toán",
  UNPAID: "Chưa thanh toán",
  PENDING: "Đang xử lý",
};

const getXAxisLabel = (type) => {
  switch (type) {
    case "today": return "giờ";
    case "month": return "ngày";
    case "year": return "tháng";
    case "custom": return "ngày";
    default: return "";
  }
};

const getPlaceholderData = (type, from, to) => {
  switch (type) {
    case "today":
      return Array.from({ length: 24 }, (_, i) => ({
        label: `${String(i).padStart(2, "0")}:00`,
        sessions: 0,
      }));
    case "month": {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      return Array.from({ length: daysInMonth }, (_, i) => ({
        label: `${String(i + 1).padStart(2, "0")}/${mm}`,
        sessions: 0,
      }));
    }
    case "year": {
      const year = new Date().getFullYear();
      return Array.from({ length: 12 }, (_, i) => ({
        label: `${String(i + 1).padStart(2, "0")}/${year}`,
        sessions: 0,
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
        result.push({ label: `${dd}/${mm}`, sessions: 0 });
        current.setDate(current.getDate() + 1);
      }
      return result;
    }
    default:
      return [];
  }
};

const VehicleTrafficPage = () => {
  const { triggerToast } = useContext(ManagerContext);
  const [visitsData, setVisitsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("today");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  // States cho danh sách phiên gửi xe
  const [sessions, setSessions] = useState([]);
  const [sessionsPage, setSessionsPage] = useState(0);
  const [sessionsTotalPages, setSessionsTotalPages] = useState(0);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [searchPlateInput, setSearchPlateInput] = useState("");
  const [searchPlate, setSearchPlate] = useState("");
  const [searchStatus, setSearchStatus] = useState("all");
  const [selectedSession, setSelectedSession] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch dữ liệu chart lượt gửi xe
  useEffect(() => {
    if (filterType === "custom" && (!filterFrom || !filterTo)) return;

    const fetchVisits = async () => {
      setLoading(true);
      try {
        const params = { type: filterType };
        if (filterType === "custom") {
          params.from = filterFrom;
          params.to = filterTo;
        }
        const res = await managerApi.getVisits(params);
        setVisitsData(res.data.data);
      } catch (err) {
        triggerToast("Lỗi lấy dữ liệu lượt gửi xe", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchVisits();
  }, [filterType, filterFrom, filterTo]);

  // Fetch danh sách chi tiết các phiên gửi xe (hỗ trợ phân trang, tìm kiếm)
  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const params = {
        page: sessionsPage,
        size: 10,
        sort: "entryTime,desc",
      };
      if (searchPlate.trim()) params.licensePlate = searchPlate.trim();
      if (searchStatus && searchStatus !== "all") params.status = searchStatus;

      const res = await staffApi.getAllSessionsHistory(params);
      const data = res.data.data;
      if (data && typeof data === "object" && "content" in data) {
        setSessions(data.content || []);
        setSessionsTotalPages(data.totalPages || 0);
      } else {
        setSessions(data || []);
        setSessionsTotalPages(1);
      }
    } catch (err) {
      triggerToast("Lỗi lấy danh sách phiên gửi xe", "error");
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [sessionsPage, searchPlate, searchStatus]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchPlate(searchPlateInput);
    setSessionsPage(0);
  };

  const getFilterLabel = () => {
    switch (filterType) {
      case "today": return "Hôm nay";
      case "month": return "Tháng này";
      case "year": return "Năm nay";
      case "custom":
        if (filterFrom && filterTo)
          return `Từ ${new Date(filterFrom).toLocaleDateString("vi-VN")} đến ${new Date(filterTo).toLocaleDateString("vi-VN")}`;
        return "Tùy chỉnh";
      default: return "";
    }
  };

  const chartData = (() => {
    const placeholder = getPlaceholderData(filterType, filterFrom, filterTo);
    const raw = (visitsData?.chartData || []);

    if (raw.length === 0) return placeholder;

    const dataMap = {};
    raw.forEach(d => {
      dataMap[d.label] = Number(d.amount ?? d.value ?? d.sessions ?? 0);
    });

    if (placeholder.length > 0) {
      return placeholder.map(p => ({
        label: p.label,
        sessions: dataMap[p.label] ?? 0,
      }));
    }

    return raw.map(d => ({
      label: d.label,
      sessions: Number(d.amount ?? d.value ?? d.sessions ?? 0),
    }));
  })();

  const handleExportExcel = async () => {
    try {
      const res = await managerApi.exportExcel('sessions');
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'LuotGuiXe.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      triggerToast("Xuất báo cáo thành công", "success");
    } catch (err) {
      triggerToast("Lỗi khi xuất báo cáo", "error");
    }
  };

  return (
    <section className="flex-1 space-y-8 p-8">
      <div className="space-y-6 fade-up-element">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Lượt gửi xe</h3>
            <p className="text-xs text-slate-500 mt-1">Dữ liệu thống kê lượt xe ra vào bãi.</p>
          </div>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer w-fit"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Xuất Excel
          </button>
        </div>

        {/* Bộ lọc biểu đồ */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
          {FILTER_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterType(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${filterType === opt.value
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
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-800"
              />
              <span className="text-sm text-slate-500">đến</span>
              <input
                type="date"
                value={filterTo}
                onChange={e => setFilterTo(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white text-slate-800"
              />
            </div>
          )}
        </div>

        {loading ? <Spinner /> : visitsData && (
          <div className="space-y-6">
            {/* KPI card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="p-3 bg-indigo-50 text-indigo-650 rounded-xl">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Tổng lượt gửi xe</p>
                  <h4 className="text-xl font-extrabold text-slate-800 mt-0.5">
                    {new Intl.NumberFormat("vi-VN").format(visitsData.totalSessions || 0)}
                    <span className="text-xs text-slate-500 font-bold ml-1">lượt</span>
                  </h4>
                  <p className="text-slate-500 text-[10px] mt-0.5">{getFilterLabel()}</p>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Biểu đồ lượt gửi xe</h3>
              <p className="text-xs text-slate-500 mb-6">
                Dữ liệu theo {getXAxisLabel(filterType)} — {getFilterLabel()}
              </p>

              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
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
                      width={60}
                    />
                    <RechartsTooltip
                      formatter={(value) => [`${value} lượt`, "Lượt gửi xe"]}
                      labelStyle={{ fontWeight: "bold", color: "#1e293b" }}
                      cursor={{ fill: "#f1f5f9" }}
                    />
                    <Bar dataKey="sessions" name="Lượt gửi xe" fill="#6366f1" radius={0} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Danh sách phiên gửi xe */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Tra cứu chi tiết phiên gửi xe</h3>
                  <p className="text-xs text-slate-500 mt-1">Danh sách tất cả các xe đang đỗ và đã gửi trong hệ thống.</p>
                </div>

                {/* Bộ lọc bảng */}
                <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Tìm biển số..."
                      value={searchPlateInput}
                      onChange={e => setSearchPlateInput(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white text-slate-700 w-40 font-semibold"
                    />
                    {searchPlateInput && (
                      <button
                        type="button"
                        onClick={() => { setSearchPlateInput(""); setSearchPlate(""); setSessionsPage(0); }}
                        className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <select
                    value={searchStatus}
                    onChange={e => { setSearchStatus(e.target.value); setSessionsPage(0); }}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang đỗ</option>
                    <option value="completed">Đã rời bãi</option>
                  </select>

                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-1.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                  >
                    Tìm
                  </button>
                </form>
              </div>

              {sessionsLoading ? (
                <div className="py-8 text-center"><Spinner /></div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">Không có dữ liệu phiên gửi xe nào phù hợp.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Mã vé</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Biển số</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Loại xe</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Giờ vào</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Giờ ra</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Trạng thái</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sessions.map(item => (
                        <tr key={item.sessionId || item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-800">{item.sessionCode || "—"}</td>
                          <td className="px-4 py-3 font-mono font-bold text-indigo-650">{item.licensePlate}</td>
                          <td className="px-4 py-3 text-slate-600">{item.vehicleType || "—"}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {item.entryTime ? new Date(item.entryTime).toLocaleString("vi-VN") : "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {item.exitTime ? new Date(item.exitTime).toLocaleString("vi-VN") : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${item.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"
                              }`}>
                              {STATUS_LABELS[item.status] || item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => { setSelectedSession(item); setIsDetailModalOpen(true); }}
                              className="px-3 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Chi tiết
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Phân trang */}
                  {sessionsTotalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-4">
                      <button
                        disabled={sessionsPage === 0}
                        onClick={() => setSessionsPage(prev => Math.max(0, prev - 1))}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Trước
                      </button>
                      <span className="text-xs text-slate-500 font-medium">Trang {sessionsPage + 1} / {sessionsTotalPages}</span>
                      <button
                        disabled={sessionsPage >= sessionsTotalPages - 1}
                        onClick={() => setSessionsPage(prev => prev + 1)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Sau
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal chi tiết phiên gửi xe */}
      {isDetailModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in relative flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100 flex-shrink-0">
              <div>
                <h4 className="text-md font-bold text-slate-800">Chi tiết phiên gửi xe</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Mã phiên: {selectedSession.sessionCode}</p>
              </div>
              <button
                onClick={() => { setIsDetailModalOpen(false); setSelectedSession(null); }}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-200/50 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Biển số</p>
                  <p className="font-mono text-sm font-bold text-indigo-650 mt-1">{selectedSession.licensePlate}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Loại xe</p>
                  <p className="text-sm font-semibold text-slate-700 mt-1">{selectedSession.vehicleType || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Loại khách</p>
                  <p className="text-sm font-semibold text-slate-700 mt-1">
                    {DRIVER_TYPE_LABELS[selectedSession.driverType] || selectedSession.driverType || "Vãng lai"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Vị trí đỗ chỉ định</p>
                  <p className="text-sm font-semibold text-slate-700 mt-1">
                    {selectedSession.floorName && selectedSession.zoneName
                      ? `Tầng ${selectedSession.floorName} - ${selectedSession.zoneName}`
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Giờ vào</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {selectedSession.entryTime ? new Date(selectedSession.entryTime).toLocaleString("vi-VN") : "—"}
                  </p>
                  {selectedSession.entryMainGateName && (
                    <p className="text-[10px] text-slate-400 mt-0.5">({selectedSession.entryMainGateName})</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Giờ ra</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {selectedSession.exitTime ? new Date(selectedSession.exitTime).toLocaleString("vi-VN") : "—"}
                  </p>
                  {selectedSession.exitMainGateName && (
                    <p className="text-[10px] text-slate-400 mt-0.5">({selectedSession.exitMainGateName})</p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Thời lượng gửi</p>
                  <p className="text-sm font-semibold text-slate-700 mt-1">
                    {selectedSession.durationMinutes !== null && selectedSession.durationMinutes !== undefined
                      ? `${selectedSession.durationMinutes} phút`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Trạng thái</p>
                  <p className="mt-1">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${selectedSession.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                      }`}>
                      {STATUS_LABELS[selectedSession.status] || selectedSession.status}
                    </span>
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Tổng phí gửi xe</p>
                  <p className="text-sm font-black text-slate-800 mt-1">
                    {selectedSession.totalFee !== null && selectedSession.totalFee !== undefined
                      ? `${new Intl.NumberFormat("vi-VN").format(selectedSession.totalFee)} VND`
                      : "0 VND"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Trạng thái thanh toán</p>
                  <p className="mt-1">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${selectedSession.paymentStatus === "PAID"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                      {PAYMENT_STATUS_LABELS[selectedSession.paymentStatus] || selectedSession.paymentStatus || "Chưa thanh toán"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Ảnh camera check-in / check-out */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <p className="text-[10px] uppercase font-bold text-slate-400">Ảnh kiểm đối camera</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Ảnh khi vào */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3 space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 text-center uppercase">Lúc vào (Check-in)</p>
                    {selectedSession.entryPlateImageUrl ? (
                      <img
                        src={selectedSession.entryPlateImageUrl}
                        alt="Ảnh biển số lúc vào"
                        className="w-full h-40 object-cover rounded-xl border border-slate-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-full h-40 bg-slate-200/50 flex flex-col items-center justify-center text-slate-400 text-xs rounded-xl">
                        <span>📷 Không có ảnh biển số</span>
                      </div>
                    )}
                  </div>

                  {/* Ảnh khi ra */}
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3 space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 text-center uppercase">Lúc ra (Check-out)</p>
                    {selectedSession.exitPlateImageUrl ? (
                      <img
                        src={selectedSession.exitPlateImageUrl}
                        alt="Ảnh biển số lúc ra"
                        className="w-full h-40 object-cover rounded-xl border border-slate-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-full h-40 bg-slate-200/50 flex flex-col items-center justify-center text-slate-400 text-xs rounded-xl">
                        <span>📷 Không có ảnh biển số</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end flex-shrink-0">
              <button
                onClick={() => { setIsDetailModalOpen(false); setSelectedSession(null); }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default VehicleTrafficPage;