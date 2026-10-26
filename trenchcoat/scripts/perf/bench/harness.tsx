// Runtime bench harness – bundled with esbuild (production React, profiling build for <Profiler>).
import { Profiler, createElement, useState, type ComponentType } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { ENTRIES } from "./entries.gen";

declare global {
  interface Window { bench: any; __counts: any }
}

// ---------- instrumentation: listeners, observers, timers, rAF ----------
const C = {
  winListeners: 0, docListeners: 0, ro: 0, io: 0, mo: 0, intervals: 0, timeouts: 0, raf: 0, rafCalls: 0, intervalCalls: 0, timeoutCalls: 0,
  winByType: {} as Record<string, number>, docByType: {} as Record<string, number>,
};
window.__counts = C;
const live = { intervals: new Set<number>(), timeouts: new Set<number>(), raf: new Set<number>() };
{
  const wrapTarget = (target: EventTarget, key: "winListeners" | "docListeners", byType: Record<string, number>) => {
    const add = target.addEventListener.bind(target);
    const rem = target.removeEventListener.bind(target);
    const reg = new Map<string, Set<unknown>>();
    target.addEventListener = (type: string, fn: any, opts?: any) => {
      const cap = typeof opts === "boolean" ? opts : !!opts?.capture;
      const k = type + (cap ? ":c" : "");
      const s = reg.get(k) ?? new Set();
      if (fn && !s.has(fn)) { s.add(fn); C[key]++; byType[type] = (byType[type] ?? 0) + 1; }
      reg.set(k, s);
      if (opts?.signal) opts.signal.addEventListener("abort", () => { if (s.delete(fn)) { C[key]--; byType[type]--; } });
      return add(type, fn, opts);
    };
    target.removeEventListener = (type: string, fn: any, opts?: any) => {
      const cap = typeof opts === "boolean" ? opts : !!opts?.capture;
      const s = reg.get(type + (cap ? ":c" : ""));
      if (s?.delete(fn)) { C[key]--; byType[type]--; }
      return rem(type, fn, opts);
    };
  };
  wrapTarget(window, "winListeners", C.winByType);
  wrapTarget(document, "docListeners", C.docByType);
  const wrapObs = (name: "ResizeObserver" | "IntersectionObserver" | "MutationObserver", key: "ro" | "io" | "mo") => {
    const Orig = (window as any)[name];
    (window as any)[name] = class extends Orig {
      _n = 0;
      observe(...a: any[]) { if (this._n === 0) C[key]++; this._n++; return super.observe(...a); }
      unobserve(...a: any[]) { if (this._n > 0) { this._n--; if (this._n === 0) C[key]--; } return super.unobserve(...a); }
      disconnect() { if (this._n > 0) C[key]--; this._n = 0; return super.disconnect(); }
    };
  };
  wrapObs("ResizeObserver", "ro"); wrapObs("IntersectionObserver", "io"); wrapObs("MutationObserver", "mo");
  const si = window.setInterval.bind(window), ci = window.clearInterval.bind(window);
  (window as any).setInterval = (fn: any, ms?: number, ...a: any[]) => { const id = si((...x: any[]) => { C.intervalCalls++; fn(...x); }, ms, ...a); live.intervals.add(id); C.intervals = live.intervals.size; return id; };
  (window as any).clearInterval = (id: number) => { live.intervals.delete(id); C.intervals = live.intervals.size; ci(id); };
  const st = window.setTimeout.bind(window), ct = window.clearTimeout.bind(window);
  (window as any).setTimeout = (fn: any, ms?: number, ...a: any[]) => { const id: number = st((...x: any[]) => { live.timeouts.delete(id); C.timeouts = live.timeouts.size; C.timeoutCalls++; typeof fn === "function" && fn(...x); }, ms, ...a) as any; live.timeouts.add(id); C.timeouts = live.timeouts.size; return id; };
  (window as any).clearTimeout = (id: number) => { live.timeouts.delete(id); C.timeouts = live.timeouts.size; ct(id); };
  const ra = window.requestAnimationFrame.bind(window), ca = window.cancelAnimationFrame.bind(window);
  (window as any).requestAnimationFrame = (fn: FrameRequestCallback) => { const id = ra((t) => { live.raf.delete(id); C.raf = live.raf.size; C.rafCalls++; fn(t); }); live.raf.add(id); C.raf = live.raf.size; return id; };
  (window as any).cancelAnimationFrame = (id: number) => { live.raf.delete(id); C.raf = live.raf.size; ca(id); };
}
const nativeRaf = (cb: FrameRequestCallback) => requestAnimationFrame(cb);
const frame = () => new Promise<void>((r) => nativeRaf(() => setTimeout(r, 0)));
const snapshot = () => JSON.parse(JSON.stringify({ ...C, winByType: Object.fromEntries(Object.entries(C.winByType).filter(([, v]) => v)), docByType: Object.fromEntries(Object.entries(C.docByType).filter(([, v]) => v)) }));

// ---------- mounting ----------
const host = document.getElementById("host")!;
let root: Root | null = null;
let commits = 0;
const onRender = () => { commits++; };
function mount(el: any) {
  root = createRoot(host);
  flushSync(() => root!.render(createElement(Profiler, { id: "b", onRender }, el)));
}
function unmount() { root?.unmount(); root = null; host.textContent = ""; }

const byId = (id: string) => { const e = ENTRIES.find((x) => x.id === id); if (!e) throw new Error("no entry " + id); return e; };

async function mountDemo(id: string) {
  const e = byId(id);
  unmount();
  const t0 = performance.now();
  mount(createElement(e.Demo, { ui: e.ui }));
  const t1 = performance.now();
  host.getBoundingClientRect(); // force style + layout
  const t2 = performance.now();
  await frame();
  const t3 = performance.now();
  return { id, render: t1 - t0, layout: t2 - t1, toFrame: t3 - t0, nodes: host.querySelectorAll("*").length, styles: document.querySelectorAll("style[data-precedence]").length };
}

async function steadyStart(id: string, offscreen: boolean) {
  const e = byId(id);
  unmount();
  document.getElementById("spacer")!.style.height = offscreen ? "4000px" : "0px";
  window.scrollTo(0, 0);
  mount(createElement(e.Demo, { ui: e.ui }));
  await new Promise((r) => setTimeout(r, 700));
  commits = 0;
  (window as any).__c0 = { ...C, t0: performance.now() };
}
function steadyEnd(id: string, offscreen: boolean) {
  const c0 = (window as any).__c0;
  const dt = (performance.now() - c0.t0) / 1000;
  const res = { id, offscreen, commitsPerS: commits / dt, rafPerS: (C.rafCalls - c0.rafCalls) / dt, intervalPerS: (C.intervalCalls - c0.intervalCalls) / dt, timeoutPerS: (C.timeoutCalls - c0.timeoutCalls) / dt, liveRaf: C.raf, liveIntervals: C.intervals, liveTimeouts: C.timeouts };
  unmount();
  document.getElementById("spacer")!.style.height = "0px";
  return res;
}
async function steady(id: string, ms: number, offscreen: boolean) {
  const e = byId(id);
  unmount();
  document.getElementById("spacer")!.style.height = offscreen ? "4000px" : "0px";
  window.scrollTo(0, 0);
  mount(createElement(e.Demo, { ui: e.ui }));
  await new Promise((r) => setTimeout(r, 500));
  commits = 0;
  const c0 = { ...C };
  const t0 = performance.now();
  await new Promise((r) => setTimeout(r, ms));
  const dt = (performance.now() - t0) / 1000;
  const res = { id, offscreen, commitsPerS: commits / dt, rafPerS: (C.rafCalls - c0.rafCalls) / dt, intervalPerS: (C.intervalCalls - c0.intervalCalls) / dt, timeoutPerS: (C.timeoutCalls - c0.timeoutCalls) / dt, liveRaf: C.raf, liveIntervals: C.intervals };
  unmount();
  document.getElementById("spacer")!.style.height = "0px";
  return res;
}

async function leak(id: string, cycles: number) {
  const e = byId(id);
  unmount();
  await frame();
  const before = snapshot();
  for (let i = 0; i < cycles; i++) {
    mount(createElement(e.Demo, { ui: e.ui }));
    if (i % 10 === 0) await frame();
    unmount();
  }
  await frame(); await frame();
  await new Promise((r) => setTimeout(r, 50));
  const after = snapshot();
  return { id, before, after };
}

// N instances of a component
async function instances(id: string, n: number, props: any, exportName: string, href: string) {
  const e = byId(id);
  unmount();
  const Comp = e.ui[exportName] as ComponentType<any>;
  const els = Array.from({ length: n }, (_, i) => createElement(Comp, { key: i, ...props(i) }));
  const t0 = performance.now();
  mount(createElement("div", null, els));
  const t1 = performance.now();
  host.getBoundingClientRect();
  const t2 = performance.now();
  await frame();
  return { id, n, render: t1 - t0, layout: t2 - t1, total: performance.now() - t0, styleTags: document.querySelectorAll("style[data-precedence]").length, styleTagsForThis: document.querySelectorAll(`style[data-href~="${href}"]`).length, allStyleEls: document.querySelectorAll("style").length, nodes: host.querySelectorAll("*").length };
}

// Mount a component with explicit props (for large-data tests); returns timings
async function mountWith(id: string, exportName: string, props: any) {
  const e = byId(id);
  unmount();
  const Comp = e.ui[exportName] as ComponentType<any>;
  let set: (p: any) => void = () => {};
  function Wrap() { const [p, s] = useState(props); set = s; return createElement(Comp, p); }
  const t0 = performance.now();
  mount(createElement(Wrap));
  const t1 = performance.now();
  host.getBoundingClientRect();
  const t2 = performance.now();
  await frame();
  (window as any).__set = (p: any) => { const a = performance.now(); flushSync(() => set(p)); const b = performance.now(); host.getBoundingClientRect(); return { rerender: b - a, layout: performance.now() - b }; };
  return { render: t1 - t0, layout: t2 - t1, toFrame: performance.now() - t0, nodes: host.querySelectorAll("*").length };
}

window.bench = { steadyStart, steadyEnd, ids: ENTRIES.map((e) => e.id), mountDemo, steady, leak, instances, mountWith, unmount, snapshot, frame, entry: (id: string) => byId(id).ui, flushSync };
