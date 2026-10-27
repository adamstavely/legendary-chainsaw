import { html, nothing, svg, type PropertyValues, type ReactiveController, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, rescueFocus } from "./internal/controllers";
import type { Look } from "./internal/look";
import { adoptStyles } from "./internal/styles";
import { copyText } from "./internal/util";

/*
 * <tc-tool-call-card> and <tc-tool-call-group> – the Lit port of src/components/tool-call-card.tsx: one tool call of
 * an AI agent. A header with the tool's icon, its name in mono, a short summary and the status: a spinner with a live
 * timer, a check with the duration, or "Failed". Click it open to see the arguments and the result as highlighted
 * JSON, each with a copy button; long blocks are capped with a fade and "Show all". Errors show the message and a
 * Retry button (shown when `onRetry` is set). The group folds several cards into one line: "Used 3 tools · 2.4s".
 * Clean is one white card with hairline shadows, no tile and no tray.
 *
 *   <tc-tool-call-card name="search_web" status="success" duration="2400" .args=${{ q: "CRM" }}></tc-tool-call-card>
 *
 *   <tc-tool-call-group>
 *     <div slot="list" class="ui-tc__body"><div class="ui-tc__clip"><div class="ui-tc-group__list">
 *       <tc-tool-call-card …></tc-tool-call-card> …
 *     </div></div></div>
 *   </tc-tool-call-group>
 *
 * The group's cards stay where the page put them: it folds the `slot="list"` child (the body that grows from 0fr to
 * 1fr, its clip and the list – the same three boxes the React group renders) and renders its header before it. It reads
 * the name, icon, status and duration of the cards inside to summarise them. A card in a group leaves announcing to
 * the group, so nothing is said twice.
 */

export type ToolCallStatus = "running" | "success" | "error";
export type ToolCallOpenChange = { open: boolean };

/** The time for the stopwatch – only ever read in lifecycle callbacks and timers, never during render */
const clock = () => Date.now();

/** 0.4s, 12.3s, 2m 05s – the live timer always shows tenths below a minute */
function formatMs(ms: number, live: boolean) {
  if (!live && ms < 1000) return `${Math.max(1, Math.round(ms))}ms`;
  if (ms < 60_000) return `${(Math.floor(ms / 100) / 10).toFixed(1)}s`;
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}
/** How the card's and the group's timers read while they run */
const liveCard = (ms: number) => formatMs(ms, true);
const liveGroup = (ms: number, live = true) => `· ${formatMs(ms, live)}`;
const messageOf = (e: unknown) => (e instanceof Error && e.message ? e.message : typeof e === "string" && e ? e : "Something went wrong");

function toText(value: unknown): { text: string; json: boolean } {
  if (typeof value === "string") {
    const t = value.trim();
    if (t.startsWith("{") || t.startsWith("[")) {
      try {
        return { text: JSON.stringify(JSON.parse(t), null, 2), json: true };
      } catch {
        /* not JSON – shown as plain text */
      }
    }
    return { text: value, json: false };
  }
  try {
    const s = JSON.stringify(value, null, 2);
    return s === undefined ? { text: String(value), json: false } : { text: s, json: true };
  } catch {
    return { text: String(value), json: false };
  }
}

// Strings (keys when followed by a colon), literals and numbers – everything else stays punctuation
const TOKEN = /("(?:[^"\\]|\\.)*")(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

function highlight(text: string): Array<TemplateResult | string> {
  const out: Array<TemplateResult | string> = [];
  const re = new RegExp(TOKEN.source, "g");
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] && m[2]) out.push(html`<span class="ui-tc__t-key">${m[1]}</span>`, m[2]);
    else {
      const kind = m[1] ? "str" : /^[tfn]/.test(m[0]) ? "lit" : "num";
      out.push(html`<span class=${`ui-tc__t-${kind}`}>${m[0]}</span>`);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/* ---------- Icons ---------- */

const spinner = (look: Look) => {
  const clean = look === "clean";
  return html`<svg class="ui-tc__spinner" viewBox="0 0 16 16" aria-hidden="true">${svg`<circle cx="8" cy="8" r=${clean ? 6 : 5.75}></circle><path d=${clean ? "M8 2a6 6 0 0 1 6 6" : "M8 2.25a5.75 5.75 0 0 1 5.75 5.75"}></path>`}</svg>`;
};
const errorIcon = (look: Look) => {
  const clean = look === "clean";
  return html`<svg class="ui-tc__err" viewBox="0 0 16 16" aria-hidden="true">${svg`<circle cx="8" cy="8" r=${clean ? 7 : 6}></circle><path d=${clean ? "M8 4.9v3.5M8 10.9v.1" : "M8 5v3.4M8 10.9v.1"}></path>`}</svg>`;
};
const chevron = (look: Look) =>
  look === "clean"
    ? html`<svg class="ui-tc__chevron" viewBox="0 0 12 12" aria-hidden="true">${svg`<path d="M3.5 5.25 6 7.75l2.5-2.5"></path>`}</svg>`
    : html`<svg class="ui-tc__chevron" viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M4.5 6.25 8 9.75l3.5-3.5"></path>`}</svg>`;
const wrench = html`<svg viewBox="0 0 16 16">${svg`<path d="M10.2 2.4a3.5 3.5 0 0 0-4.3 4.6L2.6 10.3a1.4 1.4 0 0 0 2 2L7.9 9a3.5 3.5 0 0 0 4.6-4.3l-2 2-1.6-.4-.4-1.6 1.7-2.3Z"></path>`}</svg>`;
const okIcon = (look: Look) =>
  html`<svg class="ui-tc__ok" viewBox="0 0 16 16" aria-hidden="true">${look === "clean" ? svg`<circle cx="8" cy="8" r="7"></circle><path d="M5.1 8.2 7.1 10.1 10.9 6" pathLength="1"></path>` : svg`<path d="M3.5 8.4 6.6 11.3 12.5 4.9" pathLength="1"></path>`}</svg>`;
const copyIcon = (look: Look) =>
  html`<svg class="ui-tc__copy-icon" viewBox="0 0 16 16" aria-hidden="true">${look === "clean"
    ? svg`<rect x="5.5" y="5.5" width="8.5" height="8.5" rx="2"></rect><path d="M10.5 3.75v-.25A1.5 1.5 0 0 0 9 2H3.5A1.5 1.5 0 0 0 2 3.5V9a1.5 1.5 0 0 0 1.5 1.5h.25"></path>`
    : svg`<rect x="5.25" y="5.25" width="8" height="8" rx="2"></rect><path d="M10.75 5.25v-1a1.5 1.5 0 0 0-1.5-1.5h-4.5a2 2 0 0 0-2 2v4.5a1.5 1.5 0 0 0 1.5 1.5h1"></path>`}</svg>`;
const copyDone = html`<svg class="ui-tc__copy-done" viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M3.5 8.4 6.6 11.3 12.5 4.9" pathLength="1"></path>`}</svg>`;
const retryIcon = html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M2.75 8a5.25 5.25 0 1 0 1.6-3.77"></path><path d="M2.5 2.5v2.75h2.75"></path>`}</svg>`;

/* ---------- The stopwatch (port of useStopwatch) ---------- */

/**
 * Live ms while running, the final value after; `accumulate` adds up several running stretches. The final value
 * renders (once, when a stretch ends); the running value never does: a 10 Hz ticker writes `format(ms)` into the text
 * of the element `el()` returns, and stops while that element is off-screen or the tab is hidden.
 */
class StopwatchController implements ReactiveController {
  ms: number | null = null;
  private start: number | null = null;
  private base = 0;
  private key = "";
  private ticker = 0;
  private onScreen = true;
  private io?: IntersectionObserver;
  private watched: Element | null = null;

  constructor(
    private host: TcElement,
    private opts: { running: () => boolean; startedAt: () => number | undefined; accumulate: boolean; format: (ms: number) => string; el: () => HTMLElement | null },
  ) {
    host.addController(this);
  }

  // Started and stopped before render, so an update that ends a stretch shows the final value straight away
  hostUpdate() {
    const running = this.opts.running();
    const key = running ? `run|${this.opts.startedAt() ?? ""}` : "";
    if (key === this.key) return;
    this.key = key;
    this.stopTicker();
    if (!running) {
      if (this.start !== null) {
        this.base += clock() - this.start;
        this.start = null;
        this.ms = this.base;
      }
      return;
    }
    if (!this.opts.accumulate) this.base = 0;
    this.start = this.opts.startedAt() ?? clock();
  }

  hostUpdated() {
    if (this.start !== null) {
      const el = this.opts.el();
      if (el !== this.watched) {
        this.io?.disconnect();
        this.io = undefined;
        this.watched = el;
        this.onScreen = true;
        if (el && typeof IntersectionObserver === "function") {
          this.io = new IntersectionObserver((entries) => {
            this.onScreen = entries[entries.length - 1].isIntersecting;
            this.sync();
          });
          this.io.observe(el);
        }
      }
      this.sync();
    }
    // An update while running renders the last final value – put the live one back
    this.paint();
  }

  hostConnected() {
    document.addEventListener("visibilitychange", this.sync);
  }
  hostDisconnected() {
    document.removeEventListener("visibilitychange", this.sync);
    this.stopTicker();
    this.io?.disconnect();
    this.io = undefined;
    this.watched = null;
    // Reconnected: start the stretch again from the next update
    this.key = "";
  }

  private sync = () => {
    const run = this.start !== null && this.onScreen && document.visibilityState !== "hidden";
    if (run && !this.ticker) {
      this.paint();
      this.ticker = window.setInterval(this.paint, 100);
    } else if (!run && this.ticker) this.stopTicker();
  };
  private stopTicker() {
    window.clearInterval(this.ticker);
    this.ticker = 0;
  }
  private paint = () => {
    const el = this.opts.el();
    const node = el && [...el.childNodes].find((c) => c.nodeType === Node.TEXT_NODE);
    if (this.start === null || !node) return;
    const value = this.opts.format(this.base + clock() - this.start);
    if (node.nodeValue !== value) node.nodeValue = value;
  };
}

let instances = 0;

/**
 * One tool call of an AI agent: name, summary, status with a live timer, arguments and result.
 * @tag tc-tool-call-card
 * @fires tc-open-change - The card opens or closes – by the user or on an error ({ open: boolean }); cancelable
 */
export class TcToolCallCard extends TcElement {
  static override ui = "tc";

  /** Tool name as the agent calls it, shown in mono – e.g. "search_web" */
  @property() accessor name = "";
  /** Short human summary – text, or an element (cloned) */
  @property({ attribute: false }) accessor summary: string | Element | undefined = undefined;
  /** Icon in the tile on the left (cloned) – defaults to a wrench */
  @property({ attribute: false }) accessor icon: Element | undefined = undefined;
  /** "running" shows a spinner and a live timer, "success" a check and the duration, "error" "Failed" and the message */
  @property() accessor status: ToolCallStatus = "success";
  /** Arguments the tool was called with – objects are pretty-printed, JSON strings parsed */
  @property({ attribute: false }) accessor args: unknown = undefined;
  /** What the tool returned – objects are pretty-printed, JSON strings parsed, other text shown as is */
  @property({ attribute: false }) accessor result: unknown = undefined;
  /** Error message, shown when status is "error" */
  @property() accessor error: string | undefined = undefined;
  /** When the call started (ms since epoch) – the live timer counts from here */
  @property({ type: Number, attribute: "started-at" }) accessor startedAt: number | undefined = undefined;
  /** Final duration in ms – otherwise measured while the card shows "running" */
  @property({ type: Number }) accessor duration: number | undefined = undefined;
  /** Expanded. Changed by the user (and on an error) unless a tc-open-change listener calls preventDefault() */
  @property({ type: Boolean }) accessor open = false;
  /** Opens the card when the call fails and closes it again on the next run, unless someone toggled it */
  @property({ type: Boolean, attribute: "open-on-error" }) accessor openOnError = true;
  /** Shows a Retry button next to the error – may return a promise: Retry waits for it, a rejection is shown */
  @property({ attribute: false }) accessor onRetry: (() => void | Promise<unknown>) | undefined = undefined;
  /** Height in px after which arguments and result are capped with a fade and "Show all" */
  @property({ type: Number, attribute: "max-code-height" }) accessor maxCodeHeight = 220;

  @state() private accessor retrying = false;
  @state() private accessor retryError: string | null = null;
  /** Per section ("Arguments", "Result"): opened past the cap, its natural height, just copied */
  @state() private accessor full: Record<string, boolean> = {};
  @state() private accessor heights: Record<string, number> = {};
  @state() private accessor copied: Record<string, boolean> = {};

  private readonly uid = `tc-tc${++instances}`;
  private prevStatus: ToolCallStatus | undefined = undefined;
  private autoOpened = false;
  private codeCache = new Map<string, { value: unknown; text: string; code: Array<TemplateResult | string> | string }>();
  private ro?: ResizeObserver;
  private observed = new Set<Element>();
  private copyTimers = new Map<string, number>();
  private stopwatch: StopwatchController = new StopwatchController(this, {
    running: () => this.status === "running",
    startedAt: () => this.startedAt,
    accumulate: false,
    format: liveCard,
    el: () => this.querySelector<HTMLElement>(":scope > .ui-tc__head .ui-tc__time"),
  });

  constructor() {
    super();
    // When Retry (or anything focused in the body) goes away – the call runs again, the card closes – focus moves to
    // the header instead of falling to <body>
    new FocusRescueController(this, () => this.head);
  }

  private get head() {
    return this.querySelector<HTMLButtonElement>(":scope > .ui-tc__head");
  }
  private get group() {
    return this.parentElement?.closest("tc-tool-call-group") ?? null;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.ro?.disconnect();
    this.ro = undefined;
    this.observed.clear();
    for (const t of this.copyTimers.values()) window.clearTimeout(t);
    this.copyTimers.clear();
  }

  private setOpen(next: boolean) {
    if (next === this.open) return;
    if (this.emit<ToolCallOpenChange>("tc-open-change", { open: next }, { cancelable: true })) this.open = next;
  }

  protected override willUpdate(changed: PropertyValues) {
    // Open on failure, close again on the next run – only while nobody has toggled it by hand. Reported through
    // tc-open-change like any other change (a controlled card sets open-on-error to false)
    const prev = this.prevStatus;
    this.prevStatus = this.status;
    if (prev !== undefined && prev !== this.status) {
      if (this.status !== "error") this.retryError = null;
      if (this.openOnError) {
        if (this.status === "error" && !this.open) {
          this.autoOpened = true;
          this.setOpen(true);
        } else if (prev === "error" && this.autoOpened) {
          this.autoOpened = false;
          this.setOpen(false);
        }
      }
    }
    super.willUpdate(changed);
    this.dataset.status = this.status;
    this.toggleAttribute("data-open", this.open);
  }

  protected override updated(changed: PropertyValues) {
    // The group summarises its cards: tell it something it shows changed
    if (["name", "icon", "status", "duration"].some((k) => changed.has(k))) (this.group as TcToolCallGroup | null)?.requestUpdate();
    // Natural height of each code block – decides whether it needs the cap and how far "Show all" opens
    const pres = [...this.querySelectorAll<HTMLPreElement>(".ui-tc__code")];
    if (!this.ro && pres.length && typeof ResizeObserver === "function") {
      this.ro = new ResizeObserver((entries) => {
        const next = { ...this.heights };
        let moved = false;
        for (const e of entries) {
          const pre = e.target.parentElement as HTMLElement | null;
          const label = pre?.dataset.label;
          if (!pre || !label || next[label] === pre.scrollHeight) continue;
          next[label] = pre.scrollHeight;
          moved = true;
        }
        if (moved) this.heights = next;
      });
    }
    const inner = new Set(pres.map((p) => p.firstElementChild).filter((c): c is Element => !!c));
    for (const el of this.observed) if (!inner.has(el)) this.ro?.unobserve(el);
    for (const el of inner) if (!this.observed.has(el)) this.ro?.observe(el);
    this.observed = inner;
  }

  private retry = () => {
    if (!this.onRetry || this.retrying) return;
    // Retry is disabled while it runs (and goes away once the call runs again) – focus moves to the header first
    rescueFocus(this.querySelector(".ui-tc__retry"), [this.head]);
    this.retryError = null;
    let run: unknown;
    try {
      run = this.onRetry();
    } catch (e) {
      this.retryError = messageOf(e);
      return;
    }
    if (!run || typeof (run as Promise<unknown>).then !== "function") return;
    this.retrying = true;
    (run as Promise<unknown>).then(
      () => {
        if (this.isConnected) this.retrying = false;
      },
      (e: unknown) => {
        if (!this.isConnected) return;
        this.retrying = false;
        this.retryError = messageOf(e);
      },
    );
  };

  private copy(label: string, text: string) {
    void copyText(text).then((ok) => {
      if (!ok || !this.isConnected) return;
      this.copied = { ...this.copied, [label]: true };
      window.clearTimeout(this.copyTimers.get(label));
      this.copyTimers.set(
        label,
        window.setTimeout(() => {
          this.copyTimers.delete(label);
          this.copied = { ...this.copied, [label]: false };
        }, 1400),
      );
    });
  }

  private section(label: string, value: unknown, look: Look) {
    // Pretty-printing and highlighting are kept while the value stays the same
    let c = this.codeCache.get(label);
    if (!c || c.value !== value) {
      const { text, json } = toText(value);
      c = { value, text, code: c && c.text === text ? c.code : json ? highlight(text) : text };
      this.codeCache.set(label, c);
    }
    const cap = this.maxCodeHeight;
    const height = this.heights[label] ?? 0;
    const full = !!this.full[label];
    const capped = height > cap + 24;
    const copied = !!this.copied[label];
    const lower = label.toLowerCase();
    return html`<div class="ui-tc__section">
      <div class="ui-tc__section-head">
        <span class="ui-tc__label">${label}</span>
        <span class="ui-tc-sr" role="status">${copied ? "Copied" : ""}</span>
        <button type="button" class="ui-tc__copy" ?data-copied=${copied} aria-label=${`Copy ${lower}`} title=${copied ? "Copied" : `Copy ${lower}`} @click=${() => this.copy(label, c.text)}>${copyIcon(look)}${copyDone}</button>
      </div>
      <pre class="ui-tc__code" data-label=${label} ?data-capped=${capped && !full} style=${styleMap(capped ? { maxHeight: `${full ? height : cap}px` } : {})}><code>${c.code}</code></pre>
      ${capped ? html`<button type="button" class="ui-tc__more" aria-expanded=${full ? "true" : "false"} @click=${() => (this.full = { ...this.full, [label]: !full })}>${full ? "Show less" : "Show all"}</button>` : nothing}
    </div>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const status = this.status;
    const open = this.open;
    const name = this.name;
    const error = this.error;
    const measured = this.stopwatch.ms;
    const ms = status === "running" ? (measured ?? 0) : (this.duration ?? measured);
    // Only the outcome is announced (not "running"); inside a group, the group says it once for all its cards
    const announce = this.group || status === "running" ? "" : status === "success" ? `${name} finished` : `${name} failed${error ? `: ${error}` : ""}`;
    const summary = this.summary;
    const bodyId = `${this.uid}-body`;

    return html`
      <span class="ui-tc-sr" role="status">${announce}</span>
      <button
        type="button"
        class="ui-tc__head"
        aria-expanded=${open ? "true" : "false"}
        aria-controls=${bodyId}
        @click=${() => {
          this.autoOpened = false;
          this.setOpen(!this.open);
        }}
      >
        <span class="ui-tc__icon" aria-hidden="true">${this.icon ? this.icon.cloneNode(true) : wrench}</span>
        <span class="ui-tc__main"><code class="ui-tc__name" title=${name}>${name}</code>${summary != null ? html`<span class="ui-tc__summary" title=${ifDefined(typeof summary === "string" ? summary : undefined)}>${typeof summary === "string" ? summary : summary.cloneNode(true)}</span>` : nothing}</span>
        ${keyed(
          status,
          html`<span class="ui-tc__status">${status === "running" ? spinner(look) : nothing}${status === "success" ? okIcon(look) : nothing}${status === "error" ? errorIcon(look) : nothing}<span class="ui-tc__time" aria-hidden=${ifDefined(status === "running" ? "true" : undefined)}>${status === "error" ? "Failed" : ms != null ? formatMs(ms, status === "running") : nothing}</span>${status === "running" ? html`<span class="ui-tc-sr">running</span>` : nothing}</span>`,
        )}
        ${chevron(look)}
      </button>
      <div class="ui-tc__body" id=${bodyId} .inert=${!open}>
        <div class="ui-tc__clip">
          <div class="ui-tc__sections">
            ${status === "error"
              ? html`<div class="ui-tc__error">
                  ${errorIcon(look)}
                  <p class="ui-tc__error-text" role=${ifDefined(this.retryError ? "alert" : undefined)}>${this.retryError ? `Retry failed: ${this.retryError}` : (error ?? "The tool call failed.")}</p>
                  ${this.onRetry ? html`<button type="button" class="ui-tc__retry" @click=${this.retry} ?disabled=${this.retrying} aria-busy=${ifDefined(this.retrying ? "true" : undefined)}>${retryIcon}Retry</button>` : nothing}
                </div>`
              : nothing}
            ${this.args !== undefined ? this.section("Arguments", this.args, look) : nothing}
            ${this.result !== undefined
              ? this.section("Result", this.result, look)
              : status === "running"
                ? html`<div class="ui-tc__section"><div class="ui-tc__section-head"><span class="ui-tc__label">Result</span></div><p class="ui-tc__pending">Waiting for result…</p></div>`
                : nothing}
            ${this.args === undefined && this.result === undefined && status === "success" ? html`<p class="ui-tc__pending">No arguments or result.</p>` : nothing}
          </div>
        </div>
      </div>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="tc"],
:where([data-look="standard"], [data-look="standard"] *)[data-ui="tc-group"] {
  --tc-tool-call-card-code-bg: light-dark(#fafafa, #1d1d20);
  --tc-tool-call-card-error-bg: light-dark(rgba(200, 55, 45, 0.06), rgba(255, 110, 100, 0.08));
  --tc-tool-call-card-tc-tile: light-dark(#f5f5f5, #1d1d20);
  --tc-tool-call-card-syntax-string: light-dark(#0f7b6c, #5fd4b8);
  --tc-tool-call-card-syntax-number: light-dark(#b25b0c, #f2a65a);
  box-sizing: border-box;
  min-width: 0;
  color: var(--tc-text-muted);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="tc"] / [data-ui="tc-group"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tc"],
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tc-group"] {
  /* The code panel: a 2% black frame, kept opaque so the fade of capped blocks can end on it */
  --tc-tool-call-card-code-bg: light-dark(#fafafa, #212123);
  --tc-tool-call-card-error-bg: light-dark(rgba(217, 58, 43, 0.04), rgba(255, 110, 100, 0.07));
  /* JSON syntax colours */
  --tc-tool-call-card-syntax-string: light-dark(rgba(0, 123, 172, 0.9), #5fc8e8);
  --tc-tool-call-card-syntax-literal: light-dark(#5b5bd6, #a5a5ff);
  --tc-tool-call-card-syntax-number: light-dark(#b25b0c, #f2a65a);
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  container-type: inline-size;
  min-width: 0;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  -webkit-font-smoothing: antialiased;
}
[data-ui="tc"] *,
[data-ui="tc-group"] * { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="tc"] {
  position: relative;
  border-radius: var(--tc-radius-xl);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tc"] {
  position: relative;
  border-radius: var(--tc-radius-lg);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
}
.ui-tc-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
/* Header: icon, name + summary, status, chevron – everything truncates before it overflows */
:where([data-look="standard"], [data-look="standard"] *).ui-tc__head {
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  width: 100%;
  min-height: 44px;
  padding: var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-2) var(--tc-space-2);
  border-radius: var(--tc-radius-xl);
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="tc"][data-open] .ui-tc__head { border-radius: var(--tc-radius-xl) var(--tc-radius-xl) 0 0; }
.ui-tc__head:focus-visible,
.ui-tc-group__head:focus-visible,
.ui-tc__copy:focus-visible,
.ui-tc__more:focus-visible,
.ui-tc__retry:focus-visible {
  outline: var(--tc-focus-outline);
  outline-offset: var(--tc-focus-ring-offset);
}
@media (hover: hover) {
:where([data-look="standard"], [data-look="standard"] *).ui-tc__head:hover { background: var(--tc-fill-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-tc-group__head:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__copy:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__more:hover { color: var(--tc-text-primary); }
}
.ui-tc__retry:disabled { opacity: 0.6; cursor: progress; }
.ui-tc__retry:not(:disabled):hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: var(--tc-radius-sm);
  background: var(--tc-tool-call-card-tc-tile);
  box-shadow: inset 0 0 0 1px var(--tc-border-default);
  color: var(--tc-text-primary);
}
:where([data-look="standard"], [data-look="standard"] *).ui-tc__icon > svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
/* Header row: icon, name + summary, status, chevron – everything truncates before it overflows */
:where([data-look="clean"], [data-look="clean"] *).ui-tc__head {
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  width: 100%;
  min-height: 44px;
  padding: 0 var(--tc-space-3-5);
  border-radius: var(--tc-radius-lg);
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), border-radius 0ms linear var(--tc-duration-slower);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tc"][data-open] .ui-tc__head {
  border-radius: var(--tc-radius-lg) var(--tc-radius-lg) 0 0;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
@media (hover: hover) {
:where([data-look="clean"], [data-look="clean"] *).ui-tc__head:hover { background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__head:hover .ui-tc__chevron { stroke: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-tc-group__head:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__copy:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__more:hover { color: var(--tc-text-primary); }
}
/* The tool's icon: a plain 16px glyph, no tile */
:where([data-look="clean"], [data-look="clean"] *).ui-tc__icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 16px;
  height: 16px;
  color: var(--tc-icon-muted);
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc__icon > svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.ui-tc__main {
  display: flex;
  align-items: baseline;
  gap: var(--tc-space-2);
  flex: 1;
  min-width: 0;
}
:where([data-look="standard"], [data-look="standard"] *).ui-tc__name {
  flex: 0 1 auto;
  max-width: 55%;
  overflow: hidden;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-mono);
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}
:where([data-look="standard"], [data-look="standard"] *).ui-tc__summary {
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  color: var(--tc-text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}
:where([data-look="standard"], [data-look="standard"] *).ui-tc__status {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  flex: none;
  color: var(--tc-text-muted);
  font-size: var(--tc-font-size-sm);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  animation: ui-tc-in var(--tc-duration-slow) var(--tc-ease-move) both;
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="tc"][data-status="error"] .ui-tc__status { color: var(--tc-status-danger-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__name {
  flex: 0 1 auto;
  max-width: 55%;
  overflow: hidden;
  color: var(--tc-text-strong);
  font-family: var(--tc-font-mono);
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc__summary {
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  color: var(--tc-text-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc__status {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  flex: none;
  color: var(--tc-text-muted);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  animation: ui-tc-in var(--tc-duration-slow) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tc"][data-status="error"] .ui-tc__status { color: var(--tc-status-danger-fg); font-weight: var(--tc-font-weight-medium); }
.ui-tc__status > svg { width: 14px; height: 14px; flex: none; fill: none; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__spinner circle { stroke: currentColor; stroke-width: 1.6; opacity: 0.22; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__spinner path { stroke: var(--tc-text-primary); stroke-width: 1.6; }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__spinner circle { stroke: var(--tc-border-default); stroke-width: 1.6; }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__spinner path { stroke: var(--tc-accent-text); stroke-width: 1.6; }
.ui-tc__spinner { animation: ui-tc-spin 800ms linear infinite; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__ok { stroke: var(--tc-text-primary); stroke-width: 1.8; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__ok path { stroke-dasharray: 1; stroke-dashoffset: 1; animation: ui-tc-draw var(--tc-duration-slow) var(--tc-ease-move) 80ms forwards; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__err { stroke: var(--tc-status-danger-fg); stroke-width: 1.5; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__chevron {
  flex: none;
  width: 14px;
  height: 14px;
  fill: none;
  stroke: var(--tc-text-muted);
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform var(--tc-duration-slow) var(--tc-ease-move);
}
/* Done: a solid blue dot whose white check draws itself */
:where([data-look="clean"], [data-look="clean"] *).ui-tc__ok { animation: ui-tc-pop var(--tc-duration-slower) var(--tc-ease-spring) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__ok circle { fill: var(--tc-accent-text); }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__ok path { stroke: #fff; stroke-width: 1.5; stroke-dasharray: 1; stroke-dashoffset: 1; animation: ui-tc-draw var(--tc-duration-slow) var(--tc-ease-move) var(--tc-duration-fast) forwards; }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__err circle { fill: var(--tc-status-danger-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__err path { stroke: #fff; stroke-width: 1.6; stroke-linecap: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__chevron {
  flex: none;
  width: 12px;
  height: 12px;
  fill: none;
  stroke: var(--tc-icon-muted);
  stroke-width: 1.2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: transform var(--tc-duration-slow) var(--tc-ease-move), stroke var(--tc-duration-fast) var(--tc-ease-standard);
}
[data-ui="tc"][data-open] > .ui-tc__head .ui-tc__chevron,
[data-ui="tc-group"][data-open] > .ui-tc-group__head .ui-tc__chevron { transform: rotate(180deg); }
/* Body: grows from 0fr to 1fr, so the height animates without measuring */
.ui-tc__body {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-moderate) var(--tc-ease-standard);
}
[data-ui="tc"][data-open] > .ui-tc__body,
[data-ui="tc-group"][data-open] > .ui-tc__body {
  grid-template-rows: 1fr;
  opacity: 1;
}
.ui-tc__clip { min-height: 0; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__sections {
  display: grid;
  gap: var(--tc-space-3);
  padding: var(--tc-space-3);
  border-top: 1px solid var(--tc-border-default);
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc__sections {
  display: grid;
  gap: var(--tc-space-3-5);
  padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-3-5);
  border-top: 0.5px solid var(--tc-border-default);
}
.ui-tc__section { display: grid; gap: var(--tc-space-1-5); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2);
  min-height: 24px;
}
.ui-tc__label { color: var(--tc-caption-color); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__pending { margin: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__copy {
  all: unset;
  position: relative;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: var(--tc-radius-sm);
  color: var(--tc-text-muted);
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-tc__copy svg {
  position: absolute;
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-slow) var(--tc-ease-move), filter var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2);
  min-height: 28px;
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc__pending { margin: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
/* Copy: a small white icon button with the card's hairline */
:where([data-look="clean"], [data-look="clean"] *).ui-tc__copy {
  all: unset;
  position: relative;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: var(--tc-radius-sm);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  color: var(--tc-icon-muted);
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc__copy svg {
  position: absolute;
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-slow) var(--tc-ease-move), filter var(--tc-duration-base) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc__copy-icon rect { fill: currentColor; stroke: none; }
.ui-tc__copy-done { opacity: 0; transform: scale(0.6); filter: blur(2px); stroke-width: 1.7; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__copy[data-copied] { color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__copy[data-copied] { color: var(--tc-accent-text); }
.ui-tc__copy[data-copied] .ui-tc__copy-icon { opacity: 0; transform: scale(0.6); filter: blur(2px); }
.ui-tc__copy[data-copied] .ui-tc__copy-done { opacity: 1; transform: none; filter: none; }
/* Code: wraps instead of scrolling sideways; capped blocks fade out at the bottom */
:where([data-look="standard"], [data-look="standard"] *).ui-tc__code {
  position: relative;
  margin: 0;
  padding: var(--tc-space-2-5) var(--tc-space-3);
  overflow: hidden;
  border-radius: var(--tc-radius-md);
  background: var(--tc-tool-call-card-code-bg);
  box-shadow: inset 0 0 0 1px var(--tc-border-default);
  color: var(--tc-text-muted);
  font-family: var(--tc-font-mono);
  font-size: var(--tc-font-size-sm);
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  tab-size: 2;
  transition: max-height var(--tc-duration-slower) var(--tc-ease-move);
}
/* Code: a faint panel with a 0.5px frame; wraps instead of scrolling sideways, capped blocks fade out */
:where([data-look="clean"], [data-look="clean"] *).ui-tc__code {
  position: relative;
  margin: 0;
  padding: var(--tc-space-2-5) var(--tc-space-3);
  overflow: hidden;
  border-radius: var(--tc-radius-md);
  background: var(--tc-tool-call-card-code-bg);
  box-shadow: inset 0 0 0 0.5px var(--tc-border-default);
  color: var(--tc-text-muted);
  font-family: var(--tc-font-mono);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-normal);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  tab-size: 2;
  transition: max-height var(--tc-duration-slower) var(--tc-ease-move);
}
.ui-tc__code code { display: block; font: inherit; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__code::after {
  content: "";
  position: absolute;
  left: 1px;
  right: 1px;
  bottom: 1px;
  height: 56px;
  border-radius: 0 0 var(--tc-radius-sm) var(--tc-radius-sm);
  background: linear-gradient(to bottom, transparent, var(--tc-tool-call-card-code-bg));
  opacity: 0;
  transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard);
  pointer-events: none;
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc__code::after {
  content: "";
  position: absolute;
  left: 0.5px;
  right: 0.5px;
  bottom: 0.5px;
  height: 56px;
  border-radius: 0 0 7.5px 7.5px;
  background: linear-gradient(to bottom, transparent, var(--tc-tool-call-card-code-bg));
  opacity: 0;
  transition: opacity var(--tc-duration-moderate) var(--tc-ease-standard);
  pointer-events: none;
}
.ui-tc__code[data-capped]::after { opacity: 1; }
.ui-tc__t-key { color: var(--tc-text-primary); }
.ui-tc__t-str { color: var(--tc-tool-call-card-syntax-string); }
.ui-tc__t-num { color: var(--tc-tool-call-card-syntax-number); }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__t-lit { color: var(--tc-tone-violet-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__more {
  all: unset;
  justify-self: start;
  padding: var(--tc-space-0-5) var(--tc-space-1);
  margin-left: -4px;
  border-radius: var(--tc-radius-xs);
  color: var(--tc-text-muted);
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
  cursor: pointer;
  transition: color var(--tc-duration-fast) var(--tc-ease-standard);
}
/* Error: the message and an optional retry */
:where([data-look="standard"], [data-look="standard"] *).ui-tc__error {
  display: flex;
  align-items: flex-start;
  gap: var(--tc-space-2);
  padding: var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-2) var(--tc-space-3);
  border-radius: var(--tc-radius-md);
  background: var(--tc-tool-call-card-error-bg);
  box-shadow: inset 0 0 0 1px var(--tc-status-danger-border);
}
:where([data-look="standard"], [data-look="standard"] *).ui-tc__error > .ui-tc__err { flex: none; width: 14px; height: 14px; margin-top: var(--tc-space-0-5); fill: none; stroke-linecap: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__error-text {
  flex: 1;
  min-width: 0;
  margin: 0;
  color: var(--tc-status-danger-fg);
  font-size: var(--tc-font-size-md);
  line-height: 1.45;
  overflow-wrap: anywhere;
}
.ui-tc__retry {
  all: unset;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  flex: none;
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-control-px-sm) 0 calc(var(--tc-control-px-sm) - 2px);
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  color: var(--tc-action-secondary-fg);
  font-size: var(--tc-control-font-size);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-control-font-weight);
  cursor: pointer;
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-tc__retry svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc__retry { margin: -4px 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__t-lit { color: var(--tc-tool-call-card-syntax-literal); }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__more {
  all: unset;
  justify-self: start;
  padding: var(--tc-space-0-5) var(--tc-space-1);
  margin-left: -4px;
  border-radius: var(--tc-radius-sm);
  color: var(--tc-text-secondary);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  font-weight: var(--tc-font-weight-medium);
  cursor: pointer;
  transition: color var(--tc-duration-fast) var(--tc-ease-standard);
}
/* Error: the message on a faint red panel and an optional white Retry button */
:where([data-look="clean"], [data-look="clean"] *).ui-tc__error {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  min-height: 44px;
  padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-3);
  border-radius: var(--tc-radius-md);
  background: var(--tc-tool-call-card-error-bg);
  box-shadow: inset 0 0 0 0.5px var(--tc-status-danger-border);
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc__error > .ui-tc__err { flex: none; align-self: flex-start; width: 16px; height: 16px; margin-top: var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__error-text {
  flex: 1;
  min-width: 0;
  margin: 0;
  color: var(--tc-status-danger-fg);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  overflow-wrap: anywhere;
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc__retry svg { width: 16px; height: 16px; fill: none; stroke: var(--tc-icon-muted); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.ui-tc__retry:active svg { transform: rotate(-60deg); transition: transform var(--tc-duration-base) var(--tc-ease-move); }
/* Group: one quiet line with the tool icons stacked, the cards below */
[data-ui="tc-group"] { display: grid; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc-group__head {
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  justify-self: start;
  max-width: 100%;
  min-height: 36px;
  padding: var(--tc-space-1) var(--tc-space-2-5) var(--tc-space-1) var(--tc-space-1);
  border-radius: var(--tc-radius-lg);
  color: var(--tc-text-muted);
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-tc-group__stack { display: flex; flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc-group__stack .ui-tc__icon {
  width: 24px;
  height: 24px;
  border-radius: var(--tc-radius-sm);
  box-shadow: inset 0 0 0 1px var(--tc-border-default), 0 0 0 2px var(--tc-surface-raised);
  animation: ui-tc-pop var(--tc-duration-slower) var(--tc-ease-move) both;
}
:where([data-look="standard"], [data-look="standard"] *).ui-tc-group__stack .ui-tc__icon + .ui-tc__icon { margin-left: -5px; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc-group__stack .ui-tc__icon > svg { width: 13px; height: 13px; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc-group__title {
  display: flex;
  align-items: baseline;
  gap: var(--tc-space-1);
  min-width: 0;
  white-space: nowrap;
  animation: ui-tc-in var(--tc-duration-slow) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc-group__head {
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  justify-self: start;
  max-width: 100%;
  min-height: 32px;
  margin-left: -6px;
  padding: var(--tc-space-1) var(--tc-space-2-5) var(--tc-space-1) var(--tc-space-1-5);
  border-radius: var(--tc-radius-md);
  color: var(--tc-text-primary);
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc-group__stack { display: flex; flex: none; padding: 0.5px; }
:where([data-look="clean"], [data-look="clean"] *).ui-tc-group__stack .ui-tc__icon {
  width: 22px;
  height: 22px;
  border-radius: var(--tc-radius-sm);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  animation: ui-tc-pop var(--tc-duration-slower) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc-group__stack .ui-tc__icon + .ui-tc__icon { margin-left: -4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-tc-group__stack .ui-tc__icon > svg { width: 12px; height: 12px; stroke-width: 1.5; }
:where([data-look="clean"], [data-look="clean"] *).ui-tc-group__title {
  display: flex;
  align-items: baseline;
  gap: var(--tc-space-1-5);
  min-width: 0;
  white-space: nowrap;
  animation: ui-tc-in var(--tc-duration-slow) var(--tc-ease-move) both;
}
.ui-tc-group__label {
  position: relative;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  color: inherit;
  font-weight: var(--tc-font-weight-medium);
}
:where([data-look="clean"], [data-look="clean"] *).ui-tc-group__label.ui-tc__shine { color: var(--tc-text-muted); }
.ui-tc-group__failed { flex: none; color: var(--tc-status-danger-fg); }
.ui-tc-group__time { flex: none; color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-tc-group__list { display: grid; gap: var(--tc-space-2); padding-top: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-tc-group__list { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-1-5) 0 var(--tc-space-0-5); }
/* A soft light sweeping over "Using tools…" */
.ui-tc__shine::after {
  content: attr(data-text);
  content: attr(data-text) / "";
  position: absolute;
  inset: 0;
  white-space: nowrap;
  color: transparent;
  background: linear-gradient(90deg, transparent 38%, var(--tc-shimmer) 50%, transparent 62%) 100% 0 / 300% 100% no-repeat;
  -webkit-background-clip: text;
  background-clip: text;
  animation: ui-tc-sweep 1.8s linear 3;
  pointer-events: none;
}
@keyframes ui-tc-in {
  from { opacity: 0; transform: translateY(3px); filter: blur(2px); }
  to { opacity: 1; transform: none; filter: none; }
}
@keyframes ui-tc-pop {
  from { opacity: 0; transform: scale(0.6); }
  to { opacity: 1; transform: none; }
}
@keyframes ui-tc-spin { to { transform: rotate(360deg); } }
@keyframes ui-tc-draw { to { stroke-dashoffset: 0; } }
@keyframes ui-tc-sweep {
  from { background-position: 100% 0; }
  to { background-position: 0% 0; }
}
/* Narrow (phones): a little less padding, the summary gives way first */
@container (max-width: 360px) {
:where([data-look="clean"], [data-look="clean"] *).ui-tc__head { gap: var(--tc-space-2); padding: 0 var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-tc__sections { padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-3); }
}
/* Touch screens: bigger tap targets */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-tc__head { min-height: 52px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="tc"] *,
  [data-ui="tc-group"] *,
  [data-ui="tc"] *::after,
  [data-ui="tc-group"] *::after {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
  .ui-tc__shine::after { display: none; }
  .ui-tc__ok path { stroke-dashoffset: 0; }
}
`;
}

/**
 * Several tool calls folded into one line: "Used 3 tools · 2.4s". The cards go in a `slot="list"` child (see above).
 * @tag tc-tool-call-group
 * @fires tc-open-change - The group opens or closes ({ open: boolean }); cancelable
 * @slot list - The body with the cards: `<div slot="list" class="ui-tc__body"><div class="ui-tc__clip"><div class="ui-tc-group__list">…`
 */
export class TcToolCallGroup extends TcElement {
  static override ui = "tc-group";

  /** Label once all calls are done – defaults to "Used 3 tools" */
  @property() accessor label: string | undefined = undefined;
  /** Label while any call is running */
  @property({ attribute: "running-label" }) accessor runningLabel = "Using tools…";
  /** Total duration in ms – otherwise the sum of the cards' durations, or the time measured while running */
  @property({ type: Number }) accessor duration: number | undefined = undefined;
  /** Expanded. Changed by the user unless a tc-open-change listener calls preventDefault() */
  @property({ type: Boolean }) accessor open = false;

  private readonly uid = `tc-tcg${++instances}`;
  private mo?: MutationObserver;
  // Time spent with tools running, added up across stretches (e.g. a pause before a retry)
  private stopwatch: StopwatchController = new StopwatchController(this, {
    running: () => this.cards.some((c) => c.status === "running"),
    startedAt: () => undefined,
    accumulate: true,
    format: liveGroup,
    el: () => this.querySelector<HTMLElement>(":scope > .ui-tc-group__head .ui-tc-group__time"),
  });

  /** The cards in this group, in order */
  get cards(): TcToolCallCard[] {
    return [...this.querySelectorAll<TcToolCallCard>("tc-tool-call-card")].filter((c) => c.parentElement?.closest("tc-tool-call-group") === this);
  }
  private get body() {
    return this.querySelector<HTMLElement>(':scope > [slot="list"]');
  }

  // The header renders before the page's children, so the body follows it
  protected override createRenderRoot() {
    // Before the page's first child, not the base's end marker: the header comes first
    const first = this.firstChild;
    const root = super.createRenderRoot();
    if (first) this.renderOptions.renderBefore = first;
    return root;
  }

  override connectedCallback() {
    // The card's styles hold the group's too
    adoptStyles("ui-tc", TcToolCallCard.css, this.ownerDocument);
    super.connectedCallback();
    // Cards added or removed change the summary
    this.mo = new MutationObserver((records) => {
      const isCard = (n: Node) => n instanceof Element && (n.localName === "tc-tool-call-card" || !!n.querySelector("tc-tool-call-card"));
      if (records.some((r) => [...r.addedNodes, ...r.removedNodes].some(isCard))) this.requestUpdate();
    });
    this.mo.observe(this, { childList: true, subtree: true });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.mo?.disconnect();
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.toggleAttribute("data-running", this.cards.some((c) => c.status === "running"));
    this.toggleAttribute("data-open", this.open);
  }

  protected override updated() {
    const body = this.body;
    if (body) {
      if (!body.id) body.id = `${this.uid}-list`;
      body.inert = !this.open;
    }
  }

  private setOpen(next: boolean) {
    if (next === this.open) return;
    if (this.emit<ToolCallOpenChange>("tc-open-change", { open: next }, { cancelable: true })) this.open = next;
  }

  protected override render() {
    const look = this.resolvedLook;
    const calls = this.cards;
    const running = calls.some((c) => c.status === "running");
    const failed = calls.filter((c) => c.status === "error").length;
    const measured = this.stopwatch.ms;
    const sum = calls.length && calls.every((c) => c.duration != null) ? calls.reduce((t, c) => t + (c.duration ?? 0), 0) : null;
    // Running: the span is always there (one text node), and the stopwatch writes the live value into it
    const ms = running ? (measured ?? 0) : (this.duration ?? sum ?? measured);
    const count = `Used ${calls.length} ${calls.length === 1 ? "tool" : "tools"}`;
    const title = running ? this.runningLabel : (this.label ?? count);
    const icons = calls.slice(-3);
    const first = calls.length - icons.length;

    return html`
      <span class="ui-tc-sr" role="status">${running ? "" : `${count}${failed ? `, ${failed} failed` : ""}`}</span>
      <button type="button" class="ui-tc-group__head" aria-expanded=${this.open ? "true" : "false"} aria-controls=${this.body?.id || `${this.uid}-list`} @click=${() => this.setOpen(!this.open)}>
        <span class="ui-tc-group__stack" aria-hidden="true">${repeat(
          icons,
          (_, i) => first + i,
          (c) => html`<span class="ui-tc__icon">${c.icon ? c.icon.cloneNode(true) : wrench}</span>`,
        )}</span>
        ${keyed(
          running ? "busy" : "done",
          html`<span class="ui-tc-group__title"><span class=${running ? "ui-tc-group__label ui-tc__shine" : "ui-tc-group__label"} data-text=${title}>${title}</span>${!running && failed > 0 ? html`<span class="ui-tc-group__failed">· ${failed} failed</span>` : nothing}${ms != null ? html`<span class="ui-tc-group__time" aria-hidden=${ifDefined(running ? "true" : undefined)}>${liveGroup(ms, running)}</span>` : nothing}</span>`,
        )}
        ${chevron(look)}
      </button>
    `;
  }
}

if (!customElements.get("tc-tool-call-card")) customElements.define("tc-tool-call-card", TcToolCallCard);
if (!customElements.get("tc-tool-call-group")) customElements.define("tc-tool-call-group", TcToolCallGroup);

declare global {
  interface HTMLElementTagNameMap {
    "tc-tool-call-card": TcToolCallCard;
    "tc-tool-call-group": TcToolCallGroup;
  }
}
