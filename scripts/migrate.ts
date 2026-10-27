import { closeDb } from "../src/lib/db";
import { migrate } from "../src/lib/migrate";

async function main() {
  await migrate();
  console.log("Migrations applied.");
  await closeDb();
}

main().catch(async (error) => {
  console.error(error);
  await closeDb().catch(() => undefined);
  process.exit(1);
});
