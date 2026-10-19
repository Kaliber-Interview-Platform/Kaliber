import { createContext, useState, useEffect } from "react";
import api from "../lib/axios.js";

export const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => {
    const t = localStorage.getItem("token");
    return t && t !== "undefined" && t !== "null" ? t : null;
  });
  const [loading, setLoading] = useState(true);

  // Sync profile from server on boot if token is present
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken && storedToken !== "undefined" && storedToken !== "null") {
        try {
          const res = await api.get("/api/users/profile");
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem("user", JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error("Auth validation failed:", err.message);
        }
      } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const saveSession = (userData, userToken) => {
    if (userToken) {
      localStorage.setItem("token", userToken);
      setToken(userToken);
    }
    if (userData) {
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    }
    return userData;
  };

  const login = async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });
    const { token: returnedToken, user: returnedUser } = res.data;
    return saveSession(returnedUser, returnedToken);
  };

  const register = async (formData) => {
    const res = await api.post("/api/auth/register", formData);
    const { token: returnedToken, user: returnedUser } = res.data;
    if (returnedToken && returnedUser) {
      return saveSession(returnedUser, returnedToken);
    }
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post("/api/users/logout");
    } catch {
      // ignore network errors on logout
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (updatedProfile) => {
    localStorage.setItem("user", JSON.stringify(updatedProfile));
    setUser(updatedProfile);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: Boolean(token && user),
        isAdmin: user?.role === "admin",
        isCandidate: user?.role === "candidate"
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}