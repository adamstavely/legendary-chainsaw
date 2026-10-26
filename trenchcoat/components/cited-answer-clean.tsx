"use client";

/*
 * Cited Answer – an AI answer whose sentences and sources are wired to each other, in one self-contained file.
 * The answer is a list of text segments (usually one sentence each) that name the sources they rely on. Small
 * numbered markers sit at the end of each cited sentence; the sources wait on the gray tray below as compact chips.
 *   · point at a marker: its source chip lights up and the sentence gets a soft highlight
 *   · point at a chip: every sentence that cites it lights up and the rest of the answer fades back
 *   · click a marker or chip: a preview unfolds in place – title, domain, date and the quoted passage with the
 *     words that back the answer marked – with Open source and Copy quote. Only one is open at a time
 *   · the line on the tray always says what you are pointing at
 * The open preview is controlled when `preview` is defined (null: closed), otherwise uncontrolled from
 * `defaultPreview`; changes are always reported through onPreviewChange. Other DOM props and `ref` go to the root.
 * The styles are injected below, so no extra files are needed.
 * Two looks, picked with the `look` prop (the default comes from the file: cited-answer.tsx is Standard,
 * cited-answer-clean.tsx is Clean). Clean has no tray – one white card with hairline shadows and quiet gray type; the
 * sources sit inside it, below the answer, as one row of gray tab chips (whatever doesn't fit goes into "+N", which
 * shows them all), and its icons are 16px with thin lines.
 */
// Generated from src/components/cited-answer.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent, type ReactNode, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "clean";
const ROOT_CLASS = "ui-ca";

export type CitedSegment = {
  /** A sentence or part of one. Spaces at the start or end are kept outside the highlight */
  text: string;
  /** Ids of the sources this text relies on – one marker each, in this order */
  cite?: string[];
  /** Starts a new paragraph */
  paragraph?: boolean;
};

export type CitedSource = {
  id: string;
  /** Headline of the page or document */
  title: string;
  url?: string;
  /** Short name on the chip, e.g. "Latency Notes" */
  site: string;
  /** Ready-to-show date, e.g. "Sep 12, 2026" */
  date?: string;
  /** The passage the answer relies on */
  quote?: string;
  /** Words or phrases of the quote to mark. Without it, words the quote shares with the citing sentences are marked */
  highlight?: string[];
  /** A favicon or logo, shown at 16px – a letter on a soft color when left out */
  icon?: ReactNode;
};

type CitedAnswerOwnProps = {
  /** Visual style. Defaults to the file's look: Standard in cited-answer.tsx, Clean in cited-answer-clean.tsx */
  look?: Look;
  segments: CitedSegment[];
  sources: CitedSource[];
  /** Pages the model read while searching – shown in the head next to the source count */
  pagesRead?: number;
  /** Id of the source whose preview is open – controlled when defined (null: closed) */
  preview?: string | null;
  /** Id of the source whose preview is open at first (uncontrolled) */
  defaultPreview?: string | null;
  /** @deprecated use `defaultPreview` */
  defaultOpen?: string;
  /** Called by Open source. With it the link doesn't navigate on its own – open the page yourself */
  onOpenSource?: (source: CitedSource) => void;
  /** Called when the open preview changes (null = closed) */
  onPreviewChange?: (id: string | null) => void;
  /** A button on the tray, e.g. { label: "Follow up", onClick } */
  action?: { label: string; onClick: () => void };
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export type CitedAnswerProps = Omit<ComponentPropsWithoutRef<"div">, keyof CitedAnswerOwnProps> & CitedAnswerOwnProps;

/* ---------- Helpers ---------- */

const TONES = ["blue", "violet", "green", "amber", "gray"] as const;
const tone = (name: string) =>
  TONES[[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 997, 7) % TONES.length];
const domain = (url?: string) => {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const STOP = new Set([
  "about", "after", "again", "their", "there", "these", "those", "which", "while", "would", "could", "should",
  "every", "other", "being", "still", "where", "until", "since", "under", "first", "people", "thing", "things",
]);

/** The quote with the phrases (or, without them, the words shared with the answer) wrapped in <mark> */
function marked(quote: string, phrases: string[] | undefined, answer: string) {
  let pattern: RegExp | null = null;
  if (phrases?.length) {
    const list = phrases.filter((p) => p.trim()).map(escape);
    if (list.length) pattern = new RegExp(`(${list.join("|")})`, "gi");
  } else {
    const words = [
      ...new Set(
        (answer.toLowerCase().match(/[a-z0-9%]+/g) ?? []).filter(
          (w) => (w.length >= 5 || /\d/.test(w)) && !STOP.has(w),
        ),
      ),
    ];
    if (words.length) pattern = new RegExp(`\\b(${words.map(escape).join("|")})\\b`, "gi");
  }
  if (!pattern) return quote;
  return quote.split(pattern).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part));
}

/**
 * Text that changes without a jump: the old line stays for a moment and fades out underneath while the new one fades in.
 */
function Swap({ id, tone: t, children }: { id: string; tone?: string; children: ReactNode }) {
  type Line = { id: string; tone?: string; node: ReactNode };
  // The line as last committed – kept after each commit, so a change of id can fade out what was on screen
  const last = useRef<Line>({ id, tone: t, node: children });
  const [shownId, setShownId] = useState(id);
  const [out, setOut] = useState<Line | null>(null);
  if (shownId !== id) {
    setShownId(id);
    setOut(last.current);
  }
  useLayoutEffect(() => {
    last.current = { id, tone: t, node: children };
  });
  useEffect(() => {
    if (!out) return;
    const timer = window.setTimeout(() => setOut(null), 260);
    return () => window.clearTimeout(timer);
  }, [out]);
  return (
    <span className="ui-ca__swap">
      {out && (
        <span key={`out-${out.id}`} className="ui-ca__swap-item" data-out="" data-tone={out.tone} aria-hidden="true">
          {out.node}
        </span>
      )}
      <span key={id} className="ui-ca__swap-item" data-tone={t}>
        {children}
      </span>
    </span>
  );
}

/* ---------- Icons – Standard: 10–12px with 1.4px lines; Clean: 16px, thin 1.1px lines with round caps ---------- */

const line = { stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const CloseIcon = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <path d="m2.5 2.5 5 5m0-5-5 5" {...line} />
  </svg>
);
const OutIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M4.5 3h4.5v4.5M8.8 3.2 3 9" {...line} />
  </svg>
);
const CopyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <rect x="4.2" y="4.2" width="5.8" height="5.8" rx="1.4" {...line} />
    <path d="M7.8 2.6A1.2 1.2 0 0 0 6.6 2H3.2A1.2 1.2 0 0 0 2 3.2v3.4a1.2 1.2 0 0 0 .6 1" {...line} />
  </svg>
);
const DoneIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="m2.6 6.3 2.2 2.2 4.6-5" {...line} strokeWidth={1.6} />
  </svg>
);
const ArrowIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2.5 6h7M6.5 3l3 3-3 3" {...line} />
  </svg>
);

const CleanIcon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 16 16" className="ui-ca__icon" aria-hidden="true">
    <path d={d} />
  </svg>
);
const cleanIcons = {
  close: "M4.75 4.75l6.5 6.5m0-6.5-6.5 6.5",
  out: "M6.5 4.5h5v5M11.25 4.75 4.5 11.5",
  copy: "M6.75 5.5h5c.69 0 1.25.56 1.25 1.25v5c0 .69-.56 1.25-1.25 1.25h-5c-.69 0-1.25-.56-1.25-1.25v-5c0-.69.56-1.25 1.25-1.25ZM10.5 3.5A1.25 1.25 0 0 0 9.25 3h-5C3.56 3 3 3.56 3 4.25v5c0 .54.34 1 .82 1.17",
  done: "M3.75 8.4 6.6 11.2 12.25 5",
  arrow: "M3.5 8h9M8.75 4.25 12.5 8l-3.75 3.75",
};
const standardIcons = { close: CloseIcon, out: OutIcon, copy: CopyIcon, done: DoneIcon, arrow: ArrowIcon };
const Icon = ({ name, look }: { name: keyof typeof cleanIcons; look: Look }) => {
  if (look === "clean") return <CleanIcon d={cleanIcons[name]} />;
  const Standard = standardIcons[name];
  return <Standard />;
};

function SourceGlyph({ source }: { source: CitedSource }) {
  return (
    <span className="ui-ca__glyph" data-tone={tone(source.site)} aria-hidden="true">
      {source.icon ?? source.site.trim().charAt(0).toUpperCase()}
    </span>
  );
}

/** What the pointer (or focus) is on: one marker in one sentence, or a whole source */
type Hot = { source: string; segment?: number } | null;

/** Gap between Clean's chips – the "+N" fit measures with it */
const CHIP_GAP = 4;

/** What the tray (Clean: the card's last row) says */
function trayCaption({
  copied,
  hot,
  hotSource,
  openSource,
  cited,
  sentences,
  citedIn,
}: {
  copied: { id: number; source: string; ok: boolean } | null;
  hot: Hot;
  hotSource: CitedSource | null;
  openSource: CitedSource | null;
  cited: number;
  sentences: number;
  citedIn: (id: string) => number;
}) {
  let caption: ReactNode = (
    <>
      <b>{cited}</b> of {sentences} {sentences === 1 ? "sentence" : "sentences"} backed by a source
    </>
  );
  let captionKey = "rest";
  let captionTone: string | undefined;
  if (copied) {
    caption = copied.ok ? "Quote copied" : "Couldn't copy the quote";
    captionKey = `copied-${copied.id}`;
    captionTone = copied.ok ? "ok" : "error";
  } else if (hotSource && hot?.segment !== undefined) {
    caption = (
      <>
        <b>{hotSource.site}</b> <span className="ui-ca__dot">·</span> {hotSource.title}
      </>
    );
    captionKey = `mark-${hot.segment}-${hotSource.id}`;
  } else if (hotSource) {
    const n = citedIn(hotSource.id);
    caption = n ? (
      <>
        <b>{hotSource.site}</b> <span className="ui-ca__dot">·</span> cited in {n} {n === 1 ? "sentence" : "sentences"}
      </>
    ) : (
      <>
        <b>{hotSource.site}</b> <span className="ui-ca__dot">·</span> read, not cited
      </>
    );
    captionKey = `src-${hotSource.id}`;
  } else if (openSource) {
    caption = (
      <>
        Quote from <b>{openSource.site}</b>
      </>
    );
    captionKey = `open-${openSource.id}`;
  }
  return { caption, captionKey, captionTone };
}

/** The sources as chips – the first `visible` of them, and "+N" for the rest */
function SourceChips({
  chipsRef,
  sources,
  visible,
  hidden,
  all,
  focusSource,
  open,
  previewId,
  onHot,
  onChipKey,
  onToggle,
  onMore,
}: {
  chipsRef: Ref<HTMLDivElement>;
  sources: CitedSource[];
  visible: number;
  hidden: number;
  all: boolean;
  focusSource: string | null;
  open: string | null;
  previewId: string;
  onHot: (hot: Hot) => void;
  onChipKey: (e: KeyboardEvent<HTMLButtonElement>) => void;
  onToggle: (id: string, from: HTMLElement) => void;
  onMore: () => void;
}) {
  return (
  <div
    className="ui-ca__chips"
    data-all={all ? "" : undefined}
    ref={chipsRef}
    role="list"
    aria-label="Sources"
    onPointerLeave={() => onHot(null)}
  >
    {sources.slice(0, visible).map((s, i) => {
      const lit = focusSource === s.id;
      return (
        <span role="listitem" key={s.id} className="ui-ca__chip-item">
          <button
            type="button"
            className="ui-ca__chip"
            data-source={s.id}
            data-lit={lit ? "" : undefined}
            data-dim={focusSource && !lit ? "" : undefined}
            aria-expanded={open === s.id}
            aria-controls={previewId}
            onPointerEnter={(e) => e.pointerType === "mouse" && onHot({ source: s.id })}
            onFocus={() => onHot({ source: s.id })}
            onBlur={() => onHot(null)}
            onKeyDown={onChipKey}
            onClick={(e) => onToggle(s.id, e.currentTarget)}
          >
            <SourceGlyph source={s} />
            <span className="ui-ca__chip-name">{s.site}</span>
            <span className="ui-ca__chip-num">{i + 1}</span>
            {/* Named by what it shows (2.5.3), then what it is */}
            <span className="ui-ca__sr">, source: {s.title}</span>
          </button>
        </span>
      );
    })}
    {hidden > 0 && (
      <span role="listitem" className="ui-ca__chip-item">
        <button
          type="button"
          className="ui-ca__more"
          aria-label={`+${hidden} more ${hidden === 1 ? "source" : "sources"}`}
          onKeyDown={onChipKey}
          onClick={onMore}
        >
          +{hidden}
        </button>
      </span>
    )}
  </div>
  );
}

/** The answer: paragraphs of segments, each cited one ending in its markers */
function AnswerText({
  paragraphs,
  hot,
  open,
  previewId,
  segState,
  known,
  byId,
  number,
  onHot,
  onToggle,
}: {
  paragraphs: { seg: CitedSegment; index: number }[][];
  hot: Hot;
  open: string | null;
  previewId: string;
  segState: (seg: CitedSegment, index: number) => "hl" | "dim" | undefined;
  known: (id: string) => boolean;
  byId: (id: string) => CitedSource | null;
  number: (id: string) => number;
  onHot: (hot: Hot) => void;
  onToggle: (id: string, from: HTMLElement) => void;
}) {
  return (
  <div className="ui-ca__text" onPointerLeave={() => onHot(null)}>
    {paragraphs.map((para, p) => (
      <p key={p} className="ui-ca__p">
        {para.map(({ seg, index }) => {
          const [, lead, body, trail] = seg.text.match(/^(\s*)([\s\S]*?)(\s*)$/) ?? ["", "", seg.text, ""];
          const marks = (seg.cite ?? []).filter(known);
          const state = segState(seg, index);
          // The last word travels with the markers, so a marker never starts a line on its own
          const cut = marks.length ? Math.max(0, body.search(/\S+$/)) : body.length;
          return (
            <span key={index}>
              {lead}
              <span
                className="ui-ca__seg"
                data-hl={state === "hl" ? "" : undefined}
                data-dim={state === "dim" ? "" : undefined}
              >
                {body.slice(0, cut)}
                <span className="ui-ca__keep">
                {body.slice(cut)}
                {marks.map((id) => {
                  const s = byId(id)!;
                  const lit =
                    (hot?.segment === index && hot.source === id) ||
                    (hot?.segment === undefined && hot?.source === id);
                  return (
                    <button
                      key={id}
                      type="button"
                      className="ui-ca__marker"
                      data-source={id}
                      data-lit={lit ? "" : undefined}
                      data-dim={hot && !lit ? "" : undefined}
                      aria-expanded={open === id}
                      aria-controls={previewId}
                      onPointerEnter={(e) => e.pointerType === "mouse" && onHot({ source: id, segment: index })}
                      onPointerLeave={(e) => e.pointerType === "mouse" && onHot(null)}
                      onFocus={() => onHot({ source: id, segment: index })}
                      onBlur={() => onHot(null)}
                      onClick={(e) => onToggle(id, e.currentTarget)}
                    >
                      {number(id)}
                      <span className="ui-ca__sr">
                        , source: {s.site} – {s.title}
                      </span>
                    </button>
                  );
                })}
                </span>
              </span>
              {trail}
            </span>
          );
        })}
      </p>
    ))}
  </div>
  );
}

/** The source a marker or chip opened: where it's from, its title, the quote with what the answer used, and actions */
function SourcePreview({
  source,
  look,
  number,
  answer,
  copied,
  onOpenSource,
  onCopy,
  onClose,
}: {
  source: CitedSource;
  look: Look;
  number: number;
  /** The text of the segments that cite it – their words are marked in the quote */
  answer: string;
  copied: boolean;
  onOpenSource?: (source: CitedSource) => void;
  onCopy: () => void;
  onClose: () => void;
}) {
  const clean = look === "clean";
  return (
    <div className="ui-ca__preview">
      <div className="ui-ca__pv-head">
        <SourceGlyph source={source} />
        <span className="ui-ca__pv-meta">
          <span className="ui-ca__pv-domain">{domain(source.url) || source.site}</span>
          {source.date && (
            <span className="ui-ca__pv-date">
              <span className="ui-ca__dot"> · </span>
              {source.date}
            </span>
          )}
        </span>
        <span className="ui-ca__pv-num">{number}</span>
        <button type="button" className="ui-ca__close" aria-label="Close source" onClick={onClose}>
          <Icon name="close" look={look} />
        </button>
      </div>
      <div className="ui-ca__pv-title">{source.title}</div>
      {source.quote && (
        <blockquote className="ui-ca__quote">
          {marked(source.quote, source.highlight, answer)}
        </blockquote>
      )}
      <div className="ui-ca__pv-actions">
        {source.url ? (
          <a
            className="ui-ca__btn ui-ca__btn--main"
            href={source.url}
            target="_blank"
            rel="noreferrer noopener"
            onClick={(e) => {
              if (!onOpenSource) return;
              e.preventDefault();
              onOpenSource(source);
            }}
          >
            {clean && <Icon name="out" look={look} />}
            Open source
            {!clean && <Icon name="out" look={look} />}
          </a>
        ) : (
          onOpenSource && (
            <button type="button" className="ui-ca__btn ui-ca__btn--main" onClick={() => onOpenSource(source)}>
              {clean && <Icon name="out" look={look} />}
              Open source
              {!clean && <Icon name="out" look={look} />}
            </button>
          )
        )}
        {source.quote && (
          <button
            type="button"
            className="ui-ca__btn"
            data-done={copied ? "" : undefined}
            aria-label={copied ? "Copied" : "Copy quote"}
            onClick={onCopy}
          >
            <span className="ui-ca__btn-icon" key={copied ? "done" : "idle"}>
              <Icon name={copied ? "done" : "copy"} look={look} />
            </span>
            <span className="ui-ca__btn-text">{copied ? "Copied" : "Copy quote"}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export function CitedAnswer({
  look,
  segments,
  sources,
  pagesRead,
  preview,
  defaultPreview,
  defaultOpen,
  onOpenSource,
  onPreviewChange,
  action,
  className,
  ref,
  onKeyDown: onKeyDownProp,
  ...rest
}: CitedAnswerProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const clean = resolvedLook === "clean";
  const uid = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const setRoot = useRootRef(rootRef, ref);
  // The marker or chip that opened the preview – focus goes back to it when the preview closes
  const opener = useRef<HTMLElement | null>(null);
  const [hot, setHot] = useState<Hot>(null);
  const initial = defaultPreview ?? defaultOpen ?? null;
  const [wanted, setOpen] = useControllable<string | null>(
    preview,
    initial && sources.some((s) => s.id === initial) ? initial : null,
    onPreviewChange,
    "preview",
  );
  // An id that isn't among the sources shows no preview
  const open = wanted && sources.some((s) => s.id === wanted) ? wanted : null;
  // While the preview folds away it keeps showing the last source
  const [lastOpen, setLastOpen] = useState<string | null>(open);
  if (open && open !== lastOpen) setLastOpen(open);
  // The last copy attempt; `ok` is false when the clipboard refused it
  const [copied, setCopied] = useState<{ id: number; source: string; ok: boolean } | null>(null);
  const copiedSource = copied?.ok ? copied.source : null;
  const copies = useRef(0);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const chipsRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  // Clean: how many chips fit on one line – the rest goes into "+N" (which shows them all)
  const [fit, setFit] = useState(sources.length);
  const [allChips, setAllChips] = useState(false);

  // Lookups by id, and the paragraphs – worked out when the sources or segments change, not on every hover
  const index = useMemo(() => new Map(sources.map((s, i) => [s.id, i])), [sources]);
  const number = (id: string) => (index.get(id) ?? -1) + 1;
  const byId = (id: string | null | undefined) => (id == null ? null : (sources[index.get(id) ?? -1] ?? null));
  const known = (id: string) => index.has(id);

  // Clean: measure the chips at their natural width (in a hidden copy) against the width of the row
  useLayoutEffect(() => {
    const row = chipsRef.current;
    const ruler = measureRef.current;
    if (!row || !ruler) return;
    const measure = () => {
      const widths = [...ruler.querySelectorAll<HTMLElement>("[data-chip]")].map((el) => el.offsetWidth);
      const more = ruler.querySelector<HTMLElement>("[data-more]")?.offsetWidth ?? 36;
      const width = row.clientWidth;
      const total = widths.reduce((a, w) => a + w, 0) + CHIP_GAP * Math.max(0, widths.length - 1);
      if (total <= width + 0.5) return setFit(widths.length);
      let used = 0;
      let k = 0;
      for (; k < widths.length; k++) {
        const next = used + (k ? CHIP_GAP : 0) + widths[k];
        if (next + CHIP_GAP + more > width) break;
        used = next;
      }
      setFit(Math.max(1, k));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(row);
    // Web fonts change the widths once they arrive
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [sources, clean]);
  const visible = !clean || allChips ? sources.length : Math.min(fit, sources.length);
  const hidden = sources.length - visible;

  const { paragraphs, sentences, cited } = useMemo(() => {
    // Group the segments into paragraphs, remembering each one's index
    const paragraphs: { seg: CitedSegment; index: number }[][] = [];
    segments.forEach((seg, index) => {
      if (seg.paragraph || paragraphs.length === 0) paragraphs.push([]);
      paragraphs[paragraphs.length - 1].push({ seg, index });
    });
    const sentences = segments.filter((s) => s.text.trim()).length;
    const cited = segments.filter((s) => s.text.trim() && s.cite?.some((id) => index.has(id))).length;
    return { paragraphs, sentences, cited };
  }, [segments, index]);
  const citing = (id: string) => segments.filter((s) => s.cite?.includes(id));

  const toggle = (id: string, from?: HTMLElement) => {
    if (from) opener.current = from;
    setOpen(open === id ? null : id);
  };
  /** Where focus goes when the preview of `id` closes: what opened it, else its chip, else its first marker */
  const returnTo = (id: string) => {
    const back = opener.current;
    if (back?.isConnected && back.getAttribute("data-source") === id) return back;
    return (
      chipsRef.current?.querySelector<HTMLElement>(`[data-source="${CSS.escape(id)}"]`) ??
      rootRef.current?.querySelector<HTMLElement>(`.ui-ca__marker[data-source="${CSS.escape(id)}"]`) ??
      null
    );
  };
  const close = () => {
    if (!open) return;
    const was = open;
    setOpen(null);
    rescueFocus(rootRef.current, [returnTo(was)]);
  };
  // Safety net: a preview closed from outside (controlled) while focus was in it
  const lastShown = useRef<string | null>(null);
  useLayoutEffect(() => {
    if (open) lastShown.current = open;
  });
  useFocusRescue(rootRef, { fallback: () => (lastShown.current ? returnTo(lastShown.current) : null) });
  // Clean's "+N" goes away when pressed: focus moves to the first chip it revealed
  const revealFrom = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (!allChips || revealFrom.current === null) return;
    const from = revealFrom.current;
    revealFrom.current = null;
    chipsRef.current?.querySelectorAll<HTMLElement>(".ui-ca__chip")[from]?.focus({ preventScroll: true });
  }, [allChips]);

  const copyQuote = async (s: CitedSource) => {
    const text = `“${s.quote ?? s.title}” – ${s.title}, ${s.site}${s.url ? ` (${s.url})` : ""}`;
    let ok = true;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Denied, or no clipboard at all (insecure page): no check, the caption says so
      ok = false;
    }
    if (alive.current) setCopied({ id: ++copies.current, source: s.id, ok });
  };
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDownProp?.(e);
    if (e.defaultPrevented) return;
    if (e.key === "Escape" && open) {
      e.stopPropagation();
      close();
    }
  };
  // Arrow keys walk along the chips (and Clean's "+N" at the end)
  const onChipKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const items = [...(chipsRef.current?.querySelectorAll<HTMLElement>(".ui-ca__chip, .ui-ca__more") ?? [])];
    const i = items.indexOf(e.currentTarget);
    const last = items.length - 1;
    const to =
      e.key === "ArrowRight" ? Math.min(last, i + 1)
      : e.key === "ArrowLeft" ? Math.max(0, i - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? last
      : null;
    if (to === null || i < 0) return;
    e.preventDefault();
    items[to]?.focus();
  };

  /* ---------- Who lights up ---------- */

  const focusSource = hot?.source ?? null;
  const segState = (seg: CitedSegment, index: number) => {
    if (hot) {
      if (hot.segment !== undefined) return hot.segment === index ? "hl" : undefined;
      return seg.cite?.includes(hot.source) ? "hl" : "dim";
    }
    if (open && seg.cite?.includes(open)) return "hl";
    return undefined;
  };

  /* ---------- What the tray (Clean: the card's last row) says ---------- */

  const { caption, captionKey, captionTone } = trayCaption({
    copied,
    hot,
    hotSource: byId(focusSource),
    openSource: byId(open),
    cited,
    sentences,
    citedIn: (id) => citing(id).length,
  });

  const shown = byId(open ?? lastOpen);
  const previewId = `${uid}-preview`;
  const meta = [
    `${sources.length} ${sources.length === 1 ? "source" : "sources"}`,
    pagesRead !== undefined ? `${pagesRead} ${pagesRead === 1 ? "page" : "pages"} read` : null,
  ].filter(Boolean) as string[];

  // The sources as chips – Standard: on the tray below the card; Clean: one row of tab chips under the answer,
  // whatever doesn't fit goes into "+N"
  const chips = (
    <SourceChips
      chipsRef={chipsRef}
      sources={sources}
      visible={visible}
      hidden={hidden}
      all={clean && allChips}
      focusSource={focusSource}
      open={open}
      previewId={previewId}
      onHot={setHot}
      onChipKey={onChipKey}
      onToggle={toggle}
      onMore={() => {
        revealFrom.current = visible;
        setAllChips(true);
      }}
    />
  );

  return (
    <div
      role="group"
      aria-label="Answer with sources"
      {...rest}
      ref={setRoot}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={resolvedLook}
      data-hot={hot ? (hot.segment !== undefined ? "mark" : "source") : undefined}
      onKeyDown={onKeyDown}
    >
      <style href="ui-cited-answer" precedence="default">
        {css}
      </style>

      <div className={clean ? "ui-ca__body" : "ui-ca__card"}>
        <div className="ui-ca__head">
          <span className="ui-ca__stack" aria-hidden="true">
            {sources.slice(0, 3).map((s) => (
              <SourceGlyph key={s.id} source={s} />
            ))}
          </span>
          <span className="ui-ca__meta">
            {meta.map((m, i) => (
              <span key={m}>
                {i > 0 && <span className="ui-ca__dot"> · </span>}
                {m}
              </span>
            ))}
          </span>
        </div>

        <AnswerText
          paragraphs={paragraphs}
          hot={hot}
          open={open}
          previewId={previewId}
          segState={segState}
          known={known}
          byId={byId}
          number={number}
          onHot={setHot}
          onToggle={toggle}
        />

        {clean && chips}
        {clean && (
          // A hidden copy of the chips at their natural width – measured to know how many fit
          <div className="ui-ca__ruler" ref={measureRef} aria-hidden="true">
            {sources.map((s, i) => (
              <span key={s.id} className="ui-ca__chip" data-chip="">
                <SourceGlyph source={s} />
                <span className="ui-ca__chip-name">{s.site}</span>
                <span className="ui-ca__chip-num">{i + 1}</span>
              </span>
            ))}
            <span className="ui-ca__more" data-more="">
              +{sources.length}
            </span>
          </div>
        )}

        {/* The preview unfolds below the answer (Clean: below the sources); switching sources crossfades its content */}
        <div
          id={previewId}
          className="ui-ca__fold"
          data-open={open ? "" : undefined}
          inert={!open}
          role="region"
          aria-label={shown ? `Source ${number(shown.id)}: ${shown.site}` : "Source"}
        >
          <div className="ui-ca__clip">
            {shown && (
              <SourcePreview
                key={shown.id}
                source={shown}
                look={resolvedLook}
                number={number(shown.id)}
                answer={citing(shown.id)
                  .map((seg) => seg.text)
                  .join(" ")}
                copied={copiedSource === shown.id}
                onOpenSource={onOpenSource}
                onCopy={() => copyQuote(shown)}
                onClose={close}
              />
            )}
          </div>
        </div>
      </div>

      {/* Standard: the tray below the card – the sources as chips, then a line that says what you are pointing at */}
      {!clean && chips}

      {/* Clean: the last row of the card – what you are pointing at, and the action */}
      <div className="ui-ca__foot">
        {/* Only results are announced (the caption also follows the pointer) */}
        <span className="ui-ca__sr" role="status">
          {copied ? (copied.ok ? "Quote copied" : "Couldn't copy the quote") : ""}
        </span>
        <span className="ui-ca__caption">
          <Swap id={captionKey} tone={captionTone}>
            {caption}
          </Swap>
        </span>
        {action && (
          <button type="button" className="ui-ca__action" onClick={action.onClick}>
            {action.label}
            <Icon name="arrow" look={resolvedLook} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- Shared helpers (inlined from src/internal) ---------- */

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
.ui-ca:where([data-look="standard"]),
.ui-ca__portal:where([data-look="standard"]) {
  --_tc-accent: #2f68ff;
  --_tc-accent-highlight: light-dark(rgba(47, 107, 255, 0.16), rgba(109, 139, 255, 0.26));
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-action-ghost-fg: light-dark(#404040, #c8c8cc);
  --_tc-action-secondary-bg: light-dark(#ffffff, #232326);
  --_tc-action-secondary-fg: light-dark(#171717, #ededed);
  --_tc-action-secondary-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-border-selected: light-dark(#2f68ff, #6b95ff);
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 32px;
  --_tc-control-h-sm: 28px;
  --_tc-control-px-md: 12px;
  --_tc-control-radius-md: 10px;
  --_tc-control-radius-sm: 8px;
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.12));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-2xs: 10px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-md-plus: 13.5px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-sm-plus: 12.5px;
  --_tc-font-size-xs: 11px;
  --_tc-font-size-xs-plus: 11.5px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-hairline: 1px;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-line-height-none: 1;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-tight: 16px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-surface-inverse: light-dark(#171717, #ededed);
  --_tc-surface-on-tray: light-dark(#ffffff, #232326);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-tray: light-dark(#f0f0f0, #19191b);
  --_tc-text-disabled: light-dark(#a3a3a3, #5c5c63);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-on-accent: #ffffff;
  --_tc-text-on-inverse: light-dark(#ffffff, #111113);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
}
.ui-ca:where([data-look="clean"]),
.ui-ca__portal:where([data-look="clean"]) {
  --_tc-accent: light-dark(#0060e2, #1a6cf0);
  --_tc-accent-highlight: light-dark(rgba(0, 96, 226, 0.12), rgba(77, 141, 255, 0.24));
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-action-ghost-fg: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-action-secondary-bg: light-dark(#ffffff, #252527);
  --_tc-action-secondary-fg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-action-secondary-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-border-selected: light-dark(#0060e2, #5b9aff);
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 28px;
  --_tc-control-h-sm: 24px;
  --_tc-control-px-md: 10px;
  --_tc-control-radius-md: 6px;
  --_tc-control-radius-sm: 6px;
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-2xs: 10px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-md-plus: 13.5px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-sm-plus: 12.5px;
  --_tc-font-size-xs: 11px;
  --_tc-font-size-xs-plus: 11.5px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-semibold: 600;
  --_tc-hairline: 0.5px;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-line-height-none: 1;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-line-height-tight: 16px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-surface-inverse: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-surface-on-tray: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-tray: light-dark(#f7f7f7, #161618);
  --_tc-text-disabled: light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3));
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-on-accent: #ffffff;
  --_tc-text-on-inverse: light-dark(#fcfcfc, #161618);
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(10px + 4px);
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

:where([data-look="standard"], [data-look="standard"] *).ui-ca {
  /* insets and hover fills: a light grey on the card, lighter than the card in dark mode */
  --tc-cited-answer-well: light-dark(#f4f4f5, #222225);
  box-sizing: border-box;
  width: 100%;
  max-width: 460px;
  min-width: 0;
  container-type: inline-size;
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-surface-tray, var(--_tc-surface-tray));
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-ca */
:where([data-look="clean"], [data-look="clean"] *).ui-ca {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 460px;
  min-width: 0;
  container-type: inline-size;
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised));
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.ui-ca *, .ui-ca *::before, .ui-ca *::after { box-sizing: border-box; }
:where(.ui-ca) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-ca :is(button, a):focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
.ui-ca__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-ca svg { display: block; flex: none; }
.ui-ca b { font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* Letter glyphs on a soft tint – stand-ins for favicons */
:where([data-look="standard"], [data-look="standard"] *).ui-ca [data-tone="blue"] { --tc-cited-answer-glyph-fg: light-dark(#1f55d6, #9bb8ff); --tc-cited-answer-glyph-bg: light-dark(rgba(47, 107, 255, 0.12), rgba(79, 130, 255, 0.2)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca [data-tone="violet"] { --tc-cited-answer-glyph-fg: light-dark(#6941c6, #c3b1ff); --tc-cited-answer-glyph-bg: light-dark(rgba(124, 92, 255, 0.13), rgba(124, 92, 255, 0.22)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca [data-tone="green"] { --tc-cited-answer-glyph-fg: light-dark(#18794e, #6ee7a8); --tc-cited-answer-glyph-bg: light-dark(rgba(34, 160, 90, 0.13), rgba(34, 160, 90, 0.2)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca [data-tone="amber"] { --tc-cited-answer-glyph-fg: light-dark(#96590a, #f5c264); --tc-cited-answer-glyph-bg: light-dark(rgba(240, 160, 32, 0.18), rgba(240, 160, 32, 0.2)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca [data-tone="gray"] { --tc-cited-answer-glyph-fg: light-dark(#5f5f66, #b4b4bb); --tc-cited-answer-glyph-bg: light-dark(rgba(110, 110, 120, 0.12), rgba(110, 110, 120, 0.22)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__glyph { display: grid; flex: none; place-items: center; width: 16px; height: 16px; overflow: hidden; border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); background: var(--tc-cited-answer-glyph-bg); font-size: 9.5px; font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); line-height: var(--tc-line-height-none, var(--_tc-line-height-none)); color: var(--tc-cited-answer-glyph-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__dot { color: var(--tc-text-disabled, var(--_tc-text-disabled)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__icon { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; }
/* Letter glyphs on a light tint – stand-ins for favicons */
:where([data-look="clean"], [data-look="clean"] *).ui-ca [data-tone="blue"] { --tc-cited-answer-glyph-fg: light-dark(#1f5fd1, #9bbcff); --tc-cited-answer-glyph-bg: light-dark(rgba(0, 96, 226, 0.08), rgba(77, 141, 255, 0.16)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca [data-tone="violet"] { --tc-cited-answer-glyph-fg: light-dark(#6a4fd0, #c3b4ff); --tc-cited-answer-glyph-bg: light-dark(rgba(110, 86, 230, 0.09), rgba(124, 92, 255, 0.18)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca [data-tone="green"] { --tc-cited-answer-glyph-fg: light-dark(#1a8a4a, #6ee7a8); --tc-cited-answer-glyph-bg: light-dark(rgba(26, 154, 82, 0.09), rgba(34, 160, 90, 0.16)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca [data-tone="amber"] { --tc-cited-answer-glyph-fg: light-dark(#a46a06, #f5c264); --tc-cited-answer-glyph-bg: light-dark(rgba(232, 162, 12, 0.12), rgba(240, 160, 32, 0.16)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca [data-tone="gray"] { --tc-cited-answer-glyph-fg: light-dark(rgba(0, 0, 0, 0.55), rgba(255, 255, 255, 0.62)); --tc-cited-answer-glyph-bg: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__glyph { display: grid; flex: none; place-items: center; width: 16px; height: 16px; overflow: hidden; border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); background: var(--tc-cited-answer-glyph-bg); font-size: 9.5px; font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-none, var(--_tc-line-height-none)); color: var(--tc-cited-answer-glyph-fg); }
.ui-ca__glyph > :is(img, svg) { width: 100%; height: 100%; object-fit: cover; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__card { padding: 12px 16px 14px; border-radius: var(--tc-card-radius, var(--_tc-card-radius)); background: var(--tc-surface-on-tray, var(--_tc-surface-on-tray)); box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow)); }
/* ----- Head ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-ca__head { display: flex; align-items: center; gap: 8px; min-height: 22px; }
/* Everything above the last row */
:where([data-look="clean"], [data-look="clean"] *).ui-ca__body { padding: 16px 20px 16px; }
/* ----- Head ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-ca__head { display: flex; align-items: center; gap: 8px; height: 16px; }
.ui-ca__stack { display: flex; flex: none; }
.ui-ca__stack .ui-ca__glyph { box-shadow: 0 0 0 1.5px var(--tc-surface-raised, var(--_tc-surface-raised)); }
.ui-ca__stack .ui-ca__glyph + .ui-ca__glyph { margin-left: -4px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__meta { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
/* ----- Answer ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-ca__text { margin-top: 8px; color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__p { margin: 0; font-size: var(--tc-font-size-md-plus, var(--_tc-font-size-md-plus)); line-height: var(--tc-line-height-relaxed, var(--_tc-line-height-relaxed)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__meta { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
/* ----- Answer ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-ca__text { margin-top: 12px; color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__p { margin: 0; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-relaxed, var(--_tc-line-height-relaxed)); }
.ui-ca__p + .ui-ca__p { margin-top: 10px; }
.ui-ca__seg { margin: 0 -2px; padding: 2px 2px; border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); -webkit-box-decoration-break: clone; box-decoration-break: clone; transition: background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__seg[data-hl] { background: var(--tc-accent-highlight, var(--_tc-accent-highlight)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* Sentences that don't cite the source in focus step back – to muted, still readable */
.ui-ca__seg[data-dim] { color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__seg[data-hl] { background: var(--tc-accent-highlight, var(--_tc-accent-highlight)); color: var(--tc-text-strong, var(--_tc-text-strong)); }
.ui-ca__keep { white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__marker { position: relative; display: inline-grid; place-items: center; min-width: 16px; height: 16px; margin-left: 3px; padding: 0 4px; border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); background: var(--tc-cited-answer-well); box-shadow: inset 0 0 0 1px var(--tc-border-default, var(--_tc-border-default)); font-size: 10.5px; font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); vertical-align: 1px; font-variant-numeric: tabular-nums; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
/* Citation markers: the gray tab look; the linked one gets a touch darker */
:where([data-look="clean"], [data-look="clean"] *).ui-ca__marker { position: relative; display: inline-grid; place-items: center; min-width: 16px; height: 16px; margin-left: 3px; padding: 0 4px; border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); background: var(--tc-fill-default, var(--_tc-fill-default)); box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-border-default, var(--_tc-border-default)); font-size: var(--tc-font-size-2xs, var(--_tc-font-size-2xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); vertical-align: 1px; font-variant-numeric: tabular-nums; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-ca__marker + .ui-ca__marker { margin-left: 2px; }
.ui-ca__marker::after { content: ""; position: absolute; inset: -4px -2px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__marker:hover,
:where([data-look="standard"], [data-look="standard"] *).ui-ca__marker[data-lit] { background: var(--tc-accent, var(--_tc-accent)); box-shadow: inset 0 0 0 1px var(--tc-accent, var(--_tc-accent)); color: var(--tc-text-on-accent, var(--_tc-text-on-accent)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__marker[aria-expanded="true"] { background: var(--tc-surface-inverse, var(--_tc-surface-inverse)); box-shadow: inset 0 0 0 1px var(--tc-surface-inverse, var(--_tc-surface-inverse)); color: var(--tc-text-on-inverse, var(--_tc-text-on-inverse)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__marker:hover,
:where([data-look="clean"], [data-look="clean"] *).ui-ca__marker[data-lit] { background: var(--tc-fill-strong, var(--_tc-fill-strong)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* The open one is the chosen state: accent */
:where([data-look="clean"], [data-look="clean"] *).ui-ca__marker[aria-expanded="true"] { background: var(--tc-accent, var(--_tc-accent)); box-shadow: none; color: var(--tc-text-on-accent, var(--_tc-text-on-accent)); }
.ui-ca__marker[data-dim]:not([aria-expanded="true"]) { color: var(--tc-text-muted, var(--_tc-text-muted)); }
/* ----- Preview: unfolds in place, nothing travels ----- */
.ui-ca__fold { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-ca__fold[data-open] { grid-template-rows: 1fr; opacity: 1; transition: grid-template-rows var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)) var(--tc-duration-instant, var(--_tc-duration-instant)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__clip { min-height: 0; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__preview { margin-top: 12px; padding: 10px 12px 12px; border-radius: var(--tc-radius-xl, var(--_tc-radius-xl)); background: var(--tc-cited-answer-well); animation: ui-ca-swap-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__pv-head { display: flex; align-items: center; gap: 8px; height: 22px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__pv-meta { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; }
/* ----- Sources: one row of tab chips ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-ca__chips { display: flex; gap: ${CHIP_GAP}px; margin-top: 16px; min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__chips[data-all] { flex-wrap: wrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__chip-item { display: flex; flex: none; min-width: 0; max-width: 100%; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__chip-item:only-child,
:where([data-look="clean"], [data-look="clean"] *).ui-ca__chips:not([data-all]) .ui-ca__chip-item:first-child:nth-last-child(2) { flex: 0 1 auto; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__chip { display: inline-flex; align-items: center; gap: 6px; min-width: 0; max-width: 100%; height: 28px; padding: 0 8px 0 6px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-border-default, var(--_tc-border-default)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); white-space: nowrap; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__chip:hover,
:where([data-look="clean"], [data-look="clean"] *).ui-ca__chip[data-lit] { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* The open source: a fill plus a selected ring (≥ 3:1), not the fill alone */
:where([data-look="clean"], [data-look="clean"] *).ui-ca__chip[aria-expanded="true"] { background: var(--tc-fill-default, var(--_tc-fill-default)); box-shadow: inset 0 0 0 1px var(--tc-border-selected, var(--_tc-border-selected)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* Chips of other sources step back while one is in focus: muted text, faded glyph */
.ui-ca__chip[data-dim]:not([aria-expanded="true"]) { color: var(--tc-text-muted, var(--_tc-text-muted)); }
.ui-ca__chip[data-dim]:not([aria-expanded="true"]) .ui-ca__glyph { opacity: 0.5; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__chip-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__chip-num { flex: none; margin-left: -1px; font-size: var(--tc-font-size-xs, var(--_tc-font-size-xs)); font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__more { display: inline-grid; flex: none; place-items: center; height: 28px; padding: 0 8px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-border-default, var(--_tc-border-default)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); font-variant-numeric: tabular-nums; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__more:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__ruler { position: absolute; top: 0; left: 0; display: flex; gap: ${CHIP_GAP}px; height: 0; overflow: hidden; visibility: hidden; pointer-events: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__ruler > * { flex: none; }
/* A few pixels of room so the preview's shadow isn't cut off */
:where([data-look="clean"], [data-look="clean"] *).ui-ca__clip { min-height: 0; overflow: hidden; margin: 0 -4px -4px; padding: 0 4px 4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__preview { margin-top: 12px; padding: 10px 12px 12px; border-radius: var(--tc-radius-md, var(--_tc-radius-md)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); animation: ui-ca-swap-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__pv-head { display: flex; align-items: center; gap: 8px; height: 24px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__pv-meta { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; }
.ui-ca__pv-domain { color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__pv-num { display: grid; flex: none; place-items: center; min-width: 18px; height: 18px; padding: 0 5px; border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: inset 0 0 0 1px var(--tc-border-default, var(--_tc-border-default)); font-size: 10.5px; font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__close { display: grid; flex: none; place-items: center; width: 24px; height: 24px; margin-right: -5px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__close:hover { background: var(--tc-fill-default, var(--_tc-fill-default)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__pv-title { display: -webkit-box; margin-top: 6px; overflow: hidden; font-size: var(--tc-font-size-md-plus, var(--_tc-font-size-md-plus)); font-weight: var(--tc-font-weight-semibold, var(--_tc-font-weight-semibold)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-primary, var(--_tc-text-primary)); -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__quote { margin: 8px 0 0; padding: 0 0 0 10px; border-left: 2px solid var(--tc-border-default, var(--_tc-border-default)); font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__pv-num { display: grid; flex: none; place-items: center; min-width: 16px; height: 16px; padding: 0 4px; border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); background: var(--tc-fill-default, var(--_tc-fill-default)); font-size: var(--tc-font-size-2xs, var(--_tc-font-size-2xs)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__close { display: grid; flex: none; place-items: center; width: 24px; height: 24px; margin-right: -6px; border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); color: var(--tc-icon-muted, var(--_tc-icon-muted)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__close:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__pv-title { display: -webkit-box; margin-top: 6px; overflow: hidden; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-strong, var(--_tc-text-strong)); -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__quote { margin: 8px 0 0; padding: 0 0 0 10px; border-left: 2px solid var(--tc-fill-default, var(--_tc-fill-default)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
.ui-ca__quote mark { margin: 0 -1px; padding: 1px 1px; border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); background: var(--tc-accent-highlight, var(--_tc-accent-highlight)); color: var(--tc-text-primary, var(--_tc-text-primary)); -webkit-box-decoration-break: clone; box-decoration-break: clone; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__pv-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 12px; }
/* Copy quote: the library's ghost button; Open source: its secondary button */
:where([data-look="standard"], [data-look="standard"] *).ui-ca__btn { display: inline-flex; align-items: center; gap: 5px; height: var(--tc-control-h-sm, var(--_tc-control-h-sm)); padding: 0 9px; border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm)); font-size: var(--tc-control-font-size, var(--_tc-control-font-size)); font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight)); color: var(--tc-action-ghost-fg, var(--_tc-action-ghost-fg)); text-decoration: none; white-space: nowrap; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__btn:hover { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__btn--main { padding: 0 8px 0 10px; }
.ui-ca .ui-ca__btn--main { background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg)); box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow)); color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg)); }
.ui-ca .ui-ca__btn--main:hover { background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg)); box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg)); }
.ui-ca__btn--main :is(svg, .ui-ca__icon) { transition: transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-ca__btn--main:hover :is(svg, .ui-ca__icon) { transform: translate(1px, -1px); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__btn[data-done] { color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__btn-icon { display: grid; place-items: center; width: 12px; height: 12px; animation: ui-ca-swap-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
/* ----- Tray ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-ca__chips { display: flex; flex-wrap: wrap; gap: 4px; padding: 6px 4px 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__chip-item { display: flex; min-width: 0; max-width: 100%; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__chip { display: inline-flex; align-items: center; gap: 6px; min-width: 0; max-width: 100%; height: 28px; padding: 0 8px 0 6px; border-radius: var(--tc-radius-md, var(--_tc-radius-md)); font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__chip:hover,
:where([data-look="standard"], [data-look="standard"] *).ui-ca__chip[data-lit] { background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__chip[aria-expanded="true"] { background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)), inset 0 0 0 1px var(--tc-border-selected, var(--_tc-border-selected)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__chip-name { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__chip-num { flex: none; font-size: var(--tc-font-size-xs-plus, var(--_tc-font-size-xs-plus)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__foot { display: flex; align-items: center; gap: 8px; min-height: 36px; padding: 2px 4px 0 10px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__caption { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm-plus, var(--_tc-font-size-sm-plus)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__pv-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 12px; }
/* Copy quote: a ghost button; Open source: the white secondary button */
:where([data-look="clean"], [data-look="clean"] *).ui-ca__btn { display: inline-flex; align-items: center; gap: 6px; height: var(--tc-control-h-md, var(--_tc-control-h-md)); padding: 0 10px 0 8px; border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md)); font-size: var(--tc-control-font-size, var(--_tc-control-font-size)); font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-action-ghost-fg, var(--_tc-action-ghost-fg)); text-decoration: none; white-space: nowrap; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__btn .ui-ca__icon { color: var(--tc-icon-muted, var(--_tc-icon-muted)); transition: color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__btn:hover { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__btn:hover .ui-ca__icon { color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__btn[data-done],
:where([data-look="clean"], [data-look="clean"] *).ui-ca__btn[data-done] .ui-ca__icon { color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__btn-icon { display: grid; place-items: center; width: 16px; height: 16px; animation: ui-ca-swap-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
/* ----- The last row ----- */
:where([data-look="clean"], [data-look="clean"] *).ui-ca__foot { display: flex; align-items: center; gap: 12px; height: 44px; padding: 0 8px 0 20px; border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__foot:not(:has(.ui-ca__action)) { padding-right: 20px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__caption { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.ui-ca__swap { display: grid; min-width: 0; }
.ui-ca__swap-item { grid-area: 1 / 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; animation: ui-ca-swap-in var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
.ui-ca__swap-item[data-out] { animation: ui-ca-swap-out var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
.ui-ca__swap-item[data-tone="error"] { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
.ui-ca__swap-item[data-tone="ok"] { color: var(--tc-status-success-fg, var(--_tc-status-success-fg)); }
/* The tray's action: the library's ghost button */
:where([data-look="standard"], [data-look="standard"] *).ui-ca__action { display: inline-flex; flex: none; align-items: center; gap: 4px; height: var(--tc-control-h-sm, var(--_tc-control-h-sm)); padding: 0 6px 0 8px; border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm)); font-size: var(--tc-control-font-size, var(--_tc-control-font-size)); font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight)); color: var(--tc-action-ghost-fg, var(--_tc-action-ghost-fg)); white-space: nowrap; transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__action:hover { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
.ui-ca__action :is(svg, .ui-ca__icon) { transition: transform var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-move, var(--_tc-ease-move)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-ca__action:hover :is(svg, .ui-ca__icon) { transform: translateX(2px); }
/* Follow up: the secondary button, as Button draws it */
:where([data-look="clean"], [data-look="clean"] *).ui-ca__action { display: inline-flex; flex: none; align-items: center; gap: 6px; height: var(--tc-control-h-md, var(--_tc-control-h-md)); padding: 0 8px 0 var(--tc-control-px-md, var(--_tc-control-px-md)); border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md)); background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg)); box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow)); font-size: var(--tc-control-font-size, var(--_tc-control-font-size)); font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight)); line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal)); color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg)); white-space: nowrap; transition: box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__action .ui-ca__icon { color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__action:hover { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__action:hover .ui-ca__icon { color: var(--tc-text-primary, var(--_tc-text-primary)); }
@keyframes ui-ca-swap-in { from { opacity: 0; filter: blur(2px); } }
@keyframes ui-ca-swap-out { from { opacity: 1; } to { opacity: 0; filter: blur(2px); } }
/* Narrow cards: tighter padding, chip names shorten, Copy quote keeps only its icon */
@container (max-width: 360px) {
:where([data-look="standard"], [data-look="standard"] *).ui-ca__card { padding: 12px 14px 12px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__pv-num { display: none; }
}
/* Narrow cards: tighter padding, the preview drops its number tag, Copy quote keeps only its icon */
@container (max-width: 400px) {
:where([data-look="clean"], [data-look="clean"] *).ui-ca__body { padding: 14px 16px 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__foot { padding-left: 16px; }
}
@container (max-width: 360px) {
:where([data-look="clean"], [data-look="clean"] *).ui-ca__pv-num { display: none; }
}
@container (max-width: 280px) {
  .ui-ca__btn-text { display: none; }
}
@media (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-ca__marker::after { inset: -8px -5px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__chip { height: 34px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__btn { height: 34px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__close { width: 30px; height: 30px; margin-right: -7px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ca__action { height: 30px; }
}
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-ca__marker::after { inset: -8px -5px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__chip,
:where([data-look="clean"], [data-look="clean"] *).ui-ca__more { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__btn { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__close { width: 32px; height: 32px; margin-right: -8px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__action { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ca__foot { height: 52px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-ca *, .ui-ca *::before, .ui-ca *::after { animation: none !important; transition: none !important; }
}
`;
