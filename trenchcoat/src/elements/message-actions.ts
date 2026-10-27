import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { reducedMotion } from "../internal/reduced-motion";
import { TcElement } from "./internal/base";
import { FocusRescueController, rescueFocus } from "./internal/controllers";
import type { Look } from "./internal/look";
import { adoptStyles } from "./internal/styles";

/*
 * <tc-message-actions> and <tc-message-text> – the Lit port of src/components/message-actions.tsx: the small bar under
 * an AI chat message.
 *   · Copy: the icon turns into a check and the tooltip says "Copied"
 *   · Regenerate: the arrow spins once; with more than one version a "‹ 2 / 3 ›" switcher unfolds next to it
 *   · Thumbs up / down fill with a little pop; thumbs down unfolds a short feedback row with reasons and a send button
 *   · Read aloud: the speaker becomes a tiny equalizer while it plays, a second press stops it
 * The bar stays quiet (its icons a step lighter) until the message is hovered or something inside it is focused.
 * <tc-message-text> crossfades the message itself when the version changes.
 *
 *   <tc-message-actions text="Hello" .versions=${["Hello", "Hi"]}></tc-message-actions>
 *
 * Clean uses ghost icon buttons with thin or solid 16px glyphs, a pressed action takes the selected-tab look, the
 * feedback reasons are tab buttons and Send is the dark chip.
 */

export type MessageActionKey = "copy" | "regenerate" | "feedback" | "speak";
export type FeedbackKind = "up" | "down";

/** Details of the events */
export type MessageVersionChange = { version: number };
export type MessageFeedbackDetail = { feedback: FeedbackKind | null; reason?: string };

const isPromise = (value: unknown): value is Promise<unknown> => !!value && typeof (value as Promise<unknown>).then === "function";

// Warns once per page (not per instance) when Read aloud only animates, with nothing actually reading
let warnedSimulatedSpeech = false;
const warnSimulatedSpeech = () => {
  if (warnedSimulatedSpeech) return;
  warnedSimulatedSpeech = true;
  console.warn(
    "MessageActions: no onSpeak handler and no speech synthesis – simulating read aloud. Pass `demo` to keep the simulation, or `onSpeak` / `speaking` to wire it up. The simulation will be off by default in the next major version.",
  );
};

/** The browser's text-to-speech, where there is one */
const synthesis = () => (typeof window !== "undefined" && window.speechSynthesis && typeof SpeechSynthesisUtterance !== "undefined" ? window.speechSynthesis : null);

/* ---------- Icons ---------- */

/* Standard: 24-unit outline icons drawn at 16px */
const glyph = (d: string) => html`<svg viewBox="0 0 24 24" class="ui-ma__glyph" aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;
const paths = {
  copy: "M9 9.5A1.5 1.5 0 0 1 10.5 8h8A1.5 1.5 0 0 1 20 9.5v9a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 9 18.5zM15 8V5.5A1.5 1.5 0 0 0 13.5 4h-8A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H9",
  check: "M5.5 12.5l4.2 4.2L18.5 7.8",
  redo: "M19.5 12a7.5 7.5 0 1 1-2.2-5.3L19.5 9M19.5 4.5V9H15",
  thumb: "M7.5 10.5v9M7.5 10.5l3.3-6a1.8 1.8 0 0 1 3.3 1.2l-.6 3.8H18a2 2 0 0 1 2 2.3l-1.2 6.4a2 2 0 0 1-2 1.8H5a1 1 0 0 1-1-1v-7.5a1 1 0 0 1 1-1z",
  speaker: "M11 5.5 6.8 9H4v6h2.8l4.2 3.5zM15.2 9.2a4 4 0 0 1 0 5.6M17.9 6.6a7.8 7.8 0 0 1 0 10.8",
  prev: "m14.5 7-5 5 5 5",
  next: "m9.5 7 5 5-5 5",
  close: "m7.5 7.5 9 9m0-9-9 9",
};

/* Clean: 16px glyphs, thin or solid */
const cleanGlyph = (d: string, solid?: boolean) =>
  html`<svg viewBox="0 0 16 16" class="ui-ma__glyph" data-solid=${ifDefined(solid ? "" : undefined)} aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;
/** The speaker: a solid body with two thin sound waves */
const speakerIcon = html`<svg viewBox="0 0 16 16" class="ui-ma__glyph" aria-hidden="true">${svg`<path class="ui-ma__fill" d="M7.4 3.2a.6.6 0 0 1 1 .46v8.68a.6.6 0 0 1-1 .46L4.6 10.5H3A1.5 1.5 0 0 1 1.5 9V7A1.5 1.5 0 0 1 3 5.5h1.6l2.8-2.3Z"></path><path d="M10.6 6.2a2.6 2.6 0 0 1 0 3.6M12.4 4.4a5.2 5.2 0 0 1 0 7.2"></path>`}</svg>`;
const cleanPaths = {
  copy: "M5.5 2A1.5 1.5 0 0 0 4 3.5V4h5A3 3 0 0 1 12 7v5h.5a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 12.5 2h-7ZM3.5 5A1.5 1.5 0 0 0 2 6.5v6A1.5 1.5 0 0 0 3.5 14H9a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 9 5H3.5Z",
  check: "M1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Zm8.9-1.2a.5.5 0 0 0-.8-.6L7.44 9.23 6.35 8.15a.5.5 0 1 0-.7.7l1.5 1.5a.5.5 0 0 0 .76-.06l2.5-3.5Z",
  tick: "M3.5 8.5 6.5 11.5 12.5 4.5",
  redo: "M13 8a5 5 0 1 1-1.46-3.54M13 2.5v2.5h-2.5",
  thumb: "M4.5 7v6.5H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1.5Zm1 6.5h5.95a1.5 1.5 0 0 0 1.47-1.2l.86-4.3A1.5 1.5 0 0 0 12.31 6.2H9.5l.42-2.08A1.4 1.4 0 0 0 7.3 3.1L5.5 6.8v6.7Z",
  next: "M10.85 7.65a.5.5 0 0 1 0 .7L7.2 12a.5.5 0 0 1-.7-.7L9.79 8 6.5 4.7a.5.5 0 1 1 .7-.7l3.65 3.65Z",
  close: "m4.5 4.5 7 7m0-7-7 7",
};

type IconName = "copy" | "copied" | "redo" | "prev" | "next" | "thumb" | "speaker" | "close" | "sent";
/** Each look's icons; Clean's previous arrow is the next one, mirrored by its CSS */
const ICONS: Record<Look, Record<IconName, TemplateResult>> = {
  standard: {
    copy: glyph(paths.copy),
    copied: glyph(paths.check),
    redo: glyph(paths.redo),
    prev: glyph(paths.prev),
    next: glyph(paths.next),
    thumb: glyph(paths.thumb),
    speaker: glyph(paths.speaker),
    close: glyph(paths.close),
    sent: glyph(paths.check),
  },
  clean: {
    copy: cleanGlyph(cleanPaths.copy, true),
    copied: cleanGlyph(cleanPaths.check, true),
    redo: cleanGlyph(cleanPaths.redo),
    prev: cleanGlyph(cleanPaths.next, true),
    next: cleanGlyph(cleanPaths.next, true),
    thumb: cleanGlyph(cleanPaths.thumb, true),
    speaker: speakerIcon,
    close: cleanGlyph(cleanPaths.close),
    sent: cleanGlyph(cleanPaths.tick),
  },
};

const DEFAULT_ACTIONS: MessageActionKey[] = ["copy", "regenerate", "feedback", "speak"];
const DEFAULT_REASONS = ["Not accurate", "Too long", "Didn't follow instructions", "Other"];

/* ---------- Swap: text that changes without a jump ---------- */

type SwapState = { id: string; content: unknown; out: { id: string; content: unknown } | null; timer: number };

/**
 * Crossfades named slots of content: when a slot's id changes, the old content fades out underneath while the new one
 * fades in, then goes after 300 ms. One per element; `clear()` on disconnect.
 */
class Swaps {
  private slots = new Map<string, SwapState>();
  constructor(private host: { requestUpdate(): void }) {}

  render(slot: string, id: string, content: unknown, className?: string) {
    let s = this.slots.get(slot);
    if (!s) {
      s = { id, content, out: null, timer: 0 };
      this.slots.set(slot, s);
    } else if (s.id !== id) {
      const st = s;
      st.out = { id: st.id, content: st.content };
      clearTimeout(st.timer);
      st.timer = window.setTimeout(() => {
        st.out = null;
        this.host.requestUpdate();
      }, 300);
      st.id = id;
    }
    s.content = content;
    const items = [...(s.out ? [{ key: `out-${s.out.id}`, out: true, content: s.out.content }] : []), { key: id, out: false, content }];
    return html`<span class=${className ? `ui-ma__swap ${className}` : "ui-ma__swap"}>${repeat(
      items,
      (i) => i.key,
      (i) => html`<span class="ui-ma__swap-item" data-out=${ifDefined(i.out ? "" : undefined)} aria-hidden=${ifDefined(i.out ? "true" : undefined)}>${i.content}</span>`,
    )}</span>`;
  }

  clear() {
    for (const s of this.slots.values()) {
      clearTimeout(s.timer);
      s.out = null;
    }
  }
}

let uid = 0;

/**
 * The action bar under an AI chat message: copy, regenerate with a version switcher, thumbs with a feedback row, and
 * read aloud.
 * @tag tc-message-actions
 * @fires tc-version-change - A version was picked in the switcher; detail `{ version: number }` (0-based). Cancelable: preventDefault() keeps the shown version (controlled use)
 * @fires tc-copy - `text` is on the clipboard (or Copy was pressed without `text`); detail `{ text?: string }`
 * @fires tc-feedback - A thumb was pressed or taken back, or the feedback row was sent; detail `{ feedback: "up" | "down" | null, reason?: string }`
 * @fires tc-speak - Read aloud started or stopped; detail `{ playing: boolean }`
 */
export class TcMessageActions extends TcElement {
  static override ui = "ma";

  /** The message text – copied to the clipboard by Copy and used to time Read aloud */
  @property() accessor text: string | undefined = undefined;
  /** Which actions to show, in this order */
  @property({ attribute: false }) accessor actions: MessageActionKey[] = DEFAULT_ACTIONS;
  /** All versions of the message, or just how many there are. From 2 on the version switcher shows */
  @property({ attribute: false }) accessor versions: number | string[] | undefined = undefined;
  /** The shown version (0-based); unset, the bar keeps it, starting at `defaultVersion` and jumping to new versions */
  @property({ type: Number }) accessor version: number | undefined = undefined;
  /** Starting version while `version` is unset – defaults to the newest */
  @property({ type: Number, attribute: "default-version" }) accessor defaultVersion: number | undefined = undefined;
  /**
   * Called when Regenerate is pressed – add a version and the switcher jumps to it. Return a promise to keep the arrow
   * spinning until it settles; a rejection says "Couldn't regenerate". `signal` aborts when the element is removed
   */
  @property({ attribute: false }) accessor onRegenerate: ((options: { signal: AbortSignal }) => void | Promise<unknown>) | undefined = undefined;
  /** Keeps the regenerate arrow spinning while a new version is written */
  @property({ type: Boolean }) accessor regenerating = false;
  /**
   * Called with "up" or "down" when a thumb is pressed, null when it is taken back, and "down" with a reason when the
   * feedback row is sent. Sending may return a promise: "Thanks!" shows once it resolves, a rejection lets you send again
   */
  @property({ attribute: false }) accessor onFeedback: ((kind: FeedbackKind | null, reason?: string) => void | Promise<unknown>) | undefined = undefined;
  /** The vote: "up", "down" or null for none. Unset, the bar keeps it, starting at `defaultFeedback` */
  @property({ attribute: false }) accessor feedback: FeedbackKind | null | undefined = undefined;
  /** The vote to start with while `feedback` is unset */
  @property({ attribute: false }) accessor defaultFeedback: FeedbackKind | null = null;
  /** Quick reasons in the feedback row. "Other" opens a small text field */
  @property({ attribute: false }) accessor reasons: string[] = DEFAULT_REASONS;
  /**
   * Set when you play the audio yourself (listen to tc-speak): the bar then doesn't read `text` with the browser's
   * speech synthesis. Without it (and without `speaking`) the browser reads `text`; where there is none, reading is
   * simulated (and warns once, unless `demo` is set)
   */
  @property({ type: Boolean, attribute: "own-speech" }) accessor ownSpeech = false;
  /** Controlled playing state, e.g. tied to your speech player */
  @property({ type: Boolean }) accessor speaking: boolean | undefined = undefined;
  /** How long an uncontrolled read aloud plays when it isn't the browser speaking, in ms – defaults to an estimate from `text` */
  @property({ type: Number, attribute: "speak-duration" }) accessor speakDuration: number | undefined = undefined;
  /** Demo mode: Read aloud is simulated silently where it would be simulated. For galleries and prototypes */
  @property({ type: Boolean }) accessor demo = false;
  /** Lighter icons until the message is hovered (default true; quiet="false" turns it off). Put data-ui-message on the message wrapper */
  @property({ converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor quiet = true;
  /** Accessible name of the bar */
  @property() accessor label = "Message actions";

  /** @internal */ @state() accessor innerVersion = 0;
  /** @internal */ @state() accessor innerVote: FeedbackKind | null = null;
  /** @internal */ @state() accessor panel = false;
  /** @internal */ @state() accessor reason: string | null = null;
  /** @internal */ @state() accessor other = "";
  /** @internal */ @state() accessor sent = false;
  /** @internal */ @state() accessor sending = false;
  /** @internal */ @state() accessor status = "";
  /** @internal A new object per attempt, so pressing again restarts the timer */
  @state() accessor copyResult: { ok: boolean } | null = null;
  /** @internal */ @state() accessor spin = 0;
  /** @internal */ @state() accessor regenPending = false;
  /** @internal */ @state() accessor regenFailed = 0;
  /** @internal */ @state() accessor innerSpeaking = false;
  /** @internal */ @state() accessor hush = false;

  private readonly uid = `tc-ma-${++uid}`;
  private readonly swaps = new Swaps(this);
  private seenCount: number | undefined = undefined;
  private alive = false;
  private voice: SpeechSynthesisUtterance | null = null;
  private regenAbort: AbortController | null = null;
  private timers = new Map<string, number>();

  constructor() {
    super();
    // Focus never drops to <body>: when the focused control folds away (the "Other" field once sent, the feedback
    // row closing, the version switcher), it goes to Send, else to Bad response, else to the bar's first button
    new FocusRescueController(
      this,
      (key) =>
        (key?.startsWith("version-") ? this.querySelector<HTMLElement>(`[data-focus-key="version-${key === "version-prev" ? "next" : "prev"}"]`) : null) ??
        (this.panel ? this.querySelector<HTMLElement>(".ui-ma__send") : null) ??
        this.downButton ??
        this.querySelector<HTMLElement>(".ui-ma__btn"),
    );
  }

  private get downButton() {
    return this.querySelector<HTMLElement>(".ui-ma__btn--down");
  }
  private get panelEl() {
    return this.querySelector<HTMLElement>(`#${this.uid}-feedback`);
  }

  /** @internal How many versions there are */
  get count() {
    const v = this.versions;
    return Math.max(1, typeof v === "number" ? Math.floor(v) : (v?.length ?? 1));
  }
  /** @internal The shown version */
  get index() {
    return Math.min(this.count - 1, Math.max(0, this.version ?? this.innerVersion));
  }
  /** @internal The vote in use */
  get vote() {
    return this.feedback !== undefined ? this.feedback : this.innerVote;
  }
  /** @internal Read aloud is playing */
  get playing() {
    return this.speaking ?? this.innerSpeaking;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.alive = true;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    // Clipboard writes, regenerations and speech that finish after removal are ignored
    this.alive = false;
    this.regenAbort?.abort();
    if (this.voice) {
      this.voice = null;
      synthesis()?.cancel();
    }
    for (const t of this.timers.values()) clearTimeout(t);
    this.timers.clear();
    this.swaps.clear();
  }

  /** Runs `fn` after `ms`, replacing the timer of the same name */
  private later(name: string, ms: number, fn: () => void) {
    clearTimeout(this.timers.get(name));
    this.timers.set(
      name,
      window.setTimeout(() => {
        this.timers.delete(name);
        fn();
      }, ms),
    );
  }
  private cancel(name: string) {
    clearTimeout(this.timers.get(name));
    this.timers.delete(name);
  }

  private announce(s: string) {
    this.status = this.status === s ? `${s} ` : s;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const count = this.count;
    if (this.seenCount === undefined) {
      this.innerVersion = Math.min(count - 1, Math.max(0, this.defaultVersion ?? count - 1));
      this.innerVote = this.defaultFeedback;
    } else if (count > this.seenCount) {
      // A new version arrived: show it, and its vote starts fresh (a set vote is the page's to reset)
      this.innerVersion = count - 1;
      if (this.feedback === undefined) this.innerVote = null;
      this.panel = false;
    }
    this.seenCount = count;
    if (changed.has("copyResult") && this.copyResult) this.later("copy", 1600, () => (this.copyResult = null));
    if (changed.has("regenFailed") && this.regenFailed) this.later("regen", 1600, () => (this.regenFailed = 0));
    // An uncontrolled read aloud that isn't the browser speaking ends after its duration
    if (changed.has("innerSpeaking") || changed.has("speaking")) {
      if (this.speaking === undefined && this.innerSpeaking && !this.voice) {
        const words = this.text ? this.text.trim().split(/\s+/).length : 0;
        this.later("speak", this.speakDuration ?? Math.max(2600, words * 380), () => {
          this.innerSpeaking = false;
          this.emit("tc-speak", { playing: false });
          this.announce("Finished reading");
        });
      } else this.cancel("speak");
    }
    // "Thanks!" folds the row away after a beat – but not while focus is inside it (WCAG 2.2.1): then it closes when
    // focus leaves, or with Esc / ×
    if (changed.has("sent")) {
      if (this.sent)
        this.later("sent", reducedMotion() ? 1200 : 1500, () => {
          if (!this.panelEl?.contains(document.activeElement)) this.panel = false;
        });
      else this.cancel("sent");
    }
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const copied = this.copyResult?.ok === true;
    this.toggleAttribute("data-quiet", this.quiet);
    this.toggleAttribute("data-active", copied || this.panel || this.playing || this.regenerating || this.regenPending);
    this.toggleAttribute("data-hush", this.hush);
  }

  /* ----- Versions ----- */
  private goTo(i: number) {
    const count = this.count;
    const next = Math.min(count - 1, Math.max(0, i));
    if (next === this.index) return;
    if (this.emit<MessageVersionChange>("tc-version-change", { version: next }, { cancelable: true })) {
      if (this.version !== undefined) this.version = next;
      else this.innerVersion = next;
    }
    this.announce(`Version ${next + 1} of ${count}`);
  }

  /* ----- Copy ----- */
  private async copy() {
    const text = this.text;
    if (text === undefined) {
      this.emit("tc-copy", { text });
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Denied, or no clipboard at all (insecure page): say so instead of a check
      if (!this.alive) return;
      this.copyResult = { ok: false };
      this.announce("Couldn't copy");
      return;
    }
    if (!this.alive) return;
    this.emit("tc-copy", { text });
    this.copyResult = { ok: true };
    this.announce("Copied");
  }

  /* ----- Regenerate: the arrow spins once per press; a promise keeps it busy, a rejection says so ----- */
  private regenerate() {
    if (this.regenPending) return;
    this.spin++;
    this.regenFailed = 0;
    this.announce("Regenerating");
    const controller = new AbortController();
    this.regenAbort = controller;
    const result = this.onRegenerate?.({ signal: controller.signal });
    if (!isPromise(result)) return;
    this.regenPending = true;
    result.then(
      () => {
        if (!this.alive) return;
        this.regenPending = false;
      },
      () => {
        if (!this.alive || controller.signal.aborted) return;
        this.regenPending = false;
        this.regenFailed++;
        this.announce("Couldn't regenerate");
      },
    );
  }

  /* ----- Feedback ----- */
  private setVote(v: FeedbackKind | null) {
    if (this.feedback === undefined) this.innerVote = v;
  }
  private report(kind: FeedbackKind | null, reason?: string) {
    this.emit<MessageFeedbackDetail>("tc-feedback", reason === undefined ? { feedback: kind } : { feedback: kind, reason });
    return this.onFeedback?.(kind, reason);
  }
  private thumbsUp() {
    if (this.vote === "up") {
      this.setVote(null);
      this.report(null);
      return;
    }
    this.setVote("up");
    this.panel = false;
    this.report("up");
    this.announce("Marked as good response");
  }
  private thumbsDown() {
    if (this.vote === "down") {
      this.setVote(null);
      this.panel = false;
      this.report(null);
      return;
    }
    this.setVote("down");
    this.panel = true;
    this.sent = false;
    this.reason = null;
    this.other = "";
    this.report("down");
    this.announce("Marked as bad response. Tell us what went wrong below");
  }
  private send() {
    const reason = this.reason;
    if (!reason || this.sent || this.sending) return;
    const result = this.report("down", reason === "Other" ? this.other.trim() || "Other" : reason);
    if (!isPromise(result)) {
      this.sent = true;
      this.announce("Thanks for the feedback");
      return;
    }
    this.sending = true;
    result.then(
      () => {
        if (!this.alive) return;
        this.sending = false;
        this.sent = true;
        this.announce("Thanks for the feedback");
      },
      () => {
        if (!this.alive) return;
        this.sending = false;
        this.announce("Couldn't send the feedback. Try again");
      },
    );
  }
  private closePanel() {
    // Esc / × from inside the row: focus goes back to Bad response before the row goes inert
    rescueFocus(this.panelEl, [this.downButton]);
    this.panel = false;
  }

  /* ----- Read aloud: the browser's speech synthesis when nobody plays it, otherwise a timed (or controlled) state ----- */
  private say(synth: SpeechSynthesis, line: string) {
    const utterance = new SpeechSynthesisUtterance(line);
    const end = (finished: boolean) => {
      if (this.voice !== utterance) return;
      this.voice = null;
      if (!this.alive) return;
      this.innerSpeaking = false;
      this.announce(finished ? "Finished reading" : "Couldn't read aloud");
    };
    utterance.onend = () => end(true);
    utterance.onerror = () => end(false);
    this.voice = utterance;
    synth.cancel();
    synth.speak(utterance);
  }
  private speak() {
    const next = !this.playing;
    const text = this.text;
    if (this.speaking === undefined) {
      if (!this.ownSpeech) {
        const synth = text ? synthesis() : null;
        if (!next && this.voice) {
          this.voice = null;
          synth?.cancel();
        } else if (next && synth && text) this.say(synth, text);
        else if (next && !this.demo) warnSimulatedSpeech();
      }
      this.innerSpeaking = next;
    }
    this.emit("tc-speak", { playing: next });
    this.announce(next ? "Reading aloud" : "Stopped reading");
  }

  /** One button with its tooltip */
  private button(o: {
    name: string;
    tip: string;
    labelText: string;
    onClick: () => void;
    content: unknown;
    pressed?: boolean;
    flash?: boolean;
    done?: boolean;
    busy?: boolean;
    expanded?: boolean;
    controls?: string;
  }) {
    return html`<span class="ui-ma__item" data-flash=${ifDefined(o.flash ? "" : undefined)}>
      <button
        type="button"
        class="ui-ma__btn ui-ma__btn--${o.name}"
        aria-label=${o.labelText}
        aria-pressed=${ifDefined(o.pressed === undefined ? undefined : o.pressed ? "true" : "false")}
        aria-expanded=${ifDefined(o.expanded === undefined ? undefined : o.expanded ? "true" : "false")}
        aria-controls=${ifDefined(o.controls)}
        data-done=${ifDefined(o.done ? "" : undefined)}
        data-busy=${ifDefined(o.busy ? "" : undefined)}
        aria-busy=${ifDefined(o.busy ? "true" : undefined)}
        @click=${o.onClick}
      >${o.content}</button>
      <span class="ui-ma__tip" aria-hidden="true">${this.swaps.render(`tip-${o.name}`, o.tip, o.tip)}</span>
    </span>`;
  }

  /** "‹ 2 / 3 ›" – unfolds next to Regenerate once there is more than one version */
  private versionSwitcher(icon: Record<IconName, TemplateResult>) {
    const index = this.index;
    const count = this.count;
    return html`<span class="ui-ma__versions" data-open=${ifDefined(count > 1 ? "" : undefined)} .inert=${count < 2}>
      <span class="ui-ma__versions-clip" role="group" aria-label="Versions">
        <button type="button" class="ui-ma__step" data-dir="prev" data-focus-key="version-prev" aria-label="Previous version" ?disabled=${index === 0} @click=${() => this.goTo(index - 1)}>${icon.prev}</button>
        <span class="ui-ma__count" aria-label="Version ${index + 1} of ${count}">
          ${this.swaps.render("count-now", String(index), index + 1, "ui-ma__count-now")}
          <span aria-hidden="true">/</span>
          ${this.swaps.render("count-all", String(count), count)}
        </span>
        <button type="button" class="ui-ma__step" data-dir="next" data-focus-key="version-next" aria-label="Next version" ?disabled=${index >= count - 1} @click=${() => this.goTo(index + 1)}>${icon.next}</button>
      </span>
    </span>`;
  }

  /** "What went wrong?" – reasons as chips, Send, and a line of your own for "Other" */
  private feedbackPanel(icon: Record<IconName, TemplateResult>) {
    const id = `${this.uid}-feedback`;
    const { panel: open, reasons, reason, sent, sending } = this;
    return html`<div
      id=${id}
      class="ui-ma__fold"
      data-open=${ifDefined(open ? "" : undefined)}
      .inert=${!open}
      @focusout=${(e: FocusEvent) => {
        if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null) && this.sent) this.panel = false;
      }}
    >
      <div class="ui-ma__clip">
        <div
          class="ui-ma__panel"
          role="group"
          aria-labelledby="${id}-ask"
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              this.closePanel();
            }
          }}
        >
          <div class="ui-ma__panel-head">
            <span id="${id}-ask" class="ui-ma__ask">What went wrong?</span>
            <button type="button" class="ui-ma__close" aria-label="Close feedback" @click=${() => this.closePanel()}>${icon.close}</button>
          </div>
          <div class="ui-ma__chips">
            ${repeat(
              reasons,
              (r) => r,
              (r) => html`<button type="button" class="ui-ma__chip" aria-pressed=${reason === r ? "true" : "false"} ?disabled=${sent} @click=${() => (this.reason = reason === r ? null : r)}>${r}</button>`,
            )}
            <button
              type="button"
              class="ui-ma__send"
              data-sent=${ifDefined(sent ? "" : undefined)}
              ?disabled=${!reason}
              aria-disabled=${ifDefined(sent || sending ? "true" : undefined)}
              aria-busy=${ifDefined(sending ? "true" : undefined)}
              @click=${() => this.send()}
            >${this.swaps.render("send", sent ? "sent" : "send", sent ? html`${icon.sent}Thanks!` : "Send")}</button>
          </div>
          ${reasons.includes("Other")
            ? html`<div class="ui-ma__fold" data-open=${ifDefined(reason === "Other" && !sent ? "" : undefined)} .inert=${reason !== "Other" || sent}>
                <div class="ui-ma__clip">
                  <input
                    class="ui-ma__input"
                    .value=${this.other}
                    placeholder="Tell us more (optional)"
                    aria-label="What went wrong, in your words"
                    @input=${(e: InputEvent) => (this.other = (e.target as HTMLInputElement).value)}
                    @keydown=${(e: KeyboardEvent) => {
                      if (e.key === "Enter" && !e.isComposing) this.send();
                    }}
                  />
                </div>
              </div>`
            : nothing}
        </div>
      </div>
    </div>`;
  }

  protected override render() {
    const icon = ICONS[this.resolvedLook];
    const copied = this.copyResult?.ok === true;
    const copyFailed = this.copyResult?.ok === false;
    const busy = this.regenerating || this.regenPending;
    const vote = this.vote;
    const playing = this.playing;

    const parts = this.actions.map((key) => {
      if (key === "copy")
        return this.button({
          name: "copy",
          tip: copied ? "Copied" : copyFailed ? "Couldn't copy" : "Copy",
          labelText: copied ? "Copied" : copyFailed ? "Couldn't copy" : "Copy message",
          onClick: () => void this.copy(),
          flash: copied,
          done: copied,
          content: html`<span class="ui-ma__icon ui-ma__morph">
            <span class="ui-ma__layer" data-on=${ifDefined(copied ? undefined : "")}>${icon.copy}</span>
            <span class="ui-ma__layer ui-ma__layer--check" data-on=${ifDefined(copied ? "" : undefined)}>${icon.copied}</span>
          </span>`,
        });
      if (key === "regenerate")
        return html`<span class="ui-ma__regen">
          ${this.button({
            name: "regenerate",
            tip: busy ? "Writing…" : this.regenFailed ? "Couldn't regenerate" : "Regenerate",
            labelText: "Regenerate response",
            onClick: () => this.regenerate(),
            busy,
            content: html`<span class="ui-ma__icon">${keyed(this.spin, html`<span class="ui-ma__spin" data-spin=${ifDefined(this.spin ? "" : undefined)}>${icon.redo}</span>`)}</span>`,
          })}
          ${this.versionSwitcher(icon)}
        </span>`;
      if (key === "feedback")
        return html`${this.button({
          name: "up",
          tip: vote === "up" ? "Thanks!" : "Good response",
          labelText: "Good response",
          pressed: vote === "up",
          onClick: () => this.thumbsUp(),
          content: html`<span class="ui-ma__icon ui-ma__thumb">${icon.thumb}</span>`,
        })}${this.button({
          name: "down",
          tip: "Bad response",
          labelText: "Bad response",
          pressed: vote === "down",
          expanded: this.panel,
          controls: `${this.uid}-feedback`,
          onClick: () => this.thumbsDown(),
          content: html`<span class="ui-ma__icon ui-ma__thumb">${icon.thumb}</span>`,
        })}`;
      return this.button({
        name: "speak",
        tip: playing ? "Stop" : "Read aloud",
        labelText: playing ? "Stop reading" : "Read aloud",
        pressed: playing,
        onClick: () => this.speak(),
        content: html`<span class="ui-ma__icon ui-ma__morph">
          <span class="ui-ma__layer" data-on=${ifDefined(playing ? undefined : "")}>${icon.speaker}</span>
          <span class="ui-ma__layer ui-ma__eq" data-on=${ifDefined(playing ? "" : undefined)}><i></i><i></i><i></i><i></i></span>
        </span>`,
      });
    });

    return html`
      <div
        class="ui-ma__bar"
        role="group"
        aria-label=${this.label}
        @keydown=${(e: KeyboardEvent) => {
          // Tooltips hide with Esc without moving focus (WCAG 1.4.13); they come back with the next hover or focus
          if (e.key === "Escape" && !this.hush) {
            e.stopPropagation();
            this.hush = true;
          }
        }}
        @focusin=${() => (this.hush = false)}
        @pointerenter=${() => (this.hush = false)}
      >${parts}</div>
      ${this.actions.includes("feedback") ? this.feedbackPanel(icon) : nothing}
      <span class="ui-ma__sr" aria-live="polite">${this.status}</span>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ma"] {
  box-sizing: border-box;
  display: block;
  width: 100%;
  min-width: 0;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="ma"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ma"] {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  display: block;
  width: 100%;
  min-width: 0;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="ma"] *, [data-ui="ma"] *::before, [data-ui="ma"] *::after { box-sizing: border-box; }
:where([data-ui="ma"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="ma"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="ma"] svg { display: block; flex: none; }
.ui-ma__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* ----- The bar: quiet until the message is hovered, something inside is focused or busy ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-ma__bar { display: flex; align-items: center; gap: var(--tc-space-0-5); min-height: var(--tc-control-h-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__bar { display: flex; align-items: center; gap: var(--tc-space-0-5); min-height: var(--tc-control-h-md); }
/* Quiet: the icons step back to the muted icon tone (≥ 3:1) instead of fading the whole bar, which took icons and
   the version count below contrast (WCAG 1.4.3 / 1.4.11) */
[data-ui="ma"][data-quiet] { --tc-message-actions-quiet: var(--tc-icon-muted); }
[data-ui="ma"][data-quiet]:hover,
[data-ui="ma"][data-quiet]:focus-within,
[data-ui="ma"][data-quiet][data-active],
:where([data-ui-message]:hover, [data-ui-message]:focus-within) [data-ui="ma"][data-quiet] { --tc-message-actions-quiet: initial; }
.ui-ma__item { position: relative; display: inline-flex; flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__btn { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-message-actions-quiet, var(--tc-text-muted)); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__btn:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__btn { display: grid; place-items: center; width: var(--tc-control-h-md); height: var(--tc-control-h-md); border-radius: var(--tc-control-radius-md); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__btn:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
.ui-ma__btn:active .ui-ma__icon { transform: scale(0.9); }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__btn[aria-pressed="true"] { color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__btn--speak[aria-pressed="true"] { color: var(--tc-accent-text); background: var(--tc-accent-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__btn[aria-pressed="true"],
:where([data-look="clean"], [data-look="clean"] *).ui-ma__btn[aria-pressed="true"]:hover { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 1px var(--tc-border-selected); color: var(--tc-accent-text); }
.ui-ma__btn--copy[data-done] { color: var(--tc-status-success-fg); }
.ui-ma__icon { position: relative; display: grid; place-items: center; width: 16px; height: 16px; transition: transform var(--tc-duration-fast) var(--tc-ease-move); }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__glyph[data-solid] { fill: currentColor; stroke: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__fill { fill: currentColor; stroke: none; }
/* Two icons on top of each other – one blurs away while the other comes in */
.ui-ma__morph { display: grid; }
.ui-ma__layer { grid-area: 1 / 1; display: grid; place-items: center; opacity: 0; transform: scale(0.6); filter: blur(2px); transition: opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-slow) var(--tc-ease-move), filter var(--tc-duration-base) var(--tc-ease-standard); }
.ui-ma__layer[data-on] { opacity: 1; transform: none; filter: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__layer--check .ui-ma__glyph { stroke-width: 2; stroke-dasharray: 22; stroke-dashoffset: 22; }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__layer--check[data-on] .ui-ma__glyph { stroke-dashoffset: 0; transition: stroke-dashoffset var(--tc-duration-slow) var(--tc-ease-move) 60ms; }
/* Regenerate spins once per press, and keeps going while busy */
.ui-ma__spin { display: grid; place-items: center; }
.ui-ma__spin[data-spin] { animation: ui-ma-spin var(--tc-duration-reveal) var(--tc-ease-move); }
.ui-ma__btn[data-busy] { color: var(--tc-text-primary); }
.ui-ma__btn[data-busy] .ui-ma__spin { animation: ui-ma-spin var(--tc-duration-reveal-slow) linear infinite; }
/* Thumbs: down is the same glyph turned around; a vote fills it with a little pop */
:where([data-look="standard"], [data-look="standard"] *).ui-ma__btn--down .ui-ma__glyph { transform: rotate(180deg); }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__thumb .ui-ma__glyph { transition: fill var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__btn[aria-pressed="true"] .ui-ma__thumb { animation: ui-ma-pop var(--tc-duration-slower) var(--tc-ease-move); }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__btn[aria-pressed="true"] .ui-ma__thumb .ui-ma__glyph { fill: currentColor; }
/* Read aloud: four bars that bounce while it plays */
:where([data-look="standard"], [data-look="standard"] *).ui-ma__eq { display: flex; align-items: center; justify-content: center; gap: var(--tc-space-0-5); width: 16px; height: 16px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__eq i { display: block; width: 2px; height: 12px; border-radius: var(--tc-radius-2xs); background: currentColor; transform: scaleY(0.3); }
/* Thumbs: down is the same glyph turned upside down; a vote gives it a little pop */
:where([data-look="clean"], [data-look="clean"] *).ui-ma__btn--down .ui-ma__glyph { transform: scaleY(-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__btn[aria-pressed="true"] .ui-ma__thumb { animation: ui-ma-pop-clean var(--tc-duration-slower) var(--tc-ease-move); }
/* Read aloud: four bars in the accent blue that bounce while it plays */
:where([data-look="clean"], [data-look="clean"] *).ui-ma__eq { display: flex; align-items: center; justify-content: center; gap: var(--tc-space-0-5); width: 16px; height: 16px; color: var(--tc-accent-text); }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__eq i { display: block; width: 2px; height: 11px; border-radius: var(--tc-radius-2xs); background: currentColor; transform: scaleY(0.3); }
.ui-ma__eq[data-on] i { animation: ui-ma-eq var(--tc-duration-reveal-slow) var(--tc-ease-in-out) infinite; }
.ui-ma__eq[data-on] i:nth-child(2) { animation-delay: -300ms; animation-duration: var(--tc-duration-reveal); }
.ui-ma__eq[data-on] i:nth-child(3) { animation-delay: -520ms; animation-duration: var(--tc-duration-reveal-slow); }
.ui-ma__eq[data-on] i:nth-child(4) { animation-delay: -140ms; animation-duration: var(--tc-duration-reveal-slow); }
/* ----- Tooltips: above the button, on hover after a beat, on keyboard focus, and briefly after Copy ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-ma__tip { position: absolute; bottom: calc(100% + 6px); left: 50%; z-index: 3; display: block; width: max-content; padding: var(--tc-space-1) var(--tc-space-2); border-radius: var(--tc-tooltip-radius); background: var(--tc-tooltip-bg); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-tooltip-fg); white-space: nowrap; visibility: hidden; opacity: 0; transform: translate(-50%, 3px); transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-base) var(--tc-ease-move), visibility 0s linear var(--tc-duration-base); }
/* ----- Tooltips: a small white popover above the button – on hover after a beat, on keyboard focus, and briefly after Copy ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-ma__tip { position: absolute; bottom: calc(100% + 6px); left: 50%; z-index: 3; display: block; width: max-content; padding: var(--tc-space-0-5) var(--tc-space-2); border-radius: var(--tc-tooltip-radius); background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-overlay); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); white-space: nowrap; visibility: hidden; opacity: 0; transform: translate(-50%, 3px); transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-base) var(--tc-ease-move), visibility 0s linear var(--tc-duration-base); }
.ui-ma__btn:focus-visible + .ui-ma__tip,
.ui-ma__item[data-flash] .ui-ma__tip { visibility: visible; opacity: 1; transform: translate(-50%, 0); transition-delay: 0ms; }
@media (hover: hover) {
  .ui-ma__item:hover .ui-ma__tip { visibility: visible; opacity: 1; transform: translate(-50%, 0); transition-delay: var(--tc-duration-slower); }
}
/* Esc hides them without moving focus (WCAG 1.4.13) */
[data-ui="ma"][data-hush] .ui-ma__item .ui-ma__tip { visibility: hidden; opacity: 0; transition: none; }
/* ----- Version switcher: unfolds next to Regenerate once there are two versions ----- */
.ui-ma__regen { display: inline-flex; align-items: center; flex: none; }
.ui-ma__versions { display: grid; grid-template-columns: 0fr; opacity: 0; transition: grid-template-columns var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-ma__versions[data-open] { grid-template-columns: 1fr; opacity: 1; transition: grid-template-columns var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-slow) var(--tc-ease-standard) var(--tc-duration-instant); }
.ui-ma__versions-clip { display: flex; align-items: center; min-width: 0; overflow: hidden; padding-left: var(--tc-space-0-5); padding-right: var(--tc-space-0-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__step { display: grid; flex: none; place-items: center; width: 24px; height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-text-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__step .ui-ma__glyph { width: 14px; height: 14px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__step:hover:not(:disabled) { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-ma__step:disabled { cursor: default; color: var(--tc-text-disabled); }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__count { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); padding: 0 1px; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__step { display: grid; flex: none; place-items: center; width: 24px; height: var(--tc-control-h-md); border-radius: var(--tc-control-radius-md); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__step[data-dir="prev"] .ui-ma__glyph { transform: scaleX(-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__step:hover:not(:disabled) { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__count { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); padding: 0 var(--tc-space-0-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-ma__count-now { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__count > .ui-ma__swap:last-child { color: var(--tc-text-muted); }
/* ----- Swapping text ----- */
.ui-ma__swap { display: inline-grid; min-width: 0; }
.ui-ma__swap-item { grid-area: 1 / 1; display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1); min-width: 0; animation: ui-ma-in var(--tc-duration-slow) var(--tc-ease-standard) both; }
.ui-ma__swap-item[data-out] { animation: ui-ma-out var(--tc-duration-base) var(--tc-ease-standard) both; }
/* ----- Feedback row: unfolds below the bar ----- */
.ui-ma__fold { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-ma__fold[data-open] { grid-template-rows: 1fr; opacity: 1; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-slow) var(--tc-ease-standard) var(--tc-duration-instant); }
.ui-ma__clip { min-height: 0; overflow: hidden; margin: -4px; padding: var(--tc-space-1); }
  /* the 4px keep the card's hairline and the field's focus halo from being clipped */
:where([data-look="standard"], [data-look="standard"] *).ui-ma__panel { max-width: 440px; margin: var(--tc-space-1-5) 0 0; padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-3-5); border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
/* Clean: no card of its own – the row sits in the card the bar sits in */
:where([data-look="clean"], [data-look="clean"] *).ui-ma__panel { padding: var(--tc-space-2-5) var(--tc-space-2) var(--tc-space-2); }
.ui-ma__panel-head { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2); min-height: 24px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__ask { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__close { display: grid; flex: none; place-items: center; width: 24px; height: 24px; margin-right: -4px; border-radius: var(--tc-control-radius-sm); color: var(--tc-text-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__close .ui-ma__glyph { width: 14px; height: 14px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__close:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__chips { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); margin-top: var(--tc-space-1-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__chip { height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-fill-default); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__chip:hover:not(:disabled) { background: var(--tc-fill-strong); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__chip[aria-pressed="true"],
:where([data-look="standard"], [data-look="standard"] *).ui-ma__chip[aria-pressed="true"]:hover:not(:disabled) { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 1px var(--tc-border-selected); color: var(--tc-accent-text); }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__ask { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-text-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__close { display: grid; flex: none; place-items: center; width: 24px; height: 24px; margin-right: -4px; border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__close:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__chips { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); margin-top: var(--tc-space-2); }
/* Reasons: the tab-button look – a hairline, gray text; the picked one gets the gray fill */
:where([data-look="clean"], [data-look="clean"] *).ui-ma__chip { height: var(--tc-control-h-md); padding: 4px var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); box-shadow: inset 0 0 0 0.5px var(--tc-border-default); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__chip:hover:not(:disabled) { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__chip[aria-pressed="true"],
:where([data-look="clean"], [data-look="clean"] *).ui-ma__chip[aria-pressed="true"]:hover:not(:disabled) { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 1px var(--tc-border-selected); color: var(--tc-accent-text); }
.ui-ma__chip:disabled { cursor: default; }
.ui-ma__chip:disabled:not([aria-pressed="true"]) { opacity: 0.45; }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__send { display: inline-flex; align-items: center; justify-content: center; min-width: 58px; height: var(--tc-control-h-sm); margin-left: auto; padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-primary-fg); white-space: nowrap; transition: background-color var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-ma__send:hover:not(:disabled):not([data-sent]) { background: var(--tc-action-primary-bg-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__send:disabled { cursor: default; opacity: 0.32; }
/* Send: the dark chip; once sent a soft green fill */
:where([data-look="clean"], [data-look="clean"] *).ui-ma__send { display: inline-flex; align-items: center; justify-content: center; min-width: 60px; height: var(--tc-control-h-md); margin-left: auto; padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); line-height: var(--tc-line-height-normal); color: var(--tc-action-primary-fg); white-space: nowrap; transition: background-color var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__send:disabled { cursor: default; opacity: 0.3; }
.ui-ma__send[data-sent] { cursor: default; background: var(--tc-status-success-bg); box-shadow: none; color: var(--tc-status-success-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__send .ui-ma__glyph { width: 13px; height: 13px; stroke-width: 2.2; }
/* The "Other" field: the field pattern – a ≥ 3:1 edge, and the focus ring with its halo instead of an outline */
.ui-ma__input { display: block; width: 100%; height: var(--tc-field-h); margin-top: var(--tc-space-2); padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); outline: none; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-ma__input:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-ma__input:focus { box-shadow: var(--tc-field-shadow-focus); }
.ui-ma__input::placeholder { color: var(--tc-text-placeholder); }
[data-ui="ma-text"] { overflow: hidden; transition: height var(--tc-duration-slow) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__send .ui-ma__glyph { width: 14px; height: 14px; stroke-width: 1.5; }
/* ----- Message text that crossfades between versions (MessageText) ----- */
.ui-ma-text__swap { display: grid; }
.ui-ma-text__swap > .ui-ma__swap-item { display: block; animation: ui-ma-text-in var(--tc-duration-slower) var(--tc-ease-standard) both; }
.ui-ma-text__swap > .ui-ma__swap-item[data-out] { animation: ui-ma-out var(--tc-duration-moderate) var(--tc-ease-standard) both; }
@keyframes ui-ma-in { from { opacity: 0; filter: blur(2px); } }
@keyframes ui-ma-text-in { from { opacity: 0; filter: blur(3px); } }
@keyframes ui-ma-out { from { opacity: 1; } to { opacity: 0; filter: blur(2px); } }
@keyframes ui-ma-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes ui-ma-pop { 0% { transform: scale(1); } 40% { transform: scale(1.28) rotate(-8deg); } 100% { transform: scale(1); } }
@keyframes ui-ma-pop-clean { 0% { transform: scale(1); } 40% { transform: scale(1.22) rotate(-8deg); } 100% { transform: scale(1); } }
@keyframes ui-ma-eq { 0%, 100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } }
/* Narrow: the feedback row stacks its send button under the chips */
@container (max-width: 320px) {
  .ui-ma__send { flex-basis: 100%; }
}
@media (pointer: coarse) {
[data-ui="ma"][data-quiet] { --tc-message-actions-quiet: initial; }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__btn { width: 38px; height: 38px; border-radius: var(--tc-radius-lg); }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__step { width: 28px; height: 38px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__chip,
:where([data-look="standard"], [data-look="standard"] *).ui-ma__send { height: 34px; }
.ui-ma__close { width: 32px; height: 32px; }
.ui-ma__input { height: 38px; }
}
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-ma__btn { width: 36px; height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__step { width: 28px; height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__chip,
:where([data-look="clean"], [data-look="clean"] *).ui-ma__send { height: 34px; padding-top: var(--tc-space-2); padding-bottom: var(--tc-space-2); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="ma"] *, [data-ui="ma"] *::before, [data-ui="ma"] *::after, [data-ui="ma-text"], [data-ui="ma-text"] * { animation: none !important; transition: none !important; }
  .ui-ma__eq[data-on] i:nth-child(odd) { transform: scaleY(0.8); }
  .ui-ma__eq[data-on] i:nth-child(even) { transform: scaleY(0.5); }
}
`;
}

/**
 * The message itself, crossfading when `version` changes: the old content fades out underneath while the new one fades
 * in, and the block eases to its new height.
 * @tag tc-message-text
 */
export class TcMessageText extends TcElement {
  static override ui = "ma-text";

  /** Which version is shown – a change crossfades */
  @property() accessor version: string | number = 0;
  /** The message: text, or an element (cloned; changes inside it are followed) */
  @property({ attribute: false }) accessor content: Element | string = "";

  private readonly swaps = new Swaps(this);
  private ro?: ResizeObserver;
  private mo?: MutationObserver;
  private watched?: Element;
  private clone: { of: Element; version: string; rev: number; node: Node } | undefined;
  private rev = 0;

  override connectedCallback() {
    // The styles live with the bar's
    adoptStyles("ui-ma", TcMessageActions.css, this.ownerDocument);
    super.connectedCallback();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.ro?.disconnect();
    this.ro = undefined;
    this.mo?.disconnect();
    this.mo = undefined;
    this.watched = undefined;
    this.swaps.clear();
  }

  protected override updated() {
    const inner = this.querySelector<HTMLElement>(":scope > .ui-ma-text__inner");
    if (inner && !this.ro && typeof ResizeObserver !== "undefined") {
      this.ro = new ResizeObserver(() => (this.style.height = `${inner.offsetHeight}px`));
      this.ro.observe(inner);
    }
    // A content element that changes inside is cloned again
    const content = this.content instanceof Element ? this.content : undefined;
    if (content !== this.watched) {
      this.mo?.disconnect();
      this.watched = content;
      if (content) {
        this.mo = new MutationObserver(() => {
          this.rev++;
          this.requestUpdate();
        });
        this.mo.observe(content, { subtree: true, childList: true, characterData: true, attributes: true });
      }
    }
  }

  private shown(): unknown {
    const c = this.content;
    if (!(c instanceof Element)) return c;
    const version = String(this.version);
    if (!this.clone || this.clone.of !== c || this.clone.version !== version || this.clone.rev !== this.rev) this.clone = { of: c, version, rev: this.rev, node: c.cloneNode(true) };
    return this.clone.node;
  }

  protected override render() {
    return html`<div class="ui-ma-text__inner">${this.swaps.render("text", String(this.version), this.shown(), "ui-ma-text__swap")}</div>`;
  }

  static override css = "";
}

if (!customElements.get("tc-message-actions")) customElements.define("tc-message-actions", TcMessageActions);
if (!customElements.get("tc-message-text")) customElements.define("tc-message-text", TcMessageText);

declare global {
  interface HTMLElementTagNameMap {
    "tc-message-actions": TcMessageActions;
    "tc-message-text": TcMessageText;
  }
}
