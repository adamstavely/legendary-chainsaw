import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { ToolbarController } from "./internal/controllers";

/*
 * <tc-text-to-speech> – reads a passage aloud with the browser's own voices (the Web Speech API). The passage stays on
 * screen: the sentence being read is shaded and the word being spoken is marked, so a reader can follow along or
 * glance back. Play, Pause and Resume, Stop, and previous / next sentence sit in a toolbar; under it are the voice,
 * the speed (0.5–2×) and the pitch. Click any sentence to read from there. A line under the passage says where it is
 * ("Sentence 3 of 12") and roughly how long is left.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-text-to-speech heading="Field station guide" .text=${passage}></tc-text-to-speech>
 *
 * It speaks one sentence at a time, so it can move between sentences and pick a new speed or voice up at once. Word
 * marks come from the voice's boundary events; a voice that sends none still shades the sentence. Pause stops the
 * speech and Resume starts that sentence again – the browsers' own pause is unreliable. Where there's no speech
 * synthesis, the passage stays readable and a line says read aloud isn't available.
 *
 * Keyboard: the passage is one tab stop – ← → ↑ ↓ Home End move between sentences, Enter reads from the focused one,
 * Space reads from it too, or pauses and resumes when it's the one being read. The controls are a toolbar (one tab
 * stop, ← → move); the voice, speed and pitch are native fields.
 */

export type TextToSpeechState = "idle" | "playing" | "paused";

/** tc-rate-change: the speed was changed (0.5–2, 1 is normal) */
export type TextToSpeechRateChange = { rate: number };
/** tc-pitch-change: the pitch was changed (0–2, 1 is normal) */
export type TextToSpeechPitchChange = { pitch: number };
/** tc-voice-change: a voice was picked – its `voiceURI`, or "" for the browser's default */
export type TextToSpeechVoiceChange = { voice: string };
/** tc-start: reading began at this sentence (0-based) */
export type TextToSpeechStart = { sentence: number };
/** tc-end: reading stopped – `completed` when it reached the end, false when Stop was pressed */
export type TextToSpeechEnd = { completed: boolean; sentence: number };

/** A sentence of the passage and its words' offsets inside it */
type Sentence = { text: string; paragraph: number; words: { start: number; end: number }[] };

/** Average speaking speed at 1×, for the time left */
const WORDS_PER_MINUTE = 165;
/** How long the speed, voice or pitch must stay put before the sentence restarts with it */
const RESTART_MS = 250;

let uidCount = 0;

/** The browser's speech synthesis, where there is one */
const synthesis = () => (typeof window !== "undefined" && window.speechSynthesis && typeof SpeechSynthesisUtterance !== "undefined" ? window.speechSynthesis : null);

/** Splits a passage into paragraphs (blank lines) and sentences, with each word's place in its sentence */
export function splitSentences(text: string, locale?: string): Sentence[] {
  const out: Sentence[] = [];
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const Seg = (Intl as { Segmenter?: typeof Intl.Segmenter }).Segmenter;
  paragraphs.forEach((p, paragraph) => {
    const parts = Seg ? [...new Seg(locale, { granularity: "sentence" }).segment(p)].map((s) => s.segment) : (p.match(/[^.!?]+(?:[.!?]+["')\]]*|$)\s*/g) ?? [p]);
    for (const raw of parts) {
      const t = raw.trim();
      if (!t) continue;
      const words = [...t.matchAll(/\S+/g)].map((m) => ({ start: m.index!, end: m.index! + m[0].length }));
      out.push({ text: t, paragraph, words });
    }
  });
  return out;
}

/* ---------- Icons: Lucide (ISC) – play, pause, square, skip-back, skip-forward, audio-lines, chevron-down ---------- */

const ICON = {
  head: svg`<path d="M2 10v3M6 6v11M10 3v18M14 8v7M18 5v13M22 10v3"></path>`,
  play: "M7 4.5v15l12-7.5z",
  pause: "M7 4.5h3.5v15H7zM13.5 4.5H17v15h-3.5z",
  stop: "M6.5 6.5h11v11h-11z",
  prev: "M18 19.5 8.5 12 18 4.5zM5.5 5v14",
  next: "M6 4.5 15.5 12 6 19.5zM18.5 5v14",
};
const glyph = (d: string) => html`<svg class="ui-tts__glyph" viewBox="0 0 24 24" aria-hidden="true"><path d=${d}></path></svg>`;
const chevron = () => html`<svg class="ui-tts__chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>`;

/**
 * Reads a passage aloud – the sentence and word being spoken marked in the text, with play, pause, stop, sentence
 * skips, a voice picker, speed and pitch.
 * @tag tc-text-to-speech
 * @fires tc-rate-change - The speed was changed ({ rate }: TextToSpeechRateChange); cancelable – prevented, `rate` stays as it was
 * @fires tc-pitch-change - The pitch was changed ({ pitch }: TextToSpeechPitchChange); cancelable – prevented, `pitch` stays
 * @fires tc-voice-change - A voice was picked ({ voice }: TextToSpeechVoiceChange); cancelable – prevented, `voice` stays
 * @fires tc-start - Reading began ({ sentence }: TextToSpeechStart)
 * @fires tc-end - Reading stopped, at the end or by Stop ({ completed, sentence }: TextToSpeechEnd)
 */
export class TcTextToSpeech extends TcElement {
  static override ui = "tts";
  private uid = `tc-tts-${++uidCount}`;

  /** The heading */
  @property() accessor heading = "Read aloud";
  /** A quiet line under the heading – the source or what the passage is */
  @property() accessor description = "";
  /** The passage to read: plain text; a blank line starts a new paragraph */
  @property() accessor text = "";
  /** Speaking speed from 0.5 to 2 (1 is normal). Changed by the element unless a tc-rate-change listener calls preventDefault() */
  @property({ type: Number }) accessor rate = 1;
  /** Pitch from 0 to 2 (1 is normal). Changed by the element unless a tc-pitch-change listener calls preventDefault() */
  @property({ type: Number }) accessor pitch = 1;
  /** The chosen voice's `voiceURI`, or "" for the browser's default. Changed unless a tc-voice-change listener calls preventDefault() */
  @property() accessor voice = "";
  /** The passage's language (a BCP 47 tag) – picks a default voice and splits sentences; unset, the browser decides */
  @property() accessor lang = "";

  @state() private accessor _state: TextToSpeechState = "idle";
  /** @internal The sentence being read, or next to be read */
  @state() accessor current = 0;
  /** @internal The word being spoken in the current sentence, -1 for none */
  @state() accessor word = -1;
  /** @internal The sentence with the passage's tab stop */
  @state() accessor focusAt = 0;
  /** @internal The voices the browser offers */
  @state() accessor voices: SpeechSynthesisVoice[] = [];
  /** @internal Whether this browser can speak */
  @state() accessor supported = true;
  /** @internal What screen readers hear */
  @state() accessor said = "";

  /** Whether it's reading, paused or idle */
  get state(): TextToSpeechState {
    return this._state;
  }

  private sentences: Sentence[] = [];
  /** Bumped for every utterance, so a cancelled one's late events are ignored */
  private run = 0;
  private restartTimer: ReturnType<typeof setTimeout> | undefined;
  private toolbar = new ToolbarController(this, { items: () => [...this.querySelectorAll<HTMLButtonElement>(".ui-tts__bar button")] });

  override connectedCallback() {
    super.connectedCallback();
    const synth = synthesis();
    this.supported = !!synth;
    if (synth) {
      this.loadVoices();
      synth.addEventListener?.("voiceschanged", this.loadVoices);
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    const synth = synthesis();
    synth?.removeEventListener?.("voiceschanged", this.loadVoices);
    clearTimeout(this.restartTimer);
    if (this._state !== "idle") {
      this.run++;
      synth?.cancel();
      this._state = "idle";
    }
  }

  private loadVoices = () => {
    this.voices = synthesis()?.getVoices?.() ?? [];
  };

  /* ---------- Reading ---------- */

  private chosenVoice() {
    const v = this.voices;
    if (this.voice) return v.find((x) => x.voiceURI === this.voice) ?? v.find((x) => x.name === this.voice) ?? null;
    if (this.lang) return v.find((x) => x.lang.toLowerCase().startsWith(this.lang.toLowerCase())) ?? null;
    return null;
  }

  private speak(i: number) {
    const synth = synthesis();
    const s = this.sentences[i];
    if (!synth || !s) return;
    const token = ++this.run;
    clearTimeout(this.restartTimer);
    synth.cancel();
    this.current = i;
    this.word = -1;
    const u = new SpeechSynthesisUtterance(s.text);
    u.rate = this.rate;
    u.pitch = this.pitch;
    const voice = this.chosenVoice();
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    } else if (this.lang) u.lang = this.lang;
    u.onboundary = (e: SpeechSynthesisEvent) => {
      if (token !== this.run || (e.name && e.name !== "word")) return;
      let at = 0;
      s.words.forEach((w, k) => w.start <= e.charIndex && (at = k));
      this.word = at;
    };
    u.onend = () => {
      if (token !== this.run) return;
      if (i + 1 < this.sentences.length) this.speak(i + 1);
      else this.finish(true);
    };
    u.onerror = (e: SpeechSynthesisErrorEvent) => {
      if (token !== this.run || e.error === "interrupted" || e.error === "canceled") return;
      this.finish(false);
    };
    this._state = "playing";
    synth.speak(u);
  }

  private finish(completed: boolean) {
    const sentence = this.current;
    this.run++;
    synthesis()?.cancel();
    clearTimeout(this.restartTimer);
    this._state = "idle";
    this.word = -1;
    this.said = completed ? "Finished reading" : "Stopped";
    if (completed) this.current = 0;
    this.emit("tc-end", { completed, sentence });
  }

  /** Starts reading from a sentence (0-based), or from the current one */
  play(from = this.current) {
    if (!this.supported || !this.sentences.length) return;
    const wasIdle = this._state === "idle";
    this.speak(Math.min(Math.max(0, from), this.sentences.length - 1));
    this.said = this._state === "playing" ? (wasIdle ? "Reading" : "Resumed") : "";
    if (wasIdle) this.emit("tc-start", { sentence: this.current });
  }

  /** Pauses; Resume starts the sentence again */
  pause() {
    if (this._state !== "playing") return;
    this.run++;
    synthesis()?.cancel();
    clearTimeout(this.restartTimer);
    this._state = "paused";
    this.word = -1;
    this.said = "Paused";
  }

  /** Stops and goes back to the start */
  stop() {
    if (this._state === "idle") {
      this.current = 0;
      return;
    }
    this.finish(false);
    this.current = 0;
  }

  private toggle() {
    if (this._state === "playing") this.pause();
    else this.play();
  }

  private step(by: number) {
    const to = Math.min(Math.max(0, this.current + by), Math.max(0, this.sentences.length - 1));
    if (this._state === "playing") this.speak(to);
    else {
      this.current = to;
      this.word = -1;
    }
    this.focusAt = to;
  }

  /* ---------- Settings ---------- */

  private setRate(e: Event) {
    const input = e.target as HTMLInputElement;
    const rate = Math.round(input.valueAsNumber * 10) / 10;
    if (this.emit("tc-rate-change", { rate }, { cancelable: true })) this.rate = rate;
    else input.value = String(this.rate);
  }
  private setPitch(e: Event) {
    const input = e.target as HTMLInputElement;
    const pitch = Math.round(input.valueAsNumber * 10) / 10;
    if (this.emit("tc-pitch-change", { pitch }, { cancelable: true })) this.pitch = pitch;
    else input.value = String(this.pitch);
  }
  private setVoice(e: Event) {
    const select = e.target as HTMLSelectElement;
    const voice = select.value;
    if (this.emit("tc-voice-change", { voice }, { cancelable: true })) this.voice = voice;
    else select.value = this.voice;
  }

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("text") || changed.has("lang")) {
      this.sentences = splitSentences(this.text, this.lang || undefined);
      if (changed.get("text") !== undefined && this._state !== "idle") this.finish(false);
      if (this.current >= this.sentences.length) this.current = 0;
      if (this.focusAt >= this.sentences.length) this.focusAt = 0;
    }
    // The tab stop follows the reading unless someone is moving through the passage themselves
    if (changed.has("current") && !this.querySelector(".ui-tts__passage")?.contains(document.activeElement)) this.focusAt = this.current;
    this.dataset.state = this._state;
  }

  protected override updated(changed: PropertyValues<this>) {
    // A new speed, pitch or voice takes effect from the start of the sentence, once it has stopped changing
    if (this._state === "playing" && (changed.has("rate") || changed.has("pitch") || changed.has("voice"))) {
      clearTimeout(this.restartTimer);
      this.restartTimer = setTimeout(() => this._state === "playing" && this.speak(this.current), RESTART_MS);
    }
    if (changed.has("current") && this._state === "playing") this.follow();
  }

  /** Keeps the sentence being read in view inside the passage – the page itself doesn't scroll */
  private follow() {
    const box = this.querySelector<HTMLElement>(".ui-tts__passage");
    const el = this.querySelector<HTMLElement>(`.ui-tts__sentence[data-i="${this.current}"]`);
    if (!box || !el || box.scrollHeight <= box.clientHeight) return;
    const top = el.offsetTop - box.offsetTop;
    const bottom = top + el.offsetHeight;
    if (top >= box.scrollTop && bottom <= box.scrollTop + box.clientHeight) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    box.scrollTo({ top: Math.max(0, top - box.clientHeight / 3), behavior: reduce ? "auto" : "smooth" });
  }

  /* ---------- Passage keyboard ---------- */

  private onSentenceKey(e: KeyboardEvent, i: number) {
    const n = this.sentences.length;
    let to = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") to = Math.min(n - 1, i + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") to = Math.max(0, i - 1);
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = n - 1;
    else if (e.key === "Enter") {
      e.preventDefault();
      this.play(i);
      return;
    } else if (e.key === " ") {
      e.preventDefault();
      if (i === this.current && this._state !== "idle") this.toggle();
      else this.play(i);
      return;
    }
    if (to < 0) return;
    e.preventDefault();
    this.focusAt = to;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-tts__sentence[data-i="${to}"]`)?.focus());
  }

  /* ---------- Render ---------- */

  private renderSentence(s: Sentence, i: number) {
    const reading = i === this.current && this._state !== "idle";
    const parts: TemplateResult[] = [];
    let at = 0;
    s.words.forEach((w, k) => {
      if (w.start > at) parts.push(html`${s.text.slice(at, w.start)}`);
      parts.push(html`<span class="ui-tts__word" ?data-current=${reading && k === this.word}>${s.text.slice(w.start, w.end)}</span>`);
      at = w.end;
    });
    const body = html`${parts}`;
    if (!this.supported) return html`<span class="ui-tts__sentence" data-i=${i}>${body}</span>`;
    return html`<span
      class="ui-tts__sentence"
      data-i=${i}
      role="button"
      tabindex=${i === this.focusAt ? 0 : -1}
      aria-current=${reading ? "true" : "false"}
      aria-describedby=${`${this.uid}-keys`}
      ?data-current=${reading}
      ?data-next=${!reading && i === this.current && this.current > 0}
      @click=${() => (i === this.current && this._state === "playing" ? undefined : this.play(i))}
      @keydown=${(e: KeyboardEvent) => this.onSentenceKey(e, i)}
      >${body}</span
    >`;
  }

  private renderPassage() {
    if (!this.sentences.length) return html`<p class="ui-tts__empty">Nothing to read yet.</p>`;
    const paras: TemplateResult[][] = [];
    this.sentences.forEach((s, i) => {
      (paras[s.paragraph] ??= []).push(this.renderSentence(s, i), html` `);
    });
    return html`<div class="ui-tts__passage" role="group" aria-label="Passage">${paras.map((p) => html`<p class="ui-tts__para">${p}</p>`)}</div>`;
  }

  private timeLeft() {
    const words = this.sentences.slice(this.current).reduce((n, s) => n + s.words.length, 0);
    const secs = (words / (WORDS_PER_MINUTE * Math.max(0.1, this.rate))) * 60;
    if (secs < 60) return "Under a minute left";
    return `About ${Math.round(secs / 60)} min left`;
  }

  private renderControls() {
    const off = !this.supported || !this.sentences.length;
    const s = this._state;
    const main = s === "playing" ? "Pause" : s === "paused" ? "Resume" : "Play";
    return html`<div class="ui-tts__bar" role="toolbar" aria-label="Reading controls" @keydown=${this.toolbar.onKeyDown} @focusin=${this.toolbar.onFocusIn}>
      <button type="button" class="ui-tts__tool" ?disabled=${off || this.current === 0} @click=${() => this.step(-1)}>${glyph(ICON.prev)}<span class="ui-tts__sr">Previous sentence</span></button>
      <button type="button" class="ui-tts__play" ?disabled=${off} @click=${() => this.toggle()}>${glyph(s === "playing" ? ICON.pause : ICON.play)}${main}</button>
      <button type="button" class="ui-tts__tool" ?disabled=${off || this.current >= this.sentences.length - 1} @click=${() => this.step(1)}>${glyph(ICON.next)}<span class="ui-tts__sr">Next sentence</span></button>
      <button type="button" class="ui-tts__tool" ?disabled=${off || s === "idle"} @click=${() => this.stop()}>${glyph(ICON.stop)}<span class="ui-tts__sr">Stop</span></button>
    </div>`;
  }

  private renderSettings() {
    const off = !this.supported;
    const fill = (v: number, min: number, max: number) => `--fill: ${((v - min) / (max - min)) * 100}%`;
    const voices = this.voices;
    const known = !this.voice || voices.some((v) => v.voiceURI === this.voice || v.name === this.voice);
    return html`<div class="ui-tts__settings">
      <label class="ui-tts__field ui-tts__field--voice"
        ><span class="ui-tts__label">Voice</span
        ><span class="ui-tts__select"
          ><select class="ui-tts__input" ?disabled=${off} .value=${live(this.voice)} @change=${this.setVoice}>
            <option value="" ?selected=${!this.voice}>Default voice</option>
            ${known ? nothing : html`<option value=${this.voice} selected>${this.voice}</option>`}
            ${voices.map((v) => html`<option value=${v.voiceURI} ?selected=${v.voiceURI === this.voice}>${v.name} – ${v.lang}</option>`)}
          </select
          >${chevron()}</span
        ></label
      >
      <label class="ui-tts__field"
        ><span class="ui-tts__label">Speed <output class="ui-tts__value">${this.rate.toFixed(1)}×</output></span
        ><input
          class="ui-tts__range"
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          ?disabled=${off}
          style=${fill(this.rate, 0.5, 2)}
          .value=${live(String(this.rate))}
          aria-valuetext=${`${this.rate.toFixed(1)} times`}
          @input=${this.setRate}
      /></label>
      <label class="ui-tts__field"
        ><span class="ui-tts__label">Pitch <output class="ui-tts__value">${this.pitch.toFixed(1)}</output></span
        ><input class="ui-tts__range" type="range" min="0" max="2" step="0.1" ?disabled=${off} style=${fill(this.pitch, 0, 2)} .value=${live(String(this.pitch))} @input=${this.setPitch}
      /></label>
    </div>`;
  }

  protected override render() {
    const n = this.sentences.length;
    const id = `${this.uid}-title`;
    const progress = n
      ? html`<p class="ui-tts__progress"><span>Sentence ${Math.min(this.current + 1, n)} of ${n}</span><span class="ui-tts__dot" aria-hidden="true">·</span><span>${this.timeLeft()}</span></p>`
      : nothing;
    return html`
      ${cardHead({
        icon: ICON.head,
        title: this.heading,
        subtitle: this.description || undefined,
        id,
        aside: this._state !== "idle" ? html`<span class="ui-tts__pill" data-state=${this._state}>${this._state === "playing" ? "Reading" : "Paused"}</span>` : undefined,
      })}
      <section class="ui-tts__card" aria-labelledby=${id}>
        ${this.supported ? nothing : html`<p class="ui-tts__unsupported">Read aloud isn't available in this browser – the text is below.</p>`}
        ${this.renderPassage()} ${progress}
        <div class="ui-tts__foot">${this.renderControls()} ${this.renderSettings()}</div>
      </section>
      <span class="ui-tts__sr" id=${`${this.uid}-keys`}>Enter reads from this sentence. Space pauses or resumes the sentence being read.</span>
      <span class="ui-tts__sr" role="status">${this.said}</span>
    `;
  }

  static override css = /* css */ `
[data-ui="tts"] {
  /* The passage scrolls inside this height */
  --tc-tts-passage-h: 260px;
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 100%;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="tts"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  color: var(--tc-text-secondary);
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tts"] {
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-secondary);
}
[data-ui="tts"] *, [data-ui="tts"] *::before, [data-ui="tts"] *::after { box-sizing: border-box; }
:where([data-ui="tts"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="tts"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="tts"] p { margin: 0; }
.ui-tts__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-tts__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-tts__card { border-top: var(--tc-hairline) solid var(--tc-divider); }

.ui-tts__pill { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5); border-radius: var(--tc-radius-full); background: var(--tc-accent-subtle); color: var(--tc-accent-text); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); white-space: nowrap; }
.ui-tts__pill::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.ui-tts__pill[data-state="paused"] { background: var(--tc-fill-subtle); color: var(--tc-text-secondary); }
.ui-tts__pill[data-state="paused"]::before { border-radius: var(--tc-radius-2xs); }

.ui-tts__unsupported { margin: var(--tc-space-4) var(--tc-space-5) 0; padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-tts__empty { padding: var(--tc-space-5); color: var(--tc-text-muted); }

/* ----- The passage: the sentence being read is shaded, the word being spoken is marked ----- */
.ui-tts__passage { display: grid; gap: var(--tc-space-3); max-height: var(--tc-tts-passage-h); overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; padding: var(--tc-space-5) var(--tc-space-5) var(--tc-space-3); }
.ui-tts__para { color: var(--tc-text-primary); font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-relaxed); overflow-wrap: break-word; }
.ui-tts__sentence { border-radius: var(--tc-radius-xs); cursor: pointer; -webkit-box-decoration-break: clone; box-decoration-break: clone; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tts__sentence:hover { background: var(--tc-fill-hover); }
.ui-tts__sentence:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-tts__sentence[data-current], .ui-tts__sentence[data-current]:hover { background: var(--tc-accent-subtle); }
/* The next sentence to read (after Pause, or skipping while idle): an underline, quieter than the shade */
.ui-tts__sentence[data-next] { text-decoration: underline; text-decoration-color: var(--tc-border-selected); text-decoration-thickness: 2px; text-underline-offset: var(--tc-space-1); }
.ui-tts__word { border-radius: var(--tc-radius-2xs); }
.ui-tts__word[data-current] { background: var(--tc-accent-solid); color: var(--tc-text-on-accent); box-shadow: 0 0 0 2px var(--tc-accent-solid); }

.ui-tts__progress { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); padding: 0 var(--tc-space-5) var(--tc-space-3); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }

/* ----- Controls and settings ----- */
.ui-tts__foot { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-5) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-tts__bar { display: flex; align-items: center; justify-content: center; gap: var(--tc-space-1-5); }
.ui-tts__tool { display: grid; place-items: center; width: var(--tc-control-h-md); height: var(--tc-control-h-md); border-radius: var(--tc-control-radius-md); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tts__tool:hover:not(:disabled) { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-tts__tool:disabled, .ui-tts__play:disabled { color: var(--tc-text-disabled); cursor: not-allowed; }
.ui-tts__play { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1-5); min-width: 112px; height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md) 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tts__play:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); }
.ui-tts__play:active:not(:disabled) { background: var(--tc-action-primary-bg-active); }
.ui-tts__play:disabled { background: var(--tc-fill-subtle); box-shadow: none; }
.ui-tts__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }
.ui-tts__play .ui-tts__glyph { fill: currentColor; stroke-width: 1.5; }
:where([data-look="clean"], [data-look="clean"] *).ui-tts__glyph { stroke-width: 1.4; }

.ui-tts__settings { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr); align-items: end; gap: var(--tc-space-4); }
.ui-tts__field { display: grid; gap: var(--tc-space-1-5); min-width: 0; }
.ui-tts__label { display: flex; align-items: baseline; justify-content: space-between; gap: var(--tc-space-2); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); }
.ui-tts__value { color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-tts__select { position: relative; display: block; min-width: 0; }
.ui-tts__input { width: 100%; min-width: 0; height: var(--tc-field-h); margin: 0; padding: 0 var(--tc-space-8) 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); text-overflow: ellipsis; outline: none; appearance: none; cursor: pointer; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tts__input:hover:not(:disabled) { box-shadow: var(--tc-field-shadow-hover); }
.ui-tts__input:focus-visible { box-shadow: var(--tc-field-shadow-focus); }
.ui-tts__input:disabled { color: var(--tc-text-disabled); cursor: not-allowed; }
.ui-tts__chevron { position: absolute; top: 50%; right: var(--tc-space-3); width: var(--tc-space-4); height: var(--tc-space-4); fill: none; stroke: var(--tc-icon-muted); stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; transform: translateY(-50%); pointer-events: none; }
/* The sliders: a native range on the meter tokens */
.ui-tts__range { display: block; width: 100%; height: var(--tc-field-h); margin: 0; background: transparent; cursor: pointer; appearance: none; -webkit-appearance: none; }
.ui-tts__range:disabled { cursor: not-allowed; }
.ui-tts__range::-webkit-slider-runnable-track { height: var(--tc-meter-h); border-radius: var(--tc-meter-radius); background: linear-gradient(to right, var(--tc-meter-fill) var(--fill), var(--tc-meter-track) var(--fill)); }
.ui-tts__range::-moz-range-track { height: var(--tc-meter-h); border-radius: var(--tc-meter-radius); background: linear-gradient(to right, var(--tc-meter-fill) var(--fill), var(--tc-meter-track) var(--fill)); }
:where([data-look="clean"], [data-look="clean"] *).ui-tts__range::-webkit-slider-runnable-track { background: linear-gradient(to right, var(--tc-accent) var(--fill), var(--tc-meter-track) var(--fill)); }
:where([data-look="clean"], [data-look="clean"] *).ui-tts__range::-moz-range-track { background: linear-gradient(to right, var(--tc-accent) var(--fill), var(--tc-meter-track) var(--fill)); }
.ui-tts__range::-webkit-slider-thumb { width: 16px; height: 16px; margin-top: calc((var(--tc-meter-h) - var(--tc-space-4)) / 2); border: 0; border-radius: 50%; background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control), 0 0 0 1px var(--tc-border-control); appearance: none; -webkit-appearance: none; }
.ui-tts__range::-moz-range-thumb { width: 16px; height: 16px; border: 0; border-radius: 50%; background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control), 0 0 0 1px var(--tc-border-control); }
.ui-tts__range:focus-visible { outline: none; }
.ui-tts__range:focus-visible::-webkit-slider-thumb { box-shadow: var(--tc-shadow-control), 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
.ui-tts__range:focus-visible::-moz-range-thumb { box-shadow: var(--tc-shadow-control), 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }

@container (max-width: 480px) {
  .ui-tts__settings { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .ui-tts__field--voice { grid-column: 1 / -1; }
  .ui-tts__passage, .ui-tts__foot { padding-left: var(--tc-space-4); padding-right: var(--tc-space-4); }
  .ui-tts__progress { padding-left: var(--tc-space-4); padding-right: var(--tc-space-4); }
}
@container (max-width: 320px) {
  .ui-tts__settings { grid-template-columns: minmax(0, 1fr); }
  .ui-tts__play { min-width: 0; }
}
@media (hover: none) and (pointer: coarse) {
  .ui-tts__tool { width: var(--tc-control-h-lg); height: var(--tc-control-h-lg); }
  .ui-tts__play { height: var(--tc-control-h-lg); }
}
@media (forced-colors: active) {
  .ui-tts__sentence[data-current] { outline: 1px solid Highlight; }
  .ui-tts__word[data-current] { background: Highlight; color: HighlightText; }
  .ui-tts__chevron { stroke: ButtonText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="tts"] *, [data-ui="tts"] *::before, [data-ui="tts"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-text-to-speech")) customElements.define("tc-text-to-speech", TcTextToSpeech);

declare global {
  interface HTMLElementTagNameMap {
    "tc-text-to-speech": TcTextToSpeech;
  }
}
