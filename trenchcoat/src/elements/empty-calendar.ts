import { html, svg } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-empty-calendar> – the Lit port of illustrations/empty-calendar.tsx: three stacked calendar cards with an "Empty"
 * badge and a disabled "Join meeting" button. Hover the front card to lift it, a back card to slide it further out.
 * Drawn on a 320 × 240 viewBox inside a 3 : 2 frame.
 *
 *   <tc-empty-calendar label="Nothing scheduled"></tc-empty-calendar>
 *
 * Decorative by default (aria-hidden on the host); with `label` the host is an image named by it. The shimmer and the
 * glow run a few cycles and rest, hold still off screen or in a hidden tab (data-paused) and stay still with reduced
 * motion. Colours follow the page theme through light-dark().
 */

let uid = 0;

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: every colour is light-dark(), which follows color-scheme – so dark works through .dark,
   data-theme / data-tc-theme and the OS setting alike */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="ec"] {
  --tc-empty-calendar-card: light-dark(#ffffff, #232326);
  --tc-empty-calendar-edge: light-dark(#e4e7ec, rgba(255, 255, 255, 0.08));
  --tc-empty-calendar-drop: light-dark(rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.4));
  --tc-empty-calendar-title: light-dark(#8a8a8a, #8f8f8f);
  --tc-empty-calendar-badge: light-dark(#fef8ef, rgba(250, 176, 130, 0.16));
  --tc-empty-calendar-bar: light-dark(#eff1f4, #2a2a2d);
  --tc-empty-calendar-bar-peak: light-dark(#dde1e5, #36363b);
  --tc-empty-calendar-btn: light-dark(#f4f4f6, #2a2a2d);
  --tc-empty-calendar-btn-ink: light-dark(#9a9aa3, #6b6b70);
  /* One shimmer / glow cycle; each runs a few times and then rests */
  --tc-empty-calendar-shimmer: 2.4s;
  --tc-empty-calendar-breathe: 5s;
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  font-family: var(--tc-font-sans, "Inter", "InterVariable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
}
.ui-ec-art {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

/* Card parts */
.ui-ec-card { fill: var(--tc-empty-calendar-card); stroke: var(--tc-empty-calendar-edge); }
.ui-ec-drop { flood-color: var(--tc-empty-calendar-drop); }
.ui-ec-edge { stop-color: light-dark(#e4e7ec, #3a3a3f); }
.ui-ec-title { fill: var(--tc-empty-calendar-title); }
.ui-ec-badge { fill: var(--tc-empty-calendar-badge); }
.ui-ec-btn { fill: var(--tc-empty-calendar-btn); stroke: var(--tc-empty-calendar-edge); }
.ui-ec-btn-ink { stroke: var(--tc-empty-calendar-btn-ink); }
.ui-ec-btn-label { fill: var(--tc-empty-calendar-btn-ink); }

/* Placeholder lines shimmer softly for a few cycles */
.ui-ec-bar {
  fill: var(--tc-empty-calendar-bar);
  animation: ui-ec-shimmer var(--tc-empty-calendar-shimmer) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)) 3;
}
@keyframes ui-ec-shimmer {
  0%, 100% { fill: var(--tc-empty-calendar-bar); }
  50% { fill: var(--tc-empty-calendar-bar-peak); }
}

/* The glow under the front card breathes for a few cycles */
.ui-ec-blob {
  transform-origin: 160px 152px;
  animation: ui-ec-breathe var(--tc-empty-calendar-breathe) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)) 3 both;
}
@keyframes ui-ec-breathe {
  0%, 100% { opacity: 0.85; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.06); }
}

/* Front card: lifts and tilts on hover */
.ui-ec-front {
  transform-origin: 160px 90px;
  transition: transform var(--tc-duration-slow, 320ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-ec-front:hover { transform: translate(0, -8px) rotate(2deg); }

/* Back cards: fanned out, slide further on hover */
.ui-ec-back {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform var(--tc-duration-slow, 320ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-ec-back-left { transform: translate(-22px, 0) rotate(-3deg); }
.ui-ec-back-left:hover { transform: translate(-48px, 4px) rotate(-7deg); }
.ui-ec-back-right { transform: translate(22px, 0) rotate(3deg); }
.ui-ec-back-right:hover { transform: translate(48px, 4px) rotate(7deg); }

/* Off screen or in a hidden tab: the loops hold still */
[data-ui="ec"][data-paused] :is(.ui-ec-bar, .ui-ec-blob) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-ec-bar, .ui-ec-blob { animation: none; }
  .ui-ec-front, .ui-ec-back { transition: none; }
}
`;

/** One calendar card: title, "Empty" badge, placeholder lines and a disabled button */
const card = (shadow: string) => svg`
  <rect class="ui-ec-card" x="40" y="20" width="240" height="140" rx="10" stroke-width="0.5" filter=${shadow}></rect>
  <text class="ui-ec-title" x="56" y="48" font-size="13" font-weight="500">Calendar</text>
  <g transform="translate(218 34)">
    <rect class="ui-ec-badge" width="46" height="18" rx="5"></rect>
    <text x="23" y="12" text-anchor="middle" font-size="9" font-weight="600" letter-spacing="0.06em" fill="#FAB082">EMPTY</text>
  </g>
  <rect class="ui-ec-bar" x="56" y="64" width="208" height="7" rx="2"></rect>
  <rect class="ui-ec-bar" x="56" y="74" width="208" height="7" rx="2"></rect>
  <rect class="ui-ec-bar" x="56" y="84" width="168" height="7" rx="2"></rect>
  <g transform="translate(56 104)">
    <rect class="ui-ec-btn" width="208" height="40" rx="8" stroke-width="0.5"></rect>
    <g class="ui-ec-btn-ink" transform="translate(64 14)" fill="none" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="6" cy="6" r="5"></circle>
      <line x1="2.5" y1="9.5" x2="9.5" y2="2.5"></line>
    </g>
    <text class="ui-ec-btn-label" x="84" y="24" font-size="10" font-weight="500">Join meeting</text>
  </g>`;

/**
 * Stacked empty calendar cards – an illustration for an empty schedule.
 * @tag tc-empty-calendar
 */
export class TcEmptyCalendar extends TcElement {
  static override ui = "ec";
  static override looks = false;
  static override css = css;

  /** Accessible description – when set, the scene is announced as an image; otherwise it is decorative */
  @property() accessor label = "";

  /** @internal */
  private readonly screen = new OnScreenController(this);
  /** @internal */
  private readonly uid = `ui-ec${++uid}`;

  protected override updated() {
    toggleImage(this, this.label);
    this.toggleAttribute("data-paused", !this.screen.onScreen);
  }

  protected override render() {
    const id = this.uid;
    const shadow = `url(#${id}-shadow)`;
    return html`<svg class="ui-ec-art" viewBox="0 0 320 240" aria-hidden="true">
      ${svg`<defs>
        <filter id=${`${id}-blur`} x="-30%" y="-100%" width="160%" height="300%">
          <feGaussianBlur stdDeviation="14"></feGaussianBlur>
        </filter>
        <filter id=${`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow class="ui-ec-drop" dx="0" dy="3" stdDeviation="4"></feDropShadow>
        </filter>
        <linearGradient id=${`${id}-blob`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#FFA0AB" stop-opacity="0.25"></stop>
          <stop offset="33%" stop-color="#FFB89E" stop-opacity="0.25"></stop>
          <stop offset="66%" stop-color="#C8A8E5" stop-opacity="0.25"></stop>
          <stop offset="100%" stop-color="#A8B5FF" stop-opacity="0.25"></stop>
        </linearGradient>
        <linearGradient id=${`${id}-stroke`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop class="ui-ec-edge" offset="0%"></stop>
          <stop offset="18%" stop-color="#FFB5BC"></stop>
          <stop offset="40%" stop-color="#FFC5AB"></stop>
          <stop offset="60%" stop-color="#D5BBEF"></stop>
          <stop offset="82%" stop-color="#B5C0FF"></stop>
          <stop class="ui-ec-edge" offset="100%"></stop>
        </linearGradient>
      </defs>
      <g transform="translate(30 47) scale(0.814)">
        <g class="ui-ec-back ui-ec-back-left">${card(shadow)}</g>
        <g class="ui-ec-back ui-ec-back-right">${card(shadow)}</g>
        <g class="ui-ec-front">
          <ellipse class="ui-ec-blob" cx="160" cy="152" rx="125" ry="35" fill=${`url(#${id}-blob)`} filter=${`url(#${id}-blur)`}></ellipse>
          ${card(shadow)}
          <path d="M40 150 A 10 10 0 0 0 50 160 L270 160 A 10 10 0 0 0 280 150" fill="none" stroke=${`url(#${id}-stroke)`} stroke-width="0.5"></path>
        </g>
      </g>`}
    </svg>`;
  }
}

/** A described image when there's a label, otherwise decoration that assistive tech skips */
function toggleImage(host: HTMLElement, label: string) {
  if (label) {
    host.setAttribute("role", "img");
    host.setAttribute("aria-label", label);
    host.removeAttribute("aria-hidden");
  } else {
    if (host.getAttribute("role") === "img") host.removeAttribute("role");
    host.removeAttribute("aria-label");
    host.setAttribute("aria-hidden", "true");
  }
}

if (!customElements.get("tc-empty-calendar")) customElements.define("tc-empty-calendar", TcEmptyCalendar);

declare global {
  interface HTMLElementTagNameMap {
    "tc-empty-calendar": TcEmptyCalendar;
  }
}
