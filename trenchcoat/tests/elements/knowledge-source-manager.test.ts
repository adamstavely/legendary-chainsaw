/*
 * <tc-knowledge-source-manager> in real browsers: rows and states, the listbox keyboard, the open source and its
 * actions, remove with confirmation and focus, schedule changes, the attention filter, windowing, controlled use,
 * the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/knowledge-source-manager";
import type { KnowledgePauseEvent, KnowledgeSource, KnowledgeSourceEvent, KnowledgeSourcesChange, TcKnowledgeSourceManager } from "../../src/elements/knowledge-source-manager";
import { KnowledgeSourceManager } from "../../src/elements/react/knowledge-source-manager";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = Date.parse("2026-10-24T12:00:00Z");
const H = 3_600_000;
const SOURCES: KnowledgeSource[] = [
  { id: "help", name: "Help centre", kind: "site", location: "https://help.example.com", state: "ready", docs: 1204, chunks: 18_310, lastSync: NOW - 2 * H, schedule: "daily" },
  { id: "docs", name: "Product docs", kind: "connector", state: "indexing", progress: 0.42, docs: 860, chunks: 9_420, lastSync: NOW - 26 * H, schedule: "hourly" },
  { id: "macros", name: "Support macros", kind: "connector", state: "queued", docs: 312 },
  { id: "pricing", name: "Pricing PDFs", kind: "file", state: "failed", error: "3 files have no text to index.", docs: 11, chunks: 240, lastSync: "Yesterday", schedule: "manual" },
  { id: "notes", name: "Release notes", kind: "site", state: "ready", docs: 148, chunks: 1960, lastSync: NOW - 41 * 24 * H, stale: "12 pages changed since." },
  { id: "old", name: "Help centre (old)", kind: "site", state: "paused", docs: 1188, chunks: 17_904, duplicateOf: "help" },
];

const mount = (look: "standard" | "clean" = "standard", sources = SOURCES) =>
  fixture<TcKnowledgeSourceManager>(html`<tc-knowledge-source-manager look=${look} .sources=${sources} now=${NOW}></tc-knowledge-source-manager>`);
const list = (el: Element) => el.querySelector<HTMLElement>(".ui-ksm__list")!;
const rows = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-ksm__row")];
const row = (el: Element, name: string) => rows(el).find((r) => r.querySelector(".ui-ksm__name")!.textContent === name)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const text = (n: Element | null) => n?.textContent?.replace(/\s+/g, " ").trim();
const btn = (el: Element, cls: string) => el.querySelector<HTMLButtonElement>(`.ui-ksm__detail .ui-ksm__${cls}`)!;

describe("tc-knowledge-source-manager", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the host, the header, and each row's state, counts, sync and warnings`, async () => {
      const el = await mount(look);
      expect(el.dataset.ui).toBe("ksm");
      expect(el.dataset.look).toBe(look);
      expect(text(el.querySelector(".tc-head__title"))).toBe("Knowledge sources");
      expect(text(el.querySelector(".tc-head__sub"))).toBe("6 sources · 48k chunks · 2 indexing");
      expect(el.querySelector(":scope > .tc-head + .ui-ksm__card")).toBeTruthy();
      expect(el.querySelector(".tc-head__aside > .ui-ksm__add")).toBeTruthy();
      expect(list(el).getAttribute("role")).toBe("listbox");
      expect(document.getElementById(list(el).getAttribute("aria-labelledby")!)!.textContent).toBe("Knowledge sources");
      const r = rows(el);
      expect(r).toHaveLength(6);
      expect(r[0].getAttribute("role")).toBe("option");
      expect(r[0].getAttribute("aria-setsize")).toBe("6");
      expect(text(r[0])).toBe("Help centre , Ready . 1,204 docs · 18k chunks · Synced 2h ago · Daily");
      expect(text(r[1].querySelector(".ui-ksm__state"))).toBe("Indexing 42%");
      expect(r[1].querySelector<HTMLElement>(".ui-ksm__bar > span")!.style.width).toBe("42%");
      expect(text(r[2].querySelector(".ui-ksm__meta"))).toBe(". 312 docs");
      expect(text(r[3].querySelector(".ui-ksm__meta"))).toBe(". 3 files have no text to index.");
      expect(r[3].querySelector(".ui-ksm__meta")!.hasAttribute("data-failed")).toBe(true);
      expect(text(r[4].querySelector(".ui-ksm__flag"))).toBe(", Stale");
      // Over a month: the date
      expect(text(r[4].querySelector(".ui-ksm__meta"))).toMatch(/Synced (?!.*ago)/);
      expect(text(r[5].querySelector(".ui-ksm__flag"))).toBe(", Duplicate");
      expect(text(r[5].querySelector(".ui-ksm__meta"))).toBe(". 1,188 docs · 18k chunks · Never synced");
    });
  }

  test("the listbox: arrows, Home, End and Page keys move and pick (selection follows focus); Escape closes", async () => {
    const el = await mount();
    const picked: (string | null)[] = [];
    el.addEventListener("tc-selected-change", (e) => picked.push((e as CustomEvent).detail.selected));
    const l = list(el);
    l.focus();
    await settle();
    key(l, "ArrowDown");
    await settle();
    expect(el.selected).toBe("docs");
    expect(l.getAttribute("aria-activedescendant")).toBe(rows(el)[1].id);
    expect(rows(el)[1].getAttribute("aria-selected")).toBe("true");
    key(l, "End");
    await settle();
    expect(el.selected).toBe("old");
    key(l, "Home");
    await settle();
    expect(el.selected).toBe("help");
    key(l, "PageDown");
    await settle();
    expect(el.selected).toBe("old");
    key(l, "ArrowUp");
    await settle();
    expect(el.selected).toBe("notes");
    key(l, "Escape");
    await settle();
    expect(el.selected).toBeNull();
    expect(el.querySelector(".ui-ksm__detail")).toBeNull();
    expect(picked).toEqual(["docs", "old", "help", "old", "notes", null]);
  });

  test("the open source: location, state and progress, facts, warnings explained", async () => {
    const el = await mount();
    row(el, "Product docs").click();
    await settle();
    const d = el.querySelector(".ui-ksm__detail")!;
    expect(document.getElementById(d.getAttribute("aria-labelledby")!)!.textContent).toBe("Product docs");
    const bar = d.querySelector(".ui-ksm__progress")!;
    expect(bar.getAttribute("role")).toBe("progressbar");
    expect(bar.getAttribute("aria-valuenow")).toBe("42");
    expect([...d.querySelectorAll(".ui-ksm__fact dt")].map((n) => n.textContent)).toEqual(["Documents", "Chunks", "Last sync", "Syncs"]);
    expect([...d.querySelectorAll(".ui-ksm__fact dd")].slice(0, 3).map((n) => text(n))).toEqual(["860", "9,420", "1 day ago"]);
    // Indexing: Resync waits
    expect(btn(el, "resync").disabled).toBe(true);
    row(el, "Release notes").click();
    await settle();
    expect(text(el.querySelector('.ui-ksm__warning[data-flag="stale"]'))).toBe("Stale. 12 pages changed since.");
    row(el, "Help centre (old)").click();
    await settle();
    expect(text(el.querySelector('.ui-ksm__warning[data-flag="duplicate"]'))).toBe("Duplicate. It covers the same documents as Help centre, so answers can cite both. Keep one.");
    expect(text(btn(el, "pause"))).toBe("Resume");
    expect(text(el.querySelector(".ui-ksm__detail .ui-ksm__hint"))).toContain("Paused");
    row(el, "Pricing PDFs").click();
    await settle();
    expect(text(el.querySelector(".ui-ksm__error"))).toBe("3 files have no text to index.");
    expect(text(btn(el, "resync"))).toBe("Retry");
    // The close button closes it and focus goes to the list
    btn(el, "close").click();
    await settle();
    expect(el.selected).toBeNull();
    expect(document.activeElement).toBe(list(el));
  });

  test("actions are events: add, resync, pause, review chunks", async () => {
    const el = await mount();
    const seen: unknown[] = [];
    el.addEventListener("tc-add", () => seen.push("add"));
    el.addEventListener("tc-resync", (e) => seen.push(["resync", (e as CustomEvent<KnowledgeSourceEvent>).detail.source.id]));
    el.addEventListener("tc-pause", (e) => seen.push(["pause", (e as CustomEvent<KnowledgePauseEvent>).detail.source.id, (e as CustomEvent<KnowledgePauseEvent>).detail.paused]));
    el.addEventListener("tc-review-chunks", (e) => seen.push(["review", (e as CustomEvent<KnowledgeSourceEvent>).detail.source.id]));
    el.querySelector<HTMLButtonElement>(".ui-ksm__add")!.click();
    row(el, "Help centre").click();
    await settle();
    btn(el, "resync").click();
    btn(el, "pause").click();
    btn(el, "review").click();
    row(el, "Help centre (old)").click();
    await settle();
    btn(el, "pause").click();
    // No chunks yet: nothing to review
    row(el, "Support macros").click();
    await settle();
    expect(btn(el, "review").disabled).toBe(true);
    expect(seen).toEqual(["add", ["resync", "help"], ["pause", "help", true], ["review", "help"], ["pause", "old", false]]);
    // The element changes nothing itself
    expect(el.sources).toBe(SOURCES);
  });

  test("Remove asks in place; Escape or Cancel puts focus back on Remove; confirming removes, picks the next and focuses the list", async () => {
    const el = await mount();
    const seen: KnowledgeSourcesChange[] = [];
    el.addEventListener("tc-sources-change", (e) => seen.push((e as CustomEvent<KnowledgeSourcesChange>).detail));
    row(el, "Pricing PDFs").click();
    await settle();
    const remove = btn(el, "remove");
    expect(remove.getAttribute("aria-label")).toBe("Remove Pricing PDFs");
    remove.click();
    await settle();
    const confirm = el.querySelector(".ui-ksm__confirm")!;
    expect(document.getElementById(confirm.getAttribute("aria-labelledby")!)!.textContent).toBe("Remove Pricing PDFs? Its 240 chunks leave the index and answers stop citing it.");
    expect(document.activeElement).toBe(el.querySelector(".ui-ksm__cancel"));
    key(document.activeElement!, "Escape");
    await settle();
    expect(el.querySelector(".ui-ksm__confirm")).toBeNull();
    expect(document.activeElement).toBe(btn(el, "remove"));
    btn(el, "remove").click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-ksm__confirm-btn")!.click();
    await settle();
    await settle();
    expect(el.sources.map((s) => s.id)).toEqual(["help", "docs", "macros", "notes", "old"]);
    expect(seen.map((c) => [c.change.type, c.change.source.id, c.sources.length])).toEqual([["remove", "pricing", 5]]);
    expect(el.selected).toBe("notes");
    expect(document.activeElement).toBe(list(el));
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Removed Pricing PDFs");
  });

  test("Delete on the list asks to remove the active source; removing the last one focuses Add source", async () => {
    const el = await mount("standard", [SOURCES[0]]);
    const l = list(el);
    l.focus();
    key(l, "ArrowDown");
    await settle();
    key(l, "Delete");
    await settle();
    expect(document.activeElement).toBe(el.querySelector(".ui-ksm__cancel"));
    el.querySelector<HTMLButtonElement>(".ui-ksm__confirm-btn")!.click();
    await settle();
    await settle();
    expect(el.sources).toEqual([]);
    expect(el.selected).toBeNull();
    expect(text(el.querySelector(".ui-ksm__empty"))).toContain("No sources yet");
    expect(el.querySelector(".ui-ksm__list")!.hasAttribute("role")).toBe(false);
    expect(document.activeElement).toBe(el.querySelector(".ui-ksm__add"));
  });

  test("the schedule select changes the source's schedule", async () => {
    const el = await mount();
    const seen: KnowledgeSourcesChange[] = [];
    el.addEventListener("tc-sources-change", (e) => seen.push((e as CustomEvent<KnowledgeSourcesChange>).detail));
    row(el, "Help centre").click();
    await settle();
    const select = el.querySelector<HTMLSelectElement>(".ui-ksm__detail select")!;
    expect(document.getElementById(select.getAttribute("aria-labelledby")!)!.textContent).toBe("Syncs");
    expect(select.value).toBe("daily");
    select.value = "weekly";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.sources[0].schedule).toBe("weekly");
    expect(seen[0].change).toMatchObject({ type: "schedule", source: { id: "help", schedule: "weekly" } });
    expect(text(row(el, "Help centre").querySelector(".ui-ksm__meta"))).toContain("Weekly");
    // No schedule yet: a placeholder option
    row(el, "Support macros").click();
    await settle();
    expect(el.querySelector<HTMLSelectElement>(".ui-ksm__detail select")!.selectedOptions[0].textContent).toBe("Pick a schedule");
  });

  test("controlled: preventDefault() keeps the sources, the selection and the filter", async () => {
    const el = await mount();
    el.addEventListener("tc-sources-change", (e) => e.preventDefault());
    row(el, "Help centre").click();
    await settle();
    btn(el, "remove").click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-ksm__confirm-btn")!.click();
    await settle();
    expect(el.sources).toBe(SOURCES);
    expect(el.querySelector(".ui-ksm__confirm")).toBeNull();
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    el.addEventListener("tc-show-change", (e) => e.preventDefault());
    row(el, "Product docs").click();
    await settle();
    expect(el.selected).toBe("help");
    el.querySelector<HTMLButtonElement>('.ui-ksm__opt[data-show="attention"]')!.click();
    await settle();
    expect(el.show).toBe("all");
  });

  test("Needs attention narrows to failed, stale and duplicate sources; the radios take arrows", async () => {
    const el = await mount();
    const att = el.querySelector<HTMLButtonElement>('.ui-ksm__opt[data-show="attention"]')!;
    expect(text(att)).toBe("Needs attention, 3");
    expect(att.querySelector(".ui-ksm__count")!.hasAttribute("data-alert")).toBe(true);
    const all = el.querySelector<HTMLButtonElement>('.ui-ksm__opt[data-show="all"]')!;
    all.focus();
    key(all, "ArrowRight");
    await settle();
    await settle();
    expect(el.show).toBe("attention");
    expect(rows(el).map((r) => r.querySelector(".ui-ksm__name")!.textContent)).toEqual(["Pricing PDFs", "Release notes", "Help centre (old)"]);
    expect(document.activeElement).toBe(att);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Needs attention: 3 sources");
    el.sources = SOURCES.filter((s) => s.state !== "failed" && !s.stale && !s.duplicateOf);
    await settle();
    expect(text(el.querySelector(".ui-ksm__empty"))).toBe("Nothing needs attention – every source is synced and unique.");
  });

  test("a source that finishes or fails is announced", async () => {
    const el = await mount();
    el.sources = SOURCES.map((s) => (s.id === "docs" ? { ...s, state: "ready" as const } : s.id === "macros" ? { ...s, state: "failed" as const, error: "The token expired." } : s));
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Product docs is ready. Support macros failed: The token expired.");
  });

  test("without now, last syncs show their dates; text shows as it is", async () => {
    const el = await fixture<TcKnowledgeSourceManager>(html`<tc-knowledge-source-manager .sources=${SOURCES}></tc-knowledge-source-manager>`);
    expect(text(rows(el)[0].querySelector(".ui-ksm__meta"))).not.toContain("ago");
    expect(text(rows(el)[3].querySelector(".ui-ksm__meta"))).toBe(". 3 files have no text to index.");
    rows(el)[3].click();
    await settle();
    expect(text(el.querySelectorAll(".ui-ksm__fact dd")[2])).toBe("Yesterday");
  });

  test("windowing: 5,000 sources render only the rows near view; the keyboard reaches the last", async () => {
    const many: KnowledgeSource[] = Array.from({ length: 5000 }, (_, i) => ({ id: `s${i}`, name: `Workspace ${i + 1}`, state: "ready", docs: i }));
    const el = await mount("standard", many);
    expect(rows(el).length).toBeLessThan(120);
    const l = list(el);
    l.focus();
    key(l, "End");
    await settle();
    await settle();
    expect(el.selected).toBe("s4999");
    const active = document.getElementById(l.getAttribute("aria-activedescendant")!)!;
    expect(text(active.querySelector(".ui-ksm__name"))).toBe("Workspace 5000");
    expect(active.getAttribute("aria-posinset")).toBe("5000");
  });

  test("no-add and no-review hide their buttons; labels are properties", async () => {
    const el = await fixture<TcKnowledgeSourceManager>(html`<tc-knowledge-source-manager no-add no-review heading="Sources" .sources=${SOURCES}></tc-knowledge-source-manager>`);
    expect(el.querySelector(".ui-ksm__add")).toBeNull();
    rows(el)[0].click();
    await settle();
    expect(el.querySelector(".ui-ksm__review")).toBeNull();
    expect(text(el.querySelector(".tc-head__title"))).toBe("Sources");
  });

  test("React wrapper: uncontrolled sources survive re-renders; callbacks fire; no onAdd means no Add source", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(KnowledgeSourceManager, {
        title: "Sources",
        defaultSources: SOURCES,
        now: NOW,
        onSourcesChange: (s, c) => void seen.push(["change", s.length, c.type]),
        onSelectedChange: (id) => void seen.push(["select", id]),
        onResync: (s) => void seen.push(["resync", s.id]),
        onPauseChange: (s, p) => void seen.push(["pause", s.id, p]),
        onReviewChunks: (s) => void seen.push(["review", s.id]),
        "data-n": n,
      } as React.ComponentProps<typeof KnowledgeSourceManager>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-knowledge-source-manager")!;
    expect(el.querySelector(".ui-ksm__add")).toBeNull();
    row(el, "Help centre").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.selected).toBe("help");
    btn(el, "resync").click();
    btn(el, "pause").click();
    btn(el, "review").click();
    btn(el, "remove").click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-ksm__confirm-btn")!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(rows(el)).toHaveLength(5);
    expect(seen).toEqual([["select", "help"], ["resync", "help"], ["pause", "help", true], ["review", "help"], ["change", 5, "remove"], ["select", "docs"]]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, with a source open and a removal being confirmed`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-knowledge-source-manager .sources=${SOURCES} now=${NOW} selected="pricing"></tc-knowledge-source-manager>
        <tc-knowledge-source-manager look="clean" .sources=${SOURCES} now=${NOW} selected="old" show="attention"></tc-knowledge-source-manager>
      </div>`);
      const [, b] = wrap.querySelectorAll<TcKnowledgeSourceManager>("tc-knowledge-source-manager");
      b.querySelector<HTMLButtonElement>(".ui-ksm__remove")!.click();
      await settle();
      for (const a of wrap.getAnimations?.({ subtree: true }) ?? []) a.finish();
      await settle();
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
