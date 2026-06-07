// src/services/adminStorage.js

import { parkingFloors } from "../data/parkingData";

const STORAGE_KEYS = {
  employees: "smartParking.admin.employees",
  auditLogs: "smartParking.admin.auditLogs",
  parkingFloors: "smartParking.admin.parkingFloors",
};

export const roleCatalog = [
  {
    value: "ADMIN",
    label: "Quản trị viên",
    group: "System",
    description: "Quản trị toàn hệ thống, nhân viên, phân quyền và cấu hình.",
    permissions: [
      "Quản lý nhân viên",
      "Thêm / sửa / khóa tài khoản",
      "Phân quyền hệ thống",
      "Cấu hình tầng và capacity",
      "Xem toàn bộ báo cáo",
    ],
  },
  {
    value: "MANAGER",
    label: "Quản lý bãi xe",
    group: "Operation",
    description: "Theo dõi vận hành, báo cáo doanh thu và capacity.",
    permissions: [
      "Xem dashboard vận hành",
      "Xem báo cáo doanh thu",
      "Theo dõi capacity tầng/khu",
      "Xem log xe ra vào",
    ],
  },
  {
    value: "STAFF",
    label: "Nhân viên vận hành",
    group: "Operation",
    description: "Check-in, check-out và xác nhận QR cho xe vào/ra bãi.",
    permissions: [
      "Check-in xe vãng lai",
      "Quét QR đặt chỗ",
      "Check-out và xác nhận thanh toán",
      "Xem sơ đồ bãi xe Staff",
    ],
  },
  {
    value: "SECURITY",
    label: "Bảo vệ / an ninh",
    group: "Security",
    description: "Xử lý ngoại lệ, mất QR, sai biển số và mở cổng thủ công.",
    permissions: [
      "Ghi nhận sự cố",
      "Xử lý mất QR",
      "Mở cổng thủ công",
      "Xem log ngoại lệ",
    ],
  },
];

const defaultEmployees = [
  {
    id: "EMP-001",
    fullName: "System Admin",
    email: "admin@smartparking.local",
    phone: "0900 000 001",
    role: "ADMIN",
    department: "Ban quản trị hệ thống",
    shift: "Giờ hành chính",
    status: "ACTIVE",
    lastLogin: "2026-05-26T08:00:00.000Z",
    createdAt: "2026-05-20T08:00:00.000Z",
    note: "Tài khoản admin chính của hệ thống.",
  },
  {
    id: "EMP-002",
    fullName: "Minh An",
    email: "manager@smartparking.local",
    phone: "0900 000 002",
    role: "MANAGER",
    department: "Quản lý vận hành",
    shift: "Giờ hành chính",
    status: "ACTIVE",
    lastLogin: "2026-05-26T07:45:00.000Z",
    createdAt: "2026-05-21T08:00:00.000Z",
    note: "Theo dõi report, doanh thu và capacity.",
  },
  {
    id: "EMP-003",
    fullName: "Tá Thiên",
    email: "staff@smartparking.local",
    phone: "0900 000 003",
    role: "STAFF",
    department: "Cổng chính",
    shift: "Ca sáng",
    status: "ACTIVE",
    lastLogin: "2026-05-26T06:50:00.000Z",
    createdAt: "2026-05-22T08:00:00.000Z",
    note: "Phụ trách check-in/check-out và quét QR.",
  },
  {
    id: "EMP-004",
    fullName: "Bảo vệ ca đêm",
    email: "security@smartparking.local",
    phone: "0900 000 004",
    role: "SECURITY",
    department: "An ninh tầng",
    shift: "Ca đêm",
    status: "PENDING",
    lastLogin: "",
    createdAt: "2026-05-24T08:00:00.000Z",
    note: "Chờ kích hoạt sau khi training xử lý ngoại lệ.",
  },
  {
    id: "EMP-005",
    fullName: "Ngọc Quảng",
    email: "quang.admin@smartparking.local",
    phone: "0900 000 005",
    role: "ADMIN",
    department: "Frontend / QA",
    shift: "Giờ hành chính",
    status: "ACTIVE",
    lastLogin: "2026-05-26T08:30:00.000Z",
    createdAt: "2026-05-24T08:00:00.000Z",
    note: "Phụ trách Driver UI, Admin UI và QA demo.",
  },
];

const defaultAuditLogs = [
  {
    id: "LOG-001",
    title: "Gộp quản lý user và role vào Quản lý nhân viên",
    actor: "System Admin",
    time: "2026-05-26T08:45:00.000Z",
    type: "ROLE_UPDATE",
  },
  {
    id: "LOG-002",
    title: "Cập nhật quyền cho Staff: quét QR check-in/check-out",
    actor: "System Admin",
    time: "2026-05-26T08:30:00.000Z",
    type: "PERMISSION_UPDATE",
  },
  {
    id: "LOG-003",
    title: "Khởi tạo dữ liệu nhân viên demo",
    actor: "System",
    time: "2026-05-26T08:15:00.000Z",
    type: "CREATE",
  },
];

function hasStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeRead(key, fallback) {
  if (!hasStorage()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key, value) {
  if (!hasStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

export function getRoleMeta(role) {
  return roleCatalog.find((item) => item.value === role) || roleCatalog[2];
}

export function getAdminEmployees() {
  return safeRead(STORAGE_KEYS.employees, defaultEmployees);
}

export function saveAdminEmployees(employees) {
  safeWrite(STORAGE_KEYS.employees, employees);
}

export function getAdminAuditLogs() {
  return safeRead(STORAGE_KEYS.auditLogs, defaultAuditLogs);
}

export function saveAdminAuditLogs(logs) {
  safeWrite(STORAGE_KEYS.auditLogs, logs);
}

export function pushAuditLog(title, actor = "System Admin", type = "UPDATE") {
  const nextLog = {
    id: makeId("LOG"),
    title,
    actor,
    type,
    time: new Date().toISOString(),
  };

  const nextLogs = [nextLog, ...getAdminAuditLogs()].slice(0, 12);
  saveAdminAuditLogs(nextLogs);
  return nextLogs;
}

export function createAdminEmployee(employee) {
  const newEmployee = {
    ...employee,
    id: makeId("EMP"),
    fullName: employee.fullName.trim(),
    email: employee.email.trim().toLowerCase(),
    status: employee.status || "ACTIVE",
    createdAt: new Date().toISOString(),
    lastLogin: "",
  };

  const nextEmployees = [newEmployee, ...getAdminEmployees()];
  saveAdminEmployees(nextEmployees);
  pushAuditLog(`Thêm nhân viên ${newEmployee.fullName} với role ${newEmployee.role}`, "System Admin", "CREATE");
  return nextEmployees;
}

export function updateAdminEmployee(employeeId, updates) {
  const nextEmployees = getAdminEmployees().map((employee) =>
    employee.id === employeeId
      ? {
          ...employee,
          ...updates,
          fullName: updates.fullName?.trim() || employee.fullName,
          email: updates.email?.trim().toLowerCase() || employee.email,
        }
      : employee
  );

  saveAdminEmployees(nextEmployees);
  pushAuditLog(`Cập nhật thông tin / role cho nhân viên ${updates.fullName || employeeId}`, "System Admin", "UPDATE");
  return nextEmployees;
}

export function toggleEmployeeStatus(employeeId) {
  const employees = getAdminEmployees();
  const target = employees.find((employee) => employee.id === employeeId);
  const nextStatus = target?.status === "ACTIVE" ? "LOCKED" : "ACTIVE";

  const nextEmployees = employees.map((employee) =>
    employee.id === employeeId ? { ...employee, status: nextStatus } : employee
  );

  saveAdminEmployees(nextEmployees);
  pushAuditLog(`${nextStatus === "LOCKED" ? "Khóa" : "Mở khóa"} tài khoản ${target?.fullName || employeeId}`, "System Admin", "STATUS_UPDATE");
  return nextEmployees;
}

export function deleteAdminEmployee(employeeId) {
  const employees = getAdminEmployees();
  const target = employees.find((employee) => employee.id === employeeId);
  const nextEmployees = employees.filter((employee) => employee.id !== employeeId);

  saveAdminEmployees(nextEmployees);
  pushAuditLog(`Xóa nhân viên ${target?.fullName || employeeId}`, "System Admin", "DELETE");
  return nextEmployees;
}

export function getEmployeeSummary(employees = getAdminEmployees()) {
  const internalRoles = ["ADMIN", "MANAGER", "STAFF", "SECURITY"];
  const byRole = Object.fromEntries(internalRoles.map((role) => [role, 0]));

  for (const employee of employees) {
    if (employee.role in byRole) byRole[employee.role] += 1;
  }

  return {
    total: employees.length,
    active: employees.filter((employee) => employee.status === "ACTIVE").length,
    locked: employees.filter((employee) => employee.status === "LOCKED").length,
    pending: employees.filter((employee) => employee.status === "PENDING").length,
    byRole,
  };
}

export function getAdminParkingFloors() {
  return safeRead(STORAGE_KEYS.parkingFloors, parkingFloors);
}

export function saveAdminParkingFloors(floors) {
  safeWrite(STORAGE_KEYS.parkingFloors, floors);
}

export function updateAdminParkingFloor(floorId, updates) {
  const nextFloors = getAdminParkingFloors().map((floor) =>
    floor.id === floorId
      ? {
          ...floor,
          ...updates,
          capacity: Number(updates.capacity),
          occupied: Number(updates.occupied),
          reserved: Number(updates.reserved),
        }
      : floor
  );

  saveAdminParkingFloors(nextFloors);
  pushAuditLog(`Cập nhật capacity tầng ${floorId}`, "System Admin", "PARKING_UPDATE");
  return nextFloors;
}

export function resetAdminParkingFloors() {
  saveAdminParkingFloors(parkingFloors);
  pushAuditLog("Reset cấu hình tầng/capacity về dữ liệu mẫu", "System Admin", "RESET");
  return parkingFloors;
}

export function formatAdminDateTime(value) {
  if (!value) return "Chưa đăng nhập";

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
