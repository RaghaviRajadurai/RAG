import React, { useEffect, useState } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Spinner } from "../../components/ui/spinner.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useToast } from "../../context/ToastContext.jsx";
import apiClient from "../../services/apiClient.js";

function AdminReportsPage() {
  usePageTitle("Admin Reports");
  const { showToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/api/reports");
      setReports(res.data || []);
    } catch (error) {
      showToast({
        variant: "error",
        title: "Failed to load reports",
        description: error.response?.data?.detail || "Unable to fetch reports.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <DashboardLayout variant="admin">
      <Card>
        <CardHeader>
          <CardTitle>Reports oversight</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : reports.length === 0 ? (
            <p className="text-sm text-slate-400">No reports available.</p>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3 text-sm text-slate-300">
                <p className="font-medium text-slate-100">{report.report_type || "Report"}</p>
                <p>Patient: {report.patient_name || "Unknown"}</p>
                <p className="text-xs text-slate-400">Patient ID: {report.patient_id}</p>
                <p>Doctor: {report.doctor_name || "N/A"}</p>
                <p>Status: {report.status || "pending"}</p>
                <p className="text-xs text-slate-400">{report.description || "No description"}</p>
              </div>
            ))
          )}
          <Button type="button" variant="outline" onClick={loadReports}>Refresh</Button>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

export { AdminReportsPage };
