import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Smoke-test failures we know about, keyed "<entry id>:<standard|clean>".
 * These run as `test.fails`: when a fix lands the test starts passing, the suite fails,
 * and the entry must be deleted here. Never add to this list to get CI green – fix the bug.
 */
export const KNOWN_ISSUES: Record<string, string> = {};

// Tests run from the repo root (vitest `root`); import.meta.url is not a file: URL under jsdom
export const BUDGET_FILE = join(process.cwd(), "tests/render-budgets.json");

/** React commits each case made in 5 simulated seconds when the baseline was recorded */
export function readBudgets(): Record<string, number> {
  return existsSync(BUDGET_FILE) ? JSON.parse(readFileSync(BUDGET_FILE, "utf8")) : {};
}
