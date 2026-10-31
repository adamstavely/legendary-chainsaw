/*
 * <tc-agent-monitor> in real browsers: the current step, clock and cost, the strip, picking steps, actions, the clock
 * stopping, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/agent-monitor";
import { agentMonitorClock, type AgentMonitorActionDetail, type AgentMonitorSelectedChange, type AgentMonitorStep, type TcAgentMonitor } from "../../src/elements/agent-monitor";
import { AgentMonitor } from "../../src/elements/react/agent-monitor";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = 1_000_000;
const STEPS: AgentMonitorStep[] = [
  { id: "a", label: "Read", tool: "Files", startedAt: NOW - 100_000, endedAt: NOW - 90_000, status: "done", detail: "Two pages." },
  { id: "b", label: "Search", tool: "Archive", startedAt: NOW - 90_000, endedAt: NOW - 30_000, status: "failed" },
  { id: "c", label: "Compare", startedAt: NOW - 30_000, status: "running" },
];
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const run = () => fixture<TcAgentMonitor>(html`<tc-agent-monitor name="Reader" .now=${NOW} .startedAt=${NOW - 100_000} .cost=${0.42} .steps=${STEPS} locale="en-US"></tc-agent-monitor>`);
const segments = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-amn__segment")];
const stepRows = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-amn__step-row")];
const action = (el: Element, a: string) => el.querySelector<HTMLElement>(`[data-action="${a}"]`);
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-agent-monitor", () => {
  test("shows the current step, the clock and the cost", async () => {
    const el = await run();
    expect(el.dataset.ui).toBe("amn");
    expect(text(el.querySelector(".ui-amn__current-step"))).toBe("Compare");
    expect(text(el.querySelector(".ui-amn__clock"))).toBe("1:40");
    expect(text(el.querySelector(".ui-amn__cost"))).toBe("$0.42");
    expect(text(el.querySelector(".ui-amn__state"))).toBe("Running");
  });

  test("the clock reads hours past an hour", () => {
    expect(agentMonitorClock(3_725_000)).toBe("1:02:05");
    expect(agentMonitorClock(-5)).toBe("0:00");
  });

  test("the strip is sized by how long each step took, and full width", async () => {
    const el = await run();
    const [a, b] = segments(el);
    expect(segments(el)).toHaveLength(3);
    expect(b!.getBoundingClientRect().width).toBeGreaterThan(a!.getBoundingClientRect().width * 2);
    expect(text(b)).toContain("Search");
    expect(text(b)).toContain("Failed");
    expect(el.querySelector<HTMLElement>(".ui-amn__strip")!.getBoundingClientRect().width).toBeGreaterThan(0);
  });

  test("the list holds only finished steps, with the tool as a word", async () => {
    const el = await run();
    expect(stepRows(el).map((r) => r.dataset.step)).toEqual(["a", "b"]);
    expect(text(stepRows(el)[0]!.querySelector(".ui-amn__tool"))).toBe("Files");
    expect(el.querySelector(".ui-amn__tool img")).toBeNull();
  });

  test("a page's own icon can go with the tool", async () => {
    const icon = document.createElement("i");
    icon.className = "mine";
    const el = await fixture<TcAgentMonitor>(html`<tc-agent-monitor .now=${NOW} .steps=${[{ ...STEPS[0]!, toolIcon: icon }]}></tc-agent-monitor>`);
    expect(el.querySelector(".ui-amn__tool-icon .mine")).toBeTruthy();
  });

  test("picking in the strip or the list shows the detail, and Close goes back", async () => {
    const el = await run();
    const seen: AgentMonitorSelectedChange[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<AgentMonitorSelectedChange>).detail));
    segments(el)[0]!.click();
    await settle();
    expect(seen[0]!.selected).toBe("a");
    expect(text(el.querySelector(".ui-amn__detail"))).toContain("Two pages.");
    expect(segments(el)[0]!.getAttribute("aria-pressed")).toBe("true");
    el.querySelector<HTMLElement>(".ui-amn__close")!.click();
    await settle();
    expect(el.selected).toBeNull();
    await expect.poll(() => document.activeElement).toBe(segments(el)[0]);
    stepRows(el)[1]!.click();
    await settle();
    expect(el.selected).toBe("b");
    expect(text(el.querySelector(".ui-amn__detail-meta"))).toContain("Failed");
    key(stepRows(el)[1]!, "Escape");
    await settle();
    expect(el.selected).toBeNull();
    await expect.poll(() => document.activeElement).toBe(stepRows(el)[1]);
  });

  test("preventDefault keeps the selection", async () => {
    const el = await run();
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    segments(el)[0]!.click();
    await settle();
    expect(el.selected).toBeNull();
  });

  test("the strip and the list are one tab stop each, with arrow keys", async () => {
    const el = await run();
    expect(segments(el).filter((s) => s.tabIndex === 0)).toHaveLength(1);
    expect(stepRows(el).filter((s) => s.tabIndex === 0)).toHaveLength(1);
    segments(el)[0]!.focus();
    key(segments(el)[0]!, "ArrowRight");
    await expect.poll(() => document.activeElement).toBe(segments(el)[1]);
    key(segments(el)[1]!, "End");
    await expect.poll(() => document.activeElement).toBe(segments(el)[2]);
    stepRows(el)[0]!.focus();
    key(stepRows(el)[0]!, "ArrowDown");
    await expect.poll(() => document.activeElement).toBe(stepRows(el)[1]);
  });

  test("Pause and Resume change status unless prevented; Stop is the page's", async () => {
    const el = await run();
    const seen: AgentMonitorActionDetail[] = [];
    el.addEventListener("tc-action", (e) => seen.push((e as CustomEvent<AgentMonitorActionDetail>).detail));
    action(el, "pause")!.click();
    await settle();
    expect(el.status).toBe("paused");
    expect(action(el, "resume")).toBeTruthy();
    action(el, "resume")!.click();
    await settle();
    expect(el.status).toBe("running");
    action(el, "stop")!.click();
    await settle();
    expect(el.status).toBe("running");
    expect(seen.map((s) => s.action)).toEqual(["pause", "resume", "stop"]);
    el.addEventListener("tc-action", (e) => e.preventDefault());
    action(el, "pause")!.click();
    await settle();
    expect(el.status).toBe("running");
  });

  test("a finished run has no actions, and its clock stops at the last step", async () => {
    const steps = STEPS.slice(0, 2);
    const el = await fixture<TcAgentMonitor>(html`<tc-agent-monitor status="done" .now=${NOW + 500_000} .startedAt=${NOW - 100_000} .steps=${steps}></tc-agent-monitor>`);
    expect(action(el, "pause")).toBeNull();
    expect(action(el, "stop")).toBeNull();
    expect(text(el.querySelector(".ui-amn__clock"))).toBe("1:10");
    expect(text(el.querySelector(".ui-amn__current-step"))).toBe("No step running");
  });

  test('actions="false" only watches', async () => {
    const el = await fixture<TcAgentMonitor>(html`<tc-agent-monitor actions="false" .now=${NOW} .steps=${STEPS}></tc-agent-monitor>`);
    expect(el.querySelector(".ui-amn__actions")).toBeNull();
  });

  test("the clock ticks only while running, without `now`, and on screen", async () => {
    const started = Date.now() - 5000;
    const el = await fixture<TcAgentMonitor>(html`<tc-agent-monitor .startedAt=${started} .steps=${[]}></tc-agent-monitor>`);
    await expect.poll(() => el.ticking).toBe(true);
    const before = text(el.querySelector(".ui-amn__clock"));
    await expect.poll(() => text(el.querySelector(".ui-amn__clock")), { timeout: 4000 }).not.toBe(before);
    el.status = "done";
    await settle();
    expect(el.ticking).toBe(false);
    el.status = "running";
    await settle();
    await expect.poll(() => el.ticking).toBe(true);
    el.style.cssText = "position: absolute; top: 5000px";
    await expect.poll(() => el.ticking).toBe(false);
    el.style.cssText = "";
    await expect.poll(() => el.ticking).toBe(true);
    el.remove();
    expect(el.ticking).toBe(false);
    const fixed = await run();
    expect(fixed.ticking).toBe(false);
  });

  test("a bad currency still shows the number, and an empty run is fine", async () => {
    const el = await fixture<TcAgentMonitor>(html`<tc-agent-monitor currency="nope" .cost=${1}></tc-agent-monitor>`);
    expect(text(el.querySelector(".ui-amn__cost"))).toBe("1.00 nope");
    expect(el.querySelector(".ui-amn__strip")).toBeNull();
    expect(text(el.querySelector(".ui-amn__none"))).toContain("No steps finished");
  });

  test("nothing spills out when narrow", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 260px"><tc-agent-monitor .now=${NOW} .startedAt=${NOW - 100_000} .cost=${0.42} .steps=${STEPS}></tc-agent-monitor></div>`);
    const card = wrap.querySelector<HTMLElement>(".ui-amn__card")!;
    expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth + 1);
  });
});

describe("React", () => {
  test("an uncontrolled selection survives, and a controlled one stays", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const node = (extra = {}) => React.createElement(AgentMonitor, { name: "Reader", now: NOW, steps: STEPS, ...extra });
    await act(async () => root.render(node()));
    await settle();
    const el = host.querySelector<TcAgentMonitor>("tc-agent-monitor")!;
    await act(async () => segments(el)[0]!.click());
    await act(async () => root.render(node()));
    await settle();
    expect(el.selected).toBe("a");
    await act(async () => root.render(node({ selected: "b" })));
    await settle();
    await act(async () => segments(el)[0]!.click());
    await settle();
    expect(el.selected).toBe("b");
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas`}><tc-agent-monitor name="Reader" .now=${NOW} .startedAt=${NOW - 100_000} .cost=${0.42} .steps=${STEPS} selected="a"></tc-agent-monitor></div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
