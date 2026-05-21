const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

export async function getAdminDashboard() {
  const res = await fetch(`${API_BASE_URL}/admin/dashboard`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Không thể tải dữ liệu dashboard");
  }

  return res.json();
}