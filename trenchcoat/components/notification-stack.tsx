"use client";

/*
 * Notification Stack – notices stacked behind each other, in a single self-contained file.
 * Only the front card can be read; the others peek out below it. Dismissing the front card slides it away and
 * the next one moves up – one notice at a time.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: notification-stack.tsx is Standard,
 * notification-stack-clean.tsx is Clean). Clean draws one white card per notice with hairline shadows instead of
 * borders, Inter at 13/15px, quiet line art and thinner icons.
 */
// Generated from src/components/notification-stack.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type Ref, type RefObject } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-ns";

export type NoticePattern = "orbit" | "grid" | "rays";

export type Notice = {
  id: string;
  /** Small label in the pill, e.g. "Notice" */
  badge?: string;
  title: string;
  text: string;
  action?: { label: string; href?: string; onClick?: () => void; external?: boolean };
  /** Line art in the top-right corner */
  pattern?: NoticePattern;
};

type NotificationStackOwnProps = {
  /**
   * The notices to show, front first. The stack follows this prop: a notice the user dismissed stays hidden while it
   * is still in the list, so you can either drop it in `onDismiss` or leave the list alone. A notice that leaves the
   * list and comes back later shows again.
   */
  notices: Notice[];
  /** Called after a notice was dismissed */
  onDismiss?: (notice: Notice) => void;
  className?: string;
  /** Visual style. Defaults to the file's look: Standard in notification-stack.tsx, Clean in notification-stack-clean.tsx */
  look?: Look;
  ref?: Ref<HTMLElement>;
};

export type NotificationStackProps = Omit<ComponentPropsWithoutRef<"section">, keyof NotificationStackOwnProps> &
  NotificationStackOwnProps;

const PEEK = 12; // how far each card behind peeks out below the one in front, in px
const EXIT_MS = 320;

export function NotificationStack({ notices, onDismiss, className, look, ref, style, ...rest }: NotificationStackProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  // Ids the user dismissed – hidden while the prop still lists them
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(() => new Set());
  // Cards sliding away, kept here so they can finish their exit even if the parent already dropped them
  const [leaving, setLeaving] = useState<Notice[]>([]);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const refs = useRef(new Map<string, HTMLElement>());
  const root = useRef<HTMLElement>(null);
  const setRoot = useRootRef(root, ref);
  // Dismiss makes the focused card inert: focus moves to the next card's dismiss button, or the stack itself
  useFocusRescue(root, { fallback: () => root.current?.querySelector<HTMLElement>('.ui-ns__card[data-depth="0"] .ui-ns__close') });
  // Dismissed from the keyboard: once the next card is in front, its dismiss button takes focus
  const refocus = useRef(false);
  useLayoutEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    rescueFocus(root.current, ['.ui-ns__card[data-depth="0"] .ui-ns__close'], root.current ?? document);
  });
  // One persistent status line for dismissals
  const [status, setStatus] = useState("");
  const timers = useRef(new Set<number>());

  const leavingIds = new Set(leaving.map((n) => n.id));
  const visible = notices.filter((n) => !dismissed.has(n.id) && !leavingIds.has(n.id));
  // The leaving card was the front one, so it stays on top while it slides away
  const items = [...leaving, ...visible];
  const itemsKey = items.map((n) => n.id).join("\u0000");
  const behind = Math.min(visible.length - 1, 2);

  // Forget dismissals of notices the parent no longer lists, so a notice that comes back shows again
  const noticeKey = notices.map((n) => n.id).join("\u0000");
  useEffect(() => {
    const ids = new Set(noticeKey.split("\u0000"));
    setDismissed((d) => ([...d].every((id) => ids.has(id)) ? d : new Set([...d].filter((id) => ids.has(id)))));
  }, [noticeKey]);

  // No exit timer outlives the stack
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, []);

  // The front card's height sets the height of the stack
  useLayoutEffect(() => {
    // Reads every card first, then sets state once – and only when a height actually changed (the observer's
    // first report repeats what was just measured)
    const measure = () => {
      const next: Record<string, number> = {};
      refs.current.forEach((el, id) => (next[id] = el.offsetHeight));
      setHeights((prev) => {
        const keys = Object.keys(next);
        return keys.length === Object.keys(prev).length && keys.every((k) => prev[k] === next[k]) ? prev : next;
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    refs.current.forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  }, [itemsKey]);

  const dismiss = (notice: Notice) => {
    const left = visible.filter((n) => n.id !== notice.id).length;
    refocus.current = Boolean(root.current?.contains(document.activeElement));
    setStatus(`Dismissed ${notice.title}. ${left ? `${left} more ${left === 1 ? "notice" : "notices"}.` : "No more notices."}`);
    setDismissed((d) => new Set(d).add(notice.id));
    setLeaving((l) => (l.some((n) => n.id === notice.id) ? l : [notice, ...l]));
    onDismiss?.(notice);
    const t = window.setTimeout(() => {
      timers.current.delete(t);
      setLeaving((l) => l.filter((n) => n.id !== notice.id));
    }, EXIT_MS);
    timers.current.add(t);
  };

  const front = visible[0] ? heights[visible[0].id] ?? 0 : 0;

  return (
    <>
      <style href="ui-notification-stack" precedence="default">
        {css}
      </style>
      <section
        aria-label="Notifications"
        {...rest}
        ref={setRoot}
        className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
        data-look={resolvedLook}
        style={{ ...style, height: visible.length ? front + behind * PEEK : 0 }}
      >
        {items.map((notice) => {
          const i = visible.findIndex((n) => n.id === notice.id);
          const gone = i === -1;
          const depth = Math.max(0, i);
          const isBehind = !gone && depth > 0;
          // Cards behind are lined up on the front card's bottom edge, a little lower and smaller each
          const y = gone || depth === 0 ? 0 : front - (heights[notice.id] ?? front) + Math.min(depth, 2) * PEEK;
          const scale = gone ? 1 : 1 - Math.min(depth, 2) * 0.05;
          return (
            <article
              key={notice.id}
              ref={(el) => {
                if (el) refs.current.set(notice.id, el);
                else refs.current.delete(notice.id);
              }}
              className="ui-ns__card"
              data-depth={gone ? undefined : depth}
              data-leaving={gone || undefined}
              aria-label={depth === 0 && !gone && visible.length > 1 ? `${notice.title}, 1 of ${visible.length}` : notice.title}
              aria-hidden={isBehind || undefined}
              inert={isBehind || gone}
              style={{
                zIndex: gone ? 10 : 10 - depth,
                transform: gone ? undefined : `translateY(${y}px) scale(${scale})`,
                opacity: depth > 2 ? 0 : undefined,
              }}
            >
              <Pattern kind={notice.pattern ?? "orbit"} />
              <div className="ui-ns__body">
                <div className="ui-ns__top">
                  {notice.badge ? <span className="ui-ns__badge">{notice.badge}</span> : <span />}
                  <button
                    type="button"
                    className="ui-ns__close"
                    aria-label={`Dismiss ${notice.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      dismiss(notice);
                    }}
                  >
                    <CloseIcon look={resolvedLook} />
                  </button>
                </div>
                <h3 className="ui-ns__title">
                  {notice.title}
                </h3>
                <p className="ui-ns__text">{notice.text}</p>
                {notice.action &&
                  (notice.action.href ? (
                    <a
                      className="ui-ns__btn"
                      href={notice.action.href}
                      onClick={notice.action.onClick}
                      {...(notice.action.external ? { target: "_blank", rel: "noreferrer" } : {})}
                    >
                      {notice.action.label}
                      {notice.action.external && <ArrowIcon look={resolvedLook} />}
                    </a>
                  ) : (
                    <button type="button" className="ui-ns__btn" onClick={notice.action.onClick}>
                      {notice.action.label}
                    </button>
                  ))}
              </div>
            </article>
          );
        })}
        <span className="ui-ns__sr" role="status">
          {status}
        </span>
      </section>
    </>
  );
}

/** Quiet line art for the top-right corner – fades out towards the text */
function Pattern({ kind }: { kind: NoticePattern }) {
  return (
    <svg className="ui-ns__pattern" viewBox="0 0 220 160" fill="none" aria-hidden="true">
      {kind === "orbit" && (
        <>
          <circle cx="190" cy="10" r="46" />
          <circle cx="190" cy="10" r="86" />
          <circle cx="190" cy="10" r="128" />
          <path d="M60 160 220 0M0 58h220M150 0v160" />
          <circle cx="150" cy="58" r="3.5" className="ui-ns__dot" />
        </>
      )}
      {kind === "grid" && (
        <>
          {[30, 60, 90, 120, 150, 180, 210].map((x) => (
            <path key={`x${x}`} d={`M${x} 0v160`} />
          ))}
          {[20, 50, 80, 110, 140].map((y) => (
            <path key={`y${y}`} d={`M0 ${y}h220`} />
          ))}
          <rect x="150" y="50" width="30" height="30" className="ui-ns__fill" />
          <circle cx="180" cy="50" r="3.5" className="ui-ns__dot" />
        </>
      )}
      {kind === "rays" && (
        <>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <path key={i} d={`M210 6 L${210 - Math.cos((i * Math.PI) / 16) * 230} ${6 + Math.sin((i * Math.PI) / 16) * 230}`} />
          ))}
          <path d="M120 6a90 90 0 0 0 90 90" />
          <circle cx="146" cy="70" r="3.5" className="ui-ns__dot" />
        </>
      )}
    </svg>
  );
}

const CloseIcon = ({ look }: { look: Look }) => (
  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={look === "clean" ? "1.1" : "1.4"} strokeLinecap="round" aria-hidden="true">
    <path d="m4 4 8 8M12 4l-8 8" />
  </svg>
);

const ArrowIcon = ({ look }: { look: Look }) => (
  <svg
    viewBox="0 0 16 16"
    width={look === "clean" ? 16 : 14}
    height={look === "clean" ? 16 : 14}
    fill="none"
    stroke="currentColor"
    strokeWidth={look === "clean" ? "1.1" : "1.4"}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 11 11 5M6 5h5v5" />
  </svg>
);

/* ---------- Shared helpers (inlined from src/internal) ---------- */

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
.ui-ns:where([data-look="standard"]),
.ui-ns__portal:where([data-look="standard"]) {
  --_tc-accent: #2f68ff;
  --_tc-accent-subtle: light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16));
  --_tc-action-secondary-bg: light-dark(#ffffff, #232326);
  --_tc-action-secondary-fg: light-dark(#171717, #ededed);
  --_tc-action-secondary-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 1px light-dark(#dedede, #3a3a40), 0 6px 16px -8px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6));
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-card-radius: 16px;
  --_tc-card-shadow: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 32px;
  --_tc-control-px-md: 12px;
  --_tc-control-radius-md: 10px;
  --_tc-control-radius-sm: 8px;
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-move: cubic-bezier(0.22, 1, 0.36, 1);
  --_tc-ease-standard: ease;
  --_tc-eyebrow-tracking: 0.04em;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-2xs: 10px;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-xl: 16px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-line-height-loose: 24px;
  --_tc-line-height-none: 1;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 20px;
  --_tc-pill-px: 8px;
  --_tc-pill-radius: 999px;
  --_tc-surface-overlay: light-dark(#ffffff, #232326);
  --_tc-surface-raised: light-dark(#ffffff, #19191b);
  --_tc-text-muted: light-dark(#646464, #9a9aa1);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-text-strong: light-dark(#171717, #f5f5f5);
}
.ui-ns:where([data-look="clean"]),
.ui-ns__portal:where([data-look="clean"]) {
  --_tc-accent: light-dark(#0060e2, #1a6cf0);
  --_tc-accent-subtle: light-dark(rgba(0, 96, 226, 0.06), rgba(77, 141, 255, 0.14));
  --_tc-action-secondary-bg: light-dark(#ffffff, #252527);
  --_tc-action-secondary-fg: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-action-secondary-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-action-secondary-shadow-hover: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.1), rgba(255, 255, 255, 0.14)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 3px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-card-radius: 10px;
  --_tc-card-shadow: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-control-font-size: 13px;
  --_tc-control-font-weight: 500;
  --_tc-control-h-md: 28px;
  --_tc-control-px-md: 10px;
  --_tc-control-radius-md: 6px;
  --_tc-control-radius-sm: 6px;
  --_tc-duration-fast: 150ms;
  --_tc-duration-moderate: 260ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-move: cubic-bezier(0.32, 0.72, 0.24, 1);
  --_tc-ease-standard: ease;
  --_tc-eyebrow-tracking: 0.05em;
  --_tc-fill-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-2xs: 10px;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-lg-plus: 15px;
  --_tc-font-size-md: 13px;
  --_tc-font-size-xl: 16px;
  --_tc-font-weight-medium: 500;
  --_tc-font-weight-regular: 400;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-line-height-loose: 24px;
  --_tc-line-height-none: 1;
  --_tc-line-height-normal: 20px;
  --_tc-line-height-relaxed: 22px;
  --_tc-pill-font-size: 11px;
  --_tc-pill-font-weight: 500;
  --_tc-pill-h: 18px;
  --_tc-pill-px: 6px;
  --_tc-pill-radius: 5px;
  --_tc-surface-overlay: light-dark(#ffffff, #252527);
  --_tc-surface-raised: light-dark(#ffffff, #1c1c1e);
  --_tc-text-muted: light-dark(rgba(0, 0, 0, 0.56), rgba(255, 255, 255, 0.52));
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-text-strong: light-dark(#000000, #ffffff);
}
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

:where([data-look="standard"], [data-look="standard"] *).ui-ns {
  /* Illustration art: the corner pattern */
  --tc-notification-stack-art-stroke: light-dark(#e3e3e3, rgba(255, 255, 255, 0.08));
  --tc-notification-stack-art-dot: light-dark(#d4d4d4, rgba(255, 255, 255, 0.22));
  --tc-notification-stack-art-fill: light-dark(#f5f5f5, rgba(255, 255, 255, 0.04));
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 380px;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  -webkit-font-smoothing: antialiased;
  transition: height var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move));
}
/* Colors and motion as variables – override them on .ui-ns */
:where([data-look="clean"], [data-look="clean"] *).ui-ns {
  /* Illustration art: the corner pattern */
  --tc-notification-stack-art-stroke: light-dark(rgba(0, 0, 0, 0.07), rgba(255, 255, 255, 0.07));
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 380px;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-regular, var(--_tc-font-weight-regular));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-primary, var(--_tc-text-primary));
  text-align: left;
  -webkit-font-smoothing: antialiased;
  transition: height var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move));
}
.ui-ns *, .ui-ns *::before, .ui-ns *::after { box-sizing: border-box; }
/* Focus: the ring token in both looks */
.ui-ns button:focus-visible,
.ui-ns a:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
/* The action looks exactly like a secondary Button */
.ui-ns__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: var(--tc-control-h-md, var(--_tc-control-h-md));
  margin-top: 12px;
  padding: 0 var(--tc-control-px-md, var(--_tc-control-px-md));
  border: 0;
  border-radius: var(--tc-control-radius-md, var(--_tc-control-radius-md));
  background: var(--tc-action-secondary-bg, var(--_tc-action-secondary-bg));
  box-shadow: var(--tc-action-secondary-shadow, var(--_tc-action-secondary-shadow));
  font: inherit;
  font-size: var(--tc-control-font-size, var(--_tc-control-font-size));
  font-weight: var(--tc-control-font-weight, var(--_tc-control-font-weight));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-action-secondary-fg, var(--_tc-action-secondary-fg));
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  transition: box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), transform var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-move, var(--_tc-ease-move));
}
.ui-ns__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover, var(--_tc-action-secondary-shadow-hover)); }
.ui-ns__btn:active { transform: scale(0.98); }
.ui-ns__btn svg { color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
.ui-ns__btn:has(svg) { padding-right: calc(var(--tc-control-px-md, var(--_tc-control-px-md)) - 2px); }
.ui-ns__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-ns__card {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  overflow: hidden;
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow));
  transform-origin: 50% 100%;
  transition:
    transform var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)),
    opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)),
    box-shadow var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="clean"], [data-look="clean"] *):where(.ui-ns) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-ns) svg { flex: none; }
/* One white card per notice – the edge is a shadow, not a border */
:where([data-look="clean"], [data-look="clean"] *).ui-ns__card {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  overflow: hidden;
  border-radius: var(--tc-card-radius, var(--_tc-card-radius));
  background: var(--tc-surface-raised, var(--_tc-surface-raised));
  box-shadow: var(--tc-card-shadow, var(--_tc-card-shadow));
  transform-origin: 50% 100%;
  transition:
    transform var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-ease-move, var(--_tc-ease-move)),
    opacity var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard)),
    box-shadow var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
/* Cards behind show only their edge */
.ui-ns__card > * { transition: opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
.ui-ns__card:not([data-depth="0"]) > * { opacity: 0; }
.ui-ns__card[data-leaving] {
  opacity: 0;
  transform: translateX(40px) scale(0.98) !important;
  transition: transform var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-move, var(--_tc-ease-move)), opacity var(--tc-duration-moderate, var(--_tc-duration-moderate)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-ns__pattern {
  position: absolute;
  top: 0;
  right: 0;
  width: 220px;
  height: 160px;
  stroke: var(--tc-notification-stack-art-stroke);
  stroke-width: 1;
  pointer-events: none;
  /* Only the top-right corner, fading out towards the text */
  -webkit-mask-image: radial-gradient(120% 110% at 100% 0%, #000 20%, transparent 70%);
  mask-image: radial-gradient(120% 110% at 100% 0%, #000 20%, transparent 70%);
}
:where([data-look="standard"], [data-look="standard"] *).ui-ns__dot { fill: var(--tc-notification-stack-art-dot); stroke: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-ns__fill { fill: var(--tc-notification-stack-art-fill); }
:where([data-look="standard"], [data-look="standard"] *).ui-ns__body {
  position: relative;
  padding: 18px 20px 20px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-ns__btn { margin-top: 16px; }
:where([data-look="standard"], [data-look="standard"] *).ui-ns__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 26px;
  margin-bottom: 14px;
}
:where([data-look="standard"], [data-look="standard"] *).ui-ns__badge {
  display: inline-flex;
  align-items: center;
  height: var(--tc-pill-h, var(--_tc-pill-h));
  padding: 0 var(--tc-pill-px, var(--_tc-pill-px));
  border-radius: var(--tc-pill-radius, var(--_tc-pill-radius));
  background: var(--tc-surface-overlay, var(--_tc-surface-overlay));
  box-shadow: inset 0 0 0 1px var(--tc-border-default, var(--_tc-border-default));
  font-size: var(--tc-pill-font-size, var(--_tc-pill-font-size));
  font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight));
  line-height: var(--tc-line-height-none, var(--_tc-line-height-none));
  letter-spacing: var(--tc-eyebrow-tracking, var(--_tc-eyebrow-tracking));
  text-transform: uppercase;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
:where([data-look="standard"], [data-look="standard"] *).ui-ns__close {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  margin: -2px -6px 0 0;
  padding: 0;
  border: 0;
  border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm));
  background: transparent;
  color: var(--tc-text-muted, var(--_tc-text-muted));
  cursor: pointer;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where([data-look="standard"], [data-look="standard"] *).ui-ns__close:hover { background: var(--tc-fill-default, var(--_tc-fill-default)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-ns__title {
  margin: 0;
  font-size: var(--tc-font-size-xl, var(--_tc-font-size-xl));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-relaxed, var(--_tc-line-height-relaxed));
  letter-spacing: -0.01em;
}
:where([data-look="standard"], [data-look="standard"] *).ui-ns__text {
  margin: 6px 0 0;
  max-width: 34ch;
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-muted, var(--_tc-text-muted));
}
/* Quiet hairline art in the top-right corner, with one blue mark */
:where([data-look="clean"], [data-look="clean"] *).ui-ns__pattern {
  position: absolute;
  top: 0;
  right: 0;
  width: 220px;
  height: 160px;
  stroke: var(--tc-notification-stack-art-stroke);
  stroke-width: 0.75;
  pointer-events: none;
  -webkit-mask-image: radial-gradient(120% 110% at 100% 0%, #000 20%, transparent 70%);
  mask-image: radial-gradient(120% 110% at 100% 0%, #000 20%, transparent 70%);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ns__dot { fill: var(--tc-accent, var(--_tc-accent)); stroke: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-ns__fill { fill: var(--tc-accent-subtle, var(--_tc-accent-subtle)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ns__body {
  position: relative;
  padding: 12px 12px 16px 16px;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ns__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 28px;
  margin-bottom: 8px;
}
/* Tiny label: tinted fill, 10px uppercase */
:where([data-look="clean"], [data-look="clean"] *).ui-ns__badge {
  display: inline-flex;
  align-items: center;
  height: var(--tc-pill-h, var(--_tc-pill-h));
  padding: 0 var(--tc-pill-px, var(--_tc-pill-px));
  border-radius: var(--tc-pill-radius, var(--_tc-pill-radius));
  background: var(--tc-fill-default, var(--_tc-fill-default));
  font-size: var(--tc-font-size-2xs, var(--_tc-font-size-2xs));
  font-weight: var(--tc-pill-font-weight, var(--_tc-pill-font-weight));
  line-height: var(--tc-line-height-none, var(--_tc-line-height-none));
  letter-spacing: var(--tc-eyebrow-tracking, var(--_tc-eyebrow-tracking));
  text-transform: uppercase;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
/* Ghost icon button */
:where([data-look="clean"], [data-look="clean"] *).ui-ns__close {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: var(--tc-control-radius-sm, var(--_tc-control-radius-sm));
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
}
:where(.ui-ns) :where([data-look="clean"], [data-look="clean"] *).ui-ns__close { color: var(--tc-icon-muted, var(--_tc-icon-muted)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ns__close:hover { background: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-ns__title {
  margin: 0;
  padding-right: 4px;
  font-size: var(--tc-font-size-lg-plus, var(--_tc-font-size-lg-plus));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-loose, var(--_tc-line-height-loose));
  color: var(--tc-text-strong, var(--_tc-text-strong));
}
:where([data-look="clean"], [data-look="clean"] *).ui-ns__text {
  margin: 2px 0 0;
  padding-right: 4px;
  max-width: 38ch;
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
}
/* Secondary button: white with the card's hairline shadow */
/* Narrow stacks (phones) */
@container (max-width: 340px) {
:where([data-look="clean"], [data-look="clean"] *).ui-ns__body { padding: 10px 10px 14px 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ns__text { max-width: none; }
}
/* Touch screens: bigger tap targets */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-ns__close { width: 36px; height: 36px; margin: -4px -4px -4px 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-ns__btn { height: 36px; padding: 0 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-ns, .ui-ns__card, .ui-ns__card > * { transition: none; }
}
`;
