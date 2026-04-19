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
          
          // Get lab records if we have a patient
          if (pRes.data.length > 0) {
            const patientId = pRes.data[0].id;
            const mrRes = await apiClient.get(`/api/records/${patientId}`);
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
      const res = await apiClient.post("/api/rag/query", {
        query: question.trim(),
      });
      
      const answer = res.data?.result?.answer || "No answer received.";
      
      showToast({
        variant: "success",
        title: "Doctor AI Response",
        description: answer,
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
            <CardTitle>Lab Reports</CardTitle>
            <CardDescription>
              A high-level view of your recent lab tests and results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[450px] rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Spinner />
                </div>
              ) : medicalRecords.length > 0 ? (
                <ul className="space-y-3 text-xs text-slate-300">
                  {medicalRecords.map((record, idx) => (
                    <li key={idx} className="p-3 border border-slate-800 rounded bg-slate-900/50">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-semibold text-slate-50">
                          {record.report_type || "Lab Report"}
                        </p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase ${
                            record.status === "verified" ? "bg-green-500/20 text-green-300" :
                            record.status === "in_review" ? "bg-yellow-500/20 text-yellow-300" :
                            "bg-slate-500/20 text-slate-300"
                        }`}>
                          {record.status}
                        </span>
                      </div>
                      <p className="text-slate-400 mb-2">
                        {record.description || "Requested test"}
                      </p>
                      {record.lab_report && (
                        <div className="mt-2 p-2 bg-slate-950 rounded text-slate-300 border border-slate-800/50">
                          <span className="font-medium text-slate-200 block mb-1">Results:</span>
                          {record.lab_report}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 text-center py-4">No lab reports found.</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Medical Profile</CardTitle>
              <CardDescription>
                Active patient records and diagnosis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-300">
              {patients.length > 0 ? (
                patients.map((patient) => (
                  <div
                    key={patient.id}
                    className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-slate-50 text-sm">{patient.name || "Patient"}</p>
                      <p className="text-slate-400">
                        Age: {patient.age} • Gender: {patient.gender}
                      </p>
                    </div>
                    {patient.assigned_doctor_name && (
                      <p className="text-blue-400 font-medium">Assigned Doctor: Dr. {patient.assigned_doctor_name.split('@')[0].replace('.', ' ')}</p>
                    )}
                    <div className="pt-2 border-t border-slate-800/50">
                      <span className="font-medium text-slate-200">Current Diagnosis:</span>
                      <p className="text-slate-400 mt-1">{patient.diagnosis || "No diagnosis assigned yet."}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-800/50">
                      <span className="font-medium text-slate-200">Prescription / Treatment:</span>
                      <p className="text-slate-400 mt-1">{patient.prescription || "No prescription assigned yet."}</p>
                    </div>
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

