const API_URL = import.meta.env.VITE_API_URL;

async function request(path) {
  const res = await fetch(`${API_URL}${path}`);

  if (!res.ok) {
    throw new Error("Call API thất bại");
  }

  return res.json();
}

export const staffApi = {
  getDashboard: () => request("/staff/dashboard"),
};