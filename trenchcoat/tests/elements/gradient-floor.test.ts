/*
 * <tc-gradient-floor> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/gradient-floor";
import { TcGradientFloor } from "../../src/elements/gradient-floor";
import { cleanup, fixture } from "./helpers";

let visibility: DocumentVisibilityState = "visible";
let reduce = false;
const listeners = new Set<() => void>();
const original = window.matchMedia;

beforeEach(() => {
  visibility = "visible";
  reduce = false;
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
  window.matchMedia = ((query: string) => ({
    get matches() {
      return reduce && query.includes("reduce");
    },
    media: query,
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  })) as unknown as typeof window.matchMedia;
});
afterEach(() => {
  vi.useRealTimers();
  cleanup();
  window.matchMedia = original;
  listeners.clear();
  delete (document as { visibilityState?: unknown }).visibilityState;
});

/** Mounts with real timers (Lit and the observer need them), then hands the frame loop to fake timers */
const mount = async (t = html`<tc-gradient-floor style="height: 200px"><div>Agents that ship.</div></tc-gradient-floor>`) => {
  const el = await fixture<TcGradientFloor>(t);
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
  // Restart the loop on the fake clock
  (el as unknown as { startMorph(): void }).startMorph();
  return el;
};
const frames = (n: number) => {
  for (let i = 0; i < n; i++) vi.advanceTimersByTime(16);
};
const shape = (el: Element) => el.querySelector("path")!.getAttribute("d");
const hide = (hidden: boolean) => {
  visibility = hidden ? "hidden" : "visible";
  document.dispatchEvent(new Event("visibilitychange"));
};

describe("tc-gradient-floor", () => {
  test("the host is the root; the floor is decorative; the content sits above it", async () => {
    vi.useRealTimers();
    const el = await fixture<TcGradientFloor>(html`<tc-gradient-floor class="mine" data-x="1"><div class="hero"><button>Go</button></div></tc-gradient-floor>`);
    expect(el.dataset.ui).toBe("gf");
    expect(el.hasAttribute("data-look")).toBe(false);
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("data-x")).toBe("1");
    expect([...el.querySelectorAll(".ui-gf-layer")].every((l) => l.getAttribute("aria-hidden") === "true")).toBe(true);
    expect(getComputedStyle(el.querySelector(".hero")!).zIndex).toBe("1");
  });

  test("each floor has its own gradient id", async () => {
    vi.useRealTimers();
    const wrap = await fixture<HTMLDivElement>(html`<div><tc-gradient-floor></tc-gradient-floor><tc-gradient-floor .colors=${["red", "green", "blue"]}></tc-gradient-floor></div>`);
    const ids = [...wrap.querySelectorAll("linearGradient")].map((g) => g.id);
    expect(new Set(ids).size).toBe(2);
    const [, second] = wrap.querySelectorAll("tc-gradient-floor");
    expect([...second.querySelectorAll("stop")].map((s) => s.getAttribute("stop-color"))).toEqual(["red", "green", "blue"]);
    expect(second.querySelector("path")!.getAttribute("fill")).toBe(`url(#${ids[1]})`);
  });

  test("a hidden tab pauses the morph and the drift; showing it resumes", async () => {
    const el = await mount();
    frames(10);
    expect(vi.getTimerCount(), "morphing").toBe(1);
    hide(true);
    expect(el.hasAttribute("data-paused")).toBe(true);
    expect(vi.getTimerCount(), "no frame loop while hidden").toBe(0);
    hide(false);
    expect(el.hasAttribute("data-paused")).toBe(false);
    expect(vi.getTimerCount()).toBe(1);
  });

  test("turning on reduced motion while it runs stops the morph and rests on the first shape", async () => {
    const el = await mount();
    const rest = shape(el);
    frames(30);
    expect(shape(el)).not.toBe(rest);
    reduce = true;
    listeners.forEach((fn) => fn());
    expect(vi.getTimerCount()).toBe(0);
    expect(shape(el)).toBe(rest);
    reduce = false;
    listeners.forEach((fn) => fn());
    expect(vi.getTimerCount(), "morphs again once motion is allowed").toBe(1);
  });

  test("by default it moves for about 5 s, then rests – no frame loop left (2.2.2)", async () => {
    const el = await mount();
    expect(el.style.getPropertyValue("--tc-gradient-floor-passes")).toBe("2");
    frames(10);
    expect(vi.getTimerCount()).toBe(1);
    frames(Math.ceil(5200 / 16));
    expect(vi.getTimerCount(), "at rest").toBe(0);
    const rest = shape(el);
    frames(20);
    expect(shape(el)).toBe(rest);
  });

  test("time off screen doesn't count: the rest of the run plays when it comes back", async () => {
    const el = await mount(html`<tc-gradient-floor play-for="2.5"></tc-gradient-floor>`);
    frames(60);
    hide(true);
    vi.advanceTimersByTime(10000);
    hide(false);
    expect(vi.getTimerCount(), "still has motion left").toBe(1);
    frames(Math.ceil(2600 / 16));
    expect(vi.getTimerCount()).toBe(0);
    expect(el.style.getPropertyValue("--tc-gradient-floor-passes")).toBe("1");
  });

  test("playFor Infinity keeps it going, and the drift loops endlessly", async () => {
    const el = await mount(html`<tc-gradient-floor .playFor=${Infinity}></tc-gradient-floor>`);
    frames(Math.ceil(8000 / 16));
    expect(vi.getTimerCount()).toBe(1);
    expect(el.style.getPropertyValue("--tc-gradient-floor-passes")).toBe("infinite");
  });

  test("removed from the page, it leaves no frame loop or listener", async () => {
    const el = await mount();
    frames(5);
    el.remove();
    expect(vi.getTimerCount()).toBe(0);
    expect(listeners.size).toBe(0);
  });

  test("dark follows data-tc-theme: no theme-scoped colour rules", () => {
    for (const [, selector, body] of TcGradientFloor.css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      if (/\.dark\b|data-(?:tc-)?theme="dark"/.test(selector.replace(/\/\*[\s\S]*?\*\//g, ""))) expect(body.trim()).toBe("color-scheme: dark;");
    }
  });

  test("axe: no violations", async () => {
    vi.useRealTimers();
    const wrap = await fixture(html`<div><tc-gradient-floor style="height: 200px"><div><h2>Agents that ship.</h2></div></tc-gradient-floor></div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
