/*
 * comment-thread (Phase 3): `messages` was copied into state once and later updates were ignored; a rejected
 * onReply left nothing to recover with (no catch); the clock was read while rendering; no ref or DOM props.
 */
import { renderToString } from "react-dom/server";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/comment-thread";
import * as clean from "@components/comment-thread-clean";
import type { ThreadMessage } from "@components/comment-thread";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

afterEach(() => vi.restoreAllMocks());

const you = { name: "You" };
const bot = { name: "Assistant", assistant: true };
const msg = (id: string, text: string): ThreadMessage => ({ id, author: { name: "Mia" }, createdAt: 0, text });
const texts = () => [...document.querySelectorAll(".ui-ct__msg .ui-ct__text")].map((p) => p.textContent);
const reply = (text: string) => {
  fireEvent.change(screen.getByRole("textbox", { name: "Reply" }), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Send reply" }));
};

for (const [style, ui] of styles) {
  const { CommentThread } = ui;
  describe(`comment-thread (${style})`, () => {
    test("later messages from the parent show (realtime, server data)", () => {
      const { rerender } = render(<CommentThread messages={[msg("a", "First")]} currentUser={you} />);
      rerender(<CommentThread messages={[msg("a", "First"), msg("b", "From the server")]} currentUser={you} />);
      expect(texts()).toEqual(["First", "From the server"]);
    });

    test("a reply shows at once and is reported; passed back it isn't doubled", () => {
      const onMessagesChange = vi.fn();
      const { rerender } = render(<CommentThread messages={[msg("a", "First")]} currentUser={you} onMessagesChange={onMessagesChange} />);
      reply("Thanks!");
      expect(texts()).toEqual(["First", "Thanks!"]);
      const next = onMessagesChange.mock.calls[0][0] as ThreadMessage[];
      expect(next.map((m) => m.text)).toEqual(["First", "Thanks!"]);
      rerender(<CommentThread messages={next} currentUser={you} onMessagesChange={onMessagesChange} />);
      expect(texts()).toEqual(["First", "Thanks!"]);
      // …and a parent that adds one more after it keeps both
      rerender(<CommentThread messages={[...next, msg("c", "Later")]} currentUser={you} />);
      expect(texts()).toEqual(["First", "Thanks!", "Later"]);
    });

    test("a rejected onReply is shown with Try again, which asks again", async () => {
      const onReply = vi.fn((): Promise<ThreadMessage> => Promise.reject(new Error("offline")));
      render(<CommentThread messages={[msg("a", "First")]} currentUser={you} assistant={bot} onReply={onReply} />);
      await act(async () => reply("@Assistant fix it"));
      // Announced by the status region that is there from the start; shown in the conversation
      expect(screen.getByRole("status").textContent).toBe("Assistant couldn't answer.");
      expect(document.querySelector(".ui-ct__failed")?.textContent).toContain("Assistant couldn't answer.");
      onReply.mockImplementation(() => Promise.resolve({ id: "r", author: bot, createdAt: 0, text: "Done." }));
      await act(async () => fireEvent.click(screen.getByRole("button", { name: "Try again" })));
      expect(onReply).toHaveBeenLastCalledWith("@Assistant fix it");
      expect(document.querySelector(".ui-ct__failed")).toBeNull();
      expect(texts()).toEqual(["First", "@Assistant fix it", "Done."]);
    });

    test("no state is set after unmount when the answer arrives", async () => {
      let resolve!: (m: ThreadMessage) => void;
      const error = vi.spyOn(console, "error");
      const { unmount } = render(<CommentThread messages={[]} currentUser={you} assistant={bot} onReply={() => new Promise<ThreadMessage>((r) => (resolve = r))} />);
      reply("hi");
      unmount();
      await act(async () => resolve({ id: "r", author: bot, createdAt: 0, text: "late" }));
      expect(error).not.toHaveBeenCalled();
    });

    test("a server render doesn't read the clock", () => {
      const spy = vi.spyOn(Date, "now");
      renderToString(<CommentThread messages={[msg("a", "First")]} currentUser={you} />);
      expect(spy).not.toHaveBeenCalled();
    });
  });
}

/* WCAG + design pass: no live list (S7), focus never lost (S4, 2.4.3), focusable scroll area, field focus ring (S2) */
for (const [style, ui] of styles) {
  const { CommentThread } = ui;
  describe(`comment-thread (${style}) – a11y`, () => {
    test("the conversation isn't live; a narrow status region is there from mount and reads new answers once", async () => {
      const onReply = vi.fn(() => Promise.resolve({ id: "r", author: bot, createdAt: 0, text: "Done.", status: "Edited 2 lines" }));
      render(<CommentThread messages={[msg("a", "First")]} currentUser={you} assistant={bot} onReply={onReply} />);
      const status = screen.getByRole("status");
      expect(status.textContent).toBe("");
      expect(document.querySelector("[aria-live]:not([role=status])")).toBeNull();
      const list = screen.getByRole("region", { name: "Messages" });
      expect(list.tabIndex).toBe(0);
      expect(list.getAttribute("aria-live")).toBeNull();
      await act(async () => reply("@Assistant fix it"));
      // Your own reply isn't read back; the answer is
      expect(status.textContent).toBe("Assistant: Done.. Edited 2 lines");
    });

    test("sending with the button moves focus to the reply field, not to <body>", async () => {
      render(<CommentThread messages={[msg("a", "First")]} currentUser={you} />);
      const input = screen.getByRole("textbox", { name: "Reply" });
      fireEvent.change(input, { target: { value: "Thanks" } });
      const send = screen.getByRole("button", { name: "Send reply" });
      act(() => send.focus());
      fireEvent.click(send);
      await act(async () => {});
      expect((send as HTMLButtonElement).disabled).toBe(true);
      expect(document.activeElement).toBe(input);
    });

    test("Try again goes away once used: focus moves to the reply field", async () => {
      const onReply = vi.fn((): Promise<ThreadMessage> => Promise.reject(new Error("offline")));
      render(<CommentThread messages={[]} currentUser={you} assistant={bot} onReply={onReply} />);
      await act(async () => reply("hi"));
      const retry = screen.getByRole("button", { name: "Try again" });
      act(() => retry.focus());
      onReply.mockImplementation(() => new Promise<ThreadMessage>(() => {}));
      await act(async () => fireEvent.click(retry));
      expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
      expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Reply" }));
    });

    test("the reply field has no outline of its own – its row carries the focus ring", () => {
      const { container } = render(<CommentThread messages={[]} currentUser={you} />);
      const css = container.ownerDocument.querySelector('style[href="ui-comment-thread"]')?.textContent ?? document.head.innerHTML;
      expect(css).toMatch(/\.ui-ct__composer:has\(\.ui-ct__input:focus-visible\) \{ box-shadow: inset 0 0 0 var\(--tc-focus-ring-width/);
    });
  });
}
