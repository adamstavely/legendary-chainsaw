/*
 * <tc-gradient-text> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/gradient-text";
import { TcGradientText } from "../../src/elements/gradient-text";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  delete (document as { visibilityState?: unknown }).visibilityState;
});

const until = async (check: () => boolean, ms = 2000) => {
  const end = performance.now() + ms;
  while (!check() && performance.now() < end) await new Promise((r) => setTimeout(r, 16));
};
const passes = (el: HTMLElement) => el.style.getPropertyValue("--tc-gradient-text-passes");

describe("tc-gradient-text", () => {
  test("the host is the root (no data-look: one look); classes, attributes and the caller's style stay on it", async () => {
    const el = await fixture<TcGradientText>(html`<tc-gradient-text class="mine" data-consumer="yes" style="margin-top: 4px" speed="5" text="Ship"></tc-gradient-text>`);
    expect(el.dataset.ui).toBe("gt");
    expect(el.hasAttribute("data-look")).toBe(false);
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("data-consumer")).toBe("yes");
    expect(el.style.marginTop).toBe("4px");
    expect(el.style.getPropertyValue("--tc-gradient-text-speed")).toBe("5s");
  });

  test("the real text carries screen readers; the gradient copy is hidden", async () => {
    const el = await fixture<TcGradientText>(html`<tc-gradient-text text="Ship faster"></tc-gradient-text>`);
    expect(el.querySelector(".ui-gt__base")!.textContent).toBe("Ship faster");
    expect(el.querySelector(".ui-gt__fill")!.getAttribute("aria-hidden")).toBe("true");
  });

  test("the colour sweeps in once the text is seen; sweep off shows it at once", async () => {
    const el = await fixture<TcGradientText>(html`<tc-gradient-text text="Ship"></tc-gradient-text>`);
    expect(el.hasAttribute("data-sweep")).toBe(true);
    await until(() => el.dataset.state === "in");
    expect(el.dataset.state).toBe("in");
    const off = await fixture<TcGradientText>(html`<tc-gradient-text sweep="false" text="Ship"></tc-gradient-text>`);
    expect(off.sweep).toBe(false);
    expect(off.dataset.state).toBe("in");
    expect(off.hasAttribute("data-sweep")).toBe(false);
  });

  test("a hidden tab pauses the flow", async () => {
    let visibility: DocumentVisibilityState = "visible";
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
    const el = await fixture<TcGradientText>(html`<tc-gradient-text sweep="false" text="Ship faster"></tc-gradient-text>`);
    await until(() => !el.hasAttribute("data-paused"));
    expect(el.hasAttribute("data-paused")).toBe(false);
    visibility = "hidden";
    document.dispatchEvent(new Event("visibilitychange"));
    expect(el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-gt__fill")!).animationPlayState).toBe("paused");
    visibility = "visible";
    document.dispatchEvent(new Event("visibilitychange"));
    expect(el.hasAttribute("data-paused")).toBe(false);
  });

  test("off screen pauses the flow", async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div style="height: 100px; overflow: auto"><tc-gradient-text text="Ship"></tc-gradient-text><div style="height: 2000px"></div></div>`);
    const el = wrap.querySelector("tc-gradient-text")!;
    wrap.scrollTop = 1500;
    await until(() => el.hasAttribute("data-paused"));
    expect(el.hasAttribute("data-paused")).toBe(true);
  });

  test("the flow rests after playFor, on a whole quarter cycle; Infinity loops (2.2.2)", async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div>
      <tc-gradient-text text="a"></tc-gradient-text>
      <tc-gradient-text speed="6" play-for="9" text="b"></tc-gradient-text>
      <tc-gradient-text .playFor=${Infinity} text="c"></tc-gradient-text>
    </div>`);
    const [a, b, c] = wrap.querySelectorAll<TcGradientText>("tc-gradient-text");
    expect(passes(a)).toBe("0.5"); // 5 s of an 8 s cycle → 2 quarters
    expect(passes(b)).toBe("1.5");
    expect(passes(c)).toBe("infinite");
  });

  test("colours fill in the missing stops, and clear again", async () => {
    const el = await fixture<TcGradientText>(html`<tc-gradient-text .colors=${["red", "blue"]} text="x"></tc-gradient-text>`);
    const v = (n: number) => el.style.getPropertyValue(`--tc-gradient-text-c${n}`);
    expect([v(1), v(2), v(3), v(4)]).toEqual(["red", "blue", "red", "blue"]);
    el.colors = undefined;
    await settle();
    expect(v(1)).toBe("");
  });

  test("as h1/h2 makes the host a heading; the CSS keeps the parent's font", async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div style="font-size: 40px"><tc-gradient-text as="h1" text="Ship"></tc-gradient-text></div>`);
    const el = wrap.firstElementChild as TcGradientText;
    expect(el.getAttribute("role")).toBe("heading");
    expect(el.getAttribute("aria-level")).toBe("1");
    expect(getComputedStyle(el).fontSize).toBe("40px");
    expect(getComputedStyle(el).display).toBe("inline-block");
  });

  test("rich content is cloned for the text and its copy", async () => {
    const b = document.createElement("b");
    b.textContent = "liquid";
    const el = await fixture<TcGradientText>(html`<tc-gradient-text .content=${b}></tc-gradient-text>`);
    expect(el.querySelectorAll("b").length).toBe(2);
  });

  test("dark follows data-tc-theme: no theme-scoped colour rules", () => {
    for (const [, selector, body] of TcGradientText.css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      if (/\.dark\b|data-(?:tc-)?theme="dark"/.test(selector.replace(/\/\*[\s\S]*?\*\//g, ""))) expect(body.trim()).toBe("color-scheme: dark;");
    }
  });

  test("axe: no violations, once the colour has arrived", async () => {
    const wrap = await fixture(html`<div style="font-size: 40px; font-weight: 800"><tc-gradient-text as="h1" sweep="false" text="Ship faster"></tc-gradient-text></div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
