/*
 * <tc-chart> in real browsers: a spec drawn as the chart it names with its fields and options, swapping type, what's
 * wrong shown instead of a chart, properties a spec may not set, { url } data, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/chart";
import type { ChartSpecCheck, TcChart } from "../../src/elements/chart";
import type { ChartSpec } from "../../src/elements/internal/chart/spec";
import { Chart } from "../../src/elements/react/chart";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const ROWS = [
  { lab: "Genomics", samples: 182 },
  { lab: "Imaging", samples: 96 },
];
const BAR: ChartSpec = { type: "bar", title: "Samples", data: ROWS, encoding: { x: "lab", y: "samples" }, options: { unit: " samples", animate: false } };

async function make(spec: ChartSpec | null) {
  const wrap = await fixture<HTMLElement>(html`<div style="width: 520px"><tc-chart .spec=${spec}></tc-chart></div>`);
  return wrap.querySelector<TcChart>("tc-chart")!;
}
const drawnChart = async (el: TcChart, tag: string) => {
  await expect.poll(() => el.querySelector(tag), { timeout: 4000 }).not.toBeNull();
  await settle();
  return el.querySelector(tag) as HTMLElement & Record<string, unknown>;
};

describe("tc-chart", () => {
  test("draws the chart the spec names, with its fields, options and title", async () => {
    const el = await make(BAR);
    expect(el.dataset.ui).toBe("cht");
    const bar = await drawnChart(el, "tc-bar-chart");
    expect(bar.heading).toBe("Samples");
    expect(bar.x).toBe("lab");
    expect(bar.unit).toBe(" samples");
    expect(bar.still).toBe(true);
    expect(bar.data).toEqual(ROWS);
  });

  test("a new type swaps the chart; a new spec of the same type updates it in place", async () => {
    const el = await make(BAR);
    const bar = await drawnChart(el, "tc-bar-chart");
    el.spec = { ...BAR, title: "Renamed" };
    await settle();
    await expect.poll(() => bar.heading).toBe("Renamed");
    expect(el.querySelector("tc-bar-chart")).toBe(bar);
    el.spec = { type: "pie", data: ROWS, encoding: { label: "lab", value: "samples" } };
    await drawnChart(el, "tc-pie-chart");
    expect(el.querySelector("tc-bar-chart")).toBeNull();
  });

  test("what's wrong is shown instead of a chart, and reported", async () => {
    const checks: ChartSpecCheck[] = [];
    const el = await make(null);
    el.addEventListener("tc-spec-check", (e) => checks.push((e as CustomEvent<ChartSpecCheck>).detail));
    el.spec = { type: "pie", data: ROWS };
    await expect.poll(() => el.querySelector(".ui-cht__problem")).not.toBeNull();
    expect(el.querySelector('[role="alert"]')!.textContent).toMatch(/This pie chart can't be drawn.*No field "label"/s);
    expect(checks.at(-1)!.valid).toBe(false);
    expect(el.querySelector("tc-pie-chart")).toBeNull();
  });

  test("only properties the chart declares are set – nothing else on the element", async () => {
    const el = await make({ ...BAR, options: { innerHTML: "<img src=x onerror=alert(1)>", onclick: "alert(1)", measured: 9, look: "clean" } });
    const bar = await drawnChart(el, "tc-bar-chart");
    expect(bar.querySelector("img")).toBeNull();
    expect(bar.getAttribute("onclick")).toBeNull();
    expect(bar.measured).not.toBe(9);
    expect(bar.look).toBeUndefined();
  });

  test("{ url } data is fetched, then drawn", async () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(ROWS)], { type: "application/json" }));
    const el = await make({ type: "bar", data: { url }, encoding: { x: "lab", y: "samples" } });
    const bar = await drawnChart(el, "tc-bar-chart");
    expect(bar.data).toEqual(ROWS);
    URL.revokeObjectURL(url);
  });

  test("React wrapper: the spec reaches the element; the check comes back", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    host.style.width = "520px";
    const root = createRoot(host);
    const checks: boolean[] = [];
    await act(async () => root.render(React.createElement(Chart, { spec: BAR, onSpecCheck: (c) => checks.push(c.valid) })));
    const el = host.querySelector<TcChart>("tc-chart")!;
    await drawnChart(el, "tc-bar-chart");
    expect(checks).toEqual([true]);
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: a drawn chart and a refused spec, in both themes", async () => {
    for (const scheme of ["light", "dark"]) {
      const el = await make(BAR);
      await drawnChart(el, "tc-bar-chart");
      const bad = document.createElement("tc-chart") as TcChart;
      el.parentElement!.append(bad);
      bad.spec = { type: "nope", data: [] };
      await expect.poll(() => bad.querySelector(".ui-cht__problem")).not.toBeNull();
      el.parentElement!.style.colorScheme = scheme;
      await finish(el.parentElement!);
      const r = await axe.run(el.parentElement!);
      expect(r.violations.flatMap((v) => v.nodes.map((n) => `${scheme} ${v.id} ${n.html.slice(0, 80)}`))).toEqual([]);
      cleanup();
    }
  });
});
