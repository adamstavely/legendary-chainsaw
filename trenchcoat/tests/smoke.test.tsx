/*
 * Smoke test: every gallery demo, in every style it ships in, under StrictMode with fake timers.
 *   · renders without errors (thrown, console.error, uncaught, unhandled rejections)
 *   · runs 5 simulated seconds, one animation frame at a time, within its render budget (React commits)
 *   · leaves no timers or animation frames running after unmount
 * Known failures are listed in known-issues.ts and run as `test.fails`, so fixing one
 * makes the suite fail until it's removed from the list – the list can only shrink.
 */
import { Component, Profiler, StrictMode, type ReactNode } from "react";
import { act, render } from "@testing-library/react";
import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { writeFileSync } from "node:fs";
import { ENTRIES, type Variant } from "../app/src/registry";
import { BUDGET_FILE, KNOWN_ISSUES, readBudgets } from "./known-issues";

// Step one frame at a time: act() batches every update inside a step into one commit,
// so coarser steps would hide components that re-render on every frame
const SECONDS = 5;
const STEP_MS = 16;

const budgets = readBudgets();
const measured: Record<string, number> = {};

let errors: string[] = [];
const onError = (e: ErrorEvent) => errors.push(`uncaught: ${e.message}`);
const onRejection = (reason: unknown) => errors.push(`unhandled rejection: ${String(reason)}`);

beforeEach(() => {
  errors = [];
  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"],
    now: new Date("2026-10-24T12:00:00Z"),
  });
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => errors.push(args.map(String).join(" ").slice(0, 300)));
  window.addEventListener("error", onError);
  process.on("unhandledRejection", onRejection);
});

afterEach(() => {
  window.removeEventListener("error", onError);
  process.off("unhandledRejection", onRejection);
  vi.useRealTimers();
  vi.restoreAllMocks();
});

afterAll(() => {
  // UPDATE_BUDGETS=1 npm test rewrites the baseline after an intended change
  if (process.env.UPDATE_BUDGETS) writeFileSync(BUDGET_FILE, JSON.stringify(Object.fromEntries(Object.entries(measured).sort()), null, 2) + "\n");
});

class Boundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) errors.push(`render: ${this.state.error.message}`);
    return this.state.error ? null : this.props.children;
  }
}

const cases = ENTRIES.flatMap((entry) =>
  (Object.keys(entry.load) as Variant[]).filter(() => entry.Demo).map((variant) => ({ entry, variant, key: `${entry.id}:${variant}` })),
);

describe("smoke", () => {
  test("every gallery entry has a demo", () => {
    expect(ENTRIES.filter((e) => !e.Demo).map((e) => e.id)).toEqual([]);
  });

  for (const { entry, variant, key } of cases) {
    const known = KNOWN_ISSUES[key];
    const run = known ? test.fails : test;

    run(`${key}${known ? ` – known: ${known}` : ""}`, async () => {
      const ui = await entry.load[variant]!();
      const Demo = entry.Demo!;
      let commits = 0;

      const view = render(
        <StrictMode>
          <Profiler id={key} onRender={() => commits++}>
            <Boundary>
              <Demo ui={ui} />
            </Boundary>
          </Profiler>
        </StrictMode>,
      );
      for (let t = 0; t < SECONDS * 1000; t += STEP_MS) {
        await act(async () => {
          vi.advanceTimersByTime(STEP_MS);
        });
      }
      measured[key] = commits;

      view.unmount();
      const leftover = vi.getTimerCount();

      expect(errors.join("\n"), "errors while rendering").toBe("");
      // Re-rendering on most frames means state is driving animation (or a render loop); animate the DOM instead
      const frames = (SECONDS * 1000) / STEP_MS;
      expect(commits / frames, "share of animation frames with a React commit").toBeLessThanOrEqual(0.5);
      // Budget: the recorded baseline plus 30% (and at least 15 commits) of headroom. React's scheduler runs on
      // real timers the fake clock doesn't control, so components that update often batch slightly differently
      // from run to run; render loops are caught by the frame-share check above. New entries get a generous default.
      const budget = budgets[key] ?? 300;
      expect(commits, `React commits in ${SECONDS}s`).toBeLessThanOrEqual(Math.max(Math.ceil(budget * 1.3), budget + 15));
      expect(leftover, "timers/frames still pending after unmount").toBe(0);
    });
  }
});
