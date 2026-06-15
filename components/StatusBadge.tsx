"use client";

import type { RunState } from "@/types";

const STATE_STYLES: Record<RunState, string> = {
  success: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
  running: "bg-yellow-100 text-yellow-800 border-yellow-200",
  queued: "bg-blue-100 text-blue-800 border-blue-200",
  scheduled: "bg-gray-100 text-gray-700 border-gray-200",
};

export function StatusBadge({ state }: { state: RunState | string }) {
  const styles = STATE_STYLES[state as RunState] ?? "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${styles}`}
    >
      {state}
    </span>
  );
}
