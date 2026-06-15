import { ChevronLeft, Terminal } from "lucide-react";
import Link from "next/link";
import { LiveLogViewer } from "@/components/LiveLogViewer";

export default async function LogViewerPage({
  params,
}: {
  params: Promise<{ dagId: string; runId: string }>;
}) {
  const { dagId, runId } = await params;
  const decodedRunId = decodeURIComponent(runId);

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/dashboard/${dagId}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          {dagId}
        </Link>
        <div className="mt-3 flex items-start gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800">
            <Terminal className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Run Logs</h1>
            <p className="mt-0.5 font-mono text-xs text-slate-400">{decodedRunId}</p>
          </div>
        </div>
      </div>

      <LiveLogViewer dagId={dagId} runId={decodedRunId} />
    </div>
  );
}
