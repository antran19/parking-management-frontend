const API_URL = import.meta.env.VITE_API_URL;

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Call API thất bại");
  }

  return res.json();
}

export function loginApi(data) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function registerApi(data) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function forgotPasswordApi(email) {
  return request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}