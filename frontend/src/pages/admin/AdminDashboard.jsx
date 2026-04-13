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
import { Spinner } from "../../components/ui/spinner.jsx";
import { usePageTitle } from "../../hooks/usePageTitle.js";
import { useToast } from "../../context/ToastContext.jsx";
import apiClient from "../../services/apiClient.js";

function AdminDashboard() {
  usePageTitle("Admin Dashboard");
  const { showToast } = useToast();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuditLogs = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get("/api/admin/audit-logs?limit=100");
        setAuditLogs(res.data || []);
      } catch (error) {
        showToast({
          variant: "error",
          title: "Failed to load audit logs",
          description: error.response?.data?.detail || "Unable to fetch audit logs.",
        });
      } finally {
        setLoading(false);
      }
    };

    loadAuditLogs();
  }, [showToast]);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  return (
    <DashboardLayout variant="admin">
      <div>
        <h1 className="text-xl font-semibold text-slate-50">
          Administrative console
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Monitor system activity, access patterns and security events.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit logs</CardTitle>
          <CardDescription>
            Real-time access logs and security events from the RAG system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-96 rounded-2xl border border-slate-800/80 bg-slate-950/60">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Spinner />
              </div>
            ) : auditLogs.length > 0 ? (
              <table className="min-w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800/80 bg-slate-900/80 text-[11px] uppercase tracking-wide text-slate-400 sticky top-0">
                  <tr>
                    <th className="px-4 py-2">Timestamp</th>
                    <th className="px-4 py-2">Actor</th>
                    <th className="px-4 py-2">Role</th>
                    <th className="px-4 py-2">Action</th>
                    <th className="px-4 py-2">Resource</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-slate-800/60 ${
                        log.status === "denied" ? "bg-red-500/10" : ""
                      }`}
                    >
                      <td className="px-4 py-2">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="px-4 py-2">
                        {log.actor_username || log.actor_user_id || "Unknown"}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium uppercase ${
                            log.actor_role?.toLowerCase() === "admin"
                              ? "bg-red-500/20 text-red-200"
                              : log.actor_role?.toLowerCase() === "doctor"
                              ? "bg-blue-500/20 text-blue-200"
                              : "bg-slate-500/20 text-slate-200"
                          }`}
                        >
                          {log.actor_role || "Unknown"}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-mono text-slate-400">
                        {log.action || "Unknown"}
                      </td>
                      <td className="px-4 py-2">{log.resource || "N/A"}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium uppercase ${
                            log.status === "denied"
                              ? "bg-red-500/20 text-red-200"
                              : "bg-green-500/20 text-green-200"
                          }`}
                        >
                          {log.status || "Unknown"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex items-center justify-center h-32 text-slate-400">
                No audit logs found.
              </div>
            )}
          </ScrollArea>
          <div className="mt-4 flex justify-between items-center text-xs text-slate-400">
            <p>Total logs: {auditLogs.length}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setLoading(true);
                setTimeout(() => {
                  setLoading(false);
                }, 500);
              }}
            >
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}

export { AdminDashboard };

