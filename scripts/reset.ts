/**
 * `pnpm db:reset` - removes the local embedded PostgreSQL data directory.
 * Only touches PGLITE_DIR (default .data/wasl-pg); it refuses to run when a
 * real DATABASE_URL is configured.
 */
import { rm } from "node:fs/promises";
import { resolve } from "node:path";

async function main() {
  if (process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is configured; refusing to delete a server database.");
    process.exit(1);
  }

  const dataDir = resolve(process.env.PGLITE_DIR || ".data/wasl-pg");
  const expectedSuffix = `${pathSep()}${resolve(process.env.PGLITE_DIR || ".data/wasl-pg").split(pathSep()).slice(-1)[0]}`;
  if (!dataDir.includes(".data") && !dataDir.includes(expectedSuffix)) {
    console.error(`Refusing to delete unexpected path: ${dataDir}`);
    process.exit(1);
  }

  console.log(`Removing local database at ${dataDir}`);
  await rm(dataDir, { recursive: true, force: true });
  console.log("Done. Run `pnpm db:seed` to recreate it.");
}

function pathSep() {
  return process.platform === "win32" ? "\\" : "/";
}

await main();
