/*
 * <tc-pending-release> in real browsers: its words and name, decorative with neither, pausing off screen, finite motion, dark
 * colours, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { TcPendingRelease } from "../../src/elements/pending-release";
import { PendingRelease } from "../../src/elements/react/pending-release";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

describe("tc-pending-release", () => {
  test("says where it stands, in visible words and in its name", async () => {
    const el = await fixture<TcPendingRelease>(html`<tc-pending-release></tc-pending-release>`);
    expect(el.dataset.ui).toBe("pnr");
    expect(el.querySelector(".ui-pnr-caption")!.textContent).toBe("Pending release");
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Pending release");
    expect(getComputedStyle(el).aspectRatio).toBe("3 / 2");
  });

  test("label says more, and with no words at all it's decorative", async () => {
    const el = await fixture<TcPendingRelease>(html`<tc-pending-release label="More detail"></tc-pending-release>`);
    expect(el.getAttribute("aria-label")).toBe("More detail");
    el.label = "";
    el.caption = "";
    await settle();
    expect(el.querySelector(".ui-pnr-caption")).toBeNull();
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  test("off screen the motion holds, and runs on when it's back", async () => {
    const el = await fixture<TcPendingRelease>(html`<tc-pending-release style="position: absolute; top: 5000px; width: 200px"></tc-pending-release>`);
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-pnr-motif")!).animationPlayState).toBe("paused");
    el.style.top = "0";
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(false);
  });

  test("the motion is finite, and dark follows color-scheme", async () => {
    expect(TcPendingRelease.css).not.toMatch(/\binfinite\b/);
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-pending-release></tc-pending-release></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-pnr-page")!).fill).toBe("rgb(42, 42, 46)");
  });

  test("React wrapper: props reach the host, and the ref gets it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcPendingRelease>();
    await act(async () => root.render(React.createElement(PendingRelease, { className: "mine", caption: "Words", ref })));
    await settle();
    const el = host.querySelector<TcPendingRelease>("tc-pending-release")!;
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("aria-label")).toBe("Words");
    expect(ref.current).toBe(el);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations, in both themes", async () => {
    for (const scheme of ["light", "dark"]) {
      const wrap = await fixture(html`<div style=${`background: Canvas; color-scheme: ${scheme}`}><tc-pending-release></tc-pending-release></div>`);
      const { violations } = await axe.run(wrap);
      expect(violations.map((v) => v.id)).toEqual([]);
    }
  });
});
