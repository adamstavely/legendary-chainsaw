// The Performance section's numbers (remediation 6.5), into app/src/docs/perf.json:
//   · bundle – esbuild, minified and gzipped: the element alone, the shared code it pulls in (Lit, internal/*, the
//     elements it renders), without Lit (the added cost on a page that has Lit) and with it (scripts/docs-data.mjs);
//   · render – headless Chromium through Playwright, on app/perf.html (app/src/docs/perf-harness.tsx): the first
//     instance on the page, a first render with the demo's data and a typical update (medians), how it scales, and
//     the animation-frame and timer callbacks per second at rest – on screen, scrolled away and under reduced motion.
// Each entry keeps the hash of the element's bundle; check:docs reports it stale when the code changes.
//   npm run measure:perf                     every element (about 10 minutes)
//   npm run measure:perf -- <slug>…          only those – the rest of the file is kept
//   npm run measure:perf -- --missing        only elements with no entry or a stale one
import { chromium } from "@playwright/test";
import { cpus, platform, arch } from "node:os";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createServer as netServer } from "node:net";
import { createServer } from "vite";
import { allSlugs } from "./browser-support.mjs";
import { bundle, windowed, withoutLit } from "./docs-data.mjs";

const FILE = "app/src/docs/perf.json";
const RUNS = 7;
const args = process.argv.slice(2);
const missing = args.includes("--missing");
const asked = args.filter((a) => !a.startsWith("--"));
// Elements with a generated docs page – one added since the last run is simply measured next time
const pages = new Set(allSlugs().filter((s) => existsSync(`app/src/docs/api/${s}.json`)));
const data = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : { pieces: {} };
// Elements that have gone are dropped
for (const slug of Object.keys(data.pieces)) if (!pages.has(slug)) delete data.pieces[slug];

let slugs = asked.length ? asked : [...pages].sort();
if (missing) {
  const fresh = [];
  for (const s of slugs) if (!data.pieces[s] || data.pieces[s].hash !== (await withoutLit(s)).hash) fresh.push(s);
  slugs = fresh;
}
for (const s of slugs) if (!pages.has(s)) throw new Error(`no docs page for ${s} – run node scripts/gen-docs.mjs ${s} first`);
if (!slugs.length) {
  console.log("perf: nothing to measure");
  process.exit(0);
}

const port = await new Promise((resolve) => {
  const s = netServer().listen(0, () => {
    const { port } = s.address();
    s.close(() => resolve(port));
  });
});
const server = await createServer({ configFile: "vite.config.ts", server: { port, strictPort: true, hmr: false }, logLevel: "error" });
await server.listen();
const browser = await chromium.launch();
const url = `http://localhost:${port}/perf.html`;
// A first load lets Vite pre-bundle the dependencies before anything is timed
{
  const page = await browser.newPage();
  await page.goto(url);
  await page.waitForSelector("body[data-ready]", { timeout: 120_000 });
  await page.waitForTimeout(2000);
  await page.close();
}

const environment = { browser: `Chromium ${browser.version()}`, headless: true, playwright: JSON.parse(readFileSync("node_modules/playwright-core/package.json", "utf8")).version, os: `${platform()} ${arch()}`, cpu: cpus()[0]?.model ?? "", runs: RUNS };
const save = () => {
  const pieces = Object.fromEntries(Object.entries(data.pieces).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(FILE, JSON.stringify({ about: "Measured by npm run measure:perf (scripts/measure-perf.mjs). Times in milliseconds, sizes in bytes.", environment, pieces }, null, 1) + "\n");
};

let done = 0;
for (const slug of slugs) {
  const started = Date.now();
  const sizes = await bundle(slug);
  const { hash, ...bundleSizes } = sizes;
  let render = null;
  // One context per element, and a deadline: an element that never settles is recorded as an error, not waited on
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(60_000);
  let timer;
  const deadline = new Promise((_, reject) => (timer = setTimeout(() => reject(new Error("no result within 90 s")), 90_000)));
  try {
    render = await Promise.race([
      (async () => {
        await page.goto(url);
        await page.waitForSelector("body[data-ready]", { timeout: 60_000 });
        const r = await page.evaluate(([s, w, runs]) => window.__perf.measure(s, { runs, windowed: w }), [slug, windowed(slug), RUNS]);
        const away = await page.evaluate(() => window.__perf.away(true));
        await page.emulateMedia({ reducedMotion: "reduce" });
        const reduced = await page.evaluate(() => window.__perf.again());
        const sub = (a) => ({ frames: Math.max(0, +(a.frames - r.baseline.frames).toFixed(2)), timers: Math.max(0, +(a.timers - r.baseline.timers).toFixed(2)) });
        const { baseline, ...rest } = r;
        void baseline;
        return { ...rest, idle: { visible: r.idle.visible, away: sub(away), reducedMotion: sub(reduced) } };
      })(),
      deadline,
    ]);
  } catch (e) {
    render = { error: String(e.message ?? e).split("\n")[0] };
  }
  clearTimeout(timer);
  await Promise.race([context.close(), new Promise((r) => setTimeout(r, 5000))]);
  data.pieces[slug] = { measuredAt: new Date().toISOString().slice(0, 10), hash, bundle: bundleSizes, render };
  done++;
  console.log(`${String(done).padStart(3)}/${slugs.length} ${slug}: ${render.error ? `error – ${render.error}` : `first ${render.first} ms, update ${render.update} ms`} (${((Date.now() - started) / 1000).toFixed(1)} s)`);
  if (done % 10 === 0) save();
}
save();
await browser.close();
await server.close();
console.log(`${FILE}: ${slugs.length} measured`);
