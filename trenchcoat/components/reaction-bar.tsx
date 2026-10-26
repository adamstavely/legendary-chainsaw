"use client";

/*
 * Reaction Bar – like, comment, repost and share in one pill, in a single self-contained file.
 * Tapping an action colors its icon with a small pop, and its count rolls in digit by digit while the pill
 * glides to its new width. The styles are injected below, so no extra files are needed.
 *
 * Two looks, picked with the `look` prop (the default comes from the file: reaction-bar.tsx is Standard,
 * reaction-bar-clean.tsx is Clean). Clean is a row of quiet chips with smaller icons: a taken action marks its chip
 * with a light blue tint instead of coloring the icon per action.
 */
// Generated from src/components/reaction-bar.tsx by scripts/build-lib.mjs – edit the source, not this file.

import { useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef, type ReactNode, type Ref } from "react";

export type Look = "standard" | "clean";
const DEFAULT_LOOK: Look = "standard";
const ROOT_CLASS = "ui-rb";

export type ReactionKey = "like" | "comment" | "repost" | "share";

export type ReactionState = { count: number; active?: boolean };

type ReactionBarOwnProps = {
  /**
   * Counts and whether each action is already taken. The bar follows this prop: a tap changes an action locally
   * until the prop's value for that action changes, which then wins. To own the state, update it from `onReact`.
   */
  reactions?: Partial<Record<ReactionKey, ReactionState>>;
  /** Called after an action was toggled, with its new state */
  onReact?: (key: ReactionKey, state: Required<ReactionState>) => void;
  /** Hide actions you don't need – the list may change after mount */
  actions?: ReactionKey[];
  className?: string;
  /** Visual style. Defaults to the file's look: Standard in reaction-bar.tsx, Clean in reaction-bar-clean.tsx */
  look?: Look;
  ref?: Ref<HTMLDivElement>;
};

export type ReactionBarProps = Omit<ComponentPropsWithoutRef<"div">, keyof ReactionBarOwnProps> & ReactionBarOwnProps;

const labels: Record<ReactionKey, [string, string]> = {
  like: ["Like", "likes"],
  comment: ["Comment", "comments"],
  repost: ["Repost", "reposts"],
  share: ["Share", "shares"],
};

/** 1234 → "1.2K", like social apps */
const short = (n: number) =>
  n >= 1_000_000 ? `${+(n / 1_000_000).toFixed(1)}M` : n >= 10_000 ? `${Math.round(n / 1000)}K` : n >= 1000 ? `${+(n / 1000).toFixed(1)}K` : `${n}`;

const NO_REACTIONS: Partial<Record<ReactionKey, ReactionState>> = {};
const ALL_ACTIONS: ReactionKey[] = ["like", "comment", "repost", "share"];

/** What the prop says about one action, as a comparable string */
const signature = (r: ReactionState | undefined) => `${r?.count ?? 0}|${r?.active ?? false}`;

/** A local tap, remembered together with the prop value it was made on */
type Tap = { base: string; state: Required<ReactionState> };

export function ReactionBar({
  reactions = NO_REACTIONS,
  onReact,
  actions = ALL_ACTIONS,
  className,
  look,
  ref,
  ...rest
}: ReactionBarProps) {
  const resolvedLook = look ?? DEFAULT_LOOK;
  // Taps only override the prop while the prop still says what it said when the tap was made
  const [taps, setTaps] = useState<Partial<Record<ReactionKey, Tap>>>({});
  const [popped, setPopped] = useState<Record<string, number>>({});

  const stateOf = (key: ReactionKey): Required<ReactionState> => {
    const base = signature(reactions[key]);
    const tap = taps[key];
    if (tap && tap.base === base) return tap.state;
    return { count: reactions[key]?.count ?? 0, active: reactions[key]?.active ?? false };
  };

  const toggle = (key: ReactionKey) => {
    const cur = stateOf(key);
    const next = { active: !cur.active, count: Math.max(0, cur.count + (cur.active ? -1 : 1)) };
    setTaps((t) => {
      // Drop taps the prop has since replaced
      const kept = Object.fromEntries(Object.entries(t).filter(([k, v]) => v.base === signature(reactions[k as ReactionKey])));
      return { ...kept, [key]: { base: signature(reactions[key]), state: next } };
    });
    // A new key restarts the pop animation on every tap
    setPopped((p) => ({ ...p, [key]: (p[key] ?? 0) + 1 }));
    onReact?.(key, next);
  };

  return (
    <>
      <style href="ui-reaction-bar" precedence="default">
        {css}
      </style>
      <div
        role="group"
        aria-label="Reactions"
        {...rest}
        ref={ref}
        className={[ROOT_CLASS, className].filter(Boolean).join(" ")}
        data-look={resolvedLook}
      >
        {actions.map((key) => {
          const { count, active } = stateOf(key);
          const [verb, noun] = labels[key];
          return (
            <button
              key={key}
              type="button"
              className="ui-rb__btn"
              data-kind={key}
              aria-pressed={active}
              // The name carries the count as shown ("1.2K"), so speech input can say what it sees (WCAG 2.5.3)
              aria-label={`${verb}${count ? `, ${short(count)} ${count === 1 ? noun.slice(0, -1) : noun}` : ""}`}
              title={count >= 1000 ? `${count.toLocaleString("en-US")} ${noun}` : undefined}
              onClick={() => toggle(key)}
            >
              <span className="ui-rb__icon" key={popped[key] ?? 0} data-pop={popped[key] ? true : undefined}>
                <Svg look={resolvedLook}>{icons[key]}</Svg>
              </span>
              <Count value={count} />
            </button>
          );
        })}
      </div>
    </>
  );
}

/** The count glides to its new width; each changed digit rolls in from below */
function Count({ value }: { value: number }) {
  const text = value > 0 ? short(value) : "";
  const outer = useRef<HTMLSpanElement>(null);
  const inner = useRef<HTMLSpanElement>(null);

  // One read, then one write per change of the text; the width only glides from the second value on
  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    o.style.width = `${i.offsetWidth}px`;
    if (o.hasAttribute("data-smooth")) return;
    const frame = requestAnimationFrame(() => o.setAttribute("data-smooth", ""));
    return () => cancelAnimationFrame(frame);
  }, [text]);

  return (
    <span className="ui-rb__count" ref={outer} aria-hidden="true">
      <span className="ui-rb__digits" ref={inner}>
        {text.split("").map((d, i) => (
          <span key={`${text.length - i}-${d}`} className="ui-rb__digit">
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

/* ---------- Icons (stroke, rounded) ---------- */

const Svg = ({ children, look }: { children: ReactNode; look: Look }) => (
  <svg
    viewBox="0 0 24 24"
    width={look === "clean" ? 16 : 22}
    height={look === "clean" ? 16 : 22}
    fill="none"
    stroke="currentColor"
    strokeWidth={look === "clean" ? "1.65" : "1.6"}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

/** The icons' strokes – drawn inside <Svg>, sized for the look */
const icons: Record<ReactionKey, ReactNode> = {
  like: (
    <>
      <path className="ui-rb__fill" d="M19.46 4c-2.68-1.65-5.02-.99-6.43.07-.57.43-.86.65-1.03.65s-.46-.22-1.03-.65C9.56 3.01 7.22 2.35 4.54 4 1.02 6.15.22 13.27 8.34 19.28 9.89 20.43 10.66 21 12 21s2.11-.57 3.66-1.72C23.78 13.27 22.98 6.15 19.46 4Z" />
    </>
  ),
  comment: (
    <>
      <path className="ui-rb__fill" d="M12 21.5c5.52 0 10-4.25 10-9.5S17.52 2.5 12 2.5 2 6.75 2 12c0 1.36.3 2.65.84 3.82.15.31.2.66.1 1l-.6 2.23a1.08 1.08 0 0 0 1.6 1.59l2.22-.6c.34-.09.69-.04 1 .1 1.17.55 2.46.86 4.84.86Z" />
    </>
  ),
  repost: (
    <>
      <path d="M16.5 3.5 19 6l-2.5 2.5" />
      <path d="M19 6H8a4 4 0 0 0-4 4v1" />
      <path d="M7.5 20.5 5 18l2.5-2.5" />
      <path d="M5 18h11a4 4 0 0 0 4-4v-1" />
    </>
  ),
  share: (
    <>
      <path d="M21 3 10.5 13.5" />
      <path d="M21 3 14.6 20.6a.5.5 0 0 1-.93.05L10.5 13.5 3.35 10.33a.5.5 0 0 1 .05-.93Z" />
    </>
  ),
};

/* ---------- Styles ---------- */

const css = /* css */ `
/* Fallbacks so this file works without tokens.css – tokens.css, when loaded, takes precedence */
.ui-rb:where([data-look="standard"]),
.ui-rb__portal:where([data-look="standard"]) {
  --_tc-accent-subtle: light-dark(rgba(47, 107, 255, 0.08), rgba(79, 130, 255, 0.16));
  --_tc-accent-text: light-dark(#2456d6, #8ab4ff);
  --_tc-border-default: light-dark(#ececec, #2a2a2e);
  --_tc-border-selected: light-dark(#2f68ff, #6b95ff);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.04), rgba(255, 255, 255, 0.05));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#2f68ff, #6b95ff);
  --_tc-focus-ring-offset: 2px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-md: 13px;
  --_tc-font-weight-medium: 500;
  --_tc-hairline: 1px;
  --_tc-icon-muted: light-dark(#858585, #7c7c82);
  --_tc-line-height-normal: 20px;
  --_tc-radius-full: 999px;
  --_tc-radius-sm: 6px;
  --_tc-shadow-raised: 0 0 0 1px light-dark(#ececec, #2a2a2e), 0 1px 2px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-status-info-solid: light-dark(#2f68ff, #6b95ff);
  --_tc-surface-overlay: light-dark(#ffffff, #232326);
  --_tc-text-primary: light-dark(#171717, #ededed);
  --_tc-text-secondary: light-dark(#404040, #c8c8cc);
  --_tc-tone-pink-solid: light-dark(#ec4899, #f472b6);
  --_tc-tone-violet-solid: light-dark(#8b5cf6, #a78bfa);
}
.ui-rb:where([data-look="clean"]),
.ui-rb__portal:where([data-look="clean"]) {
  --_tc-accent-subtle: light-dark(rgba(0, 96, 226, 0.06), rgba(77, 141, 255, 0.14));
  --_tc-accent-text: light-dark(#0058cf, #70b8ff);
  --_tc-border-default: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  --_tc-border-selected: light-dark(#0060e2, #5b9aff);
  --_tc-duration-base: 200ms;
  --_tc-duration-fast: 150ms;
  --_tc-duration-instant: 90ms;
  --_tc-duration-slow: 320ms;
  --_tc-duration-slower: 420ms;
  --_tc-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --_tc-ease-standard: ease;
  --_tc-fill-hover: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-fill-subtle: light-dark(rgba(0, 0, 0, 0.03), rgba(255, 255, 255, 0.04));
  --_tc-focus-outline: 2px solid light-dark(#0060e2, #5b9aff);
  --_tc-focus-ring-offset: 1px;
  --_tc-font-sans: "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --_tc-font-size-lg: 14px;
  --_tc-font-size-md: 13px;
  --_tc-font-weight-medium: 500;
  --_tc-hairline: 0.5px;
  --_tc-icon-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.46));
  --_tc-line-height-normal: 20px;
  --_tc-radius-full: 999px;
  --_tc-radius-sm: 6px;
  --_tc-shadow-raised: 0 0 0 0.5px light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08)), 0 1px 1px -1px light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4)), 0 1px 2px 0 light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.4));
  --_tc-space-0-5: 2px;
  --_tc-space-1: 4px;
  --_tc-space-1-5: 6px;
  --_tc-space-2: 8px;
  --_tc-space-2-5: 10px;
  --_tc-status-info-solid: light-dark(#0060e2, #5b9aff);
  --_tc-surface-overlay: light-dark(#ffffff, #252527);
  --_tc-text-primary: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.9));
  --_tc-text-secondary: light-dark(rgba(0, 0, 0, 0.68), rgba(255, 255, 255, 0.66));
  --_tc-tone-pink-solid: light-dark(#ec4899, #f472b6);
  --_tc-tone-violet-solid: light-dark(#8b5cf6, #a78bfa);
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

:where([data-look="standard"], [data-look="standard"] *).ui-rb {
  --tc-reaction-bar-ease: cubic-bezier(0.85, 0, 0.15, 1);
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-0-5, var(--_tc-space-0-5));
  padding: var(--tc-space-1, var(--_tc-space-1)) var(--tc-space-2-5, var(--_tc-space-2-5));
  border-radius: var(--tc-radius-full, var(--_tc-radius-full));
  background: var(--tc-surface-overlay, var(--_tc-surface-overlay));
  box-shadow: var(--tc-shadow-raised, var(--_tc-shadow-raised));
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *).ui-rb {
  --tc-reaction-bar-ease: cubic-bezier(0.85, 0, 0.15, 1);
  --tc-reaction-bar-h: 28px;
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1, var(--_tc-space-1));
  max-width: 100%;
  font-family: var(--tc-font-sans, var(--_tc-font-sans));
  font-size: var(--tc-font-size-md, var(--_tc-font-size-md));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  -webkit-font-smoothing: antialiased;
}
.ui-rb *, .ui-rb *::before, .ui-rb *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *).ui-rb__btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-width: 42px;
  height: 42px;
  margin: 0;
  padding: 0 var(--tc-space-2-5, var(--_tc-space-2-5));
  border: 0;
  border-radius: var(--tc-radius-full, var(--_tc-radius-full));
  background: transparent;
  font: inherit;
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  cursor: pointer;
  transition: background-color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
  -webkit-tap-highlight-color: transparent;
}
:where([data-look="standard"], [data-look="standard"] *).ui-rb__btn:hover { background: var(--tc-fill-hover, var(--_tc-fill-hover)); }
:where([data-look="standard"], [data-look="standard"] *).ui-rb__btn[data-kind="like"] { --tc-reaction-bar-tone: var(--tc-tone-pink-solid, var(--_tc-tone-pink-solid)); }
:where([data-look="standard"], [data-look="standard"] *).ui-rb__btn[data-kind="comment"] { --tc-reaction-bar-tone: var(--tc-status-info-solid, var(--_tc-status-info-solid)); }
:where([data-look="standard"], [data-look="standard"] *).ui-rb__btn[data-kind="repost"] { --tc-reaction-bar-tone: var(--tc-tone-violet-solid, var(--_tc-tone-violet-solid)); }
:where([data-look="standard"], [data-look="standard"] *).ui-rb__btn[data-kind="share"] { --tc-reaction-bar-tone: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="standard"], [data-look="standard"] *).ui-rb__icon { display: grid; place-items: center; flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-rb__icon svg { transition: color var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-rb__fill { fill: transparent; transition: fill var(--tc-duration-base, var(--_tc-duration-base)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="standard"], [data-look="standard"] *).ui-rb__btn[aria-pressed="true"] { color: var(--tc-reaction-bar-tone); }
/* Pressed is more than a colour (WCAG 1.4.1): the icon fills where it has a shape, and its line gets heavier */
:where([data-look="standard"], [data-look="standard"] *).ui-rb__btn[aria-pressed="true"] .ui-rb__icon svg { stroke-width: 2.2; }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-rb) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where([data-look="clean"], [data-look="clean"] *):where(.ui-rb) svg { display: block; flex: none; }
/* A chip: the tab-chip look – inset hairline, radius 6. Without a count it is a square-ish icon chip */
:where([data-look="clean"], [data-look="clean"] *).ui-rb__btn {
  position: relative;
  display: inline-flex;
  flex: none;
  align-items: center;
  height: var(--tc-reaction-bar-h);
  padding: 0 var(--tc-space-2, var(--_tc-space-2));
  border-radius: var(--tc-radius-sm, var(--_tc-radius-sm));
  box-shadow: inset 0 0 0 var(--tc-hairline, var(--_tc-hairline)) var(--tc-border-default, var(--_tc-border-default));
  color: var(--tc-text-secondary, var(--_tc-text-secondary));
  transition: background-color var(--tc-duration-instant, var(--_tc-duration-instant)) var(--tc-ease-standard, var(--_tc-ease-standard)), box-shadow var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)), color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard));
  -webkit-tap-highlight-color: transparent;
}
.ui-rb__btn:focus-visible { outline: var(--tc-focus-outline, var(--_tc-focus-outline)); outline-offset: var(--tc-focus-ring-offset, var(--_tc-focus-ring-offset)); }
@media (hover: hover) {
:where([data-look="clean"], [data-look="clean"] *).ui-rb__btn:hover { background-color: var(--tc-fill-subtle, var(--_tc-fill-subtle)); color: var(--tc-text-primary, var(--_tc-text-primary)); }
:where([data-look="clean"], [data-look="clean"] *).ui-rb__btn:hover .ui-rb__icon { color: var(--tc-text-primary, var(--_tc-text-primary)); }
}
/* Your own reaction: a minimal blue tint with a light blue hairline */
:where([data-look="clean"], [data-look="clean"] *).ui-rb__btn[aria-pressed="true"],
:where([data-look="clean"], [data-look="clean"] *).ui-rb__btn[aria-pressed="true"]:hover {
  background-color: var(--tc-accent-subtle, var(--_tc-accent-subtle));
  box-shadow: inset 0 0 0 1px var(--tc-border-selected, var(--_tc-border-selected));
  color: var(--tc-accent-text, var(--_tc-accent-text));
}
:where([data-look="clean"], [data-look="clean"] *).ui-rb__icon { display: grid; place-items: center; flex: none; width: 16px; height: 16px; color: var(--tc-icon-muted, var(--_tc-icon-muted)); transition: color var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-rb__fill { fill: transparent; transition: fill var(--tc-duration-fast, var(--_tc-duration-fast)) var(--tc-ease-standard, var(--_tc-ease-standard)); }
:where([data-look="clean"], [data-look="clean"] *).ui-rb__btn[aria-pressed="true"] .ui-rb__icon { color: var(--tc-accent-text, var(--_tc-accent-text)); }
.ui-rb__btn[aria-pressed="true"] .ui-rb__fill { fill: currentColor; }
/* Press pop: shrinks, springs past full size, settles */
.ui-rb__icon[data-pop] { animation: ui-rb-pop var(--tc-duration-slow, var(--_tc-duration-slow)) var(--tc-ease-in-out, var(--_tc-ease-in-out)); }
/* Count: the width glides, digits roll */
.ui-rb__count {
  display: inline-block;
  overflow: hidden;
  width: 0;
  height: 20px;
}
.ui-rb__count[data-smooth] { transition: width var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-reaction-bar-ease); }
:where([data-look="standard"], [data-look="standard"] *).ui-rb__digits {
  display: inline-flex;
  padding-left: var(--tc-space-1-5, var(--_tc-space-1-5));
  font-size: var(--tc-font-size-lg, var(--_tc-font-size-lg));
  font-weight: var(--tc-font-weight-medium, var(--_tc-font-weight-medium));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
:where([data-look="standard"], [data-look="standard"] *).ui-rb__digits:empty { padding-left: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-rb__digits {
  display: inline-flex;
  padding: 0 var(--tc-space-0-5, var(--_tc-space-0-5)) 0 var(--tc-space-1-5, var(--_tc-space-1-5));
  line-height: var(--tc-line-height-normal, var(--_tc-line-height-normal));
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
:where([data-look="clean"], [data-look="clean"] *).ui-rb__digits:empty { padding: 0; }
.ui-rb__digit { display: inline-block; animation: ui-rb-roll var(--tc-duration-slower, var(--_tc-duration-slower)) var(--tc-reaction-bar-ease) both; }
@keyframes ui-rb-pop {
  0% { transform: scale(1); }
  35% { transform: scale(0.75); }
  70% { transform: scale(1.12); }
  100% { transform: scale(1); }
}
@keyframes ui-rb-roll {
  from { opacity: 0; transform: translateY(70%); }
}
/* Touch screens: taller chips */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-rb { --tc-reaction-bar-h: 36px; gap: var(--tc-space-1-5, var(--_tc-space-1-5)); }
:where([data-look="clean"], [data-look="clean"] *).ui-rb__btn { padding: 0 var(--tc-space-2-5, var(--_tc-space-2-5)); }
}
@media (prefers-reduced-motion: reduce) {
  .ui-rb__icon[data-pop], .ui-rb__digit { animation: none; }
  .ui-rb__count[data-smooth] { transition: none; }
}
`;
