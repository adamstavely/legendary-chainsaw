/*
 * <tc-writing-assistant> in real browsers – the React component's contract and regression checks, ported.
 */
import { html } from "lit";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import "../../src/elements/writing-assistant";
import type { ChatDraftChange, ChatMessage, ChatMessagesChange, TcWritingAssistant } from "../../src/elements/writing-assistant";
import { cleanup, fixture, settle } from "./helpers";

beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] }));
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (window as { SpeechRecognition?: unknown }).SpeechRecognition;
  cleanup();
});

const advance = async (ms: number, step = 100) => {
  for (let t = 0; t < ms; t += step) {
    vi.advanceTimersByTime(step);
    await Promise.resolve();
  }
  await settle();
};
const warnings = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls.filter(([m]) => String(m).startsWith("WritingAssistant:"));
const button = (el: Element, name: string) =>
  [...el.querySelectorAll("button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent!.trim()) === name) ?? null;
const field = (el: Element) => el.querySelector<HTMLTextAreaElement>('textarea[aria-label="Message"]')!;
const type = async (el: Element, text: string) => {
  const f = field(el);
  f.value = text;
  f.dispatchEvent(new InputEvent("input", { bubbles: true }));
  await settle();
};
const enter = async (el: Element) => {
  field(el).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
  await settle();
};
const texts = (el: Element) => [...el.querySelectorAll(".ui-wa__msg:not(.ui-wa__typing)")].map((m) => m.textContent!.trim());
const noMotion = () => vi.spyOn(window, "matchMedia").mockReturnValue({ matches: false } as MediaQueryList);

/** A speech recognizer that fails the way a blocked microphone does */
const installDeniedRecognition = () => {
  (window as { SpeechRecognition?: unknown }).SpeechRecognition = class {
    lang = "";
    interimResults = false;
    continuous = false;
    onresult = null;
    onerror: ((e: { error: string }) => void) | null = null;
    onend: (() => void) | null = null;
    start() {
      queueMicrotask(() => {
        this.onerror?.({ error: "not-allowed" });
        this.onend?.();
      });
    }
    stop() {}
    abort() {}
  };
};

// Runs first: the warning is once per page, so a later test would find it already spent
test("sample replies: silent with demo, otherwise one warning however often they're used", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const one = await fixture<TcWritingAssistant>(html`<tc-writing-assistant demo></tc-writing-assistant>`);
  button(one, "Polish my email")!.click();
  await advance(800);
  expect(warnings(warn)).toHaveLength(0);
  cleanup();
  const wrap = await fixture(html`<div><tc-writing-assistant></tc-writing-assistant><tc-writing-assistant></tc-writing-assistant></div>`);
  for (const el of wrap.querySelectorAll("tc-writing-assistant")) button(el, "Polish my email")!.click();
  await advance(800);
  expect(warnings(warn)).toHaveLength(1);
});

for (const look of ["standard", "clean"] as const) {
  describe(`tc-writing-assistant ${look}`, () => {
    test("the host is the root, with the look; the header names the assistant", async () => {
      const el = await fixture<TcWritingAssistant>(html`<tc-writing-assistant look=${look} name="Ink" tagline="Hi" demo></tc-writing-assistant>`);
      expect(el.dataset.ui).toBe("wa");
      expect(el.dataset.look).toBe(look);
      expect(el.querySelector(".tc-head__title")!.textContent!.trim()).toBe("Ink");
      expect(el.querySelector(".tc-head__sub")!.textContent!.trim()).toBe("Hi");
      expect(el.hasAttribute("data-chat")).toBe(false);
      expect(button(el, "New chat")!.tabIndex).toBe(-1);
    });

    test("a blocked microphone shows an error and sends nothing", async () => {
      installDeniedRecognition();
      const respond = vi.fn(() => "reply");
      const el = await fixture<TcWritingAssistant>(html`<tc-writing-assistant look=${look} .respond=${respond} dictation="Canned sentence"></tc-writing-assistant>`);
      button(el, "Dictate")!.click();
      await advance(6000, 500);
      expect(respond).not.toHaveBeenCalled();
      expect(el.textContent).not.toContain("Canned sentence");
      expect(el.querySelector('[role="alert"]')!.textContent).toMatch(/microphone/i);
      expect(button(el, "Dictate")!.getAttribute("aria-pressed")).toBe("false");
    });

    test("without speech recognition it says so instead of simulating – unless demo", async () => {
      // Chromium and WebKit ship (webkit)SpeechRecognition – take it away
      vi.stubGlobal("SpeechRecognition", undefined);
      vi.stubGlobal("webkitSpeechRecognition", undefined);
      const respond = vi.fn(() => "reply");
      const el = await fixture<TcWritingAssistant>(html`<tc-writing-assistant look=${look} .respond=${respond} dictation="Canned sentence"></tc-writing-assistant>`);
      button(el, "Dictate")!.click();
      await advance(6000, 500);
      expect(respond).not.toHaveBeenCalled();
      expect(el.querySelector('[role="alert"]')!.textContent).toMatch(/isn't supported/);
      cleanup();

      const demo = await fixture<TcWritingAssistant>(html`<tc-writing-assistant look=${look} .respond=${respond} dictation="Canned sentence" demo></tc-writing-assistant>`);
      button(demo, "Dictate")!.click();
      await settle();
      expect(button(demo, "Stop dictation")!.getAttribute("aria-pressed")).toBe("true");
      await advance(6000);
      // 3.2.2: dictation fills the field and waits – nothing is sent on its own
      expect(field(demo).value).toBe("Canned sentence");
      expect(respond).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(field(demo));
      await enter(demo);
      await advance(1000);
      expect(respond).toHaveBeenCalledWith("Canned sentence", expect.objectContaining({ signal: expect.any(AbortSignal) }));
    });

    test("a rejected respond clears the busy state and the message can be sent again", async () => {
      const respond = vi.fn<(m: string) => Promise<string>>().mockRejectedValueOnce(new Error("offline")).mockResolvedValue("Second try worked");
      const el = await fixture<TcWritingAssistant>(html`<tc-writing-assistant look=${look} .respond=${respond}></tc-writing-assistant>`);
      button(el, "Polish my email")!.click();
      await advance(1000);
      expect(el.querySelector('[role="alert"]')!.textContent).toMatch(/Couldn't get a reply/);
      expect(el.querySelector(".ui-wa__typing")).toBeNull();
      await type(el, "Polish my email");
      await enter(el);
      await advance(3000);
      expect(respond).toHaveBeenCalledTimes(2);
      expect(texts(el)).toContain("Second try worked");
      expect(el.querySelector('[role="alert"]')).toBeNull();
    });

    test("New chat drops a reply that is still on its way, and aborts its signal", async () => {
      let resolve!: (s: string) => void;
      let signal: AbortSignal | undefined;
      let history: ChatMessage[] = [];
      const respond = vi.fn((_: string, ctx: { signal: AbortSignal; history: ChatMessage[] }) => {
        signal = ctx.signal;
        history = ctx.history;
        return new Promise<string>((r) => (resolve = r));
      });
      const el = await fixture<TcWritingAssistant>(html`<tc-writing-assistant look=${look} .respond=${respond} greeting="Fresh start"></tc-writing-assistant>`);
      button(el, "Polish my email")!.click();
      await advance(800);
      expect(history).toHaveLength(1);
      expect(signal?.aborted).toBe(false);
      button(el, "New chat")!.click();
      expect(signal?.aborted).toBe(true);
      resolve("Late reply");
      await advance(2000);
      expect(el.textContent).not.toContain("Late reply");
      expect(el.querySelector(".ui-wa__greeting")!.textContent).toBe("Fresh start");
    });

    test("removing the element aborts a reply on its way and leaves no timer", async () => {
      let signal: AbortSignal | undefined;
      const el = await fixture<TcWritingAssistant>(html`<tc-writing-assistant
        look=${look}
        .respond=${(_: string, ctx: { signal: AbortSignal }) => {
          signal = ctx.signal;
          return new Promise<string>(() => {});
        }}
      ></tc-writing-assistant>`);
      button(el, "Polish my email")!.click();
      await advance(100);
      el.remove();
      expect(signal?.aborted).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    });

    test("messages seed the chat; every message is reported with the whole conversation", async () => {
      const onChange = vi.fn();
      const seed: ChatMessage[] = [{ id: "s1", role: "assistant", text: "Welcome back." }];
      const el = await fixture<TcWritingAssistant>(html`<tc-writing-assistant look=${look} .respond=${() => "Sure."} .messages=${seed} @tc-messages-change=${(e: CustomEvent<ChatMessagesChange>) => onChange(e.detail.messages)}></tc-writing-assistant>`);
      expect(texts(el)).toEqual(["Welcome back."]);
      expect(el.hasAttribute("data-chat")).toBe(true);
      await type(el, "Shorter please");
      await enter(el);
      expect(onChange.mock.lastCall![0].map((m: ChatMessage) => m.text)).toEqual(["Welcome back.", "Shorter please"]);
      await advance(800);
      expect(onChange.mock.lastCall![0].map((m: ChatMessage) => `${m.role}:${m.text}`)).toEqual(["assistant:Welcome back.", "user:Shorter please", "assistant:Sure."]);
    });

    test("controlled messages: a prevented change is reported, only the app's list shows", async () => {
      const onChange = vi.fn();
      const el = await fixture<TcWritingAssistant>(html`<tc-writing-assistant
        look=${look}
        .respond=${() => "Sure."}
        @tc-messages-change=${(e: CustomEvent<ChatMessagesChange>) => {
          e.preventDefault();
          onChange(e.detail.messages);
        }}
      ></tc-writing-assistant>`);
      button(el, "Polish my email")!.click();
      await settle();
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(texts(el)).toEqual([]);
      el.messages = [{ id: "1", role: "user", text: "Polish my email" }, { id: "2", role: "assistant", text: "Done – two typos fixed." }];
      await settle();
      expect(texts(el)).toEqual(["Polish my email", "Done – two typos fixed."]);
    });

    test("controlled draft: the field follows `draft`; a prevented edit is reported and put back", async () => {
      const onDraft = vi.fn();
      const el = await fixture<TcWritingAssistant>(html`<tc-writing-assistant
        look=${look}
        demo
        draft="Hello"
        @tc-draft-change=${(e: CustomEvent<ChatDraftChange>) => {
          e.preventDefault();
          onDraft(e.detail.draft);
        }}
      ></tc-writing-assistant>`);
      expect(field(el).value).toBe("Hello");
      await type(el, "Hello!");
      expect(onDraft).toHaveBeenCalledWith("Hello!");
      expect(field(el).value).toBe("Hello");
      el.draft = "Hello there";
      await settle();
      expect(field(el).value).toBe("Hello there");
      expect(button(el, "Send")).toBeTruthy();
    });

    test("a reply streams in word by word, then is announced once, whole, through a status region", async () => {
      noMotion();
      const reply = "one two three four five six seven eight nine ten";
      const el = await fixture<TcWritingAssistant>(html`<tc-writing-assistant look=${look} name="Quill" .respond=${() => reply}></tc-writing-assistant>`);
      const region = el.querySelector('[role="status"]')!;
      expect(region.textContent).toBe("");
      await type(el, "hi");
      await enter(el);
      await advance(200);
      expect(region.textContent).toBe("Writing…");
      expect(el.querySelector(".ui-wa__typing")).toBeTruthy();
      expect(el.querySelector("[aria-live]")).toBeNull();
      await advance(510, 10);
      const answer = () => el.querySelector(".ui-wa__msg--assistant:not(.ui-wa__typing)")?.textContent;
      expect(answer()).toBe("one");
      await advance(38 * 4, 38);
      expect(answer()).toBe("one two three four five");
      await advance(1000);
      expect(answer()).toBe(reply);
      expect(region.textContent).toBe(`Quill: ${reply}`);
    });

    test("keyboard: Shift + Enter doesn't send; Enter does", async () => {
      const respond = vi.fn(() => "ok");
      const el = await fixture<TcWritingAssistant>(html`<tc-writing-assistant look=${look} .respond=${respond}></tc-writing-assistant>`);
      await type(el, "hi");
      field(el).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", shiftKey: true, bubbles: true, cancelable: true }));
      await advance(800);
      expect(respond).not.toHaveBeenCalled();
      await enter(el);
      await advance(800);
      expect(respond).toHaveBeenCalledTimes(1);
    });

    test("a suggestion chip hands focus to the field; New chat does too", async () => {
      const el = await fixture<TcWritingAssistant>(html`<tc-writing-assistant look=${look} demo .suggestions=${["Make it shorter"]}></tc-writing-assistant>`);
      const chip = button(el, "Make it shorter")!;
      chip.focus();
      chip.click();
      await settle();
      expect(document.activeElement).toBe(field(el));
      await advance(3000);
      const reset = button(el, "New chat")!;
      expect(reset.tabIndex).toBe(0);
      reset.focus();
      reset.click();
      await settle();
      expect(document.activeElement).toBe(field(el));
    });
  });
}

test("axe: no violations in either look, welcome and chat", async () => {
  vi.useRealTimers();
  const chat: ChatMessage[] = [
    { id: "1", role: "user", text: "Polish my email" },
    { id: "2", role: "assistant", text: "Done – two typos fixed." },
  ];
  const wrap = await fixture(html`<div>
    <tc-writing-assistant demo></tc-writing-assistant>
    <tc-writing-assistant look="clean" demo></tc-writing-assistant>
    <tc-writing-assistant demo .messages=${chat}></tc-writing-assistant>
    <tc-writing-assistant look="clean" demo .messages=${chat}></tc-writing-assistant>
  </div>`);
  // Fade-ins settle before axe measures contrast (the glow keeps drifting)
  await Promise.all(document.getAnimations().filter((a) => !((a.effect as KeyframeEffect | null)?.target as Element | null)?.closest(".ui-wa__glow")).map((a) => a.finished));
  const result = await axe.run(wrap, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] });
  expect(result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
});
