import { Routes, Route, Navigate } from "react-router-dom";

import { LoginScreen } from "../pages/auth/LoginScreen";

import DriverDashboard from "../pages/driver/DriverDashboard";
import DriverMapping from "../pages/driver/DriverMapping";
import PaymentReturnPage from "../pages/driver/PaymentReturnPage";

import StaffDashboard from "../pages/staff/StaffDashboard";
import StaffCheckIn from "../pages/staff/StaffCheckIn";
import StaffCheckOut from "../pages/staff/StaffCheckOut";
import StaffMapping from "../pages/staff/StaffMapping";
import StaffZoneEntry from "../pages/staff/StaffZoneEntry";
import StaffZoneExit from "../pages/staff/StaffZoneExit";

import ManagerLayout from "../pages/manager/ManagerLayout";
import DashboardPage from "../pages/manager/DashboardPage";
import RevenuePage from "../pages/manager/RevenuePage";
import CapacityPage from "../pages/manager/CapacityPage";
import VehicleTrafficPage from "../pages/manager/VehicleTrafficPage";
import PaymentPage from "../pages/manager/PaymentPage";
import PricingPage from "../pages/manager/PricingPage";
import GateMonitoringPage from "../pages/manager/GateMonitoringPage";
import AdminDashboard from "../pages/admin/AdminDashboard";
import SecurityDashboard from "../pages/security/SecurityDashboard";

import StaffHistory from "../pages/staff/StaffHistory";
import ParkingTwin3DPage from "../pages/shared/ParkingTwin3DPage";
import StaffLayout from "../pages/staff/StaffLayout";
import SecurityPage from "../pages/manager/SecurityPage";

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
          element={<DriverDashboard onLogout={onLogout} defaultTab="dashboard" />}
        />
        <Route
          path="/driver/map"
          element={<DriverMapping onLogout={onLogout} />}
        />
        <Route path="/driver/3d-map" element={<ParkingTwin3DPage />} />
        <Route path="/driver/payment-return" element={<PaymentReturnPage />} />
        <Route path="*" element={<Navigate to="/driver/dashboard" replace />} />
      </Routes>
    );
  }

  if (userRole === "staff") {
    return (
      <Routes>
        <Route element={<StaffLayout onLogout={onLogout} />}>
          <Route
            path="/staff/dashboard"
            element={<StaffDashboard />}
          />
          <Route
            path="/staff/map"
            element={<StaffMapping />}
          />
          <Route
            path="/staff/check-in"
            element={<StaffCheckIn />}
          />
          <Route
            path="/staff/zone-entry"
            element={<StaffZoneEntry />}
          />
          <Route
            path="/staff/zone-exit"
            element={<StaffZoneExit />}
          />
          <Route
            path="/staff/check-out"
            element={<StaffCheckOut />}
          />
          <Route
            path="/staff/history"
            element={<StaffHistory />}
          />
        </Route>
        <Route path="/staff/3d-map" element={<ParkingTwin3DPage />} />
        <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
      </Routes>
    );
  }

  if (userRole === "manager") {
    return (
      <Routes>
        <Route
        path="/manager/*"
        element={<ManagerLayout onLogout={onLogout} />}
      >
        <Route index element={<DashboardPage />} />
        <Route path="revenue" element={<RevenuePage />} />
        <Route path="capacity" element={<CapacityPage />} />
        <Route path="traffic" element={<VehicleTrafficPage />} />
        <Route path="payments" element={<PaymentPage />} />
        <Route path="pricing" element={<PricingPage />} />
        <Route path="gates" element={<GateMonitoringPage />} />
        <Route path="security" element={<SecurityPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/manager" replace />} />
      </Routes>
    );
  }

  if (userRole === "security") {
    return (
      <Routes>
        <Route
          path="/security/dashboard"
          element={<SecurityDashboard onLogout={onLogout} />}
        />
        <Route path="/security/3d-map" element={<ParkingTwin3DPage />} />
        <Route path="*" element={<Navigate to="/security/dashboard" replace />} />
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