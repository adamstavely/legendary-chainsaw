import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { safeUrl } from "./internal/safe-url";

/*
 * <tc-cell-inspector> – why one AI-filled cell says what it says. The value with how sure the model was (in a word
 * and a percentage), the model and when it ran; the column's prompt with this row's values filled in and marked; the
 * reasoning summary folded away; the sources it used as cards with their site and the quoted passage; the tokens and
 * cost of this one cell; and the history of earlier values with who or what changed each. Accept it, edit it in
 * place, run it again, or mark it as wrong with a reason. Built to sit in a side panel beside an enrichment grid:
 * Escape (with nothing open inside) fires `tc-close`.
 * Standard: the header on a gray tray above a white card. Clean: one white card.
 *
 *   <tc-cell-inspector heading="Risk tier" description="Northwind Analytics · row 214" value="Medium"
 *     prompt="Rate {{vendor}}'s risk tier from {{country}} and {{spend}}" .variables=${{ vendor: "Northwind Analytics", … }}
 *     model="Analyst model" confidence="0.72" .sources=${[…]} .history=${[…]}></tc-cell-inspector>
 *
 * `value` and `status` change on their own; preventDefault() on tc-value-change or tc-status-change keeps control.
 * The actions fire first (tc-accept, tc-rerun, tc-flag) and are cancelable too. Times are epoch ms; relative times
 * need `now`, else they're dates – the element reads no clock.
 */

export type CellSource = {
  id: string;
  title: string;
  /** Opens the source; only http(s), mailto and relative links are kept */
  url?: string;
  /** The passage the model used, quoted */
  snippet?: string;
};

export type CellHistoryEntry = {
  id: string;
  /** The value it had */
  value: string;
  /** When, epoch ms */
  at: number;
  /** Who or what set it: "Analyst model", "Priya Shah" */
  by: string;
  /** A model run or a person (default "model") */
  kind?: "model" | "person";
  /** Why it changed: "Re-run after the prompt changed" */
  note?: string;
};

/** Where the cell stands: freshly filled, accepted, edited by a person, marked as wrong, or running again */
export type CellStatus = "new" | "accepted" | "edited" | "flagged" | "running";

/** Details of the events */
export type CellValueChange = { value: string; previous: string };
export type CellStatusChange = { status: CellStatus; previous: CellStatus };
export type CellAccept = { value: string };
export type CellRerun = { value: string };
export type CellFlag = { reason: string; value: string };

export const defaultCellStatusLabels: Record<CellStatus, string> = {
  new: "Not reviewed",
  accepted: "Accepted",
  edited: "Edited",
  flagged: "Marked wrong",
  running: "Running",
};

/** "High", "Medium" or "Low" for a confidence from 0 to 1 */
export const cellConfidenceWord = (c: number) => (c >= 0.85 ? "High" : c >= 0.6 ? "Medium" : "Low");

/** The prompt cut into text and {{variables}} */
const parts = (prompt: string) => {
  const out: ({ text: string } | { name: string })[] = [];
  const re = /\{\{\s*([\w.-]+)\s*\}\}/g;
  let at = 0;
  for (const m of prompt.matchAll(re)) {
    if (m.index! > at) out.push({ text: prompt.slice(at, m.index) });
    out.push({ name: m[1] });
    at = m.index! + m[0].length;
  }
  if (at < prompt.length) out.push({ text: prompt.slice(at) });
  return out;
};

/** "example.org" from a link, or "" */
const hostOf = (url: string | undefined) => {
  const safe = safeUrl(url);
  if (!safe || !/^https?:/i.test(safe)) return "";
  try {
    return new URL(safe).host.replace(/^www\./, "");
  } catch {
    return "";
  }
};

let instances = 0;

/* ---------- Icons (Lucide, ISC) ---------- */

// text-search
const inspectIcon = svg`<path d="M21 6H3M10 12H3M10 18H3"></path><circle cx="17" cy="15" r="3"></circle><path d="m21 19-1.9-1.9"></path>`;
const icon = (paths: TemplateResult) => html`<svg viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
// check
const checkIcon = icon(svg`<path d="M20 6 9 17l-5-5"></path>`);
// pencil
const editIcon = icon(svg`<path d="M21.17 6.81a1 1 0 0 0-3.99-3.99L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"></path><path d="m15 5 4 4"></path>`);
// rotate-cw
const rerunIcon = icon(svg`<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path>`);
// flag
const flagIcon = icon(svg`<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.33 2q2 0 3.67-.8a1 1 0 0 1 1.4.9v9.47a1 1 0 0 1-.6.92A9 9 0 0 1 16 15c-2.33 0-4.33-2-7-2a6 6 0 0 0-4 1.53"></path>`);
// chevron-right
const chevronIcon = icon(svg`<path d="m9 18 6-6-6-6"></path>`);
// x
const closeIcon = icon(svg`<path d="M18 6 6 18M6 6l12 12"></path>`);
// external-link
const openIcon = icon(svg`<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>`);

/**
 * Why one AI-filled cell says what it says – the value and confidence, the prompt with the row filled in, reasoning,
 * sources, tokens and cost, and history – with Accept, Edit value, Re-run and Mark as wrong.
 * @tag tc-cell-inspector
 * @fires tc-value-change - The value was edited and saved ({ value, previous }: CellValueChange); cancelable – prevented, `value` stays as it was
 * @fires tc-status-change - Accept, an edit, Re-run or Mark as wrong moved the cell on ({ status, previous }: CellStatusChange); cancelable – prevented, `status` stays as it was
 * @fires tc-accept - Accept was pressed ({ value }: CellAccept); cancelable – prevented, nothing changes
 * @fires tc-rerun - Re-run this cell was pressed ({ value }: CellRerun); cancelable – prevented, nothing changes
 * @fires tc-flag - Marked as wrong, with the reason ({ reason, value }: CellFlag); cancelable – prevented, nothing changes
 * @fires tc-close - Escape with nothing open inside, or the close button (detail: {})
 */
export class TcCellInspector extends TcElement {
  static override ui = "cin";

  /** The heading – the column's name – and the region's name */
  @property() accessor heading = "Cell";
  /** A quiet line under the heading – which row: "Northwind Analytics · row 214" */
  @property() accessor description = "";
  /** The cell's value. Changed by Edit value unless a tc-value-change listener calls preventDefault() */
  @property() accessor value = "";
  /** Where the cell stands. Changed by the actions unless a tc-status-change listener calls preventDefault() */
  @property({ reflect: true }) accessor status: CellStatus = "new";
  /** The column's prompt, with {{variable}} where the row's values go */
  @property() accessor prompt = "";
  /** This row's values, by variable name */
  @property({ attribute: false }) accessor variables: Record<string, string> = {};
  /** The model that filled the cell */
  @property() accessor model = "";
  /** When it was filled, epoch ms */
  @property({ type: Number }) accessor at: number | null = null;
  /** The time now, epoch ms – turns times into "3 min ago"; unset shows dates */
  @property({ type: Number }) accessor now: number | null = null;
  /** The model's reasoning summary, folded away until opened */
  @property() accessor reasoning = "";
  /** The sources the model used */
  @property({ attribute: false }) accessor sources: CellSource[] = [];
  /** How sure the model was, 0–1; unset hides it */
  @property({ type: Number }) accessor confidence: number | null = null;
  /** Input tokens this cell used */
  @property({ type: Number, attribute: "tokens-in" }) accessor tokensIn: number | null = null;
  /** Output tokens this cell used */
  @property({ type: Number, attribute: "tokens-out" }) accessor tokensOut: number | null = null;
  /** What this cell cost, in `currency` */
  @property({ type: Number }) accessor cost: number | null = null;
  /** Earlier values, newest first */
  @property({ attribute: false }) accessor history: CellHistoryEntry[] = [];
  /** Show a close button – the panel's own; Escape fires tc-close either way */
  @property({ type: Boolean }) accessor closable = false;
  /** Words for each status */
  @property({ attribute: false }) accessor statusLabels: Partial<Record<CellStatus, string>> = {};
  /** ISO 4217 currency of the cost */
  @property() accessor currency = "USD";
  /** Locale for numbers, money and dates */
  @property() accessor locale = "en-US";

  /** @internal */
  @state() accessor editing = false;
  /** @internal */
  @state() accessor flagging = false;
  /** @internal */
  @state() accessor reasoningOpen = false;
  /** @internal */
  @state() accessor flagError = "";
  /** @internal */
  @state() accessor message = "";

  private readonly uid = `tc-cin${++instances}`;

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    this.addEventListener("keydown", this.onKey);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("keydown", this.onKey);
  }

  /* ---------- Formatting ---------- */

  private word(s: CellStatus) {
    return this.statusLabels[s] ?? defaultCellStatusLabels[s];
  }

  private when(at: number) {
    if (this.now != null) {
      const s = Math.max(0, Math.round((this.now - at) / 1000));
      if (s < 60) return "just now";
      const m = Math.round(s / 60);
      if (m < 60) return `${m} min ago`;
      const h = Math.round(m / 60);
      if (h < 24) return `${h} h ago`;
      const d = Math.round(h / 24);
      if (d < 7) return d === 1 ? "yesterday" : `${d} days ago`;
    }
    return new Intl.DateTimeFormat(this.locale, { dateStyle: "medium", timeStyle: "short" }).format(at);
  }

  private count(n: number) {
    return new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 }).format(n);
  }

  private money(n: number) {
    return new Intl.NumberFormat(this.locale, { style: "currency", currency: this.currency, minimumFractionDigits: 2, maximumFractionDigits: n < 0.01 ? 5 : n < 1 ? 4 : 2 }).format(n);
  }

  /* ---------- Actions ---------- */

  private get busy() {
    return this.status === "running";
  }

  /** Moves the cell on: the status event, then the status unless prevented */
  private moveTo(status: CellStatus, said: string) {
    const previous = this.status;
    if (status !== previous && this.emit<CellStatusChange>("tc-status-change", { status, previous }, { cancelable: true })) this.status = status;
    this.announce(said);
  }

  private accept() {
    if (this.busy || this.status === "accepted") return;
    if (!this.emit<CellAccept>("tc-accept", { value: this.value }, { cancelable: true })) return;
    this.moveTo("accepted", "Accepted.");
  }

  private startEdit() {
    if (this.busy) return;
    this.flagging = false;
    this.editing = true;
    this.updateComplete.then(() => {
      const box = this.querySelector<HTMLTextAreaElement>(".ui-cin__edit-input");
      box?.focus();
      box?.select();
    });
  }

  private cancelEdit() {
    this.editing = false;
    this.updateComplete.then(() => this.querySelector<HTMLButtonElement>(".ui-cin__act--edit")?.focus());
  }

  private saveEdit() {
    const box = this.querySelector<HTMLTextAreaElement>(".ui-cin__edit-input");
    const value = (box?.value ?? "").trim();
    const previous = this.value;
    this.editing = false;
    this.updateComplete.then(() => this.querySelector<HTMLButtonElement>(".ui-cin__act--edit")?.focus());
    if (value === previous) return;
    if (!this.emit<CellValueChange>("tc-value-change", { value, previous }, { cancelable: true })) {
      this.announce("Value not changed.");
      return;
    }
    this.value = value;
    this.moveTo("edited", "Value saved.");
  }

  private rerun() {
    if (this.busy) return;
    if (!this.emit<CellRerun>("tc-rerun", { value: this.value }, { cancelable: true })) return;
    this.editing = false;
    this.flagging = false;
    this.moveTo("running", "Running this cell again.");
  }

  private startFlag() {
    if (this.busy) return;
    this.editing = false;
    this.flagError = "";
    this.flagging = true;
    this.updateComplete.then(() => this.querySelector<HTMLTextAreaElement>(".ui-cin__flag-input")?.focus());
  }

  private cancelFlag() {
    this.flagging = false;
    this.flagError = "";
    this.updateComplete.then(() => this.querySelector<HTMLButtonElement>(".ui-cin__act--flag")?.focus());
  }

  private sendFlag() {
    const box = this.querySelector<HTMLTextAreaElement>(".ui-cin__flag-input");
    const reason = (box?.value ?? "").trim();
    if (!reason) {
      this.flagError = "Say what's wrong, so the column's prompt can be fixed.";
      box?.focus();
      return;
    }
    if (!this.emit<CellFlag>("tc-flag", { reason, value: this.value }, { cancelable: true })) return;
    this.flagging = false;
    this.flagError = "";
    this.updateComplete.then(() => this.querySelector<HTMLButtonElement>(".ui-cin__act--flag")?.focus());
    this.moveTo("flagged", "Marked as wrong.");
  }

  private close = () => this.emit<Record<string, never>>("tc-close", {});

  private onKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || e.defaultPrevented) return;
    if (this.editing) this.cancelEdit();
    else if (this.flagging) this.cancelFlag();
    else this.close();
    e.preventDefault();
    e.stopPropagation();
  };

  private editKey(e: KeyboardEvent) {
    // Enter saves; Shift+Enter is a new line
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      this.saveEdit();
    }
  }

  /** A trailing no-break space makes a repeated message count as new for screen readers */
  private announce(text: string) {
    this.message = this.message === text ? `${text} ` : text;
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // A cell running again can't be edited or marked
    if (changed.has("status") && this.status === "running") {
      this.editing = false;
      this.flagging = false;
    }
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
  }

  /* ---------- Render ---------- */

  private renderPrompt() {
    if (!this.prompt) return nothing;
    return html`<section class="ui-cin__section" aria-labelledby=${`${this.uid}-prompt`}>
      <h4 class="ui-cin__label" id=${`${this.uid}-prompt`}>Prompt for this row</h4>
      <p class="ui-cin__prompt">
        ${parts(this.prompt).map((p) => {
          if ("text" in p) return p.text;
          const v = this.variables[p.name];
          return v == null || v === ""
            ? html`<mark class="ui-cin__var" data-missing title=${p.name}>{{${p.name}}}<span class="tc-sr-only"> (no value in this row)</span></mark>`
            : html`<mark class="ui-cin__var" title=${p.name}>${v}</mark>`;
        })}
      </p>
    </section>`;
  }

  private renderReasoning() {
    if (!this.reasoning) return nothing;
    const panel = `${this.uid}-reasoning`;
    return html`<section class="ui-cin__section">
      <button type="button" class="ui-cin__disclosure" aria-expanded=${this.reasoningOpen ? "true" : "false"} aria-controls=${panel} @click=${() => (this.reasoningOpen = !this.reasoningOpen)}>
        <span class="ui-cin__chev" ?data-open=${this.reasoningOpen}>${chevronIcon}</span>Reasoning
      </button>
      <p class="ui-cin__reasoning" id=${panel} ?hidden=${!this.reasoningOpen}>${this.reasoning}</p>
    </section>`;
  }

  private renderSources() {
    if (!this.sources.length) return nothing;
    return html`<section class="ui-cin__section" aria-labelledby=${`${this.uid}-sources`}>
      <h4 class="ui-cin__label" id=${`${this.uid}-sources`}>Sources <span class="ui-cin__count">${this.sources.length}</span></h4>
      <ul class="ui-cin__sources">
        ${this.sources.map((s) => {
          const url = safeUrl(s.url);
          const host = hostOf(s.url);
          return html`<li class="ui-cin__source">
            <p class="ui-cin__source-head">
              ${url
                ? html`<a class="ui-cin__source-title" href=${url} target="_blank" rel="noopener noreferrer">${s.title}<span class="ui-cin__open">${openIcon}</span><span class="tc-sr-only"> (opens in a new tab)</span></a>`
                : html`<span class="ui-cin__source-title">${s.title}</span>`}
              ${host ? html`<span class="ui-cin__host">${host}</span>` : nothing}
            </p>
            ${s.snippet ? html`<blockquote class="ui-cin__quote">${s.snippet}</blockquote>` : nothing}
          </li>`;
        })}
      </ul>
    </section>`;
  }

  private renderUsage() {
    const items: [string, string][] = [];
    if (this.tokensIn != null) items.push(["Tokens in", this.count(this.tokensIn)]);
    if (this.tokensOut != null) items.push(["Tokens out", this.count(this.tokensOut)]);
    if (this.cost != null) items.push(["Cost", this.money(this.cost)]);
    if (!items.length) return nothing;
    return html`<dl class="ui-cin__usage" aria-label="This cell's usage">
      ${items.map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}
    </dl>`;
  }

  private renderHistory() {
    if (!this.history.length) return nothing;
    return html`<section class="ui-cin__section" aria-labelledby=${`${this.uid}-history`}>
      <h4 class="ui-cin__label" id=${`${this.uid}-history`}>Earlier values</h4>
      <ol class="ui-cin__history">
        ${this.history.map(
          (h) => html`<li class="ui-cin__entry" data-kind=${h.kind ?? "model"}>
            <span class="ui-cin__entry-value">${h.value || html`<span class="ui-cin__muted">Empty</span>`}</span>
            <span class="ui-cin__entry-meta">${h.kind === "person" ? "Edited by" : "Filled by"} ${h.by} · <time datetime=${new Date(h.at).toISOString()}>${this.when(h.at)}</time>${h.note ? html` · ${h.note}` : nothing}</span>
          </li>`,
        )}
      </ol>
    </section>`;
  }

  private renderActions() {
    const busy = this.busy;
    const accepted = this.status === "accepted";
    const dis = (off: boolean) => (off ? "true" : "false");
    return html`<div class="ui-cin__actions" role="group" aria-label="Cell actions">
      <button type="button" class="ui-cin__act ui-cin__act--accept" ?data-done=${accepted} aria-disabled=${dis(busy || accepted)} @click=${this.accept}>
        ${checkIcon}${accepted ? "Accepted" : "Accept"}
      </button>
      <button type="button" class="ui-cin__act ui-cin__act--edit" aria-disabled=${dis(busy)} aria-expanded=${this.editing ? "true" : "false"} @click=${() => (this.editing ? this.cancelEdit() : this.startEdit())}>
        ${editIcon}Edit value
      </button>
      <button type="button" class="ui-cin__act ui-cin__act--rerun" aria-disabled=${dis(busy)} @click=${this.rerun}>${rerunIcon}Re-run this cell</button>
      <button type="button" class="ui-cin__act ui-cin__act--flag" aria-disabled=${dis(busy)} aria-expanded=${this.flagging ? "true" : "false"} @click=${() => (this.flagging ? this.cancelFlag() : this.startFlag())}>
        ${flagIcon}Mark as wrong
      </button>
    </div>`;
  }

  private renderFlag() {
    if (!this.flagging) return nothing;
    const id = `${this.uid}-flag`;
    const err = `${this.uid}-flag-error`;
    return html`<div class="ui-cin__form">
      <label class="ui-cin__form-label" for=${id}>What's wrong with this value?</label>
      <textarea
        id=${id}
        class="ui-cin__flag-input"
        rows="2"
        placeholder="The vendor moved to Ireland in 2025"
        aria-invalid=${this.flagError ? "true" : "false"}
        aria-describedby=${ifDefined(this.flagError ? err : undefined)}
        @input=${() => this.flagError && (this.flagError = "")}
      ></textarea>
      ${this.flagError ? html`<p class="ui-cin__error" id=${err}>${this.flagError}</p>` : nothing}
      <div class="ui-cin__form-actions">
        <button type="button" class="tc-btn-sm" @click=${this.cancelFlag}>Cancel</button>
        <button type="button" class="ui-cin__primary" @click=${this.sendFlag}>Mark as wrong</button>
      </div>
    </div>`;
  }

  private renderValue() {
    const conf = this.confidence;
    const meta: unknown[] = [];
    if (this.model) meta.push(this.model);
    if (this.at != null) meta.push(html`<time datetime=${new Date(this.at).toISOString()}>${this.when(this.at)}</time>`);
    return html`<section class="ui-cin__value-block" aria-labelledby=${`${this.uid}-value`} aria-busy=${this.busy ? "true" : "false"}>
      <h4 class="ui-cin__label" id=${`${this.uid}-value`}>Value</h4>
      ${this.editing
        ? html`<div class="ui-cin__form">
            <label class="tc-sr-only" for=${`${this.uid}-edit`}>New value</label>
            <textarea id=${`${this.uid}-edit`} class="ui-cin__edit-input" rows="2" .value=${live(this.value)} @keydown=${this.editKey}></textarea>
            <div class="ui-cin__form-actions">
              <span class="ui-cin__hint">Enter saves · Escape cancels</span>
              <button type="button" class="tc-btn-sm" @click=${this.cancelEdit}>Cancel</button>
              <button type="button" class="ui-cin__primary" @click=${this.saveEdit}>Save</button>
            </div>
          </div>`
        : html`<p class="ui-cin__value">${this.busy ? html`<span class="ui-cin__muted">Running again…</span>` : this.value || html`<span class="ui-cin__muted">Empty</span>`}</p>`}
      ${conf != null && Number.isFinite(conf)
        ? html`<p class="ui-cin__confidence" data-level=${cellConfidenceWord(conf).toLowerCase()}>
            <span class="ui-cin__mark" aria-hidden="true"></span>${cellConfidenceWord(conf)} confidence · ${Math.round(Math.max(0, Math.min(1, conf)) * 100)}%
          </p>`
        : nothing}
      ${meta.length ? html`<p class="ui-cin__meta">${meta.map((m, i) => html`${i ? " · " : ""}${m}`)}</p>` : nothing}
    </section>`;
  }

  protected override render() {
    const head = cardHead({
      icon: inspectIcon,
      title: this.heading,
      subtitle: this.description,
      id: `${this.uid}-title`,
      keepAside: this.closable,
      aside: html`<span class="ui-cin__pill" data-status=${this.status}>${this.word(this.status)}</span>${this.closable
          ? html`<button type="button" class="ui-cin__close" @click=${this.close}>${closeIcon}<span class="tc-sr-only">Close</span></button>`
          : nothing}`,
    });
    return html`
      ${head}
      <div class="ui-cin__card">
        <div class="ui-cin__inner">
          ${this.renderValue()} ${this.renderActions()} ${this.renderFlag()} ${this.renderPrompt()} ${this.renderReasoning()} ${this.renderSources()}
          ${this.renderUsage()} ${this.renderHistory()}
        </div>
      </div>
      <p class="tc-sr-only" role="status">${this.message}</p>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="cin"] {
  box-sizing: border-box;
  container-type: inline-size;
  position: relative;
  display: grid;
  width: 100%;
  max-width: 440px;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-sunken);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-snug);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cin"] {
  box-sizing: border-box;
  container-type: inline-size;
  position: relative;
  display: grid;
  width: 100%;
  max-width: 440px;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="cin"] *, [data-ui="cin"] *::before, [data-ui="cin"] *::after { box-sizing: border-box; }
[data-ui="cin"] { grid-template-columns: minmax(0, 1fr); }
:where([data-ui="cin"]) :is(h4, p, ul, ol, dl, dd, blockquote) { margin: 0; padding: 0; }
:where([data-ui="cin"]) :is(ul, ol) { list-style: none; }
:where([data-ui="cin"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="cin"] :is(button, a, textarea):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="cin"] svg { display: block; width: 14px; height: 14px; flex: none; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cin"] :not(.tc-head__icon) > svg { stroke-width: 1.6; }
:where([data-look="standard"], [data-look="standard"] *).ui-cin__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
.ui-cin__inner { display: grid; gap: var(--tc-space-4); }
:where([data-look="standard"], [data-look="standard"] *).ui-cin__inner { padding: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-cin__inner { padding: 0 var(--tc-space-4) var(--tc-space-4); }
.ui-cin__muted { color: var(--tc-text-muted); }
/* The status pill, and Close */
.ui-cin__pill { display: inline-flex; align-items: center; height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-cin__pill[data-status="accepted"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-cin__pill[data-status="edited"] { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-cin__pill[data-status="flagged"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-cin__pill[data-status="running"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-cin__close { display: inline-grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); margin-left: var(--tc-space-1); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); }
.ui-cin__close:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
/* Section labels */
.ui-cin__section { display: grid; gap: var(--tc-space-2); padding-top: var(--tc-space-3-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-cin__label { display: flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); }
.ui-cin__count { color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); font-variant-numeric: tabular-nums; }
/* The value */
.ui-cin__value-block { display: grid; gap: var(--tc-space-1-5); }
.ui-cin__value { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
:where([data-look="standard"], [data-look="standard"] *).ui-cin__value { font-size: var(--tc-font-size-xl); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-cin__value { font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-snug); color: var(--tc-text-strong); }
.ui-cin__confidence { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-cin__mark { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--tc-status-success-solid); }
.ui-cin__confidence[data-level="medium"] .ui-cin__mark { background: var(--tc-status-warning-solid); border-radius: var(--tc-radius-xs); }
.ui-cin__confidence[data-level="low"] .ui-cin__mark { background: var(--tc-status-danger-solid); border-radius: 0; transform: rotate(45deg); }
.ui-cin__meta { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
/* Accept, Edit value, Re-run, Mark as wrong */
.ui-cin__actions { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
.ui-cin__act { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-cin__act:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-cin__act:active { transform: scale(0.97); }
.ui-cin__act--accept { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-cin__act--accept:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-cin__act--accept[data-done] { background: var(--tc-status-success-bg); box-shadow: none; color: var(--tc-status-success-fg); }
.ui-cin__act[aria-disabled="true"]:not([data-done]) { background: var(--tc-fill-default); box-shadow: none; color: var(--tc-text-muted); cursor: not-allowed; transform: none; }
.ui-cin__act[aria-disabled="true"] { cursor: default; transform: none; }
.ui-cin__act[aria-expanded="true"] { background: var(--tc-fill-default); box-shadow: none; color: var(--tc-text-primary); }
/* Inline forms: edit and mark as wrong */
.ui-cin__form { display: grid; gap: var(--tc-space-2); }
.ui-cin__form-label { color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); }
.ui-cin__form textarea { width: 100%; min-height: var(--tc-field-h); margin: 0; padding: var(--tc-space-2) var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); resize: vertical; }
.ui-cin__form textarea:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-cin__form textarea:focus-visible { outline: none; box-shadow: var(--tc-field-shadow-focus); }
.ui-cin__form textarea[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-cin__form textarea::placeholder { color: var(--tc-text-muted); }
.ui-cin__form-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-1-5); }
.ui-cin__hint { margin-right: auto; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-cin__error { color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-sm); }
.ui-cin__primary { display: inline-flex; align-items: center; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; }
.ui-cin__primary:hover { background: var(--tc-action-primary-bg-hover); }
/* The prompt, with the row's values marked */
.ui-cin__prompt { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-relaxed); overflow-wrap: anywhere; }
.ui-cin__var { padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); background: var(--tc-accent-subtle); color: var(--tc-accent-text); font-weight: var(--tc-font-weight-medium); box-decoration-break: clone; -webkit-box-decoration-break: clone; }
.ui-cin__var[data-missing] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); font-family: var(--tc-font-mono); }
/* Reasoning */
.ui-cin__disclosure { display: inline-flex; align-items: center; gap: var(--tc-space-1); justify-self: start; min-height: var(--tc-control-h-sm); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); }
.ui-cin__disclosure:hover { color: var(--tc-text-primary); }
.ui-cin__chev { display: inline-grid; transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cin__chev[data-open] { transform: rotate(90deg); }
.ui-cin__reasoning { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-relaxed); white-space: pre-line; }
/* Sources */
.ui-cin__sources { display: grid; gap: var(--tc-space-2); }
.ui-cin__source { display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-surface-sunken); }
.ui-cin__source-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--tc-space-1) var(--tc-space-3); font-size: var(--tc-font-size-sm); }
.ui-cin__source-title { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-width: 0; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); text-decoration: none; }
a.ui-cin__source-title:hover { text-decoration: underline; }
.ui-cin__open svg { width: 12px; height: 12px; color: var(--tc-text-muted); }
.ui-cin__host { color: var(--tc-text-muted); }
.ui-cin__quote { padding-left: var(--tc-space-2-5); border-left: var(--tc-space-0-5) solid var(--tc-border-default); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
/* Tokens and cost */
.ui-cin__usage { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--tc-space-3); padding-top: var(--tc-space-3-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-cin__usage dt { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-cin__usage dd { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; }
/* Earlier values */
.ui-cin__history { display: grid; gap: var(--tc-space-2-5); }
.ui-cin__entry { display: grid; gap: var(--tc-space-0-5); padding-left: var(--tc-space-3); border-left: var(--tc-space-0-5) solid var(--tc-divider); }
.ui-cin__entry[data-kind="person"] { border-left-color: var(--tc-accent); }
.ui-cin__entry-value { color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-cin__entry-meta { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
@container (max-width: 360px) {
  .ui-cin__usage { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  :where([data-look="standard"], [data-look="standard"] *).ui-cin__inner { padding: var(--tc-space-3-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-cin__inner { padding: 0 var(--tc-space-3-5) var(--tc-space-3-5); }
}
@media (hover: none) and (pointer: coarse) {
  .ui-cin__act, .ui-cin__primary { height: var(--tc-control-h-md); }
}
@media (forced-colors: active) {
  .ui-cin__mark { background: CanvasText; }
  .ui-cin__var { border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="cin"] *, [data-ui="cin"] *::before, [data-ui="cin"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-cell-inspector")) customElements.define("tc-cell-inspector", TcCellInspector);

declare global {
  interface HTMLElementTagNameMap {
    "tc-cell-inspector": TcCellInspector;
  }
}
