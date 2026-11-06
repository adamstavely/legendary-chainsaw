/*
 * <tc-bullet-chart> in real browsers: the shared chart behaviour (chart-kit), bars against targets and ranges with the
 * one furthest behind emphasised, the shared scale, the status tone, a missing value, the entrance and a data change,
 * and the React wrapper.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/bullet-chart";
import type { TcBulletChart } from "../../src/elements/bullet-chart";
import { BulletChart } from "../../src/elements/react/bullet-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const AUDITS = [
  { label: "Biosafety", value: 72, target: 85, poor: 50, ok: 75 },
  { label: "Data retention", value: 91, target: 90, poor: 60, ok: 80 },
  { label: "Instrument calibration", value: 40, target: 80, poor: 50, ok: 70 },
];
const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcBulletChart>(
    html`<div style="width: 600px"><tc-bullet-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Audit readiness" unit="%" .ranges=${["poor", "ok"]} .data=${o.data ?? AUDITS}></tc-bullet-chart></div>`,
  ).then((w) => w.querySelector("tc-bullet-chart")!);
const bars = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".ui-blt__bar")];
const values = (el: Element) => [...el.querySelectorAll(".tc-chart__value")].map((t) => t.textContent);
const width = (p: SVGGraphicsElement) => p.getBBox().width;

describe("tc-bullet-chart", () => {
  chartBasics({ tag: "tc-bullet-chart", ui: "blt", kind: "Bullet chart", make: make as never, marks: 3, firstRead: /^Biosafety: 72% \/ target 85% \(85%\)/ });

  test("bars against targets and three bands; the row furthest behind emphasised; values at the right", async () => {
    const el = await drawn(await make({ still: true }));
    // Calibration is at half its target: the accent
    expect(bars(el).map((b) => b.hasAttribute("data-hi"))).toEqual([false, false, true]);
    expect(getComputedStyle(bars(el)[2]).fill).not.toBe(getComputedStyle(bars(el)[0]).fill);
    expect(el.querySelectorAll(".ui-blt__target")).toHaveLength(3);
    expect([...el.querySelectorAll(".ui-blt__range")].slice(0, 3).map((r) => r.getAttribute("data-level"))).toEqual(["0", "1", "2"]);
    expect(values(el)).toEqual(expect.arrayContaining(["72", "91", "40"]));
    expect(el.querySelector(".tc-chart__value[data-strong]")).not.toBeNull();
    // Each row on its own scale: the target tick of 90 out of 100 sits right of 85 out of 100
    const tx = [...el.querySelectorAll(".ui-blt__target")].map((t) => Number(t.getAttribute("x1")));
    expect(tx[1]).toBeGreaterThan(tx[0]);
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("Biosafety 72% (target 85%), Data retention 91% (target 90%), Instrument calibration 40% (target 80%)");
  });

  test("one shared scale writes its values underneath; the status tone tints the bands", async () => {
    const el = await drawn(await make({ still: true }));
    const h0 = el.querySelector(".tc-chart__svg")!.getAttribute("height");
    el.independent = false;
    el.rangeTone = "status";
    await settle();
    expect(Number(el.querySelector(".tc-chart__svg")!.getAttribute("height"))).toBe(Number(h0) + 16);
    expect([...el.querySelectorAll(".tc-chart__tick")].map((t) => t.textContent)).toEqual(expect.arrayContaining(["0", "100"]));
    const ranges = [...el.querySelectorAll<SVGPathElement>(".ui-blt__range")];
    expect(ranges.every((r) => r.dataset.tone === "status")).toBe(true);
    expect(getComputedStyle(ranges[0]).fill).not.toBe(getComputedStyle(ranges[2]).fill);
  });

  test("a missing value is written as a dash, never as 0", async () => {
    const el = await drawn(await make({ still: true, data: [AUDITS[0], { label: "Fire drill", target: 100 }] }));
    expect(values(el)).toEqual(["72", "–"]);
    key(plot(el), "End");
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toMatch(/^Fire drill: – \/ target 100%/);
  });

  test("bars grow once on screen; a data change glides", async () => {
    const el = await drawn(await make());
    await expect.poll(() => width(bars(el)[1]), { timeout: 4000 }).toBeGreaterThan(300);
    el.data = AUDITS.map((d, i) => (i === 1 ? { ...d, value: 20 } : d));
    await settle();
    await expect.poll(() => width(bars(el)[1]), { timeout: 4000 }).toBeLessThan(120);
    // Now the furthest behind
    expect(bars(el)[1].hasAttribute("data-hi")).toBe(true);
  });

  test("React wrapper: props reach the element; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () => root.render(React.createElement(BulletChart, { title: "Audits", data: AUDITS, ranges: ["poor", "ok"], rangeTone: "status", still: true, onMarkClick: (e) => clicks.push(e.label) })));
    const el = await drawn(host.querySelector<TcBulletChart>("tc-bullet-chart")!);
    expect(el.heading).toBe("Audits");
    expect(el.rangeTone).toBe("status");
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["Biosafety"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
