/*
 * <tc-mission-control> in real browsers: the heading and its filter, "Since you looked" counted in words, the tree and
 * the inbox it composes, one filter for all three (tc-filter-change and preventDefault), the tree filter keeping the
 * way down, narrow layout with what needs you first, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/mission-control";
import { filterAgentTree, type MissionDecision, type MissionEvent, type MissionFilterChange, type TcMissionControl } from "../../src/elements/mission-control";
import type { TreeAgent } from "../../src/elements/agent-tree";
import type { TcDecisionInbox } from "../../src/elements/decision-inbox";
import type { TcSegmentedControl } from "../../src/elements/segmented-control";
import { MissionControl } from "../../src/elements/react/mission-control";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const T = Date.UTC(2026, 10, 14, 6, 0);
const MIN = 60_000;
const ROOT: TreeAgent = {
  id: "lead",
  name: "Notice lead",
  task: "Prepare the winter notice",
  status: "running",
  started: T - 90 * MIN,
  children: [
    { id: "planner", name: "Planner", task: "List the stops", status: "done", started: T - 80 * MIN, ended: T - 60 * MIN },
    { id: "scheduler", name: "Scheduler", task: "Draft timetables", status: "waiting", ask: "Publish the earlier run?", started: T - 50 * MIN },
    { id: "translator", name: "Translator", task: "Translate the notice", status: "failed", error: "Glossary unreadable", started: T - 40 * MIN, ended: T - 30 * MIN },
  ],
};
const EVENTS: MissionEvent[] = [
  { at: T - 70 * MIN, kind: "done", agentId: "planner" },
  { at: T - 60 * MIN, kind: "done", agentId: "planner" },
  { at: T - 45 * MIN, kind: "needs-you", agentId: "scheduler", label: "Earlier run" },
  { at: T - 30 * MIN, kind: "failed", agentId: "translator", label: "Glossary" },
  { at: T - 10 * MIN, kind: "done" },
];
const DECISIONS: MissionDecision[] = [
  { id: "d1", agentId: "scheduler", title: "Publish the earlier run?", primary: "Publish", secondary: "Wait" },
  { id: "d2", title: "Send to the print shop?", primary: "Send", secondary: "Wait" },
];

const make = (look: "standard" | "clean" = "standard", width = 1100) =>
  fixture<TcMissionControl>(
    html`<tc-mission-control look=${look} style=${`width: ${width}px`} .root=${ROOT} .events=${EVENTS} .decisions=${DECISIONS} .since=${T - 90 * MIN} .now=${T} locale="en-US"></tc-mission-control>`,
  );
const text = (el: Element | null) => el?.textContent!.replace(/\s+/g, " ").trim();
const seg = (el: Element) => el.querySelector<TcSegmentedControl>("tc-segmented-control")!;
const pick = (s: Element, value: string) => s.dispatchEvent(new CustomEvent("tc-value-change", { detail: { value }, bubbles: true, composed: true, cancelable: true }));
const agentIds = (el: Element) => [...el.querySelectorAll<HTMLElement>("tc-agent-tree .ui-agt__node[data-id]")].map((n) => n.dataset.id);
const inbox = (el: Element) => el.querySelector<TcDecisionInbox>("tc-decision-inbox")!;

describe("tc-mission-control", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: heading, filter, since-you-looked, tree and inbox`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("mctl");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector("h2")!.textContent).toBe("Mission control");
      expect(seg(el).options.map((o) => o.label)).toEqual(["All", "Running", "Waiting", "Failed"]);
      expect(seg(el).options.map((o) => o.count)).toEqual([undefined, 1, 1, 1]);
      expect(seg(el).value).toBe("all");
      expect(text(el.querySelector(".ui-mctl__since-line"))).toMatch(/^Since \d{1,2}:\d{2}\s?[AP]M · 3 done · 1 failed · 1 needs you$/);
      expect(el.querySelector(".ui-mctl__chart")!.getAttribute("role")).toBe("img");
      expect(el.querySelectorAll(".ui-mctl__bar").length).toBeGreaterThan(0);
      expect(agentIds(el)).toEqual(expect.arrayContaining(["lead", "planner", "scheduler", "translator"]));
      expect(el.querySelector("tc-agent-tree")!.getAttribute("look")).toBe(look);
      expect(inbox(el).decisions.map((d) => d.id)).toEqual(["d1", "d2"]);
      expect(el.querySelector(".ui-mctl__side")!.getAttribute("aria-label")).toBe("Needs you");
    });
  }

  test("one filter applies to the tree, the events and the decisions", async () => {
    const el = await make();
    const seen: MissionFilterChange[] = [];
    el.addEventListener("tc-filter-change", (e) => seen.push((e as CustomEvent<MissionFilterChange>).detail));
    pick(seg(el), "waiting");
    await settle();
    expect(seen).toEqual([{ filter: "waiting" }]);
    expect(el.filter).toBe("waiting");
    await expect.poll(() => agentIds(el).sort()).toEqual(["lead", "scheduler"]);
    expect(inbox(el).decisions.map((d) => d.id)).toEqual(["d1"]);
    expect(text(el.querySelector(".ui-mctl__since-line"))).toMatch(/0 done · 0 failed · 1 needs you$/);
    pick(seg(el), "running");
    await settle();
    expect(inbox(el).decisions).toEqual([]);
    expect(text(el.querySelector(".ui-mctl__since-line"))).toBe("Nothing happened that matches this filter.");
  });

  test("a prevented filter change keeps the filter", async () => {
    const el = await make();
    el.addEventListener("tc-filter-change", (e) => e.preventDefault());
    pick(seg(el), "failed");
    await settle();
    expect(el.filter).toBe("all");
    expect(seg(el).value).toBe("all");
  });

  test("filterAgentTree keeps the way down to a match", () => {
    expect(filterAgentTree(ROOT, "all")).toBe(ROOT);
    const failed = filterAgentTree(ROOT, "failed");
    expect(failed.id).toBe("lead");
    expect(failed.children!.map((c) => c.id)).toEqual(["translator"]);
    expect(filterAgentTree({ id: "x", name: "X", task: "", status: "done" }, "failed").children).toEqual([]);
  });

  test("renamed words and an empty block", async () => {
    const el = await make();
    el.labels = { all: "Everyone", sinceTitle: "While you were out" };
    el.heading = "Agents today";
    await settle();
    expect(seg(el).options[0].label).toBe("Everyone");
    expect(text(el.querySelector(".ui-mctl__since .ui-mctl__section-title"))).toBe("While you were out");
    expect(el.querySelector("h2")!.textContent).toBe("Agents today");
    el.events = [];
    el.decisions = [];
    await settle();
    expect(el.querySelector(".ui-mctl__chart")).toBeNull();
  });

  test("narrow: it stacks with what needs you first", async () => {
    const el = await make("standard", 380);
    const side = el.querySelector(".ui-mctl__side")!.getBoundingClientRect();
    const agents = el.querySelector(".ui-mctl__agents")!.getBoundingClientRect();
    expect(side.bottom).toBeLessThanOrEqual(agents.top + 1);
    // A tree wider than the room scrolls inside the block, never the page
    expect(el.scrollWidth).toBeLessThanOrEqual(381);
  });

  test("React wrapper: a controlled filter stays until the parent changes it; uncontrolled from defaultFilter", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: string[] = [];
    await act(async () => root.render(React.createElement(MissionControl, { root: ROOT, events: EVENTS, decisions: DECISIONS, filter: "all", onFilterChange: (f) => void seen.push(f) })));
    await settle();
    const el = host.querySelector("tc-mission-control")!;
    expect(el.heading).toBe("Mission control");
    await act(async () => void pick(seg(el), "failed"));
    await settle();
    expect(seen).toEqual(["failed"]);
    expect(el.filter).toBe("all");
    await act(async () => root.render(React.createElement(MissionControl, { key: "u", root: ROOT, defaultFilter: "waiting", title: "Fleet" })));
    await settle();
    const el2 = host.querySelector("tc-mission-control")!;
    expect(el2.filter).toBe("waiting");
    expect(el2.heading).toBe("Fleet");
    await act(async () => void pick(seg(el2), "failed"));
    await act(async () => root.render(React.createElement(MissionControl, { key: "u", root: ROOT, defaultFilter: "waiting", title: "Fleet!" })));
    await settle();
    expect(el2.filter).toBe("failed");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; width: 1100px; background: var(--tc-surface-base)">
        <tc-mission-control .root=${ROOT} .events=${EVENTS} .decisions=${DECISIONS} .now=${T}></tc-mission-control>
        <tc-mission-control look="clean" filter="failed" .root=${ROOT} .events=${EVENTS} .decisions=${DECISIONS} .now=${T}></tc-mission-control>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
