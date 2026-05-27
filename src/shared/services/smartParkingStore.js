import { VEHICLE_TYPES } from "../data/smartParkingSeed";
import { apiDelete, apiGet, apiPost, apiPut } from "./httpClient";

const emptyAnalytics = {
  floors: [],
  employees: [],
  drivers: [],
  reservations: [],
  passes: [],
  payments: [],
  history: [],
  totalCapacity: 0,
  totalOccupied: 0,
  totalReserved: 0,
  totalAvailable: 0,
  totalRevenue: 0,
  hotFloors: [],
};

export function uid(prefix = "ID") {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

export function todayText() {
  return new Date().toLocaleString("vi-VN", { hour12: false });
}

export function formatVnd(value = 0) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value) || 0);
}

export function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

export function getVehicleTypeLabel(id) {
  return VEHICLE_TYPES.find((item) => item.id === id)?.label || id || "-";
}

export function getFloorUsage(floor = {}) {
  const occupied = Number(floor.occupied ?? floor.currentCount ?? 0);
  const reserved = Number(floor.reserved ?? floor.reservedCount ?? 0);
  const capacity = Number(floor.capacity ?? 0);
  const available = Number(floor.available ?? Math.max(capacity - occupied - reserved, 0));
  const used = Math.min(100, Math.round(((occupied + reserved) / Math.max(capacity, 1)) * 100));
  return { capacity, occupied, reserved, available, used };
}

export async function getFloors() { return apiGet("/parking/floors", []); }
export async function getMembershipPlans() { return apiGet("/membership-plans", []); }
export async function getEmployees() { return apiGet("/employees", []); }
export async function getDrivers() { return apiGet("/drivers", []); }
export async function getVehicles() { return apiGet("/vehicles", []); }
export async function getReservations() { return apiGet("/reservations", []); }
export async function getPasses() { return apiGet("/passes", []); }
export async function getPayments() { return apiGet("/payments", []); }
export async function getHistory() { return apiGet("/parking-sessions/history", []); }
export async function getActivity() { return apiGet("/activity", []); }

export async function saveFloors(floors) { return apiPut("/parking/floors", floors); }
export async function saveMembershipPlans(plans) { return apiPut("/membership-plans", plans); }
export async function saveEmployees(data) { return apiPut("/employees", data); }
export async function saveDrivers(data) { return apiPut("/drivers", data); }
export async function saveVehicles(data) { return apiPut("/vehicles", data); }
export async function saveReservations(data) { return apiPut("/reservations", data); }
export async function savePasses(data) { return apiPut("/passes", data); }
export async function savePayments(data) { return apiPut("/payments", data); }
export async function saveHistory(data) { return apiPut("/parking-sessions/history", data); }
export async function saveActivity(data) { return apiPut("/activity", data); }

export async function addActivity(message) {
  return apiPost("/activity", { message });
}

export async function createReservation(input) {
  return apiPost("/reservations", input);
}

export async function cancelReservation(id) {
  await apiPut(`/reservations/${id}/cancel`, {});
  return getReservations();
}

export async function createPass(input) {
  return apiPost("/passes", input);
}

export async function createPayment(input) {
  return apiPost("/payments", input);
}

export async function updateFloorCapacity(id, patch) {
  await apiPut(`/parking/floors/${id}`, patch);
  return getFloors();
}

export async function deleteEmployee(id) { return apiDelete(`/employees/${id}`); }
export async function deleteDriver(id) { return apiDelete(`/drivers/${id}`); }
export async function deleteVehicle(id) { return apiDelete(`/vehicles/${id}`); }

export async function getAnalytics() {
  const analytics = await apiGet("/analytics/dashboard", null);
  if (analytics) return { ...emptyAnalytics, ...analytics };

  const [floors, employees, drivers, reservations, passes, payments, history] = await Promise.all([
    getFloors(), getEmployees(), getDrivers(), getReservations(), getPasses(), getPayments(), getHistory(),
  ]);

  const totalCapacity = floors.reduce((sum, floor) => sum + Number(floor.capacity || 0), 0);
  const totalOccupied = floors.reduce((sum, floor) => sum + Number(floor.occupied || floor.currentCount || 0), 0);
  const totalReserved = floors.reduce((sum, floor) => sum + Number(floor.reserved || floor.reservedCount || 0), 0);
  const totalRevenue = [...payments, ...history].reduce((sum, item) => sum + Number(item.amount || item.price || 0), 0);
  const hotFloors = floors.filter((floor) => getFloorUsage(floor).used >= 75);

  return {
    floors,
    employees,
    drivers,
    reservations,
    passes,
    payments,
    history,
    totalCapacity,
    totalOccupied,
    totalReserved,
    totalAvailable: Math.max(totalCapacity - totalOccupied - totalReserved, 0),
    totalRevenue,
    hotFloors,
  };
}
