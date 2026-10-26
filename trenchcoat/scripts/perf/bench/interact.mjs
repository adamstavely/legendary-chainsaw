import { open } from "./pw.mjs";
const { browser, page } = await open();
async function traced(fn) {
  await browser.startTracing(page, { categories: ["devtools.timeline", "disabled-by-default-devtools.timeline"] });
  const ret = await fn();
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 300)))));
  const ev = JSON.parse((await browser.stopTracing()).toString()).traceEvents;
  const main = ev.find((e) => e.name === "thread_name" && e.args?.name === "CrRendererMain");
  const on = ev.filter((e) => e.pid === main.pid && e.tid === main.tid && e.ph === "X");
  const js = on.filter((e) => ["FunctionCall", "EventDispatch", "TimerFire", "FireAnimationFrame", "RunMicrotasks", "EvaluateScript"].includes(e.name));
  const inside = (e) => js.some((j) => e.ts >= j.ts && e.ts <= j.ts + j.dur);
  const L = on.filter((e) => e.name === "Layout"), forced = L.filter(inside);
  const tasks = on.filter((e) => e.name === "RunTask").map((e) => e.dur / 1000);
  return { ret, forcedLayouts: forced.length, forcedMs: +(forced.reduce((a, e) => a + e.dur, 0) / 1000).toFixed(1), layouts: L.length, layoutMs: +(L.reduce((a, e) => a + e.dur, 0) / 1000).toFixed(1), maxTaskMs: +Math.max(0, ...tasks).toFixed(1), busyMs: +tasks.reduce((a, b) => a + b, 0).toFixed(1) };
}
const OPENERS = ["profile-menu", "filter-menu", "date-range-picker", "model-picker", "combobox", "message-actions", "segmented-control", "reaction-bar", "command-menu", "integration-picker"];
for (const id of OPENERS) {
  await page.evaluate((id) => window.bench.mountDemo(id), id);
  await page.waitForTimeout(300);
  const sel = await page.evaluate(() => { const b = document.querySelector("#host [aria-haspopup], #host [aria-expanded='false'], #host [role=combobox], #host [role=tab], #host [role=radio], #host button"); if (!b) return null; b.setAttribute("data-bench", "1"); return b.outerHTML.slice(0, 80); });
  if (!sel) { console.log(id, "no opener"); continue; }
  const r = await traced(() => page.click("[data-bench]", { timeout: 2000 }).catch((e) => "click failed"));
  console.log("open", id.padEnd(20), JSON.stringify({ ...r, ret: undefined }), sel.replace(/\s+/g, " ").slice(0, 60));
}
// resize with several demos mounted
await page.evaluate(() => window.bench.unmount());
for (const id of ["chat-composer", "segmented-control", "data-table", "review-center", "agent-graph", "context-map", "screens/crm"]) {
  await page.evaluate((id) => window.bench.mountDemo(id), id);
  await page.waitForTimeout(300);
  const r = await traced(async () => { for (const w of [1000, 760, 1280, 900, 1280]) { await page.setViewportSize({ width: w, height: 900 }); await page.evaluate(() => new Promise((r) => requestAnimationFrame(r))); } });
  console.log("resize x5", id.padEnd(20), JSON.stringify({ ...r, ret: undefined }));
}
await browser.close();
