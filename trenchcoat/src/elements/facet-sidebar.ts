import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-facet-sidebar> – the filters beside search results, each with how many results it would leave. Facets are
 * sections that fold: checkboxes (any of), radios (one of), a range with two thumbs and number fields, or a from–to
 * date. The filters in use sit on top as chips, each removable, with Clear all.
 *   · an option no result has (count 0) is dimmed but still pickable, and a picked one never dims
 *   · a facet shows `show-count` options (5) and "Show 7 more"; one with more than 8 has its own search box
 *   · every change fires a cancelable tc-value-change ({ value, facet }) with the whole value as it will be – prevent
 *     it and update `value` yourself to keep the filters in the URL or a store
 *   · the range's thumbs are sliders: arrow keys step, Shift for ten steps, Home / End to the ends, or drag
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-facet-sidebar .facets=${[{ id: "kind", label: "Kind", type: "checkbox", options: [{ value: "doc", label: "Documents", count: 12 }] }]}></tc-facet-sidebar>
 */

export type FacetOption = { value: string; label: string; count?: number };
export type Facet = {
  id: string;
  label: string;
  type: "checkbox" | "radio" | "range" | "date";
  /** The choices, for checkbox and radio */
  options?: FacetOption[];
  /** The range's ends */
  min?: number;
  max?: number;
  /** The range's step (1) */
  step?: number;
  /** What the range counts, after its numbers: "px", "pages", "%" */
  unit?: string;
};
/** A facet's value: the picked options, a [low, high] range, or a from–to date (yyyy-mm-dd) */
export type FacetValue = string[] | [number, number] | { from?: string; to?: string };
export type FacetValues = Record<string, FacetValue>;

/** Details of the events */
export type FacetValueChange = { value: FacetValues; facet: string };
export type FacetCollapsedChange = { collapsed: string[] };

let uidCount = 0;
const SEARCH_OVER = 8;

/* sliders-horizontal, chevron-down, x, search, check: Lucide (ISC, lucide.dev) */
const filterGlyph = svg`<line x1="21" x2="14" y1="4" y2="4"></line><line x1="10" x2="3" y1="4" y2="4"></line><line x1="21" x2="12" y1="12" y2="12"></line><line x1="8" x2="3" y1="12" y2="12"></line><line x1="21" x2="16" y1="20" y2="20"></line><line x1="12" x2="3" y1="20" y2="20"></line><line x1="14" x2="14" y1="2" y2="6"></line><line x1="8" x2="8" y1="10" y2="14"></line><line x1="16" x2="16" y1="18" y2="22"></line>`;
const lucide = (size: number, body: ReturnType<typeof svg>, cls = "") =>
  html`<svg class=${cls || nothing} width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const chevron = () => lucide(14, svg`<path d="m6 9 6 6 6-6"></path>`, "ui-fct__chevron");
const xIcon = () => lucide(12, svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);
const searchIcon = () => lucide(14, svg`<circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path>`);
const tick = () => html`<svg class="ui-fct__tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>`;

/** Whether a facet's value narrows anything */
export function facetActive(f: Facet, v: FacetValue | undefined): boolean {
  if (v === undefined) return false;
  if (f.type === "range") {
    const [lo, hi] = v as [number, number];
    return lo > (f.min ?? 0) || hi < (f.max ?? 100);
  }
  if (f.type === "date") {
    const d = v as { from?: string; to?: string };
    return !!(d.from || d.to);
  }
  return (v as string[]).length > 0;
}

/**
 * Search filters with counts – checkbox, radio, range and date facets that fold, the filters in use as removable
 * chips with Clear all, Show more, and a search box in long facets.
 * @tag tc-facet-sidebar
 * @fires tc-value-change - A filter changed ({ value, facet }: FacetValueChange); cancelable – prevented, `value` stays as it was
 * @fires tc-collapsed-change - A facet was folded or opened ({ collapsed }: FacetCollapsedChange); cancelable – prevented, `collapsed` stays as it was
 */
export class TcFacetSidebar extends TcElement {
  static override ui = "fct";

  /** The heading, and the filters' name */
  @property() accessor heading = "Filters";
  /** The facets, in order */
  @property({ attribute: false }) accessor facets: Facet[] = [];
  /** The filters in use, by facet id. Changed by the user unless tc-value-change is prevented */
  @property({ attribute: false }) accessor value: FacetValues = {};
  /** The ids of folded facets. Changed by the user unless tc-collapsed-change is prevented */
  @property({ attribute: false }) accessor collapsed: string[] = [];
  /** How many options a facet shows before "Show n more" */
  @property({ type: Number, attribute: "show-count" }) accessor showCount = 5;
  /** The language for numbers and dates, e.g. "en-GB"; by default the browser's */
  @property() accessor locale: string | undefined = undefined;

  @state() private accessor expanded = new Set<string>();
  @state() private accessor searches: Record<string, string> = {};
  @state() private accessor announce = "";

  private uid = `tc-fct-${++uidCount}`;
  private drag: { facet: Facet; end: 0 | 1 } | null = null;
  /** Where focus goes once a removed chip (its index) or Clear all ("all") has gone – here, or when a page that controls `value` applies it */
  private refocus: number | "all" | null = null;

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("facets")) {
      const ids = new Set(this.facets.map((f) => f.id));
      this.expanded = new Set([...this.expanded].filter((id) => ids.has(id)));
    }
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("value") && this.refocus !== null) {
      const at = this.refocus;
      this.refocus = null;
      // The chip that took its place, or the first facet
      const xs = this.querySelectorAll<HTMLElement>(".ui-fct__chip-x");
      const to = at === "all" ? null : xs[Math.min(at, xs.length - 1)];
      (to ?? this.querySelector<HTMLElement>(".ui-fct__toggle"))?.focus();
    }
  }

  /* ---------- The model ---------- */

  private facetValue(f: Facet): FacetValue {
    const v = this.value[f.id];
    if (f.type === "range") return (v as [number, number] | undefined) ?? [f.min ?? 0, f.max ?? 100];
    if (f.type === "date") return (v as { from?: string; to?: string } | undefined) ?? {};
    return (v as string[] | undefined) ?? [];
  }

  private fmt(n: number, f: Facet) {
    const s = new Intl.NumberFormat(this.locale).format(n);
    return f.unit ? (f.unit === "%" ? `${s}%` : `${s} ${f.unit}`) : s;
  }

  /** The filters in use, as chips: a picked option each, one for a range, one for a date */
  private get chips(): { facet: Facet; label: string; option?: string }[] {
    const out: { facet: Facet; label: string; option?: string }[] = [];
    for (const f of this.facets) {
      const v = this.value[f.id];
      if (!facetActive(f, v)) continue;
      if (f.type === "range") {
        const [lo, hi] = v as [number, number];
        const n = (x: number) => new Intl.NumberFormat(this.locale).format(x);
        out.push({ facet: f, label: `${f.label}: ${f.unit ? this.fmt(hi, f).replace(n(hi), `${n(lo)}–${n(hi)}`) : `${n(lo)}–${n(hi)}`}` });
      } else if (f.type === "date") {
        const d = v as { from?: string; to?: string };
        out.push({ facet: f, label: `${f.label}: ${d.from && d.to ? `${d.from} – ${d.to}` : d.from ? `from ${d.from}` : `to ${d.to}`}` });
      } else {
        for (const val of v as string[]) out.push({ facet: f, label: f.options?.find((o) => o.value === val)?.label ?? val, option: val });
      }
    }
    return out;
  }

  /* ---------- Actions ---------- */

  private set(f: Facet, next: FacetValue | undefined, said: string) {
    const value = { ...this.value };
    if (next === undefined || !facetActive(f, next)) delete value[f.id];
    else value[f.id] = next;
    if (!this.emit<FacetValueChange>("tc-value-change", { value, facet: f.id }, { cancelable: true })) {
      this.requestUpdate();
      return false;
    }
    this.value = value;
    this.announce = said;
    return true;
  }

  private toggleOption(f: Facet, o: FacetOption) {
    const cur = this.facetValue(f) as string[];
    const on = cur.includes(o.value);
    if (f.type === "radio") this.set(f, on ? [] : [o.value], on ? `${f.label}: any` : `${f.label}: ${o.label}`);
    else this.set(f, on ? cur.filter((x) => x !== o.value) : [...cur, o.value], `${o.label} ${on ? "off" : "on"}`);
  }

  private removeChip(c: { facet: Facet; option?: string; label: string }, at: number) {
    const f = c.facet;
    const next = c.option !== undefined ? (this.facetValue(f) as string[]).filter((x) => x !== c.option) : undefined;
    // Focus goes to the chip that took its place, or the first facet, once the chip has gone (updated)
    this.refocus = at;
    this.set(f, next, `Removed ${c.label}`);
  }

  private clearAll() {
    if (!Object.keys(this.value).length) return;
    this.refocus = "all";
    if (!this.emit<FacetValueChange>("tc-value-change", { value: {}, facet: "" }, { cancelable: true })) return;
    this.value = {};
    this.announce = "All filters cleared";
  }

  private fold(f: Facet) {
    const open = !this.collapsed.includes(f.id);
    const collapsed = open ? [...this.collapsed, f.id] : this.collapsed.filter((x) => x !== f.id);
    if (!this.emit<FacetCollapsedChange>("tc-collapsed-change", { collapsed }, { cancelable: true })) return;
    this.collapsed = collapsed;
  }

  /* ---------- The range ---------- */

  private setRange(f: Facet, end: 0 | 1, raw: number) {
    const min = f.min ?? 0;
    const max = f.max ?? 100;
    const step = f.step ?? 1;
    const [lo, hi] = this.facetValue(f) as [number, number];
    let n = Math.round((Math.min(max, Math.max(min, raw)) - min) / step) * step + min;
    n = Number(n.toFixed(6));
    const next: [number, number] = end === 0 ? [Math.min(n, hi), hi] : [lo, Math.max(n, lo)];
    // Nothing changes (clamped or rounded back to where it was): the number field shows the value again
    if (next[0] === lo && next[1] === hi) {
      this.requestUpdate();
      return;
    }
    this.set(f, next, `${f.label} ${this.fmt(next[0], f)} to ${this.fmt(next[1], f)}`);
  }

  private onThumbKey(e: KeyboardEvent, f: Facet, end: 0 | 1) {
    const [lo, hi] = this.facetValue(f) as [number, number];
    const cur = end === 0 ? lo : hi;
    const step = (f.step ?? 1) * (e.shiftKey ? 10 : 1);
    const big = ((f.max ?? 100) - (f.min ?? 0)) / 10;
    const to =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? cur + step
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? cur - step
          : e.key === "PageUp"
            ? cur + big
            : e.key === "PageDown"
              ? cur - big
              : e.key === "Home"
                ? end === 0
                  ? (f.min ?? 0)
                  : lo
                : e.key === "End"
                  ? end === 1
                    ? (f.max ?? 100)
                    : hi
                  : null;
    if (to === null) return;
    e.preventDefault();
    this.setRange(f, end, to);
  }

  private onTrackPointer(e: PointerEvent, f: Facet) {
    const track = (e.currentTarget as HTMLElement).closest(".ui-fct__range")!.querySelector<HTMLElement>(".ui-fct__track")!;
    const at = (x: number) => {
      const r = track.getBoundingClientRect();
      const t = Math.min(1, Math.max(0, (x - r.left) / Math.max(1, r.width)));
      return (f.min ?? 0) + t * ((f.max ?? 100) - (f.min ?? 0));
    };
    const [lo, hi] = this.facetValue(f) as [number, number];
    const v = at(e.clientX);
    const end: 0 | 1 = Math.abs(v - lo) <= Math.abs(v - hi) ? 0 : 1;
    this.drag = { facet: f, end };
    const thumb = this.querySelectorAll<HTMLElement>(`[data-facet="${CSS.escape(f.id)}"] .ui-fct__thumb`)[end];
    thumb?.focus();
    this.setRange(f, end, v);
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture?.(e.pointerId);
    const move = (ev: PointerEvent) => this.drag && this.setRange(this.drag.facet, this.drag.end, at(ev.clientX));
    const up = () => {
      this.drag = null;
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", up);
      target.removeEventListener("pointercancel", up);
    };
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", up);
    target.addEventListener("pointercancel", up);
    e.preventDefault();
  }

  /* ---------- Rendering ---------- */

  private renderChoices(f: Facet): TemplateResult {
    const picked = this.facetValue(f) as string[];
    const all = f.options ?? [];
    const q = (this.searches[f.id] ?? "").trim().toLowerCase();
    const matching = q ? all.filter((o) => o.label.toLowerCase().includes(q)) : all;
    const open = this.expanded.has(f.id) || !!q;
    // Picked options always show, even past the cut
    const shown = open ? matching : matching.filter((o, i) => i < this.showCount || picked.includes(o.value));
    const hiddenCount = matching.length - shown.length;
    const name = `${this.uid}-${f.id}`;
    const fmtCount = (n: number) => new Intl.NumberFormat(this.locale).format(n);
    return html`
      ${all.length > SEARCH_OVER
        ? html`<label class="ui-fct__search">
            <span class="ui-fct__search-icon" aria-hidden="true">${searchIcon()}</span>
            <span class="tc-sr-only">Search ${f.label}</span>
            <input
              type="search"
              class="ui-fct__search-input"
              placeholder=${`Search ${f.label.toLowerCase()}`}
              .value=${live(this.searches[f.id] ?? "")}
              @input=${(e: Event) => (this.searches = { ...this.searches, [f.id]: (e.target as HTMLInputElement).value })}
            />
          </label>`
        : nothing}
      ${shown.length
        ? html`<div class="ui-fct__options" role=${f.type === "radio" ? "radiogroup" : "group"} aria-label=${f.label}>
            ${shown.map((o) => {
              const on = picked.includes(o.value);
              return html`<div class="ui-fct__option" ?data-empty=${o.count === 0 && !on}>
                <label class="ui-fct__option-label">
                  <span class="ui-fct__box" data-type=${f.type}>
                    <input type=${f.type === "radio" ? "radio" : "checkbox"} name=${name} .checked=${live(on)} @change=${() => this.toggleOption(f, o)} @click=${(e: Event) => {
                      // A radio that's already on turns off when clicked again – "any"
                      if (f.type === "radio" && on) {
                        e.preventDefault();
                        this.toggleOption(f, o);
                      }
                    }} />
                    ${f.type === "radio" ? html`<span class="ui-fct__dot" aria-hidden="true"></span>` : tick()}
                  </span>
                  <span class="ui-fct__option-text">${o.label}</span>
                  ${o.count !== undefined ? html`<span class="ui-fct__option-count">${fmtCount(o.count)}</span>` : nothing}
                </label>
              </div>`;
            })}
          </div>`
        : html`<p class="ui-fct__none">No ${f.label.toLowerCase()} match “${q}”.</p>`}
      ${!q && (hiddenCount > 0 || (this.expanded.has(f.id) && matching.length > this.showCount))
        ? html`<button
            type="button"
            class="ui-fct__more"
            aria-expanded=${this.expanded.has(f.id) ? "true" : "false"}
            @click=${() => {
              const next = new Set(this.expanded);
              if (next.has(f.id)) next.delete(f.id);
              else next.add(f.id);
              this.expanded = next;
            }}
          >${this.expanded.has(f.id) ? "Show less" : `Show ${hiddenCount} more`}</button>`
        : nothing}
    `;
  }

  private renderRange(f: Facet) {
    const min = f.min ?? 0;
    const max = f.max ?? 100;
    const [lo, hi] = this.facetValue(f) as [number, number];
    const pct = (n: number) => ((n - min) / Math.max(1e-9, max - min)) * 100;
    const field = (end: 0 | 1) =>
      html`<label class="ui-fct__num">
        <span class="ui-fct__num-label">${end === 0 ? "From" : "To"}</span>
        <input
          type="number"
          inputmode="decimal"
          min=${min}
          max=${max}
          step=${f.step ?? 1}
          .value=${live(String(end === 0 ? lo : hi))}
          @change=${(e: Event) => {
            // Emptied – or not a number, which a number field also reports as "" – goes back to its end of the range
            const raw = (e.target as HTMLInputElement).value.trim();
            const n = raw === "" ? (end === 0 ? min : max) : Number(raw);
            if (Number.isFinite(n)) this.setRange(f, end, n);
            else this.requestUpdate();
          }}
        />
        ${f.unit ? html`<span class="ui-fct__unit" aria-hidden="true">${f.unit}</span>` : nothing}
      </label>`;
    const thumb = (end: 0 | 1) => {
      const v = end === 0 ? lo : hi;
      return html`<span
        class="ui-fct__thumb"
        role="slider"
        tabindex="0"
        aria-label=${`${f.label}, ${end === 0 ? "lowest" : "highest"}`}
        aria-valuemin=${end === 0 ? min : lo}
        aria-valuemax=${end === 0 ? hi : max}
        aria-valuenow=${v}
        aria-valuetext=${this.fmt(v, f)}
        style=${`left:${pct(v)}%`}
        @keydown=${(e: KeyboardEvent) => this.onThumbKey(e, f, end)}
      ></span>`;
    };
    return html`<div class="ui-fct__range">
      <div class="ui-fct__slider" @pointerdown=${(e: PointerEvent) => this.onTrackPointer(e, f)}>
        <span class="ui-fct__track" aria-hidden="true"><span class="ui-fct__fill" style=${`left:${pct(lo)}%;right:${100 - pct(hi)}%`}></span></span>
        ${thumb(0)}${thumb(1)}
      </div>
      <div class="ui-fct__nums">${field(0)}${field(1)}</div>
    </div>`;
  }

  private renderDate(f: Facet) {
    const d = this.facetValue(f) as { from?: string; to?: string };
    const field = (key: "from" | "to") =>
      html`<label class="ui-fct__num">
        <span class="ui-fct__num-label">${key === "from" ? "From" : "To"}</span>
        <input
          type="date"
          .value=${live(d[key] ?? "")}
          min=${ifDefined(key === "to" && d.from ? d.from : undefined)}
          max=${ifDefined(key === "from" && d.to ? d.to : undefined)}
          @change=${(e: Event) => {
            const v = (e.target as HTMLInputElement).value || undefined;
            let next = { ...d, [key]: v };
            // Typed past the other end (the picker's min / max don't stop typing): the two swap
            if (next.from && next.to && next.from > next.to) next = { from: next.to, to: next.from };
            this.set(f, next, v ? `${f.label} ${next.from ?? ""} – ${next.to ?? ""}`.trim() : `${f.label} ${key} cleared`);
          }}
        />
      </label>`;
    return html`<div class="ui-fct__nums">${field("from")}${field("to")}</div>`;
  }

  private renderFacet(f: Facet) {
    const open = !this.collapsed.includes(f.id);
    const active = facetActive(f, this.value[f.id]);
    const n = f.type === "checkbox" || f.type === "radio" ? (this.facetValue(f) as string[]).length : active ? 1 : 0;
    const bodyId = `${this.uid}-b-${f.id}`;
    return html`<section class="ui-fct__facet" data-facet=${f.id} ?data-open=${open}>
      <h4 class="ui-fct__facet-head">
        <button type="button" class="ui-fct__toggle" aria-expanded=${open ? "true" : "false"} aria-controls=${bodyId} @click=${() => this.fold(f)}>
          <span class="ui-fct__facet-name">${f.label}</span>
          ${n ? html`<span class="ui-fct__badge">${n}<span class="tc-sr-only"> in use</span></span>` : nothing}
          ${chevron()}
        </button>
      </h4>
      ${open
        ? html`<div class="ui-fct__body" id=${bodyId}>
            ${f.type === "range" ? this.renderRange(f) : f.type === "date" ? this.renderDate(f) : this.renderChoices(f)}
          </div>`
        : nothing}
    </section>`;
  }

  protected override render() {
    const id = this.uid;
    const chips = this.chips;
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${cardHead({
        icon: filterGlyph,
        title: this.heading,
        id: `${id}-title`,
        aside: chips.length ? html`<button type="button" class="ui-fct__clear" @click=${() => this.clearAll()}>Clear all</button>` : nothing,
      })}
      <div class="ui-fct__card" role="group" aria-labelledby=${`${id}-title`}>
        ${chips.length
          ? html`<ul class="ui-fct__chips" aria-label="Filters in use">
              ${chips.map(
                (c, i) => html`<li class="ui-fct__chip">
                  <span>${c.label}</span>
                  <button type="button" class="ui-fct__chip-x" @click=${() => this.removeChip(c, i)}>${xIcon()}<span class="tc-sr-only">Remove ${c.label}</span></button>
                </li>`,
              )}
            </ul>`
          : nothing}
        ${this.facets.map((f) => this.renderFacet(f))}
        ${this.facets.length ? nothing : html`<p class="ui-fct__none">No filters for these results.</p>`}
      </div>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="clean"], [data-look="standard"] *, [data-look="clean"] *)[data-ui="fct"] {
  --tc-fct-thumb: var(--tc-space-4);
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 100%;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Standard: a gray tray holding a white card. Clean: one white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="fct"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *).ui-fct__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="fct"] { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-fct__card { border-top: var(--tc-hairline) solid var(--tc-divider); }
[data-ui="fct"] *, [data-ui="fct"] *::before, [data-ui="fct"] *::after { box-sizing: border-box; }
:where([data-ui="fct"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="fct"] :is(button, [tabindex]):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-ui="fct"]) :is(h4, p, ul) { margin: 0; padding: 0; }
[data-ui="fct"] ul { list-style: none; }
[data-ui="fct"] svg { display: block; flex: none; }
.ui-fct__clear { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-accent-text); }
.ui-fct__clear:hover { text-decoration: underline; text-underline-offset: var(--tc-space-0-5); }
/* ----- Chips ----- */
.ui-fct__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-1); }
.ui-fct__chip { display: inline-flex; align-items: center; gap: var(--tc-space-0-5); min-height: var(--tc-pill-h-lg); padding: 0 var(--tc-space-0-5) 0 var(--tc-space-2-5); border-radius: var(--tc-radius-full); background: var(--tc-fill-selected); font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); animation: ui-fct-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-fct__chip-x { display: grid; place-items: center; width: var(--tc-space-5); height: var(--tc-space-5); border-radius: var(--tc-radius-full); color: var(--tc-icon-muted); }
.ui-fct__chip-x:hover { background: var(--tc-fill-strong); color: var(--tc-text-primary); }
/* ----- Facets ----- */
.ui-fct__facet { padding: 0 var(--tc-space-2); }
.ui-fct__facet + .ui-fct__facet { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-fct__toggle { display: flex; align-items: center; gap: var(--tc-space-2); width: 100%; min-height: var(--tc-control-h-md); padding: var(--tc-space-1) var(--tc-space-1-5); border-radius: var(--tc-menu-item-radius); text-align: left; }
.ui-fct__toggle:hover { background: var(--tc-menu-item-hover); }
.ui-fct__facet-name { flex: 1; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-strong); color: var(--tc-text-primary); }
.ui-fct__badge { display: inline-grid; place-items: center; min-width: var(--tc-space-5); height: var(--tc-pill-h); padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-full); background: var(--tc-accent); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-on-accent); font-variant-numeric: tabular-nums; }
.ui-fct__chevron { color: var(--tc-icon-muted); transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-fct__facet:not([data-open]) .ui-fct__chevron { transform: rotate(-90deg); }
.ui-fct__body { display: grid; gap: var(--tc-space-1); padding: 0 var(--tc-space-1-5) var(--tc-space-3); }
/* Search within a long facet */
.ui-fct__search { position: relative; display: block; margin-bottom: var(--tc-space-1); }
.ui-fct__search-icon { position: absolute; top: 50%; left: var(--tc-space-2-5); color: var(--tc-icon-muted); transform: translateY(-50%); pointer-events: none; }
.ui-fct__search-input { width: 100%; height: var(--tc-control-h-sm); padding: 0 var(--tc-field-px) 0 calc(var(--tc-space-2-5) + var(--tc-space-5)); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-fill-subtle); font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); outline: none; }
.ui-fct__search-input::placeholder { color: var(--tc-text-placeholder); }
.ui-fct__search-input::-webkit-search-cancel-button { display: none; }
.ui-fct__search-input:focus-visible { background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow-focus); }
/* Options */
.ui-fct__options { display: grid; }
.ui-fct__option-label { display: flex; align-items: center; gap: var(--tc-space-2-5); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1); border-radius: var(--tc-menu-item-radius); font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); cursor: pointer; }
.ui-fct__option-label:hover { background: var(--tc-menu-item-hover); }
.ui-fct__option-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-fct__option-count { flex: none; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
/* An option no result has: dimmed with colour, still pickable */
.ui-fct__option[data-empty] .ui-fct__option-text { color: var(--tc-text-muted); }
.ui-fct__box { display: grid; flex: none; }
.ui-fct__box > * { grid-area: 1 / 1; }
.ui-fct__box input { width: var(--tc-space-4); height: var(--tc-space-4); margin: 0; border-radius: var(--tc-radius-xs); background: var(--tc-surface-control); box-shadow: inset 0 0 0 1px var(--tc-border-control); appearance: none; cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-fct__box[data-type="radio"] input { border-radius: var(--tc-radius-full); }
.ui-fct__box input:hover { box-shadow: inset 0 0 0 1px var(--tc-border-control-hover); }
.ui-fct__box input:checked { background: var(--tc-surface-inverse); box-shadow: inset 0 0 0 1px var(--tc-surface-inverse); }
:where([data-look="clean"], [data-look="clean"] *).ui-fct__box input:checked { background: var(--tc-accent); box-shadow: inset 0 0 0 1px var(--tc-accent); }
.ui-fct__box input:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-fct__tick { place-self: center; width: var(--tc-space-3); height: var(--tc-space-3); fill: none; stroke: var(--tc-text-on-inverse); stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 24; stroke-dashoffset: 24; pointer-events: none; transition: stroke-dashoffset var(--tc-duration-moderate) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-fct__tick { stroke: var(--tc-text-on-accent); }
.ui-fct__box input:checked + .ui-fct__tick { stroke-dashoffset: 0; }
.ui-fct__dot { place-self: center; width: var(--tc-space-1-5); height: var(--tc-space-1-5); border-radius: var(--tc-radius-full); background: var(--tc-text-on-inverse); transform: scale(0); pointer-events: none; transition: transform var(--tc-duration-fast) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-fct__dot { background: var(--tc-text-on-accent); }
.ui-fct__box input:checked + .ui-fct__dot { transform: scale(1); }
.ui-fct__more { justify-self: start; margin-top: var(--tc-space-0-5); padding: var(--tc-space-0-5) var(--tc-space-1); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-accent-text); }
.ui-fct__more:hover { text-decoration: underline; text-underline-offset: var(--tc-space-0-5); }
.ui-fct__none { padding: var(--tc-space-2) var(--tc-space-1); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
/* ----- Range and date ----- */
.ui-fct__range { display: grid; gap: var(--tc-space-3); padding-top: var(--tc-space-2); }
.ui-fct__slider { position: relative; height: var(--tc-fct-thumb); margin: 0 calc(var(--tc-fct-thumb) / 2); touch-action: none; cursor: pointer; }
.ui-fct__track { position: absolute; top: 50%; left: 0; right: 0; height: var(--tc-meter-h); border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); transform: translateY(-50%); }
.ui-fct__fill { position: absolute; top: 0; bottom: 0; border-radius: inherit; background: var(--tc-accent); }
.ui-fct__thumb { position: absolute; top: 50%; width: var(--tc-fct-thumb); height: var(--tc-fct-thumb); border-radius: var(--tc-radius-full); background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control), 0 0 0 1px var(--tc-border-control); transform: translate(-50%, -50%); cursor: grab; touch-action: none; }
.ui-fct__thumb:active { cursor: grabbing; }
.ui-fct__nums { display: grid; grid-template-columns: 1fr 1fr; gap: var(--tc-space-2); }
.ui-fct__num { position: relative; display: grid; gap: var(--tc-space-0-5); min-width: 0; }
.ui-fct__num-label { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-fct__num input { width: 100%; min-width: 0; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; outline: none; }
.ui-fct__num input:focus-visible { box-shadow: var(--tc-field-shadow-focus); }
.ui-fct__num input::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
.ui-fct__unit { position: absolute; right: var(--tc-space-6); bottom: calc((var(--tc-control-h-sm) - var(--tc-line-height-normal) * var(--tc-font-size-xs)) / 2); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); pointer-events: none; }
@keyframes ui-fct-in { from { opacity: 0; transform: scale(0.96); } }
@media (forced-colors: active) {
  .ui-fct__box input { border: 1px solid ButtonText; }
  .ui-fct__box input:checked { background: Highlight; }
  .ui-fct__tick { stroke: HighlightText; }
  .ui-fct__fill { background: Highlight; }
  .ui-fct__thumb { border: 1px solid ButtonText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="fct"] *, [data-ui="fct"] *::before, [data-ui="fct"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-facet-sidebar")) customElements.define("tc-facet-sidebar", TcFacetSidebar);

declare global {
  interface HTMLElementTagNameMap {
    "tc-facet-sidebar": TcFacetSidebar;
  }
}
