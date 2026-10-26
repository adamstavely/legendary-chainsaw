/* experiment-card (Phase 3): open/metric/winner through useControllable, async action with pending and error */
import { Profiler } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import * as standard from "@components/experiment-card";
import * as clean from "@components/experiment-card-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

const variants = [
  { id: "a", key: "A", name: "Current", control: true, values: { cr: 3.1 } },
  { id: "b", key: "B", name: "One-page", values: { cr: 3.6 } },
];
const metrics = [{ id: "cr", label: "Conversion" }];

for (const [style, ui] of styles) {
  describe(`experiment-card ${style}`, () => {
    test("controlled winner and open report changes without applying them", () => {
      const onWinnerChange = vi.fn();
      const onOpenChange = vi.fn();
      render(<ui.ExperimentCard title="Checkout" variants={variants} metrics={metrics} winner={null} onWinnerChange={onWinnerChange} open onOpenChange={onOpenChange} />);
      fireEvent.click(screen.getByRole("button", { name: /^B One-page/ }));
      expect(onWinnerChange).toHaveBeenCalledWith("b");
      expect(screen.getByRole("button", { name: /^B One-page/ }).getAttribute("aria-pressed")).toBe("false");
      fireEvent.click(screen.getByRole("button", { expanded: true }));
      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(screen.getByRole("button", { expanded: true })).toBeTruthy();
    });

    test("an action returning a promise waits, and a rejection can be retried", async () => {
      let reject: (e: Error) => void = () => {};
      const onClick = vi.fn(() => new Promise((_, r) => (reject = r)));
      render(<ui.ExperimentCard title="Checkout" variants={variants} metrics={metrics} defaultOpen defaultWinner="b" action={{ label: "Ship", onClick }} />);
      const button = screen.getByRole("button", { name: "Ship" }) as HTMLButtonElement;
      await act(async () => fireEvent.click(button));
      // aria-disabled (not disabled) while it runs, so it keeps focus
      expect(button.getAttribute("aria-disabled")).toBe("true");
      fireEvent.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);
      await act(async () => reject(new Error("nope")));
      expect(button.getAttribute("aria-disabled")).toBeNull();
      expect(screen.getByText(/Couldn’t finish – try again/)).toBeTruthy();
      await act(async () => fireEvent.click(button));
      expect(onClick).toHaveBeenCalledTimes(2);
    });

    test("a passed ref and the outside-press close both work", () => {
      const ref = { current: null as HTMLDivElement | null };
      const onOpenChange = vi.fn();
      render(<ui.ExperimentCard ref={ref} title="Checkout" variants={variants} metrics={metrics} defaultOpen onOpenChange={onOpenChange} />);
      expect(ref.current?.className).toContain("ui-xc");
      fireEvent.pointerDown(document.body);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });
}

/* Phase 4: switching the metric rolls the numbers in place – not a render per animation frame */
const twoMetrics = [
  { id: "cr", label: "Conversion" },
  { id: "aov", label: "Order value" },
];
const twoValues = [
  { id: "a", key: "A", name: "Current", control: true, values: { cr: 3.1, aov: 40 } },
  { id: "b", key: "B", name: "One-page", values: { cr: 3.6, aov: 52 } },
];
for (const [style, ui] of styles) {
  describe(`experiment-card ${style} – performance`, () => {
    test("a metric switch rolls the values to their new numbers with a couple of renders, not one per frame", async () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "requestAnimationFrame", "cancelAnimationFrame", "performance", "Date"] });
      const matchMedia = window.matchMedia;
      // Motion on: the shared test setup reports no preference
      window.matchMedia = ((q: string) => ({ ...matchMedia(q), matches: false })) as typeof window.matchMedia;
      try {
        let commits = 0;
        const { container } = render(
          <Profiler id="xc" onRender={() => commits++}>
            <ui.ExperimentCard title="Checkout" variants={twoValues} metrics={twoMetrics} defaultOpen />
          </Profiler>,
        );
        const value = () => container.querySelectorAll(".ui-xc__value")[1].textContent;
        expect(value()).toBe("3.6");
        commits = 0;
        fireEvent.click(screen.getByRole("radio", { name: "Order value" }));
        const seen = new Set<string | null>();
        for (let t = 0; t < 800; t += 16) {
          await act(async () => {
            vi.advanceTimersByTime(16);
          });
          seen.add(value());
        }
        expect(value()).toBe("52");
        // It rolled through values on the way…
        expect(seen.size).toBeGreaterThan(5);
        // …with the renders of the switch itself, not one per frame
        expect(commits).toBeLessThanOrEqual(3);
      } finally {
        window.matchMedia = matchMedia;
        vi.useRealTimers();
      }
    });
  });
}

/* WCAG + design pass (f3): rows are toggle buttons (a pick can be cleared), better/worse isn't colour only, the
 * hover caption isn't live but its numbers are in the row name, one status announces the pick, the metric radios
 * take all arrow keys, and a pointer leaving doesn't fold away a focused row */
const rich = [
  { id: "a", key: "A", name: "Current", control: true, visitors: 1200, values: { cr: 3.1 } },
  { id: "b", key: "B", name: "One-page", visitors: 1180, confidence: { cr: 94 }, values: { cr: 3.6 } },
];
const f3Metrics = [
  { id: "cr", label: "Conversion" },
  { id: "bounce", label: "Bounce", lowerIsBetter: true },
];
for (const [style, ui] of styles) {
  describe(`experiment-card ${style} – a11y`, () => {
    test("winner rows are toggle buttons in a group; picking twice clears; a status announces the pick", () => {
      const { container } = render(<ui.ExperimentCard title="Checkout" variants={rich} metrics={metrics} defaultOpen />);
      expect(screen.queryByRole("radio", { name: /^B One-page/ })).toBeNull();
      expect(screen.getByRole("group", { name: "Winner" })).toBeTruthy();
      const status = container.querySelector('[role="status"]')!;
      expect(status.textContent).toBe("");
      const row = screen.getByRole("button", { name: /^B One-page/ });
      fireEvent.click(row);
      expect(row.getAttribute("aria-pressed")).toBe("true");
      expect(status.textContent).toBe("One-page picked");
      fireEvent.click(row);
      expect(row.getAttribute("aria-pressed")).toBe("false");
    });

    test("the row name carries better/worse, visitors and confidence; the caption isn't a live region", () => {
      const { container } = render(<ui.ExperimentCard title="Checkout" variants={rich} metrics={metrics} defaultOpen />);
      const row = screen.getByRole("button", { name: /^B One-page/ });
      expect(row.getAttribute("aria-label")).toBe("B One-page 3.6 +16.1%, up 16.1 percent, better, 1,180 visitors, 94% confidence");
      expect(row.querySelector(".ui-xc__lift svg")).toBeTruthy();
      expect(container.querySelector(".ui-xc__caption")!.hasAttribute("aria-live")).toBe(false);
    });

    test("for a lower-is-better metric a drop reads as better", () => {
      const v = [
        { id: "a", key: "A", name: "Current", control: true, values: { bounce: 40 } },
        { id: "b", key: "B", name: "Lean", values: { bounce: 30 } },
      ];
      render(<ui.ExperimentCard title="Bounce" variants={v} metrics={[f3Metrics[1]]} defaultOpen />);
      expect(screen.getByRole("button", { name: /^B Lean/ }).getAttribute("aria-label")).toMatch(/down 25.0 percent, better/);
    });

    test("metric radios also move with ArrowDown / ArrowUp", () => {
      render(<ui.ExperimentCard title="Checkout" variants={rich} metrics={f3Metrics} defaultOpen />);
      const conversion = screen.getByRole("radio", { name: "Conversion" });
      fireEvent.keyDown(conversion, { key: "ArrowDown" });
      expect(screen.getByRole("radio", { name: "Bounce" }).getAttribute("aria-checked")).toBe("true");
      fireEvent.keyDown(conversion, { key: "ArrowUp" });
      expect(screen.getByRole("radio", { name: "Conversion" }).getAttribute("aria-checked")).toBe("true");
    });

    test("the pointer leaving doesn't fold the card while focus is on a row", () => {
      vi.useFakeTimers();
      try {
        const { container } = render(<ui.ExperimentCard title="Checkout" variants={rich} metrics={metrics} defaultOpen />);
        const row = screen.getByRole("button", { name: /^B One-page/ });
        row.focus();
        fireEvent.pointerLeave(container.querySelector(".ui-xc")!, { pointerType: "mouse" });
        act(() => vi.advanceTimersByTime(400));
        expect(container.querySelector(".ui-xc")!.hasAttribute("data-open")).toBe(true);
        expect(document.activeElement).toBe(row);
      } finally {
        vi.useRealTimers();
      }
    });
  });
}
