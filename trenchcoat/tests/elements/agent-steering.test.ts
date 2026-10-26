/*
 * <tc-agent-steering> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/agent-steering";
import type { SteerNote, SteerStep, TcAgentSteering } from "../../src/elements/agent-steering";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const steps: SteerStep[] = [{ id: "s1", title: "Read schema", status: "active" }];
const queue: SteerNote[] = [
  { id: "n1", text: "Use the replica" },
  { id: "n2", text: "Skip the audit table" },
  { id: "n3", text: "Batch by 500" },
];
const field = (el: Element) => el.querySelector<HTMLTextAreaElement>("textarea")!;
const byName = (el: Element, name: string) => [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.getAttribute("aria-label") === name);
const type = (el: Element, value: string) => {
  const f = field(el);
  f.value = value;
  f.dispatchEvent(new InputEvent("input", { bubbles: true }));
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("tc-agent-steering", () => {
  test("the host is the root, with the look and the run's status", async () => {
    const el = await fixture<TcAgentSteering>(html`<tc-agent-steering heading="Migrate users" agent="Opus" .steps=${steps}></tc-agent-steering>`);
    expect(el.dataset.ui).toBe("st");
    expect(el.dataset.look).toBe("standard");
    expect(el.dataset.status).toBe("running");
    expect(el.querySelector(".ui-st__title")!.textContent).toBe("Migrate users");
    expect(el.querySelector(".ui-st__sub")!.textContent).toMatch(/Opus.*Step 1 of 1/);
    el.status = "done";
    await settle();
    expect(el.dataset.status).toBe("done");
    expect(field(el).disabled).toBe(true);
  });

  test("uncontrolled draft starts where it's set and reports changes", async () => {
    const el = await fixture<TcAgentSteering>(html`<tc-agent-steering heading="Run" .steps=${steps} draft="hello"></tc-agent-steering>`);
    const onChange = vi.fn();
    el.addEventListener("tc-draft-change", (e) => onChange((e as CustomEvent).detail.draft));
    expect(field(el).value).toBe("hello");
    type(el, "hello there");
    await settle();
    expect(field(el).value).toBe("hello there");
    expect(el.draft).toBe("hello there");
    expect(onChange).toHaveBeenCalledWith("hello there");
  });

  test("controlled draft: preventDefault keeps it; setting it shows it", async () => {
    const el = await fixture<TcAgentSteering>(html`<tc-agent-steering heading="Run" .steps=${steps} draft="first"></tc-agent-steering>`);
    el.addEventListener("tc-draft-change", (e) => e.preventDefault());
    type(el, "firstx");
    await settle();
    expect(field(el).value).toBe("first");
    el.draft = "second";
    await settle();
    expect(field(el).value).toBe("second");
  });

  test("↵ queues the note, ⌘/Ctrl↵ interrupts, Escape clears", async () => {
    const onQueue = vi.fn();
    const onInterrupt = vi.fn();
    const el = await fixture<TcAgentSteering>(html`<tc-agent-steering heading="Run" .steps=${steps} .onQueue=${onQueue} .onInterrupt=${onInterrupt}></tc-agent-steering>`);
    field(el).focus();
    await userEvent.keyboard("Use the replica");
    await userEvent.keyboard("{Enter}");
    await settle();
    expect(onQueue).toHaveBeenCalledWith("Use the replica");
    expect(field(el).value).toBe("");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Queued for the next step: Use the replica");
    await userEvent.keyboard("Now please");
    await userEvent.keyboard("{Control>}{Enter}{/Control}");
    await settle();
    expect(onInterrupt).toHaveBeenCalledWith("Now please");
    await userEvent.keyboard("scrap");
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(field(el).value).toBe("");
    expect(onQueue).toHaveBeenCalledTimes(1);
  });

  test("a queued note that fails comes back to the field", async () => {
    let fail: (e: Error) => void = () => {};
    const onQueue = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)));
    const el = await fixture<TcAgentSteering>(html`<tc-agent-steering heading="Run" .steps=${steps} .onQueue=${onQueue}></tc-agent-steering>`);
    type(el, "Use the replica");
    await settle();
    field(el).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    await settle();
    expect(field(el).value).toBe("");
    expect(byName(el, "Queue for the next step")!.disabled).toBe(true);
    fail(new Error("offline"));
    await settle();
    expect(field(el).value).toBe("Use the replica");
    expect(el.querySelector('[role="alert"]')!.textContent).toMatch(/try again/);
  });

  test("the modifier hint shows, and the clock ticks without re-rendering", async () => {
    const start = Date.now();
    const el = await fixture<TcAgentSteering>(html`<tc-agent-steering heading="Run" .steps=${[{ ...steps[0], startedAt: start - 2000 }]} .startedAt=${start - 2000} .onInterrupt=${() => {}}></tc-agent-steering>`);
    expect(el.textContent).toMatch(/Ctrl|⌘/);
    expect(el.querySelector(".ui-st__state")!.textContent).toMatch(/Running · 2s/);
    expect(el.querySelector(".ui-st__step-time")!.textContent).toMatch(/^2\.\ds$/);
    const renders = vi.spyOn(el as unknown as { render: () => unknown }, "render");
    await wait(1100);
    expect(el.querySelector(".ui-st__state")!.textContent).toMatch(/Running · 3s/);
    expect(renders).not.toHaveBeenCalled();
  });

  test("no ticker left behind when removed", async () => {
    const spy = vi.spyOn(window, "clearInterval");
    const el = await fixture<TcAgentSteering>(html`<tc-agent-steering heading="Run" .steps=${steps}></tc-agent-steering>`);
    el.remove();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test("Pause and Resume are one button – focus stays on it; they fire tc-pause / tc-resume", async () => {
    const el = await fixture<TcAgentSteering>(html`<tc-agent-steering heading="Run" .steps=${steps} pausable resumable></tc-agent-steering>`);
    const onPause = vi.fn();
    const onResume = vi.fn();
    el.addEventListener("tc-pause", onPause);
    el.addEventListener("tc-resume", onResume);
    const btn = byName(el, "Pause the run")!;
    btn.focus();
    btn.click();
    expect(onPause).toHaveBeenCalledOnce();
    el.status = "paused";
    await settle();
    expect(byName(el, "Resume the run")).toBe(btn);
    expect(document.activeElement).toBe(btn);
    btn.click();
    expect(onResume).toHaveBeenCalledOnce();
  });

  test("queued notes have unique names, and removing one moves focus to the next note's same button", async () => {
    const el = await fixture<TcAgentSteering>(html`<tc-agent-steering heading="Run" .steps=${steps} .queue=${queue} removable .onInterrupt=${() => {}}></tc-agent-steering>`);
    const onRemove = vi.fn();
    el.addEventListener("tc-remove", (e) => onRemove((e as CustomEvent).detail.id));
    expect(byName(el, "Apply now: “Skip the audit table”")).toBeTruthy();
    byName(el, "Remove “Skip the audit table”")!.focus();
    el.queue = [queue[0], queue[2]];
    await settle();
    expect(document.activeElement).toBe(byName(el, "Remove “Batch by 500”"));
    // The last note goes: focus moves to the one before
    byName(el, "Apply now: “Batch by 500”")!.focus();
    el.queue = [queue[0]];
    await settle();
    expect(document.activeElement).toBe(byName(el, "Apply now: “Use the replica”"));
    // None left: the field, never <body>
    el.queue = [];
    await settle();
    expect(document.activeElement).toBe(field(el));
    // ✕ fires tc-remove with the id
    el.queue = queue;
    await settle();
    byName(el, "Remove “Use the replica”")!.click();
    expect(onRemove).toHaveBeenCalledWith("n1");
  });

  test("Now on a queued note interrupts with its id", async () => {
    const onInterrupt = vi.fn();
    const el = await fixture<TcAgentSteering>(html`<tc-agent-steering heading="Run" .steps=${steps} .queue=${queue} .onInterrupt=${onInterrupt}></tc-agent-steering>`);
    byName(el, "Apply now: “Batch by 500”")!.click();
    expect(onInterrupt).toHaveBeenCalledWith("Batch by 500", "n3");
    expect(byName(el, "Remove “Batch by 500”")).toBeUndefined();
  });

  test("each step says its state in words; the status region is there from mount", async () => {
    const el = await fixture<TcAgentSteering>(html`<tc-agent-steering
      heading="Run"
      .steps=${[
        { id: "a", title: "Read schema", status: "done" },
        { id: "b", title: "Write migration", status: "active" },
        { id: "c", title: "Run tests" },
      ]}
    ></tc-agent-steering>`);
    const items = [...el.querySelectorAll(".ui-st__step")].map((li) => li.querySelector(".ui-st__sr")!.textContent);
    expect(items).toEqual(["Done: ", "In progress: ", "To do: "]);
    const status = el.querySelector('[role="status"]')!;
    expect(status.textContent).toBe("");
    expect(el.querySelector(".ui-st__shine")!.getAttribute("aria-hidden")).toBe("true");
    expect(el.querySelector('[aria-current="step"]')!.textContent).toMatch(/Write migration/);
  });

  test("a note the agent picks up is announced and tagged", async () => {
    const el = await fixture<TcAgentSteering>(html`<tc-agent-steering heading="Run" agent="Opus" .steps=${steps} .queue=${[queue[0]]}></tc-agent-steering>`);
    el.queue = [];
    el.steps = [{ ...steps[0], notes: [{ ...queue[0], picked: "next" }] }];
    await settle();
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Opus picked up: Use the replica");
    expect(el.querySelector(".ui-st__note-tag")!.textContent).toBe("Picked up");
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the field and queue sit ${look === "clean" ? "inside" : "under"} the card`, async () => {
      const el = await fixture<TcAgentSteering>(html`<tc-agent-steering look=${look} heading="Run" .steps=${steps} .queue=${queue}></tc-agent-steering>`);
      expect(!!el.querySelector(".ui-st__card .ui-st__compose")).toBe(look === "clean");
      expect(!!el.querySelector(".ui-st__card .ui-st__queue")).toBe(look === "clean");
    });
  }

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-agent-steering heading="Run" agent="Opus" .steps=${steps} .queue=${queue} removable pausable .onInterrupt=${() => {}}></tc-agent-steering>
      <tc-agent-steering look="clean" heading="Clean" .steps=${steps} .queue=${queue} removable></tc-agent-steering>
    </div>`);
    for (const a of wrap.getAnimations({ subtree: true })) a.finish();
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
