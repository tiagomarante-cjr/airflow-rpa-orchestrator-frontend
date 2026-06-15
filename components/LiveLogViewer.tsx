"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import type { DAGRun, RunState, TaskLog } from "@/types";

const POLL_INTERVAL_MS = 3000;
const TERMINAL_STATES: RunState[] = ["success", "failed"];

interface LogEntry {
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warning" | "error" | "critical";
  [key: string]: unknown;
}

const LEVEL_CONFIG: Record<string, { label: string; row: string; badge: string; text: string }> = {
  debug:    { label: "DEBUG",   row: "",                         badge: "bg-slate-100 text-slate-500",   text: "text-slate-500" },
  info:     { label: "INFO",    row: "",                         badge: "bg-sky-50 text-sky-600",        text: "text-slate-700" },
  warning:  { label: "WARN",   row: "bg-amber-50/60",           badge: "bg-amber-100 text-amber-700",   text: "text-slate-700" },
  error:    { label: "ERROR",   row: "bg-red-50/60",             badge: "bg-red-100 text-red-700",       text: "text-slate-700" },
  critical: { label: "CRIT",   row: "bg-red-50/60",             badge: "bg-red-200 text-red-800",       text: "text-slate-700 font-semibold" },
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toTimeString().slice(0, 8);
  } catch {
    return iso;
  }
}

function parseContent(content: unknown): LogEntry[] | null {
  if (Array.isArray(content) && (content.length === 0 || typeof content[0]?.event === "string"))
    return content as LogEntry[];
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && typeof parsed[0]?.event === "string") return parsed as LogEntry[];
    } catch { /* plain text */ }
  }
  return null;
}

function RunStatePill({ state, polling }: { state: RunState; polling: boolean }) {
  if (state === "success")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5" /> Successful
      </span>
    );
  if (state === "failed")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200">
        <XCircle className="h-3.5 w-3.5" /> Failed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      {polling ? `Live · refreshing every ${POLL_INTERVAL_MS / 1000}s` : "Running"}
    </span>
  );
}

function TaskLogBlock({ log }: { log: TaskLog }) {
  const entries = parseContent(log.content);
  const filtered = entries?.filter((e) => e.event && !e.event.startsWith("::")) ?? [];

  return (
    <section>
      {/* Task header */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm font-semibold text-slate-800">{log.task_id}</span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
          attempt #{log.try_number}
        </span>
        <div className="flex-1 border-t border-slate-100" />
      </div>

      {entries ? (
        filtered.length === 0 ? (
          <p className="text-sm text-slate-400">No log output.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-100">
            {filtered.map((e, i) => {
              const cfg = LEVEL_CONFIG[e.level] ?? LEVEL_CONFIG.info;
              return (
                <div
                  key={i}
                  className={`flex gap-0 divide-x divide-slate-100 font-mono text-xs leading-6 ${cfg.row} ${i !== 0 ? "border-t border-slate-100" : ""}`}
                >
                  <span className="shrink-0 px-3 py-1 text-slate-400 tabular-nums">
                    {formatTime(e.timestamp)}
                  </span>
                  <span className="flex shrink-0 items-center px-3 py-1">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                  </span>
                  <span className={`flex-1 px-3 py-1 whitespace-pre-wrap break-all ${cfg.text}`}>
                    {e.event}
                  </span>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <pre className="whitespace-pre-wrap break-all font-mono text-xs leading-5 text-slate-700">
          {typeof log.content === "string" ? log.content : JSON.stringify(log.content, null, 2)}
        </pre>
      )}
    </section>
  );
}

export function LiveLogViewer({ dagId, runId }: { dagId: string; runId: string }) {
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [runState, setRunState] = useState<RunState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRunState = useCallback(async (): Promise<RunState | null> => {
    const res = await fetch(`/api/airflow/dags/${dagId}/runs/${encodeURIComponent(runId)}`);
    if (!res.ok) return null;
    const run: DAGRun = await res.json();
    return run.state;
  }, [dagId, runId]);

  const fetchLogs = useCallback(async (): Promise<TaskLog[]> => {
    const res = await fetch(`/api/airflow/dags/${dagId}/runs/${encodeURIComponent(runId)}/logs`);
    if (!res.ok) return [];
    return res.json();
  }, [dagId, runId]);

  const poll = useCallback(async () => {
    try {
      const [state, newLogs] = await Promise.all([fetchRunState(), fetchLogs()]);
      if (state) setRunState(state);
      if (newLogs.length > 0) setLogs(newLogs);
      if (state && TERMINAL_STATES.includes(state)) {
        setPolling(false);
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      }
    } catch {
      setError("Failed to fetch logs. Retrying…");
    }
  }, [fetchRunState, fetchLogs]);

  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [poll]);

  return (
    <div>
      {/* Status row */}
      <div className="mb-8 flex items-center gap-3">
        {runState ? (
          <>
            <RunStatePill state={runState} polling={polling} />
            {runState !== "running" && !polling && (
              <span className="text-xs text-slate-400">Run complete</span>
            )}
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Waiting for run to start…
          </span>
        )}
      </div>

      {error && <p className="mb-6 text-xs text-red-500">{error}</p>}

      {logs.length === 0 ? (
        <p className="text-sm text-slate-400">Waiting for task logs…</p>
      ) : (
        <div className="space-y-10">
          {logs.map((log) => (
            <TaskLogBlock key={`${log.task_id}-${log.try_number}`} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}
