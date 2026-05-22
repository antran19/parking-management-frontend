import { Routes, Route, Navigate } from "react-router-dom";

import { LoginScreen } from "../pages/auth/LoginScreen";

import DriverDashboard from "../pages/driver/DriverDashboard";
import DriverMapping from "../pages/driver/DriverMapping";

import StaffDashboard from "../pages/staff/StaffDashboard";
import StaffCheckIn from "../pages/staff/StaffCheckIn";
import StaffCheckOut from "../pages/staff/StaffCheckOut";
import StaffMapping from "../pages/staff/StaffMapping";

import ManagerDashboard from "../pages/manager/ManagerDashboard";
import AdminDashboard from "../pages/admin/AdminDashboard";

function AppRoutes({ userRole, onLogin, onLogout }) {
  if (!userRole) {
    return (
      <Routes>
        <Route path="/login" element={<LoginScreen onLogin={onLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  if (userRole === "driver") {
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
        <Route path="*" element={<Navigate to="/driver/dashboard" replace />} />
      </Routes>
    );
  }

  if (userRole === "staff") {
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
          element={<StaffCheckIn onLogout={onLogout} />}
        />
        <Route
          path="/staff/check-out"
          element={<StaffCheckOut onLogout={onLogout} />}
        />
        <Route
          path="/staff/history"
          element={<StaffDashboard onLogout={onLogout} />}
        />
        <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
      </Routes>
    );
  }

  if (userRole === "manager") {
    return (
      <Routes>
        <Route
          path="/manager/dashboard"
          element={<ManagerDashboard onLogout={onLogout} />}
        />
        <Route path="*" element={<Navigate to="/manager/dashboard" replace />} />
      </Routes>
    );
  }

  if (userRole === "admin") {
    return (
      <Routes>
        <Route
          path="/admin/dashboard"
          element={<AdminDashboard onLogout={onLogout} />}
        />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    );
  }

  return <Navigate to="/login" replace />;
}

export default AppRoutes;