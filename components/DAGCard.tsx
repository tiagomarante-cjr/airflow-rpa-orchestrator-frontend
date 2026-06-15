"use client";

import { Activity, Calendar, Clock, Play } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { DAG } from "@/types";
import { StatusBadge } from "./StatusBadge";

export function DAGCard({ dag }: { dag: DAG }) {
  const [triggering, setTriggering] = useState(false);
  const [triggeredRunId, setTriggeredRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleTrigger() {
    setTriggering(true);
    setError(null);
    setTriggeredRunId(null);
    try {
      const res = await fetch(`/api/airflow/dags/${dag.dag_id}/trigger`, {
        method: "POST",
      });
      if (res.ok) {
        const run = await res.json();
        setTriggeredRunId(run.dag_run_id as string);
      } else {
        const body = await res.json();
        setError(body.error ?? "Trigger failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setTriggering(false);
    }
  }

  return (
    <div className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/5">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/dashboard/${dag.dag_id}`}
            className="block truncate text-sm font-semibold text-slate-900 transition-colors hover:text-indigo-600"
          >
            {dag.dag_id}
          </Link>
          {dag.description && (
            <p className="mt-1 line-clamp-2 text-xs text-slate-500">
              {dag.description}
            </p>
          )}
        </div>
        {dag.last_run && <StatusBadge state={dag.last_run.state} />}
      </div>

      {/* Meta row */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
        {dag.schedule_interval && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {dag.schedule_interval}
          </span>
        )}
        {dag.next_dagrun && (
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {new Date(dag.next_dagrun).toLocaleString()}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="my-4 h-px bg-slate-100" />

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleTrigger}
          disabled={triggering}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all hover:bg-indigo-700 hover:shadow-indigo-500/30 disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5" />
          {triggering ? "Triggering…" : "Trigger Run"}
        </button>

        <Link
          href={`/dashboard/${dag.dag_id}`}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          View history
        </Link>

        {triggeredRunId && (
          <Link
            href={`/dashboard/${dag.dag_id}/runs/${encodeURIComponent(triggeredRunId)}`}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
          >
            <Activity className="h-3.5 w-3.5" />
            Live Logs
          </Link>
        )}

        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </div>
  );
}
