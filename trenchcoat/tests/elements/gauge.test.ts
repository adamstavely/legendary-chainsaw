/*
 * <tc-gauge> in real browsers: the meter and what it's read as, the band the value falls in, the bands, ticks and
 * target, the change from `previous`, the three shapes and sizes, the editable slider by keyboard and pointer,
 * controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/gauge";
import type { GaugeBand, GaugeValueChange, TcGauge } from "../../src/elements/gauge";
import { Gauge } from "../../src/elements/react/gauge";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const BANDS: GaugeBand[] = [
  { to: 60, tone: "success", label: "Normal" },
  { to: 85, tone: "warning", label: "Warning" },
  { to: 100, tone: "danger", label: "Critical" },
];
const meter = (el: Element) => el.querySelector<HTMLElement>(".ui-gau__meter")!;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcGauge>(html`<tc-gauge look=${look} label="Storage used" unit="%" .value=${72} .bands=${BANDS} .target=${80} .previous=${68} good="down"></tc-gauge>`);

describe("tc-gauge", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a meter named by its label, read with its band`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("gau");
      expect(el.dataset.look).toBe(look);
      const m = meter(el);
      expect(m.getAttribute("role")).toBe("meter");
      expect(m.hasAttribute("tabindex")).toBe(false);
      expect(document.getElementById(m.getAttribute("aria-labelledby")!)!.textContent).toBe("Storage used");
      expect([m.getAttribute("aria-valuenow"), m.getAttribute("aria-valuemin"), m.getAttribute("aria-valuemax")]).toEqual(["72", "0", "100"]);
      expect(m.getAttribute("aria-valuetext")).toBe("72%, Warning");
      expect(el.querySelector(".ui-gau__value")!.textContent).toBe("72%");
      const band = el.querySelector<HTMLElement>(".ui-gau__band-label")!;
      expect(band.textContent!.trim()).toBe("Warning");
      expect(band.dataset.tone).toBe("warning");
    });
  }

  test("the band: up to and including each `to`, the last running to max; no bands, no band word", async () => {
    const el = await make();
    const said = async (v: number) => {
      el.value = v;
      await settle();
      return meter(el).getAttribute("aria-valuetext");
    };
    expect(await said(60)).toBe("60%, Normal");
    expect(await said(60.5)).toBe("60.5%, Warning");
    expect(await said(100)).toBe("100%, Critical");
    // Out of range: read as it is, the meter's number kept in range
    expect(await said(120)).toBe("120%, Critical");
    expect(meter(el).getAttribute("aria-valuenow")).toBe("100");
    el.bands = [];
    await settle();
    expect(meter(el).getAttribute("aria-valuetext")).toBe("120%");
    expect(el.querySelector(".ui-gau__band-label")).toBeNull();
  });

  test("the dial: bands round it, a tick between each, a target line, the fill to the value", async () => {
    const el = await make();
    expect([...el.querySelectorAll<SVGElement>(".ui-gau__band")].map((b) => b.dataset.tone)).toEqual(["success", "warning", "danger"]);
    expect(el.querySelectorAll(".ui-gau__tick")).toHaveLength(2);
    expect(el.querySelector(".ui-gau__target")).not.toBeNull();
    const fill = el.querySelector<SVGPathElement>(".ui-gau__fill")!;
    expect(parseFloat(fill.style.strokeDashoffset)).toBe(28);
    expect(fill.dataset.tone).toBe("warning");
    el.value = 0;
    await settle();
    expect(fill.hasAttribute("data-empty")).toBe(true);
    // The target, and the change: down is good, so up is red
    el.value = 72;
    await settle();
    expect(el.querySelector(".ui-gau__target-text")!.textContent!.trim()).toBe("Target 80%");
    const change = el.querySelector<HTMLElement>(".ui-gau__change")!;
    expect(change.textContent!.replace(/\s+/g, " ").trim()).toBe("▲Up 4% from last time");
    expect(change.dataset.tone).toBe("danger");
    expect(change.querySelector("[aria-hidden]")!.textContent).toBe("▲");
    el.previous = 72.02;
    el.previousLabel = "the last reading";
    await settle();
    expect(el.querySelector(".ui-gau__change")!.textContent).toBe("No change from the last reading");
  });

  test("a range below zero, a unit with a space and a format", async () => {
    const el = await fixture<TcGauge>(html`<tc-gauge label="Freezer B" unit="°C" .min=${-90} .max=${-60} .value=${-78}></tc-gauge>`);
    expect(meter(el).getAttribute("aria-valuetext")).toBe("-78°C");
    expect(parseFloat(el.querySelector<SVGPathElement>(".ui-gau__fill")!.style.strokeDashoffset)).toBe(60);
    el.unit = "racks";
    await settle();
    expect(el.querySelector(".ui-gau__value")!.textContent).toBe("-78 racks");
    el.format = (v) => `${Math.abs(v)} below`;
    await settle();
    expect(el.querySelector(".ui-gau__value")!.textContent).toBe("78 below");
  });

  test("shapes and sizes: a half dial and a bar; size changes the dial", async () => {
    const el = await make();
    const md = el.querySelector(".ui-gau__face")!.getBoundingClientRect().width;
    el.size = "lg";
    await settle();
    expect(el.querySelector(".ui-gau__face")!.getBoundingClientRect().width).toBeGreaterThan(md);
    el.variant = "semicircle";
    await settle();
    expect(el.querySelector(".ui-gau__svg")!.getAttribute("viewBox")).toBe("0 0 120 66");
    expect(meter(el).dataset.variant).toBe("semicircle");
    el.variant = "bar";
    await settle();
    expect(el.querySelector(".ui-gau__svg")).toBeNull();
    expect(el.querySelector<HTMLElement>(".ui-gau__bar-fill")!.style.transform).toBe("scaleX(0.72)");
    expect(el.querySelectorAll(".ui-gau__bar-band")).toHaveLength(3);
    expect(el.querySelector<HTMLElement>(".ui-gau__bar-target")!.style.left).toBe("80%");
    expect([...el.querySelectorAll(".ui-gau__ends span")].map((s) => s.textContent)).toEqual(["0%", "100%"]);
  });

  test("editable: a slider – arrows by `step`, Page Up / Down by ten, Home / End; tc-value-change, preventable", async () => {
    const el = await fixture<TcGauge>(html`<tc-gauge editable label="Alarm level" .value=${50} .step=${0.5}></tc-gauge>`);
    const m = meter(el);
    expect(m.getAttribute("role")).toBe("slider");
    expect(m.tabIndex).toBe(0);
    const seen: number[] = [];
    el.addEventListener("tc-value-change", (e) => seen.push((e as CustomEvent<GaugeValueChange>).detail.value));
    key(m, "ArrowRight");
    key(m, "ArrowUp");
    await settle();
    expect(el.value).toBe(51);
    key(m, "PageDown");
    await settle();
    expect(el.value).toBe(46);
    key(m, "End");
    key(m, "ArrowRight");
    await settle();
    expect(el.value).toBe(100);
    key(m, "Home");
    await settle();
    expect(seen).toEqual([50.5, 51, 46, 100, 0]);
    // Prevented, it stays
    el.addEventListener("tc-value-change", (e) => e.preventDefault(), { once: true });
    key(m, "ArrowRight");
    await settle();
    expect(el.value).toBe(0);
    // Not editable: the keys do nothing
    el.editable = false;
    await settle();
    key(meter(el), "ArrowRight");
    await settle();
    expect(el.value).toBe(0);
    expect(meter(el).getAttribute("role")).toBe("meter");
  });

  test("editable: pressing along the bar or round the dial sets the value", async () => {
    const el = await fixture<TcGauge>(html`<tc-gauge editable variant="bar" label="Alarm level" .value=${10}></tc-gauge>`);
    const face = () => el.querySelector<HTMLElement>(".ui-gau__face")!;
    let box = face().getBoundingClientRect();
    face().dispatchEvent(new PointerEvent("pointerdown", { button: 0, pointerId: 1, clientX: box.left + box.width * 0.3, clientY: box.top + 4, bubbles: true }));
    await settle();
    expect(el.value).toBe(30);
    face().dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: box.left + box.width * 0.75, clientY: box.top + 4, bubbles: true }));
    face().dispatchEvent(new PointerEvent("pointerup", { pointerId: 1, bubbles: true }));
    await settle();
    expect(el.value).toBe(75);
    expect(document.activeElement).toBe(meter(el));
    // Round the dial: straight up is halfway through a 270° sweep; past the end snaps to the nearer end
    el.variant = "arc";
    await settle();
    box = face().getBoundingClientRect();
    face().dispatchEvent(new PointerEvent("pointerdown", { button: 0, pointerId: 2, clientX: box.left + box.width / 2, clientY: box.top + 2, bubbles: true }));
    face().dispatchEvent(new PointerEvent("pointerup", { pointerId: 2, bubbles: true }));
    await settle();
    expect(el.value).toBe(50);
    face().dispatchEvent(new PointerEvent("pointerdown", { button: 0, pointerId: 3, clientX: box.left + box.width * 0.45, clientY: box.bottom - 2, bubbles: true }));
    face().dispatchEvent(new PointerEvent("pointerup", { pointerId: 3, bubbles: true }));
    await settle();
    expect(el.value).toBe(0);
  });

  test("React wrapper: uncontrolled keeps the user's value through re-renders; controlled waits for the parent", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: number[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(Gauge, { label: "Alarm", editable: true, defaultValue: 20, onValueChange: (v) => void seen.push(v), "data-n": n } as React.ComponentProps<typeof Gauge>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-gauge")!;
    key(meter(el), "ArrowRight");
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.value).toBe(21);
    expect(seen).toEqual([21]);
    // A new root element: a controlled gauge
    await act(async () => root.render(React.createElement(Gauge, { label: "Alarm", editable: true, value: 40, onValueChange: (v) => void seen.push(v) })));
    await settle();
    const controlled = host.querySelector("tc-gauge")!;
    key(meter(controlled), "ArrowRight");
    await settle();
    expect(seen).toEqual([21, 41]);
    expect(controlled.value).toBe(40);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="display: grid; gap: 16px; padding: 16px; background: var(--tc-surface-base)">
        <tc-gauge label="Storage used" description="Biobank, all racks" unit="%" .value=${72} .bands=${BANDS} .target=${80} .previous=${68} good="down"></tc-gauge>
        <tc-gauge look="clean" variant="semicircle" size="sm" label="Freezer A" unit="°C" .min=${-90} .max=${-60} .value=${-81} .bands=${[{ to: -75, tone: "success", label: "In range" }, { to: -60, tone: "danger", label: "Too warm" }]}></tc-gauge>
        <tc-gauge editable variant="bar" label="Alarm level" .value=${30} .bands=${BANDS} .previous=${40} good="up"></tc-gauge>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
