/*
 * <tc-chat-composer>: tool switches in the toolbar row, their chips, and the temporary chat – in real browsers.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/chat-composer";
import type { ChatActiveToolsChange, ChatSend, ChatTool, TcChatComposer } from "../../src/elements/chat-composer";
import { cleanup, finish, fixture, settle } from "./helpers";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { ChatComposer } from "../../src/elements/react/chat-composer";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const TOOLS: ChatTool[] = [
  { id: "web", label: "Web search", description: "Look things up on the web" },
  { id: "research", label: "Deep research", description: "Read widely and write a cited report" },
  { id: "think", label: "Think longer" },
];
const bar = (el: Element) => el.querySelector<HTMLElement>('[role="toolbar"]');
const toolsButton = (el: Element) => el.querySelector<HTMLButtonElement>('[data-tool="tools"]');
const menu = (el: Element) => el.querySelector<HTMLElement>('.ui-chat-composer__pop[data-panel="tools"]');
const item = (el: Element, id: string) => menu(el)!.querySelector<HTMLButtonElement>(`[data-tool-id="${id}"]`)!;
const chips = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-chat-composer__chip")];
const toggle = (el: Element) => el.querySelector<HTMLButtonElement>('[data-tool="temporary"]');
const notice = (el: Element) => el.querySelector<HTMLElement>(".ui-chat-composer__temp");
const live = (el: Element) => el.querySelector('[aria-live="polite"]')!.textContent;
const message = (el: Element) => el.querySelector<HTMLTextAreaElement>("textarea")!;
const type = (el: Element, text: string) => {
  const t = message(el);
  t.value = text;
  t.dispatchEvent(new InputEvent("input", { bubbles: true }));
};
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const send = async (el: TcChatComposer, text: string) => {
  type(el, text);
  await settle();
  key(message(el), "Enter");
  await settle();
};

for (const look of ["standard", "clean"] as const) {
  describe(`tc-chat-composer tools and temporary chat (${look})`, () => {
    test("off by default: no Tools button, no toggle, no notice – and the send still says what was on", async () => {
      const sent: ChatSend[] = [];
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo @tc-send=${(e: CustomEvent<ChatSend>) => sent.push(e.detail)}></tc-chat-composer>`);
      expect(bar(el)).toBeNull();
      expect(toolsButton(el)).toBeNull();
      expect(toggle(el)).toBeNull();
      expect(notice(el)).toBeNull();
      await send(el, "Hi");
      expect(sent[0]).toMatchObject({ activeTools: [], temporary: false });
    });

    test("Tools opens a menu of switches; a switch turns its tool on as a chip and stays open; the send carries the tools", async () => {
      const changes: ChatActiveToolsChange[] = [];
      const sent: ChatSend[] = [];
      const el = await fixture<TcChatComposer>(
        html`<tc-chat-composer look=${look} demo .tools=${TOOLS} @tc-active-tools-change=${(e: CustomEvent<ChatActiveToolsChange>) => changes.push(e.detail)} @tc-send=${(e: CustomEvent<ChatSend>) => sent.push(e.detail)}></tc-chat-composer>`,
      );
      const btn = toolsButton(el)!;
      expect(btn.getAttribute("aria-haspopup")).toBe("menu");
      expect(btn.getAttribute("aria-expanded")).toBe("false");
      expect(btn.textContent!.trim()).toBe("Tools");
      btn.click();
      await settle();
      await expect.poll(() => menu(el)).toBeTruthy();
      expect(menu(el)!.getAttribute("role")).toBe("menu");
      expect(menu(el)!.getAttribute("aria-label")).toBe("Tools");
      expect(btn.getAttribute("aria-expanded")).toBe("true");
      const items = [...menu(el)!.querySelectorAll('[role="menuitemcheckbox"]')];
      expect(items).toHaveLength(3);
      expect(items.map((i) => i.getAttribute("aria-checked"))).toEqual(["false", "false", "false"]);
      const ref = (b: Element, attr: string) => document.getElementById(b.getAttribute(attr)!)!.textContent;
      expect(ref(items[0], "aria-labelledby")).toBe("Web search");
      expect(ref(items[0], "aria-describedby")).toBe("Look things up on the web");
      expect(items[2].hasAttribute("aria-describedby")).toBe(false);
      await expect.poll(() => document.activeElement).toBe(items[0]);

      // Turned on out of order, kept in the order of `tools`
      item(el, "think").click();
      await settle();
      item(el, "web").click();
      await settle();
      expect(changes).toEqual([
        { activeTools: ["think"], tool: "think", active: true },
        { activeTools: ["web", "think"], tool: "web", active: true },
      ]);
      expect(el.activeTools).toEqual(["web", "think"]);
      expect(menu(el)).toBeTruthy();
      expect(item(el, "web").getAttribute("aria-checked")).toBe("true");
      expect(live(el)).toBe("Web search on.");
      expect(chips(el).map((c) => c.getAttribute("aria-label"))).toEqual(["Web search, remove", "Think longer, remove"]);
      expect(document.getElementById(btn.getAttribute("aria-describedby")!)!.textContent).toBe("On: Web search, Think longer");

      await send(el, "Flights to Lisbon");
      expect(sent[0]).toMatchObject({ message: "Flights to Lisbon", activeTools: ["web", "think"], temporary: false });

      // Off again from the menu
      if (!menu(el)) {
        btn.click();
        await settle();
      }
      item(el, "web").click();
      await settle();
      expect(el.activeTools).toEqual(["think"]);
      expect(live(el)).toBe("Web search off.");
    });

    test("the menu's arrow keys move between switches, Escape closes it and focus goes back to Tools", async () => {
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo .tools=${TOOLS}></tc-chat-composer>`);
      toolsButton(el)!.focus();
      toolsButton(el)!.click();
      await settle();
      await expect.poll(() => document.activeElement).toBe(item(el, "web"));
      key(item(el, "web"), "ArrowDown");
      expect(document.activeElement).toBe(item(el, "research"));
      key(item(el, "research"), "End");
      expect(document.activeElement).toBe(item(el, "think"));
      key(item(el, "think"), "ArrowDown");
      expect(document.activeElement).toBe(item(el, "web"));
      key(item(el, "web"), "Escape");
      await settle();
      await expect.poll(() => menu(el)).toBeNull();
      await expect.poll(() => document.activeElement).toBe(toolsButton(el));
    });

    test("a chip's press switches its tool off and hands focus back to Tools; chips are in the toolbar's arrow order", async () => {
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo .tools=${TOOLS} .activeTools=${["research"]}></tc-chat-composer>`);
      const [chip] = chips(el);
      expect(chip.textContent!.trim()).toBe("Deep research");
      toolsButton(el)!.focus();
      key(toolsButton(el)!, "ArrowRight");
      expect(document.activeElement).toBe(chip);
      chip.click();
      await settle();
      expect(chips(el)).toHaveLength(0);
      expect(el.activeTools).toEqual([]);
      await expect.poll(() => document.activeElement).toBe(toolsButton(el));
    });

    test("controlled: a prevented change keeps activeTools until the page sets it", async () => {
      const el = await fixture<TcChatComposer>(
        html`<tc-chat-composer look=${look} demo .tools=${TOOLS} @tc-active-tools-change=${(e: Event) => e.preventDefault()}></tc-chat-composer>`,
      );
      toolsButton(el)!.click();
      await settle();
      item(el, "web").click();
      await settle();
      expect(el.activeTools).toEqual([]);
      expect(item(el, "web").getAttribute("aria-checked")).toBe("false");
      el.activeTools = ["web"];
      await settle();
      expect(item(el, "web").getAttribute("aria-checked")).toBe("true");
      expect(chips(el)).toHaveLength(1);
    });

    test("exclusive-tools: radio switches, one tool at a time, and pressing the chosen one turns it off", async () => {
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo exclusive-tools .tools=${TOOLS}></tc-chat-composer>`);
      toolsButton(el)!.click();
      await settle();
      expect(menu(el)!.querySelectorAll('[role="menuitemradio"]')).toHaveLength(3);
      item(el, "web").click();
      await settle();
      item(el, "research").click();
      await settle();
      expect(el.activeTools).toEqual(["research"]);
      expect(chips(el)).toHaveLength(1);
      item(el, "research").click();
      await settle();
      expect(el.activeTools).toEqual([]);
    });

    test("temporary chat: the toggle is pressed, the line and the dashed edge show, the send says so", async () => {
      const changes: boolean[] = [];
      const sent: ChatSend[] = [];
      const el = await fixture<TcChatComposer>(
        html`<tc-chat-composer look=${look} demo show-temporary @tc-temporary-change=${(e: CustomEvent<{ temporary: boolean }>) => changes.push(e.detail.temporary)} @tc-send=${(e: CustomEvent<ChatSend>) => sent.push(e.detail)}></tc-chat-composer>`,
      );
      const t = toggle(el)!;
      expect(t.getAttribute("aria-label")).toBe("Temporary chat");
      expect(t.getAttribute("aria-pressed")).toBe("false");
      expect(document.getElementById(t.getAttribute("aria-describedby")!)!.textContent).toBe("Not saved to history or memory");
      expect(t.querySelector(".ui-chat-composer__tip")!.getAttribute("aria-hidden")).toBe("true");
      expect(notice(el)).toBeNull();
      t.click();
      await settle();
      expect(changes).toEqual([true]);
      expect(el.temporary).toBe(true);
      expect(t.getAttribute("aria-pressed")).toBe("true");
      expect(notice(el)!.textContent!.replace(/\s+/g, " ").trim()).toBe("Temporary chat · Not saved to history or memory");
      expect(el.querySelector("[data-temporary]")).toBeTruthy();
      const edge = look === "standard" ? getComputedStyle(el.querySelector(".ui-chat-composer__card")!).borderTopStyle : getComputedStyle(el.querySelector(".ui-chat-composer__body")!).outlineStyle;
      expect(edge).toBe("dashed");
      expect(live(el)).toBe("Temporary chat on. This chat won't be saved to history or memory.");
      await send(el, "Just between us");
      expect(sent[0]).toMatchObject({ temporary: true, activeTools: [] });
      t.click();
      await settle();
      expect(notice(el)).toBeNull();
      expect(live(el)).toBe("Temporary chat off.");
    });

    test("temporary chat: a prevented toggle keeps it; the page setting it shows the line and is said", async () => {
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo show-temporary @tc-temporary-change=${(e: Event) => e.preventDefault()}></tc-chat-composer>`);
      toggle(el)!.click();
      await settle();
      expect(el.temporary).toBe(false);
      el.temporary = true;
      await settle();
      expect(notice(el)).toBeTruthy();
      expect(toggle(el)!.getAttribute("aria-pressed")).toBe("true");
      expect(live(el)).toMatch(/^Temporary chat on/);
    });

    test("narrow (320 px): chips wrap and the toolbar row never overflows", async () => {
      const wrap = await fixture<HTMLElement>(html`<div style="width: 320px">
        <tc-chat-composer look=${look} demo show-temporary model-switcher="toolbar" .settings=${{}} .tools=${TOOLS} .activeTools=${["web", "research", "think"]}></tc-chat-composer>
      </div>`);
      const el = wrap.querySelector<TcChatComposer>("tc-chat-composer")!;
      await settle();
      await finish(el);
      const row = bar(el)!;
      await expect.poll(() => row.scrollWidth <= row.clientWidth + 1).toBe(true);
      for (const c of [...row.children] as HTMLElement[]) expect(c.getBoundingClientRect().right).toBeLessThanOrEqual(row.getBoundingClientRect().right + 1);
      expect(chips(el)).toHaveLength(3);
    });
  });
}

test("React: tools controlled with onActiveToolsChange, temporary uncontrolled from defaultTemporary, both on onSend", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const onTools = vi.fn();
  const onTemp = vi.fn();
  const onSend = vi.fn();
  const icon = React.createElement("svg", { "data-mine": "" });
  function App() {
    const [on, setOn] = React.useState<string[]>(["think"]);
    return React.createElement(ChatComposer, {
      demo: true,
      tools: TOOLS.map((t) => (t.id === "web" ? { ...t, icon } : t)),
      activeTools: on,
      onActiveToolsChange: (next: string[], change: { tool: string; active: boolean }) => {
        onTools(next, change);
        setOn(next);
      },
      showTemporary: true,
      defaultTemporary: true,
      onTemporaryChange: onTemp,
      onSend,
    });
  }
  await act(async () => root.render(React.createElement(App)));
  const el = host.querySelector<TcChatComposer>("tc-chat-composer")!;
  await settle();
  expect(chips(el).map((c) => c.textContent!.trim())).toEqual(["Think longer"]);
  expect(notice(el)).toBeTruthy();
  toolsButton(el)!.click();
  await settle();
  // The React node icon reaches the element
  await expect.poll(() => item(el, "web").querySelector("[data-mine]")).toBeTruthy();
  await act(async () => item(el, "web").click());
  await settle();
  expect(onTools).toHaveBeenCalledWith(["web", "think"], { tool: "web", active: true });
  expect(chips(el)).toHaveLength(2);
  await act(async () => toggle(el)!.click());
  await settle();
  expect(onTemp).toHaveBeenCalledWith(false);
  expect(notice(el)).toBeNull();
  type(el, "Plan it");
  await settle();
  await act(async () => key(message(el), "Enter"));
  expect(onSend).toHaveBeenCalledWith("Plan it", expect.objectContaining({ activeTools: ["web", "think"], temporary: false }));
  await act(async () => root.unmount());
  host.remove();
});

for (const theme of ["light", "dark"])
  test(`axe: tools menu open, chips and a temporary chat, in both looks (${theme})`, async () => {
    const wrap = await fixture<HTMLElement>(html`<div data-tc-theme=${theme} style="background: ${theme === "dark" ? "#0e0e10" : "#fff"}; padding: 300px 8px 8px; display: grid; gap: 16px; width: 420px">
      <tc-chat-composer demo show-temporary temporary .tools=${TOOLS} .activeTools=${["web"]} disclaimer="AI can make mistakes. Check important info."></tc-chat-composer>
      <tc-chat-composer look="clean" demo show-temporary temporary exclusive-tools .tools=${TOOLS} .activeTools=${["think"]}></tc-chat-composer>
    </div>`);
    const [one] = wrap.querySelectorAll<TcChatComposer>("tc-chat-composer");
    toolsButton(one)!.click();
    await settle();
    await finish();
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
