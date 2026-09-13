import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import api from "../lib/api";
import AdminSidebar from "../components/AdminSidebar";

interface AuditLogEntry {
  id: string;
  action: string;
  tableName: string;
  recordId: string | null;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
  admin?: { name: string };
}

const ACTION_STYLES: Record<string, string> = {
  create: "bg-emerald-50 text-emerald-700",
  update: "bg-blue-50 text-blue-700",
  delete: "bg-red-50 text-red-700",
  verify: "bg-grill-orange/10 text-grill-orange-dark",
  generate_qr: "bg-blue-50 text-blue-700",
};

function formatValue(json: string | null): string {
  if (!json) return "—";
  try {
    const obj = JSON.parse(json);
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
  } catch {
    return json;
  }
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    api.get("/audit-logs").then((res) => setLogs(res.data));
  }, []);

  async function removeLog(id: string) {
    if (!confirm("Delete this audit log entry? This can't be undone.")) return;
    setDeletingId(id);
    try {
      await api.delete(`/audit-logs/${id}`);
      setLogs((prev) => prev?.filter((l) => l.id !== id) ?? prev);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar active="/admin/audit-log" />

      <main className="flex-1 px-10 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-grill-orange-dark">
          Accountability
        </p>
        <h1 className="mt-1 font-display text-3xl text-grill-brown">Audit Log</h1>
        <p className="mt-2 text-sm text-grill-brown/50">
          Every admin-performed create/update/delete, most recent first.
        </p>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-grill-brown/10 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-grill-brown/40">
                <th className="px-6 py-4 font-medium">Admin</th>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Table</th>
                <th className="px-6 py-4 font-medium">Record</th>
                <th className="px-6 py-4 font-medium">Before</th>
                <th className="px-6 py-4 font-medium">After</th>
                <th className="px-6 py-4 font-medium">When</th>
                <th className="px-6 py-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {logs?.map((log) => (
                <tr key={log.id} className="border-t border-grill-brown/5">
                  <td className="px-6 py-4 font-medium text-grill-brown">{log.admin?.name ?? "—"}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        ACTION_STYLES[log.action] ?? "bg-grill-brown/5 text-grill-brown/70"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-grill-brown/70">{log.tableName}</td>
                  <td className="px-6 py-4 text-grill-brown/50">#{log.recordId ?? "—"}</td>
                  <td className="max-w-xs truncate px-6 py-4 text-xs text-grill-brown/50">
                    {formatValue(log.oldValue)}
                  </td>
                  <td className="max-w-xs truncate px-6 py-4 text-xs text-grill-brown/50">
                    {formatValue(log.newValue)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-grill-brown/50">
                    {new Date(log.timestamp).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => removeLog(log.id)}
                      disabled={deletingId === log.id}
                      className="rounded-md p-1.5 text-grill-brown/30 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </td>
                </tr>
              ))}
              {logs?.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-grill-brown/40">
                    No admin actions recorded yet
                  </td>
                </tr>
              )}
              {logs === null && (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-grill-brown/40">
                    Loading…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
