import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-spend-limits> – spend caps per member, team or API key. The workspace's default cap sits at the top; under it a
 * row per limit says who or what it's for, spent of the cap in words and as a bar, the period, and what happens at the
 * cap (block, warn or notify). Rows over their cap come first and say by how much. The cap is edited in place (Enter
 * saves, Escape cancels), the action is a select, Remove takes a row away, and Add limit picks a kind and a member,
 * team or key from the page's list.
 *   · each row's controls are native, in reading order; changes fire a cancelable tc-limits-change with every limit
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-spend-limits currency="USD" .limits=${[{ id: "l1", kind: "team", name: "Audit", limit: 2000, spent: 1640, period: "month", action: "warn" }]}></tc-spend-limits>
 */

/** A gauge: Lucide (ISC, lucide.dev) */
const gaugeIcon = svg`<path d="m12 14 4-4"></path><path d="M3.34 19a10 10 0 1 1 17.32 0"></path>`;

export type SpendLimitKind = "member" | "team" | "key";
export type SpendLimitPeriod = "month" | "day";
export type SpendLimitAction = "block" | "warn" | "notify";

export type SpendLimit = {
  id: string;
  kind: SpendLimitKind;
  /** The member's, team's or key's name */
  name: string;
  /** The cap, in `currency` */
  limit: number;
  /** Spent so far this period, in `currency` */
  spent: number;
  period: SpendLimitPeriod;
  /** What happens at the cap */
  action: SpendLimitAction;
};
/** A member, team or key the page offers for a new limit */
export type SpendLimitTarget = { kind: SpendLimitKind; id: string; name: string };
/** The cap every member gets unless a row says otherwise */
export type SpendDefaultLimit = { limit: number; period: SpendLimitPeriod; action: SpendLimitAction };

/** Details of the events */
export type SpendLimitsChange = { limits: SpendLimit[]; change: "edit" | "action" | "add" | "remove"; id: string };
export type SpendDefaultLimitChange = { defaultLimit: SpendDefaultLimit };

export const spendLimitKindWords: Record<SpendLimitKind, string> = { member: "Member", team: "Team", key: "API key" };
export const spendLimitActionWords: Record<SpendLimitAction, string> = { block: "Block", warn: "Warn", notify: "Notify" };
const periodWords: Record<SpendLimitPeriod, string> = { month: "a month", day: "a day" };

/** A cap typed by a person: a positive number, with a currency sign, spaces and thousands separators ignored; null when it isn't one */
export function parseLimit(text: string): number | null {
  const clean = text.replace(/[^\d.,-]/g, "").replace(/,(?=\d{3}\b)/g, "").replace(",", ".");
  const n = Number(clean);
  return clean && Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

let uidCount = 0;

/**
 * Spend limits: caps per member, team or API key with spent of the cap in words and a bar, what happens at the cap,
 * over-limit rows first, a workspace default, in-place editing, add and remove.
 * @tag tc-spend-limits
 * @fires tc-limits-change - A limit was edited, added or removed, or its action changed ({ limits, change, id }: SpendLimitsChange); cancelable – prevented, `limits` stays as it was
 * @fires tc-default-limit-change - The workspace default was edited ({ defaultLimit }: SpendDefaultLimitChange); cancelable – prevented, `defaultLimit` stays as it was
 */
export class TcSpendLimits extends TcElement {
  static override ui = "spl";

  /** The heading */
  @property() accessor heading = "Spend limits";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The limits. Changed by editing unless a tc-limits-change listener calls preventDefault() */
  @property({ attribute: false }) accessor limits: SpendLimit[] = [];
  /** The workspace's default cap, or null for none. Changed by editing unless a tc-default-limit-change listener calls preventDefault() */
  @property({ attribute: false }) accessor defaultLimit: SpendDefaultLimit | null = null;
  /** Members, teams and keys that Add limit offers; ones that already have a limit are left out */
  @property({ attribute: false }) accessor targets: SpendLimitTarget[] = [];
  /** The currency, an ISO 4217 code */
  @property() accessor currency = "USD";
  /** The language for numbers, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  /** The limit whose cap is being edited ("default" for the workspace default), or null */
  @state() private accessor editing: string | null = null;
  /** The edit field's problem, in words */
  @state() private accessor error = "";
  /** The Add limit form is open */
  @state() private accessor adding = false;
  /** The kind picked in the Add limit form */
  @state() private accessor addKind: SpendLimitKind = "member";
  /** The problem with the Add limit form, in words */
  @state() private accessor addError = "";
  /** A polite message for screen readers */
  @state() private accessor announce = "";

  private uid = `tc-spl-${++uidCount}`;

  /* ---------- Formatting ---------- */

  private money(v: number) {
    try {
      return new Intl.NumberFormat(this.locale, { style: "currency", currency: this.currency, maximumFractionDigits: v % 1 ? 2 : 0 }).format(v);
    } catch {
      return new Intl.NumberFormat(this.locale, { maximumFractionDigits: 2 }).format(v);
    }
  }
  private pct(v: number) {
    return new Intl.NumberFormat(this.locale, { style: "percent", maximumFractionDigits: 0 }).format(v);
  }
  /** "$420 of $500 a month, 84%" – and "over by $40" past the cap */
  usedWords(l: Pick<SpendLimit, "spent" | "limit" | "period">) {
    const share = l.limit > 0 ? l.spent / l.limit : 0;
    const over = l.spent - l.limit;
    return `${this.money(l.spent)} of ${this.money(l.limit)} ${periodWords[l.period]}, ${this.pct(share)}${over > 0 ? `, over by ${this.money(over)}` : ""}`;
  }

  /** Over-limit rows first, then the fullest */
  private get rows() {
    const share = (l: SpendLimit) => (l.limit > 0 ? l.spent / l.limit : 0);
    return [...this.limits].sort((a, b) => Number(b.spent > b.limit) - Number(a.spent > a.limit) || share(b) - share(a) || a.name.localeCompare(b.name));
  }

  /* ---------- Changes ---------- */

  private commit(limits: SpendLimit[], change: SpendLimitsChange["change"], id: string, words: string) {
    if (!this.emit<SpendLimitsChange>("tc-limits-change", { limits, change, id }, { cancelable: true })) return false;
    this.limits = limits;
    this.announce = words;
    return true;
  }
  private focusLater(selector: string) {
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(selector)?.focus());
  }

  private startEdit(id: string) {
    this.editing = id;
    this.error = "";
    this.focusLater(`.ui-spl__edit-input`);
  }
  private cancelEdit() {
    const id = this.editing;
    this.editing = null;
    this.error = "";
    if (id) this.focusLater(`[data-edit="${CSS.escape(id)}"]`);
  }
  private saveEdit(input: HTMLInputElement) {
    const id = this.editing;
    if (!id) return;
    const value = parseLimit(input.value);
    if (value === null) {
      this.error = "Enter an amount above zero";
      input.focus();
      return;
    }
    if (id === "default") {
      if (!this.defaultLimit) return;
      const next = { ...this.defaultLimit, limit: value };
      if (!this.emit<SpendDefaultLimitChange>("tc-default-limit-change", { defaultLimit: next }, { cancelable: true })) return this.cancelEdit();
      this.defaultLimit = next;
      this.announce = `Workspace default set to ${this.money(value)}`;
    } else {
      const l = this.limits.find((x) => x.id === id);
      if (!l) return this.cancelEdit();
      if (!this.commit(this.limits.map((x) => (x.id === id ? { ...x, limit: value } : x)), "edit", id, `${l.name}'s limit set to ${this.money(value)}`)) return this.cancelEdit();
    }
    this.cancelEdit();
  }
  private setAction(l: SpendLimit, action: SpendLimitAction, select: HTMLSelectElement) {
    if (action === l.action) return;
    if (!this.commit(this.limits.map((x) => (x.id === l.id ? { ...x, action } : x)), "action", l.id, `${l.name}: ${spendLimitActionWords[action]} at the limit`)) select.value = l.action;
  }
  private removeLimit(l: SpendLimit) {
    const i = this.rows.findIndex((x) => x.id === l.id);
    if (!this.commit(
      this.limits.filter((x) => x.id !== l.id),
      "remove",
      l.id,
      `Removed the limit for ${l.name}`,
    ))
      return;
    const next = this.rows[Math.min(i, this.rows.length - 1)];
    this.focusLater(next ? `[data-remove="${CSS.escape(next.id)}"]` : ".ui-spl__add-open");
  }

  private get freeTargets() {
    return this.targets.filter((t) => t.kind === this.addKind && !this.limits.some((l) => l.kind === t.kind && l.id === t.id));
  }
  private openAdd() {
    this.adding = true;
    this.addError = "";
    this.focusLater(".ui-spl__add-kind");
  }
  private closeAdd() {
    this.adding = false;
    this.addError = "";
    this.focusLater(".ui-spl__add-open");
  }
  private submitAdd(e: Event) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    const target = this.freeTargets.find((t) => t.id === data.get("target"));
    const limit = parseLimit(String(data.get("limit") ?? ""));
    if (!target) {
      this.addError = `Pick a ${spendLimitKindWords[this.addKind].toLowerCase()}`;
      return;
    }
    if (limit === null) {
      this.addError = "Enter an amount above zero";
      form.querySelector<HTMLInputElement>("[name=limit]")?.focus();
      return;
    }
    const next: SpendLimit = {
      id: target.id,
      kind: target.kind,
      name: target.name,
      limit,
      spent: 0,
      period: (data.get("period") as SpendLimitPeriod) || "month",
      action: (data.get("action") as SpendLimitAction) || "block",
    };
    if (!this.commit([...this.limits, next], "add", next.id, `Added a ${this.money(limit)} limit for ${next.name}`)) return;
    this.adding = false;
    this.addError = "";
    this.focusLater(`[data-edit="${CSS.escape(next.id)}"]`);
  }

  /* ---------- Rendering ---------- */

  private renderCap(id: string, limit: number, label: string) {
    if (this.editing === id) {
      const err = `${this.uid}-err`;
      return html`<span class="ui-spl__edit">
        <label class="tc-sr-only" for=${`${this.uid}-edit`}>${label}</label>
        <input
          id=${`${this.uid}-edit`}
          class="ui-spl__edit-input ui-spl__field"
          inputmode="decimal"
          .value=${String(limit)}
          aria-invalid=${this.error ? "true" : "false"}
          aria-describedby=${err}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === "Enter") {
              e.preventDefault();
              this.saveEdit(e.target as HTMLInputElement);
            } else if (e.key === "Escape") {
              e.preventDefault();
              e.stopPropagation();
              this.cancelEdit();
            }
          }}
        />
        <button type="button" class="tc-btn-sm" @click=${(e: Event) => this.saveEdit((e.currentTarget as HTMLElement).parentElement!.querySelector("input")!)}>Save</button>
        <button type="button" class="ui-spl__quiet" @click=${() => this.cancelEdit()}>Cancel</button>
        <span class="ui-spl__error" id=${err} role="alert">${this.error}</span>
      </span>`;
    }
    return html`<button type="button" class="ui-spl__cap" data-edit=${id} @click=${() => this.startEdit(id)}>
      ${this.money(limit)}<span class="tc-sr-only">, edit ${label.toLowerCase()}</span>
    </button>`;
  }

  private renderRow(l: SpendLimit) {
    const share = l.limit > 0 ? l.spent / l.limit : 0;
    const over = l.spent > l.limit;
    const near = !over && share >= 0.8;
    const kind = spendLimitKindWords[l.kind];
    return html`<li class="ui-spl__row" data-id=${l.id} ?data-over=${over}>
      <div class="ui-spl__who">
        <span class="ui-spl__kind" data-kind=${l.kind}>${kind}</span>
        <span class="ui-spl__name">${l.name}</span>
        ${over ? html`<span class="ui-spl__flag" data-tone="danger"><span aria-hidden="true">▲</span> Over limit</span>` : near ? html`<span class="ui-spl__flag" data-tone="warning">Near limit</span>` : nothing}
      </div>
      <div class="ui-spl__use">
        <span
          class="ui-spl__track"
          .role=${"meter"}
          aria-label=${`${l.name} spend`}
          aria-valuemin="0"
          aria-valuemax=${l.limit}
          aria-valuenow=${Math.min(l.spent, l.limit)}
          aria-valuetext=${this.usedWords(l)}
          ><span class="ui-spl__fill" data-tone=${over ? "danger" : near ? "warning" : "ok"} style=${`inline-size: ${Math.min(1, share) * 100}%`}></span
        ></span>
        <span class="ui-spl__words" aria-hidden="true">${this.usedWords(l)}</span>
      </div>
      <div class="ui-spl__cap-cell">${this.renderCap(l.id, l.limit, `${l.name}'s limit`)}</div>
      <label class="ui-spl__action-cell"
        ><span class="tc-sr-only">At the limit, for ${l.name}</span
        ><select class="ui-spl__field ui-spl__action" @change=${(e: Event) => this.setAction(l, (e.target as HTMLSelectElement).value as SpendLimitAction, e.target as HTMLSelectElement)}>
          ${(["block", "warn", "notify"] as const).map((a) => html`<option value=${a} ?selected=${a === l.action}>${spendLimitActionWords[a]}</option>`)}
        </select></label
      >
      <button type="button" class="ui-spl__quiet ui-spl__remove" data-remove=${l.id} @click=${() => this.removeLimit(l)}>Remove<span class="tc-sr-only"> the limit for ${l.name}</span></button>
    </li>`;
  }

  private renderAdd() {
    if (!this.adding) return html`<button type="button" class="tc-btn-sm ui-spl__add-open" @click=${() => this.openAdd()}>Add limit</button>`;
    const free = this.freeTargets;
    const err = `${this.uid}-adderr`;
    return html`<form class="ui-spl__add" aria-label="Add a limit" @submit=${this.submitAdd} @keydown=${(e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        this.closeAdd();
      }
    }}>
      <label class="ui-spl__add-field"><span>For</span><select class="ui-spl__field ui-spl__add-kind" name="kind" @change=${(e: Event) => (this.addKind = (e.target as HTMLSelectElement).value as SpendLimitKind)}>
        ${(["member", "team", "key"] as const).map((k) => html`<option value=${k} ?selected=${k === this.addKind}>${spendLimitKindWords[k]}</option>`)}
      </select></label>
      <label class="ui-spl__add-field"><span>${spendLimitKindWords[this.addKind]}</span><select class="ui-spl__field" name="target" aria-describedby=${err}>
        ${free.length ? free.map((t) => html`<option value=${t.id}>${t.name}</option>`) : html`<option value="">None left</option>`}
      </select></label>
      <label class="ui-spl__add-field"><span>Limit</span><input class="ui-spl__field" name="limit" inputmode="decimal" placeholder=${this.money(500)} aria-describedby=${err} /></label>
      <label class="ui-spl__add-field"><span>Per</span><select class="ui-spl__field" name="period"><option value="month">Month</option><option value="day">Day</option></select></label>
      <label class="ui-spl__add-field"><span>At the limit</span><select class="ui-spl__field" name="action">${(["block", "warn", "notify"] as const).map((a) => html`<option value=${a}>${spendLimitActionWords[a]}</option>`)}</select></label>
      <div class="ui-spl__add-actions">
        <button type="submit" class="ui-spl__primary">Add</button>
        <button type="button" class="ui-spl__quiet" @click=${() => this.closeAdd()}>Cancel</button>
      </div>
      <span class="ui-spl__error" id=${err} role="alert">${this.addError}</span>
    </form>`;
  }

  protected override render() {
    const over = this.limits.filter((l) => l.spent > l.limit).length;
    const d = this.defaultLimit;
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${cardHead({
        icon: gaugeIcon,
        title: this.heading,
        subtitle: this.description,
        id: `${this.uid}-title`,
        aside: this.limits.length ? html`<span class="ui-spl__count" data-over=${over ? "true" : "false"}>${over ? `${over} over limit` : `${this.limits.length} ${this.limits.length === 1 ? "limit" : "limits"}`}</span>` : nothing,
      })}
      <div class="ui-spl__card">
        ${d
          ? html`<div class="ui-spl__default">
              <span class="ui-spl__default-label">Workspace default</span>
              <span class="ui-spl__default-text">Every member: ${this.renderCap("default", d.limit, "Workspace default limit")} ${periodWords[d.period]}, then ${spendLimitActionWords[d.action].toLowerCase()}</span>
            </div>`
          : nothing}
        ${this.limits.length
          ? html`<ul class="ui-spl__list" aria-labelledby=${`${this.uid}-title`}>${repeat(this.rows, (l) => l.id, (l) => this.renderRow(l))}</ul>`
          : html`<p class="ui-spl__empty">No limits yet${d ? " – everyone has the workspace default" : ""}.</p>`}
        <div class="ui-spl__foot">${this.renderAdd()}</div>
      </div>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="spl"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="spl"] {
  position: relative; display: block; box-sizing: border-box; width: 100%; overflow: hidden;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary); text-align: left; -webkit-font-smoothing: antialiased;
}
[data-ui="spl"] *, [data-ui="spl"] *::before, [data-ui="spl"] *::after { box-sizing: border-box; }
:where([data-ui="spl"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
[data-ui="spl"] button:focus-visible, [data-ui="spl"] select:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="spl"] ul, [data-ui="spl"] p { margin: 0; padding: 0; list-style: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-spl__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-spl__count { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-spl__count[data-over="true"] { color: var(--tc-status-danger-fg); font-weight: var(--tc-font-weight-medium); }
.ui-spl__default { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); background: var(--tc-fill-subtle); font-size: var(--tc-font-size-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-spl__default { margin-top: var(--tc-space-1); }
.ui-spl__default-label { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-spl__default-text { display: inline-flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1); }
.ui-spl__list { padding: var(--tc-space-1-5) !important; }
.ui-spl__row { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1.6fr) auto auto auto; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-2-5); border-radius: var(--tc-radius-md); }
.ui-spl__row + .ui-spl__row { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-spl__row[data-over] { background: var(--tc-status-danger-bg); }
.ui-spl__who { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); min-width: 0; }
.ui-spl__kind { padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-sm); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-spl__name { min-width: 0; overflow: hidden; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); text-overflow: ellipsis; white-space: nowrap; }
.ui-spl__flag { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); white-space: nowrap; }
.ui-spl__flag[data-tone="danger"] { color: var(--tc-status-danger-fg); }
.ui-spl__flag[data-tone="warning"] { color: var(--tc-status-warning-fg); }
.ui-spl__use { display: grid; gap: var(--tc-space-1); min-width: 0; }
.ui-spl__track { display: block; height: var(--tc-meter-h); border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); overflow: hidden; }
.ui-spl__fill { display: block; height: 100%; border-radius: inherit; background: var(--tc-meter-fill); transition: inline-size var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-spl__fill[data-tone="warning"] { background: var(--tc-status-warning-solid); }
.ui-spl__fill[data-tone="danger"] { background: var(--tc-status-danger-solid); }
.ui-spl__words { font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-spl__cap { min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1-5) !important; border-radius: var(--tc-radius-sm); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; text-decoration: underline dotted; text-underline-offset: var(--tc-space-0-5); }
.ui-spl__cap:hover { background: var(--tc-fill-subtle); }
.ui-spl__edit { display: inline-flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); }
.ui-spl__field { height: var(--tc-field-h-sm); min-width: 0; margin: 0; padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); }
.ui-spl__field:focus-visible { outline: none; box-shadow: var(--tc-field-shadow-focus); }
.ui-spl__field[aria-invalid="true"]:not(:focus-visible) { box-shadow: var(--tc-field-shadow-invalid); }
.ui-spl__edit-input { width: 7em; }
.ui-spl__error { flex-basis: 100%; font-size: var(--tc-font-size-xs); color: var(--tc-status-danger-fg); }
.ui-spl__error:empty { display: none; }
.ui-spl__quiet { min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2) !important; border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-spl__quiet:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-spl__primary { height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm) !important; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-primary-bg) !important; box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg) !important; font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); }
.ui-spl__primary:hover { background: var(--tc-action-primary-bg-hover) !important; }
.ui-spl__foot { padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-spl__add { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--tc-space-2) var(--tc-space-3); }
.ui-spl__add-field { display: grid; gap: var(--tc-space-1); font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); }
.ui-spl__add-actions { display: flex; gap: var(--tc-space-1-5); }
.ui-spl__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
@container (max-width: 600px) {
  .ui-spl__row { grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "who who" "use use" "cap action" "remove remove"; }
  .ui-spl__who { grid-area: who; }
  .ui-spl__use { grid-area: use; }
  .ui-spl__cap-cell { grid-area: cap; }
  .ui-spl__action-cell { grid-area: action; }
  .ui-spl__remove { grid-area: remove; justify-self: start; }
}
@media (forced-colors: active) {
  .ui-spl__fill { background: CanvasText !important; }
  .ui-spl__track { outline: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="spl"] *, [data-ui="spl"] *::before, [data-ui="spl"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-spend-limits")) customElements.define("tc-spend-limits", TcSpendLimits);

declare global {
  interface HTMLElementTagNameMap {
    "tc-spend-limits": TcSpendLimits;
  }
}
