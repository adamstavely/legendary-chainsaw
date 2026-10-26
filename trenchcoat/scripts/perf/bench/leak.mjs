import { open } from "./pw.mjs"; import { writeFileSync } from "node:fs";
const CYCLES = +process.argv[2] || 200;
const { browser, page, errors } = await open();
const cdp = await page.context().newCDPSession(page);
await cdp.send("Performance.enable");
const metrics = async () => { await cdp.send("HeapProfiler.collectGarbage"); await cdp.send("HeapProfiler.collectGarbage"); return Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value])); };
const ids = await page.evaluate(() => window.bench.ids);
const out = [];
for (const id of ids) {
  const n = id.includes("/") ? Math.round(CYCLES / 4) : CYCLES;
  // warm once so lazily-created singletons are not counted
  await page.evaluate((id) => window.bench.leak(id, 2), id);
  const m0 = await metrics();
  const r = await page.evaluate(([id, n]) => window.bench.leak(id, n), [id, n]);
  await page.waitForTimeout(600); // let exit timers (toasts etc.) finish
  const after2 = await page.evaluate(() => window.bench.snapshot());
  const m1 = await metrics();
  const d = (k) => after2[k] - r.before[k];
  const row = { id, n, winListeners: d("winListeners"), docListeners: d("docListeners"), ro: d("ro"), io: d("io"), mo: d("mo"), intervals: d("intervals"), timeouts: d("timeouts"), raf: d("raf"), heapKB: Math.round((m1.JSHeapUsedSize - m0.JSHeapUsedSize) / 1024), nodes: m1.Nodes - m0.Nodes, jsListeners: m1.JSEventListeners - m0.JSEventListeners, winByType: after2.winByType, docByType: after2.docByType };
  out.push(row);
  const bad = ["winListeners", "docListeners", "ro", "io", "mo", "intervals", "timeouts", "raf"].filter((k) => row[k] > 0);
  if (bad.length || row.nodes > 50 || row.heapKB > 500 || row.jsListeners > 20) console.log("SUSPECT", JSON.stringify(row));
}
writeFileSync("leak.json", JSON.stringify({ out, errors: errors.filter((e) => !e.includes("ERR_FILE")) }, null, 1));
console.log("done", out.length, "errors", errors.filter((e) => !e.includes("ERR_FILE")).slice(0, 5));
await browser.close();
