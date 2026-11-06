/*
 * <tc-box-plot> in real browsers: the shared chart behaviour (chart-kit), the quartiles and outliers worked out, the
 * highest median emphasised, highlight by name, violins, hidden outliers, the entrance and data changes, the React
 * wrapper and axe.
 */
import { html } from "lit";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/box-plot";
import type { TcBoxPlot } from "../../src/elements/box-plot";
import { BoxPlot } from "../../src/elements/react/box-plot";
import { chartBasics, drawn, key, plot } from "./chart-kit";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

// Assay turnaround in days, by lab
const RAW: Record<string, number[]> = {
  Genomics: [3, 4, 4, 5, 5, 6, 7, 14],
  Imaging: [6, 7, 8, 8, 9, 10, 11],
  Proteomics: [2, 3, 3, 4, 5],
};
const DATA = Object.entries(RAW).flatMap(([group, vs]) => vs.map((value) => ({ group, value })));

const make = (o: { look?: "standard" | "clean"; bare?: boolean; still?: boolean; data?: Record<string, unknown>[] } = {}) =>
  fixture<TcBoxPlot>(
    html`<div style="width: 600px"><tc-box-plot look=${o.look ?? "standard"} ?bare=${o.bare} ?still=${o.still} heading="Assay turnaround" .data=${o.data ?? DATA}></tc-box-plot></div>`,
  ).then((w) => w.querySelector("tc-box-plot")!);
const boxes = (el: Element) => [...el.querySelectorAll<SVGPathElement>(".ui-bxp__box")];
const tipRows = (el: Element) => [...el.querySelectorAll(".tc-chart__tip-row")].map((r) => r.textContent!.replace(/\s+/g, " ").trim());

describe("tc-box-plot", () => {
  chartBasics({ tag: "tc-box-plot", ui: "bxp", kind: "Box plot", make: make as never, marks: 3, firstRead: /^Genomics: median 5, IQR 4 to 6\.3/ });

  test("the quartiles, whiskers and outliers; the highest median takes the accent", async () => {
    const el = await drawn(await make({ still: true }));
    expect(boxes(el).map((b) => b.style.fill)).toEqual(["var(--tc-plot-rest)", "var(--tc-plot-accent)", "var(--tc-plot-rest)"]);
    // 14 lies beyond Genomics' upper whisker (Q3 6.25 + 1.5 × 2.25)
    expect(el.querySelectorAll(".ui-bxp__outlier").length).toBe(1);
    expect(el.querySelector(".ui-bxp__outlier")!.hasAttribute("data-hi")).toBe(false);
    expect(el.querySelector(".tc-chart__tick[data-strong]")!.textContent).toBe("Imaging");
    expect(document.getElementById(plot(el).getAttribute("aria-describedby")!)!.textContent).toBe("Genomics median 5, Imaging median 8, Proteomics median 3");
    // Imaging's box is taller than Proteomics' and sits higher
    const [, im, pr] = boxes(el).map((b) => b.getBBox());
    expect(im.y).toBeLessThan(pr.y);
    key(plot(el), "ArrowRight");
    await settle();
    expect(tipRows(el)).toEqual(["Max (whisker) 7", "Q3 6.3", "Median 5", "Q1 4", "Min (whisker) 3", "Sample size 8 · 1 outlier"]);
  });

  test("highlight picks a group by name; unit writes the values; hide-outliers drops the rings", async () => {
    const el = await drawn(await make({ still: true }));
    el.highlight = "Proteomics";
    el.unit = " d";
    el.hideOutliers = true;
    await settle();
    expect(boxes(el)[2].style.fill).toBe("var(--tc-plot-accent)");
    expect(boxes(el)[1].style.fill).toBe("var(--tc-plot-rest)");
    expect(el.querySelectorAll(".ui-bxp__outlier").length).toBe(0);
    key(plot(el), "End");
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toMatch(/^Proteomics: median 3 d, IQR 3 d to 4 d, 3 of 3/);
  });

  test("violins: a density curve per group with a slim box inside; the kind follows", async () => {
    const el = await drawn(await make({ still: true }));
    el.variant = "violin";
    el.heading = "";
    await settle();
    expect(el.querySelectorAll(".ui-bxp__violin").length).toBe(3);
    expect(boxes(el).every((b) => b.hasAttribute("data-inner"))).toBe(true);
    expect(el.querySelector(".tc-head")!.textContent).toContain("Violin plot");
    // Box-only extras are gone: no whisker caps
    expect(el.querySelectorAll(".ui-bxp__whisker").length).toBe(6);
  });

  test("the entrance opens the boxes from their medians, then a data change glides", async () => {
    const el = await drawn(await make());
    const h = () => boxes(el)[1].getBBox().height;
    await expect.poll(h, { timeout: 4000 }).toBeGreaterThan(20);
    await expect.poll(() => (el as unknown as { motion: { animating: boolean } }).motion.animating, { timeout: 4000 }).toBe(false);
    const before = h();
    el.data = DATA.map((d) => (d.group === "Imaging" ? { ...d, value: 8 + (d.value - 8) * 0.25 } : d));
    await settle();
    await expect.poll(h, { timeout: 4000 }).toBeLessThan(before * 0.4);
  });

  test("React wrapper: props reach the element; view is controllable; mark events", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "600px";
    const root = createRoot(host);
    const clicks: string[] = [];
    await act(async () => root.render(React.createElement(BoxPlot, { title: "Turnaround", data: DATA, still: true, variant: "both", view: "table", onMarkClick: (e) => clicks.push(e.label) })));
    await settle();
    const el = host.querySelector<TcBoxPlot>("tc-box-plot")!;
    expect(el.heading).toBe("Turnaround");
    expect(el.variant).toBe("both");
    expect(el.view).toBe("table");
    el.querySelector<HTMLButtonElement>(".tc-chart__toggle")!.click();
    await settle();
    expect(el.view).toBe("table");
    await act(async () => root.render(React.createElement(BoxPlot, { title: "Turnaround", data: DATA, still: true, onMarkClick: (e) => clicks.push(e.label) })));
    await drawn(el);
    key(plot(el), "ArrowRight");
    key(plot(el), "Enter");
    expect(clicks).toEqual(["Genomics"]);
    await act(async () => root.unmount());
    host.remove();
  });
});
