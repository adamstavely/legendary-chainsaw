import { open } from "./pw.mjs"; import { writeFileSync } from "node:fs";
const MS = +process.argv[2] || 2000; const only = process.argv.slice(3);
const { browser, page, errors } = await open();
const cdp = await page.context().newCDPSession(page);
await cdp.send("Performance.enable");
const metrics = async () => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
const ids = only.length ? only : await page.evaluate(() => window.bench.ids);
const out = [];
for (const id of ids) for (const off of [false, true]) {
  await page.evaluate(([id, off]) => window.bench.steadyStart(id, off), [id, off]);
  const m0 = await metrics();
  await page.waitForTimeout(MS);
  const m1 = await metrics();
  const r = await page.evaluate(([id, off]) => window.bench.steadyEnd(id, off), [id, off]);
  const dt = m1.Timestamp - m0.Timestamp;
  Object.assign(r, { cpuPct: (100 * (m1.TaskDuration - m0.TaskDuration)) / dt, scriptPct: (100 * (m1.ScriptDuration - m0.ScriptDuration)) / dt, layoutsPerS: (m1.LayoutCount - m0.LayoutCount) / dt, recalcPerS: (m1.RecalcStyleCount - m0.RecalcStyleCount) / dt });
  out.push(r);
}
writeFileSync(only.length ? "steady-top.json" : "steady.json", JSON.stringify({ out, errors: errors.filter((e) => !e.includes("ERR_FILE")) }, null, 1));
const f = (x) => x.toFixed(1).padStart(6);
const by = {}; for (const r of out) (by[r.id] ??= {})[r.offscreen ? "off" : "on"] = r;
const rows = Object.entries(by).sort((a, b) => b[1].on.cpuPct - a[1].on.cpuPct);
console.log("id | on: commits/s raf/s intv/s cpu% layouts/s | off: commits/s raf/s intv/s cpu% layouts/s");
for (const [id, { on, off }] of rows.slice(0, only.length ? 99 : 40)) console.log(id.padEnd(34), f(on.commitsPerS), f(on.rafPerS), f(on.intervalPerS), f(on.cpuPct), f(on.layoutsPerS), " |", f(off.commitsPerS), f(off.rafPerS), f(off.intervalPerS), f(off.cpuPct), f(off.layoutsPerS));
console.log("idle-offscreen offenders (raf or commits >1/s while off-screen):");
for (const [id, { off }] of rows) if (off.rafPerS > 1 || off.commitsPerS > 1 || off.intervalPerS > 1 || off.cpuPct > 2) console.log("  ", id, "commits", off.commitsPerS.toFixed(1), "raf", off.rafPerS.toFixed(1), "interval", off.intervalPerS.toFixed(1), "timeouts", off.timeoutPerS.toFixed(1), "cpu%", off.cpuPct.toFixed(1));
await browser.close();
