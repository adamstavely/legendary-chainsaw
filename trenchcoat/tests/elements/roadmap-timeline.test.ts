/*
 * <tc-roadmap-timeline> in real browsers: lanes, bars, milestones, the Today line, dependency arrows (late ones
 * marked), the scale switch, the grid's keys, selection and its details, an empty chart, the React wrapper and axe in
 * both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/roadmap-timeline";
import { dayNumber, type RoadmapItem, type RoadmapLane, type RoadmapSelectedChange, type TcRoadmapTimeline } from "../../src/elements/roadmap-timeline";
import { RoadmapTimeline } from "../../src/elements/react/roadmap-timeline";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const LANES: RoadmapLane[] = [
  { id: "a", label: "Sensors", owner: "Marine lab" },
  { id: "b", label: "Portal" },
];
const ITEMS: RoadmapItem[] = [
  { id: "p1", lane: "a", label: "Prototype", start: "2027-01-11", end: "2027-02-26", status: "done" },
  { id: "p2", lane: "a", label: "Field trial", start: "2027-03-01", end: "2027-05-14", status: "active", progress: 0.5, dependsOn: ["p1"] },
  { id: "q1", lane: "b", label: "Schema", start: "2027-01-18", end: "2027-03-12", status: "done" },
  { id: "q2", lane: "b", label: "Ingest", start: "2027-03-08", end: "2027-05-21", status: "at-risk", dependsOn: ["q1"] },
  { id: "q3", lane: "b", label: "Launch", start: "2027-06-15", milestone: true, dependsOn: ["q2"] },
];
const make = (look = "standard", extra: Partial<TcRoadmapTimeline> = {}) =>
  fixture<TcRoadmapTimeline>(html`<tc-roadmap-timeline look=${look} locale="en-GB" heading="Plan" today="2027-04-07" .lanes=${LANES} .items=${ITEMS} .scale=${extra.scale ?? "month"}></tc-roadmap-timeline>`);
const cells = (el: Element) => [...el.querySelectorAll<HTMLElement>('[role="gridcell"][data-item]')];
const cell = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-item="${id}"]`)!;
const key = (t: Element, k: string, init: KeyboardEventInit = {}) => t.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();

describe("tc-roadmap-timeline", () => {
  test("dayNumber reads calendar days and refuses others", () => {
    expect(dayNumber("1970-01-02")).toBe(1);
    expect(dayNumber("2027-03-01") - dayNumber("2027-02-28")).toBe(1);
    expect(Number.isNaN(dayNumber("soon"))).toBe(true);
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a grid with a row per lane, cells in date order, statuses as words and marks, one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("rdm");
      expect(el.dataset.look).toBe(look);
      const grid = el.querySelector('[role="grid"]')!;
      expect(grid.getAttribute("aria-labelledby")).toBe(el.querySelector(".tc-head__title")!.id);
      expect([...el.querySelectorAll('[role="rowheader"]')].map(text)).toEqual(["Sensors Marine lab", "Portal"]);
      expect(cells(el).map((c) => c.dataset.item)).toEqual(["p1", "p2", "q1", "q2", "q3"]);
      expect(cell(el, "q2").getAttribute("aria-label")).toBe("Ingest, 8 Mar to 21 May 2027, At risk");
      expect(cell(el, "p2").getAttribute("aria-label")).toContain("50% done");
      expect(cell(el, "q3").getAttribute("aria-label")).toMatch(/^Launch, milestone, 15 Jun 2027, Planned$/);
      expect(cells(el).filter((c) => c.tabIndex === 0)).toHaveLength(1);
      expect([...el.querySelectorAll(".ui-rdm__key")].map(text)).toEqual(["Planned", "Active", "Done", "At risk", "Milestone"]);
    });
  }

  test("geometry: bars from start to end, later work further right, Today on its day, progress filled", async () => {
    const el = await make();
    const left = (id: string) => parseFloat(cell(el, id).style.left);
    const width = (id: string) => parseFloat(cell(el, id).style.width);
    expect(left("p2")).toBeGreaterThan(left("p1"));
    // 1 Mar to 14 May is 75 days at 5 px a day
    expect(width("p2")).toBe(75 * 5);
    expect(parseFloat(el.querySelector<HTMLElement>(".ui-rdm__fill")!.style.width)).toBe(100);
    expect(el.querySelector<HTMLElement>(`[data-item="p2"] .ui-rdm__fill`)!.style.width).toBe("50%");
    const today = parseFloat(el.querySelector<HTMLElement>(".ui-rdm__today")!.style.left);
    expect(today).toBeGreaterThan(left("p2"));
    expect(today).toBeLessThan(left("p2") + width("p2"));
    expect(text(el.querySelector(".ui-rdm__today-label"))).toBe("Today");
  });

  test("without `today`, Today is the reader's own calendar day, early or late in it", async () => {
    const line = (el: Element) => parseFloat(el.querySelector<HTMLElement>(".ui-rdm__today")!.style.left);
    const set = await make();
    const want = line(set);
    // Just after midnight and just before it, local time: a day either side of UTC in most places
    for (const at of [new Date(2027, 3, 7, 0, 20), new Date(2027, 3, 7, 23, 40)]) {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(at);
      try {
        const el = await fixture<TcRoadmapTimeline>(html`<tc-roadmap-timeline locale="en-GB" heading="Plan" .lanes=${LANES} .items=${ITEMS}></tc-roadmap-timeline>`);
        expect(line(el)).toBe(want);
      } finally {
        vi.useRealTimers();
      }
    }
  });

  test("dependencies: an arrow per link; one whose follower starts before it ends is late", async () => {
    const el = await make();
    const deps = [...el.querySelectorAll(".ui-rdm__dep")];
    expect(deps).toHaveLength(3);
    // Ingest (8 Mar) starts before Schema ends (12 Mar)
    expect(deps.filter((d) => d.hasAttribute("data-late"))).toHaveLength(1);
  });

  test("scale: Weeks, Months, Quarters change the drawing's width; tc-scale-change is cancelable", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-scale-change", (e) => seen.push((e as CustomEvent).detail.scale));
    const widthOf = () => parseFloat(getComputedStyle(el.querySelector(".ui-rdm__scroll")!).getPropertyValue("--rdm-w"));
    const month = widthOf();
    const opt = (label: string) => [...el.querySelectorAll<HTMLButtonElement>(".ui-rdm__scale-opt")].find((b) => text(b) === label)!;
    opt("Weeks").click();
    await settle();
    expect(el.scale).toBe("week");
    expect(widthOf()).toBeGreaterThan(month);
    expect(opt("Weeks").getAttribute("aria-pressed")).toBe("true");
    el.addEventListener("tc-scale-change", (e) => e.preventDefault(), { once: true });
    opt("Quarters").click();
    await settle();
    expect(el.scale).toBe("week");
    expect(seen).toEqual(["week", "quarter"]);
  });

  test("keys: ← → along a lane, ↑ ↓ to the nearest in the next lane, Home / End; Enter selects and opens details", async () => {
    const el = await make();
    const changes: RoadmapSelectedChange[] = [];
    el.addEventListener("tc-selected-change", (e) => changes.push((e as CustomEvent<RoadmapSelectedChange>).detail));
    cell(el, "p1").focus();
    key(cell(el, "p1"), "ArrowRight");
    await settle();
    expect(document.activeElement).toBe(cell(el, "p2"));
    key(cell(el, "p2"), "ArrowDown");
    await settle();
    expect(document.activeElement).toBe(cell(el, "q2"));
    key(cell(el, "q2"), "End");
    await settle();
    expect(document.activeElement).toBe(cell(el, "q3"));
    key(cell(el, "q3"), "Home", { ctrlKey: true });
    await settle();
    expect(document.activeElement).toBe(cell(el, "p1"));
    key(cell(el, "p1"), "ArrowDown");
    await settle();
    key(document.activeElement!, "ArrowRight");
    await settle();
    key(document.activeElement!, "Enter");
    await settle();
    expect(el.selected).toBe("q2");
    expect(changes[0].item!.label).toBe("Ingest");
    const detail = el.querySelector(".ui-rdm__detail")!;
    expect(text(detail.querySelector("h4"))).toBe("Ingest");
    const fact = (term: string) => text([...detail.querySelectorAll("dt")].find((d) => text(d) === term)!.nextElementSibling);
    expect(fact("Length")).toBe("75 days");
    expect(fact("Waits for")).toBe("Schema");
    expect(fact("Blocks")).toBe("Launch");
    expect(text(detail.querySelector(".ui-rdm__warn"))).toBe("Starts before Schema ends.");
    // A link goes to that piece of work
    [...detail.querySelectorAll<HTMLButtonElement>(".ui-rdm__link")].find((b) => text(b) === "Launch")!.click();
    await settle();
    expect(el.selected).toBe("q3");
    key(cell(el, "q3"), "Escape");
    await settle();
    expect(el.selected).toBeNull();
    // Prevented, the selection stays
    el.addEventListener("tc-selected-change", (e) => e.preventDefault(), { once: true });
    cell(el, "p1").click();
    await settle();
    expect(el.selected).toBeNull();
  });

  test("Close returns focus to the piece of work; an empty chart says so", async () => {
    const el = await make();
    cell(el, "p2").click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-rdm__close")!.click();
    await settle();
    expect(el.selected).toBeNull();
    expect(document.activeElement).toBe(cell(el, "p2"));
    const empty = await fixture<TcRoadmapTimeline>(html`<tc-roadmap-timeline></tc-roadmap-timeline>`);
    expect(text(empty.querySelector(".ui-rdm__empty"))).toBe("Nothing on the roadmap yet.");
  });

  test("React wrapper: uncontrolled selection survives re-renders; controlled scale stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const picked: (string | null)[] = [];
    const scales: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(RoadmapTimeline, {
        title: "Ours",
        locale: "en-GB",
        today: "2027-04-07",
        lanes: LANES,
        items: ITEMS,
        scale: "month",
        onScaleChange: (s) => void scales.push(s),
        onSelectedChange: (id) => void picked.push(id),
        "data-n": n,
      } as React.ComponentProps<typeof RoadmapTimeline>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-roadmap-timeline")!;
    expect(text(el.querySelector(".tc-head__title"))).toBe("Ours");
    cell(el, "q1").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.selected).toBe("q1");
    expect(picked).toEqual(["q1"]);
    el.querySelector<HTMLButtonElement>(".ui-rdm__scale-opt")!.click();
    await settle();
    expect(scales).toEqual(["week"]);
    expect(el.scale).toBe("month");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-roadmap-timeline locale="en-GB" heading="Plan" today="2027-04-07" selected="q2" .lanes=${LANES} .items=${ITEMS}></tc-roadmap-timeline>
        <tc-roadmap-timeline look="clean" heading="Plan by week" scale="week" today="2027-04-07" .lanes=${LANES} .items=${ITEMS}></tc-roadmap-timeline>
        <tc-roadmap-timeline heading="Empty"></tc-roadmap-timeline>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
