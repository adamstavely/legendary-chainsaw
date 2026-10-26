/* screens/agent-run: the header clock re-rendered the whole screen every second; the start time was read while
   rendering; the plan warned about controlled steps; onApprove couldn't be async */
import { Profiler } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AgentRunScreen } from "@screens/agent-run";

const run = async (ms: number) => {
  for (let t = 0; t < ms; t += 50) await act(async () => vi.advanceTimersByTime(50));
};
const clockText = (c: HTMLElement) => c.querySelector(".ui-ar__time")!.textContent;
const pill = (c: HTMLElement) => c.querySelector(".ui-ar__pill")!.textContent;

beforeEach(() => {
  vi.useFakeTimers({ now: new Date("2026-10-24T12:00:00Z") });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("screens/agent-run", () => {
  test("the clock ticks in the DOM without React renders, and no controlled-steps warning", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    let commits = 0;
    const { container } = render(
      <Profiler id="ar" onRender={() => commits++}>
        <AgentRunScreen />
      </Profiler>,
    );
    // Runs up to the approval and waits there
    await run(10_000);
    expect(pill(container)).toBe("Needs input");
    const before = commits;
    const shown = clockText(container);
    await run(5_000);
    expect(clockText(container)).not.toBe(shown);
    expect(clockText(container)).toMatch(/Started .* · 0:1\d/);
    expect(commits - before).toBe(0);
    expect(warn).not.toHaveBeenCalled();
  });

  test("an onApprove promise holds the run; a rejection keeps it waiting, a retry carries on", async () => {
    let attempt = 0;
    const onApprove = vi.fn(() => (++attempt === 1 ? Promise.reject(new Error("Mail server down")) : Promise.resolve()));
    const { container } = render(<AgentRunScreen onApprove={onApprove} />);
    await run(10_000);
    // jsdom has no width, so the side panel starts closed as on a narrow screen
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    fireEvent.click(screen.getByRole("button", { name: /^approve/i }));
    await run(500);
    expect(onApprove).toHaveBeenCalledWith("send");
    expect(pill(container)).toBe("Needs input");
    fireEvent.click(screen.getByRole("button", { name: /^approve/i }));
    await run(500);
    expect(pill(container)).toBe("Running");
    await run(5_000);
    expect(pill(container)).toBe("Done");
    expect(clockText(container)).toMatch(/^Done in \d+s$/);
  });

  test("unmounting mid-run leaves no timers", async () => {
    const { unmount } = render(<AgentRunScreen />);
    await run(1_000);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  test("no reach into other components' classes and no zoom (WCAG + design pass, s1)", async () => {
    const { readFileSync } = await import("node:fs");
    const css = readFileSync("screens/agent-run.tsx", "utf8");
    expect(css).not.toMatch(/zoom\s*:/);
    expect(css).not.toMatch(/\.ui-(pl|df|ap|tc|um|kpi|think|dt|sg|fm|button)\b/);
  });

  test("the live dot's breathing stops after a few cycles and the waiting count uses the status colours", async () => {
    const { readFileSync } = await import("node:fs");
    const css = readFileSync("screens/agent-run.tsx", "utf8");
    expect(css).not.toMatch(/ui-ar-breathe[^;]*infinite/);
    expect(css).not.toMatch(/#d97706/);
  });
});
