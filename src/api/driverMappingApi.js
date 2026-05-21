const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export async function getDriverParkingMap() {
  const res = await fetch(`${API_URL}/driver/parking-map`);

  if (!res.ok) {
    throw new Error("Không thể tải sơ đồ bãi xe");
  }

  return res.json();
}

export async function reserveDriverSlot(slotId) {
  const res = await fetch(`${API_URL}/driver/parking-slots/${slotId}/reserve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Đặt chỗ thất bại");
  }

  return res.json();
}