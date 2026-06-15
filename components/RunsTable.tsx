"use client";

import Link from "next/link";
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

export function RunsTable({ dagId, runs }: { dagId: string; runs: DAGRun[] }) {
  if (runs.length === 0) {
    return <p className="text-sm text-gray-500">No runs found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {["Run ID", "Start", "End", "Duration", "Status", ""].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {runs.map((run) => (
            <tr key={run.dag_run_id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs text-gray-700 max-w-xs truncate">
                {run.dag_run_id}
              </td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                {run.start_date
                  ? new Date(run.start_date).toLocaleString()
                  : "—"}
              </td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                {run.end_date ? new Date(run.end_date).toLocaleString() : "—"}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {duration(run.start_date, run.end_date)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge state={run.state} />
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/dashboard/${dagId}/runs/${encodeURIComponent(run.dag_run_id)}`}
                  className="text-blue-600 hover:underline text-xs"
                >
                  Logs
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
