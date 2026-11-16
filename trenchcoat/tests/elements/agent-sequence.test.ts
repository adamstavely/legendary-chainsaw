/*
 * <tc-agent-sequence> in real browsers: lifelines and messages, arrow directions and kinds, work bars, frames, the
 * details card for messages and participants, keyboard, events with preventDefault, live messages, empty and narrow
 * states, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { userEvent } from "vitest/browser";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/agent-sequence";
import { sequenceActivations, type SequenceGroup, type SequenceMessage, type SequenceParticipant, type TcAgentSequence } from "../../src/elements/agent-sequence";
import { AgentSequence } from "../../src/elements/react/agent-sequence";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const PEOPLE: SequenceParticipant[] = [
  { id: "you", name: "You", kind: "user" },
  { id: "planner", name: "Planner", kind: "agent", detail: "large-1" },
  { id: "researcher", name: "Researcher", kind: "agent" },
  { id: "pdf", name: "PDF reader", kind: "tool" },
];
const GROUPS: SequenceGroup[] = [{ id: "retry", kind: "retry", label: "2nd try" }];
const MSGS: SequenceMessage[] = [
  { id: "m1", from: "you", to: "planner", kind: "call", label: "Draft the report", start: 0 },
  { id: "m2", from: "planner", to: "researcher", kind: "call", label: "Gather the data", start: 1000, end: 9000, tokens: 1840 },
  { id: "m3", from: "researcher", to: "pdf", kind: "call", label: "read lab.pdf" },
  { id: "m4", from: "pdf", to: "researcher", kind: "error", label: "page 4 unreadable", output: "No text layer" },
  { id: "m5", from: "researcher", to: "pdf", kind: "call", label: "read with OCR", group: "retry" },
  { id: "m6", from: "pdf", to: "researcher", kind: "reply", label: "42 rows", group: "retry" },
  { id: "m7", from: "researcher", to: "planner", kind: "reply", label: "Data and sources" },
];
const make = (look: "standard" | "clean" = "standard", messages = MSGS) =>
  fixture<HTMLElement>(
    html`<div style="width: 760px"><tc-agent-sequence look=${look} subtitle="Q3 report" .participants=${PEOPLE} .messages=${messages} .groups=${GROUPS}></tc-agent-sequence></div>`,
  ).then((wrap) => wrap.querySelector("tc-agent-sequence") as TcAgentSequence);
const text = (el: Element | null) => el?.textContent!.replace(/\s+/g, " ").trim();
const facts = (el: Element) => [...el.querySelectorAll("dl > div")].map((d) => `${text(d.querySelector("dt"))}: ${text(d.querySelector("dd"))}`);
const msg = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`.ui-aseq__msg[data-id="${id}"]`)!;

describe("tc-agent-sequence", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: heads, messages, roles and one tab stop each`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("aseq");
      expect(el.dataset.look).toBe(look);
      expect([...el.querySelectorAll(".ui-aseq__name")].map(text)).toEqual(["You", "Planner", "Researcher", "PDF reader"]);
      expect(el.querySelector(".ui-aseq__heads")!.getAttribute("role")).toBe("toolbar");
      expect(el.querySelectorAll("ol.ui-aseq__msgs > li")).toHaveLength(7);
      expect(text(el.querySelector(".ui-aseq__count"))).toBe("7 messages");
      expect([...el.querySelectorAll(".ui-aseq__head")].filter((b) => b.getAttribute("tabindex") === "0")).toHaveLength(1);
      expect([...el.querySelectorAll(".ui-aseq__msg")].filter((b) => b.getAttribute("tabindex") === "0")).toHaveLength(1);
    });
  }

  test("arrows point the way the message went, with its kind and the word Failed", async () => {
    const el = await make();
    const arrow = (id: string) => msg(el, id).querySelector<HTMLElement>(".ui-aseq__arrow")!;
    expect(arrow("m1").dataset.dir).toBe("right");
    expect(arrow("m1").style.gridColumn).toBe("1 / span 2");
    expect(arrow("m7").dataset.dir).toBe("left");
    expect(arrow("m7").style.gridColumn).toBe("2 / span 2");
    expect(msg(el, "m4").closest("li")!.dataset.kind).toBe("error");
    expect(text(msg(el, "m4").querySelector(".ui-aseq__label"))).toBe("Failed · page 4 unreadable");
    expect(text(msg(el, "m6").querySelector(".tc-sr-only"))).toBe(", PDF reader to Researcher, Reply, Retry 2nd try");
    expect(getComputedStyle(msg(el, "m6").querySelector(".ui-aseq__line")!).borderTopStyle).toBe("dashed");
    expect(getComputedStyle(msg(el, "m1").querySelector(".ui-aseq__line")!).borderTopStyle).toBe("solid");
  });

  test("work bars run from a call to its answer, or to the bottom while unanswered", async () => {
    expect(sequenceActivations(MSGS)).toEqual([
      { participant: "planner", from: 0, to: 6, open: true, depth: 0 },
      { participant: "researcher", from: 1, to: 6, open: false, depth: 0 },
      { participant: "pdf", from: 2, to: 3, open: false, depth: 0 },
      { participant: "pdf", from: 4, to: 5, open: false, depth: 0 },
    ]);
    const el = await make();
    expect(el.querySelectorAll(".ui-aseq__active")).toHaveLength(4);
    expect(el.querySelectorAll(".ui-aseq__active[data-open]")).toHaveLength(1);
    expect(text(el.querySelector('.ui-aseq__head[data-id="planner"] .ui-aseq__role'))).toBe("Working");
    expect(text(el.querySelector('.ui-aseq__head[data-id="researcher"] .ui-aseq__role'))).toBe("Agent");
  });

  test("a frame gathers its group's messages and columns", async () => {
    const el = await make();
    const frame = el.querySelector<HTMLElement>(".ui-aseq__frame")!;
    expect(frame.dataset.kind).toBe("retry");
    expect(text(frame.querySelector(".ui-aseq__frame-tag"))).toBe("Retry · 2nd try");
    expect(frame.style.getPropertyValue("--tc-aseq-from")).toBe("4");
    expect(frame.style.getPropertyValue("--tc-aseq-span")).toBe("2");
    expect(frame.style.getPropertyValue("--tc-aseq-left")).toBe("2");
    expect(frame.style.getPropertyValue("--tc-aseq-cols")).toBe("2");
  });

  test("a message's and a participant's details open, fire tc-open-change and close back to the opener", async () => {
    const el = await make();
    const seen: unknown[] = [];
    el.addEventListener("tc-open-change", (e) => seen.push((e as CustomEvent).detail));
    msg(el, "m2").click();
    await el.updateComplete;
    const detail = el.querySelector<HTMLElement>(".ui-aseq__detail")!;
    expect(detail.hidden).toBe(false);
    expect(msg(el, "m2").getAttribute("aria-controls")).toBe(detail.id);
    expect(msg(el, "m2").getAttribute("aria-expanded")).toBe("true");
    expect(text(detail.querySelector(".ui-aseq__detail-title"))).toBe("Gather the data");
    expect(text(detail)).toContain("Planner → Researcher · Call");
    expect(facts(detail)).toEqual(["Sent at: 1.0s", "Took: 8.0s", "Tokens: 1,840"]);
    el.querySelector<HTMLButtonElement>('.ui-aseq__head[data-id="pdf"]')!.click();
    await el.updateComplete;
    expect(facts(detail)).toEqual(["Sent: 2", "Received: 2", "Failed: 1"]);
    el.querySelector<HTMLButtonElement>(".ui-aseq__close")!.click();
    await el.updateComplete;
    expect(detail.hidden).toBe(true);
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("pdf");
    expect(seen.map((d) => (d as { openId: string | null }).openId)).toEqual(["m2", "pdf", null]);
    expect((seen[0] as { message: SequenceMessage }).message.id).toBe("m2");
    expect((seen[1] as { participant: SequenceParticipant }).participant.name).toBe("PDF reader");
    el.addEventListener("tc-open-change", (e) => e.preventDefault());
    msg(el, "m3").click();
    await el.updateComplete;
    expect(el.openId).toBeNull();
  });

  test("keys move through messages and participants; Enter opens, Escape closes", async () => {
    const el = await make();
    msg(el, "m1").focus();
    await userEvent.keyboard("{ArrowDown}{ArrowRight}");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("m3");
    await userEvent.keyboard("{End}");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("m7");
    await userEvent.keyboard("{Enter}");
    await expect.poll(() => el.openId).toBe("m7");
    await userEvent.keyboard("{Escape}");
    await expect.poll(() => el.openId).toBeNull();
    el.querySelector<HTMLButtonElement>(".ui-aseq__head")!.focus();
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("researcher");
    await userEvent.keyboard("{Home}");
    await expect.poll(() => (document.activeElement as HTMLElement).dataset.id).toBe("you");
  });

  test("live: a new message is marked new and said; earlier ones aren't", async () => {
    const el = await make("standard", MSGS.slice(0, 3));
    el.live = true;
    await el.updateComplete;
    el.messages = MSGS.slice(0, 4);
    await el.updateComplete;
    const fresh = [...el.querySelectorAll<HTMLElement>(".ui-aseq__row")].filter((r) => r.hasAttribute("data-new"));
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    expect(fresh.length).toBe(reduced ? 0 : 1);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("New message: PDF reader to Researcher, page 4 unreadable");
  });

  test("messages naming an unknown participant are left out; no messages say so", async () => {
    const el = await make("standard", [...MSGS, { id: "x", from: "ghost", to: "you", kind: "call", label: "?" }]);
    expect(el.querySelectorAll(".ui-aseq__msg")).toHaveLength(7);
    el.openId = "m2";
    await el.updateComplete;
    el.messages = [];
    await el.updateComplete;
    expect(el.openId).toBeNull();
    expect(text(el.querySelector(".ui-aseq__empty"))).toBe("No messages yet");
  });

  test("narrow: the diagram keeps its column widths and scrolls sideways", async () => {
    const el = await make();
    el.parentElement!.style.width = "320px";
    await settle(el.parentElement!);
    const scroll = el.querySelector<HTMLElement>(".ui-aseq__scroll")!;
    await expect.poll(() => scroll.scrollWidth > scroll.clientWidth).toBe(true);
    expect(getComputedStyle(el.querySelector(".ui-aseq__heads")!).position).toBe("sticky");
  });

  test("React: an uncontrolled open message survives re-renders; a controlled one stays until the parent changes it", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const seen: (string | null)[] = [];
    const render = (n: number, openId?: string | null) =>
      root.render(React.createElement(AgentSequence, { title: `Run ${n}`, participants: PEOPLE, messages: MSGS, groups: GROUPS, openId, onOpenChange: (id) => seen.push(id) }));
    await act(async () => render(1));
    const el = host.querySelector("tc-agent-sequence") as TcAgentSequence;
    await settle(host);
    expect(text(el.querySelector("h3"))).toBe("Run 1");
    await act(async () => msg(el, "m2").click());
    await act(async () => render(2));
    await settle(host);
    expect(el.openId).toBe("m2");
    await act(async () => render(3, null));
    await settle(host);
    await act(async () => msg(el, "m3").click());
    await settle(host);
    expect(el.openId).toBeNull();
    expect(seen).toEqual(["m2", "m3"]);
    await act(async () => render(4, "m3"));
    await settle(host);
    expect(el.openId).toBe("m3");
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const)
    for (const theme of ["light", "dark"] as const)
      test(`axe: ${look} ${theme}`, async () => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.style.colorScheme = theme;
        const el = await make(look);
        el.openId = "m4";
        await finish(el.parentElement!);
        const r = await axe.run(el);
        document.documentElement.classList.remove("dark");
        document.documentElement.style.colorScheme = "";
        expect(r.violations.flatMap((v) => [v.id, ...v.nodes.map((n) => n.target.join(" ") + " " + n.failureSummary)])).toEqual([]);
      });
});
