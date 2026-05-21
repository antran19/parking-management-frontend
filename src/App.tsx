import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./route/AppRoutes";
import type { UserRole } from "./types/auth";

function App() {
  const [userRole, setUserRole] = useState<UserRole>(null);

  useEffect(() => {
    const user = localStorage.getItem("user");

    if (user) {
      const parsedUser = JSON.parse(user);
      setUserRole(parsedUser.role);
    }
  }, []);

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    setUserRole(null);
  };

  return (
    <BrowserRouter>
      <AppRoutes
        userRole={userRole}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
    </BrowserRouter>
  );
}

export default App;