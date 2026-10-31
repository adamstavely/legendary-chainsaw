/*
 * <tc-scheduled-runs> in real browsers: planRuns, meters that never overflow, moving by keyboard-friendly select, controlled
 * use, stacking, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/scheduled-runs";
import { movePlacement, planRuns, type ScheduledPlacementsChange, type ScheduledSession, type ScheduledTask, type TcScheduledRuns } from "../../src/elements/scheduled-runs";
import { ScheduledRuns } from "../../src/elements/react/scheduled-runs";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();

const SESSIONS: ScheduledSession[] = [{ id: "s1", label: "One", day: "Monday", limit: 100 }, { id: "s2", label: "Two", limit: 100 }];
const TASKS: ScheduledTask[] = [
  { id: "big", name: "Big", cost: 150 },
  { id: "small", name: "Small", cost: 30 },
  { id: "pin", name: "Pinned", cost: 20, pinned: "s2" },
  { id: "huge", name: "Huge", cost: 500 },
];
const runs = () => fixture<TcScheduledRuns>(html`<tc-scheduled-runs .sessions=${SESSIONS} .tasks=${TASKS}></tc-scheduled-runs>`);
const select = (el: Element, task: string, n = 0) => el.querySelectorAll<HTMLSelectElement>(`[data-task="${task}"] select`)[n]!;
const choose = async (s: HTMLSelectElement, value: string) => {
  s.value = value;
  s.dispatchEvent(new Event("change", { bubbles: true }));
  await settle();
};

describe("planRuns", () => {
  test("pins first, splits what no session holds, fills gaps, and leaves the rest unscheduled", () => {
    const plan = planRuns(SESSIONS, TASKS);
    expect(plan.find((p) => p.task === "pin")!.session).toBe("s2");
    const big = plan.filter((p) => p.task === "big");
    expect(big.map((p) => [p.session, p.cost, p.part, p.parts])).toEqual([["s1", 100, 1, 2], ["s2", 50, 2, 2]]);
    expect(plan.find((p) => p.task === "small")!.session).toBe("s2");
    expect(plan.find((p) => p.task === "huge")!.session).toBeNull();
  });

  test("never overfills, and costs add up", () => {
    const plan = planRuns(SESSIONS, TASKS);
    for (const s of SESSIONS) expect(plan.filter((p) => p.session === s.id).reduce((n, p) => n + p.cost, 0)).toBeLessThanOrEqual(s.limit);
    for (const t of TASKS) expect(plan.filter((p) => p.task === t.id).reduce((n, p) => n + p.cost, 0)).toBe(t.cost);
  });

  test("a pinned task that doesn't fit is unscheduled, priority goes first, and an unknown pin is ignored", () => {
    const one = [{ id: "s", label: "S", limit: 10 }];
    expect(planRuns(one, [{ id: "p", name: "P", cost: 20, pinned: "s" }])[0]!.session).toBeNull();
    const plan = planRuns(one, [{ id: "low", name: "L", cost: 10 }, { id: "high", name: "H", cost: 10, priority: 1 }, { id: "x", name: "X", cost: 0, pinned: "gone" }]);
    expect(plan.find((p) => p.task === "high")!.session).toBe("s");
    expect(plan.find((p) => p.task === "low")!.session).toBeNull();
  });

  test("movePlacement merges parts and renumbers", () => {
    const plan = planRuns(SESSIONS, [{ id: "big", name: "Big", cost: 150 }]);
    const merged = movePlacement(plan, plan[1]!, "s1");
    expect(merged).toEqual([{ task: "big", session: "s1", cost: 150 }]);
    // Equal values count as the same placement, so a freshly worked-out plan moves too
    expect(movePlacement(planRuns(SESSIONS, [{ id: "a", name: "A", cost: 10 }]), { task: "a", session: "s1", cost: 10 }, null)).toEqual([{ task: "a", session: null, cost: 10 }]);
  });
});

describe("tc-scheduled-runs", () => {
  test("shows each session's meter in numbers and words", async () => {
    const el = await runs();
    expect(el.dataset.ui).toBe("sdr");
    const one = el.querySelector('[data-session="s1"].ui-sdr__session')!;
    expect(text(one.querySelector(".ui-sdr__usage"))).toBe("100 of 100 credits used · Full");
    const meter = one.querySelector('[role="progressbar"]')!;
    expect(meter.getAttribute("aria-valuetext")).toBe("100 of 100 credits used");
    expect(text(el.querySelector('[data-task="big"]'))).toContain("part 1 of 2");
    expect(text(el.querySelector(".ui-sdr__waiting"))).toContain("Huge");
    expect(text(el.querySelector(".ui-sdr__summary"))).toBe("1 unscheduled");
  });

  test("a task over the limit never overflows the meter", async () => {
    const el = await fixture<TcScheduledRuns>(html`<tc-scheduled-runs .sessions=${[SESSIONS[0]!]} .tasks=${TASKS} .placements=${[{ task: "huge", session: "s1", cost: 500 }]}></tc-scheduled-runs>`);
    await finish(el);
    const meter = el.querySelector<HTMLElement>(".ui-sdr__meter")!;
    expect(el.querySelector<HTMLElement>(".ui-sdr__fill")!.style.width).toBe("100%");
    expect(el.querySelector<HTMLElement>(".ui-sdr__fill")!.getBoundingClientRect().width).toBeLessThanOrEqual(meter.getBoundingClientRect().width);
    expect(meter.getAttribute("aria-valuenow")).toBe("100");
  });

  test("moving fires the change, and sessions without room are disabled", async () => {
    const el = await fixture<TcScheduledRuns>(html`<tc-scheduled-runs .sessions=${SESSIONS} .tasks=${[{ id: "a", name: "A", cost: 90 }, { id: "b", name: "B", cost: 60 }]}></tc-scheduled-runs>`);
    const seen: ScheduledPlacementsChange[] = [];
    el.addEventListener("tc-placements-change", (e) => seen.push((e as CustomEvent<ScheduledPlacementsChange>).detail));
    const options = select(el, "b").querySelectorAll("option");
    expect(options[0]!.disabled).toBe(true);
    await choose(select(el, "b"), "");
    expect(seen[0]!.task.id).toBe("b");
    expect(seen[0]!.placements.find((p) => p.task === "b")!.session).toBeNull();
    expect(text(el.querySelector(".ui-sdr__waiting"))).toContain("B");
    expect(text(el.querySelector('[role="status"]'))).toBe("Moved B to Unscheduled");
    expect(select(el, "b").getAttribute("aria-label")).toContain("Move to, B");
  });

  test("preventDefault keeps the placements and puts the list back", async () => {
    const el = await runs();
    el.addEventListener("tc-placements-change", (e) => e.preventDefault());
    const s = select(el, "pin");
    await choose(s, "");
    expect(el.placements).toBeUndefined();
    expect(select(el, "pin").value).toBe("s2");
  });

  test("sessions stack when narrow, with no overflow", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 300px"><tc-scheduled-runs .sessions=${SESSIONS} .tasks=${TASKS}></tc-scheduled-runs></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-sdr__sessions")!).gridTemplateColumns.split(" ")).toHaveLength(1);
    expect(wrap.scrollWidth).toBeLessThanOrEqual(wrap.clientWidth);
  });

  test("says so when there's nothing", async () => {
    const el = await fixture<TcScheduledRuns>(html`<tc-scheduled-runs></tc-scheduled-runs>`);
    expect(text(el.querySelector(".ui-sdr__empty"))).toContain("No tasks");
  });
});

describe("React", () => {
  test("uncontrolled moves survive re-renders, and controlled ones wait for the parent", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const node = (props: object) => React.createElement(ScheduledRuns, { sessions: SESSIONS, tasks: TASKS, ...props });
    await act(async () => root.render(node({})));
    await settle();
    const el = host.querySelector<TcScheduledRuns>("tc-scheduled-runs")!;
    await act(async () => choose(select(el, "pin"), ""));
    await act(async () => root.render(node({})));
    await settle();
    expect(el.placements!.find((p) => p.task === "pin")!.session).toBeNull();
    await act(async () => root.unmount());
    const fixed = planRuns(SESSIONS, TASKS);
    const root2 = createRoot(host);
    await act(async () => root2.render(node({ placements: fixed })));
    await settle();
    const el2 = host.querySelector<TcScheduledRuns>("tc-scheduled-runs")!;
    await act(async () => choose(select(el2, "pin"), ""));
    expect(el2.placements).toBe(fixed);
    await act(async () => root2.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas`}><tc-scheduled-runs .sessions=${SESSIONS} .tasks=${TASKS}></tc-scheduled-runs></div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
