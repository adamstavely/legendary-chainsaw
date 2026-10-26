/*
 * <tc-autonomy-dial> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/autonomy-dial";
import type { AgentAction, TcAutonomyDial } from "../../src/elements/autonomy-dial";
import { AutonomyDial } from "../../src/elements/react/autonomy-dial";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const actions: AgentAction[] = [
  { id: "read", label: "Read files", risk: "safe" },
  { id: "send", label: "Send email", risk: "risky" },
];
const radio = (el: Element, name: string) => [...el.querySelectorAll<HTMLButtonElement>('[role="radio"]')].find((b) => b.textContent!.trim() === name)!;
const lock = (el: Element, label: string) => el.querySelector<HTMLButtonElement>(`button[aria-label="Always ask before: ${label}"]`)!;
const pinnedIds = (el: Element) =>
  [...el.querySelectorAll(".ui-ad__row")]
    .filter((r) => r.querySelector('[aria-pressed="true"]'))
    .map((r) => (r.textContent!.includes("Read files") ? "read" : "send"))
    .sort();

describe("tc-autonomy-dial", () => {
  test("the host is the root, with the look and the level", async () => {
    const el = await fixture<TcAutonomyDial>(html`<tc-autonomy-dial .actions=${actions}></tc-autonomy-dial>`);
    expect(el.dataset.ui).toBe("ad");
    expect(el.dataset.look).toBe("standard");
    expect(el.dataset.level).toBe("1");
    expect(el.querySelector(".ui-ad__title")!.textContent).toBe("Agent permissions");
    el.look = "clean";
    await settle();
    expect(el.dataset.look).toBe("clean");
    // Clean: no pill, the groups inside the card
    expect(el.querySelector(".ui-ad__pill")).toBeNull();
    expect(el.querySelector(".ui-ad__card .ui-ad__groups")).toBeTruthy();
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: level and pins follow their properties`, async () => {
      const el = await fixture<TcAutonomyDial>(html`<tc-autonomy-dial look=${look} .actions=${actions} .level=${0}></tc-autonomy-dial>`);
      expect(el.dataset.level).toBe("0");
      el.level = 2;
      await settle();
      expect(el.dataset.level).toBe("2");
      expect(radio(el, "Full auto").getAttribute("aria-checked")).toBe("true");
      el.pinned = ["send"];
      await settle();
      expect(pinnedIds(el)).toEqual(["send"]);
      el.pinned = ["read", "send"];
      await settle();
      expect(pinnedIds(el)).toEqual(["read", "send"]);
    });

    test(`${look}: controlled level – a click is reported, not applied`, async () => {
      const el = await fixture<TcAutonomyDial>(html`<tc-autonomy-dial look=${look} .actions=${actions} .level=${0}></tc-autonomy-dial>`);
      const seen: number[] = [];
      el.addEventListener("tc-level-change", (e) => {
        e.preventDefault();
        seen.push((e as CustomEvent<{ level: number }>).detail.level);
      });
      radio(el, "Full auto").click();
      await settle();
      expect(seen).toEqual([2]);
      expect(el.dataset.level).toBe("0");
    });

    test(`${look}: uncontrolled still moves and reports`, async () => {
      const el = await fixture<TcAutonomyDial>(html`<tc-autonomy-dial look=${look} .actions=${actions}></tc-autonomy-dial>`);
      const pins: string[][] = [];
      el.addEventListener("tc-pinned-change", (e) => pins.push((e as CustomEvent<{ pinned: string[] }>).detail.pinned));
      radio(el, "Full auto").click();
      await settle();
      expect(el.dataset.level).toBe("2");
      lock(el, "Send email").click();
      await settle();
      expect(pins).toEqual([["send"]]);
      expect(lock(el, "Send email").getAttribute("aria-pressed")).toBe("true");
    });

    test(`${look}: WCAG 2.4.3 – the lock keeps focus when its action moves to the other group`, async () => {
      const el = await fixture<TcAutonomyDial>(html`<tc-autonomy-dial look=${look} .actions=${actions} .level=${2}></tc-autonomy-dial>`);
      lock(el, "Read files").focus();
      lock(el, "Read files").click();
      await settle();
      const moved = lock(el, "Read files");
      expect(moved.getAttribute("aria-pressed")).toBe("true");
      expect(moved.closest("section")!.textContent).toMatch(/Asks you first/);
      expect(document.activeElement).toBe(moved);
      moved.click();
      await settle();
      expect(document.activeElement).toBe(lock(el, "Read files"));
    });

    test(`${look}: arrow keys move between the levels (roving tabindex)`, async () => {
      const el = await fixture<TcAutonomyDial>(html`<tc-autonomy-dial look=${look} .actions=${actions}></tc-autonomy-dial>`);
      const group = el.querySelector<HTMLElement>('[role="radiogroup"]')!;
      expect(group.getAttribute("aria-label")).toBe("Autonomy");
      expect(document.getElementById(group.getAttribute("aria-describedby")!)!.textContent).toMatch(/Safe actions run/);
      radio(el, "If risky").focus();
      radio(el, "If risky").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
      await settle();
      expect(el.dataset.level).toBe("2");
      expect(document.activeElement).toBe(radio(el, "Full auto"));
      expect(radio(el, "Full auto").tabIndex).toBe(0);
      expect(radio(el, "If risky").tabIndex).toBe(-1);
      radio(el, "Full auto").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true, cancelable: true }));
      await settle();
      expect(el.dataset.level).toBe("1");
    });

    test(`${look}: the groups, counts and live summary follow the level`, async () => {
      const el = await fixture<TcAutonomyDial>(html`<tc-autonomy-dial look=${look} .actions=${actions} .level=${0}></tc-autonomy-dial>`);
      const counts = () => [...el.querySelectorAll(".ui-ad__count")].map((c) => c.textContent!.trim());
      expect(counts()).toEqual(["0", "2"]);
      expect(el.querySelector(".ui-ad__empty")!.textContent).toBe("Every action waits for you");
      el.level = 2;
      await settle();
      expect(counts()).toEqual(["2", "0"]);
      expect(el.querySelector('[aria-live="polite"]')!.textContent).toBe("Full auto: 2 on its own, 0 ask first");
      expect(el.querySelector(".ui-ad__risk")!.textContent!.trim()).toBe("Risky");
    });
  }

  test("WCAG 1.4.10 / 1.4.11 / theme: details keep a title, locks stay visible, no .dark colours", async () => {
    const el = await fixture<TcAutonomyDial>(html`<tc-autonomy-dial .actions=${[{ ...actions[1], detail: "Gmail · to customers" }]}></tc-autonomy-dial>`);
    expect(el.querySelector(".ui-ad__detail")!.getAttribute("title")).toBe("Gmail · to customers");
    const css = (customElements.get("tc-autonomy-dial") as unknown as { css: string }).css;
    expect(css).not.toMatch(/ui-ad__detail \{ display: none/);
    expect(css).not.toMatch(/ui-ad__pin[^{]*\{[^}]*opacity: 0[;\s]/);
    expect(css).not.toMatch(/\.dark[^{}]*\.ui-ad__/);
    expect(getComputedStyle(el.querySelector(".ui-ad__pin")!).opacity).toBe("1");
  });

  test("a custom icon is cloned", async () => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("data-mine", "");
    const el = await fixture<TcAutonomyDial>(html`<tc-autonomy-dial .actions=${[{ ...actions[0], icon }]}></tc-autonomy-dial>`);
    expect(el.querySelector(".ui-ad__icon svg[data-mine]")).toBeTruthy();
    expect(icon.isConnected).toBe(false);
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-autonomy-dial .actions=${actions} .pinned=${["send"]}></tc-autonomy-dial>
      <tc-autonomy-dial look="clean" heading="Clean" .actions=${actions} .level=${0}></tc-autonomy-dial>
    </div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });

  test("React wrapper: an uncontrolled level survives a parent re-render", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(AutonomyDial, { actions, "data-n": n } as React.ComponentProps<typeof AutonomyDial>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-autonomy-dial")!;
    radio(el, "Full auto").click();
    await settle();
    expect(el.dataset.level).toBe("2");
    await act(async () => bump());
    await settle();
    expect(el.dataset.level).toBe("2");
    await act(async () => root.unmount());
  });
});
