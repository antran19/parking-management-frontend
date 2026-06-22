export function normalizeLicensePlate(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function isValidVietnamLicensePlate(value, vehicleType = "CAR") {
  const plate = normalizeLicensePlate(value);
  if (!plate) return false;

  let type = "CAR";
  if (vehicleType) {
    const tStr = String(vehicleType).toLowerCase();
    if (tStr.includes("máy") || tStr.includes("moto") || tStr.includes("motorbike") || tStr.includes("ebike")) {
      type = "MOTORBIKE";
    } else if (tStr.includes("đạp") || tStr.includes("bicycle") || tStr.includes("bike")) {
      type = "BICYCLE";
    }
  }

  if (type === "BICYCLE") {
    return /^[A-Z0-9]{3,15}$/.test(plate);
  }

  if (type === "CAR") {
    // Dựa theo tài liệu chuẩn:
    // - Mã tỉnh + 1 Chữ + 4, 5, 6 Số (VD: 29A1234, 30K12345, 30K123456)
    // - Mã tỉnh + 2 Chữ + 4, 5 Số (VD: 30AA1234, 29LD00123, 51ED12345)
    // - Quân đội: 2 chữ + 4, 5 số (VD: QA1234)
    const carReg = /^(\d{2}[A-Z]\d{4,6})$|^(\d{2}[A-Z]{2}\d{4,5})$|^([A-Z]{2}\d{4,5})$/;
    return carReg.test(plate);
  }

  if (type === "MOTORBIKE") {
    // Dựa theo tài liệu chuẩn:
    // - Mã tỉnh + 1 Chữ + 1 Số + 4, 5 Số (Gộp chung là Mã tỉnh + 1 Chữ + 5, 6 Số) (VD: 29F41234, 59G112345)
    // - Mã tỉnh + 2 Chữ + 4, 5 Số (VD: 29FA1234, 36AA12345)
    const motoReg = /^(\d{2}[A-Z]\d{5,6})$|^(\d{2}[A-Z]{2}\d{4,5})$/;
    return motoReg.test(plate);
  }

  return /^[A-Z0-9]{3,15}$/.test(plate);
}

export function formatLicensePlate(value, vehicleType) {
  const clean = normalizeLicensePlate(value);
  if (!clean) return "";

  // Chuẩn hóa vehicleType về dạng viết hoa đơn giản: 'CAR', 'MOTORBIKE', 'BICYCLE'
  let type = "CAR"; // Mặc định là CAR nếu không truyền hoặc không xác định rõ
  if (vehicleType) {
    const tStr = String(vehicleType).toLowerCase();
    if (tStr.includes("máy") || tStr.includes("moto") || tStr.includes("motorbike") || tStr.includes("ebike")) {
      type = "MOTORBIKE";
    } else if (tStr.includes("đạp") || tStr.includes("bicycle") || tStr.includes("bike")) {
      type = "BICYCLE";
    }
  }

  // 1. Nếu là xe đạp / không biển
  if (type === "BICYCLE") {
    return clean;
  }

  // 2. Xe máy 5 số: 2 số + 1 chữ cái + 1 số + 5 số. Ví dụ: 29C112345 -> 29C1-123.45
  const mc5Reg = /^(\d{2})([A-Z])([0-9])([0-9]{5})$/;
  if (mc5Reg.test(clean)) {
    return clean.replace(mc5Reg, "$1$2$3-$4").replace(/(\d{3})(\d{2})$/, "$1.$2");
  }

  // Xe máy điện 5 số: 2 số + 2 chữ cái (ví dụ: MD, MĐ) + 1 số + 5 số. Ví dụ: 29MD112345 -> 29MD1-123.45
  const eMc5Reg = /^(\d{2})([A-Z]{2})([0-9])([0-9]{5})$/;
  if (eMc5Reg.test(clean)) {
    return clean.replace(eMc5Reg, "$1$2$3-$4").replace(/(\d{3})(\d{2})$/, "$1.$2");
  }

  // 3. Nếu cấu trúc trơn có 8 ký tự: [2 số tỉnh] + [1 chữ cái] + [5 số]
  // Trùng lặp giữa Xe máy 4 số (99F2-3456) và Ô tô 5 số (30A-123.45)
  const length8Reg = /^(\d{2})([A-Z])([0-9])([0-9]{4})$/;
  if (length8Reg.test(clean)) {
    if (type === "MOTORBIKE") {
      // Định dạng xe máy 4 số: 99F2-3456
      return clean.replace(length8Reg, "$1$2$3-$4");
    } else {
      // Định dạng ô tô 5 số: 30A-123.45
      const province = clean.substring(0, 2);
      const letter = clean.substring(2, 3);
      const numberPart = clean.substring(3); // 5 số còn lại
      const formattedNum = numberPart.replace(/^(\d{3})(\d{2})$/, "$1.$2");
      return `${province}${letter}-${formattedNum}`;
    }
  }

  // 4. Ô tô 5 số thông thường có 2 chữ cái (ví dụ: 51LD12345 -> 51LD-123.45)
  const car5LD = /^(\d{2})([A-Z]{2})(\d{5})$/;
  if (car5LD.test(clean)) {
    return clean.replace(car5LD, (match, p1, p2, p3) => {
      const formattedNum = p3.replace(/^(\d{3})(\d{2})$/, "$1.$2");
      return `${p1}${p2}-${formattedNum}`;
    });
  }

  // 5. Biển 4 số cũ (ví dụ 29C-4567, 30H-1234)
  const plate4Reg = /^(\d{2})([A-Z]{1,2})([0-9]{4})$/;
  if (plate4Reg.test(clean)) {
    return clean.replace(plate4Reg, "$1$2-$3");
  }

  // 6. Biển quân đội (đỏ): 2 chữ cái + 4 hoặc 5 số. Ví dụ: QA1234 -> QA-1234
  const milReg = /^([A-Z]{2})([0-9]{4,5})$/;
  if (milReg.test(clean)) {
    return clean.replace(milReg, "$1-$2");
  }

  // 7. Mặc định trả về chuỗi trơn viết hoa
  return clean;
}

export const LICENSE_PLATE_HINT = "Biển số phải từ 3 đến 15 ký tự chữ và số (ví dụ: 30A-123.45, 29C1-12345, hoặc XEDAP nếu là xe đạp)";

