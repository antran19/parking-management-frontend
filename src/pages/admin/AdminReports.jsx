import React from "react";

export default function AdminReports({
  todayRevenue,
  todaySessionRevenue,
  todayPaymentRevenue,
  payments,
  occupancyPercent,
  activePassesCount,
  expiringPassesCount,
  displayMonthlyCount,
  weeklyRevenueData,
  maxWeeklyVal,
}) {
  const weekTotal = weeklyRevenueData.reduce((s, d) => s + d.raw, 0);
  // Doanh thu chỉ cộng từ `payments` (nguồn duy nhất, không trùng lặp) — mỗi lượt checkout
  // backend đều ghi cả session.totalFee LẪN 1 Payment record riêng cho cùng giao dịch, nên
  // cộng thêm sessions.fee vào đây sẽ bị tính gấp đôi. referenceType thật của Payment vé định
  // kỳ là "PASS" (không phải "MONTHLY_PASS" như comment trong Payment.java ghi).
  const paymentsThisMonth = payments.filter(p => {
    if (!p.paidAt) return false;
    const d = p.paidAt; const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthlySessionRevenue = paymentsThisMonth
    .filter(p => p.referenceType === "SESSION")
    .reduce((s, p) => s + p.amount, 0);
  const monthlyPaymentRevenue = paymentsThisMonth
    .filter(p => p.referenceType === "PASS")
    .reduce((s, p) => s + p.amount, 0);
  const monthlyTotal = monthlySessionRevenue + monthlyPaymentRevenue;
  const recentPayments = [...payments].sort((a, b) => (b.paidAt || 0) - (a.paidAt || 0)).slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm text-left">
        <h3 className="font-extrabold text-slate-900 text-base">Báo cáo doanh thu</h3>
        <p className="text-xs text-slate-400 mt-1">Tổng hợp doanh thu từ phí gửi xe lượt và thanh toán vé định kỳ.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 text-left">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Doanh thu hôm nay</p>
          <h4 className="text-xl font-extrabold text-slate-900 mt-2 tabular-nums">{todayRevenue.toLocaleString("vi-VN")}đ</h4>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-semibold text-slate-500">Lượt: {todaySessionRevenue.toLocaleString("vi-VN")}đ</span>
            <span className="text-[10px] text-slate-300">|</span>
            <span className="text-[10px] font-semibold text-indigo-500">Vé: {todayPaymentRevenue.toLocaleString("vi-VN")}đ</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 text-left">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Doanh thu tháng</p>
          <h4 className="text-xl font-extrabold text-slate-900 mt-2 tabular-nums">{monthlyTotal.toLocaleString("vi-VN")}đ</h4>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-semibold text-slate-500">Lượt: {monthlySessionRevenue.toLocaleString("vi-VN")}đ</span>
            <span className="text-[10px] text-slate-300">|</span>
            <span className="text-[10px] font-semibold text-indigo-500">Vé: {monthlyPaymentRevenue.toLocaleString("vi-VN")}đ</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 text-left">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Hiệu suất lấp đầy</p>
          <h4 className="text-xl font-extrabold text-slate-900 mt-2">{occupancyPercent}%</h4>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(occupancyPercent, 100)}%`, background: occupancyPercent > 90 ? '#f59e0b' : '#10b981' }} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 text-left">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Vé định kỳ</p>
          <h4 className="text-xl font-extrabold text-slate-900 mt-2">{activePassesCount} đang hoạt động</h4>
          <p className="text-[10px] font-semibold text-amber-500 mt-2">{expiringPassesCount > 0 ? `${expiringPassesCount} vé sắp hết hạn` : "Không có vé sắp hết hạn"}</p>
        </div>
      </div>

      {/* Chart + Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Chart */}
        <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-800 p-6 text-white text-left">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Doanh thu 7 ngày qua</h4>
              <p className="text-2xl font-extrabold text-white mt-1 tabular-nums">{weekTotal.toLocaleString("vi-VN")}đ</p>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">Đơn vị: VND</span>
          </div>

          <div className="h-48 flex items-end justify-between gap-3 px-2 border-b border-white/10">
            {weeklyRevenueData.map((d, index) => {
              const isToday = index === weeklyRevenueData.length - 1;
              const barMaxPx = 170;
              const barH = maxWeeklyVal > 0 ? Math.max(6, Math.round((parseFloat(d.val) / maxWeeklyVal) * barMaxPx)) : 6;
              return (
                <div key={index} className="flex-1 flex flex-col items-center justify-end gap-1.5 group" style={{ height: '100%' }}>
                  <span className="text-[10px] font-bold text-slate-400 tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">{d.raw.toLocaleString("vi-VN")}đ</span>
                  <div
                    className="w-full rounded-t-md transition-all duration-500"
                    style={{
                      height: `${barH}px`,
                      background: isToday ? 'linear-gradient(to top, #6366f1, #818cf8)' : 'linear-gradient(to top, #334155, #475569)',
                    }}
                  />
                  <span className={`text-[10px] font-bold ${isToday ? "text-indigo-400" : "text-slate-500"}`}>{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-left space-y-5">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Cơ cấu doanh thu tháng</h4>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-semibold text-slate-700">Phí gửi xe lượt</span>
                <span className="font-bold text-slate-900 tabular-nums">{monthlySessionRevenue.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-600 rounded-full transition-all duration-500" style={{ width: monthlyTotal > 0 ? `${(monthlySessionRevenue / monthlyTotal * 100)}%` : '0%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-semibold text-slate-700">Thanh toán vé định kỳ</span>
                <span className="font-bold text-slate-900 tabular-nums">{monthlyPaymentRevenue.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: monthlyTotal > 0 ? `${(monthlyPaymentRevenue / monthlyTotal * 100)}%` : '0%' }} />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex justify-between">
              <span className="text-sm font-bold text-slate-700">Tổng tháng</span>
              <span className="text-sm font-extrabold text-slate-900 tabular-nums">{monthlyTotal.toLocaleString("vi-VN")}đ</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Thống kê nhanh</p>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Lượt xe trong tháng</span>
              <span className="font-bold text-slate-800">{displayMonthlyCount}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Giao dịch online</span>
              <span className="font-bold text-slate-800">{payments.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      {recentPayments.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 text-left">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Giao dịch thanh toán gần đây</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="pb-3 text-left">Loại</th>
                  <th className="pb-3 text-left">Phương thức</th>
                  <th className="pb-3 text-right">Số tiền</th>
                  <th className="pb-3 text-right">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 text-left">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${p.referenceType === "PASS" ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-600"}`}>
                        {p.referenceType === "PASS" ? "Vé định kỳ" : p.referenceType === "SESSION" ? "Phí lượt" : p.referenceType}
                      </span>
                    </td>
                    <td className="py-3 text-left text-slate-600 font-medium">{p.paymentMethod === "ONLINE" ? "VNPAY" : p.paymentMethod}</td>
                    <td className="py-3 text-right font-bold text-slate-900 tabular-nums">{p.amount.toLocaleString("vi-VN")}đ</td>
                    <td className="py-3 text-right text-slate-400 text-xs tabular-nums">{p.paidAt ? p.paidAt.toLocaleString("vi-VN") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
