import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { reducedMotion } from "../internal/reduced-motion";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import type { Mark } from "./internal/chart/motion";
import { MotionController } from "./internal/chart/motion-controller";
import { FocusRescueController } from "./internal/controllers";
import { safeUrl } from "./internal/safe-url";
import { tokenMs } from "./internal/util";

/*
 * <tc-agent-recap> – what your agents did while you were away, for a home page. On top, a small chart of the period:
 * a quiet bar per 15 or 30 minutes, stacked by what happened (done, failed, needs you), with a marker over every notable
 * event – point at or focus one for what it was. Below, a board in three columns – Needs you, Failed, Done – acted on in
 * place: Approve and Retry send the item gliding out, Open follows its link. The header says when the period began
 * ("Since 6:40 PM yesterday"), the totals, and Clear done. Columns stack when it's narrow.
 * Standard: the header on a gray tray, the chart and the board on white cards. Clean: one white card.
 *
 *   <tc-agent-recap .since=${leftAt} .events=${events} .items=${items} @tc-item-action=${(e) => act(e.detail)}></tc-agent-recap>
 *
 * The page owns the items. Approve, Retry and Open fire a cancelable tc-item-action ({ id, action, item }); unless it's
 * prevented, an approved or retried item glides out of the board (and Open follows `href`). Clear done fires a
 * cancelable tc-clear-done ({ ids }). The chart's bars grow in the first time it's on screen (the charts' shared
 * motion); `still` or reduced motion draws them at once. Times are epoch ms; unset `now` reads the clock once.
 *
 * Keyboard. The chart's markers are one tab stop: ← → Home End move between them, each saying what happened. On the
 * board, Tab moves through the items' buttons.
 */

export type RecapKind = "done" | "failed" | "needs-you";

export type RecapEvent = {
  /** When it happened, in epoch ms */
  at: number;
  kind: RecapKind;
  /** What happened, for its marker: "Tax ID check timed out" */
  label?: string;
  /** Gets a marker over the chart – by default failed and needs-you events do, done ones don't */
  notable?: boolean;
};

export type RecapItem = {
  id: string;
  /** What happened, in a few words */
  title: string;
  status: RecapKind;
  /** A quiet line: why, or what came of it */
  detail?: string;
  /** Which agent */
  agent?: string;
  /** When, in epoch ms */
  at?: number;
  /** Where Open goes */
  href?: string;
};

/** Detail of tc-item-action: "approve", "retry" or "open" */
export type RecapItemAction = { id: string; action: "approve" | "retry" | "open"; item: RecapItem };
/** Detail of tc-clear-done */
export type RecapClearDone = { ids: string[] };

export type AgentRecapLabels = {
  needsYou: string;
  failed: string;
  done: string;
  approve: string;
  retry: string;
  open: string;
  clearDone: string;
  since: string;
  yesterday: string;
  empty: string;
  events: string;
};

export const defaultAgentRecapLabels: AgentRecapLabels = {
  needsYou: "Needs you",
  failed: "Failed",
  done: "Done",
  approve: "Approve",
  retry: "Retry",
  open: "Open",
  clearDone: "Clear done",
  since: "Since",
  yesterday: "yesterday",
  empty: "Nothing here",
  events: "What happened",
};

const KINDS: RecapKind[] = ["needs-you", "failed", "done"];
/** The most bars the chart draws; a longer period gets wider bins */
const MAX_BINS = 64;
const DURATION = 700;
const STAGGER = 10;

/** Wall time – read in updates only, never during render */
const wall = () => Date.now();
const formats = new Map<string, Intl.DateTimeFormat>();
const fmt = (locale: string | undefined, options: Intl.DateTimeFormatOptions) => {
  const key = `${locale ?? ""}|${JSON.stringify(options)}`;
  let f = formats.get(key);
  if (!f) formats.set(key, (f = new Intl.DateTimeFormat(locale, options)));
  return f;
};
const timeOfDay = (at: number, locale: string | undefined) => fmt(locale, { hour: "numeric", minute: "2-digit" }).format(at);
const dayKey = (at: number) => new Date(at).toDateString();

/** Bins over the period: how many of each kind happened in each */
export function recapBins(events: RecapEvent[], start: number, end: number, binMinutes?: number) {
  const span = Math.max(1, end - start);
  let size = (binMinutes ?? (span <= 6 * 3600_000 ? 15 : 30)) * 60_000;
  while (span / size > MAX_BINS) size *= 2;
  const n = Math.max(1, Math.ceil(span / size));
  const bins = Array.from({ length: n }, () => ({ done: 0, failed: 0, "needs-you": 0 }) as Record<RecapKind, number>);
  for (const e of events) {
    if (e.at < start || e.at > end) continue;
    bins[Math.min(n - 1, Math.floor((e.at - start) / size))][e.kind]++;
  }
  return { bins, size };
}

/* Icons: Lucide (ISC, lucide.dev), 24×24 strokes */
const ICON_RECAP = svg`<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>`;
const MARK: Record<RecapKind, string> = {
  "needs-you": "M12 8v4M12 16h.01",
  failed: "M18 6 6 18M6 6l12 12",
  done: "M20 6 9 17l-5-5",
};
const glyph = (d: string) => html`<svg class="ui-arcp__glyph" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;

type BinData = { i: number };
let instances = 0;

/**
 * What your agents did while you were away – a chart of the period with a marker per notable event, then Needs you,
 * Failed and Done, acted on in place.
 * @tag tc-agent-recap
 * @fires tc-item-action - Approve, Retry or Open on an item ({ id, action, item }: RecapItemAction); cancelable – unless prevented an approved or retried item glides out, and Open follows `href`
 * @fires tc-clear-done - Clear done ({ ids }: RecapClearDone); cancelable – unless prevented the done items glide out
 */
export class TcAgentRecap extends TcElement {
  static override ui = "arcp";

  /** The heading */
  @property() accessor heading = "Agent recap";
  /** When the period began – when you left – in epoch ms; unset starts at the first event */
  @property({ type: Number }) accessor since: number | undefined = undefined;
  /** When it ends, in epoch ms; unset reads the clock once */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Everything that happened, for the chart */
  @property({ attribute: false }) accessor events: RecapEvent[] = [];
  /** What's on the board, in any order – grouped by status, newest first */
  @property({ attribute: false }) accessor items: RecapItem[] = [];
  /** Minutes per bar; unset is 15 for six hours or less, else 30 (wider when it would pass 64 bars) */
  @property({ type: Number, attribute: "bin-minutes" }) accessor binMinutes: number | undefined = undefined;
  /** Draws the chart at once, without the entrance */
  @property({ type: Boolean }) accessor still = false;
  /** Locale for times */
  @property() accessor locale: string | undefined = undefined;
  /** Words the page can change, merged over defaultAgentRecapLabels */
  @property({ attribute: false }) accessor labels: Partial<AgentRecapLabels> = {};

  /** @internal The end of the period, read once */
  @state() accessor end = 0;
  /** @internal The marker pointed at or focused */
  @state() accessor hot: number | null = null;
  /** @internal The marker holding the tab stop */
  @state() accessor cursor = 0;
  /** @internal Items gliding out */
  @state() accessor leaving: string[] = [];
  /** @internal Items that have left the board */
  @state() accessor gone: string[] = [];
  /** @internal On screen: the entrance may start */
  @state() accessor onScreen = false;

  private readonly uid = `tc-arcp${++instances}`;
  private readonly motion = new MotionController<BinData>(this);
  private io?: IntersectionObserver;
  private dataGen = 0;
  private start = 0;
  private bins: Record<RecapKind, number>[] = [];

  constructor() {
    super();
    // An item that glides out may hold focus: it goes to the board
    new FocusRescueController(this, () => this.querySelector<HTMLElement>(".ui-arcp__board"));
  }

  private get l(): AgentRecapLabels {
    return { ...defaultAgentRecapLabels, ...this.labels };
  }

  private get motionEnabled() {
    return !this.still && !reducedMotion() && typeof window !== "undefined";
  }

  override connectedCallback() {
    super.connectedCallback();
    if (this.onScreen) return;
    if (typeof IntersectionObserver === "function") {
      this.io = new IntersectionObserver((entries) => {
        if (entries[entries.length - 1].isIntersecting) {
          this.onScreen = true;
          this.io?.disconnect();
        }
      });
      this.io.observe(this);
    } else this.onScreen = true;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.io?.disconnect();
    this.io = undefined;
  }

  /** Grows the bars again */
  replay() {
    this.motion.replay();
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (this.now !== undefined) this.end = this.now;
    else if (!this.end) this.end = wall();
    if (changed.has("items")) {
      const ids = new Set(this.items.map((i) => i.id));
      if (this.gone.some((id) => !ids.has(id))) this.gone = this.gone.filter((id) => ids.has(id));
    }
    if (["events", "since", "now", "binMinutes", "end"].some((k) => changed.has(k as keyof TcAgentRecap))) {
      this.start = this.since ?? Math.min(this.end - 3600_000, ...this.events.map((e) => e.at));
      const { bins } = recapBins(this.events, this.start, this.end, this.binMinutes);
      this.bins = bins;
      this.dataGen++;
    }
    const top = Math.max(1, ...this.bins.map((b) => b.done + b.failed + b["needs-you"]));
    const marks: Mark<BinData>[] = this.bins.map((b, i) => ({
      key: `b${i}`,
      to: [b.done / top, b.failed / top, b["needs-you"] / top],
      from: [0, 0, 0],
      delay: i * STAGGER,
      data: { i },
    }));
    this.motion.sync(marks, { enabled: this.motionEnabled, active: this.onScreen, dataKey: this.dataGen, easing: "spring", duration: DURATION, stagger: STAGGER });
  }

  /* ---------- The board ---------- */

  private get shown() {
    return this.items.filter((i) => !this.gone.includes(i.id));
  }

  private group(kind: RecapKind) {
    return this.shown.filter((i) => i.status === kind).sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
  }

  /** Glides items out of the board, then drops them */
  private leave(ids: string[]) {
    const fresh = ids.filter((id) => !this.leaving.includes(id) && !this.gone.includes(id));
    if (!fresh.length) return;
    this.leaving = [...this.leaving, ...fresh];
    const drop = (id: string) => {
      this.leaving = this.leaving.filter((x) => x !== id);
      if (!this.gone.includes(id)) this.gone = [...this.gone, id];
    };
    const duration = tokenMs(this, "--tc-duration-moderate", 240);
    const easing = getComputedStyle(this).getPropertyValue("--tc-ease-move").trim() || "ease-out";
    fresh.forEach((id, k) => {
      const row = this.querySelector<HTMLElement>(`.ui-arcp__item[data-id="${CSS.escape(id)}"]`);
      if (!row || !this.motionEnabled || typeof row.animate !== "function") return drop(id);
      const h = row.getBoundingClientRect().height;
      row
        .animate(
          [
            { opacity: 1, transform: "none", height: `${h}px` },
            { opacity: 0, transform: "translateX(12px)", height: "0px", paddingTop: "0px", paddingBottom: "0px", marginTop: "0px" },
          ],
          { duration, delay: k * 40, easing, fill: "forwards" },
        )
        .finished.then(
          () => drop(id),
          () => drop(id),
        );
    });
  }

  private act(e: Event, item: RecapItem, action: RecapItemAction["action"]) {
    const go = this.emit<RecapItemAction>("tc-item-action", { id: item.id, action, item }, { cancelable: true });
    if (!go) {
      if (e.currentTarget instanceof HTMLAnchorElement) e.preventDefault();
      return;
    }
    if (action !== "open") this.leave([item.id]);
  }

  private clearDone() {
    const ids = this.group("done").map((i) => i.id);
    if (!ids.length || !this.emit<RecapClearDone>("tc-clear-done", { ids }, { cancelable: true })) return;
    this.leave(ids);
  }

  /* ---------- Markers ---------- */

  private get markers() {
    return this.events
      .filter((e) => (e.notable ?? e.kind !== "done") && e.at >= this.start && e.at <= this.end)
      .sort((a, b) => a.at - b.at);
  }

  private onMarkerKey = (e: KeyboardEvent) => {
    const n = this.markers.length;
    if (!n) return;
    const to =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? Math.min(n - 1, this.cursor + 1)
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? Math.max(0, this.cursor - 1)
      : e.key === "Home" ? 0
      : e.key === "End" ? n - 1
      : -1;
    if (to < 0) return;
    e.preventDefault();
    this.cursor = to;
    this.hot = to;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-arcp__marker[data-i="${to}"]`)?.focus());
  };

  /* ---------- Rendering ---------- */

  private kindLabel(k: RecapKind) {
    const l = this.l;
    return k === "needs-you" ? l.needsYou : k === "failed" ? l.failed : l.done;
  }

  private sinceText() {
    const l = this.l;
    const time = timeOfDay(this.start, this.locale);
    const same = dayKey(this.start) === dayKey(this.end);
    const yesterday = dayKey(this.start) === dayKey(this.end - 86_400_000);
    const day = same ? "" : yesterday ? ` ${l.yesterday}` : ` ${fmt(this.locale, { weekday: "short" }).format(this.start)}`;
    return `${l.since} ${time}${day}`;
  }

  private renderChart() {
    const l = this.l;
    const n = this.bins.length;
    const w = 1000 / n;
    const gap = Math.min(w * 0.25, 6);
    const markers = this.markers;
    const span = Math.max(1, this.end - this.start);
    const stop = Math.min(this.cursor, Math.max(0, markers.length - 1));
    const hot = this.hot !== null ? markers[this.hot] : undefined;
    const bars = this.motion.items.map((it) => {
      const i = it.data.i;
      const [d, f, nd] = it.v.map((v) => Math.max(0, v) * 56);
      const x = i * w + gap / 2;
      const bw = Math.max(1, w - gap);
      return svg`<g class="ui-arcp__bin" opacity=${it.exiting ? 0 : 1}>
        <rect class="ui-arcp__bar" data-kind="done" x=${x} y=${60 - d} width=${bw} height=${d}></rect>
        <rect class="ui-arcp__bar" data-kind="failed" x=${x} y=${60 - d - f} width=${bw} height=${f}></rect>
        <rect class="ui-arcp__bar" data-kind="needs-you" x=${x} y=${60 - d - f - nd} width=${bw} height=${nd}></rect>
      </g>`;
    });
    const fade = this.motion.fade(DURATION * 0.5);
    return html`<div class="ui-arcp__chart">
      <div class="ui-arcp__plot">
        <svg class="ui-arcp__svg" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true">${bars}${svg`<path class="ui-arcp__base" d="M0 60H1000"></path>`}</svg>
        ${markers.length
          ? html`<div class="ui-arcp__markers" role="group" aria-label=${`${l.events}, ${this.sinceText()}`} @keydown=${this.onMarkerKey} style=${styleMap({ opacity: String(fade) })}>
              ${markers.map((m, i) => {
                const label = `${m.label ?? this.kindLabel(m.kind)} – ${this.kindLabel(m.kind)}, ${timeOfDay(m.at, this.locale)}`;
                return html`<button
                  type="button"
                  class="ui-arcp__marker"
                  data-i=${i}
                  data-kind=${m.kind}
                  ?data-hot=${this.hot === i}
                  tabindex=${i === stop ? 0 : -1}
                  aria-label=${label}
                  style=${styleMap({ "--x": `${((m.at - this.start) / span) * 100}%` })}
                  @mouseenter=${() => (this.hot = i)}
                  @mouseleave=${() => this.hot === i && (this.hot = null)}
                  @focus=${() => {
                    this.cursor = i;
                    this.hot = i;
                  }}
                  @blur=${() => this.hot === i && (this.hot = null)}
                >${glyph(MARK[m.kind])}</button>`;
              })}
            </div>`
          : nothing}
      </div>
      <div class="ui-arcp__axis" aria-hidden="true">
        <span>${timeOfDay(this.start, this.locale)}</span>
        <span class="ui-arcp__caption">${hot ? html`<b>${timeOfDay(hot.at, this.locale)}</b> · ${hot.label ?? this.kindLabel(hot.kind)}` : nothing}</span>
        <span>${timeOfDay(this.end, this.locale)}</span>
      </div>
      <ul class="ui-arcp__legend" aria-hidden="true">
        ${KINDS.map((k) => html`<li data-kind=${k}><span class="ui-arcp__key"></span>${this.kindLabel(k)}</li>`)}
      </ul>
    </div>`;
  }

  private button(item: RecapItem, action: RecapItemAction["action"], label: string, primary = false): TemplateResult {
    const href = action === "open" ? safeUrl(item.href) : undefined;
    const cls = `ui-arcp__btn${primary ? " ui-arcp__btn--primary" : ""}`;
    const leaving = this.leaving.includes(item.id);
    return href
      ? html`<a class=${cls} href=${href} @click=${(e: Event) => this.act(e, item, action)}>${label}<span class="ui-arcp__sr">: ${item.title}</span></a>`
      : html`<button type="button" class=${cls} ?disabled=${leaving} @click=${(e: Event) => this.act(e, item, action)}>${label}<span class="ui-arcp__sr">: ${item.title}</span></button>`;
  }

  private card(item: RecapItem) {
    const l = this.l;
    const meta = [item.agent, item.at !== undefined ? timeOfDay(item.at, this.locale) : undefined].filter(Boolean).join(" · ");
    const actions =
      item.status === "needs-you" ? html`${this.button(item, "approve", l.approve, true)}${item.href ? this.button(item, "open", l.open) : nothing}`
      : item.status === "failed" ? html`${this.button(item, "retry", l.retry)}${item.href ? this.button(item, "open", l.open) : nothing}`
      : item.href ? this.button(item, "open", l.open)
      : nothing;
    return html`<li class="ui-arcp__item" data-id=${item.id} data-kind=${item.status} ?data-leaving=${this.leaving.includes(item.id)}>
      <span class="ui-arcp__mark" aria-hidden="true">${glyph(MARK[item.status])}</span>
      <div class="ui-arcp__text">
        <span class="ui-arcp__title">${item.title}</span>
        ${item.detail ? html`<span class="ui-arcp__detail">${item.detail}</span>` : nothing}
        ${meta ? html`<span class="ui-arcp__meta">${meta}</span>` : nothing}
        ${actions !== nothing ? html`<span class="ui-arcp__actions">${actions}</span>` : nothing}
      </div>
    </li>`;
  }

  private column(kind: RecapKind) {
    const list = this.group(kind);
    const id = `${this.uid}-${kind}`;
    return html`<section class="ui-arcp__col" data-kind=${kind} aria-labelledby=${id}>
      <h4 class="ui-arcp__col-head" id=${id}><span class="ui-arcp__col-name">${this.kindLabel(kind)}</span> <span class="ui-arcp__count">${list.length}</span></h4>
      <ul class="ui-arcp__list" role="list">
        ${repeat(list, (i) => i.id, (i) => this.card(i))}
        ${list.length ? nothing : html`<li class="ui-arcp__empty">${this.l.empty}</li>`}
      </ul>
    </section>`;
  }

  protected override render() {
    const l = this.l;
    const counts = KINDS.map((k) => [k, this.group(k).filter((i) => !this.leaving.includes(i.id)).length] as const);
    const totals = counts.map(([k, n]) => `${n} ${k === "needs-you" ? (n === 1 ? "needs you" : "need you") : this.kindLabel(k).toLowerCase()}`).join(" · ");
    const doneLeft = counts.find(([k]) => k === "done")![1];
    const aside = html`<span class="ui-arcp__aside"
      ><span class="ui-arcp__totals">${totals}</span>${doneLeft
        ? html`<button type="button" class="ui-arcp__btn ui-arcp__btn--ghost" @click=${() => this.clearDone()}>${l.clearDone}</button>`
        : nothing}</span
    >`;
    const head = cardHead({ icon: ICON_RECAP, title: this.heading, subtitle: this.sinceText(), id: `${this.uid}-title`, aside });
    const clean = this.resolvedLook === "clean";
    const board = html`<div class="ui-arcp__board" tabindex="-1">${KINDS.map((k) => this.column(k))}</div>`;
    return html`<section class="ui-arcp__root" aria-labelledby=${`${this.uid}-title`}>
      ${clean ? html`<div class="ui-arcp__card">${head}${this.renderChart()}${board}</div>` : html`${head}<div class="ui-arcp__card">${this.renderChart()}</div>${board}`}
    </section>`;
  }

  static override css = /* css */ `
/* Standard: a gray tray; the chart on a white card, the columns as white cards below it */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="arcp"] {
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 100%;
  /* The bars: done quiet, failed and needs you in their status colours */
  --tc-arcp-done: var(--tc-fill-strong);
  --tc-arcp-failed: var(--tc-status-danger-solid);
  --tc-arcp-needs: var(--tc-status-warning-solid);
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="arcp"] {
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 100%;
  --tc-arcp-done: var(--tc-fill-strong);
  --tc-arcp-failed: var(--tc-status-danger-solid);
  --tc-arcp-needs: var(--tc-status-warning-solid);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="arcp"] *, [data-ui="arcp"] *::before, [data-ui="arcp"] *::after { box-sizing: border-box; }
:where([data-ui="arcp"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="arcp"] :is(button, a):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="arcp"] button:disabled { cursor: default; }
[data-ui="arcp"] :is(h4, ul, p) { margin: 0; padding: 0; }
[data-ui="arcp"] ul { list-style: none; }
.ui-arcp__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-arcp__glyph { display: block; flex: none; width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
.ui-arcp__aside { display: inline-flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-1) var(--tc-space-2); }
.ui-arcp__totals { font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); white-space: nowrap; }
/* ----- The chart ----- */
.ui-arcp__card { min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-arcp__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-arcp__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
.ui-arcp__chart { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-6) var(--tc-space-4) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *) .ui-arcp__chart { padding-top: var(--tc-space-5); }
.ui-arcp__plot { position: relative; height: 60px; }
.ui-arcp__svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.ui-arcp__bar[data-kind="done"] { fill: var(--tc-arcp-done); }
.ui-arcp__bar[data-kind="failed"] { fill: var(--tc-arcp-failed); }
.ui-arcp__bar[data-kind="needs-you"] { fill: var(--tc-arcp-needs); }
.ui-arcp__base { fill: none; stroke: var(--tc-border-default); stroke-width: 1; vector-effect: non-scaling-stroke; }
.ui-arcp__markers { position: absolute; inset: 0; pointer-events: none; }
/* A marker: the event's mark on a chip above the plot, colour and shape both saying what happened */
.ui-arcp__marker { position: absolute; top: -20px; left: calc(var(--x) - 10px); display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); pointer-events: auto; transition: transform var(--tc-duration-base) var(--tc-ease-move), box-shadow var(--tc-duration-base) var(--tc-ease-standard); }
.ui-arcp__marker[data-kind="needs-you"] { color: var(--tc-status-warning-fg); }
.ui-arcp__marker[data-kind="failed"] { color: var(--tc-status-danger-fg); }
.ui-arcp__marker[data-kind="done"] { color: var(--tc-status-success-fg); }
.ui-arcp__marker:hover, .ui-arcp__marker[data-hot] { z-index: 1; transform: scale(1.15); box-shadow: var(--tc-shadow-raised), 0 0 0 var(--tc-focus-ring-width) var(--tc-border-selected); }
.ui-arcp__axis { display: flex; align-items: baseline; justify-content: space-between; gap: var(--tc-space-3); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }
.ui-arcp__caption { flex: 1; min-width: 0; overflow: hidden; text-align: center; color: var(--tc-text-secondary); white-space: nowrap; text-overflow: ellipsis; }
.ui-arcp__caption b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-arcp__legend { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-3-5); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-arcp__legend li { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
.ui-arcp__key { width: 8px; height: 8px; border-radius: var(--tc-radius-2xs); }
[data-kind="done"] > .ui-arcp__key { background: var(--tc-arcp-done); }
[data-kind="failed"] > .ui-arcp__key { background: var(--tc-arcp-failed); }
[data-kind="needs-you"] > .ui-arcp__key { background: var(--tc-arcp-needs); }
/* ----- The board ----- */
.ui-arcp__board { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--tc-space-2); outline: none; }
:where([data-look="standard"], [data-look="standard"] *) .ui-arcp__board { margin-top: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *) .ui-arcp__board { padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-arcp__col { display: grid; align-content: start; gap: var(--tc-space-1); min-width: 0; padding: var(--tc-space-2); border-radius: var(--tc-card-radius); }
:where([data-look="standard"], [data-look="standard"] *) .ui-arcp__col { background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *) .ui-arcp__col { padding: var(--tc-space-1); background: var(--tc-fill-subtle); border-radius: var(--tc-radius-lg); }
.ui-arcp__col-head { display: flex; align-items: center; gap: var(--tc-space-1-5); padding: var(--tc-space-1) var(--tc-space-1-5); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-arcp__count { min-width: var(--tc-pill-h); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); font-variant-numeric: tabular-nums; text-align: center; color: var(--tc-text-secondary); }
.ui-arcp__list { display: grid; gap: var(--tc-space-1); }
.ui-arcp__item { display: flex; align-items: flex-start; gap: var(--tc-space-2); overflow: hidden; padding: var(--tc-space-2) var(--tc-space-2-5); border-radius: var(--tc-radius-md); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 1px var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *) .ui-arcp__item { box-shadow: var(--tc-shadow-raised); }
.ui-arcp__mark { display: grid; flex: none; place-items: center; width: 18px; height: 18px; margin-top: var(--tc-space-0-5); border-radius: 50%; }
[data-kind="needs-you"] > .ui-arcp__mark { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
[data-kind="failed"] > .ui-arcp__mark { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
[data-kind="done"] > .ui-arcp__mark { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-arcp__text { display: grid; flex: 1; gap: var(--tc-space-0-5); min-width: 0; }
.ui-arcp__title { color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-arcp__detail, .ui-arcp__meta { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-arcp__meta { font-variant-numeric: tabular-nums; }
.ui-arcp__actions { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); margin-top: var(--tc-space-1); }
.ui-arcp__empty { padding: var(--tc-space-2) var(--tc-space-1-5); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
/* ----- Buttons ----- */
.ui-arcp__btn { display: inline-flex; flex: none; align-items: center; justify-content: center; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); line-height: var(--tc-line-height-none); color: var(--tc-action-secondary-fg); text-decoration: none; white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-arcp__btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-arcp__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-arcp__btn--primary:hover { background: var(--tc-action-primary-bg-hover); }
.ui-arcp__btn--ghost { background: none; box-shadow: none; color: var(--tc-action-ghost-fg); }
.ui-arcp__btn--ghost:hover { background: var(--tc-action-ghost-bg-hover); box-shadow: none; color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *) .ui-arcp__btn:not(.ui-arcp__btn--primary, .ui-arcp__btn--ghost) { background: var(--tc-fill-default); box-shadow: none; }
/* Narrow: the columns stack */
@container (max-width: 600px) {
  .ui-arcp__board { grid-template-columns: minmax(0, 1fr); }
  .ui-arcp__caption { display: none; }
}
@media (pointer: coarse) {
  .ui-arcp__btn { height: 36px; }
  .ui-arcp__marker { width: 28px; height: 28px; left: calc(var(--x) - 14px); top: -26px; }
}
@media (forced-colors: active) {
  .ui-arcp__bar { fill: CanvasText; }
  .ui-arcp__bar[data-kind="failed"], .ui-arcp__bar[data-kind="needs-you"] { fill: Highlight; }
  .ui-arcp__marker, .ui-arcp__mark { outline: 1px solid CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="arcp"] *, [data-ui="arcp"] *::before, [data-ui="arcp"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-agent-recap")) customElements.define("tc-agent-recap", TcAgentRecap);

declare global {
  interface HTMLElementTagNameMap {
    "tc-agent-recap": TcAgentRecap;
  }
}
