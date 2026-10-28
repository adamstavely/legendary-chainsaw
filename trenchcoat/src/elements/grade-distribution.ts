import { html, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";

/*
 * <tc-grade-distribution> – how a set of assessments came out: one count per grade over its name (by default
 * Outstanding, Excellent, Satisfactory, Dissatisfactory), a heading with how many were assessed, grades with none
 * muted, and an optional bar in proportion underneath. A grade can be picked as a filter.
 *   · the grades are a toolbar of toggle buttons, one tab stop: ← / → move, Home / End to the ends; Enter or Space
 *     picks a grade (again clears), Escape clears
 * Standard: the heading on a gray tray above a white card. Clean: one white card, the heading its first row.
 *
 *   <tc-grade-distribution .grades=${[{ id: "outstanding", label: "Outstanding", count: 1 }, …]}></tc-grade-distribution>
 */

export type GradeTone = "neutral" | "info" | "success" | "warning" | "danger";
export type Grade = { id: string; label: string; count: number; tone?: GradeTone };

/** Details of the events */
export type GradeSelectedChange = { selected: string | null; grade?: Grade };

export const defaultGrades: Grade[] = [
  { id: "outstanding", label: "Outstanding", count: 0, tone: "success" },
  { id: "excellent", label: "Excellent", count: 0, tone: "info" },
  { id: "satisfactory", label: "Satisfactory", count: 0, tone: "neutral" },
  { id: "dissatisfactory", label: "Dissatisfactory", count: 0, tone: "danger" },
];

/**
 * Assessment grades as counts, with how many were assessed, an optional bar in proportion and a grade picked as a
 * filter.
 * @tag tc-grade-distribution
 * @fires tc-selected-change - A grade was picked or cleared as a filter ({ selected, grade }: GradeSelectedChange); cancelable – prevented, `selected` stays as it was
 */
export class TcGradeDistribution extends TcElement {
  static override ui = "grd";

  /** The heading */
  @property() accessor heading = "Grades";
  /** What was assessed, after the count: "2 assessed" */
  @property({ attribute: "assessed-label" }) accessor assessedLabel = "assessed";
  /** The grades in order, best first, each with its count */
  @property({ attribute: false }) accessor grades: Grade[] = defaultGrades;
  /** Shows a bar in proportion under the counts */
  @property({ type: Boolean }) accessor bar = false;
  /** Grades can be picked as a filter */
  @property({ type: Boolean }) accessor selectable = false;
  /** The grade picked as a filter. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property({ attribute: false }) accessor selected: string | null = null;

  @state() private accessor active: string | null = null;

  private get total() {
    return this.grades.reduce((n, g) => n + Math.max(0, g.count), 0);
  }

  private setSelected(next: string | null) {
    if (next === this.selected) return;
    const grade = next ? this.grades.find((g) => g.id === next) : undefined;
    if (!this.emit<GradeSelectedChange>("tc-selected-change", { selected: next, grade }, { cancelable: true })) return;
    this.selected = next;
  }

  private focusGrade(i: number) {
    const g = this.grades[Math.max(0, Math.min(this.grades.length - 1, i))];
    if (!g) return;
    this.active = g.id;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-grade="${CSS.escape(g.id)}"]`)?.focus());
  }
  private onKey = (e: KeyboardEvent) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-grade]");
    if (!el || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const i = this.grades.findIndex((g) => g.id === el.dataset.grade);
    const moves: Record<string, number> = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: this.grades.length - 1 };
    if (e.key in moves) {
      e.preventDefault();
      this.focusGrade(moves[e.key]);
    } else if (e.key === "Escape" && this.selected) {
      e.preventDefault();
      this.setSelected(null);
    }
  };

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (this.selected && !this.grades.some((g) => g.id === this.selected)) this.selected = null;
    if (this.active && !this.grades.some((g) => g.id === this.active)) this.active = null;
  }

  private renderGrade(g: Grade) {
    const body = html`<span class="ui-grd__count">${Math.max(0, g.count)}</span><span class="ui-grd__label">${g.label}</span>`;
    if (!this.selectable) return html`<li class="ui-grd__grade" data-tone=${g.tone ?? "neutral"} ?data-zero=${g.count <= 0}>${body}</li>`;
    const stop = (this.active ?? this.selected ?? this.grades[0]?.id) === g.id;
    return html`<li class="ui-grd__grade" role="none" data-tone=${g.tone ?? "neutral"} ?data-zero=${g.count <= 0}>
      <button
        type="button"
        class="ui-grd__pick"
        data-grade=${g.id}
        tabindex=${stop ? 0 : -1}
        aria-pressed=${this.selected === g.id ? "true" : "false"}
        ?data-selected=${this.selected === g.id}
        @focus=${() => (this.active = g.id)}
        @click=${() => {
          this.active = g.id;
          this.setSelected(this.selected === g.id ? null : g.id);
        }}
      >${body}</button>
    </li>`;
  }

  protected override render() {
    const total = this.total;
    return html`
      <div class="ui-grd__head">
        <span class="ui-grd__heading">${this.heading}</span>
        <span class="ui-grd__assessed">· ${total} ${this.assessedLabel}</span>
      </div>
      <div class="ui-grd__card">
        <ul class="ui-grd__grades" role=${this.selectable ? "toolbar" : "list"} aria-label=${`${this.heading}, ${total} ${this.assessedLabel}`} @keydown=${this.onKey}>
          ${repeat(this.grades, (g) => g.id, (g) => this.renderGrade(g))}
        </ul>
        ${this.bar && total > 0
          ? html`<div class="ui-grd__bar" aria-hidden="true">
              ${this.grades.filter((g) => g.count > 0).map((g) => html`<span class="ui-grd__seg" data-tone=${g.tone ?? "neutral"} title=${`${g.label}: ${g.count}`} style=${`flex-grow: ${g.count}`}></span>`)}
            </div>`
          : nothing}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="grd"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-space-2-5) var(--tc-tray-inset) var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="grd"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-space-3) var(--tc-space-4);
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="grd"] *, [data-ui="grd"] *::before, [data-ui="grd"] *::after { box-sizing: border-box; }
:where([data-ui="grd"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="grd"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="grd"] ul { margin: 0; padding: 0; list-style: none; }
/* The heading: a caption with how many were assessed */
.ui-grd__head { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-1); padding: 0 var(--tc-space-1) var(--tc-space-2); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
:where([data-look="clean"], [data-look="clean"] *).ui-grd__head { padding: 0 0 var(--tc-space-2); }
.ui-grd__assessed { color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-grd__card { padding: var(--tc-space-3) var(--tc-space-3-5); border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* The grades: a count over each name, in a row */
.ui-grd__grades { display: grid; grid-template-columns: repeat(auto-fit, minmax(84px, 1fr)); gap: var(--tc-space-2); }
.ui-grd__grade { min-width: 0; }
.ui-grd__grade > .ui-grd__pick, .ui-grd__grade:not(:has(> .ui-grd__pick)) { display: grid; gap: var(--tc-space-0-5); width: 100%; padding: var(--tc-space-1-5) var(--tc-space-2); border-radius: var(--tc-radius-md); }
.ui-grd__pick { transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-grd__pick:hover { background: var(--tc-fill-subtle) !important; }
.ui-grd__pick[data-selected] { background: var(--tc-fill-selected) !important; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-selected); }
.ui-grd__pick[data-selected] .ui-grd__label { color: var(--tc-text-secondary); }
.ui-grd__count { font-size: var(--tc-font-size-2xl); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-display-sm); letter-spacing: var(--tc-tracking-tight); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-grd__label { overflow: hidden; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-grd__grade[data-tone="success"] .ui-grd__count { color: var(--tc-status-success-fg); }
.ui-grd__grade[data-tone="info"] .ui-grd__count { color: var(--tc-status-info-fg); }
.ui-grd__grade[data-tone="warning"] .ui-grd__count { color: var(--tc-status-warning-fg); }
.ui-grd__grade[data-tone="danger"] .ui-grd__count { color: var(--tc-status-danger-fg); }
/* No assessments at a grade: quiet, so the grades that happened stand out */
.ui-grd__grade[data-zero] .ui-grd__count { color: var(--tc-text-disabled); font-weight: var(--tc-font-weight-regular); }
/* The bar in proportion */
.ui-grd__bar { display: flex; gap: var(--tc-space-0-5); height: 6px; margin-top: var(--tc-space-2-5); overflow: hidden; border-radius: var(--tc-meter-radius); }
.ui-grd__seg { display: block; min-width: 4px; height: 100%; background: var(--tc-icon-muted); }
.ui-grd__seg[data-tone="success"] { background: var(--tc-status-success-solid); }
.ui-grd__seg[data-tone="info"] { background: var(--tc-status-info-solid); }
.ui-grd__seg[data-tone="warning"] { background: var(--tc-status-warning-solid); }
.ui-grd__seg[data-tone="danger"] { background: var(--tc-status-danger-solid); }
@media (forced-colors: active) {
  .ui-grd__pick[data-selected] { outline: 2px solid Highlight; }
  .ui-grd__seg { border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="grd"] *, [data-ui="grd"] *::before, [data-ui="grd"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-grade-distribution")) customElements.define("tc-grade-distribution", TcGradeDistribution);

declare global {
  interface HTMLElementTagNameMap {
    "tc-grade-distribution": TcGradeDistribution;
  }
}
