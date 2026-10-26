import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const ROOT = fileURLToPath(new URL("../../..", import.meta.url));
const require = createRequire(ROOT + "/package.json");
export const { chromium, firefox, webkit } = require("playwright");
// BENCH_BROWSER=firefox|webkit runs in that engine (Chromium by default; the trace-based scripts need Chromium).
// BENCH_THROTTLE=4 slows the CPU 4× (Chromium only, through the DevTools protocol).
export const engine = process.env.BENCH_BROWSER ?? "chromium";
export async function open() {
  const browser = await { chromium, firefox, webkit }[engine].launch(engine === "chromium" ? { args: ["--enable-precise-memory-info", "--js-flags=--expose-gc"] } : {});
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  if (process.env.BENCH_THROTTLE) {
    if (engine !== "chromium") throw new Error("BENCH_THROTTLE needs Chromium");
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: Number(process.env.BENCH_THROTTLE) });
  }
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(m.type() + ": " + m.text().slice(0, 200)); });
  await page.goto("file://" + new URL(".", import.meta.url).pathname + "index.html");
  await page.waitForFunction(() => !!window.bench);
  return { browser, page, errors };
}
