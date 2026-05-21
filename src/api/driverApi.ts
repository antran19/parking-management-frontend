const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export type DriverDashboardData = {
  user: {
    id: number;
    name: string;
    avatar?: string;
    membership: string;
  };
  currentSession: {
    slot: string;
    floor: string;
    area: string;
    vehicle: string;
    startTime: string;
    duration: string;
    estimatedFee: string;
    status: string;
  } | null;
  currentBooking: {
    bookingCode: string;
    slot: string;
    floor: string;
    vehicleType: string;
    status: string;
  } | null;
  stats: {
    totalParking: number;
    totalHours: string;
    totalCost: string;
    availableSlots: string;
  };
  history: {
    id: number;
    date: string;
    slot: string;
    vehicle: string;
    cost: string;
    status: string;
  }[];
};

export async function getDriverDashboard(): Promise<DriverDashboardData> {
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