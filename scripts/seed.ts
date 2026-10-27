import { migrate } from "../src/lib/migrate";
import { readResearchFile, replacePortfolio } from "../src/lib/store";

migrate();
const doc = readResearchFile();
const result = replacePortfolio(doc, "seed");
console.log(`Seeded ${result.ideas} ideas across ${result.runs} runs.`);
