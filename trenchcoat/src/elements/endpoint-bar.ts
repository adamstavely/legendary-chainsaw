import { html, nothing, svg } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { hushTip, unhushTip } from "./internal/trigger-tip";
import { copyText, pick } from "./internal/util";

/*
 * <tc-endpoint-bar> – one API endpoint on one line, the way a reference page heads it: the method as a badge in its
 * colour and its word, the base URL (a small select when there are several environments), the path with each {param}
 * picked out, Copy URL and Try it. Deprecated and Beta show as badges in words.
 *   · each {param} is a button described by its tooltip (shown on hover and focus, read as its description); Escape
 *     hides it
 *   · the environment is the page's to own: tc-environment-change ({ environment }) is cancelable
 *   · Try it fires a cancelable tc-try with the method and the full URL; Copy URL fires a cancelable tc-copy first
 *   · narrow: the path wraps under the method, and the actions take their own line
 *
 *   <tc-endpoint-bar method="GET" path="/v1/records/{record_id}" .params=${[{ name: "record_id",
 *     description: "The record's ID, e.g. rec_8f2a" }]} .environments=${[{ id: "prod", label: "Production",
 *     baseUrl: "https://records.example.org" }]}></tc-endpoint-bar>
 */

export type EndpointMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type EndpointParam = {
  /** The name inside the braces, e.g. "record_id" */
  name: string;
  /** What it is, for the tooltip */
  description?: string;
  /** Its type, e.g. "string" */
  type?: string;
};
export type EndpointEnvironment = {
  id: string;
  /** What the select shows, e.g. "Production" */
  label: string;
  /** e.g. "https://records.example.org" */
  baseUrl: string;
};

/** Details of the events */
export type EndpointEnvironmentChange = { environment: string };
export type EndpointTry = { method: EndpointMethod; url: string; environment: string | null };
export type EndpointCopy = { text: string };

/** The words the element uses; the page can rename any of them */
export type EndpointBarLabels = {
  environment: string;
  copy: string;
  copied: string;
  tryIt: string;
  deprecated: string;
  beta: string;
  param: string;
};
export const defaultEndpointBarLabels: EndpointBarLabels = {
  environment: "Environment",
  copy: "Copy URL",
  copied: "Copied",
  tryIt: "Try it",
  deprecated: "Deprecated",
  beta: "Beta",
  param: "Path parameter",
};

const TONE: Record<EndpointMethod, "success" | "info" | "warning" | "danger"> = { GET: "success", POST: "info", PUT: "warning", PATCH: "warning", DELETE: "danger" };

/** The path cut into text and {param} parts */
export function endpointPathParts(path: string) {
  const parts: { text: string; param?: string }[] = [];
  const re = /\{([^{}]+)\}/g;
  let at = 0;
  for (let m = re.exec(path); m; m = re.exec(path)) {
    if (m.index > at) parts.push({ text: path.slice(at, m.index) });
    parts.push({ text: m[0], param: m[1] });
    at = m.index + m[0].length;
  }
  if (at < path.length) parts.push({ text: path.slice(at) });
  return parts;
}

/* Copy, check, play and triangle-alert: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const copyIcon = () => lucide(14, svg`<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`);
const checkIcon = () => lucide(14, svg`<path d="M20 6 9 17l-5-5"></path>`);
const playIcon = () => lucide(14, svg`<polygon points="6 3 20 12 6 21 6 3"></polygon>`);
const alertIcon = () => lucide(11, svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>`);
const flaskIcon = () => lucide(11, svg`<path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"></path><path d="M8.5 2h7"></path><path d="M7 16h10"></path>`);

let uidCount = 0;

/**
 * One API endpoint on one line – the method badge, the base URL or an environment select, the path with its
 * {params} picked out and described, Copy URL and Try it, with Deprecated and Beta badges.
 * @tag tc-endpoint-bar
 * @fires tc-environment-change - An environment was picked ({ environment }: EndpointEnvironmentChange); cancelable – prevented, `environment` stays as it was
 * @fires tc-copy - Copy URL was pressed ({ text }: EndpointCopy); cancelable – prevented, nothing is copied
 * @fires tc-try - Try it was pressed ({ method, url, environment }: EndpointTry); cancelable
 */
export class TcEndpointBar extends TcElement {
  static override ui = "epb";

  /** The HTTP method */
  @property() accessor method: EndpointMethod = "GET";
  /** The path, with parameters in braces, e.g. "/v1/records/{record_id}" */
  @property() accessor path = "/";
  /** The path parameters' descriptions, by name */
  @property({ attribute: false }) accessor params: EndpointParam[] = [];
  /** The environments to pick between; with one or none, the base URL is plain text */
  @property({ attribute: false }) accessor environments: EndpointEnvironment[] = [];
  /** The picked environment's id; by default the first. Changed by the select unless a tc-environment-change listener calls preventDefault() */
  @property() accessor environment = "";
  /** The base URL when there are no environments */
  @property({ attribute: "base-url" }) accessor baseUrl = "";
  /** A short summary after the path, e.g. "Get a record" */
  @property() accessor summary = "";
  /** Marks the endpoint deprecated */
  @property({ type: Boolean, reflect: true }) accessor deprecated = false;
  /** Marks the endpoint beta */
  @property({ type: Boolean, reflect: true }) accessor beta = false;
  /** Hides Try it */
  @property({ type: Boolean, attribute: "hide-try" }) accessor hideTry = false;
  /** The element's words, merged over defaultEndpointBarLabels */
  @property({ attribute: false }) accessor labels: Partial<EndpointBarLabels> = {};

  @state() private accessor copied = false;
  @state() private accessor announce = "";

  private uid = `tc-epb-${++uidCount}`;
  private copiedTimer: number | undefined;

  private get words(): EndpointBarLabels {
    return { ...defaultEndpointBarLabels, ...this.labels };
  }
  /** The environment in use, or null without environments */
  get current(): EndpointEnvironment | null {
    return this.environments.find((e) => e.id === this.environment) ?? this.environments[0] ?? null;
  }
  /** The full URL: the base and the path, parameters left in braces */
  get url() {
    const base = (this.current?.baseUrl ?? this.baseUrl).replace(/\/+$/, "");
    return `${base}${this.path.startsWith("/") ? "" : "/"}${this.path}`;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.copiedTimer);
  }

  private setEnvironment(id: string, select: HTMLSelectElement) {
    if (id === this.current?.id) return;
    if (!this.emit<EndpointEnvironmentChange>("tc-environment-change", { environment: id }, { cancelable: true })) {
      select.value = this.current?.id ?? "";
      return;
    }
    this.environment = id;
  }
  private async copy() {
    const text = this.url;
    if (!this.emit<EndpointCopy>("tc-copy", { text }, { cancelable: true })) return;
    if (!(await copyText(text))) return;
    this.copied = true;
    this.announce = `${this.words.copied}: ${text}`;
    clearTimeout(this.copiedTimer);
    this.copiedTimer = window.setTimeout(() => (this.copied = false), 2000);
  }
  private tryIt() {
    this.emit<EndpointTry>("tc-try", { method: this.method, url: this.url, environment: this.current?.id ?? null }, { cancelable: true });
  }

  private renderBase() {
    const w = this.words;
    const envs = this.environments;
    if (envs.length > 1) {
      const id = `${this.uid}-env`;
      return html`<span class="ui-epb__env">
        <label class="tc-sr-only" for=${id}>${w.environment}</label>
        <select id=${id} class="ui-epb__env-select" .value=${this.current?.id ?? ""} @change=${(e: Event) => this.setEnvironment((e.target as HTMLSelectElement).value, e.target as HTMLSelectElement)}>
          ${envs.map((e) => html`<option value=${e.id} ?selected=${e.id === this.current?.id}>${e.label}</option>`)}
        </select>
        <span class="ui-epb__base">${this.current?.baseUrl.replace(/\/+$/, "")}</span>
      </span>`;
    }
    const base = (this.current?.baseUrl ?? this.baseUrl).replace(/\/+$/, "");
    return base ? html`<span class="ui-epb__base">${base}</span>` : nothing;
  }

  private renderPath() {
    const w = this.words;
    return html`<code class="ui-epb__path">${endpointPathParts(this.path).map((part, i) => {
      if (!part.param) return html`<span class="ui-epb__seg">${part.text}</span>`;
      const info = this.params.find((p) => p.name === part.param);
      const tip = `${this.uid}-tip-${i}`;
      return html`<button
        type="button"
        class="ui-epb__param"
        data-param=${part.param}
        aria-describedby=${tip}
        @keydown=${hushTip}
        @pointerenter=${unhushTip}
        @focus=${unhushTip}
        ><span class="tc-sr-only">${w.param} </span>${part.text}<span class="ui-epb__tip" aria-hidden="true" id=${tip}
          ><span class="ui-epb__tip-name">${part.param}${info?.type ? html` <span class="ui-epb__tip-type">${info.type}</span>` : nothing}</span
          >${info?.description ? html`<span>${info.description}</span>` : nothing}</span
        ></button
      >`;
    })}</code>`;
  }

  protected override render() {
    const w = this.words;
    const tone = pick(TONE, this.method, "GET");
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      <div class="ui-epb__bar">
        <div class="ui-epb__line">
          <span class="ui-epb__method" data-tone=${tone}>${this.method}</span>
          <span class="ui-epb__address">${this.renderBase()}${this.renderPath()}</span>
          ${this.deprecated ? html`<span class="ui-epb__badge" data-tone="warning">${alertIcon()}${w.deprecated}</span>` : nothing}
          ${this.beta ? html`<span class="ui-epb__badge" data-tone="info">${flaskIcon()}${w.beta}</span>` : nothing}
          ${this.summary ? html`<span class="ui-epb__summary">${this.summary}</span>` : nothing}
        </div>
        <div class="ui-epb__actions">
          <button type="button" class="tc-btn-sm ui-epb__copy" @click=${() => void this.copy()}>${this.copied ? checkIcon() : copyIcon()}<span>${this.copied ? w.copied : w.copy}</span></button>
          ${this.hideTry ? nothing : html`<button type="button" class="ui-epb__try" @click=${() => this.tryIt()}>${playIcon()}<span>${w.tryIt}</span></button>`}
        </div>
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray around the bar */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="epb"] {
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="epb"] {
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 100%;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="epb"] *, [data-ui="epb"] *::before, [data-ui="epb"] *::after { box-sizing: border-box; }
[data-ui="epb"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="epb"] svg[stroke-width] { stroke-width: 1.6; }
:where([data-look="standard"], [data-look="standard"] *).ui-epb__bar { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-epb__bar { display: flex; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-3); }
/* Tones */
[data-ui="epb"] [data-tone="success"] { --tc-epb-tone: var(--tc-status-success-fg); --tc-epb-tone-bg: var(--tc-status-success-bg); }
[data-ui="epb"] [data-tone="info"] { --tc-epb-tone: var(--tc-status-info-fg); --tc-epb-tone-bg: var(--tc-status-info-bg); }
[data-ui="epb"] [data-tone="warning"] { --tc-epb-tone: var(--tc-status-warning-fg); --tc-epb-tone-bg: var(--tc-status-warning-bg); }
[data-ui="epb"] [data-tone="danger"] { --tc-epb-tone: var(--tc-status-danger-fg); --tc-epb-tone-bg: var(--tc-status-danger-bg); }
.ui-epb__line { display: flex; flex: 1 1 auto; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5) var(--tc-space-2); min-width: 0; }
.ui-epb__method { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-radius-sm); background: var(--tc-epb-tone-bg); color: var(--tc-epb-tone); font-family: var(--tc-font-mono); font-size: var(--tc-pill-font-size); font-weight: var(--tc-font-weight-semibold); letter-spacing: var(--tc-tracking-caps); }
.ui-epb__address { display: inline-flex; flex: 0 1 auto; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1); min-width: 0; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); }
.ui-epb__env { display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-epb__env-select { height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1-5); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-secondary); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-xs); cursor: pointer; }
.ui-epb__env-select:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-epb__env-select:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-epb__base { color: var(--tc-text-muted); overflow-wrap: anywhere; }
.ui-epb__path { color: var(--tc-text-primary); font: inherit; overflow-wrap: anywhere; }
.ui-epb__param { position: relative; display: inline; margin: 0; padding: 0 var(--tc-space-0-5); border: 0; border-radius: var(--tc-radius-xs); background: var(--tc-accent-subtle); color: var(--tc-accent-text); font: inherit; cursor: help; }
.ui-epb__param:hover { background: var(--tc-accent-highlight); }
.ui-epb__param:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* The tooltip: under the parameter on hover (after a beat) and focus; Escape hides it */
.ui-epb__tip { position: absolute; top: calc(100% + var(--tc-space-1)); left: 0; z-index: 2; display: grid; gap: var(--tc-space-0-5); width: max-content; max-width: 260px; padding: var(--tc-tooltip-py) var(--tc-tooltip-px); border-radius: var(--tc-tooltip-radius); background: var(--tc-tooltip-bg); color: var(--tc-tooltip-fg); font-family: var(--tc-font-sans); font-size: var(--tc-tooltip-font-size); line-height: var(--tc-line-height-snug); text-align: left; white-space: normal; pointer-events: none; opacity: 0; visibility: hidden; transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), visibility var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-epb__tip-name { font-family: var(--tc-font-mono); }
.ui-epb__tip-type { font-family: var(--tc-font-sans); }
.ui-epb__param:hover:not([data-hush]) .ui-epb__tip { opacity: 1; visibility: visible; transition-delay: var(--tc-duration-moderate); }
.ui-epb__param:focus-visible:not([data-hush]) .ui-epb__tip { opacity: 1; visibility: visible; }
.ui-epb__badge { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-epb-tone-bg); color: var(--tc-epb-tone); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); white-space: nowrap; }
.ui-epb__summary { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-epb__actions { display: flex; flex: none; align-items: center; gap: var(--tc-space-1-5); margin-left: auto; }
.ui-epb__try { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); font: inherit; font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; cursor: pointer; }
.ui-epb__try:hover { background: var(--tc-action-primary-bg-hover); }
.ui-epb__try:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
@container (max-width: 520px) {
  .ui-epb__bar { flex-wrap: wrap; }
  .ui-epb__actions { flex: 1 1 100%; justify-content: flex-end; }
}
@media (forced-colors: active) {
  .ui-epb__method, .ui-epb__badge { border: 1px solid CanvasText; }
  .ui-epb__param { border: 1px solid CanvasText; }
  .ui-epb__try { border: 1px solid ButtonText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="epb"] *, [data-ui="epb"] *::before, [data-ui="epb"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-endpoint-bar")) customElements.define("tc-endpoint-bar", TcEndpointBar);

declare global {
  interface HTMLElementTagNameMap {
    "tc-endpoint-bar": TcEndpointBar;
  }
}
