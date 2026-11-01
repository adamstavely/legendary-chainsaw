/*
 * <tc-agent-findings> in real browsers: agents with progress, findings newest first, filters, opening by click and
 * keyboard, announcing new findings, the narrow layout, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/agent-findings";
import type { AgentFinding, AgentFindingsAgent, AgentFindingsSelectedChange, TcAgentFindings } from "../../src/elements/agent-findings";
import { AgentFindings } from "../../src/elements/react/agent-findings";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const AGENTS: AgentFindingsAgent[] = [
  { id: "a", name: "Budget", status: "running", progress: 0.624, checked: "31 of 50" },
  { id: "b", name: "Refs", status: "done", progress: 1 },
  { id: "c", name: "Rules", status: "queued" },
];
const FINDINGS: AgentFinding[] = [
  { id: "old", agent: "b", severity: "info", title: "All found", at: 100 },
  { id: "new", agent: "a", severity: "high", title: "Totals differ", detail: "Line 18.", at: 300 },
  { id: "mid", agent: "b", severity: "medium", title: "Duplicate", at: 200 },
];
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const view = () => fixture<TcAgentFindings>(html`<tc-agent-findings .agents=${AGENTS} .findings=${FINDINGS}></tc-agent-findings>`);
const rows = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-agf__finding")];
const ids = (el: Element) => rows(el).map((r) => r.dataset.finding);
const pick = async (select: HTMLSelectElement, value: string) => {
  select.value = value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  await settle();
};
const filters = (el: Element) => [...el.querySelectorAll<HTMLSelectElement>(".ui-agf__filter")];
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-agent-findings", () => {
  test("shows each agent's progress in numbers and a bar", async () => {
    const el = await view();
    expect(el.dataset.ui).toBe("agf");
    const agents = [...el.querySelectorAll(".ui-agf__agent")];
    expect(text(agents[0])).toContain("62%");
    expect(text(agents[0])).toContain("31 of 50");
    expect(agents[0]!.querySelector('[role="progressbar"]')!.getAttribute("aria-valuenow")).toBe("62");
    expect(agents[2]!.querySelector('[role="progressbar"]')).toBeNull();
    expect(text(agents[2])).toContain("Queued");
  });

  test("findings are newest first, with severity in words and a mark", async () => {
    const el = await view();
    expect(ids(el)).toEqual(["new", "mid", "old"]);
    expect(text(rows(el)[0]!.querySelector(".ui-agf__severity"))).toBe("High");
    expect(rows(el)[0]!.querySelector(".ui-agf__mark")).toBeTruthy();
    expect(text(rows(el)[0])).toContain("Budget");
    expect(text(el.querySelector(".ui-agf__count"))).toBe("3 findings");
  });

  test("filters by agent and by severity, and says when nothing matches", async () => {
    const el = await view();
    await pick(filters(el)[0]!, "b");
    expect(el.agentFilter).toBe("b");
    expect(ids(el)).toEqual(["mid", "old"]);
    await pick(filters(el)[1]!, "high");
    expect(text(el.querySelector(".ui-agf__empty"))).toBe("No findings match.");
    await pick(filters(el)[0]!, "all");
    expect(ids(el)).toEqual(["new"]);
    expect(text(el.querySelector(".ui-agf__count"))).toBe("1 finding");
  });

  test("preventDefault keeps a filter", async () => {
    const el = await view();
    el.addEventListener("tc-severity-filter-change", (e) => e.preventDefault());
    await pick(filters(el)[1]!, "high");
    expect(el.severityFilter).toBe("all");
    expect(filters(el)[1]!.value).toBe("all");
  });

  test("opening a finding shows its detail and reports it", async () => {
    const el = await view();
    const seen: AgentFindingsSelectedChange[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<AgentFindingsSelectedChange>).detail));
    rows(el)[0]!.click();
    await settle();
    expect(seen[0]!.selected).toBe("new");
    expect(seen[0]!.finding!.title).toBe("Totals differ");
    expect(text(el.querySelector(".ui-agf__detail"))).toBe("Line 18.");
    expect(rows(el)[0]!.getAttribute("aria-expanded")).toBe("true");
  });

  test("a selected finding that's filtered away is cleared", async () => {
    const el = await view();
    rows(el)[0]!.click();
    await settle();
    await pick(filters(el)[0]!, "b");
    expect(el.selected).toBeNull();
  });

  test("preventDefault keeps the selection", async () => {
    const el = await view();
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    rows(el)[0]!.click();
    await settle();
    expect(el.selected).toBeNull();
  });

  test("the findings are one tab stop, and the keyboard moves and closes", async () => {
    const el = await view();
    expect(rows(el).filter((r) => r.tabIndex === 0)).toHaveLength(1);
    rows(el)[0]!.focus();
    key(rows(el)[0]!, "ArrowDown");
    await expect.poll(() => document.activeElement).toBe(rows(el)[1]);
    key(rows(el)[1]!, "End");
    await expect.poll(() => document.activeElement).toBe(rows(el)[2]);
    key(rows(el)[2]!, "Home");
    await expect.poll(() => document.activeElement).toBe(rows(el)[0]);
    rows(el)[0]!.click();
    await settle();
    key(rows(el)[0]!, "Escape");
    await settle();
    expect(el.selected).toBeNull();
  });

  test("announces new findings, several as a count, and not the first set", async () => {
    const el = await view();
    const status = () => text(el.querySelector('[role="status"]'));
    expect(status()).toBe("");
    el.findings = [{ id: "n1", agent: "a", severity: "low", title: "Rounded", at: 400 }, ...FINDINGS];
    await settle();
    expect(status()).toBe("New finding: Rounded, Low");
    expect(ids(el)[0]).toBe("n1");
    el.findings = [{ id: "n2", agent: "a", severity: "low", title: "x" }, { id: "n3", agent: "a", severity: "low", title: "y" }, ...el.findings];
    await settle();
    expect(status()).toBe("2 new findings");
  });

  test("a new finding animates in", async () => {
    const el = await view();
    el.findings = [{ id: "n1", agent: "a", severity: "low", title: "Rounded", at: 400 }, ...FINDINGS];
    await settle();
    expect(el.querySelector('[data-finding="n1"]')!.closest("li")!.getAnimations().length).toBeGreaterThan(0);
  });

  test("agents sit above the feed when narrow", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 400px"><tc-agent-findings .agents=${AGENTS} .findings=${FINDINGS}></tc-agent-findings></div>`);
    expect(getComputedStyle(wrap.querySelector(".ui-agf__grid")!).gridTemplateColumns.split(" ")).toHaveLength(1);
  });

  test("says so when nothing's been found", async () => {
    const el = await fixture<TcAgentFindings>(html`<tc-agent-findings .agents=${AGENTS}></tc-agent-findings>`);
    expect(text(el.querySelector(".ui-agf__empty"))).toBe("Nothing found yet.");
  });
});

const RICH_AGENTS: AgentFindingsAgent[] = [
  { id: "a", name: "Auditor", status: "running", checked: 16, total: 24, activity: "Reading the ledger" },
  { id: "b", name: "Prover", status: "running", checked: 7, total: 12 },
  { id: "c", name: "Words", status: "done", progress: 1, checked: "All 8 lines" },
];
const RICH: AgentFinding[] = [
  { id: "1", agent: "a", severity: "critical", title: "Totals can differ", location: "ledger.csv:204", at: 95_000 },
  { id: "2", agent: "a", severity: "high", title: "No cap on grants", at: 90_000 },
  { id: "3", agent: "b", severity: "high", title: "Stale rate", location: "rates.csv:57", at: 40_000 },
  { id: "4", agent: "b", severity: "info", title: "Minor note", at: 1_000 },
];
const rich = () => fixture<TcAgentFindings>(html`<tc-agent-findings locale="en-US" .now=${100_000} .agents=${RICH_AGENTS} .findings=${RICH}></tc-agent-findings>`);

describe("tc-agent-findings summary and extras", () => {
  test("columns stays the default, and a plain setup still reads as before", async () => {
    const el = await view();
    expect(el.layout).toBe("columns");
    expect(el.querySelector(".ui-agf__checks")).toBeNull();
    expect(text(el.querySelector(".ui-agf__pct"))).toBe("62%");
    expect(text(el.querySelector(".ui-agf__checked"))).toBe("31 of 50");
  });

  test("the summary totals the numeric checks and each severity, in words", async () => {
    const el = await rich();
    expect(text(el.querySelector(".ui-agf__checks"))).toBe("23 of 36 checks");
    expect([...el.querySelectorAll(".ui-agf__total")].map(text)).toEqual(["1 critical", "2 high", "1 info"]);
    expect(el.querySelector(".ui-agf__totals")!.getAttribute("aria-label")).toBe("Found so far");
  });

  test("totals ignore the filters", async () => {
    const el = await rich();
    await pick(filters(el)[1]!, "info");
    expect([...el.querySelectorAll(".ui-agf__total")].map(text)).toEqual(["1 critical", "2 high", "1 info"]);
  });

  test("critical comes first in the filter, and it has its own word and mark", async () => {
    const el = await rich();
    expect([...filters(el)[1]!.options].map((o) => o.value)).toEqual(["all", "critical", "high", "medium", "low", "info"]);
    expect(text(el.querySelector('.ui-agf__severity[data-severity="critical"]'))).toBe("Critical");
    expect(el.querySelector('.ui-agf__severity[data-severity="critical"] svg')).toBeTruthy();
  });

  test("an agent shows what it's doing, a fraction and a bar worked out from the numbers", async () => {
    const el = await rich();
    const row = el.querySelector(".ui-agf__agent")!;
    expect(text(row.querySelector(".ui-agf__activity"))).toBe("Reading the ledger");
    expect(text(row.querySelector(".ui-agf__fraction"))).toBe("16/24");
    expect(row.querySelector(".ui-agf__pct")).toBeNull();
    expect(row.querySelector('[role="progressbar"]')!.getAttribute("aria-valuenow")).toBe("67");
  });

  test("words in checked still work beside numbers elsewhere", async () => {
    const el = await rich();
    const row = el.querySelectorAll(".ui-agf__agent")[2]!;
    expect(text(row.querySelector(".ui-agf__checked"))).toBe("All 8 lines");
    expect(text(row.querySelector(".ui-agf__pct"))).toBe("100%");
  });

  test("a total of zero gives no bar and doesn't divide by zero", async () => {
    const el = await fixture<TcAgentFindings>(html`<tc-agent-findings .agents=${[{ id: "z", name: "Z", status: "queued", checked: 0, total: 0 }]}></tc-agent-findings>`);
    expect(el.querySelector('[role="progressbar"]')).toBeNull();
    expect(text(el.querySelector(".ui-agf__checks"))).toBe("0 of 0 checks");
  });

  test("each agent counts the top two severities in use, with words for screen readers, and zero is muted", async () => {
    const el = await rich();
    const [first, second] = [...el.querySelectorAll(".ui-agf__agent")];
    expect([...first!.querySelectorAll(".ui-agf__tally")].map(text)).toEqual(["1 critical", "1 high"]);
    const tallies = [...second!.querySelectorAll<HTMLElement>(".ui-agf__tally")];
    expect(tallies.map(text)).toEqual(["0 critical", "1 high"]);
    expect(tallies[0]!.hasAttribute("data-zero")).toBe(true);
    expect(tallies[1]!.hasAttribute("data-zero")).toBe(false);
    const plain = await fixture<TcAgentFindings>(html`<tc-agent-findings .agents=${AGENTS} .findings=${FINDINGS}></tc-agent-findings>`);
    expect([...plain.querySelector(".ui-agf__agent")!.querySelectorAll(".ui-agf__tally")].map(text)).toEqual(["1 high", "0 medium"]);
  });

  test("findings show their location, and how long ago when `now` is given", async () => {
    const el = await rich();
    const row = el.querySelector('[data-finding="1"]')!;
    expect(text(row.querySelector(".ui-agf__location"))).toBe("ledger.csv:204");
    expect(getComputedStyle(row.querySelector(".ui-agf__location")!).fontFamily).toMatch(/mono/i);
    expect(text(row.querySelector(".ui-agf__when"))).toMatch(/5 sec/);
    el.now = 3_700_000;
    await settle();
    expect(text(row.querySelector(".ui-agf__when"))).toMatch(/hr/);
  });

  test("stacked puts the agents above the feed", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 900px"><tc-agent-findings layout="stacked" .agents=${RICH_AGENTS} .findings=${RICH}></tc-agent-findings></div>`);
    const agents = wrap.querySelector(".ui-agf__agents-panel")!.getBoundingClientRect();
    const feed = wrap.querySelector(".ui-agf__feed-panel")!.getBoundingClientRect();
    expect(feed.top).toBeGreaterThanOrEqual(agents.bottom - 1);
    expect(getComputedStyle(wrap.querySelector(".ui-agf__finding")!).display).toBe("flex");
  });

  test("columns keep them side by side, and narrow wraps with no overflow", async () => {
    const wide = await fixture<HTMLElement>(html`<div style="width: 900px"><tc-agent-findings .agents=${RICH_AGENTS} .findings=${RICH}></tc-agent-findings></div>`);
    expect(getComputedStyle(wide.querySelector(".ui-agf__grid")!).gridTemplateColumns.split(" ")).toHaveLength(2);
    const narrow = await fixture<HTMLElement>(html`<div style="width: 300px"><tc-agent-findings layout="stacked" .agents=${RICH_AGENTS} .findings=${RICH}></tc-agent-findings></div>`);
    const card = narrow.querySelector<HTMLElement>(".ui-agf__card")!;
    expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth + 1);
    expect(getComputedStyle(narrow.querySelector(".ui-agf__finding")!).display).toBe("grid");
  });

  test("axe: stacked with everything, in both looks and themes", async () => {
    for (const look of ["standard", "clean"]) {
      for (const scheme of ["light", "dark"]) {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas`}><tc-agent-findings layout="stacked" .now=${100_000} selected="1" .agents=${RICH_AGENTS} .findings=${RICH}></tc-agent-findings></div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${look} ${scheme} ${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
        wrap.remove();
      }
    }
  });
});

describe("React", () => {
  test("an uncontrolled selection survives, and a controlled one stays", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const node = (extra = {}) => React.createElement(AgentFindings, { agents: AGENTS, findings: FINDINGS, ...extra });
    await act(async () => root.render(node()));
    await settle();
    const el = host.querySelector<TcAgentFindings>("tc-agent-findings")!;
    await act(async () => rows(el)[0]!.click());
    await act(async () => root.render(node()));
    await settle();
    expect(el.selected).toBe("new");
    await act(async () => root.render(node({ selected: "mid" })));
    await settle();
    await act(async () => rows(el)[0]!.click());
    await settle();
    expect(el.selected).toBe("mid");
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas`}><tc-agent-findings .agents=${AGENTS} .findings=${FINDINGS} selected="new"></tc-agent-findings></div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
