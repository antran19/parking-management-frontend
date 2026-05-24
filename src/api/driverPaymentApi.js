import { request } from "./apiClient";

export function getDriverPaymentInfo() {
  return request("/driver/payment/current");
}

export function confirmDriverPayment(payload) {
  return request("/driver/payment/confirm", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}