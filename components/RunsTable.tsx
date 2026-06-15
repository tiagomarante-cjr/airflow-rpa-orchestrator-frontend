"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { DAGRun } from "@/types";
import { StatusBadge } from "./StatusBadge";

function duration(start: string | null, end: string | null): string {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}

const HEADERS = ["Run ID", "Start", "End", "Duration", "Status", ""];

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
              <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs text-slate-600">
                {run.dag_run_id}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                {run.start_date ? new Date(run.start_date).toLocaleString() : "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                {run.end_date ? new Date(run.end_date).toLocaleString() : "—"}
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
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
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
