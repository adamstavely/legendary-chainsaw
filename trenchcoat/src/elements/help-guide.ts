import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";

/*
 * <tc-help-guide> – point-in-time help that lives in the help center: a small guide-page icon that sits beside a
 * heading, a field label or a toolbar and links to one written tutorial. Help Video's sibling – where there's no video,
 * there's a guide.
 *   · the icon is a page with its corner folded and lines of text cut through it, in the text colour, sized to the
 *     text around it (`size`: sm, md or lg); a tooltip names the guide and how long it takes to read
 *   · it's a real link (`href`), opening in a new tab unless `same-tab`; `label` puts words beside it ("Read the guide")
 *   · opening it fires tc-guide-open, cancelable – a page that shows guides in its own panel prevents it and opens
 *     the guide there
 *   · once opened, a small check sits on the icon's corner (tc-read-change); a page stores it and passes `read` back
 *   · `updated-on` (a date) puts a small dot on the top-right corner for `new-days` days (14 by default) to say the
 *     guide changed; opening it clears the dot (tc-update-seen-change), and a page passes `update-seen` back
 * The icon looks the same in Standard and Clean.
 *
 *   <h2>Risk rules <tc-help-guide heading="Write a risk rule" href="/help/risk-rules" minutes="5"></tc-help-guide></h2>
 */

export type HelpGuideSize = "sm" | "md" | "lg";
/** tc-guide-open: where the guide is */
export type HelpGuideOpen = { href: string; heading: string };
export type HelpGuideReadChange = { read: boolean };
export type HelpGuideUpdateSeenChange = { updateSeen: boolean };

/** The element's words, every one renameable through `labels` */
export type HelpGuideLabels = {
  read: string;
  readDone: string;
  minutes: string;
  newTab: string;
  updated: string;
};
export const defaultHelpGuideLabels: HelpGuideLabels = {
  read: "Read guide",
  readDone: "Read",
  minutes: "{n} min read",
  newTab: "opens in a new tab",
  updated: "Updated",
};

const DAY = 86_400_000;
const CHECK = svg`<path d="M20 6 9 17l-5-5"></path>`;
let instances = 0;

/**
 * Point-in-time help from the help center: a small guide icon to put beside a heading or label, linking to one written tutorial.
 * @tag tc-help-guide
 * @fires tc-guide-open - The guide was opened ({ href, heading }: HelpGuideOpen); cancelable – prevented, the link doesn't navigate, so the page can show the guide its own way
 * @fires tc-read-change - The guide was opened for the first time ({ read }: HelpGuideReadChange); cancelable – prevented, `read` stays as it was
 * @fires tc-update-seen-change - The guide was opened while the Updated dot showed ({ updateSeen }: HelpGuideUpdateSeenChange); cancelable – prevented, the dot stays
 */
export class TcHelpGuide extends TcElement {
  static override ui = "hgd";

  /** The guide's title – the tooltip and the link's accessible name */
  @property() accessor heading = "";
  /** Where the guide is: a page in the help center */
  @property() accessor href = "";
  /** How long it takes to read, in minutes – "5 min read" in the tooltip */
  @property({ type: Number }) accessor minutes: number | undefined = undefined;
  /** Opens the guide in this tab rather than a new one */
  @property({ type: Boolean, attribute: "same-tab" }) accessor sameTab = false;
  /** Words beside the icon, e.g. "Read the guide"; unset, the icon stands alone with a tooltip */
  @property() accessor label = "";
  /** The icon's size against the text around it: "sm" (1em), "md" (1.25em, the default) or "lg" (1.5em) */
  @property({ reflect: true }) accessor size: HelpGuideSize = "md";
  /** Whether it has been read – a check on the icon. Set when it's opened, unless a tc-read-change listener calls preventDefault() */
  @property({ type: Boolean, reflect: true }) accessor read = false;
  /** When the guide last changed, as a date ("2026-11-17"); for `new-days` days after it, a dot on the icon says so */
  @property({ attribute: "updated-on" }) accessor updatedOn: string | undefined = undefined;
  /** How many days after `updated-on` the dot shows (default 14) */
  @property({ type: Number, attribute: "new-days" }) accessor newDays = 14;
  /** Whether this person has seen the update – the dot is cleared. Set when the guide is opened, unless a tc-update-seen-change listener calls preventDefault() */
  @property({ type: Boolean, reflect: true, attribute: "update-seen" }) accessor updateSeen = false;
  /** The time to measure `new-days` from, in milliseconds; unset, the clock's */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<HelpGuideLabels> = {};

  private readonly uid = `tc-hgd-${++instances}`;

  private get words(): HelpGuideLabels {
    return { ...defaultHelpGuideLabels, ...this.labels };
  }

  /** Whether the Updated dot shows: a change in the last `new-days` days this person hasn't opened yet */
  get showsUpdate(): boolean {
    if (!this.updatedOn || this.updateSeen) return false;
    const at = new Date(this.updatedOn).getTime();
    if (Number.isNaN(at)) return false;
    return (this.now ?? Date.now()) < at + this.newDays * DAY;
  }

  private open(e: MouseEvent) {
    // A modified click (new tab, new window, download) is the person's own choice: let the browser have it
    const own = e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
    if (!own && !this.emit<HelpGuideOpen>("tc-guide-open", { href: this.href, heading: this.heading }, { cancelable: true })) e.preventDefault();
    if (!this.read && this.emit<HelpGuideReadChange>("tc-read-change", { read: true }, { cancelable: true })) this.read = true;
    if (this.showsUpdate && this.emit<HelpGuideUpdateSeenChange>("tc-update-seen-change", { updateSeen: true }, { cancelable: true })) this.updateSeen = true;
  }

  /** The guide page: a sheet with its corner folded and lines of text cut out of it */
  private icon() {
    const mask = `${this.uid}-cut`;
    return html`<svg class="ui-hgd__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <defs>
        <mask id=${mask} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
          <rect width="24" height="24" fill="white"></rect>
          <path d="M14.2 2.6v4.1a1.2 1.2 0 0 0 1.2 1.2h4.1" fill="none" stroke="black" stroke-width="1.6" stroke-linejoin="round"></path>
          <rect x="7.4" y="11" width="9.2" height="1.8" rx="0.9" fill="black"></rect>
          <rect x="7.4" y="14.6" width="9.2" height="1.8" rx="0.9" fill="black"></rect>
          <rect x="7.4" y="18.2" width="5.6" height="1.8" rx="0.9" fill="black"></rect>
        </mask>
      </defs>
      <path class="ui-hgd__page" d="M6.6 1.8h7.9l5.6 5.6v12.8a2 2 0 0 1-2 2H6.6a2 2 0 0 1-2-2V3.8a2 2 0 0 1 2-2Z" mask=${`url(#${mask})`}></path>
    </svg>`;
  }

  protected override render() {
    const w = this.words;
    const fresh = this.showsUpdate;
    const time = this.minutes != null ? w.minutes.replace("{n}", String(this.minutes)) : "";
    const tip = [this.heading, time, fresh ? w.updated : ""].filter(Boolean).join(" · ");
    const name = [this.heading, time, this.read ? w.readDone : "", fresh ? w.updated : "", this.sameTab ? "" : w.newTab].filter(Boolean).join(", ");
    return html`<a
      class="ui-hgd__trigger"
      href=${ifDefined(this.href || undefined)}
      target=${ifDefined(this.sameTab ? undefined : "_blank")}
      rel=${ifDefined(this.sameTab ? undefined : "noopener")}
      ?data-labelled=${!!this.label}
      @click=${(e: MouseEvent) => this.open(e)}
    >
      <span class="ui-hgd__mark">${this.icon()}${this.read ? html`<span class="ui-hgd__seen" aria-hidden="true"><svg viewBox="0 0 24 24">${CHECK}</svg></span>` : nothing}${fresh ? html`<span class="ui-hgd__new" aria-hidden="true"></span>` : nothing}</span>
      ${this.label ? html`<span class="ui-hgd__label">${this.label}</span>` : nothing}
      <span class="tc-sr-only">${this.label ? "" : `${w.read}: `}${name}</span>
      ${!this.label && tip ? html`<span class="ui-hgd__tip" aria-hidden="true">${tip}</span>` : nothing}
    </a>`;
  }

  static override css = /* css */ `
/* The icon's size and colours – override them on the element */
[data-ui="hgd"] {
  --tc-hgd-size: 1.25em; --tc-hgd-ink: var(--tc-text-secondary); --tc-hgd-ink-hover: var(--tc-text-primary); --tc-hgd-dot: var(--tc-accent);
  position: relative; display: inline-flex; vertical-align: middle; font-weight: var(--tc-font-weight-regular); text-align: left;
}
[data-ui="hgd"][size="sm"] { --tc-hgd-size: 1em; }
[data-ui="hgd"][size="lg"] { --tc-hgd-size: 1.5em; }
[data-ui="hgd"] *, [data-ui="hgd"] *::before, [data-ui="hgd"] *::after { box-sizing: border-box; }

/* The link: the icon on a hit area of at least 24 px, which doesn't push the line apart */
.ui-hgd__trigger { position: relative; display: inline-flex; align-items: center; gap: var(--tc-space-1); min-width: var(--tc-space-6); min-height: var(--tc-space-6); margin: calc(var(--tc-space-1) * -1) 0; padding: 0 var(--tc-space-0-5); border-radius: var(--tc-radius-sm); color: var(--tc-hgd-ink); font: inherit; line-height: var(--tc-line-height-none); text-decoration: none; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: color var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-hgd__trigger:hover { color: var(--tc-hgd-ink-hover); }
.ui-hgd__trigger:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-hgd__trigger[data-labelled] { padding: 0 var(--tc-space-1-5) 0 var(--tc-space-1); border-radius: var(--tc-radius-full); background: var(--tc-surface-tray); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-hgd__trigger[data-labelled]:hover { background: var(--tc-border-default); }
.ui-hgd__mark { position: relative; display: inline-grid; place-items: center; flex: none; width: var(--tc-hgd-size); height: var(--tc-hgd-size); }
.ui-hgd__trigger[data-labelled] .ui-hgd__mark { width: calc(var(--tc-hgd-size) * 1.15); height: calc(var(--tc-hgd-size) * 1.15); }
.ui-hgd__icon { display: block; width: 100%; height: 100%; overflow: visible; transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-hgd__page { fill: currentColor; }
.ui-hgd__trigger:hover .ui-hgd__icon { transform: scale(1.08) rotate(-4deg); }
.ui-hgd__seen { position: absolute; right: -22%; bottom: -18%; display: grid; place-items: center; width: 58%; height: 58%; border-radius: var(--tc-radius-full); background: var(--tc-status-success-fg); box-shadow: 0 0 0 var(--tc-space-0-5) var(--tc-surface-raised); color: var(--tc-surface-raised); }
.ui-hgd__seen svg { width: 72%; height: 72%; fill: none; stroke: currentColor; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
.ui-hgd__new { position: absolute; top: -10%; right: -10%; width: 30%; height: 30%; min-width: var(--tc-space-1); min-height: var(--tc-space-1); border-radius: var(--tc-radius-full); background: var(--tc-hgd-dot); box-shadow: 0 0 0 var(--tc-space-0-5) var(--tc-surface-raised); animation: tc-hgd-new var(--tc-duration-slow) var(--tc-ease-standard) 2; }
@keyframes tc-hgd-new { 50% { transform: scale(1.35); } }
.ui-hgd__label { white-space: nowrap; }
.ui-hgd__tip { position: absolute; left: 50%; bottom: calc(100% + var(--tc-space-1-5)); z-index: var(--tc-z-popover); width: max-content; max-width: calc(var(--tc-space-16) * 4); padding: var(--tc-tooltip-py) var(--tc-tooltip-px); border-radius: var(--tc-tooltip-radius); background: var(--tc-tooltip-bg); color: var(--tc-tooltip-fg); font-family: var(--tc-font-sans); font-size: var(--tc-tooltip-font-size); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); white-space: normal; text-align: center; pointer-events: none; opacity: 0; transform: translate(-50%, var(--tc-space-0-5)); transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-hgd__trigger:is(:hover, :focus-visible) .ui-hgd__tip { opacity: 1; transform: translate(-50%, 0); transition-delay: var(--tc-duration-moderate); }
@media (prefers-reduced-motion: reduce) {
  .ui-hgd__trigger, .ui-hgd__icon, .ui-hgd__tip { transition: none; }
  .ui-hgd__trigger:hover .ui-hgd__icon { transform: none; }
  .ui-hgd__new { animation: none; }
}
@media (forced-colors: active) {
  .ui-hgd__page { fill: LinkText; }
  .ui-hgd__new { forced-color-adjust: none; background: Highlight; box-shadow: none; }
  .ui-hgd__seen { forced-color-adjust: none; background: Highlight; color: HighlightText; box-shadow: none; }
}
`;
}

if (!customElements.get("tc-help-guide")) customElements.define("tc-help-guide", TcHelpGuide);

declare global {
  interface HTMLElementTagNameMap {
    "tc-help-guide": TcHelpGuide;
  }
}
