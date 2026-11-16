/* screens/agent-orchestration: the run's status, cost and clock follow the simulation; answers from the side panel
   move it along; Stop stops the clock; nothing keeps running once the screen is gone */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AgentOrchestrationScreen } from "@screens/agent-orchestration";

const run = async (ms: number) => {
  for (let t = 0; t < ms; t += 500) await act(async () => vi.advanceTimersByTime(500));
};
const pill = (c: HTMLElement) => c.querySelector(".ui-aorch__pill")!.textContent;
const clock = (c: HTMLElement) => c.querySelector(".ui-aorch__clock")!.textContent;

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("screens/agent-orchestration", () => {
  test("the run waits on you, and answers from the side panel let it finish", async () => {
    const onResolve = vi.fn();
    const { container, rerender } = render(<AgentOrchestrationScreen selected="loan" onSelectedChange={() => {}} onResolve={onResolve} />);
    expect(pill(container)).toBe("Running");
    await run(16_000);
    expect(pill(container)).toBe("Needs you");
    // jsdom has no width, so the side panel starts closed as on a narrow screen
    fireEvent.click(screen.getByRole("button", { name: "Show agent details" }));
    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    expect(onResolve).toHaveBeenCalledWith("loan", "approve");
    rerender(<AgentOrchestrationScreen selected="catalogue" onSelectedChange={() => {}} onResolve={onResolve} />);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onResolve).toHaveBeenCalledWith("catalogue", "retry");
    await run(40_000);
    expect(pill(container)).toBe("Done");
    expect(screen.getByRole("button", { name: /Run again/ })).toBeTruthy();
  });

  test("Stop stops the clock and the run, and Run again starts over", async () => {
    const onStop = vi.fn();
    const { container } = render(<AgentOrchestrationScreen onStop={onStop} />);
    await run(3_000);
    fireEvent.click(screen.getByRole("button", { name: /Stop run/ }));
    expect(onStop).toHaveBeenCalled();
    expect(pill(container)).toBe("Stopped");
    const at = clock(container);
    await run(5_000);
    expect(clock(container)).toBe(at);
    fireEvent.click(screen.getByRole("button", { name: /Run again/ }));
    expect(clock(container)).toBe("0:00");
    expect(pill(container)).toBe("Running");
  });

  test("opening a task from the panel moves the panel to that agent", async () => {
    render(<AgentOrchestrationScreen defaultSelected="lead" />);
    await run(5_000);
    fireEvent.click(screen.getByRole("button", { name: "Show agent details" }));
    expect(screen.getByRole("complementary", { name: "Orchestrator details" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Search three journal indexes/ }));
    expect(screen.getByRole("complementary", { name: "Database search details" })).toBeTruthy();
    expect(screen.getByRole("meter", { name: "Context window used" })).toBeTruthy();
  });

  test("unmounting mid-run leaves no timers of the screen's own", async () => {
    const { unmount } = render(<AgentOrchestrationScreen />);
    await run(1_000);
    const before = vi.getTimerCount();
    unmount();
    expect(vi.getTimerCount()).toBeLessThan(before);
  });

  test("no reach into other components' classes, no zoom, no endless loop", async () => {
    const { readFileSync } = await import("node:fs");
    const css = readFileSync("screens/agent-orchestration.tsx", "utf8");
    expect(css).not.toMatch(/zoom\s*:/);
    expect(css).not.toMatch(/\.ui-(at|tw|button)__/);
    expect(css).not.toMatch(/infinite/);
  });
});
