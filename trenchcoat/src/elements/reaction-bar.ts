import { html, svg, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import type { Look } from "./internal/look";

/*
 * <tc-reaction-bar> – the Lit port of src/components/reaction-bar.tsx: like, comment, repost and share in one pill.
 * Tapping an action colours its icon with a small pop, and its count rolls in digit by digit while the count glides
 * to its new width. Clean is a row of quiet chips with smaller icons: a taken action gets a light blue tint.
 *
 *   <tc-reaction-bar .reactions=${{ like: { count: 3 } }} .actions=${["like", "share"]}></tc-reaction-bar>
 *
 * The host is the group ("Reactions"). The bar follows `reactions`: a tap changes an action locally until the
 * property's value for that action changes, which then wins. Each tap fires a cancelable `tc-reaction-change`
 * ({ key, state }); preventDefault() keeps the tap from applying.
 */

export type ReactionKey = "like" | "comment" | "repost" | "share";
export type ReactionState = { count: number; active?: boolean };
export type ReactionChange = { key: ReactionKey; state: Required<ReactionState> };

const labels: Record<ReactionKey, [string, string]> = {
  like: ["Like", "likes"],
  comment: ["Comment", "comments"],
  repost: ["Repost", "reposts"],
  share: ["Share", "shares"],
};

/** 1234 → "1.2K", like social apps */
const short = (n: number) =>
  n >= 1_000_000 ? `${+(n / 1_000_000).toFixed(1)}M` : n >= 10_000 ? `${Math.round(n / 1000)}K` : n >= 1000 ? `${+(n / 1000).toFixed(1)}K` : `${n}`;

const ALL_ACTIONS: ReactionKey[] = ["like", "comment", "repost", "share"];

/** What the property says about one action, as a comparable string */
const signature = (r: ReactionState | undefined) => `${r?.count ?? 0}|${r?.active ?? false}`;

/** A local tap, remembered together with the property value it was made on */
type Tap = { base: string; state: Required<ReactionState> };

/** The icons' strokes – drawn inside the svg, sized for the look */
const icons: Record<ReactionKey, TemplateResult> = {
  like: svg`<path class="ui-rb__fill" d="M19.46 4c-2.68-1.65-5.02-.99-6.43.07-.57.43-.86.65-1.03.65s-.46-.22-1.03-.65C9.56 3.01 7.22 2.35 4.54 4 1.02 6.15.22 13.27 8.34 19.28 9.89 20.43 10.66 21 12 21s2.11-.57 3.66-1.72C23.78 13.27 22.98 6.15 19.46 4Z"></path>`,
  comment: svg`<path class="ui-rb__fill" d="M12 21.5c5.52 0 10-4.25 10-9.5S17.52 2.5 12 2.5 2 6.75 2 12c0 1.36.3 2.65.84 3.82.15.31.2.66.1 1l-.6 2.23a1.08 1.08 0 0 0 1.6 1.59l2.22-.6c.34-.09.69-.04 1 .1 1.17.55 2.46.86 4.84.86Z"></path>`,
  repost: svg`<path d="M16.5 3.5 19 6l-2.5 2.5"></path><path d="M19 6H8a4 4 0 0 0-4 4v1"></path><path d="M7.5 20.5 5 18l2.5-2.5"></path><path d="M5 18h11a4 4 0 0 0 4-4v-1"></path>`,
  share: svg`<path d="M21 3 10.5 13.5"></path><path d="M21 3 14.6 20.6a.5.5 0 0 1-.93.05L10.5 13.5 3.35 10.33a.5.5 0 0 1 .05-.93Z"></path>`,
};

const icon = (key: ReactionKey, look: Look) => {
  const clean = look === "clean";
  return html`<svg viewBox="0 0 24 24" width=${clean ? 16 : 22} height=${clean ? 16 : 22} fill="none" stroke="currentColor" stroke-width=${clean ? "1.65" : "1.6"} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[key]}</svg>`;
};

/**
 * Like, comment, repost and share in one pill, with rolling counts.
 * @tag tc-reaction-bar
 * @fires tc-reaction-change - An action was toggled; detail `{ key: ReactionKey, state: { count, active } }`. Cancelable: preventDefault() keeps the tap from applying.
 */
export class TcReactionBar extends TcElement {
  static override ui = "rb";

  /** Counts and whether each action is already taken; a tap applies locally until an action's value here changes */
  @property({ attribute: false }) accessor reactions: Partial<Record<ReactionKey, ReactionState>> = {};
  /** The actions to show, in order */
  @property({ attribute: false }) accessor actions: ReactionKey[] = ALL_ACTIONS;

  @state() private accessor taps: Partial<Record<ReactionKey, Tap>> = {};
  @state() private accessor popped: Partial<Record<ReactionKey, number>> = {};

  /** The text each count was last measured for, and the frames that switch the width glide on */
  private measured = new WeakMap<HTMLElement, string>();
  private frames = new Set<number>();

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-label", "Reactions");
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.frames.forEach((f) => cancelAnimationFrame(f));
    this.frames.clear();
  }

  /** @internal An action's current state: the tap while the property still says what it said then */
  stateOf(key: ReactionKey): Required<ReactionState> {
    const r = this.reactions?.[key];
    const tap = this.taps[key];
    if (tap && tap.base === signature(r)) return tap.state;
    return { count: r?.count ?? 0, active: r?.active ?? false };
  }

  private toggle(key: ReactionKey) {
    const cur = this.stateOf(key);
    const next = { active: !cur.active, count: Math.max(0, cur.count + (cur.active ? -1 : 1)) };
    if (!this.emit<ReactionChange>("tc-reaction-change", { key, state: next }, { cancelable: true })) return;
    // Drop taps the property has since replaced
    const kept = Object.fromEntries(Object.entries(this.taps).filter(([k, v]) => v.base === signature(this.reactions?.[k as ReactionKey])));
    this.taps = { ...kept, [key]: { base: signature(this.reactions?.[key]), state: next } };
    // A new key restarts the pop animation on every tap
    this.popped = { ...this.popped, [key]: (this.popped[key] ?? 0) + 1 };
  }

  protected override updated() {
    // The count glides to its new width: one read, then one write per change of the text; the glide starts from the
    // second value on
    this.querySelectorAll<HTMLElement>(".ui-rb__count").forEach((outer) => {
      const inner = outer.firstElementChild as HTMLElement | null;
      const text = inner?.textContent ?? "";
      if (!inner || this.measured.get(outer) === text) return;
      this.measured.set(outer, text);
      outer.style.width = `${inner.offsetWidth}px`;
      if (outer.hasAttribute("data-smooth")) return;
      const f = requestAnimationFrame(() => {
        this.frames.delete(f);
        outer.setAttribute("data-smooth", "");
      });
      this.frames.add(f);
    });
  }

  protected override render() {
    const look = this.resolvedLook;
    return repeat(
      this.actions ?? ALL_ACTIONS,
      (key) => key,
      (key) => {
        const { count, active } = this.stateOf(key);
        const [verb, noun] = labels[key];
        const text = count > 0 ? short(count) : "";
        const pop = this.popped[key] ?? 0;
        // The name carries the count as shown ("1.2K"), so speech input can say what it sees (WCAG 2.5.3)
        return html`<button
          type="button"
          class="ui-rb__btn"
          data-kind=${key}
          aria-pressed=${active ? "true" : "false"}
          aria-label=${`${verb}${count ? `, ${short(count)} ${count === 1 ? noun.slice(0, -1) : noun}` : ""}`}
          title=${ifDefined(count >= 1000 ? `${count.toLocaleString("en-US")} ${noun}` : undefined)}
          @click=${() => this.toggle(key)}
        >
          ${keyed(pop, html`<span class="ui-rb__icon" ?data-pop=${pop > 0}>${icon(key, look)}</span>`)}
          <span class="ui-rb__count" aria-hidden="true"
            ><span class="ui-rb__digits">${repeat(
              text.split(""),
              (d, i) => `${text.length - i}-${d}`,
              (d) => html`<span class="ui-rb__digit">${d}</span>`,
            )}</span></span
          >
        </button>`;
      },
    );
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rb"] {
  --tc-reaction-bar-ease: cubic-bezier(0.85, 0, 0.15, 1);
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-0-5);
  padding: var(--tc-space-1) var(--tc-space-2-5);
  border-radius: var(--tc-radius-full);
  background: var(--tc-surface-overlay);
  box-shadow: var(--tc-shadow-raised);
  font-family: var(--tc-font-sans);
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rb"] {
  --tc-reaction-bar-ease: cubic-bezier(0.85, 0, 0.15, 1);
  --tc-reaction-bar-h: 28px;
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1);
  max-width: 100%;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="rb"] *, [data-ui="rb"] *::before, [data-ui="rb"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *).ui-rb__btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-width: 42px;
  height: 42px;
  margin: 0;
  padding: 0 var(--tc-space-2-5);
  border: 0;
  border-radius: var(--tc-radius-full);
  background: transparent;
  font: inherit;
  color: var(--tc-text-secondary);
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
  -webkit-tap-highlight-color: transparent;
}
:where([data-look="standard"], [data-look="standard"] *).ui-rb__btn:hover { background: var(--tc-fill-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-rb__btn[data-kind="like"] { --tc-reaction-bar-tone: var(--tc-tone-pink-solid); }
:where([data-look="standard"], [data-look="standard"] *).ui-rb__btn[data-kind="comment"] { --tc-reaction-bar-tone: var(--tc-status-info-solid); }
:where([data-look="standard"], [data-look="standard"] *).ui-rb__btn[data-kind="repost"] { --tc-reaction-bar-tone: var(--tc-tone-violet-solid); }
:where([data-look="standard"], [data-look="standard"] *).ui-rb__btn[data-kind="share"] { --tc-reaction-bar-tone: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-rb__icon { display: grid; place-items: center; flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-rb__icon svg { transition: color var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-rb__fill { fill: transparent; transition: fill var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-rb__btn[aria-pressed="true"] { color: var(--tc-reaction-bar-tone); }
/* Pressed is more than a colour (WCAG 1.4.1): the icon fills where it has a shape, and its line gets heavier */
:where([data-look="standard"], [data-look="standard"] *).ui-rb__btn[aria-pressed="true"] .ui-rb__icon svg { stroke-width: 2.2; }
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="rb"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="rb"]) svg { display: block; flex: none; }
/* A chip: the tab-chip look – inset hairline, radius 6. Without a count it is a square-ish icon chip */
:where([data-look="clean"], [data-look="clean"] *).ui-rb__btn {
  position: relative;
  display: inline-flex;
  flex: none;
  align-items: center;
  height: var(--tc-reaction-bar-h);
  padding: 0 var(--tc-space-2);
  border-radius: var(--tc-radius-sm);
  box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default);
  color: var(--tc-text-secondary);
  transition: background-color var(--tc-duration-instant) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
  -webkit-tap-highlight-color: transparent;
}
.ui-rb__btn:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
@media (hover: hover) {
:where([data-look="clean"], [data-look="clean"] *).ui-rb__btn:hover { background-color: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-rb__btn:hover .ui-rb__icon { color: var(--tc-text-primary); }
}
/* Your own reaction: a minimal blue tint with a light blue hairline */
:where([data-look="clean"], [data-look="clean"] *).ui-rb__btn[aria-pressed="true"],
:where([data-look="clean"], [data-look="clean"] *).ui-rb__btn[aria-pressed="true"]:hover {
  background-color: var(--tc-accent-subtle);
  box-shadow: inset 0 0 0 1px var(--tc-border-selected);
  color: var(--tc-accent-text);
}
:where([data-look="clean"], [data-look="clean"] *).ui-rb__icon { display: grid; place-items: center; flex: none; width: 16px; height: 16px; color: var(--tc-icon-muted); transition: color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-rb__fill { fill: transparent; transition: fill var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-rb__btn[aria-pressed="true"] .ui-rb__icon { color: var(--tc-accent-text); }
.ui-rb__btn[aria-pressed="true"] .ui-rb__fill { fill: currentColor; }
/* Press pop: shrinks, springs past full size, settles */
.ui-rb__icon[data-pop] { animation: ui-rb-pop var(--tc-duration-slow) var(--tc-ease-in-out); }
/* Count: the width glides, digits roll */
.ui-rb__count {
  display: inline-block;
  overflow: hidden;
  width: 0;
  height: 20px;
}
.ui-rb__count[data-smooth] { transition: width var(--tc-duration-slower) var(--tc-reaction-bar-ease); }
:where([data-look="standard"], [data-look="standard"] *).ui-rb__digits {
  display: inline-flex;
  padding-left: var(--tc-space-1-5);
  font-size: var(--tc-font-size-lg);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
:where([data-look="standard"], [data-look="standard"] *).ui-rb__digits:empty { padding-left: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-rb__digits {
  display: inline-flex;
  padding: 0 var(--tc-space-0-5) 0 var(--tc-space-1-5);
  line-height: var(--tc-line-height-normal);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
:where([data-look="clean"], [data-look="clean"] *).ui-rb__digits:empty { padding: 0; }
.ui-rb__digit { display: inline-block; animation: ui-rb-roll var(--tc-duration-slower) var(--tc-reaction-bar-ease) both; }
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rb"] { --tc-reaction-bar-h: 36px; gap: var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-rb__btn { padding: 0 var(--tc-space-2-5); }
}
@media (prefers-reduced-motion: reduce) {
  .ui-rb__icon[data-pop], .ui-rb__digit { animation: none; }
  .ui-rb__count[data-smooth] { transition: none; }
}
`;
}

if (!customElements.get("tc-reaction-bar")) customElements.define("tc-reaction-bar", TcReactionBar);

declare global {
  interface HTMLElementTagNameMap {
    "tc-reaction-bar": TcReactionBar;
  }
}
