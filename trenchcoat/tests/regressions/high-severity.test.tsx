/*
 * Regression tests for High-severity bugs from audit/code-quality-review.md that the smoke test can't see,
 * because the gallery demos happen to avoid them. They started as `test.fails` reproductions in Phase 0
 * and became plain tests when Phase 1 fixed the bugs; each runs in both styles.
 */
import { createRef, useEffect, useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as billingStandard from "@components/billing-schedule";
import * as billingClean from "@components/billing-schedule-clean";
import * as thinkingStandard from "@components/thinking-state";
import * as thinkingClean from "@components/thinking-state-clean";
import * as decisionStandard from "@components/decision-tree";
import * as decisionClean from "@components/decision-tree-clean";
import * as tableStandard from "@components/data-table";
import * as tableClean from "@components/data-table-clean";
import * as menuStandard from "@components/command-menu";
import * as menuClean from "@components/command-menu-clean";

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

describe("H2 billing-schedule: an inline onChange handler doesn't loop", () => {
  for (const [style, ui] of styles(billingStandard, billingClean)) {
    test(style, async () => {
      let calls = 0;
      function Parent() {
        const [, setSchedule] = useState<unknown>();
        // The natural usage; capped so the loop can't hang the test
        return <ui.BillingSchedule onChange={(s) => ++calls < 50 && setSchedule(s)} />;
      }
      render(<Parent />);
      await advance(500);
      // Expected: no call on mount, and certainly not one per render
      expect(calls).toBeLessThanOrEqual(1);
    });
  }
});

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

describe("H5 decision-tree: a rejected onChoose doesn't leave it stuck", () => {
  const decision = {
    id: "d1",
    question: "Roll back the release?",
    agent: "Release agent",
    options: [{ label: "Roll back" }, { label: "Keep it live" }],
  };
  for (const [style, ui] of styles(decisionStandard, decisionClean)) {
    test(style, async () => {
      const onChoose = vi.fn().mockRejectedValueOnce(new Error("[expected] network down")).mockResolvedValue(undefined);
      const ref = createRef<decisionStandard.DecisionTreeHandle>();
      render(<ui.DecisionTree ref={ref} decisions={[decision]} onChoose={onChoose} />);
      await act(async () => {
        ref.current!.setOther("Wait for the hotfix instead");
      });
      await act(async () => {
        ref.current!.send();
      });
      await advance(200);
      // After the failure the user should be able to try again
      await act(async () => {
        ref.current!.choose(0);
      });
      expect(onChoose).toHaveBeenCalledTimes(2);
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

describe("WCAG 2.1.2 command-menu: Tab isn't swallowed", () => {
  for (const [style, ui] of styles(menuStandard, menuClean)) {
    test(style, () => {
      render(<ui.CommandMenu />);
      const input = screen.getByRole("combobox");
      expect(fireEvent.keyDown(input, { key: "Tab" })).toBe(true);
    });
  }
});
