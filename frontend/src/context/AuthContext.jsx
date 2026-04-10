import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";
import { useToast } from "./ToastContext.jsx";

const AuthContext = createContext(null);

function getRoleFromToken(token) {
  try {
    const decoded = jwtDecode(token);
    return decoded.role || decoded.user_role || decoded["https://schema/role"];
  } catch {
    return null;
  }
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const existing = localStorage.getItem("jwt_token");
    if (existing) {
      const role = getRoleFromToken(existing);
      setUser({ token: existing, role });
    }
    setLoading(false);
  }, []);

  const login = useCallback(
    async (credentials) => {
      try {
        const res = await apiClient.post("/auth/login", credentials);
        const token = res.data?.token;
        if (!token) {
          throw new Error("Token missing from response");
        }
        localStorage.setItem("jwt_token", token);
        const role = getRoleFromToken(token);
        const authUser = { token, role };
        setUser(authUser);

        if (role === "Doctor") {
          navigate("/doctor/dashboard", { replace: true });
        } else if (role === "Patient") {
          navigate("/patient/dashboard", { replace: true });
        } else if (role === "Admin") {
          navigate("/admin/dashboard", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch (error) {
        showToast({
          variant: "error",
          title: "Login failed",
          description:
            error.response?.data?.detail ||
            error.message ||
            "Invalid credentials or server error.",
        });
        throw error;
      }
    },
    [navigate, showToast]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("jwt_token");
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      token: user?.token ?? null,
      loading,
      login,
      logout,
      isAuthenticated: Boolean(user?.token),
    }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export { AuthProvider, useAuth };
