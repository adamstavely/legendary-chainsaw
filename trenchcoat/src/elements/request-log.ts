import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { copyText } from "./internal/util";
import "./json-viewer";
import type { JsonValue } from "./json-viewer";

/*
 * <tc-request-log> – every request an app made to a model provider, one line each: when, the provider and model, the
 * endpoint, the status (an error also in words: "429 Rate limited"), the latency with a small bar, input and output
 * tokens, the cost and whether the cache answered. Chips filter by status class (2xx, 4xx, 5xx, rate limited) and by
 * model. Choosing a request opens it under the list: the request and response bodies (an object in a JSON Viewer,
 * text as it came) and both header sets, with secrets masked, and Copy as cURL – its auth header redacted too.
 *   · the list is one tab stop, a grid of rows: ↑ / ↓ / Home / End move, Enter or Space open a request, Esc closes it
 *   · keys named in `redact` (authorization, api keys, tokens…) are masked in headers and bodies wherever they appear
 *   · narrow, the endpoint, tokens and cache columns are left out
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-request-log .requests=${[{ id: "q1", at: 1762412400000, provider: "Provider", model: "large-1", endpoint: "/v1/messages", status: 200, latency: 840 }]}>
 *   </tc-request-log>
 */

export type RequestStatusClass = "2xx" | "4xx" | "5xx" | "rate-limited";
export type ProviderRequest = {
  /** Stable identity */
  id: string;
  /** When it was sent, epoch ms */
  at: number;
  provider: string;
  model: string;
  /** The path called, e.g. /v1/messages */
  endpoint: string;
  /** GET, POST…; POST when left out */
  method?: string;
  /** The HTTP status; 0 when no response came */
  status: number;
  /** How long it took, in ms */
  latency: number;
  inputTokens?: number;
  outputTokens?: number;
  cost?: number;
  /** The provider's cache answered all or part of it */
  cacheHit?: boolean;
  /** The full URL, for Copy as cURL; else `baseUrl` + `endpoint` */
  url?: string;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  /** The request body: an object is shown in a JSON Viewer, a string as text */
  requestBody?: string | JsonValue;
  /** The response body: an object is shown in a JSON Viewer, a string as text */
  responseBody?: string | JsonValue;
};
export type RequestLogClassesChange = { classes: RequestStatusClass[] };
export type RequestLogModelsChange = { models: string[] };
export type RequestLogSelectedChange = { selected: string | null; request?: ProviderRequest };
export type RequestLogOpen = { id: string; request: ProviderRequest };
export type RequestLogCopy = { field: "curl"; text: string; id: string };
export type RequestLogLabels = Record<RequestStatusClass, string> &
  Record<
    | "time"
    | "model"
    | "endpoint"
    | "status"
    | "latency"
    | "tokens"
    | "cost"
    | "cache"
    | "hit"
    | "miss"
    | "classFilter"
    | "modelFilter"
    | "request"
    | "requests"
    | "errors"
    | "median"
    | "requestTab"
    | "responseTab"
    | "headersTab"
    | "requestHeaders"
    | "responseHeaders"
    | "noHeaders"
    | "noBody"
    | "copyCurl"
    | "copied"
    | "copyFailed"
    | "close"
    | "empty"
    | "noMatches",
    string
  >;
export const defaultRequestLogLabels: RequestLogLabels = {
  "2xx": "2xx",
  "4xx": "4xx",
  "5xx": "5xx",
  "rate-limited": "Rate limited",
  time: "Time",
  model: "Model",
  endpoint: "Endpoint",
  status: "Status",
  latency: "Latency",
  tokens: "Tokens in → out",
  cost: "Cost",
  cache: "Cache",
  hit: "Hit",
  miss: "Miss",
  classFilter: "Filter by status",
  modelFilter: "Filter by model",
  request: "request",
  requests: "requests",
  errors: "errors",
  median: "median",
  requestTab: "Request",
  responseTab: "Response",
  headersTab: "Headers",
  requestHeaders: "Request headers",
  responseHeaders: "Response headers",
  noHeaders: "None",
  noBody: "No body",
  copyCurl: "Copy as cURL",
  copied: "cURL command copied.",
  copyFailed: "Couldn't copy the cURL command.",
  close: "Close",
  empty: "No requests yet",
  noMatches: "No requests match",
};
export const requestStatusClasses: RequestStatusClass[] = ["2xx", "4xx", "5xx", "rate-limited"];
/** Keys masked by default, in headers and bodies, compared without case, - or _ */
export const defaultRedactKeys = ["authorization", "proxy-authorization", "x-api-key", "api-key", "apikey", "token", "access-token", "secret", "client-secret", "password", "cookie", "set-cookie"];
export const REDACTED = "[redacted]";

const STATUS_WORDS: Record<number, string> = {
  0: "No response",
  400: "Bad request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not found",
  408: "Timed out",
  409: "Conflict",
  413: "Too large",
  422: "Invalid request",
  429: "Rate limited",
  500: "Server error",
  502: "Bad gateway",
  503: "Unavailable",
  504: "Gateway timeout",
  529: "Overloaded",
};

/** The status class a code belongs to: 429 is its own; no response counts with the 5xx */
export function statusClass(status: number): RequestStatusClass {
  if (status === 429) return "rate-limited";
  if (status >= 200 && status < 400) return "2xx";
  if (status >= 400 && status < 500) return "4xx";
  return "5xx";
}
/** An error status in words, "" for a success */
export function statusWords(status: number) {
  if (status >= 200 && status < 400) return "";
  return STATUS_WORDS[status] ?? (status >= 500 ? "Server error" : status >= 400 ? "Client error" : "No response");
}

const norm = (k: string) => k.toLowerCase().replace(/[-_\s]/g, "");
/** A copy of headers or a body with every key in `keys` masked, however deep */
export function redact<T>(value: T, keys: string[] = defaultRedactKeys): T {
  const set = new Set(keys.map(norm));
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, set.has(norm(k)) ? REDACTED : walk(x)]));
    return v;
  };
  return walk(value) as T;
}

const shell = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;
/** The request as a cURL command, its secrets redacted */
export function curlCommand(r: ProviderRequest, baseUrl = "", keys: string[] = defaultRedactKeys) {
  const url = r.url ?? `${baseUrl}${r.endpoint}`;
  const parts = [`curl -X ${r.method ?? "POST"} ${shell(url)}`];
  for (const [k, v] of Object.entries(redact(r.requestHeaders ?? {}, keys))) parts.push(`-H ${shell(`${k}: ${v}`)}`);
  if (r.requestBody !== undefined && r.requestBody !== "") {
    const body = typeof r.requestBody === "string" ? r.requestBody : JSON.stringify(redact(r.requestBody, keys));
    parts.push(`--data ${shell(body)}`);
  }
  return parts.join(" \\\n  ");
}

/* After Lucide: arrow-right-left, x, terminal, check (ISC licence) */
const headIcon = svg`<path d="m16 3 4 4-4 4"></path><path d="M20 7H4"></path><path d="m8 21-4-4 4-4"></path><path d="M4 17h16"></path>`;
const icon = (paths: TemplateResult) => html`<svg viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
const closeIcon = icon(svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);
const curlIcon = icon(svg`<path d="m4 17 6-6-6-6"></path><path d="M12 19h8"></path>`);
const checkIcon = icon(svg`<path d="M20 6 9 17l-5-5"></path>`);
const TONES: Record<RequestStatusClass, string> = { "2xx": "success", "4xx": "warning", "5xx": "danger", "rate-limited": "warning" };
const COPIED_MS = 1600;
type Tab = "request" | "response" | "headers";
type ChipGroup = "classes" | "models";

let instances = 0;

/**
 * Every request an app made to a model provider, one line each – time, model, endpoint, status, latency, tokens, cost and cache – with status and model filters and a detail of bodies and headers, secrets masked, and Copy as cURL.
 * @tag tc-request-log
 * @fires tc-classes-change - A status class chip was toggled ({ classes }: RequestLogClassesChange); empty means all; cancelable – prevented, `classes` stays as it was
 * @fires tc-models-change - A model chip was toggled ({ models }: RequestLogModelsChange); empty means all; cancelable – prevented, `models` stays as it was
 * @fires tc-selected-change - A request was opened or its details closed ({ selected, request }: RequestLogSelectedChange); cancelable – prevented, `selected` stays as it was
 * @fires tc-request-open - A request was chosen, before tc-selected-change ({ id, request }: RequestLogOpen)
 * @fires tc-copy - Copy as cURL was pressed ({ field, text, id }: RequestLogCopy); cancelable – prevent it to write the clipboard yourself
 */
export class TcRequestLog extends TcElement {
  static override ui = "rqlg";

  /** The heading; empty leaves the header out */
  @property() accessor heading = "Requests";
  /** Small text under the heading */
  @property() accessor description = "";
  /** The requests, in any order – the list shows the newest first */
  @property({ attribute: false }) accessor requests: ProviderRequest[] = [];
  /** The status classes that show; empty shows them all */
  @property({ attribute: false }) accessor classes: RequestStatusClass[] = [];
  /** The models that show; empty shows them all */
  @property({ attribute: false }) accessor models: string[] = [];
  /** The open request's id */
  @property() accessor selected: string | null = null;
  /** Put before each request's endpoint for Copy as cURL, when it has no `url` */
  @property({ attribute: "base-url" }) accessor baseUrl = "";
  /** Header and body keys to mask, compared without case, - or _ */
  @property({ attribute: false }) accessor redact: string[] = defaultRedactKeys;
  /** ISO 4217 currency code for costs */
  @property() accessor currency = "USD";
  /** Locale for times, numbers and amounts */
  @property() accessor locale: string | undefined = undefined;
  /** Height in px at which the list scrolls */
  @property({ type: Number, attribute: "max-height" }) accessor maxHeight = 360;
  /** Renames the words it uses */
  @property({ attribute: false }) accessor labels: Partial<RequestLogLabels> = {};

  /** @internal The row that holds the tab stop */
  @state() private accessor active: string | null = null;
  /** @internal Each chip group's tab stop */
  @state() private accessor chipStop: Record<ChipGroup, string> = { classes: "", models: "" };
  /** @internal The detail's tab */
  @state() private accessor tab: Tab = "request";
  /** @internal Copy as cURL shows a check */
  @state() private accessor copied = false;
  /** @internal What the status region says */
  @state() private accessor message = "";

  private uid = `tc-rqlg-${++instances}`;
  private visible: ProviderRequest[] = [];
  private copiedTimer = 0;

  private get words() {
    return { ...defaultRequestLogLabels, ...this.labels };
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.copiedTimer);
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.visible = this.requests
      .filter((r) => (!this.classes.length || this.classes.includes(statusClass(r.status))) && (!this.models.length || this.models.includes(r.model)))
      .sort((a, b) => b.at - a.at);
    if (!this.visible.some((r) => r.id === this.active)) this.active = this.visible.find((r) => r.id === this.selected)?.id ?? this.visible[0]?.id ?? null;
  }

  /* ---------- formatting ---------- */

  private num(n: number) {
    return new Intl.NumberFormat(this.locale).format(n);
  }
  private money(n: number) {
    const small = n !== 0 && n < 0.01;
    try {
      return new Intl.NumberFormat(this.locale, { style: "currency", currency: this.currency, minimumFractionDigits: small ? 4 : 2, maximumFractionDigits: small ? 4 : 2 }).format(n);
    } catch {
      return n.toFixed(4);
    }
  }
  private ms(ms: number) {
    return ms < 1000 ? `${this.num(Math.round(ms))} ms` : `${new Intl.NumberFormat(this.locale, { maximumFractionDigits: 2 }).format(ms / 1000)} s`;
  }
  private clock(at: number) {
    return new Intl.DateTimeFormat(this.locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(at);
  }

  /* ---------- state changes ---------- */

  private choose(selected: string | null) {
    if (selected === this.selected) return;
    const request = selected === null ? undefined : this.requests.find((r) => r.id === selected);
    // Asked for even when a controlling page keeps `selected` itself
    if (request) this.emit<RequestLogOpen>("tc-request-open", { id: request.id, request });
    if (this.emit<RequestLogSelectedChange>("tc-selected-change", { selected, request }, { cancelable: true })) this.selected = selected;
  }
  private toggle(group: ChipGroup, value: string) {
    if (group === "classes") {
      const v = value as RequestStatusClass;
      const classes = this.classes.includes(v) ? this.classes.filter((c) => c !== v) : requestStatusClasses.filter((c) => c === v || this.classes.includes(c));
      if (this.emit<RequestLogClassesChange>("tc-classes-change", { classes }, { cancelable: true })) this.classes = classes;
    } else {
      const models = this.models.includes(value) ? this.models.filter((m) => m !== value) : [...this.models, value];
      if (this.emit<RequestLogModelsChange>("tc-models-change", { models }, { cancelable: true })) this.models = models;
    }
  }
  private announce(text: string) {
    this.message = this.message === text ? `${text} ` : text;
  }
  private async copyCurl(r: ProviderRequest) {
    const words = this.words;
    const text = curlCommand(r, this.baseUrl, this.redact);
    if (!this.emit<RequestLogCopy>("tc-copy", { field: "curl", text, id: r.id }, { cancelable: true }) || (await copyText(text))) {
      clearTimeout(this.copiedTimer);
      this.copied = true;
      this.announce(words.copied);
      this.copiedTimer = window.setTimeout(() => (this.copied = false), COPIED_MS);
    } else this.announce(words.copyFailed);
  }

  /* ---------- keyboard ---------- */

  private async focusRow(id: string) {
    this.active = id;
    await this.updateComplete;
    this.querySelector<HTMLElement>(`.ui-rqlg__row[data-id="${CSS.escape(id)}"]`)?.focus();
  }

  private onGridKey = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const list = this.visible;
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

  private onChipsKey(group: ChipGroup, values: string[]) {
    return (e: KeyboardEvent) => {
      const i = Math.max(0, values.indexOf(this.chipStop[group] || values[0]));
      const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: values.length - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault();
      const next = values[(to + values.length) % values.length];
      this.chipStop = { ...this.chipStop, [group]: next };
      void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-rqlg__chips[data-group="${group}"] .ui-rqlg__chip[data-value="${CSS.escape(next)}"]`)?.focus());
    };
  }

  private onTabsKey = (e: KeyboardEvent) => {
    const tabs: Tab[] = ["request", "response", "headers"];
    const i = tabs.indexOf(this.tab);
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    this.tab = tabs[(to + tabs.length) % tabs.length];
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-rqlg__tab[data-tab="${this.tab}"]`)?.focus());
  };

  private close() {
    const id = this.selected;
    this.choose(null);
    if (id && this.selected === null) {
      const to = this.visible.some((r) => r.id === id) ? id : this.active;
      if (to) void this.focusRow(to);
    }
  }

  /* ---------- render ---------- */

  private chips(group: ChipGroup, label: string, values: string[], text: (v: string) => string, counts: Map<string, number>) {
    if (group === "models" && values.length < 2) return nothing;
    const stop = values.includes(this.chipStop[group]) ? this.chipStop[group] : values[0];
    const on = group === "classes" ? (this.classes as string[]) : this.models;
    return html`<div class="ui-rqlg__chips" role="group" aria-label=${label} data-group=${group} @keydown=${this.onChipsKey(group, values)}>
      ${values.map(
        (v) => html`<button
          type="button"
          class="ui-rqlg__chip"
          data-value=${v}
          aria-pressed=${on.includes(v) ? "true" : "false"}
          tabindex=${v === stop ? 0 : -1}
          @click=${() => {
            this.chipStop = { ...this.chipStop, [group]: v };
            this.toggle(group, v);
          }}
        >${text(v)} <span class="ui-rqlg__chip-count">${counts.get(v) ?? 0}</span></button>`,
      )}
    </div>`;
  }

  private row(r: ProviderRequest, slowest: number) {
    const words = this.words;
    const cls = statusClass(r.status);
    const said = statusWords(r.status);
    const width = slowest ? Math.max((r.latency / slowest) * 100, 2) : 0;
    return html`<div
      class="ui-rqlg__row"
      role="row"
      data-id=${r.id}
      data-tone=${TONES[cls]}
      aria-selected=${r.id === this.selected ? "true" : "false"}
      aria-controls=${r.id === this.selected ? `${this.uid}-detail` : nothing}
      tabindex=${r.id === this.active ? 0 : -1}
      @click=${() => {
        this.active = r.id;
        this.choose(r.id);
      }}
    >
      <span class="ui-rqlg__cell ui-rqlg__time" role="gridcell"><time datetime=${new Date(r.at).toISOString()}>${this.clock(r.at)}</time></span>
      <span class="ui-rqlg__cell ui-rqlg__model" role="gridcell"><span class="ui-rqlg__provider">${r.provider}</span> <span class="ui-rqlg__model-name">${r.model}</span></span>
      <span class="ui-rqlg__cell ui-rqlg__endpoint" role="gridcell"><span class="ui-rqlg__method">${r.method ?? "POST"}</span> ${r.endpoint}</span>
      <span class="ui-rqlg__cell ui-rqlg__status" role="gridcell"><span class="ui-rqlg__code">${r.status || "–"}</span>${said ? html` <span class="ui-rqlg__said">${said}</span>` : nothing}</span>
      <span class="ui-rqlg__cell ui-rqlg__latency" role="gridcell"><span class="ui-rqlg__ms">${this.ms(r.latency)}</span><span class="ui-rqlg__track" aria-hidden="true"><span class="ui-rqlg__bar" style=${styleMap({ width: `${width}%` })}></span></span></span>
      <span class="ui-rqlg__cell ui-rqlg__tokens ui-rqlg__num" role="gridcell">${r.inputTokens === undefined && r.outputTokens === undefined ? "–" : `${this.num(r.inputTokens ?? 0)} → ${this.num(r.outputTokens ?? 0)}`}</span>
      <span class="ui-rqlg__cell ui-rqlg__cost ui-rqlg__num" role="gridcell">${r.cost === undefined ? "–" : this.money(r.cost)}</span>
      <span class="ui-rqlg__cell ui-rqlg__cache" role="gridcell" data-hit=${r.cacheHit ? "true" : "false"}>${r.cacheHit === undefined ? "–" : r.cacheHit ? words.hit : words.miss}</span>
    </div>`;
  }

  private body(value: string | JsonValue | undefined, name: string) {
    if (value === undefined || value === "") return html`<p class="ui-rqlg__none">${this.words.noBody}</p>`;
    if (typeof value === "string") return html`<pre class="ui-rqlg__text" tabindex="0">${value}</pre>`;
    return html`<tc-json-viewer class="ui-rqlg__json" look="clean" heading=${name} filename=${`${name.toLowerCase()}.json`} .value=${redact(value, this.redact)}></tc-json-viewer>`;
  }

  private headerList(title: string, headers: Record<string, string> | undefined) {
    const entries = Object.entries(redact(headers ?? {}, this.redact));
    return html`<section class="ui-rqlg__group">
      <h4 class="ui-rqlg__group-title">${title}</h4>
      ${entries.length
        ? html`<dl class="ui-rqlg__pairs">${entries.map(([k, v]) => html`<div class="ui-rqlg__pair"><dt>${k}</dt><dd data-redacted=${v === REDACTED ? "true" : "false"}>${v}</dd></div>`)}</dl>`
        : html`<p class="ui-rqlg__none">${this.words.noHeaders}</p>`}
    </section>`;
  }

  private detail(r: ProviderRequest) {
    const words = this.words;
    const tabs: [Tab, string][] = [
      ["request", words.requestTab],
      ["response", words.responseTab],
      ["headers", words.headersTab],
    ];
    const name = `${r.method ?? "POST"} ${r.endpoint}`;
    return html`<section class="ui-rqlg__detail" id=${`${this.uid}-detail`} aria-label=${name}>
      <div class="ui-rqlg__detail-head">
        <div class="ui-rqlg__tabs" role="tablist" aria-label=${name} @keydown=${this.onTabsKey}>
          ${tabs.map(
            ([t, label]) => html`<button type="button" class="ui-rqlg__tab" role="tab" data-tab=${t} id=${`${this.uid}-tab-${t}`} aria-selected=${t === this.tab ? "true" : "false"} aria-controls=${`${this.uid}-panel`} tabindex=${t === this.tab ? 0 : -1} @click=${() => (this.tab = t)}>${label}</button>`,
          )}
        </div>
        <span class="ui-rqlg__detail-name">${r.model} · ${r.endpoint}</span>
        <button type="button" class="tc-btn-sm ui-rqlg__curl" @click=${() => void this.copyCurl(r)}>${this.copied ? checkIcon : curlIcon}${words.copyCurl}</button>
        <button type="button" class="ui-rqlg__close" title=${words.close} @click=${() => this.close()}>${closeIcon}<span class="tc-sr-only">${words.close}</span></button>
      </div>
      <div class="ui-rqlg__panel" role="tabpanel" id=${`${this.uid}-panel`} aria-labelledby=${`${this.uid}-tab-${this.tab}`}>
        ${this.tab === "request"
          ? this.body(r.requestBody, words.requestTab)
          : this.tab === "response"
            ? this.body(r.responseBody, words.responseTab)
            : html`${this.headerList(words.requestHeaders, r.requestHeaders)}${this.headerList(words.responseHeaders, r.responseHeaders)}`}
      </div>
    </section>`;
  }

  protected override render() {
    const words = this.words;
    const list = this.visible;
    const n = list.length;
    const slowest = Math.max(0, ...list.map((r) => r.latency));
    const classCounts = new Map<string, number>();
    const modelCounts = new Map<string, number>();
    for (const r of this.requests) {
      const c = statusClass(r.status);
      classCounts.set(c, (classCounts.get(c) ?? 0) + 1);
      modelCounts.set(r.model, (modelCounts.get(r.model) ?? 0) + 1);
    }
    const models = [...modelCounts.keys()].sort();
    const errors = list.filter((r) => statusClass(r.status) !== "2xx").length;
    const sorted = list.map((r) => r.latency).sort((a, b) => a - b);
    const median = sorted.length ? (sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2) : 0;
    const cost = list.reduce((s, r) => s + (r.cost ?? 0), 0);
    const open = list.find((r) => r.id === this.selected);
    const aside = errors ? html`<span class="ui-rqlg__errors">${errors} ${words.errors}</span>` : nothing;
    const columns = [
      ["time", "time"],
      ["model", "model"],
      ["endpoint", "endpoint"],
      ["status", "status"],
      ["latency", "latency"],
      ["tokens", "tokens ui-rqlg__num"],
      ["cost", "cost ui-rqlg__num"],
      ["cache", "cache"],
    ] as const;
    return html`${this.heading ? cardHead({ icon: headIcon, title: this.heading, subtitle: this.description, id: `${this.uid}-title`, aside }) : nothing}
      <div class="ui-rqlg__card">
        <div class="ui-rqlg__filters">
          ${this.chips("classes", words.classFilter, requestStatusClasses, (c) => words[c as RequestStatusClass], classCounts)}
          ${this.chips("models", words.modelFilter, models, (m) => m, modelCounts)}
        </div>
        ${n
          ? html`<div class="ui-rqlg__grid" role="grid" aria-labelledby=${this.heading ? `${this.uid}-title` : nothing} aria-label=${this.heading ? nothing : words.requests} aria-rowcount=${n + 1} @keydown=${this.onGridKey}>
              <div class="ui-rqlg__head" role="row">${columns.map(([k, c]) => html`<span class=${`ui-rqlg__cell ui-rqlg__${c}`} role="columnheader">${words[k]}</span>`)}</div>
              <div class="ui-rqlg__scroll" role="rowgroup" style=${styleMap({ maxHeight: `${this.maxHeight}px` })}>${list.map((r) => this.row(r, slowest))}</div>
            </div>`
          : html`<p class="ui-rqlg__empty">${this.requests.length ? words.noMatches : words.empty}</p>`}
        <div class="ui-rqlg__foot">
          <span>${n === this.requests.length ? this.num(n) : `${this.num(n)} / ${this.num(this.requests.length)}`} ${this.requests.length === 1 ? words.request : words.requests}</span>
          ${errors ? html`<span aria-hidden="true">·</span><span>${errors} ${words.errors}</span>` : nothing}
          ${n ? html`<span aria-hidden="true">·</span><span>${this.ms(median)} ${words.median}</span>` : nothing}
          <span aria-hidden="true">·</span><span>${this.money(cost)}</span>
        </div>
        ${open ? this.detail(open) : nothing}
      </div>
      <span class="tc-sr-only" role="status">${this.message}</span>`;
  }

  static override css = /* css */ `
[data-ui="rqlg"] {
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
  --tc-rqlg-cols: 5.5rem minmax(7rem, 1.2fr) minmax(6rem, 1fr) 8rem 7rem 7.5rem 4.5rem 3rem;
  --tc-rqlg-cols-narrow: 5rem minmax(0, 1fr) 6.5rem 5rem;
  --tc-rqlg-bar-h: 4px;
  --tc-rqlg-icon: 14px;
}
[data-ui="rqlg"] *, [data-ui="rqlg"] *::before, [data-ui="rqlg"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rqlg"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rqlg"] .ui-rqlg__card {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rqlg"] {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
.ui-rqlg__card { overflow: hidden; }
.ui-rqlg__errors { color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-rqlg__filters { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-2); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-rqlg__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-rqlg__chip {
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
.ui-rqlg__chip:hover { background: var(--tc-fill-subtle); }
.ui-rqlg__chip[aria-pressed="true"] { border-color: var(--tc-border-selected); background: var(--tc-fill-selected); color: var(--tc-text-primary); }
.ui-rqlg__chip-count { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-rqlg__chip:focus-visible, .ui-rqlg__tab:focus-visible, .ui-rqlg__close:focus-visible, .ui-rqlg__text:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-rqlg__head, .ui-rqlg__row { display: grid; grid-template-columns: var(--tc-rqlg-cols); align-items: center; gap: var(--tc-space-2); padding: 0 var(--tc-space-3); }
.ui-rqlg__head { min-height: var(--tc-control-h-sm); border-bottom: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-rqlg__scroll { overflow: auto; overscroll-behavior: contain; }
.ui-rqlg__row { min-height: var(--tc-control-h-md); padding-top: var(--tc-space-1); padding-bottom: var(--tc-space-1); border-bottom: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-font-size-sm); cursor: pointer; }
.ui-rqlg__row:last-child { border-bottom: 0; }
.ui-rqlg__row:hover { background: var(--tc-fill-subtle); }
.ui-rqlg__row[aria-selected="true"] { background: var(--tc-fill-default); }
.ui-rqlg__row:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-rqlg__cell { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-rqlg__num { font-variant-numeric: tabular-nums; text-align: right; }
.ui-rqlg__time { color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-rqlg__provider { color: var(--tc-text-muted); }
.ui-rqlg__model-name { font-weight: var(--tc-font-weight-medium); }
.ui-rqlg__endpoint { color: var(--tc-text-secondary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); }
.ui-rqlg__method { color: var(--tc-text-muted); }
.ui-rqlg__status { font-variant-numeric: tabular-nums; }
.ui-rqlg__code { font-family: var(--tc-font-mono); font-weight: var(--tc-font-weight-medium); }
.ui-rqlg__row[data-tone="success"] .ui-rqlg__code { color: var(--tc-status-success-fg); }
.ui-rqlg__row[data-tone="warning"] .ui-rqlg__status { color: var(--tc-status-warning-fg); }
.ui-rqlg__row[data-tone="danger"] .ui-rqlg__status { color: var(--tc-status-danger-fg); }
.ui-rqlg__latency { display: grid; gap: var(--tc-space-0-5); }
.ui-rqlg__ms { color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-rqlg__track { display: block; height: var(--tc-rqlg-bar-h); overflow: hidden; border-radius: var(--tc-radius-xs); background: var(--tc-fill-subtle); }
.ui-rqlg__bar { display: block; height: 100%; border-radius: var(--tc-radius-xs); background: var(--tc-accent-solid); }
.ui-rqlg__row[data-tone="danger"] .ui-rqlg__bar { background: var(--tc-status-danger-solid); }
.ui-rqlg__row[data-tone="warning"] .ui-rqlg__bar { background: var(--tc-status-warning-solid); }
.ui-rqlg__tokens, .ui-rqlg__cost { color: var(--tc-text-secondary); }
.ui-rqlg__cache { color: var(--tc-text-muted); }
.ui-rqlg__cache[data-hit="true"] { color: var(--tc-status-success-fg); }
.ui-rqlg__empty { margin: 0; padding: var(--tc-space-6) var(--tc-space-3); color: var(--tc-text-muted); text-align: center; }
.ui-rqlg__foot { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); padding: var(--tc-space-1-5) var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-rqlg__detail { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rqlg__detail-head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-1-5) var(--tc-space-2); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-rqlg__tabs { display: flex; flex: none; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-rqlg__tab {
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
.ui-rqlg__tab[aria-selected="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
.ui-rqlg__detail-name { flex: 1; min-width: 0; overflow: hidden; color: var(--tc-text-secondary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); text-overflow: ellipsis; white-space: nowrap; }
[data-ui="rqlg"] .ui-rqlg__detail-head svg { width: var(--tc-rqlg-icon); height: var(--tc-rqlg-icon); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-rqlg__close {
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
.ui-rqlg__close:hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-rqlg__panel { padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-3); }
.ui-rqlg__group + .ui-rqlg__group { margin-top: var(--tc-space-3); }
.ui-rqlg__group-title { margin: 0 0 var(--tc-space-1); color: var(--tc-text-strong); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); }
.ui-rqlg__pairs { display: grid; gap: var(--tc-space-0-5); margin: 0; font-size: var(--tc-font-size-sm); }
.ui-rqlg__pair { display: grid; grid-template-columns: minmax(8rem, 30%) minmax(0, 1fr); gap: var(--tc-space-2); }
.ui-rqlg__pair dt { color: var(--tc-text-secondary); font-family: var(--tc-font-mono); overflow-wrap: anywhere; }
.ui-rqlg__pair dd { margin: 0; font-family: var(--tc-font-mono); overflow-wrap: anywhere; }
.ui-rqlg__pair dd[data-redacted="true"] { color: var(--tc-text-muted); font-style: italic; }
.ui-rqlg__none { margin: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-rqlg__text { max-height: 280px; margin: 0; padding: var(--tc-space-2); overflow: auto; border-radius: var(--tc-radius-sm); background: var(--tc-fill-subtle); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); white-space: pre-wrap; overflow-wrap: anywhere; }
/* The JSON Viewer sits inside this card: no second card around it */
.ui-rqlg__detail .ui-rqlg__json[data-ui="jsv"] { --tc-jsv-body-h: 300px; border-radius: 0; background: none; box-shadow: none; }
@container (max-width: 560px) {
  .ui-rqlg__head, .ui-rqlg__row { grid-template-columns: var(--tc-rqlg-cols-narrow); }
  .ui-rqlg__endpoint, .ui-rqlg__tokens, .ui-rqlg__cache, .ui-rqlg__cost { display: none; }
  .ui-rqlg__pair { grid-template-columns: minmax(0, 1fr); gap: 0; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="rqlg"] *, [data-ui="rqlg"] *::before, [data-ui="rqlg"] *::after { transition: none !important; }
}
@media (forced-colors: active) {
  .ui-rqlg__bar { background: CanvasText; }
  .ui-rqlg__chip[aria-pressed="true"] { border-color: Highlight; }
}
`;
}

if (!customElements.get("tc-request-log")) customElements.define("tc-request-log", TcRequestLog);
declare global {
  interface HTMLElementTagNameMap {
    "tc-request-log": TcRequestLog;
  }
}
