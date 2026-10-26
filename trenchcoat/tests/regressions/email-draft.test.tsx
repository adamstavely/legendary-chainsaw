/*
 * H7 email-draft: Undo after Send/Discard used to reset only the card while onSend/onDiscard had already fired.
 * Also: contact names went into a RegExp unescaped, and empty `contacts` / `tones` crashed.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as standard from "@components/email-draft";
import * as clean from "@components/email-draft-clean";

const styles = [
  ["standard", standard],
  ["clean", clean],
] as const;

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const advance = async (ms: number, step = 100) => {
  for (let t = 0; t < ms; t += step) {
    await act(async () => {
      vi.advanceTimersByTime(step);
    });
  }
};

const warnings = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls.filter(([m]) => String(m).startsWith("EmailDraft:"));
const sendButton = () => screen.getByRole("button", { name: "Send email" });

for (const [style, ui] of styles) {
  const { EmailDraft } = ui;

  describe(`email-draft (${style})`, () => {
    // Runs first: the warning is once per page, so a later test would find it already spent
    test("simulated sending: silent with demo, otherwise one warning", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { unmount } = render(<EmailDraft demo />);
      fireEvent.click(sendButton());
      await advance(1000);
      expect(warnings(warn)).toHaveLength(0);
      unmount();

      render(
        <>
          <EmailDraft />
          <EmailDraft />
        </>,
      );
      for (const b of screen.getAllByRole("button", { name: "Send email" })) fireEvent.click(b);
      await advance(1000);
      expect(warnings(warn)).toHaveLength(1);
    });

    test("Undo after Send calls onUndo and brings the draft back", async () => {
      const onSend = vi.fn();
      const onUndo = vi.fn();
      render(<EmailDraft onSend={onSend} onUndo={onUndo} />);
      fireEvent.click(sendButton());
      await advance(1000);
      expect(onSend).toHaveBeenCalledTimes(1);
      fireEvent.click(screen.getByRole("button", { name: "Undo" }));
      expect(onUndo).toHaveBeenCalledWith("send");
      expect(sendButton()).toBeTruthy();
    });

    test("without onUndo a send that reached onSend offers no Undo – just the receipt", async () => {
      render(<EmailDraft onSend={vi.fn()} />);
      fireEvent.click(sendButton());
      await advance(1000);
      expect(screen.getByRole("status").textContent).toMatch(/sent to Jonas Weber/i);
      expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
    });

    test("Discard: Undo only with onUndo once onDiscard has fired", async () => {
      const { unmount } = render(<EmailDraft onDiscard={vi.fn()} />);
      fireEvent.click(screen.getByRole("button", { name: "Discard" }));
      expect(screen.getByRole("status").textContent).toMatch(/discarded/);
      expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
      unmount();

      const onUndo = vi.fn();
      render(<EmailDraft onDiscard={vi.fn()} onUndo={onUndo} />);
      fireEvent.click(screen.getByRole("button", { name: "Discard" }));
      fireEvent.click(screen.getByRole("button", { name: "Undo" }));
      expect(onUndo).toHaveBeenCalledWith("discard");
    });

    test("a rejected onSend brings the draft back with an error", async () => {
      const onSend = vi.fn(() => Promise.reject(new Error("smtp down")));
      render(<EmailDraft onSend={onSend} />);
      fireEvent.click(sendButton());
      await advance(1000);
      expect(screen.getByRole("alert").textContent).toMatch(/couldn't be sent/);
      expect((sendButton() as HTMLButtonElement).disabled).toBe(false);
      expect(screen.queryByText(/Sent to/)).toBeNull();
    });

    test("contact names with RegExp characters are replaced literally", async () => {
      const contacts = [
        { name: "Ana (Ops", email: "ana@example.com" },
        { name: "Ben Lee", email: "ben@example.com" },
      ];
      const tones = [{ id: "plain", label: "Plain", body: (c: { name: string }) => `Hi ${c.name}, see below:` }];
      render(<EmailDraft contacts={contacts} tones={tones} onSend={vi.fn()} />);
      fireEvent.click(screen.getByRole("button", { name: "Edit text" }));
      await advance(100);
      const field = screen.getByRole("textbox", { name: "Email text" });
      fireEvent.change(field, { target: { value: "Hi Ana (Ops, my own words" } });
      fireEvent.blur(field);
      fireEvent.click(screen.getByRole("button", { name: /Ana \(Ops/ }));
      fireEvent.click(screen.getByRole("option", { name: /Ben Lee/ }));
      expect(screen.getByText(/Hi Ben Lee, my own words/)).toBeTruthy();
    });

    test("empty contacts and tones render without crashing, and nothing can be sent", () => {
      render(<EmailDraft contacts={[]} tones={[]} />);
      expect((sendButton() as HTMLButtonElement).disabled).toBe(true);
    });

    /* Phase 3: contacts, tones and attachment stay the source of truth; recipient and tone are controllable */

    const people = [
      { name: "Jonas Weber", email: "jonas@northwind.io" },
      { name: "Lena Hart", email: "lena@northwind.io" },
    ];
    const recipientText = () => document.querySelector(".ui-ed__recipient")?.textContent ?? "";

    test("new contacts and tones passed later are used; a recipient that's gone falls back to the first", () => {
      const { rerender } = render(<EmailDraft contacts={people} demo />);
      fireEvent.click(screen.getByRole("button", { name: /Jonas Weber/ }));
      fireEvent.click(screen.getByRole("option", { name: /Lena Hart/ }));
      expect(recipientText()).toContain("lena@northwind.io");
      const ines = { name: "Ines Ruiz", email: "ines@northwind.io" };
      rerender(<EmailDraft contacts={[ines, people[0]]} demo />);
      expect(recipientText()).toContain("ines@northwind.io");
      rerender(<EmailDraft contacts={[ines]} tones={[{ id: "warm", label: "Warm", body: (c) => `Hello ${c.name}` }]} demo />);
      expect(screen.getByRole("button", { name: "Warm" }).getAttribute("aria-pressed")).toBe("true");
      expect(document.querySelector(".ui-ed__text")?.textContent).toContain("Hello Ines Ruiz");
    });

    test("a removed attachment stays removed, a new one shows", () => {
      const { rerender } = render(<EmailDraft attachment="a.pdf" demo />);
      fireEvent.click(screen.getByRole("button", { name: "Remove a.pdf" }));
      rerender(<EmailDraft attachment="a.pdf" demo />);
      expect(screen.queryByRole("button", { name: "Remove a.pdf" })).toBeNull();
      rerender(<EmailDraft attachment="b.pdf" demo />);
      expect(screen.getByRole("button", { name: "Remove b.pdf" })).toBeTruthy();
    });

    test("controlled recipient and tone: picks are reported, not applied", () => {
      const onRecipientChange = vi.fn();
      const onToneChange = vi.fn();
      render(<EmailDraft contacts={people} demo recipient="jonas@northwind.io" onRecipientChange={onRecipientChange} tone="friendly" onToneChange={onToneChange} />);
      fireEvent.click(screen.getByRole("button", { name: /Jonas Weber/ }));
      fireEvent.click(screen.getByRole("option", { name: /Lena Hart/ }));
      expect(onRecipientChange).toHaveBeenCalledWith("lena@northwind.io", people[1]);
      expect(recipientText()).toContain("jonas@northwind.io");
      fireEvent.click(screen.getByRole("button", { name: "Short" }));
      expect(onToneChange).toHaveBeenCalledWith("short");
      expect(screen.getByRole("button", { name: "Friendly" }).getAttribute("aria-pressed")).toBe("true");
    });
  });
}

/*
 * WCAG pass: recipient listbox pattern (options owned by the listbox, arrow keys, Esc/pick return focus), focus never
 * drops to <body> on Esc in the editor or the Send ↔ receipt ↔ Undo swaps, a persistent status region, and manual edits
 * a tone replaced can be restored.
 */
for (const [style, ui] of styles) {
  const { EmailDraft } = ui;

  describe(`email-draft a11y (${style})`, () => {
    test("recipient: a real listbox – arrow keys, Enter picks, Esc closes, focus returns to the trigger", () => {
      const onRecipientChange = vi.fn();
      render(<EmailDraft demo onRecipientChange={onRecipientChange} />);
      const trigger = screen.getByRole("button", { name: /Jonas Weber/ });
      // The name keeps the visible text (2.5.3)
      expect(screen.getByRole("button", { name: /^to\s*Jonas Weber/i })).toBe(trigger);
      fireEvent.click(trigger);
      const list = screen.getByRole("listbox", { name: "Recipient" });
      expect(document.activeElement).toBe(list);
      const options = screen.getAllByRole("option");
      expect(options.every((o) => o.parentElement === list)).toBe(true);
      expect(list.querySelector("button")).toBeNull();
      expect(list.getAttribute("aria-activedescendant")).toBe(options[0].id);
      fireEvent.keyDown(list, { key: "ArrowDown" });
      expect(list.getAttribute("aria-activedescendant")).toBe(options[1].id);
      fireEvent.keyDown(list, { key: "Enter" });
      expect(onRecipientChange).toHaveBeenCalledWith("lena@northwind.io", expect.anything());
      expect(screen.queryByRole("listbox")).toBeNull();
      expect(document.activeElement).toBe(trigger);
      fireEvent.keyDown(trigger, { key: "ArrowDown" });
      expect(document.activeElement).toBe(screen.getByRole("listbox"));
      fireEvent.keyDown(screen.getByRole("listbox"), { key: "Escape" });
      expect(screen.queryByRole("listbox")).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });

    test("Esc in the editor returns focus to the Edit button", async () => {
      render(<EmailDraft demo />);
      fireEvent.click(screen.getByRole("button", { name: "Edit text" }));
      await act(async () => {
        vi.advanceTimersByTime(20);
      });
      const field = screen.getByRole("textbox", { name: "Email text" });
      field.focus();
      fireEvent.keyDown(field, { key: "Escape" });
      expect(screen.queryByRole("textbox")).toBeNull();
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Edit text" }));
    });

    test("Send keeps focus while sending, then Undo; Undo hands focus back to Send", async () => {
      render(<EmailDraft onSend={vi.fn()} onUndo={vi.fn()} />);
      const send = sendButton();
      send.focus();
      fireEvent.click(send);
      expect(send.getAttribute("aria-disabled")).toBe("true");
      expect(document.activeElement).toBe(send);
      await advance(1000);
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Undo" }));
      fireEvent.click(screen.getByRole("button", { name: "Undo" }));
      await act(async () => {});
      expect(document.activeElement).toBe(sendButton());
    });

    test("without Undo, focus lands on the receipt, not <body>", async () => {
      const { container } = render(<EmailDraft onSend={vi.fn()} />);
      sendButton().focus();
      fireEvent.click(sendButton());
      await advance(1000);
      expect(document.activeElement).toBe(container.querySelector(".ui-ed__receipt"));
    });

    test("a persistent status region announces the result", async () => {
      const { container } = render(<EmailDraft demo />);
      const status = screen.getByRole("status");
      expect(status.textContent).toBe("");
      fireEvent.click(sendButton());
      await advance(1000);
      expect(screen.getByRole("status")).toBe(status);
      expect(status.textContent).toMatch(/Email sent to Jonas Weber/);
      expect(container.querySelector(".ui-ed__receipt[role]")).toBeNull();
    });

    test("picking a tone over manual edits keeps them restorable", async () => {
      render(<EmailDraft demo />);
      fireEvent.click(screen.getByRole("button", { name: "Edit text" }));
      await act(async () => {
        vi.advanceTimersByTime(20);
      });
      fireEvent.change(screen.getByRole("textbox", { name: "Email text" }), { target: { value: "My own words" } });
      fireEvent.click(screen.getByRole("button", { name: "Short" }));
      expect(screen.queryByText(/My own words/)).toBeNull();
      expect(screen.getByRole("status").textContent).toMatch(/edits were replaced/);
      fireEvent.click(screen.getByRole("button", { name: "Restore my edits" }));
      expect(screen.getByText(/My own words/)).toBeTruthy();
    });
  });
}
