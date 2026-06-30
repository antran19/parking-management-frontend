import React, { useState } from "react";
import { staffApi } from "../../api/parkingApi";

import { formatLicensePlate, isValidVietnamLicensePlate } from "../../utils/licensePlate";

const formatTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN");
};

export default function VehicleSearchPage({ showToast }) {
  const [searchText, setSearchText] = useState("");
  const [sessionInfo, setSessionInfo] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchText.trim()) {
      showToast("Vui lòng nhập biển số cần tìm", "warning");
      return;
    }

    const formattedPlate = formatLicensePlate(searchText, "");
    setSearchText(formattedPlate);

    if (!isValidVietnamLicensePlate(formattedPlate) && !formattedPlate.startsWith("XEDAP")) {
      showToast("Biển số xe không đúng định dạng", "error");
      return;
    }

    setSearching(true);
    setHasSearched(true);
    try {
      const [activeRes, historyRes] = await Promise.allSettled([
        staffApi.getActiveSessionByPlate(formattedPlate),
        staffApi.getAllSessionsHistory({ licensePlate: formattedPlate, page: 0, size: 50 })
      ]);

      let foundActive = false;
      if (activeRes.status === 'fulfilled' && activeRes.value.data.data) {
        setSessionInfo(activeRes.value.data.data);
        foundActive = true;
      } else {
        setSessionInfo(null);
      }

      let pastSessions = [];
      if (historyRes.status === 'fulfilled' && historyRes.value.data.data) {
        const historyData = historyRes.value.data.data;
        const list = Array.isArray(historyData) ? historyData : (historyData.content || []);
        pastSessions = list.filter(s => s.status === 'COMPLETED' || s.status !== 'ACTIVE');
        setHistoryList(pastSessions);
      } else {
        setHistoryList([]);
      }

      if (foundActive || pastSessions.length > 0) {
        showToast("Đã lấy được thông tin xe", "success");
      } else {
        showToast("Không tìm thấy thông tin xe này", "warning");
      }
    } catch (err) {
      console.error(err);
      showToast("Lỗi khi tìm kiếm xe", "error");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6 mt-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <h3 className="mb-6 text-xl font-bold text-slate-900 flex items-center gap-2">
          <span>🔍</span> Tra cứu phương tiện
        </h3>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl">
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value.toUpperCase())}
            placeholder="Nhập biển số xe (VD: 59A1-123.45)"
            className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 font-mono text-lg font-bold text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 uppercase"
          />
          <button 
            type="submit" 
            disabled={searching}
            className="rounded-xl bg-red-600 px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-red-600/20 hover:bg-red-700 disabled:opacity-60 transition-colors shrink-0"
          >
            {searching ? "Đang tìm..." : "Tìm kiếm"}
          </button>
        </form>
      </div>

      {hasSearched && !searching && (
        <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6">
          {sessionInfo ? (
            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6 md:p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <svg className="w-48 h-48 text-blue-900 transform translate-x-1/4 -translate-y-1/4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
              </div>
              <h4 className="text-sm font-black uppercase text-blue-800 mb-6 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                Trạng thái: Đang có trong bãi
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-5">
                  {/* Biển số + Trạng thái */}
                  <div>
                    <span className="text-blue-600/80 block text-xs uppercase font-bold tracking-wider mb-1">Biển số</span>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="font-mono text-4xl font-black text-blue-950">{formatLicensePlate(sessionInfo.licensePlate, sessionInfo.vehicleType)}</span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                        Đang đỗ
                      </span>
                    </div>
                  </div>

                  {/* Mã vé + Loại vé */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-blue-600/80 block text-[10px] uppercase font-bold mb-1">Mã vé</span>
                      <span className="font-semibold text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-blue-100 inline-block font-mono text-xs">{sessionInfo.sessionCode || "—"}</span>
                    </div>
                    <div>
                      <span className="text-blue-600/80 block text-[10px] uppercase font-bold mb-1">Loại vé</span>
                      <span className="font-semibold text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-blue-100 inline-block">{sessionInfo.passType || "Vé lượt"}</span>
                    </div>
                  </div>

                  {/* Vị trí */}
                  <div>
                    <span className="text-blue-600/80 block text-[10px] uppercase font-bold mb-1">Vị trí</span>
                    <span className="font-semibold text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-blue-100 inline-block">
                      {sessionInfo.zoneCode 
                        ? `${sessionInfo.floorName || ''}-ZONE-${sessionInfo.zoneCode} (${sessionInfo.floorName || ''})` 
                        : "Chưa phân khu (Đang đi dạo)"}
                    </span>
                  </div>

                  {/* Loại xe + Cổng vào */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-blue-600/80 block text-[10px] uppercase font-bold mb-1">Loại xe</span>
                      <span className="font-semibold text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-blue-100 inline-block">{sessionInfo.vehicleType || "—"}</span>
                    </div>
                    <div>
                      <span className="text-blue-600/80 block text-[10px] uppercase font-bold mb-1">Cổng vào</span>
                      <span className="font-semibold text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-blue-100 inline-block">{sessionInfo.entryMainGateName || sessionInfo.entryMainGateCode || "—"}</span>
                    </div>
                  </div>

                  {/* Giờ vào + Phí tạm tính */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-blue-600/80 block text-[10px] uppercase font-bold mb-1">Thời gian vào</span>
                      <span className="font-semibold text-slate-800">{formatTime(sessionInfo.entryTime)}</span>
                    </div>
                    <div>
                      <span className="text-blue-600/80 block text-[10px] uppercase font-bold mb-1">Phí gửi (Tạm tính)</span>
                      <span className="font-bold text-red-600 text-lg">{sessionInfo.totalFee ? sessionInfo.totalFee.toLocaleString('vi-VN') + 'đ' : '—'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <span className="text-blue-600/80 block text-[10px] uppercase font-bold">Hình ảnh lúc vào bãi</span>
                  <div className="grid grid-cols-2 gap-4">
                    {sessionInfo.entryPlateImageUrl ? (
                      <div className="rounded-xl overflow-hidden border-2 border-blue-200 bg-white shadow-md">
                        <div className="bg-blue-100/50 px-2 py-1.5 text-[10px] font-bold text-blue-800 text-center uppercase border-b border-blue-200">Ảnh biển số</div>
                        <img src={sessionInfo.entryPlateImageUrl} alt="Plate" className="w-full h-36 object-cover hover:scale-105 transition-transform" />
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50 flex items-center justify-center h-44 text-blue-400 text-xs font-semibold">Không có ảnh biển số</div>
                    )}
                    
                    {sessionInfo.entryFaceImageUrl ? (
                      <div className="rounded-xl overflow-hidden border-2 border-blue-200 bg-white shadow-md">
                        <div className="bg-blue-100/50 px-2 py-1.5 text-[10px] font-bold text-blue-800 text-center uppercase border-b border-blue-200">Ảnh người lái</div>
                        <img src={sessionInfo.entryFaceImageUrl} alt="Face" className="w-full h-36 object-cover hover:scale-105 transition-transform" />
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50 flex items-center justify-center h-44 text-blue-400 text-xs font-semibold">Không có ảnh khuôn mặt</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
             <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center shadow-sm">
               <h4 className="text-lg font-bold text-slate-700">Trạng thái: Xe không có trong bãi</h4>
             </div>
          )}

          {/* Lịch sử gửi xe */}
          {historyList.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
              <h4 className="text-sm font-black uppercase text-slate-800 mb-6 flex items-center gap-2">
                <span>🕒</span> Lịch sử gửi xe
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3 rounded-l-xl">Mã vé</th>
                      <th className="px-4 py-3">Loại vé</th>
                      <th className="px-4 py-3">Vị trí</th>
                      <th className="px-4 py-3">Giờ vào</th>
                      <th className="px-4 py-3">Giờ ra</th>
                      <th className="px-4 py-3">Phí gửi</th>
                      <th className="px-4 py-3 rounded-r-xl">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyList.map((session) => (
                      <tr key={session.sessionId || session.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{session.sessionCode || "—"}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{session.passType || "Vé lượt"}</td>
                        <td className="px-4 py-3">
                          {session.zoneCode ? `${session.zoneCode} (${session.floorName || ''})` : (session.zoneName || "—")}
                        </td>
                        <td className="px-4 py-3">{formatTime(session.entryTime)}</td>
                        <td className="px-4 py-3">{formatTime(session.exitTime)}</td>
                        <td className="px-4 py-3 font-semibold text-red-600">{session.totalFee ? session.totalFee.toLocaleString('vi-VN') + 'đ' : '0đ'}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
                            Đã ra
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!sessionInfo && historyList.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center shadow-sm">
               <div className="mx-auto w-20 h-20 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mb-5 text-4xl">🚘</div>
               <h4 className="text-xl font-bold text-slate-700">Không có dữ liệu</h4>
               <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">Biển số này chưa từng gửi trong bãi hoặc không tìm thấy dữ liệu.</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
}

