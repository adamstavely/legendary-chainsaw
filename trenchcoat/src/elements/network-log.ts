import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import "./json-viewer";
import type { JsonValue } from "./json-viewer";

/*
 * <tc-network-log> – the requests a web page made: one row each with its status, method, name, type, size and time,
 * and a waterfall bar placed by when it started and how long it took. Type chips narrow the list. Choosing a request
 * opens its details under the list: Headers (the URL, status and both header sets) and Response (an object body in a
 * JSON Viewer, text in a block). A footer counts the requests, their size and when the last one finished. Nothing here
 * watches a real network: the page passes `requests`.
 *   · the list is one tab stop, a grid of rows: ↑ / ↓ / Home / End move, Enter or Space opens a request, Esc closes it
 *   · narrow, the type, size and waterfall columns are left out
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-network-log .requests=${[{ id: "1", method: "GET", url: "/api/grants", status: 200, type: "fetch", start: 120, duration: 84 }]}>
 *   </tc-network-log>
 */

export type NetworkType = "document" | "script" | "style" | "fetch" | "image" | "font" | "other";
export type NetworkRequest = {
  /** Stable identity */
  id: string;
  /** GET, POST… */
  method: string;
  url: string;
  /** The HTTP status; 0 when it failed or hasn't answered */
  status: number;
  type: NetworkType;
  /** Bytes transferred */
  size?: number;
  /** When it started, in ms from the page's start */
  start: number;
  /** How long it took, in ms */
  duration: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  /** The response: an object is shown in a JSON Viewer, a string as text */
  body?: string | JsonValue;
};
export type NetworkTypesChange = { types: NetworkType[] };
export type NetworkSelectedChange = { selected: string | null; request?: NetworkRequest };
export type NetworkLogLabels = Record<NetworkType, string> &
  Record<
    | "all"
    | "types"
    | "status"
    | "method"
    | "name"
    | "type"
    | "size"
    | "time"
    | "waterfall"
    | "failed"
    | "headers"
    | "response"
    | "general"
    | "url"
    | "requestHeaders"
    | "responseHeaders"
    | "noHeaders"
    | "noBody"
    | "close"
    | "empty"
    | "noMatches"
    | "request"
    | "requests"
    | "finished",
    string
  >;
export const defaultNetworkLogLabels: NetworkLogLabels = {
  document: "Doc",
  script: "JS",
  style: "CSS",
  fetch: "Fetch",
  image: "Img",
  font: "Font",
  other: "Other",
  all: "All",
  types: "Request types",
  status: "Status",
  method: "Method",
  name: "Name",
  type: "Type",
  size: "Size",
  time: "Time",
  waterfall: "Waterfall",
  failed: "failed",
  headers: "Headers",
  response: "Response",
  general: "General",
  url: "URL",
  requestHeaders: "Request headers",
  responseHeaders: "Response headers",
  noHeaders: "None",
  noBody: "No response body",
  close: "Close",
  empty: "No requests",
  noMatches: "No requests match",
  request: "request",
  requests: "requests",
  finished: "Finished",
};
export const networkTypes: NetworkType[] = ["document", "script", "style", "fetch", "image", "font", "other"];

type Tab = "headers" | "response";

/** The last part of a URL's path, or its host for "/" */
export function requestName(url: string) {
  const path = url.split(/[?#]/)[0].replace(/\/+$/, "");
  const slash = path.lastIndexOf("/");
  const name = path.slice(slash + 1);
  return name && !/^[a-z]+:$/i.test(name) ? name : url;
}
const statusTone = (s: number) => (s === 0 || s >= 400 ? "danger" : s >= 300 ? "neutral" : "success");

/* After Lucide: arrow-down-up, x (ISC licence) */
const headIcon = svg`<path d="m3 16 4 4 4-4"></path><path d="M7 20V4"></path><path d="m21 8-4-4-4 4"></path><path d="M17 4v16"></path>`;
const closeIcon = html`<svg viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`}</svg>`;

let instances = 0;

/**
 * The requests a web page made: status, method, name, type, size, time and a waterfall, with type chips and a detail of headers and response.
 * @tag tc-network-log
 * @fires tc-types-change - A type chip was toggled ({ types }: NetworkTypesChange); empty means all; cancelable – prevented, `types` stays as it was
 * @fires tc-selected-change - A request was opened or its details closed ({ selected, request }: NetworkSelectedChange); cancelable – prevented, `selected` stays as it was
 */
export class TcNetworkLog extends TcElement {
  static override ui = "netl";

  /** The heading; empty leaves the header out */
  @property() accessor heading = "Network";
  /** Small text under the heading – the page they belong to */
  @property() accessor description = "";
  /** The requests, in the order they started */
  @property({ attribute: false }) accessor requests: NetworkRequest[] = [];
  /** The types that show; empty shows them all */
  @property({ attribute: false }) accessor types: NetworkType[] = [];
  /** The open request's id */
  @property() accessor selected: string | null = null;
  /** Height in px at which the list scrolls */
  @property({ type: Number, attribute: "max-height" }) accessor maxHeight = 320;
  /** Locale for sizes and times */
  @property() accessor locale: string | undefined = undefined;
  /** Renames the words it uses */
  @property({ attribute: false }) accessor labels: Partial<NetworkLogLabels> = {};

  /** The row that holds the tab stop */
  @state() private accessor active: string | null = null;
  /** The type chip that holds the tab stop */
  @state() private accessor chip: "all" | NetworkType = "all";
  /** The detail's tab */
  @state() private accessor tab: Tab = "headers";

  private uid = `tc-netl-${++instances}`;
  private shownCache: NetworkRequest[] = [];

  private get words() {
    return { ...defaultNetworkLogLabels, ...this.labels };
  }
  private get shown() {
    return this.types.length ? this.requests.filter((r) => this.types.includes(r.type)) : this.requests;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.shownCache = this.shown;
    if (!this.shownCache.some((r) => r.id === this.active)) this.active = this.shownCache.find((r) => r.id === this.selected)?.id ?? this.shownCache[0]?.id ?? null;
  }

  private size(bytes: number) {
    const units = ["B", "kB", "MB", "GB"];
    let v = bytes;
    let u = 0;
    while (v >= 1000 && u < units.length - 1) {
      v /= 1000;
      u++;
    }
    return `${new Intl.NumberFormat(this.locale, { maximumFractionDigits: u === 0 || v >= 100 ? 0 : 1 }).format(v)} ${units[u]}`;
  }
  private ms(ms: number) {
    return ms < 1000 ? `${new Intl.NumberFormat(this.locale, { maximumFractionDigits: 0 }).format(ms)} ms` : `${new Intl.NumberFormat(this.locale, { maximumFractionDigits: 2 }).format(ms / 1000)} s`;
  }

  private choose(selected: string | null) {
    if (selected === this.selected) return;
    const request = selected === null ? undefined : this.requests.find((r) => r.id === selected);
    if (this.emit<NetworkSelectedChange>("tc-selected-change", { selected, request }, { cancelable: true })) this.selected = selected;
  }

  private toggleType(type: "all" | NetworkType) {
    const types = type === "all" ? [] : this.types.includes(type) ? this.types.filter((t) => t !== type) : networkTypes.filter((t) => t === type || this.types.includes(t));
    if (types.length === this.types.length && types.every((t) => this.types.includes(t))) return;
    if (this.emit<NetworkTypesChange>("tc-types-change", { types }, { cancelable: true })) this.types = types;
  }

  private async focusRow(id: string) {
    this.active = id;
    await this.updateComplete;
    this.querySelector<HTMLElement>(`.ui-netl__row[data-id="${CSS.escape(id)}"]`)?.focus();
  }

  private onGridKey = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const list = this.shownCache;
    const i = list.findIndex((r) => r.id === this.active);
    if (i < 0) return;
    let to: string | undefined;
    switch (e.key) {
      case "ArrowDown":
        to = list[i + 1]?.id;
        break;
      case "ArrowUp":
        to = list[i - 1]?.id;
        break;
      case "Home":
        to = list[0].id;
        break;
      case "End":
        to = list[list.length - 1].id;
        break;
      case "Enter":
      case " ":
        this.choose(list[i].id);
        break;
      case "Escape":
        if (this.selected === null) return;
        this.choose(null);
        break;
      default:
        return;
    }
    e.preventDefault();
    if (to) void this.focusRow(to);
  };

  private onChipsKey = (e: KeyboardEvent) => {
    const all: ("all" | NetworkType)[] = ["all", ...networkTypes];
    const i = all.indexOf(this.chip);
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: all.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    this.chip = all[(to + all.length) % all.length];
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-netl__chip[data-type="${this.chip}"]`)?.focus());
  };

  private onTabsKey = (e: KeyboardEvent) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    this.tab = e.key === "Home" ? "headers" : e.key === "End" ? "response" : this.tab === "headers" ? "response" : "headers";
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-netl__tab[data-tab="${this.tab}"]`)?.focus());
  };

  private close() {
    const id = this.selected;
    this.choose(null);
    if (id && this.selected === null) void this.focusRow(id);
  }

  private row(r: NetworkRequest, span: number): TemplateResult {
    const words = this.words;
    const tone = statusTone(r.status);
    const left = span ? (r.start / span) * 100 : 0;
    const width = span ? Math.max((r.duration / span) * 100, 0.5) : 0;
    return html`<div
      class="ui-netl__row"
      role="row"
      data-id=${r.id}
      data-tone=${tone}
      aria-selected=${r.id === this.selected ? "true" : "false"}
      aria-controls=${r.id === this.selected ? `${this.uid}-detail` : nothing}
      tabindex=${r.id === this.active ? 0 : -1}
      @click=${() => {
        this.active = r.id;
        this.choose(r.id);
      }}
    >
      <span class="ui-netl__cell ui-netl__status" role="gridcell">${r.status === 0 ? words.failed : r.status}</span>
      <span class="ui-netl__cell ui-netl__method" role="gridcell">${r.method}</span>
      <span class="ui-netl__cell ui-netl__name" role="gridcell" title=${r.url}><span class="ui-netl__file">${requestName(r.url)}</span><span class="ui-netl__url">${r.url}</span></span>
      <span class="ui-netl__cell ui-netl__type" role="gridcell">${words[r.type]}</span>
      <span class="ui-netl__cell ui-netl__size" role="gridcell">${r.size === undefined ? "–" : this.size(r.size)}</span>
      <span class="ui-netl__cell ui-netl__time" role="gridcell">${this.ms(r.duration)}</span>
      <span class="ui-netl__cell ui-netl__fall" role="gridcell"><span class="ui-netl__bar" aria-hidden="true" style=${styleMap({ left: `${left}%`, width: `${width}%` })}></span></span>
    </div>`;
  }

  private headerList(title: string, headers: Record<string, string> | undefined) {
    const entries = Object.entries(headers ?? {});
    return html`<section class="ui-netl__group">
      <h4 class="ui-netl__group-title">${title}</h4>
      ${entries.length
        ? html`<dl class="ui-netl__pairs">${entries.map(([k, v]) => html`<div class="ui-netl__pair"><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>`
        : html`<p class="ui-netl__none">${this.words.noHeaders}</p>`}
    </section>`;
  }

  private detail(r: NetworkRequest) {
    const words = this.words;
    const general = { [words.url]: r.url, [words.method]: r.method, [words.status]: r.status === 0 ? words.failed : String(r.status) };
    const body = r.body;
    return html`<section class="ui-netl__detail" id=${`${this.uid}-detail`} aria-label=${requestName(r.url)}>
      <div class="ui-netl__detail-head">
        <div class="ui-netl__tabs" role="tablist" aria-label=${requestName(r.url)} @keydown=${this.onTabsKey}>
          ${(["headers", "response"] as const).map(
            (t) => html`<button type="button" class="ui-netl__tab" role="tab" data-tab=${t} id=${`${this.uid}-tab-${t}`} aria-selected=${t === this.tab ? "true" : "false"} aria-controls=${`${this.uid}-panel`} tabindex=${t === this.tab ? 0 : -1} @click=${() => (this.tab = t)}>${words[t]}</button>`,
          )}
        </div>
        <span class="ui-netl__detail-name" title=${r.url}>${requestName(r.url)}</span>
        <button type="button" class="ui-netl__close" title=${words.close} aria-label=${words.close} @click=${() => this.close()}>${closeIcon}</button>
      </div>
      <div class="ui-netl__panel" role="tabpanel" id=${`${this.uid}-panel`} aria-labelledby=${`${this.uid}-tab-${this.tab}`}>
        ${this.tab === "headers"
          ? html`${this.headerList(words.general, general)}${this.headerList(words.responseHeaders, r.responseHeaders)}${this.headerList(words.requestHeaders, r.requestHeaders)}`
          : body === undefined || body === ""
            ? html`<p class="ui-netl__none">${words.noBody}</p>`
            : typeof body === "string"
              ? html`<pre class="ui-netl__text" tabindex="0">${body}</pre>`
              : html`<tc-json-viewer class="ui-netl__json" look="clean" heading=${requestName(r.url)} filename=${`${requestName(r.url).replace(/\.json$/, "")}.json`} .value=${body}></tc-json-viewer>`}
      </div>
    </section>`;
  }

  protected override render() {
    const words = this.words;
    const list = this.shownCache;
    const span = Math.max(0, ...list.map((r) => r.start + r.duration));
    const total = list.reduce((n, r) => n + (r.size ?? 0), 0);
    const failed = this.requests.filter((r) => statusTone(r.status) === "danger").length;
    const open = this.requests.find((r) => r.id === this.selected);
    const counts = new Map<NetworkType, number>();
    for (const r of this.requests) counts.set(r.type, (counts.get(r.type) ?? 0) + 1);
    const chips: ("all" | NetworkType)[] = ["all", ...networkTypes];
    const n = list.length;
    const aside = failed ? html`<span class="ui-netl__failed">${failed} ${words.failed}</span>` : nothing;
    return html`${this.heading ? cardHead({ icon: headIcon, title: this.heading, subtitle: this.description, aside }) : nothing}
      <div class="ui-netl__card">
        <div class="ui-netl__chips" role="group" aria-label=${words.types} @keydown=${this.onChipsKey}>
          ${chips.map((t) => {
            const pressed = t === "all" ? !this.types.length : this.types.includes(t);
            return html`<button type="button" class="ui-netl__chip" data-type=${t} aria-pressed=${pressed ? "true" : "false"} tabindex=${t === this.chip ? 0 : -1} @click=${() => {
              this.chip = t;
              this.toggleType(t);
            }}>${t === "all" ? words.all : words[t]}${t === "all" ? nothing : html` <span class="ui-netl__chip-count">${counts.get(t) ?? 0}</span>`}</button>`;
          })}
        </div>
        ${n
          ? html`<div class="ui-netl__grid" role="grid" aria-label=${this.heading || words.requests} aria-rowcount=${n + 1} @keydown=${this.onGridKey}>
              <div class="ui-netl__head" role="row">
                ${(["status", "method", "name", "type", "size", "time", "waterfall"] as const).map((c) => html`<span class=${`ui-netl__cell ui-netl__${c === "waterfall" ? "fall" : c}`} role="columnheader">${words[c]}</span>`)}
              </div>
              <div class="ui-netl__scroll" role="rowgroup" style=${styleMap({ maxHeight: `${this.maxHeight}px` })}>${list.map((r) => this.row(r, span))}</div>
            </div>`
          : html`<p class="ui-netl__empty">${this.requests.length ? words.noMatches : words.empty}</p>`}
        <div class="ui-netl__foot">
          <span>${n === this.requests.length ? n : `${n} / ${this.requests.length}`} ${this.requests.length === 1 ? words.request : words.requests}</span>
          <span aria-hidden="true">·</span><span>${this.size(total)}</span>
          ${n ? html`<span aria-hidden="true">·</span><span>${words.finished} ${this.ms(span)}</span>` : nothing}
        </div>
        ${open ? this.detail(open) : nothing}
      </div>
      <span class="ui-netl__sr" role="status">${n} ${n === 1 ? words.request : words.requests}</span>`;
  }

  static override css = /* css */ `
[data-ui="netl"] {
  box-sizing: border-box;
  display: block;
  min-width: 0;
  width: 100%;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  -webkit-font-smoothing: antialiased;
  container-type: inline-size;
  --tc-netl-cols: 3.5rem 4rem minmax(0, 1fr) 3.5rem 4.5rem 4.5rem 22%;
  --tc-netl-cols-narrow: 3.5rem 3.5rem minmax(0, 1fr) 4.5rem;
  --tc-netl-bar-h: 8px;
}
[data-ui="netl"] *, [data-ui="netl"] *::before, [data-ui="netl"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="netl"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="netl"] .ui-netl__card {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="netl"] {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
.ui-netl__card { overflow: hidden; }
.ui-netl__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-netl__failed { color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-netl__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); padding: var(--tc-space-2); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-netl__chip {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1);
  height: var(--tc-control-h-sm);
  margin: 0;
  padding: 0 var(--tc-space-2);
  border: var(--tc-hairline) solid var(--tc-border-default);
  border-radius: var(--tc-pill-radius);
  background: none;
  color: var(--tc-text-secondary);
  font: inherit;
  font-size: var(--tc-font-size-sm);
  white-space: nowrap;
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-netl__chip:hover { background: var(--tc-fill-subtle); }
.ui-netl__chip[aria-pressed="true"] { border-color: var(--tc-border-selected); background: var(--tc-fill-selected); color: var(--tc-text-primary); }
.ui-netl__chip-count { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-netl__chip:focus-visible, .ui-netl__tab:focus-visible, .ui-netl__close:focus-visible, .ui-netl__text:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-netl__head, .ui-netl__row { display: grid; grid-template-columns: var(--tc-netl-cols); align-items: center; gap: var(--tc-space-2); padding: 0 var(--tc-space-3); }
.ui-netl__head { min-height: var(--tc-control-h-sm); border-bottom: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-netl__scroll { overflow: auto; overscroll-behavior: contain; }
.ui-netl__row { min-height: var(--tc-control-h-md); padding-top: var(--tc-space-1); padding-bottom: var(--tc-space-1); border-bottom: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-font-size-sm); cursor: pointer; }
.ui-netl__row:last-child { border-bottom: 0; }
.ui-netl__row:hover { background: var(--tc-fill-subtle); }
.ui-netl__row[aria-selected="true"] { background: var(--tc-fill-default); }
.ui-netl__row:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-netl__cell { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-netl__status, .ui-netl__size, .ui-netl__time { font-variant-numeric: tabular-nums; }
.ui-netl__size, .ui-netl__time { text-align: right; }
.ui-netl__row .ui-netl__status { font-family: var(--tc-font-mono); font-weight: var(--tc-font-weight-medium); }
.ui-netl__row[data-tone="success"] .ui-netl__status { color: var(--tc-status-success-fg); }
.ui-netl__row[data-tone="neutral"] .ui-netl__status { color: var(--tc-text-secondary); }
.ui-netl__row[data-tone="danger"] .ui-netl__status, .ui-netl__row[data-tone="danger"] .ui-netl__file { color: var(--tc-status-danger-fg); }
.ui-netl__method { color: var(--tc-text-secondary); font-family: var(--tc-font-mono); }
.ui-netl__name { display: grid; }
.ui-netl__file, .ui-netl__url { overflow: hidden; text-overflow: ellipsis; }
.ui-netl__url { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-netl__type, .ui-netl__size, .ui-netl__time { color: var(--tc-text-secondary); }
.ui-netl__fall { position: relative; height: var(--tc-netl-bar-h); overflow: visible; border-radius: var(--tc-radius-xs); background: var(--tc-fill-subtle); }
.ui-netl__head .ui-netl__fall { height: auto; background: none; }
.ui-netl__bar { position: absolute; top: 0; bottom: 0; border-radius: var(--tc-radius-xs); background: var(--tc-accent-solid); }
.ui-netl__row[data-tone="danger"] .ui-netl__bar { background: var(--tc-status-danger-solid); }
.ui-netl__empty { margin: 0; padding: var(--tc-space-6) var(--tc-space-3); color: var(--tc-text-muted); text-align: center; }
.ui-netl__foot { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); padding: var(--tc-space-1-5) var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-netl__detail { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-netl__detail-head { display: flex; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-1-5) var(--tc-space-2); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-netl__tabs { display: flex; flex: none; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-netl__tab {
  height: calc(var(--tc-control-h-sm) - 2 * var(--tc-seg-pad));
  margin: 0;
  padding: 0 var(--tc-space-2);
  border: 0;
  border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad));
  background: none;
  color: var(--tc-text-secondary);
  font: inherit;
  font-size: var(--tc-font-size-sm);
  cursor: pointer;
}
.ui-netl__tab[aria-selected="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
.ui-netl__detail-name { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-secondary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); text-overflow: ellipsis; white-space: nowrap; }
.ui-netl__close {
  display: grid;
  flex: none;
  place-items: center;
  width: var(--tc-control-h-sm);
  height: var(--tc-control-h-sm);
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  background: none;
  color: var(--tc-icon-muted);
  cursor: pointer;
}
.ui-netl__close:hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-netl__close svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
.ui-netl__panel { padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-3); }
.ui-netl__group + .ui-netl__group { margin-top: var(--tc-space-3); }
.ui-netl__group-title { margin: 0 0 var(--tc-space-1); color: var(--tc-text-strong); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); }
.ui-netl__pairs { display: grid; gap: var(--tc-space-0-5); margin: 0; font-size: var(--tc-font-size-sm); }
.ui-netl__pair { display: grid; grid-template-columns: minmax(8rem, 30%) minmax(0, 1fr); gap: var(--tc-space-2); }
.ui-netl__pair dt { color: var(--tc-text-secondary); font-family: var(--tc-font-mono); overflow-wrap: anywhere; }
.ui-netl__pair dd { margin: 0; font-family: var(--tc-font-mono); overflow-wrap: anywhere; }
.ui-netl__none { margin: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-netl__text { max-height: 280px; margin: 0; padding: var(--tc-space-2); overflow: auto; border-radius: var(--tc-radius-sm); background: var(--tc-fill-subtle); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); white-space: pre-wrap; overflow-wrap: anywhere; }
/* The JSON Viewer sits inside this card: no second card around it */
.ui-netl__detail .ui-netl__json[data-ui="jsv"] { --tc-jsv-body-h: 300px; border-radius: 0; background: none; box-shadow: none; }
@container (max-width: 480px) {
  .ui-netl__head, .ui-netl__row { grid-template-columns: var(--tc-netl-cols-narrow); }
  .ui-netl__type, .ui-netl__size, .ui-netl__fall { display: none; }
  .ui-netl__pair { grid-template-columns: minmax(0, 1fr); gap: 0; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="netl"] *, [data-ui="netl"] *::before, [data-ui="netl"] *::after { transition: none !important; }
}
@media (forced-colors: active) {
  .ui-netl__bar { background: CanvasText; }
  .ui-netl__chip[aria-pressed="true"] { border-color: Highlight; }
}
`;
}

if (!customElements.get("tc-network-log")) customElements.define("tc-network-log", TcNetworkLog);
declare global {
  interface HTMLElementTagNameMap {
    "tc-network-log": TcNetworkLog;
  }
}
