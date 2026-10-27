import { closeDb } from "../src/lib/db";
import { migrate } from "../src/lib/migrate";
import { readResearchFile, replacePortfolio, seedIfEmpty } from "../src/lib/store";

async function main() {
  const force = process.argv.includes("--force");
  await migrate();
  if (force) {
    const result = await replacePortfolio(readResearchFile(), "seed");
    console.log(`Replaced the database with ${result.ideas} ideas across ${result.runs} runs.`);
  } else {
    const result = await seedIfEmpty("seed");
    console.log(result.skipped ? `Database already has ${result.ideas} ideas. Nothing replaced.` : `Seeded ${result.ideas} ideas across ${result.runs} runs.`);
  }
  await closeDb();
}

main().catch(async (error) => {
  console.error(error);
  await closeDb().catch(() => undefined);
  process.exit(1);
});
