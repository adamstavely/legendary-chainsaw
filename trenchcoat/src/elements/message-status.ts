import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { TcElement } from "./internal/base";

/*
 * <tc-message-status> – the quiet row under a message the person sent: a read receipt, when it was sent, and controls.
 *   · The receipt: a clock while sending, one tick once sent, two once delivered, two in the accent once read, and a red
 *     alert with "Not sent" and a Retry button when it failed. A change of receipt is announced politely
 *   · The time, relative – "Just now", "2 min ago", "Yesterday" or a date – kept fresh by its own clock, with the full date
 *     in <time datetime> and its tooltip
 *   · Copy (the icon turns into a check), Send again, Branch into a new chat, and Edit – one tab stop, arrow keys between
 * Like Message Actions, the controls stay out of the way until the message is hovered or something in the row is
 * focused; the receipt and time always show. Clean uses the thinner glyphs and the bigger hit targets.
 *
 *   <tc-message-status receipt="read" .time=${sentAt} text="Hello"></tc-message-status>
 */

export type MessageReceipt = "sending" | "sent" | "delivered" | "read" | "failed";
export type MessageStatusAction = "copy" | "retry" | "branch" | "edit";

/** Details of the events */
export type MessageStatusRetry = { receipt: MessageReceipt };
export type MessageStatusCopy = { text?: string };

/** Every word the row shows or says */
export type MessageStatusLabels = {
  /** The row's controls, as a toolbar */
  controls: string;
  sending: string;
  sent: string;
  delivered: string;
  read: string;
  /** Shown beside the alert when the message failed */
  failed: string;
  copy: string;
  copied: string;
  copyFailed: string;
  /** Retry on a message that was sent */
  sendAgain: string;
  /** Retry on a message that failed */
  retry: string;
  sendingAgain: string;
  retryFailed: string;
  branch: string;
  edit: string;
  justNow: string;
  minutesAgo: (n: number) => string;
  hoursAgo: (n: number) => string;
  yesterday: string;
};

export const defaultMessageStatusLabels: MessageStatusLabels = {
  controls: "Message controls",
  sending: "Sending…",
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
  failed: "Not sent",
  copy: "Copy",
  copied: "Copied",
  copyFailed: "Couldn't copy",
  sendAgain: "Send again",
  retry: "Retry",
  sendingAgain: "Sending again…",
  retryFailed: "Couldn't send",
  branch: "Branch into a new chat",
  edit: "Edit message",
  justNow: "Just now",
  minutesAgo: (n) => `${n} min ago`,
  hoursAgo: (n) => `${n} hr ago`,
  yesterday: "Yesterday",
};

const DEFAULT_ACTIONS: MessageStatusAction[] = ["copy", "retry", "branch"];
const RECEIPTS: MessageReceipt[] = ["sending", "sent", "delivered", "read", "failed"];
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const isPromise = (value: unknown): value is Promise<unknown> => !!value && typeof (value as Promise<unknown>).then === "function";

/** The epoch ms of a Date, ISO string or number – undefined when it doesn't parse */
const toMs = (t: Date | string | number | undefined) => {
  if (t === undefined || t === null || t === "") return undefined;
  const ms = t instanceof Date ? t.getTime() : typeof t === "number" ? t : new Date(t).getTime();
  return Number.isFinite(ms) ? ms : undefined;
};

/** Midnight at the start of `ms`'s day, local time */
const startOfDay = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** "Just now", "2 min ago", "3 hr ago", "Yesterday" or a short date */
export function relativeMessageTime(at: number, now: number, labels: MessageStatusLabels = defaultMessageStatusLabels, locale?: string) {
  const ago = now - at;
  if (ago < MINUTE) return labels.justNow;
  if (ago < HOUR) return labels.minutesAgo(Math.floor(ago / MINUTE));
  const today = startOfDay(now);
  if (at >= today) return labels.hoursAgo(Math.floor(ago / HOUR));
  if (at >= today - DAY) return labels.yesterday;
  const sameYear = new Date(at).getFullYear() === new Date(now).getFullYear();
  return new Intl.DateTimeFormat(locale, sameYear ? { month: "short", day: "numeric" } : { year: "numeric", month: "short", day: "numeric" }).format(at);
}

/* ---------- Icons: 24-unit outline paths – Standard draws them at 1.7, Clean thinner. Branch and Edit after Lucide (ISC) ---------- */
const glyph = (d: string) => html`<svg viewBox="0 0 24 24" class="ui-mst__glyph" aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;
const paths = {
  copy: "M9 9.5A1.5 1.5 0 0 1 10.5 8h8A1.5 1.5 0 0 1 20 9.5v9a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 9 18.5zM15 8V5.5A1.5 1.5 0 0 0 13.5 4h-8A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H9",
  check: "M5.5 12.5l4.2 4.2L18.5 7.8",
  retry: "M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9M4.5 4.5V9H9",
  branch: "M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9",
  edit: "M16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1 1-4Z",
  tick: "M5 12.5l4.5 4.5L19 7.5",
  ticks: "M1.5 12.5 6 17l9.5-9.5M11 15.5l1.5 1.5L22 7.5",
  clock: "M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM12 7.5V12l3 2",
  alert: "M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM12 8v4.5M12 16v.01",
};
const ICON: Record<keyof typeof paths, TemplateResult> = Object.fromEntries(Object.entries(paths).map(([k, d]) => [k, glyph(d)])) as Record<keyof typeof paths, TemplateResult>;
const RECEIPT_ICON: Record<MessageReceipt, TemplateResult> = {
  sending: ICON.clock,
  sent: ICON.tick,
  delivered: ICON.ticks,
  read: ICON.ticks,
  failed: ICON.alert,
};

/**
 * The row under a sent message: its read receipt, a relative time, and Copy, Send again, Branch and Edit.
 * @tag tc-message-status
 * @fires tc-copy - `text` is on the clipboard (or Copy was pressed without `text`); detail `{ text?: string }`
 * @fires tc-retry - Send again or Retry was pressed; detail `{ receipt }`. Cancelable: preventDefault() skips `onRetry`
 * @fires tc-branch - Branch into a new chat was pressed; detail `{}`. Cancelable
 * @fires tc-edit - Edit was pressed; detail `{}`. Cancelable
 */
export class TcMessageStatus extends TcElement {
  static override ui = "mst";

  /** Where the message is: "sending", "sent", "delivered", "read" or "failed" */
  @property({ reflect: true }) accessor receipt: MessageReceipt = "sent";
  /** When it was sent – a Date, an ISO string or epoch ms. Unset, no time shows */
  @property({ attribute: false }) accessor time: Date | string | number | undefined = undefined;
  /** The current time in epoch ms, for tests and stories; unset, the row keeps its own clock */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The message text – what Copy puts on the clipboard */
  @property() accessor text: string | undefined = undefined;
  /** Which controls to show, in this order. Retry shows anyway while the message has failed */
  @property({ attribute: false }) accessor actions: MessageStatusAction[] = DEFAULT_ACTIONS;
  /** Called after tc-retry when it isn't prevented. Return a promise to keep the arrow spinning until it settles */
  @property({ attribute: false }) accessor onRetry: (() => void | Promise<unknown>) | undefined = undefined;
  /** "end" for the person's own message (the default), "start" to line up on the left */
  @property({ reflect: true }) accessor align: "start" | "end" = "end";
  /** Controls stay hidden until the message is hovered or focused (default true; quiet="false" shows them always). Put data-ui-message on the message wrapper */
  @property({ converter: { fromAttribute: (v: string | null) => v !== "false" } }) accessor quiet = true;
  /** Every word the row shows or says, merged over the defaults */
  @property({ attribute: false }) accessor labels: Partial<MessageStatusLabels> = {};
  /** The locale for dates older than yesterday */
  @property() accessor locale: string | undefined = undefined;

  /** @internal */ @state() accessor clock = 0;
  /** @internal */ @state() accessor active = 0;
  /** @internal */ @state() accessor status = "";
  /** @internal A new object per attempt, so pressing again restarts the timer */
  @state() accessor copyResult: { ok: boolean } | null = null;
  /** @internal */ @state() accessor retrying = false;
  /** @internal */ @state() accessor retryFailed = false;
  /** @internal */ @state() accessor spin = 0;
  /** @internal */ @state() accessor hush = false;

  private alive = false;
  private ticker: number | undefined;
  private copyTimer: number | undefined;

  /** @internal The words in use */
  get words(): MessageStatusLabels {
    return { ...defaultMessageStatusLabels, ...this.labels };
  }

  /** @internal The controls shown – Retry joins them while the message has failed */
  get shown(): MessageStatusAction[] {
    const list = this.actions.filter((a, i, all) => all.indexOf(a) === i);
    return this.receipt === "failed" && !list.includes("retry") ? ["retry", ...list] : list;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.alive = true;
    this.tick();
    // Relative times move on: refresh twice a minute (cheap – one state write)
    this.ticker = window.setInterval(() => this.tick(), 30_000);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.alive = false;
    clearInterval(this.ticker);
    clearTimeout(this.copyTimer);
  }

  private tick() {
    if (this.now === undefined) this.clock = Date.now();
  }

  private announce(s: string) {
    this.status = this.status === s ? `${s} ` : s;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("receipt") && !RECEIPTS.includes(this.receipt)) this.receipt = "sent";
    // A change of receipt after the first render is announced: "Delivered", "Read", "Not sent"
    if (changed.has("receipt") && changed.get("receipt") !== undefined && this.hasUpdated) {
      const w = this.words;
      this.announce(this.receipt === "sending" ? w.sending : w[this.receipt]);
    }
    if (changed.has("receipt") && this.receipt !== "failed") this.retryFailed = false;
    const count = this.shown.length;
    if (this.active >= count) this.active = Math.max(0, count - 1);
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    this.toggleAttribute("data-quiet", this.quiet);
    this.toggleAttribute("data-active", this.copyResult?.ok === true || this.retrying);
    this.toggleAttribute("data-hush", this.hush);
  }

  /* ----- Copy ----- */
  private async copy() {
    const text = this.text;
    if (text === undefined) {
      this.emit<MessageStatusCopy>("tc-copy", { text });
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      if (!this.alive) return;
      this.flashCopy(false);
      this.announce(this.words.copyFailed);
      return;
    }
    if (!this.alive) return;
    this.emit<MessageStatusCopy>("tc-copy", { text });
    this.flashCopy(true);
    this.announce(this.words.copied);
  }
  private flashCopy(ok: boolean) {
    this.copyResult = { ok };
    clearTimeout(this.copyTimer);
    this.copyTimer = window.setTimeout(() => (this.copyResult = null), 1600);
  }

  /* ----- Retry: the arrow spins once per press; a promise keeps it busy, a rejection says so ----- */
  private retry() {
    if (this.retrying) return;
    if (!this.emit<MessageStatusRetry>("tc-retry", { receipt: this.receipt }, { cancelable: true })) return;
    this.spin++;
    this.retryFailed = false;
    const result = this.onRetry?.();
    if (!isPromise(result)) return;
    this.retrying = true;
    this.announce(this.words.sendingAgain);
    result.then(
      () => {
        if (this.alive) this.retrying = false;
      },
      () => {
        if (!this.alive) return;
        this.retrying = false;
        this.retryFailed = true;
        this.announce(this.words.retryFailed);
      },
    );
  }

  /* ----- Roving focus across the controls ----- */
  private onKey(e: KeyboardEvent) {
    if (e.key === "Escape" && !this.hush) {
      // Tooltips hide with Esc without moving focus (WCAG 1.4.13)
      e.stopPropagation();
      this.hush = true;
      return;
    }
    const count = this.shown.length;
    const to = { ArrowRight: this.active + 1, ArrowLeft: this.active - 1, Home: 0, End: count - 1 }[e.key];
    if (to === undefined || !count) return;
    e.preventDefault();
    this.active = (to + count) % count;
    void this.updateComplete.then(() => this.querySelectorAll<HTMLElement>(".ui-mst__btn")[this.active]?.focus());
  }

  /** One control with its tooltip */
  private button(o: { name: MessageStatusAction; index: number; tip: string; labelText: string; onClick: () => void; content: unknown; text?: string; keep?: boolean; done?: boolean; busy?: boolean; flash?: boolean }) {
    return html`<span class="ui-mst__item" data-keep=${ifDefined(o.keep ? "" : undefined)} data-flash=${ifDefined(o.flash ? "" : undefined)}>
      <button
        type="button"
        class="ui-mst__btn ui-mst__btn--${o.name}"
        data-text=${ifDefined(o.text ? "" : undefined)}
        tabindex=${o.index === this.active ? 0 : -1}
        aria-label=${ifDefined(o.text ? undefined : o.labelText)}
        data-done=${ifDefined(o.done ? "" : undefined)}
        data-busy=${ifDefined(o.busy ? "" : undefined)}
        aria-busy=${ifDefined(o.busy ? "true" : undefined)}
        @focus=${() => (this.active = o.index)}
        @click=${o.onClick}
      >${o.content}${o.text ? html`<span class="ui-mst__btn-text">${o.text}</span>` : nothing}</button>
      ${o.text ? nothing : html`<span class="ui-mst__tip" aria-hidden="true">${o.tip}</span>`}
    </span>`;
  }

  protected override render() {
    const w = this.words;
    const receipt = this.receipt;
    const failed = receipt === "failed";
    const at = toMs(this.time);
    const now = this.now ?? this.clock;
    const copied = this.copyResult?.ok === true;
    const copyFailed = this.copyResult?.ok === false;
    const word = receipt === "sending" ? w.sending : w[receipt];
    const full = at === undefined ? "" : new Intl.DateTimeFormat(this.locale, { dateStyle: "full", timeStyle: "short" }).format(at);

    const controls = this.shown.map((key, index) => {
      if (key === "copy")
        return this.button({
          name: "copy",
          index,
          tip: copied ? w.copied : copyFailed ? w.copyFailed : w.copy,
          labelText: copied ? w.copied : copyFailed ? w.copyFailed : w.copy,
          onClick: () => void this.copy(),
          flash: copied,
          done: copied,
          content: html`<span class="ui-mst__icon ui-mst__morph">
            <span class="ui-mst__layer" data-on=${ifDefined(copied ? undefined : "")}>${ICON.copy}</span>
            <span class="ui-mst__layer ui-mst__layer--check" data-on=${ifDefined(copied ? "" : undefined)}>${ICON.check}</span>
          </span>`,
        });
      if (key === "retry") {
        const tip = this.retrying ? w.sendingAgain : this.retryFailed ? w.retryFailed : failed ? w.retry : w.sendAgain;
        return this.button({
          name: "retry",
          index,
          tip,
          labelText: failed ? w.retry : w.sendAgain,
          text: failed ? w.retry : undefined,
          keep: failed,
          busy: this.retrying,
          onClick: () => this.retry(),
          content: html`<span class="ui-mst__icon">${keyed(this.spin, html`<span class="ui-mst__spin" data-spin=${ifDefined(this.spin ? "" : undefined)}>${ICON.retry}</span>`)}</span>`,
        });
      }
      const name = key === "branch" ? w.branch : w.edit;
      return this.button({
        name: key,
        index,
        tip: name,
        labelText: name,
        onClick: () => void this.emit(`tc-${key}`, {}, { cancelable: true }),
        content: html`<span class="ui-mst__icon">${key === "branch" ? ICON.branch : ICON.edit}</span>`,
      });
    });

    return html`<div class="ui-mst__row">
      <span class="ui-mst__meta">
        <span class="ui-mst__receipt" data-receipt=${receipt} title=${word}>
          <span class="ui-mst__mark">${RECEIPT_ICON[receipt]}</span>
          ${receipt === "sending" || failed ? html`<span class="ui-mst__word">${word}</span>` : html`<span class="ui-mst__sr">${word}</span>`}
        </span>
        ${at !== undefined && receipt !== "sending"
          ? html`<time class="ui-mst__time" datetime=${new Date(at).toISOString()} title=${full}>${relativeMessageTime(at, now, w, this.locale)}</time>`
          : nothing}
      </span>
      ${controls.length
        ? html`<span class="ui-mst__dot" aria-hidden="true">·</span>
            <div
              class="ui-mst__bar"
              role="toolbar"
              aria-label=${w.controls}
              @keydown=${(e: KeyboardEvent) => this.onKey(e)}
              @focusin=${() => (this.hush = false)}
              @pointerenter=${() => (this.hush = false)}
            >${controls}</div>`
        : nothing}
      <span class="ui-mst__sr" role="status">${this.status}</span>
    </div>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="mst"] {
  --tc-mst-btn: var(--tc-control-h-sm);
  --tc-mst-radius: var(--tc-control-radius-sm);
  --tc-mst-hover: var(--tc-fill-hover);
  --tc-mst-stroke: 1.7;
  --tc-mst-quiet-color: var(--tc-text-muted);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="mst"] {
  --tc-mst-btn: var(--tc-control-h-md);
  --tc-mst-radius: var(--tc-control-radius-md);
  --tc-mst-hover: var(--tc-fill-subtle);
  --tc-mst-stroke: 1.3;
  --tc-mst-quiet-color: var(--tc-icon-muted);
}
[data-ui="mst"] {
  box-sizing: border-box;
  display: block;
  width: 100%;
  min-width: 0;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-text-muted);
  -webkit-font-smoothing: antialiased;
}
[data-ui="mst"] *, [data-ui="mst"] *::before, [data-ui="mst"] *::after { box-sizing: border-box; }
:where([data-ui="mst"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="mst"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="mst"] svg { display: block; flex: none; }
.ui-mst__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-mst__row { display: flex; align-items: center; justify-content: flex-end; gap: var(--tc-space-1); min-height: var(--tc-mst-btn); }
[data-ui="mst"][align="start"] .ui-mst__row { justify-content: flex-start; }
.ui-mst__meta { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; white-space: nowrap; }
.ui-mst__receipt { display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-mst__mark { display: grid; place-items: center; width: 16px; height: 16px; }
.ui-mst__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: var(--tc-mst-stroke); stroke-linecap: round; stroke-linejoin: round; }
.ui-mst__receipt[data-receipt="read"] { color: var(--tc-accent-text); }
.ui-mst__receipt[data-receipt="failed"] { color: var(--tc-status-danger-fg); font-weight: var(--tc-font-weight-medium); }
.ui-mst__receipt[data-receipt="sending"] .ui-mst__mark { animation: ui-mst-pulse var(--tc-duration-reveal-slow) var(--tc-ease-in-out) infinite; }
.ui-mst__time { font-variant-numeric: tabular-nums; }
.ui-mst__dot { color: var(--tc-text-muted); }
.ui-mst__bar { display: flex; align-items: center; gap: var(--tc-space-0-5); }
/* Quiet: the controls wait for the message to be hovered or focused – Retry on a failed message always shows */
.ui-mst__dot, .ui-mst__item { transition: opacity var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="mst"][data-quiet] :is(.ui-mst__dot, .ui-mst__item:not([data-keep])) { opacity: 0; }
[data-ui="mst"][data-quiet][receipt="failed"] .ui-mst__dot,
[data-ui="mst"][data-quiet]:hover :is(.ui-mst__dot, .ui-mst__item),
[data-ui="mst"][data-quiet]:focus-within :is(.ui-mst__dot, .ui-mst__item),
[data-ui="mst"][data-quiet][data-active] :is(.ui-mst__dot, .ui-mst__item),
:where([data-ui-message]:hover, [data-ui-message]:focus-within) [data-ui="mst"][data-quiet] :is(.ui-mst__dot, .ui-mst__item) { opacity: 1; }
.ui-mst__item { position: relative; display: inline-flex; flex: none; }
.ui-mst__btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1); min-width: var(--tc-mst-btn); height: var(--tc-mst-btn); border-radius: var(--tc-mst-radius); color: var(--tc-mst-quiet-color); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-mst__btn:hover { background: var(--tc-mst-hover); color: var(--tc-text-primary); }
.ui-mst__btn[data-text] { padding: 0 var(--tc-space-2); color: var(--tc-status-danger-fg); font-weight: var(--tc-font-weight-medium); }
.ui-mst__btn[data-text]:hover { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-mst__btn--copy[data-done] { color: var(--tc-status-success-fg); }
.ui-mst__btn[data-busy] { color: var(--tc-text-primary); }
.ui-mst__icon { position: relative; display: grid; place-items: center; width: 16px; height: 16px; transition: transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-mst__btn:active .ui-mst__icon { transform: scale(0.9); }
/* Copy: two icons on top of each other – one blurs away while the other comes in */
.ui-mst__morph { display: grid; }
.ui-mst__layer { grid-area: 1 / 1; display: grid; place-items: center; opacity: 0; transform: scale(0.6); filter: blur(2px); transition: opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-slow) var(--tc-ease-move), filter var(--tc-duration-base) var(--tc-ease-standard); }
.ui-mst__layer[data-on] { opacity: 1; transform: none; filter: none; }
/* Retry spins once per press (backwards, like its arrow), and keeps going while busy */
.ui-mst__spin { display: grid; place-items: center; }
.ui-mst__spin[data-spin] { animation: ui-mst-spin var(--tc-duration-reveal) var(--tc-ease-move); }
.ui-mst__btn[data-busy] .ui-mst__spin { animation: ui-mst-spin var(--tc-duration-reveal-slow) linear infinite; }
/* Tooltips: above the button, on hover after a beat, on keyboard focus, and briefly after Copy */
:where([data-look="standard"], [data-look="standard"] *).ui-mst__tip { background: var(--tc-tooltip-bg); color: var(--tc-tooltip-fg); font-size: var(--tc-font-size-xs); }
:where([data-look="clean"], [data-look="clean"] *).ui-mst__tip { background: var(--tc-surface-overlay); box-shadow: var(--tc-shadow-overlay); color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); }
.ui-mst__tip { position: absolute; bottom: calc(100% + 6px); left: 50%; z-index: 3; display: block; width: max-content; padding: var(--tc-space-1) var(--tc-space-2); border-radius: var(--tc-tooltip-radius); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); white-space: nowrap; visibility: hidden; opacity: 0; transform: translate(-50%, 3px); transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-base) var(--tc-ease-move), visibility 0s linear var(--tc-duration-base); }
[data-ui="mst"][align="end"] .ui-mst__item:last-child .ui-mst__tip { left: auto; right: 0; transform: translateY(3px); }
.ui-mst__btn:focus-visible + .ui-mst__tip,
.ui-mst__item[data-flash] .ui-mst__tip { visibility: visible; opacity: 1; transform: translate(-50%, 0); transition-delay: 0ms; }
[data-ui="mst"][align="end"] .ui-mst__item:last-child :is(.ui-mst__btn:focus-visible + .ui-mst__tip),
[data-ui="mst"][align="end"] .ui-mst__item[data-flash]:last-child .ui-mst__tip { transform: none; }
@media (hover: hover) {
  .ui-mst__item:hover .ui-mst__tip { visibility: visible; opacity: 1; transform: translate(-50%, 0); transition-delay: var(--tc-duration-slower); }
  [data-ui="mst"][align="end"] .ui-mst__item:last-child:hover .ui-mst__tip { transform: none; }
}
[data-ui="mst"][data-hush] .ui-mst__item .ui-mst__tip { visibility: hidden; opacity: 0; transition: none; }
@keyframes ui-mst-spin { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
@keyframes ui-mst-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
/* Narrow: the time steps aside (still read out) before the controls do */
@container (max-width: 220px) {
  .ui-mst__time { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
}
@media (pointer: coarse) {
  [data-ui="mst"][data-quiet] :is(.ui-mst__dot, .ui-mst__item) { opacity: 1; }
  [data-ui="mst"] { --tc-mst-btn: 36px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="mst"] *, [data-ui="mst"] *::before, [data-ui="mst"] *::after { animation: none !important; transition: none !important; }
}
@media (forced-colors: active) {
  .ui-mst__receipt[data-receipt="read"], .ui-mst__receipt[data-receipt="failed"] { color: CanvasText; }
}
`;
}

if (!customElements.get("tc-message-status")) customElements.define("tc-message-status", TcMessageStatus);

declare global {
  interface HTMLElementTagNameMap {
    "tc-message-status": TcMessageStatus;
  }
}
