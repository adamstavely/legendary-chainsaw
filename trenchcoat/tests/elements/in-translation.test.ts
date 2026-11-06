/*
 * <tc-in-translation> in real browsers: its words and name, decorative with neither, pausing off screen, finite motion, dark
 * colours, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { TcInTranslation } from "../../src/elements/in-translation";
import { InTranslation } from "../../src/elements/react/in-translation";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

describe("tc-in-translation", () => {
  test("says where it stands, in visible words and in its name", async () => {
    const el = await fixture<TcInTranslation>(html`<tc-in-translation></tc-in-translation>`);
    expect(el.dataset.ui).toBe("itn");
    expect(el.querySelector(".ui-itn-caption")!.textContent).toBe("In translation");
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("In translation");
    expect(getComputedStyle(el).aspectRatio).toBe("3 / 2");
  });

  test("label says more, and with no words at all it's decorative", async () => {
    const el = await fixture<TcInTranslation>(html`<tc-in-translation label="More detail"></tc-in-translation>`);
    expect(el.getAttribute("aria-label")).toBe("More detail");
    el.label = "";
    el.caption = "";
    await settle();
    expect(el.querySelector(".ui-itn-caption")).toBeNull();
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  test("off screen the motion holds, and runs on when it's back", async () => {
    const el = await fixture<TcInTranslation>(html`<tc-in-translation style="position: absolute; top: 5000px; width: 200px"></tc-in-translation>`);
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-itn-motif")!).animationPlayState).toBe("paused");
    el.style.top = "0";
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(false);
  });

  test("the motion is finite, and dark follows color-scheme", async () => {
    expect(TcInTranslation.css).not.toMatch(/\binfinite\b/);
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-in-translation></tc-in-translation></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-itn-page")!).fill).toBe("rgb(42, 42, 46)");
  });

  test("React wrapper: props reach the host, and the ref gets it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcInTranslation>();
    await act(async () => root.render(React.createElement(InTranslation, { className: "mine", caption: "Words", ref })));
    await settle();
    const el = host.querySelector<TcInTranslation>("tc-in-translation")!;
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("aria-label")).toBe("Words");
    expect(ref.current).toBe(el);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations, in both themes", async () => {
    for (const scheme of ["light", "dark"]) {
      const wrap = await fixture(html`<div style=${`background: Canvas; color-scheme: ${scheme}`}><tc-in-translation></tc-in-translation></div>`);
      const { violations } = await axe.run(wrap);
      expect(violations.map((v) => v.id)).toEqual([]);
    }
  });
});
