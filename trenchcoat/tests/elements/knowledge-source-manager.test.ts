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
import { knowledgeUrl, type KnowledgePauseEvent, type KnowledgeSource, type KnowledgeSourceEvent, type KnowledgeSourcesAdd, type KnowledgeSourcesChange, type TcKnowledgeSourceManager } from "../../src/elements/knowledge-source-manager";
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

describe("tc-knowledge-source-manager – Add sources", () => {
  const inline = (look: "standard" | "clean" = "standard", sources = SOURCES) =>
    fixture<TcKnowledgeSourceManager>(html`<tc-knowledge-source-manager look=${look} add-inline .sources=${sources} now=${NOW} accept=".pdf,.md,text/*" max-file-size="1048576"></tc-knowledge-source-manager>`);
  const add = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-ksm__add")!;
  const adder = (el: Element) => el.querySelector<HTMLElement>(".ui-ksm__adder");
  const status = (el: Element) => text(el.querySelector(":scope > [role=status]"));
  const file = (name: string, size = 2048, type = "") => new File([new Uint8Array(size)], name, { type });
  const pick = async (el: TcKnowledgeSourceManager, files: File[]) => {
    const input = el.querySelector<HTMLInputElement>(".ui-ksm__file")!;
    const dt = new DataTransfer();
    for (const f of files) dt.items.add(f);
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
  };
  const pending = (el: Element) => [...el.querySelectorAll(".ui-ksm__pending-row")].map((r) => `${text(r.querySelector(".ui-ksm__pending-name"))} | ${text(r.querySelector(".ui-ksm__pending-info"))}`);
  const typeLinks = async (el: TcKnowledgeSourceManager, value: string) => {
    const field = el.querySelector<HTMLTextAreaElement>(".ui-ksm__links-field")!;
    field.value = value;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
  };

  test("knowledgeUrl: adds a scheme, keeps http(s) only, refuses words", () => {
    expect(knowledgeUrl("help.example.com/guides")).toBe("https://help.example.com/guides");
    expect(knowledgeUrl(" http://intranet.example.org/a, ")).toBe("http://intranet.example.org/a");
    expect(knowledgeUrl("ftp://files.example.com")).toBeNull();
    expect(knowledgeUrl("javascript:alert(1)")).toBeNull();
    expect(knowledgeUrl("ledger")).toBeNull();
  });

  test("off by default: Add source fires tc-add and opens nothing", async () => {
    const el = await mount();
    let added = 0;
    el.addEventListener("tc-add", () => added++);
    expect(add(el).hasAttribute("aria-expanded")).toBe(false);
    add(el).click();
    await settle();
    expect(added).toBe(1);
    expect(adder(el)).toBeNull();
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: Add source opens the panel instead of tc-add, focuses Choose files; Escape closes it and returns`, async () => {
      const el = await inline(look);
      let added = 0;
      el.addEventListener("tc-add", () => added++);
      expect(add(el).getAttribute("aria-expanded")).toBe("false");
      add(el).click();
      await settle();
      expect(added).toBe(0);
      const panel = adder(el)!;
      expect(add(el).getAttribute("aria-expanded")).toBe("true");
      expect(add(el).getAttribute("aria-controls")).toBe(panel.id);
      expect(document.getElementById(panel.getAttribute("aria-labelledby")!)!.textContent).toBe("Add sources");
      const choose = el.querySelector<HTMLButtonElement>(".ui-ksm__choose")!;
      expect(document.activeElement).toBe(choose);
      expect(text(document.getElementById(choose.getAttribute("aria-describedby")!))).toBe("Drop files here (.pdf, .md, text/*, up to 1.0 MB)");
      expect(el.querySelector<HTMLInputElement>(".ui-ksm__file")!.accept).toBe(".pdf,.md,text/*");
      await pick(el, [file("Q3-ledger.pdf")]);
      key(choose, "Escape");
      await settle();
      expect(adder(el)).toBeNull();
      expect(document.activeElement).toBe(add(el));
      // Opening again starts empty
      add(el).click();
      await settle();
      expect(pending(el)).toEqual([]);
    });
  }

  test("files: picked or dropped, typed and sized; the wrong type or too big are turned away with why; repeats dropped", async () => {
    const el = await inline();
    add(el).click();
    await settle();
    await pick(el, [file("Q3-ledger.pdf", 1_300_000 / 2), file("scan.tiff", 100, "image/tiff"), file("huge.pdf", 2 * 1024 * 1024)]);
    expect(pending(el)).toEqual(["Q3-ledger.pdf | PDF · 635 KB"]);
    expect([...el.querySelectorAll(".ui-ksm__away li")].map((li) => text(li))).toEqual(["scan.tiff isn't a type this takes", "huge.pdf is over 1.0 MB"]);
    expect(status(el)).toBe("Added 1 file to the list. scan.tiff isn't a type this takes. huge.pdf is over 1.0 MB");
    const drop = el.querySelector<HTMLElement>(".ui-ksm__drop")!;
    const dt = new DataTransfer();
    dt.items.add(file("notes.md", 300, "text/markdown"));
    dt.items.add(file("Q3-ledger.pdf", 1_300_000 / 2));
    drop.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt }));
    await settle();
    expect(drop.hasAttribute("data-over")).toBe(true);
    drop.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt }));
    await settle();
    expect(drop.hasAttribute("data-over")).toBe(false);
    expect(pending(el)).toEqual(["Q3-ledger.pdf | PDF · 635 KB", "notes.md | MD · 1 KB"]);
  });

  test("links: one or many, checked; repeats and existing sources dropped; what isn't a link stays to fix; crawl depth", async () => {
    const el = await inline();
    add(el).click();
    await settle();
    await typeLinks(el, "audit.example.org/policy https://audit.example.org/policy/ ledger\nhttps://help.example.com");
    el.querySelector<HTMLButtonElement>(".ui-ksm__add-links")!.click();
    await settle();
    expect(pending(el)).toEqual(["audit.example.org/policy | Link · this page"]);
    const field = el.querySelector<HTMLTextAreaElement>(".ui-ksm__links-field")!;
    expect(field.value).toBe("ledger");
    expect(field.getAttribute("aria-invalid")).toBe("true");
    expect(text(document.getElementById(field.getAttribute("aria-describedby")!))).toMatch(/^Not a link: ledger\./);
    expect(status(el)).toBe("Added 1 link to the list. 2 links already there. 1 entry isn't a link");
    // Typing clears the complaint; Ctrl/⌘+Enter adds
    await typeLinks(el, "https://records.example.org/2026");
    expect(field.getAttribute("aria-invalid")).toBe("false");
    key(field, "Enter");
    field.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", ctrlKey: true, metaKey: true, bubbles: true, cancelable: true }));
    await settle();
    expect(pending(el)).toHaveLength(2);
    const section = el.querySelector<HTMLInputElement>('.ui-ksm__depth input[value="section"]')!;
    expect(text(el.querySelector(".ui-ksm__depth legend"))).toBe("Crawl");
    section.click();
    await settle();
    expect(pending(el)[0]).toBe("audit.example.org/policy | Link · this section of the site");
  });

  test("paste text: a disclosure with a title; taking items off moves focus to the next Remove", async () => {
    const el = await inline();
    add(el).click();
    await settle();
    const toggle = el.querySelector<HTMLButtonElement>(".ui-ksm__paste-toggle")!;
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    toggle.click();
    await settle();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    const title = el.querySelector<HTMLInputElement>(`#${toggle.getAttribute("aria-controls")} input`)!;
    expect(document.activeElement).toBe(title);
    title.value = "Interview notes";
    title.dispatchEvent(new Event("input", { bubbles: true }));
    const body = el.querySelector<HTMLTextAreaElement>(".ui-ksm__paste-body textarea")!;
    body.value = "The vendor confirmed the backup schedule.";
    body.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-ksm__add-text")!.click();
    await settle();
    expect(pending(el)).toEqual(["Interview notes | Text · 41 characters"]);
    expect(document.activeElement).toBe(toggle);
    await pick(el, [file("a.md", 10, "text/markdown"), file("b.md", 10, "text/markdown")]);
    const removes = () => [...el.querySelectorAll<HTMLButtonElement>(".ui-ksm__pending-remove")];
    expect(text(removes()[0])).toBe("Remove Interview notes");
    removes()[0].click();
    await settle();
    expect(pending(el).map((p) => p.split(" | ")[0])).toEqual(["a.md", "b.md"]);
    expect(document.activeElement).toBe(removes()[0]);
    expect(status(el)).toBe("Removed Interview notes from the list");
  });

  test("Add fires tc-sources-add, then lists the new sources as queued through tc-sources-change; prevented, nothing is listed", async () => {
    const el = await inline();
    const adds: KnowledgeSourcesAdd[] = [];
    const changes: KnowledgeSourcesChange[] = [];
    el.addEventListener("tc-sources-add", (e) => adds.push((e as CustomEvent<KnowledgeSourcesAdd>).detail));
    el.addEventListener("tc-sources-change", (e) => changes.push((e as CustomEvent<KnowledgeSourcesChange>).detail));
    add(el).click();
    await settle();
    const submit = el.querySelector<HTMLButtonElement>(".ui-ksm__adder-submit")!;
    expect(submit.getAttribute("aria-disabled")).toBe("true");
    submit.click();
    await settle();
    expect(adds).toEqual([]);
    expect(status(el)).toMatch(/^Nothing to add yet/);
    await pick(el, [file("Q3-ledger.pdf")]);
    await typeLinks(el, "audit.example.org/policy");
    el.querySelector<HTMLButtonElement>(".ui-ksm__add-links")!.click();
    await settle();
    expect(text(submit)).toBe("Add 2 sources");
    submit.click();
    await settle();
    expect(adds).toHaveLength(1);
    expect(adds[0].files.map((f) => f.name)).toEqual(["Q3-ledger.pdf"]);
    expect(adds[0].urls).toEqual(["https://audit.example.org/policy"]);
    expect(adds[0].depth).toBe("page");
    expect(adds[0].texts).toEqual([]);
    expect(changes).toHaveLength(1);
    expect(changes[0].change.type).toBe("add");
    expect(changes[0].change.added!.map((s) => [s.name, s.kind, s.state])).toEqual([
      ["Q3-ledger.pdf", "file", "queued"],
      ["audit.example.org/policy", "site", "queued"],
    ]);
    expect(el.sources).toHaveLength(SOURCES.length + 2);
    expect(rows(el).slice(-2).map((r) => text(r.querySelector(".ui-ksm__state")))).toEqual(["Queued", "Queued"]);
    expect(adder(el)).toBeNull();
    expect(document.activeElement).toBe(add(el));
    expect(status(el)).toBe("Adding 2 sources");

    // Prevented: the app lists them itself – the panel closes, nothing is added here
    el.addEventListener("tc-sources-add", (e) => e.preventDefault());
    add(el).click();
    await settle();
    await pick(el, [file("notes.md", 10, "text/markdown")]);
    el.querySelector<HTMLButtonElement>(".ui-ksm__adder-submit")!.click();
    await settle();
    expect(adds).toHaveLength(2);
    expect(changes).toHaveLength(1);
    expect(el.sources).toHaveLength(SOURCES.length + 2);
    expect(adder(el)).toBeNull();
  });

  test("React: onSourcesAdd opens the panel; uncontrolled additions survive a re-render; returning false lists nothing", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const got: KnowledgeSourcesAdd[] = [];
    let answer: boolean | undefined = undefined;
    const render = () =>
      act(async () =>
        root.render(
          React.createElement(KnowledgeSourceManager, {
            defaultSources: SOURCES,
            now: NOW,
            onSourcesAdd: (a: KnowledgeSourcesAdd) => {
              got.push(a);
              return answer;
            },
          }),
        ),
      );
    await render();
    const el = host.querySelector<TcKnowledgeSourceManager>("tc-knowledge-source-manager")!;
    expect(el.addInline).toBe(true);
    add(el).click();
    await settle();
    await pick(el, [file("Q3-ledger.pdf")]);
    el.querySelector<HTMLButtonElement>(".ui-ksm__adder-submit")!.click();
    await settle();
    expect(got).toHaveLength(1);
    await render();
    await settle();
    expect(el.sources.map((s) => s.name)).toContain("Q3-ledger.pdf");
    answer = false;
    add(el).click();
    await settle();
    await pick(el, [file("b.pdf")]);
    el.querySelector<HTMLButtonElement>(".ui-ksm__adder-submit")!.click();
    await settle();
    expect(got).toHaveLength(2);
    expect(el.sources.map((s) => s.name)).not.toContain("b.pdf");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): the Add sources panel with files, links, pasted text, a refusal and a bad link, in both looks`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-knowledge-source-manager add-inline accept=".pdf" .sources=${SOURCES} now=${NOW}></tc-knowledge-source-manager>
        <tc-knowledge-source-manager look="clean" add-inline accept=".pdf" .sources=${SOURCES} now=${NOW}></tc-knowledge-source-manager>
      </div>`);
      for (const el of wrap.querySelectorAll<TcKnowledgeSourceManager>("tc-knowledge-source-manager")) {
        add(el).click();
        await settle();
        await pick(el, [file("Q3-ledger.pdf"), file("scan.tiff", 10, "image/tiff")]);
        await typeLinks(el, "audit.example.org ledger");
        el.querySelector<HTMLButtonElement>(".ui-ksm__add-links")!.click();
        el.querySelector<HTMLButtonElement>(".ui-ksm__paste-toggle")!.click();
        await settle();
      }
      for (const a of wrap.getAnimations?.({ subtree: true }) ?? []) a.finish();
      await settle();
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
