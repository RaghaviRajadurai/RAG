import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute.jsx";
import { RoleBasedRoute } from "./RoleBasedRoute.jsx";
import { LandingPage } from "../pages/LandingPage.jsx";
import { LoginPage } from "../pages/auth/LoginPage.jsx";
import { RegisterPage } from "../pages/auth/RegisterPage.jsx";
import { UnauthorizedPage } from "../pages/auth/UnauthorizedPage.jsx";
import { DoctorDashboard } from "../pages/doctor/DoctorDashboard.jsx";
import { DoctorReportsPage } from "../pages/doctor/DoctorReportsPage.jsx";
import { PatientDashboard } from "../pages/patient/PatientDashboard.jsx";
import { AdminDashboard } from "../pages/admin/AdminDashboard.jsx";
import { AdminReportsPage } from "../pages/admin/AdminReportsPage.jsx";
import { DoctorAIQueryPage } from "../pages/doctor/DoctorAIQueryPage.jsx";
import { LabTechnicianDashboard } from "../pages/lab/LabTechnicianDashboard.jsx";
import { LabReportCreatePage } from "../pages/lab/LabReportCreatePage.jsx";
import { LabReportUpdatePage } from "../pages/lab/LabReportUpdatePage.jsx";
import { LabReportVerifyPage } from "../pages/lab/LabReportVerifyPage.jsx";
import { ReceptionistDashboard } from "../pages/receptionist/ReceptionistDashboard.jsx";

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
          <Route path="/doctor/reports" element={<DoctorReportsPage />} />
        </Route>

        <Route element={<RoleBasedRoute allowedRoles={["Patient"]} />}>
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
        </Route>

        <Route element={<RoleBasedRoute allowedRoles={["Admin"]} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/reports" element={<AdminReportsPage />} />
        </Route>

        <Route element={<RoleBasedRoute allowedRoles={["Lab technician", "lab_technician", "lab-technician"]} />}>
          <Route path="/lab/dashboard" element={<LabTechnicianDashboard />} />
          <Route path="/lab/reports/create" element={<LabReportCreatePage />} />
          <Route path="/lab/reports/update" element={<LabReportUpdatePage />} />
          <Route path="/lab/reports/verify" element={<LabReportVerifyPage />} />
        </Route>

        <Route element={<RoleBasedRoute allowedRoles={["Receptionist", "receptionist"]} />}>
          <Route path="/receptionist/dashboard" element={<ReceptionistDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export { AppRoutes };
