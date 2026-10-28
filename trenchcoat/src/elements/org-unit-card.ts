import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { initials } from "./internal/util";

/*
 * <tc-org-unit-card> – an organisational unit at a glance: a centre, a department, a division. The header carries a
 * short code badge ("CIS"), the unit's name and one line about it, with the page's actions at the right. Under it
 * sits the unit's lead, a health strip counting what's On track, on Watch and At risk (words and marks, never colour
 * alone), and a strip of the page's own stats – label, value and a quiet line, the budget optionally with a
 * spent-of-allocated bar. Then come its sub-units (teams) as rows that fold open: name, lead, people, health,
 * coverage, open gaps and effort, and inside, the team's items – topics, programmes – with a priority badge, a tag,
 * what's in work, coverage, what's open and momentum.
 *   · the rows are one tab stop: ↑ / ↓ move through the teams and any open team's items, Home / End to the ends;
 *     → opens a team (or steps into it), ← closes it (or steps back to its team); Enter or Space opens and closes a
 *     team, and fires tc-open on an item
 *   · which teams are open is `expanded`, changed by the user unless a tc-expanded-change listener prevents it
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-org-unit-card code="CIS" heading="Intelligent Systems" .stats=${stats} .teams=${teams}></tc-org-unit-card>
 */

export type OrgHealth = "on-track" | "watch" | "at-risk";
export type OrgPerson = {
  name: string;
  /** Their role, e.g. "Principal Investigator" */
  title?: string;
  /** A picture's URL; initials of the name otherwise */
  picture?: string;
};
export type OrgStat = {
  id: string;
  /** Short, e.g. "Budget" */
  label: string;
  /** Written as shown, e.g. "$9.2M", "66%" */
  value: string;
  /** A quiet line under the value, e.g. "$5.1M spent" */
  sub?: string;
  /** A share from 0 to 1 drawn as a slim bar under the value, e.g. spent of allocated */
  meter?: number;
  /** "danger" marks the value, e.g. over budget; the sub-line should say why */
  tone?: "default" | "success" | "warning" | "danger";
};
export type OrgHealthCounts = Partial<Record<OrgHealth, number>>;
export type OrgItem = {
  id: string;
  label: string;
  /** 1 is the top priority; shown as a numbered badge */
  priority?: number;
  /** A tag after the label, e.g. "Flagship", "Core" */
  tag?: string;
  /** What's in work, e.g. "4 in work" */
  detail?: string;
  /** Share covered, from 0 to 1 */
  coverage?: number;
  /** How many are open, e.g. gaps */
  open?: number;
  /** Change over the period as a fraction: -0.08 is down 8% */
  momentum?: number;
  health?: OrgHealth;
};
export type OrgTeam = {
  id: string;
  name: string;
  lead?: OrgPerson;
  /** How many people */
  people?: number;
  /** Its items' health */
  health?: OrgHealthCounts;
  /** Share covered, from 0 to 1 */
  coverage?: number;
  /** Open gaps, issues */
  gaps?: number;
  /** Effort, in full-time equivalents */
  fte?: number;
  items?: OrgItem[];
};
export type OrgAction = { id: string; label: string; variant?: "primary" | "secondary" };

/** Details of the events */
export type OrgExpandedChange = { expanded: string[]; id: string; open: boolean };
export type OrgActionEvent = { id: string };
export type OrgOpen = { team: string; item: OrgItem };

const HEALTH: OrgHealth[] = ["on-track", "watch", "at-risk"];
/** The health states' names used when the page gives none */
export const defaultOrgHealthLabels: Record<OrgHealth, string> = { "on-track": "On track", watch: "Watch", "at-risk": "At risk" };
let uidCount = 0;

/* On track, watch, at risk – circle-check, circle-dot, triangle-alert; chevron: Lucide (ISC, lucide.dev) */
const mark = (body: ReturnType<typeof svg>) =>
  html`<svg class="ui-orgu__mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const MARK: Record<OrgHealth, () => ReturnType<typeof mark>> = {
  "on-track": () => mark(svg`<circle cx="12" cy="12" r="9"></circle><path d="m8.5 12 2.5 2.5 4.5-5"></path>`),
  watch: () => mark(svg`<circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="2.5" fill="currentColor"></circle>`),
  "at-risk": () => mark(svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>`),
};
const chevron = html`<svg class="ui-orgu__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"></path></svg>`;
const pct = (n: number) => `${Math.round(n * 100)}%`;

/**
 * An organisational unit – code, name, lead, health, the page's stats and its teams as rows that fold open onto
 * their items – with the page's actions in the header.
 * @tag tc-org-unit-card
 * @fires tc-expanded-change - A team was opened or closed ({ expanded, id, open }: OrgExpandedChange); cancelable – prevented, `expanded` stays as it was
 * @fires tc-action - A header action was used ({ id }: OrgActionEvent)
 * @fires tc-open - An item was opened with Enter or a click ({ team, item }: OrgOpen)
 */
export class TcOrgUnitCard extends TcElement {
  static override ui = "orgu";

  /** The unit's name, and the card's heading */
  @property() accessor heading = "";
  /** A short code shown as the header's badge, e.g. "CIS"; initials of the name otherwise */
  @property() accessor code: string | undefined = undefined;
  /** One line about the unit */
  @property() accessor description: string | undefined = undefined;
  /** Who leads the unit */
  @property({ attribute: false }) accessor lead: OrgPerson | null = null;
  /** The lead's role in the unit, the caption over their name */
  @property({ attribute: "lead-label" }) accessor leadLabel = "Lead";
  /** The page's stats, in order */
  @property({ attribute: false }) accessor stats: OrgStat[] = [];
  /** The unit's health: how many items are on track, on watch and at risk */
  @property({ attribute: false }) accessor health: OrgHealthCounts | null = null;
  /** The health states' names, merged over the defaults (On track, Watch, At risk) */
  @property({ attribute: false }) accessor healthLabels: Partial<Record<OrgHealth, string>> = {};
  /** The sub-units */
  @property({ attribute: false }) accessor teams: OrgTeam[] = [];
  /** The sub-units' caption */
  @property({ attribute: "teams-label" }) accessor teamsLabel = "Teams";
  /** What a team's items are, for their list's name, e.g. "Topics" */
  @property({ attribute: "items-label" }) accessor itemsLabel = "Topics";
  /** The open teams' ids. Changed by the user unless a tc-expanded-change listener calls preventDefault() */
  @property({ attribute: false }) accessor expanded: string[] = [];
  /** Buttons in the header */
  @property({ attribute: false }) accessor actions: OrgAction[] = [];

  @state() private accessor activeKey = "";

  private uid = `tc-orgu-${++uidCount}`;

  /* ---------- The model ---------- */

  private label(h: OrgHealth) {
    return this.healthLabels[h] ?? defaultOrgHealthLabels[h];
  }
  private isOpen(id: string) {
    return this.expanded.includes(id);
  }
  /** Every row that can take focus, in order: each team, then its items when open */
  private get rows() {
    const keys: string[] = [];
    for (const t of this.teams) {
      keys.push(`t:${t.id}`);
      if (this.isOpen(t.id)) for (const it of t.items ?? []) keys.push(`i:${t.id}:${it.id}`);
    }
    return keys;
  }

  private setOpen(id: string, open: boolean) {
    if (this.isOpen(id) === open) return;
    const next = open ? [...this.expanded, id] : this.expanded.filter((x) => x !== id);
    if (!this.emit<OrgExpandedChange>("tc-expanded-change", { expanded: next, id, open }, { cancelable: true })) return;
    this.expanded = next;
  }

  /* ---------- Keyboard ---------- */

  private focusKey(key: string) {
    this.activeKey = key;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`)?.focus());
  }

  private onKey = (e: KeyboardEvent) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>("[data-key]");
    if (!row || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const key = row.dataset.key!;
    const rows = this.rows;
    const i = rows.indexOf(key);
    const [kind, team] = key.split(":");
    let to: string | undefined;
    if (e.key === "ArrowDown") to = rows[Math.min(rows.length - 1, i + 1)];
    else if (e.key === "ArrowUp") to = rows[Math.max(0, i - 1)];
    else if (e.key === "Home") to = rows[0];
    else if (e.key === "End") to = rows[rows.length - 1];
    else if (e.key === "ArrowRight" && kind === "t") {
      e.preventDefault();
      if (!this.isOpen(team)) this.setOpen(team, true);
      else if (rows[i + 1]?.startsWith("i:")) this.focusKey(rows[i + 1]);
      return;
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (kind === "i") this.focusKey(`t:${team}`);
      else this.setOpen(team, false);
      return;
    }
    if (to === undefined) return;
    e.preventDefault();
    this.focusKey(to);
  };

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // The tab stop moves to the item's team when its row goes away (a team closed or removed)
    if (this.activeKey && !this.rows.includes(this.activeKey)) {
      const team = this.activeKey.split(":")[1];
      this.activeKey = this.teams.some((t) => t.id === team) ? `t:${team}` : "";
    }
  }

  /* ---------- Rendering ---------- */

  private avatar(p: OrgPerson, size: "sm" | "md") {
    return html`<span class="ui-orgu__avatar" data-size=${size} aria-hidden="true">${p.picture ? html`<img src=${p.picture} alt="" />` : initials(p.name)}</span>`;
  }

  private renderHealth(counts: OrgHealthCounts, compact: boolean) {
    const shown = HEALTH.filter((h) => !compact || (counts[h] ?? 0) > 0);
    // Compact, the words are for screen readers only – with a comma between, so the counts don't run together
    return shown.map(
      (h, i) => html`<span class="ui-orgu__health" data-health=${h}>${MARK[h]()}<span class="ui-orgu__health-n">${counts[h] ?? 0}</span><span class=${compact ? "ui-orgu__sr" : "ui-orgu__health-label"}
          >${compact ? ` ${this.label(h)}${i < shown.length - 1 ? ", " : ""}` : this.label(h)}</span
        ></span>`,
    );
  }

  private renderStat(s: OrgStat) {
    const meter = s.meter === undefined ? undefined : Math.max(0, Math.min(1, s.meter));
    return html`<div class="ui-orgu__stat" data-tone=${s.tone ?? "default"}>
      <dt class="ui-orgu__stat-label">${s.label}</dt>
      <dd class="ui-orgu__stat-value">${s.value}${meter === undefined ? nothing : html`<span class="ui-orgu__sr"> (${pct(meter)})</span>`}</dd>
      ${meter === undefined ? nothing : html`<dd class="ui-orgu__stat-meter" aria-hidden="true"><span style=${`inline-size: ${meter * 100}%`}></span></dd>`}
      ${s.sub ? html`<dd class="ui-orgu__stat-sub">${s.sub}</dd>` : nothing}
    </div>`;
  }

  private renderItem(team: OrgTeam, it: OrgItem, stop: string) {
    const key = `i:${team.id}:${it.id}`;
    const m = it.momentum;
    const dir = m === undefined || Math.round(Math.abs(m) * 100) === 0 ? "flat" : m > 0 ? "up" : "down";
    return html`<li>
      <button
        type="button"
        class="ui-orgu__item"
        data-key=${key}
        data-health=${it.health ?? "none"}
        tabindex=${key === stop ? 0 : -1}
        @focus=${() => (this.activeKey = key)}
        @click=${() => {
          this.activeKey = key;
          this.emit<OrgOpen>("tc-open", { team: team.id, item: it });
        }}
      >
        ${it.priority !== undefined ? html`<span class="ui-orgu__prio" data-priority=${it.priority}><span class="ui-orgu__sr">Priority </span>${it.priority}</span>` : nothing}
        <span class="ui-orgu__item-main">
          <span class="ui-orgu__item-label">${it.label}${it.health ? html`<span class="ui-orgu__sr">, ${this.label(it.health)}</span>` : nothing}</span>
          ${it.tag || it.detail
            ? html`<span class="ui-orgu__item-meta">${it.tag ? html`<span class="ui-orgu__tag">${it.tag}</span>` : nothing}${it.tag && it.detail ? html`<span aria-hidden="true">·</span>` : nothing}${it.detail ?? nothing}</span>`
            : nothing}
        </span>
        ${it.coverage !== undefined
          ? html`<span class="ui-orgu__cov"><span class="ui-orgu__cov-bar" aria-hidden="true"><span style=${`inline-size: ${Math.max(0, Math.min(1, it.coverage)) * 100}%`}></span></span><span class="ui-orgu__cov-n">${pct(it.coverage)}<span class="ui-orgu__sr"> covered</span></span></span>`
          : nothing}
        ${it.open !== undefined ? html`<span class="ui-orgu__open">${it.open} open</span>` : nothing}
        ${m !== undefined
          ? html`<span class="ui-orgu__mom" data-dir=${dir}><span aria-hidden="true">${dir === "up" ? "▲" : dir === "down" ? "▼" : "–"}</span><span class="ui-orgu__sr">${dir === "up" ? "Up " : dir === "down" ? "Down " : "No change, "}</span>${pct(Math.abs(m))}</span>`
          : nothing}
      </button>
    </li>`;
  }

  private renderTeam(t: OrgTeam, stop: string) {
    const key = `t:${t.id}`;
    const open = this.isOpen(t.id);
    const items = t.items ?? [];
    const listId = `${this.uid}-team-${t.id}`;
    return html`<li class="ui-orgu__team" ?data-open=${open}>
      <button
        type="button"
        class="ui-orgu__team-row"
        data-key=${key}
        tabindex=${key === stop ? 0 : -1}
        aria-expanded=${items.length ? (open ? "true" : "false") : "false"}
        aria-controls=${listId}
        @focus=${() => (this.activeKey = key)}
        @click=${() => {
          this.activeKey = key;
          this.setOpen(t.id, !open);
        }}
      >
        ${chevron}
        <span class="ui-orgu__team-main">
          <span class="ui-orgu__team-name">${t.name}</span>
          ${t.lead || t.people !== undefined
            ? html`<span class="ui-orgu__team-meta"
                >${t.lead ? html`${this.avatar(t.lead, "sm")}<span>${t.lead.name}</span>` : nothing}${t.lead && t.people !== undefined ? html`<span aria-hidden="true">·</span>` : nothing}${t.people !== undefined
                  ? html`<span>${t.people} ${t.people === 1 ? "person" : "people"}</span>`
                  : nothing}</span
              >`
            : nothing}
        </span>
        ${t.health ? html`<span class="ui-orgu__team-health">${this.renderHealth(t.health, true)}</span>` : nothing}
        <span class="ui-orgu__figures">
          ${t.coverage !== undefined ? html`<span class="ui-orgu__fig"><span class="ui-orgu__fig-n">${pct(t.coverage)}</span><span class="ui-orgu__fig-l">coverage</span></span>` : nothing}
          ${t.gaps !== undefined ? html`<span class="ui-orgu__fig"><span class="ui-orgu__fig-n">${t.gaps}</span><span class="ui-orgu__fig-l">gaps</span></span>` : nothing}
          ${t.fte !== undefined ? html`<span class="ui-orgu__fig"><span class="ui-orgu__fig-n">${t.fte}</span><span class="ui-orgu__fig-l">FTE</span></span>` : nothing}
        </span>
      </button>
      <ul class="ui-orgu__items" id=${listId} aria-label=${`${t.name}: ${this.itemsLabel}`} ?hidden=${!open || !items.length}>
        ${open ? repeat(items, (it) => it.id, (it) => this.renderItem(t, it, stop)) : nothing}
      </ul>
    </li>`;
  }

  protected override render() {
    const id = this.uid;
    const rows = this.rows;
    const stop = rows.includes(this.activeKey) ? this.activeKey : (rows[0] ?? "");
    const code = this.code ?? initials(this.heading || "?");
    return html`
      ${cardHead({
        picture: html`<span class="ui-orgu__code">${code}</span>`,
        pictureShape: "square",
        title: this.heading,
        subtitle: this.description,
        id: `${id}-title`,
        level: 3,
        aside: this.actions.length
          ? html`${this.actions.map(
              (a) => html`<button type="button" class="ui-orgu__action" data-variant=${a.variant ?? "secondary"} @click=${() => this.emit<OrgActionEvent>("tc-action", { id: a.id })}>${a.label}</button>`,
            )}`
          : nothing,
      })}
      <div class="ui-orgu__card">
        ${this.lead || this.health
          ? html`<div class="ui-orgu__top">
              ${this.lead
                ? html`<div class="ui-orgu__lead">
                    ${this.avatar(this.lead, "md")}
                    <span class="ui-orgu__lead-text">
                      <span class="ui-orgu__caption">${this.leadLabel}</span>
                      <span class="ui-orgu__lead-name">${this.lead.name}</span>
                      ${this.lead.title ? html`<span class="ui-orgu__lead-title">${this.lead.title}</span>` : nothing}
                    </span>
                  </div>`
                : nothing}
              ${this.health ? html`<div class="ui-orgu__healths" role="group" aria-label="Health">${this.renderHealth(this.health, false)}</div>` : nothing}
            </div>`
          : nothing}
        ${this.stats.length ? html`<dl class="ui-orgu__stats">${this.stats.map((s) => this.renderStat(s))}</dl>` : nothing}
        ${this.teams.length
          ? html`<section class="ui-orgu__teams" aria-labelledby=${`${id}-teams`}>
              <h4 class="ui-orgu__caption ui-orgu__teams-head" id=${`${id}-teams`}>${this.teamsLabel}<span class="ui-orgu__teams-n">${this.teams.length}</span></h4>
              <ul class="ui-orgu__team-list" @keydown=${this.onKey}>
                ${repeat(this.teams, (t) => t.id, (t) => this.renderTeam(t, stop))}
              </ul>
            </section>`
          : nothing}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="orgu"] {
  position: relative;
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="orgu"] {
  position: relative;
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
[data-ui="orgu"] *, [data-ui="orgu"] *::before, [data-ui="orgu"] *::after { box-sizing: border-box; }
[data-ui="orgu"] p, [data-ui="orgu"] h4, [data-ui="orgu"] dl, [data-ui="orgu"] dd { margin: 0; }
[data-ui="orgu"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="orgu"] svg { display: block; flex: none; }
:where([data-ui="orgu"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="orgu"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-orgu__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-orgu__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-orgu__caption { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
/* ----- The header: the code badge in the icon box, the actions at the right ----- */
.ui-orgu__code { display: grid !important; place-items: center; background: var(--tc-surface-inverse); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); letter-spacing: var(--tc-tracking-normal); color: var(--tc-text-on-inverse); }
.ui-orgu__action { display: inline-flex; align-items: center; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm) !important; border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-sm); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-orgu__action[data-variant="secondary"] { background: var(--tc-action-secondary-bg) !important; box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
.ui-orgu__action[data-variant="secondary"]:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-orgu__action[data-variant="primary"] { background: var(--tc-action-primary-bg) !important; box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-orgu__action[data-variant="primary"]:hover { background: var(--tc-action-primary-bg-hover) !important; }
/* ----- The lead and the unit's health ----- */
.ui-orgu__top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-3) var(--tc-space-4); padding: var(--tc-space-4) var(--tc-space-4) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-orgu__top { padding-top: var(--tc-space-1); }
.ui-orgu__lead { display: flex; align-items: center; gap: var(--tc-space-2-5); min-width: 0; }
.ui-orgu__lead-text { display: grid; min-width: 0; }
.ui-orgu__lead-name { font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-orgu__lead-title { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-orgu__avatar { display: grid; flex: none; place-items: center; overflow: hidden; border-radius: 50%; background: var(--tc-fill-default); font-weight: var(--tc-avatar-font-weight); color: var(--tc-text-secondary); }
.ui-orgu__avatar[data-size="md"] { width: var(--tc-avatar-md); height: var(--tc-avatar-md); font-size: var(--tc-avatar-font-size); }
.ui-orgu__avatar[data-size="sm"] { width: var(--tc-avatar-sm); height: var(--tc-avatar-sm); font-size: var(--tc-font-size-2xs); }
.ui-orgu__avatar > img { width: 100%; height: 100%; object-fit: cover; }
.ui-orgu__healths { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
.ui-orgu__health { display: inline-flex; align-items: center; gap: var(--tc-space-1); white-space: nowrap; }
.ui-orgu__healths .ui-orgu__health { height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); }
.ui-orgu__healths [data-health="on-track"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-orgu__healths [data-health="watch"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-orgu__healths [data-health="at-risk"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-orgu__health-n { font-variant-numeric: tabular-nums; }
.ui-orgu__mark { width: 13px; height: 13px; }
/* ----- The stats: label, value, an optional bar and a quiet line ----- */
.ui-orgu__stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(112px, 1fr)); gap: var(--tc-space-2); padding: var(--tc-space-4); }
.ui-orgu__stat { display: grid; align-content: start; gap: var(--tc-space-0-5); min-width: 0; padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-fill-subtle); }
.ui-orgu__stat-label { overflow: hidden; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-orgu__stat-value { font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-orgu__stat[data-tone="success"] .ui-orgu__stat-value { color: var(--tc-status-success-fg); }
.ui-orgu__stat[data-tone="warning"] .ui-orgu__stat-value { color: var(--tc-status-warning-fg); }
.ui-orgu__stat[data-tone="danger"] .ui-orgu__stat-value { color: var(--tc-status-danger-fg); }
.ui-orgu__stat-sub { overflow: hidden; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-orgu__stat-meter { display: block; height: 4px; margin: var(--tc-space-1) 0 var(--tc-space-0-5); overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-orgu__stat-meter > span { display: block; height: 100%; border-radius: inherit; background: var(--tc-meter-fill); }
.ui-orgu__stat[data-tone="danger"] .ui-orgu__stat-meter > span { background: var(--tc-status-danger-solid); }
/* ----- The teams: rows that fold open onto their items ----- */
.ui-orgu__teams { padding: 0 var(--tc-space-2) var(--tc-space-2); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-orgu__teams-head { display: flex; align-items: center; gap: var(--tc-space-1-5); padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-1-5); }
.ui-orgu__teams-n { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-orgu__team + .ui-orgu__team { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-orgu__team-row { display: flex; align-items: center; gap: var(--tc-space-3); width: 100%; min-height: 52px; padding: var(--tc-space-2) var(--tc-space-2) !important; border-radius: var(--tc-radius-md); text-align: left; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-orgu__team-row:hover, .ui-orgu__item:hover { background: var(--tc-fill-subtle); }
[data-ui="orgu"] :is(.ui-orgu__team-row, .ui-orgu__item):focus-visible { outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-orgu__chev { width: 16px; height: 16px; color: var(--tc-icon-muted); transition: transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-orgu__team[data-open] .ui-orgu__chev { transform: rotate(90deg); }
.ui-orgu__team-main { display: grid; flex: 1; gap: var(--tc-space-0-5); min-width: 0; }
.ui-orgu__team-name { overflow: hidden; font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); text-overflow: ellipsis; white-space: nowrap; }
.ui-orgu__team-meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); min-width: 0; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-orgu__team-health { display: inline-flex; flex: none; gap: var(--tc-space-2); font-size: var(--tc-font-size-sm); }
.ui-orgu__team-health [data-health="on-track"] .ui-orgu__mark { color: var(--tc-status-success-fg); }
.ui-orgu__team-health [data-health="watch"] .ui-orgu__mark { color: var(--tc-status-warning-fg); }
.ui-orgu__team-health [data-health="at-risk"] .ui-orgu__mark { color: var(--tc-status-danger-fg); }
.ui-orgu__team-health .ui-orgu__health-n { color: var(--tc-text-secondary); }
.ui-orgu__figures { display: flex; flex: none; gap: var(--tc-space-4); }
.ui-orgu__fig { display: grid; justify-items: end; min-width: 40px; }
.ui-orgu__fig-n { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-orgu__fig-l { font-size: var(--tc-font-size-2xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
/* A team's items, indented under it */
.ui-orgu__items { padding: 0 0 var(--tc-space-2) var(--tc-space-6) !important; animation: ui-orgu-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-orgu__item { display: flex; align-items: center; gap: var(--tc-space-2-5); width: 100%; min-height: 44px; padding: var(--tc-space-1-5) var(--tc-space-2) !important; border-radius: var(--tc-radius-md); text-align: left; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-orgu__prio { display: grid; flex: none; place-items: center; width: 20px; height: 20px; border-radius: var(--tc-radius-xs); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-orgu__prio[data-priority="1"] { background: var(--tc-surface-inverse); box-shadow: none; color: var(--tc-text-on-inverse); }
.ui-orgu__item-main { display: grid; flex: 1; gap: var(--tc-space-0-5); min-width: 0; }
.ui-orgu__item-label { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); text-overflow: ellipsis; white-space: nowrap; }
.ui-orgu__item-meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-orgu__tag { padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-xs); background: var(--tc-fill-default); color: var(--tc-text-secondary); }
.ui-orgu__cov { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); }
.ui-orgu__cov-bar { display: block; width: 48px; height: 4px; overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-orgu__cov-bar > span { display: block; height: 100%; border-radius: inherit; background: var(--tc-meter-fill); }
.ui-orgu__cov-n, .ui-orgu__open, .ui-orgu__mom { min-width: 40px; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-orgu__cov-n { min-width: 32px; color: var(--tc-text-secondary); }
.ui-orgu__open { color: var(--tc-text-muted); }
.ui-orgu__mom { min-width: 44px; }
.ui-orgu__mom[data-dir="up"] { color: var(--tc-status-success-fg); }
.ui-orgu__mom[data-dir="down"] { color: var(--tc-status-danger-fg); }
.ui-orgu__mom[data-dir="flat"] { color: var(--tc-text-muted); }
@keyframes ui-orgu-in { from { opacity: 0; transform: translateY(-2px); } }
@container (max-width: 560px) {
  .ui-orgu__figures { display: none; }
  .ui-orgu__items { padding-left: var(--tc-space-3) !important; }
  .ui-orgu__cov-bar { display: none; }
}
@container (max-width: 400px) {
  .ui-orgu__team-health, .ui-orgu__open { display: none; }
}
@media (forced-colors: active) {
  .ui-orgu__stat-meter, .ui-orgu__cov-bar { border: 1px solid CanvasText; }
  .ui-orgu__stat-meter > span, .ui-orgu__cov-bar > span { background: CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="orgu"] *, [data-ui="orgu"] *::before, [data-ui="orgu"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-org-unit-card")) customElements.define("tc-org-unit-card", TcOrgUnitCard);

declare global {
  interface HTMLElementTagNameMap {
    "tc-org-unit-card": TcOrgUnitCard;
  }
}
