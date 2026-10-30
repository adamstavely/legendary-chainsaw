/*
 * <tc-radar-chart> in real browsers: the drawing and how it's read, the scale (largest value, 100 for %, `max`), the
 * axes' names and one series' values on them, the web rings, several series and their legend, the table view and its
 * switch, empty data, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/radar-chart";
import type { RadarSeries, RadarViewChange, TcRadarChart } from "../../src/elements/radar-chart";
import { RadarChart } from "../../src/elements/react/radar-chart";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const AXES = ["Code review", "Issues", "Pull requests", "Commits"];
const ONE: RadarSeries[] = [{ name: "Contributions", values: [0, 0, 10, 90] }];
const THREE: RadarSeries[] = [
  { name: "Genomics", values: [4, 3, 5] },
  { name: "Imaging", values: [3, 4, null] },
  { name: "Field ecology", values: [2, 5, 3] },
];
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcRadarChart>(html`<tc-radar-chart look=${look} heading="Activity overview" unit="%" .axes=${AXES} .series=${ONE}></tc-radar-chart>`);
const plot = (el: Element) => el.querySelector<HTMLElement>(".ui-rdr__plot")!;
const read = (el: Element) =>
  plot(el)
    .getAttribute("aria-labelledby")!
    .split(" ")
    .map((id) => document.getElementById(id)!.textContent)
    .join(", ");
/** A series' points, as [x, y] pairs in the drawing's box */
const points = (el: Element, k = 0) =>
  el.querySelectorAll<SVGPolygonElement>(".ui-rdr__shape")[k].getAttribute("points")!.split(" ").map((p) => p.split(",").map(Number));

describe("tc-radar-chart", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: an image named by the heading and read as its numbers`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("rdr");
      expect(el.dataset.look).toBe(look);
      expect(plot(el).getAttribute("role")).toBe("img");
      expect(read(el)).toBe("Activity overview, Code review 0%, Issues 0%, Pull requests 10%, Commits 90%");
      expect(el.querySelector(".ui-rdr__labels")!.getAttribute("aria-hidden")).toBe("true");
      expect(el.querySelector(".ui-rdr__svg")!.getAttribute("aria-hidden")).toBe("true");
      // One tab stop: the Table button
      expect([...el.querySelectorAll("button, [tabindex]")].map((b) => b.textContent!.trim())).toEqual(["Table"]);
    });
  }

  test("the axes: one per name, clockwise from the top; names at their ends with one series' value over each", async () => {
    const el = await make();
    expect(el.querySelectorAll(".ui-rdr__axis")).toHaveLength(4);
    const labels = [...el.querySelectorAll<HTMLElement>(".ui-rdr__label")];
    expect(labels.map((l) => l.dataset.side)).toEqual(["top", "right", "bottom", "left"]);
    expect(labels.map((l) => l.querySelector(".ui-rdr__name")!.textContent)).toEqual(AXES);
    expect(labels.map((l) => l.querySelector(".ui-rdr__value")?.textContent)).toEqual(["0%", "0%", "10%", "90%"]);
    el.hideValues = true;
    await settle();
    expect(el.querySelector(".ui-rdr__value")).toBeNull();
  });

  test("the scale: 100 for %, else the largest value, or `max`", async () => {
    const el = await make();
    // 100%: Commits (left) reaches 90% of the radius, 31 × 0.9 from the centre at 75
    const left = points(el)[3];
    expect(75 - left[0]).toBeCloseTo(27.9, 1);
    // Pull requests (down): 10%
    expect(points(el)[2][1] - 50).toBeCloseTo(3.1, 1);
    el.unit = "commits";
    await settle();
    expect(75 - points(el)[3][0]).toBeCloseTo(31, 1);
    el.max = 180;
    await settle();
    expect(75 - points(el)[3][0]).toBeCloseTo(15.5, 1);
    expect(read(el)).toContain("Commits 90 commits");
  });

  test("web rings; several series in their own colours, with a legend; null at the centre, said as No data", async () => {
    const el = await fixture<TcRadarChart>(html`<tc-radar-chart heading="Lab practices" grid="web" .max=${5} .axes=${["Testing", "Docs", "Review"]} .series=${THREE}></tc-radar-chart>`);
    expect(el.querySelectorAll(".ui-rdr__ring")).toHaveLength(4);
    expect([...el.querySelectorAll<SVGGElement>(".ui-rdr__series")].map((g) => g.dataset.series)).toEqual(["1", "2", "3"]);
    expect([...el.querySelectorAll(".ui-rdr__key")].map((k) => k.textContent!.trim())).toEqual(["Genomics", "Imaging", "Field ecology"]);
    // Several series: no values on the names
    expect(el.querySelector(".ui-rdr__value")).toBeNull();
    // Imaging has no Review: its point sits at the centre, with no dot (as for a zero)
    expect(points(el, 1)[2]).toEqual([75, 50]);
    expect(el.querySelectorAll(".ui-rdr__series")[1].querySelectorAll(".ui-rdr__dot")).toHaveLength(2);
    expect(read(el)).toContain("Imaging: Testing 3, Docs 4, Review No data");
    // A fourth series isn't drawn
    el.series = [...THREE, { name: "Extra", values: [1, 1, 1] }];
    await settle();
    expect(el.querySelectorAll(".ui-rdr__series")).toHaveLength(3);
  });

  test("the Table button: the same numbers as a table; tc-view-change, preventable", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-view-change", (e) => seen.push((e as CustomEvent<RadarViewChange>).detail.view));
    const toggle = el.querySelector<HTMLButtonElement>(".ui-rdr__toggle")!;
    toggle.click();
    await settle();
    expect(el.view).toBe("table");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(el.querySelector(".ui-rdr__plot")).toBeNull();
    const rows = [...el.querySelectorAll(".ui-rdr__table tbody tr")].map((r) => [...r.children].map((c) => c.textContent));
    expect(rows).toEqual([["Code review", "0%"], ["Issues", "0%"], ["Pull requests", "10%"], ["Commits", "90%"]]);
    expect([...el.querySelectorAll(".ui-rdr__table thead th")].map((c) => c.textContent)).toEqual(["Measure", "Contributions"]);
    el.addEventListener("tc-view-change", (e) => e.preventDefault(), { once: true });
    toggle.click();
    await settle();
    expect(el.view).toBe("table");
    expect(seen).toEqual(["table", "chart"]);
  });

  test("empty: no axes or no series says so, without a Table button", async () => {
    const el = await fixture<TcRadarChart>(html`<tc-radar-chart heading="Nothing yet"></tc-radar-chart>`);
    expect(el.querySelector(".ui-rdr__empty")!.textContent).toBe("No data to show.");
    expect(el.querySelector(".ui-rdr__toggle")).toBeNull();
    el.axes = AXES;
    await settle();
    expect(el.querySelector(".ui-rdr__empty")).not.toBeNull();
  });

  test("narrow: the drawing shrinks to fit; wide, it stops at --tc-rdr-width", async () => {
    const wrap = await fixture(html`<div style="width: 300px"><tc-radar-chart heading="Activity" unit="%" .axes=${AXES} .series=${ONE}></tc-radar-chart></div>`);
    const el = wrap.querySelector("tc-radar-chart")!;
    await settle();
    expect(plot(el).getBoundingClientRect().width).toBeLessThanOrEqual(300);
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth);
    wrap.style.width = "900px";
    await settle();
    expect(plot(el).getBoundingClientRect().width).toBeCloseTo(420, 0);
  });

  test("React wrapper: uncontrolled keeps the view through re-renders; controlled waits for the parent", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(RadarChart, { title: "Activity", unit: "%", axes: AXES, series: ONE, onViewChange: (v) => void seen.push(v), "data-n": n } as React.ComponentProps<typeof RadarChart>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-radar-chart")!;
    expect(el.heading).toBe("Activity");
    el.querySelector<HTMLButtonElement>(".ui-rdr__toggle")!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.view).toBe("table");
    expect(seen).toEqual(["table"]);
    await act(async () => root.render(React.createElement(RadarChart, { title: "Activity", axes: AXES, series: ONE, view: "chart", onViewChange: (v) => void seen.push(v) })));
    await settle();
    const controlled = host.querySelector("tc-radar-chart")!;
    controlled.querySelector<HTMLButtonElement>(".ui-rdr__toggle")!.click();
    await settle();
    expect(seen).toEqual(["table", "table"]);
    expect(controlled.view).toBe("chart");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="display: grid; gap: 16px; padding: 16px; background: var(--tc-surface-base)">
        <tc-radar-chart heading="Activity overview" description="Contributions in 2026" unit="%" .axes=${AXES} .series=${ONE}></tc-radar-chart>
        <tc-radar-chart look="clean" heading="Lab practices" grid="web" .max=${5} .axes=${["Testing", "Docs", "Review"]} .series=${THREE}></tc-radar-chart>
        <tc-radar-chart heading="As a table" view="table" unit="%" .axes=${AXES} .series=${ONE}></tc-radar-chart>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
