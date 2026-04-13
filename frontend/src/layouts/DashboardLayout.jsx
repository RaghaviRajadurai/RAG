import React from "react";
import { NavLink } from "react-router-dom";
import { Stethoscope, LayoutDashboard, Bot, FileText, Users, FlaskConical } from "lucide-react";
import { cn } from "../utils/cn.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Button } from "../components/ui/button.jsx";

function SidebarLink({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition-all",
          "hover:bg-slate-900/80 hover:text-slate-50",
          isActive && "bg-slate-900/90 text-slate-50 shadow-glow-primary"
        )
      }
    >
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-xl border border-slate-800/70 bg-slate-950/80 text-slate-300",
          "group-hover:border-primary/60 group-hover:text-primary"
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span>{label}</span>
    </NavLink>
  );
}

function TopNav() {
  const { role, logout } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-800/80 bg-slate-950/70 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary shadow-glow-primary">
          <Stethoscope className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-xs uppercase tracking-wide text-slate-400">
            Secure Healthcare
          </span>
          <span className="text-sm font-semibold text-slate-100">
            RAG System
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {role && (
          <span className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-200">
            {role}
          </span>
        )}
        <Button variant="outline" size="sm" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  );
}

function DashboardLayout({ variant, children }) {
  const sidebarLinks =
    variant === "doctor"
      ? [
          {
            to: "/doctor/dashboard",
            icon: LayoutDashboard,
            label: "Overview",
          },
          {
            to: "/doctor/ai-query",
            icon: Bot,
            label: "AI Query",
          },
          {
            to: "/doctor/reports",
            icon: FileText,
            label: "Reports",
          },
        ]
      : variant === "patient"
      ? [
          {
            to: "/patient/dashboard",
            icon: LayoutDashboard,
            label: "My Overview",
          },
        ]
      : variant === "lab"
      ? [
          {
            to: "/lab/dashboard",
            icon: FlaskConical,
            label: "Lab Dashboard",
          },
          {
            to: "/lab/reports/create",
            icon: FileText,
            label: "Create Report",
          },
          {
            to: "/lab/reports/update",
            icon: FileText,
            label: "Update Report",
          },
          {
            to: "/lab/reports/verify",
            icon: FileText,
            label: "Verify Report",
          },
        ]
      : [
          {
            to: "/admin/dashboard",
            icon: Users,
            label: "User & Access",
          },
          {
            to: "/admin/reports",
            icon: FileText,
            label: "Reports",
          },
        ];

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <div className="flex flex-1">
        <aside className="relative hidden w-64 border-r border-slate-800/80 bg-slate-950/70 px-4 py-5 backdrop-blur-xl md:block">
          <div className="mb-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Navigation
          </div>
          <nav className="flex flex-col gap-1">
            {sidebarLinks.map((link) => (
              <SidebarLink key={link.to} {...link} />
            ))}
          </nav>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-linear-to-b from-transparent via-primary/50 to-transparent" />
        </aside>
        <main className="flex-1 bg-linear-to-b from-slate-950/40 via-slate-950/80 to-slate-950 px-4 py-4 md:px-6 md:py-6">
          <div className="mx-auto max-w-6xl space-y-4 md:space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export { DashboardLayout };

