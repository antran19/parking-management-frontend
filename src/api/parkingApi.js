import axiosClient from "./axiosClient";

export const staffApi = {
  getDashboard() {
    return axiosClient.get("/staff/dashboard");
  },

  getParkingMap() {
    return axiosClient.get("/staff/parking-map");
  },

  checkIn(data) {
    return axiosClient.post("/staff/check-in", data);
  },

  checkOut(data) {
    return axiosClient.post("/staff/check-out", data);
  },

  findVehicleByPlate(plateNumber) {
    return axiosClient.get(
      `/staff/vehicles/plate/${plateNumber}`
    );
  },

  findVehicleByTicket(ticketCode) {
    return axiosClient.get(
      `/staff/vehicles/ticket/${ticketCode}`
    );
  },

  getCheckInHistory() {
    return axiosClient.get(
      "/staff/check-in/history"
    );
  },

  getCheckOutHistory() {
    return axiosClient.get(
      "/staff/check-out/history"
    );
  },
};