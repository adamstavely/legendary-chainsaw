/*
 * <tc-voice-orb> in real browsers – the illustration's contract and regression checks, ported
 * (contract/illustrations/voice-orb, regressions illustrations-voice-orb and -themes-and-loops).
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/voice-orb";
import { TcVoiceOrb } from "../../src/elements/voice-orb";
import { VoiceOrb } from "../../src/elements/react/voice-orb";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

class ManualObserver {
  static last: ManualObserver | null = null;
  constructor(private callback: IntersectionObserverCallback) {
    ManualObserver.last = this;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
  report(isIntersecting: boolean) {
    this.callback([{ isIntersecting } as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
const reduceMotion = () => {
  const real = window.matchMedia.bind(window);
  vi.stubGlobal("matchMedia", (q: string) => (q.includes("reduced-motion") ? { matches: true, media: q, addEventListener() {}, removeEventListener() {} } : real(q)));
};

/** The brightest fully drawn dot's red channel – the ink: dark on light pages, light on dark ones */
function inkRed(el: TcVoiceOrb) {
  const canvas = el.querySelector("canvas")!;
  const data = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
  let best = -1;
  let red = -1;
  for (let i = 0; i < data.length; i += 4)
    if (data[i + 3] > best) {
      best = data[i + 3];
      red = data[i];
    }
  return red;
}

describe("tc-voice-orb", () => {
  test("the host is the root: an image named by the state, with the label and size", async () => {
    const el = await fixture<TcVoiceOrb>(html`<tc-voice-orb></tc-voice-orb>`);
    expect(el.dataset.ui).toBe("vo");
    expect(el.dataset.state).toBe("idle");
    expect(el.getAttribute("role")).toBe("img");
    expect(el.getAttribute("aria-label")).toBe("Voice assistant: Tap to speak");
    expect(el.querySelector(".ui-vo__label")!.textContent).toBe("Tap to speak");
    expect(el.querySelector("canvas")!.getBoundingClientRect().width).toBe(220);
    el.state = "listening";
    el.size = 120;
    await settle();
    expect(el.dataset.state).toBe("listening");
    expect(el.getAttribute("aria-label")).toBe("Voice assistant: Listening");
    expect(el.querySelectorAll(".ui-vo__dots i").length).toBe(3);
    expect(el.querySelector("canvas")!.getBoundingClientRect().width).toBe(120);
  });

  test("label: false hides the line, an object replaces single texts; a page's own name stays", async () => {
    const el = await fixture<TcVoiceOrb>(html`<tc-voice-orb .label=${false} state="thinking"></tc-voice-orb>`);
    expect(el.querySelector(".ui-vo__label")).toBeNull();
    expect(el.getAttribute("aria-label")).toBe("Voice assistant: Thinking");
    el.label = { thinking: "Working on it" };
    await settle();
    expect(el.querySelector(".ui-vo__label")!.textContent).toBe("Working on it");
    const named = await fixture<TcVoiceOrb>(html`<tc-voice-orb aria-label="Assistant"></tc-voice-orb>`);
    expect(named.getAttribute("aria-label")).toBe("Assistant");
  });

  test("the accent reaches the CSS", async () => {
    const el = await fixture<TcVoiceOrb>(html`<tc-voice-orb accent="#ff0000"></tc-voice-orb>`);
    expect(getComputedStyle(el.querySelector("canvas")!).getPropertyValue("--tc-voice-orb-accent").trim()).toBe("#ff0000");
  });

  test("pressable: a native button inside fires tc-press on click and from the keyboard", async () => {
    const el = await fixture<TcVoiceOrb>(html`<tc-voice-orb pressable></tc-voice-orb>`);
    const button = el.querySelector<HTMLButtonElement>(":scope > button.ui-vo__hit")!;
    expect(button).toBeTruthy();
    expect(button.type).toBe("button");
    expect(el.getAttribute("role")).toBeNull();
    expect(el.hasAttribute("aria-label")).toBe(false);
    const press = vi.fn();
    el.addEventListener("tc-press", press);
    button.click();
    expect(press).toHaveBeenCalledTimes(1);
    button.focus();
    button.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    // Keyboard activation is the browser's own: a native button
    expect(document.activeElement).toBe(button);
    // No visible text: the button is named by the state
    el.label = false;
    await settle();
    expect(button.getAttribute("aria-label")).toBe("Voice assistant: Tap to speak");
  });

  test("an orb scrolled out of view stays stopped when the tab comes back", async () => {
    vi.stubGlobal("IntersectionObserver", ManualObserver);
    const clear = vi.spyOn(CanvasRenderingContext2D.prototype, "clearRect");
    const el = await fixture<TcVoiceOrb>(html`<tc-voice-orb state="listening"></tc-voice-orb>`);
    await frames();
    expect(clear.mock.calls.length, "drawing while on screen").toBeGreaterThan(0);
    ManualObserver.last!.report(false);
    await frames();
    const before = clear.mock.calls.length;
    document.dispatchEvent(new Event("visibilitychange"));
    await frames();
    await frames();
    expect(clear.mock.calls.length, "still stopped after the tab comes back").toBe(before);
    expect(el.hasAttribute("data-paused")).toBe(true);
    ManualObserver.last!.report(true);
    await frames();
    expect(clear.mock.calls.length, "runs again once in view").toBeGreaterThan(before);
    expect(el.hasAttribute("data-paused")).toBe(false);
  });

  test("a theme switch on an ancestor redraws the still frame in the new ink", async () => {
    reduceMotion();
    const page = await fixture(html`<div data-tc-theme="light"><tc-voice-orb></tc-voice-orb></div>`);
    const el = page.querySelector<TcVoiceOrb>("tc-voice-orb")!;
    await frames();
    expect(inkRed(el), "dark ink on a light page").toBeLessThan(80);
    page.setAttribute("data-tc-theme", "dark");
    await frames();
    expect(inkRed(el), "light ink on a dark page").toBeGreaterThan(180);
  });

  test("idle, the loop rests after a few seconds and a new state wakes it", async () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    try {
      const clear = vi.spyOn(CanvasRenderingContext2D.prototype, "clearRect");
      const host = document.body.appendChild(document.createElement("div"));
      const el = document.createElement("tc-voice-orb");
      host.append(el);
      await el.updateComplete;
      vi.advanceTimersByTime(1000);
      expect(clear.mock.calls.length, "breathing").toBeGreaterThan(10);
      vi.advanceTimersByTime(12_000);
      const resting = clear.mock.calls.length;
      vi.advanceTimersByTime(1000);
      expect(clear.mock.calls.length, "resting").toBe(resting);
      el.state = "listening";
      await el.updateComplete;
      vi.advanceTimersByTime(100);
      expect(clear.mock.calls.length, "awake again").toBeGreaterThan(resting);
    } finally {
      vi.useRealTimers();
    }
  });

  test("the label's dots blink a few times and pause off screen; no endless CSS loop; dark follows data-tc-theme", () => {
    const css = TcVoiceOrb.css;
    expect(css).toMatch(/animation: ui-vo-blink var\(--tc-voice-orb-blink\) [^;]* 4;/);
    expect(css).toContain('[data-ui="vo"][data-paused] .ui-vo__dots i { animation-play-state: paused; }');
    expect(css).not.toMatch(/\binfinite\b/);
    expect(css).toContain(':where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }');
    expect(css).toContain(':where([data-tc-theme="system"]) { color-scheme: light dark; }');
    for (const [, selector, body] of css.matchAll(/([^{}]*)\{([^{}]*)\}/g))
      if (/\.dark\b|data-(?:tc-)?theme="dark"/.test(selector.replace(/\/\*[\s\S]*?\*\//g, ""))) expect(body.trim()).toBe("color-scheme: dark;");
  });

  test("disconnecting stops the loop", async () => {
    const clear = vi.spyOn(CanvasRenderingContext2D.prototype, "clearRect");
    const el = await fixture<TcVoiceOrb>(html`<tc-voice-orb state="speaking"></tc-voice-orb>`);
    await frames();
    el.remove();
    const n = clear.mock.calls.length;
    await frames();
    expect(clear.mock.calls.length).toBe(n);
  });

  test("React wrapper: className, DOM props and ref reach the host; onPress, and onClick's preventDefault skips it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const ref = React.createRef<TcVoiceOrb>();
    const onPress = vi.fn();
    let prevent = false;
    const onClick = (e: React.MouseEvent) => prevent && e.preventDefault();
    flushSync(() => root.render(React.createElement(VoiceOrb, { className: "consumer-class", "data-consumer": "yes", "aria-describedby": "consumer", ref, onPress, onClick } as never)));
    await settle();
    const el = host.querySelector<TcVoiceOrb>("tc-voice-orb")!;
    expect(ref.current).toBe(el);
    expect(el.classList.contains("consumer-class")).toBe(true);
    expect(el.dataset.consumer).toBe("yes");
    // ARIA given to a pressable orb moves to its button
    expect(el.querySelector("button")!.getAttribute("aria-describedby")).toBe("consumer");
    el.querySelector("button")!.click();
    expect(onPress).toHaveBeenCalledTimes(1);
    prevent = true;
    el.querySelector("button")!.click();
    expect(onPress).toHaveBeenCalledTimes(1);
    flushSync(() => root.render(React.createElement(VoiceOrb, { ref })));
    await settle();
    expect(el.querySelector("button")).toBeNull();
    expect(el.getAttribute("role")).toBe("img");
    root.unmount();
  });

  test("axe: no violations, as an image and as a button", async () => {
    reduceMotion();
    const wrap = await fixture(html`<div><tc-voice-orb state="listening"></tc-voice-orb><tc-voice-orb pressable></tc-voice-orb><tc-voice-orb pressable .label=${false}></tc-voice-orb></div>`);
    // The label fades in: axe measures it once the entry animation is done
    for (const a of wrap.getAnimations({ subtree: true })) a.finish();
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
