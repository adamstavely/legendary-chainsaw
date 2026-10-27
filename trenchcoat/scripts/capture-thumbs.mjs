// Thumbnails for the gallery's overview pages: a small WebP of every entry's demo, in light and dark, into
// app/src/thumbs/<library>/<slug>.<theme>.webp (Clean: <slug>.clean.<theme>.webp). The gallery imports them through
// import.meta.glob, so the standalone single-file build inlines them – keep the total small (about 2 MB).
//   npm run capture:thumbs                    every entry (a few minutes); drops thumbnails of entries that have gone
//   npm run capture:thumbs -- <id>…           only those (button, blocks/kpi-board, illustrations/voice-orb …)
//   npm run capture:thumbs -- --missing       only entries without both themes
//   npm run capture:thumbs -- --clean         also the Clean look of entries that have one (mind the size budget)
// Each demo mounts alone on app/thumb.html under a fake clock with reduced motion, runs 3 simulated seconds so its
// entrance animations finish, then is cropped to its content at 16:10, centred, and scaled to 320 × 200.
import { chromium } from "@playwright/test";
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createServer as netServer } from "node:net";
import { createServer } from "vite";

const OUT = "app/src/thumbs";
const W = 320;
const H = 200;
const QUALITY = Number(process.env.THUMB_QUALITY ?? 0.7);
const THEMES = ["light", "dark"];
const args = process.argv.slice(2);
const missing = args.includes("--missing");
const withClean = args.includes("--clean");
const asked = args.filter((a) => !a.startsWith("--"));

const fileFor = (e, look, theme) => join(OUT, e.library, `${e.slug}${look === "clean" ? ".clean" : ""}.${theme}.webp`);

const port = await new Promise((resolve) => {
  const s = netServer().listen(0, () => {
    const { port } = s.address();
    s.close(() => resolve(port));
  });
});
const server = await createServer({ configFile: "vite.config.ts", server: { port, strictPort: true, hmr: false }, logLevel: "error" });
await server.listen();
const browser = await chromium.launch();
const base = `http://localhost:${port}/thumb.html`;

// The entry list comes from the registry, through the page
const listPage = await browser.newPage();
await listPage.goto(base);
await listPage.waitForFunction(() => window.__entries?.length > 0, null, { timeout: 120_000 });
const entries = await listPage.evaluate(() => window.__entries);
await listPage.close();

for (const id of asked) if (!entries.some((e) => e.id === id)) throw new Error(`no gallery entry ${id}`);
let jobs = entries
  .filter((e) => !asked.length || asked.includes(e.id))
  .flatMap((e) => [{ e, look: "standard" }, ...(withClean && e.looks.includes("clean") ? [{ e, look: "clean" }] : [])]);
if (missing) jobs = jobs.filter(({ e, look }) => THEMES.some((t) => !existsSync(fileFor(e, look, t))));
if (!jobs.length) {
  console.log("thumbs: nothing to capture");
  await browser.close();
  await server.close();
  process.exit(0);
}

// Downscaling and WebP encoding happen in Chromium: no image library needed
const encoder = await browser.newPage();
const encode = (png) =>
  encoder.evaluate(
    async ([b64, w, h, q]) => {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }), { resizeWidth: w, resizeHeight: h, resizeQuality: "high" });
      const canvas = new OffscreenCanvas(w, h);
      canvas.getContext("2d").drawImage(bitmap, 0, 0);
      const blob = await canvas.convertToBlob({ type: "image/webp", quality: q });
      const buf = new Uint8Array(await blob.arrayBuffer());
      let s = "";
      for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      return btoa(s);
    },
    [png.toString("base64"), W, H, QUALITY],
  );

const context = await browser.newContext({ viewport: { width: 1800, height: 1400 }, reducedMotion: "reduce", deviceScaleFactor: 1 });
await context.addInitScript(() => {
  let seed = 42;
  Math.random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
});

/** The crop: the demo's content plus a margin, widened to 16:10 and centred on it; tall content keeps its top */
function frame(layout) {
  const stage = document.querySelector(".thumb-stage");
  const s = stage.getBoundingClientRect();
  const sx = s.left + scrollX;
  const sy = s.top + scrollY;
  if (layout === "screen") return { x: sx, y: sy, width: s.width, height: s.height };
  let box = null;
  const add = (r) => {
    if (r.width < 2 || r.height < 2) return;
    // Clip to the stage, plus a little: popovers may hang just outside it
    const l = Math.max(r.left, s.left - 16), t = Math.max(r.top, s.top - 16);
    const rr = Math.min(r.right, s.right + 16), b = Math.min(r.bottom, s.bottom + 16);
    if (rr <= l || b <= t) return;
    box = box ? { l: Math.min(box.l, l), t: Math.min(box.t, t), r: Math.max(box.r, rr), b: Math.max(box.b, b) } : { l, t, r: rr, b };
  };
  const clear = (c) => c === "transparent" || /rgba?\([^)]*[,/]\s*0\)$/.test(c);
  // Only what paints counts – text, media, fills, borders, shadows – not the invisible full-width wrappers around it
  const paints = (el, cs) =>
    /^(img|svg|canvas|video|input|textarea|select|progress|meter|hr|iframe)$/i.test(el.tagName) ||
    cs.backgroundImage !== "none" ||
    !clear(cs.backgroundColor) ||
    cs.boxShadow !== "none" ||
    ["Top", "Right", "Bottom", "Left"].some((side) => parseFloat(cs[`border${side}Width`]) > 0 && cs[`border${side}Style`] !== "none" && !clear(cs[`border${side}Color`]));
  const visit = (root) => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim() || n.parentElement?.closest("svg")) continue;
      const cs = n.parentElement && getComputedStyle(n.parentElement);
      if (cs && (cs.visibility === "hidden" || cs.opacity === "0")) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) add(r);
    }
    for (const el of root.querySelectorAll("*")) {
      if (el.shadowRoot) visit(el.shadowRoot);
      if (el.parentElement?.closest("svg")) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === "hidden" || cs.opacity === "0" || cs.display === "contents") continue;
      if (paints(el, cs)) add(el.getBoundingClientRect());
    }
  };
  visit(stage);
  if (!box) return { x: sx, y: sy, width: s.width, height: s.width / 1.6 };
  const pad = layout === "wide" ? 24 : 28;
  const minW = layout === "wide" ? 560 : 360;
  const cw = box.r - box.l + 2 * pad;
  const ch = box.b - box.t + 2 * pad;
  let w = Math.max(cw, minW);
  // Widen to fit the height, up to half as wide again; beyond that, show the top
  if (ch * 1.6 > w) w = Math.min(ch * 1.6, Math.max(w * 1.5, minW * 1.5));
  const h = w / 1.6;
  const cx = (box.l + box.r) / 2;
  const y = ch <= h ? (box.t + box.b) / 2 - h / 2 : box.t - pad;
  return { x: Math.round(cx - w / 2 + scrollX), y: Math.round(y + scrollY), width: Math.round(w), height: Math.round(h) };
}

async function shoot({ e, look }) {
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (err) => errors.push(String(err.message).split("\n")[0]));
  try {
    await page.clock.install({ time: new Date("2026-10-24T12:00:00Z") });
    await page.goto(`${base}?id=${encodeURIComponent(e.id)}&look=${look}`);
    await page.waitForSelector("body[data-ready]", { timeout: 60_000 });
    // Small steps with a real pause between, so layout observers (which fire on real frames) catch up
    const settle = async (ms) => {
      for (let t = 0; t < ms; t += 100) {
        await page.clock.runFor(100);
        await page.waitForTimeout(15);
      }
    };
    await settle(3000);
    let clip;
    for (const theme of THEMES) {
      await page.evaluate((t) => {
        document.documentElement.classList.toggle("dark", t === "dark");
        const s = document.querySelector(".thumb-stage");
        if (!s) return;
        s.dataset.tcTheme = t;
        // The .dark class too, for files that still have .dark-only overrides (as scripts/visual.mjs does)
        s.classList.toggle("dark", t === "dark");
      }, theme);
      await settle(600);
      // One frame for both themes, measured on the light render
      clip ??= await page.evaluate(frame, e.layout);
      const png = await page.screenshot({ clip, fullPage: true, animations: "disabled" });
      const file = fileFor(e, look, theme);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, Buffer.from(await encode(png), "base64"));
    }
    return errors;
  } finally {
    await page.close();
  }
}

// A few pages at a time; a job that fails is retried once, then reported
const queue = [...jobs];
const failed = [];
const warned = [];
let done = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (queue.length) {
      const job = queue.shift();
      for (let attempt = 1; ; attempt++) {
        try {
          const errors = await shoot(job);
          if (errors.length) warned.push(`${job.e.id} (${job.look}): ${errors[0]}`);
          done++;
          if (done % 20 === 0) console.log(`${done}/${jobs.length}`);
          break;
        } catch (error) {
          if (attempt === 2) {
            failed.push(`${job.e.id} (${job.look}): ${String(error.message).split("\n")[0]}`);
            break;
          }
        }
      }
    }
  }),
);
await browser.close();
await server.close();

// A full run drops thumbnails whose entry has gone
const all = [];
const walk = (dir) => {
  for (const f of existsSync(dir) ? readdirSync(dir) : []) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith(".webp")) all.push(p);
  }
};
walk(OUT);
if (!asked.length && !missing) {
  const keep = new Set(entries.flatMap((e) => ["standard", "clean"].flatMap((l) => THEMES.map((t) => fileFor(e, l, t)))));
  for (const p of all.filter((p) => !keep.has(p))) rmSync(p);
}
all.length = 0;
walk(OUT);
const total = all.reduce((n, p) => n + statSync(p).size, 0);
console.log(`thumbs: captured ${done} of ${jobs.length}; ${all.length} files in ${OUT}, ${(total / 1024).toFixed(0)} KB in all`);
if (warned.length) console.log(`page errors while capturing:\n  ${warned.join("\n  ")}`);
if (failed.length) {
  console.error(`could not capture:\n  ${failed.join("\n  ")}`);
  process.exitCode = 1;
}
