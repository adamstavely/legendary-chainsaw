/*
 * <tc-live-session> in real browsers: the stream, the plan and the context meter it composes, picking an agent
 * (tc-agent-change and preventDefault) pointing at its steps and its messages, the stream's own tabs picking here too,
 * narrow layout, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/live-session";
import type { LiveSessionAgentChange, LiveSessionStep, TcLiveSession } from "../../src/elements/live-session";
import type { CollabMessage, CollabParticipant, TcCollaborationStream } from "../../src/elements/collaboration-stream";
import type { TcSegmentedControl } from "../../src/elements/segmented-control";
import { LiveSession } from "../../src/elements/react/live-session";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const T = Date.UTC(2026, 10, 14, 9, 0);
const TEAM: CollabParticipant[] = [
  { id: "you", name: "You", kind: "person" },
  { id: "planner", name: "Planner", kind: "agent" },
  { id: "translator", name: "Translator", kind: "agent" },
];
const MESSAGES: CollabMessage[] = [
  { id: "m1", from: "planner", to: "everyone", at: T - 60_000, text: "41 stops change." },
  { id: "m2", from: "translator", to: "everyone", at: T - 30_000, text: "Spanish is done." },
];
const STEPS: LiveSessionStep[] = [
  { id: "s1", title: "List the stops", agentId: "planner", status: "done" },
  { id: "s2", title: "Translate", agentId: "translator", status: "active", detail: "Spanish done" },
  { id: "s3", title: "Vietnamese", agentId: "translator", status: "failed" },
  { id: "s4", title: "Print", status: "pending" },
];

const make = (look: "standard" | "clean" = "standard", width = 1000) =>
  fixture<TcLiveSession>(html`<tc-live-session look=${look} style=${`width: ${width}px`} .participants=${TEAM} .messages=${MESSAGES} .steps=${STEPS} .context=${0.62} context-text="124k of 200k tokens"></tc-live-session>`);
const text = (el: Element | null) => el?.textContent!.replace(/\s+/g, " ").trim();
const seg = (el: Element) => el.querySelector<TcSegmentedControl>("tc-segmented-control")!;
const pick = (s: Element, value: string) => s.dispatchEvent(new CustomEvent("tc-value-change", { detail: { value }, bubbles: true, composed: true, cancelable: true }));
const stream = (el: Element) => el.querySelector<TcCollaborationStream>("tc-collaboration-stream")!;
const highlights = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-lses__step")].map((s) => s.dataset.highlight);

describe("tc-live-session", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the stream, the plan with its progress and the context meter`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("lses");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector("h2")!.textContent).toBe("Live session");
      expect(seg(el).options.map((o) => o.label)).toEqual(["Whole team", "Planner", "Translator"]);
      expect(seg(el).value).toBe("*");
      expect(stream(el).messages.length).toBe(2);
      expect(stream(el).getAttribute("look")).toBe(look);
      expect(text(el.querySelector(".ui-lses__progress"))).toBe("1 of 4 done");
      expect([...el.querySelectorAll(".ui-lses__step-title")].map((t) => text(t))).toEqual(["List the stops, Done", "Translate, In progress", "Vietnamese, Failed", "Print, Up next"]);
      expect([...el.querySelectorAll(".ui-lses__chip")].map((c) => text(c))).toEqual(["Planner", "Translator", "Translator"]);
      expect(highlights(el)).toEqual(["none", "none", "none", "none"]);
      expect(el.querySelector('tc-meter-row [role="meter"]')!.getAttribute("aria-valuenow")).toBe("0.62");
    });
  }

  test("picking an agent points at its steps and its messages", async () => {
    const el = await make();
    const seen: LiveSessionAgentChange[] = [];
    el.addEventListener("tc-agent-change", (e) => seen.push((e as CustomEvent<LiveSessionAgentChange>).detail));
    pick(seg(el), "translator");
    await settle();
    expect(seen.map((d) => [d.agent, d.participant?.name])).toEqual([["translator", "Translator"]]);
    expect(el.agent).toBe("translator");
    expect(highlights(el)).toEqual(["off", "on", "on", "off"]);
    expect(text(el.querySelector(".ui-lses__focus"))).toBe("Translator: 2 steps");
    expect(stream(el).filter).toBe("translator");
    pick(seg(el), "*");
    await settle();
    expect(el.agent).toBeNull();
    expect(stream(el).filter).toBe("everyone");
    expect(el.querySelector(".ui-lses__focus")).toBeNull();
  });

  test("a prevented pick keeps the agent", async () => {
    const el = await make();
    el.addEventListener("tc-agent-change", (e) => e.preventDefault());
    pick(seg(el), "planner");
    await settle();
    expect(el.agent).toBeNull();
    expect(highlights(el)).toEqual(["none", "none", "none", "none"]);
  });

  test("an agent's tab in the stream picks it here too", async () => {
    const el = await make();
    const tab = [...el.querySelectorAll<HTMLButtonElement>(".ui-cls__tab")].find((t) => t.textContent!.includes("Planner"))!;
    tab.click();
    await expect.poll(() => el.agent).toBe("planner");
    await expect.poll(() => seg(el).value).toBe("planner");
    expect(highlights(el)).toEqual(["on", "off", "off", "off"]);
  });

  test("the page sets the agent", async () => {
    const el = await make();
    el.agent = "planner";
    await settle();
    expect(stream(el).filter).toBe("planner");
    expect(highlights(el)[0]).toBe("on");
  });

  test("narrow: the plan goes under the stream, no page scroll", async () => {
    const el = await make("standard", 380);
    const s = stream(el).getBoundingClientRect();
    const plan = el.querySelector(".ui-lses__plan")!.getBoundingClientRect();
    expect(plan.top).toBeGreaterThanOrEqual(s.bottom - 1);
    expect(el.scrollWidth).toBeLessThanOrEqual(381);
  });

  test("React wrapper: a controlled agent stays until the parent changes it; uncontrolled from defaultAgent", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: (string | null)[] = [];
    await act(async () => root.render(React.createElement(LiveSession, { participants: TEAM, messages: MESSAGES, steps: STEPS, agent: null, onAgentChange: (a) => void seen.push(a) })));
    await settle();
    const el = host.querySelector("tc-live-session")!;
    await act(async () => void pick(seg(el), "planner"));
    await settle();
    expect(seen).toEqual(["planner"]);
    expect(el.agent).toBeNull();
    await act(async () => root.render(React.createElement(LiveSession, { key: "u", participants: TEAM, messages: MESSAGES, steps: STEPS, defaultAgent: "translator", title: "Notice" })));
    await settle();
    const el2 = host.querySelector("tc-live-session")!;
    expect(el2.agent).toBe("translator");
    expect(el2.heading).toBe("Notice");
    await act(async () => void pick(seg(el2), "planner"));
    await act(async () => root.render(React.createElement(LiveSession, { key: "u", participants: TEAM, messages: MESSAGES, steps: STEPS, defaultAgent: "translator", title: "Notice!" })));
    await settle();
    expect(el2.agent).toBe("planner");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; width: 1000px; background: var(--tc-surface-base)">
        <tc-live-session agent="translator" .participants=${TEAM} .messages=${MESSAGES} .steps=${STEPS} .context=${0.62}></tc-live-session>
        <tc-live-session look="clean" .participants=${TEAM} .messages=${MESSAGES} .steps=${STEPS} .context=${0.9}></tc-live-session>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
