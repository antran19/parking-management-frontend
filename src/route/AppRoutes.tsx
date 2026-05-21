import { Routes, Route, Navigate } from "react-router-dom";
import type { UserRole } from "../types/auth";

import { LoginScreen } from "../pages/auth/LoginScreen";

import DriverDashboard from "../pages/driver/DriverDashboard";
import DriverMapping from "../pages/driver/DriverMapping";

import StaffDashboard from "../pages/staff/StaffDashboard";
import StaffMapping from "../pages/staff/StaffMapping";
//import StaffCheckin from "../pages/staff/StaffCheckin";

import ManagerDashboard from "../pages/manager/ManagerDashboard";
import AdminDashboard from "../pages/admin/AdminDashboard";

interface AppRoutesProps {
  userRole: UserRole;
  onLogin: (role: UserRole) => void;
  onLogout: () => void;
}

function AppRoutes({ userRole, onLogin, onLogout }: AppRoutesProps) {
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
        <Route path="/driver/map" element={<DriverMapping />} />
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

        <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
      </Routes>
    );
  }

  if (userRole === "manager") {
    return (
      <Routes>
        <Route path="/manager/dashboard" element={<ManagerDashboard />} />
        <Route path="*" element={<Navigate to="/manager/dashboard" replace />} />
      </Routes>
    );
  }

  if (userRole === "admin") {
    return (
      <Routes>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    );
  }

  return <Navigate to="/login" replace />;
}

export default AppRoutes;