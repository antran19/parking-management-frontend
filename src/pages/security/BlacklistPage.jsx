import React, { useEffect, useState, useRef } from "react";
import { staffApi } from "../../api/parkingApi";
import { formatLicensePlate, isValidVietnamLicensePlate } from "../../utils/licensePlate";

// ==============================================================
// CONSTANTS — Labels nhãn cho lý do blacklist
// ==============================================================
export const REASON_LABELS = {
  STOLEN: "Xe trộm cắp",
  DISTURBANCE: "Gây rối / nguy cơ an ninh",
  UNPAID_FEE: "Nợ phí / chưa thanh toán",
  SECURITY_RISK: "Rủi ro an ninh",
  OTHER: "Khác",
};

// Định dạng thời gian sang tiếng Việt
export const formatTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN");
};

// Component hiển thị biển số xe (giống project cũ)
export const LicensePlate = ({ plate }) => (
  <span className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2.5 py-1 font-mono text-xs font-black tracking-widest text-slate-900 shadow-sm">
    <span className="mr-1.5 h-2 w-2 rounded-full bg-blue-600" />
    {plate || "—"}
  </span>
);

// Panel container dùng chung
export function Panel({ title, children, className }) {
  return (
    <div className={`action-panel-item rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className || ""}`}>
      <h3 className="mb-5 text-base font-bold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

// Field label wrapper cho form
export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      {children}
    </label>
  );
}

// Empty state placeholder
export function Empty({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-400">
      {text}
    </div>
  );
}

// ==============================================================
// COMPONENT CHÍNH — Quản lý danh sách đen (Blacklist)
// ==============================================================
export default function BlacklistPage({ showToast, user }) {
  const [blacklist, setBlacklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingBlacklist, setSubmittingBlacklist] = useState(false);

  // Danh sách loại phương tiện tải từ API thực (không hardcode)
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // State quản lý ảnh đính kèm
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  // State và Ref cho tính năng Webcam
  const [showWebcam, setShowWebcam] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // State form thêm biển số mới vào blacklist
  // vehicleTypeId sẽ được set sau khi tải config từ API
  const [blacklistForm, setBlacklistForm] = useState({
    vehicleTypeId: "",
    vehicleTypeName: "",
    licensePlate: "",
    reason: "STOLEN",
    description: "",
  });

  // State filter/search để lọc danh sách
  const [searchText, setSearchText] = useState("");
  const [filterActive, setFilterActive] = useState("all"); // "all" | "active" | "removed"

  // Tải cấu hình bãi xe (danh sách loại phương tiện thực từ backend)
  useEffect(() => {
    const fetchConfig = async () => {
      setLoadingConfig(true);
      try {
        const res = await staffApi.getParkingConfig();
        const config = res.data.data || {};
        const types = config.vehicleTypes || [];
        setVehicleTypes(types);
        // Mặc định chọn loại phương tiện đầu tiên từ API
        if (types.length > 0) {
          setBlacklistForm(prev => ({
            ...prev,
            vehicleTypeId: types[0].id,
            vehicleTypeName: types[0].name,
          }));
        }
      } catch (err) {
        console.error("Fetch parking config error:", err);
        showToast("Không thể tải cấu hình loại phương tiện từ máy chủ.", "error");
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfig();
  }, []);

  // Lấy danh sách blacklist từ backend
  const fetchBlacklist = async () => {
    setLoading(true);
    try {
      const res = await staffApi.getBlacklist();
      setBlacklist(res.data.data || []);
    } catch (err) {
      console.error("Fetch blacklist error:", err);
      showToast(err.response?.data?.message || "Không tải được danh sách đen.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlacklist();
  }, []);

  // Helper: kiểm tra loại xe hiện tại có phải xe đạp không (dùng name từ API)
  const isBicycle = () => {
    const name = (blacklistForm.vehicleTypeName || "").toLowerCase();
    return name.includes("đạp") || name.includes("bicycle");
  };

  // Thêm biển số vào blacklist
  const addBlacklist = async (e) => {
    e.preventDefault();

    let finalLicensePlate = blacklistForm.licensePlate;

    if (isBicycle()) {
      // Đối với xe đạp không có biển số, tự tạo một mã định danh giả duy nhất (< 20 ký tự)
      finalLicensePlate = `XEDAP-${Date.now().toString().slice(-8)}`;
    } else {
      if (!finalLicensePlate.trim()) {
        showToast("Vui lòng nhập biển số", "error");
        return;
      }
      finalLicensePlate = formatLicensePlate(finalLicensePlate, blacklistForm.vehicleTypeName);
      if (!isValidVietnamLicensePlate(finalLicensePlate)) {
        showToast("Biển số xe không đúng định dạng. Vui lòng nhập lại!", "error");
        setBlacklistForm(prev => ({ ...prev, licensePlate: "" }));
        return;
      }
    }

    if (!user?.id) {
      showToast("Thiếu thông tin người dùng, vui lòng đăng nhập lại.", "error");
      return;
    }

    // Yêu cầu bắt buộc có ảnh đối với xe đạp (tuỳ chọn với xe máy/ô tô)
    if (isBicycle() && selectedFiles.length === 0) {
      showToast("Vui lòng đính kèm ít nhất 1 ảnh nhận diện hoặc ảnh người vi phạm cho Xe Đạp", "error");
      return;
    }

    setSubmittingBlacklist(true);
    let uploadedUrls = [];

    try {
      // 1. Nếu có ảnh, upload lên Cloudinary TRƯỚC
      if (selectedFiles.length > 0) {
        showToast("Đang tải ảnh lên Cloudinary...", "warning");
        for (const file of selectedFiles) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_PRESET_BLACKLIST); // preset smartparking-blacklist
          formData.append("folder", "smartparking_blacklist"); // lưu vào folder riêng

          const res = await fetch(
            `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME_BLACKLIST}/image/upload`,
            { method: "POST", body: formData }
          );

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData?.error?.message || "Cloudinary upload failed");
          }
          const data = await res.json();
          uploadedUrls.push(data.secure_url);
        }
      }

      await staffApi.addBlacklistPlate({
        licensePlate: finalLicensePlate.trim().toUpperCase(),
        reason: blacklistForm.reason,
        description: blacklistForm.description || REASON_LABELS[blacklistForm.reason],
        imageUrls: uploadedUrls,
        addedByUserId: user.id,
      });
      // Reset form sau khi thêm thành công
      // Reset form - giữ lại vehicleTypeId/vehicleTypeName mặc định (loại đầu tiên từ API)
      setBlacklistForm(prev => ({
        ...prev,
        licensePlate: "",
        reason: "STOLEN",
        description: "",
      }));
      setSelectedFiles([]);
      showToast("Đã thêm biển số vào blacklist", "success");
      fetchBlacklist();
    } catch (err) {
      console.error("Add blacklist failed:", err);
      showToast(err.response?.data?.message || "Thêm blacklist thất bại", "error");
    } finally {
      setSubmittingBlacklist(false);
    }
  };

  // ==============================================================
  // LOGIC WEBCAM VÀ ẢNH (Tương tự Sự cố an ninh)
  // ==============================================================
  useEffect(() => {
    return () => {
      selectedFiles.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, [selectedFiles]);

  const handleAddFiles = (files) => {
    if (!files || !files.length) return;
    const newFiles = files.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    handleAddFiles(files);
    e.target.value = null;
  };

  const startWebcam = async () => {
    setShowWebcam(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (err) {
      console.error("Error accessing webcam:", err);
      showToast("Không thể truy cập camera. Vui lòng kiểm tra quyền trình duyệt.", "error");
      setShowWebcam(false);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowWebcam(false);
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `webcam_${Date.now()}.jpg`, { type: "image/jpeg" });
          handleAddFiles([file]);
          stopWebcam();
        }
      }, "image/jpeg", 0.9);
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleRemoveImage = (indexToRemove) => {
    setSelectedFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[indexToRemove].preview);
      newFiles.splice(indexToRemove, 1);
      return newFiles;
    });
  };

  // Lưu ý: Chức năng gỡ blacklist chỉ dành cho Manager/Admin
  // Security chỉ có quyền thêm biển số vào danh sách đen

  // Lọc danh sách theo search và trạng thái
  const filteredBlacklist = blacklist.filter((item) => {
    const matchSearch =
      !searchText ||
      (item.licensePlate || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(searchText.toLowerCase());

    const matchStatus =
      filterActive === "all" ||
      (filterActive === "active" && item.isActive !== false) ||
      (filterActive === "removed" && item.isActive === false);

    return matchSearch && matchStatus;
  });

  // Số liệu tổng hợp
  const activeCount = blacklist.filter((p) => p.isActive !== false).length;
  const removedCount = blacklist.filter((p) => p.isActive === false).length;

  return (
    <div className="space-y-6 mt-8">
      {/* Summary badges */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-red-50 border border-red-100 px-4 py-1.5 text-sm font-bold text-red-700">
          🚫 Đang chặn: {activeCount}
        </span>
        <span className="rounded-full bg-slate-100 border border-slate-200 px-4 py-1.5 text-sm font-bold text-slate-500">
          ✅ Đã gỡ: {removedCount}
        </span>
        <span className="rounded-full bg-blue-50 border border-blue-100 px-4 py-1.5 text-sm font-bold text-blue-600">
          📋 Tổng cộng: {blacklist.length}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        {/* ── Form thêm blacklist ── */}
        <Panel title="➕ Thêm biển số blacklist">
          <form onSubmit={addBlacklist} className="space-y-4">
            {/* Mobile: 1 cột full-width; Desktop: 2 cột */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Loại phương tiện">
                {loadingConfig ? (
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400">
                    Đang tải danh sách loại xe...
                  </div>
                ) : vehicleTypes.length === 0 ? (
                  <div className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-500">
                    ⚠️ Không tải được cấu hình loại xe từ server
                  </div>
                ) : (
                  <select
                    value={blacklistForm.vehicleTypeId}
                    onChange={(e) => {
                      const selected = vehicleTypes.find(v => String(v.id) === String(e.target.value));
                      setBlacklistForm({
                        ...blacklistForm,
                        vehicleTypeId: e.target.value,
                        vehicleTypeName: selected?.name || "",
                        licensePlate: "", // Xóa nội dung khi đổi loại phương tiện để nhập lại cho chuẩn
                      });
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  >
                    {vehicleTypes.map(vt => (
                      <option key={vt.id} value={vt.id}>{vt.name}</option>
                    ))}
                  </select>
                )}
              </Field>

              <Field label="Biển số xe (Tự động format)">
                <input
                  value={blacklistForm.licensePlate}
                  onChange={(e) => setBlacklistForm({ ...blacklistForm, licensePlate: e.target.value.toUpperCase() })}
                  onBlur={() => {
                    if (!isBicycle()) {
                      const formattedPlate = formatLicensePlate(blacklistForm.licensePlate, blacklistForm.vehicleTypeName);
                      if (formattedPlate.trim()) {
                        if (!isValidVietnamLicensePlate(formattedPlate)) {
                          showToast("Biển số xe không đúng định dạng. Vui lòng kiểm tra lại!", "error");
                          setBlacklistForm(prev => ({ ...prev, licensePlate: "" }));
                          return;
                        }
                      }
                      setBlacklistForm({ ...blacklistForm, licensePlate: formattedPlate });
                    }
                  }}
                  disabled={isBicycle()}
                  placeholder={isBicycle() ? "Không yêu cầu nhập cho xe đạp" : "VD: 59A1-123.45"}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono font-bold text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </Field>
            </div>

            <Field label="Lý do">
              <select
                value={blacklistForm.reason}
                onChange={(e) => setBlacklistForm({ ...blacklistForm, reason: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              >
                {Object.entries(REASON_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </Field>
            {/* Mô tả — full width cả mobile lẫn desktop */}
            <Field label="Mô tả chi tiết">
              <textarea
                value={blacklistForm.description}
                onChange={(e) => setBlacklistForm({ ...blacklistForm, description: e.target.value })}
                rows="4"
                placeholder="Ghi rõ lý do, biên bản, tình huống..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </Field>

            {/* Khu vực đính kèm ảnh sự cố */}
            <Field label="Đính kèm ảnh minh chứng (Bắt buộc cho xe đạp)">
              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  {/* Cách 1: Chụp trực tiếp bằng Webcam trên máy tính/laptop */}
                  <button 
                    type="button" 
                    onClick={startWebcam} 
                    disabled={submittingBlacklist || showWebcam}
                    className="flex-1 cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 py-3 text-center transition-colors hover:bg-slate-100 hover:border-slate-400 disabled:opacity-50"
                  >
                    <span className="text-sm font-semibold text-slate-600">📸 Mở Camera</span>
                  </button>

                  {/* Cách 2: Chọn ảnh từ thư viện thiết bị */}
                  <label className="flex-1 cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 py-3 text-center transition-colors hover:bg-slate-100 hover:border-slate-400 disabled:opacity-50">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={submittingBlacklist} multiple />
                    <span className="text-sm font-semibold text-slate-600">🖼️ Chọn nhiều ảnh</span>
                  </label>
                </div>

                {/* Giao diện Webcam (chỉ hiện khi nhấn Mở Camera) */}
                {showWebcam && (
                  <div className="mt-2 flex flex-col gap-3">
                    <div className="relative rounded-xl overflow-hidden border-2 border-slate-800 bg-black aspect-video flex flex-col shadow-lg">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover"
                      ></video>
                    </div>
                    {/* Hai nút điều khiển nằm bên ngoài để dễ bấm */}
                    <div className="flex justify-center gap-3 md:gap-4">
                      <button 
                        type="button" 
                        onClick={stopWebcam}
                        className="rounded-xl bg-slate-200 text-slate-700 px-6 py-3.5 text-sm font-bold shadow-sm hover:bg-slate-300 transition-all flex-1"
                      >
                        Hủy thao tác
                      </button>
                      <button 
                        type="button" 
                        onClick={captureImage}
                        className="rounded-xl bg-red-600 text-white px-6 py-3.5 text-sm font-bold shadow-md hover:bg-red-700 transition-all flex-1"
                      >
                        📸 Chụp ảnh
                      </button>
                    </div>
                  </div>
                )}

                {/* Hiển thị danh sách preview ảnh chờ upload */}
                {selectedFiles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="relative inline-block rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                        <img src={file.preview} alt={`Preview ${idx+1}`} className="h-24 w-auto object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          disabled={submittingBlacklist}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors disabled:opacity-50"
                          title="Xóa ảnh này"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Field>
            <button
              disabled={submittingBlacklist}
              className="w-full rounded-xl bg-red-600 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-red-600/20 hover:bg-red-700 disabled:opacity-60 transition-colors"
            >
              {submittingBlacklist ? "Đang lưu..." : "Thêm vào blacklist"}
            </button>
          </form>
        </Panel>

        {/* ── Danh sách blacklist từ database ── */}
        <Panel title="🚫 Danh sách đen từ database">
          {/* Thanh tìm kiếm + filter */}
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Tìm biển số hoặc mô tả..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
            />
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-600 outline-none"
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang chặn</option>
              <option value="removed">Đã gỡ</option>
            </select>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-slate-400">Đang tải danh sách đen...</div>
          ) : (
            <>
              {/* Desktop-only: table layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="p-3">Biển số</th>
                      <th className="p-3">Lý do</th>
                      <th className="p-3">Ngày thêm</th>
                      <th className="p-3">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBlacklist.map((item) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/50 transition-colors ${item.isActive === false ? "opacity-45" : ""}`}
                      >
                        <td className="p-3"><LicensePlate plate={item.licensePlate?.startsWith("XEDAP-") ? "XE ĐẠP" : item.licensePlate} /></td>
                        <td className="p-3">
                          <p className="font-bold text-slate-900">{REASON_LABELS[item.reason] || item.reason}</p>
                          <p className="mt-1 max-w-xs text-xs text-slate-500">{item.description}</p>
                          {item.imageUrls && item.imageUrls.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.imageUrls.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noreferrer">
                                  <img src={url} alt="Minh chứng" className="h-10 w-14 object-cover rounded border border-slate-200 hover:opacity-80" />
                                </a>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-xs font-semibold text-slate-500">{formatTime(item.addedAt)}</td>
                        <td className="p-3">
                          <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${item.isActive === false ? "bg-slate-100 text-slate-500 border border-slate-200" : "bg-red-50 text-red-700 border border-red-100"}`}>
                            {item.isActive === false ? "Đã gỡ" : "Đang chặn"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!filteredBlacklist.length && (
                  <Empty text={searchText ? "Không tìm thấy biển số phù hợp." : "Chưa có biển số nào trong blacklist."} />
                )}
              </div>

              {/* Mobile-only: card list dạng cuộn dọc */}
              <div className="md:hidden space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {filteredBlacklist.length === 0 ? (
                  <Empty text={searchText ? "Không tìm thấy biển số phù hợp." : "Chưa có biển số nào trong blacklist."} />
                ) : (
                  filteredBlacklist.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-xl border border-slate-200 bg-slate-50/50 p-4 hover:bg-slate-50 transition-colors ${item.isActive === false ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <LicensePlate plate={item.licensePlate?.startsWith("XEDAP-") ? "XE ĐẠP" : item.licensePlate} />
                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase flex-shrink-0 ${item.isActive === false ? "bg-slate-100 text-slate-500 border border-slate-200" : "bg-red-50 text-red-700 border border-red-100"}`}>
                          {item.isActive === false ? "Đã gỡ" : "Đang chặn"}
                        </span>
                      </div>
                      <p className="mt-2 font-bold text-sm text-slate-900">{REASON_LABELS[item.reason] || item.reason}</p>
                      {item.description && (
                        <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                      )}
                      {item.imageUrls && item.imageUrls.length > 0 && (
                        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                          {item.imageUrls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noreferrer" className="flex-shrink-0">
                              <img src={url} alt="Minh chứng" className="h-12 w-16 object-cover rounded-md border border-slate-200" />
                            </a>
                          ))}
                        </div>
                      )}
                      <p className="mt-2 text-[11px] font-semibold text-slate-400">{formatTime(item.addedAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
