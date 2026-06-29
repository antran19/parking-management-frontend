import React, { useState, useEffect, useContext } from "react";
import { managerApi } from "../../api/parkingApi";
import { Spinner } from "../components/Spinner";
import { ManagerContext } from "./ManagerLayout";

const CapacityPage = () => {
  const { triggerToast, buildings, floors } = useContext(ManagerContext);
  const [occupancyData, setOccupancyData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState("");

  // Auto-select first building when buildings load
  useEffect(() => {
    if (buildings.length > 0 && !selectedBuilding) {
      setSelectedBuilding(buildings[0].id);
    }
  }, [buildings]);

  useEffect(() => {
    if (!selectedBuilding) return;
    const fetchOccupancy = async () => {
      setLoading(true);
      try {
        const res = await managerApi.getBuildingOccupancy(selectedBuilding);
        const bData = res.data.data;

        // Lấy danh sách floors của building này
        const buildingFloors = floors.filter(f => f.buildingId === selectedBuilding);
        const floorPromises = buildingFloors.map(f => managerApi.getFloorOccupancy(f.id));
        const floorsRes = await Promise.all(floorPromises);

        bData.floorDetails = floorsRes.map(r => r.data.data);
        setOccupancyData(bData);
      } catch (err) {
        triggerToast("Lỗi lấy dữ liệu công suất", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchOccupancy();
  }, [selectedBuilding]);

  return (
    <section className="flex-1 space-y-8 p-8">
      <div className="space-y-6 fade-up-element">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <span className="font-bold text-sm">Chọn tòa nhà:</span>
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">-- Chọn tòa nhà --</option>
            {buildings.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {loading ? <Spinner /> : occupancyData && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{occupancyData.name}</h3>
                <p className="text-sm text-slate-500 mt-1">Tổng công suất tòa nhà</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-indigo-650">{occupancyData.percent}%</p>
                <p className="text-xs text-slate-500">{occupancyData.totalOccupied} / {occupancyData.totalCapacity} chỗ</p>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="font-bold text-slate-700">Chi tiết các tầng</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(occupancyData.floorDetails || []).map((floor, idx) => {
                  const pct = floor.percent || 0;
                  let barColor = "bg-emerald-500";
                  if (pct > 75 && pct < 95) barColor = "bg-amber-500";
                  else if (pct >= 95) barColor = "bg-rose-500";

                  return (
                    <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-slate-800">{floor.floorName}</span>
                        <span className="text-xs font-mono font-bold">{floor.occupied} / {floor.capacity}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 text-right">Lấp đầy: {pct}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CapacityPage;
