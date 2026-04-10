import React, { useState } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout.jsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card.jsx";
import { Textarea } from "../../components/ui/textarea.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Button } from "../../components/ui/button.jsx";
import { ScrollArea } from "../../components/ui/scroll-area.jsx";
import { Spinner } from "../../components/ui/spinner.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useToast } from "../../context/ToastContext.jsx";
import apiClient from "../../services/apiClient.js";

function DoctorAIQueryPage() {
  usePageTitle("Doctor AI Query");
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    setResponse(null);
    try {
      const res = await apiClient.post("/ask-query", {
        query,
        patient_id: patientId || undefined,
      });
      setResponse(
        res.data || {
          answer:
            "Example structured response from your backend. Map this to your real RAG output.",
          timestamp: new Date().toISOString(),
          patient_id: patientId || "H-102938",
          documents: [
            {
              id: "doc-1",
              title: "Discharge note 12 Feb 2026",
              snippet:
                "Patient admitted with community-acquired pneumonia, started on IV antibiotics...",
            },
          ],
        }
      );
    } catch (error) {
      showToast({
        variant: "error",
        title: "AI query failed",
        description:
          error.response?.data?.detail || "Check connectivity to /ask-query.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    showToast({
      title: "Generate report",
      description:
        "Hook this button to your structured report /summary endpoint.",
    });
  };

  return (
    <DashboardLayout variant="doctor">
      <div>
        <h1 className="text-xl font-semibold text-slate-50">
          AI query console
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Large-context, RAG-backed assistant for clinical reasoning and
          documentation support.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)]">
        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle>Ask a medical question</CardTitle>
            <CardDescription>
              Provide rich natural language context for this patient&apos;s
              case.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <div className="space-y-1.5">
                  <label
                    htmlFor="patientId"
                    className="text-xs font-medium text-slate-200"
                  >
                    Patient ID (optional)
                  </label>
                  <Input
                    id="patientId"
                    placeholder="H-102938"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 text-xs text-slate-400">
                  <p className="font-medium text-slate-300">
                    Recommended prompt structure
                  </p>
                  <ul className="space-y-1">
                    <li>• Presenting complaint</li>
                    <li>• Salient history & exam</li>
                    <li>• Labs / imaging</li>
                    <li>• Specific question or task</li>
                  </ul>
                </div>
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="query"
                  className="text-xs font-medium text-slate-200"
                >
                  Clinical question
                </label>
                <Textarea
                  id="query"
                  rows={10}
                  placeholder="e.g. 65-year-old with community-acquired pneumonia, day 3 of IV ceftriaxone..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="inline-flex items-center gap-2"
                  disabled={loading}
                >
                  {loading && <Spinner className="h-5 w-5" />}
                  <span>{loading ? "Contacting AI..." : "Submit query"}</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle>AI response</CardTitle>
            <CardDescription>
              Structured answer with referenced documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-72 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4">
              {!response ? (
                <div className="flex h-full items-center justify-center text-xs text-slate-400">
                  {loading ? (
                    <Spinner />
                  ) : (
                    "Submit a query to see AI output here."
                  )}
                </div>
              ) : (
                <div className="space-y-4 text-sm text-slate-200">
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Structured medical response
                    </h3>
                    <p className="mt-1 whitespace-pre-wrap">
                      {response.answer}
                    </p>
                  </section>
                  <section className="grid gap-2 text-xs text-slate-400 md:grid-cols-2">
                    <div>
                      <span className="font-medium text-slate-300">
                        Timestamp:
                      </span>{" "}
                      {new Date(
                        response.timestamp || Date.now()
                      ).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium text-slate-300">
                        Patient ID:
                      </span>{" "}
                      {response.patient_id || "N/A"}
                    </div>
                  </section>
                  <section>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Referenced documents
                    </h3>
                    <ul className="mt-1 space-y-1.5 text-xs">
                      {(response.documents || []).map((doc) => (
                        <li
                          key={doc.id}
                          className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-2"
                        >
                          <p className="font-medium text-slate-200">
                            {doc.title}
                          </p>
                          <p className="text-slate-400">{doc.snippet}</p>
                        </li>
                      ))}
                      {(!response.documents || response.documents.length === 0) && (
                        <li className="text-slate-500">
                          Backend did not return explicit document references.
                        </li>
                      )}
                    </ul>
                  </section>
                </div>
              )}
            </ScrollArea>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateReport}
                disabled={!response}
              >
                Generate report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export { DoctorAIQueryPage };

