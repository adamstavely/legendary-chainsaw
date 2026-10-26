/*
 * <tc-glow-keyboard> in real browsers – the illustration's contract and regression checks, ported: the demo stops
 * typing in hidden tabs and carries on when it's back; Enter while an IME composes doesn't send; each prompt is typed
 * once, then the scene rests and the loop stops (WCAG 2.2.2); the pill shows a focus ring; removing it mid-demo leaves
 * no timers. Plus the user's own typing, tc-submit, theme and accessibility.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/glow-keyboard";
import { TcGlowKeyboard, type GlowKeyboardSubmit } from "../../src/elements/glow-keyboard";
import { GlowKeyboard } from "../../src/elements/react/glow-keyboard";
import { cleanup, fixture, settle } from "./helpers";

let hidden = false;
beforeEach(() => {
  hidden = false;
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hidden ? "hidden" : "visible") });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  // @ts-expect-error – drop the own-property override, back to the prototype's getter
  delete document.visibilityState;
  cleanup();
});

const fake = () => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
const advance = async (ms: number) => {
  for (let t = 0; t < ms; t += 16) {
    vi.advanceTimersByTime(16);
    await Promise.resolve();
  }
};
const frame = () => new Promise((r) => requestAnimationFrame(r));
/** Waits (on animation frames, which aren't faked) until the scene has seen itself on screen */
const started = async (el: Element) => {
  for (let i = 0; i < 120 && !el.hasAttribute("data-in"); i++) await frame();
  expect(el.hasAttribute("data-in")).toBe(true);
};
const setHidden = (h: boolean) => {
  hidden = h;
  document.dispatchEvent(new Event("visibilitychange"));
};
const input = (el: Element) => el.querySelector<HTMLInputElement>("input.ui-gk-prompt")!;

describe("tc-glow-keyboard", () => {
  test("the host is the root and a group named by the label; the input is named by the placeholder", async () => {
    const el = await fixture<TcGlowKeyboard>(html`<tc-glow-keyboard></tc-glow-keyboard>`);
    expect(el.dataset.ui).toBe("gk");
    expect(el.getAttribute("role")).toBe("group");
    expect(el.getAttribute("aria-label")).toBe("AI chat input above a glass keyboard and a moving colour gradient");
    expect(input(el).getAttribute("aria-label")).toBe("Ask AI anything...");
    expect(input(el).placeholder).toBe("Ask AI anything...");
    expect(el.querySelectorAll(".ui-gk-key")).toHaveLength(79);
    el.label = "Keyboard scene";
    el.placeholder = "Ask me";
    await settle();
    expect(el.getAttribute("aria-label")).toBe("Keyboard scene");
    expect(input(el).getAttribute("aria-label")).toBe("Ask me");
  });

  test("a name the page gives stays", async () => {
    const el = await fixture<TcGlowKeyboard>(html`<tc-glow-keyboard aria-label="Demo"></tc-glow-keyboard>`);
    expect(el.getAttribute("aria-label")).toBe("Demo");
  });

  test("each instance has its own gradient and filter ids", async () => {
    const wrap = await fixture(html`<div><tc-glow-keyboard></tc-glow-keyboard><tc-glow-keyboard></tc-glow-keyboard></div>`);
    const [a, b] = [...wrap.querySelectorAll("tc-glow-keyboard")];
    const ids = (el: Element) => [...el.querySelectorAll("[id]")].map((n) => n.id);
    expect(ids(a)).toHaveLength(3);
    expect(ids(a).filter((id) => ids(b).includes(id))).toEqual([]);
    for (const el of [a, b]) for (const n of el.querySelectorAll("[fill^='url('], [filter^='url(']")) expect(el.querySelector(`[id="${n.getAttribute(n.hasAttribute("filter") ? "filter" : "fill")!.slice(5, -1)}"]`)).toBeTruthy();
  });

  test("the demo stops typing while the tab is hidden and carries on when it's back", async () => {
    fake();
    const el = await fixture<TcGlowKeyboard>(html`<tc-glow-keyboard .prompts=${["Find a quiet hike near Zermatt"]}></tc-glow-keyboard>`);
    await started(el);
    await advance(3000);
    const typed = input(el).value;
    expect(typed.length).toBeGreaterThan(0);
    setHidden(true);
    expect(el.hasAttribute("data-paused")).toBe(true);
    await advance(3000);
    // At most the keystroke already under way lands
    expect(input(el).value.length).toBeLessThanOrEqual(typed.length + 1);
    const held = input(el).value;
    setHidden(false);
    expect(el.hasAttribute("data-paused")).toBe(false);
    await advance(2000);
    expect(input(el).value.length).toBeGreaterThan(held.length);
  });

  test("types each prompt once and sends it (tc-submit), then the scene rests and the loop stops (WCAG 2.2.2)", async () => {
    fake();
    const sent: string[] = [];
    const el = await fixture<TcGlowKeyboard>(html`<tc-glow-keyboard .prompts=${["Hi"]} @tc-submit=${(e: CustomEvent<GlowKeyboardSubmit>) => sent.push(e.detail.text)}></tc-glow-keyboard>`);
    await started(el);
    await advance(12000);
    expect(sent).toEqual(["Hi"]);
    expect(el.hasAttribute("data-resting")).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  test("removing it mid-demo leaves no timers pending", async () => {
    fake();
    const el = await fixture<TcGlowKeyboard>(html`<tc-glow-keyboard></tc-glow-keyboard>`);
    await started(el);
    await advance(3000);
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    el.remove();
    expect(vi.getTimerCount()).toBe(0);
  });

  test("Enter while composing (IME) doesn't send", async () => {
    const sent: string[] = [];
    const el = await fixture<TcGlowKeyboard>(html`<tc-glow-keyboard @tc-submit=${(e: CustomEvent<GlowKeyboardSubmit>) => sent.push(e.detail.text)}></tc-glow-keyboard>`);
    const field = input(el);
    field.focus();
    field.value = "にほ";
    field.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", isComposing: true, bubbles: true }));
    expect(sent).toEqual([]);
    field.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true }));
    expect(sent).toEqual(["にほ"]);
    expect(field.value).toBe("");
  });

  test("the user's keys light up on the drawn keyboard; a press anywhere on the scene focuses the input", async () => {
    const el = await fixture<TcGlowKeyboard>(html`<tc-glow-keyboard></tc-glow-keyboard>`);
    el.querySelector(".ui-gk-keyboard")!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(input(el));
    input(el).dispatchEvent(new KeyboardEvent("keydown", { key: "a", code: "KeyA", bubbles: true }));
    expect(el.querySelector('[data-k="a"]')!.hasAttribute("data-down")).toBe(true);
    // German layout: the physical Z key is the drawn y
    input(el).dispatchEvent(new KeyboardEvent("keydown", { key: "y", code: "KeyZ", bubbles: true }));
    expect(el.querySelector('[data-k="y"]')!.hasAttribute("data-down")).toBe(true);
    input(el).dispatchEvent(new KeyboardEvent("keyup", { key: "a", code: "KeyA", bubbles: true }));
    await expect.poll(() => el.querySelector('[data-k="a"]')!.hasAttribute("data-down")).toBe(false);
  });

  test("the input pill shows a focus ring (the bare input's outline is replaced, WCAG 2.4.7)", async () => {
    expect(TcGlowKeyboard.css).toMatch(/\.ui-gk-input:focus-within \{\s*outline: var\(--tc-focus-outline/);
    const el = await fixture<TcGlowKeyboard>(html`<tc-glow-keyboard></tc-glow-keyboard>`);
    input(el).focus();
    expect(getComputedStyle(el.querySelector(".ui-gk-input")!).outlineStyle).toBe("solid");
  });

  test("dark follows color-scheme alone; the endless loops are only the floor and glow, which rest with the scene", async () => {
    const css = TcGlowKeyboard.css;
    expect(css).toContain(':where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }');
    expect(css).toContain(':where([data-tc-theme="system"]) { color-scheme: light dark; }');
    for (const [, selector, body] of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
      if (/\.dark\b|data-(?:tc-)?theme="dark"/.test(selector.replace(/\/\*[\s\S]*?\*\//g, ""))) expect(body.trim()).toBe("color-scheme: dark;");
    }
    for (const [rule] of css.matchAll(/animation:[^;]*\binfinite\b[^;]*;/g)) expect(rule).toMatch(/ui-gk-/);
    expect(css).toMatch(/\[data-ui="gk"\]\[data-resting\] :is\(\.ui-gk-bleed, \.ui-gk-glow-mid\)/);
    const wrap = await fixture(html`<div data-tc-theme="dark"><tc-glow-keyboard></tc-glow-keyboard></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-gk-frame")!).backgroundColor).toBe("rgb(17, 17, 19)");
  });

  test("React wrapper: className is merged, DOM props reach the host, the ref gets the host, and onSubmit gets the text", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcGlowKeyboard>();
    const onSubmit = vi.fn();
    await act(async () =>
      root.render(React.createElement(GlowKeyboard, { onSubmit, className: "consumer-class", "data-consumer": "yes", "aria-describedby": "consumer", ref } as React.ComponentProps<typeof GlowKeyboard>)),
    );
    await settle();
    const el = host.querySelector<TcGlowKeyboard>("tc-glow-keyboard")!;
    expect(el.classList.contains("consumer-class")).toBe(true);
    expect(el.dataset.ui).toBe("gk");
    expect(el.getAttribute("data-consumer")).toBe("yes");
    expect(el.getAttribute("aria-describedby")).toBe("consumer");
    expect(ref.current).toBe(el);
    input(el).value = "Plan a trip";
    input(el).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", bubbles: true }));
    expect(onSubmit).toHaveBeenCalledWith("Plan a trip");
    await act(async () => root.unmount());
  });

  test("axe: no violations once the entry animation is over", async () => {
    const el = await fixture<TcGlowKeyboard>(html`<tc-glow-keyboard style="width: 800px"></tc-glow-keyboard>`);
    await started(el);
    await Promise.all(
      el
        .getAnimations({ subtree: true })
        .filter((a) => (a as CSSAnimation).animationName === "ui-gk-rise")
        .map((a) => a.finished),
    );
    const result = await axe.run(el, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
