import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { formatDate } from "./internal/util";

/*
 * <tc-seat-usage> – seats paid for against seats used. A headline – "112 of 150 seats used · 38 idle" – over one bar
 * split into active seats (used in the last 30 days), idle ones (assigned but not used) and unassigned ones, with what
 * the idle and unassigned seats cost. Under it, the same split per plan or team as a table, and the idle members with
 * when each was last active: tick some, or use a row's own Reclaim seat, and confirm – tc-reclaim, which the page acts on.
 *   · the idle list is native checkboxes and buttons; the confirmation takes focus on Cancel, and Escape cancels it
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-seat-usage paid="150" seat-price="30" .groups=${[…]} .idle=${[{ id: "u1", name: "Ines Lindqvist", lastActive: … }]}></tc-seat-usage>
 */

/** An armchair: Lucide (ISC, lucide.dev) */
const seatIcon = svg`<path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3"></path><path d="M3 16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V11a2 2 0 0 0-4 0z"></path><path d="M5 18v2"></path><path d="M19 18v2"></path>`;

export type SeatGroup = {
  id: string;
  /** A plan or a team, e.g. "Business" or "Audit" */
  label: string;
  /** Seats paid for */
  paid: number;
  /** Seats given to someone */
  assigned: number;
  /** Assigned seats used in the last 30 days */
  active: number;
};
export type IdleMember = {
  id: string;
  name: string;
  /** Their email or role, shown under the name */
  detail?: string;
  /** The plan or team their seat is in */
  group?: string;
  /** When they were last active, epoch ms; unset reads as "Never active" */
  lastActive?: number;
};
/** The headline numbers */
export type SeatTotals = { paid: number; assigned: number; active: number; idle: number; unassigned: number };

/** Details of the events */
export type SeatSelectedChange = { selected: string[] };
export type SeatReclaim = { ids: string[]; members: IdleMember[] };

/** Paid, assigned, active, idle (assigned but not active) and unassigned seats, from the totals or the groups */
export function seatTotals(groups: SeatGroup[], given: Partial<Pick<SeatTotals, "paid" | "assigned" | "active">> = {}): SeatTotals {
  const sum = (k: "paid" | "assigned" | "active") => given[k] ?? groups.reduce((n, g) => n + Math.max(0, g[k] || 0), 0);
  const paid = Math.max(0, sum("paid"));
  const assigned = Math.min(paid || Infinity, Math.max(0, sum("assigned")));
  const active = Math.min(assigned, Math.max(0, sum("active")));
  return { paid, assigned, active, idle: assigned - active, unassigned: Math.max(0, paid - assigned) };
}

const DAY = 86_400_000;
let uidCount = 0;

/**
 * Seat usage: seats paid for against seats used – active, idle and unassigned in one bar, their cost, a breakdown by
 * plan or team, and idle members to reclaim after a confirmation.
 * @tag tc-seat-usage
 * @fires tc-selected-change - Idle members were ticked or unticked ({ selected }: SeatSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-reclaim - Reclaiming was confirmed ({ ids, members }: SeatReclaim); cancelable – prevented, the confirmation stays open
 */
export class TcSeatUsage extends TcElement {
  static override ui = "seat";

  /** The heading */
  @property() accessor heading = "Seats";
  /** One line under the heading, e.g. the plan and renewal date */
  @property() accessor description: string | undefined = undefined;
  /** Seats paid for; by default the groups' sum */
  @property({ type: Number }) accessor paid: number | undefined = undefined;
  /** Seats given to someone; by default the groups' sum */
  @property({ type: Number }) accessor assigned: number | undefined = undefined;
  /** Assigned seats used in the last 30 days; by default the groups' sum */
  @property({ type: Number }) accessor active: number | undefined = undefined;
  /** The split per plan or team; leave empty to hide the breakdown */
  @property({ attribute: false }) accessor groups: SeatGroup[] = [];
  /** What the breakdown's first column is called: "Plan" or "Team" */
  @property({ attribute: "group-label" }) accessor groupLabel = "Team";
  /** Members holding a seat they haven't used in the last 30 days */
  @property({ attribute: false }) accessor idle: IdleMember[] = [];
  /** Ticked idle members' ids. Changed by the checkboxes unless a tc-selected-change listener calls preventDefault() */
  @property({ attribute: false }) accessor selected: string[] = [];
  /** What one seat costs per `period`, in `currency`; unset hides the cost line */
  @property({ type: Number, attribute: "seat-price" }) accessor seatPrice: number | undefined = undefined;
  /** The period `seat-price` is for, in words: "a month", "a year" */
  @property() accessor period = "a month";
  /** The price's currency, an ISO 4217 code */
  @property() accessor currency = "USD";
  /** The time for "47 days ago", epoch ms; unset shows dates instead */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The language for numbers and dates, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;
  /** The time zone for dates, e.g. "Europe/London"; by default the browser's */
  @property({ attribute: "time-zone" }) accessor timeZone: string | undefined = undefined;

  /** The ids waiting on the confirmation, or null when it's closed */
  @state() private accessor confirming: string[] | null = null;
  /** The button that opened the confirmation, to return focus to */
  @state() private accessor opener: string | null = null;
  /** The polite announcement */
  @state() private accessor announce = "";

  private uid = `tc-seat-${++uidCount}`;

  /* ---------- The model ---------- */

  private get totals() {
    return seatTotals(this.groups, { paid: this.paid, assigned: this.assigned, active: this.active });
  }
  private num(v: number) {
    return new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 }).format(v);
  }
  private money(v: number) {
    try {
      return new Intl.NumberFormat(this.locale, { style: "currency", currency: this.currency, maximumFractionDigits: 0 }).format(v);
    } catch {
      return new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 }).format(v);
    }
  }
  private seats(n: number) {
    return `${this.num(n)} ${n === 1 ? "seat" : "seats"}`;
  }
  private lastActive(m: IdleMember) {
    if (m.lastActive === undefined || !Number.isFinite(m.lastActive)) return "Never active";
    if (this.now !== undefined) {
      const days = Math.max(0, Math.floor((this.now - m.lastActive) / DAY));
      return days === 0 ? "Active today" : `Last active ${this.num(days)} ${days === 1 ? "day" : "days"} ago`;
    }
    return `Last active ${formatDate(m.lastActive, this.locale, { day: "numeric", month: "short", year: "numeric", timeZone: this.timeZone })}`;
  }
  private get picked() {
    const ids = new Set(this.idle.map((m) => m.id));
    return this.selected.filter((id) => ids.has(id));
  }

  /* ---------- Actions ---------- */

  private setSelected(next: string[]) {
    if (!this.emit<SeatSelectedChange>("tc-selected-change", { selected: next }, { cancelable: true })) {
      // The checkboxes changed themselves; put them back to what `selected` says
      this.requestUpdate();
      return false;
    }
    this.selected = next;
    return true;
  }
  private toggle(id: string, on: boolean) {
    const now = this.picked;
    this.setSelected(on ? [...now.filter((x) => x !== id), id] : now.filter((x) => x !== id));
  }
  private toggleAll(on: boolean) {
    this.setSelected(on ? this.idle.map((m) => m.id) : []);
  }
  private ask(ids: string[], opener: string) {
    if (!ids.length) return;
    this.confirming = ids;
    this.opener = opener;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-seat__cancel")?.focus());
  }
  private cancel() {
    const opener = this.opener;
    this.confirming = null;
    this.opener = null;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-opener="${CSS.escape(opener ?? "")}"]`)?.focus());
  }
  private confirm() {
    const ids = this.confirming ?? [];
    const members = this.idle.filter((m) => ids.includes(m.id));
    if (!this.emit<SeatReclaim>("tc-reclaim", { ids, members }, { cancelable: true })) return;
    this.confirming = null;
    this.opener = null;
    this.announce = `Reclaimed ${this.seats(ids.length)}`;
    const left = this.picked.filter((id) => !ids.includes(id));
    if (left.length !== this.picked.length) this.setSelected(left);
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-seat__reclaim-picked, .ui-seat__all input")?.focus());
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("idle") && this.confirming) {
      const ids = new Set(this.idle.map((m) => m.id));
      const still = this.confirming.filter((id) => ids.has(id));
      this.confirming = still.length ? still : null;
    }
  }

  private onConfirmKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape") return;
    e.preventDefault();
    e.stopPropagation();
    this.cancel();
  };

  /* ---------- Rendering ---------- */

  private bar(t: SeatTotals, cls = "") {
    const of = t.paid || 1;
    return html`<span class="ui-seat__bar ${cls}" aria-hidden="true"
      ><span class="ui-seat__seg" data-part="active" style=${`inline-size: ${(t.active / of) * 100}%`}></span><span class="ui-seat__seg" data-part="idle" style=${`inline-size: ${(t.idle / of) * 100}%`}></span
    ></span>`;
  }

  private renderConfirm(ids: string[]) {
    const members = this.idle.filter((m) => ids.includes(m.id));
    const who = members.length === 1 ? members[0].name : `${members[0]?.name ?? ""} and ${this.num(members.length - 1)} ${members.length === 2 ? "other" : "others"}`;
    const saves = this.seatPrice !== undefined ? ` – about ${this.money(members.length * this.seatPrice)} ${this.period}` : "";
    return html`<div class="ui-seat__confirm" role="group" aria-labelledby=${`${this.uid}-confirm`} @keydown=${this.onConfirmKey}>
      <p class="ui-seat__confirm-text" id=${`${this.uid}-confirm`}>
        Reclaim ${this.seats(members.length)}? ${who} ${members.length === 1 ? "loses" : "lose"} access until given a seat again${saves}.
      </p>
      <span class="ui-seat__confirm-actions">
        <button type="button" class="tc-btn-sm ui-seat__cancel" @click=${() => this.cancel()}>Cancel</button>
        <button type="button" class="tc-btn-sm ui-seat__confirm-btn" @click=${() => this.confirm()}>Reclaim ${this.seats(members.length)}</button>
      </span>
    </div>`;
  }

  private renderIdle() {
    const picked = this.picked;
    const all = this.idle.length > 0 && picked.length === this.idle.length;
    return html`<section class="ui-seat__idle" aria-labelledby=${`${this.uid}-idle`}>
      <div class="ui-seat__idle-head">
        <h4 class="ui-seat__sub" id=${`${this.uid}-idle`}>Idle members</h4>
        <label class="ui-seat__all"
          ><input
            type="checkbox"
            .checked=${live(all)}
            .indeterminate=${live(picked.length > 0 && !all)}
            @change=${(e: Event) => this.toggleAll((e.target as HTMLInputElement).checked)}
          />Select all</label
        >
        <button
          type="button"
          class="tc-btn-sm ui-seat__reclaim-picked"
          data-opener="picked"
          aria-disabled=${picked.length ? "false" : "true"}
          @click=${() => (picked.length ? this.ask(picked, "picked") : undefined)}
        >
          Reclaim ${picked.length ? this.seats(picked.length) : "selected"}
        </button>
      </div>
      ${this.confirming && this.opener === "picked" ? this.renderConfirm(this.confirming) : nothing}
      <ul class="ui-seat__members">
        ${repeat(
          this.idle,
          (m) => m.id,
          (m) => html`<li class="ui-seat__member" data-id=${m.id}>
            <label class="ui-seat__pick">
              <input type="checkbox" .checked=${live(picked.includes(m.id))} @change=${(e: Event) => this.toggle(m.id, (e.target as HTMLInputElement).checked)} />
              <span class="ui-seat__who"
                ><span class="ui-seat__name">${m.name}</span><span class="ui-seat__detail">${[m.detail, m.group].filter(Boolean).join(" · ")}</span></span
              >
            </label>
            <span class="ui-seat__last">${this.lastActive(m)}</span>
            <button type="button" class="tc-btn-sm ui-seat__reclaim" data-opener=${m.id} @click=${() => this.ask([m.id], m.id)}>
              Reclaim seat<span class="ui-seat__sr"> from ${m.name}</span>
            </button>
            ${this.confirming && this.opener === m.id ? html`<div class="ui-seat__row-confirm">${this.renderConfirm(this.confirming)}</div>` : nothing}
          </li>`,
        )}
      </ul>
    </section>`;
  }

  protected override render() {
    const id = this.uid;
    const t = this.totals;
    const wasted = t.idle + t.unassigned;
    const summary = `${this.num(t.active)} of ${this.num(t.paid)} seats used`;
    return html`
      <span class="ui-seat__sr" role="status">${this.announce}</span>
      ${cardHead({ icon: seatIcon, title: this.heading, subtitle: this.description, id: `${id}-title` })}
      <div class="ui-seat__card">
        ${t.paid
          ? html`<div class="ui-seat__summary">
                <p class="ui-seat__headline">
                  <span class="ui-seat__used">${summary}</span>
                  <span class="ui-seat__idle-count"> · ${this.num(t.idle)} idle</span>${t.unassigned ? html`<span class="ui-seat__unassigned"> · ${this.num(t.unassigned)} unassigned</span>` : nothing}
                </p>
                ${this.bar(t)}
                <ul class="ui-seat__legend">
                  <li><span class="ui-seat__key" data-part="active" aria-hidden="true"></span>Active ${this.num(t.active)}</li>
                  <li><span class="ui-seat__key" data-part="idle" aria-hidden="true"></span>Idle ${this.num(t.idle)}</li>
                  <li><span class="ui-seat__key" data-part="unassigned" aria-hidden="true"></span>Unassigned ${this.num(t.unassigned)}</li>
                </ul>
                ${this.seatPrice !== undefined && wasted > 0
                  ? html`<p class="ui-seat__cost">Idle and unassigned seats cost <strong>${this.money(wasted * this.seatPrice)}</strong> ${this.period}.</p>`
                  : nothing}
              </div>
              ${this.groups.length
                ? html`<table class="ui-seat__table">
                    <caption class="ui-seat__sr">Seats by ${this.groupLabel.toLowerCase()}</caption>
                    <thead>
                      <tr>
                        <th scope="col">${this.groupLabel}</th>
                        <th scope="col" class="ui-seat__num">Paid</th>
                        <th scope="col" class="ui-seat__num">Active</th>
                        <th scope="col" class="ui-seat__num">Idle</th>
                        <th scope="col" class="ui-seat__bar-col"><span class="ui-seat__sr">Share used</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      ${this.groups.map((g) => {
                        const gt = seatTotals([g]);
                        return html`<tr data-id=${g.id}>
                          <th scope="row">${g.label}</th>
                          <td class="ui-seat__num">${this.num(gt.paid)}</td>
                          <td class="ui-seat__num">${this.num(gt.active)}</td>
                          <td class="ui-seat__num">${this.num(gt.idle + gt.unassigned)}</td>
                          <td class="ui-seat__bar-col">${this.bar(gt, "ui-seat__bar--row")}</td>
                        </tr>`;
                      })}
                    </tbody>
                  </table>`
                : nothing}
              ${this.idle.length ? this.renderIdle() : html`<p class="ui-seat__none">Everyone with a seat has used it in the last 30 days.</p>`}`
          : html`<p class="ui-seat__empty">No seats to show yet.</p>`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="seat"] {
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="seat"] {
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
[data-ui="seat"] *, [data-ui="seat"] *::before, [data-ui="seat"] *::after { box-sizing: border-box; }
[data-ui="seat"] button:focus-visible, [data-ui="seat"] input:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="seat"] ul, [data-ui="seat"] h4 { margin: 0; padding: 0; list-style: none; }
[data-ui="seat"] p { margin: 0; }
.ui-seat__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-seat__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- Summary: headline, bar, legend, cost ----- */
.ui-seat__summary { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-seat__summary { padding-top: var(--tc-space-1); }
.ui-seat__headline { color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-seat__used { font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); }
.ui-seat__bar { display: flex; height: var(--tc-meter-h-hero); overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-seat__bar--row { height: var(--tc-meter-h); min-width: var(--tc-space-12); }
.ui-seat__seg { display: block; height: 100%; }
.ui-seat__seg[data-part="active"], .ui-seat__key[data-part="active"] { background: var(--tc-meter-fill); }
.ui-seat__seg[data-part="idle"], .ui-seat__key[data-part="idle"] { background: repeating-linear-gradient(-45deg, var(--tc-status-warning-solid) 0 var(--tc-space-0-5), var(--tc-status-warning-bg) var(--tc-space-0-5) var(--tc-space-1)); }
.ui-seat__key[data-part="unassigned"] { background: var(--tc-meter-track); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-seat__legend { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-4); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-seat__legend li { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-seat__key { display: inline-block; width: var(--tc-space-3); height: var(--tc-space-3); border-radius: var(--tc-radius-2xs); }
.ui-seat__cost { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-seat__cost strong { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-strong); }
/* ----- Breakdown table ----- */
.ui-seat__table { width: 100%; border-collapse: collapse; font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-seat__table th, .ui-seat__table td { padding: var(--tc-space-2) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); text-align: left; }
.ui-seat__table thead th { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-seat__table tbody th { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-seat__table td { color: var(--tc-text-secondary); }
.ui-seat__table .ui-seat__num { text-align: right; }
.ui-seat__bar-col { width: 30%; }
/* ----- Idle members ----- */
.ui-seat__idle { padding: var(--tc-space-2) var(--tc-space-1-5) var(--tc-space-1-5); }
.ui-seat__idle-head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-4); padding: var(--tc-space-2) var(--tc-space-2-5); }
.ui-seat__sub { flex: 1; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); }
.ui-seat__all { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); cursor: pointer; }
.ui-seat__reclaim-picked[aria-disabled="true"] { opacity: 1; color: var(--tc-text-disabled); cursor: not-allowed; }
.ui-seat__member { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); min-height: var(--tc-control-h-sm); padding: var(--tc-space-2) var(--tc-space-2-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-seat__pick { display: flex; align-items: center; gap: var(--tc-space-2-5); min-width: 0; cursor: pointer; }
.ui-seat__pick input, .ui-seat__all input { flex: none; width: var(--tc-space-4); height: var(--tc-space-4); margin: 0; accent-color: var(--tc-accent-solid); }
.ui-seat__who { display: grid; min-width: 0; }
.ui-seat__name { overflow: hidden; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
.ui-seat__detail { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-seat__last { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-seat__row-confirm { grid-column: 1 / -1; }
.ui-seat__confirm { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); margin: var(--tc-space-1) var(--tc-space-2-5); padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-status-warning-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-warning-border); }
.ui-seat__row-confirm .ui-seat__confirm { margin: 0; }
.ui-seat__confirm-text { flex: 1 1 16em; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); }
.ui-seat__confirm-actions { display: inline-flex; gap: var(--tc-space-2); }
.ui-seat__confirm-btn { background: var(--tc-action-danger-bg); box-shadow: none; color: var(--tc-action-danger-fg); }
.ui-seat__confirm-btn:hover { background: var(--tc-action-danger-bg-hover); box-shadow: none; }
.ui-seat__none, .ui-seat__empty { padding: var(--tc-space-4) !important; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-seat__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; text-align: center; }
/* Narrow: the last-active time drops under the name, the table loses its bars */
@container (max-width: 480px) {
  .ui-seat__member { grid-template-columns: minmax(0, 1fr) auto; }
  .ui-seat__last { grid-column: 1; grid-row: 2; padding-inline-start: var(--tc-space-6); }
  .ui-seat__bar-col { display: none; }
  .ui-seat__table th, .ui-seat__table td { padding-inline: var(--tc-space-2-5); }
}
@media (forced-colors: active) {
  .ui-seat__seg[data-part="active"], .ui-seat__key[data-part="active"] { background: CanvasText; }
  .ui-seat__seg[data-part="idle"], .ui-seat__key[data-part="idle"] { background: GrayText; }
  .ui-seat__bar, .ui-seat__key { outline: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="seat"] *, [data-ui="seat"] *::before, [data-ui="seat"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-seat-usage")) customElements.define("tc-seat-usage", TcSeatUsage);

declare global {
  interface HTMLElementTagNameMap {
    "tc-seat-usage": TcSeatUsage;
  }
}
