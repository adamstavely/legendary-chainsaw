import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";
import { formatDate } from "./internal/util";

/*
 * <tc-skill-library> – the skills a workspace has added, grouped by who made them: Built-in first, then your team,
 * then each plugin, then the community. A row is one skill – its name (which opens it), version, what it does, when it
 * runs in a quiet line ("Runs when asked to review a contract"), when it was last used, Update when a newer version
 * is out, and a switch that turns it on or off.
 *   · above the list: a search over names, descriptions and triggers, the source to show, and on / off / all
 *   · Add skill is a menu: Upload, From a URL, Create – the page does the adding (tc-add)
 *   · keyboard: Tab through each row's name, Update and switch; the Add skill menu takes ↑/↓, Home, End and Escape
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-skill-library .skills=${skills} .now=${now}></tc-skill-library>
 *
 * Turning a skill on or off fires a cancelable tc-enabled-change, then tc-skills-change with the whole list: prevent
 * either to keep `skills` yourself. Relative times ("3 h ago") need `now`; without it the date shows.
 */

/** One skill in the library */
export type LibrarySkill = {
  id: string;
  name: string;
  /** What it does, in a line */
  description?: string;
  /** Who made it: "Built-in", "Your team", a plugin's name, "Community" */
  group: string;
  /** Its version, e.g. "1.4.0" */
  version?: string;
  /** It's on: agents may pick it */
  enabled: boolean;
  /** When it last ran, epoch ms */
  lastUsed?: number;
  /** When a model picks it, in a phrase: "Runs when asked to review a contract" */
  triggers?: string;
  /** A newer version that's available, e.g. "1.5.0" */
  update?: string;
};
export type SkillLibraryShow = "all" | "on" | "off";
export type SkillLibraryAddSource = "upload" | "url" | "create";
export type SkillEnabledChange = { id: string; enabled: boolean; skill: LibrarySkill };
export type SkillLibrarySkillsChange = { skills: LibrarySkill[]; id: string };
export type SkillLibraryQueryChange = { query: string };
export type SkillLibraryGroupChange = { group: string | null };
export type SkillLibraryShowChange = { show: SkillLibraryShow };
export type SkillLibraryUpdate = { id: string; version: string; skill: LibrarySkill };
export type SkillLibraryAdd = { source: SkillLibraryAddSource };
export type SkillLibraryOpen = { id: string; skill: LibrarySkill };

export type SkillLibraryLabels = {
  heading: string;
  count: string;
  search: string;
  source: string;
  allSources: string;
  show: string;
  showAll: string;
  showOn: string;
  showOff: string;
  add: string;
  upload: string;
  url: string;
  create: string;
  update: string;
  updateAvailable: string;
  usedAgo: string;
  neverUsed: string;
  triggers: string;
  turnOn: string;
  on: string;
  off: string;
  empty: string;
  noMatches: string;
  clear: string;
  announceOn: string;
  announceOff: string;
};
export const defaultSkillLibraryLabels: SkillLibraryLabels = {
  heading: "Skills",
  count: "{n} skills · {on} on",
  search: "Search skills",
  source: "Source",
  allSources: "All sources",
  show: "Show",
  showAll: "All",
  showOn: "On",
  showOff: "Off",
  add: "Add skill",
  upload: "Upload",
  url: "From a URL",
  create: "Create",
  update: "Update to {version}",
  updateAvailable: "Update available",
  usedAgo: "Used {when}",
  neverUsed: "Not used yet",
  triggers: "When it runs: ",
  turnOn: "{name}",
  on: "On",
  off: "Off",
  empty: "No skills yet. Add one to teach your agents a new task.",
  noMatches: "No skills match.",
  clear: "Clear filters",
  announceOn: "{name} is on.",
  announceOff: "{name} is off.",
};
/** The groups that sort first and last; plugins sit between, in the order they first appear */
const FIRST = ["Built-in", "Your team"];
const LAST = ["Community"];

/** "3 h ago" from `now`, or the date when there's no `now` */
function ago(at: number, now: number | undefined, locale: string | undefined) {
  if (now === undefined) return formatDate(at, locale, { month: "short", day: "numeric" });
  const s = Math.max(0, Math.round((now - at) / 1000));
  let rtf: Intl.RelativeTimeFormat;
  try {
    rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  } catch {
    rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto", style: "short" });
  }
  if (s < 60) return rtf.format(0, "minute");
  if (s < 3600) return rtf.format(-Math.round(s / 60), "minute");
  if (s < 86400) return rtf.format(-Math.round(s / 3600), "hour");
  if (s < 86400 * 30) return rtf.format(-Math.round(s / 86400), "day");
  return formatDate(at, locale, { month: "short", day: "numeric" });
}
const fill = (t: string, vars: Record<string, string | number>) => t.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));

/** The groups in display order: Built-in, Your team, plugins as they appear, Community */
export function skillGroups(skills: readonly LibrarySkill[], order: readonly string[] = []): string[] {
  const seen: string[] = [];
  for (const s of skills) if (!seen.includes(s.group)) seen.push(s.group);
  const rank = (g: string) => {
    const i = order.indexOf(g);
    if (i >= 0) return i - 1000;
    if (FIRST.includes(g)) return FIRST.indexOf(g) - 500;
    if (LAST.includes(g)) return 500 + LAST.indexOf(g);
    return seen.indexOf(g);
  };
  return [...seen].sort((a, b) => rank(a) - rank(b));
}

/* puzzle, plus, upload, link, sparkles, search, arrow-up-circle: Lucide (ISC, lucide.dev) */
const ICON = svg`<path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"></path>`;
const glyph = (body: ReturnType<typeof svg>, cls = "ui-skl__glyph") =>
  html`<svg class=${cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const plusIcon = () => glyph(svg`<path d="M5 12h14"></path><path d="M12 5v14"></path>`);
const SOURCE_ICONS: Record<SkillLibraryAddSource, ReturnType<typeof svg>> = {
  upload: svg`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" x2="12" y1="3" y2="15"></line>`,
  url: svg`<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>`,
  create: svg`<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path>`,
};
const searchIcon = () => glyph(svg`<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>`, "ui-skl__search-icon");
const updateIcon = () => glyph(svg`<circle cx="12" cy="12" r="10"></circle><path d="m16 12-4-4-4 4"></path><path d="M12 16V8"></path>`);
const chevronDown = html`<svg class="ui-skl__chevron" viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M4.5 6.25 8 9.75l3.5-3.5"></path>`}</svg>`;
const SOURCES: SkillLibraryAddSource[] = ["upload", "url", "create"];

let instances = 0;

/**
 * The skills a workspace has added, grouped by who made them – search, source and on/off filters, a switch per skill,
 * Update when a newer version is out, and Add skill.
 * @tag tc-skill-library
 * @fires tc-enabled-change - A skill's switch was flipped ({ id, enabled, skill }: SkillEnabledChange); cancelable – prevented, the switch stays as it was
 * @fires tc-skills-change - The list changed after a switch ({ skills, id }: SkillLibrarySkillsChange); cancelable – prevented, `skills` stays as it was
 * @fires tc-query-change - The search changed ({ query }: SkillLibraryQueryChange); cancelable – prevented, `query` stays as it was
 * @fires tc-group-change - Another source was picked ({ group }: SkillLibraryGroupChange); cancelable – prevented, `group` stays as it was
 * @fires tc-show-change - All, On or Off was picked ({ show }: SkillLibraryShowChange); cancelable – prevented, `show` stays as it was
 * @fires tc-update - Update was pressed on a skill ({ id, version, skill }: SkillLibraryUpdate)
 * @fires tc-add - Upload, From a URL or Create was picked in Add skill ({ source }: SkillLibraryAdd)
 * @fires tc-skill-open - A skill's name was pressed ({ id, skill }: SkillLibraryOpen)
 */
export class TcSkillLibrary extends TcElement {
  static override ui = "skl";

  /** The heading */
  @property() accessor heading = "";
  /** A quieter line under the heading */
  @property() accessor description = "";
  /** The skills. Changed by the switches unless a tc-enabled-change or tc-skills-change listener calls preventDefault() */
  @property({ attribute: false }) accessor skills: LibrarySkill[] = [];
  /** The order of the source groups; groups not named sort after Built-in and Your team, Community last */
  @property({ attribute: false }) accessor groups: string[] = [];
  /** The search text. Changed by typing unless a tc-query-change listener calls preventDefault() */
  @property() accessor query = "";
  /** The source shown, or null for all. Changed by the Source select unless a tc-group-change listener calls preventDefault() */
  @property() accessor group: string | null = null;
  /** "all", "on" or "off". Changed by the Show select unless a tc-show-change listener calls preventDefault() */
  @property() accessor show: SkillLibraryShow = "all";
  /** Hide Add skill */
  @property({ type: Boolean, attribute: "hide-add" }) accessor hideAdd = false;
  /** The time now, epoch ms, for "3 h ago"; without it, last used shows as a date */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** For dates and relative times */
  @property() accessor locale: string | undefined = undefined;
  /** Words to rename, merged over defaultSkillLibraryLabels; {n}, {on}, {name}, {version} and {when} are filled in */
  @property({ attribute: false }) accessor labels: Partial<SkillLibraryLabels> = {};

  @state() private accessor menuOpen = false;
  @state() private accessor menuIndex = 0;
  @state() private accessor announce = "";

  private readonly uid = `tc-skl${++instances}`;

  constructor() {
    super();
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-skl__search-input"));
  }

  private get words(): SkillLibraryLabels {
    return { ...defaultSkillLibraryLabels, ...this.labels };
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    document.addEventListener("pointerdown", this.outside, true);
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("pointerdown", this.outside, true);
  }
  private outside = (e: PointerEvent) => {
    if (this.menuOpen && !e.composedPath().includes(this.querySelector(".ui-skl__adder") as EventTarget)) this.menuOpen = false;
  };

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (!this.hasAttribute("aria-label") || this.getAttribute("aria-label") !== (this.heading || this.words.heading)) this.setAttribute("aria-label", this.heading || this.words.heading);
    if ((changed.has("menuOpen") || changed.has("menuIndex")) && this.menuOpen) this.querySelectorAll<HTMLElement>(".ui-skl__item")[this.menuIndex]?.focus();
  }

  /** The skills the search and filters leave, in their groups */
  private get shown() {
    const q = this.query.trim().toLowerCase();
    return this.skills.filter(
      (s) =>
        (this.group === null || s.group === this.group) &&
        (this.show === "all" || (this.show === "on") === s.enabled) &&
        (!q || [s.name, s.description, s.triggers, s.group].some((t) => t?.toLowerCase().includes(q))),
    );
  }

  private flip(s: LibrarySkill) {
    const enabled = !s.enabled;
    if (!this.emit<SkillEnabledChange>("tc-enabled-change", { id: s.id, enabled, skill: s }, { cancelable: true })) return;
    const skills = this.skills.map((x) => (x.id === s.id ? { ...x, enabled } : x));
    if (!this.emit<SkillLibrarySkillsChange>("tc-skills-change", { skills, id: s.id }, { cancelable: true })) return;
    this.skills = skills;
    this.announce = fill(enabled ? this.words.announceOn : this.words.announceOff, { name: s.name });
  }

  private setQuery(query: string) {
    if (this.emit<SkillLibraryQueryChange>("tc-query-change", { query }, { cancelable: true })) this.query = query;
    else this.requestUpdate();
  }
  private setGroup(group: string | null) {
    if (this.emit<SkillLibraryGroupChange>("tc-group-change", { group }, { cancelable: true })) this.group = group;
    else this.requestUpdate();
  }
  private setShow(show: SkillLibraryShow) {
    if (this.emit<SkillLibraryShowChange>("tc-show-change", { show }, { cancelable: true })) this.show = show;
    else this.requestUpdate();
  }
  private clearFilters() {
    if (this.query) this.setQuery("");
    if (this.group !== null) this.setGroup(null);
    if (this.show !== "all") this.setShow("all");
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-skl__search-input")?.focus());
  }

  private closeMenu(focusButton = true) {
    this.menuOpen = false;
    if (focusButton) void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-skl__add")?.focus());
  }
  private pick(source: SkillLibraryAddSource) {
    this.closeMenu();
    this.emit<SkillLibraryAdd>("tc-add", { source });
  }
  private menuKey(e: KeyboardEvent) {
    const n = SOURCES.length;
    const keys: Record<string, () => void> = {
      ArrowDown: () => (this.menuIndex = (this.menuIndex + 1) % n),
      ArrowUp: () => (this.menuIndex = (this.menuIndex - 1 + n) % n),
      Home: () => (this.menuIndex = 0),
      End: () => (this.menuIndex = n - 1),
      Escape: () => this.closeMenu(),
      Tab: () => this.closeMenu(false),
    };
    const act = keys[e.key];
    if (!act) return;
    if (e.key !== "Tab") e.preventDefault();
    e.stopPropagation();
    act();
  }

  private renderAdd() {
    if (this.hideAdd) return nothing;
    const w = this.words;
    const menuId = `${this.uid}-menu`;
    return html`<div class="ui-skl__adder">
      <button
        type="button"
        class="tc-btn-sm ui-skl__add"
        aria-haspopup="menu"
        aria-expanded=${this.menuOpen ? "true" : "false"}
        aria-controls=${menuId}
        @click=${() => {
          this.menuIndex = 0;
          this.menuOpen = !this.menuOpen;
        }}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            this.menuIndex = e.key === "ArrowUp" ? SOURCES.length - 1 : 0;
            this.menuOpen = true;
          }
        }}
      >${plusIcon()}${w.add}</button>
      <div class="ui-skl__menu" id=${menuId} role="menu" aria-label=${w.add} ?hidden=${!this.menuOpen} @keydown=${(e: KeyboardEvent) => this.menuKey(e)}>
        ${SOURCES.map(
          (k, i) =>
            html`<button type="button" role="menuitem" class="ui-skl__item" data-source=${k} tabindex=${i === this.menuIndex ? "0" : "-1"} @click=${() => this.pick(k)}>${glyph(SOURCE_ICONS[k])}${w[k]}</button>`,
        )}
      </div>
    </div>`;
  }

  private renderRow(s: LibrarySkill) {
    const w = this.words;
    const id = `${this.uid}-${s.id}`;
    const used = s.lastUsed !== undefined ? fill(w.usedAgo, { when: ago(s.lastUsed, this.now, this.locale) }) : w.neverUsed;
    return html`<li class="ui-skl__row" ?data-off=${!s.enabled}>
      <div class="ui-skl__main">
        <span class="ui-skl__name-line">
          <button type="button" class="ui-skl__name" id=${`${id}-name`} data-focus-key=${`open:${s.id}`} @click=${() => this.emit<SkillLibraryOpen>("tc-skill-open", { id: s.id, skill: s })}>${s.name}</button>
          ${s.version ? html`<span class="ui-skl__version">${s.version}</span>` : nothing}
          ${s.update ? html`<span class="ui-skl__badge">${w.updateAvailable}</span>` : nothing}
        </span>
        ${s.description ? html`<span class="ui-skl__desc" id=${`${id}-desc`}>${s.description}</span>` : nothing}
        ${s.triggers ? html`<span class="ui-skl__triggers"><span class="tc-sr-only">${w.triggers}</span>${s.triggers}</span>` : nothing}
        <span class="ui-skl__used">${used}</span>
      </div>
      <div class="ui-skl__controls">
        ${s.update
          ? html`<button type="button" class="tc-btn-sm ui-skl__update" data-focus-key=${`update:${s.id}`} @click=${() => this.emit<SkillLibraryUpdate>("tc-update", { id: s.id, version: s.update!, skill: s })}>
              ${updateIcon()}${fill(w.update, { version: s.update })}<span class="tc-sr-only"> – ${s.name}</span>
            </button>`
          : nothing}
        <span class="ui-skl__state" aria-hidden="true">${s.enabled ? w.on : w.off}</span>
        <button
          type="button"
          role="switch"
          class="ui-skl__switch"
          data-focus-key=${`switch:${s.id}`}
          aria-checked=${s.enabled ? "true" : "false"}
          aria-label=${fill(w.turnOn, { name: s.name })}
          @click=${() => this.flip(s)}
        ><span></span></button>
      </div>
    </li>`;
  }

  protected override render() {
    const w = this.words;
    const titleId = `${this.uid}-title`;
    const on = this.skills.filter((s) => s.enabled).length;
    const groups = skillGroups(this.skills, this.groups);
    const shown = this.shown;
    const filtered = !!this.query.trim() || this.group !== null || this.show !== "all";
    const shownGroups = groups.filter((g) => shown.some((s) => s.group === g));
    return html`${cardHead({
        icon: ICON,
        title: this.heading || w.heading,
        subtitle: this.description || undefined,
        id: titleId,
        aside: html`<span class="ui-skl__aside"><span class="ui-skl__count">${fill(w.count, { n: this.skills.length, on })}</span>${this.renderAdd()}</span>`,
      })}
      <div class="ui-skl__card">
        ${this.skills.length
          ? html`<div class="ui-skl__tools">
              <label class="ui-skl__search">
                ${searchIcon()}<span class="tc-sr-only">${w.search}</span>
                <input class="ui-skl__search-input" type="search" placeholder=${w.search} autocomplete="off" .value=${live(this.query)} @input=${(e: Event) => this.setQuery((e.target as HTMLInputElement).value)} />
              </label>
              <label class="ui-skl__filter">
                <span class="ui-skl__filter-label">${w.source}</span>
                <span class="ui-skl__select">
                  <select class="ui-skl__group" @change=${(e: Event) => this.setGroup((e.target as HTMLSelectElement).value || null)}>
                    <option value="" .selected=${live(this.group === null)}>${w.allSources}</option>
                    ${groups.map((g) => html`<option value=${g} .selected=${live(this.group === g)}>${g}</option>`)}
                  </select>${chevronDown}
                </span>
              </label>
              <label class="ui-skl__filter">
                <span class="ui-skl__filter-label">${w.show}</span>
                <span class="ui-skl__select">
                  <select class="ui-skl__show" @change=${(e: Event) => this.setShow((e.target as HTMLSelectElement).value as SkillLibraryShow)}>
                    <option value="all" .selected=${live(this.show === "all")}>${w.showAll}</option>
                    <option value="on" .selected=${live(this.show === "on")}>${w.showOn}</option>
                    <option value="off" .selected=${live(this.show === "off")}>${w.showOff}</option>
                  </select>${chevronDown}
                </span>
              </label>
            </div>`
          : nothing}
        ${!this.skills.length
          ? html`<p class="ui-skl__empty">${w.empty}</p>`
          : !shown.length
            ? html`<div class="ui-skl__empty"><p>${w.noMatches}</p>${filtered ? html`<button type="button" class="tc-btn-sm ui-skl__clear" @click=${() => this.clearFilters()}>${w.clear}</button>` : nothing}</div>`
            : shownGroups.map((g, i) => {
                const gid = `${this.uid}-g${i}`;
                const rows = shown.filter((s) => s.group === g);
                return html`<section class="ui-skl__group-block" aria-labelledby=${gid}>
                  <h4 class="ui-skl__group-title" id=${gid}>${g}<span class="ui-skl__group-n">${rows.length}</span></h4>
                  <ul class="ui-skl__list" aria-labelledby=${gid}>${repeat(rows, (s) => s.id, (s) => this.renderRow(s))}</ul>
                </section>`;
              })}
      </div>
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
[data-ui="skl"] {
  position: relative; display: block; box-sizing: border-box; width: 100%; min-width: 0;
  container-type: inline-size; color: var(--tc-text-primary); font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); text-align: left; -webkit-font-smoothing: antialiased;
  --tc-skl-menu-w: 176px;
}
[data-ui="skl"] *, [data-ui="skl"] *::before, [data-ui="skl"] *::after { box-sizing: border-box; }
:where([data-ui="skl"]) :is(p, ul, h4) { margin: 0; padding: 0; }
:where([data-ui="skl"]) ul { list-style: none; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="skl"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *) .ui-skl__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="skl"] { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="skl"] svg[stroke-width] { stroke-width: 1.5; }
.ui-skl__glyph { flex: none; width: var(--tc-space-4); height: var(--tc-space-4); }
.ui-skl__aside { display: inline-flex; align-items: center; gap: var(--tc-space-2); }
.ui-skl__count { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; white-space: nowrap; }

/* Add skill */
.ui-skl__adder { position: relative; }
.ui-skl__menu { position: absolute; z-index: var(--tc-z-popover); top: calc(100% + var(--tc-space-1)); right: 0; display: grid; min-width: var(--tc-skl-menu-w); padding: var(--tc-space-1); border-radius: var(--tc-radius-md); background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-overlay); }
.ui-skl__menu[hidden] { display: none; }
.ui-skl__item { display: flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); margin: 0; padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: var(--tc-text-primary); font: inherit; text-align: left; cursor: pointer; }
.ui-skl__item:hover, .ui-skl__item:focus-visible { background: var(--tc-fill-hover); outline: none; }
.ui-skl__item:focus-visible { box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }

/* Search and filters */
.ui-skl__tools { display: flex; flex-wrap: wrap; align-items: end; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *) .ui-skl__tools { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-skl__search { position: relative; display: block; flex: 1 1 12rem; min-width: 0; }
.ui-skl__search-icon { position: absolute; top: 50%; left: var(--tc-field-px); width: var(--tc-space-4); height: var(--tc-space-4); color: var(--tc-icon-muted); transform: translateY(-50%); pointer-events: none; }
.ui-skl__search-input, .ui-skl__select > select { width: 100%; min-width: 0; height: var(--tc-field-h); margin: 0; padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); outline: 0; background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); }
.ui-skl__search-input { padding-left: calc(var(--tc-field-px) + var(--tc-space-6)); }
.ui-skl__search-input::placeholder { color: var(--tc-text-placeholder); }
.ui-skl__search-input:hover, .ui-skl__select > select:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-skl__search-input:focus-visible, .ui-skl__select > select:focus-visible { box-shadow: var(--tc-field-shadow-focus); }
.ui-skl__filter { display: grid; gap: var(--tc-space-1); min-width: 0; }
.ui-skl__filter-label { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); }
.ui-skl__select { position: relative; display: block; }
.ui-skl__select > select { padding-right: var(--tc-space-7); appearance: none; cursor: pointer; }
.ui-skl__chevron { position: absolute; top: 50%; right: var(--tc-space-2); width: var(--tc-space-3-5); height: var(--tc-space-3-5); fill: none; stroke: var(--tc-icon-muted); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; transform: translateY(-50%); pointer-events: none; }

/* Groups and rows */
.ui-skl__group-block { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-skl__group-title { display: flex; align-items: baseline; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-1); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-tracking-caps); text-transform: uppercase; }
.ui-skl__group-n { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-skl__list { display: grid; }
.ui-skl__row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: start; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-2-5) var(--tc-space-4); }
.ui-skl__row + .ui-skl__row { box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-skl__main { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-skl__name-line { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); }
.ui-skl__name { min-height: var(--tc-space-6); margin: 0; padding: 0; border: 0; background: none; color: var(--tc-text-primary); font: inherit; font-weight: var(--tc-font-weight-medium); text-align: left; cursor: pointer; overflow-wrap: anywhere; }
.ui-skl__name:hover { text-decoration: underline; }
.ui-skl__name:focus-visible { border-radius: var(--tc-radius-sm); outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-skl__row[data-off] .ui-skl__name { color: var(--tc-text-secondary); }
.ui-skl__version { color: var(--tc-text-muted); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); }
.ui-skl__badge { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *) .ui-skl__badge { background: none; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-skl__desc { color: var(--tc-text-secondary); line-height: var(--tc-line-height-snug); }
.ui-skl__triggers { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); font-style: italic; }
.ui-skl__used { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-skl__controls { display: flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); }
.ui-skl__state { min-width: var(--tc-space-6); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); text-align: right; }
.ui-skl__empty { display: grid; justify-items: start; gap: var(--tc-space-2); padding: var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-text-muted); }

/* The switch pattern; the off track is --tc-switch-off (≥ 3:1), on is the accent */
.ui-skl__switch { position: relative; flex: none; width: var(--tc-switch-w); height: var(--tc-switch-h); margin: 0; padding: 0; border: 0; border-radius: var(--tc-switch-radius); background: var(--tc-switch-off); cursor: pointer; transition: background-color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-skl__switch[aria-checked="true"] { background: var(--tc-switch-on); }
.ui-skl__switch span { position: absolute; top: var(--tc-space-0-5); left: var(--tc-space-0-5); width: var(--tc-switch-knob); height: var(--tc-switch-knob); border-radius: calc(var(--tc-switch-radius) - var(--tc-space-0-5)); background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control); transition: transform var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-skl__switch[aria-checked="true"] span { transform: translateX(calc(var(--tc-switch-w) - var(--tc-switch-h))); }
.ui-skl__switch:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* A hit area of at least 24 × 24 around the small switch */
.ui-skl__switch::after { content: ""; position: absolute; inset: calc(-1 * var(--tc-space-2)) calc(-1 * var(--tc-space-1-5)); }

/* Narrow: filters stack, the controls go under the text */
@container (max-width: 420px) {
  .ui-skl__tools { padding: var(--tc-space-3); }
  .ui-skl__filter { flex: 1 1 40%; }
  .ui-skl__row { grid-template-columns: minmax(0, 1fr); padding-inline: var(--tc-space-3); }
  .ui-skl__controls { justify-content: flex-end; }
  .ui-skl__group-title { padding-inline: var(--tc-space-3); }
}
@media (forced-colors: active) {
  .ui-skl__switch { border: 1px solid ButtonText; }
  .ui-skl__switch[aria-checked="true"] { background: Highlight; }
  .ui-skl__switch span { background: ButtonText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="skl"] *, [data-ui="skl"] *::before, [data-ui="skl"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-skill-library")) customElements.define("tc-skill-library", TcSkillLibrary);

declare global {
  interface HTMLElementTagNameMap {
    "tc-skill-library": TcSkillLibrary;
  }
}
