/*
 * <tc-comment-thread> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/comment-thread";
import type { TcCommentThread, ThreadMessage } from "../../src/elements/comment-thread";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const you = { name: "You" };
const bot = { name: "Assistant", assistant: true };
const msg = (id: string, text: string): ThreadMessage => ({ id, author: { name: "Mia" }, createdAt: 0, text });
const texts = (el: Element) => [...el.querySelectorAll(".ui-ct__msg .ui-ct__text")].map((p) => p.textContent!.trim());
const input = (el: Element) => el.querySelector<HTMLInputElement>(".ui-ct__input")!;
const sendBtn = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-ct__send")!;
const retry = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-ct__retry");
async function type(el: TcCommentThread, text: string) {
  const field = input(el);
  field.value = text;
  field.dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
}
async function reply(el: TcCommentThread, text: string) {
  await type(el, text);
  sendBtn(el).click();
  await settle();
}
const flush = async () => {
  for (let i = 0; i < 3; i++) await new Promise((r) => setTimeout(r));
  await settle();
};

for (const look of ["standard", "clean"] as const) {
  describe(`tc-comment-thread (${look})`, () => {
    test("the host is the root and the region, named by the heading; page attributes stay on it", async () => {
      const el = await fixture<TcCommentThread>(html`<tc-comment-thread look=${look} class="mine" data-x="1" id="t" .messages=${[msg("a", "First")]} .currentUser=${you}></tc-comment-thread>`);
      expect(el.dataset.ui).toBe("ct");
      expect(el.dataset.look).toBe(look);
      expect(el.classList.contains("mine")).toBe(true);
      expect(el.dataset.x).toBe("1");
      expect(el.getAttribute("role")).toBe("region");
      expect(el.getAttribute("aria-label")).toBe("Comment");
      el.heading = "Pricing";
      await settle();
      expect(el.getAttribute("aria-label")).toBe("Pricing");
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("Pricing");
      expect(el.querySelector(".ui-ct__count")!.textContent).toBe("1 message");
    });

    test("later messages from the app show (realtime, server data)", async () => {
      const el = await fixture<TcCommentThread>(html`<tc-comment-thread look=${look} .messages=${[msg("a", "First")]} .currentUser=${you}></tc-comment-thread>`);
      el.messages = [msg("a", "First"), msg("b", "From the server")];
      await settle();
      expect(texts(el)).toEqual(["First", "From the server"]);
    });

    test("a reply shows at once and is reported; passed back it isn't doubled", async () => {
      const el = await fixture<TcCommentThread>(html`<tc-comment-thread look=${look} .messages=${[msg("a", "First")]} .currentUser=${you}></tc-comment-thread>`);
      const changes: ThreadMessage[][] = [];
      el.addEventListener("tc-messages-change", (e) => changes.push((e as CustomEvent<{ messages: ThreadMessage[] }>).detail.messages));
      await reply(el, "Thanks!");
      expect(texts(el)).toEqual(["First", "Thanks!"]);
      expect(changes[0].map((m) => m.text)).toEqual(["First", "Thanks!"]);
      el.messages = changes[0];
      await settle();
      expect(texts(el)).toEqual(["First", "Thanks!"]);
      el.messages = [...changes[0], msg("c", "Later")];
      await settle();
      expect(texts(el)).toEqual(["First", "Thanks!", "Later"]);
    });

    test("controlled: a prevented change keeps the reply out until the app passes it back", async () => {
      const el = await fixture<TcCommentThread>(html`<tc-comment-thread look=${look} .messages=${[msg("a", "First")]} .currentUser=${you}></tc-comment-thread>`);
      let next: ThreadMessage[] = [];
      el.addEventListener("tc-messages-change", (e) => {
        e.preventDefault();
        next = (e as CustomEvent<{ messages: ThreadMessage[] }>).detail.messages;
      });
      await reply(el, "Mine");
      expect(texts(el)).toEqual(["First"]);
      el.messages = next;
      await settle();
      expect(texts(el)).toEqual(["First", "Mine"]);
    });

    test("a rejected onReply is shown with Try again, which asks again", async () => {
      const onReply = vi.fn((): Promise<ThreadMessage> => Promise.reject(new Error("offline")));
      const el = await fixture<TcCommentThread>(html`<tc-comment-thread look=${look} .messages=${[msg("a", "First")]} .currentUser=${you} .assistant=${bot} .onReply=${onReply}></tc-comment-thread>`);
      await reply(el, "@Assistant fix it");
      await flush();
      expect(el.querySelector("[role=status]")!.textContent).toBe("Assistant couldn't answer.");
      expect(el.querySelector(".ui-ct__failed")?.textContent).toContain("Assistant couldn't answer.");
      onReply.mockImplementation(() => Promise.resolve({ id: "r", author: bot, createdAt: 0, text: "Done." }));
      retry(el)!.click();
      await flush();
      expect(onReply).toHaveBeenLastCalledWith("@Assistant fix it");
      expect(el.querySelector(".ui-ct__failed")).toBeNull();
      expect(texts(el)).toEqual(["First", "@Assistant fix it", "Done."]);
    });

    test("an answer that arrives after removal changes nothing and throws nothing", async () => {
      let resolve!: (m: ThreadMessage) => void;
      const error = vi.spyOn(console, "error");
      const el = await fixture<TcCommentThread>(html`<tc-comment-thread look=${look} .messages=${[]} .currentUser=${you} .assistant=${bot} .onReply=${() => new Promise<ThreadMessage>((r) => (resolve = r))}></tc-comment-thread>`);
      const changes = vi.fn();
      el.addEventListener("tc-messages-change", changes);
      await reply(el, "hi");
      el.remove();
      resolve({ id: "r", author: bot, createdAt: 0, text: "late" });
      await flush();
      expect(changes).toHaveBeenCalledTimes(1);
      expect(error).not.toHaveBeenCalled();
    });

    test("rendering doesn't read the clock", async () => {
      const el = await fixture<TcCommentThread>(html`<tc-comment-thread look=${look} .messages=${[msg("a", "First")]} .currentUser=${you}></tc-comment-thread>`);
      const spy = vi.spyOn(Date, "now");
      el.messages = [msg("a", "First"), msg("b", "Second")];
      await settle();
      expect(spy).not.toHaveBeenCalled();
    });

    test("the close button shows with closable and fires tc-close", async () => {
      const el = await fixture<TcCommentThread>(html`<tc-comment-thread look=${look} .messages=${[]} .currentUser=${you}></tc-comment-thread>`);
      expect(el.querySelector('[aria-label="Close comment"]')).toBeNull();
      el.closable = true;
      await settle();
      const close = vi.fn();
      el.addEventListener("tc-close", close);
      el.querySelector<HTMLButtonElement>('[aria-label="Close comment"]')!.click();
      expect(close).toHaveBeenCalledTimes(1);
    });

    test("status lines fold their details open", async () => {
      const m: ThreadMessage = { id: "s", author: bot, createdAt: 0, text: "Done", status: "Edited 2 lines", details: ["One", "Two"] };
      const el = await fixture<TcCommentThread>(html`<tc-comment-thread look=${look} .messages=${[m]} .currentUser=${you}></tc-comment-thread>`);
      const btn = el.querySelector<HTMLButtonElement>(".ui-ct__status-btn")!;
      const details = el.querySelector<HTMLElement>(".ui-ct__details")!;
      expect(btn.getAttribute("aria-expanded")).toBe("false");
      expect(details.inert).toBe(true);
      btn.click();
      await settle();
      expect(btn.getAttribute("aria-expanded")).toBe("true");
      expect(details.inert).toBe(false);
      expect(details.hasAttribute("data-open")).toBe(true);
    });

    test("an avatar element is cloned, with its ids made unique", async () => {
      const mark = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      mark.innerHTML = '<defs><linearGradient id="g"></linearGradient></defs><circle fill="url(#g)"></circle>';
      const a = { name: "Assistant", assistant: true, avatar: mark };
      const el = await fixture<TcCommentThread>(html`<tc-comment-thread look=${look} .messages=${[{ ...msg("a", "x"), author: a }, { ...msg("b", "y"), author: a }]} .currentUser=${you}></tc-comment-thread>`);
      const copies = [...el.querySelectorAll(".ui-ct__avatar svg")];
      expect(copies).toHaveLength(2);
      const ids = copies.map((c) => c.querySelector("linearGradient")!.id);
      expect(new Set(ids).size).toBe(2);
      expect(copies[0].querySelector("circle")!.getAttribute("fill")).toBe(`url(#${ids[0]})`);
      expect(mark.isConnected).toBe(false);
    });
  });

  /* WCAG + design pass: no live list, focus never lost (2.4.3), focusable scroll area, field focus ring */
  describe(`tc-comment-thread (${look}) – a11y`, () => {
    test("the conversation isn't live; a narrow status region is there from the start and reads new answers once", async () => {
      const onReply = vi.fn(() => Promise.resolve({ id: "r", author: bot, createdAt: 0, text: "Done.", status: "Edited 2 lines" }));
      const el = await fixture<TcCommentThread>(html`<tc-comment-thread look=${look} .messages=${[msg("a", "First")]} .currentUser=${you} .assistant=${bot} .onReply=${onReply}></tc-comment-thread>`);
      const status = el.querySelector("[role=status]")!;
      expect(status.textContent).toBe("");
      expect(el.querySelector("[aria-live]:not([role=status])")).toBeNull();
      const list = el.querySelector<HTMLElement>('[role=region][aria-label="Messages"]')!;
      expect(list.tabIndex).toBe(0);
      expect(list.getAttribute("aria-live")).toBeNull();
      await reply(el, "@Assistant fix it");
      await flush();
      expect(status.textContent).toBe("Assistant: Done.. Edited 2 lines");
    });

    test("sending with the button moves focus to the reply field, not to <body>", async () => {
      const el = await fixture<TcCommentThread>(html`<tc-comment-thread look=${look} .messages=${[msg("a", "First")]} .currentUser=${you}></tc-comment-thread>`);
      await type(el, "Thanks");
      const send = sendBtn(el);
      send.focus();
      send.click();
      await settle();
      expect(send.disabled).toBe(true);
      expect(document.activeElement).toBe(input(el));
    });

    test("Try again goes away once used: focus moves to the reply field", async () => {
      const onReply = vi.fn((): Promise<ThreadMessage> => Promise.reject(new Error("offline")));
      const el = await fixture<TcCommentThread>(html`<tc-comment-thread look=${look} .messages=${[]} .currentUser=${you} .assistant=${bot} .onReply=${onReply}></tc-comment-thread>`);
      await reply(el, "hi");
      await flush();
      const button = retry(el)!;
      button.focus();
      onReply.mockImplementation(() => new Promise<ThreadMessage>(() => {}));
      button.click();
      await flush();
      expect(retry(el)).toBeNull();
      expect(document.activeElement).toBe(input(el));
    });

    test("the reply field has no outline of its own – its row carries the focus ring", async () => {
      const el = await fixture<TcCommentThread>(html`<tc-comment-thread look=${look} .messages=${[]} .currentUser=${you}></tc-comment-thread>`);
      expect((el.constructor as typeof TcCommentThread).css).toMatch(/\.ui-ct__composer:has\(\.ui-ct__input:focus-visible\) \{ box-shadow: inset 0 0 0 var\(--tc-focus-ring-width/);
    });
  });
}

test("axe: no violations in either look", async () => {
  const m: ThreadMessage = { id: "s", author: bot, createdAt: 0, text: "Done", status: "Edited 2 lines", details: ["One"] };
  const wrap = await fixture(html`<div>
    <tc-comment-thread closable .messages=${[msg("a", "/edit fix the totals"), m]} .currentUser=${you} .assistant=${bot}></tc-comment-thread>
    <tc-comment-thread look="clean" closable heading="Clean" .messages=${[msg("a", "First"), m]} .currentUser=${you}></tc-comment-thread>
  </div>`);
  // The entry animation starts at opacity 0 – axe checks the settled colours
  for (const a of document.getAnimations()) a.finish();
  const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
});
