"use client";

import { useEffect, useRef } from "react";
import type React from "react";
import type { AirflowLogEntry, TaskLog } from "@/types";

const LEVEL_COLOURS: Record<string, string> = {
  error: "text-red-400",
  critical: "text-red-400",
  warning: "text-amber-400",
  warn: "text-amber-400",
  info: "text-emerald-400",
  debug: "text-slate-400",
};

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toTimeString().slice(0, 8);
  } catch {
    return ts;
  }
}

function renderEntries(entries: AirflowLogEntry[]): React.ReactNode[] {
  return entries
    .filter(
      (e) => e.timestamp && e.event && !e.event.startsWith("::"),
    )
    .map((e, i) => {
      const level = (e.level ?? "info").toLowerCase();
      const colour = LEVEL_COLOURS[level] ?? "text-emerald-400";
      const levelTag = level.toUpperCase().padEnd(8);
      return (
        <span key={i} className="block leading-5">
          <span className="text-slate-500">{formatTimestamp(e.timestamp!)}</span>
          {" "}
          <span className={colour}>{levelTag}</span>
          {" "}
          <span className="text-emerald-300">{e.event}</span>
        </span>
      );
    });
}

function LogContent({ content }: { content: TaskLog["content"] }) {
  if (typeof content === "string") {
    return <span>{content}</span>;
  }
  if (Array.isArray(content)) {
    const nodes = renderEntries(content as AirflowLogEntry[]);
    if (nodes.length === 0) {
      return <span className="text-slate-500">No log output yet.</span>;
    }
    return <>{nodes}</>;
  }
  return <span className="text-slate-500">No log output.</span>;
}

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
          <pre className="max-h-[32rem] overflow-y-auto whitespace-pre-wrap break-all bg-slate-950 px-4 py-4 font-mono text-xs leading-5">
            <LogContent content={log.content} />
          </pre>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
