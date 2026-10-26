/*
 * <tc-ghosted-chat> in real browsers – the illustration's contract and regression checks, ported, plus scaling,
 * arrival, theme and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { TcGhostedChat } from "../../src/elements/ghosted-chat";
import { GhostedChat } from "../../src/elements/react/ghosted-chat";
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

describe("tc-ghosted-chat", () => {
  test("the host is the root; decorative with an empty label, an image when labelled", async () => {
    const el = await fixture<TcGhostedChat>(html`<tc-ghosted-chat label=""></tc-ghosted-chat>`);
    expect(el.dataset.ui).toBe("gc");
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.getAttribute("role")).toBeNull();
    el.label = "Nothing scheduled";
    await settle();
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Nothing scheduled");
    expect(el.getAttribute("aria-hidden")).toBeNull();
  });

  test("the artboard scales to the host's width, and follows it", async () => {
    const el = await fixture<TcGhostedChat>(html`<tc-ghosted-chat style="width: 720px"></tc-ghosted-chat>`);
    const stage = el.querySelector<HTMLElement>(".ui-gc-stage")!;
    await expect.poll(() => stage.style.transform).toBe("scale(2)");
    expect(stage.style.visibility).toBe("visible");
    expect(el.getBoundingClientRect().height).toBeCloseTo(480, 0);
    el.style.width = "180px";
    await expect.poll(() => stage.style.transform).toBe("scale(0.5)");
  });

  test("the messages arrive once the scene is in view", async () => {
    const el = await fixture<TcGhostedChat>(html`<tc-ghosted-chat style="position: absolute; top: 5000px; width: 360px"></tc-ghosted-chat>`);
    const stage = el.querySelector<HTMLElement>(".ui-gc-stage")!;
    await new Promise((r) => setTimeout(r, 100));
    expect(stage.hasAttribute("data-play")).toBe(false);
    el.style.top = "0";
    await expect.poll(() => stage.hasAttribute("data-play")).toBe(true);
  });

  test("pauses while the tab is hidden", async () => {
    const el = await fixture<TcGhostedChat>(html`<tc-ghosted-chat></tc-ghosted-chat>`);
    await expect.poll(() => el.hasAttribute("data-paused")).toBe(false);
    await hideTab(true);
    expect(el.hasAttribute("data-paused")).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-gc-shine")!).animationPlayState).toBe("paused");
    await hideTab(false);
    expect(el.hasAttribute("data-paused")).toBe(false);
  });

  test("the shine moves by transform only and runs a few times, not forever (WCAG 2.2.2)", () => {
    const css = TcGhostedChat.css;
    const shine = css.match(/\.ui-gc-shine \{[^}]*\}/)![0];
    expect(shine).toMatch(/animation: ui-gc-shine [^;]* 3 both/);
    expect(css).not.toMatch(/background-position/);
    expect(css).not.toMatch(/\binfinite\b/);
  });

  test("dark follows color-scheme alone (no theme-scoped rules below the root)", async () => {
    const css = TcGhostedChat.css;
    expect(css).toContain(':where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }');
    expect(css).toContain(':where([data-tc-theme="system"]) { color-scheme: light dark; }');
    for (const [, selector, body] of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      if (/\.dark\b|data-(?:tc-)?theme="dark"/.test(selector.replace(/\/\*[\s\S]*?\*\//g, ""))) expect(body.trim()).toBe("color-scheme: dark;");
    }
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-ghosted-chat></tc-ghosted-chat></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-gc-bubble")!).backgroundColor).toBe("rgb(35, 35, 38)");
  });

  test("React wrapper: className is merged, DOM props reach the host, and the ref gets the host", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcGhostedChat>();
    await act(async () =>
      root.render(React.createElement(GhostedChat, { className: "consumer-class", "data-consumer": "yes", "aria-describedby": "consumer", ref } as React.ComponentProps<typeof GhostedChat>)),
    );
    await settle();
    const el = host.querySelector<TcGhostedChat>("tc-ghosted-chat")!;
    expect(el.classList.contains("consumer-class")).toBe(true);
    expect(el.dataset.ui).toBe("gc");
    expect(el.getAttribute("data-consumer")).toBe("yes");
    expect(el.getAttribute("aria-describedby")).toBe("consumer");
    expect(ref.current).toBe(el);
    await act(async () => root.unmount());
  });

  test("axe: no violations, decorative and labelled", async () => {
    const wrap = await fixture(html`<div><tc-ghosted-chat></tc-ghosted-chat><tc-ghosted-chat label="Messages left on read"></tc-ghosted-chat></div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
