/*
 * <tc-cost-waterfall> in real browsers: the waterfall's rows and bars, both orders and measures, the costliest step,
 * details, keyboard, events with preventDefault, live steps rolling the total, empty and narrow states, the React
 * wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { userEvent } from "vitest/browser";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/cost-waterfall";
import { costWaterfall, type CostStep, type TcCostWaterfall } from "../../src/elements/cost-waterfall";
import { CostWaterfall } from "../../src/elements/react/cost-waterfall";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const STEPS: CostStep[] = [
  { id: "plan", name: "Plan", kind: "llm", model: "large-1", tokensIn: 1000, tokensOut: 200, cost: 0.05, duration: 2000 },
  { id: "search", name: "Web search", kind: "tool", cost: 0.01, duration: 1300 },
  { id: "write", name: "Write", kind: "llm", model: "large-1", tokensIn: 4000, tokensOut: 2000, cost: 0.3, duration: 16000, input: "the data", output: "two pages" },
  { id: "research", name: "Researcher", kind: "subagent", model: "small-2", tokensIn: 9000, tokensOut: 1000, cost: 0.04, duration: 13000 },
];
const make = (look: "standard" | "clean" = "standard", steps = STEPS) =>
  fixture<TcCostWaterfall>(html`<div style="width: 720px"><tc-cost-waterfall look=${look} locale="en-US" .steps=${steps}></tc-cost-waterfall></div>`).then(
    (wrap) => wrap.querySelector("tc-cost-waterfall") as TcCostWaterfall,
  );
const text = (el: Element | null) => el?.textContent!.replace(/\s+/g, " ").trim();
const facts = (el: Element) => [...el.querySelectorAll("dl > div")].map((d) => `${text(d.querySelector("dt"))}: ${text(d.querySelector("dd"))}`);
const names = (el: Element) => [...el.querySelectorAll("button.ui-cwf__row .ui-cwf__title")].map(text);

describe("tc-cost-waterfall", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: rows by cost, the costliest marked, and the total`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("cwf");
      expect(el.dataset.look).toBe(look);
      expect(names(el)).toEqual(["Write", "Plan", "Researcher", "Web search"]);
      const top = el.querySelector(".ui-cwf__item[data-top]")!;
      expect(text(top.querySelector(".ui-cwf__title"))).toBe("Write");
      expect(text(top.querySelector(".ui-cwf__kind"))).toBe("LLM call · Costliest");
      expect(text(el.querySelector(".ui-cwf__total-value"))).toBe("$0.40");
      expect(text(el.querySelector(".ui-cwf__head-total"))).toBe("$0.40");
      expect([...el.querySelectorAll("button.ui-cwf__row")].filter((b) => b.getAttribute("tabindex") === "0")).toHaveLength(1);
    });
  }

  test("costWaterfall steps each bar from where the last one ended", () => {
    const { rows, total, topId } = costWaterfall(STEPS, "cost", "run");
    expect(rows.map((r) => [r.step.id, r.from, r.to])).toEqual([
      ["plan", 0, 0.05],
      ["search", 0.05, 0.060000000000000005],
      ["write", 0.060000000000000005, 0.36],
      ["research", 0.36, 0.39999999999999997],
    ]);
    expect(total).toBeCloseTo(0.4);
    expect(topId).toBe("write");
    expect(costWaterfall(STEPS, "tokens", "cost").rows.map((r) => r.step.id)).toEqual(["research", "write", "plan", "search"]);
    expect(costWaterfall([], "cost", "cost")).toEqual({ rows: [], total: 0, topId: null });
  });

  test("bars start where the step before them ended", async () => {
    const el = await make();
    el.order = "run";
    await el.updateComplete;
    const bars = [...el.querySelectorAll<HTMLElement>("button.ui-cwf__row .ui-cwf__step")];
    expect(bars.map((b) => b.style.getPropertyValue("--tc-cwf-from"))).toEqual(["0%", "12.5%", "15%", "90%"]);
    expect(bars[3].style.getPropertyValue("--tc-cwf-to")).toBe("100%");
  });

  test("Tokens and In order switch, fire their events and can be held back", async () => {
    const el = await make();
    const seen: unknown[] = [];
    el.addEventListener("tc-measure-change", (e) => seen.push((e as CustomEvent).detail));
    el.addEventListener("tc-order-change", (e) => seen.push((e as CustomEvent).detail));
    const [measure, order] = el.querySelectorAll(".ui-cwf__seg");
    measure.querySelectorAll<HTMLButtonElement>('[role="radio"]')[1].click();
    await el.updateComplete;
    expect(el.measure).toBe("tokens");
    expect(text(el.querySelector(".ui-cwf__total-value"))).toBe("17.2K tokens");
    expect(names(el)[0]).toBe("Researcher");
    order.querySelectorAll<HTMLButtonElement>('[role="radio"]')[1].click();
    await el.updateComplete;
    expect(names(el)).toEqual(["Plan", "Web search", "Write", "Researcher"]);
    expect(seen).toEqual([{ measure: "tokens" }, { order: "run" }]);
    el.addEventListener("tc-measure-change", (e) => e.preventDefault());
    measure.querySelectorAll<HTMLButtonElement>('[role="radio"]')[0].click();
    await el.updateComplete;
    expect(el.measure).toBe("tokens");
  });

  test("arrow keys in a switch pick the other option", async () => {
    const el = await make();
    const radio = el.querySelector<HTMLButtonElement>('.ui-cwf__seg [aria-checked="true"]')!;
    radio.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.poll(() => el.measure).toBe("tokens");
    await expect.poll(() => document.activeElement?.textContent).toBe("Tokens");
  });

  test("a row opens its details; keys move and toggle; preventDefault keeps it shut", async () => {
    const el = await make();
    const seen: unknown[] = [];
    el.addEventListener("tc-open-change", (e) => seen.push((e as CustomEvent).detail.openId));
    const first = el.querySelector<HTMLButtonElement>("button.ui-cwf__row")!;
    first.focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("plan");
    await userEvent.keyboard("{End}");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("search");
    await userEvent.keyboard("{Home}{Enter}");
    await expect.poll(() => el.openId).toBe("write");
    const detail = el.querySelector(".ui-cwf__detail")!;
    expect(detail.id).toBe(first.getAttribute("aria-controls"));
    expect(first.getAttribute("aria-expanded")).toBe("true");
    expect(facts(detail)).toEqual(["Model: large-1", "Cost: $0.30", "Tokens in: 4,000", "Tokens out: 2,000", "Time: 16s", "Share: 75%"]);
    expect(text(detail)).toContain("two pages");
    first.click();
    await el.updateComplete;
    expect(el.openId).toBeNull();
    expect(seen).toEqual(["write", null]);
    el.addEventListener("tc-open-change", (e) => e.preventDefault());
    first.click();
    await el.updateComplete;
    expect(el.openId).toBeNull();
  });

  test("a new step rolls the total up to its new figure", async () => {
    const el = await make();
    el.steps = [...STEPS, { id: "late", name: "Late", kind: "llm", cost: 0.6 }];
    await el.updateComplete;
    await expect.poll(() => text(el.querySelector(".ui-cwf__total-value"))).toBe("$1.00");
    expect(text(el.querySelector(".ui-cwf__item[data-top] .ui-cwf__title"))).toBe("Late");
  });

  test("an open step that disappears closes; no steps say so", async () => {
    const el = await make();
    el.openId = "write";
    await el.updateComplete;
    el.steps = STEPS.filter((s) => s.id !== "write");
    await el.updateComplete;
    expect(el.openId).toBeNull();
    el.steps = [];
    await el.updateComplete;
    expect(text(el.querySelector(".ui-cwf__empty"))).toBe("No steps yet");
  });

  test("narrow: model and time columns are left out", async () => {
    const el = await make();
    el.parentElement!.style.width = "380px";
    await settle(el.parentElement!);
    await expect.poll(() => getComputedStyle(el.querySelector(".ui-cwf__model")!).display).toBe("none");
    expect(getComputedStyle(el.querySelector(".ui-cwf__time")!).display).toBe("none");
  });

  test("React: uncontrolled measure survives re-renders; controlled order stays until the parent changes it", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const orders: string[] = [];
    const render = (n: number) => root.render(React.createElement(CostWaterfall, { title: `Costs ${n}`, steps: STEPS, order: "cost", onOrderChange: (o) => orders.push(o) }));
    await act(async () => render(1));
    const el = host.querySelector("tc-cost-waterfall") as TcCostWaterfall;
    await settle(host);
    expect(text(el.querySelector("h3"))).toBe("Costs 1");
    await act(async () => el.querySelectorAll<HTMLButtonElement>(".ui-cwf__seg")[0].querySelectorAll<HTMLButtonElement>('[role="radio"]')[1].click());
    await act(async () => render(2));
    await settle(host);
    expect(el.measure).toBe("tokens");
    await act(async () => el.querySelectorAll<HTMLButtonElement>(".ui-cwf__seg")[1].querySelectorAll<HTMLButtonElement>('[role="radio"]')[1].click());
    await settle(host);
    expect(orders).toEqual(["run"]);
    expect(el.order).toBe("cost");
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const)
    for (const theme of ["light", "dark"] as const)
      test(`axe: ${look} ${theme}`, async () => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.style.colorScheme = theme;
        const el = await make(look);
        el.openId = "write";
        await finish(el.parentElement!);
        const r = await axe.run(el);
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "";
        expect(r.violations.flatMap((v) => [v.id, ...v.nodes.map((n) => n.target.join(" ") + " " + n.failureSummary)])).toEqual([]);
      });
});
