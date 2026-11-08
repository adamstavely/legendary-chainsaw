/*
 * <tc-select> in real browsers: structure per look, picking by click and keyboard, controlled value, Escape, disabled
 * options, type-ahead and the placeholder. Kept light – one fixture per test, no React suite of its own.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/select";
import type { SelectOption, TcSelect } from "../../src/elements/select";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const periods: SelectOption[] = [
  { value: 'this "month"', label: "This month" },
  { value: "last-month", label: "Last month", disabled: true },
  { value: "this-quarter", label: "This quarter", description: "July to September" },
  { value: "last-quarter", label: "Last quarter" },
  { value: "this-year", label: "This year" },
];

const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const trigger = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-select__trigger")!;
const list = (el: Element) => el.querySelector<HTMLElement>('[role="listbox"]')!;
const options = (el: Element) => [...el.querySelectorAll<HTMLElement>('[role="option"]')];
const active = (el: Element) => el.querySelector<HTMLElement>('[role="option"][data-active]')?.textContent?.trim();
const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
const text = (el: Element) => el.textContent!.replace(/\s+/g, " ").trim();

for (const look of ["standard", "clean"] as const) {
  describe(`tc-select ${look}`, () => {
    test("the host is the root; trigger, listbox and options carry their roles; ids don't contain values", async () => {
      const el = await fixture<TcSelect>(html`<tc-select look=${look} label="Period" value="this-quarter" .options=${periods}></tc-select>`);
      expect(el.dataset.ui).toBe("select");
      expect(el.dataset.look).toBe(look);
      expect(trigger(el).getAttribute("aria-haspopup")).toBe("listbox");
      expect(trigger(el).getAttribute("aria-expanded")).toBe("false");
      expect(document.getElementById(trigger(el).getAttribute("aria-controls")!)).toBe(list(el));
      expect(text(trigger(el))).toBe("Period: This quarter");
      expect(options(el).map((o) => o.getAttribute("aria-selected"))).toEqual(["false", "false", "true", "false", "false"]);
      expect(options(el)[2].querySelector(".ui-select__check")).toBeTruthy();
      expect(options(el)[1].getAttribute("aria-disabled")).toBe("true");
      for (const o of options(el)) expect(o.id).not.toMatch(/month|quarter|year/);
      expect(new Set(options(el).map((o) => o.id)).size).toBe(5);
    });

    test("axe: no violations, open, with and without a visible label", async () => {
      const wrap = await fixture(html`<div style="display: grid; gap: 300px; padding-bottom: 300px">
        <div><tc-select look=${look} open label="Period" value="this-quarter" .options=${periods}></tc-select></div>
        <div><tc-select look=${look} label="Team" label-visible .options=${periods}></tc-select></div>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  });
}

describe("tc-select", () => {
  test("without a value, or with an unknown one, the placeholder shows", async () => {
    const el = await fixture<TcSelect>(html`<tc-select .options=${periods}></tc-select>`);
    expect(text(trigger(el))).toBe("Choose…");
    expect(el.querySelector(".ui-select__value")!.hasAttribute("data-placeholder")).toBe(true);
    el.placeholder = "Any period";
    el.value = "nope";
    await settle();
    expect(text(trigger(el))).toBe("Any period");
    expect(el.querySelector('[aria-selected="true"]')).toBeNull();
  });

  test("a visible label sits above the trigger and names it with the value", async () => {
    const el = await fixture<TcSelect>(html`<tc-select label="Period" label-visible value="this-year" .options=${periods}></tc-select>`);
    const label = el.querySelector(".ui-select__label")!;
    expect(label.textContent).toBe("Period");
    expect(trigger(el).getAttribute("aria-labelledby")).toBe(`${label.id} ${el.querySelector(".ui-select__value")!.id}`);
    expect(el.querySelector(".ui-select__sr")).toBeNull();
    expect(list(el).getAttribute("aria-labelledby")).toBe(label.id);
  });

  test("label-placement=start puts the label before the trigger on its line, as a caption, still naming it; the list stays under the trigger", async () => {
    const el = await fixture<TcSelect>(html`<tc-select label="Period" label-visible label-placement="start" value="this-year" .options=${periods}></tc-select>`);
    const label = el.querySelector<HTMLElement>(".ui-select__label")!;
    expect(el.hasAttribute("data-label-start")).toBe(true);
    expect(trigger(el).getAttribute("aria-labelledby")).toBe(`${label.id} ${el.querySelector(".ui-select__value")!.id}`);
    const l = label.getBoundingClientRect();
    const t = trigger(el).getBoundingClientRect();
    expect(l.right).toBeLessThanOrEqual(t.left);
    expect(Math.abs(l.top + l.height / 2 - (t.top + t.height / 2))).toBeLessThan(2);
    expect(getComputedStyle(label).fontSize).toBe(getComputedStyle(el).getPropertyValue("--tc-caption-font-size").trim());
    el.open = true;
    await settle();
    await frame();
    expect(Math.abs(el.querySelector(".ui-select__pop")!.getBoundingClientRect().left - t.left)).toBeLessThan(2);
    // Hidden label or "top": the attribute does nothing
    el.labelPlacement = "top";
    await settle();
    expect(el.hasAttribute("data-label-start")).toBe(false);
  });

  test("label-placement=start without label-visible shows no label and leaves the trigger as it is", async () => {
    const wrap = await fixture(html`<div style="display: grid; justify-items: start; gap: 8px">
      <tc-select class="plain" label="Period" value="this-year" .options=${periods}></tc-select>
      <tc-select class="start" label="Period" label-placement="start" value="this-year" .options=${periods}></tc-select>
    </div>`);
    const plain = wrap.querySelector<TcSelect>(".plain")!;
    const start = wrap.querySelector<TcSelect>(".start")!;
    expect(start.querySelector(".ui-select__label")).toBeNull();
    expect(start.hasAttribute("data-label-start")).toBe(false);
    expect(text(trigger(start))).toBe("Period: This year");
    const a = trigger(plain).getBoundingClientRect();
    const b = trigger(start).getBoundingClientRect();
    expect(b.width).toBe(a.width);
    expect(b.left).toBe(a.left);
    expect(start.getBoundingClientRect().width).toBe(plain.getBoundingClientRect().width);
  });

  test("a click picks: reported, applied, closed", async () => {
    const values: string[] = [];
    const el = await fixture<TcSelect>(html`<tc-select open .options=${periods} @tc-value-change=${(e: CustomEvent<{ value: string }>) => values.push(e.detail.value)}></tc-select>`);
    options(el)[3].click();
    await settle();
    expect(values).toEqual(["last-quarter"]);
    expect(el.value).toBe("last-quarter");
    expect(el.open).toBe(false);
    expect(text(trigger(el))).toBe("Last quarter");
  });

  test("a disabled option can't be picked by click", async () => {
    const values: string[] = [];
    const el = await fixture<TcSelect>(html`<tc-select open .options=${periods} @tc-value-change=${(e: CustomEvent<{ value: string }>) => values.push(e.detail.value)}></tc-select>`);
    options(el)[1].click();
    await settle();
    expect(values).toEqual([]);
    expect(el.open).toBe(true);
  });

  test("controlled: a prevented pick is reported, not applied; a prevented open stays closed", async () => {
    const values: string[] = [];
    const el = await fixture<TcSelect>(html`<tc-select open value="this-year" .options=${periods}
      @tc-value-change=${(e: CustomEvent<{ value: string }>) => {
        e.preventDefault();
        values.push(e.detail.value);
      }}></tc-select>`);
    options(el)[0].click();
    await settle();
    expect(values).toEqual(['this "month"']);
    expect(el.value).toBe("this-year");
    expect(text(trigger(el))).toBe("This year");
    el.addEventListener("tc-open-change", (e) => e.preventDefault());
    trigger(el).click();
    await settle();
    expect(el.open).toBe(false);
  });

  test("keyboard: ↓ on the trigger opens on the chosen option; arrows skip disabled ones; Enter picks and focus returns", async () => {
    const opens: boolean[] = [];
    const el = await fixture<TcSelect>(html`<tc-select value=${'this "month"'} .options=${periods} @tc-open-change=${(e: CustomEvent<{ open: boolean }>) => opens.push(e.detail.open)}></tc-select>`);
    trigger(el).focus();
    key(trigger(el), "ArrowDown");
    await settle();
    await frame();
    expect(el.open).toBe(true);
    expect(document.activeElement).toBe(list(el));
    expect(active(el)).toBe("This month");
    key(list(el), "ArrowDown");
    await settle();
    expect(active(el)).toContain("This quarter");
    expect(list(el).getAttribute("aria-activedescendant")).toBe(options(el)[2].id);
    key(list(el), "ArrowUp");
    key(list(el), "End");
    await settle();
    expect(active(el)).toBe("This year");
    key(list(el), "Home");
    key(list(el), "ArrowUp");
    await settle();
    expect(active(el)).toBe("This year");
    key(list(el), "ArrowUp");
    key(list(el), " ");
    await settle();
    expect(el.value).toBe("last-quarter");
    expect(el.open).toBe(false);
    expect(document.activeElement).toBe(trigger(el));
    expect(opens).toEqual([true, false]);
  });

  test("Escape closes, stops there and returns focus to the trigger; Tab closes", async () => {
    const outside: string[] = [];
    const el = await fixture<TcSelect>(html`<tc-select open .options=${periods}></tc-select>`);
    document.body.addEventListener("keydown", (e) => outside.push(e.key), { once: true });
    list(el).focus();
    key(list(el), "Escape");
    await settle();
    expect(el.open).toBe(false);
    expect(outside).toEqual([]);
    expect(document.activeElement).toBe(trigger(el));
    el.open = true;
    await settle();
    key(list(el), "Tab");
    await settle();
    expect(el.open).toBe(false);
  });

  test("type-ahead: letters jump to the next option starting with them, past disabled ones", async () => {
    const el = await fixture<TcSelect>(html`<tc-select open .options=${periods}></tc-select>`);
    list(el).focus();
    await settle();
    expect(active(el)).toBe("This month");
    key(list(el), "l");
    await settle();
    expect(active(el)).toBe("Last quarter");
    key(list(el), "t");
    await settle();
    // "lt" matches nothing, so the active option stays
    expect(active(el)).toBe("Last quarter");
    // Typed letters time out (600 ms), measured on the events' time stamps
    const later = (k: string, ms: number) => {
      const e = new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true });
      Object.defineProperty(e, "timeStamp", { value: performance.now() + ms });
      list(el).dispatchEvent(e);
    };
    later("t", 1000);
    await settle();
    expect(active(el)).toBe("This year");
    later("t", 1100);
    await settle();
    expect(active(el)).toBe("This month");
  });

  test("a press outside closes it; disabled keeps it shut", async () => {
    const el = await fixture<TcSelect>(html`<tc-select open .options=${periods}></tc-select>`);
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await settle();
    expect(el.open).toBe(false);
    el.disabled = true;
    await settle();
    expect(trigger(el).disabled).toBe(true);
    trigger(el).click();
    key(trigger(el), "ArrowDown");
    await settle();
    expect(el.open).toBe(false);
  });

  test("name submits the value through a hidden input", async () => {
    const form = await fixture<HTMLFormElement>(html`<form><tc-select name="period" value="this-year" .options=${periods}></tc-select></form>`);
    expect(new FormData(form).get("period")).toBe("this-year");
  });
});
