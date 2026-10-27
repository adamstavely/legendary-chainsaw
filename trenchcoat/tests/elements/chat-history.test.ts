/*
 * <tc-chat-history> in real browsers: date groups relative to `now`, search, the tree keyboard pattern, rename,
 * pin, move and delete with Undo, controlled use, windowing with 10,000 chats, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/chat-history";
import { TcChatHistory, type ChatConversation, type ChatConversationsChange, type ChatDeleteDetail, type ChatFolder, type ChatValueChange } from "../../src/elements/chat-history";
import { ChatHistory } from "../../src/elements/react/chat-history";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

const NOW = new Date(2026, 9, 24, 12, 0).getTime();
const at = (y: number, m: number, d: number, h = 9) => new Date(y, m, d, h).getTime();
const FOLDERS: ChatFolder[] = [
  { id: "launch", label: "Q4 launch" },
  { id: "empty", label: "Empty folder" },
];
const CHATS: ChatConversation[] = [
  { id: "t1", title: "Fix flaky checkout test", updatedAt: NOW - 3_600_000 },
  { id: "t2", title: "Rewrite onboarding email", updatedAt: new Date(NOW - 7_200_000) },
  { id: "y1", title: "Summarize the Acme call", updatedAt: at(2026, 9, 23) },
  { id: "w1", title: "Plan the offsite", updatedAt: at(2026, 9, 20) },
  { id: "m1", title: "Postmortem: login outage", updatedAt: at(2026, 9, 1) },
  { id: "a1", title: "Board update outline", updatedAt: new Date(at(2026, 7, 15)).toISOString() },
  { id: "o1", title: "Holiday support rota", updatedAt: at(2025, 11, 1) },
  { id: "p1", title: "Release note for v2.4", updatedAt: at(2026, 5, 1), pinned: true },
  { id: "f1", title: "Launch checklist review", updatedAt: NOW - 1000, folder: "launch" },
  { id: "f2", title: "Pricing page copy", updatedAt: at(2026, 8, 1), folder: "launch" },
  { id: "x1", title: "Lost folder", updatedAt: NOW - 500, folder: "gone" },
];

const heads = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-chh__head-row")].map((h) => `${h.querySelector(".ui-chh__group-label")!.textContent} ${h.querySelector(".ui-chh__group-count")!.textContent}`);
const titles = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-chh__item")].map((r) => r.getAttribute("aria-label"));
const row = (el: Element, key: string) => el.querySelector<HTMLElement>(`.ui-chh__row[data-key="${key}"]`)!;
const key = (target: Element, k: string, opts: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...opts }));
const focused = () => (document.activeElement as HTMLElement | null)?.dataset.key;
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent!.trim();
const mount = () => fixture<TcChatHistory>(html`<tc-chat-history .conversations=${CHATS} .folders=${FOLDERS} .now=${NOW} value="t1"></tc-chat-history>`);

describe("tc-chat-history", () => {
  test("the host is the root; Standard puts the card in the tray, Clean is one card; the list is a named tree", async () => {
    const el = await mount();
    expect(el.dataset.ui).toBe("chh");
    expect(el.dataset.look).toBe("standard");
    expect(el.querySelector(".ui-chh__card .ui-chh__rows")).toBeTruthy();
    expect(el.querySelector(":scope > .ui-chh__foot")).toBeTruthy();
    const tree = el.querySelector('[role="tree"]')!;
    expect(document.getElementById(tree.getAttribute("aria-labelledby")!)!.textContent).toBe("Chats");
    expect(el.querySelector(".ui-chh__count")!.textContent).toBe("11");
    el.look = "clean";
    el.heading = "History";
    await settle();
    expect(el.querySelector(".ui-chh__card")).toBeNull();
    expect(el.querySelector('.ui-chh__glyph[viewBox="0 0 16 16"]')).toBeTruthy();
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("History");
  });

  test("groups: Pinned, the folders, then Today / Yesterday / Previous 7 days / Previous 30 days / months, relative to `now`", async () => {
    const el = await mount();
    expect(heads(el)).toEqual([
      "Pinned 1",
      "Q4 launch 2",
      "Empty folder 0",
      "Today 3",
      "Yesterday 1",
      "Previous 7 days 1",
      "Previous 30 days 1",
      "August 1",
      "December 2025 1",
    ]);
    // Newest first inside a group; a chat in a folder that doesn't exist goes by its date
    expect(titles(el).slice(0, 6)).toEqual(["Release note for v2.4", "Launch checklist review", "Pricing page copy", "Lost folder", "Fix flaky checkout test", "Rewrite onboarding email"]);
    const h = row(el, "g:today");
    expect([h.getAttribute("aria-level"), h.getAttribute("aria-posinset"), h.getAttribute("aria-setsize"), h.getAttribute("aria-expanded")]).toEqual(["1", "4", "9", "true"]);
    const r = row(el, "c:t2");
    expect([r.getAttribute("role"), r.getAttribute("aria-level"), r.getAttribute("aria-posinset"), r.getAttribute("aria-setsize"), r.getAttribute("aria-selected")]).toEqual(["treeitem", "2", "3", "3", "false"]);
    expect(row(el, "c:t1").getAttribute("aria-selected")).toBe("true");
    // A day later, Today's chats are Yesterday's
    el.now = new Date(NOW + 86_400_000);
    await settle();
    expect(heads(el).slice(3, 5)).toEqual(["Yesterday 3", "Previous 7 days 2"]);
  });

  test("`now` defaults to when the element was connected", async () => {
    const el = await fixture<TcChatHistory>(html`<tc-chat-history .conversations=${[{ id: "a", title: "Just now", updatedAt: Date.now() - 1000 }]}></tc-chat-history>`);
    expect(heads(el)).toEqual(["Today 1"]);
    expect(Math.abs(el.nowMs - Date.now())).toBeLessThan(5000);
  });

  test("search filters by title, marks the match, keeps the groups and says how many match", async () => {
    const el = await mount();
    const input = el.querySelector<HTMLInputElement>(".ui-chh__input")!;
    input.value = "re";
    input.dispatchEvent(new Event("input"));
    await settle();
    expect(titles(el)).toEqual(["Release note for v2.4", "Launch checklist review", "Rewrite onboarding email"]);
    expect([...el.querySelectorAll(".ui-chh__mark")].map((m) => m.textContent)).toContain("Re");
    expect(heads(el)[0]).toBe("Pinned 1");
    expect(status(el)).toBe("3 chats match");
    // ↓ goes into the list
    key(input, "ArrowDown");
    await settle();
    expect(focused()).toBe("c:p1");
    input.focus();
    input.value = "zzz";
    input.dispatchEvent(new Event("input"));
    await settle();
    expect(el.querySelector(".ui-chh__empty")!.textContent).toBe("No chats match “zzz”");
    expect(status(el)).toBe("No chats match");
    key(input, "Escape");
    await settle();
    expect(el.querySelector(".ui-chh__empty")).toBeNull();
    expect(titles(el)).toHaveLength(11);
  });

  test("the tree keyboard pattern: roving tab stop, arrows, Home/End, fold and unfold, Enter opens, type-ahead", async () => {
    const el = await mount();
    const values: (string | null)[] = [];
    el.addEventListener("tc-value-change", (e) => values.push((e as CustomEvent<ChatValueChange>).detail.value));
    // One tab stop: the open chat
    expect([...el.querySelectorAll('.ui-chh__row[tabindex="0"]')].map((r) => (r as HTMLElement).dataset.key)).toEqual(["c:t1"]);
    row(el, "c:t1").focus();
    key(row(el, "c:t1"), "ArrowDown");
    expect(focused()).toBe("c:t2");
    key(document.activeElement!, "ArrowLeft");
    expect(focused()).toBe("g:today");
    key(document.activeElement!, "ArrowLeft");
    await settle();
    expect(row(el, "g:today").getAttribute("aria-expanded")).toBe("false");
    expect(row(el, "c:t1")).toBeNull();
    key(document.activeElement!, "ArrowRight");
    await settle();
    expect(row(el, "g:today").getAttribute("aria-expanded")).toBe("true");
    key(document.activeElement!, "ArrowRight");
    expect(focused()).toBe("c:x1");
    key(document.activeElement!, "Enter");
    await settle();
    expect(values).toEqual(["x1"]);
    expect(el.value).toBe("x1");
    expect(row(el, "c:x1").getAttribute("aria-selected")).toBe("true");
    key(document.activeElement!, "Home");
    expect(focused()).toBe("g:pinned");
    key(document.activeElement!, "End");
    expect(focused()).toBe("c:o1");
    // Space folds a group
    row(el, "g:folder:launch").focus();
    key(document.activeElement!, " ");
    await settle();
    expect(row(el, "g:folder:launch").getAttribute("aria-expanded")).toBe("false");
    // Type-ahead
    key(document.activeElement!, "p");
    expect(focused()).toBe("g:week");
    key(document.activeElement!, "o");
    expect(focused()).toBe("c:m1");
  });

  test("controlled value: preventDefault keeps the open chat", async () => {
    const el = await mount();
    el.addEventListener("tc-value-change", (e) => e.preventDefault());
    row(el, "c:y1").click();
    await settle();
    expect(el.value).toBe("t1");
  });

  test("F2 renames in place: Enter saves, Esc cancels, focus goes back to the row", async () => {
    const el = await mount();
    const renames: unknown[] = [];
    el.addEventListener("tc-rename", (e) => renames.push((e as CustomEvent).detail));
    row(el, "c:t2").focus();
    key(row(el, "c:t2"), "F2");
    await settle();
    const input = el.querySelector<HTMLInputElement>(".ui-chh__rename")!;
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe("Rewrite onboarding email");
    input.value = "Onboarding email v2";
    input.dispatchEvent(new Event("input"));
    key(input, "Enter");
    await settle();
    expect(renames).toEqual([{ id: "t2", title: "Onboarding email v2" }]);
    expect(el.conversations.find((c) => c.id === "t2")!.title).toBe("Onboarding email v2");
    expect(focused()).toBe("c:t2");
    expect(status(el)).toBe("Renamed to “Onboarding email v2”");
    key(row(el, "c:t2"), "F2");
    await settle();
    const again = el.querySelector<HTMLInputElement>(".ui-chh__rename")!;
    again.value = "Nope";
    again.dispatchEvent(new Event("input"));
    key(again, "Escape");
    await settle();
    expect(el.conversations.find((c) => c.id === "t2")!.title).toBe("Onboarding email v2");
    expect(focused()).toBe("c:t2");
  });

  test("Delete removes the chat with Undo; focus takes the next row; Undo puts it back where it was", async () => {
    const el = await mount();
    const events: string[] = [];
    el.addEventListener("tc-delete", (e) => events.push(`delete ${(e as CustomEvent<ChatDeleteDetail>).detail.id}`));
    el.addEventListener("tc-restore", (e) => events.push(`restore ${(e as CustomEvent<ChatDeleteDetail>).detail.id}`));
    row(el, "c:t1").focus();
    key(row(el, "c:t1"), "Delete");
    await settle();
    expect(events).toEqual(["delete t1"]);
    expect(row(el, "c:t1")).toBeNull();
    expect(focused()).toBe("c:t2");
    expect(el.querySelector(".ui-chh__deleted")!.textContent).toBe("Deleted “Fix flaky checkout test”");
    expect(status(el)).toBe("Deleted “Fix flaky checkout test”. Undo is below the list");
    const undo = el.querySelector<HTMLButtonElement>(".ui-chh__undo")!;
    undo.focus();
    undo.click();
    await settle();
    expect(events).toEqual(["delete t1", "restore t1"]);
    expect(el.conversations.map((c) => c.id)).toEqual(CHATS.map((c) => c.id));
    expect(focused()).toBe("c:t1");
    expect(el.querySelector(".ui-chh__undo")).toBeNull();
    expect(el.querySelector(".ui-chh__hints")).toBeTruthy();
  });

  test("Undo goes after undoFor – but waits while the pointer is on it; no timer outlives the element", async () => {
    const el = await fixture<TcChatHistory>(html`<tc-chat-history undo-for="80" .conversations=${CHATS} .now=${NOW}></tc-chat-history>`);
    row(el, "c:y1").focus();
    key(row(el, "c:y1"), "Backspace");
    await settle();
    const foot = el.querySelector<HTMLElement>(".ui-chh__foot")!;
    foot.dispatchEvent(new PointerEvent("pointerenter"));
    await settle();
    await new Promise((r) => setTimeout(r, 150));
    expect(el.querySelector(".ui-chh__undo")).toBeTruthy();
    foot.dispatchEvent(new PointerEvent("pointerleave"));
    await settle();
    await new Promise((r) => setTimeout(r, 150));
    await settle();
    expect(el.querySelector(".ui-chh__undo")).toBeNull();
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    row(el, "c:w1").focus();
    key(row(el, "c:w1"), "Delete");
    await el.updateComplete;
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    el.remove();
    expect(vi.getTimerCount()).toBe(0);
  });

  test("the actions menu: Shift+F10 opens it, arrows move, Esc closes back to the row; pin, move and delete from it", async () => {
    const el = await mount();
    const changes: ChatConversation[][] = [];
    el.addEventListener("tc-conversations-change", (e) => changes.push((e as CustomEvent<ChatConversationsChange>).detail.conversations));
    row(el, "c:t2").focus();
    key(row(el, "c:t2"), "F10", { shiftKey: true });
    await settle();
    const menu = el.querySelector<HTMLElement>('[role="menu"]')!;
    expect(menu.getAttribute("aria-label")).toBe("Actions for “Rewrite onboarding email”");
    const items = () => [...el.querySelectorAll<HTMLElement>(".ui-chh__menu-item")];
    expect(items().map((i) => i.textContent!.replace(/\s+/g, "").trim())).toEqual(["RenameF2", "Pin", "Q4launch", "Emptyfolder", "Nofolder✓", "Delete⌫"]);
    expect(document.activeElement).toBe(items()[0]);
    key(menu, "ArrowDown");
    expect(document.activeElement).toBe(items()[1]);
    key(menu, "ArrowUp");
    key(menu, "ArrowUp");
    expect(document.activeElement).toBe(items().at(-1));
    key(menu, "Escape");
    await settle();
    expect(el.querySelector('[role="menu"]')).toBeNull();
    expect(focused()).toBe("c:t2");
    // Pin
    key(row(el, "c:t2"), "ContextMenu");
    await settle();
    items()[1].click();
    await settle();
    expect(changes.at(-1)!.find((c) => c.id === "t2")!.pinned).toBe(true);
    expect(row(el, "c:t2").getAttribute("aria-posinset")).toBe("1");
    expect(focused()).toBe("c:t2");
    // Move into a folder (leaves Pinned)
    key(row(el, "c:t2"), "ContextMenu");
    await settle();
    items().find((i) => i.textContent!.includes("Empty folder"))!.click();
    await settle();
    expect(changes.at(-1)!.find((c) => c.id === "t2")).toMatchObject({ folder: "empty", pinned: false });
    expect(heads(el)).toContain("Empty folder 1");
    expect(focused()).toBe("c:t2");
    // Delete
    key(row(el, "c:t2"), "ContextMenu");
    await settle();
    items().at(-1)!.click();
    await settle();
    expect(row(el, "c:t2")).toBeNull();
    expect(document.activeElement).not.toBe(document.body);
  });

  test("the row's pointer actions: pin and the menu; right-click opens the menu, a click outside closes it", async () => {
    const el = await mount();
    const pins: unknown[] = [];
    el.addEventListener("tc-pin", (e) => pins.push((e as CustomEvent).detail));
    const acts = row(el, "c:y1").querySelector(".ui-chh__acts")!;
    expect(acts.getAttribute("aria-hidden")).toBe("true");
    expect([...acts.querySelectorAll("button")].every((b) => b.tabIndex === -1)).toBe(true);
    acts.querySelector<HTMLButtonElement>('[title="Pin"]')!.click();
    await settle();
    expect(pins).toEqual([{ id: "y1", pinned: true }]);
    row(el, "c:w1").dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 40, clientY: 40 }));
    await settle();
    expect(el.querySelector('[role="menu"]')).toBeTruthy();
    expect(row(el, "c:w1").hasAttribute("data-menu")).toBe(true);
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await settle();
    expect(el.querySelector('[role="menu"]')).toBeNull();
  });

  test("controlled conversations: a prevented change leaves the list as it is", async () => {
    const el = await mount();
    el.addEventListener("tc-conversations-change", (e) => e.preventDefault());
    row(el, "c:t1").focus();
    key(row(el, "c:t1"), "Delete");
    await settle();
    expect(el.conversations).toBe(CHATS);
    expect(row(el, "c:t1")).toBeTruthy();
  });

  test("New chat fires tc-new-chat; hints=false hides the hints", async () => {
    const el = await fixture<TcChatHistory>(html`<tc-chat-history hints="false" .conversations=${CHATS} .now=${NOW}></tc-chat-history>`);
    let fired = 0;
    el.addEventListener("tc-new-chat", () => fired++);
    el.querySelector<HTMLButtonElement>('[aria-label="New chat"]')!.click();
    expect(fired).toBe(1);
    expect(el.querySelector(".ui-chh__foot")).toBeNull();
  });

  test("windowed: 10,000 chats render only the rows near the viewport; End, scrolling and focus keep working", async () => {
    const N = 10_000;
    const many = Array.from({ length: N }, (_, i) => ({ id: `m${i}`, title: `Chat ${i}`, updatedAt: NOW - i * 3_600_000 }));
    const t0 = performance.now();
    const el = await fixture<TcChatHistory>(html`<tc-chat-history max-height="400" .conversations=${many} .now=${NOW}></tc-chat-history>`);
    expect(performance.now() - t0).toBeLessThan(2000);
    const rendered = () => el.querySelectorAll(".ui-chh__row").length;
    expect(rendered()).toBeLessThan(120);
    const first = el.querySelector<HTMLElement>(".ui-chh__row")!;
    const h = first.offsetHeight;
    const list = el.querySelector<HTMLElement>(".ui-chh__list")!;
    // Spacers keep the full height
    expect(Math.abs(list.scrollHeight - el.visibleRows.length * first.offsetHeight)).toBeLessThan(first.offsetHeight * 3);
    // End jumps to the last chat, which renders and takes focus
    first.focus();
    key(first, "End");
    await settle();
    await settle();
    expect(focused()).toBe(`c:m${N - 1}`);
    expect(rendered()).toBeLessThan(160);
    const last = el.visibleRows.at(-1)!;
    expect(row(el, last.key).getAttribute("aria-setsize")).toBe(String(el.visibleRows.filter((r) => r.kind === "chat" && r.group === last.group).length));
    // Scrolling the list renders the rows it brings into view
    list.scrollTop = 4000 * h;
    // Scroll events and the following animation frame can be delayed while the browser suite is busy.
    await expect.poll(() => {
      const keys = [...el.querySelectorAll<HTMLElement>(".ui-chh__row")].map((r) => el.visibleRows.findIndex((v) => v.key === r.dataset.key));
      return keys.some((i) => Math.abs(i - 4000) < 30);
    }, { timeout: 3000 }).toBe(true);
    // The focused row stays rendered while it's out of the window, placed where it would be; the scroll position holds
    const kept = row(el, `c:m${N - 1}`);
    expect(kept.hasAttribute("data-float")).toBe(true);
    expect(kept.offsetTop).toBe((el.visibleRows.length - 1) * h);
    expect(list.scrollTop).toBe(4000 * h);
    expect(document.activeElement).toBe(kept);
  });

  test("reduced motion turns animation off", () => {
    expect(TcChatHistory.css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\[data-ui="chh"\] \*[^}]*animation: none !important; transition: none !important;/);
  });

  test("React wrapper: uncontrolled list and value survive a parent re-render; callbacks fire", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const log: string[] = [];
    let rerender!: () => void;
    function App() {
      const [, setN] = React.useState(0);
      rerender = () => setN((n) => n + 1);
      return React.createElement(ChatHistory, {
        defaultConversations: CHATS,
        folders: FOLDERS,
        now: NOW,
        defaultValue: "t1",
        title: "Your chats",
        onChange: (v) => log.push(`open ${v}`),
        onDelete: (id) => log.push(`delete ${id}`),
        onConversationsChange: (list) => log.push(`list ${list.length}`),
      });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcChatHistory>("tc-chat-history")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Your chats");
    await act(async () => row(el, "c:y1").click());
    await act(async () => {
      row(el, "c:w1").focus();
      key(row(el, "c:w1"), "Delete");
    });
    await settle();
    expect(log).toEqual(["open y1", "list 10", "delete w1"]);
    await act(async () => rerender());
    await settle();
    expect(el.value).toBe("y1");
    expect(el.conversations).toHaveLength(10);
    await act(async () => root.unmount());
  });

  test("React wrapper: a controlled value stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const picked: (string | null)[] = [];
    await act(async () => root.render(React.createElement(ChatHistory, { conversations: CHATS, now: NOW, value: "t1", onChange: (v) => picked.push(v) })));
    await settle();
    const el = host.querySelector<TcChatHistory>("tc-chat-history")!;
    await act(async () => row(el, "c:y1").click());
    await settle();
    expect(picked).toEqual(["y1"]);
    expect(el.value).toBe("t1");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"])
    test(`axe: no violations in either look (${theme}), with search marks, the menu and Undo showing`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="background: ${theme === "dark" ? "#0e0e10" : "#fff"}; padding: 8px">
        <tc-chat-history .conversations=${CHATS} .folders=${FOLDERS} .now=${NOW} value="t1"></tc-chat-history>
        <tc-chat-history look="clean" heading="Clean chats" .conversations=${CHATS} .folders=${FOLDERS} .now=${NOW} value="t2"></tc-chat-history>
      </div>`);
      const [a, b] = [...wrap.querySelectorAll<TcChatHistory>("tc-chat-history")];
      row(a, "c:t2").focus();
      key(row(a, "c:t2"), "Delete");
      const input = b.querySelector<HTMLInputElement>(".ui-chh__input")!;
      input.value = "re";
      input.dispatchEvent(new Event("input"));
      await settle();
      row(b, "c:t2").focus();
      key(row(b, "c:t2"), "ContextMenu");
      await settle();
      await Promise.all(document.getAnimations().map((x) => (x.finish(), x.finished)));
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
});
