import React, { useState, useContext } from "react";
import { managerApi } from "../../api/parkingApi";
import { ManagerContext } from "./ManagerLayout";

const GATE_TYPE_LABELS = {
  ENTRY: "Lối vào",
  EXIT: "Lối ra",
};

const GateMonitoringPage = () => {
  const { gates, syncConfig, triggerToast } = useContext(ManagerContext);
  const [filterStatus, setFilterStatus] = useState("ALL");

  const activeCount = gates.filter(g => g.isActive === true).length;
  const inactiveCount = gates.filter(g => g.isActive !== true).length;

  const filtered = gates.filter(g => {
    if (filterStatus === "ACTIVE") return g.isActive === true;
    if (filterStatus === "INACTIVE") return g.isActive !== true;
    return true;
  });

  const toggleGateStatus = async (gate) => {
    const newActive = gate.isActive !== true;
    try {
      await managerApi.updateGate(gate.id, { isActive: newActive });
      await syncConfig();
      triggerToast(`Đã ${newActive ? "kích hoạt" : "tạm dừng"} cổng`, "success");
    } catch (err) {
      triggerToast(err.response?.data?.message || "Cập nhật cổng thất bại", "error");
    }
  };

  // Thêm tạm vào GateMonitoringPage để debug
  console.log(gates.map(g => ({ id: g.id, name: g.gateName, isActive: g.isActive, type: typeof g.isActive })));

  return (
    <section className="flex-1 space-y-8 p-8">
      <div className="space-y-6 fade-up-element">
        <div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Giám sát & Điều khiển Cổng</h3>
          <p className="text-xs text-slate-500 mt-1">Trạng thái hoạt động của các trạm kiểm soát ra/vào.</p>
        </div>

        {/* Bộ lọc */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
          {[
            { value: "ALL", label: `Tất cả (${gates.length})` },
            { value: "ACTIVE", label: `Hoạt động (${activeCount})` },
            { value: "INACTIVE", label: `Tạm dừng (${inactiveCount})` },
          ].map(s => (
            <button
              key={s.value}
              onClick={() => setFilterStatus(s.value)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${filterStatus === s.value
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-4 text-center py-16 text-slate-400 text-sm">
              Không có cổng nào phù hợp.
            </div>
          ) : filtered.map(gate => (
            <div key={gate.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${gate.gateType === "ENTRY" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                  }`}>
                  {GATE_TYPE_LABELS[gate.gateType] || gate.gateType}
                </span>
                <span className={`h-2.5 w-2.5 rounded-full ${gate.isActive === true
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                    : "bg-red-400"
                  }`} />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-4">{gate.gateName}</h4>
              <button
                onClick={() => toggleGateStatus(gate)}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${gate.isActive === true
                    ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                  }`}
              >
                {gate.isActive === true ? "Tạm dừng hoạt động" : "Mở hoạt động"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );


};

export default GateMonitoringPage;