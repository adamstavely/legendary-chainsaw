/*
 * <tc-json-viewer> in real browsers: the three views, keys in words, tables and chips, values drawn as what they are,
 * search across views, flags with notes, copy and download, syntax errors, the modal, side by side, the helpers,
 * controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/json-viewer";
import { errorPosition, firstJsonError, jsonPointer, keyWords, valueAt, type JsonFlag, type JsonValue, type JsonViewerCopy, type JsonViewerFlagsChange, type TcJsonViewer } from "../../src/elements/json-viewer";
import { JsonViewer } from "../../src/elements/react/json-viewer";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const DOC: JsonValue = {
  invoice_number: "INV-2207",
  issued_on: "2026-10-12",
  paid: false,
  payment_reference: null,
  website: "https://harbourlane.example",
  supplier: { name: "Harbour Lane", vatId: "NL004495445B01" },
  line_items: [
    { sku: "HL-2208", quantity: 4, amount: 154 },
    { sku: "HL-1190", quantity: 10, amount: 219 },
  ],
  tags: ["office", "Q4"],
  "a/b": 1,
};

const make = (opts: { look?: string; view?: string; flags?: JsonFlag[]; value?: JsonValue; source?: string } = {}) =>
  fixture<TcJsonViewer>(
    html`<tc-json-viewer look=${opts.look ?? "standard"} view=${opts.view ?? "document"} heading="Invoice" .value=${opts.source === undefined ? (opts.value ?? DOC) : undefined} .source=${opts.source} .flags=${opts.flags ?? []}></tc-json-viewer>`,
  );
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const rowOf = (el: Element, path: string) => el.querySelector<HTMLElement>(`.ui-jsv__row[data-path="${path}"]`)!;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const search = async (el: Element, q: string) => {
  const input = el.querySelector<HTMLInputElement>(".ui-jsv__search-input")!;
  input.value = q;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
  return input;
};

describe("tc-json-viewer", () => {
  test("helpers: keys in words, pointers, values at a path, error positions", () => {
    expect(keyWords("invoice_date")).toBe("Invoice date");
    expect(keyWords("invoiceDate")).toBe("Invoice date");
    expect(keyWords("vendor-id")).toBe("Vendor ID");
    expect(keyWords("HTTPStatus")).toBe("HTTP status");
    expect(keyWords("3")).toBe("Item 4");
    expect(jsonPointer("/a", "b/c~d")).toBe("/a/b~1c~0d");
    expect(valueAt(DOC, "/line_items/1/sku")).toBe("HL-1190");
    expect(valueAt(DOC, "/a~1b")).toBe(1);
    expect(valueAt(DOC, "/nope/1")).toBeUndefined();
    expect(errorPosition('{\n  "a": 1,\n}', "Unexpected token } in JSON at position 12")).toEqual({ line: 3, column: 1 });
    expect(errorPosition("", "JSON.parse: expected double-quoted property name at line 3 column 1 of the JSON data")).toEqual({ line: 3, column: 1 });
    // A message that doesn't say where: the scanner finds it
    expect(errorPosition('{\n  "tags": ["a",]\n}', "Unexpected token ']'")).toEqual({ line: 2, column: 16 });
    for (const ok of ['{"a":[1,-2.5e3,true,false,null,"x\\u00e9\\n"]}', " [] ", '"s"', "0"]) expect(firstJsonError(ok)).toBe(-1);
    expect(firstJsonError('{"a":1,}')).toBe(7);
    expect(firstJsonError("{'a':1}")).toBe(1);
    expect(firstJsonError('{"a":01}')).toBe(6);
    expect(firstJsonError('{"a":1} x')).toBe(8);
    expect(firstJsonError('{"a":tru}')).toBe(8);
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the header with its views, the toolbar, and Document by default`, async () => {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("jsv");
      expect(el.dataset.look).toBe(look);
      expect(text(el.querySelector(".tc-head__title"))).toBe("Invoice");
      // The size and the number of values, by default
      expect(text(el.querySelector(".tc-head__sub"))).toMatch(/^\d+ B · 22 values$/);
      const tabs = [...el.querySelectorAll('[role="tab"]')];
      expect(tabs.map(text)).toEqual(["Document", "Raw"]);
      expect(tabs.map((t) => t.getAttribute("aria-selected"))).toEqual(["true", "false"]);
      expect(tabs.filter((t) => t.getAttribute("tabindex") === "0")).toHaveLength(1);
      expect(el.querySelector('[role="tabpanel"]')!.getAttribute("aria-labelledby")).toBe(tabs[0].id);
      expect(el.querySelector(".ui-jsv__doc")).not.toBeNull();
    });
  }

  test("Document: keys in words, values drawn as what they are, sections, a table and chips", async () => {
    const el = await make();
    expect(text(rowOf(el, "/invoice_number").querySelector("dt"))).toBe("Invoice number");
    expect(rowOf(el, "/invoice_number").querySelector("dt")!.getAttribute("title")).toBe("invoice_number");
    expect(rowOf(el, "/issued_on").querySelector("time")!.getAttribute("datetime")).toBe("2026-10-12");
    expect(text(rowOf(el, "/paid").querySelector(".ui-jsv__bool"))).toBe("No (false)");
    expect(text(rowOf(el, "/payment_reference").querySelector(".ui-jsv__null"))).toBe("null");
    const link = rowOf(el, "/website").querySelector("a")!;
    expect(link.getAttribute("href")).toBe("https://harbourlane.example");
    expect(link.rel).toBe("noopener noreferrer");
    // A nested object is a section with a heading under the card's
    const supplier = el.querySelector('.ui-jsv__section[data-path="/supplier"]')!;
    expect(text(supplier.querySelector("h4"))).toBe("Supplier 2 fields");
    expect(text(supplier.querySelector('[data-path="/supplier/vatId"] dt'))).toBe("VAT ID");
    // Like objects make a table, with right-aligned numbers
    const table = el.querySelector('.ui-jsv__section[data-path="/line_items"] table')!;
    expect([...table.querySelectorAll("thead th")].map(text)).toEqual(["SKU", "Quantity", "Amount", "Flag"]);
    expect([...table.querySelectorAll("tbody tr")].map((r) => text(r.querySelector("td")))).toEqual(["HL-2208", "HL-1190"]);
    expect(table.querySelector('td[data-path="/line_items/0/amount"]')!.hasAttribute("data-num")).toBe(true);
    // Short plain values are chips
    expect([...el.querySelectorAll('.ui-jsv__section[data-path="/tags"] .ui-jsv__chip')].map(text)).toEqual(["office", "Q4"]);
    el.keyStyle = "raw";
    await settle();
    expect(text(rowOf(el, "/invoice_number").querySelector("dt"))).toBe("invoice_number");
  });

  test("Document: long lists show 50 entries, then Show all", async () => {
    const el = await make({ value: { ids: Array.from({ length: 120 }, (_, i) => `id-${i}`) } });
    expect(el.querySelectorAll(".ui-jsv__chip")).toHaveLength(50);
    const more = el.querySelector<HTMLButtonElement>(".ui-jsv__more")!;
    expect(text(more)).toBe("Show all 120");
    more.click();
    await settle();
    expect(el.querySelectorAll(".ui-jsv__chip")).toHaveLength(120);
  });

  test("views: tc-view-change switches them; prevented, the view stays; ← → move between the tabs", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-view-change", (e) => seen.push((e as CustomEvent).detail.view));
    el.querySelector<HTMLButtonElement>('[role="tab"]:nth-child(2)')!.click();
    await settle();
    expect(el.view).toBe("raw");
    expect(el.querySelector(".ui-jsv__raw")).not.toBeNull();
    key(el.querySelector('[role="tab"][aria-selected="true"]')!, "ArrowLeft");
    await settle();
    expect(el.view).toBe("document");
    expect(document.activeElement).toBe(el.querySelector('[role="tab"][aria-selected="true"]'));
    el.addEventListener("tc-view-change", (e) => e.preventDefault(), { once: true });
    el.querySelector<HTMLButtonElement>('[role="tab"]:nth-child(2)')!.click();
    await settle();
    expect(el.view).toBe("document");
    expect(seen).toEqual(["raw", "document", "raw"]);
  });

  test("Raw: pretty-printed with a line per value and syntax spans", async () => {
    const el = await make({ view: "raw", value: { a: 1, b: ["x", true, null] } });
    const lines = [...el.querySelectorAll(".ui-jsv__raw .ui-jsv__line")].map((l) => l.textContent);
    expect(lines).toEqual(["{", '  "a": 1,', '  "b": [', '    "x",', "    true,", "    null", "  ]", "}"]);
    expect(el.querySelector(".ui-jsv__s-num")!.textContent).toBe("1");
    expect(el.querySelector(".ui-jsv__s-str")!.textContent).toBe('"x"');
  });

  test("search: marks and counts matches in both views, Enter steps through, Escape clears", async () => {
    const el = await make();
    const input = await search(el, "hl-");
    expect(text(el.querySelector(".ui-jsv__matches"))).toBe("2 matches");
    expect([...el.querySelectorAll(".ui-jsv__mark")].map((m) => m.textContent)).toEqual(["HL-", "HL-"]);
    key(input, "Enter");
    await settle();
    expect(text(el.querySelector(".ui-jsv__matches"))).toBe("1 of 2 matches");
    // Keys match in words as well as written
    await search(el, "vat id");
    expect(text(el.querySelector(".ui-jsv__matches"))).toBe("1 match");
    el.view = "raw";
    await settle();
    await search(el, "HL-1190");
    expect([...el.querySelectorAll(".ui-jsv__raw .ui-jsv__mark")].map((m) => m.textContent)).toEqual(["HL-1190"]);
    key(input, "Escape");
    await settle();
    expect(el.filter).toBe("");
    await search(el, "zzz");
    expect(text(el.querySelector(".ui-jsv__matches"))).toBe("No matches");
  });

  test("flags: add with a note, edit, remove – each a cancelable tc-flags-change with the next list", async () => {
    const el = await make();
    const changes: JsonViewerFlagsChange[] = [];
    el.addEventListener("tc-flags-change", (e) => changes.push((e as CustomEvent<JsonViewerFlagsChange>).detail));
    const btn = rowOf(el, "/invoice_number").querySelector<HTMLButtonElement>(".ui-jsv__flag-btn")!;
    expect(text(btn)).toBe("Flag Invoice number");
    btn.click();
    await settle();
    const note = el.querySelector<HTMLTextAreaElement>(".ui-jsv__note-input")!;
    expect(document.activeElement).toBe(note);
    note.value = "Doesn't match the PDF";
    note.dispatchEvent(new Event("input", { bubbles: true }));
    key(note, "Enter", { metaKey: true, ctrlKey: true });
    await settle();
    expect(el.flags).toEqual([{ path: "/invoice_number", note: "Doesn't match the PDF" }]);
    expect(rowOf(el, "/invoice_number").hasAttribute("data-flagged")).toBe(true);
    expect(text(rowOf(el, "/invoice_number").querySelector(".ui-jsv__note"))).toBe("Doesn't match the PDF");
    expect(text(el.querySelector(".ui-jsv__flags"))).toBe("1 field flagged Invoice number");
    expect(document.activeElement).toBe(rowOf(el, "/invoice_number").querySelector(".ui-jsv__flag-btn"));
    // Remove
    rowOf(el, "/invoice_number").querySelector<HTMLButtonElement>(".ui-jsv__flag-btn")!.click();
    await settle();
    [...el.querySelectorAll<HTMLButtonElement>(".ui-jsv__text-btn")].find((b) => text(b) === "Remove flag")!.click();
    await settle();
    expect(el.flags).toEqual([]);
    expect(changes.map((c) => c.note)).toEqual(["Doesn't match the PDF", null]);
    // Prevented: the flags stay, the note box closes
    el.addEventListener("tc-flags-change", (e) => e.preventDefault(), { once: true });
    rowOf(el, "/paid").querySelector<HTMLButtonElement>(".ui-jsv__flag-btn")!.click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-jsv__btn[data-primary]")!.click();
    await settle();
    expect(el.flags).toEqual([]);
    expect(el.querySelector(".ui-jsv__note-input")).toBeNull();
    // Escape cancels a note
    rowOf(el, "/paid").querySelector<HTMLButtonElement>(".ui-jsv__flag-btn")!.click();
    await settle();
    key(el.querySelector(".ui-jsv__note-input")!, "Escape");
    await settle();
    expect(el.querySelector(".ui-jsv__note-input")).toBeNull();
  });

  test("flags show in Document and Raw: table rows and raw lines; a flag chip goes to its field; flaggable=false hides the buttons", async () => {
    const el = await make({ flags: [{ path: "/line_items/1", note: "Price changed" }, { path: "/gone", note: "Not in this document" }] });
    expect(el.querySelector('tr[data-path="/line_items/1"]')!.hasAttribute("data-flagged")).toBe(true);
    // A flag for a path the document doesn't have isn't listed
    expect(text(el.querySelector(".ui-jsv__flags"))).toBe("1 field flagged Item 2");
    el.view = "raw";
    await settle();
    expect(el.querySelector('.ui-jsv__line[data-path="/line_items/1"]')!.hasAttribute("data-flagged")).toBe(true);
    // From Raw, a flag chip goes back to Document and its field
    el.querySelector<HTMLButtonElement>(".ui-jsv__flag-chip")!.click();
    await settle();
    expect(el.view).toBe("document");
    el.flaggable = false;
    el.view = "document";
    await settle();
    expect(el.querySelector(".ui-jsv__flag-btn")).toBeNull();
    expect(el.querySelector(".ui-jsv__flags")).toBeNull();
  });

  test("copy: Copy JSON fires a cancelable tc-copy; download a cancelable tc-download", async () => {
    const el = await make();
    const copies: JsonViewerCopy[] = [];
    el.addEventListener("tc-copy", (e) => {
      copies.push((e as CustomEvent<JsonViewerCopy>).detail);
      e.preventDefault();
    });
    const tool = (label: string) => [...el.querySelectorAll<HTMLButtonElement>(".ui-jsv__btn")].find((b) => text(b) === label)!;
    tool("Copy JSON").click();
    await settle();
    expect(copies).toHaveLength(1);
    expect(JSON.parse(copies[0].text)).toEqual(DOC);
    let saved: { filename: string; text: string } | null = null;
    el.filename = "inv.json";
    await settle();
    el.addEventListener("tc-download", (e) => {
      saved = (e as CustomEvent).detail;
      e.preventDefault();
    });
    tool("Download").click();
    expect(saved!.filename).toBe("inv.json");
    expect(JSON.parse(saved!.text)).toEqual(DOC);
  });

  test("source: parsed when valid; a syntax error says where, with the lines around it", async () => {
    const ok = await make({ source: '{ "a": [1, 2] }' });
    expect(ok.document).toEqual({ a: [1, 2] });
    const bad = await make({ source: '{\n  "a": 1,\n  "b": [1, 2,]\n}' });
    const err = bad.querySelector('[role="alert"]')!;
    expect(text(err.querySelector(".ui-jsv__error-title"))).toBe("This isn't valid JSON – line 3, column 14");
    expect(err.querySelector(".ui-jsv__line[data-bad]")!.getAttribute("data-n")).toBe("3");
    expect(bad.querySelector('[role="tab"]')).toBeNull();
    expect(bad.querySelectorAll(".ui-jsv__snippet .ui-jsv__line").length).toBeGreaterThan(1);
    const empty = await make({ source: "  " });
    expect(text(empty.querySelector(".ui-jsv__none"))).toBe("No document to show.");
  });

  test("split: Document beside the raw JSON, no tabs; the toolbar switches the layout", async () => {
    const el = await make();
    const layouts: string[] = [];
    el.addEventListener("tc-layout-change", (e) => layouts.push((e as CustomEvent).detail.layout));
    const toggle = [...el.querySelectorAll<HTMLButtonElement>(".ui-jsv__btn")].find((b) => b.title === "Side by side")!;
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    toggle.click();
    await settle();
    expect(el.layout).toBe("split");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    // Both views are showing, so there are no tabs
    expect(el.querySelector('[role="tablist"]')).toBeNull();
    const left = el.querySelector<HTMLElement>(".ui-jsv__pane[data-left]")!;
    const raw = el.querySelector<HTMLElement>(".ui-jsv__pane[data-raw]")!;
    expect(left.getAttribute("aria-label")).toBe("Invoice, document");
    expect(left.querySelector(".ui-jsv__doc")).not.toBeNull();
    expect(raw.getAttribute("aria-label")).toBe("Raw JSON");
    expect(raw.querySelector(".ui-jsv__raw")).not.toBeNull();
    // Raw chosen before going side by side: Document is still on the left
    el.view = "raw";
    await settle();
    expect(el.querySelector(".ui-jsv__pane[data-left] .ui-jsv__doc")).not.toBeNull();
    // Prevented, the layout stays
    el.addEventListener("tc-layout-change", (e) => e.preventDefault(), { once: true });
    toggle.click();
    await settle();
    expect(el.layout).toBe("split");
    toggle.click();
    await settle();
    expect(el.layout).toBe("tabs");
    expect(el.querySelector(".ui-jsv__split")).toBeNull();
    expect([...el.querySelectorAll('[role="tab"]')].map(text)).toEqual(["Document", "Raw"]);
    expect(layouts).toEqual(["split", "tabs", "tabs"]);
    el.layoutToggle = false;
    await settle();
    expect([...el.querySelectorAll<HTMLButtonElement>(".ui-jsv__btn")].some((b) => b.title === "Side by side")).toBe(false);
  });

  test("split: pointing at a field marks its raw lines; a section marks all of its own; clicking a raw line finds its field", async () => {
    const el = await fixture<TcJsonViewer>(html`<tc-json-viewer layout="split" heading="Invoice" .value=${DOC}></tc-json-viewer>`);
    const raw = () => el.querySelector<HTMLElement>(".ui-jsv__pane[data-raw]")!;
    const linked = () => [...raw().querySelectorAll<HTMLElement>(".ui-jsv__line[data-linked]")].map((l) => l.textContent!.trim());
    rowOf(el, "/invoice_number").dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
    expect(linked()).toEqual(['"invoice_number": "INV-2207",']);
    // A section: its opening line, everything inside and its closing line
    el.querySelector('.ui-jsv__section[data-path="/supplier"] .ui-jsv__heading')!.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
    expect(linked()).toEqual(['"supplier": {', '"name": "Harbour Lane",', '"vatId": "NL004495445B01"', "},"]);
    // Focus works the same
    rowOf(el, "/paid").querySelector<HTMLButtonElement>(".ui-jsv__flag-btn")!.focus();
    expect(linked()).toEqual(['"paid": false,']);
    // A re-render keeps the marks
    el.filter = "Harbour";
    await settle();
    expect(linked()).toEqual(['"paid": false,']);
    el.querySelector(".ui-jsv__pane[data-left]")!.dispatchEvent(new PointerEvent("pointerleave"));
    expect(linked()).toEqual([]);
    // Clicking a raw line finds its field on the left and marks it
    raw().querySelector<HTMLElement>('.ui-jsv__line[data-path="/line_items/1/sku"]')!.click();
    await settle();
    expect(el.querySelector('td[data-path="/line_items/1/sku"][data-found]')).not.toBeNull();
    expect(linked()).toEqual(['"sku": "HL-1190",']);
  });

  test("modal: open shows a native modal; Close and Escape ask to close; prevented, it stays", async () => {
    const opener = document.createElement("button");
    document.body.append(opener);
    opener.focus();
    const el = await fixture<TcJsonViewer>(html`<tc-json-viewer modal heading="Response" .value=${DOC}></tc-json-viewer>`);
    const dialog = el.querySelector("dialog")!;
    expect(dialog.open).toBe(false);
    el.open = true;
    await settle();
    expect(dialog.open).toBe(true);
    expect(dialog.getAttribute("aria-labelledby")).toBe(el.querySelector("h2")!.id);
    expect(document.activeElement).toBe(el.querySelector(".ui-jsv__close"));
    const asks: boolean[] = [];
    el.addEventListener("tc-open-change", (e) => asks.push((e as CustomEvent).detail.open));
    el.addEventListener("tc-open-change", (e) => e.preventDefault(), { once: true });
    el.querySelector<HTMLButtonElement>(".ui-jsv__close")!.click();
    await settle();
    expect(el.open).toBe(true);
    dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
    await settle();
    expect(el.open).toBe(false);
    await expect.poll(() => dialog.open).toBe(false);
    expect(asks).toEqual([false, false]);
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });

  test("React wrapper: uncontrolled flags survive re-renders; controlled view stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const flagLists: JsonFlag[][] = [];
    const views: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(JsonViewer, {
        title: "Payload",
        value: DOC,
        view: "document",
        onViewChange: (v) => void views.push(v),
        onFlagsChange: (next) => void flagLists.push(next),
        "data-n": n,
      } as React.ComponentProps<typeof JsonViewer>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-json-viewer")!;
    expect(text(el.querySelector(".tc-head__title"))).toBe("Payload");
    rowOf(el, "/paid").querySelector<HTMLButtonElement>(".ui-jsv__flag-btn")!.click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-jsv__btn[data-primary]")!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(rowOf(el, "/paid").hasAttribute("data-flagged")).toBe(true);
    expect(flagLists).toEqual([[{ path: "/paid", note: "" }]]);
    el.querySelector<HTMLButtonElement>('[role="tab"]:nth-child(2)')!.click();
    await settle();
    expect(views).toEqual(["raw"]);
    expect(el.view).toBe("document");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, in each view`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-json-viewer heading="Invoice" .value=${DOC} .flags=${[{ path: "/supplier", note: "Check the VAT ID" }]}></tc-json-viewer>
        <tc-json-viewer look="clean" view="raw" heading="Invoice raw, searched" .value=${DOC} filter="HL"></tc-json-viewer>
        <tc-json-viewer view="raw" heading="Invoice raw" .value=${DOC}></tc-json-viewer>
        <tc-json-viewer look="clean" heading="Broken" source='{"a": }'></tc-json-viewer>
        <tc-json-viewer layout="split" heading="Invoice side by side" .value=${DOC}></tc-json-viewer>
        <tc-json-viewer look="clean" layout="split" heading="Clean side by side" .value=${DOC} filter="HL"></tc-json-viewer>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
