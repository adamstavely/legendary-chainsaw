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
import { conflictStatus, type ConflictAgent, type ConflictFile, type ConflictMerge, type ConflictResolve, type ConflictSelectedChange, type ConflictSettledChange, type TcConflictRadar } from "../../src/elements/conflict-radar";
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

const WAYS: ConflictFile = { path: "src/app/conf.ts", edits: [{ agent: "a", lines: [1, 20], approach: "Splits the table." }, { agent: "b", lines: [10, 12], approach: "Adds a column." }] };
const settleable = (extra = {}) => fixture<TcConflictRadar>(html`<tc-conflict-radar mergeable .agents=${AGENTS} .files=${[WAYS, CLEAR]} selected=${WAYS.path} .settled=${(extra as { settled?: object }).settled ?? {}}></tc-conflict-radar>`);
const way = (el: Element, id: string) => el.querySelector<HTMLInputElement>(`.ui-cfr__way input[value="${id}"]`)!;
const mergeButton = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-cfr__merge")!;

describe("settling", () => {
  test("offers each agent's approach as one radio group, with nothing chosen", async () => {
    const el = await settleable();
    expect(el.querySelector('.ui-cfr__ways[role="radiogroup"]')!.getAttribute("aria-labelledby")).toBeTruthy();
    expect(text(el.querySelector(".ui-cfr__ways"))).toContain("Splits the table.");
    expect(text(el.querySelector(".ui-cfr__ways"))).toContain("Adds a column.");
    expect(new Set([...el.querySelectorAll<HTMLInputElement>(".ui-cfr__way input")].map((i) => i.name)).size).toBe(1);
    expect(el.querySelectorAll(".ui-cfr__way input:checked")).toHaveLength(0);
  });

  test("keeping one settles the file, in words, and it can be changed and undone", async () => {
    const el = await settleable();
    const seen: ConflictSettledChange[] = [];
    el.addEventListener("tc-settled-change", (e) => seen.push((e as CustomEvent<ConflictSettledChange>).detail));
    way(el, "a").click();
    await settle();
    expect(seen[0]).toEqual({ settled: { [WAYS.path]: "a" }, file: WAYS, agent: "a" });
    expect(text(el.querySelector(`[data-file="${WAYS.path}"] .ui-cfr__status`))).toBe("Settled: Alpha kept");
    expect(text(el.querySelector(".ui-cfr__summary"))).toBe("All settled");
    const cells = el.querySelectorAll<HTMLElement>(`[data-file="${WAYS.path}"] td`);
    expect(cells[0]!.dataset.state).toBe("kept");
    expect(text(cells[0])).toContain("Kept");
    expect(cells[1]!.dataset.state).toBe("dropped");
    way(el, "b").click();
    await settle();
    expect(el.settled).toEqual({ [WAYS.path]: "b" });
    el.querySelector<HTMLElement>(".ui-cfr__unsettle")!.click();
    await settle();
    expect(el.settled).toEqual({});
    expect(text(el.querySelector(`[data-file="${WAYS.path}"] .ui-cfr__status`))).toBe("Conflict");
  });

  test("preventDefault keeps it unsettled, and the radio goes back", async () => {
    const el = await settleable();
    el.addEventListener("tc-settled-change", (e) => e.preventDefault());
    way(el, "a").click();
    await settle();
    expect(el.settled).toEqual({});
    expect(way(el, "a").checked).toBe(false);
  });

  test("an entry for an agent who didn't touch the file, or a file that isn't a conflict, is ignored", async () => {
    const el = await settleable({ settled: { [WAYS.path]: "nobody", [CLEAR.path]: "a" } });
    expect(text(el.querySelector(`[data-file="${WAYS.path}"] .ui-cfr__status`))).toBe("Conflict");
    expect(text(el.querySelector(`[data-file="${CLEAR.path}"] .ui-cfr__status`))).toBe("Clear");
    expect(mergeButton(el).disabled).toBe(true);
  });

  test("no ways are offered without an approach or mergeable, and Resolve still works", async () => {
    const el = await radar();
    el.selected = "conf.ts";
    await settle();
    expect(el.querySelector(".ui-cfr__ways")).toBeNull();
    const seen: ConflictResolve[] = [];
    el.addEventListener("tc-resolve", (e) => seen.push((e as CustomEvent<ConflictResolve>).detail));
    el.querySelector<HTMLElement>(".ui-cfr__resolve")!.click();
    expect(seen).toHaveLength(1);
  });

  test("a settled conflict sorts below open conflicts and above the rest", async () => {
    const other: ConflictFile = { ...CONF, path: "open.ts" };
    const el = await fixture<TcConflictRadar>(html`<tc-conflict-radar .agents=${AGENTS} .files=${[CLEAR, WAYS, other]} .settled=${{ [WAYS.path]: "a" }}></tc-conflict-radar>`);
    expect(rows(el)).toEqual(["open.ts", WAYS.path, "clear.ts"]);
  });
});

describe("merging", () => {
  test("only shows with mergeable, and waits for every conflict, saying how many are left", async () => {
    const plain = await radar();
    expect(mergeButton(plain)).toBeNull();
    const el = await settleable();
    expect(text(mergeButton(el))).toBe("Merge 2 branches");
    expect(mergeButton(el).disabled).toBe(true);
    expect(text(el.querySelector(".ui-cfr__left"))).toBe("1 conflict left to settle");
    expect(document.getElementById(mergeButton(el).getAttribute("aria-describedby")!)).toBe(el.querySelector(".ui-cfr__left"));
    way(el, "b").click();
    await settle();
    expect(mergeButton(el).disabled).toBe(false);
    expect(el.querySelector(".ui-cfr__left")).toBeNull();
  });

  test("fires tc-merge with what was kept, announces it, and preventDefault stays quiet", async () => {
    const el = await settleable({ settled: { [WAYS.path]: "a" } });
    const seen: ConflictMerge[] = [];
    el.addEventListener("tc-merge", (e) => seen.push((e as CustomEvent<ConflictMerge>).detail));
    el.addEventListener("tc-merge", (e) => e.preventDefault(), { once: true });
    mergeButton(el).click();
    await settle();
    expect(seen).toEqual([{ settled: { [WAYS.path]: "a" } }]);
    expect(text(el.querySelector(':scope > [role="status"]'))).toBe("All settled");
    mergeButton(el).click();
    await settle();
    expect(text(el.querySelector(':scope > [role="status"]'))).toBe("Merge requested");
  });

  test("merge-label renames it", async () => {
    const el = await fixture<TcConflictRadar>(html`<tc-conflict-radar mergeable merge-label="Combine {n}" .agents=${AGENTS} .files=${[CLEAR]}></tc-conflict-radar>`);
    expect(text(mergeButton(el))).toBe("Combine 2");
    expect(mergeButton(el).disabled).toBe(false);
  });
});

describe("legend and paths", () => {
  test("names the cell states in words, and dims the folder", async () => {
    const el = await settleable();
    expect([...el.querySelectorAll(".ui-cfr__key")].map(text)).toEqual(["Changed", "Overlap", "Conflict", "Settled"]);
    const path = el.querySelector(`[data-file="${WAYS.path}"] .ui-cfr__path`)!;
    expect(text(path)).toBe(WAYS.path);
    expect(text(path.querySelector(".ui-cfr__folder"))).toBe("src/app/");
    expect(el.querySelector(`[data-file="${CLEAR.path}"] .ui-cfr__folder`)).toBeNull();
  });

  test("nothing overflows the page when narrow, with the ways stacked", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 320px"><tc-conflict-radar mergeable .agents=${AGENTS} .files=${[WAYS]} selected=${WAYS.path}></tc-conflict-radar></div>`);
    expect(wrap.scrollWidth).toBeLessThanOrEqual(wrap.clientWidth);
    expect(getComputedStyle(wrap.querySelector(".ui-cfr__ways")!).gridTemplateColumns.split(" ")).toHaveLength(1);
  });
});

describe("React", () => {
  test("settled is controlled when given, and survives re-renders when not", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const seen: unknown[] = [];
    const node = (props: object) => React.createElement(ConflictRadar, { agents: AGENTS, files: [WAYS], selected: WAYS.path, ...props });
    await act(async () => root.render(node({})));
    await settle();
    const el = host.querySelector<TcConflictRadar>("tc-conflict-radar")!;
    await act(async () => way(el, "a").click());
    await act(async () => root.render(node({})));
    await settle();
    expect(el.settled).toEqual({ [WAYS.path]: "a" });
    await act(async () => root.render(node({ settled: {}, onSettledChange: (v: unknown) => seen.push(v) })));
    await settle();
    await act(async () => way(el, "b").click());
    await settle();
    expect(seen).toEqual([{ [WAYS.path]: "b" }]);
    expect(el.settled).toEqual({});
    await act(async () => root.unmount());
    host.remove();
  });

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

describe("accessibility of settling", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas`}><tc-conflict-radar mergeable .agents=${AGENTS} .files=${[WAYS, OVER, { ...CONF, path: "kept.ts" }]} selected=${WAYS.path} .settled=${{ "kept.ts": "a" }}></tc-conflict-radar></div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
