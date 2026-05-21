const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export async function getDriverDashboard() {
  const token = localStorage.getItem("accessToken");

  const res = await fetch(`${API_URL}/driver/dashboard`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Không thể tải dữ liệu bảng điều khiển.");
  }

  return res.json();
}