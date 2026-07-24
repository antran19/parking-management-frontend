import React, { useEffect, useState, useRef } from "react";
import { staffApi } from "../../api/parkingApi";
import { formatLicensePlate, isValidVietnamLicensePlate, getLicensePlateValidationError } from "../../utils/licensePlate";

// ==============================================================
// CONSTANTS — Labels nhãn cho lý do blacklist
// ==============================================================
const REASON_LABELS = {
  STOLEN: "Xe trộm cắp",
  DISTURBANCE: "Gây rối / nguy cơ an ninh",
  UNPAID_FEE: "Nợ phí / chưa thanh toán",
  SECURITY_RISK: "Rủi ro an ninh",
  OTHER: "Khác",
};

// Định dạng thời gian sang tiếng Việt
const formatTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN");
};

// Component hiển thị biển số xe (giống project cũ)
const LicensePlate = ({ plate }) => (
  <span className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2.5 py-1 font-mono text-xs font-black tracking-widest text-slate-900 shadow-sm">
    <span className="mr-1.5 h-2 w-2 rounded-full bg-blue-600" />
    {plate || "—"}
  </span>
);

// Panel container dùng chung
function Panel({ title, children, className }) {
  return (
    <div className={`action-panel-item rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className || ""}`}>
      <h3 className="mb-5 text-base font-bold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

// Field label wrapper cho form
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
      {children}
    </label>
  );
}

// Empty state placeholder
function Empty({ text }) {
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
    existingImages: [],
  });

  // State filter/search để lọc danh sách
  const [searchText, setSearchText] = useState("");
  const [filterActive, setFilterActive] = useState("all"); // "all" | "active" | "removed"
  const [currentPage, setCurrentPage] = useState(1);

  // State cho modal chi tiết và ảnh
  const [viewingImage, setViewingImage] = useState(null);
  const [viewingBlacklistDetail, setViewingBlacklistDetail] = useState(null);

  // State cho chức năng chỉnh sửa
  const [editingId, setEditingId] = useState(null); // null = đang thêm mới, uuid = đang sửa

  // Tải cấu hình bãi xe (danh sách loại phương tiện thực từ backend)
  useEffect(() => {
    const fetchConfig = async () => {
      setLoadingConfig(true);
      try {
        const res = await staffApi.getParkingConfig();
        const config = res.data.data || {};
        const types = config.vehicleTypes || [];
        // Lọc bỏ xe đạp
        const filteredTypes = types.filter(v => !v.name.toLowerCase().includes("đạp") && !v.name.toLowerCase().includes("bicycle"));
        setVehicleTypes(filteredTypes);
        // Mặc định chọn loại phương tiện đầu tiên từ API
        if (filteredTypes.length > 0) {
          setBlacklistForm(prev => ({
            ...prev,
            vehicleTypeId: filteredTypes[0].id,
            vehicleTypeName: filteredTypes[0].name,
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

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (viewingImage || viewingBlacklistDetail) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [viewingImage, viewingBlacklistDetail]);

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

  // Nhấn Sửa — nạp dữ liệu cũ vào form và kích hoạt chế độ edit
  const handleEdit = (item) => {
    setEditingId(item.id);
    let defaultVt = vehicleTypes[0];

    // Format lại biển số
    let formattedPlate = item.licensePlate || "";
    if (formattedPlate && defaultVt) {
      formattedPlate = formatLicensePlate(formattedPlate, defaultVt.name);
    }
    setBlacklistForm({
      vehicleTypeId: defaultVt?.id || "",
      vehicleTypeName: defaultVt?.name || "",
      licensePlate: formattedPlate,
      reason: item.reason || "STOLEN",
      description: item.description || "",
      existingImages: item.imageUrls ? [...item.imageUrls] : [],
    });
    setSelectedFiles([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setBlacklistForm(prev => ({
      ...prev,
      licensePlate: "",
      reason: "STOLEN",
      description: "",
      existingImages: [],
    }));
    setSelectedFiles([]);
  };

  // Lưu chỉnh sửa
  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editingId) return;

    let finalLicensePlate = blacklistForm.licensePlate;
    if (!finalLicensePlate.trim()) {
      showToast("Vui lòng nhập biển số", "error");
      return;
    }
    finalLicensePlate = formatLicensePlate(finalLicensePlate, blacklistForm.vehicleTypeName);
    const validationError = getLicensePlateValidationError(finalLicensePlate, blacklistForm.vehicleTypeName);
    if (validationError) {
      showToast(validationError, "error");
      return;
    }

    setSubmittingBlacklist(true);
    let uploadedUrls = [];

    try {
      // 1. Nếu có ảnh MỚI, upload lên Cloudinary TRƯỚC
      if (selectedFiles.length > 0) {
        showToast("Đang tải ảnh mới lên Cloudinary...", "warning");
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

      // Kết hợp ảnh cũ và ảnh mới tải lên
      const finalImageUrls = [...(blacklistForm.existingImages || []), ...uploadedUrls];

      await staffApi.updateBlacklistPlate(editingId, {
        licensePlate: finalLicensePlate.trim().toUpperCase(),
        vehicleType: blacklistForm.vehicleTypeName,
        reason: blacklistForm.reason,
        description: blacklistForm.description,
        imageUrls: finalImageUrls,
        addedByUserId: user.id,
      });
      showToast("Đã cập nhật blacklist thành công!", "success");
      cancelEdit();
      fetchBlacklist();
    } catch (err) {
      console.error("Update blacklist failed:", err);
      showToast(err.response?.data?.message || "Cập nhật thất bại", "error");
    } finally {
      setSubmittingBlacklist(false);
    }
  };

  // Thêm biển số vào blacklist
  const addBlacklist = async (e) => {
    e.preventDefault();

    let finalLicensePlate = blacklistForm.licensePlate;

    if (!finalLicensePlate.trim()) {
      showToast("Vui lòng nhập biển số", "error");
      return;
    }
    finalLicensePlate = formatLicensePlate(finalLicensePlate, blacklistForm.vehicleTypeName);
    const validationError = getLicensePlateValidationError(finalLicensePlate, blacklistForm.vehicleTypeName);
    if (validationError) {
      showToast(validationError, "error");
      setBlacklistForm(prev => ({ ...prev, licensePlate: "" }));
      return;
    }

    if (!user?.id) {
      showToast("Thiếu thông tin người dùng, vui lòng đăng nhập lại.", "error");
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
        vehicleType: blacklistForm.vehicleTypeName,
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
        existingImages: [],
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

  const handleRemoveExistingImage = (indexToRemove) => {
    setBlacklistForm(prev => {
      const newExisting = [...prev.existingImages];
      newExisting.splice(indexToRemove, 1);
      return { ...prev, existingImages: newExisting };
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

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredBlacklist.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBlacklist = filteredBlacklist.slice(startIndex, startIndex + itemsPerPage);

  // Số liệu tổng hợp
  const activeCount = blacklist.filter((p) => p.isActive !== false).length;
  const removedCount = blacklist.filter((p) => p.isActive === false).length;

  return (
    <div className="space-y-6 mt-8">
      {/* Summary badges */}
      <div className="flex flex-wrap items-center gap-3">
        <button 
          onClick={() => { setFilterActive("active"); setCurrentPage(1); }}
          className={`rounded-full px-4 py-1.5 text-sm font-bold transition-all ${filterActive === "active" ? "bg-red-600 text-white shadow-md ring-2 ring-red-200 ring-offset-1" : "bg-red-50 border border-red-100 text-red-700 hover:bg-red-100"}`}
        >
          🚫 Đang chặn: {activeCount}
        </button>
        <button 
          onClick={() => { setFilterActive("removed"); setCurrentPage(1); }}
          className={`rounded-full px-4 py-1.5 text-sm font-bold transition-all ${filterActive === "removed" ? "bg-slate-600 text-white shadow-md ring-2 ring-slate-200 ring-offset-1" : "bg-slate-100 border border-slate-200 text-slate-500 hover:bg-slate-200"}`}
        >
          ✅ Đã gỡ: {removedCount}
        </button>
        <button 
          onClick={() => { setFilterActive("all"); setCurrentPage(1); }}
          className={`rounded-full px-4 py-1.5 text-sm font-bold transition-all ${filterActive === "all" ? "bg-blue-600 text-white shadow-md ring-2 ring-blue-200 ring-offset-1" : "bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100"}`}
        >
          📋 Tổng cộng: {blacklist.length}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        {/* ── Form thêm / sửa blacklist ── */}
        <Panel title={editingId ? "✏️ Chỉnh sửa blacklist" : "➕ Thêm biển số blacklist"}>
          {editingId && (
            <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3">
              <p className="text-xs font-bold text-amber-700">✏️ Đang chỉnh sửa bản ghi blacklist. Sửa biển số, lý do và mô tả bên dưới.</p>
              <button type="button" onClick={cancelEdit} className="shrink-0 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-200 transition-colors">✕ Hủy</button>
            </div>
          )}
          <form onSubmit={editingId ? saveEdit : addBlacklist} className="space-y-4">
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
                    {vehicleTypes.filter(vt => vt.name !== 'Xe đạp').map(vt => (
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
                    const formattedPlate = formatLicensePlate(blacklistForm.licensePlate, blacklistForm.vehicleTypeName);
                    if (formattedPlate.trim()) {
                      const validationError = getLicensePlateValidationError(formattedPlate, blacklistForm.vehicleTypeName);
                      if (validationError) {
                        showToast(validationError, "error");
                        setBlacklistForm(prev => ({ ...prev, licensePlate: "" }));
                        return;
                      }
                    }
                    setBlacklistForm({ ...blacklistForm, licensePlate: formattedPlate });
                  }}
                  placeholder="VD: 59A1-123.45"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono font-bold text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 uppercase disabled:opacity-50 min-w-0"
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
            <Field label={editingId ? "Tải lên ảnh mới (Bắt buộc cho xe đạp nếu xóa hết ảnh cũ)" : "Đính kèm ảnh minh chứng (Bắt buộc cho xe đạp)"}>
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
                        <img src={file.preview} alt={`Preview ${idx + 1}`} className="h-24 w-auto object-cover" />
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

                {/* Hiển thị danh sách ảnh cũ đã có từ trước khi sửa */}
                {blacklistForm.existingImages && blacklistForm.existingImages.length > 0 && selectedFiles.length === 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-slate-500 mb-2">Ảnh hiện tại của blacklist:</p>
                    <div className="flex flex-wrap gap-2">
                      {blacklistForm.existingImages.map((url, idx) => (
                        <div key={idx} className="relative inline-block rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                          <img src={url} alt={`Existing ${idx + 1}`} className="h-24 w-auto object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(idx)}
                            disabled={submittingBlacklist}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors z-10 flex items-center justify-center disabled:opacity-50"
                            title="Xóa ảnh này"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Field>
            <button
              disabled={submittingBlacklist}
              className={`w-full rounded-xl py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg transition-colors disabled:opacity-60 ${editingId
                ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                : "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                }`}
            >
              {submittingBlacklist ? "Đang lưu..." : editingId ? "Lưu chỉnh sửa" : "Thêm vào blacklist"}
            </button>
          </form>
        </Panel>

        {/* ── Danh sách blacklist từ database ── */}
        <Panel title="🚫 Danh sách đen từ database">
          {/* Thanh tìm kiếm + filter */}
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={searchText}
              onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
              placeholder="Tìm biển số hoặc mô tả..."
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
            />
            <select
              value={filterActive}
              onChange={(e) => { setFilterActive(e.target.value); setCurrentPage(1); }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-600 outline-none"
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang chặn</option>
              <option value="removed">Đã gỡ</option>
            </select>
          </div>

          {!loading && (
            <p className="mb-3 text-xs text-slate-400 font-semibold">
              Hiển thị {filteredBlacklist.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + itemsPerPage, filteredBlacklist.length)} trên tổng số {filteredBlacklist.length} biển số (Trang {currentPage}/{totalPages || 1})
            </p>
          )}

          {loading ? (
            <div className="py-8 text-center text-sm text-slate-400">Đang tải danh sách đen...</div>
          ) : !filteredBlacklist.length ? (
            <Empty text={searchText ? "Không tìm thấy biển số phù hợp." : "Chưa có biển số nào trong blacklist."} />
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {paginatedBlacklist.map((item) => {
                const isActive = item.isActive !== false;
                return (
                  <div key={item.id} onClick={() => setViewingBlacklistDetail(item)} className={`cursor-pointer rounded-xl border border-slate-200 bg-slate-50/50 p-4 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col gap-2 ${!isActive ? "opacity-60" : ""}`}>
                    {/* Header Row */}
                    <div className="flex items-start justify-between">
                      <div className="flex gap-2 items-center flex-wrap">
                        <div className="flex items-center gap-1">
                          <span className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2 py-0.5 font-mono text-[10px] font-black tracking-widest text-slate-900 shadow-sm">
                            <LicensePlate plate={item.licensePlate?.startsWith("XEDAP-") ? "XE ĐẠP" : item.licensePlate} />
                          </span>
                          {item.vehicleType && (
                            <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                              {item.vehicleType}
                            </span>
                          )}
                        </div>

                        {/* Trạng thái Badge */}
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${!isActive ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                          {!isActive ? "Đã gỡ" : "Đang chặn"}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {isActive && (
                          <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold px-2 py-1 rounded shadow-sm transition-colors">
                            Sửa
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Body */}
                    <p className="text-sm font-bold text-slate-900 mt-1">{REASON_LABELS[item.reason] || item.reason}</p>
                    {item.description && <p className="text-sm font-medium leading-relaxed text-slate-700 my-1">{item.description}</p>}

                    {/* Image Thumbnails */}
                    {(() => {
                      const validImages = item.imageUrls ? item.imageUrls.filter(url => url) : [];
                      return validImages.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {validImages.map((url, idx) => (
                            <div key={idx} onClick={(e) => { e.stopPropagation(); setViewingImage(url); }} className="cursor-pointer">
                              <img src={url} alt="Sự cố" className="h-16 w-16 object-cover rounded-md border border-slate-200 shadow-sm hover:opacity-80 transition-opacity" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Không có ảnh</p>
                      );
                    })()}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 border-t border-slate-200 pt-2 mt-1">
                      <span>Tạo: {formatTime(item.addedAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Phân trang */}
          {!loading && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-colors"
              >
                Trước
              </button>
              <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-none custom-scrollbar pb-1 sm:pb-0">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                      currentPage === page
                        ? "border-red-600 bg-red-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 transition-colors"
              >
                Tiếp
              </button>
            </div>
          )}
        </Panel>
      </div>

      {/* ── MODAL: Xem ảnh phóng to ── */}
      {viewingImage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm transition-all" onClick={() => setViewingImage(null)}>
          <div className="relative max-h-full max-w-5xl flex items-center justify-center">
            <button onClick={() => setViewingImage(null)} className="absolute -top-12 right-0 text-white hover:text-slate-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img src={viewingImage} alt="Phóng to" className="max-h-[85vh] w-auto rounded-xl shadow-2xl ring-1 ring-white/20" onClick={(e) => e.stopPropagation()} />
          </div>
        </div>
      )}

      {/* ── MODAL: Xem chi tiết Blacklist ── */}
      {viewingBlacklistDetail && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm transition-all" onClick={() => setViewingBlacklistDetail(null)}>
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-900 px-8 py-5 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Chi tiết danh sách đen</h3>
                <p className="text-sm font-semibold text-slate-400 mt-1">Thông tin chi tiết về việc chặn phương tiện</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center text-2xl shadow-inner border border-slate-700">
                🚫
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-8 bg-slate-50/50 flex-1">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-xs font-black tracking-widest uppercase text-slate-400 mb-2">Lý do</span>
                  <span className="inline-block rounded-full px-3 py-1.5 text-xs font-black tracking-wider uppercase border bg-slate-100 text-slate-600 border-slate-200">
                    {REASON_LABELS[viewingBlacklistDetail.reason] || viewingBlacklistDetail.reason}
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-xs font-black tracking-widest uppercase text-slate-400 mb-2">Trạng thái</span>
                  <span className={`inline-block rounded-full px-3 py-1.5 text-xs font-black tracking-wider uppercase border ${viewingBlacklistDetail.isActive === false ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                    {viewingBlacklistDetail.isActive === false ? "Đã gỡ" : "Đang chặn"}
                  </span>
                </div>
              </div>

              {/* Vehicle info */}
              <div className="grid grid-cols-2 gap-4">
                {viewingBlacklistDetail.licensePlate && (
                  <div>
                    <span className="block text-xs font-bold uppercase text-slate-500 mb-2">Biển số xe</span>
                    <div className="flex items-stretch gap-2">
                      <span className="inline-flex items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-4 py-2 font-mono text-xl font-black tracking-widest text-slate-900 shadow-sm whitespace-nowrap">
                        <LicensePlate plate={viewingBlacklistDetail.licensePlate?.startsWith("XEDAP-") ? "XE ĐẠP" : viewingBlacklistDetail.licensePlate} />
                      </span>
                      {viewingBlacklistDetail.vehicleType && (
                        <span className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 shadow-sm whitespace-nowrap">
                          {viewingBlacklistDetail.vehicleType}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <span className="block text-xs font-bold uppercase text-slate-500 mb-2">Mô tả chi tiết</span>
                <p className="text-sm font-medium text-slate-700 whitespace-pre-wrap rounded-2xl bg-slate-50/50 border border-slate-200 p-5 leading-relaxed shadow-inner">
                  {viewingBlacklistDetail.description || "Không có mô tả chi tiết."}
                </p>
              </div>

              {/* Images */}
              {viewingBlacklistDetail.imageUrls?.length > 0 && (
                <div>
                  <span className="block text-xs font-bold uppercase text-slate-500 mb-3">Hình ảnh minh chứng</span>
                  <div className="flex flex-wrap gap-3">
                    {viewingBlacklistDetail.imageUrls.map((url, idx) => (
                      <div key={idx} onClick={(e) => { e.stopPropagation(); setViewingImage(url); }} className="cursor-pointer group relative overflow-hidden rounded-2xl border-2 border-slate-200 shadow-sm transition-all hover:border-slate-400">
                        <img src={url} alt="Minh chứng" className="h-28 w-28 object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 drop-shadow-md transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer info */}
              <div className="pt-6 mt-4 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold text-slate-700">Thời gian thêm:</span>
                  <span className="font-medium text-slate-600">{formatTime(viewingBlacklistDetail.addedAt)}</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-200 flex justify-end p-6 bg-white">
              <button onClick={() => setViewingBlacklistDetail(null)} className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-8 py-3.5 transition-colors active:scale-95 shadow-sm">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
