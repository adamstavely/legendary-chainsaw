/*
 * <tc-agent-trail> in real browsers: the count, marks and words, sub-steps and timers, the decision, folding, the
 * announcement, the timer stopping, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/agent-trail";
import { agentTrailClock, type AgentTrailCollapsedChange, type AgentTrailDecisionDetail, type AgentTrailStep, type TcAgentTrail } from "../../src/elements/agent-trail";
import { AgentTrail } from "../../src/elements/react/agent-trail";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const NOW = 1_000_000;
const STEPS: AgentTrailStep[] = [
  { id: "a", title: "Reproduce", status: "done", started: NOW - 300_000, ended: NOW - 240_000 },
  { id: "b", title: "Find the cause", status: "done", started: NOW - 240_000, ended: NOW - 120_000 },
  {
    id: "c",
    title: "Write the fix",
    status: "running",
    started: NOW - 120_000,
    detail: "Patching the parser",
    substeps: [
      { id: "c1", title: "Patch", status: "done", started: NOW - 120_000, ended: NOW - 65_000 },
      { id: "c2", title: "Add tests", status: "running", started: NOW - 65_000 },
      { id: "c3", title: "Run suite", status: "pending" },
    ],
  },
  { id: "d", title: "Open the PR", status: "pending" },
  { id: "e", title: "Changelog", status: "pending" },
];
const WAITING: AgentTrailStep[] = STEPS.map((s) => (s.id === "c" ? { ...s, status: "done", ended: NOW - 10_000 } : s.id === "d" ? { ...s, status: "waiting", detail: "Opens #482" } : s));
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const trail = (steps = STEPS) => fixture<TcAgentTrail>(html`<tc-agent-trail heading="Fix it" .now=${NOW} .steps=${steps}></tc-agent-trail>`);
const step = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-atr__step[data-step="${id}"]`)!;

describe("tc-agent-trail", () => {
  for (const look of ["standard", "clean"]) {
    test(`renders in ${look}: the count, a named ordered list and the header`, async () => {
      const wrap = await fixture<HTMLElement>(html`<div><tc-agent-trail look=${look} heading="Fix it" .now=${NOW} .steps=${STEPS}></tc-agent-trail></div>`);
      const el = wrap.querySelector<TcAgentTrail>("tc-agent-trail")!;
      expect(el.dataset.ui).toBe("atr");
      expect(el.dataset.look).toBe(look);
      expect(text(el.querySelector(".ui-atr__count"))).toBe("2/5 steps done");
      const list = el.querySelector("ol.ui-atr__trail")!;
      expect(document.getElementById(list.getAttribute("aria-labelledby")!)!.textContent).toBe("Fix it");
      expect(el.querySelectorAll(".ui-atr__step")).toHaveLength(5);
    });
  }

  test("done steps show how long they took; the current one its detail, sub-steps and a live timer", async () => {
    const el = await trail();
    expect(text(step(el, "a").querySelector(".ui-atr__time"))).toBe("1m 00s");
    expect(step(el, "a").querySelector(".ui-atr__mark svg")).toBeTruthy();
    expect(step(el, "c").hasAttribute("data-current")).toBe(true);
    expect(text(step(el, "c").querySelector(".ui-atr__detail"))).toBe("Patching the parser");
    expect(text(step(el, "c").querySelector(".ui-atr__word"))).toBe("Working");
    const subs = step(el, "c").querySelectorAll(".ui-atr__sub");
    expect(subs).toHaveLength(3);
    expect(text(subs[1]!.querySelector(".ui-atr__timer"))).toBe("1:05");
    expect(step(el, "c").querySelector(".ui-atr__light")).toBeTruthy();
    // Upcoming steps carry their word for screen readers only
    expect(text(step(el, "d"))).toContain("Up next");
    expect(step(el, "d").querySelector<HTMLElement>(".ui-atr__word")!.hidden).toBe(true);
    expect(step(el, "d").querySelector(".ui-atr__subs")).toBeNull();
  });

  test("the clock reads hours past an hour", () => {
    expect(agentTrailClock(3_725_000)).toBe("1:02:05");
    expect(agentTrailClock(-1)).toBe("0:00");
  });

  test("a waiting step asks for a decision; approving runs it, declining fails it", async () => {
    const el = await trail(WAITING);
    const waiting = step(el, "d");
    expect(text(waiting.querySelector(".ui-atr__word"))).toBe("Needs your OK");
    expect(waiting.querySelector(".ui-atr__mark")!.getAttribute("data-status")).toBe("waiting");
    const seen: AgentTrailDecisionDetail[] = [];
    el.addEventListener("tc-decision", (e) => seen.push((e as CustomEvent<AgentTrailDecisionDetail>).detail));
    const approve = waiting.querySelector<HTMLButtonElement>('[data-decision="approve"]')!;
    expect(text(approve)).toBe("Approve: Open the PR");
    approve.click();
    await settle();
    expect(seen[0]).toMatchObject({ decision: "approve", step: { id: "d" } });
    expect(el.steps.find((s) => s.id === "d")!.status).toBe("running");

    const other = await trail(WAITING);
    step(other, "d").querySelector<HTMLButtonElement>('[data-decision="decline"]')!.click();
    await settle();
    expect(other.steps.find((s) => s.id === "d")).toMatchObject({ status: "failed", detail: "Declined" });
    expect(text(step(other, "d").querySelector(".ui-atr__word"))).toBe("Failed");
  });

  test("a prevented decision leaves the step as it was", async () => {
    const el = await trail(WAITING);
    el.addEventListener("tc-decision", (e) => e.preventDefault());
    step(el, "d").querySelector<HTMLButtonElement>('[data-decision="approve"]')!.click();
    await settle();
    expect(el.steps.find((s) => s.id === "d")!.status).toBe("waiting");
  });

  test("Hide steps folds the trail, and a prevented change keeps it open", async () => {
    const el = await trail();
    const toggle = el.querySelector<HTMLButtonElement>(".ui-atr__toggle")!;
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(el.querySelector(`#${toggle.getAttribute("aria-controls")}`)).toBeTruthy();
    const seen: AgentTrailCollapsedChange[] = [];
    el.addEventListener("tc-collapsed-change", (e) => seen.push((e as CustomEvent<AgentTrailCollapsedChange>).detail));
    toggle.click();
    await settle();
    expect(seen).toEqual([{ collapsed: true }]);
    expect(el.collapsed).toBe(true);
    expect(el.querySelector<HTMLElement>(".ui-atr__card")!.hidden).toBe(true);
    expect(text(toggle)).toBe("Show steps");
    el.addEventListener("tc-collapsed-change", (e) => e.preventDefault());
    toggle.click();
    await settle();
    expect(el.collapsed).toBe(true);
  });

  test("moving on is announced, but not the first render", async () => {
    const el = await trail();
    const status = el.querySelector('[role="status"]')!;
    expect(text(status)).toBe("");
    el.steps = WAITING;
    await settle();
    expect(text(status)).toBe("Now: Open the PR, Needs your OK");
  });

  test("renamed words, and an empty trail", async () => {
    const el = await fixture<TcAgentTrail>(html`<tc-agent-trail .steps=${[]} .labels=${{ empty: "Nothing yet" }}></tc-agent-trail>`);
    expect(text(el.querySelector(".ui-atr__none"))).toBe("Nothing yet");
    expect(el.querySelector(".ui-atr__toggle")).toBeNull();
    const renamed = await fixture<TcAgentTrail>(html`<tc-agent-trail .now=${NOW} .steps=${WAITING} .labels=${{ waiting: "Waiting on you" }}></tc-agent-trail>`);
    expect(text(step(renamed, "d").querySelector(".ui-atr__word"))).toBe("Waiting on you");
  });

  test("the timer ticks only while something runs, without `now`, on screen and open", async () => {
    const started = Date.now() - 5000;
    const el = await fixture<TcAgentTrail>(html`<tc-agent-trail .steps=${[{ id: "x", title: "Work", status: "running", started }]}></tc-agent-trail>`);
    await expect.poll(() => el.ticking).toBe(true);
    const before = text(el.querySelector(".ui-atr__timer"));
    await expect.poll(() => text(el.querySelector(".ui-atr__timer")), { timeout: 4000 }).not.toBe(before);
    el.collapsed = true;
    await settle();
    expect(el.ticking).toBe(false);
    el.collapsed = false;
    await settle();
    await expect.poll(() => el.ticking).toBe(true);
    el.remove();
    expect(el.ticking).toBe(false);
    const fixed = await trail();
    expect(fixed.ticking).toBe(false);
  });

  test("nothing spills out when narrow", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 240px"><tc-agent-trail heading="A long task name that wraps" .now=${NOW} .steps=${WAITING}></tc-agent-trail></div>`);
    const card = wrap.querySelector<HTMLElement>(".ui-atr__card")!;
    expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth + 1);
  });
});

describe("React", () => {
  test("an uncontrolled fold survives re-renders, and a controlled one stays", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const node = (extra = {}) => React.createElement(AgentTrail, { title: "Fix it", now: NOW, steps: STEPS, ...extra });
    await act(async () => root.render(node()));
    await settle();
    const el = host.querySelector<TcAgentTrail>("tc-agent-trail")!;
    expect(el.heading).toBe("Fix it");
    await act(async () => el.querySelector<HTMLElement>(".ui-atr__toggle")!.click());
    await act(async () => root.render(node()));
    await settle();
    expect(el.collapsed).toBe(true);
    await act(async () => root.render(node({ collapsed: false })));
    await settle();
    await act(async () => el.querySelector<HTMLElement>(".ui-atr__toggle")!.click());
    await settle();
    expect(el.collapsed).toBe(false);
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas`}><tc-agent-trail look=${look} heading="Fix it" .now=${NOW} .steps=${WAITING}></tc-agent-trail><tc-agent-trail look=${look} heading="Fix it" .now=${NOW} .steps=${STEPS}></tc-agent-trail></div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
