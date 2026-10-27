import path from "path";
import { drizzle as drizzlePostgres, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type AppDatabase = PostgresJsDatabase<typeof schema>;

type Handle = {
  db: AppDatabase;
  exec: (statement: string) => Promise<void>;
  close: () => Promise<void>;
};

const globalForDb = globalThis as unknown as { idealab?: Handle; idealabKey?: string };

export function databaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
  const trimmed = url?.trim();
  return trimmed ? trimmed : undefined;
}

export function usesRemoteDatabase(): boolean {
  if (process.env.IDEALAB_DRIVER === "pglite") return false;
  if (process.env.IDEALAB_DRIVER === "postgres") return true;
  return Boolean(databaseUrl());
}

export function backupDir(): string {
  return process.env.BACKUP_DIR ?? path.join(process.cwd(), "data", "backups");
}

function pgliteDir(): string | undefined {
  if (process.env.PGLITE_PATH === "memory") return undefined;
  return process.env.PGLITE_PATH || path.join(process.cwd(), "data", "pglite");
}

function connectionKey(): string {
  if (!usesRemoteDatabase()) return `pglite:${pgliteDir() ?? "memory"}`;
  return `postgres:${databaseUrl()}`;
}

function postgresOptions(url: string): postgres.Options<Record<string, never>> {
  const local = /@(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/.test(url) || url.includes("sslmode=disable");
  return {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 30,
    prepare: false,
    ssl: local ? false : "require",
  };
}

async function openPostgres(url: string): Promise<Handle> {
  const client = postgres(url, postgresOptions(url));
  const db = drizzlePostgres(client, { schema });
  return {
    db,
    exec: async (statement) => {
      await client.unsafe(statement);
    },
    close: async () => {
      await client.end({ timeout: 5 });
    },
  };
}

async function openPglite(): Promise<Handle> {
  const [{ PGlite }, { drizzle }] = await Promise.all([
    import("@electric-sql/pglite"),
    import("drizzle-orm/pglite"),
  ]);
  const dataDir = pgliteDir();
  const client = dataDir ? new PGlite(dataDir) : new PGlite();
  await client.waitReady;
  const db = drizzle(client, { schema }) as unknown as AppDatabase;
  return {
    db,
    exec: async (statement) => {
      await client.exec(statement);
    },
    close: async () => {
      await client.close();
    },
  };
}

async function open(): Promise<Handle> {
  const key = connectionKey();
  if (globalForDb.idealab && globalForDb.idealabKey === key) return globalForDb.idealab;
  if (globalForDb.idealab) await globalForDb.idealab.close();
  if (process.env.VERCEL && !databaseUrl() && process.env.IDEALAB_DRIVER !== "pglite") {
    throw new Error("Set DATABASE_URL or POSTGRES_URL. Vercel has no persistent disk, so IdeaLab stores the portfolio in Postgres.");
  }
  const handle = usesRemoteDatabase() ? await openPostgres(databaseUrl()!) : await openPglite();
  globalForDb.idealab = handle;
  globalForDb.idealabKey = key;
  return handle;
}

export async function getDb(): Promise<AppDatabase> {
  return (await open()).db;
}

export async function execSql(statement: string): Promise<void> {
  await (await open()).exec(statement);
}

export async function closeDb(): Promise<void> {
  if (!globalForDb.idealab) return;
  await globalForDb.idealab.close();
  globalForDb.idealab = undefined;
  globalForDb.idealabKey = undefined;
}
