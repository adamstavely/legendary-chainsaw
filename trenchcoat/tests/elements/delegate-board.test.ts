/*
 * <tc-delegate-board> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/delegate-board";
import type { DelegateAgent, DelegateAssign, DelegateModeChange, DelegateTask, TcDelegateBoard } from "../../src/elements/delegate-board";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

const agents: DelegateAgent[] = [
  { id: "a1", name: "Research" },
  { id: "a2", name: "Review" },
];
const task = (agentId: string | null): DelegateTask[] => [{ id: "t1", title: "Summarise the RFC", estimate: 12, agentId }];
const many: DelegateTask[] = [
  { id: "q1", title: "Run the migration", estimate: 5, agentId: "a1" },
  { id: "q2", title: "Write the notes", estimate: 5, agentId: "a1" },
  { id: "q3", title: "Tag the release", estimate: 5, agentId: "a1" },
  { id: "q4", title: "Email the team", estimate: 5, agentId: "a1" },
  { id: "q5", title: "Close the ticket", estimate: 5, agentId: "a1" },
];
const queueOf = (el: Element, id: string) => el.querySelector(`[data-agent="${id}"] .ui-db__queue`)!.textContent;
const status = (el: Element) => el.querySelector('[role="status"]')!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const click = (target: Element, detail = 1) => target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, detail }));
const taskButton = (el: Element) => el.querySelector<HTMLElement>('[data-task-id="t1"]')!;

for (const look of ["standard", "clean"] as const) {
  describe(`tc-delegate-board ${look}`, () => {
    test("the host is the root, with the look; the bar sits on the tray (Standard) or in the card (Clean)", async () => {
      const el = await fixture<TcDelegateBoard>(html`<tc-delegate-board look=${look} heading="Hand off" .agents=${agents} .tasks=${task(null)} .now=${0}></tc-delegate-board>`);
      expect(el.dataset.ui).toBe("db");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Hand off");
      expect(!!el.querySelector(look === "clean" ? ".ui-db__card > .tc-head" : ":scope > .tc-head")).toBe(true);
    });

    test("a listening tc-assign doesn't freeze the board, and `tasks` wins once it changes", async () => {
      const onAssign = vi.fn();
      const el = await fixture<TcDelegateBoard>(html`<tc-delegate-board look=${look} .agents=${agents} .tasks=${task(null)} .now=${0} @tc-assign=${(e: CustomEvent<DelegateAssign>) => onAssign(e.detail.taskId, e.detail.agentId)}></tc-delegate-board>`);
      key(taskButton(el), "1");
      await settle();
      expect(onAssign).toHaveBeenCalledWith("t1", "a1");
      expect(queueOf(el, "a1")).toContain("Summarise the RFC");
      // The same tasks again keep the move
      el.tasks = task(null);
      await settle();
      expect(queueOf(el, "a1")).toContain("Summarise the RFC");
      // The app assigns it elsewhere: that shows
      el.tasks = task("a2");
      await settle();
      expect(queueOf(el, "a1")).not.toContain("Summarise the RFC");
      expect(queueOf(el, "a2")).toContain("Summarise the RFC");
    });

    test("controlled mode: the switch reports, a prevented change isn't applied, the property decides", async () => {
      const onModeChange = vi.fn();
      const el = await fixture<TcDelegateBoard>(html`<tc-delegate-board
        look=${look}
        .agents=${agents}
        .tasks=${task("a1")}
        .now=${0}
        mode="manual"
        @tc-mode-change=${(e: CustomEvent<DelegateModeChange>) => {
          e.preventDefault();
          onModeChange(e.detail.mode);
        }}
      ></tc-delegate-board>`);
      const sw = el.querySelector('[role="switch"]')!;
      click(sw);
      await settle();
      expect(onModeChange).toHaveBeenCalledWith("auto");
      expect(sw.getAttribute("aria-checked")).toBe("false");
      el.mode = "auto";
      await settle();
      expect(sw.getAttribute("aria-checked")).toBe("true");
    });

    test("Auto hands the next unassigned task to the least busy agent", async () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      const onAssign = vi.fn();
      const el = await fixture<TcDelegateBoard>(html`<tc-delegate-board look=${look} .agents=${agents} .tasks=${[...task(null), { id: "t2", title: "Busy", estimate: 30, agentId: "a1" }]} .now=${0} @tc-assign=${(e: CustomEvent<DelegateAssign>) => onAssign(e.detail.taskId, e.detail.agentId)}></tc-delegate-board>`);
      click(el.querySelector('[role="switch"]')!);
      await settle();
      expect(el.mode).toBe("auto");
      vi.advanceTimersByTime(1000);
      await settle();
      expect(onAssign).toHaveBeenCalledWith("t1", "a2");
      el.remove();
      expect(vi.getTimerCount()).toBe(0);
    });

    test("without `now` the clock is read on connect, and the interval stops on removal", async () => {
      vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"] });
      vi.setSystemTime(new Date(2026, 9, 24, 9, 0));
      const el = await fixture<TcDelegateBoard>(html`<tc-delegate-board look=${look} .agents=${agents} .tasks=${task("a1")}></tc-delegate-board>`);
      expect(el.querySelector('[data-kind="busy"]')!.textContent).toBe("Busy until 09:12");
      expect(vi.getTimerCount()).toBe(1);
      el.remove();
      expect(vi.getTimerCount()).toBe(0);
    });

    test("prices and the spend in queues use formatCost; a suggestion previews the new time", async () => {
      const el = await fixture<TcDelegateBoard>(html`<tc-delegate-board
        look=${look}
        .agents=${[{ id: "a1", name: "Research", rate: 0.05 }, { id: "a2", name: "Review", rate: 0.1 }]}
        .tasks=${[...task(null), { id: "t2", title: "Running", estimate: 10, agentId: "a1" }]}
        .now=${0}
        .suggestion=${{ taskId: "t1", agentId: "a2" }}
        .formatCost=${(n: number) => `€${n.toFixed(2)}`}
      ></tc-delegate-board>`);
      expect(el.querySelector(".ui-db__spend")!.textContent).toBe("€0.50 in queues");
      expect(el.querySelector('[data-agent="a2"]')!.hasAttribute("data-target")).toBe(true);
      expect(el.querySelector('[data-agent="a2"] [data-kind="preview"]')!.textContent).toMatch(/^\+12m until/);
      expect(el.querySelector('[data-agent="a2"] .ui-db__price')!.textContent).toBe("+€1.20");
      expect(taskButton(el).hasAttribute("data-picked")).toBe(true);
    });

    test("avatars and tool logos are cloned; without an avatar the initials show", async () => {
      const logo = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      logo.setAttribute("data-logo-mine", "");
      const tool = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      tool.setAttribute("data-tool-mine", "");
      const el = await fixture<TcDelegateBoard>(html`<tc-delegate-board look=${look} .agents=${[{ id: "a1", name: "Research", avatar: logo }, { id: "a2", name: "Code Review" }]} .tasks=${[{ id: "t1", title: "T", estimate: 3, tools: [tool] }]} .now=${0}></tc-delegate-board>`);
      expect(el.querySelector('[data-agent="a1"] .ui-db__avatar svg[data-logo-mine]')).toBeTruthy();
      expect(el.querySelector('[data-agent="a2"] .ui-db__avatar')!.textContent).toBe("CR");
      expect(el.querySelector(".ui-db__task .ui-db__tool svg[data-tool-mine]")).toBeTruthy();
      expect(logo.isConnected).toBe(false);
    });

    test("dragging a task onto an agent hands it over", async () => {
      const onAssign = vi.fn();
      const el = await fixture<TcDelegateBoard>(html`<tc-delegate-board look=${look} .agents=${agents} .tasks=${task(null)} .now=${0} @tc-assign=${(e: CustomEvent<DelegateAssign>) => onAssign(e.detail.taskId, e.detail.agentId)}></tc-delegate-board>`);
      const btn = taskButton(el);
      const from = btn.getBoundingClientRect();
      const to = el.querySelector('[data-agent="a2"]')!.getBoundingClientRect();
      const opts = (x: number, y: number) => ({ button: 0, pointerId: 1, pointerType: "mouse", clientX: x, clientY: y, bubbles: true });
      btn.dispatchEvent(new PointerEvent("pointerdown", opts(from.left + 10, from.top + 10)));
      btn.dispatchEvent(new PointerEvent("pointermove", opts(from.left + 30, from.top + 30)));
      await settle();
      expect(el.hasAttribute("data-dragging")).toBe(true);
      expect(el.querySelector(".ui-db__ghost")).toBeTruthy();
      btn.dispatchEvent(new PointerEvent("pointermove", opts(to.left + 20, to.top + 20)));
      await settle();
      expect(el.querySelector('[data-agent="a2"]')!.hasAttribute("data-target")).toBe(true);
      btn.dispatchEvent(new PointerEvent("pointerup", opts(to.left + 20, to.top + 20)));
      await settle();
      expect(onAssign).toHaveBeenCalledWith("t1", "a2");
      expect(el.hasAttribute("data-dragging")).toBe(false);
      expect(queueOf(el, "a2")).toContain("Summarise the RFC");
    });

    describe("WCAG pass", () => {
      test("2.5.7: click a task, then click an agent – no drag needed", async () => {
        const onAssign = vi.fn();
        const el = await fixture<TcDelegateBoard>(html`<tc-delegate-board look=${look} .agents=${agents} .tasks=${task(null)} .now=${0} @tc-assign=${(e: CustomEvent<DelegateAssign>) => onAssign(e.detail.taskId, e.detail.agentId)}></tc-delegate-board>`);
        click(taskButton(el));
        await settle();
        expect(el.querySelector("[data-picked]")).not.toBeNull();
        click(el.querySelector('[data-agent="a2"]')!);
        await settle();
        expect(onAssign).toHaveBeenCalledWith("t1", "a2");
        expect(queueOf(el, "a2")).toContain("Summarise the RFC");
      });

      test("a picked queued chip goes back to Unassigned on a click on the pile", async () => {
        const onAssign = vi.fn();
        const el = await fixture<TcDelegateBoard>(html`<tc-delegate-board look=${look} .agents=${agents} .tasks=${task("a1")} .now=${0} @tc-assign=${(e: CustomEvent<DelegateAssign>) => onAssign(e.detail.taskId, e.detail.agentId)}></tc-delegate-board>`);
        click(el.querySelector('[data-chip-id="t1"]')!);
        await settle();
        click(el.querySelector("[data-pile]")!);
        await settle();
        expect(onAssign).toHaveBeenCalledWith("t1", null);
      });

      test("keyboard: the status region is there from the start, arrow keys announce the target, focus follows the task", async () => {
        const onAssign = vi.fn();
        const el = await fixture<TcDelegateBoard>(html`<tc-delegate-board look=${look} .agents=${agents} .tasks=${task(null)} .now=${0} @tc-assign=${(e: CustomEvent<DelegateAssign>) => onAssign(e.detail.taskId, e.detail.agentId)}></tc-delegate-board>`);
        expect(status(el).textContent).toBe("");
        const btn = taskButton(el);
        btn.focus();
        key(btn, "Enter");
        await settle();
        expect(status(el).textContent).toMatch(/Picked up Summarise the RFC/);
        key(btn, "ArrowDown");
        await settle();
        expect(status(el).textContent).toMatch(/^Review: \+12 min/);
        key(btn, "Enter");
        await settle();
        expect(onAssign).toHaveBeenCalledWith("t1", "a2");
        // The card became a chip in Review's queue – it keeps focus there
        expect(document.activeElement).toBe(el.querySelector('[data-chip-id="t1"]'));
      });

      test("keyboard unassign: Delete on a queued chip, or choose Unassigned with the arrows", async () => {
        const onAssign = vi.fn();
        const el = await fixture<TcDelegateBoard>(html`<tc-delegate-board look=${look} .agents=${agents} .tasks=${task("a1")} .now=${0} @tc-assign=${(e: CustomEvent<DelegateAssign>) => onAssign(e.detail.taskId, e.detail.agentId)}></tc-delegate-board>`);
        const chip = el.querySelector<HTMLElement>('[data-chip-id="t1"]')!;
        chip.focus();
        key(chip, "Enter");
        await settle();
        key(chip, "ArrowUp");
        await settle();
        expect(status(el).textContent).toBe("Unassigned");
        key(chip, "Escape");
        await settle();
        expect(status(el).textContent).toBe("Put back");
        key(chip, "Delete");
        await settle();
        expect(onAssign).toHaveBeenCalledWith("t1", null);
        expect(document.activeElement).toBe(el.querySelector('[data-task-id="t1"]'));
      });

      test("tasks behind +N are reachable: the chip expands the queue and focus moves to the first revealed task", async () => {
        const el = await fixture<TcDelegateBoard>(html`<tc-delegate-board look=${look} .agents=${agents} .tasks=${many} .now=${0}></tc-delegate-board>`);
        const more = el.querySelector<HTMLElement>(".ui-db__chip--more")!;
        expect(more.getAttribute("aria-label")).toBe("+2 more tasks");
        expect(more.getAttribute("aria-expanded")).toBe("false");
        more.focus();
        click(more);
        await settle();
        expect(more.getAttribute("aria-expanded")).toBe("true");
        expect(document.activeElement).toBe(el.querySelector('[data-chip-id="q4"]'));
        expect(el.querySelector('[data-chip-id="q5"]')!.textContent).toMatch(/Close the ticket/);
        // Folding back: focus on a chip that goes away moves to the "Fewer"/"+N" chip, not <body>
        more.click();
        await settle();
        expect(document.activeElement).toBe(more);
      });

      test("1.4.13: Esc closes the +N tooltip without moving focus", async () => {
        const el = await fixture<TcDelegateBoard>(html`<tc-delegate-board look=${look} .agents=${agents} .tasks=${many} .now=${0}></tc-delegate-board>`);
        const more = el.querySelector<HTMLElement>(".ui-db__chip--more")!;
        const li = el.querySelector(".ui-db__more")!;
        more.focus();
        key(more, "Escape");
        await settle();
        expect(li.hasAttribute("data-tip-off")).toBe(true);
        expect(document.activeElement).toBe(more);
        li.dispatchEvent(new PointerEvent("pointerenter"));
        li.dispatchEvent(new PointerEvent("pointerleave"));
        await settle();
        expect(li.hasAttribute("data-tip-off")).toBe(false);
        // Esc anywhere closes the tooltip under the pointer
        li.dispatchEvent(new PointerEvent("pointerenter"));
        await settle();
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        await settle();
        expect(li.hasAttribute("data-tip-off")).toBe(true);
      });

      test("the running task says so in its name, not only by colour", async () => {
        const el = await fixture<TcDelegateBoard>(html`<tc-delegate-board look=${look} .agents=${agents} .tasks=${many} .now=${0}></tc-delegate-board>`);
        expect(el.querySelector('[data-chip-id="q1"]')!.textContent!.replace(/\s+/g, " ").trim()).toBe("Running: Run the migration");
      });
    });
  });
}

test("axe: no violations in either look", async () => {
  const wrap = await fixture(html`<div>
    <tc-delegate-board .agents=${agents} .tasks=${[...task(null), ...many]} .now=${0}></tc-delegate-board>
    <tc-delegate-board look="clean" .agents=${agents} .tasks=${[...task(null), ...many]} .now=${0}></tc-delegate-board>
  </div>`);
  // Fade-ins settle before axe measures contrast (the running spinner keeps turning)
  await Promise.all(document.getAnimations().filter((a) => !((a.effect as KeyframeEffect | null)?.target as Element | null)?.closest(".ui-db__spin")).map((a) => a.finished));
  const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
});
