import { request } from "./apiClient";

export function getAdminDashboard() {
  return request("/admin/dashboard");
}