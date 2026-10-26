import { open } from "./pw.mjs"; import { writeFileSync } from "node:fs";
const { browser, page, errors } = await open();
await page.evaluate(() => {
  window.__lt = []; new PerformanceObserver((l) => window.__lt.push(...l.getEntries().map((e) => e.duration))).observe({ type: "longtask", buffered: true });
  // in-page helpers
  window.H = {
    q: (s) => document.querySelector("#host " + s),
    qa: (s) => document.querySelectorAll("#host " + s).length,
    type(el, text) {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
      el.focus(); const times = [];
      for (let i = 1; i <= text.length; i++) {
        const t0 = performance.now();
        set.call(el, text.slice(0, i)); el.dispatchEvent(new Event("input", { bubbles: true }));
        const t1 = performance.now(); document.body.offsetHeight; times.push([t1 - t0, performance.now() - t1]);
      }
      return times;
    },
    click(el) { const t0 = performance.now(); el.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true })); el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })); el.focus?.(); el.dispatchEvent(new MouseEvent("pointerup", { bubbles: true })); el.dispatchEvent(new MouseEvent("mouseup", { bubbles: true })); el.click(); const t1 = performance.now(); document.body.offsetHeight; return [t1 - t0, performance.now() - t1]; },
    key(el, key) { const t0 = performance.now(); el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true })); const t1 = performance.now(); document.body.offsetHeight; return [t1 - t0, performance.now() - t1]; },
  };
});
// Trace-based forced-layout counter for an action
async function traced(fn) {
  await browser.startTracing(page, { categories: ["devtools.timeline", "disabled-by-default-devtools.timeline"] });
  const ret = await fn();
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const buf = await browser.stopTracing();
  const ev = JSON.parse(buf.toString()).traceEvents;
  const main = ev.find((e) => e.name === "thread_name" && e.args?.name === "CrRendererMain");
  const onMain = ev.filter((e) => e.pid === main.pid && e.tid === main.tid && e.ph === "X");
  const js = onMain.filter((e) => ["FunctionCall", "EventDispatch", "EvaluateScript", "TimerFire", "FireAnimationFrame", "v8.evaluateModule", "RunMicrotasks"].includes(e.name));
  const layouts = onMain.filter((e) => e.name === "Layout");
  const recalcs = onMain.filter((e) => e.name === "UpdateLayoutTree");
  const inside = (e) => js.some((j) => e.ts >= j.ts && e.ts <= j.ts + j.dur);
  const forced = layouts.filter(inside), forcedR = recalcs.filter(inside);
  const tasks = onMain.filter((e) => e.name === "RunTask").map((e) => e.dur / 1000);
  const r = { forcedLayouts: forced.length, forcedLayoutMs: +(forced.reduce((a, e) => a + e.dur, 0) / 1000).toFixed(1), forcedRecalcs: forcedR.length, layouts: layouts.length, layoutMs: +(layouts.reduce((a, e) => a + e.dur, 0) / 1000).toFixed(1), longTasks: tasks.filter((d) => d > 50).length, maxTaskMs: +Math.max(0, ...tasks).toFixed(1) };
  return { ret, trace: r };
}
const R = {};
const log = (k, v) => { R[k] = v; console.log(k, JSON.stringify(v)); };
const mountWith = (id, exp, propsSrc) => page.evaluate(([id, exp, s]) => window.bench.mountWith(id, exp, eval(s)), [id, exp, propsSrc]);

// ---------- data-table ----------
for (const n of [200, 201, 1000, 10000]) {
  const props = `({ title: "Big", columns: [{ key: "name", label: "Name", type: "title" }, { key: "stage", label: "Stage", type: "tag" }, { key: "site", label: "Site", type: "link" }, { key: "emp", label: "Employees", type: "number" }, { key: "arr", label: "ARR", type: "number" }], defaultRows: Array.from({ length: ${n} }, (_, j) => ({ id: "r" + j, name: "Company " + j, stage: ["Lead", "Customer", "Churned"][j % 3], site: "c" + j + ".com", emp: (j * 7919) % 5000, arr: (j * 104729) % 200000 })) })`;
  const { ret: m, trace: mt } = await traced(() => mountWith("data-table", "DataTable", props));
  const rowsInDom = await page.evaluate(() => H.qa("tbody tr"));
  const { ret: sort, trace: st } = await traced(() => page.evaluate(() => H.click(document.querySelectorAll("#host th[role=columnheader] button.ui-dt__th")[3])));
  const { ret: sort2 } = await traced(() => page.evaluate(() => H.click(document.querySelectorAll("#host th[role=columnheader] button.ui-dt__th")[1])));
  const scroll = await traced(async () => { for (let i = 1; i <= 10; i++) { await page.evaluate((y) => window.scrollTo(0, y), i * 1500); await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))); } return page.evaluate(() => H.qa("tbody tr")); });
  await page.evaluate(() => window.scrollTo(0, 0));
  const selAll = await traced(() => page.evaluate(() => { const c = document.querySelector("#host thead [role=checkbox], #host thead input[type=checkbox]"); return c ? H.click(c) : null; }));
  log(`data-table n=${n}`, { mount: m, mountTrace: mt, rowsInDom, sortMs: sort, sortTrace: st, sort2, scrollRowsInDom: scroll.ret, scrollTrace: scroll.trace, selectAll: selAll.ret, selectAllTrace: selAll.trace });
}
// ---------- combobox ----------
for (const n of [100, 1000, 5000]) {
  const props = `({ label: "Pick", multiple: true, options: Array.from({ length: ${n} }, (_, j) => ({ value: "v" + j, label: "Option " + j + " " + ["alpha","beta","gamma","delta"][j % 4], hint: "hint " + j })) })`;
  const m = await mountWith("combobox", "Combobox", props);
  const open = await traced(() => page.evaluate(() => H.click(H.q("[role=combobox]"))));
  const opts = await page.evaluate(() => document.querySelectorAll("[role=option]").length);
  const typ = await traced(() => page.evaluate(() => H.type(document.querySelector("#host [role=combobox]") || document.activeElement, "alpha 1")));
  const optsAfter = await page.evaluate(() => document.querySelectorAll("[role=option]").length);
  const arrow = await page.evaluate(() => { const el = document.activeElement; const t = []; for (let i = 0; i < 10; i++) t.push(H.key(el, "ArrowDown")); return t; });
  log(`combobox n=${n}`, { mount: m, open: open.ret, openTrace: open.trace, optionsInDom: opts, typing: typ.ret.map((x) => x.map((y) => +y.toFixed(1))), typeTrace: typ.trace, optionsAfterType: optsAfter, arrowDownMs: arrow.map((x) => +x[0].toFixed(2)) });
}
// ---------- command-menu ----------
for (const n of [100, 1000, 5000]) {
  const props = `({ autoFocus: true, hotkey: false, groups: [{ id: "g", label: "All", commands: Array.from({ length: ${n} }, (_, j) => ({ id: "c" + j, label: "Command " + j + " " + ["open","close","move","copy"][j % 4], hint: "h" + j, keywords: "kw" + j })) }] })`;
  const m = await mountWith("command-menu", "CommandMenu", props);
  const opts = await page.evaluate(() => document.querySelectorAll("[role=option]").length);
  const typ = await traced(() => page.evaluate(() => H.type(H.q("input"), "open 12")));
  const optsAfter = await page.evaluate(() => document.querySelectorAll("[role=option]").length);
  log(`command-menu n=${n}`, { mount: m, optionsInDom: opts, typing: typ.ret.map((x) => x.map((y) => +y.toFixed(1))), typeTrace: typ.trace, optionsAfter: optsAfter });
}
// ---------- filter-menu ----------
for (const n of [100, 1000, 5000]) {
  const props = `({ groups: [{ id: "g", label: "Owner", options: Array.from({ length: ${n} }, (_, j) => ({ id: "o" + j, label: "Owner " + j })) }, { id: "s", label: "Stage", options: [{ id: "a", label: "A" }, { id: "b", label: "B" }] }] })`;
  const m = await traced(() => mountWith("filter-menu", "FilterMenu", props));
  const cnt = await page.evaluate(() => H.qa("[role=checkbox]"));
  const btns = await page.evaluate(() => [...document.querySelectorAll("#host button")].slice(0, 6).map((b) => b.textContent.trim().slice(0, 20)));
  const clickFirst = await traced(() => page.evaluate(() => { const c = H.q("[role=checkbox]"); return c ? H.click(c) : null; }));
  log(`filter-menu n=${n}`, { mount: m.ret, mountTrace: m.trace, checkboxesInDom: cnt, buttons: btns, toggleOption: clickFirst.ret, toggleTrace: clickFirst.trace });
}
// ---------- agent-graph ----------
for (const [nn, nc] of [[20, 200], [80, 1000], [200, 5000]]) {
  const props = `({ now: 1000000, height: 480, nodes: Array.from({ length: ${nn} }, (_, j) => ({ id: "n" + j, name: "Node " + j, kind: j === 0 ? "user" : j % 3 ? "agent" : "tool", status: ["idle","working","waiting","done"][j % 4], lead: j === 1 })), calls: Array.from({ length: ${nc} }, (_, j) => ({ id: "c" + j, from: "n" + (j % ${nn}), to: "n" + ((j * 7 + 1) % ${nn}), at: 1000000 - (${nc} - j) * 50, ms: 400, status: "ok" })) })`;
  const m = await traced(() => mountWith("agent-graph", "AgentGraph", props));
  const tick = await traced(() => page.evaluate((s) => { const p = eval(s); p.now += 1000; return window.__set(p); }, props));
  const clickNode = await traced(() => page.evaluate(() => { const b = document.querySelectorAll("#host button")[3]; return b ? H.click(b) : null; }));
  log(`agent-graph nodes=${nn} calls=${nc}`, { mount: m.ret, mountTrace: m.trace, tick: tick.ret, tickTrace: tick.trace, clickNode: clickNode.ret, clickTrace: clickNode.trace });
}
// ---------- agent-queue ----------
for (const n of [100, 1000, 4000]) {
  const props = `({ now: 1000000, workers: Array.from({ length: 8 }, (_, j) => ({ id: "w" + j, name: "Worker " + j })), jobs: Array.from({ length: ${n} }, (_, j) => { const s = j < 8 ? "running" : j < ${n} / 2 ? "queued" : j % 7 ? "done" : "failed"; return { id: "j" + j, name: "Job " + j, kind: ["llm","tool","agent","human"][j % 4], status: s, enqueuedAt: 1000000 - (${n} - j) * 100, startedAt: s !== "queued" ? 1000000 - (${n} - j) * 50 : undefined, endedAt: s === "done" || s === "failed" ? 1000000 - (${n} - j) * 20 : undefined, worker: s === "running" ? "w" + j : undefined, progress: 0.4 }; }) })`;
  const m = await traced(() => mountWith("agent-queue", "AgentQueue", props));
  const tick = await traced(() => page.evaluate((s) => { const p = eval(s); p.now += 1000; return window.__set(p); }, props));
  log(`agent-queue n=${n}`, { mount: m.ret, mountTrace: m.trace, tick: tick.ret, tickTrace: tick.trace });
}
// ---------- trace-waterfall ----------
for (const n of [100, 1000, 4000]) {
  const props = `(() => { let k = 0; const mk = (d, start) => { const id = "s" + (k++); const kids = []; if (d < 3) for (let i = 0; i < Math.ceil(Math.cbrt(${n})) && k < ${n}; i++) kids.push(mk(d + 1, start + i * 10)); return { id, name: "Span " + id, kind: d === 0 ? "agent" : d === 1 ? "subagent" : d === 2 ? "llm" : "tool", status: "done", start, end: start + 500 - d * 50, children: kids.length ? kids : undefined }; }; const root = mk(0, 0); return { root, elapsed: 2000, now: 2000, startedAt: 0, __count: k }; })()`;
  const m = await traced(() => mountWith("trace-waterfall", "TraceWaterfall", props));
  const rows = await page.evaluate(() => H.qa("[role=row], [role=treeitem], li"));
  const tick = await traced(() => page.evaluate((s) => { const p = eval(s); p.elapsed += 100; p.now += 100; return window.__set(p); }, props));
  const toggle = await traced(() => page.evaluate(() => { const b = H.q("[aria-expanded]"); return b ? H.click(b) : null; }));
  log(`trace-waterfall n=${n}`, { mount: m.ret, mountTrace: m.trace, rowsInDom: rows, tick: tick.ret, tickTrace: tick.trace, toggle: toggle.ret, toggleTrace: toggle.trace });
}
// ---------- fan-out-grid ----------
for (const n of [100, 1000, 5000]) {
  const props = `({ now: 100000, startedAt: 0, workers: 16, tasks: Array.from({ length: ${n} }, (_, j) => ({ id: "t" + j, label: "Task " + j, status: ["queued","running","done","failed","retrying"][j % 5], start: j % 5 ? 1000 + j : undefined, end: j % 5 === 2 || j % 5 === 3 ? 5000 + j : undefined, cost: 0.01 })) })`;
  const m = await traced(() => mountWith("fan-out-grid", "FanoutGrid", props));
  const tick = await traced(() => page.evaluate((s) => { const p = eval(s); p.now += 1000; return window.__set(p); }, props));
  const cells = await page.evaluate(() => H.qa("*"));
  const sel = await traced(() => page.evaluate(() => { const b = H.q("[role=gridcell] button, button[data-status], [role=gridcell]"); return b ? H.click(b) : null; }));
  log(`fan-out-grid n=${n}`, { mount: m.ret, mountTrace: m.trace, tick: tick.ret, tickTrace: tick.trace, nodes: cells, select: sel.ret, selectTrace: sel.trace });
}
// ---------- inline-diff ----------
for (const words of [500, 5000, 20000]) {
  const props = `(() => { const w = Array.from({ length: ${words} }, (_, j) => "word" + (j % 97)); const s = w.map((x, j) => (j % 10 === 3 ? "changed" + j : x)); return { original: w.join(" "), suggested: s.join(" ") }; })()`;
  const m = await traced(() => mountWith("inline-diff", "InlineDiff", props));
  const marks = await page.evaluate(() => H.qa("ins, del, mark, button"));
  const accept = await traced(() => page.evaluate(() => { const b = [...document.querySelectorAll("#host button")].find((x) => /accept/i.test(x.textContent + x.getAttribute("aria-label"))); return b ? H.click(b) : null; }));
  log(`inline-diff words=${words}`, { mount: m.ret, mountTrace: m.trace, marks, accept: accept.ret, acceptTrace: accept.trace });
}
await page.evaluate(() => window.bench.unmount());
log("longtasks", await page.evaluate(() => window.__lt.length));
writeFileSync("large.json", JSON.stringify({ R, errors: errors.filter((e) => !e.includes("ERR_FILE")) }, null, 1));
console.log("errors", errors.filter((e) => !e.includes("ERR_FILE")).slice(0, 10));
await browser.close();
