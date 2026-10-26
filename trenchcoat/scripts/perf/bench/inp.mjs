// Interaction latency (remediation step 2.8): combobox open with 5,000 options, command-menu typing over 5,000
// commands, data-table sort over 10,000 rows – real input through Playwright, timed from the event's timestamp to
// the frame after it was handled (what INP measures, without the Event Timing API, which WebKit lacks).
//   BENCH_BROWSER=firefox node scripts/perf/bench/inp.mjs     (Chromium, Firefox or WebKit; BENCH_THROTTLE=4 too)
import { engine, open } from "./pw.mjs";
const { browser, page, errors } = await open();
await page.evaluate(() => {
  window.__inp = [];
  for (const type of ["pointerdown", "keydown"])
    document.addEventListener(type, (e) => {
      const start = e.timeStamp;
      requestAnimationFrame(() => setTimeout(() => window.__inp.push(performance.now() - start)));
    }, { capture: true });
});
const mountWith = (id, exp, src) => page.evaluate(([id, exp, s]) => window.bench.mountWith(id, exp, eval(s)), [id, exp, src]);
const take = async () => {
  await page.waitForTimeout(250);
  return page.evaluate(() => window.__inp.splice(0));
};
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const worst = (xs) => Math.max(...xs);
const out = {};

await mountWith("combobox", "Combobox", `({ label: "Pick", multiple: true, options: Array.from({ length: 5000 }, (_, j) => ({ value: "v" + j, label: "Option " + j })) })`);
await page.waitForTimeout(300);
const opens = [];
for (let i = 0; i < 5; i++) {
  await take();
  await page.click("#host [role=combobox]");
  opens.push(...(await take()));
  await page.keyboard.press("Escape");
  await take();
}
out["combobox 5k: open (click)"] = opens.filter((_, i) => i % 1 === 0);

await mountWith("command-menu", "CommandMenu", `({ autoFocus: true, hotkey: false, groups: [{ id: "g", label: "All", commands: Array.from({ length: 5000 }, (_, j) => ({ id: "c" + j, label: "Command " + j + " " + ["open","close","move","copy"][j % 4] })) }] })`);
await page.waitForTimeout(300);
await take();
await page.click("#host input");
await take();
await page.keyboard.type("open 12", { delay: 60 });
out["command-menu 5k: typing (per key)"] = await take();

await mountWith("data-table", "DataTable", `({ title: "Big", columns: [{ key: "name", label: "Name", type: "title" }, { key: "emp", label: "Employees", type: "number" }], defaultRows: Array.from({ length: 10000 }, (_, j) => ({ id: "r" + j, name: "Company " + j, emp: (j * 7919) % 5000 })) })`);
await page.waitForTimeout(500);
const sorts = [];
for (let i = 0; i < 5; i++) {
  await take();
  await page.click("#host th[role=columnheader] button.ui-dt__th >> nth=1");
  sorts.push(...(await take()));
}
out["data-table 10k: sort (click)"] = sorts;

console.log(`${engine}${process.env.BENCH_THROTTLE ? `, CPU ×${process.env.BENCH_THROTTLE}` : ""}`);
for (const [k, xs] of Object.entries(out)) console.log(`  ${k.padEnd(36)} median ${median(xs).toFixed(1)} ms · worst ${worst(xs).toFixed(1)} ms · n=${xs.length}`);
if (errors.length) console.log("errors", errors.filter((e) => !e.includes("ERR_FILE") && !e.includes("Failed to load resource")).slice(0, 5));
await browser.close();
