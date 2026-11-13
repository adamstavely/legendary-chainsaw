/*
 * <tc-embed-widget> in real browsers: the launcher and the non-modal panel (focus in on open, Escape back to the
 * launcher), the unread count, sending by Enter, Send and starters (cancelable), messages from each kind of author,
 * typing, the theme (accent, readable text on it, radius, side), floating, the contrast helpers, the React wrapper,
 * and axe in both looks and both themes.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/embed-widget";
import { embedAccentText, embedContrast, parseEmbedHex, type EmbedMessage, type EmbedSend, type EmbedStarter, type TcEmbedWidget } from "../../src/elements/embed-widget";
import { EmbedWidget } from "../../src/elements/react/embed-widget";
import { cleanup, finish, fixture, pageStyles, settle } from "./helpers";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const starters: EmbedStarter[] = [
  { id: "hours", text: "When is the reading room open?" },
  { id: "data", text: "How do I request a dataset?", label: "Request a dataset" },
];
const messages: EmbedMessage[] = [
  { id: "1", from: "visitor", text: "Can someone check DR-2291?" },
  { id: "2", from: "assistant", text: "Let me find someone for you." },
  { id: "3", from: "handoff", text: "Priya from the data desk joined" },
  { id: "4", from: "human", name: "Priya · Data desk", text: "It was approved this morning." },
];

const launcher = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-emw__launcher")!;
const panel = (el: Element) => el.querySelector<HTMLElement>(".ui-emw__panel")!;
const field = (el: Element) => el.querySelector<HTMLTextAreaElement>(".ui-emw__field")!;
const press = (target: Element, key: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }));

async function make(extra: { look?: string; open?: boolean; msgs?: EmbedMessage[] } = {}) {
  return fixture<TcEmbedWidget>(
    html`<tc-embed-widget
      look=${extra.look ?? "standard"}
      heading="Ask the Institute"
      greeting="Hi! How can I help?"
      ?open=${extra.open ?? false}
      .starters=${starters}
      .messages=${extra.msgs ?? []}
    ></tc-embed-widget>`,
  );
}

async function type(el: TcEmbedWidget, text: string) {
  const f = field(el);
  f.value = text;
  f.dispatchEvent(new Event("input", { bubbles: true }));
  await el.updateComplete;
}

describe("tc-embed-widget", () => {
  test("the host is the root in either look; a launcher that controls a hidden, non-modal dialog named by the agent", async () => {
    for (const look of ["standard", "clean"]) {
      const el = await make({ look });
      expect(el.dataset.ui).toBe("emw");
      expect(el.dataset.look).toBe(look);
      const btn = launcher(el);
      expect(btn.textContent).toContain("Chat with us");
      expect(btn.getAttribute("aria-expanded")).toBe("false");
      expect(btn.getAttribute("aria-controls")).toBe(panel(el).id);
      expect(panel(el).hidden).toBe(true);
      expect(panel(el).getAttribute("role")).toBe("dialog");
      expect(panel(el).getAttribute("aria-modal")).toBe("false");
      expect(document.getElementById(panel(el).getAttribute("aria-labelledby")!)!.textContent).toBe("Ask the Institute");
    }
  });

  test("the launcher opens the panel and moves focus to the field; Escape closes it and focuses the launcher", async () => {
    const el = await make();
    const changes: boolean[] = [];
    el.addEventListener("tc-open-change", (e) => changes.push((e as CustomEvent).detail.open));
    launcher(el).click();
    await settle();
    expect(el.open).toBe(true);
    expect(panel(el).hidden).toBe(false);
    expect(launcher(el).getAttribute("aria-expanded")).toBe("true");
    await expect.poll(() => document.activeElement).toBe(field(el));
    press(field(el), "Escape");
    await settle();
    expect(el.open).toBe(false);
    await expect.poll(() => document.activeElement).toBe(launcher(el));
    expect(changes).toEqual([true, false]);
  });

  test("Close in the header closes; tc-open-change is cancelable", async () => {
    const el = await make({ open: true });
    el.querySelector<HTMLButtonElement>(".ui-emw__close")!.click();
    await settle();
    expect(el.open).toBe(false);
    el.addEventListener("tc-open-change", (e) => e.preventDefault());
    launcher(el).click();
    await settle();
    expect(el.open).toBe(false);
    expect(panel(el).hidden).toBe(true);
  });

  test("the unread count shows on the launcher while closed, in its name too", async () => {
    const el = await make();
    el.unread = 3;
    await settle();
    expect(el.querySelector(".ui-emw__badge")!.textContent).toBe("3");
    expect(launcher(el).querySelector(".ui-emw__badge")!.getAttribute("aria-hidden")).toBe("true");
    expect(launcher(el).querySelector(".ui-emw__sr")!.textContent).toBe(", 3 new messages");
    el.open = true;
    await settle();
    expect(el.querySelector(".ui-emw__badge")).toBeNull();
    el.open = false;
    el.unread = 140;
    await settle();
    expect(el.querySelector(".ui-emw__badge")!.textContent).toBe("99+");
  });

  test("Enter sends the trimmed text and clears the field; Shift+Enter doesn't send; empty text doesn't send", async () => {
    const el = await make({ open: true });
    const sent: EmbedSend[] = [];
    el.addEventListener("tc-send", (e) => sent.push((e as CustomEvent<EmbedSend>).detail));
    press(field(el), "Enter");
    expect(sent).toEqual([]);
    expect(el.querySelector(".ui-emw__send")!.getAttribute("aria-disabled")).toBe("true");
    await type(el, "  Hello there  ");
    expect(el.querySelector(".ui-emw__send")!.getAttribute("aria-disabled")).toBe("false");
    press(field(el), "Enter", { shiftKey: true });
    expect(sent).toEqual([]);
    press(field(el), "Enter");
    await settle();
    expect(sent).toEqual([{ text: "Hello there", starter: null }]);
    expect(field(el).value).toBe("");
  });

  test("Send submits; a prevented tc-send keeps the text in the field", async () => {
    const el = await make({ open: true });
    el.addEventListener("tc-send", (e) => e.preventDefault());
    await type(el, "Keep me");
    el.querySelector<HTMLButtonElement>(".ui-emw__send")!.click();
    await settle();
    expect(field(el).value).toBe("Keep me");
  });

  test("starters show until the visitor has written, and send their text with the starter", async () => {
    const el = await make({ open: true });
    const buttons = [...el.querySelectorAll<HTMLButtonElement>(".ui-emw__starter")];
    expect(buttons.map((b) => b.textContent)).toEqual(["When is the reading room open?", "Request a dataset"]);
    expect(el.querySelector(".ui-emw__starters")!.getAttribute("aria-label")).toBe("Suggested questions");
    const sent: EmbedSend[] = [];
    el.addEventListener("tc-send", (e) => sent.push((e as CustomEvent<EmbedSend>).detail));
    buttons[1].click();
    expect(sent).toEqual([{ text: "How do I request a dataset?", starter: starters[1] }]);
    el.messages = [{ id: "v", from: "visitor", text: "How do I request a dataset?" }];
    await settle();
    expect(el.querySelector(".ui-emw__starters")).toBeNull();
  });

  test("the conversation is a log: the greeting, messages named by who wrote them, the handoff notice and typing", async () => {
    const el = await make({ open: true, msgs: messages });
    const log = el.querySelector(".ui-emw__log")!;
    expect(log.getAttribute("role")).toBe("log");
    expect(log.getAttribute("aria-label")).toBe("Conversation");
    const rows = [...log.querySelector("ol")!.children].map((li) => li.textContent!.replace(/\s+/g, " ").trim());
    expect(rows).toEqual([
      "Ask the Institute: Hi! How can I help?",
      "You: Can someone check DR-2291?",
      "Ask the Institute: Let me find someone for you.",
      "Priya from the data desk joined",
      "Priya · Data desk Priya · Data desk: It was approved this morning.",
    ]);
    expect(log.querySelector('[data-from="visitor"]')).toBeTruthy();
    expect(log.querySelector(".ui-emw__notice")).toBeTruthy();
    el.typing = true;
    await settle();
    expect(log.querySelector(".ui-emw__typing")!.textContent).toContain("Ask the Institute is typing");
    // The end stays in view
    expect(Math.abs(log.scrollTop + log.clientHeight - log.scrollHeight)).toBeLessThanOrEqual(2);
  });

  test("theme: title, greeting, launcher words, side, radius and a hex accent with readable text on it", async () => {
    const el = await make({ open: true });
    el.theme = { title: "Help desk", greeting: "Welcome!", launcherLabel: "Ask us", position: "left", radius: 6, accent: "#f5c542" };
    await settle();
    expect(el.querySelector(".ui-emw__name")!.textContent).toBe("Help desk");
    expect(el.querySelector(".ui-emw__log li")!.textContent).toContain("Welcome!");
    expect(launcher(el).textContent).toContain("Ask us");
    expect(el.dataset.side).toBe("left");
    expect(el.style.getPropertyValue("--tc-emw-accent")).toBe("#f5c542");
    expect(el.style.getPropertyValue("--tc-emw-on-accent")).toBe("var(--tc-gray-950)");
    expect(el.style.getPropertyValue("--tc-emw-radius")).toBe("6px");
    el.theme = { accent: "#0f766e", radius: 99 };
    await settle();
    expect(el.style.getPropertyValue("--tc-emw-on-accent")).toBe("var(--tc-text-on-accent)");
    expect(el.style.getPropertyValue("--tc-emw-radius")).toBe("24px");
    expect(el.dataset.side).toBe("right");
    // Not a hex colour: ignored, the library's accent stays
    el.theme = { accent: "red; background: url(x)" };
    await settle();
    expect(el.style.getPropertyValue("--tc-emw-accent")).toBe("");
  });

  test("floating pins it to the window's corner; otherwise it's in the flow", async () => {
    const el = await make();
    expect(getComputedStyle(el).position).toBe("static");
    el.floating = true;
    await settle();
    expect(getComputedStyle(el).position).toBe("fixed");
  });

  test("labels rename the words; the privacy link only for a safe URL", async () => {
    const el = await make({ open: true });
    el.labels = { launcher: "Help", placeholder: "Type here", send: "Go" };
    el.privacyHref = "javascript:alert(1)";
    await settle();
    expect(launcher(el).textContent).toContain("Help");
    expect(field(el).placeholder).toBe("Type here");
    expect(el.querySelector(".ui-emw__send")!.textContent).toBe("Go");
    expect(el.querySelector(".ui-emw__privacy a")).toBeNull();
    el.privacyHref = "https://institute.example.org/privacy";
    await settle();
    expect(el.querySelector(".ui-emw__privacy a")!.getAttribute("href")).toBe("https://institute.example.org/privacy");
    el.privacy = "";
    await settle();
    expect(el.querySelector(".ui-emw__privacy")).toBeNull();
  });

  test("contrast helpers: hex parsing, WCAG ratios, and the better text on an accent", () => {
    expect(parseEmbedHex("#abc")).toEqual([170, 187, 204]);
    expect(parseEmbedHex("0f766e")).toEqual([15, 118, 110]);
    expect(parseEmbedHex("red")).toBeNull();
    expect(embedContrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(embedContrast("#777777", "#777777")).toBeCloseTo(1, 5);
    expect(embedAccentText("#0f766e")).toEqual({ text: "light", ratio: expect.closeTo(5.47, 1) });
    expect(embedAccentText("#f5c542")!.text).toBe("dark");
    expect(embedAccentText("nope")).toBeNull();
  });

  test("React wrapper: uncontrolled open survives a re-render; controlled open stays until the parent changes it; onSend", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const onSend = vi.fn((_text: string) => false as const);
    function App() {
      const [n, setN] = React.useState(0);
      return React.createElement(
        "div",
        null,
        React.createElement("button", { id: "rr", onClick: () => setN(n + 1) }, `re-render ${n}`),
        React.createElement(EmbedWidget, { id: "u", title: "Help desk", starters, onSend }),
        React.createElement(EmbedWidget, { id: "c", open: false }),
      );
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const u = host.querySelector<TcEmbedWidget>("#u")!;
    const c = host.querySelector<TcEmbedWidget>("#c")!;
    expect(u.heading).toBe("Help desk");
    await act(async () => launcher(u).click());
    await settle();
    expect(u.open).toBe(true);
    await act(async () => host.querySelector<HTMLButtonElement>("#rr")!.click());
    await settle();
    expect(u.open).toBe(true);
    await act(async () => launcher(c).click());
    await settle();
    expect(c.open).toBe(false);
    await type(u, "Hello");
    press(field(u), "Enter");
    await settle();
    expect(onSend).toHaveBeenCalledWith("Hello", null);
    expect(field(u).value).toBe("Hello");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const)
    for (const look of ["standard", "clean"] as const)
      test(`axe: no violations (${look}, ${theme})`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-tc-page data-tc-theme=${theme} style="padding: 8px">
          ${pageStyles}
          <tc-embed-widget look=${look} heading="Ask the Institute" greeting="Hi! How can I help?" open typing .starters=${starters} .messages=${messages.slice(1)} privacy-href="https://institute.example.org/privacy"></tc-embed-widget>
          <tc-embed-widget look=${look} heading="Help desk" unread="2" .theme=${{ accent: "#f5c542" }}></tc-embed-widget>
          <tc-embed-widget look=${look} heading="Help desk" open .theme=${{ accent: "#0f766e" }} .messages=${[messages[0]]}></tc-embed-widget>
        </div>`);
        await finish(wrap);
        const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
        expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ") + " " + n.failureSummary).join(", ")}`)).toEqual([]);
      });
});
