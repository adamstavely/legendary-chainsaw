"use client";

/*
 * AI Answer – an assistant's answer with its sources, in a single self-contained file.
 * The sources pop in first, then the answer streams in word by word with citation chips.
 * Hovering a chip previews its source and lights up the matching card above (and the other way round).
 * When it's done: copy, regenerate, thumbs up / down with a reason, and follow-up questions.
 * The answer is plain text: blank lines make paragraphs, "- " makes a list, **bold**, [1] or [1,3] cite sources.
 * `feedback` (the thumbs and the reason) is controlled when defined, otherwise uncontrolled from `defaultFeedback`;
 * changes are reported through onFeedbackChange (and onFeedback, as before). onRegenerate may return a promise – a
 * rejection is shown in the last row. Other DOM props and `ref` go to the root.
 * The styles are injected below, so no extra files are needed.
 * Two looks, picked with the `look` prop (the default comes from the file: ai-answer.tsx is Standard,
 * ai-answer-clean.tsx is Clean). Clean has no tray – one white card with hairline shadows that also holds the last
 * row (stop, actions, feedback reasons) under a hairline, so only the content above it glides to its new height. Its
 * type is a quiet gray, its icons are 16px solid glyphs, and the mark is a blue sparkle that only animates while it works.
 */
// Generated from src/components/ai-answer.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentPropsWithoutRef, type ReactNode, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-ans";

export type AnswerSource = {
  /** Headline of the page, message or document */
  title: string;
  /** Short name shown on the citation chip, e.g. "Notion" */
  name: string;
  /** Opens in a new tab */
  href?: string;
  /** A favicon or logo, ideally square */
  icon?: ReactNode;
  /** The passage the answer relies on – shown in the preview */
  snippet?: string;
};

/** The reader's verdict: a thumb, and for a thumbs down the reason picked */
export type AnswerFeedback = { value: "up" | "down"; reason?: string };

type AIAnswerOwnProps = {
  /** Visual style. Defaults to the file's look: Standard in ai-answer.tsx, Clean in ai-answer-clean.tsx */
  look?: Look;
  /** The question above the answer */
  question?: string;
  sources: AnswerSource[];
  /** The answer text – may grow while `streaming` is true */
  answer: string;
  /** More text is still coming from your model, keep the cursor going */
  streaming?: boolean;
  /** Stream the text in; false shows it at once */
  animate?: boolean;
  /** Words per second while streaming in */
  speed?: number;
  followUps?: string[];
  onFollowUp?: (question: string) => void;
  /** May return a promise – a rejection shows in the last row, and Regenerate can be tried again */
  onRegenerate?: () => void | Promise<unknown>;
  onStop?: () => void;
  /** A thumb up, or a thumbs down once its reason is picked */
  onFeedback?: (value: "up" | "down", reason?: string) => void;
  /** The verdict shown – controlled when defined (null: none) */
  feedback?: AnswerFeedback | null;
  defaultFeedback?: AnswerFeedback | null;
  /** Every change of the verdict, including clearing it and a new answer starting over */
  onFeedbackChange?: (feedback: AnswerFeedback | null) => void;
  /** Reasons offered after a thumbs down */
  feedbackReasons?: string[];
  onCopy?: (text: string) => void;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export type AIAnswerProps = Omit<ComponentPropsWithoutRef<"div">, keyof AIAnswerOwnProps> & AIAnswerOwnProps;

type Token = { i: number; kind: "word"; text: string; bold?: boolean } | { i: number; kind: "cite"; ids: number[] };
type Block = { kind: "p"; tokens: Token[] } | { kind: "ul"; items: Token[][] };
type Phase = "reading" | "writing" | "done" | "stopped";

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
    if (lines.every((l) => /^\s*[-*]\s/.test(l))) {
      blocks.push({ kind: "ul", items: lines.map((l) => line(l.replace(/^\s*[-*]\s/, ""))) });
    } else {
      blocks.push({ kind: "p", tokens: line(lines.join(" ")) });
    }
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

/* ---------- Icons ---------- */

/** Standard: 24px outlined icons. Clean: 16px, thin 1px lines and solid shapes */
const Glyph = ({ d, solid, look, className }: { d: string; solid?: boolean; look: Look; className?: string }) => (
  <svg
    viewBox={look === "clean" ? "0 0 16 16" : "0 0 24 24"}
    className={["ui-ans__glyph", className].filter(Boolean).join(" ")}
    data-solid={(look === "clean" && solid) || undefined}
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);
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
 * Standard's assistant: a small blue cloud with a soft white glow along the inside of its edge, a thin light blue outline and two white eyes.
 * The eyes scan the sources while reading, follow the text while writing, and look around, blink and wink once done.
 */
function CloudMark() {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ref = (name: string) => `ans${id}-${name}`;
  const shape = (
    <>
      {PUFFS.map((p, i) => (
        <circle key={i} {...p} />
      ))}
      <rect {...CORE} />
    </>
  );
  const eye = (x: number, right?: boolean) => (
    <g className={right ? "ui-ans__eye ui-ans__eye-r" : "ui-ans__eye"}>
      <rect x={x} y="106" width="18" height="31" rx="9" fill={`url(#${ref("eye")})`} />
      <rect x={x} y="108.5" width="18" height="31" rx="9" fill="none" className="ui-ans__mark-eye-shade" strokeWidth="5" filter={`url(#${ref("blur-s")})`} clipPath={`url(#${ref(right ? "clip-r" : "clip-l")})`} />
    </g>
  );
  return (
    <svg viewBox="30 40 180 160" className="ui-ans__mark" aria-hidden="true">
      <defs>
        <filter id={ref("goo")} x="0" y="0" width="240" height="240" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="3.5" />
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 28 -12" />
        </filter>
        {/* Inner glow: white where the shape is close to its edge, fading towards the middle */}
        <filter id={ref("inner")} x="0" y="0" width="240" height="240" filterUnits="userSpaceOnUse">
          <feGaussianBlur in="SourceAlpha" stdDeviation="15" result="soft" />
          <feComposite in="SourceAlpha" in2="soft" operator="out" result="rim" />
          <feFlood style={{ floodColor: "var(--tc-ai-answer-mark-glow)" }} />
          <feComposite in2="rim" operator="in" />
        </filter>
        <filter id={ref("blur-s")} x="0" y="0" width="240" height="240" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="2" />
        </filter>
        {/* Grows the shape by about a pixel: a thin outline, so the cloud doesn't melt into a white card */}
        <filter id={ref("outline")} x="0" y="0" width="240" height="240" filterUnits="userSpaceOnUse">
          <feMorphology operator="dilate" radius="6" />
          <feGaussianBlur stdDeviation="0.8" />
        </filter>
        <g id={ref("shape")} filter={`url(#${ref("goo")})`}>
          {shape}
        </g>
        <mask id={ref("mask")} maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="240">
          <use href={`#${ref("shape")}`} fill="#fff" />
        </mask>
        <linearGradient id={ref("body")} x1="0" y1="50" x2="0" y2="192" gradientUnits="userSpaceOnUse">
          <stop offset="0" style={{ stopColor: "var(--tc-ai-answer-mark-top)" }} />
          <stop offset="1" style={{ stopColor: "var(--tc-ai-answer-mark-bottom)" }} />
        </linearGradient>
        <linearGradient id={ref("eye")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "var(--tc-ai-answer-mark-eye-top)" }} />
          <stop offset="1" style={{ stopColor: "var(--tc-ai-answer-mark-eye-bottom)" }} />
        </linearGradient>
        <clipPath id={ref("clip-l")}>
          <rect x="96.5" y="106" width="18" height="31" rx="9" />
        </clipPath>
        <clipPath id={ref("clip-r")}>
          <rect x="127.5" y="106" width="18" height="31" rx="9" />
        </clipPath>
      </defs>
      <use href={`#${ref("shape")}`} className="ui-ans__mark-edge" filter={`url(#${ref("outline")})`} />
      <g mask={`url(#${ref("mask")})`}>
        {/* Light blue at the top, deeper blue at the bottom, a white glow just inside the edge */}
        <rect x="0" y="0" width="240" height="240" fill={`url(#${ref("body")})`} />
        <use href={`#${ref("shape")}`} filter={`url(#${ref("inner")})`} />
      </g>
      <g className="ui-ans__eyes">
        {eye(96.5)}
        {eye(127.5, true)}
      </g>
    </svg>
  );
}

const READ_MS = 700;
const CARD_MS = 90;
/** New words are shown in batches at most this often – about two at a time at the default speed, each still fading in on its own */
const REVEAL_MS = 50;

/** Clean's assistant: a solid blue sparkle with a small one beside it – while it works the small one twinkles and the big one breathes */
function SparkleMark() {
  return (
    <svg viewBox="0 0 16 16" className="ui-ans__mark" aria-hidden="true">
      <path className="ui-ans__mark-big" d="M6.5 2.2c.2 0 .36.14.4.33.53 2.6 1.4 3.48 4 4.02a.4.4 0 0 1 0 .79c-2.6.53-3.47 1.4-4 4a.4.4 0 0 1-.8 0c-.53-2.6-1.4-3.47-4-4a.4.4 0 0 1 0-.79c2.6-.54 3.47-1.42 4-4.02a.4.4 0 0 1 .4-.33Z" />
      <path className="ui-ans__mark-small" d="M12 9.6c.12 0 .22.08.25.2.28 1.3.72 1.75 2.03 2.03a.25.25 0 0 1 0 .49c-1.31.28-1.75.72-2.03 2.03a.25.25 0 0 1-.5 0c-.28-1.31-.72-1.75-2.03-2.03a.25.25 0 0 1 0-.49c1.31-.28 1.75-.73 2.03-2.03a.25.25 0 0 1 .25-.2Z" />
    </svg>
  );
}

/* ---------- Typing: which words are shown lives in the DOM, React only hears about new paragraphs ---------- */

type Pop = { ids: number[]; left: number; top: number; width: number };

/** Where each paragraph and list item starts, in order – the only steps of the typing React has to render */
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
function paint(box: HTMLElement | null, shown: number) {
  box?.querySelectorAll<HTMLElement>("[data-i]").forEach((el) => {
    const i = Number(el.dataset.i);
    if (i < shown !== el.hasAttribute("data-on")) el.toggleAttribute("data-on", i < shown);
    if ((i === shown - 1) !== el.hasAttribute("data-caret")) el.toggleAttribute("data-caret", i === shown - 1);
  });
}

/**
 * The words revealed so far. `show(n)` writes them straight to the answer's DOM; the returned `visible` – what React
 * renders – only changes when a new paragraph or list item begins, so typing doesn't re-render per batch of words.
 */
function useReveal(boxRef: { current: HTMLElement | null }, blocks: Block[]) {
  const starts = useMemo(() => blockStarts(blocks), [blocks]);
  const [visible, setVisible] = useState(0);
  const shown = useRef(0);
  const visibleRef = useRef(0);
  const startsRef = useRef(starts);
  const show = useCallback(
    (n: number) => {
      if (n !== shown.current) {
        shown.current = n;
        paint(boxRef.current, n);
      }
      const edge = edgeOf(startsRef.current, n);
      if (edge !== visibleRef.current) {
        visibleRef.current = edge;
        setVisible(edge);
      }
    },
    [boxRef],
  );
  // New text may regroup the paragraphs; newly rendered words start hidden until painted
  useLayoutEffect(() => {
    startsRef.current = starts;
    paint(boxRef.current, shown.current);
    const edge = edgeOf(starts, shown.current);
    if (edge !== visibleRef.current) {
      visibleRef.current = edge;
      setVisible(edge);
    }
  }, [boxRef, starts, visible]);
  return { visible, show };
}

/* ---------- Pieces of the answer ---------- */

function SourceCards({
  sources,
  run,
  instant,
  lit,
  onHover,
}: {
  sources: AnswerSource[];
  run: number;
  instant: boolean;
  lit: Set<number>;
  onHover: (i: number | null) => void;
}) {
  if (!sources.length) return null;
  return (
    <div className="ui-ans__sources" key={`s${run}`} aria-label="Sources" role="list">
      {sources.map((s, i) => {
        const inner = (
          <>
            <span className="ui-ans__site">
              {s.icon && <span className="ui-ans__favicon">{s.icon}</span>}
              <span className="ui-ans__site-name">{s.name}</span>
              <span className="ui-ans__num">{i + 1}</span>
            </span>
            <span className="ui-ans__title">{s.title}</span>
          </>
        );
        const props = {
          className: "ui-ans__source",
          "data-lit": lit.has(i) || undefined,
          style: { animationDelay: instant ? "0ms" : `${120 + i * CARD_MS}ms` },
          onMouseEnter: () => onHover(i),
          onMouseLeave: () => onHover(null),
        };
        return (
          <div key={i} role="listitem" className="ui-ans__source-wrap">
            {s.href ? (
              <a {...props} href={s.href} target="_blank" rel="noreferrer">
                {inner}
              </a>
            ) : (
              <div {...props}>{inner}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

type ChipHandlers = {
  pop: Pop | null;
  popId: string;
  lit: Set<number>;
  openPop: (ids: number[], el: HTMLElement) => void;
  closePop: () => void;
  setPop: (pop: Pop | null) => void;
};

/** A run of words and citation chips; all of them are rendered, the typing shows them (see useReveal) */
function Tokens({ tokens, sources, chips }: { tokens: Token[]; sources: AnswerSource[]; chips: ChipHandlers }) {
  const { pop, popId, lit, openPop, closePop, setPop } = chips;
  return tokens.map((t) => {
    if (t.kind === "word") {
      return (
        <span key={t.i} className="ui-ans__w" data-i={t.i} data-bold={t.bold || undefined}>
          {t.text}
        </span>
      );
    }
    const first = sources[t.ids[0]];
    return (
      <span key={t.i} className="ui-ans__w" data-i={t.i}>
        <button
          type="button"
          className="ui-ans__cite"
          data-lit={t.ids.some((id) => lit.has(id)) || undefined}
          aria-describedby={pop && pop.ids === t.ids ? popId : undefined}
          onMouseEnter={(e) => openPop(t.ids, e.currentTarget)}
          onMouseLeave={closePop}
          onFocus={(e) => openPop(t.ids, e.currentTarget)}
          onBlur={closePop}
          onClick={(e) => (pop?.ids === t.ids ? setPop(null) : openPop(t.ids, e.currentTarget))}
          onKeyDown={(e) => e.key === "Escape" && setPop(null)}
        >
          {first.name}
          {t.ids.length > 1 && <span className="ui-ans__more">+{t.ids.length - 1}</span>}
          {/* The name starts with what the chip shows (WCAG 2.5.3); the titles follow for screen readers */}
          <span className="ui-ans__sr">{` – ${t.ids.map((id) => sources[id].title).join("; ")}`}</span>
        </button>
      </span>
    );
  });
}

const firstIndex = (b: Block) => (b.kind === "p" ? b.tokens[0]?.i : b.items[0]?.[0]?.i) ?? Infinity;

function AnswerText({
  boxRef,
  blocks,
  visible,
  phase,
  run,
  sources,
  chips,
}: {
  boxRef: { current: HTMLDivElement | null };
  blocks: Block[];
  visible: number;
  phase: Phase;
  run: number;
  sources: AnswerSource[];
  chips: ChipHandlers;
}) {
  const finished = phase === "done" || phase === "stopped";
  return (
    <div ref={boxRef} className="ui-ans__answer" aria-busy={!finished}>
      {phase === "writing" && visible === 0 && (
        <p>
          <span className="ui-ans__caret" aria-hidden="true" />
        </p>
      )}
      {phase === "stopped" && visible === 0 && <p className="ui-ans__empty">Stopped before answering.</p>}
      {blocks.map((b, bi) =>
        firstIndex(b) >= visible ? null : b.kind === "p" ? (
          <p key={`${run}-${bi}`}>
            <Tokens tokens={b.tokens} sources={sources} chips={chips} />
          </p>
        ) : (
          <ul key={`${run}-${bi}`}>
            {b.items.map((item, ii) =>
              item[0] && item[0].i < visible ? (
                <li key={ii}>
                  <Tokens tokens={item} sources={sources} chips={chips} />
                </li>
              ) : null,
            )}
          </ul>
        ),
      )}
    </div>
  );
}

function AnswerFooter({
  look,
  finished,
  copied,
  vote,
  reason,
  status,
  feedbackReasons,
  onCopy,
  onRegenerate,
  onVote,
  onReason,
  onStop,
}: {
  look: Look;
  finished: boolean;
  copied: boolean;
  vote: "up" | "down" | null;
  reason: string | null;
  status: string;
  feedbackReasons: string[];
  onCopy: () => void;
  onRegenerate: () => void;
  onVote: (value: "up" | "down") => void;
  onReason: (reason: string) => void;
  onStop: () => void;
}) {
  const icons = look === "clean" ? cleanIcons : standardIcons;
  return (
    <>
      {/* Stop while writing, actions once done – Standard: on the tray below the card, Clean: the card's last row */}
      <div className="ui-ans__foot">
        {finished ? (
          <div className="ui-ans__actions" key="actions">
            <button type="button" className="ui-ans__action" aria-label={copied ? "Copied" : "Copy answer"} onClick={onCopy}>
              <Glyph d={copied ? icons.check : icons.copy} solid look={look} className={copied ? "ui-ans__ok" : undefined} />
            </button>
            <button type="button" className="ui-ans__action ui-ans__redo" aria-label="Regenerate" onClick={onRegenerate}>
              <Glyph d={icons.redo} look={look} />
            </button>
            <button type="button" className="ui-ans__action" aria-label="Good answer" aria-pressed={vote === "up"} onClick={() => onVote("up")}>
              <Glyph d={icons.thumb} solid look={look} />
            </button>
            <button
              type="button"
              className="ui-ans__action ui-ans__down"
              aria-label="Bad answer"
              aria-pressed={vote === "down"}
              onClick={() => onVote("down")}
            >
              <Glyph d={icons.thumb} solid look={look} />
            </button>
          </div>
        ) : (
          <button type="button" className="ui-ans__stop" key="stop" data-focus-key="stop" onClick={onStop}>
            <span className="ui-ans__stop-icon" aria-hidden="true" />
            Stop
          </button>
        )}
        {finished && (
          // Shown here, announced by the persistent status region at the root
          <span className="ui-ans__status" key={status} aria-hidden="true">
            {status.startsWith("Answered in ") ? (
              <>
                {/* Very narrow screens show just the time */}
                <span className="ui-ans__status-lead">Answered in </span>
                {status.slice("Answered in ".length)}
              </>
            ) : (
              status
            )}
          </span>
        )}
      </div>

      {/* Folded away it is inert – out of the tab order and the accessibility tree (WCAG 2.4.3, 4.1.2) */}
      <div className="ui-ans__reasons" data-open={vote === "down" && !reason} inert={!(vote === "down" && !reason)}>
        <div>
          {feedbackReasons.map((r) => (
            <button key={r} type="button" onClick={() => onReason(r)}>
              {r}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/** One preview for whichever chip is hovered or focused */
function SourcePreview({
  pop,
  popId,
  sources,
  onEnter,
  onLeave,
}: {
  pop: Pop;
  popId: string;
  sources: AnswerSource[];
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <div
      id={popId}
      role="tooltip"
      className="ui-ans__pop"
      style={{ left: pop.left, top: pop.top, width: pop.width }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {pop.ids.map((id) => {
        const s = sources[id];
        return (
          <a key={id} className="ui-ans__pop-item" href={s.href} target="_blank" rel="noreferrer" tabIndex={-1}>
            <span className="ui-ans__site">
              {s.icon && <span className="ui-ans__favicon">{s.icon}</span>}
              <span className="ui-ans__site-name">{s.href ? s.href.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] : s.name}</span>
              <span className="ui-ans__num">{id + 1}</span>
            </span>
            <span className="ui-ans__pop-title">{s.title}</span>
            {s.snippet && pop.ids.length === 1 && <span className="ui-ans__snippet">{s.snippet}</span>}
          </a>
        );
      })}
    </div>
  );
}

/** "Related" questions, once the answer is done */
function FollowUps({ questions, instant, look, onPick }: { questions: string[]; instant: boolean; look: Look; onPick?: (q: string) => void }) {
  if (!questions.length) return null;
  const icons = look === "clean" ? cleanIcons : standardIcons;
  return (
    <div className="ui-ans__follow">
      <span className="ui-ans__follow-label">Related</span>
      {questions.map((q, i) => (
        <button
          key={q}
          type="button"
          className="ui-ans__follow-item"
          style={{ animationDelay: `${instant ? 0 : 80 + i * 60}ms` }}
          onClick={() => onPick?.(q)}
        >
          <span>{q}</span>
          <Glyph d={icons.arrow} solid look={look} />
        </button>
      ))}
    </div>
  );
}

export function AIAnswer({
  look,
  question,
  sources,
  answer,
  streaming = false,
  animate = true,
  speed = 38,
  followUps = [],
  onFollowUp,
  onRegenerate,
  onStop,
  onFeedback,
  feedback: feedbackProp,
  defaultFeedback = null,
  onFeedbackChange,
  feedbackReasons = ["Not accurate", "Wrong source", "Too long", "Out of date"],
  onCopy,
  className,
  ref,
  onMouseLeave,
  ...rest
}: AIAnswerProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const clean = resolvedLook === "clean";
  const { blocks, total } = useMemo(() => parse(answer, sources.length), [answer, sources.length]);
  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState<Phase>("reading");
  const [seconds, setSeconds] = useState(0);
  const [feedback, setFeedback] = useControllable<AnswerFeedback | null>(feedbackProp, defaultFeedback, onFeedbackChange, "feedback");
  const vote = feedback?.value ?? null;
  const reason = feedback?.reason ?? null;
  const [failed, setFailed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pop, setPop] = useState<Pop | null>(null);
  const [hoverSource, setHoverSource] = useState<number | null>(null);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const setRoot = useRootRef(rootRef, ref);
  // The working animations (label shine, mascot) pause while the answer is off-screen
  const onScreen = useOnScreen(rootRef);
  // Focus never drops to <body> (WCAG 2.4.3): Stop gives way to the actions (focus goes to Copy), the folded reasons
  // send it back to Bad answer, a follow-up's new run sends it to Stop
  useFocusRescue(rootRef, {
    fallback: (key) => {
      const root = rootRef.current;
      const first = root?.querySelector<HTMLElement>(".ui-ans__action");
      return (key === "stop" ? first : null) ?? root?.querySelector<HTMLElement>(".ui-ans__down") ?? first ?? root?.querySelector<HTMLElement>(".ui-ans__stop");
    },
  });
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  // The run the verdict belongs to – a new run clears it, the first one keeps what was passed in
  const feedbackRun = useRef(run);
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLDivElement | null>(null);
  const { visible, show } = useReveal(answerRef, blocks);
  const progress = useRef(0);
  const started = useRef(0);
  const prevAnswer = useRef(answer);
  const closeTimer = useRef(0);
  const popId = useId();

  const finished = phase === "done" || phase === "stopped";
  const instant = !animate || reducedMotion();

  // A new answer (not just more of the same one) starts over; more of the same one after it finished – e.g. one that
  // started out empty – is written on rather than left unshown
  useEffect(() => {
    if (!answer.startsWith(prevAnswer.current)) {
      setRun((r) => r + 1);
      setFailed(null);
    }
    else if (phase === "done" && progress.current < total) {
      if (instant) progress.current = Infinity;
      setPhase("writing");
    }
    prevAnswer.current = answer;
  }, [answer]); // eslint-disable-line react-hooks/exhaustive-deps -- runs for new text only; phase and total are read as they are then

  // Each run: read the sources, then write
  useEffect(() => {
    started.current = performance.now();
    progress.current = 0;
    show(0);
    if (feedbackRun.current !== run) {
      feedbackRun.current = run;
      setFeedback(null);
    }
    setCopied(false);
    setPop(null);
    if (instant) {
      progress.current = Infinity;
      setPhase("writing");
      return;
    }
    setPhase("reading");
    const t = window.setTimeout(() => setPhase("writing"), sources.length ? READ_MS + sources.length * CARD_MS : 0);
    return () => clearTimeout(t);
  }, [run]); // eslint-disable-line react-hooks/exhaustive-deps

  // Writing: words appear at `speed`; waits for more text while `streaming`
  useEffect(() => {
    if (phase !== "writing") return;
    let frame = 0;
    let last = performance.now();
    let revealed = last;
    const tick = (now: number) => {
      progress.current = Math.min(total, progress.current + ((now - last) / 1000) * speed);
      last = now;
      // A batch of words every REVEAL_MS at most, and right away for the last one – written to the DOM, not rendered
      if (now - revealed >= REVEAL_MS || progress.current >= total) {
        revealed = now;
        show(Math.floor(progress.current));
      }
      if (progress.current >= total) {
        // Caught up: done, or – while more text is streaming in – idle until it arrives (this effect re-runs on `total`)
        if (!streaming) {
          setSeconds(Math.max(0.1, Math.round((performance.now() - started.current) / 100) / 10));
          setPhase("done");
        }
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase, total, streaming, speed, show]);

  // The card glides to its new height instead of jumping (Clean: only the content above the last row)
  useLayoutEffect(() => {
    const card = cardRef.current;
    const inner = innerRef.current;
    if (!card || !inner) return;
    const set = () => (card.style.height = `${inner.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [clean]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  const openPop = (ids: number[], el: HTMLElement) => {
    clearTimeout(closeTimer.current);
    const root = rootRef.current;
    if (!root) return;
    const box = root.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const width = Math.min(300, box.width - 16);
    const left = Math.max(8, Math.min(box.width - width - 8, r.left - box.left + r.width / 2 - width / 2));
    setPop({ ids, left, top: r.bottom - box.top + 6, width });
  };
  const closePop = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setPop(null), 140);
  };
  // Esc closes the preview wherever focus is, without moving it (WCAG 1.4.13)
  const popOpen = pop !== null;
  useEffect(() => {
    if (!popOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPop(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [popOpen]);

  const lit = new Set(pop ? pop.ids : hoverSource !== null ? [hoverSource] : []);

  const copy = () => {
    const text = plain(answer, sources);
    // "Copied" only once the text is on the clipboard – not when there's no clipboard or the browser refuses
    if (!navigator.clipboard?.writeText) return;
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        onCopy?.(text);
      },
      () => {},
    );
  };
  const stop = () => {
    setSeconds(Math.max(0.1, Math.round((performance.now() - started.current) / 100) / 10));
    setPhase("stopped");
    onStop?.();
  };
  const regenerate = () => {
    setRun((r) => r + 1);
    setFailed(null);
    let work: unknown;
    try {
      work = onRegenerate?.();
    } catch (e) {
      setFailed(messageOf(e));
      return;
    }
    if (work && typeof (work as Promise<unknown>).then === "function")
      (work as Promise<unknown>).then(undefined, (e: unknown) => alive.current && setFailed(messageOf(e)));
  };
  const voteFor = (value: "up" | "down") => {
    const next = vote === value ? null : value;
    setFeedback(next ? { value: next } : null);
    if (next === "up") onFeedback?.("up");
  };
  const pickReason = (r: string) => {
    // The reasons fold away: focus goes back to Bad answer first
    rescueFocus(rootRef.current?.querySelector(".ui-ans__reasons"), [rootRef.current?.querySelector(".ui-ans__down")]);
    setFeedback({ value: "down", reason: r });
    onFeedback?.("down", r);
  };

  const status = copied
    ? "Copied"
    : failed
      ? `Couldn't regenerate: ${failed}`
    : vote === "up" || reason
      ? "Thanks for the feedback"
      : vote === "down"
        ? "What went wrong?"
        : phase === "stopped"
          ? "Stopped"
          : `Answered in ${seconds}s`;

  const label =
    phase === "reading" ? `Reading ${sources.length} sources` : phase === "writing" ? "Writing" : "Answer";

  const chips: ChipHandlers = { pop, popId, lit, openPop, closePop, setPop };

  // The answer itself; Standard's card is just this, Clean's card also holds the last row under a hairline
  const content = (
    <div ref={innerRef} className="ui-ans__inner">
      {question && <h3 className="ui-ans__question">{question}</h3>}

      <SourceCards sources={sources} run={run} instant={instant} lit={lit} onHover={setHoverSource} />

      <div className="ui-ans__label">
        {clean ? <SparkleMark /> : <CloudMark />}
        <span key={label} className="ui-ans__label-text">
          {label}
          {!finished && (
            <span className="ui-ans__shine" aria-hidden="true">
              <span>{label}</span>
            </span>
          )}
        </span>
      </div>

      <AnswerText boxRef={answerRef} blocks={blocks} visible={visible} phase={phase} run={run} sources={sources} chips={chips} />

      {phase === "done" && <FollowUps questions={followUps} instant={instant} look={resolvedLook} onPick={onFollowUp} />}
    </div>
  );
  const footer = (
    <AnswerFooter
      look={resolvedLook}
      finished={finished}
      copied={copied}
      vote={vote}
      reason={reason}
      status={status}
      feedbackReasons={feedbackReasons}
      onCopy={copy}
      onRegenerate={regenerate}
      onVote={voteFor}
      onReason={pickReason}
      onStop={stop}
    />
  );

  return (
    <div
      {...rest}
      ref={setRoot}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={resolvedLook}
      data-phase={phase}
      data-offscreen={onScreen ? undefined : ""}
      onMouseLeave={(e) => {
        onMouseLeave?.(e);
        setHoverSource(null);
      }}
    >
      {/* React 19 hoists this into <head> once, no matter how many answers render */}
      <style href="ui-ai-answer" precedence="default">
        {css}
      </style>

      {clean ? (
        <div className="ui-ans__card">
          {/* Only the content glides to its new height – the last row below always stays in view */}
          <div ref={cardRef} className="ui-ans__body">
            {content}
          </div>
          {footer}
        </div>
      ) : (
        <>
          <div ref={cardRef} className="ui-ans__card">
            {content}
          </div>
          {footer}
        </>
      )}

      {/* Mounted from the start, so "Answered in …", "Copied", "Stopped" and errors are announced (WCAG 4.1.3) */}
      <span className="ui-ans__sr" role="status">
        {finished && !failed ? status : ""}
      </span>
      <span className="ui-ans__sr" role="alert">
        {finished && failed ? status : ""}
      </span>

      {pop && <SourcePreview pop={pop} popId={popId} sources={sources} onEnter={() => clearTimeout(closeTimer.current)} onLeave={closePop} />}
    </div>
  );
}

/* ---------- Shared helpers (inlined from src/internal) ---------- */

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Written as the literal `process.env.NODE_ENV` so bundlers replace it and production builds skip the warning;
// without a bundler `process` doesn't exist and the warning stays off
declare const process: { env: { NODE_ENV?: string } };
const DEV = (() => {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
})();

/**
 * State that a parent may control. `value` defined → controlled: the component shows `value` and only asks for
 * changes through `onChange`. `value` undefined → uncontrolled: the component keeps its own state, starting at
 * `defaultValue`, and still reports changes. Whether `onChange` is passed never decides which – passing a callback
 * for analytics must not freeze the component.
 */
function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void, name?: string) {
  const controlled = value !== undefined;
  // Like React's <input value> without onChange: a controlled value nobody can change is almost always a
  // starting value passed to the wrong prop, so say so once (in development)
  const warned = useRef(false);
  if (controlled && !onChange && !warned.current && DEV) {
    warned.current = true;
    console.warn(
      `Trenchcoat: ${name ? `\`${name}\`` : "a value prop"} is set without its change handler, so it can't change. ` +
        "Pass the handler to control it, or use the default… prop for a starting value.",
    );
  }
  const [own, setOwn] = useState(defaultValue);
  const current = controlled ? value : own;
  // Read through refs so the setter is stable and never acts on a stale value
  const latest = useRef(current);
  latest.current = current;
  const report = useRef(onChange);
  report.current = onChange;
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(latest.current) : next;
      if (Object.is(resolved, latest.current)) return;
      if (!controlled) setOwn(resolved);
      latest.current = resolved;
      report.current?.(resolved);
    },
    [controlled],
  );
  return [current, set] as const;
}

/** Connected, not inside something inert or hidden, not disabled */
const focusable = (el: Element | null | undefined): boolean =>
  !!el && el.isConnected && el instanceof HTMLElement && !el.closest("[inert],[hidden]") && !(el as HTMLButtonElement).disabled;

/**
 * Moves focus to the first usable target, but only if focus is inside `from` now (call it before removing, disabling
 * or inerting `from`). Targets may be elements, selectors (looked up inside `within`, default document) or functions.
 */
function rescueFocus(
  from: Element | null | undefined,
  targets: Array<Element | string | null | undefined | (() => Element | null | undefined)>,
  within: ParentNode = document,
) {
  const active = document.activeElement;
  if (!from || !active || !from.contains(active)) return false;
  for (const t of targets) {
    const el = typeof t === "function" ? t() : typeof t === "string" ? within.querySelector(t) : t;
    if (el !== active && focusable(el)) {
      (el as HTMLElement).focus({ preventScroll: true });
      return true;
    }
  }
  return false;
}

type Options = {
  /** Where focus goes when the control it was on is gone – gets that control's `data-focus-key` (if it had one) */
  fallback?: (key: string | null) => Element | null | undefined;
};

/**
 * Safety net for a component's root: when the focused element inside it is removed, disabled or made inert and
 * focus fell to <body>, focus moves (before paint) to
 *   1. an element with the same `data-focus-key` (the control was re-mounted, e.g. a card moved to another list),
 *   2. `fallback(key)`, e.g. the next row or the trigger,
 *   3. the root itself (made focusable with tabindex=-1 if it isn't).
 * Prefer moving focus explicitly with rescueFocus where the right target is known; this catches the rest.
 */
function useFocusRescue(root: RefObject<HTMLElement | null>, options: Options = {}) {
  const latest = useRef(options);
  latest.current = options;
  useEffect(() => {
    const el = root.current;
    if (!el || typeof MutationObserver !== "function") return;
    let last: HTMLElement | null = null;
    const onFocusIn = (e: FocusEvent) => {
      last = e.target instanceof HTMLElement ? e.target : null;
    };
    const check = () => {
      const prev = last;
      if (!prev || !el.isConnected) return;
      const gone = !focusable(prev);
      const active = document.activeElement;
      const lost = !active || active === document.body || active === prev;
      if (!lost || !gone) return;
      const key = prev.getAttribute("data-focus-key");
      const same = key ? [...el.querySelectorAll(`[data-focus-key="${CSS.escape(key)}"]`)].find((c) => c !== prev && focusable(c)) : null;
      const target = [same, latest.current.fallback?.(key)].find(focusable) as HTMLElement | undefined;
      last = null;
      if (target) target.focus({ preventScroll: true });
      else {
        if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
        el.focus({ preventScroll: true });
      }
    };
    const observer = new MutationObserver(check);
    observer.observe(el, { subtree: true, childList: true, attributes: true, attributeFilter: ["disabled", "inert", "hidden"] });
    el.addEventListener("focusin", onFocusIn);
    return () => {
      observer.disconnect();
      el.removeEventListener("focusin", onFocusIn);
    };
  }, [root]);
}

/** True while `ref`'s element intersects the viewport and the tab is visible. Starts true; renders only on a change */
function useOnScreen(ref: RefObject<Element | null>) {
  const [onScreen, setOnScreen] = useState(true);
  useEffect(() => {
    const el = ref.current;
    let inView = true;
    let last = true;
    // Only a real change is set: the observer's first report (visible) costs no render
    const update = () => {
      const next = inView && document.visibilityState !== "hidden";
      if (next !== last) setOnScreen((last = next));
    };
    const io =
      el && typeof IntersectionObserver === "function"
        ? new IntersectionObserver((entries) => {
            inView = entries[entries.length - 1].isIntersecting;
            update();
          })
        : null;
    if (el) io?.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io?.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, [ref]);
  return onScreen;
}

/** A ref callback that fills `own` and the caller's ref (object or callback, incl. React 19 cleanups) */
function useRootRef<T>(own: { current: T | null }, ref: Ref<T> | undefined) {
  return useCallback(
    (el: T | null) => {
      own.current = el;
      const cleanup = typeof ref === "function" ? ref(el) : (ref && (ref.current = el), undefined);
      return () => {
        own.current = null;
        if (typeof cleanup === "function") cleanup();
        else if (typeof ref === "function") ref(null);
        else if (ref) ref.current = null;
      };
    },
    [own, ref],
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-ans:where([data-look="standard"]),
.ui-ans__portal:where([data-look="standard"]) {
  --_tc-accent: #2f68ff;
  --_tc-accent-text: light-dark(#2456d6, #8ab4ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-action-ghost-fg: light-dark(#404040, #c8c8cc);
  --_tc-action-secondary-bg: light-dark(#ffffff, #232326);
  --_tc-action-secondary-fg: light-dark(#171717, #ededed);
  --_tc-action-secondary-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-border-selected: light-dark(#2f68ff, #6b95ff);
  --_tc-caption-color: light-dark(#646464, #9a9aa1);
  --_tc-caption-font-size: 12px;
  --_tc-caption-font-weight: 500;
  --_tc-caption-line-height: 16px;
  --_tc-caption-tracking: 0;
  --_tc-caption-transform: none;
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 32px;
  --_tc-control-h-sm: 28px;
  --_tc-control-px-md: 12px;
  --_tc-control-px-sm: 10px;
  --_tc-control-radius-md: 10px;
  --_tc-control-radius-sm: 8px;
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-reveal-slow: 900ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-fill-selected: light-dark(rgba(47, 107, 255, 0.08), rgba(91, 154, 255, 0.14));
  --_tc-fill-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.12));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-2xs: 10px;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xs: 11px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-hairline: 1px;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-tight: 16px;
  --_tc-menu-bg: light-dark(#ffffff, #232326);
  --_tc-menu-item-radius: 8px;
  --_tc-menu-padding: 4px;
  --_tc-menu-radius: 12px;
  --_tc-menu-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-pill-font-size: 11px;
  --_tc-pill-h: 20px;
  --_tc-pill-px: 8px;
  --_tc-pill-radius: 999px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-raised-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-space-4-5: 18px;
  --_tc-space-5: 20px;
  --_tc-space-6: 24px;
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-success-solid: light-dark(#1f8a4c, #3ec27a);
  --_tc-surface-inverse: light-dark(#171717, #ededed);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-sunken: light-dark(#f0f0f0, #111113);
  --_tc-text-disabled: light-dark(#a3a3a3, #5c5c63);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-on-inverse: light-dark(#ffffff, #111113);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
  --_tc-z-dropdown: 30;
}
.ui-ans:where([data-look="clean"]),
.ui-ans__portal:where([data-look="clean"]) {
  --_tc-accent: light-dark(#0060e2, #1a6cf0);
  --_tc-accent-text: light-dark(#0058cf, #70b8ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-action-ghost-fg: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-action-secondary-bg: light-dark(#ffffff, #252527);
  --_tc-action-secondary-fg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-action-secondary-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-border-selected: light-dark(#0060e2, #5b9aff);
  --_tc-caption-color: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-caption-font-size: 10px;
  --_tc-caption-font-weight: 500;
  --_tc-caption-line-height: 16px;
  --_tc-caption-tracking: 0.05em;
  --_tc-caption-transform: uppercase;
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 28px;
  --_tc-control-h-sm: 24px;
  --_tc-control-px-md: 10px;
  --_tc-control-px-sm: 8px;
  --_tc-control-radius-md: 6px;
  --_tc-control-radius-sm: 6px;
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-reveal-slow: 900ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-fill-selected: light-dark(rgba(0, 96, 226, 0.06), rgba(77, 141, 255, 0.14));
  --_tc-fill-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-2xs: 10px;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xs: 11px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-hairline: 0.5px;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-tight: 16px;
  --_tc-menu-bg: light-dark(#ffffff, #252527);
  --_tc-menu-item-radius: 6px;
  --_tc-menu-padding: 4px;
  --_tc-menu-radius: 10px;
  --_tc-menu-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 12px 28px -10px light-dark(rgba(0, 0, 0, 0.16), rgba(0, 0, 0, 0.6)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-pill-font-size: 11px;
  --_tc-pill-h: 18px;
  --_tc-pill-px: 6px;
  --_tc-pill-radius: 5px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shadow-raised-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-space-4-5: 18px;
  --_tc-space-5: 20px;
  --_tc-space-6: 24px;
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-success-solid: light-dark(#1f8a4c, #3ec27a);
  --_tc-surface-inverse: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-sunken: light-dark(#f7f7f7, #161618);
  --_tc-text-disabled: light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3));
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-on-inverse: light-dark(#fcfcfc, #161618);
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(10px + 4px);
  --_tc-z-dropdown: 30;
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

/* Colors and motion as variables – override them on .ui-ans */
:where([data-look="standard"], [data-look="standard"] *).ui-ans {
  /* the shimmer band over the label: brighter than --tc-shimmer, so it reads on light text in dark mode */
  --tc-ai-answer-shimmer: light-dark(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.95));
  --tc-ai-answer-source-ring-lit: light-dark(#cfcfd3, #4a4a50);
  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  width: 100%;
  max-width: 640px;
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-surface-sunken, var(--_tc-surface-sunken));
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  line-height: 1.5;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-ans */
:where([data-look="clean"], [data-look="clean"] *).ui-ans {
  /* the shimmer band over the label: brighter than --tc-shimmer, so it reads on light text in dark mode */
  --tc-ai-answer-shimmer: light-dark(rgba(255, 255, 255, 0.82), #ffffff);
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  width: 100%;
  max-width: 640px;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
}
.ui-ans *, .ui-ans *::before, .ui-ans *::after { box-sizing: border-box; }
:where(.ui-ans) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where(.ui-ans) svg { display: block; flex: none; }
.ui-ans button:focus-visible,
.ui-ans a:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
/* Source cards sit in a scroller that would clip an outside ring */
.ui-ans .ui-ans__source:focus-visible { outline-offset: calc(-1 * var(--tc-focus-ring-width, var(--_tc-focus-ring-width))); }
.ui-ans__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* The white card */
:where([data-look="standard"], [data-look="standard"] *).ui-ans__card {
  overflow: hidden;
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow));
  transition: height var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="standard"], [data-look="standard"] *).ui-ans__inner { display: flow-root; padding: 22px var(--tc-space-6, var(--_tc-space-6)) var(--tc-space-5, var(--_tc-space-5)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__question { margin: 0 0 var(--tc-space-4, var(--_tc-space-4)); font-size: 18px; font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); line-height: 1.35; letter-spacing: -0.012em; color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* Sources: a row of small cards that scrolls sideways */
:where([data-look="standard"], [data-look="standard"] *).ui-ans__sources {
  display: flex;
  gap: var(--tc-space-2, var(--_tc-space-2));
  margin: 0 -24px;
  padding: 0 var(--tc-space-6, var(--_tc-space-6)) var(--tc-space-0-5, var(--_tc-space-0-5));
  overflow-x: auto;
  scroll-padding: 0 24px;
  scrollbar-width: none;
  -webkit-mask: linear-gradient(90deg, transparent, #000 16px, #000 calc(100% - 24px), transparent);
  mask: linear-gradient(90deg, transparent, #000 16px, #000 calc(100% - 24px), transparent);
}
/* One white card – the edge is a shadow, not a border */
:where([data-look="clean"], [data-look="clean"] *).ui-ans__card {
  overflow: hidden;
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow));
}
:where([data-look="clean"], [data-look="clean"] *).ui-ans__body { overflow: hidden; transition: height var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__inner { display: flow-root; padding: var(--tc-space-5, var(--_tc-space-5)) var(--tc-space-5, var(--_tc-space-5)) var(--tc-space-4, var(--_tc-space-4)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__question { margin: 0 0 var(--tc-space-3-5, var(--_tc-space-3-5)); font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
/* Sources: small white cards in a row that scrolls sideways */
:where([data-look="clean"], [data-look="clean"] *).ui-ans__sources {
  display: flex;
  gap: var(--tc-space-2, var(--_tc-space-2));
  margin: 0 -20px;
  padding: var(--tc-space-0-5, var(--_tc-space-0-5)) var(--tc-space-5, var(--_tc-space-5)) var(--tc-space-1, var(--_tc-space-1));
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
  gap: var(--tc-space-1-5, var(--_tc-space-1-5));
  width: 172px;
  padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3, var(--_tc-space-3));
  border-radius: var(--tc-radius-xl, var(--_tc-radius-xl));
  background: var(--tc-fill-default, var(--_tc-fill-default));
  color: inherit;
  text-decoration: none;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
  animation: ui-ans-card var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
a:where([data-look="standard"], [data-look="standard"] *).ui-ans__source:hover { background: var(--tc-fill-hover, var(--_tc-fill-hover)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__source[data-lit] { box-shadow: inset 0 0 0 1.5px var(--tc-ai-answer-source-ring-lit); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__site { display: flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); min-width: 0; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__source {
  display: flex;
  flex-direction: column;
  gap: var(--tc-space-1, var(--_tc-space-1));
  width: 168px;
  padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2, var(--_tc-space-2));
  border-radius: var(--tc-radius-md, var(--_tc-radius-md));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised));
  color: inherit;
  text-decoration: none;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
  animation: ui-ans-card-clean var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
a:where([data-look="clean"], [data-look="clean"] *).ui-ans__source:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__source[data-lit] { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); box-shadow: var(--tc-shadow-raised-hover, var(--_tc-shadow-raised-hover)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__site { display: flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); min-width: 0; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
.ui-ans__site-name { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__num { flex: none; font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs)); font-variant-numeric: tabular-nums; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__favicon {
  display: grid;
  flex: none;
  width: 16px;
  height: 16px;
  overflow: hidden;
  border-radius: var(--tc-radius-xs, var(--_tc-radius-xs));
  box-shadow: 0 0 0 1px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
}
:where([data-look="clean"], [data-look="clean"] *).ui-ans__num { flex: none; font-size: var(--tc-font-size-2xs, var(--_tc-font-size-2xs)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); letter-spacing: 0.5px; font-variant-numeric: tabular-nums; color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__favicon {
  display: grid;
  flex: none;
  width: 14px;
  height: 14px;
  overflow: hidden;
  border-radius: var(--tc-radius-xs, var(--_tc-radius-xs));
  box-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
}
.ui-ans__favicon svg { width: 100%; height: 100%; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: 1.4;
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
/* "Reading 6 sources" → "Writing" → "Answer" */
:where([data-look="standard"], [data-look="standard"] *).ui-ans__label { display: flex; align-items: center; gap: var(--tc-space-2, var(--_tc-space-2)); margin: var(--tc-space-5, var(--_tc-space-5)) 0 var(--tc-space-2-5, var(--_tc-space-2-5)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
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
:where([data-look="standard"], [data-look="standard"] *).ui-ans[data-phase="reading"] .ui-ans__eyes { animation: ui-ans-scan var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) ease-in-out infinite; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans[data-phase="writing"] .ui-ans__eyes { animation: ui-ans-follow 1.9s cubic-bezier(0.45, 0, 0.55, 1) infinite; }
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
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-strong, var(--_tc-text-strong));
}
/* "Reading 6 sources" → "Writing" → "Answer" */
:where([data-look="clean"], [data-look="clean"] *).ui-ans__label { display: flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); margin: var(--tc-space-4, var(--_tc-space-4)) 0 var(--tc-space-1-5, var(--_tc-space-1-5)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__mark { width: 16px; height: 16px; fill: var(--tc-accent, var(--_tc-accent)); overflow: visible; }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__mark path { transform-box: fill-box; transform-origin: center; }
/* While it works the big sparkle breathes and the small one twinkles */
:where([data-look="clean"], [data-look="clean"] *).ui-ans[data-phase="reading"] .ui-ans__mark-big,
:where([data-look="clean"], [data-look="clean"] *).ui-ans[data-phase="writing"] .ui-ans__mark-big { animation: ui-ans-breathe var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) ease-in-out infinite; }
:where([data-look="clean"], [data-look="clean"] *).ui-ans[data-phase="reading"] .ui-ans__mark-small,
:where([data-look="clean"], [data-look="clean"] *).ui-ans[data-phase="writing"] .ui-ans__mark-small { animation: ui-ans-twinkle var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) ease-in-out infinite; }
.ui-ans__label-text { position: relative; animation: ui-ans-fade var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans[data-phase="reading"] .ui-ans__label-text,
:where([data-look="standard"], [data-look="standard"] *).ui-ans[data-phase="writing"] .ui-ans__label-text { color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* The answer */
:where([data-look="standard"], [data-look="standard"] *).ui-ans__answer { font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus)); line-height: 1.65; color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__answer p { margin: 0 0 var(--tc-space-3, var(--_tc-space-3)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__answer ul { margin: 0 0 var(--tc-space-3, var(--_tc-space-3)); padding: 0 0 0 var(--tc-space-5, var(--_tc-space-5)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__answer li { margin: 0 0 var(--tc-space-1-5, var(--_tc-space-1-5)); padding-left: var(--tc-space-0-5, var(--_tc-space-0-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans[data-phase="done"] .ui-ans__label-text,
:where([data-look="clean"], [data-look="clean"] *).ui-ans[data-phase="stopped"] .ui-ans__label-text { color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
/* The answer */
:where([data-look="clean"], [data-look="clean"] *).ui-ans__answer { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__answer p { margin: 0 0 var(--tc-space-2, var(--_tc-space-2)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__answer ul { margin: 0 0 var(--tc-space-2, var(--_tc-space-2)); padding: 0 0 0 var(--tc-space-4-5, var(--_tc-space-4-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__answer li { margin: 0 0 var(--tc-space-1, var(--_tc-space-1)); padding-left: var(--tc-space-0-5, var(--_tc-space-0-5)); }
.ui-ans__answer li::marker { color: var(--tc-text-disabled, var(--_tc-text-disabled)); }
.ui-ans__answer > :last-child { margin-bottom: 0; }
.ui-ans__empty { color: var(--tc-text-muted, var(--_tc-text-muted)); }
.ui-ans__w { animation: ui-ans-word var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
/* Words are rendered ahead of the typing and shown by it (data-on); the caret follows the last one shown */
.ui-ans__w:not([data-on]) { display: none; }
.ui-ans[data-phase="writing"] .ui-ans__w[data-caret]::after { content: ""; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__w[data-bold] { font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__caret,
:where([data-look="standard"][data-phase="writing"]) .ui-ans__w[data-caret]::after {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-left: var(--tc-space-1, var(--_tc-space-1));
  border-radius: 50%;
  background: var(--tc-text-primary, var(--_tc-text-primary));
  vertical-align: 0.05em;
  animation: ui-ans-pulse var(--tc-duration-reveal-slow, var(--_tc-duration-reveal-slow)) ease-in-out infinite;
}
/* Citation chips */
:where([data-look="standard"], [data-look="standard"] *).ui-ans__cite {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1, var(--_tc-space-1));
  height: 20px;
  margin: 0 1px 0 var(--tc-space-1, var(--_tc-space-1));
  padding: 0 var(--tc-space-2, var(--_tc-space-2));
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  background: var(--tc-fill-default, var(--_tc-fill-default));
  font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: 1;
  color: var(--tc-text-muted, var(--_tc-text-muted));
  vertical-align: 0.12em;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
  animation: ui-ans-chip var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-ans__cite:hover { background: var(--tc-fill-hover, var(--_tc-fill-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__cite[data-lit] { background: var(--tc-surface-inverse, var(--_tc-surface-inverse)); color: var(--tc-text-on-inverse, var(--_tc-text-on-inverse)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__w[data-bold] { font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__caret,
:where([data-look="clean"][data-phase="writing"]) .ui-ans__w[data-caret]::after {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-left: var(--tc-space-1, var(--_tc-space-1));
  border-radius: 1.5px;
  background: var(--tc-accent, var(--_tc-accent));
  vertical-align: 0.1em;
  animation: ui-ans-pulse-clean var(--tc-duration-reveal-slow, var(--_tc-duration-reveal-slow)) ease-in-out infinite;
}
/* Citation chips: the gray tab look; the linked one gets a touch darker */
:where([data-look="clean"], [data-look="clean"] *).ui-ans__cite {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1, var(--_tc-space-1));
  height: var(--tc-pill-h, var(--_tc-pill-h));
  margin: 0 1px 0 var(--tc-space-1, var(--_tc-space-1));
  padding: 0 var(--tc-pill-px, var(--_tc-pill-px));
  border-radius: var(--tc-pill-radius, var(--_tc-pill-radius));
  background: var(--tc-fill-default, var(--_tc-fill-default));
  box-shadow: inset 0 0 0 0.5px var(--tc-border-default, var(--_tc-border-default));
  font-size: var(--tc-pill-font-size, var(--_tc-pill-font-size));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: 1;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  vertical-align: 0.1em;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
  animation: ui-ans-chip var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ans__cite:hover,
:where([data-look="clean"], [data-look="clean"] *).ui-ans__cite[data-lit] { background: var(--tc-fill-strong, var(--_tc-fill-strong)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* "+2" in the chip's own colour – opacity took it below 4.5:1 */
.ui-ans__more { font-variant-numeric: tabular-nums; }
/* Preview of the cited source */
:where([data-look="standard"], [data-look="standard"] *).ui-ans__pop {
  position: absolute;
  z-index: var(--tc-z-dropdown, var(--_tc-z-dropdown));
  display: grid;
  gap: var(--tc-space-0-5, var(--_tc-space-0-5));
  padding: var(--tc-space-1-5, var(--_tc-space-1-5));
  border-radius: var(--tc-menu-radius, var(--_tc-menu-radius));
  background: var(--tc-menu-bg, var(--_tc-menu-bg));
  box-shadow: var(--tc-menu-shadow, var(--_tc-menu-shadow));
  animation: ui-ans-pop var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-ans__pop-item { display: grid; gap: var(--tc-space-1, var(--_tc-space-1)); padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2-5, var(--_tc-space-2-5)); border-radius: var(--tc-menu-item-radius, var(--_tc-menu-item-radius)); color: inherit; text-decoration: none; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__pop-item[href]:hover { background: var(--tc-fill-default, var(--_tc-fill-default)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__pop-title { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: 1.4; color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__snippet {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: 1.5;
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
/* Follow-up questions */
:where([data-look="standard"], [data-look="standard"] *).ui-ans__follow { display: grid; margin-top: var(--tc-space-5, var(--_tc-space-5)); padding-top: var(--tc-space-3-5, var(--_tc-space-3-5)); border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__follow-label { padding-bottom: var(--tc-space-1, var(--_tc-space-1)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-muted, var(--_tc-text-muted)); animation: ui-ans-fade var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__follow-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3, var(--_tc-space-3));
  min-height: 40px;
  padding: var(--tc-space-2, var(--_tc-space-2)) 0;
  border-bottom: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
  text-align: left;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  animation: ui-ans-fade var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-ans__follow-item:last-child { border-bottom: 0; padding-bottom: 0; }
/* Preview of the cited source */
:where([data-look="clean"], [data-look="clean"] *).ui-ans__pop {
  position: absolute;
  z-index: var(--tc-z-dropdown, var(--_tc-z-dropdown));
  display: grid;
  gap: var(--tc-space-0-5, var(--_tc-space-0-5));
  padding: var(--tc-menu-padding, var(--_tc-menu-padding));
  border-radius: var(--tc-menu-radius, var(--_tc-menu-radius));
  background: var(--tc-menu-bg, var(--_tc-menu-bg));
  box-shadow: var(--tc-menu-shadow, var(--_tc-menu-shadow));
  animation: ui-ans-pop var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ans__pop-item { display: grid; gap: var(--tc-space-0-5, var(--_tc-space-0-5)); padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2, var(--_tc-space-2)); border-radius: var(--tc-menu-item-radius, var(--_tc-menu-item-radius)); color: inherit; text-decoration: none; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__pop-item[href]:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__pop-title { font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__snippet {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
/* Follow-up questions */
:where([data-look="clean"], [data-look="clean"] *).ui-ans__follow { display: grid; margin-top: var(--tc-space-4, var(--_tc-space-4)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__follow-label {
  padding-bottom: var(--tc-space-1, var(--_tc-space-1));
  font-size: var(--tc-caption-font-size, var(--_tc-caption-font-size));
  font-weight: var(--tc-caption-font-weight, var(--_tc-caption-font-weight));
  line-height: var(--tc-caption-line-height, var(--_tc-caption-line-height));
  letter-spacing: var(--tc-caption-tracking, var(--_tc-caption-tracking));
  text-transform: var(--tc-caption-transform, var(--_tc-caption-transform));
  color: var(--tc-caption-color, var(--_tc-caption-color));
  animation: ui-ans-fade var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ans__follow-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3, var(--_tc-space-3));
  min-height: 32px;
  padding: var(--tc-space-1-5, var(--_tc-space-1-5)) 0;
  border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
  text-align: left;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  animation: ui-ans-fade var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
.ui-ans__follow-item .ui-ans__glyph { color: var(--tc-icon-muted, var(--_tc-icon-muted)); transition: transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__follow-item:hover .ui-ans__glyph { color: var(--tc-text-primary, var(--_tc-text-primary)); transform: translateX(3px); }
/* The tray below the card */
:where([data-look="standard"], [data-look="standard"] *).ui-ans__foot { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3, var(--_tc-space-3)); height: 42px; padding: 0 var(--tc-space-2, var(--_tc-space-2)) 0 var(--tc-space-1-5, var(--_tc-space-1-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__follow-item:hover .ui-ans__glyph { color: var(--tc-text-primary, var(--_tc-text-primary)); transform: translateX(2px); }
/* The last row inside the card */
:where([data-look="clean"], [data-look="clean"] *).ui-ans__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3, var(--_tc-space-3));
  height: 44px;
  padding: 0 var(--tc-space-3, var(--_tc-space-3)) 0 var(--tc-space-2, var(--_tc-space-2));
  border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
}
.ui-ans__actions { display: flex; gap: var(--tc-space-0-5, var(--_tc-space-0-5)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__action {
  display: grid;
  place-items: center;
  width: var(--tc-control-h-md, var(--_tc-control-h-md));
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  color: var(--tc-text-muted, var(--_tc-text-muted));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
  animation: ui-ans-fade var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ans__action {
  display: grid;
  place-items: center;
  width: var(--tc-control-h-md, var(--_tc-control-h-md));
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  color: var(--tc-icon-muted, var(--_tc-icon-muted));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
  animation: ui-ans-fade var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
.ui-ans__action:nth-child(2) { animation-delay: 40ms; }
.ui-ans__action:nth-child(3) { animation-delay: var(--tc-duration-instant, var(--_tc-duration-instant)); }
.ui-ans__action:nth-child(4) { animation-delay: var(--tc-duration-quick, var(--_tc-duration-quick)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__action:hover { background: var(--tc-fill-hover, var(--_tc-fill-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* Pressed: the selected fill with a ≥ 3:1 ring, the accent, and (Standard) a filled glyph */
.ui-ans__action[aria-pressed="true"] { background: var(--tc-fill-selected, var(--_tc-fill-selected)); box-shadow: inset 0 0 0 1px var(--tc-border-selected, var(--_tc-border-selected)); color: var(--tc-accent-text, var(--_tc-accent-text)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__action[aria-pressed="true"] .ui-ans__glyph { fill: currentColor; fill-opacity: 0.16; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__glyph { width: 17px; height: 17px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__action:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__glyph[data-solid] { fill: currentColor; stroke: none; }
.ui-ans__down .ui-ans__glyph { transform: scaleY(-1); }
.ui-ans__redo:active .ui-ans__glyph { transform: rotate(120deg); transition: transform var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__ok { stroke: var(--tc-status-success-solid, var(--_tc-status-success-solid)) !important; stroke-width: 2.2 !important; animation: ui-ans-chip var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__status { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); white-space: nowrap; color: var(--tc-text-muted, var(--_tc-text-muted)); animation: ui-ans-fade var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__ok { color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); animation: ui-ans-chip var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__action:has(.ui-ans__ok) { color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__status { font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); white-space: nowrap; color: var(--tc-text-muted, var(--_tc-text-muted)); animation: ui-ans-fade var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
@container (max-width: 330px) {
  .ui-ans__status-lead { display: none; }
}
:where([data-look="standard"], [data-look="standard"] *).ui-ans__stop {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2, var(--_tc-space-2));
  height: var(--tc-control-h-sm, var(--_tc-control-h-sm));
  padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md)) 0 var(--tc-control-px-sm, var(--_tc-control-px-sm));
  border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm));
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size));
  color: var(--tc-action-ghost-fg, var(--_tc-action-ghost-fg));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
  animation: ui-ans-fade var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-ans__stop:hover { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__stop-icon { width: 9px; height: 9px; border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); background: var(--tc-text-primary, var(--_tc-text-primary)); }
/* Stop: the white button with the hairline shadow */
:where([data-look="clean"], [data-look="clean"] *).ui-ans__stop {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5, var(--_tc-space-1-5));
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md)) 0 var(--tc-control-px-sm, var(--_tc-control-px-sm));
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg));
  box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow));
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size));
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
  color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
  animation: ui-ans-fade var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ans__stop:hover { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__stop-icon { width: 8px; height: 8px; margin: 0 var(--tc-space-0-5, var(--_tc-space-0-5)); border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); background: var(--tc-text-primary, var(--_tc-text-primary)); }
/* Reasons after a thumbs down fold out below */
.ui-ans__reasons { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-ans__reasons[data-open="true"] { grid-template-rows: 1fr; opacity: 1; }
/* 4px of room above (taken back with the margin) so the outline and focus ring of the chips aren't cut off */
:where([data-look="standard"], [data-look="standard"] *).ui-ans__reasons > div { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); min-height: 0; overflow: hidden; margin-top: -4px; padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-1-5, var(--_tc-space-1-5)) 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__reasons[data-open="true"] > div { padding-bottom: var(--tc-space-2, var(--_tc-space-2)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__reasons button {
  height: var(--tc-control-h-sm, var(--_tc-control-h-sm));
  padding: 0 var(--tc-control-px-sm, var(--_tc-control-px-sm));
  border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm));
  background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg));
  box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  transition: color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-ans__reasons button:hover { color: var(--tc-text-primary, var(--_tc-text-primary)); box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__reasons > div { display: flex; flex-wrap: wrap; gap: var(--tc-space-2, var(--_tc-space-2)); min-height: 0; overflow: hidden; margin-top: -4px; padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-3, var(--_tc-space-3)) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__reasons[data-open="true"] > div { padding-bottom: var(--tc-space-3, var(--_tc-space-3)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__reasons button {
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md));
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  box-shadow: inset 0 0 0 0.5px var(--tc-border-default, var(--_tc-border-default));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  transition: color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-ans__reasons button:hover { color: var(--tc-text-primary, var(--_tc-text-primary)); background: var(--tc-fill-default, var(--_tc-fill-default)); }
/* Shine over the working label: a soft band (a mask) moves across by transform while the light copy of the text
   inside it moves back, so the letters stay put – composited, no repaint per frame */
.ui-ans__shine {
  position: absolute;
  inset: 0;
  pointer-events: none;
  -webkit-mask: linear-gradient(90deg, transparent 14%, #000 50%, transparent 86%);
  mask: linear-gradient(90deg, transparent 14%, #000 50%, transparent 86%);
  animation: ui-ans-shine var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) linear infinite;
}
.ui-ans__shine > span { display: block; white-space: nowrap; color: var(--tc-ai-answer-shimmer); animation: ui-ans-shine-back var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) linear infinite; }
/* Off-screen, the working animations pause */
.ui-ans[data-offscreen] *, .ui-ans[data-offscreen] *::after { animation-play-state: paused; }
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
:where([data-look="standard"], [data-look="standard"] *).ui-ans__inner { padding: var(--tc-space-4-5, var(--_tc-space-4-5)) var(--tc-space-4-5, var(--_tc-space-4-5)) var(--tc-space-4, var(--_tc-space-4)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__sources { margin: 0 -18px; padding: 0 var(--tc-space-4-5, var(--_tc-space-4-5)) var(--tc-space-0-5, var(--_tc-space-0-5)); scroll-padding: 0 18px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__question { font-size: 16.5px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__source { width: 152px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__answer { font-size: 14.5px; }
}
/* Touch screens: bigger tap targets – the citation chips keep their size but get a larger invisible hit area */
@media (hover: none) and (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-ans__action { width: 40px; height: 40px; border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__foot { height: 48px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__stop { height: 36px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__reasons button { height: 36px; padding: 0 var(--tc-space-3, var(--_tc-space-3)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ans__follow-item { min-height: 46px; }
.ui-ans__cite { position: relative; }
.ui-ans__cite::after { content: ""; position: absolute; inset: -10px -4px; }
}
/* Narrow (phones) */
@container (max-width: 480px) {
:where([data-look="clean"], [data-look="clean"] *).ui-ans__inner { padding: var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-3-5, var(--_tc-space-3-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__sources { margin: 0 -16px; padding: var(--tc-space-0-5, var(--_tc-space-0-5)) var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-1, var(--_tc-space-1)); scroll-padding: 0 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__source { width: 150px; }
}
/* Touch screens: bigger tap targets – the citation chips keep their size but get a larger invisible hit area */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-ans__action { width: 36px; height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__foot { height: 52px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__stop { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__reasons button { height: 34px; padding: 0 var(--tc-space-3, var(--_tc-space-3)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ans__follow-item { min-height: 44px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-ans *, .ui-ans *::before, .ui-ans *::after { animation: none !important; transition: none !important; }
}
`;
