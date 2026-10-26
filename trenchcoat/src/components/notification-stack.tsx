"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type Ref } from "react";
import { rescueFocus, useFocusRescue } from "../internal/use-focus-rescue";
import { useRootRef } from "../internal/use-root-ref";

/*
 * Notification Stack – notices stacked behind each other, in a single self-contained file.
 * Only the front card can be read; the others peek out below it. Dismissing the front card slides it away and
 * the next one moves up – one notice at a time.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (Standard by default). Clean draws one white card per notice with hairline shadows instead of
 * borders, Inter at 13/15px, quiet line art and thinner icons.
 */
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
  /** Visual style: "standard" (the default) or "clean" */
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

/* ---------- Styles ---------- */

const css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *).ui-ns {
  /* Illustration art: the corner pattern */
  --tc-notification-stack-art-stroke: light-dark(#e3e3e3, rgba(255, 255, 255, 0.08));
  --tc-notification-stack-art-dot: light-dark(#d4d4d4, rgba(255, 255, 255, 0.22));
  --tc-notification-stack-art-fill: light-dark(#f5f5f5, rgba(255, 255, 255, 0.04));
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 380px;
  font-family: var(--tc-font-sans);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
  transition: height var(--tc-duration-slower) var(--tc-ease-move);
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
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  transition: height var(--tc-duration-slower) var(--tc-ease-move);
}
.ui-ns *, .ui-ns *::before, .ui-ns *::after { box-sizing: border-box; }
/* Focus: the ring token in both looks */
.ui-ns button:focus-visible,
.ui-ns a:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* The action looks exactly like a secondary Button */
.ui-ns__btn {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-md);
  margin-top: var(--tc-space-3);
  padding: 0 var(--tc-control-px-md);
  border: 0;
  border-radius: var(--tc-control-radius-md);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  font: inherit;
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-action-secondary-fg);
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move);
}
.ui-ns__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-ns__btn:active { transform: scale(0.98); }
.ui-ns__btn svg { color: var(--tc-icon-muted); }
.ui-ns__btn:has(svg) { padding-right: calc(var(--tc-control-px-md) - 2px); }
.ui-ns__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-ns__card {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  overflow: hidden;
  background: var(--tc-surface-raised);
  border-radius: var(--tc-card-radius);
  box-shadow: var(--tc-card-shadow);
  transform-origin: 50% 100%;
  transition:
    transform var(--tc-duration-slower) var(--tc-ease-move),
    opacity var(--tc-duration-slow) var(--tc-ease-standard),
    box-shadow var(--tc-duration-slow) var(--tc-ease-standard);
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
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  transform-origin: 50% 100%;
  transition:
    transform var(--tc-duration-slower) var(--tc-ease-move),
    opacity var(--tc-duration-slow) var(--tc-ease-standard),
    box-shadow var(--tc-duration-slow) var(--tc-ease-standard);
}
/* Cards behind show only their edge */
.ui-ns__card > * { transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-ns__card:not([data-depth="0"]) > * { opacity: 0; }
.ui-ns__card[data-leaving] {
  opacity: 0;
  transform: translateX(40px) scale(0.98) !important;
  transition: transform var(--tc-duration-slow) var(--tc-ease-move), opacity var(--tc-duration-moderate) var(--tc-ease-standard);
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
  padding: var(--tc-space-4-5) var(--tc-space-5) var(--tc-space-5);
}
:where([data-look="standard"], [data-look="standard"] *).ui-ns__btn { margin-top: var(--tc-space-4); }
:where([data-look="standard"], [data-look="standard"] *).ui-ns__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 26px;
  margin-bottom: var(--tc-space-3-5);
}
:where([data-look="standard"], [data-look="standard"] *).ui-ns__badge {
  display: inline-flex;
  align-items: center;
  height: var(--tc-pill-h);
  padding: 0 var(--tc-pill-px);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-surface-overlay);
  box-shadow: inset 0 0 0 1px var(--tc-border-default);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-pill-font-weight);
  line-height: var(--tc-line-height-none);
  letter-spacing: var(--tc-eyebrow-tracking);
  text-transform: uppercase;
  color: var(--tc-text-secondary);
}
:where([data-look="standard"], [data-look="standard"] *).ui-ns__close {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  margin: -2px -6px 0 0;
  padding: 0;
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  background: transparent;
  color: var(--tc-text-muted);
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-ns__close:hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-ns__title {
  margin: 0;
  font-size: var(--tc-font-size-xl);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-relaxed);
  letter-spacing: -0.01em;
}
:where([data-look="standard"], [data-look="standard"] *).ui-ns__text {
  margin: var(--tc-space-1-5) 0 0;
  max-width: 34ch;
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
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
:where([data-look="clean"], [data-look="clean"] *).ui-ns__dot { fill: var(--tc-accent); stroke: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-ns__fill { fill: var(--tc-accent-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-ns__body {
  position: relative;
  padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-4) var(--tc-space-4);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ns__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 28px;
  margin-bottom: var(--tc-space-2);
}
/* Tiny label: tinted fill, 10px uppercase */
:where([data-look="clean"], [data-look="clean"] *).ui-ns__badge {
  display: inline-flex;
  align-items: center;
  height: var(--tc-pill-h);
  padding: 0 var(--tc-pill-px);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-fill-default);
  font-size: var(--tc-font-size-2xs);
  font-weight: var(--tc-pill-font-weight);
  line-height: var(--tc-line-height-none);
  letter-spacing: var(--tc-eyebrow-tracking);
  text-transform: uppercase;
  color: var(--tc-text-secondary);
}
/* Ghost icon button */
:where([data-look="clean"], [data-look="clean"] *).ui-ns__close {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: var(--tc-control-radius-sm);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where(.ui-ns) :where([data-look="clean"], [data-look="clean"] *).ui-ns__close { color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-ns__close:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-ns__title {
  margin: 0;
  padding-right: var(--tc-space-1);
  font-size: var(--tc-font-size-lg-plus);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-loose);
  color: var(--tc-text-strong);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ns__text {
  margin: var(--tc-space-0-5) 0 0;
  padding-right: var(--tc-space-1);
  max-width: 38ch;
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
}
/* Secondary button: white with the card's hairline shadow */
/* Narrow stacks (phones) */
@container (max-width: 340px) {
:where([data-look="clean"], [data-look="clean"] *).ui-ns__body { padding: var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-3-5) var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-ns__text { max-width: none; }
}
/* Touch screens: bigger tap targets */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-ns__close { width: 36px; height: 36px; margin: -4px -4px -4px 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-ns__btn { height: 36px; padding: 0 var(--tc-space-3-5); }
}
@media (prefers-reduced-motion: reduce) {
  .ui-ns, .ui-ns__card, .ui-ns__card > * { transition: none; }
}
`;
