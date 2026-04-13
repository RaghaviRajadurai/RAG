import React, { useState } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Textarea } from "../../components/ui/textarea.jsx";
import { Button } from "../../components/ui/button.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog.jsx";
import { ScrollArea } from "../../components/ui/scroll-area.jsx";
import { Spinner } from "../../components/ui/spinner.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useToast } from "../../context/ToastContext.jsx";
import apiClient from "../../services/apiClient.js";

function DoctorDashboard() {
  usePageTitle("Doctor Dashboard");
  const { showToast } = useToast();
  const [patientSearch, setPatientSearch] = useState("");
  const [quickQuery, setQuickQuery] = useState("");
  const [dischargeLoading, setDischargeLoading] = useState(false);
  const [dischargePreview, setDischargePreview] = useState(null);

  const handleGenerateDischarge = async () => {
    if (dischargeLoading) return;
    setDischargeLoading(true);
    try {
      const res = await apiClient.post("/api/doctor/discharge/preview", {
        patient_search: patientSearch || undefined,
      });
      setDischargePreview(res.data || null);
    } catch (error) {
      showToast({
        variant: "error",
        title: "Unable to generate summary",
        description:
          error.response?.data?.detail ||
          "Check backend /api/doctor/discharge/preview endpoint.",
      });
    } finally {
      setDischargeLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!dischargePreview) {
      showToast({
        variant: "error",
        title: "No preview available",
        description: "Generate discharge preview before downloading PDF.",
      });
      return;
    }

    apiClient
      .post("/api/doctor/discharge/pdf", dischargePreview, { responseType: "blob" })
      .then((res) => {
        const blobUrl = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = blobUrl;
        link.setAttribute("download", `discharge_summary_${(dischargePreview.patient_name || "patient").replace(/\s+/g, "_").toLowerCase()}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((error) => {
        showToast({
          variant: "error",
          title: "PDF generation failed",
          description: error.response?.data?.detail || "Unable to generate discharge PDF.",
        });
      });
  };

  const handleSaveRecords = () => {
    showToast({
      title: "Saved to records",
      description: "Persist to your EHR or RAG index here.",
    });
  };

  return (
    <DashboardLayout variant="doctor">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-50">
            Doctor workspace
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Search patients, ask AI questions and manage discharge summaries.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle>Search patient</CardTitle>
            <CardDescription>
              Look up a patient record by ID, name or MRN.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Search by ID, MRN, name..."
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
            />
            <div className="grid gap-3 text-xs text-slate-400 md:grid-cols-3">
              <div>Recent: H-102938 • H-948221</div>
              <div>Filters: inpatients, ED, discharged</div>
              <div>Connect to your EHR search API.</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>View reports</CardTitle>
            <CardDescription>
              Quick access to recent imaging, labs and discharge notes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-40 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-3">
              <ul className="space-y-2 text-xs text-slate-300">
                <li>
                  <span className="font-medium text-slate-50">
                    CT Chest – 24 Feb 2026
                  </span>
                  <p className="text-slate-400">
                    Ground-glass opacities in right lower lobe, consistent with
                    infection.
                  </p>
                </li>
                <li>
                  <span className="font-medium text-slate-50">
                    Lab Panel – 23 Feb 2026
                  </span>
                  <p className="text-slate-400">
                    CRP down from 140 to 55, WBC 9.4, lactate normalized.
                  </p>
                </li>
                <li>
                  <span className="font-medium text-slate-50">
                    Discharge note – 20 Feb 2026
                  </span>
                  <p className="text-slate-400">
                    Follow-up arranged with respiratory clinic in 4 weeks.
                  </p>
                </li>
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Ask AI about this patient</CardTitle>
            <CardDescription>
              Short, focused questions. For longer prompts use the dedicated AI
              Query page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="e.g. Summarise the last 48 hours of clinical trajectory..."
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  showToast({
                    title: "Use AI Query page",
                    description:
                      "This shortcut is a stub. Use the Doctor AI Query screen for full RAG flow.",
                  })
                }
              >
                Open AI Query console
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Discharge summary</CardTitle>
            <CardDescription>
              Generate an AI-assisted discharge summary draft.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full" onClick={handleGenerateDischarge}>
                  {dischargeLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner className="h-5 w-5" />
                      Generating preview...
                    </span>
                  ) : (
                    "Generate discharge summary"
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Discharge summary preview</DialogTitle>
                  <DialogDescription>
                    Review the AI-assisted summary before finalizing. Always
                    verify clinically.
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="mt-3 h-64 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
                  {!dischargePreview ? (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">
                      {dischargeLoading ? (
                        <Spinner />
                      ) : (
                        "No preview yet. Trigger generation from the dashboard."
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 text-sm text-slate-200">
                      <section>
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Diagnosis
                        </h3>
                        <p className="mt-1">{dischargePreview.diagnosis}</p>
                      </section>
                      <section>
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Treatment
                        </h3>
                        <p className="mt-1">{dischargePreview.treatment}</p>
                      </section>
                      <section>
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Lab results
                        </h3>
                        <p className="mt-1">{dischargePreview.labs}</p>
                      </section>
                      <section>
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Follow-up instructions
                        </h3>
                        <p className="mt-1">{dischargePreview.followUp}</p>
                      </section>
                    </div>
                  )}
                </ScrollArea>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDownloadPdf}
                  >
                    Download as PDF
                  </Button>
                  <Button type="button" onClick={handleSaveRecords}>
                    Save to records
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export { DoctorDashboard };

