/*
 * <tc-collaboration-stream> in real browsers – structure in both looks, who-to-whom in words, filter tabs with
 * counts, questions and their answers, files, details, the composer and its events, scroll pinning, the React
 * wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/collaboration-stream";
import type { CollabFilterChange, CollabMessage, CollabParticipant, CollabSend, TcCollaborationStream } from "../../src/elements/collaboration-stream";
import { CollaborationStream } from "../../src/elements/react/collaboration-stream";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const T0 = Date.UTC(2026, 10, 5, 13, 2);
const PEOPLE: CollabParticipant[] = [
  { id: "you", name: "You", kind: "person" },
  { id: "orch", name: "Orchestrator", kind: "agent", model: "Opus 5.5" },
  { id: "res", name: "Researcher", kind: "agent", model: "Sonnet 5.5" },
  { id: "wri", name: "Writer", kind: "agent", model: "Sonnet 5.5" },
];
const MESSAGES: CollabMessage[] = [
  { id: "m1", from: "you", to: "orch", at: T0, text: "Prepare the report." },
  { id: "e1", from: "orch", to: "res", at: T0 + 60_000, kind: "handoff", text: "Orchestrator started Researcher" },
  {
    id: "m2",
    from: "res",
    to: "orch",
    at: T0 + 240_000,
    text: "Counts are in.",
    files: [{ id: "f1", name: "counts.csv", preview: "station,plots\nNorth,42" }],
    details: { model: "Sonnet 5.5", tokens: 41_200, cost: 0.02, ms: 108_000, tools: [{ name: "archive_search", summary: "6 searches", results: [{ title: "Field log", text: "42 plots" }] }] },
  },
  { id: "q1", from: "wri", to: "you", at: T0 + 300_000, kind: "question", text: "Which years?" },
];
const tag = (msgs = MESSAGES, look = "standard") =>
  html`<tc-collaboration-stream look=${look} .participants=${PEOPLE} .messages=${msgs} locale="en-GB" time-zone="UTC"></tc-collaboration-stream>`;
const row = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-msg="${id}"]`)!;
const tabs = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-cls__tab")];

describe("tc-collaboration-stream", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: host, who-to-whom in words, slim events, one tab stop`, async () => {
      const el = await fixture<TcCollaborationStream>(tag(MESSAGES, look));
      expect(el.dataset.ui).toBe("cls");
      expect(el.dataset.look).toBe(look);
      expect(row(el, "m2").querySelector(".ui-cls__head")!.textContent!.replace(/\s+/g, " ").trim()).toMatch(/^Researcher to Orchestrator 13:06/);
      expect(row(el, "m1").querySelector(".ui-cls__from")!.textContent).toBe("You");
      expect(row(el, "e1").classList.contains("ui-cls__event")).toBe(true);
      expect(row(el, "e1").textContent).toMatch(/Orchestrator started Researcher/);
      expect(el.querySelector('[role="tablist"]')).not.toBeNull();
      expect(tabs(el).filter((t) => t.tabIndex === 0)).toHaveLength(1);
      expect(el.querySelector('[role="tabpanel"]')!.getAttribute("aria-label")).toBe("Messages – Everyone");
    });
  }

  test("tabs: Everyone, You and one per agent, with counts; arrows pick; prevented keeps the filter", async () => {
    const seen: string[] = [];
    const el = await fixture<TcCollaborationStream>(html`<tc-collaboration-stream .participants=${PEOPLE} .messages=${MESSAGES} @tc-filter-change=${(e: CustomEvent<CollabFilterChange>) => seen.push(e.detail.filter)}></tc-collaboration-stream>`);
    expect(tabs(el).map((t) => t.textContent!.replace(/\s+/g, " ").trim())).toEqual(["Everyone, 4", "You, 2", "Orchestrator, 3", "Researcher, 2", "Writer, 1"]);
    tabs(el)[3].click();
    await settle();
    expect(seen).toEqual(["res"]);
    expect(el.filter).toBe("res");
    expect([...el.querySelectorAll("[data-msg]")].map((m) => (m as HTMLElement).dataset.msg)).toEqual(["e1", "m2"]);
    tabs(el)[3].focus();
    await userEvent.keyboard("{ArrowRight}");
    await settle();
    expect(el.filter).toBe("wri");
    await expect.poll(() => document.activeElement).toBe(tabs(el)[4]);
    el.addEventListener("tc-filter-change", (e) => e.preventDefault());
    tabs(el)[0].click();
    await settle();
    expect(el.filter).toBe("wri");
  });

  test("a filter naming an agent that left falls back to everyone", async () => {
    const el = await fixture<TcCollaborationStream>(html`<tc-collaboration-stream .participants=${PEOPLE} .messages=${MESSAGES} filter="gone"></tc-collaboration-stream>`);
    expect(tabs(el)[0].getAttribute("aria-selected")).toBe("true");
    expect(el.querySelectorAll("[data-msg]")).toHaveLength(4);
  });

  test("a question for you says Needs you and sends its answer to the asker", async () => {
    const sent: CollabSend[] = [];
    const el = await fixture<TcCollaborationStream>(tag());
    el.addEventListener("tc-send", (e) => sent.push((e as CustomEvent<CollabSend>).detail));
    const q = row(el, "q1");
    expect(q.querySelector(".ui-cls__tag")!.textContent).toMatch(/Needs you/);
    expect(el.querySelector(".tc-head__aside")!.textContent).toMatch(/1 needs you/);
    const field = q.querySelector<HTMLTextAreaElement>(".ui-cls__answer-field")!;
    expect(field.getAttribute("aria-label")).toBe("Answer Writer");
    field.focus();
    await userEvent.keyboard("2016 onwards{Enter}");
    await settle();
    expect(sent).toEqual([{ text: "2016 onwards", to: "wri", mentions: [], replyTo: "q1" }]);
    expect(row(el, "q1").querySelector(".ui-cls__answer")).toBeNull();
    expect(row(el, "q1").querySelector(".ui-cls__tag")!.textContent).toMatch(/Answered/);
  });

  test("files open a preview; details unfold facts and tool calls", async () => {
    const el = await fixture<TcCollaborationStream>(tag());
    const chip = row(el, "m2").querySelector<HTMLButtonElement>(".ui-cls__chip")!;
    expect(chip.getAttribute("aria-expanded")).toBe("false");
    chip.click();
    await settle();
    expect(chip.getAttribute("aria-expanded")).toBe("true");
    const preview = row(el, "m2").querySelector<HTMLElement>(".ui-cls__preview")!;
    expect(preview.hidden).toBe(false);
    expect(preview.querySelector("pre")!.textContent).toBe("station,plots\nNorth,42");
    preview.querySelector<HTMLButtonElement>(".ui-cls__icon-btn")!.focus();
    await userEvent.keyboard("{Escape}");
    await settle();
    expect(preview.hidden).toBe(true);
    expect(document.activeElement).toBe(chip);

    const more = row(el, "m2").querySelector<HTMLButtonElement>(".ui-cls__more")!;
    expect(more.textContent).toMatch(/1 tool call/);
    more.click();
    await settle();
    const details = row(el, "m2").querySelector<HTMLElement>(".ui-cls__details")!;
    expect(details.hidden).toBe(false);
    expect([...details.querySelectorAll(".ui-cls__fact")].map((f) => `${f.querySelector("dt")!.textContent} ${f.querySelector("dd")!.textContent}`)).toEqual(["Model Sonnet 5.5", "Tokens 41k", "Cost $0.02", "Took 1m 48s"]);
    expect(details.querySelector(".ui-cls__tool-name")!.textContent).toBe("archive_search");
  });

  test("the composer sends to everyone by default, with @ mentions; a prevented send keeps the text", async () => {
    const sent: CollabSend[] = [];
    const onSend = vi.fn();
    const el = await fixture<TcCollaborationStream>(tag());
    el.onSend = onSend;
    el.addEventListener("tc-send", (e) => sent.push((e as CustomEvent<CollabSend>).detail));
    await settle();
    expect(el.querySelector("tc-mention-picker")).not.toBeNull();
    const field = el.querySelector<HTMLTextAreaElement>(".ui-cls__field")!;
    field.value = "Thanks @Researcher, keep going";
    field.dispatchEvent(new Event("input"));
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-cls__send")!.click();
    await settle();
    expect(sent).toEqual([{ text: "Thanks @Researcher, keep going", to: "everyone", mentions: ["res"] }]);
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(field.value).toBe("");

    const select = el.querySelector<HTMLSelectElement>(".ui-cls__to-select")!;
    select.value = "wri";
    select.dispatchEvent(new Event("change"));
    el.addEventListener("tc-send", (e) => e.preventDefault(), { once: true });
    field.value = "Hold on";
    field.dispatchEvent(new Event("input"));
    await settle();
    el.querySelector<HTMLButtonElement>(".ui-cls__send")!.click();
    await settle();
    expect(sent.at(-1)).toEqual({ text: "Hold on", to: "wri", mentions: [] });
    expect(field.value).toBe("Hold on");
  });

  test("an async send waits, and a rejection keeps the text and says so", async () => {
    let fail: (e: Error) => void = () => {};
    const el = await fixture<TcCollaborationStream>(tag());
    el.onSend = () => new Promise((_, reject) => (fail = reject));
    await settle();
    const field = el.querySelector<HTMLTextAreaElement>(".ui-cls__field")!;
    field.value = "Hello";
    field.dispatchEvent(new Event("input"));
    await settle();
    const send = el.querySelector<HTMLButtonElement>(".ui-cls__send")!;
    send.click();
    await settle();
    expect(send.disabled).toBe(true);
    fail(new Error("offline"));
    await expect.poll(() => el.querySelector('.ui-cls__composer [role="alert"]')?.textContent).toMatch(/try again/);
    expect(field.value).toBe("Hello");
  });

  test("streaming shows a caret and Live; the status says who is writing, not every letter", async () => {
    const el = await fixture<TcCollaborationStream>(tag());
    expect(el.querySelector(".ui-cls__live")).toBeNull();
    el.messages = [...MESSAGES, { id: "s1", from: "wri", to: "orch", at: T0 + 400_000, text: "", streaming: true }];
    await settle();
    expect(el.querySelector(".ui-cls__live")!.textContent).toMatch(/Live/);
    expect(row(el, "s1").getAttribute("aria-busy")).toBe("true");
    expect(row(el, "s1").textContent).toMatch(/Writing…/);
    const status = el.querySelector(".ui-cls__status")!;
    expect(status.textContent).toBe("Writer is writing");
    el.messages = [...MESSAGES, { id: "s1", from: "wri", to: "orch", at: T0 + 400_000, text: "Plots were", streaming: true }];
    await settle();
    expect(status.textContent).toBe("Writer is writing");
    el.messages = [...MESSAGES, { id: "s1", from: "wri", to: "orch", at: T0 + 400_000, text: "Plots were placed on a grid." }];
    await settle();
    expect(status.textContent).toBe("Writer to Orchestrator: Plots were placed on a grid.");
    expect(el.querySelector(".ui-cls__caret")).toBeNull();
  });

  test("the log stays pinned to the newest message; scrolled up, new ones show a pill", async () => {
    const many: CollabMessage[] = Array.from({ length: 30 }, (_, i) => ({ id: `n${i}`, from: i % 2 ? "res" : "orch", to: i % 2 ? "orch" : "res", at: T0 + i * 60_000, text: `Message ${i}` }));
    const el = await fixture<TcCollaborationStream>(tag(many));
    const log = el.querySelector<HTMLElement>(".ui-cls__log")!;
    const atBottom = () => log.scrollHeight - log.scrollTop - log.clientHeight < 4;
    await expect.poll(atBottom).toBe(true);
    el.messages = [...many, { id: "x1", from: "res", to: "orch", at: T0, text: "One more" }];
    await settle();
    await expect.poll(atBottom).toBe(true);
    expect(el.querySelector(".ui-cls__new")).toBeNull();
    log.scrollTop = 0;
    log.dispatchEvent(new Event("scroll"));
    el.messages = [...el.messages, { id: "x2", from: "res", to: "orch", at: T0, text: "And another" }];
    await settle();
    expect(log.scrollTop).toBe(0);
    const pill = await expect.poll(() => el.querySelector<HTMLButtonElement>(".ui-cls__new")).not.toBeNull();
    void pill;
    el.querySelector<HTMLButtonElement>(".ui-cls__new")!.click();
    await settle();
    await expect.poll(atBottom).toBe(true);
    expect(el.querySelector(".ui-cls__new")).toBeNull();
  });

  test("empty: the log says so; renamed labels apply", async () => {
    const el = await fixture<TcCollaborationStream>(html`<tc-collaboration-stream .participants=${PEOPLE} .messages=${[]} .labels=${{ everyone: "All" }}></tc-collaboration-stream>`);
    expect(el.querySelector(".ui-cls__empty")!.textContent).toBe("No messages here yet");
    expect(tabs(el)[0].textContent).toMatch(/^\s*All/);
  });

  test("React wrapper: uncontrolled filter survives re-renders; controlled stays put; onSend gets the message", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    let bump = () => {};
    const got: CollabSend[] = [];
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(CollaborationStream, {
        title: "Run",
        participants: PEOPLE.map((p) => (p.id === "res" ? { ...p, avatar: React.createElement("svg", { "data-mark": "r" }) } : p)),
        messages: MESSAGES,
        onSend: (m) => void got.push(m),
        "data-n": n,
      } as React.ComponentProps<typeof CollaborationStream>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-collaboration-stream")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Run");
    await expect.poll(() => el.querySelector('[data-msg="m2"] .ui-cls__avatar svg[data-mark="r"]')).not.toBeNull();
    tabs(el)[2].click();
    await settle();
    await act(async () => bump());
    await settle();
    expect(el.filter).toBe("orch");

    const asked: string[] = [];
    await act(async () => root.render(React.createElement(CollaborationStream, { participants: PEOPLE, messages: MESSAGES, filter: "everyone", onFilterChange: (f) => void asked.push(f) })));
    await settle();
    const controlled = host.querySelector("tc-collaboration-stream")!;
    tabs(controlled)[1].click();
    await settle();
    expect(asked).toEqual(["you"]);
    expect(controlled.filter).toBe("everyone");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-collaboration-stream description="Due Friday" .participants=${PEOPLE} .messages=${[...MESSAGES, { id: "s", from: "wri", to: "orch", at: T0, text: "Drafting", streaming: true }]}></tc-collaboration-stream>
        <tc-collaboration-stream look="clean" .participants=${PEOPLE} .messages=${MESSAGES}></tc-collaboration-stream>
      </div>`);
      for (const el of wrap.querySelectorAll("tc-collaboration-stream")) {
        el.querySelector<HTMLButtonElement>('[data-msg="m2"] .ui-cls__more')!.click();
        el.querySelector<HTMLButtonElement>('[data-msg="m2"] .ui-cls__chip')!.click();
      }
      await settle();
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
