import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { styleMap } from "lit/directives/style-map.js";
import { parseOutput, type AnsiLine, type AnsiParsed } from "./internal/ansi";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { RowWindowController } from "./internal/controllers";
import { copyText } from "./internal/util";

/*
 * <tc-terminal> – a command line for a panel: output in colour above a prompt. Press Enter and it fires tc-command; the
 * page runs the command and passes a longer `output`, so any shell, sandbox or socket can sit behind it. It keeps a
 * history for ↑ and ↓, stays at the end of the output until the reader scrolls up, and renders only the rows near the
 * view when the output is long. Ctrl+C fires tc-interrupt and Ctrl+L fires tc-clear.
 * It's a line-based terminal, not an emulator: colours, carriage returns and progress bars work, but cursor movement
 * doesn't, so full-screen programs such as vim won't draw.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-terminal prompt="~/project $" .output=${text}></tc-terminal>
 *
 * Output text is never parsed as HTML: escape sequences become token-coloured spans, everything else is text.
 */

export type TerminalCommand = { command: string };
export type TerminalValueChange = { value: string };
export type TerminalCopy = { text: string };

/* After Lucide: terminal, copy, eraser (ISC licence) */
const terminalIcon = svg`<path d="m4 17 6-6-6-6"></path><path d="M12 19h8"></path>`;
const copyIcon = html`<svg viewBox="0 0 24 24" aria-hidden="true">${svg`<rect x="8" y="8" width="14" height="14" rx="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`}</svg>`;
const clearIcon = html`<svg viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"></path><path d="M22 21H7"></path><path d="m5 11 9 9"></path>`}</svg>`;

/** Output with more lines than this renders only the ones near the view */
const WINDOW_FROM = 200;
const OVERSCAN = 40;
/** --tc-line-height-normal, the row height before the first row is measured */
const ROW = 20;
const MAX_HISTORY = 200;

// The classes parseOutput gives styled text: `ui-trm__fg-${colour}`, `ui-trm__bg-${colour}`, ui-trm__b, ui-trm__i, ui-trm__u, ui-trm__inv
let instances = 0;

/**
 * A command line for a panel: output in colour above a prompt with history; the page runs the commands.
 * @tag tc-terminal
 * @fires tc-command - Enter was pressed on a command ({ command }: TerminalCommand); cancelable – prevented, the command stays in the prompt
 * @fires tc-value-change - The text in the prompt changed ({ value }: TerminalValueChange); cancelable – prevented, `value` stays as it was
 * @fires tc-interrupt - Ctrl+C or Stop while a command runs (detail: null)
 * @fires tc-clear - Ctrl+L or Clear was pressed (detail: null); the page empties `output`
 * @fires tc-copy - The output was copied ({ text }: TerminalCopy)
 */
export class TcTerminal extends TcElement {
  static override ui = "trm";

  /** The heading; empty leaves the header out */
  @property() accessor heading = "Terminal";
  /** Small text under the heading – the machine or working directory */
  @property() accessor description = "";
  /** Everything printed so far, with ANSI escape codes; pass a longer string as it streams */
  @property() accessor output = "";
  /** What stands before the command */
  @property() accessor prompt = "$";
  /** The text in the prompt. Changed by typing unless a tc-value-change listener calls preventDefault() */
  @property() accessor value = "";
  /** Earlier commands, oldest first, for ↑ and ↓; commands entered here are added to it */
  @property({ attribute: false }) accessor history: string[] = [];
  /** A command is running: Enter waits, and Stop and Ctrl+C fire tc-interrupt */
  @property({ type: Boolean, reflect: true }) accessor running = false;
  /** The prompt can't be used: for a closed session, or output to read only */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  /** Hides what's typed, for a password prompt, and keeps it out of the history */
  @property({ type: Boolean, reflect: true }) accessor masked = false;
  /** Height of the output in px */
  @property({ type: Number }) accessor height = 280;
  /** Names the prompt for screen readers */
  @property({ attribute: "input-label" }) accessor inputLabel = "Command";
  /** Names the Stop button */
  @property({ attribute: "stop-label" }) accessor stopLabel = "Stop";

  @state() private accessor announcement = "";

  private readonly uid = `tc-trm${++instances}`;
  private parsed: AnsiParsed = parseOutput("", "ui-trm");
  private win = new RowWindowController(this, {
    count: () => this.parsed.lines.length,
    body: () => this.querySelector<HTMLElement>(".ui-trm__lines"),
    rowSelector: ".ui-trm__line",
    from: WINDOW_FROM,
    overscan: OVERSCAN,
    rowHeight: ROW,
  });
  private stuck = true;
  /** Where ↑ and ↓ are in the history; null when on the text being written */
  private historyAt: number | null = null;
  private draft = "";
  private own: string[] = [];

  private get commands() {
    return [...this.history, ...this.own].slice(-MAX_HISTORY);
  }

  /** The output's lines as plain text */
  get text() {
    return this.parsed.lines.map((l) => l.text).join("\n");
  }

  /** Puts the cursor in the prompt */
  override focus() {
    this.querySelector<HTMLInputElement>(".ui-trm__input")?.focus();
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.parsed = parseOutput(this.output, "ui-trm", this.parsed);
    // A window that follows the end moves there when new output lands past it. Only then: revealing on every update
    // fights the window's own measure, which places it a little differently, and the two would re-render every frame
    const last = this.parsed.lines.length - 1;
    if (this.stuck && this.win.virtual && changed.has("output") && (last < this.win.start || last >= this.win.end)) this.win.reveal(last);
    this.win.compute();
    if (changed.has("running") && changed.get("running") === true && !this.running) this.announcement = "Command finished";
    else if (changed.has("running") && this.running) this.announcement = "Command running";
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    const out = this.querySelector<HTMLElement>(".ui-trm__out");
    if (out && this.stuck) out.scrollTop = out.scrollHeight;
  }

  private setValue(value: string) {
    if (value === this.value) return;
    if (this.emit<TerminalValueChange>("tc-value-change", { value }, { cancelable: true })) this.value = value;
    else this.requestUpdate();
  }

  private run() {
    if (this.running || this.disabled) return;
    const command = this.value;
    if (!this.emit<TerminalCommand>("tc-command", { command }, { cancelable: true })) return;
    if (command.trim() && !this.masked && this.commands.at(-1) !== command) this.own = [...this.own, command].slice(-MAX_HISTORY);
    this.historyAt = null;
    this.draft = "";
    this.stuck = true;
    this.setValue("");
  }

  private walk(delta: -1 | 1) {
    const list = this.commands;
    if (!list.length) return;
    if (this.historyAt === null) {
      if (delta > 0) return;
      this.draft = this.value;
      this.historyAt = list.length - 1;
    } else {
      const next = this.historyAt + delta;
      if (next < 0) return;
      this.historyAt = next >= list.length ? null : next;
    }
    this.setValue(this.historyAt === null ? this.draft : list[this.historyAt]);
    void this.updateComplete.then(() => {
      const input = this.querySelector<HTMLInputElement>(".ui-trm__input");
      input?.setSelectionRange(input.value.length, input.value.length);
    });
  }

  private onKey = (e: KeyboardEvent) => {
    const input = e.target as HTMLInputElement;
    // Enter and the arrows belong to an input method while it's composing (Japanese, Chinese…)
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === "Enter") {
      e.preventDefault();
      this.run();
    } else if (e.key === "ArrowUp" && !this.masked) {
      e.preventDefault();
      this.walk(-1);
    } else if (e.key === "ArrowDown" && !this.masked) {
      e.preventDefault();
      this.walk(1);
    } else if (e.ctrlKey && !e.altKey && !e.metaKey && e.key.toLowerCase() === "c" && input.selectionStart === input.selectionEnd) {
      // With text selected, Ctrl+C copies, as everywhere else
      e.preventDefault();
      if (this.running) this.emit("tc-interrupt", null);
      else this.setValue("");
    } else if (e.ctrlKey && !e.altKey && !e.metaKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      this.emit("tc-clear", null);
    }
  };

  private onScroll = (e: Event) => {
    const out = e.currentTarget as HTMLElement;
    this.stuck = out.scrollTop + out.clientHeight >= out.scrollHeight - 4;
  };

  /** A click in the output goes to the prompt, unless it was to select text */
  private onOutputClick = () => {
    if (!this.disabled && !window.getSelection()?.toString()) this.focus();
  };

  /** Clear empties the output, which disables the button: focus goes to the prompt (or the output) first, not to <body> */
  private clear() {
    const input = this.querySelector<HTMLInputElement>(".ui-trm__input");
    if (input && !input.disabled) input.focus();
    else this.querySelector<HTMLElement>(".ui-trm__out")?.focus();
    this.emit("tc-clear", null);
  }

  private copy() {
    const text = this.text;
    void copyText(text).then((ok) => {
      if (!ok || !this.isConnected) return;
      this.announcement = "Copied";
      this.emit<TerminalCopy>("tc-copy", { text });
    });
  }

  private line(line: AnsiLine): TemplateResult {
    const runs = line.runs;
    return html`<div class="ui-trm__line">${runs ? runs.map(([cls, text]) => (cls ? html`<span class=${cls}>${text}</span>` : text)) : line.text}</div>`;
  }

  private rows() {
    const lines = this.parsed.lines;
    const { start, end } = this.win;
    const row = this.win.rowHeight;
    const shown: TemplateResult[] = [];
    for (let n = start; n < end; n++) shown.push(this.line(lines[n]));
    return html`${start > 0 ? html`<div aria-hidden="true" style=${styleMap({ height: `${start * row}px` })}></div>` : nothing}${shown}${end < lines.length ? html`<div aria-hidden="true" style=${styleMap({ height: `${(lines.length - end) * row}px` })}></div>` : nothing}`;
  }

  protected override render() {
    const title = `${this.uid}-title`;
    const tools = html`<div class="ui-trm__tools">
      <button type="button" class="ui-trm__tool" title="Copy the output" aria-label="Copy the output" ?disabled=${!this.output} @click=${() => this.copy()}>${copyIcon}</button>
      <button type="button" class="ui-trm__tool" title="Clear" aria-label="Clear" ?disabled=${!this.output} @click=${() => this.clear()}>${clearIcon}</button>
    </div>`;
    return html`${this.heading ? cardHead({ icon: terminalIcon, title: this.heading, subtitle: this.description, id: title, aside: tools }) : nothing}
      <div class="ui-trm__card">
        ${this.heading ? nothing : html`<div class="ui-trm__bar">${tools}</div>`}
        <div class="ui-trm__out" role="log" tabindex="0" aria-label=${this.heading || "Terminal"} style=${styleMap({ height: `${this.height}px` })} @scroll=${this.onScroll} @click=${this.onOutputClick}>
          <div class="ui-trm__lines">${this.rows()}</div>
        </div>
        <div class="ui-trm__prompt" ?data-running=${this.running}>
          <span class="ui-trm__sign" aria-hidden="true">${this.prompt}</span>
          <input
            class="ui-trm__input"
            type=${this.masked ? "password" : "text"}
            aria-label=${this.inputLabel}
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            ?disabled=${this.disabled}
            ?readonly=${this.running}
            .value=${live(this.value)}
            @input=${(e: Event) => this.setValue((e.target as HTMLInputElement).value)}
            @keydown=${this.onKey}
          />
          ${this.running ? html`<button type="button" class="ui-trm__stop" @click=${() => this.emit("tc-interrupt", null)}><span class="ui-trm__dot" aria-hidden="true"></span>${this.stopLabel}</button>` : nothing}
        </div>
      </div>
      <span class="ui-trm__sr" role="status">${this.announcement}</span>`;
  }

  static override css = /* css */ `
[data-ui="trm"] {
  /* The output's background – override it on [data-ui="trm"] */
  --tc-terminal-bg: light-dark(#fafafa, #1d1d20);
  /* ANSI cyan: the teal tone */
  --tc-terminal-cyan: var(--tc-tone-teal-fg);
  --tc-terminal-cyan-bg: var(--tc-tone-teal-bg);
  /* One pulse of the Stop button's dot */
  --tc-terminal-pulse: 1200ms;
  box-sizing: border-box;
  display: block;
  min-width: 0;
  width: 100%;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  -webkit-font-smoothing: antialiased;
}
[data-ui="trm"] *, [data-ui="trm"] *::before, [data-ui="trm"] *::after { box-sizing: border-box; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="trm"] { --tc-terminal-bg: light-dark(#fafafa, #212123); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="trm"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="trm"] .ui-trm__card {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="trm"] {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
.ui-trm__card { overflow: hidden; }
:where([data-ui="trm"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
[data-ui="trm"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="trm"] button:disabled { cursor: default; opacity: 0.45; }
.ui-trm__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

.ui-trm__bar { display: flex; justify-content: flex-end; padding: var(--tc-space-1); }
.ui-trm__tools { display: flex; gap: var(--tc-space-0-5); }
.ui-trm__tool {
  display: grid;
  place-items: center;
  width: var(--tc-control-h-sm);
  height: var(--tc-control-h-sm);
  border-radius: var(--tc-control-radius-sm);
  color: var(--tc-icon-muted);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-trm__tool:hover:not(:disabled) { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-trm__tool svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

.ui-trm__out {
  overflow: auto;
  /* The spacers change height as the window moves: anchoring would chase them down the output */
  overflow-anchor: none;
  overscroll-behavior: contain;
  padding: var(--tc-space-2) var(--tc-space-3);
  background: var(--tc-terminal-bg);
  font-family: var(--tc-font-mono);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-normal);
  tab-size: 4;
}
.ui-trm__out:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-trm__lines { width: max-content; min-width: 100%; }
/* Fixed-height rows that never wrap: windowing places them by index */
.ui-trm__line { min-height: var(--tc-line-height-normal); height: var(--tc-line-height-normal); white-space: pre; }

.ui-trm__prompt {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  min-height: var(--tc-control-h-md);
  padding: var(--tc-space-1) var(--tc-space-1) var(--tc-space-1) var(--tc-space-3);
  border-top: var(--tc-hairline) solid var(--tc-border-default);
  font-family: var(--tc-font-mono);
  font-size: var(--tc-font-size-sm);
}
.ui-trm__prompt:focus-within { box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring-color); }
.ui-trm__sign { flex: none; max-width: 50%; overflow: hidden; color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-trm__input {
  flex: 1;
  min-width: 0;
  height: var(--tc-control-h-sm);
  margin: 0;
  padding: 0;
  border: 0;
  outline: 0;
  background: none;
  color: var(--tc-text-primary);
  font: inherit;
}
.ui-trm__prompt[data-running] .ui-trm__input { color: var(--tc-text-muted); }
.ui-trm__input:disabled { cursor: not-allowed; color: var(--tc-text-muted); }
.ui-trm__stop {
  display: inline-flex;
  align-items: center;
  flex: none;
  gap: var(--tc-space-1-5);
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-space-2);
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-sm);
}
.ui-trm__dot { width: var(--tc-space-1-5); height: var(--tc-space-1-5); border-radius: var(--tc-radius-full); background: var(--tc-status-success-fg); animation: ui-trm-pulse var(--tc-terminal-pulse) var(--tc-ease-standard) infinite; }
@keyframes ui-trm-pulse { 50% { opacity: 0.35; } }

/* ANSI colours in the theme's tokens */
.ui-trm__fg-black, .ui-trm__fg-white { color: var(--tc-text-strong); }
.ui-trm__fg-gray { color: var(--tc-text-muted); }
.ui-trm__fg-red { color: var(--tc-status-danger-fg); }
.ui-trm__fg-green { color: var(--tc-status-success-fg); }
.ui-trm__fg-yellow { color: var(--tc-status-warning-fg); }
.ui-trm__fg-blue { color: var(--tc-accent-text); }
.ui-trm__fg-magenta { color: var(--tc-tone-violet-fg); }
.ui-trm__fg-cyan { color: var(--tc-terminal-cyan); }
.ui-trm__bg-black, .ui-trm__bg-white, .ui-trm__bg-gray, .ui-trm__inv { background: var(--tc-fill-strong); }
.ui-trm__bg-red { background: var(--tc-status-danger-bg); }
.ui-trm__bg-green { background: var(--tc-status-success-bg); }
.ui-trm__bg-yellow { background: var(--tc-status-warning-bg); }
.ui-trm__bg-blue { background: var(--tc-status-info-bg); }
.ui-trm__bg-magenta { background: var(--tc-tone-violet-bg); }
.ui-trm__bg-cyan { background: var(--tc-terminal-cyan-bg); }
.ui-trm__b { font-weight: var(--tc-font-weight-semibold); }
.ui-trm__i { font-style: italic; }
.ui-trm__u { text-decoration: underline; text-underline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  [data-ui="trm"] *, [data-ui="trm"] *::before, [data-ui="trm"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-terminal")) customElements.define("tc-terminal", TcTerminal);
declare global {
  interface HTMLElementTagNameMap {
    "tc-terminal": TcTerminal;
  }
}
