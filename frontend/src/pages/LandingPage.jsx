import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.jsx";
import { Stethoscope, ShieldCheck, Cpu, GitBranch } from "lucide-react";
import { usePageTitle } from "../hooks/usePageTitle.js";

function LandingPage() {
  usePageTitle("Secure Healthcare RAG System");

  return (
    <div className="relative min-h-screen px-4 py-8 md:px-10 md:py-12">
      <section className="mx-auto flex max-w-6xl flex-col items-center gap-10 md:flex-row md:gap-14">
        <div className="flex-1 space-y-6 text-center md:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-slate-950/70 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary shadow-glow-primary backdrop-blur-xl">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>HIPAA-conscious AI for hospital data</span>
          </div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-slate-50 md:text-5xl">
            A{" "}
            <span className="bg-gradient-to-r from-primary via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              role-aware AI assistant
            </span>{" "}
            for secure clinical decision support.
          </h1>
          <p className="max-w-xl text-sm text-slate-400 md:text-base">
            The Secure Healthcare RAG System brings together hybrid retrieval,
            structured EHR data and generative AI with strict role-based access
            for Doctors, Patients and Admins.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <Button asChild size="lg">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#about">Learn more</a>
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/60 px-3 py-1">
              <Cpu className="h-3.5 w-3.5 text-cyan-300" />
              Hybrid retrieval & generation
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/60 px-3 py-1">
              <GitBranch className="h-3.5 w-3.5 text-emerald-300" />
              Audit-ready access control
            </div>
          </div>
        </div>

        <div className="relative flex-1">
          <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-tr from-primary/40 via-cyan-400/10 to-transparent opacity-80 blur-3xl" />
          <Card className="relative overflow-hidden rounded-[2.5rem] border-slate-800/80 bg-slate-950/80 shadow-2xl shadow-slate-950/80">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Realtime AI Triage</span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/60 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Live
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/80 p-3 text-xs text-slate-300">
                <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>AI Insight</span>
                  <span>Patient • #H-102938</span>
                </div>
                <p>
                  Likely community-acquired pneumonia with CURB-65 score of 1.
                  Recommend in-hospital observation, IV antibiotics and repeat
                  labs in 6 hours.
                </p>
              </div>
              <div className="grid gap-3 text-xs md:grid-cols-3">
                <div className="rounded-2xl border border-sky-500/40 bg-sky-500/10 p-3">
                  <p className="text-[11px] font-semibold text-sky-200">
                    Hybrid Retrieval
                  </p>
                  <p className="mt-1 text-slate-200">
                    Fuses EHR, imaging reports & lab results.
                  </p>
                </div>
                <div className="rounded-2xl border border-primary/40 bg-primary/10 p-3">
                  <p className="text-[11px] font-semibold text-primary">
                    Secure Access
                  </p>
                  <p className="mt-1 text-slate-200">
                    JWT-scoped access for each clinical role.
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-3">
                  <p className="text-[11px] font-semibold text-emerald-200">
                    AI Generation
                  </p>
                  <p className="mt-1 text-slate-200">
                    Structured discharge summaries & patient handovers.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section
        id="about"
        className="mx-auto mt-16 max-w-6xl space-y-6 border-t border-slate-800/80 pt-10"
      >
        <h2 className="text-lg font-semibold text-slate-50">
          Built for teaching & research-grade deployments
        </h2>
        <p className="max-w-2xl text-sm text-slate-400">
          This frontend is architected with a modular, production-style layout:
          isolated auth flows, role-based dashboards and a dedicated AI query
          console for doctors. Plug in your RAG backend and security layer.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="relative overflow-hidden border-slate-800/80 bg-slate-950/80">
            <CardContent className="space-y-2 pt-5">
              <p className="text-sm font-semibold text-slate-50">
                Role-based routing
              </p>
              <p className="text-xs text-slate-400">
                Separate surfacing for Doctors, Patients and Admins with JWT
                decoding and protected routes.
              </p>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden border-slate-800/80 bg-slate-950/80">
            <CardContent className="space-y-2 pt-5">
              <p className="text-sm font-semibold text-slate-50">
                Modern design system
              </p>
              <p className="text-xs text-slate-400">
                shadcn-inspired components, Tailwind CSS, animated surfaces and
                responsive layouts.
              </p>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden border-slate-800/80 bg-slate-950/80">
            <CardContent className="space-y-2 pt-5">
              <p className="text-sm font-semibold text-slate-50">
                AI-ready surfaces
              </p>
              <p className="text-xs text-slate-400">
                Dedicated AI query page with streaming-like loading states and
                referenced documents.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="mx-auto mt-12 flex max-w-6xl items-center justify-between border-t border-slate-800/80 pt-5 text-xs text-slate-500">
        <div className="inline-flex items-center gap-2">
          <Stethoscope className="h-3.5 w-3.5" />
          <span>Secure Healthcare RAG System</span>
        </div>
        <span>Academic demo UI – plug into your backend.</span>
      </footer>
    </div>
  );
}

export { LandingPage };

