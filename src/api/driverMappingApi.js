import { request } from "./apiClient";

export function getDriverParkingMap() {
  return request("/driver/parking-map");
}