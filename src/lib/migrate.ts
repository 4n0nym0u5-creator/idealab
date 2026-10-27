import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { execSql, getDb } from "./db";
import { migrations } from "./schema";

const FILES = ["0001_init.sql", "0002_rubric_v2.sql", "0003_schema_v3.sql", "0004_schema_v4.sql", "0005_schema_v5.sql"];

export function splitSql(input: string): string[] {
  return input
    .split(/;\s*(?:\r?\n|$)/)
    .map((part) => part.replace(/--.*$/gm, "").trim())
    .filter(Boolean);
}

export async function migrationApplied(id: string): Promise<boolean> {
  const db = await getDb();
  const applied = await db.select().from(migrations).where(eq(migrations.id, id));
  return applied.length > 0;
}

export async function recordMigration(id: string): Promise<void> {
  const db = await getDb();
  await db.insert(migrations).values({ id, appliedAt: new Date().toISOString() }).onConflictDoNothing();
}

export async function migrate(): Promise<void> {
  await execSql(`CREATE TABLE IF NOT EXISTS _migrations (
    id TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`);
  for (const file of FILES) {
    const id = file.replace(/\.sql$/, "");
    if (await migrationApplied(id)) continue;
    const sqlText = fs.readFileSync(path.join(process.cwd(), "drizzle", file), "utf8");
    for (const statement of splitSql(sqlText)) {
      await execSql(statement);
    }
    await recordMigration(id);
  }
}
