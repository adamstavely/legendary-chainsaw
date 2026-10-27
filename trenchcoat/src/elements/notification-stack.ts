import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, rescueFocus } from "./internal/controllers";
import type { Look } from "./internal/look";

/*
 * <tc-notification-stack> – the Lit port of src/components/notification-stack.tsx: notices stacked behind each other.
 * Only the front card can be read; the others peek out below it. Dismissing the front card slides it away and the
 * next one moves up – one notice at a time. Clean draws one white card per notice with hairline shadows.
 *
 *   <tc-notification-stack .notices=${[{ id: "a", title: "Maintenance", text: "Sunday 02:00 UTC" }]}></tc-notification-stack>
 *
 * The host is the region (role="region", named "Notifications" unless the page names it). The stack follows
 * `notices`: a notice the user dismissed stays hidden while it is still listed; one that leaves the list and comes
 * back shows again. Dismissals are announced in one persistent status line.
 */

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

const PEEK = 12; // how far each card behind peeks out below the one in front, in px
const EXIT_MS = 320;
const FRONT_CLOSE = '.ui-ns__card[data-depth="0"] .ui-ns__close';

/** Quiet line art for the top-right corner – fades out towards the text */
const pattern = (kind: NoticePattern) => html`<svg class="ui-ns__pattern" viewBox="0 0 220 160" fill="none" aria-hidden="true">
  ${kind === "orbit"
    ? svg`<circle cx="190" cy="10" r="46"></circle><circle cx="190" cy="10" r="86"></circle><circle cx="190" cy="10" r="128"></circle><path d="M60 160 220 0M0 58h220M150 0v160"></path><circle cx="150" cy="58" r="3.5" class="ui-ns__dot"></circle>`
    : kind === "grid"
      ? svg`${[30, 60, 90, 120, 150, 180, 210].map((x) => svg`<path d=${`M${x} 0v160`}></path>`)}${[20, 50, 80, 110, 140].map((y) => svg`<path d=${`M0 ${y}h220`}></path>`)}<rect x="150" y="50" width="30" height="30" class="ui-ns__fill"></rect><circle cx="180" cy="50" r="3.5" class="ui-ns__dot"></circle>`
      : svg`${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => svg`<path d=${`M210 6 L${210 - Math.cos((i * Math.PI) / 16) * 230} ${6 + Math.sin((i * Math.PI) / 16) * 230}`}></path>`)}<path d="M120 6a90 90 0 0 0 90 90"></path><circle cx="146" cy="70" r="3.5" class="ui-ns__dot"></circle>`}
</svg>`;

const closeIcon = (look: Look) =>
  html`<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width=${look === "clean" ? "1.1" : "1.4"} stroke-linecap="round" aria-hidden="true">${svg`<path d="m4 4 8 8M12 4l-8 8"></path>`}</svg>`;

const arrowIcon = (look: Look) =>
  html`<svg viewBox="0 0 16 16" width=${look === "clean" ? 16 : 14} height=${look === "clean" ? 16 : 14} fill="none" stroke="currentColor" stroke-width=${look === "clean" ? "1.1" : "1.4"} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="M5 11 11 5M6 5h5v5"></path>`}</svg>`;

/**
 * Notices stacked behind each other; dismissing the front one brings up the next.
 * @tag tc-notification-stack
 * @fires tc-dismiss - A notice was dismissed; `detail` is the `Notice`
 */
export class TcNotificationStack extends TcElement {
  static override ui = "ns";

  /** The notices to show, front first */
  @property({ attribute: false }) accessor notices: Notice[] = [];

  /** @internal Ids the user dismissed – hidden while `notices` still lists them */
  @state() accessor dismissed: ReadonlySet<string> = new Set();
  /** @internal Cards sliding away, kept so they can finish their exit even if the app already dropped them */
  @state() accessor leaving: Notice[] = [];
  /** @internal The persistent status line */
  @state() accessor status = "";

  private timers = new Set<number>();
  private ro?: ResizeObserver;
  private observedKey = "";
  private refocus = false;
  private ownName = false;

  constructor() {
    super();
    // Dismiss makes the focused card inert: focus moves to the next card's dismiss button, or the stack itself
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(FRONT_CLOSE));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    this.ownName ||= (this.hasAttribute("aria-label") && this.getAttribute("aria-label") !== "Notifications") || this.hasAttribute("aria-labelledby");
    if (!this.ownName) this.setAttribute("aria-label", "Notifications");
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    // No exit timer outlives the stack
    this.timers.forEach((t) => window.clearTimeout(t));
    this.timers.clear();
    this.leaving = [];
    this.ro?.disconnect();
    this.ro = undefined;
    this.observedKey = "";
  }

  private get visible() {
    const leavingIds = new Set(this.leaving.map((n) => n.id));
    return this.notices.filter((n) => !this.dismissed.has(n.id) && !leavingIds.has(n.id));
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // Forget dismissals of notices the app no longer lists, so a notice that comes back shows again
    if (changed.has("notices")) {
      const ids = new Set(this.notices.map((n) => n.id));
      if (![...this.dismissed].every((id) => ids.has(id))) this.dismissed = new Set([...this.dismissed].filter((id) => ids.has(id)));
    }
  }

  private dismiss(notice: Notice) {
    const left = this.visible.filter((n) => n.id !== notice.id).length;
    this.refocus = this.contains(document.activeElement);
    this.status = `Dismissed ${notice.title}. ${left ? `${left} more ${left === 1 ? "notice" : "notices"}.` : "No more notices."}`;
    this.dismissed = new Set(this.dismissed).add(notice.id);
    if (!this.leaving.some((n) => n.id === notice.id)) this.leaving = [notice, ...this.leaving];
    this.emit("tc-dismiss", notice);
    const t = window.setTimeout(() => {
      this.timers.delete(t);
      this.leaving = this.leaving.filter((n) => n.id !== notice.id);
    }, EXIT_MS);
    this.timers.add(t);
  }

  /** Lines the cards up from their measured heights: the front card's height sets the stack's */
  private layout = () => {
    const visible = this.visible;
    const cards = [...this.querySelectorAll<HTMLElement>(":scope > .ui-ns__card")];
    const next: Record<string, number> = {};
    for (const card of cards) next[card.dataset.id!] = card.offsetHeight;
    const front = visible[0] ? (next[visible[0].id] ?? 0) : 0;
    const behind = Math.min(visible.length - 1, 2);
    this.style.height = `${visible.length ? front + behind * PEEK : 0}px`;
    for (const card of cards) {
      const id = card.dataset.id!;
      const i = visible.findIndex((n) => n.id === id);
      const gone = i === -1;
      const depth = Math.max(0, i);
      // Cards behind are lined up on the front card's bottom edge, a little lower and smaller each
      const y = gone || depth === 0 ? 0 : front - (next[id] ?? front) + Math.min(depth, 2) * PEEK;
      const scale = gone ? 1 : 1 - Math.min(depth, 2) * 0.05;
      card.style.zIndex = String(gone ? 10 : 10 - depth);
      card.style.transform = gone ? "" : `translateY(${y}px) scale(${scale})`;
      card.style.opacity = depth > 2 ? "0" : "";
    }
  };

  protected override updated() {
    const cards = [...this.querySelectorAll<HTMLElement>(":scope > .ui-ns__card")];
    const key = cards.map((c) => c.dataset.id).join("\u0000");
    if (key !== this.observedKey && typeof ResizeObserver === "function") {
      this.observedKey = key;
      this.ro?.disconnect();
      this.ro = new ResizeObserver(this.layout);
      cards.forEach((c) => this.ro!.observe(c));
    }
    this.layout();
    // Dismissed from the keyboard: once the next card is in front, its dismiss button takes focus
    if (this.refocus) {
      this.refocus = false;
      rescueFocus(this, [this.querySelector(FRONT_CLOSE)]);
    }
  }

  protected override render() {
    const look = this.resolvedLook;
    const visible = this.visible;
    // The leaving card was the front one, so it stays on top while it slides away
    const items = [...this.leaving, ...visible];
    return html`${repeat(
        items,
        (n) => n.id,
        (notice) => {
          const i = visible.findIndex((n) => n.id === notice.id);
          const gone = i === -1;
          const depth = Math.max(0, i);
          const isBehind = !gone && depth > 0;
          const a = notice.action;
          return html`<article
            class="ui-ns__card"
            data-id=${notice.id}
            data-depth=${ifDefined(gone ? undefined : depth)}
            ?data-leaving=${gone}
            aria-label=${depth === 0 && !gone && visible.length > 1 ? `${notice.title}, 1 of ${visible.length}` : notice.title}
            aria-hidden=${ifDefined(isBehind ? "true" : undefined)}
            .inert=${isBehind || gone}
          >
            ${pattern(notice.pattern ?? "orbit")}
            <div class="ui-ns__body">
              <div class="ui-ns__top">
                ${notice.badge ? html`<span class="ui-ns__badge">${notice.badge}</span>` : html`<span></span>`}
                <button
                  type="button"
                  class="ui-ns__close"
                  aria-label=${`Dismiss ${notice.title}`}
                  @click=${(e: Event) => {
                    e.stopPropagation();
                    this.dismiss(notice);
                  }}
                >
                  ${closeIcon(look)}
                </button>
              </div>
              <h3 class="ui-ns__title">${notice.title}</h3>
              <p class="ui-ns__text">${notice.text}</p>
              ${a
                ? a.href
                  ? html`<a class="ui-ns__btn" href=${a.href} target=${ifDefined(a.external ? "_blank" : undefined)} rel=${ifDefined(a.external ? "noreferrer" : undefined)} @click=${() => a.onClick?.()}>${a.label}${a.external ? arrowIcon(look) : nothing}</a>`
                  : html`<button type="button" class="ui-ns__btn" @click=${() => a.onClick?.()}>${a.label}</button>`
                : nothing}
            </div>
          </article>`;
        },
      )}<span class="ui-ns__sr" role="status">${this.status}</span>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ns"] {
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
/* Colors and motion as variables – override them on [data-ui="ns"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ns"] {
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
[data-ui="ns"] *, [data-ui="ns"] *::before, [data-ui="ns"] *::after { box-sizing: border-box; }
/* Focus: the ring token in both looks */
[data-ui="ns"] button:focus-visible,
[data-ui="ns"] a:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
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
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="ns"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="ns"]) svg { flex: none; }
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
  width: var(--tc-control-h-sm);
  height: var(--tc-control-h-sm);
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
.ui-ns__title {
  margin: 0;
  font-size: var(--tc-title-font-size);
  font-weight: var(--tc-title-font-weight);
  line-height: var(--tc-title-line-height);
  letter-spacing: var(--tc-title-tracking);
  color: var(--tc-title-color);
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
  width: var(--tc-control-h-md);
  height: var(--tc-control-h-md);
  border-radius: var(--tc-control-radius-md);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-ui="ns"]) :where([data-look="clean"], [data-look="clean"] *).ui-ns__close { color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-ns__close:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-ns__title { padding-right: var(--tc-space-1); }
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
  [data-ui="ns"], .ui-ns__card, .ui-ns__card > * { transition: none; }
}
`;
}

if (!customElements.get("tc-notification-stack")) customElements.define("tc-notification-stack", TcNotificationStack);

declare global {
  interface HTMLElementTagNameMap {
    "tc-notification-stack": TcNotificationStack;
  }
}
