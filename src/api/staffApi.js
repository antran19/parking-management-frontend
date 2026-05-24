import { request } from "./apiClient";

export const staffApi = {
  getDashboard: () => request("/staff/dashboard"),
};