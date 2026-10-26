import { open } from "./pw.mjs";
const { browser, page } = await open();
const ids = await page.evaluate(() => window.bench.ids);
const rows = [];
for (const id of ids) {
  await page.evaluate(() => { document.getElementById("spacer").style.height = "4000px"; });
  await page.evaluate((id) => window.bench.mountDemo(id), id);
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => {
    const A = document.getAnimations().filter((a) => a.playState === "running");
    const props = {}; const infinite = A.filter((a) => a.effect?.getComputedTiming?.().endTime === Infinity).length;
    for (const a of A) for (const k of a.effect?.getKeyframes?.() ?? []) for (const p of Object.keys(k)) if (!["offset", "easing", "composite", "computedOffset"].includes(p)) props[p] = (props[p] || 0) + 1;
    return { running: A.length, infinite, props: Object.keys(props) };
  });
  const nonComp = r.props.filter((p) => !["transform", "opacity", "translate", "scale", "rotate"].includes(p));
  rows.push({ id, ...r, nonComp });
  await page.evaluate(() => { window.bench.unmount(); document.getElementById("spacer").style.height = "0px"; });
}
const hits = rows.filter((r) => r.infinite > 0).sort((a, b) => b.infinite - a.infinite);
console.log("demos with infinite CSS animations still running while off-screen:", hits.length, "of", rows.length);
for (const r of hits) console.log(r.id.padEnd(34), "running", r.running, "infinite", r.infinite, "non-composited:", r.nonComp.join(",") || "-");
await browser.close();
