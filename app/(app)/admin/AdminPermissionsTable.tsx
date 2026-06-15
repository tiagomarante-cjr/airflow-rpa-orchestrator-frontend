"use client";

import { Check, Save } from "lucide-react";
import { useState } from "react";

interface UserPerms {
  email: string;
  dag_ids: string[];
}

export function AdminPermissionsTable({
  users,
  allDagIds,
}: {
  users: UserPerms[];
  allDagIds: string[];
}) {
  const [state, setState] = useState<Record<string, string[]>>(
    Object.fromEntries(users.map((u) => [u.email, u.dag_ids])),
  );
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  function toggleDag(email: string, dagId: string) {
    setState((prev) => {
      const current = prev[email] ?? [];
      const next = current.includes(dagId)
        ? current.filter((d) => d !== dagId)
        : [...current, dagId];
      return { ...prev, [email]: next };
    });
  }

  function toggleAll(email: string) {
    setState((prev) => {
      const current = prev[email] ?? [];
      const hasAll = allDagIds.every((d) => current.includes(d));
      return { ...prev, [email]: hasAll ? [] : [...allDagIds] };
    });
  }

  async function saveUser(email: string) {
    setSaving((s) => ({ ...s, [email]: true }));
    setSaved((s) => ({ ...s, [email]: false }));
    try {
      await fetch(`/api/permissions/${encodeURIComponent(email)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dag_ids: state[email] ?? [] }),
      });
      setSaved((s) => ({ ...s, [email]: true }));
      setTimeout(() => setSaved((s) => ({ ...s, [email]: false })), 2000);
    } finally {
      setSaving((s) => ({ ...s, [email]: false }));
    }
  }

  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
        <p className="text-sm text-slate-400">No users found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map(({ email }) => {
        const assigned = state[email] ?? [];
        const isWildcard = assigned.includes("*");

        return (
          <div
            key={email}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            {/* Card header */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/60 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                  {email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{email}</p>
                  <p className="text-xs text-slate-500">
                    {isWildcard
                      ? "All DAGs (wildcard)"
                      : `${assigned.length} DAG${assigned.length !== 1 ? "s" : ""} assigned`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => saveUser(email)}
                disabled={saving[email]}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition-all disabled:opacity-50 ${
                  saved[email]
                    ? "bg-emerald-500 text-white shadow-emerald-500/20"
                    : "bg-indigo-600 text-white shadow-indigo-500/20 hover:bg-indigo-700"
                }`}
              >
                {saved[email] ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    {saving[email] ? "Saving…" : "Save"}
                  </>
                )}
              </button>
            </div>

            {/* DAG toggles */}
            <div className="px-5 py-4">
              {allDagIds.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No DAGs available from Airflow.
                </p>
              ) : (
                <>
                  <button
                    onClick={() => toggleAll(email)}
                    className="mb-3 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    {allDagIds.every((d) => assigned.includes(d))
                      ? "Deselect all"
                      : "Select all"}
                  </button>
                  <div className="flex flex-wrap gap-2">
                    {allDagIds.map((dagId) => {
                      const selected = assigned.includes(dagId) || isWildcard;
                      return (
                        <button
                          key={dagId}
                          onClick={() => toggleDag(email, dagId)}
                          disabled={isWildcard}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-all ${
                            selected
                              ? "bg-indigo-50 text-indigo-700 ring-indigo-500/30 hover:bg-indigo-100"
                              : "bg-white text-slate-600 ring-slate-200 hover:ring-slate-300"
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          {dagId}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
