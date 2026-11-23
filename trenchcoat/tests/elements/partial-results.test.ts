/*
 * <tc-partial-results> in real browsers: the headline and bar in words, groups by reason, retrying one or every failed item,
 * Continue and Download, the notice variant, counts given as numbers, narrow, React and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/partial-results";
import type { PartialResultItem, PartialResultsCollapsedChange, PartialResultsContinue, PartialResultsExport, PartialResultsRetry, TcPartialResults } from "../../src/elements/partial-results";
import { PartialResults } from "../../src/elements/react/partial-results";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const OPEN = "Couldn't open the file";
const ITEMS: PartialResultItem[] = [
  { id: "d1", label: "Case 1", status: "done" },
  { id: "d2", label: "Case 2", status: "done" },
  { id: "d3", label: "Case 3", status: "done" },
  { id: "f1", label: "Case 4", status: "failed", reason: OPEN, detail: "Password protected" },
  { id: "f2", label: "Case 5", status: "failed", reason: OPEN },
  { id: "f3", label: "Case 6", status: "failed", reason: "Timed out" },
  { id: "s1", label: "Case 7", status: "skipped", reason: "Already done" },
];
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const view = () => fixture<TcPartialResults>(html`<tc-partial-results .items=${ITEMS}></tc-partial-results>`);
const toggles = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-ptr__group-toggle")];
const action = (el: Element, name: string) => el.querySelector<HTMLButtonElement>(`[data-action="${name}"]`);
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-partial-results", () => {
  test("says how many finished and how many didn't, with a bar that reads as text", async () => {
    const el = await view();
    expect(el.dataset.ui).toBe("ptr");
    expect(text(el.querySelector(".ui-ptr__headline"))).toBe("3 of 7 finished · 4 didn't");
    expect(el.querySelector(".ui-ptr__bar")!.getAttribute("aria-label")).toBe("3 finished, 3 failed, 1 skipped");
    expect([...el.querySelectorAll<HTMLElement>(".ui-ptr__seg")].map((s) => s.dataset.status)).toEqual(["done", "failed", "skipped"]);
    expect(el.querySelector(".ui-ptr__legend")!.getAttribute("aria-hidden")).toBe("true");
  });

  test("groups the unfinished items by reason, biggest first", async () => {
    const el = await view();
    expect(toggles(el).map(text)).toEqual([`${OPEN} (2)`, "Timed out (1)", "Already done (1)"]);
    const first = el.querySelector(".ui-ptr__group")!;
    expect([...first.querySelectorAll(".ui-ptr__label")].map(text)).toEqual(["Case 4", "Case 5"]);
    expect(text(first.querySelector(".ui-ptr__status"))).toBe("Failed · Password protected");
    expect(text(first.querySelector(".ui-ptr__retry"))).toBe("Retry Case 4");
  });

  test("items with no reason group together", async () => {
    const el = await fixture<TcPartialResults>(html`<tc-partial-results .items=${[{ id: "x", label: "X", status: "failed" }]}></tc-partial-results>`);
    expect(text(toggles(el)[0])).toBe("No reason given (1)");
  });

  test("a group closes and reports it, unless prevented", async () => {
    const el = await view();
    let detail: PartialResultsCollapsedChange | null = null;
    el.addEventListener("tc-collapsed-change", (e) => (detail = (e as CustomEvent<PartialResultsCollapsedChange>).detail), { once: true });
    toggles(el)[1]!.click();
    await settle();
    expect(detail).toEqual({ collapsed: ["Timed out"] });
    expect(toggles(el)[1]!.getAttribute("aria-expanded")).toBe("false");
    expect(el.querySelectorAll(".ui-ptr__item")).toHaveLength(3);
    el.addEventListener("tc-collapsed-change", (e) => e.preventDefault());
    toggles(el)[0]!.click();
    await settle();
    expect(el.collapsed).toEqual(["Timed out"]);
  });

  test("the groups are one tab stop and the arrows move", async () => {
    const el = await view();
    expect(toggles(el).filter((t) => t.tabIndex === 0)).toHaveLength(1);
    toggles(el)[0]!.focus();
    key(toggles(el)[0]!, "ArrowDown");
    await expect.poll(() => document.activeElement).toBe(toggles(el)[1]);
    key(toggles(el)[1]!, "End");
    await expect.poll(() => document.activeElement).toBe(toggles(el)[2]);
    key(toggles(el)[2]!, "Home");
    await expect.poll(() => document.activeElement).toBe(toggles(el)[0]);
  });

  test("Retry failed sends every failed item, not the skipped one, and marks them retrying", async () => {
    const el = await view();
    let detail: PartialResultsRetry | null = null;
    el.addEventListener("tc-retry", (e) => (detail = (e as CustomEvent<PartialResultsRetry>).detail));
    expect(text(action(el, "retry"))).toBe("Retry failed (3)");
    action(el, "retry")!.click();
    await settle();
    expect(detail!.ids).toEqual(["f1", "f2", "f3"]);
    expect(el.retrying).toEqual(["f1", "f2", "f3"]);
    expect(el.querySelectorAll(".ui-ptr__item[data-retrying]")).toHaveLength(3);
    expect(text(el.querySelector(".ui-ptr__item[data-retrying] .ui-ptr__status"))).toContain("Retrying…");
    expect(el.querySelector<HTMLButtonElement>(".ui-ptr__item[data-retrying] .ui-ptr__retry")!.disabled).toBe(true);
    expect(action(el, "retry")).toBeNull();
    expect(text(el.querySelector('[role="status"]'))).toBe("Retrying 3");
  });

  test("retry one, and replacing the item ends its retry", async () => {
    const el = await view();
    el.querySelector<HTMLButtonElement>(".ui-ptr__retry")!.click();
    await settle();
    expect(el.retrying).toEqual(["f1"]);
    expect(text(el.querySelector('[role="status"]'))).toBe("Retrying Case 4");
    el.items = ITEMS.map((i) => (i.id === "f1" ? { ...i, status: "done" as const } : i));
    await settle();
    expect(el.retrying).toEqual([]);
    expect(text(el.querySelector(".ui-ptr__headline"))).toBe("4 of 7 finished · 3 didn't");
  });

  test("preventDefault on retry leaves nothing retrying", async () => {
    const el = await view();
    el.addEventListener("tc-retry", (e) => e.preventDefault());
    action(el, "retry")!.click();
    await settle();
    expect(el.retrying).toEqual([]);
  });

  test("Continue sends the finished ids", async () => {
    const el = await view();
    let detail: PartialResultsContinue | null = null;
    el.addEventListener("tc-continue", (e) => (detail = (e as CustomEvent<PartialResultsContinue>).detail));
    expect(text(action(el, "continue"))).toBe("Continue with 3 finished");
    action(el, "continue")!.click();
    expect(detail).toEqual({ done: ["d1", "d2", "d3"] });
  });

  test("Download hands over the unfinished items as CSV", async () => {
    const el = await view();
    let detail: PartialResultsExport | null = null;
    el.addEventListener("tc-export", (e) => {
      detail = (e as CustomEvent<PartialResultsExport>).detail;
      e.preventDefault();
    });
    action(el, "download")!.click();
    expect(detail!.items).toHaveLength(4);
    expect(detail!.csv.split("\n")).toEqual(["label,status,reason,detail", `Case 4,Failed,Couldn't open the file,Password protected`, `Case 5,Failed,Couldn't open the file,`, "Case 6,Failed,Timed out,", "Case 7,Skipped,Already done,"]);
  });

  test("counts given as numbers: the rest of the total shows as skipped", async () => {
    const el = await fixture<TcPartialResults>(html`<tc-partial-results total="40" done="34" .items=${ITEMS.filter((i) => i.status === "failed")}></tc-partial-results>`);
    expect(text(el.querySelector(".ui-ptr__headline"))).toBe("34 of 40 finished · 6 didn't");
    expect(el.querySelector(".ui-ptr__bar")!.getAttribute("aria-label")).toBe("34 finished, 3 failed, 3 skipped");
  });

  test("all finished says so, with no actions but Continue", async () => {
    const el = await fixture<TcPartialResults>(html`<tc-partial-results .items=${ITEMS.slice(0, 3)}></tc-partial-results>`);
    expect(text(el.querySelector(".ui-ptr__headline"))).toBe("All finished");
    expect(el.querySelector(".ui-ptr__groups")).toBeNull();
    expect(action(el, "retry")).toBeNull();
    expect(action(el, "download")).toBeNull();
    expect(action(el, "continue")).toBeTruthy();
  });

  test("the notice is one line and a Retry", async () => {
    const el = await fixture<TcPartialResults>(html`<tc-partial-results variant="notice" .items=${ITEMS}></tc-partial-results>`);
    expect(el.querySelector(".ui-ptr__card")).toBeNull();
    expect(text(el.querySelector(".ui-ptr__notice"))).toBe("3 of 7 finished · 4 didn't Retry failed (3)");
    expect(getComputedStyle(el).backgroundColor).toBe("rgba(0, 0, 0, 0)");
  });

  test("renamed words and hidden actions", async () => {
    const el = await fixture<TcPartialResults>(html`<tc-partial-results hide-continue hide-download .items=${ITEMS} .labels=${{ retryFailed: "Try {n} again" }}></tc-partial-results>`);
    expect(text(action(el, "retry"))).toBe("Try 3 again");
    expect(action(el, "continue")).toBeNull();
    expect(action(el, "download")).toBeNull();
  });

  test("narrow: no overflow", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 300px"><tc-partial-results .items=${ITEMS}></tc-partial-results></div>`);
    const card = wrap.querySelector<HTMLElement>(".ui-ptr__card")!;
    expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth + 1);
  });
});

describe("React", () => {
  test("an uncontrolled group stays closed, and a controlled one follows the parent", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const node = (extra = {}) => React.createElement(PartialResults, { items: ITEMS, ...extra });
    await act(async () => root.render(node()));
    await settle();
    const el = host.querySelector<TcPartialResults>("tc-partial-results")!;
    await act(async () => toggles(el)[0]!.click());
    await act(async () => root.render(node()));
    await settle();
    expect(el.collapsed).toEqual([OPEN]);
    await act(async () => root.render(node({ collapsed: ["Timed out"] })));
    await settle();
    await act(async () => toggles(el)[0]!.click());
    await settle();
    expect(el.collapsed).toEqual(["Timed out"]);
    expect(el.heading).toBe("Partial results");
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas`}><tc-partial-results variant="notice" .items=${ITEMS}></tc-partial-results><tc-partial-results .items=${ITEMS} .retrying=${["f2"]}></tc-partial-results></div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
