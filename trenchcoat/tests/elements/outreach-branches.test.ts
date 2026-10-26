/*
 * <tc-outreach-branches> in real browsers – the illustration's contract and regression checks, ported, plus its theme
 * and motion behaviour and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { TcOutreachBranches } from "../../src/elements/outreach-branches";
import { OutreachBranches } from "../../src/elements/react/outreach-branches";
import { cleanup, fixture, settle } from "./helpers";

let hidden = false;
afterEach(() => {
  cleanup();
  hidden = false;
  // @ts-expect-error – drop the own-property override, back to the browser's getter
  delete document.visibilityState;
});
const hideTab = async (on: boolean) => {
  hidden = on;
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hidden ? "hidden" : "visible") });
  document.dispatchEvent(new Event("visibilitychange"));
  await settle();
};

describe("tc-outreach-branches", () => {
  test("the host is the root; three tiles, three lines and the pulses; decorative without a label", async () => {
    const el = await fixture<TcOutreachBranches>(html`<tc-outreach-branches></tc-outreach-branches>`);
    expect(el.dataset.ui).toBe("obr");
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.querySelectorAll(".ui-obr-tile")).toHaveLength(3);
    expect(el.querySelectorAll(".ui-obr-lines path")).toHaveLength(3);
    // Per branch: one line pulse and two around the tile, each four stacked dashes
    expect(el.querySelectorAll(".ui-obr-flow")).toHaveLength(12);
    expect(el.querySelectorAll(".ui-obr-wrap")).toHaveLength(24);
    const flow = el.querySelector<SVGPathElement>(".ui-obr-flow")!;
    expect(flow.style.strokeDasharray.replace(/px/g, "")).toBe("36, 200");
    expect(flow.style.getPropertyValue("--from")).toBe("36");
    expect(flow.style.getPropertyValue("--to")).toBe("-100");
    expect(getComputedStyle(el).aspectRatio).toBe("3 / 2");
  });

  test("decorative with an empty label, an image when labelled, decorative again without", async () => {
    const el = await fixture<TcOutreachBranches>(html`<tc-outreach-branches label=""></tc-outreach-branches>`);
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.getAttribute("role")).toBeNull();
    el.label = "Outreach across Gmail, Slack and Notion";
    await settle();
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Outreach across Gmail, Slack and Notion");
    expect(el.getAttribute("aria-hidden")).toBeNull();
    el.label = "";
    await settle();
    expect(el.getAttribute("role")).toBeNull();
    expect(el.getAttribute("aria-label")).toBeNull();
  });

  test("pauses while the tab is hidden", async () => {
    const el = await fixture<TcOutreachBranches>(html`<tc-outreach-branches></tc-outreach-branches>`);
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(false);
    await hideTab(true);
    expect(el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-obr-flow")!).animationPlayState).toBe("paused");
    await hideTab(false);
    expect(el.hasAttribute("data-paused")).toBe(false);
  });

  test("off screen the loops hold, and run on when it's back", async () => {
    const el = await fixture<TcOutreachBranches>(html`<tc-outreach-branches style="position: absolute; top: 5000px; width: 200px"></tc-outreach-branches>`);
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(true);
    el.style.top = "0";
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(false);
  });

  test("each instance has its own filter and gradient ids, and every reference stays inside it", async () => {
    const wrap = await fixture(html`<div><tc-outreach-branches></tc-outreach-branches><tc-outreach-branches></tc-outreach-branches></div>`);
    const [a, b] = [...wrap.querySelectorAll("tc-outreach-branches")];
    const ids = (el: Element) => [...el.querySelectorAll("[id]")].map((n) => n.id);
    expect(ids(a)).toHaveLength(7);
    expect(ids(a).filter((id) => ids(b).includes(id))).toEqual([]);
    for (const el of [a, b]) {
      const refs = [...el.querySelectorAll("[fill^='url('], [filter^='url('], [stroke^='url(']")].flatMap((n) =>
        ["fill", "filter", "stroke"].map((attr) => n.getAttribute(attr)?.match(/^url\(#(.+)\)$/)?.[1]).filter(Boolean),
      );
      expect(refs.length).toBeGreaterThan(0);
      for (const ref of refs) expect(el.querySelector(`[id="${ref}"]`), ref).toBeTruthy();
    }
  });

  test("dark follows color-scheme alone (no theme-scoped rules below the root); the pulses run three rounds", () => {
    const css = TcOutreachBranches.css;
    expect(css).toContain(':where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }');
    expect(css).toContain(':where([data-tc-theme="system"]) { color-scheme: light dark; }');
    for (const [, selector, body] of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      if (/\.dark\b|data-(?:tc-)?theme="dark"/.test(selector.replace(/\/\*[\s\S]*?\*\//g, ""))) expect(body.trim()).toBe("color-scheme: dark;");
    }
    expect(css).not.toMatch(/\binfinite\b/);
    expect(css).toMatch(/animation-iteration-count: 3;/);
  });

  test("dark theme: the tiles take their dark colours from light-dark()", async () => {
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-outreach-branches></tc-outreach-branches></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-obr-tile")!).fill).toBe("rgb(35, 35, 38)");
  });

  test("React wrapper: className is merged, DOM props reach the host, and the ref gets the host", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcOutreachBranches>();
    await act(async () =>
      root.render(React.createElement(OutreachBranches, { className: "consumer-class", "data-consumer": "yes", "aria-describedby": "consumer", label: "Outreach across Gmail, Slack and Notion", ref } as React.ComponentProps<typeof OutreachBranches>)),
    );
    await settle();
    const el = host.querySelector<TcOutreachBranches>("tc-outreach-branches")!;
    expect(el.classList.contains("consumer-class")).toBe(true);
    expect(el.dataset.ui).toBe("obr");
    expect(el.getAttribute("data-consumer")).toBe("yes");
    expect(el.getAttribute("aria-describedby")).toBe("consumer");
    expect(el.getAttribute("aria-label")).toBe("Outreach across Gmail, Slack and Notion");
    expect(ref.current).toBe(el);
    await act(async () => root.unmount());
  });

  test("axe: no violations, decorative and labelled", async () => {
    const wrap = await fixture(html`<div>
      <tc-outreach-branches></tc-outreach-branches>
      <tc-outreach-branches label="Outreach across Gmail, Slack and Notion"></tc-outreach-branches>
    </div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
