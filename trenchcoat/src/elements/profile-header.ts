import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { initials } from "./internal/util";

/*
 * <tc-profile-header> – the top of a person's or an account's page: a picture or initials, the name, a status pill
 * and tags, the other names it goes by, a line of short facts, the page's actions at the right and, optionally, a row
 * of tabs for the sections below.
 *   · actions are data – { id, label, icon, variant } – and fire tc-action with the id; `more` adds an overflow
 *     button that fires tc-action "more", for the page to open its own menu
 *   · the tabs are WAI-ARIA tabs with manual activation: ← / → / Home / End move between them, Enter or Space (or a
 *     click) selects one; selecting fires a cancelable tc-selected-change, and the page shows the panel – give a
 *     tab `controls` (the panel's id) to link them
 *   · narrow, the actions drop under the name and the tabs scroll sideways
 * Standard: a white card on a gray tray. Clean: one white card.
 *
 *   <tc-profile-header name="Northwind Traders" .status=${{ label: "Under review", tone: "warning" }}
 *     .meta=${["Wholesale", "Rotterdam", "Customer since 2019"]} .actions=${[{ id: "flag", label: "Flag", variant: "primary" }]}>
 *   </tc-profile-header>
 */

export type ProfileTone = "neutral" | "info" | "success" | "warning" | "danger";
/** A pill: the status beside the name, or a tag after it */
export type ProfilePill = { label: string; tone?: ProfileTone };
/** A short fact on the meta line; `tone` puts a coloured dot before it */
export type ProfileMeta = string | { label: string; tone?: ProfileTone };
/** The built-in action icons; or pass an icon element of your own, which is cloned */
export type ProfileIconName = "flag" | "report" | "message" | "edit" | "share" | "star";
export type ProfileAction = {
  id: string;
  label: string;
  icon?: ProfileIconName | Element;
  /** "primary" for the page's main action (one at most), else "secondary" (the default) */
  variant?: "primary" | "secondary";
  disabled?: boolean;
};
export type ProfileTab = {
  id: string;
  label: string;
  /** A count after the label, e.g. how many items the section holds */
  count?: number;
  /** The id of the panel the tab shows, for aria-controls */
  controls?: string;
};

/** Details of the events */
export type ProfileActionEvent = { id: string };
export type ProfileSelectedChange = { selected: string };

let uidCount = 0;

/* Flag, file-text, message-circle, pencil, share, star and ellipsis: Lucide (ISC, lucide.dev) */
const ICONS: Record<ProfileIconName | "more", TemplateResult> = {
  flag: svg`<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.33 2q2 0 3.07-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.53"></path>`,
  report: svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path>`,
  message: svg`<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>`,
  edit: svg`<path d="M21.17 6.81a1 1 0 0 0-3.98-3.98L3.84 16.17a2 2 0 0 0-.5.83l-1.32 4.35a.5.5 0 0 0 .62.62l4.35-1.32a2 2 0 0 0 .83-.5z"></path>`,
  share: svg`<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><path d="m16 6-4-4-4 4"></path><path d="M12 2v13"></path>`,
  star: svg`<path d="M11.53 2.3a.53.53 0 0 1 .95 0l2.31 4.68a2.12 2.12 0 0 0 1.6 1.16l5.17.76a.53.53 0 0 1 .29.9l-3.74 3.64a2.12 2.12 0 0 0-.61 1.88l.88 5.14a.53.53 0 0 1-.77.56l-4.62-2.43a2.12 2.12 0 0 0-1.97 0L6.4 21.01a.53.53 0 0 1-.77-.56l.88-5.14a2.12 2.12 0 0 0-.61-1.88L2.16 9.8a.53.53 0 0 1 .29-.9l5.17-.76a2.12 2.12 0 0 0 1.6-1.16z"></path>`,
  more: svg`<circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle>`,
};
const glyph = (body: TemplateResult) =>
  html`<svg class="ui-phd__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

/** A name's avatar colour: one of the tone families, the same for the same name */
const HUES = ["teal", "violet", "amber", "pink", "rose"];
const hue = (name: string) => HUES[[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % HUES.length];

/**
 * The top of a person's or an account's page: picture, name, status and tags, other names, a line of facts, the
 * page's actions and an optional row of tabs.
 * @tag tc-profile-header
 * @fires tc-action - An action button, or the overflow button, was used ({ id }: ProfileActionEvent; "more" for the overflow button)
 * @fires tc-selected-change - A tab was chosen ({ selected }: ProfileSelectedChange); cancelable – prevented, `selected` stays as it was
 */
export class TcProfileHeader extends TcElement {
  static override ui = "phd";

  /** The person's or the account's name: the page's heading */
  @property() accessor name = "";
  /** The heading's level – 1 when the header tops the page, 2 (the default) inside a layout that has its own h1 */
  @property({ type: Number }) accessor level: 1 | 2 = 2;
  /** A picture URL; without one the avatar shows the name's initials */
  @property() accessor picture: string | undefined = undefined;
  /** "person" draws a round avatar, "account" (a company, a team, a workspace) a rounded square */
  @property() accessor kind: "person" | "account" = "person";
  /** The status beside the name, e.g. { label: "Under review", tone: "warning" } */
  @property({ attribute: false }) accessor status: ProfilePill | undefined = undefined;
  /** More pills after the status, e.g. a priority */
  @property({ attribute: false }) accessor tags: ProfilePill[] = [];
  /** Other names the person or account goes by, as chips */
  @property({ attribute: false }) accessor aliases: string[] = [];
  /** The label before the other names */
  @property({ attribute: "alias-label" }) accessor aliasLabel = "Also known as";
  /** Short facts in one line, separated by dots: a role, a place, when last seen, a linked case */
  @property({ attribute: false }) accessor meta: ProfileMeta[] = [];
  /** The page's actions, at the right */
  @property({ attribute: false }) accessor actions: ProfileAction[] = [];
  /** Shows an overflow button after the actions, which fires tc-action "more" */
  @property({ type: Boolean }) accessor more = false;
  /** The overflow button's name */
  @property({ attribute: "more-label" }) accessor moreLabel = "More actions";
  /** Tabs for the sections below; none hides the row */
  @property({ attribute: false }) accessor tabs: ProfileTab[] = [];
  /** The selected tab's id; the first tab when unset. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property() accessor selected: string | undefined = undefined;
  /** The tab row's name for screen readers */
  @property({ attribute: "tabs-label" }) accessor tabsLabel = "Sections";

  /** The tab holding the tab stop while the arrows move between tabs */
  @state() private accessor focusTab: string | undefined = undefined;

  private uid = `tc-phd-${++uidCount}`;

  private get current() {
    return this.tabs.some((t) => t.id === this.selected) ? this.selected : this.tabs[0]?.id;
  }

  private select(id: string) {
    if (id === this.current) return;
    if (!this.emit<ProfileSelectedChange>("tc-selected-change", { selected: id }, { cancelable: true })) return;
    this.selected = id;
  }

  private onTabKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.isComposing) return;
    const tab = (e.target as Element).closest<HTMLElement>("[data-tab]");
    if (!tab) return;
    const ids = this.tabs.map((t) => t.id);
    const at = ids.indexOf(tab.dataset.tab!);
    const last = ids.length - 1;
    const to = e.key === "ArrowRight" ? (at === last ? 0 : at + 1) : e.key === "ArrowLeft" ? (at === 0 ? last : at - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : -1;
    if (to >= 0) {
      e.preventDefault();
      this.focusTab = ids[to];
      void this.updateComplete.then(() => {
        const next = this.querySelector<HTMLElement>(`[data-tab="${CSS.escape(ids[to])}"]`);
        next?.focus();
        next?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
      });
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.select(ids[at]);
    }
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (this.focusTab !== undefined && !this.tabs.some((t) => t.id === this.focusTab)) this.focusTab = undefined;
  }

  /* ---------- Rendering ---------- */

  private pill(p: ProfilePill, kind: "status" | "tag") {
    return html`<span class="ui-phd__pill" data-kind=${kind} data-tone=${p.tone ?? "neutral"}>${kind === "status" ? html`<span class="ui-phd__dot" aria-hidden="true"></span>` : nothing}${p.label}</span>`;
  }

  private renderAvatar() {
    const shape = this.kind === "account" ? "square" : "round";
    if (this.picture) return html`<span class="ui-phd__avatar" data-shape=${shape} aria-hidden="true"><img src=${this.picture} alt="" /></span>`;
    return html`<span class="ui-phd__avatar" data-shape=${shape} data-hue=${hue(this.name)} aria-hidden="true">${initials(this.name)}</span>`;
  }

  private renderActions() {
    if (!this.actions.length && !this.more) return nothing;
    return html`<div class="ui-phd__actions">
      ${this.actions.map(
        (a) => html`<button
          type="button"
          class="ui-phd__btn"
          data-variant=${a.variant ?? "secondary"}
          data-action=${a.id}
          ?disabled=${!!a.disabled}
          @click=${() => this.emit<ProfileActionEvent>("tc-action", { id: a.id })}
        >${a.icon ? (typeof a.icon === "string" ? glyph(ICONS[a.icon]) : a.icon.cloneNode(true)) : nothing}<span>${a.label}</span></button>`,
      )}
      ${this.more
        ? html`<button type="button" class="ui-phd__btn ui-phd__more" data-variant="secondary" data-action="more" aria-label=${this.moreLabel} title=${this.moreLabel} @click=${() => this.emit<ProfileActionEvent>("tc-action", { id: "more" })}>${glyph(ICONS.more)}</button>`
        : nothing}
    </div>`;
  }

  private renderTabs() {
    if (!this.tabs.length) return nothing;
    const current = this.current;
    const stop = this.focusTab ?? current;
    return html`<div class="ui-phd__tabs" role="tablist" aria-label=${this.tabsLabel} @keydown=${this.onTabKey}>
      ${this.tabs.map(
        (t) => html`<button
          type="button"
          role="tab"
          class="ui-phd__tab"
          id=${`${this.uid}-tab-${t.id}`}
          data-tab=${t.id}
          aria-selected=${t.id === current ? "true" : "false"}
          aria-controls=${ifDefined(t.controls)}
          tabindex=${t.id === stop ? 0 : -1}
          @click=${() => {
            this.focusTab = t.id;
            this.select(t.id);
          }}
          @blur=${(e: FocusEvent) => {
            // Leaving the row puts the tab stop back on the selected tab
            if (!(e.relatedTarget as Element | null)?.closest?.(".ui-phd__tabs")) this.focusTab = undefined;
          }}
        >${t.label}${t.count !== undefined ? html`<span class="ui-phd__count">${t.count}</span>` : nothing}</button>`,
      )}
    </div>`;
  }

  protected override render() {
    const title = this.level === 1 ? html`<h1 class="ui-phd__name">${this.name}</h1>` : html`<h2 class="ui-phd__name">${this.name}</h2>`;
    const pills = [...(this.status ? [this.pill(this.status, "status")] : []), ...this.tags.map((t) => this.pill(t, "tag"))];
    return html`<div class="ui-phd__card">
      <div class="ui-phd__top">
        ${this.renderAvatar()}
        <div class="ui-phd__who">
          <div class="ui-phd__title">${title}${pills.length ? html`<span class="ui-phd__pills">${pills}</span>` : nothing}</div>
          ${this.aliases.length
            ? html`<div class="ui-phd__aliases"><span class="ui-phd__alias-label">${this.aliasLabel}</span><ul class="ui-phd__chips" aria-label=${this.aliasLabel}>${this.aliases.map((a) => html`<li class="ui-phd__chip">${a}</li>`)}</ul></div>`
            : nothing}
          ${this.meta.length
            ? html`<ul class="ui-phd__meta">${this.meta.map((m) => {
                const item = typeof m === "string" ? { label: m } : m;
                return html`<li class="ui-phd__fact">${item.tone ? html`<span class="ui-phd__dot" data-tone=${item.tone} aria-hidden="true"></span>` : nothing}${item.label}</li>`;
              })}</ul>`
            : nothing}
        </div>
        ${this.renderActions()}
      </div>
      ${this.renderTabs()}
    </div>`;
  }

  static override css = /* css */ `
/* Standard: a white card on a gray tray */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="phd"] {
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
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="phd"] {
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
[data-ui="phd"] *, [data-ui="phd"] *::before, [data-ui="phd"] *::after { box-sizing: border-box; }
:where([data-ui="phd"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="phd"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="phd"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="phd"] h1, [data-ui="phd"] h2 { margin: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-phd__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- Avatar, who, actions ----- */
.ui-phd__top { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; grid-template-areas: "avatar who actions"; align-items: start; gap: var(--tc-space-2) var(--tc-space-4); padding: var(--tc-space-5) var(--tc-space-5) var(--tc-space-4); }
.ui-phd__avatar { grid-area: avatar; display: grid; place-items: center; width: 56px; height: 56px; overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-surface-sunken); color: var(--tc-text-secondary); font-size: var(--tc-font-size-2xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-none); letter-spacing: var(--tc-tracking-tight); }
.ui-phd__avatar[data-shape="square"] { border-radius: var(--tc-radius-lg); }
.ui-phd__avatar > img { display: block; width: 100%; height: 100%; object-fit: cover; }
.ui-phd__avatar[data-hue="teal"] { background: var(--tc-tone-teal-bg); color: var(--tc-tone-teal-fg); }
.ui-phd__avatar[data-hue="violet"] { background: var(--tc-tone-violet-bg); color: var(--tc-tone-violet-fg); }
.ui-phd__avatar[data-hue="amber"] { background: var(--tc-tone-amber-bg); color: var(--tc-tone-amber-fg); }
.ui-phd__avatar[data-hue="pink"] { background: var(--tc-tone-pink-bg); color: var(--tc-tone-pink-fg); }
.ui-phd__avatar[data-hue="rose"] { background: var(--tc-tone-rose-bg); color: var(--tc-tone-rose-fg); }
.ui-phd__who { grid-area: who; display: grid; gap: var(--tc-space-1-5); min-width: 0; padding-top: var(--tc-space-1); }
.ui-phd__title { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5) var(--tc-space-2-5); min-width: 0; }
.ui-phd__name { min-width: 0; font-size: var(--tc-font-size-2xl); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-display-sm); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-phd__pills { display: inline-flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
.ui-phd__pill { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); color: var(--tc-text-secondary); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-phd__pill[data-tone="info"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-phd__pill[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-phd__pill[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-phd__pill[data-tone="danger"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-phd__dot { flex: none; width: 6px; height: 6px; border-radius: var(--tc-radius-full); background: currentColor; }
.ui-phd__fact > .ui-phd__dot { background: var(--tc-icon-muted); }
.ui-phd__fact > .ui-phd__dot[data-tone="info"] { background: var(--tc-status-info-solid); }
.ui-phd__fact > .ui-phd__dot[data-tone="success"] { background: var(--tc-status-success-solid); }
.ui-phd__fact > .ui-phd__dot[data-tone="warning"] { background: var(--tc-status-warning-solid); }
.ui-phd__fact > .ui-phd__dot[data-tone="danger"] { background: var(--tc-status-danger-solid); }
.ui-phd__aliases { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); min-width: 0; }
.ui-phd__alias-label { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-phd__chips { display: contents; }
.ui-phd__chip { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-sm); background: var(--tc-surface-sunken); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); color: var(--tc-text-primary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-phd__meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-0-5) 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-phd__fact { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); white-space: nowrap; }
.ui-phd__fact + .ui-phd__fact::before { content: "·"; margin: 0 var(--tc-space-2); color: var(--tc-text-muted); }
.ui-phd__actions { grid-area: actions; display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--tc-space-2); }
.ui-phd__btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-phd__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-phd__btn[data-variant="primary"] { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-phd__btn[data-variant="primary"]:hover { background: var(--tc-action-primary-bg-hover); }
.ui-phd__btn:disabled { opacity: 0.5; cursor: default; }
.ui-phd__more { width: var(--tc-control-h-md); padding: 0; }
.ui-phd__icon, .ui-phd__btn > svg, .ui-phd__btn > img { display: block; flex: none; width: 15px; height: 15px; }
/* ----- Tabs: an underline row that scrolls sideways when the sections don't fit ----- */
.ui-phd__tabs { display: flex; gap: var(--tc-space-1); padding: 0 var(--tc-space-3-5); border-top: var(--tc-hairline) solid var(--tc-divider); overflow-x: auto; scrollbar-width: none; }
.ui-phd__tabs::-webkit-scrollbar { display: none; }
.ui-phd__tab { position: relative; display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-lg); padding: 0 var(--tc-space-1-5); color: var(--tc-text-muted); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-phd__tab:hover, .ui-phd__tab[aria-selected="true"] { color: var(--tc-text-primary); }
.ui-phd__tab::after { content: ""; position: absolute; left: var(--tc-space-1-5); right: var(--tc-space-1-5); bottom: 0; height: 2px; border-radius: var(--tc-radius-full); background: transparent; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-phd__tab[aria-selected="true"]::after { background: var(--tc-surface-inverse); }
:where([data-look="clean"], [data-look="clean"] *).ui-phd__tab[aria-selected="true"]::after { background: var(--tc-accent); }
[data-ui="phd"] .ui-phd__tab:focus-visible { outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-phd__count { display: inline-grid; place-items: center; min-width: 18px; height: 18px; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-full); background: var(--tc-fill-default); color: var(--tc-text-secondary); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-none); font-variant-numeric: tabular-nums; }
.ui-phd__tab[aria-selected="true"] .ui-phd__count { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
/* Narrow: the actions go under the name, and the avatar shrinks */
@container (max-width: 560px) {
  .ui-phd__top { grid-template-columns: auto minmax(0, 1fr); grid-template-areas: "avatar who" "actions actions"; padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-3-5); }
  .ui-phd__avatar { width: 44px; height: 44px; font-size: var(--tc-font-size-xl); }
  .ui-phd__name { font-size: var(--tc-font-size-xl); line-height: var(--tc-line-height-loose); }
  .ui-phd__who { padding-top: 0; }
  .ui-phd__actions { justify-content: flex-start; }
  .ui-phd__tabs { padding: 0 var(--tc-space-2-5); -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent); mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent); }
}
@media (forced-colors: active) {
  .ui-phd__pill, .ui-phd__chip { border: 1px solid CanvasText; }
  .ui-phd__tab[aria-selected="true"]::after { background: Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="phd"] *, [data-ui="phd"] *::before, [data-ui="phd"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-profile-header")) customElements.define("tc-profile-header", TcProfileHeader);

declare global {
  interface HTMLElementTagNameMap {
    "tc-profile-header": TcProfileHeader;
  }
}
