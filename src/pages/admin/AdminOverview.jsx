import React from "react";

function StatCard({ title, value, icon, accentColor, subtext }) {
  return (
    <div className="stat-card-item group relative rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm shadow-slate-100/50 hover:shadow-md hover:border-slate-300 transition-all duration-300 overflow-hidden text-left">
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${accentColor}`} />
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold uppercase tracking-wide text-slate-400 group-hover:text-slate-500 transition-colors">{title}</span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className="mt-4 flex flex-col">
        <span className="text-2xl font-black text-slate-900 group-hover:scale-[1.02] origin-left transition-transform duration-300">{value}</span>
        <span className="text-[10px] font-semibold text-slate-400 mt-1">{subtext}</span>
      </div>
    </div>
  );
}

export default function AdminOverview({ users, gates, zones, logs, todayRevenue, settings, toggleBarrier }) {
  return (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Tổng người dùng" value={`${users.length} tài khoản`} icon="" accentColor="bg-blue-500" subtext="Staff, Security & Drivers" />
        <StatCard title="Số cổng kiểm soát" value={`${gates.length} làn trực tuyến`} icon="" accentColor="bg-purple-500" subtext="Hệ thống barrier AI live" />
        <StatCard title="Doanh thu hôm nay" value={`${todayRevenue.toLocaleString("vi-VN")}đ`} icon="" accentColor="bg-emerald-500" subtext={`Bypass ${settings.gracePeriod} phút đầu`} />
        <StatCard title="Log an ninh khẩn" value={`${logs.length} biên bản`} icon="" accentColor="bg-rose-500" subtext="Cần giám sát khẩn cấp" />
      </div>

      {/* Grid 2 Columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Phân khu đỗ */}
        <div className="action-panel-item lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base text-left flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-purple-600 block"></span>
            Công suất đỗ thực tế các phân khu
          </h3>
          <div className="space-y-5">
            {(() => {
              const floorOrder = (name) => {
                if (!name) return 999;
                const match = name.match(/^([BT])(\d+)$/i);
                if (!match) return 999;
                const [, prefix, num] = match;
                return prefix.toUpperCase() === "B" ? -parseInt(num) : 100 + parseInt(num);
              };
              const sorted = [...zones].sort((a, b) => floorOrder(a.floorName) - floorOrder(b.floorName));
              const grouped = [];
              let lastFloor = null;
              sorted.forEach(z => {
                if (z.floorName !== lastFloor) {
                  grouped.push({ type: "header", floorName: z.floorName });
                  lastFloor = z.floorName;
                }
                grouped.push({ type: "zone", ...z });
              });
              return grouped.map((item, idx) => {
                if (item.type === "header") {
                  return (
                    <div key={`hdr-${idx}`} className="pt-1">
                      <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-1.5">
                        Tầng {item.floorName}
                      </p>
                    </div>
                  );
                }
                const percent = Math.min(100, Math.round((item.occupied / item.capacity) * 100));
                return (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800">
                        {item.floorName} · {item.name} ({item.type})
                      </span>
                      <span className="text-slate-500">{item.occupied}/{item.capacity} xe ({percent}%)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${percent > 90 ? "bg-red-500" : percent > 75 ? "bg-amber-500" : "bg-indigo-500"
                        }`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Barrier Control Panel */}
        <div className="action-panel-item bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 flex flex-col space-y-4 text-left">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-purple-600 block"></span>
            Khống chế Barrier cưỡng chế
          </h3>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
            {gates.map(g => (
              <div key={g.id} className="p-3.5 bg-slate-50/50 rounded-xl flex items-center justify-between border border-slate-100 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-xs font-bold text-slate-800">{g.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">Camera: {g.cameraIp}</p>
                </div>
                <button
                  onClick={() => toggleBarrier(g.id, g.barrier)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border cursor-pointer transition-colors ${g.barrier === "OPEN"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                    }`}
                >
                  {g.barrier === "OPEN" ? "ĐANG MỞ" : "ĐANG ĐÓNG"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
