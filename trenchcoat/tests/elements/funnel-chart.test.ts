/*
 * <tc-funnel-chart> in real browsers: the shared chart behaviour (chart-kit), the widths and rates, the biggest drop
 * emphasised, rates against the first step and hidden, a data change, the React wrapper and axe.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/funnel-chart";
import type { TcFunnelChart } from "../../src/elements/funnel-chart";
import { FunnelChart } from "../../src/elements/react/funnel-chart";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const GRANTS = [
  { label: "Drafted", value: 200 },
  { label: "Submitted", value: 160 },
  { label: "Shortlisted", value: 64 },
  { label: "Funded", value: 48 },
];
const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcFunnelChart>(
    html`<div style="width: 560px"><tc-funnel-chart look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Grant pipeline" .data=${o.data ?? GRANTS}></tc-funnel-chart></div>`,
  ).then((w) => w.querySelector("tc-funnel-chart")!);
const bars = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".ui-fnl__bar")];
const values = (el: Element) => [...el.querySelectorAll(".tc-chart__value")].map((t) => t.textContent);
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent!;

describe("tc-funnel-chart", () => {
  chartBasics({ tag: "tc-funnel-chart", ui: "fnl", kind: "Funnel chart", make: make as never, marks: 4, firstRead: /^Drafted: 200, / });

  test("bars scaled to the largest step, centred; rates against the step before; the lowest rate emphasised", async () => {
    const el = await drawn(await make({ still: true }));
    const boxes = bars(el).map((b) => b.getBBox());
    expect(boxes[1].width / boxes[0].width).toBeCloseTo(0.8, 2);
    expect(boxes[0].x + boxes[0].width / 2).toBeCloseTo(boxes[3].x + boxes[3].width / 2, 1);
    expect(el.querySelectorAll(".ui-fnl__neck")).toHaveLength(3);
    // Names, then rates: Submitted 80%, Shortlisted 40% (the biggest drop), Funded 75%
    expect(values(el)).toEqual(["Drafted", "Submitted", "80%", "Shortlisted", "40%", "Funded", "75%"]);
    expect(bars(el).map((b) => b.style.fill)).toEqual(["var(--tc-plot-rest)", "var(--tc-plot-rest)", "var(--tc-plot-accent)", "var(--tc-plot-rest)"]);
    expect([...el.querySelectorAll(".tc-chart__value[data-strong]")].map((t) => t.textContent)).toEqual(["Shortlisted", "40%"]);
    expect(el.querySelector(".tc-chart__tick")!.textContent).toBe("vs. previous");
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("4 steps: Drafted 200, Submitted 160 (80%), Shortlisted 64 (40%), Funded 48 (75%)");
  });

  test("the tooltip has the count, rate and drop-off; rate-base first and hide-rates", async () => {
    const el = await drawn(await make({ still: true }));
    key(plot(el), "ArrowRight");
    key(plot(el), "ArrowRight");
    await settle();
    expect(status(el)).toBe("Submitted: 160 · 80% of previous step, 2 of 4");
    expect([...el.querySelectorAll(".tc-chart__tip-value")].map((t) => t.textContent)).toEqual(["160", "80%", "40"]);
    el.rateBase = "first";
    await settle();
    expect(values(el)).toEqual(["Drafted", "Submitted", "80%", "Shortlisted", "32%", "Funded", "24%"]);
    expect(el.querySelector(".tc-chart__tick")!.textContent).toBe("vs. first");
    // Against the first, the last step has the lowest rate
    expect(bars(el)[3].style.fill).toBe("var(--tc-plot-accent)");
    el.hideRates = true;
    el.highlight = 0;
    await settle();
    expect(values(el)).toEqual(["Drafted", "Submitted", "Shortlisted", "Funded"]);
    expect(bars(el)[0].style.fill).toBe("var(--tc-plot-accent)");
  });

  test("the entrance widens the bars once on screen; a data change glides", async () => {
    const el = await drawn(await make());
    const w = () => bars(el)[3]?.getBBox().width ?? 0;
    await expect.poll(w, { timeout: 4000 }).toBeGreaterThan(80);
    const before = w();
    el.data = GRANTS.map((d, i) => ({ ...d, value: i === 3 ? 16 : d.value }));
    await settle();
    await expect.poll(w, { timeout: 4000 }).toBeLessThan(before / 2);
  });

  test("React wrapper: props reach the element; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "560px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () => root.render(React.createElement(FunnelChart, { title: "Grants", data: GRANTS, still: true, rateBase: "first", onMarkClick: (e) => clicks.push(e.label) })));
    const el = host.querySelector<TcFunnelChart>("tc-funnel-chart")!;
    await drawn(el);
    expect(el.heading).toBe("Grants");
    expect(el.rateBase).toBe("first");
    key(plot(el), "End");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["Funded"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
