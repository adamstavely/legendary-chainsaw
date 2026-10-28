/*
 * <tc-email-draft> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/email-draft";
import type { DraftContact, DraftTone, TcEmailDraft } from "../../src/elements/email-draft";
import { EmailDraft } from "../../src/elements/react/email-draft";
import { cleanup, fixture, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const looks = ["standard", "clean"] as const;
const people: DraftContact[] = [
  { name: "Jonas Weber", email: "jonas@northwind.io" },
  { name: "Lena Hart", email: "lena@northwind.io" },
];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Sending shows its spinner for at least 900 ms: waits until it's over (sent, or back to the draft on a failure) */
const sent = async (...els: Element[]) => {
  for (const el of els) await expect.poll(() => (el as HTMLElement).dataset.phase, { timeout: 5000 }).not.toBe("sending");
  await settle();
};
const button = (root: Element, name: string | RegExp) =>
  [...root.querySelectorAll<HTMLButtonElement>("button")].find((b) => {
    const label = b.getAttribute("aria-label") ?? b.textContent!.trim();
    return typeof name === "string" ? label === name : name.test(label);
  });
const sendButton = (root: Element) => button(root, "Send email")!;
const trigger = (root: Element) => root.querySelector<HTMLButtonElement>(".ui-ed__recipient")!;
const option = (root: Element, name: RegExp) => [...root.querySelectorAll<HTMLElement>('[role="option"]')].find((o) => name.test(o.textContent!))!;
const status = (root: Element) => root.querySelector('[role="status"]')!;
const key = async (target: Element, k: string, init: KeyboardEventInit = {}) => {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
  await settle();
};
const click = async (el: HTMLElement) => {
  el.click();
  await settle();
};
const until = async (check: () => boolean) => {
  for (let i = 0; i < 50 && !check(); i++) await wait(10);
  expect(check()).toBe(true);
};
const draft = (look: string = "standard") => fixture<TcEmailDraft>(html`<tc-email-draft look=${look} demo></tc-email-draft>`);

describe("tc-email-draft", () => {
  // Runs first: the warning is once per page, so a later test would find it already spent
  test("simulated sending: silent with demo, otherwise one warning", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const quiet = await draft();
    await click(sendButton(quiet));
    await sent(quiet);
    expect(warn.mock.calls.filter(([m]) => String(m).startsWith("EmailDraft:"))).toHaveLength(0);
    cleanup();
    const wrap = await fixture(html`<div><tc-email-draft></tc-email-draft><tc-email-draft></tc-email-draft></div>`);
    for (const b of wrap.querySelectorAll<HTMLButtonElement>(".ui-ed__primary")) b.click();
    await settle();
    await sent(...wrap.querySelectorAll("tc-email-draft"));
    expect(warn.mock.calls.filter(([m]) => String(m).startsWith("EmailDraft:"))).toHaveLength(1);
  });

  for (const look of looks) {
    test(`${look}: the host is the root; the record, the email and the footer`, async () => {
      const el = await fixture<TcEmailDraft>(html`<tc-email-draft look=${look} reference="INV-1" account="Lumen" amount="$5" status="Due" agent="Collections agent" demo></tc-email-draft>`);
      expect(el.dataset.ui).toBe("ed");
      expect(el.dataset.look).toBe(look);
      expect(el.dataset.phase).toBe("draft");
      expect(el.querySelector(".tc-head__title")!.textContent).toBe("INV-1");
      expect(el.querySelector(".tc-head__sub")!.textContent).toBe("Lumen");
      expect(el.querySelector(".ui-ed__agent")!.textContent).toBe("Collections agent");
      expect(el.querySelector(".ui-ed__badge")!.textContent).toBe("Ready for review");
      expect(el.querySelector(".ui-ed__text")!.textContent).toBe(
        "Hi Jonas, a heads-up that your Growth plan renews on October 9 for $8,900 a year. If you'd like to add seats or switch to monthly billing, you can review the quote here: Review quote",
      );
      expect(!!el.querySelector(".ui-ed__card")).toBe(look === "standard");
      // The buttons: Standard in the card, Clean in the footer
      expect(!!el.querySelector(".ui-ed__foot .ui-ed__buttons")).toBe(look === "clean");
    });

    test(`${look}: Undo after Send fires tc-undo and brings the draft back`, async () => {
      const el = await fixture<TcEmailDraft>(html`<tc-email-draft look=${look} undo-send></tc-email-draft>`);
      const onSend = vi.fn();
      el.onSend = onSend;
      const undo = vi.fn();
      el.addEventListener("tc-undo", (e) => undo((e as CustomEvent).detail.action));
      await click(sendButton(el));
      await sent(el);
      expect(onSend).toHaveBeenCalledTimes(1);
      expect(onSend.mock.calls[0][0]).toEqual({ to: people[0], body: expect.stringMatching(/^Hi Jonas, .* Review quote: #$/), attachment: "Renewal-quote.pdf" });
      expect(el.dataset.phase).toBe("sent");
      expect(el.querySelector(".ui-ed__receipt-text")!.textContent).toBe("Sent to Jonas Weber with Renewal-quote.pdf");
      await click(button(el, "Undo")!);
      expect(undo).toHaveBeenCalledWith("send");
      expect(sendButton(el)).toBeTruthy();
    });

    test(`${look}: a send that reached onSend offers no Undo unless undo-send – just the receipt`, async () => {
      const el = await fixture<TcEmailDraft>(html`<tc-email-draft look=${look}></tc-email-draft>`);
      el.onSend = vi.fn();
      await click(sendButton(el));
      await sent(el);
      expect(status(el).textContent).toMatch(/sent to Jonas Weber/i);
      expect(button(el, "Undo")).toBeUndefined();
    });

    test(`${look}: Discard fires tc-discard; Undo for it unless undo-discard="false"`, async () => {
      const el = await fixture<TcEmailDraft>(html`<tc-email-draft look=${look} undo-discard="false" demo></tc-email-draft>`);
      const discarded = vi.fn();
      el.addEventListener("tc-discard", discarded);
      await click(button(el, "Discard")!);
      expect(discarded).toHaveBeenCalledTimes(1);
      expect(status(el).textContent).toMatch(/discarded/);
      expect(el.querySelector(".ui-ed__badge")!.textContent).toBe("Discarded");
      expect(button(el, "Undo")).toBeUndefined();
      cleanup();

      const other = await fixture<TcEmailDraft>(html`<tc-email-draft look=${look} demo></tc-email-draft>`);
      const undo = vi.fn();
      other.addEventListener("tc-undo", (e) => undo((e as CustomEvent).detail.action));
      await click(button(other, "Discard")!);
      await click(button(other, "Undo")!);
      expect(undo).toHaveBeenCalledWith("discard");
      expect(status(other).textContent).toBe("Discard undone – the draft is back.");
    });

    test(`${look}: a rejected onSend brings the draft back with an error`, async () => {
      const el = await fixture<TcEmailDraft>(html`<tc-email-draft look=${look}></tc-email-draft>`);
      el.onSend = () => Promise.reject(new Error("smtp down"));
      await click(sendButton(el));
      await sent(el);
      expect(el.querySelector('[role="alert"]')!.textContent).toMatch(/couldn't be sent/);
      expect(sendButton(el).disabled).toBe(false);
      expect(el.querySelector(".ui-ed__receipt")).toBeNull();
    });

    test(`${look}: contact names with RegExp characters are replaced literally`, async () => {
      const contacts = [
        { name: "Ana (Ops", email: "ana@example.com" },
        { name: "Ben Lee", email: "ben@example.com" },
      ];
      const tones: DraftTone[] = [{ id: "plain", label: "Plain", body: (c) => `Hi ${c.name}, see below:` }];
      const el = await fixture<TcEmailDraft>(html`<tc-email-draft look=${look} .contacts=${contacts} .tones=${tones} demo></tc-email-draft>`);
      await click(button(el, "Edit text")!);
      const field = el.querySelector<HTMLTextAreaElement>("textarea")!;
      field.value = "Hi Ana (Ops, my own words";
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.blur();
      await settle();
      await click(trigger(el));
      await click(option(el, /Ben Lee/));
      expect(el.querySelector(".ui-ed__text")!.textContent).toMatch(/^Hi Ben Lee, my own words/);
    });

    test(`${look}: empty contacts and tones render without crashing, and nothing can be sent`, async () => {
      const el = await fixture<TcEmailDraft>(html`<tc-email-draft look=${look} .contacts=${[]} .tones=${[]} demo></tc-email-draft>`);
      expect(sendButton(el).disabled).toBe(true);
      expect(trigger(el).textContent).toContain("No recipient");
    });

    test(`${look}: new contacts and tones passed later are used; a recipient that's gone falls back to the first`, async () => {
      const el = await fixture<TcEmailDraft>(html`<tc-email-draft look=${look} .contacts=${people} demo></tc-email-draft>`);
      await click(trigger(el));
      await click(option(el, /Lena Hart/));
      expect(trigger(el).textContent).toContain("lena@northwind.io");
      const ines = { name: "Ines Ruiz", email: "ines@northwind.io" };
      el.contacts = [ines, people[0]];
      await settle();
      expect(trigger(el).textContent).toContain("ines@northwind.io");
      el.contacts = [ines];
      el.tones = [{ id: "warm", label: "Warm", body: (c) => `Hello ${c.name}` }];
      await settle();
      expect(button(el, "Warm")!.getAttribute("aria-pressed")).toBe("true");
      expect(el.querySelector(".ui-ed__text")!.textContent).toContain("Hello Ines Ruiz");
    });

    test(`${look}: a removed attachment stays removed, a new one shows; it can be attached again`, async () => {
      const el = await fixture<TcEmailDraft>(html`<tc-email-draft look=${look} attachment="a.pdf" demo></tc-email-draft>`);
      await click(button(el, "Remove a.pdf")!);
      expect(button(el, "Remove a.pdf")).toBeUndefined();
      expect(el.querySelector(".ui-ed__attach")!.textContent!.trim()).toBe("Attach a.pdf");
      el.attachment = "b.pdf";
      await settle();
      expect(button(el, "Remove b.pdf")).toBeTruthy();
      await click(button(el, "Remove b.pdf")!);
      await click(el.querySelector<HTMLButtonElement>(".ui-ed__attach")!);
      expect(button(el, "Remove b.pdf")).toBeTruthy();
    });

    test(`${look}: controlled recipient and tone – picks are reported, not applied`, async () => {
      const el = await fixture<TcEmailDraft>(html`<tc-email-draft look=${look} .contacts=${people} recipient="jonas@northwind.io" tone="friendly" demo></tc-email-draft>`);
      const recipients: unknown[] = [];
      const tones: unknown[] = [];
      el.addEventListener("tc-recipient-change", (e) => {
        e.preventDefault();
        recipients.push((e as CustomEvent).detail);
      });
      el.addEventListener("tc-tone-change", (e) => {
        e.preventDefault();
        tones.push((e as CustomEvent).detail.tone);
      });
      await click(trigger(el));
      await click(option(el, /Lena Hart/));
      expect(recipients).toEqual([{ email: "lena@northwind.io", recipient: "lena@northwind.io", contact: people[1] }]);
      expect(trigger(el).textContent).toContain("jonas@northwind.io");
      await click(button(el, "Short")!);
      expect(tones).toEqual(["short"]);
      expect(button(el, "Friendly")!.getAttribute("aria-pressed")).toBe("true");
      el.recipient = "lena@northwind.io";
      el.tone = "short";
      await settle();
      expect(trigger(el).textContent).toContain("lena@northwind.io");
      expect(button(el, "Short")!.getAttribute("aria-pressed")).toBe("true");
    });

    test(`${look}: recipient – a real listbox: arrow keys, Enter picks, Esc closes, focus returns to the trigger`, async () => {
      const el = await draft(look);
      const picks: string[] = [];
      el.addEventListener("tc-recipient-change", (e) => picks.push((e as CustomEvent).detail.email));
      const t = trigger(el);
      // The name keeps the visible text (2.5.3)
      const name = t
        .getAttribute("aria-labelledby")!
        .split(" ")
        .map((id) => document.getElementById(id)!.textContent)
        .join(" ");
      expect(name).toMatch(/^to\s*Jonas Weber/i);
      await click(t);
      const list = el.querySelector<HTMLElement>('[role="listbox"]')!;
      expect(list.getAttribute("aria-label")).toBe("Recipient");
      expect(document.activeElement).toBe(list);
      const options = [...el.querySelectorAll('[role="option"]')];
      expect(options.every((o) => o.parentElement === list)).toBe(true);
      expect(list.querySelector("button")).toBeNull();
      expect(list.getAttribute("aria-activedescendant")).toBe(options[0].id);
      await key(list, "ArrowDown");
      expect(list.getAttribute("aria-activedescendant")).toBe(options[1].id);
      await key(list, "Enter");
      expect(picks).toEqual(["lena@northwind.io"]);
      expect(el.querySelector('[role="listbox"]')).toBeNull();
      expect(document.activeElement).toBe(t);
      await key(t, "ArrowDown");
      expect(document.activeElement).toBe(el.querySelector('[role="listbox"]'));
      await key(el.querySelector('[role="listbox"]')!, "Escape");
      expect(el.querySelector('[role="listbox"]')).toBeNull();
      expect(document.activeElement).toBe(t);
      // A press outside closes it
      await click(t);
      document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      await settle();
      expect(el.querySelector('[role="listbox"]')).toBeNull();
    });

    test(`${look}: Esc in the editor returns focus to the Edit button; ⌘/Ctrl Enter sends`, async () => {
      const el = await draft(look);
      await click(button(el, "Edit text")!);
      const field = el.querySelector<HTMLTextAreaElement>("textarea")!;
      expect(document.activeElement).toBe(field);
      expect(field.getAttribute("aria-label")).toBe("Email text");
      await key(field, "Escape");
      expect(el.querySelector("textarea")).toBeNull();
      expect(document.activeElement).toBe(button(el, "Edit text"));
      await click(button(el, "Edit text")!);
      await key(el.querySelector("textarea")!, "Enter", { ctrlKey: true });
      expect(el.dataset.phase).toBe("sending");
    });

    test(`${look}: Send keeps focus while sending, then Undo; Undo hands focus back to Send`, async () => {
      const el = await fixture<TcEmailDraft>(html`<tc-email-draft look=${look} undo-send></tc-email-draft>`);
      el.onSend = vi.fn();
      const send = sendButton(el);
      send.focus();
      await click(send);
      expect(send.getAttribute("aria-disabled")).toBe("true");
      expect(document.activeElement).toBe(send);
      await sent(el);
      await until(() => document.activeElement === button(el, "Undo"));
      await click(button(el, "Undo")!);
      await until(() => document.activeElement === sendButton(el));
    });

    test(`${look}: without Undo, focus lands on the receipt, not <body>`, async () => {
      const el = await fixture<TcEmailDraft>(html`<tc-email-draft look=${look}></tc-email-draft>`);
      el.onSend = vi.fn();
      sendButton(el).focus();
      await click(sendButton(el));
      await sent(el);
      await until(() => document.activeElement === el.querySelector(".ui-ed__receipt"));
    });

    test(`${look}: a persistent status region announces the result`, async () => {
      const el = await draft(look);
      const s = status(el);
      expect(s.textContent).toBe("");
      await click(sendButton(el));
      await sent(el);
      expect(status(el)).toBe(s);
      expect(s.textContent).toMatch(/Email sent to Jonas Weber/);
      expect(el.querySelector(".ui-ed__receipt[role]")).toBeNull();
    });

    test(`${look}: picking a tone over manual edits keeps them restorable`, async () => {
      const el = await draft(look);
      await click(button(el, "Edit text")!);
      const field = el.querySelector<HTMLTextAreaElement>("textarea")!;
      field.value = "My own words";
      field.dispatchEvent(new Event("input", { bubbles: true }));
      await settle();
      await click(button(el, "Short")!);
      expect(el.textContent).not.toMatch(/My own words/);
      expect(status(el).textContent).toMatch(/edits were replaced/);
      await click(button(el, "Restore my edits")!);
      expect(el.querySelector(".ui-ed__text")!.textContent).toMatch(/^My own words/);
      expect(status(el).textContent).toBe("Your edits are back.");
    });
  }

  test("React wrapper: onSend, onDiscard and onUndo keep their API; an uncontrolled recipient survives a re-render", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const onSend = vi.fn();
    const onUndo = vi.fn();
    const onRecipientChange = vi.fn();
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(EmailDraft, { contacts: people, onSend, onUndo, onRecipientChange, "data-n": n } as React.ComponentProps<typeof EmailDraft>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-email-draft")!;
    await click(trigger(el));
    await click(option(el, /Lena Hart/));
    expect(onRecipientChange).toHaveBeenCalledWith("lena@northwind.io", people[1]);
    await act(async () => bump());
    await settle();
    expect(trigger(el).textContent).toContain("lena@northwind.io");
    await click(sendButton(el));
    await sent(el);
    expect(onSend.mock.calls[0][0].to).toEqual(people[1]);
    await click(button(el, "Undo")!);
    expect(onUndo).toHaveBeenCalledWith("send");
    await act(async () => root.unmount());
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-email-draft demo></tc-email-draft>
      <tc-email-draft look="clean" demo></tc-email-draft>
    </div>`);
    document.getAnimations().forEach((a) => a.finish());
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});
