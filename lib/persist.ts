import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "sessions.json");

export function readSessions(): Record<string, any> {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function writeSessions(data: Record<string, any>) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
