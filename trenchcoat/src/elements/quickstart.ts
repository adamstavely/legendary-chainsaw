import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { copyText } from "./internal/util";

/*
 * <tc-quickstart> – a first API request with the key already filled in. Language tabs (cURL, Python, TypeScript, Go)
 * switch four numbered steps: Install, Set your key, Send a request and See the response. The key goes into an
 * environment variable in step 2, shown masked until Reveal is pressed; Copy always copies the real key, and says so
 * in a warning. The request in step 3 reads the variable, so the key never sits in code. Run it fires tc-run and
 * shows the response the page passes back.
 *   · the tabs are one tab stop: ← / → move, Home / End go to the ends, and the panel follows
 *   · the language is the page's to own: tc-language-change ({ language }) is cancelable, and with `storage-key` the
 *     choice is remembered in localStorage (read and written inside try/catch)
 *   · the snippets are plain HTTP against `base-url` and `endpoint` – no SDK
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-quickstart base-url="https://api.example.com" .endpoint=${{ method: "POST", path: "/v1/records/search",
 *     body: { query: "travel policy" } }} api-key="sk-test-…"></tc-quickstart>
 */

export type QuickstartLanguage = "curl" | "python" | "typescript" | "go";
export type QuickstartMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type QuickstartEndpoint = {
  method: QuickstartMethod;
  /** The path after the base URL, e.g. "/v1/records/search" */
  path: string;
  /** A JSON body, sent with POST, PUT and PATCH */
  body?: Record<string, unknown>;
};
export type QuickstartStep = "install" | "key" | "request" | "response";

/** Details of the events */
export type QuickstartLanguageChange = { language: QuickstartLanguage };
export type QuickstartRun = { language: QuickstartLanguage; method: QuickstartMethod; url: string; body?: Record<string, unknown> };
export type QuickstartCopy = { step: QuickstartStep; text: string; containsKey: boolean };

/** The words the element uses; the page can rename any of them */
export type QuickstartLabels = {
  languages: Record<QuickstartLanguage, string>;
  steps: Record<QuickstartStep, string>;
  install: Record<QuickstartLanguage, string>;
  reveal: string;
  hide: string;
  copy: string;
  copied: string;
  copiedKey: string;
  run: string;
  running: string;
  responseEmpty: string;
  responseReceived: string;
  noKey: string;
};
/** Labels the page passes: any of them, and any of the nested ones */
export type QuickstartLabelsInput = Partial<Omit<QuickstartLabels, "languages" | "steps" | "install">> & {
  languages?: Partial<Record<QuickstartLanguage, string>>;
  steps?: Partial<Record<QuickstartStep, string>>;
  install?: Partial<Record<QuickstartLanguage, string>>;
};
export const defaultQuickstartLabels: QuickstartLabels = {
  languages: { curl: "cURL", python: "Python", typescript: "TypeScript", go: "Go" },
  steps: { install: "Install", key: "Set your key", request: "Send a request", response: "See the response" },
  install: {
    curl: "cURL comes with macOS, Linux and Windows 10 and later. Check it's there:",
    python: "Install the requests library:",
    typescript: "Node 18 and later have fetch built in, so there's nothing to install. Check your version:",
    go: "Go's standard library is all you need. Start a module:",
  },
  reveal: "Reveal key",
  hide: "Hide key",
  copy: "Copy",
  copied: "Copied",
  copiedKey: "Copied – this includes your API key. Keep it out of shared files, chats and screenshots.",
  run: "Run it",
  running: "Sending…",
  responseEmpty: "Run the request to see its response here.",
  responseReceived: "Response received",
  noKey: "YOUR_API_KEY",
};

export const QUICKSTART_LANGUAGES: QuickstartLanguage[] = ["curl", "python", "typescript", "go"];
const STEPS: QuickstartStep[] = ["install", "key", "request", "response"];
const HAS_BODY = new Set<QuickstartMethod>(["POST", "PUT", "PATCH"]);

/** The key with its middle masked: "sk-test-••••••••4f2a" */
export function maskKey(key: string) {
  if (!key) return "";
  if (key.length <= 12) return "•".repeat(key.length);
  return `${key.slice(0, 8)}${"•".repeat(8)}${key.slice(-4)}`;
}

/** A JSON value as a Python literal, indented like JSON */
function pyLiteral(value: unknown, indent = 0): string {
  const pad = (n: number) => " ".repeat(n);
  if (value === null || value === undefined) return "None";
  if (value === true) return "True";
  if (value === false) return "False";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    if (!value.length) return "[]";
    return `[\n${value.map((v) => pad(indent + 4) + pyLiteral(v, indent + 4)).join(",\n")},\n${pad(indent)}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (!entries.length) return "{}";
  return `{\n${entries.map(([k, v]) => `${pad(indent + 4)}${JSON.stringify(k)}: ${pyLiteral(v, indent + 4)}`).join(",\n")},\n${pad(indent)}}`;
}
/** JSON indented by `by` spaces, every line after the first shifted by `shift` */
const json = (value: unknown, by: number, shift = 0) => JSON.stringify(value, null, by).replace(/\n/g, `\n${" ".repeat(shift)}`);

/** The request in one language, reading the key from the `envVar` environment variable */
export function quickstartSnippet(language: QuickstartLanguage, baseUrl: string, endpoint: QuickstartEndpoint, envVar = "API_KEY") {
  const url = `${baseUrl.replace(/\/+$/, "")}${endpoint.path.startsWith("/") ? "" : "/"}${endpoint.path}`;
  const method = endpoint.method;
  const body = HAS_BODY.has(method) ? endpoint.body : undefined;
  if (language === "curl") {
    const lines = [`curl ${method === "GET" ? "" : `-X ${method} `}"${url}"`, `  -H "Authorization: Bearer $${envVar}"`];
    if (body) lines.push(`  -H "Content-Type: application/json"`, `  -d '${json(body, 2, 2).replace(/'/g, "'\\''")}'`);
    return lines.join(" \\\n");
  }
  if (language === "python") {
    return [
      "import os",
      "import requests",
      "",
      `response = requests.${method.toLowerCase()}(`,
      `    "${url}",`,
      `    headers={"Authorization": f"Bearer {os.environ['${envVar}']}"},`,
      ...(body ? [`    json=${pyLiteral(body, 4)},`] : []),
      ")",
      "print(response.status_code, response.json())",
    ].join("\n");
  }
  if (language === "typescript") {
    return [
      `const response = await fetch("${url}", {`,
      `  method: "${method}",`,
      "  headers: {",
      `    Authorization: \`Bearer \${process.env.${envVar}}\`,`,
      ...(body ? [`    "Content-Type": "application/json",`] : []),
      "  },",
      ...(body ? [`  body: JSON.stringify(${json(body, 2, 2)}),`] : []),
      "});",
      "console.log(response.status, await response.json());",
    ].join("\n");
  }
  const goBody = body ? `strings.NewReader(\`${JSON.stringify(body)}\`)` : "nil";
  return [
    "package main",
    "",
    "import (",
    '\t"fmt"',
    '\t"io"',
    '\t"net/http"',
    '\t"os"',
    ...(body ? ['\t"strings"'] : []),
    ")",
    "",
    "func main() {",
    `\treq, _ := http.NewRequest("${method}", "${url}", ${goBody})`,
    `\treq.Header.Set("Authorization", "Bearer "+os.Getenv("${envVar}"))`,
    ...(body ? ['\treq.Header.Set("Content-Type", "application/json")'] : []),
    "\tres, err := http.DefaultClient.Do(req)",
    "\tif err != nil {",
    "\t\tpanic(err)",
    "\t}",
    "\tdefer res.Body.Close()",
    "\tout, _ := io.ReadAll(res.Body)",
    "\tfmt.Println(res.Status, string(out))",
    "}",
  ].join("\n");
}
/** The install step's command in one language */
export function quickstartInstall(language: QuickstartLanguage) {
  return { curl: "curl --version", python: "pip install requests", typescript: "node --version", go: "go mod init quickstart" }[language];
}

/* Rocket, copy, check, eye, eye-off, play and triangle-alert: Lucide (ISC, lucide.dev) */
const rocket = svg`<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>`;
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const copyIcon = () => lucide(14, svg`<rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>`);
const checkIcon = () => lucide(14, svg`<path d="M20 6 9 17l-5-5"></path>`);
const eyeIcon = () => lucide(14, svg`<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle>`);
const eyeOffIcon = () =>
  lucide(14, svg`<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"></path><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"></path><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"></path><path d="m2 2 20 20"></path>`);
const playIcon = () => lucide(14, svg`<polygon points="6 3 20 12 6 21 6 3"></polygon>`);
const alertIcon = () => lucide(14, svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>`);

let uidCount = 0;

/**
 * A first API request with the key filled in – language tabs, four numbered steps, the key masked until revealed,
 * Copy that warns when it copies the key, and Run it with the response the page passes back.
 * @tag tc-quickstart
 * @fires tc-language-change - A language tab was picked ({ language }: QuickstartLanguageChange); cancelable – prevented, `language` stays as it was
 * @fires tc-copy - A step's text was copied ({ step, text, containsKey }: QuickstartCopy); cancelable – prevented, nothing is copied
 * @fires tc-run - Run it was pressed ({ language, method, url, body }: QuickstartRun); cancelable – prevented, `running` isn't set
 */
export class TcQuickstart extends TcElement {
  static override ui = "qks";

  /** The heading */
  @property() accessor heading = "Quickstart";
  /** A line under the heading */
  @property() accessor description = "";
  /** The API's base URL, e.g. "https://api.example.com" */
  @property({ attribute: "base-url" }) accessor baseUrl = "https://api.example.com";
  /** The request to make: method, path and an optional JSON body */
  @property({ attribute: false }) accessor endpoint: QuickstartEndpoint = { method: "GET", path: "/v1/status" };
  /** The person's API key – shown masked until revealed, and copied whole */
  @property({ attribute: "api-key" }) accessor apiKey = "";
  /** The environment variable the key goes into */
  @property({ attribute: "env-var" }) accessor envVar = "API_KEY";
  /** The language shown. Changed by the tabs unless a tc-language-change listener calls preventDefault() */
  @property() accessor language: QuickstartLanguage = "curl";
  /** The languages offered, in order */
  @property({ attribute: false }) accessor languages: QuickstartLanguage[] = QUICKSTART_LANGUAGES;
  /** A localStorage key to remember the chosen language under; none by default */
  @property({ attribute: "storage-key" }) accessor storageKey = "";
  /** The response to show in step 4, as text; null before a run */
  @property({ attribute: false }) accessor response: string | null = null;
  /** The response's status, e.g. "200 OK" */
  @property({ attribute: "response-status" }) accessor responseStatus = "";
  /** A request is on its way: Run it waits and the response area is busy */
  @property({ type: Boolean, reflect: true }) accessor running = false;
  /** Hides Run it and step 4 */
  @property({ type: Boolean, attribute: "hide-run" }) accessor hideRun = false;
  /** The element's words, merged over defaultQuickstartLabels */
  @property({ attribute: false }) accessor labels: QuickstartLabelsInput = {};

  @state() private accessor revealed = false;
  @state() private accessor copiedStep: QuickstartStep | null = null;
  @state() private accessor keyWarning = false;
  @state() private accessor announce = "";

  private uid = `tc-qks-${++uidCount}`;
  private copiedTimer: number | undefined;

  private get words(): QuickstartLabels {
    const l = this.labels;
    const d = defaultQuickstartLabels;
    return { ...d, ...l, languages: { ...d.languages, ...l.languages }, steps: { ...d.steps, ...l.steps }, install: { ...d.install, ...l.install } };
  }
  private get offered() {
    const list = this.languages.filter((l) => QUICKSTART_LANGUAGES.includes(l));
    return list.length ? list : QUICKSTART_LANGUAGES;
  }
  private get current(): QuickstartLanguage {
    return this.offered.includes(this.language) ? this.language : this.offered[0];
  }

  override connectedCallback() {
    super.connectedCallback();
    this.restore();
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this.copiedTimer);
    this.revealed = false;
  }
  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("storageKey") && changed.get("storageKey") !== undefined) this.restore();
    if (changed.has("response") && this.response != null && changed.get("response") == null) this.announce = this.words.responseReceived;
  }

  /** The remembered language, when there is one */
  private restore() {
    if (!this.storageKey) return;
    try {
      const saved = localStorage.getItem(this.storageKey) as QuickstartLanguage | null;
      if (saved && this.offered.includes(saved)) this.language = saved;
    } catch {
      // Storage can be unavailable (private windows, blocked site data); the default stands
    }
  }
  private remember(language: QuickstartLanguage) {
    if (!this.storageKey) return;
    try {
      localStorage.setItem(this.storageKey, language);
    } catch {
      // Nothing to do – the choice just isn't remembered
    }
  }

  private pick(language: QuickstartLanguage, focus = false) {
    if (language !== this.current) {
      if (!this.emit<QuickstartLanguageChange>("tc-language-change", { language }, { cancelable: true })) return;
      this.language = language;
      this.remember(language);
    }
    if (focus) void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-language="${language}"]`)?.focus());
  }
  private onTabsKey = (e: KeyboardEvent) => {
    if (e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
    const list = this.offered;
    const i = list.indexOf(this.current);
    const to: Record<string, number> = { ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: list.length - 1 };
    if (!(e.key in to)) return;
    e.preventDefault();
    const next = (to[e.key] + list.length) % list.length;
    this.pick(list[next], true);
  };

  /** The text a step shows, or copies with the real key when `real` */
  private stepText(step: QuickstartStep, real: boolean) {
    if (step === "install") return quickstartInstall(this.current);
    if (step === "key") {
      const key = this.apiKey ? (real || this.revealed ? this.apiKey : maskKey(this.apiKey)) : this.words.noKey;
      return `export ${this.envVar}="${key}"`;
    }
    return quickstartSnippet(this.current, this.baseUrl, this.endpoint, this.envVar);
  }
  private async copy(step: QuickstartStep) {
    const text = this.stepText(step, true);
    const containsKey = step === "key" && !!this.apiKey;
    if (!this.emit<QuickstartCopy>("tc-copy", { step, text, containsKey }, { cancelable: true })) return;
    const ok = await copyText(text);
    if (!ok) return;
    this.copiedStep = step;
    this.keyWarning = containsKey;
    this.announce = containsKey ? this.words.copiedKey : this.words.copied;
    clearTimeout(this.copiedTimer);
    this.copiedTimer = window.setTimeout(() => (this.copiedStep = null), 2000);
  }
  private run() {
    if (this.running) return;
    const e = this.endpoint;
    const url = `${this.baseUrl.replace(/\/+$/, "")}${e.path.startsWith("/") ? "" : "/"}${e.path}`;
    const detail: QuickstartRun = { language: this.current, method: e.method, url, ...(HAS_BODY.has(e.method) && e.body ? { body: e.body } : {}) };
    if (!this.emit<QuickstartRun>("tc-run", detail, { cancelable: true })) return;
    this.running = true;
    this.announce = this.words.running;
  }

  private renderCode(step: QuickstartStep, label: string) {
    const w = this.words;
    const copied = this.copiedStep === step;
    return html`<div class="ui-qks__code">
      <pre class="ui-qks__pre" tabindex="0" role="region" aria-label=${label}><code>${this.stepText(step, false)}</code></pre>
      <button type="button" class="tc-btn-sm ui-qks__copy" data-step=${step} @click=${() => void this.copy(step)}>
        ${copied ? checkIcon() : copyIcon()}<span>${copied ? w.copied : w.copy}</span><span class="tc-sr-only"> ${label}</span>
      </button>
    </div>`;
  }

  private renderStep(step: QuickstartStep, n: number) {
    const w = this.words;
    const id = `${this.uid}-step-${step}`;
    let body;
    if (step === "install") {
      body = html`<p class="ui-qks__note">${w.install[this.current]}</p>${this.renderCode("install", w.steps.install)}`;
    } else if (step === "key") {
      body = html`
        ${this.renderCode("key", w.steps.key)}
        ${this.apiKey
          ? html`<button type="button" class="tc-btn-sm ui-qks__reveal" aria-pressed=${this.revealed ? "true" : "false"} @click=${() => (this.revealed = !this.revealed)}>
              ${this.revealed ? eyeOffIcon() : eyeIcon()}<span>${this.revealed ? w.hide : w.reveal}</span>
            </button>`
          : nothing}
        ${this.keyWarning ? html`<p class="ui-qks__warning">${alertIcon()}<span>${w.copiedKey}</span></p>` : nothing}
      `;
    } else if (step === "request") {
      body = html`${this.renderCode("request", w.steps.request)}`;
    } else {
      body = html`
        <div class="ui-qks__response-bar">
          <button type="button" class="ui-qks__run" aria-disabled=${this.running ? "true" : "false"} @click=${() => this.run()}>
            ${playIcon()}<span>${this.running ? w.running : w.run}</span>
          </button>
          ${this.responseStatus && this.response != null ? html`<span class="ui-qks__status">${this.responseStatus}</span>` : nothing}
        </div>
        <div class="ui-qks__response" aria-busy=${this.running ? "true" : "false"}>
          ${this.response != null
            ? html`<pre class="ui-qks__pre" tabindex="0" role="region" aria-label=${w.steps.response}><code>${this.response}</code></pre>`
            : html`<p class="ui-qks__note">${this.running ? w.running : w.responseEmpty}</p>`}
        </div>
      `;
    }
    return html`<li class="ui-qks__step" data-step=${step}>
      <span class="ui-qks__num" aria-hidden="true">${n}</span>
      <div class="ui-qks__step-body">
        <h4 class="ui-qks__step-title" id=${id}><span class="tc-sr-only">Step ${n}: </span>${w.steps[step]}</h4>
        ${body}
      </div>
    </li>`;
  }

  protected override render() {
    const w = this.words;
    const id = this.uid;
    const lang = this.current;
    const steps = this.hideRun ? STEPS.filter((s) => s !== "response") : STEPS;
    return html`
      <span class="tc-sr-only" role="status">${this.announce}</span>
      ${cardHead({ icon: rocket, title: this.heading, subtitle: this.description || undefined, id: `${id}-title` })}
      <div class="ui-qks__card">
        <div class="ui-qks__tabs" role="tablist" aria-labelledby=${`${id}-title`} @keydown=${this.onTabsKey}>
          ${this.offered.map(
            (l) => html`<button
              type="button"
              role="tab"
              class="ui-qks__tab"
              id=${`${id}-tab-${l}`}
              data-language=${l}
              aria-selected=${l === lang ? "true" : "false"}
              aria-controls=${`${id}-panel`}
              tabindex=${l === lang ? 0 : -1}
              @click=${() => this.pick(l)}
            >
              ${w.languages[l]}
            </button>`,
          )}
        </div>
        <div class="ui-qks__panel" role="tabpanel" id=${`${id}-panel`} aria-labelledby=${`${id}-tab-${lang}`}>
          <ol class="ui-qks__steps">${steps.map((s, i) => this.renderStep(s, i + 1))}</ol>
        </div>
      </div>
    `;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="qks"] {
  position: relative;
  box-sizing: border-box;
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
:where([data-look="clean"], [data-look="clean"] *)[data-ui="qks"] {
  position: relative;
  box-sizing: border-box;
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
[data-ui="qks"] {
  --tc-qks-num: 22px;
}
[data-ui="qks"] *, [data-ui="qks"] *::before, [data-ui="qks"] *::after { box-sizing: border-box; }
[data-ui="qks"] ol { margin: 0; padding: 0; list-style: none; }
[data-ui="qks"] p, [data-ui="qks"] h4 { margin: 0; }
[data-ui="qks"] svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="qks"] svg[stroke-width] { stroke-width: 1.6; }
:where([data-look="standard"], [data-look="standard"] *).ui-qks__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-qks__card { display: grid; gap: var(--tc-space-4); padding: var(--tc-space-4); min-width: 0; }
/* ----- Tabs ----- */
.ui-qks__tabs { display: flex; gap: var(--tc-space-1); overflow-x: auto; border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-qks__tab { position: relative; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-3); border: 0; background: none; color: var(--tc-text-muted); font: inherit; font-size: var(--tc-font-size-sm); white-space: nowrap; cursor: pointer; }
.ui-qks__tab:hover { color: var(--tc-text-primary); }
.ui-qks__tab[aria-selected="true"] { color: var(--tc-text-primary); }
.ui-qks__tab[aria-selected="true"]::after { content: ""; position: absolute; inset: auto var(--tc-space-2) 0; height: 2px; border-radius: var(--tc-radius-full); background: var(--tc-accent-solid); }
:where([data-look="standard"], [data-look="standard"] *) .ui-qks__tab[aria-selected="true"] { font-weight: var(--tc-font-weight-medium); }
.ui-qks__tab:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); border-radius: var(--tc-radius-sm); }
/* ----- Steps ----- */
.ui-qks__steps { display: grid; gap: var(--tc-space-4); }
.ui-qks__step { display: grid; grid-template-columns: var(--tc-qks-num) minmax(0, 1fr); gap: var(--tc-space-3); }
.ui-qks__num { display: grid; place-items: center; width: var(--tc-qks-num); height: var(--tc-qks-num); border-radius: var(--tc-radius-full); background: var(--tc-fill-default); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-qks__step-body { display: grid; gap: var(--tc-space-2); min-width: 0; }
.ui-qks__step-title { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-regular); color: var(--tc-text-primary); }
:where([data-look="standard"], [data-look="standard"] *) .ui-qks__step-title { font-weight: var(--tc-font-weight-medium); }
.ui-qks__note { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
/* ----- Code ----- */
.ui-qks__code { position: relative; min-width: 0; }
.ui-qks__pre { margin: 0; padding: var(--tc-space-3); padding-right: var(--tc-space-16); border-radius: var(--tc-radius-md); background: var(--tc-surface-sunken); color: var(--tc-syntax-text); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-relaxed); overflow-x: auto; white-space: pre; tab-size: 4; }
.ui-qks__pre:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-qks__response .ui-qks__pre { padding-right: var(--tc-space-3); max-height: 240px; overflow: auto; }
.ui-qks__copy { position: absolute; top: var(--tc-space-1-5); right: var(--tc-space-1-5); }
.ui-qks__reveal { justify-self: start; }
.ui-qks__warning { display: flex; align-items: flex-start; gap: var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); font-size: var(--tc-font-size-sm); }
.ui-qks__warning svg { margin-top: var(--tc-space-0-5); }
/* ----- Response ----- */
.ui-qks__response-bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); }
.ui-qks__run { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); font: inherit; font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); cursor: pointer; }
.ui-qks__run:hover { background: var(--tc-action-primary-bg-hover); }
.ui-qks__run[aria-disabled="true"] { cursor: progress; background: var(--tc-action-primary-bg-active); }
.ui-qks__run:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-qks__status { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); font-family: var(--tc-font-mono); font-size: var(--tc-pill-font-size); }
@container (max-width: 400px) {
  .ui-qks__step { grid-template-columns: minmax(0, 1fr); }
  .ui-qks__num { display: none; }
}
@media (forced-colors: active) {
  .ui-qks__pre, .ui-qks__warning, .ui-qks__status, .ui-qks__num { border: 1px solid CanvasText; }
  .ui-qks__tab[aria-selected="true"]::after { background: Highlight; }
  .ui-qks__run { border: 1px solid ButtonText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="qks"] *, [data-ui="qks"] *::before, [data-ui="qks"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-quickstart")) customElements.define("tc-quickstart", TcQuickstart);

declare global {
  interface HTMLElementTagNameMap {
    "tc-quickstart": TcQuickstart;
  }
}
