"use client";

/*
 * Agent Steering – steer an agent while it works, without stopping it, in a single self-contained file.
 * A white card on a soft gray tray: the run on top (title, model, a live clock, Pause) and the plan below it – done
 * steps, the active step with a spinner and its own clock, the steps still to come. On the tray under the card:
 * the queued notes and the field, "Steer the agent…".
 *   · ↵ queues a note for the next step: it lands as a small card between the plan and the field
 *   · when the agent finishes a step and takes the note in, the card glides up into the plan and stays there,
 *     attached to the step it changed, with "Picked up"
 *   · ⌘↵ (or "Now" on a queued note) interrupts: the note goes to the active step right away
 * The run is yours: the component shows the steps and the queue you pass and reports what people type – your agent
 * decides when a note is taken in (move it from `queue` to a step's `notes`, the glide happens by itself).
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: agent-steering.tsx is Standard,
 * agent-steering-clean.tsx is Clean). Clean is one white card: the queued notes and the field sit inside it, at the
 * bottom, instead of on the gray tray under the card – and the whole card grows and shrinks as notes come and go.
 */
// Generated from src/components/agent-steering.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "clean";
const ROOT_CLASS = "ui-st";

export type SteerNote = {
  id: string;
  text: string;
  /** Set when the agent took the note in – shows "Picked up" (or "Interrupted" when it was applied right away) */
  picked?: "next" | "now";
};

export type SteerStepStatus = "done" | "active" | "pending";

export type SteerStep = {
  id: string;
  title: string;
  status?: SteerStepStatus;
  /** Time the step took in ms – shown on done steps */
  duration?: number;
  /** When the active step started – its clock ticks from here */
  startedAt?: number | Date;
  /** Notes the agent took in for this step – a note that leaves the queue and shows up here glides over */
  notes?: SteerNote[];
};

export type SteerRunStatus = "running" | "paused" | "done";

type AgentSteeringOwnProps = {
  /** Visual style. Defaults to the file's look: Standard in agent-steering.tsx, Clean in agent-steering-clean.tsx */
  look?: Look;
  /** What the agent is working on, e.g. "Migrate users table" */
  title: string;
  /** Name of the agent or model, e.g. "Opus 5.5" */
  agent?: string;
  steps: SteerStep[];
  /** Notes waiting for the next step, oldest first */
  queue: SteerNote[];
  status?: SteerRunStatus;
  /** When the run started (epoch ms or a Date) – the clock in the header ticks from here */
  startedAt?: number | Date;
  /** ↵ in the field: queue this note for the next step. May return a promise: the field waits, and if it rejects the
   *  text comes back so it can be sent again */
  onQueue?: (text: string) => void | Promise<unknown>;
  /** ⌘↵ in the field, or "Now" on a queued note (then with its id): apply it to the active step right away. May
   *  return a promise, like onQueue */
  onInterrupt?: (text: string, queuedId?: string) => void | Promise<unknown>;
  /** The text in the field. Controlled when defined – pair with onDraftChange; otherwise the component keeps it,
   *  starting from `defaultDraft` */
  draft?: string;
  defaultDraft?: string;
  onDraftChange?: (text: string) => void;
  /** ✕ on a queued note */
  onRemove?: (id: string) => void;
  /** Shows Pause / Resume in the header */
  onPause?: () => void;
  onResume?: () => void;
  placeholder?: string;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export type AgentSteeringProps = Omit<ComponentPropsWithoutRef<"div">, keyof AgentSteeringOwnProps> & AgentSteeringOwnProps;

/* ---------- Helpers ---------- */

const ms = (d: number | Date) => (typeof d === "number" ? d : d.getTime());
const pad = (n: number) => String(n).padStart(2, "0");
const clock = (time: number) => {
  const s = Math.max(0, Math.floor(time / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${pad(s % 60)}s`;
  return `${Math.floor(m / 60)}h ${pad(m % 60)}m`;
};
const seconds = (time: number) => `${(Math.max(0, time) / 1000).toFixed(1)}s`;
/** Read after mount only – the server and the first render assume Ctrl */
const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);
const EASE = "cubic-bezier(0.32, 0.72, 0.24, 1)";

/* ---------- Icons ---------- */

const line = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;
/** The agent's mark – a small four-point spark */
const Spark = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <path d="M7 1.2c.4 2.9 1.9 4.4 4.8 4.8-2.9.4-4.4 1.9-4.8 4.8C6.6 7.9 5.1 6.4 2.2 6 5.1 5.6 6.6 4.1 7 1.2Z" fill="currentColor" />
    <circle cx="11.6" cy="11.4" r="1.1" fill="currentColor" opacity="0.55" />
  </svg>
);
const StepIcon = ({ status }: { status: SteerStepStatus }) => (
  <span className="ui-st__step-icon" data-status={status} aria-hidden="true">
    {status === "done" && (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="6.5" fill="currentColor" />
        <path d="m5.4 8.2 1.8 1.8 3.4-3.7" fill="none" stroke="currentColor" className="ui-st__step-check" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
    {status === "active" && (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="5.8" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.6" />
        <path d="M8 2.2a5.8 5.8 0 0 1 5.8 5.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    )}
    {status === "pending" && (
      <svg width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="5.8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2 2.2" />
      </svg>
    )}
  </span>
);
const PauseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <rect x="4.2" y="3.4" width="2.6" height="9.2" rx="0.9" fill="currentColor" />
    <rect x="9.2" y="3.4" width="2.6" height="9.2" rx="0.9" fill="currentColor" />
  </svg>
);
const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M5 3.6v8.8c0 .6.6.9 1.1.6l6.6-4.4a.7.7 0 0 0 0-1.2L6.1 3c-.5-.3-1.1 0-1.1.6Z" fill="currentColor" />
  </svg>
);
const BoltIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path d="M6.9 1 2.6 6.6h3l-.5 4.4 4.3-5.6h-3L6.9 1Z" fill="currentColor" />
  </svg>
);
const CloseIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path d="m3.4 3.4 5.2 5.2M8.6 3.4 3.4 8.6" {...line} />
  </svg>
);
const ArrowUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M8 12.6V3.6M4.2 7.2 8 3.4l3.8 3.8" {...line} strokeWidth={1.6} />
  </svg>
);
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path d="m2.8 6.2 2 2 4.4-4.6" {...line} strokeWidth={1.5} />
  </svg>
);
const CornerIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path d="M3 2.4v3.4c0 .9.7 1.6 1.6 1.6h4.6M7.6 5.6l1.8 1.8-1.8 1.8" {...line} strokeWidth={1.2} />
  </svg>
);

/* ---------- The clocks: written straight to the page, never a React render per tick ---------- */

/**
 * Calls `tick` every `interval` ms while `active` – but only while the component is on screen and the tab is visible.
 * A component that isn't reported yet counts as visible, so the first tick never waits for an observer.
 */
function useTicker(active: boolean, target: { current: Element | null }, interval: number, tick: { current: () => void }) {
  useEffect(() => {
    if (!active) return;
    let id = 0;
    let onScreen = true;
    const sync = () => {
      const run = onScreen && document.visibilityState !== "hidden";
      if (run && !id) {
        tick.current();
        id = window.setInterval(() => tick.current(), interval);
      } else if (!run && id) {
        window.clearInterval(id);
        id = 0;
      }
    };
    const io = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver((entries) => {
      onScreen = entries[entries.length - 1]?.isIntersecting ?? true;
      sync();
    });
    if (target.current) io?.observe(target.current);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      window.clearInterval(id);
      io?.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [active, target, interval, tick]);
}

const runLabel = (status: SteerRunStatus, runTime: number) => (status === "done" ? `Done in ${clock(runTime)}` : status === "paused" ? "Paused" : `Running · ${clock(runTime)}`);

/** The run's time and each step's time at `now` */
function clockTimes(now: number, startedAt: number | Date | undefined, firstSeen: number | null, activeSince: Map<string, number>) {
  return {
    runTime: now - (startedAt !== undefined ? ms(startedAt) : firstSeen ?? now),
    stepTime: (s: SteerStep) => now - (s.startedAt !== undefined ? ms(s.startedAt) : activeSince.get(s.id) ?? now),
  };
}

/** A stable ref callback per key, filling `into` */
function useRefMap<T extends HTMLElement>() {
  const [m] = useState(() => ({ els: new Map<string, T>(), fns: new Map<string, (el: T | null) => void>() }));
  const refFor = (key: string) => {
    let fn = m.fns.get(key);
    if (!fn) {
      fn = (el) => {
        if (el) m.els.set(key, el);
        else m.els.delete(key);
      };
      m.fns.set(key, fn);
    }
    return fn;
  };
  return [m.els, refFor] as const;
}

/**
 * The run's clock in the header and the active step's clock. React renders them once per change of state;
 * between changes they are painted into their text by a 10 Hz ticker that pauses off-screen and in hidden tabs.
 */
function useRunClocks({ steps, status, startedAt }: { steps: SteerStep[]; status: SteerRunStatus; startedAt?: number | Date }, rootRef: { current: HTMLElement | null }) {
  // Read after mount: 0 on the server and the first render
  const [firstSeen, setFirstSeen] = useState<number | null>(null);
  useLayoutEffect(() => setFirstSeen(Date.now()), []);
  // When each active step without its own start time was first seen active – recorded after the commit
  const activeSince = useRef(new Map<string, number>());
  const activeKey = steps.filter((s) => s.status === "active" && s.startedAt === undefined).map((s) => s.id).join("|");
  useLayoutEffect(() => {
    const t = Date.now();
    for (const id of activeKey.split("|")) if (id && !activeSince.current.has(id)) activeSince.current.set(id, t);
  }, [activeKey]);

  // The elements the ticker paints: the header's state (its text node) and each step's time
  const stateEl = useRef<HTMLSpanElement>(null);
  const [stepEls, stepRef] = useRefMap<HTMLElement>();
  const paint = useRef(() => {});
  // After every change, paint the clocks at once – what React rendered was from the last snapshot
  useLayoutEffect(() => {
    paint.current = () => {
      const { runTime, stepTime } = clockTimes(Date.now(), startedAt, firstSeen, activeSince.current);
      const text = stateEl.current?.lastChild;
      const label = runLabel(status, runTime);
      if (text?.nodeType === 3 && text.nodeValue !== label) text.nodeValue = label;
      if (status !== "running") return;
      for (const s of steps) {
        const el = s.status === "active" ? stepEls.get(s.id) : undefined;
        if (!el) continue;
        const value = seconds(stepTime(s));
        if (el.textContent !== value) el.textContent = value;
      }
    };
    paint.current();
  }, [steps, status, startedAt, firstSeen, activeKey, stepEls]);
  useTicker(status === "running", rootRef, 100, paint);

  // What React renders: the clocks as of the mount snapshot (corrected before the browser paints)
  const { runTime, stepTime } = clockTimes(firstSeen ?? 0, startedAt, firstSeen, activeSince.current);
  return { stateLabel: runLabel(status, runTime), stepTime, stateEl, stepRef };
}

/* ---------- Motion: every note and step glides from where it was – a note that left the queue flies into the plan ---------- */

/** All reads: every tracked element's place relative to the component, and the card's height */
function restingPlaces(root: HTMLElement | null, box: HTMLElement | null, tracked: Map<string, HTMLElement>) {
  const origin = root?.getBoundingClientRect();
  const at = new Map<string, { left: number; top: number }>();
  if (!root || !origin) return { at, height: 0 };
  for (const [key, el] of tracked) {
    const r = el.getBoundingClientRect();
    at.set(key, { left: r.left - origin.left, top: r.top - origin.top });
  }
  return { at, height: box?.offsetHeight ?? 0 };
}

/**
 * Measures where everything rests after each commit that can move things (never during render, and not on clock
 * ticks), and when the shape changed, glides from before. A window resize moves things without a change of shape.
 */
function useGlide(rootRef: { current: HTMLElement | null }, cardRef: { current: HTMLElement | null }, look: Look, shape: string, draft: string) {
  const [tracked, track] = useRefMap<HTMLElement>();
  const before = useRef(new Map<string, { left: number; top: number }>());
  const cardHeight = useRef(0);
  const lastShape = useRef<string | null>(null);
  const boxRef = look === "clean" ? cardRef : rootRef;

  useEffect(() => {
    const onResize = () => {
      const m = restingPlaces(rootRef.current, boxRef.current, tracked);
      before.current = m.at;
      cardHeight.current = m.height;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [rootRef, boxRef, tracked]);

  // After the field has its height (`draft`): measure where everything rests, and when the shape changed, glide from before
  useLayoutEffect(() => {
    const { at, height } = restingPlaces(rootRef.current, boxRef.current, tracked);
    const changed = lastShape.current !== null && lastShape.current !== shape;
    lastShape.current = shape;
    if (changed && !reducedMotion()) {
      // The card grows and shrinks smoothly instead of jumping
      const card = boxRef.current;
      if (card && cardHeight.current && Math.abs(height - cardHeight.current) > 1) {
        card.animate([{ height: `${cardHeight.current}px` }, { height: `${height}px` }], { duration: 480, easing: EASE });
      }
      for (const [key, el] of tracked) {
        const id = key.slice(key.indexOf(":") + 1);
        // A note keeps its id from the queue into the plan – look for it under both keys
        const from = before.current.get(key) ?? (key.startsWith("note:") ? before.current.get(`queued:${id}`) : undefined);
        const to = at.get(key)!;
        if (!from) {
          el.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 360, easing: EASE });
          continue;
        }
        const dx = from.left - to.left;
        const dy = from.top - to.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
        const flew = !before.current.has(key);
        el.animate(
          [
            { transform: `translate(${dx}px, ${dy}px)`, zIndex: 2 },
            { transform: "none", zIndex: 2 },
          ],
          { duration: flew ? 620 : 480, easing: EASE },
        );
        // Landed in the plan: a soft wash says "this changed"
        if (flew) el.setAttribute("data-landed", "");
      }
    }
    before.current = at;
    cardHeight.current = height;
  }, [shape, draft, rootRef, boxRef, tracked]);

  return track;
}

/* ---------- The field: a note on its way holds the send button; one that fails comes back ---------- */

function useSteerField({
  draft,
  setDraft,
  open,
  onQueue,
  onInterrupt,
  setAnnounce,
}: {
  draft: string;
  setDraft: (next: string | ((d: string) => string)) => void;
  open: boolean;
  onQueue?: AgentSteeringProps["onQueue"];
  onInterrupt?: AgentSteeringProps["onInterrupt"];
  setAnnounce: (text: string) => void;
}) {
  // A note on its way (the send button waits), or one that didn't go through
  const [sending, setSending] = useState<"pending" | "error" | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  // A note that returns a promise holds the send button; if it rejects, its text comes back to the field
  const watch = (text: string, done: void | Promise<unknown> | undefined, restore: boolean) => {
    if (!done || typeof (done as Promise<unknown>).then !== "function") {
      setSending(null);
      return;
    }
    setSending("pending");
    (done as Promise<unknown>).then(
      () => alive.current && setSending(null),
      () => {
        if (!alive.current) return;
        setSending("error");
        if (restore) setDraft((d) => d || text);
        setAnnounce(`Couldn't send: ${text}`);
      },
    );
  };
  const send = (now: boolean) => {
    const text = draft.trim();
    if (!text || !open || sending === "pending") return;
    const done = now ? onInterrupt?.(text) : onQueue?.(text);
    setAnnounce(now ? `Interrupting: ${text}` : `Queued for the next step: ${text}`);
    setDraft("");
    watch(text, done, true);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(e.metaKey || e.ctrlKey);
    } else if (e.key === "Escape" && draft) {
      e.stopPropagation();
      setDraft("");
    }
  };
  return { sending, setSending, watch, send, onKeyDown };
}

/* ---------- The queued notes and the field: on the tray under the card (Standard) or inside it, at the bottom (Clean) ---------- */

function SteerLower({
  uid,
  queue,
  open,
  mod,
  draft,
  setDraft,
  placeholder,
  field,
  fieldRef,
  track,
  onInterrupt,
  onRemove,
}: {
  uid: string;
  queue: SteerNote[];
  open: boolean;
  mod: string;
  draft: string;
  setDraft: (text: string) => void;
  placeholder: string;
  field: ReturnType<typeof useSteerField>;
  fieldRef: { current: HTMLTextAreaElement | null };
  track: (key: string) => (el: HTMLElement | null) => void;
  onInterrupt?: AgentSteeringProps["onInterrupt"];
  onRemove?: (id: string) => void;
}) {
  const { sending, setSending, watch, send, onKeyDown } = field;
  return (
    <>
      {/* ----- Waiting for the next step ----- */}
      {queue.length > 0 && (
        <div className="ui-st__queue" ref={track("queue:box")}>
          <div className="ui-st__label">
            Queued for the next step <span>{queue.length}</span>
          </div>
          <ul className="ui-st__queued">
            {queue.map((n) => (
              <li key={n.id} ref={track(`queued:${n.id}`)} className="ui-st__chip">
                <span className="ui-st__chip-text">{n.text}</span>
                {onInterrupt && open && (
                  <button
                    type="button"
                    className="ui-st__chip-btn"
                    data-focus-key={`now:${n.id}`}
                    aria-label={`Apply now: “${n.text}”`}
                    title={`Apply now (${mod}↵)`}
                    onClick={() => watch(n.text, onInterrupt(n.text, n.id), false)}
                  >
                    <BoltIcon />
                    Now
                  </button>
                )}
                {onRemove && (
                  <button
                    type="button"
                    className="ui-st__chip-x"
                    data-focus-key={`x:${n.id}`}
                    aria-label={`Remove “${n.text}”`}
                    onClick={(e) => {
                      // Focus first goes to the next note's ✕ (or the one before, or the field) – then the note goes
                      const li = e.currentTarget.closest("li");
                      const near = (el: Element | null | undefined) => el?.querySelector(".ui-st__chip-x");
                      rescueFocus(li, [near(li?.nextElementSibling), near(li?.previousElementSibling), fieldRef.current]);
                      onRemove(n.id);
                    }}
                  >
                    <CloseIcon />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ----- Steer ----- */}
      <div className="ui-st__compose" ref={track("compose:box")} data-disabled={open ? undefined : ""}>
        <div
          className="ui-st__field"
          // A click on the free space puts the caret in – never one on its buttons, and never scrolling the page
          onClick={(e) => !(e.target as HTMLElement).closest("button") && fieldRef.current?.focus({ preventScroll: true })}
        >
          <textarea
            ref={fieldRef}
            id={`${uid}-field`}
            rows={1}
            value={draft}
            disabled={!open}
            placeholder={open ? placeholder : "The run has finished"}
            aria-label="Steer the agent"
            aria-describedby={`${uid}-hint`}
            onChange={(e) => {
              setDraft(e.target.value);
              if (sending === "error") setSending(null);
            }}
            onKeyDown={onKeyDown}
          />
          <button
            type="button"
            className="ui-st__send"
            aria-label="Queue for the next step"
            disabled={!draft.trim() || !open || sending === "pending"}
            aria-busy={sending === "pending" || undefined}
            onClick={() => send(false)}
          >
            <ArrowUpIcon />
          </button>
        </div>
        <div className="ui-st__hint" id={`${uid}-hint`}>
          {sending === "error" ? (
            <span className="ui-st__error" role="alert">
              Couldn't send – try again
            </span>
          ) : open ? (
            <>
              <span>
                <kbd>↵</kbd> next step
              </span>
              {onInterrupt && (
                <span>
                  <kbd>{mod}</kbd>
                  <kbd>↵</kbd> interrupt now
                </span>
              )}
            </>
          ) : (
            <span>Notes still in the queue were not used</span>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------- The component ---------- */

export function AgentSteering({
  look,
  title,
  agent,
  steps,
  queue,
  status = "running",
  startedAt,
  onQueue,
  onInterrupt,
  onRemove,
  draft: draftProp,
  defaultDraft = "",
  onDraftChange,
  onPause,
  onResume,
  placeholder = "Steer the agent…",
  className,
  ref,
  ...rest
}: AgentSteeringProps) {
  const uid = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const setRoot = useRootRef(rootRef, ref);
  const cardRef = useRef<HTMLDivElement>(null);
  const resolvedLook = look ?? DEFAULT_LOOK;
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useControllable(draftProp, defaultDraft, onDraftChange, "draft");
  const [announce, setAnnounce] = useState("");
  // The platform is read after mount: "Ctrl" on the server and the first render
  const [mac, setMac] = useState(false);
  useLayoutEffect(() => setMac(isMac()), []);
  const mod = mac ? "⌘" : "Ctrl";

  const { stateLabel, stepTime, stateEl, stepRef } = useRunClocks({ steps, status, startedAt }, rootRef);
  const done = steps.filter((s) => s.status === "done").length;
  const open = status !== "done";

  const shape = JSON.stringify([steps.map((s) => [s.id, s.status, s.title, (s.notes ?? []).map((n) => n.id)]), queue.map((n) => n.id)]);
  const track = useGlide(rootRef, cardRef, resolvedLook, shape, draft);
  // The shimmer on the active step rests while the run is off screen
  const onScreen = useOnScreen(rootRef);

  // Focus never falls to <body> when a queued note goes (Now, ✕) or the run ends: the same button on the next note,
  // else the one before, else the field, else Pause/Resume, else the card
  // The queue before its last change – where a removed note sat (kept by the effect, read by the rescue after it)
  const queueKey = queue.map((n) => n.id).join("\u0000");
  const queues = useRef({ now: [] as string[], before: [] as string[] });
  useLayoutEffect(() => {
    queues.current = { before: queues.current.now, now: queueKey ? queueKey.split("\u0000") : [] };
  }, [queueKey]);
  useFocusRescue(rootRef, {
    fallback: (key) => {
      const root = rootRef.current;
      if (!root) return null;
      const field = root.querySelector<HTMLTextAreaElement>("textarea");
      const m = key?.match(/^(now|x):(.*)$/);
      if (m) {
        const was = queues.current.before;
        const at = was.indexOf(m[2]);
        const left = new Set(queue.map((n) => n.id));
        const order = [...was.slice(at + 1), ...was.slice(0, Math.max(0, at)).reverse()].filter((id) => left.has(id));
        for (const id of order) {
          const el = root.querySelector(`[data-focus-key="${CSS.escape(`${m[1]}:${id}`)}"]`) ?? root.querySelector(`[data-focus-key="${CSS.escape(`x:${id}`)}"]`);
          if (el) return el;
        }
      }
      return field && !field.disabled ? field : root.querySelector(".ui-st__icon-btn");
    },
  });

  // What the agent took in, for screen readers
  const pickedKey = steps.flatMap((s) => (s.notes ?? []).filter((n) => n.picked).map((n) => n.id)).join("|");
  const seenPicked = useRef(new Set(pickedKey.split("|").filter(Boolean)));
  useEffect(() => {
    for (const s of steps)
      for (const n of s.notes ?? [])
        if (n.picked && !seenPicked.current.has(n.id)) {
          seenPicked.current.add(n.id);
          setAnnounce(`${agent ?? "The agent"} picked up: ${n.text}`);
        }
  }, [pickedKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const field = useSteerField({ draft, setDraft, open, onQueue, onInterrupt, setAnnounce });
  // The field grows with its text, up to three lines
  useLayoutEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 60)}px`;
  }, [draft]);

  const lower = (
    <SteerLower
      uid={uid}
      queue={queue}
      open={open}
      mod={mod}
      draft={draft}
      setDraft={setDraft}
      placeholder={placeholder}
      field={field}
      fieldRef={fieldRef}
      track={track}
      onInterrupt={onInterrupt}
      onRemove={onRemove}
    />
  );

  return (
    <div {...rest} ref={setRoot} className={[ROOT_CLASS, className].filter(Boolean).join(" ")} data-look={resolvedLook} data-status={status} data-offscreen={onScreen ? undefined : ""}>
      <style href="ui-agent-steering" precedence="default">
        {css}
      </style>

      <div ref={cardRef} className="ui-st__card">
        {/* ----- The run ----- */}
        <header className="ui-st__head">
          <span className="ui-st__spark">
            <Spark />
          </span>
          <div className="ui-st__heading">
            <span className="ui-st__title" title={title}>
              {title}
            </span>
            <span className="ui-st__sub">
              {agent && (
                <>
                  {agent}
                  <span className="ui-st__dot" aria-hidden="true">
                    ·
                  </span>
                </>
              )}
              {status === "done" ? `${steps.length} steps` : `Step ${Math.min(done + 1, steps.length)} of ${steps.length}`}
            </span>
          </div>
          <span ref={stateEl} className="ui-st__state" data-status={status}>
            <span className="ui-st__pulse" aria-hidden="true" />
            {stateLabel}
          </span>
          {/* Pause and Resume are one button, so focus stays on it when the run pauses or resumes */}
          {((status === "running" && onPause) || (status === "paused" && onResume)) && (
            <button
              type="button"
              className="ui-st__icon-btn"
              aria-label={status === "running" ? "Pause the run" : "Resume the run"}
              title={status === "running" ? "Pause" : "Resume"}
              onClick={status === "running" ? onPause : onResume}
            >
              {status === "running" ? <PauseIcon /> : <PlayIcon />}
            </button>
          )}
        </header>

        {/* ----- The plan ----- */}
        <ol className="ui-st__plan" aria-label="Plan">
          {steps.map((s) => {
            const st = s.status ?? "pending";
            return (
              <li key={s.id} ref={track(`step:${s.id}`)} className="ui-st__step" data-status={st} aria-current={st === "active" ? "step" : undefined}>
                <div className="ui-st__step-row">
                  <StepIcon status={st} />
                  {/* The state in words – the icons are only pictures */}
                  <span className="ui-st__sr">{st === "done" ? "Done: " : st === "active" ? "In progress: " : "To do: "}</span>
                  <span className="ui-st__step-title" title={s.title}>
                    {s.title}
                    {st === "active" && status === "running" && (
                      // The shimmer: a narrow window sweeps across a lighter copy of the title (transform only)
                      <span className="ui-st__shine" aria-hidden="true">
                        <span>{s.title}</span>
                      </span>
                    )}
                  </span>
                  <span className="ui-st__step-time" ref={stepRef(s.id)}>
                    {st === "done" && s.duration !== undefined ? seconds(s.duration) : st === "active" && status === "running" ? seconds(stepTime(s)) : ""}
                  </span>
                </div>
                {(s.notes ?? []).map((n) => (
                  <div key={n.id} ref={track(`note:${n.id}`)} className="ui-st__note" data-picked={n.picked ?? undefined}>
                    <CornerIcon />
                    <span className="ui-st__note-text">{n.text}</span>
                    {n.picked && (
                      <span className="ui-st__note-tag">
                        <CheckIcon />
                        {n.picked === "now" ? "Interrupted" : "Picked up"}
                      </span>
                    )}
                  </div>
                ))}
              </li>
            );
          })}
        </ol>
        {resolvedLook === "clean" && lower}
      </div>

      {resolvedLook === "standard" && lower}

      <span className="ui-st__sr" role="status">
        {announce}
      </span>
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

const reducedMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* ---------- Styles ---------- */

const css = /* css */ `
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-st:where([data-look="standard"]),
.ui-st__portal:where([data-look="standard"]) {
  --_tc-accent-subtle: light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16));
  --_tc-accent-text: light-dark(#2456d6, #8ab4ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-action-ghost-fg: light-dark(#404040, #c8c8cc);
  --_tc-action-primary-bg: light-dark(#171717, #ededed);
  --_tc-action-primary-bg-active: light-dark(#0a0a0a, #c8c8cc);
  --_tc-action-primary-bg-hover: light-dark(#262626, #ffffff);
  --_tc-action-primary-fg: light-dark(#ffffff, #111113);
  --_tc-action-primary-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-bg: light-dark(#ffffff, #232326);
  --_tc-action-secondary-fg: light-dark(#171717, #ededed);
  --_tc-action-secondary-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-border-strong: light-dark(#dedede, #3a3a40);
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
  --_tc-control-px-sm: 10px;
  --_tc-control-radius-md: 10px;
  --_tc-control-radius-sm: 8px;
  --_tc-divider: light-dark(#ececec, #2a2a2e);
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-reveal-slow: 900ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-emphasized: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-field-bg: light-dark(#ffffff, #232326);
  --_tc-field-bg-sunken: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-field-radius: 10px;
  --_tc-field-shadow: inset 0 0 0 1px light-dark(#858585, #7c7c82), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-field-shadow-focus: inset 0 0 0 1px light-dark(#2f68ff, #6b95ff), 0 0 0 3px color-mix(in srgb, light-dark(#2f68ff, #6b95ff) 24%, transparent);
  --_tc-field-shadow-hover: inset 0 0 0 1px light-dark(#646464, #9a9aa1), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring: light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-strong: 600;
  --_tc-hairline: 1px;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-kbd-bg: light-dark(#ffffff, #19191b);
  --_tc-kbd-fg: light-dark(#404040, #c8c8cc);
  --_tc-kbd-font-size: 10.5px;
  --_tc-kbd-font-weight: 500;
  --_tc-kbd-h: 18px;
  --_tc-kbd-px: 4px;
  --_tc-kbd-radius: 5px;
  --_tc-kbd-shadow: inset 0 0 0 1px light-dark(#dedede, #3a3a40), 0 1px 0 light-dark(#ececec, #2a2a2e);
  --_tc-line-height-none: 1;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-pill-font-size-lg: 12px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h-lg: 22px;
  --_tc-pill-px-lg: 10px;
  --_tc-pill-radius: 999px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-badge: 999px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-space-7: 28px;
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-solid: light-dark(#1f8a4c, #3ec27a);
  --_tc-status-warning-solid: light-dark(#c2710c, #f5a524);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-tray: light-dark(#f0f0f0, #19191b);
  --_tc-text-disabled: light-dark(#a3a3a3, #5c5c63);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-on-accent: #ffffff;
  --_tc-text-placeholder: light-dark(#646464, #8e8e95);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
}
.ui-st:where([data-look="clean"]),
.ui-st__portal:where([data-look="clean"]) {
  --_tc-accent-subtle: light-dark(rgba(0, 96, 226, 0.06), rgba(77, 141, 255, 0.14));
  --_tc-accent-text: light-dark(#0058cf, #70b8ff);
  --_tc-action-ghost-bg-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-action-ghost-fg: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-action-primary-bg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-action-primary-bg-active: light-dark(rgba(0, 0, 0, 0.94), rgba(255, 255, 255, 0.74));
  --_tc-action-primary-bg-hover: light-dark(rgba(0, 0, 0, 0.8), rgba(255, 255, 255, 0.82));
  --_tc-action-primary-fg: light-dark(#fcfcfc, #161618);
  --_tc-action-primary-shadow: none;
  --_tc-action-secondary-bg: light-dark(#ffffff, #252527);
  --_tc-action-secondary-fg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-action-secondary-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-border-strong: light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14));
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
  --_tc-control-px-sm: 8px;
  --_tc-control-radius-md: 6px;
  --_tc-control-radius-sm: 6px;
  --_tc-divider: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-reveal-slow: 900ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-ease-decelerate: cubic-bezier(0, 0, 0.58, 1);
  --_tc-ease-emphasized: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-field-bg: light-dark(#ffffff, #252527);
  --_tc-field-bg-sunken: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-field-radius: 8px;
  --_tc-field-shadow: inset 0 0 0 1px light-dark(rgba(0, 0, 0, 0.48), rgba(255, 255, 255, 0.4));
  --_tc-field-shadow-focus: inset 0 0 0 1px light-dark(#0060e2, #5b9aff), 0 0 0 3px color-mix(in srgb, light-dark(#0060e2, #5b9aff) 24%, transparent);
  --_tc-field-shadow-hover: inset 0 0 0 1px light-dark(rgba(0, 0, 0, 0.6), rgba(255, 255, 255, 0.52));
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring: light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-font-weight-strong: 500;
  --_tc-hairline: 0.5px;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-kbd-bg: light-dark(#ffffff, #1c1c1e);
  --_tc-kbd-fg: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-kbd-font-size: 10px;
  --_tc-kbd-font-weight: 500;
  --_tc-kbd-h: 16px;
  --_tc-kbd-px: 4px;
  --_tc-kbd-radius: 4px;
  --_tc-kbd-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-line-height-none: 1;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-snug: 18px;
  --_tc-line-height-tight: 16px;
  --_tc-pill-font-size-lg: 12px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h-lg: 20px;
  --_tc-pill-px-lg: 8px;
  --_tc-pill-radius: 5px;
  --_tc-radius-2xs: 2px;
  --_tc-radius-badge: 5px;
  --_tc-radius-lg: 10px;
  --_tc-radius-md: 8px;
  --_tc-radius-sm: 6px;
  --_tc-radius-xl: 12px;
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-space-3: 12px;
  --_tc-space-3-5: 14px;
  --_tc-space-4: 16px;
  --_tc-space-7: 28px;
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-solid: light-dark(#1f8a4c, #3ec27a);
  --_tc-status-warning-solid: light-dark(#c2710c, #f5a524);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-tray: light-dark(#f7f7f7, #161618);
  --_tc-text-disabled: light-dark(rgba(0, 0, 0, 0.27), rgba(255, 255, 255, 0.3));
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-on-accent: #ffffff;
  --_tc-text-placeholder: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.5));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(10px + 4px);
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

/* Colors and motion as variables – override them on .ui-st */
:where([data-look="standard"], [data-look="standard"] *).ui-st {
  --tc-agent-steering-accent: light-dark(#2f6bff, #5b8cff);
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 460px;
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  overflow: hidden;
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-surface-tray, var(--_tc-surface-tray));
  container-type: inline-size;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  letter-spacing: -0.006em;
  color: var(--tc-text-muted, var(--_tc-text-muted));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-st */
:where([data-look="clean"], [data-look="clean"] *).ui-st {
  --tc-agent-steering-rail: light-dark(rgba(0, 0, 0, 0.15), rgba(255, 255, 255, 0.16));
  --tc-agent-steering-accent: light-dark(rgba(0, 96, 226, 0.765), #5b9aff);
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 460px;
  container-type: inline-size;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.ui-st *, .ui-st *::before, .ui-st *::after { box-sizing: border-box; }
:where(.ui-st) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-st button:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
.ui-st ol, .ui-st ul { margin: 0; padding: 0; list-style: none; }
.ui-st svg { display: block; flex: none; }
.ui-st__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* The white card holds the run and its plan – the card recipe */
.ui-st__card { position: relative; border-radius: var(--tc-card-radius, var(--_tc-card-radius)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow)); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__card { overflow: hidden; }
/* ----- The run ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-st__head { display: flex; align-items: center; gap: var(--tc-space-3, var(--_tc-space-3)); min-width: 0; padding: var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-4, var(--_tc-space-4)); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__head { display: flex; align-items: center; gap: var(--tc-space-2-5, var(--_tc-space-2-5)); min-width: 0; padding: var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-3-5, var(--_tc-space-3-5)); }
.ui-st__spark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-agent-steering-accent); }
.ui-st[data-status="paused"] .ui-st__spark { color: var(--tc-status-warning-solid, var(--_tc-status-warning-solid)); }
.ui-st[data-status="done"] .ui-st__spark { color: var(--tc-status-success-solid, var(--_tc-status-success-solid)); }
.ui-st__heading { display: grid; flex: 1; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-st__title { overflow: hidden; font-weight: var(--tc-font-weight-strong, var(--_tc-font-weight-strong)); color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-st__sub { overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-st__title { overflow: hidden; font-weight: var(--tc-font-weight-strong, var(--_tc-font-weight-strong)); color: var(--tc-text-strong, var(--_tc-text-strong)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-st__sub { overflow: hidden; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; text-overflow: ellipsis; }
.ui-st__dot { margin: 0 var(--tc-space-1-5, var(--_tc-space-1-5)); color: var(--tc-text-disabled, var(--_tc-text-disabled)); }
/* The run's state: a large status pill in Standard, plain text in Clean */
:where([data-look="standard"], [data-look="standard"] *).ui-st__state { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-2, var(--_tc-space-2)); height: var(--tc-pill-h-lg, var(--_tc-pill-h-lg)); padding: 0 var(--tc-pill-px-lg, var(--_tc-pill-px-lg)); border-radius: var(--tc-pill-radius, var(--_tc-pill-radius)); background: var(--tc-fill-default, var(--_tc-fill-default)); font-size: var(--tc-pill-font-size-lg, var(--_tc-pill-font-size-lg)); font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight)); color: var(--tc-text-muted, var(--_tc-text-muted)); white-space: nowrap; font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-st__state { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-2, var(--_tc-space-2)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-st__pulse { position: relative; width: 6px; height: 6px; border-radius: 50%; background: var(--tc-agent-steering-accent); }
/* The live dot pulses a few times, then rests (2.2.2) */
.ui-st__pulse::after { content: ""; position: absolute; inset: -3px; border-radius: 50%; background: var(--tc-agent-steering-accent); opacity: 0; animation: ui-st-pulse var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) var(--tc-ease-decelerate, var(--_tc-ease-decelerate)) 3; }
.ui-st__state[data-status="paused"] .ui-st__pulse { background: var(--tc-status-warning-solid, var(--_tc-status-warning-solid)); }
.ui-st__state[data-status="done"] .ui-st__pulse { background: var(--tc-status-success-solid, var(--_tc-status-success-solid)); }
.ui-st__state:not([data-status="running"]) .ui-st__pulse::after { display: none; }
/* Pause / Resume: a secondary icon button, like Button */
.ui-st__icon-btn { display: grid; flex: none; place-items: center; width: var(--tc-control-h-md, var(--_tc-control-h-md)); height: var(--tc-control-h-md, var(--_tc-control-h-md)); border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md)); background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg)); box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow)); color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg)); transition: box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-st__icon-btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
/* ----- The plan: a quiet timeline under a divider ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-st__plan { display: grid; grid-template-columns: minmax(0, 1fr); padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-4, var(--_tc-space-4)) var(--tc-space-3-5, var(--_tc-space-3-5)) !important; border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__plan { display: grid; grid-template-columns: minmax(0, 1fr); padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-3-5, var(--_tc-space-3-5)) var(--tc-space-3, var(--_tc-space-3)) !important; border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
:where([data-look="standard"], [data-look="standard"] *).ui-st__step { position: relative; padding: var(--tc-space-1-5, var(--_tc-space-1-5)) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-st__step { position: relative; padding: var(--tc-space-1, var(--_tc-space-1)) 0; }
/* Short rail segments between the icons, with a little air on both ends */
:where([data-look="standard"], [data-look="standard"] *).ui-st__step:not(:last-child)::after { content: ""; position: absolute; top: 27px; bottom: -3px; left: 7.5px; width: 1px; background: var(--tc-border-strong, var(--_tc-border-strong)); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__step:not(:last-child)::after { content: ""; position: absolute; top: 25px; bottom: -3px; left: 7.5px; width: 0.5px; background: var(--tc-agent-steering-rail); }
:where([data-look="standard"], [data-look="standard"] *).ui-st__step-row { display: flex; align-items: center; gap: var(--tc-space-3, var(--_tc-space-3)); min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-st__step-row { display: flex; align-items: center; gap: var(--tc-space-2-5, var(--_tc-space-2-5)); min-width: 0; }
.ui-st__step-icon { display: grid; flex: none; place-items: center; width: 16px; height: 16px; color: var(--tc-text-disabled, var(--_tc-text-disabled)); }
/* The tick on a done step: the card's surface on an ink disc (Standard), white on the accent disc (Clean) – in both themes */
:where([data-look="standard"], [data-look="standard"] *).ui-st__step-icon[data-status="done"] { color: var(--tc-text-primary, var(--_tc-text-primary)); animation: ui-st-pop var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-emphasized, var(--_tc-ease-emphasized)) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-st__step-check { stroke: var(--tc-surface-raised, var(--_tc-surface-raised)); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__step-icon[data-status="done"] { color: var(--tc-agent-steering-accent); animation: ui-st-pop var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-emphasized, var(--_tc-ease-emphasized)) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-st__step-check { stroke: var(--tc-text-on-accent, var(--_tc-text-on-accent)); }
.ui-st__step-icon[data-status="active"] { color: var(--tc-agent-steering-accent); }
/* The spinner turns a few times, then rests as an arc (2.2.2) */
.ui-st__step-icon[data-status="active"] svg { animation: ui-st-spin var(--tc-duration-reveal-slow, var(--_tc-duration-reveal-slow)) linear 6; }
.ui-st__step-title { position: relative; flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-primary, var(--_tc-text-primary)); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-st__step-title { transition: color var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-st__step[data-status="done"] .ui-st__step-title { color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__step[data-status="done"] .ui-st__step-title { color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
.ui-st__step[data-status="pending"] .ui-st__step-title { color: var(--tc-text-muted, var(--_tc-text-muted)); }
.ui-st__step[data-status="active"] .ui-st__step-title { font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); }
/* The active step shimmers while it runs: a window slides right while the lighter copy inside it slides left by the
   same amount, so the copy stays on the title – transform only, two passes, paused off screen */
.ui-st__shine { position: absolute; top: 0; bottom: 0; left: 0; width: 20%; overflow: hidden; pointer-events: none; animation: ui-st-shine var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) linear 2 both; }
.ui-st__shine > span { position: absolute; top: 0; left: 0; width: 500%; overflow: hidden; color: var(--tc-text-disabled, var(--_tc-text-disabled)); white-space: nowrap; text-overflow: ellipsis; -webkit-mask-image: linear-gradient(90deg, transparent, #000 40% 60%, transparent); mask-image: linear-gradient(90deg, transparent, #000 40% 60%, transparent); animation: ui-st-shine-copy var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) linear 2 both; }
.ui-st[data-offscreen] .ui-st__shine, .ui-st[data-offscreen] .ui-st__shine > span { animation-play-state: paused; }
@keyframes ui-st-shine { from { transform: translateX(-100%); } to { transform: translateX(500%); } }
@keyframes ui-st-shine-copy { from { transform: translateX(20%); } to { transform: translateX(-100%); } }
:where([data-look="standard"], [data-look="standard"] *).ui-st__step-time { flex: none; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-st__step-time { flex: none; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); color: var(--tc-text-muted, var(--_tc-text-muted)); font-variant-numeric: tabular-nums; }
/* A note the agent took in – attached to its step */
:where([data-look="standard"], [data-look="standard"] *).ui-st__note { display: flex; align-items: flex-start; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); margin: var(--tc-space-1-5, var(--_tc-space-1-5)) 0 var(--tc-space-0-5, var(--_tc-space-0-5)) var(--tc-space-7, var(--_tc-space-7)); padding: var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-2, var(--_tc-space-2)); border-radius: var(--tc-radius-lg, var(--_tc-radius-lg)); background: var(--tc-fill-default, var(--_tc-fill-default)); font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-st__note > svg { margin-top: var(--tc-space-1, var(--_tc-space-1)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__note { display: flex; align-items: flex-start; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); margin: var(--tc-space-1, var(--_tc-space-1)) 0 var(--tc-space-0-5, var(--_tc-space-0-5)) 26px; padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-1-5, var(--_tc-space-1-5)); border-radius: var(--tc-radius-sm, var(--_tc-radius-sm)); background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-border-default, var(--_tc-border-default)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__note > svg { margin-top: var(--tc-space-0-5, var(--_tc-space-0-5)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
.ui-st__note-text { flex: 1; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-st__note-tag { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1, var(--_tc-space-1)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); color: var(--tc-accent-text, var(--_tc-accent-text)); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-st__note-tag { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1, var(--_tc-space-1)); color: var(--tc-accent-text, var(--_tc-accent-text)); font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium)); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-st__note[data-landed] { animation: ui-st-land var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-st__note[data-landed] { animation: ui-st-land-clean var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) var(--tc-ease-standard, var(--_tc-ease-standard)) both; }
/* ----- Queued notes: on the tray (Standard) or at the bottom of the card (Clean) ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-st__queue { padding: var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-2, var(--_tc-space-2)) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-st__queue { padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-0-5, var(--_tc-space-0-5)) var(--tc-space-3-5, var(--_tc-space-3-5)); border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
/* The group label: the caption spec of each look */
.ui-st__label { display: flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); font-size: var(--tc-caption-font-size, var(--_tc-caption-font-size)); font-weight: var(--tc-caption-font-weight, var(--_tc-caption-font-weight)); line-height: var(--tc-caption-line-height, var(--_tc-caption-line-height)); letter-spacing: var(--tc-caption-tracking, var(--_tc-caption-tracking)); text-transform: var(--tc-caption-transform, var(--_tc-caption-transform)); color: var(--tc-caption-color, var(--_tc-caption-color)); }
:where([data-look="standard"], [data-look="standard"] *).ui-st__label { margin: 0 var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-2, var(--_tc-space-2)); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__label { margin-bottom: var(--tc-space-1-5, var(--_tc-space-1-5)); }
.ui-st__label span { display: grid; place-items: center; border-radius: var(--tc-radius-badge, var(--_tc-radius-badge)); letter-spacing: 0; font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-st__label span { min-width: 18px; height: 18px; padding: 0 var(--tc-space-1, var(--_tc-space-1)); background: var(--tc-fill-hover, var(--_tc-fill-hover)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__label span { min-width: 16px; height: 16px; padding: 0 var(--tc-space-1, var(--_tc-space-1)); background: var(--tc-fill-default, var(--_tc-fill-default)); color: var(--tc-text-secondary, var(--_tc-text-secondary)); }
.ui-st__queued { display: grid; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); }
:where([data-look="standard"], [data-look="standard"] *).ui-st__chip { position: relative; display: flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); min-height: 36px; padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-3, var(--_tc-space-3)); border-radius: var(--tc-radius-xl, var(--_tc-radius-xl)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-st__chip::before { content: ""; position: absolute; top: 9px; bottom: 9px; left: 0; width: 3px; border-radius: 0 var(--tc-radius-2xs, var(--_tc-radius-2xs)) var(--tc-radius-2xs, var(--_tc-radius-2xs)) 0; background: var(--tc-agent-steering-accent); }
:where([data-look="standard"], [data-look="standard"] *).ui-st__chip-text { flex: 1; min-width: 0; font-size: var(--tc-font-size-md, var(--_tc-font-size-md)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__chip { position: relative; display: flex; align-items: center; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); min-height: 32px; padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-2-5, var(--_tc-space-2-5)); border-radius: var(--tc-radius-md, var(--_tc-radius-md)); background: var(--tc-surface-raised, var(--_tc-surface-raised)); box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__chip::before { content: ""; position: absolute; top: 8px; bottom: 8px; left: 0; width: 2px; border-radius: 0 var(--tc-radius-2xs, var(--_tc-radius-2xs)) var(--tc-radius-2xs, var(--_tc-radius-2xs)) 0; background: var(--tc-agent-steering-accent); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__chip-text { flex: 1; min-width: 0; font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug)); }
/* Now and ✕: small ghost buttons */
.ui-st__chip-btn { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1, var(--_tc-space-1)); height: var(--tc-control-h-sm, var(--_tc-control-h-sm)); padding: 0 var(--tc-control-px-sm, var(--_tc-control-px-sm)) 0 calc(var(--tc-control-px-sm, var(--_tc-control-px-sm)) - 2px); border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm)); font-size: var(--tc-control-font-size, var(--_tc-control-font-size)); font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight)); color: var(--tc-action-ghost-fg, var(--_tc-action-ghost-fg)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-st__chip-btn:hover { background: var(--tc-accent-subtle, var(--_tc-accent-subtle)); color: var(--tc-accent-text, var(--_tc-accent-text)); }
.ui-st__chip-x { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm, var(--_tc-control-h-sm)); height: var(--tc-control-h-sm, var(--_tc-control-h-sm)); border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm)); color: var(--tc-icon-muted, var(--_tc-icon-muted)); transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-st__chip-x:hover { background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
/* ----- Steer: the field recipe (control edge, focus ring + halo on the wrapper) ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-st__compose { padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-2, var(--_tc-space-2)); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__compose { padding: var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-3, var(--_tc-space-3)) var(--tc-space-2-5, var(--_tc-space-2-5)) var(--tc-space-3-5, var(--_tc-space-3-5)); border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
.ui-st__field { display: flex; align-items: flex-end; gap: var(--tc-space-2, var(--_tc-space-2)); border-radius: var(--tc-field-radius, var(--_tc-field-radius)); background: var(--tc-field-bg, var(--_tc-field-bg)); box-shadow: var(--tc-field-shadow, var(--_tc-field-shadow)); cursor: text; transition: box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-st__field { min-height: 42px; padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-3-5, var(--_tc-space-3-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__field { min-height: 36px; padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-2-5, var(--_tc-space-2-5)); background: var(--tc-field-bg-sunken, var(--_tc-field-bg-sunken)); }
.ui-st__field:hover { box-shadow: var(--tc-field-shadow-hover, var(--_tc-field-shadow-hover)); }
.ui-st .ui-st__field:focus-within { background: var(--tc-field-bg, var(--_tc-field-bg)); box-shadow: var(--tc-field-shadow-focus, var(--_tc-field-shadow-focus)); }
.ui-st__field textarea { flex: 1; min-width: 0; height: 20px; padding: 0; border: 0; outline: none; background: none; font: inherit; color: var(--tc-text-primary, var(--_tc-text-primary)); resize: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-st__field textarea { margin: var(--tc-space-1-5, var(--_tc-space-1-5)) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-st__field textarea { margin: var(--tc-space-1, var(--_tc-space-1)) 0; color: var(--tc-text-strong, var(--_tc-text-strong)); }
.ui-st__field textarea::placeholder { color: var(--tc-text-placeholder, var(--_tc-text-placeholder)); }
/* Send: the primary action, like Button */
.ui-st__send { display: grid; flex: none; place-items: center; width: var(--tc-control-h-md, var(--_tc-control-h-md)); height: var(--tc-control-h-md, var(--_tc-control-h-md)); border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md)); background: var(--tc-action-primary-bg, var(--_tc-action-primary-bg)); box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow)); color: var(--tc-action-primary-fg, var(--_tc-action-primary-fg)); transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-st__send:not(:disabled):hover { background: var(--tc-action-primary-bg-hover, var(--_tc-action-primary-bg-hover)); }
.ui-st__send:not(:disabled):active { background: var(--tc-action-primary-bg-active, var(--_tc-action-primary-bg-active)); transform: scale(0.94); }
:where([data-look="standard"], [data-look="standard"] *).ui-st__send:disabled { opacity: 0.16; cursor: default; }
:where([data-look="clean"], [data-look="clean"] *).ui-st__send:disabled { opacity: 0.18; cursor: default; }
.ui-st__hint { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-3-5, var(--_tc-space-3-5)); font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm)); line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight)); color: var(--tc-text-muted, var(--_tc-text-muted)); }
:where([data-look="standard"], [data-look="standard"] *).ui-st__hint { margin: var(--tc-space-2, var(--_tc-space-2)) var(--tc-space-1-5, var(--_tc-space-1-5)) var(--tc-space-0-5, var(--_tc-space-0-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-st__hint { margin-top: var(--tc-space-2, var(--_tc-space-2)); }
.ui-st__hint > span { display: inline-flex; align-items: center; gap: var(--tc-space-1, var(--_tc-space-1)); white-space: nowrap; }
.ui-st__hint > .ui-st__error { color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg)); }
.ui-st kbd { display: inline-grid; place-items: center; min-width: var(--tc-kbd-h, var(--_tc-kbd-h)); height: var(--tc-kbd-h, var(--_tc-kbd-h)); padding: 0 var(--tc-kbd-px, var(--_tc-kbd-px)); border-radius: var(--tc-kbd-radius, var(--_tc-kbd-radius)); background: var(--tc-kbd-bg, var(--_tc-kbd-bg)); box-shadow: var(--tc-kbd-shadow, var(--_tc-kbd-shadow)); font: inherit; font-size: var(--tc-kbd-font-size, var(--_tc-kbd-font-size)); font-weight: var(--tc-kbd-font-weight, var(--_tc-kbd-font-weight)); line-height: var(--tc-line-height-none, var(--_tc-line-height-none)); color: var(--tc-kbd-fg, var(--_tc-kbd-fg)); }
.ui-st__compose[data-disabled] .ui-st__field { opacity: 0.6; cursor: default; }
@keyframes ui-st-spin { to { transform: rotate(360deg); } }
@keyframes ui-st-pop { from { opacity: 0; transform: scale(0.6); } }
@keyframes ui-st-pulse { from { opacity: 0.45; transform: scale(0.6); } to { opacity: 0; transform: scale(1.8); } }
@keyframes ui-st-land { 0%, 30% { background-color: var(--tc-accent-subtle, var(--_tc-accent-subtle)); box-shadow: inset 0 0 0 1px var(--tc-accent-subtle, var(--_tc-accent-subtle)); } }
@keyframes ui-st-land-clean { 0%, 30% { background-color: var(--tc-accent-subtle, var(--_tc-accent-subtle)); box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-focus-ring, var(--_tc-focus-ring)); } }
/* Narrow containers: the status moves under the title, so the title gets the full width */
@container (max-width: 380px) {
  .ui-st .ui-st__head { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; row-gap: var(--tc-space-2, var(--_tc-space-2)); }
  .ui-st__spark { grid-row: 1; align-self: center; }
  .ui-st__heading { grid-column: 2; grid-row: 1; }
  .ui-st .ui-st__state { grid-column: 2; grid-row: 2; justify-self: start; }
  .ui-st__head > .ui-st__icon-btn { grid-column: 3; grid-row: 1; }
  :where([data-look="standard"], [data-look="standard"] *).ui-st__head { padding-left: var(--tc-space-3-5, var(--_tc-space-3-5)); }
  :where([data-look="standard"], [data-look="standard"] *).ui-st__plan { padding-left: var(--tc-space-3-5, var(--_tc-space-3-5)); padding-right: var(--tc-space-3-5, var(--_tc-space-3-5)); }
  :where([data-look="clean"], [data-look="clean"] *).ui-st__head { padding-left: var(--tc-space-3, var(--_tc-space-3)); }
  :where([data-look="clean"], [data-look="clean"] *).ui-st__plan,
  :where([data-look="clean"], [data-look="clean"] *).ui-st__queue,
  :where([data-look="clean"], [data-look="clean"] *).ui-st__compose { padding-left: var(--tc-space-3, var(--_tc-space-3)); padding-right: var(--tc-space-3, var(--_tc-space-3)); }
}
@media (pointer: coarse) {
  :where([data-look="standard"], [data-look="standard"] *).ui-st__icon-btn,
  :where([data-look="standard"], [data-look="standard"] *).ui-st__send { width: 36px; height: 36px; }
  :where([data-look="standard"], [data-look="standard"] *).ui-st__chip-btn,
  :where([data-look="standard"], [data-look="standard"] *).ui-st__chip-x { height: 32px; }
  :where([data-look="standard"], [data-look="standard"] *).ui-st__chip-x { width: 32px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-st__icon-btn,
  :where([data-look="clean"], [data-look="clean"] *).ui-st__send { width: 34px; height: 34px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-st__chip-btn,
  :where([data-look="clean"], [data-look="clean"] *).ui-st__chip-x { height: 30px; }
  :where([data-look="clean"], [data-look="clean"] *).ui-st__chip-x { width: 30px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-st *, .ui-st *::before, .ui-st *::after { animation: none !important; transition: none !important; }
  .ui-st__shine { display: none; }
}
`;
