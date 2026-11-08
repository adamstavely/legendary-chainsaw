import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-subagent-list> – the sub-agents a session has started, in two groups: Active (running, or waiting for
 * something) and Done (finished, failed or stopped), each with its count. A row is the agent's mark, its name, what
 * it's doing now, and a time – a clock that ticks while it's active ("1m 26s") and how long ago it ended once it's
 * done ("just now", "1h ago"). Each agent gets its own mark, drawn from its id: a flower, star, rings or leaves in
 * one of six tones, so the same agent looks the same everywhere. Choosing a row selects it (to show its transcript,
 * say), and agents finishing, failing or starting to wait are announced.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row. `bare`
 * drops both, for a place that already has a card – Session Panel's Subagents section.
 *
 *   <tc-subagent-list .agents=${[{ id: "a11y", name: "Review a11y current", status: "waiting",
 *     activity: "awaiting command message", startedAt }]}></tc-subagent-list>
 *
 * Keyboard. The rows are one tab stop: ↑ and ↓ move, Home and End go to the ends, Enter or Space selects.
 * Clocks are painted in place once a second (no re-render) and stop while the tab is hidden.
 */

/** Where a sub-agent is: running and waiting are Active; done, failed and stopped are Done */
export type SubagentStatus = "running" | "waiting" | "done" | "failed" | "stopped";
/** One sub-agent */
export type Subagent = {
  id: string;
  /** What it was asked to do, short – "Review forms current" */
  name: string;
  status: SubagentStatus;
  /** What it's doing now, or why it stopped – "awaiting command message" */
  activity?: string;
  /** When it started, epoch ms – an active agent's clock runs from here */
  startedAt?: number;
  /** When it finished, failed or stopped, epoch ms – a done agent shows how long ago */
  endedAt?: number;
  /** What its mark is drawn from, when not its id – to give agents the same mark across sessions */
  mark?: string;
};
/** tc-selected-change: the chosen agent's id, and the agent */
export type SubagentSelectedChange = { selected: string | null; agent: Subagent | null };
/** The words it uses, to translate or reword */
export type SubagentListLabels = {
  active: string;
  done: string;
  empty: string;
  /** A done agent that ended under a minute ago */
  justNow: string;
  /** A done agent's time; {time} is "5m", "1h", "2d" */
  ago: string;
  running: string;
  waiting: string;
  finished: string;
  failed: string;
  stopped: string;
  /** The header's count; {count} is the number of active agents */
  activeCount: string;
};

export const defaultSubagentListLabels: SubagentListLabels = {
  active: "Active",
  done: "Done",
  empty: "No subagents yet",
  justNow: "just now",
  ago: "{time} ago",
  running: "Running",
  waiting: "Waiting",
  finished: "Finished",
  failed: "Failed",
  stopped: "Stopped",
  activeCount: "{count} active",
};

const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const live = (s: SubagentStatus) => s === "running" || s === "waiting";
/** Wall time – read in updates and timers only, never during render */
const wall = () => Date.now();

/** An active agent's clock: "12s", "1m 26s", "1h 4m" */
export function subagentClock(ms: number) {
  const s = Math.max(0, Math.floor(ms / SEC));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

/* ---------- Marks: a flower, star, rings or leaves in a tone, drawn from the agent's id ---------- */

/** The tones a mark can take, and the shapes */
export const subagentTones = ["amber", "pink", "teal", "violet", "rose", "accent"] as const;
export const subagentShapes = ["flower", "star", "rings", "leaves"] as const;
export type SubagentTone = (typeof subagentTones)[number];
export type SubagentShape = (typeof subagentShapes)[number];

/** FNV-1a, so a mark only depends on the text */
function hash(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** The tone, shape and number of parts of the mark drawn from `seed` */
export function subagentMark(seed: string): { tone: SubagentTone; shape: SubagentShape; parts: number } {
  const h = hash(seed);
  const shape = subagentShapes[(h >>> 3) % subagentShapes.length];
  const range: Record<SubagentShape, [number, number]> = { flower: [5, 8], star: [5, 8], rings: [3, 5], leaves: [5, 8] };
  const [lo, hi] = range[shape];
  return { tone: subagentTones[h % subagentTones.length], shape, parts: lo + ((h >>> 7) % (hi - lo + 1)) };
}

const r2 = (n: number) => Math.round(n * 100) / 100;

function markShape(shape: SubagentShape, n: number): TemplateResult {
  const turns = Array.from({ length: n }, (_, k) => (360 * k) / n);
  if (shape === "flower") return svg`${turns.map((a) => svg`<ellipse cx="12" cy="6.6" rx="2.9" ry="5.2" transform=${`rotate(${r2(a)} 12 12)`}></ellipse>`)}`;
  if (shape === "rings") return svg`${turns.map((a) => svg`<circle cx="12" cy="7.6" r="4.6" transform=${`rotate(${r2(a)} 12 12)`}></circle>`)}`;
  if (shape === "leaves") return svg`${turns.map((a) => svg`<path d="M12 12 Q15.2 7 12 1.6 Q8.8 7 12 12Z" transform=${`rotate(${r2(a)} 12 12)`}></path>`)}`;
  // A star: n points at radius 10.4, the notches between them at 4.6
  const pts = Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 ? 4.6 : 10.4;
    const a = (Math.PI * i) / n - Math.PI / 2;
    return `${r2(12 + r * Math.cos(a))},${r2(12 + r * Math.sin(a))}`;
  });
  return svg`<polygon points=${pts.join(" ")}></polygon>`;
}

const markOf = (a: Subagent) => {
  const m = subagentMark(a.mark ?? a.id);
  return html`<svg class="ui-sba__mark" viewBox="0 0 24 24" aria-hidden="true" data-tone=${m.tone} data-shape=${m.shape}>${markShape(m.shape, m.parts)}<circle class="ui-sba__core" cx="12" cy="12" r="1.5"></circle></svg>`;
};

/* Lucide "bot" (ISC – lucide.dev) */
const headIcon = svg`<path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path>`;

let instances = 0;

/**
 * The sub-agents a session started, grouped Active and Done, each with its mark, what it's doing and a live clock.
 * @tag tc-subagent-list
 * @fires tc-selected-change - A row was chosen ({ selected, agent }: SubagentSelectedChange); cancelable – prevented, `selected` stays as it was
 */
export class TcSubagentList extends TcElement {
  static override ui = "sba";

  /** The heading; empty leaves the header out */
  @property() accessor heading = "Subagents";
  /** The sub-agents, in the order to show them within each group – newest first reads best */
  @property({ attribute: false }) accessor agents: Subagent[] = [];
  /** The id of the chosen agent. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property() accessor selected: string | null = null;
  /** The time now, epoch ms; by default the element's own clock, which ticks */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Drop the tray and card, for a place that already has one */
  @property({ type: Boolean, reflect: true }) accessor bare = false;
  /** The words it uses, merged over the defaults */
  @property({ attribute: false }) accessor labels: Partial<SubagentListLabels> = {};

  /** @internal The row that holds the tab stop */
  @state() accessor focusId: string | null = null;
  /** @internal What the status region says */
  @state() accessor said = "";

  private readonly uid = `tc-sba${++instances}`;
  /** The time the rows were drawn at; read in willUpdate, never in render */
  private at = 0;
  private statuses = new Map<string, SubagentStatus>();
  private tick = 0;
  private tickEvery = 0;

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener("visibilitychange", this.syncTick);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("visibilitychange", this.syncTick);
    window.clearInterval(this.tick);
    this.tick = 0;
  }

  private word(key: keyof SubagentListLabels, vars: Record<string, string> = {}) {
    const text = this.labels[key] ?? defaultSubagentListLabels[key];
    return text.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
  }

  /** The time beside a row: an active agent's clock, or how long ago a done one ended */
  private timeText(a: Subagent, at: number) {
    if (live(a.status)) return a.startedAt !== undefined ? subagentClock(at - a.startedAt) : "";
    if (a.endedAt === undefined) return "";
    const ago = Math.max(0, at - a.endedAt);
    if (ago < MIN) return this.word("justNow");
    const time = ago < HOUR ? `${Math.floor(ago / MIN)}m` : ago < DAY ? `${Math.floor(ago / HOUR)}h` : `${Math.floor(ago / DAY)}d`;
    return this.word("ago", { time });
  }

  private get groups() {
    return { active: this.agents.filter((a) => live(a.status)), done: this.agents.filter((a) => !live(a.status)) };
  }

  /** The rows in the order Tab and the arrow keys meet them */
  private get rows() {
    const { active, done } = this.groups;
    return [...active, ...done];
  }

  /* ---------- Clocks: painted in place, no render ---------- */

  private paint = () => {
    const at = this.now ?? wall();
    const byId = new Map(this.agents.map((a) => [a.id, a]));
    for (const el of this.querySelectorAll<HTMLElement>(".ui-sba__time")) {
      const a = byId.get(el.dataset.id!);
      if (!a) continue;
      const text = this.timeText(a, at);
      if (el.textContent !== text) el.textContent = text;
    }
  };

  private syncTick = () => {
    // Every second while something runs; every half minute for the "ago" times; never with a fixed `now`
    const every = !this.isConnected || document.hidden || this.now !== undefined || !this.agents.length ? 0 : this.agents.some((a) => live(a.status)) ? SEC : 30 * SEC;
    if (every === this.tickEvery) return;
    window.clearInterval(this.tick);
    this.tick = every ? window.setInterval(this.paint, every) : 0;
    this.tickEvery = every;
    if (every) this.paint();
  };

  /* ---------- Choosing ---------- */

  private choose(a: Subagent) {
    this.focusId = a.id;
    if (this.selected === a.id) return;
    if (!this.emit<SubagentSelectedChange>("tc-selected-change", { selected: a.id, agent: a }, { cancelable: true })) return;
    this.selected = a.id;
  }

  private onKey = (e: KeyboardEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>(".ui-sba__row");
    if (!btn || e.altKey || e.metaKey || e.ctrlKey) return;
    const rows = this.rows;
    const i = rows.findIndex((a) => a.id === btn.dataset.id);
    const to = { ArrowUp: i - 1, ArrowDown: i + 1, Home: 0, End: rows.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const next = rows[Math.max(0, Math.min(rows.length - 1, to))];
    if (!next) return;
    this.focusId = next.id;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-sba__row[data-id="${CSS.escape(next.id)}"]`)?.focus());
  };

  /* ---------- Render ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.at = this.now ?? wall();
    if (changed.has("agents")) {
      // Announce agents that finished, failed, stopped or started waiting since the last update
      const news: string[] = [];
      for (const a of this.agents) {
        const was = this.statuses.get(a.id);
        if (was !== undefined && was !== a.status && a.status !== "running") news.push(`${a.name}: ${this.word(a.status === "done" ? "finished" : a.status)}`);
      }
      this.statuses = new Map(this.agents.map((a) => [a.id, a.status]));
      if (news.length) this.said = this.said === news.join(". ") ? `${news.join(". ")} ` : news.join(". ");
    }
    const ids = this.rows.map((a) => a.id);
    if (!this.focusId || !ids.includes(this.focusId)) this.focusId = this.selected && ids.includes(this.selected) ? this.selected : (ids[0] ?? null);
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    this.syncTick();
  }

  private renderRow(a: Subagent) {
    const tag = a.status === "waiting" || a.status === "failed" || a.status === "stopped" ? this.word(a.status) : "";
    const state = a.status === "running" ? this.word("running") : a.status === "done" ? this.word("finished") : "";
    return html`<li>
      <button
        type="button"
        class="ui-sba__row"
        data-id=${a.id}
        data-status=${a.status}
        tabindex=${this.focusId === a.id ? "0" : "-1"}
        aria-current=${this.selected === a.id ? "true" : "false"}
        @click=${() => this.choose(a)}
        @focus=${() => (this.focusId = a.id)}
      >
        ${markOf(a)}
        <span class="ui-sba__text">
          <span class="ui-sba__name">${a.name}</span>
          ${tag || a.activity
            ? html`<span class="ui-sba__activity">${tag ? html`<span class="ui-sba__tag" data-status=${a.status}>${tag}</span>` : nothing}${tag && a.activity ? html`<span aria-hidden="true"> · </span>` : nothing}${a.activity ?? ""}</span>`
            : nothing}
        </span>
        ${state ? html`<span class="tc-sr-only">, ${state}, </span>` : nothing}
        <span class="ui-sba__time" data-id=${a.id}>${this.timeText(a, this.at)}</span>
      </button>
    </li>`;
  }

  private renderGroup(key: "active" | "done", list: Subagent[]) {
    if (!list.length) return nothing;
    const id = `${this.uid}-${key}`;
    return html`<section class="ui-sba__group" data-group=${key}>
      <p class="ui-sba__label" id=${id}>${this.word(key)}<span aria-hidden="true"> · </span><span class="tc-sr-only">, </span>${list.length}</p>
      <ul class="ui-sba__list" aria-labelledby=${id}>${repeat(list, (a) => a.id, (a) => this.renderRow(a))}</ul>
    </section>`;
  }

  protected override render() {
    const { active, done } = this.groups;
    const aside = active.length ? html`<span class="ui-sba__count">${this.word("activeCount", { count: String(active.length) })}</span>` : nothing;
    return html`${this.heading ? cardHead({ icon: headIcon, title: this.heading, aside }) : nothing}
      <div class="ui-sba__card" @keydown=${this.onKey}>
        ${this.agents.length ? html`${this.renderGroup("active", active)}${this.renderGroup("done", done)}` : html`<p class="ui-sba__empty">${this.word("empty")}</p>`}
      </div>
      <span class="tc-sr-only" role="status">${this.said}</span>`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="sba"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="sba"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="sba"][bare] { padding: 0; overflow: visible; border-radius: 0; background: none; box-shadow: none; }
[data-ui="sba"] *, [data-ui="sba"] *::before, [data-ui="sba"] *::after { box-sizing: border-box; }
:where([data-ui="sba"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="sba"]) :is(p, ul) { margin: 0; padding: 0; }
[data-ui="sba"] ul { list-style: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-sba__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-sba__card { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-2) 0; }
[data-ui="sba"][bare] .ui-sba__card { padding: 0; border-radius: 0; background: none; box-shadow: none; }
.ui-sba__count { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; white-space: nowrap; }
/* ----- Groups ----- */
.ui-sba__group { display: grid; gap: var(--tc-space-0-5); }
.ui-sba__label { padding: var(--tc-space-1) var(--tc-space-3); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
/* ----- Rows ----- */
.ui-sba__row { display: grid; grid-template-columns: 24px minmax(0, 1fr) auto; align-items: center; gap: var(--tc-space-3); width: 100%; min-height: var(--tc-control-h-md); padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-control-radius-sm); text-align: left; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-sba__row:hover { background: var(--tc-fill-hover); }
.ui-sba__row[aria-current="true"] { background: var(--tc-fill-selected); }
/* On the selected tint, muted words step up a shade to keep their contrast */
.ui-sba__row[aria-current="true"] :is(.ui-sba__activity, .ui-sba__time) { color: var(--tc-text-secondary); }
.ui-sba__row:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-sba__text { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-sba__name { overflow: hidden; color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
.ui-sba__activity { overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
.ui-sba__tag { font-weight: var(--tc-font-weight-strong); }
.ui-sba__tag[data-status="waiting"] { color: var(--tc-status-warning-fg); }
.ui-sba__tag[data-status="failed"] { color: var(--tc-status-danger-fg); }
.ui-sba__tag[data-status="stopped"] { color: var(--tc-text-secondary); }
.ui-sba__time { align-self: start; padding-top: var(--tc-space-0-5); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-sba__empty { padding: var(--tc-space-4) var(--tc-space-3); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); text-align: center; }
/* ----- Marks ----- */
.ui-sba__mark { display: block; width: 24px; height: 24px; overflow: visible; }
.ui-sba__mark > :not(.ui-sba__core) { fill: var(--tc-sba-fill); fill-opacity: 0.72; stroke: var(--tc-sba-line); stroke-width: 0.8; stroke-linejoin: round; }
.ui-sba__core { fill: var(--tc-sba-line); }
.ui-sba__mark[data-tone="amber"] { --tc-sba-fill: var(--tc-tone-amber-solid); --tc-sba-line: var(--tc-tone-amber-fg); }
.ui-sba__mark[data-tone="pink"] { --tc-sba-fill: var(--tc-tone-pink-solid); --tc-sba-line: var(--tc-tone-pink-fg); }
.ui-sba__mark[data-tone="teal"] { --tc-sba-fill: var(--tc-tone-teal-solid); --tc-sba-line: var(--tc-tone-teal-fg); }
.ui-sba__mark[data-tone="violet"] { --tc-sba-fill: var(--tc-tone-violet-solid); --tc-sba-line: var(--tc-tone-violet-fg); }
.ui-sba__mark[data-tone="rose"] { --tc-sba-fill: var(--tc-tone-rose-solid); --tc-sba-line: var(--tc-tone-rose-fg); }
.ui-sba__mark[data-tone="accent"] { --tc-sba-fill: var(--tc-accent-solid); --tc-sba-line: var(--tc-accent-text); }
/* Done agents' marks quieten; an active one turns slowly */
.ui-sba__row:not([data-status="running"]):not([data-status="waiting"]) .ui-sba__mark > :not(.ui-sba__core) { fill-opacity: 0.45; }
.ui-sba__row[data-status="running"] .ui-sba__mark { animation: ui-sba-turn calc(var(--tc-duration-shimmer) * 7.5) linear infinite; }
@keyframes ui-sba-turn { to { transform: rotate(360deg); } }
@media (forced-colors: active) {
  .ui-sba__mark > * { forced-color-adjust: none; fill: CanvasText; stroke: Canvas; }
  .ui-sba__row[aria-current="true"] { outline: 2px solid Highlight; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-sba__row { transition: none; }
  .ui-sba__row[data-status="running"] .ui-sba__mark { animation: none; }
}
`;
}

if (!customElements.get("tc-subagent-list")) customElements.define("tc-subagent-list", TcSubagentList);

declare global {
  interface HTMLElementTagNameMap {
    "tc-subagent-list": TcSubagentList;
  }
}
