#!/usr/bin/env node
// Copies Donovan's face from ../agent-face/src into src/vendor/agent-face, because the package only builds what's under
// src/. Edit ../agent-face, then run this. `--check` fails when the copy has drifted.
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SOURCE = "../agent-face/src";
const COPY = "src/vendor/agent-face";
const PARTS = ["draw", "element", "engine"];

const copyTo = (dir) => {
  rmSync(dir, { recursive: true, force: true });
  for (const part of PARTS) cpSync(join(SOURCE, part), join(dir, part), { recursive: true });
};
const list = (dir) => readdirSync(dir, { recursive: true, withFileTypes: true }).filter((e) => e.isFile()).map((e) => join(e.parentPath, e.name).slice(dir.length + 1)).sort();

if (!process.argv.includes("--check")) {
  copyTo(COPY);
  console.log(`synced ${COPY}`);
} else {
  const fresh = join(mkdtempSync(join(tmpdir(), "agent-face-")), "copy");
  copyTo(fresh);
  const want = list(fresh);
  const have = existsSync(COPY) ? list(COPY) : [];
  const stale = [...new Set([...want, ...have])].filter((f) => !want.includes(f) || !have.includes(f) || !readFileSync(join(fresh, f)).equals(readFileSync(join(COPY, f))));
  rmSync(fresh, { recursive: true, force: true });
  if (stale.length) {
    console.error(`${COPY} differs from ${SOURCE} – run node scripts/sync-agent-face.mjs:\n  ${stale.join("\n  ")}`);
    process.exit(1);
  }
}
