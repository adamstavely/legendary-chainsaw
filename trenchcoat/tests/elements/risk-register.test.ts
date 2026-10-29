/*
 * <tc-risk-register> in real browsers: bands and counts, the grid's keys and filter, sorting, opening a risk and
 * rescoring it, moves since the last review, read only, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/risk-register";
import {
  riskBand,
  type Risk,
  type RiskRisksChange,
  type TcRiskRegister,
} from "../../src/elements/risk-register";
import { RiskRegister } from "../../src/elements/react/risk-register";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const RISKS: Risk[] = [
  {
    id: "storm",
    title: "Storm damage",
    likelihood: 4,
    impact: 5,
    owner: "Okafor",
    status: "mitigating",
    trend: "up",
    previous: { likelihood: 3, impact: 5 },
    mitigation: "Anchor the frames.",
  },
  {
    id: "permit",
    title: "Permit delay",
    likelihood: 2,
    impact: 4,
    owner: "Haddad",
    status: "open",
    trend: "down",
  },
  {
    id: "boat",
    title: "Boat out of service",
    likelihood: 3,
    impact: 2,
    owner: "Silva",
    status: "accepted",
  },
  {
    id: "kit",
    title: "Kit servicing",
    likelihood: 4,
    impact: 1,
    owner: "Abbott",
    status: "closed",
  },
  {
    id: "divers",
    title: "Too few divers",
    likelihood: 2,
    impact: 4,
    owner: "Mensah",
    status: "open",
  },
];
const make = (look = "standard", risks = RISKS) =>
  fixture<TcRiskRegister>(
    html`<tc-risk-register
      look=${look}
      heading="Field risks"
      .risks=${risks}
    ></tc-risk-register>`,
  );
const text = (el: Element | null | undefined) =>
  (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const titles = (el: Element) =>
  [...el.querySelectorAll(".ui-rrg__title")].map(text);
const cell = (el: Element, l: number, i: number) =>
  el.querySelector<HTMLElement>(`[data-cell="${l}:${i}"]`)!;
const key = (t: Element, k: string, init: KeyboardEventInit = {}) =>
  t.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: k,
      bubbles: true,
      cancelable: true,
      ...init,
    }),
  );

describe("tc-risk-register", () => {
  test("bands: 1–4 low, 5–9 medium, 10–16 high, 20–25 critical", () => {
    expect([1, 4, 5, 9, 10, 16, 20, 25].map(riskBand)).toEqual([
      "low",
      "low",
      "medium",
      "medium",
      "high",
      "high",
      "critical",
      "critical",
    ]);
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a 5 × 5 grid with counts and bands named, a legend, and the register by score`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("rrg");
      const grid = el.querySelector('[role="grid"]')!;
      expect(grid.getAttribute("aria-labelledby")).toBe(
        el.querySelector(".tc-head__title")!.id,
      );
      expect(el.querySelectorAll('[role="gridcell"]')).toHaveLength(25);
      expect(cell(el, 2, 4).getAttribute("aria-label")).toBe(
        "Likelihood 2 Unlikely, impact 4 Major: 2 risks, Medium",
      );
      expect(text(cell(el, 2, 4))).toBe("2");
      expect(cell(el, 4, 5).dataset.band).toBe("critical");
      expect(
        el.querySelectorAll('[role="gridcell"][tabindex="0"]'),
      ).toHaveLength(1);
      expect(text(el.querySelector(".ui-rrg__legend"))).toBe(
        "1 critical 3 medium 1 low",
      );
      expect(titles(el)).toEqual([
        "Storm damage",
        "Permit delay",
        "Too few divers",
        "Boat out of service",
        "Kit servicing",
      ]);
      // A move since the last review is drawn
      expect(el.querySelectorAll(".ui-rrg__moves line")).toHaveLength(1);
    });
  }

  test("the grid: arrows move, Enter filters to the cell (cancelable tc-cell-change), again or Escape clears", async () => {
    const el = await make();
    const cells: unknown[] = [];
    el.addEventListener("tc-cell-change", (e) =>
      cells.push((e as CustomEvent).detail.cell),
    );
    cell(el, 1, 5).focus();
    key(cell(el, 1, 5), "ArrowRight");
    await settle();
    key(cell(el, 2, 5), "ArrowDown");
    await settle();
    expect(document.activeElement).toBe(cell(el, 2, 4));
    key(cell(el, 2, 4), "Enter");
    await settle();
    expect(el.cell).toEqual({ likelihood: 2, impact: 4 });
    expect(titles(el)).toEqual(["Permit delay", "Too few divers"]);
    expect(cell(el, 2, 4).getAttribute("aria-selected")).toBe("true");
    expect(text(el.querySelector(".ui-rrg__chip"))).toContain(
      "Likelihood 2 Unlikely, impact 4 Major",
    );
    key(cell(el, 2, 4), "Escape");
    await settle();
    expect(el.cell).toBeNull();
    cell(el, 5, 5).click();
    await settle();
    expect(text(el.querySelector(".ui-rrg__empty"))).toBe(
      "No risks in this cell.",
    );
    el.addEventListener("tc-cell-change", (e) => e.preventDefault(), {
      once: true,
    });
    cell(el, 5, 5).click();
    await settle();
    expect(el.cell).toEqual({ likelihood: 5, impact: 5 });
    expect(cells).toEqual([
      { likelihood: 2, impact: 4 },
      null,
      { likelihood: 5, impact: 5 },
      null,
    ]);
    key(cell(el, 5, 5), "Home", { ctrlKey: true, metaKey: true });
    await settle();
    expect(document.activeElement).toBe(cell(el, 1, 5));
  });

  test("sorting: a column's button sorts, again reverses; aria-sort follows", async () => {
    const el = await make();
    const sorts: unknown[] = [];
    el.addEventListener("tc-sort-change", (e) =>
      sorts.push((e as CustomEvent).detail),
    );
    const btn = (label: string) =>
      [...el.querySelectorAll<HTMLButtonElement>(".ui-rrg__sort")].find((b) =>
        text(b).startsWith(label),
      )!;
    btn("Owner").click();
    await settle();
    expect(titles(el)).toEqual([
      "Kit servicing",
      "Permit delay",
      "Too few divers",
      "Storm damage",
      "Boat out of service",
    ]);
    expect(btn("Owner").closest("th")!.getAttribute("aria-sort")).toBe(
      "ascending",
    );
    btn("Owner").click();
    await settle();
    expect(titles(el)[0]).toBe("Boat out of service");
    expect(sorts).toEqual([
      { sort: "owner", sortDir: "asc" },
      { sort: "owner", sortDir: "desc" },
    ]);
  });

  test("opening a risk: its detail below the row, rescoring fires tc-risks-change; prevented, the score stays", async () => {
    const el = await make();
    const seen: RiskRisksChange[] = [];
    el.addEventListener("tc-risks-change", (e) =>
      seen.push((e as CustomEvent<RiskRisksChange>).detail),
    );
    const title = el.querySelector<HTMLButtonElement>(
      '[data-id="storm"] .ui-rrg__title',
    )!;
    title.click();
    await settle();
    expect(el.selected).toBe("storm");
    expect(title.getAttribute("aria-expanded")).toBe("true");
    const detail = el.querySelector(".ui-rrg__detail")!;
    expect(text(detail.querySelector(".ui-rrg__detail-score"))).toBe(
      "Score 20 · Critical (was 15)",
    );
    expect(text(detail.querySelector(".ui-rrg__mitigation"))).toBe(
      "Mitigation Anchor the frames.",
    );
    const impact2 = detail
      .querySelectorAll<HTMLInputElement>("fieldset")[1]
      .querySelectorAll<HTMLInputElement>("input")[1];
    expect(impact2.getAttribute("aria-label")).toBe("2 Minor");
    impact2.click();
    await settle();
    expect(el.risks.find((r) => r.id === "storm")).toMatchObject({
      likelihood: 4,
      impact: 2,
    });
    expect(seen[0].change).toEqual({ id: "storm", likelihood: 4, impact: 2 });
    expect(text(el.querySelector(".ui-rrg__detail-score"))).toBe(
      "Score 8 · Medium (was 15)",
    );
    el.addEventListener("tc-risks-change", (e) => e.preventDefault(), {
      once: true,
    });
    el.querySelector(".ui-rrg__detail")!
      .querySelectorAll("fieldset")[0]
      .querySelectorAll<HTMLInputElement>("input")[0]
      .click();
    await settle();
    expect(el.risks.find((r) => r.id === "storm")!.likelihood).toBe(4);
    // The level that's still true stays checked
    const likelihoods = el
      .querySelector(".ui-rrg__detail")!
      .querySelectorAll("fieldset")[0]
      .querySelectorAll<HTMLInputElement>("input");
    expect(likelihoods[3].checked).toBe(true);
    expect(likelihoods[0].checked).toBe(false);
    // Close returns focus to the title
    el.querySelector<HTMLButtonElement>(".ui-rrg__close")!.click();
    await settle();
    expect(el.selected).toBeNull();
    expect(document.activeElement).toBe(
      el.querySelector('[data-id="storm"] .ui-rrg__title'),
    );
  });

  test("rescoring an open risk: it stays listed though it leaves the cell, and its picker keeps focus as the row moves", async () => {
    const el = await make();
    // Filtered to likelihood 4 × impact 5: only Storm damage
    key(cell(el, 4, 5), "Enter");
    await settle();
    expect(titles(el)).toEqual(["Storm damage"]);
    el.querySelector<HTMLButtonElement>(
      '[data-id="storm"] .ui-rrg__title',
    )!.click();
    await settle();
    const impact1 = el
      .querySelector(".ui-rrg__detail")!
      .querySelectorAll("fieldset")[1]
      .querySelectorAll<HTMLInputElement>("input")[0];
    impact1.focus();
    impact1.click();
    await settle();
    expect(el.risks.find((r) => r.id === "storm")!.impact).toBe(1);
    expect(titles(el)).toEqual(["Storm damage"]);
    expect(el.querySelector(".ui-rrg__detail")).not.toBeNull();
    // Closed, it leaves the filtered list
    el.querySelector<HTMLButtonElement>(".ui-rrg__close")!.click();
    await settle();
    expect(titles(el)).toEqual([]);
    // Unfiltered and sorted by score, a rescore moves the row; focus follows it
    key(cell(el, 4, 5), "Escape");
    await settle();
    el.querySelector<HTMLButtonElement>(
      '[data-id="kit"] .ui-rrg__title',
    )!.click();
    await settle();
    expect(titles(el)[0]).not.toBe("Kit servicing");
    const impact5 = el
      .querySelector(".ui-rrg__detail")!
      .querySelectorAll("fieldset")[1]
      .querySelectorAll<HTMLInputElement>("input")[4];
    impact5.focus();
    impact5.click();
    await settle();
    expect(titles(el)[0]).toBe("Kit servicing");
    await expect
      .poll(() => document.activeElement)
      .toBe(
        el
          .querySelector(".ui-rrg__detail")!
          .querySelectorAll("fieldset")[1]
          .querySelectorAll("input")[4],
      );
  });

  test("read only: a risk opens but can't be rescored; renamed level words; empty", async () => {
    const el = await fixture<TcRiskRegister>(
      html`<tc-risk-register
        readonly
        selected="permit"
        .labels=${{ impact: ["Tiny", "Small", "Medium", "Big", "Huge"] }}
        .risks=${RISKS}
      ></tc-risk-register>`,
    );
    expect(el.querySelector(".ui-rrg__detail")).not.toBeNull();
    expect(el.querySelector(".ui-rrg__pickers")).toBeNull();
    expect(cell(el, 1, 5).getAttribute("aria-label")).toContain(
      "impact 5 Huge",
    );
    const empty = await make("standard", []);
    expect(text(empty.querySelector(".ui-rrg__empty"))).toBe(
      "No risks recorded yet.",
    );
  });

  test("React wrapper: uncontrolled rescoring survives re-renders; controlled selection stays until the parent changes it", async () => {
    (
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const lists: Risk[][] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(RiskRegister, {
        title: "Mine",
        defaultRisks: RISKS,
        defaultSelected: "storm",
        onRisksChange: (next) => void lists.push(next),
        "data-n": n,
      } as React.ComponentProps<typeof RiskRegister>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-risk-register")!;
    el.querySelector(".ui-rrg__detail")!
      .querySelectorAll("fieldset")[0]
      .querySelectorAll<HTMLInputElement>("input")[0]
      .click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.risks.find((r) => r.id === "storm")!.likelihood).toBe(1);
    expect(lists).toHaveLength(1);
    await act(async () =>
      root.render(
        React.createElement(RiskRegister, { risks: RISKS, selected: null }),
      ),
    );
    await settle();
    const held = host.querySelector("tc-risk-register")!;
    held
      .querySelector<HTMLButtonElement>('[data-id="storm"] .ui-rrg__title')!
      .click();
    await settle();
    expect(held.selected).toBeNull();
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, filtered and with a risk open`, async () => {
      const wrap = await fixture(
        html`<div
          data-tc-theme=${theme}
          style="padding: 16px; background: var(--tc-surface-base)"
        >
          <tc-risk-register
            heading="Field risks"
            description="Reviewed monthly"
            selected="storm"
            .risks=${RISKS}
          ></tc-risk-register>
          <tc-risk-register
            look="clean"
            heading="Filtered"
            .cell=${{ likelihood: 2, impact: 4 }}
            .risks=${RISKS}
          ></tc-risk-register>
          <div style="width: 380px">
            <tc-risk-register
              heading="Narrow"
              selected="permit"
              .risks=${RISKS}
            ></tc-risk-register>
          </div>
        </div>`,
      );
      await finish(wrap);
      const result = await axe.run(wrap, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
        },
        resultTypes: ["violations"],
      });
      expect(
        result.violations.map(
          (v) =>
            `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
        ),
      ).toEqual([]);
    });
  }
});
