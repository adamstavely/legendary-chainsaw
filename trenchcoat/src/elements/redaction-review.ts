import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-redaction-review> – checking what's been blacked out before a document's shared. Each span shows as a solid bar with
 * its reason. A reviewer can reveal one at a time to check it, approve or reject it, and move between spans with the arrow
 * keys. Text under a hidden bar isn't in the page's markup, but it's still in `blocks`, so this isn't what makes a document
 * safe: the server has to produce the redacted copy. Share waits until nothing's left to review.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-redaction-review .blocks=${blocks} .redactions=${redactions}></tc-redaction-review>
 */

export type RedactionBlock = { id: string; page?: number; text: string };
export type RedactionStatus = "proposed" | "approved" | "rejected";
export type Redaction = {
  id: string;
  /** The id of the block it's in */
  block: string;
  /** Where it starts in the block's text */
  start: number;
  /** Where it ends, not included */
  end: number;
  reason: string;
  status: RedactionStatus;
  /** Who or what suggested it */
  proposedBy?: string;
};
export type RedactionsChange = { redactions: Redaction[]; redaction?: Redaction };
export type RedactionShare = { redactions: Redaction[] };

/** The review's words, every one renameable through `labels` */
export type RedactionReviewLabels = {
  heading: string;
  /** {n} */
  left: string;
  leftOne: string;
  allDone: string;
  /** {n} */
  orphaned: string;
  page: string;
  redacted: string;
  proposed: string;
  approved: string;
  rejected: string;
  /** {name} */
  proposedBy: string;
  reveal: string;
  hide: string;
  approve: string;
  reject: string;
  approveAll: string;
  share: string;
  empty: string;
  keys: string;
  /** Announced */
  announceApproved: string;
  announceRejected: string;
  /** {n} */
  announceAll: string;
  shared: string;
};
export const defaultRedactionReviewLabels: RedactionReviewLabels = {
  heading: "Redaction review",
  left: "{n} left to review",
  leftOne: "1 left to review",
  allDone: "All reviewed",
  orphaned: "{n} refer to text that isn't shown, so this can't be shared yet.",
  page: "Page {n}",
  redacted: "Redacted",
  proposed: "To review",
  approved: "Approved",
  rejected: "Not redacted",
  proposedBy: "Suggested by {name}",
  reveal: "Reveal",
  hide: "Hide",
  approve: "Approve",
  reject: "Reject",
  approveAll: "Approve all",
  share: "Share",
  empty: "Nothing to review.",
  keys: "Use the arrow keys to move between redactions.",
  announceApproved: "Approved",
  announceRejected: "Rejected, so this text will show",
  announceAll: "Approved {n}",
  shared: "Sent for sharing",
};

const ICON = svg`<rect x="3" y="5" width="18" height="4" rx="1"></rect><path d="M3 13h7M14 13h7M3 18h18"></path>`;
let instances = 0;

/**
 * Checking what's been redacted before a document's shared: reveal one at a time, approve or reject, then share.
 * @tag tc-redaction-review
 * @fires tc-redactions-change - A redaction was approved or rejected, or all were approved ({ redactions, redaction }: RedactionsChange); cancelable – prevented, `redactions` stays as it was
 * @fires tc-share - Share was pressed ({ redactions }: RedactionShare); cancelable
 */
export class TcRedactionReview extends TcElement {
  static override ui = "rdq";

  /** The heading; by default "Redaction review" */
  @property() accessor heading = "";
  /** A line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The document's text, in order */
  @property({ attribute: false }) accessor blocks: RedactionBlock[] = [];
  /** What's redacted. Changed by the user unless a tc-redactions-change listener calls preventDefault() */
  @property({ attribute: false }) accessor redactions: Redaction[] = [];
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<RedactionReviewLabels> = {};

  @state() private accessor selected: string | null = null;
  @state() private accessor revealed: string | null = null;
  @state() private accessor announce = "";
  private readonly uid = `tc-rdq-${++instances}`;

  private get words(): RedactionReviewLabels {
    return { ...defaultRedactionReviewLabels, ...this.labels };
  }

  /** In reading order: by block, then by where it starts */
  private get ordered() {
    const order = new Map(this.blocks.map((b, i) => [b.id, i]));
    return this.redactions.filter((r) => order.has(r.block)).sort((a, b) => order.get(a.block)! - order.get(b.block)! || a.start - b.start);
  }

  private get orphans() {
    const known = new Set(this.blocks.map((b) => b.id));
    return this.redactions.filter((r) => !known.has(r.block));
  }

  private get activeId() {
    const all = this.ordered;
    if (this.selected && all.some((r) => r.id === this.selected)) return this.selected;
    return all.find((r) => r.status === "proposed")?.id ?? all[0]?.id ?? null;
  }

  private select(id: string, focus = true) {
    if (this.revealed !== id) this.revealed = null;
    this.selected = id;
    if (focus) this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-redaction="${CSS.escape(id)}"]`)?.focus());
  }

  private onKey(e: KeyboardEvent) {
    const all = this.ordered;
    const at = all.findIndex((r) => r.id === this.activeId);
    if (at < 0) return;
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = Math.min(all.length - 1, at + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = Math.max(0, at - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = all.length - 1;
    if (next < 0) return;
    e.preventDefault();
    this.select(all[next]!.id);
  }

  private commit(redactions: Redaction[], redaction: Redaction | undefined, message: string) {
    if (!this.emit<RedactionsChange>("tc-redactions-change", { redactions, redaction }, { cancelable: true })) return false;
    this.redactions = redactions;
    this.announce = message;
    return true;
  }

  private decide(r: Redaction, status: RedactionStatus) {
    const next = { ...r, status };
    const w = this.words;
    if (!this.commit(this.redactions.map((x) => (x.id === r.id ? next : x)), next, status === "approved" ? w.announceApproved : w.announceRejected)) return;
    this.revealed = null;
    const after = this.ordered.find((x) => x.status === "proposed");
    this.select(after?.id ?? r.id);
  }

  private approveAll() {
    const w = this.words;
    const known = new Set(this.blocks.map((b) => b.id));
    const todo = this.redactions.filter((r) => r.status === "proposed" && known.has(r.block));
    if (!todo.length) return;
    const redactions = this.redactions.map((r) => (r.status === "proposed" && known.has(r.block) ? { ...r, status: "approved" as const } : r));
    if (this.commit(redactions, undefined, w.announceAll.replace("{n}", String(todo.length)))) this.revealed = null;
  }

  private share() {
    if (this.redactions.some((r) => r.status === "proposed")) return;
    if (this.emit<RedactionShare>("tc-share", { redactions: this.redactions }, { cancelable: true })) this.announce = this.words.shared;
  }

  private renderSpan(r: Redaction, text: string, active: boolean) {
    const w = this.words;
    const open = r.status === "rejected" || this.revealed === r.id;
    const statusWord = w[r.status];
    return html`<button
      type="button"
      class="ui-rdq__span"
      data-redaction=${r.id}
      data-status=${r.status}
      ?data-open=${open}
      aria-pressed=${active ? "true" : "false"}
      tabindex=${active ? 0 : -1}
      @click=${() => this.select(r.id)}
    >
      <span class="tc-sr-only">${w.redacted}: </span>${open
        ? html`<span class="ui-rdq__text">${text}</span>`
        : html`<span class="ui-rdq__bar" aria-hidden="true" style=${styleMap({ "--tc-rdq-length": `${Math.min(40, Math.max(2, text.length))}ch` })}></span>`}<span class="ui-rdq__reason">${r.reason}</span><span class="tc-sr-only">, ${statusWord}</span>
    </button>`;
  }

  private renderBlock(block: RedactionBlock, spans: Redaction[], activeId: string | null) {
    const parts: unknown[] = [];
    let cursor = 0;
    for (const r of spans) {
      const start = Math.min(block.text.length, Math.max(cursor, r.start));
      const end = Math.min(block.text.length, Math.max(start, r.end));
      if (start > cursor) parts.push(block.text.slice(cursor, start));
      parts.push(this.renderSpan(r, block.text.slice(start, end), r.id === activeId));
      cursor = end;
    }
    if (cursor < block.text.length) parts.push(block.text.slice(cursor));
    return html`<p class="ui-rdq__block" data-block=${block.id}>${parts}</p>`;
  }

  private renderDetail(r: Redaction) {
    const w = this.words;
    const revealed = this.revealed === r.id;
    return html`<div class="ui-rdq__detail" data-status=${r.status}>
      <div class="ui-rdq__about">
        <span class="ui-rdq__detail-reason">${r.reason}</span>
        <span class="ui-rdq__word" data-status=${r.status}>${w[r.status]}</span>
        ${r.proposedBy ? html`<span class="ui-rdq__by">${w.proposedBy.replace("{name}", r.proposedBy)}</span>` : nothing}
      </div>
      <div class="ui-rdq__buttons">
        ${r.status !== "rejected"
          ? html`<button type="button" class="tc-btn-sm ui-rdq__reveal" aria-pressed=${revealed ? "true" : "false"} @click=${() => (this.revealed = revealed ? null : r.id)}>${revealed ? w.hide : w.reveal}</button>`
          : nothing}
        <button type="button" class="tc-btn-sm ui-rdq__approve" ?disabled=${r.status === "approved"} @click=${() => this.decide(r, "approved")}>${w.approve}</button>
        <button type="button" class="tc-btn-sm ui-rdq__reject" ?disabled=${r.status === "rejected"} @click=${() => this.decide(r, "rejected")}>${w.reject}</button>
      </div>
    </div>`;
  }

  protected override render() {
    const w = this.words;
    const ordered = this.ordered;
    const activeId = this.activeId;
    const active = ordered.find((r) => r.id === activeId);
    const left = ordered.filter((r) => r.status === "proposed").length;
    const orphans = this.orphans.filter((r) => r.status === "proposed").length;
    const blocked = left + orphans > 0;
    const status = left === 0 ? w.allDone : left === 1 ? w.leftOne : w.left.replace("{n}", String(left));
    let page: number | undefined;
    return html`${cardHead({ icon: ICON, title: this.heading || w.heading, subtitle: this.description, id: `${this.uid}-title`, aside: html`<span class="ui-rdq__left">${status}</span>` })}
      <div class="ui-rdq__card">
        ${this.blocks.length
          ? html`<div class="ui-rdq__doc" role="group" aria-labelledby=${`${this.uid}-title`} aria-describedby=${`${this.uid}-keys`} @keydown=${this.onKey}>
              ${this.blocks.map((b) => {
                const head = b.page !== undefined && b.page !== page ? html`<h4 class="ui-rdq__page">${w.page.replace("{n}", String(b.page))}</h4>` : nothing;
                page = b.page ?? page;
                return html`${head}${this.renderBlock(b, ordered.filter((r) => r.block === b.id), activeId)}`;
              })}
            </div>`
          : html`<p class="ui-rdq__empty">${w.empty}</p>`}
        ${active ? this.renderDetail(active) : nothing}
        ${orphans ? html`<p class="ui-rdq__orphans">${w.orphaned.replace("{n}", String(orphans))}</p>` : nothing}
        <div class="ui-rdq__foot">
          <button type="button" class="tc-btn-sm ui-rdq__approve-all" ?disabled=${left === 0} @click=${this.approveAll}>${w.approveAll}</button>
          <button type="button" class="ui-rdq__share" ?disabled=${blocked} @click=${this.share}>${w.share}</button>
        </div>
      </div>
      <span class="tc-sr-only" id=${`${this.uid}-keys`}>${w.keys}</span>
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rdq"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rdq"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
[data-ui="rdq"] *, [data-ui="rdq"] *::before, [data-ui="rdq"] *::after { box-sizing: border-box; }
[data-ui="rdq"] :where(p, h4) { margin: 0; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rdq"] .ui-rdq__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-rdq__left { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-rdq__doc { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-4); }
.ui-rdq__page { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-rdq__block { line-height: var(--tc-line-height-relaxed, 1.7); overflow-wrap: anywhere; }
.ui-rdq__span { display: inline; padding: 0; border: 0; border-radius: var(--tc-radius-2xs); background: none; color: inherit; font: inherit; cursor: pointer; }
.ui-rdq__span:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-rdq__span[aria-pressed="true"] { box-shadow: 0 0 0 2px var(--tc-border-selected); }
.ui-rdq__bar { display: inline-block; width: var(--tc-rdq-length); max-width: 100%; height: 1em; vertical-align: -0.12em; border-radius: var(--tc-radius-2xs); background: var(--tc-text-primary); }
.ui-rdq__span[data-status="proposed"] .ui-rdq__bar { background: repeating-linear-gradient(135deg, var(--tc-text-primary) 0 6px, var(--tc-text-secondary) 6px 8px); }
.ui-rdq__text { background: var(--tc-status-warning-bg); color: var(--tc-text-primary); }
.ui-rdq__span[data-status="rejected"] .ui-rdq__text { background: none; text-decoration: underline dashed; }
.ui-rdq__reason { margin-inline-start: var(--tc-space-1); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-rdq__detail { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-rdq__about { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-1) var(--tc-space-2); min-width: 0; }
.ui-rdq__detail-reason { font-weight: var(--tc-font-weight-medium); }
.ui-rdq__word, .ui-rdq__by { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-rdq__word[data-status="approved"] { color: var(--tc-status-success-fg); }
.ui-rdq__word[data-status="rejected"] { color: var(--tc-status-warning-fg); }
.ui-rdq__buttons { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-rdq__empty { padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-secondary); text-align: center; }
.ui-rdq__orphans { padding: var(--tc-space-2) var(--tc-space-4); color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-xs); }
.ui-rdq__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-rdq__share { height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border: 0; border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); font: inherit; font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); cursor: pointer; }
.ui-rdq__share:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); }
.ui-rdq__share:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-rdq__share:disabled { background: var(--tc-fill-hover); box-shadow: none; color: var(--tc-text-secondary); cursor: not-allowed; }
@media (forced-colors: active) {
  .ui-rdq__bar, .ui-rdq__span[data-status="proposed"] .ui-rdq__bar { background: CanvasText; forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-redaction-review")) customElements.define("tc-redaction-review", TcRedactionReview);

declare global {
  interface HTMLElementTagNameMap {
    "tc-redaction-review": TcRedactionReview;
  }
}
