/*
 * illustrations/integration-flow: every step of the cycle (charge, beam, hub) was a React commit; the cycle ran on
 * off screen and in hidden tabs; the default description named Slack, Okta and Snowflake whatever `items` were
 * passed; no className/DOM props/ref on the root.
 */
import { Profiler } from "react";
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { IntegrationFlow } from "@illustrations/integration-flow";

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
const advance = async (ms: number) => {
  for (let t = 0; t < ms; t += 50) await act(async () => vi.advanceTimersByTime(50));
};

describe("illustrations/integration-flow", () => {
  test("one cycle renders only when the pills move on", async () => {
    let commits = 0;
    const { container } = render(
      <Profiler id="if" onRender={() => commits++}>
        <IntegrationFlow />
      </Profiler>,
    );
    const mounted = commits;
    // Into the charge: the centre pill glows without a render
    await advance(800);
    expect(container.querySelector(".ui-if-pills")!.classList.contains("ui-if-charged")).toBe(true);
    expect(commits).toBe(mounted);
    // Through one full cycle (3.2 s): the pills move on, and the exiting pill jumps back
    await advance(3200);
    expect(container.querySelector(".ui-if-link")!.classList.contains("ui-if-sweeping")).toBe(true);
    expect(commits - mounted).toBe(2);
  });

  test("stops while the tab is hidden", async () => {
    render(<IntegrationFlow />);
    await advance(1000);
    hidden = true;
    await act(async () => document.dispatchEvent(new Event("visibilitychange")));
    expect(vi.getTimerCount()).toBe(0);
  });

  test("the default description names the integrations passed in", () => {
    const { container } = render(<IntegrationFlow items={[{ name: "Jira", icon: null }, { name: "Linear", icon: null }]} />);
    expect(container.querySelector(".ui-if")!.getAttribute("aria-label")).toBe("Integrations like Jira and Linear sending data into a central data analysis hub");
  });
  test("runs one round per integration, then rests on the centre pill (WCAG 2.2.2)", async () => {
    const items = [1, 2, 3, 4, 5].map((i) => ({ name: `Tool ${i}`, icon: null }));
    const { container } = render(<IntegrationFlow items={items} />);
    // 0.7 s lead-in, then 5 cycles of 3.2 s
    await advance(700 + 5 * 3200 + 500);
    expect(vi.getTimerCount()).toBe(0);
    expect(container.querySelector(".ui-if-pill[data-phase='3']")).not.toBeNull();
  });

  test("single-colour logos are painted through the pill's own ink filter, so dark mode needs no .dark rule", () => {
    const { container } = render(<IntegrationFlow />);
    const pill = container.querySelector<HTMLElement>(".ui-if-pill[data-fill='black']")!;
    const filter = pill.style.getPropertyValue("--tc-integration-flow-ink").match(/#([^)]+)\)/)![1];
    expect(pill.querySelector(`filter[id="${filter}"] .ui-if-ink`)).not.toBeNull();
  });
});
