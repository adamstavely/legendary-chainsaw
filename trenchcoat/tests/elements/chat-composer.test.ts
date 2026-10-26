/*
 * <tc-chat-composer> in real browsers – the React component's contract and regression checks, ported. Timers run for
 * real, with a short loadMs.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/chat-composer";
import { TcChatComposer, type ChatDictationSession, type ChatModel } from "../../src/elements/chat-composer";
import { cleanup, fixture, settle } from "./helpers";

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
      expect(onSend).toHaveBeenCalledWith("Hi", { model: "auto" });
      expect(sent).toEqual([{ message: "Hi", model: "auto" }]);
      expect(message(el).value).toBe("");
      expect(el.querySelector('[aria-live="polite"]')!.textContent).toBe("Message sent.");
    });

    test("an async onSend keeps the message until it resolves, and keeps it with an error when it rejects", async () => {
      let settleSend!: { resolve: () => void; reject: (e: Error) => void };
      const onSend = vi.fn(() => new Promise<void>((resolve, reject) => (settleSend = { resolve, reject })));
      const el = await fixture<TcChatComposer>(html`<tc-chat-composer look=${look} demo value="Ship it" .onSend=${onSend}></tc-chat-composer>`);
      button(el, "Send message")!.click();
      await settle();
      expect(onSend).toHaveBeenCalledWith("Ship it", { model: "auto" });
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

test("axe: no violations in either look", async () => {
  const wrap = await fixture(html`<div style="padding-top: 320px">
    <tc-chat-composer demo value="Hello"></tc-chat-composer>
    <tc-chat-composer look="clean" demo></tc-chat-composer>
  </div>`);
  await sleep(100);
  for (const a of document.getAnimations()) a.finish();
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
