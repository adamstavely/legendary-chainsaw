/*
 * <tc-role-editor> in real browsers: the grid of permissions against roles, dependent permissions, the locked Owner,
 * custom roles (add, rename, delete), the summary with Discard and Save, controlled use, the React wrapper and axe in
 * both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/role-editor";
import type { Role, RolesChange, RolesSave, TcRoleEditor } from "../../src/elements/role-editor";
import { RoleEditor } from "../../src/elements/react/role-editor";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const ROLES: Role[] = [
  { id: "owner", name: "Owner", members: 1, locked: true, permissions: ["agents.view", "agents.edit", "agents.deploy", "data.view"] },
  { id: "builder", name: "Builder", members: 6, permissions: ["agents.view", "agents.edit"] },
  { id: "member", name: "Member", members: 1, permissions: ["agents.view"] },
  { id: "auditors", name: "Auditors", members: 2, custom: true, permissions: ["data.view", "admin.audit"] },
];
// Rows: 0 agents.view, 1 agents.edit, 2 agents.deploy, 3 data.view, 4 data.export, 5 billing.view, 6 billing.manage, 7 admin.members, 8 admin.roles, 9 admin.audit
const cell = (el: Element, r: number, c: number) => el.querySelector<HTMLElement>(`[data-cell="${r}:${c}"]`)!;
const on = (el: Element, r: number, c: number) => cell(el, r, c).hasAttribute("data-on");
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const btn = (el: Element, text: string) => [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent!.trim().startsWith(text))!;
const make = (look: "standard" | "clean" = "standard", roles: Role[] = ROLES) => fixture<TcRoleEditor>(html`<tc-role-editor look=${look} description="What each role can do." .roles=${roles}></tc-role-editor>`);

describe("tc-role-editor", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: a grid of permissions by role, grouped, with member counts, the locked Owner and one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("rle");
      expect(el.dataset.look).toBe(look);
      const grid = el.querySelector('[role="grid"]')!;
      expect(document.getElementById(grid.getAttribute("aria-labelledby")!)!.textContent).toBe("Roles");
      const heads = [...grid.querySelectorAll(".ui-rle__role")];
      expect(heads.map((h) => h.querySelector(".ui-rle__role-name")!.textContent!.trim())).toEqual(["Locked: Owner", "Builder", "Member", "Auditors"]);
      expect(heads.map((h) => h.querySelector(".ui-rle__members")!.textContent)).toEqual(["1 member", "6 members", "1 member", "2 members"]);
      expect([...grid.querySelectorAll(".ui-rle__group")].map((g) => g.textContent!.trim())).toEqual(["Agents", "Data", "Billing", "Admin"]);
      expect(grid.querySelectorAll('[role="gridcell"]')).toHaveLength(40);
      expect(grid.querySelectorAll('[role="gridcell"][tabindex="0"]')).toHaveLength(1);
      expect(grid.getAttribute("aria-rowcount")).toBe("15");
      expect([...grid.querySelectorAll('[role="row"]')].map((r) => r.getAttribute("aria-rowindex"))).toEqual(Array.from({ length: 15 }, (_, i) => String(i + 1)));
      expect(cell(el, 0, 0).getAttribute("aria-readonly")).toBe("true");
      expect(cell(el, 0, 1).querySelector(".ui-rle__sr")!.textContent).toBe("Allowed");
      expect(cell(el, 2, 1).querySelector(".ui-rle__sr")!.textContent).toBe("Not allowed");
      expect(cell(el, 2, 1).closest("tr")!.querySelector('[role="rowheader"]')!.textContent).toContain("Agents · Deploy agents");
      // Only custom roles can be renamed and deleted
      expect(el.querySelectorAll("[data-rename]")).toHaveLength(1);
      expect(el.querySelector("[data-rename]")!.textContent).toBe("Rename Auditors");
      expect(el.querySelector(".ui-rle__label")!.textContent).toBe("No unsaved changes");
    });
  }

  test("turning a permission on turns on what it needs, with a note; turning one off turns off what needs it", async () => {
    const el = await make();
    const seen: RolesChange[] = [];
    el.addEventListener("tc-roles-change", (e) => seen.push((e as CustomEvent<RolesChange>).detail));
    // Member: Deploy agents
    cell(el, 2, 2).click();
    await settle();
    expect(on(el, 2, 2) && on(el, 1, 2) && on(el, 0, 2)).toBe(true);
    expect(seen[0].change).toEqual({ type: "permission", role: "member", permission: "agents.deploy", on: true, also: ["agents.edit"] });
    expect(el.querySelector(".ui-rle__note")!.textContent).toBe("Deploy agents needs Edit agents, so it was turned on too.");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Member: Deploy agents on. Deploy agents needs Edit agents, so it was turned on too.");
    // Builder: View agents off – Edit goes with it
    cell(el, 0, 1).click();
    await settle();
    expect(on(el, 0, 1) || on(el, 1, 1)).toBe(false);
    expect(el.querySelector(".ui-rle__note")!.textContent).toBe("Edit agents needs View agents, so it was turned off too.");
    expect(cell(el, 0, 1).querySelector(".ui-rle__sr")!.textContent).toBe("Not allowed, changed");
    expect(cell(el, 0, 1).hasAttribute("data-changed")).toBe(true);
  });

  test("Owner can't be changed", async () => {
    const el = await make();
    cell(el, 3, 0).click();
    await settle();
    expect(on(el, 3, 0)).toBe(true);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Owner can't be changed");
  });

  test("keyboard: arrows move, Home / End go to the row's ends, Space toggles", async () => {
    const el = await make();
    cell(el, 0, 0).focus();
    key(cell(el, 0, 0), "ArrowRight");
    await settle();
    expect(document.activeElement).toBe(cell(el, 0, 1));
    key(cell(el, 0, 1), "ArrowDown");
    await settle();
    expect(document.activeElement).toBe(cell(el, 1, 1));
    key(cell(el, 1, 1), "End");
    await settle();
    expect(document.activeElement).toBe(cell(el, 1, 3));
    key(cell(el, 1, 3), " ");
    await settle();
    // Auditors: Edit agents, and View agents with it
    expect(on(el, 1, 3) && on(el, 0, 3)).toBe(true);
    expect(el.querySelectorAll('[role="gridcell"][tabindex="0"]')).toHaveLength(1);
    expect(cell(el, 1, 3).tabIndex).toBe(0);
  });

  test("New role adds a custom role and renames it; Escape keeps the name, a taken name is refused", async () => {
    const el = await make();
    btn(el, "New role").click();
    await settle();
    expect(el.roles.at(-1)).toMatchObject({ name: "New role", custom: true, permissions: [] });
    const field = el.querySelector<HTMLInputElement>(".ui-rle__rename")!;
    await expect.poll(() => document.activeElement).toBe(field);
    field.value = "Builder";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    key(field, "Enter");
    await settle();
    expect(el.querySelector(".ui-rle__error")!.textContent).toBe("There's already a role called Builder");
    expect(field.getAttribute("aria-invalid")).toBe("true");
    field.value = "Contractors";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    key(field, "Enter");
    await settle();
    expect(el.roles.at(-1)!.name).toBe("Contractors");
    expect(el.querySelector(".ui-rle__rename")).toBeNull();
    // Rename again, then Escape: the name stays
    el.querySelector<HTMLButtonElement>(`[data-rename="${el.roles.at(-1)!.id}"]`)!.click();
    await settle();
    const again = el.querySelector<HTMLInputElement>(".ui-rle__rename")!;
    again.value = "Temps";
    again.dispatchEvent(new Event("input", { bubbles: true }));
    key(again, "Escape");
    await settle();
    expect(el.roles.at(-1)!.name).toBe("Contractors");
    expect(document.activeElement).toBe(el.querySelector(`[data-rename="${el.roles.at(-1)!.id}"]`));
  });

  test("Delete asks first, saying who has the role; Cancel keeps it, Delete role removes it", async () => {
    const el = await make();
    el.querySelector<HTMLButtonElement>('[data-delete="auditors"]')!.click();
    await settle();
    expect(el.querySelector(".ui-rle__confirm-text")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Delete Auditors? 2 members have this role and will lose its permissions.");
    expect(document.activeElement).toBe(el.querySelector(".ui-rle__confirm-cancel"));
    key(document.activeElement!, "Escape");
    await settle();
    expect(el.querySelector(".ui-rle__confirm")).toBeNull();
    expect(document.activeElement).toBe(el.querySelector('[data-delete="auditors"]'));
    el.querySelector<HTMLButtonElement>('[data-delete="auditors"]')!.click();
    await settle();
    btn(el, "Delete role").click();
    await settle();
    expect(el.roles.map((r) => r.id)).toEqual(["owner", "builder", "member"]);
    expect([...el.querySelectorAll(".ui-rle__change")].map((c) => c.textContent!.replace(/\s+/g, " ").trim())).toEqual(["Auditors · deleted"]);
  });

  test("the summary lists changes; Discard puts them back; Save fires tc-roles-save and clears them", async () => {
    const el = await make();
    cell(el, 4, 2).click(); // Member: Export data (and View data)
    await settle();
    expect(el.querySelector(".ui-rle__label")!.textContent).toBe("Unsaved changes2");
    expect([...el.querySelectorAll(".ui-rle__change")].map((c) => c.textContent!.replace(/\s+/g, " ").trim())).toEqual(["Member · View data Allowed", "Member · Export data Allowed"]);
    btn(el, "Discard").click();
    await settle();
    expect(on(el, 4, 2)).toBe(false);
    expect(el.querySelector(".ui-rle__label")!.textContent).toBe("No unsaved changes");
    cell(el, 9, 1).click();
    await settle();
    const saves: RolesSave[] = [];
    el.addEventListener("tc-roles-save", (e) => saves.push((e as CustomEvent<RolesSave>).detail));
    btn(el, "Save").click();
    await settle();
    expect(saves[0].changes).toEqual([{ role: "builder", name: "Builder", kind: "granted", permission: "admin.audit" }]);
    expect(el.querySelector(".ui-rle__label")!.textContent).toBe("No unsaved changes");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Saved 1 change");
    expect(btn(el, "Save").getAttribute("aria-disabled")).toBe("true");
  });

  test("controlled: preventDefault() keeps the roles; a prevented save keeps the changes listed", async () => {
    const el = await make();
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener("tc-roles-change", stop);
    cell(el, 2, 1).click();
    await settle();
    expect(on(el, 2, 1)).toBe(false);
    el.removeEventListener("tc-roles-change", stop);
    cell(el, 2, 1).click();
    await settle();
    el.addEventListener("tc-roles-save", (e) => e.preventDefault());
    btn(el, "Save").click();
    await settle();
    expect(el.querySelector(".ui-rle__label")!.textContent).toBe("Unsaved changes1");
  });

  test("empty, and a narrow container scrolls the roles sideways", async () => {
    const empty = await fixture<TcRoleEditor>(html`<tc-role-editor></tc-role-editor>`);
    expect(empty.querySelector(".ui-rle__empty")!.textContent).toBe("No roles yet.");
    const wrap = await fixture<HTMLElement>(html`<div style="width: 320px"><tc-role-editor .roles=${ROLES}></tc-role-editor></div>`);
    const el = wrap.querySelector("tc-role-editor")!;
    expect(el.getBoundingClientRect().width).toBeLessThanOrEqual(321);
    const scroll = el.querySelector<HTMLElement>(".ui-rle__scroll")!;
    expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth);
  });

  test("React wrapper: uncontrolled roles survive parent re-renders; a controlled set stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(RoleEditor, {
        title: "Who can do what",
        defaultRoles: ROLES,
        onRolesChange: (r, c) => void seen.push([c.type, r.find((x) => x.id === "member")!.permissions.length]),
        onRolesSave: (_r, c) => void seen.push(["save", c.length]),
        "data-n": n,
      } as React.ComponentProps<typeof RoleEditor>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-role-editor")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Who can do what");
    cell(el, 3, 2).click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(on(el, 3, 2)).toBe(true);
    btn(el, "Save").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.querySelector(".ui-rle__label")!.textContent).toBe("No unsaved changes");
    expect(seen).toEqual([
      ["permission", 2],
      ["save", 1],
    ]);
    await act(async () => root.unmount());

    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    const asked: Role[][] = [];
    await act(async () => root2.render(React.createElement(RoleEditor, { roles: ROLES, onRolesChange: (r) => void asked.push(r) })));
    await settle();
    const el2 = host2.querySelector("tc-role-editor")!;
    cell(el2, 3, 2).click();
    await settle();
    expect(asked).toHaveLength(1);
    expect(on(el2, 3, 2)).toBe(false);
    await act(async () => root2.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-role-editor description="What each role can do." .roles=${ROLES}></tc-role-editor>
        <tc-role-editor look="clean" .roles=${ROLES}></tc-role-editor>
      </div>`);
      const [a, b] = wrap.querySelectorAll<TcRoleEditor>("tc-role-editor");
      // One with a note and changes, one asking to delete
      cell(a, 2, 2).click();
      b.querySelector<HTMLButtonElement>('[data-delete="auditors"]')!.click();
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
