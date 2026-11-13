/*
 * <tc-cell-inspector> in real browsers: the host and both looks, the value and confidence, the prompt with the row
 * filled in, reasoning, sources (and unsafe links), usage, history, Accept / Edit / Re-run / Mark as wrong with their
 * events and controlled use, Escape and Close, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/cell-inspector";
import type { CellHistoryEntry, CellSource, TcCellInspector } from "../../src/elements/cell-inspector";
import { CellInspector } from "../../src/elements/react/cell-inspector";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const looks = ["standard", "clean"] as const;
const NOW = Date.UTC(2026, 10, 12, 14, 30);
const SOURCES: CellSource[] = [
  { id: "s1", title: "Security and compliance", url: "https://www.northwind.example/security", snippet: "A current SOC 2 Type II report." },
  { id: "s2", title: "Supplier register", snippet: "Annual spend £184,000." },
  { id: "s3", title: "Bad link", url: "javascript:alert(1)" },
];
const HISTORY: CellHistoryEntry[] = [
  { id: "h2", value: "High", at: NOW - 2 * 24 * 3600_000, by: "Analyst model", note: "Before the report was found" },
  { id: "h1", value: "Low", at: NOW - 3 * 3600_000, by: "Priya Shah", kind: "person" },
];
const plain = (s: string | null | undefined) => (s ?? "").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
const text = (el: Element, sel: string) => plain(el.querySelector(sel)?.textContent);
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent;
const cell = (look = "standard", extra: { closable?: boolean; now?: number | null } = {}) =>
  fixture<TcCellInspector>(
    html`<tc-cell-inspector
      look=${look}
      heading="Risk tier"
      description="Northwind Analytics · row 214"
      value="Medium"
      model="Analyst model"
      prompt="Rate {{vendor}} from {{ country }} and {{spend}}."
      reasoning="Work emails only.\nA current report."
      confidence="0.72"
      tokens-in="1180"
      tokens-out="214"
      cost="0.0068"
      ?closable=${extra.closable ?? false}
      .at=${NOW - 42 * 60_000}
      .now=${extra.now === undefined ? NOW : extra.now}
      .variables=${{ vendor: "Northwind Analytics", country: "Ireland" }}
      .sources=${SOURCES}
      .history=${HISTORY}
    ></tc-cell-inspector>`,
  );
const button = (el: Element, which: string) => el.querySelector<HTMLButtonElement>(`.ui-cin__act--${which}`)!;

describe("tc-cell-inspector", () => {
  for (const look of looks) {
    test(`${look}: a region named by the column; the value, confidence, model and when; the status pill`, async () => {
      const el = await cell(look);
      expect(el.dataset.ui).toBe("cin");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("region");
      expect(document.getElementById(el.getAttribute("aria-labelledby")!)!.textContent).toBe("Risk tier");
      expect(text(el, ".tc-head__sub")).toBe("Northwind Analytics · row 214");
      expect(text(el, ".ui-cin__value")).toBe("Medium");
      expect(text(el, ".ui-cin__confidence")).toBe("Medium confidence · 72%");
      expect(el.querySelector(".ui-cin__confidence")!.getAttribute("data-level")).toBe("medium");
      expect(text(el, ".ui-cin__meta")).toBe("Analyst model · 42 min ago");
      expect(text(el, ".ui-cin__pill")).toBe("Not reviewed");
      expect(el.getAttribute("status")).toBe("new");
      expect(el.querySelector(".ui-cin__actions")!.getAttribute("role")).toBe("group");
      expect([...el.querySelectorAll(".ui-cin__act")].map((b) => plain(b.textContent))).toEqual(["Accept", "Edit value", "Re-run this cell", "Mark as wrong"]);
    });
  }

  test("the prompt: the row's values marked, a missing one said", async () => {
    const el = await cell();
    expect(text(el, ".ui-cin__prompt")).toBe("Rate Northwind Analytics from Ireland and {{spend}} (no value in this row).");
    const marks = [...el.querySelectorAll(".ui-cin__var")];
    expect(marks.map((m) => m.getAttribute("title"))).toEqual(["vendor", "country", "spend"]);
    expect(marks[2].hasAttribute("data-missing")).toBe(true);
  });

  test("reasoning is a disclosure, folded at first", async () => {
    const el = await cell();
    const toggle = el.querySelector<HTMLButtonElement>(".ui-cin__disclosure")!;
    const panel = document.getElementById(toggle.getAttribute("aria-controls")!)!;
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(panel.hidden).toBe(true);
    toggle.click();
    await settle();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(panel.hidden).toBe(false);
    expect(panel.textContent).toBe("Work emails only.\nA current report.");
  });

  test("sources: safe links with their site and quote; an unsafe link isn't a link", async () => {
    const el = await cell();
    const items = [...el.querySelectorAll(".ui-cin__source")];
    expect(items).toHaveLength(3);
    const link = items[0].querySelector("a")!;
    expect(link.getAttribute("href")).toBe("https://www.northwind.example/security");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(plain(link.textContent)).toBe("Security and compliance (opens in a new tab)");
    expect(text(items[0], ".ui-cin__host")).toBe("northwind.example");
    expect(text(items[0], "blockquote")).toBe("A current SOC 2 Type II report.");
    expect(items[1].querySelector("a")).toBeNull();
    expect(items[2].querySelector("a")).toBeNull();
    expect(items[2].querySelector(".ui-cin__host")).toBeNull();
    expect(text(el, ".ui-cin__label .ui-cin__count")).toBe("3");
  });

  test("usage and history", async () => {
    const el = await cell();
    expect([...el.querySelectorAll(".ui-cin__usage div")].map((d) => plain(d.textContent))).toEqual(["Tokens in1,180", "Tokens out214", "Cost$0.0068"]);
    expect([...el.querySelectorAll(".ui-cin__entry")].map((e) => plain(e.textContent))).toEqual([
      "High Filled by Analyst model · 2 days ago · Before the report was found",
      "Low Edited by Priya Shah · 3 h ago",
    ]);
    expect(el.querySelectorAll(".ui-cin__entry")[1].getAttribute("data-kind")).toBe("person");
    // Without `now`, dates
    const dated = await cell("standard", { now: null });
    expect(text(dated, ".ui-cin__meta")).toMatch(/^Analyst model · Nov 12, 2026/);
  });

  test("Accept: the action, then the status; said once; prevented, nothing changes", async () => {
    const el = await cell();
    const log: string[] = [];
    el.addEventListener("tc-accept", (e) => log.push(`accept ${(e as CustomEvent).detail.value}`));
    el.addEventListener("tc-status-change", (e) => log.push(`status ${(e as CustomEvent).detail.previous}→${(e as CustomEvent).detail.status}`));
    el.addEventListener("tc-accept", (e) => e.preventDefault(), { once: true });
    button(el, "accept").click();
    await settle();
    expect(el.status).toBe("new");
    button(el, "accept").click();
    await settle();
    expect(log).toEqual(["accept Medium", "accept Medium", "status new→accepted"]);
    expect(el.status).toBe("accepted");
    expect(text(el, ".ui-cin__pill")).toBe("Accepted");
    expect(text(el, ".ui-cin__act--accept")).toBe("Accepted");
    expect(button(el, "accept").getAttribute("aria-disabled")).toBe("true");
    expect(status(el)).toBe("Accepted.");
  });

  test("Edit value: the field opens focused, Enter saves and returns focus; Escape cancels without closing", async () => {
    const el = await cell();
    const closes: number[] = [];
    el.addEventListener("tc-close", () => closes.push(1));
    button(el, "edit").click();
    await settle();
    const box = el.querySelector<HTMLTextAreaElement>(".ui-cin__edit-input")!;
    expect(document.activeElement).toBe(box);
    expect(box.value).toBe("Medium");
    expect(button(el, "edit").getAttribute("aria-expanded")).toBe("true");
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(el.querySelector(".ui-cin__edit-input")).toBeNull();
    expect(document.activeElement).toBe(button(el, "edit"));
    expect(closes).toEqual([]);
    const changes: unknown[] = [];
    el.addEventListener("tc-value-change", (e) => changes.push((e as CustomEvent).detail));
    button(el, "edit").click();
    await settle();
    await userEvent.fill(el.querySelector<HTMLTextAreaElement>(".ui-cin__edit-input")!, "Low");
    await userEvent.keyboard("{Enter}");
    await settle();
    expect(changes).toEqual([{ value: "Low", previous: "Medium" }]);
    expect(el.value).toBe("Low");
    expect(el.status).toBe("edited");
    expect(status(el)).toBe("Value saved.");
    await expect.poll(() => document.activeElement).toBe(button(el, "edit"));
  });

  test("a controlled value stays when its change is prevented", async () => {
    const el = await cell();
    el.addEventListener("tc-value-change", (e) => e.preventDefault());
    button(el, "edit").click();
    await settle();
    el.querySelector<HTMLTextAreaElement>(".ui-cin__edit-input")!.value = "High";
    el.querySelector<HTMLButtonElement>(".ui-cin__primary")!.click();
    await settle();
    expect(el.value).toBe("Medium");
    expect(el.status).toBe("new");
    expect(status(el)).toBe("Value not changed.");
  });

  test("Re-run: running, busy, actions unavailable until the page passes the new value back", async () => {
    const el = await cell();
    const reruns: string[] = [];
    el.addEventListener("tc-rerun", (e) => reruns.push((e as CustomEvent).detail.value));
    button(el, "rerun").click();
    await settle();
    expect(reruns).toEqual(["Medium"]);
    expect(el.status).toBe("running");
    expect(el.querySelector(".ui-cin__value-block")!.getAttribute("aria-busy")).toBe("true");
    expect(text(el, ".ui-cin__value")).toBe("Running again…");
    expect(text(el, ".ui-cin__pill")).toBe("Running");
    for (const b of el.querySelectorAll(".ui-cin__act")) expect(b.getAttribute("aria-disabled")).toBe("true");
    button(el, "accept").click();
    button(el, "rerun").click();
    await settle();
    expect(reruns).toHaveLength(1);
    el.value = "Low";
    el.status = "new";
    await settle();
    expect(text(el, ".ui-cin__value")).toBe("Low");
    expect(button(el, "accept").getAttribute("aria-disabled")).toBe("false");
  });

  test("Mark as wrong: a reason is needed; then the event, the status and focus back", async () => {
    const el = await cell();
    const flags: unknown[] = [];
    el.addEventListener("tc-flag", (e) => flags.push((e as CustomEvent).detail));
    button(el, "flag").click();
    await settle();
    const box = el.querySelector<HTMLTextAreaElement>(".ui-cin__flag-input")!;
    expect(document.activeElement).toBe(box);
    expect(el.querySelector(`label[for="${box.id}"]`)!.textContent).toBe("What's wrong with this value?");
    el.querySelector<HTMLButtonElement>(".ui-cin__form .ui-cin__primary")!.click();
    await settle();
    expect(box.getAttribute("aria-invalid")).toBe("true");
    expect(document.getElementById(box.getAttribute("aria-describedby")!)!.textContent).toBe("Say what's wrong, so the column's prompt can be fixed.");
    expect(flags).toEqual([]);
    await userEvent.fill(box, "It moved to Ireland in 2025");
    el.querySelector<HTMLButtonElement>(".ui-cin__form .ui-cin__primary")!.click();
    await settle();
    expect(flags).toEqual([{ reason: "It moved to Ireland in 2025", value: "Medium" }]);
    expect(el.status).toBe("flagged");
    expect(text(el, ".ui-cin__pill")).toBe("Marked wrong");
    expect(el.querySelector(".ui-cin__flag-input")).toBeNull();
    await expect.poll(() => document.activeElement).toBe(button(el, "flag"));
    expect(status(el)).toBe("Marked as wrong.");
  });

  test("Escape with nothing open, or Close, fires tc-close; renamed status words", async () => {
    const el = await cell("clean", { closable: true });
    let closes = 0;
    el.addEventListener("tc-close", () => closes++);
    button(el, "accept").focus();
    await userEvent.keyboard("{Escape}");
    el.querySelector<HTMLButtonElement>(".ui-cin__close")!.click();
    expect(closes).toBe(2);
    expect(plain(el.querySelector(".ui-cin__close")!.textContent)).toBe("Close");
    el.statusLabels = { new: "To check" };
    await settle();
    expect(text(el, ".ui-cin__pill")).toBe("To check");
  });

  test("the wrapper: an uncontrolled value survives a parent re-render; a controlled status only reports", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const statuses: string[] = [];
    const flags: string[] = [];
    let rerender!: (n: number) => void;
    function App() {
      const [n, setN] = React.useState(0);
      rerender = setN;
      return React.createElement(CellInspector, {
        title: `Tier ${n}`,
        defaultValue: "Medium",
        status: "new",
        onStatusChange: (s) => statuses.push(s),
        onFlag: (reason) => {
          flags.push(reason);
          return false;
        },
      });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-cell-inspector")!;
    button(el, "edit").click();
    await settle();
    el.querySelector<HTMLTextAreaElement>(".ui-cin__edit-input")!.value = "High";
    el.querySelector<HTMLButtonElement>(".ui-cin__primary")!.click();
    await act(async () => settle());
    await act(async () => rerender(1));
    await settle();
    expect(el.querySelector("h3")!.textContent).toBe("Tier 1");
    expect(el.value).toBe("High");
    expect(statuses).toEqual(["edited"]);
    expect(el.status).toBe("new");
    button(el, "flag").click();
    await settle();
    el.querySelector<HTMLTextAreaElement>(".ui-cin__flag-input")!.value = "Wrong country";
    el.querySelector<HTMLButtonElement>(".ui-cin__form .ui-cin__primary")!.click();
    await act(async () => settle());
    expect(flags).toEqual(["Wrong country"]);
    expect(statuses).toEqual(["edited"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${theme === "dark" ? "background: #0e0e10" : ""}>
        <tc-cell-inspector heading="Risk tier" value="Medium" confidence="0.72" model="Analyst model" prompt="Rate {{vendor}} and {{missing}}" .variables=${{ vendor: "Northwind" }} .sources=${SOURCES} .history=${HISTORY} reasoning="Why." tokens-in="10" cost="0.01"></tc-cell-inspector>
        <tc-cell-inspector look="clean" closable heading="Category" value="Software" status="accepted" confidence="0.95" .sources=${SOURCES}></tc-cell-inspector>
        <tc-cell-inspector look="clean" heading="Website" value="" status="running" confidence="0.3"></tc-cell-inspector>
        <tc-cell-inspector id="flagging" heading="HQ" value="Dublin" status="flagged" confidence="0.5"></tc-cell-inspector>
      </div>`);
      const flagging = wrap.querySelector<TcCellInspector>("#flagging")!;
      button(flagging, "flag").click();
      await settle();
      flagging.querySelector<HTMLButtonElement>(".ui-cin__form .ui-cin__primary")!.click();
      const first = wrap.querySelector<TcCellInspector>("tc-cell-inspector")!;
      first.querySelector<HTMLButtonElement>(".ui-cin__disclosure")!.click();
      button(first, "edit").click();
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
