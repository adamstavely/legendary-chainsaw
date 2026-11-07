/*
 * <tc-approval-gates> in real browsers: the strip in words, the stack, deciding (events, promises, controlled use),
 * Ask for changes with a note, the decided list's folds and keys, focus after a decision, React and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/approval-gates";
import type { ApprovalGate, GateDecide, GatesChange, GatesExpandedChange, TcApprovalGates } from "../../src/elements/approval-gates";
import { ApprovalGates } from "../../src/elements/react/approval-gates";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => cleanup());

const NOW = Date.UTC(2026, 10, 6, 14, 10);
const min = (m: number) => NOW - m * 60_000;

const gates = (): ApprovalGate[] => [
  {
    id: "embargo",
    title: "Move the embargo",
    agent: "Writer",
    kind: "File change",
    at: min(1),
    reason: "The report goes public a week early.",
    blocking: true,
    diff: { path: "report.config.ts", lines: [{ kind: "remove", text: "a" }, { kind: "add", text: "b" }] },
    holds: ["Build the site", "Publish"],
    context: { before: ["Draft approved"], touches: ["report.config.ts"] },
    status: "open",
  },
  { id: "migration", title: "Run the migration", agent: "Analyst", kind: "Command", at: min(3), args: { rows: 48210, dry_run: false }, holds: ["Publish", "Regenerate figures"], status: "open" },
  { id: "archive", title: "Archive raw files", agent: "Analyst", reason: "Moves files to cold storage.", args: { source: "raw/2025" }, status: "approved", decidedAt: min(6) },
];

const text = (el: Element | null) => el?.textContent?.replace(/\s+/g, " ").trim() ?? "";
/** A strip item as "Label value" */
const stat = (el: Element) => [...el.querySelectorAll(".ui-apg__stat")].map((s) => `${text(s.querySelector("dt"))} ${text(s.querySelector("dd"))}`);
const btn = (el: Element, cls: string) => el.querySelector<HTMLButtonElement>(`.ui-apg__${cls}`)!;
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));

describe("tc-approval-gates", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: host, header, the strip in words and the stack`, async () => {
      const el = await fixture<TcApprovalGates>(html`<tc-approval-gates look=${look} run="Publish the report" .gates=${gates()} .now=${NOW}></tc-approval-gates>`);
      expect(el.dataset.ui).toBe("apg");
      expect(el.dataset.look).toBe(look);
      expect(text(el.querySelector(".tc-head__title"))).toBe("Approvals");
      expect(text(el.querySelector(".tc-head__sub"))).toBe("Publish the report");
      expect(text(el.querySelector(".ui-apg__pill"))).toBe("Waiting on you");
      const stats = stat(el);
      // Two open gates hold three different steps
      expect(stats).toEqual(["Waiting on you 2", "Decided 1/3", "Run Paused – 3 steps wait on 2 gates"]);
      const gate = el.querySelector<HTMLElement>(".ui-apg__gate")!;
      expect(gate.getAttribute("role")).toBe("group");
      expect(document.getElementById(gate.getAttribute("aria-labelledby")!)!.textContent).toBe("Move the embargo");
      expect(document.getElementById(gate.getAttribute("aria-describedby")!)!.textContent).toBe("The report goes public a week early.");
      expect(text(gate.querySelector(".ui-apg__meta-text"))).toBe("Writer · File change · 1m ago");
      expect(text(gate.querySelector(".ui-apg__blocking"))).toBe("Blocking");
      expect(text(gate.querySelector(".ui-apg__pos"))).toBe("1 of 2");
      expect(text(gate.querySelector(".ui-apg__holds"))).toBe("Holds 2 steps: Build the site, Publish");
      expect(gate.querySelector(".ui-ap__code[data-kind='diff']")!.getAttribute("aria-label")).toBe("Changes: report.config.ts");
      expect(el.querySelectorAll(".ui-apg__peek").length).toBe(1);
      expect(el.querySelectorAll(".ui-apg__gate").length).toBe(1);
      // The decided list: one row, one tab stop
      const rows = el.querySelectorAll<HTMLButtonElement>(".ui-apg__row");
      expect(rows.length).toBe(1);
      expect(text(rows[0])).toBe("Archive raw files, Analyst · Approved · 6m ago");
      expect(rows[0].tabIndex).toBe(0);
    });
  }

  test("Full context folds open and shut", async () => {
    const el = await fixture<TcApprovalGates>(html`<tc-approval-gates .gates=${gates()}></tc-approval-gates>`);
    const fold = btn(el, "fold");
    const panel = document.getElementById(fold.getAttribute("aria-controls")!)!;
    expect(fold.getAttribute("aria-expanded")).toBe("false");
    expect(panel.hidden).toBe(true);
    fold.click();
    await settle();
    expect(fold.getAttribute("aria-expanded")).toBe("true");
    expect(panel.hidden).toBe(false);
    expect([...panel.querySelectorAll(".ui-apg__eyebrow")].map(text)).toEqual(["Before this", "Touches"]);
    expect([...panel.querySelectorAll("li")].map(text)).toEqual(["Draft approved", "report.config.ts"]);
  });

  test("without now, times show the time of day", async () => {
    const el = await fixture<TcApprovalGates>(html`<tc-approval-gates locale="en-GB" .gates=${gates()}></tc-approval-gates>`);
    const expected = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit" }).format(min(1));
    expect(text(el.querySelector(".ui-apg__meta-text"))).toBe(`Writer · File change · ${expected}`);
  });

  test("Approve: tc-decide, then tc-gates-change; the next request rises, focus moves to it, the decision is announced", async () => {
    const el = await fixture<TcApprovalGates>(html`<tc-approval-gates .gates=${gates()} .now=${NOW}></tc-approval-gates>`);
    const seen: [string, unknown][] = [];
    el.addEventListener("tc-decide", (e) => seen.push(["decide", (e as CustomEvent<GateDecide>).detail]));
    el.addEventListener("tc-gates-change", (e) => seen.push(["change", (e as CustomEvent<GatesChange>).detail]));
    btn(el, "approve").focus();
    btn(el, "approve").click();
    await settle();
    expect(seen.map(([n]) => n)).toEqual(["decide", "change"]);
    expect((seen[0][1] as GateDecide).decision).toBe("approved");
    const change = seen[1][1] as GatesChange;
    expect(change.gate).toMatchObject({ id: "embargo", status: "approved", decidedAt: NOW });
    expect(el.gates[0].status).toBe("approved");
    const gate = el.querySelector<HTMLElement>(".ui-apg__gate")!;
    expect(gate.dataset.id).toBe("migration");
    expect(gate.hasAttribute("data-rise")).toBe(true);
    await expect.poll(() => document.activeElement).toBe(gate);
    expect(text(el.querySelector("[role='status']"))).toBe("Approved: Move the embargo. Next: Run the migration.");
    // The decided list: the new decision first, "just now"
    const rows = [...el.querySelectorAll(".ui-apg__row")].map(text);
    expect(rows).toEqual(["Move the embargo, Writer · Approved · just now", "Archive raw files, Analyst · Approved · 6m ago"]);
    expect(el.querySelector(".ui-apg__item")!.hasAttribute("data-land")).toBe(true);
    expect(stat(el)[2]).toBe("Run Paused – 2 steps wait on 1 gate");
  });

  test("the last decision: All decided, focus on its row, nothing waits", async () => {
    const el = await fixture<TcApprovalGates>(html`<tc-approval-gates .gates=${gates().slice(1)}></tc-approval-gates>`);
    btn(el, "reject").focus();
    btn(el, "reject").click();
    await settle();
    expect(el.querySelector(".ui-apg__gate")).toBeNull();
    expect(text(el.querySelector(".ui-apg__clear"))).toBe("Nothing waits on you");
    expect(text(el.querySelector(".ui-apg__pill"))).toBe("All decided");
    expect(stat(el)).toEqual(["Waiting on you 0", "Decided 2/2", "Run Running – all decided"]);
    const row = el.querySelector<HTMLElement>(".ui-apg__row[data-id='migration']")!;
    expect(row.dataset.status).toBe("rejected");
    await expect.poll(() => document.activeElement).toBe(row);
    expect(text(el.querySelector("[role='status']"))).toBe("Rejected: Run the migration. Nothing waits on you.");
  });

  test("preventing tc-decide decides nothing; preventing tc-gates-change keeps the gates (controlled)", async () => {
    let calls = 0;
    const el = await fixture<TcApprovalGates>(html`<tc-approval-gates .gates=${gates()} .onDecide=${() => void calls++}></tc-approval-gates>`);
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener("tc-decide", stop);
    btn(el, "approve").click();
    await settle();
    expect(calls).toBe(0);
    expect(el.gates[0].status).toBe("open");
    el.removeEventListener("tc-decide", stop);
    el.addEventListener("tc-gates-change", stop);
    btn(el, "approve").click();
    await settle();
    expect(calls).toBe(1);
    expect(el.gates[0].status).toBe("open");
    expect(el.querySelector<HTMLElement>(".ui-apg__gate")!.dataset.id).toBe("embargo");
    // The page passes the decision back: now it moves on
    el.gates = el.gates.map((g) => (g.id === "embargo" ? { ...g, status: "approved" } : g));
    await settle();
    expect(el.querySelector<HTMLElement>(".ui-apg__gate")!.dataset.id).toBe("migration");
  });

  test("onDecide: a pending promise shows a spinner and locks the buttons; a rejection keeps the request open with an alert", async () => {
    let fail!: () => void;
    const el = await fixture<TcApprovalGates>(html`<tc-approval-gates .gates=${gates()} .onDecide=${() => new Promise<void>((_, reject) => (fail = () => reject(new Error("no"))))}></tc-approval-gates>`);
    btn(el, "approve").click();
    await settle();
    expect(el.hasAttribute("data-busy")).toBe(true);
    expect(btn(el, "approve").querySelector(".ui-apg__spinner")).not.toBeNull();
    expect(btn(el, "reject").getAttribute("aria-disabled")).toBe("true");
    expect(el.querySelector(".ui-apg__gate")!.getAttribute("aria-busy")).toBe("true");
    fail();
    await expect.poll(() => el.querySelector(".ui-apg__error[role='alert']")?.textContent).toBe("Couldn't send the decision. Try again.");
    expect(el.hasAttribute("data-busy")).toBe(false);
    expect(el.gates[0].status).toBe("open");
  });

  test("Ask for changes: a note, Send needs words, Escape cancels back to the button, the note goes along", async () => {
    const el = await fixture<TcApprovalGates>(html`<tc-approval-gates .gates=${gates()}></tc-approval-gates>`);
    let detail: GatesChange | null = null;
    el.addEventListener("tc-gates-change", (e) => (detail = (e as CustomEvent<GatesChange>).detail));
    btn(el, "changes").click();
    await settle();
    const field = () => el.querySelector<HTMLTextAreaElement>(".ui-apg__note-field");
    await expect.poll(() => document.activeElement).toBe(field());
    expect(el.querySelector(".ui-apg__actions")).toBeNull();
    expect(document.querySelector(`label[for="${field()!.id}"]`)!.textContent).toBe("What should change?");
    // Empty: Send says it can't go yet and does nothing
    expect(btn(el, "send").getAttribute("aria-disabled")).toBe("true");
    btn(el, "send").click();
    await settle();
    expect(detail).toBeNull();
    key(field()!, "Escape");
    await settle();
    expect(field()).toBeNull();
    await expect.poll(() => document.activeElement).toBe(btn(el, "changes"));
    btn(el, "changes").click();
    await settle();
    field()!.value = "Keep the November 20 date for the press";
    field()!.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(btn(el, "send").hasAttribute("aria-disabled")).toBe(false);
    key(field()!, "Enter", { metaKey: true, ctrlKey: true });
    await settle();
    expect(detail!.decision).toBe("changes-requested");
    expect(detail!.gate.note).toBe("Keep the November 20 date for the press");
    const row = el.querySelector<HTMLButtonElement>(".ui-apg__row[data-id='embargo']")!;
    expect(text(row)).toContain("Changes asked");
    row.click();
    await settle();
    expect(text(el.querySelector(".ui-apg__said"))).toBe("What should change?Keep the November 20 date for the press");
  });

  test("decided rows: fold open with tc-expanded-change, cancelable; arrow keys, Home and End move the tab stop", async () => {
    const list = gates().map((g) => ({ ...g, status: "approved" as const, decidedAt: undefined }));
    const el = await fixture<TcApprovalGates>(html`<tc-approval-gates .gates=${list}></tc-approval-gates>`);
    const rows = () => [...el.querySelectorAll<HTMLButtonElement>(".ui-apg__row")];
    expect(rows().map((r) => r.tabIndex)).toEqual([0, -1, -1]);
    const seen: (string | null)[] = [];
    el.addEventListener("tc-expanded-change", (e) => seen.push((e as CustomEvent<GatesExpandedChange>).detail.expanded));
    rows()[0].click();
    await settle();
    expect(seen).toEqual(["embargo"]);
    expect(el.expanded).toBe("embargo");
    expect(rows()[0].getAttribute("aria-expanded")).toBe("true");
    const detail = document.getElementById(rows()[0].getAttribute("aria-controls")!)!;
    expect(detail.hidden).toBe(false);
    expect(detail.querySelector(".ui-ap__code[data-kind='diff']")).not.toBeNull();
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener("tc-expanded-change", stop);
    rows()[0].click();
    await settle();
    expect(el.expanded).toBe("embargo");
    el.removeEventListener("tc-expanded-change", stop);
    rows()[0].focus();
    key(rows()[0], "ArrowDown");
    await expect.poll(() => document.activeElement).toBe(rows()[1]);
    expect(rows().map((r) => r.tabIndex)).toEqual([-1, 0, -1]);
    key(rows()[1], "End");
    await expect.poll(() => document.activeElement).toBe(rows()[2]);
    key(rows()[2], "Home");
    await expect.poll(() => document.activeElement).toBe(rows()[0]);
    key(rows()[0], "ArrowUp");
    await settle();
    expect(document.activeElement).toBe(rows()[0]);
  });

  test("empty, renamed labels, and a narrow width", async () => {
    const el = await fixture<TcApprovalGates>(html`<div style="width: 320px"><tc-approval-gates .gates=${[]} .labels=${{ empty: "Nothing yet" }}></tc-approval-gates></div>`);
    const gatesEl = el.querySelector<TcApprovalGates>("tc-approval-gates")!;
    expect(text(gatesEl.querySelector(".ui-apg__empty"))).toBe("Nothing yet");
    expect(gatesEl.querySelector(".ui-apg__stats")).toBeNull();
    gatesEl.gates = gates();
    gatesEl.labels = { approve: "Let it through", waiting: "Needs you" };
    await settle();
    expect(text(btn(gatesEl, "approve"))).toBe("Let it through");
    expect(text(gatesEl.querySelector(".ui-apg__pill"))).toBe("Needs you");
    // Narrow: the run's words get their own row; nothing overflows
    const run = gatesEl.querySelector<HTMLElement>(".ui-apg__stat--run")!;
    const first = gatesEl.querySelector<HTMLElement>(".ui-apg__stat")!;
    expect(run.getBoundingClientRect().top).toBeGreaterThan(first.getBoundingClientRect().top);
    expect(gatesEl.scrollWidth).toBeLessThanOrEqual(gatesEl.clientWidth + 1);
  });

  test("React: uncontrolled decisions survive a parent re-render; controlled ones wait for the parent", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const changes: string[] = [];
    let bump!: () => void;
    function Uncontrolled() {
      const [, set] = React.useState(0);
      bump = () => set((n) => n + 1);
      return React.createElement(ApprovalGates, { defaultGates: gates(), onGatesChange: (_g, c) => changes.push(`${c.gate.id}:${c.decision}`) });
    }
    await act(async () => root.render(React.createElement(Uncontrolled)));
    await settle(host);
    btn(host, "approve").click();
    await settle(host);
    expect(changes).toEqual(["embargo:approved"]);
    await act(async () => bump());
    await settle(host);
    expect(host.querySelector<HTMLElement>(".ui-apg__gate")!.dataset.id).toBe("migration");

    let setGates!: (g: ApprovalGate[]) => void;
    let last: ApprovalGate[] = [];
    function Controlled() {
      const [g, set] = React.useState(gates());
      setGates = set;
      return React.createElement(ApprovalGates, { title: "Gates", gates: g, onGatesChange: (next) => (last = next) });
    }
    await act(async () => root.render(React.createElement(Controlled)));
    await settle(host);
    expect(text(host.querySelector(".tc-head__title"))).toBe("Gates");
    btn(host, "approve").click();
    await settle(host);
    expect(last[0].status).toBe("approved");
    expect(host.querySelector<HTMLElement>(".ui-apg__gate")!.dataset.id).toBe("embargo");
    await act(async () => setGates(last));
    await settle(host);
    expect(host.querySelector<HTMLElement>(".ui-apg__gate")!.dataset.id).toBe("migration");
    await act(async () => root.unmount());
  });

  test("axe: no violations in either look and theme, with a fold, a note and a decided row open", async () => {
    const wrap = await fixture(html`<div></div>`);
    for (const theme of ["light", "dark"]) {
      const box = document.createElement("div");
      box.dataset.tcTheme = theme;
      box.style.cssText = "padding: 16px; background: var(--tc-surface-base)";
      for (const look of ["standard", "clean"]) {
        const el = document.createElement("tc-approval-gates");
        Object.assign(el, { look, run: "Publish the report", gates: gates(), now: NOW, expanded: "archive" });
        box.append(el);
      }
      wrap.append(box);
    }
    await settle(wrap);
    const all = wrap.querySelectorAll<TcApprovalGates>("tc-approval-gates");
    btn(all[0], "fold").click();
    btn(all[1], "changes").click();
    await settle(wrap);
    await finish(wrap);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
