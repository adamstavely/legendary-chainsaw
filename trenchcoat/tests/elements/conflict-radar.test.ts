/*
 * <tc-conflict-radar> in real browsers: status worked out, conflicts first, the grid's keys, the detail, the filter, Resolve,
 * controlled use, the sticky file column, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/conflict-radar";
import { conflictStatus, type ConflictAgent, type ConflictFile, type ConflictResolve, type ConflictSelectedChange, type TcConflictRadar } from "../../src/elements/conflict-radar";
import { ConflictRadar } from "../../src/elements/react/conflict-radar";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

const AGENTS: ConflictAgent[] = [{ id: "a", name: "Alpha", branch: "one" }, { id: "b", name: "Beta" }];
const CLEAR: ConflictFile = { path: "clear.ts", edits: [{ agent: "a", lines: [1, 5] }] };
const OVER: ConflictFile = { path: "over.ts", edits: [{ agent: "a", lines: [1, 5] }, { agent: "b", lines: [10, 12] }] };
const CONF: ConflictFile = { path: "conf.ts", edits: [{ agent: "a", lines: [1, 20], kind: "refactor" }, { agent: "b", lines: [10, 12] }] };
const FILES = [CLEAR, OVER, CONF];
const radar = () => fixture<TcConflictRadar>(html`<tc-conflict-radar .agents=${AGENTS} .files=${FILES}></tc-conflict-radar>`);
const rows = (el: Element) => [...el.querySelectorAll<HTMLElement>("tbody tr")].map((r) => r.dataset.file);
const active = (el: Element) => el.querySelector<HTMLElement>('[data-cell][tabindex="0"]')!;

describe("conflictStatus", () => {
  test("works status out from agents and lines, and a file's own wins", () => {
    expect(conflictStatus(CLEAR)).toBe("clear");
    expect(conflictStatus(OVER)).toBe("overlap");
    expect(conflictStatus(CONF)).toBe("conflict");
    expect(conflictStatus({ path: "x", edits: [{ agent: "a" }, { agent: "b" }] })).toBe("overlap");
    expect(conflictStatus({ path: "x", edits: [{ agent: "a", lines: [1, 2] }, { agent: "a", lines: [1, 2] }] })).toBe("clear");
    expect(conflictStatus({ ...CONF, status: "clear" })).toBe("clear");
  });
});

describe("tc-conflict-radar", () => {
  test("sorts conflicts first, with status in words", async () => {
    const el = await radar();
    expect(el.dataset.ui).toBe("cfr");
    expect(rows(el)).toEqual(["conf.ts", "over.ts", "clear.ts"]);
    expect(text(el.querySelector('[data-file="conf.ts"] .ui-cfr__status'))).toBe("Conflict");
    expect(text(el.querySelector(".ui-cfr__summary"))).toBe("1 conflict");
    expect(text(el.querySelector('[data-file="clear.ts"] td:last-child'))).toContain("Not touched");
    expect(el.querySelector('[data-file="conf.ts"] td')!.getAttribute("data-state")).toBe("conflict");
  });

  test("the grid is one tab stop, and arrows, Home and End move", async () => {
    const el = await radar();
    expect(el.querySelectorAll('[data-cell][tabindex="0"]')).toHaveLength(1);
    const grid = el.querySelector('[role="grid"]')!;
    key(grid, "ArrowRight");
    await settle();
    await expect.poll(() => document.activeElement).toBe(el.querySelectorAll('[data-file="conf.ts"] td')[0]);
    key(grid, "ArrowDown");
    await settle();
    expect(active(el).closest("tr")!.dataset.file).toBe("over.ts");
    key(grid, "End");
    await settle();
    expect(active(el)).toBe(el.querySelectorAll('[data-file="over.ts"] td')[1]);
    key(grid, "Home");
    await settle();
    expect(active(el).matches("th")).toBe(true);
  });

  test("Enter opens a file's detail, with who touched what, and Escape closes it", async () => {
    const el = await radar();
    const seen: ConflictSelectedChange[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<ConflictSelectedChange>).detail));
    const grid = el.querySelector('[role="grid"]')!;
    key(grid, "Enter");
    await settle();
    expect(seen[0]).toEqual({ selected: "conf.ts", file: CONF });
    const detail = text(el.querySelector(".ui-cfr__detail"));
    expect(detail).toContain("Alpha Lines 1–20 refactor");
    expect(detail).toContain("Crosses Beta");
    key(grid, "Escape");
    await settle();
    expect(el.querySelector(".ui-cfr__detail")).toBeNull();
  });

  test("clicking a cell opens its file, and preventDefault keeps it shut", async () => {
    const el = await radar();
    el.querySelector<HTMLElement>('[data-file="over.ts"] td')!.click();
    await settle();
    expect(el.selected).toBe("over.ts");
    const other = await radar();
    other.addEventListener("tc-selected-change", (e) => e.preventDefault());
    other.querySelector<HTMLElement>('[data-file="over.ts"] th')!.click();
    await settle();
    expect(other.selected).toBeNull();
  });

  test("the filter narrows it, and says when there's nothing", async () => {
    const el = await radar();
    el.querySelectorAll<HTMLElement>(".ui-cfr__filter")[1]!.click();
    await settle();
    expect(rows(el)).toEqual(["conf.ts"]);
    el.files = [CLEAR];
    await settle();
    expect(text(el.querySelector(".ui-cfr__empty"))).toContain("No conflicts");
  });

  test("Resolve reports the file, and isn't offered on a clear one", async () => {
    const el = await radar();
    const seen: ConflictResolve[] = [];
    el.addEventListener("tc-resolve", (e) => seen.push((e as CustomEvent<ConflictResolve>).detail));
    el.selected = "conf.ts";
    await settle();
    el.querySelector<HTMLElement>(".ui-cfr__resolve")!.click();
    expect(seen[0]!.file).toBe(CONF);
    el.selected = "clear.ts";
    await settle();
    expect(el.querySelector(".ui-cfr__resolve")).toBeNull();
  });

  test("narrow, the grid scrolls in its own box with the file column sticky", async () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ id: `a${i}`, name: `Agent number ${i}` }));
    const wrap = await fixture<HTMLElement>(html`<div style="width: 320px"><tc-conflict-radar .agents=${many} .files=${FILES}></tc-conflict-radar></div>`);
    const scroll = wrap.querySelector<HTMLElement>(".ui-cfr__scroll")!;
    expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth);
    expect(wrap.scrollWidth).toBeLessThanOrEqual(wrap.clientWidth);
    expect(getComputedStyle(wrap.querySelector(".ui-cfr__file")!).position).toBe("sticky");
  });

  test("says so when there are no files", async () => {
    const el = await fixture<TcConflictRadar>(html`<tc-conflict-radar></tc-conflict-radar>`);
    expect(text(el.querySelector(".ui-cfr__empty"))).toContain("No agents");
  });
});

describe("React", () => {
  test("a controlled selection stays until the parent changes it, and an uncontrolled one survives re-renders", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const node = (props: object) => React.createElement(ConflictRadar, { agents: AGENTS, files: FILES, ...props });
    await act(async () => root.render(node({ selected: null })));
    await settle();
    const el = host.querySelector<TcConflictRadar>("tc-conflict-radar")!;
    await act(async () => el.querySelector<HTMLElement>('[data-file="over.ts"] th')!.click());
    expect(el.selected).toBeNull();
    await act(async () => root.unmount());
    const root2 = createRoot(host);
    await act(async () => root2.render(node({})));
    await settle();
    const el2 = host.querySelector<TcConflictRadar>("tc-conflict-radar")!;
    await act(async () => el2.querySelector<HTMLElement>('[data-file="over.ts"] th')!.click());
    await act(async () => root2.render(node({})));
    await settle();
    expect(el2.selected).toBe("over.ts");
    await act(async () => root2.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas`}><tc-conflict-radar .agents=${AGENTS} .files=${FILES} selected="conf.ts"></tc-conflict-radar></div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
