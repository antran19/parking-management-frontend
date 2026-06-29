/**
 * Chuẩn hóa biển số xe bằng cách:
 * - Chuyển tất cả về chữ in hoa.
 * - Đổi ký tự 'Đ' thành 'D' (để hỗ trợ biển xe điện như MĐ).
 * - Loại bỏ toàn bộ các ký tự không phải là chữ cái (A-Z) hoặc chữ số (0-9).
 * VD: "29MĐ-123.45" -> "29MD12345"
 * @param {string} value - Chuỗi biển số đầu vào
 * @returns {string} - Chuỗi biển số đã được làm sạch
 */
export function normalizeLicensePlate(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/Đ/g, "D")
    .replace(/[^A-Z0-9]/g, "");
}

/**
 * Phân loại loại phương tiện dựa trên chuỗi đầu vào.
 * - Xóa dấu tiếng Việt, đưa về chữ thường.
 * - Kiểm tra các từ khóa đặc trưng như "dap", "may", "tai".
 * @param {string} vehicleType - Tên hoặc mã loại phương tiện
 * @returns {"CAR"|"MOTORBIKE"|"BICYCLE"|"TRUCK"} - Mã loại phương tiện chuẩn
 */
export function getVehicleTypeKey(vehicleType = "CAR") {
  const text = String(vehicleType || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");

  if (text.includes("xe dap") || text.includes("bicycle")) return "BICYCLE";
  if (
    text.includes("xe may") ||
    text.includes("moto") ||
    text.includes("motorbike")
  )
    return "MOTORBIKE";
  if (text.includes("xe tai") || text.includes("truck")) return "TRUCK";

  return "CAR";
}

/**
 * Kiểm tra tính hợp lệ của biển số xe dựa trên chuẩn biển số Việt Nam.
 * - Sử dụng regex để tách biệt định dạng biển số Ô tô và Xe máy.
 * - Chốt chặt các mã tỉnh hợp lệ (loại bỏ các mã không tồn tại như 00-10, 13, 91...).
 * - Xử lý đặc biệt cho xe điện (MD/MĐ) và xe đặc chủng (LD, DA...).
 * @param {string} value - Biển số xe cần kiểm tra
 * @param {string} vehicleType - Loại xe ("CAR", "MOTORBIKE", "BICYCLE", "ANY")
 * @returns {string|null} - Null nếu hợp lệ, thông báo lỗi (string) nếu không hợp lệ
 */
export function getLicensePlateValidationError(value, vehicleType = "ANY") {
  const plate = normalizeLicensePlate(value);
  if (!plate) return "Vui lòng nhập biển số xe.";

  let type = "ANY";
  if (vehicleType) {
    const tStr = String(vehicleType).toLowerCase();
    if (
      tStr.includes("máy") ||
      tStr.includes("moto") ||
      tStr.includes("motorbike") ||
      tStr.includes("ebike")
    ) {
      type = "MOTORBIKE";
    } else if (
      tStr.includes("đạp") ||
      tStr.includes("bicycle") ||
      tStr.includes("bike")
    ) {
      type = "BICYCLE";
    } else if (
      tStr.includes("oto") ||
      tStr.includes("ô tô") ||
      tStr.includes("car") ||
      tStr.includes("tải") ||
      tStr.includes("truck")
    ) {
      type = "CAR";
    }
  }

  const isBicycle = /^[A-Z0-9]{3,15}$/.test(plate);

  const carSpecial = "LD|DA|MK|HC|TK|NG|NN|QT|CV|AT";
  const provinceCode =
    "(?:1[124-9]|[23][0-9]|4[0137-9]|[5-7][0-9]|8[0-689]|9[02-57-9])";
  const tailPattern = "\\d{4,5}";

  // NOTE:
  // Cho phép ô tô / xe tải có 1 hoặc 2 chữ cái sau mã tỉnh.
  // Ví dụ hợp lệ theo UI: 30A12345, 49AB12345, 50AB12345.
  const carSeries = `(?:[A-Z]{1,2}|${carSpecial})`;

  // Xe máy vẫn cho các dạng phổ biến: 59X112345, 59AA72932, 29MD112345.
  const motoSeries = `(?:(?!(?:${carSpecial}))[A-Z]{2}|[A-Z][0-9]|MD[0-9]?)`;

  const isCar = new RegExp(
    `^(${provinceCode}${carSeries}${tailPattern})$|^([A-Z]{2}${tailPattern})$`,
  ).test(plate);
  const isMotorbike = new RegExp(
    `^(${provinceCode}${motoSeries}${tailPattern})$`,
  ).test(plate);

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
    return "Biển số xe máy không đúng định dạng (VD: 29C1-123.45, 36AA-123.45, 29MD1-123.45).";
  }

  if (type === "BICYCLE") {
    if (isBicycle) return null;
    return "Biển số xe đạp không đúng định dạng (từ 3 đến 15 ký tự chữ và số).";
  }

  // type === "ANY"
  if (isCar || isMotorbike || isBicycle) return null;
  return "Biển số không hợp lệ hoặc không đúng định dạng xe Việt Nam.";
}

/**
 * Hàm tiện ích (wrapper) trả về boolean cho biết biển số có hợp lệ hay không.
 * @param {string} value - Biển số xe
 * @param {string} vehicleType - Loại phương tiện
 * @returns {boolean} - True nếu hợp lệ, False nếu lỗi
 */
export function isValidVietnamLicensePlate(value, vehicleType = "ANY") {
  return getLicensePlateValidationError(value, vehicleType) === null;
}

/**
 * Định dạng lại biển số xe theo chuẩn Việt Nam (có dấu gạch ngang và dấu chấm).
 * Tùy thuộc vào loại xe (CAR/MOTORBIKE) sẽ có cách phân tách chuỗi khác nhau.
 * Nếu đuôi có 5 số (VD: 12345), tự động chèn dấu chấm thành 123.45.
 * VD: Ô tô "29A12345" -> "29A-123.45"
 * VD: Xe máy "29A112345" -> "29A1-123.45"
 * @param {string} value - Biển số xe đã nhập
 * @param {string} vehicleType - Loại phương tiện
 * @returns {string} - Biển số xe đã được định dạng đẹp
 */
export function formatLicensePlate(value, vehicleType) {
  const clean = normalizeLicensePlate(value);
  if (!clean) return "";

  const type = getVehicleTypeKey(vehicleType);

  if (type === "BICYCLE") {
    return clean;
  }

  const formatTail = (tail) =>
    tail.length === 5 ? tail.replace(/^(\d{3})(\d{2})$/, "$1.$2") : tail;

  // 1. Military (e.g. KA1234, KA12345)
  if (/^[A-Z]{2}\d{4,5}$/.test(clean)) {
    return clean.replace(/^([A-Z]{2})(\d{4,5})$/, "$1-$2");
  }

  // 2. Car Special (e.g. 29LD12345)
  const carSpecialReg = /^(\d{2})(LD|DA|MK|HC|TK|NG|NN|QT|CV|AT)(\d{4,5})$/;
  if (carSpecialReg.test(clean)) {
    return clean.replace(
      carSpecialReg,
      (_, p1, p2, p3) => `${p1}${p2}-${formatTail(p3)}`,
    );
  }

  const carReg = /^(\d{2})([A-Z]{1,2})(\d{4,5})$/;
  const motoReg = /^(\d{2})([A-Z][0-9A-Z]|MD[0-9]?)(\d{4,5})$/;

  if (type === "MOTORBIKE" && motoReg.test(clean)) {
    return clean.replace(
      motoReg,
      (_, p1, p2, p3) => `${p1}${p2}-${formatTail(p3)}`,
    );
  }

  if (type === "CAR" && carReg.test(clean)) {
    return clean.replace(
      carReg,
      (_, p1, p2, p3) => `${p1}${p2}-${formatTail(p3)}`,
    );
  }

  // Fallback for ANY or mismatched type
  if (carReg.test(clean) && motoReg.test(clean)) {
    // Ambiguous case like 29A12345 (8 chars)
    // Default to CAR format for 5-digit tails (29A-123.45) rather than Moto 4-digit (29A1-2345)
    return clean.replace(
      carReg,
      (_, p1, p2, p3) => `${p1}${p2}-${formatTail(p3)}`,
    );
  }

  if (motoReg.test(clean)) {
    return clean.replace(
      motoReg,
      (_, p1, p2, p3) => `${p1}${p2}-${formatTail(p3)}`,
    );
  }

  if (carReg.test(clean)) {
    return clean.replace(
      carReg,
      (_, p1, p2, p3) => `${p1}${p2}-${formatTail(p3)}`,
    );
  }

  return clean;
}

export const LICENSE_PLATE_HINT =
  "Biển số không đúng định dạng. Ví dụ: 51H-123.45, 30A-999.88, 59X1-123.45. Xe đạp không nhập biển số; hệ thống tự sinh mã khi đặt chỗ.";
