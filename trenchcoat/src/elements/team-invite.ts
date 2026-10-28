import { html, nothing, svg, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { OnScreenController } from "./internal/controllers";
import { ifDefined } from "lit/directives/if-defined.js";
import { safeMediaUrl } from "./internal/safe-media";

/*
 * <tc-team-invite> – the Lit port of illustrations/team-invite.tsx: two connected teammates and an empty dashed slot.
 * A cursor drags a third avatar into the slot: it lands, the dashed line turns solid and the status dot lights up –
 * then the scene starts over. After the third time it stays on the finished team (WCAG 2.2.2).
 *
 *   <tc-team-invite .avatars=${[{ src: "/maya.webp", name: "Maya" }, { src: "/jonas.webp" }, { src: "/priya.webp" }]}>
 *   </tc-team-invite>
 *
 * The artwork is laid out on a 600 × 400 grid inside a 3 : 2 frame and scales with its container. The loop pauses
 * while it's off screen (data-paused); reduced motion shows a still frame of the waiting state. With avatar names or
 * a `label` the host is an image (role="img") with that description; otherwise it's decorative (aria-hidden).
 */

export type TeamInviteAvatar = {
  /** Image URL – a square portrait, shown in a circle */
  src: string;
  /** Name for the accessible description */
  name?: string;
};

let seq = 0;

const node = (avatar: TeamInviteAvatar | undefined, cls: string) =>
  html`<div class=${`ui-ti-node ${cls}`} aria-hidden="true">
    <span class="ui-ti-face">${avatar ? html`<img src=${ifDefined(safeMediaUrl(avatar.src))} alt="" draggable="false" />` : nothing}</span>
    <span class="ui-ti-dot"></span>
  </div>`;

/**
 * A third teammate is dragged into the empty slot and joins the team.
 * @tag tc-team-invite
 */
export class TcTeamInvite extends TcElement {
  static override ui = "ti";
  static override looks = false;

  /** The two teammates that are already connected, then the one being invited */
  @property({ attribute: false }) accessor avatars: TeamInviteAvatar[] = [];
  /** Describes the scene to assistive tech; defaults to a sentence built from the avatars' names when they have any */
  @property() accessor label: string | undefined = undefined;

  /** @internal Gradient id, unique per instance */
  private readonly uid = `ui-ti${++seq}`;
  /** @internal */
  private readonly screen = new OnScreenController(this);

  /** @internal The description: the label, else one built from the names, else none (decorative) */
  get description() {
    const names = [0, 1, 2].map((i) => this.avatars[i]?.name ?? `Teammate ${i + 1}`);
    return (
      this.label ??
      (this.avatars.some((p) => p?.name) ? `${names[0]} and ${names[1]} are connected; ${names[2]} is dragged into the empty slot and joins the team` : undefined)
    );
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.toggleAttribute("data-paused", !this.screen.onScreen);
  }

  protected override updated() {
    const description = this.description;
    if (description) {
      this.setAttribute("role", "img");
      this.setAttribute("aria-label", description);
      this.removeAttribute("aria-hidden");
    } else {
      if (this.getAttribute("role") === "img") this.removeAttribute("role");
      this.removeAttribute("aria-label");
      this.setAttribute("aria-hidden", "true");
    }
  }

  protected override render() {
    const id = this.uid;
    const [a, b, c] = this.avatars;
    return html`
      <svg class="ui-ti-lines" viewBox="0 0 600 400" aria-hidden="true">
        ${svg`<defs>
          <linearGradient id=${`${id}-line`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" class="ui-ti-stop-a"></stop>
            <stop offset="100%" class="ui-ti-stop-b"></stop>
          </linearGradient>
        </defs>
        <path class="ui-ti-line" d="M162 159C214 159 222 105 258 105" stroke=${`url(#${id}-line)`}></path>
        <path class="ui-ti-line ui-ti-line--dashed" d="M162 159C214 165 214 245 248 245"></path>
        <path class="ui-ti-line ui-ti-line--joined" d="M162 159C214 165 214 245 248 245" pathLength="1" stroke=${`url(#${id}-line)`}></path>
        <g class="ui-ti-slot">
          <circle class="ui-ti-line ui-ti-line--slot" cx="290" cy="245" r="40"></circle>
          <path class="ui-ti-plus" d="M290 234v22M279 245h22"></path>
        </g>`}
      </svg>
      ${node(a, "ui-ti-node--a")} ${node(b, "ui-ti-node--b")}
      <div class="ui-ti-drag" aria-hidden="true">
        ${node(c, "ui-ti-node--c")}
        <svg class="ui-ti-cursor" viewBox="-2.186 -0.256 18.514 22.277" aria-hidden="true">
          ${svg`<path
            transform="rotate(21.37)"
            d="M13.92 4.07c1.69.66 3.03 1.18 3.94 1.68.46.25.87.53 1.16.86.31.35.51.79.48 1.29-.03.51-.27.92-.62 1.23-.33.3-.77.53-1.25.74-.96.4-2.36.78-4.12 1.26-.56.15-.98.27-1.26.37-.26.1-.38.18-.47.27-.09.09-.17.21-.27.47-.1.28-.22.7-.37 1.26-.48 1.76-.86 3.16-1.26 4.12-.2.49-.44.93-.74 1.25-.32.35-.72.6-1.23.62-.51.03-.94-.17-1.29-.48-.33-.29-.61-.7-.86-1.16-.5-.91-1.02-2.25-1.68-3.94L1.66 7.76C.96 5.99.41 4.59.16 3.51-.09 2.44-.12 1.39.63.63 1.39-.12 2.44-.09 3.51.16c1.08.25 2.48.8 4.25 1.5l6.16 2.41Z"
          ></path>`}
        </svg>
      </div>
    `;
  }

  static override css = /* css */ `
/* Theme: the --tc- fallbacks use light-dark(), which follows color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="ti"] {
  /* 1 unit of the 600 × 400 layout grid */
  --tc-team-invite-u: calc(100cqw / 600);
  --tc-team-invite-bubble-ring: light-dark(rgba(10, 10, 10, 0.06), rgba(255, 255, 255, 0.08));
  --tc-team-invite-face: light-dark(#eef0f4, #2e2e33);
  /* Same gray as the lines in Outreach Branches */
  --tc-team-invite-line-a: light-dark(#e4e7ec, rgba(255, 255, 255, 0.14));
  --tc-team-invite-line-b: light-dark(#e4e7ec, rgba(255, 255, 255, 0.14));
  --tc-team-invite-dash: light-dark(#e4e7ec, rgba(255, 255, 255, 0.14));
  --tc-team-invite-plus: light-dark(#c4c4c4, #5c5c61);
  --tc-team-invite-online: light-dark(#34c46a, #3fd17a);
  /* Ring around the status dot: mostly white with a hint of the green, fully opaque */
  --tc-team-invite-dot-ring: light-dark(#e2f6e9, #24392c);
  --tc-team-invite-dot-edge: light-dark(rgba(52, 196, 106, 0.1), rgba(63, 209, 122, 0.12));
  --tc-team-invite-cursor: #141b34;
  --tc-team-invite-shadow: 0 calc(10 * var(--tc-team-invite-u)) calc(24 * var(--tc-team-invite-u)) light-dark(rgba(0, 0, 0, 0.07), rgba(0, 0, 0, 0.4)), 0 calc(2 * var(--tc-team-invite-u)) calc(5 * var(--tc-team-invite-u)) light-dark(rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.3));
  --tc-team-invite-lift: 0 calc(18 * var(--tc-team-invite-u)) calc(34 * var(--tc-team-invite-u)) light-dark(rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.5)), 0 calc(3 * var(--tc-team-invite-u)) calc(8 * var(--tc-team-invite-u)) light-dark(rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.3));
  --tc-team-invite-loop: 4.4s;
  /* Loops before it rests: the third one stops at 70 %, on the finished team */
  --tc-team-invite-runs: 2.7;
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  overflow: hidden;
  container-type: inline-size;
}
[data-ui="ti"] *, [data-ui="ti"] *::before, [data-ui="ti"] *::after { box-sizing: border-box; }

.ui-ti-lines { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.ui-ti-stop-a { stop-color: var(--tc-team-invite-line-a); }
.ui-ti-stop-b { stop-color: var(--tc-team-invite-line-b); }
.ui-ti-line { fill: none; stroke-width: 2.4; stroke-linecap: round; }
.ui-ti-line--dashed {
  stroke: var(--tc-team-invite-dash);
  stroke-dasharray: 6 7.23;
  animation: ui-ti-dashed var(--tc-team-invite-loop) linear var(--tc-team-invite-runs) forwards;
}
.ui-ti-line--slot {
  stroke: var(--tc-team-invite-dash);
  stroke-dasharray: 6 7.23;
}
.ui-ti-line--joined {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: ui-ti-joined var(--tc-team-invite-loop) linear var(--tc-team-invite-runs) forwards;
}

/* ---------- Nodes ---------- */

.ui-ti-node {
  position: absolute;
  width: calc(84 * var(--tc-team-invite-u));
  height: calc(84 * var(--tc-team-invite-u));
  margin: calc(-42 * var(--tc-team-invite-u)) 0 0 calc(-42 * var(--tc-team-invite-u));
  padding: calc(5 * var(--tc-team-invite-u));
  border-radius: 50%;
  background: var(--tc-surface-overlay, light-dark(#ffffff, #232326));
  box-shadow: inset 0 0 0 calc(1 * var(--tc-team-invite-u)) var(--tc-team-invite-bubble-ring), var(--tc-team-invite-shadow);
}
.ui-ti-node--a { left: calc(120 * var(--tc-team-invite-u)); top: calc(159 * var(--tc-team-invite-u)); }
.ui-ti-node--b { left: calc(300 * var(--tc-team-invite-u)); top: calc(105 * var(--tc-team-invite-u)); }
.ui-ti-face {
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 50%;
  background: var(--tc-team-invite-face);
}
.ui-ti-face img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
}
/* Status: a bright green dot in a thick, pale green ring with a faint 10% halo outside */
.ui-ti-dot {
  position: absolute;
  right: calc(1 * var(--tc-team-invite-u));
  bottom: calc(3 * var(--tc-team-invite-u));
  width: calc(24 * var(--tc-team-invite-u));
  height: calc(24 * var(--tc-team-invite-u));
  border: calc(7 * var(--tc-team-invite-u)) solid var(--tc-team-invite-dot-ring);
  border-radius: 50%;
  background: var(--tc-team-invite-online);
  box-shadow: 0 0 0 calc(2 * var(--tc-team-invite-u)) var(--tc-team-invite-dot-edge);
}

/* ---------- Empty slot ---------- */

.ui-ti-slot {
  transform-box: fill-box;
  transform-origin: center;
  animation: ui-ti-slot var(--tc-team-invite-loop) linear var(--tc-team-invite-runs) forwards;
}
.ui-ti-plus { fill: none; stroke: var(--tc-team-invite-plus); stroke-width: 1.8; stroke-linecap: round; }

/* ---------- The invite being dragged in ---------- */

/* Starts on the right and is carried to the slot (290, 245) */
.ui-ti-drag {
  position: absolute;
  left: calc(456 * var(--tc-team-invite-u));
  top: calc(281 * var(--tc-team-invite-u));
  animation: ui-ti-drag var(--tc-team-invite-loop) var(--tc-team-invite-runs) forwards;
}
.ui-ti-node--c {
  left: 0;
  top: 0;
  animation: ui-ti-lift var(--tc-team-invite-loop) var(--tc-team-invite-runs) forwards;
}
.ui-ti-node--c .ui-ti-dot { animation: ui-ti-online var(--tc-team-invite-loop) var(--tc-team-invite-runs) forwards; }
/* The pointer rests on the photo: its tip at (+16, +14) from the avatar's centre (the tip is 11.8% / 1.15% into the image) */
.ui-ti-cursor {
  position: absolute;
  left: calc(11.28 * var(--tc-team-invite-u));
  top: calc(13.45 * var(--tc-team-invite-u));
  width: calc(40 * var(--tc-team-invite-u));
  height: calc(48.13 * var(--tc-team-invite-u));
  overflow: visible;
  transform-origin: calc(4.72 * var(--tc-team-invite-u)) calc(0.55 * var(--tc-team-invite-u));
  filter: drop-shadow(0 calc(3 * var(--tc-team-invite-u)) calc(7 * var(--tc-team-invite-u)) rgba(0, 0, 0, 0.16));
  animation: ui-ti-cursor var(--tc-team-invite-loop) var(--tc-team-invite-runs) forwards;
}
.ui-ti-cursor path {
  fill: var(--tc-team-invite-cursor);
  stroke: #fff;
  stroke-width: 1.7;
  stroke-linejoin: round;
  paint-order: stroke;
}

/*
 * One loop:
 *   (4.4 s)
 *   0–12%   rest on the right          12–16% pick up (lift)
 *   16–42%  carried to the slot        42–48% drop, settle
 *   48–54%  line draws solid, dot pops 54–62% cursor lets go and drifts off
 *   62–88%  hold the finished team     88–100% fade back to the start
 */
@keyframes ui-ti-drag {
  0%, 16% { transform: translate(0, 0); opacity: 1; animation-timing-function: var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)); }
  42%, 88% { transform: translate(calc(-166 * var(--tc-team-invite-u)), calc(-36 * var(--tc-team-invite-u))); opacity: 1; }
  94% { transform: translate(calc(-166 * var(--tc-team-invite-u)), calc(-36 * var(--tc-team-invite-u))); opacity: 0; }
  95% { transform: translate(0, 0); opacity: 0; }
  100% { transform: translate(0, 0); opacity: 1; }
}
@keyframes ui-ti-lift {
  0%, 12% { transform: scale(1); box-shadow: inset 0 0 0 calc(1 * var(--tc-team-invite-u)) var(--tc-team-invite-bubble-ring), var(--tc-team-invite-shadow); animation-timing-function: var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)); }
  16%, 40% { transform: scale(1.07); box-shadow: inset 0 0 0 calc(1 * var(--tc-team-invite-u)) var(--tc-team-invite-bubble-ring), var(--tc-team-invite-lift); animation-timing-function: var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)); }
  46%, 100% { transform: scale(1); box-shadow: inset 0 0 0 calc(1 * var(--tc-team-invite-u)) var(--tc-team-invite-bubble-ring), var(--tc-team-invite-shadow); }
}
@keyframes ui-ti-online {
  0%, 48% { transform: scale(0); }
  52% { transform: scale(1.25); }
  56%, 100% { transform: scale(1); }
}
@keyframes ui-ti-cursor {
  0%, 11% { transform: translate(0, 0) scale(1); opacity: 1; animation-timing-function: var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)); }
  14%, 42% { transform: translate(0, 0) scale(0.86); opacity: 1; animation-timing-function: var(--tc-ease-out, cubic-bezier(0.22, 1, 0.36, 1)); }
  47% { transform: translate(0, 0) scale(1); opacity: 1; animation-timing-function: var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)); }
  62%, 88% { transform: translate(calc(70 * var(--tc-team-invite-u)), calc(44 * var(--tc-team-invite-u))) scale(1); opacity: 0; }
  95% { transform: translate(calc(20 * var(--tc-team-invite-u)), calc(14 * var(--tc-team-invite-u))) scale(1); opacity: 0; }
  100% { transform: translate(0, 0) scale(1); opacity: 1; }
}
@keyframes ui-ti-slot {
  0%, 30% { opacity: 1; transform: scale(1); animation-timing-function: var(--tc-ease-in-out, cubic-bezier(0.65, 0, 0.35, 1)); }
  42%, 90% { opacity: 0; transform: scale(1.12); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes ui-ti-dashed {
  0%, 46% { opacity: 1; }
  50%, 92% { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes ui-ti-joined {
  0%, 44% { stroke-dashoffset: 1; opacity: 1; }
  54%, 88% { stroke-dashoffset: 0; opacity: 1; }
  94%, 100% { stroke-dashoffset: 0; opacity: 0; }
}

/* Off screen or in a hidden tab the loop holds where it is */
[data-ui="ti"][data-paused] :is(.ui-ti-drag, .ui-ti-node--c, .ui-ti-dot, .ui-ti-cursor, .ui-ti-slot, .ui-ti-line) { animation-play-state: paused; }

/* Reduced motion: a still frame of the waiting state */
@media (prefers-reduced-motion: reduce) {
  .ui-ti-drag, .ui-ti-node--c, .ui-ti-node--c .ui-ti-dot, .ui-ti-cursor, .ui-ti-slot,
  .ui-ti-line--dashed, .ui-ti-line--joined { animation: none; }
  .ui-ti-node--c .ui-ti-dot { transform: scale(0); }
}
`;
}

if (!customElements.get("tc-team-invite")) customElements.define("tc-team-invite", TcTeamInvite);

declare global {
  interface HTMLElementTagNameMap {
    "tc-team-invite": TcTeamInvite;
  }
}
