import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Spinner } from "../../components/ui/spinner.jsx";
import { Stethoscope } from "lucide-react";
import apiClient from "../../services/apiClient";

function LoginPage() {
  usePageTitle("Login");
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const loginUser = async (data) => {
  const response = await apiClient.post("/login", data);
  return response.data;
};

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await login(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl items-center gap-10 md:grid-cols-2">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary shadow-glow-primary">
            <Stethoscope className="h-4 w-4" />
            <span>Secure Healthcare RAG System</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
            Log in to your{" "}
            <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
              AI-enabled
            </span>{" "}
            clinical workspace.
          </h1>
          <p className="text-sm text-slate-400 md:text-base">
            Role-aware access for Doctors, Patients and Administrators. All
            activity is securely logged and auditable.
          </p>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Hybrid retrieval for structured & unstructured medical records.
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
              Zero-copy, tokenized access control for each role.
            </li>
          </ul>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute -inset-8 rounded-3xl bg-gradient-to-tr from-primary/40 via-cyan-400/10 to-transparent opacity-70 blur-3xl" />
          <div className="relative rounded-3xl border border-slate-800/80 bg-slate-950/80 p-6 shadow-2xl shadow-slate-950/80 backdrop-blur-2xl">
            <h2 className="text-lg font-semibold text-slate-50">
              Sign in to continue
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Use your clinical, patient or admin credentials.
            </p>

            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-medium text-slate-200"
                >
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@hospital.org"
                  value={form.email}
                  onChange={onChange}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-slate-200"
                >
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={onChange}
                  required
                />
              </div>

              <Button
                type="submit"
                className="mt-2 flex w-full items-center justify-center gap-2"
                disabled={submitting}
              >
                {submitting && <Spinner className="h-6 w-6" />}
                <span>{submitting ? "Verifying credentials..." : "Login"}</span>
              </Button>
            </form>

            <p className="mt-4 text-xs text-slate-500">
              Admin onboarding is managed centrally.{" "}
              <Link
                to="/register"
                className="text-primary hover:text-primary/80"
              >
                Request an admin account
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export { LoginPage };

