import React, { useState, useEffect, useContext, useMemo } from "react";
import { managerApi } from "../../api/parkingApi";
import { Spinner } from "../components/Spinner";
import { ManagerContext } from "./ManagerLayout";

const INCIDENT_TYPE_LABELS = {
  LOST_TICKET: "Mất thẻ / mất QR",
  WRONG_PLATE: "Sai biển số",
  OVERTIME: "Quá giờ gửi",
  WRONG_ZONE: "Sai khu vực đỗ",
  UNPAID: "Chưa thanh toán",
  SUSPICIOUS_BEHAVIOR: "Hành vi đáng ngờ",
  OTHER: "Khác",

  BLACKLIST_DETECTED: "Phát hiện biển số đen",
  UNAUTHORIZED_ACCESS: "Truy cập trái phép",
  TAILGATING: "Xe theo đuôi",
  OVERSTAY: "Quá giờ",
  SUSPICIOUS_ACTIVITY: "Hoạt động đáng ngờ",
};

const REASON_LABELS = {
  STOLEN: "Xe trộm cắp",
  DISTURBANCE: "Gây rối / nguy cơ an ninh",
  UNPAID_FEE: "Nợ phí / chưa thanh toán",
  SECURITY_RISK: "Rủi ro an ninh",
  OTHER: "Khác",
};

const SecurityPage = () => {
  const { triggerToast, currentUser } = useContext(ManagerContext);
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [blacklist, setBlacklist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [tab, setTab] = useState("incidents");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [showResolved, setShowResolved] = useState(false); // mặc định chỉ show việc cần làm
  const [resolveModal, setResolveModal] = useState({ show: false, incidentId: null });
  const [resolutionText, setResolutionText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [submittingResolution, setSubmittingResolution] = useState(false);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await managerApi.getSecurityIncidents({});
      setIncidents(res.data.data || []);
      setSelectedIncident(null);
    } catch (err) {
      triggerToast("Lỗi lấy danh sách sự cố", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchBlacklist = async () => {
    setLoading(true);
    try {
      const res = await managerApi.getBlacklist();
      setBlacklist(res.data.data);
    } catch (err) {
      triggerToast("Lỗi lấy danh sách đen", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "incidents") fetchIncidents();
    if (tab === "blacklist") fetchBlacklist();
  }, [tab]);

  const handleRemoveFromBlacklist = async (item) => {
    if (!window.confirm(`Gỡ biển số ${item.licensePlate} khỏi danh sách đen?`)) return;
    setRemovingId(item.id);
    try {
      const res = await managerApi.removeFromBlacklist(item.id, {
        removedByUserId: currentUser?.id,
      });
      setBlacklist(prev =>
        prev.map(b => (b.id === item.id ? res.data.data : b))
      );
      triggerToast("Đã gỡ khỏi danh sách đen", "success");
    } catch (err) {
      triggerToast("Lỗi khi gỡ khỏi danh sách đen", "error");
    } finally {
      setRemovingId(null);
    }
  };

  const handleResolveIncident = (incidentId, e) => {
    if (e) e.stopPropagation();
    setResolutionText("");
    selectedFiles.forEach(file => URL.revokeObjectURL(file.preview));
    setSelectedFiles([]);
    setResolveModal({ show: true, incidentId });
  };

  const handleAddFiles = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newFiles = files.map(file => Object.assign(file, { preview: URL.createObjectURL(file) }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (indexToRemove) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[indexToRemove].preview);
      newFiles.splice(indexToRemove, 1);
      return newFiles;
    });
  };

  const submitResolveIncident = async () => {
    const { incidentId } = resolveModal;
    if (!incidentId) return;

    setSubmittingResolution(true);
    let uploadedUrls = [];

    try {
      if (selectedFiles.length > 0) {
        triggerToast("Đang tải ảnh minh chứng lên Cloudinary...", "warning");
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_PRESET_EXCEPTIONS);

          const res = await fetch(
            `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME_EXCEPTIONS}/image/upload`,
            { method: "POST", body: formData }
          );
          const data = await res.json();
          if (data.secure_url) {
            uploadedUrls.push(data.secure_url);
          } else {
            throw new Error(data.error?.message || "Lỗi khi upload ảnh");
          }
        }
      }

      const res = await managerApi.resolveIncident(incidentId, {
        handledByUserId: currentUser?.id,
        resolution: resolutionText.trim(),
        resolutionImageUrls: uploadedUrls,
      });

      setIncidents(prev =>
        prev.map(i => (i.id === incidentId ? res.data.data : i))
      );
      setSelectedIncident(res.data.data);
      triggerToast("Đã giải quyết sự cố thành công", "success");
      setResolveModal({ show: false, incidentId: null });
      setResolutionText("");
      selectedFiles.forEach(file => URL.revokeObjectURL(file.preview));
      setSelectedFiles([]);
    } catch (err) {
      triggerToast(err.response?.data?.message || err.message || "Lỗi khi giải quyết sự cố", "error");
    } finally {
      setSubmittingResolution(false);
    }
  };

  useEffect(() => {
    return () => {
      selectedFiles.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, []);

  const unresolvedCount = incidents.filter(i => !i.resolvedAt).length;

  const visibleIncidents = useMemo(() => {
    let list = showResolved ? incidents : incidents.filter(i => !i.resolvedAt);
    if (typeFilter !== "ALL") list = list.filter(i => i.exceptionType === typeFilter);
    return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [incidents, showResolved, typeFilter]);

  const visibleBlacklist = useMemo(() => {
    return blacklist.filter(item => item.isActive);
  }, [blacklist]);

  return (
    <section className="flex-1 space-y-6 p-8">
      <div className="space-y-6 fade-up-element">
        {/* Header + segmented control */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Sự cố An ninh</h3>
            <p className="text-xs text-slate-500 mt-1">
              {unresolvedCount > 0
                ? `${unresolvedCount} sự cố đang chờ xử lý`
                : "Không có sự cố nào đang chờ xử lý"}
            </p>
          </div>

          <div className="inline-flex items-center bg-slate-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setTab("incidents")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "incidents"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              Sự cố
              {unresolvedCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unresolvedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("blacklist")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "blacklist"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Biển số đen
            </button>
          </div>
        </div>

        {loading ? <Spinner /> : (
          <>
            {/* Tab: Sự cố */}
            {tab === "incidents" && (
              <div className="space-y-4">
                {/* Bộ lọc gọn: trạng thái + loại */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setShowResolved(false)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${!showResolved ? "bg-rose-600 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                  >
                    Chưa giải quyết ({unresolvedCount})
                  </button>
                  <button
                    onClick={() => setShowResolved(true)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${showResolved ? "bg-indigo-600 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                  >
                    Tất cả ({incidents.length})
                  </button>

                  <span className="w-px h-5 bg-slate-200 mx-1" />

                  <select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 bg-white"
                  >
                    <option value="ALL">Tất cả loại</option>
                    {Object.entries(INCIDENT_TYPE_LABELS).map(([type, label]) => (
                      <option key={type} value={type}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-6">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {visibleIncidents.length === 0 ? (
                      <div className="text-center py-16 text-slate-400 text-sm">
                        {!showResolved ? "Không có sự cố nào cần xử lý. 🎉" : "Không có sự cố phù hợp."}
                      </div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Biển số</th>
                            <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Loại</th>
                            <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Thời gian</th>
                            <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {visibleIncidents.map(item => (
                            <tr
                              key={item.id}
                              className={`cursor-pointer hover:bg-slate-50 transition-colors ${selectedIncident?.id === item.id ? "bg-indigo-50" : ""}`}
                              onClick={() => setSelectedIncident(item)}
                            >
                              <td className="px-6 py-4 font-mono font-semibold text-slate-800">
                                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${item.resolvedAt ? "bg-emerald-400" : "bg-rose-500"}`} />
                                {item.licensePlate || "—"}
                              </td>
                              <td className="px-6 py-4 text-slate-650 font-medium">{INCIDENT_TYPE_LABELS[item.exceptionType] || item.exceptionType || "—"}</td>
                              <td className="px-6 py-4 text-slate-550 text-xs">{item.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : "—"}</td>
                              <td className="px-6 py-4">
                                {!item.resolvedAt ? (
                                  <button
                                    onClick={(e) => handleResolveIncident(item.id, e)}
                                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 transition-all cursor-pointer shadow-sm shadow-rose-100 border border-rose-600/10 flex items-center justify-center"
                                  >
                                    Giải quyết
                                  </button>
                                ) : (
                                  <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100/50">Đã giải quyết</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 min-h-[240px]">
                    {!selectedIncident ? (
                      <div className="text-slate-500 text-sm">Chọn một sự cố bên trái để xem chi tiết.</div>
                    ) : (
                      <div className="space-y-4 text-sm text-slate-700">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-slate-900 text-lg">{selectedIncident.licensePlate || "—"}</p>
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${selectedIncident.resolvedAt ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            }`}>
                            {selectedIncident.resolvedAt ? "Đã giải quyết" : "Chưa giải quyết"}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Loại sự cố</p>
                          <p className="font-semibold">{INCIDENT_TYPE_LABELS[selectedIncident.exceptionType] || selectedIncident.exceptionType || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Mô tả</p>
                          <p className="whitespace-pre-wrap text-slate-700">{selectedIncident.description || "Không có mô tả."}</p>
                        </div>
                        {selectedIncident.imageUrls && selectedIncident.imageUrls.length > 0 && (
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Ảnh minh chứng sự cố</p>
                            <div className="grid grid-cols-2 gap-2">
                              {selectedIncident.imageUrls.map((url, idx) => (
                                <img
                                  key={idx}
                                  src={url}
                                  alt={`Ảnh sự cố ${idx + 1}`}
                                  className="w-full h-24 object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(url, "_blank")}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Người xử lý</p>
                          <p className="font-semibold">{selectedIncident.handledBy || "Chưa có"}</p>
                        </div>
                        {selectedIncident.resolvedAt && (
                          <>
                            <div className="pt-2 border-t border-slate-100">
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Phương án giải quyết</p>
                              <p className="font-semibold text-slate-800 whitespace-pre-wrap">{selectedIncident.resolution || "Không có chi tiết giải quyết."}</p>
                            </div>
                            {selectedIncident.resolutionImageUrls && selectedIncident.resolutionImageUrls.length > 0 && (
                              <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">Ảnh minh chứng giải quyết</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {selectedIncident.resolutionImageUrls.map((url, idx) => (
                                    <img
                                      key={idx}
                                      src={url}
                                      alt={`Ảnh giải quyết ${idx + 1}`}
                                      className="w-full h-24 object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(url, "_blank")}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                        <div className="text-slate-500 text-xs pt-2 border-t border-slate-100">
                          Tạo lúc {selectedIncident.createdAt ? new Date(selectedIncident.createdAt).toLocaleString("vi-VN") : "—"}
                          {selectedIncident.resolvedAt && ` · Giải quyết lúc ${new Date(selectedIncident.resolvedAt).toLocaleString("vi-VN")}`}
                        </div>
                        {!selectedIncident.resolvedAt && (
                          <button
                            onClick={(e) => handleResolveIncident(selectedIncident.id, e)}
                            className="w-full mt-4 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 transition-all cursor-pointer shadow-md shadow-rose-600/10 border border-rose-600/10"
                          >
                            Đánh dấu đã giải quyết
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Biển số đen */}
            {tab === "blacklist" && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {visibleBlacklist.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-sm">Không có biển số nào trong danh sách đen.</div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Biển số</th>
                        <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Lý do</th>
                        <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Ngày thêm</th>
                        <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Trạng thái</th>
                        <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleBlacklist.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-mono font-bold text-slate-800">{item.licensePlate}</td>
                          <td className="px-6 py-4 text-slate-655 font-medium">{REASON_LABELS[item.reason] || item.reason || "—"}</td>
                          <td className="px-6 py-4 text-slate-500 text-xs">
                            {item.addedAt ? new Date(item.addedAt).toLocaleDateString("vi-VN") : "—"}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${item.isActive ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-400"
                              }`}>
                              {item.isActive ? "Đang chặn" : "Đã gỡ"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {item.isActive && (
                              <button
                                onClick={() => handleRemoveFromBlacklist(item)}
                                disabled={removingId === item.id}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {removingId === item.id ? "Đang gỡ..." : "Gỡ blacklist"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Giải quyết sự cố */}
      {resolveModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200/80 p-6 space-y-5 transform transition-all scale-100">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Giải quyết sự cố an ninh
              </h3>
              <button 
                onClick={() => setResolveModal({ show: false, incidentId: null })}
                disabled={submittingResolution}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Body */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Cách thức giải quyết <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Nhập mô tả chi tiết phương án giải quyết (ví dụ: đã thu phí bổ sung, bàn giao lại tài sản cho khách hàng...)"
                  className="w-full min-h-[100px] border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                  disabled={submittingResolution}
                />
              </div>

              {/* Upload ảnh minh chứng */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Ảnh minh chứng (nếu có)
                </label>
                
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/20 rounded-xl cursor-pointer text-xs font-semibold text-slate-600 transition-all">
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Chọn tệp hình ảnh
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAddFiles}
                      className="hidden"
                      disabled={submittingResolution}
                    />
                  </label>
                  <span className="text-xs text-slate-450">Hỗ trợ định dạng .jpg, .png, .webp</span>
                </div>

                {/* Previews */}
                {selectedFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 h-20 bg-slate-50">
                        <img src={file.preview} alt="preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="absolute top-1 right-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 opacity-90 transition-opacity shadow cursor-pointer"
                          disabled={submittingResolution}
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={() => setResolveModal({ show: false, incidentId: null })}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-all cursor-pointer"
                disabled={submittingResolution}
              >
                Hủy
              </button>
              <button
                onClick={submitResolveIncident}
                disabled={!resolutionText.trim() || submittingResolution}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md shadow-rose-100 cursor-pointer flex items-center gap-1.5"
              >
                {submittingResolution ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Đang xử lý...
                  </>
                ) : (
                  "Xác nhận giải quyết"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SecurityPage;