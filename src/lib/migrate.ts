import fs from "fs";
import path from "path";
import { getSqlite } from "./db";

export function migrate(): void {
  const sqlite = getSqlite();
  sqlite.exec(`CREATE TABLE IF NOT EXISTS _migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`);
  const applied = sqlite.prepare("SELECT id FROM _migrations WHERE id = ?").get("0001_init");
  if (applied) return;
  const sqlPath = path.join(process.cwd(), "drizzle", "0001_init.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  sqlite.exec(sql);
  sqlite.prepare("INSERT INTO _migrations (id, applied_at) VALUES (?, ?)").run("0001_init", new Date().toISOString());
}
