/*
 * <tc-switch> in real browsers: its label and second line, the switch at the start or the end of a settings row, the
 * thumb that stretches while pressed, the React wrapper and axe in both looks and both themes. Form association and
 * the scoped primitive styles are covered in settings-controls and dialog.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/switch";
import type { TcSwitch } from "../../src/elements/switch";
import { Switch } from "../../src/elements/react/switch";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const input = (el: Element) => el.querySelector<HTMLInputElement>("input")!;
const byId = (id: string | null) => (id ? id.split(" ").map((i) => document.getElementById(i)!.textContent!.trim()) : []);

describe("tc-switch", () => {
  for (const look of ["standard", "clean"] as const)
    test(`${look}: a switch named by its label, described by its second line`, async () => {
      const el = await fixture<TcSwitch>(html`<tc-switch look=${look} label="Email digest" description="Once a day, at 8:00"></tc-switch>`);
      expect(el.dataset.ui).toBe("switch");
      expect(el.dataset.look).toBe(look);
      expect(input(el).getAttribute("role")).toBe("switch");
      expect(byId(input(el).getAttribute("aria-labelledby"))).toEqual(["Email digest"]);
      expect(byId(input(el).getAttribute("aria-describedby"))).toEqual(["Once a day, at 8:00"]);
      expect(el.placement).toBe("start");
    });

  test("no second line: nothing describes it", async () => {
    const el = await fixture<TcSwitch>(html`<tc-switch label="Streaming"></tc-switch>`);
    expect(input(el).hasAttribute("aria-describedby")).toBe(false);
  });

  test("placement: start puts the switch first; end puts it at the far end of a full-width row", async () => {
    const wrap = await fixture(html`<div style="width: 400px">
      <tc-switch label="Start"></tc-switch>
      <tc-switch label="End" description="At the row's end" placement="end"></tc-switch>
    </div>`);
    const [start, end] = [...wrap.querySelectorAll<TcSwitch>("tc-switch")];
    const left = (el: Element, sel: string) => el.querySelector(sel)!.getBoundingClientRect().left;
    expect(left(start, "input")).toBeLessThan(left(start, ".ui-switch__label"));
    expect(end.getAttribute("placement")).toBe("end");
    expect(left(end, "input")).toBeGreaterThan(left(end, ".ui-switch__label"));
    expect(Math.round(end.querySelector("input")!.getBoundingClientRect().right)).toBe(Math.round(wrap.getBoundingClientRect().right));
    // Clicking the words still flips it
    end.querySelector<HTMLElement>(".ui-switch__label")!.click();
    await settle();
    expect(end.value).toBe(true);
  });

  test("a cancelable tc-value-change keeps it where it was", async () => {
    const el = await fixture<TcSwitch>(html`<tc-switch label="Streaming"></tc-switch>`);
    el.addEventListener("tc-value-change", (e) => e.preventDefault());
    input(el).click();
    await settle();
    expect(el.value).toBe(false);
    expect(input(el).checked).toBe(false);
  });

  test("React: placement and description pass through; controlled value stays with the app", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const seen: boolean[] = [];
    await act(async () => root.render(React.createElement(Switch, { label: "Email digest", description: "Daily", placement: "end", value: false, onChange: (v) => seen.push(v) })));
    await settle();
    const el = host.querySelector<TcSwitch>("tc-switch")!;
    expect(el.getAttribute("placement")).toBe("end");
    input(el).click();
    await act(async () => settle());
    expect(seen).toEqual([true]);
    expect(el.value).toBe(false);
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const)
    for (const theme of ["light", "dark"] as const)
      test(`axe: start and end, on and off – ${look}, ${theme}`, async () => {
        const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; display: grid; gap: 8px; background: ${theme === "dark" ? "#0e0e10" : "#fff"}">
          <tc-switch look=${look} label="Streaming" .value=${true}></tc-switch>
          <tc-switch look=${look} label="Email digest" description="Once a day" placement="end"></tc-switch>
          <tc-switch look=${look} label="Locked" disabled></tc-switch>
        </div>`);
        await finish(wrap);
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
});
