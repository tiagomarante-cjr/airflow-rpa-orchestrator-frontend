"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import type { DAGRun, RunState, TaskLog } from "@/types";

const POLL_INTERVAL_MS = 3000;
const TERMINAL_STATES: RunState[] = ["success", "failed"];

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
      const [state, newLogs] = await Promise.all([fetchRunState(), fetchLogs()]);

      if (state) setRunState(state);
      if (newLogs.length > 0) {
        setLogs(newLogs);
        // Scroll after state update settles
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
    // Immediate first fetch
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
            {polling && (
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Live — refreshing every {POLL_INTERVAL_MS / 1000}s
              </span>
            )}
            {!polling && (
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
          <div key={`${log.task_id}-${log.try_number}`} className="rounded-lg border">
            <div className="flex items-center gap-3 rounded-t-lg border-b bg-gray-800 px-4 py-2">
              <span className="text-xs font-semibold text-gray-100">
                {log.task_id}
              </span>
              <span className="text-xs text-gray-400">
                attempt #{log.try_number}
              </span>
            </div>
            <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap break-all bg-gray-950 px-4 py-3 font-mono text-xs leading-5 text-green-300">
              {typeof log.content === "string"
                ? log.content
                : JSON.stringify(log.content, null, 2)}
            </pre>
          </div>
        ))
      )}

      <div ref={bottomRef} />
    </div>
  );
}
