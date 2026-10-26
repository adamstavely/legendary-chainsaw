/*
 * <tc-conversation-branches> in real browsers: the path through the message tree, the switcher, editing into a new
 * branch answered through tc-edit, controlled use, focus, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/conversation-branches";
import {
  TcConversationBranches,
  type BranchEditDetail,
  type BranchMessage,
  type BranchMessagesChange,
  type BranchSelectedChange,
} from "../../src/elements/conversation-branches";
import { ConversationBranches } from "../../src/elements/react/conversation-branches";
import { cleanup, fixture, settle } from "./helpers";

afterEach(cleanup);

const MESSAGES: BranchMessage[] = [
  { id: "u1", role: "user", text: "Write the release note for v2.4." },
  { id: "a1", role: "assistant", parentId: "u1", text: "v2.4 makes search 3× faster." },
  { id: "u2", role: "user", parentId: "a1", text: "Keep it under 30 words." },
  { id: "a2", role: "assistant", parentId: "u2", text: "Search is 3× faster." },
  { id: "u3", role: "user", parentId: "a1", text: "Make it friendlier." },
  { id: "a3", role: "assistant", parentId: "u3", text: "Good news: search is quicker.\n\nEnjoy!" },
];

const shown = (el: Element) => [...el.querySelectorAll<HTMLElement>("[data-message-id]:not(tc-message-actions)")].map((m) => m.dataset.messageId);
const btn = (root: ParentNode, name: string) => [...root.querySelectorAll<HTMLButtonElement>("button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent!.trim()) === name)!;
const row = (el: Element, depth: number) => el.querySelector<HTMLElement>(`.ui-cvb__row[data-depth="${depth}"]`)!;
const status = (el: Element) => el.querySelector(':scope > [aria-live="polite"]')!.textContent!.trim();
const finishAnimations = () => Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => (a.finish(), a.finished)));

async function edit(el: TcConversationBranches, depth: number, text: string) {
  btn(row(el, depth), "Edit message").click();
  await settle();
  const input = el.querySelector<HTMLTextAreaElement>(".ui-cvb__input")!;
  input.value = text;
  input.dispatchEvent(new Event("input"));
  await settle();
  return input;
}

describe("tc-conversation-branches", () => {
  test("the host is the root: a named region, both looks", async () => {
    const el = await fixture<TcConversationBranches>(html`<tc-conversation-branches label="Release note chat" .messages=${MESSAGES}></tc-conversation-branches>`);
    expect(el.dataset.ui).toBe("cvb");
    expect(el.dataset.look).toBe("standard");
    expect(el.getAttribute("role")).toBe("region");
    expect(el.getAttribute("aria-label")).toBe("Release note chat");
    // Standard: the thread on a card in the tray, the caption on the tray
    expect(el.querySelector(".ui-cvb__card .ui-cvb__thread")).toBeTruthy();
    expect(el.querySelector(":scope > .ui-cvb__caption")).toBeTruthy();
    el.look = "clean";
    await settle();
    expect(el.querySelector(".ui-cvb__card")).toBeNull();
    expect(el.querySelector('.ui-cvb__glyph[viewBox="0 0 16 16"]')).toBeTruthy();
    expect(el.querySelector<HTMLElement>("tc-message-actions")!.dataset.look).toBe("clean");
  });

  test("shows the newest branch at each fork, with a 2 / 2 switcher on the edited message", async () => {
    const el = await fixture<TcConversationBranches>(html`<tc-conversation-branches .messages=${MESSAGES}></tc-conversation-branches>`);
    expect(shown(el)).toEqual(["u1", "a1", "u3", "a3"]);
    expect(el.querySelectorAll(".ui-cvb__versions")).toHaveLength(1);
    const versions = row(el, 2).querySelector(".ui-cvb__versions")!;
    expect(versions.getAttribute("role")).toBe("group");
    expect(versions.querySelector(".ui-cvb__count")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Branch 2/ of 2");
    expect(btn(versions, "Next branch").disabled).toBe(true);
    // A paragraph per blank line
    expect(row(el, 3).querySelectorAll(".ui-cvb__text p")).toHaveLength(2);
    expect(el.querySelector(".ui-cvb__caption")!.textContent!.trim()).toBe("4 messages · branch 2 of 2");
  });

  test("the switcher picks a branch, the messages below follow, and the change is announced", async () => {
    const el = await fixture<TcConversationBranches>(html`<tc-conversation-branches .messages=${MESSAGES}></tc-conversation-branches>`);
    const changes: BranchSelectedChange[] = [];
    el.addEventListener("tc-selected-change", (e) => changes.push((e as CustomEvent<BranchSelectedChange>).detail));
    const prev = btn(row(el, 2), "Previous branch");
    prev.focus();
    prev.click();
    await settle();
    expect(changes).toEqual([{ selected: { a1: "u2" }, messageId: "u2", index: 0, count: 2 }]);
    expect(el.selected).toEqual({ a1: "u2" });
    expect(shown(el)).toEqual(["u1", "a1", "u2", "a2"]);
    expect(status(el)).toBe("Branch 1 of 2 – 1 message below");
    // Previous is now disabled: focus moves to Next instead of dropping to <body>
    await settle();
    expect(document.activeElement).toBe(btn(row(el, 2), "Next branch"));
    // Arrow keys in the switcher
    btn(row(el, 2), "Next branch").dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    await settle();
    expect(shown(el)).toEqual(["u1", "a1", "u3", "a3"]);
    // The switcher row stays in place, so focus stays with it
    expect(row(el, 2).contains(document.activeElement)).toBe(true);
  });

  test("controlled selection: preventDefault keeps the shown branch until `selected` is passed back", async () => {
    const el = await fixture<TcConversationBranches>(html`<tc-conversation-branches .messages=${MESSAGES}></tc-conversation-branches>`);
    el.addEventListener("tc-selected-change", (e) => e.preventDefault());
    btn(row(el, 2), "Previous branch").click();
    await settle();
    expect(shown(el)).toEqual(["u1", "a1", "u3", "a3"]);
    el.selected = { a1: "u2" };
    await settle();
    expect(shown(el)).toEqual(["u1", "a1", "u2", "a2"]);
  });

  test("Edit opens the message in place; Esc cancels and focus returns to Edit", async () => {
    const el = await fixture<TcConversationBranches>(html`<tc-conversation-branches .messages=${MESSAGES}></tc-conversation-branches>`);
    btn(row(el, 0), "Edit message").click();
    await settle();
    const input = el.querySelector<HTMLTextAreaElement>(".ui-cvb__input")!;
    expect(input.value).toBe("Write the release note for v2.4.");
    expect(document.activeElement).toBe(input);
    expect(el.querySelector(`#${input.getAttribute("aria-describedby")}`)!.textContent).toBe("Sending starts branch 2 – the 3 messages below stay in branch 1");
    // Send is off until the text changes
    expect(btn(el, "Send").disabled).toBe(true);
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await settle();
    expect(el.querySelector(".ui-cvb__input")).toBeNull();
    expect(document.activeElement).toBe(btn(row(el, 0), "Edit message"));
    // Replies can't be edited
    expect(row(el, 1).querySelector(".ui-cvb__edit")).toBeNull();
  });

  test("sending an edit makes a new branch; the app answers through tc-edit's respondWith", async () => {
    const el = await fixture<TcConversationBranches>(html`<tc-conversation-branches .messages=${MESSAGES}></tc-conversation-branches>`);
    let answer!: (replies: BranchMessage[]) => void;
    const edits: BranchEditDetail[] = [];
    const lists: BranchMessage[][] = [];
    el.addEventListener("tc-messages-change", (e) => lists.push((e as CustomEvent<BranchMessagesChange>).detail.messages));
    el.addEventListener("tc-edit", (e) => {
      const detail = (e as CustomEvent<BranchEditDetail>).detail;
      edits.push(detail);
      detail.respondWith(new Promise((resolve) => (answer = resolve)));
    });
    const input = await edit(el, 2, "Make it fun.");
    expect(el.querySelector(".ui-cvb__note")!.textContent).toBe("Sending starts branch 3 – the reply below stays in branch 2");
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await settle();
    expect(edits).toHaveLength(1);
    expect(edits[0]).toMatchObject({ messageId: "u3", text: "Make it fun.", message: { role: "user", text: "Make it fun.", parentId: "a1" } });
    const id = edits[0].message.id;
    expect(lists[0].at(-1)).toEqual(edits[0].message);
    expect(shown(el)).toEqual(["u1", "a1", id]);
    expect(row(el, 2).querySelector(".ui-cvb__count")!.textContent!.replace(/\s+/g, "")).toBe("Branch3/of3");
    expect(status(el)).toBe("Branch 3 of 3 – your edit was sent");
    expect(el.querySelector(".ui-cvb__pending")!.textContent).toContain("Writing a reply…");
    expect(document.activeElement).toBe(btn(row(el, 2), "Edit message"));
    // The replies follow the new message, then each other
    answer([
      { id: "r1", role: "assistant", text: "Search got fast!" },
      { id: "r2", role: "user", text: "Love it." },
    ]);
    await new Promise((r) => setTimeout(r));
    await settle();
    expect(el.querySelector(".ui-cvb__pending")).toBeNull();
    expect(el.messages.slice(-2).map((m) => m.parentId)).toEqual([id, "r1"]);
    expect(shown(el)).toEqual(["u1", "a1", id, "r1", "r2"]);
    expect(status(el)).toBe("2 replies ready");
  });

  test("a reply that fails says so; a prevented tc-edit drops the edit", async () => {
    const el = await fixture<TcConversationBranches>(html`<tc-conversation-branches .messages=${MESSAGES}></tc-conversation-branches>`);
    const off = (e: Event) => (e as CustomEvent<BranchEditDetail>).detail.respondWith(Promise.reject(new Error("offline")));
    el.addEventListener("tc-edit", off);
    let input = await edit(el, 2, "Try this.");
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await new Promise((r) => setTimeout(r));
    await settle();
    expect(el.querySelector(".ui-cvb__pending--failed")!.textContent).toContain("Couldn't write a reply");
    expect(status(el)).toBe("Couldn't write a reply");
    el.removeEventListener("tc-edit", off);
    el.addEventListener("tc-edit", (e) => e.preventDefault());
    const count = el.messages.length;
    input = await edit(el, 0, "Something else.");
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await settle();
    expect(el.messages).toHaveLength(count);
    expect(el.querySelector(".ui-cvb__input")).toBeNull();
  });

  test("controlled messages: a prevented tc-messages-change adds nothing until the list comes back", async () => {
    const el = await fixture<TcConversationBranches>(html`<tc-conversation-branches .messages=${MESSAGES}></tc-conversation-branches>`);
    let next: BranchMessage[] = [];
    el.addEventListener("tc-messages-change", (e) => {
      e.preventDefault();
      next = (e as CustomEvent<BranchMessagesChange>).detail.messages;
    });
    (await edit(el, 2, "Shorter.")).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await settle();
    expect(el.messages).toBe(MESSAGES);
    // The new branch is already picked, so it shows as soon as the app passes it in
    el.messages = next;
    await settle();
    expect(shown(el)).toEqual(["u1", "a1", next.at(-1)!.id]);
  });

  test("editable, replyActions, renderContent and caption", async () => {
    const el = await fixture<TcConversationBranches>(html`<tc-conversation-branches
      editable="false"
      caption="Shared thread"
      .replyActions=${[]}
      .renderContent=${(m: BranchMessage) => (m.role === "assistant" ? Object.assign(document.createElement("em"), { textContent: m.text.toUpperCase() }) : m.text)}
      .messages=${MESSAGES}
    ></tc-conversation-branches>`);
    expect(el.querySelector(".ui-cvb__edit")).toBeNull();
    expect(el.querySelector("tc-message-actions")).toBeNull();
    expect(row(el, 1).querySelector("em")!.textContent).toBe("V2.4 MAKES SEARCH 3× FASTER.");
    expect(el.querySelector(".ui-cvb__caption")!.textContent!.trim()).toBe("Shared thread");
    // The switcher stays without the action bar
    expect(row(el, 2).querySelector(".ui-cvb__versions")).toBeTruthy();
    el.editable = true;
    el.replyActions = ["copy"];
    await settle();
    const bar = row(el, 1).querySelector<HTMLElement>("tc-message-actions")!;
    expect(bar.dataset.messageId).toBe("a1");
    expect(bar.querySelectorAll(".ui-ma__btn")).toHaveLength(1);
  });

  test("empty, a loop in bad data, and replies that land after removal", async () => {
    const el = await fixture<TcConversationBranches>(html`<tc-conversation-branches></tc-conversation-branches>`);
    expect(el.querySelector(".ui-cvb__empty")!.textContent).toBe("No messages yet");
    // A message that is its own child (a duplicated id) can't loop forever
    el.messages = [
      { id: "x", role: "user", text: "x" },
      { id: "x", role: "user", parentId: "x", text: "again" },
    ];
    await settle();
    expect(el.path.length).toBeLessThanOrEqual(3);
    el.messages = [{ id: "x", role: "user", text: "x" }];
    await settle();
    let answer!: (r: BranchMessage[]) => void;
    el.addEventListener("tc-edit", (e) => (e as CustomEvent<BranchEditDetail>).detail.respondWith(new Promise((r) => (answer = r))));
    (await edit(el, 0, "new")).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await settle();
    const count = el.messages.length;
    el.remove();
    answer([{ id: "late", role: "assistant", text: "late" }]);
    await new Promise((r) => setTimeout(r));
    expect(el.messages).toHaveLength(count);
  });

  test("reduced motion turns animation off; the waiting dots pause off-screen", () => {
    expect(TcConversationBranches.css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\[data-ui="cvb"\] \*[^}]*animation: none !important; transition: none !important;/);
    expect(TcConversationBranches.css).toMatch(/\[data-ui="cvb"\]\[data-offscreen\] \.ui-cvb__dots i \{ animation-play-state: paused; \}/);
  });

  test("React wrapper: uncontrolled messages survive a parent re-render; onEdit answers; onSelectedChange fires", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const picks: string[] = [];
    let rerender!: () => void;
    function App() {
      const [, setN] = React.useState(0);
      rerender = () => setN((n) => n + 1);
      return React.createElement(ConversationBranches, {
        defaultMessages: MESSAGES,
        onSelectedChange: (_s, change) => picks.push(change.messageId),
        onEdit: ({ message }) => [{ id: `${message.id}-r`, role: "assistant", text: "Done." }],
      });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcConversationBranches>("tc-conversation-branches")!;
    const input = await edit(el, 2, "Again.");
    await act(async () => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
    await settle();
    expect(el.messages).toHaveLength(MESSAGES.length + 2);
    expect(el.querySelector(".ui-cvb__text")).toBeTruthy();
    expect(shown(el).at(-1)).toMatch(/-r$/);
    await act(async () => rerender());
    await settle();
    expect(el.messages).toHaveLength(MESSAGES.length + 2);
    await act(async () => btn(row(el, 2), "Previous branch").click());
    await settle();
    expect(picks.at(-1)).toBe("u3");
    expect(shown(el)).toEqual(["u1", "a1", "u3", "a3"]);
    await act(async () => rerender());
    await settle();
    expect(shown(el)).toEqual(["u1", "a1", "u3", "a3"]);
    await act(async () => root.unmount());
  });

  test("React wrapper: controlled selection and onEdit returning false", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    await act(async () => root.render(React.createElement(ConversationBranches, { messages: MESSAGES, selected: { a1: "u2" }, onEdit: () => false as const })));
    await settle();
    const el = host.querySelector<TcConversationBranches>("tc-conversation-branches")!;
    expect(shown(el)).toEqual(["u1", "a1", "u2", "a2"]);
    await act(async () => btn(row(el, 2), "Next branch").click());
    await settle();
    expect(shown(el)).toEqual(["u1", "a1", "u2", "a2"]);
    const input = await edit(el, 0, "Nope.");
    await act(async () => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
    await settle();
    expect(el.messages).toBe(MESSAGES);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"])
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="background: ${theme === "dark" ? "#0e0e10" : "#fff"}; padding: 8px">
        <tc-conversation-branches .messages=${MESSAGES}></tc-conversation-branches>
        <tc-conversation-branches look="clean" label="Clean conversation" .messages=${MESSAGES}></tc-conversation-branches>
      </div>`);
      const first = wrap.querySelector<TcConversationBranches>("tc-conversation-branches")!;
      btn(row(first, 2), "Edit message").click();
      await settle();
      await finishAnimations();
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
});
