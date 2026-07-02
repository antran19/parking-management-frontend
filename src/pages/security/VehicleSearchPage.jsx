import React, { useState } from "react";
import { staffApi } from "../../api/parkingApi";

import { formatLicensePlate, isValidVietnamLicensePlate } from "../../utils/licensePlate";

const formatTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN");
};

const EXCEPTION_LABELS = {
  LOST_TICKET: "Mất thẻ / mất QR",
  WRONG_PLATE: "Sai biển số",
  OVERTIME: "Quá giờ",
  WRONG_ZONE: "Sai khu vực",
  UNPAID: "Chưa thanh toán",
  SUSPICIOUS_BEHAVIOR: "Hành vi đáng ngờ",
  OTHER: "Khác",
};

const EXCEPTION_BADGE_COLOR = {
  LOST_TICKET: "bg-amber-50 text-amber-700 border-amber-100",
  WRONG_PLATE: "bg-red-50 text-red-700 border-red-100",
  OVERTIME: "bg-orange-50 text-orange-700 border-orange-100",
  WRONG_ZONE: "bg-purple-50 text-purple-700 border-purple-100",
  UNPAID: "bg-rose-50 text-rose-700 border-rose-100",
  SUSPICIOUS_BEHAVIOR: "bg-red-50 text-red-800 border-red-200",
  OTHER: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function VehicleSearchPage({ showToast }) {
  const [searchText, setSearchText] = useState("");
  const [sessionInfo, setSessionInfo] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [exceptionList, setExceptionList] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [viewingLogDetail, setViewingLogDetail] = useState(null);

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
      const [activeRes, historyRes, exceptionsRes] = await Promise.allSettled([
        staffApi.getActiveSessionByPlate(formattedPlate),
        staffApi.getAllSessionsHistory({ licensePlate: formattedPlate, page: 0, size: 50 }),
        staffApi.getSecurityExceptions()
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

      let pastExceptions = [];
      if (exceptionsRes.status === 'fulfilled' && exceptionsRes.value.data.data) {
        pastExceptions = exceptionsRes.value.data.data.filter(e => e.licensePlate && formatLicensePlate(e.licensePlate, "") === formattedPlate);
        pastExceptions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setExceptionList(pastExceptions);
      } else {
        setExceptionList([]);
      }

      if (foundActive || pastSessions.length > 0 || pastExceptions.length > 0) {
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
                        <img 
                          src={sessionInfo.entryPlateImageUrl} 
                          alt="Plate" 
                          className="w-full h-48 object-contain bg-slate-100 hover:scale-105 transition-transform cursor-pointer" 
                          onClick={() => setSelectedImage(sessionInfo.entryPlateImageUrl)}
                        />
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50 flex items-center justify-center h-56 text-blue-400 text-xs font-semibold">Không có ảnh biển số</div>
                    )}
                    
                    {sessionInfo.entryFaceImageUrl ? (
                      <div className="rounded-xl overflow-hidden border-2 border-blue-200 bg-white shadow-md">
                        <div className="bg-blue-100/50 px-2 py-1.5 text-[10px] font-bold text-blue-800 text-center uppercase border-b border-blue-200">Ảnh người lái</div>
                        <img 
                          src={sessionInfo.entryFaceImageUrl} 
                          alt="Face" 
                          className="w-full h-48 object-contain bg-slate-100 hover:scale-105 transition-transform cursor-pointer" 
                          onClick={() => setSelectedImage(sessionInfo.entryFaceImageUrl)}
                        />
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50 flex items-center justify-center h-56 text-blue-400 text-xs font-semibold">Không có ảnh khuôn mặt</div>
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

          {/* Sự cố an ninh */}
          {exceptionList.length > 0 && (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 md:p-8 shadow-sm">
              <h4 className="text-sm font-black uppercase text-red-800 mb-6 flex items-center gap-2">
                <span>⚠️</span> Lịch sử sự cố ({exceptionList.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {exceptionList.map(log => (
                  <div 
                    key={log.id} 
                    onClick={() => setViewingLogDetail(log)}
                    className="cursor-pointer bg-white rounded-xl p-4 border border-red-100 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between"
                  >
                    <div className="overflow-hidden">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border mb-1 ${EXCEPTION_BADGE_COLOR[log.exceptionType] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                        {EXCEPTION_LABELS[log.exceptionType] || log.exceptionType}
                      </span>
                      <p className="text-sm font-medium text-slate-700 truncate">{log.description}</p>
                    </div>
                    <div className="text-right flex flex-col items-end shrink-0 ml-2">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border mb-1 ${log.status === "RESOLVED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                        {log.status === "RESOLVED" ? "Đã giải quyết" : "Đang xử lý"}
                      </span>
                      <span className="text-[10px] text-slate-400">{formatTime(log.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!sessionInfo && historyList.length === 0 && exceptionList.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center shadow-sm">
               <div className="mx-auto w-20 h-20 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mb-5 text-4xl">🚘</div>
               <h4 className="text-xl font-bold text-slate-700">Không có dữ liệu</h4>
               <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">Biển số này chưa từng gửi trong bãi hoặc không tìm thấy dữ liệu.</p>
             </div>
          )}
        </div>
      )}
      {/* Modal phóng to ảnh */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 md:p-8 animate-in fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center">
            <button 
              className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <img 
              src={selectedImage} 
              alt="Phóng to" 
              className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Chi tiết sự cố Modal */}
      {viewingLogDetail && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewingLogDetail(null)}>
          <div className="relative max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewingLogDetail(null)} className="absolute top-6 right-6 text-slate-400 hover:bg-slate-100 hover:text-slate-800 p-2 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <span className="text-3xl">⚠️</span> Chi tiết sự cố
            </h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-xs font-black tracking-widest uppercase text-slate-400 mb-2">Loại sự cố</span>
                  <span className={`inline-block rounded-full px-3 py-1.5 text-xs font-black tracking-wider uppercase border ${EXCEPTION_BADGE_COLOR[viewingLogDetail.exceptionType] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                    {EXCEPTION_LABELS[viewingLogDetail.exceptionType] || viewingLogDetail.exceptionType}
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-xs font-black tracking-widest uppercase text-slate-400 mb-2">Trạng thái</span>
                  <span className={`inline-block rounded-full px-3 py-1.5 text-xs font-black tracking-wider uppercase border ${viewingLogDetail.status === "RESOLVED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                    {viewingLogDetail.status === "RESOLVED" ? "✓ Đã giải quyết" : "⏳ Đang xử lý"}
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold uppercase text-slate-500 mb-2">Mô tả chi tiết</span>
                <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap rounded-2xl bg-slate-50/50 border border-slate-200 p-5 leading-relaxed shadow-inner">
                  {viewingLogDetail.description || "Không có mô tả chi tiết."}
                </p>
              </div>

              {viewingLogDetail.imageUrls?.length > 0 && (
                <div>
                  <span className="block text-xs font-bold uppercase text-slate-500 mb-3">Hình ảnh minh chứng</span>
                  <div className="flex flex-wrap gap-3">
                    {viewingLogDetail.imageUrls.map((url, idx) => (
                      <div key={idx} onClick={(e) => { e.stopPropagation(); setSelectedImage(url); }} className="cursor-pointer group relative overflow-hidden rounded-2xl border-2 border-slate-200 shadow-sm transition-all hover:border-slate-400">
                        <img src={url} alt="Sự cố" className="h-28 w-28 object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 drop-shadow-md transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-6 mt-4 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold text-slate-700">Người ghi nhận:</span>
                  <span className="font-medium text-slate-600">{viewingLogDetail.handledBy || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold text-slate-700">Thời gian tạo:</span>
                  <span className="font-medium text-slate-600">{formatTime(viewingLogDetail.createdAt)}</span>
                </div>
                {viewingLogDetail.status === "RESOLVED" && viewingLogDetail.resolvedAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-emerald-700">Thời gian xử lý:</span>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{formatTime(viewingLogDetail.resolvedAt)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
              <button onClick={() => setViewingLogDetail(null)} className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-8 py-3.5 transition-colors active:scale-95 shadow-sm">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

