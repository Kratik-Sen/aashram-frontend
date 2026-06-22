import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("aashram_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("aashram_token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      localStorage.setItem("aashram_user", JSON.stringify(data.user));
    } catch (error) {
      setUser(null);
      localStorage.removeItem("aashram_token");
      localStorage.removeItem("aashram_user");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);
    localStorage.setItem("aashram_token", data.token);
    localStorage.setItem("aashram_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("aashram_token");
    localStorage.removeItem("aashram_user");
    setUser(null);
  };

  const hasRole = useCallback((allowedRoles) => {
    if (!allowedRoles?.length) return true;
    return Boolean(user && allowedRoles.includes(user.role));
  }, [user]);

  const value = useMemo(() => ({ user, loading, login, logout, refreshUser, hasRole }), [user, loading, refreshUser, hasRole]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
