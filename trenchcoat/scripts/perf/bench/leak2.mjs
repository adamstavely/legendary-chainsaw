import { open } from "./pw.mjs";
const { browser, page } = await open();
const cdp = await page.context().newCDPSession(page); await cdp.send("Performance.enable");
const heap = async () => { await cdp.send("HeapProfiler.collectGarbage"); await cdp.send("HeapProfiler.collectGarbage"); return Math.round((await cdp.send("Performance.getMetrics")).metrics.find((m) => m.name === "JSHeapUsedSize").value / 1024); };
for (const id of ["agent-cursors", "review-center", "chat-composer", "toaster"]) {
  const hs = [await heap()];
  for (let k = 0; k < 4; k++) { await page.evaluate((id) => window.bench.leak(id, 200), id); await page.waitForTimeout(500); hs.push(await heap()); }
  console.log(id, "heap KB after each 200 cycles:", hs.join(" → "));
}
await browser.close();
