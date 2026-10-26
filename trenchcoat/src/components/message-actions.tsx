"use client";

import {
  Fragment,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { reducedMotion } from "../internal/reduced-motion";
import { useControllable } from "../internal/use-controllable";
import { rescueFocus, useFocusRescue } from "../internal/use-focus-rescue";
import { useRootRef } from "../internal/use-root-ref";

/*
 * Message Actions – the small bar under an AI chat message, in one self-contained file.
 *   · Copy: the icon turns into a check and the tooltip says "Copied"
 *   · Regenerate: the arrow spins once; with more than one version a "‹ 2 / 3 ›" switcher unfolds next to it
 *   · Thumbs up / down fill with a little pop; thumbs down unfolds a short feedback row with reasons and a send button
 *   · Read aloud: the speaker becomes a tiny equalizer while it plays, a second press stops it
 * The bar stays quiet (its icons a step lighter) until the message is hovered or something inside it is focused.
 * MessageText (also exported) crossfades the message itself when the version changes.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: message-actions.tsx is Standard,
 * message-actions-clean.tsx is Clean). Clean uses ghost icon buttons with thin or solid 16px glyphs (Copy turns into
 * a green check), a pressed action takes the selected-tab look, the feedback reasons are tab buttons and Send is the
 * dark chip – made to sit as the last row of a white card.
 */

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-ma";
/** Other exported components render their own root, which also carries the token fallbacks */
const EXTRA_ROOT_CLASSES = ["ui-ma-text"];

export type MessageActionKey = "copy" | "regenerate" | "feedback" | "speak";
export type FeedbackKind = "up" | "down";

type MessageActionsOwnProps = {
  /** The message text – copied to the clipboard by Copy and used to time Read aloud */
  text?: string;
  /** Which actions to show, in this order */
  actions?: MessageActionKey[];
  /** All versions of the message, or just how many there are. From 2 on the version switcher shows */
  versions?: number | string[];
  /** Controlled version (0-based index) */
  version?: number;
  /** Starting version when uncontrolled – defaults to the newest */
  defaultVersion?: number;
  /** Called with the version index picked in the switcher */
  onVersionChange?: (index: number) => void;
  /** Called once `text` is on the clipboard (or right away when there's no `text`). "Copied" shows only after a successful write */
  onCopy?: (text?: string) => void;
  /**
   * Called when Regenerate is pressed – add a version and the switcher jumps to it. Return a promise to keep the
   * arrow spinning until it settles; a rejection says "Couldn't regenerate". `signal` aborts on unmount
   */
  onRegenerate?: (options: { signal: AbortSignal }) => void | Promise<unknown>;
  /** Keeps the regenerate arrow spinning while a new version is written */
  regenerating?: boolean;
  /**
   * "up" or "down" when a thumb is pressed, null when it is taken back, and "down" with a reason when the feedback
   * row is sent. Sending may return a promise: "Thanks!" shows once it resolves, and a rejection lets you send again
   */
  onFeedback?: (kind: FeedbackKind | null, reason?: string) => void | Promise<unknown>;
  /** The vote (controlled): "up", "down" or null for none. Leave undefined to let the bar keep it */
  feedback?: FeedbackKind | null;
  /** The vote to start with when uncontrolled */
  defaultFeedback?: FeedbackKind | null;
  /** Quick reasons in the feedback row. "Other" opens a small text field */
  reasons?: string[];
  /**
   * Called with true when Read aloud starts and false when it stops – play your audio here. Without it (and
   * without `speaking`) the browser's speech synthesis reads `text`; where there is none, reading is simulated
   * (and warns once, unless `demo` is set)
   */
  onSpeak?: (playing: boolean) => void;
  /** Controlled playing state, e.g. tied to your speech player */
  speaking?: boolean;
  /** How long an uncontrolled read aloud plays when it isn't the browser speaking, in ms – defaults to an estimate from `text` */
  speakDuration?: number;
  /** Demo mode: Read aloud is simulated silently where it would be simulated. For galleries and prototypes */
  demo?: boolean;
  /** Lighter icons until the message is hovered (default true). Put data-ui-message on the message wrapper */
  quiet?: boolean;
  /** Accessible name of the bar */
  label?: string;
  /** Visual style. Defaults to the file's look: Standard in message-actions.tsx, Clean in message-actions-clean.tsx */
  look?: Look;
  className?: string;
};

export type MessageActionsProps = Omit<ComponentPropsWithoutRef<"div">, keyof MessageActionsOwnProps> &
  MessageActionsOwnProps & {
    /** The root element */
    ref?: Ref<HTMLDivElement>;
  };

export type MessageTextProps = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  version: string | number;
  children: ReactNode;
  /** Visual style. Defaults to the file's look: Standard in message-actions.tsx, Clean in message-actions-clean.tsx */
  look?: Look;
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

const isPromise = (value: unknown): value is Promise<unknown> =>
  !!value && typeof (value as Promise<unknown>).then === "function";

/** A change handler for state whose changes another callback already reports (keeps useControllable from warning) */
const reportedElsewhere = () => {};

/* ---------- Helpers ---------- */

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
const synthesis = () =>
  typeof window !== "undefined" && window.speechSynthesis && typeof SpeechSynthesisUtterance !== "undefined" ? window.speechSynthesis : null;

/** Text that changes without a jump: the old one fades out underneath while the new one fades in */
function Swap({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  type Line = { id: string; node: ReactNode };
  const last = useRef<Line>({ id, node: children });
  const [shownId, setShownId] = useState(id);
  const [out, setOut] = useState<Line | null>(null);
  if (shownId !== id) {
    setShownId(id);
    setOut(last.current);
  }
  last.current = { id, node: children };
  useEffect(() => {
    if (!out) return;
    const timer = window.setTimeout(() => setOut(null), 300);
    return () => window.clearTimeout(timer);
  }, [out]);
  return (
    <span className={["ui-ma__swap", className].filter(Boolean).join(" ")}>
      {out && (
        <span key={`out-${out.id}`} className="ui-ma__swap-item" data-out="" aria-hidden="true">
          {out.node}
        </span>
      )}
      <span key={id} className="ui-ma__swap-item">
        {children}
      </span>
    </span>
  );
}

/**
 * The message itself, crossfading when `version` changes: the old text fades out underneath while the new one fades in,
 * and the block eases to its new height.
 */
export function MessageText({ version, children, look, className, style, ref, ...rest }: MessageTextProps) {
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);
  useEffect(() => {
    const el = inner.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    // A root of its own, outside the bar: the portal class gives it the per-look token fallbacks
    <div
      {...rest}
      ref={ref}
      className={["ui-ma-text", className].filter(Boolean).join(" ")}
      data-look={look ?? DEFAULT_LOOK}
      style={{ ...style, height }}
    >
      <style href="ui-message-actions" precedence="default">
        {css}
      </style>
      <div ref={inner} className="ui-ma-text__inner">
        <Swap id={String(version)} className="ui-ma-text__swap">
          {children}
        </Swap>
      </div>
    </div>
  );
}

/* ---------- Icons ---------- */

/* Standard: 24-unit outline icons drawn at 16px */
const Glyph = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="ui-ma__glyph" aria-hidden="true">
    <path d={d} />
  </svg>
);
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
const CleanGlyph = ({ d, solid }: { d: string; solid?: boolean }) => (
  <svg viewBox="0 0 16 16" className="ui-ma__glyph" data-solid={solid || undefined} aria-hidden="true">
    <path d={d} />
  </svg>
);
/** The speaker: a solid body with two thin sound waves */
const Speaker = () => (
  <svg viewBox="0 0 16 16" className="ui-ma__glyph" aria-hidden="true">
    <path className="ui-ma__fill" d="M7.4 3.2a.6.6 0 0 1 1 .46v8.68a.6.6 0 0 1-1 .46L4.6 10.5H3A1.5 1.5 0 0 1 1.5 9V7A1.5 1.5 0 0 1 3 5.5h1.6l2.8-2.3Z" />
    <path d="M10.6 6.2a2.6 2.6 0 0 1 0 3.6M12.4 4.4a5.2 5.2 0 0 1 0 7.2" />
  </svg>
);
const cleanPaths = {
  copy: "M5.5 2A1.5 1.5 0 0 0 4 3.5V4h5A3 3 0 0 1 12 7v5h.5a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 12.5 2h-7ZM3.5 5A1.5 1.5 0 0 0 2 6.5v6A1.5 1.5 0 0 0 3.5 14H9a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 9 5H3.5Z",
  check: "M1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Zm8.9-1.2a.5.5 0 0 0-.8-.6L7.44 9.23 6.35 8.15a.5.5 0 1 0-.7.7l1.5 1.5a.5.5 0 0 0 .76-.06l2.5-3.5Z",
  tick: "M3.5 8.5 6.5 11.5 12.5 4.5",
  redo: "M13 8a5 5 0 1 1-1.46-3.54M13 2.5v2.5h-2.5",
  thumb: "M4.5 7v6.5H3a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1.5Zm1 6.5h5.95a1.5 1.5 0 0 0 1.47-1.2l.86-4.3A1.5 1.5 0 0 0 12.31 6.2H9.5l.42-2.08A1.4 1.4 0 0 0 7.3 3.1L5.5 6.8v6.7Z",
  next: "M10.85 7.65a.5.5 0 0 1 0 .7L7.2 12a.5.5 0 0 1-.7-.7L9.79 8 6.5 4.7a.5.5 0 1 1 .7-.7l3.65 3.65Z",
  close: "m4.5 4.5 7 7m0-7-7 7",
};

/** Each look's icons; Clean's previous arrow is the next one, mirrored by its CSS */
const ICONS: Record<Look, Record<"copy" | "copied" | "redo" | "prev" | "next" | "thumb" | "speaker" | "close" | "sent", ReactNode>> = {
  standard: {
    copy: <Glyph d={paths.copy} />,
    copied: <Glyph d={paths.check} />,
    redo: <Glyph d={paths.redo} />,
    prev: <Glyph d={paths.prev} />,
    next: <Glyph d={paths.next} />,
    thumb: <Glyph d={paths.thumb} />,
    speaker: <Glyph d={paths.speaker} />,
    close: <Glyph d={paths.close} />,
    sent: <Glyph d={paths.check} />,
  },
  clean: {
    copy: <CleanGlyph d={cleanPaths.copy} solid />,
    copied: <CleanGlyph d={cleanPaths.check} solid />,
    redo: <CleanGlyph d={cleanPaths.redo} />,
    prev: <CleanGlyph d={cleanPaths.next} solid />,
    next: <CleanGlyph d={cleanPaths.next} solid />,
    thumb: <CleanGlyph d={cleanPaths.thumb} solid />,
    speaker: <Speaker />,
    close: <CleanGlyph d={cleanPaths.close} />,
    sent: <CleanGlyph d={cleanPaths.tick} />,
  },
};

const DEFAULT_ACTIONS: MessageActionKey[] = ["copy", "regenerate", "feedback", "speak"];
const DEFAULT_REASONS = ["Not accurate", "Too long", "Didn't follow instructions", "Other"];

/** One button with its tooltip */
function ActionButton(o: {
  name: string;
  tip: string;
  labelText: string;
  onClick: () => void;
  children: ReactNode;
  pressed?: boolean;
  flash?: boolean;
  extra?: Record<string, string | undefined>;
  expanded?: boolean;
  controls?: string;
  refEl?: Ref<HTMLButtonElement>;
}) {
  return (
    <span className="ui-ma__item" data-flash={o.flash ? "" : undefined}>
      <button
        ref={o.refEl}
        type="button"
        className={`ui-ma__btn ui-ma__btn--${o.name}`}
        aria-label={o.labelText}
        aria-pressed={o.pressed}
        aria-expanded={o.expanded}
        aria-controls={o.controls}
        onClick={o.onClick}
        {...o.extra}
      >
        {o.children}
      </button>
      <span className="ui-ma__tip" aria-hidden="true">
        <Swap id={o.tip}>{o.tip}</Swap>
      </span>
    </span>
  );
}

/** "‹ 2 / 3 ›" – unfolds next to Regenerate once there is more than one version */
function VersionSwitcher({ index, count, prev, next, onGo }: { index: number; count: number; prev: ReactNode; next: ReactNode; onGo: (i: number) => void }) {
  return (
    <span className="ui-ma__versions" data-open={count > 1 ? "" : undefined} inert={count < 2}>
      <span className="ui-ma__versions-clip" role="group" aria-label="Versions">
        <button
          type="button"
          className="ui-ma__step"
          data-dir="prev"
          data-focus-key="version-prev"
          aria-label="Previous version"
          disabled={index === 0}
          onClick={() => onGo(index - 1)}
        >
          {prev}
        </button>
        <span className="ui-ma__count" aria-label={`Version ${index + 1} of ${count}`}>
          <Swap id={String(index)} className="ui-ma__count-now">
            {index + 1}
          </Swap>
          <span aria-hidden="true">/</span>
          <Swap id={String(count)}>{count}</Swap>
        </span>
        <button
          type="button"
          className="ui-ma__step"
          data-dir="next"
          data-focus-key="version-next"
          aria-label="Next version"
          disabled={index >= count - 1}
          onClick={() => onGo(index + 1)}
        >
          {next}
        </button>
      </span>
    </span>
  );
}

/** "What went wrong?" – reasons as chips, Send, and a line of your own for "Other" */
function FeedbackPanel({
  id,
  open,
  reasons,
  reason,
  other,
  sent,
  sending,
  icons,
  onReason,
  onOther,
  onSend,
  onClose,
  onLeave,
  panelRef,
}: {
  id: string;
  open: boolean;
  reasons: string[];
  reason: string | null;
  other: string;
  sent: boolean;
  sending: boolean;
  icons: Record<"close" | "sent", ReactNode>;
  onReason: (reason: string | null) => void;
  onOther: (text: string) => void;
  onSend: () => void;
  onClose: () => void;
  /** Focus left the panel */
  onLeave: () => void;
  panelRef: Ref<HTMLDivElement>;
}) {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
    }
  };
  return (
    <div
      id={id}
      ref={panelRef}
      className="ui-ma__fold"
      data-open={open ? "" : undefined}
      inert={!open}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onLeave();
      }}
    >
      <div className="ui-ma__clip">
        <div className="ui-ma__panel" role="group" aria-labelledby={`${id}-ask`} onKeyDown={onKey}>
          <div className="ui-ma__panel-head">
            <span id={`${id}-ask`} className="ui-ma__ask">
              What went wrong?
            </span>
            <button type="button" className="ui-ma__close" aria-label="Close feedback" onClick={onClose}>
              {icons.close}
            </button>
          </div>
          <div className="ui-ma__chips">
            {reasons.map((r) => (
              <button
                key={r}
                type="button"
                className="ui-ma__chip"
                aria-pressed={reason === r}
                disabled={sent}
                onClick={() => onReason(reason === r ? null : r)}
              >
                {r}
              </button>
            ))}
            <button
              type="button"
              className="ui-ma__send"
              data-sent={sent ? "" : undefined}
              disabled={!reason}
              aria-disabled={sent || sending || undefined}
              aria-busy={sending || undefined}
              onClick={onSend}
            >
              <Swap id={sent ? "sent" : "send"}>
                {sent ? (
                  <>
                    {icons.sent}
                    Thanks!
                  </>
                ) : (
                  "Send"
                )}
              </Swap>
            </button>
          </div>
          {reasons.includes("Other") && (
            <div className="ui-ma__fold" data-open={reason === "Other" && !sent ? "" : undefined} inert={reason !== "Other" || sent}>
              <div className="ui-ma__clip">
                <input
                  className="ui-ma__input"
                  value={other}
                  placeholder="Tell us more (optional)"
                  aria-label="What went wrong, in your words"
                  onChange={(e) => onOther(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) onSend();
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Read aloud: the browser's speech synthesis when there is no onSpeak, otherwise a timed (or controlled) playing state */
function useReadAloud({
  text,
  speaking,
  speakDuration,
  demo,
  onSpeak,
  alive,
  voice,
  announce,
}: {
  text: string | undefined;
  speaking: boolean | undefined;
  speakDuration: number | undefined;
  demo: boolean;
  onSpeak: ((playing: boolean) => void) | undefined;
  alive: { current: boolean };
  voice: { current: SpeechSynthesisUtterance | null };
  announce: (s: string) => void;
}) {
  const [innerSpeaking, setInnerSpeaking] = useState(false);
  const playing = speaking ?? innerSpeaking;
  const words = text ? text.trim().split(/\s+/).length : 0;
  const duration = speakDuration ?? Math.max(2600, words * 380);
  useEffect(() => {
    // The browser's speech ends on its own
    if (speaking !== undefined || !innerSpeaking || voice.current) return;
    const t = window.setTimeout(() => {
      setInnerSpeaking(false);
      onSpeak?.(false);
      announce("Finished reading");
    }, duration);
    return () => window.clearTimeout(t);
    // onSpeak is read when the timer ends – a new function each render must not restart it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [innerSpeaking, speaking, duration]);
  /** Reads `text` with the browser's speech synthesis; playing ends with the speech */
  const say = (synth: SpeechSynthesis, line: string) => {
    const utterance = new SpeechSynthesisUtterance(line);
    const end = (finished: boolean) => {
      if (voice.current !== utterance) return;
      voice.current = null;
      if (!alive.current) return;
      setInnerSpeaking(false);
      announce(finished ? "Finished reading" : "Couldn't read aloud");
    };
    utterance.onend = () => end(true);
    utterance.onerror = () => end(false);
    voice.current = utterance;
    synth.cancel();
    synth.speak(utterance);
  };
  const speak = () => {
    const next = !playing;
    if (speaking === undefined) {
      if (!onSpeak) {
        const synth = text ? synthesis() : null;
        if (!next && voice.current) {
          voice.current = null;
          synth?.cancel();
        } else if (next && synth && text) say(synth, text);
        else if (next && !demo) warnSimulatedSpeech();
      }
      setInnerSpeaking(next);
    }
    onSpeak?.(next);
    announce(next ? "Reading aloud" : "Stopped reading");
  };
  return { playing, speak };
}

/** Regenerate: the arrow spins once per press; a promise from onRegenerate keeps it busy, a rejection says so */
function useRegenerate({
  regenerating,
  onRegenerate,
  alive,
  announce,
}: {
  regenerating: boolean;
  onRegenerate: MessageActionsProps["onRegenerate"];
  alive: { current: boolean };
  announce: (s: string) => void;
}) {
  const [spin, setSpin] = useState(0);
  const [regenPending, setRegenPending] = useState(false);
  const [regenFailed, setRegenFailed] = useState(0);
  const regenAbort = useRef<AbortController | null>(null);
  useEffect(() => () => regenAbort.current?.abort(), []);
  useEffect(() => {
    if (!regenFailed) return;
    const t = window.setTimeout(() => setRegenFailed(0), 1600);
    return () => window.clearTimeout(t);
  }, [regenFailed]);
  const busy = regenerating || regenPending;
  const regenerate = () => {
    if (regenPending) return;
    setSpin((s) => s + 1);
    setRegenFailed(0);
    announce("Regenerating");
    const controller = new AbortController();
    regenAbort.current = controller;
    const result = onRegenerate?.({ signal: controller.signal });
    if (!isPromise(result)) return;
    setRegenPending(true);
    result.then(
      () => {
        if (!alive.current) return;
        setRegenPending(false);
      },
      () => {
        if (!alive.current || controller.signal.aborted) return;
        setRegenPending(false);
        setRegenFailed((n) => n + 1);
        announce("Couldn't regenerate");
      },
    );
  };
  return { spin, busy, regenFailed, regenerate };
}

export function MessageActions({
  text,
  actions = DEFAULT_ACTIONS,
  versions,
  version,
  defaultVersion,
  onVersionChange,
  onCopy,
  onRegenerate,
  regenerating = false,
  onFeedback,
  feedback,
  defaultFeedback = null,
  reasons = DEFAULT_REASONS,
  onSpeak,
  speaking,
  speakDuration,
  demo = false,
  quiet = true,
  label = "Message actions",
  look,
  className,
  ref,
  ...rest
}: MessageActionsProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const icon = ICONS[resolvedLook];
  const uid = useId();
  const count = Math.max(1, typeof versions === "number" ? Math.floor(versions) : (versions?.length ?? 1));

  /* ----- Versions ----- */
  const [inner, setInner] = useState(() => Math.min(count - 1, Math.max(0, defaultVersion ?? count - 1)));
  const [seenCount, setSeenCount] = useState(count);
  // onFeedback is called by the handlers below (with a reason when sending), so it isn't the change callback here
  const [vote, setVote] = useControllable<FeedbackKind | null>(
    feedback,
    defaultFeedback,
    onFeedback ? reportedElsewhere : undefined,
  );
  const [panel, setPanel] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [other, setOther] = useState("");
  const [sent, setSent] = useState(false);
  if (seenCount !== count) {
    // A new version arrived: show it, and its vote starts fresh (a controlled vote is the parent's to reset)
    if (count > seenCount) {
      setInner(count - 1);
      if (feedback === undefined) setVote(null);
      setPanel(false);
    }
    setSeenCount(count);
  }
  const index = Math.min(count - 1, Math.max(0, version ?? inner));
  const goTo = (i: number) => {
    const next = Math.min(count - 1, Math.max(0, i));
    if (next === index) return;
    if (version === undefined) setInner(next);
    onVersionChange?.(next);
    announce(`Version ${next + 1} of ${count}`);
  };

  /* ----- Status line for screen readers ----- */
  const [status, setStatus] = useState("");
  const announce = (s: string) => setStatus((old) => (old === s ? `${s} ` : s));

  // Clipboard writes and speech that finish after unmount are ignored
  const alive = useRef(true);
  const voice = useRef<SpeechSynthesisUtterance | null>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      if (voice.current) {
        voice.current = null;
        synthesis()?.cancel();
      }
    };
  }, []);

  /* ----- Copy ----- */
  // A new object per attempt, so pressing again restarts the timer
  const [copyResult, setCopyResult] = useState<{ ok: boolean } | null>(null);
  const copied = copyResult?.ok === true;
  const copyFailed = copyResult?.ok === false;
  useEffect(() => {
    if (!copyResult) return;
    const t = window.setTimeout(() => setCopyResult(null), 1600);
    return () => window.clearTimeout(t);
  }, [copyResult]);
  const copy = async () => {
    if (text === undefined) {
      onCopy?.(text);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Denied, or no clipboard at all (insecure page): say so instead of a check
      if (!alive.current) return;
      setCopyResult({ ok: false });
      announce("Couldn't copy");
      return;
    }
    if (!alive.current) return;
    onCopy?.(text);
    setCopyResult({ ok: true });
    announce("Copied");
  };

  /* ----- Regenerate ----- */
  const { spin, busy, regenFailed, regenerate } = useRegenerate({ regenerating, onRegenerate, alive, announce });

  /* ----- Feedback ----- */
  const thumbsUp = () => {
    if (vote === "up") {
      setVote(null);
      onFeedback?.(null);
      return;
    }
    setVote("up");
    setPanel(false);
    onFeedback?.("up");
    announce("Marked as good response");
  };
  const thumbsDown = () => {
    if (vote === "down") {
      setVote(null);
      setPanel(false);
      onFeedback?.(null);
      return;
    }
    setVote("down");
    setPanel(true);
    setSent(false);
    setReason(null);
    setOther("");
    onFeedback?.("down");
    announce("Marked as bad response. Tell us what went wrong below");
  };
  const [sending, setSending] = useState(false);
  const send = () => {
    if (!reason || sent || sending) return;
    const result = onFeedback?.("down", reason === "Other" ? other.trim() || "Other" : reason);
    if (!isPromise(result)) {
      setSent(true);
      announce("Thanks for the feedback");
      return;
    }
    setSending(true);
    result.then(
      () => {
        if (!alive.current) return;
        setSending(false);
        setSent(true);
        announce("Thanks for the feedback");
      },
      () => {
        if (!alive.current) return;
        setSending(false);
        announce("Couldn't send the feedback. Try again");
      },
    );
  };
  // "Thanks!" folds the row away after a beat – but not while focus is inside it (WCAG 2.2.1): then it closes
  // when focus leaves, or with Esc / ×
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sent) return;
    const t = window.setTimeout(() => {
      if (!panelRef.current?.contains(document.activeElement)) setPanel(false);
    }, reducedMotion() ? 1200 : 1500);
    return () => window.clearTimeout(t);
  }, [sent]);
  const leavePanel = () => {
    if (sent) setPanel(false);
  };
  const downRef = useRef<HTMLButtonElement>(null);
  const closePanel = () => {
    // Esc / × from inside the row: focus goes back to Bad response before the row goes inert
    rescueFocus(panelRef.current, [downRef.current]);
    setPanel(false);
  };

  /* ----- Read aloud ----- */
  const { playing, speak } = useReadAloud({ text, speaking, speakDuration, demo, onSpeak, alive, voice, announce });

  const active = Boolean(copied) || panel || playing || busy;

  // Focus never drops to <body>: when the focused control folds away (the "Other" field once sent, the feedback row
  // closing, the version switcher), it goes to Send, else to Bad response, else to the bar's first button
  const rootRef = useRef<HTMLDivElement | null>(null);
  useFocusRescue(rootRef, {
    // The first / last version disables its arrow: focus goes to the other one
    fallback: (key) =>
      (key?.startsWith("version-")
        ? rootRef.current?.querySelector<HTMLElement>(`[data-focus-key="version-${key === "version-prev" ? "next" : "prev"}"]`)
        : null) ??
      (panel ? panelRef.current?.querySelector<HTMLElement>(".ui-ma__send") : null) ??
      downRef.current ??
      rootRef.current?.querySelector<HTMLElement>(".ui-ma__btn"),
  });
  const setRoot = useRootRef(rootRef, ref);

  // Tooltips hide with Esc without moving focus (WCAG 1.4.13); they come back with the next hover or focus
  const [hush, setHush] = useState(false);

  const button = ({ key, ...o }: { key: string } & Omit<Parameters<typeof ActionButton>[0], "name">) => <ActionButton key={key} name={key} {...o} />;

  const parts: ReactNode[] = actions.map((key) => {
    if (key === "copy")
      return button({
        key: "copy",
        tip: copied ? "Copied" : copyFailed ? "Couldn't copy" : "Copy",
        labelText: copied ? "Copied" : copyFailed ? "Couldn't copy" : "Copy message",
        onClick: copy,
        flash: Boolean(copied),
        extra: { "data-done": copied ? "" : undefined },
        children: (
          <span className="ui-ma__icon ui-ma__morph">
            <span className="ui-ma__layer" data-on={copied ? undefined : ""}>
              {icon.copy}
            </span>
            <span className="ui-ma__layer ui-ma__layer--check" data-on={copied ? "" : undefined}>
              {icon.copied}
            </span>
          </span>
        ),
      });
    if (key === "regenerate")
      return (
        <span className="ui-ma__regen" key="regenerate">
          {button({
            key: "regenerate",
            tip: busy ? "Writing…" : regenFailed ? "Couldn't regenerate" : "Regenerate",
            labelText: "Regenerate response",
            onClick: regenerate,
            extra: { "data-busy": busy ? "" : undefined, "aria-busy": busy ? "true" : undefined },
            children: (
              <span className="ui-ma__icon">
                <span className="ui-ma__spin" key={spin} data-spin={spin ? "" : undefined}>
                  {icon.redo}
                </span>
              </span>
            ),
          })}
          <VersionSwitcher index={index} count={count} prev={icon.prev} next={icon.next} onGo={goTo} />
        </span>
      );
    if (key === "feedback")
      return (
        <Fragment key="feedback">
          {button({
          key: "up",
          tip: vote === "up" ? "Thanks!" : "Good response",
          labelText: "Good response",
          pressed: vote === "up",
          onClick: thumbsUp,
          children: (
            <span className="ui-ma__icon ui-ma__thumb">
              {icon.thumb}
            </span>
          ),
        })}
        {button({
          key: "down",
          tip: "Bad response",
          labelText: "Bad response",
          pressed: vote === "down",
          expanded: panel,
          controls: `${uid}-feedback`,
          onClick: thumbsDown,
          refEl: downRef,
          children: (
            <span className="ui-ma__icon ui-ma__thumb">
              {icon.thumb}
            </span>
          ),
        })}
        </Fragment>
      );
    return button({
      key: "speak",
      tip: playing ? "Stop" : "Read aloud",
      labelText: playing ? "Stop reading" : "Read aloud",
      pressed: playing,
      onClick: speak,
      children: (
        <span className="ui-ma__icon ui-ma__morph">
          <span className="ui-ma__layer" data-on={playing ? undefined : ""}>
            {icon.speaker}
          </span>
          <span className="ui-ma__layer ui-ma__eq" data-on={playing ? "" : undefined}>
            <i />
            <i />
            <i />
            <i />
          </span>
        </span>
      ),
    });
  });

  return (
    <div
      {...rest}
      ref={setRoot}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={resolvedLook}
      data-quiet={quiet ? "" : undefined}
      data-active={active ? "" : undefined}
      data-hush={hush ? "" : undefined}
    >
      <style href="ui-message-actions" precedence="default">
        {css}
      </style>

      <div
        className="ui-ma__bar"
        role="group"
        aria-label={label}
        onKeyDown={(e) => {
          if (e.key === "Escape" && !hush) {
            e.stopPropagation();
            setHush(true);
          }
        }}
        onFocus={() => setHush(false)}
        onPointerEnter={() => setHush(false)}
      >
        {parts}
      </div>

      {actions.includes("feedback") && (
        <FeedbackPanel
          id={`${uid}-feedback`}
          open={panel}
          reasons={reasons}
          reason={reason}
          other={other}
          sent={sent}
          sending={sending}
          icons={icon}
          onReason={setReason}
          onOther={setOther}
          onSend={send}
          onClose={closePanel}
          onLeave={leavePanel}
          panelRef={panelRef}
        />
      )}

      <span className="ui-ma__sr" aria-live="polite">
        {status}
      </span>
    </div>
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *).ui-ma {
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
/* Colors and motion as variables – override them on .ui-ma */
:where([data-look="clean"], [data-look="clean"] *).ui-ma {
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
.ui-ma *, .ui-ma *::before, .ui-ma *::after { box-sizing: border-box; }
:where(.ui-ma) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-ma button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-ma svg { display: block; flex: none; }
.ui-ma__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* ----- The bar: quiet until the message is hovered, something inside is focused or busy ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-ma__bar { display: flex; align-items: center; gap: var(--tc-space-0-5); min-height: 30px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__bar { display: flex; align-items: center; gap: var(--tc-space-0-5); min-height: 28px; }
/* Quiet: the icons step back to the muted icon tone (≥ 3:1) instead of fading the whole bar, which took icons and
   the version count below contrast (WCAG 1.4.3 / 1.4.11) */
.ui-ma[data-quiet] { --tc-message-actions-quiet: var(--tc-icon-muted); }
.ui-ma[data-quiet]:hover,
.ui-ma[data-quiet]:focus-within,
.ui-ma[data-quiet][data-active],
:where([data-ui-message]:hover, [data-ui-message]:focus-within) .ui-ma[data-quiet] { --tc-message-actions-quiet: initial; }
.ui-ma__item { position: relative; display: inline-flex; flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__btn { display: grid; place-items: center; width: 30px; height: 30px; border-radius: var(--tc-control-radius-sm); color: var(--tc-message-actions-quiet, var(--tc-text-muted)); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__btn:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__btn { display: grid; place-items: center; width: 28px; height: 28px; border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
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
.ui-ma[data-hush] .ui-ma__item .ui-ma__tip { visibility: hidden; opacity: 0; transition: none; }
/* ----- Version switcher: unfolds next to Regenerate once there are two versions ----- */
.ui-ma__regen { display: inline-flex; align-items: center; flex: none; }
.ui-ma__versions { display: grid; grid-template-columns: 0fr; opacity: 0; transition: grid-template-columns var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-ma__versions[data-open] { grid-template-columns: 1fr; opacity: 1; transition: grid-template-columns var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-slow) var(--tc-ease-standard) var(--tc-duration-instant); }
.ui-ma__versions-clip { display: flex; align-items: center; min-width: 0; overflow: hidden; padding-left: var(--tc-space-0-5); padding-right: var(--tc-space-0-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__step { display: grid; flex: none; place-items: center; width: 24px; height: 30px; border-radius: var(--tc-control-radius-sm); color: var(--tc-text-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__step .ui-ma__glyph { width: 14px; height: 14px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__step:hover:not(:disabled) { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-ma__step:disabled { cursor: default; color: var(--tc-text-disabled); }
:where([data-look="standard"], [data-look="standard"] *).ui-ma__count { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); padding: 0 1px; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-ma__step { display: grid; flex: none; place-items: center; width: 24px; height: 28px; border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard); }
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
.ui-ma-text { overflow: hidden; transition: height var(--tc-duration-slow) var(--tc-ease-move); }
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
.ui-ma[data-quiet] { --tc-message-actions-quiet: initial; }
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
  .ui-ma *, .ui-ma *::before, .ui-ma *::after, .ui-ma-text, .ui-ma-text * { animation: none !important; transition: none !important; }
  .ui-ma__eq[data-on] i:nth-child(odd) { transform: scaleY(0.8); }
  .ui-ma__eq[data-on] i:nth-child(even) { transform: scaleY(0.5); }
}
`;
