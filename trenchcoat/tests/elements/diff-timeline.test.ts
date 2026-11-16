/*
 * <tc-diff-timeline> in real browsers: totals, the chart, rows in the order reached, the grid's keyboard, the detail,
 * replay by `time` and the scrubber, live mode, paths that give way in the middle, the React wrapper and axe in both
 * looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/diff-timeline";
import { diffTimelineOffset, diffTimelineSeries, type DiffTimelineFile, type DiffTimelineSelectedChange, type DiffTimelineTimeChange, type TcDiffTimeline } from "../../src/elements/diff-timeline";
import { DiffTimeline } from "../../src/elements/react/diff-timeline";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const T = 1_000_000;
const FILES: DiffTimelineFile[] = [
  {
    path: "src/zone/gaps.ts",
    edits: [
      { id: "g1", at: T + 120_000, added: 30, removed: 0, summary: "Find gaps" },
      { id: "g2", at: T + 360_000, added: 4, removed: 1 },
    ],
  },
  {
    path: "src/parse/local.ts",
    edits: [
      { id: "l1", at: T + 60_000, added: 10, removed: 4, summary: "Detect a skipped hour", diff: "-old line\n+new line\n same" },
      { id: "l2", at: T + 300_000, added: 5, removed: 2 },
    ],
  },
  { path: "CHANGELOG.md", edits: [{ id: "c1", at: T + 540_000, added: 2, removed: 0 }] },
];
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const timeline = (extra: { time?: number | null } = {}) =>
  fixture<TcDiffTimeline>(html`<tc-diff-timeline heading="PR" .files=${FILES} .start=${T} .end=${T + 600_000} .time=${extra.time ?? null}></tc-diff-timeline>`);
const mark = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-dtl__mark[data-edit="${id}"]`)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-diff-timeline", () => {
  for (const look of ["standard", "clean"]) {
    test(`renders in ${look}: totals, the chart and a grid with one tab stop`, async () => {
      const wrap = await fixture<HTMLElement>(html`<div><tc-diff-timeline look=${look} heading="PR" .files=${FILES}></tc-diff-timeline></div>`);
      const el = wrap.querySelector<TcDiffTimeline>("tc-diff-timeline")!;
      expect(el.dataset.ui).toBe("dtl");
      expect(el.dataset.look).toBe(look);
      expect(text(el.querySelector(".ui-dtl__totals"))).toContain("+51 added");
      expect(text(el.querySelector(".ui-dtl__totals"))).toContain("−7 removed");
      expect(text(el.querySelector(".ui-dtl__file-count"))).toBe("3 files");
      expect(el.querySelector(".ui-dtl__plot")!.getAttribute("aria-label")).toBe("Lines added and removed over the run: 51 added, 7 removed");
      expect(el.querySelector('[role="grid"]')).toBeTruthy();
      expect([...el.querySelectorAll(".ui-dtl__mark")].filter((m) => m.getAttribute("tabindex") === "0")).toHaveLength(1);
    });
  }

  test("the series adds up in time order", () => {
    expect(diffTimelineSeries(FILES)).toEqual([
      { at: T + 60_000, added: 10, removed: 4 },
      { at: T + 120_000, added: 40, removed: 4 },
      { at: T + 300_000, added: 45, removed: 6 },
      { at: T + 360_000, added: 49, removed: 7 },
      { at: T + 540_000, added: 51, removed: 7 },
    ]);
    expect(diffTimelineSeries(FILES, T + 200_000)).toHaveLength(2);
    expect(diffTimelineOffset(125_000)).toBe("2:05");
    expect(diffTimelineOffset(3_725_000)).toBe("1:02:05");
  });

  test("rows come in the order the agent reached the files, with per-file totals and marks on the axis", async () => {
    const el = await timeline();
    const rows = [...el.querySelectorAll<HTMLElement>(".ui-dtl__row")];
    expect(rows.map((r) => r.dataset.path)).toEqual(["src/parse/local.ts", "src/zone/gaps.ts", "CHANGELOG.md"]);
    expect(text(rows[0]!.querySelector(".ui-dtl__counts"))).toBe("+15 −6");
    const track = rows[0]!.querySelector<HTMLElement>(".ui-dtl__track")!.getBoundingClientRect();
    const first = mark(el, "l1").getBoundingClientRect();
    const later = mark(el, "l2").getBoundingClientRect();
    expect(later.left).toBeGreaterThan(first.left);
    expect(first.left + first.width / 2 - track.left).toBeCloseTo(track.width * 0.1, -1);
    expect(text(mark(el, "l1"))).toBe("1:00, +10 added, −4 removed, Detect a skipped hour");
  });

  test("pointing at an edit shows its diff; a click keeps it, Escape closes it", async () => {
    const el = await timeline();
    mark(el, "l1").dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    const detail = el.querySelector(".ui-dtl__detail")!;
    expect(text(detail.querySelector(".ui-dtl__summary"))).toBe("Detect a skipped hour");
    const lines = [...detail.querySelectorAll<HTMLElement>(".ui-dtl__line")];
    expect(lines.map((l) => l.dataset.kind)).toEqual(["removed", "added", "same"]);
    expect(text(lines[0])).toBe("Removed: -old line");
    mark(el, "l1").dispatchEvent(new PointerEvent("pointerleave"));
    await settle();
    expect(el.querySelector(".ui-dtl__detail")).toBeNull();

    const seen: DiffTimelineSelectedChange[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<DiffTimelineSelectedChange>).detail));
    mark(el, "g1").click();
    await settle();
    expect(seen[0]).toMatchObject({ selected: "g1", path: "src/zone/gaps.ts", edit: { id: "g1" } });
    expect(mark(el, "g1").getAttribute("aria-pressed")).toBe("true");
    expect(el.querySelector(".ui-dtl__close")).toBeTruthy();
    key(mark(el, "g1"), "Escape");
    await settle();
    expect(el.selected).toBeNull();
    await expect.poll(() => document.activeElement).toBe(mark(el, "g1"));
  });

  test("a prevented pick keeps the selection as it was", async () => {
    const el = await timeline();
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    mark(el, "l1").click();
    await settle();
    expect(el.selected).toBeNull();
  });

  test("arrow keys move along a file and to the nearest edit in the next one", async () => {
    const el = await timeline();
    mark(el, "l1").focus();
    key(mark(el, "l1"), "ArrowRight");
    await expect.poll(() => document.activeElement).toBe(mark(el, "l2"));
    key(mark(el, "l2"), "ArrowDown");
    await expect.poll(() => document.activeElement).toBe(mark(el, "g2"));
    key(mark(el, "g2"), "Home");
    await expect.poll(() => document.activeElement).toBe(mark(el, "g1"));
    key(mark(el, "g1"), "ArrowDown");
    await expect.poll(() => document.activeElement).toBe(mark(el, "c1"));
    expect(mark(el, "c1").getAttribute("tabindex")).toBe("0");
  });

  test("replay shows the pull request as it was: rows appear when reached, totals and a cursor follow", async () => {
    const el = await timeline({ time: T + 200_000 });
    expect([...el.querySelectorAll<HTMLElement>(".ui-dtl__row")].map((r) => r.dataset.path)).toEqual(["src/parse/local.ts", "src/zone/gaps.ts"]);
    expect(text(el.querySelector(".ui-dtl__totals"))).toContain("+40 added");
    expect(el.querySelector(".ui-dtl__cursor")).toBeTruthy();
    expect(mark(el, "l2")).toBeNull();
    expect(text(el.querySelector(".ui-dtl__controls .ui-dtl__at"))).toBe("3:20");
    const early = await timeline({ time: T + 10_000 });
    expect(text(early.querySelector(".ui-dtl__none"))).toBe("No file reached yet at this point.");
  });

  test("the scrubber sets `time`, the end clears it, and prevention keeps it", async () => {
    const el = await timeline();
    const scrub = el.querySelector<HTMLInputElement>(".ui-dtl__scrub")!;
    const seen: DiffTimelineTimeChange[] = [];
    el.addEventListener("tc-time-change", (e) => seen.push((e as CustomEvent<DiffTimelineTimeChange>).detail));
    scrub.value = String(T + 100_000);
    scrub.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(seen.at(-1)).toEqual({ time: T + 100_000 });
    expect(el.time).toBe(T + 100_000);
    expect(el.querySelector(".ui-dtl__all")).toBeTruthy();
    el.querySelector<HTMLElement>(".ui-dtl__all")!.click();
    await settle();
    expect(el.time).toBeNull();
    el.addEventListener("tc-time-change", (e) => e.preventDefault());
    scrub.value = String(T + 50_000);
    scrub.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(el.time).toBeNull();
  });

  test("Play steps the replay through to the end", async () => {
    const el = await timeline();
    const play = el.querySelector<HTMLButtonElement>(".ui-dtl__play")!;
    play.click();
    await settle();
    expect(play.getAttribute("aria-pressed")).toBe("true");
    await expect.poll(() => el.time).not.toBeNull();
    play.click();
    await settle();
    expect(play.getAttribute("aria-pressed")).toBe("false");
    const at = el.time;
    await settle();
    expect(el.time).toBe(at);
  });

  test("live: the axis runs to now, and the clock ticks only without `now`", async () => {
    const start = Date.now() - 60_000;
    const el = await fixture<TcDiffTimeline>(html`<tc-diff-timeline live .files=${[{ path: "a.ts", edits: [{ id: "a", at: start + 10_000, added: 1, removed: 0 }] }]} .start=${start}></tc-diff-timeline>`);
    expect(text(el.querySelector(".ui-dtl__live"))).toBe("Live");
    await expect.poll(() => el.ticking).toBe(true);
    expect(el.range[1]).toBeGreaterThanOrEqual(start + 60_000);
    el.now = start + 120_000;
    await settle();
    expect(el.ticking).toBe(false);
    expect(el.range[1]).toBe(start + 120_000);
    el.remove();
    expect(el.ticking).toBe(false);
  });

  test("a long path keeps its file name when narrow, and nothing spills out", async () => {
    const files = [{ path: "packages/core/src/very/deeply/nested/folder/structure/parse-local-time.ts", edits: [{ id: "a", at: T, added: 3, removed: 1 }] }];
    const wrap = await fixture<HTMLElement>(html`<div style="width: 320px"><tc-diff-timeline .files=${files} .start=${T} .end=${T + 60_000}></tc-diff-timeline></div>`);
    const card = wrap.querySelector<HTMLElement>(".ui-dtl__card")!;
    expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth + 1);
    const dir = wrap.querySelector<HTMLElement>(".ui-dtl__row .ui-dtl__dir")!;
    const name = wrap.querySelector<HTMLElement>(".ui-dtl__row .ui-dtl__name")!;
    expect(dir.scrollWidth).toBeGreaterThan(dir.clientWidth);
    expect(name.scrollWidth).toBeLessThanOrEqual(name.clientWidth + 1);
  });

  test("an empty pull request says so, and a vanished selection clears", async () => {
    const empty = await fixture<TcDiffTimeline>(html`<tc-diff-timeline .files=${[]}></tc-diff-timeline>`);
    expect(text(empty.querySelector(".ui-dtl__none"))).toBe("No edits yet.");
    const el = await fixture<TcDiffTimeline>(html`<tc-diff-timeline .files=${FILES} selected="c1"></tc-diff-timeline>`);
    el.files = FILES.slice(0, 2);
    await settle();
    expect(el.selected).toBeNull();
  });
});

describe("React", () => {
  test("an uncontrolled selection survives re-renders, and controlled `time` and `selected` stay", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const node = (extra = {}) => React.createElement(DiffTimeline, { title: "PR", files: FILES, start: T, end: T + 600_000, ...extra });
    await act(async () => root.render(node()));
    await settle();
    const el = host.querySelector<TcDiffTimeline>("tc-diff-timeline")!;
    expect(el.heading).toBe("PR");
    await act(async () => mark(el, "l1").click());
    await act(async () => root.render(node()));
    await settle();
    expect(el.selected).toBe("l1");
    await act(async () => root.render(node({ selected: "g1", time: T + 400_000 })));
    await settle();
    await act(async () => mark(el, "l1").click());
    const scrub = el.querySelector<HTMLInputElement>(".ui-dtl__scrub")!;
    await act(async () => {
      scrub.value = String(T + 100_000);
      scrub.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await settle();
    expect(el.selected).toBe("g1");
    expect(el.time).toBe(T + 400_000);
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas`}><tc-diff-timeline look=${look} heading="PR" .files=${FILES} .start=${T} .end=${T + 600_000} .time=${T + 400_000} selected="l1"></tc-diff-timeline></div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
