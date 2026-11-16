/*
 * <tc-checkbox> in real browsers: its label and second line, the partly checked state, the card row, the error line,
 * the check that draws itself, the React wrapper and axe in both looks and both themes. Form association and the
 * scoped primitive styles are covered in settings-controls and dialog.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/checkbox";
import type { TcCheckbox } from "../../src/elements/checkbox";
import { Checkbox } from "../../src/elements/react/checkbox";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const input = (el: Element) => el.querySelector<HTMLInputElement>("input")!;
const byId = (id: string | null) => (id ? id.split(" ").map((i) => document.getElementById(i)!.textContent!.trim()) : []);

describe("tc-checkbox", () => {
  for (const look of ["standard", "clean"] as const)
    test(`${look}: named by its label, described by its second line`, async () => {
      const el = await fixture<TcCheckbox>(html`<tc-checkbox look=${look} label="Include citations" description="Sources go under each answer"></tc-checkbox>`);
      expect(el.dataset.ui).toBe("checkbox");
      expect(el.dataset.look).toBe(look);
      expect(byId(input(el).getAttribute("aria-labelledby"))).toEqual(["Include citations"]);
      expect(byId(input(el).getAttribute("aria-describedby"))).toEqual(["Sources go under each answer"]);
      expect(el.querySelector(".ui-checkbox__tick")!.getAttribute("aria-hidden")).toBe("true");
    });

  test("partly checked: a dash and mixed; clicking checks it; prevented, it stays partly checked", async () => {
    const el = await fixture<TcCheckbox>(html`<tc-checkbox label="Select all" description="12 of 30 picked" indeterminate></tc-checkbox>`);
    expect(input(el).indeterminate).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-checkbox__dash")!).opacity).toBe("1");
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener("tc-value-change", stop);
    input(el).click();
    await settle();
    expect(el.indeterminate).toBe(true);
    expect(input(el).indeterminate).toBe(true);
    expect(el.value).toBe(false);
    el.removeEventListener("tc-value-change", stop);
    const seen: boolean[] = [];
    el.addEventListener("tc-value-change", (e) => seen.push((e as CustomEvent<{ value: boolean }>).detail.value));
    input(el).click();
    await settle();
    expect(seen).toEqual([true]);
    expect(el.value).toBe(true);
    expect(el.indeterminate).toBe(false);
    expect(input(el).indeterminate).toBe(false);
    expect(el.hasAttribute("indeterminate")).toBe(false);
  });

  test("the check draws itself when ticked", async () => {
    const el = await fixture<TcCheckbox>(html`<tc-checkbox label="Remember"></tc-checkbox>`);
    const check = () => getComputedStyle(el.querySelector(".ui-checkbox__check")!).strokeDashoffset;
    expect(check()).toMatch(/^1(px)?$/);
    input(el).click();
    await settle();
    await finish(el);
    await expect.poll(() => check()).toMatch(/^0(px)?$/);
  });

  test("card: a bordered row clickable anywhere, tinted when checked", async () => {
    const el = await fixture<TcCheckbox>(html`<tc-checkbox variant="card" label="Weekly digest" description="Every Monday at 8:00"></tc-checkbox>`);
    expect(el.getAttribute("variant")).toBe("card");
    const row = el.querySelector<HTMLElement>(".ui-checkbox__row")!;
    expect(getComputedStyle(row).boxShadow).not.toBe("none");
    const before = getComputedStyle(row).backgroundColor;
    el.querySelector<HTMLElement>(".ui-checkbox__description")!.click();
    await settle();
    expect(el.value).toBe(true);
    expect(getComputedStyle(row).backgroundColor).not.toBe(before);
    // The row stays a decent target
    expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(40);
  });

  test("the error line: error-message, or a failed required check after reportValidity", async () => {
    const el = await fixture<TcCheckbox>(html`<tc-checkbox label="Accept the terms" required></tc-checkbox>`);
    expect(el.querySelector(".ui-checkbox__error")).toBeNull();
    expect(el.reportValidity()).toBe(false);
    await settle();
    expect(el.querySelector(".ui-checkbox__error")!.textContent).toBe("Complete this field.");
    expect(input(el).getAttribute("aria-invalid")).toBe("true");
    expect(byId(input(el).getAttribute("aria-describedby"))).toEqual(["Complete this field."]);
    expect(el.hasAttribute("data-invalid")).toBe(true);
    el.errorMessage = "Accept the terms to go on";
    await settle();
    expect(el.querySelector(".ui-checkbox__error")!.textContent).toBe("Accept the terms to go on");
    el.errorMessage = "";
    input(el).click();
    el.reportValidity();
    await settle();
    expect(el.querySelector(".ui-checkbox__error")).toBeNull();
    expect(el.hasAttribute("data-invalid")).toBe(false);
  });

  test("React: indeterminate and variant pass through; uncontrolled clicks survive a re-render", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const seen: boolean[] = [];
    const render = (n: number) =>
      root.render(React.createElement("div", { "data-n": n }, React.createElement(Checkbox, { label: "Select all", indeterminate: true, variant: "card", onChange: (v) => seen.push(v) })));
    await act(async () => render(1));
    await settle();
    const el = host.querySelector<TcCheckbox>("tc-checkbox")!;
    expect(input(el).indeterminate).toBe(true);
    expect(el.getAttribute("variant")).toBe("card");
    input(el).click();
    await act(async () => settle());
    await act(async () => render(2));
    await settle();
    expect(seen).toEqual([true]);
    expect(el.value).toBe(true);
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const)
    for (const theme of ["light", "dark"] as const)
      test(`axe: every state – ${look}, ${theme}`, async () => {
        const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; display: grid; gap: 8px; background: ${theme === "dark" ? "#0e0e10" : "#fff"}">
          <tc-checkbox look=${look} label="Include citations" description="Sources under each answer" .value=${true}></tc-checkbox>
          <tc-checkbox look=${look} label="Select all" indeterminate></tc-checkbox>
          <tc-checkbox look=${look} variant="card" label="Weekly digest" description="Every Monday" .value=${true}></tc-checkbox>
          <tc-checkbox look=${look} variant="card" label="Accept the terms" error-message="Accept the terms to go on"></tc-checkbox>
          <tc-checkbox look=${look} label="Locked" disabled></tc-checkbox>
        </div>`);
        await finish(wrap);
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
});
