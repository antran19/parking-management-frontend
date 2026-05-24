import { request } from "./apiClient";

export function getDriverDashboard() {
  return request("/driver/dashboard");
}