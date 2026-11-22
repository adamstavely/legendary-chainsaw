/*
 * <tc-audit-trail> in real browsers: grouping and order, search, the outcome filter, details, safe CSV export, the React
 * wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/audit-trail";
import { auditChanges, auditCsv, auditCsvCell, type AuditEvent, type AuditExport, type TcAuditTrail } from "../../src/elements/audit-trail";
import { AuditTrail } from "../../src/elements/react/audit-trail";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const EVENTS: AuditEvent[] = [
  { id: "old", at: Date.UTC(2026, 9, 30, 11), actor: "Sam", action: "opened", target: "Trial 9" },
  { id: "new", at: Date.UTC(2026, 9, 31, 14), actor: "Noor", action: "shared", target: "Trial 12", detail: "Can view." },
  { id: "den", at: Date.UTC(2026, 9, 31, 13), actor: "Noor", action: "tried to share", target: "Trial 12", outcome: "denied" },
];
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const trail = () => fixture<TcAuditTrail>(html`<tc-audit-trail .events=${EVENTS} locale="en-GB" time-zone="UTC"></tc-audit-trail>`);
const ids = (el: Element) => [...el.querySelectorAll(".ui-aud__line")].map(text);

describe("tc-audit-trail", () => {
  test("groups by day, newest first, with outcomes in words", async () => {
    const el = await trail();
    expect(el.dataset.ui).toBe("aud");
    expect([...el.querySelectorAll(".ui-aud__date")].map(text)).toEqual(["31 October 2026", "30 October 2026"]);
    expect(ids(el)[0]).toContain("Noor shared");
    expect(text(el.querySelector('.ui-aud__outcome[data-outcome="denied"]'))).toBe("Denied");
    expect(text(el.querySelector(".ui-aud__time"))).toBe("14:00");
    expect(text(el.querySelector(".ui-aud__count"))).toBe("3 events");
  });

  test("search covers who, what and on what, and says how many match", async () => {
    const el = await trail();
    const queries: string[] = [];
    el.addEventListener("tc-query-change", (e) => queries.push((e as CustomEvent).detail.query));
    const input = el.querySelector<HTMLInputElement>(".ui-aud__search")!;
    input.value = "trial 9";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(ids(el)).toHaveLength(1);
    expect(queries).toEqual(["trial 9"]);
    expect(text(el.querySelector('[role="status"]'))).toBe("1 event");
    input.value = "nobody";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(text(el.querySelector(".ui-aud__empty"))).toBe("No events match.");
    expect(el.querySelector<HTMLButtonElement>(".ui-aud__export")!.disabled).toBe(true);
  });

  test("the outcome filter narrows it", async () => {
    const el = await trail();
    const select = el.querySelector<HTMLSelectElement>(".ui-aud__filter")!;
    select.value = "denied";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(ids(el)).toHaveLength(1);
    expect(ids(el)[0]).toContain("tried to share");
  });

  test("a row with details opens and shuts, and others have no button", async () => {
    const el = await trail();
    expect(el.querySelectorAll(".ui-aud__more")).toHaveLength(1);
    const more = el.querySelector<HTMLElement>(".ui-aud__more")!;
    const panel = document.getElementById(more.getAttribute("aria-controls")!)!;
    expect(more.getAttribute("aria-expanded")).toBe("false");
    expect(panel.hasAttribute("open")).toBe(false);
    more.click();
    await settle();
    expect(more.getAttribute("aria-expanded")).toBe("true");
    expect(panel.hasAttribute("open")).toBe(true);
    expect(text(panel)).toBe("Can view.");
  });

  test("export gives the events showing as CSV, and can be taken over", async () => {
    const el = await trail();
    const seen: AuditExport[] = [];
    el.addEventListener("tc-export", (e) => {
      e.preventDefault();
      seen.push((e as CustomEvent<AuditExport>).detail);
    });
    const select = el.querySelector<HTMLSelectElement>(".ui-aud__filter")!;
    select.value = "denied";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    el.querySelector<HTMLElement>(".ui-aud__export")!.click();
    expect(seen[0]!.events.map((e) => e.id)).toEqual(["den"]);
    const lines = seen[0]!.csv.split("\r\n");
    expect(lines[0]).toBe("time,actor,action,target,outcome,detail");
    expect(lines[1]).toBe("2026-10-31T13:00:00.000Z,Noor,tried to share,Trial 12,denied,");
  });

  test("CSV keeps formulas from running, and quotes what it must", () => {
    for (const bad of ["=SUM(A1)", "+1", "-1", "@me", "\tx"]) expect(auditCsvCell(bad).replace(/^"/, "").startsWith("'")).toBe(true);
    expect(auditCsvCell('a,"b"')).toBe('"a,""b"""');
    expect(auditCsv([{ id: "x", at: 0, actor: "=cmd", action: "ran" }])).toContain(",'=cmd,ran,");
  });

  test("says so when there's nothing recorded, and Export can be turned off", async () => {
    const el = await fixture<TcAuditTrail>(html`<tc-audit-trail exportable="false"></tc-audit-trail>`);
    expect(text(el.querySelector(".ui-aud__empty"))).toContain("Nothing has been recorded");
    expect(el.querySelector(".ui-aud__export")).toBeNull();
  });
});

describe("changes and filters", () => {
  const NOW = Date.UTC(2026, 10, 20, 12);
  const LOG: AuditEvent[] = [
    {
      id: "edit",
      at: NOW - 2 * 3600_000,
      actor: "Priya Raman",
      action: "updated",
      target: "Case LL-2041",
      changes: [
        { field: "Risk score", before: "40", after: "72" },
        { field: "Owner", after: "Ade Okafor" },
        { field: "Tag", before: "Card testing" },
        { field: "Queue", before: "Fraud", after: "Fraud" },
      ],
    },
    { id: "week", at: NOW - 3 * 86_400_000, actor: "Tomas Lind", action: "closed", target: "Case LL-1990" },
    { id: "month", at: NOW - 20 * 86_400_000, actor: "Priya Raman", action: "closed", target: "Case LL-1702" },
    { id: "old", at: NOW - 60 * 86_400_000, actor: "Noor Haddad", action: "exported", target: "Q3 cases" },
  ];
  const log = () => fixture<TcAuditTrail>(html`<tc-audit-trail .events=${LOG} .now=${NOW} locale="en-GB" time-zone="UTC"></tc-audit-trail>`);
  const pick = (el: Element, cls: string, value: string) => {
    const s = el.querySelector<HTMLSelectElement>(cls)!;
    s.value = value;
    s.dispatchEvent(new Event("change", { bubbles: true }));
  };

  test("a row with changes opens to Field / Before / After; added and removed are said in words; unchanged fields aren't listed", async () => {
    const el = await log();
    expect(auditChanges(LOG[0]!).map((c) => c.field)).toEqual(["Risk score", "Owner", "Tag"]);
    const more = el.querySelector<HTMLElement>(".ui-aud__more")!;
    more.click();
    await settle();
    const table = document.getElementById(more.getAttribute("aria-controls")!)!.querySelector("table")!;
    expect([...table.querySelectorAll("thead th")].map(text)).toEqual(["Field", "Before", "After"]);
    const rows = [...table.querySelectorAll("tbody tr")].map((r) => [...r.children].map(text));
    expect(rows).toEqual([
      ["Risk score", "40", "72"],
      ["Owner added", "–none", "Ade Okafor"],
      ["Tag removed", "Card testing", "–none"],
    ]);
    expect(text(table.querySelector("caption"))).toBe("Changes");
  });

  test("search reaches field names and values", async () => {
    const el = await log();
    const input = el.querySelector<HTMLInputElement>(".ui-aud__search")!;
    input.value = "risk score";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(ids(el)).toEqual(["Priya Raman updated Case LL-2041"]);
    input.value = "ade okafor";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(ids(el)).toHaveLength(1);
  });

  test("Person, Type and Date narrow it, fire their events, and the count says how many of how many", async () => {
    const el = await log();
    const got: string[] = [];
    for (const n of ["actor", "action", "range"]) el.addEventListener(`tc-${n}-change`, (e) => got.push(`${n}=${(e as CustomEvent).detail[n]}`));
    expect(text(el.querySelector(".ui-aud__count"))).toBe("4 events");
    expect([...el.querySelectorAll(".ui-aud__actor option")].map(text)).toEqual(["Anyone", "Noor Haddad", "Priya Raman", "Tomas Lind"]);
    expect([...el.querySelectorAll(".ui-aud__action option")].map(text)).toEqual(["Any action", "closed", "exported", "updated"]);
    pick(el, ".ui-aud__actor", "Priya Raman");
    await settle();
    expect(ids(el)).toHaveLength(2);
    expect(text(el.querySelector(".ui-aud__count"))).toBe("2 of 4 events");
    pick(el, ".ui-aud__action", "closed");
    await settle();
    expect(ids(el)).toEqual(["Priya Raman closed Case LL-1702"]);
    pick(el, ".ui-aud__range", "7d");
    await settle();
    expect(el.querySelector(".ui-aud__empty")).not.toBeNull();
    expect(got).toEqual(["actor=Priya Raman", "action=closed", "range=7d"]);
    // Clear filters puts every filter back
    el.querySelector<HTMLButtonElement>(".ui-aud__clear")!.click();
    await settle();
    expect(el.actor).toBe("");
    expect(el.action).toBe("");
    expect(el.range).toBe("all");
    expect(el.querySelector(".ui-aud__clear")).toBeNull();
    expect(ids(el)).toHaveLength(4);
  });

  test("Today, 7 and 30 days are measured from now", async () => {
    const el = await log();
    for (const [range, n] of [["today", 1], ["7d", 2], ["30d", 3], ["all", 4]] as const) {
      el.range = range;
      await settle();
      expect(ids(el)).toHaveLength(n);
    }
  });

  test("prevented filter events keep the filter", async () => {
    const el = await log();
    for (const n of ["actor", "action", "range", "outcome"]) el.addEventListener(`tc-${n}-change`, (e) => e.preventDefault());
    pick(el, ".ui-aud__actor", "Tomas Lind");
    pick(el, ".ui-aud__range", "today");
    pick(el, ".ui-aud__filter", "denied");
    await settle();
    expect(el.actor).toBe("");
    expect(el.range).toBe("all");
    expect(el.outcome).toBe("all");
    expect(ids(el)).toHaveLength(4);
    expect(el.querySelector<HTMLSelectElement>(".ui-aud__actor")!.value).toBe("");
    expect(el.querySelector<HTMLSelectElement>(".ui-aud__range")!.value).toBe("all");
  });

  test("export takes the filtered events and adds a changes column when any have changes", async () => {
    const el = await log();
    const seen: AuditExport[] = [];
    el.addEventListener("tc-export", (e) => {
      e.preventDefault();
      seen.push((e as CustomEvent<AuditExport>).detail);
    });
    pick(el, ".ui-aud__actor", "Priya Raman");
    await settle();
    el.querySelector<HTMLElement>(".ui-aud__export")!.click();
    expect(seen[0]!.events.map((e) => e.id)).toEqual(["edit", "month"]);
    const lines = seen[0]!.csv.split("\r\n");
    expect(lines[0]).toBe("time,actor,action,target,outcome,detail,changes");
    expect(lines[1]).toBe(`${new Date(LOG[0]!.at).toISOString()},Priya Raman,updated,Case LL-2041,success,,Risk score: 40 → 72; Owner: (none) → Ade Okafor; Tag: Card testing → (none)`);
    expect(lines[2]!.endsWith(",")).toBe(true);
    expect(auditCsv([{ id: "f", at: 0, actor: "a", action: "b", changes: [{ field: "x", after: "=1" }] }]).split("\r\n")[1]).toContain(",x: (none) → =1");
  });

  test("narrow: the filters wrap onto their own row", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 360px"><tc-audit-trail .events=${LOG} .now=${NOW}></tc-audit-trail></div>`);
    const el = wrap.querySelector<TcAuditTrail>("tc-audit-trail")!;
    await settle();
    const search = el.querySelector(".ui-aud__search-wrap")!.getBoundingClientRect();
    const filter = el.querySelector(".ui-aud__actor")!.getBoundingClientRect();
    expect(filter.top).toBeGreaterThanOrEqual(search.bottom - 1);
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
  });
});

describe("React", () => {
  test("the wrapper passes the events and heading through", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    await act(async () => root.render(React.createElement(AuditTrail, { title: "The record", events: EVENTS })));
    await settle();
    const el = host.querySelector<TcAuditTrail>("tc-audit-trail")!;
    expect(el.heading).toBe("The record");
    expect(el.events).toBe(EVENTS);
    await act(async () => root.unmount());
    host.remove();
  });

  test("an uncontrolled filter survives re-renders; a controlled one stays until the parent changes it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    let asked: string | undefined;
    await act(async () => root.render(React.createElement(AuditTrail, { events: EVENTS })));
    await settle();
    const el = host.querySelector<TcAuditTrail>("tc-audit-trail")!;
    const s = el.querySelector<HTMLSelectElement>(".ui-aud__actor")!;
    await act(async () => {
      s.value = "Noor";
      s.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await act(async () => root.render(React.createElement(AuditTrail, { events: EVENTS })));
    await settle();
    expect(el.actor).toBe("Noor");
    await act(async () => root.render(React.createElement(AuditTrail, { events: EVENTS, actor: "", onActorChange: (a: string) => (asked = a) })));
    await settle();
    await act(async () => {
      s.value = "Sam";
      s.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await settle();
    expect(asked).toBe("Sam");
    expect(el.actor).toBe("");
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const withChanges: AuditEvent[] = [...EVENTS, { id: "chg", at: Date.UTC(2026, 9, 31, 15), actor: "Priya", action: "updated", target: "Case 7", changes: [{ field: "Risk", before: "40", after: "72" }, { field: "Owner", after: "Ade" }] }];
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas; color: CanvasText`}><tc-audit-trail .events=${withChanges} actor="Priya"></tc-audit-trail></div>`);
        await settle();
        wrap.querySelector<HTMLElement>(".ui-aud__more")!.click();
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
