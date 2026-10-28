import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController } from "./internal/controllers";
import { safeUrl } from "./internal/safe-url";
import { formatDate } from "./internal/util";

/*
 * <tc-status-tracker> – where a piece of work stands in a fixed sequence of steps: gates to clear, stages to pass,
 * reviews to sign off. The steps sit on a line, each a ringed marker – ✓ cleared, its number pending (with a "!" when
 * it needs attention), × blocked, its number greyed when not reached – with "GATE 5", its name, the status in words
 * and the date beneath. The line between two steps fills once the first is cleared, and the current step (the first
 * not cleared) wears a soft halo. A step's record – summary, owner and evidence – opens below on click or Enter.
 *   · the steps are an ordered list of buttons with one tab stop: ← / → (↑ / ↓ when vertical) and Home / End move,
 *     Enter or Space opens a step's record, Escape closes it; Close returns focus to the step
 *   · narrower than 480 px, or with orientation="vertical", the steps stack with the line down the left; many steps
 *     scroll sideways with the current one in view
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-status-tracker noun="Gate" .steps=${[{ id: "scope", label: "Pre-registration & scope", status: "cleared" }, …]}></tc-status-tracker>
 */

/** list-checks: Lucide (ISC, lucide.dev) */
const trackerIcon = svg`<path d="m3 17 2 2 4-4"></path><path d="m3 7 2 2 4-4"></path><path d="M13 6h8"></path><path d="M13 12h8"></path><path d="M13 18h8"></path>`;

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";
/** How a status looks: its name, tone and mark – and whether it counts as done (fills the line, counts as cleared) */
export type StatusTrackerStatus = { label: string; tone: StatusTone; mark?: "check" | "cross" | "number"; done?: boolean };
export type StatusTrackerItem = { label: string; value?: string; href?: string };
export type StatusTrackerStep = {
  id: string;
  label: string;
  /** A key of `statuses`: cleared, pending, blocked, not-reached, or your own */
  status: string;
  /** When it reached its status, as epoch ms */
  date?: number;
  /** One quiet line under the date */
  note?: string;
  /** Marks the step with a "!"; a string says why */
  attention?: boolean | string;
  /** Its record, shown when the step is opened */
  detail?: { summary?: string; owner?: string; items?: StatusTrackerItem[] };
};

/** Details of the events */
export type StatusTrackerSelectedChange = { selected: string | null; step?: StatusTrackerStep };

/** The statuses used when the page gives none; `statuses` is merged over them */
export const defaultTrackerStatuses: Record<string, StatusTrackerStatus> = {
  cleared: { label: "Cleared", tone: "success", mark: "check", done: true },
  pending: { label: "Pending", tone: "warning", mark: "number" },
  blocked: { label: "Blocked", tone: "danger", mark: "cross" },
  "not-reached": { label: "Not reached", tone: "neutral", mark: "number" },
};

let uidCount = 0;

/* check, x, close: Lucide (ISC, lucide.dev) */
const glyph = (size: number, body: ReturnType<typeof svg>, width = 2.4) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=${width} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const checkMark = () => glyph(16, svg`<path d="M20 6 9 17l-5-5"></path>`);
const crossMark = () => glyph(16, svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);
const closeIcon = () => glyph(14, svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`, 1.9);
/** The "!" badge – drawn, so it isn't text to read twice */
const bang = () =>
  html`<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M5 2v3.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path><circle cx="5" cy="7.6" r="0.9" fill="currentColor"></circle></svg>`;

/**
 * A status tracker – a fixed sequence of steps on a line, each cleared, pending, blocked or not reached, with the line
 * filling as steps clear, the current step marked, a legend, and a step's record on click or Enter.
 * @tag tc-status-tracker
 * @fires tc-selected-change - A step's record opened or closed ({ selected, step }: StatusTrackerSelectedChange); cancelable – prevented, `selected` stays as it was
 */
export class TcStatusTracker extends TcElement {
  static override ui = "stk";

  /** The heading, and the list's name */
  @property() accessor heading = "Status";
  /** The line under the heading; by default the count cleared, e.g. "4 of 9 gates cleared" */
  @property() accessor description: string | undefined = undefined;
  /** Added after the default description, e.g. "click any gate for its evidence record" */
  @property() accessor hint: string | undefined = undefined;
  /** The steps, in order */
  @property({ attribute: false }) accessor steps: StatusTrackerStep[] = [];
  /** Statuses by key, merged over the defaults (cleared, pending, blocked, not-reached) */
  @property({ attribute: false }) accessor statuses: Record<string, StatusTrackerStatus> = {};
  /** What a step is called: "Gate" shows "GATE 3" over each name; empty hides it */
  @property() accessor noun = "Step";
  /** The noun's plural, for the count; by default the noun with an "s" */
  @property({ attribute: "noun-plural" }) accessor nounPlural: string | undefined = undefined;
  /** "horizontal" (the default; stacks below 480 px) or "vertical" */
  @property({ reflect: true }) accessor orientation: "horizontal" | "vertical" = "horizontal";
  /** Shows the statuses in use beside the heading */
  @property({ type: Boolean }) accessor legend = true;
  /** The step whose record is open. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property({ attribute: false }) accessor selected: string | null = null;
  /** The language for dates, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor active = 0;
  @state() private accessor narrow = false;
  @state() private accessor announce = "";

  private uid = `tc-stk-${++uidCount}`;
  private resize?: ResizeObserver;
  private scrolledFor = "";

  constructor() {
    super();
    // Focus never drops to <body> when the record's Close button it was on goes away
    new FocusRescueController(this, () => this.querySelector<HTMLElement>('.ui-stk__step[tabindex="0"]'));
  }

  override connectedCallback() {
    super.connectedCallback();
    this.resize = new ResizeObserver(() => {
      const narrow = this.getBoundingClientRect().width < 480;
      if (narrow !== this.narrow) this.narrow = narrow;
    });
    this.resize.observe(this);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.resize?.disconnect();
  }

  /* ---------- The model ---------- */

  private statusOf(key: string): StatusTrackerStatus {
    return this.statuses[key] ?? defaultTrackerStatuses[key] ?? { label: key.replace(/^./, (c) => c.toUpperCase()).replace(/-/g, " "), tone: "neutral", mark: "number" };
  }
  private isDone(step: StatusTrackerStep) {
    return !!this.statusOf(step.status).done;
  }
  /** The first step not done; -1 when all are */
  private get current() {
    return this.steps.findIndex((s) => !this.isDone(s));
  }
  private get vertical() {
    return this.orientation === "vertical" || this.narrow;
  }
  private get plural() {
    return this.nounPlural ?? (this.noun ? `${this.noun}s` : "steps");
  }
  private get count() {
    return `${this.steps.filter((s) => this.isDone(s)).length} of ${this.steps.length} ${this.plural.toLowerCase()} cleared`;
  }
  private date(ms: number) {
    return formatDate(ms, this.locale, { month: "short", day: "numeric" });
  }
  private longDate(ms: number) {
    return formatDate(ms, this.locale, { month: "long", day: "numeric", year: "numeric" });
  }
  private name(i: number) {
    return this.noun ? `${this.noun} ${i + 1}` : `${i + 1}`;
  }
  private reason(step: StatusTrackerStep) {
    return typeof step.attention === "string" ? step.attention : "";
  }

  private setSelected(next: string | null) {
    if (next === this.selected) return;
    const step = next === null ? undefined : this.steps.find((s) => s.id === next);
    if (!this.emit<StatusTrackerSelectedChange>("tc-selected-change", { selected: next, step }, { cancelable: true })) return;
    this.selected = next;
    if (step) {
      const i = this.steps.indexOf(step);
      this.announce = `${this.name(i)}, ${step.label}: ${this.statusOf(step.status).label}. Record shown`;
    } else this.announce = "Record closed";
  }

  /* ---------- Keyboard ---------- */

  private focusStep(i: number) {
    if (!this.steps.length) return;
    this.active = Math.max(0, Math.min(this.steps.length - 1, i));
    void this.updateComplete.then(() => {
      const el = this.querySelector<HTMLElement>(`.ui-stk__step[data-index="${this.active}"]`);
      el?.focus({ preventScroll: true });
      el?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    });
  }

  private onKey = (e: KeyboardEvent) => {
    const step = (e.target as HTMLElement).closest<HTMLElement>(".ui-stk__step");
    if (!step || e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const i = Number(step.dataset.index);
    const [back, next] = this.vertical ? ["ArrowUp", "ArrowDown"] : ["ArrowLeft", "ArrowRight"];
    const to = e.key === back ? i - 1 : e.key === next ? i + 1 : e.key === "Home" ? 0 : e.key === "End" ? this.steps.length - 1 : null;
    if (to !== null) {
      e.preventDefault();
      this.focusStep(to);
    } else if (e.key === "Escape" && this.selected !== null) {
      e.preventDefault();
      this.setSelected(null);
    }
  };

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (this.active >= this.steps.length) this.active = Math.max(0, this.steps.length - 1);
    // The tab stop starts on the current step, or the open one
    if (changed.has("steps") && !changed.get("steps")?.length) {
      const open = this.steps.findIndex((s) => s.id === this.selected);
      this.active = open >= 0 ? open : Math.max(0, this.current);
    }
    if (this.selected !== null && !this.steps.some((s) => s.id === this.selected)) this.selected = null;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    // The current step starts in view when the steps scroll sideways, and again when it moves on
    const key = `${this.current}:${this.steps.length}:${this.vertical}`;
    if (key === this.scrolledFor) return;
    this.scrolledFor = key;
    const scroll = this.querySelector<HTMLElement>(".ui-stk__scroll");
    const item = this.querySelector<HTMLElement>(`.ui-stk__item[data-index="${Math.max(0, this.current)}"]`);
    if (!scroll || !item || this.vertical || scroll.scrollWidth <= scroll.clientWidth) return;
    scroll.scrollLeft = item.offsetLeft - (scroll.clientWidth - item.offsetWidth) / 2;
  }

  /* ---------- Rendering ---------- */

  private renderMarker(step: StatusTrackerStep, i: number) {
    const st = this.statusOf(step.status);
    const mark = st.mark ?? "number";
    return html`<span class="ui-stk__marker" aria-hidden="true">
      ${mark === "check" ? checkMark() : mark === "cross" ? crossMark() : html`<span class="ui-stk__num">${i + 1}</span>`}
      ${step.attention ? html`<span class="ui-stk__bang">${bang()}</span>` : nothing}
    </span>`;
  }

  private renderStep(step: StatusTrackerStep, i: number) {
    const st = this.statusOf(step.status);
    const current = i === this.current;
    const open = this.selected === step.id;
    const last = i === this.steps.length - 1;
    return html`<li class="ui-stk__item" data-index=${i} data-tone=${st.tone} data-status=${step.status} ?data-current=${current} ?data-open=${open}>
      ${last ? nothing : html`<span class="ui-stk__line" aria-hidden="true" ?data-filled=${this.isDone(step)}><span class="ui-stk__fill"></span></span>`}
      <button
        type="button"
        class="ui-stk__step"
        data-index=${i}
        tabindex=${i === this.active ? 0 : -1}
        aria-current=${ifDefined(current ? "step" : undefined)}
        aria-expanded=${open ? "true" : "false"}
        aria-controls=${ifDefined(open ? `${this.uid}-detail` : undefined)}
        @focus=${() => {
          if (this.active !== i) this.active = i;
        }}
        @click=${() => {
          this.active = i;
          this.setSelected(open ? null : step.id);
        }}
      >
        ${this.renderMarker(step, i)}
        <span class="ui-stk__text">
          ${this.noun
            ? html`<span class="ui-stk__noun">${this.name(i)}</span><span class="ui-stk__sr"> of ${this.steps.length},</span>`
            : html`<span class="ui-stk__sr">${i + 1} of ${this.steps.length},</span>`}
          <span class="ui-stk__label">${step.label}<span class="ui-stk__sr">,</span></span>
          <span class="ui-stk__foot">
            <span class="ui-stk__status">${st.label}</span>
            ${step.date !== undefined ? html`<span class="ui-stk__date"><span class="ui-stk__sr">, </span>${this.date(step.date)}</span>` : nothing}
            ${step.note ? html`<span class="ui-stk__note"><span class="ui-stk__sr">, </span>${step.note}</span>` : nothing}
            ${step.attention ? html`<span class="ui-stk__sr">, needs attention${this.reason(step) ? `: ${this.reason(step)}` : ""}</span>` : nothing}
          </span>
        </span>
      </button>
    </li>`;
  }

  private renderLegend() {
    const used = [...new Set(this.steps.map((s) => s.status))];
    const order = [...Object.keys(defaultTrackerStatuses), ...Object.keys(this.statuses)];
    used.sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
    return html`<ul class="ui-stk__legend" aria-label="Legend">
      ${used.map((key) => {
        const st = this.statusOf(key);
        return html`<li class="ui-stk__key" data-tone=${st.tone}><span class="ui-stk__swatch" aria-hidden="true"></span>${st.label}</li>`;
      })}
    </ul>`;
  }

  private renderDetail() {
    const i = this.steps.findIndex((s) => s.id === this.selected);
    if (i < 0) return nothing;
    const step = this.steps[i];
    const st = this.statusOf(step.status);
    const d = step.detail ?? {};
    const id = this.uid;
    return html`<section class="ui-stk__detail" id=${`${id}-detail`} data-tone=${st.tone} aria-labelledby=${`${id}-detail-title`}>
      <div class="ui-stk__detail-head">
        <h4 class="ui-stk__detail-title" id=${`${id}-detail-title`}>${this.noun ? html`${this.name(i)}<span class="ui-stk__dot" aria-hidden="true"> · </span><span class="ui-stk__sr">: </span>` : nothing}${step.label}</h4>
        <span class="ui-stk__pill">${st.label}</span>
        <button
          type="button"
          class="ui-stk__close"
          aria-label="Close record"
          @click=${() => {
            this.setSelected(null);
            this.focusStep(i);
          }}
        >${closeIcon()}</button>
      </div>
      ${step.date !== undefined || d.owner
        ? html`<p class="ui-stk__meta">${[step.date !== undefined ? this.longDate(step.date) : "", d.owner ?? ""].filter(Boolean).join(" · ")}</p>`
        : nothing}
      ${step.attention ? html`<p class="ui-stk__attention"><span class="ui-stk__bang" aria-hidden="true">${bang()}</span>${this.reason(step) || "Needs attention"}</p>` : nothing}
      <p class="ui-stk__summary">${d.summary ?? (this.isDone(step) ? "No record attached." : "Nothing recorded yet.")}</p>
      ${d.items?.length
        ? html`<dl class="ui-stk__items">
            ${d.items.map(
              (it) => html`<div class="ui-stk__row">
                <dt>${it.label}</dt>
                <dd>${safeUrl(it.href) ? html`<a class="ui-stk__link" href=${ifDefined(safeUrl(it.href))}>${it.value ?? "Open"}</a>` : (it.value ?? "–")}</dd>
              </div>`,
            )}
          </dl>`
        : nothing}
    </section>`;
  }

  protected override render() {
    const id = this.uid;
    const empty = !this.steps.length;
    const line = this.description ?? (empty ? undefined : [this.count, this.hint].filter(Boolean).join(" · "));
    return html`
      <span class="ui-stk__sr" role="status">${this.announce}</span>
      ${cardHead({ icon: trackerIcon, title: this.heading, subtitle: line, id: `${id}-title`, aside: this.legend && !empty ? this.renderLegend() : nothing })}
      <div class="ui-stk__card">
        ${empty
          ? html`<p class="ui-stk__empty">No ${this.plural.toLowerCase()} yet.</p>`
          : html`<div class="ui-stk__scroll">
                <ol class="ui-stk__list" aria-labelledby=${`${id}-title`} ?data-vertical=${this.vertical} style=${`--tc-stk-count: ${this.steps.length}`} @keydown=${this.onKey}>
                  ${repeat(this.steps, (s) => s.id, (s, i) => this.renderStep(s, i))}
                </ol>
              </div>
              ${this.renderDetail()}`}
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="stk"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="stk"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* The marker's size and each tone's ink, wash and words – override any of them on the element */
[data-ui="stk"] { --tc-stk-marker: 36px; --tc-stk-step: 132px; }
[data-ui="stk"] [data-tone="success"] { --tc-stk-ink: var(--tc-status-success-solid); --tc-stk-wash: var(--tc-status-success-bg); --tc-stk-fg: var(--tc-status-success-fg); }
[data-ui="stk"] [data-tone="warning"] { --tc-stk-ink: var(--tc-status-warning-solid); --tc-stk-wash: var(--tc-status-warning-bg); --tc-stk-fg: var(--tc-status-warning-fg); }
[data-ui="stk"] [data-tone="danger"] { --tc-stk-ink: var(--tc-status-danger-solid); --tc-stk-wash: var(--tc-status-danger-bg); --tc-stk-fg: var(--tc-status-danger-fg); }
[data-ui="stk"] [data-tone="info"] { --tc-stk-ink: var(--tc-status-info-solid); --tc-stk-wash: var(--tc-status-info-bg); --tc-stk-fg: var(--tc-status-info-fg); }
[data-ui="stk"] [data-tone="neutral"] { --tc-stk-ink: var(--tc-border-control); --tc-stk-wash: var(--tc-fill-subtle); --tc-stk-fg: var(--tc-text-muted); }
[data-ui="stk"] *, [data-ui="stk"] *::before, [data-ui="stk"] *::after { box-sizing: border-box; }
:where([data-ui="stk"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="stk"] ol, [data-ui="stk"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="stk"] h4, [data-ui="stk"] p, [data-ui="stk"] dl, [data-ui="stk"] dd { margin: 0; }
[data-ui="stk"] svg { display: block; flex: none; }
.ui-stk__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-stk__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* ----- The legend, beside the heading ----- */
.ui-stk__legend { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-3); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); }
.ui-stk__key { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-stk__swatch { width: 12px; height: 12px; border-radius: var(--tc-radius-full); box-shadow: inset 0 0 0 2px var(--tc-stk-ink); }
/* ----- The steps: a column each, on one line ----- */
.ui-stk__scroll { overflow-x: auto; padding: var(--tc-space-5) var(--tc-space-2) var(--tc-space-4); scrollbar-width: thin; }
:where([data-look="clean"], [data-look="clean"] *).ui-stk__scroll { padding-top: var(--tc-space-3); }
.ui-stk__list { position: relative; display: grid; grid-template-columns: repeat(var(--tc-stk-count), minmax(var(--tc-stk-step), 1fr)); }
.ui-stk__item { position: relative; display: flex; min-width: 0; }
.ui-stk__step { position: relative; z-index: 1; flex: 1; display: flex; flex-direction: column; align-items: center; gap: var(--tc-space-2); min-width: 0; padding: 0 var(--tc-space-2) var(--tc-space-1); border-radius: var(--tc-radius-lg); text-align: center; outline: none; }
.ui-stk__step:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* The marker: a ring in the status's ink around its mark */
.ui-stk__marker { position: relative; display: grid; flex: none; place-items: center; width: var(--tc-stk-marker); height: var(--tc-stk-marker); border-radius: var(--tc-radius-full); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 2px var(--tc-stk-ink); color: var(--tc-stk-fg); transition: box-shadow var(--tc-duration-moderate) var(--tc-ease-standard), color var(--tc-duration-moderate) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *) .ui-stk__marker { background: var(--tc-surface-on-tray); }
.ui-stk__num { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; }
.ui-stk__item[data-tone="neutral"] .ui-stk__num { color: var(--tc-text-secondary); }
/* The current step wears a soft halo */
.ui-stk__item[data-current] .ui-stk__marker { box-shadow: inset 0 0 0 2px var(--tc-stk-ink), 0 0 0 5px var(--tc-stk-wash); }
.ui-stk__step:hover .ui-stk__marker { box-shadow: inset 0 0 0 2px var(--tc-stk-ink), 0 0 0 5px var(--tc-fill-subtle); }
.ui-stk__item[data-current] .ui-stk__step:hover .ui-stk__marker { box-shadow: inset 0 0 0 2px var(--tc-stk-ink), 0 0 0 5px var(--tc-stk-wash); }
.ui-stk__item[data-open] .ui-stk__marker { box-shadow: inset 0 0 0 2px var(--tc-stk-ink), 0 0 0 2px var(--tc-surface-raised), 0 0 0 4px var(--tc-stk-ink); }
/* The "!" badge – the reason is in words in the step's name and record */
.ui-stk__bang { display: grid; place-items: center; width: 16px; height: 16px; border-radius: var(--tc-radius-full); background: var(--tc-status-warning-solid); color: var(--tc-surface-raised); }
.ui-stk__marker > .ui-stk__bang { position: absolute; top: -4px; right: -4px; box-shadow: 0 0 0 2px var(--tc-surface-raised); }
/* The line to the next step, filling once this one is done */
.ui-stk__line { position: absolute; top: calc(var(--tc-stk-marker) / 2 - 1.5px); left: calc(50% + var(--tc-stk-marker) / 2 + 4px); width: calc(100% - var(--tc-stk-marker) - 8px); height: 3px; overflow: hidden; border-radius: var(--tc-radius-full); background: var(--tc-border-subtle); }
.ui-stk__fill { display: block; width: 100%; height: 100%; background: var(--tc-status-success-solid); transform: scaleX(0); transform-origin: left; transition: transform var(--tc-duration-slow) var(--tc-ease-move); }
.ui-stk__line[data-filled] > .ui-stk__fill { transform: none; }
/* The words under the marker */
.ui-stk__text { flex: 1; display: flex; flex-direction: column; align-items: center; gap: var(--tc-space-0-5); min-width: 0; }
.ui-stk__noun { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-tracking-caps); text-transform: uppercase; color: var(--tc-text-muted); }
.ui-stk__label { flex: 1; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-strong); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); overflow-wrap: break-word; }
.ui-stk__foot { display: flex; flex-direction: column; align-items: center; gap: var(--tc-space-0-5); margin-top: var(--tc-space-2); }
.ui-stk__status { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); letter-spacing: var(--tc-tracking-caps); text-transform: uppercase; color: var(--tc-stk-fg); }
.ui-stk__date, .ui-stk__note { font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
/* ----- Vertical: the line down the left, the words beside each marker ----- */
.ui-stk__list[data-vertical] { grid-template-columns: minmax(0, 1fr); }
.ui-stk__list[data-vertical] .ui-stk__step { flex-direction: row; align-items: flex-start; gap: var(--tc-space-3); padding: 0 var(--tc-space-2) var(--tc-space-4); text-align: left; }
.ui-stk__list[data-vertical] .ui-stk__text { align-items: flex-start; padding-top: var(--tc-space-0-5); }
.ui-stk__list[data-vertical] .ui-stk__foot { flex-direction: row; flex-wrap: wrap; align-items: baseline; gap: var(--tc-space-0-5) var(--tc-space-2); margin-top: var(--tc-space-1); }
.ui-stk__list[data-vertical] .ui-stk__line { top: calc(var(--tc-stk-marker) + 4px); bottom: 4px; left: calc(var(--tc-space-2) + var(--tc-stk-marker) / 2 - 1.5px); width: 3px; height: auto; }
.ui-stk__list[data-vertical] .ui-stk__fill { transform: scaleY(0); transform-origin: top; }
.ui-stk__list[data-vertical] .ui-stk__line[data-filled] > .ui-stk__fill { transform: none; }
.ui-stk__list[data-vertical] .ui-stk__item:last-child .ui-stk__step { padding-bottom: 0; }
.ui-stk__empty { padding: var(--tc-space-6) var(--tc-space-4) !important; color: var(--tc-text-muted); text-align: center; }
/* ----- A step's record ----- */
.ui-stk__detail { display: grid; gap: var(--tc-space-2); margin: 0 var(--tc-space-3) var(--tc-space-3); padding: var(--tc-space-3) var(--tc-space-3-5); border-radius: var(--tc-radius-lg); background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); animation: ui-stk-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-stk__detail-head { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-stk__detail-title { flex: 1; min-width: 0; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-stk__dot { color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); }
.ui-stk__pill { display: inline-flex; flex: none; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-stk-wash); color: var(--tc-stk-fg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); }
.ui-stk__detail[data-tone="neutral"] .ui-stk__pill { background: var(--tc-fill-default); }
.ui-stk__close { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); margin-right: calc(-1 * var(--tc-space-1-5)) !important; border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-stk__close:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-stk__close:focus-visible, .ui-stk__link:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-stk__meta { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-stk__attention { display: flex; align-items: center; gap: var(--tc-space-2); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-status-warning-fg); }
.ui-stk__summary { line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-stk__items { display: grid; gap: var(--tc-space-1); padding-top: var(--tc-space-1); border-top: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-stk__row { display: grid; grid-template-columns: minmax(8rem, 1fr) 2fr; gap: var(--tc-space-3); }
.ui-stk__row dt { color: var(--tc-text-muted); }
.ui-stk__row dd { min-width: 0; color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-stk__link { border-radius: var(--tc-radius-xs); color: var(--tc-accent-text); text-decoration: underline; text-underline-offset: 2px; }
@keyframes ui-stk-in { from { opacity: 0; transform: translateY(3px); } }
@media (forced-colors: active) {
  .ui-stk__marker { border: 2px solid CanvasText; }
  .ui-stk__item[data-open] .ui-stk__marker { outline: 2px solid Highlight; }
  .ui-stk__line { background: GrayText; }
  .ui-stk__fill { background: CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="stk"] *, [data-ui="stk"] *::before, [data-ui="stk"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-status-tracker")) customElements.define("tc-status-tracker", TcStatusTracker);

declare global {
  interface HTMLElementTagNameMap {
    "tc-status-tracker": TcStatusTracker;
  }
}
