/*
 * <tc-kpi-chart> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/kpi-chart";
import { niceRange, type KpiIndexChange, type KpiSeries, type TcKpiChart } from "../../src/elements/kpi-chart";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { KpiChart } from "../../src/elements/react/kpi-chart";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const labels = ["Mar 3", "Mar 4", "Mar 5"];
const one: KpiSeries[] = [{ label: "Subs", color: "#2f6bff", values: [3, 5, 4] }];
const two: KpiSeries[] = [
  { label: "Paid", color: "red", values: [1, 2, 3] },
  { label: "Organic", color: "blue", values: [3, 2, 1] },
];
const date = (el: Element) => el.querySelector(".ui-kpi__date")!.textContent;
const plotOf = (el: Element) => el.querySelector<HTMLElement>(".ui-kpi__plot")!;
const key = async (target: Element, k: string) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  await settle();
};

describe("tc-kpi-chart", () => {
  test("the host is the root: a tray in Standard, the card in Clean", async () => {
    for (const look of ["standard", "clean"] as const) {
      const el = await fixture<TcKpiChart>(html`<tc-kpi-chart look=${look} heading="Revenue" value="$9k" .labels=${labels} .series=${one} footer="Last 3 days"></tc-kpi-chart>`);
      expect(el.dataset.ui).toBe("kpi");
      expect(el.dataset.look).toBe(look);
      // The header comes first: on the tray above the card in Standard, the card's first row in Clean
      expect(el.querySelector(":scope > .tc-head:first-child h3.tc-head__title")!.textContent).toBe("Revenue");
      expect(!!el.querySelector(":scope > .ui-kpi__body")).toBe(look === "clean");
      expect(!!el.querySelector(":scope > .ui-kpi__card > .ui-kpi__footer")).toBe(look === "standard");
      expect(el.querySelector(".ui-kpi__footer")!.textContent).toBe("Last 3 days");
      cleanup();
    }
  });

  test("niceRange always includes 0 and halves cleanly", () => {
    expect(niceRange([])).toEqual([0, 2]);
    expect(niceRange([NaN, Infinity])).toEqual([0, 2]);
    expect(niceRange([4, 30, 12])).toEqual([0, 30]);
    expect(niceRange([-3, -10])).toEqual([-10, 0]);
    const [min, max] = niceRange([-3, 10]);
    expect(min).toBeLessThanOrEqual(-3);
    expect(max).toBeGreaterThanOrEqual(10);
  });

  test("empty data renders without NaN", async () => {
    const el = await fixture<TcKpiChart>(html`<tc-kpi-chart heading="Revenue" value="$0" .labels=${[]} .series=${[{ label: "A", color: "red", values: [] }]}></tc-kpi-chart>`);
    expect(el.innerHTML).not.toContain("NaN");
  });

  test("negative values stay inside the plot", async () => {
    const el = await fixture<TcKpiChart>(html`<tc-kpi-chart heading="Net" value="$1" .labels=${["a", "b", "c"]} .series=${[{ label: "A", color: "red", values: [-8, 3, 12] }]}></tc-kpi-chart>`);
    for (const p of el.querySelector("polyline")!.getAttribute("points")!.split(" ")) {
      const y = Number(p.split(",")[1]);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(100);
    }
  });

  test("delta: signed, formatted and toned; none for 0", async () => {
    const el = await fixture<TcKpiChart>(html`<tc-kpi-chart heading="R" value="$9k" delta="-1200" .labels=${labels} .series=${one}></tc-kpi-chart>`);
    const d = el.querySelector(".ui-kpi__delta")!;
    expect(d.textContent).toBe("−1.2k");
    expect(d.getAttribute("data-trend")).toBe("down");
    el.delta = 0;
    await settle();
    expect(el.querySelector(".ui-kpi__delta")).toBeNull();
  });

  test("delta: data-tone is good for a rise; lowerIsBetter turns a drop good and a rise bad; deltaFormat formats it alone", async () => {
    const el = await fixture<TcKpiChart>(html`<tc-kpi-chart heading="Latency" value="420ms" delta="-12" .labels=${labels} .series=${one}></tc-kpi-chart>`);
    const d = () => el.querySelector(".ui-kpi__delta")!;
    expect(d().getAttribute("data-tone")).toBe("bad");
    el.lowerIsBetter = true;
    await settle();
    expect(d().getAttribute("data-trend")).toBe("down");
    expect(d().getAttribute("data-tone")).toBe("good");
    // Green in both looks: the tone, not the sign, picks the colour
    const good = getComputedStyle(d()).color;
    el.delta = 12;
    await settle();
    expect(d().getAttribute("data-tone")).toBe("bad");
    expect(getComputedStyle(d()).color).not.toBe(good);
    el.removeAttribute("lower-is-better");
    el.setAttribute("lower-is-better", "");
    await settle();
    expect(el.lowerIsBetter).toBe(true);
    // The headline is money, the change a percentage
    el.format = (n) => `$${n}`;
    el.deltaFormat = (n) => `${n.toFixed(1)}%`;
    el.delta = 8.6;
    await settle();
    expect(d().textContent).toBe("+8.6%");
    expect(el.querySelector(".ui-kpi__yaxis span")!.textContent).toMatch(/^\$/);
  });

  test("series colours are styles, so tokens resolve; an unset colour takes the --tc-chart-N token", async () => {
    const series: KpiSeries[] = [
      { label: "A", color: "var(--test-line)", values: [1, 2, 3] },
      { label: "B", values: [3, 2, 1] },
    ];
    const el = await fixture<TcKpiChart>(html`<tc-kpi-chart style="--test-line: rgb(1, 2, 3); --tc-chart-2: rgb(4, 5, 6)" heading="R" value="1" .labels=${labels} .series=${series} default-index="1"></tc-kpi-chart>`);
    const [a, b] = el.querySelectorAll<SVGPolylineElement>(".ui-kpi__lines polyline");
    expect(a.hasAttribute("stroke")).toBe(false);
    expect(getComputedStyle(a).stroke).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(b).stroke).toBe("rgb(4, 5, 6)");
    const dots = el.querySelectorAll<HTMLElement>(".ui-kpi__dot");
    expect(getComputedStyle(dots[1]).backgroundColor).toBe("rgb(4, 5, 6)");
    const legend = el.querySelectorAll<SVGLineElement>(".ui-kpi__legend line");
    expect(getComputedStyle(legend[0]).stroke).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(legend[1]).stroke).toBe("rgb(4, 5, 6)");
  });

  test("the React wrapper passes lowerIsBetter, deltaFormat and token colours through", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () =>
      root.render(
        React.createElement(KpiChart, {
          title: "Cost",
          value: "$1.2k",
          delta: -4,
          lowerIsBetter: true,
          deltaFormat: (n: number) => `${n}%`,
          labels,
          series: [{ label: "Spend", color: "var(--tc-chart-1)", values: [3, 2, 1] }],
        }),
      ),
    );
    await settle();
    const d = host.querySelector(".ui-kpi__delta")!;
    expect(d.textContent).toBe("−4%");
    expect(d.getAttribute("data-tone")).toBe("good");
    expect(host.querySelector("polyline")!.getAttribute("style")).toContain("var(--tc-chart-1)");
    act(() => root.unmount());
  });

  test("controlled: preventDefault keeps the index; the change is still reported", async () => {
    const el = await fixture<TcKpiChart>(html`<tc-kpi-chart heading="Revenue" value="$9k" .labels=${labels} .series=${one} .index=${1}></tc-kpi-chart>`);
    const seen: (number | null)[] = [];
    el.addEventListener("tc-index-change", (e) => {
      e.preventDefault();
      seen.push((e as CustomEvent<KpiIndexChange>).detail.index);
    });
    await key(plotOf(el), "ArrowRight");
    expect(seen).toEqual([2]);
    expect(el.index).toBe(1);
    expect(date(el)).toBe("Mar 4");
    el.index = 2;
    await settle();
    expect(date(el)).toBe("Mar 5");
  });

  test("index null with no resting point hides the tooltip", async () => {
    const el = await fixture<TcKpiChart>(html`<tc-kpi-chart heading="Revenue" value="$9k" .labels=${labels} .series=${one} .index=${1}></tc-kpi-chart>`);
    expect(el.querySelector(".ui-kpi__tooltip")!.hasAttribute("data-open")).toBe(true);
    el.index = null;
    await settle();
    expect(el.querySelector(".ui-kpi__tooltip")!.hasAttribute("data-open")).toBe(false);
  });

  test("uncontrolled: keys move the point and report it; leaving rests on defaultIndex", async () => {
    const el = await fixture<TcKpiChart>(html`<tc-kpi-chart heading="Revenue" value="$9k" .labels=${labels} .series=${one} default-index="0"></tc-kpi-chart>`);
    const onChange = vi.fn();
    el.addEventListener("tc-index-change", (e) => onChange((e as CustomEvent<KpiIndexChange>).detail.index));
    expect(date(el)).toBe("Mar 3");
    await key(plotOf(el), "ArrowRight");
    expect(onChange).toHaveBeenLastCalledWith(1);
    expect(date(el)).toBe("Mar 4");
    await key(plotOf(el), "Escape");
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(date(el)).toBe("Mar 3");
  });

  test("keyboard: ← from nothing starts at the end, Home and End jump", async () => {
    const el = await fixture<TcKpiChart>(html`<tc-kpi-chart heading="Revenue" value="$9k" .labels=${labels} .series=${one}></tc-kpi-chart>`);
    const plot = plotOf(el);
    expect(plot.tabIndex).toBe(0);
    await key(plot, "ArrowLeft");
    expect(el.index).toBe(2);
    await key(plot, "Home");
    expect(el.index).toBe(0);
    await key(plot, "ArrowLeft");
    expect(el.index).toBe(0);
    await key(plot, "End");
    expect(el.index).toBe(2);
    await key(plot, "ArrowRight");
    expect(el.index).toBe(2);
  });

  test("each line has its own stroke pattern and the legend names them (1.4.1)", async () => {
    const el = await fixture<TcKpiChart>(html`<tc-kpi-chart heading="Visits" value="6" .labels=${["a", "b", "c"]} .series=${two}></tc-kpi-chart>`);
    const dashes = [...el.querySelectorAll(".ui-kpi__lines polyline")].map((p) => p.getAttribute("stroke-dasharray"));
    expect(new Set(dashes).size).toBe(2);
    const legend = el.querySelector(".ui-kpi__legend")!;
    expect(legend.textContent).toContain("Paid");
    expect(legend.textContent).toContain("Organic");
    el.legend = false;
    await settle();
    expect(el.querySelector(".ui-kpi__legend")).toBeNull();
  });

  test("the tooltip is not a live region; arrow keys speak through a status mounted from the start", async () => {
    const el = await fixture<TcKpiChart>(html`<tc-kpi-chart heading="Visits" value="6" .labels=${["a", "b", "c"]} .series=${two}></tc-kpi-chart>`);
    const tooltip = el.querySelector(".ui-kpi__tooltip")!;
    expect(tooltip.getAttribute("role")).toBeNull();
    expect(tooltip.getAttribute("aria-hidden")).toBe("true");
    const status = el.querySelector('[role="status"]')!;
    expect(status.textContent).toBe("");
    await key(plotOf(el), "End");
    expect(status.textContent).toBe("c: Paid 3, Organic 1");
    await key(plotOf(el), "Escape");
    expect(status.textContent).toBe("");
  });

  test("hover opens the tooltip; Esc anywhere closes it without moving focus (1.4.13)", async () => {
    const button = document.createElement("button");
    document.body.append(button);
    button.focus();
    const el = await fixture<TcKpiChart>(html`<tc-kpi-chart heading="Visits" value="6" .labels=${["a", "b", "c"]} .series=${two}></tc-kpi-chart>`);
    const box = plotOf(el).getBoundingClientRect();
    plotOf(el).dispatchEvent(new PointerEvent("pointermove", { clientX: box.left + box.width - 1, clientY: box.top + 10, bubbles: true }));
    await settle();
    expect(el.querySelector(".ui-kpi__tooltip[data-open]")).toBeTruthy();
    expect(el.index).toBe(2);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await settle();
    expect(el.querySelector(".ui-kpi__tooltip[data-open]")).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  test("a pointer over a plot with no width doesn't loop on NaN", async () => {
    const el = await fixture<TcKpiChart>(html`<div style="width: 0"><tc-kpi-chart heading="Visits" value="6" .labels=${["a", "b", "c"]} .series=${two}></tc-kpi-chart></div>`);
    const chart = el.querySelector("tc-kpi-chart")!;
    chart.querySelector(".ui-kpi__plot")!.dispatchEvent(new PointerEvent("pointermove", { clientX: 10, bubbles: true }));
    await settle();
    expect(chart.querySelector(".ui-kpi__tooltip[data-open]")).toBeNull();
  });

  test("fill: off by default; on, the card drops its max-width and the plot row grows", async () => {
    for (const look of ["standard", "clean"] as const) {
      const wrap = await fixture(html`<div style="display: grid; grid-template-rows: 500px; width: 800px">
        <tc-kpi-chart look=${look} heading="Revenue" value="$9k" .labels=${labels} .series=${one}></tc-kpi-chart>
      </div>`);
      const el = wrap.querySelector<TcKpiChart>("tc-kpi-chart")!;
      expect(el.hasAttribute("data-fill")).toBe(false);
      expect(getComputedStyle(el).maxWidth).toBe("460px");
      const plotBefore = plotOf(el).getBoundingClientRect().height;
      el.fill = true;
      await settle();
      expect(el.hasAttribute("data-fill")).toBe(true);
      expect(getComputedStyle(el).maxWidth).toBe("none");
      expect(plotOf(el).getBoundingClientRect().height).toBeGreaterThan(plotBefore + 100);
      cleanup();
    }
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-kpi-chart heading="Visits" value="6" delta="2" footer="Last 3 days" .labels=${["a", "b", "c"]} .series=${two} default-index="1"></tc-kpi-chart>
      <tc-kpi-chart look="clean" heading="Clean" value="6" delta="-2" footer="Last 3 days" .labels=${["a", "b", "c"]} .series=${two} default-index="1"></tc-kpi-chart>
    </div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
