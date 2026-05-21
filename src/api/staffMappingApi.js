const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export async function getStaffParkingMap() {
  const res = await fetch(`${API_URL}/staff/parking-map`);

  if (!res.ok) {
    throw new Error("Không thể tải sơ đồ bãi xe");
  }

  return res.json();
}