/*
 * <tc-step-picker> in real browsers: the combobox and its grouped listbox, Suggested and Recent leading when nothing
 * is typed, filtering and highlighting, the keyboard, picking, the popover layout opening by its anchor and closing
 * back to it, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/step-picker";
import { defaultStepItems, type StepPick, type StepPickerOpenChange, type StepPickerQueryChange, type TcStepPicker } from "../../src/elements/step-picker";
import { StepPicker } from "../../src/elements/react/step-picker";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const SUGGESTIONS = [{ id: "condition", reason: "Usually comes after Classify" }, { id: "approval" }];
const RECENT = ["extract", "send-email"];

const input = (el: Element) => el.querySelector<HTMLInputElement>(".ui-stp__input")!;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, composed: true, ...init }));
const type = async (el: Element, text: string) => {
  const f = input(el);
  f.value = text;
  f.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
};
const active = (el: Element) => document.getElementById(input(el).getAttribute("aria-activedescendant")!);
const labels = (el: Element) => [...el.querySelectorAll(".ui-stp__group-label")].map((g) => g.textContent);
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcStepPicker>(html`<tc-step-picker look=${look} description="After Classify" .suggestions=${SUGGESTIONS} .recent=${RECENT}></tc-step-picker>`);

describe("tc-step-picker", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a combobox over a grouped listbox, Suggested and Recent first, each step with its icon, words and tool`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("stp");
      expect(el.dataset.look).toBe(look);
      const f = input(el);
      expect(f.getAttribute("role")).toBe("combobox");
      const list = el.querySelector('[role="listbox"]')!;
      expect(f.getAttribute("aria-controls")).toBe(list.id);
      expect(document.getElementById(list.getAttribute("aria-labelledby")!)!.textContent).toBe("Add a step");
      expect(labels(el)).toEqual(["Suggested", "Recent", "Triggers", "AI", "Tools", "Logic", "People", "Output"]);
      expect(el.querySelectorAll('[role="option"]')).toHaveLength(defaultStepItems.length + 4);
      const first = el.querySelector('[role="option"]')!;
      expect(first.querySelector(".ui-stp__label")!.textContent).toBe("Condition");
      expect(first.querySelector(".ui-stp__desc")!.textContent).toBe("Usually comes after Classify");
      // A suggestion with no reason shows what it does
      expect(el.querySelectorAll('[role="option"]')[1].querySelector(".ui-stp__desc")!.textContent).toBe("Waits for a person to approve or reject");
      expect(el.querySelector('[data-id="search-records"] .ui-stp__tool')!.textContent).toBe("Records");
      // The first row is the active one, and every option id is unique
      expect(active(el)).toBe(first);
      const ids = [...el.querySelectorAll('[role="option"]')].map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  }

  test("typing filters every group, highlights the match and says how many; nothing matching says so", async () => {
    const el = await make();
    const queries: string[] = [];
    el.addEventListener("tc-query-change", (e) => queries.push((e as CustomEvent<StepPickerQueryChange>).detail.query));
    await type(el, "mail");
    expect(queries).toEqual(["mail"]);
    expect(labels(el)).toEqual(["Triggers", "Output"]);
    expect([...el.querySelectorAll(".ui-stp__label")].map((l) => l.textContent)).toEqual(["Email received", "Send email"]);
    expect(el.querySelector(".ui-stp__label mark")!.textContent).toBe("mail");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("2 steps");
    // Words match the description, the tool and the keywords too
    await type(el, "cron");
    expect([...el.querySelectorAll(".ui-stp__label")].map((l) => l.textContent)).toEqual(["Schedule"]);
    await type(el, "zzz");
    expect(el.querySelector('[role="listbox"]')).toBeNull();
    expect(input(el).getAttribute("aria-expanded")).toBe("false");
    expect(el.querySelector(".ui-stp__empty")!.textContent).toBe("No steps match “zzz”.");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("No steps match");
    // Escape clears the search
    key(input(el), "Escape");
    await settle();
    expect(el.query).toBe("");
    expect(labels(el)[0]).toBe("Suggested");
  });

  test("↑ ↓ Home End move the active step; Enter picks it; a click picks too; preventDefault() keeps the query", async () => {
    const el = await make();
    const picks: StepPick[] = [];
    el.addEventListener("tc-pick", (e) => picks.push((e as CustomEvent<StepPick>).detail));
    const f = input(el);
    key(f, "ArrowDown");
    await settle();
    expect(active(el)!.querySelector(".ui-stp__label")!.textContent).toBe("Approval");
    expect(active(el)!.getAttribute("aria-selected")).toBe("true");
    key(f, "ArrowUp");
    key(f, "ArrowUp");
    await settle();
    // Wraps round to the last
    expect(active(el)!.querySelector(".ui-stp__label")!.textContent).toBe("Post a message");
    key(f, "Home");
    await settle();
    expect(active(el)!.querySelector(".ui-stp__label")!.textContent).toBe("Condition");
    key(f, "Enter");
    expect(picks[0]).toMatchObject({ id: "condition", kind: "condition", tool: undefined });
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Added Condition");
    el.querySelector<HTMLElement>('[data-id="search-records"]')!.click();
    expect(picks[1]).toMatchObject({ id: "search-records", kind: "tool", tool: "Records" });
    el.addEventListener("tc-query-change", (e) => e.preventDefault());
    await type(el, "wait");
    expect(el.query).toBe("");
    expect(input(el).value).toBe("");
  });

  test("popover: opens by its anchor with focus in the field; Escape closes it back to the anchor; a pick closes it", async () => {
    const wrap = await fixture(html`<div><button type="button" id="add">Add step</button><tc-step-picker layout="popover"></tc-step-picker></div>`);
    const button = wrap.querySelector("button")!;
    const el = wrap.querySelector("tc-step-picker")!;
    const changes: boolean[] = [];
    el.addEventListener("tc-open-change", (e) => changes.push((e as CustomEvent<StepPickerOpenChange>).detail.open));
    expect(el.querySelector(".ui-stp__pop")).toBeNull();
    button.focus();
    el.anchor = button;
    el.open = true;
    await settle();
    const pop = el.querySelector<HTMLElement>(".ui-stp__pop")!;
    expect(pop.getAttribute("role")).toBe("dialog");
    expect(document.getElementById(pop.getAttribute("aria-labelledby")!)!.textContent).toBe("Add a step");
    await expect.poll(() => document.activeElement).toBe(input(el));
    // With text, Escape clears it; with none, it closes
    await type(el, "wait");
    key(input(el), "Escape");
    await settle();
    expect(el.open).toBe(true);
    key(input(el), "Escape");
    await settle();
    expect(changes).toEqual([false]);
    expect(el.open).toBe(false);
    await expect.poll(() => document.activeElement).toBe(button);
    el.open = true;
    await settle();
    await expect.poll(() => document.activeElement).toBe(input(el));
    key(input(el), "Enter");
    await settle();
    expect(el.open).toBe(false);
    expect(changes).toEqual([false, false]);
  });

  test("React wrapper: an uncontrolled search survives re-renders; onPick returning false keeps a popover open", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const picked: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(StepPicker, { title: "Next step", onPick: (kind, item) => void picked.push(`${kind}:${item.id}`), "data-n": n } as React.ComponentProps<typeof StepPicker>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-step-picker")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Next step");
    await type(el, "approv");
    await act(async () => bump());
    await settle();
    expect(el.query).toBe("approv");
    key(input(el), "Enter");
    expect(picked).toEqual(["approval:approval"]);
    await act(async () => root.unmount());

    const host2 = document.createElement("div");
    document.body.append(host2);
    const anchor = document.createElement("button");
    document.body.append(anchor);
    const root2 = createRoot(host2);
    await act(async () => root2.render(React.createElement(StepPicker, { layout: "popover", anchor, open: true, onPick: () => false })));
    await settle();
    const el2 = host2.querySelector("tc-step-picker")!;
    await expect.poll(() => el2.querySelector(".ui-stp__pop")).toBeTruthy();
    key(input(el2), "Enter");
    await settle();
    expect(el2.open).toBe(true);
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base); display: grid; gap: 16px">
        <tc-step-picker description="After Classify" .suggestions=${SUGGESTIONS} .recent=${RECENT}></tc-step-picker>
        <tc-step-picker look="clean" query="mail"></tc-step-picker>
        <tc-step-picker look="clean" query="zzz"></tc-step-picker>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
