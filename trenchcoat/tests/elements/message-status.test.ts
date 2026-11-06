/*
 * <tc-message-status> in real browsers: receipts and their words, relative times, Copy, Retry with a promise, Branch and
 * Edit events, roving focus, quiet controls, narrow width, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import { TcMessageStatus, defaultMessageStatusLabels, relativeMessageTime, type MessageStatusRetry } from "../../src/elements/message-status";
import { MessageStatus } from "../../src/elements/react/message-status";
import { cleanup, finish, fixture, settle } from "./helpers";

const restores: (() => void)[] = [];
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  while (restores.length) restores.pop()!();
});

/** Replaces a property of `obj` for one test */
function stub(obj: object, key: string, value: unknown) {
  const own = Object.getOwnPropertyDescriptor(obj, key);
  Object.defineProperty(obj, key, { configurable: true, writable: true, value });
  restores.push(() => (own ? Object.defineProperty(obj, key, own) : delete (obj as Record<string, unknown>)[key]));
}

// Noon on a Wednesday, so "today" and "yesterday" are unambiguous
const NOW = new Date(2026, 2, 18, 12, 0, 0).getTime();
const MIN = 60_000;

const buttons = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>(".ui-mst__btn")];
const named = (el: Element, name: string) => buttons(el).find((b) => (b.getAttribute("aria-label") ?? b.textContent!.trim()) === name);

describe("tc-message-status", () => {
  for (const look of ["standard", "clean"]) {
    test(`${look}: a receipt, a time and a toolbar of controls with one tab stop`, async () => {
      const el = await fixture<TcMessageStatus>(html`<tc-message-status look=${look} receipt="read" .time=${NOW - 20_000} .now=${NOW} text="Hi"></tc-message-status>`);
      expect(el.dataset.ui).toBe("mst");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".ui-mst__receipt")!.getAttribute("data-receipt")).toBe("read");
      expect(el.querySelector(".ui-mst__receipt")!.textContent!.trim()).toBe("Read");
      const time = el.querySelector("time")!;
      expect(time.textContent).toBe("Just now");
      expect(time.getAttribute("datetime")).toBe(new Date(NOW - 20_000).toISOString());
      expect(time.title).toMatch(/2026/);
      const bar = el.querySelector('[role="toolbar"]')!;
      expect(bar.getAttribute("aria-label")).toBe("Message controls");
      expect(buttons(el).map((b) => b.getAttribute("aria-label"))).toEqual(["Copy", "Send again", "Branch into a new chat"]);
      expect(buttons(el).map((b) => b.tabIndex)).toEqual([0, -1, -1]);
    });
  }

  test("each receipt has its mark and its word", async () => {
    const el = await fixture<TcMessageStatus>(html`<tc-message-status .time=${NOW} .now=${NOW}></tc-message-status>`);
    const words: Record<string, string> = { sending: "Sending…", sent: "Sent", delivered: "Delivered", read: "Read", failed: "Not sent" };
    for (const [receipt, word] of Object.entries(words)) {
      el.receipt = receipt as TcMessageStatus["receipt"];
      await settle();
      const r = el.querySelector(".ui-mst__receipt")!;
      expect(r.textContent!.trim()).toBe(word);
      expect(r.getAttribute("title")).toBe(word);
      // sending and failed say it visibly; the others are a mark with a screen-reader word
      expect(!!el.querySelector(".ui-mst__word")).toBe(receipt === "sending" || receipt === "failed");
    }
    // no time while it's still sending
    el.receipt = "sending";
    await settle();
    expect(el.querySelector("time")).toBeNull();
    el.receipt = "bogus" as TcMessageStatus["receipt"];
    await settle();
    expect(el.receipt).toBe("sent");
  });

  test("a change of receipt is announced politely, but not the first one", async () => {
    const el = await fixture<TcMessageStatus>(html`<tc-message-status receipt="sent"></tc-message-status>`);
    const live = el.querySelector('[role="status"]')!;
    expect(live.textContent).toBe("");
    el.receipt = "delivered";
    await settle();
    expect(live.textContent!.trim()).toBe("Delivered");
    el.receipt = "failed";
    await settle();
    expect(live.textContent!.trim()).toBe("Not sent");
  });

  test("relative times: just now, minutes, hours, yesterday and a date", () => {
    const L = defaultMessageStatusLabels;
    expect(relativeMessageTime(NOW - 30_000, NOW)).toBe("Just now");
    expect(relativeMessageTime(NOW - 2 * MIN, NOW)).toBe("2 min ago");
    expect(relativeMessageTime(NOW - 3 * 60 * MIN, NOW)).toBe("3 hr ago");
    expect(relativeMessageTime(new Date(2026, 2, 17, 20, 0).getTime(), NOW)).toBe("Yesterday");
    expect(relativeMessageTime(new Date(2026, 2, 2, 9, 0).getTime(), NOW, L, "en-US")).toBe("Mar 2");
    expect(relativeMessageTime(new Date(2025, 11, 24, 9, 0).getTime(), NOW, L, "en-US")).toBe("Dec 24, 2025");
    // a time from the future (clock skew) reads as just now
    expect(relativeMessageTime(NOW + 5 * MIN, NOW)).toBe("Just now");
  });

  test("time takes a Date, an ISO string or epoch ms; labels rename the words", async () => {
    const el = await fixture<TcMessageStatus>(html`<tc-message-status .time=${new Date(NOW - 5 * MIN)} .now=${NOW}></tc-message-status>`);
    expect(el.querySelector("time")!.textContent).toBe("5 min ago");
    el.time = new Date(NOW - 10 * MIN).toISOString();
    await settle();
    expect(el.querySelector("time")!.textContent).toBe("10 min ago");
    el.time = "not a date";
    await settle();
    expect(el.querySelector("time")).toBeNull();
    el.time = NOW - 2 * MIN;
    el.labels = { minutesAgo: (n) => `vor ${n} Min.`, copy: "Kopieren", controls: "Steuerung" };
    await settle();
    expect(el.querySelector("time")!.textContent).toBe("vor 2 Min.");
    expect(buttons(el)[0].getAttribute("aria-label")).toBe("Kopieren");
    expect(el.querySelector('[role="toolbar"]')!.getAttribute("aria-label")).toBe("Steuerung");
  });

  test("without `now` it keeps its own clock", async () => {
    const el = await fixture<TcMessageStatus>(html`<tc-message-status .time=${Date.now() - 3 * MIN}></tc-message-status>`);
    expect(el.querySelector("time")!.textContent).toBe("3 min ago");
  });

  test("Copy puts the text on the clipboard, turns into a check and fires tc-copy", async () => {
    const writes: string[] = [];
    stub(navigator, "clipboard", { writeText: (t: string) => (writes.push(t), Promise.resolve()) });
    const el = await fixture<TcMessageStatus>(html`<tc-message-status text="Chart the tide"></tc-message-status>`);
    const copied = vi.fn();
    el.addEventListener("tc-copy", (e) => copied((e as CustomEvent).detail));
    named(el, "Copy")!.click();
    await expect.poll(() => buttons(el)[0].getAttribute("aria-label")).toBe("Copied");
    expect(writes).toEqual(["Chart the tide"]);
    expect(copied).toHaveBeenCalledWith({ text: "Chart the tide" });
    expect(buttons(el)[0].hasAttribute("data-done")).toBe(true);
    expect(el.hasAttribute("data-active")).toBe(true);
    await expect.poll(() => buttons(el)[0].getAttribute("aria-label"), { timeout: 4000 }).toBe("Copy");
  });

  test("a denied clipboard says so and fires no tc-copy", async () => {
    stub(navigator, "clipboard", { writeText: () => Promise.reject(new Error("denied")) });
    const el = await fixture<TcMessageStatus>(html`<tc-message-status text="x"></tc-message-status>`);
    const copied = vi.fn();
    el.addEventListener("tc-copy", copied);
    named(el, "Copy")!.click();
    await expect.poll(() => buttons(el)[0].getAttribute("aria-label")).toBe("Couldn't copy");
    expect(copied).not.toHaveBeenCalled();
  });

  test("Send again fires tc-retry, then onRetry; a promise keeps it busy and a rejection says so", async () => {
    const el = await fixture<TcMessageStatus>(html`<tc-message-status receipt="delivered"></tc-message-status>`);
    const details: MessageStatusRetry[] = [];
    el.addEventListener("tc-retry", (e) => details.push((e as CustomEvent<MessageStatusRetry>).detail));
    let reject!: () => void;
    const onRetry = vi.fn(() => new Promise<void>((_, no) => (reject = () => no(new Error("offline")))));
    el.onRetry = onRetry;
    named(el, "Send again")!.click();
    await settle();
    expect(details).toEqual([{ receipt: "delivered" }]);
    expect(onRetry).toHaveBeenCalledTimes(1);
    const retry = el.querySelector<HTMLButtonElement>(".ui-mst__btn--retry")!;
    expect(retry.getAttribute("aria-busy")).toBe("true");
    // pressing again while busy does nothing
    retry.click();
    expect(onRetry).toHaveBeenCalledTimes(1);
    reject();
    await expect.poll(() => el.querySelector('[role="status"]')!.textContent!.trim()).toBe("Couldn't send");
    expect(retry.hasAttribute("aria-busy")).toBe(false);
  });

  test("preventDefault() on tc-retry skips onRetry", async () => {
    const el = await fixture<TcMessageStatus>(html`<tc-message-status></tc-message-status>`);
    const onRetry = vi.fn();
    el.onRetry = onRetry;
    el.addEventListener("tc-retry", (e) => e.preventDefault());
    named(el, "Send again")!.click();
    await settle();
    expect(onRetry).not.toHaveBeenCalled();
  });

  test("a failed message shows Retry in words, always, even when actions leave it out", async () => {
    const el = await fixture<TcMessageStatus>(html`<tc-message-status receipt="failed" .actions=${["copy"]}></tc-message-status>`);
    const retry = el.querySelector<HTMLButtonElement>(".ui-mst__btn--retry")!;
    expect(retry.textContent!.trim()).toBe("Retry");
    expect(retry.hasAttribute("aria-label")).toBe(false);
    expect(buttons(el)[0]).toBe(retry);
    // quiet hides the other controls until hover, but Retry stays in view
    expect(el.hasAttribute("data-quiet")).toBe(true);
    expect(getComputedStyle(retry.parentElement!).opacity).toBe("1");
    expect(getComputedStyle(buttons(el)[1].parentElement!).opacity).toBe("0");
    el.receipt = "read";
    await settle();
    expect(el.querySelector(".ui-mst__btn--retry")).toBeNull();
  });

  test("Branch and Edit fire their events; quiet=false shows the controls always", async () => {
    const el = await fixture<TcMessageStatus>(html`<tc-message-status quiet="false" .actions=${["edit", "branch"]}></tc-message-status>`);
    const seen: string[] = [];
    el.addEventListener("tc-branch", (e) => seen.push(`${e.type}:${(e as CustomEvent).cancelable}`));
    el.addEventListener("tc-edit", (e) => seen.push(`${e.type}:${(e as CustomEvent).cancelable}`));
    named(el, "Edit message")!.click();
    named(el, "Branch into a new chat")!.click();
    expect(seen).toEqual(["tc-edit:true", "tc-branch:true"]);
    expect(el.hasAttribute("data-quiet")).toBe(false);
    expect(getComputedStyle(buttons(el)[0].parentElement!).opacity).toBe("1");
  });

  test("arrow keys, Home and End move focus across the controls; Escape hides the tooltip", async () => {
    const el = await fixture<TcMessageStatus>(html`<tc-message-status .actions=${["copy", "retry", "branch", "edit"]}></tc-message-status>`);
    const bs = buttons(el);
    bs[0].focus();
    const key = async (k: string) => {
      document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
      await settle();
    };
    await key("ArrowRight");
    await expect.poll(() => document.activeElement).toBe(bs[1]);
    expect(bs.map((b) => b.tabIndex)).toEqual([-1, 0, -1, -1]);
    await key("End");
    await expect.poll(() => document.activeElement).toBe(bs[3]);
    await key("ArrowRight");
    await expect.poll(() => document.activeElement).toBe(bs[0]);
    await key("ArrowLeft");
    await expect.poll(() => document.activeElement).toBe(bs[3]);
    await key("Home");
    await expect.poll(() => document.activeElement).toBe(bs[0]);
    await key("Escape");
    expect(el.hasAttribute("data-hush")).toBe(true);
    expect(document.activeElement).toBe(bs[0]);
  });

  test("hover on the message shows quiet controls; align start lines up on the left", async () => {
    const wrap = await fixture(html`<div data-ui-message><p>Hi</p><tc-message-status align="start"></tc-message-status></div>`);
    const el = wrap.querySelector<TcMessageStatus>("tc-message-status")!;
    const item = el.querySelector(".ui-mst__item")!;
    expect(getComputedStyle(item).opacity).toBe("0");
    el.querySelector<HTMLButtonElement>(".ui-mst__btn")!.focus();
    await expect.poll(() => getComputedStyle(item).opacity).toBe("1");
    expect(getComputedStyle(el.querySelector(".ui-mst__row")!).justifyContent).toBe("flex-start");
  });

  test("no actions: no dot and no toolbar", async () => {
    const el = await fixture<TcMessageStatus>(html`<tc-message-status .actions=${[]}></tc-message-status>`);
    expect(el.querySelector('[role="toolbar"]')).toBeNull();
    expect(el.querySelector(".ui-mst__dot")).toBeNull();
  });

  test("narrow: the time steps out of sight but is still read", async () => {
    const el = await fixture<TcMessageStatus>(html`<tc-message-status style="width: 180px" .time=${NOW} .now=${NOW}></tc-message-status>`);
    const time = el.querySelector("time")!;
    await expect.poll(() => time.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    expect(time.textContent).toBe("Just now");
    el.style.width = "400px";
    await expect.poll(() => time.getBoundingClientRect().width).toBeGreaterThan(10);
  });

  test("React: props reach the element and callbacks fire", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onBranch = vi.fn();
    const onRetry = vi.fn();
    await act(async () => root.render(React.createElement(MessageStatus, { receipt: "delivered", time: NOW - 2 * MIN, now: NOW, text: "x", onBranch, onRetry })));
    await settle();
    const el = host.querySelector<TcMessageStatus>("tc-message-status")!;
    expect(el.receipt).toBe("delivered");
    expect(el.querySelector("time")!.textContent).toBe("2 min ago");
    named(el, "Branch into a new chat")!.click();
    named(el, "Send again")!.click();
    expect(onBranch).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledTimes(1);
    // a re-render with a new receipt keeps the element and updates it
    await act(async () => root.render(React.createElement(MessageStatus, { receipt: "read", time: NOW - 2 * MIN, now: NOW, text: "x", onBranch, onRetry })));
    await settle();
    expect(host.querySelector("tc-message-status")).toBe(el);
    expect(el.querySelector(".ui-mst__receipt")!.getAttribute("data-receipt")).toBe("read");
    await act(async () => root.unmount());
    host.remove();
  });

  test("axe: no violations, in both looks and both themes, with each receipt", async () => {
    for (const scheme of ["light", "dark"]) {
      for (const look of ["standard", "clean"]) {
        const wrap = await fixture(html`<div style=${`background: Canvas; color: CanvasText; color-scheme: ${scheme}; padding: 8px`} data-ui-message>
          ${["sending", "read", "failed"].map((r) => html`<tc-message-status look=${look} receipt=${r} quiet="false" .time=${NOW} .now=${NOW}></tc-message-status>`)}
        </div>`);
        await finish(wrap);
        const { violations } = await axe.run(wrap);
        expect(violations.map((v) => `${scheme}/${look}: ${v.id}`)).toEqual([]);
      }
    }
  });
});
