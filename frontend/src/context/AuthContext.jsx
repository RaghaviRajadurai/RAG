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

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

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
        const res = await apiClient.post("/auth/login", {
          username: credentials.email,
          password: credentials.password,
        });
        if (res.data?.otp_required) {
          return {
            otpRequired: true,
            email: res.data?.email || credentials.email,
          };
        }

        const token = res.data?.access_token;
        if (!token) {
          throw new Error("Token missing from response");
        }
        localStorage.setItem("jwt_token", token);
        const role = getRoleFromToken(token);
        const authUser = { token, role };
        setUser(authUser);
        const normalizedRole = normalizeRole(role);

        if (normalizedRole === "doctor") {
          navigate("/doctor/dashboard", { replace: true });
        } else if (normalizedRole === "patient") {
          navigate("/patient/dashboard", { replace: true });
        } else if (normalizedRole === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else if (normalizedRole === "lab technician") {
          navigate("/lab/dashboard", { replace: true });
        } else if (normalizedRole === "receptionist") {
          navigate("/receptionist/dashboard", { replace: true });
        } else {
          navigate("/", { replace: true });
        }

        return { otpRequired: false };
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

  const verifyLoginOtp = useCallback(
    async ({ email, otpCode }) => {
      try {
        const res = await apiClient.post("/auth/login/confirm", {
          email,
          otp_code: otpCode,
        });

        const token = res.data?.access_token;
        if (!token) {
          throw new Error("Token missing from response");
        }

        localStorage.setItem("jwt_token", token);
        const role = getRoleFromToken(token);
        const authUser = { token, role };
        setUser(authUser);
        const normalizedRole = normalizeRole(role);

        if (normalizedRole === "doctor") {
          navigate("/doctor/dashboard", { replace: true });
        } else if (normalizedRole === "patient") {
          navigate("/patient/dashboard", { replace: true });
        } else if (normalizedRole === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else if (normalizedRole === "lab technician") {
          navigate("/lab/dashboard", { replace: true });
        } else if (normalizedRole === "receptionist") {
          navigate("/receptionist/dashboard", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch (error) {
        showToast({
          variant: "error",
          title: "OTP verification failed",
          description:
            error.response?.data?.detail ||
            error.message ||
            "Invalid OTP or server error.",
        });
        throw error;
      }
    },
    [navigate, showToast]
  );

  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem("jwt_token");
      if (token) {
        await apiClient.post(
          "/auth/logout",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (e) {
      console.error("Logout log failed:", e);
    } finally {
      localStorage.removeItem("jwt_token");
      setUser(null);
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  const value = useMemo(
    () => ({
      user,
      role: user?.role ?? null,
      token: user?.token ?? null,
      loading,
      login,
      verifyLoginOtp,
      logout,
      isAuthenticated: Boolean(user?.token),
    }),
    [user, loading, login, verifyLoginOtp, logout]
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
