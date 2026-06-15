import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { airflowRequest } from "@/lib/airflow";
import { authOptions } from "@/lib/auth";
import { getPermissions } from "@/lib/permissions";

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

  if (role !== "admin") {
    const permitted = getPermissions(email);
    if (!permitted.includes(dagId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    // Fetch task instances for this run to get per-task logs
    const tasksData = await airflowRequest(
      "get",
      `/api/v2/dags/${dagId}/dagRuns/${runId}/taskInstances`,
    );
    const tasks: Array<{ task_id: string; try_number: number }> =
      tasksData.task_instances ?? [];

    const logs = await Promise.all(
      tasks.map(async (task) => {
        try {
          const logData = await airflowRequest(
            "get",
            `/api/v2/dags/${dagId}/dagRuns/${runId}/taskInstances/${task.task_id}/logs/${task.try_number ?? 1}`,
          );
          return {
            task_id: task.task_id,
            try_number: task.try_number ?? 1,
            content: logData.content ?? logData,
          };
        } catch {
          return {
            task_id: task.task_id,
            try_number: task.try_number ?? 1,
            content: "[Log unavailable]",
          };
        }
      }),
    );

    return NextResponse.json(logs);
  } catch (err) {
    console.error("Airflow logs error:", err);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 502 },
    );
  }
}
