"use client";

import { useEffect, useRef } from "react";
import type { TaskLog } from "@/types";

export function LogViewer({ logs }: { logs: TaskLog[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logs.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
        <p className="text-sm text-slate-400">No logs available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <div
          key={`${log.task_id}-${log.try_number}`}
          className="overflow-hidden rounded-xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center gap-3 border-b border-slate-700 bg-slate-800 px-4 py-2.5">
            <span className="text-xs font-semibold text-slate-100">
              {log.task_id}
            </span>
            <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] text-slate-400">
              attempt #{log.try_number}
            </span>
          </div>
          <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap break-all bg-slate-950 px-4 py-4 font-mono text-xs leading-5 text-emerald-400">
            {typeof log.content === "string"
              ? log.content
              : JSON.stringify(log.content, null, 2)}
          </pre>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
