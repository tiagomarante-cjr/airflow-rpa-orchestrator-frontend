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
    return <p className="text-sm text-gray-500">No users found.</p>;
  }

  return (
    <div className="space-y-6">
      {users.map(({ email }) => {
        const assigned = state[email] ?? [];
        const isWildcard = assigned.includes("*");

        return (
          <div key={email} className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="font-semibold text-gray-900">{email}</p>
                <p className="text-xs text-gray-500">
                  {isWildcard
                    ? "All DAGs (wildcard)"
                    : `${assigned.length} DAG${assigned.length !== 1 ? "s" : ""} assigned`}
                </p>
              </div>
              <button
                onClick={() => saveUser(email)}
                disabled={saving[email]}
                className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
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

            {allDagIds.length === 0 ? (
              <p className="text-xs text-gray-400">
                No DAGs available from Airflow.
              </p>
            ) : (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <button
                    onClick={() => toggleAll(email)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {allDagIds.every((d) => assigned.includes(d))
                      ? "Deselect all"
                      : "Select all"}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {allDagIds.map((dagId) => {
                    const selected = assigned.includes(dagId) || isWildcard;
                    return (
                      <button
                        key={dagId}
                        onClick={() => toggleDag(email, dagId)}
                        disabled={isWildcard}
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                          selected
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
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
        );
      })}
    </div>
  );
}
