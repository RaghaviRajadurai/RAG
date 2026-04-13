import React, { useEffect, useState } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card.jsx";
import { Textarea } from "../../components/ui/textarea.jsx";
import { Button } from "../../components/ui/button.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useToast } from "../../context/ToastContext.jsx";
import apiClient from "../../services/apiClient.js";

function LabReportUpdatePage() {
  usePageTitle("Update Lab Reports");
  const { showToast } = useToast();
  const [queue, setQueue] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [status, setStatus] = useState("");
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
        description: error.response?.data?.detail || "Unable to load report queue.",
      });
    }
  };

  useEffect(() => {
    loadQueue();
  }, [status, doctorName, reportType, search]);

  const updateItemField = (id, field, value) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const saveItem = async (item) => {
    try {
      setSavingId(item.id);
      await apiClient.put(`/api/reports/${item.id}`, {
        diagnosis: item.diagnosis,
        treatment: item.treatment,
        lab_report: item.lab_report,
        description: item.description,
        status: item.status || "in_review",
      });
      showToast({ title: "Updated", description: "Report changes saved." });
      await loadQueue();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Update failed",
        description: error.response?.data?.detail || "Unable to update report.",
      });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <DashboardLayout variant="lab">
      <Card>
        <CardHeader>
          <CardTitle>Update reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
          {queue.length === 0 ? (
            <p className="text-sm text-slate-400">No pending reports to update.</p>
          ) : (
            queue.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3 space-y-2">
                <p className="text-sm text-slate-300">Patient: {item.patient_name || "Unknown"}</p>
                <p className="text-xs text-slate-400">Patient ID: {item.patient_id}</p>
                <p className="text-xs text-slate-400">Doctor: {item.doctor_name || "N/A"}</p>
                <Textarea value={item.diagnosis || ""} onChange={(e) => updateItemField(item.id, "diagnosis", e.target.value)} placeholder="Diagnosis" />
                <Textarea value={item.treatment || ""} onChange={(e) => updateItemField(item.id, "treatment", e.target.value)} placeholder="Treatment" />
                <Textarea value={item.lab_report || ""} onChange={(e) => updateItemField(item.id, "lab_report", e.target.value)} placeholder="Lab report" />
                <Textarea value={item.description || ""} onChange={(e) => updateItemField(item.id, "description", e.target.value)} placeholder="Description" />
                <Button type="button" onClick={() => saveItem(item)} disabled={savingId === item.id}>
                  {savingId === item.id ? "Saving..." : "Save"}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

export { LabReportUpdatePage };
