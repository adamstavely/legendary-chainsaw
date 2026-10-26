// Full-page screenshots of docs pages, cut into readable slices (remediation Part 4).
//   node scripts/docs-shot.mjs <port> <slug|id>… → .visual/docs/<slug>-<n>.png
// Needs a gallery dev server on <port> (npx vite --port <port> --strictPort). Prints console errors per page.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { PNG } from "pngjs";

const [port, ...ids] = process.argv.slice(2);
const OUT = ".visual/docs";
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
for (const id of ids) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && !/WebSocket|Failed to load resource/.test(m.text()) && errors.push(m.text().slice(0, 200)));
  await page.goto(`http://localhost:${port}/#/${id}`);
  await page.waitForSelector("#docs-accessibility", { timeout: 20000 });
  await page.waitForTimeout(1500);
  const full = PNG.sync.read(await page.screenshot({ fullPage: true }));
  const name = id.replace("/", "-");
  let n = 0;
  for (let y = 0; y < full.height; y += 1800, n++) {
    const h = Math.min(1800, full.height - y);
    const part = new PNG({ width: full.width, height: h });
    PNG.bitblt(full, part, 0, y, full.width, h, 0, 0);
    await import("node:fs").then((fs) => fs.writeFileSync(`${OUT}/${name}-${n}.png`, PNG.sync.write(part)));
  }
  console.log(`${id}: ${n} slices in ${OUT}/${name}-*.png · ${errors.length ? `errors:\n  ${errors.join("\n  ")}` : "no errors"}`);
  await page.close();
}
await browser.close();
