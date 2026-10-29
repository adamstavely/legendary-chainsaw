/*
 * <tc-team-roster> in real browsers: local times and offsets, working hours, the overlap strip and best time to meet,
 * grouping, filtering, list and grid, selection, Email and Message, the keyboard, the helpers, the React wrapper and
 * axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/team-roster";
import { relativeOffset, zoneOffset, type RosterAction, type RosterMember, type RosterSelectedChange, type TcTeamRoster } from "../../src/elements/team-roster";
import { TeamRoster } from "../../src/elements/react/team-roster";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

// 14:10 UTC on 21 October 2026: London is on summer time (UTC+1), New York too (UTC−4)
const NOW = Date.UTC(2026, 9, 21, 14, 10);
const MEMBERS: RosterMember[] = [
  { id: "a", name: "Ines Okafor", role: "Lead", team: "Coordination", timezone: "Europe/London", status: "available", email: "ines@example.org", skills: ["Grants"] },
  { id: "b", name: "Jun Watanabe", role: "Statistician", team: "Data", timezone: "Asia/Tokyo", status: "offline" },
  { id: "c", name: "Sam Carter", role: "Comms", team: "Coordination", timezone: "America/New_York", status: "busy", email: "sam@example.org" },
  { id: "d", name: "Priya Raman", role: "Project manager", team: "Data", timezone: "Asia/Kolkata", workingHours: { start: "10:00", end: "18:30" }, skills: ["Reporting", "Grants"] },
];
const make = (look = "standard", extra: Partial<TcTeamRoster> = {}) =>
  fixture<TcTeamRoster>(html`<tc-team-roster look=${look} heading="Team" viewer-timezone="UTC" locale="en-US" .now=${NOW} .members=${MEMBERS} .groupBy=${extra.groupBy ?? "team"}></tc-team-roster>`);
const text = (el: Element | null | undefined) =>
  [...(el?.childNodes ?? [])].map((n) => (n.nodeType === Node.COMMENT_NODE ? "" : (n.textContent ?? ""))).join("").replace(/\s+/g, " ").trim();
const member = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-ros__member[data-id="${id}"]`)!;
const names = (el: Element) => [...el.querySelectorAll(".ui-ros__member")].map((m) => m.getAttribute("data-id"));
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-team-roster", () => {
  test("helpers: zone offsets and how they read", () => {
    expect(zoneOffset("Europe/London", NOW)).toBe(60);
    expect(zoneOffset("Asia/Kolkata", NOW)).toBe(330);
    expect(zoneOffset("America/New_York", NOW)).toBe(-240);
    expect(zoneOffset("Not/AZone", NOW)).toBeNull();
    expect(relativeOffset(360)).toBe("6 h ahead");
    expect(relativeOffset(-150)).toBe("2.5 h behind");
    expect(relativeOffset(0)).toBe("same time");
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: grouped by team, each member's local time, offset, hours and status`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("ros");
      expect(el.dataset.look).toBe(look);
      expect([...el.querySelectorAll(".ui-ros__section-name")].map(text)).toEqual(["Coordination 2", "Data 2"]);
      expect(names(el)).toEqual(["a", "c", "b", "d"]);
      const a = member(el, "a");
      expect(text(a.querySelector(".ui-ros__time"))).toBe("3:10 PM");
      expect(text(a.querySelector(".ui-ros__rel"))).toBe("1 h ahead");
      expect(text(a.querySelector(".ui-ros__hours"))).toBe("Working hours");
      expect(text(member(el, "b").querySelector(".ui-ros__hours"))).toBe("Outside hours");
      expect(text(member(el, "c").querySelector(".ui-ros__rel"))).toBe("4 h behind");
      expect(text(member(el, "d").querySelector(".ui-ros__rel"))).toBe("5.5 h ahead");
      // Status in words for screen readers, with the dot for the eye
      expect(a.querySelector(".ui-ros__name")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Ines Okafor, Available");
      expect(a.querySelector('.ui-ros__dot[data-status="available"]')).not.toBeNull();
      expect([...a.querySelectorAll(".ui-ros__skill")].map(text)).toEqual(["Grants"]);
      // One tab stop across the members' buttons
      expect(el.querySelectorAll('.ui-ros__groups [tabindex="0"]')).toHaveLength(1);
    });
  }

  test("overlap: hours shaded by how many work then, and the best time to meet in your time", async () => {
    const el = await make();
    expect(text(el.querySelector(".ui-ros__best"))).toBe("Best time to meet: 04:00–16:00 your time");
    const hours = [...el.querySelectorAll(".ui-ros__hour")];
    expect(hours).toHaveLength(24);
    expect(hours.filter((h) => h.hasAttribute("data-best"))).toHaveLength(12);
    expect(hours[14].hasAttribute("data-now")).toBe(true);
    expect(el.querySelector(".ui-ros__bar")!.getAttribute("aria-label")).toBe("Best time to meet: 04:00–16:00 your time, when 2 of 4 are working");
  });

  test("group, filter and view are cancelable changes", async () => {
    const el = await make();
    const seen: string[] = [];
    for (const n of ["tc-group-change", "tc-filter-change", "tc-view-change"]) el.addEventListener(n, () => seen.push(n));
    const select = el.querySelector<HTMLSelectElement>(".ui-ros__select select")!;
    select.value = "timezone";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(el.groupBy).toBe("timezone");
    // Time zones run west to east
    expect([...el.querySelectorAll(".ui-ros__section-name")].map((h) => text(h).replace(/ \d+$/, ""))).toEqual(["New York · UTC−4", "London · UTC+1", "Kolkata · UTC+5:30", "Tokyo · UTC+9"]);
    const filter = el.querySelector<HTMLInputElement>(".ui-ros__filter-input")!;
    filter.value = "grants";
    filter.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(names(el)).toEqual(["a", "d"]);
    expect(text(el.querySelector('[role="status"]'))).toBe("2 members");
    filter.value = "zzz";
    filter.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(text(el.querySelector(".ui-ros__empty"))).toBe("No one matches “zzz”.");
    el.addEventListener("tc-view-change", (e) => e.preventDefault(), { once: true });
    el.querySelectorAll<HTMLButtonElement>(".ui-ros__view")[1].click();
    await settle();
    expect(el.view).toBe("list");
    el.querySelectorAll<HTMLButtonElement>(".ui-ros__view")[1].click();
    await settle();
    expect(el.view).toBe("grid");
    expect(seen).toEqual(["tc-group-change", "tc-filter-change", "tc-filter-change", "tc-view-change", "tc-view-change"]);
  });

  test("select, Email and Message; the keyboard moves through members and their buttons", async () => {
    const el = await make();
    const picks: RosterSelectedChange[] = [];
    const actions: RosterAction[] = [];
    el.addEventListener("tc-selected-change", (e) => picks.push((e as CustomEvent<RosterSelectedChange>).detail));
    el.addEventListener("tc-action", (e) => actions.push((e as CustomEvent<RosterAction>).detail));
    member(el, "a").querySelector<HTMLButtonElement>(".ui-ros__name")!.click();
    await settle();
    expect(el.selected).toBe("a");
    expect(member(el, "a").querySelector(".ui-ros__name")!.getAttribute("aria-pressed")).toBe("true");
    expect(member(el, "a").querySelector("a")!.getAttribute("href")).toBe("mailto:ines@example.org");
    // No email: no Email button
    expect(member(el, "b").querySelector("a")).toBeNull();
    member(el, "b").querySelector<HTMLButtonElement>(".ui-ros__btn")!.click();
    expect(actions.map((a) => a.member.id)).toEqual(["b"]);
    expect(picks.map((p) => p.selected)).toEqual(["a"]);
    const first = member(el, "a").querySelector<HTMLElement>(".ui-ros__name")!;
    first.focus();
    key(first, "ArrowDown");
    await settle();
    expect(document.activeElement).toBe(member(el, "c").querySelector(".ui-ros__name"));
    key(document.activeElement!, "ArrowRight");
    await settle();
    expect(document.activeElement).toBe(member(el, "c").querySelector("a"));
    key(document.activeElement!, "End");
    await settle();
    expect(document.activeElement).toBe(member(el, "d").querySelector(".ui-ros__name"));
  });

  test("without members, and without a time zone", async () => {
    const empty = await fixture<TcTeamRoster>(html`<tc-team-roster .now=${NOW}></tc-team-roster>`);
    expect(text(empty.querySelector(".ui-ros__empty"))).toBe("No one on this team yet.");
    const one = await fixture<TcTeamRoster>(html`<tc-team-roster .now=${NOW} .members=${[{ id: "x", name: "No Zone" }]}></tc-team-roster>`);
    expect(text(one.querySelector(".ui-ros__rel"))).toBe("No time zone");
    expect(one.querySelector(".ui-ros__overlap")).toBeNull();
  });

  test("React wrapper: uncontrolled view survives re-renders; controlled selection stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const messages: string[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(TeamRoster, { title: "Ours", members: MEMBERS, now: NOW, viewerTimezone: "UTC", onMessage: (m) => void messages.push(m.id), "data-n": n } as React.ComponentProps<typeof TeamRoster>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-team-roster")!;
    el.querySelectorAll<HTMLButtonElement>(".ui-ros__view")[1].click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.view).toBe("grid");
    member(el, "c").querySelector<HTMLButtonElement>("button.ui-ros__btn")!.click();
    expect(messages).toEqual(["c"]);
    await act(async () => root.render(React.createElement(TeamRoster, { members: MEMBERS, now: NOW, selected: null })));
    await settle();
    const held = host.querySelector("tc-team-roster")!;
    member(held, "a").querySelector<HTMLButtonElement>(".ui-ros__name")!.click();
    await settle();
    expect(held.selected).toBeNull();
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look, list and grid`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-team-roster heading="Team" description="Four time zones" viewer-timezone="UTC" .now=${NOW} .members=${MEMBERS} selected="a"></tc-team-roster>
        <tc-team-roster look="clean" view="grid" heading="Grid" group-by="none" viewer-timezone="UTC" .now=${NOW} .members=${MEMBERS}></tc-team-roster>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
