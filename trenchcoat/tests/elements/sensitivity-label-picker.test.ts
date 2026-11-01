/*
 * <tc-sensitivity-label-picker> in real browsers: the button and list, raising at once, asking why before lowering,
 * keyboard, controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/sensitivity-label-picker";
import type { SensitivityValueChange, TcSensitivityLabelPicker } from "../../src/elements/sensitivity-label-picker";
import { SensitivityLabelPicker } from "../../src/elements/react/sensitivity-label-picker";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const picker = (value: string | null = "confidential") => fixture<TcSensitivityLabelPicker>(html`<tc-sensitivity-label-picker .value=${value} file-name="Q3.pdf"></tc-sensitivity-label-picker>`);
const open = async (el: TcSensitivityLabelPicker) => {
  el.querySelector<HTMLElement>(".ui-slp__trigger")!.click();
  await settle();
  await expect.poll(() => el.querySelector(".ui-slp__pop")).toBeTruthy();
};
const option = (el: Element, name: string) => [...el.querySelectorAll<HTMLElement>('[role="option"]')].find((o) => text(o.querySelector(".ui-slp__name")) === name)!;
const seen = (el: Element) => {
  const list: SensitivityValueChange[] = [];
  el.addEventListener("tc-value-change", (e) => list.push((e as CustomEvent<SensitivityValueChange>).detail));
  return list;
};
const write = async (el: Element, value: string) => {
  const t = el.querySelector<HTMLTextAreaElement>(".ui-slp__reason")!;
  t.value = value;
  t.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
};

describe("tc-sensitivity-label-picker", () => {
  test("shows the label's mark and word, and names the file", async () => {
    const el = await picker();
    expect(el.dataset.ui).toBe("slp");
    const trigger = el.querySelector(".ui-slp__trigger")!;
    expect(text(trigger)).toContain("Confidential");
    expect(text(trigger)).toContain("Q3.pdf");
    expect(trigger.querySelectorAll('.ui-slp__bar[data-on="true"]')).toHaveLength(3);
  });

  test("with no value it invites setting one, and an unknown id says so", async () => {
    expect(text((await picker(null)).querySelector(".ui-slp__trigger"))).toContain("Set sensitivity");
    expect(text((await picker("gone")).querySelector(".ui-slp__trigger"))).toContain("Unknown label");
  });

  test("lists labels by level, on the current one", async () => {
    const el = await picker();
    await open(el);
    const options = [...el.querySelectorAll<HTMLElement>('[role="option"]')];
    expect(options.map((o) => text(o.querySelector(".ui-slp__name")))).toEqual(["Public", "Internal", "Confidential", "Restricted"]);
    expect(options[2]!.getAttribute("aria-selected")).toBe("true");
    await expect.poll(() => document.activeElement).toBe(options[2]);
  });

  test("raising happens at once", async () => {
    const el = await picker();
    const events = seen(el);
    await open(el);
    option(el, "Restricted").click();
    await settle();
    expect(el.value).toBe("restricted");
    expect(events[0]!.direction).toBe("raise");
    expect(events[0]!.reason).toBeUndefined();
    expect(el.querySelector(".ui-slp__pop")).toBeNull();
    expect(text(el.querySelector('[role="status"]'))).toContain("Restricted");
  });

  test("setting from nothing happens at once", async () => {
    const el = await picker(null);
    const events = seen(el);
    await open(el);
    option(el, "Public").click();
    await settle();
    expect(events[0]!.direction).toBe("set");
  });

  test("lowering asks why first, and fires with the reason", async () => {
    const el = await picker();
    const events = seen(el);
    await open(el);
    option(el, "Public").click();
    await settle();
    expect(events).toHaveLength(0);
    expect(el.value).toBe("confidential");
    await expect.poll(() => document.activeElement).toBe(el.querySelector(".ui-slp__reason"));
    el.querySelector<HTMLElement>(".ui-slp__confirm")!.click();
    await settle();
    expect(text(el.querySelector(".ui-slp__error"))).toContain("Add a reason");
    expect(events).toHaveLength(0);
    await write(el, " Published. ");
    el.querySelector<HTMLElement>(".ui-slp__confirm")!.click();
    await settle();
    expect(events[0]).toMatchObject({ value: "public", direction: "lower", reason: "Published." });
    expect(el.value).toBe("public");
  });

  test("Back returns to the list", async () => {
    const el = await picker();
    await open(el);
    option(el, "Public").click();
    await settle();
    el.querySelector<HTMLElement>(".ui-slp__back")!.click();
    await settle();
    expect(el.querySelector('[role="listbox"]')).toBeTruthy();
    expect(el.value).toBe("confidential");
  });

  test("the keyboard moves and picks", async () => {
    const el = await picker();
    await open(el);
    const list = el.querySelector('[role="listbox"]')!;
    list.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true }));
    await settle();
    await expect.poll(() => document.activeElement).toBe(option(el, "Restricted"));
    list.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    await settle();
    expect(el.value).toBe("restricted");
  });

  test("preventDefault keeps the value", async () => {
    const el = await picker();
    el.addEventListener("tc-value-change", (e) => e.preventDefault());
    await open(el);
    option(el, "Restricted").click();
    await settle();
    expect(el.value).toBe("confidential");
  });

  test("disabled doesn't open", async () => {
    const el = await fixture<TcSensitivityLabelPicker>(html`<tc-sensitivity-label-picker disabled value="public"></tc-sensitivity-label-picker>`);
    el.querySelector<HTMLElement>(".ui-slp__trigger")!.click();
    await settle();
    expect(el.querySelector(".ui-slp__pop")).toBeNull();
  });
});

describe("React", () => {
  test("an uncontrolled pick survives a re-render", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const node = () => React.createElement(SensitivityLabelPicker, { defaultValue: "internal" });
    await act(async () => root.render(node()));
    await settle();
    const el = host.querySelector<TcSensitivityLabelPicker>("tc-sensitivity-label-picker")!;
    await act(async () => open(el));
    await act(async () => option(el, "Restricted").click());
    await act(async () => root.render(node()));
    await settle();
    expect(el.value).toBe("restricted");
    await act(async () => root.unmount());
    host.remove();
  });

  test("a controlled value stays until the parent changes it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const got: string[] = [];
    await act(async () => root.render(React.createElement(SensitivityLabelPicker, { value: "internal", onValueChange: (v: string) => got.push(v) })));
    await settle();
    const el = host.querySelector<TcSensitivityLabelPicker>("tc-sensitivity-label-picker")!;
    await act(async () => open(el));
    await act(async () => option(el, "Restricted").click());
    expect(got).toEqual(["restricted"]);
    expect(el.value).toBe("internal");
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas`}><tc-sensitivity-label-picker value="internal" file-name="Q3.pdf"></tc-sensitivity-label-picker></div>`);
        const el = wrap.querySelector<TcSensitivityLabelPicker>("tc-sensitivity-label-picker")!;
        await open(el);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
