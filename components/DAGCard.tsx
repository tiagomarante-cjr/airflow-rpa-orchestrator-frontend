"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, Clock, Calendar } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import type { DAG } from "@/types";

export function DAGCard({ dag }: { dag: DAG }) {
  const [triggering, setTriggering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleTrigger() {
    setTriggering(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/airflow/dags/${dag.dag_id}/trigger`, {
        method: "POST",
      });
      if (res.ok) {
        setMessage("Run triggered successfully");
      } else {
        const body = await res.json();
        setMessage(body.error ?? "Trigger failed");
      }
    } catch {
      setMessage("Network error");
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
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{dag.description}</p>
          )}
        </div>
        {dag.last_run && (
          <StatusBadge state={dag.last_run.state} />
        )}
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

      <div className="mt-4 flex items-center gap-3">
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
        {message && (
          <span className={`text-xs ${message.includes("success") ? "text-green-600" : "text-red-600"}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
