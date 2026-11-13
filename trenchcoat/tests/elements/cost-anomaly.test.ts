/*
 * <tc-cost-anomaly> in real browsers: the headline in words and numbers, the chart and its band, the caption and table,
 * causes with their shares, evidence, the actions and their events, marking as expected with Undo and focus, the React
 * wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/cost-anomaly";
import { anomalySpike, type AnomalyCause, type AnomalyEvidence, type AnomalyEvidenceOpen, type AnomalyStatusChange, type AnomalyTarget, type CostDay, type TcCostAnomaly } from "../../src/elements/cost-anomaly";
import { CostAnomaly } from "../../src/elements/react/cost-anomaly";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const DAY = 86_400_000;
const START = Date.UTC(2026, 10, 9);
/** Five ordinary days, then 1,640 against 400 expected: 1,240 over, 310% above */
const DAYS: CostDay[] = [410, 380, 420, 395, 402, 1640].map((spend, i) => ({ date: START + i * DAY, spend, expected: 400, low: 340, high: 460 }));
const CAUSES: AnomalyCause[] = [
  { id: "inv", kind: "agent", name: "Invoice matcher", share: 0.75, note: "Retried every invoice" },
  { id: "l1", kind: "model", name: "large-1", share: 0.25 },
];
const EVIDENCE: AnomalyEvidence[] = [{ id: "r1", label: "Run 8f2c", detail: "6 retries", cost: 38, at: START + 5 * DAY + 9 * 3_600_000 }];
const text = (el: Element | null) => el!.textContent!.replace(/\s+/g, " ").trim();
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcCostAnomaly>(html`<tc-cost-anomaly look=${look} locale="en-US" .days=${DAYS} .causes=${CAUSES} .evidence=${EVIDENCE}></tc-cost-anomaly>`);

describe("tc-cost-anomaly", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the headline, the status, the chart and its caption`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("coa");
      expect(el.dataset.look).toBe(look);
      expect(text(el.querySelector(".ui-coa__headline"))).toBe("$1,240 over expected on Nov 14");
      expect(text(el.querySelector(".ui-coa__subline"))).toBe("Spent $1,640 against an expected $400 – 310% above");
      expect(text(el.querySelector(".ui-coa__status"))).toBe("Open");
      expect(el.querySelector("svg.ui-coa__chart")!.getAttribute("aria-hidden")).toBe("true");
      expect(el.querySelectorAll(".ui-coa__bar")).toHaveLength(6);
      expect(el.querySelectorAll(".ui-coa__bar[data-spike]")).toHaveLength(1);
      expect(el.querySelector(".ui-coa__band")).toBeTruthy();
      expect(text(el.querySelector(".ui-coa__summary"))).toBe("Daily spend from Nov 9 to Nov 14. Usually $340–$460 a day; on Nov 14 it was $1,640.");
    });
  }

  test("anomalySpike: the given day, else the furthest above expected", () => {
    expect(anomalySpike(DAYS)!.spend).toBe(1640);
    expect(anomalySpike(DAYS, START + DAY)!.spend).toBe(380);
    expect(anomalySpike([])).toBeUndefined();
  });

  test("Show as table swaps the chart for a table", async () => {
    const el = await make();
    const toggle = el.querySelector<HTMLButtonElement>(".ui-coa__toggle")!;
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    toggle.click();
    await settle();
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(el.querySelector("svg.ui-coa__chart")).toBeNull();
    const rows = [...el.querySelectorAll(".ui-coa__table tbody tr")].map((r) => [...r.children].map((c) => c.textContent!.trim()));
    expect(rows.at(-1)).toEqual(["Nov 14", "$1,640", "$340–$460"]);
  });

  test("causes with their shares, the likely one first; evidence opens", async () => {
    const el = await make();
    expect(text(el.querySelector(".ui-coa__sub"))).toBe("What drove it");
    const first = el.querySelector(".ui-coa__cause")!;
    expect(text(first.querySelector(".ui-coa__likely"))).toBe("Likely cause");
    expect(text(first.querySelector(".ui-coa__cause-share"))).toBe("75% of the extra cost ($930)");
    expect(first.querySelector<HTMLElement>(".ui-coa__fill")!.style.inlineSize).toBe("75%");
    const opened: string[] = [];
    el.addEventListener("tc-evidence-open", (e) => opened.push((e as CustomEvent<AnomalyEvidenceOpen>).detail.id));
    const ev = el.querySelector<HTMLButtonElement>(".ui-coa__ev")!;
    expect(text(ev)).toBe("Run 8f2c 9:00 AM · 6 retries $38");
    ev.click();
    expect(opened).toEqual(["r1"]);
  });

  test("Set a limit and Investigate name the likely cause", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-set-limit", (e) => seen.push(`limit:${(e as CustomEvent<AnomalyTarget>).detail.target?.id}`));
    el.addEventListener("tc-investigate", (e) => seen.push(`look:${(e as CustomEvent<AnomalyTarget>).detail.target?.id}`));
    const limit = el.querySelector<HTMLButtonElement>(".ui-coa__limit")!;
    expect(text(limit)).toBe("Set a limit on Invoice matcher");
    limit.click();
    el.querySelector<HTMLButtonElement>(".ui-coa__investigate")!.click();
    expect(seen).toEqual(["limit:inv", "look:inv"]);
  });

  test("Mark as expected, then Undo: focus follows, status changes are cancelable", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-status-change", (e) => seen.push((e as CustomEvent<AnomalyStatusChange>).detail.status));
    el.querySelector<HTMLButtonElement>(".ui-coa__expected")!.click();
    await settle();
    expect(el.status).toBe("expected");
    expect(el.getAttribute("status")).toBe("expected");
    expect(text(el.querySelector(".ui-coa__status"))).toBe("Expected");
    expect(el.querySelector(".ui-coa__limit")).toBeNull();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Marked as expected");
    await expect.poll(() => document.activeElement?.classList.contains("ui-coa__undo")).toBe(true);
    (document.activeElement as HTMLButtonElement).click();
    await settle();
    expect(el.status).toBe("open");
    await expect.poll(() => document.activeElement?.classList.contains("ui-coa__expected")).toBe(true);
    el.addEventListener("tc-status-change", (e) => e.preventDefault());
    el.querySelector<HTMLButtonElement>(".ui-coa__expected")!.click();
    await settle();
    expect(el.status).toBe("open");
    expect(seen).toEqual(["expected", "open", "expected"]);
  });

  test("no days; one cause reads as the likely cause; no band without a range", async () => {
    const empty = await fixture<TcCostAnomaly>(html`<tc-cost-anomaly></tc-cost-anomaly>`);
    expect(empty.querySelector(".ui-coa__empty")).toBeTruthy();
    const plain = await fixture<TcCostAnomaly>(
      html`<tc-cost-anomaly locale="en-US" .days=${DAYS.map(({ date, spend, expected }) => ({ date, spend, expected }))} .causes=${[CAUSES[0]]}></tc-cost-anomaly>`,
    );
    expect(plain.querySelector(".ui-coa__band")).toBeNull();
    expect(plain.querySelector(".ui-coa__expected-line")).toBeTruthy();
    expect(text(plain.querySelector(".ui-coa__sub"))).toBe("Likely cause");
    expect(plain.querySelector(".ui-coa__likely")).toBeNull();
  });

  test("narrow: the card keeps its content inside", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 300px"><tc-cost-anomaly .days=${DAYS} .causes=${CAUSES} .evidence=${EVIDENCE}></tc-cost-anomaly></div>`);
    const el = wrap.querySelector("tc-cost-anomaly")!;
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
  });

  test("React wrapper: uncontrolled status survives re-renders; controlled stays; callbacks get the cause", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(CostAnomaly, {
        title: "Spike",
        days: DAYS,
        causes: CAUSES,
        evidence: EVIDENCE,
        onStatusChange: (s) => void seen.push(s),
        onSetLimit: (t) => void seen.push(`limit:${t?.id}`),
        onEvidenceOpen: (id) => void seen.push(`ev:${id}`),
        "data-n": n,
      } as React.ComponentProps<typeof CostAnomaly>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-cost-anomaly")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Spike");
    el.querySelector<HTMLButtonElement>(".ui-coa__limit")!.click();
    el.querySelector<HTMLButtonElement>(".ui-coa__ev")!.click();
    el.querySelector<HTMLButtonElement>(".ui-coa__expected")!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.status).toBe("expected");
    expect(seen).toEqual(["limit:inv", "ev:r1", "expected"]);
    await act(async () => root.unmount());
    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    await act(async () => root2.render(React.createElement(CostAnomaly, { days: DAYS, status: "open", onStatusChange: (s) => void seen.push(s) })));
    await settle();
    const el2 = host2.querySelector("tc-cost-anomaly")!;
    el2.querySelector<HTMLButtonElement>(".ui-coa__expected")!.click();
    await settle();
    expect(seen.at(-1)).toBe("expected");
    expect(el2.status).toBe("open");
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, chart and table`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-cost-anomaly .days=${DAYS} .causes=${CAUSES} .evidence=${EVIDENCE}></tc-cost-anomaly>
        <tc-cost-anomaly look="clean" status="expected" .days=${DAYS} .causes=${CAUSES}></tc-cost-anomaly>
      </div>`);
      wrap.querySelectorAll<HTMLButtonElement>(".ui-coa__toggle")[1].click();
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
