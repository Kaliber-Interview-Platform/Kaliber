import { createContext, useState } from "react";
import api from "../lib/axios.js";

export const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  // your backend returns { _id, name, email, role, token } for both login and register
  const saveSession = (data) => {
    const { token, ...profile } = data;
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(profile));
    setUser(profile);
    return profile;
  };

  const login = async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });
    return saveSession(res.data);
  };

  const register = async (formData) => {
    const res = await api.post("/api/auth/register", formData);
    return saveSession(res.data);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}