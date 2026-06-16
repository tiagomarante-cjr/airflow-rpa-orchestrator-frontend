import fs from "fs";
import path from "path";
import type { DagAction } from "@/types";

const PERMISSIONS_FILE = path.join(process.cwd(), "data", "permissions.json");

// { [email]: { [dagId | "*"]: DagAction[] } }
// The "*" key acts as a wildcard granting those actions on every DAG.
type PermissionsMap = Record<string, Record<string, DagAction[]>>;

function readPermissions(): PermissionsMap {
  const raw = fs.readFileSync(PERMISSIONS_FILE, "utf-8");
  return JSON.parse(raw) as PermissionsMap;
}

function writePermissions(map: PermissionsMap): void {
  fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(map, null, 2), "utf-8");
}

export function getPermissions(email: string): Record<string, DagAction[]> {
  const map = readPermissions();
  return map[email] ?? {};
}

export function getDagActions(email: string, dagId: string): DagAction[] {
  const perms = getPermissions(email);
  if (perms["*"]) return perms["*"];
  return perms[dagId] ?? [];
}

export function hasAction(
  email: string,
  dagId: string,
  action: DagAction,
): boolean {
  return getDagActions(email, dagId).includes(action);
}

export function setPermissions(
  email: string,
  dags: Record<string, DagAction[]>,
): void {
  const map = readPermissions();
  map[email] = dags;
  writePermissions(map);
}

export function getAllPermissions(): PermissionsMap {
  return readPermissions();
}
