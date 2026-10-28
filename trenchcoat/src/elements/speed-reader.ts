import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { ToolbarController } from "./internal/controllers";

/*
 * <tc-speed-reader> – speed reading by showing one word at a time in the same place (RSVP), so the eye never moves.
 * Each word's optimal recognition point – the letter just left of its middle – is drawn in the accent colour and in
 * bold, and always sits on the guide marks at the centre of the frame. Sentence ends, commas and long words stay up a
 * little longer. Pause, and the sentence around the word appears under the frame with the word marked.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-speed-reader heading="Lighthouse history" wpm="350" .text=${passage}></tc-speed-reader>
 *
 * The speed (100–1000 words a minute), the words shown at a time (1–3) and the place in the text (`position`, the
 * first word on screen, 0-based) are values with cancelable change events, so a page can own them. A scrubber shows
 * and sets the place ("Word 120 of 840") with the time left beside it.
 *
 * Keyboard: the frame is a tab stop – Space plays and pauses, ← → step a word (or a chunk), Shift+← → a sentence,
 * Home and End jump to the ends. The controls are a toolbar (one tab stop, ← → move); speed, chunk size and the
 * scrubber are native fields. Screen readers hear the whole word, not its split letters, and are told when reading
 * starts, pauses and ends – never every word.
 */

/** When the next word is due: setTimeout by default; a test or a page can drive the timing itself */
export type SpeedReaderScheduler = {
  set: (run: () => void, ms: number) => unknown;
  clear: (handle: unknown) => void;
};
/** tc-wpm-change: the speed was changed, in words a minute */
export type SpeedReaderWpmChange = { wpm: number };
/** tc-chunk-change: how many words show at a time (1–3) */
export type SpeedReaderChunkChange = { chunk: number };
/** tc-position-change: the first word on screen moved (0-based) */
export type SpeedReaderPositionChange = { position: number };
/** tc-finish: the last word was shown */
export type SpeedReaderFinish = { words: number };

const MIN_WPM = 100;
const MAX_WPM = 1000;

const timeoutScheduler: SpeedReaderScheduler = {
  set: (run, ms) => setTimeout(run, ms),
  clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

type Word = { text: string; sentence: number };

/** Splits a passage into words, numbering their sentences; a blank line also ends one */
export function readerWords(text: string): Word[] {
  const out: Word[] = [];
  let sentence = 0;
  for (const para of text.split(/\n\s*\n/)) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    words.forEach((w, i) => {
      out.push({ text: w, sentence });
      if (i === words.length - 1 || /[.!?…]["'”’)\]]*$/.test(w)) sentence++;
    });
  }
  return out;
}

/** The optimal recognition point: the index of the letter to fix the eye on */
export function recognitionPoint(word: string) {
  const lead = word.match(/^[^\p{L}\p{N}]*/u)![0].length;
  const core = word.slice(lead).replace(/[^\p{L}\p{N}]+$/u, "").length;
  const at = core <= 1 ? 0 : core <= 5 ? 1 : core <= 9 ? 2 : core <= 13 ? 3 : 4;
  return Math.min(word.length - 1, lead + at);
}

/** How long a word stays up, in words: longer after a sentence end, a comma, or a long word */
export function wordWeight(word: string) {
  let w = 1;
  if (/[.!?…]["'”’)\]]*$/.test(word)) w += 1.2;
  else if (/[,;:–—]["'”’)\]]*$/.test(word)) w += 0.5;
  const letters = word.replace(/[^\p{L}\p{N}]/gu, "").length;
  if (letters > 12) w += 0.6;
  else if (letters > 8) w += 0.3;
  return w;
}

let uidCount = 0;
const clampWpm = (n: number) => Math.min(MAX_WPM, Math.max(MIN_WPM, Math.round(n) || 300));
const clampChunk = (n: number) => Math.min(3, Math.max(1, Math.round(n) || 1));

/* ---------- Icons: Lucide (ISC) – gauge, play, pause, rotate-ccw, chevron(s)-left/right ---------- */

const ICON = {
  head: svg`<path d="m12 14 4-4"></path><path d="M3.34 19a10 10 0 1 1 17.32 0"></path>`,
  play: "M7 4.5v15l12-7.5z",
  pause: "M7 4.5h3.5v15H7zM13.5 4.5H17v15h-3.5z",
  restart: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5",
  word: { back: "m15 18-6-6 6-6", forward: "m9 18 6-6-6-6" },
  sentence: { back: "m11 17-5-5 5-5M18 17l-5-5 5-5", forward: "m6 17 5-5-5-5M13 17l5-5-5-5" },
};
const glyph = (d: string) => html`<svg class="ui-spr__glyph" viewBox="0 0 24 24" aria-hidden="true"><path d=${d}></path></svg>`;
const chevron = () => html`<svg class="ui-spr__chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>`;

/**
 * Speed reading, one word at a time in a fixed frame, with the recognition point on a guide mark, the speed, words at
 * a time, a scrubber and the time left.
 * @tag tc-speed-reader
 * @fires tc-wpm-change - The speed was changed ({ wpm }: SpeedReaderWpmChange); cancelable – prevented, `wpm` stays as it was
 * @fires tc-chunk-change - The words at a time were changed ({ chunk }: SpeedReaderChunkChange); cancelable – prevented, `chunk` stays
 * @fires tc-position-change - The place moved, by reading on, stepping or the scrubber ({ position }: SpeedReaderPositionChange); cancelable – prevented, `position` stays
 * @fires tc-finish - The last word was shown ({ words }: SpeedReaderFinish)
 */
export class TcSpeedReader extends TcElement {
  static override ui = "spr";
  private uid = `tc-spr-${++uidCount}`;

  /** The heading */
  @property() accessor heading = "Speed reader";
  /** A quiet line under the heading – the source or what the passage is */
  @property() accessor description = "";
  /** The passage: plain text; a blank line starts a new paragraph */
  @property() accessor text = "";
  /** Words a minute, 100–1000. Changed by the element unless a tc-wpm-change listener calls preventDefault() */
  @property({ type: Number }) accessor wpm = 300;
  /** Words shown at a time, 1–3. Changed by the element unless a tc-chunk-change listener calls preventDefault() */
  @property({ type: Number }) accessor chunk = 1;
  /** The first word on screen (0-based). Changed by the element unless a tc-position-change listener calls preventDefault() */
  @property({ type: Number }) accessor position = 0;
  /** When the next word is due – setTimeout unless given; tests and pages that sync to something else pass their own */
  @property({ attribute: false }) accessor scheduler: SpeedReaderScheduler = timeoutScheduler;

  @state() private accessor _playing = false;
  /** @internal What screen readers hear */
  @state() accessor said = "";

  /** Whether it's reading */
  get playing() {
    return this._playing;
  }

  private words: Word[] = [];
  private sentenceStarts: number[] = [];
  private timer: unknown = undefined;
  private timerFrom: SpeedReaderScheduler | undefined;
  private toolbar = new ToolbarController(this, { items: () => [...this.querySelectorAll<HTMLButtonElement>(".ui-spr__bar button")] });

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.halt();
    this._playing = false;
  }

  /* ---------- Timing ---------- */

  private get at() {
    return Math.min(Math.max(0, Math.floor(this.position) || 0), Math.max(0, this.words.length - 1));
  }
  private get size() {
    return clampChunk(this.chunk);
  }
  private delay(from: number) {
    const base = 60_000 / clampWpm(this.wpm);
    return this.words.slice(from, from + this.size).reduce((ms, w) => ms + base * wordWeight(w.text), 0);
  }

  private halt() {
    if (this.timer !== undefined) this.timerFrom?.clear(this.timer);
    this.timer = undefined;
  }

  private schedule() {
    this.halt();
    if (!this._playing) return;
    const from = this.at;
    this.timerFrom = this.scheduler;
    this.timer = this.scheduler.set(() => {
      this.timer = undefined;
      this.advance(from);
    }, this.delay(from));
  }

  private advance(from: number) {
    if (!this._playing) return;
    const next = from + this.size;
    if (next >= this.words.length) {
      this._playing = false;
      this.said = "Finished";
      this.emit("tc-finish", { words: this.words.length });
      return;
    }
    this.move(next);
  }

  /** Moves to a word; returns false when a listener kept the place */
  private move(to: number) {
    const position = Math.min(Math.max(0, to), Math.max(0, this.words.length - 1));
    if (position === this.position) return true;
    if (!this.emit("tc-position-change", { position }, { cancelable: true })) return false;
    this.position = position;
    return true;
  }

  /* ---------- Actions ---------- */

  /** Starts reading (from the start again when at the end) */
  play() {
    if (!this.words.length || this._playing) return;
    if (this.at + this.size >= this.words.length && this.at > 0) this.move(0);
    this._playing = true;
    this.said = `Reading at ${clampWpm(this.wpm)} words a minute`;
  }
  /** Pauses on the current word */
  pause() {
    if (!this._playing) return;
    this._playing = false;
    this.halt();
    this.said = `Paused at word ${this.at + 1} of ${this.words.length}`;
  }
  private toggle() {
    if (this._playing) this.pause();
    else this.play();
  }
  private stepWord(dir: 1 | -1) {
    this.move(this.at + dir * this.size);
  }
  private stepSentence(dir: 1 | -1) {
    const s = this.words[this.at]?.sentence ?? 0;
    const start = this.sentenceStarts[s] ?? 0;
    if (dir < 0) this.move(this.at > start ? start : (this.sentenceStarts[s - 1] ?? 0));
    else this.move(this.sentenceStarts[s + 1] ?? this.words.length - 1);
  }
  private restart() {
    this.move(0);
  }

  private setWpm(e: Event) {
    const input = e.target as HTMLInputElement;
    const wpm = clampWpm(input.valueAsNumber);
    if (this.emit("tc-wpm-change", { wpm }, { cancelable: true })) this.wpm = wpm;
    else input.value = String(this.wpm);
  }
  private setChunk(e: Event) {
    const select = e.target as HTMLSelectElement;
    const chunk = clampChunk(Number(select.value));
    if (this.emit("tc-chunk-change", { chunk }, { cancelable: true })) this.chunk = chunk;
    else select.value = String(this.size);
  }
  private scrub(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!this.move(input.valueAsNumber)) input.value = String(this.at);
  }

  private onFrameKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === " ") this.toggle();
    else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const dir = e.key === "ArrowLeft" ? -1 : 1;
      if (e.shiftKey) this.stepSentence(dir);
      else this.stepWord(dir);
    }
    else if (e.key === "Home") this.move(0);
    else if (e.key === "End") this.move(this.words.length - 1);
    else return;
    e.preventDefault();
  };

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("text")) {
      this.words = readerWords(this.text);
      this.sentenceStarts = [];
      this.words.forEach((w, i) => {
        if (this.sentenceStarts[w.sentence] === undefined) this.sentenceStarts[w.sentence] = i;
      });
      if (!this.words.length && this._playing) {
        this._playing = false;
        this.halt();
      }
    }
    this.toggleAttribute("data-playing", this._playing);
  }

  protected override updated(changed: PropertyValues<this>) {
    // Each shown word (re)starts the clock for the next; so does a new speed, chunk size or scheduler
    if (changed.has("_playing" as keyof TcSpeedReader) || changed.has("position") || changed.has("wpm") || changed.has("chunk") || changed.has("text") || changed.has("scheduler")) {
      if (this._playing) this.schedule();
      else this.halt();
    }
  }

  /* ---------- Render ---------- */

  private timeLeft() {
    const base = 60_000 / clampWpm(this.wpm);
    let ms = 0;
    for (let i = this.at; i < this.words.length; i++) ms += base * wordWeight(this.words[i].text);
    const secs = Math.round(ms / 1000);
    return `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")} left`;
  }

  private renderFrame() {
    const shown = this.words.slice(this.at, this.at + this.size);
    const text = shown.map((w) => w.text).join(" ");
    // The pivot is the recognition point of the middle word shown
    const mid = Math.floor((shown.length - 1) / 2);
    const offset = shown.slice(0, mid).reduce((n, w) => n + w.text.length + 1, 0);
    const pivot = shown.length ? offset + recognitionPoint(shown[mid].text) : 0;
    return html`<div
      class="ui-spr__frame"
      role="group"
      aria-label="Reader"
      tabindex="0"
      aria-describedby=${`${this.uid}-keys`}
      aria-keyshortcuts="Space ArrowLeft ArrowRight Shift+ArrowLeft Shift+ArrowRight Home End"
      @keydown=${this.onFrameKey}
    >
      <span class="ui-spr__guide" aria-hidden="true"></span>
      ${shown.length
        ? html`<p class="ui-spr__word" aria-hidden="true"
              ><span class="ui-spr__left">${text.slice(0, pivot)}</span><span class="ui-spr__pivot">${text[pivot]}</span><span class="ui-spr__right">${text.slice(pivot + 1)}</span></p
            ><span class="ui-spr__sr">${text}</span>`
        : html`<p class="ui-spr__none">Nothing to read yet.</p>`}
    </div>`;
  }

  private renderContext() {
    if (this._playing || !this.words.length) return nothing;
    const s = this.words[this.at].sentence;
    const start = this.sentenceStarts[s] ?? 0;
    const end = this.sentenceStarts[s + 1] ?? this.words.length;
    const words = this.words.slice(start, end);
    return html`<p class="ui-spr__context">
      ${words.map((w, k) => {
        const i = start + k;
        const on = i >= this.at && i < this.at + this.size;
        return html`${k ? " " : ""}${on ? html`<mark class="ui-spr__mark">${w.text}</mark>` : w.text}`;
      })}
    </p>`;
  }

  private renderControls() {
    const n = this.words.length;
    const off = !n;
    const atStart = this.at === 0;
    const atEnd = this.at + this.size >= n;
    const tool = (label: string, d: string, disabled: boolean, run: () => void) =>
      html`<button type="button" class="ui-spr__tool" ?disabled=${disabled} @click=${run}>${glyph(d)}<span class="ui-spr__sr">${label}</span></button>`;
    return html`<div class="ui-spr__bar" role="toolbar" aria-label="Reading controls" @keydown=${this.toolbar.onKeyDown} @focusin=${this.toolbar.onFocusIn}>
      ${tool("Start over", ICON.restart, off || atStart, () => this.restart())}
      ${tool("Previous sentence", ICON.sentence.back, off || atStart, () => this.stepSentence(-1))}
      ${tool("Previous word", ICON.word.back, off || atStart, () => this.stepWord(-1))}
      <button type="button" class="ui-spr__play" ?disabled=${off} aria-keyshortcuts="Space" @click=${() => this.toggle()}>
        ${glyph(this._playing ? ICON.pause : ICON.play)}${this._playing ? "Pause" : "Play"}
      </button>
      ${tool("Next word", ICON.word.forward, off || atEnd, () => this.stepWord(1))}
      ${tool("Next sentence", ICON.sentence.forward, off || atEnd, () => this.stepSentence(1))}
    </div>`;
  }

  private renderSettings() {
    const n = this.words.length;
    const wpm = clampWpm(this.wpm);
    const fill = (v: number, min: number, max: number) => `--fill: ${max > min ? ((v - min) / (max - min)) * 100 : 0}%`;
    return html`<div class="ui-spr__scrub">
        <label class="ui-spr__field ui-spr__field--wide"
          ><span class="ui-spr__label"><span>Word ${n ? this.at + 1 : 0} of ${n}</span><span class="ui-spr__left-time">${n ? this.timeLeft() : ""}</span></span
          ><input
            class="ui-spr__range"
            type="range"
            min="0"
            max=${Math.max(0, n - 1)}
            step="1"
            ?disabled=${!n}
            style=${fill(this.at, 0, n - 1)}
            .value=${live(String(this.at))}
            aria-label="Place in the text"
            aria-valuetext=${`Word ${n ? this.at + 1 : 0} of ${n}`}
            @input=${this.scrub}
        /></label>
      </div>
      <div class="ui-spr__settings">
        <label class="ui-spr__field"
          ><span class="ui-spr__label">Speed <output class="ui-spr__value">${wpm} wpm</output></span
          ><input
            class="ui-spr__range"
            type="range"
            min=${MIN_WPM}
            max=${MAX_WPM}
            step="25"
            style=${fill(wpm, MIN_WPM, MAX_WPM)}
            .value=${live(String(wpm))}
            aria-valuetext=${`${wpm} words a minute`}
            @input=${this.setWpm}
        /></label>
        <label class="ui-spr__field"
          ><span class="ui-spr__label">Words at a time</span
          ><span class="ui-spr__select"
            ><select class="ui-spr__input" .value=${live(String(this.size))} @change=${this.setChunk}>
              ${[1, 2, 3].map((k) => html`<option value=${k} ?selected=${k === this.size}>${k === 1 ? "1 word" : `${k} words`}</option>`)}
            </select
            >${chevron()}</span
          ></label
        >
      </div>`;
  }

  protected override render() {
    const id = `${this.uid}-title`;
    return html`
      ${cardHead({
        icon: ICON.head,
        title: this.heading,
        subtitle: this.description || undefined,
        id,
        aside: html`<span class="ui-spr__pill" ?data-on=${this._playing}>${clampWpm(this.wpm)} wpm</span>`,
      })}
      <section class="ui-spr__card" aria-labelledby=${id}>
        <div class="ui-spr__stage">${this.renderFrame()} ${this.renderContext()}</div>
        <div class="ui-spr__foot">${this.renderControls()} ${this.renderSettings()}</div>
      </section>
      <span class="ui-spr__sr" id=${`${this.uid}-keys`}>Space plays and pauses. Arrow keys step a word, with Shift a sentence.</span>
      <span class="ui-spr__sr" role="status">${this.said}</span>
    `;
  }

  static override css = /* css */ `
[data-ui="spr"] {
  /* The frame the words appear in */
  --tc-spr-frame-h: 128px;
  --tc-spr-guide: var(--tc-border-strong);
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
:where([data-look="standard"], [data-look="standard"] *)[data-ui="spr"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  color: var(--tc-text-secondary);
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="spr"] {
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-secondary);
}
[data-ui="spr"] *, [data-ui="spr"] *::before, [data-ui="spr"] *::after { box-sizing: border-box; }
:where([data-ui="spr"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="spr"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="spr"] p { margin: 0; }
.ui-spr__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-spr__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-spr__card { border-top: var(--tc-hairline) solid var(--tc-divider); }

.ui-spr__pill { display: inline-flex; align-items: center; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5); border-radius: var(--tc-radius-full); background: var(--tc-fill-subtle); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-spr__pill[data-on] { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }

/* ----- The frame: the recognition point always on the guide marks at the centre ----- */
.ui-spr__stage { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-5) var(--tc-space-5) var(--tc-space-4); }
.ui-spr__frame {
  position: relative;
  display: grid;
  align-items: center;
  height: var(--tc-spr-frame-h);
  overflow: hidden;
  border-radius: var(--tc-radius-md);
  background: var(--tc-surface-sunken);
  cursor: default;
}
.ui-spr__frame:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* Two hairlines across, each with a short tick at the centre */
.ui-spr__guide { position: absolute; inset: var(--tc-space-4) 0; pointer-events: none; border-block: var(--tc-hairline) solid var(--tc-divider); }
.ui-spr__guide::before, .ui-spr__guide::after { content: ""; position: absolute; left: 50%; width: 2px; height: var(--tc-space-2); background: var(--tc-spr-guide); transform: translateX(-50%); }
.ui-spr__guide::before { top: 0; }
.ui-spr__guide::after { bottom: 0; }
.ui-spr__word {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: baseline;
  color: var(--tc-text-primary);
  font-size: var(--tc-font-size-3xl);
  line-height: var(--tc-line-height-tight);
  letter-spacing: var(--tc-tracking-snug);
  white-space: pre;
}
/* A long chunk runs off the frame's edges; the left part is end-aligned so it overflows to the left. Only the sides
   are cut: clipping both ways cut the descenders (g, y, p) off the tight line */
.ui-spr__left { display: flex; justify-content: flex-end; overflow-x: clip; overflow-y: visible; }
.ui-spr__right { overflow-x: clip; overflow-y: visible; }
.ui-spr__pivot { color: var(--tc-accent-text); font-weight: var(--tc-font-weight-strong); }
.ui-spr__none { text-align: center; color: var(--tc-text-muted); }

/* Paused: the sentence around the word, the word marked */
.ui-spr__context { padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-relaxed); overflow-wrap: break-word; animation: ui-spr-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-spr__mark { padding: 0 var(--tc-space-0-5); border-radius: var(--tc-radius-2xs); background: var(--tc-accent-subtle); color: var(--tc-accent-text); font-weight: var(--tc-font-weight-semibold); box-shadow: inset 0 -2px 0 var(--tc-accent); }

/* ----- Controls and settings ----- */
.ui-spr__foot { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-5) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-spr__bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: var(--tc-space-1); }
.ui-spr__tool { display: grid; place-items: center; width: var(--tc-control-h-md); height: var(--tc-control-h-md); border-radius: var(--tc-control-radius-md); color: var(--tc-text-secondary); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-spr__tool:hover:not(:disabled) { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-spr__tool:disabled, .ui-spr__play:disabled { color: var(--tc-text-disabled); cursor: not-allowed; }
.ui-spr__play { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1-5); min-width: 96px; height: var(--tc-control-h-md); margin: 0 var(--tc-space-1); padding: 0 var(--tc-control-px-md) 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-spr__play:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); }
.ui-spr__play:active:not(:disabled) { background: var(--tc-action-primary-bg-active); }
.ui-spr__play:disabled { background: var(--tc-fill-subtle); box-shadow: none; }
.ui-spr__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }
.ui-spr__play .ui-spr__glyph { fill: currentColor; stroke-width: 1.5; }
:where([data-look="clean"], [data-look="clean"] *).ui-spr__glyph { stroke-width: 1.4; }

.ui-spr__settings { display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); align-items: end; gap: var(--tc-space-4); }
.ui-spr__field { display: grid; gap: var(--tc-space-1-5); min-width: 0; }
.ui-spr__label { display: flex; align-items: baseline; justify-content: space-between; gap: var(--tc-space-2); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-spr__left-time { color: var(--tc-text-muted); }
.ui-spr__value { color: var(--tc-text-primary); }
.ui-spr__select { position: relative; display: block; min-width: 0; }
.ui-spr__input { width: 100%; min-width: 0; height: var(--tc-field-h); margin: 0; padding: 0 var(--tc-space-8) 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); outline: none; appearance: none; cursor: pointer; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-spr__input:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-spr__input:focus-visible { box-shadow: var(--tc-field-shadow-focus); }
.ui-spr__chevron { position: absolute; top: 50%; right: var(--tc-space-3); width: var(--tc-space-4); height: var(--tc-space-4); fill: none; stroke: var(--tc-icon-muted); stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; transform: translateY(-50%); pointer-events: none; }
.ui-spr__range { display: block; width: 100%; height: var(--tc-field-h); margin: 0; background: transparent; cursor: pointer; appearance: none; -webkit-appearance: none; }
.ui-spr__range:disabled { cursor: not-allowed; }
.ui-spr__range::-webkit-slider-runnable-track { height: var(--tc-meter-h); border-radius: var(--tc-meter-radius); background: linear-gradient(to right, var(--tc-meter-fill) var(--fill), var(--tc-meter-track) var(--fill)); }
.ui-spr__range::-moz-range-track { height: var(--tc-meter-h); border-radius: var(--tc-meter-radius); background: linear-gradient(to right, var(--tc-meter-fill) var(--fill), var(--tc-meter-track) var(--fill)); }
:where([data-look="clean"], [data-look="clean"] *).ui-spr__range::-webkit-slider-runnable-track { background: linear-gradient(to right, var(--tc-accent) var(--fill), var(--tc-meter-track) var(--fill)); }
:where([data-look="clean"], [data-look="clean"] *).ui-spr__range::-moz-range-track { background: linear-gradient(to right, var(--tc-accent) var(--fill), var(--tc-meter-track) var(--fill)); }
.ui-spr__range::-webkit-slider-thumb { width: 16px; height: 16px; margin-top: calc((var(--tc-meter-h) - var(--tc-space-4)) / 2); border: 0; border-radius: 50%; background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control), 0 0 0 1px var(--tc-border-control); appearance: none; -webkit-appearance: none; }
.ui-spr__range::-moz-range-thumb { width: 16px; height: 16px; border: 0; border-radius: 50%; background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control), 0 0 0 1px var(--tc-border-control); }
.ui-spr__range:focus-visible { outline: none; }
.ui-spr__range:focus-visible::-webkit-slider-thumb { box-shadow: var(--tc-shadow-control), 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
.ui-spr__range:focus-visible::-moz-range-thumb { box-shadow: var(--tc-shadow-control), 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }

@keyframes ui-spr-in { from { opacity: 0; transform: translateY(-2px); } to { opacity: 1; transform: none; } }

@container (max-width: 480px) {
  [data-ui="spr"] { --tc-spr-frame-h: 112px; }
  .ui-spr__word { font-size: var(--tc-font-size-2xl); }
  .ui-spr__stage, .ui-spr__foot { padding-left: var(--tc-space-4); padding-right: var(--tc-space-4); }
  .ui-spr__settings { grid-template-columns: minmax(0, 1fr); }
}
@media (hover: none) and (pointer: coarse) {
  .ui-spr__tool { width: var(--tc-control-h-lg); height: var(--tc-control-h-lg); }
  .ui-spr__play { height: var(--tc-control-h-lg); }
}
@media (forced-colors: active) {
  .ui-spr__guide::before, .ui-spr__guide::after { background: CanvasText; }
  .ui-spr__pivot { color: Highlight; }
  .ui-spr__mark { background: Highlight; color: HighlightText; }
  .ui-spr__chevron { stroke: ButtonText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="spr"] *, [data-ui="spr"] *::before, [data-ui="spr"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-speed-reader")) customElements.define("tc-speed-reader", TcSpeedReader);

declare global {
  interface HTMLElementTagNameMap {
    "tc-speed-reader": TcSpeedReader;
  }
}
