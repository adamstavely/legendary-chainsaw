import { html, nothing, svg, type PropertyValues } from "lit";
import { property } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import "./agent-ledger";
import type { LedgerEntry } from "./agent-ledger";
import "./button";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-red-team-finding> – what an adversarial test broke, and what was done about it (the Lit port of
 * blocks/red-team-finding). A list of findings on the left (on top when narrow); the picked one on the right:
 *   · its code, severity, status and age, the title, what happened and which parts of the system it touched
 *   · the invariants it failed – the rules that must always hold
 *   · the scenario that found it, and the evidence it left
 *   · the response, as the library's <tc-agent-ledger>: every change made in response, newest first, each with an undo
 * Standard: each card's header on a gray tray above a white card. Clean: one white card each, the header its first row.
 * Keyboard: the findings are a listbox – ↑ ↓ Home End move and pick (the detail follows), Tab moves on to the detail.
 * Picking fires the cancelable tc-finding-change – prevented, `finding` stays (controlled use).
 *
 *   <tc-red-team-finding .findings=${[…]} .now=${now}></tc-red-team-finding>
 */

export type FindingSeverity = "critical" | "high" | "medium" | "low";
export type FindingStatus = "open" | "investigating" | "mitigated" | "resolved";

export type FindingEvidence = {
  id: string;
  /** What it is, e.g. "Run trace" or "Evidence package EP-4471" */
  label: string;
  /** A line under it, e.g. "Sealed · ready to export" */
  detail?: string;
};

export type Finding = {
  id: string;
  /** Short code shown before everything else, e.g. "F-001" – the id by default */
  code?: string;
  title: string;
  severity: FindingSeverity;
  status: FindingStatus;
  /** When it was opened, already formatted – e.g. "2h ago" */
  opened: string;
  /** One area tag in the list, e.g. "policy" */
  area?: string;
  /** What happened, in a sentence or three */
  summary: string;
  /** The parts of the system it touched */
  affected?: string[];
  /** The invariants that failed – rule ids or short sentences */
  invariants: { id: string; rule: string; detail?: string }[];
  /** The scenario that found it */
  scenario: { id: string; description: string; tags?: string[] };
  evidence?: FindingEvidence[];
  /** What was done in response – shown in the agent ledger, with undo */
  responses?: LedgerEntry[];
};

/** Undo or redo of response changes for a finding; may return a promise (see tc-agent-ledger) */
export type FindingLedgerAction = (ids: string[], finding: Finding) => void | Promise<unknown>;

export type FindingChange = { finding: string };
export type FindingEvidenceOpen = { evidence: FindingEvidence; finding: Finding };
export type FindingRerun = { finding: Finding };

export const defaultSeverityLabels: Record<FindingSeverity, string> = { critical: "Critical", high: "High", medium: "Medium", low: "Low" };
export const defaultFindingStatusLabels: Record<FindingStatus, string> = { open: "Open", investigating: "Investigating", mitigated: "Mitigated", resolved: "Resolved" };
const SEVERITY_TONE: Record<FindingSeverity, string> = { critical: "danger", high: "warning", medium: "info", low: "neutral" };
const STATUS_TONE: Record<FindingStatus, string> = { open: "danger", investigating: "warning", mitigated: "info", resolved: "success" };
const NONE: LedgerEntry[] = [];

/** 24 px stroke icons (Lucide, ISC) */
const icons = {
  target: svg`<path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path>`,
  shield: svg`<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1zM14.5 9.5l-5 5M9.5 9.5l5 5"></path>`,
  flask: svg`<path d="M10 2v7.53a2 2 0 0 1-.21.9L4.72 20.55A1 1 0 0 0 5.62 22h12.76a1 1 0 0 0 .9-1.45l-5.07-10.12a2 2 0 0 1-.21-.9V2M8.5 2h7M7 16h10"></path>`,
  file: svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7zM14 2v4a2 2 0 0 0 2 2h4M9 13h6M9 17h4"></path>`,
  x: svg`<path d="M18 6 6 18M6 6l12 12"></path>`,
  chevron: svg`<path d="m9 18 6-6-6-6"></path>`,
  rerun: svg`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5"></path>`,
};
const glyph = (d: ReturnType<typeof svg>, slot?: string) =>
  html`<svg slot=${slot ?? nothing} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

let instances = 0;

/**
 * What an adversarial test broke and the response: a findings listbox and the picked finding's invariants, scenario, evidence and undoable response timeline.
 * @tag tc-red-team-finding
 * @fires tc-finding-change - A finding was picked in the list ({ finding }: FindingChange, its id); cancelable – prevented, `finding` stays as it is (controlled use)
 * @fires tc-evidence-open - An evidence row was opened, with `open-evidence` on ({ evidence, finding }: FindingEvidenceOpen)
 * @fires tc-rerun - "Run again" was pressed, with `rerun` on ({ finding }: FindingRerun)
 */
export class TcRedTeamFinding extends TcElement {
  static override ui = "rtf";

  /** The findings, in list order */
  @property({ attribute: false }) accessor findings: Finding[] = [];
  /** Id of the finding on show – the first one when unset or unknown */
  @property() accessor finding: string | undefined = undefined;
  /** The clock for the ledger's "2m ago", in epoch ms – the ledger's own clock when unset */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Who made the responses, shown in the ledger's header – e.g. "Response agent" */
  @property() accessor responder = "Response";
  /** Undo in the response ledger, with the finding; may return a promise (see tc-agent-ledger) */
  @property({ attribute: false }) accessor onUndo: FindingLedgerAction | undefined = undefined;
  /** Redo in the response ledger, with the finding; may return a promise */
  @property({ attribute: false }) accessor onRedo: FindingLedgerAction | undefined = undefined;
  /** Evidence rows are buttons that fire tc-evidence-open; otherwise they're plain text */
  @property({ type: Boolean, attribute: "open-evidence" }) accessor openEvidence = false;
  /** Shows "Run again" in the detail, which fires tc-rerun */
  @property({ type: Boolean }) accessor rerun = false;
  /** Words for the severities – merged over the plain-English defaults */
  @property({ attribute: false }) accessor severityLabels: Partial<Record<FindingSeverity, string>> | undefined = undefined;
  /** Words for the statuses – merged over the plain-English defaults */
  @property({ attribute: false }) accessor statusLabels: Partial<Record<FindingStatus, string>> | undefined = undefined;
  /** The list's heading – "Findings" by default */
  @property() accessor heading = "Findings";

  private readonly uid = `tc-rtf${++instances}`;
  private focusPicked = false;

  private get picked() {
    const list = this.findings ?? [];
    return list.find((f) => f.id === this.finding) ?? list[0];
  }
  private severity = (s: FindingSeverity) => this.severityLabels?.[s] ?? defaultSeverityLabels[s] ?? s;
  private status = (s: FindingStatus) => this.statusLabels?.[s] ?? defaultFindingStatusLabels[s] ?? s;

  /** Asks to show `id`: applied unless prevented */
  private pick(id: string, focus = false) {
    if (id === this.picked?.id) return;
    if (!this.emit<FindingChange>("tc-finding-change", { finding: id }, { cancelable: true })) return;
    this.finding = id;
    this.focusPicked = focus;
  }

  private onListKey(e: KeyboardEvent) {
    const list = this.findings ?? [];
    const at = list.findIndex((f) => f.id === this.picked?.id);
    const to = e.key === "ArrowDown" ? Math.min(list.length - 1, at + 1) : e.key === "ArrowUp" ? Math.max(0, at - 1) : e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : -2;
    if (to === -2) return;
    e.preventDefault();
    if (to >= 0 && list[to].id !== this.picked?.id) this.pick(list[to].id, true);
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (this.focusPicked) {
      this.focusPicked = false;
      this.querySelector<HTMLElement>('.ui-rtf__option[aria-selected="true"]')?.focus();
    }
  }

  private pill(tone: string, text: string, dot = false) {
    return html`<span class="ui-rtf__pill" data-tone=${tone} ?data-dot=${dot}>${text}</span>`;
  }

  private renderList() {
    const list = this.findings ?? [];
    const open = list.filter((f) => f.status !== "resolved").length;
    const picked = this.picked;
    return html`<section class="ui-rtf__card ui-rtf__list" aria-labelledby=${`${this.uid}-list`}>
      ${cardHead({ icon: icons.target, title: this.heading, id: `${this.uid}-list`, aside: this.pill(open ? "danger" : "success", `${open} open`) })}
      <div class="ui-rtf__body">
        ${list.length === 0
          ? html`<p class="ui-rtf__empty">Nothing found yet.</p>`
          : html`<div role="listbox" aria-labelledby=${`${this.uid}-list`} class="ui-rtf__options" @keydown=${(e: KeyboardEvent) => this.onListKey(e)}>
              ${repeat(
                list,
                (f) => f.id,
                (f) => {
                  const on = f.id === picked?.id;
                  return html`<div role="option" aria-selected=${on ? "true" : "false"} tabindex=${on ? "0" : "-1"} class="ui-rtf__option" @click=${() => this.pick(f.id)}>
                    <span class="ui-rtf__row">
                      <span class="ui-rtf__code">${f.code ?? f.id}</span>
                      ${this.pill(SEVERITY_TONE[f.severity] ?? "neutral", this.severity(f.severity))}
                      <span class="ui-rtf__when">${f.opened}</span>
                    </span>
                    <span class="ui-rtf__option-title">${f.title}</span>
                    <span class="ui-rtf__row">
                      ${this.pill(STATUS_TONE[f.status] ?? "neutral", this.status(f.status), true)}${f.area ? html`<span class="ui-rtf__tag">${f.area}</span>` : nothing}
                    </span>
                  </div>`;
                },
              )}
            </div>`}
      </div>
    </section>`;
  }

  private renderDetail(f: Finding) {
    const id = (s: string) => `${this.uid}-${s}`;
    const invariants = f.invariants ?? [];
    const evidence = f.evidence ?? [];
    const tags = f.scenario?.tags ?? [];
    return html`<article class="ui-rtf__detail" aria-labelledby=${id("title")}>
      <header class="ui-rtf__intro">
        <div class="ui-rtf__row">
          <span class="ui-rtf__code">${f.code ?? f.id}</span>
          ${this.pill(SEVERITY_TONE[f.severity] ?? "neutral", this.severity(f.severity))}${this.pill(STATUS_TONE[f.status] ?? "neutral", this.status(f.status), true)}
          <span class="ui-rtf__when">Opened ${f.opened}</span>
        </div>
        <h2 id=${id("title")} class="ui-rtf__title">${f.title}</h2>
        <p class="ui-rtf__summary">${f.summary}</p>
        ${f.affected?.length || this.rerun
          ? html`<div class="ui-rtf__row ui-rtf__affected">
              ${f.affected?.length ? html`<ul class="ui-rtf__chips" aria-label="Affected">${f.affected.map((a) => html`<li class="ui-rtf__chip">${a}</li>`)}</ul>` : nothing}
              ${this.rerun
                ? html`<tc-button variant="secondary" size="sm" look=${this.resolvedLook} label="Run again" @click=${() => this.emit<FindingRerun>("tc-rerun", { finding: f })}
                    >${glyph(icons.rerun, "icon")}</tc-button
                  >`
                : nothing}
            </div>`
          : nothing}
      </header>

      <section class="ui-rtf__card" aria-labelledby=${id("inv")}>
        ${cardHead({
          icon: icons.shield,
          title: "Failed invariants",
          subtitle: "Rules that must always hold",
          id: id("inv"),
          aside: this.pill(invariants.length ? "danger" : "success", `${invariants.length} failed`),
        })}
        <div class="ui-rtf__body">
          ${invariants.length
            ? html`<ul class="ui-rtf__rules">
                ${invariants.map(
                  (r) => html`<li>
                    <span class="ui-rtf__x" aria-hidden="true">${glyph(icons.x)}</span>
                    <span><code class="ui-rtf__rule">${r.rule}</code>${r.detail ? html`<span class="ui-rtf__rule-detail">${r.detail}</span>` : nothing}</span>
                  </li>`,
                )}
              </ul>`
            : html`<p class="ui-rtf__empty">Every invariant held.</p>`}
        </div>
      </section>

      <div class="ui-rtf__pair">
        <section class="ui-rtf__card" aria-labelledby=${id("scn")}>
          ${cardHead({ icon: icons.flask, title: "Scenario", subtitle: html`<code class="ui-rtf__mono">${f.scenario?.id ?? ""}</code>`, id: id("scn") })}
          <div class="ui-rtf__body">
            <p class="ui-rtf__text">${f.scenario?.description ?? ""}</p>
            ${tags.length ? html`<ul class="ui-rtf__chips" aria-label="Scenario tags">${tags.map((t) => html`<li class="ui-rtf__chip">${t}</li>`)}</ul>` : nothing}
          </div>
        </section>

        <section class="ui-rtf__card" aria-labelledby=${id("ev")}>
          ${cardHead({ icon: icons.file, title: "Evidence", id: id("ev"), aside: html`<span class="ui-rtf__count">${evidence.length}</span>` })}
          <div class="ui-rtf__body">
            ${evidence.length
              ? html`<ul class="ui-rtf__evidence">
                  ${evidence.map((ev) => {
                    const inner = html`<span class="ui-rtf__ev-icon" aria-hidden="true">${glyph(icons.file)}</span
                      ><span class="ui-rtf__ev-text"><span class="ui-rtf__ev-label">${ev.label}</span>${ev.detail ? html`<span class="ui-rtf__ev-detail">${ev.detail}</span>` : nothing}</span
                      >${this.openEvidence ? html`<span class="ui-rtf__ev-go" aria-hidden="true">${glyph(icons.chevron)}</span>` : nothing}`;
                    return html`<li>
                      ${this.openEvidence
                        ? html`<button type="button" class="ui-rtf__ev" @click=${() => this.emit<FindingEvidenceOpen>("tc-evidence-open", { evidence: ev, finding: f })}>${inner}</button>`
                        : html`<div class="ui-rtf__ev">${inner}</div>`}
                    </li>`;
                  })}
                </ul>`
              : html`<p class="ui-rtf__empty">No evidence attached.</p>`}
          </div>
        </section>
      </div>

      <tc-agent-ledger
        look=${this.resolvedLook}
        heading="Response timeline"
        .agent=${this.responder}
        .entries=${f.responses ?? NONE}
        .now=${this.now}
        .onUndo=${this.onUndo ? (ids: string[]) => this.onUndo?.(ids, f) : undefined}
        .onRedo=${this.onRedo ? (ids: string[]) => this.onRedo?.(ids, f) : undefined}
      ></tc-agent-ledger>
    </article>`;
  }

  override render() {
    const picked = this.picked;
    // Keyed by the finding: a new pick is a new detail (and a fresh ledger), with the entry animation
    return html`<div class="ui-rtf__layout">${this.renderList()}${picked ? keyed(picked.id, this.renderDetail(picked)) : nothing}</div>`;
  }

  static override css = /* css */ `
[data-ui="rtf"] {
  --tc-rtf-list-min: 240px;
  --tc-rtf-list-max: 320px;
  container-type: inline-size;
  display: block;
  width: 100%;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="rtf"] *, [data-ui="rtf"] *::before, [data-ui="rtf"] *::after { box-sizing: border-box; }
.ui-rtf__layout {
  display: grid;
  grid-template-columns: minmax(var(--tc-rtf-list-min), var(--tc-rtf-list-max)) minmax(0, 1fr);
  align-items: start;
  gap: var(--tc-space-4);
}
@container (max-width: 760px) { .ui-rtf__layout { grid-template-columns: minmax(0, 1fr); } }

/* A card: Standard puts the header on the gray tray above the white card; Clean is one white card, header first */
.ui-rtf__card { min-width: 0; padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
.ui-rtf__body { padding: var(--tc-space-3) var(--tc-space-4); border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
[data-ui="rtf"][data-look="clean"] .ui-rtf__card { padding: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
[data-ui="rtf"][data-look="clean"] .ui-rtf__body { padding: 0 var(--tc-space-4) var(--tc-space-4); border-radius: 0; background: none; box-shadow: none; }
.ui-rtf__list .ui-rtf__body { padding: var(--tc-space-1); }
[data-ui="rtf"][data-look="clean"] .ui-rtf__list .ui-rtf__body { padding: 0 var(--tc-space-1-5) var(--tc-space-1-5); }

/* Pills: tinted status recipes */
.ui-rtf__pill { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); color: var(--tc-text-secondary); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); white-space: nowrap; }
.ui-rtf__pill[data-dot]::before { content: ""; width: var(--tc-space-1-5); height: var(--tc-space-1-5); border-radius: 50%; background: currentColor; }
.ui-rtf__pill[data-tone="danger"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-rtf__pill[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-rtf__pill[data-tone="info"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-rtf__pill[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-rtf__count { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-rtf__tag, .ui-rtf__chip { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); color: var(--tc-text-secondary); font-size: var(--tc-pill-font-size); white-space: nowrap; }
.ui-rtf__chip { font-family: var(--tc-font-mono); }
.ui-rtf__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); margin: 0; padding: 0; list-style: none; }
.ui-rtf__code, .ui-rtf__mono { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-rtf__when { margin-left: auto; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); white-space: nowrap; }
.ui-rtf__row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); min-width: 0; }
.ui-rtf__empty { margin: 0; padding: var(--tc-space-3); color: var(--tc-text-muted); }

/* The list */
.ui-rtf__options { display: grid; gap: var(--tc-space-0-5); outline: none; }
.ui-rtf__option { display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-md); cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rtf__option:hover { background: var(--tc-fill-hover); }
.ui-rtf__option[aria-selected="true"] { background: var(--tc-fill-selected); box-shadow: inset 2px 0 0 var(--tc-status-danger-solid); }
/* On the selected tint, quiet text steps up a level so it keeps text contrast in dark */
.ui-rtf__option[aria-selected="true"] :is(.ui-rtf__code, .ui-rtf__when) { color: var(--tc-text-secondary); }
.ui-rtf__option:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-offset) * -1); }
.ui-rtf__option-title { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }

/* The detail */
.ui-rtf__detail { display: grid; gap: var(--tc-space-4); min-width: 0; animation: ui-rtf-in var(--tc-duration-moderate) var(--tc-ease-out) both; }
.ui-rtf__intro { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-1) var(--tc-space-1) 0; }
.ui-rtf__title { margin: 0; font-size: var(--tc-font-size-2xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-display-sm); letter-spacing: var(--tc-tracking-snug); color: var(--tc-text-strong); text-wrap: balance; }
[data-ui="rtf"][data-look="clean"] .ui-rtf__title { font-weight: var(--tc-font-weight-medium); }
.ui-rtf__summary, .ui-rtf__text { margin: 0; color: var(--tc-text-secondary); font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-relaxed); max-width: 68ch; }
.ui-rtf__text { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); margin-bottom: var(--tc-space-2-5); }
.ui-rtf__affected { justify-content: space-between; gap: var(--tc-space-3); }

.ui-rtf__rules { display: grid; margin: 0; padding: 0; list-style: none; }
.ui-rtf__rules li { display: flex; align-items: flex-start; gap: var(--tc-space-2-5); padding: var(--tc-space-2) 0; border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rtf__rules li:first-child { border-top: 0; }
.ui-rtf__x { flex: none; display: grid; place-items: center; width: var(--tc-space-5); height: var(--tc-space-5); border-radius: 50%; background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-rtf__x svg { width: var(--tc-space-3); height: var(--tc-space-3); stroke-width: 2.5; }
.ui-rtf__rule { display: block; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-rtf__rule-detail { display: block; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }

.ui-rtf__pair { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: var(--tc-space-4); align-items: stretch; }
.ui-rtf__pair > .ui-rtf__card { display: flex; flex-direction: column; }
.ui-rtf__pair .ui-rtf__body { flex: 1; }

.ui-rtf__evidence { display: grid; gap: var(--tc-space-0-5); margin: calc(var(--tc-space-1) * -1) calc(var(--tc-space-2) * -1); padding: 0; list-style: none; }
.ui-rtf__ev { display: flex; align-items: center; gap: var(--tc-space-2-5); width: 100%; padding: var(--tc-space-2); border: 0; border-radius: var(--tc-radius-md); background: none; font: inherit; color: inherit; text-align: left; }
button.ui-rtf__ev { min-height: var(--tc-control-h-sm); cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
button.ui-rtf__ev:hover { background: var(--tc-fill-hover); }
button.ui-rtf__ev:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-offset) * -1); }
.ui-rtf__ev-icon { flex: none; display: grid; place-items: center; width: var(--tc-space-7); height: var(--tc-space-7); border-radius: var(--tc-radius-sm); background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-rtf__ev-icon svg, .ui-rtf__ev-go svg { width: var(--tc-space-4); height: var(--tc-space-4); stroke-width: 1.75; }
.ui-rtf__ev-text { flex: 1; min-width: 0; display: grid; }
.ui-rtf__ev-label { font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-rtf__ev-detail { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-rtf__ev-go { color: var(--tc-icon-muted); }

@keyframes ui-rtf-in { from { opacity: 0; transform: translateY(4px); } }
@media (prefers-reduced-motion: reduce) { .ui-rtf__detail { animation: none; } .ui-rtf__option, button.ui-rtf__ev { transition: none; } }
@media (forced-colors: active) {
  .ui-rtf__option[aria-selected="true"] { outline: 2px solid Highlight; }
  .ui-rtf__pill, .ui-rtf__tag, .ui-rtf__chip { border: 1px solid CanvasText; }
}
`;
}

if (!customElements.get("tc-red-team-finding")) customElements.define("tc-red-team-finding", TcRedTeamFinding);
declare global {
  interface HTMLElementTagNameMap {
    "tc-red-team-finding": TcRedTeamFinding;
  }
}
