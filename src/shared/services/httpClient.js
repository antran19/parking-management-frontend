const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

function getToken() {
  return localStorage.getItem("token") || "";
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body && !(options.body instanceof FormData)
      ? JSON.stringify(options.body)
      : options.body,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || `API error ${response.status}`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function apiGet(path, fallback = []) {
  try {
    const data = await apiRequest(path);
    return data?.data ?? data ?? fallback;
  } catch (error) {
    console.warn(`Cannot load ${path}:`, error.message);
    return fallback;
  }
}

export async function apiPost(path, payload) {
  return apiRequest(path, { method: "POST", body: payload });
}

export async function apiPut(path, payload) {
  return apiRequest(path, { method: "PUT", body: payload });
}

export async function apiDelete(path) {
  return apiRequest(path, { method: "DELETE" });
}
