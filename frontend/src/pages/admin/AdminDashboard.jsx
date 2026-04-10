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
import { Input } from "../../components/ui/input.jsx";
import { ScrollArea } from "../../components/ui/scroll-area.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";

function AdminDashboard() {
  usePageTitle("Admin Dashboard");

  return (
    <DashboardLayout variant="admin">
      <div>
        <h1 className="text-xl font-semibold text-slate-50">
          Administrative console
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Manage users, roles and review audit logs across the RAG system.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.3fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Create user</CardTitle>
            <CardDescription>
              Provision a new account and assign their primary role.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-medium text-slate-200"
              >
                Email
              </label>
              <Input id="email" placeholder="new.user@hospital.org" />
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
                className="h-10 w-full rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
              >
                <option>Doctor</option>
                <option>Patient</option>
                <option>Admin</option>
              </select>
            </div>
            <Button type="button" className="w-full">
              Create user
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assign role</CardTitle>
            <CardDescription>
              Quickly change a user&apos;s access level if required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <label
                htmlFor="userSearch"
                className="text-xs font-medium text-slate-200"
              >
                Search user
              </label>
              <Input id="userSearch" placeholder="Search by email or ID" />
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="newRole"
                className="text-xs font-medium text-slate-200"
              >
                New role
              </label>
              <select
                id="newRole"
                className="h-10 w-full rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 text-sm text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
              >
                <option>Doctor</option>
                <option>Patient</option>
                <option>Admin</option>
              </select>
            </div>
            <Button type="button" variant="outline" className="w-full">
              Update role
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit logs</CardTitle>
          <CardDescription>
            Example table layout – plug in your real audit events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-64 rounded-2xl border border-slate-800/80 bg-slate-950/60">
            <table className="min-w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800/80 bg-slate-900/80 text-[11px] uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-2">Timestamp</th>
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Action</th>
                  <th className="px-4 py-2">Resource</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-800/60">
                  <td className="px-4 py-2">2026-02-26 10:14</td>
                  <td className="px-4 py-2">dr.smith@hospital.org</td>
                  <td className="px-4 py-2">Doctor</td>
                  <td className="px-4 py-2">AI_QUERY</td>
                  <td className="px-4 py-2">/ask-query • H-102938</td>
                </tr>
                <tr className="border-b border-slate-800/60">
                  <td className="px-4 py-2">2026-02-26 10:08</td>
                  <td className="px-4 py-2">admin@hospital.org</td>
                  <td className="px-4 py-2">Admin</td>
                  <td className="px-4 py-2">ROLE_UPDATE</td>
                  <td className="px-4 py-2">Patient → Doctor</td>
                </tr>
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

export { AdminDashboard };

