/*
 * <tc-side-folder> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/side-folder";
import { TcSideFolder } from "../../src/elements/side-folder";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

describe("tc-side-folder", () => {
  test("the host is the root (no data-look: one look); classes and attributes stay on it", async () => {
    const el = await fixture<TcSideFolder>(html`<tc-side-folder class="mine" data-x="1" style="width: 300px"></tc-side-folder>`);
    expect(el.dataset.ui).toBe("sfo");
    expect(el.hasAttribute("data-look")).toBe(false);
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("data-x")).toBe("1");
    const box = el.getBoundingClientRect();
    expect(box.width / box.height).toBeCloseTo(1.5, 1);
  });

  test("decorative by default, an image when labelled", async () => {
    const el = await fixture<TcSideFolder>(html`<tc-side-folder></tc-side-folder>`);
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.getAttribute("role")).toBeNull();
    el.label = "Shared documents";
    await settle();
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Shared documents");
    expect(el.hasAttribute("aria-hidden")).toBe(false);
    el.label = "";
    await settle();
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.getAttribute("role")).toBeNull();
  });

  test("two folders don't share SVG ids", async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div><tc-side-folder></tc-side-folder><tc-side-folder></tc-side-folder></div>`);
    const ids = [...wrap.querySelectorAll("[id]")].map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    const [, b] = wrap.querySelectorAll("tc-side-folder");
    expect(b.querySelector("use")!.getAttribute("href")).toBe(`#${b.querySelector("symbol")!.id}`);
  });

  test("dark follows data-tc-theme: no theme-scoped colour rules, no endless loop", () => {
    const css = TcSideFolder.css;
    expect(css).toContain('[data-tc-theme="dark"]) { color-scheme: dark; }');
    expect(css).toContain(':where([data-tc-theme="system"]) { color-scheme: light dark; }');
    for (const [, selector, body] of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      if (/\.dark\b|data-(?:tc-)?theme="dark"/.test(selector.replace(/\/\*[\s\S]*?\*\//g, ""))) expect(body.trim()).toBe("color-scheme: dark;");
    }
    expect(css).not.toMatch(/\binfinite\b/);
  });

  test("the paper dims on a dark page", async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div data-tc-theme="dark"><tc-side-folder></tc-side-folder></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-sfo-paper-top")!).stopColor).toBe("rgb(223, 229, 234)");
  });

  test("axe: no violations, decorative and labelled", async () => {
    const wrap = await fixture(html`<div><tc-side-folder></tc-side-folder><tc-side-folder label="Shared documents"></tc-side-folder></div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
