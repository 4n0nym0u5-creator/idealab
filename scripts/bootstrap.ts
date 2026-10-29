import { closeDb, databaseUrl } from "../src/lib/db";
import { FILES } from "../src/lib/migrate";
import { ensureDatabase } from "../src/lib/store";

async function main() {
  if (!databaseUrl()) {
    console.log("No DATABASE_URL or POSTGRES_URL. Skipping remote migrate and seed.");
    return;
  }
  const result = await ensureDatabase();
  console.log(`Applied migrations through ${FILES[FILES.length - 1]}.`);
  console.log(result.skipped ? `Postgres already has ${result.ideas} ideas.` : `Seeded Postgres with ${result.ideas} ideas across ${result.runs} runs.`);
  await closeDb();
}

main().catch(async (error) => {
  console.error(error);
  await closeDb().catch(() => undefined);
  process.exit(1);
});
