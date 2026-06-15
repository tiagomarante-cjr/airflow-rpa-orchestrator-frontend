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
    <div className="rounded-lg border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href={`/dashboard/${dag.dag_id}`}
            className="truncate text-base font-semibold text-gray-900 hover:text-blue-600 transition-colors"
          >
            {dag.dag_id}
          </Link>
          {dag.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {dag.description}
            </p>
          )}
        </div>
        {dag.last_run && <StatusBadge state={dag.last_run.state} />}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        {dag.schedule_interval && (
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {dag.schedule_interval}
          </span>
        )}
        {dag.next_dagrun && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            Next: {new Date(dag.next_dagrun).toLocaleString()}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <button
          onClick={handleTrigger}
          disabled={triggering}
          className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Play className="h-3.5 w-3.5" />
          {triggering ? "Triggering…" : "Trigger Run"}
        </button>

        <Link
          href={`/dashboard/${dag.dag_id}`}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          View history
        </Link>

        {triggeredRunId && (
          <Link
            href={`/dashboard/${dag.dag_id}/runs/${encodeURIComponent(triggeredRunId)}`}
            className="flex items-center gap-1.5 rounded-md border border-green-500 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
          >
            <Activity className="h-3.5 w-3.5" />
            Live Logs
          </Link>
        )}

        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}
