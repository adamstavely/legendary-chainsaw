/*
 * <tc-agent-fleet> in real browsers – structure in both looks, the fleet and each branch summed up in words, opening
 * a card's tree beside it (or under it when narrow), Answer, the roving keyboard, controlled use, the clock, the
 * React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/agent-fleet";
import { fleetBranchSummary, type AgentFleetAnswer, type AgentFleetOpenChange, type FleetAgent, type TcAgentFleet } from "../../src/elements/agent-fleet";
import { AgentFleet } from "../../src/elements/react/agent-fleet";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

const NOW = 1_000_000_000;
const FLEET: FleetAgent[] = [
  {
    id: "report",
    name: "Report lead",
    model: "Opus 5.5",
    task: "Prepare the report",
    status: "running",
    cost: 1,
    started: NOW - 14 * 60_000,
    children: [
      { id: "r1", name: "Researcher", task: "Collect", status: "done", cost: 0.25 },
      { id: "r2", name: "Writer", task: "Draft", status: "running", cost: 0.25 },
      { id: "r3", name: "Checker", task: "Check", status: "waiting", ask: "Which years?" },
    ],
  },
  {
    id: "data",
    name: "Data lead",
    task: "Load uploads",
    status: "running",
    cost: 0.5,
    children: [
      { id: "d1", name: "Uploader", task: "Load", status: "running" },
      { id: "d2", name: "Validator", task: "Validate", status: "done" },
    ],
  },
  { id: "archive", name: "Archive curator", task: "File sheets", status: "done", cost: 0.75, started: NOW - 60_000, ended: NOW, children: [{ id: "a1", name: "Filer", task: "File", status: "done" }] },
];
type ReactFleet = React.ComponentProps<typeof AgentFleet>["agents"];
const cards = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-flt__main")];
const card = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-flt__card[data-id="${id}"]`)!;

describe("tc-agent-fleet", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: host, the fleet in numbers, a card per agent, one tab stop`, async () => {
      const el = await fixture<TcAgentFleet>(html`<tc-agent-fleet look=${look} style="width: 900px" .agents=${FLEET} now=${NOW}></tc-agent-fleet>`);
      expect(el.dataset.ui).toBe("flt");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".ui-flt__sum")!.textContent!.replace(/\s+/g, " ").trim()).toBe("3 agents / 6 sub-agents 4 running 1 needs you $2.75");
      expect(cards(el)).toHaveLength(3);
      expect(cards(el).filter((c) => c.tabIndex === 0)).toHaveLength(1);
      expect(card(el, "report").querySelector(".ui-flt__branch")!.textContent).toBe("1 needs you");
      expect(card(el, "data").querySelector(".ui-flt__branch")!.textContent).toBe("1/2 running");
      expect(card(el, "archive").querySelector(".ui-flt__branch")!.textContent).toBe("Done");
      expect(card(el, "report").querySelector(".ui-flt__cost")!.textContent!.replace(/\s+/g, " ").trim()).toBe("$1.50 · 14m 00s");
      expect(cards(el)[0].textContent!.replace(/\s+/g, " ").trim()).toBe("Report lead , Running, 1 needs you, 3 sub-agents");
    });
  }

  test("branch summaries in words", () => {
    const leaf = (status: FleetAgent["status"], i: number): FleetAgent => ({ id: `x${i}`, name: "x", task: "t", status });
    const of = (...s: FleetAgent["status"][]) => fleetBranchSummary({ id: "r", name: "r", task: "t", status: "running", children: s.map(leaf) }).text;
    expect(of()).toBe("No sub-agents");
    expect(of("done", "done", "done")).toBe("All 3 done");
    expect(of("running", "running", "done", "queued")).toBe("2/4 running");
    expect(of("failed", "running")).toBe("1 failed");
    expect(of("failed", "waiting")).toBe("1 needs you");
  });

  test("a click opens the card's tree beside the cards; another card swaps it; prevented keeps it", async () => {
    const seen: (string | null)[] = [];
    const el = await fixture<TcAgentFleet>(html`<tc-agent-fleet style="width: 900px" .agents=${FLEET} now=${NOW} @tc-open-change=${(e: CustomEvent<AgentFleetOpenChange>) => seen.push(e.detail.open)}></tc-agent-fleet>`);
    await expect.poll(() => el.hasAttribute("data-wide")).toBe(true);
    cards(el)[1].click();
    await settle();
    expect(seen).toEqual(["data"]);
    expect(el.open).toBe("data");
    expect(cards(el)[1].getAttribute("aria-expanded")).toBe("true");
    const panel = el.querySelector<HTMLElement>(".ui-flt__panel")!;
    expect(panel.parentElement!.classList.contains("ui-flt__body")).toBe(true);
    expect(cards(el)[1].getAttribute("aria-controls")).toBe(panel.id);
    const tree = panel.querySelector("tc-agent-tree")!;
    expect(tree.root.id).toBe("data");
    expect(tree.heading).toBe("Data lead");
    cards(el)[0].click();
    await settle();
    expect(el.querySelector("tc-agent-tree")!.root.id).toBe("report");
    expect(cards(el)[1].getAttribute("aria-expanded")).toBe("false");
    el.addEventListener("tc-open-change", (e) => e.preventDefault());
    cards(el)[0].click();
    await settle();
    expect(el.open).toBe("report");
  });

  test("narrow: the tree opens under its card", async () => {
    const el = await fixture<TcAgentFleet>(html`<tc-agent-fleet style="width: 420px" .agents=${FLEET} now=${NOW} .open=${"data"}></tc-agent-fleet>`);
    await expect.poll(() => el.hasAttribute("data-wide")).toBe(false);
    await settle();
    expect(el.querySelector(".ui-flt__panel")!.closest(".ui-flt__item")!.getAttribute("data-id")).toBe("data");
  });

  test("keyboard: arrows move, Home/End jump, Enter opens, Escape closes and returns focus", async () => {
    const el = await fixture<TcAgentFleet>(html`<tc-agent-fleet style="width: 900px" .agents=${FLEET} now=${NOW}></tc-agent-fleet>`);
    cards(el)[0].focus();
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(() => document.activeElement).toBe(cards(el)[1]);
    await userEvent.keyboard("{End}");
    await expect.poll(() => document.activeElement).toBe(cards(el)[2]);
    await userEvent.keyboard("{Home}");
    await expect.poll(() => document.activeElement).toBe(cards(el)[0]);
    expect(cards(el).map((c) => c.tabIndex)).toEqual([0, -1, -1]);
    await userEvent.keyboard("{Enter}");
    await settle();
    expect(el.open).toBe("report");
    el.querySelector<HTMLButtonElement>(".ui-flt__close")!.focus();
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(el.open).toBeNull();
    expect(document.activeElement).toBe(cards(el)[0]);
  });

  test("Answer fires tc-answer with who waits and opens the tree; prevented, it doesn't", async () => {
    const got: AgentFleetAnswer[] = [];
    const onAnswer = vi.fn();
    const el = await fixture<TcAgentFleet>(html`<tc-agent-fleet style="width: 900px" .agents=${FLEET} now=${NOW} .onAnswer=${onAnswer} @tc-answer=${(e: CustomEvent<AgentFleetAnswer>) => got.push(e.detail)}></tc-agent-fleet>`);
    expect(el.querySelectorAll(".ui-flt__answer")).toHaveLength(1);
    const answer = card(el, "report").querySelector<HTMLButtonElement>(".ui-flt__answer")!;
    expect(answer.textContent!.replace(/\s+/g, " ").trim()).toBe("Answer for Report lead");
    answer.click();
    await settle();
    expect(got[0].agent.id).toBe("report");
    expect(got[0].waiting.map((a) => a.id)).toEqual(["r3"]);
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(el.open).toBe("report");
    const other = await fixture<TcAgentFleet>(html`<tc-agent-fleet .agents=${FLEET} now=${NOW} @tc-answer=${(e: Event) => e.preventDefault()}></tc-agent-fleet>`);
    other.querySelector<HTMLButtonElement>(".ui-flt__answer")!.click();
    await settle();
    expect(other.open).toBeNull();
  });

  test("an open agent that leaves the fleet closes its tree; empty says so", async () => {
    const el = await fixture<TcAgentFleet>(html`<tc-agent-fleet .agents=${FLEET} now=${NOW} .open=${"data"}></tc-agent-fleet>`);
    expect(el.querySelector(".ui-flt__panel")).not.toBeNull();
    el.agents = FLEET.filter((a) => a.id !== "data");
    await settle();
    expect(el.querySelector(".ui-flt__panel")).toBeNull();
    el.agents = [];
    await settle();
    expect(el.querySelector(".ui-flt__empty")!.textContent).toBe("No agents running");
  });

  test("the internal clock runs only while something runs, and stops when the element leaves", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    const el = await fixture<TcAgentFleet>(html`<tc-agent-fleet .agents=${FLEET}></tc-agent-fleet>`);
    expect(vi.getTimerCount()).toBe(1);
    el.agents = [FLEET[2]];
    await settle();
    expect(vi.getTimerCount()).toBe(0);
    el.agents = FLEET;
    await settle();
    expect(vi.getTimerCount()).toBe(1);
    el.remove();
    expect(vi.getTimerCount()).toBe(0);
  });

  test("React wrapper: uncontrolled open survives re-renders; controlled stays put", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    let bump = () => {};
    const answered: string[] = [];
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(AgentFleet, { title: "Season", agents: FLEET, now: NOW, onAnswer: (a) => void answered.push(a.agent.id), "data-n": n } as React.ComponentProps<typeof AgentFleet>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-agent-fleet")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Season");
    cards(el)[2].click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.open).toBe("archive");
    el.querySelector<HTMLButtonElement>(".ui-flt__answer")!.click();
    expect(answered).toEqual(["report"]);

    const asked: (string | null)[] = [];
    await act(async () => root.render(React.createElement(AgentFleet, { agents: FLEET as ReactFleet, now: NOW, open: null, onOpenChange: (o) => void asked.push(o) })));
    await settle();
    const controlled = host.querySelector("tc-agent-fleet")!;
    cards(controlled)[0].click();
    await settle();
    expect(asked).toEqual(["report"]);
    expect(controlled.open).toBeNull();
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="width: 960px; padding: 16px; background: var(--tc-surface-base)">
        <tc-agent-fleet .agents=${FLEET} now=${NOW} .open=${"report"}></tc-agent-fleet>
        <tc-agent-fleet look="clean" .agents=${FLEET} now=${NOW}></tc-agent-fleet>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
