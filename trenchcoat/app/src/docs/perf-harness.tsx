// Dev-only page for scripts/measure-perf.mjs (remediation 6.5). One element per page load:
//   1. cold – the first instance on the page, with its default properties (its CSS is adopted here);
//   2. the gallery demo is mounted, and the element's properties are copied from it, then the demo is unmounted;
//   3. first render – a new element with the demo's data, connected, until it and every element inside it have
//      finished updating and the page has laid it out (median of the runs);
//   4. update – one item of its largest list replaced (or, with no list, a re-render with the same data);
//   5. scale – windowed lists at 10,000 rows; other lists at 100 and 1,000 items;
//   6. idle – animation-frame and timer callbacks per second at rest, on screen and scrolled away.
// The driver reads window.__perf.
import { counts } from "./perf-counters";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import "../../../tokens/tokens.css";
import { ENTRIES } from "../registry";
import type { ApiPage } from "./usage";

const API = import.meta.glob<ApiPage>("./api/*.json", { import: "default" });
const demoBox = document.getElementById("demo")!;
const host = document.getElementById("host")!;

type Updatable = HTMLElement & { updateComplete?: Promise<unknown>; requestUpdate?: () => void } & Record<string, unknown>;
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const round = (n: number) => Math.round(n * 100) / 100;

/** Until the element and every custom element inside it have finished updating, then a forced layout */
async function settle(el: Element) {
  for (let i = 0; i < 4; i++) {
    const pending = [el, ...el.querySelectorAll("*")].filter((n) => n.localName.includes("-") && "updateComplete" in n) as Updatable[];
    const done = await Promise.all(pending.map((n) => n.updateComplete));
    if (done.every((d) => d !== false)) break;
  }
  void (el as HTMLElement).getBoundingClientRect();
  void document.body.offsetHeight;
}

let tag = "";
let props: Record<string, unknown> = {};
let current: Updatable | null = null;

function create(extra: Record<string, unknown> = {}) {
  const el = document.createElement(tag) as Updatable;
  for (const [k, v] of Object.entries({ ...props, ...extra })) {
    try {
      el[k] = v;
    } catch {
      // a read-only accessor – the element keeps its own
    }
  }
  return el;
}

async function render(extra: Record<string, unknown> = {}) {
  host.replaceChildren();
  await frame();
  const el = create(extra);
  const t = performance.now();
  host.append(el);
  await settle(el);
  const ms = performance.now() - t;
  current = el;
  return { ms, nodes: el.querySelectorAll("*").length };
}

/** The largest array among the copied properties – the list an update replaces an item of, and the one scaled */
function largestList() {
  let best: [string, unknown[]] | null = null;
  for (const [k, v] of Object.entries(props)) if (Array.isArray(v) && v.length && (!best || v.length > best[1].length)) best = [k, v];
  return best;
}

/** A list grown to n items: copies of the demo's, with ids made unique */
function grow(items: unknown[], n: number) {
  return Array.from({ length: n }, (_, i) => {
    const src = items[i % items.length];
    if (i < items.length || !src || typeof src !== "object" || Array.isArray(src) || src instanceof Node) return src;
    const copy: Record<string, unknown> = { ...(src as Record<string, unknown>) };
    for (const k of ["id", "key", "value"]) {
      if (typeof copy[k] === "string") copy[k] = `${copy[k]}-${i}`;
      else if (k === "id" && typeof copy[k] === "number") copy[k] = (copy[k] as number) + i * 1e6;
    }
    return copy;
  });
}

async function update(el: Updatable) {
  const list = largestList();
  const key = list?.[0];
  const t = performance.now();
  if (key && Array.isArray(el[key]) && (el[key] as unknown[]).length) {
    const items = [...(el[key] as unknown[])];
    const mid = Math.floor(items.length / 2);
    const item = items[mid];
    items[mid] = item && typeof item === "object" && !Array.isArray(item) && !(item instanceof Node) ? { ...(item as object) } : item;
    el[key] = items;
  } else el.requestUpdate?.();
  await settle(el);
  return { ms: performance.now() - t, kind: key ? `one item of ${key} replaced` : "re-render with the same data" };
}

async function idle(ms: number) {
  await frame();
  const before = { ...counts };
  await wait(ms);
  return { frames: round(((counts.frames - before.frames) * 1000) / ms), timers: round(((counts.timers - before.timers) * 1000) / ms) };
}

async function measure(slug: string, opts: { runs: number; windowed: boolean }) {
  const errors: string[] = [];
  const onError = (e: ErrorEvent) => errors.push(e.message);
  addEventListener("error", onError);
  const api = await API[`./api/${slug}.json`]?.();
  if (!api) throw new Error(`no api for ${slug}`);
  tag = api.elements[0].tag;
  const entry = ENTRIES.find((e) => e.slug === slug && ["components", "illustrations", "motion"].includes(e.library));
  const ui = entry?.load.standard ? await entry.load.standard() : null;
  await customElements.whenDefined(tag);

  // The page's own timers and frames (Vite's client), subtracted from the idle counts
  const baseline = await idle(600);

  // 1. Cold: the first of its type, default properties
  props = {};
  const cold = await render();

  // 2. The demo's data
  let source: "demo" | "defaults" = "defaults";
  if (entry?.Demo && ui) {
    const Demo = entry.Demo;
    const root = createRoot(demoBox);
    flushSync(() => root.render(<Demo ui={ui} />));
    for (let i = 0; i < 3; i++) await frame();
    await wait(300);
    const el = demoBox.querySelector(tag) as Updatable | null;
    if (el) {
      source = "demo";
      for (const p of api.elements[0].properties) if (!p.readonly && p.name !== "look") props[p.name] = el[p.name];
    }
    root.unmount();
    demoBox.replaceChildren();
  }

  // 3. First render, 4. update
  const firsts: number[] = [];
  const updates: number[] = [];
  let nodes = 0;
  let updateKind = "";
  for (let i = 0; i < opts.runs; i++) {
    const r = await render();
    firsts.push(r.ms);
    nodes = r.nodes;
    await frame();
    const u = await update(current!);
    updates.push(u.ms);
    updateKind = u.kind;
  }

  // 5. Scale
  const list = largestList();
  let scale: { property: string; demoItems: number; points: { items: number; first: number; update: number; nodes: number }[] } | null = null;
  if (list) {
    const [property, items] = list;
    scale = { property, demoItems: items.length, points: [] };
    for (const n of opts.windowed ? [10_000] : [100, 1_000]) {
      const r = await render({ [property]: grow(items, n) });
      const u = await update(current!);
      scale.points.push({ items: n, first: round(r.ms), update: round(u.ms), nodes: r.nodes });
      if (r.ms > 3000) break;
    }
    host.replaceChildren();
  }

  // 6. Idle, on screen, with the demo's data
  await render();
  await wait(200);
  const visible = await idle(1000);
  removeEventListener("error", onError);
  return {
    tag,
    source,
    runs: opts.runs,
    cold: round(cold.ms),
    first: round(median(firsts)),
    update: round(median(updates)),
    updateKind,
    nodes,
    scale,
    idle: { visible: sub(visible, baseline) },
    baseline,
    errors,
  };
}
const sub = (a: { frames: number; timers: number }, b: { frames: number; timers: number }) => ({ frames: Math.max(0, round(a.frames - b.frames)), timers: Math.max(0, round(a.timers - b.timers)) });

declare global {
  interface Window {
    __perf: unknown;
  }
}
window.__perf = {
  measure,
  /** Scrolled far below the fold (or back), then the idle counts */
  async away(on: boolean, ms = 1000) {
    host.classList.toggle("away", on);
    await wait(300);
    return idle(ms);
  },
  /** A fresh element (it reads prefers-reduced-motion when it connects), then the idle counts */
  async again(ms = 1000) {
    host.classList.remove("away");
    await render();
    await wait(200);
    return idle(ms);
  },
  idle,
};
document.body.dataset.ready = "";
