/*
 * <tc-skeleton> and <tc-shimmer-text> in real browsers – the React components' contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/shimmer-loader";
import { TcShimmerText, TcSkeleton } from "../../src/elements/shimmer-loader";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const until = async (check: () => boolean, ms = 2000) => {
  const end = performance.now() + ms;
  while (!check() && performance.now() < end) await new Promise((r) => setTimeout(r, 16));
};

describe("tc-skeleton", () => {
  test("the host is the root; classes and DOM attributes stay on it", async () => {
    const el = await fixture<TcSkeleton>(html`<tc-skeleton class="mine" data-consumer="yes" width="120"></tc-skeleton>`);
    expect(el.dataset.ui).toBe("shm");
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("data-consumer")).toBe("yes");
    expect(el.style.width).toBe("120px");
    expect(getComputedStyle(el).height).toBe("12px");
  });

  test("sizes: numbers are px, strings any length; circle uses width for both sides", async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div style="width: 400px">
      <tc-skeleton width="45%" .height=${10} radius="8"></tc-skeleton>
      <tc-skeleton circle .width=${40}></tc-skeleton>
    </div>`);
    const [a, b] = wrap.querySelectorAll<TcSkeleton>("tc-skeleton");
    expect(a.style.width).toBe("45%");
    expect(a.style.height).toBe("10px");
    expect(a.style.borderRadius).toBe("8px");
    expect(b.getBoundingClientRect().width).toBe(40);
    expect(b.getBoundingClientRect().height).toBe(40);
    expect(b.style.borderRadius).toBe("50%");
    b.circle = false;
    b.width = undefined;
    await settle();
    expect(b.style.width).toBe("");
    expect(b.style.borderRadius).toBe("");
  });

  test("hidden from assistive tech unless the caller says otherwise", async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div><tc-skeleton></tc-skeleton><tc-skeleton aria-hidden="false" aria-label="Loading avatar"></tc-skeleton></div>`);
    const [a, b] = wrap.querySelectorAll("tc-skeleton");
    expect(a.getAttribute("aria-hidden")).toBe("true");
    expect(b.getAttribute("aria-hidden")).toBe("false");
  });

  test("the sweeps move on transform, never background-position, and rest after a few passes (2.2.2)", () => {
    const css = TcSkeleton.css;
    expect(css).not.toMatch(/background-position/);
    expect(css).not.toMatch(/infinite;/);
    expect(css).toMatch(/--tc-shimmer-loader-passes: 3;/);
    expect(css).toMatch(/@keyframes ui-shm-sweep \{\s*from \{ transform: translateX\(-100%\); \}/);
  });

  test("off screen a shimmer gets data-off (its sweep holds); back on screen it runs again", async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div style="height: 100px; overflow: auto">
      <tc-skeleton></tc-skeleton><tc-shimmer-text text="Thinking…"></tc-shimmer-text><div style="height: 2000px"></div>
    </div>`);
    const block = wrap.querySelector("tc-skeleton")!;
    const text = wrap.querySelector("tc-shimmer-text")!;
    wrap.scrollTop = 1500;
    await until(() => block.hasAttribute("data-off") && text.hasAttribute("data-off"));
    expect(block.hasAttribute("data-off") && text.hasAttribute("data-off")).toBe(true);
    expect(getComputedStyle(block, "::after").animationPlayState).toBe("paused");
    wrap.scrollTop = 0;
    await until(() => !block.hasAttribute("data-off"));
    expect(block.hasAttribute("data-off")).toBe(false);
  });

  test("removed from the page, it stops being watched", async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div style="height: 100px; overflow: auto"><tc-skeleton></tc-skeleton><div style="height: 2000px"></div></div>`);
    const block = wrap.querySelector("tc-skeleton")!;
    block.remove();
    wrap.scrollTop = 1500;
    await new Promise((r) => setTimeout(r, 150));
    expect(block.hasAttribute("data-off")).toBe(false);
  });
});

describe("tc-shimmer-text", () => {
  test("the host is the root; the duration is a variable on it", async () => {
    const el = await fixture<TcShimmerText>(html`<tc-shimmer-text class="mine" role="status" duration="3" text="Thinking…"></tc-shimmer-text>`);
    expect(el.dataset.ui).toBe("shm-text");
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("role")).toBe("status");
    expect(el.style.getPropertyValue("--tc-shimmer-loader-text-dur")).toBe("3s");
  });

  test("reads once: the brighter copy in the band is hidden from assistive tech", async () => {
    const el = await fixture<TcShimmerText>(html`<tc-shimmer-text role="status" text="Thinking…"></tc-shimmer-text>`);
    const band = el.querySelector(".ui-shm-text__clip")!;
    expect(band.getAttribute("aria-hidden")).toBe("true");
    expect(band.textContent).toBe("Thinking…");
    expect(el.textContent).toBe("Thinking…Thinking…");
    // The label's own colour is real text colour (contrast), not a transparent fill
    expect(TcShimmerText.css).toMatch(/\[data-ui="shm-text"\] \{[^}]*color: var\(--tc-text-muted/);
    expect(TcShimmerText.css).not.toMatch(/text-fill-color: transparent/);
  });

  test("rich content is cloned for the label and the band", async () => {
    const b = document.createElement("b");
    b.textContent = "Working";
    const el = await fixture<TcShimmerText>(html`<tc-shimmer-text .content=${b}></tc-shimmer-text>`);
    expect(el.querySelectorAll("b").length).toBe(2);
    expect(b.isConnected).toBe(false);
  });

  test("axe: no violations", async () => {
    const wrap = await fixture(html`<div>
      <tc-skeleton></tc-skeleton>
      <tc-skeleton aria-hidden="false" role="img" aria-label="Loading avatar" circle width="40"></tc-skeleton>
      <tc-shimmer-text role="status" text="Thinking…"></tc-shimmer-text>
    </div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
