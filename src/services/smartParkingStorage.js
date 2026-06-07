// src/services/smartParkingStorage.js

import {
  calculatePassPrice,
  getFloorById,
  getPassPlanLabel,
  getSuggestedFloor,
  getVehicleLabel,
} from "../data/parkingData";

const STORAGE_KEYS = {
  reservations: "smartParking.reservations",
  passes: "smartParking.passes",
  payments: "smartParking.payments",
  history: "smartParking.history",
  activeSession: "smartParking.activeSession",
};

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function pad(number) {
  return String(number).padStart(2, "0");
}

function dateCode(date = new Date()) {
  return `${String(date.getFullYear()).slice(2)}${pad(date.getMonth() + 1)}${pad(
    date.getDate()
  )}`;
}

function makeCode(prefix) {
  return `${prefix}-${dateCode()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function toDateTimeText(value) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function createQrPayload(type, payload) {
  return JSON.stringify({
    type,
    version: "SMART_PARKING_V2",
    createdAt: new Date().toISOString(),
    payload,
  });
}

function parseQrPayload(qrText) {
  try {
    const parsed = JSON.parse(qrText);
    if (parsed?.version === "SMART_PARKING_V2" && parsed?.type) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export function getReservations() {
  return safeRead(STORAGE_KEYS.reservations, []);
}

export function saveReservations(reservations) {
  safeWrite(STORAGE_KEYS.reservations, reservations);
}

export function getPasses() {
  return safeRead(STORAGE_KEYS.passes, []);
}

export function savePasses(passes) {
  safeWrite(STORAGE_KEYS.passes, passes);
}

export function getPayments() {
  return safeRead(STORAGE_KEYS.payments, []);
}

export function savePayments(payments) {
  safeWrite(STORAGE_KEYS.payments, payments);
}

export function getHistory() {
  const saved = safeRead(STORAGE_KEYS.history, []);

  if (saved.length > 0) return saved;

  return [
    {
      id: "HIS-250526-001",
      sessionCode: "SES-250526-001",
      licensePlate: "30A-123.45",
      vehicleType: "CAR_4",
      vehicleLabel: "Ô tô 4 chỗ",
      floorId: "B1",
      floorLabel: "Tầng B1",
      areaId: "A",
      checkInAt: "2026-05-26T01:30:00.000Z",
      checkOutAt: "2026-05-26T05:45:00.000Z",
      fee: 80000,
      paymentMethod: "QR_BANKING",
      paymentStatus: "PAID",
    },
    {
      id: "HIS-250525-002",
      sessionCode: "SES-250525-002",
      licensePlate: "59X2-456.78",
      vehicleType: "MOTORBIKE",
      vehicleLabel: "Xe máy",
      floorId: "A2",
      floorLabel: "Tầng A2",
      areaId: "B",
      checkInAt: "2026-05-25T06:15:00.000Z",
      checkOutAt: "2026-05-25T10:10:00.000Z",
      fee: 20000,
      paymentMethod: "CASH",
      paymentStatus: "PAID",
    },
  ];
}

export function saveHistory(history) {
  safeWrite(STORAGE_KEYS.history, history);
}

export function getActiveSession() {
  const saved = safeRead(STORAGE_KEYS.activeSession, null);

  if (saved) return saved;

  const floor = getFloorById("B1");
  const session = {
    id: "SES-DEMO-ACTIVE",
    sessionCode: "SES-260526-DEMO",
    licensePlate: "30A-123.45",
    vehicleType: "CAR_4",
    vehicleLabel: "Ô tô 4 chỗ",
    floorId: floor.id,
    floorLabel: floor.label,
    areaId: "A",
    gateIn: "MAIN_ENTRY + ZONE_BOTH",
    checkInAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: "ACTIVE",
    baseFee: 30000,
    extraFee: 30000,
    serviceFee: 5000,
  };

  safeWrite(STORAGE_KEYS.activeSession, session);
  return session;
}

export function saveActiveSession(session) {
  safeWrite(STORAGE_KEYS.activeSession, session);
}

export function clearActiveSession() {
  localStorage.removeItem(STORAGE_KEYS.activeSession);
}

export function createReservation({
  licensePlate,
  vehicleType,
  floorId,
  areaId,
  startTime,
  note,
}) {
  const floor = getFloorById(floorId);
  const reservationCode = makeCode("RSV");

  const reservation = {
    id: reservationCode,
    reservationCode,
    licensePlate: licensePlate.trim().toUpperCase(),
    vehicleType,
    vehicleLabel: getVehicleLabel(vehicleType),
    floorId: floor.id,
    floorLabel: floor.label,
    areaId,
    zoneCode: `${floor.id}-${areaId}`,
    startTime,
    note: note || "",
    status: "WAITING_STAFF_CONFIRM",
    driverType: "PRE_BOOKED",
    createdAt: new Date().toISOString(),
  };

  const qrPayload = createQrPayload("RESERVATION_CONFIRM", {
    reservationCode,
    licensePlate: reservation.licensePlate,
    vehicleType,
    vehicleLabel: reservation.vehicleLabel,
    floorId: floor.id,
    floorLabel: floor.label,
    areaId,
    zoneCode: reservation.zoneCode,
    driverType: reservation.driverType,
  });

  const completeReservation = {
    ...reservation,
    qrPayload,
  };

  saveReservations([completeReservation, ...getReservations()]);
  return completeReservation;
}

export function confirmReservationCheckIn(reservationCode) {
  const reservations = getReservations();
  const reservation = reservations.find((item) => item.reservationCode === reservationCode);

  if (!reservation) return null;

  const updated = reservations.map((item) =>
    item.reservationCode === reservationCode
      ? { ...item, status: "CHECKED_IN", checkedInAt: new Date().toISOString() }
      : item
  );

  saveReservations(updated);

  const session = {
    id: makeCode("SES"),
    sessionCode: makeCode("SES"),
    licensePlate: reservation.licensePlate,
    vehicleType: reservation.vehicleType,
    vehicleLabel: reservation.vehicleLabel,
    floorId: reservation.floorId,
    floorLabel: reservation.floorLabel,
    areaId: reservation.areaId,
    gateIn: "MAIN_ENTRY + ZONE_BOTH",
    checkInAt: new Date().toISOString(),
    status: "ACTIVE",
    driverType: "PRE_BOOKED",
    baseFee: 30000,
    extraFee: 0,
    serviceFee: 5000,
  };

  saveActiveSession(session);
  return session;
}

export function createPassPayment({ licensePlate, vehicleType, passType, paymentMethod }) {
  const paymentCode = makeCode("PASS-PAY");
  const amount = calculatePassPrice(vehicleType, passType);

  const payment = {
    id: paymentCode,
    paymentCode,
    purpose: "BUY_PARKING_PASS",
    licensePlate: licensePlate.trim().toUpperCase(),
    vehicleType,
    vehicleLabel: getVehicleLabel(vehicleType),
    passType,
    passLabel: getPassPlanLabel(passType),
    amount,
    paymentMethod,
    status: paymentMethod === "CASH" ? "WAITING_STAFF_CONFIRM" : "WAITING_PAYMENT",
    createdAt: new Date().toISOString(),
  };

  const qrPayload = createQrPayload("PASS_PAYMENT", {
    paymentCode,
    licensePlate: payment.licensePlate,
    vehicleLabel: payment.vehicleLabel,
    passLabel: payment.passLabel,
    amount,
    paymentMethod,
    purpose: payment.purpose,
  });

  const completePayment = {
    ...payment,
    qrPayload,
  };

  savePayments([completePayment, ...getPayments()]);
  return completePayment;
}

export function activatePassFromPayment(paymentCode) {
  const payments = getPayments();
  const payment = payments.find((item) => item.paymentCode === paymentCode);

  if (!payment) return null;

  const now = new Date();
  const endDate = new Date(now);
  if (payment.passType === "MONTHLY") endDate.setMonth(endDate.getMonth() + 1);
  if (payment.passType === "QUARTERLY") endDate.setMonth(endDate.getMonth() + 3);
  if (payment.passType === "YEARLY") endDate.setFullYear(endDate.getFullYear() + 1);

  const passCode = makeCode("PASS");
  const pass = {
    id: passCode,
    passCode,
    licensePlate: payment.licensePlate,
    vehicleType: payment.vehicleType,
    vehicleLabel: payment.vehicleLabel,
    passType: payment.passType,
    passLabel: payment.passLabel,
    startDate: now.toISOString(),
    endDate: endDate.toISOString(),
    status: "ACTIVE",
    price: payment.amount,
    paymentCode: payment.paymentCode,
  };

  const qrPayload = createQrPayload("PARKING_PASS_CONFIRM", {
    passCode,
    licensePlate: pass.licensePlate,
    vehicleType: pass.vehicleType,
    vehicleLabel: pass.vehicleLabel,
    passType: pass.passType,
    passLabel: pass.passLabel,
    status: pass.status,
    endDate: pass.endDate,
    driverType: "SUBSCRIBER",
  });

  const completePass = {
    ...pass,
    qrPayload,
  };

  savePasses([completePass, ...getPasses()]);

  savePayments(
    payments.map((item) =>
      item.paymentCode === paymentCode
        ? { ...item, status: "PAID", paidAt: new Date().toISOString(), passCode }
        : item
    )
  );

  return completePass;
}

export function createCheckoutPayment({ session, paymentMethod }) {
  const amount = session.baseFee + session.extraFee + session.serviceFee;
  const paymentCode = makeCode("OUT-PAY");

  const payment = {
    id: paymentCode,
    paymentCode,
    purpose: "CHECKOUT_PAYMENT",
    sessionCode: session.sessionCode,
    licensePlate: session.licensePlate,
    vehicleType: session.vehicleType,
    vehicleLabel: session.vehicleLabel,
    floorLabel: session.floorLabel,
    areaId: session.areaId,
    amount,
    paymentMethod,
    status: paymentMethod === "CASH" ? "WAITING_STAFF_CONFIRM" : "WAITING_PAYMENT",
    createdAt: new Date().toISOString(),
  };

  const qrPayload = createQrPayload("CHECKOUT_PAYMENT", {
    paymentCode,
    sessionCode: session.sessionCode,
    licensePlate: session.licensePlate,
    vehicleLabel: session.vehicleLabel,
    amount,
    paymentMethod,
    purpose: payment.purpose,
  });

  const completePayment = {
    ...payment,
    qrPayload,
  };

  savePayments([completePayment, ...getPayments()]);
  return completePayment;
}

export function confirmCheckoutPayment(paymentCode) {
  const payments = getPayments();
  const payment = payments.find((item) => item.paymentCode === paymentCode);

  if (!payment) return null;

  const session = getActiveSession();
  const exitCode = makeCode("EXIT");
  const paidAt = new Date().toISOString();

  const exitQrPayload = createQrPayload("EXIT_CONFIRM", {
    exitCode,
    paymentCode,
    sessionCode: payment.sessionCode,
    licensePlate: payment.licensePlate,
    amount: payment.amount,
    paidAt,
    message: "Driver đã thanh toán, Staff xác nhận cho xe rời bãi.",
  });

  const updatedPayment = {
    ...payment,
    status: "PAID",
    paidAt,
    exitCode,
    exitQrPayload,
  };

  savePayments(
    payments.map((item) => (item.paymentCode === paymentCode ? updatedPayment : item))
  );

  const historyItem = {
    id: makeCode("HIS"),
    sessionCode: session.sessionCode,
    licensePlate: session.licensePlate,
    vehicleType: session.vehicleType,
    vehicleLabel: session.vehicleLabel,
    floorId: session.floorId,
    floorLabel: session.floorLabel,
    areaId: session.areaId,
    checkInAt: session.checkInAt,
    checkOutAt: paidAt,
    fee: payment.amount,
    paymentMethod: payment.paymentMethod,
    paymentStatus: "PAID",
  };

  saveHistory([historyItem, ...getHistory()]);
  clearActiveSession();
  return updatedPayment;
}

export function createManualCheckIn({ licensePlate, vehicleType, areaId }) {
  const floor = getSuggestedFloor(vehicleType);
  const sessionCode = makeCode("SES");

  const session = {
    id: sessionCode,
    sessionCode,
    licensePlate: licensePlate.trim().toUpperCase(),
    vehicleType,
    vehicleLabel: getVehicleLabel(vehicleType),
    floorId: floor.id,
    floorLabel: floor.label,
    areaId,
    gateIn: "MAIN_ENTRY + ZONE_BOTH",
    checkInAt: new Date().toISOString(),
    status: "ACTIVE",
    driverType: "GUEST",
    baseFee: 30000,
    extraFee: 0,
    serviceFee: 5000,
  };

  const qrPayload = createQrPayload("PARKING_SESSION", {
    sessionCode,
    licensePlate: session.licensePlate,
    vehicleType,
    vehicleLabel: session.vehicleLabel,
    floorId: floor.id,
    floorLabel: floor.label,
    areaId,
    driverType: "GUEST",
  });

  const completeSession = {
    ...session,
    qrPayload,
  };

  saveActiveSession(completeSession);
  return completeSession;
}

export function lookupQr(qrText) {
  const parsed = parseQrPayload(qrText);

  if (parsed) {
    return {
      found: true,
      type: parsed.type,
      data: parsed.payload,
      raw: parsed,
    };
  }

  const trimmed = qrText.trim().toUpperCase();

  const reservation = getReservations().find(
    (item) => item.reservationCode === trimmed || item.id === trimmed
  );
  if (reservation) {
    return { found: true, type: "RESERVATION_CONFIRM", data: reservation };
  }

  const pass = getPasses().find((item) => item.passCode === trimmed || item.id === trimmed);
  if (pass) {
    return { found: true, type: "PARKING_PASS_CONFIRM", data: pass };
  }

  const payment = getPayments().find(
    (item) =>
      item.paymentCode === trimmed || item.exitCode === trimmed || item.sessionCode === trimmed
  );
  if (payment) {
    return {
      found: true,
      type: payment.purpose === "CHECKOUT_PAYMENT" ? "CHECKOUT_PAYMENT" : "PASS_PAYMENT",
      data: payment,
    };
  }

  return { found: false, type: "UNKNOWN", data: null };
}

export function formatDateTime(value) {
  return value ? toDateTimeText(value) : "-";
}

export function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")}đ`;
}
