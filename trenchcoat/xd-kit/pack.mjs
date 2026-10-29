// Packs the plugin – manifest, code, icons and the extracted kit – into xd-kit/dist/trenchcoat-ui-kit.xdx, which XD
// installs on a double-click. Run xd-kit/extract.mjs first.
//   node xd-kit/pack.mjs
import { chromium } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PLUGIN = join(HERE, "plugin");
const DIST = join(HERE, "dist");
if (!existsSync(join(PLUGIN, "kit", "index.json"))) throw new Error("no kit yet – run node xd-kit/extract.mjs first");

// The icons: the gallery's mark, a half-filled circle, drawn at 1× and 2×
const images = join(PLUGIN, "images");
mkdirSync(images, { recursive: true });
const browser = await chromium.launch();
for (const size of [24, 48]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}</style><svg width="${size}" height="${size}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="#fff" stroke="#18181b" stroke-width="2"/><path d="M12 3a9 9 0 0 1 0 18z" fill="#18181b"/></svg>`,
  );
  writeFileSync(join(images, `icon@${size === 24 ? 1 : 2}x.png`), await page.screenshot({ omitBackground: true }));
  await page.close();
}
await browser.close();

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
const out = join(DIST, "trenchcoat-ui-kit.xdx");
// An .xdx is a zip of the plugin folder's contents, manifest.json at its root
execFileSync("zip", ["-r", "-q", "-9", out, "manifest.json", "main.js", "builder.js", "images", "kit"], { cwd: PLUGIN });
console.log(`xd-kit: ${out} (${(statSync(out).size / 1024 / 1024).toFixed(1)} MB)`);
