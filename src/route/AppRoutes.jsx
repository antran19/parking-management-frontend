import { Routes, Route, Navigate } from "react-router-dom";

import LoginScreen from "../pages/auth/LoginScreen";

import DriverDashboard from "../pages/driver/DriverDashboard";
import DriverMapping from "../pages/driver/DriverMapping";
import DriverReservation from "../pages/driver/DriverReservation";
import DriverPayment from "../pages/driver/DriverPayment";

import StaffDashboard from "../pages/staff/StaffDashboard";
import StaffMapping from "../pages/staff/StaffMapping";

import AdminDashboard from "../pages/admin/AdminDashboard";

function AppRoutes({ userRole, onLogin, onLogout }) {
  const role = userRole ? String(userRole).toLowerCase() : null;

  if (!role) {
    return (
      <Routes>
        <Route path="/login" element={<LoginScreen onLogin={onLogin} />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (role === "driver") {
    return (
      <Routes>
        <Route
          path="/driver/dashboard"
          element={<DriverDashboard onLogout={onLogout} />}
        />

        <Route
          path="/driver/map"
          element={<DriverMapping onLogout={onLogout} />}
        />

        <Route
          path="/driver/reservation"
          element={<DriverReservation onLogout={onLogout} />}
        />

        <Route
          path="/driver/payment"
          element={<DriverPayment onLogout={onLogout} />}
        />

        <Route
          path="/driver/current-session"
          element={<DriverDashboard onLogout={onLogout} />}
        />

        <Route
          path="/driver/history"
          element={<DriverDashboard onLogout={onLogout} />}
        />

        <Route
          path="/driver/profile"
          element={<DriverDashboard onLogout={onLogout} />}
        />

        <Route path="/" element={<Navigate to="/driver/dashboard" replace />} />
        <Route
          path="/login"
          element={<Navigate to="/driver/dashboard" replace />}
        />
        <Route path="*" element={<Navigate to="/driver/dashboard" replace />} />
      </Routes>
    );
  }

  if (role === "staff") {
    return (
      <Routes>
        <Route
          path="/staff/dashboard"
          element={<StaffDashboard onLogout={onLogout} />}
        />

        <Route
          path="/staff/map"
          element={<StaffMapping onLogout={onLogout} />}
        />

        <Route
          path="/staff/check-in"
          element={<StaffDashboard onLogout={onLogout} />}
        />

        <Route
          path="/staff/check-out"
          element={<StaffDashboard onLogout={onLogout} />}
        />

        <Route
          path="/staff/history"
          element={<StaffDashboard onLogout={onLogout} />}
        />

        <Route path="/" element={<Navigate to="/staff/dashboard" replace />} />
        <Route
          path="/login"
          element={<Navigate to="/staff/dashboard" replace />}
        />
        <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
      </Routes>
    );
  }

  if (role === "manager") {
    return (
      <Routes>
        <Route
          path="/manager/dashboard"
          element={<ManagerDashboard onLogout={onLogout} />}
        />

        <Route path="/" element={<Navigate to="/manager/dashboard" replace />} />
        <Route
          path="/login"
          element={<Navigate to="/manager/dashboard" replace />}
        />
        <Route path="*" element={<Navigate to="/manager/dashboard" replace />} />
      </Routes>
    );
  }

  if (role === "admin") {
    return (
      <Routes>
        <Route
          path="/admin/dashboard"
          element={<AdminDashboard onLogout={onLogout} />}
        />

        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route
          path="/login"
          element={<Navigate to="/admin/dashboard" replace />}
        />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    );
  }

  localStorage.removeItem("accessToken");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("userRole");
  localStorage.removeItem("role");

  return (
    <Routes>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;