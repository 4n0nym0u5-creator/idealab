import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { execSql, getDb } from "./db";
import { migrations } from "./schema";

export function splitSql(input: string): string[] {
  return input
    .split(/;\s*(?:\r?\n|$)/)
    .map((part) => part.replace(/--.*$/gm, "").trim())
    .filter(Boolean);
}

export async function migrate(): Promise<void> {
  await execSql(`CREATE TABLE IF NOT EXISTS _migrations (
    id TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`);
  const db = await getDb();
  const applied = await db.select().from(migrations).where(eq(migrations.id, "0001_init"));
  if (applied.length) return;
  const sqlPath = path.join(process.cwd(), "drizzle", "0001_init.sql");
  const sqlText = fs.readFileSync(sqlPath, "utf8");
  for (const statement of splitSql(sqlText)) {
    await execSql(statement);
  }
  await db.insert(migrations).values({ id: "0001_init", appliedAt: new Date().toISOString() }).onConflictDoNothing();
}
