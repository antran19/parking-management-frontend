import React, { useState, useContext, useMemo } from "react";
import { managerApi } from "../../api/parkingApi";
import { ManagerContext } from "./ManagerLayout";

const GATE_TYPE_LABELS = {
  MAIN_ENTRY: "Cổng chính lối vào",
  MAIN_EXIT: "Cổng chính lối ra",
  MAIN_BOTH: "Cổng chính hai chiều",
  ZONE_ENTRY: "Cổng phụ lối vào",
  ZONE_EXIT: "Cổng phụ lối ra",
  ZONE_BOTH: "Cổng phụ hai chiều",
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

  // Nhóm các cổng theo Cổng chính và theo các Tầng
  const groupedGates = useMemo(() => {
    const groups = {};

    filtered.forEach(gate => {
      let groupName = "Cổng chính";
      if (gate.zone && gate.zone.floor) {
        groupName = `Tầng ${gate.zone.floor.floorName}`;
      } else if (gate.gateType?.startsWith("ZONE_")) {
        groupName = "Cổng phân khu";
      }

      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(gate);
    });

    return groups;
  }, [filtered]);

  // Sắp xếp thứ tự hiển thị của các nhóm (Cổng chính lên đầu, sau đó đến các tầng B2, B1, T1...)
  const sortedGroupNames = useMemo(() => {
    return Object.keys(groupedGates).sort((a, b) => {
      if (a === "Cổng chính") return -1;
      if (b === "Cổng chính") return 1;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [groupedGates]);

  const toggleGateStatus = async (gate) => {
    const newActive = gate.isActive !== true;
    try {
      await managerApi.updateGate(gate.id, { isActive: newActive });
      await syncConfig();
      triggerToast(`Đã ${newActive ? "kích hoạt" : "tạm dừng"} hoạt động cổng`, "success");
    } catch (err) {
      triggerToast(err.response?.data?.message || "Cập nhật cổng thất bại", "error");
    }
  };

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

        {/* Grouped list of gates as row-style cards */}
        <div className="space-y-8">
          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-400 text-sm">
              Không có cổng nào phù hợp.
            </div>
          ) : (
            sortedGroupNames.map(groupName => {
              const gatesInGroup = groupedGates[groupName];
              if (!gatesInGroup || gatesInGroup.length === 0) return null;

              return (
                <div key={groupName} className="space-y-3">
                  <div className="flex items-center gap-2 my-4">
                    <span className="w-1 h-5 bg-indigo-600 rounded-full" />
                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                      {groupName} ({gatesInGroup.length})
                    </h4>
                  </div>

                  <div className="flex flex-col gap-3">
                    {gatesInGroup.map(gate => (
                      <div
                        key={gate.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 hover:shadow-sm hover:border-indigo-150 transition-all gap-4"
                      >
                        {/* Trái: Icon + Thông tin */}
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl flex-shrink-0 ${gate.gateType?.includes("ENTRY") ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                            }`}>
                            {gate.gateType?.includes("ENTRY") ? (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-slate-800 text-sm">{gate.gateName}</h4>
                              <span className="text-[10px] font-mono bg-slate-50 text-slate-400 px-2 py-0.5 rounded border border-slate-200">
                                {gate.gateCode}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${gate.gateType?.includes("ENTRY") ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700"
                                }`}>
                                {GATE_TYPE_LABELS[gate.gateType] || gate.gateType}
                              </span>
                              {gate.zone && (
                                <span className="text-xs text-slate-500">
                                  • Khu vực: <span className="font-semibold text-slate-700">{gate.zone.zoneName} ({gate.zone.zoneCode})</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Phải: Trạng thái và Nút điều khiển */}
                        <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${gate.isActive === true ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-slate-300"}`} />
                            <span className={`text-xs font-bold ${gate.isActive === true ? "text-emerald-600" : "text-slate-500"}`}>
                              {gate.isActive === true ? "Đang hoạt động" : "Tạm dừng"}
                            </span>
                          </div>

                          <button
                            onClick={() => toggleGateStatus(gate)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap ${gate.isActive === true
                              ? "bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 border border-rose-200"
                              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 border border-emerald-200"
                              }`}
                          >
                            {gate.isActive === true ? "Tạm dừng" : "Kích hoạt"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};

export default GateMonitoringPage;