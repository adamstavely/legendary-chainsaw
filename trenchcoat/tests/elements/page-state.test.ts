/*
 * <tc-page-state> in real browsers: every status's words and name, decorative with none, each scene and its colour,
 * the seven scenes moved in from their own elements keeping their shape, a caption of the page's own, pausing off
 * screen, finite motion, dark colours, the React wrapper and axe in both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { pageStateWords, TcPageState, type PageStateKind } from "../../src/elements/page-state";
import { PageState } from "../../src/elements/react/page-state";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const STATUSES = Object.keys(pageStateWords) as PageStateKind[];
const make = (status: PageStateKind, extra = "") =>
  fixture<TcPageState>(html`<tc-page-state status=${status} style=${extra}></tc-page-state>`);
const attr = (el: Element, sel: string, name: string) => el.querySelector(sel)?.getAttribute(name);

describe("tc-page-state", () => {
  test("every status says what happened in visible words and in its name, or is decorative without words", async () => {
    expect(STATUSES).toHaveLength(13);
    for (const status of STATUSES) {
      const el = await make(status);
      expect(el.dataset.ui).toBe("pgs");
      expect(el.getAttribute("status")).toBe(status);
      expect(getComputedStyle(el).aspectRatio).toBe("3 / 2");
      const words = pageStateWords[status];
      if (words) {
        expect(el.querySelector(".ui-pgs-caption")!.textContent).toBe(words);
        expect(el.getAttribute("role")).toBe("img");
        expect(el.getAttribute("aria-label")).toBe(words);
      } else {
        expect(el.querySelector(".ui-pgs-caption")).toBeNull();
        expect(el.getAttribute("aria-hidden")).toBe("true");
      }
      cleanup();
    }
    expect(pageStateWords).toMatchObject({ offline: "You're offline", "not-found": "Page not found", "region-unavailable": "Not available in your region", "nothing-found": "" });
  });

  test("label and caption name it; caption \"\" and no label make it decorative", async () => {
    const el = await make("nothing-found");
    el.label = "No cases match";
    await settle();
    expect(el.getAttribute("aria-label")).toBe("No cases match");
    el.label = "";
    el.status = "offline";
    el.caption = "Reconnecting…";
    await settle();
    expect(el.querySelector(".ui-pgs-caption")!.textContent).toBe("Reconnecting…");
    expect(el.getAttribute("aria-label")).toBe("Reconnecting…");
    el.caption = "";
    await settle();
    expect(el.querySelector(".ui-pgs-caption")).toBeNull();
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.getAttribute("aria-hidden")).toBe("true");
    el.caption = undefined;
    await settle();
    expect(el.getAttribute("aria-label")).toBe("You're offline");
  });

  test("the seven moved scenes keep their shape", async () => {
    const nf = await make("nothing-found");
    expect(nf.querySelectorAll(".ui-pgs-row")).toHaveLength(3);
    expect(attr(nf, ".ui-pgs-lens", "r")).toBe("32");
    const off = await make("offline");
    expect(attr(off, ".ui-pgs-cloud", "d")).toBe("M80 132h52a20 20 0 0 0 2-40 28 28 0 0 0-54-4 22 22 0 0 0 0 44Z");
    expect(attr(off, ".ui-pgs-link", "d")).toBe("M142 112h17M175 112h13");
    const sw = await make("something-wrong");
    expect(attr(sw, ".ui-pgs-warn", "d")).toBe("m160 60 26 46H134Z");
    expect(sw.querySelectorAll(".ui-pgs-left .ui-pgs-tile, .ui-pgs-right .ui-pgs-tile")).toHaveLength(2);
    const le = await make("link-expired");
    expect(le.querySelectorAll(".ui-pgs-chain")).toHaveLength(2);
    expect(attr(le, ".ui-pgs-hand", "d")).toBe("M206 60V47");
    const na = await make("no-access");
    expect(attr(na, ".ui-pgs-body", "width")).toBe("56");
    expect(na.querySelectorAll(".ui-pgs-key")).toHaveLength(2);
    const lr = await make("limit-reached");
    expect(attr(lr, ".ui-pgs-arc", "d")).toBe("M122 128a38 38 0 0 1 76 0");
    expect(attr(lr, ".ui-pgs-needle", "d")).toBe("M160 128 192 125");
    const fu = await make("first-use");
    expect(fu.querySelectorAll(".ui-pgs-slot")).toHaveLength(5);
    expect(attr(fu, ".ui-pgs-plus", "d")).toBe("M160 52v20M150 62h20");
    // Their colours came with them
    expect(getComputedStyle(off.querySelector(".ui-pgs-cloud")!).fill).toBe("rgb(220, 232, 251)");
    expect(getComputedStyle(sw.querySelector(".ui-pgs-warn")!).fill).toBe("rgb(251, 231, 207)");
    expect(getComputedStyle(fu.querySelector(".ui-pgs-spot-tile")!).fill).toBe("rgb(37, 99, 235)");
  });

  test("every status draws a scene, and the palettes differ – slate, blue, amber, purple", async () => {
    const marks = new Map<PageStateKind, string>();
    for (const status of STATUSES) {
      const el = await make(status);
      expect(el.querySelector(".ui-pgs-art")!.children.length).toBeGreaterThan(0);
      marks.set(status, getComputedStyle(el).getPropertyValue("--tc-page-state-mark").trim());
      cleanup();
    }
    const groups = new Set([marks.get("not-found"), marks.get("coming-soon"), marks.get("maintenance"), marks.get("access-requested")]);
    expect(groups.size).toBe(4);
    expect(marks.get("offline")).toBe(marks.get("coming-soon"));
    expect(marks.get("region-unavailable")).toBe(marks.get("not-found"));
  });

  test("off screen the motion holds, and runs on when it's back", async () => {
    const el = await make("offline", "position: absolute; top: 5000px; width: 200px");
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-pgs-link")!).animationPlayState).toBe("paused");
    el.style.top = "0";
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(false);
  });

  test("the motion is finite, and dark follows color-scheme", async () => {
    expect(TcPageState.css).not.toMatch(/\binfinite\b/);
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-page-state status="maintenance"></tc-page-state></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-pgs-tile")!).fill).toBe("rgb(42, 42, 46)");
  });

  test("React wrapper: props reach the host, and the ref gets it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcPageState>();
    await act(async () => root.render(React.createElement(PageState, { className: "mine", status: "coming-soon", ref })));
    await settle();
    const el = host.querySelector<TcPageState>("tc-page-state")!;
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("aria-label")).toBe("Coming soon");
    expect(ref.current).toBe(el);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations in every status, in both themes", async () => {
    for (const scheme of ["light", "dark"])
      for (const status of STATUSES) {
        const wrap = await fixture(html`<div style=${`background: Canvas; color-scheme: ${scheme}`}><tc-page-state status=${status}></tc-page-state></div>`);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => v.id)).toEqual([]);
      }
  });
});
