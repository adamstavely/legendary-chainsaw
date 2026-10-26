// Accessibility scan of every gallery entry with axe-core, in every style it ships in, in light and dark.
//   node scripts/a11y.mjs scan <name> [filter]   writes .visual/a11y-<name>.json and prints a summary
//   node scripts/a11y.mjs compare <base> <current>  violations that are new or gone, per entry and rule
// Rules: WCAG 2.0/2.1/2.2 A and AA. Pages run on the same fake clock as the visual harness, with reduced motion, so
// a scan sees each demo at the same moment. axe covers roughly a third of WCAG – keyboard, focus management and
// announcements still need the regression tests and a manual pass.
// A11Y_BROWSER=firefox|webkit scans in that engine (Chromium by default); give parallel runs their own VISUAL_PORT.
// A11Y_DOCS=1 scans each entry's design-system page instead – the text, tables, tabs and controls around the live
// example (the stages are scanned by the normal run).
import { chromium, firefox, webkit } from "@playwright/test";
import { createServer } from "vite";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

const ROOT = ".visual";
const PORT = Number(process.env.VISUAL_PORT ?? 5310);
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const AXE = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const [command, a, b] = process.argv.slice(2);

if (command === "scan") await scan(a, b);
else if (command === "compare") compare(a, b);
else {
  console.error("usage: node scripts/a11y.mjs scan <name> [filter] | compare <base> <current>");
  process.exit(1);
}

async function scan(name, filter) {
  const server = await createServer({ configFile: "vite.config.ts", server: { port: PORT, strictPort: true }, logLevel: "error" });
  await server.listen();
  const browser = await ({ chromium, firefox, webkit }[process.env.A11Y_BROWSER ?? "chromium"]).launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
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

  /** results[entry][file][theme] = [{ rule, impact, help, nodes: [target…] }] */
  const results = {};
  const checkDocs = async (id) => {
    const page = await context.newPage();
    await page.goto(`http://localhost:${PORT}/#/${id}`);
    const documented = await page.waitForSelector("#docs-accessibility", { timeout: 15000 }).then(() => true, () => false);
    if (!documented) return page.close();
    await page.waitForTimeout(800);
    await page.addScriptTag({ content: AXE });
    const list = await page.evaluate(async (tags) => {
      const { violations } = await window.axe.run({ include: [".docs-body"], exclude: [".stage"] }, { runOnly: { type: "tag", values: tags } });
      return violations.map((v) => ({ rule: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => n.target.join(" ")) }));
    }, TAGS);
    results[id] = { [`docs/${id}`]: { light: list } };
    await page.close();
  };
  const check = async (id) => {
    if (process.env.A11Y_DOCS) return checkDocs(id);
    const page = await context.newPage();
    await page.clock.install({ time: new Date("2026-10-24T12:00:00Z") });
    await page.goto(`http://localhost:${PORT}/#/${id}`);
    await page.waitForFunction(() => {
      const stages = [...document.querySelectorAll(".stage")];
      return stages.length > 0 && stages.every((s) => s.firstElementChild && !s.firstElementChild.classList.contains("placeholder"));
    });
    const settle = async (ms) => {
      for (let t = 0; t < ms; t += 100) {
        await page.clock.runFor(100);
        await page.waitForTimeout(20);
      }
    };
    await settle(2500);
    await page.addScriptTag({ content: AXE });
    results[id] = {};
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
      const found = await page.evaluate(async (tags) => {
        const out = {};
        for (const wrap of document.querySelectorAll(".stagewrap")) {
          const file = wrap.querySelector("code").textContent.replace(/\.tsx$/, "");
          const { violations } = await window.axe.run(wrap.querySelector(".stage"), { runOnly: { type: "tag", values: tags } });
          out[file] = violations.map((v) => ({ rule: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => n.target.join(" ")) }));
        }
        return out;
      }, TAGS);
      for (const [file, list] of Object.entries(found)) (results[id][file] ??= {})[theme] = list;
    }
    await page.close();
  };

  const queue = [...ids];
  const failed = [];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (queue.length) {
        const id = queue.shift();
        try {
          await check(id);
        } catch (error) {
          failed.push(`${id}: ${String(error.message).split("\n")[0]}`);
        }
      }
    }),
  );
  await browser.close();
  await server.close();

  const out = join(ROOT, `a11y-${name}.json`);
  writeFileSync(out, JSON.stringify(results, null, 2));
  const byRule = {};
  let files = 0;
  let clean = 0;
  for (const entry of Object.values(results))
    for (const themes of Object.values(entry)) {
      files++;
      const all = Object.values(themes).flat();
      if (!all.length) clean++;
      for (const v of all) byRule[v.rule] = (byRule[v.rule] ?? 0) + v.nodes.length;
    }
  console.log(`${clean} of ${files} files without axe violations (light and dark); nodes per rule:`);
  for (const [rule, n] of Object.entries(byRule).sort((x, y) => y[1] - x[1])) console.log(`  ${String(n).padStart(5)}  ${rule}`);
  console.log(`details: ${out}`);
  if (failed.length) {
    console.error(`could not scan:\n  ${failed.join("\n  ")}`);
    process.exitCode = 1;
  }
}

function compare(base, current) {
  const load = (n) => JSON.parse(readFileSync(join(ROOT, `a11y-${n}.json`), "utf8"));
  const key = (results) => {
    const set = new Map();
    for (const [id, entry] of Object.entries(results))
      for (const [file, themes] of Object.entries(entry))
        for (const [theme, list] of Object.entries(themes))
          for (const v of list) set.set(`${file} ${theme} ${v.rule}`, v.nodes.length);
    return set;
  };
  const before = key(load(base));
  const after = key(load(current));
  const added = [...after].filter(([k, n]) => (before.get(k) ?? 0) < n);
  const gone = [...before].filter(([k]) => !after.has(k));
  console.log(`${gone.length} violation groups fixed, ${added.length} new or grown`);
  for (const [k, n] of added) console.log(`  + ${k} (${before.get(k) ?? 0} → ${n} nodes)`);
  if (added.length) process.exitCode = 1;
}
