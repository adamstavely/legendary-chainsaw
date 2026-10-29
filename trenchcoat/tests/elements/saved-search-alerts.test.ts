/*
 * <tc-saved-search-alerts> in real browsers: the new-match badges and times, frequency, channels, pause, Run now,
 * remove with Undo, Add alert (and draft-query), read only, controlled use, the React wrapper and axe in both looks and
 * both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/saved-search-alerts";
import type { AlertsChange, SearchAlert, TcSavedSearchAlerts } from "../../src/elements/saved-search-alerts";
import { SavedSearchAlerts } from "../../src/elements/react/saved-search-alerts";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

// Friday 24 October 2026, 15:00 local
const NOW = new Date(2026, 9, 24, 15).getTime();
const H = 3_600_000;
const ALERTS: SearchAlert[] = [
  { id: "a", name: "Bleaching surveys", query: "coral bleaching survey", frequency: "daily", channels: ["email"], newCount: 12, lastRun: NOW - 2 * H, lastMatch: new Date(2026, 9, 20, 9).getTime() },
  { id: "b", name: "Kelp reports", query: "kelp grant", frequency: "weekly", channels: [], lastRun: NOW - 3 * 24 * H },
  { id: "c", name: "Buoy alerts", query: "buoy temperature", frequency: "instant", channels: ["slack"], paused: true },
];
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-ssa__alert[data-id="${id}"]`)!;
const make = (look = "standard") => fixture<TcSavedSearchAlerts>(html`<tc-saved-search-alerts look=${look} locale="en-GB" .now=${NOW} .alerts=${ALERTS}></tc-saved-search-alerts>`);
const changes = (el: Element) => {
  const out: AlertsChange[] = [];
  el.addEventListener("tc-alerts-change", (e) => out.push((e as CustomEvent<AlertsChange>).detail));
  return out;
};

describe("tc-saved-search-alerts", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: each alert with its query, new matches since, last check, and how many are on`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("ssa");
      expect(el.dataset.look).toBe(look);
      expect(text(el.querySelector(".ui-ssa__count"))).toBe("2 of 3 on");
      expect(text(row(el, "a").querySelector(".ui-ssa__query"))).toBe("coral bleaching survey");
      expect(text(row(el, "a").querySelector(".ui-ssa__new"))).toBe("12 new since Tue for Bleaching surveys");
      expect(text(row(el, "a").querySelector(".ui-ssa__status"))).toMatch(/^Checked 2 hr\.? ago$/);
      expect(text(row(el, "b").querySelector(".ui-ssa__status"))).toBe("Checked 3 days ago");
      expect(text(row(el, "c").querySelector(".ui-ssa__status"))).toBe("Paused Not run yet");
      expect(row(el, "c").hasAttribute("data-off")).toBe(true);
      expect(row(el, "a").querySelector('[role="group"]')!.getAttribute("aria-labelledby")).toBe(row(el, "a").querySelector("h4")!.id);
    });
  }

  test("frequency, channels and pause each fire a cancelable tc-alerts-change with the next list", async () => {
    const el = await make();
    const seen = changes(el);
    const select = row(el, "b").querySelector<HTMLSelectElement>("select")!;
    select.value = "daily";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    const slack = [...row(el, "b").querySelectorAll<HTMLButtonElement>(".ui-ssa__channel")].find((b) => text(b) === "Slack")!;
    slack.click();
    await settle();
    expect(slack.getAttribute("aria-pressed")).toBe("true");
    [...row(el, "c").querySelectorAll<HTMLButtonElement>(".ui-ssa__btn")].find((b) => text(b) === "Resume")!.click();
    await settle();
    expect(el.alerts.find((a) => a.id === "b")).toMatchObject({ frequency: "daily", channels: ["slack"] });
    expect(el.alerts.find((a) => a.id === "c")!.paused).toBe(false);
    expect(seen.map((s) => s.change)).toEqual([
      { type: "frequency", id: "b", frequency: "daily" },
      { type: "channel", id: "b", channel: "slack", on: true },
      { type: "pause", id: "c", paused: false },
    ]);
    el.addEventListener("tc-alerts-change", (e) => e.preventDefault(), { once: true });
    select.value = "off";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await settle();
    expect(select.value).toBe("daily");
  });

  test("Run now and the new matches fire tc-run and tc-open", async () => {
    const el = await make();
    const got: string[] = [];
    el.addEventListener("tc-run", (e) => got.push(`run:${(e as CustomEvent).detail.id}`));
    el.addEventListener("tc-open", (e) => got.push(`open:${(e as CustomEvent).detail.id}`));
    [...row(el, "a").querySelectorAll<HTMLButtonElement>(".ui-ssa__btn")].find((b) => text(b) === "Run now")!.click();
    row(el, "a").querySelector<HTMLButtonElement>(".ui-ssa__new")!.click();
    expect(got).toEqual(["run:a", "open:a"]);
  });

  test("remove with Undo: focus to Undo, Undo puts it back in its place", async () => {
    const el = await make();
    row(el, "b").querySelector<HTMLButtonElement>(".ui-ssa__remove")!.click();
    await settle();
    expect(el.alerts.map((a) => a.id)).toEqual(["a", "c"]);
    expect(document.activeElement).toBe(el.querySelector(".ui-ssa__undo"));
    el.querySelector<HTMLButtonElement>(".ui-ssa__undo")!.click();
    await settle();
    expect(el.alerts.map((a) => a.id)).toEqual(["a", "b", "c"]);
    expect(document.activeElement).toBe(row(el, "b").querySelector("h4"));
  });

  test("Add alert: draft-query fills the search; the name falls back to the query", async () => {
    const el = await make();
    el.draftQuery = "seagrass carbon";
    await settle();
    const [, query] = el.querySelectorAll<HTMLInputElement>(".ui-ssa__add .ui-ssa__input");
    expect(query.value).toBe("seagrass carbon");
    el.querySelector<HTMLFormElement>(".ui-ssa__add")!.requestSubmit();
    await settle();
    const added = el.alerts.at(-1)!;
    expect(added).toMatchObject({ name: "seagrass carbon", query: "seagrass carbon", frequency: "daily", channels: ["email"] });
    expect(added.id).toBeTruthy();
    expect(el.querySelector<HTMLButtonElement>(".ui-ssa__add-btn")!.disabled).toBe(true);
  });

  test("empty and read only", async () => {
    const empty = await fixture<TcSavedSearchAlerts>(html`<tc-saved-search-alerts></tc-saved-search-alerts>`);
    expect(text(empty.querySelector(".ui-ssa__empty"))).toMatch(/^No alerts yet/);
    const ro = await fixture<TcSavedSearchAlerts>(html`<tc-saved-search-alerts readonly .now=${NOW} .alerts=${ALERTS}></tc-saved-search-alerts>`);
    expect(ro.querySelector(".ui-ssa__add")).toBeNull();
    expect(ro.querySelector(".ui-ssa__remove")).toBeNull();
    expect(ro.querySelector<HTMLSelectElement>("select")!.disabled).toBe(true);
  });

  test("React wrapper: uncontrolled survives re-renders; controlled stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const lists: SearchAlert[][] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(SavedSearchAlerts, { title: "Mine", now: NOW, defaultAlerts: ALERTS, onAlertsChange: (next) => void lists.push(next), "data-n": n } as React.ComponentProps<typeof SavedSearchAlerts>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-saved-search-alerts")!;
    row(el, "c").querySelector<HTMLButtonElement>(".ui-ssa__btn")!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.alerts.find((a) => a.id === "c")!.paused).toBe(false);
    expect(lists).toHaveLength(1);
    await act(async () => root.render(React.createElement(SavedSearchAlerts, { now: NOW, alerts: ALERTS })));
    await settle();
    const held = host.querySelector("tc-saved-search-alerts")!;
    row(held, "b").querySelector<HTMLButtonElement>(".ui-ssa__remove")!.click();
    await settle();
    expect(held.alerts.map((a) => a.id)).toEqual(["a", "b", "c"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-saved-search-alerts description="You hear about new matches" .now=${NOW} .alerts=${ALERTS} draft-query="seagrass"></tc-saved-search-alerts>
        <tc-saved-search-alerts look="clean" .now=${NOW} .alerts=${ALERTS}></tc-saved-search-alerts>
        <tc-saved-search-alerts readonly></tc-saved-search-alerts>
      </div>`);
      wrap.querySelector<HTMLButtonElement>(".ui-ssa__remove")!.click();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
