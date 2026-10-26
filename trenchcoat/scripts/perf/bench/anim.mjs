import { open } from "./pw.mjs";
const { browser, page } = await open();
const cdp = await page.context().newCDPSession(page); await cdp.send("Performance.enable");
const M = async () => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
const fan = (n) => `({ now: 100000, startedAt: 0, workers: 16, tasks: Array.from({ length: ${n} }, (_, j) => ({ id: "t" + j, label: "Task " + j, status: ["queued","running","done","failed","retrying"][j % 5], start: j % 5 ? 1000 + j : undefined, end: j % 5 === 2 || j % 5 === 3 ? 5000 + j : undefined, cost: 0.01 })) })`;
const tw = (n) => `(() => { let k = 0; const mk = (d, start) => { const id = "s" + (k++); const kids = []; if (d < 3) for (let i = 0; i < Math.ceil(Math.cbrt(${n})) && k < ${n}; i++) kids.push(mk(d + 1, start + i * 10)); return { id, name: "Span " + id, kind: d === 0 ? "agent" : d === 1 ? "subagent" : d === 2 ? "llm" : "tool", status: d === 3 && k % 3 ? "running" : "done", start, end: d === 3 && k % 3 ? undefined : start + 500 - d * 50, children: kids.length ? kids : undefined }; }; return { root: mk(0, 0), startedAt: Date.now() - 2000 }; })()`;
for (const [id, exp, mk, sizes] of [["fan-out-grid", "FanoutGrid", fan, [100, 1000, 5000]], ["trace-waterfall", "TraceWaterfall", tw, [100, 1000]]]) for (const n of sizes) for (const off of [false, true]) {
  await page.evaluate((off) => { document.getElementById("spacer").style.height = off ? "4000px" : "0px"; window.scrollTo(0, 0); }, off);
  await page.evaluate(([id, exp, s]) => window.bench.mountWith(id, exp, eval(s)), [id, exp, mk(n)]);
  await page.waitForTimeout(500);
  const a = await M(); await page.waitForTimeout(3000); const b = await M();
  const anims = await page.evaluate(() => { const A = document.getAnimations(); return { total: A.length, running: A.filter((x) => x.playState === "running").length, props: [...new Set(A.slice(0, 200).flatMap((x) => x.effect?.getKeyframes?.().flatMap((k) => Object.keys(k).filter((p) => !["offset", "easing", "composite", "computedOffset"].includes(p))) ?? []))] }; });
  const dt = b.Timestamp - a.Timestamp;
  console.log(id, n, off ? "off" : "on ", "cpu%", (100 * (b.TaskDuration - a.TaskDuration) / dt).toFixed(1), "script%", (100 * (b.ScriptDuration - a.ScriptDuration) / dt).toFixed(1), "layout/s", ((b.LayoutCount - a.LayoutCount) / dt).toFixed(1), "layoutMs/s", (1000 * (b.LayoutDuration - a.LayoutDuration) / dt).toFixed(0), "recalc/s", ((b.RecalcStyleCount - a.RecalcStyleCount) / dt).toFixed(1), "recalcMs/s", (1000 * (b.RecalcStyleDuration - a.RecalcStyleDuration) / dt).toFixed(0), JSON.stringify(anims));
  await page.evaluate(() => window.bench.unmount());
}
await browser.close();
