export type SlotStatus = "available" | "occupied" | "reserved";
export type VehicleType = "bicycle" | "ebike" | "motorbike" | "car";

export type ParkingZone = {
  id: string;
  floor: number;
  category: string;
  icon: string;
  section: string;
  prefix: string;
  cols: number;
  type: VehicleType;
};

export type ParkingSlot = {
  id: string;
  status: SlotStatus;
  type: VehicleType;
  plate?: string;
  startTime?: string;
  fee?: string;
  floor: number;
  zonePrefix: string;
};

export type StaffParkingMapResponse = {
  zones: ParkingZone[];
  slots: ParkingSlot[];
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export async function getStaffParkingMap(): Promise<StaffParkingMapResponse> {
  const res = await fetch(`${API_URL}/staff/parking-map`);

  if (!res.ok) {
    throw new Error("Không thể tải sơ đồ bãi xe");
  }

  return res.json();
}