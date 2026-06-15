"use client";

import type { RunState } from "@/types";

const STATE_STYLES: Record<RunState, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  failed: "bg-red-50 text-red-700 ring-red-600/20",
  running: "bg-amber-50 text-amber-700 ring-amber-600/20",
  queued: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  scheduled: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

const DOT_STYLES: Record<RunState, string> = {
  success: "bg-emerald-500",
  failed: "bg-red-500",
  running: "bg-amber-500 animate-pulse",
  queued: "bg-indigo-400",
  scheduled: "bg-slate-400",
};

export function StatusBadge({ state }: { state: RunState | string }) {
  const styles =
    STATE_STYLES[state as RunState] ?? "bg-slate-100 text-slate-600 ring-slate-500/20";
  const dot =
    DOT_STYLES[state as RunState] ?? "bg-slate-400";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset capitalize ${styles}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {state}
    </span>
  );
}
