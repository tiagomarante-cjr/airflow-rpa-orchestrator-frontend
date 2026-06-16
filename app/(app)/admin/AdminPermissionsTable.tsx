"use client";

import { Check, Eye, Play, Save, ShieldCheck } from "lucide-react";
import { useState } from "react";
import type { DagAction } from "@/types";

interface UserPerms {
  email: string;
  dags: Record<string, DagAction[]>;
}

function hasAction(actions: DagAction[], action: DagAction): boolean {
  return actions.includes(action);
}

function toggleAction(
  actions: DagAction[],
  action: DagAction,
): DagAction[] {
  if (action === "trigger") {
    // Granting trigger implicitly grants read; removing trigger keeps read.
    return hasAction(actions, "trigger")
      ? actions.filter((a) => a !== "trigger")
      : [...new Set([...actions, "read", "trigger"]) as Iterable<DagAction>];
  }
  // Removing read also removes trigger (can't trigger what you can't see).
  if (action === "read" && hasAction(actions, "read")) {
    return actions.filter((a) => a !== "read" && a !== "trigger");
  }
  return [...new Set([...actions, action]) as Iterable<DagAction>];
}

function ActionToggle({
  label,
  icon,
  active,
  disabled,
  colorActive,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  disabled?: boolean;
  colorActive: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={disabled ? "Read is required when Trigger is granted" : undefined}
      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
        active
          ? `${colorActive} ring-transparent`
          : "bg-white text-slate-500 ring-slate-200 hover:ring-slate-300"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export function AdminPermissionsTable({
  users,
  allDagIds,
}: {
  users: UserPerms[];
  allDagIds: string[];
}) {
  const [state, setState] = useState<Record<string, Record<string, DagAction[]>>>(
    Object.fromEntries(users.map((u) => [u.email, u.dags])),
  );
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  function toggle(email: string, dagId: string, action: DagAction) {
    setState((prev) => {
      const current = prev[email]?.[dagId] ?? [];
      const next = toggleAction(current, action);
      const dagMap = { ...prev[email], [dagId]: next };
      // Drop DAGs with no actions to keep the JSON clean.
      if (next.length === 0) delete dagMap[dagId];
      return { ...prev, [email]: dagMap };
    });
  }

  function toggleAllRead(email: string) {
    setState((prev) => {
      const current = prev[email] ?? {};
      const allHaveRead = allDagIds.every((d) =>
        hasAction(current[d] ?? [], "read"),
      );
      const dagMap: Record<string, DagAction[]> = {};
      if (!allHaveRead) {
        for (const id of allDagIds) {
          dagMap[id] = [...new Set([...(current[id] ?? []), "read"]) as Iterable<DagAction>];
        }
      }
      return { ...prev, [email]: dagMap };
    });
  }

  async function saveUser(email: string) {
    setSaving((s) => ({ ...s, [email]: true }));
    setSaved((s) => ({ ...s, [email]: false }));
    try {
      await fetch(`/api/permissions/${encodeURIComponent(email)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dags: state[email] ?? {} }),
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
    <div className="space-y-6">
      {users.map(({ email }) => {
        const dagMap = state[email] ?? {};
        const isWildcard = Boolean(dagMap["*"]);

        const assignedCount = isWildcard
          ? allDagIds.length
          : allDagIds.filter((d) => hasAction(dagMap[d] ?? [], "read")).length;

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
                      ? "Administrator — full access to all DAGs"
                      : `${assignedCount} of ${allDagIds.length} DAG${allDagIds.length !== 1 ? "s" : ""} visible`}
                  </p>
                </div>
              </div>

              {!isWildcard && (
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
              )}
            </div>

            {/* Body */}
            {isWildcard ? (
              <div className="flex items-center gap-2 px-5 py-4 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 text-indigo-400" />
                This user has administrator-level wildcard access and cannot be
                restricted here.
              </div>
            ) : allDagIds.length === 0 ? (
              <p className="px-5 py-4 text-xs text-slate-400">
                No DAGs available from Airflow.
              </p>
            ) : (
              <div className="px-5 py-4">
                {/* Column legend + bulk toggle */}
                <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-400">
                  <span>DAG</span>
                  <div className="flex items-center gap-6 pr-1">
                    <button
                      type="button"
                      onClick={() => toggleAllRead(email)}
                      className="flex items-center gap-1 text-indigo-500 hover:text-indigo-700 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {allDagIds.every((d) => hasAction(dagMap[d] ?? [], "read"))
                        ? "Remove all read"
                        : "Grant all read"}
                    </button>
                    <span className="flex items-center gap-1">
                      <Play className="h-3.5 w-3.5" />
                      Trigger
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
                  {allDagIds.map((dagId) => {
                    const actions = dagMap[dagId] ?? [];
                    const canRead = hasAction(actions, "read");
                    const canTrigger = hasAction(actions, "trigger");

                    return (
                      <div
                        key={dagId}
                        className={`flex items-center justify-between gap-4 px-4 py-2.5 transition-colors ${
                          canRead ? "bg-white" : "bg-slate-50/60"
                        }`}
                      >
                        <span
                          className={`min-w-0 flex-1 truncate text-xs font-medium ${
                            canRead ? "text-slate-800" : "text-slate-400"
                          }`}
                          title={dagId}
                        >
                          {dagId}
                        </span>

                        <div className="flex shrink-0 items-center gap-2">
                          <ActionToggle
                            label="Read"
                            icon={<Eye className="h-3 w-3" />}
                            active={canRead}
                            disabled={canTrigger}
                            colorActive="bg-blue-50 text-blue-700"
                            onClick={() => toggle(email, dagId, "read")}
                          />
                          <ActionToggle
                            label="Trigger"
                            icon={<Play className="h-3 w-3" />}
                            active={canTrigger}
                            colorActive="bg-amber-50 text-amber-700"
                            onClick={() => toggle(email, dagId, "trigger")}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
