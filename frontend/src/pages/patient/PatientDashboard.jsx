import React, { useState, useEffect } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { ScrollArea } from "../../components/ui/scroll-area.jsx";
import { Textarea } from "../../components/ui/textarea.jsx";
import { Spinner } from "../../components/ui/spinner.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useToast } from "../../context/ToastContext.jsx";
import apiClient from "../../services/apiClient.js";

function PatientDashboard() {
  usePageTitle("Patient Dashboard");
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadPatientData = async () => {
      try {
        setLoading(true);
        // Get patient profile
        const pRes = await apiClient.get("/api/patients");
        if (pRes.data && Array.isArray(pRes.data)) {
          setPatients(pRes.data);
          
          // Get medical records if we have a patient
          if (pRes.data.length > 0) {
            const patientId = pRes.data[0].id;
            const mrRes = await apiClient.get(`/api/medical_records/${patientId}`);
            setMedicalRecords(mrRes.data || []);
          }
        }
      } catch (error) {
        showToast({
          variant: "error",
          title: "Failed to load patient data",
          description: error.response?.data?.detail || "Unable to fetch your medical information.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadPatientData();
  }, [showToast]);

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim() || submitting) return;
    setSubmitting(true);
    try {
      await apiClient.post("/api/rag/query", {
        query: question.trim(),
      });
      showToast({
        variant: "success",
        title: "Question submitted",
        description: "Your question has been sent to the care team.",
      });
      setQuestion("");
    } catch (error) {
      showToast({
        variant: "error",
        title: "Failed to submit question",
        description: error.response?.data?.detail || "Could not send your question.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout variant="patient">
      <div>
        <h1 className="text-xl font-semibold text-slate-50">
          Your health portal
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Review your medical history, reports and ask questions in
          patient-friendly language.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Medical history</CardTitle>
            <CardDescription>
              A high-level view of your recent hospital interactions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-56 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Spinner />
                </div>
              ) : medicalRecords.length > 0 ? (
                <ul className="space-y-3 text-xs text-slate-300">
                  {medicalRecords.map((record, idx) => (
                    <li key={idx}>
                      <p className="font-semibold text-slate-50">
                        {record.treatment || "Medical Visit"}
                      </p>
                      <p className="text-slate-400">
                        {record.diagnosis || "General checkup"}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 text-center py-4">No medical records found.</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your profiles</CardTitle>
              <CardDescription>
                Active patient records in the system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-300">
              {patients.length > 0 ? (
                patients.map((patient) => (
                  <div
                    key={patient.id}
                    className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3"
                  >
                    <p className="font-semibold text-slate-50">{patient.name || "Patient"}</p>
                    <p className="text-slate-400">
                      Age: {patient.age} • Gender: {patient.gender}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-400">No patient profiles found.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ask a question</CardTitle>
              <CardDescription>
                Submit a non-urgent question for your care team.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <form onSubmit={handleAskQuestion} className="space-y-3">
                <Textarea
                  placeholder="e.g. Can I resume my regular exercise routine after discharge?"
                  rows={4}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Sending..." : "Send question"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export { PatientDashboard };

