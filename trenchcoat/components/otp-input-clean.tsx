"use client";

/*
 * OTP Input – the verification code field, in a single self-contained file.
 * One real input sits under the boxes, so typing, Backspace, paste and the SMS autofill of
 * iOS and Android all work natively; the boxes only draw what it holds.
 * The focus ring glides from box to box with a soft blinking caret, digits pop in, a pasted code
 * fills the boxes one after another. Verifying shimmers, a wrong code shakes and clears for retyping,
 * a right one folds the boxes into a single "Verified" pill. A resend link counts down below.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: otp-input.tsx is Standard,
 * otp-input-clean.tsx is Clean). Clean has white cells with hairline shadows, a thin blue focus outline and caret,
 * quiet gray helper text, a tab-style "Resend code" button, and folds into a faintly green "Verified" chip.
 */
// Generated from src/components/otp-input.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ClipboardEvent, type ComponentPropsWithoutRef, type KeyboardEvent, type ReactNode, type Ref } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "clean";
const ROOT_CLASS = "ui-otp";

export type OtpStatus = "idle" | "verifying" | "error" | "success";

export type OtpInputOwnProps = {
  /** Number of boxes */
  length?: number;
  /** A small dash between the boxes – `true` puts it in the middle, a number after that many boxes */
  separator?: boolean | number;
  /** Digits only (numeric keyboard on phones); `false` allows letters too, shown in capitals */
  numeric?: boolean;
  /** The code. Controlled when defined; otherwise the field keeps its own, starting at `defaultValue` */
  value?: string;
  /** Starting code when uncontrolled */
  defaultValue?: string;
  onChange?: (code: string) => void;
  /** Called once the last box is filled – typed, pasted or autofilled. May return a promise (the check): without a
   *  `status` prop the field then shows verifying, success when it resolves and the error when it rejects. The signal
   *  aborts when the field unmounts */
  onComplete?: (code: string, options: { signal: AbortSignal }) => void | Promise<unknown>;
  /** The check's state. Controlled when defined; otherwise it follows the promise onComplete returns */
  status?: OtpStatus;
  /** Shown below the boxes while `status` is "error" */
  errorMessage?: ReactNode;
  /** Clears the boxes shortly after an error, ready for the next try */
  clearOnError?: boolean;
  /** Text in the pill after a successful check */
  successLabel?: string;
  /** Shows "Resend code" below the boxes once the countdown is over */
  onResend?: () => void;
  /** Seconds until the code can be resent */
  resendIn?: number;
  /** Center the boxes and the lines below them */
  align?: "start" | "center";
  disabled?: boolean;
  /** Name for native form submission – the code is submitted under it */
  name?: string;
  /** A native form needs a code before it submits */
  required?: boolean;
  autoFocus?: boolean;
  /** Accessible name of the field (used when there's no `labelledBy`) */
  label?: string;
  /** Id of a visible label (a heading or <label>) that names the field – preferred over `label` (WCAG 2.5.3, 3.3.2) */
  labelledBy?: string;
  /** Visual style. Defaults to the file's look: Standard in otp-input.tsx, Clean in otp-input-clean.tsx */
  look?: Look;
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

export type OtpInputProps = Omit<ComponentPropsWithoutRef<"div">, keyof OtpInputOwnProps> & OtpInputOwnProps;

/* ---------- Helpers ---------- */

/** "0:24" */
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** When each character arrived (so it pops in once) and its delay (pasted codes arrive one after another) */
type Arrivals = { code: string; stamps: number[]; delays: number[]; counter: number };
function arrive(prev: Arrivals, code: string): Arrivals {
  const changed = [...code].map((c, i) => c !== prev.code[i]);
  const first = changed.indexOf(true);
  const bulk = changed.filter(Boolean).length > 1;
  const stamps = [...prev.stamps];
  const delays = [...prev.delays];
  let counter = prev.counter;
  changed.forEach((ch, i) => {
    if (!ch) return;
    stamps[i] = ++counter;
    delays[i] = bulk ? (i - first) * 45 : 0;
  });
  return { code, stamps, delays, counter };
}

const icons = {
  check: "M5.5 12.5l4 4L18.5 8",
  alert: "M12 8v4.5M12 16h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
};

/**
 * The resend countdown. Its seconds are written into the time's text once a second; React renders only when the
 * countdown starts over and when it ends (and "Resend code" takes its place). Stops at zero.
 */
function useResendCountdown(resendIn: number, onDone: () => void) {
  // The seconds a countdown started from (0: none running), and which one it is
  const [run, setRun] = useState({ from: resendIn, n: 0 });
  const timeRef = useRef<HTMLSpanElement>(null);
  const latestDone = useRef(onDone);
  useLayoutEffect(() => {
    latestDone.current = onDone;
  });
  useEffect(() => {
    if (run.from <= 0) {
      latestDone.current();
      return;
    }
    let left = run.from;
    let t = 0;
    const tick = () => {
      left -= 1;
      if (left <= 0) return setRun((r) => ({ from: 0, n: r.n }));
      const text = timeRef.current?.firstChild;
      if (text) text.nodeValue = clock(left);
      t = window.setTimeout(tick, 1000);
    };
    t = window.setTimeout(tick, 1000);
    return () => clearTimeout(t);
  }, [run]);
  const restart = () => setRun((r) => ({ from: resendIn, n: r.n + 1 }));
  return { waiting: run.from > 0, from: run.from, timeRef, restart };
}

function ResendLine({
  waiting,
  from,
  timeRef,
  hidden,
  disabled,
  onResend,
}: {
  waiting: boolean;
  from: number;
  timeRef: Ref<HTMLSpanElement>;
  hidden: boolean;
  disabled: boolean;
  onResend: () => void;
}) {
  return (
    <div className="ui-otp__resend" data-hidden={hidden || undefined}>
      <span className="ui-otp__resend-q">Didn't get a code?</span>{" "}
      {waiting ? (
        <span key="wait" className="ui-otp__swap ui-otp__wait">
          Resend in{"\u00a0"}
          {/* Counted down in the DOM by useResendCountdown */}
          <span ref={timeRef} className="ui-otp__time">
            {clock(from)}
          </span>
        </span>
      ) : (
        <button key="go" type="button" className="ui-otp__swap ui-otp__resend-btn" onClick={onResend} disabled={disabled}>
          Resend code
        </button>
      )}
    </div>
  );
}

/** The error message slides in below and folds away once retyping starts */
function ErrorMessage({ id, show, children }: { id: string; show: boolean; children: ReactNode }) {
  return (
    <div className="ui-otp__msg" data-show={show || undefined}>
      <div className="ui-otp__msg-inner">
        <p id={id} className="ui-otp__msg-text">
          <svg viewBox="0 0 24 24" className="ui-otp__alert" aria-hidden="true">
            <path d={icons.alert} />
          </svg>
          <span>{children}</span>
        </p>
      </div>
    </div>
  );
}

/** Puts the ring on a box: every read first, then the writes */
function placeRing(r: HTMLElement, box: HTMLElement) {
  const w = box.offsetWidth;
  const h = box.offsetHeight;
  const x = box.offsetLeft;
  const y = box.offsetTop;
  r.style.width = `${w}px`;
  r.style.height = `${h}px`;
  r.style.transform = `translate(${x}px, ${y}px)`;
}

type El<T> = { current: T | null };
/** The ring glides to the active box; the success pill starts as wide as all the boxes and morphs down to its label */
function useRingAndPill({
  ring,
  pill,
  pillInner,
  slots,
  boxes,
  active,
  status,
  keys,
}: {
  ring: El<HTMLSpanElement>;
  pill: El<HTMLSpanElement>;
  pillInner: El<HTMLSpanElement>;
  slots: El<HTMLDivElement>;
  boxes: { current: (HTMLSpanElement | null)[] };
  active: number;
  status: OtpStatus;
  keys: unknown[];
}) {
  // Keyed on what moves them – a resize is the observer's below
  useLayoutEffect(() => {
    const r = ring.current;
    const box = boxes.current[active];
    if (r && box) {
      const first = !r.dataset.ready;
      if (first) r.style.transition = "none";
      placeRing(r, box);
      if (first) {
        r.dataset.ready = "1";
        void r.offsetWidth;
        r.style.transition = "";
      }
    }
    // The pill starts as wide as all the boxes and morphs down to its label
    const p = pill.current;
    const s = slots.current;
    if (p && s && pillInner.current) p.style.width = `${status === "success" ? pillInner.current.offsetWidth : s.offsetWidth}px`;
    }, [active, status, ring, pill, pillInner, slots, boxes, ...keys]); // eslint-disable-line react-hooks/exhaustive-deps -- keys: what else moves them

  // Phones turning, containers resizing: ring and pill follow
  useEffect(() => {
    const s = slots.current;
    if (!s) return;
    const ro = new ResizeObserver(() => {
      const r = ring.current;
      const box = boxes.current[active];
      const width = s.offsetWidth;
      if (r && box) placeRing(r, box);
      if (pill.current && status !== "success") pill.current.style.width = `${width}px`;
    });
    ro.observe(s);
    return () => ro.disconnect();
  }, [active, status, ring, pill, slots, boxes]);
}

/**
 * What a new status sets off: the announcement, and for an error a shake, then the wrong code fades out and clears
 * (unless clearOnError is false). A new status cancels an error still fading out.
 */
function useStatusFlow({
  status,
  successLabel,
  errorMessage,
  clearOnError,
  slots,
  latestCommit,
  setAnnounce,
}: {
  status: OtpStatus;
  successLabel: string;
  errorMessage: ReactNode;
  clearOnError: boolean;
  slots: El<HTMLDivElement>;
  latestCommit: { current: (next: string, nextIdx: number, user?: boolean) => void };
  setAnnounce: (text: string) => void;
}) {
  const [errorShown, setErrorShown] = useState(false);
  const [clearing, setClearing] = useState(false); // the wrong code fades out
  const [locked, setLocked] = useState(false); // no typing between the shake and the clearing
  const timers = useRef<number[]>([]);
  const prevStatus = useRef(status);
  useEffect(() => {
    const before = prevStatus.current;
    prevStatus.current = status;
    if (status === before) return;
    // A new status cancels an error still fading out – a quick retry mustn't have its code wiped mid-verification
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setClearing(false);
    setLocked(false);
    if (status === "verifying") setAnnounce("Verifying code");
    if (status === "success") setAnnounce(successLabel);
    if (status !== "error") {
      setErrorShown(false);
      return;
    }
    setErrorShown(true);
    setAnnounce(typeof errorMessage === "string" ? errorMessage : "That code didn't work");
    // A calm shake, then the wrong code fades out so the next try starts fresh
    if (!reducedMotion()) {
      slots.current?.animate(
        [{ transform: "none" }, { transform: "translateX(-6px)" }, { transform: "translateX(5px)" }, { transform: "translateX(-3px)" }, { transform: "translateX(2px)" }, { transform: "none" }],
        { duration: 420, easing: "ease-out" },
      );
    }
    if (!clearOnError) return;
    setLocked(true);
    timers.current.push(
      window.setTimeout(() => setClearing(true), 700),
      window.setTimeout(() => {
        setClearing(false);
        setLocked(false);
        latestCommit.current("", 0, false);
      }, 980),
    );
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  return { errorShown, setErrorShown, clearing, locked };
}

/** One box per character (and the separator), each character popping in when it arrives */
function CodeBoxes({
  length,
  sepAt,
  code,
  arrivals,
  boxes,
}: {
  length: number;
  sepAt: number;
  code: string;
  arrivals: Arrivals;
  boxes: { current: (HTMLSpanElement | null)[] };
}) {
  const cells: ReactNode[] = [];
  for (let i = 0; i < length; i++) {
    if (sepAt > 0 && sepAt < length && i === sepAt) cells.push(<span key="sep" className="ui-otp__sep" />);
    const ch = code[i];
    cells.push(
      <span
        key={i}
        ref={(el) => {
          boxes.current[i] = el;
        }}
        className="ui-otp__box"
        data-filled={ch ? "" : undefined}
        style={{ "--i": i } as CSSProperties}
      >
        {ch && (
          <span key={arrivals.stamps[i]} className="ui-otp__char" style={{ animationDelay: `${arrivals.delays[i] ?? 0}ms` }}>
            {ch}
          </span>
        )}
      </span>,
    );
  }
  return cells;
}

export function OtpInput({
  length = 6,
  separator = false,
  numeric = true,
  value,
  defaultValue = "",
  onChange,
  onComplete,
  status: statusProp,
  errorMessage = "That code didn't work. Try again.",
  clearOnError = true,
  successLabel = "Verified",
  onResend,
  resendIn = 30,
  align = "start",
  disabled = false,
  name,
  required,
  autoFocus = false,
  label = "Verification code",
  labelledBy,
  look,
  className,
  ref,
  ...rest
}: OtpInputProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  /** Keeps allowed characters only – spaces and dashes of a pasted "482 913" fall away; full-width digits from an
   *  IME ("１２３") become plain ones */
  const clean = (text: string) => {
    let out = "";
    for (const raw of text) {
      const ch = raw.normalize("NFKC");
      const c = numeric ? (/[0-9]/.test(ch) ? ch : "") : /[a-z0-9]/i.test(ch) ? ch.toUpperCase() : "";
      if (c && out.length < length) out += c;
    }
    return out;
  };

  const [current, setCode] = useControllable(value, clean(defaultValue), onChange, "value");
  const code = clean(current);
  // The check's state: the prop when passed, else driven by the promise onComplete returns
  const [ownStatus, setOwnStatus] = useState<OtpStatus>("idle");
  const status = statusProp ?? ownStatus;
  // While an IME composes, the input shows what it composes – the code only changes once it's done
  const [composing, setComposing] = useState<string | null>(null);
  const [idx, setIdx] = useState(Math.min(code.length, length - 1));
  const [focused, setFocused] = useState(false);
  const [announce, setAnnounceText] = useState("");
  // The same message twice (a second wrong code) is still a change for screen readers
  const setAnnounce = (text: string) => setAnnounceText((old) => (old === text ? `${text}\u00a0` : text));

  const root = useRef<HTMLDivElement>(null);
  const rootRef = useRootRef(root, ref);
  const input = useRef<HTMLInputElement>(null);
  const slots = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLSpanElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const pillInner = useRef<HTMLSpanElement>(null);
  const boxes = useRef<(HTMLSpanElement | null)[]>([]);
  const id = useId();
  // The error timers clear the code a second later – by then they need the commit of that render (set below)
  const latestCommit = useRef<(next: string, nextIdx: number, user?: boolean) => void>(() => {});

  /* ---------- Status ---------- */

  const { errorShown, setErrorShown, clearing, locked } = useStatusFlow({ status, successLabel, errorMessage, clearOnError, slots, latestCommit, setAnnounce });

  // Every character remembers when it arrived, so it pops in once; pasted codes arrive one after another.
  // Kept in state and adjusted while rendering – never by writing refs during render
  const [arrivals, setArrivals] = useState<Arrivals>({ code, stamps: [], delays: [], counter: 0 });
  let shown = arrivals;
  if (arrivals.code !== code) {
    shown = arrive(arrivals, code);
    setArrivals(shown);
  }

  // A check still running when the field unmounts is aborted, and never sets state afterwards
  const checks = useRef(new Set<AbortController>());
  useEffect(() => {
    const live = checks.current;
    return () => {
      live.forEach((c) => c.abort());
      live.clear();
    };
  }, []);
  const complete = (next: string) => {
    const controller = new AbortController();
    const result = onComplete?.(next, { signal: controller.signal });
    if (!(result instanceof Promise) || statusProp !== undefined) return;
    checks.current.add(controller);
    setOwnStatus("verifying");
    result.then(
      () => checks.current.delete(controller) && setOwnStatus("success"),
      () => checks.current.delete(controller) && setOwnStatus("error"),
    );
  };

  // An outside change of the value (or a shorter code) keeps the active box in reach
  const active = Math.min(idx, code.length, length - 1);

  const sepAt = separator === true ? Math.floor(length / 2) : typeof separator === "number" ? separator : 0;
  const busy = status === "verifying" || status === "success";
  const readOnly = busy || locked || disabled;
  const showError = status === "error" && errorShown;
  // The ring shows where the next character goes: while focused, or mid-way through a code
  const showRing = !busy && !disabled && (focused || (code.length > 0 && code.length < length));

  const commit = (next: string, nextIdx: number, user = true) => {
    if (next !== code) setCode(next);
    setIdx(Math.max(0, Math.min(nextIdx, next.length, length - 1)));
    if (!user) return;
    if (errorShown && next.length) setErrorShown(false);
    if (ownStatus === "error" && next.length) setOwnStatus("idle");
    if (next.length === length && next !== code) complete(next);
  };
  // Kept after each commit for the error timers – they need that render's commit, not the error's
  useLayoutEffect(() => {
    latestCommit.current = commit;
  });

  /* ---------- Native input ---------- */

  const onInput = (el: HTMLInputElement) => {
    if (readOnly) return;
    const raw = el.value;
    const caretRaw = el.selectionStart ?? raw.length;
    const next = clean(raw);
    // The caret counts the kept characters in front of it
    const caret = clean(raw.slice(0, caretRaw)).length;
    if (next === code) {
      el.value = code;
      syncSelection();
      return;
    }
    commit(next, caret);
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (readOnly) return;
    const text = clean(e.clipboardData.getData("text"));
    if (!text) return;
    // A whole code replaces everything; a part is written from the active box on
    if (text.length >= length) return commit(text.slice(0, length), length - 1);
    const next = (code.slice(0, active) + text + code.slice(active + text.length)).slice(0, length);
    commit(next, active + text.length);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing || composing !== null) return;
    const last = Math.min(code.length, length - 1);
    const moves: Record<string, number> = { ArrowLeft: active - 1, ArrowRight: active + 1, Home: 0, End: last, ArrowUp: 0, ArrowDown: last };
    if (e.key in moves && !e.shiftKey && !e.metaKey) {
      e.preventDefault();
      setIdx(Math.max(0, Math.min(moves[e.key], last)));
    }
  };

  /** A tap or click picks the box under the pointer – never beyond the first empty one */
  const pick = (x: number) => {
    let i = boxes.current.findIndex((b) => b && x < b.getBoundingClientRect().right + 4);
    if (i < 0) i = length - 1;
    setIdx(Math.min(i, code.length, length - 1));
    requestAnimationFrame(syncSelection);
  };

  // The real input selects the active character, so typing replaces it and Backspace removes it
  const syncSelection = () => {
    const el = input.current;
    if (!el || document.activeElement !== el || composing !== null) return;
    const i = Math.min(idx, code.length, length - 1);
    if (i < code.length) el.setSelectionRange(i, i + 1);
    else el.setSelectionRange(i, i);
  };
  useLayoutEffect(syncSelection);

  useEffect(() => {
    if (autoFocus) input.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  /* ---------- The gliding ring and the success pill ---------- */

  useRingAndPill({ ring, pill, pillInner, slots, boxes, active, status, keys: [length, sepAt, resolvedLook, successLabel] });

  /* ---------- Resend countdown ---------- */

  const countdown = useResendCountdown(resendIn, () => {
    if (onResend && resendIn > 0) setAnnounce("You can resend the code now");
  });
  const resend = () => {
    onResend?.();
    countdown.restart();
    setAnnounce("A new code is on its way");
  };

  /* ---------- Render ---------- */

  return (
    <div
      {...rest}
      ref={rootRef}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={resolvedLook}
      data-status={status}
      data-error={showError || undefined}
      data-align={align}
      data-disabled={disabled || undefined}
    >
      {/* React 19 hoists this into <head> once, no matter how many fields render */}
      <style href="ui-otp-input" precedence="default">
        {css}
      </style>

      <div className="ui-otp__field">
        <div
          ref={slots}
          className="ui-otp__slots"
          data-clearing={clearing || undefined}
          style={{ "--n": length, "--sep-w": sepAt > 0 && sepAt < length ? `calc(var(--tc-otp-input-gap) + ${resolvedLook === "clean" ? 8 : 10}px)` : "0px" } as CSSProperties}
        >
          <CodeBoxes length={length} sepAt={sepAt} code={code} arrivals={shown} boxes={boxes} />
          <span ref={ring} className="ui-otp__ring" data-show={showRing || undefined} aria-hidden="true">
            <span className="ui-otp__caret" data-show={(focused && !code[active] && !readOnly) || undefined} />
          </span>
          <span ref={pill} className="ui-otp__pill" aria-hidden="true">
            <span ref={pillInner} className="ui-otp__pill-inner">
              <svg viewBox="0 0 24 24" className="ui-otp__check" aria-hidden="true">
                <path d={icons.check} pathLength={1} />
              </svg>
              {successLabel}
            </span>
          </span>
          <input
            ref={input}
            className="ui-otp__input"
            type="text"
            name={name}
            required={required}
            value={composing ?? code}
            inputMode={numeric ? "numeric" : "text"}
            pattern={numeric ? "[0-9]*" : undefined}
            autoComplete="one-time-code"
            autoCapitalize={numeric ? "off" : "characters"}
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            aria-label={labelledBy ? undefined : `${label}, ${length} ${numeric ? "digits" : "characters"}`}
            aria-labelledby={labelledBy ? `${labelledBy} ${id}-count` : undefined}
            aria-invalid={showError || undefined}
            aria-describedby={showError ? `${id}-msg` : undefined}
            disabled={disabled}
            readOnly={busy || locked}
            onChange={(e) => {
              // Mid-composition the IME owns the text: show it as it is, take it once composing ends
              if (composing !== null || (e.nativeEvent as InputEvent).isComposing) setComposing(e.currentTarget.value);
              else onInput(e.currentTarget);
            }}
            onCompositionStart={(e) => setComposing(e.currentTarget.value)}
            onCompositionEnd={(e) => {
              setComposing(null);
              onInput(e.currentTarget);
            }}
            onPaste={onPaste}
            onKeyDown={onKeyDown}
            onFocus={() => {
              setFocused(true);
              requestAnimationFrame(syncSelection);
            }}
            onBlur={() => setFocused(false)}
            onPointerUp={(e) => pick(e.clientX)}
            onSelect={(e) => {
              // A native caret move (long press, mouse drag) snaps back to a single box
              const el = e.currentTarget;
              const want = active < code.length ? [active, active + 1] : [active, active];
              if (el.selectionStart !== want[0] || el.selectionEnd !== want[1]) syncSelection();
            }}
          />
        </div>
      </div>

      <ErrorMessage id={`${id}-msg`} show={showError}>
        {errorMessage}
      </ErrorMessage>

      {onResend && (
        <ResendLine
          waiting={countdown.waiting}
          from={countdown.from}
          timeRef={countdown.timeRef}
          hidden={status === "success"}
          disabled={disabled || busy}
          onResend={resend}
        />
      )}

      {labelledBy && (
        <span id={`${id}-count`} className="ui-otp__live">
          {`${length} ${numeric ? "digits" : "characters"}`}
        </span>
      )}
      <span className="ui-otp__live" aria-live="polite">
        {announce}
      </span>
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
.ui-otp:where([data-look="standard"]),
.ui-otp__portal:where([data-look="standard"]) {
  --_tc-accent: #2f68ff;
  --_tc-accent-text: light-dark(#2456d6, #8ab4ff);
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-border-strong: light-dark(#dedede, #3a3a40);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-field-shadow: inset 0 0 0 1px light-dark(#858585, #7c7c82), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring: light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xl: 16px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-tight: 16px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-full: 999px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shimmer: light-dark(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.28));
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-status-danger-bg: light-dark(#fdecea, #3b1714);
  --_tc-status-danger-border: color-mix(in srgb, light-dark(#e5484d, #ff6369) 40%, transparent);
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-danger-solid: light-dark(#e5484d, #ff6369);
  --_tc-status-success-bg: light-dark(#e6f6ec, #12301f);
  --_tc-status-success-solid: light-dark(#1f8a4c, #3ec27a);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-text-disabled: light-dark(#a3a3a3, #5c5c63);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
}
.ui-otp:where([data-look="clean"]),
.ui-otp__portal:where([data-look="clean"]) {
  --_tc-accent: light-dark(#0060e2, #1a6cf0);
  --_tc-accent-text: light-dark(#0058cf, #70b8ff);
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-border-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-field-shadow: inset 0 0 0 1px light-dark(rgba(0, 0, 0, 0.48), rgba(255, 255, 255, 0.4));
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring: light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-size-xl: 16px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-line-height-loose: 24px;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-tight: 16px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-full: 999px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xs: 4px;
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-shimmer: light-dark(rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.3));
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-status-danger-bg: light-dark(rgba(245, 43, 0, 0.094), rgba(255, 53, 35, 0.17));
  --_tc-status-danger-border: color-mix(in srgb, light-dark(#e5484d, #ff6369) 40%, transparent);
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-danger-solid: light-dark(#e5484d, #ff6369);
  --_tc-status-success-bg: light-dark(rgba(0, 164, 51, 0.1), rgba(0, 240, 74, 0.12));
  --_tc-status-success-solid: light-dark(#1f8a4c, #3ec27a);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-text-disabled: light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3));
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }
@media (forced-colors: active) {
  :where([data-look], [data-look] *):not(#tc-fc):is(button, [role="button"], [role="switch"], [role="combobox"], [role="checkbox"], [role="radio"], input:not([type="hidden"]), select, textarea):not([role="option"], [role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"], [role="tab"], [role="treeitem"], [role="gridcell"], [role="row"]) { border: 1px solid ButtonText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is(input, select, textarea) { border-color: FieldText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is([role="listbox"], [role="menu"], [role="dialog"], [role="tooltip"], [role="tablist"], [role="radiogroup"]) { outline: 1px solid CanvasText; }
  :where([data-look], [data-look] *):not(#tc-fc):is([aria-selected="true"], [aria-pressed="true"], [aria-checked="true"], [aria-current]:not([aria-current="false"])) { forced-color-adjust: none; background: Highlight !important; color: HighlightText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is([aria-selected="true"], [aria-pressed="true"], [aria-checked="true"], [aria-current]:not([aria-current="false"])) * { color: HighlightText !important; background: none !important; }
  :where([data-look], [data-look] *):not(#tc-fc)[role="switch"] span:empty { background: ButtonText !important; }
  :where([data-look], [data-look] *):not(#tc-fc)[role="switch"][aria-checked="true"] span:empty { background: HighlightText !important; }
  :where([data-look], [data-look] *):not(#tc-fc):is(:disabled, [aria-disabled="true"]) { color: GrayText !important; border-color: GrayText !important; }
}

/* Colors, size and motion as variables – override them on .ui-otp */
:where([data-look="standard"], [data-look="standard"] *).ui-otp {
  --tc-otp-input-box-size: 48px;
  --tc-otp-input-gap: 8px;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  justify-self: stretch; /* it sizes the boxes from its own width, so it must never shrink to fit them */
  width: 100%;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  -webkit-font-smoothing: antialiased;
}
/* Colors, size and motion as variables – override them on .ui-otp */
:where([data-look="clean"], [data-look="clean"] *).ui-otp {
  --tc-otp-input-box-size: 40px;
  --tc-otp-input-gap: 8px;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  justify-self: stretch; /* it sizes the boxes from its own width, so it must never shrink to fit them */
  width: 100%;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
}
.ui-otp *, .ui-otp *::before, .ui-otp *::after { box-sizing: border-box; }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-otp) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
.ui-otp[data-align="center"] { justify-items: center; text-align: center; }
.ui-otp[data-disabled] { opacity: 0.55; }
:where([data-look="standard"], [data-look="standard"] *).ui-otp__field { display: flex; min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-otp__field { display: flex; min-width: 0; padding: var(--tc-space-1, var(--_tc-space-1)) 0; }
.ui-otp[data-align="center"] .ui-otp__field { justify-content: center; }
/* The boxes scale down to fit their container (phones at 320px), up to --tc-otp-input-box-size */
:where([data-look="standard"], [data-look="standard"] *).ui-otp__slots {
  --size: min(var(--tc-otp-input-box-size), calc((100cqi - (var(--n) - 1) * var(--tc-otp-input-gap) - var(--sep-w)) / var(--n)));
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--tc-otp-input-gap);
}
:where([data-look="standard"], [data-look="standard"] *).ui-otp__box {
  position: relative;
  display: grid;
  place-items: center;
  flex: none;
  width: var(--size);
  height: calc(var(--size) * 1.18);
  overflow: hidden;
  border-radius: calc(var(--size) * 0.24);
  background: var(--tc-fill-subtle, var(--_tc-fill-subtle));
  box-shadow: var(--tc-field-shadow, var(--_tc-field-shadow));
  font-size: calc(var(--size) * 0.46);
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  transition: box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-otp__box[data-filled] { background: var(--tc-surface-raised, var(--_tc-surface-raised)); }
:where([data-look="standard"], [data-look="standard"] *).ui-otp__sep { flex: none; width: 10px; height: 2px; border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); background: var(--tc-text-disabled, var(--_tc-text-disabled)); transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
/* The cells scale down to fit their container (phones at 320px), up to --tc-otp-input-box-size */
:where([data-look="clean"], [data-look="clean"] *).ui-otp__slots {
  --size: min(var(--tc-otp-input-box-size), calc((100cqi - 6px - (var(--n) - 1) * var(--tc-otp-input-gap) - var(--sep-w)) / var(--n)));
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--tc-otp-input-gap);
}
/* White cells with the field edge (≥ 3:1 – the hairline shadow was ~1.2:1) */
:where([data-look="clean"], [data-look="clean"] *).ui-otp__box {
  position: relative;
  display: grid;
  place-items: center;
  flex: none;
  width: var(--size);
  height: calc(var(--size) * 1.1);
  overflow: hidden;
  border-radius: calc(var(--size) * 0.2);
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-field-shadow, var(--_tc-field-shadow));
  font-size: min(15px, calc(var(--size) * 0.375));
  line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  transition: box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-otp__sep { flex: none; width: 8px; height: 1px; border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); background: var(--tc-text-disabled, var(--_tc-text-disabled)); transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
/* Digits pop in – a small lift out of a blur, no bounce */
.ui-otp__char { display: block; animation: ui-otp-pop var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
.ui-otp__slots[data-clearing] .ui-otp__char { animation: ui-otp-out var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; animation-delay: calc((var(--n) - var(--i)) * 22ms) !important; }
/* One ring glides from box to box; its caret blinks softly in an empty box */
:where([data-look="standard"], [data-look="standard"] *).ui-otp__ring {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  display: grid;
  place-items: center;
  border-radius: calc(var(--size) * 0.24);
  box-shadow: inset 0 0 0 1.5px var(--tc-text-primary, var(--_tc-text-primary)), 0 0 0 4px var(--tc-fill-default, var(--_tc-fill-default));
  opacity: 0;
  pointer-events: none;
  transition: transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)), width var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
/* One blue outline glides from cell to cell; its thin caret blinks softly in an empty cell */
:where([data-look="clean"], [data-look="clean"] *).ui-otp__ring {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  display: grid;
  place-items: center;
  border-radius: calc(var(--size) * 0.2);
  box-shadow: 0 0 0 0.5px var(--tc-accent, var(--_tc-accent)), 0 0 0 2px var(--tc-focus-ring, var(--_tc-focus-ring));
  opacity: 0;
  pointer-events: none;
  transition: transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)), width var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-otp__ring[data-show] { opacity: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-otp__caret { width: 1.5px; height: 40%; border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); background: var(--tc-text-primary, var(--_tc-text-primary)); opacity: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-otp__caret { width: 1px; height: 18px; max-height: 42%; border-radius: var(--tc-radius-2xs, var(--_tc-radius-2xs)); background: var(--tc-accent, var(--_tc-accent)); opacity: 0; }
/* The caret blinks a few times, then stays (WCAG 2.2.2) */
.ui-otp__caret[data-show] { animation: ui-otp-blink 1.1s var(--tc-ease-in-out, var(--_tc-ease-in-out)) 4; }
/* The real input lies over the boxes, invisible – it takes taps, keys, paste and SMS autofill */
.ui-otp__input {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  color: transparent;
  -webkit-text-fill-color: transparent;
  caret-color: transparent;
  font-size: var(--tc-font-size-xl, var(--_tc-font-size-xl)); /* iOS doesn't zoom into inputs of 16px and up */
  letter-spacing: -1em;
  cursor: text;
  appearance: none;
}
.ui-otp__input::selection { background: transparent; }
.ui-otp__input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px transparent inset; transition: background-color 9999s; }
.ui-otp__input[readonly], .ui-otp__input:disabled { cursor: default; }
/* Keyboard focus is shown by the ring – a thin outline joins it for keyboard users */
:where([data-look="standard"], [data-look="standard"] *).ui-otp__slots:has(.ui-otp__input:focus-visible) .ui-otp__ring { box-shadow: inset 0 0 0 1.5px var(--tc-text-primary, var(--_tc-text-primary)), 0 0 0 4px var(--tc-fill-default, var(--_tc-fill-default)), 0 0 0 6px var(--tc-focus-ring, var(--_tc-focus-ring)); }
/* While verifying (and once verified) the ring is gone but the input still has focus – the field shows it (WCAG 2.4.7) */
.ui-otp:is([data-status="verifying"], [data-status="success"]) .ui-otp__slots:has(.ui-otp__input:focus-visible) { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: 4px; border-radius: var(--tc-radius-md, var(--_tc-radius-md)); }
/* Verifying: a soft light passes over the boxes, one after another */
.ui-otp__box::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(100deg, transparent 20%, var(--tc-shimmer, var(--_tc-shimmer)) 50%, transparent 80%);
  transform: translateX(-120%);
  opacity: 0;
  pointer-events: none;
}
.ui-otp[data-status="verifying"] .ui-otp__box::after { opacity: 1; animation: ui-otp-shimmer 1.3s var(--tc-ease-in-out, var(--_tc-ease-in-out)) infinite; animation-delay: calc(var(--i) * 70ms); }
:where([data-look="standard"], [data-look="standard"] *).ui-otp[data-status="verifying"] .ui-otp__box { background: var(--tc-fill-default, var(--_tc-fill-default)); box-shadow: inset 0 0 0 1px var(--tc-border-default, var(--_tc-border-default)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
/* Error: only the borders turn red */
:where([data-look="standard"], [data-look="standard"] *).ui-otp[data-error] .ui-otp__box { box-shadow: inset 0 0 0 1px var(--tc-status-danger-border, var(--_tc-status-danger-border)); }
:where([data-look="standard"], [data-look="standard"] *).ui-otp[data-error] .ui-otp__ring { box-shadow: inset 0 0 0 1.5px var(--tc-status-danger-solid, var(--_tc-status-danger-solid)), 0 0 0 4px var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); }
:where([data-look="standard"], [data-look="standard"] *).ui-otp[data-error] .ui-otp__caret { background: var(--tc-status-danger-solid, var(--_tc-status-danger-solid)); }
/* Success: the boxes slide together and fade while one frame morphs into the "Verified" pill */
:where([data-look="standard"], [data-look="standard"] *).ui-otp__pill {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 1;
  display: grid;
  place-items: center;
  height: calc(var(--size) * 1.18);
  overflow: hidden;
  border-radius: calc(var(--size) * 0.24);
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: inset 0 0 0 1px var(--tc-border-strong, var(--_tc-border-strong));
  opacity: 0;
  transform: translate(-50%, -50%);
  pointer-events: none;
  transition: width var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), height var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), border-radius var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)) var(--tc-duration-fast, var(--_tc-duration-fast));
}
:where([data-look="standard"], [data-look="standard"] *).ui-otp__pill-inner {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5, var(--_tc-space-1-5));
  padding: 0 var(--tc-space-4, var(--_tc-space-4)) 0 var(--tc-space-3, var(--_tc-space-3));
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  white-space: nowrap;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  opacity: 0;
  transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-otp__check { flex: none; width: 17px; height: 17px; fill: none; stroke: var(--tc-status-success-solid, var(--_tc-status-success-solid)); stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-otp[data-status="verifying"] .ui-otp__box { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); box-shadow: 0 0 0 0.5px var(--tc-border-default, var(--_tc-border-default)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
/* Error: no red strokes – the cells get a faint red fill and the digits turn red */
:where([data-look="clean"], [data-look="clean"] *).ui-otp[data-error] .ui-otp__box { background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg)); color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
/* Success: the cells slide together and fade while one frame morphs into the "Verified" chip */
:where([data-look="clean"], [data-look="clean"] *).ui-otp__pill {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 1;
  display: grid;
  place-items: center;
  height: calc(var(--size) * 1.1);
  overflow: hidden;
  border-radius: calc(var(--size) * 0.2);
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised));
  opacity: 0;
  transform: translate(-50%, -50%);
  pointer-events: none;
  transition: width var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), background-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)), opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)) var(--tc-duration-fast, var(--_tc-duration-fast));
}
:where([data-look="clean"], [data-look="clean"] *).ui-otp__pill-inner {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5, var(--_tc-space-1-5));
  padding: 0 var(--tc-space-3-5, var(--_tc-space-3-5)) 0 var(--tc-space-3, var(--_tc-space-3));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  white-space: nowrap;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  opacity: 0;
  transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-otp__check { width: 16px; height: 16px; flex: none; fill: none; stroke: var(--tc-status-success-solid, var(--_tc-status-success-solid)); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-otp__check path { stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset var(--tc-duration-quick, var(--_tc-duration-quick)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-otp[data-status="success"] .ui-otp__box {
  transform: translateX(calc(((var(--n) - 1) / 2 - var(--i)) * (var(--size) + var(--tc-otp-input-gap)))) scale(0.7);
  opacity: 0;
  transition: transform var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)) var(--tc-duration-quick, var(--_tc-duration-quick));
}
.ui-otp[data-status="success"] .ui-otp__sep { opacity: 0; }
/* The pill settles at a compact height, not the height of the boxes */
:where([data-look="standard"], [data-look="standard"] *).ui-otp[data-status="success"] .ui-otp__pill {
  height: 36px;
  border-radius: var(--tc-radius-full, var(--_tc-radius-full));
  opacity: 1;
  transition: width var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-base, var(--_tc-duration-base)), height var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-base, var(--_tc-duration-base)), border-radius var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-base, var(--_tc-duration-base)), opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)) var(--tc-duration-quick, var(--_tc-duration-quick));
}
:where([data-look="clean"], [data-look="clean"] *).ui-otp[data-status="success"] .ui-otp__pill {
  background: var(--tc-status-success-bg, var(--_tc-status-success-bg));
  opacity: 1;
  transition: width var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-base, var(--_tc-duration-base)), background-color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)) var(--tc-duration-slow, var(--_tc-duration-slow)), opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)) var(--tc-duration-quick, var(--_tc-duration-quick));
}
.ui-otp[data-status="success"] .ui-otp__pill-inner { opacity: 1; transition: opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)) var(--tc-duration-slower, var(--_tc-duration-slower)); }
.ui-otp[data-status="success"] .ui-otp__check path { stroke-dashoffset: 0; transition: stroke-dashoffset var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-slowest, var(--_tc-duration-slowest)); }
/* The error message grows in below, then folds away */
.ui-otp__msg { display: grid; grid-template-rows: 0fr; width: 100%; transition: grid-template-rows var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)); }
.ui-otp__msg[data-show] { grid-template-rows: 1fr; }
.ui-otp__msg-inner { min-height: 0; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-otp__msg-text {
  margin: 0;
  padding-top: var(--tc-space-2-5, var(--_tc-space-2-5));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  text-wrap: balance;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move));
}
:where([data-look="clean"], [data-look="clean"] *).ui-otp__msg-text {
  margin: 0;
  padding-top: var(--tc-space-2, var(--_tc-space-2));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  text-wrap: balance;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move));
}
.ui-otp__msg[data-show] .ui-otp__msg-text { opacity: 1; transform: none; transition-delay: 60ms; }
/* The icon sits inline, so a wrapped message stays centered with it */
:where([data-look="standard"], [data-look="standard"] *).ui-otp__alert { display: inline-block; width: 15px; height: 15px; margin-right: var(--tc-space-1-5, var(--_tc-space-1-5)); vertical-align: -3px; fill: none; stroke: var(--tc-status-danger-solid, var(--_tc-status-danger-solid)); stroke-width: 2; stroke-linecap: round; }
/* Resend: a countdown that turns into a button */
:where([data-look="standard"], [data-look="standard"] *).ui-otp__resend { margin-top: var(--tc-space-3-5, var(--_tc-space-3-5)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); font-variant-numeric: tabular-nums; color: var(--tc-text-muted, var(--_tc-text-muted)); transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
/* The icon sits inline, so a wrapped message stays centered with it */
:where([data-look="clean"], [data-look="clean"] *).ui-otp__alert { display: inline-block; width: 14px; height: 14px; margin-right: var(--tc-space-1-5, var(--_tc-space-1-5)); vertical-align: -3px; fill: none; stroke: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); stroke-width: 1.7; stroke-linecap: round; }
/* Resend: a countdown that turns into a tab-style button */
:where([data-look="clean"], [data-look="clean"] *).ui-otp__resend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-2, var(--_tc-space-2));
  min-height: 28px;
  margin-top: var(--tc-space-3, var(--_tc-space-3));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-muted, var(--_tc-text-muted));
  transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-otp[data-align="center"] .ui-otp__resend { justify-content: center; }
.ui-otp__resend[data-hidden] { opacity: 0; visibility: hidden; transition: opacity var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)), visibility 0s var(--tc-duration-base, var(--_tc-duration-base)); }
.ui-otp__swap { display: inline-block; animation: ui-otp-in var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both; }
.ui-otp__wait { color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-otp__time { display: inline-block; min-width: 3.4ch; text-align: left; }
:where([data-look="standard"], [data-look="standard"] *).ui-otp__resend-btn {
  position: relative;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  color: var(--tc-accent-text, var(--_tc-accent-text));
  cursor: pointer;
}
:where([data-look="standard"], [data-look="standard"] *).ui-otp__resend-btn::before { content: ""; position: absolute; inset: -6px -8px; border-radius: var(--tc-radius-md, var(--_tc-radius-md)); }
:where([data-look="standard"], [data-look="standard"] *).ui-otp__resend-btn:hover { text-decoration: underline; text-underline-offset: 3px; }
:where([data-look="standard"], [data-look="standard"] *).ui-otp__resend-btn:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: 3px; border-radius: var(--tc-radius-xs, var(--_tc-radius-xs)); }
:where([data-look="standard"], [data-look="standard"] *).ui-otp__resend-btn:disabled { color: var(--tc-text-muted, var(--_tc-text-muted)); cursor: default; text-decoration: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-otp__time { display: inline-block; min-width: 3.4ch; text-align: left; color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-otp__resend-btn {
  position: relative;
  padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-2-5, var(--_tc-space-2-5));
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  box-shadow: inset 0 0 0 0.5px var(--tc-border-default, var(--_tc-border-default));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *).ui-otp__resend-btn:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-otp__resend-btn:active { background: var(--tc-fill-default, var(--_tc-fill-default)); }
:where([data-look="clean"], [data-look="clean"] *).ui-otp__resend-btn:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
:where([data-look="clean"], [data-look="clean"] *).ui-otp__resend-btn:disabled { color: var(--tc-text-disabled, var(--_tc-text-disabled)); background: none; cursor: default; }
.ui-otp__live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@keyframes ui-otp-pop { from { opacity: 0; transform: translateY(4px) scale(0.7); filter: blur(3px); } to { opacity: 1; transform: none; filter: none; } }
@keyframes ui-otp-out { to { opacity: 0; transform: translateY(-4px) scale(0.8); filter: blur(2px); } }
@keyframes ui-otp-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
@keyframes ui-otp-shimmer { 0% { transform: translateX(-120%); } 55%, 100% { transform: translateX(120%); } }
@keyframes ui-otp-in { from { opacity: 0; transform: translateY(3px); filter: blur(2px); } to { opacity: 1; transform: none; filter: none; } }
/* Narrow containers (phones): tighter gaps, the question before "Resend" drops first */
@container (max-width: 360px) {
.ui-otp__slots { --tc-otp-input-gap: 6px; }
:where([data-look="standard"], [data-look="standard"] *).ui-otp__sep { width: 8px; }
}
@container (max-width: 360px) {
:where([data-look="clean"], [data-look="clean"] *).ui-otp__sep { width: 6px; }
}
@container (max-width: 250px) {
  .ui-otp__resend-q { display: none; }
}
/* Touch screens: a bigger target for Resend */
@media (hover: none) and (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-otp__resend-btn::before { inset: -11px -12px; }
}
/* Touch screens: a taller Resend button */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-otp__resend-btn { padding: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-3, var(--_tc-space-3)); }
}
@media (prefers-reduced-motion: reduce) {
  .ui-otp *, .ui-otp *::before, .ui-otp *::after { animation: none !important; transition: none !important; }
  .ui-otp__caret[data-show] { opacity: 1; }
}
`;
