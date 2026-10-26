import { html } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-ghosted-chat> – the Lit port of illustrations/ghosted-chat.tsx: three unanswered outgoing messages, the last
 * one with a red shine and a soft glow, marked "Read". On hover a thumbs-down reply pops in. Laid out on a 360 × 240
 * artboard and scaled to the width of the host.
 *
 *   <tc-ghosted-chat label="Messages left on read"></tc-ghosted-chat>
 *
 * Decorative by default (aria-hidden on the host); with `label` the host is an image named by it. The messages arrive
 * once the scene scrolls into view; the shine sweeps three times and rests, holds still off screen or in a hidden tab
 * (data-paused) and is off with reduced motion. Colours follow the page theme through light-dark().
 */

const W = 360;

/* ---------- Styles ---------- */

const css = /* css */ `
/* Theme: every colour is light-dark(), which follows color-scheme – so dark works through .dark,
   data-theme / data-tc-theme and the OS setting alike */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="gc"] {
  --tc-ghosted-chat-bubble-shadow: 0 2px 6px light-dark(rgba(28, 29, 31, 0.08), rgba(0, 0, 0, 0.35)), 0 1px 2px light-dark(rgba(28, 29, 31, 0.05), rgba(0, 0, 0, 0.4));
  --tc-ghosted-chat-reply-shadow: 0 4px 12px light-dark(rgba(21, 94, 239, 0.22), rgba(0, 0, 0, 0.4)), 0 1px 2px light-dark(rgba(21, 94, 239, 0.18), rgba(0, 0, 0, 0.4));
  /* The glow under the last bubble, a little fainter in dark */
  --tc-ghosted-chat-glow-1: light-dark(rgba(255, 160, 171, 0.6), rgba(255, 160, 171, 0.45));
  --tc-ghosted-chat-glow-2: light-dark(rgba(255, 184, 158, 0.6), rgba(255, 184, 158, 0.45));
  --tc-ghosted-chat-glow-3: light-dark(rgba(200, 168, 229, 0.6), rgba(200, 168, 229, 0.45));
  --tc-ghosted-chat-glow-4: light-dark(rgba(168, 181, 255, 0.6), rgba(168, 181, 255, 0.45));
  /* Arrival choreography: when each part fades in, and one sweep of the shine (it runs three) */
  --tc-ghosted-chat-at-status: 100ms;
  --tc-ghosted-chat-at-1: 500ms;
  --tc-ghosted-chat-at-2: 1300ms;
  --tc-ghosted-chat-at-3: 2300ms;
  --tc-ghosted-chat-at-read: 3200ms;
  --tc-ghosted-chat-shine: 4.5s;
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
}
[data-ui="gc"] *, [data-ui="gc"] *::before, [data-ui="gc"] *::after { box-sizing: border-box; margin: 0; }

/* Fixed 360 × 240 artboard, scaled from the top-left corner */
.ui-gc-stage {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1;
  width: 360px;
  height: 240px;
  padding: 22px 22px 0;
  transform-origin: 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--tc-space-3-5, 14px);
}
/* A touch smaller than the frame, so the chat has room to breathe */
.ui-gc-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--tc-space-3-5, 14px);
  transform: scale(0.86);
  transform-origin: 50% 45%;
}

/* Arrival: everything waits hidden, then fades in one after another */
.ui-gc-status,
.ui-gc-bubbles > * {
  opacity: 0;
}
.ui-gc-stage[data-play] .ui-gc-status {
  animation: ui-gc-fade var(--tc-duration-slowest, 560ms) var(--tc-ease-decelerate, cubic-bezier(0, 0, 0.58, 1)) var(--tc-ghosted-chat-at-status) both;
}
.ui-gc-stage[data-play] .ui-gc-bubbles > .ui-gc-bubble {
  animation: ui-gc-arrive var(--tc-duration-slowest, 560ms) var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)) both;
}
.ui-gc-stage[data-play] .ui-gc-bubbles > .ui-gc-bubble:nth-child(1) { animation-delay: var(--tc-ghosted-chat-at-1); }
.ui-gc-stage[data-play] .ui-gc-bubbles > .ui-gc-bubble:nth-child(2) { animation-delay: var(--tc-ghosted-chat-at-2); }
.ui-gc-stage[data-play] .ui-gc-bubbles > .ui-gc-bubble:nth-child(3) { animation-delay: var(--tc-ghosted-chat-at-3); }
.ui-gc-stage[data-play] .ui-gc-read {
  animation: ui-gc-fade var(--tc-duration-slowest, 560ms) var(--tc-ease-decelerate, cubic-bezier(0, 0, 0.58, 1)) var(--tc-ghosted-chat-at-read) both;
}
@keyframes ui-gc-arrive {
  from { opacity: 0; transform: translateY(10px) scale(0.92); filter: blur(2px); }
  to { opacity: 1; transform: none; filter: none; }
}
@keyframes ui-gc-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
.ui-gc-bubbles > .ui-gc-bubble { transform-origin: 100% 100%; }

.ui-gc-status {
  font-size: var(--tc-font-size-xs, 11px);
  line-height: 1.4;
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
  letter-spacing: 0.01em;
  transition: color var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease);
}
.ui-gc-bubbles {
  width: 100%;
  padding-right: var(--tc-space-3-5, 14px);
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--tc-space-1, 4px);
  transition: transform var(--tc-duration-slower, 420ms) var(--tc-ease-move, cubic-bezier(0.22, 1, 0.36, 1));
}
.ui-gc-bubble {
  max-width: min(68%, 26ch);
  width: fit-content;
  padding: var(--tc-space-2, 8px) var(--tc-space-3, 12px);
  background: var(--tc-surface-overlay, light-dark(#ffffff, #232326));
  border: 1px solid var(--tc-border-default, light-dark(#ececec, #2a2a2e));
  border-radius: 14px 14px var(--tc-radius-xs, 4px) 14px;
  box-shadow: var(--tc-ghosted-chat-bubble-shadow);
  font-size: var(--tc-font-size-sm, 12px);
  line-height: 1.3;
  font-weight: var(--tc-font-weight-medium, 500);
  color: var(--tc-text-secondary, light-dark(#404040, #c8c8cc));
}

/* "Hello?" – a red shine sweeps through the text three times. It moves by transform only: a window 72 % as wide
   as the word, fading in and out at its edges, slides across it; the red copy inside slides back by the same
   amount, so it stays on top of the word */
.ui-gc-alert {
  position: relative;
  display: inline-block;
  font-weight: var(--tc-font-weight-medium, 500);
  color: var(--tc-text-primary, light-dark(#171717, #ededed));
  white-space: nowrap;
}
.ui-gc-shine {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 72%;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 50%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 50%, transparent);
  transform: translateX(158.34%);
  animation: ui-gc-shine var(--tc-ghosted-chat-shine) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)) 3 both;
  pointer-events: none;
}
.ui-gc-shine-text {
  display: block;
  width: calc(100% / 0.72);
  color: #FF4D47;
  transform: translateX(-114%);
  animation: ui-gc-shine-text var(--tc-ghosted-chat-shine) var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)) 3 both;
}
@keyframes ui-gc-shine {
  0% { transform: translateX(-119.45%); }
  35%, 100% { transform: translateX(158.34%); }
}
@keyframes ui-gc-shine-text {
  0% { transform: translateX(86%); }
  35%, 100% { transform: translateX(-114%); }
}

/* Last bubble: soft colored glow underneath */
.ui-gc-bubble-last {
  position: relative;
  isolation: isolate;
  padding: var(--tc-space-1-5, 6px) var(--tc-space-3, 12px);
  margin-bottom: var(--tc-space-1-5, 6px);
  /* The surface moves to ::before so the glow can sit behind it */
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}
.ui-gc-bubble-last::before {
  content: "";
  position: absolute;
  inset: -1px;
  z-index: -1;
  background: var(--tc-surface-overlay, light-dark(#ffffff, #232326));
  border: 1px solid var(--tc-border-default, light-dark(#ececec, #2a2a2e));
  border-radius: inherit;
  box-shadow: var(--tc-ghosted-chat-bubble-shadow);
}
.ui-gc-bubble-last::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -6px;
  transform: translateX(-50%);
  width: 100%;
  height: 22px;
  background: linear-gradient(90deg, var(--tc-ghosted-chat-glow-1) 0%, var(--tc-ghosted-chat-glow-2) 33%, var(--tc-ghosted-chat-glow-3) 66%, var(--tc-ghosted-chat-glow-4) 100%);
  filter: blur(12px);
  border-radius: 50%;
  pointer-events: none;
  z-index: -2;
}
.ui-gc-read {
  font-size: 10.5px;
  line-height: 1.4;
  color: var(--tc-text-muted, light-dark(#646464, #9a9aa1));
  margin-top: var(--tc-space-0-5, 2px);
  transition: color var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease);
}

/* Thumbs-down reply – hidden, pops in on hover */
.ui-gc-reply {
  position: absolute;
  left: 64px; /* from the padded chat column */
  bottom: 68px;
  max-width: none;
  width: auto;
  padding: var(--tc-space-1-5, 6px) var(--tc-space-3, 12px);
  background: #155EEF;
  border: 1px solid #155EEF;
  border-radius: 14px 14px 14px var(--tc-radius-xs, 4px);
  color: #FFFFFF;
  font-size: 15px;
  line-height: 1.1;
  box-shadow: var(--tc-ghosted-chat-reply-shadow);
  opacity: 0;
  transform: translateY(14px) scale(0.92);
  transform-origin: bottom left;
  transition: opacity var(--tc-duration-slow, 320ms) var(--tc-ease-standard, ease), transform var(--tc-duration-slower, 420ms) var(--tc-ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1));
  pointer-events: none;
}
/* Hover hides the status texts via their color, so the arrival animation (opacity) is left alone */
[data-ui="gc"]:hover .ui-gc-status,
[data-ui="gc"]:hover .ui-gc-read { color: transparent; }
[data-ui="gc"]:hover .ui-gc-bubbles { transform: translateY(-12px); }
[data-ui="gc"]:hover .ui-gc-reply { opacity: 1; transform: translateY(0) scale(1); }

/* Off screen or in a hidden tab: the shine holds still */
[data-ui="gc"][data-paused] :is(.ui-gc-shine, .ui-gc-shine-text) { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ui-gc-shine { display: none; }
  .ui-gc-status, .ui-gc-bubbles, .ui-gc-read, .ui-gc-reply { transition: none; }
  /* Everything is there from the start – also over the more specific arrival rules */
  .ui-gc-status, .ui-gc-bubbles > *, [data-ui="gc"] .ui-gc-stage[data-play] :is(.ui-gc-status, .ui-gc-bubbles > *) { opacity: 1; animation: none; }
}
`;

/**
 * Unanswered chat messages – an illustration for being ghosted.
 * @tag tc-ghosted-chat
 */
export class TcGhostedChat extends TcElement {
  static override ui = "gc";
  static override looks = false;
  static override css = css;

  /** Accessible description – when set, the scene is announced as an image; otherwise it is decorative */
  @property() accessor label = "";

  /** @internal */
  private readonly screen = new OnScreenController(this);
  /** @internal Disconnects the resize and arrival observers */
  private stop?: () => void;

  override connectedCallback() {
    super.connectedCallback();
    if (this.hasUpdated && !this.stop) this.watch();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.stop?.();
    this.stop = undefined;
  }

  protected override firstUpdated() {
    this.watch();
  }

  protected override updated() {
    toggleImage(this, this.label);
    this.toggleAttribute("data-paused", !this.screen.onScreen);
  }

  /** @internal Scales the artboard to the host's width; the messages arrive once the scene scrolls into view */
  private watch() {
    const art = this.querySelector<HTMLElement>(":scope > .ui-gc-stage");
    if (!art) return;
    const fit = () => {
      const scale = this.clientWidth / W;
      art.style.transform = `scale(${scale})`;
      art.style.visibility = scale > 0 ? "visible" : "hidden";
    };
    fit();
    const resize = new ResizeObserver(fit);
    resize.observe(this);
    const arrive =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver(
            ([entry]) => {
              if (!entry.isIntersecting) return;
              art.setAttribute("data-play", "");
              arrive?.disconnect();
            },
            { threshold: 0.35 },
          )
        : null;
    if (arrive) arrive.observe(this);
    else art.setAttribute("data-play", "");
    this.stop = () => {
      resize.disconnect();
      arrive?.disconnect();
    };
  }

  protected override render() {
    // The stage starts hidden; after the first measurement its transform is written directly
    return html`<div class="ui-gc-stage" aria-hidden="true" style="transform: scale(0); visibility: hidden">
      <div class="ui-gc-content">
        <span class="ui-gc-status">No new messages</span>
        <div class="ui-gc-bubbles">
          <div class="ui-gc-bubble"><span>Hi team!</span></div>
          <div class="ui-gc-bubble"><span>Are you by any chance looking for a recruiter?</span></div>
          <div class="ui-gc-bubble ui-gc-bubble-last">
            <span class="ui-gc-alert">Hello?<span class="ui-gc-shine"><span class="ui-gc-shine-text">Hello?</span></span></span>
          </div>
          <span class="ui-gc-read">Read</span>
        </div>
        <div class="ui-gc-bubble ui-gc-reply"><span>👎</span></div>
      </div>
    </div>`;
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

if (!customElements.get("tc-ghosted-chat")) customElements.define("tc-ghosted-chat", TcGhostedChat);

declare global {
  interface HTMLElementTagNameMap {
    "tc-ghosted-chat": TcGhostedChat;
  }
}
