import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/citation-badge";
import type { CitationOpen, TcCitationBadge } from "../../src/elements/citation-badge";
import { CitationBadge } from "../../src/elements/react/citation-badge";
import { cleanup, finish, fixture, settle } from "./helpers";

/*
 * <tc-citation-badge> in real browsers: the default kinds and counts, both layouts, the source line, the summary
 * name, the tooltip on hover and focus with Escape, link and button modes with a cancelable tc-open, the React
 * wrapper and axe in both looks and both themes.
 */

afterEach(cleanup);

const COUNTS = { publications: 522, supporting: 29, mentioning: 348, contrasting: 7 };
const badge = (el: Element) => el.querySelector<HTMLElement>(".ui-ctb__badge")!;
const tip = (el: Element) => el.querySelector<HTMLElement>(".ui-ctb__tip")!;
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

describe("tc-citation-badge", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: four kinds with marks and counts, named as a summary, no brand line by default`, async () => {
      const el = await fixture<TcCitationBadge>(html`<tc-citation-badge look=${look} .counts=${COUNTS}></tc-citation-badge>`);
      expect(el.dataset.ui).toBe("ctb");
      expect(el.dataset.look).toBe(look);
      expect([...el.querySelectorAll(".ui-ctb__label")].map((l) => l.textContent)).toEqual(["Publications", "Supporting", "Mentioning", "Contrasting"]);
      expect([...el.querySelectorAll(".ui-ctb__count")].map((c) => c.textContent)).toEqual(["522", "29", "348", "7"]);
      expect(el.querySelector(".ui-ctb__source")).toBeNull();
      expect(badge(el).getAttribute("role")).toBe("img");
      expect(badge(el).tabIndex).toBe(0);
      expect(badge(el).getAttribute("aria-label")).toBe("Citations: 522 publications, 29 supporting, 348 mentioning and 7 contrasting");
      expect(document.getElementById(badge(el).getAttribute("aria-describedby")!)).toBe(tip(el));
    });
  }

  test("compact: marks and counts only; a source line leads the name; missing counts are 0", async () => {
    const el = await fixture<TcCitationBadge>(html`<tc-citation-badge layout="compact" source="Larkfield Index" .counts=${{ supporting: 3 }}></tc-citation-badge>`);
    expect(el.querySelectorAll(".ui-ctb__label")).toHaveLength(0);
    expect(el.querySelectorAll(".ui-ctb__mark")).toHaveLength(4);
    expect(el.querySelector(".ui-ctb__source")!.textContent).toBe("Larkfield Index");
    expect(badge(el).getAttribute("aria-label")).toBe("Larkfield Index: 0 publications, 3 supporting, 0 mentioning and 0 contrasting");
  });

  test("the tooltip shows on hover and focus, says what each kind means, and Escape hides it", async () => {
    const el = await fixture<TcCitationBadge>(html`<tc-citation-badge .counts=${COUNTS}></tc-citation-badge>`);
    expect(getComputedStyle(tip(el)).display).toBe("none");
    el.dispatchEvent(new PointerEvent("pointerenter"));
    await expect.poll(() => getComputedStyle(tip(el)).display).toBe("grid");
    expect(tip(el).textContent).toContain("Supporting · 29 – cites this work as evidence for its claim");
    el.dispatchEvent(new PointerEvent("pointerleave"));
    await expect.poll(() => getComputedStyle(tip(el)).display).toBe("none");
    badge(el).focus();
    await expect.poll(() => getComputedStyle(tip(el)).display).toBe("grid");
    key(badge(el), "Escape");
    await expect.poll(() => getComputedStyle(tip(el)).display).toBe("none");
  });

  test("a tooltip opened by hover hides on Escape even when focus is elsewhere; the key listener goes with it", async () => {
    const el = await fixture<TcCitationBadge>(html`<tc-citation-badge .counts=${COUNTS}></tc-citation-badge>`);
    el.dispatchEvent(new PointerEvent("pointerenter"));
    await expect.poll(() => getComputedStyle(tip(el)).display).toBe("grid");
    expect(document.activeElement).not.toBe(badge(el));
    key(document.body, "Escape");
    await expect.poll(() => getComputedStyle(tip(el)).display).toBe("none");
    // Removed while open, it leaves no document listener behind
    el.dispatchEvent(new PointerEvent("pointerenter"));
    await expect.poll(() => getComputedStyle(tip(el)).display).toBe("grid");
    const removed: string[] = [];
    const real = document.removeEventListener.bind(document);
    document.removeEventListener = ((type: string, ...rest: [EventListenerOrEventListenerObject, (boolean | EventListenerOptions)?]) => {
      removed.push(type);
      real(type, ...rest);
    }) as typeof document.removeEventListener;
    try {
      el.remove();
      expect(removed).toContain("keydown");
    } finally {
      document.removeEventListener = real;
    }
  });

  test("with href it's a link; with openable a button; tc-open is cancelable", async () => {
    const link = await fixture<TcCitationBadge>(html`<tc-citation-badge href="#citations" .counts=${COUNTS}></tc-citation-badge>`);
    expect(badge(link).tagName).toBe("A");
    // A link is named by what it shows, so its spoken name contains its visible text
    expect(badge(link).hasAttribute("aria-label")).toBe(false);
    expect(badge(link).textContent!.replace(/\s+/g, " ").trim()).toBe("Publications 522 Supporting 29 Mentioning 348 Contrasting 7");
    expect(link.querySelector(".ui-ctb__tip-hint")!.textContent).toBe("See more details");
    const seen: CitationOpen[] = [];
    link.addEventListener("tc-open", (e) => {
      seen.push((e as CustomEvent<CitationOpen>).detail);
      e.preventDefault();
    });
    const before = location.hash;
    badge(link).click();
    await settle();
    expect(seen).toEqual([{ href: "#citations" }]);
    expect(location.hash).toBe(before);
    const button = await fixture<TcCitationBadge>(html`<tc-citation-badge openable .counts=${COUNTS}></tc-citation-badge>`);
    expect(badge(button).tagName).toBe("BUTTON");
    const compact = await fixture<TcCitationBadge>(html`<tc-citation-badge openable layout="compact" .counts=${COUNTS}></tc-citation-badge>`);
    expect(badge(compact).textContent!.replace(/\s+/g, " ").trim()).toBe("522 publications 29 supporting 348 mentioning 7 contrasting");
    let opened = 0;
    button.addEventListener("tc-open", () => opened++);
    badge(button).click();
    expect(opened).toBe(1);
  });

  test("custom kinds and a logo", async () => {
    const logo = document.createElement("span");
    logo.textContent = "LI";
    const el = await fixture<TcCitationBadge>(html`<tc-citation-badge .logo=${logo} .rows=${[{ id: "cites", label: "Cites", tone: "info" }]} .counts=${{ cites: 4 }}></tc-citation-badge>`);
    expect(el.querySelector(".ui-ctb__source[data-logo]")!.textContent).toBe("LI");
    expect([...el.querySelectorAll(".ui-ctb__count")].map((c) => c.textContent)).toEqual(["4"]);
    expect(badge(el).getAttribute("aria-label")).toBe("Citations: 4 cites");
  });

  test("React wrapper: onOpen returning false stops the link", async () => {
    const seen: (string | undefined)[] = [];
    const { host, root } = await react(
      React.createElement(CitationBadge, {
        href: "#more",
        counts: COUNTS,
        onOpen: (href) => {
          seen.push(href);
          return false;
        },
      }),
    );
    const before = location.hash;
    badge(host.querySelector("tc-citation-badge")!).click();
    await settle();
    expect(seen).toEqual(["#more"]);
    expect(location.hash).toBe(before);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, tooltip open`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px 16px 160px; background: var(--tc-surface-base); display: flex; gap: 24px">
        <tc-citation-badge source="Larkfield Index" href="#c" .counts=${COUNTS}></tc-citation-badge>
        <tc-citation-badge look="clean" layout="compact" .counts=${COUNTS}></tc-citation-badge>
      </div>`);
      wrap.querySelector("tc-citation-badge")!.dispatchEvent(new PointerEvent("pointerenter"));
      await settle();
      expect(await runAxe(wrap)).toEqual([]);
    });
  }
});
