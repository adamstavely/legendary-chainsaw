/*
 * <tc-org-unit-card> in real browsers: the header, lead, health and stats, teams that fold open onto their items,
 * the row keyboard, controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/org-unit-card";
import type { OrgExpandedChange, OrgOpen, OrgStat, OrgTeam, TcOrgUnitCard } from "../../src/elements/org-unit-card";
import { OrgUnitCard } from "../../src/elements/react/org-unit-card";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const STATS: OrgStat[] = [
  { id: "teams", label: "Teams", value: "2", sub: "5 researchers" },
  { id: "budget", label: "Budget", value: "$9.2M", sub: "$5.1M spent", meter: 0.55 },
];
const TEAMS: OrgTeam[] = [
  {
    id: "cog",
    name: "Cognitive Systems",
    lead: { name: "Marcus Okonkwo" },
    people: 3,
    health: { "on-track": 1, "at-risk": 1 },
    coverage: 0.61,
    gaps: 5,
    fte: 2.6,
    items: [
      { id: "neuro", label: "Neuromorphic Computing", priority: 1, tag: "Flagship", detail: "4 in work", coverage: 0.42, open: 4, momentum: -0.08, health: "at-risk" },
      { id: "adv", label: "Adversarial ML", priority: 3, coverage: 0.8, open: 1, momentum: 0.06 },
    ],
  },
  { id: "auto", name: "Autonomy", people: 1, items: [{ id: "swarm", label: "Swarm Coordination", momentum: 0 }] },
];

const row = (el: Element, key: string) => el.querySelector<HTMLElement>(`[data-key="${key}"]`)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard", expanded: string[] = []) =>
  fixture<TcOrgUnitCard>(html`<tc-org-unit-card
    look=${look}
    code="CIS"
    heading="Intelligent Systems"
    description="Learning and autonomy."
    lead-label="Centre lead"
    .lead=${{ name: "Marcus Okonkwo", title: "Principal Investigator" }}
    .health=${{ "on-track": 2, watch: 1, "at-risk": 1 }}
    .stats=${STATS}
    .teams=${TEAMS}
    .expanded=${expanded}
    .actions=${[{ id: "brief", label: "Directorate brief" }]}
  ></tc-org-unit-card>`);

describe("tc-org-unit-card", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the header, lead, health, stats and teams, with one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("orgu");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Intelligent Systems");
      expect(el.querySelector(".ui-orgu__code")!.textContent).toBe("CIS");
      expect(el.querySelector(".ui-orgu__lead")!.textContent!.replace(/\s+/g, " ").trim()).toBe("MO Centre lead Marcus Okonkwo Principal Investigator");
      const health = el.querySelector('[role="group"][aria-label="Health"]')!;
      expect([...health.querySelectorAll(".ui-orgu__health")].map((h) => h.textContent!.replace(/\s+/g, " ").trim())).toEqual(["2On track", "1Watch", "1At risk"]);
      const stats = [...el.querySelectorAll(".ui-orgu__stat")].map((s) => [s.querySelector("dt")!.textContent, s.querySelector(".ui-orgu__stat-value")!.textContent]);
      expect(stats).toEqual([
        ["Teams", "2"],
        ["Budget", "$9.2M (55%)"],
      ]);
      expect(el.querySelector<HTMLElement>(".ui-orgu__stat-meter > span")!.style.inlineSize).toBe("55%");
      const teams = el.querySelectorAll<HTMLElement>(".ui-orgu__team-row");
      expect(teams).toHaveLength(2);
      expect(teams[0].getAttribute("aria-expanded")).toBe("false");
      expect(teams[0].textContent).toContain("3 people");
      expect(teams[0].querySelector(".ui-orgu__team-health")!.textContent!.replace(/\s+/g, " ").trim()).toBe("1 On track, 1 At risk");
      expect(el.querySelectorAll('.ui-orgu__team-list [tabindex="0"]')).toHaveLength(1);
      expect(row(el, "t:cog").getAttribute("tabindex")).toBe("0");
      expect(el.querySelectorAll(".ui-orgu__item")).toHaveLength(0);
    });
  }

  test("a team opens on click and shows its items; tc-expanded-change fires; preventing it keeps the team closed", async () => {
    const el = await make();
    const seen: OrgExpandedChange[] = [];
    el.addEventListener("tc-expanded-change", (e) => seen.push((e as CustomEvent<OrgExpandedChange>).detail));
    row(el, "t:cog").click();
    await settle();
    expect(el.expanded).toEqual(["cog"]);
    expect(row(el, "t:cog").getAttribute("aria-expanded")).toBe("true");
    const list = document.getElementById(row(el, "t:cog").getAttribute("aria-controls")!)!;
    expect(list.getAttribute("aria-label")).toBe("Cognitive Systems: Topics");
    expect([...list.querySelectorAll(".ui-orgu__item-label")].map((l) => l.textContent)).toEqual(["Neuromorphic Computing, At risk", "Adversarial ML"]);
    const neuro = row(el, "i:cog:neuro");
    expect(neuro.querySelector(".ui-orgu__prio")!.textContent).toBe("Priority 1");
    expect(neuro.querySelector(".ui-orgu__mom")!.textContent).toBe("▼Down 8%");
    expect(neuro.querySelector(".ui-orgu__mom")!.getAttribute("data-dir")).toBe("down");
    expect(row(el, "i:cog:adv").querySelector(".ui-orgu__mom")!.getAttribute("data-dir")).toBe("up");
    expect(neuro.querySelector(".ui-orgu__cov-n")!.textContent).toBe("42% covered");
    row(el, "t:cog").click();
    await settle();
    expect(el.expanded).toEqual([]);
    expect(seen).toEqual([
      { expanded: ["cog"], id: "cog", open: true },
      { expanded: [], id: "cog", open: false },
    ]);
    el.addEventListener("tc-expanded-change", (e) => e.preventDefault());
    row(el, "t:auto").click();
    await settle();
    expect(el.expanded).toEqual([]);
    expect(row(el, "t:auto").getAttribute("aria-expanded")).toBe("false");
  });

  test("keyboard: ↑ ↓ Home End through teams and open items; → opens and steps in; ← steps out and closes; Enter opens an item", async () => {
    const el = await make("standard", ["cog"]);
    const opened: OrgOpen[] = [];
    el.addEventListener("tc-open", (e) => opened.push((e as CustomEvent<OrgOpen>).detail));
    const at = () => document.activeElement?.getAttribute("data-key");
    row(el, "t:cog").focus();
    const press = async (k: string) => {
      key(document.activeElement!, k);
      await settle();
      await expect.poll(() => el.querySelectorAll('.ui-orgu__team-list [tabindex="0"]').length).toBe(1);
    };
    await press("ArrowDown");
    expect(at()).toBe("i:cog:neuro");
    await press("End");
    expect(at()).toBe("t:auto");
    await press("ArrowRight");
    expect(el.expanded).toEqual(["cog", "auto"]);
    expect(at()).toBe("t:auto");
    await press("ArrowRight");
    expect(at()).toBe("i:auto:swarm");
    await press("ArrowLeft");
    expect(at()).toBe("t:auto");
    await press("ArrowLeft");
    expect(el.expanded).toEqual(["cog"]);
    await press("Home");
    expect(at()).toBe("t:cog");
    await press("ArrowDown");
    await press("ArrowDown");
    expect(at()).toBe("i:cog:adv");
    (document.activeElement as HTMLElement).click();
    expect(opened.map((o) => [o.team, o.item.id])).toEqual([["cog", "adv"]]);
  });

  test("the tab stop moves back to the team when its items close while one has it", async () => {
    const el = await make("standard", ["cog"]);
    row(el, "i:cog:adv").focus();
    await settle();
    expect(row(el, "i:cog:adv").getAttribute("tabindex")).toBe("0");
    el.expanded = [];
    await settle();
    expect(row(el, "t:cog").getAttribute("tabindex")).toBe("0");
  });

  test("header actions fire tc-action; an element with no lead, health or teams renders just its header", async () => {
    const el = await make();
    const ids: string[] = [];
    el.addEventListener("tc-action", (e) => ids.push((e as CustomEvent<{ id: string }>).detail.id));
    el.querySelector<HTMLElement>(".ui-orgu__action")!.click();
    expect(ids).toEqual(["brief"]);
    const bare = await fixture<TcOrgUnitCard>(html`<tc-org-unit-card heading="Energy and Climate"></tc-org-unit-card>`);
    expect(bare.querySelector(".ui-orgu__code")!.textContent).toBe("EC");
    expect(bare.querySelector(".ui-orgu__teams")).toBeNull();
    expect(bare.querySelector(".ui-orgu__stats")).toBeNull();
  });

  test("React wrapper: uncontrolled teams stay open across parent re-renders; onOpen and onAction report", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(OrgUnitCard, {
        title: "Intelligent Systems",
        teams: TEAMS,
        actions: [{ id: "brief", label: "Brief" }],
        onExpandedChange: (x) => void seen.push(["expanded", x]),
        onOpen: (team, item) => void seen.push(["open", team, item.id]),
        onAction: (id) => void seen.push(["action", id]),
        "data-n": n,
      } as React.ComponentProps<typeof OrgUnitCard>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-org-unit-card")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Intelligent Systems");
    row(el, "t:auto").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.expanded).toEqual(["auto"]);
    row(el, "i:auto:swarm").click();
    el.querySelector<HTMLElement>(".ui-orgu__action")!.click();
    expect(seen).toEqual([
      ["expanded", ["auto"]],
      ["open", "auto", "swarm"],
      ["action", "brief"],
    ]);
    await act(async () => root.unmount());
  });

  test("React wrapper: controlled teams stay as the parent says", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: string[][] = [];
    await act(async () => root.render(React.createElement(OrgUnitCard, { title: "Unit", teams: TEAMS, expanded: [], onExpandedChange: (x) => void asked.push(x) })));
    await settle();
    const el = host.querySelector("tc-org-unit-card")!;
    row(el, "t:cog").click();
    await settle();
    expect(asked).toEqual([["cog"]]);
    expect(el.expanded).toEqual([]);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-org-unit-card code="CIS" heading="Intelligent Systems" description="Learning and autonomy." .lead=${{ name: "Marcus Okonkwo", title: "PI" }} .health=${{ "on-track": 2, watch: 1, "at-risk": 1 }} .stats=${STATS} .teams=${TEAMS} .expanded=${["cog"]} .actions=${[{ id: "brief", label: "Brief", variant: "primary" }]}></tc-org-unit-card>
        <tc-org-unit-card look="clean" heading="Autonomy" .stats=${STATS} .teams=${TEAMS} .expanded=${["auto"]}></tc-org-unit-card>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
