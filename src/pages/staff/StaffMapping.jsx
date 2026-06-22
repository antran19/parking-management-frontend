// src/pages/staff/StaffMapping.jsx

import { useEffect, useMemo, useState } from "react";
import { staffApi } from "../../api/parkingApi";

// Sắp xếp các tầng theo thứ tự logic từ sâu nhất dưới hầm lên trên cao (B2, B1, G, 1, 2,...)
export const getFloorWeight = (key) => {
  if (key === "B2") return -2;
  if (key === "B1") return -1;
  if (key === "G") return 0;
  const num = parseInt(key.replace(/[^\d-]/g, ""));
  if (!isNaN(num)) return num;
  if (key.startsWith("T")) {
    const tNum = parseInt(key.substring(1));
    if (!isNaN(tNum)) return tNum;
  }
  return 999;
};

export const getSortedFloorKeys = (floorsObj) => {
  return Object.keys(floorsObj || {}).sort((a, b) => getFloorWeight(a) - getFloorWeight(b));
};

const initialFloors = {};

function getVehicleLabel(type) {
  if (type === "bicycle") return "Xe đạp";
  if (type === "motorbike") return "Xe máy";
  if (type === "truck") return "Xe tải";
  return "Ô tô";
}

function getZoneAvailability(zone, isClosed) {
  if (isClosed) return 0;
  return Math.max(zone.capacity - zone.currentCount - zone.reservedCount, 0);
}

function getZoneUsagePercent(zone) {
  return Math.round((zone.currentCount / zone.capacity) * 100);
}

function getZoneStatus(zone, isClosed) {
  if (isClosed) return "closed";
  const available = Math.max(zone.capacity - zone.currentCount - zone.reservedCount, 0);
  if (available === 0 || zone.status === "FULL") return "full";
  if (zone.status === "NEAR_FULL" || available <= Math.ceil(zone.capacity * 0.1)) return "nearFull";
  return "available";
}

function getStatusLabel(status) {
  if (status === "closed") return "Đã tạm đóng";
  if (status === "available") return "Còn sức chứa";
  if (status === "nearFull") return "Sắp đầy";
  return "Đã đầy";
}

export default function StaffMapping() {
  const [activeFloor, setActiveFloor] = useState("B1");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedZone, setSelectedZone] = useState(null);

  const [floors, setFloors] = useState(initialFloors);
  const [pricingRules, setPricingRules] = useState([]);

  // Closed/Locked zones synchronized dynamically via localstorage
  const [closedZones, setClosedZones] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("closedZones") || "[]"));
    } catch {
      return new Set();
    }
  });

  // Load Real-time configs from backend APIs
  const fetchRealtimeConfig = async () => {
    try {
      const res = await staffApi.getParkingConfig();
      const backendZones = res.data.data?.zones;
      const backendPricingRules = res.data.data?.pricingRules;
      if (backendPricingRules) {
        setPricingRules(backendPricingRules);
      }
      if (backendZones && backendZones.length > 0) {
        const floorMap = {};
        backendZones.forEach(z => {
          let fName = z.floorName || "B1";
          // Đồng bộ hóa tên tầng: Backend dùng "T1" -> Client hiển thị "1" (Tầng 1)
          if (fName === "T1") {
            fName = "1";
          }
          
          if (!floorMap[fName]) {
            floorMap[fName] = [];
          }
          const vName = z.vehicleTypeName || "";
          const categoryMap = { "Xe đạp": "Khu vực Xe Đạp", "Xe máy": "Khu vực Xe Máy", "Ô tô": "Khu vực Ô Tô", "Xe tải": "Khu vực Xe Tải" };
          const iconMap = { "Xe đạp": "🚲", "Xe máy": "🏍️", "Ô tô": "🚗", "Xe tải": "🚚" };
          const typeMap = { "Xe đạp": "bicycle", "Xe máy": "motorbike", "Ô tô": "car", "Xe tải": "truck" };
          const category = categoryMap[vName] || `Khu vực ${vName}`;
          const icon = iconMap[vName] || "🚗";
          let group = floorMap[fName].find(g => g.category === category);
          if (!group) {
            group = { category, icon, zones: [] };
            floorMap[fName].push(group);
          }
          group.zones.push({
            id: z.id,
            zoneCode: `${fName}-ZONE-${z.zoneCode}`,
            name: z.zoneName,
            type: typeMap[vName] || "car",
            capacity: z.capacity,
            currentCount: z.currentCount,
            reservedCount: z.reservedCount,
            status: z.status
          });
        });

        setFloors(floorMap);
        
        // Tự động chọn tầng đầu tiên (thấp nhất) nếu tầng hiện tại không có trong data backend
        const sortedFloorKeys = getSortedFloorKeys(floorMap);
        if (sortedFloorKeys.length > 0 && !floorMap[activeFloor]) {
          setActiveFloor(sortedFloorKeys[0]);
        }
      }
    } catch (err) {
      console.warn("Failed to load live parking config for staff map, using fallback:", err);
    }
  };

  useEffect(() => {
    fetchRealtimeConfig();
    const configInterval = setInterval(fetchRealtimeConfig, 2000);

    // Storage event sync
    const handleStorageChange = (e) => {
      if (e.key === "closedZones") {
        setClosedZones(new Set(JSON.parse(localStorage.getItem("closedZones") || "[]")));
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // Regular polling for closedZones in same tab
    const closedSync = setInterval(() => {
      try {
        setClosedZones(new Set(JSON.parse(localStorage.getItem("closedZones") || "[]")));
      } catch {}
    }, 1500);

    return () => {
      clearInterval(configInterval);
      clearInterval(closedSync);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Filter Zone logic
  const filterZone = (zone) => {
    const keyword = search.toLowerCase();
    const isClosed = closedZones.has(zone.id);
    const status = getZoneStatus(zone, isClosed);

    const matchSearch =
      zone.name.toLowerCase().includes(keyword) ||
      zone.zoneCode.toLowerCase().includes(keyword);

    const matchStatus = statusFilter === "all" || status === statusFilter;
    const matchType = typeFilter === "all" || zone.type === typeFilter;

    return matchSearch && matchStatus && matchType;
  };

  const groups = floors[activeFloor] || [];

  // Calculate live badge counts
  const liveCounts = useMemo(() => {
    let available = 0;
    let occupied = 0;
    let reserved = 0;
    
    groups.forEach(group => {
      group.zones.forEach(zone => {
        const isClosed = closedZones.has(zone.id);
        if (isClosed) return;
        available += getZoneAvailability(zone, false);
        occupied += zone.currentCount || 0;
        reserved += zone.reservedCount || 0;
      });
    });

    return { available, occupied, reserved };
  }, [groups, closedZones]);

  return (
    <section className="flex-1 space-y-6 p-5">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        {/* Floor button switcher */}
        <div className="flex rounded-2xl bg-slate-200/80 p-1 border border-slate-300/30">
          {getSortedFloorKeys(floors).length > 0 ? getSortedFloorKeys(floors).map(floorKey => {
            const labelMap = { "B1": "Hầm B1", "B2": "Hầm B2", "G": "Tầng G", "1": "Tầng 1", "T1": "Tầng 1", "T2": "Tầng 2" };
            const iconMap = { "B1": "🏢", "B2": "🏢", "G": "🏠" };
            return (
              <FloorButton
                key={floorKey}
                active={activeFloor === floorKey}
                onClick={() => setActiveFloor(floorKey)}
                icon={iconMap[floorKey] || "🏢"}
                label={labelMap[floorKey] || `Tầng ${floorKey}`}
              />
            );
          }) : (
            <div className="px-4 py-2 text-sm text-slate-600 font-bold">Đang tải dữ liệu tầng...</div>
          )}
        </div>

        {/* Total live availability count for the current floor */}
        <div className="flex flex-wrap gap-3">
          <Badge color="green" label={`Còn sức chứa: ${liveCounts.available}`} />
          <Badge color="red" label={`Đang gửi: ${liveCounts.occupied}`} />
          <Badge color="amber" label={`Đã giữ chỗ: ${liveCounts.reserved}`} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none text-sm font-semibold text-slate-700 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="available">Còn chỗ trống</option>
            <option value="nearFull">Sắp đầy</option>
            <option value="full">Đã đầy</option>
            <option value="closed">Đã tạm khóa</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none text-sm font-semibold text-slate-700 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="all">Tất cả phương tiện</option>
            <option value="bicycle">🚲 Xe đạp</option>
            <option value="motorbike">🏍️ Xe máy</option>
            <option value="car">🚗 Ô tô</option>
            <option value="truck">🚚 Xe tải</option>
          </select>
        </div>

        <div className="relative w-full md:w-80">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm phân khu hoặc mã zone..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all text-sm font-medium"
          />
          <span className="absolute left-3.5 top-3.5 text-slate-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        </div>
      </div>

      {/* Bố cục 2 cột tối ưu hóa khoảng trắng và hiển thị Premium giống Driver */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        
        {/* Cột trái: Bảng thống kê các Zone */}
        <div className="lg:col-span-8 space-y-10">
          {groups.map((group) => {
            const matchedZones = group.zones.filter(filterZone);
            if (matchedZones.length === 0) return null;
            return (
              <section key={group.category} className="space-y-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-md font-extrabold uppercase text-slate-900 tracking-wide">
                    {group.category}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {matchedZones.map((zone) => {
                    const isClosed = closedZones.has(zone.id);
                    return (
                      <ZoneCard
                        key={zone.id}
                        zone={zone}
                        isClosed={isClosed}
                        onClick={() => setSelectedZone(zone)}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}

          {groups.length === 0 && (
            <div className="text-center py-16 text-slate-550 font-bold text-sm">
              Không tìm thấy cấu hình bãi xe nào phù hợp
            </div>
          )}
        </div>

        {/* Cột phải: Bản đồ dẫn đường SVG mini, biểu phí bãi đỗ & hướng dẫn sử dụng dành cho Nhân viên */}
        <div className="action-panel-item lg:col-span-4 space-y-6">
          {/* Bản đồ định vị nhanh */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <span className="text-xl">🗺️</span>
              <h3 className="text-sm font-bold text-slate-800">Định vị nhanh ({activeFloor === "B1" || activeFloor === "B2" ? "Tầng Hầm" : "Tầng Nổi"})</h3>
            </div>
            
            {/* SVG Live Direction Map */}
            <div className="relative rounded-2xl bg-slate-900 aspect-[4/3] w-full flex items-center justify-center border border-slate-800 overflow-hidden shadow-inner">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(79,70,229,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(79,70,229,0.05)_1px,transparent_1px)] bg-[size:16px_16px]" />
              
              <svg className="w-4/5 h-4/5 text-slate-600 z-10" viewBox="0 0 200 150">
                <rect x="10" y="10" width="180" height="130" rx="8" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                
                <text x="25" y="25" className="fill-emerald-400 font-sans text-[7px] font-black tracking-widest">CỔNG VÀO</text>
                <path d="M 10 30 L 40 30" stroke="#34d399" strokeWidth="1.5" />
                
                <text x="130" y="138" className="fill-rose-400 font-sans text-[7px] font-black tracking-widest">CỔNG RA</text>
                <path d="M 160 120 L 190 120" stroke="#f87171" strokeWidth="1.5" />
                
                <line x1="85" y1="10" x2="85" y2="140" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 3" />
                
                <g className="opacity-50">
                  <rect x="25" y="45" width="20" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1" />
                  <rect x="25" y="65" width="20" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1" />
                  <rect x="25" y="85" width="20" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1" />
                  
                  <rect x="155" y="45" width="20" height="12" rx="1.5" fill="none" stroke="#6366f1" strokeWidth="1.5" />
                  <text x="157" y="53" className="fill-indigo-400 font-mono text-[5px] font-bold">B1-B</text>
                  <rect x="155" y="65" width="20" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1" />
                  <rect x="155" y="85" width="20" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1" />
                </g>
                
                <circle cx="100" cy="75" r="16" className="fill-indigo-500/10 stroke-indigo-500/30" strokeWidth="1" />
                <text x="100" y="78" textAnchor="middle" className="fill-indigo-400 font-sans text-[8px] font-bold">Lối di chuyển</text>
              </svg>
              
              <div className="absolute bottom-3 left-4 text-[9px] font-semibold text-slate-500 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Hệ thống lưu thông thông minh
              </div>
            </div>
          </div>

          {/* Biểu phí áp dụng */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <span className="text-xl">💳</span>
              <h3 className="text-sm font-bold text-slate-800">Biểu Phí Giữ Chỗ Áp Dụng</h3>
            </div>
            
            <div className="space-y-3.5">
              {pricingRules && pricingRules.length > 0 ? (
                pricingRules.map((rule) => {
                  const typeLabel = rule.pricingType === "HOURLY" ? "giờ" : rule.pricingType === "DAILY" ? "ngày" : "tháng";
                  return (
                    <div key={rule.id} className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-500">{rule.vehicleTypeName} ({typeLabel})</span>
                      <span className="font-bold text-slate-800">
                        {Number(rule.pricePerUnit).toLocaleString("vi-VN")}đ
                        {rule.freeMinutes > 0 ? ` (Miễn phí ${rule.freeMinutes}m)` : ""}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-500 font-bold text-center py-2">Chưa cấu hình biểu phí bãi đỗ</div>
              )}
            </div>
          </div>

          {/* Chỉ dẫn nghiệp vụ nhân viên */}
          <div className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-6 shadow-sm space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">💡 Chỉ dẫn nghiệp vụ nhân viên</h4>
            <p className="text-xs text-indigo-900/80 leading-relaxed font-medium">
              Nhấn trực tiếp vào phân khu (zone) bất kỳ để xem chi tiết sức chứa và trạng thái hoạt động hiện tại của từng khu vực trong bãi đỗ.
            </p>
          </div>
        </div>

      </div>

      {/* Zone Action Modal */}
      {selectedZone && (
        <ZoneModal
          zone={selectedZone}
          isClosed={closedZones.has(selectedZone.id)}
          onClose={() => setSelectedZone(null)}
        />
      )}
    </section>
  );
}

function FloorButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-150 cursor-pointer ${
        active ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-white/40"
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function Badge({ color, label }) {
  const classes = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    red: "bg-rose-50 text-rose-700 border-rose-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  };

  return (
    <div className={`rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-wider ${classes[color]}`}>
      {label}
    </div>
  );
}

function ZoneCard({ zone, isClosed, onClick }) {
  const available = getZoneAvailability(zone, isClosed);
  const usagePercent = getZoneUsagePercent(zone);
  const status = getZoneStatus(zone, isClosed);
  
  const style = isClosed
    ? "border-slate-200 bg-slate-100/60 opacity-80 hover:opacity-100"
    : status === "available"
    ? "border-emerald-100 bg-white hover:border-emerald-200 hover:shadow-md hover:translate-y-[-2px]"
    : status === "nearFull"
    ? "border-amber-100 bg-amber-50/10 hover:border-amber-250 hover:shadow-md hover:translate-y-[-2px]"
    : "border-rose-100 bg-rose-50/10 hover:border-rose-250 hover:shadow-md hover:translate-y-[-2px]";

  const barColor = isClosed ? "bg-slate-400" : status === "available" ? "bg-emerald-500" : status === "nearFull" ? "bg-amber-500" : "bg-rose-500";
  const statusBadgeColor = isClosed
    ? "bg-slate-200 text-slate-700 border-slate-300"
    : status === "available"
    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
    : status === "nearFull"
    ? "bg-amber-50 text-amber-700 border-amber-150"
    : "bg-rose-50 text-rose-700 border-rose-150";

  return (
    <button onClick={onClick} className={`zone-card-item rounded-2xl border p-4.5 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${style}`}>
      <div className="w-full">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{zone.zoneCode}</span>
          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${statusBadgeColor}`}>
            {isClosed ? "🔒 Đã Khóa" : getStatusLabel(status)}
          </span>
        </div>
        
        <h3 className="mt-2 text-base font-extrabold text-slate-800 leading-snug">{zone.name}</h3>
        <p className="mt-0.5 text-[11px] font-bold text-slate-600 flex items-center gap-1">
          <span>{zone.type === "bicycle" ? "🚲" : zone.type === "motorbike" ? "🏍️" : zone.type === "truck" ? "🚚" : "🚗"}</span>
          <span>{getVehicleLabel(zone.type)}</span>
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 w-full">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Sức chứa</p>
            <p className="mt-0.5 text-xs font-black text-slate-700">{zone.capacity}</p>
          </div>
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Đang gửi</p>
            <p className="mt-0.5 text-xs font-black text-slate-700">{zone.currentCount}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-500">Còn trống</p>
            <p className="mt-0.5 text-xs font-black text-indigo-650">{available}</p>
          </div>
        </div>

        {/* Compact usage bar */}
        <div className="mt-3.5 flex items-center justify-between text-[10px] font-extrabold tracking-wide text-slate-500">
          <span>Tỷ lệ sử dụng</span>
          <span>{usagePercent}%</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${usagePercent}%` }} />
        </div>
      </div>
    </button>
  );
}

function ZoneModal({ zone, isClosed, onClose }) {
  const available = getZoneAvailability(zone, isClosed);
  const usagePercent = getZoneUsagePercent(zone);
  const status = getZoneStatus(zone, isClosed);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-250 bg-white shadow-2xl animate-scale-up">
        <div className="flex items-center justify-between bg-slate-900 p-6 text-white">
          <div>
            <h3 className="text-lg font-bold">Phân khu {zone.zoneCode}</h3>
            <p className="text-xs text-slate-350 mt-0.5">{zone.name}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/10 text-white transition-colors cursor-pointer">
            ✕
          </button>
        </div>

        <div className="space-y-4 p-8">
          <div className={`rounded-2xl p-5 text-center border ${
            isClosed
              ? "bg-slate-100 text-slate-600 border-slate-200"
              : status === "available"
              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
              : status === "nearFull"
              ? "bg-amber-50 text-amber-700 border-amber-100"
              : "bg-rose-50 text-rose-700 border-rose-100"
          }`}>
            <div className="text-3xl mb-1">{isClosed ? "🔒" : "🟢"}</div>
            <h4 className="text-base font-bold">
              Trạng thái: {isClosed ? "Phân khu đang TẠM KHÓA" : getStatusLabel(status)}
            </h4>
            <p className="text-[11px] font-semibold text-slate-500 mt-1">
              {isClosed ? "Tài xế không thể xem và đặt chỗ tại phân khu này" : `Còn lại ${available} chỗ trống có thể sử dụng`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4.5 pt-2">
            <InfoBlock label="Sức chứa tối đa" value={zone.capacity} />
            <InfoBlock label="Số xe đang đỗ" value={zone.currentCount} />
            <InfoBlock label="Số xe đặt trước" value={zone.reservedCount} />
            <InfoBlock label="Hiệu suất đỗ" value={`${usagePercent}%`} />
          </div>
        </div>

        <div className="flex gap-3 bg-slate-50 p-6 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-slate-250 py-3 font-semibold text-slate-650 hover:bg-white text-sm transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 flex justify-between items-center text-xs font-semibold">
      <span className="text-slate-650">{label}:</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}
