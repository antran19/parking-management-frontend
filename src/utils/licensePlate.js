export function normalizeLicensePlate(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export function getVehicleTypeKey(vehicleType = "CAR") {
  const text = String(vehicleType || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (text.includes("xe dap") || text.includes("bicycle")) return "BICYCLE";
  if (text.includes("xe may") || text.includes("moto") || text.includes("motorbike")) return "MOTORBIKE";
  if (text.includes("xe tai") || text.includes("truck")) return "TRUCK";

  return "CAR";
}

export function getLicensePlateValidationError(value, vehicleType = "ANY") {
  const plate = normalizeLicensePlate(value);
  if (!plate) return "Vui lòng nhập biển số xe.";

  let type = "ANY";
  if (vehicleType) {
    const tStr = String(vehicleType).toLowerCase();
    if (tStr.includes("máy") || tStr.includes("moto") || tStr.includes("motorbike") || tStr.includes("ebike")) {
      type = "MOTORBIKE";
    } else if (tStr.includes("đạp") || tStr.includes("bicycle") || tStr.includes("bike")) {
      type = "BICYCLE";
    } else if (tStr.includes("oto") || tStr.includes("ô tô") || tStr.includes("car") || tStr.includes("tải") || tStr.includes("truck")) {
      type = "CAR";
    }
  }

  const isBicycle = /^[A-Z0-9]{3,15}$/.test(plate);
  const isCar = /^(\d{2}[A-Z]\d{4,6})$|^(\d{2}(LD|DA|MK|HC|TK|NG|NN|QT|CV|AT)\d{4,5})$|^([A-Z]{2}\d{4,5})$/.test(plate);
  const isMotorbike = /^(\d{2}[A-Z]\d{5,6})$|^(\d{2}(?!(LD|DA|MK|HC|TK|NG|NN|QT|CV|AT))[A-Z]{2}\d{4,5})$|^(\d{2}(MD|MĐ)\d{5,6})$/.test(plate);

  if (type === "CAR") {
    if (isCar) return null;
    if (isMotorbike) {
      return "Đây là biển số xe máy. Vui lòng chọn lại loại xe hoặc kiểm tra lại biển số!";
    }
    return "Biển số ô tô không đúng định dạng (VD: 30K-123.45, 29LD-001.23).";
  }

  if (type === "MOTORBIKE") {
    if (isMotorbike) return null;
    if (isCar) {
      return "Đây là biển số ô tô. Vui lòng chọn lại loại xe hoặc kiểm tra lại biển số!";
    }
    return "Biển số xe máy không đúng định dạng (VD: 29C1-123.45, 36AA-123.45).";
  }

  if (type === "BICYCLE") {
    if (isBicycle) return null;
    return "Biển số xe đạp không đúng định dạng (từ 3 đến 15 ký tự chữ và số).";
  }

  // type === "ANY"
  if (isCar || isMotorbike || isBicycle) return null;
  return "Biển số không hợp lệ hoặc không đúng định dạng xe Việt Nam.";
}

export function isValidVietnamLicensePlate(value, vehicleType = "ANY") {
  return getLicensePlateValidationError(value, vehicleType) === null;
}

export function formatLicensePlate(value, vehicleType) {
  const clean = normalizeLicensePlate(value);
  if (!clean) return "";

  const type = getVehicleTypeKey(vehicleType);

  if (type === "BICYCLE") {
    return clean;
  }

  const mc5Reg = /^(\d{2})([A-Z])([0-9])([0-9]{5})$/;
  if (mc5Reg.test(clean)) {
    return clean.replace(mc5Reg, "$1$2$3-$4").replace(/(\d{3})(\d{2})$/, "$1.$2");
  }

  const eMc5Reg = /^(\d{2})([A-Z]{2})([0-9])([0-9]{5})$/;
  if (eMc5Reg.test(clean)) {
    return clean.replace(eMc5Reg, "$1$2$3-$4").replace(/(\d{3})(\d{2})$/, "$1.$2");
  }

  const length8Reg = /^(\d{2})([A-Z])([0-9])([0-9]{4})$/;
  if (length8Reg.test(clean)) {
    if (type === "MOTORBIKE") {
      return clean.replace(length8Reg, "$1$2$3-$4");
    }

    const province = clean.substring(0, 2);
    const letter = clean.substring(2, 3);
    const numberPart = clean.substring(3);
    const formattedNum = numberPart.replace(/^(\d{3})(\d{2})$/, "$1.$2");
    return `${province}${letter}-${formattedNum}`;
  }

  const car5LD = /^(\d{2})([A-Z]{2})(\d{5})$/;
  if (car5LD.test(clean)) {
    return clean.replace(car5LD, (match, p1, p2, p3) => {
      const formattedNum = p3.replace(/^(\d{3})(\d{2})$/, "$1.$2");
      return `${p1}${p2}-${formattedNum}`;
    });
  }

  const plate4Reg = /^(\d{2})([A-Z]{1,2})([0-9]{4})$/;
  if (plate4Reg.test(clean)) {
    return clean.replace(plate4Reg, "$1$2-$3");
  }

  const milReg = /^([A-Z]{2})([0-9]{4,5})$/;
  if (milReg.test(clean)) {
    return clean.replace(milReg, "$1-$2");
  }

  return clean;
}

export const LICENSE_PLATE_HINT =
  "Biển số không đúng định dạng. Ví dụ: 51H12345, 30AB99988, 59X112345. Xe đạp không nhập biển số; hệ thống tự sinh mã 4 số khi đặt chỗ.";