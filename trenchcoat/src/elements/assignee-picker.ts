import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";

/*
 * <tc-assignee-picker> – who owns a case or a task: a person, a team, or the next person in a team's round-robin. A
 * chip shows the assignee (initials and name, a team mark, or Unassigned); it opens a search over the options:
 *   · Assign to me first (with `me`), then People – each with their team, how much they already have ("7 open"), a
 *     load bar against their `capacity`, and Away in words – then Teams, each with its members and open items, and
 *     Round-robin under a team that takes turns ("next in Fraud review"); Unassign last, when someone has it
 *   · people over capacity sort after the rest and say so
 *   · the search field keeps focus: ↑ / ↓ move through the options, Enter picks, Escape closes, typing filters
 * `value` is the element's own unless a tc-value-change listener calls preventDefault() – the page saves the change.
 * The chip is the same in Standard and Clean; the list opens on the menu surface in both.
 *
 *   <tc-assignee-picker me="noor" .people=${[{ id: "noor", name: "Noor Haddad", team: "Fraud review", open: 7, capacity: 12 }]}></tc-assignee-picker>
 */

export type AssigneePerson = {
  id: string;
  name: string;
  team?: string;
  /** How many items they already have */
  open?: number;
  /** How many they can carry – the load bar's full width */
  capacity?: number;
  /** Away – still pickable, said in words */
  away?: boolean;
};
export type AssigneeTeam = {
  id: string;
  name: string;
  /** How many people are in it */
  members?: number;
  /** How many items the team has open */
  open?: number;
  /** Takes turns: offers Round-robin under the team */
  roundRobin?: boolean;
};
export type AssigneeValue = { type: "person" | "team" | "round-robin"; id: string };
export type AssigneePickerValueChange = { value: AssigneeValue | null };

export type AssigneePickerLabels = {
  /** The chip's name before the assignee, e.g. "Assignee" */
  label: string;
  unassigned: string;
  search: string;
  assignToMe: string;
  people: string;
  teams: string;
  /** "{n} open" */
  open: string;
  /** "{n} people" */
  members: string;
  away: string;
  overCapacity: string;
  roundRobin: string;
  /** "next in {team}" */
  roundRobinNote: string;
  unassign: string;
  noMatch: string;
  /** Announced after a pick: "Assigned to {name}" */
  assigned: string;
  /** Announced after Unassign */
  cleared: string;
};

export const defaultAssigneePickerLabels: AssigneePickerLabels = {
  label: "Assignee",
  unassigned: "Unassigned",
  search: "Search people and teams",
  assignToMe: "Assign to me",
  people: "People",
  teams: "Teams",
  open: "{n} open",
  members: "{n} people",
  away: "Away",
  overCapacity: "Over capacity",
  roundRobin: "Round-robin",
  roundRobinNote: "next in {team}",
  unassign: "Unassign",
  noMatch: "No one matches",
  assigned: "Assigned to {name}",
  cleared: "Unassigned",
};

const fill = (label: string, values: Record<string, string | number>) => label.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
/** "Noor Haddad" → "NH" */
export function assigneeInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "")).toUpperCase();
}
const over = (p: AssigneePerson) => p.capacity != null && p.open != null && p.open > p.capacity;

/* Icons: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const usersIcon = svg`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>`;
const cycleIcon = svg`<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path><path d="M16 16h5v5"></path>`;
const chevronIcon = svg`<path d="m6 9 6 6 6-6"></path>`;
const searchIcon = svg`<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>`;
const xIcon = svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`;
const checkIcon = svg`<path d="M20 6 9 17l-5-5"></path>`;

/** One option in the list */
type Option = { key: string; group: "me" | "people" | "teams" | "clear"; value: AssigneeValue | null; name: string; person?: AssigneePerson; team?: AssigneeTeam; rr?: boolean };

let uidCount = 0;

/**
 * Assign a case or task to a person, a team or a team's round-robin – with each person's open items, a load bar against their capacity, Away and Over capacity in words, and Assign to me.
 * @tag tc-assignee-picker
 * @fires tc-value-change - An assignee was picked, or Unassign ({ value }: AssigneePickerValueChange); cancelable – prevented, `value` stays as it was
 */
export class TcAssigneePicker extends TcElement {
  static override ui = "asg";

  /** The people who can be assigned */
  @property({ attribute: false }) accessor people: AssigneePerson[] = [];
  /** The teams that can be assigned */
  @property({ attribute: false }) accessor teams: AssigneeTeam[] = [];
  /** The reader's own person id – offers Assign to me */
  @property() accessor me: string | undefined = undefined;
  /** Who has it: a person, a team or a team's round-robin, or null. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property({ attribute: false }) accessor value: AssigneeValue | null = null;
  /** The chip's name before the assignee (default "Assignee") */
  @property() accessor label: string | undefined = undefined;
  /** Can't be changed */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  /** Rename any of the words, over the defaults */
  @property({ attribute: false }) accessor labels: Partial<AssigneePickerLabels> = {};

  @state() private accessor open = false;
  @state() private accessor query = "";
  /** The option under the arrow keys, by key */
  @state() private accessor activeKey = "";
  @state() private accessor announce = "";

  private uid = `tc-asg-${++uidCount}`;

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("pointerdown", this.onOutside, true);
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("disabled") && this.disabled && this.open) this.close(false);
    if (this.open && (changed.has("query") || changed.has("open") || changed.has("people") || changed.has("teams"))) {
      const opts = this.options;
      if (!opts.some((o) => o.key === this.activeKey)) this.activeKey = (opts.find((o) => this.isCurrent(o.value)) ?? opts[0])?.key ?? "";
    }
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("activeKey") && this.activeKey) this.querySelector(`#${CSS.escape(this.optionId(this.activeKey))}`)?.scrollIntoView?.({ block: "nearest" });
  }

  /* ---------- The model ---------- */

  private word<K extends keyof AssigneePickerLabels>(key: K) {
    if (key === "label" && this.label) return this.label;
    return this.labels[key] ?? defaultAssigneePickerLabels[key];
  }
  private optionId(key: string) {
    return `${this.uid}-o-${key.replace(/[^\w-]/g, "_")}`;
  }
  private isCurrent(v: AssigneeValue | null) {
    const cur = this.value;
    return !!v && !!cur && v.type === cur.type && v.id === cur.id;
  }

  /** What `value` names: its display name and kind */
  private get current(): { name: string; person?: AssigneePerson; team?: AssigneeTeam; rr?: boolean } | null {
    const v = this.value;
    if (!v) return null;
    if (v.type === "person") {
      const person = this.people.find((p) => p.id === v.id);
      return person ? { name: person.name, person } : { name: v.id };
    }
    const team = this.teams.find((t) => t.id === v.id);
    const name = team?.name ?? v.id;
    return v.type === "team" ? { name, team } : { name: `${this.word("roundRobin")} · ${name}`, team, rr: true };
  }

  /** The options shown for the search, in order: Assign to me, People (over capacity last), Teams with round-robin, Unassign */
  private get options(): Option[] {
    const q = this.query.trim().toLowerCase();
    const hit = (...s: (string | undefined)[]) => !q || s.some((x) => x?.toLowerCase().includes(q));
    const out: Option[] = [];
    const me = this.me ? this.people.find((p) => p.id === this.me) : undefined;
    if (me && hit(me.name, this.word("assignToMe")) && !(this.value?.type === "person" && this.value.id === me.id))
      out.push({ key: "me", group: "me", value: { type: "person", id: me.id }, name: this.word("assignToMe"), person: me });
    const people = this.people.filter((p) => hit(p.name, p.team));
    const ordered = [...people.filter((p) => !over(p)), ...people.filter(over)];
    for (const p of ordered) out.push({ key: `p:${p.id}`, group: "people", value: { type: "person", id: p.id }, name: p.name, person: p });
    for (const t of this.teams) {
      const teamHit = hit(t.name);
      if (teamHit) out.push({ key: `t:${t.id}`, group: "teams", value: { type: "team", id: t.id }, name: t.name, team: t });
      if (t.roundRobin && (teamHit || hit(this.word("roundRobin")))) out.push({ key: `r:${t.id}`, group: "teams", value: { type: "round-robin", id: t.id }, name: this.word("roundRobin"), team: t, rr: true });
    }
    if (this.value && !q) out.push({ key: "clear", group: "clear", value: null, name: this.word("unassign") });
    return out;
  }

  /* ---------- Acting ---------- */

  private toggle() {
    if (this.disabled) return;
    if (this.open) this.close(true);
    else this.show();
  }
  private show() {
    this.query = "";
    this.activeKey = "";
    this.open = true;
    document.addEventListener("pointerdown", this.onOutside, true);
    void this.updateComplete.then(() => this.querySelector<HTMLInputElement>(".ui-asg__search-input")?.focus());
  }
  private close(refocus: boolean) {
    this.open = false;
    document.removeEventListener("pointerdown", this.onOutside, true);
    if (refocus) void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-asg__trigger")?.focus());
  }
  private onOutside = (e: Event) => {
    if (!this.contains(e.target as Node)) this.close(false);
  };

  private pick(o: Option) {
    const value = o.value;
    if (this.isCurrent(value)) {
      this.close(true);
      return;
    }
    if (!this.emit<AssigneePickerValueChange>("tc-value-change", { value }, { cancelable: true })) return;
    this.value = value;
    this.announce = value ? fill(this.word("assigned"), { name: o.group === "me" ? o.person!.name : o.rr ? `${this.word("roundRobin")}, ${o.team!.name}` : o.name }) : this.word("cleared");
    this.close(true);
  }

  private onKey = (e: KeyboardEvent) => {
    const opts = this.options;
    const i = opts.findIndex((o) => o.key === this.activeKey);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!opts.length) return;
      const next = opts[(i + (e.key === "ArrowDown" ? 1 : -1) + opts.length) % opts.length];
      this.activeKey = next.key;
    } else if (e.key === "PageDown" || e.key === "PageUp") {
      e.preventDefault();
      this.activeKey = (e.key === "PageUp" ? opts[0] : opts[opts.length - 1])?.key ?? "";
    } else if (e.key === "Enter") {
      e.preventDefault();
      const o = opts[i];
      if (o) this.pick(o);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.close(true);
    } else if (e.key === "Tab") {
      this.close(false);
    }
  };

  /* ---------- Rendering ---------- */

  private avatar(person: AssigneePerson | undefined, name: string) {
    return html`<span class="ui-asg__avatar" aria-hidden="true">${assigneeInitials(person?.name ?? name)}</span>`;
  }
  private teamMark(rr = false) {
    return html`<span class="ui-asg__avatar" data-team aria-hidden="true">${lucide(12, rr ? cycleIcon : usersIcon)}</span>`;
  }

  private renderOption(o: Option) {
    const active = o.key === this.activeKey;
    const selected = this.isCurrent(o.value);
    let mark: unknown;
    let meta: string[] = [];
    let extra: unknown = nothing;
    if (o.group === "clear") mark = html`<span class="ui-asg__avatar" data-empty aria-hidden="true">${lucide(12, xIcon)}</span>`;
    else if (o.team) {
      mark = this.teamMark(o.rr);
      meta = o.rr ? [fill(this.word("roundRobinNote"), { team: o.team.name })] : [o.team.members != null ? fill(this.word("members"), { n: o.team.members }) : "", o.team.open != null ? fill(this.word("open"), { n: o.team.open }) : ""];
    } else if (o.person) {
      const p = o.person;
      mark = this.avatar(p, o.name);
      meta = [o.group === "me" ? p.name : (p.team ?? ""), p.open != null ? fill(this.word("open"), { n: p.open }) : ""];
      const load = p.capacity && p.open != null ? Math.min(1, p.open / p.capacity) : null;
      extra = html`${load != null && o.group !== "me" ? html`<span class="ui-asg__load" aria-hidden="true" ?data-over=${over(p)}><span style=${`inline-size: ${Math.round(load * 100)}%`}></span></span>` : nothing}
        ${p.away && o.group !== "me" ? html`<span class="ui-asg__flag">${this.word("away")}</span>` : nothing}
        ${over(p) && o.group !== "me" ? html`<span class="ui-asg__flag" data-over>${this.word("overCapacity")}</span>` : nothing}`;
    }
    const metaText = meta.filter(Boolean).join(" · ");
    return html`<div
      class="ui-asg__option"
      role="option"
      id=${this.optionId(o.key)}
      aria-selected=${selected ? "true" : "false"}
      ?data-active=${active}
      ?data-rr=${!!o.rr}
      data-group=${o.group}
      @pointerdown=${(e: PointerEvent) => e.preventDefault()}
      @click=${() => this.pick(o)}
      @pointermove=${() => !active && (this.activeKey = o.key)}
    >
      ${mark}
      <span class="ui-asg__text">
        <span class="ui-asg__name">${o.name}</span>
        ${metaText ? html`<span class="ui-asg__meta">${metaText}</span>` : nothing}
      </span>
      <span class="ui-asg__extra">${extra}</span>
      <span class="ui-asg__check" aria-hidden="true">${selected ? lucide(14, checkIcon) : nothing}</span>
    </div>`;
  }

  private renderList() {
    const opts = this.options;
    const listId = `${this.uid}-list`;
    const group = (key: Option["group"], title: string | null) => {
      const items = opts.filter((o) => o.group === key);
      if (!items.length) return nothing;
      const labelId = `${this.uid}-g-${key}`;
      return html`<div class="ui-asg__group" role="group" aria-labelledby=${ifDefined(title ? labelId : undefined)} aria-label=${ifDefined(title ? undefined : items[0].name)}>
        ${title ? html`<div class="ui-asg__group-title" id=${labelId} role="presentation">${title}</div>` : nothing}
        ${items.map((o) => this.renderOption(o))}
      </div>`;
    };
    const active = opts.find((o) => o.key === this.activeKey);
    return html`<div class="ui-asg__pop" role="dialog" aria-label=${this.word("label")} @keydown=${this.onKey}>
      <div class="ui-asg__search">
        ${lucide(14, searchIcon)}
        <input
          class="ui-asg__search-input"
          role="combobox"
          aria-expanded="true"
          aria-controls=${listId}
          aria-autocomplete="list"
          aria-activedescendant=${ifDefined(active ? this.optionId(active.key) : undefined)}
          aria-label=${this.word("search")}
          placeholder=${this.word("search")}
          autocomplete="off"
          .value=${this.query}
          @input=${(e: InputEvent) => (this.query = (e.target as HTMLInputElement).value)}
        />
      </div>
      <div class="ui-asg__list" id=${listId} role="listbox" aria-label=${this.word("label")}>
        ${group("me", null)} ${group("people", this.word("people"))} ${group("teams", this.word("teams"))} ${group("clear", null)}
        ${opts.length ? nothing : html`<div class="ui-asg__empty" role="presentation">${this.word("noMatch")}</div>`}
      </div>
    </div>`;
  }

  protected override render() {
    const cur = this.current;
    const name = cur?.name ?? this.word("unassigned");
    const mark = !cur ? html`<span class="ui-asg__avatar" data-empty aria-hidden="true"></span>` : cur.team || cur.rr ? this.teamMark(cur.rr) : this.avatar(cur.person, cur.name);
    return html`<button
        type="button"
        class="ui-asg__trigger"
        aria-haspopup="dialog"
        aria-expanded=${this.open ? "true" : "false"}
        ?disabled=${this.disabled}
        ?data-empty=${!cur}
        @click=${() => this.toggle()}
      >
        ${mark}
        <span class="tc-sr-only">${this.word("label")}: </span><span class="ui-asg__current">${name}</span>
        ${this.disabled ? nothing : html`<span class="ui-asg__chevron" aria-hidden="true">${lucide(12, chevronIcon)}</span>`}
      </button>
      ${this.open ? this.renderList() : nothing}
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
[data-ui="asg"] {
  --tc-asg-avatar: var(--tc-space-5); --tc-asg-pop-w: calc(var(--tc-space-16) * 5); --tc-asg-load-w: var(--tc-space-10);
  position: relative; display: inline-block; max-width: 100%; vertical-align: middle;
  font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="asg"] *, [data-ui="asg"] *::before, [data-ui="asg"] *::after { box-sizing: border-box; }
[data-ui="asg"] svg { display: block; flex: none; }
.ui-asg__trigger { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); max-width: 100%; min-height: var(--tc-control-h-sm); margin: 0; padding: 0 var(--tc-space-2) 0 var(--tc-space-1); border: 0; border-radius: var(--tc-radius-full); font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *) .ui-asg__trigger { background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *) .ui-asg__trigger:hover:not(:disabled) { background: var(--tc-fill-hover); }
:where([data-look="clean"], [data-look="clean"] *) .ui-asg__trigger { background: var(--tc-surface-raised); box-shadow: var(--tc-field-shadow); }
:where([data-look="clean"], [data-look="clean"] *) .ui-asg__trigger:hover:not(:disabled) { box-shadow: var(--tc-field-shadow-hover); }
.ui-asg__trigger:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-asg__trigger:disabled { cursor: default; color: var(--tc-text-secondary); }
.ui-asg__trigger[data-empty] .ui-asg__current { color: var(--tc-text-secondary); }
.ui-asg__current { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-asg__chevron { color: var(--tc-icon-muted); }
.ui-asg__avatar { display: inline-grid; place-items: center; flex: none; width: var(--tc-asg-avatar); height: var(--tc-asg-avatar); border-radius: var(--tc-radius-full); background: var(--tc-fill-selected); color: var(--tc-text-primary); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); letter-spacing: normal; }
.ui-asg__avatar[data-team] { border-radius: var(--tc-radius-sm); background: var(--tc-fill-hover); color: var(--tc-text-secondary); }
.ui-asg__avatar[data-empty] { background: transparent; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); color: var(--tc-icon-muted); }
.ui-asg__pop { position: absolute; top: calc(100% + var(--tc-space-1)); left: 0; z-index: var(--tc-z-dropdown); display: grid; grid-template-rows: auto minmax(0, 1fr); width: min(var(--tc-asg-pop-w), calc(100vw - var(--tc-space-8))); max-height: calc(var(--tc-space-16) * 6); border-radius: var(--tc-menu-radius); background: var(--tc-menu-bg); box-shadow: var(--tc-menu-shadow); animation: ui-asg-drop var(--tc-duration-fast) var(--tc-ease-move) both; }
.ui-asg__search { display: flex; align-items: center; gap: var(--tc-space-1-5); padding: var(--tc-space-1-5) var(--tc-space-2); border-bottom: var(--tc-hairline) solid var(--tc-border-default); color: var(--tc-icon-muted); }
.ui-asg__search-input { flex: 1 1 auto; min-width: 0; height: var(--tc-control-h-sm); padding: 0; border: 0; background: transparent; font: inherit; color: var(--tc-text-primary); }
.ui-asg__search-input:focus { outline: none; }
.ui-asg__search-input::placeholder { color: var(--tc-text-muted); }
.ui-asg__list { overflow-y: auto; padding: var(--tc-menu-padding); overscroll-behavior: contain; }
.ui-asg__group + .ui-asg__group { margin-top: var(--tc-space-1); padding-top: var(--tc-space-1); border-top: var(--tc-hairline) solid var(--tc-border-default); }
.ui-asg__group-title { padding: var(--tc-space-1) var(--tc-menu-item-px); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-asg__option { display: grid; grid-template-columns: auto minmax(0, 1fr) auto var(--tc-space-4); align-items: center; gap: var(--tc-space-2); min-height: var(--tc-menu-item-h); padding: var(--tc-space-1) var(--tc-menu-item-px); border-radius: var(--tc-menu-item-radius); cursor: pointer; }
.ui-asg__option[data-rr] { padding-left: calc(var(--tc-menu-item-px) + var(--tc-space-4)); }
.ui-asg__option[data-active] { background: var(--tc-menu-item-hover); }
.ui-asg__option[aria-selected="true"] .ui-asg__name { font-weight: var(--tc-font-weight-medium); }
.ui-asg__text { display: grid; min-width: 0; }
.ui-asg__name, .ui-asg__meta { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-asg__meta { font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); }
.ui-asg__extra { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-asg__load { position: relative; display: block; width: var(--tc-asg-load-w); height: var(--tc-space-1); border-radius: var(--tc-radius-full); background: var(--tc-fill-hover); overflow: hidden; }
.ui-asg__load > span { position: absolute; inset: 0 auto 0 0; border-radius: inherit; background: var(--tc-status-success-fg); }
.ui-asg__load[data-over] > span { background: var(--tc-status-warning-fg); }
.ui-asg__flag { padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-full); background: var(--tc-fill-hover); font-size: var(--tc-font-size-2xs); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-asg__flag[data-over] { color: var(--tc-status-warning-fg); }
.ui-asg__check { color: var(--tc-accent-text); }
.ui-asg__empty { padding: var(--tc-space-3); color: var(--tc-text-secondary); text-align: center; }
@keyframes ui-asg-drop { from { opacity: 0; transform: translateY(-4px); } }
@media (prefers-reduced-motion: reduce) {
  .ui-asg__pop { animation: none; }
  .ui-asg__trigger { transition: none; }
}
@media (forced-colors: active) {
  .ui-asg__trigger { border: 1px solid ButtonText; }
  .ui-asg__option[data-active] { outline: 2px solid Highlight; }
  .ui-asg__load > span { background: CanvasText; }
}
`;
}

if (!customElements.get("tc-assignee-picker")) customElements.define("tc-assignee-picker", TcAssigneePicker);
declare global {
  interface HTMLElementTagNameMap {
    "tc-assignee-picker": TcAssigneePicker;
  }
}
