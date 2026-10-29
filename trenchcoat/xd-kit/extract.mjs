// Reads every gallery component out of the browser as layers Adobe XD can rebuild, into xd-kit/plugin/kit/ for the
// plugin to bundle: one JSON file per component (Standard and Clean, light and dark), an index, and the tokens.
//   node xd-kit/extract.mjs                 every component (about 10 minutes)
//   node xd-kit/extract.mjs button dialog   only those
// Each demo mounts alone on app/thumb.html under a fake clock with reduced motion, as scripts/capture-thumbs.mjs does,
// in Inter (from @fontsource-variable/inter), so text is measured in the face the kit names. Only the demo's tc-*
// elements are read – not its captions.
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { createServer as netServer } from "node:net";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "plugin", "kit");
const LOOKS = ["standard", "clean"];
/** Modals whose demos start closed, behind a button: drawn open, which is what a designer needs from them */
const OPEN = ["tc-dialog", "tc-terms-dialog"];
const THEMES = ["light", "dark"];
const asked = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const require = createRequire(import.meta.url);
const interCss = require.resolve("@fontsource-variable/inter/index.css");
const PAGE_SCRIPT = readFileSync(join(HERE, "page", "extract.js"), "utf8");

// Categories, in the gallery's order, from the registry's components library
const registry = readFileSync(join(HERE, "..", "app", "src", "registry.ts"), "utf8");
const lib = registry.slice(registry.indexOf('key: "components"'), registry.indexOf('key: "blocks"'));
const categories = [...lib.matchAll(/\["([^"]+)", \[([^\]]*)\]\]/g)].map((m) => ({ name: m[1], slugs: [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]) }));
const categoryOf = new Map(categories.flatMap((c) => c.slugs.map((s) => [s, c.name])));

const port = await new Promise((resolve) => {
  const s = netServer().listen(0, () => {
    const { port } = s.address();
    s.close(() => resolve(port));
  });
});
const server = await createServer({ configFile: join(HERE, "..", "vite.config.ts"), server: { port, strictPort: true, hmr: false, fs: { allow: [join(HERE, "..")] } }, logLevel: "error" });
await server.listen();
let browser = await chromium.launch();
const base = `http://localhost:${port}/thumb.html`;
const fontUrl = `http://localhost:${port}/@fs${dirname(interCss)}/`;

const listPage = await browser.newPage();
await listPage.goto(base);
await listPage.waitForFunction(() => window.__entries?.length > 0, null, { timeout: 120_000 });
const entries = (await listPage.evaluate(() => window.__entries)).filter((e) => e.library === "components" && e.slug !== "look-provider");
await listPage.close();
for (const s of asked) if (!entries.some((e) => e.slug === s)) throw new Error(`no component ${s}`);
const jobs = entries.filter((e) => !asked.length || asked.includes(e.slug));

let context;
async function freshContext() {
  context = await browser.newContext({ viewport: { width: 1800, height: 1400 }, reducedMotion: "reduce", deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    let seed = 42;
    Math.random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  });
}
await freshContext();
/** Chromium can run out of memory over a long run: start it again and carry on */
let restarting = null;
async function restart() {
  restarting ??= (async () => {
    await browser.close().catch(() => {});
    browser = await chromium.launch();
    await freshContext();
  })().finally(() => (restarting = null));
  return restarting;
}
const fontFace = readFileSync(interCss, "utf8").replace(/url\(\.\/files\//g, `url(${fontUrl}files/`);

async function extract(e) {
  const errors = [];
  const variants = {};
  for (const look of LOOKS) {
    if (!e.looks.includes(look)) continue;
    // A page per look: the fake clock is installed once per page
    const page = await context.newPage();
    page.on("pageerror", (err) => errors.push(String(err.message).split("\n")[0]));
    try {
      await page.clock.install({ time: new Date("2026-10-24T12:00:00Z") });
      await page.goto(`${base}?id=${encodeURIComponent(e.id)}&look=${look}`);
      await page.waitForSelector("body[data-ready]", { timeout: 60_000 });
      // Inter, under the family name tokens.css asks for first
      await page.addStyleTag({ content: fontFace.replaceAll("'Inter Variable'", "'Inter'") });
      await page.evaluate(() => document.fonts.ready);
      await page.addScriptTag({ content: PAGE_SCRIPT });
      const settle = async (ms) => {
        for (let t = 0; t < ms; t += 100) {
          await page.clock.runFor(100);
          await page.waitForTimeout(15);
        }
      };
      await page.evaluate((tags) => {
        for (const el of document.querySelectorAll(tags.join(","))) el.open = true;
      }, OPEN);
      await settle(3000);
      for (const theme of THEMES) {
        await page.evaluate((t) => {
          document.documentElement.classList.toggle("dark", t === "dark");
          const s = document.querySelector(".thumb-stage");
          s.dataset.tcTheme = t;
          s.classList.toggle("dark", t === "dark");
        }, theme);
        await settle(600);
        variants[`${look}-${theme}`] = await page.evaluate(() => {
          const stage = document.querySelector(".thumb-stage");
          // The demo's components: the outermost tc-* elements (the look provider has no box of its own)
          const roots = [...stage.querySelectorAll("*")].filter(
            (el) => el.tagName.startsWith("TC-") && el.tagName !== "TC-LOOK-PROVIDER" && getComputedStyle(el).display !== "none",
          );
          // An open modal is drawn on its own, without the button that opened it or its host's box
          let top = roots.filter((el) => !roots.some((o) => o !== el && o.contains(el)));
          const modals = top.flatMap((el) => [...el.querySelectorAll("dialog[open]")]);
          if (modals.length) top = modals;
          if (!top.length) return null;
          window.__xdMaterialize(top);
          try {
            return window.__xdExtract(top);
          } finally {
            window.__xdRestore();
          }
        });
      }
    } finally {
      await page.close();
    }
  }
  return { variants, errors };
}

/** The tokens: every semantic colour in both themes, and the type scale */
async function tokens() {
  const page = await context.newPage();
  await page.goto(`${base}?id=button&look=standard`);
  await page.waitForSelector("body[data-ready]");
  const out = {};
  for (const theme of THEMES) {
    out[theme] = await page.evaluate((t) => {
      const s = document.querySelector(".thumb-stage");
      s.dataset.tcTheme = t;
      s.classList.toggle("dark", t === "dark");
      document.documentElement.classList.toggle("dark", t === "dark");
      const names = new Set();
      for (const sheet of document.styleSheets) {
        let rules;
        try {
          rules = sheet.cssRules;
        } catch {
          continue;
        }
        const scan = (list) => {
          for (const r of list) {
            if (r.style) for (let i = 0; i < r.style.length; i++) if (r.style[i].startsWith("--tc-")) names.add(r.style[i]);
            if (r.cssRules) scan(r.cssRules);
          }
        };
        scan(rules);
      }
      const probe = document.createElement("div");
      s.append(probe);
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const colours = {};
      const values = {};
      const cs = getComputedStyle(s);
      for (const n of [...names].sort()) {
        const v = cs.getPropertyValue(n).trim();
        if (!v) continue;
        values[n] = v;
        // A colour is whatever the browser accepts as one
        probe.style.color = "";
        probe.style.color = `var(${n})`;
        if (!CSS.supports("color", v) && !/^(light-dark|color-mix|rgb|hsl|oklch|#)/.test(v)) continue;
        const c = getComputedStyle(probe).color;
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = "#010203";
        ctx.fillStyle = c;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
        if (a) colours[n.slice(5)] = { r, g, b, a: Math.round((a / 255) * 1000) / 1000 };
      }
      probe.remove();
      return { colours, values };
    }, theme);
  }
  await page.close();
  const v = out.light.values;
  const size = (n) => parseFloat(v[`--tc-font-size-${n}`]);
  const sizes = Object.keys(v)
    .filter((n) => /^--tc-font-size-[a-z0-9-]+$/.test(n) && /px$/.test(v[n]))
    .map((n) => n.slice("--tc-font-size-".length))
    .sort((a, b) => size(a) - size(b));
  const weights = { Regular: 400, Medium: 500, Semibold: 600 };
  const leading = parseFloat(v["--tc-line-height-normal"]) || 1.5;
  const type = sizes.flatMap((s) => Object.entries(weights).map(([w, n]) => ({ name: `${s} / ${w}`, size: size(s), weight: n, lineHeight: Math.round(size(s) * leading) })));
  // Semantic colours only: the palette's numbered steps (gray-450) stay out of the assets panel
  const semantic = (c) => Object.fromEntries(Object.entries(c).filter(([n]) => !/-\d{2,3}$/.test(n) && !/^(white|black)$/.test(n)));
  return { colours: { light: semantic(out.light.colours), dark: semantic(out.dark.colours) }, type };
}

if (!asked.length && existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(OUT, { recursive: true });
const indexFile = join(OUT, "index.json");
const index = existsSync(indexFile) ? JSON.parse(readFileSync(indexFile, "utf8")) : { components: [] };
const queue = [...jobs];
const failed = [];
const warned = [];
let done = 0;
await Promise.all(
  Array.from({ length: Number(process.env.XD_WORKERS ?? 3) }, async () => {
    while (queue.length) {
      const e = queue.shift();
      for (let attempt = 1; ; attempt++) {
        try {
          const { variants, errors } = await extract(e);
          if (errors.length) warned.push(`${e.slug}: ${errors[0]}`);
          const file = `${e.slug}.json`;
          writeFileSync(join(OUT, file), JSON.stringify({ slug: e.slug, name: e.name, category: categoryOf.get(e.slug) ?? "Other", variants }));
          index.components = index.components.filter((c) => c.slug !== e.slug);
          index.components.push({ slug: e.slug, name: e.name, category: categoryOf.get(e.slug) ?? "Other", file, variants: Object.keys(variants).filter((k) => variants[k]) });
          done++;
          if (done % 20 === 0) console.log(`${done}/${jobs.length}`);
          break;
        } catch (error) {
          if (!browser.isConnected() || /has been closed/.test(String(error.message))) await restart();
          if (attempt === 3) {
            failed.push(`${e.slug}: ${String(error.message).split("\n")[0]}`);
            break;
          }
        }
      }
    }
  }),
);
const order = categories.map((c) => c.name);
index.categories = order.filter((c) => index.components.some((x) => x.category === c));
index.components.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category) || a.name.localeCompare(b.name));
index.generated = new Date().toISOString();
writeFileSync(indexFile, JSON.stringify(index, null, 1));
writeFileSync(join(OUT, "tokens.json"), JSON.stringify(await tokens(), null, 1));
await browser.close();
await server.close();
console.log(`xd-kit: extracted ${done} of ${jobs.length} into ${OUT}`);
if (warned.length) console.log(`page errors:\n  ${warned.join("\n  ")}`);
if (failed.length) {
  console.error(`could not extract:\n  ${failed.join("\n  ")}`);
  process.exitCode = 1;
}
