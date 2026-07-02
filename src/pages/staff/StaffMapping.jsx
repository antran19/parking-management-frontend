// src/pages/staff/StaffMapping.jsx

import { useEffect, useMemo, useState } from "react";
import { staffApi } from "../../api/parkingApi";
import { formatLicensePlate } from "../../utils/licensePlate";

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

  // Modal States
  const [selectedParkedZone, setSelectedParkedZone] = useState(null);
  const [selectedReservedZone, setSelectedReservedZone] = useState(null);
  const [zoneSessions, setZoneSessions] = useState([]);
  const [zoneReservations, setZoneReservations] = useState([]);
  const [loadingModalList, setLoadingModalList] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

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

    const handleStorageChange = (e) => {
      if (e.key === "closedZones") {
        setClosedZones(new Set(JSON.parse(localStorage.getItem("closedZones") || "[]")));
      }
    };
    window.addEventListener("storage", handleStorageChange);

    const closedSync = setInterval(() => {
      try {
        setClosedZones(new Set(JSON.parse(localStorage.getItem("closedZones") || "[]")));
      } catch { }
    }, 1500);

    return () => {
      clearInterval(configInterval);
      clearInterval(closedSync);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Fetch active sessions for a specific zone
  const handleViewParked = async (zone) => {
    setSelectedParkedZone(zone);
    setLoadingModalList(true);
    try {
      const res = await staffApi.getAllSessionsHistory();
      const activeInZone = (res.data.data || []).filter(
        s => s.status === "ACTIVE" && s.zoneId === zone.id
      );
      setZoneSessions(activeInZone);
    } catch (err) {
      console.error("Failed to load zone sessions:", err);
    } finally {
      setLoadingModalList(false);
    }
  };

  // Fetch active reservations for a specific zone
  const handleViewReserved = async (zone) => {
    setSelectedReservedZone(zone);
    setLoadingModalList(true);
    try {
      const res = await staffApi.getAllReservations({ zoneId: zone.id });
      const activeRes = (res.data.data || []).filter(
        r => r.status === "PENDING" || r.status === "CONFIRMED"
      );
      setZoneReservations(activeRes);
    } catch (err) {
      console.error("Failed to load zone reservations:", err);
    } finally {
      setLoadingModalList(false);
    }
  };

  // Helper print for reservation ticket (triggered inside the detail modal)
  const handlePrintReservation = (res) => {
    if (!res) return;
    const printWindow = window.open("", "_blank", "width=600,height=600");
    if (!printWindow) {
      alert("Vui lòng cho phép trình duyệt mở popup để in vé đặt chỗ!");
      return;
    }
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${res.reservationCode}`;
    printWindow.document.write(`
      <html>
        <head>
          <title>Vé đặt chỗ - #${res.reservationCode}</title>
          <style>
            body { font-family: Consolas, 'Courier New', monospace; text-align: center; padding: 20px; color: #333; background: #fff; }
            .ticket-container { border: 2px dashed #444; padding: 20px; display: inline-block; width: 280px; }
            .header { font-size: 18px; font-weight: bold; margin-bottom: 5px; letter-spacing: 2px; }
            .subtitle { font-size: 11px; margin-bottom: 15px; text-transform: uppercase; font-weight: 600; }
            .info-row { display: flex; justify-content: space-between; font-size: 12px; margin: 5px 0; border-bottom: 1px dotted #bbb; padding-bottom: 3px; font-weight: 600; }
            .info-value { font-weight: 600; }
            .qr-code { margin: 15px 0; }
            .footer { font-size: 10px; margin-top: 15px; border-top: 1px dashed #444; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="ticket-container">
            <div class="header">RESERVATION TICKET</div>
            <div class="subtitle">Vé Đặt Giữ Chỗ Trước</div>
            
            <div class="qr-code">
              <img src="${qrUrl}" alt="QR Code" width="120" height="120" style="display: block; margin: 0 auto;" />
            </div>

            <div class="info-row"><span>Mã đặt chỗ:</span><span class="info-value">#${res.reservationCode}</span></div>
            <div class="info-row"><span>Biển số xe:</span><span class="info-value">${formatLicensePlate(res.licensePlate, res.vehicleTypeName) || "---"}</span></div>
            <div class="info-row"><span>Phương tiện:</span><span class="info-value">${res.vehicleTypeName || "---"}</span></div>
            <div class="info-row"><span>Khách hàng:</span><span class="info-value">${res.customerName || "---"}</span></div>
            <div class="info-row"><span>Vị trí đỗ:</span><span class="info-value">${res.floorName}-ZONE-${res.zoneCode}</span></div>
            <div class="info-row"><span>Thời gian hẹn:</span><span class="info-value" style="font-size:10px;">${new Date(res.reservedFrom).toLocaleString("vi-VN")}</span></div>
            <div class="info-row"><span>Hạn đến:</span><span class="info-value" style="font-size:10px;">${new Date(res.reservedTo).toLocaleString("vi-VN")}</span></div>
            
            <div class="footer">
              <p>Vui lòng đến đúng giờ để check-in!</p>
              <p>Smart Parking System</p>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

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
    <section className="flex-1 space-y-6 p-3">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
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

        <div className="flex flex-wrap gap-3">
          <Badge color="green" label={`Còn sức chứa: ${liveCounts.available}`} />
          <Badge color="red" label={`Đang gửi: ${liveCounts.occupied}`} />
          <Badge color="amber" label={`Đã giữ chỗ: ${liveCounts.reserved}`} />
        </div>
      </div>

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
          <span className="absolute left-3.5 top-3.5 text-slate-550">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
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
                        onViewParked={handleViewParked}
                        onViewReserved={handleViewReserved}
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

        <div className="action-panel-item lg:col-span-4 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <span className="text-xl">🗺️</span>
              <h3 className="text-sm font-bold text-slate-800">Định vị nhanh ({activeFloor === "B1" || activeFloor === "B2" ? "Tầng Hầm" : "Tầng Nổi"})</h3>
            </div>

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

              <div className="absolute bottom-3 left-4 text-[9px] font-semibold text-slate-550 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Hệ thống lưu thông thông minh
              </div>
            </div>
          </div>

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
                      <span className="font-semibold text-slate-550">{rule.vehicleTypeName} ({typeLabel})</span>
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

          <div className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-6 shadow-sm space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">💡 Chỉ dẫn nghiệp vụ nhân viên</h4>
            <p className="text-xs text-indigo-900/80 leading-relaxed font-medium">
              Nhấp trực tiếp vào con số 🔍 bên cạnh mục <b>Đang gửi</b> hoặc <b>Đặt trước</b> của phân khu đỗ để xem danh sách chi tiết các phương tiện.
            </p>
          </div>
        </div>
      </div>

      {/* Active Parked Sessions List Modal */}
      {selectedParkedZone && (
        <ParkedVehiclesModal
          zone={selectedParkedZone}
          sessions={zoneSessions}
          loading={loadingModalList}
          onClose={() => {
            setSelectedParkedZone(null);
            setZoneSessions([]);
          }}
          onViewReceipt={setSelectedReceipt}
        />
      )}

      {/* Parked Session Receipt Detail Modal (styled like StaffHistory ticket, no print) */}
      {selectedReceipt && (
        <ParkedReceiptModal
          session={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {/* Reservations List Modal */}
      {selectedReservedZone && (
        <ReservedVehiclesModal
          zone={selectedReservedZone}
          reservations={zoneReservations}
          loading={loadingModalList}
          onClose={() => {
            setSelectedReservedZone(null);
            setZoneReservations([]);
          }}
          onViewTicket={(res) => setSelectedReservation(res)}
        />
      )}

      {/* Reservation Ticket POS Preview Modal (styled like Check-in ticket with QR and print option) */}
      {selectedReservation && (
        <ReservationTicketModal
          reservation={selectedReservation}
          onClose={() => setSelectedReservation(null)}
          onPrint={handlePrintReservation}
        />
      )}
    </section>
  );
}

function FloorButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-150 cursor-pointer ${active ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-white/40"
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

function ZoneCard({ zone, isClosed, onViewParked, onViewReserved }) {
  const available = getZoneAvailability(zone, isClosed);
  const usagePercent = getZoneUsagePercent(zone);
  const status = getZoneStatus(zone, isClosed);

  const style = isClosed
    ? "border-slate-200 bg-slate-100/60 opacity-80"
    : status === "available"
      ? "border-emerald-100 bg-white hover:border-emerald-250 hover:shadow-sm"
      : status === "nearFull"
        ? "border-amber-100 bg-amber-50/10 hover:border-amber-250 hover:shadow-sm"
        : "border-rose-100 bg-rose-50/10 hover:border-rose-250 hover:shadow-sm";

  const barColor = isClosed ? "bg-slate-400" : status === "available" ? "bg-emerald-500" : status === "nearFull" ? "bg-amber-500" : "bg-rose-500";
  const statusBadgeColor = isClosed
    ? "bg-slate-200 text-slate-700 border-slate-300"
    : status === "available"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : status === "nearFull"
        ? "bg-amber-50 text-amber-700 border-amber-150"
        : "bg-rose-50 text-rose-700 border-rose-150";

  return (
    <div className={`zone-card-item rounded-2xl border p-4.5 text-left transition-all duration-200 flex flex-col justify-between ${style}`}>
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
        <div className="grid grid-cols-4 gap-1 text-center items-center">
          <div className="p-1">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Sức chứa</p>
            <p className="mt-0.5 text-xs font-black text-slate-700">{zone.capacity}</p>
          </div>

          <button
            type="button"
            disabled={isClosed || zone.currentCount === 0}
            onClick={() => onViewParked(zone)}
            className={`p-1 py-1.5 rounded-xl transition-all ${!isClosed && zone.currentCount > 0
              ? "hover:bg-slate-100 hover:text-indigo-600 cursor-pointer active:scale-95 border border-slate-100 shadow-xs"
              : "opacity-50 cursor-not-allowed"
              }`}
          >
            <p className="text-[10px] font-black uppercase tracking-wider text-rose-600">Đang gửi</p>
            <p className="mt-0.5 text-xs font-black text-slate-800 flex items-center justify-center gap-0.5">
              <span>{zone.currentCount}</span>
              {!isClosed && zone.currentCount > 0 && <span className="text-[8px] opacity-75"></span>}
            </p>
          </button>

          <button
            type="button"
            disabled={isClosed || zone.reservedCount === 0}
            onClick={() => onViewReserved(zone)}
            className={`p-1 py-1.5 rounded-xl transition-all ${!isClosed && zone.reservedCount > 0
              ? "hover:bg-slate-100 hover:text-indigo-600 cursor-pointer active:scale-95 border border-slate-100 shadow-xs"
              : "opacity-50 cursor-not-allowed"
              }`}
          >
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-600">Đặt trước</p>
            <p className="mt-0.5 text-xs font-black text-slate-800 flex items-center justify-center gap-0.5">
              <span>{zone.reservedCount}</span>
              {!isClosed && zone.reservedCount > 0 && <span className="text-[8px] opacity-75"></span>}
            </p>
          </button>

          <div className="p-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Còn trống</p>
            <p className="mt-0.5 text-xs font-black text-indigo-650">{available}</p>
          </div>
        </div>

        <div className="mt-3.5 flex items-center justify-between text-[13px] font-extrabold tracking-wide text-slate-500">
          <span>Tỷ lệ sử dụng</span>
          <span>{usagePercent}%</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${usagePercent}%` }} />
        </div>
      </div>
    </div>
  );
}

// Modal hiển thị danh sách các xe đang đỗ (Đang gửi)
function ParkedVehiclesModal({ zone, sessions, loading, onClose, onViewReceipt }) {
  const getTicketTypeLabel = (driverType, passType) => {
    const dType = (driverType || "").toUpperCase();
    const pType = (passType || "").toUpperCase();
    if (dType === 'SUBSCRIBER') {
      const passTypeLabels = {
        MONTHLY: "Vé tháng",
        QUARTERLY: "Vé quý",
        YEARLY: "Vé năm"
      };
      return passTypeLabels[pType] || "Vé tháng";
    }
    if (dType === 'PRE_BOOKED') return "Vé đặt trước";
    return "Vé lượt";
  };

  const formatDuration = (entryTime) => {
    if (!entryTime) return "---";
    const minutes = Math.floor((Date.now() - new Date(entryTime).getTime()) / 60000);
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 p-4 pt-[10vh]">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-scale-up flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between bg-indigo-700 p-4 text-white shrink-0">
          <div>
            <h3 className="text-base font-extrabold uppercase tracking-wide">Danh sách xe đang gửi</h3>
            <p className="text-xs text-slate-200 mt-0.5">Phân khu {zone.zoneCode} - Tầng {zone.name}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/10 text-white transition-colors cursor-pointer text-sm font-bold">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-20 text-center font-bold text-slate-500 text-sm animate-pulse">
              Đang tải danh sách phương tiện đỗ...
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-20 text-center font-bold text-slate-400 text-sm">
              Không có phương tiện nào đang đỗ tại phân khu này
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-[14px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[12px] font-black uppercase tracking-wider text-slate-600">
                    <th className="p-3.5">Mã Vé</th>
                    <th className="p-3.5">Biển Số</th>
                    <th className="p-3.5">Loại Vé</th>
                    <th className="p-3.5">Thời Gian Vào</th>
                    <th className="p-3.5">Thời Gian Đỗ</th>
                    <th className="p-3.5">Trạng Thái</th>
                    <th className="p-3.5 text-center">Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {sessions.map((sess) => (
                    <tr key={sess.sessionId} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{sess.sessionCode}</td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm border-2 border-slate-800 bg-white font-mono font-bold text-slate-900 text-[15px] shadow-sm">
                          {formatLicensePlate(sess.licensePlate, sess.vehicleType)}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${sess.driverType === "SUBSCRIBER"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                          : sess.driverType === "PRE_BOOKED"
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-slate-100 text-slate-750"
                          }`}>
                          {getTicketTypeLabel(sess.driverType, sess.passType)}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-550">
                        {sess.entryTime ? new Date(sess.entryTime).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " • " + new Date(sess.entryTime).toLocaleDateString("vi-VN") : "---"}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">{formatDuration(sess.entryTime)}</td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold uppercase">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                          Đang đỗ
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => onViewReceipt(sess)}
                          className="px-3 py-1.5  text-black rounded-lg text-[10px] font-bold  tracking-wider hover:bg-slate-200 cursor-pointer active:scale-95 transition-all shadow-xs border border-slate-300"
                        >
                          Biên Lai
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex gap-3 bg-slate-50 p-2 border-t border-slate-150 shrink-0">
          <button
            onClick={onClose}
            className="ml-auto px-6 py-2.5 rounded-xl border border-slate-350 bg-white font-bold text-slate-700 hover:bg-slate-100 text-xs transition-colors cursor-pointer active:scale-95"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal hiển thị Biên Lai của xe đang đỗ (Tương tự StaffHistory, KHÔNG có nút in)
function ParkedReceiptModal({ session, onClose }) {
  const getTicketTypeLabel = (driverType, passType) => {
    const dType = (driverType || "").toUpperCase();
    const pType = (passType || "").toUpperCase();
    if (dType === 'SUBSCRIBER') {
      const passTypeLabels = {
        MONTHLY: "Vé tháng",
        QUARTERLY: "Vé quý",
        YEARLY: "Vé năm"
      };
      return passTypeLabels[pType] || "Vé tháng";
    }
    if (dType === 'PRE_BOOKED') return "Vé đặt trước";
    return "Vé lượt";
  };

  const formatDuration = (entryTime) => {
    if (!entryTime) return "---";
    const minutes = Math.floor((Date.now() - new Date(entryTime).getTime()) / 60000);
    if (minutes < 60) return `${minutes} phút`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`;
  };

  const ticketType = getTicketTypeLabel(session.driverType, session.passType);
  const duration = formatDuration(session.entryTime);
  const feeText = session.totalFee !== null && session.totalFee !== undefined
    ? `${Number(session.totalFee).toLocaleString("vi-VN")}đ`
    : "Đang tính...";

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xs overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl flex flex-col gap-4 border-t-8 border-t-indigo-600 animate-scale-in">
        {/* Decorative punch holes */}
        <div className="absolute left-0 top-[105px] -ml-2.5 w-5 h-5 rounded-full bg-[#111827] border-r border-slate-200/80 z-10"></div>
        <div className="absolute right-0 top-[105px] -mr-2.5 w-5 h-5 rounded-full bg-[#111827] border-l border-slate-200/80 z-10"></div>

        {/* Close icon button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-655 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Ticket Header */}
        <div className="text-center border-b border-dashed border-slate-200 pb-3">
          <h4 className="font-extrabold text-sm text-slate-800 tracking-wider">SMART PAYMENT TICKET</h4>
          <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mt-1">
            HÓA ĐƠN TẠM TÍNH
          </p>
        </div>

        {/* Ticket Details */}
        <div className="space-y-2 text-xs font-semibold text-slate-500 pt-1">
          <div className="flex justify-between items-center">
            <span>Mã phiên gửi:</span>
            <span className="text-slate-600 font-mono font-bold">
              #{session.sessionCode}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Biển số xe:</span>
            <span className="text-slate-600 text-xs font-black tracking-wide uppercase px-2 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono">
              {formatLicensePlate(session.licensePlate, session.vehicleType)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Loại xe:</span>
            <span className="text-slate-600 font-black">
              {getVehicleLabel(session.vehicleType)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Loại vé:</span>
            <span className="text-slate-600 font-black">
              {ticketType}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Vị trí đỗ:</span>
            <span className="text-slate-600 font-black">
              {session.floorName}-ZONE-{session.zoneCode}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Thời gian vào:</span>
            <span className="text-slate-800 font-mono text-[11px] font-bold">
              {new Date(session.entryTime).toLocaleString("vi-VN")}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Thời gian gửi:</span>
            <span className="text-slate-600 font-extrabold">
              {duration}
            </span>
          </div>

          <div className="border-t border-dashed border-slate-200 pt-3 flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-bold">
              Phí tạm tính:
            </span>
            <span className="text-xl font-black text-indigo-650 mt-0.5">
              {feeText}
            </span>
          </div>

          <div className="border-t border-dashed border-slate-200 pt-3 text-center text-[10px] text-slate-450 font-medium leading-normal mt-1">
            Chúc quý khách một ngày tốt lành!
          </div>
        </div>

        <div className="flex border-t border-slate-100 pt-3 mt-1 ">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-slate-250 bg-slate-50 py-2.5 font-bold text-slate-655 hover:bg-slate-100 text-xs transition-colors cursor-pointer text-center"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal hiển thị danh sách các xe đặt trước (Đặt trước)
function ReservedVehiclesModal({ zone, reservations, loading, onClose, onViewTicket }) {
  const getStatusBadgeColor = (status) => {
    if (status === "CONFIRMED") return "bg-emerald-50 text-emerald-700 border-emerald-100";
    if (status === "PENDING") return "bg-amber-50 text-amber-700 border-amber-100";
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  const getStatusText = (status) => {
    if (status === "CONFIRMED") return "Đã thanh toán";
    if (status === "PENDING") return "Chờ thanh toán";
    return status;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 p-4 pt-[10vh]">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-scale-up flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between bg-indigo-700 p-4 text-white shrink-0">
          <div>
            <h3 className="text-base font-extrabold uppercase tracking-wide">Danh sách xe đặt chỗ trước</h3>
            <p className="text-xs text-slate-200 mt-0.5">Phân khu {zone.zoneCode} - Tầng {zone.name}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-white/10 text-white transition-colors cursor-pointer text-sm font-bold">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-20 text-center font-bold text-slate-500 text-sm animate-pulse">
              Đang tải danh sách đặt giữ chỗ...
            </div>
          ) : reservations.length === 0 ? (
            <div className="py-20 text-center font-bold text-slate-400 text-sm">
              Không có lượt đặt trước nào có lịch đỗ trong khu vực này hôm nay
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-[14px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[12px] font-black uppercase tracking-wider text-slate-600">
                    <th className="p-3.5">Mã Đặt Trước</th>
                    <th className="p-3.5">Biển Số</th>
                    <th className="p-3.5">Thời Gian Hẹn</th>
                    <th className="p-3.5">Khách Hàng</th>
                    <th className="p-3.5">Trạng Thái</th>
                    <th className="p-3.5 text-center">Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {reservations.map((res) => (
                    <tr key={res.reservationId} className="hover:bg-slate-50/50">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{res.reservationCode}</td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-sm border-2 border-slate-800 bg-white font-mono font-bold text-slate-900 text-[15px] shadow-sm">
                          {formatLicensePlate(res.licensePlate, res.vehicleTypeName)}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-550">
                        {res.reservedFrom ? (
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-850">
                              {new Date(res.reservedFrom).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                              {" - "}
                              {new Date(res.reservedTo).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                            <div className="text-[15px] text-slate-500">
                              {new Date(res.reservedFrom).toLocaleDateString("vi-VN")}
                            </div>
                          </div>
                        ) : "---"}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">{res.customerName || "Thuê bao đặt chỗ"}</td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center px-2.5 py-0.5 border rounded-full text-[11px] font-bold uppercase bg-indigo-50 text-indigo-700 border-indigo-150">
                          {getStatusText(res.status)}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => onViewTicket(res)}
                          className="px-3 py-1.5 text-black rounded-lg text-[10px] font-bold tracking-wider hover:bg-slate-200 cursor-pointer active:scale-95 transition-all shadow-xs border border-slate-300"
                        >
                          Vé Đặt Chỗ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex gap-3 bg-slate-50 p-2 border-t border-slate-150 shrink-0">
          <button
            onClick={onClose}
            className="ml-auto px-6 py-2.5 rounded-xl border border-slate-350 bg-white font-bold text-slate-700 hover:bg-slate-100 text-xs transition-colors cursor-pointer active:scale-95"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal xem chi tiết Vé Đặt Chỗ POS Style có chứa QR code đặt ở trên và nút in ở dưới
function ReservationTicketModal({ reservation, onClose, onPrint }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${reservation.reservationCode}`;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-xs overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl flex flex-col gap-4 border-t-8 border-t-amber-500 animate-scale-in">
        {/* Decorative punch holes */}
        <div className="absolute left-0 top-[105px] -ml-2.5 w-5 h-5 rounded-full bg-[#111827] border-r border-slate-200/80 z-10"></div>
        <div className="absolute right-0 top-[105px] -mr-2.5 w-5 h-5 rounded-full bg-[#111827] border-l border-slate-200/80 z-10"></div>

        {/* Close icon button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-655 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Ticket Header */}
        <div className="text-center border-b border-dashed border-slate-200 pb-3">
          <h4 className="font-extrabold text-sm text-slate-800 tracking-wider">RESERVATION TICKET</h4>
          <p className="text-[10px] text-amber-600 font-extrabold uppercase tracking-wider mt-1">
            VÉ ĐẶT GIỮ CHỖ TRƯỚC
          </p>
        </div>

        {/* QR Code at the top */}
        <div className="flex flex-col items-center justify-center py-1">
          <div className="p-1.5 bg-white rounded-xl shadow-inner border border-slate-100 flex items-center justify-center">
            <img
              src={qrUrl}
              alt="QR Reservation"
              className="w-[85px] h-[85px] object-contain"
            />
          </div>
          <span className="font-mono text-[9px] text-slate-500 font-extrabold tracking-wider mt-1.5 uppercase">
            {reservation.reservationCode}
          </span>
        </div>

        {/* Ticket Details */}
        <div className="space-y-2 text-xs font-semibold text-slate-500 pt-1">
          <div className="flex justify-between items-center">
            <span>Mã đặt chỗ:</span>
            <span className="text-slate-600 font-mono font-bold">
              #{reservation.reservationCode}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Biển số xe:</span>
            <span className="text-slate-600 text-xs font-black tracking-wide uppercase px-2 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono">
              {formatLicensePlate(reservation.licensePlate, reservation.vehicleTypeName)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Phương tiện:</span>
            <span className="text-slate-600 font-black">
              {reservation.vehicleTypeName || "---"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Khách hàng:</span>
            <span className="text-slate-600 font-black">
              {reservation.customerName || "---"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Vị trí đỗ:</span>
            <span className="text-slate-600 font-black">
              {reservation.floorName}-ZONE-{reservation.zoneCode}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Giờ hẹn đến:</span>
            <span className="text-slate-800 font-mono text-[11px] font-bold">
              {new Date(reservation.reservedFrom).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Hạn hết giờ:</span>
            <span className="text-slate-800 font-mono text-[11px] font-bold">
              {new Date(reservation.reservedTo).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Ngày đỗ xe:</span>
            <span className="text-slate-600 font-extrabold">
              {new Date(reservation.reservedFrom).toLocaleDateString("vi-VN")}
            </span>
          </div>

          <div className="border-t border-dashed border-slate-200 pt-3 text-center text-[10px] text-slate-400 font-medium leading-normal mt-1">
            Vui lòng đến đúng giờ để check-in!
          </div>
        </div>

        <div className="flex gap-2 border-t border-slate-100 pt-3 mt-1">
          <button
            onClick={() => onPrint(reservation)}
            className="flex-1 ml-1 mr-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-850 cursor-pointer active:scale-95 transition-all shadow-xs"
          >
            🖨️ In Vé
          </button>
          <button
            onClick={onClose}
            className="px-8 py-2 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-655 hover:bg-slate-100 text-xs transition-colors cursor-pointer active:scale-95"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
