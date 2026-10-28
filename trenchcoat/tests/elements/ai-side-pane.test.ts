/*
 * <tc-ai-side-pane> in real browsers – the block's behaviour, as an element.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import "../../src/elements/ai-side-pane";
import { describeShortcut, matchesShortcut, parseShortcut, type SidePaneMessage, type TcAiSidePane } from "../../src/elements/ai-side-pane";
import type { ChatPageContext } from "../../src/elements/chat-composer";
import { AiSidePane } from "../../src/elements/react/ai-side-pane";
import { AiSidePane as Block } from "../../blocks/ai-side-pane";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const PAGE: ChatPageContext = { title: "Q3 report", connected: true, count: 1, items: [{ id: "summary", label: "Summary", tokens: 420, kind: "source" }] };
const MESSAGES: SidePaneMessage[] = [
  { id: "u1", role: "user", text: "How did revenue do?", context: "Q3 report" },
  { id: "a1", role: "assistant", text: "Revenue was $48.2M [1].", sources: [{ title: "Revenue by region", name: "Q3 report", snippet: "Total $48.2M" }], followUps: ["Why?"] },
];
const CHATS = [
  { id: "q3", title: "Q3 revenue questions", updatedAt: Date.parse("2026-10-27T11:00") },
  { id: "board", title: "Board deck", updatedAt: Date.parse("2026-10-26T10:00") },
];

async function pane(attrs: { width?: number; messages?: SidePaneMessage[]; look?: "standard" | "clean"; open?: boolean } = {}) {
  const wrap = await fixture(html`<div style="width: ${attrs.width ?? 1000}px; height: 640px">
    <tc-ai-side-pane look=${attrs.look ?? "standard"} .messages=${attrs.messages ?? MESSAGES} .conversations=${CHATS} .conversation=${"q3"} .pageContext=${PAGE} .open=${attrs.open ?? true}>
      <article class="page"><h1>Q3 review</h1><button class="page-btn">Page action</button></article>
    </tc-ai-side-pane>
  </div>`);
  const el = wrap.querySelector<TcAiSidePane>("tc-ai-side-pane")!;
  await finish(wrap);
  return el;
}
const action = (el: Element, name: string) => el.querySelector<HTMLElement>(`[data-action="${name}"] button`)!;
const textarea = (el: Element) => el.querySelector<HTMLTextAreaElement>("tc-chat-composer textarea")!;
const events = (el: Element, name: string) => {
  const seen: unknown[] = [];
  el.addEventListener(name, (e) => seen.push((e as CustomEvent).detail));
  return seen;
};
const key = (target: EventTarget, k: string, init: KeyboardEventInit = {}) =>
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, composed: true, ...init }));

describe("tc-ai-side-pane", () => {
  test("the shortcut: parsed, matched by key or code, described per platform", () => {
    const s = parseShortcut("mod+.")!;
    expect(s).toMatchObject({ key: ".", mod: true, shift: false });
    expect(matchesShortcut(new KeyboardEvent("keydown", { key: ".", ctrlKey: true }), s)).toBe(true);
    expect(matchesShortcut(new KeyboardEvent("keydown", { key: ">", code: "Period", metaKey: true }), s)).toBe(true);
    expect(matchesShortcut(new KeyboardEvent("keydown", { key: "." }), s)).toBe(false);
    expect(parseShortcut("mod++")!.key).toBe("+");
    expect(parseShortcut("")).toBeNull();
    expect(describeShortcut(s, true)).toEqual({ label: "⌘.", aria: "Meta+." });
    expect(describeShortcut(parseShortcut("ctrl+shift+k"), false)).toEqual({ label: "Ctrl+Shift+K", aria: "Control+Shift+K" });
  });

  test("docked: the page beside a complementary pane named by its title, in both looks", async () => {
    for (const look of ["standard", "clean"] as const) {
      const el = await pane({ look });
      expect(el.dataset.ui).toBe("sp");
      expect(el.dataset.look).toBe(look);
      const p = el.querySelector<HTMLElement>(".ui-sp__pane")!;
      expect(p.getAttribute("role")).toBe("complementary");
      expect(document.getElementById(p.getAttribute("aria-labelledby")!)!.textContent).toBe("Assistant");
      // The page is the element's own child, beside the pane
      const page = el.querySelector<HTMLElement>(":scope > .page")!;
      expect(page.getBoundingClientRect().right).toBeLessThanOrEqual(p.getBoundingClientRect().left + 1);
      expect(Math.round(p.getBoundingClientRect().width)).toBe(400);
      expect(el.querySelector(".tc-head__sub")!.textContent).toBe("Q3 revenue questions");
      const handle = el.querySelector(".ui-sp__handle")!;
      expect(handle.getAttribute("role")).toBe("separator");
      expect(handle.getAttribute("aria-valuenow")).toBe("400");
      cleanup();
    }
  });

  test("messages: the user's with what was attached, the answer with its sources and one row of actions", async () => {
    const el = await pane();
    const user = el.querySelector('[data-message="u1"]')!;
    expect(user.querySelector(".ui-sp__bubble")!.textContent).toBe("How did revenue do?");
    expect(user.querySelector(".ui-sp__attached")!.textContent).toBe("Sent with Q3 report");
    const answer = el.querySelector('[data-message="a1"]')!;
    expect(answer.querySelector("tc-ai-answer")).not.toBeNull();
    expect(answer.querySelectorAll("tc-message-actions")).toHaveLength(1);
    expect((answer.querySelector("tc-ai-answer") as HTMLElement & { animated: boolean }).animated).toBe(false);
  });

  test("sending: one tc-send with the page context, onSend's promise keeps the text, no inner event leaks", async () => {
    const el = await pane();
    const sends = events(el, "tc-send");
    let done!: () => void;
    el.onSend = vi.fn(() => new Promise<void>((r) => (done = r)));
    const ta = textarea(el);
    ta.focus();
    ta.value = "Why did EMEA fall?";
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    key(ta, "Enter");
    await settle();
    // The composer's model: the first one, "auto", until another is picked
    expect(sends).toEqual([{ message: "Why did EMEA fall?", model: "auto", pageContext: PAGE }]);
    expect(el.onSend).toHaveBeenCalledWith("Why did EMEA fall?", { model: "auto", pageContext: PAGE });
    done();
    await expect.poll(() => textarea(el).value).toBe("");
    // A follow-up from the answer sends too, through the same event
    el.querySelector("tc-ai-answer")!.dispatchEvent(new CustomEvent("tc-follow-up", { detail: { question: "Why?" }, bubbles: true, composed: true }));
    expect(sends.at(-1)).toMatchObject({ message: "Why?" });
  });

  test("before the first message: starters send or fill the composer", async () => {
    const el = await pane({ messages: [] });
    el.starters = [
      { id: "s", text: "Summarise the report" },
      { id: "f", text: "Draft a note about ", label: "Draft a note…", mode: "fill" },
    ];
    await settle();
    expect(el.querySelector(".ui-sp__hello")!.textContent).toBe("Ask about Q3 report");
    expect((el.querySelector("tc-prompt-starters") as HTMLElement & { heading: string }).heading).toBe("From Q3 report");
    const sends = events(el, "tc-send");
    const starters = el.querySelector("tc-prompt-starters")!;
    starters.dispatchEvent(new CustomEvent("tc-send", { detail: { text: "Summarise the report", item: el.starters[0] }, bubbles: true, composed: true }));
    expect(sends).toEqual([{ message: "Summarise the report", model: "", pageContext: PAGE }]);
    starters.dispatchEvent(new CustomEvent("tc-fill", { detail: { text: "Draft a note about ", item: el.starters[1] }, bubbles: true, composed: true }));
    await settle();
    await expect.poll(() => textarea(el).value).toBe("Draft a note about ");
  });

  test("close and open: the launcher, the shortcut, and focus back where it was", async () => {
    const el = await pane();
    const opens = events(el, "tc-open-change");
    textarea(el).focus();
    action(el, "close").click();
    await settle();
    expect(opens).toEqual([{ open: false }]);
    expect(el.querySelector<HTMLElement>(".ui-sp__pane")!.hidden).toBe(true);
    const launcher = el.querySelector<HTMLButtonElement>(".ui-sp__launcher")!;
    expect(launcher.textContent).toContain("Ask AI");
    await expect.poll(() => document.activeElement).toBe(launcher);
    // ⌘. / Ctrl+. opens it and focuses the composer
    key(window, ".", { ctrlKey: true, metaKey: true, code: "Period" });
    await settle();
    expect(el.open).toBe(true);
    await expect.poll(() => document.activeElement).toBe(textarea(el));
    // Pressed inside, it closes
    key(textarea(el), ".", { ctrlKey: true, metaKey: true, code: "Period" });
    await settle();
    expect(el.open).toBe(false);
  });

  test("controlled: preventDefault keeps open, collapsed and width", async () => {
    const el = await pane();
    for (const n of ["tc-open-change", "tc-collapsed-change", "tc-width-change"]) el.addEventListener(n, (e) => e.preventDefault());
    action(el, "close").click();
    action(el, "collapse").click();
    key(el.querySelector(".ui-sp__handle")!, "ArrowLeft");
    await settle();
    expect(el.open).toBe(true);
    expect(el.collapsed).toBe(false);
    expect(el.width).toBe(400);
    expect(el.querySelector(".ui-sp__handle")!.getAttribute("aria-valuenow")).toBe("400");
  });

  test("the edge: arrow keys, Home, End and Enter resize within the limits", async () => {
    const el = await pane();
    const widths = events(el, "tc-width-change");
    const handle = el.querySelector(".ui-sp__handle")!;
    key(handle, "ArrowLeft");
    await settle();
    expect(el.width).toBe(416);
    key(handle, "ArrowRight", { shiftKey: true });
    await settle();
    expect(el.width).toBe(352);
    key(handle, "Home");
    key(handle, "End");
    await settle();
    expect(el.width).toBe(640);
    key(handle, "Enter");
    await settle();
    await finish(el);
    expect(widths).toEqual([{ width: 416 }, { width: 352 }, { width: 320 }, { width: 640 }, { width: 400 }]);
    expect(Math.round(el.querySelector(".ui-sp__pane")!.getBoundingClientRect().width)).toBe(400);
  });

  test("dragging the edge reports the width once, at the end", async () => {
    const el = await pane();
    const widths = events(el, "tc-width-change");
    const handle = el.querySelector<HTMLElement>(".ui-sp__handle")!;
    const x = handle.getBoundingClientRect().left;
    handle.dispatchEvent(new PointerEvent("pointerdown", { button: 0, clientX: x, pointerId: 1, bubbles: true }));
    handle.dispatchEvent(new PointerEvent("pointermove", { clientX: x - 60, pointerId: 1, bubbles: true }));
    handle.dispatchEvent(new PointerEvent("pointermove", { clientX: x - 100, pointerId: 1, bubbles: true }));
    expect(widths).toEqual([]);
    expect(el.hasAttribute("data-resizing")).toBe(true);
    handle.dispatchEvent(new PointerEvent("pointerup", { clientX: x - 100, pointerId: 1, bubbles: true }));
    await settle();
    expect(widths).toEqual([{ width: 500 }]);
    expect(el.width).toBe(500);
  });

  test("collapse to the rail and expand: focus follows", async () => {
    const el = await pane();
    action(el, "collapse").click();
    await settle();
    expect(el.collapsed).toBe(true);
    expect(el.querySelector<HTMLElement>(".ui-sp__rail")!.hidden).toBe(false);
    await finish(el);
    expect(Math.round(el.querySelector(".ui-sp__pane")!.getBoundingClientRect().width)).toBe(52);
    expect(el.querySelector(".ui-sp__handle")).toBeNull();
    await expect.poll(() => document.activeElement).toBe(action(el, "expand"));
    action(el, "expand").click();
    await settle();
    expect(el.collapsed).toBe(false);
    await expect.poll(() => document.activeElement).toBe(textarea(el));
  });

  test("History: opens in place of the conversation; a pick is reported and closes it", async () => {
    const el = await pane();
    const picks = events(el, "tc-conversation-change");
    action(el, "history").click();
    await settle();
    const region = el.querySelector<HTMLElement>(".ui-sp__history")!;
    expect(region.hidden).toBe(false);
    expect(el.querySelector<HTMLElement>(".ui-sp__thread")!.hidden).toBe(true);
    expect(action(el, "history").getAttribute("aria-expanded")).toBe("true");
    el.querySelector("tc-chat-history")!.dispatchEvent(new CustomEvent("tc-value-change", { detail: { value: "board" }, bubbles: true, composed: true, cancelable: true }));
    await settle();
    expect(picks).toEqual([{ conversation: "board" }]);
    expect(el.conversation).toBe("board");
    expect(region.hidden).toBe(true);
    // Escape inside closes History, back to the conversation
    action(el, "history").click();
    await settle();
    key(el.querySelector(".ui-sp__history tc-button button")!, "Escape");
    await settle();
    expect(el.querySelector<HTMLElement>(".ui-sp__history")!.hidden).toBe(true);
  });

  test("narrow: a modal sheet over an inert page; Escape and the scrim close it; Tab stays inside", async () => {
    const el = await pane({ width: 600 });
    const p = el.querySelector<HTMLElement>(".ui-sp__pane")!;
    expect(el.hasAttribute("data-overlay")).toBe(true);
    expect(p.getAttribute("role")).toBe("dialog");
    expect(p.getAttribute("aria-modal")).toBe("true");
    expect(el.querySelector(".page")!.hasAttribute("inert")).toBe(true);
    expect(el.querySelector(".ui-sp__handle")).toBeNull();
    // Tab from the last stop wraps to the first
    const stops = [...p.querySelectorAll<HTMLElement>("button, textarea, [tabindex='0']")].filter((x) => x.getClientRects().length && !x.closest("[hidden], [inert]") && x.tabIndex >= 0);
    stops.at(-1)!.focus();
    key(stops.at(-1)!, "Tab");
    expect(document.activeElement).not.toBe(stops.at(-1));
    expect(p.contains(document.activeElement)).toBe(true);
    key(textarea(el), "Escape");
    await settle();
    expect(el.open).toBe(false);
    expect(el.querySelector(".page")!.hasAttribute("inert")).toBe(false);
    el.querySelector<HTMLElement>(".ui-sp__launcher")!.click();
    await settle();
    el.querySelector<HTMLElement>(".ui-sp__scrim")!.click();
    await settle();
    expect(el.open).toBe(false);
  });

  test("claims, a reflection gate, and an error with Try again", async () => {
    const el = await pane({
      messages: [
        { id: "u", role: "user", text: "Should we cut the budget?" },
        {
          id: "c",
          role: "assistant",
          text: "",
          claims: [{ id: "c1", text: "EMEA fell 4%", source: "grounded", confidence: 0.9, sources: ["s1"] }],
          claimSources: [{ id: "s1", title: "Revenue", site: "Q3 report", quote: "EMEA −4%" }],
          reflect: "checkpoint",
          followUps: ["And next year?"],
        },
        { id: "e", role: "assistant", text: "", error: "The model timed out." },
      ],
    });
    const c = el.querySelector('[data-message="c"]')!;
    expect(c.querySelector("tc-claim-answer")).not.toBeNull();
    expect(c.querySelector("tc-reflection-gate")).not.toBeNull();
    const reflects = events(el, "tc-reflect");
    el.addEventListener("tc-reflect", (e) => e.preventDefault(), { once: true });
    const submit = new CustomEvent("tc-submit", { detail: { mode: "checkpoint", value: {} }, bubbles: true, composed: true, cancelable: true });
    c.querySelector("tc-reflection-gate")!.dispatchEvent(submit);
    expect(reflects).toEqual([{ id: "c", submission: { mode: "checkpoint", value: {} } }]);
    // Prevented: the gate is told to stay open
    expect(submit.defaultPrevented).toBe(true);
    const verifies = events(el, "tc-verify");
    c.querySelector("tc-claim-answer")!.dispatchEvent(new CustomEvent("tc-verify", { detail: { claim: { id: "c1" }, sources: [] }, bubbles: true, composed: true }));
    expect(verifies).toEqual([{ id: "c", claim: { id: "c1" }, sources: [] }]);
    const regens = events(el, "tc-regenerate");
    el.onRegenerate = vi.fn();
    const err = el.querySelector('[data-message="e"] [role="alert"]')!;
    expect(err.textContent).toContain("The model timed out.");
    err.querySelector<HTMLElement>('[data-action="retry"] button')!.click();
    expect(regens).toEqual([{ id: "e" }]);
    expect(el.onRegenerate).toHaveBeenCalledWith("e");
  });

  test("a prior gate hides the answer until it's done", async () => {
    const el = await pane({ messages: [{ id: "p", role: "assistant", text: "The answer.", reflect: "prior" }] });
    expect(el.querySelector('[data-message="p"] tc-ai-answer')).toBeNull();
    el.querySelector("tc-reflection-gate")!.dispatchEvent(new CustomEvent("tc-phase-change", { detail: { phase: "done" }, bubbles: true, composed: true, cancelable: true }));
    await settle();
    expect(el.querySelector('[data-message="p"] tc-ai-answer')).not.toBeNull();
  });

  test("moved in the page: it still follows its width to a sheet", async () => {
    const el = await pane();
    const narrow = document.createElement("div");
    narrow.style.cssText = "width: 500px; height: 600px";
    document.body.append(narrow);
    narrow.append(el);
    await expect.poll(() => el.hasAttribute("data-overlay")).toBe(true);
  });

  test("React: controlled width waits for the parent; the page is the children", async () => {
    const host = document.createElement("div");
    host.style.cssText = "width: 1000px; height: 600px";
    document.body.append(host);
    const root = createRoot(host);
    const onWidthChange = vi.fn();
    const onSend = vi.fn();
    await act(async () =>
      root.render(React.createElement(AiSidePane, { title: "Helper", messages: MESSAGES, width: 400, onWidthChange, onSend, pageContext: PAGE }, React.createElement("main", { className: "page" }, "Report"))),
    );
    await settle();
    const el = host.querySelector<TcAiSidePane>("tc-ai-side-pane")!;
    expect(el.heading).toBe("Helper");
    expect(el.querySelector(":scope > main.page")!.textContent).toBe("Report");
    await act(async () => void key(el.querySelector(".ui-sp__handle")!, "ArrowLeft"));
    await settle();
    expect(onWidthChange).toHaveBeenCalledWith(416);
    expect(el.width).toBe(400);
    await act(async () =>
      root.render(React.createElement(AiSidePane, { title: "Helper", messages: MESSAGES, width: 416, onWidthChange, onSend, pageContext: PAGE }, React.createElement("main", { className: "page" }, "Report"))),
    );
    await settle();
    expect(el.width).toBe(416);
    act(() => root.unmount());
  });

  test("the block file passes the block's props through", async () => {
    const host = document.createElement("div");
    host.style.cssText = "width: 1000px; height: 600px";
    document.body.append(host);
    const root = createRoot(host);
    const onNewChat = vi.fn();
    await act(async () => root.render(React.createElement(Block, { messages: [], onNewChat, defaultOpen: true, side: "left", shortcut: null })));
    await settle();
    const el = host.querySelector<TcAiSidePane>("tc-ai-side-pane")!;
    expect(el.dataset.side).toBe("left");
    expect(el.shortcut).toBe("");
    action(el, "new-chat").click();
    expect(onNewChat).toHaveBeenCalledTimes(1);
    act(() => root.unmount());
  });

  test("axe: no violations in both looks and both themes, docked and as a sheet", async () => {
    for (const theme of ["light", "dark"]) {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <div style="width: 1000px; height: 600px"><tc-ai-side-pane .messages=${MESSAGES} .conversations=${CHATS} .pageContext=${PAGE}><main><h1>Report</h1></main></tc-ai-side-pane></div>
        <div style="width: 600px; height: 600px"><tc-ai-side-pane look="clean" .messages=${MESSAGES} .pageContext=${PAGE}><main><h1>Report</h1></main></tc-ai-side-pane></div>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${theme} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      cleanup();
    }
  });
});
