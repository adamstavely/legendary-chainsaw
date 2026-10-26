import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, OffScreenController } from "./internal/controllers";

/*
 * <tc-run-checkpoints> – an agent run's restore points on a timeline: "go back to step 4 and try again". The agent
 * saves a checkpoint before each step; pick one and the card shows what it captured (the conversation, the
 * workspace, memory …) and what going back discards – that step and every later one, the files they changed and what
 * they spent. A note for the agent ("try the staging database instead") goes along with the restore.
 *
 *   <tc-run-checkpoints heading="Migrate the billing service to Postgres" status="running" .elapsed=${84_000}
 *     .checkpoints=${checkpoints}></tc-run-checkpoints>
 *
 * A strip on top draws the run as a line with a dot per checkpoint – what going back keeps is solid, what it discards
 * hatched. The list below is a listbox: arrow keys pick a step, Enter moves to the note, Escape clears the pick.
 * `selected` is a value with a cancelable `tc-selected-change`; "Go back" fires `tc-restore` (and calls `restorer`,
 * which may return a promise – the button waits, and says so if it rejects). The run itself – its status, its
 * checkpoints, its elapsed time – is always the app's: the element reads no clock.
 */

export type RunCheckpointStatus = "done" | "active" | "failed";

export type RunCheckpointCapture = {
  /** What was captured, e.g. "Conversation" */
  label: string;
  /** How much of it, e.g. "14 messages" */
  value: string;
};

export type RunCheckpoint = {
  id: string;
  /** The step that starts at this checkpoint, e.g. "Run the test suite" */
  title: string;
  /** A second, quieter line under the title */
  detail?: string;
  /** Tool the step called, shown as a small mono chip, e.g. "run_tests" */
  tool?: string;
  /** When the checkpoint was taken, in ms from the start of the run */
  at: number;
  /** "done" (default), "active" while the step runs, "failed" */
  status?: RunCheckpointStatus;
  /** What the checkpoint holds – shown when it's picked */
  captured?: RunCheckpointCapture[];
  /** Files the step changed – going back to it or an earlier point discards them */
  files?: string[];
  /** Tokens the step spent */
  tokens?: number;
  /** What the step cost, in `currency` */
  cost?: number;
  /** false: no snapshot was kept, so the run can't go back here */
  restorable?: boolean;
};

export type RunCheckpointsStatus = "running" | "paused" | "done" | "failed";

/** Details of the events */
export type RunCheckpointsSelectedChange = { selected: string | null; checkpoint?: RunCheckpoint };
export type RunCheckpointsRestore = { checkpointId: string; instruction: string; discarded: string[] };

const STATUS_TEXT: Record<RunCheckpointsStatus, string> = { running: "Live", paused: "Paused", done: "Done", failed: "Failed" };
const STEP_TEXT: Record<RunCheckpointStatus, string> = { done: "Done", active: "Running", failed: "Failed" };

let instances = 0;

/* ---------- Formatting ---------- */

/** 0:42, 12:05, 1:02:09 – a point in the run */
const clock = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
};
/** 0:42 → "42 seconds", for screen readers */
const spoken = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const parts = [m ? `${m} minute${m === 1 ? "" : "s"}` : "", s % 60 || !m ? `${s % 60} second${s % 60 === 1 ? "" : "s"}` : ""];
  return parts.filter(Boolean).join(" ");
};
const tokenText = (n: number) => (n < 1000 ? String(Math.round(n)) : n < 100_000 ? `${(n / 1000).toFixed(1)}k` : `${Math.round(n / 1000)}k`);
const moneyFormats = new Map<string, Intl.NumberFormat>();
const money = (n: number, locale: string, currency: string) => {
  const key = `${locale}|${currency}`;
  let f = moneyFormats.get(key);
  if (!f) moneyFormats.set(key, (f = new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 })));
  return f.format(n);
};
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** What going back to the checkpoint at `i` discards: that step and every later one */
function discardsOf(list: RunCheckpoint[], i: number) {
  const steps = i >= 0 ? list.slice(i) : [];
  const files = new Set(steps.flatMap((s) => s.files ?? []));
  return {
    steps,
    files: [...files],
    tokens: steps.reduce((n, s) => n + (s.tokens ?? 0), 0),
    cost: steps.reduce((n, s) => n + (s.cost ?? 0), 0),
    hasCost: steps.some((s) => s.cost !== undefined),
  };
}

/* ---------- Icons ---------- */

/** Eight rays that fade one after another – agent-plan's spinner */
const spinner = html`<svg class="ui-rcp__spinner" viewBox="0 0 16 16">${Array.from(
  { length: 8 },
  (_, i) => svg`<line x1="8" y1="1.75" x2="8" y2="4.75" transform=${`rotate(${i * 45} 8 8)`} style=${`animation-delay: ${(i - 8) * 100}ms`}></line>`,
)}</svg>`;
const flagIcon = html`<svg viewBox="0 0 16 16">${svg`<path d="M4.5 13.5V2.75"></path><path d="M4.5 3h7.25l-1.6 2.6 1.6 2.65H4.5"></path>`}</svg>`;
const failedMark = html`<svg viewBox="0 0 16 16" class="ui-rcp__mark">${svg`<path d="M8 4.2v4.4M8 11.6h.01"></path>`}</svg>`;
/** A counter-clockwise arrow – back in time */
const backIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M3 8a5 5 0 1 0 1.6-3.7"></path><path d="M3 3v2.6h2.6"></path>`}</svg>`;
const keptIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M4.2 8.4 6.8 11l5-5.6"></path>`}</svg>`;
const noteIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M3.5 12.5 4 10l6.6-6.6a1.4 1.4 0 0 1 2 2L6 12z"></path><path d="M9.5 4.5l2 2"></path>`}</svg>`;

/**
 * An agent run's restore points: pick a step, see what it captured and what going back discards, and go back.
 * @tag tc-run-checkpoints
 * @fires tc-selected-change - A step is picked or the pick is cleared (detail: { selected: string | null, checkpoint?: RunCheckpoint }); cancelable
 * @fires tc-restore - "Go back to step N" pressed (detail: { checkpointId: string, instruction: string, discarded: string[] })
 */
export class TcRunCheckpoints extends TcElement {
  static override ui = "rcp";

  /** The checkpoints, oldest first – one before each step of the run */
  @property({ attribute: false }) accessor checkpoints: RunCheckpoint[] = [];
  /** The run: "running" (a live run), "paused", "done", "failed" – always set by the app */
  @property() accessor status: RunCheckpointsStatus = "done";
  /** The run's goal, shown as the heading */
  @property() accessor heading = "";
  /** The picked checkpoint's id. Picks apply unless a tc-selected-change listener calls preventDefault() */
  @property() accessor selected: string | null = null;
  /** How long the run has gone on, in ms – the strip's length (defaults to the last checkpoint) */
  @property({ type: Number }) accessor elapsed: number | undefined = undefined;
  /** Placeholder of the note that goes along with the restore */
  @property() accessor placeholder = "What should it do differently? (optional)";
  /** Currency of `cost`, an ISO 4217 code */
  @property() accessor currency = "USD";
  /** Locale for money */
  @property() accessor locale = "en-US";
  /** Called on restore (as well as tc-restore). May return a promise: the button waits, and says so if it rejects */
  @property({ attribute: false }) accessor restorer: ((checkpointId: string, instruction: string) => void | Promise<unknown>) | undefined = undefined;

  /** @internal The note for the agent */
  @state() accessor note = "";
  /** @internal A restore in flight, or one that failed */
  @state() accessor work: "pending" | "error" | null = null;
  /** @internal */
  @state() accessor message = "";
  /** @internal The row that holds the keyboard focus */
  @state() accessor cursor: string | null = null;

  private readonly uid = `tc-rcp${++instances}`;
  /** The panel keeps showing the last pick while it folds away */
  private panelFor: string | null = null;
  private focusOption: string | null = null;
  private focusNote = false;

  constructor() {
    super();
    // The spinner of a running step pauses while the card is scrolled away
    new OffScreenController(this, () => this.checkpoints.some((c) => c.status === "active"));
    // The button leaves with the pick: focus goes to the picked row, else the list
    new FocusRescueController(this, () => this.querySelector<HTMLElement>('.ui-rcp__row[tabindex="0"]'));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
  }

  /* ---------- State ---------- */

  /** @internal */
  private get index() {
    return this.selected === null ? -1 : this.checkpoints.findIndex((c) => c.id === this.selected);
  }

  /** @internal */
  private restorable(c: RunCheckpoint) {
    return c.restorable !== false;
  }

  /** A trailing no-break space makes repeated messages count as new for screen readers */
  private announce(text: string) {
    this.message = this.message === text ? `${text} ` : text;
  }

  private pick(id: string | null) {
    if (id === this.selected) return;
    const checkpoint = id === null ? undefined : this.checkpoints.find((c) => c.id === id);
    if (id !== null && (!checkpoint || !this.restorable(checkpoint))) return;
    if (!this.emit<RunCheckpointsSelectedChange>("tc-selected-change", { selected: id, checkpoint }, { cancelable: true })) return;
    this.selected = id;
    if (this.work === "error") this.work = null;
    if (checkpoint) {
      const i = this.checkpoints.indexOf(checkpoint);
      const d = discardsOf(this.checkpoints, i);
      this.announce(`Step ${i + 1} picked. Going back discards ${plural(d.steps.length, "step")}${d.files.length ? ` and ${plural(d.files.length, "file change")}` : ""}.`);
    }
  }

  private restore = () => {
    const i = this.index;
    const cp = this.checkpoints[i];
    if (!cp || this.work === "pending") return;
    const instruction = this.note.trim();
    const discarded = discardsOf(this.checkpoints, i).steps.map((s) => s.id);
    this.emit<RunCheckpointsRestore>("tc-restore", { checkpointId: cp.id, instruction, discarded });
    const done = this.restorer?.(cp.id, instruction);
    const finish = () => {
      this.work = null;
      this.note = "";
      this.cursor = cp.id;
      this.focusOption = this.contains(document.activeElement) ? cp.id : null;
      this.announce(`Went back to step ${i + 1}${instruction ? " with your note" : ""}.`);
      this.pick(null);
    };
    if (!done || typeof (done as Promise<unknown>).then !== "function") {
      finish();
      return;
    }
    this.work = "pending";
    (done as Promise<unknown>).then(
      () => this.isConnected && finish(),
      () => {
        if (!this.isConnected) return;
        this.work = "error";
        this.announce("Couldn't go back – try again.");
      },
    );
  };

  /* ---------- Keyboard: a single-select listbox, the pick follows focus ---------- */

  private onListKey = (e: KeyboardEvent) => {
    const row = (e.target as Element).closest<HTMLElement>(".ui-rcp__row");
    if (!row || e.altKey || e.ctrlKey || e.metaKey) return;
    const list = this.checkpoints;
    const i = list.findIndex((c) => c.id === row.dataset.id);
    let next = -1;
    if (e.key === "ArrowDown") next = Math.min(list.length - 1, i + 1);
    else if (e.key === "ArrowUp") next = Math.max(0, i - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = list.length - 1;
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const cp = list[i];
      if (!cp || !this.restorable(cp)) return;
      this.pick(cp.id);
      if (this.selected === cp.id && e.key === "Enter") {
        this.focusNote = true;
        this.requestUpdate();
      }
      return;
    } else if (e.key === "Escape" && this.selected !== null) {
      e.preventDefault();
      this.pick(null);
      return;
    } else return;
    e.preventDefault();
    const cp = list[next];
    if (!cp) return;
    this.cursor = cp.id;
    this.focusOption = cp.id;
    if (this.restorable(cp)) this.pick(cp.id);
  };

  private onNoteKey = (e: KeyboardEvent) => {
    if (e.isComposing) return;
    if (e.key === "Enter") {
      e.preventDefault();
      this.restore();
    } else if (e.key === "Escape") {
      e.preventDefault();
      // Back to the picked row, the pick stays
      this.focusOption = this.selected;
      this.requestUpdate();
    }
  };

  /* ---------- Update ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    this.dataset.status = this.status;
    if (this.index >= 0) this.panelFor = this.selected;
    else if (this.panelFor && !this.checkpoints.some((c) => c.id === this.panelFor)) this.panelFor = null;
    if (this.cursor && !this.checkpoints.some((c) => c.id === this.cursor)) this.cursor = null;
    this.toggleAttribute("data-picked", this.index >= 0);
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!this.hasAttribute("aria-label") && !this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-title`);
    if (this.focusOption) {
      const el = this.querySelector<HTMLElement>(`.ui-rcp__row[data-id="${CSS.escape(this.focusOption)}"]`);
      this.focusOption = null;
      el?.focus();
    }
    if (this.focusNote) {
      this.focusNote = false;
      this.querySelector<HTMLInputElement>(".ui-rcp__note input")?.focus();
    }
  }

  /* ---------- Render ---------- */

  /** The run as a line: solid up to the pick, hatched after it; one dot per checkpoint */
  private renderStrip(range: number) {
    const list = this.checkpoints;
    const i = this.index;
    const cut = i >= 0 ? (list[i].at / range) * 100 : 100;
    const live = this.status === "running";
    return html`<div class="ui-rcp__strip" aria-hidden="true" style=${styleMap({ "--tc-run-checkpoints-cut": `${cut}%` })}>
      <div class="ui-rcp__line">
        <span class="ui-rcp__kept"></span>
        <span class="ui-rcp__cut"></span>
        ${repeat(
          list,
          (c) => c.id,
          (c, j) => html`<span
            class="ui-rcp__dot"
            data-step=${c.status ?? "done"}
            data-picked=${ifDefined(j === i ? "" : undefined)}
            data-discard=${ifDefined(i >= 0 && j > i ? "" : undefined)}
            data-locked=${ifDefined(this.restorable(c) ? undefined : "")}
            style=${styleMap({ "--x": `${(c.at / range) * 100}%` })}
            @click=${() => this.pick(c.id)}
          ></span>`,
        )}
        ${live ? html`<span class="ui-rcp__now"></span>` : nothing}
      </div>
      <div class="ui-rcp__ticks"><span>${clock(0)}</span>${i >= 0 ? html`<span class="ui-rcp__at" style=${styleMap({ "--x": `${cut}%` })}>${clock(list[i].at)}</span>` : nothing}<span>${clock(range)}</span></div>
    </div>`;
  }

  private renderRow(c: RunCheckpoint, j: number, n: number, tabbable: string | undefined) {
    const i = this.index;
    const st = c.status ?? "done";
    const picked = j === i;
    const discard = i >= 0 && j > i;
    const locked = !this.restorable(c);
    return html`<li
      class="ui-rcp__row"
      role="option"
      data-id=${c.id}
      data-step=${st}
      data-discard=${ifDefined(discard ? "" : undefined)}
      aria-selected=${picked ? "true" : "false"}
      aria-disabled=${ifDefined(locked ? "true" : undefined)}
      aria-current=${ifDefined(st === "active" ? "step" : undefined)}
      tabindex=${c.id === tabbable ? "0" : "-1"}
      @click=${() => {
        this.cursor = c.id;
        this.pick(c.id);
      }}
      @focus=${() => (this.cursor = c.id)}
    >
      <span class="ui-rcp__marker" aria-hidden="true">${st === "active" ? spinner : st === "failed" ? failedMark : html`<span class="ui-rcp__num">${j + 1}</span>`}</span>
      <span class="ui-rcp__main">
        <span class="ui-rcp__name"><span class="ui-rcp__sr">Step ${j + 1}: </span>${c.title}</span>
        ${c.detail || c.tool
          ? html`<span class="ui-rcp__sub">${c.detail ? html`<span class="ui-rcp__detail">${c.detail}</span>` : nothing}${c.tool ? html`<code class="ui-rcp__tool">${c.tool}</code>` : nothing}</span>`
          : nothing}
        <span class="ui-rcp__sr">, ${STEP_TEXT[st]}, at ${spoken(c.at)}${locked ? ", no snapshot – can't go back here" : ""}${discard ? ", discarded by going back" : ""}</span>
      </span>
      <span class="ui-rcp__time" aria-hidden="true">${locked ? html`<span class="ui-rcp__lock">No snapshot</span>` : clock(c.at)}</span>
      ${j < n - 1 ? html`<span class="ui-rcp__rail" aria-hidden="true"></span>` : nothing}
    </li>`;
  }

  private renderPanel() {
    const list = this.checkpoints;
    const at = this.panelFor ? list.findIndex((c) => c.id === this.panelFor) : -1;
    const open = this.index >= 0;
    const cp = list[at];
    let body: unknown = nothing;
    if (cp) {
      const d = discardsOf(list, at);
      const earlier = new Set(list.slice(0, at).flatMap((s) => s.files ?? []));
      const captured = cp.captured?.length ? cp.captured : [{ label: "Workspace", value: earlier.size ? plural(earlier.size, "changed file") : "As the run found it" }];
      const lines: unknown[] = [
        html`<li><span class="ui-rcp__label">${d.steps.length === 1 ? `Step ${at + 1}` : `Steps ${at + 1}–${at + d.steps.length}`}</span><span class="ui-rcp__value">${plural(d.steps.length, "step")}</span></li>`,
      ];
      if (d.files.length)
        lines.push(
          html`<li title=${d.files.join("\n")}><span class="ui-rcp__label">File changes</span><span class="ui-rcp__value ui-rcp__files">${d.files.length <= 2 ? d.files.map((f) => f.split("/").pop()).join(", ") : plural(d.files.length, "file")}</span></li>`,
        );
      if (d.tokens || d.hasCost)
        lines.push(
          html`<li><span class="ui-rcp__label">Spent</span><span class="ui-rcp__value">${[d.tokens ? `${tokenText(d.tokens)} tokens` : "", d.hasCost ? money(d.cost, this.locale, this.currency) : ""].filter(Boolean).join(" · ")}</span></li>`,
        );
      if (this.status === "running") lines.push(html`<li><span class="ui-rcp__label">Live run</span><span class="ui-rcp__value">Stops, restarts</span></li>`);
      body = keyed(
        cp.id,
        html`<div class="ui-rcp__cols">
            <section class="ui-rcp__col" aria-labelledby=${`${this.uid}-kept`}>
              <h4 class="ui-rcp__caption" id=${`${this.uid}-kept`}>Captured before step ${at + 1}</h4>
              <ul class="ui-rcp__facts" data-tone="kept">
                ${captured.map((x) => html`<li><span class="ui-rcp__fact-icon">${keptIcon}</span><span class="ui-rcp__label">${x.label}</span><span class="ui-rcp__value">${x.value}</span></li>`)}
              </ul>
            </section>
            <section class="ui-rcp__col" aria-labelledby=${`${this.uid}-drop`}>
              <h4 class="ui-rcp__caption" id=${`${this.uid}-drop`}>Going back discards</h4>
              <ul class="ui-rcp__facts" data-tone="drop">
                ${lines.map((l) => html`${l}`)}
              </ul>
            </section>
          </div>
          <label class="ui-rcp__note">
            <span class="ui-rcp__note-icon" aria-hidden="true">${noteIcon}</span>
            <input
              .value=${this.note}
              placeholder=${this.placeholder}
              aria-label=${`Note for the agent when it runs step ${at + 1} again`}
              .enterKeyHint=${"go"}
              ?disabled=${this.work === "pending"}
              @input=${(e: InputEvent) => (this.note = (e.currentTarget as HTMLInputElement).value)}
              @keydown=${this.onNoteKey}
            />
          </label>`,
      );
    }
    return html`<div class="ui-rcp__panel" ?data-open=${open} .inert=${!open}>
      <div class="ui-rcp__panel-inner">${body}</div>
    </div>`;
  }

  private renderFoot() {
    const i = this.index;
    const cp = this.checkpoints[i];
    const pending = this.work === "pending";
    const quietHint = this.checkpoints.length ? "Pick a step to go back to it" : "The agent saves a checkpoint before each step";
    let left: unknown;
    if (this.work === "error") left = html`<span class="ui-rcp__hint ui-rcp__hint--error" role="alert">Couldn't go back – try again</span>`;
    else if (cp) {
      const d = discardsOf(this.checkpoints, i);
      left = html`<span class="ui-rcp__hint">Runs again from ${clock(cp.at)}<span class="ui-rcp__sep" aria-hidden="true">·</span>discards ${plural(d.steps.length, "step")}</span>`;
    } else left = html`<span class="ui-rcp__hint">${quietHint}</span>`;
    return html`<div class="ui-rcp__foot" data-phase=${cp ? "picked" : "idle"}>
      ${keyed(cp ? `p${cp.id}` : this.work ?? "idle", left)}
      ${cp
        ? html`<span class="ui-rcp__actions">
            <button
              type="button"
              class="ui-rcp__btn ui-rcp__btn--primary"
              ?disabled=${pending}
              aria-busy=${ifDefined(pending ? "true" : undefined)}
              @click=${this.restore}
            >${backIcon}<span>Go back to step ${i + 1}</span></button>
          </span>`
        : nothing}
    </div>`;
  }

  protected override render() {
    const list = this.checkpoints;
    const n = list.length;
    const clean = this.resolvedLook === "clean";
    const range = Math.max(1, this.elapsed ?? 0, ...list.map((c) => c.at));
    // One row takes Tab: the pick, else the row the keyboard was on, else the newest restorable one
    const tabbable =
      (this.index >= 0 ? this.selected : null) ??
      (this.cursor && list.some((c) => c.id === this.cursor) ? this.cursor : null) ??
      [...list].reverse().find((c) => this.restorable(c))?.id ??
      list[0]?.id;
    const foot = this.renderFoot();
    const live = this.status === "running";
    return html`
      <div class="ui-rcp__card">
        <div class="ui-rcp__head">
          <div class="ui-rcp__meta">
            <span class="ui-rcp__state">
              <span class="ui-rcp__state-icon" aria-hidden="true">${flagIcon}</span>
              <span class="ui-rcp__state-label">Checkpoints · ${n}</span>
            </span>
            <span class="ui-rcp__pill" data-status=${this.status}>${live ? html`<span class="ui-rcp__pulse" aria-hidden="true"></span>` : nothing}${STATUS_TEXT[this.status]}<span class="ui-rcp__sr"> run</span></span>
          </div>
          <h3 class="ui-rcp__title" id=${`${this.uid}-title`}>${this.heading || "Run checkpoints"}</h3>
        </div>
        ${n ? this.renderStrip(range) : nothing}
        ${n
          ? html`<ol class="ui-rcp__list" role="listbox" aria-label="Restore points" @keydown=${this.onListKey}>
              ${repeat(
                list,
                (c) => c.id,
                (c, j) => this.renderRow(c, j, n, tabbable),
              )}
            </ol>`
          : html`<p class="ui-rcp__empty">No checkpoints yet</p>`}
        ${this.renderPanel()}
        ${clean ? foot : nothing}
      </div>
      ${clean ? nothing : foot}
      <p class="ui-rcp__sr" role="status" aria-live="polite">${this.message}</p>
    `;
  }

  static override css = /* css */ `
/* Colours and sizes as variables – override them on [data-ui="rcp"] */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rcp"] {
  /* The picked marker and the kept part of the strip */
  --tc-run-checkpoints-accent: var(--tc-meter-fill);
  --tc-run-checkpoints-on-accent: var(--tc-text-on-accent);
  /* What going back discards: a hatch on the strip */
  --tc-run-checkpoints-drop: light-dark(rgba(196, 50, 50, 0.32), rgba(255, 110, 110, 0.36));
  --tc-run-checkpoints-inset: var(--tc-space-3-5);
  --tc-run-checkpoints-marker: 20px;
  box-sizing: border-box;
  container-type: inline-size;
  position: relative;
  display: grid;
  width: 100%;
  max-width: 480px;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-sunken);
  color: var(--tc-text-muted);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
  letter-spacing: -0.006em;
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rcp"] {
  --tc-run-checkpoints-accent: light-dark(rgba(0, 96, 226, 0.765), #4d8dff);
  --tc-run-checkpoints-on-accent: var(--tc-text-on-accent);
  --tc-run-checkpoints-drop: light-dark(rgba(196, 50, 50, 0.26), rgba(255, 110, 110, 0.3));
  --tc-run-checkpoints-inset: var(--tc-space-2-5);
  --tc-run-checkpoints-marker: 20px;
  box-sizing: border-box;
  container-type: inline-size;
  position: relative;
  display: grid;
  width: 100%;
  max-width: 460px;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="rcp"] *, [data-ui="rcp"] *::before, [data-ui="rcp"] *::after { box-sizing: border-box; }
[data-ui="rcp"] svg { display: block; width: 100%; height: 100%; overflow: visible; }
:where([data-ui="rcp"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; letter-spacing: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="rcp"]) :is(h3, h4, p, ol, ul, section) { margin: 0; padding: 0; }
:where([data-ui="rcp"]) :is(ol, ul) { list-style: none; }
.ui-rcp__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* The white card: Standard sits on the gray tray, Clean is the whole component */
.ui-rcp__card { position: relative; background: var(--tc-surface-raised); }
:where([data-look="standard"], [data-look="standard"] *).ui-rcp__card { border-radius: var(--tc-card-radius); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-rcp__card { border-radius: var(--tc-card-radius); box-shadow: var(--tc-card-shadow); }
/* Header: a quiet status line with the run's pill, then the goal */
.ui-rcp__head { display: grid; gap: var(--tc-space-1); }
:where([data-look="standard"], [data-look="standard"] *).ui-rcp__head { padding: var(--tc-space-4) var(--tc-space-4-5) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-rcp__head { padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-2); }
.ui-rcp__meta { display: flex; align-items: center; gap: var(--tc-space-2-5); min-height: 20px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-rcp__state { display: inline-flex; align-items: center; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-rcp__state { gap: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-rcp__state { gap: var(--tc-space-1-5); }
.ui-rcp__state-label { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
.ui-rcp__state-icon { flex: none; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-rcp__state-icon { width: 13px; height: 13px; stroke-width: 1.5; }
:where([data-look="clean"], [data-look="clean"] *).ui-rcp__state-icon { width: 16px; height: 16px; stroke-width: 1.1; color: var(--tc-icon-muted); }
/* The run's pill – trace-waterfall's live pill */
.ui-rcp__pill { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-pill-h); margin-left: auto; padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-rcp__pill { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-rcp__pill { color: var(--tc-text-secondary); }
.ui-rcp__pill[data-status="running"] { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-rcp__pill[data-status="done"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-rcp__pill[data-status="failed"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-rcp__pulse { width: 6px; height: 6px; border-radius: 50%; background: currentColor; animation: ui-rcp-pulse var(--tc-duration-shimmer) var(--tc-ease-in-out) 3; }
.ui-rcp__title { margin: 0; overflow-wrap: anywhere; text-wrap: balance; font-size: var(--tc-font-size-lg-plus); }
:where([data-look="standard"], [data-look="standard"] *).ui-rcp__title { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-relaxed); letter-spacing: -0.012em; }
:where([data-look="clean"], [data-look="clean"] *).ui-rcp__title { color: var(--tc-text-strong); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-loose); }
/* ----- The strip: the run as a line, solid where going back keeps it, hatched where it discards ----- */
.ui-rcp__strip { padding: var(--tc-space-2) var(--tc-space-5) var(--tc-space-1); }
.ui-rcp__line { position: relative; height: 14px; }
.ui-rcp__kept, .ui-rcp__cut { position: absolute; top: calc(50% - 1.5px); height: 3px; border-radius: var(--tc-radius-full); }
.ui-rcp__kept { left: 0; width: var(--tc-run-checkpoints-cut); background: var(--tc-meter-fill); transition: width var(--tc-duration-slow) var(--tc-ease-move); }
.ui-rcp__cut { left: var(--tc-run-checkpoints-cut); right: 0; background: var(--tc-meter-track); transition: left var(--tc-duration-slow) var(--tc-ease-move), background-color var(--tc-duration-base) var(--tc-ease-standard); }
[data-ui="rcp"][data-picked] .ui-rcp__cut { background: repeating-linear-gradient(-45deg, var(--tc-run-checkpoints-drop) 0 2px, transparent 2px 4px); }
.ui-rcp__dot {
  position: absolute;
  top: calc(50% - 4px);
  left: calc(var(--x) - 4px);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--tc-surface-raised);
  box-shadow: inset 0 0 0 1.5px var(--tc-text-muted);
  cursor: pointer;
  transition: transform var(--tc-duration-base) var(--tc-ease-move), box-shadow var(--tc-duration-base) var(--tc-ease-standard), background-color var(--tc-duration-base) var(--tc-ease-standard);
  animation: ui-rcp-pop var(--tc-duration-slow) var(--tc-ease-move) both;
}
.ui-rcp__dot:hover { transform: scale(1.3); }
.ui-rcp__dot[data-step="active"] { box-shadow: inset 0 0 0 1.5px var(--tc-accent-text); }
.ui-rcp__dot[data-step="failed"] { box-shadow: inset 0 0 0 1.5px var(--tc-status-danger-solid); }
.ui-rcp__dot[data-discard] { box-shadow: inset 0 0 0 1.5px var(--tc-run-checkpoints-drop); }
.ui-rcp__dot[data-locked] { box-shadow: inset 0 0 0 1px var(--tc-text-disabled); cursor: default; }
.ui-rcp__dot[data-picked] { z-index: 1; background: var(--tc-run-checkpoints-accent); box-shadow: 0 0 0 3px var(--tc-surface-raised); transform: scale(1.35); }
/* Where the live run is now */
.ui-rcp__now { position: absolute; top: calc(50% - 5px); right: -1px; width: 2px; height: 10px; border-radius: var(--tc-radius-full); background: var(--tc-accent-text); animation: ui-rcp-blink var(--tc-duration-shimmer) var(--tc-ease-in-out) 3; }
.ui-rcp__ticks { position: relative; display: flex; justify-content: space-between; height: 16px; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; }
.ui-rcp__at { position: absolute; left: var(--x); padding: 0 var(--tc-space-1); background: var(--tc-surface-raised); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); transform: translateX(-50%); transition: left var(--tc-duration-slow) var(--tc-ease-move); }
/* ----- The steps: agent-plan's list ----- */
.ui-rcp__list { position: relative; padding: var(--tc-space-1) var(--tc-space-1-5) var(--tc-space-1-5); }
.ui-rcp__row {
  position: relative;
  display: grid;
  grid-template-columns: var(--tc-run-checkpoints-marker) minmax(0, 1fr) auto;
  align-items: start;
  padding: var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-2) var(--tc-run-checkpoints-inset);
  outline: none;
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-rcp__row { column-gap: var(--tc-space-3); border-radius: var(--tc-radius-lg); }
:where([data-look="clean"], [data-look="clean"] *).ui-rcp__row { column-gap: var(--tc-space-2-5); border-radius: var(--tc-radius-sm); }
:where([data-look="standard"], [data-look="standard"] *).ui-rcp__row:hover { background: var(--tc-fill-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-rcp__row:hover { background: var(--tc-fill-subtle); }
.ui-rcp__row[aria-disabled="true"] { cursor: default; }
.ui-rcp__row[aria-disabled="true"]:hover { background: none; }
/* Picked: the selected fill plus a bar on the left edge, so it doesn't rest on colour alone */
.ui-rcp__row[aria-selected="true"], .ui-rcp__row[aria-selected="true"]:hover { background: var(--tc-fill-selected); box-shadow: inset var(--tc-focus-ring-width) 0 0 var(--tc-border-selected); }
.ui-rcp__row:focus-visible { box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
@media (forced-colors: active) { .ui-rcp__row:focus-visible { outline: 2px solid Highlight; outline-offset: -2px; } }
/* Marker: the step's number in a ring → spinner while it runs → filled when picked */
.ui-rcp__marker {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  justify-self: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--tc-surface-raised);
  color: var(--tc-text-muted);
  font-size: var(--tc-font-size-xs);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-none);
  font-variant-numeric: tabular-nums;
  transition: background-color var(--tc-duration-slow) var(--tc-ease-standard), color var(--tc-duration-slow) var(--tc-ease-standard), box-shadow var(--tc-duration-slow) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-rcp__marker { box-shadow: inset 0 0 0 1px var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-rcp__marker { box-shadow: var(--tc-shadow-raised); }
.ui-rcp__row[data-step="active"] .ui-rcp__marker { box-shadow: none; color: var(--tc-accent-text); }
.ui-rcp__row[data-step="failed"] .ui-rcp__marker { background: var(--tc-status-danger-bg); box-shadow: none; color: var(--tc-status-danger-fg); }
.ui-rcp__row[aria-selected="true"] .ui-rcp__marker { background: var(--tc-run-checkpoints-accent); box-shadow: none; color: var(--tc-run-checkpoints-on-accent); }
.ui-rcp__row[aria-disabled="true"] .ui-rcp__marker { box-shadow: none; outline: 1px dashed var(--tc-text-disabled); outline-offset: -1px; }
.ui-rcp__marker > * { grid-area: 1 / 1; animation: ui-rcp-pop var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-rcp__num { animation: none !important; }
.ui-rcp__marker .ui-rcp__spinner { width: 14px; height: 14px; }
.ui-rcp__spinner line { stroke: currentColor; stroke-linecap: round; opacity: 0.18; animation: ui-rcp-ray var(--tc-duration-reveal) linear infinite; }
:where([data-look="standard"], [data-look="standard"] *).ui-rcp__spinner line { stroke-width: 1.7; }
:where([data-look="clean"], [data-look="clean"] *).ui-rcp__spinner line { stroke-width: 1.4; }
[data-ui="rcp"][data-offscreen] .ui-rcp__spinner line { animation-play-state: paused; }
.ui-rcp__mark { width: 12px !important; height: 12px !important; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-rcp__mark { stroke-width: 1.9; }
:where([data-look="clean"], [data-look="clean"] *).ui-rcp__mark { stroke-width: 1.6; }
/* The rail between markers – dashed where going back discards */
.ui-rcp__rail { position: absolute; top: calc(var(--tc-space-2) + 22px); bottom: -6px; left: calc(var(--tc-run-checkpoints-inset) + 9.5px); width: 1px; background: var(--tc-border-default); pointer-events: none; }
.ui-rcp__row[aria-selected="true"] .ui-rcp__rail,
.ui-rcp__row[data-discard] .ui-rcp__rail { background: repeating-linear-gradient(180deg, var(--tc-run-checkpoints-drop) 0 3px, transparent 3px 6px); }
/* Text */
.ui-rcp__main { display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-rcp__name { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; transition: color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-rcp__sub { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); min-width: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
:where([data-look="standard"], [data-look="standard"] *).ui-rcp__sub { line-height: var(--tc-line-height-snug); }
:where([data-look="clean"], [data-look="clean"] *).ui-rcp__sub { line-height: var(--tc-line-height-tight); }
.ui-rcp__detail { min-width: 0; overflow-wrap: anywhere; }
.ui-rcp__tool { padding: 0 var(--tc-space-1-5); background: var(--tc-fill-default); color: var(--tc-text-secondary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-relaxed); letter-spacing: 0; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-rcp__tool { border-radius: var(--tc-radius-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-rcp__tool { border-radius: var(--tc-radius-badge); }
/* Discarded by going back: the rows step back, their text stays readable */
.ui-rcp__row[data-discard] .ui-rcp__name { color: var(--tc-text-muted); }
.ui-rcp__row[data-discard] .ui-rcp__marker { opacity: 0.55; }
.ui-rcp__time { display: flex; align-items: center; min-height: 20px; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-rcp__row[aria-selected="true"] .ui-rcp__time { color: var(--tc-text-primary); }
.ui-rcp__lock { color: var(--tc-text-disabled); }
.ui-rcp__empty { padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); text-align: center; }
/* ----- The pick: what it captured, what going back discards, a note for the agent ----- */
.ui-rcp__panel { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-rcp__panel[data-open] { grid-template-rows: 1fr; opacity: 1; }
.ui-rcp__panel-inner { display: grid; gap: var(--tc-space-3); min-height: 0; overflow: hidden; }
.ui-rcp__panel[data-open] .ui-rcp__panel-inner { padding: var(--tc-space-3-5) var(--tc-space-4) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rcp__cols { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--tc-space-4); animation: ui-rcp-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-rcp__col { display: grid; align-content: start; margin: 0; gap: var(--tc-space-1-5); min-width: 0; }
.ui-rcp__caption { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-rcp__facts { display: grid; gap: var(--tc-space-1); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-rcp__facts > li { display: flex; align-items: baseline; gap: var(--tc-space-1-5); min-width: 0; }
.ui-rcp__fact-icon { flex: none; align-self: center; width: 12px; height: 12px; color: var(--tc-status-success-fg); fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.ui-rcp__facts[data-tone="drop"] > li::before { content: ""; flex: none; align-self: center; width: 8px; height: 2px; margin: 0 var(--tc-space-0-5); border-radius: var(--tc-radius-full); background: var(--tc-status-danger-solid); }
.ui-rcp__label { flex: none; color: var(--tc-text-secondary); }
.ui-rcp__value { min-width: 0; margin-left: auto; overflow: hidden; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); text-align: right; text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums; }
.ui-rcp__files { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-regular); }
/* The note: a field like Combobox's */
.ui-rcp__note { display: flex; align-items: center; gap: var(--tc-space-2); height: var(--tc-field-h); padding: 0 var(--tc-field-px); border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); cursor: text; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rcp__note:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-rcp__note:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-rcp__note-icon { flex: none; width: 14px; height: 14px; color: var(--tc-icon-muted); fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-rcp__note-icon { stroke-width: 1.5; }
:where([data-look="clean"], [data-look="clean"] *).ui-rcp__note-icon { width: 16px; height: 16px; stroke-width: 1.1; }
.ui-rcp__note input { flex: 1; min-width: 0; height: 100%; padding: 0; border: 0; background: none; color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); letter-spacing: inherit; outline: none; }
.ui-rcp__note input::placeholder { color: var(--tc-text-placeholder); opacity: 1; }
/* ----- Foot: Standard on the tray below the card, Clean the card's last row ----- */
.ui-rcp__foot { display: flex; align-items: center; gap: var(--tc-space-3); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
:where([data-look="standard"], [data-look="standard"] *).ui-rcp__foot { min-height: 46px; padding: 0 var(--tc-space-1-5) 0 var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-rcp__foot { min-height: 48px; padding: 0 var(--tc-space-2-5) 0 var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); line-height: var(--tc-line-height-tight); }
.ui-rcp__hint { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums; animation: ui-rcp-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-rcp__hint--error { color: var(--tc-status-danger-fg); }
.ui-rcp__sep { margin: 0 var(--tc-space-1-5); color: var(--tc-text-disabled); }
.ui-rcp__actions { display: flex; flex: none; gap: var(--tc-space-2); margin-left: auto; animation: ui-rcp-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
/* Actions look exactly like Button: control geometry, flat ink primary */
.ui-rcp__btn { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-rcp__btn--primary { padding-left: calc(var(--tc-control-px-md) - var(--tc-space-0-5)); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-rcp__btn--primary:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); }
.ui-rcp__btn--primary:active:not(:disabled) { background: var(--tc-action-primary-bg-active); transform: scale(0.97); }
.ui-rcp__btn:disabled { opacity: 0.5; cursor: default; }
.ui-rcp__btn svg { flex: none; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-rcp__btn svg { width: 13px; height: 13px; stroke-width: 1.6; }
:where([data-look="clean"], [data-look="clean"] *).ui-rcp__btn svg { width: 16px; height: 16px; stroke-width: 1.2; }
.ui-rcp__btn:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
@keyframes ui-rcp-in { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }
@keyframes ui-rcp-pop { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; } }
@keyframes ui-rcp-ray { 0% { opacity: 1; } 100% { opacity: 0.18; } }
@keyframes ui-rcp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
@keyframes ui-rcp-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
/* Touch screens: bigger targets */
@media (pointer: coarse) {
  .ui-rcp__btn { height: var(--tc-control-h-lg); }
  .ui-rcp__dot::after { content: ""; position: absolute; inset: -10px; }
}
/* Narrow: one column for the pick, tighter gutters */
@container (max-width: 400px) {
  .ui-rcp__cols { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-3); }
  :where([data-look="standard"], [data-look="standard"] *).ui-rcp__head { padding: var(--tc-space-3-5) var(--tc-space-3-5) var(--tc-space-2); }
  :where([data-look="clean"], [data-look="clean"] *).ui-rcp__head { padding: var(--tc-space-3-5) var(--tc-space-3-5) var(--tc-space-2); }
  .ui-rcp__strip { padding-inline: var(--tc-space-4); }
  .ui-rcp__list { padding-inline: var(--tc-space-1); }
  .ui-rcp__panel[data-open] .ui-rcp__panel-inner { padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-3-5); }
  :where([data-look="standard"], [data-look="standard"] *).ui-rcp__foot { padding-left: var(--tc-space-2-5); }
  :where([data-look="clean"], [data-look="clean"] *).ui-rcp__foot { padding-left: var(--tc-space-3-5); }
}
@container (max-width: 340px) {
  .ui-rcp__foot .ui-rcp__hint { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="rcp"] *, [data-ui="rcp"] *::before, [data-ui="rcp"] *::after { animation: none !important; transition: none !important; }
  .ui-rcp__spinner line { opacity: 0.6; }
}
`;
}

if (!customElements.get("tc-run-checkpoints")) customElements.define("tc-run-checkpoints", TcRunCheckpoints);

declare global {
  interface HTMLElementTagNameMap {
    "tc-run-checkpoints": TcRunCheckpoints;
  }
}
