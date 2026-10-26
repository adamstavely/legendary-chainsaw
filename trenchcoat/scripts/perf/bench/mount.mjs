import { open } from "./pw.mjs"; import { writeFileSync } from "node:fs";
const { browser, page, errors } = await open();
const ids = await page.evaluate(() => window.bench.ids);
const out = [];
for (const id of ids) {
  const first = await page.evaluate((id) => window.bench.mountDemo(id), id);
  const second = await page.evaluate((id) => window.bench.mountDemo(id), id);
  const third = await page.evaluate((id) => window.bench.mountDemo(id), id);
  out.push({ id, first, second, third });
}
await page.evaluate(() => window.bench.unmount());
writeFileSync("mount.json", JSON.stringify({ out, errors }, null, 1));
const k = (x) => x.toFixed(1);
out.sort((a, b) => b.first.toFrame - a.first.toFrame);
for (const r of out.slice(0, 25)) console.log(r.id.padEnd(36), "first", k(r.first.render), k(r.first.layout), k(r.first.toFrame), "| warm", k(r.third.render), k(r.third.layout), k(r.third.toFrame), "nodes", r.first.nodes);
const med = (a) => { const s = a.sort((x, y) => x - y); return s[s.length >> 1]; };
console.log("median first toFrame", k(med(out.map((r) => r.first.toFrame))), "median warm", k(med(out.map((r) => r.third.toFrame))), "median first render", k(med(out.map((r) => r.first.render))), "warm render", k(med(out.map((r) => r.third.render))));
console.log("style elements after all:", out.at(-1).third.styles, "errors", errors.length, errors.slice(0, 8));
await browser.close();
