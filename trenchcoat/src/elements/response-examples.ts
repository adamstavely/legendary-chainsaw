import { html, nothing, svg } from "lit";
import { property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import "./code-block";

/*
 * <tc-response-examples> – an endpoint's example responses for a reference page, one tab per status: "200 OK",
 * "404 Not found", "429 Too many requests". Each tab's status class shows as a mark, a colour and a word (Success,
 * Redirect, Client error, Server error), so colour is never the only cue. A tab holds what the response means, its
 * headers (folded; a disclosure opens them) and its body, pretty-printed with syntax colours and Copy in a
 * tc-code-block. When a status has bodies in several media types (application/json, text/csv) a select picks one.
 *   · the tabs follow the WAI-ARIA tabs pattern with automatic activation: ← / → move and show, Home / End go to the
 *     ends; narrow, the tab row scrolls
 *   · `status` is the tab showing (tc-status-change) and `mediaType` the body's type (tc-media-type-change)
 *   · a body may be text or any JSON value; JSON is pretty-printed
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-response-examples heading="GET /records/{id}" .examples=${[{ status: 200, body: record }, { status: 404 }]}></tc-response-examples>
 */

/** One body of a response, in one media type */
export type ResponseExampleBody = { mediaType: string; body: unknown };
/** One status's example response */
export type ResponseExample = {
  status: number | string;
  /** The tab's words after the code; the standard reason phrase when left out */
  label?: string;
  /** What the response means, in a sentence or two */
  description?: string;
  headers?: Record<string, string>;
  /** The body, for a single media type */
  body?: unknown;
  /** The body's media type; application/json when left out */
  mediaType?: string;
  /** Bodies in several media types; wins over `body` */
  bodies?: ResponseExampleBody[];
};
/** What kind of status a code is */
export type ResponseStatusClass = "info" | "success" | "redirect" | "client" | "server";
export type ResponseExamplesLabels = Record<ResponseStatusClass, string> & { headers: string; mediaType: string; noBody: string; empty: string };

/** Details of the events */
export type ResponseExamplesStatusChange = { status: string; example: ResponseExample };
export type ResponseExamplesMediaTypeChange = { mediaType: string; status: string };

/** The words used when the page gives none */
export const defaultResponseExamplesLabels: ResponseExamplesLabels = {
  info: "Information",
  success: "Success",
  redirect: "Redirect",
  client: "Client error",
  server: "Server error",
  headers: "Headers",
  mediaType: "Media type",
  noBody: "No body",
  empty: "No example responses",
};

const REASONS: Record<number, string> = {
  100: "Continue",
  200: "OK",
  201: "Created",
  202: "Accepted",
  204: "No content",
  301: "Moved permanently",
  302: "Found",
  304: "Not modified",
  400: "Bad request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not found",
  405: "Method not allowed",
  409: "Conflict",
  410: "Gone",
  412: "Precondition failed",
  415: "Unsupported media type",
  422: "Unprocessable content",
  429: "Too many requests",
  500: "Internal server error",
  502: "Bad gateway",
  503: "Service unavailable",
  504: "Gateway timeout",
};

/** The status's class from its first digit: 2xx success, 4xx client error… */
export function responseStatusClass(status: number | string): ResponseStatusClass {
  const n = Number(String(status).trim().charAt(0));
  return n === 1 ? "info" : n === 2 ? "success" : n === 3 ? "redirect" : n === 4 ? "client" : "server";
}
/** The standard reason phrase for a code, or "" */
export const responseReason = (status: number | string) => REASONS[Number(status)] ?? "";

/** The bodies of an example, in order */
export function responseBodies(ex: ResponseExample): ResponseExampleBody[] {
  if (ex.bodies?.length) return ex.bodies;
  return ex.body === undefined ? [] : [{ mediaType: ex.mediaType ?? "application/json", body: ex.body }];
}

/** A body as text: JSON values and JSON text pretty-printed, other text as it is */
export function responseBodyText(body: ResponseExampleBody): string {
  if (typeof body.body !== "string") return JSON.stringify(body.body, null, 2) ?? "";
  if (/json/i.test(body.mediaType)) {
    try {
      return JSON.stringify(JSON.parse(body.body), null, 2);
    } catch {
      return body.body;
    }
  }
  return body.body;
}

const languageOf = (mediaType: string) => (/json/i.test(mediaType) ? "json" : /(xml|html)/i.test(mediaType) ? "html" : /javascript/i.test(mediaType) ? "js" : "plain");

/* file-json, check, arrow-right, triangle-alert, octagon-x, info, chevron-right: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const headIcon = svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1"></path><path d="M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1"></path>`;
const MARK: Record<ResponseStatusClass, ReturnType<typeof svg>> = {
  info: svg`<circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path>`,
  success: svg`<path d="M20 6 9 17l-5-5"></path>`,
  redirect: svg`<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>`,
  client: svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>`,
  server: svg`<path d="M2.586 16.726A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2h6.624a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586z"></path><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path>`,
};
const chevron = () => lucide(14, svg`<path d="m9 18 6-6-6-6"></path>`);

let uidCount = 0;

/**
 * An endpoint's example responses, one tab per status, each with its meaning, headers and a pretty-printed body to copy.
 * @tag tc-response-examples
 * @fires tc-status-change - Another status's tab was chosen ({ status, example }: ResponseExamplesStatusChange); cancelable – prevented, `status` stays as it was
 * @fires tc-media-type-change - Another media type was chosen for the body ({ mediaType, status }: ResponseExamplesMediaTypeChange); cancelable – prevented, `mediaType` stays as it was
 */
export class TcResponseExamples extends TcElement {
  static override ui = "rex";

  /** The heading – often the endpoint, "GET /records/{id}" */
  @property() accessor heading = "Responses";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The example responses, one tab each, in the order given */
  @property({ attribute: false }) accessor examples: ResponseExample[] = [];
  /** The tab showing, by its status ("200"); the first when empty or unknown. Changed by the tabs unless a tc-status-change listener calls preventDefault() */
  @property() accessor status = "";
  /** The body's media type; the status's first when empty or not among its bodies. Changed by the select unless a tc-media-type-change listener calls preventDefault() */
  @property({ attribute: "media-type" }) accessor mediaType = "";
  /** Shows the headers open */
  @property({ type: Boolean, attribute: "headers-open" }) accessor headersOpen = false;
  /** The tallest the body gets before it scrolls, in px; 0 for no limit */
  @property({ type: Number, attribute: "max-height" }) accessor maxHeight = 360;
  /** Rename any of the words, over the defaults */
  @property({ attribute: false }) accessor labels: Partial<ResponseExamplesLabels> = {};

  private uid = `tc-rex-${++uidCount}`;

  private word<K extends keyof ResponseExamplesLabels>(key: K) {
    return this.labels[key] ?? defaultResponseExamplesLabels[key];
  }

  /** The index of the tab showing */
  private get current() {
    const i = this.examples.findIndex((e) => String(e.status) === this.status);
    return i >= 0 ? i : 0;
  }

  private pick(i: number, focus = false) {
    const ex = this.examples[i];
    if (!ex) return;
    if (i !== this.current) {
      const status = String(ex.status);
      if (!this.emit<ResponseExamplesStatusChange>("tc-status-change", { status, example: ex }, { cancelable: true })) return;
      this.status = status;
    }
    if (focus) void this.updateComplete.then(() => this.querySelector<HTMLElement>(`#${CSS.escape(`${this.uid}-tab-${i}`)}`)?.focus());
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.altKey || e.metaKey || e.ctrlKey) return;
    const n = this.examples.length;
    const at = this.current;
    const to = e.key === "ArrowRight" ? (at + 1) % n : e.key === "ArrowLeft" ? (at - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    this.pick(to, true);
  };

  private onMedia(e: Event, status: string, shown: string) {
    const select = e.target as HTMLSelectElement;
    const mediaType = select.value;
    if (!this.emit<ResponseExamplesMediaTypeChange>("tc-media-type-change", { mediaType, status }, { cancelable: true })) {
      select.value = shown;
      return;
    }
    this.mediaType = mediaType;
  }

  private label(ex: ResponseExample) {
    return ex.label ?? responseReason(ex.status);
  }

  private renderPanel(ex: ResponseExample, i: number) {
    const status = String(ex.status);
    const bodies = responseBodies(ex);
    const body = bodies.find((b) => b.mediaType === this.mediaType) ?? bodies[0];
    const headers = Object.entries(ex.headers ?? {});
    const headersId = `${this.uid}-headers`;
    const mediaId = `${this.uid}-media`;
    return html`<div class="ui-rex__panel" role="tabpanel" id=${`${this.uid}-panel-${i}`} aria-labelledby=${`${this.uid}-tab-${i}`}>
      ${ex.description ? html`<p class="ui-rex__desc">${ex.description}</p>` : nothing}
      ${headers.length || bodies.length > 1
        ? html`<div class="ui-rex__bar">
            ${headers.length
              ? html`<button type="button" class="ui-rex__headers-toggle" aria-expanded=${this.headersOpen ? "true" : "false"} aria-controls=${headersId} @click=${() => (this.headersOpen = !this.headersOpen)}>
                  <span class="ui-rex__chev" aria-hidden="true">${chevron()}</span>${this.word("headers")}<span class="ui-rex__count">${headers.length}</span>
                </button>`
              : nothing}
            ${bodies.length > 1
              ? html`<span class="ui-rex__media">
                  <label for=${mediaId}>${this.word("mediaType")}</label>
                  <select id=${mediaId} class="ui-rex__select" .value=${body.mediaType} @change=${(e: Event) => this.onMedia(e, status, body.mediaType)}>
                    ${bodies.map((b) => html`<option value=${b.mediaType} ?selected=${b === body}>${b.mediaType}</option>`)}
                  </select>
                </span>`
              : nothing}
          </div>`
        : nothing}
      ${headers.length
        ? html`<dl class="ui-rex__headers" id=${headersId} ?hidden=${!this.headersOpen}>
            ${headers.map(([k, v]) => html`<div class="ui-rex__header"><dt>${k}</dt><dd>${v}</dd></div>`)}
          </dl>`
        : nothing}
      ${body
        ? html`<tc-code-block class="ui-rex__body" bare .code=${responseBodyText(body)} language=${languageOf(body.mediaType)} filename=${body.mediaType} max-height=${ifDefined(this.maxHeight || undefined)}></tc-code-block>`
        : html`<p class="ui-rex__nobody">${this.word("noBody")}</p>`}
    </div>`;
  }

  protected override render() {
    const examples = this.examples;
    const title = `${this.uid}-title`;
    const current = this.current;
    const head = this.heading ? cardHead({ icon: headIcon, title: this.heading, subtitle: this.description, id: title }) : nothing;
    if (!examples.length) return html`${head}<div class="ui-rex__card"><p class="ui-rex__nobody">${this.word("empty")}</p></div>`;
    return html`${head}
      <div class="ui-rex__card">
        <div class="ui-rex__tabs" role="tablist" aria-labelledby=${ifDefined(this.heading ? title : undefined)} aria-label=${ifDefined(this.heading ? undefined : "Responses")} @keydown=${this.onKey}>
          ${examples.map((ex, i) => {
            const cls = responseStatusClass(ex.status);
            const selected = i === current;
            return html`<button type="button" role="tab" class="ui-rex__tab" id=${`${this.uid}-tab-${i}`} data-class=${cls} data-status=${String(ex.status)}
              aria-selected=${selected ? "true" : "false"} aria-controls=${`${this.uid}-panel-${i}`} tabindex=${selected ? 0 : -1} @click=${() => this.pick(i)}>
              <span class="ui-rex__mark" aria-hidden="true">${lucide(14, MARK[cls])}</span>
              <span class="ui-rex__code">${String(ex.status)}</span>
              <span class="ui-rex__reason">${this.label(ex)}</span>
              <span class="tc-sr-only">, ${this.word(cls)}</span>
            </button>`;
          })}
        </div>
        ${this.renderPanel(examples[current], current)}
      </div>`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="rex"] {
  position: relative;
  display: block;
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rex"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="rex"] { --tc-rex-indicator: 2px; }
[data-ui="rex"] *, [data-ui="rex"] *::before, [data-ui="rex"] *::after { box-sizing: border-box; }
:where([data-ui="rex"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="rex"] svg { display: block; flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-rex__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-rex__tabs { display: flex; gap: var(--tc-space-1); padding: var(--tc-space-2) var(--tc-space-3) 0; overflow-x: auto; border-bottom: var(--tc-hairline) solid var(--tc-divider); scrollbar-width: thin; }
.ui-rex__tab { position: relative; flex: none; display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-height: var(--tc-control-h-sm); padding: var(--tc-space-1-5) var(--tc-space-2-5); border-radius: var(--tc-radius-md) var(--tc-radius-md) 0 0; color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); white-space: nowrap; }
.ui-rex__tab:hover { background: var(--tc-fill-hover); }
.ui-rex__tab:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-rex__tab[aria-selected="true"] { color: var(--tc-text-primary); }
.ui-rex__tab[aria-selected="true"]::after { content: ""; position: absolute; left: var(--tc-space-2); right: var(--tc-space-2); bottom: calc(var(--tc-hairline) * -1); border-bottom: var(--tc-rex-indicator) solid currentColor; }
.ui-rex__code { font-family: var(--tc-font-mono); font-weight: var(--tc-font-weight-semibold); font-variant-numeric: tabular-nums; }
/* The class shows as a mark and a colour on the code, with the word for screen readers */
.ui-rex__tab[data-class="success"] :is(.ui-rex__mark, .ui-rex__code) { color: var(--tc-status-success-fg); }
.ui-rex__tab[data-class="redirect"] :is(.ui-rex__mark, .ui-rex__code), .ui-rex__tab[data-class="info"] :is(.ui-rex__mark, .ui-rex__code) { color: var(--tc-status-info-fg); }
.ui-rex__tab[data-class="client"] :is(.ui-rex__mark, .ui-rex__code) { color: var(--tc-status-warning-fg); }
.ui-rex__tab[data-class="server"] :is(.ui-rex__mark, .ui-rex__code) { color: var(--tc-status-danger-fg); }
.ui-rex__panel { display: grid; gap: var(--tc-space-2); padding-top: var(--tc-space-3); }
.ui-rex__desc { margin: 0; padding: 0 var(--tc-space-4); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); }
.ui-rex__bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2); padding: 0 var(--tc-space-4); }
.ui-rex__headers-toggle { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1-5); margin-left: calc(var(--tc-space-1-5) * -1); border-radius: var(--tc-radius-sm); color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); }
.ui-rex__headers-toggle:hover { background: var(--tc-fill-hover); }
.ui-rex__headers-toggle:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-rex__chev { color: var(--tc-text-muted); transition: transform var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rex__headers-toggle[aria-expanded="true"] .ui-rex__chev { transform: rotate(90deg); }
.ui-rex__count { padding: 0 var(--tc-space-1-5); border-radius: var(--tc-radius-full); background: var(--tc-fill-subtle); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-rex__media { display: inline-flex; align-items: center; gap: var(--tc-space-2); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); }
.ui-rex__select { height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border: var(--tc-hairline) solid var(--tc-border-default); border-radius: var(--tc-control-radius-sm); background: var(--tc-surface-raised); color: var(--tc-text-primary); font: inherit; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); }
.ui-rex__select:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-rex__headers { display: grid; gap: var(--tc-space-1); margin: 0; padding: var(--tc-space-2) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); border-bottom: var(--tc-hairline) solid var(--tc-divider); background: var(--tc-fill-subtle); }
.ui-rex__headers[hidden] { display: none; }
.ui-rex__header { display: flex; flex-wrap: wrap; gap: var(--tc-space-1) var(--tc-space-2); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); }
.ui-rex__header dt { color: var(--tc-text-secondary); }
.ui-rex__header dt::after { content: ":"; }
.ui-rex__header dd { margin: 0; color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-rex__body { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rex__nobody { margin: 0; padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
@media (prefers-reduced-motion: reduce) { .ui-rex__chev { transition: none; } }
@media (forced-colors: active) { .ui-rex__mark { color: CanvasText; } .ui-rex__tab[aria-selected="true"]::after { border-color: Highlight; } }
`;
}

if (!customElements.get("tc-response-examples")) customElements.define("tc-response-examples", TcResponseExamples);
declare global {
  interface HTMLElementTagNameMap {
    "tc-response-examples": TcResponseExamples;
  }
}
