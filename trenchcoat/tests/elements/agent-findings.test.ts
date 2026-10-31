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
