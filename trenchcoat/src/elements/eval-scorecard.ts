import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, RowWindowController, ToolbarController } from "./internal/controllers";
import { compact } from "./internal/format";
import { diffWords, type DiffSegment } from "./inline-diff";

/*
 * <tc-eval-scorecard> – a set of test cases run against prompt or model versions: pass or fail per case per version as
 * a grid, the pass rate across versions as a trend, filters by tag and by outcome, and a case opened with its output
 * beside the expected answer.
 *   · the trend: one column per version – its pass rate, the change from the version before, a line through them
 *   · the grid: a row per case, a column per version; a failure where the version before passed is marked regressed
 *   · filters: tags (any of the picked ones) and All / Failing / Regressed, judged on the latest version; the trend
 *     follows the filters, so a tag's pass rate across versions is one click away
 *   · open a cell: the case's input, why it failed, and its output beside the expected answer, diffed word by word
 *     (Inline Diff's diffWords); the version buttons switch between its runs
 *   · long sets render only the rows near the scroll position (10,000 cases stay fast)
 * Standard is a gray tray with the scorecard on a white card; Clean is one white card with hairline dividers. Wide,
 * the open case sits beside the grid; narrow, below it.
 *
 *   <tc-eval-scorecard heading="Support replies" .versions=${versions} .cases=${cases}></tc-eval-scorecard>
 *
 * `tags`, `show` and `open` change on their own; preventDefault() on tc-tags-change, tc-show-change or tc-open-change
 * keeps control.
 */

export type EvalOutcome = "pass" | "fail" | "error" | "pending";

export type EvalVersion = {
  id: string;
  /** Short – it heads a grid column: "v4", "Prompt 12" */
  label: string;
  /** What else sets it apart – the model, a date; shown in the trend */
  detail?: string;
  /** "running" while its results still come in */
  status?: "running" | "done";
};

export type EvalResult = {
  outcome: EvalOutcome;
  /** What the version answered – diffed against the case's expected answer */
  output?: string;
  /** The grader's score, already formatted or a number – shown with the result */
  score?: number | string;
  /** Why it passed or failed, in a line – the grader's reason */
  reason?: string;
};

export type EvalCase = {
  id: string;
  /** What the case tests, in a few words – the row's label */
  name: string;
  /** The prompt or input the versions were given */
  input?: string;
  /** The answer a pass looks like */
  expected?: string;
  tags?: string[];
  /** One result per version, by the version's id; a version without one hasn't run the case */
  results: Record<string, EvalResult | undefined>;
};

export type EvalScorecardShow = "all" | "failing" | "regressed";
/** The open case and the version whose run is shown */
export type EvalScorecardOpen = { caseId: string; versionId: string };
export type EvalScorecardTagsChange = { tags: string[] };
export type EvalScorecardShowChange = { show: EvalScorecardShow };
export type EvalScorecardOpenChange = { open: EvalScorecardOpen | null };

/** One version's numbers over the cases on show */
export type EvalVersionStats = { pass: number; fail: number; error: number; pending: number; rate: number | null };

const failed = (r: EvalResult | undefined) => r?.outcome === "fail" || r?.outcome === "error";
const OUTCOME: Record<EvalOutcome | "none", string> = { pass: "Pass", fail: "Fail", error: "Error", pending: "Running", none: "Not run" };
const SHOWS: Record<EvalScorecardShow, string> = { all: "All", failing: "Failing", regressed: "Regressed" };
const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
const percent = (rate: number) => `${Math.round(rate * 100)}%`;

/** Pass rate per version over a set of cases: passes over everything that finished; null when nothing has */
export function evalStats(versions: EvalVersion[], cases: readonly EvalCase[]): EvalVersionStats[] {
  return versions.map((v) => {
    const s = { pass: 0, fail: 0, error: 0, pending: 0, rate: null as number | null };
    for (const c of cases) {
      const r = c.results[v.id];
      if (r) s[r.outcome]++;
    }
    const done = s.pass + s.fail + s.error;
    s.rate = done ? s.pass / done : null;
    return s;
  });
}

/** Whether a case failed on the latest version after passing on the one before */
export function evalRegressed(c: EvalCase, versions: EvalVersion[]) {
  const n = versions.length;
  return n > 1 && c.results[versions[n - 2].id]?.outcome === "pass" && failed(c.results[versions[n - 1].id]);
}

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
const glyph = (d: TemplateResult) => html`<svg class="ui-evs__glyph" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const ICONS: Record<EvalOutcome | "none", TemplateResult> = {
  pass: glyph(svg`<path d="M5 12.5l4.5 4.5L19 7.5"></path>`),
  fail: glyph(svg`<path d="M7 7l10 10M17 7L7 17"></path>`),
  error: glyph(svg`<path d="M12 6.5v7M12 17.5h.01"></path>`),
  pending: glyph(svg`<circle cx="12" cy="12" r="1.6"></circle>`),
  none: glyph(svg`<path d="M8 12h8"></path>`),
};
/* A clipboard with a check – the scorecard's mark */
const mark = html`<svg class="ui-evs__mark-svg" viewBox="0 0 24 24" aria-hidden="true">${svg`<rect x="5" y="4" width="14" height="17" rx="2"></rect><path d="M9 4.5h6M9 12.5l2 2 4-4"></path>`}</svg>`;
const closeIcon = html`<svg class="ui-evs__glyph" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M7 7l10 10M17 7L7 17"></path>`}</svg>`;

/** The windowed grid renders rows near the scroll position above this many cases */
const VIRTUAL_FROM = 60;
const OVERSCAN = 20;
const ROW = 36;
const PAGE = 10;

type Cell = { r: number; c: number };
let instances = 0;

/**
 * Test cases run against prompt or model versions – pass or fail per case per version, the pass rate across versions,
 * filters by tag, and a case opened beside its expected answer.
 * @tag tc-eval-scorecard
 * @fires tc-tags-change - The picked tags changed ({ tags }: EvalScorecardTagsChange); cancelable
 * @fires tc-show-change - All, Failing or Regressed was picked ({ show }: EvalScorecardShowChange); cancelable
 * @fires tc-open-change - A case was opened, switched to another version or closed ({ open }: EvalScorecardOpenChange); cancelable
 */
export class TcEvalScorecard extends TcElement {
  static override ui = "evs";

  /** The heading – the eval set's name */
  @property() accessor heading = "Evals";
  /** The versions in the order they were made – the last one is judged by the Failing and Regressed filters */
  @property({ attribute: false }) accessor versions: EvalVersion[] = [];
  /** The test cases, each with its results per version */
  @property({ attribute: false }) accessor cases: EvalCase[] = [];
  /** The picked tags – a case with any of them shows; none picked shows every case */
  @property({ attribute: false }) accessor tags: string[] = [];
  /** Which cases show: "all", "failing" (on the latest version) or "regressed" (passed on the one before, fails now) */
  @property() accessor show: EvalScorecardShow = "all";
  /** The open case and version, or null for none */
  @property({ attribute: false }) accessor open: EvalScorecardOpen | null = null;
  /** The grid's height before it scrolls, in px */
  @property({ type: Number, attribute: "max-height" }) accessor maxHeight = 360;
  /** Formats a pass rate (0–1) – defaults to a whole percentage, e.g. "86%" */
  @property({ attribute: false }) accessor formatRate: (rate: number) => string = percent;

  /** @internal The grid's active cell: row in the shown cases, column 0 the case, 1… the versions */
  @state() accessor active: Cell | null = null;
  /** @internal What the status region says after a filter changes */
  @state() accessor spoken = "";

  private readonly uid = `tc-evs${++instances}`;
  /** @internal The cases on show, after the filters */
  private view: EvalCase[] = [];
  private stats: EvalVersionStats[] = [];
  private tagCounts: [string, number][] = [];
  private showCounts: Record<EvalScorecardShow, number> = { all: 0, failing: 0, regressed: 0 };
  private diffKey = "";
  private diff: DiffSegment[] = [];
  private readonly window = new RowWindowController(this, {
    count: () => this.view.length,
    body: () => this.querySelector(".ui-evs__rows"),
    rowSelector: ".ui-evs__row",
    from: VIRTUAL_FROM,
    overscan: OVERSCAN,
    rowHeight: ROW,
  });
  private readonly runs = new ToolbarController(this, { items: () => [...this.querySelectorAll<HTMLElement>(".ui-evs__run")] });

  constructor() {
    super();
    // Closing the case or filtering it away never drops focus to <body>
    new FocusRescueController(this, () => this.grid);
  }

  /** @internal */
  private get grid() {
    return this.querySelector<HTMLElement>(".ui-evs__grid");
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("cases")) {
      const counts = new Map<string, number>();
      for (const c of this.cases) for (const t of c.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
      this.tagCounts = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    }
    if (changed.has("cases") || changed.has("versions") || changed.has("tags") || changed.has("show")) {
      const versions = this.versions;
      const last = versions[versions.length - 1];
      const picked = new Set(this.tags);
      const tagged = picked.size ? this.cases.filter((c) => c.tags?.some((t) => picked.has(t))) : this.cases;
      const failing = last ? tagged.filter((c) => failed(c.results[last.id])) : [];
      const regressed = failing.filter((c) => evalRegressed(c, versions));
      this.showCounts = { all: tagged.length, failing: failing.length, regressed: regressed.length };
      this.view = this.show === "failing" ? failing : this.show === "regressed" ? regressed : tagged;
      this.stats = evalStats(versions, this.view);
      if (this.active && this.active.r >= this.view.length) this.active = this.view.length ? { r: this.view.length - 1, c: this.active.c } : null;
    }
    this.window.compute();
  }

  /** @internal The open case and its result, if both exist */
  private get opened() {
    const o = this.open;
    if (!o) return null;
    const c = this.cases.find((x) => x.id === o.caseId);
    const v = this.versions.find((x) => x.id === o.versionId);
    return c && v ? { c, v, r: c.results[v.id] } : null;
  }

  /** @internal */
  private setTags(tags: string[]) {
    if (this.emit<EvalScorecardTagsChange>("tc-tags-change", { tags }, { cancelable: true })) this.tags = tags;
    void this.updateComplete.then(() => (this.spoken = `${plural(this.view.length, "case")} of ${this.cases.length.toLocaleString("en-US")}`));
  }

  /** @internal */
  private setShow(show: EvalScorecardShow, focus = false) {
    if (show !== this.show && this.emit<EvalScorecardShowChange>("tc-show-change", { show }, { cancelable: true })) this.show = show;
    void this.updateComplete.then(() => {
      this.spoken = `${SHOWS[this.show]}: ${plural(this.view.length, "case")}`;
      if (focus) this.querySelector<HTMLElement>(`.ui-evs__show [aria-checked="true"]`)?.focus();
    });
  }

  /** @internal */
  private setOpen(open: EvalScorecardOpen | null) {
    const same = open && this.open ? open.caseId === this.open.caseId && open.versionId === this.open.versionId : open === this.open;
    if (same) return;
    if (this.emit<EvalScorecardOpenChange>("tc-open-change", { open }, { cancelable: true })) this.open = open;
  }

  /** @internal Opens a grid cell: a version column opens that run; the case column opens the latest run */
  private openCell(cell: Cell) {
    const c = this.view[cell.r];
    const v = cell.c > 0 ? this.versions[cell.c - 1] : this.versions[this.versions.length - 1];
    if (c && v) this.setOpen({ caseId: c.id, versionId: v.id });
  }

  /** @internal Scrolls the grid so a row is in view, and moves the window there */
  private reveal(r: number) {
    const grid = this.grid;
    if (!grid) return;
    const head = this.querySelector<HTMLElement>(".ui-evs__head")?.offsetHeight ?? 0;
    const h = this.window.rowHeight;
    if (r * h < grid.scrollTop) grid.scrollTop = r * h;
    else if (head + (r + 1) * h > grid.scrollTop + grid.clientHeight) grid.scrollTop = head + (r + 1) * h - grid.clientHeight;
    this.window.reveal(r);
  }

  /** @internal APG grid: arrows, Home / End, Ctrl+Home / End, Page Up / Down; Enter or Space opens; Esc closes */
  private onGridKey = (e: KeyboardEvent) => {
    const rows = this.view.length;
    const cols = this.versions.length + 1;
    if (!rows) return;
    if (e.key === "Escape") {
      if (this.open) {
        e.preventDefault();
        this.setOpen(null);
      }
      return;
    }
    const at = this.active ?? { r: 0, c: 0 };
    const mod = e.ctrlKey || e.metaKey;
    const moves: Record<string, Cell> = {
      ArrowDown: { r: at.r + 1, c: at.c },
      ArrowUp: { r: at.r - 1, c: at.c },
      ArrowRight: { r: at.r, c: at.c + 1 },
      ArrowLeft: { r: at.r, c: at.c - 1 },
      Home: mod ? { r: 0, c: 0 } : { r: at.r, c: 0 },
      End: mod ? { r: rows - 1, c: cols - 1 } : { r: at.r, c: cols - 1 },
      PageDown: { r: at.r + PAGE, c: at.c },
      PageUp: { r: at.r - PAGE, c: at.c },
    };
    if (e.key in moves) {
      e.preventDefault();
      const to = moves[e.key];
      const next = this.active ? { r: Math.max(0, Math.min(rows - 1, to.r)), c: Math.max(0, Math.min(cols - 1, to.c)) } : at;
      this.active = next;
      this.reveal(next.r);
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.active = at;
      this.openCell(at);
    }
  };

  /** @internal Tags: a toggle each */
  private toggleTag(tag: string) {
    const on = this.tags.includes(tag);
    this.setTags(on ? this.tags.filter((t) => t !== tag) : [...this.tags, tag]);
  }

  /** @internal APG radio group: arrows move and pick */
  private onShowKey = (e: KeyboardEvent) => {
    const all = Object.keys(SHOWS) as EvalScorecardShow[];
    const at = all.indexOf(this.show);
    const step: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(e.key in step)) return;
    e.preventDefault();
    this.setShow(all[(at + step[e.key] + all.length) % all.length], true);
  };

  protected override updated() {
    // A cell outside the rendered rows has no id to point at until the window reaches it
    if (this.active && !this.querySelector(`#${this.uid}-${this.active.r}-${this.active.c}`) && this.window.virtual) this.window.reveal(this.active.r);
  }

  /** @internal An outcome as a small mark with its word for screen readers */
  private outcome(r: EvalResult | undefined, extra = "") {
    const key = r?.outcome ?? "none";
    return html`<span class="ui-evs__out" data-outcome=${key}>${ICONS[key]}<span class="ui-evs__sr">${OUTCOME[key]}${extra}</span></span>`;
  }

  /** @internal The trend: a column per version, a line through their pass rates */
  private trend() {
    const versions = this.versions;
    const stats = this.stats;
    const n = versions.length;
    if (!n) return nothing;
    const rates = stats.map((s) => s.rate);
    const known = rates.filter((r): r is number => r !== null);
    const lo = known.length ? Math.max(0, Math.floor((Math.min(...known) - 0.05) * 10) / 10) : 0;
    const x = (i: number) => ((i + 0.5) / n) * 100;
    const y = (r: number) => (1 - (r - lo) / (1 - lo || 1)) * 100;
    const points = rates.map((r, i) => (r === null ? null : `${x(i)},${y(r)}`)).filter(Boolean);
    return html`<div class="ui-evs__trend" style=${styleMap({ "--tc-eval-scorecard-versions": String(n) })}>
      <div class="ui-evs__plot" aria-hidden="true">
        <svg class="ui-evs__line" viewBox="0 0 100 100" preserveAspectRatio="none">${points.length > 1 ? svg`<polyline points=${points.join(" ")} vector-effect="non-scaling-stroke"></polyline>` : nothing}</svg>
        ${rates.map((r, i) =>
          r === null ? nothing : html`<span class="ui-evs__dot" ?data-last=${i === n - 1} style=${styleMap({ left: `${x(i)}%`, top: `${y(r)}%` })}></span>`,
        )}
      </div>
      <ol class="ui-evs__vers" aria-label="Pass rate by version">
        ${versions.map((v, i) => {
          const s = stats[i];
          const prev = i > 0 ? stats[i - 1].rate : null;
          const delta = s.rate !== null && prev !== null ? Math.round((s.rate - prev) * 100) : null;
          const done = s.pass + s.fail + s.error;
          return html`<li class="ui-evs__ver" ?data-last=${i === n - 1}>
            <span class="ui-evs__ver-label" title=${v.detail ? `${v.label} · ${v.detail}` : v.label}>${v.label}${v.detail ? html`<span class="ui-evs__ver-detail"> · ${v.detail}</span>` : nothing}</span>
            <span class="ui-evs__rate">${s.rate === null ? "–" : this.formatRate(s.rate)}</span>
            <span class="ui-evs__ver-sub">
              ${delta
                ? html`<span class="ui-evs__delta" data-tone=${delta > 0 ? "better" : "worse"}><span class="ui-evs__sr">, </span>${delta > 0 ? "+" : "−"}${Math.abs(delta)}<span class="ui-evs__sr"> points</span></span>`
                : nothing}
              ${v.status === "running" ? html`<span class="ui-evs__running">Running</span>` : nothing}
              <span class="ui-evs__ver-count"><span class="ui-evs__sr">, </span>${done ? `${compact(s.pass)} / ${compact(done)}` : "No results"}<span class="ui-evs__sr"> passed</span></span>
            </span>
          </li>`;
        })}
      </ol>
    </div>`;
  }

  /** @internal The filters: tags as toggles, the outcome as a radio group */
  private filters() {
    const picked = new Set(this.tags);
    const all = Object.keys(SHOWS) as EvalScorecardShow[];
    return html`<div class="ui-evs__filters">
      <div class="ui-evs__show" role="radiogroup" aria-label="Show" @keydown=${this.onShowKey}>
        ${all.map(
          (s) => html`<button
            type="button"
            role="radio"
            class="ui-evs__opt"
            aria-checked=${s === this.show ? "true" : "false"}
            tabindex=${s === this.show ? 0 : -1}
            @click=${() => this.setShow(s)}
          >
            ${SHOWS[s]}<span class="ui-evs__count"><span class="ui-evs__sr">, </span>${compact(this.showCounts[s])}<span class="ui-evs__sr"> ${this.showCounts[s] === 1 ? "case" : "cases"}</span></span>
          </button>`,
        )}
      </div>
      ${this.tagCounts.length
        ? html`<div class="ui-evs__tags" role="group" aria-label="Tags">
            ${this.tagCounts.map(
              ([t, n]) => html`<button type="button" class="ui-evs__tag" aria-pressed=${picked.has(t) ? "true" : "false"} @click=${() => this.toggleTag(t)}>
                ${t}<span class="ui-evs__count"><span class="ui-evs__sr">, </span>${compact(n)}<span class="ui-evs__sr"> ${n === 1 ? "case" : "cases"}</span></span>
              </button>`,
            )}
            ${picked.size ? html`<button type="button" class="ui-evs__clear" @click=${() => this.setTags([])}>Clear</button>` : nothing}
          </div>`
        : nothing}
    </div>`;
  }

  /** @internal One case's row */
  private row(c: EvalCase, r: number): TemplateResult {
    const a = this.active;
    const versions = this.versions;
    const open = this.open;
    return html`<div class="ui-evs__row" role="row" aria-rowindex=${r + 2} ?data-open=${open?.caseId === c.id}>
      <div
        class="ui-evs__case"
        role="gridcell"
        id=${`${this.uid}-${r}-0`}
        ?data-active=${a?.r === r && a.c === 0}
        @click=${() => {
          this.active = { r, c: 0 };
          this.openCell({ r, c: 0 });
        }}
      >
        <span class="ui-evs__name" title=${c.name}>${c.name}</span>${c.tags?.length ? html`<span class="ui-evs__case-tags"><span class="ui-evs__sr">, </span>${c.tags.join(" · ")}</span>` : nothing}
      </div>
      ${versions.map((v, i) => {
        const res = c.results[v.id];
        const regressed = i > 0 && failed(res) && c.results[versions[i - 1].id]?.outcome === "pass";
        return html`<div
          class="ui-evs__cell"
          role="gridcell"
          id=${`${this.uid}-${r}-${i + 1}`}
          data-outcome=${res?.outcome ?? "none"}
          ?data-regressed=${regressed}
          ?data-active=${a?.r === r && a.c === i + 1}
          ?data-open=${open?.caseId === c.id && open.versionId === v.id}
          title=${`${v.label}: ${OUTCOME[res?.outcome ?? "none"]}${regressed ? " – regressed" : ""}`}
          @click=${() => {
            this.active = { r, c: i + 1 };
            this.openCell({ r, c: i + 1 });
          }}
        >
          ${this.outcome(res, regressed ? `, regressed from ${versions[i - 1].label}` : "")}
        </div>`;
      })}
    </div>`;
  }

  /** @internal The open case: its input, the grader's reason, and the output beside the expected answer */
  private detail() {
    const o = this.opened;
    if (!o) return nothing;
    const { c, v, r } = o;
    const key = `${c.id}\u0000${v.id}\u0000${c.expected ?? ""}\u0000${r?.output ?? ""}`;
    if (key !== this.diffKey) {
      this.diffKey = key;
      this.diff = c.expected !== undefined && r?.output !== undefined ? diffWords(c.expected, r.output, 250_000) : [];
    }
    const titleId = `${this.uid}-case`;
    const side = (which: "expected" | "output") => {
      const text = which === "expected" ? c.expected : r?.output;
      if (text === undefined) return html`<p class="ui-evs__text" data-empty>${which === "expected" ? "No expected answer" : r?.outcome === "pending" ? "Still running" : "No output"}</p>`;
      if (!this.diff.length) return html`<p class="ui-evs__text">${text}</p>`;
      return html`<p class="ui-evs__text">${this.diff.map((s) => {
        if (s.type === "equal") return s.text;
        const t = which === "expected" ? s.remove : s.insert;
        if (!t) return nothing;
        return which === "expected" ? html`<del class="ui-evs__miss">${t}</del>` : html`<ins class="ui-evs__extra">${t}</ins>`;
      })}</p>`;
    };
    return html`<section class="ui-evs__detail" aria-labelledby=${titleId} @keydown=${(e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      this.setOpen(null);
      this.grid?.focus();
    }}>
      <div class="ui-evs__detail-head">
        <h4 class="ui-evs__case-title" id=${titleId}>${c.name}</h4>
        <button
          type="button"
          class="ui-evs__close"
          aria-label="Close case"
          title="Close"
          @click=${() => {
            this.setOpen(null);
            this.grid?.focus();
          }}
        >${closeIcon}</button>
      </div>
      <div class="ui-evs__runs" role="toolbar" aria-label="Versions" @keydown=${this.runs.onKeyDown} @focusin=${this.runs.onFocusIn}>
        ${this.versions.map(
          (ver) => html`<button
            type="button"
            class="ui-evs__run"
            aria-pressed=${ver.id === v.id ? "true" : "false"}
            @click=${() => this.setOpen({ caseId: c.id, versionId: ver.id })}
          >${this.outcome(c.results[ver.id], ", ")}<span>${ver.label}</span></button>`,
        )}
      </div>
      ${r?.reason || r?.score !== undefined
        ? html`<p class="ui-evs__verdict" data-outcome=${r.outcome}>
            <span class="ui-evs__pill" data-outcome=${r.outcome}>${OUTCOME[r.outcome]}</span>
            ${r.score !== undefined ? html`<span class="ui-evs__score">Score ${r.score}</span>` : nothing}
            ${r.reason ? html`<span class="ui-evs__reason">${r.reason}</span>` : nothing}
          </p>`
        : nothing}
      ${c.input !== undefined ? html`<div class="ui-evs__input"><span class="ui-evs__label">Input</span><p class="ui-evs__text">${c.input}</p></div>` : nothing}
      <div class="ui-evs__pair">
        <div class="ui-evs__side"><span class="ui-evs__label">Expected</span>${side("expected")}</div>
        <div class="ui-evs__side"><span class="ui-evs__label">Output · ${v.label}</span>${side("output")}</div>
      </div>
      ${this.diff.some((s) => s.type === "change")
        ? html`<p class="ui-evs__key"><span><del class="ui-evs__miss">missing</del> in the output</span><span><ins class="ui-evs__extra">added</ins> by the output</span></p>`
        : nothing}
    </section>`;
  }

  protected override render() {
    const versions = this.versions;
    const view = this.view;
    const { start, end } = this.window;
    const h = this.window.rowHeight;
    const a = this.active;
    const activeId = a && a.r >= start && a.r < end ? `${this.uid}-${a.r}-${a.c}` : undefined;
    const titleId = `${this.uid}-title`;
    const filtered = view.length !== this.cases.length;
    const opened = !!this.opened;
    return html`
      <div class="ui-evs__bar">
        <span class="ui-evs__mark">${mark}</span>
        <span class="ui-evs__title" id=${titleId}>${this.heading}</span>
        <span class="ui-evs__summary">${filtered ? `${compact(view.length)} of ${plural(this.cases.length, "case")}` : plural(this.cases.length, "case")} · ${plural(versions.length, "version")}</span>
      </div>
      <div class="ui-evs__card">
        ${this.trend()}
        ${this.filters()}
        <div class="ui-evs__main" ?data-open=${opened}>
          <div
            class="ui-evs__grid"
            role="grid"
            aria-labelledby=${titleId}
            aria-rowcount=${view.length + 1}
            aria-colcount=${versions.length + 1}
            aria-activedescendant=${ifDefined(activeId)}
            tabindex="0"
            style=${styleMap({ maxHeight: `${this.maxHeight}px`, "--tc-eval-scorecard-versions": String(versions.length) })}
            @keydown=${this.onGridKey}
            @focus=${() => {
              if (!this.active && view.length) this.active = { r: 0, c: versions.length ? versions.length : 0 };
            }}
          >
            <div class="ui-evs__head" role="rowgroup">
              <div class="ui-evs__row" role="row" aria-rowindex="1">
                <div class="ui-evs__case" role="columnheader">Case</div>
                ${versions.map((v) => html`<div class="ui-evs__cell" role="columnheader" title=${v.label}>${v.label}</div>`)}
              </div>
            </div>
            <div class="ui-evs__rows" role="rowgroup">
              <div class="ui-evs__spacer" aria-hidden="true" style=${styleMap({ height: `${start * h}px` })}></div>
              ${repeat(view.slice(start, end), (c) => c.id, (c, i) => this.row(c, start + i))}
              <div class="ui-evs__spacer" aria-hidden="true" style=${styleMap({ height: `${(view.length - end) * h}px` })}></div>
            </div>
            ${view.length === 0 ? html`<p class="ui-evs__empty">${this.cases.length ? "No cases match these filters" : "No cases yet"}</p>` : nothing}
          </div>
          ${this.detail()}
        </div>
      </div>
      <span class="ui-evs__sr" role="status">${this.spoken}</span>
    `;
  }

  static override css = /* css */ `
/* Colours and sizes as variables – override them on [data-ui="evs"] */
[data-ui="evs"] {
  --tc-eval-scorecard-col: 52px;
  --tc-eval-scorecard-row: 36px;
  --tc-eval-scorecard-line: var(--tc-accent);
  --tc-eval-scorecard-side: 400px;
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  letter-spacing: -0.006em;
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  container: ui-evs / inline-size;
}
/* Clean: no tray – one white card with hairline dividers */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="evs"] {
  --tc-eval-scorecard-col: 48px;
  --tc-eval-scorecard-row: 34px;
  padding: 0;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  letter-spacing: normal;
}
[data-ui="evs"] *, [data-ui="evs"] *::before, [data-ui="evs"] *::after { box-sizing: border-box; }
[data-ui="evs"] svg { display: block; flex: none; }
[data-ui="evs"] :is(p, h4, ol) { margin: 0; }
:where([data-ui="evs"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; letter-spacing: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="evs"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-evs__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-evs__glyph { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-evs__glyph { stroke-width: 2; }
/* ----- The header on the tray ----- */
.ui-evs__bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); min-width: 0; padding: var(--tc-space-1-5) var(--tc-space-1) var(--tc-space-2) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-evs__bar { padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-3) var(--tc-space-3-5); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-evs__mark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-accent-text); }
.ui-evs__mark-svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-evs__mark-svg { stroke-width: 1.4; }
.ui-evs__title { flex: none; max-width: 100%; overflow: hidden; font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-strong); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-evs__title { font-weight: var(--tc-font-weight-medium); }
.ui-evs__summary { min-width: 0; color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
/* ----- The card ----- */
.ui-evs__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-evs__card { border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); background: none; box-shadow: none; }
/* ----- The trend: one column per version, the line through their pass rates ----- */
.ui-evs__trend { position: relative; padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-3-5); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-evs__plot { position: relative; height: 36px; margin: 0 0 var(--tc-space-2-5); }
.ui-evs__plot::before { content: ""; position: absolute; top: 100%; right: 0; left: 0; height: var(--tc-hairline); background: var(--tc-border-subtle); }
.ui-evs__line { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.ui-evs__line polyline { fill: none; stroke: var(--tc-eval-scorecard-line); stroke-width: 1.75; stroke-linejoin: round; stroke-linecap: round; }
.ui-evs__dot { position: absolute; width: 7px; height: 7px; border-radius: 50%; translate: -50% -50%; background: var(--tc-surface-raised); box-shadow: inset 0 0 0 1.75px var(--tc-eval-scorecard-line); }
.ui-evs__dot[data-last] { background: var(--tc-eval-scorecard-line); }
.ui-evs__vers { display: grid; grid-template-columns: repeat(var(--tc-eval-scorecard-versions), minmax(0, 1fr)); padding: 0; list-style: none; }
.ui-evs__ver { display: grid; justify-items: center; gap: var(--tc-space-0-5); min-width: 0; padding: 0 var(--tc-space-1); text-align: center; }
.ui-evs__ver-label { max-width: 100%; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
.ui-evs__ver[data-last] .ui-evs__ver-label { color: var(--tc-text-secondary); font-weight: var(--tc-font-weight-medium); }
.ui-evs__ver-detail { color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); }
.ui-evs__rate { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-evs__rate { font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-medium); }
.ui-evs__delta { padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); letter-spacing: 0; }
.ui-evs__delta[data-tone="better"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-evs__delta[data-tone="worse"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-evs__ver-sub { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: var(--tc-space-0-5) var(--tc-space-1); max-width: 100%; min-height: 18px; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-evs__ver-count { white-space: nowrap; }
.ui-evs__running { color: var(--tc-accent-text); font-weight: var(--tc-font-weight-medium); }
/* ----- Filters: the outcome as a segmented radio group, then the tags ----- */
.ui-evs__filters { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-2-5) var(--tc-space-3); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-evs__show { display: flex; flex: none; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-evs__opt { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: calc(var(--tc-control-h-sm) - 2 * var(--tc-seg-pad)); padding: 0 var(--tc-space-2-5); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="evs"] .ui-evs__opt:hover { color: var(--tc-text-primary); }
[data-ui="evs"] .ui-evs__opt[aria-checked="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
.ui-evs__count { color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); font-variant-numeric: tabular-nums; }
.ui-evs__tags { display: flex; flex: 1 1 auto; flex-wrap: wrap; gap: var(--tc-space-1-5); min-width: 0; }
.ui-evs__tag, .ui-evs__clear { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-evs__tag { background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); color: var(--tc-text-secondary); }
[data-ui="evs"] .ui-evs__tag:hover { background: var(--tc-fill-hover); }
[data-ui="evs"] .ui-evs__tag[aria-pressed="true"] { background: var(--tc-accent-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-selected); color: var(--tc-accent-text); }
.ui-evs__tag[aria-pressed="true"] .ui-evs__count { color: inherit; }
.ui-evs__clear { color: var(--tc-accent-text); }
[data-ui="evs"] .ui-evs__clear:hover { background: var(--tc-fill-hover); }
/* ----- The grid, and the open case beside it (below it when narrow) ----- */
.ui-evs__main { display: grid; grid-template-columns: minmax(0, 1fr); }
.ui-evs__grid { position: relative; overflow: auto; overscroll-behavior: contain; overflow-anchor: none; outline: none; }
.ui-evs__grid:focus-visible:not(:has([data-active])) { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-evs__head { position: sticky; top: 0; z-index: 1; background: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *).ui-evs__head { background: var(--tc-surface-raised); }
.ui-evs__row { display: grid; grid-template-columns: minmax(0, 1fr) repeat(var(--tc-eval-scorecard-versions), var(--tc-eval-scorecard-col)); align-items: center; height: var(--tc-eval-scorecard-row); padding: 0 var(--tc-space-2) 0 0; border-bottom: var(--tc-hairline) solid var(--tc-border-subtle); }
.ui-evs__head .ui-evs__row { border-bottom-color: var(--tc-divider); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *) .ui-evs__head .ui-evs__row { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-evs__rows .ui-evs__row:hover { background: var(--tc-fill-subtle); }
.ui-evs__row[data-open] { background: var(--tc-fill-subtle); }
.ui-evs__case { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; height: 100%; padding: 0 var(--tc-space-2) 0 var(--tc-space-3-5); overflow: hidden; white-space: nowrap; cursor: pointer; }
.ui-evs__head .ui-evs__case { cursor: default; }
.ui-evs__name { flex: none; max-width: 100%; overflow: hidden; color: var(--tc-text-primary); text-overflow: ellipsis; }
.ui-evs__case-tags { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); text-overflow: ellipsis; }
.ui-evs__cell { display: grid; place-items: center; height: 100%; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; cursor: pointer; }
.ui-evs__head .ui-evs__cell { display: block; padding: 0 var(--tc-space-0-5); line-height: var(--tc-eval-scorecard-row); text-align: center; cursor: default; }
/* The active cell: a ring while the grid has focus */
.ui-evs__grid:focus-visible [data-active] { border-radius: var(--tc-radius-sm); outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
/* Outcomes: a tinted round mark with its glyph – never colour alone */
.ui-evs__out { display: inline-grid; flex: none; place-items: center; width: 20px; height: 20px; border-radius: 50%; }
.ui-evs__out[data-outcome="pass"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-evs__out[data-outcome="fail"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-evs__out[data-outcome="error"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-evs__out[data-outcome="pending"] { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-evs__out[data-outcome="none"] { color: var(--tc-text-muted); }
/* A failure where the version before passed: a solid ring */
.ui-evs__cell[data-regressed] .ui-evs__out { box-shadow: inset 0 0 0 1.25px var(--tc-status-danger-solid); }
.ui-evs__cell[data-open] .ui-evs__out { box-shadow: 0 0 0 1.5px var(--tc-surface-raised), 0 0 0 3px var(--tc-accent); }
.ui-evs__spacer { display: block; }
.ui-evs__empty { padding: var(--tc-space-5) var(--tc-space-4); color: var(--tc-text-muted); text-align: center; }
/* ----- The open case ----- */
.ui-evs__detail { display: grid; align-content: start; gap: var(--tc-space-3); min-width: 0; padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-evs__detail-head { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-evs__case-title { flex: 1; min-width: 0; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-snug); color: var(--tc-text-strong); overflow-wrap: anywhere; }
:where([data-look="clean"], [data-look="clean"] *).ui-evs__case-title { font-weight: var(--tc-font-weight-medium); }
.ui-evs__close { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); margin: calc(-1 * var(--tc-space-1)) calc(-1 * var(--tc-space-1-5)) calc(-1 * var(--tc-space-1)) 0; border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); }
[data-ui="evs"] .ui-evs__close:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-evs__runs { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-evs__run { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2) 0 var(--tc-space-1); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-evs__run .ui-evs__out { width: 18px; height: 18px; }
[data-ui="evs"] .ui-evs__run:hover { background: var(--tc-fill-hover); }
[data-ui="evs"] .ui-evs__run[aria-pressed="true"] { background: var(--tc-fill-selected); color: var(--tc-text-primary); }
.ui-evs__verdict { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5) var(--tc-space-2); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-evs__pill { height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); white-space: nowrap; }
.ui-evs__pill[data-outcome="pass"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-evs__pill[data-outcome="fail"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-evs__pill[data-outcome="error"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-evs__pill[data-outcome="pending"] { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-evs__score { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-evs__reason { flex: 1 1 100%; color: var(--tc-text-secondary); }
.ui-evs__label { display: block; margin-bottom: var(--tc-space-1); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-evs__label { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-evs__input { padding: var(--tc-space-2) var(--tc-space-2-5); border-radius: var(--tc-radius-md); background: var(--tc-surface-well); }
.ui-evs__text { color: var(--tc-text-primary); line-height: var(--tc-line-height-relaxed); white-space: pre-line; overflow-wrap: anywhere; }
.ui-evs__input .ui-evs__text { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); line-height: var(--tc-line-height-normal); }
.ui-evs__text[data-empty] { color: var(--tc-text-muted); }
.ui-evs__pair { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--tc-space-4); }
.ui-evs__side + .ui-evs__side { padding-left: var(--tc-space-4); border-left: var(--tc-hairline) solid var(--tc-divider); }
/* Words the output lacks, on the expected side; words only the output has, on its side – a tint and a line, never colour alone */
.ui-evs__miss, .ui-evs__extra { padding: 0 var(--tc-space-0-5); border-radius: var(--tc-radius-xs); -webkit-box-decoration-break: clone; box-decoration-break: clone; }
.ui-evs__miss { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); text-decoration: underline dotted; text-decoration-thickness: 1.5px; text-underline-offset: 3px; }
.ui-evs__extra { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
:where([data-look="clean"], [data-look="clean"] *) :is(.ui-evs__miss, .ui-evs__extra) { color: var(--tc-text-primary); }
.ui-evs__key { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-4); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
/* Wide: the open case beside the grid */
@container ui-evs (min-width: 860px) {
  .ui-evs__main[data-open] { grid-template-columns: minmax(0, 1fr) var(--tc-eval-scorecard-side); }
  .ui-evs__main[data-open] .ui-evs__detail { border-top: 0; border-left: var(--tc-hairline) solid var(--tc-divider); }
  .ui-evs__main[data-open] .ui-evs__pair { grid-template-columns: minmax(0, 1fr); }
  .ui-evs__main[data-open] .ui-evs__side + .ui-evs__side { padding-top: var(--tc-space-3); padding-left: 0; border-top: var(--tc-hairline) solid var(--tc-divider); border-left: 0; }
}
/* Narrow: tighter columns; the case's tags and the version detail give way */
@container ui-evs (max-width: 520px) {
  .ui-evs__card { --tc-eval-scorecard-col: 36px; }
  .ui-evs__ver-count { display: none; }
  .ui-evs__case-tags, .ui-evs__ver-detail { display: none; }
  .ui-evs__pair { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-3); }
  .ui-evs__side + .ui-evs__side { padding-top: var(--tc-space-3); padding-left: 0; border-top: var(--tc-hairline) solid var(--tc-divider); border-left: 0; }
  .ui-evs__show { flex: 1 1 100%; }
  .ui-evs__opt { flex: 1; justify-content: center; }
  .ui-evs__rate { font-size: var(--tc-font-size-lg); }
}
@media (pointer: coarse) {
  .ui-evs__tag, .ui-evs__run { height: 32px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="evs"] *, [data-ui="evs"] *::before, [data-ui="evs"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-eval-scorecard")) customElements.define("tc-eval-scorecard", TcEvalScorecard);

declare global {
  interface HTMLElementTagNameMap {
    "tc-eval-scorecard": TcEvalScorecard;
  }
}
