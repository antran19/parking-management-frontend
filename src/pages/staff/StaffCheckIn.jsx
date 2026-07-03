import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { staffApi } from "../../api/parkingApi";
import { isValidVietnamLicensePlate, normalizeLicensePlate, LICENSE_PLATE_HINT, formatLicensePlate, getLicensePlateValidationError, getVehicleTypeKey } from "../../utils/licensePlate";
import { getCloudinaryFolder, uploadToCloudinary } from "../../utils/cloudinary";

const IconPrinter = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

/**
 * StaffCheckIn — Trang tác vụ Check-in xe vào bãi của Nhân viên.
 */
export default function StaffCheckIn() {
  // Các state quản lý trạng thái
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [checkInResult, setCheckInResult] = useState(null);
  const [ticketCode, setTicketCode] = useState("");

  // States quản lý preview thông tin check-in trước khi xác nhận lưu
  const [preCheckInResult, setPreCheckInResult] = useState(null);
  const [isPreCheckedIn, setIsPreCheckedIn] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // States cho quét QR đặt chỗ và vé tháng
  const [isQrScanning, setIsQrScanning] = useState(false);
  const [qrMessage, setQrMessage] = useState("Đang chờ quét QR vé...");
  const [scannedTicketInfo, setScannedTicketInfo] = useState(null); // Để hiển thị đối soát
  const [manualTicketCode, setManualTicketCode] = useState(""); // Ô nhập tay dự phòng trong modal
  const qrScannerRef = useRef(null);

  // Tải thông tin check-in dự kiến bằng cách gọi API check-in ở chế độ xem trước (isPreview = true)
  const handleLoadPreCheckIn = async (customPlate = null) => {
    const plate = customPlate !== null ? customPlate : formData.plateNumber;
    const currentVehicleType = vehicleTypes.find(v => v.id === formData.vehicleTypeId)?.name || "";
    const isBicycle = getVehicleTypeKey(currentVehicleType) === "BICYCLE";
    const normalizedPlate = plate ? normalizeLicensePlate(plate) : "";

    if (!isBicycle && !normalizedPlate) {
      setApiError("Vui lòng nhập biển số xe trước khi kiểm tra.");
      return;
    }

    if (!isBicycle) {
      const plateError = getLicensePlateValidationError(normalizedPlate, currentVehicleType);
      if (plateError) {
        setApiError(plateError);
        return;
      }
      const formatted = formatLicensePlate(plate, currentVehicleType);
      setFormData(prev => ({ ...prev, plateNumber: formatted }));
    }

    setIsLoadingPreview(true);
    setApiError("");
    setCheckInResult(null);
    setIsSuccess(false);

    try {
      const res = await staffApi.checkIn({
        licensePlate: normalizedPlate,
        vehicleTypeId: formData.vehicleTypeId,
        gateEntryId: formData.gateEntryId,
        reservationCode: formData.reservationCode || null,
        parkingPassCode: formData.parkingPassCode || null,
        isPreview: true
      });

      const preview = res.data.data;
      setPreCheckInResult(preview);
      setEligibleZones(preview.eligibleZones || []);
      setSelectedZoneId(preview.zoneId || "");
      setIsPreCheckedIn(true);

      setFormData(prev => ({
        ...prev,
        driverType: preview.driverType,
        reservationCode: preview.reservationCode || ""
      }));
    } catch (err) {
      console.error("Lỗi tải thông tin check-in dự kiến:", err);
      const errorMsg = err.response?.data?.message || err.message || "Không thể tải thông tin dự kiến từ backend.";
      setApiError(errorMsg);
      setIsPreCheckedIn(false);
      setPreCheckInResult(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Hàm reset toàn bộ form và trạng thái tải xem trước
  const handleReset = () => {
    setIsSuccess(false);
    setCheckInResult(null);
    setFormData(prev => ({ ...prev, plateNumber: '', reservationCode: '', parkingPassCode: '', notes: '' }));
    setTicketCode("");
    setPreviewPlateUrl("");
    setPreviewFaceUrl("");
    setUploadedPlateUrl("");
    setUploadedFaceUrl("");
    setFaceBlob(null);
    setPlateBlob(null);
    setIsChangingZone(false);
    setEligibleZones([]);
    setSelectedZoneId("");
    setIsPreCheckedIn(false);
    setPreCheckInResult(null);
    setScannedTicketInfo(null);
  };

  // Tự động ẩn thông báo lỗi sau 10 giây
  useEffect(() => {
    if (apiError) {
      const timer = setTimeout(() => setApiError(""), 10000);
      return () => clearTimeout(timer);
    }
  }, [apiError]);

  // States for change zone popup (Stage 1.5)
  const [isChangingZone, setIsChangingZone] = useState(false);
  const [eligibleZones, setEligibleZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [tempZoneId, setTempZoneId] = useState("");
  const [isUpdatingZone, setIsUpdatingZone] = useState(false);
  const [showAllZones, setShowAllZones] = useState(false);

  // States for face camera
  const [isFaceCameraOn, setIsFaceCameraOn] = useState(false);
  const [faceStream, setFaceStream] = useState(null);
  const [previewFaceUrl, setPreviewFaceUrl] = useState("");
  const [uploadedFaceUrl, setUploadedFaceUrl] = useState("");
  const [faceUploading, setFaceUploading] = useState(false);
  const faceVideoRef = useRef(null);

  // States for plate camera
  const [isPlateCameraOn, setIsPlateCameraOn] = useState(false);
  const [plateStream, setPlateStream] = useState(null);
  const [previewPlateUrl, setPreviewPlateUrl] = useState("");
  const [uploadedPlateUrl, setUploadedPlateUrl] = useState("");
  const [plateScanning, setPlateScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState("Camera biển số sẵn sàng");
  const plateVideoRef = useRef(null);
  const canvasRef = useRef(null);

  // States for blobs to defer upload
  const [faceBlob, setFaceBlob] = useState(null);
  const [plateBlob, setPlateBlob] = useState(null);

  // Config bãi xe tải từ Backend
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [gates, setGates] = useState([]);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Widget thời gian realtime phục vụ in vé
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [liveDate, setLiveDate] = useState("");

  // Dữ liệu form Check-in
  const [formData, setFormData] = useState({
    plateNumber: "",
    vehicleTypeId: "",
    gateEntryId: "",
    reservationCode: "",
    parkingPassCode: "",
    driverType: "WALK_IN",
    notes: "",
  });

  // Tự động sinh ticketCode tạm thời khi nhận diện/nhập biển số xe
  useEffect(() => {
    if (formData.plateNumber && !ticketCode) {
      setTicketCode("T_" + Math.floor(100000 + Math.random() * 900000));
    } else if (!formData.plateNumber && ticketCode) {
      setTicketCode("");
    }
  }, [formData.plateNumber]);

  // Tự động tìm loại vé để xác định vé lượt hoặc đặt trước dựa trên biển số xe
  useEffect(() => {
    const checkPlateType = () => {
      const plate = formData.plateNumber;
      if (!plate) {
        setFormData(prev => ({ ...prev, driverType: "WALK_IN", reservationCode: "" }));
        return;
      }

      const cleanPlate = plate.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

      // Kiểm tra đặt chỗ trước (reservation) từ LocalStorage làm giả lập demo
      // Kiểm tra đặt chỗ trước (reservation) từ LocalStorage làm giả lập demo
      const storedBooking = JSON.parse(localStorage.getItem("driver_booking") || "null");
      if (storedBooking) {
        const bookingPlate = (storedBooking.licensePlate || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

        // Lấy loại xe của đặt chỗ
        let bookingVehicleTypeKey = "";
        if (storedBooking.vehicleType) {
          bookingVehicleTypeKey = getVehicleTypeKey(storedBooking.vehicleType);
        } else if (storedBooking.vehicleTypeId) {
          const vtLabel = vehicleTypes.find(v => v.id === storedBooking.vehicleTypeId)?.name || "";
          bookingVehicleTypeKey = getVehicleTypeKey(vtLabel);
        }

        // Lấy loại xe hiện tại đang chọn trên giao diện
        const currentTypeLabel = vehicleTypes.find(v => v.id === formData.vehicleTypeId)?.name || "";
        const currentTypeKey = getVehicleTypeKey(currentTypeLabel);

        // Chỉ khớp đặt chỗ nếu trùng cả biển số VÀ loại xe đang chọn trên màn hình
        if (
          bookingPlate === cleanPlate &&
          bookingVehicleTypeKey === currentTypeKey &&
          (storedBooking.status === "CONFIRMED" || storedBooking.status === "PENDING" || !storedBooking.status)
        ) {
          setFormData(prev => ({
            ...prev,
            driverType: "PRE_BOOKED",
            reservationCode: storedBooking.reservationCode || storedBooking.bookingCode || "BK-DEMO123"
          }));
          return;
        }
      }

      // Default fallback
      setFormData(prev => ({ ...prev, driverType: "WALK_IN", reservationCode: "" }));
    };

    checkPlateType();
  }, [formData.plateNumber, formData.vehicleTypeId, vehicleTypes]);

  // Cleanup camera streams on unmount
  useEffect(() => {
    return () => {
      if (faceStream) {
        faceStream.getTracks().forEach(track => track.stop());
      }
      if (plateStream) {
        plateStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [faceStream, plateStream]);

  // --- CAMERA CHÂN DUNG (FACE CAMERA) ---
  const startFaceCamera = async () => {
    try {
      setIsFaceCameraOn(true);
      setPreviewFaceUrl("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }
      });
      setFaceStream(stream);
      if (faceVideoRef.current) {
        faceVideoRef.current.srcObject = stream;
        faceVideoRef.current.play();
      }
    } catch (err) {
      console.error("Lỗi bật camera mặt:", err);
      alert("Không thể truy cập camera chân dung.");
      setIsFaceCameraOn(false);
    }
  };

  const stopFaceCamera = () => {
    if (faceStream) {
      faceStream.getTracks().forEach(track => track.stop());
      setFaceStream(null);
    }
    setIsFaceCameraOn(false);
  };

  const captureFace = () => {
    if (!faceVideoRef.current) {
      alert("Camera chân dung chưa sẵn sàng!");
      return;
    }
    const video = faceVideoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        alert("Lỗi trích xuất ảnh!");
        return;
      }
      const localUrl = URL.createObjectURL(blob);
      setPreviewFaceUrl(localUrl);
      setFaceBlob(blob);
      setUploadedFaceUrl(""); // Xóa kết quả upload cũ
      stopFaceCamera();
    }, "image/jpeg", 0.6);
  };

  const handleDoubleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setApiError("");

    const isFaceFile = (filename) => {
      const name = filename.toLowerCase();
      const cleanName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return cleanName.includes("an") ||
        cleanName.includes("thien") ||
        cleanName.includes("toan") ||
        cleanName.includes("mat") ||
        cleanName.includes("face") ||
        cleanName.includes("avatar") ||
        cleanName.includes("driver") ||
        cleanName.includes("portrait") ||
        cleanName.includes("nhan_dang") ||
        cleanName.includes("person");
    };

    let faceFile = null;
    let plateFile = null;

    if (files.length === 1) {
      if (isFaceFile(files[0].name)) {
        faceFile = files[0];
      } else {
        plateFile = files[0];
      }
    } else {
      const sortedFaces = files.filter(f => isFaceFile(f.name));
      const sortedPlates = files.filter(f => !isFaceFile(f.name));

      if (sortedFaces.length > 0) faceFile = sortedFaces[0];
      if (sortedPlates.length > 0) plateFile = sortedPlates[0];

      if (!faceFile && !plateFile) {
        faceFile = files[0];
        plateFile = files[1];
      } else if (faceFile && !plateFile) {
        plateFile = files.find(f => f !== faceFile);
      } else if (!faceFile && plateFile) {
        faceFile = files.find(f => f !== plateFile);
      }
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    const ocrToken = import.meta.env.VITE_PLATE_RECOGNIZER_TOKEN;

    const hasCloudinary = cloudName && uploadPreset &&
      cloudName !== "tên_cloud_name_của_bạn" &&
      uploadPreset !== "tên_unsigned_preset_của_bạn";

    // 1. Process Face File
    if (faceFile) {
      const localUrl = URL.createObjectURL(faceFile);
      setPreviewFaceUrl(localUrl);
      setFaceBlob(faceFile);
      setUploadedFaceUrl("");
    }

    // 2. Process Plate File
    if (plateFile) {
      setPlateScanning(true);
      setOcrResult("Đang xử lý ảnh biển số xe...");
      const localUrl = URL.createObjectURL(plateFile);
      setPreviewPlateUrl(localUrl);
      setPlateBlob(plateFile);
      setUploadedPlateUrl("");

      let detectedPlate = "";
      try {
        const hasOcr = ocrToken && ocrToken !== "chuỗi_api_token_của_bạn";
        if (!hasOcr) {
          console.warn("Chưa cấu hình Token OCR. Bỏ qua OCR.");
          setOcrResult("⚠️ Chưa cấu hình Token OCR.");
        } else {
          const ocrData = new FormData();
          ocrData.append("upload", plateFile);
          ocrData.append("regions", "vn");

          const ocrResponse = await fetch("https://api.platerecognizer.com/v1/plate-reader/", {
            method: "POST",
            headers: {
              "Authorization": `Token ${ocrToken.trim()}`,
            },
            body: ocrData,
          });

          if (ocrResponse.ok) {
            const ocrRes = await ocrResponse.json();
            if (ocrRes.results && ocrRes.results.length > 0) {
              detectedPlate = ocrRes.results[0].plate.toUpperCase();
              const cleanPlate = normalizeLicensePlate(detectedPlate);

              let targetType = "ô tô";
              if (cleanPlate.includes("A1") || cleanPlate.includes("B1") || cleanPlate.includes("E1") || cleanPlate.includes("F1")) {
                targetType = "máy";
              }
              const vt = vehicleTypes.find(v => v.name.toLowerCase().includes(targetType));
              const formattedPlate = formatLicensePlate(detectedPlate, targetType);

              setFormData(prev => ({
                ...prev,
                plateNumber: formattedPlate,
                vehicleTypeId: vt?.id || prev.vehicleTypeId,
                driverType: "WALK_IN",
                reservationCode: ""
              }));
              setOcrResult(`✅ Nhận dạng: ${formattedPlate}`);
            } else {
              setOcrResult("⚠️ Không tìm thấy biển số trong ảnh.");
            }
          } else {
            console.error("Plate Recognizer OCR error:", await ocrResponse.text());
            setOcrResult("❌ Lỗi dịch vụ nhận diện.");
          }
        }
      } catch (err) {
        console.error("Lỗi khi nhận diện biển số:", err);
        setOcrResult("❌ Lỗi kết nối dịch vụ OCR.");
      } finally {
        setPlateScanning(false);
      }
    }

    e.target.value = "";
  };

  // --- CAMERA BIỂN SỐ XE (PLATE CAMERA) ---
  const startPlateCamera = async () => {
    try {
      setIsPlateCameraOn(true);
      setPreviewPlateUrl("");
      setOcrResult("Camera hoạt động! Đưa biển số trước cam.");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      setPlateStream(stream);
      if (plateVideoRef.current) {
        plateVideoRef.current.srcObject = stream;
        plateVideoRef.current.play();
      }
    } catch (err) {
      console.error("Lỗi bật camera biển số:", err);
      setOcrResult("❌ Lỗi truy cập Camera.");
      setIsPlateCameraOn(false);
    }
  };

  const stopPlateCamera = () => {
    if (plateStream) {
      plateStream.getTracks().forEach(track => track.stop());
      setPlateStream(null);
    }
    setIsPlateCameraOn(false);
  };

  // --- QUÉT QR VÉ ĐẶT TRƯỚC VÀ VÉ THÁNG (HTML5 QR CODE) ---
  const handleOpenQrScanner = () => {
    setIsQrScanning(true);
    setQrMessage("Đang khởi tạo camera...");
    setScannedTicketInfo(null);
    setManualTicketCode(""); // Reset ô nhập tay
    
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("ticket-checkin-reader");
        qrScannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 20, qrbox: { width: 160, height: 160 } },
          async (decodedText) => {
            handleProcessScannedQr(decodedText);
          },
          () => {}
        );
        setQrMessage("Đặt mã QR vé (Đặt chỗ/Vé tháng) vào khung hình");
      } catch (error) {
        console.error("Lỗi khởi động camera quét QR:", error);
        setQrMessage("Không mở được camera. Bạn có thể tự nhập mã bên dưới.");
      }
    }, 300);
  };

  const handleCloseQrScanner = async () => {
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.stop();
        qrScannerRef.current.clear();
      } catch (e) {
        console.warn("Lỗi khi tắt camera quét QR:", e);
      }
      qrScannerRef.current = null;
    }
    setIsQrScanning(false);
  };

  const handleProcessScannedQr = async (qrText) => {
    if (!qrText) return;
    const cleanedCode = qrText.trim().toUpperCase();

    // 1. Dừng camera và đóng modal ngay
    await handleCloseQrScanner();

    const isReservation = cleanedCode.startsWith("RS");
    const isPass = cleanedCode.startsWith("PP");

    if (!isReservation && !isPass) {
      // Thử parse xem có phải JSON chứa booking code không
      try {
        const data = JSON.parse(qrText);
        if (data.reservationCode || data.bookingCode) {
          const code = data.reservationCode || data.bookingCode;
          setFormData(prev => ({
            ...prev,
            reservationCode: code,
            parkingPassCode: "",
            driverType: "PRE_BOOKED"
          }));
          setTimeout(() => {
            handleProcessScannedQr(code);
          }, 300);
          return;
        }
      } catch (e) {}

      // Báo lỗi không đúng định dạng vé và dừng xử lý
      setApiError("Mã vé không hợp lệ! Vui lòng nhập hoặc quét đúng mã đặt giữ chỗ (RS-) hoặc vé tháng (PP-).");
      return;
    }

    // Gọi API đối soát check-in preview chính thức
    try {
      setIsLoadingPreview(true);
      setApiError("");
      
      const payload = {
        licensePlate: formData.plateNumber || "",
        vehicleTypeId: formData.vehicleTypeId,
        gateEntryId: formData.gateEntryId,
        reservationCode: isReservation ? cleanedCode : null,
        parkingPassCode: isPass ? cleanedCode : null,
        isPreview: true
      };

      const res = await staffApi.checkIn(payload);
      const preview = res.data.data;

      setFormData(prev => ({
        ...prev,
        plateNumber: preview.licensePlate || prev.plateNumber,
        vehicleTypeId: preview.vehicleTypeId || prev.vehicleTypeId,
        reservationCode: preview.reservationCode || (isReservation ? cleanedCode : ""),
        parkingPassCode: isPass ? cleanedCode : "",
        driverType: preview.driverType
      }));

      setPreCheckInResult(preview);
      setEligibleZones(preview.eligibleZones || []);
      setSelectedZoneId(preview.zoneId || "");
      setIsPreCheckedIn(true);

      setScannedTicketInfo({
        type: preview.driverType,
        code: isReservation ? (preview.reservationCode || cleanedCode) : (preview.parkingPassCode || cleanedCode),
        licensePlate: preview.licensePlate,
        vehicleTypeName: preview.vehicleType,
        customerName: preview.customerName || "Khách hàng",
        zoneName: preview.zoneName ? `${preview.floorName} - ${preview.zoneName}` : null
      });

    } catch (err) {
      console.error("Lỗi đối soát vé từ API checkin:", err);
      const errorMsg = err.response?.data?.message || err.message || "Lỗi kết nối đối soát.";
      setApiError(errorMsg);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const capturePlateAndOcr = () => {
    if (!plateVideoRef.current) {
      setOcrResult("⚠️ Thiết bị chưa sẵn sàng!");
      return;
    }
    setPlateScanning(true);
    setOcrResult("AI đang phân tích biển số...");

    const video = plateVideoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setOcrResult("❌ Lỗi trích xuất ảnh.");
        setPlateScanning(false);
        return;
      }
      const localUrl = URL.createObjectURL(blob);
      setPreviewPlateUrl(localUrl);
      setPlateBlob(blob);
      setUploadedPlateUrl(""); // Clear
      stopPlateCamera();

      try {
        const ocrToken = import.meta.env.VITE_PLATE_RECOGNIZER_TOKEN;
        const hasOcr = ocrToken && ocrToken !== "chuỗi_api_token_của_bạn";

        if (!hasOcr) {
          console.warn("Chưa cấu hình Plate Recognizer Token.");
          setOcrResult("⚠️ Chưa cấu hình Token OCR.");
        } else {
          const ocrData = new FormData();
          ocrData.append("upload", blob, "captured_plate.jpg");
          ocrData.append("regions", "vn");

          const ocrResponse = await fetch("https://api.platerecognizer.com/v1/plate-reader/", {
            method: "POST",
            headers: {
              "Authorization": `Token ${ocrToken.trim()}`,
            },
            body: ocrData,
          });

          if (ocrResponse.ok) {
            const ocrRes = await ocrResponse.json();
            if (ocrRes.results && ocrRes.results.length > 0) {
              const resultObj = ocrRes.results[0];
              const detectedPlate = resultObj.plate.toUpperCase();

              // Lấy loại xe đang chọn hiện tại trên giao diện để định dạng
              const currentTypeLabel = vehicleTypes.find(v => v.id === formData.vehicleTypeId)?.name || "";
              const formattedPlate = formatLicensePlate(detectedPlate, currentTypeLabel);

              setFormData(prev => ({
                ...prev,
                plateNumber: formattedPlate,
                driverType: "WALK_IN",
                reservationCode: ""
              }));
              setOcrResult(`✅ Nhận dạng: ${formattedPlate}`);
              handleLoadPreCheckIn(formattedPlate);
            } else {
              setOcrResult("⚠️ Không tìm thấy biển số xe.");
            }
          } else {
            const errText = await ocrResponse.text();
            console.error("Plate Recognizer OCR error:", errText);
            setOcrResult("❌ Lỗi dịch vụ nhận diện.");
          }
        }
      } catch (err) {
        console.error("Lỗi khi nhận diện biển số:", err);
        setOcrResult("❌ Lỗi kết nối dịch vụ OCR.");
      } finally {
        setPlateScanning(false);
      }
    }, "image/jpeg", 0.6);
  };

  // Hàm mô phỏng quét biển số dùng cho Demo nhanh không cần webcam
  const handleOcrScan = (vehicleTypeChoice) => {
    setPlateScanning(true);
    setOcrResult("Đang phân tích giả lập...");
    setPreviewPlateUrl("");
    stopPlateCamera();

    setTimeout(() => {
      let plate = "30G-888.88";
      let mockImageUrl = "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=400";

      if (vehicleTypeChoice === "motorbike") {
        plate = "59A1-999.99";
        mockImageUrl = "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=400";
      }

      // Lấy loại xe đang chọn hiện tại trên giao diện để định dạng
      const currentTypeLabel = vehicleTypes.find(v => v.id === formData.vehicleTypeId)?.name || "";
      const formattedPlate = formatLicensePlate(plate, currentTypeLabel);

      setFormData(prev => ({
        ...prev,
        plateNumber: formattedPlate,
        driverType: "WALK_IN",
        reservationCode: ""
      }));

      setPreviewPlateUrl(mockImageUrl);
      setUploadedPlateUrl(mockImageUrl);

      if (!previewFaceUrl) {
        setPreviewFaceUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400");
        setUploadedFaceUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400");
      }

      setPlateScanning(false);
      setOcrResult(`✅ Nhận diện giả lập: ${formattedPlate}`);
      handleLoadPreCheckIn(formattedPlate);
    }, 1000);
  };

  // Tải cấu hình bãi xe lúc mở trang
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await staffApi.getParkingConfig();
        const config = res.data.data;
        setVehicleTypes(config.vehicleTypes || []);

        // Chỉ lấy các cổng vào để check-in
        const entryGates = (config.gates || []).filter(g => g.gateType === 'MAIN_ENTRY' || g.gateType === 'MAIN_BOTH');
        setGates(entryGates);

        if (config.vehicleTypes?.length > 0) {
          setFormData(prev => ({ ...prev, vehicleTypeId: config.vehicleTypes[0].id }));
        }
        const firstActiveGate = entryGates.find(g => g.isActive) || entryGates[0];
        if (firstActiveGate) {
          setFormData(prev => ({ ...prev, gateEntryId: firstActiveGate.id }));
        }
        setConfigLoaded(true);
      } catch (err) {
        console.error('Failed to load parking config:', err);
        setApiError('Không thể tải cấu hình bãi xe từ máy chủ backend. Vui lòng kiểm tra kết nối API.');
      }
    };
    fetchConfig();
  }, []);

  // Cài đặt đồng hồ hiển thị realtime
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setLiveDate(today.toLocaleDateString('vi-VN', options));

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Xử lý gửi API Check-in lên Java Spring Boot Backend
  const handleCheckIn = async () => {
    const currentVehicleType = vehicleTypes.find(v => v.id === formData.vehicleTypeId)?.name || "";
    // Sử dụng hàm getVehicleTypeKey đã chuẩn hóa để phát hiện đúng loại xe đạp (hỗ trợ cả tiếng Anh và tiếng Việt)
    const isBicycle = getVehicleTypeKey(currentVehicleType) === "BICYCLE";

    const normalizedPlate = formData.plateNumber ? normalizeLicensePlate(formData.plateNumber) : "";

    if (!isBicycle && !normalizedPlate) {
      setApiError('Vui lòng cung cấp biển số xe');
      return;
    }

    if (!isBicycle) {
      const plateError = getLicensePlateValidationError(normalizedPlate, currentVehicleType);
      if (plateError) {
        setApiError(plateError);
        return;
      }
      // Tự động định dạng lại hiển thị trong ô nhập liệu
      setFormData(prev => ({ ...prev, plateNumber: formatLicensePlate(formData.plateNumber, currentVehicleType) }));
    }

    if (!formData.vehicleTypeId || !formData.gateEntryId) {
      setApiError('Vui lòng chọn loại xe và cổng vào tương ứng');
      return;
    }

    setIsSubmitting(true);
    setApiError('');

    try {
      // Gọi API tạo Session trước mà chưa có URL ảnh
      const requestData = {
        licensePlate: normalizedPlate,
        vehicleTypeId: formData.vehicleTypeId,
        gateEntryId: formData.gateEntryId,
        reservationCode: formData.reservationCode || null,
        parkingPassCode: formData.parkingPassCode || null,
        driverType: formData.driverType,
        notes: formData.notes || null,
        zoneId: selectedZoneId || null
      };

      const res = await staffApi.checkIn(requestData);
      const backendSession = res.data.data;
      setCheckInResult(backendSession);
      setTicketCode(backendSession.sessionCode);
      setIsSuccess(true);
      setIsPreCheckedIn(false);
      setPreCheckInResult(null);

      // SAU KHI THÀNH CÔNG: Upload ảnh lên Cloudinary (chạy song song)
      let finalFaceUrl = uploadedFaceUrl;
      let finalPlateUrl = uploadedPlateUrl;
      let needUpdate = false;

      const uploadTasks = [];

      if (faceBlob && !finalFaceUrl) {
        const faceUploadTask = uploadToCloudinary(faceBlob, true, false)
          .then(url => {
            if (url) { finalFaceUrl = url; setUploadedFaceUrl(url); needUpdate = true; }
          })
          .catch(err => console.error("Lỗi upload ảnh mặt:", err));
        uploadTasks.push(faceUploadTask);
      }

      if (plateBlob && !finalPlateUrl) {
        const plateUploadTask = uploadToCloudinary(plateBlob, true, true)
          .then(url => {
            if (url) { finalPlateUrl = url; setUploadedPlateUrl(url); needUpdate = true; }
          })
          .catch(err => console.error("Lỗi upload ảnh biển số:", err));
        uploadTasks.push(plateUploadTask);
      }

      // Đợi cả 2 ảnh upload xong cùng lúc
      if (uploadTasks.length > 0) {
        await Promise.all(uploadTasks);
      }

      // Gọi API cập nhật ảnh nếu có thay đổi
      if (needUpdate) {
        await staffApi.updateSessionImages(backendSession.sessionId, {
          plateUrl: finalPlateUrl,
          faceUrl: finalFaceUrl,
          isEntry: true
        }).catch(err => console.error("Lỗi gọi API cập nhật Session Images:", err));
      }

      // Đồng bộ thông tin lưu trữ local cho tab Driver lập tức để tiện demo
      if (backendSession) {
        const realSlot = (backendSession.floorName && backendSession.zoneCode)
          ? `${backendSession.floorName}-ZONE-${backendSession.zoneCode}`
          : `ZONE-${backendSession.sessionCode || "UNKNOWN"}`;
        const realFloor = backendSession.floorName
          ? `Tầng ${backendSession.floorName}`
          : "Tầng chưa xác định";

        const sessionData = {
          slot: realSlot,
          floor: realFloor,
          area: backendSession.zoneName || "Khu vực đỗ xe",
          vehicle: backendSession.vehicleType || "Phương tiện",
          startTime: new Date(backendSession.entryTime || Date.now()).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + " hôm nay",
          estimatedFee: backendSession.totalFee || 35000,
          status: "Đang gửi xe",
          buildingName: "Tòa Nhà FPT Landmark",
          licensePlate: backendSession.licensePlate,
          createdTimestamp: backendSession.entryTime ? new Date(backendSession.entryTime).getTime() : Date.now()
        };

        localStorage.setItem("driver_session", JSON.stringify(sessionData));

        const storedBooking = JSON.parse(localStorage.getItem("driver_booking") || "null");
        if (storedBooking) {
          localStorage.setItem("driver_booking", JSON.stringify({
            ...storedBooking,
            slot: realSlot,
            floor: realFloor,
            status: "Đã đỗ xe thành công"
          }));
        }
      }
    } catch (err) {
      console.error("Backend check-in error:", err);
      const errorMsg = err.response?.data?.message || err.message || "Không thể kết nối với dịch vụ backend.";
      setApiError(`Check-in thất bại: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChangeZone = async () => {
    if (!checkInResult?.sessionId) return;
    setIsChangingZone(true);
    setShowAllZones(false);
    setApiError('');
    try {
      const res = await staffApi.getEligibleZones(checkInResult.sessionId);
      const zones = res.data.data || [];
      setEligibleZones(zones);
      if (zones.length > 0) {
        const firstSelectable = zones.find(z => z.isSelectable);
        const zId = firstSelectable ? (firstSelectable.zoneId || "") : (zones[0].zoneId || "");
        setSelectedZoneId(zId);
        setTempZoneId(zId);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách phân khu khả dụng:", err);
      const errorMsg = err.response?.data?.message || err.message || "Không thể lấy danh sách phân khu.";
      setApiError(`Lỗi: ${errorMsg}`);
      setIsChangingZone(false);
    }
  };

  const handleConfirmChangeZone = async (zoneIdToApply = tempZoneId) => {
    if (!checkInResult?.sessionId || !zoneIdToApply) return;
    setIsUpdatingZone(true);
    setApiError('');
    try {
      const res = await staffApi.changeZone(checkInResult.sessionId, zoneIdToApply);
      const updatedSession = res.data.data;

      setCheckInResult(updatedSession);
      setTicketCode(updatedSession.sessionCode);
      setSelectedZoneId(zoneIdToApply);

      if (updatedSession) {
        const realSlot = (updatedSession.floorName && updatedSession.zoneCode)
          ? `${updatedSession.floorName}-ZONE-${updatedSession.zoneCode}`
          : `ZONE-${updatedSession.sessionCode || "UNKNOWN"}`;
        const realFloor = updatedSession.floorName
          ? `Tầng ${updatedSession.floorName}`
          : "Tầng chưa xác định";

        const sessionData = {
          slot: realSlot,
          floor: realFloor,
          area: updatedSession.zoneName || "Khu vực đỗ xe",
          vehicle: updatedSession.vehicleType || "Phương tiện",
          startTime: new Date(updatedSession.entryTime || Date.now()).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + " hôm nay",
          estimatedFee: updatedSession.totalFee || 35000,
          status: "Đang gửi xe",
          buildingName: "Tòa Nhà FPT Landmark",
          licensePlate: updatedSession.licensePlate,
          createdTimestamp: updatedSession.entryTime ? new Date(updatedSession.entryTime).getTime() : Date.now()
        };

        localStorage.setItem("driver_session", JSON.stringify(sessionData));

        const storedBooking = JSON.parse(localStorage.getItem("driver_booking") || "null");
        if (storedBooking) {
          localStorage.setItem("driver_booking", JSON.stringify({
            ...storedBooking,
            slot: realSlot,
            floor: realFloor,
            status: "Đã đỗ xe thành công"
          }));
        }
      }

      setIsChangingZone(false);
      setShowAllZones(false);
    } catch (err) {
      console.error("Lỗi thay đổi phân khu:", err);
      const errorMsg = err.response?.data?.message || err.message || "Không thể thay đổi phân khu.";
      setApiError(`Thay đổi phân khu thất bại: ${errorMsg}`);
    } finally {
      setIsUpdatingZone(false);
    }
  };



  const getVehicleLabel = (typeId) => {
    const vt = vehicleTypes.find(v => v.id === typeId);
    return vt ? vt.name : 'Không xác định';
  };

  const handlePrintTicket = () => {
    const printWindow = window.open("", "_blank", "width=600,height=600");
    if (!printWindow) {
      alert("Vui lòng cho phép trình duyệt mở popup để in vé!");
      return;
    }

    const activeGateName = gates.find(g => g.id === formData.gateEntryId)?.gateName || "Cổng vào";

    const resCode = checkInResult?.reservationCode || formData.reservationCode;
    const resCodeRow = resCode ? `
      <div class="info-row" style="color: #4f46e5;">
        <span>Mã đặt chỗ:</span>
        <span class="info-value">${resCode}</span>
      </div>
    ` : '';

    const customerName = checkInResult?.customerName;
    const customerRow = customerName ? `
      <div class="info-row">
        <span>Khách hàng:</span>
        <span class="info-value">${customerName}</span>
      </div>
    ` : '';

    const ticketType = checkInResult
      ? (checkInResult.driverType === "SUBSCRIBER"
        ? `Vé đăng ký (${checkInResult.passType === "MONTHLY" ? "Tháng" : checkInResult.passType === "QUARTERLY" ? "Quý" : "Năm"})`
        : checkInResult.driverType === "PRE_BOOKED"
          ? "Vé đặt trước"
          : "Vé lượt")
      : "---";

    const ticketHtml = `
      <html>
        <head>
          <title>In Vé Xe - SmartParking</title>
          <style>
            body {
              font-family:  Consolas, 'Courier New', monospace;
              text-align: center;
              padding: 20px;
              color: #333;
              background: #fff;
            }
            .ticket-container {
              border: 2px dashed #444; /* Viền nét đứt màu xám đậm */
              padding: 20px;
              display: inline-block;
              width: 280px;
            }
            .header {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
              letter-spacing: 2px;
            }
            .subtitle {
              font-size: 11px;
              margin-bottom: 15px;
              text-transform: uppercase;
              font-weight: 600;
            }
            .qr-code {
              margin: 15px auto;
              width: 150px;
              height: 150px;
              opacity: 0.9; /* Giảm độ tương phản của QR code một chút */
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              margin: 5px 0;
              border-bottom: 1px dotted #bbb;
              padding-bottom: 3px;
              font-weight: 600;
            }
            .info-value {
              font-weight: 600;
            }
            .footer {
              font-size: 10px;
              margin-top: 15px;
              border-top: 1px dashed #444;
              padding-top: 10px;
             
            }
          </style>
        </head>
        <body>
          <div class="ticket-container">
            <div class="header">SMART PARKING TICKET</div>
            <div class="subtitle">Vé gửi xe vào</div>
            <div class="subtitle" style="margin-top: -10px;">Cổng: ${checkInResult?.gateEntryName || activeGateName}</div>
            <img class="qr-code" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticketCode}" />
            <div class="info-row">
              <span>Mã vé:</span>
              <span class="info-value">${ticketCode}</span>
            </div>
            <div class="info-row">
              <span>Biển số xe:</span>
              <span class="info-value">${formatLicensePlate(checkInResult?.licensePlate || formData.plateNumber, checkInResult?.vehicleType || getVehicleLabel(formData.vehicleTypeId)) || "---"}</span>
            </div>
            <div class="info-row">
              <span>Phương tiện:</span>
              <span class="info-value">${checkInResult?.vehicleType || getVehicleLabel(formData.vehicleTypeId)}</span>
            </div>
            <div class="info-row">
              <span>Loại vé:</span>
              <span class="info-value">${ticketType}</span>
            </div>
            ${resCodeRow}
            <div class="info-row">
              <span>Vị trí đỗ:</span>
              <span class="info-value">${checkInResult ? `${checkInResult.floorName} - ${checkInResult.zoneName}` : "(Sẽ phân bổ sau)"}</span>
            </div>
            <div class="info-row">
              <span>Thời gian vào:</span>
              <span class="info-value">${new Date(checkInResult?.entryTime || Date.now()).toLocaleString("vi-VN")}</span>
            </div>
            ${customerRow}
            <div class="footer">
              Cảm ơn quý khách đã sử dụng dịch vụ!<br/>
              Hotline hỗ trợ: 1900 8888<br/>
              Vui lòng bảo quản vé cẩn thận.
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
    `;
    printWindow.document.write(ticketHtml);
    printWindow.document.close();
  };

  return (
    <section className="flex-1 space-y-6 p-1">
      {/* Thông báo lỗi hiển thị nổi */}
      {apiError && (
        <div className="fixed top-17 left-1/2 -translate-x-1/2 z-[100] flex items-center justify-between gap-3 rounded-3xl bg-rose-50 border border-rose-200 px-6 py-3 text-sm font-bold text-rose-700 shadow-2xl min-w-[400px] max-w-[90vw] animate-pulse">
          <span className="flex items-center gap-2">⚠️ {apiError}</span>
          <button
            onClick={() => setApiError("")}
            className="text-rose-450 hover:text-rose-600 transition-colors font-bold text-xl leading-none cursor-pointer ml-4"
          >
            &times;
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Cột trái (Máy quét camera và thông tin đầu vào) */}
        <div className="space-y-4 lg:col-span-9 flex flex-col">

          {/* Bảng Camera Điều khiển & Đối soát CCTV 2 Cột */}
          <div className="rounded-2xl shadow-sm overflow-hidden flex flex-col shrink-0 max-w-[1045px] w-full">

            {/* Lưới 2 Cột dính liền khép kín */}
            <div className="grid grid-cols-2 gap-[2px] p-[2px]">

              {/* CỘT 1: CHỤP CHÂN DUNG */}
              <div className="flex flex-col gap-[2px] h-full justify-between">
                {/* Vùng Camera / Ảnh Preview */}
                <div className="relative bg-slate-50 aspect-[4/3] flex items-center justify-center overflow-hidden shrink-0">
                  {previewFaceUrl ? (
                    <img src={previewFaceUrl} alt="Chân dung lúc vào" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <video
                        ref={faceVideoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                        style={{ display: isFaceCameraOn ? "block" : "none" }}
                      />
                      {!isFaceCameraOn && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-700 text-center p-2">
                          <svg className="text-slate-500 w-7 h-7 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <circle cx="12" cy="13" r="3" />
                          </svg>
                          <p className="font-extrabold text-white text-[9px] tracking-wider uppercase">CAM CHÂN DUNG TẮT</p>
                        </div>
                      )}
                    </>
                  )}

                  {faceUploading && (
                    <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center text-center p-4 z-10">
                      <p className="font-mono font-bold text-indigo-400 tracking-wider text-xs animate-pulse">[ ĐANG LƯU ẢNH... ]</p>
                    </div>
                  )}

                  <span className="absolute top-2 left-2 text-white font-black text-[9px] px-1.5 py-0.5 rounded  tracking-wider">
                    CAM 1: CHÂN DUNG
                  </span>
                </div>

                {/* Điều khiển Cột 1 */}
                <div className="bg-slate-50 p-3 flex flex-col gap-2 mt-auto min-h-[80px] justify-center">
                  <div className="flex gap-1 justify-center">
                    <button
                      type="button"
                      onClick={isFaceCameraOn ? stopFaceCamera : startFaceCamera}
                      className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase transition-all cursor-pointer ${isFaceCameraOn ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'}`}
                    >
                      {isFaceCameraOn ? 'Tắt' : 'Bật'}
                    </button>
                    <button
                      type="button"
                      onClick={captureFace}
                      disabled={!isFaceCameraOn || faceUploading}
                      className="flex-1 bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white py-1.5 rounded text-[10px] font-black uppercase transition-all cursor-pointer"
                    >
                      Chụp ảnh
                    </button>
                    <button
                      type="button"
                      onClick={async () => { stopFaceCamera(); setPreviewFaceUrl(""); setUploadedFaceUrl(""); await startFaceCamera(); }}
                      className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-1.5 rounded text-[10px] font-black uppercase transition-all cursor-pointer"
                    >
                      Bỏ qua
                    </button>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1.5 mt-0.5">

                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 rounded border border-indigo-200 transition-all text-[8px] font-black uppercase active:scale-[0.98] shadow-sm">
                      <svg className="w-3.5 h-3.5 text-indigo-650" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Tải ảnh (Face & Plate)
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleDoubleUpload}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* CỘT 2: CHỤP BIỂN SỐ XE */}
              <div className="flex flex-col gap-[2px] h-full justify-between">
                {/* Vùng Camera / Ảnh Preview */}
                <div className="relative bg-slate-50 aspect-[4/3] flex items-center justify-center overflow-hidden shrink-0">
                  {previewPlateUrl ? (
                    <img src={previewPlateUrl} alt="Xe lúc vào" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <video
                        ref={plateVideoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                        style={{ display: isPlateCameraOn ? "block" : "none" }}
                      />
                      {!isPlateCameraOn && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-700 text-center p-2">
                          <svg className="text-slate-500 w-7 h-7 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2m10 0h2a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M5 12h14" />
                          </svg>
                          <p className="font-extrabold text-white text-[9px] tracking-wider uppercase">CAM BIỂN SỐ TẮT</p>
                        </div>
                      )}
                    </>
                  )}

                  {plateScanning && (
                    <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center text-center p-4 z-10 animate-fade-in">
                      <p className="font-mono font-bold text-indigo-400 tracking-wider text-xs animate-pulse">[ ĐANG NHẬN DIỆN & LƯU... ]</p>
                    </div>
                  )}

                  <span className="absolute top-2 left-2 text-white font-black text-[9px] px-1.5 py-0.5 rounded  tracking-wider">
                    CAM 2: BIỂN SỐ XE
                  </span>
                </div>

                {/* Điều khiển Cột 2 */}
                <div className="bg-slate-50 p-3 flex flex-col gap-2 mt-auto min-h-[80px] justify-center">
                  <div className="flex gap-1 justify-center">
                    <button
                      type="button"
                      onClick={isPlateCameraOn ? stopPlateCamera : startPlateCamera}
                      className={`flex-1 py-1.5 rounded text-[10px] font-black uppercase transition-all cursor-pointer ${isPlateCameraOn ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'}`}
                    >
                      {isPlateCameraOn ? 'Tắt' : 'Bật'}
                    </button>
                    <button
                      type="button"
                      onClick={capturePlateAndOcr}
                      disabled={!isPlateCameraOn || plateScanning}
                      className="flex-1 bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white py-1.5 rounded text-[10px] font-black uppercase transition-all cursor-pointer"
                    >
                      Chụp & Quét
                    </button>
                    <button
                      type="button"
                      onClick={async () => { stopPlateCamera(); setPreviewPlateUrl(""); setOcrResult("Camera sẵn sàng"); setFormData(prev => ({ ...prev, plateNumber: "" })); await startPlateCamera(); }}
                      className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-1.5 rounded text-[10px] font-black uppercase transition-all cursor-pointer"
                    >
                      Bỏ qua
                    </button>
                  </div>

                  {/* Cụm nhập nhanh hoặc giả lập */}
                  <div className="flex gap-10 items-center mt-0.5 h-[22px]">
                    <input
                      placeholder="Nhập biển số..."
                      value={formData.plateNumber}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, plateNumber: val });
                        // Reset trạng thái xem trước khi thay đổi biển số xe
                        setIsPreCheckedIn(false);
                        setPreCheckInResult(null);
                        setSelectedZoneId("");
                        setEligibleZones([]);
                      }}
                      onBlur={(e) => {
                        const val = e.target.value;
                        if (!val) return;

                        const currentTypeLabel = vehicleTypes.find(v => v.id === formData.vehicleTypeId)?.name || "";
                        setFormData({
                          ...formData,
                          plateNumber: formatLicensePlate(val, currentTypeLabel)
                        });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleLoadPreCheckIn();
                        }
                      }}
                      className="flex-1 rounded border border-slate-250 bg-white px-2 py-0.5 text-[9px] font-bold text-slate-800 uppercase outline-none focus:border-indigo-500 transition-all min-w-[60px]"
                    />
                    <button
                      type="button"
                      onClick={handleOpenQrScanner}
                      className="px-5 py-4 bg-slate-400 hover:bg-indigo-600 text-black rounded text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 flex items-center gap-1 shadow-sm h-[20px] active:scale-[0.98]"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m0 14v1m8-9h-1m-14 0H3m2 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v2a2 2 0 002 2zM17 11h2a2 2 0 002-2V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM5 19h2a2 2 0 002-2v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2a2 2 0 002 2zM19 19a2 2 0 01-2-2v-2a2 2 0 00-2-2h-2m4 4v1" />
                      </svg>
                      Quét QR Vé
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>



          {/* Form chọn loại xe & cổng vào bên dưới camera */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 mb-1.5">Loại xe</label>
                <select
                  value={formData.vehicleTypeId}
                  onChange={(e) => {
                    setFormData({ ...formData, vehicleTypeId: e.target.value });
                    // Reset trạng thái xem trước khi đổi loại xe
                    setIsPreCheckedIn(false);
                    setPreCheckInResult(null);
                    setSelectedZoneId("");
                    setEligibleZones([]);
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 bg-white cursor-pointer shadow-sm font-sans"
                >
                  {vehicleTypes.map(vt => (
                    <option key={vt.id} value={vt.id}>{vt.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 mb-1.5">Cổng vào</label>
                <select
                  value={formData.gateEntryId}
                  onChange={(e) => {
                    setFormData({ ...formData, gateEntryId: e.target.value });
                    // Reset trạng thái xem trước khi đổi cổng
                    setIsPreCheckedIn(false);
                    setPreCheckInResult(null);
                    setSelectedZoneId("");
                    setEligibleZones([]);
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 bg-white cursor-pointer shadow-sm font-sans"
                >
                  {gates.map(g => (
                    <option key={g.id} value={g.id} disabled={!g.isActive}>
                      {g.gateName}{g.isActive ? "" : " (BẢO TRÌ)"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 mb-1.5">Ghi chú</label>
              <input
                value={formData.notes || ""}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Ghi chú thêm (nếu có)..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 bg-white shadow-sm font-sans"
              />
            </div>
          </div>

        </div>

        {/* Cột phải (Vé thanh toán) - chiếm 3 cột (25%) */}
        <div className="space-y-2 lg:col-span-3 flex flex-col">

          {/* Vị trí đỗ gợi ý luôn hiển thị */}
          {/* Vị trí đỗ gợi ý luôn hiển thị */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-2.5 shadow-xs flex-shrink-0 relative">
            <p className="font-bold text-emerald-900 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-sans">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Vị trí đề xuất:
                <span className="font-black text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded ml-1 font-sans">
                  {checkInResult
                    ? `${checkInResult.floorName} - ${checkInResult.zoneName}`
                    : (isPreCheckedIn && selectedZoneId
                      ? (() => {
                        const z = eligibleZones.find(x => x.zoneId === selectedZoneId);
                        return z ? `${z.floorName} - ${z.zoneName}` : "Chờ phân khu...";
                      })()
                      : "Chờ thông tin xe..."
                    )
                  }
                </span>
              </span>
              {!isSuccess && isPreCheckedIn && !isChangingZone && (
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingZone(true);
                    setTempZoneId(selectedZoneId);
                    setShowAllZones(false);
                    setApiError('');
                  }}
                  className="text-xs font-black text-yellow-600 hover:text-yellow-800 bg-white hover:bg-yellow-200 border border-yellow-300 px-2 py-1.5 rounded transition-all cursor-pointer shadow-sm font-sans"
                >
                  Đổi
                </button>
              )}
            </p>

            {/* Dropdown panel positioned absolutely, overlaying on top of the ticket below */}
            {isChangingZone && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-slate-200 shadow-lg p-3 z-30 flex flex-col gap-2.5 animate-fade-in">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-600 mb-2 font-sans">Chọn phân khu đỗ xe</label>
                  {eligibleZones.length === 0 ? (
                    <div className="text-center py-2 text-xs font-bold text-slate-455 bg-slate-50 rounded border border-slate-200 font-sans">
                      Không tìm thấy phân khu trống khả dụng cho loại xe này
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {(showAllZones ? eligibleZones : eligibleZones.slice(0, 3)).map((zone) => {
                        const capacity = zone.capacity || 0;
                        const current = zone.currentCount || 0;
                        const reserved = zone.reservedCount || 0;
                        const occupied = current + reserved;
                        const percent = capacity > 0 ? Math.round((occupied * 100) / capacity) : 0;
                        const isSelected = tempZoneId === zone.zoneId;
                        const isMaintenance = zone.isMaintenance;
                        const isSelectable = zone.isSelectable;

                        let percentBadgeColor = "text-emerald-600 bg-emerald-50 border-emerald-100";
                        if (isMaintenance) {
                          percentBadgeColor = "text-slate-500 bg-slate-100 border-slate-200";
                        } else if (percent >= 90) {
                          percentBadgeColor = "text-rose-600 bg-rose-50 border-rose-100";
                        } else if (percent >= 75) {
                          percentBadgeColor = "text-amber-600 bg-amber-50 border-amber-100";
                        }

                        let buttonStyles = "bg-white hover:bg-slate-50 border-slate-200 text-slate-700";
                        if (isMaintenance) {
                          buttonStyles = "bg-slate-50 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed";
                        } else if (isSelected) {
                          buttonStyles = "bg-indigo-100 border-indigo-700 text-indigo-950 font-black shadow-xs";
                        } else if (!isSelectable) {
                          buttonStyles = "bg-white border-slate-200 text-slate-400 opacity-60 cursor-not-allowed";
                        }

                        return (
                          <button
                            key={zone.zoneId}
                            type="button"
                            onClick={() => isSelectable && !isMaintenance && setTempZoneId(zone.zoneId)}
                            disabled={!isSelectable || isMaintenance}
                            className={`w-full flex items-center justify-between p-1.5 rounded-lg border text-left transition-all font-sans ${buttonStyles}`}
                          >
                            <span className="flex items-center gap-1 font-sans">
                              <span className="inline-flex items-center justify-center text-slate-750 text-[13px] font-black px-1 rounded-sm font-sans">
                                #{zone.priority}
                              </span>
                              <span className="font-semibold text-[13px] font-sans">
                                {zone.floorName} - {zone.zoneName} {isMaintenance ? "(BẢO TRÌ/HỎNG CỔNG)" : ""}
                              </span>
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${percentBadgeColor} font-sans`}>
                              {isMaintenance ? "BẢO TRÌ" : `${percent}% (${occupied}/${capacity})`}
                            </span>
                          </button>
                        );
                      })}

                      {eligibleZones.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setShowAllZones(!showAllZones)}
                          className="mt-1 w-full text-center py-0.5 text-[9px] font-bold text-slate-500 hover:text-indigo-800 bg-indigo-50/30 hover:bg-indigo-50 rounded transition-all cursor-pointer font-sans"
                        >
                          {showAllZones ? "Thu gọn ▲" : `Xem thêm ▼`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 justify-end border-t border-slate-100 pt-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingZone(false);
                      setShowAllZones(false);
                    }}
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-300 text-slate-700 text-[11px] font-bold rounded cursor-pointer transition-colors font-sans"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (isSuccess && checkInResult) {
                        handleConfirmChangeZone(tempZoneId);
                      } else {
                        setSelectedZoneId(tempZoneId);
                        setIsChangingZone(false);
                        setShowAllZones(false);
                      }
                    }}
                    disabled={(!isSuccess && !tempZoneId) || (isSuccess && (isUpdatingZone || eligibleZones.length === 0))}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 font-sans"
                  >
                    {isSuccess && isUpdatingZone ? "Lưu..." : "Xác nhận"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* VÉ ĐIỆN TỬ CHECK-IN */}
          <div className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm overflow-hidden flex flex-col gap-2 border-t-4 border-t-indigo-600">
            {/* Punch hole trang trí */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2.5 w-5 h-5 rounded-full bg-[#f8fafc] border-r border-slate-200/80 z-10"></div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 -mr-2.5 w-5 h-5 rounded-full bg-[#f8fafc] border-l border-slate-200/80 z-10"></div>

            {/* Header vé */}
            <div className="text-center border-b border-dashed border-slate-200 pb-2.5">
              <h4 className="font-extrabold text-xs text-slate-800 tracking-wider">SMART PARKING TICKET</h4>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                CỔNG VÀO: {gates.find(g => g.id === formData.gateEntryId)?.gateName?.toUpperCase() || "CHƯA CHỌN CỔNG"}
              </p>
            </div>

            {/* QR Code hiển thị */}
            <div className="flex flex-col items-center justify-center py-1">
              <div className="p-1.5 bg-white rounded-xl shadow-inner border border-slate-100 flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${ticketCode || "PENDING_TICKET"}`}
                  alt="QR Ticket"
                  className="w-[85px] h-[85px] object-contain"
                />
              </div>
              <span className="font-mono text-[9px] text-slate-500 font-extrabold tracking-wider mt-1.5 uppercase">
                {ticketCode ? ticketCode : (isPreCheckedIn ? "XÁC NHẬN ĐỂ CẤP MÃ VÉ" : "CHỜ CẤP MÃ VÉ...")}
              </span>
            </div>

            {/* Chi tiết thông tin vé */}
            <div className="space-y-1.5 text-[11px] font-semibold text-slate-500 border-t border-dashed border-slate-200 pt-2.5 font-sans">
              <div className="flex justify-between items-center">
                <span>Biển số xe:</span>
                <span className="text-slate-600 text-xs font-black tracking-wide uppercase px-2 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono">
                  {formatLicensePlate(checkInResult ? checkInResult.licensePlate : (preCheckInResult ? preCheckInResult.licensePlate : formData.plateNumber), checkInResult ? checkInResult.vehicleType : getVehicleLabel(formData.vehicleTypeId)) || "---"}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Phương tiện:</span>
                <span className="text-slate-600 font-extrabold">
                  {checkInResult ? checkInResult.vehicleType : (preCheckInResult ? preCheckInResult.vehicleType : (formData.vehicleTypeId ? getVehicleLabel(formData.vehicleTypeId) : "---"))}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Loại vé:</span>
                <span className="text-slate-600 font-extrabold">
                  {checkInResult
                    ? (checkInResult.driverType === "SUBSCRIBER"
                      ? `Vé đăng ký (${checkInResult.passType === "MONTHLY" ? "Tháng" : checkInResult.passType === "QUARTERLY" ? "Quý" : "Năm"})`
                      : checkInResult.driverType === "PRE_BOOKED"
                        ? "Vé đặt trước"
                        : "Vé lượt")
                    : (preCheckInResult
                      ? (preCheckInResult.driverType === "SUBSCRIBER"
                        ? `Vé đăng ký (${preCheckInResult.passType === "MONTHLY" ? "Tháng" : preCheckInResult.passType === "QUARTERLY" ? "Quý" : "Năm"})`
                        : preCheckInResult.driverType === "PRE_BOOKED"
                          ? "Vé đặt trước"
                          : "Vé lượt")
                      : "---")}
                </span>
              </div>



              <div className="flex justify-between">
                <span>Vị trí đỗ:</span>
                <span className="text-slate-600 font-extrabold">
                  {checkInResult
                    ? `${checkInResult.floorName} - ${checkInResult.zoneName}`
                    : (isPreCheckedIn && selectedZoneId
                      ? (() => {
                        const z = eligibleZones.find(x => x.zoneId === selectedZoneId);
                        return z ? `${z.floorName} - ${z.zoneName}` : "---";
                      })()
                      : "---")}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Thời gian vào:</span>
                <span className="text-slate-600 font-mono text-[10px] font-bold">
                  {checkInResult
                    ? new Date(checkInResult.entryTime).toLocaleString("vi-VN")
                    : (preCheckInResult
                      ? new Date(preCheckInResult.entryTime).toLocaleString("vi-VN")
                      : "---")}
                </span>
              </div>

              {(checkInResult?.customerName || preCheckInResult?.customerName) && (
                <div className="flex justify-between">
                  <span>Khách hàng:</span>
                  <span className="text-slate-600 font-extrabold">{checkInResult ? checkInResult.customerName : preCheckInResult.customerName}</span>
                </div>
              )}
              <div className="border-t border-dashed border-slate-200 pt-2.5 text-center text-[9px] text-slate-400 font-medium leading-normal mt-1">
                Cảm ơn quý khách đã sử dụng dịch vụ!
                <br />
                Hotline hỗ trợ: 1900 8888
              </div>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="w-full">
            {isSuccess && checkInResult ? (
              <div className="rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 p-3.5 text-white shadow-md border border-emerald-500/20">
                <div className="flex items-center gap-3 mb-3 text-emerald-600">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-emerald-600 font-bold text-[30px] flex-shrink-0">
                    ✓
                  </div>
                  <div>
                    <h4 className="font-extrabold text-md text-white">Check-in thành công!</h4>
                    <p className="text-[13px] text-emerald-100 mt-0.5 leading-snug">{checkInResult.guideMessage}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePrintTicket}
                    className="flex-1 bg-white text-emerald-700 border border-transparent font-bold text-xm py-2 rounded-lg cursor-pointer hover:bg-emerald-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm font-sans"
                  >
                    <IconPrinter /> In Vé
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 bg-emerald-700/80 hover:bg-emerald-800 text-white font-bold text-xs py-2 rounded-lg cursor-pointer active:scale-[0.98] transition-all font-sans"
                  >
                    Xe tiếp theo
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={isPreCheckedIn ? handleCheckIn : () => handleLoadPreCheckIn()}
                  disabled={isSubmitting || isLoadingPreview || !configLoaded}
                  className="flex-1 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-md hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-sans"
                >
                  {isSubmitting || isLoadingPreview ? (
                    <>{isSubmitting ? "Đang check-in..." : "Đang tìm kiếm..."}</>
                  ) : (
                    <>
                      <IconPrinter />
                      {isPreCheckedIn ? "XÁC NHẬN & CHECK-IN" : "TÌM KIẾM THÔNG TIN VÉ"}
                    </>
                  )}
                </button>
                {isPreCheckedIn && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="bg-slate-100 hover:bg-slate-250 text-slate-650 font-bold text-xs px-4 py-3 rounded-xl cursor-pointer active:scale-[0.98] transition-all font-sans shrink-0 border border-slate-250 shadow-xs"
                  >
                    Hủy
                  </button>
                )}
              </div>
            )}
          </div>

          {/* HIỂN THỊ ĐỐI SOÁT SAU KHI QUÉT QR THÀNH CÔNG */}
          {scannedTicketInfo && (
            <div className="rounded-xl border border-indigo-150 bg-indigo-50/50 p-2.5 space-y-1.5 shadow-xs animate-fade-in w-full text-[11px] font-sans mt-2">
              <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1 font-sans">
                <svg className="w-3.5 h-3.5 text-indigo-650" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Vé quét đối soát (QR)
              </h4>
              <div className="space-y-1 text-slate-650 font-sans">
                <div className="flex justify-between">
                  <span>Mã vé:</span>
                  <span className="font-mono font-bold text-slate-800">{scannedTicketInfo.code}</span>
                </div>
                <div className="flex justify-between">
                  <span>Khách hàng:</span>
                  <span className="font-bold text-slate-800">{scannedTicketInfo.customerName || "Vãng lai"}</span>
                </div>
                <div className="flex justify-between items-center border-t border-indigo-100/50 pt-1 mt-1">
                  <span>Biển số vé:</span>
                  <span className="font-mono font-bold text-indigo-900 bg-indigo-100/50 px-1 rounded border border-indigo-150">
                    {formatLicensePlate(scannedTicketInfo.licensePlate, scannedTicketInfo.vehicleTypeName) || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Thực tế:</span>
                  <span className={`font-mono font-bold px-1 rounded border ${
                    !scannedTicketInfo.licensePlate || !formData.plateNumber || 
                    normalizeLicensePlate(scannedTicketInfo.licensePlate) === normalizeLicensePlate(formData.plateNumber)
                      ? "text-emerald-700 bg-emerald-100/50 border-emerald-200"
                      : "text-rose-700 bg-rose-100/50 border-rose-200"
                  }`}>
                    {formData.plateNumber || "---"}
                    {(!scannedTicketInfo.licensePlate || !formData.plateNumber || 
                      normalizeLicensePlate(scannedTicketInfo.licensePlate) === normalizeLicensePlate(formData.plateNumber))
                      ? " (Khớp)"
                      : " (Lệch)"}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>



      {/* Modal Quét QR Vé */}
      {isQrScanning && (
        <div className="fixed inset-0 z-[110] flex items-start justify-center bg-slate-950/50 p-4 pt-[9vh]">
          <div className="w-full max-w-[25%] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-fade-in flex flex-col translate-x-46">
            <div className="flex items-center justify-between bg-indigo-600 px-6 py-2 text-white">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">QUÉT QR ĐẶT TRƯỚC/VÉ THÁNG</p>
              </div>
              <button
                type="button"
                onClick={handleCloseQrScanner}
                className="rounded-lg bg-white/10 px-2 py-1.5 text-xs font-black transition hover:bg-white/30 cursor-pointer"
              >
                Đóng
              </button>
            </div>
            
            <div className=" flex flex-col items-center justify-center gap-1 text-center">
              <div 
                id="ticket-checkin-reader" 
                className="w-full aspect-[4/3] bg-slate-900  overflow-hidden shadow-inner border border-slate-200 relative [&_video]:w-full [&_video]:h-full [&_video]:object-cover"
              >
                {/* Viền quét động */}
                <div className="absolute inset-6 border-2 border-dashed border-indigo-500 rounded-2xl animate-pulse pointer-events-none z-10"></div>
              </div>
              <p className="text-xs font-bold text-slate-655 max-w-[300px]">
                {qrMessage}
              </p>
              
              {/* Ô nhập dự phòng ở dưới */}
              <div className="flex gap-3 items-center mt-2 w-full my-1 px-2">
                <input
                  placeholder="Nhập mã đặt chỗ / vé tháng..."
                  value={manualTicketCode}
                  onChange={(e) => setManualTicketCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && manualTicketCode.trim()) {
                      handleProcessScannedQr(manualTicketCode);
                    }
                  }}
                  className="flex-1 rounded-xl border border-slate-250 bg-white px-3 py-2 text-xs font-bold text-slate-800 uppercase outline-none focus:border-indigo-500 transition-all min-w-[60px]"
                />
                <button
                  type="button"
                  onClick={() => manualTicketCode.trim() && handleProcessScannedQr(manualTicketCode)}
                  className="px-4 py-2 bg-slate-800 text-white hover:bg-green-600 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-sm"
                >
                  Tìm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}