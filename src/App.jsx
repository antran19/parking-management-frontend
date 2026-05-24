import { useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./route/AppRoutes";

function App() {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    try {
      const user = localStorage.getItem("user");

      if (!user) {
        setUserRole(null);
        return;
      }

      const parsedUser = JSON.parse(user);
      const role = parsedUser?.role;

      if (role) {
        setUserRole(String(role).toLowerCase());
      } else {
        localStorage.removeItem("user");
        setUserRole(null);
      }
    } catch (error) {
      console.error("Lỗi đọc user từ localStorage:", error);

      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userRole");
      localStorage.removeItem("role");

      setUserRole(null);
    }
  }, []);

  const handleLogin = (role) => {
    if (!role) {
      console.error("Login thành công nhưng không có role");
      setUserRole(null);
      return;
    }

    setUserRole(String(role).toLowerCase());
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    localStorage.removeItem("role");

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