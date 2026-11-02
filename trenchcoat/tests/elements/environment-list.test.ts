/*
 * <tc-environment-list> in real browsers: rows and icons, truncation, actions, switches and controlled use, the React
 * wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/environment-list";
import type { EnvironmentItem, TcEnvironmentList } from "../../src/elements/environment-list";
import { EnvironmentList } from "../../src/elements/react/environment-list";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const LONG = "~/projects/institute/long-term-storage/archive/2026/sample-tracker/with/a/very/long/path";
const ITEMS: EnvironmentItem[] = [
  { id: "pc", kind: "computer", label: "Lab workstation", action: { id: "save", label: "Save" } },
  { id: "dir", kind: "folder", label: "sample-tracker", detail: LONG },
  { id: "repo", kind: "repo", label: "institute/sample-tracker" },
  { id: "br", kind: "branch", label: "freezer-locations" },
  { id: "own", kind: "custom", icon: "M4 12h16", label: "Remote access", toggle: true },
];
const make = (look: "standard" | "clean" = "standard") => fixture<TcEnvironmentList>(html`<tc-environment-list look=${look} heading="Environment" .items=${ITEMS}></tc-environment-list>`);
const input = (el: Element) => el.querySelector<HTMLInputElement>('[data-id="own"] input[role="switch"]')!;

describe("tc-environment-list", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: rows with an icon each, and a named list`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("enl");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector("ul")!.getAttribute("aria-label")).toBe("Environment");
      expect(el.querySelectorAll(".ui-enl__row")).toHaveLength(5);
      expect(el.querySelectorAll(".ui-enl__icon path, .ui-enl__icon rect").length).toBeGreaterThanOrEqual(5);
      expect(el.querySelector('[data-id="own"] .ui-enl__icon path')!.getAttribute("d")).toBe("M4 12h16");
      // Only the action and the switch take focus
      expect(el.querySelectorAll("button, input")).toHaveLength(2);
    });
  }

  test("a long path ends in an ellipsis inside the width, with the whole text in the title", async () => {
    const el = await make();
    el.style.width = "280px";
    await settle();
    const detail = el.querySelector<HTMLElement>(".ui-enl__detail")!;
    expect(detail.scrollWidth).toBeGreaterThan(detail.clientWidth);
    expect(el.querySelector('[data-id="dir"] .ui-enl__text')!.getAttribute("title")).toContain(LONG);
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth);
  });

  test("an action fires with its row, named with the row", async () => {
    const el = await make();
    const seen: unknown[] = [];
    el.addEventListener("tc-action", (e) => seen.push((e as CustomEvent).detail));
    const btn = el.querySelector<HTMLElement>(".ui-enl__action")!;
    expect(btn.getAttribute("aria-label")).toBe("Save Lab workstation");
    btn.click();
    expect(seen).toEqual([{ id: "save", itemId: "pc", item: ITEMS[0] }]);
  });

  test("a switch is named by its row; changing it fires; preventing it keeps the value", async () => {
    const el = await make();
    const seen: unknown[] = [];
    const inner: unknown[] = [];
    el.addEventListener("tc-toggles-change", (e) => seen.push((e as CustomEvent).detail));
    el.addEventListener("tc-value-change", (e) => inner.push(e));
    const sw = input(el);
    expect(sw.closest("label")!.textContent).toContain("Remote access");
    sw.click();
    await settle();
    expect(seen).toEqual([{ toggles: { own: true }, id: "own", value: true }]);
    expect(el.toggles).toEqual({ own: true });
    expect(inner).toEqual([]);
    expect(input(el).checked).toBe(true);
    el.addEventListener("tc-toggles-change", (e) => e.preventDefault());
    input(el).click();
    await settle();
    expect(el.toggles).toEqual({ own: true });
    await expect.poll(() => input(el).checked).toBe(true);
  });

  test("no heading draws no header; bare drops the tray; empty says so", async () => {
    const el = await fixture<TcEnvironmentList>(html`<tc-environment-list bare .items=${ITEMS}></tc-environment-list>`);
    expect(el.querySelector(".tc-head")).toBeNull();
    expect(getComputedStyle(el).paddingTop).toBe("0px");
    el.items = [];
    await settle();
    expect(el.querySelector(".ui-enl__empty")).not.toBeNull();
  });

  test("React: uncontrolled survives a re-render, controlled waits for the parent", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    const root = createRoot(wrap);
    const render = (props: Partial<React.ComponentProps<typeof EnvironmentList>>) => act(async () => root.render(React.createElement(EnvironmentList, { items: ITEMS, ...props })));
    await render({ defaultToggles: { own: true } });
    const el = wrap.querySelector<TcEnvironmentList>("tc-environment-list")!;
    await settle();
    expect(input(el).checked).toBe(true);
    await act(async () => input(el).click());
    await settle();
    await render({ defaultToggles: { own: true }, description: "Again" });
    await settle();
    expect(input(el).checked).toBe(false);
    const seen: unknown[] = [];
    await render({ toggles: { own: true }, onTogglesChange: (t) => void seen.push(t) });
    await settle();
    await act(async () => input(el).click());
    await settle();
    expect(seen).toEqual([{ own: false }]);
    await expect.poll(() => input(el).checked).toBe(true);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = document.body.appendChild(document.createElement("div"));
      wrap.style.colorScheme = theme;
      wrap.innerHTML = `<tc-environment-list look="standard" heading="A"></tc-environment-list><tc-environment-list look="clean" heading="B"></tc-environment-list>`;
      wrap.querySelectorAll<TcEnvironmentList>("tc-environment-list").forEach((el) => {
        el.items = ITEMS;
      });
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
