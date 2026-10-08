"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";

type AuditRow = {
  id: string;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  requestId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string | null;
};

export default function AdminAuditLogPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/audit-log?limit=100", {
        cache: "no-store",
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.error || "Audit log load failed");
      }
      setRows(Array.isArray(body.data) ? body.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit log load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <ShieldCheck size={14} /> Super Admin only
          </div>
          <h1 className="text-3xl font-extrabold">Admin Audit Log</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Role, user-state, settings, access-policy and other privileged changes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-2 text-sm font-bold"
        >
          <RefreshCw className={loading ? "animate-spin" : ""} size={16} />
          রিফ্রেশ
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-[var(--border-color)] bg-[var(--muted)] text-left">
              <tr>
                <th className="px-4 py-3">সময়</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-[var(--muted-foreground)]">
                    {row.createdAt ? new Date(row.createdAt).toLocaleString("bn-BD") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold">{row.actorEmail || "Unknown"}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">{row.actorRole || "—"}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{row.action}</td>
                  <td className="px-4 py-3 text-xs">
                    <div>{row.targetType || "—"}</div>
                    <div className="max-w-56 truncate text-[var(--muted-foreground)]">{row.targetId || "—"}</div>
                  </td>
                  <td className="max-w-lg px-4 py-3">
                    <pre className="max-h-28 overflow-auto whitespace-pre-wrap break-words text-[11px] text-[var(--muted-foreground)]">
                      {row.metadata ? JSON.stringify(row.metadata, null, 2) : "—"}
                    </pre>
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[var(--muted-foreground)]">
                    এখনো কোনো privileged audit event নেই।
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
