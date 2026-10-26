/*
 * <tc-breakdown-chart> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/breakdown-chart";
import { breakdownStatusIcon, type BreakdownDimension, type BreakdownMeasure, type TcBreakdownChart } from "../../src/elements/breakdown-chart";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const records = [
  { year: 2025, team: "Core", points: 3 },
  { year: 2025, team: "Growth", points: 5 },
  { year: 2026, team: "Core", points: 8 },
];
const dimensions: BreakdownDimension[] = [
  { key: "year", label: "Year", values: ["2025", "2026"] },
  { key: "team", label: "Team", values: ["Core", "Growth"] },
];
const measures: BreakdownMeasure[] = [{ key: "points", label: "Points", unit: "points", field: "points" }];
const twoMeasures: BreakdownMeasure[] = [...measures, { key: "count", label: "Tasks", unit: "tasks" }];

const total = (el: Element) => el.querySelector(".ui-bc__total strong")?.textContent;
const chip = (el: Element, name: string) => [...el.querySelectorAll<HTMLButtonElement>(".ui-bc__chip")].find((b) => b.textContent!.trim() === name)!;
const pickerButton = (el: Element, n: number) => el.querySelectorAll<HTMLButtonElement>('[aria-haspopup="listbox"]')[n];
const option = (el: Element, name: string) => [...el.querySelectorAll<HTMLButtonElement>('[role="option"]')].find((b) => b.textContent!.trim() === name)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-breakdown-chart", () => {
  test("the host is the root and the region, named by the heading", async () => {
    const el = await fixture<TcBreakdownChart>(html`<tc-breakdown-chart .records=${records} .dimensions=${dimensions} .measures=${measures}></tc-breakdown-chart>`);
    expect(el.dataset.ui).toBe("bc");
    expect(el.dataset.look).toBe("standard");
    expect(el.getAttribute("role")).toBe("region");
    expect(el.getAttribute("aria-label")).toBe("Workload");
    expect(el.querySelector(".ui-bc__card")).toBeTruthy();
    el.heading = "Points";
    el.look = "clean";
    await settle();
    expect(el.getAttribute("aria-label")).toBe("Points");
    expect(el.querySelector(".ui-bc__card")).toBeNull();
  });

  for (const segment of ["team", "none"]) {
    test(`a numeric slice dimension adds up (segment: ${segment})`, async () => {
      const el = await fixture<TcBreakdownChart>(html`<tc-breakdown-chart .records=${records} .dimensions=${dimensions} .measures=${measures} segment=${segment}></tc-breakdown-chart>`);
      expect(total(el)).toBe("16");
    });
  }

  test("controlled: every picker and the legend report without applying", async () => {
    const el = await fixture<TcBreakdownChart>(html`<tc-breakdown-chart .records=${records} .dimensions=${dimensions} .measures=${twoMeasures}></tc-breakdown-chart>`);
    const seen: unknown[] = [];
    for (const name of ["tc-measure-change", "tc-slice-change", "tc-segment-change", "tc-hidden-change"])
      el.addEventListener(name, (e) => {
        seen.push([name, (e as CustomEvent).detail]);
        e.preventDefault();
      });
    chip(el, "Core").click();
    await settle();
    expect(chip(el, "Core").getAttribute("aria-pressed")).toBe("true");
    pickerButton(el, 0).click();
    await settle();
    option(el, "Tasks").click();
    await settle();
    expect(pickerButton(el, 0).textContent!.trim()).toBe("Points");
    pickerButton(el, 1).click();
    await settle();
    option(el, "Team").click();
    await settle();
    expect(pickerButton(el, 1).textContent!.trim()).toBe("Year");
    expect(seen).toEqual([
      ["tc-hidden-change", { hidden: ["Core"] }],
      ["tc-measure-change", { measure: "count" }],
      ["tc-slice-change", { slice: "team" }],
      // Slicing by the segment's dimension drops the segment
      ["tc-segment-change", { segment: "none" }],
    ]);
  });

  test("picking another segment clears hidden values and reports both", async () => {
    const el = await fixture<TcBreakdownChart>(html`<tc-breakdown-chart .records=${records} .dimensions=${dimensions} .measures=${measures} .hiddenSegments=${["Core"]}></tc-breakdown-chart>`);
    const seen: unknown[] = [];
    el.addEventListener("tc-segment-change", (e) => seen.push((e as CustomEvent).detail));
    el.addEventListener("tc-hidden-change", (e) => seen.push((e as CustomEvent).detail));
    expect(chip(el, "Core").getAttribute("aria-pressed")).toBe("false");
    expect(total(el)).toBe("5");
    pickerButton(el, 2).click();
    await settle();
    option(el, "None").click();
    await settle();
    expect(seen).toEqual([{ segment: "none" }, { hidden: [] }]);
    expect(el.segment).toBe("none");
    expect(el.hiddenSegments).toEqual([]);
    expect(total(el)).toBe("16");
  });

  test("uncontrolled measure follows the picker and reports it", async () => {
    const el = await fixture<TcBreakdownChart>(html`<tc-breakdown-chart .records=${records} .dimensions=${dimensions} .measures=${twoMeasures}></tc-breakdown-chart>`);
    let got = "";
    el.addEventListener("tc-measure-change", (e) => (got = (e as CustomEvent).detail.measure));
    pickerButton(el, 0).click();
    await settle();
    option(el, "Tasks").click();
    await settle();
    expect(got).toBe("count");
    expect(total(el)).toBe("3");
  });

  test("empty measures and dimensions render an empty chart", async () => {
    const a = await fixture<TcBreakdownChart>(html`<tc-breakdown-chart .records=${records} .dimensions=${[]} .measures=${[]}></tc-breakdown-chart>`);
    expect(total(a)).toBe("0");
    const b = await fixture<TcBreakdownChart>(html`<tc-breakdown-chart .records=${[]} .dimensions=${dimensions} .measures=${[]}></tc-breakdown-chart>`);
    expect(total(b)).toBe("0");
  });

  test("Select: picking or Esc returns focus to the button; arrows move; Tab closes", async () => {
    const el = await fixture<TcBreakdownChart>(html`<tc-breakdown-chart .records=${records} .dimensions=${dimensions} .measures=${twoMeasures}></tc-breakdown-chart>`);
    const button = pickerButton(el, 0);
    // The name holds the label and the value (2.5.3)
    const name = button.getAttribute("aria-labelledby")!.split(" ").map((id) => document.getElementById(id)!.textContent).join(" ");
    expect(name).toBe("Measure Points");
    button.click();
    await settle();
    expect(document.activeElement).toBe(option(el, "Points"));
    key(document.activeElement!, "ArrowDown");
    expect(document.activeElement).toBe(option(el, "Tasks"));
    key(document.activeElement!, "Escape");
    await settle();
    expect(el.querySelector('[role="listbox"]')).toBeNull();
    expect(document.activeElement).toBe(button);
    key(button, "ArrowDown");
    await settle();
    expect(el.querySelector('[role="listbox"]')).toBeTruthy();
    option(el, "Tasks").click();
    await settle();
    expect(el.querySelector('[role="listbox"]')).toBeNull();
    expect(document.activeElement).toBe(button);
    expect(button.textContent!.trim()).toBe("Tasks");
    button.click();
    await settle();
    key(document.activeElement!, "Tab");
    await settle();
    expect(el.querySelector('[role="listbox"]')).toBeNull();
  });

  test("a click outside closes an open menu", async () => {
    const el = await fixture<TcBreakdownChart>(html`<tc-breakdown-chart .records=${records} .dimensions=${dimensions} .measures=${twoMeasures}></tc-breakdown-chart>`);
    pickerButton(el, 0).click();
    await settle();
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await settle();
    expect(el.querySelector('[role="listbox"]')).toBeNull();
  });

  test("the hover breakdown opens on focus, isn't a live region, and Esc closes it without moving focus", async () => {
    const el = await fixture<TcBreakdownChart>(html`<tc-breakdown-chart .records=${records} .dimensions=${dimensions} .measures=${measures} segment="team"></tc-breakdown-chart>`);
    const bar = el.querySelector<HTMLButtonElement>(".ui-bc__col")!;
    expect(bar.getAttribute("aria-label")).toBe("2025: 8 points");
    bar.focus();
    await settle();
    const tip = el.querySelector<HTMLElement>(".ui-bc__tooltip")!;
    expect(tip).toBeTruthy();
    expect(tip.getAttribute("role")).toBeNull();
    expect(tip.closest("[aria-live]")).toBeNull();
    expect(bar.getAttribute("aria-describedby")).toBe(tip.id);
    expect([...tip.querySelectorAll(".ui-bc__tip-seg")].map((n) => n.textContent)).toEqual(["Growth", "Core"]);
    key(document.body, "Escape");
    await settle();
    expect(el.querySelector(".ui-bc__tooltip")).toBeNull();
    expect(document.activeElement).toBe(bar);
  });

  test("the table is a named, focusable region only when it scrolls sideways", async () => {
    const narrow = await fixture<HTMLDivElement>(html`<div style="width: 220px"><tc-breakdown-chart heading="Points" .records=${records} .dimensions=${[
      { key: "year", label: "Year", values: ["2025", "2026"] },
      { key: "team", label: "Team", values: ["Core", "Growth", "Platform", "Mobile", "Web", "Infrastructure", "Security"] },
    ]} .measures=${measures} segment="team"></tc-breakdown-chart></div>`);
    await new Promise((r) => setTimeout(r, 100));
    await settle();
    const wrap = narrow.querySelector<HTMLElement>(".ui-bc__table-wrap")!;
    expect(wrap.scrollWidth).toBeGreaterThan(wrap.clientWidth);
    expect(wrap.tabIndex).toBe(0);
    expect(wrap.getAttribute("role")).toBe("region");
    expect(wrap.getAttribute("aria-label")).toBe("Points table");
    const wide = await fixture<TcBreakdownChart>(html`<tc-breakdown-chart .records=${records} .dimensions=${dimensions} .measures=${measures} segment="none"></tc-breakdown-chart>`);
    expect(wide.querySelector(".ui-bc__table-wrap")!.hasAttribute("tabindex")).toBe(false);
  });

  test("an off legend chip keeps readable text and says so by its state; Show all resets", async () => {
    const el = await fixture<TcBreakdownChart>(html`<tc-breakdown-chart .records=${records} .dimensions=${dimensions} .measures=${measures} segment="team" .hiddenSegments=${["Core"]}></tc-breakdown-chart>`);
    expect(chip(el, "Core").getAttribute("aria-pressed")).toBe("false");
    // The last visible segment can't be hidden
    chip(el, "Growth").click();
    await settle();
    expect(el.hiddenSegments).toEqual(["Core"]);
    el.querySelector<HTMLButtonElement>(".ui-bc__reset")!.click();
    await settle();
    expect(el.hiddenSegments).toEqual([]);
    expect(el.querySelector(".ui-bc__reset")).toBeNull();
  });

  test("value icons are cloned under the bars, in the table and the breakdown", async () => {
    const icon = breakdownStatusIcon({ kind: "done", color: "#2f6bff", look: "standard" });
    icon.setAttribute("data-mine", "");
    const dims = [{ ...dimensions[0], icons: { "2025": icon } }, dimensions[1]];
    const el = await fixture<TcBreakdownChart>(html`<tc-breakdown-chart .records=${records} .dimensions=${dims} .measures=${measures}></tc-breakdown-chart>`);
    expect(el.querySelector(".ui-bc__xlabel svg[data-mine]")).toBeTruthy();
    expect(el.querySelector(".ui-bc__row-label svg[data-mine]")).toBeTruthy();
    expect(icon.isConnected).toBe(false);
  });

  test("a status icon without a look of its own is drawn in the chart's look", async () => {
    const dims = [{ ...dimensions[0], icons: { "2025": breakdownStatusIcon({ kind: "todo", color: "#737373" }) } }, dimensions[1]];
    const el = await fixture<TcBreakdownChart>(html`<tc-breakdown-chart look="clean" .records=${records} .dimensions=${dims} .measures=${measures}></tc-breakdown-chart>`);
    const svg = el.querySelector(".ui-bc__row-label svg")!;
    expect([svg.getAttribute("width"), svg.getAttribute("stroke-width"), svg.getAttribute("stroke")]).toEqual(["16", "1.1", "#737373"]);
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-breakdown-chart .records=${records} .dimensions=${dimensions} .measures=${twoMeasures}></tc-breakdown-chart>
      <tc-breakdown-chart look="clean" heading="Clean" .records=${records} .dimensions=${dimensions} .measures=${twoMeasures} .hiddenSegments=${["Core"]}></tc-breakdown-chart>
    </div>`);
    await Promise.all(document.getAnimations().map((a) => a.finished));
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
