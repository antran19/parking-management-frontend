import type { UserRole } from "../types/auth";

const API_URL = import.meta.env.VITE_API_URL;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthUser {
  id?: number;
  fullName?: string;
  email?: string;
  role: UserRole;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Call API thất bại");
  }

  return res.json();
}

export function loginApi(data: LoginRequest) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function registerApi(data: RegisterRequest) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function forgotPasswordApi(email: string) {
  return request("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}