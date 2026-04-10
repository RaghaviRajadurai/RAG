import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import  apiClient from "../../services/apiClient.js";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Spinner } from "../../components/ui/spinner.jsx";
import { useToast } from "../../context/ToastContext.jsx";

function RegisterPage() {
  usePageTitle("Admin Registration");
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "Doctor",
  });
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const registerUser = async (data) => {
  const response = await apiClient.post("/register", data);
  return response.data;
};

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await apiClient.post("/auth/register", form);
      showToast({
        title: "User registered",
        description: "The account has been created successfully.",
      });
      navigate("/login", { replace: true });
    } catch (error) {
      showToast({
        variant: "error",
        title: "Registration failed",
        description:
          error.response?.data?.detail ||
          error.message ||
          "Unable to create account.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800/80 bg-slate-950/80 p-6 shadow-2xl shadow-slate-950/80 backdrop-blur-2xl">
        <h1 className="text-xl font-semibold text-slate-50">
          Admin-controlled registration
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          This page is typically used by administrators to onboard new users
          into the system.
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
              placeholder="new.user@hospital.org"
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
          <div className="space-y-1.5">
            <label
              htmlFor="role"
              className="text-xs font-medium text-slate-200"
            >
              Role
            </label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={onChange}
              className="h-10 w-full rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
            >
              <option value="Doctor">Doctor</option>
              <option value="Patient">Patient</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <Button
            type="submit"
            className="mt-2 flex w-full items-center justify-center gap-2"
            disabled={submitting}
          >
            {submitting && <Spinner className="h-6 w-6" />}
            <span>
              {submitting ? "Creating account..." : "Create user account"}
            </span>
          </Button>
        </form>
      </div>
    </div>
  );
}

export { RegisterPage };

