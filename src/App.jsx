import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import AppErrorBoundary from "./components/AppErrorBoundary";
import AppRoutes from "./route/AppRoutes";

function normalizeRole(role) {
  if (!role) return null;
  return String(role).toLowerCase().trim();
}

function App() {
  const [userRole, setUserRole] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const savedRole =
        localStorage.getItem("userRole") ||
        localStorage.getItem("role") ||
        JSON.parse(localStorage.getItem("user") || "null")?.role;

      setUserRole(normalizeRole(savedRole));
    } catch (error) {
      console.error("Cannot read saved user role:", error);
      setUserRole(null);
    } finally {
      setIsReady(true);
    }
  }, []);

  const handleLogin = (role) => {
    const normalizedRole = normalizeRole(role);
    localStorage.setItem("userRole", normalizedRole);
    setUserRole(normalizedRole);
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");

    setUserRole(null);
  };

  if (!isReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700">
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-black">Đang tải SmartParking...</p>
          <p className="mt-2 text-sm text-slate-500">Vui lòng chờ trong giây lát.</p>
        </div>
      </main>
    );
  }

  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AppRoutes
          userRole={userRole}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
      </BrowserRouter>
    </AppErrorBoundary>
  );
}

export default App;
