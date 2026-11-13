import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { formatDate } from "./internal/util";

/*
 * <tc-trigger-list> – every way an agent starts, one row each: a schedule, a webhook, an event in another system, an
 * email or a person pressing Run. Each row says what starts it in words ("Every weekday at 09:00"), when it last fired
 * and how often this week, any errors in words, and has a switch to turn it on or off and Edit. Add trigger opens a
 * menu of kinds; the page builds the trigger (with tc-trigger-builder, say). Relative times need `now`: the element
 * doesn't read the clock.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-trigger-list .triggers=${triggers} .now=${now}></tc-trigger-list>
 */

export type TriggerKind = "schedule" | "webhook" | "event" | "email" | "manual";
export type AgentTrigger = {
  id: string;
  kind: TriggerKind;
  /** What starts it, in words: "Every weekday at 09:00", "POST /hooks/inv-7f3a", "When an invoice is uploaded" */
  summary: string;
  enabled: boolean;
  /** Epoch ms */
  lastFired?: number;
  /** How many times it fired in the last seven days */
  fires7d?: number;
  /** What's going wrong, in words: "Signature header missing on the last 3 requests" */
  error?: string;
};
/** `triggers` is the whole list with the switch applied, under the property's own name */
export type TriggerEnabledChange = { id: string; enabled: boolean; trigger: AgentTrigger; triggers: AgentTrigger[] };
export type TriggerListEdit = { id: string; trigger: AgentTrigger };
export type TriggerListAdd = { kind: TriggerKind };

/** The list's words, every one renameable through `labels` */
export type TriggerListLabels = {
  heading: string;
  /** {on} and {n} */
  count: string;
  kinds: Record<TriggerKind, string>;
  on: string;
  off: string;
  /** {summary} */
  switchName: string;
  /** {when} */
  lastFired: string;
  never: string;
  /** {n} */
  fires: string;
  firesOne: string;
  firesNone: string;
  failing: string;
  edit: string;
  add: string;
  empty: string;
  /** {summary} */
  announceOn: string;
  /** {summary} */
  announceOff: string;
};
export const defaultTriggerListLabels: TriggerListLabels = {
  heading: "Triggers",
  count: "{on} of {n} on",
  kinds: { schedule: "Schedule", webhook: "Webhook", event: "Event", email: "Email", manual: "Manual" },
  on: "On",
  off: "Off",
  switchName: "Run on {summary}",
  lastFired: "Last fired {when}",
  never: "Hasn't fired yet",
  fires: "{n} times this week",
  firesOne: "Once this week",
  firesNone: "Not this week",
  failing: "Failing",
  edit: "Edit",
  add: "Add trigger",
  empty: "No triggers yet – this agent only runs when someone starts it.",
  announceOn: "Turned on: {summary}",
  announceOff: "Turned off: {summary}",
};

const KINDS: TriggerKind[] = ["schedule", "webhook", "event", "email", "manual"];
/* After Lucide: workflow (the header), clock, arrow-right-to-line, zap, mail and play */
const ICON = svg`<rect width="8" height="8" x="3" y="3" rx="2"></rect><path d="M7 11v4a2 2 0 0 0 2 2h4"></path><rect width="8" height="8" x="13" y="13" rx="2"></rect>`;
const KIND_ICONS: Record<TriggerKind, ReturnType<typeof svg>> = {
  schedule: svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>`,
  webhook: svg`<path d="M17 12H3"></path><path d="m11 18 6-6-6-6"></path><path d="M21 5v14"></path>`,
  event: svg`<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>`,
  email: svg`<rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>`,
  manual: svg`<polygon points="6 3 20 12 6 21 6 3"></polygon>`,
};
const kindIcon = (kind: TriggerKind) => html`<svg class="ui-trl__kind-icon" viewBox="0 0 24 24" aria-hidden="true">${KIND_ICONS[kind] ?? KIND_ICONS.event}</svg>`;
const fmtAgo = (locale: string | undefined) => new Intl.RelativeTimeFormat(locale ?? "en-US", { numeric: "auto" });
let instances = 0;

/** "3 hours ago", "yesterday" – from `at` to `now` */
export function triggerAgo(at: number, now: number, locale?: string) {
  const s = Math.round((at - now) / 1000);
  const a = Math.abs(s);
  const f = fmtAgo(locale);
  if (a < 45) return f.format(0, "second");
  if (a < 2700) return f.format(Math.round(s / 60), "minute");
  if (a < 79200) return f.format(Math.round(s / 3600), "hour");
  return f.format(Math.round(s / 86400), "day");
}

/**
 * Every way an agent starts, each with a switch – what starts it in words, when it last fired, errors, Edit and Add.
 * @tag tc-trigger-list
 * @fires tc-enabled-change - A switch was flipped ({ id, enabled, trigger, triggers }: TriggerEnabledChange); cancelable – prevented, the trigger keeps its state
 * @fires tc-edit - Edit was pressed ({ id, trigger }: TriggerListEdit)
 * @fires tc-add - A kind was picked from Add trigger ({ kind }: TriggerListAdd)
 */
export class TcTriggerList extends TcElement {
  static override ui = "trl";

  /** The heading; by default "Triggers" */
  @property() accessor heading = "";
  /** A line under the heading, such as the agent's name */
  @property() accessor description: string | undefined = undefined;
  /** The triggers. A flipped switch changes `enabled` unless a tc-enabled-change listener calls preventDefault() */
  @property({ attribute: false }) accessor triggers: AgentTrigger[] = [];
  /** The kinds Add trigger offers; none: no Add trigger */
  @property({ attribute: false }) accessor kinds: TriggerKind[] = KINDS;
  /** "Now" for "3 hours ago", epoch ms; without it, last-fired times are dates. The element doesn't read the clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The locale for dates and relative times */
  @property() accessor locale: string | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<Omit<TriggerListLabels, "kinds">> & { kinds?: Partial<Record<TriggerKind, string>> } = {};

  @state() private accessor menuOpen = false;
  @state() private accessor menuIndex = 0;
  @state() private accessor announce = "";
  private readonly uid = `tc-trl-${++instances}`;

  private get words(): TriggerListLabels {
    return { ...defaultTriggerListLabels, ...this.labels, kinds: { ...defaultTriggerListLabels.kinds, ...this.labels.kinds } };
  }

  private get offered() {
    return this.kinds.filter((k) => KINDS.includes(k));
  }

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener("pointerdown", this.outside, true);
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("pointerdown", this.outside, true);
  }
  private outside = (e: PointerEvent) => {
    if (this.menuOpen && !e.composedPath().includes(this.querySelector(".ui-trl__adder") as EventTarget)) this.menuOpen = false;
  };

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("menuOpen") || changed.has("menuIndex")) {
      if (this.menuOpen) this.querySelectorAll<HTMLElement>(".ui-trl__item")[this.menuIndex]?.focus();
    }
  }

  private flip(t: AgentTrigger, enabled: boolean, input: HTMLInputElement) {
    const triggers = this.triggers.map((x) => (x.id === t.id ? { ...x, enabled } : x));
    if (!this.emit<TriggerEnabledChange>("tc-enabled-change", { id: t.id, enabled, trigger: t, triggers }, { cancelable: true })) {
      input.checked = t.enabled;
      return;
    }
    this.triggers = triggers;
    const w = this.words;
    this.announce = (enabled ? w.announceOn : w.announceOff).replace("{summary}", t.summary);
  }

  private closeMenu(focusButton = true) {
    this.menuOpen = false;
    if (focusButton) this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-trl__add")?.focus());
  }

  private pick(kind: TriggerKind) {
    this.closeMenu();
    this.emit<TriggerListAdd>("tc-add", { kind });
  }

  private menuKey(e: KeyboardEvent) {
    const n = this.offered.length;
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

  private when(at: number) {
    return this.now !== undefined ? triggerAgo(at, this.now, this.locale) : formatDate(at, this.locale, { dateStyle: "medium", timeStyle: "short" });
  }

  private renderRow(t: AgentTrigger) {
    const w = this.words;
    const switchId = `${this.uid}-${t.id}`;
    const errId = `${this.uid}-${t.id}-err`;
    const fires = t.fires7d;
    return html`<li class="ui-trl__row" data-trigger=${t.id} data-kind=${t.kind} ?data-off=${!t.enabled} ?data-error=${!!t.error}>
      <span class="ui-trl__kind">${kindIcon(t.kind)}<span class="ui-trl__kind-word">${w.kinds[t.kind] ?? t.kind}</span></span>
      <div class="ui-trl__main">
        <span class="ui-trl__summary">${t.summary}</span>
        <ul class="ui-trl__facts">
          <li>${t.lastFired !== undefined ? w.lastFired.replace("{when}", this.when(t.lastFired)) : w.never}</li>
          ${fires !== undefined ? html`<li>${fires === 0 ? w.firesNone : fires === 1 ? w.firesOne : w.fires.replace("{n}", String(fires))}</li>` : nothing}
        </ul>
        ${t.error ? html`<p class="ui-trl__error" id=${errId}><span class="ui-trl__error-mark" aria-hidden="true"></span><strong>${w.failing}:</strong> ${t.error}</p>` : nothing}
      </div>
      <div class="ui-trl__controls">
        <span class="ui-trl__toggle">
          <input
            id=${switchId}
            class="ui-trl__switch"
            type="checkbox"
            role="switch"
            .checked=${t.enabled}
            aria-describedby=${t.error ? errId : nothing}
            @change=${(e: Event) => this.flip(t, (e.target as HTMLInputElement).checked, e.target as HTMLInputElement)}
          /><label class="ui-trl__switch-label" for=${switchId}
            ><span class="ui-trl__state" aria-hidden="true">${t.enabled ? w.on : w.off}</span
            ><span class="tc-sr-only">${w.switchName.replace("{summary}", t.summary)}</span></label
          >
        </span>
        <button type="button" class="tc-btn-sm ui-trl__edit" @click=${() => this.emit<TriggerListEdit>("tc-edit", { id: t.id, trigger: t })}>${w.edit}<span class="tc-sr-only">, ${t.summary}</span></button>
      </div>
    </li>`;
  }

  protected override render() {
    const w = this.words;
    const titleId = `${this.uid}-title`;
    const menuId = `${this.uid}-menu`;
    const on = this.triggers.filter((t) => t.enabled).length;
    const offered = this.offered;
    const adder = offered.length
      ? html`<div class="ui-trl__adder">
          <button
            type="button"
            class="tc-btn-sm ui-trl__add"
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
                this.menuIndex = e.key === "ArrowUp" ? offered.length - 1 : 0;
                this.menuOpen = true;
              }
            }}
          >
            ${w.add}
          </button>
          <div class="ui-trl__menu" id=${menuId} role="menu" aria-label=${w.add} ?hidden=${!this.menuOpen} @keydown=${(e: KeyboardEvent) => this.menuKey(e)}>
            ${offered.map(
              (k, i) =>
                html`<button type="button" role="menuitem" class="ui-trl__item" data-kind=${k} tabindex=${i === this.menuIndex ? "0" : "-1"} @click=${() => this.pick(k)}>
                  ${kindIcon(k)}${w.kinds[k]}
                </button>`,
            )}
          </div>
        </div>`
      : nothing;
    return html`${cardHead({
        icon: ICON,
        title: this.heading || w.heading,
        subtitle: this.description,
        id: titleId,
        aside: html`<span class="ui-trl__aside"><span class="ui-trl__count">${w.count.replace("{on}", String(on)).replace("{n}", String(this.triggers.length))}</span>${adder}</span>`,
      })}
      <div class="ui-trl__card">
        ${this.triggers.length
          ? html`<ul class="ui-trl__list" aria-labelledby=${titleId}>${repeat(this.triggers, (t) => t.id, (t) => this.renderRow(t))}</ul>`
          : html`<p class="ui-trl__empty">${w.empty}</p>`}
      </div>
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="trl"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="trl"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
[data-ui="trl"] { --tc-trl-switch-w: 32px; --tc-trl-switch-h: 18px; --tc-trl-knob: 14px; --tc-trl-kind-w: 96px; }
[data-ui="trl"] *, [data-ui="trl"] *::before, [data-ui="trl"] *::after { box-sizing: border-box; }
[data-ui="trl"] :where(p) { margin: 0; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="trl"] .ui-trl__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-trl__aside { display: inline-flex; align-items: center; gap: var(--tc-space-2); }
.ui-trl__count { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-trl__adder { position: relative; }
.ui-trl__menu { position: absolute; z-index: var(--tc-z-popover); top: calc(100% + var(--tc-space-1)); right: 0; display: grid; min-width: 160px; padding: var(--tc-space-1); border-radius: var(--tc-radius-md); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-overlay); }
.ui-trl__menu[hidden] { display: none; }
.ui-trl__item { display: flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); margin: 0; padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: var(--tc-text-primary); font: inherit; text-align: left; cursor: pointer; }
.ui-trl__item:hover, .ui-trl__item:focus-visible { background: var(--tc-fill-hover); outline: none; }
.ui-trl__item:focus-visible { box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
.ui-trl__list { display: grid; margin: 0; padding: 0; list-style: none; }
.ui-trl__row { display: grid; grid-template-columns: var(--tc-trl-kind-w) minmax(0, 1fr) auto; align-items: start; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4); }
.ui-trl__row:not(:first-child) { box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-trl__kind { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-height: var(--tc-control-h-sm); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-trl__kind-icon { flex: none; width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-trl__kind-icon { stroke-width: 1.5; }
.ui-trl__main { display: grid; gap: var(--tc-space-0-5); min-width: 0; padding-top: var(--tc-space-1); }
.ui-trl__summary { font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-trl__row[data-off] .ui-trl__summary { color: var(--tc-text-secondary); }
.ui-trl__facts { display: flex; flex-wrap: wrap; gap: var(--tc-space-0-5) var(--tc-space-3); margin: 0; padding: 0; color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); list-style: none; }
.ui-trl__error { display: flex; align-items: baseline; gap: var(--tc-space-1-5); margin-top: var(--tc-space-1); color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-xs); }
.ui-trl__error strong { font-weight: var(--tc-font-weight-medium); }
.ui-trl__error-mark { flex: none; width: var(--tc-space-2); height: var(--tc-space-2); background: currentColor; }
.ui-trl__controls { display: flex; align-items: center; gap: var(--tc-space-2); }
.ui-trl__toggle { position: relative; display: inline-flex; align-items: center; min-height: var(--tc-control-h-sm); }
.ui-trl__switch { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
.ui-trl__switch-label { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); pointer-events: none; }
.ui-trl__switch-label::before { content: ""; flex: none; width: var(--tc-trl-switch-w); height: var(--tc-trl-switch-h); border-radius: var(--tc-radius-full); background: var(--tc-border-strong); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-trl__switch-label::after { content: ""; position: absolute; left: calc((var(--tc-trl-switch-h) - var(--tc-trl-knob)) / 2); width: var(--tc-trl-knob); height: var(--tc-trl-knob); border-radius: var(--tc-radius-full); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-control); transition: transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-trl__switch:checked + .ui-trl__switch-label { color: var(--tc-text-primary); }
.ui-trl__switch:checked + .ui-trl__switch-label::before { background: var(--tc-accent); }
.ui-trl__switch:checked + .ui-trl__switch-label::after { transform: translateX(calc(var(--tc-trl-switch-w) - var(--tc-trl-switch-h))); }
.ui-trl__switch:focus-visible + .ui-trl__switch-label::before { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-trl__state { min-width: 2em; }
.ui-trl__empty { padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-secondary); text-align: center; }
@container (max-width: 480px) {
  .ui-trl__row { grid-template-columns: minmax(0, 1fr) auto; }
  .ui-trl__kind { grid-column: 1 / -1; min-height: 0; }
  .ui-trl__main { padding-top: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-trl__switch-label::before, .ui-trl__switch-label::after { transition: none; }
}
@media (forced-colors: active) {
  .ui-trl__switch-label::before { border: 1px solid CanvasText; }
  .ui-trl__switch:checked + .ui-trl__switch-label::before { background: Highlight; }
  .ui-trl__switch-label::after { background: CanvasText; }
  .ui-trl__error-mark { background: CanvasText; }
}
`;
}

if (!customElements.get("tc-trigger-list")) customElements.define("tc-trigger-list", TcTriggerList);

declare global {
  interface HTMLElementTagNameMap {
    "tc-trigger-list": TcTriggerList;
  }
}
