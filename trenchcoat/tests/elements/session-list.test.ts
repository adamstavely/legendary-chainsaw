/*
 * <tc-session-list> in real browsers: pinned first and the grouping, status in words, the filter, selecting, Pin and
 * Archive with their cancelable events, the one tab stop, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/session-list";
import type { SessionItem, TcSessionList } from "../../src/elements/session-list";
import { SessionList } from "../../src/elements/react/session-list";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = Date.UTC(2026, 10, 2, 15, 0);
const M = 60_000;
const SESSIONS: SessionItem[] = [
  { id: "a", title: "Booking calendar", status: "waiting", project: "sample-tracker", branch: "feature/booking-calendar", updated: NOW - 2 * M, unread: true },
  { id: "b", title: "Fix CSV export", status: "running", project: "sample-tracker", branch: "fix/sample-export", updated: NOW - 1 * M, detail: "Running tests" },
  { id: "c", title: "Weekly report", status: "done", project: "facility-reports", updated: NOW - 26 * 60 * M, pinned: true },
  { id: "d", title: "Chart upgrade", status: "failed", project: "facility-reports", updated: NOW - 50 * 60 * M },
  { id: "e", title: "Explain scheduling", status: "idle", updated: new Date(NOW - 3 * 24 * 60 * M).toISOString() },
];
const make = (look: "standard" | "clean" = "standard") => fixture<TcSessionList>(html`<tc-session-list look=${look} .sessions=${SESSIONS} .now=${NOW}></tc-session-list>`);
const ids = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-sesl__row")].map((r) => r.dataset.row);
const heads = (el: Element) => [...el.querySelectorAll(".ui-sesl__group-head")].map((h) => h.textContent);
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-row="${id}"]`)!;

describe("tc-session-list", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: pinned first, then by project, newest first, one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("sesl");
      expect(el.dataset.look).toBe(look);
      expect(heads(el)).toEqual(["Pinned", "facility-reports", "sample-tracker", "Other"]);
      expect(ids(el)).toEqual(["c", "d", "b", "a", "e"]);
      expect(el.querySelectorAll('button[tabindex="0"]')).toHaveLength(1);
    });
  }

  test("each row says its status and unread in words, with branch, detail and time", async () => {
    const el = await make();
    expect(row(el, "a").querySelector(".ui-sesl__open")!.textContent!.replace(/\s+/g, " ")).toContain("Booking calendar");
    expect(row(el, "a").querySelector(".tc-sr-only")!.textContent).toBe(", Needs you, unread");
    expect(row(el, "a").querySelector(".ui-sesl__unread")).not.toBeNull();
    expect(row(el, "b").querySelector(".ui-sesl__branch")!.textContent).toBe("fix/sample-export");
    expect(row(el, "b").querySelector(".ui-sesl__detail")!.textContent).toBe("Running tests · 1m ago");
    expect(row(el, "e").querySelector(".ui-sesl__detail")!.textContent).toBe("3d ago");
  });

  test("grouping by status and by nothing", async () => {
    const el = await make();
    el.groupBy = "status";
    await settle();
    expect(heads(el)).toEqual(["Pinned", "Needs you", "Running", "Failed", "Idle"]);
    el.groupBy = "none";
    await settle();
    expect(heads(el)).toEqual(["Pinned"]);
    expect(ids(el)).toEqual(["c", "b", "a", "d", "e"]);
  });

  test("the filter narrows, says when nothing matches, and can be prevented", async () => {
    const el = await make();
    const input = el.querySelector<HTMLInputElement>(".ui-sesl__filter")!;
    input.value = "export";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(ids(el)).toEqual(["b"]);
    input.value = "facility";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(ids(el)).toEqual(["c", "d"]);
    el.addEventListener("tc-query-change", (e) => e.preventDefault(), { once: true });
    input.value = "zzz";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(el.query).toBe("facility");
    expect(input.value).toBe("facility");
    el.query = "zzz";
    await settle();
    expect(el.querySelector(".ui-sesl__empty")!.textContent).toBe("No sessions match");
  });

  test("clicking selects, unless prevented; the open row has aria-current", async () => {
    const el = await make();
    const seen: unknown[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent).detail.selected));
    row(el, "b").querySelector<HTMLElement>(".ui-sesl__open")!.click();
    await settle();
    expect(el.selected).toBe("b");
    expect(row(el, "b").querySelector(".ui-sesl__open")!.getAttribute("aria-current")).toBe("true");
    el.addEventListener("tc-selected-change", (e) => e.preventDefault(), { once: true });
    row(el, "d").querySelector<HTMLElement>(".ui-sesl__open")!.click();
    await settle();
    expect(el.selected).toBe("b");
    expect(seen).toEqual(["b", "d"]);
  });

  test("Pin and Archive are events with the session; announced unless prevented", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-pin", (e) => seen.push(`pin ${(e as CustomEvent).detail.id} ${(e as CustomEvent).detail.pinned}`));
    el.addEventListener("tc-archive", (e) => seen.push(`archive ${(e as CustomEvent).detail.session.title}`));
    const pins = (id: string) => row(el, id).querySelector<HTMLElement>('[data-c="1"]')!;
    expect(pins("c").getAttribute("aria-pressed")).toBe("true");
    expect(pins("c").textContent!.trim()).toBe("Unpin Weekly report");
    pins("a").click();
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Pinned Booking calendar");
    row(el, "d").querySelector<HTMLElement>('[data-c="2"]')!.click();
    await settle();
    expect(seen).toEqual(["pin a true", "archive Chart upgrade"]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Archived Chart upgrade");
    el.addEventListener("tc-archive", (e) => e.preventDefault());
    row(el, "a").querySelector<HTMLElement>('[data-c="2"]')!.click();
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Archived Chart upgrade");
  });

  test("keyboard: arrows cross groups and reach Pin and Archive; Home and End", async () => {
    const el = await make();
    const focused = () => {
      const a = document.activeElement as HTMLElement;
      return `${a.closest<HTMLElement>("[data-row]")?.dataset.row}:${a.dataset.c}`;
    };
    el.querySelector<HTMLElement>('button[tabindex="0"]')!.focus();
    const key = (k: string) => document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
    key("ArrowDown");
    await expect.poll(focused).toBe("d:0");
    key("ArrowDown");
    await expect.poll(focused).toBe("b:0");
    key("ArrowRight");
    await expect.poll(focused).toBe("b:1");
    key("ArrowRight");
    await expect.poll(focused).toBe("b:2");
    key("End");
    await expect.poll(focused).toBe("e:2");
    key("Home");
    await expect.poll(focused).toBe("c:2");
    expect(el.querySelectorAll('button[tabindex="0"]')).toHaveLength(1);
  });

  test("empty, New session and header buttons", async () => {
    const el = await fixture<TcSessionList>(html`<tc-session-list .actions=${[{ id: "sort", label: "Sort", icon: "M3 6h18" }]}></tc-session-list>`);
    expect(el.querySelector(".ui-sesl__empty")!.textContent).toBe("No sessions yet");
    expect(el.querySelector(".ui-sesl__filter")).toBeNull();
    const seen: string[] = [];
    el.addEventListener("tc-create", () => seen.push("create"));
    el.addEventListener("tc-action", (e) => seen.push((e as CustomEvent).detail.id));
    el.querySelector<HTMLElement>(".ui-sesl__create")!.click();
    el.querySelector<HTMLElement>(".ui-sesl__action")!.click();
    expect(seen).toEqual(["create", "sort"]);
    el.hideCreate = true;
    await settle();
    expect(el.querySelector(".ui-sesl__create")).toBeNull();
  });

  test("the tab stop moves on when its session goes away", async () => {
    const el = await make();
    el.sessions = SESSIONS.filter((s) => s.id !== "c");
    await settle();
    expect(el.querySelector('button[tabindex="0"]')!.closest<HTMLElement>("[data-row]")!.dataset.row).toBe("d");
  });

  test("React: an uncontrolled selection survives re-renders; a controlled one waits for the parent", async () => {
    const wrap = document.body.appendChild(document.createElement("div"));
    const root = createRoot(wrap);
    const seen: string[] = [];
    await act(async () => root.render(React.createElement(SessionList, { title: "Mine", sessions: SESSIONS, now: NOW, defaultSelected: "a" })));
    const el = wrap.querySelector<TcSessionList>("tc-session-list")!;
    await settle();
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Mine");
    row(el, "d").querySelector<HTMLElement>(".ui-sesl__open")!.click();
    await act(async () => root.render(React.createElement(SessionList, { title: "Mine", sessions: [...SESSIONS], now: NOW, defaultSelected: "a" })));
    expect(el.selected).toBe("d");
    await act(async () => root.unmount());
    const root2 = createRoot(wrap);
    await act(async () => root2.render(React.createElement(SessionList, { sessions: SESSIONS, now: NOW, selected: "a", onSelectedChange: (id, s) => void seen.push(`${id} ${s?.title}`) })));
    const el2 = wrap.querySelector<TcSessionList>("tc-session-list")!;
    await settle();
    row(el2, "b").querySelector<HTMLElement>(".ui-sesl__open")!.click();
    await settle();
    expect(seen).toEqual(["b Fix CSV export"]);
    expect(el2.selected).toBe("a");
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = document.body.appendChild(document.createElement("div"));
      wrap.style.cssText = `color-scheme: ${theme}; width: 340px`;
      wrap.innerHTML = `<tc-session-list look="standard"></tc-session-list><tc-session-list look="clean" group-by="status"></tc-session-list><tc-session-list look="clean" heading="Empty"></tc-session-list>`;
      const els = [...wrap.querySelectorAll<TcSessionList>("tc-session-list")];
      for (const el of els.slice(0, 2)) Object.assign(el, { sessions: SESSIONS, now: NOW, selected: "b" });
      await settle(wrap);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
