import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";
import type { Look } from "./internal/look";

/*
 * <tc-prompt-starters> – where to begin, and what to ask next. In an empty chat it offers starters, grouped
 * (“Analyse”, “Write”…) with icons; after an answer it offers follow-ups. Each suggestion either sends at once or
 * fills the composer for editing first, and fires tc-send or tc-fill with its text – the app passes it to its
 * composer (tc-chat-composer's value, or its own field). The suggestions are data: personalise them from the
 * conversation's context in your app and pass them in; `loading` shows placeholders while they're worked out.
 *
 *   <tc-prompt-starters heading="Start with" .groups=${groups}></tc-prompt-starters>
 *   <tc-prompt-starters variant="follow-ups" heading="Ask next" .items=${followUps}></tc-prompt-starters>
 *
 * The list is the WAI-ARIA listbox: one tab stop, ↑ ↓ Home End move, Enter uses the suggestion the way it's set to,
 * → fills the composer instead (edit first), and typing a letter jumps to the next suggestion that starts with it.
 * Standard sets the list on a white card in a gray tray, with the key hints on the tray; Clean is one white card.
 * Follow-ups are compact rows with a turn-arrow; starters have tinted icon tiles and a hint.
 */

/** Built-in icons, by name */
export type PromptStarterIconName = "sparkle" | "chart" | "document" | "search" | "write" | "code" | "list" | "question" | "lightbulb" | "calendar";
/** A tone for a group's icon tiles */
export type PromptStarterTone = "blue" | "violet" | "pink" | "amber" | "teal" | "green" | "gray";
/** What choosing a suggestion does: send it as it is, or put it in the composer to edit first */
export type PromptStarterMode = "send" | "fill";

export type PromptStarter = {
  id: string;
  /** What's sent, or put in the composer */
  text: string;
  /** What the row shows, when shorter than the text – defaults to the text */
  label?: string;
  /** A lighter line after the label, e.g. where the suggestion comes from: “From your last report” */
  hint?: string;
  /** A built-in icon's name or an Element (cloned) – defaults to the group's */
  icon?: PromptStarterIconName | Element;
  /** Overrides the list's `mode` for this suggestion – "fill" for prompts with a blank to complete */
  mode?: PromptStarterMode;
};

export type PromptStarterGroup = {
  id: string;
  /** The group's heading, e.g. “Analyse” */
  label: string;
  /** The icon its suggestions show unless they have their own */
  icon?: PromptStarterIconName | Element;
  /** The tint of its icon tiles */
  tone?: PromptStarterTone;
  items: PromptStarter[];
};

/** tc-send and tc-fill */
export type PromptStarterPick = { text: string; item: PromptStarter; group: string | null };

/* ---------- Icons ---------- */

/* After Lucide (ISC, lucide.dev): sparkles, chart-line, file-text, search, pen-line, code, list, circle-help,
   lightbulb, calendar, corner-down-right */
const ICONS: Record<PromptStarterIconName, TemplateResult> = {
  sparkle: svg`<path d="M8 1.75c.35 2.7 1.55 3.9 4.25 4.25C9.55 6.35 8.35 7.55 8 10.25 7.65 7.55 6.45 6.35 3.75 6 6.45 5.65 7.65 4.45 8 1.75Z"></path><path d="M12.5 10.5v3M11 12h3"></path>`,
  chart: svg`<path d="M2.5 2.5v11h11"></path><path d="m5 10 2.5-3 2 2 3.5-4.5"></path>`,
  document: svg`<path d="M9.5 1.75H4.25a1 1 0 0 0-1 1v10.5a1 1 0 0 0 1 1h7.5a1 1 0 0 0 1-1V5Z"></path><path d="M9.25 1.75V5.25h3.5M5.75 8.5h4.5M5.75 11h3"></path>`,
  search: svg`<circle cx="7" cy="7" r="4.5"></circle><path d="m13.5 13.5-3.1-3.1"></path>`,
  write: svg`<path d="M8 13.5h5.5"></path><path d="M10.6 2.6a1.4 1.4 0 0 1 2 2L5.5 11.7l-2.75.65.65-2.75Z"></path>`,
  code: svg`<path d="m5.5 4.5-3.5 3.5 3.5 3.5M10.5 4.5l3.5 3.5-3.5 3.5"></path>`,
  list: svg`<path d="M6 4h7.5M6 8h7.5M6 12h7.5M2.75 4h.01M2.75 8h.01M2.75 12h.01"></path>`,
  question: svg`<circle cx="8" cy="8" r="6.25"></circle><path d="M6.2 6.1a1.9 1.9 0 0 1 3.65.65c0 1.25-1.85 1.85-1.85 1.85M8 11.25h.01"></path>`,
  lightbulb: svg`<path d="M10.25 9.75c.15-.7.5-1.2 1.05-1.75A3.75 3.75 0 1 0 4.7 8c.55.55.9 1.05 1.05 1.75M6 12h4M6.75 14.25h2.5"></path>`,
  calendar: svg`<rect x="2.25" y="3" width="11.5" height="10.75" rx="1.5"></rect><path d="M5.25 1.75v2.5M10.75 1.75v2.5M2.25 6.5h11.5"></path>`,
};
const followIcon = svg`<path d="M3.5 2.75v4.5a2 2 0 0 0 2 2h7"></path><path d="m10 6.25 3 3-3 3"></path>`;
/* After Lucide: lightbulb, for the header */
const headIcon = svg`<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path><path d="M9 18h6M10 22h4"></path>`;
const glyph = (body: TemplateResult, look: Look) => html`<svg class="ui-pst__glyph" viewBox="0 0 16 16" aria-hidden="true" stroke-width=${look === "clean" ? 1.2 : 1.5}>${body}</svg>`;

type Row = { key: string; item: PromptStarter; group: PromptStarterGroup | null; index: number };

const TYPEAHEAD_MS = 500;
let instances = 0;

/**
 * Suggestions for an empty chat and follow-ups after an answer, as a list that fills the composer or sends.
 * @tag tc-prompt-starters
 * @fires tc-send - A suggestion was chosen to send as it is ({ text, item, group })
 * @fires tc-fill - A suggestion was chosen to put in the composer and edit first ({ text, item, group })
 */
export class TcPromptStarters extends TcElement {
  static override ui = "pst";

  /** The heading above the list, and the list's accessible name */
  @property() accessor heading = "Suggestions";
  /** "starters" for an empty chat (icon tiles and hints), or "follow-ups" after an answer (compact rows) */
  @property({ reflect: true }) accessor variant: "starters" | "follow-ups" = "starters";
  /** Suggestions in groups, each with a heading and an icon */
  @property({ attribute: false }) accessor groups: PromptStarterGroup[] = [];
  /** Suggestions without groups – shown after any groups */
  @property({ attribute: false }) accessor items: PromptStarter[] = [];
  /** What choosing a suggestion does unless it says otherwise: "send" it, or "fill" the composer to edit first */
  @property() accessor mode: PromptStarterMode = "send";
  /** The suggestions are being worked out: placeholder rows instead of the list */
  @property({ type: Boolean, reflect: true }) accessor loading = false;
  /** Show the key hints under the list (↵ and →) */
  @property({ type: Boolean }) accessor hints = true;
  /** The word for sending in the key hint and the screen-reader text */
  @property({ attribute: "send-label" }) accessor sendLabel = "Ask";
  /** The word for filling the composer in the key hint and the screen-reader text */
  @property({ attribute: "fill-label" }) accessor fillLabel = "Edit first";
  /** Text when there are no suggestions (and not loading); empty hides the element's list entirely */
  @property({ attribute: "empty-text" }) accessor emptyText = "";

  /** @internal The suggestion with the tab stop */
  @state() accessor active = "";

  private readonly uid = `tc-pst${++instances}`;
  private rows: Row[] = [];
  private typed = "";
  private typedTimer = 0;

  constructor() {
    super();
    new FocusRescueController(this, () => this.querySelector<HTMLElement>('.ui-pst__option[tabindex="0"]'));
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.clearTimeout(this.typedTimer);
    this.typedTimer = 0;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const rows: Row[] = [];
    for (const g of this.groups) for (const item of g.items) rows.push({ key: `${g.id}\u0000${item.id}`, item, group: g, index: rows.length });
    for (const item of this.items) rows.push({ key: `\u0000${item.id}`, item, group: null, index: rows.length });
    this.rows = rows;
    if (!rows.some((r) => r.key === this.active)) this.active = rows[0]?.key ?? "";
  }

  protected override updated() {
    // Nothing to suggest and nothing to say: the element takes no room
    this.toggleAttribute("data-empty", !this.loading && !this.rows.length && !this.emptyText);
  }

  /* ---------- Choosing ---------- */

  private modeOf(item: PromptStarter) {
    return item.mode ?? this.mode;
  }

  private choose(r: Row, mode: PromptStarterMode) {
    this.active = r.key;
    this.emit<PromptStarterPick>(mode === "send" ? "tc-send" : "tc-fill", { text: r.item.text, item: r.item, group: r.group?.id ?? null });
  }

  /* ---------- Keyboard (WAI-ARIA listbox) ---------- */

  private focusRow(r: Row | undefined) {
    if (!r) return;
    this.active = r.key;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`#${this.uid}-o${r.index}`)?.focus());
  }

  private onKey(e: KeyboardEvent, r: Row) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const rows = this.rows;
    const i = r.index;
    let handled = true;
    if (e.key === "ArrowDown") this.focusRow(rows[i + 1]);
    else if (e.key === "ArrowUp") this.focusRow(rows[i - 1]);
    else if (e.key === "Home") this.focusRow(rows[0]);
    else if (e.key === "End") this.focusRow(rows[rows.length - 1]);
    else if (e.key === "Enter" || e.key === " ") this.choose(r, this.modeOf(r.item));
    else if (e.key === "ArrowRight") this.choose(r, "fill");
    else if (e.key.length === 1 && /\S/.test(e.key)) {
      // Type-ahead: letters typed in quick succession find the next suggestion that starts with them
      window.clearTimeout(this.typedTimer);
      this.typed += e.key.toLowerCase();
      this.typedTimer = window.setTimeout(() => (this.typed = ""), TYPEAHEAD_MS);
      const order = [...rows.slice(i + (this.typed.length === 1 ? 1 : 0)), ...rows.slice(0, i + 1)];
      const hit = order.find((x) => (x.item.label ?? x.item.text).toLowerCase().startsWith(this.typed));
      if (hit) this.focusRow(hit);
    } else handled = false;
    if (handled) e.preventDefault();
  }

  /* ---------- Render ---------- */

  private iconOf(r: Row, look: Look) {
    if (this.variant === "follow-ups" && !r.item.icon) return glyph(followIcon, look);
    const icon = r.item.icon ?? r.group?.icon ?? "sparkle";
    if (typeof icon === "string") return glyph(ICONS[icon as PromptStarterIconName] ?? ICONS.sparkle, look);
    return icon.cloneNode(true);
  }

  private option(r: Row, look: Look) {
    const it = r.item;
    const label = it.label ?? it.text;
    const mode = this.modeOf(it);
    const on = r.key === this.active;
    const starters = this.variant === "starters";
    return html`<div
      class="ui-pst__option"
      role="option"
      id=${`${this.uid}-o${r.index}`}
      data-key=${r.key}
      data-focus-key=${`opt:${r.key}`}
      data-mode=${mode}
      aria-selected=${on ? "true" : "false"}
      tabindex=${on ? "0" : "-1"}
      style=${styleMap({ "--i": String(r.index) })}
      @focus=${() => (this.active = r.key)}
      @click=${(e: MouseEvent) => this.choose(r, (e.target as Element).closest(".ui-pst__fill") ? "fill" : mode)}
      @keydown=${(e: KeyboardEvent) => this.onKey(e, r)}
    >
      <span class="ui-pst__icon" data-tone=${ifDefined(starters ? (r.group?.tone ?? "gray") : undefined)}>${this.iconOf(r, look)}</span>
      <span class="ui-pst__text">
        <span class="ui-pst__label">${label}</span>
        ${starters && it.hint ? html`<span class="ui-pst__hint">${it.hint}</span>` : nothing}
        <span class="ui-pst__sr">, ${mode === "send" ? this.sendLabel : this.fillLabel}</span>
      </span>
      ${mode === "send"
        ? html`<span class="ui-pst__fill" title=${this.fillLabel} aria-hidden="true">${glyph(ICONS.write, look)}</span>`
        : html`<span class="ui-pst__go" aria-hidden="true">${glyph(svg`<path d="M3 8h10M9 4l4 4-4 4"></path>`, look)}</span>`}
    </div>`;
  }

  private foot() {
    const r = this.rows.find((x) => x.key === this.active);
    const mode = r ? this.modeOf(r.item) : this.mode;
    return html`<div class="ui-pst__foot" aria-hidden="true">
      <span class="ui-pst__keys"><kbd>↑</kbd><kbd>↓</kbd><span>to move</span></span>
      <span class="ui-pst__keys"><kbd>↵</kbd><span>${mode === "send" ? this.sendLabel : this.fillLabel}</span>${mode === "send" ? html`<kbd>→</kbd><span>${this.fillLabel}</span>` : nothing}</span>
    </div>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const headId = `${this.uid}-h`;
    // The header (.tc-head): on the tray in Standard, the card's first row in Clean
    const head = cardHead({ icon: headIcon, title: this.heading, id: headId });
    let body: TemplateResult;
    if (this.loading)
      body = html`<div class="ui-pst__list" role="listbox" aria-labelledby=${headId} aria-busy="true">
        ${[0, 1, 2].map((i) => html`<div class="ui-pst__skeleton" style=${styleMap({ "--i": String(i) })} aria-hidden="true"><span></span><span></span></div>`)}
      </div>`;
    else if (!this.rows.length) {
      if (!this.emptyText) return html`${nothing}`;
      body = html`<p class="ui-pst__empty">${this.emptyText}</p>`;
    } else {
      const loose = this.rows.filter((r) => !r.group);
      body = html`<div class="ui-pst__list" role="listbox" aria-labelledby=${headId} aria-orientation="vertical">
        ${this.groups
          .filter((g) => g.items.length)
          .map((g, gi) => {
            const gid = `${this.uid}-g${gi}`;
            return html`<div class="ui-pst__group" role="group" aria-labelledby=${gid}>
              <span class="ui-pst__group-label" id=${gid}>${g.label}</span>
              ${this.rows.filter((r) => r.group === g).map((r) => this.option(r, look))}
            </div>`;
          })}
        ${loose.map((r) => this.option(r, look))}
      </div>`;
    }
    const foot = this.hints && this.rows.length && !this.loading ? this.foot() : nothing;
    if (look === "clean") return html`<div class="ui-pst__card">${head}${body}${foot}</div>`;
    return html`${head}<div class="ui-pst__card">${body}</div>${foot}`;
  }

  static override css = /* css */ `
[data-ui="pst"] {
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  min-width: 0;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="pst"] *, [data-ui="pst"] *::before, [data-ui="pst"] *::after { box-sizing: border-box; }
[data-ui="pst"][data-empty] { display: none; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pst"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-ui="pst"]) svg { display: block; flex: none; }
.ui-pst__card { min-width: 0; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-pst__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-pst__card { border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
/* The list */
.ui-pst__list { display: grid; padding: var(--tc-menu-padding); }
.ui-pst__group { display: grid; }
.ui-pst__group + .ui-pst__group, .ui-pst__group + .ui-pst__option { margin-top: var(--tc-space-1-5); }
.ui-pst__group-label {
  padding: var(--tc-space-2) var(--tc-menu-item-px) var(--tc-space-1);
  font-size: var(--tc-caption-font-size);
  font-weight: var(--tc-caption-font-weight);
  line-height: var(--tc-caption-line-height);
  letter-spacing: var(--tc-caption-tracking);
  text-transform: var(--tc-caption-transform);
  color: var(--tc-caption-color);
}
.ui-pst__group:first-child .ui-pst__group-label { padding-top: var(--tc-space-1); }
.ui-pst__option {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  min-height: var(--tc-menu-item-h);
  padding: var(--tc-space-1-5) var(--tc-menu-item-px);
  border-radius: var(--tc-menu-item-radius);
  font-size: var(--tc-menu-item-font-size);
  cursor: pointer;
  user-select: none;
  outline: none;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
  animation: ui-pst-in var(--tc-duration-slow) var(--tc-ease-move) both;
  animation-delay: calc(var(--i, 0) * var(--tc-duration-instant) / 2);
  -webkit-tap-highlight-color: transparent;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pst__option { gap: var(--tc-space-2); }
.ui-pst__option:hover { background: var(--tc-menu-item-hover); }
.ui-pst__option:focus-visible { background: var(--tc-menu-item-hover); box-shadow: 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
/* Icons: tinted tiles for starters, a plain turn-arrow for follow-ups */
.ui-pst__icon { display: grid; flex: none; place-items: center; color: var(--tc-icon-muted); }
.ui-pst__icon > svg { width: 16px; height: 16px; }
.ui-pst__glyph { fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
[data-ui="pst"][variant="starters"] .ui-pst__icon { width: var(--tc-avatar-md); height: var(--tc-avatar-md); border-radius: var(--tc-radius-md); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="pst"][variant="starters"] .ui-pst__icon { border-radius: var(--tc-radius-badge); }
.ui-pst__icon[data-tone="blue"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-pst__icon[data-tone="green"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-pst__icon[data-tone="violet"] { background: var(--tc-tone-violet-bg); color: var(--tc-tone-violet-fg); }
.ui-pst__icon[data-tone="pink"] { background: var(--tc-tone-pink-bg); color: var(--tc-tone-pink-fg); }
.ui-pst__icon[data-tone="amber"] { background: var(--tc-tone-amber-bg); color: var(--tc-tone-amber-fg); }
.ui-pst__icon[data-tone="teal"] { background: var(--tc-tone-teal-bg); color: var(--tc-tone-teal-fg); }
.ui-pst__icon[data-tone="gray"] { background: var(--tc-fill-default); color: var(--tc-text-secondary); }
.ui-pst__text { display: flex; flex: 1; flex-direction: column; min-width: 0; }
.ui-pst__label { color: var(--tc-text-primary); overflow-wrap: anywhere; }
[data-ui="pst"][variant="follow-ups"] .ui-pst__label { color: var(--tc-text-secondary); }
[data-ui="pst"][variant="follow-ups"] .ui-pst__option:is(:hover, [aria-selected="true"]:focus-visible) .ui-pst__label { color: var(--tc-text-primary); }
.ui-pst__hint { overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); white-space: nowrap; text-overflow: ellipsis; }
/* Edit first (a send suggestion) or the arrow (a fill suggestion), shown on the active row */
.ui-pst__fill, .ui-pst__go { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); opacity: 0; transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-pst__fill > svg, .ui-pst__go > svg { width: 14px; height: 14px; }
.ui-pst__option:is(:hover, :focus-visible) :is(.ui-pst__fill, .ui-pst__go) { opacity: 1; }
.ui-pst__fill:hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
/* Placeholders while the suggestions are worked out */
.ui-pst__skeleton { display: flex; align-items: center; gap: var(--tc-space-2-5); min-height: var(--tc-menu-item-h); padding: var(--tc-space-1-5) var(--tc-menu-item-px); }
.ui-pst__skeleton > span { border-radius: var(--tc-radius-full); background: var(--tc-fill-default); animation: ui-pst-pulse var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; animation-delay: calc(var(--i, 0) * var(--tc-duration-quick)); }
.ui-pst__skeleton > span:first-child { flex: none; width: var(--tc-avatar-md); height: var(--tc-avatar-md); border-radius: var(--tc-radius-md); }
.ui-pst__skeleton > span:last-child { width: 60%; height: 10px; }
[data-ui="pst"][variant="follow-ups"] .ui-pst__skeleton > span:first-child { width: 16px; height: 16px; }
.ui-pst__empty { margin: 0; padding: var(--tc-space-4); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); text-align: center; }
/* Key hints: on the tray in Standard, the card's last row in Clean */
.ui-pst__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-1) var(--tc-space-3); min-height: 32px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-pst__foot { padding: var(--tc-space-1) var(--tc-space-2-5) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-pst__foot { padding: var(--tc-space-1) var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-pst__keys { display: inline-flex; align-items: center; gap: var(--tc-space-1); white-space: nowrap; }
.ui-pst__keys > span { margin: 0 var(--tc-space-1-5) 0 var(--tc-space-0-5); }
.ui-pst__keys > span:last-child { margin-right: 0; }
[data-ui="pst"] kbd {
  display: inline-grid;
  place-items: center;
  min-width: var(--tc-kbd-h);
  height: var(--tc-kbd-h);
  padding: 0 var(--tc-kbd-px);
  border-radius: var(--tc-kbd-radius);
  background: var(--tc-kbd-bg);
  box-shadow: var(--tc-kbd-shadow);
  font-family: inherit;
  font-size: var(--tc-kbd-font-size);
  line-height: var(--tc-kbd-h);
  font-weight: var(--tc-kbd-font-weight);
  color: var(--tc-kbd-fg);
}
.ui-pst__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
@keyframes ui-pst-in { from { opacity: 0; transform: translateY(4px); } }
@keyframes ui-pst-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
/* Touch screens: no hover, so the edit button shows; no keyboard, so no key hints */
@media (hover: none) {
  .ui-pst__fill { opacity: 1; }
  .ui-pst__foot { display: none; }
}
@container (max-width: 300px) {
  .ui-pst__foot { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="pst"] *, [data-ui="pst"] *::before, [data-ui="pst"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-prompt-starters")) customElements.define("tc-prompt-starters", TcPromptStarters);

declare global {
  interface HTMLElementTagNameMap {
    "tc-prompt-starters": TcPromptStarters;
  }
}
