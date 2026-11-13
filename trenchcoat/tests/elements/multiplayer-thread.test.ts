/*
 * <tc-multiplayer-thread> in real browsers: the region and its log, grouping, joins and leaves, "Replying to",
 * mentions, presence and typing, sending with mentions and the mode, the mention picker, React and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/multiplayer-thread";
import { mentionsIn, type MultiplayerItem, type MultiplayerPerson, type MultiplayerSend, type TcMultiplayerThread } from "../../src/elements/multiplayer-thread";
import { MultiplayerThread } from "../../src/elements/react/multiplayer-thread";
import { cleanup, finish, fixture, pageStyles, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const MIN = 60_000;
const T = Date.UTC(2026, 10, 12, 14, 0);
const people = [
  { id: "ana", name: "Ana Ruiz", role: "Lead" },
  { id: "priya", name: "Priya Shah" },
  { id: "tom", name: "Tom Becker" },
] satisfies MultiplayerPerson[];
const items: MultiplayerItem[] = [
  { id: "j1", kind: "join", personId: "priya", at: T },
  { id: "m1", authorId: "priya", at: T + MIN, text: "First" },
  { id: "m2", authorId: "priya", at: T + 2 * MIN, text: "Second" },
  { id: "m3", authorId: "tom", at: T + 3 * MIN, text: "@Assistant is this fine?" },
  { id: "m4", authorId: "model", replyTo: "tom", at: T + 4 * MIN, text: "Yes, with a bridge letter." },
  { id: "l1", kind: "leave", personId: "tom", at: T + 5 * MIN },
];

const input = (el: Element) => el.querySelector<HTMLTextAreaElement>(".ui-mpt__input")!;
const sendBtn = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-mpt__send")!;
const radio = (el: Element, mode: string) => el.querySelector<HTMLInputElement>(`.ui-mpt__mode input[value="${mode}"]`)!;
async function type(el: TcMultiplayerThread, text: string) {
  const f = input(el);
  f.value = text;
  f.dispatchEvent(new InputEvent("input", { bubbles: true, data: text, inputType: "insertText" }));
  await settle();
}
const enter = (el: Element) => input(el).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));

test("mentionsIn finds names after @, longest first, and not inside words or emails", () => {
  const names = [
    { id: "ana", name: "Ana" },
    { id: "anar", name: "Ana Ruiz" },
    { id: "model", name: "Assistant" },
  ];
  expect(mentionsIn("@Ana Ruiz and @assistant, please", names)).toEqual(["anar", "model"]);
  expect(mentionsIn("@Ana, hi", names)).toEqual(["ana"]);
  expect(mentionsIn("mail ana@Ana.com or @Anamaria", names)).toEqual([]);
});

for (const look of ["standard", "clean"] as const) {
  describe(`tc-multiplayer-thread (${look})`, () => {
    test("a region named by the heading, holding a log of messages, joins and leaves", async () => {
      const el = await fixture<TcMultiplayerThread>(html`<tc-multiplayer-thread look=${look} heading="Vendor review" current-user="ana" .people=${people} .items=${items} .present=${["ana", "priya", "model"]}></tc-multiplayer-thread>`);
      expect(el.dataset.ui).toBe("mpt");
      expect(el.dataset.look).toBe(look);
      expect(el.getAttribute("role")).toBe("region");
      expect(el.getAttribute("aria-label")).toBe("Vendor review");
      const log = el.querySelector('[role="log"]')!;
      expect(log.getAttribute("aria-label")).toBe("Messages");
      expect(log.querySelectorAll('[role="listitem"]')).toHaveLength(6);
      const events = [...el.querySelectorAll(".ui-mpt__event span")].map((s) => s.textContent);
      expect(events).toEqual(["Priya Shah joined", "Tom Becker left"]);
      expect(el.querySelector(".ui-mpt__here")!.textContent).toBe("3 here: Ana Ruiz, Priya Shah, Assistant");
    });

    test("messages from one person close together group, keeping the name for screen readers", async () => {
      const el = await fixture<TcMultiplayerThread>(html`<tc-multiplayer-thread look=${look} .people=${people} .items=${items}></tc-multiplayer-thread>`);
      const msgs = [...el.querySelectorAll<HTMLElement>(".ui-mpt__msg")];
      expect(msgs.map((m) => m.hasAttribute("data-grouped"))).toEqual([false, true, false, false]);
      expect(msgs[1].querySelector(".ui-mpt__name")).toBeNull();
      expect(msgs[1].querySelector(".ui-mpt__text")!.textContent).toBe("Priya Shah: Second");
      expect(msgs[0].querySelector(".ui-mpt__name")!.textContent).toBe("Priya Shah");
    });

    test("the model's reply says whose message it answers; mentions are marked", async () => {
      const el = await fixture<TcMultiplayerThread>(html`<tc-multiplayer-thread look=${look} .people=${people} .items=${items}></tc-multiplayer-thread>`);
      const reply = el.querySelector<HTMLElement>(".ui-mpt__msg[data-model]")!;
      expect(reply.querySelector(".ui-mpt__reply-to")!.textContent).toBe("Replying to Tom Becker");
      expect(reply.querySelector(".ui-mpt__name")!.textContent).toBe("Assistant");
      expect([...el.querySelectorAll(".ui-mpt__mention")].map((m) => m.textContent)).toEqual(["@Assistant"]);
    });

    test("the current user's messages are marked as theirs", async () => {
      const el = await fixture<TcMultiplayerThread>(html`<tc-multiplayer-thread look=${look} current-user="priya" .people=${people} .items=${items}></tc-multiplayer-thread>`);
      expect(el.querySelector(".ui-mpt__msg[data-mine] .ui-mpt__name")!.textContent).toBe("Priya Shah (you)");
    });

    test("typing is said in a status region, the model's answer first; not the current user", async () => {
      const el = await fixture<TcMultiplayerThread>(html`<tc-multiplayer-thread look=${look} current-user="ana" .people=${people} .items=${items} .typing=${["priya"]}></tc-multiplayer-thread>`);
      const status = el.querySelector('[role="status"]')!;
      expect(status.textContent).toBe("Priya Shah is typing…");
      expect(el.querySelector(".ui-mpt__typing")!.getAttribute("aria-hidden")).toBe("true");
      el.typing = ["priya", "tom", "ana"];
      await settle();
      expect(status.textContent).toBe("Priya Shah and Tom Becker are typing…");
      el.typing = ["model", "priya", "tom", "ana", "x"];
      await settle();
      expect(status.textContent).toBe("Assistant is answering… 3 people are typing…");
      el.typing = [];
      await settle();
      expect(status.textContent).toBe("");
      expect(el.querySelector(".ui-mpt__typing")).toBeNull();
    });

    test("Enter sends with the mentions and whether the model answers; the field clears", async () => {
      const el = await fixture<TcMultiplayerThread>(html`<tc-multiplayer-thread look=${look} current-user="ana" .people=${people} .items=${items}></tc-multiplayer-thread>`);
      const sent: MultiplayerSend[] = [];
      el.addEventListener("tc-send", (e) => sent.push((e as CustomEvent<MultiplayerSend>).detail));
      expect(sendBtn(el).disabled).toBe(true);
      await type(el, "  @Priya Shah can you check? ");
      expect(sendBtn(el).disabled).toBe(false);
      enter(el);
      await settle();
      expect(sent).toEqual([{ text: "@Priya Shah can you check?", mentions: ["priya"], modelAnswers: false }]);
      expect(input(el).value).toBe("");
      await type(el, "@Assistant and @Tom Becker");
      sendBtn(el).click();
      await settle();
      expect(sent[1]).toEqual({ text: "@Assistant and @Tom Becker", mentions: ["model", "tom"], modelAnswers: true });
    });

    test("Shift+Enter doesn't send; a prevented send keeps the text", async () => {
      const el = await fixture<TcMultiplayerThread>(html`<tc-multiplayer-thread look=${look} .people=${people}></tc-multiplayer-thread>`);
      const onSend = vi.fn((e: Event) => e.preventDefault());
      el.addEventListener("tc-send", onSend);
      await type(el, "Draft");
      const e = new KeyboardEvent("keydown", { key: "Enter", shiftKey: true, bubbles: true, cancelable: true });
      input(el).dispatchEvent(e);
      expect(e.defaultPrevented).toBe(false);
      expect(onSend).not.toHaveBeenCalled();
      enter(el);
      await settle();
      expect(onSend).toHaveBeenCalledOnce();
      expect(input(el).value).toBe("Draft");
    });

    test("the mode switch: every message makes the model answer; a prevented change keeps the mode", async () => {
      const el = await fixture<TcMultiplayerThread>(html`<tc-multiplayer-thread look=${look} .people=${people}></tc-multiplayer-thread>`);
      expect(el.querySelector(".ui-mpt__mode legend")!.textContent).toBe("Assistant answers");
      expect(radio(el, "mentions").checked).toBe(true);
      expect(el.querySelector(".ui-mpt__hint")!.textContent).toBe("Mention @Assistant to ask it");
      const modes: string[] = [];
      el.addEventListener("tc-mode-change", (e) => modes.push((e as CustomEvent).detail.mode));
      radio(el, "every").click();
      await settle();
      expect(modes).toEqual(["every"]);
      expect(el.mode).toBe("every");
      expect(el.querySelector(".ui-mpt__hint")!.textContent).toBe("Assistant answers every message");
      const sent: MultiplayerSend[] = [];
      el.addEventListener("tc-send", (e) => sent.push((e as CustomEvent<MultiplayerSend>).detail));
      await type(el, "No mention");
      enter(el);
      expect(sent[0].modelAnswers).toBe(true);
      el.addEventListener("tc-mode-change", (e) => e.preventDefault());
      radio(el, "mentions").click();
      await settle();
      expect(el.mode).toBe("every");
      expect(radio(el, "every").checked).toBe(true);
    });

    test("hide-mode hides the switch", async () => {
      const el = await fixture<TcMultiplayerThread>(html`<tc-multiplayer-thread look=${look} hide-mode .people=${people}></tc-multiplayer-thread>`);
      expect(el.querySelector(".ui-mpt__mode")).toBeNull();
    });

    test("the mention picker is attached to the field and offers the model and the other people", async () => {
      const el = await fixture<TcMultiplayerThread>(html`<tc-multiplayer-thread look=${look} current-user="ana" .people=${people}></tc-multiplayer-thread>`);
      const picker = el.querySelector("tc-mention-picker")!;
      expect(picker.target).toBe(input(el));
      const groups = picker.triggers[0].groups;
      expect(groups.map((g) => g.items.map((i) => i.id))).toEqual([["model"], ["priya", "tom"]]);
    });

    test("empty: says there are no messages yet", async () => {
      const el = await fixture<TcMultiplayerThread>(html`<tc-multiplayer-thread look=${look}></tc-multiplayer-thread>`);
      expect(el.querySelector(".ui-mpt__empty")!.textContent).toBe("No messages yet");
    });

    test("narrow: everything stays inside the width", async () => {
      const wrap = await fixture<HTMLElement>(html`<div style="width: 300px"><tc-multiplayer-thread look=${look} .people=${people} .items=${items} .present=${["ana", "priya", "tom", "model"]}></tc-multiplayer-thread></div>`);
      const el = wrap.querySelector("tc-multiplayer-thread")!;
      const right = el.getBoundingClientRect().right;
      expect(el.getBoundingClientRect().width).toBeLessThanOrEqual(301);
      for (const b of el.querySelectorAll(".ui-mpt__send, .ui-mpt__mode")) expect(b.getBoundingClientRect().right).toBeLessThanOrEqual(right + 1);
    });
  });
}

test("React: an uncontrolled mode survives re-renders; onSend gets the text, mentions and whether the model answers", async () => {
  const wrap = document.body.appendChild(document.createElement("div"));
  const root = createRoot(wrap);
  const onSend = vi.fn();
  const onModeChange = vi.fn();
  const render = (list: MultiplayerItem[]) =>
    act(async () => root.render(React.createElement(MultiplayerThread, { title: "Review", people, currentUser: "ana", items: list, model: { name: "Helper", avatar: React.createElement("svg", { viewBox: "0 0 1 1" }) }, onSend, onModeChange })));
  await render([]);
  const el = wrap.querySelector<TcMultiplayerThread>("tc-multiplayer-thread")!;
  await settle(wrap);
  expect(el.heading).toBe("Review");
  await act(async () => radio(el, "every").click());
  await settle(wrap);
  expect(onModeChange).toHaveBeenCalledWith("every");
  await render(items);
  await settle(wrap);
  expect(el.mode).toBe("every");
  await type(el, "@Helper hi");
  await act(async () => void enter(el));
  expect(onSend).toHaveBeenCalledWith("@Helper hi", ["model"], true, expect.anything());
  await expect.poll(() => el.querySelector(".ui-mpt__msg[data-model] .ui-mpt__avatar svg")).not.toBeNull();
  await act(async () => root.unmount());
  wrap.remove();
});

test("React: a controlled mode stays until the parent changes it", async () => {
  const wrap = document.body.appendChild(document.createElement("div"));
  const root = createRoot(wrap);
  await act(async () => root.render(React.createElement(MultiplayerThread, { people, mode: "mentions" })));
  const el = wrap.querySelector<TcMultiplayerThread>("tc-multiplayer-thread")!;
  await settle(wrap);
  await act(async () => radio(el, "every").click());
  await settle(wrap);
  expect(el.mode).toBe("mentions");
  expect(radio(el, "mentions").checked).toBe(true);
  await act(async () => root.unmount());
  wrap.remove();
});

for (const theme of ["light", "dark"] as const) {
  test(`axe (${theme}): no violations in either look`, async () => {
    const wrap = await fixture<HTMLElement>(html`<div data-tc-page data-tc-theme=${theme} style="padding: 16px; display: grid; gap: 16px">${pageStyles}
      <tc-multiplayer-thread look="standard" heading="Standard" current-user="ana" .people=${people} .items=${items} .present=${["ana", "priya", "model"]} .typing=${["priya"]}></tc-multiplayer-thread>
      <tc-multiplayer-thread look="clean" heading="Clean" current-user="priya" mode="every" .people=${people} .items=${items} .present=${["ana", "priya"]} .typing=${["model"]}></tc-multiplayer-thread>
    </div>`);
    await finish(wrap);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
}
