import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "../../layouts/DashboardLayout.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Spinner } from "../../components/ui/spinner.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useToast } from "../../context/ToastContext.jsx";
import apiClient from "../../services/apiClient.js";

function LabTechnicianDashboard() {
  usePageTitle("Lab Technician Dashboard");
  const { showToast } = useToast();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [reportType, setReportType] = useState("");
  const [search, setSearch] = useState("");

  const loadQueue = async () => {
    try {
      setLoading(true);
      const params = {};
      if (status) params.status = status;
      if (doctorName.trim()) params.doctor_name = doctorName.trim();
      if (reportType.trim()) params.report_type = reportType.trim();
      if (search.trim()) params.q = search.trim();

      const res = await apiClient.get("/api/reports/queue", { params });
      setQueue(res.data || []);
    } catch (error) {
      showToast({
        variant: "error",
        title: "Failed to load queue",
        description: error.response?.data?.detail || "Unable to fetch lab report queue.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [status, doctorName, reportType, search]);

  return (
    <DashboardLayout variant="lab">
      <div>
        <h1 className="text-xl font-semibold text-slate-50">Lab technician workspace</h1>
        <p className="mt-1 text-xs text-slate-400">
          View pending report tasks and update lab report data.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending report updates</CardTitle>
            <CardDescription>
              Patients waiting for lab report uploads or corrections.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <div className="grid gap-2 md:grid-cols-2">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
              >
                <option value="">All queue statuses</option>
                <option value="pending">Pending</option>
                <option value="in_review">In review</option>
              </select>
              <input
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Filter by doctor"
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
              />
              <input
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                placeholder="Filter by report type"
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient name/id"
                className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
              />
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Spinner />
              </div>
            ) : queue.length === 0 ? (
              <p>No pending or in-review lab reports.</p>
            ) : (
              <ul className="space-y-2">
                {queue.slice(0, 5).map((item) => (
                  <li key={item.id} className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
                    <p className="font-medium text-slate-100">Patient: {item.patient_name || "Unknown"}</p>
                    <p className="text-xs text-slate-400">Patient ID: {item.patient_id}</p>
                    <p className="text-xs text-slate-400">Doctor: {item.doctor_name || "N/A"}</p>
                    <p className="text-xs text-slate-400">{item.report_type || "Report"}</p>
                    <p className="text-xs text-slate-400">Status: {item.status || "pending"}</p>
                  </li>
                ))}
              </ul>
            )}
            <Button type="button" variant="outline" onClick={loadQueue}>Refresh queue</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>
              Open report forms, upload files, and mark report status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <Button asChild className="w-full">
              <Link to="/lab/reports/create">Create report</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/lab/reports/update">Update report</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/lab/reports/verify">Verify report</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export { LabTechnicianDashboard };
