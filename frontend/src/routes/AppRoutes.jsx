import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute.jsx";
import { RoleBasedRoute } from "./RoleBasedRoute.jsx";
import { LandingPage } from "../pages/LandingPage.jsx";
import { LoginPage } from "../pages/auth/LoginPage.jsx";
import { RegisterPage } from "../pages/auth/RegisterPage.jsx";
import { UnauthorizedPage } from "../pages/auth/UnauthorizedPage.jsx";
import { DoctorDashboard } from "../pages/doctor/DoctorDashboard.jsx";
import { PatientDashboard } from "../pages/patient/PatientDashboard.jsx";
import { AdminDashboard } from "../pages/admin/AdminDashboard.jsx";
import { DoctorAIQueryPage } from "../pages/doctor/DoctorAIQueryPage.jsx";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleBasedRoute allowedRoles={["Doctor"]} />}>
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/ai-query" element={<DoctorAIQueryPage />} />
        </Route>

        <Route element={<RoleBasedRoute allowedRoles={["Patient"]} />}>
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
        </Route>

        <Route element={<RoleBasedRoute allowedRoles={["Admin"]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export { AppRoutes };
