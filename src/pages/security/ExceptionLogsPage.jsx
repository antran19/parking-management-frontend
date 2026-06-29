import React, { useEffect, useState, useRef } from "react";
import { staffApi } from "../../api/parkingApi";
import { formatLicensePlate, isValidVietnamLicensePlate } from "../../utils/licensePlate";

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

// Panel container — giống hệt các trang khác trong Security
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
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Danh sách loại phương tiện tải từ API thực (không hardcode)
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // State lưu danh sách file ảnh đang chờ upload
  const [selectedFiles, setSelectedFiles] = useState([]);

  // State và Ref cho tính năng Webcam
  const [showWebcam, setShowWebcam] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // State filter để lọc danh sách sự cố
  const [filterType, setFilterType] = useState("all");
  const [searchText, setSearchText] = useState("");

  // Form ghi nhận sự cố mới
  // vehicleTypeId/vehicleTypeName sẽ được set sau khi tải config từ API
  const [form, setForm] = useState({
    exceptionType: "LOST_TICKET",
    description: "",
    sessionId: "",
    licensePlate: "",
    vehicleTypeId: "",
    vehicleTypeName: "",
  });

  // Helper: kiểm tra loại xe hiện tại có phải xe đạp không (dùng name từ API)
  const isBicycle = () => {
    const name = (form.vehicleTypeName || "").toLowerCase();
    return name.includes("đạp") || name.includes("bicycle");
  };

  const handleLicensePlateBlur = () => {
    const formattedPlate = formatLicensePlate(form.licensePlate, form.vehicleTypeName);

    // Kiểm tra ngay khi rời chuột (blur)
    if (!isBicycle() && formattedPlate.trim()) {
      if (!isValidVietnamLicensePlate(formattedPlate)) {
        showToast("Biển số xe không đúng định dạng. Vui lòng kiểm tra lại!", "error");
        setForm(prev => ({ ...prev, licensePlate: "" }));
        return;
      }
    }

    setForm(prev => ({
      ...prev,
      licensePlate: formattedPlate
    }));
  };

  // Lấy danh sách sự cố từ backend
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await staffApi.getSecurityExceptions();
      setLogs(res.data.data || []);
    } catch (err) {
      console.error("Fetch exception logs error:", err);
      showToast(err.response?.data?.message || "Không tải được danh sách sự cố.", "error");
    } finally {
      setLoading(false);
    }
  };

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
          setForm(prev => ({
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
    fetchLogs();
  }, []);

  // Cleanup ObjectURLs khi unmount để tránh rò rỉ bộ nhớ
  useEffect(() => {
    return () => {
      selectedFiles.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, [selectedFiles]);

  // Hàm thêm file vào danh sách chờ
  const handleAddFiles = (files) => {
    if (!files || !files.length) return;
    const newFiles = files.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  // Xử lý upload khi chọn ảnh từ máy tính
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    handleAddFiles(files);
    // Reset input file
    e.target.value = null;
  };

  // --- LOGIC WEBCAM ---
  const startWebcam = async () => {
    setShowWebcam(true);
    try {
      // Yêu cầu quyền camera (ưu tiên camera sau nếu có trên di động)
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
      // Vẽ frame hiện tại của video lên canvas
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      
      // Chuyển canvas thành file ảnh (Blob) và thêm vào danh sách chờ
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `webcam_${Date.now()}.jpg`, { type: "image/jpeg" });
          handleAddFiles([file]);
          stopWebcam(); // Chụp xong tự tắt cam
        }
      }, "image/jpeg", 0.9); // Chất lượng 90%
    }
  };

  // Dọn dẹp stream camera khi người dùng rời khỏi trang
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  // --------------------

  // Xóa ảnh đã chọn (theo index)
  const handleRemoveImage = (indexToRemove) => {
    setSelectedFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[indexToRemove].preview);
      newFiles.splice(indexToRemove, 1);
      return newFiles;
    });
  };

  // Ghi nhận sự cố mới vào DB
  const submitException = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) {
      showToast("Vui lòng nhập mô tả sự cố", "error");
      return;
    }
    if (!isBicycle() && form.licensePlate.trim()) {
      const formattedPlate = formatLicensePlate(form.licensePlate, form.vehicleTypeName);
      if (!isValidVietnamLicensePlate(formattedPlate)) {
        showToast("Biển số xe không đúng định dạng. Vui lòng nhập lại!", "error");
        setForm(prev => ({ ...prev, licensePlate: "" }));
        return;
      }
    }
    if (!user?.id) {
      showToast("Thiếu thông tin người dùng, vui lòng đăng nhập lại.", "error");
      return;
    }

    setSubmitting(true);
    let uploadedUrls = [];

    try {
      // 1. Nếu có ảnh, upload lên Cloudinary TRƯỚC
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
            throw new Error(data.error?.message || "Lỗi khi upload ảnh lên Cloudinary");
          }
        }
      }

      // 2. Gửi data xuống BE
      await staffApi.logSecurityException({
        exceptionType: form.exceptionType,
        description: form.description.trim(),
        sessionId: form.sessionId || null,
        // Gửi biển số đã được format
        ...(form.licensePlate.trim() && { licensePlate: formatLicensePlate(form.licensePlate.trim(), form.vehicleTypeName) }),
        handledByUserId: user.id,
        // Gửi kèm danh sách URL ảnh minh chứng lên BE
        ...(uploadedUrls.length > 0 && { imageUrls: uploadedUrls }),
      });
      // Reset form - giữ lại vehicleTypeId/vehicleTypeName mặc định (loại đầu tiên từ API)
      setForm(prev => ({ ...prev, exceptionType: "LOST_TICKET", description: "", sessionId: "", licensePlate: "" }));
      selectedFiles.forEach(f => URL.revokeObjectURL(f.preview));
      setSelectedFiles([]); // Xóa danh sách ảnh chờ
      showToast("✅ Đã ghi nhận sự cố an ninh", "success");
      fetchLogs();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Ghi nhận sự cố thất bại", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Lọc danh sách sự cố theo type + search text
  const filteredLogs = logs.filter((log) => {
    const matchType = filterType === "all" || log.exceptionType === filterType;
    const matchSearch =
      !searchText ||
      (log.description || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (log.session?.licensePlate || log.licensePlate || "").toLowerCase().includes(searchText.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] mt-8">
      {/* ── Form ghi nhận sự cố mới ── */}
      <Panel title="📝 Ghi nhận sự cố mới">
        <form onSubmit={submitException} className="space-y-4">
          {/* Biển số xe & Loại phương tiện */}
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
                  value={form.vehicleTypeId}
                  onChange={(e) => {
                    const selected = vehicleTypes.find(v => String(v.id) === String(e.target.value));
                    setForm({
                      ...form,
                      vehicleTypeId: e.target.value,
                      vehicleTypeName: selected?.name || "",
                      licensePlate: "", // Xóa biển số khi đổi loại để nhập lại
                    });
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10 transition-all outline-none"
                >
                  {vehicleTypes.map(vt => (
                    <option key={vt.id} value={vt.id}>{vt.name}</option>
                  ))}
                </select>
              )}
            </Field>

            <Field label="Biển số xe (tự động format)">
              <input
                type="text"
                placeholder={isBicycle() ? "Không yêu cầu nhập cho xe đạp" : "VD: 59A1-123.45"}
                value={form.licensePlate}
                onChange={(e) => setForm({ ...form, licensePlate: e.target.value })}
                onBlur={handleLicensePlateBlur}
                disabled={isBicycle()}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10 transition-all outline-none uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </Field>
          </div>
          {/* Loại sự cố */}
          <Field label="Loại sự cố">
            <select
              value={form.exceptionType}
              onChange={(e) => setForm({ ...form, exceptionType: e.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            >
              {Object.entries(EXCEPTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>

          {/* Mô tả — full width */}
          <Field label="Mô tả chi tiết sự cố">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows="5"
              placeholder="Ghi rõ tình huống xảy ra, xe liên quan, cách xử lý ban đầu..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </Field>

          {/* Session ID: full-width */}
          <Field label="ID Phiên gửi xe (tuỳ chọn)">
            <input
              value={form.sessionId}
              onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
              placeholder="Nhập session ID nếu có"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-mono font-medium text-slate-900 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </Field>

          {/* Khu vực đính kèm ảnh sự cố */}
          <Field label="Đính kèm ảnh minh chứng (tuỳ chọn)">
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                {/* Cách 1: Chụp trực tiếp bằng Webcam trên máy tính/laptop */}
                <button 
                  type="button" 
                  onClick={startWebcam} 
                  disabled={submitting || showWebcam}
                  className="flex-1 cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 py-3 text-center transition-colors hover:bg-slate-100 hover:border-slate-400 disabled:opacity-50"
                >
                  <span className="text-sm font-semibold text-slate-600">📸 Mở Camera</span>
                </button>

                {/* Cách 2: Chọn ảnh từ thư viện thiết bị */}
                <label className="flex-1 cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 py-3 text-center transition-colors hover:bg-slate-100 hover:border-slate-400 disabled:opacity-50">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={submitting} multiple />
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
                        disabled={submitting}
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
            disabled={submitting}
            className="w-full rounded-xl bg-red-600 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-red-600/20 hover:bg-red-700 disabled:opacity-60 transition-colors"
          >
            {submitting ? "Đang lưu..." : "Ghi nhận sự cố"}
          </button>
        </form>

        {/* Hướng dẫn nhanh */}
        <div className="mt-6 rounded-xl bg-amber-50 border border-amber-100 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-amber-600 mb-2">📋 Lưu ý</p>
          <ul className="space-y-1 text-xs text-amber-700 font-medium">
            <li>• Ghi nhận ngay khi phát hiện sự cố</li>
            <li>• Biển số và Session ID giúp truy vết qua camera</li>
            <li>• Mọi sự cố đều được lưu vào database thật</li>
          </ul>
        </div>
      </Panel>

      {/* ── Danh sách sự cố đã ghi nhận ── */}
      <Panel title="📋 Danh sách sự cố an ninh">
        {/* Thanh filter + search */}
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Tìm theo mô tả hoặc biển số..."
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-600 outline-none"
          >
            <option value="all">Tất cả loại</option>
            {Object.entries(EXCEPTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Đếm số kết quả */}
        {!loading && (
          <p className="mb-3 text-xs text-slate-400 font-semibold">
            Hiển thị {filteredLogs.length}/{logs.length} sự cố
          </p>
        )}

        {loading ? (
          <div className="py-8 text-center text-sm text-slate-400">Đang tải danh sách sự cố...</div>
        ) : !filteredLogs.length ? (
          <Empty text={searchText || filterType !== "all" ? "Không tìm thấy sự cố phù hợp." : "Chưa có sự cố nào được ghi nhận."} />
        ) : (
          <>
            {/* Desktop-only: table layout (ẩn trên mobile) */}
            <div className="hidden md:block space-y-3 max-h-[560px] overflow-y-auto pr-1">
              {filteredLogs.map((log, idx) => (
                <div
                  key={log.id || idx}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      {/* Loại sự cố với badge màu */}
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border mb-2 ${EXCEPTION_BADGE_COLOR[log.exceptionType] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                        {EXCEPTION_LABELS[log.exceptionType] || log.exceptionType}
                      </span>
                      <p className="text-sm font-medium leading-relaxed text-slate-700">
                        {log.description || "—"}
                      </p>
                      {/* Thumbnail nhiều ảnh minh chứng — Desktop */}
                      {log.imageUrls && log.imageUrls.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {log.imageUrls.map((url, idx) => (
                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="inline-block">
                              <img src={url} alt={`Minh chứng ${idx+1}`} className="h-16 w-16 object-cover rounded-md border border-slate-200 shadow-sm hover:opacity-80 transition-opacity" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Biển số xe nếu có liên kết session hoặc trường riêng */}
                    {(log.session?.licensePlate || log.licensePlate) && (
                      <span className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2 py-1 font-mono text-xs font-black tracking-widest text-slate-900 shadow-sm flex-shrink-0">
                        <span className="mr-1 h-2 w-2 rounded-full bg-blue-600" />
                        {log.session?.licensePlate || log.licensePlate}
                      </span>
                    )}
                  </div>

                  {/* Footer: người xử lý + thời gian */}
                  <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                    <span>Xử lý bởi: {log.handledBy?.fullName || "—"}</span>
                    <span>{formatTime(log.resolvedAt || log.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile-only: card list dạng cuộn dọc */}
            <div className="md:hidden space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {filteredLogs.map((log, idx) => (
                <div
                  key={log.id || idx}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${EXCEPTION_BADGE_COLOR[log.exceptionType] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {EXCEPTION_LABELS[log.exceptionType] || log.exceptionType}
                    </span>
                    {(log.session?.licensePlate || log.licensePlate) && (
                      <span className="inline-flex items-center rounded-md border border-slate-300 bg-white px-2 py-1 font-mono text-xs font-black tracking-widest text-slate-900 shadow-sm flex-shrink-0">
                        <span className="mr-1 h-2 w-2 rounded-full bg-blue-600" />
                        {log.session?.licensePlate || log.licensePlate}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-slate-700">{log.description || "—"}</p>
                  {/* Thumbnail nhiều ảnh minh chứng — Mobile */}
                  {log.imageUrls && log.imageUrls.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {log.imageUrls.map((url, idx) => (
                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="inline-block">
                              <img src={url} alt={`Minh chứng ${idx+1}`} className="h-14 w-14 object-cover rounded-md border border-slate-200 shadow-sm hover:opacity-80 transition-opacity" />
                            </a>
                          ))}
                        </div>
                      )}
                  <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-400">
                    <span>Bởi: {log.handledBy?.fullName || "—"}</span>
                    <span>{formatTime(log.resolvedAt || log.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Panel>
    </div>
  );
}
