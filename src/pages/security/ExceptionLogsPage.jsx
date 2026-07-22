import React, { useEffect, useState, useRef } from "react";
import { staffApi } from "../../api/parkingApi";
import { formatLicensePlate, getLicensePlateValidationError } from "../../utils/licensePlate";

// ==============================================================
// CONSTANTS — Nhãn hiển thị cho từng loại sự cố an ninh
// ==============================================================
const EXCEPTION_LABELS = {
  LOST_TICKET: "Mất thẻ / mất QR",
  WRONG_PLATE: "Sai biển số",
  OVERTIME: "Quá giờ",
  WRONG_ZONE: "Sai khu vực",
  UNPAID: "Chưa thanh toán",
  SUSPICIOUS_BEHAVIOR: "Hành vi đáng ngờ",
  OTHER: "Khác",
};

// Badge màu theo loại sự cố (để dễ phân biệt mức độ)
const EXCEPTION_BADGE_COLOR = {
  LOST_TICKET: "bg-amber-50 text-amber-700 border-amber-100",
  WRONG_PLATE: "bg-red-50 text-red-700 border-red-100",
  OVERTIME: "bg-orange-50 text-orange-700 border-orange-100",
  WRONG_ZONE: "bg-purple-50 text-purple-700 border-purple-100",
  UNPAID: "bg-rose-50 text-rose-700 border-rose-100",
  SUSPICIOUS_BEHAVIOR: "bg-red-50 text-red-800 border-red-200",
  OTHER: "bg-slate-100 text-slate-600 border-slate-200",
};

// Định dạng thời gian sang locale tiếng Việt
const formatTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN");
};

// Panel container
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

// Empty state khi không có dữ liệu
function Empty({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-400">
      {text}
    </div>
  );
}

// ==============================================================
// COMPONENT CHÍNH — Trang ghi nhận sự cố an ninh (Exception Logs)
// ==============================================================
export default function ExceptionLogsPage({ showToast, user }) {
  // --- QUẢN LÝ TRẠNG THÁI (STATE) CỦA COMPONENT ---
  // State quản lý danh sách sự cố và trạng thái tải dữ liệu
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false); // Trạng thái khi đang gửi form (submit)

  // Danh sách loại phương tiện (xe số, xe ga, ô tô...) lấy từ cấu hình bãi xe
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Upload file: Lưu trữ danh sách các file ảnh được chọn từ thiết bị
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Webcam: Các state và ref để bật/tắt camera trực tiếp trên trình duyệt
  const [showWebcam, setShowWebcam] = useState(false);
  const videoRef = useRef(null); // Ref để gắn stream vào thẻ <video>
  const streamRef = useRef(null); // Ref giữ stream để tắt luồng video (track) khi không dùng nữa

  // Lọc (Filter): State lưu giá trị bộ lọc trên danh sách
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Edit mode: Chứa ID của sự cố đang được chỉnh sửa. Nếu null nghĩa là đang tạo mới.
  const [editingId, setEditingId] = useState(null);

  // Image Modal: Chứa URL của ảnh đang được phóng to
  const [viewingImage, setViewingImage] = useState(null);

  // Detail Modal: Chứa object sự cố đang xem chi tiết (mở modal)
  const [viewingLogDetail, setViewingLogDetail] = useState(null);

  // Resolve Modal (Giải quyết sự cố): State quản lý luồng "Đánh dấu đã giải quyết"
  const [resolvingLog, setResolvingLog] = useState(null);
  const [resolveForm, setResolveForm] = useState({
    resolutionNote: "", // Ghi chú lý do / kết quả giải quyết
    selectedFiles: [],
  });
  const [resolvingSubmitting, setResolvingSubmitting] = useState(false);
  const [showResolveWebcam, setShowResolveWebcam] = useState(false);
  const resolveVideoRef = useRef(null);
  const resolveStreamRef = useRef(null);

  // State: Có liên quan phương tiện hay không? (để hiện/ẩn ô nhập biển số)
  const [isVehicleRelated, setIsVehicleRelated] = useState(false);

  // Form: State lưu trữ dữ liệu của Form tạo mới hoặc chỉnh sửa sự cố
  const [form, setForm] = useState({
    exceptionType: "LOST_TICKET",
    description: "",
    sessionId: "",
    licensePlate: "",
    vehicleTypeId: "",
    vehicleTypeName: "",
    existingImages: [],
  });

  // Hàm xử lý sự kiện khi người dùng nhập xong biển số (blur khỏi ô input)
  // Tính năng: Tự động format biển số chuẩn (VD: 59A112345 -> 59A1-123.45)
  // và gọi API kiểm tra xem xe này có đang đỗ trong bãi hay không.
  const handleLicensePlateBlur = async () => {
    if (!isVehicleRelated) return;

    const formattedPlate = formatLicensePlate(form.licensePlate, form.vehicleTypeName);

    if (formattedPlate.trim()) {
      const validationError = getLicensePlateValidationError(formattedPlate, form.vehicleTypeName);
      if (validationError) {
        showToast(validationError, "error");
        setForm(prev => ({ ...prev, licensePlate: "" }));
        return;
      }

      setForm(prev => ({ ...prev, licensePlate: formattedPlate }));

      if (!editingId) {
        try {
          await staffApi.getActiveSessionByPlate(formattedPlate);
        } catch (err) {
          showToast("Hiện tại xe chưa có trong bãi", "error");
          setForm(prev => ({ ...prev, licensePlate: "" }));
        }
      }

    }
  };

  const handleSessionIdChange = (e) => {
    const val = e.target.value;
    setForm({ ...form, sessionId: val });
  };

  // Hàm gọi API lấy danh sách toàn bộ sự cố từ Server
  // Sau khi lấy về sẽ sắp xếp theo thời gian mới nhất (descending)
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await staffApi.getSecurityExceptions();
      const sortedLogs = (res.data.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setLogs(sortedLogs);
    } catch (err) {
      console.error("Fetch exception logs error:", err);
      showToast(err.response?.data?.message || "Không tải được danh sách sự cố.", "error");
    } finally {
      setLoading(false);
    }
  };

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
        if (filteredTypes.length > 0) {
          setForm(prev => ({ ...prev, vehicleTypeId: filteredTypes[0].id, vehicleTypeName: filteredTypes[0].name }));
        }
      } catch (err) {
        console.error("Fetch parking config error:", err);
        showToast("Không thể tải cấu hình loại phương tiện.", "error");
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfig();
    fetchLogs();
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (viewingImage || viewingLogDetail) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [viewingImage, viewingLogDetail]);

  useEffect(() => {
    return () => {
      selectedFiles.forEach(file => URL.revokeObjectURL(file.preview));
      resolveForm.selectedFiles.forEach(file => URL.revokeObjectURL(file.preview));
    }
  }, [selectedFiles, resolveForm.selectedFiles]);

  const handleAddFiles = (files) => {
    if (!files || !files.length) return;
    const newFiles = files.map(file => Object.assign(file, { preview: URL.createObjectURL(file) }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleImageUpload = (e) => {
    handleAddFiles(Array.from(e.target.files));
    e.target.value = null;
  };

  // --- CÁC HÀM XỬ LÝ WEBCAM VÀ ẢNH ---
  // Hàm xin quyền và bật camera của thiết bị (máy tính/điện thoại)
  const startWebcam = async () => {
    setShowWebcam(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      streamRef.current = stream;
    } catch (err) {
      showToast("Không thể truy cập camera.", "error");
      setShowWebcam(false);
    }
  };

  // Hàm tắt camera, giải phóng tài nguyên khi không dùng nữa
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowWebcam(false);
  };

  // Hàm chụp ảnh từ camera: Lấy khung hình hiện tại trên thẻ <video> vẽ ra <canvas> rồi convert sang file ảnh
  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          handleAddFiles([new File([blob], `webcam_${Date.now()}.jpg`, { type: "image/jpeg" })]);
          stopWebcam();
        }
      }, "image/jpeg", 0.9);
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
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

  // Handle Edit Click
  const handleEdit = (log) => {
    setEditingId(log.id);

    let defaultVt = vehicleTypes[0];

    // Format lại biển số ngay khi ấn sửa
    let formattedPlate = log.licensePlate || "";
    if (formattedPlate && defaultVt) {
      formattedPlate = formatLicensePlate(formattedPlate, defaultVt.name);
    }

    // Nếu log có biển số coi như có liên quan xe
    setIsVehicleRelated(!!log.licensePlate);

    setForm({
      exceptionType: log.exceptionType || "LOST_TICKET",
      description: log.description || "",
      licensePlate: formattedPlate,
      vehicleTypeId: defaultVt?.id || "",
      vehicleTypeName: defaultVt?.name || "",
      existingImages: log.imageUrls ? [...log.imageUrls] : [],
    });
    setSelectedFiles([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRemoveExistingImage = (indexToRemove) => {
    setForm(prev => {
      const newExisting = [...prev.existingImages];
      newExisting.splice(indexToRemove, 1);
      return { ...prev, existingImages: newExisting };
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsVehicleRelated(false);
    setForm({
      exceptionType: "LOST_TICKET",
      description: "",
      licensePlate: "",
      vehicleTypeId: vehicleTypes[0]?.id || "",
      vehicleTypeName: vehicleTypes[0]?.name || "",
      existingImages: [],
    });
    setSelectedFiles([]);
  };

  // Resolve Modal Handlers
  const openResolveModal = (log) => {
    setResolvingLog(log);
    setResolveForm({ resolutionNote: "", selectedFiles: [] });
  };

  const closeResolveModal = () => {
    setResolvingLog(null);
    if (resolveStreamRef.current) {
      resolveStreamRef.current.getTracks().forEach(track => track.stop());
      resolveStreamRef.current = null;
    }
    setShowResolveWebcam(false);
  };

  const handleResolveImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newFiles = files.map(file => Object.assign(file, { preview: URL.createObjectURL(file) }));
    setResolveForm(prev => ({ ...prev, selectedFiles: [...prev.selectedFiles, ...newFiles] }));
    e.target.value = null;
  };

  const handleRemoveResolveImage = (indexToRemove) => {
    setResolveForm(prev => {
      const newFiles = [...prev.selectedFiles];
      URL.revokeObjectURL(newFiles[indexToRemove].preview);
      newFiles.splice(indexToRemove, 1);
      return { ...prev, selectedFiles: newFiles };
    });
  };

  const startResolveWebcam = async () => {
    setShowResolveWebcam(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (resolveVideoRef.current) resolveVideoRef.current.srcObject = stream;
      resolveStreamRef.current = stream;
    } catch (err) {
      showToast("Không thể truy cập camera.", "error");
      setShowResolveWebcam(false);
    }
  };

  const stopResolveWebcam = () => {
    if (resolveStreamRef.current) {
      resolveStreamRef.current.getTracks().forEach(track => track.stop());
      resolveStreamRef.current = null;
    }
    setShowResolveWebcam(false);
  };

  const captureResolveImage = () => {
    if (resolveVideoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = resolveVideoRef.current.videoWidth;
      canvas.height = resolveVideoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(resolveVideoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const newFile = new File([blob], `webcam_${Date.now()}.jpg`, { type: "image/jpeg" });
          Object.assign(newFile, { preview: URL.createObjectURL(newFile) });
          setResolveForm(prev => ({ ...prev, selectedFiles: [...prev.selectedFiles, newFile] }));
          stopResolveWebcam();
        }
      }, "image/jpeg", 0.9);
    }
  };

  // Hàm gọi API để lưu thông tin "Giải quyết sự cố"
  // Sẽ upload ảnh lên Cloudinary (nếu có) trước, sau đó gửi data giải quyết lên backend
  const submitResolve = async (e) => {
    e.preventDefault();
    if (!user?.id) {
      showToast("Thiếu thông tin người dùng, vui lòng đăng nhập lại.", "error");
      return;
    }

    setResolvingSubmitting(true);
    let uploadedUrls = [];

    try {
      if (resolveForm.selectedFiles.length > 0) {
        showToast("Đang tải ảnh lên Cloudinary...", "warning");
        for (const file of resolveForm.selectedFiles) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_PRESET_EXCEPTIONS);

          const res = await fetch(
            `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME_EXCEPTIONS}/image/upload`,
            { method: "POST", body: formData }
          );
          const data = await res.json();
          if (data.secure_url) {
            uploadedUrls.push("[RESOLVE]" + data.secure_url);
          } else {
            throw new Error(data.error?.message || "Lỗi khi upload ảnh");
          }
        }
      }

      const payload = {
        handledByUserId: user.id,
        resolution: resolveForm.resolutionNote.trim(),
        resolutionImageUrls: uploadedUrls.length > 0 ? uploadedUrls : undefined
      };

      await staffApi.resolveSecurityException(resolvingLog.id, payload);
      showToast("Đã giải quyết sự cố!", "success");
      closeResolveModal();
      fetchLogs();
    } catch (err) {
      showToast(err.response?.data?.message || err.message || "Lỗi khi giải quyết sự cố", "error");
    } finally {
      setResolvingSubmitting(false);
    }
  };

  // --- HÀM SUBMIT FORM CHÍNH ---
  // Hàm xử lý gửi dữ liệu khi tạo mới hoặc chỉnh sửa sự cố
  // Sẽ validate dữ liệu, upload ảnh lên Cloudinary (nếu có) và gọi API tương ứng
  const submitException = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) {
      showToast("Vui lòng nhập mô tả sự cố", "error");
      return;
    }
    if (isVehicleRelated && form.licensePlate.trim()) {
      const formattedPlate = formatLicensePlate(form.licensePlate, form.vehicleTypeName);
      const validationError = getLicensePlateValidationError(formattedPlate, form.vehicleTypeName);
      if (validationError) {
        showToast(validationError, "error");
        setForm(prev => ({ ...prev, licensePlate: "" }));
        return;
      }

      if (!editingId) {
        try {
          await staffApi.getActiveSessionByPlate(formattedPlate);
        } catch (err) {
          showToast("Hiện tại xe chưa có trong bãi", "error");
          return;
        }
      }
    }
    if (!user?.id) {
      showToast("Thiếu thông tin người dùng, vui lòng đăng nhập lại.", "error");
      return;
    }

    setSubmitting(true);
    let uploadedUrls = [];

    try {
      if (selectedFiles.length > 0) {
        showToast("Đang tải ảnh lên Cloudinary...", "warning");
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

      const payload = {
        exceptionType: form.exceptionType,
        description: form.description.trim(),
        handledByUserId: user.id,
      };

      if (isVehicleRelated && form.licensePlate.trim()) {
        payload.licensePlate = formatLicensePlate(form.licensePlate.trim(), form.vehicleTypeName);
        payload.vehicleType = form.vehicleTypeName;
      }

      if (editingId) {
        payload.imageUrls = [...(form.existingImages || []), ...uploadedUrls];
        await staffApi.updateSecurityException(editingId, payload);
        showToast("✅ Đã cập nhật sự cố", "success");
        cancelEdit();
      } else {
        if (uploadedUrls.length > 0) payload.imageUrls = uploadedUrls;
        await staffApi.logSecurityException(payload);
        showToast("✅ Đã ghi nhận sự cố mới", "success");
        setForm(prev => ({ ...prev, exceptionType: "LOST_TICKET", description: "", licensePlate: "", existingImages: [] }));
        setIsVehicleRelated(false);
        selectedFiles.forEach(f => URL.revokeObjectURL(f.preview));
        setSelectedFiles([]);
      }

      fetchLogs();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Ghi nhận/cập nhật sự cố thất bại", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // --- LOGIC LỌC DỮ LIỆU HIỂN THỊ ---
  // Mảng chứa các sự cố sau khi đã đi qua các bộ lọc (Loại, Trạng thái, Tìm kiếm)
  // Đây là mảng sẽ được dùng để render ra danh sách trên UI thay vì mảng 'logs' gốc
  const filteredLogs = logs.filter((log) => {
    const matchType = filterType === "all" || log.exceptionType === filterType;
    const matchStatus =
      filterStatus === "all" ||
      (filterStatus === "pending" && log.status !== "RESOLVED") ||
      (filterStatus === "resolved" && log.status === "RESOLVED");
    const matchSearch =
      !searchText ||
      (log.description || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (log.licensePlate || "").toLowerCase().includes(searchText.toLowerCase());
    return matchType && matchStatus && matchSearch;
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] mt-8 relative">
      {/* ── Form ghi nhận/edit sự cố ── */}
      <Panel title={editingId ? "✏️ Chỉnh sửa sự cố" : "📝 Ghi nhận sự cố mới"}>
        <form onSubmit={submitException} className="space-y-4">
          <div className="flex items-center gap-2 mb-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <input
              type="checkbox"
              id="isVehicleRelated"
              checked={isVehicleRelated}
              onChange={(e) => setIsVehicleRelated(e.target.checked)}
              className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
            />
            <label htmlFor="isVehicleRelated" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
              Sự cố này CÓ LIÊN QUAN đến một phương tiện cụ thể
            </label>
          </div>

          {isVehicleRelated && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Loại phương tiện">
                <select
                  value={form.vehicleTypeId}
                  onChange={(e) => {
                    const selected = vehicleTypes.find(v => String(v.id) === String(e.target.value));
                    setForm({ ...form, vehicleTypeId: e.target.value, vehicleTypeName: selected?.name || "", licensePlate: "" });
                  }}
                  disabled={loadingConfig || vehicleTypes.length === 0}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none"
                >
                  {vehicleTypes.map(vt => <option key={vt.id} value={vt.id}>{vt.name}</option>)}
                </select>
              </Field>

              <Field label="Biển số xe">
                <input
                  type="text"
                  placeholder="VD: 59A1-123.45"
                  value={form.licensePlate}
                  onChange={(e) => setForm({ ...form, licensePlate: e.target.value })}
                  onBlur={handleLicensePlateBlur}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none uppercase min-w-0"
                />
              </Field>
            </div>
          )}

          <Field label="Loại sự cố">
            <select
              value={form.exceptionType}
              onChange={(e) => setForm({ ...form, exceptionType: e.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none"
            >
              {Object.entries(EXCEPTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>

          <Field label="Mô tả chi tiết sự cố">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows="5"
              placeholder="Ghi rõ tình huống xảy ra..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none"
            />
          </Field>



          <Field label={editingId ? "Tải lên ảnh mới (Ghi đè ảnh cũ - tuỳ chọn)" : "Đính kèm ảnh minh chứng (tuỳ chọn)"}>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <button type="button" onClick={startWebcam} disabled={submitting || showWebcam} className="flex-1 rounded-xl border border-dashed border-slate-300 bg-slate-50 py-3 text-sm font-semibold hover:bg-slate-100">📸 Mở Camera</button>
                <label className="flex-1 cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 py-3 text-center text-sm font-semibold hover:bg-slate-100">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={submitting} multiple />
                  🖼️ Chọn ảnh
                </label>
              </div>

              {showWebcam && (
                <div className="mt-2 flex flex-col gap-3">
                  <div className="relative rounded-xl overflow-hidden border-2 border-slate-800 bg-black aspect-video flex flex-col shadow-lg">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                  </div>
                  <div className="flex justify-center gap-3">
                    <button type="button" onClick={stopWebcam} className="rounded-xl bg-slate-200 text-slate-700 px-6 py-3.5 text-sm font-bold flex-1">Hủy</button>
                    <button type="button" onClick={captureImage} className="rounded-xl bg-red-600 text-white px-6 py-3.5 text-sm font-bold flex-1">📸 Chụp</button>
                  </div>
                </div>
              )}

              {form.existingImages && form.existingImages.length > 0 && selectedFiles.length === 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-slate-500 mb-2">Ảnh hiện tại của sự cố:</p>
                  <div className="flex flex-wrap gap-2">
                    {form.existingImages.map((url, idx) => (
                      <div key={idx} className="relative inline-block rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                        <img src={url} alt={`Existing ${idx + 1}`} className="h-24 w-auto object-cover" />
                        <button type="button" onClick={() => handleRemoveExistingImage(idx)} disabled={submitting} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors z-10 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedFiles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <p className="text-xs font-semibold text-slate-500 mb-2 w-full">Ảnh mới (sẽ thay thế ảnh hiện tại):</p>
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="relative inline-block rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                      <img src={file.preview} alt={`Preview ${idx + 1}`} className="h-24 w-auto object-cover" />
                      <button type="button" onClick={() => handleRemoveImage(idx)} disabled={submitting} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md">X</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Field>

          <div className="flex gap-3 pt-2">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                disabled={submitting}
                className="flex-1 rounded-xl bg-slate-200 py-3.5 text-sm font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-300 transition-colors"
              >
                Hủy
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-red-600 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Đang lưu..." : (editingId ? "Lưu chỉnh sửa" : "Ghi nhận sự cố")}
            </button>
          </div>
        </form>
      </Panel>

      {/* ── Danh sách sự cố đã ghi nhận ── */}
      <Panel title="📋 Danh sách sự cố an ninh">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
            placeholder="Tìm theo mô tả hoặc biển số..."
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none"
          />
          <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-600 outline-none min-w-[140px]">
            <option value="all">Tất cả loại</option>
            {Object.entries(EXCEPTION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-600 outline-none min-w-[140px]">
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">⏳ Đang xử lý</option>
            <option value="resolved">✓ Đã giải quyết</option>
          </select>
        </div>

        {!loading && (
          <p className="mb-3 text-xs text-slate-400 font-semibold">
            Hiển thị {filteredLogs.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + itemsPerPage, filteredLogs.length)} trên tổng số {filteredLogs.length} sự cố (Trang {currentPage}/{totalPages || 1})
          </p>
        )}

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-400">Đang tải danh sách sự cố...</div>
        ) : !filteredLogs.length ? (
          <Empty text="Không tìm thấy sự cố phù hợp." />
        ) : (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {paginatedLogs.map((log) => {
              const isResolved = log.status === "RESOLVED";
              return (
                <div key={log.id} onClick={() => setViewingLogDetail(log)} className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50/50 p-4 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col gap-2">
                  {/* Header Row */}
                  <div className="flex items-start justify-between">
                    <div className="flex gap-2 items-center flex-wrap">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${EXCEPTION_BADGE_COLOR[log.exceptionType] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                        {EXCEPTION_LABELS[log.exceptionType] || log.exceptionType}
                      </span>

                      {/* Trạng thái Badge */}
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${isResolved ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                        {isResolved ? "✓ Đã giải quyết" : "⏳ Đang xử lý"}
                      </span>

                      {log.licensePlate && (
                        <div className="flex items-center gap-1">
                          <span className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2 py-0.5 font-mono text-[10px] font-black tracking-widest text-slate-900 shadow-sm">
                            {log.licensePlate}
                          </span>
                          {log.vehicleType && (
                            <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                              {log.vehicleType}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {!isResolved && (
                        <button onClick={(e) => { e.stopPropagation(); openResolveModal(log); }} className="text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold px-2 py-1 rounded shadow-sm transition-colors">
                          Giải quyết
                        </button>
                      )}
                      {!isResolved && (
                        <button onClick={(e) => { e.stopPropagation(); handleEdit(log); }} className="text-[10px] bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold px-2 py-1 rounded shadow-sm transition-colors">
                          Sửa
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="text-sm font-medium leading-relaxed text-slate-700 my-1">
                    {(() => {
                      const fullDesc = log.description || "—";
                      const separatorRegex = /\s*===\s*GHI CHÚ GIẢI QUYẾT\s*===\s*/;
                      if (separatorRegex.test(fullDesc)) {
                        const [desc, res] = fullDesc.split(separatorRegex);
                        return (
                          <div className="flex flex-col gap-2.5">
                            <p className="whitespace-pre-wrap">{desc.trim()}</p>
                            <div className="rounded-xl border-l-2 border-emerald-400 bg-emerald-50/70 p-3 shadow-inner">
                              <span className="block text-[9px] font-black uppercase tracking-wider text-emerald-600 mb-1 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Ghi chú giải quyết
                              </span>
                              <p className="font-semibold text-emerald-900 text-xs whitespace-pre-wrap">{res.trim()}</p>
                            </div>
                          </div>
                        );
                      }
                      return <p className="whitespace-pre-wrap">{fullDesc.trim()}</p>;
                    })()}
                  </div>

                  {/* Image Thumbnails */}
                  {(() => {
                    const evidenceImages = (log.imageUrls || []).filter(url => url && !url.startsWith('[RESOLVE]'));
                    const resolveImages = (log.resolutionImageUrls || []).length > 0
                        ? log.resolutionImageUrls.map(url => url.replace('[RESOLVE]', ''))
                        : (log.imageUrls || []).filter(url => url && url.startsWith('[RESOLVE]')).map(url => url.replace('[RESOLVE]', ''));

                    return (evidenceImages.length > 0 || resolveImages.length > 0) ? (
                      <div className="flex flex-wrap gap-6 mt-2">
                        {evidenceImages.length > 0 && (
                          <div className="flex-1 min-w-[120px]">
                            <span className="block text-[10px] font-bold text-slate-500 mb-1">Minh chứng:</span>
                            <div className="flex flex-wrap gap-2">
                              {evidenceImages.map((url, idx) => (
                                <div key={`ev-${idx}`} onClick={(e) => { e.stopPropagation(); setViewingImage(url); }} className="cursor-pointer">
                                  <img src={url} alt="Minh chứng" className="h-16 w-16 object-cover rounded-md border border-slate-200 shadow-sm hover:opacity-80 transition-opacity" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {resolveImages.length > 0 && (
                          <div className="flex-1 min-w-[120px]">
                            <span className="block text-[10px] font-bold text-emerald-600 mb-1">Ảnh giải quyết:</span>
                            <div className="flex flex-wrap gap-2">
                              {resolveImages.map((url, idx) => (
                                <div key={`res-${idx}`} onClick={(e) => { e.stopPropagation(); setViewingImage(url); }} className="cursor-pointer">
                                  <img src={url} alt="Giải quyết" className="h-16 w-16 object-cover rounded-md border border-emerald-200 shadow-sm hover:opacity-80 transition-opacity" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic mt-1">Không có ảnh</p>
                    );
                  })()}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 border-t border-slate-200 pt-2 mt-1">
                    <span>NV: {log.handledBy || "—"}</span>
                    <span>Tạo: {formatTime(log.createdAt)} {isResolved && log.resolvedAt ? ` • Xử lý: ${formatTime(log.resolvedAt)}` : ''}</span>
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
            <div className="flex items-center gap-1 overflow-x-auto max-w-[250px] sm:max-w-none custom-scrollbar pb-1 sm:pb-0">
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

      {/* Image Modal Full Size */}
      {viewingImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewingImage(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setViewingImage(null)}
              className="absolute -top-12 right-0 md:-right-12 rounded-full bg-white/20 p-2 text-white hover:bg-white/40 transition-colors shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <img src={viewingImage} alt="Full Size" className="max-h-[90vh] w-auto rounded-xl shadow-2xl object-contain bg-black/50" />
          </div>
        </div>
      )}

      {/* Chi tiết sự cố Modal */}
      {viewingLogDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewingLogDetail(null)}>
          <div className="relative max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewingLogDetail(null)} className="absolute top-6 right-6 text-slate-400 hover:bg-slate-100 hover:text-slate-800 p-2 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <span className="text-3xl">📋</span> Chi tiết sự cố
            </h3>

            <div className="space-y-6">
              {/* Type and Status */}
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

              {/* Vehicle & Session info */}
              {(viewingLogDetail.licensePlate || viewingLogDetail.sessionId) && (
                <div className="grid grid-cols-2 gap-4">
                  {viewingLogDetail.licensePlate && (
                    <div>
                      <span className="block text-xs font-bold uppercase text-slate-500 mb-2">Biển số xe</span>
                      <div className="flex items-stretch gap-2">
                        <span className="inline-flex items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-4 py-2 font-mono text-xl font-black tracking-widest text-slate-900 shadow-sm whitespace-nowrap">
                          {viewingLogDetail.licensePlate}
                        </span>
                        {viewingLogDetail.vehicleType && (
                          <span className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 shadow-sm whitespace-nowrap">
                            {viewingLogDetail.vehicleType}
                          </span>
                        )}
                      </div>
                    </div>
                  )}


                </div>
              )}

              {/* Description and Resolution */}
              {(() => {
                const fullDesc = viewingLogDetail.description || "Không có mô tả chi tiết.";
                const separatorRegex = /\s*===\s*GHI CHÚ GIẢI QUYẾT\s*===\s*/;

                if (separatorRegex.test(fullDesc)) {
                  const [desc, res] = fullDesc.split(separatorRegex);
                  return (
                    <div className="space-y-4">
                      <div>
                        <span className="block text-xs font-bold uppercase text-slate-500 mb-2">Mô tả chi tiết</span>
                        <div className="text-sm font-medium text-slate-700 whitespace-pre-wrap rounded-2xl bg-slate-50/50 border border-slate-200 p-4 leading-relaxed shadow-inner">
                          <p>{desc.trim()}</p>
                        </div>
                      </div>
                      <div>
                        <span className="block text-xs font-bold uppercase text-emerald-600 mb-2 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Ghi chú giải quyết
                        </span>
                        <div className="text-sm font-medium text-emerald-950 whitespace-pre-wrap rounded-2xl bg-emerald-50 border border-emerald-200 p-4 leading-relaxed shadow-inner">
                          <p>{res.trim()}</p>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div>
                    <span className="block text-xs font-bold uppercase text-slate-500 mb-2">Mô tả chi tiết</span>
                    <div className="text-sm font-medium text-slate-700 whitespace-pre-wrap rounded-2xl bg-slate-50/50 border border-slate-200 p-4 leading-relaxed shadow-inner">
                      <p>{fullDesc.trim()}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Images */}
              {(viewingLogDetail.imageUrls?.length > 0 || viewingLogDetail.resolutionImageUrls?.length > 0) && (() => {
                const evidenceImages = (viewingLogDetail.imageUrls || []).filter(url => url && !url.startsWith('[RESOLVE]'));
                const resolveImages = (viewingLogDetail.resolutionImageUrls || []).length > 0
                    ? viewingLogDetail.resolutionImageUrls.map(url => url.replace('[RESOLVE]', ''))
                    : (viewingLogDetail.imageUrls || []).filter(url => url && url.startsWith('[RESOLVE]')).map(url => url.replace('[RESOLVE]', ''));

                if (evidenceImages.length === 0 && resolveImages.length === 0) return null;

                return (
                  <div className="flex flex-wrap gap-8">
                    {evidenceImages.length > 0 && (
                      <div className="flex-1 min-w-[150px]">
                        <span className="block text-xs font-bold uppercase text-slate-500 mb-3">Hình ảnh minh chứng</span>
                        <div className="flex flex-wrap gap-3">
                          {evidenceImages.map((url, idx) => (
                            <div key={`ev-${idx}`} onClick={(e) => { e.stopPropagation(); setViewingImage(url); }} className="cursor-pointer group relative overflow-hidden rounded-2xl border-2 border-slate-200 shadow-sm transition-all hover:border-slate-400">
                              <img src={url} alt="Sự cố" className="h-28 w-28 object-cover group-hover:scale-105 transition-transform duration-300" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 drop-shadow-md transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {resolveImages.length > 0 && (
                      <div className="flex-1 min-w-[150px]">
                        <span className="block text-xs font-bold uppercase text-emerald-600 mb-3">Hình ảnh giải quyết</span>
                        <div className="flex flex-wrap gap-3">
                          {resolveImages.map((url, idx) => (
                            <div key={`res-${idx}`} onClick={(e) => { e.stopPropagation(); setViewingImage(url); }} className="cursor-pointer group relative overflow-hidden rounded-2xl border-2 border-emerald-200 shadow-sm transition-all hover:border-emerald-400">
                              <img src={url} alt="Giải quyết" className="h-28 w-28 object-cover group-hover:scale-105 transition-transform duration-300" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 drop-shadow-md transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Footer info */}
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
      {/* Giải quyết sự cố Modal */}
      {resolvingLog && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeResolveModal}>
          <div className="relative max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl p-8" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeResolveModal} disabled={resolvingSubmitting} className="absolute top-6 right-6 text-slate-400 hover:bg-slate-100 hover:text-slate-800 p-2 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
              <span className="text-3xl">📋</span> Giải quyết sự cố
            </h3>

            <div className="space-y-6">
              {/* Type and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-xs font-black tracking-widest uppercase text-slate-400 mb-2">Loại sự cố</span>
                  <span className={`inline-block rounded-full px-3 py-1.5 text-xs font-black tracking-wider uppercase border ${EXCEPTION_BADGE_COLOR[resolvingLog.exceptionType] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                    {EXCEPTION_LABELS[resolvingLog.exceptionType] || resolvingLog.exceptionType}
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="block text-xs font-black tracking-widest uppercase text-slate-400 mb-2">Trạng thái</span>
                  <span className={`inline-block rounded-full px-3 py-1.5 text-xs font-black tracking-wider uppercase border bg-amber-50 text-amber-700 border-amber-200`}>
                    ⏳ Đang xử lý
                  </span>
                </div>
              </div>

              {/* Vehicle info */}
              {resolvingLog.licensePlate && (
                <div>
                  <span className="block text-xs font-bold uppercase text-slate-500 mb-2">Biển số xe</span>
                  <div className="flex items-stretch gap-2">
                    <span className="inline-flex items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-4 py-2 font-mono text-xl font-black tracking-widest text-slate-900 shadow-sm whitespace-nowrap">
                      {resolvingLog.licensePlate}
                    </span>
                    {resolvingLog.vehicleType && (
                      <span className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 shadow-sm whitespace-nowrap">
                        {resolvingLog.vehicleType}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Resolve Form */}
              <form onSubmit={submitResolve} className="space-y-6">
                <div>
                  <span className="block text-xs font-bold uppercase text-slate-500 mb-2">Mô tả chi tiết sự cố</span>
                  <textarea
                    value={resolveForm.resolutionNote}
                    onChange={(e) => setResolveForm({ ...resolveForm, resolutionNote: e.target.value })}
                    rows="4"
                    placeholder="Ghi rõ tình huống xảy ra và cách xử lý..."
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
                  />
                </div>

                <div>
                  <span className="block text-xs font-bold uppercase text-slate-500 mb-2">Đính kèm ảnh minh chứng (Tuỳ chọn)</span>
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                      <button type="button" onClick={startResolveWebcam} disabled={resolvingSubmitting || showResolveWebcam} className="flex-1 rounded-xl border border-dashed border-slate-300 bg-slate-50 py-3 text-sm font-semibold hover:bg-slate-100 transition-colors">📸 Mở Camera</button>
                      <label className="flex-1 cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 py-3 text-center text-sm font-semibold hover:bg-slate-100 transition-colors">
                        <input type="file" accept="image/*" className="hidden" onChange={handleResolveImageUpload} disabled={resolvingSubmitting} multiple />
                        🖼️ Chọn ảnh
                      </label>
                    </div>

                    {showResolveWebcam && (
                      <div className="mt-2 flex flex-col gap-3">
                        <div className="relative rounded-xl overflow-hidden border-2 border-slate-800 bg-black aspect-video flex flex-col shadow-lg">
                          <video ref={resolveVideoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                        </div>
                        <div className="flex justify-center gap-3">
                          <button type="button" onClick={stopResolveWebcam} className="rounded-xl bg-slate-200 text-slate-700 px-6 py-3.5 text-sm font-bold flex-1">Hủy</button>
                          <button type="button" onClick={captureResolveImage} className="rounded-xl bg-red-600 text-white px-6 py-3.5 text-sm font-bold flex-1">📸 Chụp</button>
                        </div>
                      </div>
                    )}

                    {resolveForm.selectedFiles.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {resolveForm.selectedFiles.map((file, idx) => (
                          <div key={idx} className="relative inline-block rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                            <img src={file.preview} alt={`Preview ${idx + 1}`} className="h-24 w-auto object-cover" />
                            <button type="button" onClick={() => handleRemoveResolveImage(idx)} disabled={resolvingSubmitting} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors">X</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 flex gap-3">
                  <button type="button" onClick={closeResolveModal} disabled={resolvingSubmitting} className="flex-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3.5 transition-colors shadow-sm">
                    Đóng
                  </button>
                  <button type="submit" disabled={resolvingSubmitting || !resolveForm.resolutionNote.trim()} className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-600">
                    {resolvingSubmitting ? "Đang xử lý..." : "Xác nhận Giải quyết"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
