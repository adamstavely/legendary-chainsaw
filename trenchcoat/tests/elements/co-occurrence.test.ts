/*
 * <tc-co-occurrence> in real browsers: the rows and their strength, share, counts and score; the header's stats; the
 * sort; opening a row's shared events; the keyboard; controlled use; the React wrapper and axe in both looks and themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/co-occurrence";
import type { CoEntity, CoSelectedChange, CoSortChange, CoSource, TcCoOccurrence } from "../../src/elements/co-occurrence";
import { CoOccurrence } from "../../src/elements/react/co-occurrence";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const DAY = 86_400_000;
const NOW = new Date(2026, 9, 27, 12).getTime();
const SOURCES: CoSource[] = [
  { id: "login", label: "Logins" },
  { id: "pay", label: "Payments" },
];
/** Of 20 events: Ana 16 (80%, always), Ben 10 (50%, frequent), Cy 2 (10%, occasional, but seen most recently) */
const ENTITIES: CoEntity[] = [
  { id: "ben", name: "Ben Ito", detail: "ACC-2", score: 61, together: 10, bySource: { login: 6, pay: 4 }, lastSeen: NOW - 5 * DAY },
  {
    id: "ana",
    name: "Ana Diaz",
    detail: "ACC-1",
    score: 92,
    together: 16,
    bySource: { login: 9, pay: 14 },
    lastSeen: NOW - 9 * DAY,
    events: [
      { source: "login", label: "Same IP range", at: NOW - 9 * DAY },
      { source: "pay", label: "Split payment", at: NOW - 10 * DAY },
      { source: "x", label: "Something else" },
    ],
  },
  { id: "cy", name: "Cy Park", score: 30, together: 2, bySource: { pay: 2 }, lastSeen: NOW - DAY },
];

const row = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`.ui-coc__row[data-id="${id}"]`)!;
const order = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-coc__row")].map((r) => r.dataset.id);
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcCoOccurrence>(html`<tc-co-occurrence look=${look} window="120-day window" events="20" .sources=${SOURCES} .entities=${ENTITIES}></tc-co-occurrence>`);

describe("tc-co-occurrence", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: rows by score with strength, share, counts and score; the header's window and stats`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("coc");
      expect(el.dataset.look).toBe(look);
      expect(order(el)).toEqual(["ana", "ben", "cy"]);
      expect([...el.querySelectorAll<HTMLElement>(".ui-coc__strength")].map((s) => s.textContent!.trim())).toEqual(["Always together", "Frequent", "Occasional"]);
      expect(row(el, "ana").querySelector(".ui-coc__share-text")!.textContent).toBe("80% · 16 of 20 events");
      expect([...row(el, "ana").querySelectorAll(".ui-coc__count")].map((c) => c.textContent!.replace(/\s+/g, " ").trim())).toEqual(["Logins 9", "Payments 14"]);
      expect(row(el, "ana").querySelector(".ui-coc__score-n")!.textContent).toBe("92");
      // The button's name: the visible name, then the rest in words
      expect(row(el, "ana").textContent!.replace(/\s+/g, " ")).toContain("Ana Diaz");
      expect(row(el, "ana").querySelector(".ui-coc__sr")!.textContent).toContain("Always together, score 92, 80%, 16 of 20 events, Logins 9, Payments 14, last seen together");
      expect(el.querySelector(".ui-coc__window")!.textContent).toBe("120-day window");
      const stats = [...el.querySelectorAll(".ui-coc__stat")].map((s) => [...s.querySelectorAll("dt, dd")].map((x) => x.textContent!.replace(/\s+/g, " ").trim()).join(" "));
      // Shared events: 10 + 23 + 2
      expect(stats).toEqual(["Strong correlates 1", "Shared events 35", "Top correlate Ana Diaz80%"]);
      expect(el.querySelectorAll('.ui-coc__list [tabindex="0"]')).toHaveLength(1);
    });
  }

  test("thresholds move the strengths; labels can be renamed; an empty list says so", async () => {
    const el = await make();
    el.thresholds = { always: 0.9, frequent: 0.05 };
    el.strengthLabels = { frequent: "Often" };
    await settle();
    expect([...el.querySelectorAll<HTMLElement>(".ui-coc__strength")].map((s) => s.textContent!.trim())).toEqual(["Often", "Often", "Often"]);
    el.entities = [];
    await settle();
    expect(el.querySelector(".ui-coc__empty")).toBeTruthy();
    expect(el.querySelector(".ui-coc__list")).toBeNull();
  });

  test("the sort: a radio group; share and recent reorder; tc-sort-change is cancelable", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-sort-change", (e) => seen.push((e as Event as CustomEvent<CoSortChange>).detail.sort));
    const radio = (s: string) => el.querySelector<HTMLButtonElement>(`.ui-coc__sort [data-sort="${s}"]`)!;
    expect(radio("score").getAttribute("aria-checked")).toBe("true");
    radio("recent").click();
    await settle();
    expect(order(el)).toEqual(["cy", "ben", "ana"]);
    key(radio("recent"), "ArrowLeft");
    await expect.poll(() => el.sort).toBe("share");
    expect(order(el)).toEqual(["ana", "ben", "cy"]);
    await expect.poll(() => document.activeElement).toBe(radio("share"));
    expect(seen).toEqual(["recent", "share"]);
    el.addEventListener("tc-sort-change", (e) => e.preventDefault());
    radio("score").click();
    await settle();
    expect(el.sort).toBe("share");
  });

  test("click or Enter opens a row's shared events by source; again or Escape closes; tc-selected-change fires", async () => {
    const el = await make();
    const seen: (string | null)[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<CoSelectedChange>).detail.selected));
    row(el, "ana").click();
    await settle();
    expect(el.selected).toBe("ana");
    expect(row(el, "ana").getAttribute("aria-expanded")).toBe("true");
    const detail = document.getElementById(row(el, "ana").getAttribute("aria-controls")!)!;
    expect(detail.getAttribute("aria-label")).toBe("Shared events with Ana Diaz");
    expect([...detail.querySelectorAll(".ui-coc__group-title")].map((t) => t.textContent!.replace(/\s+/g, " ").trim())).toEqual(["Logins1", "Payments1", "Other1"]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Ana Diaz: shared events shown");
    row(el, "ana").click();
    await settle();
    expect(el.selected).toBeNull();
    row(el, "ben").click();
    await settle();
    // No events listed: the counts are all there is
    expect(el.querySelector(".ui-coc__none")).toBeTruthy();
    key(row(el, "ben"), "Escape");
    await settle();
    expect(el.selected).toBeNull();
    expect(seen).toEqual(["ana", null, "ben", null]);
  });

  test("keyboard: ↑ ↓ Home End move a roving tab stop between rows", async () => {
    const el = await make();
    row(el, "ana").focus();
    const at = () => (document.activeElement as HTMLElement).dataset.id;
    for (const [k, want] of [
      ["ArrowDown", "ben"],
      ["End", "cy"],
      ["ArrowDown", "cy"],
      ["Home", "ana"],
      ["ArrowUp", "ana"],
    ] as const) {
      key(document.activeElement!, k);
      await expect.poll(at).toBe(want);
    }
    expect(el.querySelectorAll('.ui-coc__list [tabindex="0"]')).toHaveLength(1);
  });

  test("controlled: preventDefault() keeps the row as it is; an open row whose entity goes away closes", async () => {
    const el = await make();
    el.selected = "ben";
    await settle();
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    row(el, "ana").click();
    await settle();
    expect(el.selected).toBe("ben");
    el.entities = ENTITIES.filter((e) => e.id !== "ben");
    await settle();
    expect(el.selected).toBeNull();
  });

  test("React wrapper: uncontrolled selection survives re-renders; controlled sort waits for the parent", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const opened: unknown[] = [];
    const sorts: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(CoOccurrence, {
        title: "Seen together",
        sources: SOURCES,
        entities: ENTITIES,
        events: 20,
        sort: "score",
        onSortChange: (s) => void sorts.push(s),
        onSelectedChange: (s, e) => void opened.push([s, e?.name]),
        "data-n": n,
      } as React.ComponentProps<typeof CoOccurrence>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-co-occurrence")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Seen together");
    row(el, "ben").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.selected).toBe("ben");
    expect(opened).toEqual([["ben", "Ben Ito"]]);
    el.querySelector<HTMLButtonElement>('.ui-coc__sort [data-sort="recent"]')!.click();
    await settle();
    expect(sorts).toEqual(["recent"]);
    expect(el.sort).toBe("score");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-co-occurrence description="Accounts in the same events." window="120-day window" events="20" .sources=${SOURCES} .entities=${ENTITIES} .selected=${"ana"}></tc-co-occurrence>
        <tc-co-occurrence look="clean" events="20" .sources=${SOURCES} .entities=${ENTITIES} .selected=${"ben"}></tc-co-occurrence>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
