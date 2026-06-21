export function normalizeLicensePlate(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[–—]/g, "-");
}

/**
 * Kiểm tra xem biển số xe có đúng chuẩn định dạng Việt Nam hay không.
 * Giải thích Regex: /^\d{2}[A-Z]{1,2}\d?-\d{3}(\.\d{2}|\d{2})$/
 * - ^          : Bắt đầu chuỗi
 * - \d{2}      : 2 chữ số đầu là Mã tỉnh/thành phố (VD: 59, 29, 30)
 * - [A-Z]{1,2} : 1 hoặc 2 chữ cái in hoa (Seri, VD: A, LD, MD, AA)
 * - \d?        : Có thể có 1 chữ số (dành cho xe máy VD: A1, B2)
 * - -          : Bắt buộc có dấu gạch ngang
 * - \d{3}      : 3 chữ số đầu của đuôi biển số (VD: 123)
 * - (\.\d{2}|\d{2}) : Nếu là biển 5 số thì có dấu chấm (VD: .45), nếu biển 4 số thì chỉ có 1 số cuối (tổng là 4 số)
 * - $          : Kết thúc chuỗi
 */
export function isValidVietnamLicensePlate(value) {
  const plate = normalizeLicensePlate(value);
  return /^\d{2}[A-Z]{1,2}\d?-\d{3}(\.\d{2}|\d{2})$/.test(plate);
}

export function formatLicensePlate(plate, type) {
  if (!plate) return "";
  let cleanPlate = String(plate).toUpperCase().replace(/[^A-ZĐ0-9]/g, "");
  if (type === "ELECTRIC_BIKE") {
    cleanPlate = cleanPlate.replace("MD", "MĐ");
  } else if (!type && /^\d{2}MD/.test(cleanPlate)) {
    cleanPlate = cleanPlate.replace("MD", "MĐ");
  }

  let match;
  if (type === "CAR") {
    match = cleanPlate.match(/^(\d{2}[A-ZĐ]{1,2})(\d{4,5})$/);
  } else if (type === "MOTORBIKE" || type === "ELECTRIC_BIKE") {
    match = cleanPlate.match(/^(\d{2}[A-ZĐ0-9]{2})(\d{4,5})$/);
  } else {
    // Nếu không truyền type (như ở màn Blacklist), tự động suy luận
    match = cleanPlate.match(/^(\d{2}[A-ZĐ0-9]{1,2})(\d{4,5})$/);
  }

  if (match) {
    let prefix = match[1];
    let suffix = match[2];
    if (suffix.length === 5) {
      suffix = suffix.substring(0, 3) + "." + suffix.substring(3);
    }
    return `${prefix}-${suffix}`;
  }
  return String(plate).toUpperCase();
}

export const LICENSE_PLATE_HINT = "Biển số phải đúng định dạng, ví dụ: 51F-123.45, 30A-12345 hoặc 59X1-12345";
