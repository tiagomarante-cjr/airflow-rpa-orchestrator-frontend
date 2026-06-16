import fs from "fs";
import path from "path";

const USERS_FILE = path.join(process.cwd(), "data", "users.json");

type UserRecord = {
  email: string;
  password: string;
  role: string;
  name: string;
  image?: string;
};

function readUsers(): UserRecord[] {
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8")) as UserRecord[];
}

function writeUsers(users: UserRecord[]): void {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

export function getUser(email: string): UserRecord | undefined {
  return readUsers().find((u) => u.email === email);
}

export function updateUserName(email: string, name: string): void {
  const users = readUsers();
  const idx = users.findIndex((u) => u.email === email);
  if (idx === -1) throw new Error("User not found");
  users[idx].name = name;
  writeUsers(users);
}

export function updateUserImage(email: string, image: string): void {
  const users = readUsers();
  const idx = users.findIndex((u) => u.email === email);
  if (idx === -1) throw new Error("User not found");
  users[idx].image = image;
  writeUsers(users);
}
