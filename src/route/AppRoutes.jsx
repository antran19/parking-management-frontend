import { Navigate, Route, Routes } from "react-router-dom";

import { LoginScreen } from "../pages/auth/LoginScreen";

import DriverDashboardPage from "../features/driver/pages/DriverDashboardPage";
import DriverMappingPage from "../features/driver/pages/DriverMappingPage";
import DriverBookingPage from "../features/driver/pages/DriverBookingPage";
import DriverPassBuyPage from "../features/driver/pages/DriverPassBuyPage";
import DriverQrPassPage from "../features/driver/pages/DriverQrPassPage";
import DriverPaymentPage from "../features/driver/pages/DriverPaymentPage";
import DriverHistoryPage from "../features/driver/pages/DriverHistoryPage";
import DriverProfilePage from "../features/driver/pages/DriverProfilePage";

import AdminDashboardPage from "../features/admin/pages/AdminDashboardPage";
import AdminStaffPage from "../features/admin/pages/AdminStaffPage";
import AdminDriverListPage from "../features/admin/pages/AdminDriverListPage";
import AdminMappingPage from "../features/admin/pages/AdminMappingPage";
import AdminPackagePlanPage from "../features/admin/pages/AdminPackagePlanPage";
import AdminBookingListPage from "../features/admin/pages/AdminBookingListPage";
import AdminRevenuePage from "../features/admin/pages/AdminRevenuePage";
import AdminSystemSettingPage from "../features/admin/pages/AdminSystemSettingPage";


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
        <Route path="/driver/dashboard" element={<DriverDashboardPage onLogout={onLogout} />} />
        <Route path="/driver/mapping" element={<DriverMappingPage onLogout={onLogout} />} />
        <Route path="/driver/reservation" element={<DriverBookingPage onLogout={onLogout} />} />
        <Route path="/driver/pass" element={<DriverPassBuyPage onLogout={onLogout} />} />
        <Route path="/driver/active-pass" element={<DriverQrPassPage onLogout={onLogout} />} />
        <Route path="/driver/payment" element={<DriverPaymentPage onLogout={onLogout} />} />
        <Route path="/driver/history" element={<DriverHistoryPage onLogout={onLogout} />} />
        <Route path="/driver/profile" element={<DriverProfilePage onLogout={onLogout} />} />
        <Route path="*" element={<Navigate to="/driver/dashboard" replace />} />
      </Routes>
    );
  }

  if (userRole === "admin") {
    return (
      <Routes>
        <Route path="/admin/dashboard" element={<AdminDashboardPage onLogout={onLogout} />} />
        <Route path="/admin/employees" element={<AdminStaffPage onLogout={onLogout} />} />
        <Route path="/admin/users" element={<AdminStaffPage onLogout={onLogout} />} />
        <Route path="/admin/roles" element={<AdminStaffPage onLogout={onLogout} />} />
        <Route path="/admin/staff" element={<AdminStaffPage onLogout={onLogout} />} />
        <Route path="/admin/drivers" element={<AdminDriverListPage onLogout={onLogout} />} />
        <Route path="/admin/mapping" element={<AdminMappingPage onLogout={onLogout} />} />
        <Route path="/admin/packages" element={<AdminPackagePlanPage onLogout={onLogout} />} />
        <Route path="/admin/reservations" element={<AdminBookingListPage onLogout={onLogout} />} />
        <Route path="/admin/finance" element={<AdminRevenuePage onLogout={onLogout} />} />
        <Route path="/admin/settings" element={<AdminSystemSettingPage onLogout={onLogout} />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    );
  }


  return <Navigate to="/login" replace />;
}

export default AppRoutes;
