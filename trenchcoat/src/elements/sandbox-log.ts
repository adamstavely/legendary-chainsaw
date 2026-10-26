import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, RowWindowController } from "./internal/controllers";
import type { Look } from "./internal/look";

/*
 * <tc-sandbox-log> – command output from an agent's sandbox. One collapsible block per step: the command in mono, its
 * exit code and duration, and the output below as a terminal shows it – ANSI colours, bold, dim and underline mapped
 * to the theme's tokens. The output streams (pass a longer `output` and only the new lines are parsed), sticks to the
 * bottom while you're at the bottom, and is windowed: a step with 50,000 lines renders the hundred or so near the
 * viewport. Search finds text across every step (↵ / ⇧↵ for the next and previous match), Copy takes a step's plain
 * text (or the whole log). Standard has the gray tray around a white card with a summary below; Clean is one white
 * card with the summary as its last row.
 *
 *   <tc-sandbox-log heading="Sandbox" .steps=${[{ id: "1", command: "npm test", output, exitCode: 1, duration: 8200 }]}></tc-sandbox-log>
 *
 * Output text is never parsed as HTML: escape sequences become token-coloured spans, everything else is text.
 * Unset, `open` opens the steps that are running or failed; a toggle fires a cancelable `tc-open-change`
 * ({ open: string[] }), and typing in the search a cancelable `tc-query-change` ({ query }).
 */

export type SandboxLogStatus = "queued" | "running" | "success" | "error";
export type SandboxLogStep = {
  id: string;
  /** The command as typed – "npm test" */
  command: string;
  /** A plain-language line next to the command – "Run the test suite" */
  label?: string;
  /** Everything the command printed so far, with ANSI escape codes; pass a longer string as it streams */
  output?: string;
  /** Unset while the command runs */
  exitCode?: number;
  /** In ms – shown once known (update it while running for a live time) */
  duration?: number;
  /** Overrides the status the exit code gives: "queued" before it starts */
  status?: SandboxLogStatus;
};
export type SandboxLogOpenChange = { open: string[] };
export type SandboxLogQueryChange = { query: string };
export type SandboxLogCopy = { stepId: string | null; text: string };

/* ---------- ANSI (SGR) → token classes ---------- */

const COLOURS = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"] as const;
type Sgr = { fg: string | null; bg: string | null; b: boolean; d: boolean; i: boolean; u: boolean; inv: boolean };
const PLAIN: Sgr = { fg: null, bg: null, b: false, d: false, i: false, u: false, inv: false };

/** The nearest of the eight colours (or gray) for a 256-colour or true-colour value */
function nearest(r: number, g: number, b: number): string {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 48) return max > 200 ? "white" : max < 72 ? "black" : "gray";
  const d = max - min;
  const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  const deg = h * 60;
  return deg < 20 || deg >= 330 ? "red" : deg < 70 ? "yellow" : deg < 160 ? "green" : deg < 200 ? "cyan" : deg < 260 ? "blue" : "magenta";
}
function indexed(n: number): string | null {
  if (!Number.isFinite(n) || n < 0 || n > 255) return null;
  if (n < 8) return COLOURS[n];
  if (n === 8) return "gray";
  if (n < 16) return COLOURS[n - 8];
  if (n < 232) {
    const v = (k: number) => (k ? 55 + k * 40 : 0);
    const c = n - 16;
    return nearest(v(Math.floor(c / 36)), v(Math.floor(c / 6) % 6), v(c % 6));
  }
  const level = 8 + (n - 232) * 10;
  return level > 200 ? "white" : level < 72 ? "black" : "gray";
}

function applySgr(from: Sgr, params: number[]): Sgr {
  const s = { ...from };
  if (!params.length) return { ...PLAIN };
  for (let i = 0; i < params.length; i++) {
    const p = params[i];
    if (p === 0) Object.assign(s, PLAIN);
    else if (p === 1) s.b = true;
    else if (p === 2) s.d = true;
    else if (p === 3) s.i = true;
    else if (p === 4) s.u = true;
    else if (p === 7) s.inv = true;
    else if (p === 21 || p === 22) s.b = s.d = false;
    else if (p === 23) s.i = false;
    else if (p === 24) s.u = false;
    else if (p === 27) s.inv = false;
    else if (p >= 30 && p <= 37) s.fg = COLOURS[p - 30];
    else if (p === 39) s.fg = null;
    else if (p >= 40 && p <= 47) s.bg = COLOURS[p - 40];
    else if (p === 49) s.bg = null;
    else if (p >= 90 && p <= 97) s.fg = p === 90 ? "gray" : COLOURS[p - 90];
    else if (p >= 100 && p <= 107) s.bg = p === 100 ? "gray" : COLOURS[p - 100];
    else if (p === 38 || p === 48) {
      let c: string | null = null;
      if (params[i + 1] === 5) {
        c = indexed(params[i + 2]);
        i += 2;
      } else if (params[i + 1] === 2) {
        c = nearest(params[i + 2] ?? 0, params[i + 3] ?? 0, params[i + 4] ?? 0);
        i += 4;
      }
      if (p === 38) s.fg = c;
      else s.bg = c;
    }
  }
  return s;
}

const classCache = new Map<string, string>();
/** The span's classes for a style – "" for plain text */
function classOf(s: Sgr): string {
  const fg = s.fg ?? (s.d ? "gray" : null);
  const key = `${fg}|${s.bg}|${+s.b}${+s.i}${+s.u}${+s.inv}`;
  let cls = classCache.get(key);
  if (cls === undefined) {
    const parts: string[] = [];
    if (fg) parts.push(`ui-sbl__fg-${fg}`);
    if (s.bg) parts.push(`ui-sbl__bg-${s.bg}`);
    if (s.b) parts.push("ui-sbl__b");
    if (s.i) parts.push("ui-sbl__i");
    if (s.u) parts.push("ui-sbl__u");
    if (s.inv) parts.push("ui-sbl__inv");
    cls = parts.join(" ");
    classCache.set(key, cls);
  }
  return cls;
}

/** One line of output: its plain text, and the styled runs when it has any */
export type SandboxLogLine = { text: string; runs: Array<[cls: string, text: string]> | null };

// CSI (colours, cursor moves), OSC (titles, links) and the two-byte escapes; only SGR ("m") changes the style
const ESCAPE = /\x1b(?:\[([0-9;:?]*)[ -/]*([@-~])|\][^\x07\x1b]*(?:\x07|\x1b\\)?|[@-Z\\-_])/g;
const CONTROL = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;

/** Parses one line (no \n) from a style; returns the line and the style after it */
function parseLine(raw: string, from: Sgr): { line: SandboxLogLine; style: Sgr } {
  let style = from;
  if (raw.endsWith("\r")) raw = raw.slice(0, -1);
  let runs: Array<[string, string]> = [];
  const push = (piece: string) => {
    // A carriage return goes back to the start of the line: what came before is overwritten (progress bars)
    const cr = piece.lastIndexOf("\r");
    if (cr >= 0) {
      runs = [];
      piece = piece.slice(cr + 1);
    }
    piece = piece.replace(CONTROL, "");
    if (!piece) return;
    const cls = classOf(style);
    const last = runs[runs.length - 1];
    if (last && last[0] === cls) last[1] += piece;
    else runs.push([cls, piece]);
  };
  if (raw.indexOf("\x1b") < 0) push(raw);
  else {
    ESCAPE.lastIndex = 0;
    let at = 0;
    let m: RegExpExecArray | null;
    while ((m = ESCAPE.exec(raw))) {
      if (m.index > at) push(raw.slice(at, m.index));
      if (m[2] === "m") style = applySgr(style, m[1] ? m[1].split(/[;:]/).map((n) => (n === "" ? 0 : Number(n))) : []);
      at = m.index + m[0].length;
    }
    if (at < raw.length) push(raw.slice(at));
  }
  const text = runs.map((r) => r[1]).join("");
  return { line: { text, runs: runs.some((r) => r[0]) ? runs : null }, style };
}

/** A step's parsed output. Lines up to `frozen` (complete, ending in \n) are kept when the output grows */
type Parsed = { source: string; lines: SandboxLogLine[]; frozen: number; frozenAt: number; frozenStyle: Sgr };

/** Parses `source`, reusing the complete lines of `prev` when the new text starts with them */
function parseOutput(source: string, prev?: Parsed): Parsed {
  if (prev && prev.source === source) return prev;
  let lines: SandboxLogLine[] = [];
  let at = 0;
  let style = PLAIN;
  if (prev && source.length >= prev.frozenAt && source.startsWith(prev.source.slice(0, prev.frozenAt))) {
    lines = prev.lines;
    lines.length = prev.frozen;
    at = prev.frozenAt;
    style = prev.frozenStyle;
  }
  let frozen = lines.length;
  let frozenAt = at;
  let frozenStyle = style;
  while (at <= source.length) {
    const nl = source.indexOf("\n", at);
    if (nl < 0) {
      // The last line, still being written – parsed again when more arrives; an empty one isn't shown
      if (at < source.length) lines.push(parseLine(source.slice(at), style).line);
      break;
    }
    const r = parseLine(source.slice(at, nl), style);
    lines.push(r.line);
    style = r.style;
    at = nl + 1;
    frozen = lines.length;
    frozenAt = at;
    frozenStyle = style;
  }
  return { source, lines, frozen, frozenAt, frozenStyle };
}

/** The output of a step as plain text – what Copy takes */
export function sandboxLogPlainText(output: string): string {
  return parseOutput(output)
    .lines.map((l) => l.text)
    .join("\n");
}

/* ---------- Formatting ---------- */

/** 420ms, 2.4s, 1m 05s */
function formatMs(ms: number) {
  if (ms < 1000) return `${Math.max(0, Math.round(ms))}ms`;
  if (ms < 60_000) return `${(Math.floor(ms / 100) / 10).toFixed(1)}s`;
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}
const statusOf = (s: SandboxLogStep): SandboxLogStatus => s.status ?? (s.exitCode == null ? "running" : s.exitCode === 0 ? "success" : "error");
const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older browsers and non-secure contexts
    const area = document.createElement("textarea");
    area.value = text;
    area.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

/* ---------- Icons ---------- */

const spinner = (look: Look) =>
  html`<svg class="ui-sbl__spinner" viewBox="0 0 16 16" aria-hidden="true">${look === "clean" ? svg`<circle cx="8" cy="8" r="6"></circle><path d="M8 2a6 6 0 0 1 6 6"></path>` : svg`<circle cx="8" cy="8" r="5.75"></circle><path d="M8 2.25a5.75 5.75 0 0 1 5.75 5.75"></path>`}</svg>`;
const okIcon = (look: Look) =>
  html`<svg class="ui-sbl__ok" viewBox="0 0 16 16" aria-hidden="true">${look === "clean" ? svg`<circle cx="8" cy="8" r="7"></circle><path d="M5.1 8.2 7.1 10.1 10.9 6"></path>` : svg`<path d="M3.5 8.4 6.6 11.3 12.5 4.9"></path>`}</svg>`;
const errIcon = (look: Look) =>
  html`<svg class="ui-sbl__err" viewBox="0 0 16 16" aria-hidden="true">${svg`<circle cx="8" cy="8" r=${look === "clean" ? 7 : 6}></circle><path d=${look === "clean" ? "M8 4.9v3.5M8 10.9v.1" : "M8 5v3.4M8 10.9v.1"}></path>`}</svg>`;
const queuedIcon = html`<svg class="ui-sbl__queued" viewBox="0 0 16 16" aria-hidden="true">${svg`<circle cx="8" cy="8" r="5.75"></circle>`}</svg>`;
const chevron = (look: Look) =>
  look === "clean"
    ? html`<svg class="ui-sbl__chevron" viewBox="0 0 12 12" aria-hidden="true">${svg`<path d="M3.5 5.25 6 7.75l2.5-2.5"></path>`}</svg>`
    : html`<svg class="ui-sbl__chevron" viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M4.5 6.25 8 9.75l3.5-3.5"></path>`}</svg>`;
const copyIcon = (look: Look) =>
  html`<svg class="ui-sbl__copy-icon" viewBox="0 0 16 16" aria-hidden="true">${look === "clean"
    ? svg`<rect x="5.5" y="5.5" width="8.5" height="8.5" rx="2"></rect><path d="M10.5 3.75v-.25A1.5 1.5 0 0 0 9 2H3.5A1.5 1.5 0 0 0 2 3.5V9a1.5 1.5 0 0 0 1.5 1.5h.25"></path>`
    : svg`<rect x="5.25" y="5.25" width="8" height="8" rx="2"></rect><path d="M10.75 5.25v-1a1.5 1.5 0 0 0-1.5-1.5h-4.5a2 2 0 0 0-2 2v4.5a1.5 1.5 0 0 0 1.5 1.5h1"></path>`}</svg>`;
const copyDone = html`<svg class="ui-sbl__copy-done" viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M3.5 8.4 6.6 11.3 12.5 4.9"></path>`}</svg>`;
const searchIcon = html`<svg class="ui-sbl__search-icon" viewBox="0 0 16 16" aria-hidden="true">${svg`<circle cx="7.25" cy="7.25" r="4.5"></circle><path d="m10.5 10.5 3 3"></path>`}</svg>`;
const upIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M4.5 9.75 8 6.25l3.5 3.5"></path>`}</svg>`;
const downIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M4.5 6.25 8 9.75l3.5-3.5"></path>`}</svg>`;
const statusIcon = (status: SandboxLogStatus, look: Look) =>
  status === "running" ? spinner(look) : status === "success" ? okIcon(look) : status === "error" ? errIcon(look) : queuedIcon;

/* ---------- The element ---------- */

/** A step with more lines than this renders only the ones near the viewport */
const WINDOW_FROM = 60;
const OVERSCAN = 40;
/** --tc-line-height-normal, the row height before the first row is measured */
const ROW = 20;
/** Most matches counted – a search for "e" in 50,000 lines stops here */
const MAX_HITS = 10_000;

type Hits = { q: string; upto: number; list: number[]; lines: SandboxLogLine[] };
let instances = 0;

/**
 * Command output from an agent's sandbox: a collapsible block per step with the command, exit code, duration and
 * the output in colour; search and copy; windowed for long logs.
 * @tag tc-sandbox-log
 * @fires tc-open-change - A step opens or closes ({ open: string[] }); cancelable – prevent it to control `open`
 * @fires tc-query-change - The search text changes ({ query: string }); cancelable – prevent it to control `query`
 * @fires tc-copy - A step's output, or the whole log, was copied ({ stepId: string | null, text: string })
 */
export class TcSandboxLog extends TcElement {
  static override ui = "sbl";

  /** Names the region, shown at the top */
  @property() accessor heading = "Sandbox";
  /** Small text next to the heading – the machine, image or working directory */
  @property() accessor environment = "";
  /** The commands in the order they ran – one collapsible block each, with their output so far */
  @property({ attribute: false }) accessor steps: SandboxLogStep[] = [];
  /** Ids of the open steps – unset opens the steps that are running or failed */
  @property({ attribute: false }) accessor open: string[] | undefined = undefined;
  /** The search text */
  @property() accessor query = "";
  /** Height in px at which a step's output scrolls */
  @property({ type: Number, attribute: "max-height" }) accessor maxHeight = 320;
  /** Keeps a step's output scrolled to its end, as a terminal does, until the reader scrolls up */
  @property({ type: Boolean }) accessor follow = true;
  /** Shows a line-number gutter */
  @property({ type: Boolean, attribute: "line-numbers" }) accessor lineNumbers = true;
  /** Hides the summary line under the log */
  @property({ type: Boolean, attribute: "hide-summary" }) accessor hideSummary = false;

  /** The match the search is on (0-based, across all steps) */
  @state() private accessor current = 0;
  @state() private accessor copied: string | null = null;
  @state() private accessor announcement = "";

  private readonly uid = `tc-sbl${++instances}`;
  private parsed = new Map<string, Parsed>();
  private hits = new Map<string, Hits>();
  private windows = new Map<string, RowWindowController>();
  /** Per step: false once the reader scrolled away from the end */
  private stuck = new Map<string, boolean>();
  private prevStatus = new Map<string, SandboxLogStatus>();
  private copyTimer = 0;
  private ownName = false;

  constructor() {
    super();
    // Focus on a step that goes away moves to the first step's toggle, else the search
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-sbl__toggle") ?? this.querySelector<HTMLElement>(".ui-sbl__input"));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    this.ownName ||= (this.hasAttribute("aria-label") && this.getAttribute("aria-label") !== this.heading) || this.hasAttribute("aria-labelledby");
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.clearTimeout(this.copyTimer);
    this.copyTimer = 0;
  }

  /** The parsed lines of a step (cached; a longer output parses only its new lines) */
  linesOf(id: string): readonly SandboxLogLine[] {
    return this.parsed.get(id)?.lines ?? [];
  }

  private get openIds(): string[] {
    return this.open ?? this.steps.filter((s) => ["running", "error"].includes(statusOf(s))).map((s) => s.id);
  }

  private setOpen(next: string[]) {
    if (this.emit<SandboxLogOpenChange>("tc-open-change", { open: next }, { cancelable: true })) this.open = next;
  }

  private toggle(id: string) {
    const open = this.openIds;
    this.setOpen(open.includes(id) ? open.filter((o) => o !== id) : [...open, id]);
  }

  private setQuery(query: string) {
    if (query === this.query) return;
    if (this.emit<SandboxLogQueryChange>("tc-query-change", { query }, { cancelable: true })) this.query = query;
    else this.requestUpdate();
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // Parse what's new; forget steps that went away
    const ids = new Set(this.steps.map((s) => s.id));
    for (const s of this.steps) this.parsed.set(s.id, parseOutput(s.output ?? "", this.parsed.get(s.id)));
    for (const id of [...this.parsed.keys()]) if (!ids.has(id)) this.parsed.delete(id);
    for (const id of [...this.hits.keys()]) if (!ids.has(id)) this.hits.delete(id);
    for (const id of [...this.stuck.keys()]) if (!ids.has(id)) this.stuck.delete(id);

    // One row window per long step
    for (const [id, win] of this.windows)
      if (!ids.has(id) || this.linesOf(id).length <= WINDOW_FROM) {
        this.removeController(win);
        win.hostDisconnected();
        this.windows.delete(id);
      }
    for (const s of this.steps)
      if (!this.windows.has(s.id) && this.linesOf(s.id).length > WINDOW_FROM) {
        const win = new RowWindowController(this, {
          count: () => this.linesOf(s.id).length,
          body: () => this.querySelector<HTMLElement>(`.ui-sbl__lines[data-step="${CSS.escape(s.id)}"]`),
          rowSelector: ".ui-sbl__line",
          from: WINDOW_FROM,
          overscan: OVERSCAN,
          rowHeight: ROW,
        });
        this.windows.set(s.id, win);
      }
    for (const win of this.windows.values()) win.compute();

    // Search: only lines that are new (or still being written) are scanned again
    const q = this.query.trim().toLowerCase();
    for (const s of this.steps) {
      const lines = this.linesOf(s.id);
      let h = this.hits.get(s.id);
      const p = this.parsed.get(s.id)!;
      // A new search, or an output that was replaced rather than extended, starts over
      if (!h || h.q !== q || h.lines !== p.lines) h = { q, upto: 0, list: [], lines: p.lines };
      const keep = Math.min(h.upto, p.frozen);
      // Matches on lines past the complete ones (the line still being written) are found again below
      let n = h.list.length;
      while (n >= 2 && h.list[n - 2] >= keep) n -= 2;
      h.list.length = n;
      if (q) {
        for (let i = keep; i < lines.length && h.list.length < MAX_HITS * 2; i++) {
          const text = lines[i].text.toLowerCase();
          for (let at = text.indexOf(q); at >= 0 && h.list.length < MAX_HITS * 2; at = text.indexOf(q, at + q.length)) h.list.push(i, at);
        }
      }
      h.upto = p.frozen;
      this.hits.set(s.id, h);
    }
    if (changed.has("query")) this.current = 0;
    const total = this.totalHits;
    if (this.current >= total) this.current = Math.max(0, total - 1);

    // Say when a step finishes
    const said: string[] = [];
    for (const s of this.steps) {
      const st = statusOf(s);
      const was = this.prevStatus.get(s.id);
      if (was === "running" && st !== "running") said.push(st === "success" ? `${s.command} finished` : st === "error" ? `${s.command} failed with exit code ${s.exitCode ?? "unknown"}` : `${s.command} stopped`);
      this.prevStatus.set(s.id, st);
    }
    if (said.length) this.announcement = said.join(". ");
    if (changed.has("query") && changed.get("query") !== undefined) this.announcement = q ? (total ? `${plural(total, "match", "matches")}${total >= MAX_HITS ? " or more" : ""}` : "No matches") : "";
  }

  private get totalHits() {
    let n = 0;
    for (const s of this.steps) n += (this.hits.get(s.id)?.list.length ?? 0) / 2;
    return Math.min(n, MAX_HITS);
  }

  /** The step, line and offset of the n-th match */
  private hitAt(n: number): { step: SandboxLogStep; line: number; at: number } | null {
    for (const s of this.steps) {
      const list = this.hits.get(s.id)?.list ?? [];
      if (n < list.length / 2) return { step: s, line: list[n * 2], at: list[n * 2 + 1] };
      n -= list.length / 2;
    }
    return null;
  }

  /** Moves to the next (1) or previous (-1) match: opens its step and scrolls it into view */
  async go(delta: number) {
    const total = this.totalHits;
    if (!total) return;
    this.current = (this.current + delta + total) % total;
    await this.reveal();
  }

  private async reveal() {
    const hit = this.hitAt(this.current);
    if (!hit) return;
    const { step, line } = hit;
    if (!this.openIds.includes(step.id)) this.setOpen([...this.openIds, step.id]);
    this.windows.get(step.id)?.reveal(line);
    await this.updateComplete;
    const out = this.querySelector<HTMLElement>(`.ui-sbl__out[data-step="${CSS.escape(step.id)}"]`);
    if (!out) return;
    const row = this.windows.get(step.id)?.rowHeight ?? (out.querySelector<HTMLElement>(".ui-sbl__line")?.offsetHeight || ROW);
    const top = line * row;
    if (top < out.scrollTop || top + row > out.scrollTop + out.clientHeight) out.scrollTop = Math.max(0, top - out.clientHeight / 2 + row / 2);
    this.stuck.set(step.id, out.scrollTop + out.clientHeight >= out.scrollHeight - 4);
    await this.updateComplete;
    this.querySelector(".ui-sbl__hit[data-current]")?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }

  private copy(stepId: string | null) {
    const text = stepId
      ? this.linesOf(stepId)
          .map((l) => l.text)
          .join("\n")
      : this.steps.map((s) => [`$ ${s.command}`, ...this.linesOf(s.id).map((l) => l.text)].join("\n")).join("\n\n");
    void copyText(text).then((ok) => {
      if (!ok || !this.isConnected) return;
      this.copied = stepId ?? "*";
      this.announcement = "Copied";
      this.emit<SandboxLogCopy>("tc-copy", { stepId, text });
      window.clearTimeout(this.copyTimer);
      this.copyTimer = window.setTimeout(() => {
        this.copyTimer = 0;
        this.copied = null;
      }, 1400);
    });
  }

  private onKeyDown = (e: KeyboardEvent) => {
    // ⌘F / Ctrl+F inside the log goes to its search
    if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "f") {
      const input = this.querySelector<HTMLInputElement>(".ui-sbl__input");
      if (input) {
        e.preventDefault();
        input.focus();
        input.select();
      }
    }
  };

  /** Accordion keys on the step headers: ↑ ↓ Home End */
  private onHeadKey = (e: KeyboardEvent) => {
    const heads = [...this.querySelectorAll<HTMLButtonElement>(".ui-sbl__toggle")];
    const i = heads.indexOf(e.target as HTMLButtonElement);
    if (i < 0) return;
    const to = e.key === "ArrowDown" ? (i + 1) % heads.length : e.key === "ArrowUp" ? (i - 1 + heads.length) % heads.length : e.key === "Home" ? 0 : e.key === "End" ? heads.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    heads[to].focus();
  };

  private onSearchKey = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void this.go(e.shiftKey ? -1 : 1);
    } else if (e.key === "Escape" && this.query) {
      e.preventDefault();
      e.stopPropagation();
      this.setQuery("");
    }
  };

  private onScroll(id: string, e: Event) {
    const out = e.currentTarget as HTMLElement;
    this.stuck.set(id, out.scrollTop + out.clientHeight >= out.scrollHeight - 4);
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (!this.ownName) this.setAttribute("aria-label", this.heading);
    // Output stays at its end, as in a terminal, until the reader scrolls up (or a search moves it)
    if (!this.follow) return;
    const open = new Set(this.openIds);
    for (const s of this.steps) {
      if (!open.has(s.id) || this.stuck.get(s.id) === false) continue;
      const out = this.querySelector<HTMLElement>(`.ui-sbl__out[data-step="${CSS.escape(s.id)}"]`);
      if (out && out.scrollHeight > out.clientHeight) out.scrollTop = out.scrollHeight;
    }
  }

  /** A line's text with its styles and the search's marks */
  private lineContent(line: SandboxLogLine, marks: number[], qlen: number, currentAt: number): Array<TemplateResult | string> | string {
    const runs = line.runs ?? [["", line.text] as [string, string]];
    if (!marks.length) return runs.length === 1 && !runs[0][0] ? runs[0][1] : runs.map(([cls, text]) => (cls ? html`<span class=${cls}>${text}</span>` : text));
    const out: Array<TemplateResult | string> = [];
    let o = 0;
    for (const [cls, text] of runs) {
      const end = o + text.length;
      const pieces: Array<TemplateResult | string> = [];
      let at = o;
      for (const m of marks) {
        const ms = Math.max(m, at);
        const me = Math.min(m + qlen, end);
        if (me <= ms) continue;
        if (ms > at) pieces.push(text.slice(at - o, ms - o));
        pieces.push(html`<mark class="ui-sbl__hit" ?data-current=${m === currentAt}>${text.slice(ms - o, me - o)}</mark>`);
        at = me;
      }
      if (at < end) pieces.push(text.slice(at - o));
      out.push(cls ? html`<span class=${cls}>${pieces}</span>` : html`${pieces}`);
      o = end;
    }
    return out;
  }

  private output(step: SandboxLogStep, status: SandboxLogStatus) {
    const lines = this.linesOf(step.id);
    const win = this.windows.get(step.id);
    const start = win?.virtual ? win.start : 0;
    const end = win?.virtual ? win.end : lines.length;
    const row = win?.rowHeight ?? ROW;
    const h = this.hits.get(step.id);
    const qlen = this.query.trim().length;
    // The marks per line in the window, and the current one
    const marks = new Map<number, number[]>();
    let currentLine = -1;
    let currentAt = -1;
    if (h && h.list.length) {
      const cur = this.hitAt(this.current);
      if (cur && cur.step.id === step.id) {
        currentLine = cur.line;
        currentAt = cur.at;
      }
      for (let k = 0; k < h.list.length; k += 2) {
        const ln = h.list[k];
        if (ln < start) continue;
        if (ln >= end) break;
        let list = marks.get(ln);
        if (!list) marks.set(ln, (list = []));
        list.push(h.list[k + 1]);
      }
    }
    const digits = String(Math.max(1, lines.length)).length;
    const label = `Output of ${step.command}`;
    if (!lines.length)
      return html`<p class="ui-sbl__empty">${status === "running" ? "Waiting for output…" : status === "queued" ? "Not started yet." : "No output."}</p>`;
    const rows: TemplateResult[] = [];
    for (let n = start; n < end; n++) {
      const line = lines[n];
      rows.push(
        html`<div class="ui-sbl__line" ?data-current=${n === currentLine}>${this.lineNumbers ? html`<span class="ui-sbl__ln" aria-hidden="true">${n + 1}</span>` : nothing}<span class="ui-sbl__txt">${this.lineContent(line, marks.get(n) ?? [], qlen, n === currentLine ? currentAt : -1)}</span></div>`,
      );
    }
    return html`<div
      class="ui-sbl__out"
      data-step=${step.id}
      tabindex="0"
      role="region"
      aria-label=${label}
      style=${styleMap({ maxHeight: `${this.maxHeight}px`, "--digits": `${digits}ch` })}
      @scroll=${(e: Event) => this.onScroll(step.id, e)}
    >
      <div class="ui-sbl__lines" data-step=${step.id} ?data-plain=${!this.lineNumbers}>
        ${start > 0 ? html`<div class="ui-sbl__spacer" aria-hidden="true" style=${styleMap({ height: `${start * row}px` })}></div>` : nothing}
        ${rows}
        ${end < lines.length ? html`<div class="ui-sbl__spacer" aria-hidden="true" style=${styleMap({ height: `${(lines.length - end) * row}px` })}></div>` : nothing}
      </div>
    </div>`;
  }

  private summary() {
    const steps = this.steps;
    if (!steps.length) return "No commands yet";
    const statuses = steps.map(statusOf);
    const running = steps.findIndex((s, i) => statuses[i] === "running");
    if (running >= 0) return `Running step ${running + 1} of ${steps.length} · ${steps[running].command}`;
    const failed = statuses.filter((s) => s === "error").length;
    const known = steps.filter((s) => s.duration != null);
    const total = known.reduce((t, s) => t + (s.duration ?? 0), 0);
    const queued = statuses.filter((s) => s === "queued").length;
    return [plural(steps.length, "step"), failed ? `${failed} failed` : queued ? `${queued} queued` : "all passed", known.length ? formatMs(total) : ""].filter(Boolean).join(" · ");
  }

  protected override render() {
    const look = this.resolvedLook;
    const clean = look === "clean";
    const open = new Set(this.openIds);
    const total = this.totalHits;
    const q = this.query.trim();
    const counter = q ? (total ? `${Math.min(this.current + 1, total).toLocaleString("en-US")}/${total.toLocaleString("en-US")}${total >= MAX_HITS ? "+" : ""}` : "0/0") : "";
    const copiedAll = this.copied === "*";
    const inputId = `${this.uid}-q`;

    const steps = repeat(
      this.steps,
      (s) => s.id,
      (s, i) => {
        const status = statusOf(s);
        const isOpen = open.has(s.id);
        const bodyId = `${this.uid}-s${i}`;
        const copied = this.copied === s.id;
        const lines = this.linesOf(s.id).length;
        const exit = s.exitCode != null ? `exit ${s.exitCode}` : status === "running" ? "running" : status === "queued" ? "queued" : "";
        return html`<div class="ui-sbl__step" data-status=${status} ?data-open=${isOpen}>
          <div class="ui-sbl__head">
            <button type="button" class="ui-sbl__toggle" data-focus-key=${`head:${s.id}`} aria-expanded=${isOpen ? "true" : "false"} aria-controls=${bodyId} @click=${() => this.toggle(s.id)} @keydown=${this.onHeadKey}>
              ${keyed(status, html`<span class="ui-sbl__status">${statusIcon(status, look)}</span>`)}
              <span class="ui-sbl__main">
                <code class="ui-sbl__cmd" title=${s.command}><span class="ui-sbl__prompt" aria-hidden="true">$</span>${s.command}</code>
                ${s.label ? html`<span class="ui-sbl__label" title=${s.label}>${s.label}</span>` : nothing}
              </span>
              <span class="ui-sbl__meta">
                ${exit ? html`<span class="ui-sbl__exit">${exit}</span>` : nothing}
                ${s.duration != null ? html`<span class="ui-sbl__time">${formatMs(s.duration)}</span>` : nothing}
              </span>
              ${chevron(look)}
            </button>
            <button type="button" class="ui-sbl__copy" ?data-copied=${copied} ?disabled=${!lines} aria-label=${`Copy output of ${s.command}`} title=${copied ? "Copied" : "Copy output"} @click=${() => this.copy(s.id)}>${copyIcon(look)}${copyDone}</button>
          </div>
          <div class="ui-sbl__body" id=${bodyId} .inert=${!isOpen}>
            <div class="ui-sbl__clip"><div class="ui-sbl__pad">${this.output(s, status)}</div></div>
          </div>
        </div>`;
      },
    );

    const card = html`
      <div class="ui-sbl__top">
        <div class="ui-sbl__title-wrap">
          <span class="ui-sbl__title">${this.heading}</span>
          ${this.environment ? html`<span class="ui-sbl__env" title=${this.environment}>${this.environment}</span>` : nothing}
        </div>
        <div class="ui-sbl__tools">
          <div class="ui-sbl__search" role="search">
            ${searchIcon}
            <input
              id=${inputId}
              class="ui-sbl__input"
              type="search"
              placeholder="Search output"
              aria-label="Search output"
              autocomplete="off"
              spellcheck="false"
              .value=${live(this.query)}
              @input=${(e: Event) => this.setQuery((e.target as HTMLInputElement).value)}
              @keydown=${this.onSearchKey}
            />
            ${q
              ? html`<span class="ui-sbl__count" aria-hidden="true">${counter}</span>
                  <button type="button" class="ui-sbl__nav" aria-label="Previous match" title="Previous match (⇧↵)" ?disabled=${!total} @click=${() => void this.go(-1)}>${upIcon}</button>
                  <button type="button" class="ui-sbl__nav" aria-label="Next match" title="Next match (↵)" ?disabled=${!total} @click=${() => void this.go(1)}>${downIcon}</button>`
              : nothing}
          </div>
          <button type="button" class="ui-sbl__copy ui-sbl__copy-all" ?data-copied=${copiedAll} ?disabled=${!this.steps.length} aria-label="Copy the whole log" title=${copiedAll ? "Copied" : "Copy the whole log"} @click=${() => this.copy(null)}>${copyIcon(look)}${copyDone}</button>
        </div>
      </div>
      <div class="ui-sbl__steps" @keydown=${this.onKeyDown}>
        ${this.steps.length ? steps : html`<p class="ui-sbl__none">No commands have run yet.</p>`}
      </div>
    `;

    return html`
      <span class="ui-sbl__sr" role="status">${this.announcement}</span>
      ${clean ? card : html`<div class="ui-sbl__card">${card}</div>`}
      ${this.hideSummary ? nothing : html`<div class="ui-sbl__summary">${this.summary()}</div>`}
    `;
  }

  static override css = /* css */ `
[data-ui="sbl"] {
  /* Colours as variables – override them on [data-ui="sbl"] */
  --tc-sandbox-log-code-bg: light-dark(#fafafa, #1d1d20);
  /* One turn of the running spinner */
  --tc-sandbox-log-spin: 800ms;
  /* ANSI cyan: the library has no teal tone yet */
  --tc-sandbox-log-cyan: light-dark(#0f7b6c, #5fd4b8);
  --tc-sandbox-log-cyan-bg: light-dark(rgba(15, 123, 108, 0.1), rgba(95, 212, 184, 0.14));
  --tc-sandbox-log-hit: light-dark(rgba(245, 165, 36, 0.28), rgba(245, 165, 36, 0.3));
  --tc-sandbox-log-hit-current: light-dark(rgba(245, 165, 36, 0.62), rgba(245, 165, 36, 0.62));
  box-sizing: border-box;
  container-type: inline-size;
  min-width: 0;
  width: 100%;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  -webkit-font-smoothing: antialiased;
}
[data-ui="sbl"] *, [data-ui="sbl"] *::before, [data-ui="sbl"] *::after { box-sizing: border-box; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="sbl"] { --tc-sandbox-log-code-bg: light-dark(#fafafa, #212123); }
/* Standard: a gray tray around a white card, the summary in the tray */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="sbl"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
.ui-sbl__card {
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
/* Clean: one white card with hairline shadows */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="sbl"] {
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
.ui-sbl__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
:where([data-ui="sbl"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="sbl"] button:focus-visible, .ui-sbl__out:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-sbl__toggle:focus-visible, .ui-sbl__out:focus-visible { outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
[data-ui="sbl"] button:disabled { cursor: default; opacity: 0.45; }

/* ---------- Top row: heading, search, copy all ---------- */
.ui-sbl__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2) var(--tc-space-3);
  padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-3) var(--tc-space-4);
}
.ui-sbl__title-wrap { display: flex; align-items: baseline; gap: var(--tc-space-2); min-width: 0; }
.ui-sbl__title { color: var(--tc-text-strong); font-size: var(--tc-font-size-lg-plus); line-height: var(--tc-line-height-relaxed); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-sbl__title { font-weight: var(--tc-font-weight-semibold); letter-spacing: -0.01em; }
:where([data-look="clean"], [data-look="clean"] *).ui-sbl__title { font-weight: var(--tc-font-weight-medium); }
.ui-sbl__env { min-width: 0; overflow: hidden; color: var(--tc-text-muted); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); text-overflow: ellipsis; white-space: nowrap; }
.ui-sbl__tools { display: flex; align-items: center; gap: var(--tc-space-1-5); margin-left: auto; }
/* The search: the field recipe, one control tall */
.ui-sbl__search {
  position: relative;
  display: flex;
  align-items: center;
  width: 240px;
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-space-0-5) 0 var(--tc-space-7);
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-sbl__search:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-sbl__search:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-sbl__search-icon {
  position: absolute;
  left: var(--tc-space-2);
  width: 14px;
  height: 14px;
  fill: none;
  stroke: var(--tc-icon-muted);
  stroke-width: 1.5;
  stroke-linecap: round;
  pointer-events: none;
}
:where([data-look="clean"], [data-look="clean"] *).ui-sbl__search-icon { stroke-width: 1.3; }
.ui-sbl__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  outline: 0;
  background: none;
  color: var(--tc-text-primary);
  font: inherit;
  font-size: var(--tc-field-font-size);
}
.ui-sbl__input::placeholder { color: var(--tc-text-placeholder); }
.ui-sbl__input::-webkit-search-cancel-button { display: none; }
.ui-sbl__count { flex: none; padding: 0 var(--tc-space-1); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-sbl__nav {
  display: grid;
  place-items: center;
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: var(--tc-radius-sm);
  color: var(--tc-icon-muted);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-sbl__nav svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-sbl__nav svg { stroke-width: 1.3; }

/* Copy: a quiet icon button; the check replaces the icon for a moment */
.ui-sbl__copy {
  position: relative;
  display: grid;
  place-items: center;
  flex: none;
  width: var(--tc-control-h-sm);
  height: var(--tc-control-h-sm);
  border-radius: var(--tc-control-radius-sm);
  color: var(--tc-icon-muted);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sbl__copy-all { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); }
.ui-sbl__copy svg {
  position: absolute;
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-slow) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-sbl__copy svg { width: 16px; height: 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-sbl__copy-icon rect { fill: currentColor; stroke: none; }
.ui-sbl__copy-done { opacity: 0; transform: scale(0.6); stroke-width: 1.7; }
.ui-sbl__copy[data-copied] { color: var(--tc-accent-text); }
.ui-sbl__copy[data-copied] .ui-sbl__copy-icon { opacity: 0; transform: scale(0.6); }
.ui-sbl__copy[data-copied] .ui-sbl__copy-done { opacity: 1; transform: none; }
@media (hover: hover) {
  .ui-sbl__nav:not(:disabled):hover, .ui-sbl__copy:not(:disabled):hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
  :where([data-look="clean"], [data-look="clean"] *).ui-sbl__copy-all:not(:disabled):hover { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow-hover); }
  .ui-sbl__toggle:hover { background: var(--tc-fill-hover); }
  :where([data-look="clean"], [data-look="clean"] *).ui-sbl__toggle:hover { background: var(--tc-fill-subtle); }
  .ui-sbl__toggle:hover .ui-sbl__chevron { stroke: var(--tc-text-primary); }
}

/* ---------- Steps ---------- */
.ui-sbl__none, .ui-sbl__empty { margin: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-sbl__none { padding: var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-sbl__empty { padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-sandbox-log-code-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-sbl__step { min-width: 0; border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-sbl__head { display: flex; align-items: center; gap: var(--tc-space-1); padding-right: var(--tc-space-2); }
.ui-sbl__toggle {
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--tc-space-2-5);
  min-width: 0;
  min-height: 44px;
  padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-4);
  text-align: left;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-sbl__status { display: grid; place-items: center; flex: none; width: 16px; height: 16px; animation: ui-sbl-in var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-sbl__status > svg { width: 16px; height: 16px; fill: none; stroke-linecap: round; stroke-linejoin: round; }
.ui-sbl__spinner { animation: ui-sbl-spin var(--tc-sandbox-log-spin) linear infinite; }
[data-ui="sbl"][data-offscreen] .ui-sbl__spinner { animation-play-state: paused; }
:where([data-look="standard"], [data-look="standard"] *).ui-sbl__spinner circle { stroke: currentColor; stroke-width: 1.6; opacity: 0.22; }
:where([data-look="standard"], [data-look="standard"] *).ui-sbl__spinner path { stroke: var(--tc-text-primary); stroke-width: 1.6; }
:where([data-look="clean"], [data-look="clean"] *).ui-sbl__spinner circle { stroke: var(--tc-border-default); stroke-width: 1.6; }
:where([data-look="clean"], [data-look="clean"] *).ui-sbl__spinner path { stroke: var(--tc-accent-text); stroke-width: 1.6; }
:where([data-look="standard"], [data-look="standard"] *).ui-sbl__ok { stroke: var(--tc-status-success-fg); stroke-width: 1.8; }
:where([data-look="clean"], [data-look="clean"] *).ui-sbl__ok circle { fill: var(--tc-status-success-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-sbl__ok path { stroke: var(--tc-text-on-accent); stroke-width: 1.5; }
:where([data-look="standard"], [data-look="standard"] *).ui-sbl__err { stroke: var(--tc-status-danger-fg); stroke-width: 1.5; }
:where([data-look="clean"], [data-look="clean"] *).ui-sbl__err circle { fill: var(--tc-status-danger-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-sbl__err path { stroke: var(--tc-text-on-accent); stroke-width: 1.6; }
.ui-sbl__queued { stroke: var(--tc-icon-muted); stroke-width: 1.4; stroke-dasharray: 2.4 2.2; }
.ui-sbl__main { display: flex; align-items: baseline; gap: var(--tc-space-2); flex: 1; min-width: 0; }
.ui-sbl__cmd {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 70%;
  overflow: hidden;
  color: var(--tc-text-strong);
  font-family: var(--tc-font-mono);
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ui-sbl__prompt { margin-right: 1ch; color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); user-select: none; }
.ui-sbl__label { flex: 1 1 0; min-width: 0; overflow: hidden; color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-sbl__label { color: var(--tc-text-secondary); }
.ui-sbl__meta { display: inline-flex; align-items: center; gap: var(--tc-space-2); flex: none; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-sbl__exit { font-family: var(--tc-font-mono); }
.ui-sbl__step[data-status="error"] .ui-sbl__exit { color: var(--tc-status-danger-fg); font-weight: var(--tc-font-weight-medium); }
.ui-sbl__chevron {
  flex: none;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform var(--tc-duration-slow) var(--tc-ease-move), stroke var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-sbl__chevron { width: 14px; height: 14px; stroke: var(--tc-text-muted); stroke-width: 1.5; }
:where([data-look="clean"], [data-look="clean"] *).ui-sbl__chevron { width: 12px; height: 12px; stroke: var(--tc-icon-muted); stroke-width: 1.2; }
.ui-sbl__step[data-open] .ui-sbl__chevron { transform: rotate(180deg); }
/* Body: grows from 0fr to 1fr, so the height animates without measuring */
.ui-sbl__body {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-moderate) var(--tc-ease-standard);
}
.ui-sbl__step[data-open] > .ui-sbl__body { grid-template-rows: 1fr; opacity: 1; }
.ui-sbl__clip { min-height: 0; overflow: hidden; }
.ui-sbl__pad { padding: 0 var(--tc-space-3) var(--tc-space-3); }

/* ---------- Output: a terminal in the theme's colours ---------- */
.ui-sbl__out {
  overflow: auto;
  /* The spacers change height as the window moves: anchoring would chase them down the log */
  overflow-anchor: none;
  overscroll-behavior: contain;
  padding: var(--tc-space-2) 0;
  border-radius: var(--tc-radius-md);
  background: var(--tc-sandbox-log-code-bg);
  box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default);
  color: var(--tc-text-primary);
  font-family: var(--tc-font-mono);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-normal);
  tab-size: 4;
}
.ui-sbl__lines { width: max-content; min-width: 100%; }
/* Fixed-height rows that never wrap: windowing places them by index */
.ui-sbl__line { display: flex; height: var(--tc-line-height-normal); white-space: pre; }
.ui-sbl__line[data-current] { background: var(--tc-fill-default); }
.ui-sbl__ln {
  position: sticky;
  left: 0;
  flex: none;
  width: calc(var(--digits) + 2 * var(--tc-space-3));
  padding: 0 var(--tc-space-3);
  background: var(--tc-sandbox-log-code-bg);
  color: var(--tc-text-muted);
  text-align: right;
  user-select: none;
}
.ui-sbl__line[data-current] .ui-sbl__ln { color: var(--tc-text-secondary); }
.ui-sbl__txt { padding: 0 var(--tc-space-3) 0 var(--tc-space-1); }
.ui-sbl__lines[data-plain] .ui-sbl__txt { padding-left: var(--tc-space-3); }
.ui-sbl__fg-black, .ui-sbl__fg-white { color: var(--tc-text-strong); }
.ui-sbl__fg-gray { color: var(--tc-text-muted); }
.ui-sbl__fg-red { color: var(--tc-status-danger-fg); }
.ui-sbl__fg-green { color: var(--tc-status-success-fg); }
.ui-sbl__fg-yellow { color: var(--tc-status-warning-fg); }
.ui-sbl__fg-blue { color: var(--tc-accent-text); }
.ui-sbl__fg-magenta { color: var(--tc-tone-violet-fg); }
.ui-sbl__fg-cyan { color: var(--tc-sandbox-log-cyan); }
.ui-sbl__bg-black, .ui-sbl__bg-white, .ui-sbl__bg-gray, .ui-sbl__inv { background: var(--tc-fill-strong); }
.ui-sbl__bg-red { background: var(--tc-status-danger-bg); }
.ui-sbl__bg-green { background: var(--tc-status-success-bg); }
.ui-sbl__bg-yellow { background: var(--tc-status-warning-bg); }
.ui-sbl__bg-blue { background: var(--tc-status-info-bg); }
.ui-sbl__bg-magenta { background: var(--tc-tone-violet-bg); }
.ui-sbl__bg-cyan { background: var(--tc-sandbox-log-cyan-bg); }
.ui-sbl__b { font-weight: var(--tc-font-weight-semibold); }
.ui-sbl__i { font-style: italic; }
.ui-sbl__u { text-decoration: underline; text-underline-offset: 2px; }
.ui-sbl__hit { border-radius: var(--tc-radius-2xs); background: var(--tc-sandbox-log-hit); color: inherit; }
.ui-sbl__hit[data-current] { background: var(--tc-sandbox-log-hit-current); box-shadow: 0 0 0 1px var(--tc-status-warning-fg); }

/* ---------- Summary: in the tray (Standard), the card's last row (Clean) ---------- */
.ui-sbl__summary { overflow: hidden; color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; text-overflow: ellipsis; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-sbl__summary { padding: var(--tc-space-2-5) var(--tc-space-2) var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-sbl__summary { padding: var(--tc-space-2) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-text-muted); }

@keyframes ui-sbl-spin { to { transform: rotate(360deg); } }
@keyframes ui-sbl-in { from { opacity: 0; transform: scale(0.6); } }
/* Narrow: the search takes its own row; then the label gives way, then the time */
@container (max-width: 480px) {
  .ui-sbl__tools { width: 100%; }
  .ui-sbl__search { flex: 1; width: auto; }
}
@container (max-width: 400px) {
  .ui-sbl__label { display: none; }
  .ui-sbl__cmd { max-width: none; }
  .ui-sbl__toggle { gap: var(--tc-space-2); padding-left: var(--tc-space-3); }
  .ui-sbl__top { padding-left: var(--tc-space-3); }
  .ui-sbl__pad { padding: 0 var(--tc-space-2) var(--tc-space-2); }
}
@container (max-width: 340px) {
  .ui-sbl__time { display: none; }
}
/* Touch screens: bigger tap targets */
@media (pointer: coarse) {
  .ui-sbl__toggle { min-height: 52px; }
  .ui-sbl__copy, .ui-sbl__nav { width: 40px; height: 40px; }
  .ui-sbl__search { height: 40px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="sbl"] *, [data-ui="sbl"] *::before, [data-ui="sbl"] *::after {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
}
@media (forced-colors: active) {
  .ui-sbl__hit { forced-color-adjust: none; background: Mark; color: MarkText; }
  .ui-sbl__hit[data-current] { background: Highlight; color: HighlightText; }
}
`;
}

if (!customElements.get("tc-sandbox-log")) customElements.define("tc-sandbox-log", TcSandboxLog);

declare global {
  interface HTMLElementTagNameMap {
    "tc-sandbox-log": TcSandboxLog;
  }
}
