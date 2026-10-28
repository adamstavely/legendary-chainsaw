/*
 * <tc-document-list> in real browsers: rows, masked numbers and revealing them, statuses and counts, View, the
 * roving keyboard, controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/document-list";
import type { DocumentOpen, DocumentRecord, DocumentRevealedChange, TcDocumentList } from "../../src/elements/document-list";
import { DocumentList } from "../../src/elements/react/document-list";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const DOCS: DocumentRecord[] = [
  { id: "p", type: "Passport", country: "Spain", number: "PAE481207", reference: "DOC-1", expires: Date.UTC(2031, 2, 14, 12), status: "verified" },
  { id: "n", type: "National ID", country: "Spain", number: "48120731K", status: "verified" },
  { id: "r", type: "Residence permit", number: "PT90", expires: Date.UTC(2026, 4, 30, 12), status: "expired" },
  { id: "u", type: "Utility bill", status: "fraudulent", note: "Forged template" },
  { id: "x", type: "Letter", status: "pending" },
];

const rowOf = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-id="${id}"]`)!;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const make = (look: "standard" | "clean" = "standard") => fixture<TcDocumentList>(html`<tc-document-list look=${look} description="Review." .documents=${DOCS}></tc-document-list>`);

describe("tc-document-list", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a row per document with type, country, reference, expiry, status and View`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("dlst");
      expect(el.dataset.look).toBe(look);
      const list = el.querySelector(".ui-dlst__list")!;
      expect(document.getElementById(list.getAttribute("aria-labelledby")!)!.textContent).toBe("Documents");
      expect(list.querySelectorAll(".ui-dlst__row")).toHaveLength(5);
      const p = rowOf(el, "p");
      expect(p.querySelector(".ui-dlst__title")!.textContent).toBe("Passport · Spain");
      expect(p.querySelector(".ui-dlst__ref")!.textContent).toBe("Reference DOC-1");
      expect(p.querySelector(".ui-dlst__expiry")!.textContent).toBe(`Expires ${new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(Date.UTC(2031, 2, 14, 12))}`);
      expect(rowOf(el, "r").querySelector(".ui-dlst__expiry")!.textContent).toMatch(/^Expired /);
      expect(rowOf(el, "u").querySelector(".ui-dlst__note")!.textContent).toBe("Forged template");
      // One tab stop: the first row's View
      expect(list.querySelectorAll('button[tabindex="0"]')).toHaveLength(1);
      expect(p.querySelector(".ui-dlst__view")!.getAttribute("tabindex")).toBe("0");
    });
  }

  test("statuses: default names and tones, a mark in each pill, unknown statuses as neutral; counts in the header", async () => {
    const el = await make();
    const pill = (id: string) => rowOf(el, id).querySelector<HTMLElement>(".ui-dlst__pill")!;
    expect([pill("p"), pill("r"), pill("u"), pill("x")].map((p) => [p.dataset.tone, p.textContent!.trim()])).toEqual([
      ["success", "Verified"],
      ["neutral", "Expired"],
      ["danger", "Fraudulent"],
      ["neutral", "Pending"],
    ]);
    expect(pill("p").querySelector("svg")).toBeTruthy();
    expect([...el.querySelectorAll(".ui-dlst__count")].map((c) => c.textContent!.replace(/\s+/g, " ").trim())).toEqual(["2 Verified", "1 Expired", "1 Fraudulent", "1 Pending"]);
    el.statuses = { pending: { label: "Pending check", tone: "warning" } };
    await settle();
    expect([pill("x").dataset.tone, pill("x").textContent!.trim()]).toEqual(["warning", "Pending check"]);
  });

  test("numbers are masked to their last four until shown; tc-revealed-change fires; short numbers and masked=false aren't masked", async () => {
    const el = await make();
    const num = (id: string) => rowOf(el, id).querySelector<HTMLElement>(".ui-dlst__number")!;
    expect(num("p").textContent).toContain("•••• 1207");
    expect(num("p").textContent).not.toContain("PAE481207");
    expect(num("p").querySelector(".ui-dlst__sr:last-child")!.textContent).toBe("ending 1207, hidden");
    // Four characters or fewer: nothing to mask, no Show number
    expect(num("r").textContent).toContain("PT90");
    expect(rowOf(el, "r").querySelector(".ui-dlst__reveal")).toBeNull();
    const seen: DocumentRevealedChange[] = [];
    el.addEventListener("tc-revealed-change", (e) => seen.push((e as CustomEvent<DocumentRevealedChange>).detail));
    const reveal = rowOf(el, "p").querySelector<HTMLButtonElement>(".ui-dlst__reveal")!;
    expect(reveal.getAttribute("aria-label")).toBe("Show number, Passport, Spain");
    reveal.click();
    await settle();
    expect(num("p").textContent).toContain("PAE481207");
    expect(reveal.getAttribute("aria-pressed")).toBe("true");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Passport number shown");
    reveal.click();
    await settle();
    expect(num("p").textContent).not.toContain("PAE481207");
    expect(seen).toEqual([
      { revealed: ["p"], id: "p", shown: true },
      { revealed: [], id: "p", shown: false },
    ]);
    el.masked = false;
    await settle();
    expect(num("n").textContent).toContain("48120731K");
    expect(el.querySelector(".ui-dlst__reveal")).toBeNull();
  });

  test("controlled: preventDefault() keeps a number masked", async () => {
    const el = await make();
    el.addEventListener("tc-revealed-change", (e) => e.preventDefault());
    rowOf(el, "p").querySelector<HTMLButtonElement>(".ui-dlst__reveal")!.click();
    await settle();
    expect(el.revealed).toEqual([]);
    el.revealed = ["n"];
    await settle();
    expect(rowOf(el, "n").querySelector(".ui-dlst__number")!.textContent).toContain("48120731K");
  });

  test("View fires tc-open with the document", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-open", (e) => seen.push((e as CustomEvent<DocumentOpen>).detail.document.id));
    const view = rowOf(el, "u").querySelector<HTMLButtonElement>(".ui-dlst__view")!;
    expect(view.getAttribute("aria-label")).toBe("View Utility bill");
    view.click();
    expect(seen).toEqual(["u"]);
  });

  test("keyboard: ↑ ↓ between rows keeping the button, ← → within a row, Home/End to the ends", async () => {
    const el = await make();
    const at = () => (document.activeElement as HTMLElement | null)?.dataset.at;
    rowOf(el, "p").querySelector<HTMLButtonElement>(".ui-dlst__view")!.focus();
    const press = async (k: string) => {
      key(document.activeElement!, k);
      await expect.poll(() => el.querySelectorAll('.ui-dlst__list button[tabindex="0"]').length).toBe(1);
      await settle();
    };
    await press("ArrowLeft");
    expect(at()).toBe("0:0");
    await press("ArrowLeft");
    expect(at()).toBe("0:0");
    await press("ArrowDown");
    expect(at()).toBe("1:0");
    // The residence permit has no Show number: the move lands on View
    await press("ArrowDown");
    expect(at()).toBe("2:1");
    await press("ArrowRight");
    expect(at()).toBe("2:1");
    await press("End");
    expect(at()).toBe("4:1");
    await press("Home");
    expect(at()).toBe("0:1");
    await press("ArrowUp");
    expect(at()).toBe("0:1");
    expect(rowOf(el, "p").querySelector(".ui-dlst__view")!.getAttribute("tabindex")).toBe("0");
  });

  test("an empty element renders without errors; the tab stop stays valid when documents change", async () => {
    const el = await fixture<TcDocumentList>(html`<tc-document-list heading="Records"></tc-document-list>`);
    expect(el.querySelector(".ui-dlst__empty")).toBeTruthy();
    expect(el.querySelector(".ui-dlst__counts")).toBeNull();
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Records");
    el.documents = DOCS;
    await settle();
    rowOf(el, "x").querySelector<HTMLButtonElement>(".ui-dlst__view")!.focus();
    await settle();
    el.documents = DOCS.slice(0, 2);
    await settle();
    expect(el.querySelectorAll('.ui-dlst__list button[tabindex="0"]')).toHaveLength(1);
  });

  test("React wrapper: uncontrolled reveals survive re-renders; onOpen and onRevealedChange report", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(DocumentList, {
        title: "Identity documents",
        documents: DOCS,
        onRevealedChange: (ids) => void seen.push(ids),
        onOpen: (d) => void seen.push(d.id),
        "data-n": n,
      } as React.ComponentProps<typeof DocumentList>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-document-list")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Identity documents");
    rowOf(el, "p").querySelector<HTMLButtonElement>(".ui-dlst__reveal")!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.revealed).toEqual(["p"]);
    rowOf(el, "n").querySelector<HTMLButtonElement>(".ui-dlst__view")!.click();
    expect(seen).toEqual([["p"], "n"]);
    await act(async () => root.unmount());
  });

  test("React wrapper: controlled reveals stay until the parent changes them", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: string[][] = [];
    await act(async () => root.render(React.createElement(DocumentList, { documents: DOCS, revealed: [], onRevealedChange: (ids) => void asked.push(ids) })));
    await settle();
    const el = host.querySelector("tc-document-list")!;
    rowOf(el, "p").querySelector<HTMLButtonElement>(".ui-dlst__reveal")!.click();
    await settle();
    expect(asked).toEqual([["p"]]);
    expect(el.revealed).toEqual([]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-document-list description="Review." .documents=${DOCS} .revealed=${["p"]}></tc-document-list>
        <tc-document-list look="clean" .documents=${DOCS}></tc-document-list>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
