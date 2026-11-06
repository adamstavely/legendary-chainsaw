/*
 * <tc-in-coordination> in real browsers: its words and name, decorative with neither, pausing off screen, finite motion, dark
 * colours, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { TcInCoordination } from "../../src/elements/in-coordination";
import { InCoordination } from "../../src/elements/react/in-coordination";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

describe("tc-in-coordination", () => {
  test("says where it stands, in visible words and in its name", async () => {
    const el = await fixture<TcInCoordination>(html`<tc-in-coordination></tc-in-coordination>`);
    expect(el.dataset.ui).toBe("icn");
    expect(el.querySelector(".ui-icn-caption")!.textContent).toBe("In coordination");
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("In coordination");
    expect(getComputedStyle(el).aspectRatio).toBe("3 / 2");
  });

  test("label says more, and with no words at all it's decorative", async () => {
    const el = await fixture<TcInCoordination>(html`<tc-in-coordination label="More detail"></tc-in-coordination>`);
    expect(el.getAttribute("aria-label")).toBe("More detail");
    el.label = "";
    el.caption = "";
    await settle();
    expect(el.querySelector(".ui-icn-caption")).toBeNull();
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  test("off screen the motion holds, and runs on when it's back", async () => {
    const el = await fixture<TcInCoordination>(html`<tc-in-coordination style="position: absolute; top: 5000px; width: 200px"></tc-in-coordination>`);
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-icn-node")!).animationPlayState).toBe("paused");
    el.style.top = "0";
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(false);
  });

  test("the motion is finite, and dark follows color-scheme", async () => {
    expect(TcInCoordination.css).not.toMatch(/\binfinite\b/);
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-in-coordination></tc-in-coordination></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-icn-page")!).fill).toBe("rgb(42, 42, 46)");
  });

  test("React wrapper: props reach the host, and the ref gets it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcInCoordination>();
    await act(async () => root.render(React.createElement(InCoordination, { className: "mine", caption: "Words", ref })));
    await settle();
    const el = host.querySelector<TcInCoordination>("tc-in-coordination")!;
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("aria-label")).toBe("Words");
    expect(ref.current).toBe(el);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations, in both themes", async () => {
    for (const scheme of ["light", "dark"]) {
      const wrap = await fixture(html`<div style=${`background: Canvas; color-scheme: ${scheme}`}><tc-in-coordination></tc-in-coordination></div>`);
      const { violations } = await axe.run(wrap);
      expect(violations.map((v) => v.id)).toEqual([]);
    }
  });
});
