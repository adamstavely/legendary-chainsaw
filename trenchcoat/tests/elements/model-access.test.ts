/*
 * <tc-model-access> in real browsers: models grouped by provider, the switch and Require approval, the warning for a
 * blocked model agents use, the default model limited to allowed ones, the new-model rule, controlled use, the React
 * wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/model-access";
import { modelAllowed, type ModelAccessChange, type ModelAccessModel, type ModelAccessValue, type TcModelAccess } from "../../src/elements/model-access";
import { ModelAccess } from "../../src/elements/react/model-access";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const models: ModelAccessModel[] = [
  { id: "large-1", name: "large-1", provider: "Provider A", capabilities: ["tools", "long-context"], tier: "high", residency: "EU", usedBy: ["Policy Q&A"] },
  { id: "small-2", name: "small-2", provider: "Provider A", capabilities: ["tools"], tier: "low", usedBy: ["Invoice matcher", "Expense checker"] },
  { id: "vision-1", name: "vision-1", provider: "Provider B", capabilities: ["vision"], tier: "medium", isNew: true },
];
const START: ModelAccessValue = { models: { "large-1": { allowed: true }, "small-2": { allowed: true, approval: true } }, defaultModel: "small-2", blockNew: true };

const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-model="${id}"]`)!;
const toggle = (el: Element, id: string) => row(el, id).querySelector<HTMLButtonElement>(".ui-mac__switch")!;
const approval = (el: Element, id: string) => row(el, id).querySelector<HTMLInputElement>(".ui-mac__check")!;
const select = (el: Element) => el.querySelector<HTMLSelectElement>(".ui-mac__select")!;
const make = (look: "standard" | "clean" = "standard", access: ModelAccessValue = START) =>
  fixture<TcModelAccess>(html`<tc-model-access look=${look} description="Which models we use." .models=${models} .access=${access} .changedBy=${{ name: "Priya Shah", at: Date.UTC(2026, 10, 9, 12) }} locale="en-GB"></tc-model-access>`);

describe("tc-model-access", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: models grouped by provider, with capabilities, tier and residency; the count and who changed it`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("mac");
      expect(el.dataset.look).toBe(look);
      expect([...el.querySelectorAll(".ui-mac__provider")].map((h) => h.textContent)).toEqual(["Provider A", "Provider B"]);
      const sections = el.querySelectorAll("section.ui-mac__group");
      expect(document.getElementById(sections[0].getAttribute("aria-labelledby")!)!.textContent).toBe("Provider A");
      expect([...row(el, "large-1").querySelectorAll(".ui-mac__chip")].map((c) => c.textContent)).toEqual(["Tools", "Long context"]);
      expect(row(el, "large-1").querySelector(".ui-mac__tier .ui-mac__sr")!.textContent).toBe("High cost");
      expect(row(el, "large-1").querySelector(".ui-mac__residency")!.textContent).toBe("Data in EU");
      expect(row(el, "vision-1").querySelector(".ui-mac__new")!.textContent).toBe("New");
      // A new model with blockNew and no rule of its own is blocked
      expect(toggle(el, "vision-1").getAttribute("aria-checked")).toBe("false");
      expect(row(el, "vision-1").hasAttribute("data-blocked")).toBe(true);
      expect(el.querySelector(".ui-mac__count")!.textContent).toBe("2 of 3 allowed");
      expect(el.querySelector(".ui-mac__footer")!.textContent).toContain("Last changed by Priya Shah");
      expect(el.querySelector(".ui-mac__footer time")!.textContent).toBe("9 Nov 2026");
    });
  }

  test("the switch is named by its model; Require approval is named for its model and off while blocked", async () => {
    const el = await make();
    const sw = toggle(el, "large-1");
    expect(sw.getAttribute("role")).toBe("switch");
    const name = sw.getAttribute("aria-labelledby")!.split(" ").map((id) => document.getElementById(id)!.textContent).join(" ");
    expect(name).toBe("large-1 allowed");
    expect(approval(el, "small-2").checked).toBe(true);
    expect(approval(el, "small-2").closest("label")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Require approval for small-2");
    expect(approval(el, "vision-1").disabled).toBe(true);
  });

  test("blocking a model fires tc-access-change, warns about the agents using it, and announces it", async () => {
    const el = await make();
    const seen: ModelAccessChange[] = [];
    el.addEventListener("tc-access-change", (e) => seen.push((e as CustomEvent<ModelAccessChange>).detail));
    toggle(el, "large-1").click();
    await settle();
    expect(seen).toHaveLength(1);
    expect(seen[0].change).toEqual({ type: "allowed", model: "large-1", allowed: false });
    expect(seen[0].access.models["large-1"]).toEqual({ allowed: false, approval: false });
    expect(toggle(el, "large-1").getAttribute("aria-checked")).toBe("false");
    const warn = row(el, "large-1").querySelector(".ui-mac__warn")!;
    expect(warn.textContent!.trim()).toBe("Policy Q&A uses large-1 – blocking it will stop that agent");
    expect(toggle(el, "large-1").getAttribute("aria-describedby")).toBe(warn.id);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("large-1 blocked. Policy Q&A uses large-1 – blocking it will stop that agent");
    // Two agents: the plural
    toggle(el, "small-2").click();
    await settle();
    expect(row(el, "small-2").querySelector(".ui-mac__warn")!.textContent!.trim()).toBe("Invoice matcher and Expense checker use small-2 – blocking it will stop those agents");
  });

  test("the default model lists only allowed ones, and says so when it's blocked", async () => {
    const el = await make();
    expect([...select(el).options].map((o) => o.value)).toEqual(["large-1", "small-2"]);
    expect(select(el).value).toBe("small-2");
    expect(select(el).getAttribute("aria-invalid")).toBe("false");
    toggle(el, "small-2").click();
    await settle();
    expect([...select(el).options].map((o) => o.value)).toEqual(["", "large-1"]);
    expect(select(el).getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(select(el).getAttribute("aria-describedby")!)!.textContent!.trim()).toBe("The default model is blocked – choose another");
    const seen: ModelAccessChange[] = [];
    el.addEventListener("tc-access-change", (e) => seen.push((e as CustomEvent<ModelAccessChange>).detail));
    select(el).value = "large-1";
    select(el).dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(seen[0].change).toEqual({ type: "default", model: "large-1" });
    expect(el.access.defaultModel).toBe("large-1");
    expect(select(el).getAttribute("aria-invalid")).toBe("false");
  });

  test("Require approval and the new-model rule change the policy", async () => {
    const el = await make();
    approval(el, "large-1").click();
    await settle();
    expect(el.access.models["large-1"]).toEqual({ allowed: true, approval: true });
    const rule = el.querySelector<HTMLButtonElement>(".ui-mac__rule .ui-mac__switch")!;
    expect(rule.getAttribute("aria-checked")).toBe("true");
    rule.click();
    await settle();
    expect(el.access.blockNew).toBe(false);
    // With the rule off, the new model with no rule of its own is allowed
    expect(toggle(el, "vision-1").getAttribute("aria-checked")).toBe("true");
    expect(modelAllowed(models[2], el.access)).toBe(true);
  });

  test("keyboard: Space on a switch flips it", async () => {
    const el = await make();
    const sw = toggle(el, "large-1");
    sw.focus();
    // A native button: Space and Enter click it
    sw.click();
    await settle();
    expect(sw.getAttribute("aria-checked")).toBe("false");
  });

  test("controlled: preventDefault() keeps the policy as it was", async () => {
    const el = await make();
    el.addEventListener("tc-access-change", (e) => e.preventDefault());
    toggle(el, "large-1").click();
    await settle();
    expect(toggle(el, "large-1").getAttribute("aria-checked")).toBe("true");
    expect(el.access).toBe(START);
  });

  test("empty and narrow", async () => {
    const empty = await fixture<TcModelAccess>(html`<tc-model-access></tc-model-access>`);
    expect(empty.querySelector(".ui-mac__empty")!.textContent).toBe("No models to set up yet.");
    const wrap = await fixture<HTMLElement>(html`<div style="width: 340px"><tc-model-access .models=${models} .access=${START}></tc-model-access></div>`);
    const el = wrap.querySelector("tc-model-access")!;
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
    const r = row(el, "large-1").getBoundingClientRect();
    expect(toggle(el, "large-1").getBoundingClientRect().right).toBeLessThanOrEqual(r.right + 1);
  });

  test("React wrapper: an uncontrolled policy survives parent re-renders; a controlled one stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(ModelAccess, {
        title: "Models",
        models,
        defaultAccess: START,
        onAccessChange: (a, c) => void seen.push([c.type, a.models["large-1"]?.allowed]),
        "data-n": n,
      } as React.ComponentProps<typeof ModelAccess>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-model-access")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Models");
    toggle(el, "large-1").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(toggle(el, "large-1").getAttribute("aria-checked")).toBe("false");
    expect(seen).toEqual([["allowed", false]]);
    await act(async () => root.unmount());

    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    const asked: ModelAccessValue[] = [];
    await act(async () => root2.render(React.createElement(ModelAccess, { models, access: START, onAccessChange: (a) => void asked.push(a) })));
    await settle();
    const el2 = host2.querySelector("tc-model-access")!;
    toggle(el2, "large-1").click();
    await settle();
    expect(asked).toHaveLength(1);
    expect(toggle(el2, "large-1").getAttribute("aria-checked")).toBe("true");
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-model-access description="Which models we use." .models=${models} .access=${START} .changedBy=${{ name: "Priya Shah" }}></tc-model-access>
        <tc-model-access look="clean" .models=${models} .access=${START}></tc-model-access>
      </div>`);
      const [a] = wrap.querySelectorAll<TcModelAccess>("tc-model-access");
      // One with a warning and the default blocked
      toggle(a, "small-2").click();
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
