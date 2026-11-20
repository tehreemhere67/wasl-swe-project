import type { Translator } from "@/lib/i18n";

/**
 * Builds the already-translated label bundle a client form receives (NFR-LOC-01: no text is hard-coded in a
 * component, so the same form works in English and Urdu). Keys are dictionary keys.
 */
export function pickLabels(t: Translator, keys: readonly string[]): Record<string, string> {
  return Object.fromEntries(keys.map((key) => [key, t(key)]));
}
