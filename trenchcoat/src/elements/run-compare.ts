import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { compact as count, dollars, duration as took } from "./internal/format";
import { diffWords, type DiffSegment } from "./inline-diff";

/*
 * <tc-run-compare> – two runs of an agent, or two versions of a prompt, side by side: their outputs, their steps,
 * their cost and time, with every difference highlighted. The baseline is on the left, the candidate on the right.
 *   · the header counts the differences; tabs switch between Output, Steps and Prompt (each with its count)
 *   · outputs and prompts are diffed word by word (Inline Diff's diffWords): words only the baseline has are struck
 *     through on red, words only the candidate has are underlined on green; point at one and its counterpart lights up
 *   · steps are matched by name: a step only one run took is marked Added or Dropped, a step whose detail or outcome
 *     changed is marked Changed and its detail diffed
 *   · time, cost, tokens, steps and score sit under each run; the candidate's carry the change against the baseline,
 *     green when better, red when worse
 *   · a candidate still running streams in – the diff follows as it grows
 * Standard is a gray tray with the comparison on a white card; Clean is one white card with hairline dividers.
 * Narrow, the two sides stack: baseline above candidate.
 *
 *   <tc-run-compare heading="Refund reply" .baseline=${v3} .candidate=${v4}></tc-run-compare>
 *
 * `view` changes on its own; preventDefault() on tc-view-change keeps control. With `can-pick` each run gets
 * "Use this", which fires tc-pick.
 */

export type RunCompareStepStatus = "ok" | "error" | "skipped";

export type RunCompareStep = {
  /** What the step did – e.g. a tool's name. Steps are matched across the runs by it */
  name: string;
  /** Its arguments or result, in a line – diffed when both runs have the step */
  detail?: string;
  status?: RunCompareStepStatus;
  /** How long it took, in ms */
  duration?: number;
};

export type RunCompareRun = {
  id: string;
  /** e.g. "Prompt v4" or "Run #4182" */
  label: string;
  /** The model, or anything else that sets the run apart – shown after the label */
  model?: string;
  status?: "running" | "done" | "failed";
  /** The answer – diffed word by word */
  output?: string;
  /** The prompt it ran with – shows the Prompt tab when either run has one */
  prompt?: string;
  steps?: RunCompareStep[];
  /** How long the run took, in ms */
  duration?: number;
  cost?: number;
  tokens?: number;
  /** An eval score – higher is better */
  score?: number;
};

export type RunCompareView = "output" | "steps" | "prompt";
export type RunCompareViewChange = { view: RunCompareView };
/** The detail of tc-pick: the run to keep, and its side */
export type RunComparePick = { run: RunCompareRun; side: "baseline" | "candidate" };

/** One line of the steps view: a step both runs took (the same or changed), or one only one of them took */
export type RunCompareStepRow =
  | { kind: "same" | "changed"; a: RunCompareStep; b: RunCompareStep; ai: number; bi: number }
  | { kind: "dropped"; a: RunCompareStep; ai: number }
  | { kind: "added"; b: RunCompareStep; bi: number };

const sameStep = (a: RunCompareStep, b: RunCompareStep) => (a.detail ?? "") === (b.detail ?? "") && (a.status ?? "ok") === (b.status ?? "ok");

/** Lines up two runs' steps: matched by name in order (longest common subsequence), the rest added or dropped */
export function alignRunSteps(a: RunCompareStep[], b: RunCompareStep[]): RunCompareStepRow[] {
  const n = a.length;
  const m = b.length;
  // lcs[i][j]: the longest match of a[i…] and b[j…]
  const lcs = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) lcs[i][j] = a[i].name === b[j].name ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  const rows: RunCompareStepRow[] = [];
  let i = 0;
  let j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i].name === b[j].name) {
      rows.push({ kind: sameStep(a[i], b[j]) ? "same" : "changed", a: a[i], b: b[j], ai: i, bi: j });
      i++;
      j++;
    } else if (j < m && (i >= n || lcs[i][j + 1] >= lcs[i + 1][j])) rows.push({ kind: "added", b: b[j], bi: j++ });
    else rows.push({ kind: "dropped", a: a[i], ai: i++ });
  }
  return rows;
}

const changes = (segs: DiffSegment[]) => segs.reduce((k, s) => k + (s.type === "change" ? 1 : 0), 0);
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const VIEWS: Record<RunCompareView, string> = { output: "Output", steps: "Steps", prompt: "Prompt" };
const STATUS: Record<NonNullable<RunCompareRun["status"]>, string> = { running: "Running", done: "Done", failed: "Failed" };

type Metric = { key: string; label: string; a?: number; b?: number; show: (n: number) => string; lowerIsBetter: boolean; relative: boolean };
type Delta = { text: string; tone: "better" | "worse" | "same"; words: string };

/** The candidate against the baseline: a share for time, cost and tokens, a count for steps and score */
function deltaOf(m: Metric): Delta | null {
  const { a, b } = m;
  if (a === undefined || b === undefined) return null;
  if (a === b) return { text: "same", tone: "same", words: `the same ${m.label.toLowerCase()}` };
  const better = m.lowerIsBetter ? b < a : b > a;
  const sign = b > a ? "+" : "−";
  const text = m.relative && a !== 0 ? `${sign}${Math.round((Math.abs(b - a) / a) * 100)}%` : `${sign}${m.show(Math.abs(b - a))}`;
  return { text, tone: better ? "better" : "worse", words: `${text} ${m.label.toLowerCase()}, ${better ? "better" : "worse"}` };
}

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
/* Two columns with arrows between them */
/* The header's icon: two runs side by side */
const compareMark = svg`<rect x="3" y="4" width="7" height="16" rx="1.5"></rect><rect x="14" y="4" width="7" height="16" rx="1.5"></rect>`;
const errorIcon = html`<svg class="ui-rc__glyph" viewBox="0 0 24 24" aria-hidden="true">${svg`<circle cx="12" cy="12" r="9"></circle><path d="M12 8v4.5M12 16h.01"></path>`}</svg>`;

let instances = 0;

/**
 * Two runs or two prompt versions side by side – outputs, steps, cost and time – with every difference highlighted.
 * @tag tc-run-compare
 * @fires tc-view-change - Another tab was picked ({ view }: RunCompareViewChange); cancelable
 * @fires tc-pick - "Use this" was pressed on a run ({ run, side }: RunComparePick)
 */
export class TcRunCompare extends TcElement {
  static override ui = "rc";

  /** The run to compare against – on the left */
  @property({ attribute: false }) accessor baseline: RunCompareRun | undefined = undefined;
  /** The run being judged – on the right; its numbers carry the change against the baseline */
  @property({ attribute: false }) accessor candidate: RunCompareRun | undefined = undefined;
  /** The open tab */
  @property() accessor view: RunCompareView = "output";
  /** The heading – e.g. the task both runs did */
  @property() accessor heading = "Compare runs";
  /** Shows "Use this" on each finished run (fires tc-pick) */
  @property({ type: Boolean, attribute: "can-pick" }) accessor canPick = false;
  /** Formats every cost – defaults to dollars, e.g. "$0.03" */
  @property({ attribute: false }) accessor formatCost: (amount: number) => string = dollars;
  /** Formats every duration in ms – defaults to e.g. "4.2s" */
  @property({ attribute: false }) accessor formatDuration: (ms: number) => string = took;

  /** @internal The change pointed at, by its index – both sides light up */
  @state() accessor hot: number | null = null;

  private readonly uid = `tc-rc${++instances}`;
  private output: DiffSegment[] = [];
  private prompt: DiffSegment[] = [];
  private rows: RunCompareStepRow[] = [];
  private details = new Map<RunCompareStepRow, DiffSegment[]>();

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("baseline") || changed.has("candidate")) {
      const a = this.baseline;
      const b = this.candidate;
      // While the candidate streams, the diff gets a smaller budget; the full one runs once it is done
      const cap = b?.status === "running" ? 250_000 : undefined;
      this.output = a?.output !== undefined || b?.output !== undefined ? diffWords(a?.output ?? "", b?.output ?? "", cap) : [];
      this.prompt = a?.prompt !== undefined || b?.prompt !== undefined ? diffWords(a?.prompt ?? "", b?.prompt ?? "", cap) : [];
      this.rows = alignRunSteps(a?.steps ?? [], b?.steps ?? []);
      this.details = new Map(this.rows.filter((r) => r.kind === "changed").map((r) => [r, diffWords((r as { a: RunCompareStep }).a.detail ?? "", (r as { b: RunCompareStep }).b.detail ?? "")]));
      this.hot = null;
    }
  }

  /** @internal The tabs on show: Prompt only when a run has one */
  private get views(): RunCompareView[] {
    const hasPrompt = this.baseline?.prompt !== undefined || this.candidate?.prompt !== undefined;
    return hasPrompt ? ["output", "steps", "prompt"] : ["output", "steps"];
  }

  /** @internal */
  private get shownView(): RunCompareView {
    return this.views.includes(this.view) ? this.view : "output";
  }

  /** @internal Differences per tab */
  private get counts(): Record<RunCompareView, number> {
    return { output: changes(this.output), steps: this.rows.filter((r) => r.kind !== "same").length, prompt: changes(this.prompt) };
  }

  /** @internal */
  private pickView(view: RunCompareView, focus = false) {
    if (view !== this.shownView && this.emit<RunCompareViewChange>("tc-view-change", { view }, { cancelable: true })) this.view = view;
    if (focus) void this.updateComplete.then(() => this.querySelector<HTMLElement>(`#${this.uid}-tab-${this.shownView}`)?.focus());
  }

  /** @internal APG tabs: arrows, Home and End move and select (automatic activation) */
  private onTabKey = (e: KeyboardEvent) => {
    const views = this.views;
    const at = views.indexOf(this.shownView);
    const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    let next: number;
    if (e.key in moves) next = (at + moves[e.key] + views.length) % views.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = views.length - 1;
    else return;
    e.preventDefault();
    this.pickView(views[next], true);
  };

  /** @internal */
  private metrics(): Metric[] {
    const a = this.baseline;
    const b = this.candidate;
    const stepsA = a?.steps?.length;
    const stepsB = b?.steps?.length;
    const all: Metric[] = [
      { key: "time", label: "Time", a: a?.duration, b: b?.duration, show: (n) => this.formatDuration(n), lowerIsBetter: true, relative: true },
      { key: "cost", label: "Cost", a: a?.cost, b: b?.cost, show: (n) => this.formatCost(n), lowerIsBetter: true, relative: true },
      { key: "tokens", label: "Tokens", a: a?.tokens, b: b?.tokens, show: count, lowerIsBetter: true, relative: true },
      { key: "steps", label: "Steps", a: stepsA || undefined, b: stepsB || undefined, show: String, lowerIsBetter: true, relative: false },
      { key: "score", label: "Score", a: a?.score, b: b?.score, show: String, lowerIsBetter: false, relative: false },
    ];
    return all.filter((m) => m.a !== undefined || m.b !== undefined);
  }

  /** @internal The persistent summary, once both are through */
  private summary() {
    const a = this.baseline;
    const b = this.candidate;
    if (!a || !b || a.status === "running" || b.status === "running") return "";
    const c = this.counts;
    const parts = [`${plural(c.output, "difference")} in the output`, `${plural(c.steps, "step")} differ`];
    if (this.views.includes("prompt")) parts.push(`${plural(c.prompt, "change")} to the prompt`);
    const deltas = this.metrics()
      .filter((m) => m.key === "time" || m.key === "cost")
      .map(deltaOf)
      .filter((d): d is Delta => !!d && d.tone !== "same")
      .map((d) => d.words);
    return `${b.label} against ${a.label}: ${parts.join(", ")}.${deltas.length ? ` ${deltas.join("; ")}.` : ""}`;
  }

  /** @internal */
  private head(run: RunCompareRun | undefined, side: "baseline" | "candidate") {
    const letter = side === "baseline" ? "A" : "B";
    if (!run) return html`<div class="ui-rc__head" data-side=${side}><span class="ui-rc__tile" aria-hidden="true">${letter}</span><span class="ui-rc__none">No run yet</span></div>`;
    const pickable = this.canPick && run.status !== "running";
    return html`<div class="ui-rc__head" data-side=${side}>
      <span class="ui-rc__tile" aria-hidden="true">${letter}</span>
      <span class="ui-rc__who">
        <span class="ui-rc__label">${run.label}</span>
        ${run.model ? html`<span class="ui-rc__model">${run.model}</span>` : nothing}
      </span>
      ${run.status && run.status !== "done" ? html`<span class="ui-rc__status" data-status=${run.status}>${STATUS[run.status]}</span>` : nothing}
      ${pickable
        ? html`<button type="button" class="ui-rc__pick" aria-label=${`Use this: ${run.label}`} @click=${() => this.emit<RunComparePick>("tc-pick", { run, side })}>Use this</button>`
        : nothing}
    </div>`;
  }

  /** @internal */
  private numbers(side: "baseline" | "candidate", metrics: Metric[]) {
    const run = side === "baseline" ? this.baseline : this.candidate;
    return html`<dl class="ui-rc__nums" data-side=${side} aria-label=${ifDefined(run ? `${run.label} in numbers` : undefined)}>
      ${metrics.map((m) => {
        const v = side === "baseline" ? m.a : m.b;
        const d = side === "candidate" ? deltaOf(m) : null;
        return html`<div class="ui-rc__num">
          <dt>${m.label}</dt>
          <dd>
            <span class="ui-rc__val">${v === undefined ? "–" : m.show(v)}</span>
            ${d && d.tone !== "same" ? html`<span class="ui-rc__delta" data-tone=${d.tone} title=${d.words}><span class="ui-rc__sr">(</span>${d.text}<span class="ui-rc__sr">, ${d.tone})</span></span>` : nothing}
          </dd>
        </div>`;
      })}
    </dl>`;
  }

  /** @internal One side of a word diff: what both share, plus what only this side has */
  private side(segs: DiffSegment[], side: "baseline" | "candidate", streaming: boolean, empty: string): TemplateResult {
    if (!segs.length && !streaming) return html`<p class="ui-rc__text" data-empty>${empty}</p>`;
    let ci = -1;
    const hot = this.hot;
    return html`<p class="ui-rc__text">${segs.map((s) => {
      if (s.type === "equal") return s.text;
      ci++;
      const i = ci;
      const text = side === "baseline" ? s.remove : s.insert;
      if (!text) return html`<span class="ui-rc__hole" data-chg=${i} ?data-hot=${hot === i}></span>`;
      const enter = () => (this.hot = i);
      const leave = () => this.hot === i && (this.hot = null);
      return side === "baseline"
        ? html`<del class="ui-rc__del" data-chg=${i} ?data-hot=${hot === i} @mouseenter=${enter} @mouseleave=${leave}>${text}</del>`
        : html`<ins class="ui-rc__ins" data-chg=${i} ?data-hot=${hot === i} @mouseenter=${enter} @mouseleave=${leave}>${text}</ins>`;
    })}${streaming ? html`<span class="ui-rc__caret" aria-hidden="true"></span>` : nothing}</p>`;
  }

  /** @internal A word diff as two columns */
  private textPanel(segs: DiffSegment[], what: "output" | "prompt") {
    const streaming = what === "output" && this.candidate?.status === "running";
    const a = this.baseline;
    const b = this.candidate;
    return html`<div class="ui-rc__pair ui-rc__body">
      <div class="ui-rc__cell" data-side="baseline"><span class="ui-rc__side">A · ${a?.label ?? "Baseline"}</span>${this.side(segs, "baseline", false, what === "output" ? "No output" : "No prompt")}</div>
      <div class="ui-rc__cell" data-side="candidate"><span class="ui-rc__side">B · ${b?.label ?? "Candidate"}</span>${this.side(segs, "candidate", streaming, what === "output" ? "No output" : "No prompt")}</div>
    </div>`;
  }

  /** @internal One run's step in a row */
  private stepCell(step: RunCompareStep | undefined, index: number | undefined, side: "baseline" | "candidate", row: RunCompareStepRow) {
    if (!step) return html`<div class="ui-rc__cell ui-rc__step" data-side=${side} data-gap><span class="ui-rc__gap">${side === "baseline" ? "Not in this run" : "Not taken"}</span></div>`;
    const detail = row.kind === "changed" ? this.details.get(row) : undefined;
    const tag = row.kind === "added" ? "Added" : row.kind === "dropped" ? "Dropped" : row.kind === "changed" && side === "candidate" ? "Changed" : "";
    const other = row.kind === "same" && side === "baseline" ? row.b.duration : undefined;
    return html`<div class="ui-rc__cell ui-rc__step" data-side=${side}>
      ${row.kind === "same" ? nothing : html`<span class="ui-rc__side-tile" aria-hidden="true">${side === "baseline" ? "A" : "B"}</span>`}
      <span class="ui-rc__n">${(index ?? 0) + 1}</span>
      <span class="ui-rc__step-main">
        <span class="ui-rc__step-name">${step.name}${step.status === "error" ? html`<span class="ui-rc__err">${errorIcon}<span>Failed</span></span>` : step.status === "skipped" ? html`<span class="ui-rc__skip">Skipped</span>` : nothing}</span>
        ${step.detail !== undefined || detail
          ? html`<span class="ui-rc__step-detail">${detail
              ? detail.map((s) => (s.type === "equal" ? s.text : side === "baseline" ? (s.remove ? html`<del class="ui-rc__del">${s.remove}</del>` : nothing) : s.insert ? html`<ins class="ui-rc__ins">${s.insert}</ins>` : nothing))
              : step.detail}</span>`
          : nothing}
      </span>
      <span class="ui-rc__step-end">
        ${tag ? html`<span class="ui-rc__tag" data-kind=${row.kind}>${tag}</span>` : nothing}
        ${step.duration !== undefined ? html`<span class="ui-rc__ms">${this.formatDuration(step.duration)}${other !== undefined ? html`<span class="ui-rc__ms-b"> → ${this.formatDuration(other)}</span>` : nothing}</span>` : nothing}
      </span>
    </div>`;
  }

  /** @internal */
  private stepsPanel() {
    if (!this.rows.length) return html`<div class="ui-rc__body ui-rc__blank">No steps</div>`;
    return html`<ol class="ui-rc__steps ui-rc__body">
      ${this.rows.map(
        (r) => html`<li class="ui-rc__pair ui-rc__row" data-kind=${r.kind}>
          ${this.stepCell(r.kind === "added" ? undefined : r.a, r.kind === "added" ? undefined : r.ai, "baseline", r)}
          ${this.stepCell(r.kind === "dropped" ? undefined : r.b, r.kind === "dropped" ? undefined : r.bi, "candidate", r)}
        </li>`,
      )}
    </ol>`;
  }

  protected override render() {
    const a = this.baseline;
    const b = this.candidate;
    const view = this.shownView;
    const counts = this.counts;
    const total = this.views.reduce((n, v) => n + counts[v], 0);
    const running = a?.status === "running" || b?.status === "running";
    const metrics = this.metrics();
    const titleId = `${this.uid}-title`;

    return html`
      ${/* The header (.tc-head): on the tray in Standard, the card's first row in Clean; how much differs under the title,
           the tabs at the right */ cardHead({
        icon: compareMark,
        title: this.heading,
        id: titleId,
        subtitle: html`<span class="ui-rc__count">${!a || !b ? "" : running ? "Comparing…" : total === 0 ? "Identical" : plural(total, "difference")}</span>`,
        aside: html`<div class="ui-rc__tabs" role="tablist" aria-labelledby=${titleId} @keydown=${this.onTabKey}>
          ${this.views.map(
            (v) => html`<button
              type="button"
              role="tab"
              class="ui-rc__tab"
              id=${`${this.uid}-tab-${v}`}
              aria-selected=${v === view ? "true" : "false"}
              aria-controls=${`${this.uid}-panel`}
              tabindex=${v === view ? 0 : -1}
              @click=${() => this.pickView(v)}
            >
              ${VIEWS[v]}${counts[v] ? html`<span class="ui-rc__badge"><span class="ui-rc__sr">, </span>${counts[v]}<span class="ui-rc__sr"> ${counts[v] === 1 ? "difference" : "differences"}</span></span>` : nothing}
            </button>`,
          )}
        </div>`,
      })}
      <div class="ui-rc__card">
        <div class="ui-rc__pair ui-rc__runs">
          ${(["baseline", "candidate"] as const).map(
            (side) => html`<div class="ui-rc__run" data-side=${side}>${this.head(side === "baseline" ? a : b, side)}${metrics.length ? this.numbers(side, metrics) : nothing}</div>`,
          )}
        </div>
        <div class="ui-rc__panel" role="tabpanel" id=${`${this.uid}-panel`} aria-labelledby=${`${this.uid}-tab-${view}`} @mouseleave=${() => (this.hot = null)}>
          ${view === "steps" ? this.stepsPanel() : this.textPanel(view === "prompt" ? this.prompt : this.output, view)}
        </div>
      </div>
      <span class="ui-rc__sr" role="status">${this.summary()}</span>
    `;
  }

  static override css = /* css */ `
/* Colors as variables – override them on [data-ui="rc"] */
[data-ui="rc"] {
  --tc-run-compare-strike: light-dark(rgba(180, 35, 24, 0.55), rgba(255, 138, 128, 0.6));
  /* A pointed-at change: its tint deepens on both sides */
  --tc-run-compare-del-hot: light-dark(rgba(220, 60, 60, 0.2), rgba(240, 90, 90, 0.28));
  --tc-run-compare-ins-hot: light-dark(rgba(34, 160, 90, 0.22), rgba(60, 200, 120, 0.28));
  /* The caret blinks a few times while the candidate streams, then holds still (WCAG 2.2.2) */
  --tc-run-compare-blink: 1100ms;
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
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  container: ui-rc / inline-size;
}
/* Clean: no tray – one white card with hairline dividers */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rc"] {
  --tc-run-compare-strike: light-dark(rgba(229, 72, 77, 0.6), rgba(255, 120, 120, 0.7));
  padding: 0;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  letter-spacing: normal;
}
[data-ui="rc"] *, [data-ui="rc"] *::before, [data-ui="rc"] *::after { box-sizing: border-box; }
[data-ui="rc"] svg { display: block; flex: none; }
:where([data-ui="rc"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; letter-spacing: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="rc"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-rc__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* ----- The header's line under the title: how much differs ----- */
.ui-rc__count { font-variant-numeric: tabular-nums; }
/* Tabs: the segmented pattern – a track with a raised thumb */
.ui-rc__tabs { display: flex; flex: none; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-rc__tab { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: calc(var(--tc-control-h-md) - 2 * var(--tc-seg-pad)); padding: 0 var(--tc-space-2-5); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-rc__tab { padding: 0 var(--tc-space-2); }
[data-ui="rc"] .ui-rc__tab:hover { color: var(--tc-text-primary); }
[data-ui="rc"] .ui-rc__tab[aria-selected="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
.ui-rc__badge { display: inline-grid; place-items: center; min-width: 18px; height: 18px; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-badge); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-rc__tab[aria-selected="true"] .ui-rc__badge { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
/* ----- The card ----- */
.ui-rc__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-rc__card { border-top: var(--tc-hairline) solid var(--tc-divider); border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); background: none; box-shadow: none; }
/* Two sides, a hairline between them; narrow, they stack */
.ui-rc__pair { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.ui-rc__pair > * { min-width: 0; padding: var(--tc-space-3) var(--tc-space-4); }
.ui-rc__pair > * + * { border-left: var(--tc-hairline) solid var(--tc-divider); }
.ui-rc__pair + .ui-rc__pair, .ui-rc__pair + .ui-rc__panel { border-top: var(--tc-hairline) solid var(--tc-divider); }
/* Each run: its letter on a tile, its label and model, its state, and "Use this" */
.ui-rc__run { display: grid; align-content: start; gap: var(--tc-space-3); }
.ui-rc__head { display: flex; align-items: center; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); }
.ui-rc__tile { display: grid; flex: none; place-items: center; width: 22px; height: 22px; border-radius: var(--tc-avatar-radius-agent); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-secondary); }
.ui-rc__head[data-side="candidate"] .ui-rc__tile { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-rc__who { display: flex; flex: 1; align-items: baseline; gap: var(--tc-space-1-5); min-width: 0; overflow: hidden; white-space: nowrap; }
.ui-rc__label { flex: none; font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-rc__label { font-weight: var(--tc-font-weight-medium); }
.ui-rc__model { min-width: 0; overflow: hidden; color: var(--tc-text-muted); text-overflow: ellipsis; }
.ui-rc__none { color: var(--tc-text-muted); }
.ui-rc__status { flex: none; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); }
.ui-rc__status[data-status="running"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-rc__status[data-status="failed"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-rc__pick { flex: none; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move); }
[data-ui="rc"] .ui-rc__pick:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
[data-ui="rc"] .ui-rc__pick:active { transform: scale(0.97); }
/* The numbers: label above value; the candidate's change in a small tinted chip */
.ui-rc__nums { display: flex; flex-wrap: wrap; gap: var(--tc-space-2) var(--tc-space-5); margin: 0; }
/* Each number in its own column: the label, the value, and under it the change */
.ui-rc__num { display: grid; align-content: start; gap: var(--tc-space-0-5); }
.ui-rc__num dt { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-rc__num dd { display: flex; flex-direction: column; align-items: flex-start; gap: var(--tc-space-1); margin: 0; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-rc__delta { padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); }
.ui-rc__delta[data-tone="better"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-rc__delta[data-tone="worse"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* ----- Output and prompt: the word diff, one side per column ----- */
.ui-rc__side { display: none; margin-bottom: var(--tc-space-1-5); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); }
.ui-rc__body > .ui-rc__cell { padding-top: var(--tc-space-3-5); padding-bottom: var(--tc-space-4); }
.ui-rc__text { margin: 0; color: var(--tc-text-primary); line-height: var(--tc-line-height-relaxed); white-space: pre-line; overflow-wrap: anywhere; }
.ui-rc__text[data-empty], .ui-rc__blank { color: var(--tc-text-muted); }
.ui-rc__blank { padding: var(--tc-space-4); }
/* Words only the baseline has: struck through on red; only the candidate: underlined on green – never colour alone */
.ui-rc__del, .ui-rc__ins { padding: 0 var(--tc-space-0-5); border-radius: var(--tc-radius-xs); -webkit-box-decoration-break: clone; box-decoration-break: clone; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rc__del { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); text-decoration: line-through; text-decoration-color: var(--tc-run-compare-strike); text-decoration-thickness: 1px; }
.ui-rc__ins { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); text-decoration: underline; text-decoration-color: var(--tc-status-success-solid); text-decoration-thickness: 1px; text-underline-offset: 3px; }
:where([data-look="clean"], [data-look="clean"] *).ui-rc__del { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-rc__ins { color: var(--tc-text-primary); }
.ui-rc__del[data-hot] { background: var(--tc-run-compare-del-hot); }
.ui-rc__ins[data-hot] { background: var(--tc-run-compare-ins-hot); }
/* Where the other side has words this one lacks: a thin mark, so the place shows */
.ui-rc__hole { display: inline-block; width: 1.5px; height: 0.9em; margin: 0 var(--tc-space-0-5); border-radius: var(--tc-radius-2xs); background: var(--tc-border-default); vertical-align: -0.15em; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rc__hole[data-hot] { width: 2px; background: var(--tc-text-muted); }
.ui-rc__caret { display: inline-block; width: 2px; height: 1.05em; margin-left: var(--tc-space-0-5); border-radius: var(--tc-radius-2xs); background: var(--tc-accent); vertical-align: -0.18em; animation: ui-rc-blink var(--tc-run-compare-blink) steps(1, end) 6; }
/* ----- Steps: one row per step, the two runs side by side ----- */
.ui-rc__steps { margin: 0; padding: 0; list-style: none; }
.ui-rc__row + .ui-rc__row { border-top: var(--tc-hairline) solid var(--tc-border-subtle); }
.ui-rc__step { display: flex; align-items: flex-start; gap: var(--tc-space-2-5); padding-top: var(--tc-space-2-5); padding-bottom: var(--tc-space-2-5); }
.ui-rc__n { flex: none; min-width: 16px; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); font-variant-numeric: tabular-nums; text-align: right; }
.ui-rc__step-main { display: grid; flex: 1; min-width: 0; }
.ui-rc__step-name { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-rc__step-detail { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); overflow-wrap: anywhere; }
.ui-rc__step-end { display: flex; flex: none; align-items: center; gap: var(--tc-space-2); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); }
.ui-rc__ms { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
/* Narrow only: which run a step belongs to, and both times on a step they share */
.ui-rc__side-tile, .ui-rc__ms-b { display: none; }
.ui-rc__side-tile { flex: none; place-items: center; width: 18px; height: 18px; border-radius: var(--tc-radius-xs); background: var(--tc-fill-default); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-secondary); }
.ui-rc__step[data-side="candidate"] .ui-rc__side-tile { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-rc__err { display: inline-flex; align-items: center; gap: var(--tc-space-1); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-xs); color: var(--tc-status-danger-fg); }
.ui-rc__skip { font-family: var(--tc-font-sans); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-rc__glyph { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
.ui-rc__tag { height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); white-space: nowrap; }
.ui-rc__tag[data-kind="added"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-rc__tag[data-kind="dropped"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-rc__tag[data-kind="changed"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
/* On its tinted row a tag sits on the surface with a ring, so its text keeps 4.5:1 */
.ui-rc__row[data-kind="added"] .ui-rc__tag, .ui-rc__row[data-kind="dropped"] .ui-rc__tag { background: var(--tc-surface-raised); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-success-border); }
.ui-rc__row[data-kind="dropped"] .ui-rc__tag { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-danger-border); }
/* A step only one run took: its side tinted, the other side an empty slot */
.ui-rc__row[data-kind="added"] > [data-side="candidate"] { background: color-mix(in srgb, var(--tc-status-success-bg) 55%, transparent); }
.ui-rc__row[data-kind="dropped"] > [data-side="baseline"] { background: color-mix(in srgb, var(--tc-status-danger-bg) 55%, transparent); }
.ui-rc__gap { display: block; flex: 1; padding: var(--tc-space-0-5) var(--tc-space-2); border: 1px dashed var(--tc-border-strong); border-radius: var(--tc-radius-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
@keyframes ui-rc-blink { 0%, 55% { opacity: 1; } 56%, 100% { opacity: 0; } }
/* Narrow: the two sides stack, each says which run it is */
@container ui-rc (max-width: 520px) {
  .ui-rc__pair { grid-template-columns: minmax(0, 1fr); }
  .ui-rc__pair > * + * { border-top: var(--tc-hairline) solid var(--tc-border-subtle); border-left: 0; }
  .ui-rc__side { display: block; }
  .ui-rc__tabs { flex: 1 1 100%; }
  .ui-rc__tab { flex: 1; justify-content: center; }
  .ui-rc__pair > * { padding-right: var(--tc-space-3-5); padding-left: var(--tc-space-3-5); }
  /* Steps: one line for a step both runs share; a changed one keeps its two sides together */
  .ui-rc__row > * + * { border-top: 0; padding-top: 0; }
  .ui-rc__row[data-kind="same"] > [data-side="candidate"], .ui-rc__row > [data-gap] { display: none; }
  .ui-rc__side-tile { display: inline-grid; }
  .ui-rc__ms-b { display: inline; }
  .ui-rc__row[data-kind="changed"] > [data-side="baseline"] { padding-bottom: var(--tc-space-1-5); }
  .ui-rc__row[data-kind="changed"] > [data-side="candidate"] { padding-top: 0; }
  .ui-rc__row > [data-gap] + * { padding-top: var(--tc-space-2-5); }
}
@media (pointer: coarse) {
  .ui-rc__pick { height: 36px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="rc"] *, [data-ui="rc"] *::before, [data-ui="rc"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-run-compare")) customElements.define("tc-run-compare", TcRunCompare);

declare global {
  interface HTMLElementTagNameMap {
    "tc-run-compare": TcRunCompare;
  }
}
