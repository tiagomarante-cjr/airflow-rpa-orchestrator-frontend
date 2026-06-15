import type { DAG, DAGRun, TaskLog } from "@/types";
import { airflowRequest } from "./airflow";
import { getPermissions } from "./permissions";

export async function getDagsForUser(
  email: string,
  role: string,
): Promise<DAG[]> {
  const data = await airflowRequest("get", "/api/v2/dags?limit=100");
  const allDags: DAG[] = data.dags ?? [];
  if (role === "admin") return allDags;
  const permitted = getPermissions(email);
  return allDags.filter((dag) => permitted.includes(dag.dag_id));
}

export async function getRunsForDag(dagId: string): Promise<DAGRun[]> {
  const data = await airflowRequest(
    "get",
    `/api/v2/dags/${dagId}/dagRuns?limit=50&order_by=-logical_date`,
  );
  return data.dag_runs ?? [];
}

export async function getLogsForRun(
  dagId: string,
  runId: string,
): Promise<TaskLog[]> {
  let tasksData: { task_instances?: Array<{ task_id: string; try_number: number; map_index?: number }> };
  try {
    tasksData = await airflowRequest(
      "get",
      `/api/v2/dags/${dagId}/dagRuns/${encodeURIComponent(runId)}/taskInstances`,
    );
  } catch (err) {
    console.error("[dag-service] taskInstances fetch failed", { dagId, runId }, err);
    return [];
  }

  const tasks = tasksData.task_instances ?? [];
  if (tasks.length === 0) return [];

  return Promise.all(
    tasks.map(async (task) => {
      const tryNumber = Math.max(1, task.try_number || 1);
      const mapIndex = task.map_index ?? -1;
      const logPath =
        mapIndex >= 0
          ? `/api/v2/dags/${dagId}/dagRuns/${encodeURIComponent(runId)}/taskInstances/${task.task_id}/${mapIndex}/logs/${tryNumber}`
          : `/api/v2/dags/${dagId}/dagRuns/${encodeURIComponent(runId)}/taskInstances/${task.task_id}/logs/${tryNumber}`;
      try {
        const logData = await airflowRequest("get", logPath);
        return {
          task_id: task.task_id,
          try_number: tryNumber,
          content: logData.content ?? logData,
        };
      } catch {
        return {
          task_id: task.task_id,
          try_number: tryNumber,
          content: "[Log unavailable]",
        };
      }
    }),
  );
}
