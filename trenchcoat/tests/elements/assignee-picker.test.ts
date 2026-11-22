/*
 * <tc-assignee-picker> in real browsers: the chip and its name, opening the search, the groups and their order (Assign
 * to me, People with over-capacity last, Teams with round-robin, Unassign), load, Away and Over capacity in words,
 * the keyboard (↑ ↓ Enter Escape, typing to filter), picking and announcing, cancelable changes, disabled, the React
 * wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/assignee-picker";
import { assigneeInitials, type AssigneePerson, type AssigneeTeam, type AssigneeValue, type TcAssigneePicker } from "../../src/elements/assignee-picker";
import { AssigneePicker } from "../../src/elements/react/assignee-picker";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const PEOPLE: AssigneePerson[] = [
  { id: "noor", name: "Noor Haddad", team: "Fraud review", open: 7, capacity: 12 },
  { id: "priya", name: "Priya Raman", team: "Disputes", open: 14, capacity: 10 },
  { id: "tomas", name: "Tomas Lind", team: "Fraud review", open: 11, capacity: 12 },
  { id: "ade", name: "Ade Okafor", team: "Disputes", open: 3, capacity: 10, away: true },
];
const TEAMS: AssigneeTeam[] = [
  { id: "fraud", name: "Fraud review", members: 3, open: 23, roundRobin: true },
  { id: "disputes", name: "Disputes", members: 2, open: 17 },
];
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const chip = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-asg__trigger")!;
const input = (el: Element) => el.querySelector<HTMLInputElement>(".ui-asg__search-input")!;
const options = (el: Element) => [...el.querySelectorAll<HTMLElement>('[role="option"]')];
const names = (el: Element) => options(el).map((o) => text(o.querySelector(".ui-asg__name")));
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (value: AssigneeValue | null = { type: "person", id: "tomas" }, look = "standard") =>
  fixture<TcAssigneePicker>(html`<tc-assignee-picker look=${look} me="noor" .people=${PEOPLE} .teams=${TEAMS} .value=${value}></tc-assignee-picker>`);
const open = async (el: TcAssigneePicker) => {
  chip(el).click();
  await settle();
  await expect.poll(() => document.activeElement === input(el)).toBe(true);
};
const active = (el: Element) => {
  const id = input(el).getAttribute("aria-activedescendant");
  return id ? text(el.querySelector(`#${CSS.escape(id)} .ui-asg__name`)) : null;
};

describe("tc-assignee-picker", () => {
  for (const look of ["standard", "clean"]) {
    test(`renders in ${look}: a chip named by the label and the assignee`, async () => {
      const el = await make(undefined, look);
      expect(el.dataset.ui).toBe("asg");
      expect(el.dataset.look).toBe(look);
      expect(text(chip(el))).toBe("TL Assignee: Tomas Lind");
      expect(chip(el).getAttribute("aria-haspopup")).toBe("dialog");
      expect(chip(el).getAttribute("aria-expanded")).toBe("false");
      expect(el.querySelector(".ui-asg__avatar")!.getAttribute("aria-hidden")).toBe("true");
      expect(el.querySelectorAll("button")).toHaveLength(1);
    });
  }

  test("initials; a team, a round-robin and nobody read in the chip; the label is renameable", async () => {
    expect(assigneeInitials("Noor Haddad")).toBe("NH");
    expect(assigneeInitials("Mei")).toBe("M");
    expect(assigneeInitials(" ade  van okafor ")).toBe("AO");
    const el = await make({ type: "team", id: "disputes" });
    expect(text(el.querySelector(".ui-asg__current"))).toBe("Disputes");
    expect(el.querySelector(".ui-asg__trigger .ui-asg__avatar[data-team]")).not.toBeNull();
    el.value = { type: "round-robin", id: "fraud" };
    await settle();
    expect(text(el.querySelector(".ui-asg__current"))).toBe("Round-robin · Fraud review");
    el.value = null;
    el.label = "Owner";
    await settle();
    expect(text(chip(el))).toBe("Owner: Unassigned");
    expect(chip(el).hasAttribute("data-empty")).toBe(true);
  });

  test("the list: Assign to me first, people with over-capacity last, teams with round-robin, Unassign last", async () => {
    const el = await make();
    await open(el);
    expect(chip(el).getAttribute("aria-expanded")).toBe("true");
    const box = el.querySelector('[role="listbox"]')!;
    expect(input(el).getAttribute("role")).toBe("combobox");
    expect(input(el).getAttribute("aria-controls")).toBe(box.id);
    expect(names(el)).toEqual(["Assign to me", "Noor Haddad", "Tomas Lind", "Ade Okafor", "Priya Raman", "Fraud review", "Round-robin", "Disputes", "Unassign"]);
    expect([...el.querySelectorAll(".ui-asg__group-title")].map((g) => text(g))).toEqual(["People", "Teams"]);
    const byName = (n: string, i = 0) => options(el).filter((o) => text(o.querySelector(".ui-asg__name")) === n)[i];
    expect(text(byName("Assign to me").querySelector(".ui-asg__meta"))).toBe("Noor Haddad · 7 open");
    expect(text(byName("Priya Raman"))).toContain("Over capacity");
    expect(text(byName("Ade Okafor"))).toContain("Away");
    expect(text(byName("Round-robin").querySelector(".ui-asg__meta"))).toBe("next in Fraud review");
    expect(text(byName("Disputes").querySelector(".ui-asg__meta"))).toBe("2 people · 17 open");
    // The load bar: open against capacity
    expect((byName("Noor Haddad", 0).querySelector(".ui-asg__load > span") as HTMLElement).style.inlineSize).toBe("58%");
    expect(byName("Priya Raman").querySelector(".ui-asg__load")!.hasAttribute("data-over")).toBe(true);
    // The current assignee is the selected and highlighted option
    expect(byName("Tomas Lind").getAttribute("aria-selected")).toBe("true");
    expect(active(el)).toBe("Tomas Lind");
  });

  test("↑ ↓ move the highlight, Enter assigns, the chip and an announcement follow, focus returns", async () => {
    const el = await make();
    const changes: (AssigneeValue | null)[] = [];
    el.addEventListener("tc-value-change", (e) => changes.push((e as CustomEvent<{ value: AssigneeValue | null }>).detail.value));
    await open(el);
    key(input(el), "ArrowDown");
    await settle();
    expect(active(el)).toBe("Ade Okafor");
    key(input(el), "PageUp");
    await settle();
    expect(active(el)).toBe("Assign to me");
    key(input(el), "ArrowUp");
    await settle();
    expect(active(el)).toBe("Unassign");
    key(input(el), "ArrowDown");
    await settle();
    key(input(el), "Enter");
    await settle();
    expect(changes).toEqual([{ type: "person", id: "noor" }]);
    expect(el.value).toEqual({ type: "person", id: "noor" });
    expect(el.querySelector(".ui-asg__pop")).toBeNull();
    expect(text(el.querySelector('[role="status"]'))).toBe("Assigned to Noor Haddad");
    await expect.poll(() => document.activeElement === chip(el)).toBe(true);
    // Assigned to me already: Assign to me goes away
    await open(el);
    expect(names(el)[0]).toBe("Noor Haddad");
  });

  test("typing filters by name or team; nothing matching says so; a click picks a team's round-robin", async () => {
    const el = await make(null);
    await open(el);
    expect(names(el)).not.toContain("Unassign");
    input(el).value = "disp";
    input(el).dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    // Priya is over capacity, so she comes after Ade
    expect(names(el)).toEqual(["Ade Okafor", "Priya Raman", "Disputes"]);
    expect(active(el)).toBe("Ade Okafor");
    input(el).value = "zzz";
    input(el).dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    expect(options(el)).toHaveLength(0);
    expect(text(el.querySelector(".ui-asg__empty"))).toBe("No one matches");
    expect(input(el).hasAttribute("aria-activedescendant")).toBe(false);
    input(el).value = "fraud";
    input(el).dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    options(el)
      .find((o) => o.hasAttribute("data-rr"))!
      .click();
    await settle();
    expect(el.value).toEqual({ type: "round-robin", id: "fraud" });
    expect(text(el.querySelector('[role="status"]'))).toBe("Assigned to Round-robin, Fraud review");
  });

  test("Unassign clears it; a prevented change keeps the assignee; Escape and a click outside close", async () => {
    const el = await make();
    await open(el);
    options(el)
      .find((o) => o.dataset.group === "clear")!
      .click();
    await settle();
    expect(el.value).toBeNull();
    expect(text(el.querySelector('[role="status"]'))).toBe("Unassigned");
    el.value = { type: "person", id: "tomas" };
    el.addEventListener("tc-value-change", (e) => e.preventDefault());
    await open(el);
    options(el)[1].click();
    await settle();
    expect(el.value).toEqual({ type: "person", id: "tomas" });
    expect(el.querySelector(".ui-asg__pop")).not.toBeNull();
    key(input(el), "Escape");
    await settle();
    expect(el.querySelector(".ui-asg__pop")).toBeNull();
    await expect.poll(() => document.activeElement === chip(el)).toBe(true);
    await open(el);
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await settle();
    expect(el.querySelector(".ui-asg__pop")).toBeNull();
  });

  test("disabled: the chip can't open", async () => {
    const el = await make();
    el.disabled = true;
    await settle();
    expect(chip(el).disabled).toBe(true);
    chip(el).click();
    await settle();
    expect(el.querySelector(".ui-asg__pop")).toBeNull();
    expect(el.querySelector(".ui-asg__chevron")).toBeNull();
  });
});

describe("React", () => {
  test("uncontrolled value survives re-renders; a controlled one stays until the parent changes it", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    let asked: AssigneeValue | null | undefined;
    const node = (extra = {}) => React.createElement(AssigneePicker, { people: PEOPLE, teams: TEAMS, me: "noor", ...extra });
    await act(async () => root.render(node()));
    await settle();
    const el = host.querySelector<TcAssigneePicker>("tc-assignee-picker")!;
    expect(el.value).toBeNull();
    await act(async () => chip(el).click());
    await settle();
    await act(async () => options(el)[0].click());
    await act(async () => root.render(node()));
    await settle();
    expect(el.value).toEqual({ type: "person", id: "noor" });
    await act(async () => root.render(node({ value: { type: "team", id: "disputes" }, onValueChange: (v: AssigneeValue | null) => (asked = v) })));
    await settle();
    await act(async () => chip(el).click());
    await settle();
    await act(async () => options(el)[0].click());
    await settle();
    expect(asked).toEqual({ type: "person", id: "noor" });
    expect(el.value).toEqual({ type: "team", id: "disputes" });
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}, closed and open`, async () => {
        const wrap = await fixture<HTMLElement>(
          html`<div data-look=${look} style=${`height: 520px; color-scheme: ${scheme}; background: Canvas; color: CanvasText`}>
            <tc-assignee-picker look=${look} me="noor" .people=${PEOPLE} .teams=${TEAMS} .value=${{ type: "person", id: "tomas" }}></tc-assignee-picker>
            <tc-assignee-picker look=${look} .people=${PEOPLE} .teams=${TEAMS}></tc-assignee-picker>
          </div>`,
        );
        const el = wrap.querySelector<TcAssigneePicker>("tc-assignee-picker")!;
        await finish(wrap);
        let { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
        await open(el);
        await finish(wrap);
        ({ violations } = await axe.run(wrap));
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
