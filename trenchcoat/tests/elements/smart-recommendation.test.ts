/*
 * <tc-smart-recommendation> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/smart-recommendation";
import type { Recommendation, TcSmartRecommendation } from "../../src/elements/smart-recommendation";
import { SmartRecommendation } from "../../src/elements/react/smart-recommendation";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const options: Recommendation[] = [
  { id: "inc", label: "Incremental sync", reason: "Only changed rows move.", signal: 3 },
  { id: "full", label: "Full sync", reason: "Copies everything again.", signal: 1 },
];
const other: Recommendation[] = [
  { id: "cache", label: "Cache", reason: "Keep a warm cache.", signal: 2 },
  { id: "full", label: "Full sync", reason: "Copies everything again.", signal: 1 },
];
const reason = (el: Element) => el.querySelector(".ui-sr__reason")!.textContent;
const button = (el: Element, name: RegExp) => [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => name.test(b.textContent!.trim()))!;
const item = (el: Element, name: RegExp) => [...el.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')].find((b) => name.test(b.textContent!))!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-smart-recommendation", () => {
  test("the host is the root and the region, named by the heading", async () => {
    const el = await fixture<TcSmartRecommendation>(html`<tc-smart-recommendation .options=${options}></tc-smart-recommendation>`);
    expect(el.dataset.ui).toBe("sr");
    expect(el.dataset.look).toBe("standard");
    expect(el.getAttribute("role")).toBe("region");
    expect(el.getAttribute("aria-label")).toBe("Smart recommendation");
    el.heading = "Recommended";
    await settle();
    expect(el.getAttribute("aria-label")).toBe("Recommended");
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: value, accepted and open follow their properties`, async () => {
      const el = await fixture<TcSmartRecommendation>(html`<tc-smart-recommendation look=${look} .options=${options}></tc-smart-recommendation>`);
      expect(el.dataset.look).toBe(look);
      expect(reason(el)).toBe("Only changed rows move.");
      el.value = "full";
      await settle();
      expect(reason(el)).toBe("Copies everything again.");
      expect(el.querySelector(".ui-sr__pill")!.textContent).toBe("Alternative");
      el.value = "inc";
      el.accepted = "inc";
      await settle();
      expect(el.hasAttribute("data-accepted")).toBe(true);
      el.accepted = null;
      el.open = false;
      await settle();
      expect(el.hasAttribute("data-accepted")).toBe(false);
      expect(el.querySelector(".ui-sr__toggle")!.getAttribute("aria-expanded")).toBe("false");
      expect(el.querySelector(".ui-sr__body")!.hasAttribute("inert")).toBe(true);
    });

    test(`${look}: an empty options list renders instead of crashing`, async () => {
      const el = await fixture<TcSmartRecommendation>(html`<tc-smart-recommendation look=${look} .options=${[]}></tc-smart-recommendation>`);
      expect(reason(el)).toMatch(/No recommendation/);
      expect(button(el, /Accept/)).toBeUndefined();
    });

    test(`${look}: picking an alternative is reported, and a new set of options goes back to the recommendation`, async () => {
      const el = await fixture<TcSmartRecommendation>(html`<tc-smart-recommendation look=${look} .options=${options}></tc-smart-recommendation>`);
      const seen: string[] = [];
      el.addEventListener("tc-value-change", (e) => seen.push((e as unknown as CustomEvent<{ value: string }>).detail.value));
      button(el, /Alternatives/).click();
      await settle();
      item(el, /Full sync/).click();
      await settle();
      expect(seen).toEqual(["full"]);
      expect(reason(el)).toBe("Copies everything again.");
      el.options = other;
      await settle();
      expect(reason(el)).toBe("Keep a warm cache.");
    });

    test(`${look}: a new set of options clears an uncontrolled acceptance`, async () => {
      const el = await fixture<TcSmartRecommendation>(html`<tc-smart-recommendation look=${look} .options=${options}></tc-smart-recommendation>`);
      button(el, /Accept incremental sync/).click();
      await settle();
      expect(el.hasAttribute("data-accepted")).toBe(true);
      el.options = other;
      await settle();
      expect(el.hasAttribute("data-accepted")).toBe(false);
    });

    test(`${look}: an async accept stays pending, counts only once it resolves, and reports a rejection`, async () => {
      const calls: { resolve: () => void; reject: (e: Error) => void }[] = [];
      const accepted: Recommendation[] = [];
      const acceptOption = (o: Recommendation) => {
        accepted.push(o);
        return new Promise<void>((resolve, reject) => calls.push({ resolve, reject }));
      };
      const el = await fixture<TcSmartRecommendation>(html`<tc-smart-recommendation look=${look} .options=${options} .acceptOption=${acceptOption}></tc-smart-recommendation>`);
      const accept = () => button(el, /Accept incremental sync/);
      accept().click();
      await settle();
      expect(accept().getAttribute("aria-busy")).toBe("true");
      accept().click();
      expect(accepted).toHaveLength(1);
      calls[0].reject(new Error("offline"));
      await settle();
      expect(el.querySelector('[role="alert"]')!.textContent).toMatch(/Couldn't accept it/);
      expect(el.hasAttribute("data-accepted")).toBe(false);
      accept().click();
      calls[1].resolve();
      await settle();
      expect(el.hasAttribute("data-accepted")).toBe(true);
    });

    test(`${look}: controlled accepted – Accept is reported, not applied`, async () => {
      const el = await fixture<TcSmartRecommendation>(html`<tc-smart-recommendation look=${look} .options=${options}></tc-smart-recommendation>`);
      const seen: (string | null)[] = [];
      el.addEventListener("tc-accepted-change", (e) => {
        e.preventDefault();
        seen.push((e as CustomEvent<{ accepted: string | null }>).detail.accepted);
      });
      button(el, /Accept incremental sync/).click();
      await settle();
      expect(seen).toEqual(["inc"]);
      expect(el.hasAttribute("data-accepted")).toBe(false);
    });

    test(`${look}: controlled open – the head is reported, not applied`, async () => {
      const el = await fixture<TcSmartRecommendation>(html`<tc-smart-recommendation look=${look} .options=${options}></tc-smart-recommendation>`);
      el.addEventListener("tc-open-change", (e) => e.preventDefault());
      el.querySelector<HTMLButtonElement>(".ui-sr__toggle")!.click();
      await settle();
      expect(el.querySelector(".ui-sr__toggle")!.getAttribute("aria-expanded")).toBe("true");
    });

    test(`${look}: menu – focus moves in, arrows move, Esc returns focus to the trigger`, async () => {
      const el = await fixture<TcSmartRecommendation>(html`<tc-smart-recommendation look=${look} .options=${options}></tc-smart-recommendation>`);
      const trigger = button(el, /Alternatives/);
      trigger.focus();
      trigger.click();
      await settle();
      const inc = item(el, /Incremental/);
      const full = item(el, /Full sync/);
      expect(document.activeElement).toBe(inc);
      expect(inc.querySelector(".ui-sr__check")).toBeTruthy();
      expect(trigger.getAttribute("aria-controls")).toBe(el.querySelector('[role="menu"]')!.id);
      key(inc, "ArrowDown");
      expect(document.activeElement).toBe(full);
      key(full, "End");
      expect(document.activeElement).toBe(full);
      key(full, "Home");
      expect(document.activeElement).toBe(inc);
      key(inc, "Escape");
      await settle();
      expect(el.querySelector('[role="menu"]')).toBeNull();
      expect(document.activeElement).toBe(trigger);
      // ArrowDown on the trigger opens it too
      key(trigger, "ArrowDown");
      await settle();
      expect(document.activeElement).toBe(item(el, /Incremental/));
    });

    test(`${look}: picking an option closes the menu and returns focus to the trigger`, async () => {
      const el = await fixture<TcSmartRecommendation>(html`<tc-smart-recommendation look=${look} .options=${options}></tc-smart-recommendation>`);
      button(el, /Alternatives/).click();
      await settle();
      const full = item(el, /Full sync/);
      full.focus();
      full.click();
      await settle();
      expect(el.querySelector('[role="menu"]')).toBeNull();
      expect(document.activeElement).toBe(button(el, /Alternatives/));
    });

    test(`${look}: a pointer outside closes the menu`, async () => {
      const el = await fixture<TcSmartRecommendation>(html`<tc-smart-recommendation look=${look} .options=${options}></tc-smart-recommendation>`);
      button(el, /Alternatives/).click();
      await settle();
      document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      await settle();
      expect(el.querySelector('[role="menu"]')).toBeNull();
    });

    test(`${look}: Accept moves focus to Undo, Undo back to Accept (2.4.3)`, async () => {
      const el = await fixture<TcSmartRecommendation>(html`<tc-smart-recommendation look=${look} .options=${options}></tc-smart-recommendation>`);
      const accept = button(el, /Accept incremental sync/);
      accept.focus();
      accept.click();
      await settle();
      const undo = button(el, /Undo/);
      expect(document.activeElement).toBe(undo);
      expect(el.querySelector('[role="status"]')!.textContent).toMatch(/Incremental sync accepted/);
      undo.click();
      await settle();
      expect(document.activeElement).toBe(button(el, /Accept incremental sync/));
    });
  }

  test("an element reason is cloned", async () => {
    const b = document.createElement("b");
    b.textContent = "3%";
    const el = await fixture<TcSmartRecommendation>(html`<tc-smart-recommendation .options=${[{ ...options[0], reason: b }]}></tc-smart-recommendation>`);
    expect(el.querySelector(".ui-sr__reason b")!.textContent).toBe("3%");
    expect(b.isConnected).toBe(false);
  });

  test("React wrapper: node reasons, onAccept with the app's option, and uncontrolled state across re-renders", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const opts = [{ ...options[0], reason: React.createElement(React.Fragment, null, "Only ", React.createElement("b", null, "3%"), " changed.") }, options[1]];
    const got: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(SmartRecommendation, { options: opts, onAccept: (o) => void got.push(o), "data-n": n } as React.ComponentProps<typeof SmartRecommendation>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-smart-recommendation")!;
    expect(reason(el)).toBe("Only 3% changed.");
    button(el, /Accept incremental sync/).click();
    await settle();
    expect(got[0]).toBe(opts[0]);
    expect(el.hasAttribute("data-accepted")).toBe(true);
    await act(async () => bump());
    await settle();
    expect(el.hasAttribute("data-accepted")).toBe(true);
    await act(async () => root.unmount());
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-smart-recommendation .options=${options}></tc-smart-recommendation>
      <tc-smart-recommendation look="clean" heading="Clean" .options=${options} .accepted=${"inc"}></tc-smart-recommendation>
    </div>`);
    // Contrast is checked once the entrance fades have finished
    await finish(wrap);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
