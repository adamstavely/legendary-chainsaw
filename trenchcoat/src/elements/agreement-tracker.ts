import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-agreement-tracker> – how often the AI went along with the person's framing this session, and how often it pushed
 * back. A running record of the turns (the app classifies each one: agreed, pushed back or neutral), the agreement
 * rate and the current run. Once the run of agreements reaches `threshold` (2 by default) the tracker turns amber,
 * marks the run and offers "Show the other side", which fires tc-counter-request – the app fetches or opens the
 * counter-argument; the element calls nothing.
 *   · layout="card" – a small card: the rate and the run, the record with a key, the warning on the tray below
 *   · layout="inline" – one compact strip for a chat, under the latest answer or in its header
 * Neutral turns neither add to a run nor break it: only a push-back ends a run of agreements.
 * Standard: the header and the warning sit on the gray tray (amber when warned) around a white card. Clean: one white
 * card with a hairline, the warning as its last row and a thin amber rule down the left edge.
 *
 *   <tc-agreement-tracker .turns=${[{ id: "t1", stance: "agreed" }, { id: "t2", stance: "agreed" }]}></tc-agreement-tracker>
 *
 * Nothing in it is a control except "Show the other side": Tab reaches the button; the record is a list a screen
 * reader can read turn by turn. Crossing the threshold is announced politely once.
 */

export type AgreementStance = "agreed" | "pushed-back" | "neutral";
export type AgreementLayout = "card" | "inline";

/** One answer in the session, as the app classified it */
export type AgreementTurn = {
  id: string;
  /** Whether the answer went along with the person's framing, pushed back on it, or neither */
  stance: AgreementStance;
  /** A few words on what the turn was about – shown on hover and read by screen readers */
  label?: string;
};

/** Detail of tc-counter-request: the length of the run of agreements, and the last turn in it */
export type AgreementCounterRequest = { run: number; turnId: string | undefined };

const STANCES: AgreementStance[] = ["agreed", "pushed-back", "neutral"];
const DEFAULT_LABELS: Record<AgreementStance, string> = { agreed: "Agreed", "pushed-back": "Pushed back", neutral: "Neutral" };

/* Icons: Lucide (ISC, lucide.dev) – scale (the header), check, undo-2, minus, triangle-alert, arrow-left-right */
const headIcon = svg`<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"></path><path d="M7 21h10M12 3v18M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"></path>`;
const glyph = (body: ReturnType<typeof svg>, className = "ui-agr__glyph") => html`<svg class=${className} viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;
const STANCE_ICON: Record<AgreementStance, ReturnType<typeof svg>> = {
  agreed: svg`<path d="M20 6 9 17l-5-5"></path>`,
  "pushed-back": svg`<path d="M9 14 4 9l5-5"></path><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"></path>`,
  neutral: svg`<path d="M5 12h14"></path>`,
};
const alertIcon = svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4M12 17h.01"></path>`;
const sidesIcon = svg`<path d="M8 3 4 7l4 4"></path><path d="M4 7h16M16 21l4-4-4-4"></path><path d="M20 17H4"></path>`;

let instances = 0;

/** The session's counts and the run at its end */
export type AgreementStats = {
  agreed: number;
  pushedBack: number;
  neutral: number;
  /** agreed ÷ (agreed + pushed back), or null before any answer took a side */
  rate: number | null;
  /** The run at the end of the session: its stance (neutral turns skipped) and length, and the turns in it */
  run: { stance: "agreed" | "pushed-back" | null; length: number; ids: string[] };
};

/** Counts and the current run of a list of turns – neutral turns neither extend nor break a run */
export function agreementStats(turns: AgreementTurn[]): AgreementStats {
  let agreed = 0;
  let pushedBack = 0;
  let neutral = 0;
  for (const t of turns) {
    if (t.stance === "agreed") agreed++;
    else if (t.stance === "pushed-back") pushedBack++;
    else neutral++;
  }
  let stance: AgreementStats["run"]["stance"] = null;
  const ids: string[] = [];
  for (let i = turns.length - 1; i >= 0; i--) {
    const s = turns[i].stance;
    if (s === "neutral") continue;
    if (stance === null) stance = s;
    if (s !== stance) break;
    ids.push(turns[i].id);
  }
  const decided = agreed + pushedBack;
  return { agreed, pushedBack, neutral, rate: decided ? agreed / decided : null, run: { stance, length: ids.length, ids } };
}

/**
 * How often the AI agreed with the person's framing versus pushed back, this session: the record, the rate and the
 * run, amber at a run of agreements, with "Show the other side".
 * @tag tc-agreement-tracker
 * @fires tc-counter-request - "Show the other side" was pressed; detail `{ run, turnId }`: AgreementCounterRequest – the run's length and its last turn.
 */
export class TcAgreementTracker extends TcElement {
  static override ui = "agr";

  /** The session's answers in order, oldest first, each classified by the app */
  @property({ attribute: false }) accessor turns: AgreementTurn[] = [];
  /** How many agreements in a row turn the tracker amber */
  @property({ type: Number }) accessor threshold = 2;
  /** "card" – a small card; "inline" – one compact strip for a chat */
  @property({ reflect: true }) accessor layout: AgreementLayout = "card";
  /** The heading, and the tracker's accessible name */
  @property() accessor heading = "Agreement";
  /** A quiet line under the heading (card only) */
  @property() accessor scope = "This session";
  /** Names of the three stances – "Agreed", "Pushed back" and "Neutral" by default */
  @property({ attribute: false }) accessor stanceLabels: Partial<Record<AgreementStance, string>> = {};
  /** How many of the latest turns the record shows – 24 in a card and 8 inline by default; earlier ones are counted */
  @property({ type: Number }) accessor max: number | undefined = undefined;
  /** The label of the button that asks for the counter-argument */
  @property({ attribute: "counter-label" }) accessor counterLabel = "Show the other side";
  /** The warning at the threshold; {n} is replaced by the length of the run */
  @property({ attribute: "warning-text" }) accessor warningText = "The last {n} answers agreed with you. The strongest case against may show what agreement hides.";

  /** @internal What the status region says */
  @state() accessor said = "";

  private readonly uid = `tc-agr${++instances}`;
  private wasWarned = false;

  /** The counts, the rate and the current run */
  get stats(): AgreementStats {
    return agreementStats(this.turns ?? []);
  }

  /** Whether the run of agreements has reached the threshold */
  get warned() {
    const { run } = this.stats;
    return run.stance === "agreed" && run.length >= Math.max(1, this.threshold);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.wasWarned = this.warned;
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    const warned = this.warned;
    if (this.layout === "inline") {
      this.setAttribute("role", "group");
      this.removeAttribute("aria-labelledby");
      this.setAttribute("aria-label", this.heading);
    } else {
      this.setAttribute("role", "region");
      this.removeAttribute("aria-label");
      this.setAttribute("aria-labelledby", `${this.uid}-title`);
    }
    this.toggleAttribute("data-warned", warned);
    // Say it once, when the run reaches the threshold – not on every turn after
    if (warned && !this.wasWarned) this.said = `${this.stats.run.length} agreements in a row. ${this.counterLabel} is available.`;
    else if (!warned && this.wasWarned) this.said = "";
    this.wasWarned = warned;
  }

  private label(s: AgreementStance) {
    return this.stanceLabels[s] ?? DEFAULT_LABELS[s];
  }

  private requestCounter() {
    const { run } = this.stats;
    this.emit<AgreementCounterRequest>("tc-counter-request", { run: run.length, turnId: run.ids[0] });
  }

  /* ---------- Rendering ---------- */

  /** The record: the latest turns as marks, the run of agreements underlined when warned */
  private renderRecord() {
    const turns = this.turns ?? [];
    const max = Math.max(1, this.max ?? (this.layout === "inline" ? 8 : 24));
    const shown = turns.slice(-max);
    const hidden = turns.length - shown.length;
    const warned = this.warned;
    const run = new Set(warned ? this.stats.run.ids : []);
    return html`<ol class="ui-agr__record" aria-label="Turns, oldest first">
      ${hidden > 0 ? html`<li class="ui-agr__more">+${hidden}<span class="ui-agr__sr"> earlier turns</span></li>` : nothing}
      ${repeat(
        shown,
        (t) => t.id,
        (t, i) => {
          const n = hidden + i + 1;
          const name = this.label(t.stance);
          return html`<li class="ui-agr__turn" data-stance=${t.stance} ?data-run=${run.has(t.id)} title=${`Turn ${n} · ${name}${t.label ? ` · ${t.label}` : ""}`}>
            ${glyph(STANCE_ICON[t.stance] ?? STANCE_ICON.neutral)}<span class="ui-agr__sr">Turn ${n}: ${name}${t.label ? ` – ${t.label}` : ""}</span>
          </li>`;
        },
      )}
    </ol>`;
  }

  private renderCounter(className: string) {
    return html`<button type="button" class=${className} @click=${this.requestCounter}>${glyph(sidesIcon)}${this.counterLabel}</button>`;
  }

  private warningMessage() {
    return this.warningText.replace(/\{n\}/g, String(this.stats.run.length));
  }

  private renderInline() {
    const { agreed, pushedBack, run } = this.stats;
    const warned = this.warned;
    const decided = agreed + pushedBack;
    const turns = this.turns ?? [];
    return html`<div class="ui-agr__strip">
        ${turns.length ? this.renderRecord() : nothing}
        <span class="ui-agr__line">
          ${warned ? html`<span class="ui-agr__mark">${glyph(alertIcon)}</span>` : nothing}
          <span class="ui-agr__read">
            ${!turns.length
              ? "No answers yet"
              : decided
                ? html`<b>${this.label("agreed")} ${agreed} of ${decided}</b>${warned
                    ? html` <span class="ui-agr__dot" aria-hidden="true">·</span> <span class="ui-agr__runtext">${run.length} in a row</span>`
                    : pushedBack
                      ? html` <span class="ui-agr__dot" aria-hidden="true">·</span> ${this.label("pushed-back").toLowerCase()} ${pushedBack}×`
                      : nothing}`
                : "No answer took a side yet"}
          </span>
        </span>
        ${warned ? this.renderCounter("ui-agr__counter ui-agr__counter--inline") : nothing}
      </div>
      <span class="ui-agr__sr" role="status">${this.said}</span>`;
  }

  private renderCard() {
    const { agreed, pushedBack, neutral, rate, run } = this.stats;
    const warned = this.warned;
    const turns = this.turns ?? [];
    const decided = agreed + pushedBack;
    const clean = this.resolvedLook === "clean";
    const pill = warned
      ? html`<span class="ui-agr__pill" data-tone="warning">${run.length} in a row</span>`
      : html`<span class="ui-agr__pill">${turns.length} ${turns.length === 1 ? "turn" : "turns"}</span>`;
    const head = cardHead({ icon: headIcon, title: this.heading, subtitle: this.scope || undefined, id: `${this.uid}-title`, aside: pill });
    const runText = run.stance === null ? "None yet" : `${run.length} ${this.label(run.stance).toLowerCase()}`;
    const body = html`<div class="ui-agr__body">
      <div class="ui-agr__stats">
        <div class="ui-agr__stat">
          <span class="ui-agr__big">${rate === null ? "–" : `${Math.round(rate * 100)}%`}</span>
          <span class="ui-agr__under">${decided ? `${this.label("agreed").toLowerCase()} · ${agreed} of ${decided}` : "no answer took a side"}${neutral ? html` <span class="ui-agr__dot" aria-hidden="true">·</span> ${neutral} ${this.label("neutral").toLowerCase()}` : nothing}</span>
        </div>
        <div class="ui-agr__stat" data-kind="run" ?data-warned=${warned}>
          <span class="ui-agr__caption">Current run</span>
          <span class="ui-agr__runval">${runText}</span>
        </div>
      </div>
      ${turns.length
        ? html`<div class="ui-agr__track">${this.renderRecord()}</div>
            <ul class="ui-agr__key" aria-hidden="true">
              ${STANCES.map((s) => html`<li class="ui-agr__key-item" data-stance=${s}><span class="ui-agr__chip">${glyph(STANCE_ICON[s])}</span>${this.label(s)}</li>`)}
            </ul>`
        : html`<p class="ui-agr__empty">No answers yet – each one is marked here as it arrives.</p>`}
    </div>`;
    const warning = warned
      ? html`<div class="ui-agr__warn">
          <span class="ui-agr__mark">${glyph(alertIcon)}</span>
          <p class="ui-agr__warn-text">${this.warningMessage()}</p>
          ${this.renderCounter("ui-agr__counter")}
        </div>`
      : nothing;
    return html`${clean ? nothing : head}
      <div class="ui-agr__card">${clean ? head : nothing}${body}${clean ? warning : nothing}</div>
      ${clean ? nothing : warning}
      <span class="ui-agr__sr" role="status">${this.said}</span>`;
  }

  protected override render() {
    return this.layout === "inline" ? this.renderInline() : this.renderCard();
  }

  static override css = /* css */ `
[data-ui="agr"] {
  /* The stances' colours – override them on [data-ui="agr"] */
  --tc-agreement-tracker-agreed-bg: var(--tc-fill-strong);
  --tc-agreement-tracker-agreed-fg: var(--tc-text-secondary);
  --tc-agreement-tracker-pushed-bg: var(--tc-tone-teal-bg);
  --tc-agreement-tracker-pushed-fg: var(--tc-tone-teal-fg);
  --tc-agreement-tracker-turn: 18px;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 420px;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  container-type: inline-size;
}
/* Standard card: the gray tray (amber when warned) around a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="agr"][layout="card"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard), box-shadow var(--tc-duration-moderate) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="agr"][layout="card"][data-warned] { background: var(--tc-status-warning-bg); box-shadow: inset 0 0 0 1px var(--tc-status-warning-border); }
/* Inline: as wide as its content */
[data-ui="agr"][layout="inline"] { display: block; width: fit-content; max-width: 100%; container-type: normal; }
[data-ui="agr"] *, [data-ui="agr"] *::before, [data-ui="agr"] *::after { box-sizing: border-box; }
:where([data-ui="agr"]) :is(p, ol, ul) { margin: 0; padding: 0; }
:where([data-ui="agr"]) :is(ol, ul) { list-style: none; }
:where([data-ui="agr"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="agr"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="agr"] b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-agr__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-agr__glyph { display: block; flex: none; width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-agr__glyph { stroke-width: 1.6; }
.ui-agr__dot { color: var(--tc-text-disabled); }
/* ----- The card ----- */
.ui-agr__card { position: relative; min-width: 0; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-agr__card { background: var(--tc-surface-raised); }
/* Clean, warned: a thin amber rule down the left edge */
:where([data-look="clean"], [data-look="clean"] *)[data-warned] .ui-agr__card::before { content: ""; position: absolute; top: 0; bottom: 0; left: 0; z-index: 1; width: 3px; background: var(--tc-status-warning-solid); }
.ui-agr__pill { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-agr__pill[data-tone="warning"] { background: var(--tc-surface-raised); box-shadow: inset 0 0 0 1px var(--tc-status-warning-border); color: var(--tc-status-warning-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-agr__pill[data-tone="warning"] { background: var(--tc-status-warning-bg); box-shadow: none; }
.ui-agr__body { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-agr__body { padding-top: var(--tc-space-1); }
/* The rate and the run, side by side */
.ui-agr__stats { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: var(--tc-space-4); }
.ui-agr__stat { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-agr__stat[data-kind="run"] { justify-items: end; text-align: right; }
/* A hero figure – display-sized on purpose: the rate is what the card is for */
.ui-agr__big { font-size: var(--tc-font-size-3xl); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-display); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-agr__big { font-size: var(--tc-font-size-2xl); color: var(--tc-text-strong); }
.ui-agr__under { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-agr__caption { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-agr__runval { font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-agr__stat[data-warned] .ui-agr__runval { color: var(--tc-status-warning-fg); }
/* ----- The record: one mark per turn, the run of agreements underlined ----- */
.ui-agr__track { padding: var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-surface-well); }
:where([data-look="clean"], [data-look="clean"] *).ui-agr__track { padding: var(--tc-space-2) 0 var(--tc-space-2-5); background: none; border-top: var(--tc-hairline) solid var(--tc-divider); border-bottom: var(--tc-hairline) solid var(--tc-divider); border-radius: 0; }
.ui-agr__record { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-1); }
.ui-agr__turn { position: relative; display: grid; flex: none; place-items: center; width: var(--tc-agreement-tracker-turn); height: var(--tc-agreement-tracker-turn); border-radius: var(--tc-radius-sm); background: var(--tc-agreement-tracker-agreed-bg); color: var(--tc-agreement-tracker-agreed-fg); animation: ui-agr-in var(--tc-duration-moderate) var(--tc-ease-spring) both; }
.ui-agr__turn .ui-agr__glyph { width: 11px; height: 11px; stroke-width: 2.4; }
:where([data-look="clean"], [data-look="clean"] *) .ui-agr__turn .ui-agr__glyph { stroke-width: 2; }
.ui-agr__turn[data-stance="pushed-back"] { background: var(--tc-agreement-tracker-pushed-bg); color: var(--tc-agreement-tracker-pushed-fg); }
.ui-agr__turn[data-stance="neutral"] { background: none; box-shadow: inset 0 0 0 1px var(--tc-border-default); color: var(--tc-icon-muted); }
.ui-agr__turn[data-run] { background: var(--tc-status-warning-solid); color: var(--tc-text-on-accent); }
/* The run's underline: each mark draws its part, bridging the gap to the next */
.ui-agr__turn[data-run]::after { content: ""; position: absolute; top: calc(100% + 3px); left: 0; width: calc(100% + var(--tc-space-1)); height: 2px; border-radius: var(--tc-radius-full); background: var(--tc-status-warning-solid); }
.ui-agr__turn[data-run]:last-child::after { width: 100%; }
.ui-agr__more { flex: none; padding: 0 var(--tc-space-1); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-agr__key { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-3); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-agr__key-item { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-agr__chip { display: grid; place-items: center; width: 14px; height: 14px; border-radius: var(--tc-radius-xs); background: var(--tc-agreement-tracker-agreed-bg); color: var(--tc-agreement-tracker-agreed-fg); }
.ui-agr__chip .ui-agr__glyph { width: 9px; height: 9px; stroke-width: 2.6; }
[data-stance="pushed-back"] > .ui-agr__chip { background: var(--tc-agreement-tracker-pushed-bg); color: var(--tc-agreement-tracker-pushed-fg); }
[data-stance="neutral"] > .ui-agr__chip { background: none; box-shadow: inset 0 0 0 1px var(--tc-border-default); color: var(--tc-icon-muted); }
.ui-agr__empty { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
/* ----- The warning: on the amber tray (Standard), the card's last row (Clean) ----- */
.ui-agr__warn { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: start; gap: var(--tc-space-2) var(--tc-space-2-5); animation: ui-agr-rise var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-agr__warn { padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-1) var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-agr__warn { padding: var(--tc-space-3) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); background: var(--tc-status-warning-bg); }
.ui-agr__mark { display: grid; flex: none; place-items: center; width: 20px; height: 20px; color: var(--tc-status-warning-fg); }
.ui-agr__warn-text { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-wrap: pretty; }
.ui-agr__warn > .ui-agr__counter { grid-column: 2; justify-self: start; }
/* Show the other side: Button's secondary recipe, its icon in the warning colour */
.ui-agr__counter { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-agr__counter .ui-agr__glyph { color: var(--tc-status-warning-fg); }
.ui-agr__counter:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-agr__counter:active { transform: scale(0.97); }
/* ----- Inline: one strip ----- */
.ui-agr__strip { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5) var(--tc-space-2-5); min-width: 0; padding: var(--tc-space-1-5) var(--tc-space-1-5) var(--tc-space-1-5) var(--tc-space-2-5); border-radius: var(--tc-radius-xl); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 1px var(--tc-border-subtle); transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard), box-shadow var(--tc-duration-moderate) var(--tc-ease-standard); }
[data-warned] .ui-agr__strip { background: var(--tc-status-warning-bg); box-shadow: inset 0 0 0 1px var(--tc-status-warning-border); }
:where([data-look="clean"], [data-look="clean"] *) .ui-agr__strip { background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-warned] .ui-agr__strip { box-shadow: var(--tc-card-shadow), inset 3px 0 0 var(--tc-status-warning-solid); }
.ui-agr__strip:not(:has(.ui-agr__counter)) { padding-right: var(--tc-space-3); }
.ui-agr__strip .ui-agr__record { flex-wrap: nowrap; padding-bottom: var(--tc-space-0-5); }
.ui-agr__strip { --tc-agreement-tracker-turn: 16px; }
.ui-agr__strip .ui-agr__turn .ui-agr__glyph { width: 10px; height: 10px; }
.ui-agr__line { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-width: 0; font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-agr__line .ui-agr__mark { width: 16px; height: 16px; }
.ui-agr__read { white-space: nowrap; }
.ui-agr__runtext { font-weight: var(--tc-font-weight-medium); color: var(--tc-status-warning-fg); }
.ui-agr__counter--inline { height: var(--tc-control-h-sm); }
@keyframes ui-agr-in { from { opacity: 0; transform: scale(0.6); } to { opacity: 1; transform: none; } }
@keyframes ui-agr-rise { from { opacity: 0; transform: translateY(-3px); } to { opacity: 1; transform: none; } }
/* Narrow: the warning's button goes full width under the text */
@container (max-width: 340px) {
  .ui-agr__body { padding: var(--tc-space-3-5); }
  .ui-agr__big { font-size: var(--tc-font-size-2xl); }
  .ui-agr__warn > .ui-agr__counter { grid-column: 1 / -1; justify-self: stretch; justify-content: center; }
}
@media (pointer: coarse) {
  .ui-agr__counter { height: var(--tc-control-h-md); }
}
@media (forced-colors: active) {
  .ui-agr__turn[data-run], .ui-agr__turn[data-run]::after { background: Highlight; color: HighlightText; }
  .ui-agr__turn { border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="agr"], [data-ui="agr"] *, [data-ui="agr"] *::before, [data-ui="agr"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-agreement-tracker")) customElements.define("tc-agreement-tracker", TcAgreementTracker);

declare global {
  interface HTMLElementTagNameMap {
    "tc-agreement-tracker": TcAgreementTracker;
  }
}
