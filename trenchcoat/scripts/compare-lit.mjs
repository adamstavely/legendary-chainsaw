// Screenshot parity between each React component and its Lit port (lit-port-plan.md acceptance check 4).
//   node scripts/compare-lit.mjs     writes .visual/lit-compare/<case>-<look>-<theme>-{react,lit,diff}.png and a table
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
const server = await createServer({ configFile: "vite.config.ts", server: { port: 5320, strictPort: true }, logLevel: "error" });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 900 }, reducedMotion: "reduce", deviceScaleFactor: 1 });
await page.goto("http://localhost:5320/compare.html");
await page.waitForSelector("tc-data-table[data-ui=dt] table");
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
const worst = Math.max(...rows.map((r) => r.pct));
console.log(worst < 1 ? "parity ok: every case under 1 %" : `parity: worst ${worst.toFixed(2)} % – see ${OUT}`);
