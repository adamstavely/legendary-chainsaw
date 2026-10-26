/*
 * illustrations/agent-team: the prompt typed itself through React state – one commit per letter (43 in 5 s) –
 * and the loop kept running off screen and in hidden tabs.
 */
import { Profiler } from "react";
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AgentTeam, type AgentTeamMember } from "@illustrations/agent-team";

let hidden = false;
beforeEach(() => {
  vi.useFakeTimers();
  hidden = false;
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hidden ? "hidden" : "visible") });
});
afterEach(() => {
  vi.useRealTimers();
  // @ts-expect-error – drop the own-property override, back to jsdom's getter
  delete document.visibilityState;
});

const face = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";
const members: [AgentTeamMember, AgentTeamMember, AgentTeamMember] = [
  { role: "Researcher", avatar: face },
  { role: "SDR", avatar: face },
  { role: "Ops", avatar: face },
];
const advance = async (ms: number) => {
  for (let t = 0; t < ms; t += 50) await act(async () => vi.advanceTimersByTime(50));
};

describe("illustrations/agent-team", () => {
  test("types the prompt and moves through the phases without re-rendering", async () => {
    let commits = 0;
    const { container } = render(
      <Profiler id="at" onRender={() => commits++}>
        <AgentTeam prompt="Build a team" members={members} />
      </Profiler>,
    );
    const root = container.querySelector<HTMLElement>(".ui-at")!;
    const mounted = commits;
    await advance(1000);
    expect(root.querySelector(".ui-at-text")!.textContent).toBe("Build a team");
    await advance(1500);
    expect(root.dataset.phase).toBe("team");
    expect(commits).toBe(mounted);
  });

  test("holds still while the tab is hidden and starts over when it's back", async () => {
    const { container, unmount } = render(<AgentTeam prompt="Build a team" members={members} />);
    await advance(200);
    hidden = true;
    await act(async () => document.dispatchEvent(new Event("visibilitychange")));
    expect(vi.getTimerCount()).toBe(0);
    hidden = false;
    await act(async () => document.dispatchEvent(new Event("visibilitychange")));
    expect(container.querySelector<HTMLElement>(".ui-at")!.dataset.phase).toBe("typing");
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  test("starts over three times, then rests on the finished team (WCAG 2.2.2)", async () => {
    const { container } = render(<AgentTeam prompt="Build a team" members={members} />);
    await advance(3 * 7000);
    expect(container.querySelector<HTMLElement>(".ui-at")!.dataset.phase).toBe("team");
    expect(vi.getTimerCount()).toBe(0);
  });
});
