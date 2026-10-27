import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { reducedMotion } from "../internal/reduced-motion";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, OffScreenController, RowWindowController } from "./internal/controllers";
import { copyText, initials } from "./internal/util";

/*
 * <tc-transcript-review> – a recording with the transcript that follows it. A person listens (or watches) and reads
 * at once: the segment being spoken is highlighted and kept in view, every segment carries its timestamp, its speaker
 * and how sure speech recognition (and translation) was, and segments below the confidence threshold are marked so
 * they get checked against the recording – "Send to verification" hands one to the app's review process.
 *   · the media is a native <audio> or <video>: passed in as `media`, or made from `src`. The element draws its own
 *     controls; the waveform is the app's peaks (no decoding here), with the playhead, a click or drag to seek, the
 *     low-confidence stretches underlined and search matches ticked
 *   · the segments are a listbox whose selection follows playback; scrolling it yourself pauses the following, and
 *     "Back to now" resumes it. Clicking a segment plays from it
 *   · keys: Space plays or pauses (on the waveform), J K L go back, pause and forward, ← → step segments (anywhere
 *     outside the search field), ↑ ↓ Home End move in the list, Enter plays from a segment, C copies it and V sends it
 *   · speakers are colour chips that filter the list; the transcript shows the original, the translation or both side
 *     by side; search marks matches in the text and on the waveform, Enter steps through them
 *   · a polite live region names the speaker when it changes during playback
 *   · long transcripts render only the rows near the viewport (RowWindowController) – 5,000 segments stay smooth;
 *     windowed rows are one height, so their text stops at two lines
 * Standard: the header on the gray tray, a white card with the player, the tools and the list, then the segment's
 * actions on the tray. Clean: one white card, divided by hairlines, with thinner icons.
 *
 *   <tc-transcript-review src="call.mp3" .peaks=${peaks} .segments=${segments}></tc-transcript-review>
 */

/** A word with its own recognition confidence – optional detail inside a segment */
export type TranscriptWord = {
  text: string;
  /** 0–1; below the element's `threshold` the word is underlined as uncertain */
  confidence?: number;
};
/** One stretch of speech */
export type TranscriptSegment = {
  id: string;
  /** Seconds from the start of the recording */
  start: number;
  end: number;
  /** A speaker's id – named and coloured by `speakers` */
  speaker: string;
  text: string;
  /** Speech-recognition confidence, 0–1 */
  confidence?: number;
  /** The text in the other language */
  translation?: string;
  /** Translation confidence, 0–1 */
  translationConfidence?: number;
  /** The words of `text` in order, each with its own confidence */
  words?: TranscriptWord[];
};
/** A speaker's chip colour */
export type TranscriptTone = "blue" | "violet" | "teal" | "pink" | "rose" | "amber";
export type TranscriptSpeaker = {
  id: string;
  name: string;
  /** The chip's text – default the name's initials ("Speaker 1" → "S1") */
  short?: string;
  /** The chip's colour – default the next in turn */
  tone?: TranscriptTone;
};
export type TranscriptTranslationMode = "original" | "translation" | "both";
export type TranscriptMediaKind = "audio" | "video";

/** Details of the events */
export type TranscriptVerifyDetail = { segment: TranscriptSegment; sent: string[] };
export type TranscriptCopyDetail = { segment: TranscriptSegment; text: string };
export type TranscriptSegmentChange = { segment: TranscriptSegment | null };
export type TranscriptQueryChange = { query: string };
export type TranscriptHiddenSpeakersChange = { hiddenSpeakers: string[] };
export type TranscriptTranslationModeChange = { mode: TranscriptTranslationMode };

const TONES: TranscriptTone[] = ["blue", "violet", "teal", "pink", "rose", "amber"];
const MODES: TranscriptTranslationMode[] = ["original", "translation", "both"];
const RATES = [1, 1.25, 1.5, 2, 0.75];
/** More rows than this render only the ones near the viewport */
const WINDOW_FROM = 100;
const OVERSCAN = 16;
const ROW_H = 56;
/** The waveform's resolution for its marks (low-confidence bands, search ticks) */
const WAVE_BUCKETS = 240;
const COPIED_MS = 1600;
let instances = 0;

/* After Lucide – 24×24 stroke icons */
const headIcon = svg`<path d="M2 10v3"></path><path d="M6 6v11"></path><path d="M10 3v18"></path><path d="M14 8v7"></path><path d="M18 5v13"></path><path d="M22 10v3"></path>`;
const I = {
  play: svg`<path d="M7 4.5v15a1 1 0 0 0 1.52.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 7 4.5Z" fill="currentColor"></path>`,
  pause: svg`<rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor"></rect><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor"></rect>`,
  back: svg`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path>`,
  forward: svg`<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path>`,
  search: svg`<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path>`,
  up: svg`<path d="m18 15-6-6-6 6"></path>`,
  down: svg`<path d="m6 9 6 6 6-6"></path>`,
  copy: svg`<rect width="13" height="13" x="8" y="8" rx="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`,
  check: svg`<path d="M20 6 9 17l-5-5"></path>`,
  verify: svg`<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="m9 12 2 2 4-4"></path>`,
  alert: svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>`,
  follow: svg`<path d="M12 4v12"></path><path d="m6 10 6 6 6-6"></path><path d="M19 20H5"></path>`,
  retry: svg`<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path><path d="M8 16H3v5"></path>`,
};
const icon = (body: TemplateResult) => html`<svg class="ui-tsr__icon" viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;

/** A timestamp: 00:42 · 1:04:09 */
export function transcriptClock(seconds: number, pad = true) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  if (h) return `${h}:${String(m).padStart(2, "0")}:${ss}`;
  return `${pad ? String(m).padStart(2, "0") : m}:${ss}`;
}
const pct = (n: number) => `${Math.round(n * 100)}%`;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Runs of text, each marked as a search hit, an uncertain word, both or neither */
type Mark = [start: number, end: number, kind: "hit" | "low"];
function marked(text: string, marks: Mark[]) {
  if (!marks.length) return text;
  const cuts = new Set([0, text.length]);
  for (const [a, b] of marks) cuts.add(a).add(b);
  const at = [...cuts].sort((x, y) => x - y);
  const out: (TemplateResult | string)[] = [];
  for (let i = 0; i < at.length - 1; i++) {
    const [a, b] = [at[i], at[i + 1]];
    if (a === b) continue;
    const piece = text.slice(a, b);
    const hit = marks.some(([x, y, k]) => k === "hit" && x <= a && y >= b);
    const low = marks.some(([x, y, k]) => k === "low" && x <= a && y >= b);
    const inner = low ? html`<span class="ui-tsr__lw">${piece}</span>` : piece;
    out.push(hit ? html`<mark class="ui-tsr__hit">${inner}</mark>` : inner);
  }
  return out;
}
function hits(text: string, query: string): Mark[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const lower = text.toLowerCase();
  const out: Mark[] = [];
  for (let i = lower.indexOf(q); i >= 0; i = lower.indexOf(q, i + q.length)) out.push([i, i + q.length, "hit"]);
  return out;
}

type Who = { id: string; name: string; short: string; tone: TranscriptTone };

/**
 * A recording with a transcript that follows playback: timestamps, speakers, recognition and translation confidence,
 * low-confidence segments marked, search, and "Send to verification".
 * @tag tc-transcript-review
 * @fires tc-segment-change - The segment being played changed (playback, a seek or a step); detail `{ segment }` (TranscriptSegmentChange) – null in a gap between segments
 * @fires tc-verify - "Send to verification" on a segment; detail `{ segment, sent }` (TranscriptVerifyDetail) – `sent` is the list after it. Cancelable: preventDefault() keeps `sent` as it is
 * @fires tc-copy - Copy on a segment; detail `{ segment, text }` (TranscriptCopyDetail) – the text with its timestamp and speaker. Cancelable: preventDefault() and copy it yourself
 * @fires tc-query-change - The search text changed; detail `{ query }` (TranscriptQueryChange). Cancelable
 * @fires tc-hidden-speakers-change - A speaker chip was toggled; detail `{ hiddenSpeakers }` (TranscriptHiddenSpeakersChange). Cancelable
 * @fires tc-translation-mode-change - Original, Translation or Side by side was chosen; detail `{ mode }` (TranscriptTranslationModeChange). Cancelable
 */
export class TcTranscriptReview extends TcElement {
  static override ui = "tsr";

  /** The transcript, in order of `start` */
  @property({ attribute: false }) accessor segments: TranscriptSegment[] = [];
  /** Names, chip text and colours for the speaker ids in `segments`; an id with no entry shows as itself */
  @property({ attribute: false }) accessor speakers: TranscriptSpeaker[] = [];
  /** The recording's URL; the element makes its own <audio> or <video> (see `kind`). Ignored when `media` is set */
  @property() accessor src = "";
  /** The app's own <audio> or <video> to drive instead of `src`. A <video> that isn't on the page is shown in the card */
  @property({ attribute: false }) accessor media: HTMLMediaElement | null = null;
  /** What `src` is: "audio" (default) or "video", which shows the picture above the waveform */
  @property() accessor kind: TranscriptMediaKind = "audio";
  /** The waveform: loudness peaks from 0 to 1, as many as you have – they're resampled to fit the width */
  @property({ attribute: false }) accessor peaks: number[] = [];
  /** The recording's length in seconds, until the media reports it (default: the last segment's end) */
  @property({ type: Number }) accessor duration: number | undefined = undefined;
  /** Segments and words with confidence below this (0–1) are marked for checking */
  @property({ type: Number }) accessor threshold = 0.7;
  /** The heading, and the region's name */
  @property() accessor heading = "Transcript";
  /** The quiet line under the heading (default: the length and how many speakers) */
  @property() accessor description = "";
  /** What the transcript shows when segments have translations: the original, the translation, or both side by side */
  @property({ attribute: "translation-mode" }) accessor translationMode: TranscriptTranslationMode = "original";
  /** The name of the original language's column and button, e.g. "Spanish" */
  @property({ attribute: "original-label" }) accessor originalLabel = "Original";
  /** The name of the translation's column and button, e.g. "English (machine)" */
  @property({ attribute: "translation-label" }) accessor translationLabel = "Translation";
  /** Speaker ids whose segments the list leaves out */
  @property({ attribute: false }) accessor hiddenSpeakers: string[] = [];
  /** The search text */
  @property() accessor query = "";
  /** Ids of segments already sent to verification */
  @property({ attribute: false }) accessor sent: string[] = [];
  /** Shows "Send to verification" on each segment (default true) */
  @property({ type: Boolean }) accessor verifiable = true;
  /** The verification action's label */
  @property({ attribute: "verify-label" }) accessor verifyLabel = "Send to verification";
  /** How far J and L (and the back and forward buttons) jump, in seconds */
  @property({ type: Number }) accessor skip = 5;
  /** The tallest the list grows, in px, before it scrolls */
  @property({ type: Number, attribute: "max-height" }) accessor maxHeight = 360;

  /** @internal Where playback is, in seconds */
  @state() accessor time = 0;
  /** @internal */
  @state() accessor playing = false;
  /** @internal */
  @state() accessor rate = 1;
  /** @internal The list keeps the current segment in view */
  @state() accessor follow = true;
  /** @internal The segment the list's selection and tab stop are on */
  @state() accessor active: string | null = null;
  /** @internal The duration the media reported */
  @state() accessor mediaDuration: number | undefined = undefined;
  /** @internal */
  @state() accessor mediaError = false;
  /** @internal How many waveform bars fit */
  @state() accessor bars = 72;
  /** @internal The search match last jumped to */
  @state() accessor matchAt = -1;
  /** @internal The segment whose copy just worked */
  @state() accessor copied: string | null = null;
  /** @internal A polite message for screen readers */
  @state() accessor said = "";

  private readonly uid = `tc-tsr${++instances}`;
  private readonly win: RowWindowController;
  private segs: TranscriptSegment[] = [];
  private shown: TranscriptSegment[] = [];
  private shownIndex = new Map<string, number>();
  private segIndex = new Map<string, number>();
  private who = new Map<string, Who>();
  private hitIds: string[] = [];
  private builtFrom: unknown[] = [];
  private current = -1;
  private lastSpeaker: string | null = null;
  private bound: HTMLMediaElement | null = null;
  private placed: HTMLMediaElement | null = null;
  private frame = 0;
  private ro?: ResizeObserver;
  private copiedTimer = 0;
  private focusRow: string | null = null;
  private followTo = false;
  private dragging = false;
  private ownName = false;

  constructor() {
    super();
    this.win = new RowWindowController(this, {
      count: () => this.shown.length,
      body: () => this.querySelector(".ui-tsr__rows"),
      rowSelector: ".ui-tsr__row:not([data-float])",
      from: WINDOW_FROM,
      overscan: OVERSCAN,
      rowHeight: ROW_H,
    });
    // A row that leaves the list (its speaker hidden) hands focus to the row now selected, else the search field
    new FocusRescueController(this, () => this.rowEl(this.active) ?? this.querySelector<HTMLElement>(".ui-tsr__input"));
    // While playing, the host is watched: scrolled off-screen it gets data-offscreen and the playhead loop pauses
    new OffScreenController(this, () => this.playing);
  }

  /* ---------- Public ---------- */

  /** The recording's length in seconds: `duration`, else what the media reports, else the last segment's end */
  get totalDuration() {
    return this.duration ?? this.mediaDuration ?? (this.segs.length ? this.segs[this.segs.length - 1].end : 0);
  }

  /** The segment being played, if any */
  get currentSegment(): TranscriptSegment | null {
    return this.segs[this.current] ?? null;
  }

  /** Plays the media from where it is */
  play() {
    const m = this.mediaEl();
    if (m) void m.play()?.catch(() => {});
  }

  /** Pauses the media */
  pause() {
    this.mediaEl()?.pause();
  }

  /** Moves playback to `seconds` from the start */
  seek(seconds: number) {
    const t = clamp(seconds, 0, this.totalDuration || Math.max(0, seconds));
    const m = this.mediaEl();
    if (m) {
      try {
        m.currentTime = t;
      } catch {
        /* not seekable yet */
      }
    }
    this.sync(t, true);
  }

  /* ---------- Lifecycle ---------- */

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    this.ownName ||= (this.hasAttribute("aria-label") && this.getAttribute("aria-label") !== this.heading) || this.hasAttribute("aria-labelledby");
    this.addEventListener("keydown", this.onKey);
    // Moved on the page: the media listeners and the waveform's observer were let go on disconnect
    if (this.hasUpdated) this.requestUpdate();
  }

  /** @internal The off-screen controller sets data-offscreen: the playhead's frame loop stops off-screen and resumes on return */
  override toggleAttribute(name: string, force?: boolean) {
    const on = super.toggleAttribute(name, force);
    if (name === "data-offscreen") {
      if (on) this.stopLoop();
      else if (this.playing) {
        this.startLoop();
        if (this.bound) this.sync(this.bound.currentTime);
      }
    }
    return on;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("keydown", this.onKey);
    this.stopLoop();
    this.bind(null);
    this.ro?.disconnect();
    this.ro = undefined;
    clearTimeout(this.copiedTimer);
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const from = [this.segments, this.speakers, this.hiddenSpeakers, this.query, this.translationMode];
    if (from.some((v, i) => v !== this.builtFrom[i])) {
      const segsChanged = this.builtFrom[0] !== this.segments;
      this.builtFrom = from;
      if (segsChanged) {
        const s = this.segments ?? [];
        this.segs = s.every((x, i) => i === 0 || s[i - 1].start <= x.start) ? s : [...s].sort((a, b) => a.start - b.start);
        this.segIndex = new Map(this.segs.map((x, i) => [x.id, i]));
        this.current = this.at(this.time);
      }
      this.who = this.speakerMap();
      const hidden = new Set(this.hiddenSpeakers);
      this.shown = hidden.size ? this.segs.filter((x) => !hidden.has(x.speaker)) : this.segs;
      this.shownIndex = new Map(this.shown.map((x, i) => [x.id, i]));
      this.hitIds = this.query.trim() ? this.shown.filter((x) => this.searchText(x).some((t) => hits(t, this.query).length)).map((x) => x.id) : [];
      if (this.matchAt >= this.hitIds.length) this.matchAt = -1;
    }
    const cur = this.segs[this.current];
    if (cur && this.shownIndex.has(cur.id)) this.active = cur.id;
    else if (!this.active || !this.shownIndex.has(this.active)) this.active = this.shown[0]?.id ?? null;
    this.win.compute();
  }

  protected override firstUpdated() {
    this.observeWave();
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (!this.ownName) this.setAttribute("aria-label", this.heading);
    this.style.setProperty("--tc-transcript-review-max", `${this.maxHeight}px`);
    this.observeWave();
    // The media: the app's, else the one made from src. An app's <video> that isn't on the page goes in the card
    if (this.placed && this.placed !== this.media) {
      this.placed.remove();
      this.placed = null;
    }
    if (this.media instanceof HTMLVideoElement && !this.media.isConnected) {
      this.querySelector(".ui-tsr__screen")?.prepend(this.media);
      this.placed = this.media;
    }
    this.bind(this.mediaEl());
    this.paint();
    if (this.focusRow) {
      const el = this.rowEl(this.focusRow);
      const i = this.shownIndex.get(this.focusRow);
      if (el) {
        this.focusRow = null;
        el.focus({ preventScroll: true });
        this.reveal(el, i ?? 0);
      } else if (i !== undefined) this.win.reveal(i);
      else this.focusRow = null;
    } else if (this.followTo) {
      this.followTo = false;
      const id = this.segs[this.current]?.id;
      const i = id ? this.shownIndex.get(id) : undefined;
      if (this.follow && i !== undefined) this.reveal(this.rowEl(id), i);
    }
  }

  /* ---------- Media ---------- */

  private mediaEl() {
    return this.media ?? this.querySelector<HTMLMediaElement>(".ui-tsr__media");
  }

  private bind(m: HTMLMediaElement | null) {
    if (m === this.bound) return;
    const events: [string, EventListener][] = [
      ["timeupdate", this.onTime],
      ["seeked", this.onTime],
      ["play", this.onPlay],
      ["pause", this.onPause],
      ["ended", this.onPause],
      ["loadedmetadata", this.onMeta],
      ["durationchange", this.onMeta],
      ["ratechange", this.onRate],
      ["error", this.onError],
      ["loadstart", this.onLoadStart],
    ];
    if (this.bound) for (const [n, f] of events) this.bound.removeEventListener(n, f);
    this.stopLoop();
    this.bound = m;
    if (!m) return;
    for (const [n, f] of events) m.addEventListener(n, f);
    m.playbackRate = this.rate;
    this.playing = !m.paused && !m.ended;
    if (this.playing) this.startLoop();
    if (m.readyState >= 1) this.onMeta();
    this.mediaError = !!m.error;
  }

  private onTime = () => {
    if (this.bound) this.sync(this.bound.currentTime);
  };
  private onPlay = () => {
    this.playing = true;
    this.lastSpeaker = this.segs[this.current]?.speaker ?? null;
    this.startLoop();
  };
  private onPause = () => {
    this.playing = false;
    this.stopLoop();
    this.onTime();
  };
  private onMeta = () => {
    const d = this.bound?.duration;
    this.mediaDuration = d !== undefined && Number.isFinite(d) && d > 0 ? d : undefined;
  };
  private onRate = () => {
    if (this.bound) this.rate = this.bound.playbackRate;
  };
  private onError = () => {
    this.mediaError = true;
    this.playing = false;
  };
  private onLoadStart = () => {
    this.mediaError = false;
  };

  private startLoop() {
    // Off-screen, the media's timeupdate events still keep the time and segment; only the per-frame playhead waits
    if (this.frame || this.hasAttribute("data-offscreen")) return;
    const tick = () => {
      this.frame = 0;
      if (!this.bound || !this.playing || this.hasAttribute("data-offscreen")) return;
      this.sync(this.bound.currentTime);
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }
  private stopLoop() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  /** The segment playing at `t`, or -1 in a gap */
  private at(t: number) {
    const s = this.segs;
    let lo = 0;
    let hi = s.length - 1;
    let found = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (s[mid].start <= t) {
        found = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    return found >= 0 && t < s[found].end ? found : -1;
  }

  /** Playback moved: the playhead every frame, the template when the second or the segment changes */
  private sync(t: number, seeked = false) {
    const i = this.at(t);
    if (Math.floor(t) !== Math.floor(this.time) || seeked || i !== this.current) this.time = t;
    this.paint(t);
    if (i === this.current) return;
    this.current = i;
    const seg = this.segs[i] ?? null;
    this.emit<TranscriptSegmentChange>("tc-segment-change", { segment: seg });
    if (seg) {
      this.followTo = true;
      if (this.playing && !seeked && seg.speaker !== this.lastSpeaker) this.said = `Now speaking: ${this.nameOf(seg.speaker)}`;
      this.lastSpeaker = seg.speaker;
    }
  }

  /** The playhead and the played bars, without a render */
  private paint(t = this.time) {
    const d = this.totalDuration;
    this.querySelector<HTMLElement>(".ui-tsr__wave")?.style.setProperty("--at", String(d ? clamp(t / d, 0, 1) : 0));
  }

  private observeWave() {
    const wave = this.querySelector<HTMLElement>(".ui-tsr__wave");
    if (this.ro || !wave || typeof ResizeObserver !== "function") return;
    this.ro = new ResizeObserver(() => {
      const n = clamp(Math.round(wave.clientWidth / 6), 24, 180);
      if (n !== this.bars) this.bars = n;
    });
    this.ro.observe(wave);
  }

  private togglePlay() {
    const m = this.mediaEl();
    if (!m) return;
    if (m.paused) this.play();
    else m.pause();
  }

  private jump(by: number) {
    this.seekTo(this.time + by);
  }

  /** A seek the person asked for: the list follows playback again */
  private seekTo(t: number) {
    this.seek(t);
    this.follow = true;
  }

  private cycleRate() {
    const next = RATES[(RATES.indexOf(this.rate) + 1) % RATES.length] ?? 1;
    this.rate = next;
    const m = this.mediaEl();
    if (m) m.playbackRate = next;
  }

  private retry() {
    this.mediaError = false;
    this.mediaEl()?.load();
  }

  /* ---------- Segments ---------- */

  private speakerMap() {
    const map = new Map<string, Who>();
    let n = 0;
    const add = (id: string, sp?: TranscriptSpeaker) => {
      if (map.has(id)) return;
      const name = sp?.name ?? id;
      map.set(id, { id, name, short: sp?.short ?? (initials(name) || name.slice(0, 2)), tone: sp?.tone ?? TONES[n % TONES.length] });
      n++;
    };
    for (const sp of this.speakers ?? []) add(sp.id, sp);
    for (const s of this.segs) add(s.speaker);
    return map;
  }

  private nameOf(id: string) {
    return this.who.get(id)?.name ?? id;
  }

  private hasTranslations() {
    return this.segs.some((s) => s.translation);
  }

  private mode(): TranscriptTranslationMode {
    return this.hasTranslations() ? this.translationMode : "original";
  }

  /** The texts the list shows for a segment, in order */
  private searchText(s: TranscriptSegment) {
    const m = this.mode();
    return m === "original" ? [s.text] : m === "translation" ? [s.translation ?? ""] : [s.text, s.translation ?? ""];
  }

  private low(s: TranscriptSegment) {
    return s.confidence !== undefined && s.confidence < this.threshold;
  }
  private lowTranslation(s: TranscriptSegment) {
    return s.translationConfidence !== undefined && s.translationConfidence < this.threshold;
  }
  private lowWords(s: TranscriptSegment): Mark[] {
    if (!s.words) return [];
    const out: Mark[] = [];
    let at = 0;
    for (const w of s.words) {
      const i = s.text.indexOf(w.text, at);
      if (i < 0) continue;
      at = i + w.text.length;
      if (w.confidence !== undefined && w.confidence < this.threshold) out.push([i, at, "low"]);
    }
    return out;
  }

  private rowEl(id: string | null | undefined) {
    return id ? this.querySelector<HTMLElement>(`.ui-tsr__row[data-id="${CSS.escape(id)}"]`) : null;
  }

  /** Scrolls the list so row `i` is in view, a third of the way down when it has to move */
  private reveal(el: HTMLElement | null, i: number) {
    const list = this.querySelector<HTMLElement>(".ui-tsr__list");
    const rows = this.querySelector<HTMLElement>(".ui-tsr__rows");
    if (!list || !rows) return;
    const top = this.win.virtual || !el ? rows.offsetTop + i * this.win.rowHeight : el.offsetTop;
    const h = el?.offsetHeight ?? this.win.rowHeight;
    if (top >= list.scrollTop && top + h <= list.scrollTop + list.clientHeight) return;
    const to = Math.max(0, top - list.clientHeight / 3);
    if (typeof list.scrollTo === "function") list.scrollTo({ top: to, behavior: reducedMotion() ? "auto" : "smooth" });
    else list.scrollTop = to;
  }

  /** Plays from a segment (a click, Enter) */
  private goTo(s: TranscriptSegment, { focus = false, play = false } = {}) {
    this.seek(s.start + 0.001);
    this.follow = true;
    this.followTo = true;
    if (this.shownIndex.has(s.id)) this.active = s.id;
    if (focus) this.focusRow = s.id;
    if (play) this.play();
  }

  /** The segment before or after the one playing – or, from the list, the one selected – among the ones shown */
  private step(dir: -1 | 1, fromList: boolean) {
    const list = this.shown;
    if (!list.length) return;
    const cur = this.segs[this.current];
    const at = cur ? this.shownIndex.get(cur.id) : fromList && this.active ? this.shownIndex.get(this.active) : undefined;
    let to: number;
    if (at !== undefined) to = at + dir;
    else if (dir > 0) to = list.findIndex((s) => s.start > this.time);
    else to = list.map((s) => s.start < this.time).lastIndexOf(true);
    if (to < 0) to = dir > 0 ? list.length - 1 : 0;
    to = clamp(to, 0, list.length - 1);
    this.goTo(list[to], { focus: fromList });
  }

  private copyFor(s: TranscriptSegment) {
    const m = this.mode();
    const stamp = `[${transcriptClock(s.start)}–${transcriptClock(s.end)}] ${this.nameOf(s.speaker)}:`;
    if (m === "translation") return `${stamp} ${s.translation ?? s.text}`;
    if (m === "both" && s.translation) return `${stamp} ${s.text}\n${this.translationLabel}: ${s.translation}`;
    return `${stamp} ${s.text}`;
  }

  private async copySegment(s: TranscriptSegment) {
    const text = this.copyFor(s);
    if (!this.emit<TranscriptCopyDetail>("tc-copy", { segment: s, text }, { cancelable: true })) return;
    const ok = await copyText(text);
    this.said = ok ? `Copied the segment at ${transcriptClock(s.start)}` : "Couldn't copy – select the text instead.";
    if (!ok) return;
    this.copied = s.id;
    clearTimeout(this.copiedTimer);
    this.copiedTimer = window.setTimeout(() => (this.copied = null), COPIED_MS);
  }

  private verify(s: TranscriptSegment) {
    if (!this.verifiable || this.sent.includes(s.id)) return;
    const sent = [...this.sent, s.id];
    if (!this.emit<TranscriptVerifyDetail>("tc-verify", { segment: s, sent }, { cancelable: true })) return;
    this.sent = sent;
    this.said = `Sent the segment at ${transcriptClock(s.start)} to verification`;
  }

  private setQuery(query: string) {
    if (query === this.query) return;
    if (this.emit<TranscriptQueryChange>("tc-query-change", { query }, { cancelable: true })) {
      this.query = query;
      this.matchAt = -1;
    } else this.requestUpdate();
  }

  private nextMatch(dir: 1 | -1) {
    const n = this.hitIds.length;
    if (!n) {
      if (this.query.trim()) this.said = "No matches";
      return;
    }
    let to: number;
    if (this.matchAt < 0) {
      // From where playback is: the first match after it, or the last one before it
      const after = this.hitIds.findIndex((id) => this.segs[this.segIndex.get(id)!].start > this.time + 0.01);
      to = dir > 0 ? (after < 0 ? 0 : after) : (after < 0 ? n : after) - 1;
    } else to = this.matchAt + dir;
    to = (to + n) % n;
    this.matchAt = to;
    const seg = this.segs[this.segIndex.get(this.hitIds[to])!];
    this.goTo(seg);
    this.said = `Match ${to + 1} of ${n}, ${transcriptClock(seg.start)}, ${this.nameOf(seg.speaker)}`;
  }

  private toggleSpeaker(id: string) {
    const hidden = this.hiddenSpeakers.includes(id) ? this.hiddenSpeakers.filter((x) => x !== id) : [...this.hiddenSpeakers, id];
    if (this.emit<TranscriptHiddenSpeakersChange>("tc-hidden-speakers-change", { hiddenSpeakers: hidden }, { cancelable: true })) this.hiddenSpeakers = hidden;
  }

  private setMode(mode: TranscriptTranslationMode) {
    if (mode !== this.translationMode && this.emit<TranscriptTranslationModeChange>("tc-translation-mode-change", { mode }, { cancelable: true })) this.translationMode = mode;
  }

  /* ---------- Keyboard and pointer ---------- */

  private onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target as HTMLElement;
    if (t.closest("input, textarea, select, [contenteditable='true']")) return;
    const inList = !!t.closest(".ui-tsr__rows");
    const onWave = !!t.closest(".ui-tsr__wave");
    const k = e.key;
    const plain = !e.shiftKey;
    const seg = this.active ? this.segs[this.segIndex.get(this.active) ?? -1] : undefined;
    const ends = k === "Home" ? this.shown[0] : this.shown[this.shown.length - 1];
    // The keys the element handles here, and what each does; anything else passes through
    const run =
      k === " " && t.closest(".ui-tsr__player") && !t.closest("button") ? () => this.togglePlay()
      : plain && (k === "j" || k === "J") ? () => this.jump(-this.skip)
      : plain && (k === "l" || k === "L") ? () => this.jump(this.skip)
      : plain && (k === "k" || k === "K") ? () => this.togglePlay()
      : k === "ArrowLeft" || k === "ArrowRight" ? () => this.step(k === "ArrowLeft" ? -1 : 1, inList)
      : onWave && (k === "Home" || k === "End") ? () => this.seekTo(k === "Home" ? 0 : this.totalDuration)
      : !inList ? null
      : k === "ArrowUp" || k === "ArrowDown" ? () => this.step(k === "ArrowUp" ? -1 : 1, true)
      : (k === "Home" || k === "End") && ends ? () => this.goTo(ends, { focus: true })
      : !seg ? null
      : k === "Enter" ? () => this.goTo(seg, { focus: true, play: true })
      : plain && (k === "c" || k === "C") ? () => void this.copySegment(seg)
      : plain && this.verifiable && (k === "v" || k === "V") ? () => this.verify(seg)
      : null;
    if (!run) return;
    e.preventDefault();
    run();
  };

  private seekFrom(e: PointerEvent) {
    const wave = e.currentTarget as HTMLElement;
    const r = wave.getBoundingClientRect();
    if (!r.width) return;
    this.seek(clamp((e.clientX - r.left) / r.width, 0, 1) * this.totalDuration);
    this.follow = true;
  }
  private onWaveDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    this.dragging = true;
    this.seekFrom(e);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      /* a pointer the browser doesn't know (synthetic events) */
    }
  };
  private onWaveMove = (e: PointerEvent) => {
    if (this.dragging) this.seekFrom(e);
  };
  private onWaveUp = (e: PointerEvent) => {
    this.dragging = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      /* not captured */
    }
  };

  /** Scrolling the list yourself pauses following playback */
  private unfollow = (e: Event) => {
    const list = this.querySelector<HTMLElement>(".ui-tsr__list");
    if (!list || list.scrollHeight <= list.clientHeight + 1) return;
    // A press on the list itself is its scrollbar; a press on a row is a pick, which follows again
    if (e.type === "pointerdown" && e.target !== list) return;
    if (e.type === "keydown" && (e.target !== list || !["PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown", " "].includes((e as KeyboardEvent).key))) return;
    this.follow = false;
  };

  private backToNow() {
    this.follow = true;
    const cur = this.segs[this.current];
    const i = cur ? this.shownIndex.get(cur.id) : undefined;
    if (i !== undefined) this.reveal(this.rowEl(cur!.id), i);
  }

  /* ---------- Parts ---------- */

  private head() {
    const low = this.segs.filter((s) => this.low(s) || this.lowTranslation(s)).length;
    const d = this.totalDuration;
    const subtitle = this.description || [d ? transcriptClock(d, false) : "", this.who.size ? `${this.who.size} ${this.who.size === 1 ? "speaker" : "speakers"}` : ""].filter(Boolean).join(" · ");
    return cardHead({
      icon: headIcon,
      title: this.heading,
      subtitle,
      id: `${this.uid}-title`,
      aside: low ? html`<span class="ui-tsr__pill">${icon(I.alert)}${low} low confidence</span>` : undefined,
    });
  }

  private wave() {
    const d = this.totalDuration;
    const n = this.bars;
    const p = this.peaks ?? [];
    const heights = Array.from({ length: n }, (_, i) => {
      if (!p.length) return 0.06;
      const a = Math.floor((i * p.length) / n);
      const b = Math.max(a + 1, Math.floor(((i + 1) * p.length) / n));
      let m = 0;
      for (let j = a; j < b && j < p.length; j++) m = Math.max(m, p[j] || 0);
      return clamp(m, 0.06, 1);
    });
    const bars = heights.map((h) => html`<span class="ui-tsr__bar" style=${styleMap({ height: `${Math.round(h * 100)}%` })}></span>`);
    const place = (a: number, b: number) => ({ left: `${(a / d) * 100}%`, width: `${Math.max(0.4, ((b - a) / d) * 100)}%` });
    // Low-confidence stretches, in WAVE_BUCKETS slices of the recording: each slice says how much of it is uncertain
    // (three levels), and equal neighbours merge – 5,000 segments draw a handful of bands, not one each
    const lowBands: [number, number, number][] = [];
    if (d) {
      const share = new Float64Array(WAVE_BUCKETS);
      const size = d / WAVE_BUCKETS;
      for (const s of this.segs) {
        if (!this.low(s) && !this.lowTranslation(s) && !this.lowWords(s).length) continue;
        for (let b = Math.max(0, Math.floor(s.start / size)); b < WAVE_BUCKETS && b * size < s.end; b++) share[b] += Math.min(s.end, (b + 1) * size) - Math.max(s.start, b * size);
      }
      for (let b = 0; b < WAVE_BUCKETS; b++) {
        const f = share[b] / size;
        const level = f <= 0.02 ? 0 : f < 0.34 ? 1 : f < 0.67 ? 2 : 3;
        const last = lowBands[lowBands.length - 1];
        if (!level) continue;
        if (last && last[2] === level && Math.abs(last[1] - b * size) < 1e-9) last[1] = (b + 1) * size;
        else lowBands.push([b * size, (b + 1) * size, level]);
      }
    }
    const ticks = d ? [...new Set(this.hitIds.map((id) => Math.round((this.segs[this.segIndex.get(id)!].start / d) * WAVE_BUCKETS)))] : [];
    const cur = this.segs[this.current];
    const valueText = `${transcriptClock(this.time, false)} of ${transcriptClock(d, false)}${cur ? `, ${this.nameOf(cur.speaker)}` : ""}`;
    return html`<div
      class="ui-tsr__wave"
      role="slider"
      tabindex="0"
      aria-label="Seek"
      aria-valuemin="0"
      aria-valuemax=${Math.floor(d)}
      aria-valuenow=${Math.floor(clamp(this.time, 0, d))}
      aria-valuetext=${valueText}
      @pointerdown=${this.onWaveDown}
      @pointermove=${this.onWaveMove}
      @pointerup=${this.onWaveUp}
      @pointercancel=${this.onWaveUp}
    >
      ${d && cur ? html`<span class="ui-tsr__now" style=${styleMap(place(cur.start, cur.end))}></span>` : nothing}
      <span class="ui-tsr__bars">${bars}</span>
      <span class="ui-tsr__bars ui-tsr__bars--played">${bars}</span>
      ${lowBands.map(([a, b, level]) => html`<span class="ui-tsr__lowband" data-level=${level} style=${styleMap(place(a, b))}></span>`)}
      ${ticks.map((x) => html`<span class="ui-tsr__tick" style=${styleMap({ left: `${(x / WAVE_BUCKETS) * 100}%` })}></span>`)}
      <span class="ui-tsr__head"></span>
    </div>`;
  }

  private controls() {
    const d = this.totalDuration;
    const noMedia = !this.media && !this.src;
    return html`<div class="ui-tsr__controls">
      <button type="button" class="ui-tsr__ib" aria-label=${`Back ${this.skip} seconds`} aria-keyshortcuts="J" @click=${() => this.jump(-this.skip)}>${icon(I.back)}</button>
      <button type="button" class="ui-tsr__play" aria-label=${this.playing ? "Pause" : "Play"} aria-keyshortcuts="K" aria-disabled=${noMedia ? "true" : "false"} @click=${() => this.togglePlay()}>${icon(this.playing ? I.pause : I.play)}</button>
      <button type="button" class="ui-tsr__ib" aria-label=${`Forward ${this.skip} seconds`} aria-keyshortcuts="L" @click=${() => this.jump(this.skip)}>${icon(I.forward)}</button>
      <span class="ui-tsr__clock"><span class="ui-tsr__clock-now">${transcriptClock(this.time, false)}</span><span class="ui-tsr__clock-of"> / ${transcriptClock(d, false)}</span></span>
      <button type="button" class="ui-tsr__rate" aria-label=${`Playback speed ${this.rate}×`} @click=${() => this.cycleRate()}>${this.rate}×</button>
    </div>`;
  }

  private screen() {
    const video = this.media ? this.media instanceof HTMLVideoElement : this.kind === "video" && !!this.src;
    const cur = this.segs[this.current];
    const caption = cur ? (this.mode() === "translation" ? (cur.translation ?? cur.text) : cur.text) : "";
    const own = !this.media && this.src;
    return html`${video
        ? html`<div class="ui-tsr__screen">
            ${own ? html`<video class="ui-tsr__media" src=${this.src} preload="metadata" playsinline></video>` : nothing}
            ${caption ? html`<span class="ui-tsr__caption" aria-hidden="true">${caption}</span>` : nothing}
          </div>`
        : own
          ? html`<audio class="ui-tsr__media" src=${this.src} preload="metadata"></audio>`
          : nothing}
      ${this.mediaError
        ? html`<p class="ui-tsr__error" role="alert">The recording couldn't load.<button type="button" class="ui-tsr__textbtn" @click=${() => this.retry()}>${icon(I.retry)}Try again</button></p>`
        : nothing}`;
  }

  private tools() {
    const q = this.query;
    const n = this.hitIds.length;
    const translations = this.hasTranslations();
    const labels: Record<TranscriptTranslationMode, string> = { original: this.originalLabel, translation: this.translationLabel, both: "Side by side" };
    return html`<div class="ui-tsr__tools">
      <div class="ui-tsr__search">
        ${icon(I.search)}
        <input
          class="ui-tsr__input"
          type="search"
          aria-label="Search the transcript"
          placeholder="Search"
          aria-describedby=${`${this.uid}-count`}
          .value=${live(q)}
          @input=${(e: Event) => this.setQuery((e.target as HTMLInputElement).value)}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === "Enter") {
              e.preventDefault();
              this.nextMatch(e.shiftKey ? -1 : 1);
            } else if (e.key === "Escape" && this.query) {
              e.preventDefault();
              this.setQuery("");
            }
          }}
        />
        <span class="ui-tsr__count" id=${`${this.uid}-count`}>${q.trim() ? (n ? `${this.matchAt >= 0 ? `${this.matchAt + 1} of ` : ""}${n} ${n === 1 ? "match" : "matches"}` : "No matches") : ""}</span>
        ${q.trim()
          ? html`<button type="button" class="ui-tsr__ib ui-tsr__ib--sm" aria-label="Previous match" ?disabled=${!n} @click=${() => this.nextMatch(-1)}>${icon(I.up)}</button>
              <button type="button" class="ui-tsr__ib ui-tsr__ib--sm" aria-label="Next match" ?disabled=${!n} @click=${() => this.nextMatch(1)}>${icon(I.down)}</button>`
          : nothing}
      </div>
      ${translations
        ? html`<div class="ui-tsr__modes" role="group" aria-label="Show">${MODES.map(
            (m) => html`<button type="button" class="ui-tsr__mode" aria-pressed=${this.translationMode === m ? "true" : "false"} @click=${() => this.setMode(m)}>${labels[m]}</button>`,
          )}</div>`
        : nothing}
    </div>`;
  }

  private speakerChips() {
    if (this.who.size < 2) return nothing;
    const hidden = new Set(this.hiddenSpeakers);
    const count = new Map<string, number>();
    for (const s of this.segs) count.set(s.speaker, (count.get(s.speaker) ?? 0) + 1);
    return html`<div class="ui-tsr__speakers" role="group" aria-label="Speakers">
      ${[...this.who.values()].map(
        (w) => html`<button type="button" class="ui-tsr__spk" data-tone=${w.tone} aria-pressed=${hidden.has(w.id) ? "false" : "true"} @click=${() => this.toggleSpeaker(w.id)}>
          <span class="ui-tsr__chip" data-tone=${w.tone} aria-hidden="true">${w.short}</span>${w.name}<span class="ui-tsr__spk-n"><span class="ui-tsr__sr">, </span>${count.get(w.id) ?? 0}<span class="ui-tsr__sr"> segments</span></span>
        </button>`,
      )}
    </div>`;
  }

  private text(s: TranscriptSegment, which: "original" | "translation", twoCols: boolean) {
    const translation = which === "translation";
    const body = translation ? (s.translation ?? "") : s.text;
    const marks: Mark[] = [...hits(body, this.query), ...(translation ? [] : this.lowWords(s))];
    const low = translation ? this.lowTranslation(s) : this.low(s);
    return html`<p class="ui-tsr__text" ?data-low=${low} data-which=${which}>${twoCols ? html`<span class="ui-tsr__sr">${translation ? this.translationLabel : this.originalLabel}: </span>` : nothing}${body
        ? marked(body, marks)
        : html`<span class="ui-tsr__none">No translation</span>`}</p>`;
  }

  private row(s: TranscriptSegment, i: number, top?: number) {
    const w = this.who.get(s.speaker)!;
    const selected = this.active === s.id;
    const playing = this.segs[this.current]?.id === s.id;
    const mode = this.mode();
    const both = mode === "both";
    const low = this.low(s);
    const lowT = mode !== "original" && this.lowTranslation(s);
    const lowWords = mode !== "translation" ? this.lowWords(s).length : 0;
    const sent = this.sent.includes(s.id);
    const flags = [
      low ? `low confidence ${pct(s.confidence!)}` : "",
      lowT ? `translation confidence ${pct(s.translationConfidence!)}` : "",
      lowWords ? `${lowWords} uncertain ${lowWords === 1 ? "word" : "words"}` : "",
      sent ? "sent to verification" : "",
    ].filter(Boolean);
    return html`<div
      role="option"
      id=${`${this.uid}-${i}`}
      class="ui-tsr__row"
      data-id=${s.id}
      ?data-playing=${playing}
      ?data-low=${low || lowT}
      ?data-both=${both}
      ?data-float=${top !== undefined}
      aria-selected=${selected ? "true" : "false"}
      aria-posinset=${i + 1}
      aria-setsize=${this.shown.length}
      tabindex=${selected ? 0 : -1}
      style=${styleMap({ top: top === undefined ? undefined : `${top}px` })}
      @click=${() => this.goTo(s, { focus: true })}
    >
      <span class="ui-tsr__meta">
        <span class="ui-tsr__time">${transcriptClock(s.start)}</span>
        ${low || lowT || sent
          ? html`<span class="ui-tsr__flags" aria-hidden="true">
              ${low || lowT ? html`<span class="ui-tsr__flag" title=${low ? "Recognition confidence" : "Translation confidence"}>${icon(I.alert)}${pct(low ? s.confidence! : s.translationConfidence!)}</span>` : nothing}
              ${sent ? html`<span class="ui-tsr__sent" title="Sent to verification">${icon(I.verify)}</span>` : nothing}
            </span>`
          : nothing}
      </span>
      <span class="ui-tsr__chip" data-tone=${w.tone} aria-hidden="true">${w.short}</span>
      <span class="ui-tsr__sr">${w.name}: </span>
      <span class="ui-tsr__texts">${mode === "translation" ? this.text(s, "translation", false) : this.text(s, "original", both)}${both ? this.text(s, "translation", true) : nothing}</span>
      ${flags.length ? html`<span class="ui-tsr__sr">, ${flags.join(", ")}</span>` : nothing}
    </div>`;
  }

  private rows() {
    const win = this.win;
    const shown = this.shown;
    if (!win.virtual) return repeat(shown, (s) => s.id, (s, i) => this.row(s, i));
    // Two spacers that stay in place, the window between them; the selected row stays rendered (out of the flow,
    // where it would be) while it's outside the window, so it keeps focus
    const a = this.active ? (this.shownIndex.get(this.active) ?? -1) : -1;
    const kept = a >= 0 && (a < win.start || a >= win.end) ? [a] : [];
    const h = win.rowHeight;
    const idx = [...kept, ...Array.from({ length: win.end - win.start }, (_, k) => win.start + k)].sort((x, y) => x - y);
    return html`<div class="ui-tsr__spacer" aria-hidden="true" style=${styleMap({ height: `${win.start * h}px` })}></div>
      ${repeat(idx, (n) => shown[n].id, (n) => this.row(shown[n], n, n < win.start || n >= win.end ? n * h : undefined))}
      <div class="ui-tsr__spacer" aria-hidden="true" style=${styleMap({ height: `${(shown.length - win.end) * h}px` })}></div>`;
  }

  private list() {
    const shown = this.shown;
    const empty = !this.segs.length ? "No transcript yet." : "Every speaker is hidden – turn one on above.";
    return html`<div class="ui-tsr__listwrap">
      <div
        class="ui-tsr__list"
        @wheel=${this.unfollow}
        @touchmove=${this.unfollow}
        @pointerdown=${this.unfollow}
        @keydown=${this.unfollow}
      >
        ${shown.length
          ? html`<div
              class="ui-tsr__rows"
              role="listbox"
              aria-label="Segments"
              ?data-virtual=${this.win.virtual}
            >${this.rows()}</div>`
          : html`<p class="ui-tsr__empty">${empty}</p>`}
      </div>
      ${!this.follow && this.segs[this.current]
        ? html`<button type="button" class="ui-tsr__now-btn" @click=${() => this.backToNow()}>${icon(I.follow)}Back to now</button>`
        : nothing}
    </div>`;
  }

  private foot() {
    if (!this.segs.length) return nothing;
    const s = this.active ? this.segs[this.segIndex.get(this.active) ?? -1] : undefined;
    if (!s) return nothing;
    const w = this.who.get(s.speaker)!;
    const sent = this.sent.includes(s.id);
    const copied = this.copied === s.id;
    const conf = [s.confidence !== undefined ? `Recognition ${pct(s.confidence)}` : "", s.translationConfidence !== undefined && this.mode() !== "original" ? `translation ${pct(s.translationConfidence)}` : ""].filter(Boolean).join(" · ");
    return html`<div class="ui-tsr__foot">
      <span class="ui-tsr__seg">
        <span class="ui-tsr__chip" data-tone=${w.tone} aria-hidden="true">${w.short}</span>
        <span class="ui-tsr__seg-text"><span class="ui-tsr__seg-when">${transcriptClock(s.start)}–${transcriptClock(s.end)}</span> ${w.name}${conf ? html`<span class="ui-tsr__seg-conf" ?data-low=${this.low(s) || (this.mode() !== "original" && this.lowTranslation(s))}> · ${conf}</span>` : nothing}</span>
      </span>
      <span class="ui-tsr__acts">
        <button type="button" class="ui-tsr__act" aria-keyshortcuts="C" aria-label=${copied ? "Copied" : `Copy the segment at ${transcriptClock(s.start)}`} @click=${() => this.copySegment(s)}>${icon(copied ? I.check : I.copy)}<span class="ui-tsr__act-label">${copied ? "Copied" : "Copy"}</span></button>
        ${this.verifiable
          ? html`<button
              type="button"
              class="ui-tsr__act ui-tsr__act--verify"
              aria-keyshortcuts="V"
              aria-disabled=${sent ? "true" : "false"}
              ?data-sent=${sent}
              @click=${() => this.verify(s)}
            >${icon(sent ? I.check : I.verify)}<span class="ui-tsr__act-label">${sent ? "Sent to verification" : this.verifyLabel}</span></button>`
          : nothing}
      </span>
    </div>`;
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    return html`
      ${this.head()}
      <div class=${clean ? "ui-tsr__body" : "ui-tsr__card"}>
        <div class="ui-tsr__player" role="group" aria-label="Player">${this.screen()}${this.wave()}${this.controls()}</div>
        ${this.tools()} ${this.speakerChips()} ${this.list()}
      </div>
      ${this.foot()}
      <span class="ui-tsr__sr" role="status">${this.said}</span>
    `;
  }

  static override css = /* css */ `
[data-ui="tsr"] {
  box-sizing: border-box;
  width: 100%;
  max-width: 720px;
  min-width: 0;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="tsr"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tsr"] { overflow: hidden; border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-weight: var(--tc-font-weight-regular); }
[data-ui="tsr"] *, [data-ui="tsr"] *::before, [data-ui="tsr"] *::after { box-sizing: border-box; }
:where([data-ui="tsr"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="tsr"] :is(button, a, [role="option"], [role="slider"]):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-tsr__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-tsr__icon { display: block; flex: none; width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tsr"] .ui-tsr__icon { stroke-width: 1.4; }
/* Speaker colours */
[data-ui="tsr"] [data-tone="blue"] { --tc-transcript-review-fg: var(--tc-accent-text); --tc-transcript-review-bg: var(--tc-accent-subtle); }
[data-ui="tsr"] [data-tone="violet"] { --tc-transcript-review-fg: var(--tc-tone-violet-fg); --tc-transcript-review-bg: var(--tc-tone-violet-bg); }
[data-ui="tsr"] [data-tone="teal"] { --tc-transcript-review-fg: var(--tc-tone-teal-fg); --tc-transcript-review-bg: var(--tc-tone-teal-bg); }
[data-ui="tsr"] [data-tone="pink"] { --tc-transcript-review-fg: var(--tc-tone-pink-fg); --tc-transcript-review-bg: var(--tc-tone-pink-bg); }
[data-ui="tsr"] [data-tone="rose"] { --tc-transcript-review-fg: var(--tc-tone-rose-fg); --tc-transcript-review-bg: var(--tc-tone-rose-bg); }
[data-ui="tsr"] [data-tone="amber"] { --tc-transcript-review-fg: var(--tc-tone-amber-fg); --tc-transcript-review-bg: var(--tc-tone-amber-bg); }
.ui-tsr__chip { display: inline-grid; flex: none; place-items: center; min-width: 24px; height: var(--tc-pill-h); padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-sm); background: var(--tc-transcript-review-bg); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-none); color: var(--tc-transcript-review-fg); font-variant-numeric: tabular-nums; white-space: nowrap; }

/* ----- The header's aside ----- */
.ui-tsr__pill { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-warning-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); color: var(--tc-status-warning-fg); white-space: nowrap; }
.ui-tsr__pill .ui-tsr__icon { width: 12px; height: 12px; }

/* ----- The card ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-tsr__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-tsr__body { border-top: var(--tc-hairline) solid var(--tc-divider); }

/* ----- The player: the picture, the waveform and the controls ----- */
.ui-tsr__player { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-2); }
.ui-tsr__screen { position: relative; overflow: hidden; aspect-ratio: 16 / 9; border-radius: var(--tc-radius-md); background: var(--tc-surface-inverse); }
.ui-tsr__screen > video { display: block; width: 100%; height: 100%; object-fit: contain; }
.ui-tsr__caption { position: absolute; left: 50%; bottom: var(--tc-space-3); max-width: calc(100% - var(--tc-space-6)); padding: var(--tc-space-1) var(--tc-space-2); border-radius: var(--tc-radius-sm); background: var(--tc-scrim); font-size: var(--tc-font-size-md); color: var(--tc-text-on-inverse); text-align: center; transform: translateX(-50%); }
.ui-tsr__wave { --at: 0; position: relative; height: 64px; touch-action: none; cursor: pointer; border-radius: var(--tc-radius-sm); user-select: none; -webkit-user-select: none; }
.ui-tsr__bars { position: absolute; inset: var(--tc-space-1) 0 var(--tc-space-1-5); overflow: hidden; display: flex; align-items: center; gap: var(--tc-space-0-5); pointer-events: none; }
.ui-tsr__bar { flex: 1 1 0; min-width: 1px; min-height: 2px; border-radius: var(--tc-radius-full); background: var(--tc-fill-strong); }
.ui-tsr__bars--played { clip-path: inset(0 calc((1 - var(--at)) * 100%) 0 0); }
.ui-tsr__bars--played .ui-tsr__bar { background: var(--tc-accent); }
:where([data-look="clean"], [data-look="clean"] *).ui-tsr__bars--played .ui-tsr__bar { background: var(--tc-text-primary); }
.ui-tsr__now { position: absolute; top: 0; bottom: 0; border-radius: var(--tc-radius-xs); background: var(--tc-fill-subtle); pointer-events: none; }
.ui-tsr__lowband { position: absolute; bottom: 0; height: 3px; border-radius: var(--tc-radius-full); background: var(--tc-status-warning-solid); pointer-events: none; }
/* How much of the stretch is uncertain, when segments are denser than the waveform can show one by one */
.ui-tsr__lowband[data-level="1"] { opacity: 0.4; }
.ui-tsr__lowband[data-level="2"] { opacity: 0.7; }
.ui-tsr__tick { position: absolute; top: 0; width: 2px; height: 8px; translate: -50% 0; border-radius: var(--tc-radius-full); background: var(--tc-text-primary); pointer-events: none; }
.ui-tsr__head { position: absolute; top: 0; bottom: 0; left: calc(var(--at) * 100%); width: 2px; translate: -50% 0; border-radius: var(--tc-radius-full); background: var(--tc-text-primary); pointer-events: none; }
.ui-tsr__controls { display: flex; align-items: center; gap: var(--tc-space-1); min-width: 0; }
.ui-tsr__ib { display: inline-grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tsr__ib:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-tsr__ib:disabled { color: var(--tc-text-disabled); cursor: default; }
.ui-tsr__ib--sm { width: 24px; height: 24px; }
.ui-tsr__play { display: inline-grid; flex: none; place-items: center; width: var(--tc-control-h-md); height: var(--tc-control-h-md); border-radius: var(--tc-radius-full); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow, none); color: var(--tc-action-primary-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tsr__play:hover { background: var(--tc-action-primary-bg-hover, var(--tc-action-primary-bg)); }
.ui-tsr__play[aria-disabled="true"] { background: var(--tc-fill-default); box-shadow: none; color: var(--tc-text-muted); cursor: not-allowed; }
.ui-tsr__play .ui-tsr__icon { width: 14px; height: 14px; stroke: none; }
.ui-tsr__clock { margin-left: var(--tc-space-1-5); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-tsr__clock-of { color: var(--tc-text-muted); }
.ui-tsr__rate { flex: none; height: var(--tc-control-h-sm); margin-left: auto; padding: 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-sm); font-weight: var(--tc-control-font-weight); color: var(--tc-action-ghost-fg); font-variant-numeric: tabular-nums; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tsr__rate:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-tsr__error { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); margin: 0; font-size: var(--tc-font-size-sm); color: var(--tc-status-danger-fg); }
.ui-tsr__textbtn { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); text-decoration: underline; text-underline-offset: 2px; }
.ui-tsr__textbtn .ui-tsr__icon { width: 14px; height: 14px; }

/* ----- Tools: search and the translation switch; the speaker chips ----- */
.ui-tsr__tools { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-tsr__search { display: flex; flex: 1 1 200px; align-items: center; gap: var(--tc-space-1-5); min-width: 0; height: var(--tc-field-h-sm); padding: 0 var(--tc-space-0-5) 0 var(--tc-space-2-5); border-radius: var(--tc-control-radius-sm); background: var(--tc-field-bg-sunken); box-shadow: var(--tc-field-shadow); color: var(--tc-icon-muted); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tsr__search:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-tsr__search:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-tsr__search .ui-tsr__icon { width: 14px; height: 14px; }
.ui-tsr__input { flex: 1; min-width: 0; height: 100%; margin: 0; padding: 0; border: 0; background: none; font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); caret-color: var(--tc-accent); outline: none; }
.ui-tsr__input::placeholder { color: var(--tc-text-placeholder); opacity: 1; }
.ui-tsr__input::-webkit-search-cancel-button { display: none; }
.ui-tsr__count { flex: none; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-tsr__count:empty { display: none; }
.ui-tsr__modes { display: inline-flex; flex: none; gap: var(--tc-space-0-5); padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-tsr__mode { height: calc(var(--tc-control-h-sm) - var(--tc-seg-pad) * 2); padding: 0 var(--tc-space-2-5); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-sm); font-weight: var(--tc-control-font-weight); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tsr__mode:hover { color: var(--tc-text-primary); }
.ui-tsr__mode[aria-pressed="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
.ui-tsr__speakers { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); padding: 0 var(--tc-space-3) var(--tc-space-2); }
.ui-tsr__spk { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2) 0 var(--tc-space-1); border-radius: var(--tc-control-radius-sm); box-shadow: var(--tc-action-secondary-shadow); background: var(--tc-action-secondary-bg); font-size: var(--tc-font-size-sm); font-weight: var(--tc-control-font-weight); color: var(--tc-text-primary); white-space: nowrap; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tsr__spk:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-tsr__spk[aria-pressed="false"] { box-shadow: inset 0 0 0 1px var(--tc-border-default); background: none; color: var(--tc-text-muted); }
.ui-tsr__spk[aria-pressed="false"] .ui-tsr__chip { background: var(--tc-fill-default); color: var(--tc-text-muted); text-decoration: line-through; }
.ui-tsr__spk-n { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }

/* ----- The list: a scrolling listbox, windowed between two spacers that stay in place ----- */
.ui-tsr__listwrap { position: relative; border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-tsr__list { position: relative; max-height: var(--tc-transcript-review-max, 360px); overflow-y: auto; overflow-anchor: none; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--tc-fill-strong) transparent; }
.ui-tsr__rows { position: relative; display: grid; padding: var(--tc-space-1) 0; }
.ui-tsr__spacer { flex: none; }
.ui-tsr__row { position: relative; display: grid; grid-template-columns: 60px 28px minmax(0, 1fr); align-items: start; column-gap: var(--tc-space-2); margin: 0 var(--tc-space-1-5); padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-2-5); border-radius: var(--tc-radius-md); cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tsr__row[data-float] { position: absolute; left: 0; right: 0; }
.ui-tsr__row:hover { background: var(--tc-fill-subtle); }
.ui-tsr__row[aria-selected="true"] { background: var(--tc-fill-default); }
.ui-tsr__row[data-playing]::before { content: ""; position: absolute; top: var(--tc-space-2); bottom: var(--tc-space-2); left: 0; width: 2px; border-radius: var(--tc-radius-full); background: var(--tc-accent); }
:where([data-look="clean"], [data-look="clean"] *).ui-tsr__row[data-playing]::before { background: var(--tc-text-primary); }
.ui-tsr__meta { display: grid; justify-items: start; gap: var(--tc-space-1); min-width: 0; }
.ui-tsr__time { padding-top: var(--tc-space-0-5); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-tsr__row[data-playing] .ui-tsr__time { color: var(--tc-text-primary); }
.ui-tsr__row > .ui-tsr__chip { justify-self: start; }
.ui-tsr__texts { display: grid; gap: var(--tc-space-1); min-width: 0; }
.ui-tsr__row[data-both] .ui-tsr__texts { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: var(--tc-space-4); }
.ui-tsr__text { margin: 0; color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-tsr__text[data-which="translation"] { color: var(--tc-text-secondary); }
.ui-tsr__row[data-both] .ui-tsr__text[data-which="translation"] { padding-left: var(--tc-space-3); border-left: var(--tc-hairline) solid var(--tc-divider); }
.ui-tsr__lw { border-bottom: 2px dotted var(--tc-status-warning-solid); }
.ui-tsr__hit { border-radius: var(--tc-radius-2xs); background: var(--tc-accent-highlight); color: inherit; box-shadow: 0 0 0 1px var(--tc-accent-highlight); }
.ui-tsr__none { color: var(--tc-text-muted); font-style: italic; }
.ui-tsr__flags { display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-tsr__flag { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); height: var(--tc-pill-h); padding: 0 var(--tc-space-1-5) 0 var(--tc-space-1); border-radius: var(--tc-pill-radius); background: linear-gradient(var(--tc-status-warning-bg), var(--tc-status-warning-bg)), var(--tc-surface-raised); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-status-warning-fg); font-variant-numeric: tabular-nums; }
.ui-tsr__flag .ui-tsr__icon { width: 12px; height: 12px; }
.ui-tsr__sent { display: inline-grid; place-items: center; width: var(--tc-pill-h); height: var(--tc-pill-h); border-radius: var(--tc-pill-radius); background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-tsr__sent .ui-tsr__icon { width: 12px; height: 12px; }
/* Windowed rows are one height (the window places rows it hasn't rendered), so their text stops at two lines */
.ui-tsr__rows[data-virtual] .ui-tsr__row { height: ${ROW_H}px; overflow: hidden; }
.ui-tsr__rows[data-virtual] .ui-tsr__text { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.ui-tsr__empty { margin: 0; padding: var(--tc-space-6) var(--tc-space-4); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); text-align: center; }
.ui-tsr__now-btn { position: absolute; left: 50%; bottom: var(--tc-space-2); display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-radius-full); background: var(--tc-action-primary-bg); box-shadow: var(--tc-shadow-overlay); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-primary-fg); white-space: nowrap; transform: translateX(-50%); }
.ui-tsr__now-btn:hover { background: var(--tc-action-primary-bg-hover, var(--tc-action-primary-bg)); }
.ui-tsr__now-btn .ui-tsr__icon { width: 14px; height: 14px; }

/* ----- The segment you're on, and its actions ----- */
.ui-tsr__foot { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-tsr__foot { min-height: 44px; padding: var(--tc-space-1-5) var(--tc-space-1) 0 var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-tsr__foot { min-height: 52px; padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-tsr__seg { display: flex; flex: 1 1 200px; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-tsr__seg-text { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); white-space: nowrap; text-overflow: ellipsis; }
.ui-tsr__seg-when { font-family: var(--tc-font-mono); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-tsr__seg-conf[data-low] { color: var(--tc-status-warning-fg); }
.ui-tsr__acts { display: flex; flex: none; align-items: center; gap: var(--tc-space-1-5); margin-left: auto; }
.ui-tsr__act { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-tsr__act { height: var(--tc-control-h-md); border-radius: var(--tc-control-radius-md); }
.ui-tsr__act:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-tsr__act--verify { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow, none); color: var(--tc-action-primary-fg); }
.ui-tsr__act--verify:hover { background: var(--tc-action-primary-bg-hover, var(--tc-action-primary-bg)); box-shadow: var(--tc-action-primary-shadow, none); }
.ui-tsr__act--verify[data-sent] { background: var(--tc-status-info-bg); box-shadow: none; color: var(--tc-status-info-fg); cursor: default; }

@container (max-width: 480px) {
  .ui-tsr__row { grid-template-columns: 28px minmax(0, 1fr); row-gap: var(--tc-space-1); }
  .ui-tsr__meta { grid-column: 1 / -1; display: flex; align-items: center; gap: var(--tc-space-2); }
  .ui-tsr__time { padding-top: 0; }
  .ui-tsr__row[data-both] .ui-tsr__texts { grid-template-columns: minmax(0, 1fr); row-gap: var(--tc-space-1); }
  .ui-tsr__row[data-both] .ui-tsr__text[data-which="translation"] { padding: var(--tc-space-1) 0 0; border-left: 0; border-top: var(--tc-hairline) solid var(--tc-divider); }
  .ui-tsr__rows[data-virtual] .ui-tsr__row { height: 76px; }
  .ui-tsr__rows[data-virtual] .ui-tsr__text { -webkit-line-clamp: 2; }
  .ui-tsr__rows[data-virtual] .ui-tsr__row[data-both] .ui-tsr__text { -webkit-line-clamp: 1; }
  .ui-tsr__modes { flex: 1 1 100%; }
  .ui-tsr__mode { flex: 1; text-align: center; }
  .ui-tsr__act-label { display: none; }
  .ui-tsr__act--verify .ui-tsr__act-label { display: inline; }
  .ui-tsr__clock-of { display: none; }
}
@media (pointer: coarse) {
  .ui-tsr__ib, .ui-tsr__rate, .ui-tsr__act, .ui-tsr__spk { height: 36px; }
  .ui-tsr__ib { width: 36px; }
  .ui-tsr__play { width: 40px; height: 40px; }
}
@media (forced-colors: active) {
  .ui-tsr__bar { background: CanvasText; }
  .ui-tsr__bars--played .ui-tsr__bar { background: Highlight; }
  .ui-tsr__head, .ui-tsr__tick { background: Highlight; }
  .ui-tsr__lowband { background: Mark; }
  .ui-tsr__row[aria-selected="true"] { outline: 1px solid Highlight; }
  .ui-tsr__hit { background: Mark; color: MarkText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="tsr"] *, [data-ui="tsr"] *::before, [data-ui="tsr"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-transcript-review")) customElements.define("tc-transcript-review", TcTranscriptReview);

declare global {
  interface HTMLElementTagNameMap {
    "tc-transcript-review": TcTranscriptReview;
  }
}
