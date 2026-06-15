import { ChevronLeft, History } from "lucide-react";
import Link from "next/link";
import { RunsTable } from "@/components/RunsTable";
import { getRunsForDag } from "@/lib/dag-service";

export default async function RunHistoryPage({
  params,
}: {
  params: Promise<{ dagId: string }>;
}) {
  const { dagId } = await params;
  const runs = await getRunsForDag(dagId);

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Dashboard
        </Link>
        <div className="mt-3 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
            <History className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{dagId}</h1>
            <p className="text-xs text-slate-500">
              {runs.length} run{runs.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      <RunsTable dagId={dagId} runs={runs} />
    </div>
  );
}
