import { request } from "./apiClient";

export function getDriverReservationOptions() {
  return request("/driver/reservations/options");
}

export function createDriverReservation(payload) {
  return request("/driver/reservations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}