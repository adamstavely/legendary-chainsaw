"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { useControllable } from "../internal/use-controllable";
import { easeOutQuart } from "../internal/ease";
import { reducedMotion } from "../internal/reduced-motion";
import { useRootRef } from "../internal/use-root-ref";

/*
 * Model Picker – the model menu of an AI chat, in a single self-contained file.
 * A small trigger (glyph, model name, chevron) sits in your composer toolbar; it opens a menu that unfolds softly from it:
 *   · one row per model with three tiny strength bars – Speed, Quality, Cost. Point at a row and its bars fill
 *   · Extended thinking and Web search as switches; the Effort control (Low / Medium / High) unfolds under thinking
 *   · the line on the gray tray says what the model you point at costs you – first-token time and price –
 *     and its numbers roll when the model or the effort changes
 *   · arrows move, Enter picks, Tab reaches the switches, Esc or a click outside closes
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: model-picker.tsx is Standard,
 * model-picker-clean.tsx is Clean). Clean drops the gray tray: one white popover with hairline shadows, Inter 13px
 * and a blue accent, whose last row holds the cost line; its icons are a size larger with thinner lines, and the
 * Effort fill is measured to sit under its level, since the levels are as wide as their words.
 */

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-mdp";

export type PickerModel = {
  id: string;
  name: string;
  /** One short line under the name, e.g. "Hardest problems" */
  description?: string;
  /** Glyph in front of the name – any node, sized to 18px. Defaults to the first letter on a soft tile */
  icon?: ReactNode;
  /** Strengths from 1 to 5. Cost 5 is the most expensive. Leave all three out for a router like "Auto" */
  speed?: number;
  quality?: number;
  cost?: number;
  /** Typical time to the first token without extended thinking, in milliseconds */
  latencyMs?: number;
  /** Price per million output tokens, in dollars */
  pricePerM?: number;
};

export type ModelEffort = "low" | "medium" | "high";

type ModelPickerOwnProps = {
  models: PickerModel[];
  /** Id of the chosen model (controlled when defined) */
  value?: string;
  /** The model chosen at first when uncontrolled – defaults to the first one */
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** Extended thinking switch */
  thinking?: boolean;
  defaultThinking?: boolean;
  onThinkingChange?: (on: boolean) => void;
  /** Web search switch */
  webSearch?: boolean;
  defaultWebSearch?: boolean;
  onWebSearchChange?: (on: boolean) => void;
  /** How hard the model thinks – only shown while extended thinking is on */
  effort?: ModelEffort;
  defaultEffort?: ModelEffort;
  onEffortChange?: (effort: ModelEffort) => void;
  /** Controlled open state of the menu */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Which edge of the trigger the menu lines up with */
  align?: "start" | "end";
  /** Whether the menu opens below or above the trigger – above suits a composer at the bottom of the screen */
  side?: "bottom" | "top";
  /** Visual style. Defaults to the file's look: Standard in model-picker.tsx, Clean in model-picker-clean.tsx */
  look?: Look;
  className?: string;
};

export type ModelPickerProps = Omit<ComponentPropsWithoutRef<"div">, keyof ModelPickerOwnProps> &
  ModelPickerOwnProps & {
    /** The root element */
    ref?: Ref<HTMLDivElement>;
  };

/* ---------- Helpers ---------- */

const EFFORTS: { id: ModelEffort; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];
/** How much longer the first token takes while the model thinks first */
const THINK_FACTOR: Record<ModelEffort, number> = { low: 1.6, medium: 2.5, high: 4 };
const STRENGTHS = [
  { key: "speed", label: "Speed" },
  { key: "quality", label: "Quality" },
  { key: "cost", label: "Cost" },
] as const;

const clamp = (n: number) => Math.max(0, Math.min(5, Math.round(n)));
const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
const dollars = (n: number, target: number) =>
  `$${n.toFixed(Number.isInteger(target) ? 0 : 2)}`;

/**
 * Text that changes without a jump: the old line stays for a moment and fades out underneath while the new one fades in.
 * Quick changes just retarget – nothing piles up.
 */
function Swap({ id, children }: { id: string; children: ReactNode }) {
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
    const timer = window.setTimeout(() => setOut(null), 260);
    return () => window.clearTimeout(timer);
  }, [out]);
  return (
    <span className="ui-mdp__swap">
      {out && (
        <span key={`out-${out.id}`} className="ui-mdp__swap-item" data-out="" aria-hidden="true">
          {out.node}
        </span>
      )}
      <span key={id} className="ui-mdp__swap-item">
        {children}
      </span>
    </span>
  );
}

/* ---------- Icons ---------- */

/* Clean draws the icons a size larger, with thinner lines */
const line = (clean: boolean) =>
  ({
    stroke: "currentColor",
    strokeWidth: clean ? 1.2 : 1.4,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  }) as const;
type IconProps = { clean: boolean };
const ChevronIcon = ({ clean }: IconProps) => (
  <svg className="ui-mdp__chevron" width={clean ? 14 : 12} height={clean ? 14 : 12} viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="m3 4.5 3 3 3-3" {...line(clean)} />
  </svg>
);
const CheckIcon = ({ clean }: IconProps) => (
  <svg className="ui-mdp__check" width={clean ? 16 : 14} height={clean ? 16 : 14} viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="m3.4 7.3 2.4 2.4 4.8-5.2" {...line(clean)} strokeWidth={clean ? 1.3 : 1.6} />
  </svg>
);
const ThinkIcon = ({ clean }: IconProps) => (
  <svg width={clean ? 16 : 14} height={clean ? 16 : 14} viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M5.3 10.6h3.4M5.8 12.3h2.4M7 1.7a3.9 3.9 0 0 0-2.3 7c.4.3.6.7.6 1.1v.1h3.4v-.1c0-.4.2-.8.6-1.1A3.9 3.9 0 0 0 7 1.7Z" {...line(clean)} />
  </svg>
);
const GlobeIcon = ({ clean }: IconProps) => (
  <svg width={clean ? 16 : 14} height={clean ? 16 : 14} viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="7" cy="7" r="5.3" {...line(clean)} />
    <path d="M1.9 7h10.2M7 1.7c1.4 1.5 2 3.3 2 5.3s-.6 3.8-2 5.3c-1.4-1.5-2-3.3-2-5.3s.6-3.8 2-5.3Z" {...line(clean)} />
  </svg>
);

function Glyph({ model }: { model: PickerModel }) {
  return (
    <span className="ui-mdp__glyph" aria-hidden="true">
      {model.icon ?? model.name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

/**
 * A number that rolls to its new value instead of jumping. React renders the target; while it rolls, each frame is
 * written into the element's text – no re-render per frame (the DOM-writing variant of useRolling).
 */
function RollingNumber({ value, format, duration = 560 }: { value: number; format: (n: number) => string; duration?: number }) {
  const ref = useRef<HTMLElement>(null);
  const shown = useRef(value);
  const fmt = useRef(format);
  useLayoutEffect(() => {
    fmt.current = format;
  });
  // Before the browser paints: start from where it was, then roll there frame by frame
  useLayoutEffect(() => {
    const el = ref.current;
    const from = shown.current;
    if (!el || from === value || reducedMotion()) {
      shown.current = value;
      return;
    }
    el.textContent = fmt.current(from);
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      shown.current = from + (value - from) * easeOutQuart(t);
      el.textContent = fmt.current(t < 1 ? shown.current : value);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return <b ref={ref}>{format(value)}</b>;
}

/* ---------- The menu's parts ---------- */

/** Near the edge of the screen the menu slides in just enough to stay whole */
function usePopShift(isOpen: boolean, align: "start" | "end", triggerRef: { current: HTMLElement | null }, popRef: { current: HTMLElement | null }) {
  const [shift, setShift] = useState(0);
  useLayoutEffect(() => {
    if (!isOpen) return;
    const measure = () => {
      const trigger = triggerRef.current?.getBoundingClientRect();
      const width = popRef.current?.offsetWidth ?? 0;
      if (!trigger || !width) return;
      const room = document.documentElement.clientWidth;
      const left = align === "end" ? trigger.right - width : trigger.left;
      const margin = 12;
      setShift(left < margin ? margin - left : left + width > room - margin ? Math.min(0, room - margin - (left + width)) : 0);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [isOpen, align, triggerRef, popRef]);
  return shift;
}

function ModelRow({
  m,
  id,
  chosen,
  active,
  lit,
  clean,
  factor,
  onPoint,
  onPick,
}: {
  m: PickerModel;
  id: string;
  chosen: boolean;
  active: boolean;
  lit: boolean;
  clean: boolean;
  /** How much longer the first token takes with the current thinking effort */
  factor: number;
  onPoint: () => void;
  onPick: () => void;
}) {
  const rated = m.speed !== undefined || m.quality !== undefined || m.cost !== undefined;
  // What the bars and the tray show, as words – part of the option's name (its visible text comes first)
  const details = [
    rated ? `Speed ${m.speed ?? 0}, quality ${m.quality ?? 0}, cost ${m.cost ?? 0} of 5` : "",
    m.latencyMs !== undefined ? `about ${seconds(m.latencyMs * factor)} to the first token` : "",
    m.pricePerM !== undefined ? `${dollars(m.pricePerM, m.pricePerM)} per million tokens` : "",
  ]
    .filter(Boolean)
    .join(", ");
  return (
    <div
      id={id}
      role="option"
      aria-selected={chosen}
      className="ui-mdp__option"
      data-active={active ? "" : undefined}
      data-lit={lit ? "" : undefined}
      onPointerEnter={(e) => e.pointerType === "mouse" && onPoint()}
      onClick={onPick}
    >
      <Glyph model={m} />
      <span className="ui-mdp__text">
        <span className="ui-mdp__title">
          <span className="ui-mdp__title-name">{m.name}</span>
          {chosen && <CheckIcon clean={clean} />}
        </span>
        {m.description && <span className="ui-mdp__desc">{m.description}</span>}
        {details && <span className="ui-mdp__sr">. {details}</span>}
      </span>
      {rated ? (
        <span className="ui-mdp__bars" aria-hidden="true">
          {STRENGTHS.map((s, c) => {
            const level = clamp(m[s.key] ?? 0);
            return (
              <span key={s.key} className="ui-mdp__meter" style={{ ["--c" as string]: c }}>
                {[0, 1, 2, 3, 4].map((k) => (
                  <span key={k} className="ui-mdp__seg" data-on={k < level ? "" : undefined} style={{ ["--s" as string]: k }} />
                ))}
              </span>
            );
          })}
        </span>
      ) : (
        <span className="ui-mdp__varies" aria-hidden="true">
          Varies
        </span>
      )}
    </div>
  );
}

/** Effort – Low / Medium / High. Clean: the fill sits under the chosen level – the levels are as wide as their words,
 *  so it is measured. Standard's levels are equal thirds, placed by index. */
function EffortControl({
  uid,
  clean,
  effort,
  isOpen,
  isThinking,
  onEffort,
}: {
  uid: string;
  clean: boolean;
  effort: ModelEffort;
  isOpen: boolean;
  isThinking: boolean;
  onEffort: (effort: ModelEffort) => void;
}) {
  const segRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ x: number; w: number } | null>(null);
  useLayoutEffect(() => {
    if (!clean) return;
    const btn = segRef.current?.querySelector<HTMLElement>(`[data-effort="${effort}"]`);
    if (btn) setThumb({ x: btn.offsetLeft, w: btn.offsetWidth });
  }, [clean, effort, isOpen, isThinking]);
  const onKey = (e: KeyboardEvent) => {
    const i = EFFORTS.findIndex((x) => x.id === effort);
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = EFFORTS[(i + step + EFFORTS.length) % EFFORTS.length];
    onEffort(next.id);
    segRef.current?.querySelector<HTMLElement>(`[data-effort="${next.id}"]`)?.focus();
  };
  return (
    <div className="ui-mdp__effort">
      <span className="ui-mdp__effort-label" id={`${uid}-effort`}>
        Effort
      </span>
      <div
        ref={segRef}
        className="ui-mdp__segmented"
        role="radiogroup"
        aria-labelledby={`${uid}-effort`}
        style={
          clean
            ? thumb
              ? { ["--x" as string]: `${thumb.x}px`, ["--w" as string]: `${thumb.w}px` }
              : undefined
            : { ["--i" as string]: EFFORTS.findIndex((x) => x.id === effort) }
        }
        onKeyDown={onKey}
      >
        <span className="ui-mdp__thumb" aria-hidden="true" />
        {EFFORTS.map((x) => (
          <button
            key={x.id}
            type="button"
            role="radio"
            aria-checked={x.id === effort}
            tabIndex={x.id === effort ? 0 : -1}
            data-effort={x.id}
            className="ui-mdp__seg-btn"
            onClick={() => onEffort(x.id)}
          >
            {x.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** What the tray says: the model you point at – first-token time and price, rolling – or what web search does */
function trayCaption(lit: PickerModel | undefined, hint: "search" | null, isSearching: boolean, factor: number) {
  if (hint === "search") {
    const caption = isSearching ? "Looks things up on the web when it helps" : "Answers from what it already knows";
    return { caption: caption as ReactNode, key: `search-${isSearching}` };
  }
  if (!lit || (lit.latencyMs === undefined && lit.pricePerM === undefined)) {
    const caption = lit?.description ?? lit?.name ?? "";
    return { caption: caption as ReactNode, key: `plain-${lit?.id}` };
  }
  const latency = (lit.latencyMs ?? 0) * factor;
  const price = lit.pricePerM ?? 0;
  const parts: ReactNode[] = [];
  if (lit.latencyMs !== undefined) {
    parts.push(
      <span key="l">
        ~<RollingNumber value={latency} format={seconds} /> first token
      </span>,
    );
  }
  if (lit.pricePerM !== undefined) {
    parts.push(
      <span key="p">
        <RollingNumber value={price} format={(n) => dollars(n, price)} /> / M tokens
      </span>,
    );
  }
  return {
    caption: parts.flatMap((p, i) => (i ? [<span key={`d${i}`} className="ui-mdp__dot"> · </span>, p] : [p])) as ReactNode,
    // One key for every model with numbers – the numbers roll instead of the line swapping
    key: "stats",
  };
}

/* ---------- The component ---------- */

export function ModelPicker({
  models,
  value,
  defaultValue,
  onChange,
  thinking,
  defaultThinking = false,
  onThinkingChange,
  webSearch,
  defaultWebSearch = false,
  onWebSearchChange,
  effort,
  defaultEffort = "medium",
  onEffortChange,
  open,
  defaultOpen = false,
  onOpenChange,
  align = "start",
  side = "bottom",
  look,
  className,
  ref,
  ...rest
}: ModelPickerProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const clean = resolvedLook === "clean";
  const uid = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  // The root is ours (focus, clicks outside) and the consumer's
  const setRoot = useRootRef(rootRef, ref);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  // Every value works on its own: controlled when its prop is defined, and every change is reported
  const [chosenId, setChosenId] = useControllable(value, defaultValue ?? models[0]?.id ?? "", onChange);
  const [isThinking, setThinking] = useControllable(thinking, defaultThinking, onThinkingChange);
  const [isSearching, setSearching] = useControllable(webSearch, defaultWebSearch, onWebSearchChange);
  const [effortNow, setEffort] = useControllable<ModelEffort>(effort, defaultEffort, onEffortChange);
  const [isOpen, setIsOpen] = useControllable(open, defaultOpen, onOpenChange);

  const chosenIndex = Math.max(0, models.findIndex((m) => m.id === chosenId));
  const chosen = models[chosenIndex];

  /** The row the arrows (or the pointer) are on, and whether someone is actually pointing at a row */
  const [active, setActive] = useState(chosenIndex);
  const [pointing, setPointing] = useState(false);
  /** The arrows moved the active row – it then carries the focus ring */
  const [keyed, setKeyed] = useState(false);
  /** The last choice, for the status region – announced once, not on every arrow press */
  const [announced, setAnnounced] = useState("");
  /** A switch under the pointer or the focus – the tray then talks about it */
  const [hint, setHint] = useState<"search" | null>(null);

  const lit = models[pointing ? active : chosenIndex] ?? chosen;

  /* ---------- Opening and closing ---------- */

  const setOpen = (next: boolean, focus?: "list" | "trigger") => {
    if (next !== isOpen) {
      if (next) {
        setActive(chosenIndex);
        setPointing(false);
        setKeyed(false);
      } else setHint(null);
      setIsOpen(next);
    }
    // Focus only moves for people – a parent opening the menu through `open` leaves the focus where it is
    if (focus === "list") requestAnimationFrame(() => listRef.current?.focus({ preventScroll: true }));
    if (focus === "trigger") triggerRef.current?.focus({ preventScroll: true });
  };
  // The parent may open the menu itself – start on the chosen row
  const wasOpen = useRef(isOpen);
  useEffect(() => {
    if (isOpen && !wasOpen.current) {
      setActive(chosenIndex);
      setPointing(false);
    }
    wasOpen.current = isOpen;
  }, [isOpen, chosenIndex]);

  const shift = usePopShift(isOpen, align, triggerRef, popRef);

  // While open, a press outside closes it
  useEffect(() => {
    if (!isOpen) return;
    const down = (e: globalThis.PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", down);
    return () => document.removeEventListener("pointerdown", down);
  });

  const focusInside = () => rootRef.current?.contains(document.activeElement) ?? false;

  /* ---------- Changing things ---------- */

  const pick = (index: number) => {
    const m = models[index];
    if (!m) return;
    setChosenId(m.id);
    setAnnounced(`${m.name} selected`);
    setOpen(false, focusInside() ? "trigger" : undefined);
  };

  /* ---------- Keyboard ---------- */

  const onTriggerKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true, "list");
    }
  };
  const onListKey = (e: KeyboardEvent) => {
    const n = models.length;
    if (!n) return;
    const move = (to: number) => {
      e.preventDefault();
      setActive(((to % n) + n) % n);
      setPointing(true);
      setKeyed(true);
    };
    if (e.key === "ArrowDown") move(active + 1);
    else if (e.key === "ArrowUp") move(active - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(n - 1);
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      pick(active);
    }
  };
  const onRootKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || !isOpen) return;
    e.stopPropagation();
    setOpen(false, "trigger");
  };

  const tray = trayCaption(lit, hint, isSearching, isThinking ? THINK_FACTOR[effortNow] : 1);

  // Option ids come from the row's position, never from model ids (user data)
  const activeId = models[active] ? `${uid}-opt-${active}` : undefined;

  return (
    <div
      {...rest}
      ref={setRoot}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={resolvedLook}
      data-open={isOpen ? "" : undefined}
      data-align={align}
      data-side={side}
      onKeyDown={(e) => {
        rest.onKeyDown?.(e);
        onRootKey(e);
      }}
      onBlur={(e) => {
        rest.onBlur?.(e);
        if (isOpen && e.relatedTarget && !rootRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <style href="ui-model-picker" precedence="default">
        {css}
      </style>

      <button
        ref={triggerRef}
        type="button"
        className="ui-mdp__trigger"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={`${uid}-menu`}
        onClick={() => setOpen(!isOpen, isOpen ? undefined : "list")}
        onKeyDown={onTriggerKey}
      >
        {chosen && <Glyph model={chosen} />}
        <span className="ui-mdp__sr">Model: </span>
        <span className="ui-mdp__name">
          <Swap id={chosen?.id ?? "none"}>{chosen?.name ?? "Choose a model"}</Swap>
        </span>
        {/* A small bulb unfolds next to the name while extended thinking is on */}
        <span className="ui-mdp__flag" data-on={isThinking ? "" : undefined} aria-hidden="true">
          <span>
            <ThinkIcon clean={clean} />
          </span>
        </span>
        {isThinking && <span className="ui-mdp__sr">, extended thinking</span>}
        <ChevronIcon clean={clean} />
      </button>

      <div
        id={`${uid}-menu`}
        ref={popRef}
        className="ui-mdp__pop"
        style={shift ? { translate: `${shift}px 0` } : undefined}
        role="dialog"
        aria-label="Model settings"
        inert={!isOpen}
      >
        <div className="ui-mdp__card">
          <div className="ui-mdp__head" aria-hidden="true">
            <span>Model</span>
            <span className="ui-mdp__cols">
              {STRENGTHS.map((s) => (
                <span key={s.key}>{s.label}</span>
              ))}
            </span>
          </div>

          <div
            ref={listRef}
            className="ui-mdp__list"
            role="listbox"
            aria-label="Model"
            tabIndex={0}
            aria-activedescendant={isOpen ? activeId : undefined}
            data-pointing={pointing ? "" : undefined}
            data-keyed={keyed ? "" : undefined}
            onKeyDown={onListKey}
            onPointerLeave={() => setPointing(false)}
          >
            {models.map((m, i) => (
              <ModelRow
                key={m.id}
                m={m}
                id={`${uid}-opt-${i}`}
                chosen={i === chosenIndex}
                active={i === active}
                lit={m.id === lit?.id}
                clean={clean}
                factor={isThinking ? THINK_FACTOR[effortNow] : 1}
                onPoint={() => {
                  setActive(i);
                  setPointing(true);
                  setKeyed(false);
                }}
                onPick={() => pick(i)}
              />
            ))}
          </div>

          <div className="ui-mdp__settings">
            <button type="button" role="switch" aria-checked={isThinking} className="ui-mdp__toggle" onClick={() => setThinking(!isThinking)}>
              <span className="ui-mdp__toggle-icon">
                <ThinkIcon clean={clean} />
              </span>
              <span className="ui-mdp__toggle-label">Extended thinking</span>
              <span className="ui-mdp__switch" aria-hidden="true" />
            </button>

            {/* Effort unfolds under thinking, in place */}
            <div className="ui-mdp__fold" data-open={isThinking ? "" : undefined} inert={!isThinking}>
              <div className="ui-mdp__clip">
                <EffortControl uid={uid} clean={clean} effort={effortNow} isOpen={isOpen} isThinking={isThinking} onEffort={setEffort} />
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isSearching}
              className="ui-mdp__toggle"
              onClick={() => setSearching(!isSearching)}
              onPointerEnter={(e) => e.pointerType === "mouse" && setHint("search")}
              onPointerLeave={() => setHint(null)}
              onFocus={() => setHint("search")}
              onBlur={() => setHint(null)}
            >
              <span className="ui-mdp__toggle-icon">
                <GlobeIcon clean={clean} />
              </span>
              <span className="ui-mdp__toggle-label">Web search</span>
              <span className="ui-mdp__switch" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* The tray: what the model you point at costs you */}
        <div className="ui-mdp__foot">
          <span className="ui-mdp__caption" aria-hidden="true">
            <Swap id={tray.key}>{tray.caption}</Swap>
          </span>
          <span className="ui-mdp__keys" aria-hidden="true">
            <kbd>↑↓</kbd>
            <kbd>↵</kbd>
          </span>
        </div>
      </div>
      {/* Persistent and narrow: says the final choice once – the rows carry their own numbers */}
      <span className="ui-mdp__sr" role="status">
        {announced}
      </span>
    </div>
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
.ui-mdp {
  position: relative;
  display: inline-block;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="standard"], [data-look="standard"] *).ui-mdp { color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-primary); }
.ui-mdp *, .ui-mdp *::before, .ui-mdp *::after { box-sizing: border-box; }
:where(.ui-mdp) button { appearance: none; margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-mdp button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-mdp svg { display: block; flex: none; }
.ui-mdp b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-mdp__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* ----- Trigger: a ghost button – glyph, name and a small chevron ----- */
.ui-mdp__trigger { display: inline-flex; align-items: center; max-width: 100%; height: var(--tc-control-h-md); padding: 0 6px; border-radius: var(--tc-control-radius-md); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mdp__trigger:hover, .ui-mdp[data-open] .ui-mdp__trigger { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__trigger { gap: 7px; padding-right: 8px; color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__trigger .ui-mdp__glyph { width: 18px; height: 18px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__trigger { gap: 6px; color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__trigger .ui-mdp__glyph { width: 18px; height: 18px; font-size: var(--tc-font-size-2xs); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__trigger .ui-mdp__glyph > svg { width: 10px; height: 10px; }
.ui-mdp__name { display: grid; min-width: 0; }
.ui-mdp__chevron { transition: transform var(--tc-duration-slow) var(--tc-ease-emphasized); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__chevron { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__chevron { margin-left: -2px; color: var(--tc-icon-muted); }
.ui-mdp[data-open] .ui-mdp__chevron { transform: rotate(180deg); }
.ui-mdp__flag { display: grid; grid-template-columns: 0fr; opacity: 0; transition: grid-template-columns var(--tc-duration-slow) var(--tc-ease-emphasized), margin var(--tc-duration-slow) var(--tc-ease-emphasized), opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-mdp__flag[data-on] { grid-template-columns: 1fr; opacity: 1; transition: grid-template-columns var(--tc-duration-slow) var(--tc-ease-emphasized), margin var(--tc-duration-slow) var(--tc-ease-emphasized), opacity var(--tc-duration-moderate) var(--tc-ease-standard) 80ms; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__flag { margin-left: -7px; color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__flag[data-on] { margin-left: -3px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__flag { margin-left: -6px; color: var(--tc-accent); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__flag[data-on] { margin-left: -2px; }
.ui-mdp__flag > span { min-width: 0; overflow: hidden; }
/* Glyph: a small tile with a hairline */
.ui-mdp__glyph { display: grid; flex: none; place-items: center; overflow: hidden; font-weight: var(--tc-avatar-font-weight); line-height: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__glyph { width: 22px; height: 22px; border-radius: var(--tc-radius-sm); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 1px var(--tc-border-default); font-size: var(--tc-font-size-2xs); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__glyph { width: 20px; height: 20px; border-radius: var(--tc-avatar-radius-agent); background: var(--tc-surface-control); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-2xs); color: var(--tc-text-strong); }
.ui-mdp__glyph > svg, .ui-mdp__glyph > img { width: 12px; height: 12px; }
/* ----- Menu: unfolds softly from the trigger. Standard: a white menu card on a gray tray; Clean: one menu surface ----- */
.ui-mdp__pop {
  position: absolute;
  z-index: var(--tc-z-dropdown);
  top: calc(100% + 6px);
  left: 0;
  width: min(320px, calc(100vw - 32px));
  container-type: inline-size;
  box-shadow: var(--tc-menu-shadow);
  transform-origin: top left;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-4px) scale(0.96);
  transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-base) var(--tc-ease-emphasized), visibility 0s linear var(--tc-duration-base);
}
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__pop { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__pop { border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); }
.ui-mdp[data-align="end"] .ui-mdp__pop { left: auto; right: 0; transform-origin: top right; }
.ui-mdp[data-side="top"] .ui-mdp__pop { top: auto; bottom: calc(100% + 6px); transform-origin: bottom left; transform: translateY(4px) scale(0.96); }
.ui-mdp[data-side="top"][data-align="end"] .ui-mdp__pop { transform-origin: bottom right; }
.ui-mdp[data-open] .ui-mdp__pop { opacity: 1; visibility: visible; transform: none; transition: opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-slow) var(--tc-ease-emphasized), visibility 0s; }
.ui-mdp__card { padding: var(--tc-menu-padding); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__card { border-radius: calc(var(--tc-tray-radius) - var(--tc-tray-inset)); background: var(--tc-menu-bg); box-shadow: var(--tc-shadow-raised); }
.ui-mdp__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__head { height: 24px; padding: 0 var(--tc-menu-item-px); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); }
/* Clean: the column names are a section caption */
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__head { height: 28px; padding: 4px var(--tc-menu-item-px) 0; font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-mdp__cols { display: grid; gap: 8px; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__cols { grid-template-columns: repeat(3, 34px); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__cols { grid-template-columns: repeat(3, 40px); }
.ui-mdp__cols > span { display: flex; justify-content: center; white-space: nowrap; }
/* ----- Rows: menu rows, two lines tall ----- */
.ui-mdp__list { display: grid; border-radius: var(--tc-menu-item-radius); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__list { gap: 1px; }
/* The active row carries the focus ring itself (aria-activedescendant), so the list draws none */
.ui-mdp__list:focus-visible { outline: none; }
.ui-mdp__option { display: flex; align-items: center; gap: 10px; padding: 6px var(--tc-menu-item-px); border-radius: var(--tc-menu-item-radius); font-size: var(--tc-menu-item-font-size); cursor: pointer; transition: background-color var(--tc-duration-instant) var(--tc-ease-decelerate), box-shadow var(--tc-duration-instant) var(--tc-ease-decelerate); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__option { min-height: 48px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__option { min-height: 44px; }
/* The fill appears crisply on the row under the pointer and fades out when the pointer leaves the list */
.ui-mdp__list[data-pointing] .ui-mdp__option[data-active] { background: var(--tc-menu-item-hover); }
/* Keyboard: the active row gets the focus ring (≥ 3:1) */
.ui-mdp__list:focus-visible .ui-mdp__option[data-active],
.ui-mdp__list:focus[data-keyed] .ui-mdp__option[data-active] { background: var(--tc-menu-item-hover); box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
.ui-mdp__text { display: grid; flex: 1; min-width: 0; }
.ui-mdp__title { display: flex; align-items: center; gap: 4px; min-width: 0; font-weight: var(--tc-font-weight-medium); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__title { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__title { color: var(--tc-text-strong); }
.ui-mdp__title-name { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
/* The chosen model: a check in the menu's selected colour */
.ui-mdp__check { color: var(--tc-menu-item-selected-fg); animation: ui-mdp-pop var(--tc-duration-slow) var(--tc-ease-emphasized) both; }
.ui-mdp__desc { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__desc { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__desc { color: var(--tc-text-secondary); }
/* Strength bars: five small segments each, the filled ones ≥ 3:1. The lit row fills them one after another */
.ui-mdp__bars { display: grid; flex: none; gap: 8px; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__bars { grid-template-columns: repeat(3, 34px); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__bars { grid-template-columns: repeat(3, 40px); }
.ui-mdp__meter { display: grid; grid-template-columns: repeat(5, 1fr); gap: 2px; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__meter { height: 5px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__meter { height: 4px; }
.ui-mdp__seg { border-radius: var(--tc-radius-2xs); background: var(--tc-fill-default); transition: background-color var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-moderate) var(--tc-ease-emphasized); }
.ui-mdp__seg[data-on] { background: var(--tc-icon-muted); }
.ui-mdp__option[data-lit] .ui-mdp__seg[data-on] { transition-delay: calc(var(--c) * 70ms + var(--s) * 45ms); animation: ui-mdp-fill var(--tc-duration-slow) var(--tc-ease-emphasized) both; animation-delay: calc(var(--c) * 70ms + var(--s) * 45ms); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__option[data-lit] .ui-mdp__seg[data-on] { background: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__option[data-lit] .ui-mdp__seg[data-on] { background: var(--tc-accent); }
.ui-mdp__varies { flex: none; color: var(--tc-text-muted); text-align: center; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__varies { width: 118px; font-size: var(--tc-font-size-xs); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__varies { width: 136px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
/* ----- Switches and effort ----- */
.ui-mdp__settings { border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__settings { margin-top: 6px; padding-top: 6px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__settings { margin: 4px -4px 0; padding: 4px 4px 0; }
.ui-mdp__toggle { display: flex; align-items: center; gap: 10px; width: 100%; height: var(--tc-menu-item-h); padding: 0 var(--tc-menu-item-px); border-radius: var(--tc-menu-item-radius); font-size: var(--tc-menu-item-font-size); transition: background-color var(--tc-duration-instant) var(--tc-ease-decelerate); }
.ui-mdp__toggle:hover { background: var(--tc-menu-item-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__toggle { color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__toggle { color: var(--tc-text-primary); }
.ui-mdp__toggle-icon { display: grid; flex: none; place-items: center; transition: color var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__toggle-icon { width: 22px; color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__toggle-icon { width: 20px; color: var(--tc-icon-muted); }
.ui-mdp__toggle[aria-checked="true"] .ui-mdp__toggle-icon { color: var(--tc-text-primary); }
.ui-mdp__toggle-label { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
/* Switch: the pattern's track and knob; the off track is a ≥ 3:1 control edge */
.ui-mdp__switch { position: relative; flex: none; width: var(--tc-switch-w); height: var(--tc-switch-h); border-radius: var(--tc-switch-radius); background: var(--tc-switch-off); transition: background-color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-mdp__switch::after { content: ""; position: absolute; top: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2); left: calc((var(--tc-switch-h) - var(--tc-switch-knob)) / 2); width: var(--tc-switch-knob); height: var(--tc-switch-knob); border-radius: max(0px, calc(var(--tc-switch-radius) - (var(--tc-switch-h) - var(--tc-switch-knob)) / 2)); background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control); transition: transform var(--tc-duration-moderate) var(--tc-ease-emphasized); }
.ui-mdp__toggle[aria-checked="true"] .ui-mdp__switch { background: var(--tc-switch-on); }
.ui-mdp__toggle[aria-checked="true"] .ui-mdp__switch::after { transform: translateX(calc(var(--tc-switch-w) - var(--tc-switch-h))); }
.ui-mdp__fold { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-emphasized), opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-mdp__fold[data-open] { grid-template-rows: 1fr; opacity: 1; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-emphasized), opacity var(--tc-duration-slow) var(--tc-ease-standard) 100ms; }
.ui-mdp__clip { min-height: 0; overflow: hidden; }
.ui-mdp__effort { display: flex; align-items: center; gap: 10px; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__effort { padding: 2px 10px 6px 42px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__effort { padding: 2px 8px 6px 38px; }
.ui-mdp__effort-label { flex: 1; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__effort-label { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__effort-label { color: var(--tc-text-secondary); }
/* Effort – Standard: a segmented track with a sliding thumb; Clean: each level as wide as its word, the measured fill
   glides from one to the next. The chosen level carries a ring in the selected colour, not only a fill */
.ui-mdp__segmented { position: relative; flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__segmented { display: grid; grid-template-columns: repeat(3, 58px); padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__thumb { position: absolute; top: var(--tc-seg-pad); bottom: var(--tc-seg-pad); left: var(--tc-seg-pad); width: 58px; border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow), inset 0 0 0 1px var(--tc-border-selected); transform: translateX(calc(var(--i) * 100%)); transition: transform var(--tc-duration-slow) var(--tc-ease-emphasized); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__seg-btn { position: relative; height: 24px; border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); text-align: center !important; transition: color var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__seg-btn[aria-checked="true"] { font-weight: var(--tc-font-weight-strong); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__seg-btn:hover { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__segmented { display: flex; gap: 4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__thumb { position: absolute; top: 0; bottom: 0; left: 0; width: var(--w, 0); border-radius: var(--tc-control-radius-sm); background: var(--tc-fill-selected); box-shadow: inset 0 0 0 1px var(--tc-border-selected); transform: translateX(var(--x, 0)); transition: transform var(--tc-duration-base) var(--tc-ease-move), width var(--tc-duration-base) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__seg-btn { position: relative; height: 22px; padding: 0 7px; border-radius: var(--tc-control-radius-sm); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); text-align: center !important; transition: color var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__seg-btn[aria-checked="false"]:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
.ui-mdp__seg-btn[aria-checked="true"] { color: var(--tc-text-primary); }
/* ----- Tray (Standard) / last row (Clean): what the model you point at costs you ----- */
.ui-mdp__foot { display: flex; align-items: center; gap: 8px; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__foot { height: 38px; padding: 4px 8px 0 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__foot { height: 36px; padding: 0 8px 0 12px; border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-mdp__caption { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__caption { font-size: var(--tc-font-size-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__caption { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__dot { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__dot { color: var(--tc-text-disabled); }
.ui-mdp__swap { display: grid; min-width: 0; }
.ui-mdp__swap-item { grid-area: 1 / 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; animation: ui-mdp-swap-in var(--tc-duration-slow) var(--tc-ease-standard) both; }
.ui-mdp__swap-item[data-out] { animation: ui-mdp-swap-out var(--tc-duration-base) var(--tc-ease-standard) both; }
.ui-mdp__keys { display: flex; flex: none; gap: 3px; }
.ui-mdp__keys kbd { display: grid; place-items: center; min-width: calc(var(--tc-kbd-h) + 2px); height: var(--tc-kbd-h); padding: 0 var(--tc-kbd-px); border-radius: var(--tc-kbd-radius); background: var(--tc-kbd-bg); box-shadow: var(--tc-kbd-shadow); font-family: inherit; font-size: var(--tc-kbd-font-size); font-weight: var(--tc-kbd-font-weight); line-height: 1; color: var(--tc-kbd-fg); }
@keyframes ui-mdp-swap-in { from { opacity: 0; filter: blur(2px); } }
@keyframes ui-mdp-swap-out { from { opacity: 1; } to { opacity: 0; filter: blur(2px); } }
@keyframes ui-mdp-pop { from { opacity: 0; transform: scale(0.6); } }
@keyframes ui-mdp-fill { 0% { transform: scaleY(1); } 45% { transform: scaleY(1.6); } 100% { transform: scaleY(1); } }
/* Narrow menus: the glyphs in the rows and the key hints give way, effort moves left; Standard's bars move closer */
@container (max-width: 300px) {
.ui-mdp__option .ui-mdp__glyph { display: none; }
.ui-mdp__keys { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__cols,
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__bars { grid-template-columns: repeat(3, 30px); gap: 6px; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__varies { width: 102px; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__effort { padding-left: 10px; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__segmented { grid-template-columns: repeat(3, 52px); }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__thumb { width: 52px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__effort { padding-left: 8px; }
}
@media (pointer: coarse) {
.ui-mdp__keys { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__trigger { height: 36px; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__option { min-height: 54px; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__toggle { height: 42px; }
:where([data-look="standard"], [data-look="standard"] *).ui-mdp__seg-btn { height: 30px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__trigger { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__option { min-height: 52px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__toggle { height: 40px; }
:where([data-look="clean"], [data-look="clean"] *).ui-mdp__seg-btn { height: 30px; padding: 0 10px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-mdp *, .ui-mdp *::before, .ui-mdp *::after { animation: none !important; transition: none !important; }
}
`;
