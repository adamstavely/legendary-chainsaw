/*
 * <tc-message-actions> and <tc-message-text> in real browsers – the React component's contract and regression checks,
 * ported.
 */
import { html } from "lit";
import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/message-actions";
import { TcMessageActions, type MessageFeedbackDetail, type MessageReportDetail, type TcMessageText } from "../../src/elements/message-actions";
import { MessageActions } from "../../src/elements/react/message-actions";
import { cleanup, finish, fixture, settle } from "./helpers";

const g = globalThis as Record<string, unknown>;
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

/** A minimal speechSynthesis that records what it was asked to say */
const installSpeech = () => {
  const said: { text: string; onend: (() => void) | null }[] = [];
  stub(g, "SpeechSynthesisUtterance", class {
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(public text: string) {}
  });
  stub(window, "speechSynthesis", { speak: (u: { text: string; onend: (() => void) | null }) => said.push(u), cancel: () => {} });
  return said;
};

const btn = (root: ParentNode, name: string) => [...root.querySelectorAll<HTMLButtonElement>("button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent!.trim()) === name);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const warnings = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls.filter(([m]) => String(m).startsWith("MessageActions:"));

describe("tc-message-actions", () => {
  // Runs first: the warning is once per page, so a later test would find it already spent
  test("simulated read aloud: silent with demo, otherwise one warning", async () => {
    stub(window, "speechSynthesis", undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const a = await fixture<TcMessageActions>(html`<tc-message-actions text="Hello there" demo></tc-message-actions>`);
    btn(a, "Read aloud")!.click();
    await settle();
    expect(warnings(warn)).toHaveLength(0);
    expect(btn(a, "Stop reading")).toBeTruthy();
    const wrap = await fixture(html`<div><tc-message-actions text="Hello there"></tc-message-actions><tc-message-actions text="Hello there"></tc-message-actions></div>`);
    for (const b of [...wrap.querySelectorAll<HTMLButtonElement>('[aria-label="Read aloud"]')]) b.click();
    expect(warnings(warn)).toHaveLength(1);
  });

  test("the host is the root; the bar is a named group; quiet by default", async () => {
    const el = await fixture<TcMessageActions>(html`<tc-message-actions text="Hi" label="Reply actions"></tc-message-actions>`);
    expect(el.dataset.ui).toBe("ma");
    expect(el.dataset.look).toBe("standard");
    expect(el.hasAttribute("data-quiet")).toBe(true);
    const bar = el.querySelector(".ui-ma__bar")!;
    expect(bar.getAttribute("role")).toBe("group");
    expect(bar.getAttribute("aria-label")).toBe("Reply actions");
    const loud = await fixture<TcMessageActions>(html`<tc-message-actions quiet="false"></tc-message-actions>`);
    expect(loud.hasAttribute("data-quiet")).toBe(false);
    loud.look = "clean";
    await settle();
    expect(loud.querySelector('.ui-ma__glyph[viewBox="0 0 16 16"]')).toBeTruthy();
  });

  test("uncontrolled Read aloud uses the browser's speech synthesis and stops with it", async () => {
    const said = installSpeech();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const el = await fixture<TcMessageActions>(html`<tc-message-actions text="Hello there" speak-duration="200"></tc-message-actions>`);
    const playing: boolean[] = [];
    el.addEventListener("tc-speak", (e) => playing.push((e as CustomEvent<{ playing: boolean }>).detail.playing));
    btn(el, "Read aloud")!.click();
    await settle();
    expect(said.map((u) => u.text)).toEqual(["Hello there"]);
    // Not the estimated duration: it plays until the speech ends
    await wait(400);
    expect(btn(el, "Stop reading")).toBeTruthy();
    said[0].onend?.();
    await settle();
    expect(btn(el, "Read aloud")).toBeTruthy();
    expect(playing).toEqual([true]);
    expect(warnings(warn)).toHaveLength(0);
  });

  test("with its own speech the bar times read aloud and reports both ends", async () => {
    const said = installSpeech();
    const el = await fixture<TcMessageActions>(html`<tc-message-actions text="Hello there" own-speech speak-duration="150"></tc-message-actions>`);
    const playing: boolean[] = [];
    el.addEventListener("tc-speak", (e) => playing.push((e as CustomEvent<{ playing: boolean }>).detail.playing));
    btn(el, "Read aloud")!.click();
    await settle();
    expect(said).toHaveLength(0);
    expect(el.hasAttribute("data-active")).toBe(true);
    await expect.poll(() => playing, { timeout: 3000 }).toEqual([true, false]);
    await settle();
    expect(btn(el, "Read aloud")!.getAttribute("aria-pressed")).toBe("false");
    expect(el.querySelector(".ui-ma__sr")!.textContent).toBe("Finished reading");
  });

  test("Copied shows only after the clipboard write resolves", async () => {
    let resolve!: () => void;
    stub(navigator, "clipboard", { writeText: () => new Promise<void>((r) => (resolve = r)) });
    const el = await fixture<TcMessageActions>(html`<tc-message-actions text="Hello there"></tc-message-actions>`);
    const copied: unknown[] = [];
    el.addEventListener("tc-copy", (e) => copied.push((e as CustomEvent).detail));
    btn(el, "Copy message")!.click();
    await settle();
    expect(btn(el, "Copied")).toBeUndefined();
    expect(copied).toEqual([]);
    resolve();
    await settle();
    expect(btn(el, "Copied")).toBeTruthy();
    expect(el.querySelector(".ui-ma__btn--copy")!.hasAttribute("data-done")).toBe(true);
    expect(copied).toEqual([{ text: "Hello there" }]);
  });

  test("a failed clipboard write shows no Copied and fires no tc-copy", async () => {
    stub(navigator, "clipboard", { writeText: () => Promise.reject(new Error("denied")) });
    const el = await fixture<TcMessageActions>(html`<tc-message-actions text="Hello there"></tc-message-actions>`);
    let copied = 0;
    el.addEventListener("tc-copy", () => copied++);
    btn(el, "Copy message")!.click();
    await settle();
    await settle();
    expect(btn(el, "Copied")).toBeUndefined();
    expect(btn(el, "Couldn't copy")).toBeTruthy();
    expect(copied).toBe(0);
  });

  test("feedback is controllable: a thumb is reported, not applied, while set", async () => {
    const seen: unknown[] = [];
    const el = await fixture<TcMessageActions>(html`<tc-message-actions text="Hi" .feedback=${null} .onFeedback=${(k: unknown) => void seen.push(k)}></tc-message-actions>`);
    const events: MessageFeedbackDetail[] = [];
    el.addEventListener("tc-feedback", (e) => events.push((e as CustomEvent<MessageFeedbackDetail>).detail));
    btn(el, "Good response")!.click();
    await settle();
    expect(seen).toEqual(["up"]);
    expect(events).toEqual([{ feedback: "up" }]);
    expect(btn(el, "Good response")!.getAttribute("aria-pressed")).toBe("false");
    el.feedback = "up";
    await settle();
    expect(btn(el, "Good response")!.getAttribute("aria-pressed")).toBe("true");
  });

  test("uncontrolled feedback starts at defaultFeedback, and a new version starts it fresh", async () => {
    const el = await fixture<TcMessageActions>(html`<tc-message-actions text="Hi" .defaultFeedback=${"down"} .versions=${2}></tc-message-actions>`);
    expect(btn(el, "Bad response")!.getAttribute("aria-pressed")).toBe("true");
    el.versions = 3;
    await settle();
    expect(btn(el, "Bad response")!.getAttribute("aria-pressed")).toBe("false");
  });

  test("versions: a pick applies and reports; prevented it's reported only; a new version is shown", async () => {
    const el = await fixture<TcMessageActions>(html`<tc-message-actions text="Hi" .versions=${["a", "b", "c"]}></tc-message-actions>`);
    const count = () => el.querySelector(".ui-ma__count")!.getAttribute("aria-label");
    expect(count()).toBe("Version 3 of 3");
    const picks: number[] = [];
    el.addEventListener("tc-version-change", (e) => picks.push((e as CustomEvent<{ version: number }>).detail.version));
    btn(el, "Previous version")!.click();
    await settle();
    expect(count()).toBe("Version 2 of 3");
    const block = (e: Event) => e.preventDefault();
    el.addEventListener("tc-version-change", block);
    btn(el, "Previous version")!.click();
    await settle();
    expect(count()).toBe("Version 2 of 3");
    expect(picks).toEqual([1, 0]);
    el.removeEventListener("tc-version-change", block);
    el.versions = ["a", "b", "c", "d"];
    await settle();
    expect(count()).toBe("Version 4 of 4");
    // A set version is the page's
    el.version = 0;
    await settle();
    expect(count()).toBe("Version 1 of 4");
    // One version: the switcher is folded away and inert
    const one = await fixture<TcMessageActions>(html`<tc-message-actions></tc-message-actions>`);
    expect(one.querySelector<HTMLElement>(".ui-ma__versions")!.inert).toBe(true);
  });

  test("an async onRegenerate keeps the arrow busy until it settles, says so when it fails, and aborts on removal", async () => {
    let fail!: (e: Error) => void;
    let signal!: AbortSignal;
    let calls = 0;
    const onRegenerate = (o: { signal: AbortSignal }) => {
      calls++;
      signal = o.signal;
      return new Promise((_, reject) => (fail = reject));
    };
    const el = await fixture<TcMessageActions>(html`<tc-message-actions text="Hi" .onRegenerate=${onRegenerate}></tc-message-actions>`);
    const button = () => btn(el, "Regenerate response")!;
    button().click();
    await settle();
    expect(button().getAttribute("aria-busy")).toBe("true");
    button().click(); // ignored while pending
    expect(calls).toBe(1);
    fail(new Error("rate limited"));
    await settle();
    expect(button().hasAttribute("aria-busy")).toBe(false);
    expect(button().parentElement!.querySelector(".ui-ma__tip")!.textContent).toContain("Couldn't regenerate");
    button().click();
    el.remove();
    expect(signal.aborted).toBe(true);
  });

  test("an async feedback send shows Thanks only once it resolves, and can be retried after a rejection", async () => {
    const results = [Promise.reject(new Error("offline")), Promise.resolve()];
    results[0].catch(() => {});
    let calls = 0;
    const onFeedback = (_kind: unknown, reason?: string) => {
      calls++;
      return reason ? results.shift() : undefined;
    };
    const el = await fixture<TcMessageActions>(html`<tc-message-actions text="Hi" .onFeedback=${onFeedback}></tc-message-actions>`);
    btn(el, "Bad response")!.click();
    await settle();
    btn(el, "Too long")!.click();
    await settle();
    const send = () => el.querySelector<HTMLButtonElement>(".ui-ma__send")!;
    send().click();
    await settle();
    await settle();
    expect(send().hasAttribute("data-sent")).toBe(false);
    send().click();
    await settle();
    await settle();
    expect(send().hasAttribute("data-sent")).toBe(true);
    expect(calls).toBe(3);
  });

  test("the feedback row stays open while focus is inside it after sending, and closes once focus leaves (2.2.1)", async () => {
    const el = await fixture<TcMessageActions>(html`<tc-message-actions text="Hi"></tc-message-actions>`);
    btn(el, "Bad response")!.click();
    await settle();
    btn(el, "Too long")!.click();
    await settle();
    const send = el.querySelector<HTMLButtonElement>(".ui-ma__send")!;
    send.focus();
    send.click();
    await wait(1800);
    await settle();
    const fold = document.getElementById(btn(el, "Bad response")!.getAttribute("aria-controls")!)!;
    expect(fold.hasAttribute("data-open")).toBe(true);
    expect(fold.inert).toBe(false);
    btn(el, "Copy message")!.focus();
    await settle();
    expect(fold.hasAttribute("data-open")).toBe(false);
  });

  test("sending from the Other field moves focus to Send instead of <body> (2.4.3)", async () => {
    const el = await fixture<TcMessageActions>(html`<tc-message-actions text="Hi"></tc-message-actions>`);
    btn(el, "Bad response")!.click();
    await settle();
    btn(el, "Other")!.click();
    await settle();
    const field = el.querySelector<HTMLInputElement>('input[aria-label="What went wrong, in your words"]')!;
    field.focus();
    field.value = "Wrong API";
    field.dispatchEvent(new InputEvent("input", { bubbles: true }));
    let reason: string | undefined;
    el.addEventListener("tc-feedback", (e) => (reason = (e as CustomEvent<MessageFeedbackDetail>).detail.reason));
    field.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await settle();
    await settle();
    expect(reason).toBe("Wrong API");
    expect(document.activeElement).toBe(el.querySelector(".ui-ma__send"));
  });

  test("Esc in the feedback row closes it, with focus back on Bad response", async () => {
    const el = await fixture<TcMessageActions>(html`<tc-message-actions text="Hi"></tc-message-actions>`);
    btn(el, "Bad response")!.click();
    await settle();
    const chip = btn(el, "Too long")!;
    chip.focus();
    chip.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await settle();
    expect(btn(el, "Bad response")!.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(btn(el, "Bad response"));
  });

  test("stepping to the first version moves focus from the disabled ‹ to › (2.4.3)", async () => {
    const el = await fixture<TcMessageActions>(html`<tc-message-actions text="Hi" .versions=${2}></tc-message-actions>`);
    const prev = btn(el, "Previous version")!;
    prev.focus();
    prev.click();
    await settle();
    expect(prev.disabled).toBe(true);
    expect(document.activeElement).toBe(btn(el, "Next version"));
  });

  test("Esc hides the tooltips without moving focus; the next focus brings them back (1.4.13)", async () => {
    const el = await fixture<TcMessageActions>(html`<tc-message-actions text="Hi"></tc-message-actions>`);
    const copy = btn(el, "Copy message")!;
    copy.focus();
    copy.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await settle();
    expect(el.hasAttribute("data-hush")).toBe(true);
    expect(document.activeElement).toBe(copy);
    btn(el, "Regenerate response")!.focus();
    await settle();
    expect(el.hasAttribute("data-hush")).toBe(false);
    // Hoverable: the tips don't pass the pointer through
    expect(TcMessageActions.css).not.toMatch(/\.ui-ma__tip[^}]*pointer-events:\s*none/);
  });

  test("no faded bar, a focus style on the Other field, version arrows at least 24px wide (1.4.3, 2.4.7, 2.5.8)", () => {
    expect(TcMessageActions.css).not.toMatch(/data-quiet\][^{]*\.ui-ma__bar\s*\{\s*opacity:\s*0\.6/);
    expect(TcMessageActions.css).toMatch(/\.ui-ma__input:focus\s*\{\s*box-shadow:\s*var\(--tc-field-shadow-focus/);
    expect(TcMessageActions.css).toMatch(/\.ui-ma__step \{[^}]*width: 24px/);
  });

  test("axe: no violations in either look", async () => {
    const wrap = await fixture(html`<div>
      <tc-message-actions text="Hi" .versions=${3}></tc-message-actions>
      <tc-message-actions look="clean" label="Clean actions" text="Hi" .versions=${3}></tc-message-actions>
    </div>`);
    await Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished));
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
});

describe("tc-message-text", () => {
  test("the host is the root; attributes stay on it", async () => {
    const el = await fixture<TcMessageText>(html`<tc-message-text id="msg" class="mine" version="1" .content=${"Text"}></tc-message-text>`);
    expect(el.dataset.ui).toBe("ma-text");
    expect(el.id).toBe("msg");
    expect(el.classList.contains("mine")).toBe(true);
    expect(el.querySelector(".ui-ma-text__swap")!.textContent).toBe("Text");
    // The styles come with it
    expect(getComputedStyle(el).overflow).toBe("hidden");
  });

  test("a new version crossfades: the old content fades out underneath, then goes", async () => {
    const p = document.createElement("p");
    p.textContent = "First";
    const el = await fixture<TcMessageText>(html`<tc-message-text version="0" .content=${p}></tc-message-text>`);
    expect(el.querySelector(".ui-ma__swap-item p")!.textContent).toBe("First");
    expect(p.isConnected).toBe(false);
    p.textContent = "Second";
    el.version = 1;
    await settle();
    const items = [...el.querySelectorAll(".ui-ma__swap-item")];
    expect(items.map((i) => [i.hasAttribute("data-out"), i.textContent])).toEqual([
      [true, "First"],
      [false, "Second"],
    ]);
    expect(items[0].getAttribute("aria-hidden")).toBe("true");
    await expect.poll(() => el.querySelectorAll(".ui-ma__swap-item").length, { timeout: 3000 }).toBe(1);
  });

  test("changes inside the content element are followed", async () => {
    const p = document.createElement("p");
    p.textContent = "Draft";
    const el = await fixture<TcMessageText>(html`<tc-message-text .content=${p}></tc-message-text>`);
    p.textContent = "Final";
    await wait(0);
    await settle();
    expect(el.querySelector(".ui-ma__swap-item")!.textContent).toBe("Final");
  });
});

/* ---------- Report ---------- */

const reportBtn = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-ma__btn--report");
const reportFold = (el: Element) => el.querySelector<HTMLElement>(".ui-ma__report")!;
const pick = async (el: Element, reason: string) => {
  const radio = reportFold(el).querySelector<HTMLInputElement>(`input[value="${reason}"]`)!;
  radio.click();
  await settle();
};

for (const look of ["standard", "clean"] as const) {
  describe(`tc-message-actions (${look}) – report`, () => {
    test("off by default: no Report button or form", async () => {
      const el = await fixture<TcMessageActions>(html`<tc-message-actions look=${look} text="Hi" demo></tc-message-actions>`);
      expect(reportBtn(el)).toBeNull();
      expect(el.querySelector(".ui-ma__report")).toBeNull();
    });

    test("Report opens the form; Send waits for a reason and fires tc-report with the details; Undo withdraws it", async () => {
      const el = await fixture<TcMessageActions>(html`<tc-message-actions look=${look} text="Hi" demo reportable></tc-message-actions>`);
      const sent: MessageReportDetail[] = [];
      const undone: MessageReportDetail[] = [];
      el.addEventListener("tc-report", (e) => sent.push((e as CustomEvent<MessageReportDetail>).detail));
      el.addEventListener("tc-report-undo", (e) => undone.push((e as CustomEvent<MessageReportDetail>).detail));
      const button = reportBtn(el)!;
      expect(button.getAttribute("aria-label")).toBe("Report reply");
      expect(button.getAttribute("aria-expanded")).toBe("false");
      button.click();
      await settle();
      expect(button.getAttribute("aria-expanded")).toBe("true");
      expect(reportFold(el).hasAttribute("data-open")).toBe(true);
      await expect.poll(() => document.activeElement?.getAttribute("value")).toBe("harmful");
      const labels = [...reportFold(el).querySelectorAll(".ui-ma__reason")].map((l) => l.textContent!.trim());
      expect(labels).toEqual(["Harmful or dangerous", "Unsafe advice", "Shares private data", "Hateful or harassing", "Something else"]);
      const send = reportFold(el).querySelector<HTMLButtonElement>(".ui-ma__send")!;
      expect(send.disabled).toBe(true);
      await pick(el, "private-data");
      const details = reportFold(el).querySelector<HTMLTextAreaElement>("textarea")!;
      details.value = "  It shows a phone number  ";
      details.dispatchEvent(new InputEvent("input", { bubbles: true }));
      await settle();
      expect(send.disabled).toBe(false);
      send.click();
      await settle();
      expect(sent).toEqual([{ reason: "private-data", details: "It shows a phone number" }]);
      expect(reportFold(el).textContent).toMatch(/Reported – a reviewer will look at this/);
      expect(button.getAttribute("aria-label")).toBe("Reported");
      await expect.poll(() => document.activeElement?.className).toMatch(/ui-ma__undo/);
      expect(el.querySelector("[aria-live]")!.textContent).toMatch(/Reported – a reviewer will look at this/);
      reportFold(el).querySelector<HTMLButtonElement>(".ui-ma__undo")!.click();
      await settle();
      expect(undone).toEqual([{ reason: "private-data", details: "It shows a phone number" }]);
      expect(button.getAttribute("aria-label")).toBe("Report reply");
      expect(reportFold(el).hasAttribute("data-open")).toBe(false);
      expect(document.activeElement).toBe(button);
    });

    test("a prevented tc-report keeps the form open with nothing confirmed", async () => {
      const el = await fixture<TcMessageActions>(html`<tc-message-actions look=${look} text="Hi" demo reportable></tc-message-actions>`);
      el.addEventListener("tc-report", (e) => e.preventDefault());
      reportBtn(el)!.click();
      await settle();
      await pick(el, "harmful");
      reportFold(el).querySelector<HTMLButtonElement>(".ui-ma__send")!.click();
      await settle();
      expect(reportFold(el).querySelector("form")).not.toBeNull();
      expect(reportBtn(el)!.getAttribute("aria-label")).toBe("Report reply");
    });

    test("Escape closes the form and returns focus to Report; opening it closes the feedback row", async () => {
      const el = await fixture<TcMessageActions>(html`<tc-message-actions look=${look} text="Hi" demo reportable></tc-message-actions>`);
      btn(el, "Bad response")!.click();
      await settle();
      expect(btn(el, "Bad response")!.getAttribute("aria-expanded")).toBe("true");
      reportBtn(el)!.click();
      await settle();
      expect(btn(el, "Bad response")!.getAttribute("aria-expanded")).toBe("false");
      await expect.poll(() => reportFold(el).contains(document.activeElement)).toBe(true);
      document.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
      await settle();
      expect(reportFold(el).hasAttribute("data-open")).toBe(false);
      expect(document.activeElement).toBe(reportBtn(el));
    });

    test("after the Undo window the flag stays Reported, and renamed labels show", async () => {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      try {
        const el = await fixture<TcMessageActions>(html`<tc-message-actions look=${look} text="Hi" demo reportable .reportLabels=${{ other: "Another problem" }}></tc-message-actions>`);
        reportBtn(el)!.click();
        await settle();
        expect(reportFold(el).textContent).toMatch(/Another problem/);
        await pick(el, "other");
        reportFold(el).querySelector<HTMLButtonElement>(".ui-ma__send")!.click();
        await settle();
        // Focus moves off Undo, so the timer may end it
        reportBtn(el)!.focus();
        vi.advanceTimersByTime(6100);
        await settle();
        expect(reportFold(el).hasAttribute("data-open")).toBe(false);
        expect(reportBtn(el)!.getAttribute("aria-label")).toBe("Reported");
        expect(reportBtn(el)!.hasAttribute("aria-expanded")).toBe(false);
        reportBtn(el)!.click();
        await settle();
        expect(reportFold(el).hasAttribute("data-open")).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });
  });
}

test("React: onReport hears the report, and returning false keeps the form", async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const seen: string[] = [];
  let refuse = true;
  await act(async () =>
    root.render(
      React.createElement(MessageActions, {
        text: "Hi",
        demo: true,
        reportable: true,
        onReport: (r) => {
          seen.push(r.reason);
          return refuse ? false : undefined;
        },
        onReportUndo: (r) => void seen.push(`undo ${r.reason}`),
      }),
    ),
  );
  await settle();
  const el = host.querySelector("tc-message-actions")!;
  reportBtn(el)!.click();
  await settle();
  await pick(el, "hateful");
  const send = () => reportFold(el).querySelector<HTMLButtonElement>(".ui-ma__send")!.click();
  send();
  await settle();
  expect(reportFold(el).querySelector("form")).not.toBeNull();
  refuse = false;
  send();
  await settle();
  reportFold(el).querySelector<HTMLButtonElement>(".ui-ma__undo")!.click();
  await settle();
  expect(seen).toEqual(["hateful", "hateful", "undo hateful"]);
  await act(async () => root.unmount());
  host.remove();
});

for (const theme of ["light", "dark"] as const) {
  test(`axe (${theme}): the report form and its confirmation in both looks`, async () => {
    const wrap = await fixture(html`<div data-tc-theme=${theme} style="padding: 16px; background: var(--tc-surface-base); display: grid; gap: 16px">
      <tc-message-actions text="Hi" demo reportable label="Actions for answer 1"></tc-message-actions>
      <tc-message-actions look="clean" text="Hi" demo reportable label="Actions for answer 2"></tc-message-actions>
      <tc-message-actions text="Hi" demo reportable label="Actions for answer 3"></tc-message-actions>
    </div>`);
    const [a, b, c] = [...wrap.querySelectorAll("tc-message-actions")];
    for (const el of [a, b, c]) {
      reportBtn(el)!.click();
      await settle();
    }
    await pick(c, "harmful");
    reportFold(c).querySelector<HTMLButtonElement>(".ui-ma__send")!.click();
    await settle();
    await finish(wrap);
    const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
    expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
  });
}
