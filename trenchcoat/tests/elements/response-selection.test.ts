/*
 * <tc-response-selection> in real browsers: the host and both looks, the toolbar by pointer and by keyboard, Reply and
 * the quote chips, Ask why, the edit menu and its request (cancel, error, retry), the inline diff with Accept and
 * Reject, controlled use, the React wrapper and axe.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { afterEach, describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/response-selection";
import type { ResponseEditRequest, ResponseQuotesChange, ResponseTextChange, TcResponseSelection } from "../../src/elements/response-selection";
import { rangeOf, textOf } from "../../src/elements/internal/selection";
import { ResponseSelection } from "../../src/elements/react/response-selection";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  document.getSelection()?.removeAllRanges();
  cleanup();
});

const TEXT = "Yes – you can work from abroad for up to 30 days a year, as long as you tell your manager in advance.\n\nLonger stays need approval from HR, because they can change where you pay tax.";
const at = (phrase: string, text = TEXT) => ({ start: text.indexOf(phrase), end: text.indexOf(phrase) + phrase.length });
const looks = ["standard", "clean"] as const;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
// Firefox queues selectionchange a few frames after the change
const frames = (n = 6) => new Promise<void>((r) => { const step = (k: number) => (k ? requestAnimationFrame(() => step(k - 1)) : r()); step(n); });
const plain = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();
const mac = /mac/i.test(navigator.userAgent);
const WORD = mac ? "Alt" : "Control";

const make = (o: { look?: string; text?: string } = {}) =>
  fixture<TcResponseSelection>(html`<tc-response-selection style="width: 640px" look=${o.look ?? "standard"} .text=${o.text ?? TEXT}></tc-response-selection>`);
const root = (el: Element) => el.querySelector<HTMLElement>(".ui-rsel__text")!;
const pop = (el: Element) => el.querySelector<HTMLElement>(".ui-rsel__pop");
const menu = (el: Element) => el.querySelector<HTMLElement>(".ui-rsel__menu");
const tool = (el: Element, kind: string) => pop(el)!.querySelector<HTMLButtonElement>(`.ui-rsel__tool[data-kind="${kind}"]`)!;
const status = (el: Element) => plain(el.querySelector('[role="status"]')!.textContent);
const mini = (el: Element, kind: string) => el.querySelector<HTMLButtonElement>(`.ui-rsel__mini[data-kind="${kind}"]`);
/** Selects [start, end) the way a pointer would: the native selection, then selectionchange */
const pick = async (el: TcResponseSelection, start: number, end: number) => {
  root(el).focus();
  const r = rangeOf(root(el), start, end);
  document.getSelection()!.setBaseAndExtent(r.startContainer, r.startOffset, r.endContainer, r.endOffset);
  await frames();
  await el.updateComplete;
  await frames(2);
};
const requests = (el: Element, keep = false) => {
  const out: ResponseEditRequest[] = [];
  el.addEventListener("tc-edit-request", (e) => {
    out.push((e as CustomEvent<ResponseEditRequest>).detail);
    if (keep) e.preventDefault();
  });
  return out;
};
/** Selects a phrase, opens Edit and picks a preset */
const askEdit = async (el: TcResponseSelection, phrase: string, preset = "shorter") => {
  await pick(el, at(phrase, el.text).start, at(phrase, el.text).end);
  tool(el, "edit").click();
  await el.updateComplete;
  await frames(2);
  menu(el)!.querySelector<HTMLButtonElement>(`[data-preset="${preset}"]`)!.click();
  await el.updateComplete;
};

describe("tc-response-selection", () => {
  for (const look of looks) {
    test(`${look}: the host is the text, with no card around it`, async () => {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("rsel");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head")).toBeNull();
      expect(textOf(root(el))).toBe(TEXT);
      expect(root(el).getAttribute("role")).toBe("document");
      expect(root(el).getAttribute("aria-label")).toBe("Answer");
      expect(root(el).tabIndex).toBe(0);
    });
  }

  test("a pointer selection opens the toolbar: Reply, Ask why, Edit", async () => {
    const el = await make();
    const r = at("30 days a year");
    await pick(el, r.start - 1, r.end + 1);
    const bar = pop(el)!;
    expect(bar.getAttribute("role")).toBe("toolbar");
    expect(bar.getAttribute("aria-label")).toBe("Selection");
    expect([...bar.querySelectorAll("button")].map((b) => plain(b.textContent))).toEqual(["Reply", "Ask why", "Edit"]);
    expect(tool(el, "edit").getAttribute("aria-haspopup")).toBe("menu");
    expect(getComputedStyle(bar).position).toBe("fixed");
  });

  test("actions: the toolbar offers only the actions given", async () => {
    const el = await make();
    el.actions = ["edit"];
    await el.updateComplete;
    await pick(el, 0, 3);
    expect([...pop(el)!.querySelectorAll("button")].map((b) => plain(b.textContent))).toEqual(["Edit"]);
  });

  test("Reply fires tc-quote and collects the passage as a chip and a mark; Reply with N hands them over", async () => {
    const el = await make();
    const quotes: unknown[] = [];
    const changes: ResponseQuotesChange[] = [];
    const replies: unknown[] = [];
    el.addEventListener("tc-quote", (e) => quotes.push((e as CustomEvent).detail));
    el.addEventListener("tc-quotes-change", (e) => changes.push((e as CustomEvent<ResponseQuotesChange>).detail));
    el.addEventListener("tc-reply", (e) => replies.push((e as CustomEvent).detail));
    const a = at("30 days a year");
    // Trimmed of the white space around it
    await pick(el, a.start - 1, a.end);
    tool(el, "reply").click();
    await el.updateComplete;
    expect(quotes).toEqual([{ passage: "30 days a year", ...a }]);
    expect(changes[0].change.type).toBe("add");
    expect(el.quotes).toHaveLength(1);
    expect(pop(el)).toBeNull();
    expect(status(el)).toBe("Quoted “30 days a year”. 1 quote ready to reply with");
    expect(plain(el.querySelector(".ui-rsel__quote")!.textContent)).toBe("Quoted: 30 days a year");
    expect(textOf(root(el))).toBe(TEXT);
    const b = at("approval from HR");
    await pick(el, b.start, b.end);
    tool(el, "reply").click();
    await el.updateComplete;
    expect([...el.querySelectorAll(".ui-rsel__chip-text")].map((c) => c.textContent)).toEqual(["30 days a year", "approval from HR"]);
    const send = el.querySelector<HTMLButtonElement>('.ui-rsel__btn[data-kind="reply"]')!;
    expect(plain(send.textContent)).toBe("Reply with 2 quotes");
    // The same passage twice is quoted once
    await pick(el, b.start, b.end);
    tool(el, "reply").click();
    await el.updateComplete;
    expect(el.quotes).toHaveLength(2);
    expect(status(el)).toBe("Already quoted: “approval from HR”");
    send.click();
    await el.updateComplete;
    expect(replies).toHaveLength(1);
    expect((replies[0] as { quotes: { text: string }[] }).quotes.map((q) => q.text)).toEqual(["30 days a year", "approval from HR"]);
    expect(el.quotes).toEqual([]);
    expect(changes.at(-1)!.change.type).toBe("clear");
    expect(el.querySelector(".ui-rsel__tray")).toBeNull();
    expect(document.activeElement).toBe(root(el));
  });

  test("tc-quote prevented: the app takes the quote and nothing is collected", async () => {
    const el = await make();
    el.addEventListener("tc-quote", (e) => e.preventDefault());
    await pick(el, 0, 3);
    tool(el, "reply").click();
    await el.updateComplete;
    expect(el.quotes).toEqual([]);
    expect(el.querySelector(".ui-rsel__tray")).toBeNull();
  });

  test("chips: a toolbar of Remove buttons; removing one moves focus to the next; controlled with preventDefault()", async () => {
    const el = await make();
    el.quotes = [
      { id: "a", ...at("30 days a year"), text: "30 days a year" },
      { id: "b", ...at("your manager"), text: "your manager" },
    ];
    await el.updateComplete;
    const bar = el.querySelector<HTMLElement>(".ui-rsel__chips")!;
    expect(bar.getAttribute("role")).toBe("toolbar");
    const xs = () => [...el.querySelectorAll<HTMLButtonElement>(".ui-rsel__chip-x")];
    expect(xs().map((b) => b.tabIndex)).toEqual([0, -1]);
    xs()[0].focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(xs()[1]);
    await userEvent.keyboard("{ArrowLeft}");
    expect(xs()[0].getAttribute("aria-label")).toBe("Remove quote “30 days a year”");
    xs()[0].click();
    await el.updateComplete;
    expect(el.quotes.map((q) => q.id)).toEqual(["b"]);
    expect(document.activeElement).toBe(xs()[0]);
    expect(status(el)).toBe("Quote removed. 1 quote left");
    el.addEventListener("tc-quotes-change", (e) => e.preventDefault());
    xs()[0].click();
    await el.updateComplete;
    expect(el.quotes.map((q) => q.id)).toEqual(["b"]);
  });

  test("Ask why fires tc-ask-why with the passage", async () => {
    const el = await make();
    const asks: unknown[] = [];
    el.addEventListener("tc-ask-why", (e) => asks.push((e as CustomEvent).detail));
    const r = at("they can change where you pay tax");
    await pick(el, r.start, r.end);
    tool(el, "why").click();
    await el.updateComplete;
    expect(asks).toEqual([{ passage: "they can change where you pay tax", ...r }]);
    expect(status(el)).toBe("Asked why: “they can change where you pay tax”");
  });

  test("Edit opens a menu of presets and Your own words…; a preset fires tc-edit-request and shows the passage working", async () => {
    const el = await make();
    const seen = requests(el);
    const r = at("as long as you tell your manager in advance");
    await pick(el, r.start, r.end);
    tool(el, "edit").click();
    await el.updateComplete;
    await frames(2);
    const m = menu(el)!;
    expect(m.getAttribute("role")).toBe("menu");
    expect([...m.querySelectorAll('[role="menuitem"]')].map((b) => plain(b.textContent))).toEqual(["Shorter", "Simpler", "More formal", "Your own words…"]);
    expect(tool(el, "edit").getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(m.querySelector('[data-preset="shorter"]'));
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(m.querySelector('[data-preset="simpler"]'));
    await userEvent.keyboard("{End}");
    expect(document.activeElement).toBe(m.querySelector('[data-preset="custom"]'));
    await userEvent.keyboard("{Home}{Enter}");
    await el.updateComplete;
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ passage: "as long as you tell your manager in advance", ...r, instruction: "Make this shorter", preset: "shorter" });
    expect(seen[0].signal.aborted).toBe(false);
    expect(menu(el)).toBeNull();
    expect(pop(el)).toBeNull();
    expect(root(el).getAttribute("aria-busy")).toBe("true");
    expect(plain(el.querySelector(".ui-rsel__pending")!.textContent)).toBe("Being rewritten: as long as you tell your manager in advance");
    expect(textOf(root(el))).toBe(TEXT);
    expect(status(el)).toBe("Rewriting “as long as you tell your manager in advance”. Escape cancels");
    expect(document.activeElement).toBe(root(el));
    // Esc in the text cancels: the signal aborts
    await userEvent.keyboard("{Escape}");
    await el.updateComplete;
    expect(seen[0].signal.aborted).toBe(true);
    expect(el.querySelector(".ui-rsel__pending")).toBeNull();
    expect(status(el)).toBe("Edit request cancelled");
  });

  test("Esc in the edit menu goes back to Edit; again closes the toolbar", async () => {
    const el = await make();
    await pick(el, 0, 3);
    tool(el, "edit").click();
    await el.updateComplete;
    await frames(2);
    await userEvent.keyboard("{Escape}");
    await el.updateComplete;
    expect(menu(el)).toBeNull();
    expect(document.activeElement).toBe(tool(el, "edit"));
    await userEvent.keyboard("{Escape}");
    await el.updateComplete;
    expect(pop(el)).toBeNull();
    expect(document.activeElement).toBe(root(el));
  });

  test("Your own words…: a field; Enter sends the instruction", async () => {
    const el = await make();
    const seen = requests(el);
    await pick(el, at("Longer stays").start, at("Longer stays").end);
    tool(el, "edit").click();
    await el.updateComplete;
    await frames(2);
    menu(el)!.querySelector<HTMLButtonElement>('[data-preset="custom"]')!.click();
    await el.updateComplete;
    await frames(2);
    const field = el.querySelector<HTMLInputElement>(".ui-rsel__field")!;
    expect(document.activeElement).toBe(field);
    expect(field.getAttribute("aria-label")).toBe("How should it change?");
    await userEvent.keyboard("{Enter}");
    expect(seen).toHaveLength(0);
    await userEvent.keyboard("Say trips over 30 days{Enter}");
    await el.updateComplete;
    expect(seen[0]).toMatchObject({ instruction: "Say trips over 30 days", preset: "custom", passage: "Longer stays" });
  });

  test("tc-edit-request prevented: nothing waits", async () => {
    const el = await make();
    const seen = requests(el, true);
    await askEdit(el, "Longer stays");
    expect(seen).toHaveLength(1);
    expect(seen[0].signal.aborted).toBe(true);
    expect(el.querySelector(".ui-rsel__pending")).toBeNull();
  });

  test("the app's edit shows as a word diff with Accept; Accept changes the text (tc-text-change) and moves quotes after it", async () => {
    const el = await make();
    const seen = requests(el);
    el.quotes = [
      { id: "before", ...at("Yes"), text: "Yes" },
      { id: "inside", ...at("your manager"), text: "your manager" },
      { id: "after", ...at("approval from HR"), text: "approval from HR" },
    ];
    await el.updateComplete;
    await askEdit(el, "as long as you tell your manager in advance");
    const changes: ResponseTextChange[] = [];
    el.addEventListener("tc-text-change", (e) => changes.push((e as CustomEvent<ResponseTextChange>).detail));
    const r = seen[0];
    el.edit = { start: r.start, end: r.end, replacement: "if you tell your manager first" };
    await el.updateComplete;
    expect(el.querySelector(".ui-rsel__pending")).toBeNull();
    expect(root(el).getAttribute("aria-busy")).toBe("false");
    expect(status(el)).toBe("Suggested edit ready. Tab to Accept or Reject");
    // Inserted words don't count in the text's offsets
    expect(textOf(root(el))).toBe(TEXT);
    expect([...el.querySelectorAll(".ui-rsel__del")].map((d) => plain(d.textContent))).toContain("removed: in advance");
    expect([...el.querySelectorAll(".ui-rsel__ins")].map((d) => plain(d.textContent))).toContain("added: first");
    const group = el.querySelector('.ui-rsel__aside[role="group"]')!;
    expect(group.getAttribute("aria-label")).toBe("Suggested edit");
    // Tab from the text reaches Accept (Firefox starts Tab from the caret, so start from the text's beginning)
    (el as unknown as { sel: { select(a: number): void } }).sel.select(0);
    root(el).focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(mini(el, "accept"));
    await userEvent.keyboard("{Enter}");
    await el.updateComplete;
    await frames(2);
    const next = TEXT.replace("as long as you tell your manager in advance", "if you tell your manager first");
    expect(changes).toEqual([{ text: next, previous: TEXT, start: r.start, end: r.end, replacement: "if you tell your manager first" }]);
    expect(el.text).toBe(next);
    expect(el.edit).toBeNull();
    expect(el.querySelector(".ui-rsel__edit")).toBeNull();
    expect(el.quotes.map((q) => [q.id, q.start, next.slice(q.start, q.end)])).toEqual([
      ["before", 0, "Yes"],
      ["after", at("approval from HR", next).start, "approval from HR"],
    ]);
    expect(document.activeElement).toBe(root(el));
    expect(status(el)).toBe("Edit accepted");
  });

  test("controlled text: tc-text-change prevented leaves the text; the edit settles when the app applies it", async () => {
    const el = await make();
    const r = at("Longer stays");
    el.edit = { ...r, replacement: "Longer trips" };
    await el.updateComplete;
    el.addEventListener("tc-text-change", (e) => e.preventDefault());
    mini(el, "accept")!.click();
    await el.updateComplete;
    expect(el.text).toBe(TEXT);
    expect(el.querySelector(".ui-rsel__edit")).not.toBeNull();
    el.text = TEXT.replace("Longer stays", "Longer trips");
    await el.updateComplete;
    expect(el.edit).toBeNull();
    expect(el.querySelector(".ui-rsel__edit")).toBeNull();
  });

  test("Reject fires tc-edit-reject and clears the edit; the text is unchanged", async () => {
    const el = await make();
    const rejects: unknown[] = [];
    el.addEventListener("tc-edit-reject", (e) => rejects.push((e as CustomEvent).detail));
    const r = at("Longer stays");
    el.edit = { ...r, replacement: "Longer trips" };
    await el.updateComplete;
    mini(el, "reject")!.focus();
    mini(el, "reject")!.click();
    await el.updateComplete;
    expect(rejects).toEqual([{ edit: { ...r, replacement: "Longer trips" } }]);
    expect(el.edit).toBeNull();
    expect(el.text).toBe(TEXT);
    expect(document.activeElement).toBe(root(el));
    expect(status(el)).toBe("Edit rejected");
  });

  test("an error answer shows Retry and Dismiss; Retry asks again with the same instruction", async () => {
    const el = await make();
    const seen = requests(el);
    await askEdit(el, "Longer stays", "formal");
    el.edit = { start: seen[0].start, end: seen[0].end, error: "The model is busy" };
    await el.updateComplete;
    expect(status(el)).toBe("Couldn't rewrite: The model is busy. Retry or dismiss");
    expect(plain(el.querySelector(".ui-rsel__err")!.textContent)).toBe("The model is busy");
    expect(textOf(root(el))).toBe(TEXT);
    mini(el, "retry")!.click();
    await el.updateComplete;
    expect(seen).toHaveLength(2);
    expect(seen[1]).toMatchObject({ instruction: "Make this more formal", preset: "formal", passage: "Longer stays" });
    expect(el.querySelector(".ui-rsel__pending")).not.toBeNull();
    // Cancel from its button
    mini(el, "cancel")!.click();
    await el.updateComplete;
    expect(seen[1].signal.aborted).toBe(true);
  });

  test("a second request aborts the first; removing the element aborts the pending one", async () => {
    const el = await make();
    const seen = requests(el);
    await askEdit(el, "Longer stays");
    await askEdit(el, "approval from HR", "simpler");
    expect(seen[0].signal.aborted).toBe(true);
    expect(seen[1].signal.aborted).toBe(false);
    el.remove();
    expect(seen[1].signal.aborted).toBe(true);
  });

  test("keyboard: Shift + arrows select, Tab enters the toolbar, ← → move in it, Esc returns to the text", async () => {
    const el = await make();
    root(el).focus();
    await userEvent.keyboard(`{Shift>}{${WORD}>}{ArrowRight}{/${WORD}}{/Shift}`);
    await el.updateComplete;
    await frames(2);
    expect(pop(el)).not.toBeNull();
    expect(status(el)).toBe("Selected “Yes”. Tab for reply, ask why and edit");
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement).toBe(tool(el, "reply"));
    await userEvent.keyboard("{ArrowLeft}");
    expect(document.activeElement).toBe(tool(el, "edit"));
    await userEvent.keyboard("{Escape}");
    await el.updateComplete;
    expect(pop(el)).toBeNull();
    expect(document.activeElement).toBe(root(el));
  });

  test("the wrapper: uncontrolled quotes survive a parent re-render; an accepted edit settles; callbacks fire", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const rootEl = createRoot(host);
    const calls: string[] = [];
    let rerender: (n: number) => void = () => {};
    const r = at("Longer stays");
    const edit = { ...r, replacement: "Longer trips" };
    function App() {
      const [n, setN] = React.useState(0);
      rerender = setN;
      return React.createElement(ResponseSelection, {
        textLabel: `Answer ${n}`,
        defaultText: TEXT,
        edit,
        defaultQuotes: [{ id: "a", ...at("your manager"), text: "your manager" }],
        onQuotesChange: (q, change) => calls.push(`quotes:${change.type}:${q.length}`),
        onTextChange: (t) => calls.push(`text:${t.includes("Longer trips")}`),
      });
    }
    await act(async () => rootEl.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcResponseSelection>("tc-response-selection")!;
    el.querySelector<HTMLButtonElement>(".ui-rsel__chip-x")!.click();
    await act(async () => settle());
    mini(el, "accept")!.click();
    await act(async () => settle());
    await act(async () => rerender(1));
    await settle();
    expect(root(el).getAttribute("aria-label")).toBe("Answer 1");
    expect(el.querySelector(".ui-rsel__chip")).toBeNull();
    expect(el.text).toContain("Longer trips");
    // The same edit object is still passed: it stays settled
    expect(el.querySelector(".ui-rsel__edit")).toBeNull();
    expect(calls).toEqual(["quotes:remove:0", "text:true"]);
    await act(async () => rootEl.unmount());
  });

  test("the wrapper: controlled quotes; onQuote returning false takes the quote; onEditRequest", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const rootEl = createRoot(host);
    const calls: string[] = [];
    await act(async () =>
      rootEl.render(
        React.createElement(ResponseSelection, {
          text: TEXT,
          quotes: [],
          onQuotesChange: () => calls.push("quotes"),
          onQuote: (p) => (calls.push(`quote:${p}`), false),
          onEditRequest: (req) => void calls.push(`edit:${req.instruction}`),
        }),
      ),
    );
    await settle();
    const el = host.querySelector<TcResponseSelection>("tc-response-selection")!;
    await pick(el, 0, 3);
    tool(el, "reply").click();
    await act(async () => settle());
    expect(calls).toEqual(["quote:Yes"]);
    expect(el.querySelector(".ui-rsel__tray")).toBeNull();
    await askEdit(el, "Longer stays");
    expect(calls).toEqual(["quote:Yes", "edit:Make this shorter"]);
    await act(async () => rootEl.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe: no violations in either look, with the toolbar, the menu, chips, a pending request and a diff open (${theme})`, async () => {
      // The component has no surface of its own: each sits on the page's raised surface, inside the viewport
      const wrap = await fixture(html`<div data-tc-theme=${theme} style=${`display: grid; gap: 8px; ${theme === "dark" ? "color-scheme: dark" : ""}`}>
        <tc-response-selection style="width: 380px; background: var(--tc-surface-raised)" .text=${TEXT}></tc-response-selection>
        <tc-response-selection style="width: 380px; background: var(--tc-surface-raised)" look="clean" .text=${TEXT}></tc-response-selection>
        <tc-response-selection style="width: 320px; background: var(--tc-surface-raised)" .text=${TEXT}></tc-response-selection>
      </div>`);
      const [std, clean, narrow] = [...wrap.querySelectorAll<TcResponseSelection>("tc-response-selection")];
      std.quotes = [{ id: "a", ...at("30 days a year"), text: "30 days a year" }];
      std.edit = { ...at("Longer stays"), replacement: "Longer trips abroad" };
      clean.quotes = [{ id: "a", ...at("your manager"), text: "your manager" }];
      clean.edit = { ...at("approval from HR"), error: "The model is busy" };
      await askEdit(narrow, "as long as you tell your manager");
      await pick(std, 0, 3);
      tool(std, "edit").click();
      await std.updateComplete;
      await wait(400);
      document.getAnimations().forEach((a) => a.effect?.getTiming().iterations !== Infinity && a.finish());
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ") + " " + n.failureSummary).join(", ")}`)).toEqual([]);
    });
  }
});
