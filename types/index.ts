export interface DAG {
  dag_id: string;
  description: string | null;
  schedule_interval: string | null;
  next_dagrun: string | null;
  last_run?: DAGRun | null;
  is_paused: boolean;
  owners: string[];
  tags: { name: string }[];
}

export interface DAGRun {
  dag_run_id: string;
  dag_id: string;
  logical_date: string;
  start_date: string | null;
  end_date: string | null;
  state: "success" | "failed" | "running" | "queued" | "scheduled";
  run_type: string;
}

export interface TaskLog {
  task_id: string;
  try_number: number;
  content: string;
}

export interface Permission {
  email: string;
  dag_ids: string[];
}

export interface User {
  email: string;
  password: string;
  role: "admin" | "user";
  name: string;
}

export type RunState =
  | "success"
  | "failed"
  | "running"
  | "queued"
  | "scheduled";
