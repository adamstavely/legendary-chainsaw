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
import { movePlacement, planRuns, type ScheduledModeChange, type ScheduledPlacementsChange, type ScheduledSession, type ScheduledTask, type TcScheduledRuns } from "../../src/elements/scheduled-runs";
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
    expect(seen[0]!.task!.id).toBe("b");
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

const WEEK: ScheduledSession[] = [
  { id: "m7", label: "Early", day: "Mon", time: "07:00", limit: 100, start: 1000, end: 2000 },
  { id: "t7", label: "Early", day: "Tue", time: "07:00", limit: 30 },
  { id: "m12", label: "Late", day: "Mon", time: "12:00", limit: 100 },
  { id: "x", label: "Whenever", limit: 50 },
];
const JOBS: ScheduledTask[] = [{ id: "a", name: "Alpha", cost: 40, agent: "Agent One", detail: "Does a thing", stats: [{ label: "Files", value: 1200 }] }];
const week = (attrs = {}) => {
  const a = attrs as { placements?: object[]; now?: number; mode?: string; tasks?: ScheduledTask[] };
  return fixture<TcScheduledRuns>(html`<tc-scheduled-runs .sessions=${WEEK} .tasks=${a.tasks ?? JOBS} .placements=${a.placements ?? [{ task: "a", session: "m7", cost: 40 }]} .now=${a.now} .mode=${a.mode ?? "manual"}></tc-scheduled-runs>`);
};
const rowOf = (el: Element, s: string) => el.querySelector<HTMLElement>(`.ui-sdr__session[data-session="${s}"]`)!;
const place = (el: Element) => getComputedStyle(el);
const pointer = (type: string, x: number, y: number, target: EventTarget, extra: PointerEventInit = {}) => target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, pointerType: "mouse", ...extra }));
const centre = (el: Element) => {
  el.scrollIntoView({ block: "center" });
  const r = el.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height / 2] as const;
};
const dragTo = async (el: Element, card: HTMLElement, target: Element, drop = true) => {
  const [sx, sy] = centre(card);
  pointer("pointerdown", sx, sy, card.querySelector(".ui-sdr__task-name")!);
  const [tx, ty] = centre(target);
  window.dispatchEvent(new PointerEvent("pointermove", { clientX: tx, clientY: ty }));
  await settle();
  if (drop) window.dispatchEvent(new PointerEvent("pointerup", { clientX: tx, clientY: ty }));
  await settle();
};
const seg = (el: Element, name: string) => [...el.querySelectorAll<HTMLElement>('.ui-sdr__mode [role="radio"]')].find((r) => r.textContent!.includes(name))!;

describe("calendar", () => {
  test("is the default: days as columns and times as rows, with sessions in their place", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 1100px"><tc-scheduled-runs .sessions=${WEEK} .tasks=${JOBS} .placements=${[{ task: "a", session: "m7", cost: 40 }]}></tc-scheduled-runs></div>`);
    const el = wrap.querySelector("tc-scheduled-runs")!;
    expect(el.layout).toBe("calendar");
    expect([...el.querySelectorAll(".ui-sdr__column-head")].map(text)).toEqual(["Mon", "Tue", "Any day"]);
    expect([...el.querySelectorAll(".ui-sdr__row-head")].map(text)).toEqual(["07:00", "12:00", ""]);
    const m7 = rowOf(el, "m7").getBoundingClientRect();
    const t7 = rowOf(el, "t7").getBoundingClientRect();
    const m12 = rowOf(el, "m12").getBoundingClientRect();
    expect(t7.left).toBeGreaterThan(m7.left);
    expect(Math.abs(t7.top - m7.top)).toBeLessThan(2);
    expect(Math.abs(m12.left - m7.left)).toBeLessThan(2);
    expect(m12.top).toBeGreaterThan(m7.top);
    expect(rowOf(el, "x")).toBeTruthy();
    expect(text(rowOf(el, "m7").querySelector("h4"))).toContain("Mon, 07:00");
  });

  test("always has a To schedule column, and says when it's empty", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 1100px"><tc-scheduled-runs .sessions=${WEEK} .tasks=${JOBS} .placements=${[{ task: "a", session: "m7", cost: 40 }]}></tc-scheduled-runs></div>`);
    const el = wrap.querySelector("tc-scheduled-runs")!;
    const col = el.querySelector(".ui-sdr__waiting")!;
    expect(text(col)).toContain("To schedule");
    expect(text(col)).toContain("Nothing waiting");
    expect(col.getBoundingClientRect().left).toBeLessThan(rowOf(el, "m7").getBoundingClientRect().left);
  });

  test('layout="cards" wraps, and a calendar with no days or times falls back', async () => {
    const el = await fixture<TcScheduledRuns>(html`<tc-scheduled-runs layout="cards" .sessions=${WEEK} .tasks=${JOBS}></tc-scheduled-runs>`);
    expect(el.querySelector(".ui-sdr__column-head")).toBeNull();
    const plain = await fixture<TcScheduledRuns>(html`<tc-scheduled-runs .sessions=${[{ id: "s", label: "S", limit: 10 }]} .tasks=${JOBS}></tc-scheduled-runs>`);
    expect(plain.querySelector(".ui-sdr__board")!.getAttribute("data-layout")).toBe("cards");
  });

  test("stacks when narrow, hiding the grid's heads and showing each session's day", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 320px"><tc-scheduled-runs .sessions=${WEEK} .tasks=${JOBS}></tc-scheduled-runs></div>`);
    expect(place(wrap.querySelector(".ui-sdr__sessions")!).gridTemplateColumns.split(" ")).toHaveLength(1);
    expect(place(wrap.querySelector(".ui-sdr__column-head")!).display).toBe("none");
    expect(place(wrap.querySelector(".ui-sdr__day")!).display).not.toBe("none");
    expect(wrap.scrollWidth).toBeLessThanOrEqual(wrap.clientWidth);
  });
});

describe("task cards", () => {
  test("show share of the limit, agent, detail, stats and a page's icon, and the header counts tasks", async () => {
    const icon = document.createElement("i");
    icon.className = "mine";
    const el = await week({ tasks: [{ ...JOBS[0]!, icon }] });
    const card = text(el.querySelector('[data-task="a"]'));
    expect(card).toContain("40% of limit");
    expect(card).toContain("Agent One");
    expect(card).toContain("Does a thing");
    expect(card).toContain("Files 1,200");
    expect(el.querySelector('[data-task="a"] .mine')).toBeTruthy();
    expect(icon.isConnected).toBe(false);
    expect(text(el.querySelector(".ui-sdr__count"))).toBe("1 task");
  });

  test("an unscheduled task has no share", async () => {
    const el = await week({ placements: [{ task: "a", session: null, cost: 40 }] });
    expect(el.querySelector('[data-task="a"] .ui-sdr__share')).toBeNull();
  });
});

describe("now line", () => {
  test("shows in the session that spans it, in words, and nowhere otherwise", async () => {
    const el = await week({ now: 1500 });
    const line = rowOf(el, "m7").querySelector<HTMLElement>(".ui-sdr__now")!;
    expect(text(line)).toBe("Now");
    expect(line.style.top).toBe("50%");
    expect(el.querySelectorAll(".ui-sdr__now")).toHaveLength(1);
    el.now = 5000;
    await settle();
    expect(el.querySelector(".ui-sdr__now")).toBeNull();
    el.now = undefined;
    await settle();
    expect(el.querySelector(".ui-sdr__now")).toBeNull();
  });
});

describe("mode", () => {
  test("switching to Auto replans, fires both events and turns moving off, with a line saying why", async () => {
    const el = await week();
    const modes: ScheduledModeChange[] = [];
    const moves: ScheduledPlacementsChange[] = [];
    el.addEventListener("tc-mode-change", (e) => modes.push((e as CustomEvent<ScheduledModeChange>).detail));
    el.addEventListener("tc-placements-change", (e) => moves.push((e as CustomEvent<ScheduledPlacementsChange>).detail));
    seg(el, "Auto").click();
    await settle();
    expect(modes).toEqual([{ mode: "auto" }]);
    expect(moves[0]!.task).toBeNull();
    expect(moves[0]!.placements).toEqual(planRuns(WEEK, JOBS));
    expect(el.mode).toBe("auto");
    expect(text(el.querySelector(".ui-sdr__auto-note"))).toContain("Switch to Manual");
    expect(select(el, "a").disabled).toBe(true);
    expect(el.querySelector(".ui-sdr__grip")).toBeNull();
    seg(el, "Manual").click();
    await settle();
    expect(select(el, "a").disabled).toBe(false);
    expect(el.querySelector(".ui-sdr__auto-note")).toBeNull();
  });

  test("the inner control's event doesn't reach the page, and preventDefault keeps the mode and plan", async () => {
    const el = await week();
    let inner = 0;
    el.addEventListener("tc-value-change", () => inner++);
    el.addEventListener("tc-mode-change", (e) => e.preventDefault());
    const before = el.placements;
    seg(el, "Auto").click();
    await settle();
    expect(inner).toBe(0);
    expect(el.mode).toBe("manual");
    expect(el.placements).toBe(before);
    expect(el.querySelector<HTMLElement>('.ui-sdr__mode [role="radiogroup"]')!.getAttribute("aria-label")).toBe("How tasks are placed");
  });

  test("defaults to Manual, and a prevented replan keeps the old plan", async () => {
    const el = await week();
    expect(el.mode).toBe("manual");
    el.addEventListener("tc-placements-change", (e) => e.preventDefault());
    const before = el.placements;
    seg(el, "Auto").click();
    await settle();
    expect(el.mode).toBe("auto");
    expect(el.placements).toBe(before);
  });
});

describe("dragging", () => {
  test("drops a card on a session, showing the target as it goes", async () => {
    const el = await week();
    const seen: ScheduledPlacementsChange[] = [];
    el.addEventListener("tc-placements-change", (e) => seen.push((e as CustomEvent<ScheduledPlacementsChange>).detail));
    const card = el.querySelector<HTMLElement>('[data-task="a"]')!;
    await dragTo(el, card, rowOf(el, "m12"), false);
    expect(rowOf(el, "m12").dataset.over).toBe("ok");
    expect(el.querySelector('[data-task="a"]')!.hasAttribute("data-dragging")).toBe(true);
    window.dispatchEvent(new PointerEvent("pointerup"));
    await settle();
    expect(seen[0]!.task!.id).toBe("a");
    expect(rowOf(el, "m12").querySelector('[data-task="a"]')).toBeTruthy();
    expect(rowOf(el, "m12").hasAttribute("data-over")).toBe(false);
    expect(text(el.querySelector(':scope > [role="status"]'))).toContain("Moved Alpha to Late");
  });

  test("drops to To schedule", async () => {
    const el = await week();
    await dragTo(el, el.querySelector<HTMLElement>('[data-task="a"]')!, el.querySelector(".ui-sdr__waiting")!);
    expect(el.placements![0]!.session).toBeNull();
  });

  test("a session without room is refused, with the reason shown and announced, and nothing moves", async () => {
    const el = await week();
    const seen: unknown[] = [];
    el.addEventListener("tc-placements-change", (e) => seen.push(e));
    await dragTo(el, el.querySelector<HTMLElement>('[data-task="a"]')!, rowOf(el, "t7"), false);
    expect(rowOf(el, "t7").dataset.over).toBe("refused");
    window.dispatchEvent(new PointerEvent("pointerup"));
    await settle();
    expect(seen).toHaveLength(0);
    expect(el.placements![0]!.session).toBe("m7");
    const why = "Early has 30 credits left, and Alpha needs 40.";
    expect(text(el.querySelector(".ui-sdr__refusal"))).toBe(why);
    expect(text(el.querySelector(':scope > [role="status"]'))).toBe(why);
  });

  test("Escape cancels, a small press isn't a drag, and the list ignores it", async () => {
    const el = await week();
    const card = el.querySelector<HTMLElement>('[data-task="a"]')!;
    await dragTo(el, card, rowOf(el, "m12"), false);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await settle();
    window.dispatchEvent(new PointerEvent("pointerup"));
    await settle();
    expect(el.placements![0]!.session).toBe("m7");
    const [x, y] = centre(card);
    pointer("pointerdown", x, y, card);
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: x + 1, clientY: y }));
    window.dispatchEvent(new PointerEvent("pointerup"));
    await settle();
    expect(el.querySelector("[data-dragging]")).toBeNull();
    pointer("pointerdown", x, y, select(el, "a"));
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: x + 100, clientY: y }));
    await settle();
    expect(el.querySelector("[data-dragging]")).toBeNull();
  });

  test("touch drags only from the grip, and Auto doesn't drag at all", async () => {
    const el = await week();
    const card = el.querySelector<HTMLElement>('[data-task="a"]')!;
    const [x, y] = centre(card);
    pointer("pointerdown", x, y, card.querySelector(".ui-sdr__task-name")!, { pointerType: "touch" });
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: x + 100, clientY: y }));
    await settle();
    expect(el.querySelector("[data-dragging]")).toBeNull();
    pointer("pointerdown", x, y, card.querySelector(".ui-sdr__grip")!, { pointerType: "touch" });
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: x + 100, clientY: y }));
    await settle();
    expect(el.querySelector("[data-dragging]")).toBeTruthy();
    window.dispatchEvent(new PointerEvent("pointercancel"));
    await settle();
    const auto = await week({ mode: "auto" });
    const autoCard = auto.querySelector<HTMLElement>('[data-task="a"]')!;
    const [ax, ay] = centre(autoCard);
    pointer("pointerdown", ax, ay, autoCard);
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: ax + 100, clientY: ay }));
    await settle();
    expect(auto.querySelector("[data-dragging]")).toBeNull();
  });

  test("the keyboard way still works in the calendar", async () => {
    const el = await week();
    await choose(select(el, "a"), "m12");
    expect(el.placements![0]!.session).toBe("m12");
    expect(el.querySelector('[data-drop]:not([data-over])')).toBeTruthy();
  });
});

describe("React", () => {
  test("mode is controlled when given, and survives re-renders when not", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const seen: string[] = [];
    const node = (props: object) => React.createElement(ScheduledRuns, { sessions: WEEK, tasks: JOBS, ...props });
    await act(async () => root.render(node({})));
    await settle();
    const el = host.querySelector<TcScheduledRuns>("tc-scheduled-runs")!;
    await act(async () => seg(el, "Auto").click());
    await act(async () => root.render(node({})));
    await settle();
    expect(el.mode).toBe("auto");
    await act(async () => root.unmount());
    const root2 = createRoot(host);
    await act(async () => root2.render(node({ mode: "manual", onModeChange: (m: string) => seen.push(m) })));
    await settle();
    const el2 = host.querySelector<TcScheduledRuns>("tc-scheduled-runs")!;
    await act(async () => seg(el2, "Auto").click());
    await settle();
    expect(seen).toEqual(["auto"]);
    expect(el2.mode).toBe("manual");
    await act(async () => root2.unmount());
    host.remove();
  });

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

describe("accessibility of the calendar", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      for (const mode of ["manual", "auto"]) {
        test(`no axe violations, ${look} ${scheme} ${mode}`, async () => {
          const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas`}><tc-scheduled-runs .sessions=${WEEK} .tasks=${JOBS} .now=${1500} .mode=${mode as "manual" | "auto"}></tc-scheduled-runs></div>`);
          await finish(wrap);
          const { violations } = await axe.run(wrap);
          expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
        });
      }
    }
  }
});

describe("tc-scheduled-runs session names", () => {
  test("sessions with the same name on different days can be told apart", async () => {
    const sessions = [
      { id: "a", label: "Morning", day: "Monday", limit: 100 },
      { id: "b", label: "Morning", day: "Tuesday", limit: 100 },
    ];
    const el = await fixture<TcScheduledRuns>(html`<tc-scheduled-runs .sessions=${sessions} .tasks=${[{ id: "t", name: "Task", cost: 10 }]}></tc-scheduled-runs>`);
    const options = [...el.querySelector("select")!.options].map((o) => o.textContent);
    expect(options).toContain("Monday, Morning");
    expect(options).toContain("Tuesday, Morning");
    expect(el.querySelector('[role="progressbar"]')!.getAttribute("aria-label")).toBe("Monday, Morning");
  });
});

describe("tc-scheduled-runs drag", () => {
  test("a drag doesn't select text, and selecting works again afterwards", async () => {
    const sessions = [{ id: "a", label: "Morning", limit: 100 }];
    const el = await fixture<TcScheduledRuns>(html`<tc-scheduled-runs .sessions=${sessions} .tasks=${[{ id: "t", name: "Task", cost: 10 }]}></tc-scheduled-runs>`);
    const select = () => {
      const e = new Event("selectstart", { bubbles: true, cancelable: true });
      document.body.dispatchEvent(e);
      return e.defaultPrevented;
    };
    expect(select()).toBe(false);
    el.querySelector(".ui-sdr__task")!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerType: "mouse", clientX: 1, clientY: 1 }));
    expect(select()).toBe(true);
    window.dispatchEvent(new PointerEvent("pointerup", { button: 0 }));
    expect(select()).toBe(false);
  });
});
