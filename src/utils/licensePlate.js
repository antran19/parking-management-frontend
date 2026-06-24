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

export function isValidVietnamLicensePlate(value, vehicleType = "CAR") {
  const plate = normalizeLicensePlate(value);
  if (!plate) return false;

  const type = getVehicleTypeKey(vehicleType);

  if (type === "BICYCLE") {
    return /^\d{4}$/.test(plate);
  }

  if (type === "CAR" || type === "TRUCK") {
    return /^(\d{2}[A-Z]\d{4,6})$|^(\d{2}[A-Z]{2}\d{4,5})$|^([A-Z]{2}\d{4,5})$/.test(plate);
  }

  if (type === "MOTORBIKE") {
    return /^(\d{2}[A-Z]\d{5,6})$|^(\d{2}[A-Z]{2}\d{4,5})$/.test(plate);
  }

  return /^[A-Z0-9]{3,15}$/.test(plate);
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