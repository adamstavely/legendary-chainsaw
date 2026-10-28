import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { initials } from "./internal/util";

/*
 * <tc-person-links> – the people linked to a person or an account: a row each with a picture or initials, the name,
 * their role ("Co-signer", "Manager"), an ID or second line, and how strong the link is – strong, medium, weak or
 * unknown, written out and drawn as bars, so colour is never the only cue. The header counts them and can offer a
 * "View network" action; past `max` rows, a "Show all" button reveals the rest.
 *   · the rows are a single-select listbox: ↑ / ↓ / Home / End move, Enter, Space or a click selects (or clears) a
 *     row, Escape clears it; selecting fires a cancelable tc-selected-change, for the page to open the person
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-person-links .people=${[{ id: "p1", name: "Dana Whitfield", role: "Co-signer", strength: "strong" }]}></tc-person-links>
 */

/** Two people linked: an arrow-free "users" mark – Lucide (ISC, lucide.dev) */
const usersIcon = svg`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>`;

export type LinkStrength = "strong" | "medium" | "weak" | "unknown";
export type LinkTone = "neutral" | "info" | "success" | "warning" | "danger";
export type LinkedPerson = {
  id: string;
  name: string;
  /** How they're linked, e.g. "Co-signer", "Manager", "Financier" */
  role?: string;
  /** A second line: an ID, a company, a place */
  detail?: string;
  /** How strong the link is; unset is "unknown" */
  strength?: LinkStrength;
  /** A picture URL; without one the row shows the name's initials */
  picture?: string;
  /** An extra pill for what matters most about the link, e.g. { label: "Key link", tone: "danger" } */
  tag?: { label: string; tone?: LinkTone };
};

/** Details of the events */
export type PersonLinksSelectedChange = { selected: string | null; person?: LinkedPerson };
export type PersonLinksAction = { id: "network" };

/** The strengths' names used when the page gives none */
export const defaultLinkStrengthLabels: Record<LinkStrength, string> = { strong: "Strong", medium: "Medium", weak: "Weak", unknown: "Unknown" };
const BARS: Record<LinkStrength, number> = { strong: 3, medium: 2, weak: 1, unknown: 0 };

/** A name's avatar colour: one of the tone families, the same for the same name */
const HUES = ["teal", "violet", "amber", "pink", "rose"];
const hue = (name: string) => HUES[[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % HUES.length];
let uidCount = 0;

/**
 * The people linked to a person or an account, each with their role, a second line and how strong the link is,
 * selectable to open them.
 * @tag tc-person-links
 * @fires tc-selected-change - A row was selected or cleared ({ selected, person }: PersonLinksSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-action - The header's network action was used ({ id: "network" }: PersonLinksAction)
 */
export class TcPersonLinks extends TcElement {
  static override ui = "plk";

  /** The heading, and the list's name */
  @property() accessor heading = "Linked people";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The people, in the order given */
  @property({ attribute: false }) accessor people: LinkedPerson[] = [];
  /** The selected person's id. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property() accessor selected: string | null = null;
  /** How many rows show before "Show all"; unset shows everyone */
  @property({ type: Number }) accessor max: number | undefined = undefined;
  /** Shows everyone past `max`; the "Show all" button toggles it */
  @property({ type: Boolean, reflect: true }) accessor expanded = false;
  /** The header action's label, e.g. "View network"; unset hides it */
  @property({ attribute: "network-label" }) accessor networkLabel: string | undefined = undefined;
  /** What the count says after the number: "6 linked" */
  @property({ attribute: "count-label" }) accessor countLabel = "linked";
  /** The strengths' names, merged over the defaults (Strong, Medium, Weak, Unknown) */
  @property({ attribute: false }) accessor strengthLabels: Partial<Record<LinkStrength, string>> = {};

  /** The row holding the tab stop */
  @state() private accessor active: string | null = null;
  @state() private accessor announce = "";

  private uid = `tc-plk-${++uidCount}`;

  private get shown() {
    const cut = this.max !== undefined && this.max > 0 && !this.expanded ? Math.floor(this.max) : Infinity;
    return this.people.slice(0, cut);
  }
  private label(s: LinkStrength) {
    return this.strengthLabels[s] ?? defaultLinkStrengthLabels[s];
  }
  /** The tab stop: the active row, else the selected one, else the first */
  private get stop() {
    const ids = this.shown.map((p) => p.id);
    return [this.active, this.selected].find((id) => id && ids.includes(id)) ?? ids[0] ?? null;
  }

  private setSelected(next: string | null) {
    if (next === this.selected) return;
    const person = next === null ? undefined : this.people.find((p) => p.id === next);
    if (!this.emit<PersonLinksSelectedChange>("tc-selected-change", { selected: next, person }, { cancelable: true })) return;
    this.selected = next;
    this.announce = person ? `Selected ${person.name}` : "Selection cleared";
  }

  private focusRow(id: string) {
    this.active = id;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`)?.focus());
  }

  private onKey = (e: KeyboardEvent) => {
    const row = (e.target as Element).closest<HTMLElement>("[data-id]");
    if (!row || e.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;
    const ids = this.shown.map((p) => p.id);
    const at = ids.indexOf(row.dataset.id!);
    const last = ids.length - 1;
    const to = e.key === "ArrowDown" ? Math.min(last, at + 1) : e.key === "ArrowUp" ? Math.max(0, at - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : -1;
    if (to >= 0) {
      e.preventDefault();
      this.focusRow(ids[to]);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.setSelected(this.selected === ids[at] ? null : ids[at]);
    } else if (e.key === "Escape" && this.selected !== null) {
      e.preventDefault();
      this.setSelected(null);
    }
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const ids = this.people.map((p) => p.id);
    if (this.active !== null && !ids.includes(this.active)) this.active = null;
    // A selected person who went away clears
    if (this.selected !== null && !ids.includes(this.selected)) this.selected = null;
  }

  /* ---------- Rendering ---------- */

  private renderAvatar(p: LinkedPerson) {
    if (p.picture) return html`<span class="ui-plk__avatar" aria-hidden="true"><img src=${p.picture} alt="" /></span>`;
    return html`<span class="ui-plk__avatar" data-hue=${hue(p.name)} aria-hidden="true">${initials(p.name)}</span>`;
  }

  private renderRow(p: LinkedPerson) {
    const strength = p.strength ?? "unknown";
    const isSel = this.selected === p.id;
    const second = [p.role, p.detail].filter(Boolean).join(" · ");
    return html`<li
      class="ui-plk__row"
      role="option"
      data-id=${p.id}
      tabindex=${this.stop === p.id ? 0 : -1}
      aria-selected=${isSel ? "true" : "false"}
      @focus=${() => {
        if (this.active !== p.id) this.active = p.id;
      }}
      @click=${() => {
        this.active = p.id;
        this.setSelected(isSel ? null : p.id);
      }}
    >
      ${this.renderAvatar(p)}
      <span class="ui-plk__who">
        <span class="ui-plk__name">${p.name}</span>
        ${p.role ? html`<span class="ui-plk__line" aria-hidden="true"><span class="ui-plk__role">${p.role}</span>${p.detail ? html`<span class="ui-plk__detail">${p.detail}</span>` : nothing}</span>` : p.detail ? html`<span class="ui-plk__line" aria-hidden="true"><span class="ui-plk__detail">${p.detail}</span></span>` : nothing}
      </span>
      <span class="ui-plk__side" aria-hidden="true">
        ${p.tag ? html`<span class="ui-plk__tag" data-tone=${p.tag.tone ?? "neutral"}>${p.tag.label}</span>` : nothing}
        <span class="ui-plk__strength" data-strength=${strength}>
          <span class="ui-plk__bars" aria-hidden="true">${[1, 2, 3].map((n) => html`<span class="ui-plk__bar" ?data-on=${n <= BARS[strength]}></span>`)}</span>
          ${this.label(strength)}
        </span>
      </span>
      <span class="ui-plk__sr">${second ? `, ${second}` : ""}${p.tag ? `, ${p.tag.label}` : ""}, ${this.label(strength)} link</span>
    </li>`;
  }

  protected override render() {
    const id = this.uid;
    const all = this.people.length;
    const shown = this.shown;
    const hidden = all - shown.length;
    const canToggle = this.max !== undefined && this.max > 0 && all > Math.floor(this.max);
    return html`
      <span class="ui-plk__sr" role="status">${this.announce}</span>
      ${cardHead({
        icon: usersIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        aside: html`<span class="ui-plk__count">${all} ${this.countLabel}</span>${this.networkLabel
            ? html`<button type="button" class="ui-plk__network" @click=${() => this.emit<PersonLinksAction>("tc-action", { id: "network" })}>${this.networkLabel}</button>`
            : nothing}`,
      })}
      <div class="ui-plk__card">
        ${all
          ? html`<ul class="ui-plk__list" id=${`${id}-list`} role="listbox" aria-labelledby=${`${id}-title`} @keydown=${this.onKey}>
                ${repeat(shown, (p) => p.id, (p) => this.renderRow(p))}
              </ul>
              ${canToggle
                ? html`<button type="button" class="ui-plk__more" aria-controls=${`${id}-list`} aria-expanded=${this.expanded ? "true" : "false"} @click=${() => (this.expanded = !this.expanded)}>
                    ${this.expanded ? "Show fewer" : `Show all ${all}`}${hidden > 0 ? html`<span class="ui-plk__more-n">+${hidden}</span>` : nothing}
                  </button>`
                : nothing}`
          : html`<p class="ui-plk__empty">No linked people yet.</p>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="plk"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="plk"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="plk"] *, [data-ui="plk"] *::before, [data-ui="plk"] *::after { box-sizing: border-box; }
:where([data-ui="plk"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="plk"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="plk"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="plk"] p { margin: 0; }
.ui-plk__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-plk__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- The header's count and action ----- */
.ui-plk__count { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-plk__network { display: inline-flex; align-items: center; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-plk__network:hover { background: var(--tc-action-ghost-bg-hover); }
/* ----- Rows ----- */
.ui-plk__list { padding: var(--tc-space-1-5) !important; }
:where([data-look="clean"], [data-look="clean"] *).ui-plk__list { padding-top: 0 !important; }
.ui-plk__row { position: relative; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: var(--tc-space-3); padding: var(--tc-space-2) var(--tc-space-2-5); border-radius: var(--tc-radius-md); cursor: pointer; outline: none; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-plk__row + .ui-plk__row::before { content: ""; position: absolute; top: 0; left: calc(var(--tc-space-2-5) + 32px + var(--tc-space-3)); right: var(--tc-space-2-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-plk__row:hover { background: var(--tc-fill-subtle); }
.ui-plk__row[aria-selected="true"] { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-selected); }
.ui-plk__row:hover::before, .ui-plk__row:hover + .ui-plk__row::before, .ui-plk__row[aria-selected="true"]::before, .ui-plk__row[aria-selected="true"] + .ui-plk__row::before { opacity: 0; }
.ui-plk__row:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-plk__avatar { display: grid; place-items: center; width: 32px; height: 32px; overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-surface-sunken); color: var(--tc-text-secondary); font-size: var(--tc-avatar-font-size); font-weight: var(--tc-avatar-font-weight); line-height: var(--tc-line-height-none); }
.ui-plk__avatar > img { display: block; width: 100%; height: 100%; object-fit: cover; }
.ui-plk__avatar[data-hue="teal"] { background: var(--tc-tone-teal-bg); color: var(--tc-tone-teal-fg); }
.ui-plk__avatar[data-hue="violet"] { background: var(--tc-tone-violet-bg); color: var(--tc-tone-violet-fg); }
.ui-plk__avatar[data-hue="amber"] { background: var(--tc-tone-amber-bg); color: var(--tc-tone-amber-fg); }
.ui-plk__avatar[data-hue="pink"] { background: var(--tc-tone-pink-bg); color: var(--tc-tone-pink-fg); }
.ui-plk__avatar[data-hue="rose"] { background: var(--tc-tone-rose-bg); color: var(--tc-tone-rose-fg); }
.ui-plk__who { display: grid; min-width: 0; }
.ui-plk__name { overflow: hidden; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
.ui-plk__line { display: flex; min-width: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
/* On the selected fill, the second line steps up from muted to keep its contrast */
.ui-plk__row[aria-selected="true"] .ui-plk__line, .ui-plk__row[aria-selected="true"] .ui-plk__strength[data-strength="unknown"] { color: var(--tc-text-secondary); }
.ui-plk__role { flex: none; }
.ui-plk__detail { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-plk__role + .ui-plk__detail::before { content: "·"; margin: 0 var(--tc-space-1-5); }
.ui-plk__side { display: inline-flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-1-5); }
.ui-plk__tag, .ui-plk__strength { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-plk__tag { background: var(--tc-fill-default); color: var(--tc-text-secondary); }
.ui-plk__tag[data-tone="info"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-plk__tag[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-plk__tag[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-plk__tag[data-tone="danger"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* Strength: the word, and up to three bars – never colour alone */
.ui-plk__strength { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); color: var(--tc-text-secondary); }
.ui-plk__strength[data-strength="unknown"] { color: var(--tc-text-muted); }
.ui-plk__bars { display: inline-flex; align-items: flex-end; gap: var(--tc-space-0-5); height: 10px; }
.ui-plk__bar { display: block; width: 3px; border-radius: var(--tc-radius-2xs); background: var(--tc-fill-strong); }
.ui-plk__bar:nth-child(1) { height: 4px; }
.ui-plk__bar:nth-child(2) { height: 7px; }
.ui-plk__bar:nth-child(3) { height: 10px; }
.ui-plk__bar[data-on] { background: currentColor; }
.ui-plk__strength[data-strength="strong"] .ui-plk__bar[data-on] { background: var(--tc-accent); }
/* ----- Show all, empty ----- */
.ui-plk__more { display: flex; align-items: center; justify-content: center; gap: var(--tc-space-1-5); width: 100%; height: var(--tc-control-h-lg); border-top: var(--tc-hairline) solid var(--tc-divider) !important; color: var(--tc-action-ghost-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-plk__more:hover { background: var(--tc-action-ghost-bg-hover); }
[data-ui="plk"] .ui-plk__more:focus-visible { outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-plk__more-n { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-plk__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
/* Narrow: the strength drops under the name */
@container (max-width: 400px) {
  .ui-plk__row { grid-template-columns: auto minmax(0, 1fr); }
  .ui-plk__side { grid-column: 2; justify-content: flex-start; }
}
@media (forced-colors: active) {
  .ui-plk__tag, .ui-plk__strength { border: 1px solid CanvasText; }
  .ui-plk__bar { background: GrayText; }
  .ui-plk__bar[data-on] { background: CanvasText; }
  .ui-plk__row[aria-selected="true"] { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="plk"] *, [data-ui="plk"] *::before, [data-ui="plk"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-person-links")) customElements.define("tc-person-links", TcPersonLinks);

declare global {
  interface HTMLElementTagNameMap {
    "tc-person-links": TcPersonLinks;
  }
}
