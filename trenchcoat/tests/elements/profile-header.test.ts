/*
 * <tc-profile-header> in real browsers: the avatar, name, pills, other names and facts, the actions and the overflow
 * button, the tabs with manual activation and a cancelable change, the narrow layout, the React wrapper and axe in
 * both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/profile-header";
import type { ProfileAction, ProfileActionEvent, ProfileSelectedChange, ProfileTab, TcProfileHeader } from "../../src/elements/profile-header";
import { ProfileHeader } from "../../src/elements/react/profile-header";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const ACTIONS: ProfileAction[] = [
  { id: "flag", label: "Flag for review", icon: "flag", variant: "primary" },
  { id: "report", label: "Report", icon: "report" },
];
const TABS: ProfileTab[] = [
  { id: "overview", label: "Overview", controls: "panel-overview" },
  { id: "docs", label: "Documents", count: 9 },
  { id: "people", label: "Linked people", count: 6 },
];
const tab = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-tab="${id}"]`)!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcProfileHeader>(html`<tc-profile-header
    look=${look}
    name="Dana Whitfield"
    more
    .status=${{ label: "Enhanced review", tone: "warning" }}
    .tags=${[{ label: "High priority", tone: "danger" }]}
    .aliases=${["D. Ross", "Dana Whitfield-Ross"]}
    .meta=${["Retail customer", "Leeds, UK", { label: "Case KYC-2291", tone: "warning" }]}
    .actions=${ACTIONS}
    .tabs=${TABS}
  ></tc-profile-header>`);

describe("tc-profile-header", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the avatar, name, pills, other names, facts and actions`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("phd");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector("h2")!.textContent).toBe("Dana Whitfield");
      const avatar = el.querySelector<HTMLElement>(".ui-phd__avatar")!;
      expect(avatar.textContent).toBe("DW");
      expect(avatar.dataset.shape).toBe("round");
      expect(avatar.getAttribute("aria-hidden")).toBe("true");
      expect([...el.querySelectorAll<HTMLElement>(".ui-phd__pill")].map((p) => [p.dataset.kind, p.dataset.tone, p.textContent])).toEqual([
        ["status", "warning", "Enhanced review"],
        ["tag", "danger", "High priority"],
      ]);
      expect(el.querySelector(".ui-phd__chips")!.getAttribute("aria-label")).toBe("Also known as");
      expect([...el.querySelectorAll(".ui-phd__chip")].map((c) => c.textContent)).toEqual(["D. Ross", "Dana Whitfield-Ross"]);
      expect([...el.querySelectorAll(".ui-phd__fact")].map((f) => f.textContent)).toEqual(["Retail customer", "Leeds, UK", "Case KYC-2291"]);
      expect(el.querySelector<HTMLElement>(".ui-phd__fact .ui-phd__dot")!.dataset.tone).toBe("warning");
      const buttons = [...el.querySelectorAll<HTMLButtonElement>(".ui-phd__btn")];
      expect(buttons.map((b) => b.textContent!.trim() || b.getAttribute("aria-label"))).toEqual(["Flag for review", "Report", "More actions"]);
      expect(buttons[0].dataset.variant).toBe("primary");
      expect(buttons[0].querySelector("svg")).toBeTruthy();
    });
  }

  test("actions and the overflow button fire tc-action with their id; level, picture, kind and an own icon", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-action", (e) => seen.push((e as CustomEvent<ProfileActionEvent>).detail.id));
    for (const b of el.querySelectorAll<HTMLButtonElement>(".ui-phd__btn")) b.click();
    expect(seen).toEqual(["flag", "report", "more"]);
    el.level = 1;
    el.kind = "account";
    el.picture = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";
    const own = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    own.classList.add("own-icon");
    el.actions = [{ id: "x", label: "Custom", icon: own, disabled: true }];
    el.more = false;
    await settle();
    expect(el.querySelector("h1")!.textContent).toBe("Dana Whitfield");
    expect(el.querySelector<HTMLElement>(".ui-phd__avatar")!.dataset.shape).toBe("square");
    expect(el.querySelector(".ui-phd__avatar img")!.getAttribute("alt")).toBe("");
    const btn = el.querySelector<HTMLButtonElement>(".ui-phd__btn")!;
    expect(btn.querySelector(".own-icon")).toBeTruthy();
    expect(btn.querySelector(".own-icon")).not.toBe(own);
    expect(btn.disabled).toBe(true);
    expect(el.querySelector('[data-action="more"]')).toBeNull();
  });

  test("tabs: the first is selected by default; arrows move focus without selecting; Enter, Space or a click select", async () => {
    const el = await make();
    const list = el.querySelector('[role="tablist"]')!;
    expect(list.getAttribute("aria-label")).toBe("Sections");
    expect(tab(el, "overview").getAttribute("aria-selected")).toBe("true");
    expect(tab(el, "overview").getAttribute("aria-controls")).toBe("panel-overview");
    expect(tab(el, "docs").getAttribute("aria-controls")).toBeNull();
    expect(tab(el, "docs").textContent).toBe("Documents9");
    expect(list.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    const seen: string[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<ProfileSelectedChange>).detail.selected));
    tab(el, "overview").focus();
    key(tab(el, "overview"), "ArrowRight");
    await expect.poll(() => document.activeElement).toBe(tab(el, "docs"));
    expect(tab(el, "docs").getAttribute("tabindex")).toBe("0");
    expect(tab(el, "overview").getAttribute("aria-selected")).toBe("true");
    key(tab(el, "docs"), "ArrowLeft");
    await expect.poll(() => document.activeElement).toBe(tab(el, "overview"));
    key(tab(el, "overview"), "ArrowLeft");
    await expect.poll(() => document.activeElement).toBe(tab(el, "people"));
    key(tab(el, "people"), "Home");
    await expect.poll(() => document.activeElement).toBe(tab(el, "overview"));
    key(tab(el, "overview"), "End");
    await expect.poll(() => document.activeElement).toBe(tab(el, "people"));
    key(tab(el, "people"), "Enter");
    await settle();
    expect(el.selected).toBe("people");
    expect(tab(el, "people").getAttribute("aria-selected")).toBe("true");
    tab(el, "docs").click();
    await settle();
    expect(el.selected).toBe("docs");
    key(tab(el, "overview"), " ");
    await settle();
    expect(el.selected).toBe("overview");
    expect(seen).toEqual(["people", "docs", "overview"]);
  });

  test("controlled: preventDefault() keeps the tab; a selected tab that goes away falls back to the first", async () => {
    const el = await make();
    el.selected = "docs";
    await settle();
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    tab(el, "people").click();
    await settle();
    expect(el.selected).toBe("docs");
    expect(tab(el, "docs").getAttribute("aria-selected")).toBe("true");
    el.tabs = [TABS[0], TABS[2]];
    await settle();
    expect(tab(el, "overview").getAttribute("aria-selected")).toBe("true");
    el.tabs = [];
    await settle();
    expect(el.querySelector('[role="tablist"]')).toBeNull();
  });

  test("narrow: the actions drop under the name", async () => {
    const wide = await fixture<HTMLElement>(html`<div style="width: 760px"><tc-profile-header name="Dana Whitfield" .actions=${ACTIONS}></tc-profile-header></div>`);
    const narrow = await fixture<HTMLElement>(html`<div style="width: 360px"><tc-profile-header name="Dana Whitfield" .actions=${ACTIONS}></tc-profile-header></div>`);
    const below = (root: HTMLElement) => root.querySelector(".ui-phd__actions")!.getBoundingClientRect().top >= root.querySelector(".ui-phd__who")!.getBoundingClientRect().bottom - 1;
    expect(below(wide)).toBe(false);
    expect(below(narrow)).toBe(true);
  });

  test("an element with only a name renders without errors", async () => {
    const el = await fixture<TcProfileHeader>(html`<tc-profile-header name="Priya"></tc-profile-header>`);
    expect(el.querySelector(".ui-phd__avatar")!.textContent).toBe("P");
    expect(el.querySelector(".ui-phd__actions, .ui-phd__aliases, .ui-phd__meta, .ui-phd__pills")).toBeNull();
  });

  test("React wrapper: an uncontrolled tab survives parent re-renders; onAction gets the id", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(ProfileHeader, {
        name: "Dana Whitfield",
        actions: ACTIONS,
        tabs: TABS,
        defaultSelected: "docs",
        onSelectedChange: (s) => void seen.push(s),
        onAction: (id) => void seen.push(`action:${id}`),
        "data-n": n,
      } as React.ComponentProps<typeof ProfileHeader>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-profile-header")!;
    expect(tab(el, "docs").getAttribute("aria-selected")).toBe("true");
    tab(el, "people").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(tab(el, "people").getAttribute("aria-selected")).toBe("true");
    el.querySelector<HTMLButtonElement>('[data-action="report"]')!.click();
    expect(seen).toEqual(["people", "action:report"]);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled tab stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: string[] = [];
    await act(async () => root.render(React.createElement(ProfileHeader, { name: "Dana Whitfield", tabs: TABS, selected: "overview", onSelectedChange: (s) => void asked.push(s) })));
    await settle();
    const el = host.querySelector("tc-profile-header")!;
    tab(el, "docs").click();
    await settle();
    expect(asked).toEqual(["docs"]);
    expect(tab(el, "overview").getAttribute("aria-selected")).toBe("true");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-profile-header name="Dana Whitfield" more .status=${{ label: "Enhanced review", tone: "warning" }} .tags=${[{ label: "High priority", tone: "danger" }, { label: "Verified", tone: "success" }, { label: "New", tone: "info" }]} .aliases=${["D. Ross"]} .meta=${["Retail customer", { label: "Case KYC-2291", tone: "danger" }]} .actions=${ACTIONS} .tabs=${TABS}></tc-profile-header>
        <tc-profile-header look="clean" kind="account" name="Larkspur Trading Ltd" .status=${{ label: "Active", tone: "success" }} .meta=${["Wholesale"]} .actions=${ACTIONS} .tabs=${TABS} selected="docs"></tc-profile-header>
        <div id="panel-overview" role="tabpanel" aria-label="Overview" style="color: var(--tc-text-primary)">The overview section</div>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
