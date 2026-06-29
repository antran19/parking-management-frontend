/**
 * Hàm lấy tên folder trên Cloudinary dựa vào sự kiện và loại camera
 * @param {boolean} isActionIn - true nếu là xe VÀO, false nếu xe RA
 * @param {boolean} isCameraPlate - true nếu chụp BIỂN SỐ, false nếu chụp MẶT
 * @returns {string} - Đường dẫn folder (VD: "parking/2026-06-25/IN/plate")
 */
export const getCloudinaryFolder = (isActionIn, isCameraPlate) => {
    // Sử dụng giờ địa phương thay vì toISOString() để tránh bị lùi 1 ngày do múi giờ
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;
    
    const action = isActionIn ? 'IN' : 'OUT';              // Xác định VÀO hay RA
    const type = isCameraPlate ? 'plate' : 'face';          // Xác định BIỂN SỐ hay MẶT
    
    return `parking/${today}/${action}/${type}`;
};

/**
 * Hàm hỗ trợ upload ảnh lên Cloudinary
 * @param {Blob|File} file - File ảnh cần upload
 * @param {boolean} isActionIn - true nếu là xe VÀO, false nếu xe RA
 * @param {boolean} isCameraPlate - true nếu chụp BIỂN SỐ, false nếu chụp MẶT
 * @returns {Promise<string|null>} - Trả về URL của ảnh đã upload, hoặc null nếu lỗi/không có cấu hình
 */
export const uploadToCloudinary = async (file, isActionIn, isCameraPlate) => {
    if (!file) return null;

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    const hasCloudinary = cloudName && uploadPreset &&
        cloudName !== "tên_cloud_name_của_bạn" &&
        uploadPreset !== "tên_unsigned_preset_của_bạn";

    if (!hasCloudinary) {
        console.warn("Chưa cấu hình Cloudinary. Demo: Bỏ qua upload.");
        return null; // Local URLs are typically handled by frontend for preview
    }

    const uploadData = new FormData();
    uploadData.append("file", file, isCameraPlate ? "captured_plate.jpg" : "captured_face.jpg");
    uploadData.append("upload_preset", uploadPreset.trim());
    uploadData.append("folder", getCloudinaryFolder(isActionIn, isCameraPlate));

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName.trim()}/image/upload`,
            { method: "POST", body: uploadData }
        );

        if (!response.ok) {
            throw new Error(`Lỗi tải ảnh lên Cloudinary: ${response.statusText}`);
        }

        const resData = await response.json();
        return resData.secure_url || resData.url;
    } catch (err) {
        console.error("Lỗi upload Cloudinary:", err);
        return null;
    }
};
