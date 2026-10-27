import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import "./segmented-control";
import type { SegmentOption, SegmentValueChange } from "./segmented-control";

/*
 * <tc-friction-profile> – how much friction the product's safeguards add, by mode. A switch picks a mode (standard,
 * elevated and deadline by default – the modes are data); the safeguards below show what each one does under it:
 * on, shortened, deferred, tightened or off, with what changes in plain words. Picking a mode only previews it: rows
 * that differ from the mode in force are marked, from → to, with a count of what eases and what tightens, and nothing
 * changes until Apply. Deadline mode asks why and until when before it can be applied.
 *
 *   <tc-friction-profile mode="standard" .safeguards=${[{ id: "gate", label: "Intent check", modes: {
 *     elevated: { state: "tightened", change: "Two questions instead of one" },
 *     deadline: { state: "shortened", change: "One short question" } } }]}>
 *   </tc-friction-profile>
 *
 * Apply fires a cancelable tc-mode-change ({ mode, previous, reason, until, changes }); unprevented, `mode`, `reason`
 * and `until` take the new values. A safeguard with no entry for a mode is "on" in it. `until` is the value of a
 * datetime-local field ("2026-10-27T17:00"), shown formatted; the element reads no clock and calls nothing.
 *
 * Keyboard: the switch is a radio group – arrow keys, Home and End move between modes and preview each; Tab moves on
 * to the reason and end time (in deadline mode), Keep and Apply. Escape anywhere in the card drops the preview and
 * returns to the mode in force.
 * Standard: the header on the gray tray, the white card, the actions on the tray below; the switch is a tray.
 * Clean: one white card, the actions as its last row under a hairline; the switch is separate chips.
 */

export type FrictionState = "on" | "shortened" | "deferred" | "tightened" | "off";
export type FrictionTone = "neutral" | "info" | "warning";

export type FrictionMode = {
  id: string;
  /** "Standard", "Elevated", "Deadline" */
  label: string;
  /** One line on what the mode is for, under the switch */
  description?: string;
  /** Applying it asks why */
  needsReason?: boolean;
  /** Applying it asks until when */
  needsEnd?: boolean;
  /** The pill's colour while it is in force (default neutral) */
  tone?: FrictionTone;
};

export type FrictionSafeguard = {
  id: string;
  /** "Intent check", "Export review" */
  label: string;
  /** What it does, shown when it doesn't change */
  description?: string;
  /** Its state per mode id, with what changes in plain words; a mode left out is "on" */
  modes?: Record<string, { state: FrictionState; change?: string }>;
};

/** One safeguard that differs between two modes */
export type FrictionChange = { id: string; from: FrictionState; to: FrictionState };

/** Detail of tc-mode-change */
export type FrictionModeChange = { mode: string; previous: string; reason: string; until: string; changes: FrictionChange[] };

/** The three modes used when `modes` isn't set */
export const FRICTION_MODES: FrictionMode[] = [
  { id: "standard", label: "Standard", description: "Every safeguard works as usual." },
  { id: "elevated", label: "Elevated", description: "Higher stakes: more checks before anything is shared.", tone: "info" },
  { id: "deadline", label: "Deadline", description: "Under time pressure: quicker to start, stricter to finish.", needsReason: true, needsEnd: true, tone: "warning" },
];

const STATES: Record<FrictionState, string> = { on: "On", shortened: "Shortened", deferred: "Deferred", tightened: "Tightened", off: "Off" };
/** How strict each state is, to say whether a change eases or tightens */
const STRICT: Record<FrictionState, number> = { off: 0, deferred: 1, shortened: 2, on: 3, tightened: 4 };

/* Icons: Lucide (ISC, lucide.dev) – sliders-horizontal (the header), arrow-right, clock */
const headIcon = svg`<path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4"></path>`;
const glyph = (body: ReturnType<typeof svg>, className = "ui-frp__glyph") => html`<svg class=${className} viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
const arrowIcon = svg`<path d="M5 12h14M12 5l7 7-7 7"></path>`;
const clockIcon = svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>`;

let instances = 0;

/** A safeguard's state under a mode */
export const frictionStateOf = (s: FrictionSafeguard, mode: string): FrictionState => s.modes?.[mode]?.state ?? "on";

/** The safeguards that differ between two modes */
export function frictionChanges(safeguards: FrictionSafeguard[], from: string, to: string): FrictionChange[] {
  return safeguards.map((s) => ({ id: s.id, from: frictionStateOf(s, from), to: frictionStateOf(s, to) })).filter((c) => c.from !== c.to);
}

/**
 * A mode switch – standard, elevated, deadline – that previews how each safeguard changes (on, shortened, deferred,
 * tightened or off) against the mode in force before it is applied.
 * @tag tc-friction-profile
 * @fires tc-mode-change - Apply was pressed (detail: { mode, previous, reason, until, changes: { id, from, to }[] }); cancelable – prevent it to keep `mode` yourself
 */
export class TcFrictionProfile extends TcElement {
  static override ui = "frp";

  /** The heading, and the region's name */
  @property() accessor heading = "Friction profile";
  /** What it applies to, a quiet line under the heading – e.g. "This session" */
  @property() accessor scope = "";
  /** The modes, in switch order – defaults to standard, elevated and deadline */
  @property({ attribute: false }) accessor modes: FrictionMode[] = FRICTION_MODES;
  /** The id of the mode in force */
  @property() accessor mode = "standard";
  /** Why the mode in force was chosen, when it asked */
  @property() accessor reason = "";
  /** When the mode in force ends, as a datetime-local value ("2026-10-27T17:00"), when it asked */
  @property() accessor until = "";
  /** The safeguards and their state in each mode */
  @property({ attribute: false }) accessor safeguards: FrictionSafeguard[] = [];
  /** Names of the states */
  @property({ attribute: false }) accessor stateLabels: Partial<Record<FrictionState, string>> = {};
  /** Locale for the end time */
  @property() accessor locale = "en-US";

  /** @internal The mode being previewed */
  @state() private accessor preview = "";
  /** @internal */
  @state() private accessor draftReason = "";
  /** @internal */
  @state() private accessor draftUntil = "";
  /** @internal Fields Apply found missing */
  @state() private accessor missing: ReadonlySet<"reason" | "until"> = new Set();
  /** @internal */
  @state() private accessor message = "";

  private readonly uid = `tc-frp${++instances}`;
  private focusField: "reason" | "until" | null = null;

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    this.addEventListener("keydown", this.onKey);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("keydown", this.onKey);
  }

  /* ---------- State ---------- */

  /** @internal */
  private modeOf(id: string) {
    return (this.modes ?? []).find((m) => m.id === id);
  }

  /** @internal */
  private word(s: FrictionState) {
    return this.stateLabels[s] ?? STATES[s];
  }

  /** @internal The mode shown: the preview, or the mode in force */
  private get shown() {
    return this.preview && this.modeOf(this.preview) ? this.preview : this.mode;
  }

  /** @internal "27 Oct 2026, 17:00" from a datetime-local value; anything else as given */
  private when(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return value;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat(this.locale, { dateStyle: "medium", timeStyle: "short" }).format(d);
  }

  /* ---------- Update ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // A new mode in force ends the preview
    if (changed.has("mode") || !this.preview) this.preview = this.mode;
    if (this.shown !== this.mode) this.dataset.previewing = "";
    else delete this.dataset.previewing;
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
    if (this.focusField) {
      this.querySelector<HTMLElement>(`#${this.uid}-${this.focusField}`)?.focus();
      this.focusField = null;
    }
  }

  /** A trailing space makes a repeated message count as new for screen readers */
  private announce(text: string) {
    this.message = this.message === text ? `${text} ` : text;
  }

  /* ---------- Actions ---------- */

  private pick(id: string) {
    if (!this.modeOf(id) || id === this.shown) return;
    this.preview = id;
    this.missing = new Set();
    const changes = frictionChanges(this.safeguards ?? [], this.mode, id);
    const m = this.modeOf(id)!;
    this.announce(id === this.mode ? `${m.label} is in force.` : `Previewing ${m.label}: ${changes.length} ${changes.length === 1 ? "safeguard changes" : "safeguards change"}.`);
  }

  /** Drops the preview and returns to the mode in force */
  private keep = () => {
    if (this.shown === this.mode) return;
    this.preview = this.mode;
    this.missing = new Set();
    this.announce(`Kept ${this.modeOf(this.mode)?.label ?? this.mode}.`);
  };

  private apply() {
    const target = this.modeOf(this.shown);
    if (!target || this.shown === this.mode) return;
    const reason = this.draftReason.trim();
    const until = this.draftUntil.trim();
    const missing = new Set<"reason" | "until">();
    if (target.needsReason && !reason) missing.add("reason");
    if (target.needsEnd && !until) missing.add("until");
    this.missing = missing;
    if (missing.size) {
      this.focusField = missing.has("reason") ? "reason" : "until";
      return;
    }
    const previous = this.mode;
    const changes = frictionChanges(this.safeguards ?? [], previous, target.id);
    const detail: FrictionModeChange = { mode: target.id, previous, reason: target.needsReason ? reason : "", until: target.needsEnd ? until : "", changes };
    if (!this.emit<FrictionModeChange>("tc-mode-change", detail, { cancelable: true })) return;
    this.mode = target.id;
    this.reason = detail.reason;
    this.until = detail.until;
    this.draftReason = "";
    this.draftUntil = "";
    this.announce(`${target.label} applied. ${changes.length} ${changes.length === 1 ? "safeguard changed" : "safeguards changed"}.`);
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || this.shown === this.mode || e.defaultPrevented) return;
    e.preventDefault();
    this.keep();
  };

  /* ---------- Render ---------- */

  private renderSwitch() {
    const modes = this.modes ?? [];
    const shown = this.modeOf(this.shown);
    const options: SegmentOption[] = modes.map((m) => ({ value: m.id, label: m.label }));
    const previewing = this.shown !== this.mode;
    return html`<div class="ui-frp__modes">
      <tc-segmented-control
        look=${this.resolvedLook}
        class="ui-frp__seg"
        full-width
        aria-label="Mode"
        aria-describedby=${`${this.uid}-mode-desc`}
        .options=${options}
        .value=${this.shown}
        @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => {
          // The inner control's event stops here: the page hears this element's tc-mode-change only
          e.stopPropagation();
          e.preventDefault();
          this.pick(e.detail.value);
        }}
      ></tc-segmented-control>
      <p class="ui-frp__mode-desc" id=${`${this.uid}-mode-desc`}>
        ${previewing ? html`<span class="ui-frp__tag">Preview</span> ` : nothing}<span>${shown?.description ?? ""}</span>
      </p>
    </div>`;
  }

  private renderDiff() {
    if (this.shown === this.mode) return nothing;
    const changes = frictionChanges(this.safeguards ?? [], this.mode, this.shown);
    const tighter = changes.filter((c) => STRICT[c.to] > STRICT[c.from]).length;
    const eased = changes.length - tighter;
    const same = (this.safeguards ?? []).length - changes.length;
    const from = this.modeOf(this.mode)?.label ?? this.mode;
    return html`<p class="ui-frp__diff">
      <span>Compared with ${from}:</span>
      ${changes.length
        ? html`${eased ? html`<span class="ui-frp__count" data-kind="eased">${eased} eased</span> ` : nothing}${tighter
            ? html`<span class="ui-frp__count" data-kind="tighter">${tighter} tighter</span> `
            : nothing}<span class="ui-frp__count">${same} unchanged</span>`
        : html`<span class="ui-frp__count">no safeguard changes</span>`}
    </p>`;
  }

  private chip(s: FrictionState, extra = "") {
    return html`<span class=${`ui-frp__state ${extra}`} data-state=${s}>${this.word(s)}</span>`;
  }

  private renderSafeguards() {
    const list = this.safeguards ?? [];
    if (!list.length) return html`<p class="ui-frp__empty">No safeguards to show.</p>`;
    const current = this.mode;
    const shown = this.shown;
    const previewing = shown !== current;
    return html`<ul class="ui-frp__list" aria-label=${`Safeguards under ${this.modeOf(shown)?.label ?? shown}`}>
      ${repeat(
        list,
        (s) => s.id,
        (s) => {
          const to = frictionStateOf(s, shown);
          const from = frictionStateOf(s, current);
          const changed = previewing && from !== to;
          const dir = !changed ? undefined : STRICT[to] > STRICT[from] ? "tighter" : "eased";
          const change = s.modes?.[shown]?.change;
          const text = to === "on" && !change ? s.description : change;
          return html`<li class="ui-frp__item" data-id=${s.id} data-state=${to} data-change=${ifDefined(dir)}>
            <span class="ui-frp__label">${s.label}</span>
            <span class="ui-frp__states">
              ${changed
                ? html`${this.chip(from, "ui-frp__state--from")}${glyph(arrowIcon, "ui-frp__arrow")}<span class="ui-frp__sr">${`, ${this.word(from)} now, ${this.word(to)} in ${this.modeOf(shown)?.label ?? shown}`}</span>`
                : nothing}${this.chip(to)}
            </span>
            ${text ? html`<span class="ui-frp__change">${text}</span>` : nothing}
          </li>`;
        },
      )}
    </ul>`;
  }

  private renderFields() {
    const target = this.modeOf(this.shown);
    if (!target || this.shown === this.mode || !(target.needsReason || target.needsEnd)) return nothing;
    const id = this.uid;
    const miss = this.missing;
    return html`<div class="ui-frp__fields">
      <p class="ui-frp__fields-note">${target.label} needs ${target.needsReason && target.needsEnd ? "a reason and an end time" : target.needsReason ? "a reason" : "an end time"} before it's applied.</p>
      ${target.needsReason
        ? html`<div class="ui-frp__field-row">
            <label class="ui-frp__label-text" for=${`${id}-reason`}>Why</label>
            <input
              id=${`${id}-reason`}
              class="ui-frp__field"
              type="text"
              autocomplete="off"
              placeholder="e.g. Filing due at 5 pm"
              aria-required="true"
              aria-invalid=${miss.has("reason") ? "true" : "false"}
              aria-describedby=${ifDefined(miss.has("reason") ? `${id}-reason-err` : undefined)}
              .value=${this.draftReason}
              @input=${(e: Event) => {
                this.draftReason = (e.target as HTMLInputElement).value;
                if (miss.has("reason") && this.draftReason.trim()) this.missing = new Set([...miss].filter((m) => m !== "reason"));
              }}
            />
            ${miss.has("reason") ? html`<p class="ui-frp__err" id=${`${id}-reason-err`}>Say why ${target.label.toLowerCase()} mode is needed.</p>` : nothing}
          </div>`
        : nothing}
      ${target.needsEnd
        ? html`<div class="ui-frp__field-row">
            <label class="ui-frp__label-text" for=${`${id}-until`}>Until</label>
            <input
              id=${`${id}-until`}
              class="ui-frp__field"
              type="datetime-local"
              aria-required="true"
              aria-invalid=${miss.has("until") ? "true" : "false"}
              aria-describedby=${ifDefined(miss.has("until") ? `${id}-until-err` : undefined)}
              .value=${this.draftUntil}
              @input=${(e: Event) => {
                this.draftUntil = (e.target as HTMLInputElement).value;
                if (miss.has("until") && this.draftUntil) this.missing = new Set([...miss].filter((m) => m !== "until"));
              }}
            />
            ${miss.has("until") ? html`<p class="ui-frp__err" id=${`${id}-until-err`}>Choose when ${target.label.toLowerCase()} mode ends.</p>` : nothing}
          </div>`
        : nothing}
    </div>`;
  }

  private renderFoot() {
    const current = this.modeOf(this.mode);
    const shown = this.modeOf(this.shown);
    const previewing = this.shown !== this.mode;
    const n = frictionChanges(this.safeguards ?? [], this.mode, this.shown).length;
    const detail = [this.until ? `until ${this.when(this.until)}` : "", this.reason].filter(Boolean).join(" · ");
    return html`<div class="ui-frp__foot">
      <p class="ui-frp__status">
        ${previewing
          ? html`<span><b>${n}</b> ${n === 1 ? "safeguard changes" : "safeguards change"}</span>`
          : html`${detail ? glyph(clockIcon) : nothing}<span>In force: <b>${current?.label ?? this.mode}</b>${detail ? html` <span class="ui-frp__detail">${detail}</span>` : nothing}</span>`}
      </p>
      ${previewing
        ? html`<div class="ui-frp__actions">
            <button type="button" class="ui-frp__btn ui-frp__btn--ghost" @click=${this.keep}>Keep ${current?.label ?? this.mode}</button>
            <button type="button" class="ui-frp__btn ui-frp__btn--primary" @click=${this.apply}>Apply ${shown?.label ?? this.shown}</button>
          </div>`
        : nothing}
    </div>`;
  }

  protected override render() {
    const current = this.modeOf(this.mode);
    // The header (.tc-head): on the tray in Standard, the card's first row in Clean
    const clean = this.resolvedLook === "clean";
    const head = cardHead({
      icon: headIcon,
      title: this.heading,
      subtitle: this.scope || undefined,
      id: `${this.uid}-title`,
      aside: html`<span class="ui-frp__pill" data-tone=${current?.tone ?? "neutral"}>${current?.label ?? this.mode}</span>`,
    });
    return html`
      ${clean ? nothing : head}
      <div class="ui-frp__card">
        ${clean ? head : nothing}
        <div class="ui-frp__inner">${this.renderSwitch()}${this.renderDiff()}${this.renderSafeguards()}${this.renderFields()}</div>
        ${clean ? this.renderFoot() : nothing}
      </div>
      ${clean ? nothing : this.renderFoot()}
      <p class="ui-frp__sr" role="status">${this.message}</p>
    `;
  }

  static override css = /* css */ `
[data-ui="frp"] {
  box-sizing: border-box;
  container-type: inline-size;
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  max-width: 520px;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Standard: the gray tray around a white card · Clean: one white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="frp"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="frp"] { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); color: var(--tc-text-primary); }
[data-ui="frp"] *, [data-ui="frp"] *::before, [data-ui="frp"] *::after { box-sizing: border-box; }
:where([data-ui="frp"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="frp"]) :is(p, ul) { margin: 0; padding: 0; }
:where([data-ui="frp"]) ul { list-style: none; }
[data-ui="frp"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="frp"] b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-frp__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-frp__glyph { display: block; flex: none; width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-frp__glyph { stroke-width: 1.6; }
/* The card */
.ui-frp__card { min-width: 0; border-radius: var(--tc-card-radius); }
:where([data-look="standard"], [data-look="standard"] *).ui-frp__card { background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-frp__inner { display: grid; gap: var(--tc-space-3-5); padding: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-frp__inner { padding-top: var(--tc-space-1); }
/* The mode in force, at the header's right */
.ui-frp__pill { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard), color var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-frp__pill[data-tone="info"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-frp__pill[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
/* The switch and what the mode is for */
.ui-frp__modes { display: grid; gap: var(--tc-space-2); min-width: 0; }
.ui-frp__seg { width: 100%; }
.ui-frp__mode-desc { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-frp__tag { display: inline-flex; align-items: center; vertical-align: baseline; height: var(--tc-pill-h); margin-right: var(--tc-space-1-5); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-accent-subtle); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); color: var(--tc-accent-text); white-space: nowrap; animation: ui-frp-in var(--tc-duration-base) var(--tc-ease-move) both; }
/* The diff against the mode in force */
.ui-frp__diff { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-3); background: var(--tc-surface-well); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); animation: ui-frp-in var(--tc-duration-base) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-frp__diff { border-radius: var(--tc-radius-lg); }
:where([data-look="clean"], [data-look="clean"] *).ui-frp__diff { border-radius: var(--tc-radius-md); background: var(--tc-fill-subtle); }
.ui-frp__count { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-frp__count + .ui-frp__count::before { content: "·"; margin-right: var(--tc-space-2); font-weight: var(--tc-font-weight-regular); color: var(--tc-text-disabled); }
.ui-frp__count[data-kind="eased"] { color: var(--tc-tone-amber-fg); }
.ui-frp__count[data-kind="tighter"] { color: var(--tc-status-info-fg); }
/* The safeguards */
.ui-frp__list { display: grid; }
.ui-frp__item { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; column-gap: var(--tc-space-3); row-gap: var(--tc-space-0-5); padding: var(--tc-space-2-5) 0; border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-frp__item:first-child { border-top: 0; padding-top: var(--tc-space-1); }
.ui-frp__item:last-child { padding-bottom: 0; }
/* A row that changes: a short rule at its left edge */
.ui-frp__item[data-change]::before { content: ""; position: absolute; top: var(--tc-space-2-5); bottom: var(--tc-space-2-5); left: calc(var(--tc-space-2-5) * -1); width: 2px; border-radius: var(--tc-radius-full); background: var(--tc-tone-amber-solid); animation: ui-frp-in var(--tc-duration-base) var(--tc-ease-move) both; }
.ui-frp__item[data-change]:first-child::before { top: var(--tc-space-1); }
.ui-frp__item[data-change]:last-child::before { bottom: 0; }
.ui-frp__item[data-change="tighter"]::before { background: var(--tc-status-info-solid); }
.ui-frp__label { min-width: 0; overflow-wrap: anywhere; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-frp__states { display: inline-flex; align-items: center; gap: var(--tc-space-1); justify-self: end; }
.ui-frp__state { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard), color var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-frp__state[data-state="tightened"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-frp__state:is([data-state="shortened"], [data-state="deferred"]) { background: var(--tc-tone-amber-bg); color: var(--tc-tone-amber-fg); }
.ui-frp__state[data-state="off"] { background: none; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); color: var(--tc-text-muted); }
.ui-frp__state--from { background: none !important; box-shadow: none; color: var(--tc-text-muted) !important; text-decoration: line-through; text-decoration-color: var(--tc-text-disabled); }
.ui-frp__arrow { width: 12px; height: 12px; color: var(--tc-text-disabled); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-frp__change { grid-column: 1 / -1; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-frp__item[data-change] .ui-frp__change { color: var(--tc-text-secondary); }
.ui-frp__empty { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
/* The reason and end time a mode asks for */
.ui-frp__fields { display: grid; gap: var(--tc-space-2-5); padding-top: var(--tc-space-3-5); border-top: var(--tc-hairline) solid var(--tc-divider); animation: ui-frp-in var(--tc-duration-base) var(--tc-ease-move) both; }
.ui-frp__fields-note { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-frp__field-row { display: grid; grid-template-columns: 64px minmax(0, 1fr); align-items: center; column-gap: var(--tc-space-3); row-gap: var(--tc-space-1); }
.ui-frp__label-text { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-frp__field { display: block; width: 100%; min-width: 0; height: var(--tc-field-h); margin: 0; padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); outline: 0; background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); color-scheme: inherit; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-frp__field::placeholder { color: var(--tc-text-placeholder); }
.ui-frp__field:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-frp__field:focus { box-shadow: var(--tc-field-shadow-focus); }
.ui-frp__field[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-frp__err { grid-column: 2; font-size: var(--tc-font-size-sm); color: var(--tc-status-danger-fg); }
/* The status and the actions: on the tray below the card (Standard), the card's last row (Clean) */
.ui-frp__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2) var(--tc-space-3); min-height: 44px; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-frp__foot { padding: var(--tc-space-1-5) var(--tc-space-0-5) var(--tc-space-0-5) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-frp__foot { padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); line-height: var(--tc-line-height-tight); }
.ui-frp__status { display: flex; flex: 1 1 auto; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-frp__status > span { min-width: 0; overflow-wrap: anywhere; }
.ui-frp__detail { color: var(--tc-text-muted); }
.ui-frp__detail::before { content: "· "; color: var(--tc-text-disabled); }
.ui-frp__actions { display: flex; flex: none; gap: var(--tc-space-2); margin-left: auto; animation: ui-frp-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-frp__btn { display: inline-flex; flex: none; align-items: center; justify-content: center; height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-frp__btn:active { transform: scale(0.97); }
.ui-frp__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-frp__btn--primary:hover { background: var(--tc-action-primary-bg-hover); }
.ui-frp__btn--ghost { color: var(--tc-action-ghost-fg); }
.ui-frp__btn--ghost:hover { background: var(--tc-action-ghost-bg-hover); }
@keyframes ui-frp-in { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: none; } }
/* Narrow: tighter gutters; a changed row's states drop under its label */
@container (max-width: 400px) {
  .ui-frp__inner { padding: var(--tc-space-3-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-frp__foot { padding-left: var(--tc-space-3-5); }
  .ui-frp__item[data-change] { grid-template-columns: minmax(0, 1fr); }
  .ui-frp__item[data-change] .ui-frp__states { justify-self: start; }
  .ui-frp__item[data-change]::before { left: calc(var(--tc-space-2) * -1); }
  .ui-frp__field-row { grid-template-columns: minmax(0, 1fr); }
  .ui-frp__err { grid-column: 1; }
}
/* Touch screens: bigger targets */
@media (hover: none) and (pointer: coarse) {
  .ui-frp__btn { height: var(--tc-control-h-lg); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="frp"] *, [data-ui="frp"] *::before, [data-ui="frp"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-friction-profile")) customElements.define("tc-friction-profile", TcFrictionProfile);

declare global {
  interface HTMLElementTagNameMap {
    "tc-friction-profile": TcFrictionProfile;
  }
}
