// Resolves extensionless relative imports (e.g. "./types") to "./types.ts"
// so the TypeScript source can be loaded by `node --test` without a bundler.
// Type-only imports are erased by Node's type stripping, so this is only
// needed by modules that import values without a file extension.
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (!error || error.code !== "ERR_MODULE_NOT_FOUND" || !context.parentURL) throw error;
    if (!specifier.startsWith(".")) throw error;
    for (const suffix of [".ts", "/index.ts"]) {
      const candidate = new URL(specifier + suffix, context.parentURL);
      if (existsSync(fileURLToPath(candidate))) {
        return { url: candidate.href, shortCircuit: true };
      }
    }
    throw error;
  }
}
