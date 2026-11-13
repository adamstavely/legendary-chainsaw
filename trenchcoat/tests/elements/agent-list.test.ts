/*
 * <tc-agent-list> in real browsers: Needs attention first with why in words, search, status filter and sort, opening
 * a row from the keyboard, empty and no-match states, narrow width, the React wrapper and axe in both looks and both
 * themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/agent-list";
import { sortAgents, type AgentListFilterChange, type AgentListItem, type AgentListOpen, type AgentListSortChange, type TcAgentList } from "../../src/elements/agent-list";
import { AgentList } from "../../src/elements/react/agent-list";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = Date.UTC(2026, 10, 12, 15);
const H = 3_600_000;
const AGENTS: AgentListItem[] = [
  { id: "policy", name: "Policy Q&A", description: "Answers staff questions", owner: "People team", status: "live", model: "Model S", lastRun: { at: NOW - H, status: "succeeded" }, runs7d: 300, failureRate: 0.01, cost7d: 18.75 },
  { id: "invoice", name: "Invoice matcher", owner: "Finance", status: "failing", model: "Model M", lastRun: { at: NOW - 2 * H, status: "failed" }, runs7d: 40, failureRate: 0.25, cost7d: 6.4 },
  { id: "vendor", name: "Vendor risk monitor", status: "live", lastRun: { at: NOW - 6 * H, status: "succeeded" }, runs7d: 7, failureRate: 0, cost7d: 2.1, attention: "Two certificates expire this week." },
  { id: "expense", name: "Expense checker", status: "paused", runs7d: 0, cost7d: 0 },
  { id: "grant", name: "Grant drafter", status: "draft" },
];
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const list = () => fixture<TcAgentList>(html`<tc-agent-list .agents=${AGENTS} .now=${NOW} locale="en-US"></tc-agent-list>`);
const rows = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-agl__row")];
const ids = (el: Element) => rows(el).map((r) => r.dataset.agent);
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const chip = (el: Element, s: string) => el.querySelector<HTMLButtonElement>(`.ui-agl__chip[data-status="${s}"]`)!;

describe("tc-agent-list", () => {
  test("lifts failing agents and those with a reason into Needs attention, saying why", async () => {
    const el = await list();
    expect(el.dataset.ui).toBe("agl");
    const groups = [...el.querySelectorAll<HTMLElement>(".ui-agl__group")];
    expect(groups.map((g) => g.dataset.group)).toEqual(["attention", "others"]);
    expect([...groups[0]!.querySelectorAll<HTMLElement>(".ui-agl__row")].map((r) => r.dataset.agent)).toEqual(["invoice", "vendor"]);
    const invoice = el.querySelector('.ui-agl__row[data-agent="invoice"]')!;
    expect(text(invoice.querySelector(".ui-agl__why"))).toBe("10 of 40 runs failed this week, and the last one failed 2 hr. ago.");
    expect(text(el.querySelector('.ui-agl__row[data-agent="vendor"] .ui-agl__why'))).toBe("Two certificates expire this week.");
    expect(text(invoice.querySelector(".ui-agl__status"))).toBe("Failing");
    expect(text(invoice.querySelector(".ui-agl__failures"))).toBe("25% failed");
    expect(text(el.querySelector('.ui-agl__row[data-agent="policy"] .ui-agl__cost'))).toBe("$18.75 this week");
    expect(text(el.querySelector('.ui-agl__row[data-agent="grant"] .ui-agl__run'))).toBe("Never run");
    expect(text(el.querySelector(".ui-agl__count"))).toBe("5 of 5 agents");
  });

  test("without now, last runs are dates; labels can be renamed", async () => {
    const el = await fixture<TcAgentList>(html`<tc-agent-list .agents=${AGENTS.slice(0, 1)} locale="en-US" .labels=${{ live: "Running", neverRun: "–" }}></tc-agent-list>`);
    expect(text(el.querySelector(".ui-agl__status"))).toBe("Running");
    expect(text(el.querySelector(".ui-agl__run"))).toMatch(/Nov 12/);
  });

  test("sorts by name, last run, failures and cost, keeping attention first", async () => {
    expect(sortAgents(AGENTS, "name").map((a) => a.id)).toEqual(["expense", "grant", "invoice", "policy", "vendor"]);
    expect(sortAgents(AGENTS, "cost").map((a) => a.id)).toEqual(["policy", "invoice", "vendor", "expense", "grant"]);
    const el = await list();
    const seen: AgentListSortChange[] = [];
    el.addEventListener("tc-sort-change", (e) => seen.push((e as unknown as CustomEvent<AgentListSortChange>).detail));
    const select = el.querySelector<HTMLSelectElement>(".ui-agl__select")!;
    select.value = "lastRun";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(seen).toEqual([{ sort: "lastRun" }]);
    expect(el.sort).toBe("lastRun");
    expect(ids(el)).toEqual(["invoice", "vendor", "policy", "expense", "grant"]);
  });

  test("a prevented sort change keeps the order", async () => {
    const el = await list();
    el.addEventListener("tc-sort-change", (e) => e.preventDefault());
    const select = el.querySelector<HTMLSelectElement>(".ui-agl__select")!;
    select.value = "cost";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.sort).toBe("name");
    expect(select.value).toBe("name");
  });

  test("searches names, descriptions, owners and models", async () => {
    const el = await list();
    const input = el.querySelector<HTMLInputElement>(".ui-agl__search")!;
    input.value = "finance";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await settle();
    expect(ids(el)).toEqual(["invoice"]);
    expect(text(el.querySelector('[role="status"]'))).toBe("1 of 5 agents");
    input.value = "model s";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await settle();
    expect(ids(el)).toEqual(["policy"]);
  });

  test("filters by status with toggle chips, and All clears", async () => {
    const el = await list();
    const seen: AgentListFilterChange[] = [];
    el.addEventListener("tc-filter-change", (e) => seen.push((e as CustomEvent<AgentListFilterChange>).detail));
    chip(el, "paused").click();
    await settle();
    chip(el, "live").click();
    await settle();
    expect(seen.map((s) => s.filter)).toEqual([["paused"], ["live", "paused"]]);
    expect(ids(el)).toEqual(["vendor", "expense", "policy"]);
    expect(chip(el, "live").getAttribute("aria-pressed")).toBe("true");
    expect(chip(el, "all").getAttribute("aria-pressed")).toBe("false");
    chip(el, "all").click();
    await settle();
    expect(el.filter).toEqual([]);
    expect(rows(el)).toHaveLength(5);
  });

  test("no match offers Clear filters, which puts everything back and focuses the search", async () => {
    const el = await fixture<TcAgentList>(html`<tc-agent-list .agents=${AGENTS} query="zzz" .filter=${["live"]}></tc-agent-list>`);
    expect(text(el.querySelector(".ui-agl__none"))).toContain("No agents match.");
    el.querySelector<HTMLElement>(".ui-agl__clear")!.click();
    await settle();
    expect(el.query).toBe("");
    expect(el.filter).toEqual([]);
    expect(rows(el)).toHaveLength(5);
    expect(document.activeElement).toBe(el.querySelector(".ui-agl__search"));
  });

  test("no agents says so", async () => {
    const el = await fixture<TcAgentList>(html`<tc-agent-list></tc-agent-list>`);
    expect(text(el.querySelector(".ui-agl__none"))).toBe("No agents yet.");
    expect(el.querySelector(".ui-agl__clear")).toBeNull();
  });

  test("the rows are one tab stop; arrows move across groups and Enter opens", async () => {
    const el = await list();
    expect(rows(el).filter((r) => r.tabIndex === 0)).toHaveLength(1);
    const opened: AgentListOpen[] = [];
    el.addEventListener("tc-agent-open", (e) => opened.push((e as CustomEvent<AgentListOpen>).detail));
    rows(el)[0]!.focus();
    key(rows(el)[0]!, "ArrowDown");
    await expect.poll(() => (document.activeElement as HTMLElement)?.dataset.agent).toBe("vendor");
    key(document.activeElement!, "ArrowDown");
    await expect.poll(() => (document.activeElement as HTMLElement)?.dataset.agent).toBe("expense");
    key(document.activeElement!, "End");
    await expect.poll(() => (document.activeElement as HTMLElement)?.dataset.agent).toBe("policy");
    key(document.activeElement!, "Home");
    await expect.poll(() => (document.activeElement as HTMLElement)?.dataset.agent).toBe("invoice");
    (document.activeElement as HTMLElement).click();
    expect(opened[0]!.id).toBe("invoice");
    expect(opened[0]!.agent.name).toBe("Invoice matcher");
    expect(rows(el).filter((r) => r.tabIndex === 0).map((r) => r.dataset.agent)).toEqual(["invoice"]);
  });

  test("stacks its rows when narrow, without overflowing", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 320px"><tc-agent-list .agents=${AGENTS} .now=${NOW}></tc-agent-list></div>`);
    const card = wrap.querySelector<HTMLElement>(".ui-agl__card")!;
    expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth + 1);
    const row = wrap.querySelector<HTMLElement>(".ui-agl__row")!;
    expect(row.querySelector<HTMLElement>(".ui-agl__figures")!.getBoundingClientRect().top).toBeGreaterThan(row.querySelector<HTMLElement>(".ui-agl__name")!.getBoundingClientRect().top);
  });
});

describe("React", () => {
  test("an uncontrolled sort survives re-renders, and a controlled one stays until the parent changes it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const opened: string[] = [];
    const node = (extra = {}) => React.createElement(AgentList, { agents: AGENTS, now: NOW, onAgentOpen: (id: string) => opened.push(id), ...extra });
    await act(async () => root.render(node()));
    await settle();
    const el = host.querySelector<TcAgentList>("tc-agent-list")!;
    const select = () => el.querySelector<HTMLSelectElement>(".ui-agl__select")!;
    await act(async () => {
      select().value = "cost";
      select().dispatchEvent(new Event("change", { bubbles: true }));
    });
    await act(async () => root.render(node()));
    await settle();
    expect(el.sort).toBe("cost");
    await act(async () => root.render(node({ sort: "name" })));
    await settle();
    await act(async () => {
      select().value = "failures";
      select().dispatchEvent(new Event("change", { bubbles: true }));
    });
    await settle();
    expect(el.sort).toBe("name");
    await act(async () => rows(el)[0]!.click());
    expect(opened).toEqual(["invoice"]);
    expect(el.heading).toBe("Agents");
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas`}><tc-agent-list .agents=${AGENTS} .now=${NOW} .filter=${[]}></tc-agent-list></div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
