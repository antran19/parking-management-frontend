const API_URL = import.meta.env.VITE_API_URL;

export interface StaffDashboardData {
  staffName: string;
  role: string;
  stats: {
    availableSlots: number;
    occupiedSlots: number;
    reservedSlots: number;
    todayCheckIn: number;
    todayCheckOut: number;
    revenue: string;
  };
  recentActivities: {
    id: number;
    time: string;
    action: string;
    vehicle: string;
    plate: string;
    slot: string;
    status: string;
  }[];
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);

  if (!res.ok) {
    throw new Error("Call API thất bại");
  }

  return res.json();
}

export const staffApi = {
  getDashboard: () => request<StaffDashboardData>("/staff/dashboard"),
};