import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { PopoverController } from "./internal/popover";
import { safeMediaUrl } from "./internal/safe-media";
import { safeUrl } from "./internal/safe-url";
import { formatDate, initials } from "./internal/util";

/*
 * <tc-pr-link> – a pull request named in running text: its state's mark, then owner/repo#number · title as a link.
 * Point at it (after a short pause) or focus it, and a small card opens below it: the state as a pill, the repository,
 * number and how long ago, the full title, who wrote it, the lines added and removed, and how many files changed.
 *
 *   <p>That landed in <tc-pr-link repo="halden/atlas" number="74" pr-title="Add the stage illustrations" state="merged"
 *     href="https://github.com/halden/atlas/pull/74" author="noor" additions="4080" deletions="42" files="60"></tc-pr-link>.</p>
 *
 *   · the card only says things – it's a tooltip the link is described by, so a screen reader hears the state, the
 *     author and the size on focus. The link's own name carries the state too ("…, merged")
 *   · it never calls a network: the page gives every detail, and leaves out what it doesn't know
 *   · `compact` shows just the mark and #number – for a table, or a sentence that has named the repository already
 *   · touch: a tap opens the card (the link then follows on the second tap), a tap outside closes it
 *   · times are relative to `now`, or the element's own clock when the card opens
 * One look: the link takes the text's size and flows with it; the card is the shared popover surface.
 */

export type PrLinkState = "open" | "draft" | "merged" | "closed";
export type PrLinkLabels = Record<PrLinkState, string> & {
  /** "{count} files" */
  files: string;
  /** "{count} file" */
  file: string;
  /** "{added} lines added, {removed} removed" – for screen readers */
  lines: string;
  /** "by {author}" – for screen readers */
  by: string;
};

/** Details of the events */
export type PrLinkOpenChange = { open: boolean };

export const defaultPrLinkLabels: PrLinkLabels = {
  open: "Open",
  draft: "Draft",
  merged: "Merged",
  closed: "Closed",
  files: "{count} files",
  file: "{count} file",
  lines: "{added} lines added, {removed} removed",
  by: "by {author}",
};

const MIN = 60_000;
let instances = 0;

/* git-pull-request, git-pull-request-draft, git-merge, git-pull-request-closed: Lucide (ISC, lucide.dev) */
const ICONS: Record<PrLinkState, ReturnType<typeof svg>> = {
  open: svg`<circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M13 6h3a2 2 0 0 1 2 2v7"></path><line x1="6" x2="6" y1="9" y2="21"></line>`,
  draft: svg`<circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M18 6V5"></path><path d="M18 11v-1"></path><line x1="6" x2="6" y1="9" y2="21"></line>`,
  merged: svg`<circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M6 21V9a9 9 0 0 0 9 9"></path>`,
  closed: svg`<circle cx="6" cy="6" r="3"></circle><path d="M6 9v12"></path><path d="m21 3-6 6"></path><path d="m21 9-6-6"></path><path d="M18 11.5V15"></path><circle cx="18" cy="18" r="3"></circle>`,
};
const mark = (state: PrLinkState) =>
  html`<svg class="ui-prk__mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[state]}</svg>`;

/**
 * A pull request in running text – its state's mark and owner/repo#number · title as a link, with a card of its state,
 * author, lines changed and files on hover or focus.
 * @tag tc-pr-link
 * @fires tc-open-change - The card opened or closed ({ open }: PrLinkOpenChange)
 */
export class TcPrLink extends TcElement {
  static override ui = "prk";
  static override looks = false;

  /** The repository, "owner/name" */
  @property() accessor repo = "";
  /** The pull request's number */
  @property({ type: Number }) accessor number: number | undefined = undefined;
  /** Its title */
  @property({ attribute: "pr-title" }) accessor prTitle = "";
  /** Open, draft, merged or closed */
  @property({ reflect: true }) accessor state: PrLinkState = "open";
  /** Where the link goes; without one it's text with the card, not a link */
  @property() accessor href = "";
  /** Who wrote it */
  @property() accessor author = "";
  /** The author's picture URL; without one the card shows initials */
  @property() accessor avatar = "";
  /** Lines added */
  @property({ type: Number }) accessor additions: number | undefined = undefined;
  /** Lines removed */
  @property({ type: Number }) accessor deletions: number | undefined = undefined;
  /** Files changed */
  @property({ type: Number }) accessor files: number | undefined = undefined;
  /** When it last changed state (opened, merged, closed), epoch ms */
  @property({ type: Number, attribute: "updated-at" }) accessor updatedAt: number | undefined = undefined;
  /** The time now, epoch ms; by default the element's own clock when the card opens */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Just the mark and #number, without the repository and title */
  @property({ type: Boolean, reflect: true }) accessor compact = false;
  /** Open the link in a new tab */
  @property({ type: Boolean, attribute: "new-tab" }) accessor newTab = false;
  /** How long the pointer rests on the link before the card opens, ms */
  @property({ type: Number, attribute: "hover-delay" }) accessor hoverDelay = 350;
  /** The language for numbers and times, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** The words it uses, to translate or reword */
  @property({ attribute: false }) accessor labels: Partial<PrLinkLabels> = {};

  /** @internal The clock the card's time was read at */
  @state() accessor clock = 0;

  private readonly uid = `tc-prk${++instances}`;
  private touched = false;
  private openAtDown = false;

  private readonly pop: PopoverController = new PopoverController(this, {
    popover: () => this.querySelector<HTMLElement>(".ui-prk__card"),
    anchor: (): Element | DOMRect | null => {
      const t = this.trigger;
      if (!t?.isConnected) return null;
      // The link's first line, when it wraps
      return t.getClientRects()[0] ?? t.getBoundingClientRect();
    },
    side: "bottom",
    align: "start",
    kind: "tooltip",
    trigger: () => this.trigger,
    hover: { delay: () => this.hoverDelay },
    closeOnFocusOut: true,
    inside: () => [this],
    onClose: () => this.emit<PrLinkOpenChange>("tc-open-change", { open: false }),
  });

  /** The link (or the text, without `href`) the card belongs to */
  get trigger(): HTMLElement | null {
    return this.querySelector<HTMLElement>(".ui-prk__link");
  }

  /** Opens the card, pinned open */
  openCard() {
    this.show(true);
  }
  /** Closes the card */
  closeCard() {
    if (this.pop.open) this.pop.close();
  }

  private label(key: keyof PrLinkLabels, vars: Record<string, string> = {}) {
    const text = this.labels[key] ?? defaultPrLinkLabels[key];
    return text.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
  }
  private num(n: number) {
    return n.toLocaleString(this.locale);
  }
  private ago(ms: number) {
    const time = this.now ?? this.clock;
    const diff = Math.max(0, time - ms);
    const rtf = new Intl.RelativeTimeFormat(this.locale, { numeric: "auto", style: "short" });
    if (diff < MIN) return rtf.format(0, "second");
    if (diff < 60 * MIN) return rtf.format(-Math.floor(diff / MIN), "minute");
    if (diff < 24 * 60 * MIN) return rtf.format(-Math.floor(diff / (60 * MIN)), "hour");
    if (diff < 7 * 24 * 60 * MIN) return rtf.format(-Math.floor(diff / (24 * 60 * MIN)), "day");
    const sameYear = new Date(ms).getFullYear() === new Date(time).getFullYear();
    return formatDate(ms, this.locale, sameYear ? { month: "short", day: "numeric" } : { year: "numeric", month: "short", day: "numeric" });
  }

  private show(pin = false) {
    const was = this.pop.open;
    this.clock = this.now ?? Date.now();
    this.pop.show({ pin });
    if (!was) this.emit<PrLinkOpenChange>("tc-open-change", { open: true });
  }

  /* ---------- The link's events ---------- */

  private onEnter = (e: PointerEvent) => this.pop.hoverEnter(e, () => this.show());
  private onLeave = (e: PointerEvent) => this.pop.hoverLeave(e);
  private onDown = (e: PointerEvent) => {
    this.touched = e.pointerType === "touch" || e.pointerType === "pen";
    this.openAtDown = this.pop.open;
  };
  private onFocus = () => {
    if (!this.pop.open) this.show();
  };
  private onClick = (e: MouseEvent) => {
    const touch = this.touched;
    this.touched = false;
    // A tap opens the card first – even when the tap's focus has opened it already – and the second follows the link
    if (touch && !this.openAtDown) {
      e.preventDefault();
      this.show(true);
    }
  };

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (this.pop.open && changed.has("now")) this.clock = this.now ?? this.clock;
  }

  /* ---------- Rendering ---------- */

  private renderCard() {
    if (!this.pop.open) return nothing;
    const s = this.state;
    const time = this.updatedAt !== undefined ? this.ago(this.updatedAt) : "";
    const pic = safeMediaUrl(this.avatar);
    const hasLines = this.additions !== undefined || this.deletions !== undefined;
    return html`<div class="tc-pop ui-prk__card" id=${`${this.uid}-card`} data-state=${s}>
      <p class="ui-prk__top">
        <span class="ui-prk__pill" data-state=${s}>${mark(s)}${this.label(s)}</span>
        ${this.repo ? html`<span class="ui-prk__repo">${this.repo}</span>` : nothing}
        ${this.number !== undefined ? html`<span class="ui-prk__num">#${this.number}</span>` : nothing}
        ${time ? html`<span class="ui-prk__time">${time}</span>` : nothing}
      </p>
      ${this.prTitle ? html`<p class="ui-prk__title">${this.prTitle}</p>` : nothing}
      ${this.author || hasLines || this.files !== undefined
        ? html`<p class="ui-prk__foot">
            ${this.author
              ? html`<span class="ui-prk__author"
                  >${pic
                    ? html`<span class="ui-prk__avatar" aria-hidden="true"><img src=${pic} alt="" loading="lazy" decoding="async" /></span>`
                    : html`<span class="ui-prk__avatar" aria-hidden="true">${initials(this.author)}</span>`}<span class="tc-sr-only">${this.label("by", { author: "" }).trim()} </span
                  >${this.author}</span
                >`
              : nothing}
            <span class="ui-prk__spacer"></span>
            ${hasLines
              ? html`<span class="ui-prk__chip ui-prk__lines"
                  ><span aria-hidden="true"
                    ><span class="ui-prk__add">+${this.num(this.additions ?? 0)}</span> <span class="ui-prk__del">−${this.num(this.deletions ?? 0)}</span></span
                  ><span class="tc-sr-only">${this.label("lines", { added: this.num(this.additions ?? 0), removed: this.num(this.deletions ?? 0) })}</span></span
                >`
              : nothing}
            ${this.files !== undefined ? html`<span class="ui-prk__chip">${this.label(this.files === 1 ? "file" : "files", { count: this.num(this.files) })}</span>` : nothing}
          </p>`
        : nothing}
    </div>`;
  }

  protected override render() {
    const s = this.state;
    const ref = `${this.repo}${this.number !== undefined ? `#${this.number}` : ""}`;
    const text = this.compact ? (this.number !== undefined ? `#${this.number}` : ref) : [ref, this.prTitle].filter(Boolean).join(" · ");
    const href = safeUrl(this.href);
    const described = this.pop.open ? `${this.uid}-card` : undefined;
    const inner = html`${mark(s)}<span class="ui-prk__text">${text}</span><span class="tc-sr-only">, ${this.label(s).toLowerCase()}</span>`;
    const events = {
      pointerenter: this.onEnter,
      pointerleave: this.onLeave,
      pointerdown: this.onDown,
      focus: this.onFocus,
      click: this.onClick,
    };
    const link = href
      ? html`<a
          class="ui-prk__link"
          href=${href}
          target=${ifDefined(this.newTab ? "_blank" : undefined)}
          rel=${ifDefined(this.newTab ? "noopener noreferrer" : undefined)}
          aria-describedby=${ifDefined(described)}
          @pointerenter=${events.pointerenter}
          @pointerleave=${events.pointerleave}
          @pointerdown=${events.pointerdown}
          @focus=${events.focus}
          @click=${events.click}
          >${inner}</a
        >`
      : html`<span
          class="ui-prk__link"
          tabindex="0"
          aria-describedby=${ifDefined(described)}
          @pointerenter=${events.pointerenter}
          @pointerleave=${events.pointerleave}
          @pointerdown=${events.pointerdown}
          @focus=${events.focus}
          @click=${events.click}
          >${inner}</span
        >`;
    return html`${link}${this.renderCard()}`;
  }

  static override css = /* css */ `
[data-ui="prk"] {
  --tc-prk-title-max: 32ch;
  --tc-prk-card-w: 340px;
  display: inline;
}
.ui-prk__link { display: inline; color: var(--tc-accent-text); text-decoration: underline; text-decoration-color: color-mix(in srgb, currentColor 45%, transparent); text-underline-offset: 0.18em; text-decoration-thickness: from-font; border-radius: var(--tc-radius-xs); cursor: pointer; }
.ui-prk__link:hover { text-decoration-color: currentColor; }
.ui-prk__link:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-prk__link .ui-prk__mark { display: inline-block; width: 1em; height: 1em; margin-inline-end: 0.25em; vertical-align: -0.14em; }
.ui-prk__text { overflow-wrap: anywhere; }
[data-ui="prk"]:not([compact]) .ui-prk__text { display: inline-block; max-width: min(var(--tc-prk-title-max), 100%); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: bottom; }
[data-ui="prk"] .ui-prk__mark { color: var(--tc-status-success-fg); }
[data-ui="prk"][state="draft"] .ui-prk__link .ui-prk__mark { color: var(--tc-text-muted); }
[data-ui="prk"][state="merged"] .ui-prk__link .ui-prk__mark { color: var(--tc-tone-violet-fg); }
[data-ui="prk"][state="closed"] .ui-prk__link .ui-prk__mark { color: var(--tc-status-danger-fg); }
/* The card */
.ui-prk__card { display: grid; gap: var(--tc-space-2); width: min(var(--tc-prk-card-w), calc(100vw - var(--tc-space-4))); padding: var(--tc-space-3); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); white-space: normal; text-align: left; }
.ui-prk__card p { margin: 0; }
.ui-prk__top { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; color: var(--tc-text-muted); }
.ui-prk__pill { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); padding: var(--tc-space-0-5) var(--tc-space-2); border-radius: var(--tc-radius-full); background: var(--tc-status-success-bg); font-weight: var(--tc-font-weight-medium); color: var(--tc-status-success-fg); }
.ui-prk__pill .ui-prk__mark { width: 14px; height: 14px; color: inherit; }
.ui-prk__pill[data-state="draft"] { background: var(--tc-fill-default); color: var(--tc-text-secondary); }
.ui-prk__pill[data-state="merged"] { background: var(--tc-tone-violet-bg); color: var(--tc-tone-violet-fg); }
.ui-prk__pill[data-state="closed"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-prk__repo { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-prk__num, .ui-prk__time { flex: none; white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-prk__title { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-prk__foot { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); }
.ui-prk__author { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; color: var(--tc-text-secondary); }
.ui-prk__avatar { display: inline-grid; flex: none; place-items: center; width: var(--tc-space-5); height: var(--tc-space-5); overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-prk__avatar img { width: 100%; height: 100%; object-fit: cover; }
.ui-prk__spacer { flex: 1; }
.ui-prk__chip { display: inline-flex; align-items: center; padding: var(--tc-space-0-5) var(--tc-space-2); border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); color: var(--tc-text-secondary); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-prk__add { color: var(--tc-status-success-fg); }
.ui-prk__del { color: var(--tc-status-danger-fg); }
@media (forced-colors: active) {
  .ui-prk__pill, .ui-prk__chip { border: 1px solid CanvasText; }
}
`;
}

if (!customElements.get("tc-pr-link")) customElements.define("tc-pr-link", TcPrLink);

declare global {
  interface HTMLElementTagNameMap {
    "tc-pr-link": TcPrLink;
  }
}
