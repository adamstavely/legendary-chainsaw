import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { ToolbarController } from "./internal/controllers";
import type { Look } from "./internal/look";
import { PopoverController } from "./internal/popover";
import { tokenMs } from "./internal/util";

/*
 * <tc-session-context-bar> – the terms a session was declared with, kept in view under the app's header: what it's
 * for, where its knowledge comes from, its scope, what needs review, its posture, how far anything may be released,
 * its deadline and how much of its budget is used. Each term is a labelled chip; the ones that don't fit go behind
 * "+N more", which opens a list of the rest.
 *   · every term is data – `{ id, label, value, tone, meter, editable }`; the eight usual ones (intent, knowledge,
 *     scope, review, posture, release, deadline, budget) get their labels from their id, and any other term is
 *     welcome. Values are shown as given: the element formats nothing and reads no clock
 *   · a term can be editable: its chip is a button that fires tc-term-edit with the chip as the anchor, and the app
 *     opens its own editor
 *   · when a term's value, tone or meter changes, its chip flashes once (not with reduced motion) and a polite status
 *     says what changed: "Posture: Elevated"
 *   · keyboard: the bar is a toolbar – one tab stop, ← → Home End between the editable chips and "+N more". In the
 *     list, ↑ ↓ Home End move and Escape closes it, back to "+N more"
 * It's a strip, not a card: no header, it sticks to the top of its scroller (`sticky`, `sticky-top`).
 * Standard: chips as white pills on the gray tray strip. Clean: a white strip with the terms as plain text between
 * hairlines, quieter labels.
 *
 *   <tc-session-context-bar .terms=${[{ id: "intent", value: "Compare two suppliers" }, …]}></tc-session-context-bar>
 */

/** A term's colour – the value's words carry the meaning, the colour points at it */
export type SessionTermTone = "neutral" | "info" | "success" | "warning" | "danger";
/** One declared term of the session */
export type SessionTerm = {
  /** Stable id; the eight usual terms take their label from it: intent, knowledge, scope, review, posture, release, deadline, budget */
  id: string;
  /** The label; unset, the usual one for the id, else the id */
  label?: string;
  /** The value, shown as given: "Sources and model knowledge", "Fri 17:00" */
  value: string;
  tone?: SessionTermTone;
  /** How much is used, 0–1: shows a small meter beside the value (a budget) */
  meter?: number;
  /** The chip is a button that fires tc-term-edit; unset follows the bar's `editable` */
  editable?: boolean;
  /** A longer line, shown in the "+N more" list and as the chip's tooltip (else the tooltip is the label and value, for a value cut short) */
  description?: string;
};
export type SessionTermEditDetail = { term: SessionTerm; anchor: HTMLElement };
/** What changed in one term since the last `terms` */
export type SessionTermChange = { term: SessionTerm; previous: SessionTerm | null };

/** The labels of the usual terms, by id */
export const SESSION_TERM_LABELS: Record<string, string> = {
  intent: "Intent",
  knowledge: "Knowledge",
  scope: "Scope",
  review: "Review",
  posture: "Posture",
  release: "Release limit",
  deadline: "Deadline",
  budget: "Budget used",
};

const lockIcon = (look: Look) =>
  html`<svg viewBox="0 0 16 16" width="14" height="14" class="ui-scxb__icon" stroke-width=${look === "clean" ? 1.2 : 1.5} aria-hidden="true">${svg`<path d="M4.75 7.25h6.5c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1h-6.5c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1ZM5.75 7.25V5.5a2.25 2.25 0 0 1 4.5 0v1.75"></path>`}</svg>`;
const editIcon = (look: Look) =>
  html`<svg viewBox="0 0 16 16" width="12" height="12" class="ui-scxb__icon ui-scxb__edit" stroke-width=${look === "clean" ? 1.2 : 1.5} aria-hidden="true">${svg`<path d="m4.5 6.25 3.5 3.5 3.5-3.5"></path>`}</svg>`;

let instances = 0;
const same = (a: SessionTerm, b: SessionTerm) => a.value === b.value && (a.tone ?? "neutral") === (b.tone ?? "neutral") && a.meter === b.meter;

/**
 * The session's declared terms kept in view – intent, knowledge mode, scope, review, posture, limits, deadline and
 * budget – as labelled chips, with "+N more" for the rest.
 * @tag tc-session-context-bar
 * @fires tc-term-edit - An editable term's chip was pressed; detail `{ term, anchor }` (SessionTermEditDetail) – open your editor at `anchor`
 * @fires tc-terms-changed - `terms` changed one or more values; detail `{ changes }` (SessionTermChange[]) – after the flash and announcement start
 */
export class TcSessionContextBar extends TcElement {
  static override ui = "scxb";

  /** The terms, in the order they show; the ones that don't fit go behind "+N more" */
  @property({ attribute: false }) accessor terms: SessionTerm[] = [];
  /** The bar's name for screen readers */
  @property() accessor label = "Session terms";
  /** Every term is editable unless it says otherwise */
  @property({ type: Boolean }) accessor editable = false;
  /** The terms are fixed for the session: a lock shows at the start and nothing is editable */
  @property({ type: Boolean }) accessor locked = false;
  /** Sticks to the top of the scroller it's in (default true) */
  @property({ type: Boolean }) accessor sticky = true;
  /** How far from the top it sticks, in px – the height of a header above it */
  @property({ type: Number, attribute: "sticky-top" }) accessor stickyTop = 0;
  /** Show at most this many chips, however wide the bar is */
  @property({ type: Number, attribute: "max-visible" }) accessor maxVisible: number | undefined = undefined;
  /** Labels for term ids – in place of the usual ones (Intent, Knowledge …) or for your own ids */
  @property({ attribute: false }) accessor termLabels: Record<string, string> = {};
  /** The meter's tone turns warning from this share used (default 0.75) */
  @property({ type: Number, attribute: "meter-warn" }) accessor meterWarn = 0.75;
  /** … and danger from this share (default 0.9) */
  @property({ type: Number, attribute: "meter-danger" }) accessor meterDanger = 0.9;

  /** @internal How many chips fit */
  @state() accessor fit = Infinity;
  /** @internal Terms flashing after a change */
  @state() accessor flashing: string[] = [];
  /** @internal A polite message for screen readers */
  @state() accessor said = "";

  private readonly uid = `tc-scxb${++instances}`;
  private readonly tools: ToolbarController;
  private resize: ResizeObserver | null = null;
  private flashTimer: ReturnType<typeof setTimeout> | undefined;
  /** The "+N more" list floats under its button, right-aligned, in the top layer (internal/popover.ts) */
  private readonly pop = new PopoverController(this, {
    popover: () => this.popEl,
    anchor: () => this.moreEl,
    side: "bottom",
    align: "end",
    gap: 6,
    hideOffscreen: false,
    returnFocus: () => this.moreEl,
    initialFocus: () => this.popEl?.querySelector<HTMLElement>(".ui-scxb__item-btn") ?? this.popEl?.querySelector<HTMLElement>(".ui-scxb__pop-list") ?? null,
    closeOnFocusOut: true,
  });

  constructor() {
    super();
    this.tools = new ToolbarController(this, { items: () => [...this.querySelectorAll<HTMLElement>(".ui-scxb__bar > .ui-scxb__chips > button.ui-scxb__chip:not([data-off]), .ui-scxb__more:not([data-off])")] });
  }

  /** The label a term shows */
  labelOf(t: SessionTerm) {
    return t.label ?? this.termLabels[t.id] ?? SESSION_TERM_LABELS[t.id] ?? t.id;
  }

  private isEditable(t: SessionTerm) {
    return !this.locked && (t.editable ?? this.editable);
  }

  /** How many chips show: what fits, capped by `maxVisible` */
  get visibleCount() {
    return Math.max(0, Math.min(this.terms.length, this.fit, this.maxVisible ?? Infinity));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    this.resize = typeof ResizeObserver === "function" ? new ResizeObserver(() => this.measure()) : null;
    void this.updateComplete.then(() => {
      const bar = this.querySelector(".ui-scxb__bar");
      if (bar) this.resize?.observe(bar);
    });
    // Web fonts change the chips' widths without resizing the bar
    void document.fonts?.ready.then(() => this.isConnected && this.measure());
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.resize?.disconnect();
    this.resize = null;
    clearTimeout(this.flashTimer);
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const before = changed.get("terms") as SessionTerm[] | undefined;
    if (changed.has("terms") && before && before !== this.terms) this.noticeChanges(before);
    if (this.visibleCount >= this.terms.length && this.pop.open) this.pop.close("anchor-gone");
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    this.setAttribute("aria-label", this.label);
    this.style.setProperty("--tc-session-context-bar-top", `${this.stickyTop}px`);
    this.toggleAttribute("data-sticky", this.sticky);
    if (changed.has("terms") || changed.has("maxVisible") || changed.has("locked") || changed.has("editable") || changed.has("look") || changed.has("contextLook")) this.measure();
  }

  /* ---------- What changed ---------- */

  private noticeChanges(before: SessionTerm[]) {
    const old = new Map(before.map((t) => [t.id, t]));
    const changes: SessionTermChange[] = [];
    for (const t of this.terms) {
      const was = old.get(t.id);
      if (!was || !same(was, t)) changes.push({ term: t, previous: was ?? null });
    }
    const now = new Set(this.terms.map((t) => t.id));
    const gone = before.filter((t) => !now.has(t.id));
    if (!changes.length && !gone.length) return;
    this.said = [...changes.map(({ term }) => `${this.labelOf(term)}: ${term.value}`), ...gone.map((t) => `${this.labelOf(t)} removed`)].join(". ") + ".";
    this.emit<{ changes: SessionTermChange[] }>("tc-terms-changed", { changes });
    const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !changes.length) return;
    this.flashing = changes.map((c) => c.term.id);
    clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => (this.flashing = []), tokenMs(this, "--tc-duration-shimmer", 1600));
  }

  /* ---------- Fitting the chips ---------- */

  /** Works out how many chips fit on one line, with room for "+N more" when some don't */
  private measure = () => {
    const bar = this.querySelector<HTMLElement>(".ui-scxb__bar");
    const row = this.querySelector<HTMLElement>(".ui-scxb__chips");
    if (!bar || !row) return;
    const chips = [...row.querySelectorAll<HTMLElement>(":scope > .ui-scxb__chip")];
    const style = getComputedStyle(row);
    const gap = parseFloat(style.columnGap) || 0;
    const barStyle = getComputedStyle(bar);
    let avail = bar.clientWidth - (parseFloat(barStyle.paddingLeft) || 0) - (parseFloat(barStyle.paddingRight) || 0);
    const lock = this.querySelector<HTMLElement>(".ui-scxb__lock");
    if (lock) avail -= lock.offsetWidth + (parseFloat(barStyle.columnGap) || 0);
    const more = this.querySelector<HTMLElement>(".ui-scxb__more");
    const moreW = (more?.offsetWidth ?? 0) + (parseFloat(barStyle.columnGap) || 0);
    // Natural widths: chips that don't fit are shrunk by the row, so measure them with shrinking off for a moment
    row.toggleAttribute("data-measure", true);
    const widths = chips.map((c) => c.offsetWidth);
    row.removeAttribute("data-measure");
    const sum = (k: number) => widths.slice(0, k).reduce((a, w) => a + w, 0) + gap * Math.max(0, k - 1);
    let fit = widths.length;
    if (sum(fit) > avail + 0.5) {
      fit = 1;
      for (let k = widths.length - 1; k >= 1; k--)
        if (sum(k) + moreW <= avail + 0.5) {
          fit = k;
          break;
        }
    }
    if (fit !== this.fit) this.fit = fit;
  };

  /* ---------- The "+N more" list ---------- */

  private get popEl() {
    return this.querySelector<HTMLElement>(".ui-scxb__pop");
  }

  private get moreEl() {
    return this.querySelector<HTMLElement>(".ui-scxb__more");
  }

  /** Opens the list (`focus`: into it) or closes it – focus inside goes back to "+N more" */
  private setOpen(open: boolean, focus = false) {
    if (open) this.pop.show({ focus });
    else this.pop.close();
  }

  private onMoreKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.setOpen(true, true);
    }
  };

  private onPopKey = (e: KeyboardEvent) => {
    // Escape goes on to the popover, which closes the list and puts focus back on "+N more"
    if (e.key === "Escape") return;
    e.stopPropagation();
    const items = [...(this.popEl?.querySelectorAll<HTMLElement>(".ui-scxb__item-btn") ?? [])];
    const at = items.indexOf(e.target as HTMLElement);
    if (!items.length) return;
    const to =
      e.key === "ArrowDown" ? Math.min(items.length - 1, at + 1)
      : e.key === "ArrowUp" ? Math.max(0, at - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? items.length - 1
      : -1;
    if (to >= 0) {
      e.preventDefault();
      items[to].focus();
    }
  };

  private edit(t: SessionTerm, anchor: HTMLElement) {
    if (!this.isEditable(t)) return;
    this.emit<SessionTermEditDetail>("tc-term-edit", { term: t, anchor });
  }

  /* ---------- Parts ---------- */

  private meterTone(t: SessionTerm): SessionTermTone {
    if (t.tone) return t.tone;
    const m = t.meter ?? 0;
    return m >= this.meterDanger ? "danger" : m >= this.meterWarn ? "warning" : "neutral";
  }

  private meter(t: SessionTerm, inButton: boolean) {
    if (t.meter === undefined) return nothing;
    const pct = Math.round(Math.max(0, Math.min(1, t.meter)) * 100);
    const bar = html`<span class="ui-scxb__meter-fill" style=${styleMap({ width: `${pct}%` })}></span>`;
    return inButton
      ? html`<span class="ui-scxb__meter" data-tone=${this.meterTone(t)} aria-hidden="true">${bar}</span>`
      : html`<span class="ui-scxb__meter" data-tone=${this.meterTone(t)} .role=${"meter"} aria-label=${this.labelOf(t)} aria-valuemin="0" aria-valuemax="100" aria-valuenow=${pct} aria-valuetext=${t.value}>${bar}</span>`;
  }

  private body(t: SessionTerm, inButton: boolean): TemplateResult {
    const tone = t.meter !== undefined ? this.meterTone(t) : (t.tone ?? "neutral");
    return html`<span class="ui-scxb__label">${this.labelOf(t)}</span><span class="ui-scxb__sr">: </span>${tone !== "neutral" && t.meter === undefined
        ? html`<span class="ui-scxb__dot" data-tone=${tone} aria-hidden="true"></span>`
        : nothing}<span class="ui-scxb__value">${t.value}</span>${this.meter(t, inButton)}`;
  }

  private chip(t: SessionTerm, i: number, look: Look) {
    const off = i >= this.visibleCount;
    const flash = this.flashing.includes(t.id);
    if (this.isEditable(t))
      return html`<button
        type="button"
        class="ui-scxb__chip"
        data-id=${t.id}
        data-tone=${ifDefined(t.tone)}
        ?data-off=${off}
        ?data-flash=${flash}
        aria-hidden=${ifDefined(off ? "true" : undefined)}
        title=${t.description ?? `${this.labelOf(t)}: ${t.value}`}
        @click=${(e: Event) => this.edit(t, e.currentTarget as HTMLElement)}
      >${this.body(t, true)}<span class="ui-scxb__sr">, change</span>${editIcon(look)}</button>`;
    return html`<span class="ui-scxb__chip" data-id=${t.id} data-tone=${ifDefined(t.tone)} ?data-off=${off} ?data-flash=${flash} aria-hidden=${ifDefined(off ? "true" : undefined)} title=${t.description ?? `${this.labelOf(t)}: ${t.value}`}
      >${this.body(t, false)}</span
    >`;
  }

  private more(look: Look) {
    const hidden = this.terms.slice(this.visibleCount);
    const n = hidden.length;
    const popId = `${this.uid}-more`;
    const flash = hidden.some((t) => this.flashing.includes(t.id));
    return html`<div class="ui-scxb__more-wrap">
      <button
        type="button"
        class="ui-scxb__more"
        ?data-off=${!n}
        ?data-flash=${flash}
        aria-hidden=${ifDefined(n ? undefined : "true")}
        aria-expanded=${this.pop.open ? "true" : "false"}
        aria-controls=${popId}
        aria-label=${`${n} more ${n === 1 ? "term" : "terms"}`}
        @click=${(e: MouseEvent) => this.setOpen(!this.pop.open, e.detail === 0)}
        @keydown=${this.onMoreKey}
      >+${n} more</button>
      <div class="tc-pop ui-scxb__pop" id=${popId} role="group" aria-label="More session terms" ?hidden=${!this.pop.open || !n} @keydown=${this.onPopKey}>
        <ul class="ui-scxb__pop-list" tabindex=${hidden.some((t) => this.isEditable(t)) ? -1 : 0}>
          ${repeat(
            hidden,
            (t) => t.id,
            (t) => {
              const inner = html`<span class="ui-scxb__item-top">${this.body(t, this.isEditable(t))}</span>${t.description ? html`<span class="ui-scxb__item-desc">${t.description}</span>` : nothing}`;
              return html`<li class="ui-scxb__item" data-id=${t.id} ?data-flash=${this.flashing.includes(t.id)}>
                ${this.isEditable(t)
                  ? html`<button type="button" class="ui-scxb__item-btn" @click=${(e: Event) => this.edit(t, e.currentTarget as HTMLElement)}>${inner}<span class="ui-scxb__sr">, change</span>${editIcon(look)}</button>`
                  : html`<div class="ui-scxb__item-static">${inner}</div>`}
              </li>`;
            },
          )}
        </ul>
      </div>
    </div>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const controls = this.terms.some((t) => this.isEditable(t)) || this.visibleCount < this.terms.length;
    return html`
      <div
        class="ui-scxb__bar"
        role=${controls ? "toolbar" : "group"}
        aria-label=${this.label}
        @keydown=${this.tools.onKeyDown}
        @focusin=${this.tools.onFocusIn}
      >
        ${this.locked ? html`<span class="ui-scxb__lock" title="Fixed for this session">${lockIcon(look)}<span class="ui-scxb__sr">Fixed for this session</span></span>` : nothing}
        <div class="ui-scxb__chips">${repeat(this.terms, (t) => t.id, (t, i) => this.chip(t, i, look))}</div>
        ${this.terms.length ? this.more(look) : html`<span class="ui-scxb__empty">No terms declared for this session</span>`}
      </div>
      <span class="ui-scxb__sr" role="status">${this.said}</span>
    `;
  }

  static override css = /* css */ `
[data-ui="scxb"] {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-snug);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="scxb"][data-sticky] { position: sticky; top: var(--tc-session-context-bar-top, 0px); z-index: var(--tc-z-sticky); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="scxb"] { background: var(--tc-surface-tray); box-shadow: inset 0 calc(var(--tc-hairline) * -1) 0 var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="scxb"] { background: var(--tc-surface-raised); box-shadow: inset 0 calc(var(--tc-hairline) * -1) 0 var(--tc-divider); font-weight: var(--tc-font-weight-regular); }
[data-ui="scxb"] *, [data-ui="scxb"] *::before, [data-ui="scxb"] *::after { box-sizing: border-box; }
:where([data-ui="scxb"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="scxb"]) :is(ul, li) { margin: 0; padding: 0; list-style: none; }
[data-ui="scxb"] :is(button, [tabindex="0"]):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="scxb"] svg { display: block; flex: none; }
.ui-scxb__icon { fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
.ui-scxb__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
[data-ui="scxb"] [data-tone="info"] { --tc-session-context-bar-tone: var(--tc-status-info-fg); }
[data-ui="scxb"] [data-tone="success"] { --tc-session-context-bar-tone: var(--tc-status-success-fg); }
[data-ui="scxb"] [data-tone="warning"] { --tc-session-context-bar-tone: var(--tc-status-warning-fg); }
[data-ui="scxb"] [data-tone="danger"] { --tc-session-context-bar-tone: var(--tc-status-danger-fg); }
[data-ui="scxb"] [data-tone="neutral"] { --tc-session-context-bar-tone: var(--tc-text-muted); }

/* ----- The strip: one line of chips, then "+N more" ----- */
.ui-scxb__bar { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; min-height: 44px; padding: var(--tc-space-2) var(--tc-space-2-5); }
.ui-scxb__lock { display: grid; flex: none; place-items: center; color: var(--tc-text-muted); }
.ui-scxb__chips { position: relative; display: flex; flex: 0 1 auto; align-items: center; gap: var(--tc-space-1-5); min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *) .ui-scxb__chips { gap: 0; }
.ui-scxb__chip { position: relative; display: inline-flex; flex: 0 1 auto; align-items: center; gap: var(--tc-space-1-5); min-width: 0; max-width: 16rem; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-scxb__chips[data-measure] > .ui-scxb__chip { flex-shrink: 0; }
.ui-scxb__chip[data-off] { position: absolute; top: 0; left: 0; visibility: hidden; pointer-events: none; }
:where([data-look="standard"], [data-look="standard"] *) .ui-scxb__chip { background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="standard"], [data-look="standard"] *) button.ui-scxb__chip:hover { box-shadow: var(--tc-card-shadow-hover); }
/* Clean: plain text between hairlines */
:where([data-look="clean"], [data-look="clean"] *) .ui-scxb__chip { padding: 0 var(--tc-space-2-5); border-radius: var(--tc-radius-md); }
:where([data-look="clean"], [data-look="clean"] *) .ui-scxb__chip:not([data-off]) + .ui-scxb__chip:not([data-off])::before { content: ""; position: absolute; top: 25%; bottom: 25%; left: 0; width: var(--tc-hairline); background: var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *) button.ui-scxb__chip:hover { background: var(--tc-fill-subtle); }
.ui-scxb__label { flex: none; color: var(--tc-caption-color); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); }
:where([data-look="clean"], [data-look="clean"] *) .ui-scxb__label { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-regular); letter-spacing: normal; text-transform: none; }
.ui-scxb__value { min-width: 0; overflow: hidden; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *) .ui-scxb__value { font-weight: var(--tc-font-weight-regular); }
.ui-scxb__dot { flex: none; width: 6px; height: 6px; border-radius: 50%; background: var(--tc-session-context-bar-tone); }
.ui-scxb__meter { position: relative; flex: none; width: 32px; height: 4px; overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-fill-strong); }
.ui-scxb__meter-fill { position: absolute; inset: 0 auto 0 0; border-radius: inherit; background: var(--tc-session-context-bar-tone); transition: width var(--tc-duration-slow) var(--tc-ease-move); }
.ui-scxb__meter[data-tone="neutral"] { --tc-session-context-bar-tone: var(--tc-text-secondary); }
.ui-scxb__edit { color: var(--tc-text-muted); }
/* A changed term flashes once */
[data-ui="scxb"] [data-flash] { animation: ui-scxb-flash var(--tc-duration-shimmer) var(--tc-ease-standard); }
@keyframes ui-scxb-flash { 0%, 30% { background-color: var(--tc-accent-highlight); box-shadow: 0 0 0 1px var(--tc-accent); } }
.ui-scxb__empty { color: var(--tc-text-muted); }

/* ----- "+N more" and its list ----- */
.ui-scxb__more-wrap { position: relative; flex: none; }
.ui-scxb__more { display: inline-flex; align-items: center; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-scxb__more:hover, .ui-scxb__more[aria-expanded="true"] { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-scxb__more[data-off] { position: absolute; visibility: hidden; pointer-events: none; }
.tc-pop.ui-scxb__pop { width: max-content; min-width: 220px; max-width: min(340px, calc(100vw - 2 * var(--tc-space-4))); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-scxb__pop[hidden] { display: none; }
.ui-scxb__pop-list { display: grid; gap: var(--tc-space-0-5); max-height: 320px; overflow-y: auto; border-radius: var(--tc-menu-item-radius); }
.ui-scxb__item { border-radius: var(--tc-menu-item-radius); }
.ui-scxb__item-btn, .ui-scxb__item-static { position: relative; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: var(--tc-space-0-5) var(--tc-space-2); width: 100%; min-height: var(--tc-menu-item-h); padding: var(--tc-space-1-5) var(--tc-menu-item-px); border-radius: var(--tc-menu-item-radius); }
.ui-scxb__item-btn:hover { background: var(--tc-menu-item-hover); }
.ui-scxb__item-top { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-1-5); min-width: 0; }
.ui-scxb__item .ui-scxb__label { flex: 0 0 100%; }
.ui-scxb__item .ui-scxb__value { white-space: normal; overflow-wrap: anywhere; }
.ui-scxb__item-desc { grid-column: 1; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); }
.ui-scxb__item-btn > .ui-scxb__edit { grid-column: 2; grid-row: 1; transform: rotate(-90deg); }
@media (pointer: coarse) {
  .ui-scxb__chip, .ui-scxb__more { height: 36px; }
}
@media (forced-colors: active) {
  .ui-scxb__chip { border: 1px solid CanvasText; }
  .ui-scxb__meter { forced-color-adjust: none; background: Canvas; box-shadow: inset 0 0 0 1px CanvasText; }
  .ui-scxb__meter-fill, .ui-scxb__dot { forced-color-adjust: none; background: CanvasText; }
  [data-ui="scxb"] [data-flash] { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="scxb"] *, [data-ui="scxb"] *::before, [data-ui="scxb"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-session-context-bar")) customElements.define("tc-session-context-bar", TcSessionContextBar);

declare global {
  interface HTMLElementTagNameMap {
    "tc-session-context-bar": TcSessionContextBar;
  }
}
