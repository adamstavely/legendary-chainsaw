import { html, nothing, svg, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";

/*
 * <tc-capability-notice> – an advisory placed above (or with) an answer when the request falls where the AI is only
 * partly proven (amber) or not proven at all (red). It names the task area, and can say that the confidence shown
 * is capped ("Confidence capped at Medium") and that someone was notified ("Supervisor notified"). A folded detail
 * shows how far the request is from the ones the AI usually handles, as a small scale with the usual range shaded,
 * the threshold marked and the request's score as a dot.
 *   · level="partial" – amber: partly proven; check the answer independently
 *   · level="unproven" – red: not proven; treat the answer as a starting point
 * The app decides the level, the cap and who was told; the notice only says so. It's a notice, not a card: no card
 * header. Standard is a toned band (warning or danger tint, hairline border); Clean is a white card with the tone as a
 * thin rule down the left edge and a toned icon.
 *
 *   <tc-capability-notice level="partial" area="Tax rules outside the EU" cap="Medium" notified="Supervisor"
 *     distance="0.72" usual="0.45"></tc-capability-notice>
 *
 * Keyboard: Tab reaches the detail's toggle (a disclosure button), Enter or Space opens and closes it. `open` changes
 * with a cancelable tc-open-change. The scale is a meter with the score as its value.
 */

export type CapabilityLevel = "partial" | "unproven";
/** Detail of tc-open-change */
export type CapabilityOpenChange = { open: boolean };

const HEADINGS: Record<CapabilityLevel, string> = { partial: "Check this answer independently", unproven: "Treat this answer as a starting point" };
const MESSAGES: Record<CapabilityLevel, string> = {
  partial: "The AI has only been partly validated on requests like this one, so its answer may sound surer than it is.",
  unproven: "The AI hasn't been shown to handle requests like this one reliably. Don't rely on the answer without checking it.",
};
const LEVEL_WORD: Record<CapabilityLevel, string> = { partial: "Partly proven", unproven: "Not proven" };

/* Icons: Lucide (ISC, lucide.dev) – triangle-alert, octagon-alert, gauge, bell-ring, chevron-down */
const glyph = (body: ReturnType<typeof svg>, className = "ui-cpn__glyph") => html`<svg class=${className} viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
const LEVEL_ICON: Record<CapabilityLevel, ReturnType<typeof svg>> = {
  partial: svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4M12 17h.01"></path>`,
  unproven: svg`<path d="M12 16h.01M12 8v4"></path><path d="M15.31 2a2 2 0 0 1 1.42.59l4.68 4.68A2 2 0 0 1 22 8.69v6.62a2 2 0 0 1-.59 1.42l-4.68 4.68a2 2 0 0 1-1.42.59H8.69a2 2 0 0 1-1.42-.59l-4.68-4.68A2 2 0 0 1 2 15.31V8.69a2 2 0 0 1 .59-1.42l4.68-4.68A2 2 0 0 1 8.69 2z"></path>`,
};
const capIcon = svg`<path d="m12 14 4-4"></path><path d="M3.34 19a10 10 0 1 1 17.32 0"></path>`;
const bellIcon = svg`<path d="M10.27 21a2 2 0 0 0 3.46 0M22 8c0-2.3-.8-4.3-2-6M3.26 15.33A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.67C19.41 13.96 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.41 5.96-2.74 7.33M4 2C2.8 3.7 2 5.7 2 8"></path>`;
const chevron = svg`<path d="m6 9 6 6 6-6"></path>`;

let instances = 0;

const finite = (n: number | undefined): n is number => typeof n === "number" && Number.isFinite(n);

/**
 * An advisory with an answer: the request falls where the AI is only partly proven (amber) or not proven (red) – the
 * task area, a capped confidence, who was notified, and a folded distance-from-usual score.
 * @tag tc-capability-notice
 * @fires tc-open-change - The distance detail was opened or closed; detail `{ open }`: CapabilityOpenChange. Cancelable.
 */
export class TcCapabilityNotice extends TcElement {
  static override ui = "cpn";

  /** How proven the AI is for this request: "partial" (amber) or "unproven" (red) */
  @property({ reflect: true }) accessor level: CapabilityLevel = "partial";
  /** The task area the request falls in, by the name people know it by */
  @property() accessor area = "";
  /** The heading – what to do about the answer: "Check this answer independently" or "Treat this answer as a starting point" by default */
  @property() accessor heading: string | undefined = undefined;
  /** Why – a sentence on how proven the AI is here; a default sentence per level */
  @property() accessor message: string | undefined = undefined;
  /** The highest confidence the answer may show, e.g. "Medium"; set, the notice says "Confidence capped at …" */
  @property() accessor cap = "";
  /** Who was told about the request, e.g. "Supervisor"; set, the notice says "… notified" */
  @property() accessor notified = "";
  /** How far the request is from the ones the AI usually handles; set, the notice has a folded detail with a scale */
  @property({ type: Number }) accessor distance: number | undefined = undefined;
  /** The score above which a request counts as unusual – marked on the scale, the usual range shaded below it */
  @property({ type: Number }) accessor usual: number | undefined = undefined;
  /** The low end of the scale */
  @property({ type: Number, attribute: "scale-min" }) accessor scaleMin = 0;
  /** The high end of the scale */
  @property({ type: Number, attribute: "scale-max" }) accessor scaleMax = 1;
  /** Decimal places the score is shown with */
  @property({ type: Number }) accessor digits = 2;
  /** The name of the score – the toggle's label and the scale's name */
  @property({ attribute: "distance-label" }) accessor distanceLabel = "Distance from usual";
  /** A sentence under the scale saying what the score means */
  @property({ attribute: "distance-note" }) accessor distanceNote = "How far this request is from the ones the AI usually handles. Higher means less familiar.";
  /** Whether the distance detail is open */
  @property({ type: Boolean, reflect: true }) accessor open = false;

  private readonly uid = `tc-cpn${++instances}`;

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (!this.hasAttribute("role")) this.setAttribute("role", "note");
    if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
  }

  private get lvl(): CapabilityLevel {
    return this.level === "unproven" ? "unproven" : "partial";
  }

  private fmt(n: number) {
    return n.toFixed(Math.max(0, Math.min(6, Math.round(this.digits))));
  }

  private toggle() {
    const open = !this.open;
    if (this.emit<CapabilityOpenChange>("tc-open-change", { open }, { cancelable: true })) this.open = open;
  }

  /** Where a score sits on the scale, 0–100 % */
  private pos(n: number) {
    const lo = this.scaleMin;
    const hi = this.scaleMax > lo ? this.scaleMax : lo + 1;
    return Math.min(100, Math.max(0, ((n - lo) / (hi - lo)) * 100));
  }

  private renderDetail() {
    if (!finite(this.distance)) return nothing;
    const d = this.distance;
    const usual = finite(this.usual) ? this.usual : undefined;
    const beyond = usual !== undefined && d > usual;
    const text = `${this.fmt(d)}${usual === undefined ? "" : beyond ? ` – above the usual range, up to ${this.fmt(usual)}` : ` – within the usual range, up to ${this.fmt(usual)}`}`;
    const id = `${this.uid}-detail`;
    // role="meter" goes through the ARIA-reflecting `role` property: lit-analyzer's role list predates ARIA 1.2's meter
    return html`<div class="ui-cpn__fold">
      <button type="button" class="ui-cpn__toggle" aria-expanded=${this.open ? "true" : "false"} aria-controls=${id} @click=${this.toggle}>
        ${this.distanceLabel} <span class="ui-cpn__score" ?data-beyond=${beyond}>${this.fmt(d)}</span>${glyph(chevron, "ui-cpn__glyph ui-cpn__chev")}
      </button>
      <div class="ui-cpn__detail" id=${id} ?hidden=${!this.open}>
        <div
          class="ui-cpn__scale"
          .role=${"meter"}
          aria-label=${this.distanceLabel}
          aria-valuemin=${this.scaleMin}
          aria-valuemax=${this.scaleMax > this.scaleMin ? this.scaleMax : this.scaleMin + 1}
          aria-valuenow=${Math.min(Math.max(d, this.scaleMin), this.scaleMax > this.scaleMin ? this.scaleMax : this.scaleMin + 1)}
          aria-valuetext=${text}
        >
          <span class="ui-cpn__track">
            ${usual !== undefined ? html`<span class="ui-cpn__usual" style=${styleMap({ inlineSize: `${this.pos(usual)}%` })}></span><span class="ui-cpn__tick" style=${styleMap({ insetInlineStart: `${this.pos(usual)}%` })}></span>` : nothing}
            <span class="ui-cpn__dot" ?data-beyond=${beyond} style=${styleMap({ insetInlineStart: `${this.pos(d)}%` })}></span>
          </span>
          <span class="ui-cpn__ends" aria-hidden="true">
            <span>${this.fmt(this.scaleMin)}</span>
            ${usual !== undefined ? html`<span class="ui-cpn__usual-label" style=${styleMap({ insetInlineStart: `${this.pos(usual)}%` })}>usual ≤ ${this.fmt(usual)}</span>` : nothing}
            <span>${this.fmt(this.scaleMax > this.scaleMin ? this.scaleMax : this.scaleMin + 1)}</span>
          </span>
        </div>
        ${this.distanceNote ? html`<p class="ui-cpn__note">${this.distanceNote}</p>` : nothing}
      </div>
    </div>`;
  }

  protected override render() {
    const lvl = this.lvl;
    const heading = this.heading ?? HEADINGS[lvl];
    const message = this.message ?? MESSAGES[lvl];
    const facts = this.cap || this.notified;
    return html`<div class="ui-cpn__box">
      <span class="ui-cpn__icon">${glyph(LEVEL_ICON[lvl])}</span>
      <div class="ui-cpn__main">
        <p class="ui-cpn__titles">
          <span class="ui-cpn__level">${LEVEL_WORD[lvl]}</span>
          <span class="ui-cpn__title" id=${`${this.uid}-title`}>${heading}</span>
        </p>
        ${this.area ? html`<p class="ui-cpn__area"><span class="ui-cpn__area-label">Task area</span> <span class="ui-cpn__area-name">${this.area}</span></p>` : nothing}
        ${message ? html`<p class="ui-cpn__message">${message}</p>` : nothing}
        ${facts
          ? html`<ul class="ui-cpn__facts">
              ${this.cap ? html`<li class="ui-cpn__fact" data-fact="cap">${glyph(capIcon)}<span>Confidence capped at <b>${this.cap}</b></span></li>` : nothing}
              ${this.notified ? html`<li class="ui-cpn__fact" data-fact="notified">${glyph(bellIcon)}<span><b>${this.notified}</b> notified</span></li>` : nothing}
            </ul>`
          : nothing}
        ${this.renderDetail()}
      </div>
    </div>`;
  }

  static override css = /* css */ `
/* The tone follows the level: partly proven is a warning, not proven is danger */
[data-ui="cpn"] {
  --tc-capability-notice-fg: var(--tc-status-warning-fg);
  --tc-capability-notice-bg: var(--tc-status-warning-bg);
  --tc-capability-notice-border: var(--tc-status-warning-border);
  --tc-capability-notice-solid: var(--tc-status-warning-solid);
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 560px;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  container-type: inline-size;
}
[data-ui="cpn"][level="unproven"] {
  --tc-capability-notice-fg: var(--tc-status-danger-fg);
  --tc-capability-notice-bg: var(--tc-status-danger-bg);
  --tc-capability-notice-border: var(--tc-status-danger-border);
  --tc-capability-notice-solid: var(--tc-status-danger-solid);
}
[data-ui="cpn"] *, [data-ui="cpn"] *::before, [data-ui="cpn"] *::after { box-sizing: border-box; }
:where([data-ui="cpn"]) :is(p, ul) { margin: 0; padding: 0; }
:where([data-ui="cpn"]) ul { list-style: none; }
:where([data-ui="cpn"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="cpn"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="cpn"] [hidden] { display: none !important; }
[data-ui="cpn"] b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-cpn__glyph { display: block; flex: none; width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-cpn__glyph { stroke-width: 1.5; }
/* ----- The box: a toned band (Standard), a white card with a toned rule (Clean) ----- */
.ui-cpn__box { position: relative; display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--tc-space-2-5); min-width: 0; padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-3) var(--tc-space-3); border-radius: var(--tc-radius-xl); animation: ui-cpn-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-cpn__box { background: var(--tc-capability-notice-bg); box-shadow: inset 0 0 0 1px var(--tc-capability-notice-border); }
:where([data-look="clean"], [data-look="clean"] *).ui-cpn__box { overflow: hidden; padding-left: var(--tc-space-4); border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
:where([data-look="clean"], [data-look="clean"] *).ui-cpn__box::before { content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: 3px; background: var(--tc-capability-notice-solid); }
.ui-cpn__icon { display: grid; place-items: center; width: 24px; height: 24px; border-radius: var(--tc-radius-sm); color: var(--tc-capability-notice-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-cpn__icon { background: var(--tc-surface-raised); box-shadow: inset 0 0 0 1px var(--tc-capability-notice-border); }
:where([data-look="clean"], [data-look="clean"] *).ui-cpn__icon { background: var(--tc-capability-notice-bg); }
.ui-cpn__icon .ui-cpn__glyph { width: 14px; height: 14px; }
.ui-cpn__main { display: grid; gap: var(--tc-space-1-5); min-width: 0; }
.ui-cpn__titles { display: flex; flex-wrap: wrap; align-items: baseline; column-gap: var(--tc-space-2); row-gap: var(--tc-space-0-5); min-height: 24px; padding-top: var(--tc-space-0-5); }
.ui-cpn__level { font-size: var(--tc-eyebrow-font-size); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-eyebrow-line-height); letter-spacing: var(--tc-eyebrow-tracking); text-transform: var(--tc-eyebrow-transform); color: var(--tc-capability-notice-fg); white-space: nowrap; }
.ui-cpn__title { font-size: var(--tc-title-font-size); font-weight: var(--tc-title-font-weight); line-height: var(--tc-title-line-height); letter-spacing: var(--tc-title-tracking); color: var(--tc-title-color); text-wrap: pretty; }
/* The task area: a label and the area's name, like a field on a form */
.ui-cpn__area { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-0-5) var(--tc-space-2); font-size: var(--tc-font-size-sm); }
.ui-cpn__area-label { color: var(--tc-text-muted); }
.ui-cpn__area-name { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-cpn__message { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); text-wrap: pretty; }
/* The cap and who was told: quiet chips */
.ui-cpn__facts { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); padding-top: var(--tc-space-0-5); }
.ui-cpn__fact { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-font-weight-regular); color: var(--tc-text-secondary); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-cpn__fact { background: var(--tc-surface-raised); box-shadow: inset 0 0 0 1px var(--tc-capability-notice-border); }
:where([data-look="clean"], [data-look="clean"] *).ui-cpn__fact { background: var(--tc-fill-subtle); }
.ui-cpn__fact .ui-cpn__glyph { width: 13px; height: 13px; color: var(--tc-capability-notice-fg); }
.ui-cpn__fact > span { overflow: hidden; text-overflow: ellipsis; }
/* ----- The folded detail: the distance from usual on a small scale ----- */
.ui-cpn__fold { display: grid; gap: var(--tc-space-2); margin-top: var(--tc-space-0-5); }
.ui-cpn__toggle { display: inline-flex; align-items: center; justify-self: start; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); margin-left: calc(var(--tc-space-2) * -1); padding: 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-ghost-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cpn__toggle:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-cpn__score { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-cpn__score[data-beyond] { color: var(--tc-capability-notice-fg); }
.ui-cpn__chev { width: 14px; height: 14px; transition: transform var(--tc-duration-base) var(--tc-ease-move); }
[data-ui="cpn"][open] .ui-cpn__chev { transform: rotate(180deg); }
.ui-cpn__detail { display: grid; gap: var(--tc-space-2); max-width: 360px; padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-2-5); border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); animation: ui-cpn-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-cpn__detail { box-shadow: inset 0 0 0 1px var(--tc-capability-notice-border); }
:where([data-look="clean"], [data-look="clean"] *).ui-cpn__detail { background: var(--tc-surface-well); }
.ui-cpn__scale { display: grid; gap: var(--tc-space-1-5); }
.ui-cpn__track { position: relative; display: block; height: 6px; border-radius: var(--tc-radius-full); background: var(--tc-capability-notice-bg); box-shadow: inset 0 0 0 1px var(--tc-capability-notice-border); }
/* The usual range: shaded from the low end to the threshold */
.ui-cpn__usual { position: absolute; top: 0; bottom: 0; left: 0; border-radius: var(--tc-radius-full); background: var(--tc-fill-strong); }
.ui-cpn__tick { position: absolute; top: -3px; bottom: -3px; width: 2px; border-radius: var(--tc-radius-full); background: var(--tc-text-muted); transform: translateX(-50%); }
.ui-cpn__dot { position: absolute; top: 50%; width: 12px; height: 12px; border-radius: var(--tc-radius-full); background: var(--tc-text-primary); box-shadow: 0 0 0 2px var(--tc-surface-raised); transform: translate(-50%, -50%); }
.ui-cpn__dot[data-beyond] { background: var(--tc-capability-notice-solid); }
.ui-cpn__ends { position: relative; display: flex; justify-content: space-between; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-2xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-cpn__usual-label { position: absolute; top: 0; transform: translateX(-50%); white-space: nowrap; }
.ui-cpn__note { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-normal); color: var(--tc-text-muted); text-wrap: pretty; }
@keyframes ui-cpn-in { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: none; } }
/* Narrow: tighter, and the chips may wrap their text */
@container (max-width: 360px) {
  .ui-cpn__box { gap: var(--tc-space-2); padding-right: var(--tc-space-3); }
  .ui-cpn__fact { white-space: normal; height: auto; min-height: var(--tc-pill-h-lg); padding-top: var(--tc-space-0-5); padding-bottom: var(--tc-space-0-5); }
}
@media (pointer: coarse) {
  .ui-cpn__toggle { height: var(--tc-control-h-md); }
}
@media (forced-colors: active) {
  .ui-cpn__box { border: 1px solid CanvasText; }
  .ui-cpn__dot { background: Highlight; }
  .ui-cpn__usual, .ui-cpn__tick { background: GrayText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="cpn"] *, [data-ui="cpn"] *::before, [data-ui="cpn"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-capability-notice")) customElements.define("tc-capability-notice", TcCapabilityNotice);

declare global {
  interface HTMLElementTagNameMap {
    "tc-capability-notice": TcCapabilityNotice;
  }
}
