/*
 * <tc-evidence-list> in real browsers: the exhibits with type, source tag, status and holder; the header's count and
 * sync; opening a chain of custody with integrity and copyable hashes; the keyboard; controlled use; the React wrapper
 * and axe in both looks and themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/evidence-list";
import type { EvidenceCopy, EvidenceSelectedChange, Exhibit, TcEvidenceList } from "../../src/elements/evidence-list";
import { EvidenceList } from "../../src/elements/react/evidence-list";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const T = new Date(2026, 4, 3, 9).getTime();
const H = 3_600_000;
const EXHIBITS: Exhibit[] = [
  {
    id: "a",
    ref: "E-101",
    title: "Signed agreement",
    type: "document",
    source: { label: "Client", grade: "a1" },
    date: T,
    status: "sealed",
    holder: "Room B",
    custody: [
      { at: T, actor: "M. Tan", action: "Collected", location: "Leeds", hash: "sha256:aaa" },
      { at: T + H, actor: "M. Tan", action: "Sealed", hash: "sha256:aaa" },
    ],
  },
  {
    id: "b",
    ref: "E-114",
    title: "Laptop image",
    type: "forensic",
    source: { label: "Lab", grade: "D4" },
    status: "analysis",
    custody: [
      { at: T, actor: "Forensics", action: "Collected", hash: "sha256:aaa" },
      { at: T + H, actor: "K. Osei", action: "Re-checked", hash: "sha256:bbb" },
    ],
  },
  { id: "c", ref: "E-120", title: "Site photos", type: "photo", status: "on-hold" },
];

const row = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`.ui-evl__row[data-id="${id}"]`)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcEvidenceList>(html`<tc-evidence-list look=${look} note="Kept in the evidence system." .synced=${T + 24 * H} .exhibits=${EXHIBITS}></tc-evidence-list>`);

describe("tc-evidence-list", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: each exhibit's reference, title, type, source tag, status and holder; the header's count and sync`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("evl");
      expect(el.dataset.look).toBe(look);
      expect([...el.querySelectorAll(".ui-evl__ref")].map((r) => r.textContent)).toEqual(["E-101", "E-114", "E-120"]);
      expect(row(el, "a").querySelector(".ui-evl__tag")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Client · A1");
      expect([...el.querySelectorAll<HTMLElement>(".ui-evl__tag")].map((t) => t.dataset.band)).toEqual(["high", "low"]);
      expect([...el.querySelectorAll(".ui-evl__status")].map((s) => s.textContent!.trim())).toEqual(["Sealed", "In analysis", "On-hold"]);
      expect(row(el, "a").querySelector(".ui-evl__sr")!.textContent).toBe(`, Signed agreement, Document, source Client, grade A1, high confidence, ${new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", year: "numeric" }).format(T)}, Sealed, Room B`);
      expect(el.querySelector(".ui-evl__count")!.textContent!.replace(/\s+/g, " ").trim()).toBe(`3 linked · synced ${new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(T + 24 * H)}`);
      expect(el.querySelector(".ui-evl__note")!.textContent).toBe("Kept in the evidence system.");
      expect(el.querySelectorAll('.ui-evl__list [tabindex="0"]')).toHaveLength(1);
    });
  }

  test("page statuses merge over the defaults; an empty list says so", async () => {
    const el = await make();
    el.statuses = { "on-hold": { label: "Legal hold", tone: "warning", mark: "lock" } };
    await settle();
    const s = row(el, "c").querySelector<HTMLElement>(".ui-evl__status")!;
    expect([s.textContent!.trim(), s.dataset.tone]).toEqual(["Legal hold", "warning"]);
    el.exhibits = [];
    await settle();
    expect(el.querySelector(".ui-evl__empty")).toBeTruthy();
  });

  test("an exhibit opens onto its chain of custody, in order, with the integrity of its hashes", async () => {
    const el = await make();
    const seen: (string | null)[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<EvidenceSelectedChange>).detail.selected));
    row(el, "a").click();
    await settle();
    expect(row(el, "a").getAttribute("aria-expanded")).toBe("true");
    const trail = document.getElementById(row(el, "a").getAttribute("aria-controls")!)!;
    expect(trail.getAttribute("aria-label")).toBe("Chain of custody for E-101");
    expect([...trail.querySelectorAll(".ui-evl__step-action")].map((a) => a.textContent)).toEqual(["Collected", "Sealed"]);
    expect(trail.querySelector(".ui-evl__integrity")!.getAttribute("data-state")).toBe("verified");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("E-101: chain of custody shown");
    row(el, "b").click();
    await settle();
    expect(el.querySelector(".ui-evl__integrity")!.getAttribute("data-state")).toBe("mismatch");
    expect(el.querySelector(".ui-evl__integrity")!.textContent).toContain("Hash mismatch");
    row(el, "c").click();
    await settle();
    expect(el.querySelector(".ui-evl__none")).toBeTruthy();
    expect(el.querySelector(".ui-evl__integrity")!.getAttribute("data-state")).toBe("unchecked");
    row(el, "c").click();
    await settle();
    expect(el.selected).toBeNull();
    expect(seen).toEqual(["a", "b", "c", null]);
  });

  test("Copy: tc-copy with the hash; preventDefault() stops the element copying", async () => {
    const el = await make();
    el.selected = "a";
    await settle();
    const got: EvidenceCopy[] = [];
    el.addEventListener("tc-copy", (e) => {
      got.push((e as CustomEvent<EvidenceCopy>).detail);
      e.preventDefault();
    });
    const copy = el.querySelector<HTMLButtonElement>(".ui-evl__copy")!;
    expect(copy.getAttribute("aria-label")).toBe("Copy the hash from step 1");
    copy.click();
    await settle();
    expect(got).toEqual([{ exhibit: "a", hash: "sha256:aaa" }]);
    expect(copy.textContent!.trim()).toBe("Copy");
  });

  test("keyboard: ↑ ↓ Home End move between exhibits; Escape closes and returns focus to the exhibit", async () => {
    const el = await make();
    row(el, "a").focus();
    const at = () => (document.activeElement as HTMLElement).dataset.id;
    for (const [k, want] of [
      ["ArrowDown", "b"],
      ["End", "c"],
      ["Home", "a"],
      ["ArrowUp", "a"],
    ] as const) {
      key(document.activeElement!, k);
      await expect.poll(at).toBe(want);
    }
    row(el, "b").click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-evl__copy")!.focus();
    key(document.activeElement!, "Escape");
    await expect.poll(() => el.selected).toBeNull();
    await expect.poll(at).toBe("b");
  });

  test("controlled: preventDefault() keeps the exhibit open; an open exhibit that goes away closes", async () => {
    const el = await make();
    el.selected = "a";
    await settle();
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    row(el, "b").click();
    await settle();
    expect(el.selected).toBe("a");
    el.exhibits = EXHIBITS.slice(1);
    await settle();
    expect(el.selected).toBeNull();
  });

  test("React wrapper: uncontrolled selection survives re-renders; onCopyHash returning false stops the copy", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const opened: unknown[] = [];
    const copies: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(EvidenceList, {
        title: "Exhibits",
        exhibits: EXHIBITS,
        onSelectedChange: (s, x) => void opened.push([s, x?.ref]),
        onCopyHash: (_e, hash) => {
          copies.push(hash);
          return false;
        },
        "data-n": n,
      } as React.ComponentProps<typeof EvidenceList>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-evidence-list")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Exhibits");
    row(el, "a").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.selected).toBe("a");
    expect(opened).toEqual([["a", "E-101"]]);
    el.querySelector<HTMLButtonElement>(".ui-evl__copy")!.click();
    await settle();
    expect(copies).toEqual(["sha256:aaa"]);
    expect(el.querySelector(".ui-evl__copy")!.textContent!.trim()).toBe("Copy");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-evidence-list description="Matter 24-0187" note="Kept in the evidence system." .exhibits=${EXHIBITS} .selected=${"a"}></tc-evidence-list>
        <tc-evidence-list look="clean" .exhibits=${EXHIBITS} .selected=${"b"}></tc-evidence-list>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
