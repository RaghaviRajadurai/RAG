import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function RoleBasedRoute({ allowedRoles }) {
  const { role } = useAuth();

  const currentRole = normalizeRole(role);
  const normalizedAllowedRoles = (allowedRoles || []).map(normalizeRole);

  if (!normalizedAllowedRoles.includes(currentRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

export { RoleBasedRoute };
