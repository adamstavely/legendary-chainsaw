import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";
import "./tool-call-card";

/*
 * <tc-test-run-panel> – try an agent while you edit it. A compact panel beside an agent's settings: a badge says which
 * version answers ("Testing draft v14", or the live one), the conversation runs in a log – the agent's replies with
 * the tools it called folded into one row each (tc-tool-call-card) – and every finished reply can be saved as a test
 * case with the message that asked for it. Test inputs (the user's plan, a region…) sit in a Variables strip and go
 * with every message; Reset starts the conversation over.
 *   · the page answers: Send fires a cancelable tc-send ({ text, variables }) and the page appends the turns – the
 *     person's and then the agent's, streamed – to `turns`; `streaming` marks the log busy and holds Send back
 *   · Enter sends, Shift+Enter starts a new line
 * Standard: the header and badge on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-test-run-panel version="v14" .turns=${turns} @tc-send=${ask}></tc-test-run-panel>
 */

export type TestRunToolCall = {
  id: string;
  /** The tool's name – shown in mono */
  name: string;
  status?: "running" | "success" | "error";
  /** A short line on what it did */
  summary?: string;
  args?: unknown;
  result?: unknown;
  error?: string;
  /** How long it took, in ms */
  duration?: number;
};

export type TestRunTurn = {
  id: string;
  /** Who said it: the person testing, or the agent */
  role: "user" | "agent";
  text: string;
  /** The tools the agent called for this reply, in order */
  tools?: TestRunToolCall[];
  /** The reply is still arriving */
  streaming?: boolean;
  /** The reply failed – said under it */
  error?: string;
};

export type TestRunVariable = { key: string; value: string };
export type TestRunTarget = "draft" | "live";

export type TestRunSend = { text: string; variables: TestRunVariable[] };
export type TestRunSaveCase = {
  /** The agent's reply being saved */
  turn: TestRunTurn;
  /** The message that asked for it – the case's input */
  input: string;
  /** The variables it ran with */
  variables: TestRunVariable[];
};
export type TestRunVariablesChange = { variables: TestRunVariable[] };
export type TestRunTurnsChange = { turns: TestRunTurn[] };

export type TestRunPanelLabels = {
  draft: string;
  live: string;
  empty: string;
  placeholder: string;
  send: string;
  waiting: string;
  reset: string;
  variables: string;
  addVariable: string;
  key: string;
  value: string;
  remove: string;
  save: string;
  saved: string;
  you: string;
  agent: string;
};

export const defaultTestRunPanelLabels: TestRunPanelLabels = {
  draft: "Testing draft",
  live: "Testing live",
  empty: "Send a message to try the agent. Nothing here reaches real users.",
  placeholder: "Message the agent…",
  send: "Send",
  waiting: "Waiting for the reply",
  reset: "Reset conversation",
  variables: "Variables",
  addVariable: "Add variable",
  key: "Name",
  value: "Value",
  remove: "Remove",
  save: "Save as test case",
  saved: "Saved as a test case",
  you: "You",
  agent: "Agent",
};

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
const glyph = (d: TemplateResult, cls = "ui-trp__glyph") => html`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
/** Flask: trying something out */
const flaskMark = svg`<path d="M10 2v7.5L4.5 19a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 9.5V2"></path><path d="M8.5 2h7"></path><path d="M7 16h10"></path>`;
const sendIcon = glyph(svg`<path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path>`);
const resetIcon = glyph(svg`<path d="M3 12a9 9 0 1 0 3-6.7L3 8"></path><path d="M3 3v5h5"></path>`);
const plusIcon = glyph(svg`<path d="M12 5v14"></path><path d="M5 12h14"></path>`);
const xIcon = glyph(svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);
const bookmarkIcon = glyph(svg`<path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>`);
const checkIcon = glyph(svg`<path d="M5 12.5l4.5 4.5L19 7.5"></path>`);
const chevron = glyph(svg`<path d="M9 6l6 6-6 6"></path>`, "ui-trp__chev");

let instances = 0;

/**
 * Try an agent while editing it: a test conversation with its tool calls, test variables, Reset, and Save as test case.
 * @tag tc-test-run-panel
 * @fires tc-send - Send was pressed with text ({ text, variables }: TestRunSend); cancelable – prevented, the text stays in the field
 * @fires tc-turns-change - Reset cleared the conversation ({ turns }: TestRunTurnsChange); cancelable – prevented, the turns stay
 * @fires tc-variables-change - A variable was added, edited or removed ({ variables }: TestRunVariablesChange); cancelable
 * @fires tc-save-case - "Save as test case" on a reply ({ turn, input, variables }: TestRunSaveCase); cancelable – prevented, the reply isn't marked saved
 */
export class TcTestRunPanel extends TcElement {
  static override ui = "trp";

  /** The heading */
  @property() accessor heading = "Test";
  /** The agent's name, shown under the heading */
  @property() accessor agent = "";
  /** Which version answers: the draft being edited, or the live one */
  @property() accessor target: TestRunTarget = "draft";
  /** The version's label – "v14" – shown in the badge */
  @property() accessor version = "";
  /** The conversation so far, oldest first. The page appends to it */
  @property({ attribute: false }) accessor turns: TestRunTurn[] = [];
  /** Test inputs sent with every message. Changed by the user unless a tc-variables-change listener prevents it */
  @property({ attribute: false }) accessor variables: TestRunVariable[] = [];
  /** Ids of the replies already saved as test cases */
  @property({ attribute: false }) accessor saved: string[] = [];
  /** The agent is answering: the log is busy and Send waits */
  @property({ type: Boolean, reflect: true }) accessor streaming = false;
  /** Hides the Variables strip */
  @property({ type: Boolean, attribute: "hide-variables" }) accessor hideVariables = false;
  /** Words the page can rename, merged over defaultTestRunPanelLabels */
  @property({ attribute: false }) accessor labels: Partial<TestRunPanelLabels> = {};

  /** @internal The message being written */
  @state() accessor draft = "";
  /** @internal The Variables strip is open */
  @state() accessor varsOpen = false;
  /** @internal What the status region says */
  @state() accessor spoken = "";

  private readonly uid = `tc-trp${++instances}`;
  private wasStreaming = false;

  constructor() {
    super();
    // Reset and Save swap for other controls; focus never drops to <body>
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-trp__field"));
  }

  /** @internal */
  get words(): TestRunPanelLabels {
    return { ...defaultTestRunPanelLabels, ...this.labels };
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const replying = this.streaming || this.turns.some((t) => t.streaming);
    // A reply finished: said once, with its first words
    if (this.wasStreaming && !replying) {
      const last = [...this.turns].reverse().find((t) => t.role === "agent");
      if (last) this.spoken = last.error ? `The reply failed: ${last.error}` : `${this.words.agent} replied`;
    }
    this.wasStreaming = replying;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    // New turns arrive at the bottom: keep the latest in view unless the person scrolled up to read
    if (changed.has("turns")) {
      const log = this.querySelector<HTMLElement>(".ui-trp__log");
      if (log && log.scrollHeight - log.scrollTop - log.clientHeight < 120) log.scrollTop = log.scrollHeight;
    }
  }

  /** @internal Any reply still arriving */
  private get busy() {
    return this.streaming || this.turns.some((t) => t.streaming);
  }

  /** @internal */
  private send() {
    const text = this.draft.trim();
    const field = this.querySelector<HTMLTextAreaElement>(".ui-trp__field");
    if (!text) {
      field?.focus();
      return;
    }
    if (this.busy) {
      this.spoken = this.words.waiting;
      return;
    }
    if (!this.emit<TestRunSend>("tc-send", { text, variables: this.variables.map((v) => ({ ...v })) }, { cancelable: true })) return;
    this.draft = "";
    field?.focus();
  }

  /** @internal */
  private onFieldKey(e: KeyboardEvent) {
    if (e.key !== "Enter" || e.shiftKey || e.isComposing) return;
    e.preventDefault();
    this.send();
  }

  /** @internal */
  private reset() {
    if (!this.turns.length) return;
    if (!this.emit<TestRunTurnsChange>("tc-turns-change", { turns: [] }, { cancelable: true })) return;
    this.turns = [];
    this.saved = [];
    this.spoken = "Conversation reset";
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-trp__field")?.focus());
  }

  /** @internal Applies a variables edit unless a listener prevents it */
  private setVariables(variables: TestRunVariable[]) {
    if (this.emit<TestRunVariablesChange>("tc-variables-change", { variables }, { cancelable: true })) this.variables = variables;
  }

  /** @internal */
  private addVariable() {
    this.setVariables([...this.variables, { key: "", value: "" }]);
    this.varsOpen = true;
    const at = this.variables.length - 1;
    void this.updateComplete.then(() => this.querySelector<HTMLInputElement>(`#${this.uid}-key-${at}`)?.focus());
  }

  /** @internal */
  private removeVariable(i: number) {
    const name = this.variables[i]?.key;
    this.setVariables(this.variables.filter((_, j) => j !== i));
    this.spoken = name ? `Removed ${name}` : "Variable removed";
    void this.updateComplete.then(() => {
      const next = this.querySelectorAll<HTMLElement>(".ui-trp__var-remove")[Math.min(i, this.variables.length - 1)];
      (next ?? this.querySelector<HTMLElement>(".ui-trp__var-add"))?.focus();
    });
  }

  /** @internal The person's message before this reply */
  private inputFor(turn: TestRunTurn) {
    const at = this.turns.indexOf(turn);
    for (let i = at - 1; i >= 0; i--) if (this.turns[i].role === "user") return this.turns[i].text;
    return "";
  }

  /** @internal */
  private saveCase(turn: TestRunTurn) {
    if (this.saved.includes(turn.id)) return;
    const detail: TestRunSaveCase = { turn, input: this.inputFor(turn), variables: this.variables.map((v) => ({ ...v })) };
    if (!this.emit<TestRunSaveCase>("tc-save-case", detail, { cancelable: true })) return;
    this.saved = [...this.saved, turn.id];
    this.spoken = this.words.saved;
  }

  /** @internal One turn of the conversation */
  private turn(t: TestRunTurn) {
    const w = this.words;
    const agent = t.role === "agent";
    const saved = this.saved.includes(t.id);
    const canSave = agent && !t.streaming && !t.error && !!t.text && !!this.inputFor(t);
    return html`<li class="ui-trp__turn" data-role=${t.role} aria-busy=${ifDefined(t.streaming ? "true" : undefined)}>
      <span class="ui-trp__who">${agent ? w.agent : w.you}</span>
      ${agent && t.tools?.length
        ? html`<div class="ui-trp__tools">
            ${t.tools.map(
              (c) => html`<tc-tool-call-card
                look=${this.resolvedLook}
                name=${c.name}
                status=${c.status ?? "success"}
                .summary=${c.summary}
                .args=${c.args}
                .result=${c.result}
                .error=${c.error}
                .duration=${c.duration}
              ></tc-tool-call-card>`,
            )}
          </div>`
        : nothing}
      ${t.text || !agent ? html`<div class="ui-trp__text">${t.text}${t.streaming ? html`<span class="ui-trp__caret" aria-hidden="true"></span>` : nothing}</div>` : nothing}
      ${t.streaming && !t.text ? html`<div class="ui-trp__text ui-trp__thinking">Thinking…</div>` : nothing}
      ${t.error ? html`<p class="ui-trp__error">${t.error}</p>` : nothing}
      ${canSave
        ? saved
          ? html`<span class="ui-trp__saved">${checkIcon}${w.saved}</span>`
          : html`<button type="button" class="ui-trp__save" @click=${() => this.saveCase(t)}>${bookmarkIcon}${w.save}</button>`
        : nothing}
    </li>`;
  }

  /** @internal The Variables strip: a disclosure with a row per variable */
  private varsStrip() {
    const w = this.words;
    const id = `${this.uid}-vars`;
    const filled = this.variables.filter((v) => v.key);
    return html`<div class="ui-trp__vars">
      <div class="ui-trp__vars-head">
        <button type="button" class="ui-trp__vars-toggle" aria-expanded=${this.varsOpen ? "true" : "false"} aria-controls=${id} @click=${() => (this.varsOpen = !this.varsOpen)}>
          ${chevron}${w.variables}<span class="ui-trp__count">${this.variables.length}</span>
        </button>
        ${!this.varsOpen && filled.length
          ? html`<span class="ui-trp__vars-peek" aria-hidden="true">${filled.map((v) => html`<code class="ui-trp__chip">${`${v.key}=${v.value}`}</code>`)}</span>`
          : nothing}
      </div>
      <div class="ui-trp__vars-body" id=${id} ?hidden=${!this.varsOpen}>
        ${this.variables.length
          ? html`<ul class="ui-trp__var-list" aria-label=${w.variables}>
              ${this.variables.map(
                (v, i) => html`<li class="ui-trp__var">
                  <label class="tc-sr-only" for=${`${this.uid}-key-${i}`}>${w.key} ${i + 1}</label>
                  <input
                    class="ui-trp__input ui-trp__var-key"
                    id=${`${this.uid}-key-${i}`}
                    spellcheck="false"
                    autocomplete="off"
                    placeholder=${w.key}
                    .value=${live(v.key)}
                    @input=${(e: InputEvent) => this.setVariables(this.variables.map((x, j) => (j === i ? { ...x, key: (e.target as HTMLInputElement).value } : x)))}
                  />
                  <label class="tc-sr-only" for=${`${this.uid}-val-${i}`}>${w.value} of ${v.key || `${w.key} ${i + 1}`}</label>
                  <input
                    class="ui-trp__input"
                    id=${`${this.uid}-val-${i}`}
                    autocomplete="off"
                    placeholder=${w.value}
                    .value=${live(v.value)}
                    @input=${(e: InputEvent) => this.setVariables(this.variables.map((x, j) => (j === i ? { ...x, value: (e.target as HTMLInputElement).value } : x)))}
                  />
                  <button type="button" class="ui-trp__icon-btn ui-trp__var-remove" @click=${() => this.removeVariable(i)}>
                    ${xIcon}<span class="tc-sr-only">${w.remove} ${v.key || `${w.key} ${i + 1}`}</span>
                  </button>
                </li>`,
              )}
            </ul>`
          : nothing}
        <button type="button" class="ui-trp__link ui-trp__var-add" @click=${() => this.addVariable()}>${plusIcon}${w.addVariable}</button>
      </div>
    </div>`;
  }

  protected override render() {
    const w = this.words;
    const titleId = `${this.uid}-title`;
    const busy = this.busy;
    const empty = !this.draft.trim();
    const blocked = busy || empty;
    const badge = `${this.target === "live" ? w.live : w.draft}${this.version ? ` ${this.version}` : ""}`;
    return html`
      ${cardHead({
        icon: flaskMark,
        title: this.heading,
        subtitle: this.agent || undefined,
        id: titleId,
        aside: html`<span class="ui-trp__badge" data-target=${this.target}>${badge}</span>`,
      })}
      <div class="ui-trp__card" role="group" aria-labelledby=${titleId}>
        ${this.hideVariables ? nothing : this.varsStrip()}
        <div class="ui-trp__log" role="log" aria-label="Test conversation" aria-busy=${busy ? "true" : "false"} tabindex="0">
          ${this.turns.length ? html`<ol class="ui-trp__list">${repeat(this.turns, (t) => t.id, (t) => this.turn(t))}</ol>` : html`<p class="ui-trp__empty">${w.empty}</p>`}
        </div>
        <div class="ui-trp__compose">
          <label class="tc-sr-only" for=${`${this.uid}-field`}>${w.placeholder.replace(/…$/, "")}</label>
          <textarea
            class="ui-trp__field"
            id=${`${this.uid}-field`}
            rows="1"
            placeholder=${w.placeholder}
            .value=${live(this.draft)}
            @input=${(e: InputEvent) => (this.draft = (e.target as HTMLTextAreaElement).value)}
            @keydown=${(e: KeyboardEvent) => this.onFieldKey(e)}
          ></textarea>
          <div class="ui-trp__actions">
            <button type="button" class="ui-trp__link ui-trp__reset" ?disabled=${!this.turns.length} @click=${() => this.reset()}>${resetIcon}${w.reset}</button>
            <span class="tc-sr-only" id=${`${this.uid}-why`}>${busy ? w.waiting : ""}</span>
            <button
              type="button"
              class="ui-trp__send"
              aria-disabled=${blocked ? "true" : "false"}
              aria-describedby=${`${this.uid}-why`}
              @click=${() => this.send()}
            >${w.send}${sendIcon}</button>
          </div>
        </div>
      </div>
      <span class="tc-sr-only" role="status">${this.spoken}</span>
    `;
  }

  static override css = /* css */ `
[data-ui="trp"] {
  --tc-trp-log-h: 320px;
  position: relative;
  box-sizing: border-box;
  display: block;
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
  container: ui-trp / inline-size;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="trp"] { padding: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
[data-ui="trp"] *, [data-ui="trp"] *::before, [data-ui="trp"] *::after { box-sizing: border-box; }
[data-ui="trp"] :is(ol, ul, p) { margin: 0; padding: 0; }
:where([data-ui="trp"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="trp"] :is(button, .ui-trp__log):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="trp"] button:disabled { cursor: default; color: var(--tc-text-disabled); }
.ui-trp__glyph { width: 14px; height: 14px; flex: none; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-trp__glyph { stroke-width: 1.6; }
/* ----- The badge: which version answers ----- */
.ui-trp__badge { flex: none; display: inline-flex; align-items: center; height: 20px; padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-badge); background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); white-space: nowrap; }
.ui-trp__badge[data-target="live"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
/* ----- The card ----- */
.ui-trp__card { display: flex; flex-direction: column; overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-trp__card { border-top: var(--tc-hairline) solid var(--tc-divider); border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); background: none; box-shadow: none; }
/* ----- Variables ----- */
.ui-trp__vars { padding: var(--tc-space-2) var(--tc-space-3); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-trp__vars-head { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-trp__vars-toggle { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-control-h-sm); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-trp__chev { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-trp__vars-toggle[aria-expanded="true"] .ui-trp__chev { transform: rotate(90deg); }
.ui-trp__count { margin-left: var(--tc-space-1); color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); font-variant-numeric: tabular-nums; }
.ui-trp__vars-peek { display: flex; gap: var(--tc-space-1); min-width: 0; overflow: hidden; }
.ui-trp__chip { flex: none; padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-sm); background: var(--tc-surface-well); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-trp__vars-body { display: grid; gap: var(--tc-space-2); padding-top: var(--tc-space-2); }
.ui-trp__vars-body[hidden] { display: none; }
.ui-trp__var-list { display: grid; gap: var(--tc-space-1-5); list-style: none; }
.ui-trp__var { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 3fr) auto; gap: var(--tc-space-1-5); align-items: center; }
.ui-trp__input { width: 100%; min-width: 0; height: var(--tc-control-h-sm); padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); outline: none; }
.ui-trp__input:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-trp__input:focus { box-shadow: var(--tc-field-shadow-focus); }
.ui-trp__input::placeholder, .ui-trp__field::placeholder { color: var(--tc-text-placeholder); }
.ui-trp__var-key { font-family: var(--tc-font-mono); }
.ui-trp__icon-btn { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-text-muted); }
[data-ui="trp"] .ui-trp__icon-btn:hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-trp__link { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-control-h-sm); justify-self: start; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-accent-text); }
[data-ui="trp"] .ui-trp__link:hover:not(:disabled) { text-decoration: underline; text-underline-offset: 2px; }
/* ----- The conversation ----- */
.ui-trp__log { display: flex; flex-direction: column; height: var(--tc-trp-log-h); padding: var(--tc-space-3); overflow-y: auto; overscroll-behavior: contain; }
.ui-trp__list { display: flex; flex-direction: column; gap: var(--tc-space-3); list-style: none; }
.ui-trp__empty { margin: auto; max-width: 260px; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); text-align: center; }
.ui-trp__turn { display: grid; gap: var(--tc-space-1); max-width: 92%; }
.ui-trp__turn[data-role="user"] { align-self: flex-end; justify-items: end; }
.ui-trp__who { font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); }
.ui-trp__text { padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-surface-well); color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-relaxed); white-space: pre-wrap; overflow-wrap: anywhere; }
.ui-trp__turn[data-role="user"] .ui-trp__text { background: var(--tc-fill-selected); }
.ui-trp__thinking { color: var(--tc-text-muted); }
.ui-trp__caret { display: inline-block; width: 6px; height: 1em; margin-left: var(--tc-space-0-5); vertical-align: text-bottom; background: currentColor; animation: ui-trp-blink var(--tc-duration-slowest) steps(2) 6; }
@keyframes ui-trp-blink { to { opacity: 0; } }
.ui-trp__tools { display: grid; gap: var(--tc-space-1); min-width: min(320px, 80cqi); }
.ui-trp__error { font-size: var(--tc-font-size-sm); color: var(--tc-status-danger-fg); }
.ui-trp__save, .ui-trp__saved { display: inline-flex; align-items: center; gap: var(--tc-space-1); justify-self: start; min-height: var(--tc-control-h-sm); font-size: var(--tc-font-size-sm); }
.ui-trp__save { color: var(--tc-text-muted); }
[data-ui="trp"] .ui-trp__save:hover { color: var(--tc-text-primary); }
.ui-trp__saved { color: var(--tc-status-success-fg); }
/* ----- Composer ----- */
.ui-trp__compose { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-trp__field { display: block; width: 100%; min-height: var(--tc-control-h-md); max-height: 160px; padding: var(--tc-space-2) var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); resize: none; outline: none; field-sizing: content; }
.ui-trp__field:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-trp__field:focus { box-shadow: var(--tc-field-shadow-focus); }
.ui-trp__actions { display: flex; align-items: center; gap: var(--tc-space-2); }
.ui-trp__reset { color: var(--tc-text-secondary); }
.ui-trp__send { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); margin-left: auto; padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="trp"] .ui-trp__send:hover { background: var(--tc-action-primary-bg-hover); }
[data-ui="trp"] .ui-trp__send[aria-disabled="true"] { cursor: not-allowed; background: var(--tc-fill-default); box-shadow: none; color: var(--tc-text-muted); }
@container ui-trp (max-width: 360px) {
  .ui-trp__turn { max-width: 100%; }
  .ui-trp__reset { font-size: var(--tc-font-size-xs); }
}
@media (forced-colors: active) {
  .ui-trp__badge, .ui-trp__text { border: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="trp"] *, [data-ui="trp"] *::before, [data-ui="trp"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-test-run-panel")) customElements.define("tc-test-run-panel", TcTestRunPanel);

declare global {
  interface HTMLElementTagNameMap {
    "tc-test-run-panel": TcTestRunPanel;
  }
}
