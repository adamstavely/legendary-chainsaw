import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const ROOT = fileURLToPath(new URL("../../..", import.meta.url));
const require = createRequire(ROOT + "/package.json");
export const { chromium } = require("playwright");
export async function open() {
  const browser = await chromium.launch({ args: ["--enable-precise-memory-info", "--js-flags=--expose-gc"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(m.type() + ": " + m.text().slice(0, 200)); });
  await page.goto("file://" + new URL(".", import.meta.url).pathname + "index.html");
  await page.waitForFunction(() => !!window.bench);
  return { browser, page, errors };
}
