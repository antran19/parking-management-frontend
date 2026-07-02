import { useEffect, useState } from "react";
import { staffApi } from "../../api/parkingApi";
import { formatLicensePlate, normalizeLicensePlate } from "../../utils/licensePlate";

const LicensePlate = ({ plate, vehicleType }) => {
  const formatted = formatLicensePlate(plate, vehicleType);
  const isBicycle = 
    String(vehicleType || "").toUpperCase().includes("BICYCLE") || 
    String(plate || "").toUpperCase().startsWith("BC");

  if (isBicycle) {
    return (
      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded border border-slate-300 bg-slate-50 font-mono font-bold text-slate-750 text-xs tracking-wider whitespace-nowrap select-text mx-auto">
        {formatted}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center justify-center p-1.5 px-2 rounded-xs border-2 border-slate-850 bg-white font-mono font-extrabold text-slate-950 shadow-xs text-md tracking-wider w-[90px] text-center break-words leading-tight select-text mx-auto">
      {formatted}
    </span>
  );
};

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
  if (dType === 'PRE_BOOKED') {
    return "Vé đặt trước";
  }
  return "Vé lượt";
};

const formatDuration = (minutes) => {
  if (!minutes) return '0 phút';
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes} phút` : `${hours}h`;
};

export default function StaffHistory() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("checkin_desc");
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayCheckIn: 0,
    activeSessions: 0,
    occupancyPercent: 0,
  });

  const fetchDashboardStats = async () => {
    try {
      const res = await staffApi.getStaffDashboardStats();
      if (res.data && res.data.data) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Lỗi khi tải thống kê:", err);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await staffApi.getParkingConfig();
      setVehicleTypes(res.data.data.vehicleTypes || []);
    } catch (err) {
      console.error("Lỗi tải cấu hình:", err);
    }
  };

  const fetchHistoryData = async () => {
    try {
      const res = await staffApi.getAllSessionsHistory();
      const rawData = res.data.data || [];
      const formattedData = rawData.map((item) => ({
        id: item.sessionCode || `PS-${item.sessionId?.slice(0, 6).toUpperCase()}`,
        plate: item.licensePlate,
        type: item.vehicleType || "Không rõ",
        rawEntryTime: item.entryTime ? new Date(item.entryTime).getTime() : 0,
        rawExitTime: item.exitTime ? new Date(item.exitTime).getTime() : Number.MAX_SAFE_INTEGER,
        rawFee: item.totalFee || 0,
        inTime: item.entryTime
          ? new Date(item.entryTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
          " • " +
          new Date(item.entryTime).toLocaleDateString("vi-VN")
          : "--",
        outTime: item.exitTime
          ? new Date(item.exitTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
          " • " +
          new Date(item.exitTime).toLocaleDateString("vi-VN")
          : "--",
        slot: item.zoneCode ? `${item.floorName}-ZONE-${item.zoneCode}` : "--",
        floor: item.floorName ? `Tầng ${item.floorName}` : "--",
        fee: (item.totalFee !== null && item.totalFee !== undefined)
          ? `${Number(item.totalFee).toLocaleString("vi-VN")}đ${item.status === "ACTIVE" ? " (Tạm tính)" : ""}`
          : (item.status === "ACTIVE" ? "Đang tính..." : "--"),
        status: item.status === "ACTIVE" ? "parked" : "checked_out",
        paymentMethod: item.status === "ACTIVE" ? "--" : (item.paymentMethod === "BANK_TRANSFER" ? "VietQR CK" : "Tiền mặt"),
        driverType: item.driverType,
        passType: item.passType,
        durationMinutes: item.durationMinutes || (item.entryTime ? Math.floor((new Date(item.exitTime || Date.now()).getTime() - new Date(item.entryTime).getTime()) / 60000) : 0),
      }));
      setHistoryList(formattedData);
      fetchDashboardStats();
    } catch (err) {
      console.error("Lỗi khi lấy lịch sử từ backend:", err);
    }
  };

  useEffect(() => {
    fetchHistoryData();
    fetchConfig();
  }, []);

  const getVehicleLabel = (type) => {
    if (!type) return "---";
    const t = type.toLowerCase();
    if (t.includes("ô tô") || t.includes("car")) return type;
    if (t.includes("máy") || t.includes("motor")) return type;
    if (t.includes("đạp") || t.includes("bicycle") || t.includes("bike")) return type;
    return type;
  };

  const filteredHistory = historyList.filter((item) => {
    const keyword = search.toLowerCase();
    const normalizedKeyword = normalizeLicensePlate(search).toLowerCase();
    const normalizedPlate = normalizeLicensePlate(item.plate).toLowerCase();
    const formattedPlate = (formatLicensePlate(item.plate, item.type) || "").toLowerCase();

    const matchSearch =
      (item.plate || "").toLowerCase().includes(keyword) ||
      formattedPlate.includes(keyword) ||
      (normalizedPlate && normalizedKeyword && normalizedPlate.includes(normalizedKeyword)) ||
      (item.id || "").toLowerCase().includes(keyword) ||
      (item.slot || "").toLowerCase().includes(keyword);

    const matchStatus = statusFilter === "all" || item.status === statusFilter;
    const matchType = typeFilter === "all" || item.type === typeFilter;

    return matchSearch && matchStatus && matchType;
  }).sort((a, b) => {
    switch (sortOrder) {
      case "checkin_desc":
        return b.rawEntryTime - a.rawEntryTime;
      case "checkin_asc":
        return a.rawEntryTime - b.rawEntryTime;
      case "checkout_desc":
        if (a.rawExitTime === Number.MAX_SAFE_INTEGER && b.rawExitTime === Number.MAX_SAFE_INTEGER) return b.rawEntryTime - a.rawEntryTime;
        if (a.rawExitTime === Number.MAX_SAFE_INTEGER) return 1;
        if (b.rawExitTime === Number.MAX_SAFE_INTEGER) return -1;
        return b.rawExitTime - a.rawExitTime;
      case "fee_desc":
        return b.rawFee - a.rawFee;
      case "duration_desc":
        return b.durationMinutes - a.durationMinutes;
      default:
        return 0;
    }
  });

  const handlePrint = () => {
    if (!selectedReceipt) return;
    const printWindow = window.open("", "_blank", "width=600,height=600");
    if (!printWindow) {
      alert("Vui lòng cho phép trình duyệt mở popup để in hóa đơn!");
      return;
    }

    const ticketType = getTicketTypeLabel(selectedReceipt.driverType, selectedReceipt.passType);

    printWindow.document.write(`
      <html>
        <head>
          <title>Hóa đơn thanh toán - #${selectedReceipt.id}</title>
          <style>
            body { font-family: Consolas, 'Courier New', monospace; text-align: center; padding: 20px; color: #333; background: #fff; }
            .ticket-container { border: 2px dashed #444; padding: 20px; display: inline-block; width: 280px; }
            .header { font-size: 18px; font-weight: bold; margin-bottom: 5px; letter-spacing: 2px; }
            .subtitle { font-size: 11px; margin-bottom: 15px; text-transform: uppercase; font-weight: 600; }
            .info-row { display: flex; justify-content: space-between; font-size: 12px; margin: 5px 0; border-bottom: 1px dotted #bbb; padding-bottom: 3px; font-weight: 600; }
            .info-value { font-weight: 600; }
            .total-section { margin-top: 15px; border-top: 2px dashed #444; padding-top: 10px; }
            .total-label { font-size: 11px; font-weight: bold; color: #555; text-transform: uppercase; }
            .total-fee { font-size: 20px; font-weight: 900; margin: 8px 0; color: #111; }
            .footer { font-size: 10px; margin-top: 15px; border-top: 1px dashed #444; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="ticket-container">
            <div class="header">SMART PARKING TICKET</div>
            <div class="subtitle">Hóa đơn thanh toán / In lại</div>
            
            <div class="info-row"><span>Mã phiên:</span><span class="info-value">#${selectedReceipt.id}</span></div>
            <div class="info-row"><span>Biển số xe:</span><span class="info-value">${formatLicensePlate(selectedReceipt.plate, selectedReceipt.type) || "---"}</span></div>
            <div class="info-row"><span>Phương tiện:</span><span class="info-value">${selectedReceipt.type || "---"}</span></div>
            <div class="info-row"><span>Vị trí đỗ:</span><span class="info-value">${selectedReceipt.slot}</span></div>
            <div class="info-row"><span>Loại vé:</span><span class="info-value">${ticketType}</span></div>
            <div class="info-row"><span>Thời gian vào:</span><span class="info-value">${selectedReceipt.inTime}</span></div>
            ${selectedReceipt.status !== "parked" ? '<div class="info-row"><span>Thời gian ra:</span><span class="info-value">' + selectedReceipt.outTime + '</span></div>' : ''}
            <div class="info-row"><span>Thời gian gửi:</span><span class="info-value">${formatDuration(selectedReceipt.durationMinutes)}</span></div>
            <div class="info-row"><span>Hình thức:</span><span class="info-value">${selectedReceipt.status === "parked" ? "--" : selectedReceipt.paymentMethod}</span></div>
            
            <div class="total-section">
              <div class="total-label">${selectedReceipt.status === "parked" ? "Phí tạm tính" : "Tổng tiền thanh toán"}</div>
              <div class="total-fee">${selectedReceipt.fee}</div>
            </div>
            
            <div class="footer">
              Cảm ơn và chúc quý khách thượng lộ bình an!<br/>
              Hẹn gặp lại quý khách!
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <section className="flex-1 space-y-6 p-3">
      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Tổng doanh thu hôm nay"
          value={`${Number(stats?.todayRevenue || 0).toLocaleString("vi-VN")}đ`}
          sub="Tính từ 00:00"
          color="indigo"
        />
        <MetricCard
          title="Tổng số lượt gửi xe"
          value={`${stats?.todayCheckIn || 0} lượt`}
          sub="Đã xử lý trong ngày"
          color="blue"
        />
        <MetricCard
          title="Lượt xe đang đỗ"
          value={`${stats?.activeSessions || 0} xe`}
          sub="Hiện diện trong bãi"
          color="emerald"
        />
        <MetricCard
          title="Công suất hoạt động"
          value={`${stats?.occupancyPercent || 0}%`}
          sub="Tối ưu hóa vị trí"
          color="purple"
        />
      </div>

      {/* Search and Filter Panel */}
      <div className="action-panel-item grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
            Tìm kiếm thông tin
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nhập mã vé, biển số hoặc vị trí đỗ..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all text-sm font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
            Trạng thái đỗ
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none text-sm font-semibold text-slate-700 focus:border-indigo-500 transition-all"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="checked_out">Đã thanh toán ra</option>
            <option value="parked">Đang trong bãi</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
            Sắp xếp theo
          </label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none text-sm font-semibold text-slate-700 focus:border-indigo-500 transition-all"
          >
            <option value="checkin_desc">Xe vào mới nhất</option>
            <option value="checkout_desc">Xe ra mới nhất</option>
            <option value="checkin_asc">Xe vào cũ nhất</option>
            <option value="duration_desc">Đỗ lâu nhất</option>
            <option value="fee_desc">Phí đỗ cao nhất</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
            Loại phương tiện
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none text-sm font-semibold text-slate-700 focus:border-indigo-500 transition-all"
          >
            <option value="all">Tất cả các loại</option>
            {vehicleTypes.map(v => (
              <option key={v.id} value={v.name}>{getVehicleLabel(v.name)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* History table */}
      <div className="history-table-container overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Mã vé</th>
                <th className="px-6 py-4">Biển số</th>
                <th className="px-6 py-4">Loại vé</th>
                <th className="px-6 py-4">Vị trí</th>
                <th className="px-6 py-4">Thời gian vào</th>
                <th className="px-6 py-4">Thời gian ra</th>
                <th className="px-6 py-4">Phí gửi</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Chi tiết</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredHistory.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 font-mono font-bold text-slate-900">
                    {row.id}
                  </td>
                  <td className="px-6 py-4">
                    {row.type.toLowerCase().includes("đạp") ? (
                      <span className="text-slate-500 text-xs font-bold font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200/50">{formatLicensePlate(row.plate, row.type)}</span>
                    ) : (
                      <LicensePlate plate={row.plate} vehicleType={row.type} />
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-650 font-bold text-xs">
                    {getTicketTypeLabel(row.driverType, row.passType)}
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-semibold text-xs">
                    {row.slot} ({row.floor})
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium font-mono text-xs">
                    {row.inTime}
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium font-mono text-xs">
                    {row.outTime}
                  </td>
                  <td className="px-6 py-4 text-slate-900 font-extrabold text-xs">
                    {row.fee}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${row.status === "checked_out"
                          ? "bg-slate-100 text-slate-755 border-slate-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-100 "
                        }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${row.status === "checked_out" ? "bg-slate-500" : "bg-emerald-500"}`} />
                      {row.status === "checked_out" ? "Đã ra" : "Đang đỗ"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedReceipt(row)}
                      className="rounded-xl border border-slate-200 hover:border-slate-350 hover:bg-slate-50 px-3.5 py-1.5 font-bold text-slate-650 text-xs transition-colors cursor-pointer"
                    >
                      Xem biên lai
                    </button>
                  </td>
                </tr>
              ))}

              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-slate-500 font-bold text-sm">
                    Không tìm thấy phiên gửi xe nào phù hợp với bộ lọc
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Detail Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xs overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl flex flex-col gap-4 border-t-8 border-t-indigo-600 animate-scale-in">
            {/* Punch hole trang trí */}
            <div className="absolute left-0 top-[110px] -ml-2.5 w-5 h-5 rounded-full bg-[#111827] border-r border-slate-200/80 z-10"></div>
            <div className="absolute right-0 top-[110px] -mr-2.5 w-5 h-5 rounded-full bg-[#111827] border-l border-slate-200/80 z-10"></div>

            {/* Nút đóng góc trên phải */}
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 rounded-full p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header vé */}
            <div className="text-center border-b border-dashed border-slate-200 pb-3">
              <h4 className="font-extrabold text-sm text-slate-800 tracking-wider">SMART PAYMENT TICKET</h4>
              <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider mt-1">
                {selectedReceipt.status === "parked" ? "CHỜ CHECK-OUT" : "HOÀN TẤT"}
              </p>
            </div>

            {/* Chi tiết thông tin vé */}
            <div className="space-y-2 text-xs font-semibold text-slate-500 pt-1">
              <div className="flex justify-between items-center">
                <span>Mã phiên gửi:</span>
                <span className="text-slate-600 font-mono font-bold">
                  #{selectedReceipt.id}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Biển số xe:</span>
                <span className="text-slate-600 text-xs font-black tracking-wide uppercase px-2 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono">
                  {formatLicensePlate(selectedReceipt.plate, selectedReceipt.type)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Loại xe:</span>
                <span className="text-slate-600 font-black">
                  {getVehicleLabel(selectedReceipt.type)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Loại vé:</span>
                <span className="text-slate-600 font-black">
                  {getTicketTypeLabel(selectedReceipt.driverType, selectedReceipt.passType)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Vị trí đỗ:</span>
                <span className="text-slate-600 font-black">
                  {selectedReceipt.slot}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Thời gian vào:</span>
                <span className="text-slate-800 font-mono text-[11px] font-bold">
                  {selectedReceipt.inTime}
                </span>
              </div>
              {selectedReceipt.status !== "parked" && (
                <div className="flex justify-between">
                  <span>Thời gian ra:</span>
                  <span className="text-slate-800 font-mono text-[11px] font-bold">
                    {selectedReceipt.outTime}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Thời gian gửi:</span>
                <span className="text-slate-600 font-extrabold">
                  {formatDuration(selectedReceipt.durationMinutes)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Hình thức:</span>
                <span className="text-slate-600 font-black">
                  {selectedReceipt.status === "parked" ? "--" : selectedReceipt.paymentMethod}
                </span>
              </div>

              <div className="border-t border-dashed border-slate-200 pt-3 flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  {selectedReceipt.status === "parked" ? "Phí tạm tính:" : "Tổng thanh toán:"}
                </span>
                <span className="text-xl font-black text-slate-600 mt-0.5">
                  {selectedReceipt.fee}
                </span>
              </div>

              <div className="border-t border-dashed border-slate-200 pt-3 text-center text-[10px] text-slate-400 font-medium leading-normal mt-1">
                Cảm ơn và chúc quý khách thượng lộ bình an!
                <br />
                Hẹn gặp lại quý khách!
              </div>
            </div>

            {/* Nút hành động */}
            <div className="flex gap-2 border-t border-slate-100 pt-4 mt-2">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 rounded-xl border border-slate-250 py-2.5 font-semibold text-slate-650 hover:bg-slate-50 text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>

              <button
                onClick={handlePrint}
                className="flex-1 rounded-xl bg-slate-900 py-2.5 font-bold text-white hover:bg-slate-800 text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                In lại hóa đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function MetricCard({ title, value, sub, color }) {
  const gradients = {
    indigo: "from-indigo-600 to-indigo-700 text-white shadow-indigo-600/10",
    blue: "from-blue-600 to-blue-700 text-white shadow-blue-600/10",
    emerald: "from-emerald-600 to-emerald-700 text-white shadow-emerald-600/10",
    purple: "from-purple-600 to-purple-700 text-white shadow-purple-600/10",
  };

  return (
    <div className={`stat-card-item rounded-2xl bg-gradient-to-br p-6 shadow-lg border border-white/5 relative overflow-hidden ${gradients[color]}`}>
      <div className="absolute right-0 bottom-0 -mb-6 -mr-6 h-20 w-20 rounded-full bg-white/10 blur-lg" />
      <span className="text-[10px] font-black uppercase tracking-wider opacity-85">
        {title}
      </span>
      <h3 className="text-2xl font-extrabold tracking-tight mt-2.5">
        {value}
      </h3>
      <p className="text-[10px] font-semibold opacity-75 mt-1.5">
        {sub}
      </p>
    </div>
  );
}
