/* blocks/kpi-board: rolling numbers re-rendered React on every frame (49 commits per 5 s); the range was half-controlled.
 * WCAG + design pass: the keyboard-active option had only a faint fill (now a ring, 1.4.11); Set up and the action
 * are library Buttons; the pale "last period" number is text-coloured (1.4.3) with a swatch beside its label. */
import { Profiler } from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { KpiBoard } from "@blocks/kpi-board";

const set = (scale: number) => {
  const labels = ["1 Oct", "2 Oct", "3 Oct"];
  const values = [300, 500, 400].map((v) => v * scale);
  return {
    stats: [{ id: "orders", label: "Orders", kind: "count" as const, labels, values, previous: 1000 }],
    overview: { title: "Gross volume", labels, current: values, previous: [200, 400, 300] },
    focus: { title: "Pro plan", metric: "Sales", labels, values, previous: 900 },
  };
};
const data = { "7d": set(1), "30d": set(2) };
const ranges = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
];
const orders = (c: HTMLElement) => c.querySelector('[aria-label="Orders"] .ui-kb__pair b')!.textContent;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance", "setTimeout", "clearTimeout"] });
  vi.spyOn(window, "matchMedia").mockImplementation((q: string) => ({ matches: false, media: q }) as MediaQueryList);
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("blocks/kpi-board", () => {
  test("numbers roll up through the DOM, not through React renders", async () => {
    let commits = 0;
    const { container } = render(
      <Profiler id="kb" onRender={() => commits++}>
        <KpiBoard data={data} ranges={ranges} />
      </Profiler>,
    );
    expect(orders(container)).toBe("0");
    await act(async () => vi.advanceTimersByTime(300));
    const mid = Number(orders(container)!.replace(/,/g, ""));
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1200);
    // One frame at a time – act() would batch a coarser step into one commit
    for (let t = 0; t < 1000; t += 16) await act(async () => vi.advanceTimersByTime(16));
    expect(orders(container)).toBe("1,200");
    expect(commits).toBe(1);
  });

  test("a new range rolls from the old numbers to the new ones", async () => {
    const { container, rerender } = render(<KpiBoard data={data} ranges={ranges} range="7d" onRangeChange={() => {}} />);
    await act(async () => vi.advanceTimersByTime(1000));
    rerender(<KpiBoard data={data} ranges={ranges} range="30d" onRangeChange={() => {}} />);
    expect(orders(container)).toBe("1,200");
    await act(async () => vi.advanceTimersByTime(300));
    const mid = Number(orders(container)!.replace(/,/g, ""));
    expect(mid).toBeGreaterThan(1200);
    expect(mid).toBeLessThan(2400);
    await act(async () => vi.advanceTimersByTime(1000));
    expect(orders(container)).toBe("2,400");
  });

  test("a controlled range reports a pick without moving; uncontrolled moves and reports", async () => {
    const onRangeChange = vi.fn();
    const pick = (c: HTMLElement) => {
      fireEvent.click(c.querySelector('[aria-label="Date range"]')!);
      fireEvent.click([...c.querySelectorAll('[role="option"]')].find((o) => o.textContent === "Last 30 days")!);
    };
    const controlled = render(<KpiBoard data={data} ranges={ranges} range="7d" onRangeChange={onRangeChange} />);
    pick(controlled.container);
    expect(onRangeChange).toHaveBeenCalledWith("30d");
    expect(controlled.container.querySelector('[aria-label="Date range"]')!.textContent).toBe("Last 7 days");
    controlled.unmount();

    const onChange = vi.fn();
    const own = render(<KpiBoard data={data} ranges={ranges} defaultRange="7d" onRangeChange={onChange} />);
    pick(own.container);
    expect(onChange).toHaveBeenCalledWith("30d");
    expect(own.container.querySelector('[aria-label="Date range"]')!.textContent).toBe("Last 30 days");
  });

  test("the keyboard-active option gets a ring; the pointer takes it away; Escape keeps focus on the trigger", () => {
    const { container } = render(<KpiBoard data={data} ranges={ranges} />);
    const trigger = container.querySelector<HTMLElement>('[aria-label="Date range"]')!;
    const pick = trigger.parentElement!;
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(pick.hasAttribute("data-keys")).toBe(true);
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const active = container.querySelector('[role="option"][data-active]')!;
    expect(trigger.getAttribute("aria-activedescendant")).toBe(active.id);
    fireEvent.pointerEnter(container.querySelectorAll('[role="option"]')[0]);
    expect(pick.hasAttribute("data-keys")).toBe(false);
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  test("Set up and the action are library Buttons; the soft legend number is labelled by its swatch", () => {
    const setup = vi.fn();
    const action = vi.fn();
    const { container } = render(
      <KpiBoard data={data} ranges={ranges} setup={{ label: "Set up", onClick: setup }} action={{ label: "View report", onClick: action }} />,
    );
    const setUp = container.querySelector<HTMLButtonElement>(".ui-kb__setup")!;
    const view = container.querySelector<HTMLButtonElement>(".ui-kb__action")!;
    expect(setUp.classList.contains("ui-button")).toBe(true);
    expect(setUp.getAttribute("data-variant")).toBe("secondary");
    expect(view.classList.contains("ui-button")).toBe(true);
    fireEvent.click(setUp);
    fireEvent.click(view);
    expect(setup).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledTimes(1);
    expect(container.querySelector('.ui-kb__legend span[data-soft=""]')!.textContent).toBe("Last period");
  });
});
