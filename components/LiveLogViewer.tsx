"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import type { DAGRun, RunState, TaskLog } from "@/types";

const POLL_INTERVAL_MS = 3000;
const TERMINAL_STATES: RunState[] = ["success", "failed"];

// Structured log entry as returned by Airflow's JSON log format
interface LogEntry {
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warning" | "error" | "critical";
  logger?: string;
  [key: string]: unknown;
}

const LEVEL_STYLES: Record<string, string> = {
  debug: "text-gray-500",
  info: "text-green-400",
  warning: "text-yellow-400",
  error: "text-red-400",
  critical: "text-red-300 font-bold",
};

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toTimeString().slice(0, 12); // HH:MM:SS.mmm
  } catch {
    return iso;
  }
}

function parseContent(content: unknown): LogEntry[] | null {
  if (Array.isArray(content)) {
    // Already parsed — check first entry has the expected shape
    if (content.length === 0 || typeof content[0]?.event === "string") {
      return content as LogEntry[];
    }
  }
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && typeof parsed[0]?.event === "string") {
        return parsed as LogEntry[];
      }
    } catch {
      // plain text — fall through
    }
  }
  return null;
}

function LogContent({ content }: { content: unknown }) {
  const entries = parseContent(content);

  if (entries) {
    return (
      <div className="max-h-[32rem] overflow-y-auto bg-gray-950 px-4 py-3 font-mono text-xs leading-6">
        {entries.map((entry, i) => (
          <div key={i} className="flex gap-3">
            <span className="shrink-0 text-gray-600">
              {formatTime(entry.timestamp)}
            </span>
            <span
              className={`shrink-0 w-16 uppercase ${LEVEL_STYLES[entry.level] ?? "text-gray-400"}`}
            >
              {entry.level}
            </span>
            <span className="text-gray-200 whitespace-pre-wrap break-all">
              {entry.event}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Fallback: plain text
  return (
    <pre className="max-h-[32rem] overflow-y-auto whitespace-pre-wrap break-all bg-gray-950 px-4 py-3 font-mono text-xs leading-5 text-green-300">
      {typeof content === "string"
        ? content
        : JSON.stringify(content, null, 2)}
    </pre>
  );
}

interface Props {
  dagId: string;
  runId: string;
}

export function LiveLogViewer({ dagId, runId }: Props) {
  const [logs, setLogs] = useState<TaskLog[]>([]);
  const [runState, setRunState] = useState<RunState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchRunState = useCallback(async (): Promise<RunState | null> => {
    const res = await fetch(
      `/api/airflow/dags/${dagId}/runs/${encodeURIComponent(runId)}`,
    );
    if (!res.ok) return null;
    const run: DAGRun = await res.json();
    return run.state;
  }, [dagId, runId]);

  const fetchLogs = useCallback(async (): Promise<TaskLog[]> => {
    const res = await fetch(
      `/api/airflow/dags/${dagId}/runs/${encodeURIComponent(runId)}/logs`,
    );
    if (!res.ok) return [];
    return res.json();
  }, [dagId, runId]);

  const poll = useCallback(async () => {
    try {
      const [state, newLogs] = await Promise.all([
        fetchRunState(),
        fetchLogs(),
      ]);

      if (state) setRunState(state);
      if (newLogs.length > 0) {
        setLogs(newLogs);
        setTimeout(scrollToBottom, 50);
      }

      if (state && TERMINAL_STATES.includes(state)) {
        setPolling(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch {
      setError("Failed to fetch logs. Retrying…");
    }
  }, [fetchRunState, fetchLogs, scrollToBottom]);

  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [poll]);

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="flex items-center gap-3 rounded-lg border bg-white px-4 py-3">
        {runState ? (
          <>
            <StatusBadge state={runState} />
            {polling ? (
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Live — refreshing every {POLL_INTERVAL_MS / 1000}s
              </span>
            ) : (
              <span className="text-xs text-gray-400">Run complete</span>
            )}
          </>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Waiting for run to start…
          </span>
        )}
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      {/* Log panels */}
      {logs.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-gray-400">
          Waiting for task logs…
        </div>
      ) : (
        logs.map((log) => (
          <div key={`${log.task_id}-${log.try_number}`} className="rounded-lg border overflow-hidden">
            <div className="flex items-center gap-3 border-b bg-gray-800 px-4 py-2">
              <span className="text-xs font-semibold text-gray-100">
                {log.task_id}
              </span>
              <span className="text-xs text-gray-400">
                attempt #{log.try_number}
              </span>
            </div>
            <LogContent content={log.content} />
          </div>
        ))
      )}

      <div ref={bottomRef} />
    </div>
  );
}
