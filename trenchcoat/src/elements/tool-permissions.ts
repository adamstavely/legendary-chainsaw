import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { FocusRescueController } from "./internal/controllers";

/*
 * <tc-tool-permissions> – which agent may use which tools, set up ahead of time: a matrix of tools and their scopes
 * (rows, grouped by tool) against agents (columns), each cell Allow, Ask or Deny. Presets set the common setups in one
 * go; a summary lists what you changed since the last save, with Reset and Save. Permission-request asks at run time;
 * this is the setup behind it.
 *   · the matrix is a WAI-ARIA grid: arrows move between cells, Home / End to the row's ends, ⌘/Ctrl+Home / End to
 *     the first and last cell; Space or Enter steps the cell through its choices (Shift backwards), 1 / 2 / 3 pick
 *     Allow / Ask / Deny, Delete puts back the saved choice; Tab leaves the grid
 *   · each cell is a small segmented control – click a choice to pick it; a scope can rule choices out (a destructive
 *     one is never Allow)
 *   · presets are a radiogroup; the one that matches the matrix is checked, none when it's custom
 * Standard: a white card on a gray tray, Reset and Save on the tray. Clean: one white card, the buttons in its last row.
 *
 *   <tc-tool-permissions .agents=${agents} .tools=${tools} .value=${value}></tc-tool-permissions>
 */

export type ToolPermissionLevel = "allow" | "ask" | "deny";
export type ToolPermissionRisk = "safe" | "risky" | "destructive";

export type ToolPermissionScope = {
  id: string;
  label: string;
  /** One quiet line under the label, e.g. "Merge, push, force-push" */
  description?: string;
  /** Drives the built-in presets; "destructive" also rules out Allow unless `levels` says otherwise */
  risk?: ToolPermissionRisk;
  /** The choices this scope offers – default all three, or Ask and Deny for a destructive scope */
  levels?: ToolPermissionLevel[];
};
export type ToolPermissionTool = { id: string; name: string; /** The tool's mark (cloned) */ icon?: Element; scopes: ToolPermissionScope[] };
export type ToolPermissionAgent = { id: string; name: string; model?: string; /** An avatar or logo (cloned); unset shows initials */ avatar?: Element };
/** agent id → "tool id/scope id" → level; a missing cell is `defaultLevel` */
export type ToolPermissionMatrix = Record<string, Record<string, ToolPermissionLevel>>;
export type ToolPermissionPreset = {
  id: string;
  label: string;
  /** What it means, read as the radio's description */
  description?: string;
  /** The level for one cell */
  level: (scope: ToolPermissionScope, tool: ToolPermissionTool, agent: ToolPermissionAgent) => ToolPermissionLevel;
};
export type ToolPermissionChange = { agent: string; tool: string; scope: string; from: ToolPermissionLevel; to: ToolPermissionLevel };

/** Details of the events */
export type ToolPermissionCause = { type: "cell"; agent: string; tool: string; scope: string; level: ToolPermissionLevel } | { type: "preset"; preset: string } | { type: "reset" };
export type ToolPermissionValueChange = { value: ToolPermissionMatrix; changes: ToolPermissionChange[]; cause: ToolPermissionCause };
export type ToolPermissionSave = { value: ToolPermissionMatrix; changes: ToolPermissionChange[] };

const LEVELS: ToolPermissionLevel[] = ["allow", "ask", "deny"];
const LEVEL_LABEL: Record<ToolPermissionLevel, string> = { allow: "Allow", ask: "Ask", deny: "Deny" };
/** Stricter first: a level a scope doesn't offer falls to the next stricter one it does */
const STRICTER: Record<ToolPermissionLevel, ToolPermissionLevel[]> = { allow: ["allow", "ask", "deny"], ask: ["ask", "deny", "allow"], deny: ["deny", "ask", "allow"] };

/** The presets used when the page gives none: they read each scope's risk */
export const defaultToolPermissionPresets: ToolPermissionPreset[] = [
  { id: "read-only", label: "Read only", description: "Safe scopes allowed, everything else denied", level: (s) => ((s.risk ?? "safe") === "safe" ? "allow" : "deny") },
  { id: "ask-first", label: "Ask first", description: "Safe scopes allowed, the rest ask every time", level: (s) => ((s.risk ?? "safe") === "safe" ? "allow" : "ask") },
  { id: "trusted", label: "Trusted", description: "Only destructive scopes ask", level: (s) => (s.risk === "destructive" ? "ask" : "allow") },
  { id: "locked", label: "Locked", description: "Every scope asks", level: () => "ask" },
];

const keyOf = (tool: string, scope: string) => `${tool}/${scope}`;
const offered = (s: ToolPermissionScope) => s.levels?.length ? LEVELS.filter((l) => s.levels!.includes(l)) : s.risk === "destructive" ? (["ask", "deny"] as ToolPermissionLevel[]) : LEVELS;
const fit = (s: ToolPermissionScope, level: ToolPermissionLevel) => {
  const ok = offered(s);
  return STRICTER[level].find((l) => ok.includes(l)) ?? level;
};
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
const clone = (node: Element | undefined) => node?.cloneNode(true);
const isMac = () => {
  const p = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform;
  return /mac|iphone|ipad|ipod/i.test(p || navigator.userAgent);
};
let uidCount = 0;

/* Allow, ask and deny – check, circle-help and ban: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const ICON: Record<ToolPermissionLevel, () => ReturnType<typeof lucide>> = {
  allow: () => lucide(14, svg`<path d="M20 6 9 17l-5-5"></path>`),
  ask: () => lucide(14, svg`<circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path>`),
  deny: () => lucide(14, svg`<circle cx="12" cy="12" r="10"></circle><path d="m4.9 4.9 14.2 14.2"></path>`),
};

type Row = { tool: ToolPermissionTool; scope: ToolPermissionScope };

/**
 * A matrix of which agent may use which tools and scopes – Allow, Ask or Deny per cell – with presets and a summary of
 * what changed.
 * @tag tc-tool-permissions
 * @fires tc-value-change - A cell, a preset or Reset changed the matrix ({ value, changes, cause }: ToolPermissionValueChange); cancelable
 * @fires tc-save - Save was pressed ({ value, changes }: ToolPermissionSave); cancelable – unless prevented, `saved` becomes the value
 */
export class TcToolPermissions extends TcElement {
  static override ui = "tperm";

  /** The heading, and the grid's name */
  @property() accessor heading = "Tool permissions";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The columns */
  @property({ attribute: false }) accessor agents: ToolPermissionAgent[] = [];
  /** The rows: each tool's scopes, grouped under the tool */
  @property({ attribute: false }) accessor tools: ToolPermissionTool[] = [];
  /** The matrix. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property({ attribute: false }) accessor value: ToolPermissionMatrix = {};
  /** What was last saved – the summary lists the differences. Unset: the value the element first showed */
  @property({ attribute: false }) accessor saved: ToolPermissionMatrix | undefined = undefined;
  /** A cell missing from the value */
  @property({ attribute: "default-level" }) accessor defaultLevel: ToolPermissionLevel = "ask";
  /** One-click setups; [] hides the row */
  @property({ attribute: false }) accessor presets: ToolPermissionPreset[] = defaultToolPermissionPresets;
  /** Changes listed before "N more" */
  @property({ type: Number, attribute: "changes-limit" }) accessor changesLimit = 4;
  @property({ attribute: "save-label" }) accessor saveLabel = "Save";
  @property({ attribute: "reset-label" }) accessor resetLabel = "Reset";

  @state() private accessor active = { r: 0, c: 0 };
  @state() private accessor open = false;
  @state() private accessor announce = "";

  private uid = `tc-tperm-${++uidCount}`;
  /** The value the element first showed, when the page gives no `saved` */
  private firstValue: ToolPermissionMatrix | undefined = undefined;

  constructor() {
    super();
    // Focus never drops to <body> when the button it was on goes away (Reset and Save hide with nothing to save)
    new FocusRescueController(this, () => this.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]'));
  }

  /* ---------- The model ---------- */

  private get rows(): Row[] {
    return this.tools.flatMap((tool) => tool.scopes.map((scope) => ({ tool, scope })));
  }
  private get baseline() {
    return this.saved ?? this.firstValue ?? {};
  }
  private levelIn(m: ToolPermissionMatrix, agent: string, row: Row) {
    return fit(row.scope, m[agent]?.[keyOf(row.tool.id, row.scope.id)] ?? this.defaultLevel);
  }
  /** Every cell that differs from the baseline, in grid order */
  private changesOf(m: ToolPermissionMatrix): ToolPermissionChange[] {
    const base = this.baseline;
    const out: ToolPermissionChange[] = [];
    for (const row of this.rows)
      for (const a of this.agents) {
        const from = this.levelIn(base, a.id, row);
        const to = this.levelIn(m, a.id, row);
        if (from !== to) out.push({ agent: a.id, tool: row.tool.id, scope: row.scope.id, from, to });
      }
    return out;
  }
  private with(m: ToolPermissionMatrix, agent: string, row: Row, level: ToolPermissionLevel): ToolPermissionMatrix {
    return { ...m, [agent]: { ...(m[agent] ?? {}), [keyOf(row.tool.id, row.scope.id)]: level } };
  }
  private presetValue(p: ToolPermissionPreset): ToolPermissionMatrix {
    const out: ToolPermissionMatrix = {};
    for (const a of this.agents) {
      out[a.id] = {};
      for (const row of this.rows) out[a.id][keyOf(row.tool.id, row.scope.id)] = fit(row.scope, p.level(row.scope, row.tool, a));
    }
    return out;
  }
  private get matchedPreset() {
    return this.presets.find((p) => {
      const m = this.presetValue(p);
      return this.agents.every((a) => this.rows.every((row) => this.levelIn(m, a.id, row) === this.levelIn(this.value, a.id, row)));
    });
  }

  private commit(next: ToolPermissionMatrix, cause: ToolPermissionCause, say: string) {
    const changes = this.changesOf(next);
    if (!this.emit<ToolPermissionValueChange>("tc-value-change", { value: next, changes, cause }, { cancelable: true })) return;
    this.value = next;
    this.announce = say;
  }

  private setCell(r: number, c: number, level: ToolPermissionLevel) {
    const row = this.rows[r];
    const agent = this.agents[c];
    if (!row || !agent) return;
    const next = fit(row.scope, level);
    if (!offered(row.scope).includes(level) || this.levelIn(this.value, agent.id, row) === next) return;
    this.commit(this.with(this.value, agent.id, row, next), { type: "cell", agent: agent.id, tool: row.tool.id, scope: row.scope.id, level: next }, `${agent.name}, ${row.tool.name} ${row.scope.label}: ${LEVEL_LABEL[next]}`);
  }

  private step(r: number, c: number, dir: 1 | -1) {
    const row = this.rows[r];
    const agent = this.agents[c];
    if (!row || !agent) return;
    const ok = offered(row.scope);
    const i = ok.indexOf(this.levelIn(this.value, agent.id, row));
    this.setCell(r, c, ok[(i + dir + ok.length) % ok.length]);
  }

  private applyPreset(p: ToolPermissionPreset) {
    if (this.matchedPreset === p) return;
    this.commit(this.presetValue(p), { type: "preset", preset: p.id }, `${p.label} applied`);
  }

  private reset() {
    const base = this.baseline;
    this.commit(structuredClone(base), { type: "reset" }, "Changes undone");
  }

  private save() {
    const changes = this.changesOf(this.value);
    if (!changes.length) return;
    if (!this.emit<ToolPermissionSave>("tc-save", { value: this.value, changes }, { cancelable: true })) return;
    this.saved = structuredClone(this.value);
    this.announce = `Saved ${changes.length} ${changes.length === 1 ? "change" : "changes"}`;
  }

  /* ---------- Keyboard: the grid ---------- */

  private focusCell(r: number, c: number) {
    const rows = this.rows.length;
    const cols = this.agents.length;
    if (!rows || !cols) return;
    this.active = { r: Math.max(0, Math.min(rows - 1, r)), c: Math.max(0, Math.min(cols - 1, c)) };
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-cell="${this.active.r}:${this.active.c}"]`)?.focus());
  }

  private onGridKey = (e: KeyboardEvent) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>("[data-cell]");
    if (!cell || e.isComposing || e.altKey) return;
    const [r, c] = cell.dataset.cell!.split(":").map(Number);
    const mod = isMac() ? e.metaKey : e.ctrlKey;
    const last = { r: this.rows.length - 1, c: this.agents.length - 1 };
    const moves: Record<string, [number, number]> = {
      ArrowUp: [r - 1, c],
      ArrowDown: [r + 1, c],
      ArrowLeft: [r, c - 1],
      ArrowRight: [r, c + 1],
      Home: mod ? [0, 0] : [r, 0],
      End: mod ? [last.r, last.c] : [r, last.c],
      PageUp: [r - 5, c],
      PageDown: [r + 5, c],
    };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      this.focusCell(move[0], move[1]);
      return;
    }
    if (mod || e.metaKey || e.ctrlKey) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      this.step(r, c, e.shiftKey ? -1 : 1);
    } else if (e.key === "1" || e.key === "2" || e.key === "3") {
      e.preventDefault();
      this.setCell(r, c, LEVELS[+e.key - 1]);
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      const row = this.rows[r];
      const agent = this.agents[c];
      if (row && agent) this.setCell(r, c, this.levelIn(this.baseline, agent.id, row));
    }
  };

  private onPresetKey(e: KeyboardEvent, i: number) {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const presets = this.presets;
    const next = (i + step + presets.length) % presets.length;
    this.applyPreset(presets[next]);
    this.querySelectorAll<HTMLElement>(".ui-tperm__preset")[next]?.focus();
  }

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (this.firstValue === undefined) this.firstValue = structuredClone(this.value);
    // The active cell stays inside the grid when rows or columns go away
    const rows = this.rows.length;
    const cols = this.agents.length;
    const { r, c } = this.active;
    if ((r >= rows || c >= cols) && rows && cols) this.active = { r: Math.min(r, rows - 1), c: Math.min(c, cols - 1) };
  }

  /* ---------- Rendering ---------- */

  private renderAvatar(a: ToolPermissionAgent) {
    return html`<span class="ui-tperm__avatar" ?data-logo=${!!a.avatar} aria-hidden="true">${a.avatar ? clone(a.avatar) : initials(a.name)}</span>`;
  }

  private renderCell(row: Row, r: number, a: ToolPermissionAgent, c: number) {
    const level = this.levelIn(this.value, a.id, row);
    const was = this.levelIn(this.baseline, a.id, row);
    const ok = offered(row.scope);
    const isActive = this.active.r === r && this.active.c === c;
    return html`<td
      role="gridcell"
      class="ui-tperm__cell"
      data-cell=${`${r}:${c}`}
      data-level=${level}
      ?data-changed=${level !== was}
      tabindex=${isActive ? 0 : -1}
      aria-describedby=${`${this.uid}-keys`}
      @focus=${() => {
        if (!isActive) this.active = { r, c };
      }}
    >
      <span class="ui-tperm__seg" aria-hidden="true">
        ${LEVELS.map(
          (l) => html`<span
            class="ui-tperm__opt"
            data-level=${l}
            ?data-on=${l === level}
            ?data-off=${!ok.includes(l)}
            title=${ok.includes(l) ? LEVEL_LABEL[l] : `${LEVEL_LABEL[l]} – not offered for this scope`}
            @pointerdown=${(e: PointerEvent) => {
              // The cell takes focus; the choice is picked on click
              this.active = { r, c };
              if (e.pointerType === "mouse") e.preventDefault();
              (e.currentTarget as HTMLElement).closest<HTMLElement>("td")?.focus({ preventScroll: true });
            }}
            @click=${() => this.setCell(r, c, l)}
            >${ICON[l]()}</span
          >`,
        )}
      </span>
      <span class="ui-tperm__sr">${LEVEL_LABEL[level]}${level !== was ? `, changed from ${LEVEL_LABEL[was]}` : ""}</span>
    </td>`;
  }

  private renderGrid() {
    const agents = this.agents;
    const rows = this.rows;
    let r = -1;
    return html`<div class="ui-tperm__scroll">
      <table class="ui-tperm__grid" role="grid" aria-labelledby=${`${this.uid}-title`} aria-rowcount=${rows.length + this.tools.length + 1} aria-colcount=${agents.length + 1} @keydown=${this.onGridKey}>
        <thead>
          <tr role="row" aria-rowindex="1">
            <th role="columnheader" class="ui-tperm__corner" scope="col"><span class="ui-tperm__corner-label">Tool and scope</span></th>
            ${repeat(
              agents,
              (a) => a.id,
              (a) => html`<th role="columnheader" class="ui-tperm__agent" scope="col">
                <span class="ui-tperm__agent-inner">${this.renderAvatar(a)}<span class="ui-tperm__agent-text"><span class="ui-tperm__agent-name">${a.name}</span>${a.model ? html`<span class="ui-tperm__agent-model">${a.model}</span>` : nothing}</span></span>
              </th>`,
            )}
          </tr>
        </thead>
        <tbody>
          ${this.tools.map((tool, t) => {
            const groupIndex = rows.findIndex((x) => x.tool === tool) + t + 2;
            return html`<tr role="row" class="ui-tperm__group" aria-rowindex=${groupIndex}>
                <th role="rowheader" colspan=${agents.length + 1} aria-colspan=${agents.length + 1}>
                  <span class="ui-tperm__tool">${tool.icon ? html`<span class="ui-tperm__tool-icon">${clone(tool.icon)}</span>` : nothing}<span class="ui-tperm__tool-name">${tool.name}</span></span>
                </th>
              </tr>
              ${tool.scopes.map((scope, s) => {
                r++;
                const row = rows[r];
                const ri = r;
                return html`<tr role="row" class="ui-tperm__row" aria-rowindex=${groupIndex + s + 1}>
                  <th role="rowheader" class="ui-tperm__scope" scope="row">
                    <span class="ui-tperm__scope-label"><span class="ui-tperm__sr">${tool.name} · </span>${scope.label}${scope.risk && scope.risk !== "safe"
                      ? html`<span class="ui-tperm__risk" data-risk=${scope.risk}>${scope.risk === "risky" ? "Risky" : "Destructive"}</span>`
                      : nothing}</span>
                    ${scope.description ? html`<span class="ui-tperm__scope-desc">${scope.description}</span>` : nothing}
                  </th>
                  ${agents.map((a, c) => this.renderCell(row, ri, a, c))}
                </tr>`;
              })}`;
          })}
        </tbody>
      </table>
    </div>`;
  }

  private renderPresets() {
    const presets = this.presets;
    if (!presets.length || !this.agents.length || !this.rows.length) return nothing;
    const match = this.matchedPreset;
    const focusable = match ?? presets[0];
    return html`<div class="ui-tperm__presets-row">
      <span class="ui-tperm__presets-label" id=${`${this.uid}-presets`}>Presets</span>
      <div class="ui-tperm__presets" role="radiogroup" aria-labelledby=${`${this.uid}-presets`}>
        ${presets.map(
          (p, i) => html`<button
            type="button"
            role="radio"
            class="ui-tperm__preset"
            aria-checked=${p === match ? "true" : "false"}
            title=${ifDefined(p.description)}
            tabindex=${p === focusable ? 0 : -1}
            @click=${() => this.applyPreset(p)}
            @keydown=${(e: KeyboardEvent) => this.onPresetKey(e, i)}
          >${p.label}</button>`,
        )}
      </div>
      ${match ? nothing : html`<span class="ui-tperm__custom">Custom</span>`}
    </div>`;
  }

  private renderSummary(changes: ToolPermissionChange[]) {
    const shown = this.open ? changes : changes.slice(0, this.changesLimit);
    const hidden = changes.length - shown.length;
    const agentName = (id: string) => this.agents.find((a) => a.id === id)?.name ?? id;
    const rowOf = (ch: ToolPermissionChange) => this.rows.find((x) => x.tool.id === ch.tool && x.scope.id === ch.scope);
    return html`<section class="ui-tperm__summary" aria-labelledby=${`${this.uid}-changes`}>
      <h4 class="ui-tperm__label" id=${`${this.uid}-changes`}>${changes.length ? "Changes" : "No changes"}${changes.length ? html`<span class="ui-tperm__count">${changes.length}</span>` : nothing}</h4>
      ${changes.length
        ? html`<ul class="ui-tperm__changes">
            ${shown.map((ch) => {
              const row = rowOf(ch);
              return html`<li class="ui-tperm__change">
                <span class="ui-tperm__change-what"><b>${agentName(ch.agent)}</b> · ${row?.tool.name} ${row?.scope.label.toLowerCase()}</span>
                <span class="ui-tperm__change-levels">
                  <span class="ui-tperm__pill" data-level=${ch.from}>${LEVEL_LABEL[ch.from]}</span>
                  <svg class="ui-tperm__arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>`}</svg>
                  <span class="ui-tperm__sr"> to </span>
                  <span class="ui-tperm__pill" data-level=${ch.to}>${LEVEL_LABEL[ch.to]}</span>
                </span>
              </li>`;
            })}
          </ul>
          ${changes.length > this.changesLimit
            ? html`<button type="button" class="ui-tperm__more" aria-expanded=${this.open ? "true" : "false"} @click=${() => (this.open = !this.open)}>${this.open ? "Show less" : `${hidden} more`}</button>`
            : nothing}`
        : html`<p class="ui-tperm__none">Everything matches what was saved.</p>`}
    </section>`;
  }

  protected override render() {
    const changes = this.changesOf(this.value);
    const dirty = changes.length > 0;
    const empty = !this.agents.length || !this.rows.length;
    return html`
      <span class="ui-tperm__sr" role="status">${this.announce}</span>
      <span class="ui-tperm__sr" id=${`${this.uid}-keys`}>Space changes it, 1 Allow, 2 Ask, 3 Deny</span>
      <div class="ui-tperm__card">
        <header class="ui-tperm__head">
          <h3 class="ui-tperm__title" id=${`${this.uid}-title`}>${this.heading}</h3>
          ${this.description ? html`<p class="ui-tperm__desc">${this.description}</p>` : nothing}
          <span class="ui-tperm__legend" aria-hidden="true">${LEVELS.map((l) => html`<span class="ui-tperm__legend-item" data-level=${l}>${ICON[l]()}${LEVEL_LABEL[l]}</span>`)}</span>
        </header>
        ${this.renderPresets()}
        ${empty ? html`<p class="ui-tperm__empty">No agents or tools to set up yet.</p>` : this.renderGrid()}
        ${empty ? nothing : this.renderSummary(changes)}
      </div>
      ${empty
        ? nothing
        : html`<div class="ui-tperm__answer">
            <button type="button" class="ui-tperm__btn" aria-disabled=${dirty ? "false" : "true"} @click=${() => dirty && this.reset()}>${this.resetLabel}</button>
            <button type="button" class="ui-tperm__btn ui-tperm__btn--primary" aria-disabled=${dirty ? "false" : "true"} @click=${() => this.save()}>${this.saveLabel}${dirty ? html`<span class="ui-tperm__btn-count">${changes.length}</span>` : nothing}</button>
          </div>`}
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card; Reset and Save sit on the tray below it */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="tperm"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  letter-spacing: -0.006em;
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card; the buttons are its last row */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tperm"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="tperm"] *, [data-ui="tperm"] *::before, [data-ui="tperm"] *::after { box-sizing: border-box; }
:where([data-ui="tperm"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="tperm"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="tperm"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="tperm"] h3, [data-ui="tperm"] h4, [data-ui="tperm"] p, [data-ui="tperm"] section { margin: 0; }
[data-ui="tperm"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tperm"] svg[stroke-width] { stroke-width: 1.5; }
.ui-tperm__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-tperm__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- Heading, legend and presets ----- */
.ui-tperm__head { display: flex; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-0-5) var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-tperm__head { padding: var(--tc-space-4) var(--tc-space-4) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-tperm__head { padding: var(--tc-space-3-5) var(--tc-space-4) 0; }
.ui-tperm__title { flex: 1 1 auto; min-width: 0; font-weight: var(--tc-font-weight-strong); letter-spacing: -0.011em; }
:where([data-look="standard"], [data-look="standard"] *).ui-tperm__title { font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-tperm__title { font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-normal); color: var(--tc-text-strong); }
.ui-tperm__desc { order: 3; flex-basis: 100%; color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-tperm__desc { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-tperm__desc { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
/* The legend: what the three marks mean */
.ui-tperm__legend { display: flex; flex: none; gap: var(--tc-space-3); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-tperm__legend-item { display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-tperm__legend-item > svg { width: 12px; height: 12px; }
.ui-tperm__legend-item[data-level="allow"] > svg { color: var(--tc-status-success-fg); }
.ui-tperm__legend-item[data-level="ask"] > svg { color: var(--tc-status-warning-fg); }
.ui-tperm__legend-item[data-level="deny"] > svg { color: var(--tc-status-danger-fg); }
.ui-tperm__presets-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-4) 0; }
.ui-tperm__presets-label { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
:where([data-look="standard"], [data-look="standard"] *).ui-tperm__presets-label { font-weight: var(--tc-font-weight-medium); }
/* Presets – Standard: a segmented track, the matching one raised in white; Clean: separate chips. The checked one also
   carries a ring in the selected colour, as permission-request's scopes do */
.ui-tperm__preset { font-weight: var(--tc-font-weight-medium); text-align: center !important; white-space: nowrap; transition: color var(--tc-duration-base) var(--tc-ease-standard), background-color var(--tc-duration-base) var(--tc-ease-standard), box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
.ui-tperm__preset[aria-checked="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow), inset 0 0 0 1px var(--tc-border-selected); color: var(--tc-text-primary); }
.ui-tperm__preset[aria-checked="false"]:hover { color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-tperm__presets { display: flex; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
:where([data-look="standard"], [data-look="standard"] *).ui-tperm__preset { height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-tperm__presets { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-tperm__preset { padding: var(--tc-space-1) var(--tc-space-2); border-radius: var(--tc-control-radius-sm); background: var(--tc-fill-default); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-tperm__preset[aria-checked="false"]:hover { background: var(--tc-fill-strong); }
.ui-tperm__custom { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-accent-subtle); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-accent-text); }
/* ----- The matrix ----- */
.ui-tperm__scroll { margin-top: var(--tc-space-3-5); overflow-x: auto; border-top: var(--tc-hairline) solid var(--tc-divider); scrollbar-width: thin; }
.ui-tperm__grid { width: 100%; border-collapse: collapse; border-spacing: 0; }
.ui-tperm__grid th, .ui-tperm__grid td { padding: 0; font-weight: inherit; text-align: left; vertical-align: middle; }
/* The first column stays put while the agents scroll sideways */
.ui-tperm__grid th:first-child { position: sticky; left: 0; z-index: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-tperm__grid th:first-child { background: var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *).ui-tperm__grid th:first-child { background: var(--tc-surface-raised); }
.ui-tperm__corner { min-width: 128px; padding: var(--tc-space-2) var(--tc-space-4) !important; vertical-align: bottom !important; }
.ui-tperm__corner-label { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-tperm__corner-label { font-weight: var(--tc-font-weight-medium); }
/* Agent columns: avatar, name and model */
.ui-tperm__agent { width: 88px; max-width: 120px; padding: var(--tc-space-3) var(--tc-space-1) var(--tc-space-2) !important; }
.ui-tperm__agent-inner { display: flex; flex-direction: column; align-items: center; gap: var(--tc-space-1); min-width: 0; text-align: center; }
.ui-tperm__agent-text { display: grid; max-width: 100%; min-width: 0; }
.ui-tperm__agent-name { overflow: hidden; font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-tperm__agent-name { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-tperm__agent-name { color: var(--tc-text-strong); }
.ui-tperm__agent-model { overflow: hidden; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); white-space: nowrap; text-overflow: ellipsis; color: var(--tc-text-muted); }
.ui-tperm__avatar { display: grid; flex: none; place-items: center; background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-weight: var(--tc-avatar-font-weight); }
:where([data-look="standard"], [data-look="standard"] *).ui-tperm__avatar { width: 24px; height: 24px; border-radius: var(--tc-radius-md); font-size: var(--tc-font-size-2xs); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-tperm__avatar { width: 22px; height: 22px; border-radius: var(--tc-avatar-radius-agent); font-size: var(--tc-font-size-2xs); color: var(--tc-text-secondary); }
.ui-tperm__avatar[data-logo] > svg { width: 14px; height: 14px; }
/* A tool: its mark and name over its scopes */
.ui-tperm__group > th { padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-1) !important; border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-tperm__tool { display: inline-flex; align-items: center; gap: var(--tc-space-2); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-tperm__tool { font-weight: var(--tc-font-weight-medium); }
.ui-tperm__tool-icon { display: grid; place-items: center; width: 14px; height: 14px; color: var(--tc-text-secondary); }
.ui-tperm__tool-icon > svg { width: 14px; height: 14px; }
/* A scope: the row header */
.ui-tperm__scope { padding: var(--tc-space-1-5) var(--tc-space-3) var(--tc-space-1-5) var(--tc-space-4) !important; }
.ui-tperm__scope-label { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-0-5) var(--tc-space-1-5); color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); }
:where([data-look="standard"], [data-look="standard"] *).ui-tperm__scope-label { font-size: var(--tc-font-size-md); }
.ui-tperm__scope-desc { display: -webkit-box; overflow: hidden; margin-top: var(--tc-space-0-5); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); -webkit-box-orient: vertical; -webkit-line-clamp: 1; }
.ui-tperm__risk { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-warning-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-status-warning-fg); }
.ui-tperm__risk[data-risk="destructive"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* A cell: a small segmented control – the chosen mark raised (Standard) or tinted (Clean) in its status colour */
.ui-tperm__cell { position: relative; white-space: nowrap; padding: var(--tc-space-1) !important; text-align: center !important; cursor: default; outline: none; }
.ui-tperm__row > .ui-tperm__cell:last-child { padding-right: var(--tc-space-3) !important; }
.ui-tperm__cell:focus-visible .ui-tperm__seg { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-tperm__seg { display: inline-flex; vertical-align: middle; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); }
:where([data-look="standard"], [data-look="standard"] *).ui-tperm__seg { background: var(--tc-seg-track-bg); }
:where([data-look="clean"], [data-look="clean"] *).ui-tperm__seg { gap: var(--tc-space-0-5); background: var(--tc-fill-subtle); }
.ui-tperm__opt { display: grid; place-items: center; width: 24px; height: 22px; border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); color: var(--tc-icon-muted); cursor: pointer; transition: color var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-tperm__opt > svg { width: 13px; height: 13px; }
.ui-tperm__opt:not([data-on]):not([data-off]):hover { color: var(--tc-text-primary); }
.ui-tperm__opt[data-off] { opacity: 0.3; cursor: not-allowed; }
:where([data-look="standard"], [data-look="standard"] *).ui-tperm__opt[data-on] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); }
.ui-tperm__opt[data-on][data-level="allow"] { color: var(--tc-status-success-fg); }
.ui-tperm__opt[data-on][data-level="ask"] { color: var(--tc-status-warning-fg); }
.ui-tperm__opt[data-on][data-level="deny"] { color: var(--tc-status-danger-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-tperm__opt[data-on][data-level="allow"] { background: var(--tc-status-success-bg); }
:where([data-look="clean"], [data-look="clean"] *).ui-tperm__opt[data-on][data-level="ask"] { background: var(--tc-status-warning-bg); }
:where([data-look="clean"], [data-look="clean"] *).ui-tperm__opt[data-on][data-level="deny"] { background: var(--tc-status-danger-bg); }
.ui-tperm__opt[data-on] > svg { animation: ui-tperm-pop var(--tc-duration-slow) var(--tc-ease-move) both; }
/* Changed since the last save: a dot in the corner */
.ui-tperm__seg { position: relative; }
.ui-tperm__cell[data-changed] .ui-tperm__seg::after { content: ""; position: absolute; top: -2px; right: -2px; width: 6px; height: 6px; border-radius: 50%; background: var(--tc-accent); box-shadow: 0 0 0 1.5px var(--tc-surface-raised); }
.ui-tperm__row:hover > th, .ui-tperm__row:hover > td { background-color: var(--tc-fill-subtle); }
:where([data-look="standard"], [data-look="standard"] *).ui-tperm__row:hover > th:first-child { background: linear-gradient(var(--tc-fill-subtle), var(--tc-fill-subtle)), var(--tc-surface-on-tray); }
:where([data-look="clean"], [data-look="clean"] *).ui-tperm__row:hover > th:first-child { background: linear-gradient(var(--tc-fill-subtle), var(--tc-fill-subtle)), var(--tc-surface-raised); }
.ui-tperm__empty { padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-muted); text-align: center; }
/* ----- What changed ----- */
.ui-tperm__summary { margin-top: var(--tc-space-2); border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="standard"], [data-look="standard"] *).ui-tperm__summary { padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-tperm__summary { padding: var(--tc-space-3) var(--tc-space-2-5) var(--tc-space-2); }
.ui-tperm__label { display: flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
:where([data-look="standard"], [data-look="standard"] *).ui-tperm__label { margin: 0 var(--tc-space-2) var(--tc-space-1) !important; font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-tperm__label { margin: 0 var(--tc-space-1-5) var(--tc-space-1) !important; font-weight: var(--tc-font-weight-regular); line-height: var(--tc-line-height-tight); }
.ui-tperm__count { display: grid; place-items: center; border-radius: var(--tc-radius-badge); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-tperm__count { min-width: 18px; height: 18px; padding: 0 var(--tc-space-1); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-tperm__count { min-width: 16px; height: 16px; padding: 0 var(--tc-space-1); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-tperm__changes { display: grid; grid-template-columns: minmax(0, 1fr); }
.ui-tperm__change { display: flex; align-items: center; gap: var(--tc-space-3); min-height: 30px; animation: ui-tperm-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-tperm__change { padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-md); }
:where([data-look="clean"], [data-look="clean"] *).ui-tperm__change { padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-sm); }
.ui-tperm__change-what { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-secondary); white-space: nowrap; text-overflow: ellipsis; }
.ui-tperm__change-what b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-tperm__change-levels { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); color: var(--tc-icon-muted); }
.ui-tperm__pill { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); }
.ui-tperm__pill[data-level="allow"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-tperm__pill[data-level="ask"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-tperm__pill[data-level="deny"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-tperm__change-levels > .ui-tperm__pill:first-child { background: var(--tc-fill-default); color: var(--tc-text-muted); text-decoration: line-through; text-decoration-color: var(--tc-border-strong); }
.ui-tperm__none { padding: 0 var(--tc-space-2) var(--tc-space-1); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-tperm__none { padding: 0 var(--tc-space-1-5) var(--tc-space-1); }
.ui-tperm__more { padding: var(--tc-space-0-5) 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); transition: color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-tperm__more { margin: 0 var(--tc-space-2) !important; font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *).ui-tperm__more { margin: 0 var(--tc-space-1-5) !important; }
.ui-tperm__more:hover { color: var(--tc-text-primary); }
/* ----- Reset and Save ----- */
.ui-tperm__answer { display: flex; justify-content: flex-end; gap: var(--tc-space-2); }
:where([data-look="standard"], [data-look="standard"] *).ui-tperm__answer { padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-tperm__answer { padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
/* Button's secondary and primary recipes, medium */
.ui-tperm__btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-2); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-quick) var(--tc-ease-standard); }
.ui-tperm__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-tperm__btn:active { transform: scale(0.98); }
.ui-tperm__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-tperm__btn--primary:hover { background: var(--tc-action-primary-bg-hover); box-shadow: var(--tc-action-primary-shadow); }
.ui-tperm__btn--primary:active { background: var(--tc-action-primary-bg-active); }
.ui-tperm__btn[aria-disabled="true"] { opacity: 0.45; cursor: default; transform: none; }
.ui-tperm__btn-count { display: grid; place-items: center; min-width: var(--tc-kbd-h); height: var(--tc-kbd-h); padding: 0 var(--tc-kbd-px); border-radius: var(--tc-kbd-radius); background: var(--tc-kbd-on-inverse-bg); font-size: var(--tc-kbd-font-size); font-weight: var(--tc-kbd-font-weight); line-height: var(--tc-line-height-none); font-variant-numeric: tabular-nums; }
@keyframes ui-tperm-in { from { opacity: 0; transform: translateY(3px); } }
@keyframes ui-tperm-pop { 0% { transform: scale(0.6); } 60% { transform: scale(1.12); } }
/* Narrow containers: the legend goes under the heading, the presets scroll sideways */
@container (max-width: 480px) {
  .ui-tperm__legend { order: 4; }
  .ui-tperm__presets-row { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; }
  .ui-tperm__presets-label { display: none; }
  .ui-tperm__corner { min-width: 112px; }
  .ui-tperm__agent-model { display: none; }
}
@media (pointer: coarse) {
  .ui-tperm__opt { width: 32px; height: 28px; }
  .ui-tperm__btn { height: 40px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="tperm"] *, [data-ui="tperm"] *::before, [data-ui="tperm"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-tool-permissions")) customElements.define("tc-tool-permissions", TcToolPermissions);

declare global {
  interface HTMLElementTagNameMap {
    "tc-tool-permissions": TcToolPermissions;
  }
}
