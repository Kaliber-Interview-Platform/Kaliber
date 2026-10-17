import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

// usage in any component: const { user, login, register, logout } = useAuth();
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
};

export default useAuth;