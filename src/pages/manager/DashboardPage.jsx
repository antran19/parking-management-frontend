import React, { useState, useEffect, useContext, useMemo } from "react";
import { managerApi } from "../../api/parkingApi";
import { Spinner } from "../components/Spinner";
import { ManagerContext } from "./ManagerLayout";

// Beautiful SVG Icons
const IconRevenue = () => (
  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconActiveSessions = () => (
  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

const IconOccupancy = () => (
  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const IconCompleted = () => (
  <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconSecurity = () => (
  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const IconSOS = () => (
  <svg className="w-5 h-5 text-rose-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const DashboardPage = () => {
  const { triggerToast, floors = [], zones = [] } = useContext(ManagerContext);
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

  const floorSummaries = useMemo(() => {
    return floors.map(floor => {
      const floorZones = zones.filter(z => z.floorId === floor.id || z.floorName === floor.floorName);
      const capacity = floorZones.reduce((sum, z) => sum + (z.capacity || 0), 0);
      const occupied = floorZones.reduce((sum, z) => sum + (z.currentCount || 0), 0);
      const reserved = floorZones.reduce((sum, z) => sum + (z.reservedCount || 0), 0);
      const totalUsed = occupied + reserved;
      const percent = capacity > 0 ? Math.round((totalUsed / capacity) * 100) : 0;
      return {
        floorName: floor.floorName,
        capacity,
        occupied: totalUsed,
        percent
      };
    }).sort((a, b) => a.floorName.localeCompare(b.floorName));
  }, [floors, zones]);

  return (
    <section className="flex-1 space-y-8 p-8">
      <div className="space-y-8 animate-fade-in-fast">
        {/* Banner chào mừng cao cấp */}
        <div className="welcome-banner relative overflow-hidden rounded-3xl border border-slate-900/10 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 shadow-md flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-24 w-24 rounded-full bg-blue-500/5 blur-2xl" />
          
          <div className="space-y-2 max-w-2xl relative z-10">
            <h3 className="text-2xl font-black text-white tracking-tight">Xin chào, Quản lý!</h3>
            <p className="text-slate-300 leading-relaxed text-xs">
              Đây là hệ thống báo cáo tổng quan hoạt động bãi đỗ xe theo thời gian thực (Real-time).
            </p>
          </div>

          <div className="relative z-10 flex-shrink-0">
            <span className="px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Hệ thống: Bình thường
            </span>
          </div>
        </div>

        {loading ? <Spinner /> : dashboardData && (
          <>
            {/* Grid các chỉ số thống kê */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Doanh thu hôm nay */}
              <div className="stat-card-item rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300/80 transition-all duration-300 flex flex-col justify-between h-[115px]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Doanh thu hôm nay</span>
                  <span className="p-2 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-center">
                    <IconRevenue />
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {(dashboardData.todayRevenue || 0).toLocaleString("vi-VN")} đ
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Thanh toán hoàn thành</p>
                </div>
              </div>

              {/* Session Hoạt Động */}
              <div className="stat-card-item rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300/80 transition-all duration-300 flex flex-col justify-between h-[115px]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Xe đang trong bãi</span>
                  <span className="p-2 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-center">
                    <IconActiveSessions />
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {dashboardData.activeSessions || 0} xe
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Số phiên đỗ đang mở</p>
                </div>
              </div>

              {/* Tỷ lệ lấp đầy */}
              <div className="stat-card-item rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300/80 transition-all duration-300 flex flex-col justify-between h-[115px]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tỷ lệ lấp đầy</span>
                  <span className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center">
                    <IconOccupancy />
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {dashboardData.occupancyPercent || 0}%
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Tổng công suất sử dụng</p>
                </div>
              </div>

              {/* Lượt xe hoàn thành */}
              <div className="stat-card-item rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300/80 transition-all duration-300 flex flex-col justify-between h-[115px]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lượt xe hoàn thành</span>
                  <span className="p-2 bg-teal-50 rounded-xl border border-teal-100 flex items-center justify-center">
                    <IconCompleted />
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {dashboardData.completedSessionsToday || 0} lượt
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Đã thanh toán rời bãi</p>
                </div>
              </div>

              {/* Sự cố an ninh */}
              <div className="stat-card-item rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300/80 transition-all duration-300 flex flex-col justify-between h-[115px]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sự cố an ninh hôm nay</span>
                  <span className="p-2 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-center">
                    <IconSecurity />
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {dashboardData.securityIncidentsToday || 0} vụ
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Sự cố ngoại lệ ghi nhận</p>
                </div>
              </div>

              {/* SOS Emergency */}
              <div className={`stat-card-item rounded-3xl border p-5 shadow-sm transition-all duration-300 flex flex-col justify-between h-[115px] ${dashboardData.activeEmergency ? 'bg-rose-50 border-rose-200 animate-pulse' : 'bg-white border-slate-200 hover:shadow-md hover:border-slate-300/80'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trạng thái SOS</span>
                  <span className={`p-2 rounded-xl flex items-center justify-center ${dashboardData.activeEmergency ? 'bg-rose-100 border border-rose-200' : 'bg-rose-50 border border-rose-100'}`}>
                    <IconSOS />
                  </span>
                </div>
                <div className="mt-2">
                  <span className={`text-xl font-extrabold tracking-tight ${dashboardData.activeEmergency ? 'text-rose-600' : 'text-slate-900'}`}>
                    {dashboardData.activeEmergency ? "CÓ BÁO ĐỘNG" : "An toàn"}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Chế độ khẩn cấp SOS</p>
                </div>
              </div>
            </div>

            {/* Widget phân bổ công suất các tầng và phím tắt vận hành nhanh */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Floor capacity block */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div>
                  <h4 className="text-md font-bold text-slate-800">Trạng thái công suất các tầng</h4>
                  <p className="text-xs text-slate-500 mt-1">Phân bổ tỷ lệ lấp đầy thời gian thực theo cấu trúc tầng đỗ.</p>
                </div>

                {floorSummaries.length === 0 ? (
                  <div className="text-center py-8 text-slate-450 text-xs font-semibold">Chưa có dữ liệu phân tầng.</div>
                ) : (
                  <div className="space-y-5">
                    {floorSummaries.map(fs => (
                      <div key={fs.floorName} className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-700">Tầng {fs.floorName}</span>
                          <span className="text-slate-500">{fs.occupied}/{fs.capacity} xe ({fs.percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              fs.percent >= 90
                                ? "bg-rose-500"
                                : fs.percent >= 70
                                ? "bg-amber-500"
                                : "bg-indigo-600"
                            }`}
                            style={{ width: `${Math.min(fs.percent, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions Shortcuts */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div>
                  <h4 className="text-md font-bold text-slate-800">Liên kết vận hành nhanh</h4>
                  <p className="text-xs text-slate-500 mt-1">Truy cập nhanh các khu vực điều hành chức năng của Quản lý.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href="/manager/gates"
                    className="p-3 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all flex items-center gap-3 group text-xs text-slate-700 font-bold"
                  >
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    Giám sát Cổng
                  </a>

                  <a
                    href="/manager/revenue"
                    className="p-3 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all flex items-center gap-3 group text-xs text-slate-700 font-bold"
                  >
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    Thống kê Doanh thu
                  </a>

                  <a
                    href="/manager/security"
                    className="p-3 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all flex items-center gap-3 group text-xs text-slate-700 font-bold"
                  >
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    Báo cáo An ninh
                  </a>

                  <a
                    href="/manager/3d-map"
                    className="p-3 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-all flex items-center gap-3 group text-xs text-slate-700 font-bold"
                  >
                    <div className="p-2 bg-indigo-50 text-indigo-650 rounded-xl group-hover:bg-indigo-100 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    Bản đồ 3D bãi xe
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default DashboardPage;
