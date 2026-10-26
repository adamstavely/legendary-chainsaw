"use client";

import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { useControllable } from "../internal/use-controllable";
import { rescueFocus, useFocusRescue } from "../internal/use-focus-rescue";
import { useRootRef } from "../internal/use-root-ref";

/*
 * Tool Call Card – one tool call of an AI agent, in a single self-contained file.
 * A header with the tool's icon, its name in mono, a short summary and the status:
 * a spinner with a live timer, a check with the duration, or "Failed". Click it open to
 * see the arguments and the result as highlighted JSON, each with a copy button; long
 * blocks are capped with a fade and "Show all". Errors show the message and a Retry button.
 * ToolCallGroup folds several cards into one line: "Used 3 tools · 2.4s".
 * `open` is controlled when defined on both, otherwise uncontrolled from `defaultOpen`; changes are always reported
 * (also the card's own open-on-error). onRetry may return a promise: Retry shows pending, and a rejection is shown
 * next to the error. Other DOM props and `ref` go to each root.
 * The styles are injected below, so no extra files are needed.
 * Two looks, picked with the `look` prop (Standard by default); ToolCallCard and ToolCallGroup each take it. Clean is one white card with
 * hairline shadows, no tile and no tray: a blue spinner and a filled blue check, a red "Failed", JSON on a faint
 * panel with small white copy and Retry buttons, and slightly different glyphs.
 */

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-tc";

export type ToolCallStatus = "running" | "success" | "error";

type ToolCallCardOwnProps = {
  /** Visual style: "standard" (the default) or "clean" */
  look?: Look;
  /** Tool name as the agent calls it, shown in mono – e.g. "search_web" */
  name: string;
  /** Short human summary – e.g. "Searched the web for 'CRM pricing 2026'" */
  summary?: ReactNode;
  /** Icon in the tile on the left – defaults to a wrench */
  icon?: ReactNode;
  status: ToolCallStatus;
  /** Arguments the tool was called with – objects are pretty-printed, JSON strings parsed */
  args?: unknown;
  /** What the tool returned – objects are pretty-printed, JSON strings parsed, other text shown as is */
  result?: unknown;
  /** Error message, shown when status is "error" */
  error?: string;
  /** When the call started (ms since epoch, e.g. Date.now()) – the live timer counts from here */
  startedAt?: number;
  /** Final duration in ms – otherwise measured while the card shows "running" */
  duration?: number;
  /** Start expanded (uncontrolled) */
  defaultOpen?: boolean;
  /** Expanded state (controlled) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Opens the card when the call fails and closes it again on the next run, unless someone toggled it */
  openOnError?: boolean;
  /** Shows a Retry button next to the error – may return a promise: Retry waits for it, a rejection is shown */
  onRetry?: () => void | Promise<unknown>;
  /** Height in px after which arguments and result are capped with a fade and "Show all" */
  maxCodeHeight?: number;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export type ToolCallCardProps = Omit<ComponentPropsWithoutRef<"div">, keyof ToolCallCardOwnProps> & ToolCallCardOwnProps;

type ToolCallGroupOwnProps = {
  /** Visual style: "standard" (the default) or "clean" */
  look?: Look;
  /** ToolCallCard elements – the group reads their name, icon, status and duration */
  children: ReactNode;
  /** Label once all calls are done – defaults to "Used 3 tools" */
  label?: string;
  /** Label while any call is running */
  runningLabel?: string;
  /** Total duration in ms – otherwise the sum of the cards' durations, or the time measured while running */
  duration?: number;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export type ToolCallGroupProps = Omit<ComponentPropsWithoutRef<"div">, keyof ToolCallGroupOwnProps> & ToolCallGroupOwnProps;

/** Set by ToolCallGroup: its cards leave announcing to the group, so nothing is said twice */
const InGroup = createContext(false);

/* ---------- Card ---------- */

export function ToolCallCard({
  look,
  name,
  summary,
  icon,
  status,
  args,
  result,
  error,
  startedAt,
  duration,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  openOnError = true,
  onRetry,
  maxCodeHeight = 220,
  className,
  ref,
  ...rest
}: ToolCallCardProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const id = useId();
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange, "open");
  const inGroup = useContext(InGroup);
  // When Retry (or anything focused in the body) goes away – the call runs again, the card closes – focus moves to
  // the header instead of falling to <body>
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rootRefCallback = useRootRef(rootRef, ref);
  const headRef = useRef<HTMLButtonElement>(null);
  useFocusRescue(rootRef, { fallback: () => headRef.current });

  // Open on failure, close again on the next run – only while uncontrolled and nobody has toggled it by hand.
  // Done before paint, and reported through onOpenChange like any other change.
  const prevStatus = useRef(status);
  const autoOpened = useRef(false);
  useLayoutEffect(() => {
    const prev = prevStatus.current;
    if (prev === status) return;
    prevStatus.current = status;
    if (openProp !== undefined || !openOnError) return;
    if (status === "error" && !open) {
      autoOpened.current = true;
      setOpen(true);
    } else if (prev === "error" && autoOpened.current) {
      autoOpened.current = false;
      setOpen(false);
    }
  }, [status, openProp, openOnError, open, setOpen]);

  // Retry may return a promise: pending until it settles, a rejection shown with the error
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (status !== "error") setRetryError(null);
  }, [status]);
  const retry = () => {
    if (!onRetry || retrying) return;
    // Retry is disabled while it runs (and goes away once the call runs again) – focus moves to the header first
    rescueFocus(rootRef.current?.querySelector(".ui-tc__retry"), [headRef.current]);
    setRetryError(null);
    let run: unknown;
    try {
      run = onRetry();
    } catch (e) {
      setRetryError(messageOf(e));
      return;
    }
    if (!run || typeof (run as Promise<unknown>).then !== "function") return;
    setRetrying(true);
    (run as Promise<unknown>).then(
      () => alive.current && setRetrying(false),
      (e: unknown) => {
        if (!alive.current) return;
        setRetrying(false);
        setRetryError(messageOf(e));
      },
    );
  };

  // While running, the timer's text is written straight into the DOM – the card itself doesn't re-render
  const [measured, timeRef] = useStopwatch(status === "running", startedAt, false, liveCard);
  const ms = status === "running" ? (measured ?? 0) : (duration ?? measured);

  // Only the outcome is announced (not "running"); inside a group, the group says it once for all its cards
  const announce = inGroup || status === "running" ? "" : status === "success" ? `${name} finished` : `${name} failed${error ? `: ${error}` : ""}`;

  return (
    <div
      {...rest}
      ref={rootRefCallback}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={resolvedLook}
      data-status={status}
      data-open={open || undefined}
    >
      {/* React 19 hoists this into <head> once, no matter how many cards render */}
      <style href="ui-tool-call" precedence="default">
        {css}
      </style>
      <span className="ui-tc-sr" role="status">
        {announce}
      </span>

      <button
        ref={headRef}
        type="button"
        className="ui-tc__head"
        aria-expanded={open}
        aria-controls={`${id}-body`}
        onClick={() => {
          autoOpened.current = false;
          setOpen(!open);
        }}
      >
        <span className="ui-tc__icon" aria-hidden="true">
          {icon ?? <WrenchIcon />}
        </span>
        <span className="ui-tc__main">
          <code className="ui-tc__name" title={name}>
            {name}
          </code>
          {summary != null && (
            <span className="ui-tc__summary" title={typeof summary === "string" ? summary : undefined}>
              {summary}
            </span>
          )}
        </span>
        <span className="ui-tc__status" key={status}>
          {status === "running" && <Spinner look={resolvedLook} />}
          {status === "success" && (
            <svg className="ui-tc__ok" viewBox="0 0 16 16" aria-hidden="true">
              {resolvedLook === "clean" ? (
                <>
                  <circle cx="8" cy="8" r="7" />
                  <path d="M5.1 8.2 7.1 10.1 10.9 6" pathLength={1} />
                </>
              ) : (
                <path d="M3.5 8.4 6.6 11.3 12.5 4.9" pathLength={1} />
              )}
            </svg>
          )}
          {status === "error" && <ErrorIcon look={resolvedLook} />}
          {/* The live timer changes ten times a second – it stays out of the button's name while it runs */}
          <span className="ui-tc__time" ref={timeRef} aria-hidden={status === "running" || undefined}>
            {status === "error" ? "Failed" : ms != null ? formatMs(ms, status === "running") : null}
          </span>
          {status === "running" && <span className="ui-tc-sr">running</span>}
        </span>
        <Chevron look={resolvedLook} />
      </button>

      <div className="ui-tc__body" id={`${id}-body`} inert={!open}>
        <div className="ui-tc__clip">
          <div className="ui-tc__sections">
            {status === "error" && (
              <div className="ui-tc__error">
                <ErrorIcon look={resolvedLook} />
                <p className="ui-tc__error-text" role={retryError ? "alert" : undefined}>
                  {retryError ? `Retry failed: ${retryError}` : (error ?? "The tool call failed.")}
                </p>
                {onRetry && (
                  <button type="button" className="ui-tc__retry" onClick={retry} disabled={retrying} aria-busy={retrying || undefined}>
                    <svg viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M2.75 8a5.25 5.25 0 1 0 1.6-3.77" />
                      <path d="M2.5 2.5v2.75h2.75" />
                    </svg>
                    Retry
                  </button>
                )}
              </div>
            )}
            {args !== undefined && <CodeSection label="Arguments" value={args} cap={maxCodeHeight} look={resolvedLook} />}
            {result !== undefined ? (
              <CodeSection label="Result" value={result} cap={maxCodeHeight} look={resolvedLook} />
            ) : status === "running" ? (
              <div className="ui-tc__section">
                <div className="ui-tc__section-head">
                  <span className="ui-tc__label">Result</span>
                </div>
                <p className="ui-tc__pending">Waiting for result…</p>
              </div>
            ) : null}
            {args === undefined && result === undefined && status === "success" && (
              <p className="ui-tc__pending">No arguments or result.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Group ---------- */

export function ToolCallGroup({
  look,
  children,
  label,
  runningLabel = "Using tools…",
  duration,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  className,
  ref,
  ...rest
}: ToolCallGroupProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const id = useId();
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange, "open");

  // Read the cards' props to summarise them in the header
  const calls = Children.toArray(children)
    .filter(isValidElement)
    .map((c) => (c as ReactElement<Partial<ToolCallCardProps>>).props);
  const running = calls.some((c) => c.status === "running");
  const failed = calls.filter((c) => c.status === "error").length;

  // Time spent with tools running, added up across stretches (e.g. a pause before a retry)
  const [measured, timeRef] = useStopwatch(running, undefined, true, liveGroup);
  const sum = calls.length && calls.every((c) => c.duration != null) ? calls.reduce((t, c) => t + (c.duration ?? 0), 0) : null;
  // Running: the span is always there (one text node), and the stopwatch writes the live value into it
  const ms = running ? (measured ?? 0) : (duration ?? sum ?? measured);

  const count = `Used ${calls.length} ${calls.length === 1 ? "tool" : "tools"}`;
  const title = running ? runningLabel : (label ?? count);
  const icons = calls.slice(-3);

  return (
    <div
      {...rest}
      ref={ref}
      className={["ui-tc-group", className].filter(Boolean).join(" ")}
      data-look={resolvedLook}
      data-running={running || undefined}
      data-open={open || undefined}
    >
      <style href="ui-tool-call" precedence="default">
        {css}
      </style>
      {/* Mounted from the start; says the outcome once all calls are done (its cards stay quiet) */}
      <span className="ui-tc-sr" role="status">
        {running ? "" : `${count}${failed ? `, ${failed} failed` : ""}`}
      </span>

      <button
        type="button"
        className="ui-tc-group__head"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        onClick={() => setOpen(!open)}
      >
        <span className="ui-tc-group__stack" aria-hidden="true">
          {icons.map((c, i) => (
            <span className="ui-tc__icon" key={calls.length - icons.length + i}>
              {c.icon ?? <WrenchIcon />}
            </span>
          ))}
        </span>
        <span className="ui-tc-group__title" key={running ? "busy" : "done"}>
          <span className={running ? "ui-tc-group__label ui-tc__shine" : "ui-tc-group__label"} data-text={title}>
            {title}
          </span>
          {!running && failed > 0 && <span className="ui-tc-group__failed">· {failed} failed</span>}
          {ms != null && (
            <span className="ui-tc-group__time" ref={timeRef} aria-hidden={running || undefined}>
              {liveGroup(ms, running)}
            </span>
          )}
        </span>
        <Chevron look={resolvedLook} />
      </button>

      <div className="ui-tc__body" id={`${id}-list`} inert={!open}>
        <div className="ui-tc__clip">
          <div className="ui-tc-group__list">
            <InGroup.Provider value={true}>{children}</InGroup.Provider>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Pieces ---------- */

function CodeSection({ label, value, cap, look }: { label: string; value: unknown; cap: number; look: Look }) {
  // Pretty-printing is keyed on the value, highlighting on the text – a parent passing a fresh but equal object
  // each render re-stringifies at most, it never rebuilds the highlighted nodes
  const { text, json } = useMemo(() => toText(value), [value]);
  const code = useMemo(() => (json ? highlight(text) : text), [text, json]);
  const pre = useRef<HTMLPreElement>(null);
  const [full, setFull] = useState(false);
  const [height, setHeight] = useState(0);

  // Natural height of the block – decides whether it needs the cap and how far "Show all" opens
  useLayoutEffect(() => {
    const el = pre.current;
    const inner = el?.firstElementChild;
    if (!el || !inner) return;
    const measure = () => setHeight(el.scrollHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [text]);

  const capped = height > cap + 24;

  return (
    <div className="ui-tc__section">
      <div className="ui-tc__section-head">
        <span className="ui-tc__label">{label}</span>
        <CopyButton text={text} label={label.toLowerCase()} look={look} />
      </div>
      <pre
        ref={pre}
        className="ui-tc__code"
        data-capped={(capped && !full) || undefined}
        style={capped ? { maxHeight: full ? height : cap } : undefined}
      >
        <code>{code}</code>
      </pre>
      {capped && (
        <button type="button" className="ui-tc__more" aria-expanded={full} onClick={() => setFull(!full)}>
          {full ? "Show less" : "Show all"}
        </button>
      )}
    </div>
  );
}

function CopyButton({ text, label, look }: { text: string; label: string; look: Look }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1400);
    return () => window.clearTimeout(t);
  }, [copied]);

  return (
    <>
    {/* "Copied" is announced here, not by renaming the focused button */}
    <span className="ui-tc-sr" role="status">
      {copied ? "Copied" : ""}
    </span>
    <button
      type="button"
      className="ui-tc__copy"
      data-copied={copied || undefined}
      aria-label={`Copy ${label}`}
      title={copied ? "Copied" : `Copy ${label}`}
      onClick={() => copyText(text).then((ok) => ok && setCopied(true))}
    >
      <svg className="ui-tc__copy-icon" viewBox="0 0 16 16" aria-hidden="true">
        {look === "clean" ? (
          <>
            <rect x="5.5" y="5.5" width="8.5" height="8.5" rx="2" />
            <path d="M10.5 3.75v-.25A1.5 1.5 0 0 0 9 2H3.5A1.5 1.5 0 0 0 2 3.5V9a1.5 1.5 0 0 0 1.5 1.5h.25" />
          </>
        ) : (
          <>
            <rect x="5.25" y="5.25" width="8" height="8" rx="2" />
            <path d="M10.75 5.25v-1a1.5 1.5 0 0 0-1.5-1.5h-4.5a2 2 0 0 0-2 2v4.5a1.5 1.5 0 0 0 1.5 1.5h1" />
          </>
        )}
      </svg>
      <svg className="ui-tc__copy-done" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M3.5 8.4 6.6 11.3 12.5 4.9" pathLength={1} />
      </svg>
    </button>
    </>
  );
}

function Spinner({ look }: { look: Look }) {
  const clean = look === "clean";
  return (
    <svg className="ui-tc__spinner" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r={clean ? 6 : 5.75} />
      <path d={clean ? "M8 2a6 6 0 0 1 6 6" : "M8 2.25a5.75 5.75 0 0 1 5.75 5.75"} />
    </svg>
  );
}

function ErrorIcon({ look }: { look: Look }) {
  const clean = look === "clean";
  return (
    <svg className="ui-tc__err" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r={clean ? 7 : 6} />
      <path d={clean ? "M8 4.9v3.5M8 10.9v.1" : "M8 5v3.4M8 10.9v.1"} />
    </svg>
  );
}

function Chevron({ look }: { look: Look }) {
  return look === "clean" ? (
    <svg className="ui-tc__chevron" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3.5 5.25 6 7.75l2.5-2.5" />
    </svg>
  ) : (
    <svg className="ui-tc__chevron" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M4.5 6.25 8 9.75l3.5-3.5" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg viewBox="0 0 16 16">
      <path d="M10.2 2.4a3.5 3.5 0 0 0-4.3 4.6L2.6 10.3a1.4 1.4 0 0 0 2 2L7.9 9a3.5 3.5 0 0 0 4.6-4.3l-2 2-1.6-.4-.4-1.6 1.7-2.3Z" />
    </svg>
  );
}

/* ---------- Helpers ---------- */

/** The time for the stopwatch – only ever read in effects and timers, never during render */
const clock = () => Date.now();

/** How the card's and the group's timers read while they run */
const liveCard = (ms: number) => formatMs(ms, true);
const liveGroup = (ms: number, live = true) => `· ${formatMs(ms, live)}`;

/**
 * Live ms while running, the final value after. accumulate = add up several running stretches.
 * The final value is state (one commit when a stretch ends); the running value never is: a 10 Hz ticker writes
 * `format(ms)` into the text node of the element behind the returned ref, and stops while the element is
 * off-screen or the tab is hidden. React must render a single text child there while running.
 */
function useStopwatch(running: boolean, startedAt: number | undefined, accumulate: boolean, format: (ms: number) => string) {
  const start = useRef<number | null>(null);
  const base = useRef(0);
  const [ms, setMs] = useState<number | null>(null);
  const text = useRef<HTMLSpanElement>(null);
  const formatRef = useRef(format);
  useLayoutEffect(() => {
    formatRef.current = format;
  });
  // The clock is read here and in the effect below, after rendering – never during it
  const paint = useCallback(() => {
    const node = text.current?.firstChild;
    if (start.current === null || !node || node.nodeType !== Node.TEXT_NODE) return;
    const value = formatRef.current(base.current + clock() - start.current);
    if (node.nodeValue !== value) node.nodeValue = value;
  }, []);
  // Started and stopped before paint, so a commit that ends a stretch never gets a live value painted over it
  useLayoutEffect(() => {
    if (!running) {
      if (start.current !== null) {
        base.current += clock() - start.current;
        start.current = null;
        setMs(base.current);
      }
      return;
    }
    if (!accumulate) base.current = 0;
    start.current = startedAt ?? clock();
    // Off-screen or in a hidden tab the ticker stops altogether; it catches up when it's seen again
    let onScreen = true;
    let t = 0;
    const sync = () => {
      const run = onScreen && document.visibilityState !== "hidden";
      if (run && !t) {
        paint();
        t = window.setInterval(paint, 100);
      } else if (!run && t) {
        window.clearInterval(t);
        t = 0;
      }
    };
    const el = text.current;
    const io =
      el && typeof IntersectionObserver === "function"
        ? new IntersectionObserver(([entry]) => {
            onScreen = entry.isIntersecting;
            sync();
          })
        : null;
    if (el) io?.observe(el);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      window.clearInterval(t);
      io?.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [running, startedAt, accumulate, paint]);
  // A commit while running re-renders the last state value – put the live one back before paint
  useLayoutEffect(paint);
  return [ms, text] as const;
}

const messageOf = (e: unknown) => (e instanceof Error && e.message ? e.message : typeof e === "string" && e ? e : "Something went wrong");

/** 0.4s, 12.3s, 2m 05s – the live timer always shows tenths below a minute */
function formatMs(ms: number, live: boolean) {
  if (!live && ms < 1000) return `${Math.max(1, Math.round(ms))}ms`;
  if (ms < 60_000) return `${(Math.floor(ms / 100) / 10).toFixed(1)}s`;
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}

function toText(value: unknown): { text: string; json: boolean } {
  if (typeof value === "string") {
    const t = value.trim();
    if (t.startsWith("{") || t.startsWith("[")) {
      try {
        return { text: JSON.stringify(JSON.parse(t), null, 2), json: true };
      } catch {
        /* not JSON – shown as plain text */
      }
    }
    return { text: value, json: false };
  }
  try {
    const s = JSON.stringify(value, null, 2);
    return s === undefined ? { text: String(value), json: false } : { text: s, json: true };
  } catch {
    return { text: String(value), json: false };
  }
}

// Strings (keys when followed by a colon), literals and numbers – everything else stays punctuation
const TOKEN = /("(?:[^"\\]|\\.)*")(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

function highlight(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = new RegExp(TOKEN.source, "g");
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] && m[2]) {
      out.push(
        <span key={m.index} className="ui-tc__t-key">
          {m[1]}
        </span>,
        m[2],
      );
    } else {
      const kind = m[1] ? "str" : /^[tfn]/.test(m[0]) ? "lit" : "num";
      out.push(
        <span key={m.index} className={`ui-tc__t-${kind}`}>
          {m[0]}
        </span>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers and non-secure contexts
    const area = document.createElement("textarea");
    area.value = text;
    area.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

/* ---------- Styles ---------- */

const css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *).ui-tc,
:where([data-look="standard"], [data-look="standard"] *).ui-tc-group {
  --tc-tool-call-card-code-bg: light-dark(#fafafa, #1d1d20);
  --tc-tool-call-card-error-bg: light-dark(rgba(200, 55, 45, 0.06), rgba(255, 110, 100, 0.08));
  --tc-tool-call-card-tc-tile: light-dark(#f5f5f5, #1d1d20);
  --tc-tool-call-card-syntax-string: light-dark(#0f7b6c, #5fd4b8);
  --tc-tool-call-card-syntax-number: light-dark(#b25b0c, #f2a65a);
  box-sizing: border-box;
  min-width: 0;
  color: var(--tc-text-muted);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-md);
  line-height: 1.4;
  letter-spacing: -0.006em;
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-tc / .ui-tc-group */
:where([data-look="clean"], [data-look="clean"] *).ui-tc,
:where([data-look="clean"], [data-look="clean"] *).ui-tc-group {
  /* The code panel: a 2% black frame, kept opaque so the fade of capped blocks can end on it */
  --tc-tool-call-card-code-bg: light-dark(#fafafa, #212123);
  --tc-tool-call-card-error-bg: light-dark(rgba(217, 58, 43, 0.04), rgba(255, 110, 100, 0.07));
  /* JSON syntax colours */
  --tc-tool-call-card-syntax-string: light-dark(rgba(0, 123, 172, 0.9), #5fc8e8);
  --tc-tool-call-card-syntax-literal: light-dark(#5b5bd6, #a5a5ff);
  --tc-tool-call-card-syntax-number: light-dark(#b25b0c, #f2a65a);
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  container-type: inline-size;
  min-width: 0;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  -webkit-font-smoothing: antialiased;
}
.ui-tc *,
.ui-tc-group * { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc {
  position: relative;
  border-radius: var(--tc-radius-xl);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc {
  position: relative;
  border-radius: var(--tc-radius-lg);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
}
.ui-tc-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
/* Header: icon, name + summary, status, chevron – everything truncates before it overflows */
:where([data-look="standard"], [data-look="standard"] *).ui-tc__head {
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  width: 100%;
  min-height: 44px;
  padding: var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-2) var(--tc-space-2);
  border-radius: var(--tc-radius-xl);
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-tc[data-open] .ui-tc__head { border-radius: var(--tc-radius-xl) var(--tc-radius-xl) 0 0; }
.ui-tc__head:focus-visible,
.ui-tc-group__head:focus-visible,
.ui-tc__copy:focus-visible,
.ui-tc__more:focus-visible,
.ui-tc__retry:focus-visible {
  outline: var(--tc-focus-outline);
  outline-offset: var(--tc-focus-ring-offset);
}
@media (hover: hover) {
:where([data-look="standard"], [data-look="standard"] *).ui-tc__head:hover { background: var(--tc-fill-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-tc-group__head:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__copy:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__more:hover { color: var(--tc-text-primary); }
}
.ui-tc__retry:disabled { opacity: 0.6; cursor: progress; }
.ui-tc__retry:not(:disabled):hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: var(--tc-radius-sm);
  background: var(--tc-tool-call-card-tc-tile);
  box-shadow: inset 0 0 0 1px var(--tc-border-default);
  color: var(--tc-text-primary);
}
:where([data-look="standard"], [data-look="standard"] *).ui-tc__icon > svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
/* Header row: icon, name + summary, status, chevron – everything truncates before it overflows */
:where([data-look="clean"], [data-look="clean"] *).ui-tc__head {
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  width: 100%;
  min-height: 44px;
  padding: 0 var(--tc-space-3-5);
  border-radius: var(--tc-radius-lg);
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), border-radius 0ms linear var(--tc-duration-slower);
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc[data-open] .ui-tc__head {
  border-radius: var(--tc-radius-lg) var(--tc-radius-lg) 0 0;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
@media (hover: hover) {
:where([data-look="clean"], [data-look="clean"] *).ui-tc__head:hover { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__head:hover .ui-tc__chevron { stroke: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-tc-group__head:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__copy:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__more:hover { color: var(--tc-text-primary); }
}
/* The tool's icon: a plain 16px glyph, no tile */
:where([data-look="clean"], [data-look="clean"] *).ui-tc__icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 16px;
  height: 16px;
  color: var(--tc-icon-muted);
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc__icon > svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.ui-tc__main {
  display: flex;
  align-items: baseline;
  gap: var(--tc-space-2);
  flex: 1;
  min-width: 0;
}
:where([data-look="standard"], [data-look="standard"] *).ui-tc__name {
  flex: 0 1 auto;
  max-width: 55%;
  overflow: hidden;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-mono);
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}
:where([data-look="standard"], [data-look="standard"] *).ui-tc__summary {
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  color: var(--tc-text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}
:where([data-look="standard"], [data-look="standard"] *).ui-tc__status {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  flex: none;
  color: var(--tc-text-muted);
  font-size: var(--tc-font-size-sm);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  animation: ui-tc-in var(--tc-duration-slow) var(--tc-ease-move) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-tc[data-status="error"] .ui-tc__status { color: var(--tc-status-danger-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__name {
  flex: 0 1 auto;
  max-width: 55%;
  overflow: hidden;
  color: var(--tc-text-strong);
  font-family: var(--tc-font-mono);
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc__summary {
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  color: var(--tc-text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc__status {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  flex: none;
  color: var(--tc-text-muted);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  animation: ui-tc-in var(--tc-duration-slow) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc[data-status="error"] .ui-tc__status { color: var(--tc-status-danger-fg); font-weight: var(--tc-font-weight-medium); }
.ui-tc__status > svg { width: 14px; height: 14px; flex: none; fill: none; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__spinner circle { stroke: currentColor; stroke-width: 1.6; opacity: 0.22; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__spinner path { stroke: var(--tc-text-primary); stroke-width: 1.6; }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__spinner circle { stroke: var(--tc-border-default); stroke-width: 1.6; }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__spinner path { stroke: var(--tc-accent-text); stroke-width: 1.6; }
.ui-tc__spinner { animation: ui-tc-spin 800ms linear infinite; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__ok { stroke: var(--tc-text-primary); stroke-width: 1.8; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__ok path { stroke-dasharray: 1; stroke-dashoffset: 1; animation: ui-tc-draw var(--tc-duration-slow) var(--tc-ease-move) 80ms forwards; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__err { stroke: var(--tc-status-danger-fg); stroke-width: 1.5; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__chevron {
  flex: none;
  width: 14px;
  height: 14px;
  fill: none;
  stroke: var(--tc-text-muted);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform var(--tc-duration-slow) var(--tc-ease-move);
}
/* Done: a solid blue dot whose white check draws itself */
:where([data-look="clean"], [data-look="clean"] *).ui-tc__ok { animation: ui-tc-pop var(--tc-duration-slower) var(--tc-ease-spring) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__ok circle { fill: var(--tc-accent-text); }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__ok path { stroke: #fff; stroke-width: 1.5; stroke-dasharray: 1; stroke-dashoffset: 1; animation: ui-tc-draw var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-fast) forwards; }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__err circle { fill: var(--tc-status-danger-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__err path { stroke: #fff; stroke-width: 1.6; stroke-linecap: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__chevron {
  flex: none;
  width: 12px;
  height: 12px;
  fill: none;
  stroke: var(--tc-icon-muted);
  stroke-width: 1.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform var(--tc-duration-slow) var(--tc-ease-move), stroke var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-tc[data-open] > .ui-tc__head .ui-tc__chevron,
.ui-tc-group[data-open] > .ui-tc-group__head .ui-tc__chevron { transform: rotate(180deg); }
/* Body: grows from 0fr to 1fr, so the height animates without measuring */
.ui-tc__body {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-moderate) var(--tc-ease-standard);
}
.ui-tc[data-open] > .ui-tc__body,
.ui-tc-group[data-open] > .ui-tc__body {
  grid-template-rows: 1fr;
  opacity: 1;
}
.ui-tc__clip { min-height: 0; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__sections {
  display: grid;
  gap: var(--tc-space-3);
  padding: var(--tc-space-3);
  border-top: 1px solid var(--tc-border-default);
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc__sections {
  display: grid;
  gap: var(--tc-space-3-5);
  padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-3-5);
  border-top: 0.5px solid var(--tc-border-default);
}
.ui-tc__section { display: grid; gap: var(--tc-space-1-5); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2);
  min-height: 24px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-tc__label { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__pending { margin: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__copy {
  all: unset;
  position: relative;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: var(--tc-radius-sm);
  color: var(--tc-text-muted);
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-tc__copy svg {
  position: absolute;
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-slow) var(--tc-ease-move), filter var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2);
  min-height: 28px;
}
/* Tiny uppercase labels: "ARGUMENTS", "RESULT" */
:where([data-look="clean"], [data-look="clean"] *).ui-tc__label {
  color: var(--tc-text-muted);
  font-size: var(--tc-font-size-2xs);
  line-height: var(--tc-line-height-tight);
  font-weight: var(--tc-font-weight-medium);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc__pending { margin: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
/* Copy: a small white icon button with the card's hairline */
:where([data-look="clean"], [data-look="clean"] *).ui-tc__copy {
  all: unset;
  position: relative;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: var(--tc-radius-sm);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  color: var(--tc-icon-muted);
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc__copy svg {
  position: absolute;
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-slow) var(--tc-ease-move), filter var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc__copy-icon rect { fill: currentColor; stroke: none; }
.ui-tc__copy-done { opacity: 0; transform: scale(0.6); filter: blur(2px); stroke-width: 1.7; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__copy[data-copied] { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__copy[data-copied] { color: var(--tc-accent-text); }
.ui-tc__copy[data-copied] .ui-tc__copy-icon { opacity: 0; transform: scale(0.6); filter: blur(2px); }
.ui-tc__copy[data-copied] .ui-tc__copy-done { opacity: 1; transform: none; filter: none; }
/* Code: wraps instead of scrolling sideways; capped blocks fade out at the bottom */
:where([data-look="standard"], [data-look="standard"] *).ui-tc__code {
  position: relative;
  margin: 0;
  padding: var(--tc-space-2-5) var(--tc-space-3);
  overflow: hidden;
  border-radius: var(--tc-radius-md);
  background: var(--tc-tool-call-card-code-bg);
  box-shadow: inset 0 0 0 1px var(--tc-border-default);
  color: var(--tc-text-muted);
  font-family: var(--tc-font-mono);
  font-size: var(--tc-font-size-sm);
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  tab-size: 2;
  transition: max-height var(--tc-duration-slower) var(--tc-ease-move);
}
/* Code: a faint panel with a 0.5px frame; wraps instead of scrolling sideways, capped blocks fade out */
:where([data-look="clean"], [data-look="clean"] *).ui-tc__code {
  position: relative;
  margin: 0;
  padding: var(--tc-space-2-5) var(--tc-space-3);
  overflow: hidden;
  border-radius: var(--tc-radius-md);
  background: var(--tc-tool-call-card-code-bg);
  box-shadow: inset 0 0 0 0.5px var(--tc-border-default);
  color: var(--tc-text-muted);
  font-family: var(--tc-font-mono);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-normal);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  tab-size: 2;
  transition: max-height var(--tc-duration-slower) var(--tc-ease-move);
}
.ui-tc__code code { display: block; font: inherit; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__code::after {
  content: "";
  position: absolute;
  left: 1px;
  right: 1px;
  bottom: 1px;
  height: 56px;
  border-radius: 0 0 var(--tc-radius-sm) var(--tc-radius-sm);
  background: linear-gradient(to bottom, transparent, var(--tc-tool-call-card-code-bg));
  opacity: 0;
  transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard);
  pointer-events: none;
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc__code::after {
  content: "";
  position: absolute;
  left: 0.5px;
  right: 0.5px;
  bottom: 0.5px;
  height: 56px;
  border-radius: 0 0 7.5px 7.5px;
  background: linear-gradient(to bottom, transparent, var(--tc-tool-call-card-code-bg));
  opacity: 0;
  transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard);
  pointer-events: none;
}
.ui-tc__code[data-capped]::after { opacity: 1; }
.ui-tc__t-key { color: var(--tc-text-primary); }
.ui-tc__t-str { color: var(--tc-tool-call-card-syntax-string); }
.ui-tc__t-num { color: var(--tc-tool-call-card-syntax-number); }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__t-lit { color: var(--tc-tone-violet-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__more {
  all: unset;
  justify-self: start;
  padding: var(--tc-space-0-5) var(--tc-space-1);
  margin-left: -4px;
  border-radius: var(--tc-radius-xs);
  color: var(--tc-text-muted);
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
  cursor: pointer;
  transition: color var(--tc-duration-fast) var(--tc-ease-standard);
}
/* Error: the message and an optional retry */
:where([data-look="standard"], [data-look="standard"] *).ui-tc__error {
  display: flex;
  align-items: flex-start;
  gap: var(--tc-space-2);
  padding: var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-2) var(--tc-space-3);
  border-radius: var(--tc-radius-md);
  background: var(--tc-tool-call-card-error-bg);
  box-shadow: inset 0 0 0 1px var(--tc-status-danger-border);
}
:where([data-look="standard"], [data-look="standard"] *).ui-tc__error > .ui-tc__err { flex: none; width: 14px; height: 14px; margin-top: var(--tc-space-0-5); fill: none; stroke-linecap: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__error-text {
  flex: 1;
  min-width: 0;
  margin: 0;
  color: var(--tc-status-danger-fg);
  font-size: var(--tc-font-size-md);
  line-height: 1.45;
  overflow-wrap: anywhere;
}
.ui-tc__retry {
  all: unset;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  flex: none;
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-control-px-sm) 0 calc(var(--tc-control-px-sm) - 2px);
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  color: var(--tc-action-secondary-fg);
  font-size: var(--tc-control-font-size);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-control-font-weight);
  cursor: pointer;
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-tc__retry svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__retry { margin: -4px 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__t-lit { color: var(--tc-tool-call-card-syntax-literal); }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__more {
  all: unset;
  justify-self: start;
  padding: var(--tc-space-0-5) var(--tc-space-1);
  margin-left: -4px;
  border-radius: var(--tc-radius-sm);
  color: var(--tc-text-secondary);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  font-weight: var(--tc-font-weight-medium);
  cursor: pointer;
  transition: color var(--tc-duration-fast) var(--tc-ease-standard);
}
/* Error: the message on a faint red panel and an optional white Retry button */
:where([data-look="clean"], [data-look="clean"] *).ui-tc__error {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  min-height: 44px;
  padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-3);
  border-radius: var(--tc-radius-md);
  background: var(--tc-tool-call-card-error-bg);
  box-shadow: inset 0 0 0 0.5px var(--tc-status-danger-border);
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc__error > .ui-tc__err { flex: none; align-self: flex-start; width: 16px; height: 16px; margin-top: var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__error-text {
  flex: 1;
  min-width: 0;
  margin: 0;
  color: var(--tc-status-danger-fg);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  overflow-wrap: anywhere;
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc__retry svg { width: 16px; height: 16px; fill: none; stroke: var(--tc-icon-muted); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.ui-tc__retry:active svg { transform: rotate(-60deg); transition: transform var(--tc-duration-base) var(--tc-ease-move); }
/* Group: one quiet line with the tool icons stacked, the cards below */
.ui-tc-group { display: grid; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc-group__head {
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  justify-self: start;
  max-width: 100%;
  min-height: 36px;
  padding: var(--tc-space-1) var(--tc-space-2-5) var(--tc-space-1) var(--tc-space-1);
  border-radius: var(--tc-radius-lg);
  color: var(--tc-text-muted);
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-tc-group__stack { display: flex; flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc-group__stack .ui-tc__icon {
  width: 24px;
  height: 24px;
  border-radius: var(--tc-radius-sm);
  box-shadow: inset 0 0 0 1px var(--tc-border-default), 0 0 0 2px var(--tc-surface-raised);
  animation: ui-tc-pop var(--tc-duration-slower) var(--tc-ease-move) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-tc-group__stack .ui-tc__icon + .ui-tc__icon { margin-left: -5px; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc-group__stack .ui-tc__icon > svg { width: 13px; height: 13px; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc-group__title {
  display: flex;
  align-items: baseline;
  gap: var(--tc-space-1);
  min-width: 0;
  white-space: nowrap;
  animation: ui-tc-in var(--tc-duration-slow) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc-group__head {
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  justify-self: start;
  max-width: 100%;
  min-height: 32px;
  margin-left: -6px;
  padding: var(--tc-space-1) var(--tc-space-2-5) var(--tc-space-1) var(--tc-space-1-5);
  border-radius: var(--tc-radius-md);
  color: var(--tc-text-primary);
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc-group__stack { display: flex; flex: none; padding: 0.5px; }
:where([data-look="clean"], [data-look="clean"] *).ui-tc-group__stack .ui-tc__icon {
  width: 22px;
  height: 22px;
  border-radius: var(--tc-radius-sm);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  animation: ui-tc-pop var(--tc-duration-slower) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc-group__stack .ui-tc__icon + .ui-tc__icon { margin-left: -4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-tc-group__stack .ui-tc__icon > svg { width: 12px; height: 12px; stroke-width: 1.5; }
:where([data-look="clean"], [data-look="clean"] *).ui-tc-group__title {
  display: flex;
  align-items: baseline;
  gap: var(--tc-space-1-5);
  min-width: 0;
  white-space: nowrap;
  animation: ui-tc-in var(--tc-duration-slow) var(--tc-ease-move) both;
}
.ui-tc-group__label {
  position: relative;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  color: inherit;
  font-weight: var(--tc-font-weight-medium);
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc-group__label.ui-tc__shine { color: var(--tc-text-muted); }
.ui-tc-group__failed { flex: none; color: var(--tc-status-danger-fg); }
.ui-tc-group__time { flex: none; color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc-group__list { display: grid; gap: var(--tc-space-2); padding-top: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-tc-group__list { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-1-5) 0 var(--tc-space-0-5); }
/* A soft light sweeping over "Using tools…" */
.ui-tc__shine::after {
  content: attr(data-text);
  content: attr(data-text) / "";
  position: absolute;
  inset: 0;
  white-space: nowrap;
  color: transparent;
  background: linear-gradient(90deg, transparent 38%, var(--tc-shimmer) 50%, transparent 62%) 100% 0 / 300% 100% no-repeat;
  -webkit-background-clip: text;
  background-clip: text;
  animation: ui-tc-sweep 1.8s linear 3;
  pointer-events: none;
}
@keyframes ui-tc-in {
  from { opacity: 0; transform: translateY(3px); filter: blur(2px); }
  to { opacity: 1; transform: none; filter: none; }
}
@keyframes ui-tc-pop {
  from { opacity: 0; transform: scale(0.6); }
  to { opacity: 1; transform: none; }
}
@keyframes ui-tc-spin { to { transform: rotate(360deg); } }
@keyframes ui-tc-draw { to { stroke-dashoffset: 0; } }
@keyframes ui-tc-sweep {
  from { background-position: 100% 0; }
  to { background-position: 0% 0; }
}
/* Narrow (phones): a little less padding, the summary gives way first */
@container (max-width: 360px) {
:where([data-look="clean"], [data-look="clean"] *).ui-tc__head { gap: var(--tc-space-2); padding: 0 var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__sections { padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-3); }
}
/* Touch screens: bigger tap targets */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-tc__head { min-height: 52px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-tc *,
  .ui-tc-group *,
  .ui-tc *::after,
  .ui-tc-group *::after {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
  .ui-tc__shine::after { display: none; }
  .ui-tc__ok path { stroke-dashoffset: 0; }
}
`;
