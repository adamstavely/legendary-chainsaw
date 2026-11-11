/*
 * <tc-decision-card> in real browsers: the header with the agent and how long it waited, numbered options with one
 * recommended (focused first, never picked), 1–9 and the arrow keys, Something else, Send with nothing picked, the
 * receipt with Undo, Approve / Decline with a reason, ⌘ Enter and Escape, the queue, the React wrapper and axe in both
 * looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/decision-card";
import { waitedFor, type DecisionCardMade, type DecisionCardOption, type TcDecisionCard } from "../../src/elements/decision-card";
import { DecisionCard } from "../../src/elements/react/decision-card";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

const NOW = Date.UTC(2026, 10, 10, 9, 30);
const OPTIONS: DecisionCardOption[] = [
  { id: "newer", label: "Keep the 2024 file", detail: "It has the signed bank letter", recommended: true },
  { id: "older", label: "Keep the 2019 file" },
  { id: "both", label: "Keep both and flag them" },
];

const card = (extra: Partial<TcDecisionCard> = {}) =>
  fixture<TcDecisionCard>(
    html`<tc-decision-card
      agent="Records agent"
      question="Which file should I keep?"
      context="Both share a tax ID."
      .options=${OPTIONS}
      .since=${NOW - 4 * 60_000}
      .now=${NOW}
    ></tc-decision-card>`,
  ).then(async (el) => {
    Object.assign(el, extra);
    await settle();
    return el;
  });
const radios = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
const radio = (el: Element, id: string) => el.querySelector<HTMLButtonElement>(`[data-choice="${id}"]`)!;
const btn = (el: Element, label: string) => [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent!.replace(/⌘↵/, "").trim() === label);
const key = async (target: Element, k: string, init: KeyboardEventInit = {}) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
  await settle();
};
const listen = <T>(el: Element, name: string, prevent = false) => {
  const seen: T[] = [];
  el.addEventListener(name, (e) => {
    seen.push((e as CustomEvent<T>).detail);
    if (prevent) e.preventDefault();
  });
  return seen;
};
const active = () => document.activeElement as HTMLElement;
const status = (el: Element) => el.querySelector('[role="status"]')!.textContent;

describe("tc-decision-card", () => {
  test("the host is the root in both looks; Clean puts the buttons inside the card", async () => {
    const el = await card();
    expect(el.dataset.ui).toBe("dcd");
    expect(el.dataset.look).toBe("standard");
    expect(el.querySelector(".ui-dcd__form > .ui-dcd__foot")).not.toBeNull();
    el.look = "clean";
    await settle();
    expect(el.querySelector(".ui-dcd__card > .ui-dcd__foot")).not.toBeNull();
  });

  test("the header names the agent, says it needs a decision and how long it waited", async () => {
    const el = await card();
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Records agent");
    expect(el.querySelector(".tc-head__sub")!.textContent!.replace(/\s+/g, " ")).toContain("Needs your decision");
    expect(el.querySelector(".ui-dcd__waited")!.textContent).toBe("waiting 4 min");
    expect(el.querySelector(".ui-dcd__initials")!.textContent).toBe("RA");
    const form = el.querySelector("section")!;
    const names = form.getAttribute("aria-labelledby")!.split(" ").map((id) => document.getElementById(id)!.textContent);
    expect(names).toEqual(["Records agent", "Which file should I keep?"]);
    expect(waitedFor(30_000)).toBe("just now");
    expect(waitedFor(130 * 60_000)).toBe("2 h 10 min");
    expect(waitedFor(3 * 24 * 3600_000)).toBe("3 d");
  });

  test("numbered options: a radio group, the recommended one holds the tab stop and isn't picked", async () => {
    const el = await card();
    const group = el.querySelector('[role="radiogroup"]')!;
    expect(document.getElementById(group.getAttribute("aria-labelledby")!)!.textContent).toBe("Which file should I keep?");
    expect(radios(el).map((r) => r.querySelector(".ui-dcd__num")!.textContent)).toEqual(["1", "2", "3"]);
    expect(radios(el).map((r) => r.tabIndex)).toEqual([0, -1, -1]);
    expect(radios(el).every((r) => r.getAttribute("aria-checked") === "false")).toBe(true);
    expect(radio(el, "newer").querySelector(".ui-dcd__chip")!.textContent).toBe("Recommended");
    expect(radio(el, "newer").textContent!.replace(/\s+/g, " ").trim()).toBe("1 Keep the 2024 file, Recommended, It has the signed bank letter");
    // A recommended option later in the list takes the stop
    el.options = [OPTIONS[1], { ...OPTIONS[0] }];
    await settle();
    expect(radios(el).map((r) => r.tabIndex)).toEqual([-1, 0]);
  });

  test("picking: click, arrows and 1–9 fire a cancelable tc-value-change", async () => {
    const el = await card();
    const seen = listen<{ value: string | null }>(el, "tc-value-change");
    radio(el, "older").click();
    await settle();
    expect(seen.at(-1)).toEqual({ value: "older" });
    expect(radio(el, "older").getAttribute("aria-checked")).toBe("true");
    radio(el, "older").focus();
    await key(active(), "ArrowDown");
    expect(el.value).toBe("both");
    expect(active()).toBe(radio(el, "both"));
    await key(active(), "ArrowDown");
    expect(el.value).toBe("newer");
    await key(active(), "End");
    expect(el.value).toBe("both");
    // Number keys from anywhere in the card
    await key(el.querySelector(".ui-dcd__question")!, "2");
    expect(el.value).toBe("older");
    expect(active()).toBe(radio(el, "older"));
    // Prevented: the pick stays
    listen(el, "tc-value-change", true);
    await key(active(), "1");
    expect(el.value).toBe("older");
  });

  test("Send with nothing picked says so; Send fires tc-decision and folds into a receipt with Undo", async () => {
    const el = await card();
    const decided = listen<DecisionCardMade>(el, "tc-decision");
    btn(el, "Send")!.click();
    await settle();
    expect(decided).toHaveLength(0);
    expect(el.querySelector(".ui-dcd__error")!.textContent).toBe("Pick an option first");
    expect(status(el)).toBe("Pick an option first");
    expect(active()).toBe(radio(el, "newer"));
    radio(el, "newer").click();
    await settle();
    expect(el.querySelector(".ui-dcd__error")).toBeNull();
    btn(el, "Send")!.click();
    await settle();
    expect(decided).toEqual([{ choice: "newer" }]);
    expect(el.sent).toBe(true);
    expect(el.querySelector(".ui-dcd__receipt-text")!.textContent).toBe("You chose: Keep the 2024 file");
    expect(status(el)).toBe("You chose: Keep the 2024 file");
    await expect.poll(() => active()).toBe(el.querySelector(".ui-dcd__receipt"));
    // Undo opens the card again on the picked option
    const undone = listen<{ decision: DecisionCardMade }>(el, "tc-undo");
    btn(el, "Undo")!.click();
    await settle();
    expect(undone).toEqual([{ decision: { choice: "newer" } }]);
    expect(el.sent).toBe(false);
    await expect.poll(() => active()).toBe(radio(el, "newer"));
  });

  test("Undo goes away after undo-ms; a prevented tc-decision keeps the card", async () => {
    const el = await card({ undoMs: 40 } as Partial<TcDecisionCard>);
    radio(el, "older").click();
    await settle();
    btn(el, "Send")!.click();
    await settle();
    expect(btn(el, "Undo")).toBeTruthy();
    await expect.poll(() => btn(el, "Undo")).toBeUndefined();
    const other = await card();
    listen(other, "tc-decision", true);
    radio(other, "older").click();
    await settle();
    btn(other, "Send")!.click();
    await settle();
    expect(other.sent).toBe(false);
    // The page sets sent itself: the receipt reads what was sent
    other.sent = true;
    await settle();
    expect(other.querySelector(".ui-dcd__receipt-text")!.textContent).toBe("You chose: Keep the 2019 file");
  });

  test("Something else: a field that must be filled, sent as { choice: 'other', other }", async () => {
    const el = await card({ allowOther: true } as Partial<TcDecisionCard>);
    expect(radios(el)).toHaveLength(4);
    const decided = listen<DecisionCardMade>(el, "tc-decision");
    await key(el.querySelector(".ui-dcd__question")!, "4");
    expect(el.value).toBe("other");
    const field = el.querySelector<HTMLInputElement>(".ui-dcd__input")!;
    expect(field.getAttribute("aria-label")).toBe("Something else…");
    btn(el, "Send")!.click();
    await settle();
    expect(decided).toHaveLength(0);
    expect(field.getAttribute("aria-invalid")).toBe("true");
    expect(active()).toBe(field);
    field.value = "Ask the finance team";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    // ⌘ / Ctrl Enter sends from inside the field
    await key(field, "Enter", { ctrlKey: true, metaKey: true });
    expect(decided).toEqual([{ choice: "other", other: "Ask the finance team" }]);
    expect(el.querySelector(".ui-dcd__receipt-text")!.textContent).toBe("You chose: Ask the finance team");
  });

  test("Escape and Later fire tc-defer", async () => {
    const el = await card();
    const deferred = listen(el, "tc-defer");
    await key(radio(el, "newer"), "Escape");
    btn(el, "Later")!.click();
    expect(deferred).toHaveLength(2);
  });

  test("approve: Approve sends, Decline asks for an optional reason, Escape steps back", async () => {
    const el = await card({ kind: "approve", question: "Publish the draft summary?" } as Partial<TcDecisionCard>);
    expect(el.querySelector('[role="radiogroup"]')).toBeNull();
    const decided = listen<DecisionCardMade>(el, "tc-decision");
    btn(el, "Decline")!.click();
    await settle();
    const reason = el.querySelector<HTMLTextAreaElement>("textarea")!;
    await expect.poll(() => active()).toBe(reason);
    expect(reason.placeholder).toBe("Why not? (optional)");
    await key(reason, "Escape");
    expect(el.querySelector("textarea")).toBeNull();
    btn(el, "Decline")!.click();
    await settle();
    const field = el.querySelector<HTMLTextAreaElement>("textarea")!;
    field.value = "Findings aren't final";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    await settle();
    btn(el, "Decline")!.click();
    await settle();
    expect(decided).toEqual([{ choice: "decline", reason: "Findings aren't final" }]);
    expect(el.querySelector(".ui-dcd__receipt-text")!.textContent).toBe("You declined: Findings aren't final");
    btn(el, "Undo")!.click();
    await settle();
    await key(el.querySelector(".ui-dcd__question")!, "Enter", { ctrlKey: true, metaKey: true });
    expect(decided.at(-1)).toEqual({ choice: "approve" });
    expect(el.querySelector(".ui-dcd__receipt-text")!.textContent).toBe("You approved");
  });

  test("the queue: 1 of 3 with previous / next and a cancelable tc-position-change", async () => {
    const el = await card({ queue: 3 } as Partial<TcDecisionCard>);
    expect(el.querySelector(".ui-dcd__count")!.textContent).toBe("1 of 3");
    const prev = el.querySelector<HTMLButtonElement>('[aria-label="Previous decision"]')!;
    const next = el.querySelector<HTMLButtonElement>('[aria-label="Next decision"]')!;
    expect(prev.disabled).toBe(true);
    const seen = listen<{ position: number }>(el, "tc-position-change");
    next.click();
    await settle();
    expect(seen).toEqual([{ position: 1 }]);
    expect(el.querySelector(".ui-dcd__count")!.textContent).toBe("2 of 3");
    listen(el, "tc-position-change", true);
    next.click();
    await settle();
    expect(el.position).toBe(1);
    el.queue = 1;
    await settle();
    expect(el.querySelector(".ui-dcd__queue")).toBeNull();
  });

  test("renamed labels, an empty card and narrow width", async () => {
    const el = await card({ labels: { send: "Answer", recommended: "Suggested", status: "Waiting on you" } } as Partial<TcDecisionCard>);
    expect(btn(el, "Answer")).toBeTruthy();
    expect(el.querySelector(".ui-dcd__chip")!.textContent).toBe("Suggested");
    expect(el.querySelector(".ui-dcd__status")!.textContent).toBe("Waiting on you");
    const empty = await fixture<TcDecisionCard>(html`<tc-decision-card></tc-decision-card>`);
    expect(empty.querySelectorAll('[role="radio"]')).toHaveLength(0);
    expect(empty.querySelector(".ui-dcd__waited")).toBeNull();
    el.style.width = "300px";
    await settle();
    expect(el.scrollWidth).toBeLessThanOrEqual(el.clientWidth + 1);
  });

  test("React wrapper: an uncontrolled pick survives a re-render; onDecision and the receipt", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onValueChange = vi.fn();
    const onDecision = vi.fn();
    const draw = (q: string) => root.render(React.createElement(DecisionCard, { agent: "Records agent", question: q, options: OPTIONS, onValueChange, onDecision, className: "consumer" }));
    await act(async () => draw("Which file?"));
    await settle();
    const el = host.querySelector("tc-decision-card")!;
    expect(el.classList.contains("consumer")).toBe(true);
    await act(async () => radio(el, "both").click());
    expect(onValueChange).toHaveBeenCalledWith("both");
    await act(async () => draw("Which file, again?"));
    await settle();
    expect(radio(el, "both").getAttribute("aria-checked")).toBe("true");
    await act(async () => btn(el, "Send")!.click());
    await settle();
    expect(onDecision).toHaveBeenCalledWith({ choice: "both" }, expect.any(Event));
    expect(el.sent).toBe(true);
    await act(async () => draw("Which file, again?"));
    await settle();
    expect(el.sent).toBe(true);
    await act(async () => root.unmount());
  });

  test("React wrapper, controlled: value, position and sent stay with the app", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onValueChange = vi.fn();
    const onDecision = vi.fn();
    const onPositionChange = vi.fn();
    const draw = (sent: boolean) =>
      root.render(React.createElement(DecisionCard, { question: "Which?", options: OPTIONS, value: "older", queue: 2, position: 0, sent, onValueChange, onDecision, onPositionChange }));
    await act(async () => draw(false));
    await settle();
    const el = host.querySelector("tc-decision-card")!;
    await act(async () => radio(el, "both").click());
    await settle();
    expect(onValueChange).toHaveBeenCalledWith("both");
    expect(el.value).toBe("older");
    await act(async () => el.querySelector<HTMLButtonElement>('[aria-label="Next decision"]')!.click());
    await settle();
    expect(onPositionChange).toHaveBeenCalledWith(1);
    expect(el.position).toBe(0);
    await act(async () => btn(el, "Send")!.click());
    await settle();
    expect(onDecision).toHaveBeenCalledWith({ choice: "older" }, expect.any(Event));
    expect(el.sent).toBe(false);
    await act(async () => draw(true));
    await settle();
    expect(el.querySelector(".ui-dcd__receipt-text")!.textContent).toBe("You chose: Keep the 2019 file");
    await act(async () => root.unmount());
  });

  for (const look of ["standard", "clean"] as const) {
    for (const theme of ["light", "dark"] as const) {
      test(`axe: no violations – ${look}, ${theme}`, async () => {
        const wrap = await fixture(
          html`<div data-tc-theme=${theme} style="padding: 16px; background: ${theme === "dark" ? "#0e0e10" : "#fff"}">
            <tc-decision-card look=${look} agent="Records agent" question="Which file?" context="Both share a tax ID." .options=${OPTIONS} allow-other .queue=${3} .since=${NOW - 60_000} .now=${NOW} value="other"></tc-decision-card>
            <tc-decision-card look=${look} kind="approve" agent="Report agent" question="Publish it?"></tc-decision-card>
            <tc-decision-card look=${look} agent="Records agent" question="Which file?" .options=${OPTIONS} sent .decision=${{ choice: "older" }}></tc-decision-card>
          </div>`,
        );
        const first = wrap.querySelector("tc-decision-card")!;
        btn(first, "Send")!.click();
        await settle();
        await finish(wrap);
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  }
});
