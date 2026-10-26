"use client";

/*
 * Approval Card – an AI agent asks before it does something consequential, in a single self-contained file.
 * A header with the action, a risk badge and a preview (recipients, key-value details), then
 * "Always allow this action" in a white card; Approve / Deny (⌘↵ / Esc) sit on the gray tray below it.
 * An optional countdown ("Expires in 0:42") sits quietly in the tray and pauses while you hover or
 * focus the card (or the tab is hidden); "Stop" turns it off. After a decision the tray footer folds away into a compact row: the check or cross
 * draws in and the height glides down.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: approval-card.tsx is Standard,
 * approval-card-clean.tsx is Clean). Clean is one clean white card: a risk tag, the preview as plain rows under a
 * hairline, and – by default (actions="card") – a last row holding "Always allow this action" and Deny / Approve;
 * with actions="tray" the buttons sit on a gray tray below the card instead.
 */
// Generated from src/components/approval-card.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent, type ReactNode, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-ap";

export type ApprovalStatus = "pending" | "approved" | "denied";
export type ApprovalRisk = "low" | "medium" | "high";
export type ApprovalDetail = { label: string; value: ReactNode };
export type DenyReason = "user" | "timeout";

type ApprovalCardOwnProps = {
  /** Visual style. Defaults to the file's look: Standard in approval-card.tsx, Clean in approval-card-clean.tsx */
  look?: Look;
  /** The action, e.g. "Send campaign email" */
  title: string;
  /** One line of context below the title */
  description?: ReactNode;
  /** Tinted badge in the header; leave out to hide it */
  risk?: ApprovalRisk;
  /** Icon in the header tile – defaults to a small shield */
  icon?: ReactNode;
  /** Key-value rows in the preview, e.g. To, Subject, Scheduled */
  details?: ApprovalDetail[];
  /** Anything to show above the details, e.g. a recipient list – children work too */
  preview?: ReactNode;
  children?: ReactNode;
  /** The status. Controlled when defined – the card then only asks for changes through `onStatusChange` */
  status?: ApprovalStatus;
  /** Starting status when `status` isn't controlled */
  defaultStatus?: ApprovalStatus;
  /** Called with the new status whenever the card is approved, denied or expires (controlled or not) */
  onStatusChange?: (status: ApprovalStatus) => void;
  /** Return a promise to show a spinner and lock the card until it settles; a rejection keeps it pending and shows
   *  `errorLabel`, and Approve can be pressed again to retry */
  onApprove?: (decision: { always: boolean }) => void | Promise<unknown>;
  /** Shown under the buttons when an onApprove promise rejects */
  errorLabel?: string;
  onDeny?: (decision: { reason: DenyReason }) => void;
  /** Shows an "Edit" button */
  onEdit?: () => void;
  /** Seconds until the request expires and is denied with reason "timeout" */
  expiresIn?: number;
  /** Called when the countdown runs out (onDeny is called too) */
  onExpire?: () => void;
  /** Show a "Stop" button next to the countdown that turns the time limit off (WCAG 2.2.1). Default true */
  allowStopTimer?: boolean;
  /** Its label – the countdown ("Expires in 42 seconds…") describes it */
  stopTimerLabel?: string;
  /** Show the "Always allow this action" checkbox */
  allowAlways?: boolean;
  alwaysLabel?: string;
  approveLabel?: string;
  denyLabel?: string;
  editLabel?: string;
  /** Show ⌘↵ / Esc hints on the buttons (the shortcuts work either way) */
  shortcuts?: boolean;
  /** Small label on the gray tray above the card, e.g. "Step 4 · gmail.send" */
  label?: ReactNode;
  /** Where the buttons sit: on the gray tray below the card or inside the white card. Default: "tray" in the
   *  Standard look, "card" in the Clean look */
  actions?: "tray" | "card";
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

export type ApprovalCardProps = Omit<ComponentPropsWithoutRef<"div">, keyof ApprovalCardOwnProps> & ApprovalCardOwnProps;

const RISK_LABEL: Record<ApprovalRisk, string> = { low: "Low", medium: "Medium", high: "High" };

/* ---------- Hooks ---------- */

/**
 * The countdown to `total` ms, paused while `paused` (hover, focus, busy, a hidden tab) and stopped for good with
 * `off` (WCAG 2.2.1: the user can turn the time limit off). The time left lives in a ref and is written into the
 * countdown's text once a second by a one-second timer – no render and no animation frame per second. A render draws
 * the full time; a layout effect puts the real one back before it's painted. Crossing 20 s left is announced once
 * through `warnRef` (a persistent status region), never every second.
 */
function useCountdown(total: number, status: ApprovalStatus, resolved: boolean, paused: boolean, off: boolean, warning: string, onExpire: () => void) {
  const left = useRef(total);
  const expiresRef = useRef<HTMLSpanElement>(null);
  const timerSrRef = useRef<HTMLSpanElement>(null);
  const warnRef = useRef<HTMLSpanElement>(null);
  const paintLeft = useCallback(() => {
    const s = Math.max(0, Math.ceil(left.current / 1000));
    const el = expiresRef.current;
    const sr = timerSrRef.current;
    const text = clock(s);
    if (el?.lastChild && el.lastChild.nodeValue !== text) el.lastChild.nodeValue = text;
    if (el) el.toggleAttribute("data-low", s <= 10);
    if (sr?.firstChild) sr.firstChild.nodeValue = timerText(s);
  }, []);
  const expire = useRef(onExpire);
  const warn = useRef(warning);
  useLayoutEffect(() => {
    expire.current = onExpire;
    warn.current = warning;
  });
  // Time runs out once per request: a controlled card whose parent leaves it pending doesn't expire
  // (and call onExpire/onDeny) again each time hover or focus restarts the countdown
  const expired = useRef(false);

  // A fresh request gets the full time again
  useLayoutEffect(() => {
    if (status !== "pending") return;
    left.current = total;
    expired.current = false;
    if (warnRef.current) warnRef.current.textContent = "";
  }, [status, total]);
  // After every render: the render drew the full time
  useLayoutEffect(() => paintLeft());

  useEffect(() => {
    if (!total || resolved || paused || off || expired.current) return;
    let timer = 0;
    // One timeout per whole second: the first one only waits for the rest of the current second
    const next = () => {
      const wait = left.current % 1000 || 1000;
      timer = window.setTimeout(() => {
        const before = left.current;
        left.current -= wait;
        paintLeft();
        if (before > WARN_AT && left.current <= WARN_AT && left.current > 0 && warnRef.current) warnRef.current.textContent = warn.current;
        if (left.current <= 0) {
          expired.current = true;
          expire.current();
          return;
        }
        next();
      }, wait);
    };
    next();
    return () => window.clearTimeout(timer);
  }, [total, resolved, paused, off, paintLeft]);
  return { expiresRef, timerSrRef, warnRef };
}

/** The countdown announces itself once, this long before it runs out */
const WARN_AT = 20_000;

type ElRef<T> = { current: T | null };

/** The card morphs between its pending and resolved heights; the focus stays in the card */
function useHeightMorph(root: ElRef<HTMLDivElement>, row: ElRef<HTMLDivElement>, approveBtn: ElRef<HTMLButtonElement>, rowFocused: { current: boolean }, resolved: boolean) {
  const lastH = useRef(0);
  const animating = useRef(false);
  const mounted = useRef(false);

  // Remember the settled height, so a status change knows where to animate from
  useEffect(() => {
    const el = root.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (!animating.current) lastH.current = el.offsetHeight;
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [root]);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (!mounted.current) {
      mounted.current = true;
      lastH.current = el.offsetHeight;
      return;
    }

    // Keep focus in the card: on the resolved row, or back on Approve for a new request
    const active = document.activeElement;
    if (resolved && active && el.contains(active)) row.current?.focus({ preventScroll: true });
    if (!resolved && rowFocused.current) approveBtn.current?.focus({ preventScroll: true });
    rowFocused.current = false;

    const from = lastH.current;
    el.style.height = "";
    const to = el.offsetHeight;
    if (!from || from === to) return;
    animating.current = true;
    el.style.height = `${from}px`;
    void el.offsetHeight;
    el.style.height = `${to}px`;
    const t = window.setTimeout(() => {
      el.style.height = "";
      animating.current = false;
      lastH.current = el.offsetHeight;
    }, 560);
    return () => {
      window.clearTimeout(t);
      el.style.height = "";
      animating.current = false;
    };
  }, [resolved, root, row, approveBtn, rowFocused]);
}

/* ---------- Parts ---------- */

/** "Always allow this action" */
function AlwaysAllow({ checked, disabled, label, onChange }: { checked: boolean; disabled: boolean; label: ReactNode; onChange: (always: boolean) => void }) {
  return (
    <label className="ui-ap__always">
      <span className="ui-ap__box">
        <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 8.3 6.8 11 12 5.2" />
        </svg>
      </span>
      <span className="ui-ap__always-label">{label}</span>
    </label>
  );
}

type FootProps = {
  failed: boolean;
  errorLabel: ReactNode;
  alwaysBox: ReactNode;
  total: number;
  secondsLeft: number;
  paused: boolean;
  timerOff: boolean;
  stopTimer?: () => void;
  stopTimerLabel: ReactNode;
  timerId: string;
  expiresRef: ElRef<HTMLSpanElement>;
  approveBtn: ElRef<HTMLButtonElement>;
  busy: boolean;
  shortcuts: boolean;
  mod: string;
  onEdit?: () => void;
  editLabel: ReactNode;
  denyLabel: ReactNode;
  approveLabel: ReactNode;
  approve: () => Promise<void>;
  deny: (why?: DenyReason) => void;
};

/** The countdown and the decision – on the tray below the card, or inside it with actions="card" */
function Foot({ failed, errorLabel, alwaysBox, total, secondsLeft, paused, timerOff, stopTimer, stopTimerLabel, timerId, expiresRef, approveBtn, busy, shortcuts, mod, onEdit, editLabel, denyLabel, approveLabel, approve, deny }: FootProps) {
  return (
    <div className="ui-ap__foot">
      {failed && (
        <p className="ui-ap__error" role="alert">
          {errorLabel}
        </p>
      )}
      {alwaysBox}
      {total > 0 && (
        <span className="ui-ap__timer">
          {timerOff ? (
            <span className="ui-ap__expires" data-off="">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="8" cy="8" r="6" />
                <path d="M8 5v3.2l2 1.3" />
              </svg>
              No time limit
            </span>
          ) : (
            <span ref={expiresRef} className="ui-ap__expires" data-paused={paused || undefined} data-low={secondsLeft <= 10 || undefined} aria-hidden="true">
              <svg viewBox="0 0 16 16">
                <circle cx="8" cy="8" r="6" />
                <path d="M8 5v3.2l2 1.3" />
              </svg>
              Expires in {clock(secondsLeft)}
            </span>
          )}
          {!timerOff && stopTimer && (
            <button type="button" className="ui-ap__btn ui-ap__btn--ghost ui-ap__stop" aria-describedby={timerId} onClick={stopTimer}>
              {stopTimerLabel}
            </button>
          )}
        </span>
      )}
      <div className="ui-ap__actions">
        {onEdit && (
          <button
            type="button"
            className="ui-ap__btn ui-ap__btn--ghost"
            aria-disabled={busy || undefined}
            onClick={() => !busy && onEdit()}
          >
            {editLabel}
          </button>
        )}
        <button
          type="button"
          className="ui-ap__btn ui-ap__btn--quiet ui-ap__deny"
          aria-keyshortcuts="Escape"
          aria-disabled={busy || undefined}
          onClick={() => deny("user")}
        >
          {denyLabel}
          {shortcuts && (
            <kbd className="ui-ap__kbd" aria-hidden="true">
              Esc
            </kbd>
          )}
        </button>
        <button
          ref={approveBtn}
          type="button"
          className="ui-ap__btn ui-ap__btn--primary ui-ap__approve"
          aria-keyshortcuts="Meta+Enter Control+Enter"
          aria-disabled={busy || undefined}
          onClick={() => void approve()}
        >
          {approveLabel}
          {busy ? (
            <svg className="ui-ap__spinner" viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="8" r="6" />
            </svg>
          ) : (
            shortcuts && (
              <kbd className="ui-ap__kbd" aria-hidden="true">
                {mod === "⌘" ? "⌘↵" : "Ctrl ↵"}
              </kbd>
            )
          )}
        </button>
      </div>
    </div>
  );
}

type ResolvedRowProps = {
  row: ElRef<HTMLDivElement>;
  rowFocused: { current: boolean };
  status: ApprovalStatus;
  title: ReactNode;
  rowTitleId: string;
  resolvedLabel: string;
  always: boolean;
  decidedAt: number | null;
  now: number;
};

/** The one-line record a decided card folds into */
function ResolvedRow({ row, rowFocused, status, title, rowTitleId, resolvedLabel, always, decidedAt, now }: ResolvedRowProps) {
  return (
    <div
      ref={row}
      className="ui-ap__card ui-ap__resolved"
      tabIndex={-1}
      data-status={status}
      onFocus={() => (rowFocused.current = true)}
      onBlur={(e) => {
        // A blur from being removed (the card resets) keeps the flag, so focus can return to Approve
        if (e.relatedTarget || e.currentTarget.isConnected) rowFocused.current = false;
      }}
    >
      <span className="ui-ap__mark" aria-hidden="true">
        <svg viewBox="0 0 16 16">
          {status === "approved" ? (
            <path d="M4.2 8.4 6.9 11 11.8 5.6" pathLength={1} />
          ) : (
            <path d="M5.2 5.2 10.8 10.8M10.8 5.2 5.2 10.8" pathLength={1} />
          )}
        </svg>
      </span>
      <span className="ui-ap__row-title" id={rowTitleId}>
        {title}
      </span>
      <span className="ui-ap__row-status">
        {resolvedLabel}
        {status === "approved" && always && <span className="ui-ap__row-extra"> · Always</span>}
        {decidedAt !== null && <span className="ui-ap__row-time"> · {ago(decidedAt, now)}</span>}
      </span>
    </div>
  );
}

type PendingProps = {
  leaving: boolean;
  entering: boolean;
  onSettled: () => void;
  icon?: ReactNode;
  title: ReactNode;
  titleId: string;
  description?: ReactNode;
  descId: string;
  risk?: ApprovalRisk;
  body: ReactNode;
  details?: ApprovalDetail[];
  alwaysBox: ReactNode;
  foot: ReactNode;
  actions: "tray" | "card";
  total: number;
  timerOff: boolean;
  secondsLeft: number;
  timerId: string;
  timerSrRef: ElRef<HTMLSpanElement>;
};

/** The request: what the agent wants to do, with the decision below it – it fades out when decided */
function Pending({ leaving, entering, onSettled, icon, title, titleId, description, descId, risk, body, details, alwaysBox, foot, actions, total, timerOff, secondsLeft, timerId, timerSrRef }: PendingProps) {
  return (
    <div
      className="ui-ap__pending"
      data-leaving={leaving || undefined}
      data-entering={entering || undefined}
      inert={leaving}
      aria-hidden={leaving || undefined}
      onAnimationEnd={(e) => {
        if (e.target !== e.currentTarget) return;
        onSettled();
      }}
    >
      <div className="ui-ap__card">
        <div className="ui-ap__head">
          <span className="ui-ap__icon" aria-hidden="true">
            {icon ?? (
              <svg viewBox="0 0 24 24">
                <path d="M12 3 5 5.8v5.4c0 4.3 2.9 8.2 7 9.8 4.1-1.6 7-5.5 7-9.8V5.8L12 3Z" />
                <path d="m9.2 12.2 2 2 3.8-4" />
              </svg>
            )}
          </span>
          <div className="ui-ap__titles">
            <h3 className="ui-ap__title" id={leaving ? undefined : titleId}>
              {title}
            </h3>
            {description && (
              <p className="ui-ap__desc" id={leaving ? undefined : descId}>
                {description}
              </p>
            )}
          </div>
          {risk && (
            <span className="ui-ap__risk" data-risk={risk}>
              <span className="ui-ap__risk-dot" aria-hidden="true" />
              {RISK_LABEL[risk]}
              <span className="ui-ap__risk-word"> risk</span>
            </span>
          )}
        </div>

        {(body || details?.length) && (
          <div className="ui-ap__preview">
            {body && <div className="ui-ap__custom">{body}</div>}
            {details?.length ? (
              <dl className="ui-ap__details">
                {details.map((d, i) => (
                  <div className="ui-ap__detail" key={d.label + i}>
                    <dt>{d.label}</dt>
                    <dd>{d.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        )}

        {alwaysBox}
        {actions === "card" && foot}
      </div>

      {actions === "tray" && foot}

      {total > 0 && !timerOff && (
        <span ref={timerSrRef} className="ui-ap__sr" id={leaving ? undefined : timerId}>
          {timerText(secondsLeft)}
        </span>
      )}
    </div>
  );
}

export function ApprovalCard({
  look,
  title,
  description,
  risk,
  icon,
  details,
  preview,
  children,
  status: statusProp,
  defaultStatus = "pending",
  onStatusChange,
  onApprove,
  errorLabel = "Couldn't approve. Try again.",
  onDeny,
  onEdit,
  expiresIn,
  onExpire,
  allowStopTimer = true,
  stopTimerLabel = "Stop",
  allowAlways = true,
  alwaysLabel = "Always allow this action",
  approveLabel = "Approve",
  denyLabel = "Deny",
  editLabel = "Edit",
  shortcuts = true,
  label,
  actions: actionsProp,
  className,
  ref,
  ...rest
}: ApprovalCardProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const actions = actionsProp ?? (resolvedLook === "clean" ? "card" : "tray");
  // Clean puts the checkbox in the bottom row with the buttons when they sit inside the card
  const alwaysInFoot = resolvedLook === "clean" && actions === "card";
  const id = useId();
  // A parent that controls `status` may follow onApprove/onDeny instead of onStatusChange – the status can change then too
  const [status, setStatus] = useControllable(statusProp, defaultStatus, onStatusChange ?? (onApprove || onDeny ? () => {} : undefined), "status");
  const resolved = status !== "pending";

  const [always, setAlways] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reason, setReason] = useState<DenyReason>("user");
  // When the card was decided – read from the clock after commit, never during render
  const [decidedAt, setDecidedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [announce, setAnnounce] = useState("");
  const [hover, setHover] = useState(false);
  const [focusIn, setFocusIn] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [timerOff, setTimerOff] = useState(false);
  const [mod, setMod] = useState("⌘");

  // Status changes are handled during render, so the leaving view and the new one animate in the same frame
  const [prev, setPrev] = useState(status);
  const [leaving, setLeaving] = useState(false);
  const [entering, setEntering] = useState(false);
  if (prev !== status) {
    setPrev(status);
    if (status === "pending") {
      setLeaving(false);
      setEntering(true);
      setAlways(false);
      setBusy(false);
      setFailed(false);
      setReason("user");
      setDecidedAt(null);
      setAnnounce("");
      setTimerOff(false);
    } else {
      setLeaving(prev === "pending");
      setEntering(false);
      setFailed(false);
      setDecidedAt(null);
      setAnnounce(`${status === "approved" ? "Approved" : reason === "timeout" ? "Expired" : "Denied"}: ${title}`);
    }
  }

  const root = useRef<HTMLDivElement | null>(null);
  const setRoot = useRootRef(root, ref);
  const row = useRef<HTMLDivElement>(null);
  const approveBtn = useRef<HTMLButtonElement>(null);
  const rowFocused = useRef(false);

  // ⌘ on Apple devices, Ctrl elsewhere
  useEffect(() => {
    const p = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform;
    if (!/mac|iphone|ipad|ipod/i.test(p || navigator.userAgent)) setMod("Ctrl");
  }, []);

  /* ---------- Decisions ---------- */

  // An onApprove promise can settle after the card is gone – nothing is set then
  const alive = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const approve = async () => {
    if (resolved || busy) return;
    setFailed(false);
    let result: void | Promise<unknown>;
    try {
      result = onApprove?.({ always });
    } catch {
      setFailed(true);
      return;
    }
    if (result && typeof (result as Promise<unknown>).then === "function") {
      setBusy(true);
      try {
        await result;
      } catch {
        // Stays pending and says so; Approve can be pressed again
        if (alive.current) {
          setBusy(false);
          setFailed(true);
        }
        return;
      }
      if (!alive.current) return;
      setBusy(false);
    }
    setStatus("approved");
  };

  const deny = (why: DenyReason = "user") => {
    if (resolved || (busy && why === "user")) return;
    setReason(why);
    setFailed(false);
    if (why === "timeout") onExpire?.();
    onDeny?.({ reason: why });
    setStatus("denied");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    rest.onKeyDown?.(e);
    if (resolved || busy || e.defaultPrevented || e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void approve();
    } else if (e.key === "Escape" && !ownsEscape(e.target as Element)) {
      e.preventDefault();
      deny("user");
    }
  };

  /* ---------- Countdown ---------- */

  const total = expiresIn && expiresIn > 0 ? expiresIn * 1000 : 0;
  const paused = hover || focusIn || busy || hidden;
  const { expiresRef, timerSrRef, warnRef } = useCountdown(total, status, resolved, paused, timerOff, `20 seconds left to decide: ${title}. Stop the timer to keep it open.`, () => deny("timeout"));

  // A hidden tab doesn't eat the time
  useEffect(() => {
    if (!total) return;
    const sync = () => setHidden(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, [total]);

  const stopTimer = () => {
    // The button goes away with the countdown – focus moves on to Approve first
    rescueFocus(root.current?.querySelector(".ui-ap__stop"), [approveBtn.current]);
    setTimerOff(true);
  };

  // Safety net: focus never drops to <body> when a focused control inside the card goes away
  useFocusRescue(root, { fallback: () => (resolved ? row.current : approveBtn.current) });

  /* ---------- Height morph ---------- */

  useHeightMorph(root, row, approveBtn, rowFocused, resolved);

  // The decision time is stamped after commit; "just now" turns into "2 min ago" over time
  useEffect(() => {
    if (!resolved) return;
    const at = Date.now();
    setDecidedAt(at);
    setNow(at);
    const t = window.setInterval(() => setNow((n) => n + 30000), 30000);
    return () => window.clearInterval(t);
  }, [resolved, status]);

  /* ---------- Render ---------- */

  const titleId = `${id}-title`;
  const rowTitleId = `${id}-row`;
  const descId = `${id}-desc`;
  const timerId = `${id}-timer`;
  const body = preview ?? children;
  const resolvedLabel =
    status === "approved" ? "Approved" : reason === "timeout" ? "Expired" : "Denied";
  const secondsLeft = Math.ceil(total / 1000);
  const describedBy = [rest["aria-describedby"], description ? descId : null, total && !resolved && !timerOff ? timerId : null].filter(Boolean).join(" ");

  const alwaysBox = allowAlways && <AlwaysAllow checked={always} disabled={busy} label={alwaysLabel} onChange={setAlways} />;

  const foot = (
    <Foot
      failed={failed}
      errorLabel={errorLabel}
      alwaysBox={alwaysInFoot && alwaysBox}
      total={total}
      secondsLeft={secondsLeft}
      paused={paused}
      timerOff={timerOff}
      stopTimer={allowStopTimer ? stopTimer : undefined}
      stopTimerLabel={stopTimerLabel}
      timerId={timerId}
      expiresRef={expiresRef}
      approveBtn={approveBtn}
      busy={busy}
      shortcuts={shortcuts}
      mod={mod}
      onEdit={onEdit}
      editLabel={editLabel}
      denyLabel={denyLabel}
      approveLabel={approveLabel}
      approve={approve}
      deny={deny}
    />
  );

  return (
    <div
      role="group"
      aria-labelledby={resolved ? rowTitleId : titleId}
      {...rest}
      ref={setRoot}
      className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
      data-look={resolvedLook}
      aria-describedby={describedBy || undefined}
      aria-busy={busy || undefined}
      data-status={status}
      data-busy={busy || undefined}
      data-label={label ? "" : undefined}
      data-actions={actions}
      onKeyDown={onKeyDown}
      onPointerEnter={(e) => {
        rest.onPointerEnter?.(e);
        setHover(true);
      }}
      onPointerLeave={(e) => {
        rest.onPointerLeave?.(e);
        setHover(false);
      }}
      onFocus={(e) => {
        rest.onFocus?.(e);
        setFocusIn(true);
      }}
      onBlur={(e) => {
        rest.onBlur?.(e);
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusIn(false);
      }}
    >
      {/* React 19 hoists this into <head> once, no matter how many cards render */}
      <style href="ui-approval-card" precedence="default">
        {css}
      </style>

      {/* The label sits on the gray tray, above the card */}
      {label && <div className="ui-ap__label">{label}</div>}

      {(!resolved || leaving) && (
        <Pending
          leaving={leaving}
          entering={entering}
          onSettled={() => {
            if (leaving) setLeaving(false);
            if (entering) setEntering(false);
          }}
          icon={icon}
          title={title}
          titleId={titleId}
          description={description}
          descId={descId}
          risk={risk}
          body={body}
          details={details}
          alwaysBox={!alwaysInFoot && alwaysBox}
          foot={foot}
          actions={actions}
          total={total}
          timerOff={timerOff}
          secondsLeft={secondsLeft}
          timerId={timerId}
          timerSrRef={timerSrRef}
        />
      )}

      {resolved && (
        <ResolvedRow
          row={row}
          rowFocused={rowFocused}
          status={status}
          title={title}
          rowTitleId={rowTitleId}
          resolvedLabel={resolvedLabel}
          always={always}
          decidedAt={decidedAt}
          now={now}
        />
      )}

      <span className="ui-ap__sr" role="status" aria-live="polite">
        {announce}
      </span>
      {/* The countdown's one warning – written straight into the DOM, so the card doesn't re-render for it */}
      <span ref={warnRef} className="ui-ap__sr" role="status" aria-live="polite" />
    </div>
  );
}

/** Escape belongs to the content it was pressed in (a field or menu inside the preview), not to Deny */
const ownsEscape = (el: Element | null) => !!el?.closest?.(".ui-ap__custom, .ui-ap__details, textarea, select, [contenteditable=''], [contenteditable='true'], input:not([type='checkbox'])");

const timerText = (s: number) => `Expires in ${s} seconds unless approved. The timer pauses while the card is hovered or focused.`;

/** 0:42, 2:05 */
function clock(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** just now, 4 min ago, 2 h ago */
function ago(t: number, now: number) {
  const s = Math.floor((now - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  return `${Math.floor(s / 3600)} h ago`;
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
.ui-ap:where([data-look="standard"]),
.ui-ap__portal:where([data-look="standard"]) {
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
  --_tc-border-control: light-dark(#858585, #7c7c82);
  --_tc-border-control-hover: light-dark(#646464, #9a9aa1);
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
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
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-strong: 600;
  --_tc-hairline: 1px;
  --_tc-kbd-bg: light-dark(#ffffff, #19191b);
  --_tc-kbd-fg: light-dark(#404040, #c8c8cc);
  --_tc-kbd-font-size: 10.5px;
  --_tc-kbd-font-weight: 500;
  --_tc-kbd-h: 18px;
  --_tc-kbd-on-inverse-bg: light-dark(rgba(255, 255, 255, 0.16), rgba(0, 0, 0, 0.1));
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
  --_tc-radius-lg: 10px;
  --_tc-radius-xs: 4px;
  --_tc-status-danger-bg: light-dark(#fdecea, #3b1714);
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-bg: light-dark(#e6f6ec, #12301f);
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-warning-bg: light-dark(#fff3e0, #3a2410);
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-surface-control: light-dark(#ffffff, #232326);
  --_tc-surface-inverse: light-dark(#171717, #ededed);
  --_tc-surface-on-tray: light-dark(#ffffff, #232326);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-surface-tray: light-dark(#f0f0f0, #19191b);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-on-inverse: light-dark(#ffffff, #111113);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(16px + 4px);
}
.ui-ap:where([data-look="clean"]),
.ui-ap__portal:where([data-look="clean"]) {
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
  --_tc-border-control: light-dark(rgba(0, 0, 0, 0.48), rgba(255, 255, 255, 0.4));
  --_tc-border-control-hover: light-dark(rgba(0, 0, 0, 0.6), rgba(255, 255, 255, 0.52));
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
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
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-quick: 120ms;
  --_tc-duration-shimmer: 1600ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-duration-slowest: 560ms;
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-focus-ring-width: 2px;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-sm: 12px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-strong: 500;
  --_tc-hairline: 0.5px;
  --_tc-kbd-bg: light-dark(#ffffff, #1c1c1e);
  --_tc-kbd-fg: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-kbd-font-size: 10px;
  --_tc-kbd-font-weight: 500;
  --_tc-kbd-h: 16px;
  --_tc-kbd-on-inverse-bg: light-dark(rgba(255, 255, 255, 0.16), rgba(0, 0, 0, 0.1));
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
  --_tc-radius-lg: 10px;
  --_tc-radius-xs: 4px;
  --_tc-status-danger-bg: light-dark(rgba(245, 43, 0, 0.094), rgba(255, 53, 35, 0.17));
  --_tc-status-danger-fg: light-dark(#c2331f, #ff977d);
  --_tc-status-success-bg: light-dark(rgba(0, 164, 51, 0.1), rgba(0, 240, 74, 0.12));
  --_tc-status-success-fg: light-dark(#18794e, #3dd68c);
  --_tc-status-warning-bg: light-dark(rgba(255, 156, 0, 0.16), rgba(251, 106, 0, 0.15));
  --_tc-status-warning-fg: light-dark(#a35200, #ffa057);
  --_tc-surface-control: light-dark(#ffffff, #252527);
  --_tc-surface-inverse: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.92));
  --_tc-surface-on-tray: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-surface-tray: light-dark(#f7f7f7, #161618);
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-on-inverse: light-dark(#fcfcfc, #161618);
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-tray-inset: 4px;
  --_tc-tray-radius: calc(10px + 4px);
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

/* Colors and motion as variables – override them on .ui-ap. The card sits on the gray tray (Standard, and Clean
   with actions="tray"); Clean's default actions="card" drops the tray. */
.ui-ap {
  --tc-approval-card-icon-bg: light-dark(#f4f4f4, #1f1f22);
  /* The shortcut chip's text inside the ink primary button */
  --tc-approval-card-primary-kbd-fg: light-dark(rgba(255, 255, 255, 0.72), rgba(25, 25, 27, 0.6));
  --tc-approval-card-spin: 800ms;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  container-type: inline-size;
  padding: var(--tc-tray-inset, var(--_tc-tray-inset));
  border-radius: var(--tc-tray-radius, var(--_tc-tray-radius));
  background: var(--tc-surface-tray, var(--_tc-surface-tray));
  color: var(--tc-text-muted, var(--_tc-text-muted));
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug));
  letter-spacing: -0.006em;
  text-align: left;
  -webkit-font-smoothing: antialiased;
  transition: height var(--tc-duration-slowest, var(--_tc-duration-slowest)) var(--tc-ease-move, var(--_tc-ease-move));
}
.ui-ap *,
.ui-ap *::before,
.ui-ap *::after {
  box-sizing: border-box;
}
/* The white card – the pending request and the resolved row both live in one */
.ui-ap__card {
  position: relative;
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  background: var(--tc-surface-on-tray, var(--_tc-surface-on-tray));
  box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow));
}
/* ---------- Pending ---------- */
.ui-ap__pending > .ui-ap__card {
  padding: 16px;
}
.ui-ap__pending[data-leaving] {
  position: absolute;
  top: var(--tc-tray-inset, var(--_tc-tray-inset));
  left: var(--tc-tray-inset, var(--_tc-tray-inset));
  right: var(--tc-tray-inset, var(--_tc-tray-inset));
  pointer-events: none;
  animation: ui-ap-out var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move)) both;
}
.ui-ap__pending[data-entering] {
  animation: ui-ap-in var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-instant, var(--_tc-duration-instant)) both;
}
.ui-ap[data-busy] .ui-ap__pending {
  pointer-events: none;
}
.ui-ap__head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: start;
  gap: 12px;
}
.ui-ap__icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg));
  background: var(--tc-approval-card-icon-bg);
  box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-border-default, var(--_tc-border-default));
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
:where([data-look="clean"], [data-look="clean"] *).ui-ap__icon {
  background: transparent;
}
.ui-ap__icon svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.ui-ap__titles {
  min-width: 0;
  padding-top: 1px;
}
.ui-ap__title {
  margin: 0;
  overflow: hidden;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  font-weight: var(--tc-font-weight-strong, var(--_tc-font-weight-strong));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  letter-spacing: -0.011em;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ui-ap__desc {
  margin: 1px 0 0;
  overflow: hidden;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-snug, var(--_tc-line-height-snug));
  white-space: nowrap;
  text-overflow: ellipsis;
}
/* The risk badge: a status pill with its dot in both looks */
.ui-ap__risk {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: var(--tc-pill-h-lg, var(--_tc-pill-h-lg));
  margin-top: 1px;
  padding: 0 var(--tc-pill-px-lg, var(--_tc-pill-px-lg));
  border-radius: var(--tc-pill-radius, var(--_tc-pill-radius));
  background: var(--tc-fill-default, var(--_tc-fill-default));
  color: var(--tc-text-muted, var(--_tc-text-muted));
  font-size: var(--tc-pill-font-size-lg, var(--_tc-pill-font-size-lg));
  font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight));
  line-height: var(--tc-line-height-none, var(--_tc-line-height-none));
  white-space: nowrap;
}
.ui-ap__risk-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.ui-ap__risk-word {
  white-space: pre;
}
.ui-ap__risk[data-risk="medium"] {
  background: var(--tc-status-warning-bg, var(--_tc-status-warning-bg));
  color: var(--tc-status-warning-fg, var(--_tc-status-warning-fg));
}
.ui-ap__risk[data-risk="high"] {
  background: var(--tc-status-danger-bg, var(--_tc-status-danger-bg));
  color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg));
}
/* Preview: custom content and key-value rows in one soft panel */
:where([data-look="standard"], [data-look="standard"] *).ui-ap__preview {
  display: grid;
  gap: 12px;
  margin-top: 14px;
  padding: 12px;
  border-radius: var(--tc-radius-lg, var(--_tc-radius-lg));
  background: var(--tc-fill-subtle, var(--_tc-fill-subtle));
  box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-border-default, var(--_tc-border-default));
}
/* Preview: custom content and key-value rows, plain on the card under one hairline – no second gray panel */
:where([data-look="clean"], [data-look="clean"] *).ui-ap__preview {
  display: grid;
  gap: 12px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
}
.ui-ap__custom {
  min-width: 0;
}
:where([data-look="standard"], [data-look="standard"] *).ui-ap__custom + .ui-ap__details {
  padding-top: 12px;
  border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider));
}
:where([data-look="clean"], [data-look="clean"] *).ui-ap__custom + .ui-ap__details {
  padding-top: 2px;
}
.ui-ap__details {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 6px 16px;
  margin: 0;
}
.ui-ap__detail {
  display: contents;
}
.ui-ap__detail dt {
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
.ui-ap__detail dd {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  white-space: nowrap;
  text-overflow: ellipsis;
}
/* "Always allow" closes the card */
.ui-ap__always {
  display: flex;
  width: fit-content;
  max-width: 100%;
  margin-top: 14px;
  align-items: center;
  gap: 8px;
  min-width: 0;
  cursor: pointer;
  user-select: none;
}
.ui-ap__always-label {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ui-ap__box {
  position: relative;
  display: grid;
  flex: none;
  width: 16px;
  height: 16px;
}
/* The checkbox's edge is its only cue: --tc-border-control (≥ 3:1) */
.ui-ap__box input {
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  margin: 0;
  border-radius: var(--tc-radius-xs, var(--_tc-radius-xs));
  background: var(--tc-surface-control, var(--_tc-surface-control));
  box-shadow: inset 0 0 0 1px var(--tc-border-control, var(--_tc-border-control));
  cursor: pointer;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-ap__box input:hover {
  box-shadow: inset 0 0 0 1px var(--tc-border-control-hover, var(--_tc-border-control-hover));
}
.ui-ap__box input:checked {
  background: var(--tc-surface-inverse, var(--_tc-surface-inverse));
  box-shadow: inset 0 0 0 1px var(--tc-surface-inverse, var(--_tc-surface-inverse));
}
.ui-ap__box input:focus-visible {
  outline: var(--tc-focus-outline, var(--_tc-focus-outline));
  outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset));
}
.ui-ap__box svg {
  position: absolute;
  inset: 0;
  width: 16px;
  height: 16px;
  fill: none;
  stroke: var(--tc-text-on-inverse, var(--_tc-text-on-inverse));
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0;
  transform: scale(0.6);
  transition: opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-move, var(--_tc-ease-move));
  pointer-events: none;
}
.ui-ap__box input:checked + svg {
  opacity: 1;
  transform: none;
}
/* Optional label on the gray tray above the card */
.ui-ap__label {
  overflow: hidden;
  padding: 6px 8px 4px;
  color: var(--tc-text-muted, var(--_tc-text-muted));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  line-height: var(--tc-line-height-tight, var(--_tc-line-height-tight));
  white-space: nowrap;
  text-overflow: ellipsis;
}
/* The leaving request is laid over the resolved row – below the label when there is one */
.ui-ap[data-label] .ui-ap__pending[data-leaving] { top: 30px; }
/* actions="card": the buttons close the white card instead of sitting on the tray */
:where([data-look="standard"], [data-look="standard"] *).ui-ap__card > .ui-ap__foot { min-height: 0; margin-top: 14px; padding: 0; }
/* actions="card" (the default): one clean white card – no gray tray around it, the decision is its last row */
:where([data-look="clean"], [data-look="clean"] *).ui-ap[data-actions="card"] { padding: 0; border-radius: var(--tc-card-radius, var(--_tc-card-radius)); background: transparent; }
:where([data-look="clean"], [data-look="clean"] *).ui-ap[data-actions="card"] .ui-ap__card { background: var(--tc-surface-raised, var(--_tc-surface-raised)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ap[data-actions="card"] .ui-ap__pending[data-leaving] { top: 0; left: 0; right: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-ap[data-actions="card"][data-label] .ui-ap__pending[data-leaving] { top: 26px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ap[data-actions="card"] .ui-ap__label { padding-left: 2px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ap__card > .ui-ap__foot { min-height: 0; margin-top: 16px; padding: 14px 0 0; border-top: var(--tc-hairline, var(--_tc-hairline)) solid var(--tc-divider, var(--_tc-divider)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ap__card > .ui-ap__foot .ui-ap__always { margin-top: 0; }
/* The tray below the card: countdown on the left, buttons on the right */
.ui-ap__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 12px;
  min-height: 44px;
  padding: 6px 2px 2px 10px;
}
.ui-ap__timer {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.ui-ap__expires {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: var(--tc-text-muted, var(--_tc-text-muted));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  transition: color var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-ap__expires svg {
  width: 14px;
  height: 14px;
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.ui-ap__expires[data-low] {
  color: var(--tc-status-warning-fg, var(--_tc-status-warning-fg));
}
.ui-ap__error {
  flex: 1 1 100%;
  order: 1;
  margin: 0;
  color: var(--tc-status-danger-fg, var(--_tc-status-danger-fg));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
}
.ui-ap__actions {
  display: flex;
  flex: 0 0 auto;
  gap: 4px;
  margin-left: auto;
}
/* Buttons: the control pattern, primary/secondary/ghost exactly like Button */
.ui-ap__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md));
  border: 0;
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  font: inherit;
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size));
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
  line-height: var(--tc-line-height-none, var(--_tc-line-height-none));
  white-space: nowrap;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
.ui-ap__btn:active {
  transform: scale(0.97);
}
.ui-ap__btn:focus-visible {
  outline: var(--tc-focus-outline, var(--_tc-focus-outline));
  outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset));
}
.ui-ap__btn--primary {
  padding-right: 8px;
  background: var(--tc-action-primary-bg, var(--_tc-action-primary-bg));
  color: var(--tc-action-primary-fg, var(--_tc-action-primary-fg));
  box-shadow: var(--tc-action-primary-shadow, var(--_tc-action-primary-shadow));
}
.ui-ap__btn--primary:hover {
  background: var(--tc-action-primary-bg-hover, var(--_tc-action-primary-bg-hover));
}
.ui-ap__btn--primary:active {
  background: var(--tc-action-primary-bg-active, var(--_tc-action-primary-bg-active));
}
/* Deny – Standard: quiet on the tray, a soft fill on hover; Clean: the secondary button */
.ui-ap__btn--quiet {
  padding-right: 8px;
  background: transparent;
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
.ui-ap__btn--quiet:hover {
  background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover));
}
:where([data-look="clean"], [data-look="clean"] *).ui-ap__btn--quiet {
  background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg));
  color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg));
  box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow));
}
:where([data-look="clean"], [data-look="clean"] *).ui-ap__btn--quiet:hover {
  background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg));
  box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover));
}
.ui-ap__btn--ghost {
  background: transparent;
  color: var(--tc-action-ghost-fg, var(--_tc-action-ghost-fg));
}
.ui-ap__btn--ghost:hover {
  background: var(--tc-action-ghost-bg-hover, var(--_tc-action-ghost-bg-hover));
  color: var(--tc-text-primary, var(--_tc-text-primary));
}
/* "Stop": a small ghost button next to the countdown */
.ui-ap__stop {
  height: var(--tc-control-h-sm, var(--_tc-control-h-sm));
  padding: 0 6px;
  border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm));
  font-size: var(--tc-font-size-sm, var(--_tc-font-size-sm));
}
.ui-ap[data-busy] .ui-ap__btn:not(.ui-ap__approve),
.ui-ap[data-busy] .ui-ap__always {
  opacity: 0.5;
}
.ui-ap[data-busy] .ui-ap__approve {
  cursor: progress;
}
.ui-ap__kbd {
  display: inline-grid;
  place-items: center;
  min-width: var(--tc-kbd-h, var(--_tc-kbd-h));
  height: var(--tc-kbd-h, var(--_tc-kbd-h));
  padding: 0 var(--tc-kbd-px, var(--_tc-kbd-px));
  border-radius: var(--tc-kbd-radius, var(--_tc-kbd-radius));
  background: var(--tc-kbd-bg, var(--_tc-kbd-bg));
  box-shadow: var(--tc-kbd-shadow, var(--_tc-kbd-shadow));
  color: var(--tc-kbd-fg, var(--_tc-kbd-fg));
  font: inherit;
  font-size: var(--tc-kbd-font-size, var(--_tc-kbd-font-size));
  font-weight: var(--tc-kbd-font-weight, var(--_tc-kbd-font-weight));
  line-height: var(--tc-line-height-none, var(--_tc-line-height-none));
}
.ui-ap__btn--primary .ui-ap__kbd {
  background: var(--tc-kbd-on-inverse-bg, var(--_tc-kbd-on-inverse-bg));
  box-shadow: none;
  color: var(--tc-approval-card-primary-kbd-fg);
}
.ui-ap__spinner {
  width: 20px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-dasharray: 26 38;
  transform-origin: 50% 50%;
  animation: ui-ap-spin var(--tc-approval-card-spin) linear infinite;
}
/* ---------- Resolved row ---------- */
.ui-ap__resolved {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 12px 14px;
  animation: ui-ap-in var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-quick, var(--_tc-duration-quick)) both;
}
.ui-ap__resolved:focus-visible {
  outline: var(--tc-focus-outline, var(--_tc-focus-outline));
  outline-offset: calc(-1 * var(--tc-focus-ring-width, var(--_tc-focus-ring-width)));
}
.ui-ap__mark {
  display: grid;
  flex: none;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--tc-status-success-bg, var(--_tc-status-success-bg));
  color: var(--tc-status-success-fg, var(--_tc-status-success-fg));
  animation: ui-ap-pop var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-fast, var(--_tc-duration-fast)) both;
}
.ui-ap__resolved[data-status="denied"] .ui-ap__mark {
  background: var(--tc-fill-default, var(--_tc-fill-default));
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
.ui-ap__mark svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.ui-ap__mark path {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: ui-ap-draw var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)) var(--tc-duration-slow, var(--_tc-duration-slow)) forwards;
}
.ui-ap__row-title {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  color: var(--tc-text-primary, var(--_tc-text-primary));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ui-ap__row-status {
  flex: none;
  color: var(--tc-text-muted, var(--_tc-text-muted));
  white-space: nowrap;
}
.ui-ap__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}
/* Narrow cards: buttons share the full width, the hints go */
@container (max-width: 400px) {
  .ui-ap__actions {
    flex: 1 1 100%;
    margin-left: 0;
  }
  .ui-ap__foot {
    padding-left: 2px;
  }
  .ui-ap__timer {
    padding-left: 8px;
  }
  .ui-ap__actions .ui-ap__btn {
    flex: 1 1 0;
    min-width: 0;
    padding: 0 10px;
  }
  .ui-ap__kbd {
    display: none;
  }
}
@container (max-width: 340px) {
  .ui-ap__pending > .ui-ap__card { padding: 14px; }
  .ui-ap__head { gap: 10px; }
  .ui-ap__risk-word { display: none; }
  .ui-ap__row-time { display: none; }
  .ui-ap__details { column-gap: 12px; }
}
/* Touch screens have no shortcuts */
@media (hover: none) {
  .ui-ap__kbd { display: none; }
}
@keyframes ui-ap-out {
  to { opacity: 0; transform: translateY(-6px) scale(0.985); filter: blur(2px); }
}
@keyframes ui-ap-in {
  from { opacity: 0; transform: translateY(4px); filter: blur(2px); }
  to { opacity: 1; transform: none; filter: none; }
}
@keyframes ui-ap-pop {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: none; }
}
@keyframes ui-ap-draw {
  to { stroke-dashoffset: 0; }
}
@keyframes ui-ap-spin {
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .ui-ap,
  .ui-ap *,
  .ui-ap *::before,
  .ui-ap *::after {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    transition-duration: 1ms !important;
  }
  .ui-ap__spinner { animation: ui-ap-spin var(--tc-duration-shimmer, var(--_tc-duration-shimmer)) linear infinite !important; }
  .ui-ap__mark path { stroke-dashoffset: 0; }
}
`;
