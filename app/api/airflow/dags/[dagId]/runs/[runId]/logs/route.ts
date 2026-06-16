import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { airflowRequest } from "@/lib/airflow";
import { authOptions } from "@/lib/auth";
import { hasAction } from "@/lib/permissions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dagId: string; runId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { dagId, runId } = await params;
  const email = session.user.email;
  const role = (session.user as typeof session.user & { role: string }).role;

  if (role !== "admin" && !hasAction(email, dagId, "read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // FastAPI does not decode %2B in path segments — keep + literal
  const encodedRunId = encodeURIComponent(runId).replace(/%2B/gi, "+");

  let tasks: Array<{ task_id: string; try_number: number; map_index?: number }> = [];
  try {
    const tasksData = await airflowRequest(
      "get",
      `/api/v2/dags/${dagId}/dagRuns/${encodedRunId}/taskInstances`,
    );
    tasks = tasksData.task_instances ?? [];
  } catch {
    // Run was stopped/killed — task instances unavailable, return empty logs gracefully
    return NextResponse.json([]);
  }

  if (tasks.length === 0) return NextResponse.json([]);

  const logs = await Promise.all(
    tasks.map(async (task) => {
      const tryNumber = Math.max(1, task.try_number || 1);
      const mapIndex = task.map_index ?? -1;
      const logPath =
        mapIndex >= 0
          ? `/api/v2/dags/${dagId}/dagRuns/${encodedRunId}/taskInstances/${task.task_id}/${mapIndex}/logs/${tryNumber}`
          : `/api/v2/dags/${dagId}/dagRuns/${encodedRunId}/taskInstances/${task.task_id}/logs/${tryNumber}`;
      try {
        const logData = await airflowRequest("get", logPath);
        return { task_id: task.task_id, try_number: tryNumber, content: logData.content ?? logData };
      } catch {
        return { task_id: task.task_id, try_number: tryNumber, content: "[Log unavailable]" };
      }
    }),
  );

  return NextResponse.json(logs);
}
