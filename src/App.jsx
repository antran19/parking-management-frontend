import { useState } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./route/AppRoutes";
import EmergencyOverlay from "./components/EmergencyOverlay";
import { getStoredUser, getStoredUserRole } from "./utils/authStorage";

function App() {
  const [userRole, setUserRole] = useState(() => {
    const storedRole = getStoredUserRole();
    if (storedRole) {
      const roleMap = {
        DRIVER: "driver",
        STAFF: "staff",
        MANAGER: "manager",
        ADMIN: "admin",
        SECURITY: "security",
      };
      return roleMap[storedRole] || null;
    }
    return null;
  });

  const handleLogin = (role) => {
    setUserRole(role);
  };

  const handleLogout = () => {
    const user = getStoredUser();
    if (user?.role) localStorage.removeItem(`accessToken_${user.role}`);
    setUserRole(null);
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
  };

  return (
    <BrowserRouter>
      <AppRoutes
        userRole={userRole}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
      <EmergencyOverlay userRole={userRole} />
    </BrowserRouter>
  );
}

export default App;
