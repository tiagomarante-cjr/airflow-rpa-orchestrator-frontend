import type { DAG, DAGRun, TaskLog } from "@/types";
import { airflowRequest } from "./airflow";
import { getPermissions } from "./permissions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDag(d: any): DAG {
  return {
    dag_id: d.dag_id,
    description: d.description ?? null,
    // Airflow 3 renamed schedule_interval → timetable_description
    schedule_interval: d.timetable_description ?? d.schedule_interval ?? null,
    // Airflow 3 renamed next_dagrun → next_dagrun_data_interval_start
    next_dagrun: d.next_dagrun_data_interval_start ?? d.next_dagrun ?? null,
    is_paused: d.is_paused,
    owners: d.owners ?? [],
    tags: d.tags ?? [],
    last_run: null,
  };
}

async function fetchLastRun(dagId: string): Promise<DAGRun | null> {
  try {
    const data = await airflowRequest(
      "get",
      `/api/v2/dags/${dagId}/dagRuns?limit=1&order_by=-start_date`,
    );
    return data.dag_runs?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function getDagsForUser(
  email: string,
  role: string,
): Promise<DAG[]> {
  const data = await airflowRequest("get", "/api/v2/dags?limit=100");
  const raw: DAG[] = data.dags ?? [];

  const permitted = role === "admin" ? null : getPermissions(email);
  const filtered = permitted
    ? raw.filter((d: { dag_id: string }) => permitted.includes(d.dag_id))
    : raw;

  return Promise.all(
    filtered.map(async (d) => {
      const dag = mapDag(d);
      dag.last_run = await fetchLastRun(dag.dag_id);
      return dag;
    }),
  );
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
  // FastAPI does not decode %2B in path segments — keep + literal
  const encodedRunId = encodeURIComponent(runId).replace(/%2B/gi, "+");

  let tasksData: { task_instances?: Array<{ task_id: string; try_number: number; map_index?: number }> };
  try {
    tasksData = await airflowRequest(
      "get",
      `/api/v2/dags/${dagId}/dagRuns/${encodedRunId}/taskInstances`,
    );
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    console.error(`[dag-service] taskInstances fetch failed — HTTP ${status ?? "network error"} for ${dagId}/${runId}`);
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
          ? `/api/v2/dags/${dagId}/dagRuns/${encodedRunId}/taskInstances/${task.task_id}/${mapIndex}/logs/${tryNumber}`
          : `/api/v2/dags/${dagId}/dagRuns/${encodedRunId}/taskInstances/${task.task_id}/logs/${tryNumber}`;
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
