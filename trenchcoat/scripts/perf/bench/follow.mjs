import { open } from "./pw.mjs"; import { writeFileSync } from "node:fs";
const { browser, page } = await open();
const mountWith = (id, exp, s) => page.evaluate(([id, exp, s]) => window.bench.mountWith(id, exp, eval(s)), [id, exp, s]);
const diff = (w) => `(() => { const w = Array.from({ length: ${w} }, (_, j) => "word" + (j % 97)); const s = w.map((x, j) => (j % 10 === 3 ? "changed" + j : x)); return { original: w.join(" "), suggested: s.join(" ") }; })()`;
for (const w of [5000, 500, 500, 1000, 1500, 2000]) {
  const t = Date.now(); const r = await mountWith("inline-diff", "InlineDiff", diff(w)); const wall = Date.now() - t;
  const marks = await page.evaluate(() => document.querySelectorAll("#host ins, #host del, #host mark, #host button").length);
  console.log("inline-diff", w, JSON.stringify(r), "marks", marks, "wall", wall);
}
// in-page timing of diffWords alone
const dw = await page.evaluate(() => { const D = window.bench.entry("inline-diff").diffWords; const out = {}; for (const w of [250, 500, 1000, 2000]) { const a = Array.from({ length: w }, (_, j) => "word" + (j % 97)); const b = a.map((x, j) => (j % 10 === 3 ? "changed" + j : x)); const t = performance.now(); const r = D(a.join(" "), b.join(" ")); out[w] = [+(performance.now() - t).toFixed(1), r.length]; } return out; });
console.log("diffWords ms by words", JSON.stringify(dw));
// CPU profile of fan-out-grid with 5000 tasks: mount, tick, then 3s idle
const cdp = await page.context().newCDPSession(page);
await cdp.send("Profiler.enable"); await cdp.send("Profiler.setSamplingInterval", { interval: 200 });
const fan = (n) => `({ now: 100000, startedAt: 0, workers: 16, tasks: Array.from({ length: ${n} }, (_, j) => ({ id: "t" + j, label: "Task " + j, status: ["queued","running","done","failed","retrying"][j % 5], start: j % 5 ? 1000 + j : undefined, end: j % 5 === 2 || j % 5 === 3 ? 5000 + j : undefined, cost: 0.01 })) })`;
await cdp.send("Profiler.start");
await mountWith("fan-out-grid", "FanoutGrid", fan(5000));
await page.evaluate((s) => { const p = eval(s); p.now += 1000; return window.__set(p); }, fan(5000));
await page.waitForTimeout(3000);
const { profile } = await cdp.send("Profiler.stop");
// self time by function
const self = {}; const dt = profile.timeDeltas; const byId = new Map(profile.nodes.map((n) => [n.id, n]));
profile.samples.forEach((id, i) => { const n = byId.get(id); const k = `${n.callFrame.functionName || "(anon)"} ${n.callFrame.url.split("/").pop()}:${n.callFrame.lineNumber + 1}`; self[k] = (self[k] || 0) + (dt[i] || 0) / 1000; });
console.log("fan-out-grid 5000 self-time top:"); for (const [k, v] of Object.entries(self).sort((a, b) => b[1] - a[1]).slice(0, 12)) console.log("  ", v.toFixed(0) + "ms", k);
writeFileSync("fan.cpuprofile", JSON.stringify(profile));
await browser.close();
