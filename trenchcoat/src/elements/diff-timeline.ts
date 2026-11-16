import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { OnScreenController } from "./internal/controllers";

/*
 * <tc-diff-timeline> – what a coding agent changed in a pull request, edit by edit over time. On top, lines added and
 * removed so far as two lines over each other; under it a row per file, in the order the agent reached them, each with
 * its edits as marks on the same time axis and a small bar of its own lines added and removed. Pointing at or focusing
 * an edit shows its diff below the rows; Enter or a click keeps it there.
 *   · replay: the scrubber (and Play) sets `time` – the chart, the rows and the totals show the pull request as it was
 *     then, and a file's row appears when the agent first reaches it. `time` is the page's to own (tc-time-change)
 *   · live: the axis runs to now (its own clock, once a second, or the page's `now`) and new edits land as they come
 *   · the marks are one grid with one tab stop: ← → move along a file, ↑ ↓ to the nearest edit in the next file,
 *     Home / End go to a file's first or last edit, Enter or Space picks, Escape closes
 *   · a long path keeps its file name and gives way in the middle, at its folders
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-diff-timeline .files=${[{ path: "src/parse.ts", edits: [{ id: "e1", at, added: 12, removed: 3 }] }]}></tc-diff-timeline>
 */

export type DiffTimelineEdit = {
  id: string;
  /** When the agent made it, epoch ms */
  at: number;
  /** Lines added */
  added: number;
  /** Lines removed */
  removed: number;
  /** What the edit did, in a few words */
  summary?: string;
  /** A few lines of its diff – each starting "+", "-" or " " */
  diff?: string;
};
export type DiffTimelineFile = {
  /** The file's path, which also identifies it */
  path: string;
  edits: DiffTimelineEdit[];
};
export type DiffTimelineSelectedChange = { selected: string | null; edit: DiffTimelineEdit | null; path: string | null };
export type DiffTimelineTimeChange = { time: number | null };

/** The element's words, every one renameable through `labels` */
export type DiffTimelineLabels = {
  added: string;
  removed: string;
  files: string;
  edits: string;
  chart: string;
  live: string;
  replay: string;
  play: string;
  pause: string;
  showAll: string;
  close: string;
  addedLine: string;
  removedLine: string;
  empty: string;
  notYet: string;
};
export const defaultDiffTimelineLabels: DiffTimelineLabels = {
  added: "added",
  removed: "removed",
  files: "files",
  edits: "Edits by file",
  chart: "Lines added and removed over the run",
  live: "Live",
  replay: "Replay position",
  play: "Play",
  pause: "Pause",
  showAll: "Show all",
  close: "Close",
  addedLine: "Added",
  removedLine: "Removed",
  empty: "No edits yet.",
  notYet: "No file reached yet at this point.",
};

/* git-pull-request-arrow: Lucide (ISC, lucide.dev) */
const ICON = svg`<circle cx="5" cy="6" r="3"></circle><path d="M5 9v12"></path><circle cx="19" cy="18" r="3"></circle><path d="m15 9-3-3 3-3"></path><path d="M12 6h5a2 2 0 0 1 2 2v7"></path>`;
const wall = () => Date.now();
/** The chart's drawing box; it stretches to the card's width */
const W = 1000;
const H = 120;
/** Steps a replay takes from start to end */
const PLAY_STEPS = 60;
let instances = 0;

/** m:ss from the start, or h:mm:ss past an hour */
export function diffTimelineOffset(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

/** Running totals of lines added and removed, one point per edit in time order, up to `until` */
export function diffTimelineSeries(files: DiffTimelineFile[], until = Infinity) {
  const edits = files.flatMap((f) => f.edits).filter((e) => e.at <= until).sort((a, b) => a.at - b.at);
  let added = 0;
  let removed = 0;
  return edits.map((e) => ({ at: e.at, added: (added += e.added), removed: (removed += e.removed) }));
}

/**
 * What a coding agent changed in a pull request, edit by edit over time, with a replay scrubber.
 * @tag tc-diff-timeline
 * @fires tc-selected-change - An edit was picked or closed ({ selected, edit, path }: DiffTimelineSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-time-change - The replay position moved ({ time }: DiffTimelineTimeChange); cancelable – prevented, `time` stays as it was
 */
export class TcDiffTimeline extends TcElement {
  static override ui = "dtl";

  /** The heading */
  @property() accessor heading = "Changes over time";
  /** A line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The files and their edits */
  @property({ attribute: false }) accessor files: DiffTimelineFile[] = [];
  /** When the run started, epoch ms; by default the first edit */
  @property({ type: Number }) accessor start: number | undefined = undefined;
  /** When it ended, epoch ms; by default the last edit, or now while live */
  @property({ type: Number }) accessor end: number | undefined = undefined;
  /** The run is still going: the axis runs to now and new edits land as they come */
  @property({ type: Boolean, reflect: true }) accessor live = false;
  /** "Now", epoch ms, while live; unset, the element keeps its own clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The replay position, epoch ms, or null for everything. Changed by the user unless a tc-time-change listener calls preventDefault() */
  @property({ type: Number }) accessor time: number | null = null;
  /** The picked edit's id, or null. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property() accessor selected: string | null = null;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<DiffTimelineLabels> = {};

  @state() private accessor clock = 0;
  @state() private accessor peek: string | null = null;
  @state() private accessor active: string | null = null;
  @state() private accessor playing = false;
  private readonly uid = `tc-dtl-${++instances}`;
  private readonly screen = new OnScreenController(this);
  private timer = 0;
  private player = 0;

  private get words(): DiffTimelineLabels {
    return { ...defaultDiffTimelineLabels, ...this.labels };
  }

  override connectedCallback() {
    super.connectedCallback();
    this.clock = wall();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.clearInterval(this.timer);
    window.clearInterval(this.player);
    this.timer = 0;
    this.player = 0;
    this.playing = false;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("files") && this.selected !== null && !this.find(this.selected)) this.selected = null;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const ticking = this.live && this.now === undefined && this.screen.onScreen;
    if (ticking && !this.timer) {
      this.clock = wall();
      this.timer = window.setInterval(() => (this.clock = wall()), 1000);
    } else if (!ticking && this.timer) {
      window.clearInterval(this.timer);
      this.timer = 0;
    }
  }

  /** Whether the live clock is ticking, for the page and for tests */
  get ticking() {
    return this.timer !== 0;
  }

  private find(id: string) {
    for (const f of this.files) {
      const edit = f.edits.find((e) => e.id === id);
      if (edit) return { edit, path: f.path };
    }
    return null;
  }

  /** The axis: start to end, never zero wide */
  get range(): [number, number] {
    const all = this.files.flatMap((f) => f.edits.map((e) => e.at));
    const first = all.length ? Math.min(...all) : 0;
    const last = all.length ? Math.max(...all) : 0;
    const start = this.start ?? first;
    const end = this.end ?? (this.live ? Math.max(last, this.now ?? this.clock) : last);
    return [start, Math.max(end, start + 1000)];
  }

  /** Where the view stands: the replay position, or the end */
  private get cut() {
    return this.time ?? Infinity;
  }

  private x(at: number) {
    const [a, b] = this.range;
    return Math.min(1, Math.max(0, (at - a) / (b - a)));
  }

  private setTime(time: number | null) {
    if (time === this.time) return true;
    if (!this.emit<DiffTimelineTimeChange>("tc-time-change", { time }, { cancelable: true })) return false;
    this.time = time;
    return true;
  }

  private onScrub(e: Event) {
    const v = Number((e.target as HTMLInputElement).value);
    const [, b] = this.range;
    this.stop();
    if (!this.setTime(v >= b ? null : v)) (e.target as HTMLInputElement).value = String(this.time ?? b);
  }

  private stop() {
    window.clearInterval(this.player);
    this.player = 0;
    this.playing = false;
  }

  private togglePlay() {
    if (this.playing) return this.stop();
    const [a, b] = this.range;
    const step = (b - a) / PLAY_STEPS;
    let at = this.time === null || this.time >= b ? a : this.time;
    if (!this.setTime(at)) return;
    this.playing = true;
    this.player = window.setInterval(() => {
      at += step;
      if (at >= b) {
        this.stop();
        this.setTime(null);
      } else if (!this.setTime(at)) this.stop();
    }, 100);
  }

  private pick(edit: DiffTimelineEdit, path: string) {
    const selected = this.selected === edit.id ? null : edit.id;
    this.active = edit.id;
    if (this.emit<DiffTimelineSelectedChange>("tc-selected-change", { selected, edit: selected ? edit : null, path: selected ? path : null }, { cancelable: true })) this.selected = selected;
  }

  private close() {
    const back = this.selected;
    if (back === null) return;
    if (!this.emit<DiffTimelineSelectedChange>("tc-selected-change", { selected: null, edit: null, path: null }, { cancelable: true })) return;
    this.selected = null;
    this.peek = null;
    this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-dtl__mark[data-edit="${CSS.escape(back)}"]`)?.focus());
  }

  private onKey(e: KeyboardEvent, rows: { file: DiffTimelineFile; edits: DiffTimelineEdit[] }[]) {
    if (e.key === "Escape" && this.selected !== null) {
      e.preventDefault();
      this.close();
      return;
    }
    const target = (e.target as HTMLElement).closest<HTMLElement>(".ui-dtl__mark");
    if (!target) return;
    const r = rows.findIndex((row) => row.file.path === target.dataset.path);
    const row = rows[r];
    if (!row) return;
    const i = row.edits.findIndex((x) => x.id === target.dataset.edit);
    let next: DiffTimelineEdit | undefined;
    if (e.key === "ArrowRight") next = row.edits[Math.min(row.edits.length - 1, i + 1)];
    else if (e.key === "ArrowLeft") next = row.edits[Math.max(0, i - 1)];
    else if (e.key === "Home") next = row.edits[0];
    else if (e.key === "End") next = row.edits[row.edits.length - 1];
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      const other = rows[e.key === "ArrowDown" ? Math.min(rows.length - 1, r + 1) : Math.max(0, r - 1)]!;
      const at = row.edits[i]!.at;
      next = other.edits.reduce((best, x) => (Math.abs(x.at - at) < Math.abs(best.at - at) ? x : best), other.edits[0]!);
    } else return;
    e.preventDefault();
    if (!next) return;
    const id = next.id;
    this.active = id;
    this.peek = id;
    this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-dtl__mark[data-edit="${CSS.escape(id)}"]`)?.focus());
  }

  private renderChart(series: ReturnType<typeof diffTimelineSeries>) {
    const w = this.words;
    const [a] = this.range;
    const peak = Math.max(1, ...series.map((p) => Math.max(p.added, p.removed)));
    const y = (v: number) => H - (v / peak) * (H - 4) - 2;
    const path = (key: "added" | "removed") => {
      let d = `M0 ${H - 2}`;
      let last = 0;
      for (const p of series) {
        const px = this.x(p.at) * W;
        d += ` H${px.toFixed(1)} V${y(p[key]).toFixed(1)}`;
        last = px;
      }
      const tail = this.time !== null ? this.x(this.time) * W : this.live ? this.x(this.range[1]) * W : last;
      return `${d} H${Math.max(tail, last).toFixed(1)}`;
    };
    const total = series[series.length - 1];
    const cursor = this.time !== null ? this.x(this.time) * W : null;
    return html`<figure class="ui-dtl__chart">
      <svg class="ui-dtl__plot" viewBox=${`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label=${`${w.chart}: ${total?.added ?? 0} ${w.added}, ${total?.removed ?? 0} ${w.removed}`}>
        <line class="ui-dtl__base" x1="0" x2=${W} y1=${H - 2} y2=${H - 2}></line>
        <path class="ui-dtl__series" data-series="removed" d=${path("removed")}></path>
        <path class="ui-dtl__series" data-series="added" d=${path("added")}></path>
        ${cursor !== null ? svg`<line class="ui-dtl__cursor" x1=${cursor} x2=${cursor} y1="0" y2=${H}></line>` : nothing}
      </svg>
      <figcaption class="ui-dtl__axis" aria-hidden="true"><span>${diffTimelineOffset(0)}</span><span>${diffTimelineOffset(this.range[1] - a)}</span></figcaption>
    </figure>`;
  }

  private renderPath(path: string) {
    const cut = path.lastIndexOf("/");
    return html`<span class="ui-dtl__path" title=${path}>${cut >= 0 ? html`<span class="ui-dtl__dir">${path.slice(0, cut + 1)}</span>` : nothing}<span class="ui-dtl__name">${path.slice(cut + 1)}</span></span>`;
  }

  private renderDetail() {
    const id = this.selected ?? this.peek;
    const found = id ? this.find(id) : null;
    if (!found || found.edit.at > this.cut) return nothing;
    const { edit, path } = found;
    const w = this.words;
    const [a] = this.range;
    const lines = (edit.diff ?? "").split("\n").filter((l) => l.length);
    return html`<div class="ui-dtl__detail" id=${`${this.uid}-detail`} role="group" aria-label=${path} ?data-pinned=${this.selected === edit.id}>
      <div class="ui-dtl__detail-head">
        <span class="ui-dtl__detail-title">${this.renderPath(path)} <span class="ui-dtl__at">${diffTimelineOffset(edit.at - a)}</span></span>
        <span class="ui-dtl__counts"><span data-kind="added">+${edit.added}</span> <span data-kind="removed">−${edit.removed}</span></span>
        ${this.selected === edit.id ? html`<button type="button" class="tc-btn-sm ui-dtl__close" @click=${this.close}>${w.close}</button>` : nothing}
      </div>
      ${edit.summary ? html`<p class="ui-dtl__summary">${edit.summary}</p>` : nothing}
      ${lines.length
        ? html`<pre class="ui-dtl__diff">${lines.map((l) => {
            const kind = l[0] === "+" ? "added" : l[0] === "-" ? "removed" : "same";
            return html`<span class="ui-dtl__line" data-kind=${kind}>${kind === "added" ? html`<span class="tc-sr-only">${w.addedLine}: </span>` : kind === "removed" ? html`<span class="tc-sr-only">${w.removedLine}: </span>` : nothing}<span aria-hidden="true">${l[0]}</span>${l.slice(1)}</span>`;
          })}</pre>`
        : nothing}
    </div>`;
  }

  protected override render() {
    const w = this.words;
    const cut = this.cut;
    const [a, b] = this.range;
    const series = diffTimelineSeries(this.files, cut);
    const total = series[series.length - 1] ?? { added: 0, removed: 0 };
    const rows = this.files
      .map((file) => ({ file, edits: file.edits.filter((e) => e.at <= cut).sort((x, y) => x.at - y.at) }))
      .filter((r) => r.edits.length)
      .sort((x, y) => x.edits[0]!.at - y.edits[0]!.at);
    const fileMax = Math.max(1, ...rows.map((r) => r.edits.reduce((n, e) => n + e.added + e.removed, 0)));
    const stop = this.active && rows.some((r) => r.edits.some((e) => e.id === this.active)) ? this.active : (rows[0]?.edits[0]?.id ?? null);
    const anyEdits = this.files.some((f) => f.edits.length);
    return html`${cardHead({
        icon: ICON,
        title: this.heading,
        subtitle: this.description,
        id: `${this.uid}-title`,
        aside: html`<span class="ui-dtl__totals">
          ${this.live ? html`<span class="ui-dtl__live">${w.live}</span>` : nothing}
          <span data-kind="added">+${total.added}<span class="tc-sr-only"> ${w.added}</span></span>
          <span data-kind="removed">−${total.removed}<span class="tc-sr-only"> ${w.removed}</span></span>
          <span class="ui-dtl__file-count">${rows.length} ${w.files}</span>
        </span>`,
      })}
      <div class="ui-dtl__card">
        ${anyEdits
          ? html`${this.renderChart(series)}
              <div class="ui-dtl__controls">
                <button type="button" class="tc-btn-sm ui-dtl__play" aria-pressed=${this.playing ? "true" : "false"} @click=${this.togglePlay}>${this.playing ? w.pause : w.play}</button>
                <input class="ui-dtl__scrub" type="range" min=${a} max=${b} step="1000" .value=${String(this.time ?? b)} aria-label=${w.replay} aria-valuetext=${diffTimelineOffset((this.time ?? b) - a)} @input=${this.onScrub} />
                <span class="ui-dtl__at" aria-hidden="true">${diffTimelineOffset((this.time ?? b) - a)}</span>
                ${this.time !== null ? html`<button type="button" class="tc-btn-sm ui-dtl__all" @click=${() => (this.stop(), this.setTime(null))}>${w.showAll}</button>` : nothing}
              </div>
              ${rows.length
                ? html`<div class="ui-dtl__rows" role="grid" aria-label=${w.edits} aria-describedby=${`${this.uid}-keys`} @keydown=${(e: KeyboardEvent) => this.onKey(e, rows)}>
                    ${rows.map((r) => {
                      const added = r.edits.reduce((n, e) => n + e.added, 0);
                      const removed = r.edits.reduce((n, e) => n + e.removed, 0);
                      return html`<div class="ui-dtl__row" role="row" data-path=${r.file.path}>
                        <span class="ui-dtl__file" role="rowheader">${this.renderPath(r.file.path)}</span>
                        <span class="ui-dtl__track" role="gridcell">
                          ${r.edits.map(
                            (e) => html`<button
                              type="button"
                              class="ui-dtl__mark"
                              data-edit=${e.id}
                              data-path=${r.file.path}
                              tabindex=${stop === e.id ? 0 : -1}
                              aria-pressed=${this.selected === e.id ? "true" : "false"}
                              style=${styleMap({ left: `${(this.x(e.at) * 100).toFixed(2)}%` })}
                              @click=${() => this.pick(e, r.file.path)}
                              @pointerenter=${() => (this.peek = e.id)}
                              @pointerleave=${() => (this.peek = null)}
                              @focus=${() => (this.peek = e.id)}
                            ><span class="tc-sr-only">${diffTimelineOffset(e.at - a)}, +${e.added} ${w.added}, −${e.removed} ${w.removed}${e.summary ? `, ${e.summary}` : ""}</span></button>`,
                          )}
                        </span>
                        <span class="ui-dtl__bar" role="gridcell">
                          <span class="ui-dtl__bar-track" aria-hidden="true"
                            ><span data-kind="added" style=${styleMap({ width: `${((added / fileMax) * 100).toFixed(1)}%` })}></span
                            ><span data-kind="removed" style=${styleMap({ width: `${((removed / fileMax) * 100).toFixed(1)}%` })}></span
                          ></span>
                          <span class="ui-dtl__counts"><span data-kind="added">+${added}</span> <span data-kind="removed">−${removed}</span></span>
                        </span>
                      </div>`;
                    })}
                  </div>
                  <span class="tc-sr-only" id=${`${this.uid}-keys`}>Arrow keys move between edits, Enter shows an edit's diff, Escape closes it.</span>`
                : html`<p class="ui-dtl__none">${w.notYet}</p>`}
              ${this.renderDetail()}`
          : html`<p class="ui-dtl__none">${w.empty}</p>`}
      </div>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="dtl"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="dtl"] {
  position: relative; display: block; box-sizing: border-box; width: 100%;
  border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow);
  container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased;
}
/* The chart's height, the path column's width and the bar column's width – override them on the element */
[data-ui="dtl"] {
  --tc-dtl-chart: calc(var(--tc-space-10) * 2); --tc-dtl-path: 14em; --tc-dtl-bar: 8em; --tc-dtl-mark: var(--tc-space-2-5);
  --tc-dtl-added: var(--tc-status-success-fg); --tc-dtl-removed: var(--tc-status-danger-fg);
}
[data-ui="dtl"] *, [data-ui="dtl"] *::before, [data-ui="dtl"] *::after { box-sizing: border-box; }
[data-ui="dtl"] :where(p, figure, pre) { margin: 0; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="dtl"] .ui-dtl__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-dtl__card { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-4); min-width: 0; }
.ui-dtl__totals { display: inline-flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-dtl__file-count { color: var(--tc-text-secondary); font-weight: var(--tc-font-weight-regular); }
.ui-dtl__live { color: var(--tc-status-info-fg); }
[data-ui="dtl"] [data-kind="added"] { color: var(--tc-dtl-added); }
[data-ui="dtl"] [data-kind="removed"] { color: var(--tc-dtl-removed); }
.ui-dtl__chart { display: grid; gap: var(--tc-space-1); }
.ui-dtl__plot { display: block; width: 100%; height: var(--tc-dtl-chart); overflow: visible; }
.ui-dtl__base { stroke: var(--tc-border-default); stroke-width: 1; vector-effect: non-scaling-stroke; }
.ui-dtl__series { fill: none; stroke-width: 2; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.ui-dtl__series[data-series="added"] { stroke: var(--tc-dtl-added); }
.ui-dtl__series[data-series="removed"] { stroke: var(--tc-dtl-removed); stroke-dasharray: 6 3; }
.ui-dtl__cursor { stroke: var(--tc-text-primary); stroke-width: 1; vector-effect: non-scaling-stroke; }
.ui-dtl__axis { display: flex; justify-content: space-between; color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-dtl__controls { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); }
.ui-dtl__scrub { flex: 1 1 8em; min-width: 0; min-height: var(--tc-control-h-sm); margin: 0; accent-color: var(--tc-text-primary); }
.ui-dtl__at { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-dtl__rows { display: grid; gap: var(--tc-space-0-5); }
.ui-dtl__row { display: grid; grid-template-columns: minmax(0, var(--tc-dtl-path)) minmax(0, 1fr) var(--tc-dtl-bar); align-items: center; gap: var(--tc-space-3); min-height: var(--tc-control-h-sm); }
.ui-dtl__file { min-width: 0; font-size: var(--tc-font-size-xs); }
.ui-dtl__path { display: flex; min-width: 0; font-family: var(--tc-font-mono); }
.ui-dtl__dir { flex: 0 1 auto; min-width: 0; overflow: hidden; color: var(--tc-text-secondary); text-overflow: ellipsis; white-space: nowrap; }
.ui-dtl__name { flex: none; white-space: nowrap; }
.ui-dtl__track { position: relative; height: var(--tc-control-h-sm); border-radius: var(--tc-radius-2xs); background: linear-gradient(var(--tc-border-subtle), var(--tc-border-subtle)) center / 100% 1px no-repeat; }
.ui-dtl__mark { position: absolute; top: 50%; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); padding: 0; border: 0; background: none; transform: translate(-50%, -50%); cursor: pointer; }
.ui-dtl__mark::before { content: ""; position: absolute; inset: 0; margin: auto; width: var(--tc-dtl-mark); height: var(--tc-dtl-mark); border-radius: var(--tc-radius-full); background: var(--tc-text-secondary); }
.ui-dtl__mark:hover::before, .ui-dtl__mark:focus-visible::before { background: var(--tc-text-primary); }
.ui-dtl__mark[aria-pressed="true"]::before { background: var(--tc-text-primary); box-shadow: 0 0 0 var(--tc-focus-ring-width) var(--tc-surface-raised), 0 0 0 calc(var(--tc-focus-ring-width) * 2) var(--tc-text-primary); }
.ui-dtl__mark:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-space-1) * -1); border-radius: var(--tc-radius-full); }
.ui-dtl__bar { display: grid; gap: var(--tc-space-0-5); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-dtl__bar-track { display: flex; height: var(--tc-space-1-5); overflow: hidden; border-radius: var(--tc-radius-2xs); background: var(--tc-fill-hover); }
.ui-dtl__bar-track span { display: block; height: 100%; }
.ui-dtl__bar-track [data-kind="added"] { background: var(--tc-dtl-added); }
.ui-dtl__bar-track [data-kind="removed"] { background: var(--tc-dtl-removed); }
.ui-dtl__counts { white-space: nowrap; font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-dtl__detail { display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-control-radius-md); background: var(--tc-fill-hover); min-width: 0; }
.ui-dtl__detail-head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); }
.ui-dtl__detail-title { display: flex; align-items: baseline; gap: var(--tc-space-2); flex: 1 1 12em; min-width: 0; font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-dtl__summary { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); overflow-wrap: anywhere; }
.ui-dtl__diff { display: grid; overflow-x: auto; padding: var(--tc-space-1) 0; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); }
.ui-dtl__line { padding: 0 var(--tc-space-2); white-space: pre; color: var(--tc-text-primary); }
.ui-dtl__line[data-kind="added"] { background: light-dark(color-mix(in srgb, var(--tc-dtl-added) 12%, transparent), color-mix(in srgb, var(--tc-dtl-added) 22%, transparent)); color: var(--tc-text-primary); }
.ui-dtl__line[data-kind="removed"] { background: light-dark(color-mix(in srgb, var(--tc-dtl-removed) 12%, transparent), color-mix(in srgb, var(--tc-dtl-removed) 22%, transparent)); color: var(--tc-text-primary); }
.ui-dtl__none { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
@container (max-width: 520px) {
  [data-ui="dtl"] { --tc-dtl-path: 9em; --tc-dtl-bar: 5em; }
  .ui-dtl__row { gap: var(--tc-space-2); }
}
@media (forced-colors: active) {
  .ui-dtl__series, .ui-dtl__cursor { stroke: CanvasText; }
  .ui-dtl__mark::before, .ui-dtl__bar-track span { background: CanvasText; }
  .ui-dtl__mark[aria-pressed="true"]::before { background: Highlight; }
}
`;
}

if (!customElements.get("tc-diff-timeline")) customElements.define("tc-diff-timeline", TcDiffTimeline);

declare global {
  interface HTMLElementTagNameMap {
    "tc-diff-timeline": TcDiffTimeline;
  }
}
