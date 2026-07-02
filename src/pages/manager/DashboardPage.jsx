import React, { useState, useEffect, useContext } from "react";
import { managerApi } from "../../api/parkingApi";
import { Spinner } from "../components/Spinner";
import { ManagerContext } from "./ManagerLayout";

const DashboardPage = () => {
  const { triggerToast } = useContext(ManagerContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await managerApi.getDashboard();
        setDashboardData(res.data.data);
      } catch (err) {
        triggerToast("Lỗi lấy dữ liệu dashboard", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <section className="flex-1 space-y-8 p-8">
      <div className="space-y-8 animate-fade-in-fast">
        <div className="welcome-banner relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="absolute right-0 top-0 -mr-24 -mt-24 h-64 w-64 rounded-full bg-indigo-500/5 blur-3xl" />
          <div className="space-y-2 max-w-2xl relative z-10">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Xin chào, Quản lý!</h3>
            <p className="text-slate-500 leading-relaxed text-xs">
              Đây là báo cáo tổng quan hoạt động bãi đỗ xe theo thời gian thực (Real-time).
            </p>
          </div>
        </div>

        {loading ? <Spinner /> : dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="stat-card-item rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Doanh thu hôm nay</span>
                <span className="text-sm bg-indigo-50 p-2.5 rounded-xl border border-indigo-100">💰</span>
              </div>
              <div className="mt-4 flex flex-col">
                <span className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">{(dashboardData.todayRevenue || 0).toLocaleString("vi-VN")} đ</span>
              </div>
            </div>

            <div className="stat-card-item rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Session Hoạt Động</span>
                <span className="text-sm bg-blue-50 p-2.5 rounded-xl border border-blue-100">🚗</span>
              </div>
              <div className="mt-4 flex flex-col">
                <span className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">{dashboardData.activeSessions || 0} xe</span>
              </div>
            </div>

            <div className="stat-card-item rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Tỷ lệ lấp đầy</span>
                <span className="text-sm bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">🏢</span>
              </div>
              <div className="mt-4 flex flex-col">
                <span className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">{dashboardData.occupancyPercent || 0}%</span>
              </div>
            </div>

            <div className="stat-card-item rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Lượt xe hoàn thành</span>
                <span className="text-sm bg-teal-50 p-2.5 rounded-xl border border-teal-100">✅</span>
              </div>
              <div className="mt-4 flex flex-col">
                <span className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">{dashboardData.completedSessionsToday || 0} lượt</span>
              </div>
            </div>

            <div className="stat-card-item rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Sự cố an ninh hôm nay</span>
                <span className="text-sm bg-amber-50 p-2.5 rounded-xl border border-amber-100">⚠️</span>
              </div>
              <div className="mt-4 flex flex-col">
                <span className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">{dashboardData.securityIncidentsToday || 0} vụ</span>
              </div>
            </div>

            <div className={`stat-card-item rounded-2xl border p-5 shadow-sm transition-all duration-200 ${dashboardData.activeEmergency ? 'bg-rose-50 border-rose-200 animate-pulse' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Trạng thái SOS</span>
                <span className="text-sm bg-rose-100 p-2.5 rounded-xl border border-rose-200">🚨</span>
              </div>
              <div className="mt-4 flex flex-col">
                <span className={`text-xl font-extrabold font-mono tracking-tight ${dashboardData.activeEmergency ? 'text-rose-600' : 'text-slate-900'}`}>
                  {dashboardData.activeEmergency ? "CÓ BÁO ĐỘNG" : "An toàn"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default DashboardPage;
