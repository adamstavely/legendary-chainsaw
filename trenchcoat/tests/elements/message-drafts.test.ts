/*
 * <tc-message-drafts> in real browsers: the SMS length, the tabs, editing, Copy, Send and the receipt, the sms: link,
 * controlled use, the React wrapper and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test } from "vitest";
import "../../src/elements/message-drafts";
import { smsHref, smsLength, type MessageSend, type MessageVariant, type MessageVariantsChange, type TcMessageDrafts } from "../../src/elements/message-drafts";
import { MessageDrafts } from "../../src/elements/react/message-drafts";
import { cleanup, finish, fixture, settle } from "./helpers";

afterEach(cleanup);

const VARIANTS: MessageVariant[] = [
  { id: "friendly", tone: "Friendly", text: "Hi Sam! The audit review moved to Thursday at 2pm." },
  { id: "brief", tone: "Brief", text: "Review moved to Thu 2pm." },
  { id: "formal", tone: "Formal", text: "Hello Sam, the review is now on Thursday at 14:00." },
];
const make = (look = "standard", variants = VARIANTS) =>
  fixture<TcMessageDrafts>(html`<tc-message-drafts look=${look} recipient="Sam Okafor" to="+1 555 0142" .variants=${variants}></tc-message-drafts>`);
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const tabs = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
const area = (el: Element) => el.querySelector<HTMLTextAreaElement>(".ui-mdr__text")!;
const key = (target: Element, k: string) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
const button = (el: Element, label: string) => [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => text(b) === label)!;
const type = async (el: Element, value: string) => {
  area(el).value = value;
  area(el).dispatchEvent(new Event("input", { bubbles: true }));
  await settle();
};

describe("SMS length", () => {
  test("GSM: 160 a message, then 153", () => {
    expect(smsLength("")).toMatchObject({ characters: 0, segments: 0, unicode: false });
    expect(smsLength("a".repeat(160))).toMatchObject({ segments: 1, unicode: false });
    expect(smsLength("a".repeat(161))).toMatchObject({ segments: 2, unicode: false });
    expect(smsLength("a".repeat(306))).toMatchObject({ segments: 2 });
    // The extension table's characters take two places
    expect(smsLength("€".repeat(80)).segments).toBe(1);
    expect(smsLength("€".repeat(81)).segments).toBe(2);
  });
  test("Unicode: 70 a message, then 67; an emoji takes two", () => {
    expect(smsLength("Thanks ’")).toMatchObject({ unicode: true, segments: 1 });
    expect(smsLength("é".repeat(10) + "’" + "a".repeat(59))).toMatchObject({ unicode: true, segments: 1 });
    expect(smsLength("’" + "a".repeat(70))).toMatchObject({ unicode: true, segments: 2 });
    expect(smsLength("👍")).toMatchObject({ characters: 1, unicode: true, segments: 1 });
  });
  test("the sms: link has the number and the text", () => {
    expect(smsHref("+1 555 0142", "See you at 2pm & thanks")).toBe("sms:+15550142?body=See%20you%20at%202pm%20%26%20thanks");
  });
});

describe("tc-message-drafts", () => {
  for (const look of ["standard", "clean"] as const) {
    test(`${look}: the recipient, a tab per variant, the draft and its length`, async () => {
      const el = await make(look);
      expect(el.dataset.ui).toBe("mdr");
      expect(el.dataset.look).toBe(look);
      expect(text(el.querySelector(".tc-head__sub, .tc-head__subtitle") ?? el.querySelector(".tc-head"))).toContain("To Sam Okafor · +1 555 0142");
      expect(tabs(el).map((t) => text(t))).toEqual(["Friendly", "Brief", "Formal"]);
      expect(tabs(el).map((t) => t.tabIndex)).toEqual([0, -1, -1]);
      expect(tabs(el)[0].getAttribute("aria-selected")).toBe("true");
      expect(el.querySelector('[role="tabpanel"]')!.getAttribute("aria-labelledby")).toBe(tabs(el)[0].id);
      expect(area(el).value).toBe(VARIANTS[0].text);
      expect(text(el.querySelector(".ui-mdr__meta"))).toBe("50 characters · 1 message");
      expect(area(el).getAttribute("aria-describedby")).toBe(el.querySelector(".ui-mdr__meta")!.id);
      expect(text(el.querySelector(`label[for="${area(el).id}"]`))).toBe("Friendly message");
    });
  }

  test("the tabs: click and arrow keys pick a variant; cancelable", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-selected-change", (e) => seen.push((e as CustomEvent<{ selected: string }>).detail.selected));
    tabs(el)[1].click();
    await settle();
    expect(area(el).value).toBe(VARIANTS[1].text);
    key(tabs(el)[1], "ArrowRight");
    await settle();
    expect(el.selected).toBe("formal");
    expect(document.activeElement).toBe(tabs(el)[2]);
    key(tabs(el)[2], "ArrowRight");
    await settle();
    expect(el.selected).toBe("friendly");
    key(tabs(el)[0], "End");
    await settle();
    expect(seen).toEqual(["brief", "formal", "friendly", "formal"]);
    el.addEventListener("tc-selected-change", (e) => e.preventDefault(), { once: true });
    key(tabs(el)[2], "Home");
    await settle();
    expect(el.selected).toBe("formal");
  });

  test("editing: the length follows; a prevented edit puts the text back", async () => {
    const el = await make();
    const seen: MessageVariantsChange[] = [];
    el.addEventListener("tc-variants-change", (e) => seen.push((e as CustomEvent<MessageVariantsChange>).detail));
    await type(el, "a".repeat(170));
    expect(seen[0].id).toBe("friendly");
    expect(el.variants[0].text).toHaveLength(170);
    expect(text(el.querySelector(".ui-mdr__meta"))).toBe("170 characters · 2 messages");
    expect(el.querySelector(".ui-mdr__meta")!.hasAttribute("data-long")).toBe(true);
    await type(el, "Thanks 👍");
    expect(text(el.querySelector(".ui-mdr__meta"))).toBe("8 characters · 1 message (Unicode)");
    el.addEventListener("tc-variants-change", (e) => e.preventDefault(), { once: true });
    await type(el, "Nope");
    expect(area(el).value).toBe("Thanks 👍");
    // Emptied, Copy and Send are off
    await type(el, "  ");
    expect(button(el, "Copy").disabled).toBe(true);
    expect(button(el, "Send").disabled).toBe(true);
  });

  test("Copy: the event, then Copied or Couldn't copy", async () => {
    const el = await make();
    const seen: string[] = [];
    el.addEventListener("tc-copy-text", (e) => {
      seen.push((e as CustomEvent<{ text: string }>).detail.text);
    });
    button(el, "Copy").click();
    await expect.poll(() => el.querySelector(".ui-mdr__btn[data-copied]")?.getAttribute("data-copied")).toMatch(/ok|failed/);
    expect(seen).toEqual([VARIANTS[0].text]);
    expect(text(el.querySelector('[role="status"]'))).toMatch(/Copied: Friendly|Couldn't copy/);
    // Prevented, the page copies it: nothing changes here
    const fresh = await make();
    fresh.addEventListener("tc-copy-text", (e) => e.preventDefault());
    button(fresh, "Copy").click();
    await settle();
    expect(fresh.querySelector(".ui-mdr__btn[data-copied]")).toBeNull();
  });

  test("Send: the event with the number; then a receipt and Write another; prevented, the draft stays", async () => {
    const el = await make();
    el.addEventListener("tc-send", (e) => e.preventDefault(), { once: true });
    button(el, "Send").click();
    await settle();
    expect(el.status).toBe("draft");
    const seen: MessageSend[] = [];
    el.addEventListener("tc-send", (e) => seen.push((e as CustomEvent<MessageSend>).detail));
    tabs(el)[1].click();
    await settle();
    button(el, "Send").click();
    await settle();
    expect(seen).toEqual([{ variant: "brief", text: VARIANTS[1].text, to: "+1 555 0142" }]);
    expect(el.status).toBe("sent");
    expect(text(el.querySelector(".ui-mdr__sent-head"))).toBe("Sent to Sam Okafor");
    expect(text(el.querySelector(".ui-mdr__bubble"))).toBe(VARIANTS[1].text);
    expect(document.activeElement).toBe(el.querySelector(".ui-mdr__another"));
    button(el, "Write another").click();
    await settle();
    expect(el.status).toBe("draft");
    expect(document.activeElement).toBe(area(el));
  });

  test("Open in Messages is opt-in, an sms: link; one variant has no tabs; more than four are left out", async () => {
    const el = await make();
    expect(el.querySelector("a.ui-mdr__btn")).toBeNull();
    el.openLink = true;
    await settle();
    expect(el.querySelector("a.ui-mdr__btn")!.getAttribute("href")).toBe(smsHref("+1 555 0142", VARIANTS[0].text));
    const one = await make("standard", [VARIANTS[0]]);
    expect(one.querySelector('[role="tablist"]')).toBeNull();
    expect(one.querySelector(".ui-mdr__panel")!.getAttribute("role")).toBe("group");
    const many = await make("standard", [...VARIANTS, { id: "d", tone: "Warm", text: "d" }, { id: "e", tone: "Extra", text: "e" }]);
    expect(tabs(many)).toHaveLength(4);
    const none = await make("standard", []);
    expect(text(none.querySelector(".ui-mdr__none"))).toBe("Write a message to send.");
  });

  test("React wrapper: uncontrolled edits survive re-renders; a controlled selection stays until the parent changes it", async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const sends: MessageSend[] = [];
    let bump = () => {};
    function App() {
      const [n, setN] = React.useState(0);
      bump = () => setN((x) => x + 1);
      return React.createElement(MessageDrafts, {
        title: "Text Sam",
        defaultVariants: [...VARIANTS],
        onSend: (s: MessageSend) => {
          sends.push(s);
          return false;
        },
        "data-n": n,
      } as React.ComponentProps<typeof MessageDrafts>);
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector("tc-message-drafts")!;
    expect(text(el.querySelector(".tc-head__title"))).toBe("Text Sam");
    await type(el, "Edited");
    await act(async () => bump());
    await settle();
    expect(area(el).value).toBe("Edited");
    button(el, "Send").click();
    await settle();
    expect(sends.map((s) => s.text)).toEqual(["Edited"]);
    expect(el.getAttribute("status")).toBe("draft");
    await act(async () => root.render(React.createElement(MessageDrafts, { variants: VARIANTS, selected: "brief" })));
    await settle();
    const held = host.querySelector("tc-message-drafts")!;
    tabs(held)[2].click();
    await settle();
    expect(area(held).value).toBe(VARIANTS[1].text);
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const) {
    test(`axe (${theme}): no violations in either look`, async () => {
      const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base)">
        <tc-message-drafts recipient="Sam Okafor" to="+1 555 0142" open-link .variants=${VARIANTS}></tc-message-drafts>
        <tc-message-drafts look="clean" recipient="Sam Okafor" .variants=${[{ id: "x", tone: "Long", text: "a".repeat(170) }]}></tc-message-drafts>
        <tc-message-drafts look="clean" status="sent" recipient="Sam Okafor" .variants=${VARIANTS}></tc-message-drafts>
      </div>`);
      await finish(wrap);
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
  }
});
