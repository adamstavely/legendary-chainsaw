/*
 * <tc-agent-summary> in real browsers: the facts, the figures worked out from the days, the chart and its table, the
 * failures, the actions, narrow width, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/agent-summary";
import { agentSummaryTotals, type AgentSummaryActionDetail, type AgentSummaryDay, type AgentSummaryFailure, type TcAgentSummary } from "../../src/elements/agent-summary";
import { AgentSummary } from "../../src/elements/react/agent-summary";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const DAY = 86_400_000;
const START = Date.UTC(2026, 10, 1, 12);
const DAYS: AgentSummaryDay[] = [
  { date: START, succeeded: 5, failed: 1 },
  { date: START + DAY, succeeded: 7, failed: 0 },
  { date: START + 2 * DAY, succeeded: 0, failed: 0 },
  { date: START + 3 * DAY, succeeded: 4, failed: 3 },
];
const FAILURES: AgentSummaryFailure[] = [{ id: "f1", at: START + 3 * DAY, step: "Fetch orders", error: "The export timed out." }];
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const card = (extra = html``) =>
  fixture<TcAgentSummary>(
    html`<tc-agent-summary name="Invoice matcher" description="Matches invoices" status="live" model="Model M" owner="Finance" live-version="v12" draft-version="v13" .tools=${["Ledger search", "Purchase orders"]} .days=${DAYS} .medianDuration=${41_000} .cost=${12.8} .failures=${FAILURES} locale="en-US">${extra}</tc-agent-summary>`,
  );
const action = (el: Element, a: string) => el.querySelector<HTMLElement>(`[data-action="${a}"]`);

describe("tc-agent-summary", () => {
  test("shows the facts, tools and versions", async () => {
    const el = await card();
    expect(el.dataset.ui).toBe("agsm");
    expect(text(el.querySelector(".ui-agsm__status"))).toBe("Live");
    expect(text(el.querySelector(".ui-agsm__model"))).toBe("Model M");
    expect(text(el.querySelector(".ui-agsm__owner"))).toBe("Finance");
    expect([...el.querySelectorAll(".ui-agsm__version")].map(text)).toEqual(["v12 live", "v13 in draft"]);
    expect([...el.querySelectorAll(".ui-agsm__tool")].map(text)).toEqual(["Ledger search", "Purchase orders"]);
  });

  test("works out the success rate, and shows the median and the cost", async () => {
    expect(agentSummaryTotals(DAYS)).toEqual({ runs: 20, succeeded: 16, failed: 4, rate: 0.8 });
    expect(agentSummaryTotals([]).rate).toBeNull();
    const el = await card();
    expect(text(el.querySelector(".ui-agsm__rate"))).toBe("80%");
    expect(text(el.querySelector(".ui-agsm__median"))).toBe("41s");
    expect(text(el.querySelector(".ui-agsm__cost"))).toBe("$12.80");
    expect(text(el.querySelector(".ui-agsm__summary"))).toBe("20 runs over 4 days: 16 succeeded, 4 failed.");
  });

  test("draws a stacked bar per day, scaled to the busiest", async () => {
    const el = await card();
    const bars = [...el.querySelectorAll<SVGRectElement>(".ui-agsm__bar")];
    expect(bars).toHaveLength(8);
    const height = (i: number, kind: string) => Number(bars.filter((b) => b.dataset.kind === kind)[i]!.getAttribute("height"));
    expect(height(1, "succeeded")).toBeCloseTo(64);
    expect(height(3, "failed")).toBeCloseTo((3 / 7) * 64);
    expect(height(2, "succeeded")).toBe(0);
    expect(el.querySelector(".ui-agsm__svg")!.getAttribute("aria-hidden")).toBe("true");
  });

  test("Show as table reveals the same days as rows", async () => {
    const el = await card();
    const toggle = el.querySelector<HTMLButtonElement>(".ui-agsm__toggle")!;
    const wrap = el.querySelector<HTMLElement>(".ui-agsm__table-wrap")!;
    expect(wrap.hidden).toBe(true);
    expect(toggle.getAttribute("aria-controls")).toBe(wrap.id);
    toggle.click();
    await settle();
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(wrap.hidden).toBe(false);
    const rows = [...el.querySelectorAll(".ui-agsm__table tbody tr")];
    expect(rows).toHaveLength(4);
    expect([...rows[3]!.children].map(text)).toEqual(["Wed, Nov 4", "4", "3"]);
    expect(rows[3]!.querySelector('td[data-failed="true"]')).toBeTruthy();
  });

  test("lists the recent failures with their errors", async () => {
    const el = await card();
    const f = el.querySelector(".ui-agsm__failure")!;
    expect(text(f.querySelector(".ui-agsm__error"))).toBe("The export timed out.");
    expect(text(f.querySelector(".ui-agsm__failure-when"))).toContain("at Fetch orders");
    expect(f.querySelector("time")!.getAttribute("datetime")).toBe(new Date(START + 3 * DAY).toISOString());
  });

  test("no runs, no failures and no tools say so", async () => {
    const el = await fixture<TcAgentSummary>(html`<tc-agent-summary name="New"></tc-agent-summary>`);
    expect([...el.querySelectorAll(".ui-agsm__none")].map(text)).toEqual(["No tools", "No runs in this period.", "No failures in this period."]);
    expect(text(el.querySelector(".ui-agsm__rate"))).toBe("–");
    expect(el.querySelector(".ui-agsm__toggle")).toBeNull();
  });

  test("Pause and Resume change the status unless prevented; Edit and Run test are the page's", async () => {
    const el = await card();
    const seen: string[] = [];
    el.addEventListener("tc-action", (e) => seen.push((e as CustomEvent<AgentSummaryActionDetail>).detail.action));
    action(el, "edit")!.click();
    action(el, "test")!.click();
    action(el, "pause")!.click();
    await settle();
    expect(el.status).toBe("paused");
    expect(text(el.querySelector(".ui-agsm__status"))).toBe("Paused");
    expect(action(el, "pause")).toBeNull();
    el.addEventListener("tc-action", (e) => e.preventDefault(), { once: true });
    action(el, "resume")!.click();
    await settle();
    expect(el.status).toBe("paused");
    action(el, "resume")!.click();
    await settle();
    expect(el.status).toBe("live");
    expect(seen).toEqual(["edit", "test", "pause", "resume", "resume"]);
  });

  test("actions can be turned off, and labels renamed", async () => {
    const el = await fixture<TcAgentSummary>(html`<tc-agent-summary actions="false" status="failing" .labels=${{ failing: "Broken" }}></tc-agent-summary>`);
    expect(el.querySelector(".ui-agsm__actions")).toBeNull();
    expect(text(el.querySelector(".ui-agsm__status"))).toBe("Broken");
  });

  test("fits a narrow column", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 300px"><tc-agent-summary name="Invoice matcher" model="Model M" .tools=${["Ledger search"]} .days=${DAYS} .failures=${FAILURES}></tc-agent-summary></div>`);
    const inner = wrap.querySelector<HTMLElement>(".ui-agsm__card")!;
    expect(inner.scrollWidth).toBeLessThanOrEqual(inner.clientWidth + 1);
  });
});

describe("React", () => {
  test("onAction sees each action, and returning false keeps the status", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const seen: string[] = [];
    let allow = false;
    const node = () =>
      React.createElement(AgentSummary, {
        name: "Invoice matcher",
        days: DAYS,
        onAction: (a: string) => {
          seen.push(a);
          return allow;
        },
      });
    await act(async () => root.render(node()));
    await settle();
    const el = host.querySelector<TcAgentSummary>("tc-agent-summary")!;
    await act(async () => action(el, "pause")!.click());
    await settle();
    expect(el.status).toBe("live");
    allow = true;
    await act(async () => action(el, "pause")!.click());
    await settle();
    expect(el.status).toBe("paused");
    expect(seen).toEqual(["pause", "pause"]);
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(
          html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas`}><tc-agent-summary name="Invoice matcher" status="failing" model="Model M" owner="Finance" live-version="v12" draft-version="v13" .tools=${["Ledger search"]} .days=${DAYS} .medianDuration=${41_000} .cost=${12.8} .failures=${FAILURES}></tc-agent-summary></div>`,
        );
        wrap.querySelector<HTMLElement>(".ui-agsm__toggle")!.click();
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
