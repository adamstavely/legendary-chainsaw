import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-console-panel> – a web page's browser console: errors, warnings, info, logs and debug lines, newest last. Each
 * row has a mark for its level (a shape and a word, not only a colour), the message in monospace, how many times it
 * repeated, and where it came from. Level chips with counts and a text filter narrow the list; Clear empties it. An
 * error or warning with a stack folds open to show it. Nothing here reads a real console: the page passes `entries`.
 *   · the list is one tab stop, a tree: ↑ / ↓ move, → opens a stack or goes into it, ← closes it or goes back to its
 *     message, Enter or Space folds a stack
 *   · narrow, a row's source drops under its message
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-console-panel .entries=${[{ id: "1", level: "error", message: "Uncaught TypeError: x is undefined", source: "app.js:42" }]}>
 *   </tc-console-panel>
 */

export type ConsoleLevel = "error" | "warn" | "info" | "log" | "debug";
export type ConsoleEntry = {
  /** Stable identity */
  id: string;
  level: ConsoleLevel;
  message: string;
  /** Where it came from, such as "app.js:42" */
  source?: string;
  /** When, in epoch ms */
  time?: number;
  /** How many times it repeated in a row; 2 or more shows a badge */
  count?: number;
  /** Stack frames, innermost first, such as "at loadGrants (app.js:42:13)" */
  stack?: string[];
};
export type ConsoleLevelsChange = { levels: ConsoleLevel[]; level: ConsoleLevel };
export type ConsoleFilterChange = { filter: string };
export type ConsoleExpandedChange = { expanded: string[]; id: string };
export type ConsolePanelLabels = Record<ConsoleLevel, string> &
  Record<"levels" | "filter" | "clear" | "empty" | "noMatches" | "message" | "messages" | "stack" | "times", string>;
export const defaultConsolePanelLabels: ConsolePanelLabels = {
  error: "Errors",
  warn: "Warnings",
  info: "Info",
  log: "Logs",
  debug: "Debug",
  levels: "Levels",
  filter: "Filter messages",
  clear: "Clear console",
  empty: "No messages",
  noMatches: "No messages match",
  message: "message",
  messages: "messages",
  stack: "Stack trace",
  times: "times",
};
/** The word read before a message, one per level */
const LEVEL_WORD: Record<ConsoleLevel, string> = { error: "Error", warn: "Warning", info: "Info", log: "Log", debug: "Debug" };
export const consoleLevels: ConsoleLevel[] = ["error", "warn", "info", "log", "debug"];

type Row =
  | { kind: "entry"; key: string; entry: ConsoleEntry; open: boolean; pos: number; size: number }
  | { kind: "frame"; key: string; entry: ConsoleEntry; text: string; pos: number; size: number };

/* After Lucide: circle-x, triangle-alert, info, chevron-right, code, ban, square-chevron-right (ISC licence) */
const MARK: Record<ConsoleLevel, string[]> = {
  error: ["M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20", "m15 9-6 6", "m9 9 6 6"],
  warn: ["m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3", "M12 9v4", "M12 17h.01"],
  info: ["M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20", "M12 16v-4", "M12 8h.01"],
  log: ["m9 18 6-6-6-6"],
  debug: ["m16 18 6-6-6-6", "m8 6-6 6 6 6"],
};
const CLEAR = ["M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20", "m4.9 4.9 14.2 14.2"];
const glyph = (paths: string[], cls: string) => html`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true">${paths.map((d) => svg`<path d=${d}></path>`)}</svg>`;
const headIcon = svg`<rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="m8 15 3-3-3-3"></path><path d="M13 15h3"></path>`;

/**
 * A web page's browser console: level chips with counts, a text filter, repeat badges, sources, and stacks that fold open.
 * @tag tc-console-panel
 * @fires tc-levels-change - A level chip was toggled ({ levels, level }: ConsoleLevelsChange); cancelable – prevented, `levels` stays as it was
 * @fires tc-filter-change - The text filter changed ({ filter }: ConsoleFilterChange); cancelable – prevented, `filter` stays as it was
 * @fires tc-expanded-change - A stack was opened or closed ({ expanded, id }: ConsoleExpandedChange); cancelable – prevented, `expanded` stays as it was
 * @fires tc-clear - Clear was pressed (detail: null); cancelable – prevented, `entries` stay; otherwise the element empties them
 */
export class TcConsolePanel extends TcElement {
  static override ui = "dcon";

  /** The heading; empty leaves the header out */
  @property() accessor heading = "Console";
  /** Small text under the heading – the page or tab it belongs to */
  @property() accessor description = "";
  /** The messages, oldest first */
  @property({ attribute: false }) accessor entries: ConsoleEntry[] = [];
  /** The levels that show */
  @property({ attribute: false }) accessor levels: ConsoleLevel[] = [...consoleLevels];
  /** The text filter: matches the message and source */
  @property() accessor filter = "";
  /** The ids of the entries whose stack is open */
  @property({ attribute: false }) accessor expanded: string[] = [];
  /** Height in px at which the list scrolls */
  @property({ type: Number, attribute: "max-height" }) accessor maxHeight = 360;
  /** Locale for times */
  @property() accessor locale: string | undefined = undefined;
  /** Renames the words it uses */
  @property({ attribute: false }) accessor labels: Partial<ConsolePanelLabels> = {};

  /** The key of the row that holds the tab stop */
  @state() private accessor active: string | null = null;
  /** The level chip that holds the tab stop */
  @state() private accessor chip: ConsoleLevel = "error";

  private rows: Row[] = [];
  private timeFormat?: Intl.DateTimeFormat;
  private timeLocale?: string;

  private get words() {
    return { ...defaultConsolePanelLabels, ...this.labels };
  }
  private counts() {
    const c: Record<ConsoleLevel, number> = { error: 0, warn: 0, info: 0, log: 0, debug: 0 };
    for (const e of this.entries) c[e.level] += Math.max(1, e.count ?? 1);
    return c;
  }
  private get shown() {
    const q = this.filter.trim().toLowerCase();
    return this.entries.filter((e) => this.levels.includes(e.level) && (!q || e.message.toLowerCase().includes(q) || !!e.source?.toLowerCase().includes(q)));
  }

  private build(): Row[] {
    const rows: Row[] = [];
    const shown = this.shown;
    shown.forEach((entry, i) => {
      const open = !!entry.stack?.length && this.expanded.includes(entry.id);
      rows.push({ kind: "entry", key: `e\u001f${entry.id}`, entry, open, pos: i + 1, size: shown.length });
      if (open) entry.stack!.forEach((text, j) => rows.push({ kind: "frame", key: `s\u001f${entry.id}\u001f${j}`, entry, text, pos: j + 1, size: entry.stack!.length }));
    });
    return rows;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.rows = this.build();
    if (!this.rows.some((r) => r.key === this.active)) this.active = this.rows[0]?.key ?? null;
  }

  private time(ms: number) {
    if (!this.timeFormat || this.timeLocale !== this.locale) {
      this.timeLocale = this.locale;
      this.timeFormat = new Intl.DateTimeFormat(this.locale, { hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3, hourCycle: "h23" });
    }
    return this.timeFormat.format(ms);
  }

  private toggleStack(entry: ConsoleEntry) {
    if (!entry.stack?.length) return;
    const open = this.expanded.includes(entry.id);
    const expanded = open ? this.expanded.filter((id) => id !== entry.id) : [...this.expanded, entry.id];
    if (this.emit<ConsoleExpandedChange>("tc-expanded-change", { expanded, id: entry.id }, { cancelable: true })) this.expanded = expanded;
  }

  private toggleLevel(level: ConsoleLevel) {
    const levels = this.levels.includes(level) ? this.levels.filter((l) => l !== level) : consoleLevels.filter((l) => l === level || this.levels.includes(l));
    if (this.emit<ConsoleLevelsChange>("tc-levels-change", { levels, level }, { cancelable: true })) this.levels = levels;
  }

  private setFilter(filter: string) {
    if (filter === this.filter) return;
    if (this.emit<ConsoleFilterChange>("tc-filter-change", { filter }, { cancelable: true })) this.filter = filter;
    else this.requestUpdate();
  }

  private clear() {
    if (this.emit("tc-clear", null, { cancelable: true })) {
      this.entries = [];
      this.expanded = [];
    }
  }

  private async focusRow(key: string) {
    this.active = key;
    await this.updateComplete;
    this.querySelector<HTMLElement>(`.ui-dcon__row[data-key="${CSS.escape(key)}"]`)?.focus();
  }

  private onListKey = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const rows = this.rows;
    const i = rows.findIndex((r) => r.key === this.active);
    const r = rows[i];
    if (!r) return;
    let to: string | undefined;
    switch (e.key) {
      case "ArrowDown":
        to = rows[i + 1]?.key;
        break;
      case "ArrowUp":
        to = rows[i - 1]?.key;
        break;
      case "Home":
        to = rows[0].key;
        break;
      case "End":
        to = rows[rows.length - 1].key;
        break;
      case "ArrowRight":
        if (r.kind === "entry" && r.entry.stack?.length) {
          if (!r.open) this.toggleStack(r.entry);
          else to = rows[i + 1]?.key;
        }
        break;
      case "ArrowLeft":
        if (r.kind === "frame") to = `e\u001f${r.entry.id}`;
        else if (r.open) this.toggleStack(r.entry);
        break;
      case "Enter":
      case " ":
        if (r.kind === "entry") this.toggleStack(r.entry);
        break;
      default:
        return;
    }
    e.preventDefault();
    if (to) void this.focusRow(to);
  };

  private onChipsKey = (e: KeyboardEvent) => {
    const i = consoleLevels.indexOf(this.chip);
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: consoleLevels.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    this.chip = consoleLevels[(to + consoleLevels.length) % consoleLevels.length];
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-dcon__chip[data-level="${this.chip}"]`)?.focus());
  };

  private row(r: Row): TemplateResult {
    const words = this.words;
    if (r.kind === "frame")
      return html`<div class="ui-dcon__row ui-dcon__frame" role="treeitem" data-key=${r.key} data-level=${r.entry.level} aria-level="2" aria-setsize=${r.size} aria-posinset=${r.pos} tabindex=${r.key === this.active ? 0 : -1}>
        <span class="ui-dcon__frame-text">${r.text}</span>
      </div>`;
    const e = r.entry;
    const stack = !!e.stack?.length;
    const n = e.count ?? 1;
    return html`<div
      class="ui-dcon__row ui-dcon__entry"
      role="treeitem"
      data-key=${r.key}
      data-level=${e.level}
      aria-level="1"
      aria-setsize=${r.size}
      aria-posinset=${r.pos}
      aria-expanded=${ifDefined(stack ? (r.open ? "true" : "false") : undefined)}
      tabindex=${r.key === this.active ? 0 : -1}
      @click=${() => {
        this.active = r.key;
        this.toggleStack(e);
      }}
    >
      ${stack ? html`<svg class="ui-dcon__chevron" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="m9 18 6-6-6-6"></path>`}</svg>` : html`<span class="ui-dcon__chevron" aria-hidden="true"></span>`}
      ${glyph(MARK[e.level], "ui-dcon__mark")}
      <span class="ui-dcon__main">
        ${e.time !== undefined ? html`<span class="ui-dcon__time">${this.time(e.time)}</span>` : nothing}
        <span class="ui-dcon__message"><span class="ui-dcon__sr">${LEVEL_WORD[e.level]}: </span>${e.message}</span>
        ${n > 1 ? html`<span class="ui-dcon__count">${n}<span class="ui-dcon__sr"> ${words.times}</span></span>` : nothing}
        ${e.source ? html`<span class="ui-dcon__source">${e.source}</span>` : nothing}
      </span>
    </div>`;
  }

  private toolbar() {
    const words = this.words;
    const c = this.counts();
    return html`<div class="ui-dcon__toolbar">
      <div class="ui-dcon__chips" role="group" aria-label=${words.levels} @keydown=${this.onChipsKey}>
        ${consoleLevels.map(
          (l) => html`<button type="button" class="ui-dcon__chip" data-level=${l} aria-pressed=${this.levels.includes(l) ? "true" : "false"} tabindex=${l === this.chip ? 0 : -1} @click=${() => {
            this.chip = l;
            this.toggleLevel(l);
          }}>
            ${glyph(MARK[l], "ui-dcon__chip-mark")}<span>${words[l]}</span> <span class="ui-dcon__chip-count">${c[l]}</span>
          </button>`,
        )}
      </div>
      <label class="ui-dcon__field">
        <svg class="ui-dcon__glass" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M11 3a8 8 0 1 0 0 16a8 8 0 1 0 0-16"></path><path d="m21 21-4.3-4.3"></path>`}</svg>
        <input class="ui-dcon__input" type="search" aria-label=${words.filter} placeholder=${words.filter} autocomplete="off" spellcheck="false" .value=${live(this.filter)} @input=${(e: Event) => this.setFilter((e.target as HTMLInputElement).value)} @keydown=${(e: KeyboardEvent) => {
          if (e.key === "Escape" && this.filter) {
            e.preventDefault();
            this.setFilter("");
          }
        }} />
      </label>
      <button type="button" class="ui-dcon__clear" title=${words.clear} aria-label=${words.clear} ?disabled=${!this.entries.length} @click=${() => this.clear()}>${glyph(CLEAR, "ui-dcon__clear-glyph")}</button>
    </div>`;
  }

  private body() {
    const words = this.words;
    if (!this.rows.length) return html`<p class="ui-dcon__empty">${this.entries.length ? words.noMatches : words.empty}</p>`;
    return html`<div class="ui-dcon__scroll" style=${styleMap({ maxHeight: `${this.maxHeight}px` })}>
      <div class="ui-dcon__rows" role="tree" aria-label=${this.heading || words.messages} @keydown=${this.onListKey}>${this.rows.map((r) => this.row(r))}</div>
    </div>`;
  }

  protected override render() {
    const words = this.words;
    const c = this.counts();
    const aside = html`<span class="ui-dcon__summary">
      ${(["error", "warn"] as const).map((l) => html`<span class="ui-dcon__total" data-level=${l}>${glyph(MARK[l], "ui-dcon__total-mark")}${c[l]}<span class="ui-dcon__sr"> ${words[l]}</span></span>`)}
    </span>`;
    const n = this.shown.length;
    return html`${this.heading ? cardHead({ icon: headIcon, title: this.heading, subtitle: this.description, aside }) : nothing}
      <div class="ui-dcon__card">${this.toolbar()}${this.body()}</div>
      <span class="ui-dcon__sr" role="status">${n} ${n === 1 ? words.message : words.messages}</span>`;
  }

  static override css = /* css */ `
[data-ui="dcon"] {
  box-sizing: border-box;
  display: block;
  min-width: 0;
  width: 100%;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  -webkit-font-smoothing: antialiased;
  container-type: inline-size;
  --tc-dcon-indent: var(--tc-space-8);
  --tc-dcon-mark-nudge: 3px;
}
[data-ui="dcon"] *, [data-ui="dcon"] *::before, [data-ui="dcon"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="dcon"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="dcon"] .ui-dcon__card {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="dcon"] {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
.ui-dcon__card { overflow: hidden; }
.ui-dcon__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-dcon__summary { display: flex; align-items: center; gap: var(--tc-space-2); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-dcon__total { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); }
.ui-dcon__mark, .ui-dcon__total-mark, .ui-dcon__chip-mark, .ui-dcon__clear-glyph, .ui-dcon__chevron { flex: none; width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-dcon__chip-mark, .ui-dcon__total-mark { width: 12px; height: 12px; }
[data-level="error"] > .ui-dcon__mark, [data-level="error"] > .ui-dcon__total-mark, [data-level="error"] > .ui-dcon__chip-mark { color: var(--tc-status-danger-fg); }
[data-level="warn"] > .ui-dcon__mark, [data-level="warn"] > .ui-dcon__total-mark, [data-level="warn"] > .ui-dcon__chip-mark { color: var(--tc-status-warning-fg); }
[data-level="info"] > .ui-dcon__mark, [data-level="info"] > .ui-dcon__chip-mark { color: var(--tc-status-info-fg); }
[data-level="log"] > .ui-dcon__mark, [data-level="debug"] > .ui-dcon__mark, [data-level="log"] > .ui-dcon__chip-mark, [data-level="debug"] > .ui-dcon__chip-mark { color: var(--tc-icon-muted); }
.ui-dcon__toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-1); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-dcon__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-dcon__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1);
  height: var(--tc-control-h-sm);
  margin: 0;
  padding: 0 var(--tc-space-2);
  border: var(--tc-hairline) solid var(--tc-border-default);
  border-radius: var(--tc-pill-radius);
  background: none;
  color: var(--tc-text-secondary);
  font: inherit;
  font-size: var(--tc-font-size-sm);
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-dcon__chip:hover { background: var(--tc-fill-subtle); }
.ui-dcon__chip[aria-pressed="true"] { border-color: var(--tc-border-selected); background: var(--tc-fill-selected); color: var(--tc-text-primary); }
.ui-dcon__chip-count { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-dcon__chip:focus-visible, .ui-dcon__clear:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-dcon__field {
  display: flex;
  flex: 1 1 140px;
  align-items: center;
  gap: var(--tc-space-1-5);
  min-width: 0;
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-space-2);
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-dcon__field:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-dcon__field:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-dcon__glass { flex: none; width: 14px; height: 14px; fill: none; stroke: var(--tc-icon-muted); stroke-width: 2; stroke-linecap: round; }
.ui-dcon__input { flex: 1; min-width: 0; height: 100%; margin: 0; padding: 0; border: 0; outline: 0; background: none; color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); }
.ui-dcon__input::placeholder { color: var(--tc-text-placeholder); }
.ui-dcon__input::-webkit-search-cancel-button { display: none; }
.ui-dcon__clear {
  display: grid;
  flex: none;
  place-items: center;
  width: var(--tc-control-h-sm);
  height: var(--tc-control-h-sm);
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  background: none;
  color: var(--tc-icon-muted);
  cursor: pointer;
}
.ui-dcon__clear:hover:not(:disabled) { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-dcon__clear:disabled { color: var(--tc-text-disabled); cursor: default; }
.ui-dcon__scroll { overflow: auto; overscroll-behavior: contain; }
.ui-dcon__row { display: flex; align-items: flex-start; gap: var(--tc-space-1-5); min-height: var(--tc-control-h-sm); padding: var(--tc-space-1) var(--tc-space-2); border-bottom: var(--tc-hairline) solid var(--tc-divider); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); }
.ui-dcon__row:last-child { border-bottom: 0; }
.ui-dcon__row:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-dcon__entry[aria-expanded] { cursor: pointer; }
.ui-dcon__entry[data-level="error"], .ui-dcon__frame[data-level="error"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-dcon__entry[data-level="warn"], .ui-dcon__frame[data-level="warn"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-dcon__entry[data-level="debug"] { color: var(--tc-text-secondary); }
.ui-dcon__entry[data-level="log"]:hover, .ui-dcon__entry[data-level="info"]:hover, .ui-dcon__entry[data-level="debug"]:hover { background: var(--tc-fill-subtle); }
.ui-dcon__entry > .ui-dcon__mark, .ui-dcon__entry > .ui-dcon__chevron { margin-top: var(--tc-dcon-mark-nudge); }
.ui-dcon__chevron { stroke: var(--tc-icon-muted); transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-dcon__entry[aria-expanded="true"] > .ui-dcon__chevron { transform: rotate(90deg); }
.ui-dcon__main { display: flex; flex: 1; flex-wrap: wrap; align-items: baseline; gap: 0 var(--tc-space-2); min-width: 0; }
.ui-dcon__time { flex: none; color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-dcon__message { flex: 1 1 0; min-width: 0; overflow-wrap: anywhere; white-space: pre-wrap; }
.ui-dcon__count {
  flex: none;
  min-width: var(--tc-pill-h);
  height: var(--tc-pill-h);
  padding: 0 var(--tc-pill-px);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-fill-strong);
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-pill-font-weight);
  line-height: var(--tc-pill-h);
  text-align: center;
}
.ui-dcon__source { flex: none; margin-left: auto; color: var(--tc-text-secondary); text-decoration: underline; text-decoration-color: var(--tc-border-default); text-underline-offset: 2px; }
.ui-dcon__frame { padding-left: var(--tc-dcon-indent); }
.ui-dcon__frame-text { min-width: 0; overflow-wrap: anywhere; }
.ui-dcon__empty { margin: 0; padding: var(--tc-space-6) var(--tc-space-3); color: var(--tc-text-muted); text-align: center; }
@container (max-width: 420px) {
  .ui-dcon__source { flex-basis: 100%; margin-left: 0; }
  .ui-dcon__time { display: none; }
  .ui-dcon__chip > span:not(.ui-dcon__chip-count) { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="dcon"] *, [data-ui="dcon"] *::before, [data-ui="dcon"] *::after { transition: none !important; }
}
@media (forced-colors: active) {
  .ui-dcon__mark, .ui-dcon__total-mark, .ui-dcon__chip-mark { color: CanvasText; }
  .ui-dcon__chip[aria-pressed="true"] { border-color: Highlight; }
}
`;
}

if (!customElements.get("tc-console-panel")) customElements.define("tc-console-panel", TcConsolePanel);
declare global {
  interface HTMLElementTagNameMap {
    "tc-console-panel": TcConsolePanel;
  }
}
