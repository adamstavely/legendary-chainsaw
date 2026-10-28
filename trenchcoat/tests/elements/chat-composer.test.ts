/*
 * <tc-chat-composer> in real browsers – the React component's contract and regression checks, ported. Timers run for
 * real, with a short loadMs.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import "../../src/elements/chat-composer";
import { TcChatComposer, type ChatDictationSession, type ChatModel, type ChatPageContext, type ChatSkill, type ChatSkillChange } from "../../src/elements/chat-composer";
import { cleanup, finish, fixture, settle } from "./helpers";
import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { ChatComposer, defaultModels } from "../../src/elements/react/chat-composer";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const button = (el: Element, name: string | RegExp) =>
  [...el.querySelectorAll<HTMLButtonElement>("button")].find((b) => {
    const n = (b.getAttribute("aria-label") ?? b.textContent!).replace(/\s+/g, " ").trim();
    return typeof name === "string" ? n === name : name.test(n);
  }) ?? null;
const message = (el: Element) => el.querySelector<HTMLTextAreaElement>("textarea")!;
const body = (el: Element) => el.querySelector<HTMLElement>("[data-apps]")!;
const type = (el: Element, text: string) => {
  const t = message(el);
  t.value = text;
  t.dispatchEvent(new InputEvent("input", { bubbles: true }));
};
const key = (target: Element, k: string, init: KeyboardEventInit = {}) => target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
const warnings = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls.filter(([m]) => String(m).startsWith("ChatComposer:"));
/** Waits until `check` passes (or fails after `ms`) */
const until = async (check: () => void, ms = 3000) => {
  const end = performance.now() + ms;
  for (;;) {
    try {
      check();
      return;
    } catch (e) {
      if (performance.now() > end) throw e;
      await sleep(30);
      await settle();
    }
  }
};

// Runs first: the warning is once per page, so a later test would find it already spent
test("simulations: silent with demo, otherwise one warning for the whole page", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const one = await fixture<TcChatComposer>(html`<tc-chat-composer demo load-ms="50"></tc-chat-composer>`);
  button(one, "Voice input")!.click();
  button(one, /Connect apps/)!.click();
  await sleep(100);
  expect(warnings(warn)).toHaveLength(0);
  cleanup();
  const wrap = await fixture(html`<div><tc-chat-composer load-ms="50"></tc-chat-composer><tc-chat-composer look="clean" load-ms="50"></tc-chat-composer></div>`);
  for (const el of wrap.querySelectorAll("tc-chat-composer")) {
    button(el, "Voice input")!.click();
    button(el, /Connect apps/)!.click();
  }
  await sleep(100);
  expect(warnings(warn)).toHaveLength(1);
});

for (const look of ["standard", "clean"] as const) {
  describe(`tc-chat-composer ${look}`, () => {
    test("the host is the root; the body is the composer region", async () => {
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo></tc-chat-composer>`);
      expect(el.dataset.ui).toBe("chat-composer");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector("section")!.getAttribute("aria-label")).toBe("Message composer");
      expect(message(el).getAttribute("aria-label")).toBe("Message");
      expect(el.querySelector('[aria-live="polite"]')!.textContent).toBe("");
    });

    test("with onDictate the mic shows what your speech-to-text heard, not a sample sentence", async () => {
      let session!: ChatDictationSession;
      const onDictate = vi.fn((s: ChatDictationSession) => {
        session = s;
        return new Promise<void>(() => {});
      });
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} .onDictate=${onDictate} dictation="Sample sentence nobody said"></tc-chat-composer>`);
      button(el, "Voice input")!.click();
      await sleep(20);
      session.onTranscript("hello world");
      await sleep(400);
      await settle();
      button(el, "Use recording")!.click();
      await settle();
      expect(message(el).value).toBe("hello world");
      expect(session.signal.aborted).toBe(true);
      expect(el.textContent).not.toMatch(/Sample sentence/);
    });

    test("without onDictate a sample transcript plays, and Use recording adds it to the message", async () => {
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo value="Note:" dictation="one two"></tc-chat-composer>`);
      button(el, "Voice input")!.click();
      await until(() => expect(el.querySelector(".ui-chat-composer__heard")!.textContent).toBe("one two"));
      expect(message(el).readOnly).toBe(true);
      button(el, "Use recording")!.click();
      await settle();
      expect(message(el).value).toBe("Note: one two");
      expect(message(el).readOnly).toBe(false);
    });

    test("a rejected onDictate ends the recording with an error and adds nothing", async () => {
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} .onDictate=${() => Promise.reject(new Error("no mic"))}></tc-chat-composer>`);
      button(el, "Voice input")!.click();
      await until(() => expect(el.querySelector('[role="alert"]')!.textContent).toMatch(/Dictation/));
      expect(message(el).value).toBe("");
      expect(message(el).readOnly).toBe(false);
    });

    test("Connect apps waits for onConnectApps and goes back with an error when it rejects", async () => {
      let reject!: (e: Error) => void;
      const events: string[] = [];
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} load-ms="50" .onConnectApps=${() => new Promise((_, r) => (reject = r))} @tc-connect-apps=${() => events.push("connect")}></tc-chat-composer>`);
      button(el, /Connect apps/)!.click();
      await sleep(300);
      await settle();
      // Long past loadMs, still loading: the timer alone doesn't decide
      expect(body(el).dataset.apps).toBe("loading");
      expect(events).toEqual(["connect"]);
      reject(new Error("oauth closed"));
      await until(() => expect(body(el).dataset.apps).toBe("idle"));
      expect(el.querySelector('[role="alert"]')!.textContent).toMatch(/couldn't be connected/);
    });

    test("Connect apps turns into Select a project once onConnectApps resolves, and hands it the focus (2.4.3)", async () => {
      const projects: unknown[] = [];
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} load-ms="50" .onConnectApps=${() => Promise.resolve()} @tc-select-project=${() => projects.push(1)}></tc-chat-composer>`);
      const connect = button(el, /Connect apps/)!;
      connect.focus();
      connect.click();
      await until(() => expect(body(el).dataset.apps).toBe("done"));
      await sleep(30);
      expect(document.activeElement?.textContent).toMatch(/Select a project/);
      (document.activeElement as HTMLElement).click();
      expect(projects).toHaveLength(1);
    });

    test("a rejected onRequestApproval grants nothing and says so", async () => {
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} load-ms="50" .onRequestApproval=${() => Promise.reject(new Error("denied"))}></tc-chat-composer>`);
      button(el, /^Request approval/)!.click();
      await until(() => expect(el.querySelector('[role="alert"]')?.textContent).toMatch(/Approval wasn't granted/));
      expect(body(el).dataset.approval).toBe("idle");
    });

    test("the message is controllable: value shows, typing is reported, a prevented change keeps value", async () => {
      const changes: string[] = [];
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo value="Hello"
        @tc-value-change=${(e: CustomEvent<{ value: string }>) => {
          e.preventDefault();
          changes.push(e.detail.value);
        }}></tc-chat-composer>`);
      expect(message(el).value).toBe("Hello");
      type(el, "Hello there");
      await settle();
      expect(changes).toEqual(["Hello there"]);
      expect(message(el).value).toBe("Hello");
      el.value = "Reset";
      await settle();
      expect(message(el).value).toBe("Reset");
    });

    test("uncontrolled, it keeps what's typed and still reports changes", async () => {
      const changes: string[] = [];
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo value="Draft" @tc-value-change=${(e: CustomEvent<{ value: string }>) => changes.push(e.detail.value)}></tc-chat-composer>`);
      type(el, "Draft 2");
      await settle();
      expect(message(el).value).toBe("Draft 2");
      expect(el.value).toBe("Draft 2");
      expect(changes).toEqual(["Draft 2"]);
    });

    test("an empty models list renders a disabled picker instead of crashing", async () => {
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo .models=${[]}></tc-chat-composer>`);
      const picker = button(el, /No model/)!;
      expect(picker.disabled).toBe(true);
    });

    test("the selected model follows the models list when the selected one disappears", async () => {
      const a: ChatModel = { id: "a", name: "Alpha", description: "" };
      const b: ChatModel = { id: "b", name: "Beta", description: "" };
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo model="b" .models=${[a, b]}></tc-chat-composer>`);
      expect(button(el, /Beta/)).toBeTruthy();
      el.models = [a];
      await settle();
      expect(button(el, /Alpha/)).toBeTruthy();
    });

    test("Enter sends; a sync onSend clears the message at once and tc-send carries it", async () => {
      const onSend = vi.fn();
      const sent: unknown[] = [];
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo value="  Hi  " .onSend=${onSend} @tc-send=${(e: CustomEvent) => sent.push(e.detail)}></tc-chat-composer>`);
      key(message(el), "Enter", { shiftKey: true });
      expect(onSend).not.toHaveBeenCalled();
      key(message(el), "Enter");
      await settle();
      expect(onSend).toHaveBeenCalledWith("Hi", { model: "auto", skill: null, args: "Hi" });
      expect(sent).toEqual([{ message: "Hi", model: "auto", skill: null, args: "Hi" }]);
      expect(message(el).value).toBe("");
      expect(el.querySelector('[aria-live="polite"]')!.textContent).toBe("Message sent.");
    });

    test("an async onSend keeps the message until it resolves, and keeps it with an error when it rejects", async () => {
      let settleSend!: { resolve: () => void; reject: (e: Error) => void };
      const onSend = vi.fn(() => new Promise<void>((resolve, reject) => (settleSend = { resolve, reject })));
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo value="Ship it" .onSend=${onSend}></tc-chat-composer>`);
      button(el, "Send message")!.click();
      await settle();
      expect(onSend).toHaveBeenCalledWith("Ship it", { model: "auto", skill: null, args: "Ship it" });
      expect(message(el).value).toBe("Ship it");
      expect(button(el, "Send message")!.disabled).toBe(true);
      settleSend.reject(new Error("offline"));
      await until(() => expect(el.querySelector('[role="alert"]')?.textContent).toMatch(/wasn't sent/));
      expect(message(el).value).toBe("Ship it");
      button(el, "Send message")!.click();
      settleSend.resolve();
      await until(() => expect(message(el).value).toBe(""));
    });

    test("the audio trace scrolls in the DOM: a new level is no re-render", async () => {
      const levels: ((level: number) => void)[] = [];
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} .onDictate=${(s: ChatDictationSession) => void levels.push(s.onLevel)}></tc-chat-composer>`);
      button(el, "Voice input")!.click();
      await sleep(20);
      await settle();
      const bars = () => [...el.querySelectorAll<HTMLElement>(".ui-chat-composer__trace > span")].map((b) => b.style.height);
      const silent = bars();
      let updates = 0;
      const update = el.requestUpdate.bind(el);
      el.requestUpdate = (...args: Parameters<typeof el.requestUpdate>) => {
        updates++;
        update(...args);
      };
      for (let i = 0; i < 20; i++) levels[0](i % 2 ? 1 : 0.5);
      expect(updates).toBe(0);
      expect(bars()).not.toEqual(silent);
      expect(bars()).toHaveLength(16);
    });

    test("the mic hands focus to Discard recording, and Escape discards and returns to the message (2.4.3, 2.1.1)", async () => {
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo></tc-chat-composer>`);
      const mic = button(el, "Voice input")!;
      mic.focus();
      mic.click();
      await settle();
      await sleep(20);
      expect(document.activeElement).toBe(button(el, "Discard recording"));
      key(document.activeElement!, "Escape");
      await settle();
      expect(document.activeElement).toBe(message(el));
      expect(el.querySelector('[aria-live="polite"]')!.textContent).toBe("Recording discarded.");
    });

    test("the model menu: arrows open it on the selected model, Enter picks, Escape closes back to the button", async () => {
      const picks: unknown[] = [];
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo @tc-model-change=${(e: CustomEvent<{ model: string }>) => picks.push(e.detail.model)}></tc-chat-composer>`);
      const model = button(el, /Auto/)!;
      model.focus();
      key(model, "ArrowDown");
      const list = el.querySelector<HTMLElement>('[role="listbox"]')!;
      await until(() => expect(document.activeElement).toBe(list));
      expect(model.getAttribute("aria-expanded")).toBe("true");
      expect(el.querySelector(".ui-chat-composer__menu")!.getAttribute("data-open")).toBe("true");
      expect(document.getElementById(list.getAttribute("aria-activedescendant")!)!.textContent).toMatch(/Auto/);
      key(list, "ArrowDown");
      key(list, "Enter");
      await settle();
      expect(picks).toEqual(["claude"]);
      expect(text(model)).toMatch(/Claude/);
      expect(document.activeElement).toBe(model);
      expect(el.querySelector('[aria-live="polite"]')!.textContent).toBe("Claude selected.");
      key(model, "ArrowDown");
      await until(() => expect(document.activeElement).toBe(list));
      key(list, "Escape");
      await settle();
      expect(document.activeElement).toBe(model);
      expect(el.querySelector(".ui-chat-composer__menu")!.getAttribute("data-open")).toBe("false");
    });

    test("controlled model: a prevented pick is reported, not applied", async () => {
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo model="claude" @tc-model-change=${(e: Event) => e.preventDefault()}></tc-chat-composer>`);
      [...el.querySelectorAll<HTMLElement>('[role="option"]')][2].click();
      await settle();
      expect(text(button(el, /Claude/)!)).toMatch(/Claude/);
      el.model = "chatgpt";
      await settle();
      expect(el.querySelector(".ui-chat-composer__model-face")!.textContent!.trim().toLowerCase()).toBe("chatgpt");
    });

    test("Tab out of the model list goes on from the model button, not from <body> (2.4.3)", async () => {
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo></tc-chat-composer>`);
      const model = button(el, /Auto/)!;
      model.focus();
      key(model, "ArrowDown");
      const list = el.querySelector<HTMLElement>('[role="listbox"]')!;
      await until(() => expect(document.activeElement).toBe(list));
      key(list, "Tab");
      await settle();
      expect(document.activeElement).toBe(model);
    });

    test("a press outside closes the menu", async () => {
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo></tc-chat-composer>`);
      button(el, /Auto/)!.click();
      await until(() => expect(el.querySelector(".ui-chat-composer__menu")!.getAttribute("data-open")).toBe("true"));
      document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      await settle();
      expect(el.querySelector(".ui-chat-composer__menu")!.getAttribute("data-open")).toBe("false");
    });

    test("the words heard so far describe Use recording (the on-screen draft is aria-hidden)", async () => {
      let session!: ChatDictationSession;
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} .onDictate=${(s: ChatDictationSession) => void (session = s)}></tc-chat-composer>`);
      button(el, "Voice input")!.click();
      await sleep(20);
      session.onTranscript("hello there");
      await settle();
      const use = button(el, "Use recording")!;
      expect(document.getElementById(use.getAttribute("aria-describedby")!)?.textContent).toBe("Heard so far: hello there");
      expect(el.querySelector(".ui-chat-composer__draft")!.getAttribute("aria-hidden")).toBe("true");
    });

    test("the plus button fires tc-attach; a model logo element is cloned", async () => {
      const logo = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      logo.setAttribute("data-mine", "");
      const attached: unknown[] = [];
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo .models=${[{ id: "x", name: "Xeno", description: "Mine", logo }]} @tc-attach=${() => attached.push(1)}></tc-chat-composer>`);
      button(el, "Add attachment")!.click();
      expect(attached).toHaveLength(1);
      expect(el.querySelector(".ui-chat-composer__model-logo svg[data-mine]")).toBeTruthy();
      expect(el.querySelector(".ui-chat-composer__option-logo svg[data-mine]")).toBeTruthy();
      expect(logo.isConnected).toBe(false);
    });

    test("removed while recording, it stops the dictation and its timers", async () => {
      let signal: AbortSignal | undefined;
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} .onDictate=${(s: ChatDictationSession) => void (signal = s.signal)}></tc-chat-composer>`);
      button(el, "Voice input")!.click();
      await sleep(20);
      el.remove();
      expect(signal?.aborted).toBe(true);
    });
  });
}

const text = (el: Element) => el.textContent!.replace(/\s+/g, " ").trim();

test("styles: --u is clamped to the type floor in rem; placeholder token; the card shows the focus ring while typing", () => {
  const sheet = TcChatComposer.css;
  expect(sheet).toMatch(/--u: clamp\(calc\(0\.8125rem \/ 59\.428\)/);
  expect(sheet).not.toMatch(/::placeholder\s*{[^}]*--tc-text-disabled/);
  expect(sheet).toMatch(/:has\(\.ui-chat-composer__message:focus-visible\)\s*{[^}]*outline: var\(--tc-focus-outline/);
  expect(sheet).toMatch(/\.ui-chat-composer__menu-panel:focus-visible \.ui-chat-composer__menu-fill\s*{[^}]*box-shadow: inset/);
  expect(sheet).not.toMatch(/@keyframes ui-chat-composer-sweep\s*{[^@]*background-position/);
});

test("moved to another place in the page, it watches its model button again", async () => {
  const el = await fixture<TcChatComposer>(html`<tc-chat-composer demo></tc-chat-composer>`);
  const own = el as unknown as { ro?: ResizeObserver; modelWidth: number };
  await expect.poll(() => !!own.ro).toBe(true);
  const other = document.createElement("div");
  document.body.append(other);
  try {
    other.append(el);
    await settle();
    await expect.poll(() => !!own.ro).toBe(true);
    // A size change after the move still reaches the model button's measure
    const button = el.querySelector<HTMLElement>(".ui-chat-composer__model")!;
    button.style.width = "160px";
    await expect.poll(() => own.modelWidth).toBeCloseTo(button.getBoundingClientRect().width, 0);
  } finally {
    other.remove();
  }
});

test("axe: no violations in either look", async () => {
  const wrap = await fixture(html`<div style="padding-top: 320px">
    <tc-chat-composer demo value="Hello"></tc-chat-composer>
    <tc-chat-composer look="clean" demo></tc-chat-composer>
  </div>`);
  await finish();
  const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
});

describe("tc-chat-composer: the opt-in mention picker and context tray (Part 3)", () => {
  const triggers = [{ char: "@", groups: [{ id: "people", label: "People", items: [{ id: "ana", label: "Ana Lima" }, { id: "ben", label: "Ben Ito" }] }] }];
  const items = [
    { id: "f", label: "billing.md", tokens: 1200, kind: "file" },
    { id: "m", label: "@Ana", tokens: 300, kind: "mention" },
  ];

  test("neither is there unless asked for", async () => {
    const el = await fixture<TcChatComposer>(html`<tc-chat-composer load-ms="40"></tc-chat-composer>`);
    expect(el.querySelector("tc-mention-picker")).toBeNull();
    expect(el.querySelector("tc-context-tray")).toBeNull();
  });

  test("mentions: the picker attaches to the message; @ opens it and a pick lands in the text", async () => {
    const el = await fixture<TcChatComposer>(html`<tc-chat-composer load-ms="40" .mentions=${triggers}></tc-chat-composer>`);
    await settle();
    const picker = el.querySelector("tc-mention-picker") as HTMLElement & { open: boolean; target: Element | null };
    expect(picker.target).toBe(message(el));
    const picked = vi.fn();
    el.addEventListener("tc-pick", (e) => picked((e as CustomEvent).detail.item.id));
    const t = message(el);
    t.focus();
    t.value = "Ask @";
    t.setSelectionRange(5, 5);
    t.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: "@" }));
    await settle();
    expect(picker.open).toBe(true);
    key(t, "Enter");
    await settle();
    expect(picked).toHaveBeenCalledWith("ana");
    expect(el.value).toContain("Ana Lima");
  });

  test("context: the tray shows the items; a removal is kept unless the page prevents it", async () => {
    const el = await fixture<TcChatComposer>(html`<tc-chat-composer load-ms="40" context-limit="200000" .context=${items}></tc-chat-composer>`);
    const tray = el.querySelector("tc-context-tray")!;
    expect(tray.textContent).toContain("billing.md");
    button(tray, "Remove billing.md")!.click();
    await settle();
    await sleep(0);
    expect(el.context!.map((i) => i.id)).toEqual(["m"]);
    // Controlled: the page prevents, and the list stays as it gave it
    el.addEventListener("tc-items-change", (e) => e.preventDefault());
    button(tray, "Remove @Ana")!.click();
    await settle();
    await sleep(0);
    expect(el.context!.map((i) => i.id)).toEqual(["m"]);
  });
});

describe("tc-chat-composer: the toolbar row and the disclaimer (Part 6.3)", () => {
  const templates = [
    { id: "sum", title: "Summarise", body: "Summarise this page in three bullets." },
    { id: "ask", title: "Ask about", body: "What does {topic} mean here?", variables: { topic: { default: "churn" } } },
  ];
  const page = { title: "Q3 report", connected: true, count: 2, items: [{ id: "t", label: "Revenue table", tokens: 900 }, { id: "c", label: "Churn chart", tokens: 400 }] };
  const bar = (el: Element) => el.querySelector<HTMLElement>('[role="toolbar"]');
  const pop = (el: Element) => el.querySelector<HTMLElement>(".ui-chat-composer__pop");
  const chip = (el: Element) => el.querySelector<HTMLButtonElement>(".ui-chat-composer__page")!;

  for (const look of ["standard", "clean"] as const) {
    describe(look, () => {
      test("off by default: no toolbar, no disclaimer, the model switch stays in the card", async () => {
        const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo></tc-chat-composer>`);
        expect(bar(el)).toBeNull();
        expect(el.querySelector(".ui-chat-composer__disclaimer")).toBeNull();
        expect(message(el).hasAttribute("aria-describedby")).toBe(false);
        expect(el.querySelector(".ui-chat-composer__model")).toBeTruthy();
        expect(el.querySelector("tc-model-picker")).toBeNull();
      });

      test("disclaimer: one line under the composer that describes the message field", async () => {
        const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo disclaimer="AI can make mistakes. Check important info."></tc-chat-composer>`);
        const line = el.querySelector(".ui-chat-composer__disclaimer")!;
        expect(line.textContent).toBe("AI can make mistakes. Check important info.");
        expect(document.getElementById(message(el).getAttribute("aria-describedby")!)).toBe(line);
        expect(bar(el)).toBeNull();
      });

      test("model in the toolbar: model-picker's menu replaces the card's switch; tc-model-change is cancelable", async () => {
        const changes: string[] = [];
        const leaks: unknown[] = [];
        const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo model-switcher="toolbar"
          @tc-model-change=${(e: CustomEvent<{ model: string }>) => changes.push(e.detail.model)}
          @tc-value-change=${(e: CustomEvent) => leaks.push(e.detail)}></tc-chat-composer>`);
        expect(el.querySelector(".ui-chat-composer__model")).toBeNull();
        const picker = bar(el)!.querySelector("tc-model-picker")!;
        expect(picker.models.map((m) => m.id)).toEqual(["auto", "claude", "chatgpt"]);
        expect(picker.models[1].icon).toBeInstanceOf(SVGElement);
        expect(picker.value).toBe("auto");
        picker.querySelector<HTMLButtonElement>(".ui-mdp__trigger")!.click();
        await settle();
        picker.querySelectorAll<HTMLElement>('[role="option"]')[1].click();
        await settle();
        expect(changes).toEqual(["claude"]);
        expect(el.model).toBe("claude");
        expect(picker.value).toBe("claude");
        expect(leaks).toEqual([]);
        // Controlled: the page prevents, and the picker shows the model it was given
        el.addEventListener("tc-model-change", (e) => e.preventDefault());
        picker.querySelector<HTMLButtonElement>(".ui-mdp__trigger")!.click();
        await settle();
        picker.querySelectorAll<HTMLElement>('[role="option"]')[2].click();
        await settle();
        expect(el.model).toBe("claude");
        expect(picker.value).toBe("claude");
      });

      test("settings: a button opens model-settings in a popover; changes are tc-settings-change; Escape gives focus back", async () => {
        const seen: unknown[] = [];
        const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo .settings=${{ temperature: 0.4 }}
          .settingsModel=${{ id: "m", label: "Atlas", supports: ["temperature"] }}
          @tc-settings-change=${(e: CustomEvent) => seen.push(e.detail)}></tc-chat-composer>`);
        const open = button(el, "Model settings")!;
        expect(open.getAttribute("aria-haspopup")).toBe("dialog");
        expect(open.getAttribute("aria-expanded")).toBe("false");
        open.focus();
        open.click();
        await settle();
        const dialog = pop(el)!;
        expect(dialog.getAttribute("role")).toBe("dialog");
        expect(dialog.getAttribute("aria-label")).toBe("Model settings");
        expect(open.getAttribute("aria-expanded")).toBe("true");
        expect(dialog.contains(document.activeElement)).toBe(true);
        const settings = dialog.querySelector("tc-model-settings")!;
        expect(settings.value).toEqual({ temperature: 0.4 });
        const range = settings.querySelector<HTMLInputElement>('input[type="range"]')!;
        range.value = "1.2";
        range.dispatchEvent(new Event("input", { bubbles: true }));
        await settle();
        expect(seen).toEqual([{ value: { temperature: 1.2 }, changed: ["temperature"] }]);
        expect(el.settings).toEqual({ temperature: 1.2 });
        // Controlled
        el.addEventListener("tc-settings-change", (e) => e.preventDefault());
        range.value = "0.2";
        range.dispatchEvent(new Event("input", { bubbles: true }));
        await settle();
        expect(el.settings).toEqual({ temperature: 1.2 });
        key(document.activeElement!, "Escape");
        await settle();
        expect(pop(el)).toBeNull();
        expect(document.activeElement).toBe(open);
      });

      test("prompts: Use puts the prompt in at the caret, fires tc-prompt-pick and closes the popover", async () => {
        const picks: string[] = [];
        const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo value="Please: thanks" .prompts=${templates}
          @tc-prompt-pick=${(e: CustomEvent<{ prompt: string; template: { id: string } }>) => picks.push(`${e.detail.template.id}:${e.detail.prompt}`)}></tc-chat-composer>`);
        message(el).setSelectionRange(7, 7);
        const open = button(el, "Prompts")!;
        open.click();
        await settle();
        const library = pop(el)!.querySelector("tc-prompt-library")!;
        expect(library.templates).toHaveLength(2);
        button(library, /Use prompt/)!.click();
        await settle();
        expect(picks).toEqual(["sum:Summarise this page in three bullets."]);
        expect(el.value).toBe("Please: Summarise this page in three bullets. thanks");
        expect(pop(el)).toBeNull();
        expect(document.activeElement).toBe(message(el));
        expect(message(el).selectionStart).toBe("Please: Summarise this page in three bullets.".length);
      });

      test("prompts: preventing tc-prompt-pick leaves the message alone; the chosen template is kept between openings", async () => {
        const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo .prompts=${templates} @tc-prompt-pick=${(e: Event) => e.preventDefault()}></tc-chat-composer>`);
        button(el, "Prompts")!.click();
        await settle();
        let library = pop(el)!.querySelector("tc-prompt-library")!;
        const second = [...library.querySelectorAll<HTMLElement>('[role="option"], button')].find((b) => /Ask about/.test(b.textContent!))!;
        second.click();
        await settle();
        expect(library.value).toBe("ask");
        button(library, /Use prompt/)!.click();
        await settle();
        expect(el.value).toBe("");
        expect(pop(el)).toBeNull();
        button(el, "Prompts")!.click();
        await settle();
        library = pop(el)!.querySelector("tc-prompt-library")!;
        expect(library.value).toBe("ask");
      });

      test("page context: the chip says its state; toggling is a cancelable tc-page-context-change and is announced", async () => {
        const seen: string[] = [];
        const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo .pageContext=${page}
          @tc-page-context-change=${(e: CustomEvent<{ change: string }>) => seen.push(e.detail.change)}></tc-chat-composer>`);
        const c = chip(el);
        expect(c.getAttribute("aria-label")).toBe("Page context on: Q3 report, 2 items");
        expect(c.dataset.on).toBe("true");
        expect(document.getElementById(c.getAttribute("aria-describedby")!)!.textContent).toMatch(/can see this page/);
        c.click();
        await settle();
        expect(seen).toEqual(["disconnect"]);
        expect(el.pageContext!.connected).toBe(false);
        expect(c.getAttribute("aria-label")).toBe("Page context: Q3 report, off");
        expect(c.querySelector(".ui-chat-composer__page-meta")!.textContent).toBe("Off");
        expect(el.querySelector('[aria-live="polite"]')!.textContent).toBe("Page context off.");
        // Controlled: the page decides
        el.addEventListener("tc-page-context-change", (e) => e.preventDefault(), { once: true });
        c.click();
        await settle();
        expect(el.pageContext!.connected).toBe(false);
        c.click();
        await settle();
        expect(el.pageContext!.connected).toBe(true);
        expect(el.querySelector('[aria-live="polite"]')!.textContent).toBe("Page context on: Q3 report.");
      });

      test("page context: a token estimate when there's no count; the attached items show in a context tray", async () => {
        const seen: string[][] = [];
        const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo context-limit="200000" .pageContext=${{ ...page, count: undefined, tokens: 2400 }}
          @tc-page-context-change=${(e: CustomEvent<{ pageContext: { items: { id: string }[] } }>) => seen.push(e.detail.pageContext.items.map((i) => i.id))}
          @tc-items-change=${() => seen.push(["leaked"])}></tc-chat-composer>`);
        expect(chip(el).getAttribute("aria-label")).toBe("Page context on: Q3 report, 2.4k tokens");
        const show = button(el, "Show what's attached from the page (2)")!;
        show.click();
        await settle();
        const tray = pop(el)!.querySelector("tc-context-tray")!;
        expect(pop(el)!.getAttribute("aria-label")).toBe("Attached from Q3 report");
        expect(tray.textContent).toContain("Revenue table");
        button(tray, "Remove Revenue table")!.click();
        await settle();
        expect(seen).toEqual([["c"]]);
        expect(el.pageContext!.items!.map((i) => i.id)).toEqual(["c"]);
      });

      test("the row is one toolbar: one Tab stop, ← → Home End", async () => {
        const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo model-switcher="toolbar" .settings=${{}} .prompts=${templates} .pageContext=${page}></tc-chat-composer>`);
        const toolbar = bar(el)!;
        expect(toolbar.getAttribute("aria-label")).toBe("Message options");
        const items = [toolbar.querySelector<HTMLElement>(".ui-mdp__trigger")!, button(el, "Model settings")!, button(el, "Prompts")!, chip(el), button(el, /Show what's attached/)!];
        expect(items.map((b) => b.tabIndex)).toEqual([0, -1, -1, -1, -1]);
        items[0].focus();
        key(items[0], "ArrowRight");
        expect(document.activeElement).toBe(items[1]);
        key(items[1], "End");
        expect(document.activeElement).toBe(items[4]);
        key(items[4], "Home");
        expect(document.activeElement).toBe(items[0]);
        key(items[0], "ArrowLeft");
        expect(document.activeElement).toBe(items[4]);
        expect(items.map((b) => b.tabIndex)).toEqual([-1, -1, -1, -1, 0]);
      });

      test("wider than a side pane, the row keeps its labels while they fit and folds to icons when they don't", async () => {
        const wrap = await fixture<HTMLElement>(html`<div style="width: 900px"><tc-chat-composer look=${look} demo model-switcher="toolbar" .settings=${{}} .prompts=${templates} .pageContext=${page}></tc-chat-composer></div>`);
        const el = wrap.firstElementChild as TcChatComposer;
        const extras = el.querySelector<HTMLElement>(".ui-chat-composer__extras")!;
        const label = () => getComputedStyle(el.querySelector('[data-tool="prompts"] .ui-chat-composer__tool-label')!).position;
        await until(() => expect(extras.dataset.fold).toBe("0"));
        expect(label()).toBe("static");
        expect(text(chip(el))).toBe("Q3 report 2 items");
        wrap.style.width = "430px";
        await until(() => expect(extras.dataset.fold).toBe("1"));
        expect(label()).toBe("absolute");
        expect(button(el, "More")).toBeNull();
        wrap.style.width = "900px";
        await until(() => expect(extras.dataset.fold).toBe("0"));
      });

      test("in a 320px side pane the tools keep their icons and names; narrower, settings and prompts move into More", async () => {
        const wrap = await fixture<HTMLElement>(html`<div style="width: 320px"><tc-chat-composer look=${look} demo model-switcher="toolbar" .settings=${{}} .prompts=${templates} .pageContext=${page}></tc-chat-composer></div>`);
        const el = wrap.firstElementChild as TcChatComposer;
        const label = () => el.querySelector<HTMLElement>('[data-tool="prompts"] .ui-chat-composer__tool-label')!;
        await until(() => expect(getComputedStyle(label()).position).toBe("absolute"));
        expect(button(el, "Prompts")).toBeTruthy();
        expect(button(el, "Model settings")!.getBoundingClientRect().width).toBeLessThanOrEqual(32);
        expect(getComputedStyle(el.querySelector(".ui-mdp__name")!).position).toBe("absolute");
        expect(el.querySelector(".ui-mdp__trigger")!.textContent).toMatch(/Model:\s*Auto/);
        const toolbar = bar(el)!;
        expect(toolbar.scrollWidth).toBeLessThanOrEqual(toolbar.clientWidth + 1);
        expect(button(el, "More")).toBeNull();
        // A very narrow pane
        wrap.style.width = "190px";
        await until(() => expect(button(el, "More")).toBeTruthy());
        expect(button(el, "Prompts")).toBeNull();
        const more = button(el, "More")!;
        expect(more.getAttribute("aria-haspopup")).toBe("menu");
        more.click();
        await settle();
        const menu = pop(el)!;
        expect(menu.getAttribute("role")).toBe("menu");
        const entries = [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')];
        expect(entries.map(text)).toEqual(["Model settings", "Prompts"]);
        expect(document.activeElement).toBe(entries[0]);
        key(entries[0], "ArrowDown");
        expect(document.activeElement).toBe(entries[1]);
        entries[1].click();
        await settle();
        expect(pop(el)!.querySelector("tc-prompt-library")).toBeTruthy();
        expect(more.getAttribute("aria-expanded")).toBe("true");
        key(document.activeElement!, "Escape");
        await settle();
        expect(document.activeElement).toBe(more);
        // Room again: back out of More
        wrap.style.width = "600px";
        await until(() => expect(button(el, "Prompts")).toBeTruthy());
      });
    });
  }

  test("React: the toolbar props flow in and the callbacks fire", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: string[] = [];
    function App() {
      const [pc, setPc] = React.useState<ChatPageContext>(page);
      return React.createElement(ChatComposer, {
        demo: true,
        modelSwitcher: "toolbar",
        models: defaultModels,
        model: "chatgpt",
        onModelChange: (m: { id: string }) => calls.push(`model:${m.id}`),
        defaultSettings: { temperature: 0.5 },
        onSettingsChange: (s: Record<string, unknown>, changed: string[]) => calls.push(`settings:${changed.join()}:${s.temperature}`),
        prompts: templates,
        onPromptPick: (p: { template: { id: string } }) => calls.push(`prompt:${p.template.id}`),
        pageContext: pc,
        onPageContextChange: (next: ChatPageContext, change: string) => {
          calls.push(`page:${change}`);
          setPc(next);
        },
        disclaimer: "AI can make mistakes.",
      });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcChatComposer>("tc-chat-composer")!;
    expect(el.querySelector(".ui-chat-composer__disclaimer")!.textContent).toBe("AI can make mistakes.");
    const picker = el.querySelector("tc-model-picker")!;
    expect(picker.value).toBe("chatgpt");
    await act(async () => chip(el).click());
    await settle();
    expect(el.pageContext!.connected).toBe(false);
    expect(chip(el).getAttribute("aria-label")).toBe("Page context: Q3 report, off");
    // Controlled model: a pick is reported but the selection stays with the parent
    await act(async () => {
      picker.querySelector<HTMLButtonElement>(".ui-mdp__trigger")!.click();
    });
    await settle();
    await act(async () => picker.querySelectorAll<HTMLElement>('[role="option"]')[1].click());
    await settle();
    expect(el.model).toBe("chatgpt");
    await act(async () => button(el, "Model settings")!.click());
    await settle();
    const range = pop(el)!.querySelector<HTMLInputElement>('input[type="range"]')!;
    range.value = "0.9";
    await act(async () => void range.dispatchEvent(new Event("input", { bubbles: true })));
    await settle();
    expect(el.settings).toEqual({ temperature: 0.9 });
    key(document.activeElement!, "Escape");
    await settle();
    await act(async () => button(el, "Prompts")!.click());
    await settle();
    await act(async () => button(pop(el)!, /Use prompt/)!.click());
    await settle();
    expect(calls).toEqual(["page:disconnect", "model:claude", "settings:temperature:0.9", "prompt:sum"]);
    expect(el.value).toBe("Summarise this page in three bullets.");
    await act(async () => root.unmount());
  });

  test("React, controlled: fast typing keeps every keystroke and the caret (the page answers after the event)", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    let seen = "";
    let fill = (_: string) => {};
    function App() {
      const [v, setV] = React.useState("");
      seen = v;
      fill = setV;
      return React.createElement(ChatComposer, { value: v, onValueChange: setV });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const t = message(host);
    t.focus();
    await userEvent.keyboard("Should we ship?");
    await settle();
    expect(t.value).toBe("Should we ship?");
    expect(seen).toBe("Should we ship?");
    // Typing in the middle keeps the caret where it was
    t.setSelectionRange(6, 6);
    await userEvent.keyboard("n't");
    await settle();
    expect(t.value).toBe("Shouldn't we ship?");
    expect(t.selectionStart).toBe(9);
    // A starter filled in by the page replaces the text
    await act(async () => fill("Summarise "));
    await settle();
    expect(t.value).toBe("Summarise ");
    await act(async () => root.unmount());
  });

  test("React, controlled: a page that keeps value as it was gets it back; one that rewrites it shows its text", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    const calls: string[] = [];
    function App({ upper }: { upper: boolean }) {
      const [v, setV] = React.useState("Hi");
      return React.createElement(ChatComposer, { value: v, onValueChange: (x: string) => { calls.push(x); if (upper) setV(x.toUpperCase()); } });
    }
    await act(async () => root.render(React.createElement(App, { upper: false })));
    await settle();
    const t = message(host);
    t.focus();
    t.setSelectionRange(2, 2);
    await userEvent.keyboard("!");
    await settle();
    expect(calls).toEqual(["Hi!"]);
    expect(t.value).toBe("Hi");
    await act(async () => root.unmount());
    const host2 = document.createElement("div");
    document.body.append(host2);
    const root2 = createRoot(host2);
    await act(async () => root2.render(React.createElement(App, { upper: true })));
    await settle();
    const t2 = message(host2);
    t2.focus();
    t2.setSelectionRange(2, 2);
    await userEvent.keyboard("ya");
    await settle();
    expect(t2.value).toBe("HIYA");
    await act(async () => root2.unmount());
  });

  for (const look of ["standard", "clean"] as const)
    test(`${look}: hide-connect-apps, hide-project and hide-approval leave those buttons out`, async () => {
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo hide-approval></tc-chat-composer>`);
      expect(button(el, /Request approval/)).toBeNull();
      expect(button(el, /Connect apps/)).toBeTruthy();
      const full = body(el).getBoundingClientRect().height;
      // Without "Connect apps", "Select a project" is offered straight away
      el.hideConnectApps = true;
      await settle();
      expect(button(el, /Connect apps/)).toBeNull();
      const project = button(el, "Select a project")!;
      expect(project.inert).toBe(false);
      expect(body(el).dataset.rows).toBe("project");
      const picked: number[] = [];
      el.addEventListener("tc-select-project", () => picked.push(1));
      project.click();
      expect(picked).toEqual([1]);
      // Neither: no apps row at all
      el.hideProject = true;
      await settle();
      for (const a of el.getAnimations({ subtree: true })) a.finish();
      expect(button(el, "Select a project")).toBeNull();
      expect(el.querySelector(".ui-chat-composer__foot")).toBeNull();
      expect(body(el).getBoundingClientRect().height).toBeLessThan(full);
    });

  test("hide-project: once apps are connected the row folds away", async () => {
    for (const look of ["standard", "clean"] as const) {
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} load-ms="20" hide-project .onConnectApps=${() => Promise.resolve()}></tc-chat-composer>`);
      const before = body(el).getBoundingClientRect().height;
      button(el, /Connect apps/)!.click();
      await until(() => expect(body(el).dataset.apps).toBe("done"));
      await settle();
      for (const a of el.getAnimations({ subtree: true })) a.finish();
      expect(button(el, "Select a project")).toBeNull();
      expect(body(el).getBoundingClientRect().height).toBeLessThan(before);
    }
  });

  for (const theme of ["light", "dark"])
    test(`axe: the full toolbar, a popover open, in both looks (${theme})`, async () => {
      const wrap = await fixture<HTMLElement>(html`<div data-tc-theme=${theme} style="background: ${theme === "dark" ? "#0e0e10" : "#fff"}; padding: 360px 8px 8px; display: grid; gap: 16px; width: 380px">
        <tc-chat-composer demo model-switcher="toolbar" .settings=${{}} .prompts=${templates} .pageContext=${page} disclaimer="AI can make mistakes. Check important info."></tc-chat-composer>
        <tc-chat-composer look="clean" demo model-switcher="toolbar" .settings=${{}} .prompts=${templates} .pageContext=${{ ...page, connected: false }} disclaimer="AI can make mistakes. Check important info."></tc-chat-composer>
      </div>`);
      const [one] = wrap.querySelectorAll<TcChatComposer>("tc-chat-composer");
      button(one, "Prompts")!.click();
      await settle();
      await finish();
      const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
      expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    });
});

describe("tc-chat-composer: skills (Part 7.2)", () => {
  const SKILLS: ChatSkill[] = [
    { id: "translate", name: "translate", description: "Translate the message into another language", source: "Built-in", argumentHint: "<language>", keywords: "localise language" },
    { id: "summarize", name: "summarize", description: "Sum up the conversation so far", source: "Built-in" },
    { id: "thread", name: "thread-summary", description: "Post a summary of this thread to the team", source: "Your team" },
    { id: "review", name: "review-pr", description: "Review a pull request", source: "Your team", argumentHint: "<pr number>" },
    { id: "digest", name: "digest", description: "A weekly summary of what shipped", source: "Linear" },
  ];
  const picker = (el: Element) => el.querySelector<HTMLElement & { open: boolean; sync(): void }>("tc-mention-picker")!;
  const options = (el: Element) => [...el.querySelectorAll<HTMLElement>('tc-mention-picker [role="option"]')];
  const rows = (el: Element) => options(el).map((o) => o.querySelector(".ui-mnp__name")!.textContent);
  const labels = (el: Element) => [...el.querySelectorAll<HTMLElement>(".ui-mnp__label")].map((l) => l.textContent);
  const said = (el: Element) => el.querySelector('tc-mention-picker [role="status"]')!.textContent!.trim();
  const status = (el: Element) => el.querySelector('.ui-chat-composer__sr-only[aria-live="polite"]')!.textContent;
  /** Types at the caret, the way a user would: text, caret after it, an input event */
  const typeIn = async (el: Element, text: string) => {
    const t = message(el);
    t.focus();
    const at = t.selectionStart ?? t.value.length;
    t.setRangeText(text, at, t.selectionEnd ?? at, "end");
    t.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
    await settle();
  };
  const changes = (el: Element) => {
    const list: ChatSkillChange[] = [];
    el.addEventListener("tc-skill-change", (e) => list.push((e as CustomEvent<ChatSkillChange>).detail));
    return list;
  };
  const setup = async (look: "standard" | "clean", extra: Partial<TcChatComposer> = {}) => {
    const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo .skills=${SKILLS} placeholder="Ask anything…"></tc-chat-composer>`);
    Object.assign(el, extra);
    await settle();
    return el;
  };

  test("off unless skills are set: no / button, the placeholder as given, no picker", async () => {
    const el = await fixture<TcChatComposer>(html`<tc-chat-composer demo placeholder="Ask anything…"></tc-chat-composer>`);
    expect(button(el, "Use a skill")).toBeNull();
    expect(message(el).placeholder).toBe("Ask anything…");
    expect(el.querySelector("tc-mention-picker")).toBeNull();
  });

  for (const look of ["standard", "clean"] as const) {
    describe(look, () => {
      test("the message is the combobox; the placeholder mentions /; / at the start lists recent skills, then by source", async () => {
        const el = await setup(look, { recentSkills: ["review", "digest"] });
        const t = message(el);
        expect(t.placeholder).toBe("Ask anything · / for skills");
        expect(t.getAttribute("aria-autocomplete")).toBe("list");
        expect(button(el, "Use a skill")).toBeTruthy();
        await typeIn(el, "/");
        expect(picker(el).open).toBe(true);
        expect(document.getElementById(t.getAttribute("aria-controls")!)!.getAttribute("aria-label")).toBe("Skills");
        expect(labels(el)).toEqual(["Recent", "Built-in", "Your team"]);
        expect(rows(el)).toEqual(["/review-pr", "/digest", "/translate", "/summarize", "/thread-summary"]);
        // Each row: /name, and the description under it
        const first = options(el)[0];
        expect(first.hasAttribute("data-two")).toBe(true);
        expect(first.querySelector(".ui-mnp__desc")!.textContent).toBe("Review a pull request");
        expect(said(el)).toBe("5 skills");
        expect(document.getElementById(t.getAttribute("aria-activedescendant")!)!.textContent).toContain("/review-pr");
      });

      test("typing ranks one list across sources: name start, then a word's start, then the description – marked where it matched", async () => {
        const el = await setup(look);
        await typeIn(el, "/sum");
        expect(rows(el)).toEqual(["/summarize", "/thread-summary", "/digest"]);
        expect(labels(el)).toEqual([]);
        expect([...el.querySelectorAll(".ui-mnp__tag")].map((x) => x.textContent)).toEqual(["Built-in", "Your team", "Linear"]);
        const marks = options(el).flatMap((o) => [...o.querySelectorAll("mark")].map((m) => m.textContent));
        expect(marks).toEqual(["sum", "Sum", "sum", "sum", "sum"]);
        // The mark in "thread-summary" is on the word that matched
        expect(options(el)[1].querySelector(".ui-mnp__name mark")!.previousSibling!.textContent).toBe("thread-");
        // Keywords find a skill too
        await typeIn(el, " ");
        message(el).value = "";
        await typeIn(el, "/loc");
        expect(rows(el)).toEqual(["/translate"]);
        expect(said(el)).toBe("1 skill");
      });

      test("nothing matches: says so with a hint; Esc closes and leaves the text", async () => {
        const el = await setup(look);
        await typeIn(el, "/zzz");
        const empty = el.querySelector(".ui-mnp__empty")!;
        expect(empty.textContent).toContain("No skills match for “zzz”");
        expect(empty.querySelector(".ui-mnp__empty-hint")!.textContent).toBe("Try another word, or press Esc to type it as text");
        expect(said(el)).toBe("No skills match");
        key(message(el), "Escape");
        await settle();
        expect(picker(el).open).toBe(false);
        expect(el.value).toBe("/zzz");
      });

      test("a pick puts the token at the start with its argument hint; typing hides the hint; tc-skill-change says why", async () => {
        const el = await setup(look);
        const seen = changes(el);
        const mentioned = vi.fn();
        el.addEventListener("tc-pick", mentioned);
        await typeIn(el, "/tra");
        key(message(el), "Enter");
        await settle();
        expect(mentioned).not.toHaveBeenCalled();
        expect(el.value).toBe("/translate ");
        expect(el.skill).toBe("translate");
        expect(el.pickedSkill!.name).toBe("translate");
        expect(seen).toEqual([{ skill: SKILLS[0], previous: null, reason: "pick" }]);
        expect(message(el).selectionStart).toBe("/translate ".length);
        const mirror = el.querySelector(".ui-chat-composer__mirror")!;
        expect(mirror.getAttribute("aria-hidden")).toBe("true");
        expect(mirror.querySelector(".ui-chat-composer__token")!.textContent).toBe("/translate");
        expect(mirror.querySelector(".ui-chat-composer__arg")!.textContent).toBe("<language>");
        expect(status(el)).toBe("/translate added. Then type language.");
        // A screen reader hears the token and the hint with the message
        const note = document.getElementById(message(el).getAttribute("aria-describedby")!.split(" ")[0])!;
        expect(note.textContent).toBe("Skill /translate: Translate the message into another language. Type language.");
        await typeIn(el, "French");
        expect(el.querySelector(".ui-chat-composer__arg")).toBeNull();
        expect(note.isConnected && document.getElementById(note.id)!.textContent).toBe("Skill /translate: Translate the message into another language.");
        // The token and the text start at the same place: the tint sits under the slash
        const token = el.querySelector<HTMLElement>(".ui-chat-composer__token")!.getBoundingClientRect();
        const box = message(el).getBoundingClientRect();
        expect(Math.abs(token.left - box.left)).toBeLessThan(look === "clean" ? 2 : 8);
      });

      test("Backspace after the token removes it whole; Delete before it too; preventing keeps it", async () => {
        const el = await setup(look);
        const seen = changes(el);
        await typeIn(el, "/sum");
        key(message(el), "Enter");
        await settle();
        expect(el.value).toBe("/summarize ");
        key(message(el), "Backspace");
        await settle();
        expect(el.value).toBe("");
        expect(el.skill).toBe("");
        expect(seen.map((c) => c.reason)).toEqual(["pick", "remove"]);
        expect(status(el)).toBe("/summarize removed.");
        // Prevented: the token stays
        await typeIn(el, "/sum");
        key(message(el), "Enter");
        await settle();
        await typeIn(el, "this");
        el.addEventListener("tc-skill-change", (e) => e.preventDefault(), { once: true });
        message(el).setSelectionRange(0, 0);
        const del = new KeyboardEvent("keydown", { key: "Delete", bubbles: true, cancelable: true });
        message(el).dispatchEvent(del);
        await settle();
        expect(del.defaultPrevented).toBe(true);
        expect(el.value).toBe("/summarize this");
        expect(el.skill).toBe("summarize");
        message(el).setSelectionRange(0, 0);
        key(message(el), "Delete");
        await settle();
        expect(el.value).toBe("this");
        expect(el.skill).toBe("");
      });

      test("tc-send carries the skill and its arguments; the message keeps the token; sending clears the skill", async () => {
        const sent: unknown[] = [];
        const onSend = vi.fn();
        const el = await setup(look, { onSend });
        el.addEventListener("tc-send", (e) => sent.push((e as CustomEvent).detail));
        const seen = changes(el);
        await typeIn(el, "/tra");
        key(message(el), "Enter");
        await settle();
        await typeIn(el, "French  ");
        key(message(el), "Enter");
        await settle();
        expect(sent).toEqual([{ message: "/translate French", model: "auto", skill: { id: "translate", name: "translate" }, args: "French" }]);
        expect(onSend).toHaveBeenCalledWith("/translate French", { model: "auto", skill: { id: "translate", name: "translate" }, args: "French" });
        expect(el.value).toBe("");
        expect(el.skill).toBe("");
        expect(seen.map((c) => c.reason)).toEqual(["pick", "send"]);
      });

      test("a pick the page prevents leaves the text; the page can set the skill itself", async () => {
        const el = await setup(look);
        el.addEventListener("tc-skill-change", (e) => e.preventDefault(), { once: true });
        await typeIn(el, "/dig");
        key(message(el), "Enter");
        await settle();
        expect(el.value).toBe("/dig");
        expect(el.skill).toBe("");
        expect(picker(el).open).toBe(false);
        el.skill = "digest";
        await settle();
        expect(el.value).toBe("/digest ");
        expect(el.querySelector(".ui-chat-composer__token")!.textContent).toBe("/digest");
        // …and clear it
        el.skill = "";
        await settle();
        expect(el.value).toBe("");
      });

      test("one skill per message: / on a later line offers to replace it; / before the token too, and Esc puts it back", async () => {
        const el = await setup(look);
        const seen = changes(el);
        await typeIn(el, "/tra");
        key(message(el), "Enter");
        await settle();
        await typeIn(el, "German\n/");
        expect(picker(el).open).toBe(true);
        expect(el.querySelector(".ui-mnp__note")!.textContent).toBe("Picking one replaces /translate");
        expect(said(el)).toBe("5 skills. Picking one replaces /translate");
        await typeIn(el, "rev");
        key(message(el), "Enter");
        await settle();
        expect(el.value).toBe("/review-pr German\n");
        expect(seen.at(-1)).toMatchObject({ skill: { id: "review" }, previous: { id: "translate" }, reason: "replace" });
        expect(status(el)).toBe("/review-pr replaces /translate.");
        // "/" typed before the token: a "/" takes its place and the list opens; Esc brings the token back
        message(el).setSelectionRange(0, 0);
        const slash = new KeyboardEvent("keydown", { key: "/", bubbles: true, cancelable: true });
        message(el).dispatchEvent(slash);
        await settle();
        expect(slash.defaultPrevented).toBe(true);
        expect(el.value).toBe("/ German\n");
        expect(picker(el).open).toBe(true);
        expect(el.skill).toBe("review");
        key(message(el), "Escape");
        await settle();
        expect(el.value).toBe("/review-pr German\n");
        expect(el.skill).toBe("review");
        expect(seen).toHaveLength(2);
      });

      test("the / button puts a / at the start and opens the list; closing it takes the / away", async () => {
        const el = await setup(look);
        el.value = "hello there";
        await settle();
        button(el, "Use a skill")!.click();
        await settle();
        expect(el.value).toBe("/hello there");
        expect(document.activeElement).toBe(message(el));
        expect(picker(el).open).toBe(true);
        key(message(el), "Escape");
        await settle();
        expect(el.value).toBe("hello there");
        // A pick puts the token before the text
        button(el, "Use a skill")!.click();
        await settle();
        key(message(el), "ArrowDown");
        key(message(el), "Enter");
        await settle();
        expect(el.value).toBe("/summarize hello there");
        expect(el.skill).toBe("summarize");
      });

      test("recents: without recentSkills the composer remembers its picks, most recent first", async () => {
        const el = await setup(look);
        for (const q of ["dig", "rev"]) {
          await typeIn(el, `/${q}`);
          key(message(el), "Enter");
          await settle();
          key(message(el), "Backspace");
          await settle();
        }
        expect(el.value).toBe("");
        await typeIn(el, "/");
        expect(labels(el)[0]).toBe("Recent");
        expect(rows(el).slice(0, 2)).toEqual(["/review-pr", "/digest"]);
      });

      test("editing the token drops the skill; typing a skill's name in full makes it one", async () => {
        const el = await setup(look);
        const seen = changes(el);
        await typeIn(el, "/sum");
        key(message(el), "Enter");
        await settle();
        type(el, "/summarise this");
        await settle();
        expect(el.skill).toBe("");
        expect(el.querySelector(".ui-chat-composer__mirror")).toBeNull();
        type(el, "/digest now");
        await settle();
        expect(el.skill).toBe("digest");
        expect(seen.map((c) => [c.reason, c.skill?.id ?? null])).toEqual([
          ["pick", "summarize"],
          ["edit", null],
          ["edit", "digest"],
        ]);
      });

      test("typing inside the token lands after it", async () => {
        const el = await setup(look);
        await typeIn(el, "/sum");
        key(message(el), "Enter");
        await settle();
        message(el).setSelectionRange(3, 3);
        await userEvent.keyboard("x");
        await settle();
        expect(el.value).toBe("/summarize x");
        expect(el.skill).toBe("summarize");
      });

      test("async searchSkills: loading, results, a failure that ↵ retries", async () => {
        let fail = true;
        const resolvers: ((s: ChatSkill[]) => void)[] = [];
        const searchSkills = vi.fn((q: string) => {
          if (q === "x") return fail ? Promise.reject(new Error("offline")) : Promise.resolve([SKILLS[4]]);
          return new Promise<ChatSkill[]>((r) => resolvers.push(r));
        });
        const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo .searchSkills=${searchSkills}></tc-chat-composer>`);
        await settle();
        expect(button(el, "Use a skill")).toBeTruthy();
        await typeIn(el, "/t");
        expect(el.querySelector('.ui-mnp__empty[data-state="loading"]')).toBeTruthy();
        resolvers[0]([SKILLS[0], SKILLS[2]]);
        await settle();
        expect(rows(el)).toEqual(["/translate", "/thread-summary"]);
        key(message(el), "Enter");
        await settle();
        expect(el.value).toBe("/translate ");
        expect(el.pickedSkill!.argumentHint).toBe("<language>");
        key(message(el), "Backspace");
        await settle();
        await typeIn(el, "/x");
        await settle();
        expect(el.querySelector('.ui-mnp__empty[data-state="failed"]')!.textContent).toContain("Press ↵ to try again");
        fail = false;
        expect(key(message(el), "Enter")).toBe(false);
        await settle();
        await settle();
        expect(rows(el)).toEqual(["/digest"]);
      });

      test("@ mentions and / skills share one list", async () => {
        const mentions = [{ char: "@", label: "People", groups: [{ id: "p", label: "People", items: [{ id: "ana", label: "Ana Lima" }] }] }, { char: "/", groups: [] }];
        const el = await setup(look, { mentions });
        expect(el.querySelectorAll("tc-mention-picker")).toHaveLength(1);
        await typeIn(el, "/rev");
        key(message(el), "Enter");
        await settle();
        const picked = vi.fn();
        el.addEventListener("tc-pick", (e) => picked((e as CustomEvent).detail.token));
        await typeIn(el, "with @an");
        key(message(el), "Enter");
        await settle();
        expect(picked).toHaveBeenCalledWith("@Ana Lima");
        expect(el.value).toBe("/review-pr with @Ana Lima ");
        expect(el.skill).toBe("review");
      });

      test("hundreds of skills: the list shows the first 50 and says how many match", async () => {
        const many = Array.from({ length: 600 }, (_, i) => ({ id: `s${i}`, name: `skill-${i}`, description: `Does thing ${i}`, source: i % 2 ? "Odd" : "Even" }));
        const el = await setup(look, { skills: many });
        const t0 = performance.now();
        await typeIn(el, "/");
        expect(rows(el)).toHaveLength(50);
        expect(el.querySelector(".ui-mnp__more")!.textContent).toBe("50 of 600 shown – type to narrow them down");
        await typeIn(el, "skill-59");
        // The exact name first, then the rest that start with it
        expect(rows(el)[0]).toBe("/skill-59");
        expect(rows(el).sort()).toEqual(["/skill-59", ...Array.from({ length: 10 }, (_, i) => `/skill-59${i}`)]);
        expect(performance.now() - t0).toBeLessThan(1500);
      });

      test("hide-skills-button leaves the button out; skills-placeholder words the placeholder", async () => {
        const el = await setup(look, { hideSkillsButton: true, skillsPlaceholder: "Ask, or type / for a skill" });
        expect(button(el, "Use a skill")).toBeNull();
        expect(message(el).placeholder).toBe("Ask, or type / for a skill");
      });
    });
  }

  test("React: skills, onSkillChange and onSend's details; a controlled skill", async () => {
    const host = document.body.appendChild(document.createElement("div"));
    const root = createRoot(host);
    const calls: string[] = [];
    const onSend = vi.fn();
    function App() {
      const [skill, setSkill] = React.useState("");
      return React.createElement(ChatComposer, {
        demo: true,
        skills: SKILLS.map((s) => (s.id === "digest" ? { ...s, icon: React.createElement("svg", { "data-mine": "" }) } : s)),
        recentSkills: ["digest"],
        skill,
        onSkillChange: (s: { id: string } | null, reason: string) => {
          calls.push(`${reason}:${s?.id ?? "none"}`);
          setSkill(s?.id ?? "");
        },
        onSend,
      });
    }
    await act(async () => root.render(React.createElement(App)));
    await settle();
    const el = host.querySelector<TcChatComposer>("tc-chat-composer")!;
    await act(async () => typeIn(el, "/"));
    await settle();
    expect(el.querySelector(".ui-mnp__icon svg[data-mine]")).toBeTruthy();
    // Controlled: the pick is prevented, the parent sets the skill and the composer puts the token in
    await act(async () => void key(message(el), "Enter"));
    await settle();
    expect(el.value).toBe("/digest ");
    expect(el.skill).toBe("digest");
    await act(async () => typeIn(el, "this week"));
    await act(async () => void key(message(el), "Enter"));
    await settle();
    expect(onSend).toHaveBeenCalledWith("/digest this week", { model: "auto", skill: { id: "digest", name: "digest" }, args: "this week" });
    expect(calls).toEqual(["pick:digest", "send:none"]);
    expect(el.skill).toBe("");
    expect(el.value).toBe("");
    await act(async () => root.unmount());
  });

  for (const theme of ["light", "dark"] as const)
    for (const look of ["standard", "clean"] as const)
      test(`axe: the list open, then a token with its hint (${look}, ${theme})`, async () => {
        const wrap = await fixture<HTMLElement>(html`<div data-tc-theme=${theme} style="background: ${theme === "dark" ? "#0e0e10" : "#fff"}; padding: 8px 8px 360px; width: 560px">
          <tc-chat-composer look=${look} demo .skills=${SKILLS} .recentSkills=${["review"]}></tc-chat-composer>
        </div>`);
        const el = wrap.querySelector<TcChatComposer>("tc-chat-composer")!;
        const run = async () => {
          for (const a of document.getAnimations()) a.finish();
          // The list scrolls with ↑ ↓ from the message (its rows are the message's active descendant), so it takes no
          // focus of its own – the gallery's axe suite turns this rule off for the same reason
          const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, rules: { "scrollable-region-focusable": { enabled: false } }, resultTypes: ["violations"] });
          expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
        };
        await typeIn(el, "/");
        await run();
        await typeIn(el, "tr");
        key(message(el), "Enter");
        await settle();
        expect(el.querySelector(".ui-chat-composer__arg")).toBeTruthy();
        await run();
      });
});

describe("tc-chat-composer – the message is measured again when its width changes", () => {
  afterEach(cleanup);
  test("a narrower composer gives a long message more lines (Clean)", async () => {
    const wrap = await fixture<HTMLDivElement>(html`<div style="width: 1200px"><tc-chat-composer look="clean" load-ms="0"></tc-chat-composer></div>`);
    const el = wrap.querySelector("tc-chat-composer") as TcChatComposer;
    el.value = "Summarise the vendor ledger for the third quarter";
    await settle(wrap);
    const lines = () => Number((el.querySelector("[style*='--tc-chat-composer-lines']") as HTMLElement | null)?.style.getPropertyValue("--tc-chat-composer-lines") || 1);
    await expect.poll(lines).toBe(1);
    wrap.style.width = "320px";
    await expect.poll(lines).toBeGreaterThan(1);
  });
});
