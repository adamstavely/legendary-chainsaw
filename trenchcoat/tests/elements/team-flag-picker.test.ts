/*
 * <tc-team-flag-picker> in real browsers: picking on a file by mouse and keyboard, a flag that's gone, a team with no
 * flags, controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/team-flag-picker";
import type { TcTeamFlagPicker, TeamFlag, TeamFlagValueChange } from "../../src/elements/team-flag-picker";
import { TeamFlagPicker } from "../../src/elements/react/team-flag-picker";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const FLAGS: TeamFlag[] = [
  { id: "review", label: "Needs review", meaning: "Read this twice.", color: "#CA8A04" },
  { id: "hold", label: "Legal hold", meaning: "Don't change it.", color: "#DC2626" },
];
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const button = (root: Element, name: string) => [...root.querySelectorAll("button")].find((b) => text(b).startsWith(name))!;
const picker = (value: string | null = "review") => fixture<TcTeamFlagPicker>(html`<tc-team-flag-picker .flags=${FLAGS} .value=${value} file-name="Q3.pdf"></tc-team-flag-picker>`);
const openPicker = async (el: TcTeamFlagPicker) => {
  el.querySelector<HTMLElement>(".ui-tfp__trigger")!.click();
  await settle();
  await expect.poll(() => el.querySelector(".ui-tfp__pop")).toBeTruthy();
};

describe("tc-team-flag-picker", () => {
  test("the button shows the flag and names the file", async () => {
    const el = await picker();
    expect(el.dataset.ui).toBe("tfp");
    const trigger = el.querySelector(".ui-tfp__trigger")!;
    expect(text(trigger)).toContain("Needs review");
    expect(text(trigger)).toContain("Q3.pdf");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  test("offers No flag and each flag with its meaning, on the current one", async () => {
    const el = await picker();
    await openPicker(el);
    const options = [...el.querySelectorAll<HTMLElement>('[role="option"]')];
    expect(options.map((o) => text(o.querySelector(".ui-tfp__name")))).toEqual(["No flag", "Needs review", "Legal hold"]);
    expect(text(options[2]!.querySelector(".ui-tfp__meaning"))).toBe("Don't change it.");
    expect(options[1]!.getAttribute("aria-selected")).toBe("true");
    await expect.poll(() => document.activeElement).toBe(options[1]);
  });

  test("clicking picks, tells the page and closes", async () => {
    const el = await picker();
    const events: TeamFlagValueChange[] = [];
    el.addEventListener("tc-value-change", (e) => events.push((e as CustomEvent<TeamFlagValueChange>).detail));
    await openPicker(el);
    el.querySelectorAll<HTMLElement>('[role="option"]')[2]!.click();
    await settle();
    expect(el.value).toBe("hold");
    expect(events).toEqual([{ value: "hold", flag: FLAGS[1] }]);
    expect(el.querySelector(".ui-tfp__pop")).toBeNull();
    expect(text(el.querySelector('[role="status"]'))).toContain("Legal hold");
  });

  test("the keyboard moves and picks, and No flag clears", async () => {
    const el = await picker();
    await openPicker(el);
    const list = el.querySelector('[role="listbox"]')!;
    key(list, "Home");
    await settle();
    await expect.poll(() => document.activeElement).toBe(el.querySelectorAll('[role="option"]')[0]);
    key(list, "Enter");
    await settle();
    expect(el.value).toBeNull();
    expect(text(el.querySelector(".ui-tfp__trigger"))).toContain("Add flag");
  });

  test("Escape closes and returns to the button", async () => {
    const el = await picker();
    await openPicker(el);
    await expect.poll(() => el.contains(document.activeElement) && document.activeElement !== el.querySelector(".ui-tfp__trigger")).toBe(true);
    document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
    await settle();
    expect(el.querySelector(".ui-tfp__pop")).toBeNull();
    await expect.poll(() => document.activeElement).toBe(el.querySelector(".ui-tfp__trigger"));
  });

  test("preventDefault keeps the value", async () => {
    const el = await picker();
    el.addEventListener("tc-value-change", (e) => e.preventDefault());
    await openPicker(el);
    el.querySelectorAll<HTMLElement>('[role="option"]')[2]!.click();
    await settle();
    expect(el.value).toBe("review");
  });

  test("a flag that's gone says so and keeps its value", async () => {
    const el = await picker("draft");
    expect(text(el.querySelector(".ui-tfp__trigger"))).toContain("Removed flag");
    expect(el.value).toBe("draft");
    await openPicker(el);
    expect(el.querySelectorAll('[aria-selected="true"]')).toHaveLength(0);
  });

  test("a team without flags is told so, and manage reaches the page", async () => {
    const el = await fixture<TcTeamFlagPicker>(html`<tc-team-flag-picker manageable></tc-team-flag-picker>`);
    let managed = 0;
    el.addEventListener("tc-manage", () => managed++);
    await openPicker(el);
    expect(text(el.querySelector(".ui-tfp__empty"))).toContain("hasn't set up");
    button(el, "Manage team flags").click();
    await settle();
    expect(managed).toBe(1);
  });

  test("disabled doesn't open", async () => {
    const el = await fixture<TcTeamFlagPicker>(html`<tc-team-flag-picker disabled .flags=${FLAGS} value="review"></tc-team-flag-picker>`);
    el.querySelector<HTMLElement>(".ui-tfp__trigger")!.click();
    await settle();
    expect(el.querySelector(".ui-tfp__pop")).toBeNull();
  });
});

describe("React", () => {
  const mount = async (node: React.ReactElement) => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    await act(async () => root.render(node));
    await settle();
    return { host, root };
  };

  test("an uncontrolled pick survives the parent re-rendering", async () => {
    const node = () => React.createElement(TeamFlagPicker, { flags: FLAGS, defaultValue: "review" });
    const { host, root } = await mount(node());
    const el = host.querySelector<TcTeamFlagPicker>("tc-team-flag-picker")!;
    await openPicker(el);
    await act(async () => el.querySelectorAll<HTMLElement>('[role="option"]')[2]!.click());
    await act(async () => root.render(node()));
    await settle();
    expect(el.value).toBe("hold");
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}`}><tc-team-flag-picker .flags=${FLAGS} value="review" file-name="Q3.pdf"></tc-team-flag-picker></div>`);
        await openPicker(wrap.querySelector<TcTeamFlagPicker>("tc-team-flag-picker")!);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
