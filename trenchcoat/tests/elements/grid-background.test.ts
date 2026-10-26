/*
 * <tc-grid-background> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/grid-background";
import { TcGridBackground } from "../../src/elements/grid-background";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  delete (document as { visibilityState?: unknown }).visibilityState;
});

const until = async (check: () => boolean, ms = 2000) => {
  const end = performance.now() + ms;
  while (!check() && performance.now() < end) await new Promise((r) => setTimeout(r, 16));
};
const passes = (el: HTMLElement) => el.style.getPropertyValue("--tc-grid-background-passes");

describe("tc-grid-background", () => {
  test("the host is the root; classes and attributes stay on it; the grid is decorative", async () => {
    const el = await fixture<TcGridBackground>(html`<tc-grid-background class="mine" data-consumer="yes" size="40"><div>Hero</div></tc-grid-background>`);
    expect(el.dataset.ui).toBe("gb");
    expect(el.hasAttribute("data-look")).toBe(false);
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("data-consumer")).toBe("yes");
    expect(el.style.getPropertyValue("--tc-grid-background-size")).toBe("40px");
    expect(el.style.getPropertyValue("--tc-grid-background-dx")).toBe("-40px");
    expect(el.style.getPropertyValue("--tc-grid-background-dy")).toBe("40px");
    expect(el.querySelector(".ui-gb-grid")!.getAttribute("aria-hidden")).toBe("true");
  });

  test("the content stays where it was put, above the grid", async () => {
    const el = await fixture<TcGridBackground>(html`<tc-grid-background><div class="hero"><button>Go</button></div></tc-grid-background>`);
    const hero = el.querySelector<HTMLElement>(":scope > .hero")!;
    expect(getComputedStyle(hero).zIndex).toBe("1");
    const b = el.querySelector("button")!.getBoundingClientRect();
    expect(document.elementFromPoint(b.left + 2, b.top + 2)).toBe(el.querySelector("button"));
  });

  test("it reveals once in view; reveal off is shown at once", async () => {
    const el = await fixture<TcGridBackground>(html`<tc-grid-background style="height: 100px"><div>x</div></tc-grid-background>`);
    await until(() => el.hasAttribute("data-shown"));
    expect(el.hasAttribute("data-shown")).toBe(true);
    const off = await fixture<TcGridBackground>(html`<tc-grid-background reveal="false"></tc-grid-background>`);
    expect(off.hasAttribute("data-reveal")).toBe(false);
    expect(off.hasAttribute("data-shown")).toBe(true);
  });

  test("a hidden tab pauses the drift", async () => {
    let visibility: DocumentVisibilityState = "visible";
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
    const el = await fixture<TcGridBackground>(html`<tc-grid-background style="height: 100px"></tc-grid-background>`);
    await until(() => !el.hasAttribute("data-paused"));
    expect(el.hasAttribute("data-paused")).toBe(false);
    visibility = "hidden";
    document.dispatchEvent(new Event("visibilitychange"));
    expect(el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-gb-lines")!).animationPlayState).toBe("paused");
  });

  test("the drift rests after playFor (5 s by default); Infinity loops; speed 0 is still (2.2.2)", async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div>
      <tc-grid-background></tc-grid-background>
      <tc-grid-background speed="2" play-for="3"></tc-grid-background>
      <tc-grid-background .playFor=${Infinity}></tc-grid-background>
      <tc-grid-background speed="0"></tc-grid-background>
    </div>`);
    const [a, b, c, d] = wrap.querySelectorAll<TcGridBackground>("tc-grid-background");
    expect(passes(a)).toBe(String(5 / 3));
    expect(passes(b)).toBe("1.5");
    expect(passes(c)).toBe("infinite");
    expect(d.hasAttribute("data-static")).toBe(true);
  });

  test("a line colour and direction", async () => {
    const el = await fixture<TcGridBackground>(html`<tc-grid-background color="red" direction="up" size="10"></tc-grid-background>`);
    expect(el.style.getPropertyValue("--tc-grid-background-line")).toBe("red");
    expect(el.style.getPropertyValue("--tc-grid-background-dx")).toBe("0px");
    expect(el.style.getPropertyValue("--tc-grid-background-dy")).toBe("-10px");
    el.color = undefined;
    await settle();
    expect(el.style.getPropertyValue("--tc-grid-background-line")).toBe("");
  });

  test("dark follows data-tc-theme: no theme-scoped colour rules", () => {
    for (const [, selector, body] of TcGridBackground.css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      if (/\.dark\b|data-(?:tc-)?theme="dark"/.test(selector.replace(/\/\*[\s\S]*?\*\//g, ""))) expect(body.trim()).toBe("color-scheme: dark;");
    }
  });

  test("axe: no violations", async () => {
    const wrap = await fixture(html`<div><tc-grid-background><div style="height: 120px"><h2>Build on a solid grid</h2><button>Get started</button></div></tc-grid-background></div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
