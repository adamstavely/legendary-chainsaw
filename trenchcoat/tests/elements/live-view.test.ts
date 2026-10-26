/*
 * <tc-live-view> in real browsers: the stream sources, the overlays drawn from the actions, the caption, Pause and
 * Take over (controlled and not), clicks on the screen while you drive, the toolbar keyboard, the wrapper, axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/live-view";
import type { LiveViewAction, LiveViewControlChange, LiveViewPausedChange, LiveViewScreenClick, TcLiveView } from "../../src/elements/live-view";
import { LiveView } from "../../src/elements/react/live-view";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const IMG = "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="640" height="400" fill="#eee"/></svg>`);
const ACTIONS: LiveViewAction[] = [
  { id: "a1", kind: "move", x: 320, y: 200, caption: "Opening the page" },
  { id: "a2", kind: "click", x: 640, y: 400, caption: "Opening search" },
  { id: "a3", kind: "type", text: "Lisbon", caption: "Typing the city" },
];
const track = (el: Element) => el.querySelector<HTMLElement>(".ui-lv__track");
const buttons = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-lv__tools button")];
const button = (el: Element, name: string) => buttons(el).find((b) => b.textContent!.trim() === name)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-live-view", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the host is the root; an image URL is the frame`, async () => {
      const el = await fixture<TcLiveView>(html`<tc-live-view look=${look} heading="Booking" src=${IMG} alt="Checkout page" .actions=${ACTIONS}></tc-live-view>`);
      expect(el.dataset.ui).toBe("lv");
      expect(el.dataset.look).toBe(look);
      expect(getComputedStyle(el).display).toBe("grid");
      const img = el.querySelector<HTMLImageElement>(".ui-lv__screen img")!;
      expect(img.alt).toBe("Checkout page");
      expect(el.querySelector(".ui-lv__title")!.textContent).toBe("Booking");
      expect(el.querySelector(".ui-lv__state")!.textContent!.trim()).toBe("Live");
      expect(el.querySelector(".ui-lv__screen")!.getAttribute("aria-label")).toBe("The agent's screen – Booking");
    });

    test(`${look}: Pause reports and pauses; preventDefault keeps it running (controlled)`, async () => {
      const el = await fixture<TcLiveView>(html`<tc-live-view look=${look} src=${IMG} .actions=${ACTIONS}></tc-live-view>`);
      const got: boolean[] = [];
      el.addEventListener("tc-paused-change", (e) => got.push((e as CustomEvent<LiveViewPausedChange>).detail.paused));
      button(el, "Pause").click();
      await settle();
      expect(got).toEqual([true]);
      expect(el.paused).toBe(true);
      expect(el.hasAttribute("paused")).toBe(true);
      expect(el.querySelector(".ui-lv__state")!.textContent!.trim()).toBe("Paused");
      expect(el.querySelector(".ui-lv__badge")!.textContent!.trim()).toBe("Paused");
      expect(el.querySelector('[role="status"]')!.textContent).toBe("Paused.");
      // Controlled: the app says no
      el.addEventListener("tc-paused-change", (e) => e.preventDefault());
      button(el, "Resume").click();
      await settle();
      expect(got).toEqual([true, false]);
      expect(el.paused).toBe(true);
      el.paused = false;
      await settle();
      expect(button(el, "Pause")).toBeTruthy();
    });

    test(`${look}: Take over hands you the screen – the overlays step aside, clicks report frame pixels`, async () => {
      const el = await fixture<TcLiveView>(html`<div style="width: 640px"><tc-live-view look=${look} src=${IMG} frame-width="1280" frame-height="800" .actions=${ACTIONS}></tc-live-view></div>`).then((w) => w.firstElementChild as TcLiveView);
      const changes: string[] = [];
      const clicks: LiveViewScreenClick[] = [];
      el.addEventListener("tc-control-change", (e) => changes.push((e as CustomEvent<LiveViewControlChange>).detail.control));
      el.addEventListener("tc-screen-click", (e) => clicks.push((e as CustomEvent<LiveViewScreenClick>).detail));
      const screen = el.querySelector<HTMLElement>(".ui-lv__screen")!;
      const center = () => {
        const r = screen.getBoundingClientRect();
        return { clientX: r.left + r.width / 2, clientY: r.top + r.height / 4, bubbles: true };
      };
      // Not while the agent drives
      screen.dispatchEvent(new MouseEvent("click", center()));
      expect(clicks).toEqual([]);
      button(el, "Take over").click();
      await settle();
      expect(changes).toEqual(["user"]);
      expect(el.getAttribute("control")).toBe("user");
      expect(track(el)).toBeNull();
      expect(buttons(el).map((b) => b.textContent!.trim())).toEqual(["Hand back"]);
      expect(el.querySelector(".ui-lv__state")!.textContent!.trim()).toBe("You're in control");
      screen.dispatchEvent(new MouseEvent("click", center()));
      // The event's client coordinates are whole pixels, so the frame point can be a pixel or two off
      expect(clicks).toHaveLength(1);
      expect(Math.abs(clicks[0].x - 640)).toBeLessThanOrEqual(3);
      expect(Math.abs(clicks[0].y - 200)).toBeLessThanOrEqual(3);
      // Focus stays on the button that changed its label
      button(el, "Hand back").focus();
      el.addEventListener("tc-control-change", (e) => e.preventDefault(), { once: true });
      button(el, "Hand back").click();
      await settle();
      expect(el.control).toBe("user");
      button(el, "Hand back").click();
      await settle();
      expect(el.control).toBe("agent");
      expect(document.activeElement).toBe(button(el, "Take over"));
    });

    test(`${look}: toolbar – one tab stop, arrows, Home and End move between the buttons (APG)`, async () => {
      const el = await fixture<TcLiveView>(html`<tc-live-view look=${look} src=${IMG}></tc-live-view>`);
      const toolbar = el.querySelector('[role="toolbar"]')!;
      expect(toolbar.getAttribute("aria-label")).toBe("Live view");
      expect(buttons(el).map((b) => b.tabIndex)).toEqual([0, -1]);
      buttons(el)[0].focus();
      key(document.activeElement!, "ArrowRight");
      await settle();
      expect(document.activeElement).toBe(button(el, "Take over"));
      expect(buttons(el).map((b) => b.tabIndex)).toEqual([-1, 0]);
      key(document.activeElement!, "ArrowRight");
      await settle();
      expect(document.activeElement).toBe(button(el, "Pause"));
      key(document.activeElement!, "End");
      await settle();
      expect(document.activeElement).toBe(button(el, "Take over"));
      key(document.activeElement!, "Home");
      await settle();
      expect(document.activeElement).toBe(button(el, "Pause"));
    });
  }

  test("the pointer sits at the latest action with a place, as a share of the frame; typing keeps it there", async () => {
    const el = await fixture<TcLiveView>(html`<tc-live-view src=${IMG} frame-width="1280" frame-height="800" agent="Operator" .actions=${ACTIONS}></tc-live-view>`);
    const t = track(el)!;
    expect(t.style.getPropertyValue("--x")).toBe("0.5");
    expect(t.style.getPropertyValue("--y")).toBe("0.5");
    expect(t.dataset.kind).toBe("type");
    expect(el.querySelector(".ui-lv__who")!.textContent).toBe("Operator");
    expect(el.querySelector(".ui-lv__typed")!.textContent).toBe("Lisbon");
    // A long text keeps its last letters in view
    el.actions = [...ACTIONS, { id: "a4", kind: "type", text: "Lisbon to Porto, one way, Friday morning please" }];
    await settle();
    expect(el.querySelector(".ui-lv__typed")!.textContent).toBe("…ne way, Friday morning please");
  });

  test("clicks press the arrow and spread a ring; keys and scrolls show on the flag; flags flip near the edges", async () => {
    const el = await fixture<TcLiveView>(html`<tc-live-view src=${IMG} frame-width="1000" frame-height="1000" .actions=${[{ id: "c", kind: "click", x: 900, y: 950 } satisfies LiveViewAction]}></tc-live-view>`);
    expect(el.querySelector(".ui-lv__ptr")!.hasAttribute("data-press")).toBe(true);
    expect(el.querySelector<HTMLElement>(".ui-lv__ring-track")!.style.getPropertyValue("--x")).toBe("0.9");
    expect(track(el)!.hasAttribute("data-flip-x")).toBe(true);
    expect(track(el)!.hasAttribute("data-flip-y")).toBe(true);
    // No agent name: a plain move or click has no flag
    expect(el.querySelector(".ui-lv__flag")).toBeNull();
    el.actions = [{ id: "k", kind: "key", x: 100, y: 100, text: "Mod+Enter" }];
    await settle();
    expect([...el.querySelectorAll(".ui-lv__kbd")].map((k) => k.textContent)).toEqual(["⌘", "Enter"]);
    expect(el.querySelector(".ui-lv__ring-track")).toBeNull();
    expect(track(el)!.hasAttribute("data-flip-x")).toBe(false);
    el.actions = [{ id: "s", kind: "scroll", x: 100, y: 100, delta: -300 }];
    await settle();
    expect(el.querySelector(".ui-lv__scroll")!.textContent!.trim()).toBe("Scrolling up");
  });

  test("the caption: the property wins, else the latest action's; the step and the live region follow", async () => {
    const el = await fixture<TcLiveView>(html`<tc-live-view src=${IMG} step="3" steps="8" .actions=${ACTIONS}></tc-live-view>`);
    const status = el.querySelector('[role="status"]')!;
    expect(el.querySelector(".ui-lv__step")!.textContent).toBe("Step 3 of 8");
    expect(el.querySelector(".ui-lv__cap-text")!.textContent).toBe("Typing the city");
    expect(status.textContent).toBe("Step 3 of 8: Typing the city");
    el.caption = "Checking the fare";
    el.step = 4;
    await settle();
    expect(el.querySelector(".ui-lv__cap-text")!.textContent).toBe("Checking the fare");
    expect(el.querySelector('[role="status"]')).toBe(status);
    expect(status.textContent).toBe("Step 4 of 8: Checking the fare");
  });

  test("sources: a live element is shown in place; slotted content counts; nothing yet shows a waiting state", async () => {
    const el = await fixture<TcLiveView>(html`<tc-live-view></tc-live-view>`);
    expect(el.querySelector(".ui-lv__screen")!.hasAttribute("data-empty")).toBe(true);
    expect(el.querySelector(".ui-lv__wait-text")!.textContent).toBe("Waiting for the agent's screen…");
    expect(el.querySelector(".ui-lv__state")!.textContent!.trim()).toBe("Connecting");
    // A canvas sets the frame from its own size
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;
    el.source = canvas;
    await settle();
    expect(canvas.parentElement).toBe(el.querySelector(".ui-lv__screen"));
    expect(el.querySelector<HTMLElement>(".ui-lv__screen")!.style.aspectRatio).toBe("800 / 600");
    expect(el.querySelector(".ui-lv__wait")).toBeNull();
    // Slotted content, added after the first render, stays where it was put
    const el2 = await fixture<TcLiveView>(html`<tc-live-view></tc-live-view>`);
    const own = document.createElement("div");
    own.slot = "screen";
    own.innerHTML = `<svg viewBox="0 0 960 600"></svg>`;
    el2.append(own);
    await settle();
    expect(own.parentElement).toBe(el2);
    expect(el2.querySelector(".ui-lv__screen")!.hasAttribute("data-empty")).toBe(false);
    expect(el2.querySelector<HTMLElement>(".ui-lv__screen")!.style.aspectRatio).toBe("960 / 600");
    expect(getComputedStyle(own).gridRowStart).toBe(getComputedStyle(el2.querySelector(".ui-lv__screen")!).gridRowStart);
  });

  test("ended: Finished, no pointer, no toolbar", async () => {
    const el = await fixture<TcLiveView>(html`<tc-live-view src=${IMG} .actions=${ACTIONS}></tc-live-view>`);
    el.ended = true;
    await settle();
    expect(el.querySelector(".ui-lv__state")!.textContent!.trim()).toBe("Finished");
    expect(el.querySelector('[role="toolbar"]')).toBeNull();
    expect(track(el)).toBeNull();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Finished. Typing the city");
  });

  test("styles: reduced motion turns motion off; no endless loop; the waiting sweep pauses off-screen", async () => {
    await fixture(html`<tc-live-view></tc-live-view>`);
    const css = (customElements.get("tc-live-view") as unknown as { css: string }).css;
    expect(css).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*animation: none !important/);
    expect(css).not.toMatch(/infinite/);
    expect(css).toMatch(/\[data-ui="lv"\]\[data-offscreen\] \.ui-lv__wait-shine/);
    expect(css).not.toMatch(/\.dark\b|data-tc-theme="dark"/);
  });

  test("React wrapper: an uncontrolled pause survives a parent re-render; callbacks fire; the screen is slotted", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const paused: boolean[] = [];
    const controls: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(LiveView, {
        title: "Booking",
        actions: ACTIONS,
        onPausedChange: (p) => paused.push(p),
        onControlChange: (c) => controls.push(c),
        screen: React.createElement("svg", { viewBox: "0 0 960 600", "data-n": n }),
      });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-live-view")!;
    expect(el.heading).toBe("Booking");
    expect(el.querySelector(':scope > [slot="screen"] > svg')).toBeTruthy();
    expect(el.querySelector(".ui-lv__screen")!.hasAttribute("data-empty")).toBe(false);
    button(el, "Pause").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(paused).toEqual([true]);
    expect(el.paused).toBe(true);
    button(el, "Take over").click();
    await settle();
    expect(controls).toEqual(["user"]);
    expect(el.control).toBe("user");
    await act(async () => root.unmount());
  });

  test("axe: no violations in either look or theme", async () => {
    for (const theme of ["light", "dark"]) {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="width: 720px">
        <tc-live-view heading="Booking" agent="Operator" step="2" steps="5" src=${IMG} .actions=${ACTIONS}></tc-live-view>
        <tc-live-view look="clean" heading="Clean" paused src=${IMG} .actions=${ACTIONS}></tc-live-view>
        <tc-live-view look="clean" control="user" src=${IMG}></tc-live-view>
        <tc-live-view></tc-live-view>
      </div>`);
      wrap.getAnimations({ subtree: true }).forEach((a) => a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${theme} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      cleanup();
    }
  });
});
