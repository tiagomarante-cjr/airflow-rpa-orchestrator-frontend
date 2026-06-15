import fs from "fs";
import path from "path";

const PERMISSIONS_FILE = path.join(process.cwd(), "data", "permissions.json");

type PermissionsMap = Record<string, string[]>;

function readPermissions(): PermissionsMap {
  const raw = fs.readFileSync(PERMISSIONS_FILE, "utf-8");
  return JSON.parse(raw) as PermissionsMap;
}

function writePermissions(map: PermissionsMap): void {
  fs.writeFileSync(PERMISSIONS_FILE, JSON.stringify(map, null, 2), "utf-8");
}

export function getPermissions(email: string): string[] {
  const map = readPermissions();
  return map[email] ?? [];
}

export function setPermissions(email: string, dagIds: string[]): void {
  const map = readPermissions();
  map[email] = dagIds;
  writePermissions(map);
}

export function getAllPermissions(): PermissionsMap {
  return readPermissions();
}
