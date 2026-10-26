import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { keyed } from "lit/directives/keyed.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { easeOutQuart } from "../internal/ease";
import { reducedMotion } from "../internal/reduced-motion";
import { TcElement } from "./internal/base";

/*
 * <tc-compact-breakdown> – the Lit port of src/components/compact-breakdown.tsx: one total split into its parts, in a
 * small card. A big number, a thin stacked bar and the parts as a ranked list. Switching the period rolls every
 * number, the bar glides to its new split and the rows trade places when the ranking changes. Hovering a part (in the
 * bar or the list) dims the rest and rolls the big number to that part's value; leaving rolls it back.
 *
 *   <tc-compact-breakdown heading="Revenue" .items=${[{ label: "Search", value: 40 }]} .periods=${periods}>
 *   </tc-compact-breakdown>
 *
 * The host is the group (role="group"), named by the heading. Standard sets a white card on a gray tray that holds the
 * footer line; Clean is one white card with hairline shadows, the footer as its last row.
 */

export type BreakdownItem = {
  /** Stable key across periods – defaults to the label */
  id?: string;
  label: string;
  value: number;
  /** Any CSS color – defaults to shades of the accent, then grays */
  color?: string;
};

export type BreakdownPeriod = { id: string; label: string };

/** Detail of tc-period-change */
export type BreakdownPeriodChange = { period: string };

const INTEGER = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const defaultFormat = (n: number) => INTEGER.format(n);
const PALETTE = ["var(--tc-compact-breakdown-series-1)", "var(--tc-compact-breakdown-series-2)", "var(--tc-compact-breakdown-series-3)", "var(--tc-compact-breakdown-series-4)", "var(--tc-compact-breakdown-series-5)"];
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const keyOf = (item: BreakdownItem) => item.id ?? item.label;

type Known = { key: string; label: string; color: string };
type Values = Record<string, number>;

/** Every part ever shown, in first-seen order, with its latest label and color – the same array when nothing changed */
function mergeKnown(known: Known[], items: BreakdownItem[]): Known[] {
  let next = known;
  for (const item of items) {
    const key = keyOf(item);
    const i = next.findIndex((k) => k.key === key);
    if (i === -1) {
      next = [...next, { key, label: item.label, color: item.color ?? PALETTE[next.length] ?? "var(--tc-compact-breakdown-series-5)" }];
    } else if (next[i].label !== item.label || (item.color && next[i].color !== item.color)) {
      next = next.map((k, j) => (j === i ? { ...k, label: item.label, color: item.color ?? k.color } : k));
    }
  }
  return next;
}

let uid = 0;

/**
 * One total split into its parts: a big number, a stacked bar and a ranked list, with an optional period switch.
 * @tag tc-compact-breakdown
 * @fires tc-period-change - A period was picked; detail `{ period: string }`. Cancelable: preventDefault() keeps the current period (controlled use)
 */
export class TcCompactBreakdown extends TcElement {
  static override ui = "cb";

  /** The heading, and the group's name */
  @property() accessor heading = "Breakdown";
  /** The parts of the shown period – the list ranks them by value */
  @property({ attribute: false }) accessor items: BreakdownItem[] = [];
  /** Options of the period switch – no switch when left out */
  @property({ attribute: false }) accessor periods: BreakdownPeriod[] | undefined = undefined;
  /** The chosen period id; unset is the first period */
  @property() accessor period: string | undefined = undefined;
  /** Change against the previous period in percent, e.g. 12.4 or -3 – shown as a small pill */
  @property({ type: Number }) accessor delta: number | undefined = undefined;
  /** Formats every value, e.g. (n) => `$${Math.round(n).toLocaleString("en-US")}` */
  @property({ attribute: false }) accessor format: (value: number) => string = defaultFormat;
  /** Text under the big number while nothing is hovered */
  @property({ attribute: "total-label" }) accessor totalLabel = "Total";
  /** Replaces the footer line: text, or an element (cloned); null hides it; unset shows the largest part */
  @property({ attribute: false }) accessor footer: Element | string | null | undefined = undefined;

  /** @internal The part under the pointer */
  @state() accessor active: string | null = null;
  /** @internal Every part ever shown keeps its place in the bar and its color, so the bar only glides */
  @state() accessor known: Known[] = [];
  /** @internal The rolled values of every part, the total and the big figure */
  @state() accessor shown: Values = {};

  private readonly uid = `tc-cb-${++uid}`;
  private signature = "";
  private started = false;
  private frame = 0;
  private target: Values = {};
  private tops = new Map<string, number>();
  private order = "";
  private placed = false;
  private placedFor = "";
  private ro?: ResizeObserver;
  private observed?: Element;
  private ownName = false;

  /** @internal The period in use */
  get activePeriod() {
    return this.period ?? this.periods?.[0]?.id;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    this.ownName ||= this.hasAttribute("aria-label") || (this.hasAttribute("aria-labelledby") && this.getAttribute("aria-labelledby") !== `${this.uid}-title`);
    if (!this.ownName) this.setAttribute("aria-labelledby", `${this.uid}-title`);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    // A tween cut short lands on its target
    if (this.frame) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
      this.shown = this.target;
    }
    this.ro?.disconnect();
    this.ro = undefined;
    this.observed = undefined;
  }

  private now() {
    return new Map(this.items.map((i) => [keyOf(i), Math.max(0, i.value)]));
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const known = mergeKnown(this.known, this.items);
    if (known !== this.known) this.known = known;
    const now = this.now();
    const total = [...now.values()].reduce((a, b) => a + b, 0);
    const activeValid = this.active !== null && now.has(this.active) ? this.active : null;
    const target: Values = { "#total": total, "#figure": activeValid ? (now.get(activeValid) ?? 0) : total };
    for (const k of known) target[k.key] = now.get(k.key) ?? 0;
    const signature = JSON.stringify(target);
    if (signature !== this.signature) {
      this.signature = signature;
      this.tween(target);
    }
  }

  /** Rolls every value from where it is to `to` – one frame loop for the whole card, so numbers and bars move in step */
  private tween(to: Values) {
    this.target = to;
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    if (!this.started) this.shown = Object.fromEntries(Object.keys(to).map((k) => [k, 0]));
    const from = { ...this.shown };
    // Nothing moves (an empty card, or the same values again): no frame loop
    if (reducedMotion() || Object.keys(to).every((k) => (from[k] ?? 0) === to[k])) {
      this.started = true;
      this.shown = to;
      return;
    }
    const duration = this.started ? 620 : 900;
    this.started = true;
    // The first frame's timestamp starts the clock – no clock read of our own
    let start = -1;
    const step = (now: number) => {
      if (start < 0) start = now;
      const t = Math.min(1, (now - start) / duration);
      const e = easeOutQuart(t);
      const next: Values = {};
      for (const k in to) next[k] = (from[k] ?? 0) + (to[k] - (from[k] ?? 0)) * e;
      this.shown = next;
      this.frame = t < 1 ? requestAnimationFrame(step) : 0;
    };
    this.frame = requestAnimationFrame(step);
  }

  private percent(v: Values, key: string) {
    return ((v[key] ?? 0) / Math.max(v["#total"] ?? 0, 0.0001)) * 100;
  }

  /** @internal Rows: ranked by the new values; parts that left the period fold away at the end */
  get rows() {
    const now = this.now();
    return this.known
      .map((k) => ({ ...k, value: now.get(k.key) ?? 0, leaving: !now.has(k.key) }))
      .filter((r) => !r.leaving || (this.shown[r.key] ?? 0) > 0.5)
      .sort((a, b) => Number(a.leaving) - Number(b.leaving) || b.value - a.value);
  }

  private choose(id: string) {
    if (id === this.activePeriod) return;
    if (this.emit<BreakdownPeriodChange>("tc-period-change", { period: id }, { cancelable: true })) this.period = id;
  }

  private onSwitchKey = (e: KeyboardEvent) => {
    const periods = this.periods;
    if (!periods?.length) return;
    const i = periods.findIndex((p) => p.id === this.activePeriod);
    const to = e.key === "ArrowRight" || e.key === "ArrowDown" ? i + 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? periods.length - 1 : null;
    if (to === null) return;
    e.preventDefault();
    this.choose(periods[(to + periods.length) % periods.length].id);
    void this.updateComplete.then(() => this.querySelector<HTMLElement>('.ui-cb__switch [aria-checked="true"]')?.focus());
  };

  private leave = () => {
    this.active = null;
  };

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    // Rows glide to their new rank (FLIP): remember where each one was, then animate from there
    const rowEls = [...this.querySelectorAll<HTMLLIElement>(".ui-cb__row")];
    const order = rowEls.map((el) => el.dataset.key).join("|");
    if (order !== this.order) {
      this.order = order;
      const next = new Map<string, number>();
      for (const el of rowEls) next.set(el.dataset.key!, el.offsetTop);
      if (!reducedMotion()) {
        for (const el of rowEls) {
          const before = this.tops.get(el.dataset.key!);
          const y = next.get(el.dataset.key!)!;
          if (before !== undefined && before !== y) el.animate([{ transform: `translateY(${before - y}px)` }, { transform: "none" }], { duration: 560, easing: EASE });
        }
      }
      this.tops = next;
    }
    // The period switch: a pill that slides under the chosen option
    const box = this.querySelector<HTMLElement>(".ui-cb__switch");
    if (box !== this.observed) {
      this.ro?.disconnect();
      this.observed = box ?? undefined;
      if (box && typeof ResizeObserver === "function") {
        this.ro = new ResizeObserver(() => this.placePill());
        this.ro.observe(box);
      }
    }
    const placedFor = `${this.activePeriod}|${this.periods?.length}`;
    if (placedFor !== this.placedFor) {
      this.placedFor = placedFor;
      this.placePill();
    }
  }

  private placePill() {
    const box = this.querySelector<HTMLElement>(".ui-cb__switch");
    const pill = box?.querySelector<HTMLElement>(".ui-cb__pill");
    const option = box?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (!box || !pill || !option) return;
    if (!this.placed) pill.style.transition = "none";
    pill.style.width = `${option.offsetWidth}px`;
    pill.style.height = `${option.offsetHeight}px`;
    pill.style.transform = `translate(${option.offsetLeft}px, ${option.offsetTop}px)`;
    pill.style.opacity = "1";
    if (!this.placed) {
      void pill.offsetWidth;
      pill.style.transition = "";
      this.placed = true;
    }
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const format = this.format;
    const shown = this.shown;
    const now = this.now();
    const total = [...now.values()].reduce((a, b) => a + b, 0);
    const activeValid = this.active !== null && now.has(this.active) ? this.active : null;
    const rows = this.rows;
    const top = rows.find((r) => !r.leaving);
    const activeRow = activeValid ? rows.find((r) => r.key === activeValid) : undefined;
    const share = (key: string) => this.percent(shown, key);
    const delta = this.delta;
    const up = (delta ?? 0) >= 0;
    const periods = this.periods;
    const activePeriod = this.activePeriod;
    const footer = this.footer;

    return html`
      <div class=${clean ? "ui-cb__body" : "ui-cb__card"}>
        <header class="ui-cb__head">
          <h3 id="${this.uid}-title" class="ui-cb__title">${this.heading}</h3>
          ${periods && periods.length > 1
            ? html`<div class="ui-cb__switch" role="radiogroup" aria-label="Period" @keydown=${this.onSwitchKey}>
                <span class="ui-cb__pill" aria-hidden="true"></span>
                ${repeat(
                  periods,
                  (p) => p.id,
                  (p) => html`<button
                    type="button"
                    role="radio"
                    aria-checked=${p.id === activePeriod ? "true" : "false"}
                    tabindex=${p.id === activePeriod ? 0 : -1}
                    class="ui-cb__option"
                    @click=${() => this.choose(p.id)}
                  >${p.label}</button>`,
                )}
              </div>`
            : nothing}
        </header>

        <div class="ui-cb__figure">
          <p class="ui-cb__big" aria-hidden="true">${format(shown["#figure"] ?? 0)}</p>
          ${delta !== undefined && !activeRow
            ? keyed(
                `${activePeriod}-${delta}`,
                html`<span class="ui-cb__delta" data-up=${ifDefined(up ? "" : undefined)}>
                  <svg viewBox="0 0 12 12" aria-hidden="true">${svg`<path d=${up ? "M6 9.5v-7M2.8 5.6 6 2.4l3.2 3.2" : "M6 2.5v7M2.8 6.4 6 9.6l3.2-3.2"}></path>`}</svg>${Math.abs(delta).toLocaleString("en-US", { maximumFractionDigits: 1 })}%
                </span>`,
              )
            : nothing}
        </div>
        <p class="ui-cb__caption" aria-hidden="true">
          ${keyed(
            activeRow?.key ?? "#total",
            html`<span class="ui-cb__caption-in">${activeRow
              ? html`<i class="ui-cb__swatch" style=${styleMap({ background: activeRow.color })}></i><span>${`${activeRow.label} · ${share(activeRow.key).toFixed(0)}%`}</span>`
              : this.totalLabel}</span>`,
          )}
        </p>
        <p class="ui-cb__sr">${this.totalLabel}: ${format(total)}${delta !== undefined ? `, ${up ? "up" : "down"} ${Math.abs(delta)}% against the previous period` : ""}</p>

        <div class="ui-cb__bar" data-active=${ifDefined(activeValid ? "" : undefined)} aria-hidden="true" @pointerleave=${this.leave}>
          ${repeat(
            this.known.filter((k) => share(k.key) > 0.05),
            (k) => k.key,
            (k) => html`<span
              class="ui-cb__seg"
              data-active=${ifDefined(k.key === activeValid ? "" : undefined)}
              style=${styleMap({ flexGrow: String(share(k.key)), background: k.color })}
              @pointerenter=${() => {
                if (now.has(k.key)) this.active = k.key;
              }}
            ></span>`,
          )}
        </div>

        <ul class="ui-cb__list" data-active=${ifDefined(activeValid ? "" : undefined)} @pointerleave=${this.leave}>
          ${repeat(
            rows,
            (r) => r.key,
            (r) => html`<li class="ui-cb__row" data-key=${r.key} data-leaving=${ifDefined(r.leaving ? "" : undefined)} .inert=${r.leaving}>
              <div
                class="ui-cb__item"
                data-active=${ifDefined(r.key === activeValid ? "" : undefined)}
                @pointerenter=${() => {
                  if (!r.leaving) this.active = r.key;
                }}
              >
                <i class="ui-cb__swatch" style=${styleMap({ background: r.color })}></i>
                <span class="ui-cb__label" title=${r.label}>${r.label}</span>
                <span class="ui-cb__value">${format(shown[r.key] ?? 0)}</span>
                <span class="ui-cb__share">${share(r.key).toFixed(0)}%</span>
              </div>
            </li>`,
          )}
        </ul>
      </div>

      ${footer !== null
        ? html`<div class="ui-cb__foot">${footer === undefined
            ? top
              ? keyed(top.key, html`<span class="ui-cb__foot-in">Largest: <b>${top.label}</b></span>`)
              : nothing
            : typeof footer === "string"
              ? footer
              : footer.cloneNode(true)}</div>`
        : nothing}
    `;
  }

  static override css = /* css */ `
/* Colors and motion as variables – override them on [data-ui="cb"] */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="cb"] {
  /* Series colours, largest part first */
  --tc-compact-breakdown-series-1: light-dark(#2f6bff, #5b8cff);
  --tc-compact-breakdown-series-2: light-dark(#74a0ff, #3d63c9);
  --tc-compact-breakdown-series-3: light-dark(#b4cbff, #2c4388);
  --tc-compact-breakdown-series-4: light-dark(#a8a8ae, #6b6b73);
  --tc-compact-breakdown-series-5: light-dark(#d4d4d8, #3d3d42);
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  width: 100%;
  max-width: 360px;
  /* The tray the card sits on */
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: var(--tc-font-size-md);
  line-height: 1.45;
  color: var(--tc-text-secondary);
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="cb"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cb"] {
  /* Parts: the accent blue, then lighter tints of it, then a gray */
  --tc-compact-breakdown-series-1: light-dark(rgba(0, 96, 226, 0.765), #4d8dff);
  --tc-compact-breakdown-series-2: light-dark(rgba(0, 96, 226, 0.5), rgba(77, 141, 255, 0.62));
  --tc-compact-breakdown-series-3: light-dark(rgba(0, 96, 226, 0.32), rgba(77, 141, 255, 0.4));
  --tc-compact-breakdown-series-4: light-dark(rgba(0, 96, 226, 0.18), rgba(77, 141, 255, 0.22));
  --tc-compact-breakdown-series-5: light-dark(rgba(0, 0, 0, 0.14), rgba(255, 255, 255, 0.16));
  /* One card: a hairline plus a soft lift */
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  width: 100%;
  max-width: 360px;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="cb"] *, [data-ui="cb"] *::before, [data-ui="cb"] *::after { box-sizing: border-box; }
:where([data-ui="cb"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where([data-ui="cb"]) :is(h3, p, ul) { margin: 0; padding: 0; }
:where([data-ui="cb"]) ul { list-style: none; }
[data-ui="cb"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-ui="cb"][data-look="clean"]) svg { display: block; flex: none; }
[data-ui="cb"] b { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-cb__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); padding: var(--tc-space-3) var(--tc-space-3-5) var(--tc-space-2); }
/* Head: title, the period switch on the right */
:where([data-look="standard"], [data-look="standard"] *).ui-cb__head { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2-5); min-height: 30px; }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__title { overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); white-space: nowrap; text-overflow: ellipsis; }
/* The period switch: the segmented-control recipe – a track with a raised thumb that slides to the chosen option */
:where([data-look="standard"], [data-look="standard"] *).ui-cb__switch { position: relative; display: grid; grid-auto-columns: auto; grid-auto-flow: column; flex: none; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__pill {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad));
  background: var(--tc-seg-thumb-bg);
  box-shadow: var(--tc-seg-thumb-shadow);
  opacity: 0;
  pointer-events: none;
  transition: transform var(--tc-duration-slower) var(--tc-ease-move), width var(--tc-duration-slower) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-cb__option { position: relative; z-index: 1; height: 24px; padding: 0 var(--tc-space-2); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); white-space: nowrap; transition: color var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__option:hover { color: var(--tc-text-primary); }
/* The chosen period: primary text in the strong weight, on the raised thumb */
:where([data-look="standard"], [data-look="standard"] *).ui-cb__option[aria-checked="true"] { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-strong); }
/* The big number and the change against the period before */
.ui-cb__figure { display: flex; align-items: center; gap: var(--tc-space-2); }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__figure { margin-top: var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__big { font-size: 26px; font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-display); letter-spacing: -0.02em; color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
/* A status pill (header size) */
.ui-cb__delta {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-0-5);
  height: var(--tc-pill-h-lg);
  padding: 0 var(--tc-space-1-5) 0 var(--tc-space-1);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-status-danger-bg);
  color: var(--tc-status-danger-fg);
  font-size: var(--tc-pill-font-size-lg);
  font-weight: var(--tc-pill-font-weight);
  line-height: var(--tc-line-height-tight);
  font-variant-numeric: tabular-nums;
  animation: ui-cb-pop var(--tc-duration-slower) var(--tc-ease-move) both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-cb__body { padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-2-5); }
/* Head: title, the period switch on the right */
:where([data-look="clean"], [data-look="clean"] *).ui-cb__head { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-3); min-height: 28px; }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__title { overflow: hidden; font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-loose); color: var(--tc-text-strong); white-space: nowrap; text-overflow: ellipsis; }
/* The "button switch": separate chips with a hairline; the light-gray fill slides to the chosen one */
:where([data-look="clean"], [data-look="clean"] *).ui-cb__switch { position: relative; display: grid; grid-auto-columns: auto; grid-auto-flow: column; gap: var(--tc-space-1); flex: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__pill {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-fill-default);
  opacity: 0;
  pointer-events: none;
  transition: transform var(--tc-duration-base) var(--tc-ease-move), width var(--tc-duration-base) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-cb__option {
  position: relative;
  z-index: 1;
  height: var(--tc-control-h-md);
  padding: var(--tc-space-1) var(--tc-space-2-5);
  border-radius: var(--tc-control-radius-sm);
  box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  white-space: nowrap;
  transition: color var(--tc-duration-instant) var(--tc-ease-standard), background-color var(--tc-duration-instant) var(--tc-ease-standard);
}
/* The chosen period: primary text, and its chip edge in the selected colour (≥ 3:1) so the choice isn't a fill alone */
:where([data-look="clean"], [data-look="clean"] *).ui-cb__option[aria-checked="true"] { color: var(--tc-text-primary); box-shadow: inset 0 0 0 1px var(--tc-border-selected); }
@media (hover: hover) {
:where([data-look="clean"], [data-look="clean"] *).ui-cb__option[aria-checked="false"]:hover { background: var(--tc-fill-subtle); }
}
/* The big number and the change against the period before */
:where([data-look="clean"], [data-look="clean"] *).ui-cb__figure { margin-top: var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__big { font-size: var(--tc-font-size-3xl); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-display); letter-spacing: -0.02em; color: var(--tc-text-strong); font-variant-numeric: tabular-nums; }
.ui-cb__delta[data-up] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-cb__delta svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__delta svg { stroke-width: 1.6; }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__delta svg { stroke-width: 1.3; }
/* The caption under the big number: a minimum height, so larger text grows it instead of being clipped */
.ui-cb__caption { overflow: hidden; color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__caption { min-height: 18px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-cb__caption-in { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__caption-in { animation: ui-cb-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
/* The stacked bar – parts keep their place and color, only the widths glide */
.ui-cb__bar { display: flex; gap: var(--tc-space-0-5); padding: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__bar { height: 8px; margin-top: var(--tc-space-3); border-radius: var(--tc-radius-xs); }
/* Shares as flex-grow, so the 2px gaps come out of the bar instead of making it wider than the card */
.ui-cb__seg { flex: 0 1 0; height: 100%; min-width: 2px; border-radius: var(--tc-radius-2xs); }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__seg { transition: opacity var(--tc-duration-base) var(--tc-ease-standard), transform var(--tc-duration-moderate) var(--tc-ease-move); }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__seg:first-child { border-radius: var(--tc-radius-xs) var(--tc-radius-2xs) var(--tc-radius-2xs) var(--tc-radius-xs); }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__seg:last-child { border-radius: var(--tc-radius-2xs) var(--tc-radius-xs) var(--tc-radius-xs) var(--tc-radius-2xs); }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__bar[data-active] .ui-cb__seg:not([data-active]) { opacity: 0.25; }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__caption { min-height: 16px; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__caption-in { animation: ui-cb-in-clean var(--tc-duration-moderate) var(--tc-ease-move) both; }
/* The stacked bar – parts keep their place and color, only the widths glide */
:where([data-look="clean"], [data-look="clean"] *).ui-cb__bar { height: 6px; margin-top: var(--tc-space-4); border-radius: var(--tc-radius-full); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__seg { transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-base) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__seg:first-child { border-radius: var(--tc-radius-full) var(--tc-radius-2xs) var(--tc-radius-2xs) var(--tc-radius-full); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__seg:last-child { border-radius: var(--tc-radius-2xs) var(--tc-radius-full) var(--tc-radius-full) var(--tc-radius-2xs); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__bar[data-active] .ui-cb__seg:not([data-active]) { opacity: 0.3; }
.ui-cb__seg[data-active] { transform: scaleY(1.5); }
/* The ranked list */
.ui-cb__list { position: relative; display: grid; }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__list { margin-top: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__list { margin-top: var(--tc-space-2-5); }
.ui-cb__row { display: grid; grid-template-rows: 1fr; transition: grid-template-rows var(--tc-duration-slow) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-cb__row[data-leaving] { grid-template-rows: 0fr; opacity: 0; pointer-events: none; }
/* Rows get their height from padding around a 20px line, so larger text grows them instead of being clipped
   (min-height 0 lets a leaving row fold away) */
.ui-cb__item { display: flex; align-items: center; min-height: 0; margin: 0 -8px; padding: var(--tc-space-1) var(--tc-space-2); overflow: hidden; line-height: var(--tc-line-height-normal); cursor: default; }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__item { gap: var(--tc-space-2); border-radius: var(--tc-radius-md); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__item[data-active] { background: var(--tc-fill-hover); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__item {
  gap: var(--tc-space-2-5);
  padding: var(--tc-space-1-5) var(--tc-space-2);
  border-radius: var(--tc-radius-sm);
  /* The hover wash is short and crisp – no long glide between rows */
  transition: background-color var(--tc-duration-instant) var(--tc-ease-decelerate), opacity var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-cb__item[data-active] { background: var(--tc-fill-subtle); }
.ui-cb__list[data-active] .ui-cb__item:not([data-active]) { opacity: 0.45; }
.ui-cb__swatch { flex: none; width: 8px; height: 8px; border-radius: var(--tc-radius-2xs); }
.ui-cb__label { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__label { color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__label { color: var(--tc-text-primary); }
.ui-cb__value { color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; }
.ui-cb__share { width: 34px; text-align: right; color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
/* The line on the gray tray */
:where([data-look="standard"], [data-look="standard"] *).ui-cb__foot { display: flex; align-items: center; min-height: 34px; padding: var(--tc-space-1) var(--tc-space-2-5) 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; }
.ui-cb__foot-in { overflow: hidden; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__foot-in { animation: ui-cb-in var(--tc-duration-slow) var(--tc-ease-move) both; }
@keyframes ui-cb-in {
  from { opacity: 0; transform: translateY(5px); filter: blur(2px); }
  to { opacity: 1; transform: none; filter: none; }
}
:where([data-look="clean"], [data-look="clean"] *).ui-cb__share { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
/* The last row inside the card */
:where([data-look="clean"], [data-look="clean"] *).ui-cb__foot {
  display: flex;
  align-items: center;
  min-height: 40px;
  padding: 0 var(--tc-space-4);
  overflow: hidden;
  border-top: var(--tc-hairline) solid var(--tc-divider);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-text-muted);
  white-space: nowrap;
}
:where([data-look="clean"], [data-look="clean"] *).ui-cb__foot-in { animation: ui-cb-in-clean var(--tc-duration-slow) var(--tc-ease-move) both; }
@keyframes ui-cb-in-clean {
  from { opacity: 0; transform: translateY(4px); filter: blur(2px); }
  to { opacity: 1; transform: none; filter: none; }
}
@keyframes ui-cb-pop {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: none; }
}
/* Narrow cards: the share column goes, the values stay */
@container (max-width: 250px) {
.ui-cb__share { display: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__option { padding: 0 var(--tc-space-1-5); }
}
@media (hover: none) and (pointer: coarse) {
:where([data-look="standard"], [data-look="standard"] *).ui-cb__option { height: 32px; padding: 0 var(--tc-space-2-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-cb__item { padding-block: var(--tc-space-2); }
}
/* Narrow cards: tighter chips, then the share column goes and the values stay */
@container (max-width: 320px) {
:where([data-look="clean"], [data-look="clean"] *).ui-cb__body { padding: var(--tc-space-3-5) var(--tc-space-3-5) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__foot { padding: 0 var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__switch { gap: var(--tc-space-0-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__option { padding: var(--tc-space-1) var(--tc-space-2); }
}
@container (max-width: 250px) {
:where([data-look="clean"], [data-look="clean"] *).ui-cb__option { padding: var(--tc-space-1) var(--tc-space-1-5); }
}
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-cb__option { height: 32px; padding: var(--tc-space-1-5) var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__item { padding-block: var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-cb__foot { min-height: 44px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="cb"] *, [data-ui="cb"] *::before, [data-ui="cb"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-compact-breakdown")) customElements.define("tc-compact-breakdown", TcCompactBreakdown);

declare global {
  interface HTMLElementTagNameMap {
    "tc-compact-breakdown": TcCompactBreakdown;
  }
}
