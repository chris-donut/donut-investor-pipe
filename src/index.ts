import { getDb, closeDb } from "./storage/db";
import { listInvestors, countByStatus } from "./database/investors";
import { runMatchingAndUpdate } from "./matching/engine";

const args = process.argv.slice(2);
const command = args[0];

function printUsage(): void {
  console.log(`
Donut Investor Pipeline

Usage:
  bun run src/index.ts <command>

Commands:
  seed        Load seed investors into database
  match       Run matching engine and score all investors
  serve       Start the dashboard web server
  stats       Show pipeline statistics
  export      Export investors as JSON to stdout

Scripts:
  bun run start       Run this CLI
  bun run dev         Start dashboard with hot reload
  bun run seed        Seed the database
  bun run match       Run matching engine
  `);
}

async function main(): Promise<void> {
  switch (command) {
    case "seed": {
      await import("./database/seed");
      break;
    }
    case "match": {
      getDb();
      const results = runMatchingAndUpdate();
      console.log(`Scored ${results.length} investors.`);
      console.log(`\nTop 10:`);
      for (const r of results.slice(0, 10)) {
        console.log(`  [${r.score}] ${r.investor.name}`);
      }
      closeDb();
      break;
    }
    case "serve": {
      await import("./web/server");
      break;
    }
    case "stats": {
      getDb();
      runMatchingAndUpdate();
      const investors = listInvestors();
      const counts = countByStatus();
      console.log(`\nPipeline Statistics:`);
      console.log(`  Total investors: ${investors.length}`);
      console.log(`  Average score: ${investors.length > 0 ? Math.round(investors.reduce((s, i) => s + i.score, 0) / investors.length) : 0}`);
      console.log(`\n  By status:`);
      for (const [status, count] of Object.entries(counts)) {
        console.log(`    ${status}: ${count}`);
      }
      closeDb();
      break;
    }
    case "export": {
      getDb();
      const { exportInvestorsJson } = await import("./database/investors");
      console.log(exportInvestorsJson());
      closeDb();
      break;
    }
    default:
      printUsage();
      break;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
