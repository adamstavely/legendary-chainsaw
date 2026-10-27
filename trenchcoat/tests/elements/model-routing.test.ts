/*
 * <tc-model-routing> in real browsers: the route, health and residency, reordering by keyboard and pointer, removal,
 * the route test round trip, controlled use, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/model-routing";
import type { ModelRoutingValue, RouteTarget, RouteTargetHealth, TcModelRouting } from "../../src/elements/model-routing";
import { ModelRouting } from "../../src/elements/react/model-routing";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const TARGETS: RouteTarget[] = [
  { id: "long", label: "Atlas Long", detail: "1M context", region: "EU" },
  { id: "main", label: "Atlas 2", region: "EU" },
  { id: "mini", label: "Swift Mini", region: "EU" },
  { id: "us", label: "Atlas 2 (US)", region: "US" },
];
const VALUE: ModelRoutingValue = {
  rules: [
    { id: "r1", name: "Long inputs", conditions: ["Input is over 100k tokens"], target: "long" },
    { id: "r2", name: "Quick lookups", conditions: ["Task is classification", "Input is under 2k tokens"], target: "mini" },
    { id: "r3", conditions: [], target: "main" },
  ],
  fallbacks: ["main", "us"],
};
const HEALTH: Record<string, RouteTargetHealth> = {
  long: { status: "down", breaker: "open", note: "Opened 3 min ago" },
  main: { status: "healthy", breaker: "closed", note: "p95 2.1s" },
  us: { status: "degraded", breaker: "half-open" },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- event details differ per test
const on = (el: Element, name: string, fn: (e: CustomEvent<Record<string, any>>) => void) => el.addEventListener(name, fn as EventListener);
const mount = (look: "standard" | "clean" = "standard", value = VALUE) =>
  fixture<TcModelRouting>(html`<tc-model-routing look=${look} .targets=${TARGETS} .value=${value} .health=${HEALTH} .residency=${["EU"]}></tc-model-routing>`);
const rules = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-mrt__rule")];
const handle = (el: Element, list: "rules" | "fallbacks", i: number) => el.querySelector<HTMLButtonElement>(`[data-list="${list}"] > [data-at="${i}"] .ui-mrt__handle`)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-model-routing", () => {
  test("the host is a group named by the heading; both looks; the header counts and health pill", async () => {
    const el = await mount();
    expect(el.dataset.ui).toBe("mrt");
    expect(el.getAttribute("role")).toBe("group");
    expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Model routing");
    // Standard: the header on the tray, above the card
    expect(el.querySelector(":scope > .tc-head + .ui-mrt__card")).toBeTruthy();
    expect(el.querySelector(".tc-head__sub")!.textContent!.replace(/\s+/g, " ").trim()).toBe("3 rules · 2 fallbacks · Stays in EU");
    expect(el.querySelector(".ui-mrt__pill")!.textContent).toBe("1 target unavailable");
    el.look = "clean";
    el.health = { long: { status: "healthy" }, main: { status: "healthy" } };
    await settle();
    expect(el.querySelector(".ui-mrt__card")).toBeNull();
    expect(el.querySelector(".ui-mrt__pill")!.textContent).toBe("All targets healthy");
  });

  test("the route: rules in order with conditions then target; the fallback chain", async () => {
    const el = await mount();
    const rows = rules(el);
    expect(rows.map((r) => r.querySelector(".ui-mrt__rule-name")!.textContent)).toEqual(["Long inputs", "Quick lookups", "Rule 3"]);
    expect(rows[1].querySelector(".ui-mrt__conds")!.textContent!.replace(/\s+/g, " ").trim()).toBe("If Task is classification and Input is under 2k tokens");
    expect(rows[2].querySelector(".ui-mrt__conds")!.textContent!.replace(/\s+/g, " ").trim()).toBe("If any request");
    expect(rows[0].querySelector(".ui-mrt__to")!.textContent).toContain(", send to");
    expect(rows[0].querySelector(".ui-mrt__target-name")!.textContent).toBe("Atlas Long");
    expect(el.querySelector(".ui-mrt__rules")!.tagName).toBe("OL");
    expect([...el.querySelectorAll('[data-list="fallbacks"] .ui-mrt__target-name')].map((n) => n.textContent)).toEqual(["Atlas 2", "Atlas 2 (US)"]);
  });

  test("health, breaker state and residency as the app reports them", async () => {
    const el = await mount();
    const long = rules(el)[0].querySelector(".ui-mrt__target")!;
    expect(long.getAttribute("data-tone")).toBe("danger");
    expect(long.querySelector(".ui-mrt__status")!.textContent).toBe("Down");
    expect(long.querySelector(".ui-mrt__breaker")!.textContent).toBe("Breaker open");
    expect(long.querySelector(".ui-mrt__note")!.textContent).toBe("Opened 3 min ago");
    const us = el.querySelector('[data-list="fallbacks"] [data-at="1"] .ui-mrt__target')!;
    expect(us.getAttribute("data-tone")).toBe("warning");
    expect(us.querySelector(".ui-mrt__breaker")!.textContent).toBe("Breaker half-open");
    expect(us.querySelector(".ui-mrt__region")!.hasAttribute("data-outside")).toBe(true);
    expect(us.querySelector(".ui-mrt__outside")!.textContent).toBe("Outside EU");
    // A closed breaker isn't called out; no health means a neutral dot and the target's own detail
    const main = el.querySelector('[data-list="fallbacks"] [data-at="0"] .ui-mrt__target')!;
    expect(main.querySelector(".ui-mrt__breaker")).toBeNull();
    const mini = rules(el)[1].querySelector(".ui-mrt__target")!;
    expect(mini.getAttribute("data-tone")).toBe("neutral");
  });

  test("keyboard reorder: ↑/↓ on a handle, Home/End; focus stays on the moved handle; a status message says where", async () => {
    const el = await mount();
    const seen: ModelRoutingValue[] = [];
    on(el, "tc-value-change", (e) => seen.push(e.detail.value as ModelRoutingValue));
    const h = handle(el, "rules", 0);
    expect(h.getAttribute("aria-label")).toBe("Move Long inputs, position 1 of 3");
    h.focus();
    key(h, "ArrowDown");
    await settle();
    expect(el.value.rules.map((r) => r.id)).toEqual(["r2", "r1", "r3"]);
    expect(document.activeElement).toBe(handle(el, "rules", 1));
    expect(el.querySelector(":scope > .ui-mrt__sr[role=status]")!.textContent).toBe("Long inputs moved to position 2 of 3");
    key(handle(el, "rules", 1), "End");
    await settle();
    expect(el.value.rules.map((r) => r.id)).toEqual(["r2", "r3", "r1"]);
    key(handle(el, "rules", 2), "Home");
    await settle();
    expect(el.value.rules.map((r) => r.id)).toEqual(["r1", "r2", "r3"]);
    // ↑ at the top does nothing
    key(handle(el, "rules", 0), "ArrowUp");
    await settle();
    expect(seen).toHaveLength(3);
    // The chain also moves with ← / →
    const f = handle(el, "fallbacks", 1);
    f.focus();
    key(f, "ArrowLeft");
    await settle();
    expect(el.value.fallbacks).toEqual(["us", "main"]);
    expect(document.activeElement).toBe(handle(el, "fallbacks", 0));
  });

  test("pointer reorder: drag a handle past another row", async () => {
    const el = await mount();
    const h = handle(el, "rules", 0);
    const last = rules(el)[2].getBoundingClientRect();
    const start = h.getBoundingClientRect();
    const opts = { bubbles: true, pointerId: 7, button: 0, isPrimary: true };
    h.dispatchEvent(new PointerEvent("pointerdown", { ...opts, clientX: start.x + 4, clientY: start.y + 4 }));
    h.dispatchEvent(new PointerEvent("pointermove", { ...opts, clientX: start.x + 4, clientY: last.bottom - 2 }));
    await settle();
    expect(rules(el)[0].dataset.drop).toBe("dragging");
    expect(rules(el)[2].dataset.drop).toBe("after");
    h.dispatchEvent(new PointerEvent("pointerup", { ...opts, clientX: start.x + 4, clientY: last.bottom - 2 }));
    await settle();
    expect(el.value.rules.map((r) => r.id)).toEqual(["r2", "r3", "r1"]);
  });

  test("remove a rule or a fallback; add a fallback; focus doesn't fall to the page", async () => {
    const el = await mount();
    const btn = rules(el)[1].querySelector<HTMLButtonElement>(".ui-mrt__remove")!;
    expect(btn.getAttribute("aria-label")).toBe("Remove Quick lookups");
    btn.focus();
    btn.click();
    await settle();
    expect(el.value.rules.map((r) => r.id)).toEqual(["r1", "r3"]);
    expect(el.contains(document.activeElement)).toBe(true);
    el.querySelector<HTMLButtonElement>('[data-list="fallbacks"] [data-at="1"] .ui-mrt__remove')!.click();
    await settle();
    expect(el.value.fallbacks).toEqual(["main"]);
    const select = el.querySelector<HTMLSelectElement>(".ui-mrt__select")!;
    expect([...select.options].map((o) => o.value)).toEqual(["", "long", "mini", "us"]);
    select.value = "mini";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.value.fallbacks).toEqual(["main", "mini"]);
    expect(select.value).toBe("");
    // No chain: a warning; readonly hides the controls
    el.value = { rules: [], fallbacks: [] };
    await settle();
    expect(el.querySelector(".ui-mrt__empty")!.textContent).toContain("No rules");
    expect(el.querySelector(".ui-mrt__warn")!.textContent).toContain("No fallback");
    el.value = VALUE;
    el.readonly = true;
    await settle();
    expect(el.querySelector(".ui-mrt__handle, .ui-mrt__remove, .ui-mrt__select")).toBeNull();
  });

  test("controlled: preventDefault keeps the value", async () => {
    const el = await mount();
    on(el, "tc-value-change", (e) => e.preventDefault());
    key(handle(el, "rules", 0), "ArrowDown");
    rules(el)[2].querySelector<HTMLButtonElement>(".ui-mrt__remove")!.click();
    await settle();
    expect(el.value).toEqual(VALUE);
    expect(rules(el)).toHaveLength(3);
  });

  test("test a route: asks the app, shows pending, then the app's explanation with the matched rule and skipped target", async () => {
    const el = await mount();
    const asked: string[] = [];
    on(el, "tc-route-test", (e) => asked.push(e.detail.input as string));
    const input = el.querySelector<HTMLInputElement>(".ui-mrt__test-input")!;
    expect(document.querySelector(`label[for="${input.id}"]`)!.textContent).toBe("Test a route");
    const submit = el.querySelector<HTMLButtonElement>(".ui-mrt__test button[type=submit]")!;
    expect(submit.disabled).toBe(true);
    input.value = "  140k-token contract  ";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    submit.click();
    await settle();
    expect(asked).toEqual(["140k-token contract"]);
    const result = el.querySelector(".ui-mrt__result")!;
    expect(result.getAttribute("role")).toBe("status");
    expect(result.textContent).toContain("Asking where “140k-token contract” would go…");
    expect(submit.textContent).toContain("Testing…");
    el.testResult = { input: "140k-token contract", rule: "r1", target: "main", reasons: ["Input is 140k tokens.", "Atlas Long's breaker is open – skipped."], skipped: ["long"] };
    await settle();
    expect(result.querySelector(".ui-mrt__verdict")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Long inputs matched, so it goes to Atlas 2.");
    expect([...result.querySelectorAll(".ui-mrt__reasons li")].map((l) => l.textContent)).toEqual(["Input is 140k tokens.", "Atlas Long's breaker is open – skipped."]);
    expect(rules(el)[0].hasAttribute("data-matched")).toBe(true);
    expect(rules(el)[0].querySelector(".ui-mrt__hit")!.textContent).toBe("Matched");
    expect(rules(el)[0].querySelector(".ui-mrt__target")!.hasAttribute("data-skipped")).toBe(true);
    expect(el.querySelector('[data-list="fallbacks"] [data-at="0"] .ui-mrt__target')!.hasAttribute("data-chosen")).toBe(true);
    // The path lights up: the matched rule, the rules below it bypassed on the way to the fallback chain
    expect(rules(el).map((r) => r.dataset.path)).toEqual(["hit", "after", "after"]);
    expect(rules(el).map((r) => r.querySelector(".ui-mrt__tag")?.textContent ?? "")).toEqual(["", "Not checked", "Not checked"]);
    const rails = [...el.querySelectorAll<HTMLElement>(".ui-mrt__rail")];
    expect(rails.map((x) => [x.hasAttribute("data-in"), x.hasAttribute("data-out")])).toEqual([
      [false, true],
      [true, true],
      [true, true],
      [true, true],
      [true, false],
    ]);
    expect(el.path!.fallbacks).toEqual(["hit", "after"]);
    expect(el.querySelector(".ui-mrt__otherwise .ui-mrt__hit")!.textContent).toBe("Fell back");
    expect(el.querySelector(".ui-mrt__req")!.textContent).toBe("Testing “140k-token contract”");
    // A rule that matched and could take it: the chain isn't needed
    el.testResult = { input: "ticket", rule: "r2", target: "mini", reasons: [] };
    await settle();
    expect(rules(el).map((r) => r.dataset.path)).toEqual(["passed", "hit", "after"]);
    expect(rules(el)[0].querySelector(".ui-mrt__tag")!.textContent).toBe("No match");
    expect(el.querySelector(".ui-mrt__otherwise .ui-mrt__tag")!.textContent).toBe("Not needed");
    // No rule and nowhere to go
    el.testResult = { input: "x", rule: null, target: null, reasons: [] };
    await settle();
    expect(result.querySelector(".ui-mrt__answer")!.getAttribute("data-state")).toBe("none");
    expect(result.textContent!.replace(/\s+/g, " ")).toContain("No rule matched – the fallback chain was used, and no target could take it.");
    expect(el.querySelector(".ui-mrt__otherwise")!.getAttribute("data-path")).toBe("hit");
    expect(el.path!.fallbacks).toEqual(["skipped", "skipped"]);
    // Prevented: nothing pending
    on(el, "tc-route-test", (e) => e.preventDefault());
    el.test("again");
    await settle();
    expect(result.textContent).not.toContain("Asking");
  });

  test("React wrapper: onChange, onTest, controlled value, and no pending test without onTest", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onChange = vi.fn();
    const onTest = vi.fn();
    let rerender: () => void = () => {};
    function App() {
      const [, set] = React.useState(0);
      rerender = () => set((n) => n + 1);
      return React.createElement(ModelRouting, { title: "Routing", targets: TARGETS, defaultValue: VALUE, onChange, onTest });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcModelRouting>("tc-model-routing")!;
    expect(el.heading).toBe("Routing");
    await act(async () => key(handle(el, "rules", 0), "ArrowDown"));
    await settle();
    expect(onChange.mock.calls[0][0].rules.map((r: { id: string }) => r.id)).toEqual(["r2", "r1", "r3"]);
    await act(async () => rerender());
    await settle();
    expect(el.value.rules.map((r) => r.id)).toEqual(["r2", "r1", "r3"]);
    await act(async () => el.test("short ticket"));
    expect(onTest).toHaveBeenCalledWith("short ticket", el.value);
    await act(async () => root.render(React.createElement(ModelRouting, { targets: TARGETS, value: VALUE, onChange })));
    await settle();
    const ctl = host.querySelector<TcModelRouting>("tc-model-routing")!;
    await act(async () => key(handle(ctl, "rules", 0), "ArrowDown"));
    await settle();
    expect(ctl.value).toEqual(VALUE);
    await act(async () => ctl.test("no listener"));
    await settle();
    expect(ctl.querySelector(".ui-mrt__result")!.textContent).not.toContain("Asking");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const)
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme}>
        <tc-model-routing .targets=${TARGETS} .value=${VALUE} .health=${HEALTH} .residency=${["EU"]} .testResult=${{ input: "a", rule: "r1", target: "main", reasons: ["Because."], skipped: ["long"] }}></tc-model-routing>
        <tc-model-routing look="clean" heading="Clean" .targets=${TARGETS} .value=${VALUE} .health=${HEALTH}></tc-model-routing>
        <tc-model-routing look="clean" heading="Empty" .targets=${TARGETS} .testResult=${{ input: "b", rule: null, target: null, reasons: [] }}></tc-model-routing>
      </div>`);
      await settle();
      for (const a of document.getAnimations()) if (a.effect?.getTiming().iterations !== Infinity) a.finish();
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });

  test("theme and motion: no .dark colours; reduced motion turns animation off", () => {
    const css = (customElements.get("tc-model-routing") as unknown as { css: string }).css;
    expect(css).not.toMatch(/\.dark|data-(?:tc-)?theme/);
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{\s*\[data-ui="mrt"\] \*/);
  });
});
