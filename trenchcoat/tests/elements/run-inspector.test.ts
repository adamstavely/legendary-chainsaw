/*
 * <tc-run-inspector> in real browsers: the run's numbers, the tree of agent cards with their calls as bars, opening a
 * call under its row in a Tool Call Card (click, keyboard, Escape back to the row), tc-selected-change and
 * preventDefault, Show N more, a live run, narrow layout, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { userEvent } from "vitest/browser";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/run-inspector";
import { runNumbers, type RunInspectorSelectedChange, type TcRunInspector } from "../../src/elements/run-inspector";
import type { TraceSpan } from "../../src/elements/trace-waterfall";
import type { TcToolCallCard } from "../../src/elements/tool-call-card";
import { RunInspector } from "../../src/elements/react/run-inspector";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const S = 1000;
const RUN: TraceSpan = {
  id: "run",
  name: "Winter notice",
  kind: "agent",
  status: "failed",
  start: 0,
  end: 100 * S,
  children: [
    { id: "l1", name: "Plan", kind: "llm", status: "done", start: 0, end: 5 * S, tokensIn: 1000, tokensOut: 200, cost: 0.1 },
    {
      id: "tr",
      name: "Translator",
      kind: "subagent",
      status: "failed",
      model: "Sonnet 5.5",
      start: 10 * S,
      end: 60 * S,
      children: [
        { id: "t1", name: "read_file", kind: "tool", status: "failed", start: 10 * S, end: 12 * S, input: '{ "path": "glossary.csv" }', error: "Permission denied" },
        { id: "t2", name: "Translate", kind: "llm", status: "done", start: 13 * S, end: 40 * S, tokensIn: 2000, tokensOut: 1800, cost: 0.2 },
        { id: "t3", name: "Translate again", kind: "llm", status: "done", start: 41 * S, end: 60 * S, cost: 0.05 },
      ],
    },
  ],
};

const make = (look: "standard" | "clean" = "standard", width = 900) =>
  fixture<TcRunInspector>(html`<tc-run-inspector look=${look} style=${`width: ${width}px`} .root=${RUN}></tc-run-inspector>`);
const text = (el: Element | null) => el?.textContent!.replace(/\s+/g, " ").trim();
const call = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`[data-call="${id}"]`)!;
const stats = (el: Element) => Object.fromEntries([...el.querySelectorAll(".ui-rins__stat")].map((s) => [text(s.querySelector("dt")), text(s.querySelector("dd"))]));

describe("tc-run-inspector", () => {
  test("runNumbers adds up every span", () => {
    const n = runNumbers(RUN);
    expect({ ...n, cost: undefined }).toEqual({ status: "failed", duration: 100 * S, cost: undefined, tokens: 5000, calls: 4, errors: 2 });
    expect(n.cost).toBeCloseTo(0.35);
    const live: TraceSpan = { id: "r", name: "R", kind: "agent", status: "running", start: 0, children: [{ id: "c", name: "c", kind: "tool", status: "running", start: 1000 }] };
    expect(runNumbers(live, 7000).duration).toBe(7000);
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: numbers, agent cards and their calls`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("rins");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector("h2")!.textContent).toBe("Run inspector");
      expect(stats(el)).toEqual({ Status: "Failed", Duration: "1m 40s", Cost: "$0.35", Tokens: "5.0k", Calls: "4", Errors: "2" });
      const cards = [...el.querySelectorAll<HTMLElement>(".ui-rins__card")];
      expect(cards.map((c) => c.dataset.agent)).toEqual(["run", "tr"]);
      expect(text(cards[1].querySelector(".ui-rins__role"))).toBe("Sub-agent · Sonnet 5.5");
      expect(text(cards[1].querySelector(".ui-rins__status"))).toBe("Failed");
      expect(cards[1].querySelectorAll(".ui-rins__call").length).toBe(3);
      expect(text(call(el, "t1").querySelector(".ui-rins__call-status"))).toBe("Failed");
      // One tab stop per card's calls
      expect([...cards[1].querySelectorAll(".ui-rins__call")].map((b) => b.getAttribute("tabindex"))).toEqual(["0", "-1", "-1"]);
      const bar = call(el, "t2").querySelector<HTMLElement>(".ui-rins__bar")!;
      expect(parseFloat(bar.style.left)).toBeCloseTo(6, 0);
      expect(parseFloat(bar.style.width)).toBeCloseTo(54, 0);
    });
  }

  test("a click opens the call under its row with its error, and closes it again", async () => {
    const el = await make();
    const seen: RunInspectorSelectedChange[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<RunInspectorSelectedChange>).detail));
    call(el, "t1").click();
    await settle();
    expect(seen.map((d) => [d.selected, d.span?.name])).toEqual([["t1", "read_file"]]);
    expect(call(el, "t1").getAttribute("aria-expanded")).toBe("true");
    const detail = document.getElementById(call(el, "t1").getAttribute("aria-controls")!)!;
    expect(detail.hidden).toBe(false);
    const card = detail.querySelector<TcToolCallCard>("tc-tool-call-card")!;
    expect(card.status).toBe("error");
    expect(card.error).toBe("Permission denied");
    // Right under its row
    expect(call(el, "t1").closest("li")!.contains(detail)).toBe(true);
    call(el, "t1").click();
    await settle();
    expect(el.selected).toBeNull();
    expect(el.querySelector("tc-tool-call-card")).toBeNull();
  });

  test("a prevented change keeps the call closed", async () => {
    const el = await make();
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    call(el, "t2").click();
    await settle();
    expect(el.selected).toBeNull();
    expect(call(el, "t2").getAttribute("aria-expanded")).toBe("false");
  });

  test("keyboard: arrows move along a card's calls, Enter opens, Escape closes back to the row", async () => {
    const el = await make();
    call(el, "t1").focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(() => document.activeElement).toBe(call(el, "t2"));
    expect(call(el, "t2").getAttribute("tabindex")).toBe("0");
    await userEvent.keyboard("{End}");
    await expect.poll(() => document.activeElement).toBe(call(el, "t3"));
    await userEvent.keyboard("{Home}");
    await expect.poll(() => document.activeElement).toBe(call(el, "t1"));
    await userEvent.keyboard("{Enter}");
    await expect.poll(() => el.selected).toBe("t1");
    await userEvent.keyboard("{Escape}");
    await expect.poll(() => el.selected).toBeNull();
    await expect.poll(() => document.activeElement).toBe(call(el, "t1"));
  });

  test("Show N more, and the open call always on show", async () => {
    const el = await make();
    el.callLimit = 1;
    await settle();
    const card = el.querySelector<HTMLElement>('[data-agent="tr"]')!;
    expect(card.querySelectorAll(".ui-rins__call").length).toBe(1);
    const more = card.querySelector<HTMLButtonElement>(".ui-rins__more")!;
    expect(text(more)).toBe("Show 2 more");
    more.click();
    await settle();
    expect(card.querySelectorAll(".ui-rins__call").length).toBe(3);
    expect(text(card.querySelector(".ui-rins__more"))).toBe("Show fewer");
    card.querySelector<HTMLButtonElement>(".ui-rins__more")!.click();
    el.selected = "t3";
    await settle();
    expect([...card.querySelectorAll<HTMLElement>(".ui-rins__call")].map((b) => b.dataset.call)).toEqual(["t1", "t3"]);
  });

  test("a live run: running calls reach `elapsed`", async () => {
    const live: TraceSpan = { id: "r", name: "R", kind: "agent", status: "running", start: 0, children: [{ id: "c", name: "search", kind: "tool", status: "running", start: 2000 }] };
    const el = await fixture<TcRunInspector>(html`<tc-run-inspector .root=${live} .elapsed=${12000}></tc-run-inspector>`);
    expect(text(call(el, "c").querySelector(".ui-rins__call-time"))).toBe("10s");
    expect(text(call(el, "c").querySelector(".ui-rins__call-status"))).toBe("Running");
    expect(stats(el).Duration).toBe("12s");
  });

  test("narrow: no page scroll", async () => {
    const el = await make("standard", 340);
    expect(el.scrollWidth).toBeLessThanOrEqual(341);
  });

  test("React wrapper: controlled selected stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: (string | null)[] = [];
    await act(async () => root.render(React.createElement(RunInspector, { root: RUN, selected: null, onSelectedChange: (id) => void seen.push(id) })));
    await settle();
    const el = host.querySelector("tc-run-inspector")!;
    await act(async () => call(el, "t2").click());
    await settle();
    expect(seen).toEqual(["t2"]);
    expect(el.selected).toBeNull();
    await act(async () => root.render(React.createElement(RunInspector, { key: "u", root: RUN, defaultSelected: "t1", title: "Run" })));
    await settle();
    const el2 = host.querySelector("tc-run-inspector")!;
    expect(el2.selected).toBe("t1");
    await act(async () => call(el2, "t2").click());
    await act(async () => root.render(React.createElement(RunInspector, { key: "u", root: RUN, defaultSelected: "t1", title: "Run!" })));
    await settle();
    expect(el2.selected).toBe("t2");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; width: 900px; background: var(--tc-surface-base)">
        <tc-run-inspector .root=${RUN} selected="t1"></tc-run-inspector>
        <tc-run-inspector look="clean" .root=${RUN}></tc-run-inspector>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
