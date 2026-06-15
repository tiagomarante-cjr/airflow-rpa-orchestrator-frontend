"use client";

import Link from "next/link";
import { ArrowRight, Clock, Play } from "lucide-react";
import type { DAGRun } from "@/types";
import { StatusBadge } from "./StatusBadge";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function duration(start: string | null, end: string | null): string {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}

function RunTypeBadge({ runType }: { runType: string }) {
  const isManual = runType === "manual";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        isManual
          ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
          : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
      }`}
    >
      {isManual ? <Play className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
      {isManual ? "Manual" : "Scheduled"}
    </span>
  );
}

const HEADERS = ["Type", "Start", "End", "Duration", "Status", ""];

export function RunsTable({ dagId, runs }: { dagId: string; runs: DAGRun[] }) {
  if (runs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
        <p className="text-sm text-slate-400">No runs found for this DAG.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80">
            {HEADERS.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {runs.map((run, i) => (
            <tr
              key={run.dag_run_id}
              className={`transition-colors hover:bg-indigo-50/40 ${i % 2 === 1 ? "bg-slate-50/40" : ""}`}
            >
              <td className="px-4 py-3">
                <RunTypeBadge runType={run.run_type} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                {run.start_date ? formatDate(run.start_date) : "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                {run.end_date ? formatDate(run.end_date) : "—"}
              </td>
              <td className="px-4 py-3 text-xs font-medium text-slate-700">
                {duration(run.start_date, run.end_date)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge state={run.state} />
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/dashboard/${dagId}/runs/${encodeURIComponent(run.dag_run_id)}`}
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-800"
                >
                  Logs
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
