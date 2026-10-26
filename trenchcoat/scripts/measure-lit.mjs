// Large-data timings of each React component and its Lit port, side by side (lit-port-plan.md acceptance check 7).
//   node scripts/measure-lit.mjs     Chromium, 5 runs, the median of each measurement
import { chromium } from "@playwright/test";
import { createServer } from "vite";

const server = await createServer({ configFile: "vite.config.ts", server: { port: 5321, strictPort: true }, logLevel: "error" });
await server.listen();
const browser = await chromium.launch();
const runs = [];
for (let i = 0; i < 5; i++) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto("http://localhost:5321/measure.html");
  await page.waitForFunction(() => "__run" in window);
  runs.push(await page.evaluate(() => window.__run()));
  await page.close();
}
await browser.close();
await server.close();

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const keys = Object.keys(runs[0]);
const pairs = [...new Set(keys.map((k) => k.replace(/^(react|lit) /, "")))];
console.log("| Measurement | React | Lit | Lit vs React |\n|---|---|---|---|");
for (const p of pairs) {
  const r = median(runs.map((x) => x[`react ${p}`]));
  const l = median(runs.map((x) => x[`lit ${p}`]));
  console.log(`| ${p} | ${r.toFixed(1)} ms | ${l.toFixed(1)} ms | ${l <= r ? "faster or equal" : `+${(((l - r) / r) * 100).toFixed(0)} %`} |`);
}
