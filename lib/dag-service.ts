import { airflowRequest } from "./airflow";
import { getPermissions } from "./permissions";
import type { DAG, DAGRun, TaskLog } from "@/types";

export async function getDagsForUser(email: string, role: string): Promise<DAG[]> {
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

export async function getLogsForRun(dagId: string, runId: string): Promise<TaskLog[]> {
  const tasksData = await airflowRequest(
    "get",
    `/api/v2/dags/${dagId}/dagRuns/${runId}/taskInstances`,
  );
  const tasks: Array<{ task_id: string; try_number: number }> =
    tasksData.task_instances ?? [];

  return Promise.all(
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
}
