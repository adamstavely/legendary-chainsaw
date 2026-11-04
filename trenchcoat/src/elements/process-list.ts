import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { parseOutput } from "./internal/ansi";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-process-list> – the dev servers and background jobs of a session, as rows: a status mark and word, the name, the
 * command, the port as a link, how long it has been up, optional CPU and memory meters, and the last line it printed.
 * Each row has Stop or Start, Restart and View output. Nothing here runs anything: the page passes plain data, listens
 * for the actions and passes the new statuses.
 *   · the rows' buttons are one tab stop: ↑ / ↓ move between rows, ← / → between a row's buttons, Home / End to the ends
 *   · pressing a row selects it (`selected`, controllable); a crashed row stands out and says its exit code
 *   · uptime counts from `started` against `now`, or the element's own clock when `now` isn't given
 *   · when it's narrow, the command and meters hide and the buttons show only their icons
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-process-list .processes=${[{ id: "web", name: "web", command: "vite", status: "running", port: 5173 }]}></tc-process-list>
 */

export type ProcessStatus = "starting" | "running" | "stopped" | "crashed" | "exited";
export type ProcessItem = {
  id: string;
  name: string;
  /** The command that started it */
  command?: string;
  status: ProcessStatus;
  /** The port it listens on */
  port?: number;
  /** Where the port link goes; by default http://localhost:<port> */
  url?: string;
  pid?: number;
  /** When it started, as an ISO date or epoch ms */
  started?: string | number;
  /** How it ended, for "crashed" and "exited" */
  exitCode?: number;
  /** CPU use from 0 to 100 */
  cpu?: number;
  /** Memory use in bytes */
  memory?: number;
  /** The last line it printed; escape codes are dropped */
  lastLine?: string;
};
export type ProcessListAction = { id: string; label: string; /** SVG path data for a 24×24 icon */ icon?: string };
export type ProcessListLabels = Record<ProcessStatus, string> & {
  stop: string;
  start: string;
  restart: string;
  logs: string;
  stopAll: string;
  running: string;
  empty: string;
  create: string;
  exit: string;
  cpu: string;
  memory: string;
  up: string;
};

/** Details of the events */
export type ProcessSelectedChange = { selected: string | null; process: ProcessItem | null };
export type ProcessEvent = { id: string; process: ProcessItem };
export type ProcessOpen = { id: string; process: ProcessItem; url: string };
export type ProcessListActionEvent = { id: string };

/** The words used when the page gives none */
export const defaultProcessListLabels: ProcessListLabels = {
  starting: "Starting",
  running: "Running",
  stopped: "Stopped",
  crashed: "Crashed",
  exited: "Exited",
  stop: "Stop",
  start: "Start",
  restart: "Restart",
  logs: "View output",
  stopAll: "Stop all",
  empty: "Nothing running",
  create: "Start a command",
  exit: "exit",
  cpu: "CPU",
  memory: "memory",
  up: "up",
};

/* Icons: Lucide (ISC, lucide.dev) – activity, square, play, rotate-cw, scroll-text, plus */
const headIcon = svg`<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path>`;
const ICON = {
  stop: svg`<rect x="6" y="6" width="12" height="12" rx="1.5"></rect>`,
  start: svg`<path d="M7 4.5v15a1 1 0 0 0 1.5.87l12-7.5a1 1 0 0 0 0-1.74l-12-7.5A1 1 0 0 0 7 4.5Z"></path>`,
  restart: svg`<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path>`,
  logs: svg`<path d="M15 12h-5"></path><path d="M15 8h-5"></path><path d="M19 17V5a2 2 0 0 0-2-2H4"></path><path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"></path>`,
  create: svg`<path d="M5 12h14"></path><path d="M12 5v14"></path>`,
};
const glyph = (body: TemplateResult) =>
  html`<svg class="ui-rproc__glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

const LIVE: ProcessStatus[] = ["starting", "running"];
const isLive = (p: ProcessItem) => LIVE.includes(p.status);

/** "12s", "4m", "2h 5m", "3d 4h" */
export function formatUptime(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return m % 60 ? `${h}h ${m % 60}m` : `${h}h`;
  const d = Math.floor(h / 24);
  return h % 24 ? `${d}d ${h % 24}h` : `${d}d`;
}

const startedAt = (p: ProcessItem) => (p.started === undefined ? undefined : typeof p.started === "number" ? p.started : Date.parse(p.started));
const plainLine = (line: string) =>
  parseOutput(line, "ui-rproc")
    .lines.map((l) => l.text)
    .join(" ")
    .trim();

/** The controls of one row, in tab order */
type Control = "row" | "port" | "toggle" | "restart" | "logs";

/**
 * The dev servers and background jobs of a session, with status, port, uptime, load and last output, and Stop, Start, Restart and View output.
 * @tag tc-process-list
 * @fires tc-selected-change - A row was pressed ({ selected, process }: ProcessSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-open - A port link was pressed ({ id, process, url }: ProcessOpen)
 * @fires tc-stop - Stop was pressed ({ id, process }: ProcessEvent); cancelable
 * @fires tc-start - Start was pressed ({ id, process }: ProcessEvent); cancelable
 * @fires tc-restart - Restart was pressed ({ id, process }: ProcessEvent); cancelable
 * @fires tc-logs - View output was pressed ({ id, process }: ProcessEvent)
 * @fires tc-stop-all - Stop all was pressed (detail: null); cancelable
 * @fires tc-create - Start a command was pressed in the empty list (detail: null)
 * @fires tc-action - A header action was pressed ({ id }: ProcessListActionEvent)
 */
export class TcProcessList extends TcElement {
  static override ui = "rproc";

  /** The heading; empty draws no header */
  @property() accessor heading = "Processes";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The processes, in order */
  @property({ attribute: false }) accessor processes: ProcessItem[] = [];
  /** The selected row's id. Changed by pressing a row unless a tc-selected-change listener calls preventDefault() */
  @property() accessor selected: string | null = null;
  /** The time uptime is counted to, in epoch ms; unset, the element keeps its own clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Buttons in the header, beside Stop all */
  @property({ attribute: false }) accessor actions: ProcessListAction[] = [];
  /** Rename any of the words, over the defaults */
  @property({ attribute: false }) accessor labels: Partial<ProcessListLabels> = {};
  /** The list's tallest height in px before it scrolls; 0 for no limit */
  @property({ type: Number, attribute: "max-height" }) accessor maxHeight = 0;
  /** Drops the tray and card */
  @property({ type: Boolean, reflect: true }) accessor bare = false;
  /** The language for numbers, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  /** The tab stop: a row and the index of a control in it */
  @state() private accessor active = { r: 0, c: 0 };
  @state() private accessor clock = 0;
  @state() private accessor announcement = "";
  private timer: ReturnType<typeof setInterval> | undefined;

  private word<K extends keyof ProcessListLabels>(key: K) {
    return this.labels[key] ?? defaultProcessListLabels[key];
  }
  private get time() {
    return this.now ?? this.clock;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.tick();
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.stopClock();
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const n = this.processes.length;
    if (n) {
      const r = Math.max(0, Math.min(this.active.r, n - 1));
      const c = Math.max(0, Math.min(this.active.c, this.controls(this.processes[r]).length - 1));
      if (r !== this.active.r || c !== this.active.c) this.active = { r, c };
    } else if (this.active.r || this.active.c) this.active = { r: 0, c: 0 };
    if (changed.has("now") || changed.has("processes")) this.tick();
  }

  /** Runs the clock only when it's needed: no `now`, and something live with a start time */
  private tick() {
    const need = this.isConnected && this.now === undefined && this.processes.some((p) => isLive(p) && p.started !== undefined);
    if (!need) {
      this.stopClock();
      return;
    }
    if (this.timer) return;
    const read = () => {
      // The element's own clock, when the page gives no `now`
      this.clock = Date.now();
    };
    read();
    this.timer = setInterval(read, 1000);
  }
  private stopClock() {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  private controls(p: ProcessItem): Control[] {
    const list: Control[] = ["row"];
    if (p.port !== undefined || p.url) list.push("port");
    list.push("toggle", "restart", "logs");
    return list;
  }

  /* ---------- Keyboard: one tab stop for the rows' buttons ---------- */

  private focusAt(r: number, c: number) {
    const rows = this.processes;
    if (!rows.length) return;
    r = Math.max(0, Math.min(rows.length - 1, r));
    c = Math.max(0, Math.min(this.controls(rows[r]).length - 1, c));
    this.active = { r, c };
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-at="${r}:${c}"]`)?.focus());
  }
  private onKey = (e: KeyboardEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-at]");
    if (!btn || e.altKey || e.metaKey || e.ctrlKey) return;
    const [r, c] = btn.dataset.at!.split(":").map(Number);
    const moves: Record<string, [number, number]> = {
      ArrowUp: [r - 1, c],
      ArrowDown: [r + 1, c],
      ArrowLeft: [r, c - 1],
      ArrowRight: [r, c + 1],
      Home: [0, c],
      End: [this.processes.length - 1, c],
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    this.focusAt(move[0], move[1]);
  };

  /* ---------- Actions ---------- */

  private select(p: ProcessItem, r: number) {
    this.active = { r, c: 0 };
    if (this.selected === p.id) return;
    if (this.emit<ProcessSelectedChange>("tc-selected-change", { selected: p.id, process: p }, { cancelable: true })) this.selected = p.id;
  }
  private act(name: "tc-stop" | "tc-start" | "tc-restart", p: ProcessItem, r: number, c: number, said: string) {
    this.active = { r, c };
    if (this.emit<ProcessEvent>(name, { id: p.id, process: p }, { cancelable: true })) this.announcement = `${said} ${p.name}`;
  }
  private stopAll() {
    if (this.emit("tc-stop-all", null, { cancelable: true })) this.announcement = this.word("stopAll");
  }
  private urlOf(p: ProcessItem) {
    return p.url ?? `http://localhost:${p.port}`;
  }
  private portText(p: ProcessItem) {
    if (p.port !== undefined) return `localhost:${p.port}`;
    try {
      return new URL(p.url!).host || p.url!;
    } catch {
      return p.url!;
    }
  }
  private bytes(n: number) {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let i = 0;
    while (n >= 1024 && i < units.length - 1) {
      n /= 1024;
      i++;
    }
    return `${n.toLocaleString(this.locale, { maximumFractionDigits: n < 10 && i ? 1 : 0 })} ${units[i]}`;
  }

  /* ---------- Rendering ---------- */

  private renderStatus(p: ProcessItem) {
    const word = this.word(p.status);
    const code = (p.status === "crashed" || p.status === "exited") && p.exitCode !== undefined ? ` · ${this.word("exit")} ${p.exitCode}` : "";
    return html`<span class="ui-rproc__status"><span class="ui-rproc__dot" aria-hidden="true"></span>${word}${code}</span>`;
  }

  private renderMeters(p: ProcessItem) {
    if (p.cpu === undefined && p.memory === undefined) return nothing;
    const cpu = p.cpu === undefined ? undefined : Math.max(0, Math.min(100, p.cpu));
    return html`<span class="ui-rproc__meters">
      ${cpu !== undefined
        ? html`<span class="ui-rproc__meter"
            ><span class="ui-rproc__bar" aria-hidden="true"><span class="ui-rproc__fill" style=${styleMap({ inlineSize: `${cpu}%` })}></span></span
            >${Math.round(cpu).toLocaleString(this.locale)}% ${this.word("cpu")}</span
          >`
        : nothing}
      ${p.memory !== undefined ? html`<span class="ui-rproc__meter">${this.bytes(p.memory)} ${this.word("memory")}</span>` : nothing}
    </span>`;
  }

  private button(kind: "toggle" | "restart" | "logs", p: ProcessItem, r: number, c: number, tab: number) {
    const live = isLive(p);
    const which = kind === "toggle" ? (live ? "stop" : "start") : kind;
    const word = this.word(which);
    const click =
      which === "stop"
        ? () => this.act("tc-stop", p, r, c, this.word("stop"))
        : which === "start"
          ? () => this.act("tc-start", p, r, c, this.word("start"))
          : which === "restart"
            ? () => this.act("tc-restart", p, r, c, this.word("restart"))
            : () => {
                this.active = { r, c };
                this.emit<ProcessEvent>("tc-logs", { id: p.id, process: p });
              };
    return html`<button type="button" class="ui-rproc__act" data-act=${which} data-at=${`${r}:${c}`} tabindex=${tab} title=${`${word} ${p.name}`} @click=${click}>
      ${glyph(ICON[which])}<span class="ui-rproc__word">${word}</span><span class="ui-rproc__sr"> ${p.name}</span>
    </button>`;
  }

  private renderRow(p: ProcessItem, r: number) {
    const controls = this.controls(p);
    const tab = (c: number) => (this.active.r === r && this.active.c === c ? 0 : -1);
    const started = startedAt(p);
    const up = isLive(p) && started !== undefined && !Number.isNaN(started) && this.time ? formatUptime(this.time - started) : "";
    const line = p.lastLine ? plainLine(p.lastLine) : "";
    const title = [p.name, p.command, p.pid !== undefined ? `PID ${p.pid}` : ""].filter(Boolean).join(" · ");
    return html`<li class="ui-rproc__row" data-id=${p.id} data-status=${p.status} ?data-selected=${this.selected === p.id}>
      <button type="button" class="ui-rproc__main" data-at=${`${r}:0`} tabindex=${tab(0)} aria-current=${ifDefined(this.selected === p.id ? "true" : undefined)} title=${title} @click=${() => this.select(p, r)}>
        <span class="ui-rproc__line1">
          <span class="ui-rproc__name">${p.name}</span>
          ${this.renderStatus(p)}
          ${up ? html`<span class="ui-rproc__up">${this.word("up")} ${up}</span>` : nothing}
        </span>
        ${p.command ? html`<span class="ui-rproc__cmd">${p.command}</span>` : nothing}
        ${line ? html`<span class="ui-rproc__last">${line}</span>` : nothing}
      </button>
      <span class="ui-rproc__side">
        ${controls.includes("port")
          ? html`<button
              type="button"
              class="ui-rproc__port"
              data-at=${`${r}:1`}
              tabindex=${tab(1)}
              title=${this.urlOf(p)}
              @click=${() => {
                this.active = { r, c: 1 };
                this.emit<ProcessOpen>("tc-open", { id: p.id, process: p, url: this.urlOf(p) });
              }}
            >${this.portText(p)}</button>`
          : nothing}
        ${this.renderMeters(p)}
        <span class="ui-rproc__acts">
          ${(["toggle", "restart", "logs"] as const).map((k) => {
            const c = controls.indexOf(k);
            return this.button(k, p, r, c, tab(c));
          })}
        </span>
      </span>
    </li>`;
  }

  protected override render() {
    const live = this.processes.filter(isLive).length;
    const aside =
      this.processes.length || this.actions.length
        ? html`${this.processes.length ? html`<span class="ui-rproc__count">${live.toLocaleString(this.locale)} ${this.word("running").toLowerCase()}</span>` : nothing}
          ${live ? html`<button type="button" class="ui-rproc__head-btn" data-head="stop-all" @click=${() => this.stopAll()}>${glyph(ICON.stop)}${this.word("stopAll")}</button>` : nothing}
          ${this.actions.map(
            (a) => html`<button type="button" class="ui-rproc__head-btn" data-head=${a.id} @click=${() => this.emit<ProcessListActionEvent>("tc-action", { id: a.id })}>
              ${a.icon ? glyph(svg`<path d=${a.icon}></path>`) : nothing}${a.label}
            </button>`,
          )}`
        : undefined;
    return html`${this.heading ? cardHead({ icon: headIcon, title: this.heading, subtitle: this.description, aside }) : nothing}
      <div class="ui-rproc__card">
        ${!this.heading && aside ? html`<div class="ui-rproc__bar">${aside}</div>` : nothing}
        ${this.processes.length
          ? html`<ul class="ui-rproc__list" aria-label=${this.heading || "Processes"} style=${styleMap({ maxHeight: this.maxHeight > 0 ? `${this.maxHeight}px` : undefined })} @keydown=${this.onKey}>
              ${repeat(this.processes, (p) => p.id, (p, r) => this.renderRow(p, r))}
            </ul>`
          : html`<div class="ui-rproc__empty">
              <p>${this.word("empty")}</p>
              <button type="button" class="ui-rproc__create" @click=${() => this.emit("tc-create", null)}>${glyph(ICON.create)}${this.word("create")}</button>
            </div>`}
      </div>
      <span class="ui-rproc__sr" role="status">${this.announcement}</span>`;
  }

  static override css = /* css */ `
[data-ui="rproc"] {
  /* The CPU meter's width */
  --tc-rproc-meter: var(--tc-space-10);
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rproc"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-rproc__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rproc"] { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
[data-ui="rproc"][bare] { padding: 0; overflow: visible; border-radius: 0; background: none; box-shadow: none; }
[data-ui="rproc"][bare] .ui-rproc__card { border-radius: 0; background: none; box-shadow: none; }
[data-ui="rproc"] *, [data-ui="rproc"] *::before, [data-ui="rproc"] *::after { box-sizing: border-box; }
:where([data-ui="rproc"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="rproc"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
[data-ui="rproc"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="rproc"] svg { display: block; flex: none; }
.ui-rproc__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.ui-rproc__glyph { width: var(--tc-space-3-5); height: var(--tc-space-3-5); }

.ui-rproc__count { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-rproc__head-btn, .ui-rproc__create {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  min-height: var(--tc-control-h-sm);
  padding: 0 var(--tc-space-2);
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  color: var(--tc-text-primary);
  font-size: var(--tc-font-size-sm);
  white-space: nowrap;
}
.ui-rproc__head-btn:hover, .ui-rproc__create:hover { background: var(--tc-fill-hover); }
.ui-rproc__bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-3); border-bottom: var(--tc-hairline) solid var(--tc-divider); }

.ui-rproc__list { overflow: auto; overscroll-behavior: contain; }
.ui-rproc__row { position: relative; display: flex; align-items: stretch; min-width: 0; }
.ui-rproc__row + .ui-rproc__row { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rproc__row[data-selected] { background: var(--tc-fill-selected); }
/* A crash stands out: a danger rule at the start, as well as its word */
.ui-rproc__row[data-status="crashed"] { background: var(--tc-status-danger-bg); box-shadow: inset var(--tc-space-0-5) 0 0 var(--tc-status-danger-solid); }
.ui-rproc__main { flex: 1 1 0; display: grid; align-content: center; gap: var(--tc-space-0-5); min-width: 0; min-height: var(--tc-control-h-sm); padding: var(--tc-space-2) var(--tc-space-3); text-align: left; }
.ui-rproc__main:hover { background: var(--tc-fill-hover); }
.ui-rproc__line1 { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-1) var(--tc-space-2); min-width: 0; }
.ui-rproc__name { min-width: 0; overflow: hidden; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
.ui-rproc__status { display: inline-flex; align-items: center; gap: var(--tc-space-1); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); white-space: nowrap; }
.ui-rproc__dot { width: var(--tc-space-2); height: var(--tc-space-2); border: var(--tc-hairline) solid currentColor; border-radius: var(--tc-radius-full); }
[data-status="running"] .ui-rproc__status { color: var(--tc-status-success-fg); }
[data-status="running"] .ui-rproc__dot { border-color: transparent; background: var(--tc-status-success-solid); }
[data-status="starting"] .ui-rproc__status { color: var(--tc-status-warning-fg); }
[data-status="starting"] .ui-rproc__dot { border-style: dashed; animation: ui-rproc-turn var(--tc-duration-reveal-slow) linear infinite; }
[data-status="crashed"] .ui-rproc__status { color: var(--tc-status-danger-fg); font-weight: var(--tc-font-weight-medium); }
[data-status="crashed"] .ui-rproc__dot { border-radius: var(--tc-radius-2xs); border-color: transparent; background: var(--tc-status-danger-solid); }
@keyframes ui-rproc-turn { to { transform: rotate(360deg); } }
.ui-rproc__up { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-rproc__cmd, .ui-rproc__last { min-width: 0; overflow: hidden; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
.ui-rproc__cmd { color: var(--tc-text-muted); }
.ui-rproc__last { color: var(--tc-text-secondary); }
/* On a selected or crashed row's tint the quiet text steps up a shade, to keep its contrast */
:is(.ui-rproc__row[data-selected], .ui-rproc__row[data-status="crashed"]) :is(.ui-rproc__up, .ui-rproc__cmd, .ui-rproc__meters) { color: var(--tc-text-secondary); }
.ui-rproc__row[data-selected]:is([data-status="stopped"], [data-status="exited"]) .ui-rproc__status { color: var(--tc-text-secondary); }

.ui-rproc__side { flex: none; display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-1) var(--tc-space-3); max-width: 60%; padding: var(--tc-space-1) var(--tc-space-2) var(--tc-space-1) 0; }
.ui-rproc__port { min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1); border-radius: var(--tc-control-radius-sm); color: var(--tc-accent-text); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); text-decoration: underline; text-underline-offset: var(--tc-space-0-5); white-space: nowrap; }
.ui-rproc__port:hover { background: var(--tc-fill-hover); }
.ui-rproc__meters { display: flex; flex-direction: column; gap: var(--tc-space-0-5); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-rproc__meter { display: flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-rproc__bar { display: block; width: var(--tc-rproc-meter); height: var(--tc-meter-h); overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-rproc__fill { display: block; height: 100%; border-radius: inherit; background: var(--tc-meter-fill); }
.ui-rproc__acts { display: flex; gap: var(--tc-space-0-5); }
.ui-rproc__act { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-width: var(--tc-control-h-sm); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); white-space: nowrap; }
.ui-rproc__act:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-rproc__act[data-act="stop"] { color: var(--tc-status-danger-fg); }

.ui-rproc__empty { display: grid; justify-items: center; gap: var(--tc-space-3); padding: var(--tc-space-6) var(--tc-space-4); }
.ui-rproc__empty p { margin: 0; color: var(--tc-text-muted); }

/* Wide: the words show beside the icons. Narrow: the command and meters hide, the buttons show only their icons */
@container (max-width: 34rem) {
  .ui-rproc__act { justify-content: center; padding: 0; }
  .ui-rproc__word { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
  .ui-rproc__meters { display: none; }
}
@container (max-width: 26rem) {
  .ui-rproc__cmd { display: none; }
  .ui-rproc__row { flex-wrap: wrap; }
  .ui-rproc__main { flex-basis: 100%; padding-bottom: 0; }
  .ui-rproc__side { max-width: none; width: 100%; justify-content: space-between; padding: 0 var(--tc-space-2) var(--tc-space-1) var(--tc-space-2); }
}
@media (prefers-reduced-motion: reduce) {
  [data-status="starting"] .ui-rproc__dot { animation: none; }
}
@media (forced-colors: active) {
  .ui-rproc__dot, .ui-rproc__fill { background: CanvasText; border-color: CanvasText; }
  .ui-rproc__row[data-status="crashed"] { outline: var(--tc-hairline) solid CanvasText; }
}
`;
}

if (!customElements.get("tc-process-list")) customElements.define("tc-process-list", TcProcessList);
declare global {
  interface HTMLElementTagNameMap {
    "tc-process-list": TcProcessList;
  }
}
