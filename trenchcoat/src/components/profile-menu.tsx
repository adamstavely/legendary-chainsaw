"use client";

import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type KeyboardEvent, type ReactNode, type Ref } from "react";
import { useRootRef } from "../internal/use-root-ref";

/*
 * Profile Menu – an account card with the signed-in user, menu actions and profile setup progress, in a single self-contained file.
 * The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: profile-menu.tsx is Standard,
 * profile-menu-clean.tsx is Clean). Clean has no tray – one white menu card with hairline shadows, smaller
 * rows and thinner icons; the setup progress is its last row under a hairline instead of sitting in the tray.
 */
export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-pm";

export type ProfileMenuItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Small pill on the right, e.g. "New" */
  badge?: string;
  onSelect?: () => void;
};

export type ProfileSetup = {
  /** Steps finished so far */
  done: number;
  total: number;
  /** The next open step, shown as a shortcut under the bar */
  next?: string;
  onContinue?: () => void;
};

type ProfileMenuOwnProps = {
  name: string;
  email: string;
  /** Replaces the default avatar */
  avatar?: ReactNode;
  items?: ProfileMenuItem[];
  /** Profile setup progress under the actions – leave empty to hide */
  setup?: ProfileSetup;
  className?: string;
  /** Visual style. Defaults to the file's look: Standard in profile-menu.tsx, Clean in profile-menu-clean.tsx */
  look?: Look;
  ref?: Ref<HTMLElement>;
};

export type ProfileMenuProps = Omit<ComponentPropsWithoutRef<"section">, keyof ProfileMenuOwnProps> & ProfileMenuOwnProps;

export function ProfileMenu({
  name,
  email,
  avatar,
  items = defaultItems,
  setup,
  className,
  look,
  ref,
  ...rest
}: ProfileMenuProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  const listRef = useRef<HTMLDivElement>(null);
  // The progress bar fills up once the card is on screen
  const [filled, setFilled] = useState(false);
  const rootRef = useRef<HTMLElement | null>(null);
  // The root is ours (for the observer) and the consumer's
  const setRoot = useRootRef(rootRef, ref);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setFilled(true), io.disconnect()), {
      threshold: 0.3,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Arrow keys move between the actions as a convenience; each action is also a plain button in the tab order
  // (the list is always visible, so it is a group of buttons, not an ARIA menu)
  const onKey = (e: KeyboardEvent) => {
    const buttons = [...(listRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [])];
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      e.key === "ArrowDown" ? (i + 1) % buttons.length
      : e.key === "ArrowUp" ? (i - 1 + buttons.length) % buttons.length
      : e.key === "Home" ? 0
      : e.key === "End" ? buttons.length - 1
      : null;
    if (next === null) return;
    e.preventDefault();
    buttons[next]?.focus();
  };

  return (
    <>
      <style href="ui-profile-menu" precedence="default">
        {css}
      </style>
      <section
        {...rest}
        ref={setRoot}
        className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
        data-look={resolvedLook}
        data-filled={filled || undefined}
      >
        <div className="ui-pm__card">
        <header className="ui-pm__user">
          <span className="ui-pm__avatar">{avatar ?? <DefaultAvatar />}</span>
          <span className="ui-pm__who">
            <span className="ui-pm__name" title={name}>
              {name}
            </span>
            <span className="ui-pm__email" title={email}>
              {email}
            </span>
          </span>
        </header>

        <div ref={listRef} className="ui-pm__items" role="group" aria-label="Account" onKeyDown={onKey}>
          {items.map((item) => (
            <button key={item.id} type="button" className="ui-pm__item" onClick={item.onSelect}>
              <span className="ui-pm__icon">{item.icon}</span>
              <span className="ui-pm__label" title={item.label}>
                {item.label}
              </span>
              {item.badge && <span className="ui-pm__badge">{item.badge}</span>}
            </button>
          ))}
        </div>

        {/* Clean: the setup progress is the card's last row; Standard: it sits in the tray below the card */}
        {setup && resolvedLook === "clean" && <SetupProgress {...setup} look={resolvedLook} />}
        </div>
        {setup && resolvedLook !== "clean" && <SetupProgress {...setup} look={resolvedLook} />}
      </section>
    </>
  );
}

/** Compact setup progress in the gray extension (Clean: the last row of the card): count, bar and the next step on one line */
function SetupProgress({ done, total, next, onContinue, look }: ProfileSetup & { look: Look }) {
  const ratio = total > 0 ? Math.min(1, Math.max(0, done / total)) : 0;
  const percent = Math.round(ratio * 100);
  const open = next && done < total;
  const shown = Math.min(done, total);
  return (
    <div className="ui-pm__setup">
      <div className="ui-pm__setup-head">
        <span className="ui-pm__setup-title">Profile setup</span>
        <span className="ui-pm__setup-count">
          {shown}/{total}
        </span>
      </div>
      <span
        className="ui-pm__track"
        role="progressbar"
        aria-label="Profile setup"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${shown} of ${total} steps done`}
      >
        <span className="ui-pm__fill" style={{ transform: `scaleX(${ratio})` }} />
      </span>
      {open && (
        <button type="button" className="ui-pm__next" onClick={onContinue}>
          <span className="ui-pm__next-label" title={`Next: ${next}`}>
            <span className="ui-pm__next-hint">Next:</span> {next}
          </span>
          <ArrowIcon look={look} />
        </button>
      )}
    </div>
  );
}

/* ---------- Icons ---------- */

const ICON_STROKE: Record<Look, number> = { standard: 1.5, clean: 1.1 };

// The stroke follows the menu's look (Standard 1.5, Clean 1.1) through --tc-profile-menu-icon-stroke; outside a
// menu it falls back to the file's look
const Svg = ({ children }: { children: ReactNode }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ strokeWidth: `var(--tc-profile-menu-icon-stroke, ${ICON_STROKE[DEFAULT_LOOK]})` }}
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const SettingsIcon = () => (
  <Svg>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const LanguageIcon = () => (
  <Svg>
    <path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6" />
  </Svg>
);

export const DocsIcon = () => (
  <Svg>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8M10 9H8" />
  </Svg>
);

export const AppsIcon = () => (
  <Svg>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <path d="M17.5 3v7M14 6.5h7" />
  </Svg>
);

export const LogoutIcon = () => (
  <Svg>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </Svg>
);

/** Default avatar: a person icon centered on a soft blue disc */
const DefaultAvatar = () => (
  <svg viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="20" cy="20" r="20" fill="currentColor" opacity="0.1" />
    <circle cx="20" cy="16" r="4.75" fill="currentColor" />
    <path d="M11.5 28.25c.9-4 4.3-6.75 8.5-6.75s7.6 2.75 8.5 6.75c.15.7-.4 1.25-1.1 1.25H12.6c-.7 0-1.25-.55-1.1-1.25Z" fill="currentColor" />
  </svg>
);

const ArrowIcon = ({ look }: { look: Look }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={look === "clean" ? "1.1" : "1.6"} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const defaultItems: ProfileMenuItem[] = [
  { id: "settings", label: "Settings", icon: <SettingsIcon /> },
  { id: "docs", label: "Docs", icon: <DocsIcon /> },
  { id: "apps", label: "Apps", icon: <AppsIcon />, badge: "New" },
  { id: "logout", label: "Logout", icon: <LogoutIcon /> },
];

/* ---------- Styles ---------- */

const css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *).ui-pm {
  /* Stroke width of the menu icons */
  --tc-profile-menu-icon-stroke: 1.5;
  box-sizing: border-box;
  width: 100%;
  max-width: 320px;
  /* Like the Chat Composer: the white menu card sits on a gray tray, the setup progress lives in the tray below */
  background: var(--tc-surface-tray);
  /* The gray tray frames the white card on every side */
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on .ui-pm */
:where([data-look="clean"], [data-look="clean"] *).ui-pm {
  /* Stroke width of the menu icons */
  --tc-profile-menu-icon-stroke: 1.1;
  /* Strokes are shadows: a 0.5px hairline plus a soft lift, like a popover */
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 260px;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
.ui-pm *, .ui-pm *::before, .ui-pm *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *).ui-pm__card {
  padding: var(--tc-space-4) var(--tc-space-2) var(--tc-space-2);
  background: var(--tc-surface-on-tray);
  border: 1px solid var(--tc-border-default);
  border-radius: var(--tc-card-radius);
  box-shadow: var(--tc-shadow-control);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__user {
  display: flex;
  align-items: center;
  gap: var(--tc-space-3-5);
  padding: 0 var(--tc-space-2-5) var(--tc-space-3);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__avatar {
  flex: none;
  width: 42px;
  height: 42px;
  color: var(--tc-accent);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__avatar > * { display: block; width: 100%; height: 100%; }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-pm) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: left; cursor: pointer; }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-pm) svg { display: block; flex: none; }
/* One white menu card – the edge is a shadow, not a border */
:where([data-look="clean"], [data-look="clean"] *).ui-pm__card {
  padding: var(--tc-menu-padding);
  border-radius: var(--tc-menu-radius);
  background: var(--tc-menu-bg);
  box-shadow: var(--tc-menu-shadow);
}
/* The signed-in user, separated from the actions by a hairline */
:where([data-look="clean"], [data-look="clean"] *).ui-pm__user {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  margin: 0 -4px var(--tc-space-1);
  padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-2-5);
  border-bottom: var(--tc-hairline) solid var(--tc-divider);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pm__avatar {
  flex: none;
  width: 32px;
  height: 32px;
  overflow: hidden;
  border-radius: var(--tc-radius-full);
  color: var(--tc-accent);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pm__avatar > * { display: block; width: 100%; height: 100%; object-fit: cover; }
.ui-pm__who {
  display: grid;
  min-width: 0;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__name {
  overflow: hidden;
  font-size: var(--tc-font-size-lg-plus);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-relaxed);
  white-space: nowrap;
  text-overflow: ellipsis;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__email {
  overflow: hidden;
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  white-space: nowrap;
  text-overflow: ellipsis;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__items {
  display: grid;
  gap: var(--tc-space-0-5);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__item {
  display: flex;
  align-items: center;
  gap: var(--tc-space-3);
  width: 100%;
  min-height: 36px;
  margin: 0;
  padding: 0 var(--tc-space-3);
  border: 0;
  border-radius: var(--tc-radius-xl);
  background: transparent;
  font: inherit;
  text-align: left;
  color: var(--tc-text-secondary);
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__item:hover,
:where([data-look="standard"], [data-look="standard"] *).ui-pm__item:focus-visible {
  background: var(--tc-menu-item-hover);
  color: var(--tc-text-primary);
}
/* Focus: the ring, not only the faint fill (2.4.7) */
.ui-pm__item:focus-visible,
.ui-pm__next:focus-visible {
  outline: var(--tc-focus-outline);
  outline-offset: var(--tc-focus-ring-offset);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pm__name {
  overflow: hidden;
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-text-strong);
  white-space: nowrap;
  text-overflow: ellipsis;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pm__email {
  overflow: hidden;
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-text-muted);
  white-space: nowrap;
  text-overflow: ellipsis;
}
/* Actions: quiet rows, a subtle fill on hover that fades out again */
:where([data-look="clean"], [data-look="clean"] *).ui-pm__items { display: grid; gap: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-pm__item {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  width: 100%;
  min-height: var(--tc-menu-item-h);
  padding: 0 var(--tc-menu-item-px);
  border-radius: var(--tc-menu-item-radius);
  color: var(--tc-text-primary);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pm__item:hover { background: var(--tc-menu-item-hover); transition-duration: var(--tc-duration-instant); }
:where([data-look="clean"], [data-look="clean"] *).ui-pm__item:focus-visible { background: var(--tc-menu-item-hover); }
.ui-pm__item:active { background: var(--tc-fill-strong); }
.ui-pm__icon {
  display: grid;
  place-items: center;
  flex: none;
  color: var(--tc-icon-muted);
  transition: color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__icon { width: 20px; height: 20px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pm__icon svg { width: 20px; height: 20px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pm__icon { width: 16px; height: 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pm__icon svg { width: 16px; height: 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pm__icon svg * { vector-effect: non-scaling-stroke; }
.ui-pm__item:hover .ui-pm__icon,
.ui-pm__item:focus-visible .ui-pm__icon { color: var(--tc-text-primary); }
.ui-pm__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__label {
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
}
/* The "New" tag: a pill in the rose tone */
.ui-pm__badge {
  display: inline-flex;
  align-items: center;
  flex: none;
  height: var(--tc-pill-h);
  padding: 0 var(--tc-pill-px);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-tone-rose-bg);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-pill-font-weight);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-tone-rose-fg);
}
/* Profile setup in the gray extension – kept to two short lines and a bar */
:where([data-look="standard"], [data-look="standard"] *).ui-pm__setup {
  padding: var(--tc-space-2-5) var(--tc-space-4-5) var(--tc-space-3);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__setup-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-snug);
}
/* Profile setup: the last row of the card, under a hairline */
:where([data-look="clean"], [data-look="clean"] *).ui-pm__setup {
  margin: var(--tc-space-1) -4px -4px;
  padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-3);
  border-top: var(--tc-hairline) solid var(--tc-divider);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pm__setup:has(.ui-pm__next) { padding-bottom: var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-pm__setup-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
}
.ui-pm__setup-title { color: var(--tc-text-secondary); font-weight: var(--tc-font-weight-medium); }
.ui-pm__setup-count {
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-muted);
}
.ui-pm__track {
  display: block;
  height: var(--tc-meter-h);
  overflow: hidden;
  border-radius: var(--tc-meter-radius);
  background: var(--tc-meter-track);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__track { margin-top: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-pm__track { margin-top: var(--tc-space-2); }
.ui-pm__fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--tc-meter-fill);
  transform-origin: left center;
  scale: 0 1;
  transition: scale var(--tc-duration-reveal-slow) var(--tc-ease-move) var(--tc-duration-fast);
}
.ui-pm[data-filled] .ui-pm__fill { scale: 1 1; }
.ui-pm__next {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  width: calc(100% + 16px);
  margin: var(--tc-space-1-5) -8px 0;
  padding: 0 var(--tc-space-2);
  color: var(--tc-text-primary);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__next {
  min-height: 26px;
  padding-block: var(--tc-space-1);
  border: 0;
  border-radius: var(--tc-radius-md);
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__next:hover,
:where([data-look="standard"], [data-look="standard"] *).ui-pm__next:focus-visible {
  background: var(--tc-menu-item-hover);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__next-label {
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pm__next {
  min-height: 28px;
  border-radius: var(--tc-radius-sm);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pm__next:hover { background: var(--tc-fill-subtle); }
.ui-pm__next-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ui-pm__next-hint { color: var(--tc-text-muted); }
.ui-pm__next svg {
  flex: none;
  color: var(--tc-icon-muted);
  transition: transform var(--tc-duration-base) var(--tc-ease-move), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__next svg { width: 14px; height: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pm__next svg { width: 16px; height: 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pm__next svg * { vector-effect: non-scaling-stroke; }
.ui-pm__next:hover svg { transform: translateX(2px); color: var(--tc-text-primary); }
/* Touch screens: taller rows */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-pm__item { min-height: 40px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pm__next { min-height: 36px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-pm__item, .ui-pm__icon, .ui-pm__fill, .ui-pm__next, .ui-pm__next svg { transition: none; }
}
`;
