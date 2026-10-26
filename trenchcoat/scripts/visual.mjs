// Visual regression for every gallery entry, in every style it ships in, in light and dark.
//   node scripts/visual.mjs capture <dir> [filter]   screenshots into .visual/<dir>/
//   node scripts/visual.mjs compare <base> <current>  pixel diff, writes .visual/<current>-diff/ + report.html;
//                                                     "subtle" = colour shifts pixelmatch's threshold hides
//   node scripts/visual.mjs noise <run1> <run2>       record how much each screenshot varies between identical
//                                                     runs (.visual/noise.json); compare ignores changes within it
// Screenshots are deterministic: a fake clock drives every timer and animation frame, Math.random is
// seeded, and reduced motion is on – so a diff means the rendering changed, not the timing.
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const ROOT = ".visual";
// Parallel runs need their own port: VISUAL_PORT=5301 node scripts/visual.mjs capture …
const PORT = Number(process.env.VISUAL_PORT ?? 5300);
const NOISE = existsSync(join(ROOT, "noise.json")) ? JSON.parse(readFileSync(join(ROOT, "noise.json"), "utf8")) : {};
const [command, a, b] = process.argv.slice(2);

if (command === "capture") await capture(a, b);
else if (command === "compare") compare(a, b);
else if (command === "noise") noise(a, b);
else {
  console.error("usage: node scripts/visual.mjs capture <dir> [filter] | compare <base> <current>");
  process.exit(1);
}

async function capture(dir, filter) {
  const out = join(ROOT, dir);
  mkdirSync(out, { recursive: true });
  const server = await createServer({ configFile: "vite.config.ts", server: { port: PORT, strictPort: true }, logLevel: "error" });
  await server.listen();
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce", deviceScaleFactor: 1 });
  // Same random sequence on every run
  await context.addInitScript(() => {
    let seed = 42;
    Math.random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  });

  const listPage = await context.newPage();
  await listPage.goto(`http://localhost:${PORT}/#/`);
  await listPage.waitForSelector(".sidebar a");
  const ids = (await listPage.$$eval(".sidebar a", (as) => as.map((a) => a.getAttribute("href").slice(2))))
    .filter((id) => id && !id.startsWith("library/"))
    .filter((id) => !filter || id.includes(filter));
  await listPage.close();

  const shoot = async (id) => {
    const page = await context.newPage();
    page.on("crash", () => console.error(`page crashed: ${id}`));
    if (process.env.VISUAL_DEBUG) page.on("console", (m) => m.type() === "error" && console.error(`${id}: ${m.text().slice(0, 600)}`));
    await page.clock.install({ time: new Date("2026-10-24T12:00:00Z") });
    await page.goto(`http://localhost:${PORT}/#/${id}`);
    // Start the clock only once every demo has mounted, so timers begin at the same simulated moment
    await page.waitForFunction(() => {
      const stages = [...document.querySelectorAll(".stage")];
      return stages.length > 0 && stages.every((s) => s.firstElementChild && !s.firstElementChild.classList.contains("placeholder"));
    });
    // Small steps with a real pause between, so layout observers (which fire on real frames) catch up
    const settle = async (ms) => {
      for (let t = 0; t < ms; t += 100) {
        await page.clock.runFor(100);
        await page.waitForTimeout(20);
      }
    };
    await settle(2500);
    for (const theme of ["light", "dark"]) {
      await page.evaluate((t) => {
        for (const s of document.querySelectorAll(".stage")) {
          // The gallery's own switch (data-tc-theme) plus the .dark class, which the files that still have
          // .dark-only overrides need until those become light-dark() (audit/design-review/themes-and-widths.md H1)
          s.dataset.tcTheme = t;
          s.classList.toggle("dark", t === "dark");
          s.style.background = t === "dark" ? "#0e0e10" : "";
          s.style.color = t === "dark" ? "#ededed" : "";
          s.style.backgroundImage = "none";
        }
      }, theme);
      await settle(500);
      const wraps = await page.$$(".stagewrap");
      for (const wrap of wraps) {
        const file = (await wrap.$eval("code", (c) => c.textContent)).replace(/\.tsx$/, "");
        const stage = await wrap.$(".stage");
        await stage.screenshot({ path: join(out, `${id.replace(/\//g, "~")}__${file}__${theme}.png`), animations: "disabled" });
      }
    }
    await page.close();
  };

  // A few pages at a time; an entry that crashes its page is retried once, then reported
  const queue = [...ids];
  const failed = [];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (queue.length) {
        const id = queue.shift();
        for (let attempt = 1; ; attempt++) {
          try {
            await shoot(id);
            break;
          } catch (error) {
            if (attempt === 2) {
              failed.push(`${id}: ${String(error.message).split("\n")[0]}`);
              break;
            }
          }
        }
      }
    }),
  );
  await browser.close();
  await server.close();
  console.log(`captured ${readdirSync(out).length} screenshots of ${ids.length} entries into ${out}`);
  if (failed.length) {
    console.error(`could not capture:\n  ${failed.join("\n  ")}`);
    process.exitCode = 1;
  }
}

function noise(first, second) {
  compare(first, second);
  const rows = JSON.parse(readFileSync(join(ROOT, `${second}-diff`, "report.json"), "utf8"));
  const noisy = Object.fromEntries(rows.filter((r) => r.ratio > 0).map((r) => [r.name, Math.max(r.ratio, NOISE[r.name] ?? 0)]));
  writeFileSync(join(ROOT, "noise.json"), JSON.stringify({ ...NOISE, ...noisy }, null, 1));
  console.log(`noise.json: ${Object.keys({ ...NOISE, ...noisy }).length} screenshots vary between identical runs`);
}

function compare(base, current) {
  const baseDir = join(ROOT, base);
  const curDir = join(ROOT, current);
  const diffDir = join(ROOT, `${current}-diff`);
  mkdirSync(diffDir, { recursive: true });
  const rows = [];
  for (const name of readdirSync(curDir).filter((f) => f.endsWith(".png")).sort()) {
    const was = join(baseDir, name);
    if (!existsSync(was)) {
      rows.push({ name, status: "new", ratio: 1 });
      continue;
    }
    const A = PNG.sync.read(readFileSync(was));
    const B = PNG.sync.read(readFileSync(join(curDir, name)));
    if (A.width !== B.width || A.height !== B.height) {
      rows.push({ name, status: `size ${A.width}×${A.height} → ${B.width}×${B.height}`, ratio: 1 });
      continue;
    }
    const diff = new PNG({ width: A.width, height: A.height });
    const changed = pixelmatch(A.data, B.data, diff.data, A.width, A.height, { threshold: 0.1 });
    const ratio = changed / (A.width * A.height);
    // pixelmatch's threshold hides subtle colour shifts (a border 6% lighter, text a shade off), so also
    // count pixels where any channel moved by more than 4 levels
    let shifted = 0;
    for (let i = 0; i < A.data.length; i += 4) {
      const d = Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2]));
      if (d > 4) shifted++;
    }
    const subtle = shifted / (A.width * A.height);
    if (changed || shifted) writeFileSync(join(diffDir, name), PNG.sync.write(diff));
    // Changes within twice the run-to-run noise of this screenshot (and under 0.2%) are not real
    const tolerance = Math.max(0.002, 2 * (NOISE[name] ?? 0));
    const status = changed && ratio > tolerance ? "changed" : subtle > 0.001 && !(name in NOISE) ? "subtle" : changed ? "noise" : "same";
    rows.push({ name, status, ratio: status === "subtle" ? subtle : ratio });
  }
  // A filtered capture (fewer than half the screenshots) only reports what it captured
  const baseNames = readdirSync(baseDir).filter((f) => f.endsWith(".png"));
  if (readdirSync(curDir).filter((f) => f.endsWith(".png")).length * 2 >= baseNames.length) {
    for (const name of baseNames) if (!existsSync(join(curDir, name))) rows.push({ name, status: "missing", ratio: 1 });
  }
  rows.sort((x, y) => y.ratio - x.ratio);
  const changed = rows.filter((r) => r.status !== "same" && r.status !== "noise");
  const html = `<!doctype html><meta charset="utf-8"><title>Visual diff ${base} → ${current}</title>
<style>body{font:13px system-ui;margin:20px}td,th{padding:6px;border-bottom:1px solid #eee;vertical-align:top}img{max-width:380px;border:1px solid #ddd}</style>
<h1>${base} → ${current}: ${changed.length} of ${rows.length} changed</h1><table><tr><th>Screenshot</th><th>Change</th><th>Before</th><th>After</th><th>Diff</th></tr>
${changed.map((r) => `<tr><td>${r.name}</td><td>${r.status} ${(r.ratio * 100).toFixed(2)}%</td><td><img src="../${base}/${r.name}"></td><td><img src="../${current}/${r.name}"></td><td><img src="${r.name}"></td></tr>`).join("\n")}</table>`;
  writeFileSync(join(diffDir, "report.html"), html);
  writeFileSync(join(diffDir, "report.json"), JSON.stringify(rows, null, 1));
  console.log(`${changed.length} of ${rows.length} screenshots changed; report: ${join(diffDir, "report.html")}`);
  for (const r of changed.slice(0, 40)) console.log(`  ${(r.ratio * 100).toFixed(2).padStart(6)}%  ${r.status.padEnd(8)} ${r.name}`);
}
