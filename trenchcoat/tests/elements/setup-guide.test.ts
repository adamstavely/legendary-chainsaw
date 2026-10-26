/*
 * <tc-setup-guide> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/setup-guide";
import type { SetupGroup, TcSetupGuide } from "../../src/elements/setup-guide";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

const groups: SetupGroup[] = [
  { id: "basics one", title: "Basics", tasks: [{ id: "a", label: "First", done: true }, { id: "b", label: "Second" }] },
  { id: "launch", title: "Launch", tasks: [{ id: "c", label: "Third" }] },
];

const checkbox = (el: Element, name: string) => [...el.querySelectorAll<HTMLButtonElement>('[role="checkbox"]')].find((b) => b.querySelector(".ui-sg__task-label")!.textContent === name)!;
const groupHead = (el: Element, title: string) => [...el.querySelectorAll<HTMLButtonElement>(".ui-sg__group-head")].find((b) => b.querySelector(".ui-sg__group-title")!.textContent!.startsWith(title))!;
const isChecked = (el: Element, name: string) => checkbox(el, name).getAttribute("aria-checked") === "true";
const openTitle = (el: Element) => el.querySelector(".ui-sg__group[data-open] .ui-sg__group-title")?.textContent ?? null;

describe("tc-setup-guide", () => {
  test("the host is the root and the region, named by the heading", async () => {
    const el = await fixture<TcSetupGuide>(html`<tc-setup-guide .groups=${groups}></tc-setup-guide>`);
    expect(el.dataset.ui).toBe("sg");
    expect(el.dataset.look).toBe("standard");
    expect(el.getAttribute("role")).toBe("region");
    expect(el.getAttribute("aria-label")).toBe("Setup guide");
    el.heading = "Get going";
    await settle();
    expect(el.getAttribute("aria-label")).toBe("Get going");
    expect(el.querySelector('[role="progressbar"]')!.getAttribute("aria-label")).toBe("Get going progress");
    expect(el.querySelector('[role="progressbar"]')!.getAttribute("aria-valuenow")).toBe("33");
  });

  test("a name the page gives stays", async () => {
    const el = await fixture<TcSetupGuide>(html`<tc-setup-guide aria-label="Onboarding" .groups=${groups}></tc-setup-guide>`);
    expect(el.getAttribute("aria-label")).toBe("Onboarding");
  });

  for (const look of ["standard", "clean"] as const) {
    describe(look, () => {
      test("controlled done: a tick fires tc-done-change and, prevented, isn't applied", async () => {
        const seen: string[][] = [];
        const el = await fixture<TcSetupGuide>(html`<tc-setup-guide look=${look} .groups=${groups} .done=${["a"]} @tc-done-change=${(e: CustomEvent<{ done: string[] }>) => {
          e.preventDefault();
          seen.push(e.detail.done);
        }}></tc-setup-guide>`);
        checkbox(el, "Second").click();
        await settle();
        expect(seen).toEqual([["a", "b"]]);
        expect(isChecked(el, "Second")).toBe(false);
        el.done = ["a", "b"];
        await settle();
        expect(isChecked(el, "Second")).toBe(true);
      });

      test("uncontrolled: a tick applies; changed task flags and added groups are followed", async () => {
        const el = await fixture<TcSetupGuide>(html`<tc-setup-guide look=${look} .groups=${groups}></tc-setup-guide>`);
        expect(isChecked(el, "First")).toBe(true);
        checkbox(el, "Second").click();
        await settle();
        expect(isChecked(el, "Second")).toBe(true);
        el.groups = [{ ...groups[0], tasks: [{ id: "a", label: "First" }, groups[0].tasks[1]] }, groups[1], { id: "x", title: "Extra", tasks: [{ id: "d", label: "Fourth" }] }];
        await settle();
        expect(isChecked(el, "First")).toBe(false);
        expect(isChecked(el, "Second")).toBe(false);
        expect(groupHead(el, "Extra")).toBeTruthy();
      });

      test("open group and minimized: controlled through their change events", async () => {
        const el = await fixture<TcSetupGuide>(html`<tc-setup-guide look=${look} .groups=${groups}></tc-setup-guide>`);
        expect(openTitle(el)).toBe("Basics");
        el.openGroup = "launch";
        await settle();
        expect(openTitle(el)).toBe("Launch");
        el.addEventListener("tc-open-group-change", (e) => e.preventDefault(), { once: true });
        groupHead(el, "Basics").click();
        await settle();
        expect(openTitle(el)).toBe("Launch");
        groupHead(el, "Launch").click();
        await settle();
        expect(openTitle(el)).toBe(null);
        const body = el.querySelector(".ui-sg__body")!;
        el.addEventListener("tc-minimized-change", (e) => e.preventDefault(), { once: true });
        el.querySelector<HTMLButtonElement>(".ui-sg__icon-btn")!.click();
        await settle();
        expect(body.hasAttribute("data-hidden")).toBe(false);
        el.minimized = true;
        await settle();
        expect(body.hasAttribute("data-hidden")).toBe(true);
      });

      test("panel ids are the element's own, not built from group ids", async () => {
        const el = await fixture<TcSetupGuide>(html`<tc-setup-guide look=${look} .groups=${groups}></tc-setup-guide>`);
        const ids = [...el.querySelectorAll(".ui-sg__panel")].map((p) => p.id);
        expect(ids.every((id) => id && !id.includes("basics") && !id.includes("launch"))).toBe(true);
        expect(new Set(ids).size).toBe(2);
        const head = groupHead(el, "Basics");
        expect(el.querySelector(`[id="${head.getAttribute("aria-controls")}"]`)).toBeTruthy();
      });

      test("finishing a group folds it and fires the newly open group; removing the element cancels the timer", async () => {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
        const seen: (string | null)[] = [];
        const el = await fixture<TcSetupGuide>(html`<tc-setup-guide look=${look} .groups=${groups} @tc-open-group-change=${(e: CustomEvent<{ openGroup: string | null }>) => seen.push(e.detail.openGroup)}></tc-setup-guide>`);
        checkbox(el, "Second").click();
        await el.updateComplete;
        vi.advanceTimersByTime(500);
        await el.updateComplete;
        expect(seen).toEqual(["launch"]);
        expect(groupHead(el, "Launch").getAttribute("aria-expanded")).toBe("true");
        checkbox(el, "Third").click();
        await el.updateComplete;
        expect(vi.getTimerCount()).toBe(1);
        el.remove();
        expect(vi.getTimerCount()).toBe(0);
      });

      test("edit and close show when asked for and fire tc-edit / tc-close", async () => {
        const fired: string[] = [];
        const plain = await fixture<TcSetupGuide>(html`<tc-setup-guide look=${look} .groups=${groups}></tc-setup-guide>`);
        expect(plain.querySelector(".ui-sg__edit")).toBe(null);
        expect(plain.querySelector('[aria-label="Close setup guide"]')).toBe(null);
        const el = await fixture<TcSetupGuide>(html`<tc-setup-guide look=${look} editable closable .groups=${groups} @tc-edit=${() => fired.push("edit")} @tc-close=${() => fired.push("close")}></tc-setup-guide>`);
        el.querySelector<HTMLButtonElement>(".ui-sg__edit")!.click();
        el.querySelector<HTMLButtonElement>('[aria-label="Close setup guide"]')!.click();
        expect(fired).toEqual(["edit", "close"]);
      });

      /* WCAG + design pass (f3) */
      test("minimize makes the body inert (S6) and the toggle controls it", async () => {
        const el = await fixture<TcSetupGuide>(html`<tc-setup-guide look=${look} .groups=${groups}></tc-setup-guide>`);
        const body = el.querySelector(".ui-sg__body")!;
        const toggle = el.querySelector<HTMLButtonElement>('[aria-label="Minimize setup guide"]')!;
        expect(toggle.getAttribute("aria-controls")).toBe(body.id);
        expect(toggle.getAttribute("aria-expanded")).toBe("true");
        expect(body.hasAttribute("inert")).toBe(false);
        toggle.click();
        await settle();
        expect(body.hasAttribute("inert")).toBe(true);
        expect(el.querySelector('[aria-label="Expand setup guide"]')!.getAttribute("aria-expanded")).toBe("false");
      });

      test("ticking the last task of a group: focus moves to the group's header before it folds (2.4.3)", async () => {
        vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
        const el = await fixture<TcSetupGuide>(html`<tc-setup-guide look=${look} .groups=${groups}></tc-setup-guide>`);
        const second = checkbox(el, "Second");
        second.focus();
        second.click();
        await el.updateComplete;
        vi.advanceTimersByTime(500);
        await el.updateComplete;
        const head = groupHead(el, "Basics");
        expect(head.textContent!.trim()).toMatch(/^Basics.*done$/);
        expect(document.activeElement).toBe(head);
      });

      test("a locked task names why and is disabled", async () => {
        const el = await fixture<TcSetupGuide>(html`<tc-setup-guide look=${look} .groups=${[{ id: "g", title: "Basics", tasks: [{ id: "a", label: "First" }, { id: "b", label: "Second" }] }]}></tc-setup-guide>`);
        const locked = checkbox(el, "Second");
        expect(locked.textContent!.replace(/\s+/g, " ").trim()).toBe("Second – finish the task before it first");
        expect(locked.disabled).toBe(true);
        expect(locked.dataset.state).toBe("locked");
      });

      test("keyboard: a group header toggles with Enter and Space, tasks tick with Space", async () => {
        const el = await fixture<TcSetupGuide>(html`<tc-setup-guide look=${look} .groups=${groups}></tc-setup-guide>`);
        const { userEvent } = await import("vitest/browser");
        groupHead(el, "Launch").focus();
        await userEvent.keyboard("{Enter}");
        await settle();
        expect(openTitle(el)).toBe("Launch");
        groupHead(el, "Basics").focus();
        await userEvent.keyboard(" ");
        await settle();
        expect(openTitle(el)).toBe("Basics");
        checkbox(el, "Second").focus();
        await userEvent.keyboard(" ");
        await settle();
        expect(isChecked(el, "Second")).toBe(true);
      });
    });
  }

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-setup-guide editable closable .groups=${groups}></tc-setup-guide>
      <tc-setup-guide look="clean" heading="Clean" .groups=${groups}></tc-setup-guide>
    </div>`);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
