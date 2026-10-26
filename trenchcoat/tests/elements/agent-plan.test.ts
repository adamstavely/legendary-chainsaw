/*
 * <tc-agent-plan> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/agent-plan";
import type { AgentPlanStep, TcAgentPlan } from "../../src/elements/agent-plan";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

const steps: AgentPlanStep[] = [
  { id: "a", title: "Search the docs" },
  { id: "b", title: "Write the answer" },
];
const names = (el: Element) => [...el.querySelectorAll(".ui-pl__name")].map((n) => n.textContent);
const button = (el: Element, name: string | RegExp) =>
  [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => {
    const label = b.getAttribute("aria-label") ?? b.textContent!.trim();
    return typeof name === "string" ? label === name : name.test(label);
  })!;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("tc-agent-plan", () => {
  test("the host is the root and carries the phase", async () => {
    const el = await fixture<TcAgentPlan>(html`<tc-agent-plan heading="Ship it" estimate="~2 min" .steps=${steps}></tc-agent-plan>`);
    expect(el.dataset.ui).toBe("pl");
    expect(el.dataset.look).toBe("standard");
    expect(el.dataset.status).toBe("draft");
    expect(el.querySelector(".ui-pl__title")!.textContent).toBe("Ship it");
    expect(el.querySelector(".ui-pl__list")!.getAttribute("aria-label")).toBe("Plan: Ship it");
    expect(el.querySelector(".ui-pl__state-label")!.textContent).toBe("Plan · 2 steps");
    expect(el.querySelector(".ui-pl__estimate")!.textContent).toBe("Estimated time ~2 min");
    el.status = "running";
    await settle();
    expect(el.dataset.status).toBe("running");
    expect(el.querySelector(".ui-pl__estimate")).toBeNull();
  });

  for (const look of ["standard", "clean"] as const) {
    describe(look, () => {
      test("uncontrolled steps change and fire; prevented ones only fire", async () => {
        const seen: AgentPlanStep[][] = [];
        const el = await fixture<TcAgentPlan>(html`<tc-agent-plan look=${look} .steps=${steps} @tc-steps-change=${(e: CustomEvent<{ steps: AgentPlanStep[] }>) => seen.push(e.detail.steps)}></tc-agent-plan>`);
        button(el, /Remove step 2/).click();
        await settle();
        expect(el.querySelector("[data-removing]")).not.toBeNull();
        await wait(300);
        await settle();
        expect(seen).toEqual([[steps[0]]]);
        expect(names(el)).toEqual(["Search the docs"]);

        const c = await fixture<TcAgentPlan>(html`<tc-agent-plan look=${look} .steps=${steps} @tc-steps-change=${(e: CustomEvent<{ steps: AgentPlanStep[] }>) => {
          e.preventDefault();
          seen.push(e.detail.steps);
        }}></tc-agent-plan>`);
        const input = c.querySelector<HTMLInputElement>('input[placeholder="Add step"]')!;
        input.focus();
        await userEvent.keyboard("Check sources");
        await userEvent.keyboard("{Enter}");
        await settle();
        expect(seen.at(-1)).toEqual([...steps, expect.objectContaining({ title: "Check sources" })]);
        expect(names(c)).toEqual(["Search the docs", "Write the answer"]);
        expect(input.value).toBe("");
      });

      test("Enter while composing (IME) does not add a step", async () => {
        const seen: unknown[] = [];
        const el = await fixture<TcAgentPlan>(html`<tc-agent-plan look=${look} .steps=${steps} @tc-steps-change=${(e: Event) => seen.push(e)}></tc-agent-plan>`);
        const input = el.querySelector<HTMLInputElement>('input[placeholder="Add step"]')!;
        input.value = "かな";
        input.dispatchEvent(new InputEvent("input", { bubbles: true }));
        input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", isComposing: true, bubbles: true, cancelable: true }));
        await settle();
        expect(seen).toEqual([]);
      });

      test("an async run waits, and a rejection says so", async () => {
        let fail: (e: Error) => void = () => {};
        const runner = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)));
        const fired: AgentPlanStep[][] = [];
        const el = await fixture<TcAgentPlan>(html`<tc-agent-plan look=${look} .steps=${steps} .runner=${runner} @tc-run=${(e: CustomEvent<{ steps: AgentPlanStep[] }>) => fired.push(e.detail.steps)}></tc-agent-plan>`);
        const run = button(el, /Run plan/);
        run.click();
        await settle();
        expect(fired).toEqual([steps]);
        expect(runner).toHaveBeenCalledWith(steps);
        expect(run.disabled).toBe(true);
        fail(new Error("offline"));
        await settle();
        expect(button(el, /Run plan/).disabled).toBe(false);
        expect(el.querySelector('[role="alert"]')!.textContent).toMatch(/try again/);
      });

      test("an async retry waits and recovers", async () => {
        let fail: (e: Error) => void = () => {};
        const retrier = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)));
        const el = await fixture<TcAgentPlan>(html`<tc-agent-plan look=${look} retryable .steps=${[{ id: "a", title: "Search", status: "failed" }]} status="running" .retrier=${retrier}></tc-agent-plan>`);
        const retry = button(el, /Retry from here/);
        retry.click();
        await settle();
        expect(retrier).toHaveBeenCalledWith("a");
        expect(retry.disabled).toBe(true);
        fail(new Error("offline"));
        await settle();
        expect(button(el, /Retry from here/).disabled).toBe(false);
        expect(el.querySelector(".ui-pl__error")!.textContent).toMatch(/Couldn't retry/);
      });

      test("the live timers tick without re-rendering the plan", async () => {
        vi.useFakeTimers({ now: 1_000_000, toFake: ["setInterval", "clearInterval", "Date"] });
        const running: AgentPlanStep[] = [
          { id: "a", title: "Search", status: "done", duration: 1200 },
          { id: "b", title: "Write", status: "active" },
        ];
        const el = await fixture<TcAgentPlan>(html`<tc-agent-plan look=${look} .steps=${running} status="running"></tc-agent-plan>`);
        const render = vi.spyOn(el as unknown as { render: () => unknown }, "render");
        vi.advanceTimersByTime(3000);
        expect(render).not.toHaveBeenCalled();
        expect(el.querySelector(".ui-pl__step[data-step=active] .ui-pl__time")!.textContent).toBe("3.0s");
        expect(el.querySelector(".ui-pl__elapsed")!.textContent).toBe("3s");
        expect(el.querySelector(".ui-pl__time--done")!.textContent).toBe("took 1.2s");
        expect(vi.getTimerCount()).toBe(1);
        el.remove();
        expect(vi.getTimerCount()).toBe(0);
      });

      test("a step that finishes shows how long it took, measured live", async () => {
        vi.useFakeTimers({ now: 1_000_000, toFake: ["setInterval", "clearInterval", "Date"] });
        const el = await fixture<TcAgentPlan>(html`<tc-agent-plan look=${look} .steps=${[{ id: "a", title: "Search", status: "active" }]} status="running"></tc-agent-plan>`);
        vi.advanceTimersByTime(2000);
        el.steps = [{ id: "a", title: "Search", status: "done" }];
        await settle();
        expect(el.querySelector(".ui-pl__time--done")!.textContent).toMatch(/2\.0s/);
        el.status = "done";
        await settle();
        expect(el.querySelector(".ui-pl__foot")!.textContent).toMatch(/Done in 2s/);
      });

      test("Move up / Move down buttons reorder with a single pointer (2.5.7)", async () => {
        const seen: AgentPlanStep[][] = [];
        const el = await fixture<TcAgentPlan>(html`<tc-agent-plan look=${look} .steps=${steps} @tc-steps-change=${(e: CustomEvent<{ steps: AgentPlanStep[] }>) => seen.push(e.detail.steps)}></tc-agent-plan>`);
        expect(button(el, /Move step 1 up/)).toBeUndefined();
        button(el, "Move step 1 down: Search the docs").click();
        await settle();
        expect(names(el)).toEqual(["Write the answer", "Search the docs"]);
        expect(seen.at(-1)).toEqual([steps[1], steps[0]]);
        expect(el.querySelector('[role="status"]')!.textContent).toBe("Moved “Search the docs” to position 2 of 2");
      });

      test("keyboard: arrows move between rows, Alt+arrow reorders, Enter renames, Delete removes", async () => {
        const el = await fixture<TcAgentPlan>(html`<tc-agent-plan look=${look} .steps=${steps}></tc-agent-plan>`);
        const rows = () => [...el.querySelectorAll<HTMLLIElement>(".ui-pl__step")];
        rows()[0].focus();
        await userEvent.keyboard("{ArrowDown}");
        expect(document.activeElement).toBe(rows()[1]);
        await userEvent.keyboard("{ArrowDown}");
        expect(document.activeElement).toBe(el.querySelector('input[placeholder="Add step"]'));
        await userEvent.keyboard("{ArrowUp}");
        expect(document.activeElement).toBe(rows()[1]);
        await userEvent.keyboard("{Alt>}{ArrowUp}{/Alt}");
        await settle();
        expect(names(el)).toEqual(["Write the answer", "Search the docs"]);
        expect(document.activeElement).toBe(rows()[0]);
        await userEvent.keyboard("{Enter}");
        await settle();
        const edit = el.querySelector<HTMLInputElement>(".ui-pl__edit")!;
        expect(document.activeElement).toBe(edit);
        await userEvent.keyboard("Draft it{Enter}");
        await settle();
        expect(names(el)).toEqual(["Draft it", "Search the docs"]);
        expect(document.activeElement).toBe(rows()[0]);
        await userEvent.keyboard("{Delete}");
        await wait(300);
        await settle();
        expect(names(el)).toEqual(["Search the docs"]);
        expect(document.activeElement).toBe(rows()[0]);
      });

      test("Run plan swaps the footer: focus moves to the run status, not <body> (2.4.3)", async () => {
        const el = await fixture<TcAgentPlan>(html`<tc-agent-plan look=${look} .steps=${steps}></tc-agent-plan>`);
        button(el, /Run plan/).focus();
        el.steps = [{ ...steps[0], status: "active" }, steps[1]];
        el.status = "running";
        await settle();
        await wait(0);
        expect(document.activeElement).toBe(el.querySelector(".ui-pl__foot .ui-pl__status"));
        expect(el.querySelector(".ui-pl__foot")!.textContent).toMatch(/Running · 1 of 2/);
        expect(el.querySelector('[role="status"]')!.textContent).toBe("Running plan");
      });

      test("cancel, retry and run again show only when asked for", async () => {
        const fired: string[] = [];
        const el = await fixture<TcAgentPlan>(html`<tc-agent-plan look=${look} .steps=${steps} @tc-cancel=${() => fired.push("cancel")}></tc-agent-plan>`);
        expect(button(el, "Cancel")).toBeUndefined();
        el.cancellable = true;
        await settle();
        button(el, "Cancel").click();
        expect(fired).toEqual(["cancel"]);
        el.steps = steps.map((s) => ({ ...s, status: "done" as const, duration: 1000 }));
        el.status = "done";
        await settle();
        expect(button(el, /Run again/)).toBeUndefined();
        el.rerunnable = true;
        await settle();
        expect(button(el, /Run again/)).toBeTruthy();
      });
    });
  }

  test("styles: primary is flat ink on the action tokens, the add field shows a focus ring, the shimmer is composited", async () => {
    await fixture(html`<tc-agent-plan .steps=${steps}></tc-agent-plan>`);
    const sheet = (customElements.get("tc-agent-plan") as unknown as { css: string }).css;
    expect(sheet).toMatch(/\.ui-pl__btn--primary\s*{[^}]*background: var\(--tc-action-primary-bg/);
    expect(sheet).toMatch(/\.ui-pl__add:focus-within\s*{\s*outline: var\(--tc-focus-outline/);
    expect(sheet).not.toMatch(/background-position/);
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-agent-plan heading="Draft" estimate="~2 min" cancellable .steps=${[...steps, { id: "c", title: "Check", detail: "Sources", tool: "search_web" }]}></tc-agent-plan>
      <tc-agent-plan look="clean" heading="Running" status="running" retryable .steps=${[{ id: "a", title: "Search", status: "done", duration: 900 }, { id: "b", title: "Write", status: "failed", error: "Timed out" }, { id: "c", title: "Check", status: "active" }]}></tc-agent-plan>
    </div>`);
    // Rows and the footer fade in; contrast is checked once they're in
    await wait(1200);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
