import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.jsx";
import { Stethoscope, ShieldCheck, Cpu, GitBranch } from "lucide-react";
import { usePageTitle } from "../hooks/usePageTitle.js";

function LandingPage() {
  usePageTitle("Secure Healthcare RAG System");

  return (
    <div className="bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold text-slate-900">Healthcare RAG System</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2 md:gap-8">
            {/* Left Content */}
            <div className="flex flex-col justify-center space-y-8">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-600">
                  <ShieldCheck className="h-4 w-4" />
                  <span>HIPAA Compliant</span>
                </div>
                <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
                  Secure AI for Clinical Decision Support
                </h1>
                <p className="text-lg text-slate-600">
                  A professional healthcare system combining hybrid retrieval, structured EHR data, and generative AI with strict role-based access control for Doctors, Patients, and Administrators.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-11">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-11">
                  <a href="#features">Learn More</a>
                </Button>
              </div>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center gap-3 text-slate-600">
                  <Cpu className="h-5 w-5 shrink-0 text-blue-600" />
                  <span>Hybrid retrieval and generation</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <GitBranch className="h-5 w-5 shrink-0 text-blue-600" />
                  <span>Audit-ready access control</span>
                </div>
              </div>
            </div>

            {/* Right Card */}
            <div className="flex items-center justify-center">
              <Card className="w-full shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg">Realtime AI Triage</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                      Live
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
                      <span className="font-medium">AI Assistant Insight</span>
                      <span>Patient #H-102938</span>
                    </div>
                    <p className="text-slate-900 leading-relaxed">
                      Likely community-acquired pneumonia with CURB-65 score of 1. Recommend in-hospital observation, IV antibiotics, and repeat labs in 6 hours.
                    </p>
                  </div>
                  <div className="grid gap-3 text-xs md:grid-cols-3">
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                      <p className="font-semibold text-blue-900">Hybrid Retrieval</p>
                      <p className="mt-1 text-blue-700">Fuses EHR, imaging reports & lab results.</p>
                    </div>
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                      <p className="font-semibold text-blue-900">Secure Access</p>
                      <p className="mt-1 text-blue-700">JWT-scoped access for each clinical role.</p>
                    </div>
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                      <p className="font-semibold text-emerald-900">AI Generation</p>
                      <p className="mt-1 text-emerald-700">Structured summaries & patient handovers.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-b border-slate-200 bg-slate-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 space-y-3">
            <h2 className="text-3xl font-bold text-slate-900">Built for Modern Healthcare</h2>
            <p className="max-w-2xl text-lg text-slate-600">
              Production-grade architecture with isolated auth flows, role-based dashboards, and a dedicated AI query console for clinical professionals.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="space-y-3 pt-6">
                <ShieldCheck className="h-8 w-8 text-blue-600" />
                <p className="font-semibold text-slate-900">Role-based Routing</p>
                <p className="text-sm text-slate-600">
                  Dedicated dashboards for Doctors, Patients, and Admins with JWT authentication and protected routes.
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="space-y-3 pt-6">
                <Cpu className="h-8 w-8 text-blue-600" />
                <p className="font-semibold text-slate-900">Professional Design</p>
                <p className="text-sm text-slate-600">
                  Clean, accessible components built with Tailwind CSS for consistent user experience across all roles.
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="space-y-3 pt-6">
                <GitBranch className="h-8 w-8 text-blue-600" />
                <p className="font-semibold text-slate-900">AI-Ready Surfaces</p>
                <p className="text-sm text-slate-600">
                  Dedicated AI query interfaces with streaming states, document references, and audit logging.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Stethoscope className="h-4 w-4" />
              <span>Secure Healthcare RAG System</span>
            </div>
            <span className="text-xs text-slate-600">Production-ready healthcare AI platform</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export { LandingPage };

