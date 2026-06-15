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
    return <p className="text-sm text-gray-500">No logs available.</p>;
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div
          key={`${log.task_id}-${log.try_number}`}
          className="rounded-lg border"
        >
          <div className="flex items-center gap-3 rounded-t-lg border-b bg-gray-800 px-4 py-2">
            <span className="text-xs font-semibold text-gray-100">
              {log.task_id}
            </span>
            <span className="text-xs text-gray-400">
              attempt #{log.try_number}
            </span>
          </div>
          <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap break-all bg-gray-950 px-4 py-3 font-mono text-xs text-green-300 leading-5">
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
