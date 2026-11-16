/*
 * <tc-memory-graph> in real browsers: the agent in the middle with memories on the left and tools on the right, each
 * card in words, the connectors and the lights for using, learning and recalling, the agent's words, "+N more",
 * opening a card, switching memories and tools off, forget with Undo, the agent's menu, the keyboard, the list layout
 * when narrow, controlled use, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/memory-graph";
import type { MemoryGraphAction, MemoryGraphMemoriesChange, MemoryGraphMemory, MemoryGraphSelectedChange, MemoryGraphTool, MemoryGraphToolsChange, TcMemoryGraph } from "../../src/elements/memory-graph";
import { MemoryGraph } from "../../src/elements/react/memory-graph";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const AGENT = { name: "Assistant", subtitle: "Exhibitions team" };
const MEMORIES = (): MemoryGraphMemory[] => [
  { id: "m1", text: "Prefers short answers", source: "You asked for it twice", tag: "Preference", artifact: { name: "Feedback", kind: "chat" } },
  { id: "m2", text: "Budget €48k", source: "From the budget sheet", artifact: { name: "budget.xlsx", href: "#budget" }, via: "sheet" },
  { id: "m3", text: "Opening on 11 December", artifact: { name: "Standup notes" }, via: "wiki" },
  { id: "m4", text: "Loans need two weeks", artifact: { name: "Re: loans", kind: "email" }, off: true },
];
const TOOLS = (): MemoryGraphTool[] => [
  { id: "wiki", name: "Wiki", access: "Read", scope: "Exhibitions space" },
  { id: "sheet", name: "Spreadsheet", access: "Read & write", scope: "Budget sheets", note: "Keeps the budget up to date." },
  { id: "calendar", name: "Calendar", access: "Read", off: true },
];
const MANY = (): MemoryGraphMemory[] => Array.from({ length: 9 }, (_, i) => ({ id: `n${i}`, text: `Memory ${i + 1}`, artifact: { name: `note-${i + 1}.md` } }));

const card = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-card="${id}"]`)!;
/** A card's words, without its icon */
const words = (el: Element, id: string) => text(card(el, id).querySelector(".ui-mgr__text"));
const text = (el: Element | null) => el?.textContent?.replace(/\s+/g, " ").trim() ?? "";
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const focused = () => (document.activeElement as HTMLElement | null)?.closest<HTMLElement>("[data-card]")?.dataset.card ?? null;
const make = (look: "standard" | "clean" = "standard", width = 900, extra: Partial<TcMemoryGraph> = {}) =>
  fixture<HTMLElement>(
    html`<div style=${`width: ${width}px`}><tc-memory-graph look=${look} heading="Memory" .agent=${AGENT} .memories=${MEMORIES()} .tools=${TOOLS()} .using=${extra.using ?? null} .learning=${extra.learning ?? null} .recalling=${extra.recalling ?? []} .selected=${extra.selected ?? null}></tc-memory-graph></div>`,
  ).then((w) => w.querySelector("tc-memory-graph")!);

describe("tc-memory-graph", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the agent in the middle, memories left and tools right in words, one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("mgr");
      expect(el.dataset.look).toBe(look);
      await expect.poll(() => el.querySelector(".ui-mgr__body")!.getAttribute("data-mode")).toBe("ring");
      const box = el.querySelector('[role="listbox"]')!;
      expect(document.getElementById(box.getAttribute("aria-labelledby")!)!.textContent).toBe("Memory");
      expect([...box.querySelectorAll('[role="group"]')].map((g) => g.getAttribute("aria-label"))).toEqual(["Memories", "Tools"]);
      expect([...box.querySelectorAll<HTMLElement>('[role="option"]')].map((o) => o.dataset.card)).toEqual(["m1", "m2", "m3", "m4", "wiki", "sheet", "calendar"]);
      expect(box.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      expect(words(el, "m1")).toBe("Prefers short answers Feedback · Chat");
      expect(words(el, "m2")).toBe("Budget €48k budget.xlsx · File");
      expect(words(el, "m4")).toBe("Loans need two weeks Off · Re: loans · Email");
      expect(words(el, "sheet")).toBe("Spreadsheet Read & write · Budget sheets");
      expect(words(el, "calendar")).toBe("Calendar Off · Read");
      expect(card(el, "m4").hasAttribute("data-off")).toBe(true);
      expect(text(el.querySelector(".ui-mgr__agent-name"))).toBe("Assistant");
      expect(text(el.querySelector(".ui-mgr__agent-activity"))).toBe("Exhibitions team");
      expect(text(el.querySelector(".ui-mgr__summary"))).toBe("3/4 memories · 2/3 tools");
      expect([...el.querySelectorAll<SVGPathElement>(".ui-mgr__link")].map((l) => l.dataset.to)).toEqual(["m1", "m2", "m3", "m4", "wiki", "sheet", "calendar"]);
      expect(el.querySelector('.ui-mgr__link[data-to="m4"]')!.hasAttribute("data-off")).toBe(true);
      expect(el.querySelector(".ui-mgr__pulse")).toBeNull();
    });
  }

  test("memories sit left of the agent and tools right of it, and each connector ends at its card", async () => {
    const el = await make();
    await expect.poll(() => el.querySelector(".ui-mgr__body")!.getAttribute("data-mode")).toBe("ring");
    const agent = el.querySelector(".ui-mgr__agent")!.getBoundingClientRect();
    const stage = el.querySelector(".ui-mgr__stage")!.getBoundingClientRect();
    expect(card(el, "m2").getBoundingClientRect().right).toBeLessThan(agent.left);
    expect(card(el, "sheet").getBoundingClientRect().left).toBeGreaterThan(agent.right);
    const path = el.querySelector<SVGPathElement>('.ui-mgr__link[data-to="sheet"]')!;
    const end = path.getPointAtLength(path.getTotalLength());
    const r = card(el, "sheet").getBoundingClientRect();
    expect(Math.abs(end.x - (r.left - stage.left))).toBeLessThan(1);
    expect(Math.abs(end.y - (r.top + r.height / 2 - stage.top))).toBeLessThan(1);
  });

  test("using, learning and recalling: the agent's words, the lights' directions and the lit cards", async () => {
    const el = await make("standard", 900, { using: "sheet" });
    expect(text(el.querySelector(".ui-mgr__agent-activity"))).toBe("Using Spreadsheet");
    expect([...el.querySelectorAll<SVGPathElement>(".ui-mgr__pulse")].map((p) => `${p.dataset.to}:${p.dataset.flow}`)).toEqual(["sheet:out"]);
    expect(card(el, "sheet").hasAttribute("data-lit")).toBe(true);
    expect(el.querySelector(".ui-mgr__agent")!.hasAttribute("data-busy")).toBe(true);
    el.using = null;
    el.recalling = ["m1", "m2", "m4"];
    await settle();
    // A memory that's switched off isn't recalled
    expect(text(el.querySelector(".ui-mgr__agent-activity"))).toBe("Recalling 2 memories");
    expect([...el.querySelectorAll<SVGPathElement>(".ui-mgr__pulse")].map((p) => `${p.dataset.to}:${p.dataset.flow}`)).toEqual(["m1:in", "m2:in"]);
    el.recalling = [];
    el.learning = "m3";
    await settle();
    expect(text(el.querySelector(".ui-mgr__agent-activity"))).toBe("Learning…");
    // In from the wiki it came through, out to the memory
    expect([...el.querySelectorAll<SVGPathElement>(".ui-mgr__pulse")].map((p) => `${p.dataset.to}:${p.dataset.flow}`)).toEqual(["m3:out", "wiki:in"]);
    expect([...el.querySelectorAll("[data-lit]")].map((c) => (c as HTMLElement).dataset.card)).toEqual(["m3", "wiki"]);
    el.agent = { ...AGENT, activity: "Checking the loans list" };
    await settle();
    expect(text(el.querySelector(".ui-mgr__agent-activity"))).toBe("Checking the loans list");
  });

  test("more than six memories: five spots and \"+4 more\", which opens the rest", async () => {
    const el = await make();
    el.memories = MANY();
    await settle();
    const left = [...el.querySelectorAll<HTMLElement>('.ui-mgr__group--memories [role="option"]')].map((o) => o.dataset.card);
    expect(left).toEqual(["n0", "n1", "n2", "n3", "n4", "__more"]);
    expect(text(card(el, "__more"))).toBe("+4 more memories");
    card(el, "__more").click();
    await settle();
    expect(el.selected).toBe("__more");
    const rest = [...el.querySelectorAll<HTMLElement>(".ui-mgr__rest-item")];
    expect(rest.map((b) => b.dataset.memory)).toEqual(["n5", "n6", "n7", "n8"]);
    rest[1].click();
    await settle();
    expect(el.selected).toBe("n6");
    expect(text(el.querySelector(".ui-mgr__panel-title"))).toBe("Memory 7");
  });

  test("opening a memory: its details, Open, the switch and a cancelable tc-memories-change", async () => {
    const el = await make();
    const changes: MemoryGraphMemoriesChange[] = [];
    const opened: MemoryGraphSelectedChange[] = [];
    el.addEventListener("tc-memories-change", (e) => changes.push((e as CustomEvent<MemoryGraphMemoriesChange>).detail));
    el.addEventListener("tc-selected-change", (e) => opened.push((e as CustomEvent<MemoryGraphSelectedChange>).detail));
    card(el, "m2").click();
    await settle();
    expect(el.selected).toBe("m2");
    expect(opened[0].memory?.text).toBe("Budget €48k");
    expect(card(el, "m2").getAttribute("aria-selected")).toBe("true");
    const panel = el.querySelector(".ui-mgr__panel")!;
    expect(text(panel.querySelector(".ui-mgr__panel-title"))).toBe("Budget €48k");
    expect([...panel.querySelectorAll(".ui-mgr__fact")].map((f) => `${text(f.querySelector("dt"))}: ${text(f.querySelector("dd"))}`)).toEqual(["From: budget.xlsx · File Open budget.xlsx", "Learned through: Spreadsheet"]);
    expect(panel.querySelector<HTMLAnchorElement>(".ui-mgr__link")!.getAttribute("href")).toBe("#budget");
    const sw = panel.querySelector<HTMLButtonElement>('[role="switch"]')!;
    expect(sw.getAttribute("aria-checked")).toBe("true");
    sw.click();
    await settle();
    expect(changes.at(-1)!.change).toBe("off");
    expect(el.memories.find((m) => m.id === "m2")!.off).toBe(true);
    expect(words(el, "m2")).toContain("Off");
    // Prevented, it stays as it was
    el.addEventListener("tc-memories-change", (e) => e.preventDefault(), { once: true });
    el.querySelector<HTMLButtonElement>('.ui-mgr__panel [role="switch"]')!.click();
    await settle();
    expect(el.memories.find((m) => m.id === "m2")!.off).toBe(true);
  });

  test("opening a tool and switching it on fires tc-tools-change", async () => {
    const el = await make();
    const changes: MemoryGraphToolsChange[] = [];
    el.addEventListener("tc-tools-change", (e) => changes.push((e as CustomEvent<MemoryGraphToolsChange>).detail));
    card(el, "calendar").click();
    await settle();
    const sw = el.querySelector<HTMLButtonElement>('.ui-mgr__panel [role="switch"]')!;
    expect(text(sw)).toBe("Let Assistant use Calendar");
    expect(sw.getAttribute("aria-checked")).toBe("false");
    sw.click();
    await settle();
    expect(changes).toHaveLength(1);
    expect(changes[0].change).toBe("on");
    expect(changes[0].tools.find((t) => t.id === "calendar")!.off).toBe(false);
    expect(card(el, "calendar").hasAttribute("data-off")).toBe(false);
  });

  test("forget, then Undo brings it back in its place; Undo goes after undo-for", async () => {
    const el = await make();
    const changes: string[] = [];
    el.addEventListener("tc-memories-change", (e) => changes.push((e as CustomEvent<MemoryGraphMemoriesChange>).detail.change));
    card(el, "m2").click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-mgr__forget")!.click();
    await settle();
    expect(el.memories.map((m) => m.id)).toEqual(["m1", "m3", "m4"]);
    expect(el.selected).toBeNull();
    expect(text(el.querySelector(".ui-mgr__undo-text"))).toBe("Forgot “Budget €48k”");
    el.querySelector<HTMLButtonElement>(".ui-mgr__undo-btn")!.click();
    await settle();
    expect(el.memories.map((m) => m.id)).toEqual(["m1", "m2", "m3", "m4"]);
    expect(el.querySelector(".ui-mgr__undo")).toBeNull();
    expect(changes).toEqual(["forgotten", "restored"]);
    el.undoFor = 50;
    card(el, "m1").focus();
    key(card(el, "m1"), "Delete");
    await settle();
    expect(el.memories.map((m) => m.id)).toEqual(["m2", "m3", "m4"]);
    expect(focused()).toBe("m2");
    await expect.poll(() => el.querySelector(".ui-mgr__undo")).toBeNull();
  });

  test("the agent's menu: Add a file and Connect a tool fire tc-action; Escape closes it", async () => {
    const el = await make();
    const actions: string[] = [];
    el.addEventListener("tc-action", (e) => actions.push((e as CustomEvent<MemoryGraphAction>).detail.id));
    const btn = el.querySelector<HTMLButtonElement>(".ui-mgr__agent-btn")!;
    expect(text(btn)).toBe("Assistant Exhibitions team , add a file or connect a tool");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    btn.click();
    await settle();
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    el.querySelector<HTMLButtonElement>('[data-action="connect-tool"]')!.click();
    await settle();
    expect(actions).toEqual(["connect-tool"]);
    expect(el.querySelector<HTMLElement>(".ui-mgr__menu")!.hidden).toBe(true);
    btn.click();
    await settle();
    const item = el.querySelector<HTMLButtonElement>('[data-action="add-file"]')!;
    item.focus();
    key(item, "Escape");
    await settle();
    expect(el.querySelector<HTMLElement>(".ui-mgr__menu")!.hidden).toBe(true);
    await expect.poll(() => document.activeElement).toBe(btn);
  });

  test("keyboard: down and up a side, across to the other, Home / End, Enter opens, Escape closes", async () => {
    const el = await make();
    card(el, "m1").focus();
    key(card(el, "m1"), "ArrowDown");
    await expect.poll(() => focused()).toBe("m2");
    key(card(el, "m2"), "ArrowRight");
    await expect.poll(() => focused()).toBe("sheet");
    key(card(el, "sheet"), "ArrowRight");
    await settle();
    expect(focused()).toBe("sheet");
    key(card(el, "sheet"), "ArrowLeft");
    await expect.poll(() => focused()).toBe("m2");
    key(card(el, "m2"), "End");
    await expect.poll(() => focused()).toBe("calendar");
    expect(card(el, "calendar").tabIndex).toBe(0);
    key(card(el, "calendar"), "Home");
    await expect.poll(() => focused()).toBe("m1");
    key(card(el, "m1"), "Enter");
    await settle();
    expect(el.selected).toBe("m1");
    key(card(el, "m1"), "Escape");
    await settle();
    expect(el.selected).toBeNull();
    // Delete does nothing on a tool
    key(card(el, "wiki"), "Delete");
    await settle();
    expect(el.tools).toHaveLength(3);
  });

  test("narrow: the agent on top, memories and tools as two lists", async () => {
    const el = await make("clean", 420);
    await expect.poll(() => el.querySelector(".ui-mgr__body")!.getAttribute("data-mode")).toBe("list");
    expect(el.querySelector(".ui-mgr__stage")).toBeNull();
    expect(el.querySelectorAll('[role="option"]')).toHaveLength(7);
    const agent = el.querySelector(".ui-mgr__agent")!.getBoundingClientRect();
    expect(card(el, "m1").getBoundingClientRect().top).toBeGreaterThan(agent.bottom);
    expect(card(el, "wiki").getBoundingClientRect().top).toBeGreaterThan(card(el, "m4").getBoundingClientRect().bottom);
  });

  test("a card that goes away closes its details; an empty element renders without errors", async () => {
    const el = await make("clean", 900, { selected: "sheet" });
    expect(el.querySelector(".ui-mgr__panel")).toBeTruthy();
    el.tools = TOOLS().filter((t) => t.id !== "sheet");
    await settle();
    expect(el.selected).toBeNull();
    const empty = await fixture<TcMemoryGraph>(html`<tc-memory-graph></tc-memory-graph>`);
    expect(empty.querySelector(".ui-mgr__empty")).toBeTruthy();
    expect(empty.querySelector(".tc-head__title")!.textContent).toBe("Memory");
  });

  test("React wrapper: uncontrolled lists survive re-renders, icons can be React nodes, forget and Undo keep the page's memory", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    host.style.width = "900px";
    document.body.append(host);
    const root = createRoot(host);
    const seen: string[][] = [];
    const actions: string[] = [];
    let bump = () => {};
    const tools = TOOLS().map((t, i) => (i === 0 ? { ...t, icon: React.createElement("svg", { "data-mark": "wiki", viewBox: "0 0 24 24" }) } : t));
    const memories = MEMORIES().map((m, i) => (i === 0 ? { ...m, artifact: { ...m.artifact!, icon: React.createElement("svg", { "data-mark": "chat", viewBox: "0 0 24 24" }) } } : m));
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(MemoryGraph, {
        title: "Knows",
        agent: AGENT,
        defaultMemories: memories,
        defaultTools: tools,
        onMemoriesChange: (ms) => void seen.push(ms.map((m) => `${m.id}${m.off ? "-off" : ""}`)),
        onAction: (id) => void actions.push(id),
        "data-n": n,
      } as React.ComponentProps<typeof MemoryGraph>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-memory-graph")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Knows");
    await expect.poll(() => card(el, "wiki").querySelector('[data-mark="wiki"]')).toBeTruthy();
    await expect.poll(() => card(el, "m1").querySelector('[data-mark="chat"]')).toBeTruthy();
    card(el, "m1").click();
    await settle();
    el.querySelector<HTMLButtonElement>('.ui-mgr__panel [role="switch"]')!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(card(el, "m1").hasAttribute("data-off")).toBe(true);
    el.querySelector<HTMLButtonElement>(".ui-mgr__forget")!.click();
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-mgr__undo-btn")!.click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(seen).toEqual([
      ["m1-off", "m2", "m3", "m4-off"],
      ["m2", "m3", "m4-off"],
      ["m1-off", "m2", "m3", "m4-off"],
    ]);
    // The brought-back memory still has the page's React icon
    await expect.poll(() => card(el, "m1").querySelector('[data-mark="chat"]')).toBeTruthy();
    el.querySelector<HTMLButtonElement>(".ui-mgr__agent-btn")!.click();
    await settle();
    el.querySelector<HTMLButtonElement>('[data-action="add-file"]')!.click();
    expect(actions).toEqual(["add-file"]);
    await act(async () => root.unmount());
  });

  test("React wrapper: controlled memories and selection stay until the parent changes them", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    host.style.width = "900px";
    document.body.append(host);
    const root = createRoot(host);
    const asked: (string | null)[] = [];
    const lists: number[] = [];
    await act(async () =>
      root.render(
        React.createElement(MemoryGraph, {
          agent: AGENT,
          memories: MEMORIES(),
          tools: TOOLS(),
          selected: "m1",
          onSelectedChange: (s) => void asked.push(s),
          onMemoriesChange: (ms) => void lists.push(ms.length),
        }),
      ),
    );
    await settle();
    const el = host.querySelector("tc-memory-graph")!;
    card(el, "sheet").click();
    await settle();
    expect(asked).toEqual(["sheet"]);
    expect(el.selected).toBe("m1");
    el.querySelector<HTMLButtonElement>(".ui-mgr__forget")!.click();
    await settle();
    expect(lists).toEqual([3]);
    expect(el.memories).toHaveLength(4);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; width: 900px; background: var(--tc-surface-base)">
        <tc-memory-graph description="What the assistant knows." .agent=${AGENT} .memories=${MEMORIES()} .tools=${TOOLS()} .using=${"sheet"} .selected=${"m2"}></tc-memory-graph>
        <tc-memory-graph look="clean" .agent=${AGENT} .memories=${MANY()} .tools=${TOOLS()} .learning=${"n1"} .selected=${"calendar"}></tc-memory-graph>
        <div style="width: 380px"><tc-memory-graph look="clean" .agent=${AGENT} .memories=${MEMORIES()} .tools=${TOOLS()} .recalling=${["m1"]}></tc-memory-graph></div>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
