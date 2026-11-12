/**
 * Runs the whole Wasl unit-test suite in a single process.
 *
 *   pnpm test            (same as: node tests/run-all.ts)
 *
 * Every `*.test.ts` file under `tests/` is discovered automatically, so a team
 * member only has to create `tests/member-N/unit/my-module.test.ts` and it runs.
 *
 * Why not `node --test tests/`? In some sandboxed environments the per-file test
 * runner cannot spawn child processes (EPERM). Importing every test file in this
 * single process runs exactly the same tests without spawning anything.
 *
 * Only framework-free modules are covered here. Modules that import "server-only"
 * (database, sessions, guards, messaging, notifications, audit) need the Next.js
 * runtime; they are covered by `scripts/verify-api-lifecycle.mjs` and the manual
 * cases in `tests/member-1/MANUAL-TEST-CASES.md`.
 */

import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const testsRoot = fileURLToPath(new URL(".", import.meta.url));

async function findTests(directory: string): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...(await findTests(fullPath)));
    } else if (entry.name.endsWith(".test.ts")) {
      found.push(fullPath);
    }
  }
  return found;
}

const files = (await findTests(testsRoot)).sort();

console.log(`Wasl test suite — loading ${files.length} test files from tests/`);
for (const file of files) {
  console.log(`  • ${file.slice(testsRoot.length).replaceAll("\\", "/")}`);
  await import(pathToFileURL(file).href);
}
