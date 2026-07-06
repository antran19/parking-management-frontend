import React from "react";

export default function AdminZones({ zones, handleOpenAddZone, handleOpenEditZone, handleDeleteZone }) {
  // Group zones by floor, sorted logically
  const floorOrder = (name) => {
    const n = (name || "").toUpperCase();
    if (n.includes("B2")) return 1;
    if (n.includes("B1")) return 2;
    if (n.includes("T1") || n.includes("1")) return 3;
    if (n.includes("T2") || n.includes("2")) return 4;
    if (n.includes("T3") || n.includes("3")) return 5;
    return 99;
  };
  const grouped = {};
  zones.forEach(z => {
    const key = z.floorName || "Chưa phân tầng";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(z);
  });
  const sortedFloors = Object.keys(grouped).sort((a, b) => floorOrder(a) - floorOrder(b));
  sortedFloors.forEach(f => grouped[f].sort((a, b) => (a.name || "").localeCompare(b.name || "")));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 space-y-6">
      <div className="flex justify-between items-center text-left">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base">Quy hoạch phân khu đỗ xe</h3>
          <p className="text-xs text-slate-400">Phân định quy chuẩn sức chứa từng zone đỗ riêng biệt trong bãi. Tổng {zones.length} khu vực.</p>
        </div>
        <button onClick={handleOpenAddZone} className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors shadow-lg shadow-purple-500/10">
          Thêm khu vực mới
        </button>
      </div>

      {sortedFloors.map(floorName => {
        const floorZones = grouped[floorName];
        const floorCapacity = floorZones.reduce((s, z) => s + (z.capacity || 0), 0);
        const floorOccupied = floorZones.reduce((s, z) => s + (z.occupied || 0), 0);
        const floorPercent = floorCapacity > 0 ? Math.round((floorOccupied / floorCapacity) * 100) : 0;
        return (
          <div key={floorName} className="rounded-xl border border-slate-200 overflow-hidden">
            {/* Floor header */}
            <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 text-purple-700 font-black text-xs">
                  {floorName.replace(/Tầng\s*/i, "").trim() || "?"}
                </span>
                <div>
                  <span className="text-sm font-extrabold text-slate-800">{floorName}</span>
                  <span className="text-xs text-slate-400 ml-2">· {floorZones[0]?.buildingName}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500 font-semibold">{floorZones.length} khu vực</span>
                <span className="text-xs font-bold text-slate-600">{floorOccupied}/{floorCapacity} xe</span>
                <span className={`text-xs font-black ${floorPercent > 90 ? "text-red-500" : floorPercent > 75 ? "text-amber-500" : "text-emerald-500"}`}>{floorPercent}%</span>
              </div>
            </div>
            {/* Zone cards in this floor */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {floorZones.map(z => {
                const percent = z.capacity > 0 ? Math.min(100, Math.round((z.occupied / z.capacity) * 100)) : 0;
                return (
                  <div key={z.id} className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3 hover:shadow-md transition-shadow text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">{z.type}</span>
                      <div className="flex gap-3 text-xs font-bold">
                        <button onClick={() => handleOpenEditZone(z)} className="text-slate-500 hover:text-slate-900 cursor-pointer transition-colors">Sửa</button>
                        <button onClick={() => handleDeleteZone(z.id, z.name)} className="text-red-500 hover:text-red-700 cursor-pointer transition-colors">Xóa</button>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">{z.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-1.5">Sức chứa: {z.occupied} / {z.capacity} xe ({percent}%)</p>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200/60 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${percent > 90 ? "bg-red-500" : percent > 75 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
