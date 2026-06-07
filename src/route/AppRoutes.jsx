import { Navigate, Route, Routes } from "react-router-dom";

import { LoginScreen } from "../pages/auth/LoginScreen";

import DriverDashboard from "../features/driver/pages/DriverDashboard";
import DriverMapping from "../features/driver/pages/DriverMapping";
import DriverReservation from "../features/driver/pages/DriverReservation";
import DriverPass from "../features/driver/pages/DriverPass";
import DriverPayment from "../features/driver/pages/DriverPayment";
import DriverHistory from "../features/driver/pages/DriverHistory";
import DriverProfile from "../features/driver/pages/DriverProfile";

import AdminDashboard from "../features/admin/pages/AdminDashboard";
import AdminEmployees from "../features/admin/pages/AdminEmployees";
import AdminDrivers from "../features/admin/pages/AdminDrivers";
import AdminParking from "../features/admin/pages/AdminParking";
import AdminPackages from "../features/admin/pages/AdminPackages";
import AdminReservations from "../features/admin/pages/AdminReservations";
import AdminFinance from "../features/admin/pages/AdminFinance";
import AdminSettings from "../features/admin/pages/AdminSettings";

import StaffDashboard from "../pages/staff/StaffDashboard";
import StaffMapping from "../pages/staff/StaffMapping";
import StaffCheckin from "../pages/staff/StaffCheckin";
import StaffCheckout from "../pages/staff/StaffCheckout";
import ManagerDashboard from "../pages/manager/ManagerDashboard";

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
        <Route path="/driver/dashboard" element={<DriverDashboard onLogout={onLogout} />} />
        <Route path="/driver/map" element={<DriverMapping onLogout={onLogout} />} />
        <Route path="/driver/reservation" element={<DriverReservation onLogout={onLogout} />} />
        <Route path="/driver/pass" element={<DriverPass onLogout={onLogout} />} />
        <Route path="/driver/active-pass" element={<Navigate to="/driver/pass" replace />} />
        <Route path="/driver/payment" element={<DriverPayment onLogout={onLogout} />} />
        <Route path="/driver/history" element={<DriverHistory onLogout={onLogout} />} />
        <Route path="/driver/profile" element={<DriverProfile onLogout={onLogout} />} />
        <Route path="*" element={<Navigate to="/driver/dashboard" replace />} />
      </Routes>
    );
  }

  if (userRole === "admin") {
    return (
      <Routes>
        <Route path="/admin/dashboard" element={<AdminDashboard onLogout={onLogout} />} />
        <Route path="/admin/employees" element={<AdminEmployees onLogout={onLogout} />} />
        <Route path="/admin/users" element={<AdminEmployees onLogout={onLogout} />} />
        <Route path="/admin/roles" element={<AdminEmployees onLogout={onLogout} />} />
        <Route path="/admin/staff" element={<AdminEmployees onLogout={onLogout} />} />
        <Route path="/admin/drivers" element={<AdminDrivers onLogout={onLogout} />} />
        <Route path="/admin/parking" element={<AdminParking onLogout={onLogout} />} />
        <Route path="/admin/packages" element={<AdminPackages onLogout={onLogout} />} />
        <Route path="/admin/reservations" element={<AdminReservations onLogout={onLogout} />} />
        <Route path="/admin/finance" element={<AdminFinance onLogout={onLogout} />} />
        <Route path="/admin/settings" element={<AdminSettings onLogout={onLogout} />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    );
  }

  if (userRole === "staff") {
    return (
      <Routes>
        <Route path="/staff/dashboard" element={<StaffDashboard onLogout={onLogout} />} />
        <Route path="/staff/map" element={<StaffMapping onLogout={onLogout} />} />
        <Route path="/staff/check-in" element={<StaffCheckin onLogout={onLogout} />} />
        <Route path="/staff/check-out" element={<StaffCheckout onLogout={onLogout} />} />
        <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
      </Routes>
    );
  }

  if (userRole === "manager") {
    return (
      <Routes>
        <Route path="/manager/dashboard" element={<ManagerDashboard onLogout={onLogout} />} />
        <Route path="*" element={<Navigate to="/manager/dashboard" replace />} />
      </Routes>
    );
  }

  return <Navigate to="/login" replace />;
}

export default AppRoutes;
