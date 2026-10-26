import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import type { Look } from "./internal/look";

/*
 * <tc-change-summary> – the Lit port of src/components/change-summary.tsx: what moved since last time, one metric per
 * row. Standard sits in a gray tray with a white card; Clean is one white card with hairline shadows, the heading as
 * its first row and thinner icons.
 *
 *   <tc-change-summary period="This week" .changes=${[{ label: "Active users", change: "Up 6.1%", tone: "good" }]}>
 *   </tc-change-summary>
 *
 * The host is the region (role="region", named by the title). Good and bad changes are said in words as well as
 * colour ("Good change: …"); labels and changes that may be cut off keep their full text in a title.
 */

export type MetricChange = {
  label: string;
  /** What happened, in words, e.g. "Up 6.1% to 18.2K" */
  change: string;
  /** good: green arrow · bad: red arrow · neutral: gray dash */
  tone?: "good" | "bad" | "neutral";
  /** Direction of the arrow – defaults to up for good, down for bad */
  direction?: "up" | "down";
};

// Clean: thinner lines
const changesIcon = (look: Look) =>
  html`<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width=${look === "clean" ? 1.1 : 1.5} stroke-linecap="round" aria-hidden="true">${svg`<path d="M2.5 4h4M2.5 8h8M6.5 12h7M9.5 4h1"></path>`}</svg>`;
const arrowIcon = (look: Look, down: boolean) =>
  html`<svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" stroke-width=${look === "clean" ? 1.25 : 1.6} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${down ? svg`<path d="M6 2.5v7M3 6.5l3 3 3-3"></path>` : svg`<path d="M6 9.5v-7M3 5.5l3-3 3 3"></path>`}</svg>`;
const dashIcon = (look: Look) =>
  html`<svg viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" stroke-width=${look === "clean" ? 1.25 : 1.6} stroke-linecap="round" aria-hidden="true">${svg`<path d="M3 6h6"></path>`}</svg>`;

/**
 * What changed since last time, one metric per row, each with a trend mark.
 * @tag tc-change-summary
 */
export class TcChangeSummary extends TcElement {
  static override ui = "cs";

  /** The heading, and the region's name */
  @property() accessor heading = "What's changed";
  /** Small text on the right of the heading, e.g. "This week" */
  @property() accessor period = "";
  /** An icon element in front of the heading (cloned); unset shows the default */
  @property({ attribute: false }) accessor icon: Element | undefined = undefined;
  @property({ attribute: false }) accessor changes: MetricChange[] = [];

  /** The page named the region itself (aria-label or aria-labelledby on the host) */
  private ownName = false;

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    this.ownName ||= (this.hasAttribute("aria-label") && this.getAttribute("aria-label") !== this.heading) || this.hasAttribute("aria-labelledby");
  }

  protected override updated() {
    // The heading names the region unless the page gave it a name of its own
    if (!this.ownName) this.setAttribute("aria-label", this.heading);
  }

  protected override render() {
    const look = this.resolvedLook;
    const clean = look === "clean";
    const headIcon = this.icon ? this.icon.cloneNode(true) : changesIcon(look);
    return html`
      <header class="ui-cs__head">
        <span class="ui-cs__title">
          ${clean ? html`<span class="ui-cs__icon">${headIcon}</span><span class="ui-cs__title-text" title=${this.heading}>${this.heading}</span>` : html`${headIcon}${this.heading}`}
        </span>
        ${this.period ? html`<span class="ui-cs__period">${this.period}</span>` : nothing}
      </header>
      <dl class=${clean ? "ui-cs__list" : "ui-cs__card"}>
        ${this.changes.map((c, i) => {
          const tone = c.tone ?? "neutral";
          const direction = c.direction ?? (tone === "bad" ? "down" : "up");
          return html`<div class="ui-cs__row" style=${styleMap({ animationDelay: `${120 + i * 70}ms` })}>
            <dt class="ui-cs__label" title=${c.label}>${c.label}</dt>
            <dd class="ui-cs__change">
              <span class="ui-cs__trend" data-tone=${tone} aria-hidden="true">${tone === "neutral" ? dashIcon(look) : arrowIcon(look, direction === "down")}</span>
              ${tone !== "neutral" ? html`<span class="ui-cs__sr">${tone === "good" ? "Good change: " : "Bad change: "}</span>` : nothing}
              <span class="ui-cs__text" title=${c.change}>${c.change}</span>
            </dd>
          </div>`;
        })}
      </dl>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="cs"] {
  box-sizing: border-box;
  width: 100%;
  max-width: 480px;
  container-type: inline-size;
  /* Like the Chat Composer: a gray tray with the heading, the white card sits on top of it */
  background: var(--tc-surface-tray);
  /* The gray tray frames the white card on every side */
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  font-family: var(--tc-font-sans);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="cs"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cs"] {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  width: 100%;
  max-width: 480px;
  container-type: inline-size;
  overflow: hidden;
  border-radius: var(--tc-radius-lg);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="cs"] *, [data-ui="cs"] *::before, [data-ui="cs"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *).ui-cs__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3);
  padding: var(--tc-space-3) var(--tc-space-4-5) var(--tc-space-2-5);
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
}
:where([data-look="standard"], [data-look="standard"] *).ui-cs__title {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2);
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-accent-text);
}
:where([data-look="standard"], [data-look="standard"] *).ui-cs__period { font-size: var(--tc-font-size-md); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-cs__card {
  margin: 0;
  overflow: hidden;
  background: var(--tc-surface-on-tray);
  border-radius: var(--tc-card-radius);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="standard"], [data-look="standard"] *).ui-cs__row {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  align-items: center;
  gap: var(--tc-space-4);
  min-height: 52px;
  padding: 0 var(--tc-space-5);
  animation: ui-cs-in var(--tc-duration-slowest) var(--tc-ease-move) both;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-cs__row + .ui-cs__row { border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="standard"], [data-look="standard"] *).ui-cs__row:hover { background: var(--tc-fill-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-cs__label {
  overflow: hidden;
  font-size: var(--tc-font-size-lg);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
  white-space: nowrap;
  text-overflow: ellipsis;
}
:where([data-look="standard"], [data-look="standard"] *).ui-cs__change {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  min-width: 0;
  margin: 0;
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
}
:where([data-ui="cs"][data-look="clean"]) svg { display: block; flex: none; }
/* Heading row: icon + title, the period on the right */
:where([data-look="clean"], [data-look="clean"] *).ui-cs__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3);
  height: 44px;
  padding: 0 var(--tc-space-4);
}
:where([data-look="clean"], [data-look="clean"] *).ui-cs__title {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2);
  min-width: 0;
  font-weight: var(--tc-font-weight-medium);
  white-space: nowrap;
  color: var(--tc-text-strong);
}
:where([data-look="clean"], [data-look="clean"] *).ui-cs__title-text { overflow: hidden; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-cs__icon { display: grid; place-items: center; flex: none; width: 16px; height: 16px; color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-cs__period { flex: none; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
/* One row per metric, each under a hairline */
:where([data-look="clean"], [data-look="clean"] *).ui-cs__list { margin: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-cs__row {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  align-items: center;
  gap: var(--tc-space-4);
  min-height: 48px;
  padding: 0 var(--tc-space-4);
  border-top: var(--tc-hairline) solid var(--tc-divider);
  animation: ui-cs-in var(--tc-duration-slowest) var(--tc-ease-move) both;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-cs__row:hover { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-cs__label {
  overflow: hidden;
  font-weight: var(--tc-font-weight-medium);
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--tc-text-primary);
}
:where([data-look="clean"], [data-look="clean"] *).ui-cs__change {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  min-width: 0;
  margin: 0;
  color: var(--tc-text-secondary);
}
.ui-cs__text { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
/* Narrow: each metric stacks above its change, so the text wraps instead of being cut off */
@container (max-width: 400px) {
:where([data-look="standard"], [data-look="standard"] *).ui-cs__row { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-1); padding: var(--tc-space-3) var(--tc-space-4); }
:where([data-look="standard"], [data-look="standard"] *).ui-cs__label,
:where([data-look="standard"], [data-look="standard"] *).ui-cs__text { white-space: normal; }
:where([data-look="standard"], [data-look="standard"] *).ui-cs__change { align-items: flex-start; }
}
:where([data-look="standard"], [data-look="standard"] *).ui-cs__trend {
  display: grid;
  place-items: center;
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: var(--tc-radius-sm);
}
/* Trend mark: a small tinted square, no strokes */
:where([data-look="clean"], [data-look="clean"] *).ui-cs__trend {
  display: grid;
  place-items: center;
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: var(--tc-radius-badge);
}
.ui-cs__trend[data-tone="good"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-cs__trend[data-tone="bad"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* Bad is more than a colour (WCAG 1.4.1): its mark is outlined, and the row says "Bad change" to screen readers */
.ui-cs__trend[data-tone="bad"] { box-shadow: inset 0 0 0 1px currentColor; }
.ui-cs__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-cs__trend[data-tone="neutral"] { background: var(--tc-fill-default); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-cs__trend[data-tone="neutral"] { background: var(--tc-fill-subtle); color: var(--tc-icon-muted); }
/* Narrow: each metric stacks above its change, so the text wraps instead of being cut off */
@container (max-width: 400px) {
:where([data-look="clean"], [data-look="clean"] *).ui-cs__head { padding: 0 var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-cs__row { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-1); padding: var(--tc-space-2-5) var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-cs__label,
:where([data-look="clean"], [data-look="clean"] *).ui-cs__text { white-space: normal; }
:where([data-look="clean"], [data-look="clean"] *).ui-cs__change { align-items: flex-start; }
}
/* Touch screens: a little more room per row */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-cs__row { min-height: 52px; }
}
@keyframes ui-cs-in {
  from { opacity: 0; transform: translateY(4px); }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-cs__row { animation: none; }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="clean"], [data-look="clean"] *).ui-cs__row { animation: none; transition: none; }
}
`;
}

if (!customElements.get("tc-change-summary")) customElements.define("tc-change-summary", TcChangeSummary);

declare global {
  interface HTMLElementTagNameMap {
    "tc-change-summary": TcChangeSummary;
  }
}
