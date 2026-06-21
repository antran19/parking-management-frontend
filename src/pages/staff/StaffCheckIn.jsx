import { useEffect, useRef, useState } from "react";
import { staffApi } from "../../api/parkingApi";
import { isValidVietnamLicensePlate, normalizeLicensePlate, LICENSE_PLATE_HINT, formatLicensePlate } from "../../utils/licensePlate";

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
      const storedBooking = JSON.parse(localStorage.getItem("driver_booking") || "null");
      if (storedBooking) {
        const bookingPlate = (storedBooking.licensePlate || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        if (bookingPlate === cleanPlate && (storedBooking.status === "CONFIRMED" || storedBooking.status === "PENDING" || !storedBooking.status)) {
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
  }, [formData.plateNumber]);

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
      stopFaceCamera();
      uploadFaceToCloudinary(blob);
    }, "image/jpeg", 0.6);
  };

  const uploadFaceToCloudinary = async (blob) => {
    try {
      setFaceUploading(true);
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

      const hasCloudinary = cloudName && uploadPreset &&
        cloudName !== "tên_cloud_name_của_bạn" &&
        uploadPreset !== "tên_unsigned_preset_của_bạn";

      if (!hasCloudinary) {
        console.warn("Chưa cấu hình Cloudinary. Demo: Lưu ảnh cục bộ.");
        setUploadedFaceUrl(URL.createObjectURL(blob));
        return;
      }

      const uploadData = new FormData();
      uploadData.append("file", blob, "captured_face.jpg");
      uploadData.append("upload_preset", uploadPreset.trim());

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName.trim()}/image/upload`,
        { method: "POST", body: uploadData }
      );

      if (!response.ok) {
        throw new Error("Lỗi tải ảnh lên Cloudinary!");
      }

      const resData = await response.json();
      setUploadedFaceUrl(resData.secure_url || resData.url);
    } catch (err) {
      console.error("Lỗi upload face:", err);
    } finally {
      setFaceUploading(false);
    }
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
      setPlateScanning(true);
      setOcrResult("Đang xử lý ảnh biển số xe...");
      const localUrl = URL.createObjectURL(plateFile);
      setPreviewPlateUrl(localUrl);

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
      }

      if (!hasCloudinary) {
        setUploadedPlateUrl(localUrl);
        setOcrResult(prev => prev + " - Hoàn tất (Demo Cloud)");
        setPlateScanning(false);
      } else {
        try {
          const uploadData = new FormData();
          uploadData.append("file", plateFile);
          uploadData.append("upload_preset", uploadPreset.trim());

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName.trim()}/image/upload`,
            { method: "POST", body: uploadData }
          );

          if (response.ok) {
            const resData = await response.json();
            setUploadedPlateUrl(resData.secure_url || resData.url);
            setOcrResult(prev => prev + " - Tải ảnh thành công.");
          } else {
            throw new Error("Lỗi upload Cloudinary cho ảnh biển số");
          }
        } catch (err) {
          console.error("Lỗi upload plate:", err);
          setOcrResult(prev => prev + " ❌ Lỗi lưu ảnh.");
        } finally {
          setPlateScanning(false);
        }
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
      stopPlateCamera();

      // 1. Gửi Plate Recognizer OCR trước
      let detectedPlate = "";
      try {
        const ocrToken = import.meta.env.VITE_PLATE_RECOGNIZER_TOKEN;
        const hasOcr = ocrToken && ocrToken !== "chuỗi_api_token_của_bạn";

        if (!hasOcr) {
          console.warn("Chưa cấu hình Plate Recognizer Token. Bỏ qua OCR.");
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
              detectedPlate = ocrRes.results[0].plate.toUpperCase();

              const cleanPlate = normalizeLicensePlate(detectedPlate);

              // Tự động gợi ý loại xe dựa trên chuỗi trơn
              let targetType = "ô tô";
              if (cleanPlate.includes("A1") || cleanPlate.includes("B1") || cleanPlate.includes("E1") || cleanPlate.includes("F1")) {
                targetType = "máy";
              }
              const vt = vehicleTypes.find(v => v.name.toLowerCase().includes(targetType));

              // Định dạng biển số xe theo loại xe
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
      }

      // 2. Upload lên Cloudinary
      try {
        setOcrResult(prev => prev + " (Đang tải ảnh lên Cloudinary...)");
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        const hasCloudinary = cloudName && uploadPreset &&
          cloudName !== "tên_cloud_name_của_bạn" &&
          uploadPreset !== "tên_unsigned_preset_của_bạn";

        if (!hasCloudinary) {
          console.warn("Chưa cấu hình Cloudinary. Demo: Lưu ảnh cục bộ.");
          setUploadedPlateUrl(URL.createObjectURL(blob));
          setOcrResult(prev => prev + " - Hoàn tất (Demo Cloud)");
          return;
        }

        const uploadData = new FormData();
        uploadData.append("file", blob, "captured_plate.jpg");
        uploadData.append("upload_preset", uploadPreset.trim());

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName.trim()}/image/upload`,
          { method: "POST", body: uploadData }
        );

        if (response.ok) {
          const resData = await response.json();
          setUploadedPlateUrl(resData.secure_url || resData.url);
          setOcrResult(prev => prev + " - Tải ảnh thành công.");
        } else {
          throw new Error("Lỗi upload.");
        }
      } catch (err) {
        console.error("Lỗi upload plate:", err);
        setOcrResult(prev => prev + " ❌ Lỗi lưu ảnh.");
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
      let targetType = "ô tô";
      let mockImageUrl = "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&q=80&w=400";

      if (vehicleTypeChoice === "motorbike") {
        plate = "59A1-999.99";
        targetType = "máy";
        mockImageUrl = "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=400";
      }

      const vt = vehicleTypes.find(v => v.name.toLowerCase().includes(targetType));

      setFormData(prev => ({
        ...prev,
        plateNumber: formatLicensePlate(plate, targetType),
        vehicleTypeId: vt?.id || prev.vehicleTypeId,
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
    };
  }, []);

  // Xử lý gửi API Check-in lên Java Spring Boot Backend
  const handleCheckIn = async () => {
    const normalizedPlate = normalizeLicensePlate(formData.plateNumber);
    if (!normalizedPlate) {
      setApiError('Vui lòng cung cấp biển số xe');
      return;
    }

    const currentVehicleType = vehicleTypes.find(v => v.id === formData.vehicleTypeId)?.name || "";

    if (!isValidVietnamLicensePlate(normalizedPlate, currentVehicleType)) {
      setApiError(LICENSE_PLATE_HINT);
      return;
    }

    // Tự động định dạng lại hiển thị trong ô nhập liệu
    setFormData(prev => ({ ...prev, plateNumber: formatLicensePlate(formData.plateNumber, currentVehicleType) }));

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
        entryPlateImageUrl: uploadedPlateUrl || null,
        entryFaceImageUrl: uploadedFaceUrl || null,
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
              <span>Biển số xe:</span>
              <span class="info-value">${formatLicensePlate(checkInResult?.licensePlate || formData.plateNumber, checkInResult?.vehicleType || getVehicleLabel(formData.vehicleTypeId)) || "---"}</span>
            </div>
            <div class="info-row">
              <span>Loại phương tiện:</span>
              <span class="info-value">${checkInResult?.vehicleType || getVehicleLabel(formData.vehicleTypeId)}</span>
            </div>
            <div class="info-row">
              <span>Hình thức gửi:</span>
              <span class="info-value">${checkInResult
        ? (checkInResult.driverType === "SUBSCRIBER"
          ? `Vé đăng ký (${checkInResult.passType === "MONTHLY" ? "Tháng" : checkInResult.passType === "QUARTERLY" ? "Quý" : "Năm"})`
          : checkInResult.driverType === "PRE_BOOKED"
            ? "Đặt trước online"
            : "Vé lượt")
        : (formData.driverType === "SUBSCRIBER"
          ? "Vé tháng (Premium)"
          : formData.driverType === "PRE_BOOKED"
            ? "Đặt trước online"
            : "Vé lượt")
      }</span>
            </div>
            <div class="info-row">
              <span>Vị trí gợi ý:</span>
              <span class="info-value">${checkInResult ? `${checkInResult.zoneName} (${checkInResult.floorName})` : "(Sẽ phân bổ sau)"}</span>
            </div>
            <div class="info-row">
              <span>Thời gian vào:</span>
              <span class="info-value">${new Date(checkInResult?.entryTime || Date.now()).toLocaleString("vi-VN")}</span>
            </div>
            <div class="info-row">
              <span>Khách hàng:</span>
              <span class="info-value">${checkInResult?.customerName || "--"}</span>
            </div>
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
      {/* Thông báo lỗi hiển thị đầu trang nội dung */}
      {apiError && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-bold text-rose-700 shadow-sm w-full animate-pulse">
          <span className="flex items-center gap-2">⚠️ {apiError}</span>
          <button
            onClick={() => setApiError("")}
            className="text-rose-400 hover:text-rose-600 transition-colors font-bold text-base leading-none cursor-pointer"
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
                <div className="bg-slate-50 p-5 flex flex-col gap-2 mt-auto min-h-[110px] justify-center">
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
                <div className="bg-slate-50 p-5 flex flex-col gap-2 mt-auto min-h-[110px] justify-center">
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
                  <div className="flex gap-1 items-center mt-0.5 h-[22px]">
                    <input
                      placeholder="Nhập biển số..."
                      value={formData.plateNumber}
                      onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                      onBlur={(e) => {
                        const currentVehicleType = vehicleTypes.find(v => v.id === formData.vehicleTypeId)?.name || "";
                        setFormData({ ...formData, plateNumber: formatLicensePlate(e.target.value, currentVehicleType) });
                      }}
                      className="flex-1 rounded border border-slate-250 bg-white px-2 py-0.5 text-[9px] font-bold text-slate-800 uppercase outline-none focus:border-indigo-500 transition-all min-w-[60px]"
                    />
                    <button
                      type="button"
                      onClick={() => handleOcrScan("motorbike")}
                      className="px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded text-[8px] font-bold border border-indigo-200 transition-colors cursor-pointer shrink-0"
                    >
                      Giả lập Xe máy
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOcrScan("car")}
                      className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-650 rounded text-[8px] font-bold border border-emerald-200 transition-colors cursor-pointer shrink-0"
                    >
                      Giả lập Ô tô
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
                  onChange={(e) => setFormData({ ...formData, vehicleTypeId: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, gateEntryId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 bg-white cursor-pointer shadow-sm font-sans"
                >
                  {gates.map(g => (
                    <option key={g.id} value={g.id}>{g.gateName}</option>
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
        <div className="space-y-3 lg:col-span-3 flex flex-col">

          {/* Vị trí đỗ gợi ý luôn hiển thị */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-2.5 shadow-xs flex-shrink-0">
            <p className="font-bold text-emerald-900 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Vị trí đỗ đề xuất:
              </span>
              <span className="font-black text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                {checkInResult ? `${checkInResult.floorName} - ${checkInResult.zoneName}` : "Chờ Check-in..."}
              </span>
            </p>
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
                CỔNG VÀO: {gates.find(g => g.id === formData.gateEntryId)?.gateName.toUpperCase() || "CHƯA CHỌN CỔNG"}
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
              <span className="font-mono text-[9px] text-slate-500 font-extrabold tracking-wider mt-1.5">
                {ticketCode || "CHỜ CẤP MÃ VÉ..."}
              </span>
            </div>

            {/* Chi tiết thông tin vé */}
            <div className="space-y-1.5 text-[11px] font-semibold text-slate-500 border-t border-dashed border-slate-200 pt-2.5">
              <div className="flex justify-between items-center">
                <span>Biển số xe:</span>
                <span className="text-slate-600 text-xs font-black tracking-wide uppercase px-2 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono">
                  {formatLicensePlate(checkInResult ? checkInResult.licensePlate : formData.plateNumber, checkInResult ? checkInResult.vehicleType : getVehicleLabel(formData.vehicleTypeId)) || "---"}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Loại phương tiện:</span>
                <span className="text-slate-600 font-extrabold">
                  {checkInResult ? checkInResult.vehicleType : (formData.vehicleTypeId ? getVehicleLabel(formData.vehicleTypeId) : "---")}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Hình thức gửi:</span>
                <span className="text-slate-600 font-extrabold">
                  {checkInResult
                    ? (checkInResult.driverType === "SUBSCRIBER"
                      ? `Vé đăng ký (${checkInResult.passType === "MONTHLY" ? "Tháng" : checkInResult.passType === "QUARTERLY" ? "Quý" : "Năm"})`
                      : checkInResult.driverType === "PRE_BOOKED"
                        ? "Đặt trước online"
                        : "Vé lượt")
                    : (formData.driverType === "SUBSCRIBER"
                      ? "Vé tháng (Premium)"
                      : formData.driverType === "PRE_BOOKED"
                        ? "Đặt trước online"
                        : "Vé lượt")}
                </span>
              </div>

              {formData.reservationCode && !checkInResult && (
                <div className="flex justify-between text-indigo-600 font-extrabold">
                  <span>Mã đặt chỗ:</span>
                  <span>{formData.reservationCode}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Vị trí gợi ý:</span>
                <span className="text-slate-600 font-extrabold">
                  {checkInResult
                    ? `${checkInResult.zoneName} (${checkInResult.floorName})`
                    : "(Sẽ phân bổ sau)"}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Thời gian vào:</span>
                <span className="text-slate-600 font-mono text-[10px] font-bold">
                  {checkInResult
                    ? new Date(checkInResult.entryTime).toLocaleString("vi-VN")
                    : `${liveDate} - ${liveTime}`}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Khách hàng:</span>
                <span className="text-slate-600 font-extrabold">{checkInResult?.customerName || "--"}</span>
              </div>
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
                    className="flex-1 bg-white text-emerald-700 border border-transparent font-bold text-xs py-2 rounded-lg cursor-pointer hover:bg-emerald-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm font-sans"
                  >
                    <IconPrinter /> In Vé
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSuccess(false);
                      setCheckInResult(null);
                      setFormData(prev => ({ ...prev, plateNumber: '', reservationCode: '', notes: '' }));
                      setTicketCode("");
                      setPreviewPlateUrl("");
                      setPreviewFaceUrl("");
                      setUploadedPlateUrl("");
                      setUploadedFaceUrl("");
                    }}
                    className="flex-1 bg-emerald-700/80 hover:bg-emerald-800 text-white font-bold text-xs py-2 rounded-lg cursor-pointer active:scale-[0.98] transition-all font-sans"
                  >
                    Xe tiếp theo
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={isSubmitting || !configLoaded}
                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-md hover:bg-slate-800 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:not-allowed flex items-center justify-center gap-2 font-sans"
              >
                {isSubmitting ? (
                  <>Đang check-in...</>
                ) : (
                  <>
                    <IconPrinter /> XÁC NHẬN & CHECK-IN
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}