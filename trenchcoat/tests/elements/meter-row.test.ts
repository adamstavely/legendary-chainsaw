/*
 * <tc-meter-row> in real browsers: the figures, thresholds with a mark and a word, bad numbers, the button, compact, the
 * React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/meter-row";
import type { TcMeterRow } from "../../src/elements/meter-row";
import { MeterRow } from "../../src/elements/react/meter-row";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const meter = (el: Element) => el.querySelector('[role="meter"]')!;
const row = (value: number, max = 1) => fixture<TcMeterRow>(html`<tc-meter-row label="Storage" .value=${value} .max=${max}></tc-meter-row>`);

describe("tc-meter-row", () => {
  test("is a meter named by the label, with its value", async () => {
    const el = await row(0.17);
    expect(el.dataset.ui).toBe("mrw");
    const m = meter(el);
    expect(document.getElementById(m.getAttribute("aria-labelledby")!)!.textContent).toBe("Storage");
    expect(m.getAttribute("aria-valuenow")).toBe("0.17");
    expect(m.getAttribute("aria-valuemax")).toBe("1");
    expect(m.getAttribute("aria-valuetext")).toBe("17%");
    expect(el.querySelector(".ui-mrw__value")!.textContent).toBe("17%");
    expect(el.querySelector(".ui-mrw__mark")).toBeNull();
  });

  test("works from any maximum, and valueText replaces the percentage", async () => {
    const el = await row(250, 1000);
    expect(el.querySelector(".ui-mrw__value")!.textContent).toBe("25%");
    el.valueText = "250 of 1,000";
    await settle();
    expect(meter(el).getAttribute("aria-valuetext")).toBe("250 of 1,000");
  });

  test("values are held to the ends, and bad numbers count as nothing", async () => {
    expect((await row(5)).querySelector(".ui-mrw__value")!.textContent).toBe("100%");
    expect((await row(-1)).querySelector(".ui-mrw__value")!.textContent).toBe("0%");
    expect((await row(NaN)).querySelector(".ui-mrw__value")!.textContent).toBe("0%");
    const bad = await row(0.5, 0);
    expect(bad.querySelector(".ui-mrw__value")!.textContent).toBe("50%");
    const attr = await fixture<TcMeterRow>(html`<tc-meter-row label="x" value="odd"></tc-meter-row>`);
    expect(attr.querySelector(".ui-mrw__value")!.textContent).toBe("0%");
  });

  test("past a threshold it has a tone, a mark and a word", async () => {
    const warn = await row(0.8);
    expect(warn.querySelector(".ui-mrw__row")!.getAttribute("data-tone")).toBe("warning");
    expect(warn.querySelector(".ui-mrw__mark")).toBeTruthy();
    expect(meter(warn).getAttribute("aria-valuetext")).toBe("80%, Getting full");
    const danger = await row(0.95);
    expect(danger.querySelector(".ui-mrw__row")!.getAttribute("data-tone")).toBe("danger");
    expect(meter(danger).getAttribute("aria-valuetext")).toBe("95%, Nearly full");
    danger.labels = { danger: "Full" };
    danger.dangerAt = 0.9;
    await settle();
    expect(meter(danger).getAttribute("aria-valuetext")).toBe("95%, Full");
  });

  test("interactive: a button named by the label, which covers the row and fires tc-open", async () => {
    const el = await fixture<TcMeterRow>(html`<tc-meter-row label="Storage" value="0.2" interactive></tc-meter-row>`);
    let opened = 0;
    el.addEventListener("tc-open", () => opened++);
    const open = el.querySelector<HTMLButtonElement>(".ui-mrw__open")!;
    expect(open.textContent).toContain("Storage");
    expect(open.contains(meter(el))).toBe(false);
    const box = el.querySelector(".ui-mrw__value")!.getBoundingClientRect();
    expect(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)).toBe(open);
    open.click();
    expect(opened).toBe(1);
  });

  test("not interactive: no button", async () => {
    expect((await row(0.2)).querySelector("button")).toBeNull();
  });

  test("compact hides the label from sight, and it still names the meter", async () => {
    const el = await fixture<TcMeterRow>(html`<tc-meter-row label="Storage" value="0.2" compact></tc-meter-row>`);
    const name = document.getElementById(meter(el).getAttribute("aria-labelledby")!)!;
    expect(name.textContent).toBe("Storage");
    expect(name.classList.contains("tc-sr-only")).toBe(true);
  });

  test("React: props and tc-open reach the element", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    let opened = 0;
    await act(async () => root.render(React.createElement(MeterRow, { label: "A", value: 0.5, interactive: true, onTcOpen: () => opened++ })));
    await settle();
    expect(host.querySelector(".ui-mrw__value")!.textContent).toBe("50%");
    await act(async () => host.querySelector<HTMLButtonElement>(".ui-mrw__open")!.click());
    expect(opened).toBe(1);
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`axe: ${look}, ${scheme}`, async () => {
        document.documentElement.style.colorScheme = scheme;
        const wrap = await fixture<HTMLElement>(html`<div style="background: var(--tc-surface-raised)">
          <tc-meter-row look=${look} label="One" value="0.2"></tc-meter-row>
          <tc-meter-row look=${look} label="Two" value="0.85" interactive></tc-meter-row>
          <tc-meter-row look=${look} label="Three" value="0.99" compact></tc-meter-row>
        </div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        document.documentElement.style.colorScheme = "";
        expect(violations.map((v) => v.id)).toEqual([]);
      });
    }
  }
});
