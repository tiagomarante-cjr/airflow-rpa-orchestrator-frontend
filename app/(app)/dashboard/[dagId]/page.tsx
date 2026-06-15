import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getRunsForDag } from "@/lib/dag-service";
import { RunsTable } from "@/components/RunsTable";

export default async function RunHistoryPage({
  params,
}: {
  params: Promise<{ dagId: string }>;
}) {
  const { dagId } = await params;
  const runs = await getRunsForDag(dagId);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{dagId}</h1>
        <p className="text-sm text-gray-500 mt-1">Run history</p>
      </div>

      <RunsTable dagId={dagId} runs={runs} />
    </div>
  );
}
