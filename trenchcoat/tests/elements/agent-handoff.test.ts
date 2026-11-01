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
import { agentHandoffId, type AgentHandoffItemSelectedChange, type AgentHandoffLink, type AgentHandoffQueue, type AgentHandoffSelectedChange, type AgentHandoffStep, type TcAgentHandoff } from "../../src/elements/agent-handoff";
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

const QUEUES: AgentHandoffQueue[] = [
  { from: "a", to: "b", items: [{ id: "i1", title: "One", detail: "12 sources", status: "Moving" }] },
  { from: "b", to: "c", items: [{ id: "i2", title: "Two", warning: "2 claims unchecked" }, { id: "i3", title: "Three" }] },
];
const RICH: AgentHandoffStep[] = [{ ...STEPS[0]!, model: "Model A", cost: 1.37, activity: "Reading" }, STEPS[1]!, STEPS[2]!];
const pipeline = () => fixture<TcAgentHandoff>(html`<tc-agent-handoff view="pipeline" locale="en-US" .steps=${RICH} .handoffs=${HANDOFFS} .queues=${QUEUES}></tc-agent-handoff>`);
const items = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-agh__item")];

describe("tc-agent-handoff pipeline", () => {
  test("chain stays the default, and shows the agent's model, cost and activity", async () => {
    const el = await fixture<TcAgentHandoff>(html`<tc-agent-handoff locale="en-US" .steps=${RICH} .handoffs=${HANDOFFS} .queues=${QUEUES}></tc-agent-handoff>`);
    expect(el.view).toBe("chain");
    expect(el.querySelector(".ui-agh__pipeline")).toBeNull();
    expect(items(el)).toHaveLength(0);
    expect(text(el.querySelector(".ui-agh__meta"))).toBe("Model A · $1.37");
    expect(text(el.querySelector(".ui-agh__activity"))).toBe("Reading");
  });

  test("the currency and an icon from the page are used", async () => {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const steps = [{ ...RICH[0]!, icon }, STEPS[1]!];
    const el = await fixture<TcAgentHandoff>(html`<tc-agent-handoff view="pipeline" currency="EUR" locale="en-US" .steps=${steps} .handoffs=${[HANDOFFS[0]!]}></tc-agent-handoff>`);
    expect(text(el.querySelector(".ui-agh__meta"))).toContain("€1.37");
    expect(el.querySelector(".ui-agh__icon svg")).toBeTruthy();
    expect(el.querySelector(".ui-agh__icon")!.getAttribute("aria-hidden")).toBe("true");
  });

  test("a bad currency doesn't break it", async () => {
    const el = await fixture<TcAgentHandoff>(html`<tc-agent-handoff currency="nope" .steps=${RICH}></tc-agent-handoff>`);
    expect(text(el.querySelector(".ui-agh__meta"))).toContain("1.37");
  });

  test("agents and queues run in order, with counts, warnings in words and the total lost", async () => {
    const el = await pipeline();
    const parts = [...el.querySelector(".ui-agh__pipeline")!.children].map((c) => c.className);
    expect(parts).toEqual(["ui-agh__stage", "ui-agh__queue", "ui-agh__stage", "ui-agh__queue", "ui-agh__stage"]);
    expect([...el.querySelectorAll(".ui-agh__queue-count")].map(text)).toEqual(["1 waiting", "2 waiting"]);
    expect(text(el.querySelector(".ui-agh__warning"))).toBe("Warning: 2 claims unchecked");
    expect(text(el.querySelector(".ui-agh__total"))).toBe("2 lost along the way");
    expect(text(el.querySelector(".ui-agh__item-detail"))).toBe("12 sources");
    expect(text(el.querySelector(".ui-agh__item-status"))).toBe("Moving");
  });

  test("a queue's edges fall on its agents' centres, at any width", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 900px"><tc-agent-handoff view="pipeline" .steps=${STEPS} .handoffs=${HANDOFFS} .queues=${QUEUES}></tc-agent-handoff></div>`);
    const check = () => {
      const stages = [...wrap.querySelectorAll(".ui-agh__stage")].map((s) => s.getBoundingClientRect());
      const wires = [...wrap.querySelectorAll(".ui-agh__wire")].map((s) => s.getBoundingClientRect());
      wires.forEach((w, i) => {
        expect(Math.abs(w.left - (stages[i]!.left + stages[i]!.width / 2))).toBeLessThan(2);
        expect(Math.abs(w.right - (stages[i + 1]!.left + stages[i + 1]!.width / 2))).toBeLessThan(2);
      });
    };
    check();
    wrap.style.width = "1300px";
    await settle();
    check();
  });

  test("a queue's header opens that handoff's carried and lost lists", async () => {
    const el = await pipeline();
    const seen: AgentHandoffSelectedChange[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<AgentHandoffSelectedChange>).detail));
    links(el)[1]!.click();
    await settle();
    expect(el.selected).toBe("b>c");
    expect(seen[0]!.handoff).toEqual(HANDOFFS[1]);
    expect(text(el.querySelector(".ui-agh__queue .ui-agh__detail"))).toContain("A caveat");
    expect(links(el)[1]!.getAttribute("aria-expanded")).toBe("true");
  });

  test("clicking a line does the same", async () => {
    const el = await pipeline();
    el.querySelector<HTMLElement>(".ui-agh__wire")!.click();
    await settle();
    expect(el.selected).toBe("a>b");
  });

  test("the headers are one tab stop, and the arrows move across", async () => {
    const el = await pipeline();
    expect(links(el).filter((l) => l.tabIndex === 0)).toHaveLength(1);
    links(el)[0]!.focus();
    key(links(el)[0]!, "ArrowRight");
    await expect.poll(() => document.activeElement).toBe(links(el)[1]);
    key(links(el)[1]!, "ArrowLeft");
    await expect.poll(() => document.activeElement).toBe(links(el)[0]);
  });

  test("the items are one tab stop across the queues, and the keyboard moves through them", async () => {
    const el = await pipeline();
    expect(items(el).filter((i) => i.tabIndex === 0).map((i) => i.dataset.item)).toEqual(["i1"]);
    items(el)[0]!.focus();
    key(items(el)[0]!, "ArrowDown");
    await expect.poll(() => document.activeElement).toBe(items(el)[1]);
    key(items(el)[1]!, "End");
    await expect.poll(() => document.activeElement).toBe(items(el)[2]);
    key(items(el)[2]!, "Home");
    await expect.poll(() => document.activeElement).toBe(items(el)[0]);
    expect(items(el).filter((i) => i.tabIndex === 0)).toHaveLength(1);
  });

  test("picking an item reports it, a second click clears it, and Escape clears it", async () => {
    const el = await pipeline();
    const seen: AgentHandoffItemSelectedChange[] = [];
    el.addEventListener("tc-item-selected-change", (e) => seen.push((e as CustomEvent<AgentHandoffItemSelectedChange>).detail));
    items(el)[1]!.click();
    await settle();
    expect(el.itemSelected).toBe("i2");
    expect(seen[0]).toEqual({ itemSelected: "i2", item: QUEUES[1]!.items[0] });
    expect(items(el)[1]!.getAttribute("aria-pressed")).toBe("true");
    items(el)[1]!.click();
    await settle();
    expect(el.itemSelected).toBeNull();
    items(el)[2]!.click();
    await settle();
    key(items(el)[2]!, "Escape");
    await settle();
    expect(el.itemSelected).toBeNull();
  });

  test("preventDefault keeps the picked item, and an item that goes away is cleared", async () => {
    const el = await pipeline();
    items(el)[0]!.click();
    await settle();
    expect(el.itemSelected).toBe("i1");
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener("tc-item-selected-change", stop);
    items(el)[1]!.click();
    await settle();
    expect(el.itemSelected).toBe("i1");
    el.removeEventListener("tc-item-selected-change", stop);
    el.queues = [QUEUES[1]!];
    await settle();
    expect(el.itemSelected).toBeNull();
  });

  test("an empty queue and a pair with no handoff still read sensibly", async () => {
    const el = await fixture<TcAgentHandoff>(html`<tc-agent-handoff view="pipeline" .steps=${STEPS} .handoffs=${[HANDOFFS[0]!]}></tc-agent-handoff>`);
    expect(text(el.querySelector(".ui-agh__queue-empty"))).toBe("Nothing waiting.");
    expect(text(el.querySelector(".ui-agh__queue-plain"))).toContain("0 waiting");
    expect(links(el)).toHaveLength(1);
  });

  test("one agent, or none, doesn't break it", async () => {
    const one = await fixture<TcAgentHandoff>(html`<tc-agent-handoff view="pipeline" .steps=${[STEPS[0]!]}></tc-agent-handoff>`);
    expect(one.querySelectorAll(".ui-agh__queue")).toHaveLength(0);
    const none = await fixture<TcAgentHandoff>(html`<tc-agent-handoff view="pipeline"></tc-agent-handoff>`);
    expect(none.querySelector(".ui-agh__empty")).toBeTruthy();
  });

  test("when narrow it stacks in order, without the lines or any overflow", async () => {
    const wrap = await fixture<HTMLElement>(html`<div style="width: 320px"><tc-agent-handoff view="pipeline" .steps=${RICH} .handoffs=${HANDOFFS} .queues=${QUEUES}></tc-agent-handoff></div>`);
    const list = wrap.querySelector<HTMLElement>(".ui-agh__pipeline")!;
    expect(getComputedStyle(list).gridTemplateColumns.split(" ")).toHaveLength(1);
    expect(getComputedStyle(wrap.querySelector(".ui-agh__wire")!).display).toBe("none");
    expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth + 1);
    const tops = [...list.children].map((c) => c.getBoundingClientRect().top);
    expect(tops).toEqual([...tops].sort((a, b) => a - b));
  });

  test("axe: pipeline, with a handoff open and an item picked, in both looks and themes", async () => {
    for (const look of ["standard", "clean"]) {
      for (const scheme of ["light", "dark"]) {
        const wrap = await fixture<HTMLElement>(html`<div data-look=${look} style=${`color-scheme: ${scheme}; background: Canvas`}><tc-agent-handoff view="pipeline" .selected=${"b>c"} item-selected="i2" .steps=${RICH} .handoffs=${HANDOFFS} .queues=${QUEUES}></tc-agent-handoff></div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${look} ${scheme} ${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
        wrap.remove();
      }
    }
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
  test("items: uncontrolled survives re-rendering, and controlled stays until the parent changes it", async () => {
    const node = () => React.createElement(AgentHandoff, { view: "pipeline", steps: STEPS, handoffs: HANDOFFS, queues: QUEUES, defaultItemSelected: "i1" });
    const first = await mount(node());
    const one = first.host.querySelector<TcAgentHandoff>("tc-agent-handoff")!;
    expect(one.itemSelected).toBe("i1");
    await act(async () => items(one)[1]!.click());
    await act(async () => first.root.render(node()));
    await settle();
    expect(one.itemSelected).toBe("i2");
    await act(async () => first.root.unmount());
    first.host.remove();
    const seen: (string | null)[] = [];
    const second = await mount(React.createElement(AgentHandoff, { view: "pipeline", steps: STEPS, handoffs: HANDOFFS, queues: QUEUES, itemSelected: null, onItemSelectedChange: (i: string | null) => seen.push(i) }));
    const two = second.host.querySelector<TcAgentHandoff>("tc-agent-handoff")!;
    await act(async () => items(two)[0]!.click());
    await settle();
    expect(seen).toEqual(["i1"]);
    expect(two.itemSelected).toBeNull();
    await act(async () => second.root.unmount());
    second.host.remove();
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
