/*
 * <tc-chord-chart> in real browsers: the shared chart behaviour (chart-kit), the groups' arcs and ribbons with the
 * largest group emphasised, highlight and what pointing at a group or ribbon does, "from"/"to" rows and pad angle, the
 * entrance and a data change, and the React wrapper.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/chord-chart";
import type { TcChordChart } from "../../src/elements/chord-chart";
import { ChordChart } from "../../src/elements/react/chord-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const HOURS = [
  { source: "Genomics", target: "Imaging", value: 40 },
  { source: "Imaging", target: "Genomics", value: 28 },
  { source: "Genomics", target: "Proteomics", value: 60 },
  { source: "Proteomics", target: "Genomics", value: 50 },
  { source: "Imaging", target: "Proteomics", value: 10 },
];
const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcChordChart>(
    html`<div style="width: 560px"><tc-chord-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Shared instrument time" .data=${o.data ?? HOURS}></tc-chord-chart></div>`,
  ).then((w) => w.querySelector("tc-chord-chart")!);
const arcs = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".ui-cdc__arc")];
const ribbons = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".ui-cdc__ribbon")];
const names = (el: Element) => [...el.querySelectorAll(".tc-chart__value")].map((t) => t.textContent);
const ACCENT = "var(--tc-plot-accent)";
const tipRows = (el: Element) => [...el.querySelectorAll(".tc-chart__tip-row")].map((r) => r.textContent!.replace(/\s+/g, " ").trim());

describe("tc-chord-chart", () => {
  chartBasics({ tag: "tc-chord-chart", ui: "cdc", kind: "Chord diagram", make: make as never, marks: 6, firstRead: /^Genomics: 178 \(47\.?\d*%\), 1 of 6/ });

  test("an arc per group sized by what it exchanges; the largest and its ribbons take the accent; names outside", async () => {
    const el = await drawn(await make({ still: true }));
    expect(arcs(el)).toHaveLength(3);
    expect(ribbons(el)).toHaveLength(3);
    expect(arcs(el).map((a) => a.style.fill === ACCENT)).toEqual([true, false, false]);
    // Genomics touches two of the three pairs
    expect(ribbons(el).filter((r) => r.style.fill === ACCENT)).toHaveLength(2);
    expect(names(el)).toEqual(["Genomics", "Imaging", "Proteomics"]);
    expect(el.querySelector(".tc-chart__value[data-strong]")!.textContent).toBe("Genomics");
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("3 groups: Genomics 178, Imaging 78, Proteomics 120");
  });

  test("highlight picks a group; pointing at a group lights its ribbons; a ribbon reads both ways", async () => {
    const el = await drawn(await make({ still: true }));
    el.highlight = "Imaging";
    await settle();
    expect(arcs(el).map((a) => a.style.fill === ACCENT)).toEqual([false, true, false]);
    key(plot(el), "Home");
    await settle();
    expect(tipRows(el)).toEqual(["Sent 100", "Received 78"]);
    const op = ribbons(el).map((r) => Number(r.getAttribute("opacity")));
    expect(op.filter((o) => o === 0.82)).toHaveLength(2);
    expect(op.filter((o) => o === 0.08)).toHaveLength(1);
    key(plot(el), "ArrowDown");
    key(plot(el), "ArrowDown");
    key(plot(el), "ArrowDown");
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Genomics ↔ Imaging: Genomics → Imaging 40, Imaging → Genomics 28, 4 of 6");
    expect(el.querySelector(".ui-cdc__ribbon[data-focus]")).not.toBeNull();
  });

  test('rows with "from" and "to" read without accessors; pad angle widens the gaps', async () => {
    const el = await drawn(await make({ still: true, data: HOURS.map(({ source, target, value }) => ({ from: source, to: target, value })) }));
    expect(names(el)).toEqual(["Genomics", "Imaging", "Proteomics"]);
    const len = () => arcs(el).reduce((a, p) => a + p.getTotalLength(), 0);
    const before = len();
    el.padAngle = 0.3;
    await settle();
    expect(len()).toBeLessThan(before);
  });

  test("the arcs sweep in and the ribbons follow; a data change glides", async () => {
    const el = await drawn(await make());
    const g = () => el.querySelector<SVGGElement>(".ui-cdc__ribbon")?.parentElement?.getAttribute("opacity");
    await expect.poll(() => Number(g() ?? 0), { timeout: 4000 }).toBe(1);
    const imaging = () => arcs(el)[1].getTotalLength();
    const before = imaging();
    el.data = [...HOURS, { source: "Imaging", target: "Proteomics", value: 200 }];
    await settle();
    await expect.poll(imaging, { timeout: 4000 }).toBeGreaterThan(before * 1.5);
  });

  test("React wrapper: props reach the element; view is controllable; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "560px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () => root.render(React.createElement(ChordChart, { title: "Hours", data: HOURS, still: true, padAngle: 0.1, view: "table", onMarkClick: (e) => clicks.push(e.label) })));
    await settle();
    const el = host.querySelector<TcChordChart>("tc-chord-chart")!;
    expect(el.heading).toBe("Hours");
    expect(el.padAngle).toBe(0.1);
    expect(el.view).toBe("table");
    el.querySelector<HTMLButtonElement>(".tc-chart__toggle")!.click();
    await settle();
    expect(el.view).toBe("table");
    await act(async () => root.render(React.createElement(ChordChart, { title: "Hours", data: HOURS, still: true, onMarkClick: (e) => clicks.push(e.label) })));
    await drawn(el);
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["Genomics"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
