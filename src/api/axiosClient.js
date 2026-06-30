import axios from "axios";

// Lấy cấu hình URL mặc định từ file .env (thường là localhost)
let defaultBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

// CƠ CHẾ ĐÁP ỨNG THIẾT BỊ DI ĐỘNG (MOBILE/CROSS-DEVICE SUPPORT)
// Giải thích cho hội đồng: Nếu ứng dụng được mở từ điện thoại (ví dụ truy cập IP 192.168.1.xxx)
// thì biến window.location.hostname sẽ chứa IP thật thay vì 'localhost'.
// Đoạn code này tự động thay thế 'localhost' thành IP thật để điện thoại gọi API đúng máy chủ.
if (defaultBaseUrl.includes("localhost") && typeof window !== "undefined" && window.location.hostname !== "localhost") {
  defaultBaseUrl = defaultBaseUrl.replace("localhost", window.location.hostname);
}

const axiosClient = axios.create({
  baseURL: defaultBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Lấy accessToken của phiên làm việc hiện tại.
 * Ưu tiên token theo current role để tránh dùng nhầm token role cũ
 * khi test nhiều tài khoản trên cùng browser.
 */
function getAccessToken() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const currentRole = user?.role?.toUpperCase();
  const sharedToken = localStorage.getItem("accessToken");

  if (currentRole) {
    const roleKey = `accessToken_${currentRole}`;
    const roleToken = localStorage.getItem(roleKey);
    if (roleToken) return roleToken;

    if (sharedToken) {
      localStorage.setItem(roleKey, sharedToken);
      return sharedToken;
    }
  }

  return sharedToken;
}

// Tự động gắn JWT token vào mọi request
axiosClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken(config.url);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Nếu token hết hạn hoặc không hợp lệ (401/403) → Tự động logout và dọn dẹp bộ nhớ
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const role = user?.role?.toUpperCase();
      if (role) localStorage.removeItem(`accessToken_${role}`);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosClient;