import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { staffApi } from "../../api/parkingApi";
import { isValidVietnamLicensePlate, normalizeLicensePlate, LICENSE_PLATE_HINT, formatLicensePlate, getLicensePlateValidationError } from "../../utils/licensePlate";
import { getCloudinaryFolder, uploadToCloudinary } from "../../utils/cloudinary";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const LicensePlate = ({ plate, vehicleType }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-slate-350 bg-white font-mono font-bold text-slate-800 shadow-sm text-xs tracking-widest">
    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block mr-1"></span>
    {formatLicensePlate(plate, vehicleType)}
  </span>
);

// Custom SVG Icons for Double Scanner layout
const QrCodeIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17h.01M17 17h.01M17 7h.01" />
  </svg>
);

const CameraIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const ScanIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2m10 0h2a2 2 0 012 2v2m0 10v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M5 12h14" />
  </svg>
);

const AlertTriangleIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const getTicketTypeLabel = (driverType, passType) => {
  const dType = (driverType || "").toUpperCase();
  const pType = (passType || "").toUpperCase();
  if (dType === 'SUBSCRIBER') {
    const passTypeLabels = {
      MONTHLY: "Vé đăng ký (Tháng)",
      QUARTERLY: "Vé đăng ký (Quý)",
      YEARLY: "Vé đăng ký (Năm)"
    };
    return passTypeLabels[pType] || "Vé đăng ký (Tháng)";
  }
  if (dType === 'PRE_BOOKED') {
    return "Vé đặt trước";
  }
  return "Vé lượt";
};

const formatDateTime = (dateVal) => {
  if (!dateVal) return "---";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "---";
  const pad = (num) => String(num).padStart(2, '0');
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${hh}:${mm}:${ss} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

const formatDuration = (minutes) => {
  if (!minutes) return '0 phút';
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes} phút` : `${hours}h`;
};

/**
 * StaffCheckOut — Trang tác vụ Check-out xe ra của Nhân viên.
 */
export default function StaffCheckOut() {
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchPlate, setSearchPlate] = useState("");
  const [sessionData, setSessionData] = useState(null);
  const [scannedExitTime, setScannedExitTime] = useState(null);

  useEffect(() => {
    if (sessionData) {
      setScannedExitTime(new Date());
    } else {
      setScannedExitTime(null);
    }
  }, [sessionData?.sessionId, sessionData?.sessionCode]);

  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [checkOutResult, setCheckOutResult] = useState(null);
  const stompClientRef = useRef(null);

  // Tự động ẩn thông báo lỗi sau 10 giây
  useEffect(() => {
    if (apiError) {
      const timer = setTimeout(() => setApiError(""), 10000);
      return () => clearTimeout(timer);
    }
  }, [apiError]);

  // States for face camera
  const [isFaceScanning, setIsFaceScanning] = useState(false);
  const [previewFaceUrl, setPreviewFaceUrl] = useState("");
  const [uploadedFaceUrl, setUploadedFaceUrl] = useState("");
  const [faceStream, setFaceStream] = useState(null);
  const faceVideoRef = useRef(null);
  const [faceUploading, setFaceUploading] = useState(false);

  // States for plate scanner
  const canvasRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const [faceBlob, setFaceBlob] = useState(null);
  const [plateBlob, setPlateBlob] = useState(null);

  const [ticketInput, setTicketInput] = useState("");
  const [plateInput, setPlateInput] = useState("");

  const [isPlateScanning, setIsPlateScanning] = useState(false);
  const [plateMessage, setPlateMessage] = useState("Đang chờ quét biển số...");
  const [plateStream, setPlateStream] = useState(null);
  const plateVideoRef = useRef(null);

  // Ticket (QR) Scanner states
  const [isTicketScanning, setIsTicketScanning] = useState(false);
  const [ticketMessage, setTicketMessage] = useState("Đang chờ quét vé...");
  const ticketScannerRef = useRef(null);

  const fallbackExitGates = [
    { id: "e0f0e151-627e-47a8-9660-f6b6ab4c7c2d", gateCode: "MAIN-OUT", gateName: "Cổng chính - Lối ra", gateType: "MAIN_EXIT" }
  ];

  const [exitGates, setExitGates] = useState(fallbackExitGates);
  const [selectedGateId, setSelectedGateId] = useState(fallbackExitGates[0].id);

  // Widget thời gian realtime
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [liveDate, setLiveDate] = useState("");
  const [checkoutHistory, setCheckoutHistory] = useState([]);

  const fetchCheckoutHistory = async () => {
    try {
      const res = await staffApi.getAllSessionsHistory();
      const data = res.data.data || [];
      const completedSessions = data
        .filter(s => s.status === "COMPLETED")
        .sort((a, b) => new Date(b.exitTime || 0) - new Date(a.exitTime || 0))
        .slice(0, 5)
        .map(s => {
          const duration = s.durationMinutes || (s.entryTime && s.exitTime ? Math.floor((new Date(s.exitTime).getTime() - new Date(s.entryTime).getTime()) / 60000) : 0);
          const feeStr = s.totalFee ? `${Number(s.totalFee).toLocaleString("vi-VN")}đ` : "0đ";
          return [
            s.exitTime ? new Date(s.exitTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--",
            s.licensePlate,
            s.vehicleType || "Xe",
            `${feeStr} (${formatDuration(duration)})`,
            s.paymentMethod === "BANK_TRANSFER" ? "Chuyển khoản" : "Tiền mặt",
            s
          ];
        });
      setCheckoutHistory(completedSessions);
    } catch (err) {
      console.error("Lỗi khi tải lịch sử checkout:", err);
    }
  };

  // --- HÀM ĐIỀU KHIỂN CAMERA MẶT ---
  const startFaceScanner = async () => {
    try {
      setIsFaceScanning(true);
      setPreviewFaceUrl("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }
      });
      setFaceStream(stream);
      if (faceVideoRef.current) {
        faceVideoRef.current.srcObject = stream;
        faceVideoRef.current.play();
      }
    } catch (error) {
      console.error("Lỗi mở camera mặt:", error);
      setIsFaceScanning(false);
    }
  };

  const stopFaceScanner = () => {
    if (faceStream) {
      faceStream.getTracks().forEach(track => track.stop());
      setFaceStream(null);
    }
    setIsFaceScanning(false);
  };

  const handleCaptureFace = () => {
    const video = faceVideoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      alert("Không tìm thấy camera mặt!");
      return;
    }
    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const localUrl = URL.createObjectURL(blob);
      setPreviewFaceUrl(localUrl);
      setFaceBlob(blob);
      setUploadedFaceUrl("");
      stopFaceScanner();
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
      setFaceUploading(true);
      const localUrl = URL.createObjectURL(faceFile);
      setPreviewFaceUrl(localUrl);

      if (!hasCloudinary) {
        console.warn("Chưa cấu hình Cloudinary. Demo: Lưu ảnh cục bộ.");
        setUploadedFaceUrl(localUrl);
        setFaceUploading(false);
      } else {
        try {
          const uploadData = new FormData();
          uploadData.append("file", faceFile);
          uploadData.append("upload_preset", uploadPreset.trim());
          uploadData.append("folder", getCloudinaryFolder(false, false));

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName.trim()}/image/upload`,
            { method: "POST", body: uploadData }
          );

          if (response.ok) {
            const resData = await response.json();
            setUploadedFaceUrl(resData.secure_url || resData.url);
          } else {
            throw new Error("Lỗi upload Cloudinary cho ảnh mặt");
          }
        } catch (err) {
          console.error("Lỗi upload face:", err);
          setApiError(prev => prev ? prev + " | Lỗi upload ảnh mặt" : "Lỗi upload ảnh mặt");
        } finally {
          setFaceUploading(false);
        }
      }
    }

    // 2. Process Plate File
    if (plateFile) {
      setIsUploading(true);
      setPlateMessage("Đang xử lý ảnh biển số xe...");
      const localUrl = URL.createObjectURL(plateFile);
      setPreviewUrl(localUrl);
      setPlateBlob(plateFile);
      setUploadedUrl("");

      let detectedPlate = "";
      try {
        const hasOcr = ocrToken && ocrToken !== "chuỗi_api_token_của_bạn";
        if (!hasOcr) {
          console.warn("Chưa cấu hình Token OCR. Bỏ qua OCR.");
          setPlateMessage("⚠️ Chưa cấu hình Token OCR.");
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
              const normalized = normalizeLicensePlate(detectedPlate);
              setPlateInput(formatLicensePlate(normalized, sessionData?.vehicleType));
              setPlateMessage(`Nhận diện thành công: ${formatLicensePlate(normalized, sessionData?.vehicleType)}`);
            } else {
              setPlateMessage("⚠️ Không phát hiện biển số xe trong ảnh.");
            }
          } else {
            console.error("OCR API error:", await ocrResponse.text());
            setPlateMessage("❌ Lỗi dịch vụ OCR.");
          }
        }
      } catch (err) {
        console.error("Lỗi quy trình nhận diện check-out:", err);
        setPlateMessage(err.message || "Tải ảnh hoặc nhận diện thất bại!");
      } finally {
        setIsUploading(false);
      }
    }

    e.target.value = "";
  };

  const startTicketScanner = async () => {
    try {
      setIsTicketScanning(true);
      setTicketMessage("Đang mở camera...");
      const scanner = new Html5Qrcode("ticket-checkout-reader");
      ticketScannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 20, qrbox: { width: 155, height: 155 } },
        async (decodedText) => {
          setTicketInput(decodedText.toUpperCase());
          setTicketMessage("Đã quét mã vé!");
          parseQrData(decodedText);
          stopTicketScanner();
        },
        () => { }
      );
      setTicketMessage("Đưa mã QR vé vào khung camera");
    } catch (error) {
      console.error(error);
      setTicketMessage("Không mở được camera");
      setIsTicketScanning(false);
    }
  };

  const stopTicketScanner = async () => {
    if (ticketScannerRef.current) {
      await ticketScannerRef.current.stop().catch(() => { });
      ticketScannerRef.current.clear();
      ticketScannerRef.current = null;
    }
    setIsTicketScanning(false);
  };

  const startPlateScanner = async () => {
    try {
      setIsPlateScanning(true);
      setPreviewUrl("");
      setPlateMessage("Camera hoạt động! Đưa biển số trước cam.");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      setPlateStream(stream);
      if (plateVideoRef.current) {
        plateVideoRef.current.srcObject = stream;
        plateVideoRef.current.play();
      }
    } catch (error) {
      console.error("Lỗi mở camera biển số:", error);
      setPlateMessage("Không mở được camera biển số");
      setIsPlateScanning(false);
    }
  };

  const stopPlateScanner = () => {
    if (plateStream) {
      plateStream.getTracks().forEach(track => track.stop());
      setPlateStream(null);
    }
    setIsPlateScanning(false);
  };

  const performUpload = async (blob) => {
    try {
      setIsUploading(true);
      setPlateBlob(blob);
      setUploadedUrl("");
      setPlateMessage("Đang nhận diện biển số xe bằng AI...");

      let detectedPlate = "";
      const ocrToken = import.meta.env.VITE_PLATE_RECOGNIZER_TOKEN;
      const hasOcr = ocrToken && ocrToken !== "chuỗi_api_token_của_bạn";

      if (!hasOcr) {
        console.warn("Chưa cấu hình Plate Recognizer Token. Bỏ qua OCR.");
        setPlateMessage("⚠️ Chưa cấu hình Token OCR.");
      } else {
        const ocrData = new FormData();
        ocrData.append("upload", blob, "captured_vehicle.jpg");
        ocrData.append("regions", "vn");

        const ocrResponse = await fetch("https://api.platerecognizer.com/v1/plate-reader/", {
          method: "POST",
          headers: {
            "Authorization": `Token ${ocrToken.trim()}`,
          },
          body: ocrData,
        });

        if (!ocrResponse.ok) {
          const errText = await ocrResponse.text();
          console.error("OCR API error:", errText);
          setPlateMessage("❌ Lỗi dịch vụ OCR.");
        } else {
          const ocrRes = await ocrResponse.json();
          if (ocrRes.results && ocrRes.results.length > 0) {
            detectedPlate = ocrRes.results[0].plate.toUpperCase();
            const normalized = normalizeLicensePlate(detectedPlate);
            setPlateInput(formatLicensePlate(normalized, sessionData?.vehicleType));
            setPlateMessage(`Nhận diện thành công: ${formatLicensePlate(normalized, sessionData?.vehicleType)}`);
          } else {
            setPlateMessage("⚠️ Không phát hiện biển số xe trong ảnh.");
          }
        }
      }
    } catch (err) {
      console.error("Lỗi quy trình nhận diện check-out:", err);
      setPlateMessage(err.message || "Tải ảnh hoặc nhận diện thất bại!");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCaptureAndUpload = () => {
    const video = plateVideoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      alert("Không tìm thấy camera hoặc thẻ canvas! Hãy đảm bảo bạn đã bật camera.");
      return;
    }

    const context = canvas.getContext("2d");
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;
    context.drawImage(video, 0, 0, width, height);

    canvas.toBlob((blob) => {
      if (!blob) {
        alert("Lỗi trích xuất ảnh từ camera!");
        return;
      }
      const localPreviewUrl = URL.createObjectURL(blob);
      setPreviewUrl(localPreviewUrl);
      stopPlateScanner();
      performUpload(blob);
    }, "image/jpeg", 0.6);
  };

  const handleManualUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext("2d");

        let width = img.width;
        let height = img.height;
        const maxDim = 800;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        context.drawImage(img, 0, 0, width, height);

        canvas.toBlob(async (blob) => {
          if (!blob) {
            alert("Lỗi nén ảnh!");
            return;
          }
          const localPreviewUrl = URL.createObjectURL(blob);
          setPreviewUrl(localPreviewUrl);
          await performUpload(blob);
        }, "image/jpeg", 0.6);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const autoSearchPlate = async (query) => {
    if (!query || !query.trim()) return;
    const searchTerm = query.trim().toUpperCase();

    setIsSearching(true);
    setApiError('');

    const isSessionCode = searchTerm.startsWith("PS");

    if (isSessionCode) {
      try {
        const res = await staffApi.getAllSessionsHistory();
        const sessions = res.data.data || [];
        const activeSession = sessions.find(s => s.sessionCode === searchTerm && s.status === "ACTIVE");

        if (activeSession) {
          setSessionData(activeSession);
          setIsSearching(false);
          return;
        }
      } catch (err) {
        console.warn("Lỗi tra cứu mã phiên từ API:", err);
      }

      const storedSession = JSON.parse(localStorage.getItem("driver_session") || "null");
      if (storedSession) {
        const storedCode = storedSession.sessionCode || "";
        const cleanStoredCode = storedCode.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        const cleanSearchTerm = searchTerm.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        if (cleanStoredCode === cleanSearchTerm) {
          const minutes = Math.max(1, Math.round((Date.now() - (storedSession.createdTimestamp || Date.now() - 300000)) / 60000));
          const hourlyRate = storedSession.vehicle?.includes("My") ? 5000 : 15000;
          const fee = Math.max(hourlyRate, Math.ceil(minutes / 60) * hourlyRate);

          const mockSession = {
            sessionId: "demo-session-id",
            sessionCode: storedSession.sessionCode || searchTerm,
            licensePlate: storedSession.licensePlate,
            entryTime: new Date(storedSession.createdTimestamp || Date.now() - 300000).toISOString(),
            floorName: storedSession.floor || "Tầng 3",
            zoneName: storedSession.slot || "T3-CAR-C",
            vehicleType: storedSession.vehicle || "Ô tô (Đang gửi)",
            durationMinutes: minutes,
            totalFee: fee,
            guideMessage: `Thời gian đỗ thực tế: ${minutes} phút. Đơn giá: ${hourlyRate.toLocaleString("vi-VN")}đ/giờ.`
          };
          setSessionData(mockSession);
          setIsSearching(false);
          return;
        }
      }

      setSessionData(null);
      setApiError(`Không tìm thấy phiên gửi xe hoạt động với mã vé: ${searchTerm}`);
      setIsSearching(false);
      return;
    }

    const normalizedPlate = normalizeLicensePlate(searchTerm);
    const plateError = getLicensePlateValidationError(normalizedPlate);
    if (plateError) {
      setApiError(plateError);
      setIsSearching(false);
      return;
    }

    try {
      const res = await staffApi.getActiveSession(normalizedPlate);
      setSessionData(res.data.data);
    } catch (err) {
      console.warn("Backend getActiveSession failed, falling back to LocalStorage Demo:", err);
      const storedSession = JSON.parse(localStorage.getItem("driver_session") || "null");
      const normalizePlate = (p) => (p || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

      if (storedSession && normalizePlate(storedSession.licensePlate) === normalizePlate(normalizedPlate)) {
        const minutes = Math.max(1, Math.round((Date.now() - (storedSession.createdTimestamp || Date.now() - 300000)) / 60000));
        const hourlyRate = storedSession.vehicle?.includes("My") ? 5000 : 15000;
        const fee = Math.max(hourlyRate, Math.ceil(minutes / 60) * hourlyRate);

        setSessionData({
          sessionId: "demo-session-id",
          sessionCode: `SS-${(storedSession.createdTimestamp || Date.now()).toString().slice(-6)}`,
          licensePlate: storedSession.licensePlate,
          entryTime: new Date(storedSession.createdTimestamp || Date.now() - 300000).toISOString(),
          floorName: storedSession.floor || "Tầng 3",
          zoneName: storedSession.slot || "T3-CAR-C",
          vehicleType: storedSession.vehicle || "Ô tô (Đang gửi)",
          durationMinutes: minutes,
          totalFee: fee,
          guideMessage: `Thời gian đỗ thực tế: ${minutes} phút. Đơn giá: ${hourlyRate.toLocaleString("vi-VN")}đ/giờ.`
        });
      } else {
        setSessionData(null);
        setApiError(err.response?.data?.message || 'Không tìm thấy phiên gửi xe đang hoạt động cho biển số này');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const parseQrData = (qrText) => {
    if (!qrText) return;
    const cleanedText = qrText.trim().toUpperCase();

    if (cleanedText.startsWith("PS")) {
      setTicketInput(cleanedText);
      setTicketMessage(`ĐÃ ĐỌC VÉ: ${cleanedText}`);
      setTimeout(() => { autoSearchPlate(cleanedText); }, 500);
      return;
    }

    if (cleanedText.startsWith("BK-")) {
      const storedBooking = JSON.parse(localStorage.getItem("driver_booking") || "null");
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const activePlate = storedBooking?.licensePlate || (storedUser.licensePlates && storedUser.licensePlates[0]) || "";

      setTicketInput(cleanedText);
      setTicketMessage(`ĐÃ NHẬN MÃ ĐẶT CHỖ: ${cleanedText}`);
      setTimeout(() => { autoSearchPlate(activePlate); }, 500);
      return;
    }

    try {
      const data = JSON.parse(qrText);
      const plate = data.plateNumber || data.licensePlate || "";
      if (plate) {
        setTicketInput(cleanedText);
        setTicketMessage(`ĐÃ ĐỌC BIỂN SỐ: ${plate}`);
        setTimeout(() => { autoSearchPlate(plate); }, 500);
      } else {
        setTicketMessage("KHÔNG TÌM THẤY BIỂN SỐ TRONG QR");
      }
    } catch (e) {
      setTicketInput(cleanedText);
      setTicketMessage(`ĐÃ ĐỌC BIỂN SỐ QR: ${cleanedText}`);
      setTimeout(() => { autoSearchPlate(cleanedText); }, 500);
    }
  };

  const handleCheckOut = async () => {
    if (!sessionData || !selectedGateId) return;

    const sanitizePlate = (p) => (p || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const cleanEntryPlate = sanitizePlate(sessionData.licensePlate);
    const cleanExitPlate = sanitizePlate(plateInput);
    if (cleanEntryPlate !== cleanExitPlate) {
      const confirmForcedCheckout = window.confirm(
        `⚠️ CẢNH BÁO: Biển số vào (${formatLicensePlate(sessionData.licensePlate, sessionData.vehicleType)}) và biển số ra (${formatLicensePlate(plateInput, sessionData.vehicleType) || "Chưa nhận dạng"}) KHÔNG TRÙNG KHỚP!\n\nBạn có chắc chắn muốn bỏ qua cảnh báo và xác nhận cho xe ra không?`
      );
      if (!confirmForcedCheckout) return;
    }

    setIsSubmitting(true);
    setApiError('');
    try {
      const res = await staffApi.checkOut({
        sessionId: sessionData.sessionId,
        gateExitId: selectedGateId,
        paymentMethod: paymentMethod
      });
      const backendSession = res.data.data;
      setCheckOutResult(backendSession);
      setShowSuccess(true);

      // SAU KHI THÀNH CÔNG: Upload ảnh lên Cloudinary (chạy song song)
      let finalFaceUrl = uploadedFaceUrl;
      let finalPlateUrl = uploadedUrl;
      let needUpdate = false;

      const uploadTasks = [];

      if (faceBlob && !finalFaceUrl) {
        const faceUploadTask = uploadToCloudinary(faceBlob, false, false)
          .then(url => {
            if (url) { finalFaceUrl = url; setUploadedFaceUrl(url); needUpdate = true; }
          })
          .catch(err => console.error("Lỗi upload ảnh mặt:", err));
        uploadTasks.push(faceUploadTask);
      }
      
      if (plateBlob && !finalPlateUrl) {
        const plateUploadTask = uploadToCloudinary(plateBlob, false, true)
          .then(url => {
            if (url) { finalPlateUrl = url; setUploadedUrl(url); needUpdate = true; }
          })
          .catch(err => console.error("Lỗi upload ảnh biển số:", err));
        uploadTasks.push(plateUploadTask);
      }

      // Đợi cả 2 ảnh upload xong cùng lúc
      if (uploadTasks.length > 0) {
        await Promise.all(uploadTasks);
      }

      if (needUpdate) {
        await staffApi.updateSessionImages(backendSession.sessionId, {
           plateUrl: finalPlateUrl,
           faceUrl: finalFaceUrl,
           isEntry: false
        }).catch(err => console.error("Lỗi gọi API cập nhật Session Images:", err));
      }

      localStorage.removeItem("driver_session");
      localStorage.removeItem("driver_booking");

      setPreviewUrl("");
      setUploadedUrl("");
      setPreviewFaceUrl("");
      setUploadedFaceUrl("");
      setFaceBlob(null);
      setPlateBlob(null);
      setPlateInput("");
      setTicketInput("");
      setPlateMessage("Đang chờ quét biển số...");
      setTicketMessage("Đang chờ quét vé...");
      setSessionData(null);

      fetchCheckoutHistory();
    } catch (err) {
      console.error("Backend checkOut error:", err);
      const errorMsg = err.response?.data?.message || err.message || "Lỗi kết nối với hệ thống backend";
      setApiError(`Check-out thất bại: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFee = (fee) => {
    if (!fee) return '0đ';
    return Number(fee).toLocaleString('vi-VN') + 'đ';
  };

  const handlePrint = () => {
    if (!checkOutResult) return;
    const printWindow = window.open("", "_blank", "width=600,height=600");
    if (!printWindow) {
      alert("Vui lòng cho phép trình duyệt mở popup để in hóa đơn!");
      return;
    }

    const customerRow = checkOutResult.customerName ? `
      <div class="info-row">
        <span>Khách hàng:</span>
        <span class="info-value">${checkOutResult.customerName}</span>
      </div>
    ` : '';

    const ticketType = getTicketTypeLabel(checkOutResult.driverType, checkOutResult.passType);
    const location = checkOutResult.floorName && checkOutResult.zoneCode
      ? `${checkOutResult.floorName} - ZONE-${checkOutResult.zoneCode}`
      : (checkOutResult.floorName && checkOutResult.zoneName ? `${checkOutResult.floorName} - ${checkOutResult.zoneName}` : "---");

    printWindow.document.write(`
      <html>
        <head>
          <title>Hóa đơn thanh toán - #${checkOutResult.sessionCode}</title>
          <style>
            body {
              font-family: Consolas, 'Courier New', monospace;
              text-align: center;
              padding: 20px;
              color: #333;
              background: #fff;
            }
            .ticket-container {
              border: 2px dashed #444;
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
            .total-section {
              margin-top: 15px;
              border-top: 2px dashed #444;
              padding-top: 10px;
            }
            .total-label {
              font-size: 11px;
              font-weight: bold;
              color: #555;
              text-transform: uppercase;
            }
            .total-fee {
              font-size: 20px;
              font-weight: 900;
              margin: 8px 0;
              color: #111;
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
            <div class="subtitle">Hóa đơn thanh toán</div>
            <div class="subtitle" style="margin-top: -10px; font-weight: bold;">Cổng ra: ${checkOutResult.exitGate || "Cổng ra"}</div>
            
            <div class="info-row">
              <span>Mã phiên:</span>
              <span class="info-value">#${checkOutResult.sessionCode}</span>
            </div>
            <div class="info-row">
              <span>Biển số xe:</span>
              <span class="info-value">${formatLicensePlate(checkOutResult.licensePlate, checkOutResult.vehicleType) || "---"}</span>
            </div>
            <div class="info-row">
              <span>Phương tiện:</span>
              <span class="info-value">${checkOutResult.vehicleType || "---"}</span>
            </div>
            <div class="info-row">
              <span>Vị trí đỗ:</span>
              <span class="info-value">${location}</span>
            </div>
            <div class="info-row">
              <span>Loại vé:</span>
              <span class="info-value">${ticketType}</span>
            </div>
            <div class="info-row">
              <span>Thời gian vào:</span>
              <span class="info-value">${formatDateTime(checkOutResult.entryTime)}</span>
            </div>
            <div class="info-row">
              <span>Thời gian ra:</span>
              <span class="info-value">${formatDateTime(checkOutResult.exitTime)}</span>
            </div>
            <div class="info-row">
              <span>Thời gian gửi:</span>
              <span class="info-value">${formatDuration(checkOutResult.durationMinutes || 0)}</span>
            </div>
            <div class="info-row">
              <span>Hình thức:</span>
              <span class="info-value">${paymentMethod === "BANK_TRANSFER" ? "VietQR CK" : "Tiền mặt"}</span>
            </div>
            ${customerRow}
            
            <div class="total-section">
              <div class="total-label">Tổng tiền thanh toán</div>
              <div class="total-fee">${formatFee(checkOutResult.totalFee)}</div>
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

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await staffApi.getParkingConfig();
        const config = res.data.data;
        const exits = (config.gates || []).filter(g => g.gateType === 'MAIN_EXIT' || g.gateType === 'MAIN_BOTH');
        if (exits && exits.length > 0) {
          setExitGates(exits);
          const firstActiveGate = exits.find(g => g.isActive) || exits[0];
          setSelectedGateId(firstActiveGate.id);
        }
      } catch (err) {
        console.warn('Failed to load dynamic config, keeping fallback gates:', err);
      }
    };
    fetchConfig();
    fetchCheckoutHistory();
  }, []);

  useEffect(() => {
    const clockTimer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setLiveDate(today.toLocaleDateString('vi-VN', options));

    return () => {
      clearInterval(clockTimer);
      if (ticketScannerRef.current) ticketScannerRef.current.stop().catch(() => { });
    };
  }, []);

  useEffect(() => {
    return () => {
      if (faceStream) faceStream.getTracks().forEach(track => track.stop());
      if (plateStream) plateStream.getTracks().forEach(track => track.stop());
    };
  }, [faceStream, plateStream]);

  // STOMP WebSocket client for real-time payment notifications
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log("✅ WebSocket connected - Listening for payment confirmations...");
      client.subscribe("/topic/payments/confirmed", (message) => {
        try {
          const paymentData = JSON.parse(message.body);
          setCheckOutResult({
            sessionCode: paymentData.sessionCode,
            licensePlate: paymentData.licensePlate,
            durationMinutes: paymentData.durationMinutes,
            totalFee: paymentData.totalFee,
            vehicleType: paymentData.vehicleType,
            exitGate: paymentData.exitGate,
          });
          setPaymentMethod("BANK_TRANSFER");
          setShowSuccess(true);

          localStorage.removeItem("driver_session");
          localStorage.removeItem("driver_booking");

          setSessionData(null);
          setSearchPlate("");
          fetchCheckoutHistory();
        } catch (err) {
          console.error("WebSocket parse error:", err);
        }
      });
    };

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (client.active) client.deactivate();
    };
  }, []);

  return (
    <section className="flex-1 space-y-4 p-1">
      {/* Thông báo lỗi */}
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Cột trái (Quét tìm và thông tin cổng/thanh toán) - chiếm 9 cột (75%) */}
        <div className="space-y-1 lg:col-span-9 flex flex-col">

          {/* Bảng Camera Điều khiển & Đối soát CCTV 3 Cột */}
          <div className="rounded-2xl shadow-sm overflow-hidden flex flex-col shrink-0 max-w-[1035px] w-full">

            {/* Lưới 3 Cột dính liền khép kín */}
            <div className="grid grid-cols-3 gap-[2px] p-[2px] bg-slate-200">

              {/* CỘT 1: CHỤP CHÂN DUNG (Mặt người gửi) */}
              <div className="flex flex-col gap-[2px] h-full justify-between bg-white">
                {/* Trên: Camera mặt */}
                <div className="relative bg-slate-50 aspect-[4/3] flex items-center justify-center overflow-hidden shrink-0">
                  {previewFaceUrl ? (
                    <img src={previewFaceUrl} alt="Mặt lúc ra" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <video
                        ref={faceVideoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                        style={{ display: isFaceScanning ? "block" : "none" }}
                      />
                      {!isFaceScanning && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-700 text-center p-2">
                          <CameraIcon className="text-slate-500 w-7 h-7 mb-1" />
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

                {/* Dưới: Ảnh mặt lúc vào */}
                <div className="relative bg-slate-200 aspect-[4/3] flex items-center justify-center overflow-hidden shrink-0">
                  {sessionData?.entryFaceImageUrl || sessionData?.entryFaceUrl || sessionData?.imageInFace ? (
                    <img src={sessionData.entryFaceImageUrl || sessionData.entryFaceUrl || sessionData.imageInFace} alt="Mặt lúc vào" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px] text-slate-500 font-bold italic text-center p-2">Chưa có ảnh mặt lúc vào</span>
                  )}
                  <span className="absolute bottom-2 left-2 text-slate-700 font-black text-[9px] px-1.5 py-0.5 rounded tracking-wider ">
                    MẶT LÚC VÀO
                  </span>
                </div>

                {/* Điều khiển Cột 1 */}
                <div className="bg-slate-50 p-2.5 flex flex-col gap-1.5 mt-auto min-h-[85px] justify-center">
                  <div className="flex gap-1 justify-center">
                    <button
                      onClick={isFaceScanning ? stopFaceScanner : startFaceScanner}
                      className={`flex-1 py-1 rounded text-[10px] font-black uppercase transition-all cursor-pointer ${isFaceScanning ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'}`}
                    >
                      {isFaceScanning ? 'Tắt' : 'Bật'}
                    </button>
                    <button
                      onClick={handleCaptureFace}
                      disabled={!isFaceScanning}
                      className="flex-1 bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white py-1 rounded text-[10px] font-black uppercase transition-all cursor-pointer"
                    >
                      Chụp
                    </button>
                    <button
                      onClick={async () => { stopFaceScanner(); setPreviewFaceUrl(""); setUploadedFaceUrl(""); await startFaceScanner(); }}
                      className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-1 rounded text-[10px] font-black uppercase transition-all cursor-pointer"
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
              <div className="flex flex-col gap-[2px] h-full justify-between bg-white">
                {/* Trên: Camera biển số */}
                <div className="relative bg-slate-50 aspect-[4/3] flex items-center justify-center overflow-hidden shrink-0">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Xe lúc ra" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <video
                        ref={plateVideoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                        style={{ display: isPlateScanning ? "block" : "none" }}
                      />
                      {!isPlateScanning && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-700 text-center p-2">
                          <ScanIcon className="text-slate-500 w-7 h-7 mb-1" />
                          <p className="font-extrabold text-white text-[9px] tracking-wider uppercase">CAM BIỂN SỐ TẮT</p>
                        </div>
                      )}
                    </>
                  )}
                  <span className="absolute top-2 left-2 text-white font-black text-[9px] px-1.5 py-0.5 rounded  tracking-wider">
                    CAM 2: BIỂN SỐ
                  </span>
                </div>

                {/* Dưới: Ảnh xe lúc vào */}
                <div className="relative bg-slate-200 aspect-[4/3] flex items-center justify-center overflow-hidden shrink-0">
                  {sessionData?.entryPlateImageUrl || sessionData?.imageIn || sessionData?.entryImageUrl ? (
                    <img src={sessionData.entryPlateImageUrl || sessionData.imageIn || sessionData.entryImageUrl} alt="Xe lúc vào" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[9px] text-slate-500 font-bold italic text-center p-2">Chưa có ảnh xe lúc vào</span>
                  )}
                  <span className="absolute bottom-2 left-2 text-slate-700 font-black text-[9px] px-1.5 py-0.5 rounded tracking-wider ">
                    BIỂN LÚC VÀO
                  </span>
                </div>

                {/* Điều khiển Cột 2 */}
                <div className="bg-slate-50 p-2.5 flex flex-col gap-1.5 mt-auto min-h-[85px] justify-center">
                  <div className="flex gap-1 justify-center">
                    <button
                      onClick={isPlateScanning ? stopPlateScanner : startPlateScanner}
                      className={`flex-1 py-1 rounded text-[10px] font-black uppercase transition-all cursor-pointer ${isPlateScanning ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'}`}
                    >
                      {isPlateScanning ? 'Tắt' : 'Bật'}
                    </button>
                    <button
                      onClick={handleCaptureAndUpload}
                      disabled={!isPlateScanning || isUploading}
                      className="flex-1 bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white py-1 rounded text-[10px] font-black uppercase transition-all cursor-pointer"
                    >
                      Chụp
                    </button>
                    <button
                      onClick={async () => { stopPlateScanner(); setPreviewUrl(""); setUploadedUrl(""); await startPlateScanner(); }}
                      className="flex-1 bg-slate-200 hover:bg-slate-350 text-slate-750 py-1 rounded text-[10px] font-black uppercase transition-all cursor-pointer"
                    >
                      Bỏ qua
                    </button>
                  </div>
                  <div className="flex gap-1 items-center mt-0.5 h-[22px]">
                    <input
                      placeholder="Nhập biển số..."
                      value={plateInput}
                      onChange={(e) => setPlateInput(e.target.value)}
                      onBlur={(e) => setPlateInput(formatLicensePlate(e.target.value, sessionData?.vehicleType))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const formatted = formatLicensePlate(plateInput, sessionData?.vehicleType);
                          setPlateInput(formatted);
                          setPlateMessage(`Đã cập nhật biển số ra: ${formatted}`);
                        }
                      }}
                      className="flex-1 rounded border border-slate-250 bg-white px-2 py-0.5 text-[9px] font-bold text-slate-800 uppercase outline-none focus:border-indigo-500 transition-all min-w-[60px]"
                    />
                    <button
                      onClick={() => {
                        const formatted = formatLicensePlate(plateInput, sessionData?.vehicleType);
                        setPlateInput(formatted);
                        setPlateMessage(`Đã cập nhật biển số ra: ${formatted}`);
                      }}
                      className="px-2 py-0.5 bg-slate-700 text-white hover:bg-green-600 rounded text-[8px] font-bold transition-colors cursor-pointer shrink-0"
                    >
                      Nhập
                    </button>
                  </div>
                </div>
              </div>

              {/* CỘT 3: QUÉT QR VÉ */}
              <div className="flex flex-col gap-[2px] h-full justify-between bg-white">
                {/* Trên: Vùng camera QR */}
                <div className="relative bg-slate-50 aspect-[4/3] flex items-center justify-center overflow-hidden shrink-0">
                  <div id="ticket-checkout-reader" className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
                  {!isTicketScanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-700 text-center p-2">
                      <QrCodeIcon className="text-indigo-400/80 w-7 h-7 mb-1" />
                      <p className="font-extrabold text-white text-[9px] tracking-wider uppercase">CAM QUÉT QR TẮT</p>
                    </div>
                  )}
                  <span className="absolute top-2 left-2 text-white font-black text-[9px] px-1.5 py-0.5 rounded tracking-wider">
                    CAM 3: QUÉT QR VÉ
                  </span>
                </div>

                {/* Dưới: Khung đối soát biển số */}
                <div className="relative bg-slate-50 aspect-[4/3] flex flex-col justify-between shrink-0">
                  <span className="absolute top-1 left-2 text-slate-900 font-extrabold text-[10px] px-1.5 py-0.5 rounded tracking-wider">
                    ĐỐI SOÁT BIỂN SỐ
                  </span>

                  <div className="flex flex-col gap-1 items-center justify-center w-full mt-10 px-2">
                    {/* Khung Biển Số Vào */}
                    <div className="flex flex-col justify-center items-center bg-white rounded w-full py-1 shadow-sm">
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest w-full px-5">
                        BIỂN SỐ VÀO
                      </span>
                      <span className="text-[41px] font-mono font-black text-slate-900 tracking-wider uppercase">
                        {formatLicensePlate(sessionData?.licensePlate, sessionData?.vehicleType) || "---"}
                      </span>
                    </div>

                    {/* Khung Biển Số Ra */}
                    <div className="flex flex-col justify-center items-center bg-white rounded w-full py-1 shadow-sm">
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest w-full px-5">
                        BIỂN SỐ RA
                      </span>
                      <span className="text-[41px] font-mono font-black text-slate-900 tracking-wider uppercase">
                        {plateInput || "---"}
                      </span>
                    </div>
                  </div>

                  <div className="w-full text-center pb-1">
                    {!sessionData ? (
                      <span className="text-[18px] font-black text-slate-600 uppercase tracking-widest">
                        CHỜ PHIÊN XE...
                      </span>
                    ) : !plateInput || !plateInput.trim() ? (
                      <span className="text-[18px] font-black text-amber-500 uppercase tracking-widest animate-pulse">
                        ĐANG CHỜ QUÉT BIỂN RA...
                      </span>
                    ) : (sessionData.licensePlate || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase() === (plateInput || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase() ? (
                      <span className="text-[18px] font-black text-emerald-500 uppercase tracking-widest">
                        ✓ TRÙNG KHỚP HỢP LỆ
                      </span>
                    ) : (
                      <span className="text-[18px] font-black text-rose-500 uppercase tracking-widest animate-pulse">
                        CẢNH BÁO: KHÔNG KHỚP!
                      </span>
                    )}
                  </div>
                </div>

                {/* Điều khiển Cột 3 */}
                <div className="bg-slate-50 p-2.5 flex flex-col gap-1.5 mt-auto min-h-[85px] justify-center">
                  <div className="flex gap-1 justify-center">
                    <button
                      onClick={isTicketScanning ? stopTicketScanner : startTicketScanner}
                      className={`flex-1 py-1 rounded text-[10px] font-black uppercase transition-all cursor-pointer ${isTicketScanning ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'}`}
                    >
                      {isTicketScanning ? 'Tắt' : 'Bật'}
                    </button>
                    <button
                      onClick={async () => { await stopTicketScanner(); setTicketInput(""); await startTicketScanner(); }}
                      className="flex-1 bg-slate-200 hover:bg-slate-350 text-slate-750 py-1 rounded text-[10px] font-black uppercase transition-all cursor-pointer"
                    >

                      Bỏ qua
                    </button>
                  </div>
                  <div className="flex gap-1 items-center mt-0.5 h-[22px]">
                    <input
                      placeholder="Mã vé..."
                      value={ticketInput}
                      onChange={(e) => setTicketInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && parseQrData(ticketInput)}
                      className="flex-1 rounded border border-slate-250 bg-white px-2 py-0.5 text-[9px] font-bold text-slate-800 uppercase outline-none focus:border-indigo-500 transition-all min-w-[60px]"
                    />
                    <button
                      onClick={() => parseQrData(ticketInput)}
                      className="px-2 py-0.5 bg-slate-700 text-white hover:bg-green-600 rounded text-[8px] font-bold transition-colors cursor-pointer shrink-0"
                    >
                      Tìm
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Cổng check-out box */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-3.5 flex flex-row items-stretch gap-4">
            <div className="w-1/2 flex flex-col justify-center">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-700 mb-1.5">Cổng ra check-out</label>
              <select
                value={selectedGateId}
                onChange={(e) => setSelectedGateId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 bg-white cursor-pointer shadow-sm font-sans"
              >
                {exitGates.map(g => (
                  <option key={g.id} value={g.id} disabled={!g.isActive}>
                    {g.gateName}{g.isActive ? "" : " (BẢO TRÌ)"}
                  </option>
                ))}
              </select>
            </div>

            {/* Hiển thị Ghi chú từ lúc Check-in */}
            {sessionData?.notes && (
              <div className="w-1/2 p-2.5 rounded-xl border-2 border-amber-300 bg-amber-50 animate-pulse-slow flex flex-col justify-center">
                <div className="flex items-center gap-1.5 mb-0.5 text-amber-700">
                  <AlertTriangleIcon className="w-3.5 h-3.5" /> 
                  <span className="font-black text-[10px] uppercase tracking-wider">
                    GHI CHÚ LÚC VÀO
                  </span>
                </div>
                <p className="text-xs font-bold text-amber-900 leading-snug break-words">
                  {sessionData.notes}
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Cột phải (Vé thanh toán) - chiếm 3 cột (25%) */}
        <div className="space-y-2 lg:col-span-3 flex flex-col">

          

          {/* VÉ ĐIỆN TỬ THANH TOÁN */}
          <div className="relative rounded-2xl border border-slate-200 bg-white p-2.5 shadow-sm overflow-hidden flex flex-col gap-2 border-t-4 border-t-indigo-600">
            {/* Punch hole trang trí */}
            <div className="absolute left-0 top-1/3 -translate-y-1/2 -ml-2.5 w-5 h-5 rounded-full bg-[#f8fafc] border-r border-slate-200/80 z-10"></div>
            <div className="absolute right-0 top-1/3 -translate-y-1/2 -mr-2.5 w-5 h-5 rounded-full bg-[#f8fafc] border-l border-slate-200/80 z-10"></div>

            {/* Header vé */}
            <div className="text-center border-b border-dashed border-slate-200 pb-2.5">
              <h4 className="font-extrabold text-xs text-slate-900 tracking-wider">SMART PAYMENT TICKET</h4>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                CỔNG RA: {exitGates.find(g => g.id === selectedGateId)?.gateName.toUpperCase() || "CHƯA CHỌN CỔNG"}
              </p>
            </div>

            {/* Warning lệch biển số */}
            {sessionData && plateInput && plateInput.trim() !== "" && (sessionData.licensePlate || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase() !== (plateInput || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase() && (
              <div className="mx-1 my-1 border border-rose-250 bg-rose-50 rounded-xl p-1.5 text-center text-rose-700 animate-pulse flex flex-col items-center gap-0.5 shadow-sm">
                <AlertTriangleIcon className="w-5 h-5 text-rose-600" />
                <h5 className="font-black text-[15px] uppercase tracking-wider">Lệch biển số</h5>
                <p className="text-[10px] text-slate-600 leading-tight font-medium">Biển xe vào và ra không trùng khớp!</p>
              </div>
            )}

            {/* Chi tiết thông tin vé */}
            <div className="space-y-1.5 text-[11px] font-semibold text-slate-500 pt-1">
              <div className="flex justify-between items-center">
                <span>Mã phiên gửi:</span>
                <span className="text-slate-600 font-mono font-bold">
                  {sessionData?.sessionCode ? `#${sessionData.sessionCode}` : "---"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>Biển số xe:</span>
                <span className="text-slate-600 text-xs font-black tracking-wide uppercase px-2 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono">
                  {formatLicensePlate(sessionData?.licensePlate, sessionData?.vehicleType) || "---"}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Phương tiện:</span>
                <span className="text-slate-600 font-extrabold">{sessionData?.vehicleType || "---"}</span>
              </div>

            <div className="flex justify-between">
                <span>Loại vé:</span>
                <span className="text-slate-600 font-extrabold text-indigo-600">
                  {sessionData ? getTicketTypeLabel(sessionData.driverType, sessionData.passType) : "---"}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Vị trí đỗ:</span>
                <span className="text-slate-600 font-extrabold">
                  {sessionData?.floorName && sessionData?.zoneName
                    ? `${sessionData.floorName} - ${sessionData.zoneName}`
                    : "---"}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Thời gian vào:</span>
                <span className="text-slate-800 font-mono text-[10px] font-bold">
                  {sessionData?.entryTime ? formatDateTime(sessionData.entryTime) : "---"}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Thời gian ra:</span>
                <span className="text-slate-800 font-mono text-[10px] font-bold">
                  {scannedExitTime ? formatDateTime(scannedExitTime) : "---"}
                </span>
              </div>

              

              <div className="flex justify-between">
                <span>Thời gian gửi:</span>
                <span className="text-slate-600 font-extrabold">
                  {formatDuration(sessionData?.durationMinutes)}
                </span>
              </div>

              {sessionData?.customerName && (
                <div className="flex justify-between">
                  <span>Khách hàng:</span>
                  <span className="text-slate-600 font-bold text-indigo-650">{sessionData.customerName}</span>
                </div>
              )}

              <div className="border-t border-dashed border-slate-200 pt-2 flex flex-col">
                <span className="text-[9px] text-slate-400 uppercase font-bold">Tổng thanh toán:</span>
                <span className="text-lg font-black text-slate-600 mt-0.5">
                  {sessionData ? formatFee(sessionData.totalFee) : "0đ"}
                </span>
              </div>

              <div className="border-t border-dashed border-slate-200 pt-2 text-center text-[9px] text-slate-400 font-medium leading-normal mt-1">
                Cảm ơn và chúc quý khách thượng lộ bình an!
                <br />
                Hẹn gặp lại quý khách!
              </div>
            </div>
          </div>

          {/* PHƯƠNG THỨC THANH TOÁN */}
          <div className="rounded-2xl border border-slate-200 bg-white p-0 shadow-sm space-y-1">

            {paymentMethod === "BANK_TRANSFER" && sessionData && (
              <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-2 flex flex-col items-center gap-2 mt-0">
                <span className="text-[8px] text-indigo-800 font-extrabold uppercase tracking-wide">Quét mã thanh toán</span>
                <div className="p-1 bg-white rounded border border-slate-100 flex items-center justify-center shadow-inner">
                  <img
                    src={`https://api.vietqr.io/image/970422-0974114657-compact.png?amount=${sessionData.totalFee}&addInfo=${encodeURIComponent(sessionData.sessionCode || sessionData.licensePlate)}&accountName=TRAN%20NGUYEN%20MINH%20AN`}
                    alt="VietQR Invoice"
                    className="w-[185px] h-[185px] object-contain"
                    onError={(e) => {
                      e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`STK: 0974114657 | MB BANK | TRAN NGUYEN MINH AN | So tien: ${sessionData.totalFee}`)}`;
                    }}
                  />
                </div>
              </div>
            )}
            <label className="block text-[9px] font-black uppercase tracking-wider text-slate-600 text-center mt-1">Phương thức thanh toán</label>
            <div className="grid grid-cols-2 gap-4 px-3 ">
              <button
                type="button"
                onClick={() => setPaymentMethod("CASH")}
                className={`rounded-xl border py-1.5 font-bold transition-all text-[11px] flex items-center justify-center gap-1 cursor-pointer shadow-sm ${paymentMethod === "CASH"
                  ? "border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm border-2"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  }`}
              >
                💵 Tiền mặt
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("BANK_TRANSFER")}
                className={`rounded-xl border py-1.5 font-bold transition-all text-[11px] flex items-center justify-center gap-1 cursor-pointer shadow-sm ${paymentMethod === "BANK_TRANSFER"
                  ? "border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm border-2"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  }`}
              >
                ▣ VietQR CK
              </button>
            </div>


          </div>

          {/* Nút Check-out */}
          <div className="w-full">
            <button
              onClick={handleCheckOut}
              disabled={isSubmitting || !sessionData}
              className="w-full rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow-md hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>Đang xử lý check-out...</>
              ) : (
                <>XÁC NHẬN & CHECK-OUT ➔</>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Lịch sử check-out hôm nay */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm mt-4">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left cursor-pointer outline-none border-b border-transparent"
        >
          <div>
            <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              Lịch sử check-out hôm nay ({checkoutHistory.length})
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Click để xem các phương tiện đã hoàn tất thủ tục xuất bãi gần đây</p>
          </div>
          <span className={`text-slate-500 font-bold transition-transform duration-200 ${showHistory ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>


        {showHistory && (
          <div className="overflow-x-auto border-t border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Thời gian ra</th>
                  <th className="px-6 py-4">Biển số</th>
                  <th className="px-6 py-4">Loại xe</th>
                  <th className="px-6 py-4">Tổng phí</th>
                  <th className="px-6 py-4">Hình thức thanh toán</th>
                  <th className="px-6 py-4 text-right">Biên lai</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {checkoutHistory.map((row, index) => (
                  <tr key={row[5]?.sessionId || row[5]?.sessionCode || index} className="hover:bg-slate-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 text-slate-500 font-medium font-mono">
                      {row[0]}
                    </td>
                    <td className="px-6 py-4">
                      <LicensePlate plate={row[1]} vehicleType={row[2]} />
                    </td>
                    <td className="px-6 py-4 text-slate-655 font-semibold">
                      {row[2]}
                    </td>
                    <td className="px-6 py-4 text-slate-800 font-bold">
                      {row[3]}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 border border-slate-200">
                        {row[4]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          if (row[5]) {
                            const sObj = row[5];
                            setCheckOutResult({
                              sessionCode: sObj.sessionCode || `PS-${sObj.id?.slice(0, 6).toUpperCase()}`,
                              licensePlate: sObj.licensePlate,
                              durationMinutes: sObj.durationMinutes || Math.round((new Date(sObj.exitTime || Date.now()).getTime() - new Date(sObj.entryTime || Date.now() - 300000).getTime()) / 60000),
                              totalFee: sObj.totalFee,
                              vehicleType: sObj.vehicleType,
                              exitGate: sObj.exitGateName || "Cổng chính - Lối ra",
                              entryTime: sObj.entryTime,
                              exitTime: sObj.exitTime,
                              zoneCode: sObj.zoneCode,
                              floorName: sObj.floorName,
                              driverType: sObj.driverType,
                              passType: sObj.passType,
                            });
                            setPaymentMethod(sObj.paymentMethod || "CASH");
                            setShowSuccess(true);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100 hover:border-indigo-200 rounded-xl transition-all duration-150 cursor-pointer"
                      >
                        
                        Xem biên lai
                      </button>
                    </td>
                  </tr>
                ))}
                {checkoutHistory.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-400 font-semibold text-sm">
                      Chưa có xe nào check-out trong ngày hôm nay.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Success Receipt Modal */}
      {showSuccess && checkOutResult && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm overflow-y-auto">

          {/* Big Success Message */}
          <div className="mb-3 flex flex-col items-center animate-scale-in text-center mt-8">
            <div className="flex items-center justify-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white text-3xl shadow-lg shadow-emerald-500/30 pb-1">
                ✓
              </div>
              <h2 className="text-2xl font-black text-green-400 tracking-wide drop-shadow-md uppercase">Check-out Thành Công</h2>
            </div>
            <p className="text-emerald-50 font-medium mt-2 text-sm max-w-xs">Barie đã mở. Xe có thể di chuyển ra ngoài bãi.</p>
          </div>

          {/* Ticket */}
          <div className="relative w-full max-w-xs overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl flex flex-col gap-1 animate-scale-in mb-5">
            {/* Punch hole trang trí */}
            <div className="absolute left-0 top-[110px] -ml-2.5 w-5 h-5 rounded-full bg-slate-800 z-10"></div>
            <div className="absolute right-0 top-[110px] -mr-2.5 w-5 h-5 rounded-full bg-slate-800 z-10"></div>

            {/* Nút đóng góc trên phải */}
            <button
              onClick={() => {
                setShowSuccess(false);
                setCheckOutResult(null);
                setSessionData(null);
                setSearchPlate("");
              }}
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
                HOÀN TẤT CHECK-OUT
              </p>
            </div>

            {/* Chi tiết thông tin vé */}
            <div className="space-y-2 text-xs font-semibold text-slate-500 pt-1">
              <div className="flex justify-between items-center">
                <span>Mã phiên gửi:</span>
                <span className="text-slate-600 font-mono font-bold">
                  #{checkOutResult.sessionCode}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Biển số xe:</span>
                <span className="text-slate-600 text-xs font-black tracking-wide uppercase px-2 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono">
                  {formatLicensePlate(checkOutResult.licensePlate, checkOutResult.vehicleType)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Loại xe:</span>
                <span className="text-slate-600 font-extrabold">
                  {checkOutResult.vehicleType}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Vị trí đỗ:</span>
                <span className="text-slate-600 font-extrabold">
                  {checkOutResult.zoneCode ? `${checkOutResult.floorName}-ZONE-${checkOutResult.zoneCode}` : "--"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Thời gian vào:</span>
                <span className="text-slate-600 font-mono text-[11px] font-bold">
                  {checkOutResult.entryTime ? formatDateTime(checkOutResult.entryTime) : "---"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Thời gian ra:</span>
                <span className="text-slate-600 font-mono text-[11px] font-bold">
                  {checkOutResult.exitTime ? formatDateTime(checkOutResult.exitTime) : "---"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Thời gian gửi:</span>
                <span className="text-slate-600 font-extrabold">
                  {formatDuration(checkOutResult.durationMinutes)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Loại vé:</span>
                <span className="text-slate-600 font-extrabold">
                  {getTicketTypeLabel(checkOutResult?.driverType, checkOutResult?.passType)}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Hình thức:</span>
                <span className="text-slate-600 font-extrabold">
                  {paymentMethod === "BANK_TRANSFER" ? "VietQR CK" : "Tiền mặt"}
                </span>
              </div>

              <div className="border-t border-dashed border-slate-200 pt-3 flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-bold">
                  Tổng thanh toán:
                </span>
                <span className="text-xl font-black text-slate-600 mt-0.5">
                  {formatFee(checkOutResult.totalFee)}
                </span>
              </div>

              <div className="border-t border-dashed border-slate-200 pt-3 text-center text-[10px] text-slate-400 font-medium leading-normal mt-1">
                Cảm ơn và chúc quý khách thượng lộ bình an!
                <br />
                Hẹn gặp lại quý khách!
              </div>
            </div>

            {/* Nút hành động */}
            <div className="flex gap-5 border-t border-slate-100 pt-1 mt-3 text-sm">
              <button
                onClick={handlePrint}
                className="flex-1 rounded-xl bg-slate-800 py-1 font-bold text-white hover:bg-slate-800 text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
               In hóa đơn
              </button>

              <button
                onClick={() => {
                  setShowSuccess(false);
                  setCheckOutResult(null);
                  setSessionData(null);
                  setSearchPlate("");
                }}
                className="flex-1 rounded-xl border border-slate-250 py-2.5 font-semibold text-slate-650 hover:bg-slate-50 text-xs transition-colors cursor-pointer"
              >
                Đóng
              </button>


            </div>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </section>
  );
}
