/** `pnpm db:migrate` - applies every pending migration. */
import { connect, migrate } from "./connect.ts";

async function main() {
  const db = await connect();
  try {
    const applied = await migrate(db);
    if (applied.length === 0) {
      console.log("Database is up to date. No migrations applied.");
    } else {
      console.log(`Applied ${applied.length} migration(s):`);
      for (const id of applied) console.log(`  - ${id}`);
    }
  } finally {
    await db.close();
  }
}

await main();
