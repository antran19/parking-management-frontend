import { request } from "./apiClient";

export function getStaffParkingMap() {
  return request("/staff/parking-map");
}