/*
 * <tc-gap-exposure> in real browsers: the stats, the exposure panel, rows with severity, coverage, owner and
 * investment, grouping by priority or severity, the uncovered-only switch, the keyboard, controlled use, the React
 * wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/gap-exposure";
import type { ExposureGap, GapFilterChange, GapGroupBy, GapGroupChange, GapOpen, TcGapExposure } from "../../src/elements/gap-exposure";
import { GapExposure } from "../../src/elements/react/gap-exposure";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

/** g1 critical covered · g2 high uncovered (exposure) · g3 medium uncovered · g4 critical uncovered (exposure) · g5 low covered, no priority */
const GAPS: ExposureGap[] = [
  { id: "g1", text: "Learning rule unproven.", severity: "critical", item: "Neuromorphic", priority: 1, work: 1, owner: "Elena Castellanos", budget: 900_000, fte: 1.2 },
  { id: "g2", text: "Endurance data missing.", severity: "high", item: "Neuromorphic", priority: 1, work: 0, owner: "Jonah Tran" },
  { id: "g3", text: "No sparsity theory.", severity: "medium", item: "Neuromorphic", priority: 1 },
  { id: "g4", text: "No flood–grid dataset.", severity: "critical", item: "Climate", priority: 2, work: 0, owner: "Arjun Mehta" },
  { id: "g5", text: "Sensor drift unknown.", severity: "low", item: "Edge AI", work: 2, fte: 0.3 },
];

const row = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`.ui-gexp__groups [data-row="${id}"]`)!;
const ids = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-gexp__groups [data-row]")].map((r) => r.dataset.row);
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard", groupBy: GapGroupBy = "priority") =>
  fixture<TcGapExposure>(html`<tc-gap-exposure look=${look} description="Every open gap." .gaps=${GAPS} group-by=${groupBy}></tc-gap-exposure>`);

describe("tc-gap-exposure", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: stats, the exposure panel and rows grouped by priority, one tab stop per list`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("gexp");
      expect(el.dataset.look).toBe(look);
      const stats = [...el.querySelectorAll(".ui-gexp__stat")].map((s) => `${s.querySelector("dt")!.textContent} ${s.querySelector("dd")!.textContent}`);
      expect(stats).toEqual(["Open 5", "Uncovered 3", "Exposure 2"]);
      // Exposure: severe and uncovered, by priority
      expect([...el.querySelectorAll<HTMLElement>(".ui-gexp__exposure [data-row]")].map((r) => r.dataset.row)).toEqual(["g2", "g4"]);
      // Grouped by priority, severity first within a group; no priority last
      expect([...el.querySelectorAll(".ui-gexp__group-name")].map((n) => n.textContent)).toEqual(["Top priority", "High", "No priority"]);
      expect(ids(el)).toEqual(["g1", "g2", "g3", "g4", "g5"]);
      expect(el.querySelectorAll('.ui-gexp__groups [data-row][tabindex="0"]')).toHaveLength(1);
      expect(el.querySelectorAll('.ui-gexp__exposure [data-row][tabindex="0"]')).toHaveLength(1);
    });
  }

  test("rows: severity in words with a mark, coverage, owner initials and compact investment", async () => {
    const el = await make();
    const g1 = row(el, "g1");
    expect(g1.querySelector(".ui-gexp__sev")!.textContent).toBe("Critical");
    expect(g1.querySelector(".ui-gexp__mark")).toBeTruthy();
    expect(g1.querySelector(".ui-gexp__cov")!.textContent).toBe("1 in work");
    expect(row(el, "g2").querySelector(".ui-gexp__cov")!.textContent).toBe("No work");
    expect(g1.querySelector(".ui-gexp__owner")!.textContent).toContain("EC");
    expect(g1.querySelector(".ui-gexp__money")!.textContent).toBe("$900K · 1.2 FTE invested");
    expect(row(el, "g5").querySelector(".ui-gexp__money")!.textContent).toBe("0.3 FTE invested");
    expect(row(el, "g3").querySelector(".ui-gexp__money")).toBeNull();
    expect(g1.textContent!.replace(/\s+/g, " ")).toContain("Priority 1: Neuromorphic");
    el.severityLabels = { critical: "Severe" };
    el.currency = "EUR";
    el.locale = "en";
    await settle();
    expect(row(el, "g1").querySelector(".ui-gexp__sev")!.textContent).toBe("Severe");
    expect(row(el, "g1").querySelector(".ui-gexp__money")!.textContent).toBe("€900K · 1.2 FTE invested");
  });

  test("group by severity and uncovered only: the controls fire cancelable events and reshape the list", async () => {
    const el = await make();
    const seen: unknown[] = [];
    el.addEventListener("tc-group-change", (e) => seen.push((e as CustomEvent<GapGroupChange>).detail.groupBy));
    el.addEventListener("tc-filter-change", (e) => seen.push((e as CustomEvent<GapFilterChange>).detail.uncoveredOnly));
    el.querySelector<HTMLButtonElement>('[data-group="severity"]')!.click();
    await settle();
    expect(el.groupBy).toBe("severity");
    expect([...el.querySelectorAll(".ui-gexp__group-head .ui-gexp__sev")].map((s) => s.textContent)).toEqual(["Critical", "High", "Medium", "Low"]);
    expect(ids(el)).toEqual(["g1", "g4", "g2", "g3", "g5"]);
    const toggle = el.querySelector<HTMLButtonElement>(".ui-gexp__toggle")!;
    toggle.click();
    await settle();
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    expect(el.hasAttribute("uncovered-only")).toBe(true);
    expect(ids(el)).toEqual(["g4", "g2", "g3"]);
    expect(seen).toEqual(["severity", true]);
    // The group header counts what's uncovered
    el.uncoveredOnly = false;
    el.groupBy = "priority";
    await settle();
    expect(el.querySelector(".ui-gexp__group-head")!.textContent!.replace(/\s+/g, " ")).toContain("2 uncovered");
  });

  test("keyboard: each list is one tab stop with ↑ ↓ Home End; Enter or a click fires tc-open", async () => {
    const el = await make();
    const opened: string[] = [];
    el.addEventListener("tc-open", (e) => opened.push((e as CustomEvent<GapOpen>).detail.id));
    row(el, "g1").focus();
    key(row(el, "g1"), "ArrowDown");
    await expect.poll(() => document.activeElement?.getAttribute("data-row")).toBe("g2");
    key(document.activeElement!, "ArrowDown");
    await expect.poll(() => document.activeElement?.getAttribute("data-row")).toBe("g3");
    key(document.activeElement!, "ArrowDown");
    await expect.poll(() => document.activeElement?.getAttribute("data-row")).toBe("g4");
    key(document.activeElement!, "End");
    await expect.poll(() => document.activeElement?.getAttribute("data-row")).toBe("g5");
    key(document.activeElement!, "Home");
    await expect.poll(() => document.activeElement?.getAttribute("data-row")).toBe("g1");
    // The exposure panel is its own list
    const exp = el.querySelector<HTMLButtonElement>('.ui-gexp__exposure [data-row="g2"]')!;
    exp.focus();
    key(exp, "ArrowDown");
    await expect.poll(() => document.activeElement?.closest(".ui-gexp__exposure") && document.activeElement?.getAttribute("data-row")).toBe("g4");
    (document.activeElement as HTMLElement).click();
    row(el, "g3").click();
    expect(opened).toEqual(["g4", "g3"]);
  });

  test("controlled: preventDefault() keeps the grouping and the filter; no exposure, no panel; empty states", async () => {
    const el = await make();
    el.addEventListener("tc-group-change", (e) => e.preventDefault());
    el.addEventListener("tc-filter-change", (e) => e.preventDefault());
    el.querySelector<HTMLButtonElement>('[data-group="severity"]')!.click();
    el.querySelector<HTMLButtonElement>(".ui-gexp__toggle")!.click();
    await settle();
    expect(el.groupBy).toBe("priority");
    expect(el.uncoveredOnly).toBe(false);
    el.gaps = GAPS.map((g) => ({ ...g, work: 1 }));
    await settle();
    expect(el.querySelector(".ui-gexp__exposure")).toBeNull();
    expect(el.querySelector(".ui-gexp__stat[data-alert]")).toBeNull();
    el.gaps = [];
    await settle();
    expect(el.querySelector(".ui-gexp__empty")!.textContent).toBe("No gaps to show.");
  });

  test("narrow: the investment goes and rows stack without scrolling sideways", async () => {
    const wrap = await fixture(html`<div style="width: 380px"><tc-gap-exposure .gaps=${GAPS}></tc-gap-exposure></div>`);
    const el = wrap.querySelector("tc-gap-exposure")!;
    await settle();
    expect(getComputedStyle(row(el, "g1").querySelector(".ui-gexp__c-money")!).display).toBe("none");
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
  });

  test("React wrapper: uncontrolled grouping survives re-renders; controlled filter stays; onOpen gets the gap", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(GapExposure, {
        title: "Gaps",
        gaps: GAPS,
        uncoveredOnly: false,
        onUncoveredOnlyChange: (u) => void seen.push(u),
        onGroupByChange: (g) => void seen.push(g),
        onOpen: (id, gap) => void seen.push([id, gap.text]),
        "data-n": n,
      } as React.ComponentProps<typeof GapExposure>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-gap-exposure")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Gaps");
    el.querySelector<HTMLButtonElement>('[data-group="severity"]')!.click();
    el.querySelector<HTMLButtonElement>(".ui-gexp__toggle")!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.groupBy).toBe("severity");
    expect(el.uncoveredOnly).toBe(false);
    row(el, "g2").click();
    expect(seen).toEqual(["severity", true, ["g2", "Endurance data missing."]]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-gap-exposure description="Every open gap." .gaps=${GAPS}></tc-gap-exposure>
        <tc-gap-exposure look="clean" group-by="severity" .gaps=${GAPS}></tc-gap-exposure>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
