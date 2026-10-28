/*
 * <tc-pricing-plans> in real browsers: the heading, the billing switch (a radiogroup with arrow keys) and a card per
 * plan; prices follow the period and roll only after a switch, read once as text; the details toggle opens and closes
 * every card together and names what it controls; the call to action reports the plan and period; cancelable changes;
 * narrow width; the React wrapper with React-node icons; axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/pricing-plans";
import { pricingDefaultPlans, type PricingBillingChange, type PricingPlan, type PricingPlanSelect, type TcPricingPlans } from "../../src/elements/pricing-plans";
import { PricingPlans, SeatsIcon } from "../../src/elements/react/pricing-plans";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const make = (look: "standard" | "clean" = "standard") => fixture<TcPricingPlans>(html`<tc-pricing-plans look=${look}></tc-pricing-plans>`);
const radio = (el: Element, name: string) => [...el.querySelectorAll<HTMLElement>('[role="radio"]')].find((r) => (r.querySelector(".ui-seg__text") ?? r.querySelector(".ui-seg__label"))?.textContent?.trim() === name)!;
const prices = (el: Element) => [...el.querySelectorAll(".ui-pp__amount")].map((a) => (a.querySelector(".ui-pp__sr") ?? a).textContent);
const buttons = (el: Element, name: string) => [...el.querySelectorAll<HTMLButtonElement>("button")].filter((b) => b.textContent?.trim() === name);

describe("tc-pricing-plans", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: heading, billing radiogroup with one tab stop, three cards with limits, details and features`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("pp");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector("h2")!.textContent).toBe("Choose your plan");
      const group = el.querySelector('[role="radiogroup"]')!;
      expect(group.getAttribute("aria-label")).toBe("Billing period");
      expect([...el.querySelectorAll<HTMLElement>('[role="radio"]')].filter((r) => r.tabIndex === 0)).toHaveLength(1);
      expect(radio(el, "Yearly").getAttribute("aria-checked")).toBe("true");
      expect(el.querySelectorAll(".ui-pp__card")).toHaveLength(3);
      expect(el.querySelector(".ui-pp__card[data-featured] .ui-pp__badge")!.textContent).toBe("Popular");
      expect(prices(el)).toEqual(["$24", "$79", "$199"]);
      expect(el.querySelector(".ui-pp__limits")!.textContent).toContain("Monthly visitors");
      const [list] = el.querySelectorAll('[aria-label="Integrations"]');
      expect([...list.querySelectorAll("li")].map((li) => li.textContent?.trim())).toContain("Stripe");
      expect(el.querySelector(".ui-pp__features li[data-included] .ui-pp__sr")!.textContent).toBe("(included)");
    });
  }

  test("arrow keys switch the period: prices follow and roll, read once as text", async () => {
    const el = await make();
    const changes: PricingBillingChange[] = [];
    el.addEventListener("tc-billing-change", (e) => changes.push((e as CustomEvent<PricingBillingChange>).detail));
    // The digits don't roll on the first render
    expect(el.querySelector(".ui-pp__digit")).toBeNull();
    radio(el, "Yearly").focus();
    await userEvent.keyboard("{ArrowLeft}");
    await settle();
    expect(changes).toEqual([{ billing: "monthly" }]);
    expect(el.billing).toBe("monthly");
    expect(el.querySelector(".ui-pp__switch")!.getAttribute("data-billing")).toBe("monthly");
    expect(prices(el)).toEqual(["$29", "$99", "$249"]);
    const amount = el.querySelector(".ui-pp__amount")!;
    expect(amount.hasAttribute("aria-label")).toBe(false);
    const digits = [...amount.querySelectorAll(".ui-pp__digit")];
    expect(digits.map((d) => d.textContent).join("")).toBe("$29");
    expect(digits.every((d) => d.getAttribute("aria-hidden") === "true")).toBe(true);
    expect(document.activeElement).toBe(radio(el, "Monthly"));
  });

  test("tc-billing-change prevented: the period stays (controlled use)", async () => {
    const el = await make();
    el.addEventListener("tc-billing-change", (e) => e.preventDefault());
    radio(el, "Monthly").click();
    await settle();
    expect(el.billing).toBe("yearly");
    expect(radio(el, "Yearly").getAttribute("aria-checked")).toBe("true");
    expect(prices(el)).toEqual(["$24", "$79", "$199"]);
  });

  test("details open and close together; the toggle names what it controls, and the closed region is inert", async () => {
    const el = await make();
    const [toggle] = buttons(el, "Hide details");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    const region = document.getElementById(toggle.getAttribute("aria-controls")!)!;
    expect(region.hasAttribute("inert")).toBe(false);
    toggle.click();
    await settle();
    expect(buttons(el, "Show details")).toHaveLength(3);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(region.hasAttribute("inert")).toBe(true);
    expect(el.querySelectorAll(".ui-pp__details[data-open]")).toHaveLength(0);
    // Prevented, nothing changes
    el.addEventListener("tc-details-change", (e) => e.preventDefault());
    buttons(el, "Show details")[1].click();
    await settle();
    expect(el.details).toBe(false);
  });

  test("the call to action reports the plan and the period", async () => {
    const el = await make();
    const picked: [string, string][] = [];
    el.addEventListener("tc-plan-select", (e) => {
      const d = (e as CustomEvent<PricingPlanSelect>).detail;
      picked.push([d.plan.id, d.billing]);
    });
    buttons(el, "Start free trial")[1].click();
    await settle();
    expect(picked).toEqual([["growth", "yearly"]]);
  });

  test("own plans: element icons, a custom call to action, the currency; bad prices show 0", async () => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.classList.add("mine");
    const plans: PricingPlan[] = [
      { id: "a", name: "A", price: { monthly: 10, yearly: Number.NaN }, limits: [{ icon, label: "Rows", value: "1M" }], sync: "Daily", pick: 1, features: [{ label: "Export", included: false }], cta: "Talk to sales" },
    ];
    const el = await fixture<TcPricingPlans>(html`<tc-pricing-plans currency="€" .plans=${plans}></tc-pricing-plans>`);
    expect(el.querySelector(".ui-pp__icon svg.mine")).not.toBeNull();
    expect(buttons(el, "Talk to sales")).toHaveLength(1);
    expect(prices(el)).toEqual(["€0"]);
    expect(el.querySelector(".ui-pp__features li .ui-pp__sr")!.textContent).toBe("(not included)");
  });

  test("narrow: one column", async () => {
    const el = await make();
    el.style.width = "360px";
    await settle();
    const cards = [...el.querySelectorAll(".ui-pp__card")].map((c) => c.getBoundingClientRect());
    expect(cards[1].top).toBeGreaterThan(cards[0].bottom - 1);
    expect(Math.round(cards[0].left)).toBe(Math.round(cards[1].left));
  });

  test("React: uncontrolled billing survives re-renders; controlled waits; React-node icons and onSelect", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const selected: string[] = [];
    const plans = pricingDefaultPlans().map((p) => ({ ...p, limits: p.limits.map((l) => ({ ...l, icon: React.createElement(SeatsIcon) })), onSelect: (b: string) => void selected.push(`${p.id}:${b}`) }));
    let bump = () => {};
    const reports: string[] = [];
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(PricingPlans, { plans, onBillingChange: (b) => void reports.push(b), "data-n": n } as React.ComponentProps<typeof PricingPlans>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-pricing-plans")!;
    expect(el.querySelectorAll(".ui-pp__icon svg").length).toBe(9);
    await act(async () => radio(el, "Monthly").click());
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.billing).toBe("monthly");
    expect(reports).toEqual(["monthly"]);
    await act(async () => buttons(el, "Start free trial")[0].click());
    expect(selected).toEqual(["starter:monthly"]);

    await act(async () => root.render(React.createElement(PricingPlans, { billing: "yearly", onBillingChange: (b) => void reports.push(b) })));
    await settle();
    const el2 = host.querySelector("tc-pricing-plans")!;
    await act(async () => radio(el2, "Monthly").click());
    await settle();
    expect(reports).toEqual(["monthly", "monthly"]);
    expect(el2.billing).toBe("yearly");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="background: var(--tc-surface-base)">
        <tc-pricing-plans></tc-pricing-plans>
        <tc-pricing-plans look="clean" billing="monthly" .details=${false}></tc-pricing-plans>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
