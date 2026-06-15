import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { LogViewer } from "@/components/LogViewer";
import { getLogsForRun } from "@/lib/dag-service";

export default async function LogViewerPage({
  params,
}: {
  params: Promise<{ dagId: string; runId: string }>;
}) {
  const { dagId, runId } = await params;
  const logs = await getLogsForRun(dagId, decodeURIComponent(runId));

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/dashboard/${dagId}`}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to {dagId}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Run Logs</h1>
        <p className="mt-1 font-mono text-xs text-gray-400">
          {decodeURIComponent(runId)}
        </p>
      </div>

      <LogViewer logs={logs} />
    </div>
  );
}
