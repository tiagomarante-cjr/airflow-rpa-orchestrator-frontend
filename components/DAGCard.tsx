"use client";

import { Activity, Calendar, CheckCircle2, Clock, Loader2, Play, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { DAG } from "@/types";

function parseCron(expr: string): string {
  const named: Record<string, string> = {
    "@daily": "Daily at midnight",
    "@hourly": "Every hour",
    "@weekly": "Weekly on Sunday",
    "@monthly": "Monthly on the 1st",
    "@yearly": "Yearly on Jan 1st",
    "@once": "Once",
    None: "No schedule",
  };
  if (named[expr]) return named[expr];

  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return expr;

  const [minute, hour, dom, month, dow] = parts;
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const timeLabel =
    hour !== "*" && minute !== "*"
      ? `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`
      : null;

  if (dom === "*" && month === "*" && dow === "*") {
    if (timeLabel) return `Daily at ${timeLabel}`;
    if (hour.startsWith("*/")) return `Every ${hour.slice(2)} hours`;
    if (minute.startsWith("*/")) return `Every ${minute.slice(2)} minutes`;
  }

  if (dom === "*" && month === "*" && /^\d$/.test(dow) && timeLabel)
    return `Weekly on ${DAYS[+dow]} at ${timeLabel}`;

  if (dom !== "*" && month === "*" && dow === "*" && timeLabel)
    return `Monthly on day ${dom} at ${timeLabel}`;

  return expr;
}

function formatNextRun(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffH = Math.round(diffMs / 1000 / 3600);
  const diffM = Math.round(diffMs / 1000 / 60);

  if (diffM < 60) return `in ${diffM}m`;
  if (diffH < 24) return `in ${diffH}h`;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function LastRunIcon({ state }: { state: string }) {
  if (state === "success")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="h-3 w-3" />
        Successful
      </span>
    );
  if (state === "failed")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
        <XCircle className="h-3 w-3" />
        Failed
      </span>
    );
  if (state === "running")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
        <Loader2 className="h-3 w-3 animate-spin" />
        Running
      </span>
    );
  return null;
}

export function DAGCard({ dag, canTrigger }: { dag: DAG; canTrigger: boolean }) {
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
            <p className="mt-1 line-clamp-2 text-xs text-slate-500">{dag.description}</p>
          )}
        </div>
        {dag.last_run && <LastRunIcon state={dag.last_run.state} />}
      </div>

      {/* Meta row */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
        {dag.schedule_interval && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {parseCron(dag.schedule_interval)}
          </span>
        )}
        {dag.next_dagrun && (
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Next run {formatNextRun(dag.next_dagrun)}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="my-4 h-px bg-slate-100" />

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {canTrigger ? (
          <button
            onClick={handleTrigger}
            disabled={triggering}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-indigo-500/20 transition-all hover:bg-indigo-700 hover:shadow-indigo-500/30 disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" />
            {triggering ? "Triggering…" : "Trigger Run"}
          </button>
        ) : (
          <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-400">
            <Play className="h-3.5 w-3.5" />
            Read-only
          </span>
        )}

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
