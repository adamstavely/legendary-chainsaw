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
import { auditCsv, auditCsvCell, type AuditEvent, type AuditExport, type TcAuditTrail } from "../../src/elements/audit-trail";
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
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}`}><tc-audit-trail .events=${EVENTS}></tc-audit-trail></div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
