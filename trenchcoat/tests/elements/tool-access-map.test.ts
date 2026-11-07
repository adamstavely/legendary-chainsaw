/*
 * <tc-tool-access-map> in real browsers: the agent in the middle with its tools in a ring, each tool's state in words
 * and its call count, links to the used ones, the shared call feed, opening a tool's calls, Replay with a pending
 * promise, the ring keyboard, the layouts by width, agent tabs, controlled use, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/tool-access-map";
import type { TcToolAccessMap, ToolAccessAgent, ToolAccessFeedCall, ToolAccessReplay, ToolAccessSelectedChange, ToolAccessTool } from "../../src/elements/tool-access-map";
import { ToolAccessMap } from "../../src/elements/react/tool-access-map";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const AT = Date.UTC(2026, 10, 6, 14, 2);
const AGENT: ToolAccessAgent = { id: "steward", name: "Data steward", model: "Reasoning model", status: "running", task: "Load the surveys" };
const TOOLS = (): ToolAccessTool[] => [
  {
    id: "repo",
    name: "Repository",
    calls: [
      { id: "r1", at: AT, ms: 610, status: "ok", label: "read parse.py", args: { path: "parse.py" }, result: "184 lines" },
      { id: "r2", at: AT + 60_000, ms: 520, label: "read schema.yaml" },
    ],
  },
  { id: "terminal", name: "Terminal", calls: [{ id: "t1", at: AT, ms: 4200, status: "failed", args: "python import.py", result: "ValueError" }] },
  { id: "sheet", name: "Spreadsheet", calls: [{ id: "s1", at: AT, ms: 1800, status: "ok" }] },
  { id: "notebook", name: "Lab notebook", short: "Notebook", calls: [{ id: "n1", at: AT, status: "running", label: "find notes" }] },
  { id: "search", name: "Web search" },
  { id: "mail", name: "Mail", access: "none" },
];

const tile = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-tool="${id}"]`)!;
const word = (el: Element, id: string) => tile(el, id).querySelector(".ui-tam__word")!.textContent;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard", width = 900, selected: string | null = null) =>
  fixture<TcToolAccessMap>(html`<div style=${`width: ${width}px`}><tc-tool-access-map look=${look} heading="Tool access" .agent=${AGENT} .tools=${TOOLS()} .selected=${selected}></tc-tool-access-map></div>`).then(
    (w) => w.querySelector("tc-tool-access-map")!,
  );

describe("tc-tool-access-map", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the agent in the middle, each tool in words with its calls, links to the used ones, one tab stop`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("tam");
      expect(el.dataset.look).toBe(look);
      const box = el.querySelector('[role="listbox"]')!;
      expect(document.getElementById(box.getAttribute("aria-labelledby")!)!.textContent).toBe("Tool access");
      expect([...box.querySelectorAll<HTMLElement>('[role="option"]')].map((o) => o.dataset.tool)).toEqual(["repo", "terminal", "sheet", "notebook", "search", "mail"]);
      expect(box.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
      expect(el.querySelector(".ui-tam__agent-name")!.textContent).toBe("Data steward");
      expect(el.querySelector(".ui-tam__agent-status")!.textContent).toBe("Running");
      expect(word(el, "repo")).toBe("Last call 520ms");
      expect(word(el, "terminal")).toBe("Failed");
      expect(word(el, "sheet")).toBe("Last call 1.8s");
      expect(word(el, "notebook")).toBe("Running");
      expect(word(el, "search")).toBe("Not used yet");
      expect(word(el, "mail")).toBe("No access");
      expect(tile(el, "repo").querySelector(".ui-tam__badge")!.textContent).toBe("2×, 2 calls");
      expect(tile(el, "search").querySelector(".ui-tam__badge")).toBeNull();
      expect(el.querySelector(".ui-tam__summary")!.textContent).toBe("5/6 tools · 5 calls · 1 running");
      expect([...el.querySelectorAll<SVGLineElement>(".ui-tam__link")].map((l) => `${l.dataset.to}:${l.dataset.state}`)).toEqual(["repo:ok", "terminal:failed", "sheet:ok", "notebook:running"]);
      expect([...el.querySelectorAll<SVGLineElement>(".ui-tam__pulse")].map((l) => l.dataset.to)).toEqual(["notebook"]);
    });
  }

  test("tools sit round the ring, the first at the top, and the links end at them", async () => {
    const el = await make();
    await expect.poll(() => el.querySelector(".ui-tam__body")!.getAttribute("data-mode")).toBe("ring");
    const stage = el.querySelector(".ui-tam__stage")!.getBoundingClientRect();
    const r = tile(el, "repo").getBoundingClientRect();
    expect(Math.abs(r.left + r.width / 2 - (stage.left + stage.width / 2))).toBeLessThan(1);
    expect(r.top - stage.top).toBeLessThan(2);
    const line = el.querySelector<SVGLineElement>('.ui-tam__link[data-to="terminal"]')!;
    const t = tile(el, "terminal").getBoundingClientRect();
    expect(Math.abs(+line.getAttribute("x2")! - (t.left + t.width / 2 - stage.left))).toBeLessThan(1);
  });

  test("the shared feed adds calls by `to`, skipping other agents' calls", async () => {
    const el = await make();
    const feed: ToolAccessFeedCall[] = [
      { id: "f1", to: "search", from: "steward", at: AT, ms: 900, status: "ok" },
      { id: "f2", to: "search", from: "writer", at: AT, ms: 900, status: "error" },
      { id: "f3", to: "sheet", at: AT + 120_000, status: "error" },
    ];
    el.calls = feed;
    await settle();
    expect(word(el, "search")).toBe("Last call 900ms");
    expect(word(el, "sheet")).toBe("Failed");
    expect(el.querySelector(".ui-tam__summary")!.textContent).toBe("5/6 tools · 7 calls · 1 running");
  });

  test("click or Enter opens a tool's calls, newest first; Close returns focus; Escape closes; preventDefault() keeps it", async () => {
    const el = await make();
    const seen: ToolAccessSelectedChange[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<ToolAccessSelectedChange>).detail));
    tile(el, "repo").click();
    await settle();
    expect(el.selected).toBe("repo");
    expect(tile(el, "repo").getAttribute("aria-selected")).toBe("true");
    expect(seen[0].tool!.name).toBe("Repository");
    const panel = el.querySelector(".ui-tam__panel")!;
    expect(panel.querySelector(".ui-tam__panel-title")!.textContent).toBe("Repository");
    expect(panel.querySelector(".ui-tam__panel-sub")!.textContent).toBe("Last call 520ms · 2 calls");
    expect([...panel.querySelectorAll(".ui-tam__call-label")].map((l) => l.textContent)).toEqual(["read schema.yaml", "read parse.py"]);
    expect([...panel.querySelectorAll(".ui-tam__code")].map((c) => c.textContent)).toEqual(['{\n  "path": "parse.py"\n}', "184 lines"]);
    expect(panel.querySelector(".ui-tam__replay")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Replay call 2 to Repository");
    el.querySelector<HTMLButtonElement>(".ui-tam__close")!.click();
    await settle();
    expect(el.selected).toBeNull();
    await expect.poll(() => document.activeElement?.getAttribute("data-tool")).toBe("repo");
    key(tile(el, "mail"), "Enter");
    await settle();
    expect(el.querySelector(".ui-tam__note")!.textContent).toBe("Data steward has no access to Mail.");
    key(tile(el, "mail"), "Escape");
    await settle();
    expect(el.selected).toBeNull();
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    tile(el, "terminal").click();
    await settle();
    expect(el.selected).toBeNull();
  });

  test("Replay fires tc-replay, calls onReplay and stays busy while its promise is pending; preventDefault() skips it", async () => {
    const el = await make("standard", 900, "terminal");
    const events: ToolAccessReplay[] = [];
    el.addEventListener("tc-replay", (e) => events.push((e as CustomEvent<ToolAccessReplay>).detail));
    let done = () => {};
    const asked: string[] = [];
    el.onReplay = (tool, call) => {
      asked.push(`${tool.id}/${call.id}`);
      return new Promise<void>((r) => (done = r));
    };
    const btn = () => el.querySelector<HTMLButtonElement>(".ui-tam__replay")!;
    btn().click();
    await settle();
    expect(events.map((e) => e.call.id)).toEqual(["t1"]);
    expect(asked).toEqual(["terminal/t1"]);
    expect(btn().getAttribute("aria-disabled")).toBe("true");
    expect(btn().textContent).toContain("Replaying…");
    btn().click();
    expect(asked).toHaveLength(1);
    done();
    await expect.poll(() => btn().getAttribute("aria-disabled")).toBe("false");
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Replayed the call to Terminal");
    el.addEventListener("tc-replay", (e) => e.preventDefault());
    btn().click();
    await settle();
    expect(asked).toHaveLength(1);
    // A running call has no Replay
    el.selected = "notebook";
    await settle();
    expect(el.querySelector(".ui-tam__replay")).toBeNull();
  });

  test("keyboard: the arrows go round the ring and wrap, Home / End", async () => {
    const el = await make();
    const at = () => document.activeElement?.getAttribute("data-tool");
    const press = async (k: string) => {
      key(document.activeElement!, k);
      await settle();
    };
    tile(el, "repo").focus();
    await press("ArrowRight");
    expect(at()).toBe("terminal");
    await press("ArrowDown");
    expect(at()).toBe("sheet");
    await press("ArrowLeft");
    expect(at()).toBe("terminal");
    await press("Home");
    await press("ArrowUp");
    expect(at()).toBe("mail");
    await press("End");
    expect(at()).toBe("mail");
    expect(tile(el, "mail").getAttribute("tabindex")).toBe("0");
  });

  test("layouts by width: the panel beside the ring, below it, then a plain list", async () => {
    const wide = await make("standard", 900, "repo");
    await expect.poll(() => wide.querySelector(".ui-tam__body")!.getAttribute("data-mode")).toBe("side");
    const mid = await make("standard", 560, "repo");
    await expect.poll(() => mid.querySelector(".ui-tam__body")!.getAttribute("data-mode")).toBe("stack");
    const stage = mid.querySelector(".ui-tam__stage")!.getBoundingClientRect();
    expect(mid.querySelector(".ui-tam__panel")!.getBoundingClientRect().top).toBeGreaterThanOrEqual(stage.bottom);
    const narrow = await make("standard", 340);
    await expect.poll(() => narrow.querySelector(".ui-tam__body")!.getAttribute("data-mode")).toBe("list");
    expect(narrow.querySelector(".ui-tam__stage")).toBeNull();
    expect(narrow.querySelectorAll('[role="option"]')).toHaveLength(6);
    // Short names in a small ring, the full name still read
    expect(getComputedStyle(narrow.querySelector(".ui-tam__short")!).display).not.toBe("none");
  });

  test("agent tabs fire a cancelable tc-agent-id-change and move with the arrows", async () => {
    const el = await fixture<TcToolAccessMap>(html`<tc-tool-access-map .agent=${AGENT} .tools=${TOOLS()} .agents=${[{ id: "steward", name: "Data steward" }, { id: "writer", name: "Report writer" }]}></tc-tool-access-map>`);
    const tabs = [...el.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    expect(tabs.map((t) => t.getAttribute("aria-selected"))).toEqual(["true", "false"]);
    const seen: string[] = [];
    el.addEventListener("tc-agent-id-change", (e) => seen.push((e as CustomEvent<{ agentId: string }>).detail.agentId));
    tabs[1].click();
    await settle();
    expect(el.agentId).toBe("writer");
    key(el.querySelector('[data-agent="writer"]')!, "ArrowRight");
    await settle();
    expect(el.agentId).toBe("steward");
    expect(seen).toEqual(["writer", "steward"]);
  });

  test("a tool that goes away closes its panel; an empty element renders without errors", async () => {
    const el = await make("clean", 900, "sheet");
    el.tools = TOOLS().filter((t) => t.id !== "sheet");
    await settle();
    expect(el.selected).toBeNull();
    const empty = await fixture<TcToolAccessMap>(html`<tc-tool-access-map></tc-tool-access-map>`);
    expect(empty.querySelector(".ui-tam__empty")).toBeTruthy();
    expect(empty.querySelector(".tc-head__title")!.textContent).toBe("Tool access");
  });

  test("React wrapper: an uncontrolled selection survives re-renders; icons can be React nodes; onReplay gets the page's tool", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: unknown[] = [];
    const replays: string[] = [];
    let bump = () => {};
    const tools = TOOLS().map((t, i) => (i === 0 ? { ...t, icon: React.createElement("svg", { "data-mark": "repo", viewBox: "0 0 24 24" }) } : t));
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(ToolAccessMap, {
        title: "Reach",
        agent: AGENT,
        tools,
        onSelectedChange: (s, t) => void seen.push([s, t?.name]),
        onReplay: (t) => void replays.push(t.name),
        "data-n": n,
      } as React.ComponentProps<typeof ToolAccessMap>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-tool-access-map")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Reach");
    await expect.poll(() => tile(el, "repo").querySelector('[data-mark="repo"]')).toBeTruthy();
    tile(el, "repo").click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.selected).toBe("repo");
    expect(seen).toEqual([["repo", "Repository"]]);
    el.querySelector<HTMLButtonElement>(".ui-tam__replay")!.click();
    expect(replays).toEqual(["Repository"]);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled selection stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: (string | null)[] = [];
    await act(async () => root.render(React.createElement(ToolAccessMap, { agent: AGENT, tools: TOOLS(), selected: null, onSelectedChange: (s) => void asked.push(s) })));
    await settle();
    const el = host.querySelector("tc-tool-access-map")!;
    tile(el, "sheet").click();
    await settle();
    expect(asked).toEqual(["sheet"]);
    expect(el.selected).toBeNull();
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; width: 900px; background: var(--tc-surface-base)">
        <tc-tool-access-map description="What the agent can reach." .agent=${AGENT} .tools=${TOOLS()} .selected=${"repo"} .agents=${[{ id: "steward", name: "Data steward" }, { id: "writer", name: "Report writer" }]}></tc-tool-access-map>
        <tc-tool-access-map look="clean" .agent=${AGENT} .tools=${TOOLS()} .selected=${"terminal"}></tc-tool-access-map>
        <div style="width: 340px"><tc-tool-access-map look="clean" .agent=${AGENT} .tools=${TOOLS()}></tc-tool-access-map></div>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
