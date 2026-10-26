import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { OffScreenController } from "./internal/controllers";

/*
 * <tc-writing-assistant> – the Lit port of src/components/writing-assistant.tsx: a compact AI chat card. A soft
 * pink-violet-blue glow behind a welcome line, suggestion chips, a prompt field and a mic button. Pick a suggestion,
 * type, or dictate: the words appear live in the field, and once you stop speaking the finished text waits there for
 * you to send. Replies stream in word by word. Dictation uses the browser's speech recognition where available; with
 * `demo` a short simulated take stands in. Clean is one white card with the gradient kept as a small accent.
 *
 *   <tc-writing-assistant .respond=${(message) => fetchReply(message)}></tc-writing-assistant>
 *
 * The conversation is `messages` and the field's text is `draft`; every change fires a cancelable
 * `tc-messages-change` ({ messages }) or `tc-draft-change` ({ draft }) – call preventDefault() to keep control of the
 * value yourself.
 */

/** One message of the conversation */
export type ChatMessage = { id: string; role: "user" | "assistant"; text: string };
export type ChatMessagesChange = { messages: ChatMessage[] };
export type ChatDraftChange = { draft: string };
export type WritingAssistantRespond = (message: string, context: { signal: AbortSignal; history: ChatMessage[] }) => string | Promise<string>;

const NO_MESSAGES: ChatMessage[] = [];

const sampleReply = (message: string) => {
  const m = message.toLowerCase();
  if (m.includes("remind"))
    return "Hi team, just a friendly nudge: the report is due this Friday. If anything is holding you up, let me know today and we'll sort it out together. Thanks!";
  if (m.includes("shorter") || m.includes("short"))
    return "Here's a tighter version: “Thanks for the quick turnaround – the new draft reads much better. Let's ship it Friday.”";
  if (m.includes("tone"))
    return "I softened the opening and swapped the direct ask for a question, so it sounds friendly but still clear about the deadline.";
  if (m.includes("reply"))
    return "Hi Sam, thanks for the update! Thursday works for me – I'll bring the revised numbers so we can decide on the spot.";
  if (m.includes("email") || m.includes("polish"))
    return "I fixed two typos, split the long second paragraph and moved your main ask to the first line, so it's the first thing they read.";
  return "Got it. Here's a first draft – tell me if it should sound more formal, shorter or more playful, and I'll adjust it.";
};

// Warns once per page (not per instance) when the sample writer stands in for a missing `respond`
let warnedSampleReplies = false;
const warnSampleReplies = () => {
  if (warnedSampleReplies) return;
  warnedSampleReplies = true;
  console.warn(
    "WritingAssistant: no respond handler – simulating replies. Pass `demo` to keep the simulation, or `respond` to wire it up. The simulation will be off by default in the next major version.",
  );
};

// What a recognition error means for the user; errors without a message (no speech, aborted) just stop listening
const dictationError = (error: string) =>
  error === "not-allowed" || error === "service-not-allowed"
    ? "Microphone access was blocked."
    : error === "network"
      ? "Dictation needs a network connection."
      : error === "audio-capture"
        ? "No microphone was found."
        : "";

// Minimal typing for the Web Speech API, which isn't in the DOM lib yet
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

/** One line of the prompt and the field's padding: it grows up to four lines, then scrolls */
const FIELD = { standard: { line: 21, pad: 19 }, clean: { line: 20, pad: 8 } };

let instances = 0;

/**
 * A compact AI chat card with suggestions, a growing prompt field and dictation.
 * @tag tc-writing-assistant
 * @fires tc-messages-change - A message was added or the chat was reset ({ messages }: ChatMessagesChange, the whole conversation); cancelable
 * @fires tc-draft-change - The text in the prompt field changed ({ draft }: ChatDraftChange); cancelable
 */
export class TcWritingAssistant extends TcElement {
  static override ui = "wa";

  /** The assistant's name, in the header */
  @property() accessor name = "Quill";
  /** Short line under the name */
  @property() accessor tagline = "Your writing companion.";
  /** Big line on the welcome screen */
  @property() accessor greeting = "What should we write?";
  /** Chips on the welcome screen; picking one sends it as a message */
  @property({ attribute: false }) accessor suggestions: string[] = ["Polish my email", "Make it shorter", "Fix the tone", "Draft a reply"];
  /** Text in the empty prompt field */
  @property() accessor placeholder = "Ask anything…";
  /**
   * Your answer for a message – return text or a promise of text. A rejected promise shows an error and lets the
   * message be sent again. `signal` aborts when the chat is reset or the element is removed. Without it a sample
   * writer answers (and warns once, unless `demo` is set). `history` is the conversation so far, ending with this message
   */
  @property({ attribute: false }) accessor respond: WritingAssistantRespond | undefined = undefined;
  /** The conversation. Changed by the element unless a tc-messages-change listener calls preventDefault() */
  @property({ attribute: false }) accessor messages: ChatMessage[] = NO_MESSAGES;
  /** Text in the prompt field. Changed by the element unless a tc-draft-change listener calls preventDefault() */
  @property() accessor draft = "";
  /** "auto" uses real speech recognition when the browser has it and shows an error otherwise (or plays the sample
   *  take with `demo`); "simulate" always plays a sample take */
  @property() accessor speech: "auto" | "simulate" = "auto";
  /** Demo mode: the sample writer answers without a warning, and dictation plays the sample take where the browser
   *  has no speech recognition */
  @property({ type: Boolean }) accessor demo = false;
  /** Sample sentence for simulated dictation */
  @property() accessor dictation = "Write a friendly reminder that the report is due on Friday";

  @state() private accessor interim = "";
  @state() private accessor listening = false;
  @state() private accessor busy = false;
  @state() private accessor error = "";
  /** What screen readers hear: "Writing…" while waiting, then the whole reply once it's in – never word by word */
  @state() private accessor said = "";
  /** The reply streaming in, and how many of its words show */
  @state() private accessor streamed: { id: string; words: number } | null = null;

  private readonly gradientId = `ui-wa-tc${++instances}`;
  private nextId = 1;
  private rec: Recognition | null = null;
  private final = "";
  private timers: number[] = [];
  /** Bumped by reset and removal, so a reply that arrives afterwards is dropped */
  private run = 0;
  /** Aborts the reply on its way when the chat is reset or the element is removed */
  private pending: AbortController | null = null;
  private ro?: ResizeObserver;
  private observedList: HTMLElement | null = null;
  private sized = false;

  constructor() {
    super();
    // The typing dots and the listening pulse loop – paused while the card is scrolled away
    new OffScreenController(this, () => this.busy || this.listening);
  }

  private get list() {
    return this.querySelector<HTMLElement>(".ui-wa__messages");
  }
  private get input() {
    return this.querySelector<HTMLTextAreaElement>(".ui-wa__field textarea");
  }

  private makeId() {
    return `${this.gradientId}-${this.nextId++}`;
  }
  private later(fn: () => void, ms: number) {
    this.timers.push(window.setTimeout(fn, ms));
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.run++;
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
    this.rec?.abort();
    this.rec = null;
    this.pending?.abort();
    this.pending = null;
    this.ro?.disconnect();
    this.ro = undefined;
    this.observedList = null;
    if (this.busy || this.listening || this.streamed) {
      this.busy = false;
      this.listening = false;
      this.interim = "";
      this.streamed = null;
      this.said = "";
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    if (this.hasUpdated) this.requestUpdate();
  }

  /* ---------- Values ---------- */

  private setMessages(next: ChatMessage[]) {
    if (this.emit<ChatMessagesChange>("tc-messages-change", { messages: next }, { cancelable: true })) this.messages = next;
  }
  private setDraft(next: string) {
    if (next === this.draft) return;
    if (this.emit<ChatDraftChange>("tc-draft-change", { draft: next }, { cancelable: true })) this.draft = next;
    // A prevented change puts the field back to `draft`
    else this.requestUpdate();
  }

  /* ---------- Layout after each render ---------- */

  protected override updated(changed: PropertyValues) {
    // The field grows with its text up to four lines, then scrolls – and keeps the newest words in view
    const el = this.input;
    if (el && (changed.has("draft") || changed.has("interim") || changed.has("listening") || changed.has("look") || changed.has("contextLook") || !this.sized)) {
      this.sized = true;
      el.style.height = "auto";
      const { line, pad } = FIELD[this.resolvedLook];
      el.style.height = `${Math.min(el.scrollHeight, 4 * line + pad)}px`;
      if (this.listening || document.activeElement !== el) el.scrollTop = el.scrollHeight;
    }
    // Keep the newest message in view
    if (changed.has("messages") || changed.has("streamed")) this.follow();
    // When the prompt grows and the chat gets shorter, the messages move up with it instead of being cut off
    const list = this.list;
    if (list !== this.observedList) {
      this.ro?.disconnect();
      this.ro = undefined;
      this.observedList = list;
      if (list && typeof ResizeObserver === "function") {
        let lastHeight = list.clientHeight;
        this.ro = new ResizeObserver(() => {
          if (list.clientHeight < lastHeight) list.scrollTop = list.scrollHeight;
          lastHeight = list.clientHeight;
        });
        this.ro.observe(list);
      }
    }
  }

  private follow() {
    this.list?.scrollTo({ top: this.list.scrollHeight, behavior: "smooth" });
  }

  /* ---------- Sending ---------- */

  private async send(raw: string) {
    const text = raw.trim();
    if (!text || this.busy) return;
    this.setDraft("");
    this.interim = "";
    this.error = "";
    const userMsg: ChatMessage = { id: this.makeId(), role: "user", text };
    const history = [...this.messages, userMsg];
    this.setMessages(history);
    this.busy = true;
    this.said = "Writing…";
    const current = this.run;
    const controller = new AbortController();
    this.pending = controller;
    const respond = this.respond;
    const answer = async () => {
      if (respond) return respond(text, { signal: controller.signal, history });
      if (!this.demo) warnSampleReplies();
      return sampleReply(text);
    };
    let reply: string;
    try {
      [reply] = await Promise.all([answer(), new Promise((r) => this.later(() => r(null), 700))]);
    } catch {
      if (this.pending === controller) this.pending = null;
      // The typing dots go and the field is free again, so the message can be sent once more
      if (this.run === current) {
        this.busy = false;
        this.said = "";
        this.error = "Couldn't get a reply. Try again.";
      }
      return;
    }
    if (this.pending === controller) this.pending = null;
    if (this.run !== current) return;
    const id = this.makeId();
    this.setMessages([...this.messages, { id, role: "assistant", text: reply }]);
    const announce = () => (this.said = `${this.name}: ${reply}`);
    // Stream the reply in word by word
    const parts = reply.split(/\s+/);
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      this.streamed = null;
      this.busy = false;
      announce();
      return;
    }
    this.streamed = { id, words: 1 };
    const next = () => {
      const s = this.streamed;
      if (!s || s.id !== id) return;
      if (s.words < parts.length) {
        this.streamed = { id, words: s.words + 1 };
        this.later(next, 38);
        return;
      }
      this.later(() => {
        this.streamed = null;
        this.busy = false;
        announce();
      }, 60);
    };
    this.later(next, 38);
  }

  /* ---------- Dictation ---------- */

  private finishDictation(text: string) {
    this.listening = false;
    this.interim = "";
    if (text.trim()) {
      // The words go into the field – you read them and send them yourself (nothing is sent on its own)
      this.setDraft(text.trim());
      this.input?.focus({ preventScroll: true });
    }
  }

  private simulate() {
    this.listening = true;
    this.setDraft("");
    const words = this.dictation.split(/\s+/);
    const take = this.dictation;
    words.forEach((_, i) => this.later(() => (this.interim = words.slice(0, i + 1).join(" ")), 260 + i * 170));
    this.later(() => this.finishDictation(take), 260 + words.length * 170 + 500);
  }

  private startListening() {
    if (this.busy) return;
    this.error = "";
    const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const Ctor = this.speech === "auto" ? (w.SpeechRecognition ?? w.webkitSpeechRecognition) : undefined;
    if (!Ctor) {
      if (this.speech === "simulate" || this.demo) return this.simulate();
      this.error = "Dictation isn't supported in this browser.";
      return;
    }
    const rec = new Ctor();
    rec.lang = navigator.language || "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    this.final = "";
    rec.onresult = (e) => {
      let liveText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) this.final += r[0].transcript;
        else liveText += r[0].transcript;
      }
      this.interim = `${this.final}${liveText}`;
    };
    rec.onerror = (e) => {
      // No mic access or no speech service: say so – never stand in a sample take, which would be sent as yours
      this.rec = null;
      this.listening = false;
      this.interim = "";
      this.error = dictationError(e.error);
    };
    rec.onend = () => {
      if (this.rec !== rec) return;
      this.rec = null;
      this.finishDictation(this.final);
    };
    this.rec = rec;
    this.setDraft("");
    this.interim = "";
    this.listening = true;
    try {
      rec.start();
    } catch {
      this.rec = null;
      this.listening = false;
      this.error = "Dictation couldn't start.";
    }
  }

  private stopListening() {
    this.rec?.stop();
  }

  private reset() {
    this.run++;
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
    this.rec?.abort();
    this.rec = null;
    this.pending?.abort();
    this.pending = null;
    this.setMessages(NO_MESSAGES);
    this.setDraft("");
    this.interim = "";
    this.listening = false;
    this.busy = false;
    this.error = "";
    this.said = "";
    this.streamed = null;
    // New chat hides itself – focus goes to the field, where the next chat starts
    this.input?.focus({ preventScroll: true });
  }

  /* ---------- Render ---------- */

  private header(clean: boolean, chatting: boolean) {
    const g = this.gradientId;
    return html`<header class="ui-wa__head">
      <div class="ui-wa__id">
        <h3 class="ui-wa__name">${clean
          ? html`<svg class="ui-wa__mark" viewBox="0 0 16 16" aria-hidden="true">${svg`<defs><linearGradient id=${g} x1="2" y1="2" x2="14" y2="14" gradientUnits="userSpaceOnUse"><stop stop-color="var(--tc-tone-pink-solid)"></stop><stop offset="0.5" stop-color="var(--tc-tone-violet-solid)"></stop><stop offset="1" stop-color="var(--tc-accent)"></stop></linearGradient></defs><path fill=${`url(#${g})`} d="M8 1.5c.3 2.9 1.6 4.2 4.5 4.5-2.9.3-4.2 1.6-4.5 4.5-.3-2.9-1.6-4.2-4.5-4.5 2.9-.3 4.2-1.6 4.5-4.5Z"></path><path fill=${`url(#${g})`} d="M12.25 10c.13 1.3.7 1.87 2 2-1.3.13-1.87.7-2 2-.13-1.3-.7-1.87-2-2 1.3-.13 1.87-.7 2-2Z"></path>`}</svg>`
          : nothing}${this.name}</h3>
        <p class="ui-wa__tagline">${this.tagline}</p>
      </div>
      <button type="button" class="ui-wa__new" aria-label="New chat" @click=${() => this.reset()} tabindex=${chatting ? 0 : -1}>
        <svg viewBox="0 0 24 24" aria-hidden="true">${clean ? svg`<path d="M12 5v14M5 12h14"></path>` : svg`<path d="M12 5.5v13M5.5 12h13"></path>`}</svg>
      </button>
    </header>`;
  }

  /** The messages – the reply streaming in shows the words so far – or the welcome with suggestions */
  private conversation(clean: boolean) {
    const messages = this.messages;
    const streamed = this.streamed;
    const typing = this.busy && !streamed && messages[messages.length - 1]?.role === "user";
    const shownText = (m: ChatMessage) => (streamed?.id === m.id ? m.text.split(/\s+/).slice(0, streamed.words).join(" ") : m.text);
    // Not a live region: the reply streams in word by word – the status region says it once, finished
    return messages.length > 0
      ? html`<div class="ui-wa__messages">
          ${repeat(messages, (m) => m.id, (m) => html`<p class=${`ui-wa__msg ui-wa__msg--${m.role}`} data-msg=${m.id}>${shownText(m)}</p>`)}
          ${typing
            ? html`<p class="ui-wa__msg ui-wa__msg--assistant ui-wa__typing" aria-hidden="true">${clean
                ? html`<span class="ui-wa__shimmer" data-text="Writing…" aria-hidden="true">Writing…</span>`
                : html`<i></i><i></i><i></i>`}</p>`
            : nothing}
        </div>`
      : html`<div class="ui-wa__welcome">
          <p class="ui-wa__greeting">${this.greeting}</p>
          <div class="ui-wa__chips">
            ${this.suggestions.map(
              (s) => html`<button
                type="button"
                class="ui-wa__chip"
                @click=${() => {
                  // The chip goes with the welcome – focus moves to the field first
                  this.input?.focus({ preventScroll: true });
                  void this.send(s);
                }}
              >${s}</button>`,
            )}
          </div>
        </div>`;
  }

  /** The prompt: a field that grows up to four lines, the mic, and Send (Standard: inside the field, Clean: last) */
  private prompt(clean: boolean) {
    const listening = this.listening;
    const value = listening ? this.interim : this.draft;
    const sendButton =
      !!value && !listening
        ? html`<button type="submit" class="ui-wa__send" aria-label="Send" ?disabled=${this.busy}>
            <svg viewBox="0 0 24 24" aria-hidden="true">${clean ? svg`<path d="M12 19V5.5M6 11c0 0 4.4-6 6-6s6 6 6 6"></path>` : svg`<path d="M12 18.5v-13M6.5 11 12 5.5l5.5 5.5"></path>`}</svg>
          </button>`
        : nothing;
    return html`<form
      class="ui-wa__row"
      @submit=${(e: SubmitEvent) => {
        e.preventDefault();
        void this.send(this.draft);
      }}
    >
      <div class="ui-wa__field" ?data-listening=${listening}>
        <textarea
          rows="1"
          .value=${live(value)}
          ?readonly=${listening}
          @input=${(e: InputEvent) => this.setDraft((e.target as HTMLTextAreaElement).value)}
          @keydown=${(e: KeyboardEvent) => {
            // Enter sends, Shift + Enter starts a new line
            if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
              e.preventDefault();
              void this.send(this.draft);
            }
          }}
          placeholder=${listening ? "Listening…" : this.placeholder}
          aria-label="Message"
        ></textarea>
        ${clean ? nothing : sendButton}
      </div>
      <button
        type="button"
        class="ui-wa__mic"
        ?data-listening=${listening}
        aria-pressed=${listening ? "true" : "false"}
        aria-label=${listening ? "Stop dictation" : "Dictate"}
        @click=${() => (listening ? this.stopListening() : this.startListening())}
        ?disabled=${this.busy && !listening}
      >
        <span class="ui-wa__pulse" aria-hidden="true"></span>
        ${listening
          ? html`<span class="ui-wa__wave" aria-hidden="true"><i></i><i></i><i></i></span>`
          : html`<svg viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M12 3.5a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0v-5a3 3 0 0 1 3-3ZM6 11.5a6 6 0 0 0 12 0M12 17.5v3"></path>`}</svg>`}
      </button>
      ${clean ? sendButton : nothing}
    </form>`;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.toggleAttribute("data-chat", this.messages.length > 0);
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const chatting = this.messages.length > 0;
    const glow = html`<div class="ui-wa__glow" aria-hidden="true">
      <span class="ui-wa__blob ui-wa__blob--pink"></span>
      <span class="ui-wa__blob ui-wa__blob--violet"></span>
      <span class="ui-wa__blob ui-wa__blob--blue"></span>
    </div>`;
    const errorLine = this.error ? html`<p class="ui-wa__error" role="alert">${this.error}</p>` : nothing;
    return html`
      <span class="ui-wa__sr" role="status">${this.said}</span>
      ${this.header(clean, chatting)}
      ${clean
        ? html`<div class="ui-wa__body">${glow}<div class="ui-wa__content">${this.conversation(clean)}</div>${errorLine}${this.prompt(clean)}</div>`
        : html`<div class="ui-wa__panel">${glow}<div class="ui-wa__body">${this.conversation(clean)}${errorLine}${this.prompt(clean)}</div></div>`}
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="wa"] {
  /* the composer field and mic sit a step above the dark panel */
  --tc-writing-assistant-field-bg: light-dark(#ffffff, #2a2a2d);
  --tc-writing-assistant-bubble-bg: light-dark(rgba(255, 255, 255, 0.85), rgba(42, 42, 45, 0.85));
  /* The library's gradient: Pro pink, violet and accent blue */
  --tc-writing-assistant-glow: 0.28;
  --tc-writing-assistant-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 12px 32px light-dark(rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.3));
  width: 100%;
  max-width: 380px;
  padding: var(--tc-space-2);
  border: 1px solid var(--tc-border-default);
  border-radius: 32px;
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-writing-assistant-shadow);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="wa"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="wa"] {
  /* the shimmer band over the label: brighter than --tc-shimmer, so it reads on light text in dark mode */
  --tc-writing-assistant-shimmer: light-dark(rgba(255, 255, 255, 0.82), #ffffff);
  --tc-writing-assistant-pulse: light-dark(rgba(0, 96, 226, 0.22), rgba(77, 141, 255, 0.3));
  /* The classic gradient: Pro pink, violet and accent blue – only a small accent here */
  --tc-writing-assistant-glow: 0.13;
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 380px;
  overflow: hidden;
  border-radius: var(--tc-radius-lg);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
}
[data-ui="wa"] *, [data-ui="wa"] *::before, [data-ui="wa"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="wa"] button { font: inherit; color: inherit; margin: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="wa"] :focus-visible:not(textarea) { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-wa__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* ---------- Header ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-wa__head { display: flex; align-items: flex-start; justify-content: space-between; padding: var(--tc-space-4-5) var(--tc-space-4-5) var(--tc-space-4); }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__name { margin: 0; font-size: var(--tc-font-size-2xl); font-weight: var(--tc-font-weight-medium); letter-spacing: -0.02em; }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__tagline { margin: var(--tc-space-1) 0 0; font-size: var(--tc-font-size-md); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__new {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--tc-fill-default);
  color: var(--tc-text-secondary) !important;
  opacity: 0;
  transform: scale(0.8);
  pointer-events: none;
  transition: opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-slow) var(--tc-ease-move), background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="wa"]) button {
  appearance: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="wa"]) svg { display: block; flex: none; }
/* ---------- Header ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3);
  padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-3) var(--tc-space-4);
  border-bottom: 0.5px solid var(--tc-border-default);
}
:where([data-look="clean"], [data-look="clean"] *).ui-wa__id { min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__name {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  margin: 0;
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-strong);
}
:where([data-look="clean"], [data-look="clean"] *).ui-wa__mark { width: 16px; height: 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__tagline {
  margin: 0;
  overflow: hidden;
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--tc-text-secondary);
}
/* New chat: a ghost icon button that shows up once there's a conversation */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__new {
  display: grid;
  place-items: center;
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: var(--tc-radius-sm);
  color: var(--tc-icon-muted);
  opacity: 0;
  transform: scale(0.8);
  pointer-events: none;
  transition: opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-slow) var(--tc-ease-move), background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
[data-ui="wa"][data-chat] .ui-wa__new { opacity: 1; transform: none; pointer-events: auto; }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__new:hover { background: var(--tc-fill-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__new svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; }
/* ---------- Panel with the glow ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-wa__panel {
  position: relative;
  overflow: hidden;
  /* Card radius 32 minus its 8px padding, so the corners run parallel */
  border-radius: 24px;
  background: var(--tc-surface-raised);
  box-shadow: inset 0 0 0 1px var(--tc-border-default);
}
:where([data-look="standard"], [data-look="standard"] *).ui-wa__glow { position: absolute; inset: 0; pointer-events: none; }
/* The glow sits in the lower part and keeps moving – clearly visible, never still */
:where([data-look="standard"], [data-look="standard"] *).ui-wa__blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(34px);
  opacity: var(--tc-writing-assistant-glow);
  animation: ui-wa-drift-a 6s ease-in-out 4 alternate;
}
:where([data-look="standard"], [data-look="standard"] *).ui-wa__blob--pink { left: -18%; top: 46%; width: 60%; height: 42%; background: var(--tc-tone-pink-solid); }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__blob--violet { right: -16%; top: 36%; width: 56%; height: 44%; background: var(--tc-tone-violet-solid); animation-name: ui-wa-drift-b; animation-duration: 7s; }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__blob--blue { left: 22%; bottom: -16%; width: 64%; height: 42%; background: var(--tc-accent); animation-name: ui-wa-drift-c; animation-duration: 5.5s; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="wa"][data-chat] .ui-wa__blob { opacity: calc(var(--tc-writing-assistant-glow) * 0.6); }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__body {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: var(--tc-space-4-5);
  height: max(340px, 21.25rem);
  padding: var(--tc-space-4-5) var(--tc-space-3-5) var(--tc-space-3-5);
}
/* Welcome */
:where([data-look="standard"], [data-look="standard"] *).ui-wa__welcome { display: grid; gap: var(--tc-space-3-5); padding: 0 var(--tc-space-1); animation: ui-wa-in var(--tc-duration-slower) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__greeting {
  margin: 0;
  font-size: var(--tc-font-size-3xl);
  font-weight: var(--tc-font-weight-medium);
  line-height: 1.15;
  letter-spacing: -0.025em;
  color: var(--tc-text-primary);
}
:where([data-look="clean"], [data-look="clean"] *).ui-wa__new:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__new svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; }
/* ---------- Body: content above, the prompt as the last row ---------- */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__body { position: relative; display: flex; flex-direction: column; height: max(340px, 21.25rem); overflow: hidden; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__content {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  overflow: hidden;
}
/* A faint glow in the lower part – it keeps drifting, and quiets down once you chat */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__glow { position: absolute; inset: 0; pointer-events: none; opacity: 1; transition: opacity var(--tc-duration-slowest) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="wa"][data-chat] .ui-wa__glow { opacity: 0.4; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(36px);
  opacity: var(--tc-writing-assistant-glow);
  animation: ui-wa-drift-a 6s ease-in-out 4 alternate;
}
:where([data-look="clean"], [data-look="clean"] *).ui-wa__blob--pink { left: -18%; top: 54%; width: 58%; height: 40%; background: var(--tc-tone-pink-solid); }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__blob--violet { right: -16%; top: 46%; width: 54%; height: 42%; background: var(--tc-tone-violet-solid); animation-name: ui-wa-drift-b; animation-duration: 7s; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__blob--blue { left: 22%; bottom: -22%; width: 62%; height: 40%; background: var(--tc-accent); animation-name: ui-wa-drift-c; animation-duration: 5.5s; }
/* Welcome */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__welcome { position: relative; display: grid; gap: var(--tc-space-3); padding: var(--tc-space-4); animation: ui-wa-in var(--tc-duration-slower) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__greeting { margin: 0; font-size: 15px; font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-loose); color: var(--tc-text-strong); }
.ui-wa__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__chip {
  height: 32px;
  padding: 0 var(--tc-space-3);
  border: 0;
  border-radius: var(--tc-radius-full);
  background: var(--tc-fill-default);
  font-size: var(--tc-font-size-md);
  color: var(--tc-text-secondary) !important;
  backdrop-filter: blur(8px);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-wa__chip:hover { background: var(--tc-fill-hover); }
/* Suggestion chips: the button-switch look – a hairline, gray text */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__chip {
  padding: var(--tc-space-1) var(--tc-space-2-5);
  border-radius: var(--tc-radius-sm);
  background: color-mix(in srgb, var(--tc-surface-raised) 70%, transparent);
  box-shadow: inset 0 0 0 0.5px var(--tc-border-default);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  white-space: nowrap;
  color: var(--tc-text-secondary);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-wa__chip:hover { background: linear-gradient(var(--tc-fill-subtle), var(--tc-fill-subtle)), color-mix(in srgb, var(--tc-surface-raised) 70%, transparent); color: var(--tc-text-primary); }
.ui-wa__chip:active { transform: scale(0.97); }
/* Chat */
:where([data-look="standard"], [data-look="standard"] *).ui-wa__messages {
  display: flex;
  flex-direction: column;
  gap: var(--tc-space-2);
  min-height: 0;
  margin: -4px -4px 0;
  padding: var(--tc-space-1);
  overflow-y: auto;
  scrollbar-width: none;
  /* Soft edges at the top and towards the prompt, so nothing ends in a hard cut */
  -webkit-mask-image: linear-gradient(transparent, #000 18px, #000 calc(100% - 16px), transparent);
  mask-image: linear-gradient(transparent, #000 18px, #000 calc(100% - 16px), transparent);
  padding-bottom: var(--tc-space-3-5);
}
:where([data-look="standard"], [data-look="standard"] *).ui-wa__msg {
  max-width: 86%;
  margin: 0;
  padding: var(--tc-space-2) var(--tc-space-3);
  font-size: var(--tc-font-size-md);
  line-height: 1.45;
  white-space: pre-wrap;
  animation: ui-wa-in var(--tc-duration-slow) var(--tc-ease-move) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-wa__msg--user { align-self: flex-end; border-radius: 18px 18px var(--tc-radius-sm) 18px; background: var(--tc-fill-default); }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__msg--assistant {
  align-self: flex-start;
  border-radius: 18px 18px 18px var(--tc-radius-sm);
  background: var(--tc-writing-assistant-bubble-bg);
  box-shadow: 0 0 0 1px var(--tc-border-default);
  backdrop-filter: blur(10px);
}
:where([data-look="standard"], [data-look="standard"] *).ui-wa__typing { display: inline-flex; gap: var(--tc-space-1); padding: var(--tc-space-3) var(--tc-space-3-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__typing i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--tc-text-muted);
  animation: ui-wa-dot 1s ease-in-out infinite;
}
:where([data-look="standard"], [data-look="standard"] *).ui-wa__typing i:nth-child(2) { animation-delay: var(--tc-duration-fast); }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__typing i:nth-child(3) { animation-delay: var(--tc-duration-slow); }
/* ---------- Prompt row ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-wa__row { display: flex; align-items: flex-end; gap: var(--tc-space-2); }
/* A failed reply or dictation, said plainly above the prompt */
:where([data-look="standard"], [data-look="standard"] *).ui-wa__error { position: relative; margin: -10px var(--tc-space-1-5) 0; font-size: var(--tc-font-size-sm); line-height: 1.4; color: var(--tc-status-danger-fg); }
/* Text wraps; the field grows up to four lines and the buttons stay at the bottom */
:where([data-look="standard"], [data-look="standard"] *).ui-wa__field {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: flex-end;
  gap: var(--tc-space-2);
  min-height: 54px;
  padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-5);
  border-radius: 27px;
  background: var(--tc-writing-assistant-field-bg);
  box-shadow: 0 0 0 1px var(--tc-border-default), 0 6px 18px rgba(0, 0, 0, 0.06), inset 0 -2px 6px rgba(0, 0, 0, 0.02);
  transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard);
}
/* Focused: a slightly stronger gray stroke */
:where([data-look="standard"], [data-look="standard"] *).ui-wa__field:focus-within { box-shadow: var(--tc-field-shadow-focus); }
/* Clean: the prompt row is the field – it shows the field focus ring while you type */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__row:has(textarea:focus) { box-shadow: var(--tc-field-shadow-focus); }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__field textarea {
  flex: 1;
  min-width: 0;
  height: 40px;
  margin: 0;
  padding: 9.5px 0;
  border: 0;
  background: none;
  outline: none;
  resize: none;
  font: inherit;
  font-size: 14.5px;
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  overflow-y: auto;
  scrollbar-width: none;
  /* Lines scrolled up fade out at the top edge instead of being cut */
  -webkit-mask-image: linear-gradient(transparent, #000 9px);
  mask-image: linear-gradient(transparent, #000 9px);
}
/* Chat */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__messages {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--tc-space-3);
  min-height: 0;
  padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-3-5);
  overflow-y: auto;
  scrollbar-width: none;
  /* Soft edges at the top and towards the prompt, so nothing ends in a hard cut */
  -webkit-mask-image: linear-gradient(transparent, #000 16px, #000 calc(100% - 12px), transparent);
  mask-image: linear-gradient(transparent, #000 16px, #000 calc(100% - 12px), transparent);
}
:where([data-look="clean"], [data-look="clean"] *).ui-wa__messages::-webkit-scrollbar { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__msg {
  max-width: 86%;
  margin: 0;
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  white-space: pre-wrap;
  overflow-wrap: break-word;
  color: var(--tc-text-primary);
  animation: ui-wa-in var(--tc-duration-slow) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-wa__msg--user { align-self: flex-end; padding: var(--tc-space-1-5) var(--tc-space-2-5); border-radius: var(--tc-radius-lg); background: var(--tc-fill-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__msg--assistant { align-self: flex-start; max-width: 94%; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__typing { color: var(--tc-text-muted); }
/* "Writing…": a dark band sweeps across a copy of the label */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__shimmer { position: relative; display: inline-block; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__shimmer::after {
  content: attr(data-text);
  content: attr(data-text) / "";
  position: absolute;
  inset: 0;
  white-space: nowrap;
  color: transparent;
  background: linear-gradient(90deg, transparent 38%, var(--tc-writing-assistant-shimmer) 50%, transparent 62%) 100% 0 / 300% 100% no-repeat;
  -webkit-background-clip: text;
  background-clip: text;
  animation: ui-wa-sweep 1.3s linear 3;
  pointer-events: none;
}
/* ---------- Prompt row: lies right in the card – no own fill, no line above ---------- */
/* A failed reply or dictation, said plainly above the prompt */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__error { position: relative; flex: none; margin: 0; padding: var(--tc-space-1) var(--tc-space-4) 0; font-size: var(--tc-font-size-md); line-height: 1.4; color: var(--tc-status-danger-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__row {
  position: relative;
  flex: none;
  display: flex;
  align-items: flex-end;
  gap: var(--tc-space-1);
  margin: 0;
  padding: var(--tc-space-1-5) var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-4);
}
/* Text wraps; the field grows up to four lines and the buttons stay at the bottom */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__field { flex: 1; min-width: 0; display: flex; margin-right: var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__field textarea {
  display: block;
  flex: 1;
  min-width: 0;
  height: 28px;
  margin: 0;
  padding: var(--tc-space-1) 0;
  border: 0;
  background: none;
  outline: none;
  resize: none;
  font: inherit;
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-strong);
  caret-color: var(--tc-accent-text);
  overflow-y: auto;
  scrollbar-width: none;
  /* Lines scrolled up fade out at the top edge instead of being cut */
  -webkit-mask-image: linear-gradient(transparent, #000 4px);
  mask-image: linear-gradient(transparent, #000 4px);
}
.ui-wa__field textarea::-webkit-scrollbar { display: none; }
.ui-wa__field textarea::placeholder { color: var(--tc-text-placeholder); opacity: 1; }
.ui-wa__field[data-listening] textarea { color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__send {
  display: grid;
  place-items: center;
  flex: none;
  width: 38px;
  height: 38px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--tc-surface-inverse);
  color: var(--tc-text-on-inverse) !important;
  animation: ui-wa-pop var(--tc-duration-moderate) var(--tc-ease-move) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-wa__send:disabled { opacity: 0.5; cursor: default; }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__send svg { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__mic {
  position: relative;
  display: grid;
  place-items: center;
  flex: none;
  width: 54px;
  height: 54px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--tc-writing-assistant-field-bg);
  box-shadow: 0 0 0 1px var(--tc-border-default), 0 6px 18px rgba(0, 0, 0, 0.06);
  transition: transform var(--tc-duration-base) var(--tc-ease-move), background-color var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-wa__mic:active { transform: scale(0.95); }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__mic:disabled { opacity: 0.6; cursor: default; }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__mic svg {
  position: relative;
  width: 22px;
  height: 22px;
  fill: none;
  stroke: var(--tc-text-primary);
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
/* Listening: the button turns dark, three calm bars move inside and a soft ring breathes outwards */
:where([data-look="standard"], [data-look="standard"] *).ui-wa__mic[data-listening] { background: var(--tc-text-primary); box-shadow: 0 0 0 1px var(--tc-text-primary), 0 6px 18px rgba(0, 0, 0, 0.12); }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__pulse {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  box-shadow: 0 0 0 0 color-mix(in srgb, var(--tc-text-primary) 18%, transparent);
  opacity: 0;
}
:where([data-look="standard"], [data-look="standard"] *).ui-wa__mic[data-listening] .ui-wa__pulse { opacity: 1; animation: ui-wa-ring var(--tc-duration-shimmer) var(--tc-ease-decelerate) infinite; }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__wave { position: relative; display: flex; align-items: center; gap: var(--tc-space-1); height: 16px; }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__wave i {
  width: 3px;
  height: 100%;
  border-radius: var(--tc-radius-2xs);
  background: var(--tc-surface-raised);
  transform: scaleY(0.35);
  animation: ui-wa-wave 1.1s ease-in-out infinite;
}
/* Send: the dark chip */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__send {
  display: grid;
  place-items: center;
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: var(--tc-radius-sm);
  background: var(--tc-surface-inverse) !important;
  color: var(--tc-text-on-inverse);
  transition: transform var(--tc-duration-fast) var(--tc-ease-move), opacity var(--tc-duration-fast) var(--tc-ease-standard);
  animation: ui-wa-pop var(--tc-duration-moderate) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-wa__send:disabled { opacity: 0.4; cursor: default; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__send:not(:disabled):active { transform: scale(0.94); }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__send svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
/* Mic: a ghost icon button */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__mic {
  position: relative;
  display: grid;
  place-items: center;
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: var(--tc-radius-sm);
  color: var(--tc-icon-muted);
  transition: background-color var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-wa__mic:not(:disabled):hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__mic:not(:disabled):active { transform: scale(0.94); }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__mic:disabled { opacity: 0.5; cursor: default; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__mic svg { position: relative; width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
/* Listening: a light accent tile, three calm bars inside and a soft ring breathing outwards */
:where([data-look="clean"], [data-look="clean"] *).ui-wa__mic[data-listening],
:where([data-look="clean"], [data-look="clean"] *).ui-wa__mic[data-listening]:hover { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__pulse { position: absolute; inset: 0; border-radius: var(--tc-radius-sm); opacity: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__mic[data-listening] .ui-wa__pulse { opacity: 1; animation: ui-wa-ring-clean var(--tc-duration-shimmer) var(--tc-ease-decelerate) infinite; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__wave { position: relative; display: flex; align-items: center; gap: var(--tc-space-0-5); height: 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__wave i {
  width: 2px;
  height: 100%;
  border-radius: 1px;
  background: currentColor;
  transform: scaleY(0.35);
  animation: ui-wa-wave 1.1s ease-in-out infinite;
}
.ui-wa__wave i:nth-child(2) { animation-delay: -0.35s; }
.ui-wa__wave i:nth-child(3) { animation-delay: -0.7s; }
@keyframes ui-wa-in { from { opacity: 0; transform: translateY(6px); } }
@keyframes ui-wa-pop { from { opacity: 0; transform: scale(0.6); } }
@keyframes ui-wa-ring { 0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--tc-text-primary) 16%, transparent); } 100% { box-shadow: 0 0 0 12px transparent; } }
@keyframes ui-wa-sweep { from { background-position: 100% 0; } to { background-position: 0% 0; } }
@keyframes ui-wa-ring-clean { 0% { box-shadow: 0 0 0 0 var(--tc-writing-assistant-pulse); } 100% { box-shadow: 0 0 0 7px transparent; } }
@keyframes ui-wa-wave { 0%, 100% { transform: scaleY(0.35); } 50% { transform: scaleY(1); } }
@keyframes ui-wa-dot { 0%, 100% { opacity: 0.3; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-2px); } }
@keyframes ui-wa-drift-a {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(55%, -22%) scale(1.25); }
  100% { transform: translate(20%, 14%) scale(0.85); }
}
@keyframes ui-wa-drift-b {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-55%, 24%) scale(0.85); }
  100% { transform: translate(-22%, -16%) scale(1.25); }
}
@keyframes ui-wa-drift-c {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-45%, -26%) scale(1.2); }
  100% { transform: translate(30%, -10%) scale(0.88); }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-wa__blob,
:where([data-look="standard"], [data-look="standard"] *).ui-wa__welcome,
:where([data-look="standard"], [data-look="standard"] *).ui-wa__msg,
:where([data-look="standard"], [data-look="standard"] *).ui-wa__send,
:where([data-look="standard"], [data-look="standard"] *).ui-wa__mic[data-listening] .ui-wa__pulse,
:where([data-look="standard"], [data-look="standard"] *).ui-wa__wave i,
:where([data-look="standard"], [data-look="standard"] *).ui-wa__typing i { animation: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-wa__wave i { transform: scaleY(0.7); }
}
/* Narrow containers: a little less padding */
@container (max-width: 330px) {
:where([data-look="clean"], [data-look="clean"] *).ui-wa__head { padding-left: var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__welcome,
:where([data-look="clean"], [data-look="clean"] *).ui-wa__messages { padding-left: var(--tc-space-3); padding-right: var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__row { padding-left: var(--tc-space-3); }
}
/* Touch screens: taller hit targets */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-wa__new,
:where([data-look="clean"], [data-look="clean"] *).ui-wa__mic,
:where([data-look="clean"], [data-look="clean"] *).ui-wa__send { width: 34px; height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__chip { padding: var(--tc-space-2) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__field textarea { padding: var(--tc-space-2) 0; }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="clean"], [data-look="clean"] *).ui-wa__blob,
:where([data-look="clean"], [data-look="clean"] *).ui-wa__welcome,
:where([data-look="clean"], [data-look="clean"] *).ui-wa__msg,
:where([data-look="clean"], [data-look="clean"] *).ui-wa__send,
:where([data-look="clean"], [data-look="clean"] *).ui-wa__mic[data-listening] .ui-wa__pulse,
:where([data-look="clean"], [data-look="clean"] *).ui-wa__wave i,
:where([data-look="clean"], [data-look="clean"] *).ui-wa__shimmer::after { animation: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-wa__wave i { transform: scaleY(0.7); }
}
/* Text fields: no focus box while typing – also against global :focus-visible rules of the host page */
[data-ui="wa"] input:not([type="checkbox"]):not([type="radio"]):focus-visible,
[data-ui="wa"] textarea:focus-visible,
[data-ui="wa"] [contenteditable]:focus-visible { outline: none; }
/* Dark mode: follows a .dark class or data-theme="dark" on any ancestor, e.g. <html> */
:where(.dark, [data-theme="dark"]) :where([data-look="standard"], [data-look="standard"] *)[data-ui="wa"] {
  --tc-writing-assistant-glow: 0.26; /* an opacity, not a colour */
}
/* Dark mode: follows a .dark class or data-theme="dark" on any ancestor, e.g. <html> */
:where(.dark, [data-theme="dark"]) :where([data-look="clean"], [data-look="clean"] *)[data-ui="wa"] {
  --tc-writing-assistant-glow: 0.14; /* an opacity, not a colour */
}

/* Lit port: the looping animations (typing dots, the listening pulse) pause while the card is scrolled away */
[data-ui="wa"][data-offscreen] * { animation-play-state: paused !important; }
`;
}

if (!customElements.get("tc-writing-assistant")) customElements.define("tc-writing-assistant", TcWritingAssistant);

declare global {
  interface HTMLElementTagNameMap {
    "tc-writing-assistant": TcWritingAssistant;
  }
}
