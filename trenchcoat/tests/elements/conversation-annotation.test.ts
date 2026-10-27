/*
 * <tc-conversation-annotation> in real browsers: the transcript as a feed, keyboard and mouse selection, labels and
 * redaction (marks, tags, the bar with no text behind it), ratings, corrections as a word diff, the annotation list
 * with jump and remove, tc-send's redacted example, controlled use, the form, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/conversation-annotation";
import {
  annotationMatchesSource,
  prepareAnnotationExport,
  type AnnotationMessage,
  type ConversationAnnotationSend,
  type ConversationAnnotationValue,
  type TcConversationAnnotation,
} from "../../src/elements/conversation-annotation";
import { ConversationAnnotation } from "../../src/elements/react/conversation-annotation";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const MESSAGES: AnnotationMessage[] = [
  { id: "u1", role: "user", author: "Sam", text: "Can I return my order? My email is sam@example.com." },
  { id: "a1", role: "assistant", text: "Yes, you can return it within 60 days of purchase." },
  { id: "u2", role: "user", text: "Thanks!" },
];
const EMPTY: ConversationAnnotationValue = { spans: [], ratings: {}, corrections: {} };
const LABELLED: ConversationAnnotationValue = {
  spans: [
    { id: "s1", messageId: "a1", start: 30, end: 37, quote: "60 days", label: "incorrect" },
    { id: "s2", messageId: "a1", start: 23, end: 49, quote: "within 60 days of purchase", label: "unsupported" },
    { id: "s3", messageId: "u1", start: 35, end: 50, quote: "sam@example.com", label: "", redacted: true },
  ],
  ratings: { a1: 1 },
  corrections: {},
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const on = (el: Element, name: string, fn: (e: CustomEvent<any>) => void) => el.addEventListener(name, fn as EventListener);
const key = (target: Element, k: string, o: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...o }));
const mount = (value: ConversationAnnotationValue = EMPTY, look: "standard" | "clean" = "standard") =>
  fixture<TcConversationAnnotation>(html`<tc-conversation-annotation look=${look} .messages=${MESSAGES} .value=${value}></tc-conversation-annotation>`);
const turn = (el: Element, id: string) => el.querySelector<HTMLElement>(`.ui-cva__turn[data-id="${id}"]`)!;
const hint = (el: Element) => el.querySelector(".ui-cva__hint")!.textContent!.replace(/\s+/g, " ").trim();
// Lit puts comment markers beside bound text – the text node itself
const textIn = (el: Element) => [...el.childNodes].find((n) => n.nodeType === Node.TEXT_NODE)!;
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent;

describe("helpers", () => {
  test("annotationMatchesSource and prepareAnnotationExport", () => {
    expect(annotationMatchesSource(LABELLED.spans[0], MESSAGES)).toBe(true);
    expect(annotationMatchesSource({ ...LABELLED.spans[0], quote: "61 days" }, MESSAGES)).toBe(false);
    expect(annotationMatchesSource({ ...LABELLED.spans[0], messageId: "gone" }, MESSAGES)).toBe(false);
    const out = prepareAnnotationExport(MESSAGES, { ...LABELLED, corrections: { a1: "We'll email sam@example.com a label." } });
    expect(out.messages[0].text).toBe("Can I return my order? My email is ███████████████.");
    expect(out.messages[0].text).toHaveLength(MESSAGES[0].text.length);
    expect(out.spans[2].quote).toBe("███████████████");
    expect(out.spans[0].quote).toBe("60 days");
    expect(out.corrections.a1).not.toContain("sam@example.com");
    expect(out.ratings).toEqual({ a1: 1 });
  });
});

describe("tc-conversation-annotation", () => {
  for (const look of ["standard", "clean"] as const)
    test(`${look}: the host is the root; the turns are a feed of articles with one tab stop`, async () => {
      const el = await mount(EMPTY, look);
      expect(el.dataset.ui).toBe("cva");
      expect(el.dataset.look).toBe(look);
      expect(getComputedStyle(el).display).toBe("block");
      const feed = el.querySelector('[role="feed"]')!;
      expect(document.getElementById(feed.getAttribute("aria-labelledby")!)!.textContent).toBe("Conversation review");
      const turns = [...feed.querySelectorAll<HTMLElement>("article")];
      expect(turns.map((t) => t.getAttribute("aria-label"))).toEqual(["User, turn 1 of 3", "Assistant, turn 2 of 3", "User, turn 3 of 3"]);
      expect(turns.map((t) => t.tabIndex)).toEqual([0, -1, -1]);
      expect(turns.map((t) => t.getAttribute("aria-posinset"))).toEqual(["1", "2", "3"]);
      expect(el.querySelector(".ui-cva__role")!.textContent).toBe("User · Sam");
      // Rating only on assistant turns; correction only there too
      expect(el.querySelectorAll('[role="radiogroup"]')).toHaveLength(1);
      expect(turn(el, "a1").querySelector('[role="radiogroup"]')!.getAttribute("aria-label")).toBe("Rate assistant turn");
      expect(turn(el, "a1").querySelector(".ui-cva__ghost")!.textContent).toContain("Correct the answer");
      expect(el.querySelector(".ui-cva__empty")!.textContent).toBe("No annotations yet");
      expect(el.querySelector(".ui-cva__summary")!.textContent).toBe("0 annotations");
    });

  test("legend: a key per label with shortcut and count, plus Redact; disabled until something is selected", async () => {
    const el = await mount(LABELLED);
    const keys = [...el.querySelectorAll<HTMLButtonElement>('[role="toolbar"] .ui-cva__key')];
    expect(keys.map((k) => k.textContent!.replace(/\s+/g, " ").trim())).toEqual(["1Incorrect, 1", "2Unsupported, 1", "3Sensitive, 0", "4Helpful, 0", "RRedact, 1"]);
    expect(keys.map((k) => k.getAttribute("aria-keyshortcuts"))).toEqual(["1", "2", "3", "4", "R"]);
    expect(keys.every((k) => k.getAttribute("aria-disabled") === "true")).toBe(true);
    expect(keys.map((k) => k.tabIndex)).toEqual([0, -1, -1, -1, -1]);
    keys[0].click();
    await settle();
    expect(status(el)).toBe("Select some text first");
    expect(el.value).toEqual(LABELLED);
    // Arrows move along the toolbar
    keys[0].focus();
    key(keys[0], "ArrowRight");
    expect(document.activeElement).toBe(keys[1]);
  });

  test("marks: overlapping labels split the text, each span tagged; redaction leaves no text behind", async () => {
    const el = await mount(LABELLED);
    const a = turn(el, "a1");
    const marks = [...a.querySelectorAll("mark")];
    expect(marks.map((m) => [m.textContent, m.getAttribute("data-tone"), m.hasAttribute("data-multi")])).toEqual([
      ["within ", "amber", false],
      ["60 days", "rose", true],
      [" of purchase", "amber", false],
    ]);
    expect([...a.querySelectorAll(".ui-cva__text .ui-cva__tag")].map((t) => t.textContent)).toEqual([" (Incorrect)", " (Unsupported)"]);
    const u = turn(el, "u1");
    expect(u.textContent).not.toContain("sam@example.com");
    expect(u.querySelector(".ui-cva__redacted")!.textContent).toBe("Redacted – 15 characters");
    // A span whose text changed isn't drawn but is flagged in the list
    el.value = { ...LABELLED, spans: [...LABELLED.spans, { id: "s4", messageId: "a1", start: 0, end: 3, quote: "Nah", label: "helpful" }] };
    await settle();
    expect(a.querySelectorAll("mark")).toHaveLength(3);
    const stale = el.querySelector(".ui-cva__item[data-stale]")!;
    expect(stale.textContent).toContain("Text changed");
  });

  test("keyboard: turns move with arrows, Page keys, Home and End", async () => {
    const el = await mount();
    turn(el, "u1").focus();
    key(turn(el, "u1"), "ArrowDown");
    await settle();
    expect(document.activeElement).toBe(turn(el, "a1"));
    expect(turn(el, "a1").tabIndex).toBe(0);
    expect(turn(el, "u1").tabIndex).toBe(-1);
    key(turn(el, "a1"), "PageDown");
    await settle();
    expect(document.activeElement).toBe(turn(el, "u2"));
    key(turn(el, "u2"), "Home");
    await settle();
    expect(document.activeElement).toBe(turn(el, "u1"));
    key(turn(el, "u1"), "End");
    await settle();
    expect(document.activeElement).toBe(turn(el, "u2"));
    key(turn(el, "u2"), "ArrowUp");
    await settle();
    expect(document.activeElement).toBe(turn(el, "a1"));
  });

  test("keyboard: a caret and a selection by word; 1–9 label it, R redacts, Esc clears", async () => {
    const el = await mount();
    const seen: ConversationAnnotationValue[] = [];
    on(el, "tc-value-change", (e) => seen.push(e.detail.value));
    const a = turn(el, "a1");
    a.focus();
    // "Yes, you can return it within 60 days of purchase."
    for (let i = 0; i < 6; i++) key(a, "ArrowRight");
    await settle();
    expect(a.querySelector(".ui-cva__caret")).toBeTruthy();
    for (let i = 0; i < 3; i++) key(a, "ArrowRight", { shiftKey: true });
    await settle();
    expect(a.querySelector(".ui-cva__sel")!.textContent).toBe("within 60 days");
    expect(status(el)).toBe("Selected “within 60 days”");
    expect(hint(el)).toBe("“within 60 days” – press 1–4 to label it, R to redact");
    expect(el.querySelector(".ui-cva__key")!.getAttribute("aria-disabled")).toBe("false");
    key(a, "2");
    await settle();
    expect(seen[0].spans).toEqual([{ id: expect.any(String), messageId: "a1", start: 23, end: 37, quote: "within 60 days", label: "unsupported" }]);
    expect(status(el)).toBe("Labelled Unsupported: “within 60 days”");
    expect(a.querySelector("mark")!.textContent).toBe("within 60 days");
    // The same label on the same text again is refused
    key(a, "ArrowLeft");
    key(a, "ArrowLeft");
    key(a, "ArrowLeft");
    await settle();
    for (let i = 0; i < 3; i++) key(a, "ArrowRight", { shiftKey: true });
    key(a, "2");
    await settle();
    expect(seen).toHaveLength(1);
    expect(status(el)).toBe("Already labelled Unsupported");
    // Shift+Home, Shift+End, Ctrl+A; Esc clears
    key(a, "End", { shiftKey: true });
    await settle();
    expect([...a.querySelectorAll(".ui-cva__sel")].map((s) => s.textContent).join("")).toBe("within 60 days of purchase.");
    key(a, "a", { ctrlKey: true });
    await settle();
    expect([...a.querySelectorAll(".ui-cva__sel")].map((s) => s.textContent).join("")).toBe(MESSAGES[1].text);
    key(a, "Escape");
    await settle();
    expect(a.querySelector(".ui-cva__sel")).toBeNull();
    key(a, "r");
    await settle();
    expect(status(el)).toBe("Select some text first");
    // Redact with R, from a whole-word selection at the start
    key(a, "Home", { shiftKey: true });
    key(a, "ArrowRight", { shiftKey: true });
    await settle();
    key(a, "r");
    await settle();
    expect(seen[1].spans[1]).toMatchObject({ messageId: "a1", start: 0, end: 4, quote: "Yes,", label: "", redacted: true });
    expect(status(el)).toBe("Redacted 4 characters");
    expect(a.querySelector(".ui-cva__text")!.textContent).not.toContain("Yes,");
  });

  test("mouse: a native selection becomes the element's own, and a legend key applies it", async () => {
    const el = await mount(LABELLED);
    const a = turn(el, "a1");
    const segs = [...a.querySelectorAll<HTMLElement>(".ui-cva__seg")];
    // "Yes, you can return it " then marks; select "can return" inside the first segment
    const first = textIn(segs[0]);
    const r = document.createRange();
    r.setStart(first, 9);
    r.setEnd(first, 19);
    getSelection()!.removeAllRanges();
    getSelection()!.addRange(r);
    a.querySelector(".ui-cva__text")!.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    await settle();
    expect(a.querySelector(".ui-cva__sel")!.textContent).toBe("can return");
    expect(getSelection()!.isCollapsed).toBe(true);
    expect(document.activeElement).toBe(a);
    // Across a mark and its tag: the offsets skip the tag's text
    const markText = textIn(a.querySelector("mark .ui-cva__seg")!);
    const tag = a.querySelector(".ui-cva__text .ui-cva__tag")!;
    const r2 = document.createRange();
    r2.setStart(markText, 0);
    r2.setEnd(tag, 1);
    getSelection()!.removeAllRanges();
    getSelection()!.addRange(r2);
    a.querySelector(".ui-cva__text")!.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
    await settle();
    const changes: ConversationAnnotationValue[] = [];
    on(el, "tc-value-change", (e) => changes.push(e.detail.value));
    el.querySelectorAll<HTMLButtonElement>(".ui-cva__key")[3].click();
    await settle();
    expect(changes[0].spans.at(-1)).toMatchObject({ start: 23, end: 37, quote: "within 60 days", label: "helpful" });
  });

  test("hover: an annotation in the list lights its span, and a mark lights its list item", async () => {
    const el = await mount(LABELLED);
    const items = [...el.querySelectorAll<HTMLElement>(".ui-cva__item")];
    items[2].dispatchEvent(new MouseEvent("mouseenter"));
    await settle();
    expect([...el.querySelectorAll("mark[data-hot]")].map((m) => m.textContent)).toEqual(["60 days"]);
    items[2].dispatchEvent(new MouseEvent("mouseleave"));
    items[0].querySelector<HTMLButtonElement>(".ui-cva__jump")!.focus();
    await settle();
    expect(el.querySelector("mark[data-hot]")).toBeNull();
    expect(el.querySelector(".ui-cva__redacted")!.hasAttribute("data-hot")).toBe(true);
    (document.activeElement as HTMLElement).blur();
    await settle();
    expect(el.querySelector("[data-hot]")).toBeNull();
    // The reverse: a mark lights its list item
    el.querySelector('mark[data-span="s2"] .ui-cva__seg')!.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    await settle();
    expect(el.querySelector(".ui-cva__item[data-hot] .ui-cva__quote")!.textContent).toBe("“within 60 days of purchase”");
  });

  test("ratings: a radio group per rated turn; arrows pick; picking the checked one clears it", async () => {
    const el = await mount(LABELLED);
    const radios = () => [...turn(el, "a1").querySelectorAll<HTMLButtonElement>('[role="radio"]')];
    expect(radios().map((r) => [r.textContent, r.getAttribute("aria-checked"), r.tabIndex])).toEqual([
      ["Poor", "true", 0],
      ["Okay", "false", -1],
      ["Good", "false", -1],
    ]);
    radios()[0].focus();
    key(radios()[0], "ArrowRight");
    await settle();
    expect(el.value.ratings).toEqual({ a1: 2 });
    expect(document.activeElement).toBe(radios()[1]);
    expect(status(el)).toBe("Rated Okay");
    radios()[1].click();
    await settle();
    expect(el.value.ratings).toEqual({});
    expect(status(el)).toBe("Rating cleared");
    // Arrow keys in the radio group don't move between turns
    expect(turn(el, "u1").tabIndex).toBe(0);
  });

  test("correction: an editor seeded with the answer; Save shows a word diff; Esc cancels; Remove", async () => {
    const el = await mount();
    const a = turn(el, "a1");
    a.querySelector<HTMLButtonElement>(".ui-cva__ghost")!.click();
    await settle();
    const field = a.querySelector<HTMLTextAreaElement>("textarea")!;
    expect(document.activeElement).toBe(field);
    expect(field.value).toBe(MESSAGES[1].text);
    expect(a.querySelector(`label[for="${field.id}"]`)!.textContent).toBe("The answer it should have been");
    key(field, "Escape");
    await settle();
    expect(a.querySelector("textarea")).toBeNull();
    expect(document.activeElement).toBe(a);
    a.querySelector<HTMLButtonElement>(".ui-cva__ghost")!.click();
    await settle();
    const f2 = a.querySelector<HTMLTextAreaElement>("textarea")!;
    f2.value = "Yes, you can return it within 30 days of delivery.";
    f2.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    a.querySelector<HTMLButtonElement>('.ui-cva__btn[data-variant="primary"]')!.click();
    await settle();
    expect(el.value.corrections).toEqual({ a1: "Yes, you can return it within 30 days of delivery." });
    const fixed = a.querySelector(".ui-cva__fixed")!;
    expect(fixed.querySelector(".ui-cva__fixed-count")!.textContent).toBe("2 changes");
    expect([...fixed.querySelectorAll("del")].map((d) => d.textContent)).toEqual(["removed: 60", "removed: purchase"]);
    expect([...fixed.querySelectorAll("ins")].map((d) => d.textContent)).toEqual(["added: 30", "added: delivery"]);
    expect(el.querySelector(".ui-cva__summary")!.textContent).toBe("0 annotations · 1 corrected");
    fixed.querySelector<HTMLButtonElement>('[aria-label="Remove correction"]')!.click();
    await settle();
    expect(el.value.corrections).toEqual({});
    expect(document.activeElement).toBe(a);
  });

  test("list: jump selects the span in its turn; Delete and the remove button take it out, focus moves on", async () => {
    const el = await mount(LABELLED);
    const items = () => [...el.querySelectorAll<HTMLElement>(".ui-cva__item")];
    expect(items().map((i) => i.querySelector(".ui-cva__jump")!.textContent!.replace(/\s+/g, " ").trim())).toEqual([
      "Redacted 15 characters Turn 1 · User",
      "Unsupported “within 60 days of purchase” Turn 2 · Assistant",
      "Incorrect “60 days” Turn 2 · Assistant",
    ]);
    expect(el.querySelector(".ui-cva__list-title")!.textContent!.replace(/\s+/g, " ").trim()).toBe("Annotations 3");
    items()[2].querySelector<HTMLButtonElement>(".ui-cva__jump")!.click();
    await settle();
    expect(document.activeElement).toBe(turn(el, "a1"));
    expect(turn(el, "a1").querySelector(".ui-cva__sel")!.textContent).toBe("60 days");
    const jump = items()[1].querySelector<HTMLButtonElement>(".ui-cva__jump")!;
    jump.focus();
    key(jump, "Delete");
    await settle();
    await settle();
    expect(el.value.spans.map((s) => s.id)).toEqual(["s1", "s3"]);
    expect(status(el)).toBe("Removed Unsupported");
    // Focus went to the item that took its place
    expect(document.activeElement).toBe(items()[1].querySelector(".ui-cva__jump"));
    const remove = items()[1].querySelector<HTMLButtonElement>(".ui-cva__remove")!;
    expect(remove.getAttribute("aria-label")).toBe("Remove Incorrect: “60 days”");
    remove.focus();
    remove.click();
    await settle();
    await settle();
    expect(el.value.spans.map((s) => s.id)).toEqual(["s3"]);
    expect(document.activeElement).not.toBe(document.body);
    expect(el.querySelector(".ui-cva__jump")).toBe(document.activeElement);
  });

  test("send: tc-send carries the value and the redacted example; sending and sent are the app's", async () => {
    const el = await mount({ ...LABELLED, corrections: { a1: "Within 30 days." } });
    const sent: ConversationAnnotationSend[] = [];
    on(el, "tc-send", (e) => sent.push(e.detail));
    const btn = el.querySelector<HTMLButtonElement>(".ui-cva__send")!;
    expect(btn.textContent!.trim()).toBe("Send to dataset");
    btn.click();
    expect(sent).toHaveLength(1);
    expect(sent[0].value.spans).toHaveLength(3);
    expect(sent[0].example.messages[0].text).not.toContain("sam@example.com");
    expect(sent[0].example.corrections).toEqual({ a1: "Within 30 days." });
    el.sending = true;
    await settle();
    expect(btn.getAttribute("aria-busy")).toBe("true");
    expect(btn.textContent!.trim()).toBe("Sending…");
    el.sending = false;
    el.sent = true;
    await settle();
    expect(btn.textContent!.trim()).toBe("Sent to dataset");
  });

  test("controlled: preventDefault keeps the value", async () => {
    const el = await mount(LABELLED);
    on(el, "tc-value-change", (e) => e.preventDefault());
    turn(el, "a1").querySelectorAll<HTMLButtonElement>('[role="radio"]')[2].click();
    el.querySelector<HTMLButtonElement>(".ui-cva__remove")!.click();
    const a = turn(el, "a1");
    a.focus();
    key(a, "a", { ctrlKey: true });
    key(a, "4");
    await settle();
    expect(el.value).toEqual(LABELLED);
    expect(turn(el, "a1").querySelector('[role="radio"][aria-checked="true"]')!.textContent).toBe("Poor");
    expect(el.querySelectorAll(".ui-cva__item")).toHaveLength(3);
  });

  test("its own labels, roles and levels", async () => {
    const el = await fixture<TcConversationAnnotation>(html`<tc-conversation-annotation
      heading="Ticket 4411"
      .messages=${[{ id: "q", role: "customer", text: "Where is it?" }, { id: "b", role: "bot", text: "On its way." }]}
      .labels=${[{ id: "tone", label: "Tone" }]}
      .roleLabels=${{ customer: "Customer", bot: "Agent" }}
      .rateRoles=${["bot"]}
      .correctRoles=${[]}
      .ratingLevels=${[{ value: 0, label: "Bad" }, { value: 1, label: "Fine" }]}
    ></tc-conversation-annotation>`);
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Ticket 4411");
    expect([...el.querySelectorAll(".ui-cva__role")].map((r) => r.textContent)).toEqual(["Customer", "Agent"]);
    expect([...el.querySelectorAll('[role="radio"]')].map((r) => r.textContent)).toEqual(["Bad", "Fine"]);
    expect(el.querySelector(".ui-cva__ghost")).toBeNull();
    expect(hint(el)).toContain("Select text in a message");
    const t = el.querySelector<HTMLElement>(".ui-cva__turn")!;
    t.focus();
    key(t, "a", { ctrlKey: true });
    await settle();
    expect(hint(el)).toBe("“Where is it?” – press 1 to label it, R to redact");
    // An empty conversation says so
    el.messages = [];
    await settle();
    expect(el.querySelector(".ui-cva__none")!.textContent).toBe("No conversation to review");
    expect(el.querySelector<HTMLButtonElement>(".ui-cva__send")!.disabled).toBe(true);
  });

  test("form: the value as JSON, reset, disabled fieldset; a changed text makes it invalid", async () => {
    const form = await fixture<HTMLFormElement>(html`<form><fieldset><tc-conversation-annotation name="review" .messages=${MESSAGES} .value=${LABELLED}></tc-conversation-annotation></fieldset></form>`);
    const el = form.querySelector<TcConversationAnnotation>("tc-conversation-annotation")!;
    expect(JSON.parse(new FormData(form).get("review") as string)).toEqual(LABELLED);
    expect(form.checkValidity()).toBe(true);
    el.querySelector<HTMLButtonElement>(".ui-cva__remove")!.click();
    await settle();
    expect(el.value.spans).toHaveLength(2);
    form.reset();
    await settle();
    expect(el.value).toEqual(LABELLED);
    el.messages = [MESSAGES[0], { ...MESSAGES[1], text: "Yes." }, MESSAGES[2]];
    await settle();
    expect(form.checkValidity()).toBe(false);
    el.messages = MESSAGES;
    form.querySelector("fieldset")!.disabled = true;
    await settle();
    await settle();
    expect(el.hasAttribute("data-disabled")).toBe(true);
    expect(new FormData(form).get("review")).toBeNull();
    expect(el.querySelector<HTMLButtonElement>(".ui-cva__send")!.disabled).toBe(true);
    expect(el.querySelector<HTMLButtonElement>('[role="radio"]')!.disabled).toBe(true);
    const a = turn(el, "a1");
    a.focus();
    key(a, "a", { ctrlKey: true });
    key(a, "1");
    await settle();
    expect(el.value).toEqual(LABELLED);
  });

  test("React wrapper: uncontrolled value survives a parent re-render; controlled stays with the app; title, onChange, onSend", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onChange = vi.fn();
    const onSend = vi.fn();
    let rerender: () => void = () => {};
    function App() {
      const [, set] = React.useState(0);
      rerender = () => set((n) => n + 1);
      return React.createElement(ConversationAnnotation, { title: "Refund chat", messages: MESSAGES, defaultValue: LABELLED, onChange, onSend });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcConversationAnnotation>("tc-conversation-annotation")!;
    expect(el.heading).toBe("Refund chat");
    await act(async () => turn(el, "a1").querySelectorAll<HTMLButtonElement>('[role="radio"]')[2].click());
    await settle();
    expect(onChange).toHaveBeenCalledWith({ ...LABELLED, ratings: { a1: 3 } });
    await act(async () => rerender());
    await settle();
    expect(el.value.ratings).toEqual({ a1: 3 });
    await act(async () => el.querySelector<HTMLButtonElement>(".ui-cva__send")!.click());
    expect(onSend.mock.calls[0][0].messages[0].text).not.toContain("sam@example.com");
    expect(onSend.mock.calls[0][1].ratings).toEqual({ a1: 3 });
    await act(async () => root.render(React.createElement(ConversationAnnotation, { messages: MESSAGES, value: LABELLED, onChange })));
    await settle();
    const ctl = host.querySelector<TcConversationAnnotation>("tc-conversation-annotation")!;
    await act(async () => turn(ctl, "a1").querySelectorAll<HTMLButtonElement>('[role="radio"]')[1].click());
    await settle();
    expect(onChange).toHaveBeenLastCalledWith({ ...LABELLED, ratings: { a1: 2 } });
    expect(ctl.value).toEqual(LABELLED);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const)
    test(`axe: no violations in either look (${theme})`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme}>
        <tc-conversation-annotation description="Ticket 4411 · Billing" .messages=${MESSAGES} .value=${{ ...LABELLED, corrections: { a1: "Within 30 days of delivery." } }}></tc-conversation-annotation>
        <tc-conversation-annotation look="clean" heading="Clean" .messages=${MESSAGES} .value=${LABELLED}></tc-conversation-annotation>
        <tc-conversation-annotation look="clean" heading="Empty" .messages=${[]}></tc-conversation-annotation>
      </div>`);
      // A selection and a caret on show
      const t = wrap.querySelector("tc-conversation-annotation")!.querySelector<HTMLElement>('.ui-cva__turn[data-id="a1"]')!;
      t.focus();
      key(t, "ArrowRight");
      key(t, "ArrowRight", { shiftKey: true });
      await settle();
      for (const a of document.getAnimations()) if (a.effect?.getTiming().iterations !== Infinity) a.finish();
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });

  test("theme and motion: no .dark colours; reduced motion turns transitions off", () => {
    const css = (customElements.get("tc-conversation-annotation") as unknown as { css: string }).css;
    expect(css).not.toMatch(/\.dark|data-(?:tc-)?theme/);
    expect(css).toMatch(/prefers-reduced-motion[^{]*\{\s*\[data-ui="cva"\] \*/);
  });
});
