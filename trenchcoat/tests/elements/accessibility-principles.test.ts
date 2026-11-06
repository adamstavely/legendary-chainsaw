/*
 * <tc-accessibility-principles> in real browsers: its drawing and words, its name, labels, decorative, pausing off
 * screen, finite loops, dark colours, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { TcAccessibilityPrinciples } from "../../src/elements/accessibility-principles";
import { AccessibilityPrinciples } from "../../src/elements/react/accessibility-principles";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

describe("tc-accessibility-principles", () => {
  test("draws four needs, four principles and the six connectors between them", async () => {
    const el = await fixture<TcAccessibilityPrinciples>(html`<tc-accessibility-principles></tc-accessibility-principles>`);
    expect(el.dataset.ui).toBe("acp");
    expect([...el.querySelectorAll(".ui-acp-need")].map((t) => t.textContent)).toEqual(["Visual", "Hearing", "Motor", "Cognitive"]);
    expect([...el.querySelectorAll(".ui-acp-principle")].map((t) => t.textContent)).toEqual(["Perceivable", "Operable", "Understandable", "Robust"]);
    expect(el.querySelectorAll(".ui-acp-link")).toHaveLength(6);
    expect(el.querySelectorAll(".ui-acp-head")).toHaveLength(6);
    expect(getComputedStyle(el.querySelector(".ui-acp-art")!).aspectRatio).toBe("4 / 3");
    expect(el.querySelector(".ui-acp-caption")).toBeNull();
  });

  test("its name says which principle serves which need, and label replaces it", async () => {
    const el = await fixture<TcAccessibilityPrinciples>(html`<tc-accessibility-principles></tc-accessibility-principles>`);
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe(
      "Perceivable serves visual and hearing; Operable serves motor; Understandable serves cognitive; Robust serves motor and cognitive.",
    );
    el.label = "The four principles";
    await settle();
    expect(el.getAttribute("aria-label")).toBe("The four principles");
  });

  test("labels change the words drawn and the name; caption adds words under it", async () => {
    const el = await fixture<TcAccessibilityPrinciples>(html`<tc-accessibility-principles caption="Built for every ability"></tc-accessibility-principles>`);
    el.labels = { ...el.labels, visual: "Sehen", perceivable: "Wahrnehmbar" };
    await settle();
    expect(el.querySelector(".ui-acp-need")!.textContent).toBe("Sehen");
    expect(el.querySelector(".ui-acp-initial")!.textContent).toBe("W");
    expect(el.getAttribute("aria-label")).toMatch(/^Wahrnehmbar serves sehen and hearing/);
    expect(el.querySelector(".ui-acp-caption")!.textContent).toBe("Built for every ability");
  });

  test("decorative leaves it out of the accessibility tree", async () => {
    const el = await fixture<TcAccessibilityPrinciples>(html`<tc-accessibility-principles decorative></tc-accessibility-principles>`);
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.hasAttribute("aria-label")).toBe(false);
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  test("off screen the loop holds, and runs on when it's back", async () => {
    const el = await fixture<TcAccessibilityPrinciples>(html`<tc-accessibility-principles style="position: absolute; top: 5000px; width: 200px"></tc-accessibility-principles>`);
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-acp-gear")!).animationPlayState).toBe("paused");
    el.style.top = "0";
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(false);
  });

  test("the loop is finite, and dark follows color-scheme", async () => {
    expect(TcAccessibilityPrinciples.css).not.toMatch(/\binfinite\b/);
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-accessibility-principles></tc-accessibility-principles></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-acp-tile")!).fill).toBe("rgb(42, 42, 46)");
  });

  test("React wrapper: props reach the host, and the ref gets it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcAccessibilityPrinciples>();
    await act(async () => root.render(React.createElement(AccessibilityPrinciples, { className: "mine", label: "Words", ref })));
    await settle();
    const el = host.querySelector<TcAccessibilityPrinciples>("tc-accessibility-principles")!;
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("aria-label")).toBe("Words");
    expect(ref.current).toBe(el);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations, in both themes", async () => {
    for (const scheme of ["light", "dark"]) {
      const wrap = await fixture(html`<div style=${`background: Canvas; color-scheme: ${scheme}`}><tc-accessibility-principles></tc-accessibility-principles></div>`);
      const { violations } = await axe.run(wrap);
      expect(violations.map((v) => v.id)).toEqual([]);
    }
  });
});
