/*
 * <tc-team-flag-editor> in real browsers: setting a flag's colour, name, meaning and order, refusing bad names, asking
 * before removing a flag in use, controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/team-flag-editor";
import type { TcTeamFlagEditor, TeamFlag, TeamFlagsChange } from "../../src/elements/team-flag-editor";
import { TeamFlagEditor } from "../../src/elements/react/team-flag-editor";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const FLAGS: TeamFlag[] = [
  { id: "review", label: "Needs review", meaning: "Read this twice.", color: "#CA8A04" },
  { id: "hold", label: "Legal hold", meaning: "Don't change it.", color: "#DC2626" },
];
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const row = (el: Element, id: string) => el.querySelector(`[data-flag="${id}"]`)!;
const setField = async (input: HTMLInputElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  await settle();
};
const editor = (flags = FLAGS, usage = {}) => fixture<TcTeamFlagEditor>(html`<tc-team-flag-editor .flags=${flags} .usage=${usage}></tc-team-flag-editor>`);

describe("tc-team-flag-editor", () => {
  test("shows each flag's colour, name and meaning", async () => {
    const el = await editor();
    expect(el.dataset.ui).toBe("tfe");
    expect(row(el, "review").querySelector<HTMLInputElement>(".ui-tfe__name")!.value).toBe("Needs review");
    expect(row(el, "hold").querySelector<HTMLInputElement>(".ui-tfe__meaning")!.value).toBe("Don't change it.");
    expect(row(el, "review").querySelectorAll('[role="radio"][aria-checked="true"]')).toHaveLength(1);
  });

  test("a swatch sets the colour, with one tab stop and arrow keys", async () => {
    const el = await editor();
    const events: TeamFlagsChange[] = [];
    el.addEventListener("tc-flags-change", (e) => events.push((e as CustomEvent<TeamFlagsChange>).detail));
    const swatches = () => [...row(el, "review").querySelectorAll<HTMLElement>('[role="radio"]')];
    expect(swatches().filter((s) => s.tabIndex === 0)).toHaveLength(1);
    swatches()[0]!.click();
    await settle();
    expect(el.flags[0]!.color).toBe("#DC2626");
    expect(events[0]!.change).toBe("edit");
    key(swatches()[0]!, "ArrowRight");
    await settle();
    expect(el.flags[0]!.color).toBe("#EA580C");
  });

  test("a custom colour stays on offer as a swatch", async () => {
    const el = await editor();
    const input = row(el, "review").querySelector<HTMLInputElement>(".ui-tfe__custom-input")!;
    await setField(input, "#123456");
    expect(el.flags[0]!.color).toBe("#123456");
    expect(row(el, "review").querySelector<HTMLElement>('[role="radio"][aria-checked="true"]')!.getAttribute("aria-label")).toBe("#123456");
  });

  test("edits a meaning", async () => {
    const el = await editor();
    await setField(row(el, "hold").querySelector<HTMLInputElement>(".ui-tfe__meaning")!, "  Keep as it is. ");
    expect(el.flags[1]!.meaning).toBe("Keep as it is.");
  });

  test("refuses an empty or taken name, and says why", async () => {
    const el = await editor();
    const name = row(el, "hold").querySelector<HTMLInputElement>(".ui-tfe__name")!;
    await setField(name, "");
    expect(text(row(el, "hold").querySelector(".ui-tfe__error"))).toContain("needs a name");
    expect(name.getAttribute("aria-invalid")).toBe("true");
    await setField(name, "needs REVIEW");
    expect(text(row(el, "hold").querySelector(".ui-tfe__error"))).toContain("Needs review");
    expect(el.flags[1]!.label).toBe("Legal hold");
    await setField(name, "Hold");
    expect(row(el, "hold").querySelector(".ui-tfe__error")).toBeNull();
    expect(el.flags[1]!.label).toBe("Hold");
  });

  test("adds a flag once it has a name, with an unused colour", async () => {
    const el = await editor();
    const events: TeamFlagsChange[] = [];
    el.addEventListener("tc-flags-change", (e) => events.push((e as CustomEvent<TeamFlagsChange>).detail));
    el.querySelector<HTMLElement>(".ui-tfe__add")!.click();
    await settle();
    expect(el.flags).toHaveLength(2);
    expect(events).toHaveLength(0);
    const names = el.querySelectorAll<HTMLInputElement>(".ui-tfe__name");
    const input = names[names.length - 1]!;
    await expect.poll(() => document.activeElement).toBe(input);
    await setField(input, "Final");
    expect(el.flags).toHaveLength(3);
    expect(events[0]!.change).toBe("add");
    expect(el.flags[2]!.label).toBe("Final");
    expect(["#CA8A04", "#DC2626"]).not.toContain(el.flags[2]!.color);
    expect(new Set(el.flags.map((f) => f.id)).size).toBe(3);
  });

  test("a new flag can be abandoned without an event", async () => {
    const el = await editor();
    const events: unknown[] = [];
    el.addEventListener("tc-flags-change", (e) => events.push(e));
    el.querySelector<HTMLElement>(".ui-tfe__add")!.click();
    await settle();
    const removes = el.querySelectorAll<HTMLElement>(".ui-tfe__remove");
    removes[removes.length - 1]!.click();
    await settle();
    expect(el.querySelectorAll(".ui-tfe__row")).toHaveLength(2);
    expect(events).toHaveLength(0);
  });

  test("moves a flag, and keeps focus on a working button", async () => {
    const el = await editor();
    expect(row(el, "review").querySelector<HTMLButtonElement>('[data-move="up"]')!.disabled).toBe(true);
    const down = row(el, "review").querySelector<HTMLButtonElement>('[data-move="down"]')!;
    down.focus();
    down.click();
    await settle();
    expect(el.flags.map((f) => f.id)).toEqual(["hold", "review"]);
    await expect.poll(() => document.activeElement).toBe(row(el, "review").querySelector('[data-move="up"]'));
  });

  test("removes an unused flag at once", async () => {
    const el = await editor();
    row(el, "hold").querySelector<HTMLElement>(".ui-tfe__remove")!.click();
    await settle();
    expect(el.flags.map((f) => f.id)).toEqual(["review"]);
  });

  test("asks before removing a flag that's on files", async () => {
    const el = await editor(FLAGS, { hold: 3 });
    expect(text(row(el, "hold").querySelector(".ui-tfe__used"))).toBe("3 files");
    row(el, "hold").querySelector<HTMLElement>(".ui-tfe__remove")!.click();
    await settle();
    expect(el.flags).toHaveLength(2);
    expect(text(row(el, "hold").querySelector(".ui-tfe__confirm"))).toContain("3 files will lose this flag");
    await expect.poll(() => document.activeElement).toBe(row(el, "hold").querySelector(".ui-tfe__keep"));
    row(el, "hold").querySelector<HTMLElement>(".ui-tfe__keep")!.click();
    await settle();
    expect(row(el, "hold").querySelector(".ui-tfe__confirm")).toBeNull();
    row(el, "hold").querySelector<HTMLElement>(".ui-tfe__remove")!.click();
    await settle();
    row(el, "hold").querySelector<HTMLElement>(".ui-tfe__confirm-remove")!.click();
    await settle();
    expect(el.flags.map((f) => f.id)).toEqual(["review"]);
  });

  test("says when two flags share a colour", async () => {
    const el = await editor([FLAGS[0]!, { ...FLAGS[1]!, color: "#ca8a04" }]);
    expect(text(row(el, "hold").querySelector(".ui-tfe__hint"))).toContain("Needs review");
  });

  test("preventDefault keeps the flags, and puts the field back", async () => {
    const el = await editor();
    el.addEventListener("tc-flags-change", (e) => e.preventDefault());
    const meaning = row(el, "hold").querySelector<HTMLInputElement>(".ui-tfe__meaning")!;
    await setField(meaning, "Changed");
    expect(el.flags[1]!.meaning).toBe("Don't change it.");
    expect(meaning.value).toBe("Don't change it.");
  });

  test("readonly shows the flags with no controls", async () => {
    const el = await fixture<TcTeamFlagEditor>(html`<tc-team-flag-editor readonly .flags=${FLAGS}></tc-team-flag-editor>`);
    expect(text(el)).toContain("Read this twice.");
    expect(el.querySelectorAll("input, button")).toHaveLength(0);
  });

  test("says so when there are no flags", async () => {
    const el = await editor([]);
    expect(text(el.querySelector(".ui-tfe__empty"))).toContain("No flags yet");
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

  test("a controlled editor stays until the parent changes it", async () => {
    const seen: TeamFlag[][] = [];
    const { host, root } = await mount(React.createElement(TeamFlagEditor, { flags: FLAGS, onFlagsChange: (f: TeamFlag[]) => seen.push(f) }));
    const el = host.querySelector<TcTeamFlagEditor>("tc-team-flag-editor")!;
    await act(async () => row(el, "hold").querySelector<HTMLElement>(".ui-tfe__remove")!.click());
    await settle();
    expect(seen[0]!.map((f) => f.id)).toEqual(["review"]);
    expect(el.flags).toHaveLength(2);
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}`}><tc-team-flag-editor .flags=${FLAGS} .usage=${{ hold: 3 }}></tc-team-flag-editor></div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
