/*
 * <tc-agent-inbox> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/agent-inbox";
import type { AgentInboxExpandedChange, AgentInboxViewChange, AgentTask, TcAgentInbox } from "../../src/elements/agent-inbox";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const waiting: AgentTask = { id: "a", title: "Write the brief", agent: "Opus", status: "waiting", startedAt: 0 };
const done: AgentTask = { id: "b", title: "Check the numbers", agent: "Opus", status: "done", elapsed: 4000 };
const statusOf = (el: Element) => el.querySelector('[data-id="a"]')?.getAttribute("data-status");
const button = (el: Element, name: string) => [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent!.trim() === name)!;
const radio = (el: Element, name: string) => [...el.querySelectorAll<HTMLButtonElement>('[role="radio"]')].find((b) => b.textContent!.includes(name))!;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("tc-agent-inbox", () => {
  test("the host is the root; heading, lanes and counts", async () => {
    const el = await fixture<TcAgentInbox>(html`<tc-agent-inbox heading="Agent tasks" .tasks=${[waiting, done]}></tc-agent-inbox>`);
    expect(el.dataset.ui).toBe("ai");
    expect(el.dataset.look).toBe("standard");
    expect(el.dataset.view).toBe("board");
    expect(el.querySelector(".ui-ai__heading")!.textContent).toContain("Agent tasks");
    expect([...el.querySelectorAll("section")].map((s) => s.getAttribute("aria-label"))).toEqual(["Needs you", "Running", "Done"]);
    expect([...el.querySelectorAll(".ui-ai__count")].map((c) => c.textContent)).toEqual(["1", "0", "1"]);
    expect(el.querySelector(".ui-ai__empty")!.textContent).toBe("Nothing here");
    expect(el.querySelector('[data-id="b"] .ui-ai__time')!.textContent).toBe("4s");
    expect(el.querySelector('[aria-live="polite"]')!.textContent).toBe("1 need you, 0 running");
  });

  test("the action button shows in Standard only", async () => {
    const onClick = vi.fn();
    const el = await fixture<TcAgentInbox>(html`<tc-agent-inbox .action=${{ label: "New task", onClick }} .tasks=${[waiting]}></tc-agent-inbox>`);
    el.querySelector<HTMLButtonElement>(".ui-ai__action")!.click();
    expect(onClick).toHaveBeenCalledTimes(1);
    el.look = "clean";
    await settle();
    expect(el.querySelector(".ui-ai__action")).toBeNull();
  });

  for (const look of ["standard", "clean"] as const) {
    describe(look, () => {
      test("a decision shows at once, and a later task update still wins", async () => {
        const onApprove = vi.fn();
        const el = await fixture<TcAgentInbox>(html`<tc-agent-inbox look=${look} .tasks=${[waiting]} .onApprove=${onApprove}></tc-agent-inbox>`);
        button(el, "Approve").click();
        await settle();
        expect(onApprove).toHaveBeenCalledWith(expect.objectContaining({ id: "a" }));
        expect(statusOf(el)).toBe("running");
        // The server says it failed after all – the property is the source of truth
        el.tasks = [{ ...waiting, status: "failed" }];
        await settle();
        expect(statusOf(el)).toBe("failed");
        el.tasks = [{ ...waiting, status: "done", elapsed: 1000 }];
        await settle();
        expect(statusOf(el)).toBe("done");
      });

      test("an async decision waits, and a rejection leaves the card as it was", async () => {
        let fail: (e: Error) => void = () => {};
        const onApprove = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)));
        const el = await fixture<TcAgentInbox>(html`<tc-agent-inbox look=${look} .tasks=${[waiting]} .onApprove=${onApprove}></tc-agent-inbox>`);
        const approve = button(el, "Approve");
        approve.click();
        await settle();
        // aria-disabled (not disabled) while it waits, so it keeps focus
        expect(approve.getAttribute("aria-disabled")).toBe("true");
        approve.click();
        expect(onApprove).toHaveBeenCalledTimes(1);
        fail(new Error("offline"));
        await wait(0);
        await settle();
        expect(statusOf(el)).toBe("waiting");
        expect(el.querySelector('[role="alert"]')!.textContent).toMatch(/try again/);
        expect(button(el, "Approve").getAttribute("aria-disabled")).toBeNull();
      });

      test("an async decision that succeeds shows its result", async () => {
        let ok: () => void = () => {};
        const onRetry = vi.fn(() => new Promise<void>((resolve) => (ok = resolve)));
        const el = await fixture<TcAgentInbox>(html`<tc-agent-inbox look=${look} .tasks=${[{ ...waiting, status: "failed" }]} .onRetry=${onRetry}></tc-agent-inbox>`);
        button(el, "Retry").click();
        await settle();
        expect(statusOf(el)).toBe("failed");
        ok();
        await wait(0);
        await settle();
        expect(statusOf(el)).toBe("running");
      });

      test("view and expanded change on their own and report; preventDefault keeps control", async () => {
        const el = await fixture<TcAgentInbox>(html`<tc-agent-inbox look=${look} .tasks=${[waiting]}></tc-agent-inbox>`);
        const views: string[] = [];
        const opened: (string | null)[] = [];
        el.addEventListener("tc-view-change", (e) => views.push((e as CustomEvent<AgentInboxViewChange>).detail.view));
        el.addEventListener("tc-expanded-change", (e) => opened.push((e as CustomEvent<AgentInboxExpandedChange>).detail.expanded));
        radio(el, "List").click();
        await settle();
        expect(el.dataset.view).toBe("list");
        expect(views).toEqual(["list"]);
        el.querySelector<HTMLButtonElement>(".ui-ai__card-main")!.click();
        await settle();
        expect(opened).toEqual(["a"]);
        expect(el.querySelector('[aria-expanded="true"]')?.closest("[data-id]")?.getAttribute("data-id")).toBe("a");
        // Controlled: the app prevents and decides
        el.addEventListener("tc-view-change", (e) => e.preventDefault());
        el.addEventListener("tc-expanded-change", (e) => e.preventDefault());
        radio(el, "Board").click();
        el.querySelector<HTMLButtonElement>(".ui-ai__card-main")!.click();
        await settle();
        expect(el.dataset.view).toBe("list");
        expect(el.expanded).toBe("a");
        el.view = "board";
        el.expanded = null;
        await settle();
        expect(el.dataset.view).toBe("board");
        expect(el.querySelector('[aria-expanded="true"]')).toBeNull();
      });

      test("DOM ids never contain the task id", async () => {
        const el = await fixture<TcAgentInbox>(html`<tc-agent-inbox look=${look} .tasks=${[{ ...waiting, id: 'x" y' }]}></tc-agent-inbox>`);
        const fold = el.querySelector(".ui-ai__fold")!;
        expect(fold.id).not.toContain("x");
        expect(el.querySelector(".ui-ai__card-main")?.getAttribute("aria-controls")).toBe(fold.id);
      });

      test("a running task's time moves on every second without re-rendering the inbox", async () => {
        const el = await fixture<TcAgentInbox>(html`<tc-agent-inbox look=${look} .tasks=${[{ id: "r", title: "Research", agent: "Opus", status: "running", startedAt: Date.now() - 5_000 }]}></tc-agent-inbox>`);
        const time = () => el.querySelector(".ui-ai__time")?.textContent;
        expect(time()).toBe("5s");
        let updates = 0;
        const update = el["update"].bind(el);
        (el as unknown as { update: (c: unknown) => void }).update = (c) => {
          updates++;
          update(c as never);
        };
        await wait(2100);
        expect(time()).toMatch(/^[78]s$/);
        expect(updates).toBe(0);
      });

      test("Approve: focus goes to the card, and stays on it after it moves to Running (2.4.3)", async () => {
        const el = await fixture<TcAgentInbox>(html`<tc-agent-inbox look=${look} .tasks=${[waiting]} expanded="a" .onApprove=${() => {}}></tc-agent-inbox>`);
        el.expanded = "a";
        await settle();
        const approve = button(el, "Approve");
        approve.focus();
        approve.click();
        expect(document.activeElement).toBe(el.querySelector('[data-id="a"] .ui-ai__card-main'));
        await wait(1000);
        await settle();
        const main = el.querySelector('[data-id="a"] .ui-ai__card-main');
        expect(main!.closest('[aria-label="Running"]')).toBeTruthy();
        expect(document.activeElement).toBe(main);
      });

      test("Board / List: one tab stop, arrow keys move and pick", async () => {
        const el = await fixture<TcAgentInbox>(html`<tc-agent-inbox look=${look} .tasks=${[waiting]}></tc-agent-inbox>`);
        const board = radio(el, "Board");
        const list = radio(el, "List");
        expect(board.tabIndex).toBe(0);
        expect(list.tabIndex).toBe(-1);
        board.focus();
        board.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
        await settle();
        expect(el.dataset.view).toBe("list");
        expect(document.activeElement).toBe(list);
        list.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
        await settle();
        expect(el.dataset.view).toBe("board");
      });

      test("Escape folds the open card and returns focus to it", async () => {
        const el = await fixture<TcAgentInbox>(html`<tc-agent-inbox look=${look} .tasks=${[waiting]}></tc-agent-inbox>`);
        el.expanded = "a";
        await settle();
        const reject = button(el, "Reject");
        reject.focus();
        reject.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        await settle();
        expect(el.expanded).toBeNull();
        expect(document.activeElement).toBe(el.querySelector(".ui-ai__card-main"));
        expect(el.querySelector<HTMLElement>(".ui-ai__fold")!.inert).toBe(true);
      });

      test("tool and source counts are named in words, not only by title", async () => {
        const el = await fixture<TcAgentInbox>(html`<tc-agent-inbox look=${look} .tasks=${[{ ...waiting, tools: 3, sources: 5 }]}></tc-agent-inbox>`);
        const main = el.querySelector(".ui-ai__card-main")!;
        expect(main.textContent).toMatch(/5 sources read/);
        expect(main.textContent).toMatch(/3 tool calls/);
      });
    });
  }

  test("Open shows when openable and fires tc-open with the task", async () => {
    const el = await fixture<TcAgentInbox>(html`<tc-agent-inbox .tasks=${[done]}></tc-agent-inbox>`);
    el.expanded = "b";
    await settle();
    expect(button(el, "Open")).toBeUndefined();
    el.openable = true;
    await settle();
    const got: AgentTask[] = [];
    el.addEventListener("tc-open", (e) => got.push((e as CustomEvent<AgentTask>).detail));
    button(el, "Open").click();
    expect(got.map((t) => t.id)).toEqual(["b"]);
  });

  test("removing the inbox stops its timers", async () => {
    const el = await fixture<TcAgentInbox>(html`<tc-agent-inbox .tasks=${[{ ...waiting, status: "running", startedAt: Date.now() }]}></tc-agent-inbox>`);
    el.tasks = [{ ...waiting, status: "done", elapsed: 10 }];
    await settle();
    el.remove();
    const before = el.dataset.view;
    await wait(1100);
    expect(el["tick"]).toBe(0);
    expect(el["laneTimer"]).toBe(0);
    expect(el.dataset.view).toBe(before);
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-agent-inbox .tasks=${[waiting, done, { ...waiting, id: "c", status: "running", tools: 2, sources: 1 }]} .action=${{ label: "New task", onClick: () => {} }}></tc-agent-inbox>
      <tc-agent-inbox look="clean" heading="Clean" .tasks=${[waiting, done]}></tc-agent-inbox>
    </div>`);
    // The lanes fade in: measure contrast once they're there
    document.getAnimations().forEach((a) => a.finish());
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
