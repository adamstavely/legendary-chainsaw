import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { ListMotionController } from "./internal/list-motion";
import { formatDate, initials } from "./internal/util";

/*
 * <tc-access-review> – a periodic check of who can see what. Each row is one person or group's access to one thing, most
 * in need of attention first: anyone no longer authorized or who couldn't be checked, then the rest. The reviewer keeps
 * or removes each one, and keeping someone flagged needs a written reason, which goes in the record. Keep all authorized
 * settles the routine rows at once. Submit waits until every row has a decision.
 * This records what the reviewer decided; the page applies it and keeps the record.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-access-review heading="Q4 access review" .items=${items}></tc-access-review>
 */

export type AccessReviewStatus = "authorized" | "unauthorized" | "unverified";
export type AccessReviewItem = {
  id: string;
  /** Who has access */
  name: string;
  kind?: "person" | "group";
  /** What they can reach */
  resource: string;
  /** Their level, in words: "Can edit" */
  level: string;
  status: AccessReviewStatus;
  /** Why they were flagged */
  reason?: string;
  /** When they last used it, epoch ms */
  lastUsed?: number;
};
export type AccessReviewChoice = "keep" | "remove";
export type AccessReviewDecision = { choice: AccessReviewChoice; note?: string };
export type AccessReviewDecisions = Record<string, AccessReviewDecision>;
export type AccessReviewFilter = "all" | "flagged" | "open";
export type AccessReviewDecisionsChange = { decisions: AccessReviewDecisions; item?: AccessReviewItem };
export type AccessReviewSubmit = { decisions: AccessReviewDecisions; keep: AccessReviewItem[]; remove: AccessReviewItem[] };

/** The block's words, every one renameable through `labels` */
export type AccessReviewLabels = {
  all: string;
  flagged: string;
  open: string;
  filter: string;
  keep: string;
  remove: string;
  keepAll: string;
  authorized: string;
  unauthorized: string;
  unverified: string;
  noReason: string;
  lastUsed: string;
  neverUsed: string;
  note: string;
  notePlaceholder: string;
  /** {done} of {total} */
  progress: string;
  empty: string;
  submit: string;
  /** {n} */
  needsDecision: string;
  needsNote: string;
  submitted: string;
};
export const defaultAccessReviewLabels: AccessReviewLabels = {
  all: "All",
  flagged: "Flagged",
  open: "Not decided",
  filter: "Show",
  keep: "Keep",
  remove: "Remove",
  keepAll: "Keep all authorized",
  authorized: "Authorized",
  unauthorized: "No longer authorized",
  unverified: "Couldn't be checked",
  noReason: "They aren't entitled to this data.",
  lastUsed: "Last used {when}",
  neverUsed: "Not used yet",
  note: "Why keep this access?",
  notePlaceholder: "This goes in the review record",
  progress: "{done} of {total} decided",
  empty: "Nothing to show here.",
  submit: "Submit review",
  needsDecision: "{n} still to decide.",
  needsNote: "Add a reason for keeping anyone flagged.",
  submitted: "Review submitted.",
};

const ICON = svg`<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path><path d="m9 12 2 2 4-4"></path>`;
const flagged = (i: AccessReviewItem) => i.status !== "authorized";
let instances = 0;

/**
 * A periodic check of who can see what: keep or remove each one, with a reason for keeping anyone flagged.
 * @tag tc-access-review
 * @fires tc-decisions-change - A decision changed ({ decisions, item }: AccessReviewDecisionsChange); cancelable – prevented, `decisions` stays as it was
 * @fires tc-filter-change - The filter changed ({ filter }: { filter: AccessReviewFilter }); cancelable – prevented, `filter` stays as it was
 * @fires tc-review-submit - Submit was pressed ({ decisions, keep, remove }: AccessReviewSubmit); cancelable
 */
export class TcAccessReview extends TcElement {
  static override ui = "acr";

  /** The heading */
  @property() accessor heading = "Access review";
  /** A line under the heading, such as what's in scope and when it's due */
  @property() accessor description: string | undefined = undefined;
  /** Each person or group's access to one thing */
  @property({ attribute: false }) accessor items: AccessReviewItem[] = [];
  /** The decisions so far, by item id. Changed by the user unless a tc-decisions-change listener calls preventDefault() */
  @property({ attribute: false }) accessor decisions: AccessReviewDecisions = {};
  /** Which rows show: "all", "flagged" or "open". Changed by the user unless a tc-filter-change listener calls preventDefault() */
  @property() accessor filter: AccessReviewFilter = "all";
  /** The page is sending the review: controls are locked */
  @property({ type: Boolean, reflect: true }) accessor sending = false;
  /** The locale for dates */
  @property() accessor locale: string | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<AccessReviewLabels> = {};

  @state() private accessor announce = "";
  private readonly uid = `tc-acr-${++instances}`;

  constructor() {
    super();
    new ListMotionController(this, () => this.querySelector(".ui-acr__list"), { exits: false });
  }

  private get words(): AccessReviewLabels {
    return { ...defaultAccessReviewLabels, ...this.labels };
  }

  private get ordered() {
    return [...this.items].sort((a, b) => Number(flagged(b)) - Number(flagged(a)));
  }

  private get shown() {
    const all = this.ordered;
    if (this.filter === "flagged") return all.filter(flagged);
    if (this.filter === "open") return all.filter((i) => !this.decisions[i.id]);
    return all;
  }

  private setDecisions(decisions: AccessReviewDecisions, item?: AccessReviewItem) {
    if (this.emit<AccessReviewDecisionsChange>("tc-decisions-change", { decisions, item }, { cancelable: true })) this.decisions = decisions;
    else this.requestUpdate();
  }

  private choose(item: AccessReviewItem, choice: AccessReviewChoice) {
    const current = this.decisions[item.id];
    if (current?.choice === choice) return;
    this.setDecisions({ ...this.decisions, [item.id]: { choice, ...(choice === "keep" && current?.note ? { note: current.note } : {}) } }, item);
  }

  private setNote(item: AccessReviewItem, note: string) {
    const current = this.decisions[item.id];
    if (current?.choice !== "keep" || (current.note ?? "") === note) return;
    this.setDecisions({ ...this.decisions, [item.id]: { choice: "keep", note } }, item);
  }

  private keepAllAuthorized() {
    const next = { ...this.decisions };
    for (const item of this.items) if (!flagged(item) && !next[item.id]) next[item.id] = { choice: "keep" };
    this.setDecisions(next);
  }

  private setFilter(filter: AccessReviewFilter) {
    if (filter === this.filter) return;
    if (this.emit("tc-filter-change", { filter }, { cancelable: true })) this.filter = filter;
    else this.requestUpdate();
  }

  private problem(i: AccessReviewItem) {
    const d = this.decisions[i.id];
    return !d || (flagged(i) && d.choice === "keep" && !d.note?.trim());
  }

  private submit() {
    if (this.sending || this.items.some((i) => this.problem(i))) return;
    const of = (c: AccessReviewChoice) => this.items.filter((i) => this.decisions[i.id]?.choice === c);
    if (this.emit<AccessReviewSubmit>("tc-review-submit", { decisions: this.decisions, keep: of("keep"), remove: of("remove") }, { cancelable: true })) this.announce = this.words.submitted;
  }

  private renderRow(item: AccessReviewItem) {
    const w = this.words;
    const d = this.decisions[item.id];
    const noteId = `${this.uid}-${item.id}-note`;
    const missingNote = flagged(item) && d?.choice === "keep" && !d.note?.trim();
    const used = item.lastUsed !== undefined ? w.lastUsed.replace("{when}", formatDate(item.lastUsed, this.locale)) : w.neverUsed;
    const tone = item.status === "authorized" ? "ok" : item.status === "unauthorized" ? "danger" : "warning";
    return html`<li class="ui-acr__row" data-item=${item.id} data-status=${item.status} data-choice=${d?.choice ?? "none"}>
      <span class="ui-acr__avatar" data-kind=${item.kind ?? "person"} aria-hidden="true">${initials(item.name)}</span>
      <div class="ui-acr__who">
        <span class="ui-acr__name">${item.name}</span>
        <span class="ui-acr__scope">${item.level} · ${item.resource}</span>
        <span class="ui-acr__used">${used}</span>
        <p class="ui-acr__status" data-tone=${tone}><b>${w[item.status]}</b>${flagged(item) ? html`<span>. ${item.reason || (item.status === "unauthorized" ? w.noReason : "")}</span>` : nothing}</p>
        ${flagged(item) && d?.choice === "keep"
          ? html`<label class="ui-acr__note-label" for=${noteId}>${w.note}</label>
              <textarea
                id=${noteId}
                class="ui-acr__note"
                rows="2"
                placeholder=${w.notePlaceholder}
                aria-required="true"
                aria-invalid=${missingNote ? "true" : "false"}
                .value=${live(d.note ?? "")}
                ?disabled=${this.sending}
                @change=${(e: Event) => this.setNote(item, (e.target as HTMLTextAreaElement).value.trim())}
              ></textarea>`
          : nothing}
      </div>
      <div class="ui-acr__choices" role="group" aria-label=${`${item.name}, ${item.resource}`}>
        ${(["keep", "remove"] as const).map(
          (c) => html`<button type="button" class="ui-acr__choice" data-choice=${c} aria-pressed=${d?.choice === c ? "true" : "false"} ?disabled=${this.sending} @click=${() => this.choose(item, c)}>${w[c]}</button>`,
        )}
      </div>
    </li>`;
  }

  protected override render() {
    const w = this.words;
    const total = this.items.length;
    const done = this.items.filter((i) => this.decisions[i.id]).length;
    const left = total - done;
    const notes = this.items.some((i) => this.decisions[i.id] && this.problem(i));
    const routine = this.items.some((i) => !flagged(i) && !this.decisions[i.id]);
    const rows = this.shown;
    const count = { all: total, flagged: this.items.filter(flagged).length, open: left };
    return html`${cardHead({ icon: ICON, title: this.heading, subtitle: this.description, id: `${this.uid}-title`, aside: html`<span class="ui-acr__progress">${w.progress.replace("{done}", String(done)).replace("{total}", String(total))}</span>` })}
      <div class="ui-acr__card">
        <div class="ui-acr__bar">
          <div class="ui-acr__filters" role="group" aria-label=${w.filter}>
            ${(["all", "flagged", "open"] as const).map(
              (f) => html`<button type="button" class="ui-acr__filter" aria-pressed=${this.filter === f ? "true" : "false"} @click=${() => this.setFilter(f)}>${w[f]} <span class="ui-acr__n">${count[f]}</span></button>`,
            )}
          </div>
          <button type="button" class="tc-btn-sm ui-acr__keep-all" ?disabled=${!routine || this.sending} @click=${this.keepAllAuthorized}>${w.keepAll}</button>
        </div>
        ${rows.length ? html`<ul class="ui-acr__list" aria-labelledby=${`${this.uid}-title`}>${repeat(rows, (i) => i.id, (i) => this.renderRow(i))}</ul>` : html`<p class="ui-acr__empty">${w.empty}</p>`}
        <div class="ui-acr__foot">
          <span class="ui-acr__hint">${left ? w.needsDecision.replace("{n}", String(left)) : notes ? w.needsNote : nothing}</span>
          <button type="button" class="ui-acr__submit" ?disabled=${!total || left > 0 || notes || this.sending} @click=${this.submit}>${w.submit}</button>
        </div>
      </div>
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="acr"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="acr"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
[data-ui="acr"] { --tc-acr-avatar: 32px; }
[data-ui="acr"] *, [data-ui="acr"] *::before, [data-ui="acr"] *::after { box-sizing: border-box; }
[data-ui="acr"] :where(p) { margin: 0; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="acr"] .ui-acr__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-acr__progress { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-acr__bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4); }
.ui-acr__filters { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-acr__filter { height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: var(--tc-text-secondary); font: inherit; font-size: var(--tc-font-size-xs); font-weight: var(--tc-control-font-weight); cursor: pointer; }
.ui-acr__filter:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-acr__filter[aria-pressed="true"] { background: var(--tc-fill-selected); color: var(--tc-text-primary); }
.ui-acr__n { font-variant-numeric: tabular-nums; }
.ui-acr__list { display: grid; margin: 0; padding: 0; list-style: none; }
.ui-acr__row { display: flex; align-items: flex-start; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); background: inherit; }
.ui-acr__avatar { display: inline-flex; flex: none; align-items: center; justify-content: center; width: var(--tc-acr-avatar); height: var(--tc-acr-avatar); border-radius: var(--tc-radius-full); background: var(--tc-fill-hover); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-acr__avatar[data-kind="group"] { border-radius: var(--tc-control-radius-md); }
.ui-acr__who { display: grid; flex: 1; gap: var(--tc-space-0-5); min-width: 0; }
.ui-acr__name { font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-acr__scope, .ui-acr__used { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; }
.ui-acr__status { font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); }
.ui-acr__status b { font-weight: var(--tc-font-weight-medium); }
.ui-acr__status[data-tone="danger"] { color: var(--tc-status-danger-fg); }
.ui-acr__status[data-tone="warning"] { color: var(--tc-status-warning-fg); }
.ui-acr__note-label { margin-top: var(--tc-space-2); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-acr__note { width: 100%; padding: var(--tc-space-1-5) var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; resize: vertical; }
.ui-acr__note:focus { outline: 0; box-shadow: var(--tc-field-shadow-focus); }
.ui-acr__note[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-acr__note::placeholder { color: var(--tc-text-muted); }
.ui-acr__choices { display: flex; flex: none; gap: var(--tc-space-1); }
.ui-acr__choice { height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-md); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); font: inherit; font-size: var(--tc-font-size-xs); font-weight: var(--tc-control-font-weight); cursor: pointer; }
.ui-acr__choice:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-acr__choice[aria-pressed="true"] { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-acr__filter:focus-visible, .ui-acr__choice:focus-visible, .ui-acr__submit:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-acr__empty { padding: var(--tc-space-6) var(--tc-space-4); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); color: var(--tc-text-secondary); text-align: center; }
.ui-acr__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-acr__hint { flex: 1 1 12em; color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-acr__submit { height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border: 0; border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); font: inherit; font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); cursor: pointer; }
.ui-acr__submit:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); }
.ui-acr__submit:disabled { background: var(--tc-fill-hover); box-shadow: none; color: var(--tc-text-secondary); cursor: not-allowed; }
@container (max-width: 520px) {
  .ui-acr__row { flex-wrap: wrap; }
  .ui-acr__who { flex-basis: calc(100% - var(--tc-acr-avatar) - var(--tc-space-3)); }
  .ui-acr__choices { width: 100%; justify-content: flex-end; }
}
@media (forced-colors: active) {
  .ui-acr__choice[aria-pressed="true"], .ui-acr__filter[aria-pressed="true"] { background: Highlight; color: HighlightText; forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-access-review")) customElements.define("tc-access-review", TcAccessReview);

declare global {
  interface HTMLElementTagNameMap {
    "tc-access-review": TcAccessReview;
  }
}
