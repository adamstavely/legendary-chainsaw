/*
 * <tc-contact-channels> in real browsers: groups by kind, masking by kind and revealing, verification states, Copy and
 * the page's actions, the roving keyboard, controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/contact-channels";
import { maskContact, type ContactActionEvent, type ContactChannel, type ContactCopy, type ContactRevealedChange, type TcContactChannels } from "../../src/elements/contact-channels";
import { ContactChannels } from "../../src/elements/react/contact-channels";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

const CHANNELS: ContactChannel[] = [
  { id: "p1", kind: "phone", value: "+34 612 448 107", role: "Primary", lastUsed: Date.UTC(2026, 9, 24, 12), state: "verified" },
  { id: "e1", kind: "email", value: "elena@example.com", role: "Primary", state: "verified" },
  { id: "e2", kind: "email", value: "e.ruiz@work.example", role: "Work", state: "bounced", note: "Bounced twice" },
  { id: "a1", kind: "address", value: "Calle de la Luna 14, Madrid", state: "flagged" },
];

const rowOf = (el: Element, id: string) => el.querySelector<HTMLElement>(`[data-id="${id}"]`)!;
const text = (n: Element | null) => n!.textContent!.replace(/\s+/g, " ").trim();
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const make = (look: "standard" | "clean" = "standard") =>
  fixture<TcContactChannels>(html`<tc-contact-channels look=${look} locale="en-GB" .channels=${CHANNELS} .actions=${[{ id: "message", label: "Message" }]}></tc-contact-channels>`);

describe("tc-contact-channels", () => {
  test("masking by kind keeps just enough to recognise the value", () => {
    expect(maskContact("email", "elena@example.com")).toBe("e••••@example.com");
    expect(maskContact("phone", "+34 612 448 107")).toBe("•••• •• 07");
    expect(maskContact("address", "Calle de la Luna 14, Madrid")).toBe("••••, Madrid");
    expect(maskContact("messaging", "@elena")).toBe("@••••");
  });

  for (const look of ["standard", "clean"] as const) {
    test(`${look}: grouped as Email, Phone, Messaging, Address in that order, each row masked with its role, date and state`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("cch");
      expect(el.dataset.look).toBe(look);
      expect([...el.querySelectorAll(".ui-cch__group-head")].map(text)).toEqual(["Email", "Phone", "Address"]);
      expect(text(el.querySelector(".ui-cch__total"))).toBe("2 of 4 verified");
      const p = rowOf(el, "p1");
      expect(text(p.querySelector(".ui-cch__value"))).toBe("•••• •• 07ending 07, hidden");
      expect(text(p.querySelector(".ui-cch__meta"))).toBe("Primary Last used 24 Oct 2026");
      expect(text(p.querySelector(".ui-cch__pill"))).toBe("Verified");
      expect(text(rowOf(el, "e2").querySelector(".ui-cch__pill"))).toBe("Bounced");
      expect(text(rowOf(el, "e2").querySelector(".ui-cch__note"))).toBe("Bounced twice");
      // Copy only appears once a value is shown
      expect(el.querySelector(".ui-cch__copy")).toBeNull();
      expect(el.querySelectorAll('button[tabindex="0"]')).toHaveLength(1);
    });
  }

  test("reveal is cancelable and announced; a shown value can be copied, and Copy is cancelable", async () => {
    const el = await make();
    const write = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const seen: ContactRevealedChange[] = [];
    el.addEventListener("tc-revealed-change", (e) => seen.push((e as CustomEvent<ContactRevealedChange>).detail));
    const reveal = rowOf(el, "e1").querySelector<HTMLButtonElement>(".ui-cch__reveal")!;
    expect(reveal.getAttribute("aria-label")).toBe("Show Email, Primary");
    reveal.click();
    await settle();
    expect(text(rowOf(el, "e1").querySelector(".ui-cch__value"))).toBe("elena@example.com");
    expect(seen).toEqual([{ revealed: ["e1"], id: "e1", shown: true }]);
    expect(el.querySelector('[role="status"]')!.textContent).toBe("Email (Primary) shown");
    const copies: ContactCopy[] = [];
    el.addEventListener("tc-copy", (e) => copies.push((e as CustomEvent<ContactCopy>).detail));
    const copy = rowOf(el, "e1").querySelector<HTMLButtonElement>(".ui-cch__copy")!;
    copy.click();
    await expect.poll(() => rowOf(el, "e1").querySelector(".ui-cch__copy")!.getAttribute("aria-label")).toBe("Copied Email, Primary");
    expect(write).toHaveBeenCalledWith("elena@example.com");
    expect(copies.map((c) => c.text)).toEqual(["elena@example.com"]);
    // Prevented: nothing is written
    el.addEventListener("tc-copy", (e) => e.preventDefault());
    write.mockClear();
    rowOf(el, "e1").querySelector<HTMLButtonElement>(".ui-cch__copy")!.click();
    await settle();
    expect(write).not.toHaveBeenCalled();
  });

  test("the page's actions fire tc-action with the channel", async () => {
    const el = await make();
    const seen: ContactActionEvent[] = [];
    el.addEventListener("tc-action", (e) => seen.push((e as CustomEvent<ContactActionEvent>).detail));
    const btn = rowOf(el, "a1").querySelector<HTMLButtonElement>(".ui-cch__action")!;
    expect(btn.getAttribute("aria-label")).toBe("Message, Address");
    btn.click();
    expect(seen.map((s) => [s.action, s.channel.id])).toEqual([["message", "a1"]]);
  });

  test("keyboard: ↑ ↓ between rows in group order, ← → along a row's buttons, Home / End", async () => {
    const el = await make();
    const at = () => document.activeElement?.getAttribute("data-at");
    // Group order: e1, e2, p1, a1
    el.querySelector<HTMLElement>('[data-at="0:reveal"]')!.focus();
    const press = async (k: string) => {
      key(document.activeElement!, k);
      await expect.poll(() => el.querySelectorAll('button[tabindex="0"]').length).toBe(1);
      await settle();
    };
    await press("ArrowRight");
    expect(at()).toBe("0:a:message");
    await press("ArrowDown");
    expect(at()).toBe("1:a:message");
    await press("ArrowLeft");
    expect(at()).toBe("1:reveal");
    await press("End");
    expect(at()).toBe("3:reveal");
    await press("Home");
    expect(at()).toBe("0:reveal");
  });

  test("masked off shows every value with Copy; renamed groups and states apply; empty says so", async () => {
    const el = await make();
    el.masked = false;
    el.kindLabels = { email: "E-mail" };
    el.states = { flagged: { label: "Check", tone: "warning" } };
    await settle();
    expect(el.querySelector(".ui-cch__reveal")).toBeNull();
    expect(el.querySelectorAll(".ui-cch__copy")).toHaveLength(4);
    expect(text(el.querySelector(".ui-cch__group-head"))).toBe("E-mail");
    expect(text(rowOf(el, "a1").querySelector(".ui-cch__pill"))).toBe("Check");
    el.channels = [];
    await settle();
    expect(text(el.querySelector(".ui-cch__empty"))).toBe("No contact points on record.");
  });

  test("React wrapper: controlled revealed stays until the parent changes it; onCopy can stop a copy; onAction", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const write = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const asked: string[][] = [];
    const actions: string[] = [];
    await act(async () =>
      root.render(
        React.createElement(ContactChannels, {
          title: "Reach",
          channels: CHANNELS,
          revealed: [],
          masked: true,
          actions: [{ id: "call", label: "Call" }],
          onRevealedChange: (r) => void asked.push(r),
          onCopy: () => false,
          onAction: (a, c) => void actions.push(`${a}:${c.id}`),
        }),
      ),
    );
    await settle();
    const el = host.querySelector("tc-contact-channels")!;
    expect(el.querySelector(".tc-head__title")!.textContent).toBe("Reach");
    rowOf(el, "e1").querySelector<HTMLButtonElement>(".ui-cch__reveal")!.click();
    await settle();
    expect(asked).toEqual([["e1"]]);
    expect(el.revealed).toEqual([]);
    rowOf(el, "p1").querySelector<HTMLButtonElement>(".ui-cch__action")!.click();
    expect(actions).toEqual(["call:p1"]);
    el.masked = false;
    await settle();
    rowOf(el, "p1").querySelector<HTMLButtonElement>(".ui-cch__copy")!.click();
    await settle();
    expect(write).not.toHaveBeenCalled();
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-contact-channels .channels=${CHANNELS} .revealed=${["e1"]} .actions=${[{ id: "message", label: "Message" }]}></tc-contact-channels>
        <tc-contact-channels look="clean" .channels=${CHANNELS}></tc-contact-channels>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
