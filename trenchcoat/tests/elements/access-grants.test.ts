/*
 * <tc-access-grants> in real browsers: grouping and order, the summary and tabs, expiry in words, the changed notice
 * and Review, Revoke's inline confirmation, Renew, the one tab stop for the buttons, the React wrapper and axe in both
 * looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/access-grants";
import type { AccessGrant, AccessGrantDriftReview, AccessGrantRevoke, TcAccessGrants } from "../../src/elements/access-grants";
import { AccessGrants } from "../../src/elements/react/access-grants";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const NOW = new Date(2026, 10, 12, 10, 0).getTime();
const DAY = 24 * 60 * 60 * 1000;
const GRANTS: AccessGrant[] = [
  { id: "notes", source: "Case files", scope: "Add notes to your cases", level: "write", grantedBy: "Priya Shah", grantedAt: NOW - 60 * DAY, lastUsedAt: NOW - 2 * DAY },
  { id: "cases", source: "Case files", scope: "Read cases in Team North", level: "read", grantedBy: "Priya Shah", grantedAt: NOW - 60 * DAY, changed: { since: NOW - 3 * DAY, what: "Now also reads attachments." } },
  { id: "ledger", source: "Payments ledger", scope: "Read transactions", level: "read", grantedAt: NOW - 80 * DAY, expiresAt: NOW + 3 * DAY + 60000 },
  { id: "mail", source: "Team mailbox", scope: "Send document requests", level: "act", grantedBy: "Marcus Lee", expiresAt: NOW + 40 * DAY },
  { id: "archive", source: "Records archive", scope: "Search closed cases", level: "read", expiresAt: NOW - 4 * DAY },
];

const grants = (list: AccessGrant[] = GRANTS) => fixture<TcAccessGrants>(html`<tc-access-grants heading="Assistant access" .grants=${list} .now=${NOW}></tc-access-grants>`);
const listen = <T>(el: Element, name: string, prevent = false) => {
  const seen: T[] = [];
  el.addEventListener(name, (e) => {
    seen.push((e as CustomEvent<T>).detail);
    if (prevent) e.preventDefault();
  });
  return seen;
};
const scopes = (el: Element) => [...el.querySelectorAll(".ui-acg__scope")].map((s) => s.textContent);
const row = (el: Element, scope: string) => [...el.querySelectorAll<HTMLElement>(".ui-acg__row")].find((r) => r.querySelector(".ui-acg__scope")!.textContent === scope)!;
const btn = (root: Element, label: string) => [...root.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent!.trim() === label);
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, composed: true }));

describe("tc-access-grants", () => {
  test("the host, the header and the card in both looks", async () => {
    const el = await grants();
    expect(el.dataset.ui).toBe("acg");
    expect(el.dataset.look).toBe("standard");
    expect(el.querySelector("h3.tc-head__title")!.textContent).toBe("Assistant access");
    el.look = "clean";
    await settle();
    expect(el.dataset.look).toBe("clean");
  });

  test("grouped by source in order of first appearance; changed first, then soonest to expire", async () => {
    const el = await grants();
    expect([...el.querySelectorAll(".ui-acg__source-name")].map((s) => s.textContent)).toEqual(["Case files", "Payments ledger", "Team mailbox", "Records archive"]);
    expect(scopes(el)).toEqual(["Read cases in Team North", "Add notes to your cases", "Read transactions", "Send document requests", "Search closed cases"]);
    expect(el.querySelector(".ui-acg__source-count")!.textContent).toBe("2");
    // Each source names its list
    const list = el.querySelector(".ui-acg__list")!;
    expect(document.getElementById(list.getAttribute("aria-labelledby")!)!.textContent).toContain("Case files");
    // No icon: the source's first letter
    expect(el.querySelector(".ui-acg__logo")!.textContent).toBe("C");
  });

  test("the summary counts what needs a look; level, who and when, last use and the expiry in words", async () => {
    const el = await grants();
    expect([...el.querySelectorAll(".ui-acg__summary > span:not(.ui-acg__dot)")].map((s) => s.textContent).join(" · ")).toBe("5 grants · 1 changed since you agreed · 1 expire this week · 1 expired");
    const cases = row(el, "Read cases in Team North");
    expect(cases.querySelector(".ui-acg__level")!.textContent!.trim()).toBe("Can read");
    expect(cases.querySelector(".ui-acg__expiry")!.textContent!.trim()).toBe("Until revoked");
    expect(cases.querySelector(".ui-acg__meta")!.textContent).toContain("Granted by Priya Shah");
    expect(cases.querySelector(".ui-acg__meta")!.textContent).toContain("Not used yet");
    expect(cases.querySelector(".ui-acg__drift")!.textContent).toContain("Now also reads attachments.");
    expect(row(el, "Add notes to your cases").querySelector(".ui-acg__meta")!.textContent).toContain("Last used 2 days ago");
    expect(row(el, "Add notes to your cases").querySelector(".ui-acg__level")!.textContent!.trim()).toBe("Can edit");
    expect(row(el, "Send document requests").querySelector(".ui-acg__level")!.textContent!.trim()).toBe("Can act");
    const ledger = row(el, "Read transactions");
    expect(ledger.dataset.expiry).toBe("soon");
    expect(ledger.querySelector(".ui-acg__expiry")!.textContent!.trim()).toBe("Expires in 3 days");
    expect(row(el, "Send document requests").querySelector(".ui-acg__expiry")!.textContent!.trim()).toMatch(/^Expires /);
    expect(row(el, "Send document requests").dataset.expiry).toBe("later");
    const archive = row(el, "Search closed cases");
    expect(archive.dataset.expiry).toBe("expired");
    expect(archive.querySelector(".ui-acg__expiry")!.textContent!.trim()).toMatch(/^Expired /);
    // Renew only where it's running out or gone; Review only where it changed
    expect(btn(ledger, "Renew")).toBeTruthy();
    expect(btn(archive, "Renew")).toBeTruthy();
    expect(btn(row(el, "Send document requests"), "Renew")).toBeUndefined();
    expect(btn(cases, "Review")).toBeTruthy();
    expect(btn(ledger, "Review")).toBeUndefined();
    // Renamed words
    el.labels = { levelRead: "Reads", untilRevoked: "No end date" };
    await settle();
    expect(row(el, "Read cases in Team North").querySelector(".ui-acg__level")!.textContent!.trim()).toBe("Reads");
    expect(row(el, "Read cases in Team North").querySelector(".ui-acg__expiry")!.textContent!.trim()).toBe("No end date");
  });

  test("tabs: All, Changed and Expiring with counts; a cancelable tc-filter-change; arrow keys", async () => {
    const el = await grants();
    const tabs = [...el.querySelectorAll<HTMLButtonElement>(".ui-acg__tab")];
    expect(el.querySelector(".ui-acg__tabs")!.getAttribute("role")).toBe("tablist");
    expect(tabs.map((t) => t.textContent!.replace(/\s+/g, " ").trim())).toEqual(["All 5", "Changed 1", "Expiring 2"]);
    expect(tabs.map((t) => t.tabIndex)).toEqual([0, -1, -1]);
    const seen = listen<{ filter: string }>(el, "tc-filter-change");
    tabs[1].click();
    await settle();
    expect(seen).toEqual([{ filter: "changed" }]);
    expect(scopes(el)).toEqual(["Read cases in Team North"]);
    tabs[1].focus();
    key(tabs[1], "ArrowRight");
    await settle();
    expect(el.filter).toBe("expiring");
    expect(scopes(el)).toEqual(["Read transactions", "Search closed cases"]);
    await expect.poll(() => document.activeElement).toBe(el.querySelector('.ui-acg__tab[data-filter="expiring"]'));
    const panel = el.querySelector(".ui-acg__body")!;
    expect(panel.getAttribute("role")).toBe("tabpanel");
    expect(panel.getAttribute("aria-labelledby")).toBe(el.querySelector('.ui-acg__tab[data-filter="expiring"]')!.id);
    // Prevented: the tab stays
    listen(el, "tc-filter-change", true);
    key(el.querySelector('.ui-acg__tab[data-filter="expiring"]')!, "Home");
    await settle();
    expect(el.filter).toBe("expiring");
    // Empty
    el.grants = [];
    await settle();
    expect(el.querySelector(".ui-acg__empty")!.textContent).toBe("Nothing expires soon.");
  });

  test("Revoke asks inline, then a cancelable tc-revoke removes the grant and says so", async () => {
    const el = await grants();
    const seen = listen<AccessGrantRevoke>(el, "tc-revoke");
    const revoke = btn(row(el, "Read transactions"), "Revoke")!;
    expect(revoke.getAttribute("aria-expanded")).toBe("false");
    revoke.click();
    await settle();
    const panel = el.querySelector<HTMLElement>('.ui-acg__panel[data-kind="revoke"]')!;
    expect(panel.textContent).toContain("Payments ledger loses “Read transactions” at once.");
    expect(revoke.getAttribute("aria-expanded")).toBe("true");
    expect(revoke.getAttribute("aria-controls")).toBe(panel.id);
    await expect.poll(() => document.activeElement).toBe(btn(panel, "Cancel"));
    // Escape closes it, focus back on Revoke
    key(btn(panel, "Cancel")!, "Escape");
    await settle();
    expect(el.querySelector(".ui-acg__panel")).toBeNull();
    await expect.poll(() => document.activeElement).toBe(btn(row(el, "Read transactions"), "Revoke"));
    btn(row(el, "Read transactions"), "Revoke")!.click();
    await settle();
    btn(el.querySelector(".ui-acg__panel")!, "Revoke access")!.click();
    await settle();
    expect(seen.map((d) => d.grant.id)).toEqual(["ledger"]);
    expect(scopes(el)).not.toContain("Read transactions");
    expect(el.grants).toHaveLength(4);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Revoked Read transactions.");
    // Focus doesn't drop to the body
    await expect.poll(() => document.activeElement === document.body).toBe(false);
  });

  test("Revoke, prevented: the grant stays", async () => {
    const el = await grants();
    listen(el, "tc-revoke", true);
    btn(row(el, "Search closed cases"), "Revoke")!.click();
    await settle();
    btn(el.querySelector(".ui-acg__panel")!, "Revoke access")!.click();
    await settle();
    expect(scopes(el)).toContain("Search closed cases");
  });

  test("Review: accept clears the notice, refuse removes the grant; each a cancelable tc-drift-review", async () => {
    const el = await grants();
    const seen = listen<AccessGrantDriftReview>(el, "tc-drift-review");
    btn(row(el, "Read cases in Team North"), "Review")!.click();
    await settle();
    const panel = el.querySelector('.ui-acg__panel[data-kind="review"]')!;
    expect(panel.textContent).toContain("Now also reads attachments.");
    btn(panel, "Accept change")!.click();
    await settle();
    expect(seen.map((d) => [d.grant.id, d.accepted])).toEqual([["cases", true]]);
    expect(row(el, "Read cases in Team North").querySelector(".ui-acg__drift")).toBeNull();
    expect(btn(row(el, "Read cases in Team North"), "Review")).toBeUndefined();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Change accepted for Read cases in Team North.");
    // Refuse on another
    el.grants = GRANTS;
    await settle();
    btn(row(el, "Read cases in Team North"), "Review")!.click();
    await settle();
    btn(el.querySelector(".ui-acg__panel")!, "Revoke")!.click();
    await settle();
    expect(seen.at(-1)!.accepted).toBe(false);
    expect(scopes(el)).not.toContain("Read cases in Team North");
    // Prevented: nothing changes
    el.grants = GRANTS;
    listen(el, "tc-drift-review", true);
    await settle();
    btn(row(el, "Read cases in Team North"), "Review")!.click();
    await settle();
    btn(el.querySelector(".ui-acg__panel")!, "Accept change")!.click();
    await settle();
    expect(row(el, "Read cases in Team North").querySelector(".ui-acg__drift")).not.toBeNull();
  });

  test("Renew fires tc-renew with the grant", async () => {
    const el = await grants();
    const seen = listen<{ grant: AccessGrant }>(el, "tc-renew");
    btn(row(el, "Read transactions"), "Renew")!.click();
    expect(seen.map((d) => d.grant.id)).toEqual(["ledger"]);
  });

  test("one tab stop for the buttons: arrows move between grants and within one; buttons are described by the scope", async () => {
    const el = await grants();
    const stops = [...el.querySelectorAll<HTMLElement>(".ui-acg__actions button")].filter((b) => b.tabIndex === 0);
    expect(stops).toHaveLength(1);
    const first = stops[0];
    expect(first.textContent!.trim()).toBe("Review");
    expect(document.getElementById(first.getAttribute("aria-describedby")!)!.textContent).toBe("Read cases in Team North");
    first.focus();
    key(first, "ArrowRight");
    await expect.poll(() => (document.activeElement as HTMLElement).textContent!.trim()).toBe("Revoke");
    key(document.activeElement!, "ArrowDown");
    await expect.poll(() => (document.activeElement as HTMLElement).closest(".ui-acg__row")!.querySelector(".ui-acg__scope")!.textContent).toBe("Add notes to your cases");
    key(document.activeElement!, "End");
    await expect.poll(() => (document.activeElement as HTMLElement).closest(".ui-acg__row")!.querySelector(".ui-acg__scope")!.textContent).toBe("Search closed cases");
    expect([...el.querySelectorAll<HTMLElement>(".ui-acg__actions button")].filter((b) => b.tabIndex === 0)).toHaveLength(1);
  });

  test("its own clock when `now` isn't given; narrow, a grant's buttons go under it", async () => {
    const el = await fixture<TcAccessGrants>(html`<div style="width: 360px"><tc-access-grants .grants=${[{ id: "x", source: "S", scope: "Read", level: "read", expiresAt: Date.now() + 2 * DAY + 60000 }]}></tc-access-grants></div>`);
    const g = el.querySelector("tc-access-grants")!;
    await settle();
    expect(g.querySelector(".ui-acg__expiry")!.textContent!.trim()).toBe("Expires in 2 days");
    const r = g.querySelector<HTMLElement>(".ui-acg__row")!;
    const actions = r.querySelector<HTMLElement>(".ui-acg__actions")!;
    expect(actions.getBoundingClientRect().top).toBeGreaterThan(r.querySelector(".ui-acg__scope")!.getBoundingClientRect().bottom);
  });

  test("React wrapper: title, an uncontrolled tab survives a re-render, revoke updates the list; controlled filter stays", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onFilterChange = vi.fn();
    const onRevoke = vi.fn();
    const draw = (n: number) => root.render(React.createElement(AccessGrants, { title: `Access ${n}`, grants: GRANTS, now: NOW, onFilterChange, onRevoke }));
    await act(async () => draw(1));
    await settle();
    const el = host.querySelector("tc-access-grants")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Access 1");
    await act(async () => el.querySelector<HTMLButtonElement>('.ui-acg__tab[data-filter="expiring"]')!.click());
    expect(onFilterChange).toHaveBeenCalledWith("expiring");
    await act(async () => draw(2));
    await settle();
    expect(el.filter).toBe("expiring");
    await act(async () => btn(row(el, "Read transactions"), "Revoke")!.click());
    await settle();
    await act(async () => btn(el.querySelector(".ui-acg__panel")!, "Revoke access")!.click());
    await settle();
    expect(onRevoke).toHaveBeenCalledWith(expect.objectContaining({ id: "ledger" }));
    await act(async () => draw(3));
    await settle();
    expect(scopes(el)).toEqual(["Search closed cases"]);
    await act(async () => root.unmount());

    const root2 = createRoot(host);
    await act(async () => root2.render(React.createElement(AccessGrants, { grants: GRANTS, now: NOW, filter: "all", onFilterChange })));
    await settle();
    const el2 = host.querySelector("tc-access-grants")!;
    await act(async () => el2.querySelector<HTMLButtonElement>('.ui-acg__tab[data-filter="changed"]')!.click());
    await settle();
    expect(el2.filter).toBe("all");
    await act(async () => root2.unmount());
  });

  for (const look of ["standard", "clean"] as const) {
    for (const theme of ["light", "dark"] as const) {
      test(`axe: no violations – ${look}, ${theme}`, async () => {
        const wrap = await fixture(
          html`<div data-tc-theme=${theme} style="padding: 16px; background: ${theme === "dark" ? "#0e0e10" : "#fff"}">
            <tc-access-grants look=${look} heading="Assistant access" description="Fraud review" .grants=${GRANTS} .now=${NOW}></tc-access-grants>
          </div>`,
        );
        const el = wrap.querySelector<TcAccessGrants>("tc-access-grants")!;
        btn(row(el, "Read cases in Team North"), "Review")!.click();
        await settle();
        await finish(wrap);
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  }
});
