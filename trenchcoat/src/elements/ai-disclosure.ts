import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { PopoverController } from "./internal/popover";
import { safeUrl } from "./internal/safe-url";
import { formatDate } from "./internal/util";

/*
 * <tc-ai-disclosure> – marks content an AI made and says what that means, in two forms:
 *   · variant="mark" – a small inline badge beside a summary, a draft or a generated field: a sparkle and
 *     "AI-generated" ("AI-assisted", "Edited by you" with `kind`). Pressing it opens a card that says what made it and
 *     when, what it's good and weak at (`limits`), whether a person reviewed it, and Report a problem
 *   · variant="notice" – a quiet paragraph for the top of an assistant panel or a generated page: what the assistant
 *     is, that it can be wrong, where to check, and how to reach a person; `dismissible` adds a close button
 * Report a problem is a link (`report-href`), or a button that fires a cancelable tc-report and then says "Reported".
 * Standard: a tinted pill and a tinted band. Clean: an outlined pill and a white card with a thin accent rule.
 *
 *   <p>Case summary <tc-ai-disclosure model="Review assistant" .madeAt=${…} .limits=${["Can miss handwritten notes"]}></tc-ai-disclosure></p>
 *   <tc-ai-disclosure variant="notice" contact-href="/help/contact" dismissible></tc-ai-disclosure>
 */

export type AiDisclosureVariant = "mark" | "notice";
export type AiDisclosureKind = "generated" | "assisted" | "edited";

/** Detail of tc-report */
export type AiDisclosureReport = { kind: AiDisclosureKind; model: string };
/** Detail of tc-open-change */
export type AiDisclosureOpenChange = { open: boolean };

/** The words it uses; the page can rename any of them */
export type AiDisclosureLabels = {
  generated: string;
  assisted: string;
  edited: string;
  madeBy: string;
  madeByAt: string;
  reviewedBy: string;
  notReviewed: string;
  limits: string;
  report: string;
  reported: string;
  noticeHeading: string;
  noticeBody: string;
  contact: string;
  learn: string;
  dismiss: string;
};
export const defaultAiDisclosureLabels: AiDisclosureLabels = {
  generated: "AI-generated",
  assisted: "AI-assisted",
  edited: "Edited by you",
  madeBy: "Made by {model}",
  madeByAt: "Made by {model} · {date}",
  reviewedBy: "Reviewed by {name}",
  notReviewed: "Not reviewed by a person yet",
  limits: "Good to know",
  report: "Report a problem",
  reported: "Reported – thank you",
  noticeHeading: "You're working with an AI assistant",
  noticeBody: "It drafts, summarises and searches for you. It can be wrong or miss things, so check important details against the source before you rely on them.",
  contact: "Talk to a person",
  learn: "How the assistant works",
  dismiss: "Dismiss",
};

/** What each kind says about the content, for the card's first line */
const MEANS: Record<AiDisclosureKind, string> = {
  generated: "An AI wrote this. Check it before you rely on it.",
  assisted: "A person wrote this with help from an AI.",
  edited: "An AI drafted this and you changed it.",
};

/* Icons: Lucide (ISC, lucide.dev) – sparkles, user-check, circle-alert, flag, x, check */
const glyph = (body: ReturnType<typeof svg>, cls = "ui-aid__glyph") =>
  html`<svg class=${cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const sparkles = (cls?: string) =>
  glyph(
    svg`<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4M22 5h-4M4 17v2M5 18H3"></path>`,
    cls,
  );
const userCheck = () => glyph(svg`<path d="m16 11 2 2 4-4"></path><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>`);
const alertIcon = () => glyph(svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path>`);
const flag = () => glyph(svg`<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><path d="M4 22v-7"></path>`);
const check = () => glyph(svg`<path d="M20 6 9 17l-5-5"></path>`);
const closeIcon = () => glyph(svg`<path d="M18 6 6 18M6 6l12 12"></path>`);

let instances = 0;

/**
 * Marks AI-made content – an inline badge that opens what made it, its limits and whether a person reviewed it – or
 * a quiet notice at the top of an assistant panel that it can be wrong and how to reach a person.
 * @tag tc-ai-disclosure
 * @fires tc-open-change - The mark's card opened or closed ({ open }: AiDisclosureOpenChange)
 * @fires tc-report - Report a problem was pressed, when there's no `reportHref` ({ kind, model }: AiDisclosureReport); cancelable – unless prevented, it then says "Reported"
 * @fires tc-dismiss - The notice's close button was pressed (detail: null); cancelable – unless prevented, the notice hides itself (`dismissed`)
 */
export class TcAiDisclosure extends TcElement {
  static override ui = "aid";

  /** "mark" – an inline badge with a card, or "notice" – a paragraph for the top of an assistant panel */
  @property({ reflect: true }) accessor variant: AiDisclosureVariant = "mark";
  /** How much the AI did: generated it, assisted a person, or drafted what a person then edited */
  @property({ reflect: true }) accessor kind: AiDisclosureKind = "generated";
  /** The badge's words; by default "AI-generated", "AI-assisted" or "Edited by you" */
  @property() accessor label: string | undefined = undefined;
  /** What made it, by the name people know it by – "Review assistant" */
  @property() accessor model = "";
  /** When it was made, epoch ms */
  @property({ type: Number, attribute: "made-at" }) accessor madeAt: number | undefined = undefined;
  /** What it's good and weak at, a short sentence each */
  @property({ attribute: false }) accessor limits: string[] = [];
  /** Who reviewed it, if a person did */
  @property({ attribute: "reviewed-by" }) accessor reviewedBy = "";
  /** Offers Report a problem (a button that fires tc-report); on by default when `reportHref` is set */
  @property({ type: Boolean }) accessor reportable = false;
  /** Where Report a problem goes; makes it a link */
  @property({ attribute: "report-href" }) accessor reportHref = "";
  /** A problem has been reported: the button says so and is off */
  @property({ type: Boolean, reflect: true }) accessor reported = false;
  /** The notice's heading */
  @property() accessor heading: string | undefined = undefined;
  /** The notice's paragraph – what the assistant is, that it can be wrong, where to check */
  @property() accessor body: string | undefined = undefined;
  /** Where to reach a person – a link under the notice */
  @property({ attribute: "contact-href" }) accessor contactHref = "";
  /** The contact link's words */
  @property({ attribute: "contact-label" }) accessor contactLabel: string | undefined = undefined;
  /** Where to read how the assistant works – a link under the notice */
  @property({ attribute: "learn-href" }) accessor learnHref = "";
  /** Shows a close button on the notice */
  @property({ type: Boolean }) accessor dismissible = false;
  /** The notice was dismissed and is hidden */
  @property({ type: Boolean, reflect: true }) accessor dismissed = false;
  /** The language for dates, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** The words it uses, merged over defaultAiDisclosureLabels */
  @property({ attribute: false }) accessor labels: Partial<AiDisclosureLabels> = {};

  /** @internal The polite status message */
  @state() accessor said = "";

  private readonly uid = `tc-aid${++instances}`;

  private readonly pop: PopoverController = new PopoverController(this, {
    popover: () => this.querySelector<HTMLElement>(".ui-aid__card"),
    anchor: () => this.querySelector<HTMLElement>(".ui-aid__mark"),
    side: "bottom",
    align: "start",
    kind: "dialog",
    tabBridge: true,
    returnFocus: () => this.querySelector<HTMLElement>(".ui-aid__mark"),
    onClose: () => this.emit<AiDisclosureOpenChange>("tc-open-change", { open: false }),
  });

  /** Whether the mark's card is open */
  get open() {
    return this.pop.open;
  }
  /** Opens the mark's card */
  show() {
    if (this.variant !== "mark" || this.pop.open) return;
    this.pop.show();
    this.emit<AiDisclosureOpenChange>("tc-open-change", { open: true });
  }
  /** Closes the mark's card */
  hide() {
    if (this.pop.open) this.pop.close();
  }

  private get words(): AiDisclosureLabels {
    return { ...defaultAiDisclosureLabels, ...this.labels };
  }
  private fill(text: string, vars: Record<string, string>) {
    return text.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
  }
  private get kindLabel() {
    const w = this.words;
    return this.label || (w[this.kind] ?? w.generated);
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("variant") && this.variant !== "mark" && this.pop.open) this.pop.close();
    if (this.variant === "notice") {
      this.setAttribute("role", "note");
      this.setAttribute("aria-labelledby", `${this.uid}-title`);
    } else {
      if (this.getAttribute("role") === "note") this.removeAttribute("role");
      this.removeAttribute("aria-labelledby");
    }
    this.toggleAttribute("hidden", this.variant === "notice" && this.dismissed);
  }

  private toggle() {
    if (this.pop.open) this.pop.close();
    else {
      this.pop.show({ focus: true, pin: true });
      this.emit<AiDisclosureOpenChange>("tc-open-change", { open: true });
    }
  }

  private report() {
    if (this.reported) return;
    if (!this.emit<AiDisclosureReport>("tc-report", { kind: this.kind, model: this.model }, { cancelable: true })) return;
    this.reported = true;
    this.said = this.words.reported;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-aid__reported")?.focus());
  }

  private dismiss() {
    if (!this.emit("tc-dismiss", null, { cancelable: true })) return;
    this.dismissed = true;
  }

  /* ---------- Rendering ---------- */

  private renderReport() {
    const w = this.words;
    const href = safeUrl(this.reportHref);
    if (href) return html`<a class="ui-aid__report" href=${href}>${flag()}${w.report}</a>`;
    if (!this.reportable) return nothing;
    if (this.reported) return html`<span class="ui-aid__reported" tabindex="-1">${check()}${w.reported}</span>`;
    return html`<button type="button" class="ui-aid__report" @click=${() => this.report()}>${flag()}${w.report}</button>`;
  }

  private renderCard() {
    if (!this.pop.open) return nothing;
    const w = this.words;
    const made = this.model
      ? this.madeAt !== undefined
        ? this.fill(w.madeByAt, { model: this.model, date: formatDate(this.madeAt, this.locale, { day: "numeric", month: "short", year: "numeric" }) })
        : this.fill(w.madeBy, { model: this.model })
      : "";
    const titleId = `${this.uid}-card-title`;
    return html`<div class="tc-pop ui-aid__card" id=${`${this.uid}-card`} role="dialog" aria-labelledby=${titleId}>
      <p class="ui-aid__card-title" id=${titleId}>${sparkles("ui-aid__glyph ui-aid__spark")}${this.kindLabel}</p>
      <p class="ui-aid__means">${MEANS[this.kind] ?? MEANS.generated}</p>
      ${made ? html`<p class="ui-aid__made">${made}</p>` : nothing}
      <p class="ui-aid__review" data-reviewed=${this.reviewedBy ? "true" : "false"}>
        ${this.reviewedBy ? userCheck() : alertIcon()}${this.reviewedBy ? this.fill(w.reviewedBy, { name: this.reviewedBy }) : w.notReviewed}
      </p>
      ${this.limits.length
        ? html`<div class="ui-aid__limits">
            <p class="ui-aid__limits-title" id=${`${this.uid}-limits`}>${w.limits}</p>
            <ul aria-labelledby=${`${this.uid}-limits`}>
              ${this.limits.map((l) => html`<li>${l}</li>`)}
            </ul>
          </div>`
        : nothing}
      ${this.renderReport()}
    </div>`;
  }

  private renderMark() {
    const open = this.pop.open;
    return html`<button
        type="button"
        class="ui-aid__mark"
        data-kind=${this.kind}
        aria-expanded=${open ? "true" : "false"}
        aria-controls=${ifDefined(open ? `${this.uid}-card` : undefined)}
        aria-haspopup="dialog"
        @click=${() => this.toggle()}
      >
        ${sparkles()}<span>${this.kindLabel}</span>
      </button>
      ${this.renderCard()}`;
  }

  private renderNotice() {
    const w = this.words;
    const contact = safeUrl(this.contactHref);
    const learn = safeUrl(this.learnHref);
    return html`<div class="ui-aid__notice">
      <span class="ui-aid__notice-icon">${sparkles()}</span>
      <div class="ui-aid__notice-text">
        <p class="ui-aid__notice-title" id=${`${this.uid}-title`}>${this.heading ?? w.noticeHeading}</p>
        <p class="ui-aid__notice-body">${this.body ?? w.noticeBody}</p>
        ${this.limits.length ? html`<ul class="ui-aid__notice-limits">${this.limits.map((l) => html`<li>${l}</li>`)}</ul>` : nothing}
        ${contact || learn || this.reportable || this.reportHref
          ? html`<p class="ui-aid__links">
              ${contact ? html`<a class="ui-aid__link" href=${contact}>${this.contactLabel ?? w.contact}</a>` : nothing}
              ${learn ? html`<a class="ui-aid__link" href=${learn}>${w.learn}</a>` : nothing} ${this.renderReport()}
            </p>`
          : nothing}
      </div>
      ${this.dismissible
        ? html`<button type="button" class="ui-aid__close" aria-label=${w.dismiss} title=${w.dismiss} @click=${() => this.dismiss()}>${closeIcon()}</button>`
        : nothing}
    </div>`;
  }

  protected override render() {
    return html`${this.variant === "notice" ? this.renderNotice() : this.renderMark()}<span class="tc-sr-only" role="status">${this.said}</span>`;
  }

  static override css = /* css */ `
[data-ui="aid"] { --tc-aid-mark-h: 20px; --tc-aid-card-w: 280px; position: relative; font-family: var(--tc-font-sans); -webkit-font-smoothing: antialiased; }
[data-ui="aid"][variant="mark"] { display: inline-block; vertical-align: middle; line-height: var(--tc-line-height-none); }
[data-ui="aid"][variant="notice"] { display: block; box-sizing: border-box; width: 100%; container-type: inline-size; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); text-align: left; }
[data-ui="aid"][hidden] { display: none !important; }
[data-ui="aid"] *, [data-ui="aid"] *::before, [data-ui="aid"] *::after { box-sizing: border-box; }
[data-ui="aid"] p, [data-ui="aid"] ul { margin: 0; }
[data-ui="aid"] ul { padding: 0; list-style: none; }
:where([data-ui="aid"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="aid"] button:focus-visible, [data-ui="aid"] a:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-aid__glyph { display: block; flex: none; width: 14px; height: 14px; }
:where([data-look="clean"], [data-look="clean"] *) .ui-aid__glyph { stroke-width: 1.6; }
/* ----- The mark: a small pill ----- */
.ui-aid__mark { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-aid-mark-h); padding: 0 var(--tc-space-2); border-radius: var(--tc-pill-radius); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-aid__mark .ui-aid__glyph { width: 12px; height: 12px; }
:where([data-look="standard"], [data-look="standard"] *) .ui-aid__mark { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
:where([data-look="standard"], [data-look="standard"] *) .ui-aid__mark:hover, :where([data-look="standard"], [data-look="standard"] *) .ui-aid__mark[aria-expanded="true"] { box-shadow: inset 0 0 0 1px var(--tc-status-info-border); }
:where([data-look="clean"], [data-look="clean"] *) .ui-aid__mark { background: var(--tc-surface-raised); box-shadow: inset 0 0 0 1px var(--tc-border-default); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *) .ui-aid__mark:hover, :where([data-look="clean"], [data-look="clean"] *) .ui-aid__mark[aria-expanded="true"] { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-aid__mark[data-kind="edited"] .ui-aid__glyph { opacity: 0.7; }
/* ----- The card the mark opens ----- */
.ui-aid__card { display: grid; gap: var(--tc-space-2); width: min(var(--tc-aid-card-w), calc(100vw - var(--tc-space-4))); padding: var(--tc-space-3); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); text-align: left; white-space: normal; }
.ui-aid__card p, .ui-aid__card ul { margin: 0; }
.ui-aid__card ul { padding: 0; list-style: none; }
.ui-aid__card-title { display: flex; align-items: center; gap: var(--tc-space-1-5); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-aid__spark { color: var(--tc-status-info-fg); }
.ui-aid__means { color: var(--tc-text-secondary); }
.ui-aid__made { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-aid__review { display: flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-xs); color: var(--tc-status-warning-fg); }
.ui-aid__review[data-reviewed="true"] { color: var(--tc-status-success-fg); }
.ui-aid__review .ui-aid__glyph { width: 12px; height: 12px; }
.ui-aid__limits { display: grid; gap: var(--tc-space-1); padding-top: var(--tc-space-2); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-aid__limits-title { font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); letter-spacing: var(--tc-tracking-caps); text-transform: uppercase; color: var(--tc-text-muted); }
.ui-aid__limits li, .ui-aid__notice-limits li { position: relative; padding-left: var(--tc-space-3); color: var(--tc-text-secondary); }
.ui-aid__limits li::before, .ui-aid__notice-limits li::before { content: ""; position: absolute; left: var(--tc-space-1); top: 0.6em; width: 4px; height: 4px; border-radius: var(--tc-radius-full); background: var(--tc-text-muted); }
.ui-aid__report { display: inline-flex; align-items: center; justify-self: start; gap: var(--tc-space-1); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); text-decoration: none; }
.ui-aid__report:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-aid__report .ui-aid__glyph, .ui-aid__reported .ui-aid__glyph { width: 12px; height: 12px; }
.ui-aid__reported { display: inline-flex; align-items: center; justify-self: start; gap: var(--tc-space-1); min-height: var(--tc-control-h-sm); font-size: var(--tc-font-size-xs); color: var(--tc-status-success-fg); outline: none; }
/* ----- The notice ----- */
.ui-aid__notice { display: flex; align-items: flex-start; gap: var(--tc-space-2-5); min-width: 0; padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-3) var(--tc-space-3-5); }
:where([data-look="standard"], [data-look="standard"] *) .ui-aid__notice { border-radius: var(--tc-radius-xl); background: var(--tc-status-info-bg); box-shadow: inset 0 0 0 1px var(--tc-status-info-border); }
:where([data-look="clean"], [data-look="clean"] *) .ui-aid__notice { position: relative; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); padding-left: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *) .ui-aid__notice::before { content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: 3px; background: var(--tc-status-info-fg); opacity: 0.8; }
.ui-aid__notice-icon { display: grid; flex: none; place-items: center; width: 24px; height: 24px; color: var(--tc-status-info-fg); }
.ui-aid__notice-icon .ui-aid__glyph { width: 16px; height: 16px; }
.ui-aid__notice-text { display: grid; flex: 1; gap: var(--tc-space-1); min-width: 0; }
.ui-aid__notice-title { padding-top: var(--tc-space-0-5); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-aid__notice-body { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); text-wrap: pretty; }
.ui-aid__notice-limits { display: grid; gap: var(--tc-space-0-5); font-size: var(--tc-font-size-sm); }
.ui-aid__links { display: flex; flex-wrap: wrap; align-items: center; column-gap: var(--tc-space-3); row-gap: var(--tc-space-1); margin-top: var(--tc-space-1); }
.ui-aid__link { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-accent-text); text-decoration: underline; text-decoration-color: var(--tc-border-strong); text-underline-offset: 2px; }
.ui-aid__link:hover { text-decoration-color: currentColor; }
.ui-aid__links .ui-aid__report { min-height: 0; padding: 0; }
.ui-aid__links .ui-aid__report:hover { background: none; text-decoration: underline; }
.ui-aid__close { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); margin: calc(var(--tc-space-1) * -1) calc(var(--tc-space-1) * -1) 0 0; border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); }
.ui-aid__close:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
@container (max-width: 360px) {
  .ui-aid__notice-icon { display: none; }
}
@media (pointer: coarse) {
  .ui-aid__mark { height: 28px; }
  .ui-aid__close { width: 36px; height: 36px; }
}
@media (forced-colors: active) {
  .ui-aid__mark { border: 1px solid ButtonText; }
  .ui-aid__notice { border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="aid"] *, [data-ui="aid"] *::before, [data-ui="aid"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-ai-disclosure")) customElements.define("tc-ai-disclosure", TcAiDisclosure);

declare global {
  interface HTMLElementTagNameMap {
    "tc-ai-disclosure": TcAiDisclosure;
  }
}
