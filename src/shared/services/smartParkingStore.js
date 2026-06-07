import {
  DEFAULT_ACTIVITY,
  DEFAULT_DRIVERS,
  DEFAULT_EMPLOYEES,
  DEFAULT_FLOORS,
  DEFAULT_HISTORY,
  DEFAULT_MEMBERSHIP_PLANS,
  DEFAULT_RESERVATIONS,
  DEFAULT_VEHICLES,
  VEHICLE_TYPES,
} from "../data/smartParkingSeed";

const KEY_PREFIX = "smartparking:professional:";

function key(name) {
  return `${KEY_PREFIX}${name}`;
}

function safeRead(name, fallback) {
  try {
    const raw = localStorage.getItem(key(name));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(fallback) && !Array.isArray(parsed) ? fallback : parsed;
  } catch (error) {
    console.warn(`Cannot read ${name}`, error);
    return fallback;
  }
}

function safeWrite(name, value) {
  localStorage.setItem(key(name), JSON.stringify(value));
  return value;
}

export function uid(prefix = "ID") {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
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

export function getFloors() {
  return safeRead("floors", DEFAULT_FLOORS);
}

export function saveFloors(floors) {
  return safeWrite("floors", floors);
}

export function getMembershipPlans() {
  return safeRead("membershipPlans", DEFAULT_MEMBERSHIP_PLANS);
}

export function saveMembershipPlans(plans) {
  return safeWrite("membershipPlans", plans);
}

export function getEmployees() {
  return safeRead("employees", DEFAULT_EMPLOYEES);
}

export function saveEmployees(data) {
  return safeWrite("employees", data);
}

export function getDrivers() {
  return safeRead("drivers", DEFAULT_DRIVERS);
}

export function saveDrivers(data) {
  return safeWrite("drivers", data);
}

export function getVehicles() {
  return safeRead("vehicles", DEFAULT_VEHICLES);
}

export function saveVehicles(data) {
  return safeWrite("vehicles", data);
}

export function getReservations() {
  return safeRead("reservations", DEFAULT_RESERVATIONS);
}

export function saveReservations(data) {
  return safeWrite("reservations", data);
}

export function getPasses() {
  return safeRead("passes", []);
}

export function savePasses(data) {
  return safeWrite("passes", data);
}

export function getPayments() {
  return safeRead("payments", []);
}

export function savePayments(data) {
  return safeWrite("payments", data);
}

export function getHistory() {
  return safeRead("history", DEFAULT_HISTORY);
}

export function saveHistory(data) {
  return safeWrite("history", data);
}

export function getActivity() {
  return safeRead("activity", DEFAULT_ACTIVITY);
}

export function addActivity(message) {
  const next = [message, ...getActivity()].slice(0, 30);
  saveActivity(next);
  return next;
}

export function saveActivity(data) {
  return safeWrite("activity", data);
}

export function resetDemoData() {
  saveFloors(DEFAULT_FLOORS);
  saveMembershipPlans(DEFAULT_MEMBERSHIP_PLANS);
  saveEmployees(DEFAULT_EMPLOYEES);
  saveDrivers(DEFAULT_DRIVERS);
  saveVehicles(DEFAULT_VEHICLES);
  saveReservations(DEFAULT_RESERVATIONS);
  savePasses([]);
  savePayments([]);
  saveHistory(DEFAULT_HISTORY);
  saveActivity(DEFAULT_ACTIVITY);
}

export function createReservation(input) {
  const reservation = {
    id: uid("RSV"),
    ...input,
    status: "CONFIRMED",
    qrCode: uid("SP-RSV"),
    createdAt: todayText(),
  };
  saveReservations([reservation, ...getReservations()]);
  addActivity(`Driver tạo đặt chỗ ${reservation.licensePlate} tại tầng ${reservation.floorId}`);
  return reservation;
}

export function cancelReservation(id) {
  const next = getReservations().map((item) => item.id === id ? { ...item, status: "CANCELLED" } : item);
  saveReservations(next);
  addActivity(`Hủy đặt chỗ ${id}`);
  return next;
}

export function createPass(input) {
  const plan = getMembershipPlans().find((item) => item.id === input.planId);
  const start = new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + (plan?.months || 1));
  const pass = {
    id: uid("PASS"),
    ...input,
    planName: plan?.name || input.planId,
    price: plan?.price || 0,
    status: "ACTIVE",
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    qrCode: uid("SP-PASS"),
    createdAt: todayText(),
  };
  savePasses([pass, ...getPasses()]);
  addActivity(`Driver mua ${pass.planName} cho biển số ${pass.licensePlate}`);
  return pass;
}

export function createPayment(input) {
  const payment = {
    id: uid("PAY"),
    ...input,
    status: "PAID",
    paidAt: todayText(),
    qrCode: uid("SP-PAY"),
  };
  savePayments([payment, ...getPayments()]);
  addActivity(`Thanh toán ${formatVnd(payment.amount)} cho ${payment.licensePlate || "khách"}`);
  return payment;
}

export function updateFloorCapacity(id, patch) {
  const next = getFloors().map((floor) => floor.id === id ? { ...floor, ...patch } : floor);
  saveFloors(next);
  addActivity(`Admin cập nhật tầng ${id}`);
  return next;
}

export function getFloorUsage(floor) {
  const occupied = Number(floor.occupied || 0);
  const reserved = Number(floor.reserved || 0);
  const capacity = Number(floor.capacity || 0);
  const available = Math.max(capacity - occupied - reserved, 0);
  const used = Math.min(100, Math.round(((occupied + reserved) / Math.max(capacity, 1)) * 100));
  return { capacity, occupied, reserved, available, used };
}

export function getAnalytics() {
  const floors = getFloors();
  const employees = getEmployees();
  const drivers = getDrivers();
  const reservations = getReservations();
  const passes = getPasses();
  const payments = getPayments();
  const history = getHistory();
  const totalCapacity = floors.reduce((sum, floor) => sum + Number(floor.capacity || 0), 0);
  const totalOccupied = floors.reduce((sum, floor) => sum + Number(floor.occupied || 0), 0);
  const totalReserved = floors.reduce((sum, floor) => sum + Number(floor.reserved || 0), 0);
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
