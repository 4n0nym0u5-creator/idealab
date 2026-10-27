import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

type Db = BetterSQLite3Database<typeof schema>;

const globalForDb = globalThis as unknown as {
  sqlite?: Database.Database;
  db?: Db;
  dbFile?: string;
};

export function dbPath(): string {
  return process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "idealab.db");
}

export function backupDir(): string {
  return process.env.BACKUP_DIR ?? path.join(process.cwd(), "data", "backups");
}

function open(): { sqlite: Database.Database; db: Db } {
  const file = dbPath();
  if (globalForDb.sqlite && globalForDb.db && globalForDb.dbFile === file) {
    return { sqlite: globalForDb.sqlite, db: globalForDb.db };
  }
  if (globalForDb.sqlite) globalForDb.sqlite.close();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  globalForDb.sqlite = sqlite;
  globalForDb.db = db;
  globalForDb.dbFile = file;
  return { sqlite, db };
}

export function getDb(): Db {
  return open().db;
}

export function getSqlite(): Database.Database {
  return open().sqlite;
}

export function closeDb(): void {
  if (globalForDb.sqlite) globalForDb.sqlite.close();
  globalForDb.sqlite = undefined;
  globalForDb.db = undefined;
  globalForDb.dbFile = undefined;
}

export function isDatabaseReady(): boolean {
  const file = dbPath();
  if (!fs.existsSync(file)) return false;
  const sqlite = new Database(file, { readonly: true, fileMustExist: true });
  try {
    const row = sqlite.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table' AND name = 'settings'").get() as { n: number };
    if (!row?.n) return false;
    const settings = sqlite.prepare("SELECT COUNT(*) AS n FROM settings").get() as { n: number };
    return settings.n > 0;
  } catch {
    return false;
  } finally {
    sqlite.close();
  }
}
