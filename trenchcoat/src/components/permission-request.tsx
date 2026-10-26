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
import { reducedMotion } from "../internal/reduced-motion";
import { useControllable } from "../internal/use-controllable";
import { rescueFocus, useFocusRescue } from "../internal/use-focus-rescue";
import { useRootRef } from "../internal/use-root-ref";

/*
 * Permission Request – an agent asks for one specific right, in a single self-contained file.
 * A white card on a soft gray tray: who asks for what ("Coder wants to push to main"), why, and exactly what will happen –
 * the files, recipients or amounts – before anything does.
 *   · on the tray below, pick how long the right holds: just this once, for a while (e.g. 1 hour) or always
 *   · Allow or Deny – Enter and Esc work while the card has focus
 *   · then the card folds into one line: "Allowed for 1 hour" with a bar that drains until the right expires,
 *     and Revoke to take it back; destructive actions can never be allowed for always
 * Controlled or uncontrolled: `decision` and `scope` are controlled when defined (null counts as a decision of
 * "still waiting"), otherwise they start from `defaultDecision` / `defaultScope`; changes are always reported.
 * When a timed right runs out, `onExpire` fires once for that decision. Other DOM props and `ref` go to the root.
 * The styles are injected below, so no extra files are needed.
 * Two looks, picked with the `look` prop (the default comes from the file: permission-request.tsx is Standard,
 * permission-request-clean.tsx is Clean). Clean drops the gray tray for one quiet white card with a soft shadow,
 * and is smaller and lighter throughout – 28px avatar, tighter type, square-ish chips.
 */

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-pr";

export type PermissionRisk = "safe" | "risky" | "destructive";
export type PermissionScope = "once" | "timed" | "always";

export type PermissionDecision = {
  allow: boolean;
  scope: PermissionScope;
  /** When it was decided (ms) */
  at: number;
  /** When a timed right runs out (ms) */
  until?: number;
};

export type PermissionPreviewItem = {
  id: string;
  label: string;
  /** Right-aligned, e.g. "+12 −4" or "$240.00" */
  meta?: ReactNode;
  /** A 16px glyph or a small brand mark */
  icon?: ReactNode;
};

type PermissionRequestOwnProps = {
  /** Visual style. Defaults to the file's look: Standard in permission-request.tsx, Clean in permission-request-clean.tsx */
  look?: Look;
  /** Who asks: { name, model?, avatar? } */
  agent: { name: string; model?: string; avatar?: ReactNode };
  /** What it wants to do, lower case after "wants to", e.g. "push to main" */
  action: string;
  /** Where, e.g. "acme/web" – shown with the tool's mark */
  target?: string;
  /** The tool's mark next to the target */
  toolIcon?: ReactNode;
  risk?: PermissionRisk;
  /** The agent's own words on why it needs this */
  reason?: string;
  /** What will happen if you allow it – files, recipients, amounts */
  preview?: PermissionPreviewItem[];
  previewTitle?: string;
  /** Rows shown before "N more" – default 3 */
  previewLimit?: number;
  /** The choices offered – default all three; "always" is never offered for destructive actions */
  scopes?: PermissionScope[];
  /** Controlled choice of how long */
  scope?: PermissionScope;
  defaultScope?: PermissionScope;
  onScopeChange?: (scope: PermissionScope) => void;
  /** Minutes a timed right holds – default 60 */
  duration?: number;
  /** Controlled decision – null while it waits */
  decision?: PermissionDecision | null;
  defaultDecision?: PermissionDecision | null;
  /** Allow, Deny, Revoke (null) – the agent should listen to this */
  onDecisionChange?: (decision: PermissionDecision | null) => void;
  /** Fires once when a timed right runs out (the decision stays, shown as "Access expired") */
  onExpire?: (decision: PermissionDecision) => void;
  /** The clock for the countdown, epoch ms – defaults to an internal clock */
  now?: number;
  className?: string;
  ref?: Ref<HTMLDivElement>;
};

export type PermissionRequestProps = Omit<ComponentPropsWithoutRef<"div">, keyof PermissionRequestOwnProps> &
  PermissionRequestOwnProps;

/* ---------- Helpers ---------- */

const MIN = 60_000;
/** The wall clock – read only in effects and event handlers, never while rendering */
const clock = () => Date.now();
const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
const hhmm = (t: number) =>
  new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const span = (min: number) =>
  min % 60 === 0 ? `${min / 60} hour${min === 60 ? "" : "s"}` : `${min} min`;
const left = (ms: number) => {
  const m = Math.ceil(ms / MIN);
  return m >= 60
    ? `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min ` : ""}left`
    : `${m} min left`;
};
const RISK: Record<PermissionRisk, string> = {
  safe: "",
  risky: "Risky",
  destructive: "Destructive",
};

/* ---------- Icons ---------- */

/* Risk, check, cross and clock – triangle-alert, octagon-alert, circle-check, circle-x and clock, rounded 1.5px strokes: Lucide (ISC, lucide.dev) */
const RiskyIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);
const DestructiveIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 16h.01" />
    <path d="M12 8v4" />
    <path d="M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z" />
  </svg>
);
const CheckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m16 9-5.5 5.5L8 12" />
  </svg>
);
const CrossIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
);
const ClockIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);
const DotIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="2.4" fill="currentColor" />
  </svg>
);

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/* ---------- The countdown: React hears about the minutes, the bar drains on its own ---------- */

/**
 * A tick for the countdown, only while a timed right runs and no clock is passed in, and only while the card is on
 * screen and the tab is visible. It starts at the decision's own time (stable for server rendering and hydration)
 * and reads the real clock after mount. Every second the drain bar is written directly; the state – and with it a
 * render – only changes when the words would ("12 min left") or the right runs out.
 */
function useCountdown(
  current: PermissionDecision | null,
  nowProp: number | undefined,
  target: { current: Element | null },
) {
  const [tick, setTick] = useState(() => current?.at ?? 0);
  const shown = useRef(tick);
  const drainRef = useRef<HTMLSpanElement>(null);
  const until = current?.allow && current.scope === "timed" ? current.until : undefined;
  const at = current?.at ?? 0;
  const ticking = until !== undefined && nowProp === undefined && tick < until;
  const commit = (t: number) => {
    shown.current = t;
    setTick(t);
  };
  useEffect(() => {
    if (!ticking || until === undefined) return;
    const total = until - at;
    // The first reading goes through React, so what it renders is current
    let first = true;
    const step = () => {
      const t = clock();
      const bar = drainRef.current;
      if (bar && total) bar.style.transform = `scaleX(${Math.max(0, Math.min(1, (until - t) / total))})`;
      if (first || t >= until || left(until - t) !== left(until - shown.current)) commit(t);
      first = false;
    };
    let id = 0;
    let onScreen = true;
    const sync = () => {
      const run = onScreen && document.visibilityState !== "hidden";
      if (run && !id) {
        // Back on screen: catch up at once, then every second
        step();
        id = window.setInterval(step, 1000);
      } else if (!run && id) {
        window.clearInterval(id);
        id = 0;
      }
    };
    const io =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver((entries) => {
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
  }, [ticking, until, at, target]);
  /** A decision made here: the countdown starts from its own moment */
  const restart = (t: number) => {
    if (nowProp === undefined) commit(t);
  };
  return { now: nowProp ?? tick, drainRef, restart };
}

/* ---------- Motion: the card folds to one line and back ---------- */

/** Animates the card's height when its shape changes – from the height it had, kept fresh by a ResizeObserver */
function useFold(cardRef: { current: HTMLDivElement | null }, shape: string) {
  const height = useRef(0);
  const lastShape = useRef(shape);
  // The card's height, measured when the shape changes (not on every render)
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const from = height.current;
    const to = card.offsetHeight;
    height.current = to;
    if (lastShape.current === shape) return;
    lastShape.current = shape;
    if (reducedMotion() || !from) return;
    if (Math.abs(to - from) > 1) {
      card.animate([{ height: `${from}px` }, { height: `${to}px` }], {
        duration: 380,
        easing: EASE,
      });
    }
  }, [cardRef, shape]);
  // …and whenever it resizes without a change of shape (content, fonts, container width)
  useEffect(() => {
    const card = cardRef.current;
    if (!card || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (!card.getAnimations?.().length) height.current = card.offsetHeight;
    });
    ro.observe(card);
    return () => ro.disconnect();
  }, [cardRef]);
}

/* ---------- The decided line ---------- */

function DecidedLine({
  current,
  now,
  expired,
  agent,
  action,
  drainRef,
  onReset,
}: {
  current: PermissionDecision;
  now: number;
  expired: boolean;
  agent: PermissionRequestProps["agent"];
  action: string;
  drainRef: { current: HTMLSpanElement | null };
  onReset: () => void;
}) {
  const total = current.until ? current.until - current.at : 0;
  const share = total
    ? Math.max(0, Math.min(1, (current.until! - now) / total))
    : 0;
  const kind = expired ? "expired" : current.allow ? "allowed" : "denied";
  const headline = expired
    ? "Access expired"
    : !current.allow
      ? "Denied"
      : current.scope === "once"
        ? "Allowed once"
        : current.scope === "timed"
          ? `Allowed for ${span(Math.round(total / MIN))}`
          : "Always allowed";
  const note = expired
    ? `${agent.name} will ask again`
    : !current.allow
      ? `${agent.name} was told and won't do it`
      : current.scope === "timed"
        ? `${left(current.until! - now)} · until ${hhmm(current.until!)}`
        : current.scope === "once"
          ? `At ${hhmm(current.at)} · it won't carry over`
          : `${agent.name} won't ask for this again`;
  return (
    <div className="ui-pr__result" data-kind={kind}>
      <span className="ui-pr__result-icon">
        {kind === "allowed" ? (
          <CheckIcon />
        ) : kind === "denied" ? (
          <CrossIcon />
        ) : (
          <ClockIcon />
        )}
      </span>
      <span className="ui-pr__result-text">
        <span className="ui-pr__result-head">
          {headline}
          <span className="ui-pr__result-action"> · {action}</span>
        </span>
        <span className="ui-pr__result-note">{note}</span>
      </span>
      {/* One button whose label changes, so focus stays on it when the right runs out */}
      <button type="button" className="ui-pr__ghost" data-focus-key="reset" onClick={onReset}>
        {current.allow && !expired && current.scope !== "once"
          ? "Revoke"
          : expired
            ? "Ask again"
            : "Change"}
      </button>
      {current.allow && current.scope === "timed" && !expired && (
        <span className="ui-pr__drain" aria-hidden="true">
          <span ref={drainRef} style={{ transform: `scaleX(${share})` }} />
        </span>
      )}
    </div>
  );
}

/* ---------- The ask: who asks for what, what will happen, how long, and the answer ---------- */

function PreviewList({
  uid,
  preview,
  previewTitle,
  previewLimit,
  open,
  onToggle,
}: {
  uid: string;
  preview: PermissionPreviewItem[];
  previewTitle: string;
  previewLimit: number;
  open: boolean;
  onToggle: () => void;
}) {
  const shown = open ? preview : preview.slice(0, previewLimit);
  const hidden = preview.length - shown.length;
  return (
    <section className="ui-pr__preview" aria-labelledby={`${uid}-what`}>
      <h4 className="ui-pr__label" id={`${uid}-what`}>
        {previewTitle}
        <span className="ui-pr__count">{preview.length}</span>
      </h4>
      <ul className="ui-pr__list">
        {shown.map((p, i) => (
          <li
            key={p.id}
            className="ui-pr__item"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <span className="ui-pr__item-icon">{p.icon ?? <DotIcon />}</span>
            <span className="ui-pr__item-label">{p.label}</span>
            {p.meta != null && (
              <span className="ui-pr__item-meta">{p.meta}</span>
            )}
          </li>
        ))}
      </ul>
      {(hidden > 0 || open) && preview.length > previewLimit && (
        <button
          type="button"
          className="ui-pr__more"
          aria-expanded={open}
          onClick={onToggle}
        >
          {open ? "Show less" : `${hidden} more`}
        </button>
      )}
    </section>
  );
}

function ScopePicker({
  offered,
  scope,
  duration,
  onScope,
}: {
  offered: PermissionScope[];
  scope: PermissionScope;
  duration: number;
  onScope: (scope: PermissionScope) => void;
}) {
  const scopeLabel = (s: PermissionScope) =>
    s === "once" ? "Just once" : s === "timed" ? span(duration) : "Always";
  return (
    <div className="ui-pr__scopes" role="radiogroup" aria-label="How long">
      {offered.map((s) => (
        <button
          key={s}
          type="button"
          role="radio"
          aria-checked={s === scope}
          className="ui-pr__scope"
          onClick={() => onScope(s)}
          onKeyDown={(e) => {
            const step =
              e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
            if (!step) return;
            e.preventDefault();
            const next =
              offered[
                (offered.indexOf(scope) + step + offered.length) %
                  offered.length
              ];
            onScope(next);
            (
              e.currentTarget.parentElement?.querySelector(
                `[data-scope="${next}"]`,
              ) as HTMLElement | null
            )?.focus();
          }}
          data-scope={s}
          tabIndex={s === scope ? 0 : -1}
        >
          {scopeLabel(s)}
        </button>
      ))}
    </div>
  );
}

function AskCard({
  uid,
  agent,
  action,
  target,
  toolIcon,
  risk,
  reason,
  preview,
  previewTitle,
  previewLimit,
  scopes,
  offered,
  scope,
  duration,
  open,
  onToggle,
  onScope,
  onAllow,
  onDeny,
}: {
  uid: string;
  agent: PermissionRequestProps["agent"];
  action: string;
  target?: string;
  toolIcon?: ReactNode;
  risk: PermissionRisk;
  reason?: string;
  preview: PermissionPreviewItem[];
  previewTitle: string;
  previewLimit: number;
  scopes: PermissionScope[];
  offered: PermissionScope[];
  scope: PermissionScope;
  duration: number;
  open: boolean;
  onToggle: () => void;
  onScope: (scope: PermissionScope) => void;
  onAllow: () => void;
  onDeny: () => void;
}) {
  const allowLabel =
    scope === "once"
      ? "Allow once"
      : scope === "timed"
        ? `Allow for ${span(duration)}`
        : "Always allow";
  return (
    <div className="ui-pr__ask">
      <div className="ui-pr__body">
        {/* ----- Who asks for what ----- */}
        <header className="ui-pr__head">
          <span
            className="ui-pr__avatar"
            data-logo={agent.avatar ? "" : undefined}
          >
            {agent.avatar ?? initials(agent.name)}
          </span>
          <span className="ui-pr__heading">
            <span className="ui-pr__title" id={`${uid}-title`}>
              <b>{agent.name}</b> wants to <b>{action}</b>
            </span>
            {(target || agent.model) && (
              <span className="ui-pr__sub">
                {toolIcon && <span className="ui-pr__tool">{toolIcon}</span>}
                {target ?? agent.model}
              </span>
            )}
          </span>
          {risk !== "safe" && (
            <span className="ui-pr__risk" data-risk={risk}>
              {risk === "risky" ? <RiskyIcon /> : <DestructiveIcon />}
              {RISK[risk]}
            </span>
          )}
        </header>

        {reason && (
          <p className="ui-pr__why" id={`${uid}-why`}>
            {reason}
          </p>
        )}

        {/* ----- Exactly what will happen ----- */}
        {preview.length > 0 && (
          <PreviewList
            uid={uid}
            preview={preview}
            previewTitle={previewTitle}
            previewLimit={previewLimit}
            open={open}
            onToggle={onToggle}
          />
        )}
      </div>

      {/* ----- How long, and the answer ----- */}
      <div className="ui-pr__answer">
        {offered.length > 1 && (
          <ScopePicker
            offered={offered}
            scope={scope}
            duration={duration}
            onScope={onScope}
          />
        )}
        {risk === "destructive" && scopes.includes("always") && (
          <span className="ui-pr__hint">
            Destructive actions can't be allowed for always
          </span>
        )}
        <div className="ui-pr__buttons">
          <button type="button" className="ui-pr__btn" onClick={onDeny}>
            Deny
            <kbd className="ui-pr__kbd">Esc</kbd>
          </button>
          <button
            type="button"
            className="ui-pr__btn ui-pr__btn--primary"
            data-focus-key="allow"
            onClick={onAllow}
          >
            <span key={allowLabel} className="ui-pr__btn-label">
              {allowLabel}
            </span>
            <kbd className="ui-pr__kbd">↵</kbd>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- The component ---------- */

export function PermissionRequest({
  look,
  agent,
  action,
  target,
  toolIcon,
  risk = "risky",
  reason,
  preview = [],
  previewTitle = "What will happen",
  previewLimit = 3,
  scopes = ["once", "timed", "always"],
  scope: scopeProp,
  defaultScope = "once",
  onScopeChange,
  duration = 60,
  decision,
  defaultDecision = null,
  onDecisionChange,
  onExpire,
  now: nowProp,
  className,
  ref,
  ...rest
}: PermissionRequestProps) {
  const uid = useId();
  const [current, decide] = useControllable<PermissionDecision | null>(
    decision,
    defaultDecision,
    onDecisionChange,
    "decision",
  );
  const offered = scopes.filter(
    (s) => !(s === "always" && risk === "destructive"),
  );
  const [wanted, setScope] = useControllable<PermissionScope>(
    scopeProp,
    defaultScope,
    onScopeChange,
    "scope",
  );
  const scope = offered.includes(wanted) ? wanted : (offered[0] ?? "once");
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { now, drainRef, restart } = useCountdown(current, nowProp, cardRef);

  // Before the card changes shape, focus (if it is inside) waits on the card itself; once the new shape is there it
  // moves on to that shape's main button – Revoke / Change after a decision, Allow when asked again
  const settle = () => {
    const card = cardRef.current;
    if (!card || document.activeElement !== card) return;
    card
      .querySelector<HTMLElement>('[data-focus-key="reset"], [data-focus-key="allow"]')
      ?.focus({ preventScroll: true });
  };
  // A controlling parent may keep the old shape – then the next frame puts focus back on its button
  const hold = () => {
    if (rescueFocus(cardRef.current, [cardRef.current])) requestAnimationFrame(settle);
  };
  const allow = () => {
    hold();
    const at = nowProp ?? clock();
    restart(at);
    decide({
      allow: true,
      scope,
      at,
      until: scope === "timed" ? at + duration * MIN : undefined,
    });
  };
  const deny = () => {
    hold();
    decide({ allow: false, scope, at: nowProp ?? clock() });
  };
  const reset = () => {
    hold();
    decide(null);
  };

  const onKey = (e: KeyboardEvent) => {
    if (current || e.nativeEvent.isComposing) return;
    const tag = (e.target as HTMLElement).tagName;
    if (e.key === "Enter" && tag !== "BUTTON") {
      e.preventDefault();
      allow();
    } else if (e.key === "Escape") {
      e.preventDefault();
      deny();
    }
  };

  const expired = !!(current?.allow && current.until && now >= current.until);

  // Tell the parent once per decision when its timed right runs out
  const expireRef = useRef(onExpire);
  useEffect(() => {
    expireRef.current = onExpire;
  });
  const reported = useRef<PermissionDecision | null>(null);
  useEffect(() => {
    if (!expired || !current || reported.current === current) return;
    reported.current = current;
    expireRef.current?.(current);
  }, [expired, current]);

  const shape = current
    ? expired
      ? "expired"
      : current.allow
        ? "allowed"
        : "denied"
    : `pending:${open}`;
  useFold(cardRef, shape);
  const decided = !!current;
  // When the shape changes, focus held on the card moves on to the new shape's button
  useLayoutEffect(settle, [decided]);
  // Safety net when the parent swaps the decision while focus is inside: the card's main button, else the root
  const rootRef = useRef<HTMLDivElement>(null);
  useFocusRescue(rootRef, {
    fallback: () =>
      cardRef.current?.querySelector('[data-focus-key="reset"], [data-focus-key="allow"]'),
  });
  const setRoot = useRootRef(rootRef, ref);
  // Announced once per outcome – the countdown's minutes are not
  const announcement = current
    ? `${
        expired
          ? "Access expired"
          : !current.allow
            ? "Denied"
            : current.scope === "once"
              ? "Allowed once"
              : current.scope === "timed"
                ? `Allowed for ${span(Math.round(((current.until ?? current.at) - current.at) / MIN))}`
                : "Always allowed"
      }: ${agent.name} ${current.allow && !expired ? "may" : "may not"} ${action}`
    : "";

  return (
    <div
      {...rest}
      ref={setRoot}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={look ?? DEFAULT_LOOK}
      data-risk={risk}
      data-state={shape.split(":")[0]}
    >
      <style href="ui-permission-request" precedence="default">
        {css}
      </style>

      <span className="ui-pr__sr" role="status">
        {announcement}
      </span>
      <div
        ref={cardRef}
        className="ui-pr__card"
        tabIndex={-1}
        role={current ? undefined : "group"}
        aria-labelledby={current ? undefined : `${uid}-title`}
        aria-describedby={current || !reason ? undefined : `${uid}-why`}
        onKeyDown={onKey}
      >
        {current ? (
          <DecidedLine
            current={current}
            now={now}
            expired={expired}
            agent={agent}
            action={action}
            drainRef={drainRef}
            onReset={reset}
          />
        ) : (
          <AskCard
            key="ask"
            uid={uid}
            agent={agent}
            action={action}
            target={target}
            toolIcon={toolIcon}
            risk={risk}
            reason={reason}
            preview={preview}
            previewTitle={previewTitle}
            previewLimit={previewLimit}
            scopes={scopes}
            offered={offered}
            scope={scope}
            duration={duration}
            open={open}
            onToggle={() => setOpen((o) => !o)}
            onScope={setScope}
            onAllow={allow}
            onDeny={deny}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- Styles ---------- */

const css = /* css */ `
/* Standard: a gray tray holding a white card; the answer sits on the tray below it */
:where([data-look="standard"], [data-look="standard"] *).ui-pr {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 420px;
  padding: var(--tc-tray-inset);
  overflow: hidden;
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
  letter-spacing: -0.006em;
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *).ui-pr {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 400px;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.ui-pr *, .ui-pr *::before, .ui-pr *::after { box-sizing: border-box; }
:where(.ui-pr) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ui-pr button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-pr ul { margin: 0; padding: 0; list-style: none; }
.ui-pr h4, .ui-pr p { margin: 0; }
.ui-pr svg { display: block; flex: none; }
.ui-pr__sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.ui-pr__ask { animation: ui-pr-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__card { overflow: hidden; border-radius: var(--tc-card-radius); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__body { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
/* ----- Who asks for what ----- */
.ui-pr__head { display: flex; align-items: center; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__head { gap: 12px; padding: 16px 16px 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__head { gap: 10px; padding: 14px 14px 0 16px; }
.ui-pr__avatar { display: grid; flex: none; place-items: center; background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-weight: var(--tc-avatar-font-weight); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__avatar { width: 32px; height: 32px; border-radius: var(--tc-radius-lg); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__avatar[data-logo] > svg { width: 18px; height: 18px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__avatar { width: 28px; height: 28px; border-radius: var(--tc-avatar-radius-agent); font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__avatar[data-logo] > svg { width: 16px; height: 16px; }
.ui-pr__heading { display: grid; flex: 1; min-width: 0; }
.ui-pr__title b { font-weight: var(--tc-font-weight-strong); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__title { color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__title b { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__title { color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__title b { color: var(--tc-text-strong); }
.ui-pr__sub { display: flex; align-items: center; gap: 5px; min-width: 0; overflow: hidden; color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__sub { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__sub { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-pr__tool { display: grid; flex: none; place-items: center; width: 12px; height: 12px; }
.ui-pr__tool > svg { width: 12px; height: 12px; }
/* Risk: a header pill – glyph and word on a status tone */
.ui-pr__risk { display: inline-flex; flex: none; align-self: start; align-items: center; gap: 4px; height: var(--tc-pill-h-lg); margin-top: 1px; padding: 0 var(--tc-pill-px-lg) 0 calc(var(--tc-pill-px-lg) - 2px); border-radius: var(--tc-pill-radius); background: var(--tc-status-warning-bg); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-status-warning-fg); }
.ui-pr__risk[data-risk="destructive"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* The agent's reason: a quiet line with a rule on the left */
.ui-pr__why { padding-left: 10px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__why { margin: 12px 16px 0 60px !important; border-left: 2px solid var(--tc-border-default); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__why { margin: 12px 16px 0 54px !important; border-left: 2px solid var(--tc-fill-default); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
/* ----- What will happen ----- */
.ui-pr__preview { margin-top: 14px; border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__preview { padding: 12px 8px 6px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__preview { padding: 12px 10px 4px; }
.ui-pr__label { display: flex; align-items: center; gap: 6px; color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__label { margin: 0 8px 4px !important; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__label { margin: 0 6px 4px !important; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-regular); line-height: var(--tc-line-height-tight); }
/* The count: a badge */
.ui-pr__count { display: grid; place-items: center; border-radius: var(--tc-radius-badge); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__count { min-width: 18px; height: 18px; padding: 0 5px; background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__count { min-width: 16px; height: 16px; padding: 0 4px; background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-pr__list { display: grid; }
.ui-pr__item { display: flex; align-items: center; gap: 10px; animation: ui-pr-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__item { min-height: 32px; padding: 0 8px; border-radius: var(--tc-radius-md); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__item { min-height: 30px; padding: 0 6px; border-radius: var(--tc-radius-sm); }
.ui-pr__item-icon { display: grid; flex: none; place-items: center; width: 16px; height: 16px; color: var(--tc-icon-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__item-icon { color: var(--tc-text-muted); }
.ui-pr__item-icon > svg { width: 16px; height: 16px; }
.ui-pr__item-label { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__item-label { font-size: var(--tc-font-size-md); }
.ui-pr__item-meta { flex: none; color: var(--tc-text-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__item-meta { font-size: var(--tc-font-size-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__item-meta { font-size: var(--tc-font-size-sm); }
.ui-pr__more { padding: 2px 0; color: var(--tc-text-muted); transition: color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__more { margin: 0 0 6px 34px; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__more { margin: 0 0 4px 32px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-pr__more:hover { color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__body:not(:has(.ui-pr__preview)) { padding-bottom: 16px; }
/* Without a preview the answer sits a little below the heading or the reason */
:where([data-look="clean"], [data-look="clean"] *).ui-pr__body:not(:has(.ui-pr__preview)) { padding-bottom: 14px; }
/* ----- How long, and the answer ----- */
.ui-pr__answer { display: grid; gap: 12px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__answer { padding: 12px 8px 8px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__answer { padding: 12px 16px 16px; border-top: var(--tc-hairline) solid var(--tc-divider); }
/* How long – Standard: a segmented track, the chosen one raised in white; Clean: separate chips. The chosen one also
   carries a ring in the selected colour, so it doesn't rely on a faint fill */
.ui-pr__scope { flex: 1; font-weight: var(--tc-font-weight-medium); text-align: center !important; white-space: nowrap; transition: color var(--tc-duration-base) var(--tc-ease-standard), background-color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
.ui-pr__scope[aria-checked="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow), inset 0 0 0 1px var(--tc-border-selected); color: var(--tc-text-primary); }
.ui-pr__scope[aria-checked="false"]:hover { color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__scopes { display: flex; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__scope { height: var(--tc-control-h-md); padding: 0 10px; border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-md); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__scope[aria-checked="true"] { font-weight: var(--tc-font-weight-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__scopes { display: flex; gap: 8px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__scope { padding: 3px 8px; border-radius: var(--tc-control-radius-sm); background: var(--tc-fill-default); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__scope[aria-checked="false"]:hover { background: var(--tc-fill-strong); }
.ui-pr__hint { line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__hint { margin: -6px 4px 0; font-size: var(--tc-font-size-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__hint { margin-top: -6px; font-size: var(--tc-font-size-xs); }
.ui-pr__buttons { display: flex; gap: 8px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__buttons { justify-content: flex-end; }
/* Deny and Allow: Button's secondary and primary recipes (Standard large, Clean medium) */
.ui-pr__btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-quick) var(--tc-ease-standard); }
.ui-pr__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__btn { flex: 1; height: var(--tc-control-h-lg); padding: 0 var(--tc-control-px-lg); border-radius: var(--tc-control-radius-lg); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__btn { height: var(--tc-control-h-md); padding: 0 calc(var(--tc-control-px-md) - 2px) 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); }
.ui-pr__btn:active { transform: scale(0.98); }
.ui-pr__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-pr__btn--primary:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-pr__btn--primary:active { background: var(--tc-action-primary-bg-active); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__btn--primary { flex: 1.4; }
.ui-pr[data-risk="destructive"] .ui-pr__btn--primary { background: var(--tc-status-danger-fg); color: var(--tc-text-on-inverse); }
.ui-pr__btn-label { animation: ui-pr-swap var(--tc-duration-base) var(--tc-ease-move) both; }
/* Key hints: the kbd chip; inside the primary button it sits on the ink */
.ui-pr__kbd { display: grid; place-items: center; min-width: var(--tc-kbd-h); height: var(--tc-kbd-h); padding: 0 var(--tc-kbd-px); border-radius: var(--tc-kbd-radius); background: var(--tc-kbd-bg); box-shadow: var(--tc-kbd-shadow); font-family: inherit; font-size: var(--tc-kbd-font-size); font-weight: var(--tc-kbd-font-weight); line-height: 1; color: var(--tc-kbd-fg); }
.ui-pr__btn--primary .ui-pr__kbd { background: var(--tc-kbd-on-inverse-bg); box-shadow: none; color: inherit; }
/* ----- The decided line: a white card ----- */
.ui-pr__result { position: relative; display: flex; align-items: center; padding: 10px 10px 10px 16px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__result { gap: 12px; min-height: 60px; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); animation: ui-pr-in var(--tc-duration-slow) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__result { gap: 10px; min-height: 56px; animation: ui-pr-in var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-pr__result-icon { display: grid; flex: none; place-items: center; animation: ui-pr-pop var(--tc-duration-slow) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__result-icon { width: 18px; height: 18px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__result-icon > svg { width: 18px; height: 18px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__result-icon { width: 16px; height: 16px; }
.ui-pr__result[data-kind="allowed"] .ui-pr__result-icon { color: var(--tc-status-success-fg); }
.ui-pr__result[data-kind="denied"] .ui-pr__result-icon { color: var(--tc-status-danger-fg); }
.ui-pr__result[data-kind="expired"] .ui-pr__result-icon { color: var(--tc-text-muted); }
.ui-pr__result-text { display: grid; flex: 1; min-width: 0; }
.ui-pr__result-head { overflow: hidden; font-weight: var(--tc-font-weight-strong); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__result-head { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__result-head { color: var(--tc-text-strong); }
.ui-pr__result-action { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-pr__result-note { overflow: hidden; color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__result-note { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__result-note { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
/* Revoke / Change: Standard's secondary button, Clean's ghost button */
.ui-pr__ghost { flex: none; height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__ghost { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__ghost:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__ghost { color: var(--tc-action-ghost-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__ghost:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
/* The time left: a thin bar along the bottom that drains until the right runs out */
.ui-pr__drain { position: absolute; right: 0; bottom: 0; left: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__drain { height: 3px; background: var(--tc-fill-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__drain { height: 2px; background: var(--tc-fill-subtle); }
.ui-pr__drain > span { display: block; height: 100%; background: var(--tc-status-success-fg); transform-origin: left; transition: transform var(--tc-duration-reveal-slow) linear; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__drain > span { opacity: 0.6; }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__drain > span { opacity: 0.7; }
@keyframes ui-pr-in { from { opacity: 0; transform: translateY(3px); } }
@keyframes ui-pr-swap { from { opacity: 0; transform: translateY(2px); } }
@keyframes ui-pr-pop { 0% { opacity: 0; transform: scale(0.5); } 60% { opacity: 1; transform: scale(1.12); } }
/* Narrow containers: the reason loses its indent, no keyboard hints */
@container (max-width: 360px) {
:where([data-look="standard"], [data-look="standard"] *).ui-pr__why { margin-left: 16px !important; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__scope { padding: 0 6px; font-size: var(--tc-font-size-sm); }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__kbd { display: none; }
}
/* Narrow containers: the reason loses its indent, the buttons share the width */
@container (max-width: 340px) {
:where([data-look="clean"], [data-look="clean"] *).ui-pr__why { margin-left: 16px !important; }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__scopes { gap: 4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__scope { padding: 4px 4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__buttons > .ui-pr__btn { flex: 1; }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__kbd { display: none; }
}
@media (hover: none) {
  .ui-pr__kbd { display: none; }
}
@media (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-pr__scope { height: 38px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pr__btn { height: 46px; }
.ui-pr__ghost { height: 40px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__scope { padding: 8px 10px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pr__btn { height: 40px; padding: 0 16px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-pr *, .ui-pr *::before, .ui-pr *::after { animation: none !important; transition: none !important; }
}
`;
