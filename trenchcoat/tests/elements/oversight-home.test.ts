/*
 * <tc-oversight-home> in real browsers: the intro, the focus band and its action, a KPI chart per number (with the
 * change's sign once), the services table sorted worst first with its filter, switching roles (tc-role-change and
 * preventDefault), tc-open-focus, narrow layout, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/oversight-home";
import type { OversightOpenFocus, OversightRole, OversightRoleChange, TcOversightHome } from "../../src/elements/oversight-home";
import type { TcKpiChart } from "../../src/elements/kpi-chart";
import type { TcSegmentedControl } from "../../src/elements/segmented-control";
import { OversightHome } from "../../src/elements/react/oversight-home";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const DAYS = ["Mon", "Tue", "Wed"];
const ROLES: OversightRole[] = [
  {
    id: "reviewer",
    label: "Reviewer",
    eyebrow: "Tuesday · Review",
    headline: "5 decisions are waiting for you.",
    summary: "Your review load.",
    focus: { label: "5 decisions awaiting review", detail: "2 overdue", action: "Start reviewing" },
    kpis: [
      { id: "pending", label: "Awaiting review", value: "5", delta: -28, lowerIsBetter: true, labels: DAYS, values: [9, 8, 5], previous: [7, 9, 9], footer: "2 overdue" },
      { id: "time", label: "Median review time", value: "14m", delta: 6, labels: DAYS, values: [18, 16, 14] },
    ],
    services: [
      { id: "policy", name: "Policy engine", state: "normal", availability: "99.98%", lastEvent: "Health check passed" },
      { id: "verify", name: "Claim verification", state: "limited", availability: "97.40%" },
      { id: "adv", name: "Adversarial testing", state: "down" },
      { id: "fb", name: "Outcome feedback", state: "unknown" },
    ],
    servicesNote: "Your team's workspaces only.",
  },
  {
    id: "platform",
    label: "Platform",
    headline: "All services are running.",
    kpis: [],
    services: [{ id: "policy", name: "Policy engine", state: "normal" }],
  },
];

const make = (look: "standard" | "clean" = "standard", width = 1100) =>
  fixture<TcOversightHome>(html`<tc-oversight-home look=${look} style=${`width: ${width}px`} .roles=${ROLES}></tc-oversight-home>`);
const text = (el: Element | null) => el?.textContent!.replace(/\s+/g, " ").trim();
const switches = (el: Element) => [...el.querySelectorAll<TcSegmentedControl>("tc-segmented-control")];
const rows = (el: Element) => (el.querySelector("tc-data-table") as unknown as { rows: { id: string; state: string }[] }).rows;
const pick = (seg: Element, value: string) => seg.dispatchEvent(new CustomEvent("tc-value-change", { detail: { value }, bubbles: true, composed: true, cancelable: true }));

describe("tc-oversight-home", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the intro, the focus band, a chart per KPI and the services worst first`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("ovh");
      expect(el.dataset.look).toBe(look);
      expect(text(el.querySelector(".ui-ovh__eyebrow"))).toBe("Tuesday · Review");
      expect(el.querySelector("h2")!.textContent).toBe("5 decisions are waiting for you.");
      expect(text(el.querySelector(".ui-ovh__summary"))).toBe("Your review load.");
      expect(switches(el)[0].options.map((o) => o.label)).toEqual(["Reviewer", "Platform"]);
      expect(switches(el)[0].value).toBe("reviewer");
      expect(text(el.querySelector(".ui-ovh__focus-title"))).toBe("5 decisions awaiting review");
      expect(el.querySelector(".ui-ovh__focus")!.getAttribute("aria-labelledby")).toBe(el.querySelector(".ui-ovh__focus-title")!.id);
      expect(el.querySelector(".ui-ovh__focus tc-button")!.getAttribute("label")).toBe("Start reviewing");
      const charts = [...el.querySelectorAll<TcKpiChart>("tc-kpi-chart")];
      expect(charts.map((c) => c.heading)).toEqual(["Awaiting review", "Median review time"]);
      expect(charts.every((c) => c.dataset.look === look)).toBe(true);
      expect(charts[0].series.map((s) => s.label)).toEqual(["This week", "Last week"]);
      expect(charts[1].series).toHaveLength(1);
      expect(charts[0].lowerIsBetter).toBe(true);
      // The chart puts the sign in front once: "−28%", "+6%"
      await expect.poll(() => text(charts[0].querySelector(".ui-kpi__delta"))).toBe("−28%");
      expect(text(charts[1].querySelector(".ui-kpi__delta"))).toBe("+6%");
      expect(rows(el).map((r) => r.id)).toEqual(["adv", "verify", "fb", "policy"]);
      expect(rows(el)[0].state).toBe("Down");
      expect(text(el.querySelector(".ui-ovh__posture-note"))).toBe("2 of 4 need attention");
      expect(text(el.querySelector(".ui-ovh__note"))).toBe("Your team's workspaces only.");
    });
  }

  test("the services filter shows one state at a time, with counts", async () => {
    const el = await make();
    const filter = switches(el)[1];
    expect(filter.options.map((o) => `${o.label}${o.badge ? ` ${o.badge}` : ""}`)).toEqual(["All", "Normal 1", "Limited 1", "Down 1", "Unknown 1"]);
    pick(filter, "limited");
    await settle();
    expect(rows(el).map((r) => r.id)).toEqual(["verify"]);
    pick(filter, "all");
    await settle();
    expect(rows(el)).toHaveLength(4);
  });

  test("switching roles: tc-role-change with the id and role; the home and its filter change; preventDefault keeps it", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-role-change", (e) => {
      const d = (e as CustomEvent<OversightRoleChange>).detail;
      seen.push(`${d.roleId}:${d.role.label}`);
    });
    pick(switches(el)[1], "down");
    await settle();
    let inner = 0;
    document.body.addEventListener("tc-value-change", () => inner++);
    pick(switches(el)[0], "platform");
    await settle();
    expect(inner).toBe(0);
    expect(seen).toEqual(["platform:Platform"]);
    expect(el.roleId).toBe("platform");
    expect(el.querySelector("h2")!.textContent).toBe("All services are running.");
    expect(el.querySelector(".ui-ovh__focus")).toBeNull();
    expect(el.querySelector("tc-kpi-chart")).toBeNull();
    expect(text(el.querySelector(".ui-ovh__posture-note"))).toBe("All 1 running normally");
    // One state: no filter
    expect(switches(el)).toHaveLength(1);
    // Back: the filter starts at All again
    pick(switches(el)[0], "reviewer");
    await settle();
    expect(rows(el)).toHaveLength(4);
    el.addEventListener("tc-role-change", (e) => e.preventDefault());
    pick(switches(el)[0], "platform");
    await settle();
    expect(el.roleId).toBe("reviewer");
    // An unknown role id shows the first
    el.roleId = "nobody";
    await settle();
    expect(el.querySelector("h2")!.textContent).toBe("5 decisions are waiting for you.");
  });

  test("the focus action fires tc-open-focus with the role; hide-focus-action hides it; no roles renders nothing", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-open-focus", (e) => seen.push((e as CustomEvent<OversightOpenFocus>).detail.role.id));
    el.querySelector<HTMLElement>(".ui-ovh__focus tc-button button")!.click();
    expect(seen).toEqual(["reviewer"]);
    el.hideFocusAction = true;
    await settle();
    expect(el.querySelector(".ui-ovh__focus tc-button")).toBeNull();
    el.roles = [];
    await settle();
    expect(el.querySelector("h2")).toBeNull();
  });

  test("renamed states and chart lines", async () => {
    const el = await make();
    el.stateLabels = { down: "Offline" };
    el.currentLabel = "Today";
    el.previousLabel = "Yesterday";
    await settle();
    expect(rows(el)[0].state).toBe("Offline");
    expect(el.querySelector<TcKpiChart>("tc-kpi-chart")!.series.map((s) => s.label)).toEqual(["Today", "Yesterday"]);
  });

  test("narrow: KPIs stack in one column", async () => {
    const el = await make("standard", 360);
    const [a, b] = [...el.querySelectorAll("tc-kpi-chart")].map((c) => c.getBoundingClientRect());
    expect(b.top).toBeGreaterThanOrEqual(a.bottom - 1);
    expect(a.width).toBeLessThanOrEqual(360);
  });

  test("React wrapper: a controlled role, defaultRole, and onOpenFocus showing the action", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const roles: string[] = [];
    await act(async () => root.render(React.createElement(OversightHome, { roles: ROLES, role: "reviewer", onRoleChange: (id) => void roles.push(id) })));
    await settle();
    const el = host.querySelector("tc-oversight-home")!;
    // No onOpenFocus: no action
    expect(el.querySelector(".ui-ovh__focus tc-button")).toBeNull();
    await act(async () => void pick(switches(el)[0], "platform"));
    await settle();
    expect(roles).toEqual(["platform"]);
    expect(el.roleId).toBe("reviewer");
    // Uncontrolled from defaultRole, with the focus action
    const opened: string[] = [];
    await act(async () => root.render(React.createElement(OversightHome, { key: "u", roles: ROLES, defaultRole: "platform", onOpenFocus: (r) => void opened.push(r.id) })));
    await settle();
    const el2 = host.querySelector("tc-oversight-home")!;
    expect(el2.roleId).toBe("platform");
    await act(async () => void pick(switches(el2)[0], "reviewer"));
    await act(async () => root.render(React.createElement(OversightHome, { key: "u", roles: ROLES, defaultRole: "platform", onOpenFocus: (r) => void opened.push(r.id), currentLabel: "Now" })));
    await settle();
    expect(el2.roleId).toBe("reviewer");
    el2.querySelector<HTMLElement>(".ui-ovh__focus tc-button button")!.click();
    expect(opened).toEqual(["reviewer"]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; width: 1100px; background: var(--tc-surface-base)">
        <tc-oversight-home .roles=${ROLES}></tc-oversight-home>
        <tc-oversight-home look="clean" role-id="platform" .roles=${ROLES}></tc-oversight-home>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
