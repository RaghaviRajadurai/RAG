import React, { useEffect, useState } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useToast } from "../../context/ToastContext.jsx";
import apiClient from "../../services/apiClient.js";

function LabReportVerifyPage() {
  usePageTitle("Verify Lab Reports");
  const { showToast } = useToast();
  const [queue, setQueue] = useState([]);
  const [verifyingId, setVerifyingId] = useState(null);
  const [status, setStatus] = useState("in_review");
  const [doctorName, setDoctorName] = useState("");
  const [reportType, setReportType] = useState("");
  const [search, setSearch] = useState("");

  const loadQueue = async () => {
    try {
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
        title: "Load failed",
        description: error.response?.data?.detail || "Unable to load queue.",
      });
    }
  };

  useEffect(() => {
    loadQueue();
  }, [status, doctorName, reportType, search]);

  const verifyItem = async (id) => {
    try {
      setVerifyingId(id);
      await apiClient.put(`/api/reports/${id}/verify`);
      showToast({ title: "Verified", description: "Report marked as verified." });
      await loadQueue();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Verification failed",
        description: error.response?.data?.detail || "Unable to verify report.",
      });
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <DashboardLayout variant="lab">
      <Card>
        <CardHeader>
          <CardTitle>Verify reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900"
            >
              <option value="in_review">In review</option>
              <option value="pending">Pending</option>
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
          {queue.length === 0 ? (
            <p className="text-sm text-slate-400">No pending reports to verify.</p>
          ) : (
            queue.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3">
                <p className="text-sm text-slate-200">Patient: {item.patient_name || "Unknown"}</p>
                <p className="text-xs text-slate-400">Patient ID: {item.patient_id}</p>
                <p className="text-xs text-slate-400">Doctor: {item.doctor_name || "N/A"}</p>
                <p className="text-xs text-slate-400">{item.report_type || "Report"}</p>
                <p className="text-xs text-slate-400">Status: {item.status || "pending"}</p>
                <Button type="button" className="mt-2" onClick={() => verifyItem(item.id)} disabled={verifyingId === item.id}>
                  {verifyingId === item.id ? "Verifying..." : "Verify report"}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

export { LabReportVerifyPage };
