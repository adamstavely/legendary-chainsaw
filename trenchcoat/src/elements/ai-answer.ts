import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, OnScreenController, rescueFocus } from "./internal/controllers";
import type { Look } from "./internal/look";

/*
 * <tc-ai-answer> – the Lit port of src/components/ai-answer.tsx: an assistant's answer with its sources. The sources
 * pop in first, then the answer streams in word by word with citation chips. Hovering a chip previews its source and
 * lights up the matching card above (and the other way round). When it's done: copy, regenerate, thumbs up / down
 * with a reason, and follow-up questions. The answer is plain text: blank lines make paragraphs, "- " makes a list,
 * **bold**, [1] or [1,3] cite sources. Clean has no tray – one white card that also holds the last row.
 *
 *   <tc-ai-answer question="Can I work from abroad?" .sources=${sources} answer="Yes [1]."></tc-ai-answer>
 *
 * The typing is written straight to the DOM (data-on on each word): the element re-renders only when a new paragraph
 * or list item begins.
 */

// The header icon: a speech bubble with a sparkle – an assistant's answer
const answerIcon = svg`<path d="M20 12.5a7.5 7.5 0 0 1-11.1 6.6L4 20l.9-4.4A7.5 7.5 0 1 1 20 12.5Z"></path><path d="M12.5 8.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7Z"></path>`;

export type AnswerSource = {
  /** Headline of the page, message or document */
  title: string;
  /** Short name shown on the citation chip, e.g. "Notion" */
  name: string;
  /** Opens in a new tab */
  href?: string;
  /** A favicon or logo element, ideally square (cloned) */
  icon?: Element;
  /** The passage the answer relies on – shown in the preview */
  snippet?: string;
};

/** The reader's verdict: a thumb, and for a thumbs down the reason picked */
export type AnswerFeedback = { value: "up" | "down"; reason?: string };

type Token = { i: number; kind: "word"; text: string; bold?: boolean } | { i: number; kind: "cite"; ids: number[] };
type Block = { kind: "p"; tokens: Token[] } | { kind: "ul"; items: Token[][] };
type Phase = "reading" | "writing" | "done" | "stopped";
type Pop = { ids: number[]; left: number; top: number; width: number };

/* ---------- Parsing: paragraphs, lists, **bold** and [1] citations ---------- */

function parse(text: string, sourceCount: number) {
  let i = 0;
  const line = (s: string) => {
    const tokens: Token[] = [];
    for (const part of s.split(/(\*\*[^*]+\*\*|\[\d+(?:\s*,\s*\d+)*\])/)) {
      if (!part) continue;
      const cite = part.match(/^\[([\d,\s]+)\]$/);
      if (cite) {
        const ids = cite[1]
          .split(",")
          .map((n) => Number(n) - 1)
          .filter((n) => n >= 0 && n < sourceCount);
        if (!ids.length) continue;
        const last = tokens[tokens.length - 1];
        // [1][3] right after each other become one chip
        if (last?.kind === "cite") last.ids = [...new Set([...last.ids, ...ids])];
        else tokens.push({ i: i++, kind: "cite", ids });
        continue;
      }
      const bold = part.startsWith("**");
      for (const word of (bold ? part.slice(2, -2) : part).match(/\S+\s*|\s+/g) ?? []) {
        // Spaces before a word stick to the word in front, so only words count as steps
        const last = tokens[tokens.length - 1];
        if (!word.trim()) {
          if (last?.kind === "word") last.text += word;
          continue;
        }
        tokens.push({ i: i++, kind: "word", text: word, bold });
      }
    }
    return tokens;
  };
  const blocks: Block[] = [];
  for (const chunk of text.split(/\n\s*\n/)) {
    const lines = chunk.split("\n").filter((l) => l.trim());
    if (!lines.length) continue;
    if (lines.every((l) => /^\s*[-*]\s/.test(l))) blocks.push({ kind: "ul", items: lines.map((l) => line(l.replace(/^\s*[-*]\s/, ""))) });
    else blocks.push({ kind: "p", tokens: line(lines.join(" ")) });
  }
  return { blocks, total: i };
}

const messageOf = (e: unknown) => (e instanceof Error && e.message ? e.message : typeof e === "string" && e ? e : "something went wrong");

/** The answer as plain text with a numbered source list, for the clipboard */
function plain(text: string, sources: AnswerSource[]) {
  const body = text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\s*\[(\d+(?:\s*,\s*\d+)*)\]/g, (_, ids: string) => ` [${ids.replace(/\s/g, "")}]`)
    .trim();
  if (!sources.length) return body;
  return `${body}\n\nSources:\n${sources.map((s, i) => `[${i + 1}] ${s.title}${s.href ? ` – ${s.href}` : ""}`).join("\n")}`;
}

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* ---------- Icons ---------- */

/** Standard: 24px outlined icons. Clean: 16px, thin 1px lines and solid shapes */
const glyph = (d: string, look: Look, solid = false, extra?: string) =>
  html`<svg viewBox=${look === "clean" ? "0 0 16 16" : "0 0 24 24"} class=${extra ? `ui-ans__glyph ${extra}` : "ui-ans__glyph"} ?data-solid=${look === "clean" && solid} aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;
const standardIcons = {
  copy: "M9 9.5A1.5 1.5 0 0 1 10.5 8h8A1.5 1.5 0 0 1 20 9.5v9a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 9 18.5zM15 8V5.5A1.5 1.5 0 0 0 13.5 4h-8A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H9",
  check: "M5 12.5l4.5 4.5L19 7.5",
  redo: "M20 12a8 8 0 1 1-2.34-5.66L20 8.5M20 4v4.5h-4.5",
  thumb: "M7 10v10M7 10l3.6-6.3a1.9 1.9 0 0 1 3.5 1.3L13.3 9H18a2 2 0 0 1 2 2.4l-1.4 7A2 2 0 0 1 16.6 20H5a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z",
  arrow: "M5 12h14M13 6l6 6-6 6",
};
const cleanIcons = {
  copy: "M5.5 2A1.5 1.5 0 0 0 4 3.5V4h5A3 3 0 0 1 12 7v5h.5a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 12.5 2h-7ZM3.5 5A1.5 1.5 0 0 0 2 6.5v6A1.5 1.5 0 0 0 3.5 14H9a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 9 5H3.5Z",
  check: "M1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Zm8.9-1.2a.5.5 0 0 0-.8-.6L7.44 9.23 6.35 8.15a.5.5 0 1 0-.7.7l1.5 1.5a.5.5 0 0 0 .76-.06l2.5-3.5Z",
  redo: "M13 8a5 5 0 1 1-1.46-3.54M13 2.5v2.5h-2.5",
  thumb: "M4.5 7v6.5H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1.5Zm1 6.5h5.95a1.5 1.5 0 0 0 1.47-1.2l.86-4.3A1.5 1.5 0 0 0 12.31 6.2H9.5l.42-2.08A1.4 1.4 0 0 0 7.3 3.1L5.5 6.8v6.7Z",
  /** The follow-up questions' trailing glyph (Standard uses its arrow) */
  arrow: "M10.85 7.65a.5.5 0 0 1 0 .7L7.2 12a.5.5 0 0 1-.7-.7L9.79 8 6.5 4.7a.5.5 0 1 1 .7-.7l3.65 3.65Z",
};

/** The cloud of the Frost Cloud illustration: puffs that melt into one shape through a soft "goo" filter */
const PUFFS = [
  { cx: 115, cy: 93, r: 43 },
  { cx: 163, cy: 111, r: 39 },
  { cx: 156, cy: 155, r: 31 },
  { cx: 107, cy: 155, r: 35 },
  { cx: 72, cy: 126, r: 34 },
];
const CORE = { x: 80, y: 100, width: 80, height: 65 };

/**
 * Standard's assistant: a small blue cloud with a soft white glow along the inside of its edge, a thin light blue
 * outline and two white eyes. The eyes scan the sources while reading, follow the text while writing, and look around
 * once done.
 */
function cloudMark(id: string) {
  const ref = (name: string) => `${id}-${name}`;
  const eye = (x: number, right = false) =>
    svg`<g class=${right ? "ui-ans__eye ui-ans__eye-r" : "ui-ans__eye"}><rect x=${x} y="106" width="18" height="31" rx="9" fill=${`url(#${ref("eye")})`}></rect><rect x=${x} y="108.5" width="18" height="31" rx="9" fill="none" class="ui-ans__mark-eye-shade" stroke-width="5" filter=${`url(#${ref("blur-s")})`} clip-path=${`url(#${ref(right ? "clip-r" : "clip-l")})`}></rect></g>`;
  return html`<svg viewBox="30 40 180 160" class="ui-ans__mark" aria-hidden="true">${svg`
    <defs>
      <filter id=${ref("goo")} x="0" y="0" width="240" height="240" filterUnits="userSpaceOnUse">
        <feGaussianBlur stdDeviation="3.5"></feGaussianBlur>
        <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -12"></feColorMatrix>
      </filter>
      <filter id=${ref("inner")} x="0" y="0" width="240" height="240" filterUnits="userSpaceOnUse">
        <feGaussianBlur in="SourceAlpha" stdDeviation="15" result="soft"></feGaussianBlur>
        <feComposite in="SourceAlpha" in2="soft" operator="out" result="rim"></feComposite>
        <feFlood style="flood-color: var(--tc-ai-answer-mark-glow)"></feFlood>
        <feComposite in2="rim" operator="in"></feComposite>
      </filter>
      <filter id=${ref("blur-s")} x="0" y="0" width="240" height="240" filterUnits="userSpaceOnUse">
        <feGaussianBlur stdDeviation="2"></feGaussianBlur>
      </filter>
      <filter id=${ref("outline")} x="0" y="0" width="240" height="240" filterUnits="userSpaceOnUse">
        <feMorphology operator="dilate" radius="6"></feMorphology>
        <feGaussianBlur stdDeviation="0.8"></feGaussianBlur>
      </filter>
      <g id=${ref("shape")} filter=${`url(#${ref("goo")})`}>
        ${PUFFS.map((p) => svg`<circle cx=${p.cx} cy=${p.cy} r=${p.r}></circle>`)}
        <rect x=${CORE.x} y=${CORE.y} width=${CORE.width} height=${CORE.height}></rect>
      </g>
      <mask id=${ref("mask")} maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="240">
        <use href=${`#${ref("shape")}`} fill="#fff"></use>
      </mask>
      <linearGradient id=${ref("body")} x1="0" y1="50" x2="0" y2="192" gradientUnits="userSpaceOnUse">
        <stop offset="0" style="stop-color: var(--tc-ai-answer-mark-top)"></stop>
        <stop offset="1" style="stop-color: var(--tc-ai-answer-mark-bottom)"></stop>
      </linearGradient>
      <linearGradient id=${ref("eye")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style="stop-color: var(--tc-ai-answer-mark-eye-top)"></stop>
        <stop offset="1" style="stop-color: var(--tc-ai-answer-mark-eye-bottom)"></stop>
      </linearGradient>
      <clipPath id=${ref("clip-l")}><rect x="96.5" y="106" width="18" height="31" rx="9"></rect></clipPath>
      <clipPath id=${ref("clip-r")}><rect x="127.5" y="106" width="18" height="31" rx="9"></rect></clipPath>
    </defs>
    <use href=${`#${ref("shape")}`} class="ui-ans__mark-edge" filter=${`url(#${ref("outline")})`}></use>
    <g mask=${`url(#${ref("mask")})`}>
      <rect x="0" y="0" width="240" height="240" fill=${`url(#${ref("body")})`}></rect>
      <use href=${`#${ref("shape")}`} filter=${`url(#${ref("inner")})`}></use>
    </g>
    <g class="ui-ans__eyes">${eye(96.5)}${eye(127.5, true)}</g>
  `}</svg>`;
}

/** Clean's assistant: a solid blue sparkle with a small one beside it */
const sparkleMark = html`<svg viewBox="0 0 16 16" class="ui-ans__mark" aria-hidden="true">${svg`<path class="ui-ans__mark-big" d="M6.5 2.2c.2 0 .36.14.4.33.53 2.6 1.4 3.48 4 4.02a.4.4 0 0 1 0 .79c-2.6.53-3.47 1.4-4 4a.4.4 0 0 1-.8 0c-.53-2.6-1.4-3.47-4-4a.4.4 0 0 1 0-.79c2.6-.54 3.47-1.42 4-4.02a.4.4 0 0 1 .4-.33Z"></path><path class="ui-ans__mark-small" d="M12 9.6c.12 0 .22.08.25.2.28 1.3.72 1.75 2.03 2.03a.25.25 0 0 1 0 .49c-1.31.28-1.75.72-2.03 2.03a.25.25 0 0 1-.5 0c-.28-1.31-.72-1.75-2.03-2.03a.25.25 0 0 1 0-.49c1.31-.28 1.75-.73 2.03-2.03a.25.25 0 0 1 .25-.2Z"></path>`}</svg>`;

const READ_MS = 700;
const CARD_MS = 90;
/** New words are shown in batches at most this often */
const REVEAL_MS = 50;

/** Where each paragraph and list item starts, in order */
function blockStarts(blocks: Block[]) {
  const starts: number[] = [];
  for (const b of blocks) {
    if (b.kind === "p") {
      if (b.tokens[0]) starts.push(b.tokens[0].i);
    } else for (const item of b.items) if (item[0]) starts.push(item[0].i);
  }
  return starts.sort((a, b) => a - b);
}
/** One past the start of the last paragraph or item that has begun once `shown` words are out (0: none yet) */
function edgeOf(starts: number[], shown: number) {
  let edge = 0;
  for (const s of starts) {
    if (s >= shown) break;
    edge = s + 1;
  }
  return edge;
}
/** Shows the first `shown` words (data-on) and puts the caret after the last of them (data-caret) */
function paintWords(box: HTMLElement | null, shown: number) {
  box?.querySelectorAll<HTMLElement>("[data-i]").forEach((el) => {
    const i = Number(el.dataset.i);
    if (i < shown !== el.hasAttribute("data-on")) el.toggleAttribute("data-on", i < shown);
    if ((i === shown - 1) !== el.hasAttribute("data-caret")) el.toggleAttribute("data-caret", i === shown - 1);
  });
}
const firstIndex = (b: Block) => (b.kind === "p" ? b.tokens[0]?.i : b.items[0]?.[0]?.i) ?? Infinity;

let uidSeq = 0;

/**
 * An assistant's answer with its sources, citation chips, actions, feedback and follow-up questions.
 * @tag tc-ai-answer
 * @fires tc-feedback-change - The verdict changes (a thumb, a reason, clearing it, a new answer starting over); detail `{ feedback: AnswerFeedback | null }`. Cancelable: preventDefault() keeps `feedback` as it is (controlled use)
 * @fires tc-feedback - A thumb up, or a thumbs down once its reason is picked; detail `{ value: "up" | "down", reason?: string }`
 * @fires tc-follow-up - A follow-up question was picked; detail `{ question: string }`
 * @fires tc-stop - Stop was pressed while writing
 * @fires tc-copy - The answer is on the clipboard; detail `{ text: string }`
 */
export class TcAiAnswer extends TcElement {
  static override ui = "ans";

  /** The question above the answer */
  @property() accessor question = "";
  /** The sources the answer cites, numbered from 1 in the order given – [1] in the answer is the first */
  @property({ attribute: false }) accessor sources: AnswerSource[] = [];
  /** The answer text – may grow while `streaming` is set */
  @property() accessor answer = "";
  /** More text is still coming from your model, keep the cursor going */
  @property({ type: Boolean }) accessor streaming = false;
  /** Stream the text in; false shows it at once */
  @property({ attribute: false }) accessor animated = true;
  /** Words per second while streaming in */
  @property({ type: Number }) accessor speed = 38;
  /** Follow-up questions offered under the finished answer */
  @property({ attribute: false }) accessor followUps: string[] = [];
  /** The verdict shown (null: none) */
  @property({ attribute: false }) accessor feedback: AnswerFeedback | null = null;
  /** Reasons offered after a thumbs down */
  @property({ attribute: false }) accessor feedbackReasons = ["Not accurate", "Wrong source", "Too long", "Out of date"];
  /** Leave out the built-in actions under a finished answer (copy, regenerate, thumbs and the status beside them) –
   *  for an app that puts its own row there, such as `tc-message-actions`. Stop still shows while the answer is written */
  @property({ type: Boolean, attribute: "hide-actions" }) accessor hideActions = false;
  /** Regenerate: may return a promise – a rejection shows in the last row, and Regenerate can be tried again */
  @property({ attribute: false }) accessor onRegenerate: (() => void | Promise<unknown>) | undefined = undefined;

  /** @internal */
  @state() accessor run = 0;
  /** @internal */
  @state() accessor phase: Phase = "reading";
  /** @internal */
  @state() accessor seconds = 0;
  /** @internal */
  @state() accessor failed: string | null = null;
  /** @internal */
  @state() accessor copied = false;
  /** @internal */
  @state() accessor pop: Pop | null = null;
  /** @internal */
  @state() accessor hoverSource: number | null = null;
  /** @internal How far the typing has got, rounded to the paragraph – the only part that renders */
  @state() accessor visible = 0;

  private uid = `tc-ans-${++uidSeq}`;
  private screen = new OnScreenController(this);
  private parsed: { blocks: Block[]; total: number } = { blocks: [], total: 0 };
  private starts: number[] = [];
  private shown = 0;
  private progress = 0;
  private started = 0;
  private prevAnswer: string | null = null;
  private lastRun = -1;
  private feedbackRun = 0;
  private readTimer = 0;
  private copiedTimer = 0;
  private closeTimer = 0;
  private frame = 0;
  private loopKey = "";
  private cardRo?: { ro: ResizeObserver; card: HTMLElement; inner: HTMLElement };

  constructor() {
    super();
    // Focus never drops to <body>: Stop gives way to the actions (Copy), the folded reasons send it back to Bad
    // answer, a new run sends it to Stop
    new FocusRescueController(this, (key) => {
      const first = this.querySelector<HTMLElement>(".ui-ans__action");
      return (key === "stop" ? first : null) ?? this.querySelector<HTMLElement>(".ui-ans__down") ?? first ?? this.querySelector<HTMLElement>(".ui-ans__stop");
    });
    this.addEventListener("mouseleave", () => (this.hoverSource = null));
  }

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener("keydown", this.onDocKey);
    if (this.hasUpdated) {
      this.loopKey = "";
      this.requestUpdate();
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("keydown", this.onDocKey);
    clearTimeout(this.readTimer);
    clearTimeout(this.copiedTimer);
    clearTimeout(this.closeTimer);
    cancelAnimationFrame(this.frame);
    this.loopKey = "";
    this.cardRo?.ro.disconnect();
    this.cardRo = undefined;
  }

  private get instant() {
    return !this.animated || reducedMotion();
  }

  private setFeedback(next: AnswerFeedback | null) {
    if (next === this.feedback) return;
    if (this.emit("tc-feedback-change", { feedback: next }, { cancelable: true })) this.feedback = next;
  }

  /** Writes the first `n` words to the DOM; renders only when a new paragraph begins */
  private show(n: number) {
    if (n !== this.shown) {
      this.shown = n;
      paintWords(this.querySelector(".ui-ans__answer"), n);
    }
    const edge = edgeOf(this.starts, n);
    if (edge !== this.visible) this.visible = edge;
  }

  private onDocKey = (e: KeyboardEvent) => {
    // Esc closes the preview wherever focus is, without moving it (WCAG 1.4.13)
    if (e.key === "Escape" && this.pop) this.pop = null;
  };

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("answer") || changed.has("sources") || !this.hasUpdated) {
      this.parsed = parse(this.answer, this.sources.length);
      this.starts = blockStarts(this.parsed.blocks);
    }
    // A new answer (not just more of the same one) starts over; more of the same one after it finished is written on
    if (this.prevAnswer !== null && this.answer !== this.prevAnswer) {
      if (!this.answer.startsWith(this.prevAnswer)) {
        this.run++;
        this.failed = null;
      } else if (this.phase === "done" && this.progress < this.parsed.total) {
        if (this.instant) this.progress = Infinity;
        this.phase = "writing";
      }
    }
    this.prevAnswer = this.answer;
    // Each run: read the sources, then write
    if (this.run !== this.lastRun) {
      this.lastRun = this.run;
      this.started = performance.now();
      this.progress = 0;
      this.show(0);
      if (this.feedbackRun !== this.run) {
        this.feedbackRun = this.run;
        this.setFeedback(null);
      }
      this.copied = false;
      this.pop = null;
      clearTimeout(this.readTimer);
      if (this.instant) {
        this.progress = Infinity;
        this.phase = "writing";
      } else {
        this.phase = "reading";
        this.readTimer = window.setTimeout(() => (this.phase = "writing"), this.sources.length ? READ_MS + this.sources.length * CARD_MS : 0);
      }
    }
    if (this.dataset.phase !== this.phase) this.dataset.phase = this.phase;
  }

  protected override updated() {
    this.toggleAttribute("data-offscreen", !this.screen.onScreen);
    // New text may regroup the paragraphs; newly rendered words start hidden until painted
    paintWords(this.querySelector(".ui-ans__answer"), this.shown);
    const edge = edgeOf(this.starts, this.shown);
    if (edge !== this.visible) this.visible = edge;
    this.writingLoop();
    // The card glides to its new height (Clean: only the content above the last row)
    const card = this.querySelector<HTMLElement>(this.resolvedLook === "clean" ? ".ui-ans__body" : ".ui-ans__card");
    const inner = this.querySelector<HTMLElement>(".ui-ans__inner");
    if (card && inner && (this.cardRo?.card !== card || this.cardRo.inner !== inner)) {
      this.cardRo?.ro.disconnect();
      const set = () => (card.style.height = `${inner.offsetHeight}px`);
      set();
      const ro = new ResizeObserver(set);
      ro.observe(inner);
      this.cardRo = { ro, card, inner };
    }
  }

  /** Writing: words appear at `speed`; waits for more text while `streaming` */
  private writingLoop() {
    const total = this.parsed.total;
    const key = this.phase === "writing" && this.isConnected ? `${total}|${this.streaming}|${this.speed}|${this.run}` : "";
    if (key === this.loopKey) return;
    this.loopKey = key;
    cancelAnimationFrame(this.frame);
    if (!key) return;
    let last = performance.now();
    let revealed = last;
    const tick = (now: number) => {
      this.progress = Math.min(total, this.progress + ((now - last) / 1000) * this.speed);
      last = now;
      if (now - revealed >= REVEAL_MS || this.progress >= total) {
        revealed = now;
        this.show(Math.floor(this.progress));
      }
      if (this.progress >= total) {
        // Caught up: done, or – while more text is streaming in – idle until it arrives
        if (!this.streaming) {
          this.seconds = Math.max(0.1, Math.round((performance.now() - this.started) / 100) / 10);
          this.phase = "done";
        }
        return;
      }
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  /* ---------- Actions ---------- */

  private openPop(ids: number[], el: HTMLElement) {
    clearTimeout(this.closeTimer);
    const box = this.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const width = Math.min(300, box.width - 16);
    const left = Math.max(8, Math.min(box.width - width - 8, r.left - box.left + r.width / 2 - width / 2));
    this.pop = { ids, left, top: r.bottom - box.top + 6, width };
  }
  private closePop = () => {
    clearTimeout(this.closeTimer);
    this.closeTimer = window.setTimeout(() => (this.pop = null), 140);
  };

  private copy() {
    const text = plain(this.answer, this.sources);
    // "Copied" only once the text is on the clipboard – not when there's no clipboard or the browser refuses
    if (!navigator.clipboard?.writeText) return;
    navigator.clipboard.writeText(text).then(
      () => {
        if (!this.isConnected) return;
        this.copied = true;
        clearTimeout(this.copiedTimer);
        this.copiedTimer = window.setTimeout(() => (this.copied = false), 1800);
        this.emit("tc-copy", { text });
      },
      () => {},
    );
  }
  private stop() {
    this.seconds = Math.max(0.1, Math.round((performance.now() - this.started) / 100) / 10);
    this.phase = "stopped";
    this.emit("tc-stop", null);
  }
  private regenerate() {
    this.run++;
    this.failed = null;
    let work: unknown;
    try {
      work = this.onRegenerate?.();
    } catch (e) {
      this.failed = messageOf(e);
      return;
    }
    if (work && typeof (work as Promise<unknown>).then === "function")
      (work as Promise<unknown>).then(undefined, (e: unknown) => {
        if (this.isConnected) this.failed = messageOf(e);
      });
  }
  private voteFor(value: "up" | "down") {
    const next = this.feedback?.value === value ? null : value;
    this.setFeedback(next ? { value: next } : null);
    if (next === "up") this.emit("tc-feedback", { value: "up" });
  }
  private pickReason(r: string) {
    // The reasons fold away: focus goes back to Bad answer first
    rescueFocus(this.querySelector(".ui-ans__reasons"), [this.querySelector(".ui-ans__down")]);
    this.setFeedback({ value: "down", reason: r });
    this.emit("tc-feedback", { value: "down", reason: r });
  }

  /* ---------- Render ---------- */

  private renderTokens(tokens: Token[], lit: Set<number>) {
    const sources = this.sources;
    const pop = this.pop;
    return tokens.map((t) => {
      if (t.kind === "word") return html`<span class="ui-ans__w" data-i=${t.i} ?data-bold=${!!t.bold}>${t.text}</span>`;
      const first = sources[t.ids[0]];
      return html`<span class="ui-ans__w" data-i=${t.i}
        ><button
          type="button"
          class="ui-ans__cite"
          ?data-lit=${t.ids.some((id) => lit.has(id))}
          aria-describedby=${ifDefined(pop && pop.ids === t.ids ? `${this.uid}-pop` : undefined)}
          @mouseenter=${(e: Event) => this.openPop(t.ids, e.currentTarget as HTMLElement)}
          @mouseleave=${this.closePop}
          @focus=${(e: Event) => this.openPop(t.ids, e.currentTarget as HTMLElement)}
          @blur=${this.closePop}
          @click=${(e: Event) => (this.pop?.ids === t.ids ? (this.pop = null) : this.openPop(t.ids, e.currentTarget as HTMLElement))}
          @keydown=${(e: KeyboardEvent) => e.key === "Escape" && (this.pop = null)}
        >${first.name}${t.ids.length > 1 ? html`<span class="ui-ans__more">+${t.ids.length - 1}</span>` : nothing}<span class="ui-ans__sr">${` – ${t.ids.map((id) => sources[id].title).join("; ")}`}</span></button
      ></span>`;
    });
  }

  private renderSources(lit: Set<number>) {
    const sources = this.sources;
    if (!sources.length) return nothing;
    const instant = this.instant;
    return keyed(
      `s${this.run}`,
      html`<div class="ui-ans__sources" aria-label="Sources" role="list">
        ${sources.map((s, i) => {
          const inner = html`<span class="ui-ans__site">${s.icon ? html`<span class="ui-ans__favicon">${s.icon.cloneNode(true)}</span>` : nothing}<span class="ui-ans__site-name">${s.name}</span><span class="ui-ans__num">${i + 1}</span></span><span class="ui-ans__title">${s.title}</span>`;
          const style = styleMap({ animationDelay: instant ? "0ms" : `${120 + i * CARD_MS}ms` });
          return html`<div role="listitem" class="ui-ans__source-wrap">
            ${s.href
              ? html`<a class="ui-ans__source" ?data-lit=${lit.has(i)} style=${style} href=${s.href} target="_blank" rel="noreferrer" @mouseenter=${() => (this.hoverSource = i)} @mouseleave=${() => (this.hoverSource = null)}>${inner}</a>`
              : html`<div class="ui-ans__source" ?data-lit=${lit.has(i)} style=${style} @mouseenter=${() => (this.hoverSource = i)} @mouseleave=${() => (this.hoverSource = null)}>${inner}</div>`}
          </div>`;
        })}
      </div>`,
    );
  }

  private renderAnswer(lit: Set<number>) {
    const { phase, visible, run } = this;
    const finished = phase === "done" || phase === "stopped";
    return html`<div class="ui-ans__answer" aria-busy=${finished ? "false" : "true"}>
      ${phase === "writing" && visible === 0 ? html`<p><span class="ui-ans__caret" aria-hidden="true"></span></p>` : nothing}
      ${phase === "stopped" && visible === 0 ? html`<p class="ui-ans__empty">Stopped before answering.</p>` : nothing}
      ${keyed(
        run,
        html`${this.parsed.blocks.map((b) =>
          firstIndex(b) >= visible
            ? nothing
            : b.kind === "p"
              ? html`<p>${this.renderTokens(b.tokens, lit)}</p>`
              : html`<ul>${b.items.map((item) => (item[0] && item[0].i < visible ? html`<li>${this.renderTokens(item, lit)}</li>` : nothing))}</ul>`,
        )}`,
      )}
    </div>`;
  }

  private renderFooter(status: string) {
    const look = this.resolvedLook;
    const icons = look === "clean" ? cleanIcons : standardIcons;
    const finished = this.phase === "done" || this.phase === "stopped";
    const vote = this.feedback?.value ?? null;
    const reason = this.feedback?.reason ?? null;
    const copied = this.copied;
    const reasonsOpen = vote === "down" && !reason;
    if (finished && this.hideActions) return nothing;
    return html`
      <div class="ui-ans__foot">
        ${finished
          ? html`<div class="ui-ans__actions">
              <button type="button" class="ui-ans__action" aria-label=${copied ? "Copied" : "Copy answer"} @click=${() => this.copy()}>${glyph(copied ? icons.check : icons.copy, look, true, copied ? "ui-ans__ok" : undefined)}</button>
              <button type="button" class="ui-ans__action ui-ans__redo" aria-label="Regenerate" @click=${() => this.regenerate()}>${glyph(icons.redo, look)}</button>
              <button type="button" class="ui-ans__action" aria-label="Good answer" aria-pressed=${vote === "up" ? "true" : "false"} @click=${() => this.voteFor("up")}>${glyph(icons.thumb, look, true)}</button>
              <button type="button" class="ui-ans__action ui-ans__down" aria-label="Bad answer" aria-pressed=${vote === "down" ? "true" : "false"} @click=${() => this.voteFor("down")}>${glyph(icons.thumb, look, true)}</button>
            </div>`
          : html`<button type="button" class="ui-ans__stop" data-focus-key="stop" @click=${() => this.stop()}><span class="ui-ans__stop-icon" aria-hidden="true"></span>Stop</button>`}
        ${finished
          ? keyed(
              status,
              html`<span class="ui-ans__status" aria-hidden="true">${status.startsWith("Answered in ")
                ? html`<span class="ui-ans__status-lead">Answered in </span>${status.slice("Answered in ".length)}`
                : status}</span>`,
            )
          : nothing}
      </div>
      ${this.hideActions
        ? nothing
        : html`<div class="ui-ans__reasons" data-open=${reasonsOpen ? "true" : "false"} .inert=${!reasonsOpen}>
            <div>${this.feedbackReasons.map((r) => html`<button type="button" @click=${() => this.pickReason(r)}>${r}</button>`)}</div>
          </div>`}
    `;
  }

  private renderPop() {
    const pop = this.pop;
    if (!pop) return nothing;
    return html`<div
      id=${`${this.uid}-pop`}
      role="tooltip"
      class="ui-ans__pop"
      style=${styleMap({ left: `${pop.left}px`, top: `${pop.top}px`, width: `${pop.width}px` })}
      @mouseenter=${() => clearTimeout(this.closeTimer)}
      @mouseleave=${this.closePop}
    >
      ${pop.ids.map((id) => {
        const s = this.sources[id];
        return html`<a class="ui-ans__pop-item" href=${ifDefined(s.href)} target="_blank" rel="noreferrer" tabindex="-1">
          <span class="ui-ans__site">${s.icon ? html`<span class="ui-ans__favicon">${s.icon.cloneNode(true)}</span>` : nothing}<span class="ui-ans__site-name">${s.href ? s.href.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] : s.name}</span><span class="ui-ans__num">${id + 1}</span></span>
          <span class="ui-ans__pop-title">${s.title}</span>
          ${s.snippet && pop.ids.length === 1 ? html`<span class="ui-ans__snippet">${s.snippet}</span>` : nothing}
        </a>`;
      })}
    </div>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const clean = look === "clean";
    const { phase, failed } = this;
    const finished = phase === "done" || phase === "stopped";
    const vote = this.feedback?.value ?? null;
    const reason = this.feedback?.reason ?? null;
    const lit = new Set(this.pop ? this.pop.ids : this.hoverSource !== null ? [this.hoverSource] : []);
    const status = this.copied
      ? "Copied"
      : failed
        ? `Couldn't regenerate: ${failed}`
        : vote === "up" || reason
          ? "Thanks for the feedback"
          : vote === "down"
            ? "What went wrong?"
            : phase === "stopped"
              ? "Stopped"
              : `Answered in ${this.seconds}s`;
    const label = phase === "reading" ? `Reading ${this.sources.length} sources` : phase === "writing" ? "Writing" : "Answer";
    const icons = clean ? cleanIcons : standardIcons;

    const content = html`<div class="ui-ans__inner">
      ${this.renderSources(lit)}
      <div class="ui-ans__label">
        ${clean ? sparkleMark : cloudMark(this.uid)}
        ${keyed(label, html`<span class="ui-ans__label-text">${label}${!finished ? html`<span class="ui-ans__shine" aria-hidden="true"><span>${label}</span></span>` : nothing}</span>`)}
      </div>
      ${this.renderAnswer(lit)}
      ${phase === "done" && this.followUps.length
        ? html`<div class="ui-ans__follow">
            <span class="ui-ans__follow-label">Related</span>
            ${this.followUps.map(
              (q, i) => html`<button type="button" class="ui-ans__follow-item" style=${styleMap({ animationDelay: `${this.instant ? 0 : 80 + i * 60}ms` })} @click=${() => this.emit("tc-follow-up", { question: q })}>
                <span>${q}</span>${glyph(icons.arrow, look, true)}
              </button>`,
            )}
          </div>`
        : nothing}
    </div>`;
    const footer = this.renderFooter(status);
    // The question is the card's title; with no question there's no header
    const head = this.question ? cardHead({ icon: answerIcon, title: this.question }) : nothing;

    return html`
      ${clean ? html`<div class="ui-ans__card">${head}<div class="ui-ans__body">${content}</div>${footer}</div>` : html`${head}<div class="ui-ans__card">${content}</div>${footer}`}
      <span class="ui-ans__sr" role="status">${finished && !failed ? status : ""}</span>
      <span class="ui-ans__sr" role="alert">${finished && failed ? status : ""}</span>
      ${this.renderPop()}
    `;
  }

  static override css = /* css */ `
/* Colors and motion as variables – override them on [data-ui="ans"] */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ans"] {
  /* the shimmer band over the label: brighter than --tc-shimmer, so it reads on light text in dark mode */
  --tc-ai-answer-shimmer: light-dark(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.95));
  --tc-ai-answer-source-ring-lit: light-dark(#cfcfd3, #4a4a50);
  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  width: 100%;
  max-width: 640px;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-sunken);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-lg);
  line-height: 1.5;
  color: var(--tc-text-secondary);
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="ans"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ans"] {
  /* the shimmer band over the label: brighter than --tc-shimmer, so it reads on light text in dark mode */
  --tc-ai-answer-shimmer: light-dark(rgba(255, 255, 255, 0.82), #ffffff);
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  width: 100%;
  max-width: 640px;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="ans"] *, [data-ui="ans"] *::before, [data-ui="ans"] *::after { box-sizing: border-box; }
:where([data-ui="ans"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where([data-ui="ans"]) svg { display: block; flex: none; }
[data-ui="ans"] button:focus-visible,
[data-ui="ans"] a:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* Source cards sit in a scroller that would clip an outside ring */
[data-ui="ans"] .ui-ans__source:focus-visible { outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-ans__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* The white card */
:where([data-look="standard"], [data-look="standard"] *).ui-ans__card {
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  transition: height var(--tc-duration-slow) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-ans__inner { display: flow-root; padding: 22px var(--tc-space-6) var(--tc-space-5); }
/* The question leads the answer: deliberately a step above the card-title size in Standard */
/* Sources: a row of small cards that scrolls sideways */
:where([data-look="standard"], [data-look="standard"] *).ui-ans__sources {
  display: flex;
  gap: var(--tc-space-2);
  margin: 0 -24px;
  padding: 0 var(--tc-space-6) var(--tc-space-0-5);
  overflow-x: auto;
  scroll-padding: 0 24px;
  scrollbar-width: none;
  -webkit-mask: linear-gradient(90deg, transparent, #000 16px, #000 calc(100% - 24px), transparent);
  mask: linear-gradient(90deg, transparent, #000 16px, #000 calc(100% - 24px), transparent);
}
/* One white card – the edge is a shadow, not a border */
:where([data-look="clean"], [data-look="clean"] *).ui-ans__card {
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ans__body { overflow: hidden; transition: height var(--tc-duration-slow) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__inner { display: flow-root; padding: var(--tc-space-5) var(--tc-space-5) var(--tc-space-4); }
/* Sources: small white cards in a row that scrolls sideways */
:where([data-look="clean"], [data-look="clean"] *).ui-ans__sources {
  display: flex;
  gap: var(--tc-space-2);
  margin: 0 -20px;
  padding: var(--tc-space-0-5) var(--tc-space-5) var(--tc-space-1);
  overflow-x: auto;
  scroll-padding: 0 20px;
  scrollbar-width: none;
  -webkit-mask: linear-gradient(90deg, transparent, transparent 6px, #000 20px, #000 calc(100% - 120px), transparent calc(100% - 20px));
  mask: linear-gradient(90deg, transparent, transparent 6px, #000 20px, #000 calc(100% - 120px), transparent calc(100% - 20px));
}
.ui-ans__sources::-webkit-scrollbar { display: none; }
.ui-ans__source-wrap { flex: none; display: flex; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__source {
  display: flex;
  flex-direction: column;
  gap: var(--tc-space-1-5);
  width: 172px;
  padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-3);
  border-radius: var(--tc-radius-xl);
  background: var(--tc-fill-default);
  color: inherit;
  text-decoration: none;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard);
  animation: ui-ans-card var(--tc-duration-slower) var(--tc-ease-move) both;
}
a:where([data-look="standard"], [data-look="standard"] *).ui-ans__source:hover { background: var(--tc-fill-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__source[data-lit] { box-shadow: inset 0 0 0 1.5px var(--tc-ai-answer-source-ring-lit); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__site { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__source {
  display: flex;
  flex-direction: column;
  gap: var(--tc-space-1);
  width: 168px;
  padding: var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-2);
  border-radius: var(--tc-radius-md);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  color: inherit;
  text-decoration: none;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard);
  animation: ui-ans-card-clean var(--tc-duration-slower) var(--tc-ease-move) both;
}
a:where([data-look="clean"], [data-look="clean"] *).ui-ans__source:hover { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__source[data-lit] { background: var(--tc-fill-subtle); box-shadow: var(--tc-shadow-raised-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__site { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-ans__site-name { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__num { flex: none; font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__favicon {
  display: grid;
  flex: none;
  width: 16px;
  height: 16px;
  overflow: hidden;
  border-radius: var(--tc-radius-xs);
  box-shadow: 0 0 0 1px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
}
:where([data-look="clean"], [data-look="clean"] *).ui-ans__num { flex: none; font-size: var(--tc-font-size-2xs); line-height: var(--tc-line-height-tight); font-weight: var(--tc-font-weight-medium); letter-spacing: var(--tc-tracking-caps); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__favicon {
  display: grid;
  flex: none;
  width: 14px;
  height: 14px;
  overflow: hidden;
  border-radius: var(--tc-radius-xs);
  box-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
}
.ui-ans__favicon svg { width: 100%; height: 100%; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-size: var(--tc-font-size-sm);
  line-height: 1.4;
  color: var(--tc-text-primary);
}
/* "Reading 6 sources" → "Writing" → "Answer" */
:where([data-look="standard"], [data-look="standard"] *).ui-ans__label { display: flex; align-items: center; gap: var(--tc-space-2); margin: var(--tc-space-5) 0 var(--tc-space-2-5); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__mark { width: 27px; height: 24px; margin: -3px -1px -3px -2px; overflow: visible; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__mark {
  /* Reversed for dark mode: deep at the top, brighter at the bottom, a dark glow inside the edge; the eyes stay white */
  --tc-ai-answer-mark-top: light-dark(#7ccbff, #1a4f9e);
  --tc-ai-answer-mark-bottom: light-dark(#2f8fea, #3d9cf0);
  --tc-ai-answer-mark-glow: light-dark(#ffffff, #081a36);
  --tc-ai-answer-mark-edge: light-dark(#b3dcff, #173866);
  --tc-ai-answer-mark-eye-top: #ffffff;
  --tc-ai-answer-mark-eye-bottom: #d6f0ff;
  --tc-ai-answer-mark-eye-shade: rgba(30, 140, 230, 0.3);
}
:where([data-look="standard"], [data-look="standard"] *).ui-ans__mark-edge { fill: var(--tc-ai-answer-mark-edge); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__mark-eye-shade { stroke: var(--tc-ai-answer-mark-eye-shade); }
/* The eyes: look around, blink and wink once done; scan while reading; follow the lines while writing */
:where([data-look="standard"], [data-look="standard"] *).ui-ans__eyes { animation: ui-ans-look 7s ease-in-out 2; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__eye { transform-box: fill-box; transform-origin: center; animation: ui-ans-blink 7s ease-in-out 2; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__eye-r { animation-name: ui-ans-blink-r; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ans"][data-phase="reading"] .ui-ans__eyes { animation: ui-ans-scan var(--tc-duration-shimmer) ease-in-out infinite; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ans"][data-phase="writing"] .ui-ans__eyes { animation: ui-ans-follow 1.9s cubic-bezier(0.45, 0, 0.55, 1) infinite; }
@keyframes ui-ans-look {
  0%, 26% { transform: none; }
  32%, 44% { transform: translate(-12px, 1px); }
  50%, 62% { transform: translate(12px, -2px); }
  68%, 100% { transform: none; }
}
@keyframes ui-ans-blink {
  0%, 16%, 21%, 100% { transform: none; }
  18.5% { transform: scaleY(0.1); }
}
@keyframes ui-ans-blink-r {
  0%, 16%, 21%, 84%, 93%, 100% { transform: none; }
  18.5% { transform: scaleY(0.1); }
  87%, 90% { transform: scaleY(0.1); }
}
@keyframes ui-ans-scan {
  0%, 100% { transform: translate(-11px, 1px); }
  50% { transform: translate(11px, 1px); }
}
@keyframes ui-ans-follow {
  0% { transform: translate(-10px, 5px); }
  82% { transform: translate(10px, 5px); }
  100% { transform: translate(-10px, 5px); }
}
:where([data-look="clean"], [data-look="clean"] *).ui-ans__title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-strong);
}
/* "Reading 6 sources" → "Writing" → "Answer" */
:where([data-look="clean"], [data-look="clean"] *).ui-ans__label { display: flex; align-items: center; gap: var(--tc-space-1-5); margin: var(--tc-space-4) 0 var(--tc-space-1-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__mark { width: 16px; height: 16px; fill: var(--tc-accent); overflow: visible; }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__mark path { transform-box: fill-box; transform-origin: center; }
/* While it works the big sparkle breathes and the small one twinkles */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ans"][data-phase="reading"] .ui-ans__mark-big,
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ans"][data-phase="writing"] .ui-ans__mark-big { animation: ui-ans-breathe var(--tc-duration-shimmer) ease-in-out infinite; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ans"][data-phase="reading"] .ui-ans__mark-small,
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ans"][data-phase="writing"] .ui-ans__mark-small { animation: ui-ans-twinkle var(--tc-duration-shimmer) ease-in-out infinite; }
.ui-ans__label-text { position: relative; animation: ui-ans-fade var(--tc-duration-slow) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ans"][data-phase="reading"] .ui-ans__label-text,
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ans"][data-phase="writing"] .ui-ans__label-text { color: var(--tc-text-muted); }
/* The answer */
:where([data-look="standard"], [data-look="standard"] *).ui-ans__answer { font-size: var(--tc-font-size-lg-plus); line-height: 1.65; color: var(--tc-text-secondary); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__answer p { margin: 0 0 var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__answer ul { margin: 0 0 var(--tc-space-3); padding: 0 0 0 var(--tc-space-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__answer li { margin: 0 0 var(--tc-space-1-5); padding-left: var(--tc-space-0-5); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ans"][data-phase="done"] .ui-ans__label-text,
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ans"][data-phase="stopped"] .ui-ans__label-text { color: var(--tc-text-secondary); }
/* The answer */
:where([data-look="clean"], [data-look="clean"] *).ui-ans__answer { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__answer p { margin: 0 0 var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__answer ul { margin: 0 0 var(--tc-space-2); padding: 0 0 0 var(--tc-space-4-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__answer li { margin: 0 0 var(--tc-space-1); padding-left: var(--tc-space-0-5); }
.ui-ans__answer li::marker { color: var(--tc-text-disabled); }
.ui-ans__answer > :last-child { margin-bottom: 0; }
.ui-ans__empty { color: var(--tc-text-muted); }
.ui-ans__w { animation: ui-ans-word var(--tc-duration-slower) var(--tc-ease-move) both; }
/* Words are rendered ahead of the typing and shown by it (data-on); the caret follows the last one shown */
.ui-ans__w:not([data-on]) { display: none; }
[data-ui="ans"][data-phase="writing"] .ui-ans__w[data-caret]::after { content: ""; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__w[data-bold] { font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__caret,
:where([data-look="standard"][data-phase="writing"]) .ui-ans__w[data-caret]::after {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-left: var(--tc-space-1);
  border-radius: 50%;
  background: var(--tc-text-primary);
  vertical-align: 0.05em;
  animation: ui-ans-pulse var(--tc-duration-reveal-slow) ease-in-out infinite;
}
/* Citation chips */
:where([data-look="standard"], [data-look="standard"] *).ui-ans__cite {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1);
  height: 20px;
  margin: 0 1px 0 var(--tc-space-1);
  padding: 0 var(--tc-space-2);
  border-radius: var(--tc-radius-sm);
  background: var(--tc-fill-default);
  font-size: var(--tc-font-size-xs);
  font-weight: var(--tc-font-weight-medium);
  line-height: 1;
  color: var(--tc-text-muted);
  vertical-align: 0.12em;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
  animation: ui-ans-chip var(--tc-duration-slower) var(--tc-ease-move) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-ans__cite:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__cite[data-lit] { background: var(--tc-surface-inverse); color: var(--tc-text-on-inverse); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__w[data-bold] { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__caret,
:where([data-look="clean"][data-phase="writing"]) .ui-ans__w[data-caret]::after {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-left: var(--tc-space-1);
  border-radius: 1.5px;
  background: var(--tc-accent);
  vertical-align: 0.1em;
  animation: ui-ans-pulse-clean var(--tc-duration-reveal-slow) ease-in-out infinite;
}
/* Citation chips: the gray tab look; the linked one gets a touch darker */
:where([data-look="clean"], [data-look="clean"] *).ui-ans__cite {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1);
  height: var(--tc-pill-h);
  margin: 0 1px 0 var(--tc-space-1);
  padding: 0 var(--tc-pill-px);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-fill-default);
  box-shadow: inset 0 0 0 0.5px var(--tc-border-default);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-font-weight-medium);
  line-height: 1;
  color: var(--tc-text-secondary);
  vertical-align: 0.1em;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
  animation: ui-ans-chip var(--tc-duration-slower) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ans__cite:hover,
:where([data-look="clean"], [data-look="clean"] *).ui-ans__cite[data-lit] { background: var(--tc-fill-strong); color: var(--tc-text-primary); }
/* "+2" in the chip's own colour – opacity took it below 4.5:1 */
.ui-ans__more { font-variant-numeric: tabular-nums; }
/* Preview of the cited source */
:where([data-look="standard"], [data-look="standard"] *).ui-ans__pop {
  position: absolute;
  z-index: var(--tc-z-dropdown);
  display: grid;
  gap: var(--tc-space-0-5);
  padding: var(--tc-space-1-5);
  border-radius: var(--tc-menu-radius);
  background: var(--tc-menu-bg);
  box-shadow: var(--tc-menu-shadow);
  animation: ui-ans-pop var(--tc-duration-base) var(--tc-ease-move) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-ans__pop-item { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-2-5); border-radius: var(--tc-menu-item-radius); color: inherit; text-decoration: none; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__pop-item[href]:hover { background: var(--tc-fill-default); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__pop-title { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: 1.4; color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__snippet {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  font-size: var(--tc-font-size-sm);
  line-height: 1.5;
  color: var(--tc-text-muted);
}
/* Follow-up questions */
:where([data-look="standard"], [data-look="standard"] *).ui-ans__follow { display: grid; margin-top: var(--tc-space-5); padding-top: var(--tc-space-3-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__follow-label { padding-bottom: var(--tc-space-1); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); animation: ui-ans-fade var(--tc-duration-slow) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__follow-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3);
  min-height: 40px;
  padding: var(--tc-space-2) 0;
  border-bottom: var(--tc-hairline) solid var(--tc-divider);
  text-align: left;
  color: var(--tc-text-primary);
  animation: ui-ans-fade var(--tc-duration-slower) var(--tc-ease-move) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-ans__follow-item:last-child { border-bottom: 0; padding-bottom: 0; }
/* Preview of the cited source */
:where([data-look="clean"], [data-look="clean"] *).ui-ans__pop {
  position: absolute;
  z-index: var(--tc-z-dropdown);
  display: grid;
  gap: var(--tc-space-0-5);
  padding: var(--tc-menu-padding);
  border-radius: var(--tc-menu-radius);
  background: var(--tc-menu-bg);
  box-shadow: var(--tc-menu-shadow);
  animation: ui-ans-pop var(--tc-duration-base) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ans__pop-item { display: grid; gap: var(--tc-space-0-5); padding: var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-2); border-radius: var(--tc-menu-item-radius); color: inherit; text-decoration: none; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__pop-item[href]:hover { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__pop-title { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-text-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__snippet {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-text-secondary);
}
/* Follow-up questions */
:where([data-look="clean"], [data-look="clean"] *).ui-ans__follow { display: grid; margin-top: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__follow-label {
  padding-bottom: var(--tc-space-1);
  font-size: var(--tc-caption-font-size);
  font-weight: var(--tc-caption-font-weight);
  line-height: var(--tc-caption-line-height);
  letter-spacing: var(--tc-caption-tracking);
  text-transform: var(--tc-caption-transform);
  color: var(--tc-caption-color);
  animation: ui-ans-fade var(--tc-duration-slow) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ans__follow-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3);
  min-height: 32px;
  padding: var(--tc-space-1-5) 0;
  border-top: var(--tc-hairline) solid var(--tc-divider);
  text-align: left;
  color: var(--tc-text-primary);
  animation: ui-ans-fade var(--tc-duration-slower) var(--tc-ease-move) both;
}
.ui-ans__follow-item .ui-ans__glyph { color: var(--tc-icon-muted); transition: transform var(--tc-duration-base) var(--tc-ease-move), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__follow-item:hover .ui-ans__glyph { color: var(--tc-text-primary); transform: translateX(3px); }
/* The tray below the card */
:where([data-look="standard"], [data-look="standard"] *).ui-ans__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); height: 42px; padding: 0 var(--tc-space-2) 0 var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__follow-item:hover .ui-ans__glyph { color: var(--tc-text-primary); transform: translateX(2px); }
/* The last row inside the card */
:where([data-look="clean"], [data-look="clean"] *).ui-ans__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3);
  height: 44px;
  padding: 0 var(--tc-space-3) 0 var(--tc-space-2);
  border-top: var(--tc-hairline) solid var(--tc-divider);
}
.ui-ans__actions { display: flex; gap: var(--tc-space-0-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__action {
  display: grid;
  place-items: center;
  width: var(--tc-control-h-md);
  height: var(--tc-control-h-md);
  border-radius: var(--tc-control-radius-md);
  color: var(--tc-text-muted);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
  animation: ui-ans-fade var(--tc-duration-slow) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ans__action {
  display: grid;
  place-items: center;
  width: var(--tc-control-h-md);
  height: var(--tc-control-h-md);
  border-radius: var(--tc-control-radius-md);
  color: var(--tc-icon-muted);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
  animation: ui-ans-fade var(--tc-duration-slow) var(--tc-ease-move) both;
}
.ui-ans__action:nth-child(2) { animation-delay: 40ms; }
.ui-ans__action:nth-child(3) { animation-delay: var(--tc-duration-instant); }
.ui-ans__action:nth-child(4) { animation-delay: var(--tc-duration-quick); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__action:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
/* Pressed: the selected fill with a ≥ 3:1 ring, the accent, and (Standard) a filled glyph */
.ui-ans__action[aria-pressed="true"] { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 1px var(--tc-border-selected); color: var(--tc-accent-text); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__action[aria-pressed="true"] .ui-ans__glyph { fill: currentColor; fill-opacity: 0.16; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__glyph { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__action:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__glyph[data-solid] { fill: currentColor; stroke: none; }
.ui-ans__down .ui-ans__glyph { transform: scaleY(-1); }
.ui-ans__redo:active .ui-ans__glyph { transform: rotate(120deg); transition: transform var(--tc-duration-slow) var(--tc-ease-move); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__ok { stroke: var(--tc-status-success-solid) !important; stroke-width: 2.2 !important; animation: ui-ans-chip var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__status { font-size: var(--tc-font-size-sm); white-space: nowrap; color: var(--tc-text-muted); animation: ui-ans-fade var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__ok { color: var(--tc-status-success-fg); animation: ui-ans-chip var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__action:has(.ui-ans__ok) { color: var(--tc-status-success-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__status { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); white-space: nowrap; color: var(--tc-text-muted); animation: ui-ans-fade var(--tc-duration-moderate) var(--tc-ease-move) both; }
@container (max-width: 330px) {
  .ui-ans__status-lead { display: none; }
}
:where([data-look="standard"], [data-look="standard"] *).ui-ans__stop {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2);
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-control-px-md) 0 var(--tc-control-px-sm);
  border-radius: var(--tc-control-radius-sm);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  color: var(--tc-action-ghost-fg);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
  animation: ui-ans-fade var(--tc-duration-moderate) var(--tc-ease-move) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-ans__stop:hover { background: var(--tc-action-ghost-bg-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__stop-icon { width: 9px; height: 9px; border-radius: var(--tc-radius-2xs); background: var(--tc-text-primary); }
/* Stop: the white button with the hairline shadow */
:where([data-look="clean"], [data-look="clean"] *).ui-ans__stop {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-control-px-md) 0 var(--tc-control-px-sm);
  border-radius: var(--tc-control-radius-md);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  color: var(--tc-action-secondary-fg);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
  animation: ui-ans-fade var(--tc-duration-moderate) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ans__stop:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__stop-icon { width: 8px; height: 8px; margin: 0 var(--tc-space-0-5); border-radius: var(--tc-radius-2xs); background: var(--tc-text-primary); }
/* Reasons after a thumbs down fold out below */
.ui-ans__reasons { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-slow) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-ans__reasons[data-open="true"] { grid-template-rows: 1fr; opacity: 1; }
/* 4px of room above (taken back with the margin) so the outline and focus ring of the chips aren't cut off */
:where([data-look="standard"], [data-look="standard"] *).ui-ans__reasons > div { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); min-height: 0; overflow: hidden; margin-top: -4px; padding: var(--tc-space-1) var(--tc-space-1-5) 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__reasons[data-open="true"] > div { padding-bottom: var(--tc-space-2); }
/* Reasons: Button's secondary (small in Standard, the default size in Clean) */
.ui-ans__reasons button {
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-control-px-sm);
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  color: var(--tc-action-secondary-fg);
  transition: color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-ans__reasons button:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__reasons > div { display: flex; flex-wrap: wrap; gap: var(--tc-space-2); min-height: 0; overflow: hidden; margin-top: -4px; padding: var(--tc-space-1) var(--tc-space-3) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__reasons[data-open="true"] > div { padding-bottom: var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__reasons button { height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); }
/* Shine over the working label: a soft band (a mask) moves across by transform while the light copy of the text
   inside it moves back, so the letters stay put – composited, no repaint per frame */
.ui-ans__shine {
  position: absolute;
  inset: 0;
  pointer-events: none;
  -webkit-mask: linear-gradient(90deg, transparent 14%, #000 50%, transparent 86%);
  mask: linear-gradient(90deg, transparent 14%, #000 50%, transparent 86%);
  animation: ui-ans-shine var(--tc-duration-shimmer) linear infinite;
}
.ui-ans__shine > span { display: block; white-space: nowrap; color: var(--tc-ai-answer-shimmer); animation: ui-ans-shine-back var(--tc-duration-shimmer) linear infinite; }
/* Off-screen, the working animations pause */
[data-ui="ans"][data-offscreen] *, [data-ui="ans"][data-offscreen] *::after { animation-play-state: paused; }
@keyframes ui-ans-word { from { opacity: 0; filter: blur(3px); } to { opacity: 1; filter: none; } }
@keyframes ui-ans-card { from { opacity: 0; transform: translateY(6px) scale(0.96); } to { opacity: 1; transform: none; } }
@keyframes ui-ans-card-clean { from { opacity: 0; transform: translateY(4px) scale(0.97); } to { opacity: 1; transform: none; } }
@keyframes ui-ans-chip { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: none; } }
@keyframes ui-ans-fade { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }
@keyframes ui-ans-pop { from { opacity: 0; transform: translateY(-4px) scale(0.98); } to { opacity: 1; transform: none; } }
@keyframes ui-ans-pulse { 50% { transform: scale(0.6); opacity: 0.45; } }
@keyframes ui-ans-pulse-clean { 50% { opacity: 0.3; } }
@keyframes ui-ans-breathe { 50% { transform: scale(0.86); } }
@keyframes ui-ans-twinkle { 0%, 100% { opacity: 1; transform: none; } 50% { opacity: 0.3; transform: scale(0.6) rotate(45deg); } }
@keyframes ui-ans-shine { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
@keyframes ui-ans-shine-back { from { transform: translateX(100%); } to { transform: translateX(-100%); } }
/* Narrow (phones) */
@container (max-width: 480px) {
:where([data-look="standard"], [data-look="standard"] *).ui-ans__inner { padding: var(--tc-space-4-5) var(--tc-space-4-5) var(--tc-space-4); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__sources { margin: 0 -18px; padding: 0 var(--tc-space-4-5) var(--tc-space-0-5); scroll-padding: 0 18px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__source { width: 152px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__answer { font-size: var(--tc-font-size-lg); }
}
/* Touch screens: bigger tap targets – the citation chips keep their size but get a larger invisible hit area */
@media (hover: none) and (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-ans__action { width: 40px; height: 40px; border-radius: var(--tc-radius-lg); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__foot { height: 48px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__stop { height: 36px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__reasons button { height: 36px; padding: 0 var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__follow-item { min-height: 46px; }
.ui-ans__cite { position: relative; }
.ui-ans__cite::after { content: ""; position: absolute; inset: -10px -4px; }
}
/* Narrow (phones) */
@container (max-width: 480px) {
:where([data-look="clean"], [data-look="clean"] *).ui-ans__inner { padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__sources { margin: 0 -16px; padding: var(--tc-space-0-5) var(--tc-space-4) var(--tc-space-1); scroll-padding: 0 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__source { width: 150px; }
}
/* Touch screens: bigger tap targets – the citation chips keep their size but get a larger invisible hit area */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-ans__action { width: 36px; height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__foot { height: 52px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__stop { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__reasons button { height: 34px; padding: 0 var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__follow-item { min-height: 44px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="ans"] *, [data-ui="ans"] *::before, [data-ui="ans"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-ai-answer")) customElements.define("tc-ai-answer", TcAiAnswer);

declare global {
  interface HTMLElementTagNameMap {
    "tc-ai-answer": TcAiAnswer;
  }
}
