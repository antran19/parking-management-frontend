export type SlotStatus = "available" | "occupied" | "reserved";

export type ParkingSlot = {
  id: string;
  code: string;
  floorName: string;
  vehicleType: string;
  status: SlotStatus;
  pricePerHour: number;
};

export type Floor = {
  id: number;
  name: string;
  vehicleType: string;
  slots: ParkingSlot[];
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export async function getDriverParkingMap(): Promise<Floor[]> {
  const res = await fetch(`${API_URL}/driver/parking-map`);

  if (!res.ok) {
    throw new Error("Không thể tải sơ đồ bãi xe");
  }

  return res.json();
}

export async function reserveDriverSlot(slotId: string) {
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