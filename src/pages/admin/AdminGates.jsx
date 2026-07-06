import React from "react";

export default function AdminGates({ gates, zones, handleOpenAddGate, handleOpenEditGate, handleDeleteGate, toggleBarrier, toggleGateStatus }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm shadow-slate-100/50 space-y-6">
      <div className="flex justify-between items-center text-left">
        <div>
          <h3 className="font-extrabold text-slate-900 text-base">Cổng kiểm soát & Làn Barrier</h3>
          <p className="text-xs text-slate-400">Giám sát các camera IP nhận diện AI & thiết bị ngoại vi làn vào/ra.</p>
        </div>
        <button onClick={handleOpenAddGate} className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2.5 text-xs font-bold text-white cursor-pointer transition-colors shadow-lg shadow-purple-500/10">
          🚧 Thêm làn mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        {gates.map(g => (
          <div key={g.id} className={`rounded-2xl border p-5 flex justify-between items-center transition-colors ${g.status === "active" ? "border-slate-200/80 bg-slate-50/50 hover:bg-slate-50" : "border-amber-200 bg-amber-50/30 opacity-75"}`}>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${g.type.includes("ENTRY")
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : g.type.includes("BOTH")
                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                    : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  }`}>
                  {g.type.startsWith("ZONE_") ? "ZONE" : "CHÍNH"} · {g.type.includes("ENTRY") ? "VÀO" : g.type.includes("BOTH") ? "2 CHIỀU" : "RA"}
                </span>
                <span className={`h-2 w-2 rounded-full ${g.status === "active" ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
              </div>
              <h4 className={`font-extrabold text-sm ${g.status === "active" ? "text-slate-900" : "text-slate-500 line-through"}`}>{g.name}</h4>
              <p className="text-[10px] text-slate-450 font-mono">Địa chỉ IP Camera: {g.cameraIp}</p>
              {g.zoneId && (() => { const z = zones.find(z => z.id === g.zoneId); return z ? <p className="text-[10px] text-blue-600 font-bold">📍 Zone: {z.name} ({z.floorName})</p> : null; })()}
            </div>

            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => toggleBarrier(g.id, g.barrier)}
                disabled={g.status === "inactive"}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${g.status === "inactive"
                  ? "bg-slate-300 text-slate-500 border-slate-300 cursor-not-allowed"
                  : g.barrier === "OPEN"
                    ? "bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/10"
                    : "bg-slate-800 text-white hover:bg-slate-700"
                  }`}
              >
                {g.status === "inactive" ? "⛔ ĐANG BẢO TRÌ" : g.barrier === "OPEN" ? "🔓 OVERRIDE MỞ" : "🔒 KHÓA BẢO VỆ"}
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleGateStatus(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors border ${g.status === "active"
                    ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                    }`}
                >
                  {g.status === "active" ? "🔧 Tắt (Bảo trì)" : "✅ Kích hoạt"}
                </button>
                <button onClick={() => handleDeleteGate(g.id, g.name)} className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-200 cursor-pointer transition-colors text-xs">Xóa</button>
              </div>
              <span className={`text-[9px] font-black uppercase ${g.status === "active" ? "text-emerald-500" : "text-amber-500"}`}>{g.status === "active" ? "● Online" : "● Bảo trì"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
