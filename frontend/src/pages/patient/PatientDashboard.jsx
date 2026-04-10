import React from "react";
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
import { usePageTitle } from "../../hooks/usePageTitle.js";

function PatientDashboard() {
  usePageTitle("Patient Dashboard");

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
              <ul className="space-y-3 text-xs text-slate-300">
                <li>
                  <p className="font-semibold text-slate-50">
                    Feb 2026 • Hospital admission
                  </p>
                  <p className="text-slate-400">
                    Treated for community-acquired pneumonia. Completed course
                    of antibiotics.
                  </p>
                </li>
                <li>
                  <p className="font-semibold text-slate-50">
                    Nov 2025 • Outpatient clinic
                  </p>
                  <p className="text-slate-400">
                    Routine review of blood pressure medication. Stable control.
                  </p>
                </li>
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Download reports</CardTitle>
              <CardDescription>
                Export discharge letters and key investigations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-slate-300">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
              >
                Discharge summary – Feb 2026
                <span className="text-slate-400">PDF</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
              >
                Lab panel – Feb 2026
                <span className="text-slate-400">PDF</span>
              </Button>
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
              <Textarea
                placeholder="e.g. Can I resume my regular exercise routine after discharge?"
                rows={4}
              />
              <Button type="button" className="w-full">
                Send question (limited)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export { PatientDashboard };

