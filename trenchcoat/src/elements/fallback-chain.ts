import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-fallback-chain> – one request finding a model that answers, as a small flow: the request, then each model in
 * fallback order, waiting, trying, failed, answered or skipped, in a word and a mark. A light runs along the connector to
 * the model being tried a few times and rests; it stays still with reduced motion. A line says how it went, and picking a
 * model shows its reason and how long it took. It shows one request: configure routing with tc-model-routing.
 *   · the models are one tab stop: arrows move between them, Home / End to the ends, Enter or Space opens one, Escape
 *     closes it. Across on a wide page, down on a narrow one
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-fallback-chain request="Summarise the report" .attempts=${attempts}></tc-fallback-chain>
 */

export type FallbackState = "waiting" | "trying" | "failed" | "answered" | "skipped";
export type FallbackAttempt = {
  id: string;
  model: string;
  provider?: string;
  state: FallbackState;
  /** Why it failed or was skipped */
  reason?: string;
  /** How long it took */
  latencyMs?: number;
};
export type FallbackSelectedChange = { selected: string | null; attempt: FallbackAttempt | null };

/** The element's words, every one renameable through `labels` */
export type FallbackChainLabels = {
  request: string;
  models: string;
  waiting: string;
  trying: string;
  failed: string;
  answered: string;
  skipped: string;
  /** {model} */
  answeredFirst: string;
  /** {model}, {n} */
  answeredAfter: string;
  /** {model}, {n}, {total} */
  tryingNow: string;
  /** {n} */
  allFailed: string;
  notStarted: string;
  noModels: string;
  reason: string;
  took: string;
  close: string;
};
export const defaultFallbackChainLabels: FallbackChainLabels = {
  request: "Request",
  models: "Models, in fallback order",
  waiting: "Waiting",
  trying: "Trying",
  failed: "Failed",
  answered: "Answered",
  skipped: "Skipped",
  answeredFirst: "{model} answered first try.",
  answeredAfter: "{model} answered after {n} tries.",
  tryingNow: "Trying {model}, try {n} of {total}.",
  allFailed: "All {n} models failed, so there's no answer.",
  notStarted: "Not started.",
  noModels: "No models to try.",
  reason: "Reason",
  took: "Took",
  close: "Close",
};

const ICON = svg`<path d="M5 12h14"></path><path d="m13 6 6 6-6 6"></path><circle cx="4" cy="12" r="2"></circle>`;
const MARKS: Record<FallbackState, ReturnType<typeof svg>> = {
  waiting: svg`<circle cx="12" cy="12" r="9"></circle>`,
  trying: svg`<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>`,
  failed: svg`<circle cx="12" cy="12" r="9"></circle><path d="m15 9-6 6M9 9l6 6"></path>`,
  answered: svg`<circle cx="12" cy="12" r="9"></circle><path d="m8 12 3 3 5-6"></path>`,
  skipped: svg`<circle cx="12" cy="12" r="9"></circle><path d="M8 12h8"></path>`,
};
let instances = 0;

/**
 * One request finding a model that answers, as a small flow in fallback order.
 * @tag tc-fallback-chain
 * @fires tc-selected-change - A model was opened or closed ({ selected, attempt }: FallbackSelectedChange); cancelable – prevented, `selected` stays as it was
 */
export class TcFallbackChain extends TcElement {
  static override ui = "fbc";

  /** The heading */
  @property() accessor heading = "Fallback chain";
  /** A line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** What was asked, in a few words */
  @property() accessor request = "";
  /** Each model, in fallback order */
  @property({ attribute: false }) accessor attempts: FallbackAttempt[] = [];
  /** The open model's id. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property() accessor selected: string | null = null;
  /** The locale for durations */
  @property() accessor locale: string | undefined = undefined;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<FallbackChainLabels> = {};

  @state() private accessor active = 0;
  private readonly uid = `tc-fbc-${++instances}`;

  private get words(): FallbackChainLabels {
    return { ...defaultFallbackChainLabels, ...this.labels };
  }

  private get summary() {
    const w = this.words;
    const a = this.attempts;
    if (!a.length) return w.noModels;
    const tried = (x: FallbackAttempt) => x.state === "failed" || x.state === "answered" || x.state === "trying";
    const count = a.filter(tried).length;
    const answered = a.find((x) => x.state === "answered");
    if (answered) return (count === 1 ? w.answeredFirst : w.answeredAfter).replace("{model}", answered.model).replace("{n}", String(count));
    const trying = a.find((x) => x.state === "trying");
    if (trying) return w.tryingNow.replace("{model}", trying.model).replace("{n}", String(count)).replace("{total}", String(a.filter((x) => x.state !== "skipped").length));
    if (count && !a.some((x) => x.state === "waiting")) return w.allFailed.replace("{n}", String(count));
    return count ? w.tryingNow.replace("{model}", a.find((x) => x.state === "waiting")!.model).replace("{n}", String(count + 1)).replace("{total}", String(a.filter((x) => x.state !== "skipped").length)) : w.notStarted;
  }

  private select(attempt: FallbackAttempt | null) {
    const selected = attempt?.id ?? null;
    if (selected === this.selected) return;
    if (this.emit<FallbackSelectedChange>("tc-selected-change", { selected, attempt }, { cancelable: true })) this.selected = selected;
  }

  private onKey(e: KeyboardEvent) {
    const last = this.attempts.length - 1;
    const moves: Record<string, number> = { ArrowRight: Math.min(last, this.active + 1), ArrowDown: Math.min(last, this.active + 1), ArrowLeft: Math.max(0, this.active - 1), ArrowUp: Math.max(0, this.active - 1), Home: 0, End: last };
    const next = moves[e.key];
    if (next !== undefined) {
      e.preventDefault();
      this.active = next;
      this.updateComplete.then(() => this.querySelector<HTMLElement>('.ui-fbc__model[tabindex="0"]')?.focus());
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const a = this.attempts[this.active];
      if (a) this.select(a.id === this.selected ? null : a);
    } else if (e.key === "Escape" && this.selected !== null) {
      e.preventDefault();
      this.select(null);
    }
  }

  private duration(ms: number) {
    const opts: Intl.NumberFormatOptions = ms < 1000 ? { style: "unit", unit: "millisecond", unitDisplay: "narrow" } : { style: "unit", unit: "second", unitDisplay: "narrow", maximumFractionDigits: 1 };
    return new Intl.NumberFormat(this.locale, opts).format(ms < 1000 ? ms : ms / 1000);
  }

  private renderDetail(a: FallbackAttempt) {
    const w = this.words;
    return html`<section class="ui-fbc__detail" aria-labelledby=${`${this.uid}-detail`}>
      <h4 class="ui-fbc__detail-name" id=${`${this.uid}-detail`}>${a.model}${a.provider ? html` <span class="ui-fbc__provider">${a.provider}</span>` : nothing}</h4>
      <p class="ui-fbc__state" data-state=${a.state}>${w[a.state]}</p>
      ${a.reason ? html`<p class="ui-fbc__reason"><b>${w.reason}:</b> ${a.reason}</p>` : nothing}
      ${a.latencyMs !== undefined ? html`<p class="ui-fbc__took"><b>${w.took}:</b> ${this.duration(a.latencyMs)}</p>` : nothing}
      <button
        type="button"
        class="tc-btn-sm ui-fbc__close"
        @click=${() => {
          this.select(null);
          this.updateComplete.then(() => this.querySelector<HTMLElement>('.ui-fbc__model[tabindex="0"]')?.focus());
        }}
      >
        ${w.close}
      </button>
    </section>`;
  }

  protected override render() {
    const w = this.words;
    const open = this.attempts.find((a) => a.id === this.selected);
    const done = this.attempts.some((a) => a.state === "answered");
    return html`${cardHead({ icon: ICON, title: this.heading, subtitle: this.description, id: `${this.uid}-title` })}
      <div class="ui-fbc__card">
        <div class="ui-fbc__flow">
          ${this.request ? html`<div class="ui-fbc__request"><span class="ui-fbc__request-label">${w.request}</span><span class="ui-fbc__request-text">${this.request}</span></div>` : nothing}
          ${this.attempts.length
            ? html`<div class="ui-fbc__models" role="listbox" aria-label=${w.models} @keydown=${this.onKey}>
                ${repeat(
                  this.attempts,
                  (a) => a.id,
                  (a, i) => html`<span class="ui-fbc__link" aria-hidden="true" data-active=${a.state === "trying" ? "true" : "false"} data-passed=${a.state === "failed" || a.state === "answered" ? "true" : "false"} ?data-first=${i === 0 && !this.request}></span>
                    <div
                      class="ui-fbc__model"
                      role="option"
                      data-attempt=${a.id}
                      data-state=${a.state}
                      aria-selected=${a.id === this.selected ? "true" : "false"}
                      tabindex=${i === this.active ? 0 : -1}
                      @click=${() => {
                        this.active = i;
                        this.select(a.id === this.selected ? null : a);
                      }}
                    >
                      <span class="ui-fbc__model-name">${a.model}</span>
                      ${a.provider ? html`<span class="ui-fbc__provider">${a.provider}</span>` : nothing}
                      <span class="ui-fbc__state" data-state=${a.state}><svg class="ui-fbc__mark" viewBox="0 0 24 24" aria-hidden="true">${MARKS[a.state]}</svg>${w[a.state]}</span>
                    </div>`,
                )}
              </div>`
            : nothing}
        </div>
        <p class="ui-fbc__summary" role="status" data-done=${done ? "true" : "false"}>${this.summary}</p>
        ${open ? this.renderDetail(open) : nothing}
      </div>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="fbc"] { position: relative; display: block; box-sizing: border-box; width: 100%; container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased; padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="fbc"] { position: relative; display: block; box-sizing: border-box; width: 100%; container-type: inline-size; font-family: var(--tc-font-sans); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); text-align: left; -webkit-font-smoothing: antialiased; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
[data-ui="fbc"] *, [data-ui="fbc"] *::before, [data-ui="fbc"] *::after { box-sizing: border-box; }
[data-ui="fbc"] :where(p, ul, ol, h4) { margin: 0; padding: 0; }
[data-ui="fbc"] { --tc-fbc-bg: var(--tc-surface-raised); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="fbc"] { --tc-fbc-bg: var(--tc-surface-on-tray); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="fbc"] .ui-fbc__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
[data-ui="fbc"] { --tc-fbc-link: var(--tc-space-4); --tc-fbc-beat: var(--tc-duration-reveal); }
.ui-fbc__flow { display: flex; align-items: stretch; min-width: 0; padding: var(--tc-space-4); }
.ui-fbc__request { display: grid; flex: 0 1 10em; align-content: center; gap: var(--tc-space-0-5); min-width: 0; padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-control-radius-md); background: var(--tc-fill-hover); }
.ui-fbc__request-label { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-fbc__request-text { font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-fbc__models { display: flex; flex: 1; align-items: stretch; min-width: 0; }
.ui-fbc__link { position: relative; flex: none; align-self: center; width: var(--tc-fbc-link); height: var(--tc-hairline); overflow: hidden; background: var(--tc-border-subtle); }
.ui-fbc__link[data-first] { display: none; }
.ui-fbc__link[data-passed="true"] { background: var(--tc-text-muted); }
.ui-fbc__link[data-active="true"] { height: var(--tc-space-0-5); background: var(--tc-meter-track); }
.ui-fbc__link[data-active="true"]::after { content: ""; position: absolute; inset: 0; background: var(--tc-meter-fill); animation: ui-fbc-run var(--tc-fbc-beat) var(--tc-ease-move) 3 both; }
@keyframes ui-fbc-run { from { transform: translateX(-100%); } to { transform: none; } }
.ui-fbc__model { display: grid; flex: 1; align-content: center; gap: var(--tc-space-0-5); min-width: 0; padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-control-radius-md); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); cursor: pointer; }
.ui-fbc__model:hover { background: var(--tc-fill-hover); }
.ui-fbc__model[aria-selected="true"] { background: var(--tc-fill-selected); }
.ui-fbc__model:focus-visible, .ui-fbc__close:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-fbc__model[data-state="answered"] { box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-status-success-fg); }
.ui-fbc__model[data-state="skipped"] .ui-fbc__model-name { text-decoration: line-through; color: var(--tc-text-secondary); }
.ui-fbc__model-name { font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-fbc__provider { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-regular); overflow-wrap: anywhere; }
.ui-fbc__state { display: inline-flex; align-items: center; gap: var(--tc-space-1); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-fbc__state[data-state="trying"] { color: var(--tc-status-info-fg); }
.ui-fbc__state[data-state="failed"] { color: var(--tc-status-danger-fg); }
.ui-fbc__state[data-state="answered"] { color: var(--tc-status-success-fg); font-weight: var(--tc-font-weight-medium); }
.ui-fbc__mark { flex: none; width: var(--tc-space-3); height: var(--tc-space-3); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-fbc__summary { padding: var(--tc-space-3) var(--tc-space-4); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); color: var(--tc-text-secondary); }
.ui-fbc__summary[data-done="true"] { color: var(--tc-text-primary); }
.ui-fbc__detail { display: grid; justify-items: start; gap: var(--tc-space-1); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); box-shadow: inset 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-fbc__detail-name { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); }
.ui-fbc__reason, .ui-fbc__took { color: var(--tc-text-secondary); overflow-wrap: anywhere; }
.ui-fbc__reason b, .ui-fbc__took b { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-fbc__close { margin-top: var(--tc-space-1); }
@container (max-width: 560px) {
  .ui-fbc__flow, .ui-fbc__models { flex-direction: column; }
  .ui-fbc__request { flex: none; }
  .ui-fbc__models { flex: none; }
  .ui-fbc__model { flex: none; }
  .ui-fbc__link { width: var(--tc-hairline); height: var(--tc-fbc-link); }
  .ui-fbc__link[data-active="true"] { width: var(--tc-space-0-5); height: var(--tc-fbc-link); }
  .ui-fbc__link[data-active="true"]::after { animation-name: ui-fbc-run-down; }
}
@keyframes ui-fbc-run-down { from { transform: translateY(-100%); } to { transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .ui-fbc__link[data-active="true"]::after { animation: none; }
}
@media (forced-colors: active) {
  .ui-fbc__link { background: CanvasText; }
  .ui-fbc__model[aria-selected="true"] { background: Highlight; color: HighlightText; forced-color-adjust: none; }
}
`;
}

if (!customElements.get("tc-fallback-chain")) customElements.define("tc-fallback-chain", TcFallbackChain);

declare global {
  interface HTMLElementTagNameMap {
    "tc-fallback-chain": TcFallbackChain;
  }
}
