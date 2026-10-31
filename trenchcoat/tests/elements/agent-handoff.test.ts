/*
 * <tc-agent-handoff> in real browsers: the chain in order, what carried and what was lost, the total, opening handoffs by
 * click and keyboard, controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/agent-handoff";
import { agentHandoffId, type AgentHandoffLink, type AgentHandoffSelectedChange, type AgentHandoffStep, type TcAgentHandoff } from "../../src/elements/agent-handoff";
import { AgentHandoff } from "../../src/elements/react/agent-handoff";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const STEPS: AgentHandoffStep[] = [
  { id: "a", agent: "Scout", role: "Finds", status: "done", summary: "Found 48." },
  { id: "b", agent: "Reader", status: "done" },
  { id: "c", agent: "Writer", status: "running" },
];
const HANDOFFS: AgentHandoffLink[] = [
  { from: "a", to: "b", carried: ["Papers", "Terms"], lost: [] },
  { from: "b", to: "c", carried: ["Results"], lost: ["A caveat", "7 papers"] },
];
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const chain = () => fixture<TcAgentHandoff>(html`<tc-agent-handoff .steps=${STEPS} .handoffs=${HANDOFFS}></tc-agent-handoff>`);
const links = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-agh__link")];
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));

describe("tc-agent-handoff", () => {
  test("shows the chain in order, what's running in words, and the total lost", async () => {
    const el = await chain();
    expect(el.dataset.ui).toBe("agh");
    expect([...el.querySelectorAll(".ui-agh__agent")].map(text)).toEqual(["Scout", "Reader", "Writer"]);
    expect(text(el.querySelector('.ui-agh__status[data-status="running"]'))).toBe("Running now");
    expect(text(el.querySelector(".ui-agh__total"))).toBe("2 lost along the way");
    expect(text(links(el)[0])).toContain("Nothing lost");
    expect(text(links(el)[1])).toContain("2 lost");
    expect(text(links(el)[1])).toContain("1 carried over");
  });

  test("a chain that lost nothing says so", async () => {
    const el = await fixture<TcAgentHandoff>(html`<tc-agent-handoff .steps=${STEPS} .handoffs=${[HANDOFFS[0]!]}></tc-agent-handoff>`);
    expect(text(el.querySelector(".ui-agh__total"))).toBe("Nothing lost");
  });

  test("opening a handoff lists what carried and what was lost, and reports it", async () => {
    const el = await chain();
    const seen: AgentHandoffSelectedChange[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<AgentHandoffSelectedChange>).detail));
    links(el)[1]!.click();
    await settle();
    expect(seen[0]).toEqual({ selected: "b>c", handoff: HANDOFFS[1] });
    expect(links(el)[1]!.getAttribute("aria-expanded")).toBe("true");
    const detail = document.getElementById(links(el)[1]!.getAttribute("aria-controls")!)!;
    expect(text(detail)).toContain("Results");
    expect(text(detail.querySelector('[data-kind="lost"]'))).toContain("A caveat");
    links(el)[1]!.click();
    await settle();
    expect(el.selected).toBeNull();
    expect(el.querySelector(".ui-agh__detail")).toBeNull();
  });

  test("the handoffs are one tab stop, and the keyboard moves and closes", async () => {
    const el = await chain();
    expect(links(el).filter((l) => l.tabIndex === 0)).toHaveLength(1);
    links(el)[0]!.focus();
    key(links(el)[0]!, "ArrowDown");
    await expect.poll(() => document.activeElement).toBe(links(el)[1]);
    expect(links(el)[1]!.tabIndex).toBe(0);
    key(links(el)[1]!, "Home");
    await expect.poll(() => document.activeElement).toBe(links(el)[0]);
    key(links(el)[0]!, "End");
    await expect.poll(() => document.activeElement).toBe(links(el)[1]);
    links(el)[1]!.click();
    await settle();
    key(links(el)[1]!, "Escape");
    await settle();
    expect(el.selected).toBeNull();
  });

  test("preventDefault keeps the selection", async () => {
    const el = await chain();
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    links(el)[0]!.click();
    await settle();
    expect(el.selected).toBeNull();
  });

  test("a selected handoff that goes away is cleared", async () => {
    const el = await chain();
    el.selected = agentHandoffId(HANDOFFS[1]!);
    await settle();
    expect(el.querySelector(".ui-agh__detail")).toBeTruthy();
    el.handoffs = [HANDOFFS[0]!];
    await settle();
    expect(el.selected).toBeNull();
  });

  test("handles nothing carried, and an empty chain", async () => {
    const el = await fixture<TcAgentHandoff>(html`<tc-agent-handoff .steps=${STEPS} .handoffs=${[{ from: "a", to: "b", carried: [], lost: [] }]} .selected=${"a>b"}></tc-agent-handoff>`);
    expect(text(el.querySelector(".ui-agh__detail"))).toContain("Nothing carried over.");
    const none = await fixture<TcAgentHandoff>(html`<tc-agent-handoff></tc-agent-handoff>`);
    expect(text(none.querySelector(".ui-agh__empty"))).toContain("No agents");
  });

  test("nothing is cut off when narrow", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 240px"><tc-agent-handoff .steps=${STEPS} .handoffs=${HANDOFFS} .selected=${"b>c"}></tc-agent-handoff></div>`);
    const list = wrap.querySelector<HTMLElement>(".ui-agh__chain")!;
    expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth + 1);
  });
});

describe("React", () => {
  const mount = async (node: React.ReactElement) => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    await act(async () => root.render(node));
    await settle();
    return { host, root };
  };
  test("an uncontrolled selection survives the parent re-rendering", async () => {
    const node = () => React.createElement(AgentHandoff, { steps: STEPS, handoffs: HANDOFFS });
    const { host, root } = await mount(node());
    const el = host.querySelector<TcAgentHandoff>("tc-agent-handoff")!;
    await act(async () => links(el)[0]!.click());
    await act(async () => root.render(node()));
    await settle();
    expect(el.selected).toBe("a>b");
    await act(async () => root.unmount());
    host.remove();
  });
  test("a controlled selection stays until the parent changes it", async () => {
    const seen: (string | null)[] = [];
    const { host, root } = await mount(React.createElement(AgentHandoff, { steps: STEPS, handoffs: HANDOFFS, selected: null, onSelectedChange: (s: string | null) => seen.push(s) }));
    const el = host.querySelector<TcAgentHandoff>("tc-agent-handoff")!;
    await act(async () => links(el)[0]!.click());
    await settle();
    expect(seen).toEqual(["a>b"]);
    expect(el.selected).toBeNull();
    await act(async () => root.unmount());
    host.remove();
  });
});

describe("accessibility", () => {
  for (const look of ["standard", "clean"]) {
    for (const scheme of ["light", "dark"]) {
      test(`no axe violations, ${look} ${scheme}`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas`}><tc-agent-handoff .steps=${STEPS} .handoffs=${HANDOFFS} .selected=${"b>c"}></tc-agent-handoff></div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
      });
    }
  }
});
