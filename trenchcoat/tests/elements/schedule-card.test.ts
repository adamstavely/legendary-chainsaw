/*
 * <tc-schedule-card> in real browsers: the schedule and next run, the countdown from `now` and from its own clock, the
 * strip of runs in words, the strip's keyboard, Run now / Pause / Resume / Edit, controlled use, the React wrapper and
 * axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/schedule-card";
import { scheduleCountdown, type ScheduleRun, type ScheduleRunOpen, type SchedulePausedChange, type TcScheduleCard } from "../../src/elements/schedule-card";
import { ScheduleCard } from "../../src/elements/react/schedule-card";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = new Date(2026, 10, 16, 6, 50).getTime();
const NEXT = new Date(2026, 10, 16, 9, 0).getTime();
const DAY = 24 * 3600_000;
const RUNS: ScheduleRun[] = [
  { id: "a", at: NOW - 4 * DAY, status: "succeeded", duration: 125_000 },
  { id: "b", at: NOW - 3 * DAY, status: "failed", duration: 61_000, note: "3 invoices didn't match" },
  { id: "c", at: NOW - 2 * DAY, status: "skipped" },
  { id: "d", at: NOW - DAY, status: "succeeded", duration: 98_000 },
];

const run = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`[data-run="${id}"]`)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcScheduleCard>(
    html`<tc-schedule-card look=${look} heading="Ledger reconciliation" schedule="Every Monday at 09:00, Europe/London" .nextRun=${NEXT} .now=${NOW} .runs=${RUNS}></tc-schedule-card>`,
  );

describe("tc-schedule-card", () => {
  test("scheduleCountdown: seconds, minutes, hours and days", () => {
    expect(scheduleCountdown(45_000)).toBe("in 45 s");
    expect(scheduleCountdown(5 * 60_000 + 20_000)).toBe("in 5 min 20 s");
    expect(scheduleCountdown(25 * 60_000)).toBe("in 25 min");
    expect(scheduleCountdown(2 * 3600_000 + 10 * 60_000)).toBe("in 2 h 10 min");
    expect(scheduleCountdown(3 * DAY)).toBe("in 3 days");
    expect(scheduleCountdown(-5)).toBe("in 0 s");
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: heading, schedule, next run with its countdown, and the runs in words`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("scd");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Ledger reconciliation");
      expect(el.textContent).toContain("Every Monday at 09:00, Europe/London");
      const time = el.querySelector("time.ui-scd__next-at")!;
      expect(time.getAttribute("datetime")).toBe(new Date(NEXT).toISOString());
      expect(el.querySelector(".ui-scd__countdown")!.textContent).toBe("in 2 h 10 min");
      expect(el.querySelectorAll(".ui-scd__run")).toHaveLength(4);
      expect(run(el, "b").querySelector(".tc-sr-only")!.textContent).toMatch(/^Failed, .+, took 1m 01s, 3 invoices didn't match$/);
      expect(run(el, "c").querySelector(".tc-sr-only")!.textContent).toMatch(/^Skipped, /);
      expect(run(el, "a").dataset.tone).toBe("success");
      expect(run(el, "b").dataset.tone).toBe("danger");
      expect(run(el, "b").querySelector(".ui-scd__tip")!.getAttribute("aria-hidden")).toBe("true");
      expect(el.querySelector(".ui-scd__tally")!.textContent).toBe("2 of 4 succeeded");
      // One tab stop in the strip: the newest run
      expect(el.querySelectorAll('.ui-scd__run[tabindex="0"]')).toHaveLength(1);
      expect(run(el, "d").tabIndex).toBe(0);
    });
  }

  test("the countdown follows `now`, says Due now when it's passed, and the strip keeps only the last max-runs", async () => {
    const el = await make();
    el.now = NEXT - 45_000;
    await settle();
    expect(el.querySelector(".ui-scd__countdown")!.textContent).toBe("in 45 s");
    el.now = NEXT + 1000;
    await settle();
    expect(el.querySelector(".ui-scd__countdown")!.textContent).toBe("Due now");
    el.maxRuns = 2;
    await settle();
    expect([...el.querySelectorAll<HTMLElement>(".ui-scd__run")].map((b) => b.dataset.run)).toEqual(["c", "d"]);
    el.nextRun = null;
    await settle();
    expect(el.querySelector(".ui-scd__next")!.textContent!.trim()).toBe("No run scheduled");
  });

  test("its own clock ticks without `now`", async () => {
    const el = await fixture<TcScheduleCard>(html`<tc-schedule-card .nextRun=${Date.now() + 90_000}></tc-schedule-card>`);
    const read = () => el.querySelector(".ui-scd__countdown")?.textContent ?? "";
    await expect.poll(read).toMatch(/^in 1 min/);
    const first = read();
    await expect.poll(read, { timeout: 4000 }).not.toBe(first);
  });

  test("Pause / Resume: cancelable tc-paused-change, the paused notice in words, Run now disabled while paused", async () => {
    const el = await make();
    const seen: boolean[] = [];
    el.addEventListener("tc-paused-change", (e) => seen.push((e as CustomEvent<SchedulePausedChange>).detail.paused));
    const pause = el.querySelector<HTMLButtonElement>(".ui-scd__pause")!;
    expect(pause.textContent!.trim()).toBe("Pause");
    pause.click();
    await settle();
    expect(el.paused).toBe(true);
    expect(el.hasAttribute("paused")).toBe(true);
    expect(el.querySelector(".ui-scd__paused")!.textContent).toContain("Paused");
    expect(el.querySelector(".ui-scd__countdown")).toBeNull();
    expect(el.querySelector<HTMLButtonElement>(".ui-scd__run-now")!.disabled).toBe(true);
    expect(el.querySelector('[role="status"]')!.textContent).toContain("Paused");
    expect(pause.textContent!.trim()).toBe("Resume");
    el.addEventListener("tc-paused-change", (e) => e.preventDefault(), { once: true });
    pause.click();
    await settle();
    expect(el.paused).toBe(true);
    pause.click();
    await settle();
    expect(el.paused).toBe(false);
    expect(seen).toEqual([true, false, false]);
  });

  test("Run now and Edit fire; hide-edit removes Edit; empty runs say so", async () => {
    const el = await make();
    const events: string[] = [];
    el.addEventListener("tc-run-now", () => events.push("run"));
    el.addEventListener("tc-edit", () => events.push("edit"));
    el.querySelector<HTMLButtonElement>(".ui-scd__run-now")!.click();
    el.querySelector<HTMLButtonElement>(".ui-scd__edit")!.click();
    expect(events).toEqual(["run", "edit"]);
    el.hideEdit = true;
    el.runs = [];
    await settle();
    expect(el.querySelector(".ui-scd__edit")).toBeNull();
    expect(el.querySelector(".ui-scd__none")!.textContent).toBe("No runs yet");
    expect(el.querySelector(".ui-scd__tally")).toBeNull();
  });

  test("strip keyboard: ← → Home End move; Enter and click open a run; renamed labels", async () => {
    const el = await make();
    const opened: string[] = [];
    el.addEventListener("tc-run-open", (e) => opened.push((e as CustomEvent<ScheduleRunOpen>).detail.run.id));
    run(el, "d").focus();
    const at = () => (document.activeElement as HTMLElement | null)?.dataset.run;
    const press = async (k: string, want: string) => {
      key(document.activeElement!, k);
      await expect.poll(at).toBe(want);
    };
    await press("ArrowLeft", "c");
    await press("Home", "a");
    await press("ArrowLeft", "a");
    await press("End", "d");
    await press("ArrowLeft", "c");
    expect(el.querySelectorAll('.ui-scd__run[tabindex="0"]')).toHaveLength(1);
    (document.activeElement as HTMLButtonElement).click();
    run(el, "a").click();
    expect(opened).toEqual(["c", "a"]);
    // Escape hides the focused run's tooltip
    key(run(el, "a"), "Escape");
    expect(run(el, "a").hasAttribute("data-hush")).toBe(true);
    el.labels = { runNow: "Start", statuses: { failed: "Broke" } };
    await settle();
    expect(el.querySelector(".ui-scd__run-now")!.textContent!.trim()).toBe("Start");
    expect(run(el, "b").querySelector(".tc-sr-only")!.textContent).toMatch(/^Broke, /);
    expect(run(el, "a").querySelector(".tc-sr-only")!.textContent).toMatch(/^Succeeded, /);
  });

  test("React wrapper: uncontrolled pause survives re-renders; controlled stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(ScheduleCard, {
        title: "Digest",
        runs: RUNS,
        nextRun: NEXT,
        now: NOW,
        onPausedChange: (p) => void seen.push(p),
        onRunNow: () => void seen.push("run"),
        onRunOpen: (id) => void seen.push(`open ${id}`),
        "data-n": n,
      } as React.ComponentProps<typeof ScheduleCard>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-schedule-card")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Digest");
    el.querySelector<HTMLButtonElement>(".ui-scd__pause")!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.paused).toBe(true);
    run(el, "b").click();
    el.querySelector<HTMLButtonElement>(".ui-scd__pause")!.click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-scd__run-now")!.click();
    expect(seen).toEqual([true, "open b", false, "run"]);
    await act(async () => root.unmount());
    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    await act(async () => root2.render(React.createElement(ScheduleCard, { runs: RUNS, paused: false, onPausedChange: (p) => void seen.push(p) })));
    await settle();
    const el2 = host2.querySelector("tc-schedule-card")!;
    el2.querySelector<HTMLButtonElement>(".ui-scd__pause")!.click();
    await settle();
    expect(el2.paused).toBe(false);
    expect(seen.at(-1)).toBe(true);
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-schedule-card heading="Ledger reconciliation" schedule="Every Monday at 09:00" .nextRun=${NEXT} .now=${NOW} .runs=${RUNS}></tc-schedule-card>
        <tc-schedule-card look="clean" heading="Digest" paused .runs=${RUNS}></tc-schedule-card>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
