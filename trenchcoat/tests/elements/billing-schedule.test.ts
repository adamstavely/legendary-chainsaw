/*
 * <tc-billing-schedule> in real browsers – the React component's contract and regression checks (and the H2 check in
 * high-severity.test.tsx), ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/billing-schedule";
import type { BillingRepeat, BillingScheduleLine, BillingScheduleValue, TcBillingSchedule } from "../../src/elements/billing-schedule";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const q = <T extends Element = HTMLElement>(root: Element, sel: string) => root.querySelector<T & HTMLElement>(sel)!;
const byLabel = <T extends HTMLElement = HTMLInputElement>(root: Element, label: string) => q<T>(root, `[aria-label="${label}"]`);
const durationButton = (root: Element) => q<HTMLButtonElement>(root, '[aria-haspopup="listbox"]');
const option = (root: Element, label: string) => [...root.querySelectorAll<HTMLElement>('[role="option"]')].find((o) => o.textContent!.trim() === label)!;
const pickDuration = async (root: Element, label: string) => {
  durationButton(root).click();
  await settle();
  option(root, label).click();
  await settle();
};
const typeInto = async (input: HTMLInputElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
};
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const listen = <T>(el: Element, name: string) => {
  const fn = vi.fn<(d: T) => void>();
  el.addEventListener(name, (e) => fn((e as CustomEvent<T>).detail));
  return fn;
};
const css = () => (customElements.get("tc-billing-schedule") as unknown as { css: string }).css;

describe("tc-billing-schedule", () => {
  for (const look of ["standard", "clean"] as const) {
    describe(look, () => {
      test("the host is the root", async () => {
        const el = await fixture<TcBillingSchedule>(html`<tc-billing-schedule look=${look}></tc-billing-schedule>`);
        expect(el.dataset.ui).toBe("bs");
        expect(el.dataset.look).toBe(look);
        expect(q(el, ".tc-head__title").textContent).toBe("Create a billing schedule");
        expect(!!el.querySelector(".ui-bs__card")).toBe(look === "standard");
      });

      test("tc-schedule-change: not on connect, once per change, with the whole schedule", async () => {
        const el = await fixture<TcBillingSchedule>(html`<tc-billing-schedule look=${look} start="2026-03-01"></tc-billing-schedule>`);
        const onChange = listen<BillingScheduleValue>(el, "tc-schedule-change");
        await settle();
        expect(onChange).not.toHaveBeenCalled();
        await typeInto(byLabel(el, "Phase name"), "Pilot");
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange.mock.lastCall![0]).toMatchObject({ phase: "Pilot", start: "2026-03-01", duration: "milestone" });
        await pickDuration(el, "3 months");
        expect(onChange).toHaveBeenCalledTimes(2);
        expect(onChange.mock.lastCall![0]).toMatchObject({ phase: "Pilot", duration: "3m" });
        // Picking the duration that's already set changes nothing
        await pickDuration(el, "3 months");
        expect(onChange).toHaveBeenCalledTimes(2);
        [...el.querySelectorAll<HTMLButtonElement>(".ui-bs__btn")].find((b) => b.textContent === "Add discount")!.click();
        await settle();
        expect(onChange).toHaveBeenCalledTimes(3);
        expect(onChange.mock.lastCall![0].lines.map((l) => l.kind)).toEqual(["product", "discount"]);
        // Focusing and leaving a price without editing it isn't a change either
        const price = byLabel(el, "Set-up fee price");
        price.focus();
        await settle();
        price.blur();
        await settle();
        expect(onChange).toHaveBeenCalledTimes(3);
      });

      test("two schedules on a page label their own duration menus", async () => {
        const wrap = await fixture(html`<div><tc-billing-schedule look=${look}></tc-billing-schedule><tc-billing-schedule look=${look}></tc-billing-schedule></div>`);
        const buttons = [...wrap.querySelectorAll<HTMLButtonElement>('[aria-haspopup="listbox"]')];
        expect(buttons).toHaveLength(2);
        const ids = buttons.map((b) => b.getAttribute("aria-labelledby")!.split(" "));
        expect(ids[0][0]).not.toEqual(ids[1][0]);
        // Named by the label and the value: "Duration Milestone"
        for (const [label, value] of ids) {
          expect(document.getElementById(label)!.textContent).toBe("Duration");
          expect(document.getElementById(value)!.textContent).toBe("Milestone");
        }
      });

      test("a phase starting on Jan 31 ends within February", async () => {
        const el = await fixture<TcBillingSchedule>(html`<tc-billing-schedule look=${look} start="2026-01-31"></tc-billing-schedule>`);
        await pickDuration(el, "1 month");
        expect(q(el, ".ui-bs__end").textContent).toBe("27 Feb 2026");
        await pickDuration(el, "3 months");
        expect(q(el, ".ui-bs__end").textContent).toBe("29 Apr 2026");
        await pickDuration(el, "12 months");
        expect(q(el, ".ui-bs__end").textContent).toBe("30 Jan 2027");
      });

      test("the phase total prorates recurring products over the phase length", async () => {
        const product = (r: BillingRepeat, price: number): BillingScheduleLine => ({ id: r, kind: "product", name: r, repeat: r, price, timing: "advance" });
        const el = await fixture<TcBillingSchedule>(
          html`<tc-billing-schedule look=${look} .lines=${[product("yearly", 1200), product("quarterly", 300), product("monthly", 100), product("once", 50)]}></tc-billing-schedule>`,
        );
        const total = () => el.querySelector(".ui-bs__totals > span:last-child b")?.textContent;
        expect(total()).toBe("$1,650.00");
        await pickDuration(el, "3 months");
        expect(total()).toBe("$950.00");
        await pickDuration(el, "1 month");
        expect(total()).toBe("$350.00");
        await pickDuration(el, "12 months");
        expect(total()).toBe("$3,650.00");
      });

      test("controlled: preventDefault shows the property and reports the edit without applying it", async () => {
        const el = await fixture<TcBillingSchedule>(html`<tc-billing-schedule look=${look} phase="Pilot" duration="3m" .lines=${[]}></tc-billing-schedule>`);
        const events: string[] = [];
        for (const name of ["tc-phase-change", "tc-duration-change", "tc-lines-change"])
          el.addEventListener(name, (e) => {
            e.preventDefault();
            events.push(`${name}:${JSON.stringify((e as CustomEvent).detail)}`);
          });
        const input = byLabel(el, "Phase name");
        await typeInto(input, "Rollout");
        expect(input.value).toBe("Pilot");
        await pickDuration(el, "6 months");
        expect(durationButton(el).textContent).toBe("3 months");
        [...el.querySelectorAll<HTMLButtonElement>(".ui-bs__btn")].find((b) => b.textContent === "Add discount")!.click();
        await settle();
        expect(el.querySelector(".ui-bs__name-text")).toBeNull();
        expect(events[0]).toBe('tc-phase-change:{"phase":"Rollout"}');
        expect(events[1]).toBe('tc-duration-change:{"duration":"6m"}');
        expect(events[2]).toMatch(/^tc-lines-change:\{"lines":\[\{.*"kind":"discount"/);
        // The app passes values back
        el.phase = "Rollout";
        el.duration = "6m";
        await settle();
        expect(input.value).toBe("Rollout");
        expect(durationButton(el).textContent).toBe("6 months");
      });

      test("name submits the schedule as JSON; disabled disables every control", async () => {
        const form = await fixture<HTMLFormElement>(html`<form><tc-billing-schedule look=${look} name="schedule" phase="Pilot"></tc-billing-schedule></form>`);
        const el = form.querySelector("tc-billing-schedule")!;
        expect(JSON.parse(new FormData(form).get("schedule") as string)).toMatchObject({ phase: "Pilot", duration: "milestone", start: "2026-01-01" });
        el.disabled = true;
        await settle();
        const controls = el.querySelectorAll<HTMLInputElement>("input, select, button");
        expect([...controls].every((c) => c.disabled)).toBe(true);
        expect(el.getAttribute("aria-disabled")).toBe("true");
      });

      test("Enter while composing (IME) doesn't commit a price", async () => {
        const el = await fixture<TcBillingSchedule>(html`<tc-billing-schedule look=${look}></tc-billing-schedule>`);
        const onLines = listen(el, "tc-lines-change");
        const price = byLabel(el, "Set-up fee price");
        price.focus();
        await settle();
        await typeInto(price, "12");
        key(price, "Enter", { isComposing: true });
        expect(document.activeElement).toBe(price);
        key(price, "Enter");
        await settle();
        expect(onLines).toHaveBeenCalledTimes(1);
      });

      test("Duration: a listbox – focus moves in on the chosen option, arrows move, Escape returns to the button", async () => {
        const el = await fixture<TcBillingSchedule>(html`<tc-billing-schedule look=${look} duration="3m"></tc-billing-schedule>`);
        const trigger = durationButton(el);
        trigger.focus();
        trigger.click();
        await settle();
        expect(document.activeElement).toBe(option(el, "3 months"));
        key(document.activeElement!, "ArrowDown");
        expect(document.activeElement).toBe(option(el, "6 months"));
        key(document.activeElement!, "End");
        expect(document.activeElement).toBe(option(el, "12 months"));
        key(document.activeElement!, "Escape");
        await settle();
        expect(el.querySelector('[role="listbox"]')).toBeNull();
        expect(document.activeElement).toBe(trigger);
        // ArrowDown on the button opens it on the first option; picking returns focus to the button
        key(trigger, "ArrowDown");
        await settle();
        expect(document.activeElement).toBe(option(el, "Milestone"));
        option(el, "1 month").click();
        await settle();
        expect(document.activeElement).toBe(durationButton(el));
        expect(durationButton(el).textContent).toBe("1 month");
      });

      test("a click outside closes the popup", async () => {
        const el = await fixture<TcBillingSchedule>(html`<tc-billing-schedule look=${look}></tc-billing-schedule>`);
        durationButton(el).click();
        await settle();
        expect(el.querySelector('[role="listbox"]')).not.toBeNull();
        document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
        await settle();
        expect(el.querySelector('[role="listbox"]')).toBeNull();
      });

      test("Add product: a menu of actions; picking one adds it and returns focus to the button", async () => {
        const el = await fixture<TcBillingSchedule>(html`<tc-billing-schedule look=${look}></tc-billing-schedule>`);
        const onLines = listen<{ lines: BillingScheduleLine[] }>(el, "tc-lines-change");
        const add = q<HTMLButtonElement>(el, '[aria-haspopup="menu"]');
        expect(add.textContent).toBe("Add product");
        add.focus();
        key(add, "ArrowUp");
        await settle();
        const items = [...el.querySelectorAll<HTMLElement>('[role="menuitem"]')];
        expect(document.activeElement).toBe(items.at(-1));
        key(document.activeElement!, "Home");
        expect(document.activeElement).toBe(items[0]);
        items[1].click();
        await settle();
        expect(el.querySelector('[role="menu"]')).toBeNull();
        expect(document.activeElement).toBe(add);
        expect(onLines.mock.lastCall![0].lines.map((l) => l.name)).toContain("Platform licence");
      });

      test("Remove moves focus to the next line's Remove, the last line's to Add product", async () => {
        const lines: BillingScheduleLine[] = [
          { id: "a", kind: "product", name: "A", repeat: "once", price: 1, timing: "advance" },
          { id: "b", kind: "product", name: "B", repeat: "once", price: 1, timing: "advance" },
        ];
        const el = await fixture<TcBillingSchedule>(html`<tc-billing-schedule look=${look} .lines=${lines}></tc-billing-schedule>`);
        const removeA = byLabel<HTMLButtonElement>(el, "Remove A");
        removeA.focus();
        removeA.click();
        await settle();
        expect(document.activeElement).toBe(byLabel(el, "Remove B"));
        byLabel<HTMLButtonElement>(el, "Remove B").click();
        await settle();
        expect(document.activeElement).toBe(q(el, '[aria-haspopup="menu"]'));
        expect(q(el, ".ui-bs__empty").textContent).toBe("No products yet – add one below.");
      });

      test("Add discount moves focus into the new line (the button gets disabled)", async () => {
        const el = await fixture<TcBillingSchedule>(html`<tc-billing-schedule look=${look}></tc-billing-schedule>`);
        const add = [...el.querySelectorAll<HTMLButtonElement>(".ui-bs__btn")].find((b) => b.textContent === "Add discount")!;
        add.focus();
        add.click();
        await settle();
        expect(add.disabled).toBe(true);
        expect(document.activeElement).toBe(byLabel(el, "Discount percent"));
      });

      test("number fields say what they couldn't take instead of dropping it (3.3.1)", async () => {
        const el = await fixture<TcBillingSchedule>(html`<tc-billing-schedule look=${look} .lines=${[{ id: "d", kind: "discount", name: "Discount", percent: 10 }]}></tc-billing-schedule>`);
        const onLines = listen<{ lines: BillingScheduleLine[] }>(el, "tc-lines-change");
        const field = byLabel(el, "Discount percent");
        field.focus();
        await settle();
        await typeInto(field, "1x");
        expect(field.value).toBe("1x");
        expect(field.getAttribute("aria-invalid")).toBe("true");
        expect(document.getElementById(field.getAttribute("aria-describedby")!)!.textContent).toBe("Numbers only");
        field.blur();
        await settle();
        expect(onLines).not.toHaveBeenCalled();
        expect(field.value).toBe("10");
        // Over the maximum: capped, and it says so
        field.focus();
        await settle();
        await typeInto(field, "150");
        field.blur();
        await settle();
        expect(onLines.mock.lastCall![0].lines[0]).toMatchObject({ percent: 100 });
        expect(document.getElementById(field.getAttribute("aria-describedby")!)!.textContent).toBe("Capped at 100%");
      });

      test("repeats and timing selects edit the line", async () => {
        const el = await fixture<TcBillingSchedule>(html`<tc-billing-schedule look=${look}></tc-billing-schedule>`);
        const repeats = byLabel<HTMLSelectElement>(el, "Set-up fee repeats");
        expect(repeats.value).toBe("once");
        repeats.value = "monthly";
        repeats.dispatchEvent(new Event("change", { bubbles: true }));
        await settle();
        expect(el.lines[0]).toMatchObject({ repeat: "monthly" });
        expect(q(el, ".ui-bs__price-main .ui-bs__muted").textContent).toBe("/ month");
        const timing = byLabel<HTMLSelectElement>(el, "Set-up fee billed");
        timing.value = "arrears";
        timing.dispatchEvent(new Event("change", { bubbles: true }));
        await settle();
        expect(el.lines[0]).toMatchObject({ timing: "arrears" });
        expect(el.querySelector(".ui-bs__totals > span:first-child b")!.textContent).toBe("$0.00");
      });

      test("the minimum applies when the phase is worth less", async () => {
        const el = await fixture<TcBillingSchedule>(html`<tc-billing-schedule look=${look}></tc-billing-schedule>`);
        [...el.querySelectorAll<HTMLButtonElement>(".ui-bs__btn")].find((b) => b.textContent === "Add minimum")!.click();
        await settle();
        expect(el.querySelector(".ui-bs__totals em")!.textContent!.toLowerCase()).toBe("minimum applies");
        expect(el.querySelector(".ui-bs__totals > span:last-child b")!.textContent).toBe("$10,000.00");
      });
    });
  }

  test("the Repeats select is never hidden by the stylesheet", async () => {
    const el = await fixture<TcBillingSchedule>(html`<tc-billing-schedule></tc-billing-schedule>`);
    expect(css()).not.toMatch(/__row > :nth-child\(2\) \{ display: none/);
    expect(byLabel(el, "Set-up fee repeats").tagName).toBe("SELECT");
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-billing-schedule></tc-billing-schedule>
      <tc-billing-schedule look="clean" heading="Clean"></tc-billing-schedule>
    </div>`);
    wrap.getAnimations({ subtree: true }).forEach((a) => a.finish());
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
