import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/citation-sections";
import type { TcCitationSections } from "../../src/elements/citation-sections";
import { CitationSections } from "../../src/elements/react/citation-sections";
import { cleanup, finish, fixture, settle } from "./helpers";

/*
 * <tc-citation-sections> in real browsers: a segment per section with citations, the shades darkest first, the
 * legend's names and shares, segment and legend highlighting each other with the readout, the roving legend, the
 * details link, the React wrapper and axe in both looks and both themes.
 */

afterEach(cleanup);

const COUNTS = { intro: 107, methods: 13, results: 11, discussion: 114, other: 120 };
const legend = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-cts__row")];
const readout = (el: Element) => el.querySelector(".ui-cts__readout")!.textContent!.replace(/\s+/g, " ").trim();
const make = (look: "standard" | "clean" = "standard") => fixture<TcCitationSections>(html`<tc-citation-sections look=${look} .counts=${COUNTS}></tc-citation-sections>`);
const runAxe = async (wrap: Element) => {
  await finish(wrap);
  const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
  return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
};
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const react = async (node: React.ReactElement) => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(node));
  await settle();
  return { host, root };
};

describe("tc-citation-sections", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: five segments, a legend named by the caption, rows read with count and share`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("cts");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelectorAll(".ui-cts__seg")).toHaveLength(5);
      const list = el.querySelector(".ui-cts__legend")!;
      expect(document.getElementById(list.getAttribute("aria-labelledby")!)!.textContent).toBe("Sections");
      expect(legend(el).map((r) => r.getAttribute("aria-label"))).toEqual([
        "Intro, 107 citations, 29%",
        "Methods, 13 citations, 4%",
        "Results, 11 citations, 3%",
        "Discussion, 114 citations, 31%",
        "Other, 120 citations, 33%",
      ]);
      expect([...el.querySelectorAll(".ui-cts__chip text")].map((t) => t.textContent)).toEqual(["I", "M", "R", "D", "O"]);
      expect(el.querySelectorAll(".ui-cts__legend [tabindex='0']")).toHaveLength(1);
      expect(readout(el)).toBe("365 in all");
      expect(el.querySelector(".ui-cts__source")).toBeNull();
    });
  }

  test("shades run darkest first; a section with no citations has no segment", async () => {
    const el = await fixture<TcCitationSections>(html`<tc-citation-sections .counts=${{ ...COUNTS, results: 0 }}></tc-citation-sections>`);
    const mixes = legend(el).map((r) => parseFloat(r.style.getPropertyValue("--tc-cts-mix")));
    expect(mixes[0]).toBe(100);
    expect(mixes).toEqual([...mixes].sort((a, b) => b - a));
    expect([...el.querySelectorAll<SVGElement>(".ui-cts__seg")].map((s) => s.dataset.seg)).toEqual(["0", "1", "3", "4"]);
  });

  test("a segment and its legend row highlight each other; the readout names the section", async () => {
    const el = await make();
    el.querySelector<SVGElement>('[data-seg="1"]')!.dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    expect(legend(el)[1].hasAttribute("data-on")).toBe(true);
    expect(readout(el)).toBe("Methods · 13 · 4%");
    el.querySelector(".ui-cts__donut")!.dispatchEvent(new PointerEvent("pointerleave"));
    await settle();
    expect(legend(el)[1].hasAttribute("data-on")).toBe(false);
    legend(el)[3].focus();
    await settle();
    expect(el.querySelector('[data-seg="3"]')!.hasAttribute("data-on")).toBe(true);
    expect(readout(el)).toBe("Discussion · 114 · 31%");
  });

  test("keyboard: ↑ ↓ Home End move along the legend", async () => {
    const el = await make();
    const at = () => document.activeElement?.getAttribute("data-row");
    legend(el)[0].focus();
    key(legend(el)[0], "ArrowDown");
    await expect.poll(at).toBe("1");
    key(document.activeElement!, "End");
    await expect.poll(at).toBe("4");
    key(document.activeElement!, "ArrowUp");
    await expect.poll(at).toBe("3");
    key(document.activeElement!, "Home");
    await expect.poll(at).toBe("0");
  });

  test("details: a link with href, a button with openable; tc-open is cancelable; a source line shows", async () => {
    const el = await fixture<TcCitationSections>(html`<tc-citation-sections source="Larkfield Index" href="#c" .counts=${COUNTS}></tc-citation-sections>`);
    expect(el.querySelector(".ui-cts__source")!.textContent).toBe("Larkfield Index");
    const more = el.querySelector<HTMLAnchorElement>("a.ui-cts__more")!;
    expect(more.textContent).toBe("See more details");
    el.addEventListener("tc-open", (e) => e.preventDefault());
    const before = location.hash;
    more.click();
    await settle();
    expect(location.hash).toBe(before);
    const button = await fixture<TcCitationSections>(html`<tc-citation-sections openable .counts=${COUNTS}></tc-citation-sections>`);
    let opened = 0;
    button.addEventListener("tc-open", () => opened++);
    button.querySelector<HTMLButtonElement>("button.ui-cts__more")!.click();
    expect(opened).toBe(1);
  });

  test("no citations: an empty ring and 0 in all", async () => {
    const el = await fixture<TcCitationSections>(html`<tc-citation-sections></tc-citation-sections>`);
    expect(el.querySelector(".ui-cts__empty-ring")).toBeTruthy();
    expect(readout(el)).toBe("0 in all");
  });

  test("React wrapper: counts and onOpen", async () => {
    let opened = 0;
    const { host, root } = await react(React.createElement(CitationSections, { counts: COUNTS, openable: true, onOpen: () => void opened++ }));
    const el = host.querySelector("tc-citation-sections")!;
    expect(legend(el)).toHaveLength(5);
    el.querySelector<HTMLButtonElement>("button.ui-cts__more")!.click();
    expect(opened).toBe(1);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-citation-sections source="Larkfield Index" href="#c" .counts=${COUNTS}></tc-citation-sections>
        <tc-citation-sections look="clean" .counts=${COUNTS}></tc-citation-sections>
      </div>`);
      expect(await runAxe(wrap)).toEqual([]);
    });
  }
});
