/*
 * <tc-model-picker> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/model-picker";
import type { PickerModel, TcModelPicker } from "../../src/elements/model-picker";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const models: PickerModel[] = [
  { id: 'gpt 4/o "mini"', name: "Mini" },
  { id: "deep", name: "Deep" },
];
const rich: PickerModel[] = [
  { id: "fast", name: "Swift", description: "Quick answers", speed: 5, quality: 2, cost: 1, latencyMs: 400, pricePerM: 2 },
  { id: "deep", name: "Deep", description: "Hard problems", speed: 2, quality: 5, cost: 4, latencyMs: 2000, pricePerM: 15 },
];

const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const trigger = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-mdp__trigger")!;
const options = (el: Element) => [...el.querySelectorAll<HTMLElement>('[role="option"]')];
const frame = () => new Promise((r) => requestAnimationFrame(() => r(null)));
/** The accessible text of an element, roughly: its text with comments and runs of space collapsed */
const text = (el: Element) => el.textContent!.replace(/\s+/g, " ").trim();

for (const look of ["standard", "clean"] as const) {
  describe(`tc-model-picker ${look}`, () => {
    test("the host is the root; it carries open, align and side", async () => {
      const el = await fixture<TcModelPicker>(html`<tc-model-picker look=${look} align="end" side="top" .models=${models}></tc-model-picker>`);
      expect(el.dataset.ui).toBe("mdp");
      expect(el.dataset.look).toBe(look);
      expect(el.dataset.align).toBe("end");
      expect(el.dataset.side).toBe("top");
      expect(el.hasAttribute("data-open")).toBe(false);
      expect(getComputedStyle(el).display).toBe("inline-block");
      el.open = true;
      await settle();
      expect(el.hasAttribute("data-open")).toBe(true);
      expect(trigger(el).getAttribute("aria-expanded")).toBe("true");
      expect(document.getElementById(trigger(el).getAttribute("aria-controls")!)!.getAttribute("role")).toBe("dialog");
    });

    test("option ids don't contain model ids", async () => {
      const el = await fixture<TcModelPicker>(html`<tc-model-picker look=${look} open .models=${models}></tc-model-picker>`);
      const ids = options(el).map((o) => o.id);
      expect(ids).toHaveLength(2);
      for (const id of ids) expect(id).not.toMatch(/mini|deep/i);
      expect(new Set(ids).size).toBe(2);
    });

    test("a pick is reported and applied; the first model shows without a value", async () => {
      const picks: string[] = [];
      const el = await fixture<TcModelPicker>(html`<tc-model-picker look=${look} open .models=${models} @tc-value-change=${(e: CustomEvent<{ value: string }>) => picks.push(e.detail.value)}></tc-model-picker>`);
      expect(text(trigger(el))).toContain("Mini");
      options(el)[1].click();
      await settle();
      expect(picks).toEqual(["deep"]);
      expect(el.value).toBe("deep");
      expect(text(trigger(el))).toContain("Deep");
    });

    test("controlled value: a prevented pick is reported, not applied", async () => {
      const picks: string[] = [];
      const el = await fixture<TcModelPicker>(html`<tc-model-picker look=${look} open value=${models[0].id} .models=${models}
        @tc-value-change=${(e: CustomEvent<{ value: string }>) => {
          e.preventDefault();
          picks.push(e.detail.value);
        }}></tc-model-picker>`);
      options(el)[1].click();
      await settle();
      expect(picks).toEqual(["deep"]);
      expect(text(trigger(el))).toContain("Mini");
    });

    test("controlled switches, effort and open: prevented changes don't apply", async () => {
      const el = await fixture<TcModelPicker>(html`<tc-model-picker look=${look} open thinking .models=${rich}></tc-model-picker>`);
      el.addEventListener("tc-thinking-change", (e) => e.preventDefault());
      el.addEventListener("tc-web-search-change", (e) => e.preventDefault());
      el.addEventListener("tc-effort-change", (e) => e.preventDefault());
      el.addEventListener("tc-open-change", (e) => e.preventDefault());
      const [think, web] = el.querySelectorAll<HTMLElement>('[role="switch"]');
      think.click();
      web.click();
      el.querySelector<HTMLElement>('[data-effort="high"]')!.click();
      key(el, "Escape");
      await settle();
      expect(think.getAttribute("aria-checked")).toBe("true");
      expect(web.getAttribute("aria-checked")).toBe("false");
      expect(el.querySelector('[data-effort][aria-checked="true"]')!.getAttribute("data-effort")).toBe("medium");
      expect(trigger(el).getAttribute("aria-expanded")).toBe("true");
      el.webSearch = true;
      el.effort = "low";
      await settle();
      expect(web.getAttribute("aria-checked")).toBe("true");
      expect(el.querySelector('[data-effort][aria-checked="true"]')!.getAttribute("data-effort")).toBe("low");
    });

    test("an empty models list renders", async () => {
      const el = await fixture<TcModelPicker>(html`<tc-model-picker look=${look} .models=${[]}></tc-model-picker>`);
      expect(text(trigger(el))).toBe("Model: Choose a model");
    });

    test("Escape closes the open menu, stops there, and reports it", async () => {
      const opens: boolean[] = [];
      const outside: string[] = [];
      const el = await fixture<TcModelPicker>(html`<tc-model-picker look=${look} open .models=${models} @tc-open-change=${(e: CustomEvent<{ open: boolean }>) => opens.push(e.detail.open)}></tc-model-picker>`);
      document.body.addEventListener("keydown", (e) => outside.push(e.key), { once: true });
      key(el, "Escape");
      await settle();
      expect(opens).toEqual([false]);
      expect(outside).toEqual([]);
      expect(trigger(el).getAttribute("aria-expanded")).toBe("false");
    });

    test("trigger and options are named by their visible text (no mismatching aria-label)", async () => {
      const el = await fixture<TcModelPicker>(html`<tc-model-picker look=${look} open thinking value="deep" .models=${rich}></tc-model-picker>`);
      expect(text(trigger(el))).toBe("D Model: Deep , extended thinking");
      expect(trigger(el).hasAttribute("aria-label")).toBe(false);
      for (const o of options(el)) expect(o.hasAttribute("aria-label")).toBe(false);
      const sr = options(el)[0].querySelector(".ui-mdp__text")!;
      expect(text(sr)).toBe("Swift Quick answers . Speed 5, quality 2, cost 1 of 5, about 1.0s to the first token, $2 per million tokens");
    });

    test("the status region is mounted from the start and only says the final choice", async () => {
      const el = await fixture<TcModelPicker>(html`<tc-model-picker look=${look} open .models=${rich}></tc-model-picker>`);
      const status = el.querySelector('[role="status"]')!;
      expect(status.textContent).toBe("");
      const list = el.querySelector<HTMLElement>('[role="listbox"]')!;
      list.focus();
      for (const k of ["ArrowDown", "ArrowUp", "ArrowDown"]) key(list, k);
      await settle();
      expect(status.textContent).toBe("");
      key(list, "Enter");
      await settle();
      expect(status.textContent).toBe("Deep selected");
      expect(el.querySelectorAll('[role="status"]')).toHaveLength(1);
    });

    test("arrows mark the active option for the focus ring; Enter picks and focus returns to the trigger", async () => {
      const el = await fixture<TcModelPicker>(html`<tc-model-picker look=${look} open .models=${rich}></tc-model-picker>`);
      const list = el.querySelector<HTMLElement>('[role="listbox"]')!;
      list.focus();
      expect(list.hasAttribute("data-keyed")).toBe(false);
      key(list, "ArrowDown");
      await settle();
      expect(list.hasAttribute("data-keyed")).toBe(true);
      const active = el.querySelector('[role="option"][data-active]')!;
      expect(list.getAttribute("aria-activedescendant")).toBe(active.id);
      expect(active.textContent).toContain("Deep");
      key(list, "End");
      key(list, "Home");
      await settle();
      expect(el.querySelector('[role="option"][data-active]')!.textContent).toContain("Swift");
      key(list, "ArrowDown");
      key(list, "Enter");
      await settle();
      expect(document.activeElement).toBe(trigger(el));
      expect(el.querySelector('[role="dialog"]')!.hasAttribute("inert")).toBe(true);
      expect(el.value).toBe("deep");
    });

    test("ArrowDown on the trigger opens the menu and focuses the list", async () => {
      const el = await fixture<TcModelPicker>(html`<tc-model-picker look=${look} .models=${rich}></tc-model-picker>`);
      trigger(el).focus();
      key(trigger(el), "ArrowDown");
      await settle();
      await frame();
      expect(el.open).toBe(true);
      expect(document.activeElement).toBe(el.querySelector('[role="listbox"]'));
    });

    test("Esc closes the menu and returns focus to the trigger", async () => {
      const el = await fixture<TcModelPicker>(html`<tc-model-picker look=${look} open .models=${rich}></tc-model-picker>`);
      const list = el.querySelector<HTMLElement>('[role="listbox"]')!;
      list.focus();
      key(list, "Escape");
      await settle();
      expect(document.activeElement).toBe(trigger(el));
      expect(trigger(el).getAttribute("aria-expanded")).toBe("false");
    });

    test("a press outside closes it", async () => {
      const el = await fixture<TcModelPicker>(html`<tc-model-picker look=${look} open .models=${rich}></tc-model-picker>`);
      document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      await settle();
      expect(el.open).toBe(false);
    });

    test("effort: radiogroup with arrows and roving tabindex, inert while thinking is off", async () => {
      const el = await fixture<TcModelPicker>(html`<tc-model-picker look=${look} open thinking .models=${rich}></tc-model-picker>`);
      const radio = (name: string) => [...el.querySelectorAll<HTMLButtonElement>('[role="radio"]')].find((r) => r.textContent === name)!;
      expect(radio("Medium").tabIndex).toBe(0);
      radio("Medium").focus();
      key(radio("Medium"), "ArrowRight");
      await settle();
      expect(radio("High").getAttribute("aria-checked")).toBe("true");
      expect(document.activeElement).toBe(radio("High"));
      el.querySelector<HTMLElement>('[role="switch"]')!.click();
      await settle();
      expect(el.querySelector(".ui-mdp__fold")!.hasAttribute("inert")).toBe(true);
    });

    test("the tray says what the pointed-at model costs, and what web search does", async () => {
      const el = await fixture<TcModelPicker>(html`<tc-model-picker look=${look} open .models=${rich}></tc-model-picker>`);
      const caption = () => text(el.querySelector(".ui-mdp__caption .ui-mdp__swap-item:not([data-out])")!);
      expect(caption()).toBe("~0.4s first token · $2 / M tokens");
      const web = el.querySelectorAll<HTMLElement>('[role="switch"]')[1];
      web.dispatchEvent(new FocusEvent("focus"));
      await settle();
      expect(caption()).toBe("Answers from what it already knows");
    });

    test("a glyph element is cloned; without one the first letter shows", async () => {
      const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      icon.setAttribute("data-mine", "");
      const el = await fixture<TcModelPicker>(html`<tc-model-picker look=${look} open .models=${[{ id: "a", name: "auto", icon }, ...rich]}></tc-model-picker>`);
      expect(trigger(el).querySelector(".ui-mdp__glyph svg[data-mine]")).toBeTruthy();
      expect(options(el)[1].querySelector(".ui-mdp__glyph")!.textContent).toBe("S");
      expect(icon.isConnected).toBe(false);
    });
  });
}

test("axe: no violations in either look", async () => {
  const wrap = await fixture(html`<div style="display: grid; gap: 520px; padding-bottom: 520px">
    <div><tc-model-picker open thinking .models=${rich}></tc-model-picker></div>
    <div><tc-model-picker look="clean" open thinking .models=${rich}></tc-model-picker></div>
  </div>`);
  await new Promise((r) => setTimeout(r, 400));
  for (const a of document.getAnimations()) a.finish();
  const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
});
