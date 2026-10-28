import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-knowledge-promotion> – promote a verified fact from one piece of work into the knowledge a whole team relies on,
 * against a checklist. The fact leads, quoted, with who proposed it and its confidence; any disputed versions of it sit
 * beside it, so a disagreement is seen rather than settled silently. Below, the conditions: required ones (a reviewer's
 * sign-off, no open dispute, confidence at or above the threshold) and recommended ones (a second reviewer), each met
 * or not, with who and when. Promote stays unavailable until every required condition is met; a recommended one that
 * isn't met shows a warning but doesn't block.
 *
 *   <tc-knowledge-promotion threshold="0.8" .fact=${{ text: "…", by: "Ana Ruiz", at: "12 Oct", confidence: 0.86 }}
 *     .conditions=${[{ id: "signoff", label: "Reviewer sign-off", met: true, by: "Priya Shah", at: "13 Oct" }]}>
 *   </tc-knowledge-promotion>
 *
 * Promote fires a cancelable tc-promote ({ fact, unmetRecommended }) – unprevented, `status` becomes "promoted"; an app
 * that saves first prevents it, sets status="promoting", then "promoted" (or `error`, and Promote retries). Dispute
 * opens a short form – what's wrong, and optionally the version it should be – and fires a cancelable tc-dispute
 * ({ reason, version }); unprevented, the form closes. The app adds the dispute to `versions` and `conditions`.
 * With `fact.confidence` set, a confidence condition is added from `threshold` (required unless
 * `threshold-optional`). Dates are text the app formats; the element reads no clock and calls nothing.
 *
 * Keyboard: Tab through the buttons; Promote stays focusable while unavailable and says what it waits on. In the
 * dispute form, Escape cancels and returns focus to Dispute; Ctrl/⌘ + Enter sends it.
 * Standard: the header on the gray tray, the white card, the actions on the tray below. Clean: one white card, the
 * actions as its last row under a hairline, thinner strokes.
 */

export type KnowledgeFact = {
  /** The fact, as it would read in the team's knowledge */
  text: string;
  /** Who proposed it */
  by?: string;
  /** When, as the app formats it – "12 Oct" */
  at?: string;
  /** Where it was established – "Session 14", "Review of the March filings" */
  source?: string;
  /** 0–1 – adds a confidence condition checked against `threshold` */
  confidence?: number;
};

export type KnowledgeCondition = {
  id: string;
  /** "Reviewer sign-off", "No open dispute" */
  label: string;
  /** Required conditions block Promote; recommended ones (false) only warn. Default true */
  required?: boolean;
  met: boolean;
  /** Who met it – "Priya Shah" */
  by?: string;
  /** When, as the app formats it */
  at?: string;
  /** A short line under the label – what it waits on, or what was checked */
  detail?: string;
};

/** A disputed version of the fact, shown beside it */
export type KnowledgeVersion = {
  id: string;
  text: string;
  /** Who disputes it */
  by?: string;
  at?: string;
  /** Why – "The March filing says 14 days, not 10" */
  note?: string;
};

export type KnowledgeStatus = "candidate" | "promoting" | "promoted";

/** Details of the events */
export type KnowledgePromote = { fact: KnowledgeFact; unmetRecommended: string[] };
export type KnowledgeDispute = { reason: string; version: string };

/* Icons: Lucide (ISC, lucide.dev) – graduation-cap (the header), circle-check, circle, triangle-alert, git-compare */
const headIcon = svg`<path d="M21.42 10.92a1 1 0 0 0-.02-1.84L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0z"></path><path d="M22 10v6M6 12.5V16a6 3 0 0 0 12 0v-3.5"></path>`;
const glyph = (body: ReturnType<typeof svg>, className = "ui-kpro__glyph") => html`<svg class=${className} viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
const metIcon = svg`<circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path>`;
const openIcon = svg`<circle cx="12" cy="12" r="10"></circle>`;
const warnIcon = svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4M12 17h.01"></path>`;
const compareIcon = svg`<circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M13 6h3a2 2 0 0 1 2 2v7M11 18H8a2 2 0 0 1-2-2V9"></path>`;

let instances = 0;

const formats = new Map<string, Intl.NumberFormat>();
const numberFormat = (locale: string, options: Intl.NumberFormatOptions) => {
  const key = `${locale}|${JSON.stringify(options)}`;
  let f = formats.get(key);
  if (!f) formats.set(key, (f = new Intl.NumberFormat(locale, options)));
  return f;
};
const meta = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(" · ");
/** "a", "a and b", "a, b and c" */
const listOf = (items: string[]) => (items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`);

/**
 * Promote a verified fact into shared team knowledge: the fact with any disputed versions beside it, a checklist of
 * required and recommended conditions with who met them and when, and Promote and Dispute.
 * @tag tc-knowledge-promotion
 * @fires tc-promote - Promote was pressed with every required condition met (detail: { fact, unmetRecommended: ids of recommended conditions not met }); cancelable – prevent it to save first and set `status` yourself
 * @fires tc-dispute - The dispute form was sent (KnowledgeDispute – detail: { reason, version: the corrected wording, or "" }); cancelable – prevent it to keep the form open, e.g. while saving
 */
export class TcKnowledgePromotion extends TcElement {
  static override ui = "kpro";

  /** The heading, and the region's name */
  @property() accessor heading = "Promote to team knowledge";
  /** Where the knowledge goes or what it covers, a quiet line under the heading – e.g. "Acme lease review" */
  @property() accessor scope = "";
  /** The fact to promote */
  @property({ attribute: false }) accessor fact: KnowledgeFact = { text: "" };
  /** The checklist, in order – required conditions block Promote, recommended ones only warn */
  @property({ attribute: false }) accessor conditions: KnowledgeCondition[] = [];
  /** Disputed versions of the fact, shown side by side with it */
  @property({ attribute: false }) accessor versions: KnowledgeVersion[] = [];
  /** Confidence the fact needs, 0–1 – checked when `fact.confidence` is set */
  @property({ type: Number }) accessor threshold = 0.8;
  /** Makes the confidence condition recommended instead of required */
  @property({ type: Boolean, attribute: "threshold-optional" }) accessor thresholdOptional = false;
  /** "candidate" (default), "promoting" while the app saves, or "promoted" */
  @property({ reflect: true }) accessor status: KnowledgeStatus = "candidate";
  /** Why the last promotion failed – shown above the actions; Promote tries again */
  @property() accessor error = "";
  /** The dispute form is open – set false to close it after a prevented tc-dispute */
  @property({ type: Boolean, reflect: true }) accessor disputing = false;
  /** Hides Dispute, for people who can promote but not dispute */
  @property({ type: Boolean, attribute: "no-dispute" }) accessor noDispute = false;
  /** Locale for numbers */
  @property() accessor locale = "en-US";

  /** @internal */
  @state() private accessor reason = "";
  /** @internal */
  @state() private accessor proposal = "";
  /** @internal The form was sent without a reason */
  @state() private accessor invalid = false;
  /** @internal */
  @state() private accessor message = "";

  private readonly uid = `tc-kpro${++instances}`;
  private focusAfter: "reason" | "dispute" | null = null;

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
  }

  /* ---------- State ---------- */

  /** @internal */
  private idx = (n: number) => numberFormat(this.locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  /** @internal The checklist with the confidence condition, when there is a confidence to check */
  get checklist(): KnowledgeCondition[] {
    const list = [...(this.conditions ?? [])];
    const c = this.fact?.confidence;
    if (typeof c === "number" && Number.isFinite(c)) {
      list.push({
        id: "confidence",
        label: `Confidence at or above ${this.idx(this.threshold)}`,
        required: !this.thresholdOptional,
        met: c >= this.threshold,
        detail: `Currently ${this.idx(c)}`,
      });
    }
    return list;
  }

  /** @internal Required conditions not met */
  private get blocking() {
    return this.checklist.filter((c) => c.required !== false && !c.met);
  }

  /** @internal Recommended conditions not met */
  private get warnings() {
    return this.checklist.filter((c) => c.required === false && !c.met);
  }

  /** Every required condition is met */
  get ready() {
    return this.blocking.length === 0;
  }

  /* ---------- Update ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("status") && changed.get("status") !== undefined && this.status === "promoted") this.announce("Promoted to team knowledge.");
    if (changed.has("error") && this.error) this.announce(this.error);
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
    if (this.focusAfter) {
      const target = this.focusAfter === "reason" ? this.querySelector<HTMLElement>(".ui-kpro__reason") : this.querySelector<HTMLElement>(".ui-kpro__dispute");
      this.focusAfter = null;
      target?.focus();
    }
  }

  /** A trailing space makes a repeated message count as new for screen readers */
  private announce(text: string) {
    this.message = this.message === text ? `${text} ` : text;
  }

  /* ---------- Actions ---------- */

  private promote() {
    if (!this.ready || this.status !== "candidate") return;
    const unmetRecommended = this.warnings.map((c) => c.id);
    if (!this.emit<KnowledgePromote>("tc-promote", { fact: this.fact, unmetRecommended }, { cancelable: true })) return;
    this.error = "";
    this.status = "promoted";
  }

  private openDispute() {
    this.disputing = true;
    this.invalid = false;
    this.focusAfter = "reason";
  }

  private cancelDispute() {
    this.disputing = false;
    this.invalid = false;
    this.reason = "";
    this.proposal = "";
    this.focusAfter = "dispute";
  }

  private sendDispute(e?: Event) {
    e?.preventDefault();
    const reason = this.reason.trim();
    if (!reason) {
      this.invalid = true;
      this.focusAfter = "reason";
      this.requestUpdate();
      return;
    }
    if (!this.emit<KnowledgeDispute>("tc-dispute", { reason, version: this.proposal.trim() }, { cancelable: true })) return;
    this.disputing = false;
    this.reason = "";
    this.proposal = "";
    this.invalid = false;
    this.focusAfter = "dispute";
    this.announce("Dispute raised.");
  }

  private onFormKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.cancelDispute();
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      this.sendDispute(e);
    }
  };

  /* ---------- Render ---------- */

  private renderFact() {
    const f = this.fact ?? { text: "" };
    const versions = this.versions ?? [];
    const c = f.confidence;
    const conf = typeof c === "number" && Number.isFinite(c) ? html`<span class="ui-kpro__conf" data-met=${c >= this.threshold ? "true" : "false"}>Confidence ${this.idx(c)}</span>` : nothing;
    const proposed = html`<figure class="ui-kpro__version" data-kind="proposed">
      <figcaption class="ui-kpro__vhead">
        <span class="ui-kpro__vlabel">${versions.length ? "This version" : "The fact"}</span> ${conf}
      </figcaption>
      <blockquote class="ui-kpro__text">${f.text || html`<span class="ui-kpro__muted">No fact given</span>`}</blockquote>
      ${f.by || f.at || f.source ? html`<p class="ui-kpro__meta">${meta(f.by ? `Proposed by ${f.by}` : undefined, f.at, f.source)}</p>` : nothing}
    </figure>`;
    if (!versions.length) return html`<div class="ui-kpro__fact">${proposed}</div>`;
    return html`<div class="ui-kpro__fact" data-disputed>
      <p class="ui-kpro__disputed" id=${`${this.uid}-versions`}>${glyph(compareIcon)}<span>${versions.length === 1 ? "Disputed – both versions stay visible until it's resolved" : `${versions.length} disputed versions – all stay visible until it's resolved`}</span></p>
      <div class="ui-kpro__versions" role="list" aria-labelledby=${`${this.uid}-versions`}>
        <div role="listitem">${proposed}</div>
        ${repeat(
          versions,
          (v) => v.id,
          (v) => html`<div role="listitem">
            <figure class="ui-kpro__version" data-kind="disputed" data-id=${v.id}>
              <figcaption class="ui-kpro__vhead"><span class="ui-kpro__vlabel">${v.by ? `Disputed by ${v.by}` : "Disputed version"}</span> ${v.at ? html`<span class="ui-kpro__muted">${v.at}</span>` : nothing}</figcaption>
              <blockquote class="ui-kpro__text">${v.text}</blockquote>
              ${v.note ? html`<p class="ui-kpro__meta">${v.note}</p>` : nothing}
            </figure>
          </div>`,
        )}
      </div>
    </div>`;
  }

  private renderChecklist() {
    const list = this.checklist;
    if (!list.length) return nothing;
    const required = list.filter((c) => c.required !== false);
    const met = required.filter((c) => c.met).length;
    return html`<div class="ui-kpro__section">
      <div class="ui-kpro__section-head">
        <p class="ui-kpro__caption" id=${`${this.uid}-checks`}>${this.status === "promoted" ? "Checked before promotion" : "Before it's promoted"}</p>
        ${required.length ? html`<span class="ui-kpro__count">${met} of ${required.length} required met</span>` : nothing}
      </div>
      <ul class="ui-kpro__checks" aria-labelledby=${`${this.uid}-checks`}>
        ${repeat(
          list,
          (c) => c.id,
          (c) => {
            const req = c.required !== false;
            const st = c.met ? "met" : req ? "open" : "warn";
            const who = c.met ? meta(c.by, c.at) : "";
            const word = c.met ? "Met" : req ? "Not met" : "Not met – recommended";
            return html`<li class="ui-kpro__check" data-state=${st} data-id=${c.id}>
              ${glyph(st === "met" ? metIcon : st === "warn" ? warnIcon : openIcon, "ui-kpro__mark")}
              <span class="ui-kpro__check-label">${c.label}<span class="ui-kpro__sr">: ${word}</span></span>
              <span class="ui-kpro__kind">${req ? "Required" : "Recommended"}</span>
              ${who || c.detail ? html`<span class="ui-kpro__check-meta">${meta(who, c.detail)}</span>` : nothing}
            </li>`;
          },
        )}
      </ul>
      ${this.ready && this.status === "candidate" && this.warnings.length
        ? html`<p class="ui-kpro__warning" id=${`${this.uid}-warn`}>
            ${glyph(warnIcon)}<span
              >${listOf(this.warnings.map((c) => c.label.toLowerCase()))
                .replace(/^./, (m) => m.toUpperCase())}
              ${this.warnings.length === 1 ? "is" : "are"} recommended and not met. You can still promote it.</span
            >
          </p>`
        : nothing}
    </div>`;
  }

  private renderForm() {
    if (!this.disputing) return nothing;
    const id = this.uid;
    return html`<form class="ui-kpro__form" aria-label="Dispute this fact" @submit=${this.sendDispute} @keydown=${this.onFormKey} novalidate>
      <label class="ui-kpro__label" for=${`${id}-reason`}>What's wrong with it?</label>
      <textarea
        id=${`${id}-reason`}
        class="ui-kpro__field ui-kpro__reason"
        rows="2"
        aria-invalid=${this.invalid ? "true" : "false"}
        aria-describedby=${ifDefined(this.invalid ? `${id}-reason-err` : undefined)}
        .value=${this.reason}
        @input=${(e: Event) => {
          this.reason = (e.target as HTMLTextAreaElement).value;
          if (this.invalid && this.reason.trim()) this.invalid = false;
        }}
      ></textarea>
      ${this.invalid ? html`<p class="ui-kpro__err" id=${`${id}-reason-err`}>Say what's wrong with it, so the reviewer can check.</p>` : nothing}
      <label class="ui-kpro__label" for=${`${id}-version`}>How it should read <span class="ui-kpro__muted">(optional)</span></label>
      <textarea
        id=${`${id}-version`}
        class="ui-kpro__field"
        rows="2"
        .value=${this.proposal}
        @input=${(e: Event) => (this.proposal = (e.target as HTMLTextAreaElement).value)}
      ></textarea>
      <div class="ui-kpro__form-actions">
        <button type="button" class="ui-kpro__btn ui-kpro__btn--ghost" @click=${this.cancelDispute}>Cancel</button>
        <button type="submit" class="ui-kpro__btn ui-kpro__btn--secondary">Raise dispute</button>
      </div>
    </form>`;
  }

  private renderFoot() {
    const promoted = this.status === "promoted";
    const promoting = this.status === "promoting";
    const blocking = this.blocking;
    const unavailable = !this.ready || promoting;
    const status = promoted
      ? html`${glyph(metIcon)}<span>In team knowledge</span>`
      : promoting
        ? html`<span>Promoting…</span>`
        : blocking.length
          ? html`<span>Waiting on: ${listOf(blocking.map((c) => c.label.toLowerCase()))}</span>`
          : html`<span>Ready to promote</span>`;
    return html`<div class="ui-kpro__foot">
      ${this.error && !promoted ? html`<p class="ui-kpro__error" role="alert">${this.error}</p>` : nothing}
      <p class="ui-kpro__status" id=${`${this.uid}-status`} data-state=${promoted ? "promoted" : blocking.length ? "waiting" : "ready"}>${status}</p>
      <div class="ui-kpro__actions">
        ${this.noDispute
          ? nothing
          : html`<button type="button" class="ui-kpro__btn ui-kpro__btn--secondary ui-kpro__dispute" aria-expanded=${this.disputing ? "true" : "false"} @click=${() => (this.disputing ? this.cancelDispute() : this.openDispute())}>
              Dispute
            </button>`}
        ${promoted
          ? nothing
          : html`<button
              type="button"
              class="ui-kpro__btn ui-kpro__btn--primary ui-kpro__promote"
              aria-disabled=${unavailable ? "true" : "false"}
              aria-describedby=${[`${this.uid}-status`, this.ready && this.warnings.length && !promoting ? `${this.uid}-warn` : ""].filter(Boolean).join(" ")}
              aria-busy=${promoting ? "true" : "false"}
              @click=${this.promote}
            >
              ${this.error ? "Try again" : "Promote"}
            </button>`}
      </div>
    </div>`;
  }

  protected override render() {
    const promoted = this.status === "promoted";
    const disputed = (this.versions ?? []).length > 0;
    const blocking = this.blocking.length;
    const required = this.checklist.filter((c) => c.required !== false).length;
    const pill = promoted
      ? html`<span class="ui-kpro__pill" data-tone="success">Promoted</span>`
      : disputed
        ? html`<span class="ui-kpro__pill" data-tone="warning">Disputed</span>`
        : !blocking
          ? html`<span class="ui-kpro__pill" data-tone="success">Ready</span>`
          : html`<span class="ui-kpro__pill">${required - blocking} of ${required} required</span>`;
    // The header (.tc-head): on the tray in Standard, the card's first row in Clean
    const clean = this.resolvedLook === "clean";
    const head = cardHead({ icon: headIcon, title: this.heading, subtitle: this.scope || undefined, id: `${this.uid}-title`, aside: pill });
    return html`
      ${clean ? nothing : head}
      <div class="ui-kpro__card">
        ${clean ? head : nothing}
        <div class="ui-kpro__inner">${this.renderFact()}${this.renderChecklist()}${this.renderForm()}</div>
        ${clean ? this.renderFoot() : nothing}
      </div>
      ${clean ? nothing : this.renderFoot()}
      <p class="ui-kpro__sr" role="status">${this.message}</p>
    `;
  }

  static override css = /* css */ `
[data-ui="kpro"] {
  box-sizing: border-box;
  container-type: inline-size;
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  max-width: 560px;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Standard: the gray tray around a white card · Clean: one white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="kpro"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="kpro"] { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); color: var(--tc-text-primary); }
[data-ui="kpro"] *, [data-ui="kpro"] *::before, [data-ui="kpro"] *::after { box-sizing: border-box; }
:where([data-ui="kpro"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="kpro"]) :is(p, ul, figure, blockquote, form) { margin: 0; padding: 0; }
:where([data-ui="kpro"]) ul { list-style: none; }
[data-ui="kpro"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-kpro__muted { color: var(--tc-text-muted); }
.ui-kpro__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-kpro__glyph { display: block; flex: none; width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-kpro__glyph { stroke-width: 1.6; }
/* The card */
.ui-kpro__card { min-width: 0; border-radius: var(--tc-card-radius); }
:where([data-look="standard"], [data-look="standard"] *).ui-kpro__card { background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-kpro__inner { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-kpro__inner { padding-top: var(--tc-space-1); }
/* The state's pill, at the header's right */
.ui-kpro__pill { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-kpro__pill[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-kpro__pill[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
/* The fact, and any disputed versions beside it */
.ui-kpro__fact { display: grid; gap: var(--tc-space-2-5); }
.ui-kpro__disputed { display: flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-status-warning-fg); }
.ui-kpro__versions { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--tc-space-2); }
.ui-kpro__versions > [role="listitem"] { display: grid; min-width: 0; }
.ui-kpro__version { display: grid; align-content: start; gap: var(--tc-space-1-5); min-width: 0; }
.ui-kpro__fact[data-disputed] .ui-kpro__version { padding: var(--tc-space-3); background: var(--tc-surface-well); }
:where([data-look="standard"], [data-look="standard"] *) .ui-kpro__fact[data-disputed] .ui-kpro__version { border-radius: var(--tc-radius-lg); }
:where([data-look="clean"], [data-look="clean"] *) .ui-kpro__fact[data-disputed] .ui-kpro__version { border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); }
.ui-kpro__fact[data-disputed] .ui-kpro__version[data-kind="disputed"] { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-warning-border); }
.ui-kpro__vhead { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-1) var(--tc-space-2); font-size: var(--tc-font-size-sm); }
.ui-kpro__vlabel { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-kpro__conf { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-kpro__text { padding-left: var(--tc-space-3); border-left: 2px solid var(--tc-border-strong); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-kpro__version[data-kind="disputed"] .ui-kpro__text { border-left-color: var(--tc-status-warning-solid); }
.ui-kpro__meta { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); overflow-wrap: anywhere; }
/* The checklist */
.ui-kpro__section { display: grid; gap: var(--tc-space-2-5); padding-top: var(--tc-space-3-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-kpro__section-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--tc-space-1) var(--tc-space-3); }
.ui-kpro__caption { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-kpro__count { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-kpro__checks { display: grid; gap: var(--tc-space-2-5); }
.ui-kpro__check { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: baseline; column-gap: var(--tc-space-2-5); row-gap: var(--tc-space-0-5); min-width: 0; }
.ui-kpro__mark { align-self: start; width: 16px; height: 16px; margin-top: var(--tc-space-0-5); color: var(--tc-text-disabled); fill: none; stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; transition: color var(--tc-duration-moderate) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *) .ui-kpro__mark { stroke-width: 1.4; }
.ui-kpro__check[data-state="met"] .ui-kpro__mark { color: var(--tc-status-success-fg); }
.ui-kpro__check[data-state="warn"] .ui-kpro__mark { color: var(--tc-status-warning-fg); }
.ui-kpro__check-label { min-width: 0; overflow-wrap: anywhere; color: var(--tc-text-primary); }
.ui-kpro__check[data-state="met"] .ui-kpro__check-label { color: var(--tc-text-secondary); }
.ui-kpro__kind { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); white-space: nowrap; }
.ui-kpro__check-meta { grid-column: 2 / -1; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-kpro__warning { display: flex; align-items: flex-start; gap: var(--tc-space-2); margin-top: var(--tc-space-1); padding: var(--tc-space-2-5) var(--tc-space-3); background: var(--tc-status-warning-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-warning-border); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-status-warning-fg); animation: ui-kpro-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-kpro__warning .ui-kpro__glyph { margin-top: var(--tc-space-0-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-kpro__warning { border-radius: var(--tc-radius-lg); }
:where([data-look="clean"], [data-look="clean"] *).ui-kpro__warning { border-radius: var(--tc-radius-md); }
/* The dispute form */
.ui-kpro__form { display: grid; gap: var(--tc-space-1-5); padding-top: var(--tc-space-3-5); border-top: var(--tc-hairline) solid var(--tc-divider); animation: ui-kpro-in var(--tc-duration-base) var(--tc-ease-move) both; }
.ui-kpro__label { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-kpro__label:not(:first-child) { margin-top: var(--tc-space-1-5); }
.ui-kpro__label .ui-kpro__muted { font-weight: var(--tc-font-weight-regular); }
.ui-kpro__field { display: block; width: 100%; min-height: var(--tc-field-h); margin: 0; padding: var(--tc-space-2) var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); outline: 0; background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); line-height: var(--tc-line-height-snug); resize: vertical; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-kpro__field:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-kpro__field:focus { box-shadow: var(--tc-field-shadow-focus); }
.ui-kpro__field[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-kpro__err { font-size: var(--tc-font-size-sm); color: var(--tc-status-danger-fg); }
.ui-kpro__form-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--tc-space-2); margin-top: var(--tc-space-2); }
/* The actions: on the tray below the card (Standard), the card's last row (Clean) */
.ui-kpro__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2) var(--tc-space-3); min-height: 44px; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-kpro__foot { padding: var(--tc-space-1-5) var(--tc-space-0-5) var(--tc-space-0-5) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-kpro__foot { padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); line-height: var(--tc-line-height-tight); }
.ui-kpro__error { flex: 1 0 100%; padding-right: var(--tc-space-2); color: var(--tc-status-danger-fg); }
.ui-kpro__status { display: flex; flex: 1 1 160px; align-items: center; gap: var(--tc-space-1-5); min-width: 0; overflow-wrap: anywhere; }
.ui-kpro__status[data-state="promoted"] { color: var(--tc-status-success-fg); font-weight: var(--tc-font-weight-medium); }
.ui-kpro__status[data-state="ready"] { color: var(--tc-text-primary); }
.ui-kpro__actions { display: flex; flex: none; gap: var(--tc-space-2); margin-left: auto; }
.ui-kpro__btn { display: inline-flex; flex: none; align-items: center; justify-content: center; height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-kpro__btn:not([aria-disabled="true"]):active { transform: scale(0.97); }
.ui-kpro__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-kpro__btn--primary:not([aria-disabled="true"]):hover { background: var(--tc-action-primary-bg-hover); }
.ui-kpro__btn--secondary { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
.ui-kpro__btn--secondary:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-kpro__btn--ghost { color: var(--tc-action-ghost-fg); }
.ui-kpro__btn--ghost:hover { background: var(--tc-action-ghost-bg-hover); }
.ui-kpro__btn[aria-disabled="true"] { opacity: 0.45; cursor: not-allowed; }
.ui-kpro__btn[aria-busy="true"] { cursor: progress; }
@keyframes ui-kpro-in { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }
/* Narrow: tighter gutters; the actions take their own line */
@container (max-width: 400px) {
  .ui-kpro__inner { padding: var(--tc-space-3-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-kpro__foot { padding-left: var(--tc-space-3-5); }
  .ui-kpro__check { grid-template-columns: auto minmax(0, 1fr); }
  .ui-kpro__kind { grid-column: 2; }
}
/* Touch screens: bigger targets */
@media (hover: none) and (pointer: coarse) {
  .ui-kpro__btn { height: var(--tc-control-h-lg); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="kpro"] *, [data-ui="kpro"] *::before, [data-ui="kpro"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-knowledge-promotion")) customElements.define("tc-knowledge-promotion", TcKnowledgePromotion);

declare global {
  interface HTMLElementTagNameMap {
    "tc-knowledge-promotion": TcKnowledgePromotion;
  }
}
