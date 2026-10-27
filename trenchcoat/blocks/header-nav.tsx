"use client";

import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type Ref,
} from "react";
import {
  AppPicker,
  DocsIcon,
  LanguageIcon,
  LogoutIcon,
  Notifications,
  ProfileMenu,
  SettingsIcon,
  type AppPickerProps,
  type Look,
  type NotificationsProps,
  type ProfileMenuItem,
  type ProfileSetup,
} from "trenchcoat/react";
import { lookContext } from "trenchcoat/look-provider";

/*
 * Header Nav – the right end of an app header, in one self-contained file: the notifications bell, the app picker and
 * the signed-in person's avatar, in that order, with a hairline before the avatar (remediation 7.5). Built on the Lit
 * components through `trenchcoat/react` (decision O):
 *   · `notifications` – every prop of <Notifications> (items, handlers, settings link…); leave it unset to hide the bell
 *   · `apps` – every prop of <AppPicker> (apps, pinned, current, onSelect…); leave it unset to hide the picker
 *   · the avatar – a round button (the person's image, or their initials on a tone) with an optional presence dot. It
 *     opens <ProfileMenu> – the account card – in a popover under it, aligned to its end
 * One popover is open at a time: opening one closes the others. Which one is open is the block's own state, or the
 * parent's through `open` / `defaultOpen` / `onOpenChange`.
 *
 * The three triggers share one shape: a round ghost button at the control height (32 px Standard, 28 px Clean), the
 * same hover fill and focus ring, the badge on the bell's top corner and the presence dot on the avatar's bottom one.
 *
 * The account popover: the Popover API's top layer where it exists (nothing clips it), else fixed at --tc-z-popover;
 * placed under the avatar, its end edge on the avatar's, kept inside the viewport, above it when there's no room
 * below, and followed on scroll and resize. It's a non-modal dialog named "Account". Opening it moves focus to its
 * first action; Escape closes it and returns focus to the avatar, and so does picking an action; a pointer-down
 * outside, or focus moving to anything else (Tab past its last action), closes it where focus is. Tab order is the visual order: bell, picker, avatar,
 * then the open popover's contents. The look follows the nearest <LookProvider>, or the `look` prop.
 */

/** Presence: a dot on the avatar's bottom corner */
export type HeaderNavPresence = "online" | "away" | "busy" | "offline";
/** The tone behind initials when there's no image */
export type HeaderNavTone = "accent" | "teal" | "violet" | "amber" | "pink" | "rose";

export type HeaderNavUser = {
  /** Full name – the avatar's accessible name is "Account: <name>", and it heads the account card */
  name: string;
  /** Under the name in the account card */
  email: string;
  /** A photo URL; without one (or if it fails to load) the initials show */
  avatar?: string;
  /** The initials' tone; unset picks one from the name, the same every time */
  tone?: HeaderNavTone;
  /** Shows a presence dot, and says it after the avatar's name */
  presence?: HeaderNavPresence;
};

/** Which popover is open */
export type HeaderNavPanel = "notifications" | "apps" | "account";

type OwnProps = {
  /** The signed-in person */
  user: HeaderNavUser;
  /** The bell: <Notifications> props – the app's items and handlers. Unset hides the bell */
  notifications?: Omit<NotificationsProps, "open" | "defaultOpen" | "inline">;
  /** The app picker: <AppPicker> props – the app's apps, pins and handlers. Unset hides the picker */
  apps?: Omit<AppPickerProps, "open" | "defaultOpen" | "layout">;
  /** The account card's actions; unset shows Settings, Language, Docs and Sign out */
  accountItems?: ProfileMenuItem[];
  /** An account action was picked (the popover closes and focus returns to the avatar) */
  onAccountSelect?: (id: string) => void;
  /** Profile setup progress in the account card – unset hides it */
  setup?: ProfileSetup;
  /** The setup's next step was picked */
  onSetupContinue?: (next: string) => void;
  /** The account popover's name, and the start of the avatar's ("Account") */
  accountLabel?: string;
  /** The open popover (controlled), null for none */
  open?: HeaderNavPanel | null;
  /** The popover open at first when uncontrolled */
  defaultOpen?: HeaderNavPanel | null;
  /** A popover opened (its name) or closed (null) */
  onOpenChange?: (open: HeaderNavPanel | null) => void;
  /** The hairline before the avatar (default true) */
  separator?: boolean;
  /** The look of the cluster and the components in it; unset follows the nearest look provider */
  look?: Look;
  className?: string;
  /** The root element */
  ref?: Ref<HTMLDivElement>;
};

export type HeaderNavProps = Omit<ComponentPropsWithoutRef<"div">, keyof OwnProps | "children"> & OwnProps;

const PRESENCE: Record<HeaderNavPresence, string> = { online: "Online", away: "Away", busy: "Busy", offline: "Offline" };
const TONES: HeaderNavTone[] = ["teal", "violet", "amber", "pink", "rose"];

/** One or two initials from a name: "Ada Lovelace" → "AL" */
export function headerNavInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}
const toneFor = (name: string) => TONES[[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % TONES.length];

const DEFAULT_ITEMS: ProfileMenuItem[] = [
  { id: "settings", label: "Settings", icon: <SettingsIcon /> },
  { id: "language", label: "Language", icon: <LanguageIcon /> },
  { id: "docs", label: "Docs", icon: <DocsIcon /> },
  { id: "sign-out", label: "Sign out", icon: <LogoutIcon /> },
];

export function HeaderNav({
  user,
  notifications,
  apps,
  accountItems = DEFAULT_ITEMS,
  onAccountSelect,
  setup,
  onSetupContinue,
  accountLabel = "Account",
  open: openProp,
  defaultOpen = null,
  onOpenChange,
  separator = true,
  look: lookProp,
  className,
  ref,
  ...rest
}: HeaderNavProps) {
  const uid = "ui-hn" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [look, setLookNode] = useLook(lookProp);
  const setRoot = useCallback(
    (node: HTMLDivElement | null) => {
      setLookNode(node);
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as { current: HTMLDivElement | null }).current = node;
    },
    [ref, setLookNode],
  );
  const [open, setOpen, latest] = useControllable<HeaderNavPanel | null>(openProp, defaultOpen, onOpenChange, "open");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  /** One panel's open state changed: opening it closes the others; closing it leaves another that opened alone */
  const report = (panel: HeaderNavPanel) => (next: boolean) => setOpen(next ? panel : latest.current === panel ? null : latest.current);

  const closeAccount = useCallback(
    (returnFocus: boolean) => {
      if (latest.current !== "account") return;
      setOpen(null);
      if (returnFocus) triggerRef.current?.focus({ preventScroll: true });
    },
    [latest, setOpen],
  );

  const accountOpen = open === "account";
  useAccountPopover(accountOpen, triggerRef, popRef, closeAccount);

  const presence = user.presence ? PRESENCE[user.presence] : "";
  const hasBefore = !!notifications || !!apps;

  return (
    <div {...rest} ref={setRoot} data-look={look} className={["ui-hn", className].filter(Boolean).join(" ")}>
      <style href="ui-header-nav" precedence="default">
        {css}
      </style>
      {notifications && (
        <Notifications
          {...notifications}
          look={look}
          open={open === "notifications"}
          onOpenChange={(next) => {
            notifications.onOpenChange?.(next);
            report("notifications")(next);
          }}
        />
      )}
      {apps && (
        <AppPicker
          {...apps}
          look={look}
          open={open === "apps"}
          onOpenChange={(next) => {
            apps.onOpenChange?.(next);
            report("apps")(next);
          }}
        />
      )}
      {separator && hasBefore && <span className="ui-hn__sep" aria-hidden="true" />}
      <button
        ref={triggerRef}
        type="button"
        className="ui-hn__me"
        aria-label={`${accountLabel}: ${user.name}`}
        aria-describedby={presence ? `${uid}-presence` : undefined}
        aria-haspopup="dialog"
        aria-expanded={accountOpen}
        aria-controls={accountOpen ? `${uid}-account` : undefined}
        onClick={() => setOpen(accountOpen ? null : "account")}
      >
        <Face user={user} />
        {user.presence && <span className="ui-hn__dot" data-presence={user.presence} aria-hidden="true" />}
        {presence && (
          <span id={`${uid}-presence`} className="ui-hn__sr">
            {presence}
          </span>
        )}
      </button>
      {accountOpen && (
        <div ref={popRef} id={`${uid}-account`} className="ui-hn__pop" role="dialog" aria-label={accountLabel} tabIndex={-1} popover="manual">
          <ProfileMenu
            look={look}
            name={user.name}
            email={user.email}
            avatar={<Face user={user} />}
            items={accountItems}
            setup={setup}
            onTcItemSelect={(e: CustomEvent<{ id: string }>) => {
              onAccountSelect?.(e.detail.id);
              closeAccount(true);
            }}
            onTcSetupContinue={(e: CustomEvent<{ next: string }>) => {
              onSetupContinue?.(e.detail.next);
              closeAccount(true);
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ---------- Pieces ---------- */

/** The person's photo, or their initials on a tone – decorative, the button carries the name */
function Face({ user }: { user: HeaderNavUser }) {
  const [broken, setBroken] = useState<string | null>(null);
  if (user.avatar && broken !== user.avatar)
    return <img className="ui-hn__face" src={user.avatar} alt="" draggable={false} onError={() => setBroken(user.avatar ?? null)} />;
  return (
    // The initials are drawn by CSS (::before), so the button's text is its name alone – "Account: Ada Lovelace" – and
    // a speech-input command for that name still matches
    <span className="ui-hn__face" data-tone={user.tone ?? toneFor(user.name)} data-initials={headerNavInitials(user.name)} aria-hidden="true" />
  );
}

/* ---------- Hooks ---------- */

/**
 * The account popover's behaviour, while `open`: the top layer (Popover API) where it exists, placement under the
 * trigger aligned to its end (flipped above when there's no room, kept 8 px inside the viewport, followed on scroll and
 * resize), focus on its first action, Escape (returns focus), a pointer-down outside and focus arriving elsewhere (both
 * close where focus is).
 */
function useAccountPopover(
  open: boolean,
  triggerRef: { current: HTMLButtonElement | null },
  popRef: { current: HTMLDivElement | null },
  close: (returnFocus: boolean) => void,
) {
  const closeRef = useRef(close);
  closeRef.current = close;

  useLayoutEffect(() => {
    const pop = popRef.current;
    const trigger = triggerRef.current;
    if (!open || !pop || !trigger) return;
    const doc = pop.ownerDocument;
    const view = doc.defaultView ?? window;
    try {
      if (typeof pop.showPopover === "function" && !pop.matches(":popover-open")) pop.showPopover();
    } catch {
      // Not in the document yet, or no top layer here – fixed positioning still applies
    }
    const MARGIN = 8;
    const GAP = 6;
    let frame = 0;
    const place = () => {
      frame = 0;
      const a = trigger.getBoundingClientRect();
      const vw = doc.documentElement.clientWidth || view.innerWidth;
      const vh = doc.documentElement.clientHeight || view.innerHeight;
      const w = pop.offsetWidth;
      const h = pop.offsetHeight;
      const below = vh - a.bottom - GAP - MARGIN;
      const above = a.top - GAP - MARGIN;
      const side = below >= h || below >= above ? "bottom" : "top";
      let top = side === "bottom" ? a.bottom + GAP : a.top - GAP - h;
      top = h > vh - 2 * MARGIN ? MARGIN : Math.max(MARGIN, Math.min(top, vh - MARGIN - h));
      const left = w > vw - 2 * MARGIN ? MARGIN : Math.max(MARGIN, Math.min(a.right - w, vw - MARGIN - w));
      pop.style.left = `${left}px`;
      pop.style.top = `${top}px`;
      pop.dataset.side = side;
      pop.setAttribute("data-placed", "");
    };
    const schedule = () => {
      if (!frame) frame = view.requestAnimationFrame(place);
    };
    place();
    // Focus goes to the first action once the card has rendered its buttons
    let tries = 0;
    let focusFrame = 0;
    const focusFirst = () => {
      const first = pop.querySelector<HTMLElement>("tc-profile-menu button");
      if (first) first.focus({ preventScroll: true });
      else if (++tries < 10) focusFrame = view.requestAnimationFrame(focusFirst);
      else pop.focus({ preventScroll: true });
    };
    focusFirst();

    const inside = (node: unknown) => node instanceof Node && (pop.contains(node) || trigger.contains(node));
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      e.preventDefault();
      closeRef.current(true);
    };
    const onPointer = (e: PointerEvent) => {
      if (!e.composedPath().some(inside)) closeRef.current(false);
    };
    // Focus arriving anywhere else – Tab past the last action, or a click on another control – closes it
    const onFocusIn = (e: FocusEvent) => {
      if (!e.composedPath().some(inside)) closeRef.current(false);
    };
    doc.addEventListener("keydown", onKey);
    doc.addEventListener("pointerdown", onPointer, true);
    doc.addEventListener("focusin", onFocusIn, true);
    view.addEventListener("scroll", schedule, true);
    view.addEventListener("resize", schedule);
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(schedule) : undefined;
    ro?.observe(pop);
    return () => {
      doc.removeEventListener("keydown", onKey);
      doc.removeEventListener("pointerdown", onPointer, true);
      doc.removeEventListener("focusin", onFocusIn, true);
      view.removeEventListener("scroll", schedule, true);
      view.removeEventListener("resize", schedule);
      ro?.disconnect();
      view.cancelAnimationFrame(frame);
      view.cancelAnimationFrame(focusFrame);
      // Focus left inside the popover as it goes would drop to <body>: send it back to the avatar
      if (pop.contains(doc.activeElement)) trigger.focus({ preventScroll: true });
      try {
        if (pop.matches(":popover-open")) pop.hidePopover();
      } catch {
        // Already gone
      }
    };
  }, [open, popRef, triggerRef]);
}

/**
 * The block's look: the `look` prop, else the nearest <LookProvider> (asked through the same context the elements
 * use, and followed when it changes), else the page's data-tc-look. Unset, the page's tokens apply as they are.
 */
function useLook(own: Look | undefined) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [inherited, setInherited] = useState<Look | undefined>(undefined);
  useLayoutEffect(() => {
    if (own || !node) return;
    let stop: (() => void) | undefined;
    let answered = false;
    const request = Object.assign(new Event("context-request", { bubbles: true, composed: true }), {
      context: lookContext,
      contextTarget: node,
      subscribe: true,
      callback: (value: Look | undefined, unsubscribe?: () => void) => {
        answered = true;
        stop = unsubscribe;
        setInherited(value);
      },
    });
    node.dispatchEvent(request);
    if (!answered) {
      const page = node.parentElement?.closest("[data-look], [data-tc-look]");
      const value = page?.getAttribute("data-look") ?? page?.getAttribute("data-tc-look");
      setInherited(value === "clean" || value === "standard" ? value : undefined);
    }
    return () => stop?.();
  }, [own, node]);
  return [own ?? inherited, setNode] as const;
}

/** A value prop with its change handler: controlled when `value` is defined. `latest` reads the value between renders */
function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (next: T) => void, name?: string) {
  const controlled = value !== undefined;
  const warned = useRef(false);
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.NODE_ENV;
  if (controlled && !onChange && !warned.current && env !== "production") {
    warned.current = true;
    console.warn(
      `Trenchcoat: ${name ? `\`${name}\`` : "a value prop"} is set without its change handler, so it can't change. ` +
        "Pass the handler to control it, or use the default… prop for a starting value.",
    );
  }
  const [own, setOwn] = useState(defaultValue);
  const current = controlled ? value : own;
  const latest = useRef(current);
  latest.current = current;
  const report = useRef(onChange);
  report.current = onChange;
  const set = useCallback(
    (next: T) => {
      if (Object.is(next, latest.current)) return;
      if (!controlled) setOwn(next);
      latest.current = next;
      report.current?.(next);
    },
    [controlled],
  );
  return [current, set, latest] as const;
}

/* ---------- Styles ---------- */

const css = /* css */ `
.ui-hn {
  --tc-header-nav-ring: var(--tc-surface-raised, light-dark(#ffffff, #19191b));
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: var(--tc-space-1, 4px);
  min-width: 0;
  font-family: var(--tc-font-sans, "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  -webkit-font-smoothing: antialiased;
}
.ui-hn > tc-notifications, .ui-hn > tc-app-picker { flex: none; }
.ui-hn__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

/* The hairline before the avatar */
.ui-hn__sep { flex: none; width: var(--tc-hairline, 1px); height: var(--tc-space-5, 20px); margin: 0 var(--tc-space-1, 4px); background: var(--tc-border-default, light-dark(#ececec, #2a2a2e)); }

/* The avatar button: the same round ghost button as the bell and the picker */
.ui-hn__me {
  position: relative;
  display: inline-grid;
  flex: none;
  place-items: center;
  width: var(--tc-control-h-md, 32px);
  height: var(--tc-control-h-md, 32px);
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: var(--tc-radius-full, 999px);
  background: none;
  color: var(--tc-action-ghost-fg, light-dark(#404040, #c8c8cc));
  font: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background-color var(--tc-duration-fast, 150ms) var(--tc-ease-standard, ease);
}
.ui-hn__me:hover, .ui-hn__me[aria-expanded="true"] { background: var(--tc-action-ghost-bg-hover, light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.07))); }
.ui-hn__me:focus-visible { outline: var(--tc-focus-outline, 2px solid light-dark(#2f68ff, #6b95ff)); outline-offset: var(--tc-focus-ring-offset, 2px); }

/* The face: a photo, or initials on a tone */
.ui-hn__face {
  display: grid;
  place-items: center;
  box-sizing: border-box;
  width: var(--tc-control-h-sm, 28px);
  height: var(--tc-control-h-sm, 28px);
  overflow: hidden;
  border-radius: var(--tc-radius-full, 999px);
  background: var(--tc-tone-teal-bg, light-dark(#e3f6f4, rgba(79, 209, 197, 0.14)));
  color: var(--tc-tone-teal-fg, light-dark(#0b6f67, #4fd1c5));
  font-size: var(--tc-font-size-xs, 11px);
  font-weight: var(--tc-font-weight-semibold, 600);
  line-height: var(--tc-line-height-none, 1);
  letter-spacing: 0;
  white-space: nowrap;
  user-select: none;
  object-fit: cover;
}
.ui-hn[data-look="clean"] .ui-hn__face, [data-look="clean"] .ui-pm__avatar > .ui-hn__face { font-weight: var(--tc-font-weight-medium, 500); }
.ui-hn__face::before { content: attr(data-initials); content: attr(data-initials) / ""; }
img.ui-hn__face { display: block; }
.ui-hn__face[data-tone="accent"] { background: var(--tc-accent-subtle, light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16))); color: var(--tc-accent-text, light-dark(#2456d6, #8ab4ff)); }
.ui-hn__face[data-tone="violet"] { background: var(--tc-tone-violet-bg, light-dark(rgba(105, 65, 198, 0.1), rgba(150, 110, 240, 0.16))); color: var(--tc-tone-violet-fg, light-dark(#6941c6, #b9a2f5)); }
.ui-hn__face[data-tone="amber"] { background: var(--tc-tone-amber-bg, light-dark(rgba(245, 165, 36, 0.12), rgba(245, 165, 36, 0.14))); color: var(--tc-tone-amber-fg, light-dark(#a35200, #ffa057)); }
.ui-hn__face[data-tone="pink"] { background: var(--tc-tone-pink-bg, light-dark(rgba(236, 72, 153, 0.1), rgba(244, 114, 182, 0.16))); color: var(--tc-tone-pink-fg, light-dark(#be185d, #f9a8d4)); }
.ui-hn__face[data-tone="rose"] { background: var(--tc-tone-rose-bg, light-dark(#fff0f3, rgba(251, 113, 133, 0.16))); color: var(--tc-tone-rose-fg, light-dark(#be123c, #fda4af)); }
/* In the account card the face fills the card's avatar box */
.ui-pm__avatar > .ui-hn__face { display: grid; width: 100%; height: 100%; font-size: var(--tc-font-size-lg, 14px); }

/* Presence: a dot on the avatar's bottom corner, ringed in the header's colour like the bell's badge */
.ui-hn__dot {
  position: absolute;
  right: 1px;
  bottom: 1px;
  width: 8px;
  height: 8px;
  border-radius: var(--tc-radius-full, 999px);
  background: var(--tc-status-success-solid, light-dark(#1f8a4c, #3ec27a));
  box-shadow: 0 0 0 2px var(--tc-header-nav-ring);
}
.ui-hn__dot[data-presence="away"] { background: var(--tc-status-warning-solid, light-dark(#c2710c, #f5a524)); }
.ui-hn__dot[data-presence="busy"] { background: var(--tc-status-danger-solid, light-dark(#e5484d, #ff6369)); }
.ui-hn__dot[data-presence="offline"] { background: var(--tc-surface-raised, light-dark(#ffffff, #19191b)); box-shadow: inset 0 0 0 1.5px var(--tc-icon-muted, light-dark(#858585, #7c7c82)), 0 0 0 2px var(--tc-header-nav-ring); }

/* The account popover: the card brings its own surface – Standard's gray tray, Clean's white menu card */
.ui-hn__pop {
  position: fixed;
  inset: auto;
  top: 0;
  left: 0;
  z-index: var(--tc-z-popover, 35);
  box-sizing: border-box;
  width: min(300px, calc(100vw - 2 * var(--tc-space-2, 8px)));
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  overflow: visible;
  border-radius: var(--tc-tray-radius, calc(16px + 4px));
  background: transparent;
  box-shadow: var(--tc-shadow-overlay, 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 16px 36px -12px light-dark(rgba(0, 0, 0, 0.22), rgba(0, 0, 0, 0.6)));
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  font-family: var(--tc-font-sans, "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
}
.ui-hn[data-look="clean"] .ui-hn__pop { width: min(260px, calc(100vw - 2 * var(--tc-space-2, 8px))); border-radius: var(--tc-menu-radius, 12px); box-shadow: none; }
.ui-hn__pop:focus { outline: none; }
.ui-hn__pop:not([data-placed]) { visibility: hidden; }
.ui-hn__pop[data-placed] { animation: ui-hn-in var(--tc-duration-fast, 150ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1)) both; }
.ui-hn__pop[data-side="top"] { --tc-header-nav-from: translateY(4px); }
.ui-hn__pop > tc-profile-menu { display: block; max-width: none; }
@keyframes ui-hn-in { from { opacity: 0; transform: var(--tc-header-nav-from, translateY(-4px)) scale(0.98); } }

@media (prefers-reduced-motion: reduce) {
  .ui-hn__me { transition: none; }
  .ui-hn__pop[data-placed] { animation: none; }
}
@media (forced-colors: active) {
  .ui-hn__sep { background: CanvasText; }
  .ui-hn__dot { forced-color-adjust: none; background: CanvasText; box-shadow: none; }
  .ui-hn__pop { border: 1px solid CanvasText; border-radius: 0; }
}
`;
