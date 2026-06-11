import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { staffApi } from "../../api/parkingApi";
import { isValidVietnamLicensePlate, normalizeLicensePlate, LICENSE_PLATE_HINT } from "../../utils/licensePlate";
import gsap from "gsap";

// Icons tùy chỉnh dạng SVG cao cấp phục vụ thiết kế giao diện Glassmorphism
const IconDashboard = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const IconMap = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const IconCheckIn = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </svg>
);

const IconCheckOut = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconHistory = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconLogout = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const IconBell = () => (
  <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const IconSettings = () => (
  <svg className="w-6 h-6 text-slate-500 hover:rotate-45 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0a3 3 0 01-6 0z" />
  </svg>
);

const IconPrinter = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

/**
 * StaffCheckIn — Trang tác vụ Check-in xe vào bãi của Nhân viên.
 */
export default function StaffCheckIn({ onLogout }) {
  // Lấy thông tin user hiện tại từ localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const fullName = user.fullName || "Nguyễn Văn A";
  const userRole = user.role || "STAFF";
  const roleLabel = userRole === "STAFF" ? "Nhân viên bãi xe" : (userRole === "ADMIN" ? "Quản trị viên" : (userRole === "MANAGER" ? "Quản lý" : "Tài xế"));
  const avatarChar = fullName.charAt(0).toUpperCase();

  // Các state quản lý trạng thái
  const [isSuccess, setIsSuccess] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState("ĐANG CHỜ QUÉT...");
  const [collapsed, setCollapsed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [checkInResult, setCheckInResult] = useState(null);
  const [ticketCode, setTicketCode] = useState("");
  const scannerRef = useRef(null);

  // Config bãi xe tải từ Backend
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [gates, setGates] = useState([]);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Widget thời gian realtime
  const [liveTime, setLiveTime] = useState(new Date().toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [liveDate, setLiveDate] = useState("");

  // Dữ liệu form Check-in
  const [formData, setFormData] = useState({
    plateNumber: "",
    vehicleTypeId: "",
    gateEntryId: "",
    reservationCode: "",
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

  // Reference phục vụ GSAP Animations
  const containerRef = useRef(null);

  // Hiệu ứng GSAP mượt mà lúc tải trang
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Sidebar slide-in
      gsap.fromTo(".aside-panel",
        { x: -120, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.9, ease: "power4.out" }
      );

      // 2. Main content area fade-in
      gsap.fromTo(".main-content-area",
        { opacity: 0 },
        { opacity: 1, duration: 0.6 }
      );

      // 3. Stagger animate các link menu điều hướng
      gsap.fromTo(".nav-link-item",
        { x: -40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out", delay: 0.25 }
      );

      // 4. Welcome banner trồi lên kèm bounce nhẹ
      gsap.fromTo(".welcome-banner",
        { scale: 0.96, opacity: 0, y: 15 },
        { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: "back.out(1.15)", delay: 0.3 }
      );

      // 5. Stat cards hiệu ứng trồi
      gsap.fromTo(".stat-card-item",
        { y: 35, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.65, stagger: 0.07, ease: "power3.out", delay: 0.45 }
      );

      // 6. Action panels
      gsap.fromTo(".action-panel-item",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.75, stagger: 0.1, ease: "power3.out", delay: 0.65 }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Truy vấn thông tin đặt chỗ trước
  const handleFetchBookingInfo = () => {
    if (!formData.reservationCode || !formData.reservationCode.trim()) {
      alert("Vui lòng nhập mã đặt chỗ trước!");
      return;
    }
    setFormData(prev => ({ ...prev, driverType: "PRE_BOOKED" }));
    alert("Ghi nhận mã Reservation thành công. Hệ thống sẽ tự khớp thông tin biển số và loại xe khi bạn check-in.");
  };

  // --- Nhận diện biển số xe AI OCR thông qua webcam và Tesseract.js ---
  const [activeTab, setActiveTab] = useState("qr");
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState("");
  const [ocrStream, setOcrStream] = useState(null);
  const [isOcrCameraOn, setIsOcrCameraOn] = useState(false);

  const ocrVideoRef = useRef(null);
  const ocrCanvasRef = useRef(null);

  // Tải thư viện Tesseract.js động từ CDN
  useEffect(() => {
    if (!window.Tesseract) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/tesseract.js@v4.0.1/dist/tesseract.min.js";
      script.async = true;
      script.onload = () => {
        console.log("Tesseract.js loaded successfully from CDN");
      };
      document.body.appendChild(script);
    }
  }, []);

  // Cleanup camera stream khi thoát trang
  useEffect(() => {
    return () => {
      if (ocrStream) {
        ocrStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [ocrStream]);

  // Bật camera cho tác vụ OCR
  const startOcrCamera = async () => {
    try {
      setIsOcrCameraOn(true);
      setOcrResult("Đang kết nối camera...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      setOcrStream(stream);
      if (ocrVideoRef.current) {
        ocrVideoRef.current.srcObject = stream;
        ocrVideoRef.current.play();
      }
      setOcrResult("Camera hoạt động! Đưa biển số trước cam.");
    } catch (err) {
      console.error("Lỗi bật camera OCR:", err);
      setOcrResult("❌ Lỗi truy cập Camera.");
      setIsOcrCameraOn(false);
    }
  };

  // Tắt camera OCR
  const stopOcrCamera = () => {
    if (ocrStream) {
      ocrStream.getTracks().forEach(track => track.stop());
      setOcrStream(null);
    }
    setIsOcrCameraOn(false);
    setOcrResult("Camera đã tắt.");
  };

  // Chụp ảnh webcam và thực hiện giải thuật nhận diện OCR kèm binarization nâng cao
  const captureAndOcr = async () => {
    if (!ocrVideoRef.current || !window.Tesseract) {
      setOcrResult("⚠️ Thiết bị chưa sẵn sàng!");
      return;
    }

    setOcrScanning(true);
    setOcrResult("AI đang phân tích biển số...");

    try {
      const video = ocrVideoRef.current;
      const canvas = ocrCanvasRef.current || document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // --- Tiền xử lý ảnh (Computer Vision Binarization) ---
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const grayscale = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const binary = grayscale < 125 ? 0 : 255;
        data[i] = binary;     // R
        data[i + 1] = binary; // G
        data[i + 2] = binary; // B
      }
      ctx.putImageData(imgData, 0, 0);

      // Gửi ảnh đã nhị phân hóa cho Tesseract OCR Engine
      const { data: { text } } = await window.Tesseract.recognize(
        canvas,
        'eng',
        { logger: m => console.log(m) }
      );

      console.log("OCR Raw Text:", text);

      // Dọn dẹp ký tự rác
      let cleanedText = text.replace(/[^a-zA-Z0-9-\n\s]/g, "").toUpperCase();
      let lines = cleanedText.split("\n").map(l => l.trim()).filter(l => l.length >= 2);

      let matchedPlate = "";

      if (lines.length > 0) {
        let rawCandidate = lines.join("").replace(/\s/g, "").replace(/-/g, "");

        // Giải thuật tự động sửa lỗi nhận diện sai chữ-số phổ biến
        let chars = rawCandidate.split("");
        for (let i = 0; i < chars.length; i++) {
          if (i < 2 || i >= 4) { // Phần số
            if (chars[i] === 'O' || chars[i] === 'D' || chars[i] === 'Q') chars[i] = '0';
            else if (chars[i] === 'I' || chars[i] === 'L') chars[i] = '1';
            else if (chars[i] === 'Z') chars[i] = '2';
            else if (chars[i] === 'S') chars[i] = '5';
            else if (chars[i] === 'G') chars[i] = '6';
            else if (chars[i] === 'B') chars[i] = '8';
          } else if (i === 2) { // Ký tự sê-ri thứ 3 phải là CHỮ CÁI
            if (chars[i] === '0') chars[i] = 'D';
            else if (chars[i] === '1') chars[i] = 'I';
            else if (chars[i] === '5') chars[i] = 'S';
            else if (chars[i] === '8') chars[i] = 'B';
            else if (chars[i] === '2') chars[i] = 'Z';
          }
        }

        const normalizedCandidate = chars.join("");
        console.log("Normalized Candidate:", normalizedCandidate);

        // Áp dụng biểu thức chính quy (Regex) khớp chuẩn cấu trúc biển số Việt Nam
        const bikeRegex = /([0-9]{2})([A-Z])([0-9A-Z])([0-9]{4,5})/;
        const matchBike = normalizedCandidate.match(bikeRegex);

        const carRegex = /([0-9]{2})([A-Z])([0-9]{4,5})/;
        const matchCar = normalizedCandidate.match(carRegex);

        if (matchBike) {
          const [fullMatch, tinh, series1, series2, stt] = matchBike;
          const formattedStt = stt.length === 5 ? `${stt.slice(0, 3)}.${stt.slice(3)}` : stt;
          matchedPlate = `${tinh}${series1}${series2}-${formattedStt}`;
        } else if (matchCar) {
          const [fullMatch, tinh, series, stt] = matchCar;
          const formattedStt = stt.length === 5 ? `${stt.slice(0, 3)}.${stt.slice(3)}` : stt;
          matchedPlate = `${tinh}${series}-${formattedStt}`;
        } else {
          matchedPlate = normalizedCandidate.slice(0, 9);
        }
      }

      if (matchedPlate) {
        matchedPlate = matchedPlate.slice(0, 11);

        // Tự động thêm dấu gạch ngang phân tách
        if (matchedPlate.length >= 4 && !matchedPlate.includes("-")) {
          const letterMatch = matchedPlate.match(/[A-Z]/);
          if (letterMatch) {
            const idx = matchedPlate.indexOf(letterMatch[0]) + 1;
            matchedPlate = matchedPlate.slice(0, idx) + "-" + matchedPlate.slice(idx);
          }
        }

        // Tự động chọn loại xe tương ứng với biển số nhận diện được
        let targetType = "ô tô";
        if (matchedPlate.includes("A1") || matchedPlate.includes("B1") || matchedPlate.includes("E1") || matchedPlate.includes("F1")) {
          targetType = "máy";
        }
        const vt = vehicleTypes.find(v => v.name.toLowerCase().includes(targetType));

        setFormData(prev => ({
          ...prev,
          plateNumber: matchedPlate,
          vehicleTypeId: vt?.id || prev.vehicleTypeId,
          driverType: "WALK_IN",
          reservationCode: ""
        }));

        setOcrResult(`✅ Nhận dạng: ${matchedPlate}`);
      } else {
        setOcrResult(`❌ Không tìm thấy biển số.`);
      }
    } catch (err) {
      console.error("Lỗi phân tích OCR:", err);
      setOcrResult("❌ Lỗi xử lý ảnh.");
    } finally {
      setOcrScanning(false);
    }
  };

  // Hàm mô phỏng quét biển số dùng cho Demo nhanh không cần webcam
  const handleOcrScan = (vehicleTypeChoice) => {
    setOcrScanning(true);
    setOcrResult("Đang phân tích giả lập...");

    setTimeout(() => {
      let plate = "30G-888.88";
      let targetType = "ô tô";

      if (vehicleTypeChoice === "motorbike") {
        plate = "59A1-999.99";
        targetType = "máy";
      }

      const vt = vehicleTypes.find(v => v.name.toLowerCase().includes(targetType));

      setFormData(prev => ({
        ...prev,
        plateNumber: plate,
        vehicleTypeId: vt?.id || prev.vehicleTypeId,
        driverType: "WALK_IN",
        reservationCode: ""
      }));

      setOcrScanning(false);
      setOcrResult(`✅ Nhận diện giả lập: ${plate}`);
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
        if (entryGates.length > 0) {
          setFormData(prev => ({ ...prev, gateEntryId: entryGates[0].id }));
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
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => { });
      }
    };
  }, []);

  // Xử lý thông tin giải mã từ QR
  const parseQrData = (qrText) => {
    if (!qrText) return;

    let targetPlate = "";
    let targetReservation = "";
    let matchedVehicleTypeId = formData.vehicleTypeId || (vehicleTypes[0]?.id || "");
    let matchedGateId = formData.gateEntryId || (gates[0]?.id || "");

    try {
      // Phân tích nếu QR có dạng JSON
      const data = JSON.parse(qrText);
      targetPlate = data.plateNumber || data.licensePlate || "";
      targetReservation = data.reservationCode || data.bookingCode || "";

      if (data.vehicleTypeId) {
        matchedVehicleTypeId = data.vehicleTypeId;
      } else {
        const vDesc = (data.vehicleType || "car").toLowerCase();
        const matchVehicle = vehicleTypes.find(v => {
          const vName = v.name.toLowerCase();
          return vName.includes(vDesc) || vDesc.includes(vName) ||
            (vDesc === "car" && vName.includes("t")) ||
            (vDesc === "motorbike" && vName.includes("my"));
        });
        if (matchVehicle) {
          matchedVehicleTypeId = matchVehicle.id;
        }
      }

      setFormData(prev => ({
        ...prev,
        plateNumber: targetPlate,
        reservationCode: targetReservation,
        vehicleTypeId: matchedVehicleTypeId,
        gateEntryId: matchedGateId,
        driverType: targetReservation ? "PRE_BOOKED" : prev.driverType
      }));

      setScanMessage("ĐỒNG BỘ QR THÀNH CÔNG");
    } catch (e) {
      // Phân tích nếu QR là chuỗi thô
      setFormData((prev) => ({
        ...prev,
        plateNumber: qrText.length < 15 ? qrText : prev.plateNumber,
        reservationCode: qrText.startsWith("RS") ? qrText : prev.reservationCode,
        vehicleTypeId: matchedVehicleTypeId,
        gateEntryId: matchedGateId
      }));

      setScanMessage("ĐÃ NHẬN QR DẠNG CHUỖI");
    }
  };

  // Khởi động Camera quét QR
  const startScanner = async () => {
    try {
      setIsScanning(true);
      setScanMessage("ĐANG KHỞI ĐỘNG CAMERA...");

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 220, height: 260 },
        },
        async (decodedText) => {
          parseQrData(decodedText);
          if (scannerRef.current) {
            await scannerRef.current.stop();
            scannerRef.current.clear();
            scannerRef.current = null;
          }
          setIsScanning(false);
        },
        () => { }
      );

      setScanMessage("VUI LÒNG ĐƯA MÃ QR VÀO KHUNG HÌNH");
    } catch (error) {
      console.error(error);
      setScanMessage("LỖI KHỞI ĐỘNG CAMERA");
      setIsScanning(false);
    }
  };

  // Tắt camera quét QR
  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
    setScanMessage("CAMERA ĐÃ TẮT");
  };

  // Xử lý gửi API Check-in lên Java Spring Boot Backend
  const handleCheckIn = async () => {
    const normalizedPlate = normalizeLicensePlate(formData.plateNumber);
    if (!normalizedPlate) {
      setApiError('Vui lòng cung cấp biển số xe');
      return;
    }
    if (!isValidVietnamLicensePlate(normalizedPlate)) {
      setApiError(LICENSE_PLATE_HINT);
      return;
    }
    if (!formData.vehicleTypeId || !formData.gateEntryId) {
      setApiError('Vui lòng chọn loại xe và cổng vào tương ứng');
      return;
    }

    setIsSubmitting(true);
    setApiError('');

    try {
      const res = await staffApi.checkIn({
        licensePlate: normalizedPlate,
        vehicleTypeId: formData.vehicleTypeId,
        gateEntryId: formData.gateEntryId,
        reservationCode: formData.reservationCode || null,
        driverType: formData.driverType,
        notes: formData.notes || null,
      });

      const backendSession = res.data.data;
      setCheckInResult(backendSession);
      setTicketCode(backendSession.sessionCode);
      setIsSuccess(true);

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
    const staffRow = `
            <div class="info-row">
              <span>Nhân viên trực:</span>
              <span class="info-value">${fullName}</span>
            </div>
    `;

    const ticketHtml = `
      <html>
        <head>
          <title>In Vé Xe - SmartParking</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              text-align: center;
              padding: 20px;
              color: #000;
              background: #fff;
            }
            .ticket-container {
              border: 2px dashed #000;
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
            }
            .qr-code {
              margin: 15px auto;
              width: 150px;
              height: 150px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              margin: 5px 0;
              border-bottom: 1px dotted #ccc;
              padding-bottom: 3px;
            }
            .info-value {
              font-weight: bold;
            }
            .footer {
              font-size: 10px;
              margin-top: 15px;
              border-top: 1px dashed #000;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="ticket-container">
            <div class="header">SMART PARKING</div>
            <div class="subtitle">Vé gửi xe vào</div>
            <img class="qr-code" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticketCode}" />
            <div class="info-row">
              <span>Mã vé:</span>
              <span class="info-value">${ticketCode}</span>
            </div>
            <div class="info-row">
              <span>Biển số:</span>
              <span class="info-value">${formData.plateNumber}</span>
            </div>
            <div class="info-row">
              <span>Loại xe:</span>
              <span class="info-value">${getVehicleLabel(formData.vehicleTypeId)}</span>
            </div>
            <div class="info-row">
              <span>Thời gian:</span>
              <span class="info-value">${new Date(checkInResult?.entryTime || Date.now()).toLocaleString("vi-VN")}</span>
            </div>
            <div class="info-row">
              <span>Cổng vào:</span>
              <span class="info-value">${activeGateName}</span>
            </div>
            ${checkInResult?.zoneName ? `
            <div class="info-row">
              <span>Vị trí đỗ:</span>
              <span class="info-value">${checkInResult.floorName} - ${checkInResult.zoneName}</span>
            </div>
            ` : ""}
            ${staffRow}
            <div class="footer">
              Chúc quý khách thượng lộ bình an!<br/>
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
    <div ref={containerRef} className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans">
      {/* Sidebar - Chủ đề Sleek Dark Glassmorphism */}
      <aside
        className={`aside-panel fixed left-0 top-0 bottom-0 z-50 flex h-screen flex-col bg-slate-900 text-white shadow-xl transition-all duration-300 ${collapsed ? "w-20" : "w-72"}`}
      >
        <div className="flex items-center gap-3.5 px-6 py-6 border-b border-slate-800 overflow-hidden">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20 font-black text-lg flex-shrink-0 cursor-pointer"
          >
            P
          </button>
          {!collapsed && (
            <div className="animate-fade-in-fast">
              <h1 className="text-md font-extrabold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent whitespace-nowrap">
                Smart Parking
              </h1>
              <p className="text-xs text-blue-400 font-semibold tracking-wider uppercase whitespace-nowrap">
                Cổng nhân viên
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1.5 px-4 py-6 overflow-x-hidden">
          <SideLink collapsed={collapsed} to="/staff/dashboard" icon={<IconDashboard />} label="Bảng điều khiển" />
          <SideLink collapsed={collapsed} to="/staff/map" icon={<IconMap />} label="Sơ đồ bãi xe" />
          <SideLink collapsed={collapsed} to="/staff/check-in" icon={<IconCheckIn />} label="Check-in xe vào" active />
          <SideLink collapsed={collapsed} to="/staff/check-out" icon={<IconCheckOut />} label="Check-out xe ra" />
          <SideLink collapsed={collapsed} to="/staff/history" icon={<IconHistory />} label="Lịch sử phiên gửi" />
          <SideLink collapsed={collapsed} to="/staff/3d-map" icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 00-1-1.732l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.732l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3.3 7L12 12l8.7-5M12 22V12" /></svg>} label="Mô phỏng 3D" />
        </nav>

        <div className="border-t border-slate-800 p-4 overflow-hidden">
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-all duration-200 cursor-pointer"
          >
            <IconLogout />
            {!collapsed && <span className="whitespace-nowrap">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main
        className={`main-content-area flex-1 min-h-screen flex flex-col transition-all duration-300 ${collapsed ? "ml-20" : "ml-72"}`}
      >
        {/* Header bar */}
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/80 px-8 backdrop-blur-md relative">
          {/* Cột bên trái: Tiêu đề và Ngày tháng */}
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-900">Check-in xe vào bãi</h2>
            <p className="text-xs text-slate-500 mt-0.5">{liveDate}</p>
          </div>

          {/* Phần lỗi: Nằm chính giữa Header, ngang hàng và không làm xê dịch bố cục hai bên */}
          {apiError && (
            <div className="absolute left-3/7 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex items-center gap-0 rounded-xl bg-rose-50 border border-rose-200 px-2 py-2.5 text-xs font-bold text-rose-700 shadow-sm max-w-[200px] sm:max-w-sm md:max-w-md lg:max-w-lg truncate animate-pulse">
              <span className="shrink-0">⚠️</span>
              <span className="truncate">{apiError}</span>
              <button
                onClick={() => setApiError("")}
                className="ml-2 text-rose-400 hover:text-rose-600 transition-colors font-bold text-base leading-none shrink-0 cursor-pointer"
              >
                &times;
              </button>
            </div>
          )}

          {/* Cột bên phải: Thời gian và Thông tin User */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end border-r border-slate-200 pr-6">
              <span className="font-mono text-lg font-bold text-indigo-600 bg-indigo-50/50 px-3 py-1 rounded-lg border border-indigo-100">
                {liveTime}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative rounded-full p-2.5 hover:bg-slate-100/80 transition-colors cursor-pointer">
                <IconBell />
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              </button>

              <button className="rounded-full p-2.5 hover:bg-slate-100/80 transition-colors cursor-pointer">
                <IconSettings />
              </button>
            </div>

            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <div className="text-right">
                <p className="font-semibold text-sm text-slate-900">{fullName}</p>
                <p className="text-xs text-slate-400 font-medium">{roleLabel}</p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 font-bold text-white shadow-md shadow-indigo-500/20">
                {avatarChar}
              </div>
            </div>
          </div>
        </header>

        {/* Content Section */}
        <section className="flex-1 space-y-6 p-1">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            {/* Cột trái (Máy quét camera và thông tin đầu vào) */}
            <div className="action-panel-item rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-3 flex flex-col overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => { stopOcrCamera(); setActiveTab("qr"); }}
                    className={`font-bold text-sm tracking-wide uppercase pb-1 border-b-2 transition-all cursor-pointer ${activeTab === "qr" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                  >
                    ▣ Quét mã QR
                  </button>
                  <button
                    type="button"
                    onClick={() => { stopScanner(); setActiveTab("ocr"); }}
                    className={`font-bold text-sm tracking-wide uppercase pb-1 border-b-2 transition-all cursor-pointer ${activeTab === "ocr" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                  >
                    Quét Biển số AI
                  </button>
                </div>

                {/* Đưa Trạng Thái Lên Trên Đầu */}
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm max-w-[240px] sm:max-w-xs md:max-w-md truncate">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${activeTab === "qr"
                    ? (isScanning ? 'bg-indigo-500 animate-pulse' : 'bg-slate-400')
                    : (ocrScanning ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500')
                    }`} />
                  <span className="text-slate-400 font-medium shrink-0">Trạng thái:</span>
                  <span className={`truncate ${activeTab === "qr" ? "text-indigo-600 font-extrabold" : "text-emerald-600 font-extrabold"}`}>
                    {activeTab === "qr" ? scanMessage : (ocrResult || "Camera sẵn sàng")}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4 flex-1">
                {activeTab === "qr" ? (
                  <div className="flex flex-row items-stretch gap-4">
                    {/* Các nút điều khiển hàng dọc bên trái quét */}
                    <div className={`flex flex-col gap-2.5 justify-center shrink-0 ${collapsed ? "w-44" : "w-32 sm:w-36"} transition-all duration-350`}>
                      <button
                        onClick={startScanner}
                        disabled={isScanning}
                        className={`rounded-xl bg-indigo-600 font-bold text-white shadow-md shadow-indigo-500/10 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all cursor-pointer text-center flex items-center justify-center ${collapsed ? "py-3 px-4 text-sm" : "py-2 px-2 text-xs"
                          }`}
                      >
                        Bật Máy Quét
                      </button>

                      <button
                        onClick={stopScanner}
                        disabled={!isScanning}
                        className={`rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer text-center flex items-center justify-center ${collapsed ? "py-3 px-4 text-sm" : "py-2 px-2 text-xs"
                          }`}
                      >
                        Tắt Camera
                      </button>
                    </div>

                    {/* Khung quét QR nhỏ gọn bên phải */}
                    <div className="flex-1 max-w-[470px] relative overflow-hidden rounded-2xl bg-slate-950 p-0 shadow-inner border border-slate-800 h-[280px]">
                      <div id="qr-reader" className="h-full w-full overflow-hidden rounded-xl bg-slate-900" />

                      {!isScanning && (
                        <div className="absolute inset-2 flex flex-col items-center justify-center rounded-xl bg-slate-950/95 text-center p-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-950 text-indigo-400 border border-indigo-500/30 text-2xl mb-2">
                            ▣
                          </div>
                          <p className="font-bold text-white text-xs">CAMERA ĐANG TẮT</p>
                          <p className="text-slate-400 text-[10px] mt-1 max-w-[200px] leading-tight">
                            Nhấn "Bật Máy Quét" ở bên trái để bắt đầu
                          </p>
                        </div>
                      )}

                      <div className="pointer-events-none absolute inset-4 border border-white/5">
                        <span className="absolute -left-1 -top-1 h-4 w-4 border-l-2 border-t-2 border-indigo-400" />
                        <span className="absolute -right-1 -top-1 h-4 w-4 border-r-2 border-t-2 border-indigo-400" />
                        <span className="absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2 border-indigo-400" />
                        <span className="absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2 border-indigo-400" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-row items-stretch gap-4">
                    {/* Các nút điều khiển hàng dọc bên trái quét OCR */}
                    <div className={`flex flex-col gap-2 justify-center shrink-0 ${collapsed ? "w-44" : "w-32 sm:w-36"} transition-all duration-350`}>
                      {!isOcrCameraOn ? (
                        <button
                          type="button"
                          onClick={startOcrCamera}
                          className={`rounded-xl bg-emerald-600 font-bold text-white shadow-md shadow-emerald-500/10 hover:bg-emerald-700 transition-all cursor-pointer text-center flex items-center justify-center ${collapsed ? "py-3 px-4 text-sm" : "py-2 px-2 text-xs"
                            }`}
                        >
                          Bật Camera OCR
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopOcrCamera}
                          className={`rounded-xl border border-slate-200 font-bold text-slate-650 hover:bg-slate-55 transition-all cursor-pointer text-center flex items-center justify-center ${collapsed ? "py-3 px-4 text-sm" : "py-2 px-2 text-xs"
                            }`}
                        >
                          Tắt Camera
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={captureAndOcr}
                        disabled={!isOcrCameraOn || ocrScanning}
                        className={`rounded-xl bg-indigo-600 font-bold text-white shadow-md shadow-indigo-500/10 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${collapsed ? "py-3 px-4 text-sm" : "py-2 px-2 text-xs"
                          }`}
                      >
                        Chụp & Nhận Diện
                      </button>

                      {/* Tích hợp các nút Mô phỏng vào chung cột dọc */}
                      <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-100">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center">Giả lập:</span>
                        <button
                          type="button"
                          onClick={() => handleOcrScan("motorbike")}
                          disabled={ocrScanning}
                          className="rounded-lg border border-indigo-100 bg-indigo-50/50 py-1 text-[9px] font-bold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition-all cursor-pointer"
                        >
                          🏍️ Xe máy (59A1)
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOcrScan("car")}
                          disabled={ocrScanning}
                          className="rounded-lg border border-emerald-100 bg-emerald-50/50 py-1 text-[9px] font-bold text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 transition-all cursor-pointer"
                        >
                          🚗 Ô tô (30G)
                        </button>
                      </div>
                    </div>

                    {/* Khung quét OCR nhỏ gọn bên phải */}
                    <div className="flex-1 max-w-[470px] relative overflow-hidden rounded-2xl bg-slate-950 p-0 shadow-inner border border-slate-800 h-[280px]">
                      <div className="h-full w-full overflow-hidden rounded-xl bg-slate-900 flex flex-col items-center justify-center text-center relative">
                        {isOcrCameraOn ? (
                          <video
                            ref={ocrVideoRef}
                            className="w-full h-full object-cover rounded-lg"
                            playsInline
                            muted
                          />
                        ) : (
                          <div className="p-4 flex flex-col items-center justify-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-2xl mb-2 animate-pulse">
                              📷
                            </div>
                            <p className="font-bold text-white text-xs">AI OCR ACTIVE</p>
                            <p className="text-slate-400 text-[10px] max-w-[200px] mt-1 leading-tight">
                              Sử dụng camera của bạn chụp lại biển số xe để AI tự động phân tích chữ
                            </p>
                          </div>
                        )}

                        {ocrScanning && (
                          <div className="absolute inset-0 bg-slate-950/85 flex flex-col items-center justify-center text-center p-4 z-10">
                            <div className="space-y-2">
                              <div className="relative w-36 h-20 bg-indigo-950/40 border border-indigo-500/30 rounded-lg overflow-hidden flex items-center justify-center mx-auto">
                                <span className="font-mono font-bold text-white tracking-wider text-xs animate-pulse">
                                  [ QUÉT BKS ]
                                </span>
                                <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-400 shadow-md shadow-indigo-500 animate-bounce" style={{ animationDuration: '1.2s' }} />
                              </div>
                              <p className="text-[10px] text-indigo-400 font-bold animate-pulse">AI đang phân tích...</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <canvas ref={ocrCanvasRef} className="hidden" />

                      <div className="pointer-events-none absolute inset-4 border border-white/5">
                        <span className="absolute -left-1 -top-1 h-4 w-4 border-l-2 border-t-2 border-emerald-400" />
                        <span className="absolute -right-1 -top-1 h-4 w-4 border-r-2 border-t-2 border-emerald-400" />
                        <span className="absolute -bottom-1 -left-1 h-4 w-4 border-b-2 border-l-2 border-emerald-400" />
                        <span className="absolute -bottom-1 -right-1 h-4 w-4 border-b-2 border-r-2 border-emerald-400" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Form nhập liệu thủ công xuất hiện ngay dưới mà không phải cuộn trang */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Biển số xe</label>
                    <input
                      value={formData.plateNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, plateNumber: normalizeLicensePlate(e.target.value) })
                      }
                      placeholder="Nhập biển số xe, Ví dụ: 30A-123.45"
                      className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-md font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Loại xe</label>
                      <select
                        value={formData.vehicleTypeId}
                        onChange={(e) =>
                          setFormData({ ...formData, vehicleTypeId: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer bg-white"
                      >
                        {vehicleTypes.map(vt => (
                          <option key={vt.id} value={vt.id}>{vt.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Cổng vào</label>
                      <select
                        value={formData.gateEntryId}
                        onChange={(e) =>
                          setFormData({ ...formData, gateEntryId: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer bg-white"
                      >
                        {gates.map(g => (
                          <option key={g.id} value={g.id}>{g.gateName}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Loại vé / Hình thức</label>
                      <select
                        value={formData.driverType}
                        onChange={(e) =>
                          setFormData({ ...formData, driverType: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer bg-white"
                      >
                        <option value="WALK_IN">Khách vãng lai (Vé lượt)</option>
                        <option value="PRE_BOOKED">Đăng ký đặt trước (Online)</option>
                        <option value="SUBSCRIBER">Vé tháng/quý/năm (Subscriber)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Mã đặt chỗ trước (nếu có)</label>
                      <div className="flex gap-2">
                        <input
                          value={formData.reservationCode}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              reservationCode: val,
                              driverType: val.trim() ? "PRE_BOOKED" : prev.driverType
                            }));
                          }}
                          placeholder="Mã reservation (nếu có)"
                          className="flex-1 rounded-xl border border-slate-200 px-4 py-3.5 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all bg-white"
                        />
                        <button
                          type="button"
                          onClick={handleFetchBookingInfo}
                          className="px-4 py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-xl text-xs whitespace-nowrap transition-colors border border-indigo-200 cursor-pointer"
                        >
                          Tìm Vé
                        </button>
                      </div>
                    </div>
                  </div>


                </div>
              </div>
            </div>

            {/* Cột phải (Thông tin Vé & Nút Xác nhận) */}
            <div className="space-y-3 lg:col-span-2 flex flex-col">
              {/* Vị trí đỗ gợi ý luôn hiển thị */}
              <div className="rounded-xl border border-emerald-150 bg-emerald-50/60 p-2.5 shadow-xs flex-shrink-0">
                <p className="font-bold text-emerald-900 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Vị trí đỗ đề xuất:
                  </span>
                  <span className="font-black text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                    {checkInResult ? `${checkInResult.floorName} - ${checkInResult.zoneName}` : "Chờ Check-in..."}
                  </span>
                </p>
              </div>

              {!formData.plateNumber ? (
                // Nếu chưa có biển số xe
                <div className="action-panel-item rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center justify-center text-center min-h-[300px]">
                  <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 text-slate-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 19.164l-.21-.21-3.414-3.414a2.25 2.25 0 00-3.182 0l-.21.21a2.25 2.25 0 000 3.182l3.414 3.414a2.25 2.25 0 003.183 0l.21-.21a2.25 2.25 0 000-3.182zM10.5 11.25a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-3.75 3.75M19.5 8.25L15 3.75M19.5 8.25h-6.75A2.25 2.25 0 0010.5 10.5v10.5" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Chưa có vé xe</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-[220px] leading-relaxed">
                    Vui lòng nhập hoặc nhận diện biển số xe ở bên trái để xuất vé gửi xe tự động.
                  </p>
                </div>
              ) : (
                // Khi đã có biển số xe
                <div className="action-panel-item flex flex-col gap-3">
                  {/* Vé điện tử phong cách Realistic Ticket */}
                  <div className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm overflow-hidden flex flex-col gap-2 border-t-4 border-t-indigo-600 mx-[20px]">
                    {/* Punch hole trang trí hai bên hông vé */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2.5 w-5 h-5 rounded-full bg-[#f8fafc] border-r border-slate-200 z-10"></div>
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 -mr-2.5 w-5 h-5 rounded-full bg-[#f8fafc] border-l border-slate-200 z-10"></div>

                    {/* Header vé */}
                    <div className="text-center border-b border-dashed border-slate-200 pb-2.5">
                      <h4 className="font-extrabold text-base text-slate-900 tracking-wider">SMART PARKING TICKET</h4>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                        CỔNG: {gates.find(g => g.id === formData.gateEntryId)?.gateName || "CHƯA CHỌN CỔNG"}
                      </p>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center justify-center py-1">
                      <div className="p-1.5 bg-white rounded-xl shadow-inner border border-slate-100 flex items-center justify-center">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${ticketCode}`}
                          alt="QR Ticket"
                          className="w-[85px] h-[85px] object-contain"
                        />
                      </div>
                      <span className="font-mono text-[10px] text-slate-500 font-extrabold tracking-wider mt-1.5">
                        {ticketCode || "PENDING_CODE"}
                      </span>
                    </div>

                    {/* Chi tiết thông tin vé */}
                    <div className="space-y-1.5 text-[11px] font-semibold text-slate-500 border-t border-dashed border-slate-200 pt-2.5">
                      <div className="flex justify-between items-center">
                        <span>Biển số xe:</span>
                        <span className="text-slate-900 text-xs font-black tracking-wide uppercase px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                          {formData.plateNumber}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span>Loại phương tiện:</span>
                        <span className="text-slate-900 font-extrabold">
                          {getVehicleLabel(formData.vehicleTypeId)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span>Hình thức gửi:</span>
                        <span className="text-slate-900 font-extrabold">
                          {formData.driverType === "SUBSCRIBER"
                            ? "Vé tháng (Premium)"
                            : formData.driverType === "PRE_BOOKED"
                              ? "Đặt trước online"
                              : "Khách vãng lai (Vé lượt)"}
                        </span>
                      </div>

                      {formData.reservationCode && (
                        <div className="flex justify-between text-indigo-600 font-extrabold">
                          <span>Mã đặt chỗ:</span>
                          <span>{formData.reservationCode}</span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span>Vị trí gợi ý:</span>
                        <span className="text-emerald-600 font-extrabold">
                          {checkInResult
                            ? `${checkInResult.zoneName} (${checkInResult.floorName})`
                            : "(Sẽ được phân bổ khi check-in)"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span>Thời gian vào:</span>
                        <span className="text-slate-900 font-mono font-extrabold">
                          {checkInResult
                            ? new Date(checkInResult.entryTime).toLocaleString("vi-VN")
                            : `${liveDate} - ${liveTime}`}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span>Nhân viên trực:</span>
                        <span className="text-slate-950 font-extrabold">
                          {fullName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Phần nút điều khiển (Xác nhận Check-in / Kết quả) */}
                  <div className="mx-[20px]">
                    {isSuccess && checkInResult ? (
                      <div className="rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 p-3.5 text-white shadow-md border border-emerald-500/20 animate-scale-in">
                        <div className="flex items-center gap-3.5 mb-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white font-bold text-base flex-shrink-0">
                            ✓
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm">Check-in thành công!</h4>
                            <p className="text-[11px] text-emerald-100 mt-0.5 leading-snug">{checkInResult.guideMessage}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={handlePrintTicket}
                            className="flex-1 bg-white text-emerald-700 border border-transparent font-bold text-xs py-2.5 rounded-lg cursor-pointer hover:bg-emerald-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
                          >
                            <IconPrinter /> In Vé
                          </button>
                          <button
                            onClick={() => {
                              setIsSuccess(false);
                              setCheckInResult(null);
                              setFormData(prev => ({ ...prev, plateNumber: '', reservationCode: '', notes: '' }));
                              setTicketCode("");
                            }}
                            className="flex-1 bg-emerald-700/80 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 rounded-lg cursor-pointer active:scale-[0.98] transition-all"
                          >
                            Xe tiếp theo ➕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleCheckIn}
                        disabled={isSubmitting || !configLoaded}
                        className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-md hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>Đang gửi lệnh check-in...</>
                        ) : (
                          <>
                            <IconPrinter /> XÁC NHẬN & CHECK-IN
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// Sidebar link helper component
function SideLink({ to, icon, label, active, collapsed }) {
  return (
    <Link
      to={to}
      className={`nav-link-item flex items-center gap-3 rounded-xl px-4 py-3 font-semibold transition-all duration-200 ${active
        ? "bg-slate-800 text-blue-400 border border-slate-700 shadow-inner"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
        }`}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="whitespace-nowrap">{label}</span>}
    </Link>
  );
}