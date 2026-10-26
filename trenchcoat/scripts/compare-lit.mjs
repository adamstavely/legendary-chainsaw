// Screenshot parity between each React component and its Lit port (lit-port-plan.md acceptance check 4).
//   node scripts/compare-lit.mjs                    the pilot's cases; writes .visual/lit-compare/<case>-<look>-<theme>-{react,lit,diff}.png and a table
//   node scripts/compare-lit.mjs <slug> [<slug>…]   each component's gallery demo, React vs the wrappers
// Same props, both looks, both themes, reduced motion. The diff counts pixels pixelmatch flags at its default
// threshold; under 1 % is a match (antialiasing and subpixel text differ between any two renders).
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const OUT = ".visual/lit-compare";
mkdirSync(OUT, { recursive: true });
const server = await createServer({ configFile: "vite.config.ts", server: { port: 5320 + Math.floor(Math.random() * 400), strictPort: false }, logLevel: "error" });
await server.listen();
const base = server.resolvedUrls.local[0].replace(/\/$/, "");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 900 }, reducedMotion: "reduce", deviceScaleFactor: 1 });
const slugs = process.argv.slice(2);
if (slugs.length) {
  // Demos start on a fixed clock, so both sides show the same moment
  await page.clock.install({ time: new Date("2026-10-24T12:00:00Z") });
  await page.goto(`${base}/compare.html?demo=${slugs.join(",")}`);
  await page.waitForSelector("body[data-ready=true]");
  await page.clock.runFor(1500);
  await page.clock.pauseAt(new Date("2026-10-24T12:00:05Z"));
} else {
  await page.goto(`${base}/compare.html`);
  await page.waitForSelector("tc-data-table[data-ui=dt] table");
}
await page.waitForTimeout(800);

const rows = [];
for (const pair of await page.$$(".pair")) {
  const id = await pair.getAttribute("id");
  const shots = {};
  for (const side of ["react", "lit"]) {
    const el = await pair.$(`[data-side=${side}]`);
    shots[side] = PNG.sync.read(await el.screenshot({ path: join(OUT, `${id}-${side}.png`), animations: "disabled" }));
  }
  const w = Math.max(shots.react.width, shots.lit.width);
  const h = Math.max(shots.react.height, shots.lit.height);
  const pad = (img) => {
    const out = new PNG({ width: w, height: h });
    PNG.bitblt(img, out, 0, 0, img.width, img.height, 0, 0);
    return out;
  };
  const a = pad(shots.react);
  const b = pad(shots.lit);
  const diff = new PNG({ width: w, height: h });
  const n = pixelmatch(a.data, b.data, diff.data, w, h, { threshold: 0.1 });
  writeFileSync(join(OUT, `${id}-diff.png`), PNG.sync.write(diff));
  const sameSize = shots.react.width === shots.lit.width && shots.react.height === shots.lit.height;
  rows.push({ id, pct: (100 * n) / (w * h), size: `${shots.react.width}×${shots.react.height} / ${shots.lit.width}×${shots.lit.height}`, sameSize });
}
await browser.close();
await server.close();

console.log("| Case | Changed pixels | Size (React / Lit) |\n|---|---|---|");
for (const r of rows) console.log(`| ${r.id} | ${r.pct.toFixed(2)} % | ${r.size}${r.sameSize ? "" : " ⚠"} |`);
if (!rows.length) {
  console.error("parity: nothing rendered – is the slug right, and does trenchcoat/react export the demo's component?");
  process.exit(1);
}
const worst = Math.max(...rows.map((r) => r.pct));
console.log(worst < 1 ? "parity ok: every case under 1 %" : `parity: worst ${worst.toFixed(2)} % – see ${OUT}`);
