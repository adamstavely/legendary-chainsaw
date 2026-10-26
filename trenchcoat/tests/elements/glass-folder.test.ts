/*
 * <tc-glass-folder> in real browsers – the React component's contract and regression checks, ported, plus `open`.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/glass-folder";
import { TcGlassFolder } from "../../src/elements/glass-folder";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

/** The look at rest of its transitions */
const still = (el: Element) => el.querySelectorAll<HTMLElement | SVGElement>(".ui-fd-icon, .ui-fd-doc, .ui-fd-front").forEach((n) => (n.style.transition = "none"));
const look = (el: Element) => ({
  icon: getComputedStyle(el.querySelector(".ui-fd-icon")!).transform,
  front: getComputedStyle(el.querySelector(".ui-fd-front")!).transform,
  frontTop: getComputedStyle(el.querySelector(".ui-fd-front")!).top,
  docs: [...el.querySelectorAll(".ui-fd-doc")].map((d) => getComputedStyle(d).transform),
});

describe("tc-glass-folder", () => {
  test("the host is the root (no data-look: one look); classes and attributes stay on it", async () => {
    const el = await fixture<TcGlassFolder>(html`<tc-glass-folder class="mine" data-x="1"></tc-glass-folder>`);
    expect(el.dataset.ui).toBe("fd");
    expect(el.hasAttribute("data-look")).toBe(false);
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.dataset.x).toBe("1");
  });

  test("decorative by default and with label=\"\", an image when labelled", async () => {
    const el = await fixture<TcGlassFolder>(html`<tc-glass-folder label=""></tc-glass-folder>`);
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.getAttribute("role")).toBeNull();
    el.label = "Project files";
    await settle();
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Project files");
    el.label = "";
    await settle();
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.getAttribute("role")).toBeNull();
  });

  test("open shows the hover look on demand, and reflects", async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div style="width: 480px"><tc-glass-folder></tc-glass-folder><tc-glass-folder open></tc-glass-folder></div>`);
    const [closed, open] = wrap.querySelectorAll<TcGlassFolder>("tc-glass-folder");
    still(closed);
    still(open);
    expect(open.open).toBe(true);
    const a = look(closed);
    const b = look(open);
    expect(b.icon).not.toBe(a.icon);
    expect(b.front).not.toBe(a.front);
    expect(b.docs.every((d, i) => d !== a.docs[i])).toBe(true);
    // The pocket drops to 24.8 % of the icon
    const iconH = open.querySelector<HTMLElement>(".ui-fd-icon")!.offsetHeight;
    expect(parseFloat(b.frontTop) / iconH).toBeCloseTo(0.248, 2);
    closed.open = true;
    await settle();
    expect(closed.hasAttribute("open")).toBe(true);
    expect(look(closed)).toEqual(b);
    closed.open = false;
    await settle();
    expect(closed.hasAttribute("open")).toBe(false);
    expect(look(closed)).toEqual(a);
  });

  test("open uses the hover rules themselves: every :hover rule also matches [open]", () => {
    const rules = [...TcGlassFolder.css.matchAll(/([^{}]*)\{[^{}]*\}/g)].map((m) => m[1].trim()).filter((s) => s.includes(":hover"));
    expect(rules.length).toBe(5);
    for (const sel of rules) expect(sel).toContain('[data-ui="fd"][open] .ui-fd-icon');
  });

  test("two folders don't share SVG ids", async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div><tc-glass-folder></tc-glass-folder><tc-glass-folder></tc-glass-folder></div>`);
    const ids = [...wrap.querySelectorAll("[id]")].map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("dark follows .dark, data-theme, data-tc-theme and system alike; no endless loop", async () => {
    const css = TcGlassFolder.css;
    expect(css).toContain(':where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }');
    expect(css).toContain(':where([data-tc-theme="system"]) { color-scheme: light dark; }');
    for (const [, selector, body] of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      if (/\.dark\b|data-(?:tc-)?theme="dark"/.test(selector.replace(/\/\*[\s\S]*?\*\//g, ""))) expect(body.trim()).toBe("color-scheme: dark;");
    }
    expect([...css.matchAll(/animation:[^;]*\binfinite\b[^;]*;/g)]).toEqual([]);
    const wrap = await fixture<HTMLDivElement>(html`<div data-tc-theme="dark"><tc-glass-folder></tc-glass-folder></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-fd-back-fill")!).fill).toBe("rgb(61, 143, 198)");
  });

  test("axe: no violations, decorative, labelled and open", async () => {
    const wrap = await fixture(html`<div><tc-glass-folder></tc-glass-folder><tc-glass-folder open label="Project files"></tc-glass-folder></div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
