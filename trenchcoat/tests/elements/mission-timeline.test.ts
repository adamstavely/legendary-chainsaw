/*
 * <tc-mission-timeline> in real browsers: each agent's status read from its tasks, the lanes it composes, one filter
 * for the lanes, the events and the decisions (tc-filter-change and preventDefault), narrow layout, the React wrapper
 * and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/mission-timeline";
import { laneAgentStatuses, type TcMissionTimeline } from "../../src/elements/mission-timeline";
import type { MissionDecision, MissionEvent } from "../../src/elements/mission-control";
import type { LaneAgent, LaneTask, TcAgentLanes } from "../../src/elements/agent-lanes";
import type { TcDecisionInbox } from "../../src/elements/decision-inbox";
import type { TcSegmentedControl } from "../../src/elements/segmented-control";
import { MissionTimeline } from "../../src/elements/react/mission-timeline";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const T = Date.UTC(2026, 10, 14, 6, 0);
const MIN = 60_000;
const AGENTS: LaneAgent[] = [
  { id: "planner", name: "Planner" },
  { id: "scheduler", name: "Scheduler" },
  { id: "translator", name: "Translator" },
  { id: "access", name: "Reviewer" },
];
const TASKS: LaneTask[] = [
  { id: "p1", agentId: "planner", title: "List stops", status: "done", start: T - 20 * MIN, end: T - 15 * MIN },
  { id: "s1", agentId: "scheduler", title: "Timetables", status: "waiting", start: T - 10 * MIN, ask: "Publish?" },
  { id: "t1", agentId: "translator", title: "Spanish", status: "done", start: T - 25 * MIN, end: T - 22 * MIN },
  { id: "t2", agentId: "translator", title: "Vietnamese", status: "failed", start: T - 20 * MIN, end: T - 18 * MIN },
  { id: "a1", agentId: "access", title: "Check PDFs", status: "running", start: T - 5 * MIN },
];
const EVENTS: MissionEvent[] = [
  { at: T - 15 * MIN, kind: "done", agentId: "planner" },
  { at: T - 18 * MIN, kind: "failed", agentId: "translator" },
  { at: T - 10 * MIN, kind: "needs-you", agentId: "scheduler" },
];
const DECISIONS: MissionDecision[] = [{ id: "d1", agentId: "scheduler", title: "Publish the earlier run?", primary: "Publish", secondary: "Wait" }];

const make = (look: "standard" | "clean" = "standard", width = 1100) =>
  fixture<TcMissionTimeline>(
    html`<tc-mission-timeline look=${look} style=${`width: ${width}px`} .agents=${AGENTS} .tasks=${TASKS} .events=${EVENTS} .decisions=${DECISIONS} .now=${T}></tc-mission-timeline>`,
  );
const seg = (el: Element) => el.querySelector<TcSegmentedControl>("tc-segmented-control")!;
const pick = (s: Element, value: string) => s.dispatchEvent(new CustomEvent("tc-value-change", { detail: { value }, bubbles: true, composed: true, cancelable: true }));
const lanes = (el: Element) => el.querySelector<TcAgentLanes>("tc-agent-lanes")!;

describe("tc-mission-timeline", () => {
  test("an agent's status comes from its tasks", () => {
    const s = laneAgentStatuses(AGENTS, TASKS);
    expect(Object.fromEntries(s)).toEqual({ planner: "done", scheduler: "waiting", translator: "failed", access: "running" });
    expect(laneAgentStatuses([{ id: "x", name: "X" }], []).size).toBe(0);
  });

  test("span set to undefined (as a wrapper passes it) keeps the 30-minute window", async () => {
    const el = await make();
    el.span = undefined;
    await settle(el);
    await expect.poll(() => lanes(el).span).toBe(30 * MIN);
    await expect.poll(() => lanes(el).querySelector(".ui-al__window")?.textContent).toBe("Last 30m");
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: heading, filter counts, lanes and inbox`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("mtl");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector("h2")!.textContent).toBe("Mission timeline");
      expect(seg(el).options.map((o) => o.count)).toEqual([undefined, 1, 1, 1]);
      expect(lanes(el).agents.map((a) => a.id)).toEqual(["planner", "scheduler", "translator", "access"]);
      expect(lanes(el).tasks.length).toBe(5);
      expect(lanes(el).getAttribute("look")).toBe(look);
      expect(el.querySelector<TcDecisionInbox>("tc-decision-inbox")!.decisions.length).toBe(1);
    });
  }

  test("the filter keeps the lanes, events and decisions of matching agents", async () => {
    const el = await make();
    const seen: unknown[] = [];
    el.addEventListener("tc-filter-change", (e) => seen.push((e as CustomEvent).detail));
    pick(seg(el), "failed");
    await settle();
    expect(seen).toEqual([{ filter: "failed" }]);
    expect(lanes(el).agents.map((a) => a.id)).toEqual(["translator"]);
    expect(lanes(el).tasks.map((t) => t.id)).toEqual(["t1", "t2"]);
    expect(el.querySelector<TcDecisionInbox>("tc-decision-inbox")!.decisions).toEqual([]);
    expect(el.querySelector(".ui-mtl__since-line")!.textContent).toMatch(/0 done · 1 failed · 0 need you$/);
  });

  test("a prevented filter change keeps the filter", async () => {
    const el = await make();
    el.addEventListener("tc-filter-change", (e) => e.preventDefault());
    pick(seg(el), "running");
    await settle();
    expect(el.filter).toBe("all");
    expect(lanes(el).agents.length).toBe(4);
  });

  test("narrow: what needs you comes first", async () => {
    const el = await make("standard", 380);
    const side = el.querySelector(".ui-mtl__side")!.getBoundingClientRect();
    const agents = el.querySelector(".ui-mtl__agents")!.getBoundingClientRect();
    expect(side.bottom).toBeLessThanOrEqual(agents.top + 1);
  });

  test("React wrapper: a controlled filter, and onOpenTask making tasks openable", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: string[] = [];
    await act(async () =>
      root.render(React.createElement(MissionTimeline, { agents: AGENTS, tasks: TASKS, now: T, filter: "all", onFilterChange: (f) => void seen.push(f), onOpenTask: () => {} })),
    );
    await settle();
    const el = host.querySelector("tc-mission-timeline")!;
    expect(el.openable).toBe(true);
    expect(lanes(el).openable).toBe(true);
    await act(async () => void pick(seg(el), "waiting"));
    await settle();
    expect(seen).toEqual(["waiting"]);
    expect(el.filter).toBe("all");
    await act(async () => root.render(React.createElement(MissionTimeline, { key: "u", agents: AGENTS, tasks: TASKS, now: T, defaultFilter: "running" })));
    await settle();
    const el2 = host.querySelector("tc-mission-timeline")!;
    expect(el2.filter).toBe("running");
    expect(lanes(el2).agents.map((a) => a.id)).toEqual(["access"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; width: 1100px; background: var(--tc-surface-base)">
        <tc-mission-timeline .agents=${AGENTS} .tasks=${TASKS} .events=${EVENTS} .decisions=${DECISIONS} .now=${T}></tc-mission-timeline>
        <tc-mission-timeline look="clean" .agents=${AGENTS} .tasks=${TASKS} .events=${EVENTS} .decisions=${DECISIONS} .now=${T}></tc-mission-timeline>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
