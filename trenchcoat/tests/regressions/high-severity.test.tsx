/*
 * Regression tests for High-severity bugs from audit/code-quality-review.md that the smoke test can't see,
 * because the gallery demos happen to avoid them. They started as `test.fails` reproductions in Phase 0
 * and became plain tests when Phase 1 fixed the bugs; each runs in both styles. The ported components' checks moved to tests/elements/.
 */
import { useEffect, useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as thinkingStandard from "@components/thinking-state";
import * as thinkingClean from "@components/thinking-state-clean";
import * as tableStandard from "@components/data-table";
import * as tableClean from "@components/data-table-clean";

const styles = <S, C>(standard: S, clean: C) => [
  ["standard", standard],
  ["clean", clean],
] as const;

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const advance = async (ms: number, step = 100) => {
  for (let t = 0; t < ms; t += step) {
    await act(async () => {
      vi.advanceTimersByTime(step);
    });
  }
};

describe("H3 thinking-state: an inline steps array doesn't restart the timeline on parent renders", () => {
  for (const [style, ui] of styles(thinkingStandard, thinkingClean)) {
    test(style, async () => {
      const onDone = vi.fn();
      function Parent() {
        const [, setTick] = useState(0);
        // A parent re-rendering for unrelated reasons, e.g. streaming tokens
        useEffect(() => {
          const t = setInterval(() => setTick((n) => n + 1), 200);
          return () => clearInterval(t);
        }, []);
        return (
          <ui.ThinkingState
            stepMs={400}
            onDone={onDone}
            steps={[
              { kind: "step", label: "Reading the brief" },
              { kind: "step", label: "Drafting the plan" },
            ]}
          />
        );
      }
      render(<Parent />);
      await advance(6000);
      expect(onDone).toHaveBeenCalled();
    });
  }
});

describe("WCAG 2.1.2 data-table: Tab can leave the grid", () => {
  const columns = [
    { key: "name", label: "Name", type: "title" as const },
    { key: "seats", label: "Seats", type: "number" as const },
  ];
  const rows = [
    { id: "a", name: "Northwind", seats: 12 },
    { id: "b", name: "Contoso", seats: 40 },
  ];
  for (const [style, ui] of styles(tableStandard, tableClean)) {
    test(style, () => {
      render(<ui.DataTable title="Accounts" columns={columns} rows={rows} />);
      const grid = screen.getByRole("grid");
      fireEvent.keyDown(grid, { key: "ArrowDown" }); // activates the first cell
      // fireEvent returns false when the handler called preventDefault()
      const tabsLetThrough = Array.from({ length: columns.length + 1 }, () => fireEvent.keyDown(grid, { key: "Tab" }));
      expect(tabsLetThrough).toContain(true);
    });
  }
});
