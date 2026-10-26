/*
 * <tc-agent-graph> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/agent-graph";
import type { GraphCall, GraphNode, GraphPausedChange, GraphSelect, GraphSelectedChange, TcAgentGraph } from "../../src/elements/agent-graph";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

const nodes: GraphNode[] = [
  { id: "lead", name: "Lead", kind: "agent", lead: true },
  { id: "search", name: "Search", kind: "tool" },
];
const svgIcon = () => document.createElementNS("http://www.w3.org/2000/svg", "svg");
const team = (): GraphNode[] => [
  { id: "lead", name: "Lead", kind: "agent", lead: true, icon: svgIcon() },
  { id: "gh", name: "Git Hub", kind: "tool" },
  { id: "rev", name: "Reviewer", kind: "agent", status: "waiting", icon: svgIcon() },
];
const openCard = (el: Element) => el.querySelector('[role="dialog"]')?.getAttribute("aria-label") ?? null;
const nodeButton = (el: Element, name: RegExp) => [...el.querySelectorAll<HTMLButtonElement>("button[data-agg-node]")].find((b) => name.test(b.textContent!.trim()))!;
const wide = (t: ReturnType<typeof html>) => html`<div style="width: 640px">${t}</div>`;
const mount = async (t: ReturnType<typeof html>) => {
  const wrap = await fixture<HTMLDivElement>(wide(t));
  const el = wrap.querySelector<TcAgentGraph>("tc-agent-graph")!;
  // The first render measures the stage; the second draws the nodes
  await settle();
  return el;
};

for (const look of ["standard", "clean"] as const) {
  describe(`tc-agent-graph ${look}`, () => {
    test("the host is the root, with the look; the stage is a named group and the nodes are drawn", async () => {
      const el = await mount(html`<tc-agent-graph look=${look} heading="Crew" .nodes=${nodes} .edges=${[["lead", "search"]]} .now=${0}></tc-agent-graph>`);
      expect(el.dataset.ui).toBe("agg");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".ui-agg__title")!.textContent).toBe("Crew");
      expect(el.querySelector(".ui-agg__stage")!.getAttribute("aria-label")).toBe("Crew: 1 agents and 1 tools");
      expect(el.querySelectorAll(".ui-agg__node")).toHaveLength(2);
      expect(el.querySelector("path.ui-agg__edge")!.getAttribute("d")).toMatch(/^M/);
      expect(el.querySelector<HTMLElement>(".ui-agg__node")!.style.transform).toMatch(/translate3d/);
    });

    test("uncontrolled selection opens on click and reports both events", async () => {
      const onSelect = vi.fn();
      const onSelectedChange = vi.fn();
      const el = await mount(html`<tc-agent-graph
        look=${look}
        .nodes=${nodes}
        .edges=${[["lead", "search"]]}
        .now=${0}
        @tc-select=${(e: CustomEvent<GraphSelect>) => onSelect(e.detail.node)}
        @tc-selected-change=${(e: CustomEvent<GraphSelectedChange>) => onSelectedChange(e.detail.selected)}
      ></tc-agent-graph>`);
      el.querySelectorAll<HTMLButtonElement>(".ui-agg__node button")[0].click();
      await settle();
      expect(openCard(el)).toBe("Lead");
      expect(el.selected).toBe("lead");
      expect(onSelectedChange).toHaveBeenCalledWith("lead");
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "lead" }));
      // The card's Close button takes focus, as autoFocus did
      expect(document.activeElement).toBe(el.querySelector('[role="dialog"] button[aria-label="Close"]'));
    });

    test("controlled selection: a prevented change only reports; the property decides", async () => {
      const onSelectedChange = vi.fn();
      const el = await mount(html`<tc-agent-graph
        look=${look}
        .nodes=${nodes}
        .edges=${[["lead", "search"]]}
        .now=${0}
        @tc-selected-change=${(e: CustomEvent<GraphSelectedChange>) => {
          e.preventDefault();
          onSelectedChange(e.detail.selected);
        }}
      ></tc-agent-graph>`);
      el.querySelectorAll<HTMLButtonElement>(".ui-agg__node button")[0].click();
      await settle();
      expect(onSelectedChange).toHaveBeenCalledWith("lead");
      expect(openCard(el)).toBeNull();
      el.selected = "search";
      await settle();
      expect(openCard(el)).toBe("Search");
    });

    test("a selected node that goes away closes its card, reported once", async () => {
      const onChange = vi.fn();
      const el = await mount(html`<tc-agent-graph look=${look} .nodes=${nodes} .now=${0} selected="search" @tc-selected-change=${(e: CustomEvent<GraphSelectedChange>) => onChange(e.detail)}></tc-agent-graph>`);
      expect(openCard(el)).toBe("Search");
      el.nodes = nodes.slice(0, 1);
      await settle();
      el.nodes = nodes.slice(0, 1);
      await settle();
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({ selected: null, removed: true });
      expect(openCard(el)).toBeNull();
    });

    test("without `now` the clock is read while connected, and stops when removed", async () => {
      vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"], now: new Date("2026-10-24T12:00:00Z") });
      const at = Date.now();
      const calls: GraphCall[] = [{ id: "c1", from: "lead", to: "search", at: at - 1000 }];
      const el = await mount(html`<tc-agent-graph look=${look} .nodes=${nodes} .calls=${calls}></tc-agent-graph>`);
      vi.advanceTimersByTime(1100);
      await settle();
      expect(el.querySelector(".ui-agg__sum")!.textContent).toMatch(/1\s*calls\/min/);
      el.remove();
      expect(vi.getTimerCount()).toBe(0);
    });

    test("a new call sends a pulse along its link; paused, it lights the link instead", async () => {
      const el = await mount(html`<tc-agent-graph look=${look} .nodes=${nodes} .edges=${[["lead", "search"]]} .now=${1000}></tc-agent-graph>`);
      el.calls = [{ id: "c1", from: "lead", to: "search", at: 1000, status: "pending" }];
      await settle();
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      expect(el.querySelector(".ui-agg__pulse")).toBeTruthy();
      expect(el.querySelector("path.ui-agg__edge")!.hasAttribute("data-live")).toBe(true);
      el.paused = true;
      el.calls = [...el.calls, { id: "c2", from: "lead", to: "search", at: 1000, status: "ok" }];
      await settle();
      expect(el.hasAttribute("data-paused")).toBe(true);
      expect(el.querySelector("path.ui-agg__edge")!.hasAttribute("data-live")).toBe(true);
    });

    test("hovering or focusing a node lights its neighbourhood and dims the rest", async () => {
      const el = await mount(html`<tc-agent-graph look=${look} .nodes=${[...nodes, { id: "x", name: "Other", kind: "tool" }]} .edges=${[["lead", "search"]]} .now=${0}></tc-agent-graph>`);
      nodeButton(el, /^Search/).focus();
      await settle();
      expect(el.hasAttribute("data-focus")).toBe(true);
      expect(el.querySelector("path.ui-agg__edge")!.hasAttribute("data-near")).toBe(true);
      const dims = [...el.querySelectorAll(".ui-agg__node")].map((n) => n.hasAttribute("data-dim"));
      expect(dims).toEqual([false, false, true]);
    });

    describe("a11y", () => {
      test("node buttons are named by their content, not an aria-label that hides the initials (2.5.3)", async () => {
        const el = await mount(html`<tc-agent-graph look=${look} .nodes=${team()} .now=${0}></tc-agent-graph>`);
        const gh = nodeButton(el, /^Git Hub/);
        expect(gh.hasAttribute("aria-label")).toBe(false);
        expect(gh.textContent!.trim()).toMatch(/^Git Hub, tool/);
        expect(gh.querySelector('[aria-hidden="true"]')!.textContent!.trim()).toBe("GH");
        expect(gh.getAttribute("aria-haspopup")).toBe("dialog");
        expect(gh.getAttribute("aria-expanded")).toBe("false");
      });

      test("Close and Escape put focus back on the node (2.4.3)", async () => {
        const el = await mount(html`<tc-agent-graph look=${look} .nodes=${team()} .now=${0}></tc-agent-graph>`);
        const lead = nodeButton(el, /^Lead/);
        lead.focus();
        lead.click();
        await settle();
        expect(lead.getAttribute("aria-expanded")).toBe("true");
        expect(lead.getAttribute("aria-controls")).toBe(el.querySelector('[role="dialog"]')!.id);
        const close = el.querySelector<HTMLButtonElement>('[role="dialog"] button[aria-label="Close"]')!;
        close.focus();
        close.click();
        await settle();
        expect(openCard(el)).toBeNull();
        expect(document.activeElement).toBe(lead);

        lead.click();
        await settle();
        el.querySelector<HTMLButtonElement>('[role="dialog"] button')!.focus();
        el.querySelector('[role="dialog"]')!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        await settle();
        expect(openCard(el)).toBeNull();
        expect(document.activeElement).toBe(lead);
      });

      test("a card opened from a chip in the bar hands focus back to that chip", async () => {
        const el = await mount(html`<tc-agent-graph look=${look} .nodes=${team()} .now=${0}></tc-agent-graph>`);
        const chip = el.querySelector<HTMLButtonElement>(".ui-agg__chip")!;
        expect(chip.textContent!.trim()).toBe("Reviewer needs you");
        chip.focus();
        chip.click();
        await settle();
        expect(openCard(el)).toBe("Reviewer");
        el.querySelector<HTMLButtonElement>('[role="dialog"] button[aria-label="Close"]')!.click();
        await settle();
        expect(document.activeElement).toBe(chip);
      });

      test("a click outside the card closes it", async () => {
        const el = await mount(html`<tc-agent-graph look=${look} .nodes=${team()} .now=${0} selected="lead"></tc-agent-graph>`);
        expect(openCard(el)).toBe("Lead");
        document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
        await settle();
        expect(openCard(el)).toBeNull();
      });

      test("the alert line is there from the start and says who needs you (4.1.3)", async () => {
        const calm = team().map((n) => ({ ...n, status: undefined }));
        const el = await mount(html`<tc-agent-graph look=${look} .nodes=${calm} .now=${0}></tc-agent-graph>`);
        const status = el.querySelector('header [role="status"]')!;
        expect(status.textContent).toBe("");
        expect(el.querySelector("[aria-live]")).toBeNull();
        el.nodes = team();
        await settle();
        expect(el.querySelector('header [role="status"]')).toBe(status);
        expect(status.textContent).toBe("Reviewer needs you");
      });

      test("Pause stops the motion and stays the same focused button (2.2.2)", async () => {
        const onPausedChange = vi.fn();
        const el = await mount(html`<tc-agent-graph look=${look} .nodes=${team()} .now=${0} @tc-paused-change=${(e: CustomEvent<GraphPausedChange>) => onPausedChange(e.detail.paused)}></tc-agent-graph>`);
        const pause = el.querySelector<HTMLButtonElement>('button[aria-label="Pause motion"]')!;
        expect(pause.getAttribute("aria-pressed")).toBe("false");
        pause.focus();
        pause.click();
        await settle();
        expect(onPausedChange).toHaveBeenCalledWith(true);
        expect(pause.getAttribute("aria-pressed")).toBe("true");
        expect(pause.title).toBe("Resume motion");
        expect(el.hasAttribute("data-paused")).toBe(true);
        expect(document.activeElement).toBe(pause);
      });

      test("controlled paused: a prevented change only reports", async () => {
        const onPausedChange = vi.fn();
        const el = await mount(html`<tc-agent-graph
          look=${look}
          .nodes=${team()}
          .now=${0}
          @tc-paused-change=${(e: CustomEvent<GraphPausedChange>) => {
            e.preventDefault();
            onPausedChange(e.detail.paused);
          }}
        ></tc-agent-graph>`);
        el.querySelector<HTMLButtonElement>('button[aria-label="Pause motion"]')!.click();
        await settle();
        expect(onPausedChange).toHaveBeenCalledWith(true);
        expect(el.querySelector('button[aria-label="Pause motion"]')!.getAttribute("aria-pressed")).toBe("false");
      });

      test("the screen-reader list says what every node does and who it calls", async () => {
        const calls: GraphCall[] = [{ id: "c1", from: "lead", to: "gh", at: 500 }];
        const el = await mount(html`<tc-agent-graph look=${look} .nodes=${team().map((n) => (n.id === "lead" ? { ...n, cost: 0.5, doing: "Planning" } : n))} .calls=${calls} .now=${1000}></tc-agent-graph>`);
        const items = [...el.querySelectorAll(":scope > ul.ui-agg__sr li")].map((li) => li.textContent!.replace(/\s+/g, " ").trim());
        expect(items[0]).toBe("Lead (agent): Planning. Calls in the last minute: Git Hub 1. Cost $0.50.");
        expect(items[2]).toBe("Reviewer (agent, needs you).");
      });
    });
  });
}

test("axe: no violations in either look, with a card open", async () => {
  const wrap = await fixture(html`<div style="width: 640px">
    <tc-agent-graph .nodes=${team()} .edges=${[["lead", "gh"], ["lead", "rev"]]} .now=${0} selected="lead"></tc-agent-graph>
    <tc-agent-graph look="clean" .nodes=${team()} .edges=${[["lead", "gh"], ["lead", "rev"]]} .now=${0}></tc-agent-graph>
  </div>`);
  await settle();
  // Grow-in animations settle before axe measures contrast (the breathing rings keep going)
  await Promise.all(document.getAnimations().filter((a) => (a.effect?.getComputedTiming().iterations ?? 1) !== Infinity).map((a) => a.finished));
  const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
});
