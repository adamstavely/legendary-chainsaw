/*
 * The checks every document-status illustration shares (internal/doc-stage.ts): its words and name, decorative with
 * neither, pausing off screen, finite motion, dark colours, the React wrapper and axe. Each illustration's own test
 * file calls docStageBasics and adds what's particular to it.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, test } from "vitest";
import type { DocStage } from "../../src/elements/internal/doc-stage";
import { fixture, settle } from "./helpers";

export function docStageBasics(o: { tag: string; ui: string; caption: string; css: string; moving: string; tile?: "page" | "book"; react: React.ElementType }) {
  /** The illustration inside a wrapper, with these attributes and inline style */
  const make = async (attrs: Record<string, string> = {}, wrapStyle = "") => {
    const wrap = await fixture<HTMLElement>(html`<div style=${wrapStyle}></div>`);
    const el = document.createElement(o.tag) as DocStage;
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    wrap.append(el);
    await el.updateComplete;
    return el;
  };

  test("says where it stands, in visible words and in its name", async () => {
    const el = await make();
    expect(el.dataset.ui).toBe(o.ui);
    expect(el.querySelector(`.ui-${o.ui}-caption`)!.textContent).toBe(o.caption);
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe(o.caption);
    expect(getComputedStyle(el).aspectRatio).toBe("3 / 2");
    expect(el.querySelector(`.ui-${o.ui}-badge`)).not.toBeNull();
    // The book's spine and bookmark, or the page's folded corner
    expect(el.querySelector(`.ui-${o.ui}-ribbon`) !== null).toBe(o.tile === "book");
  });

  test("label says more, and with no words at all it's decorative", async () => {
    const el = await make({ label: "More detail" });
    expect(el.getAttribute("aria-label")).toBe("More detail");
    el.label = "";
    el.caption = "";
    await settle();
    expect(el.querySelector(`.ui-${o.ui}-caption`)).toBeNull();
    expect(el.hasAttribute("role")).toBe(false);
    expect(el.getAttribute("aria-hidden")).toBe("true");
  });

  test("off screen the motion holds, and runs on when it's back", async () => {
    const el = await make({ style: "position: absolute; top: 5000px; width: 200px" });
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(`.ui-${o.ui}-${o.moving}`)!).animationPlayState).toBe("paused");
    el.style.top = "0";
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(false);
  });

  test("the motion is finite, and dark follows color-scheme", async () => {
    expect(o.css).not.toMatch(/\binfinite\b/);
    const el = await make();
    el.parentElement!.setAttribute("data-tc-theme", "dark");
    await settle();
    expect(getComputedStyle(el.querySelector(`.ui-${o.ui}-page`)!).fill).toBe("rgb(42, 42, 46)");
  });

  test("React wrapper: props reach the host, and the ref gets it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<DocStage>();
    await act(async () => root.render(React.createElement(o.react, { className: "mine", caption: "Words", ref })));
    await settle();
    const el = host.querySelector<DocStage>(o.tag)!;
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.getAttribute("aria-label")).toBe("Words");
    expect(ref.current).toBe(el);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations, in both themes", async () => {
    for (const scheme of ["light", "dark"]) {
      const el = await make({}, `background: Canvas; color-scheme: ${scheme}`);
      const { violations } = await axe.run(el.parentElement!);
      expect(violations.map((v) => v.id)).toEqual([]);
    }
  });

  return make;
}
