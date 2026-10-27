import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-provider-connection> – one connection to a model provider: which provider, the endpoint, the deployment (or
 * model) to call, and the credential to call it with – as a reference the app's server resolves, shown masked
 * ("•••• 4f2a"); the key itself never reaches the page. Below the fields, the connection's health: Test connection
 * asks the app to try it, and the answer – healthy, authentication failed, credential expired, model unavailable or
 * unreachable – comes back as `check`, with the time the app checked and the models the endpoint reports.
 *   · Test fires a cancelable `tc-test` ({ value, signal }) and shows Testing… until the app sets `check`. The signal
 *     aborts when the person cancels (the button, or Escape), edits the connection, or the element leaves the page
 *   · a check belongs to the config it tested: change the endpoint afterwards and the health reads "Not tested" again
 *   · a reference that looks like a pasted key ("sk-…", a long random string) is refused and never enters the value
 * The fields are native controls (select, inputs), so their keyboard is the browser's; Enter in the endpoint or the
 * deployment runs the test. Standard is a white card on a gray tray, the health in a tinted band; Clean is one white
 * card, the health a quiet row under a hairline, with thinner icons.
 *
 *   <tc-provider-connection .providers=${providers} .credentials=${refs} .value=${connection} .check=${check}></tc-provider-connection>
 *
 * The config is one value: every change fires a cancelable `tc-value-change` ({ value }) – call preventDefault() to
 * control `value` yourself. With `name` it's a form control: the form gets the config as JSON (references only), and
 * an endpoint that isn't an http(s) URL is invalid. Providers, models and credentials are data from the app.
 */

/** A provider the app supports */
export type ProviderConnectionOption = {
  id: string;
  label: string;
  /** The endpoint field's placeholder for this provider, e.g. its usual base URL */
  endpoint?: string;
  /** What this provider calls the thing being called: "Deployment" (the default) or "Model" */
  deploymentLabel?: string;
};
/** A credential reference the app's server can resolve – never the key */
export type ProviderConnectionCredential = {
  id: string;
  /** "Production key" */
  label: string;
  /** The masked end of the key, e.g. "4f2a" – shown after •••• */
  hint?: string;
  /** When it expires, as the app says it: "Expires 3 Nov" */
  expires?: string;
  /** The app knows it has expired */
  expired?: boolean;
};
/** A model the endpoint reports */
export type ProviderConnectionModel = {
  id: string;
  /** A friendlier name, shown before the id */
  label?: string;
  /** A quiet note, e.g. "128k context" */
  detail?: string;
};
/** What a test found */
export type ProviderConnectionHealth = "healthy" | "auth-failed" | "expired" | "model-unavailable" | "unreachable";
/** The health shown: not tested (or changed since), testing, or what the last test found */
export type ProviderConnectionState = "untested" | "testing" | ProviderConnectionHealth;
/** The app's answer to a test */
export type ProviderConnectionCheck = {
  status: ProviderConnectionHealth;
  /** When the app checked: a Date or epoch ms (shown as a time of day), or text as it is */
  at?: Date | number | string;
  /** How long the endpoint took to answer */
  latencyMs?: number;
  /** The provider's own words, shown in place of the default line */
  message?: string;
  /** The models the endpoint reports */
  models?: ProviderConnectionModel[];
};
/** The connection – references only */
export type ProviderConnectionValue = {
  /** The id of the provider */
  provider: string;
  /** The base URL */
  endpoint: string;
  /** The deployment or model to call; empty uses the endpoint's default */
  deployment: string;
  /** The id of the credential reference; empty for none */
  credentialRef: string;
};
export type ProviderConnectionValueChange = { value: ProviderConnectionValue };
/** tc-test: try `value`; stop when `signal` aborts */
export type ProviderConnectionTestEvent = { value: ProviderConnectionValue; signal: AbortSignal };

const DEFAULT_VALUE: ProviderConnectionValue = { provider: "", endpoint: "", deployment: "", credentialRef: "" };
/** The states' short names, for the pill */
export const PROVIDER_CONNECTION_LABELS: Record<ProviderConnectionState, string> = {
  untested: "Not tested",
  testing: "Testing",
  healthy: "Connected",
  "auth-failed": "Auth failed",
  expired: "Credential expired",
  "model-unavailable": "Model unavailable",
  unreachable: "Unreachable",
};
const TITLE: Record<ProviderConnectionState, string> = {
  untested: "Not tested yet",
  testing: "Testing the connection…",
  healthy: "Connected",
  "auth-failed": "Authentication failed",
  expired: "The credential has expired",
  "model-unavailable": "Model unavailable",
  unreachable: "Can't reach the endpoint",
};
const TONE: Record<ProviderConnectionState, "neutral" | "info" | "success" | "warning" | "danger"> = {
  untested: "neutral",
  testing: "info",
  healthy: "success",
  "auth-failed": "danger",
  expired: "warning",
  "model-unavailable": "warning",
  unreachable: "danger",
};
/** A hop on the path from the app to the model */
export type ProviderConnectionHop = "endpoint" | "credential" | "model";
type HopState = "ok" | "fail" | "unknown" | "pending";
/** Each state as the three hops see it: reachable, accepted, available */
const HOP_STATES: Record<ProviderConnectionState, [HopState, HopState, HopState]> = {
  untested: ["unknown", "unknown", "unknown"],
  testing: ["pending", "pending", "pending"],
  healthy: ["ok", "ok", "ok"],
  unreachable: ["fail", "unknown", "unknown"],
  "auth-failed": ["ok", "fail", "unknown"],
  expired: ["ok", "fail", "unknown"],
  "model-unavailable": ["ok", "ok", "fail"],
};
const HOP_WORDS: Record<ProviderConnectionHop, Record<HopState, string>> = {
  endpoint: { ok: "Reachable", fail: "Not reachable", unknown: "Not checked", pending: "Checking…" },
  credential: { ok: "Accepted", fail: "Refused", unknown: "Not checked", pending: "Checking…" },
  model: { ok: "Available", fail: "Not offered", unknown: "Not checked", pending: "Checking…" },
};
const TIME = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });
const when = (at: ProviderConnectionCheck["at"]) => (at === undefined || at === "" ? "" : typeof at === "string" ? at : TIME.format(at));
const fingerprint = (v: ProviderConnectionValue) => JSON.stringify([v.provider, v.endpoint.trim(), v.deployment.trim(), v.credentialRef]);
/** A key pasted where a reference belongs: a known key prefix, or a long run of key-like characters with no path in it */
const looksLikeKey = (s: string) => /^(sk|pk|rk|ghp|gho|xox[abpr]|AKIA|AIza)[-_A-Za-z0-9]{8,}/.test(s) || (/^[A-Za-z0-9_\-+=]{32,}$/.test(s) && !/[/:.]/.test(s));
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
let instances = 0;

/* Plug, key-round, activity, circle-check, circle-x, clock, triangle-alert, wifi-off, loader-circle, box: Lucide (ISC, lucide.dev) */
const lucide = (size: number, body: ReturnType<typeof svg>) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
/* The header's icon: a plug */
const plugIcon = svg`<path d="M12 22v-5"></path><path d="M9 8V2"></path><path d="M15 8V2"></path><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"></path>`;
const keyIcon = () =>
  lucide(14, svg`<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"></path><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle>`);
const activityIcon = () => lucide(14, svg`<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path>`);
const chevronDown = html`<svg class="ui-prv__chevron" viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M4.5 6.25 8 9.75l3.5-3.5"></path>`}</svg>`;
const STATE_ICON: Record<ProviderConnectionState, () => ReturnType<typeof lucide>> = {
  untested: () => lucide(16, svg`<circle cx="12" cy="12" r="9" stroke-dasharray="3.5 3"></circle>`),
  testing: () => lucide(16, svg`<path class="ui-prv__spin" d="M21 12a9 9 0 1 1-6.219-8.56"></path>`),
  healthy: () => lucide(16, svg`<circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path>`),
  "auth-failed": () => lucide(16, svg`<circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path>`),
  expired: () => lucide(16, svg`<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>`),
  "model-unavailable": () => lucide(16, svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>`),
  unreachable: () =>
    lucide(
      16,
      svg`<path d="M12 20h.01"></path><path d="M8.5 16.429a5 5 0 0 1 7 0"></path><path d="M5 12.859a10 10 0 0 1 5.17-2.69"></path><path d="M19 12.859a10 10 0 0 0-2.007-1.523"></path><path d="M2 8.82a15 15 0 0 1 4.177-2.643"></path><path d="M22 8.82a15 15 0 0 0-11.288-3.764"></path><path d="m2 2 20 20"></path>`,
    ),
};

/**
 * A connection to a model provider: provider, endpoint, deployment and a masked credential reference, with an
 * app-run connection test, its health, when it was checked and the models the endpoint reports.
 * @tag tc-provider-connection
 * @fires tc-value-change - The connection changed ({ value: ProviderConnectionValue }); cancelable – prevent it to control `value`
 * @fires tc-test - Test connection was pressed ({ value, signal }: ProviderConnectionTestEvent); try the connection and set `check`. Cancelable – prevented, nothing shows as testing
 */
export class TcProviderConnection extends TcElement {
  static override ui = "prv";
  static formAssociated = true;

  /** The connection. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property({ attribute: false }) accessor value: ProviderConnectionValue = DEFAULT_VALUE;
  /** The providers to choose from; with none, the Provider row is hidden */
  @property({ attribute: false }) accessor providers: ProviderConnectionOption[] = [];
  /** The credential references to choose from; with none, the reference is typed in */
  @property({ attribute: false }) accessor credentials: ProviderConnectionCredential[] = [];
  /** The app's answer to the last test; setting it ends Testing… */
  @property({ attribute: false }) accessor check: ProviderConnectionCheck | null = null;
  /** The states' short names, merged over PROVIDER_CONNECTION_LABELS */
  @property({ attribute: false }) accessor stateLabels: Partial<Record<ProviderConnectionState, string>> = {};
  /** Names the group, shown at the top */
  @property() accessor heading = "Model provider";
  /** A quieter line under the heading */
  @property() accessor description = "";
  /** The test button's text */
  @property({ attribute: "test-label" }) accessor testLabel = "Test connection";
  /** The first stop on the path, before the endpoint */
  @property({ attribute: "origin-label" }) accessor originLabel = "Your app";
  /** Submitted with the form: the connection as JSON */
  @property({ reflect: true }) accessor name = "";
  /** Turns every control off and leaves the connection out of the form; a disabled fieldset does the same */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;

  @state() private accessor testing = false;
  @state() private accessor formDisabled = false;
  @state() private accessor announcement = "";
  /** The endpoint has been edited or a test was tried – its error shows from then on */
  @state() private accessor touched = false;
  @state() private accessor refError = "";
  /** The fields are open */
  @state() private accessor editing = false;

  private readonly internals: ElementInternals;
  private readonly uid = `tc-prv${++instances}`;
  private initialValue: ProviderConnectionValue | null = null;
  private ownName = false;
  private abort: AbortController | null = null;
  /** The config the current `check` belongs to */
  private checkedFor = "";

  constructor() {
    super();
    this.internals = this.attachInternals();
  }

  override connectedCallback() {
    super.connectedCallback();
    this.initialValue ??= this.value;
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    this.ownName ||= (this.hasAttribute("aria-label") && this.getAttribute("aria-label") !== this.heading) || this.hasAttribute("aria-labelledby");
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.stopTest();
  }

  formResetCallback() {
    this.stopTest();
    this.touched = false;
    this.refError = "";
    this.value = this.initialValue ?? DEFAULT_VALUE;
  }
  formDisabledCallback(disabled: boolean) {
    queueMicrotask(() => (this.formDisabled = disabled));
  }

  private get isDisabled() {
    return this.disabled || this.formDisabled;
  }
  private get stale() {
    return !!this.check && this.checkedFor !== fingerprint(this.value);
  }
  /** The health shown now */
  get health(): ProviderConnectionState {
    if (this.testing) return "testing";
    if (!this.check || this.stale) return "untested";
    return this.check.status;
  }
  private label(s: ProviderConnectionState) {
    return this.stateLabels[s] ?? PROVIDER_CONNECTION_LABELS[s];
  }
  private get provider() {
    return this.providers.find((p) => p.id === this.value.provider);
  }
  private get credential() {
    return this.credentials.find((c) => c.id === this.value.credentialRef);
  }
  private endpointError(endpoint = this.value.endpoint) {
    const s = endpoint.trim();
    if (!s) return "Enter the endpoint's URL.";
    try {
      const url = new URL(s);
      return url.protocol === "https:" || url.protocol === "http:" ? "" : "Use an http:// or https:// URL.";
    } catch {
      return "That isn't a URL – start with https://";
    }
  }

  private commit(patch: Partial<ProviderConnectionValue>) {
    const next: ProviderConnectionValue = { ...this.value, ...patch };
    if (JSON.stringify(next) === JSON.stringify(this.value)) return true;
    if (this.emit<ProviderConnectionValueChange>("tc-value-change", { value: next }, { cancelable: true })) {
      this.value = next;
      return true;
    }
    this.requestUpdate();
    return false;
  }

  /* ---------- The test ---------- */

  /** Asks the app to test the connection, as Test connection does */
  test() {
    if (this.isDisabled || this.testing) return;
    this.touched = true;
    if (this.endpointError()) {
      this.editing = true;
      void this.updateComplete.then(() => this.querySelector<HTMLInputElement>(".ui-prv__endpoint")?.focus());
      return;
    }
    const ctrl = new AbortController();
    if (!this.emit<ProviderConnectionTestEvent>("tc-test", { value: this.value, signal: ctrl.signal }, { cancelable: true })) return;
    this.abort = ctrl;
    this.testing = true;
    this.announcement = "Testing the connection…";
  }
  /** Stops a test in progress: its signal aborts */
  cancel() {
    if (!this.testing) return;
    this.stopTest();
    this.announcement = "Test cancelled.";
  }
  private stopTest() {
    this.abort?.abort();
    this.abort = null;
    this.testing = false;
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && this.testing) {
      e.preventDefault();
      this.cancel();
    }
  };
  /** Enter in a text field commits it and runs the test */
  private onFieldKey(e: KeyboardEvent, key: "endpoint" | "deployment") {
    if (e.key !== "Enter" || e.isComposing) return;
    e.preventDefault();
    const raw = (e.target as HTMLInputElement).value;
    if (key === "endpoint") this.touched = true;
    if (this.commit({ [key]: raw })) void this.updateComplete.then(() => this.test());
  }
  private onRef(raw: string, input?: HTMLInputElement) {
    const s = raw.trim();
    if (looksLikeKey(s)) {
      // The key never enters the value: the field is cleared and says why
      if (input) input.value = this.value.credentialRef;
      this.refError = "That looks like a key. Enter the name of its reference instead – the key stays in your secrets store.";
      this.announcement = this.refError;
      return;
    }
    this.refError = "";
    this.commit({ credentialRef: s });
  }

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    this.toggleAttribute("data-disabled", this.isDisabled);
    if (changed.has("check")) {
      // An answer arrived: it belongs to the config as it is now
      this.checkedFor = fingerprint(this.value);
      if (this.testing) {
        this.abort = null;
        this.testing = false;
      }
      if (this.hasUpdated && this.check) this.announcement = `${this.headline(this.check.status)}. ${this.detail(this.check.status)}`;
    } else if (changed.has("value") && this.testing && fingerprint(this.value) !== fingerprint((changed.get("value") as ProviderConnectionValue) ?? DEFAULT_VALUE)) {
      // The config changed under the test: it no longer tests what's on screen
      this.stopTest();
      this.announcement = "Test cancelled – the connection changed.";
    }
    this.dataset.state = this.health;
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (!this.ownName) this.setAttribute("aria-label", this.heading);
    this.syncForm();
  }

  private syncForm() {
    if (typeof this.internals.setFormValue !== "function") return;
    const disabled = this.isDisabled;
    this.internals.setFormValue(this.name && !disabled ? JSON.stringify(this.value) : null);
    const error = disabled ? "" : this.endpointError();
    if (error) this.internals.setValidity(this.value.endpoint.trim() ? { typeMismatch: true } : { valueMissing: true }, error, this.querySelector<HTMLElement>(".ui-prv__endpoint") ?? undefined);
    else this.internals.setValidity({});
  }

  /* ---------- Rendering ---------- */

  private headline(s: ProviderConnectionState) {
    return TITLE[s];
  }
  private detail(s: ProviderConnectionState) {
    const c = this.check;
    if (s === "testing") return "Asking the endpoint which models it offers.";
    if (s === "untested") return c ? "The connection changed after the last check – test it again." : "Test the connection before anything relies on it.";
    if (c?.message) return c.message;
    const deployment = this.value.deployment.trim();
    switch (s) {
      case "healthy":
        return c?.models ? `The endpoint answered and reports ${plural(c.models.length, "model")}.` : "The endpoint answered.";
      case "auth-failed":
        return "The endpoint turned the credential down. Check that the reference points at the right key.";
      case "expired":
        return "Rotate the key in your secrets store, then test again.";
      case "model-unavailable":
        return deployment ? `The endpoint answered, but doesn't offer ${deployment}.` : "The endpoint answered, but doesn't offer the model asked for.";
      case "unreachable":
        return "Nothing answered at that URL. Check it, and that your network allows the connection.";
    }
  }

  private row(id: string, label: string, control: unknown, forId?: string) {
    return html`<div class="ui-prv__row" data-row=${id}>
      ${forId ? html`<label class="ui-prv__label" for=${forId}>${label}</label>` : html`<span class="ui-prv__label" id=${`${this.uid}-${id}`}>${label}</span>`}
      <div class="ui-prv__control">${control}</div>
    </div>`;
  }

  private renderProvider() {
    const v = this.value;
    const known = this.providers.some((p) => p.id === v.provider);
    return html`<span class="ui-prv__select">
      <select id=${`${this.uid}-provider`} class="ui-prv__input" ?disabled=${this.isDisabled} @change=${(e: Event) => this.commit({ provider: (e.target as HTMLSelectElement).value })}>
        ${known ? nothing : html`<option value="" .selected=${live(true)} disabled>Pick a provider</option>`}
        ${this.providers.map((p) => html`<option value=${p.id} .selected=${live(p.id === v.provider)}>${p.label}</option>`)}
      </select>${chevronDown}
    </span>`;
  }

  private renderEndpoint() {
    const error = this.touched ? this.endpointError() : "";
    const id = `${this.uid}-endpoint`;
    return html`<input
        id=${id}
        class="ui-prv__input ui-prv__mono ui-prv__endpoint"
        type="url"
        inputmode="url"
        spellcheck="false"
        autocomplete="off"
        placeholder=${this.provider?.endpoint ?? "https://"}
        .value=${live(this.value.endpoint)}
        aria-invalid=${error ? "true" : "false"}
        aria-describedby=${ifDefined(error ? `${id}-e` : undefined)}
        ?disabled=${this.isDisabled}
        @change=${(e: Event) => {
          this.touched = true;
          this.commit({ endpoint: (e.target as HTMLInputElement).value.trim() });
        }}
        @keydown=${(e: KeyboardEvent) => this.onFieldKey(e, "endpoint")}
      />${error ? html`<span class="ui-prv__error" id=${`${id}-e`}>${error}</span>` : nothing}`;
  }

  private renderDeployment(models: ProviderConnectionModel[]) {
    const id = `${this.uid}-deployment`;
    return html`<input
        id=${id}
        class="ui-prv__input ui-prv__mono"
        spellcheck="false"
        autocomplete="off"
        placeholder="The endpoint's default"
        list=${ifDefined(models.length ? `${id}-list` : undefined)}
        .value=${live(this.value.deployment)}
        ?disabled=${this.isDisabled}
        @change=${(e: Event) => this.commit({ deployment: (e.target as HTMLInputElement).value.trim() })}
        @keydown=${(e: KeyboardEvent) => this.onFieldKey(e, "deployment")}
      />${models.length ? html`<datalist id=${`${id}-list`}>${models.map((m) => html`<option value=${m.id}>${m.label ?? nothing}</option>`)}</datalist>` : nothing}`;
  }

  private renderCredential() {
    const v = this.value;
    const id = `${this.uid}-credential`;
    const cred = this.credential;
    const note = html`<span class="ui-prv__hint" id=${`${id}-d`}>Your server looks the key up – it never reaches this page.</span>`;
    if (!this.credentials.length) {
      return html`<input
          id=${id}
          class="ui-prv__input ui-prv__mono"
          spellcheck="false"
          autocomplete="off"
          placeholder="Name of a stored key"
          .value=${live(v.credentialRef)}
          aria-invalid=${this.refError ? "true" : "false"}
          aria-describedby=${this.refError ? `${id}-e ${id}-d` : `${id}-d`}
          ?disabled=${this.isDisabled}
          @change=${(e: Event) => this.onRef((e.target as HTMLInputElement).value, e.target as HTMLInputElement)}
        />${this.refError ? html`<span class="ui-prv__error" id=${`${id}-e`}>${this.refError}</span>` : nothing}${note}`;
    }
    const known = !v.credentialRef || !!cred;
    return html`<span class="ui-prv__select">
        <select id=${id} class="ui-prv__input" aria-describedby=${cred ? `${id}-k ${id}-d` : `${id}-d`} ?disabled=${this.isDisabled} @change=${(e: Event) => this.onRef((e.target as HTMLSelectElement).value)}>
          <option value="" .selected=${live(!v.credentialRef)}>No credential</option>
          ${known ? nothing : html`<option value=${v.credentialRef} .selected=${live(true)}>${v.credentialRef} (not found)</option>`}
          ${this.credentials.map((c) => html`<option value=${c.id} .selected=${live(c.id === v.credentialRef)}>${c.label}</option>`)}
        </select>${chevronDown}
      </span>
      ${cred
        ? html`<span class="ui-prv__key" id=${`${id}-k`} ?data-expired=${!!cred.expired}>
            ${keyIcon()}${cred.hint ? html`<span class="ui-prv__mask"><span aria-hidden="true">••••</span><span class="ui-prv__sr">ending </span>${cred.hint}</span>` : nothing}${cred.expires
              ? html`<span class="ui-prv__expires">${cred.expires}</span>`
              : nothing}
          </span>`
        : nothing}${note}`;
  }

  /** Opens the fields and puts focus in the one behind a hop */
  private editHop(hop: ProviderConnectionHop) {
    this.editing = true;
    const field = hop === "endpoint" ? "endpoint" : hop === "credential" ? "credential" : "deployment";
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`#${this.uid}-${field}`)?.focus());
  }
  private closeEditor() {
    this.editing = false;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-prv__edit")?.focus());
  }
  private get editorOpen() {
    return this.editing || !this.value.endpoint.trim();
  }

  private renderPath(state: ProviderConnectionState) {
    const v = this.value;
    const cred = this.credential;
    const c = this.check;
    const states = HOP_STATES[state];
    let host = v.endpoint.trim();
    try {
      host = new URL(host).host || host;
    } catch {
      // not a URL yet – shown as typed
    }
    const latency = state !== "testing" && state !== "untested" && states[0] === "ok" && c?.latencyMs !== undefined ? `${Math.round(c.latencyMs)} ms` : "";
    const modelLabel = c && !this.stale ? c.models?.find((m) => m.id === v.deployment.trim())?.label : undefined;
    const hops: { id: ProviderConnectionHop; kind: string; value: string; mono: boolean; sub?: string }[] = [
      { id: "endpoint", kind: this.provider?.label ?? "Endpoint", value: host || "Not set", mono: !!host },
      { id: "credential", kind: "Credential", value: cred ? cred.label : v.credentialRef || "None", mono: !cred && !!v.credentialRef, sub: cred?.hint ? `•••• ${cred.hint}` : undefined },
      { id: "model", kind: this.provider?.deploymentLabel ?? "Deployment", value: v.deployment.trim() || "The endpoint's default", mono: !!v.deployment.trim(), sub: modelLabel },
    ];
    const open = this.editorOpen;
    return html`<ol class="ui-prv__path" aria-label="Connection path">
      <li class="ui-prv__origin"><span class="ui-prv__origin-dot" aria-hidden="true"></span>${this.originLabel}</li>
      ${hops.map((h, i) => {
        const s = states[i];
        const word = s === "fail" && h.id === "credential" && state === "expired" ? "Expired" : s === "unknown" && states.includes("fail") ? "Not reached" : HOP_WORDS[h.id][s];
        return html`<li class="ui-prv__hop" data-hop=${h.id} data-state=${s} data-tone=${s === "fail" ? TONE[state] : s}>
          <span class="ui-prv__link" aria-hidden="true">${i === 0 && latency ? html`<span class="ui-prv__latency">${latency}</span>` : nothing}</span>
          <button type="button" class="ui-prv__node" title=${h.value} aria-expanded=${open ? "true" : "false"} aria-controls=${`${this.uid}-editor`} ?disabled=${this.isDisabled} @click=${() => this.editHop(h.id)}>
            <span class="ui-prv__sr">Edit </span>
            <span class="ui-prv__node-kind">${h.kind}</span>
            <span class=${h.mono ? "ui-prv__node-value ui-prv__node-value--mono" : "ui-prv__node-value"}>${h.value}</span>
            ${h.sub ? html`<span class="ui-prv__node-sub">${h.sub}</span>` : nothing}
            <span class="ui-prv__node-state"><span class="ui-prv__sr">: </span><span class="ui-prv__node-mark" aria-hidden="true"></span>${word}</span>
          </button>
        </li>`;
      })}
    </ol>`;
  }

  private renderHealth(state: ProviderConnectionState, clean: boolean) {
    const c = this.check;
    const meta = state !== "untested" && state !== "testing" && c ? [c.at !== undefined && c.at !== "" ? `Checked ${when(c.at)}` : "", c.latencyMs !== undefined ? `${Math.round(c.latencyMs)} ms` : ""].filter(Boolean) : [];
    const testing = state === "testing";
    const open = this.editorOpen;
    return html`<div class="ui-prv__health" data-tone=${TONE[state]}>
      <span class="ui-prv__health-icon" aria-hidden="true">${STATE_ICON[state]()}</span>
      <div class="ui-prv__health-text">
        <p class="ui-prv__health-title">${this.headline(state)}</p>
        <p class="ui-prv__health-detail">${this.detail(state)}</p>
        ${meta.length ? html`<p class="ui-prv__meta">${meta.join(" · ")}</p>` : nothing}
      </div>
      <div class="ui-prv__actions">
        <button
          type="button"
          class="ui-prv__btn ui-prv__btn--ghost ui-prv__edit"
          aria-expanded=${open ? "true" : "false"}
          aria-controls=${`${this.uid}-editor`}
          ?disabled=${this.isDisabled}
          @click=${() => (open ? this.closeEditor() : (this.editing = true))}
        >${open ? "Done" : "Edit"}</button>
        <button
          type="button"
          class=${`ui-prv__btn ui-prv__test ${testing || clean || state === "healthy" ? "ui-prv__btn--secondary" : "ui-prv__btn--primary"}`}
          ?disabled=${this.isDisabled}
          @click=${() => (testing ? this.cancel() : this.test())}
        >${testing ? "Cancel" : html`${activityIcon()}${state === "untested" || state === "healthy" ? this.testLabel : "Test again"}`}</button>
      </div>
    </div>`;
  }

  private renderModels(state: ProviderConnectionState) {
    const c = this.check;
    if (!c || this.stale || !c.models) return nothing;
    const deployment = this.value.deployment.trim();
    const missing = state === "model-unavailable" && deployment && !c.models.some((m) => m.id === deployment);
    const id = `${this.uid}-models`;
    return html`<section class="ui-prv__models" aria-labelledby=${id} ?data-dim=${state === "testing"}>
      <h4 class="ui-prv__models-head" id=${id}>Models the endpoint reports<span class="ui-prv__count">${c.models.length}</span></h4>
      ${c.models.length || missing
        ? html`<ul class="ui-prv__chips">
            ${missing ? html`<li class="ui-prv__chip" data-missing><span class="ui-prv__chip-id">${deployment}</span><span class="ui-prv__chip-note">not offered</span></li>` : nothing}
            ${repeat(
              c.models,
              (m) => m.id,
              (m) => html`<li class="ui-prv__chip" ?data-current=${m.id === deployment} title=${ifDefined(m.detail)}>
                ${m.label ? html`<span class="ui-prv__chip-label">${m.label}</span>` : nothing}<span class="ui-prv__chip-id">${m.id}</span>${m.id === deployment ? html`<span class="ui-prv__chip-note">in use</span>` : nothing}
              </li>`,
            )}
          </ul>`
        : html`<p class="ui-prv__empty">The endpoint reported no models.</p>`}
    </section>`;
  }

  protected override render() {
    const clean = this.resolvedLook === "clean";
    const state = this.health;
    const models = this.check?.models ?? [];
    const open = this.editorOpen;
    // The header (.tc-head): on the tray in Standard, the card's first row in Clean
    const head = cardHead({
      icon: plugIcon,
      title: this.heading,
      subtitle: this.description || undefined,
      aside: html`<span class="ui-prv__pill" data-tone=${TONE[state]}><span class="ui-prv__sr">Status: </span><span class="ui-prv__dot" aria-hidden="true"></span>${this.label(state)}</span>`,
    });
    const body = html`
      ${clean ? head : nothing}
      ${this.renderPath(state)}
      <div class="ui-prv__editor" id=${`${this.uid}-editor`} ?hidden=${!open} @keydown=${(e: KeyboardEvent) => {
        if (e.key === "Escape" && !this.testing && this.value.endpoint.trim()) {
          e.preventDefault();
          this.closeEditor();
        }
      }}>
        ${open
          ? html`${this.providers.length ? this.row("provider", "Provider", this.renderProvider(), `${this.uid}-provider`) : nothing}
            ${this.row("endpoint", "Endpoint", this.renderEndpoint(), `${this.uid}-endpoint`)}
            ${this.row("deployment", this.provider?.deploymentLabel ?? "Deployment", this.renderDeployment(models), `${this.uid}-deployment`)}
            ${this.row("credential", "Credential", this.renderCredential(), `${this.uid}-credential`)}`
          : nothing}
      </div>
      ${this.renderHealth(state, clean)} ${this.renderModels(state)}
    `;
    return html`<span class="ui-prv__sr" role="status">${this.announcement}</span>
      ${clean ? nothing : head}<div class="ui-prv__card" @keydown=${this.onKey}>${body}</div>`;
  }

  static override css = /* css */ `
[data-ui="prv"] {
  display: flow-root;
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 600px;
  min-width: 0;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="prv"] *, [data-ui="prv"] *::before, [data-ui="prv"] *::after { box-sizing: border-box; }
:where([data-ui="prv"]) :is(p, ul, h4) { margin: 0; padding: 0; }
:where([data-ui="prv"]) ul { list-style: none; }
[data-ui="prv"] svg { display: block; flex: none; }
/* Standard: a gray tray around a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="prv"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *).ui-prv__card { display: flow-root; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* Clean: one white card with hairline shadows, thinner icons */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="prv"] { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="prv"] svg[stroke-width]:where(:not(.tc-head__icon > svg)) { stroke-width: 1.5; }
.ui-prv__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

/* ---------- Header ---------- */
.ui-prv__pill { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-prv__dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.ui-prv__pill[data-tone="neutral"] { background: var(--tc-fill-default); color: var(--tc-text-muted); }
.ui-prv__pill[data-tone="info"] { background: var(--tc-status-info-bg); color: var(--tc-status-info-fg); }
.ui-prv__pill[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-prv__pill[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-prv__pill[data-tone="danger"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
/* Clean: the pill is a dot and a word, no fill */
:where([data-look="clean"], [data-look="clean"] *).ui-prv__pill { padding: 0; background: none !important; }
.ui-prv__pill[data-tone="info"] .ui-prv__dot { animation: ui-prv-pulse var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; }

/* ---------- Rows: a label column and the controls ---------- */
.ui-prv__row { display: grid; grid-template-columns: 92px minmax(0, 1fr); align-items: start; gap: var(--tc-space-3); }
.ui-prv__label { display: flex; align-items: center; min-height: var(--tc-field-h); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *).ui-prv__label { color: var(--tc-text-muted); }
.ui-prv__control { display: grid; gap: var(--tc-space-1-5); min-width: 0; }
.ui-prv__input {
  width: 100%;
  min-width: 0;
  height: var(--tc-field-h);
  margin: 0;
  padding: 0 var(--tc-field-px);
  border: 0;
  border-radius: var(--tc-field-radius);
  outline: 0;
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  color: var(--tc-text-primary);
  font: inherit;
  font-size: var(--tc-field-font-size);
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-prv__input:hover:not(:disabled) { box-shadow: var(--tc-field-shadow-hover); }
.ui-prv__input:focus-visible { box-shadow: var(--tc-field-shadow-focus); }
.ui-prv__input[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-prv__input::placeholder { color: var(--tc-text-placeholder); }
.ui-prv__input:disabled { cursor: not-allowed; opacity: 0.55; }
.ui-prv__mono { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); }
.ui-prv__select { position: relative; display: block; max-width: 320px; }
.ui-prv__select > select { padding-right: var(--tc-space-7); appearance: none; cursor: pointer; text-overflow: ellipsis; }
.ui-prv__chevron { position: absolute; top: 50%; right: var(--tc-space-2); width: 14px; height: 14px; fill: none; stroke: var(--tc-icon-muted); stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; transform: translateY(-50%); pointer-events: none; }
.ui-prv__hint { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-prv__error { color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
/* The masked key: a key, •••• and the last characters, and when it expires */
.ui-prv__key { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-prv__key > svg { width: 13px; height: 13px; color: var(--tc-icon-muted); }
.ui-prv__mask { font-family: var(--tc-font-mono); }
.ui-prv__expires { color: var(--tc-text-muted); }
.ui-prv__expires::before { content: "·"; margin-right: var(--tc-space-1-5); color: var(--tc-text-muted); }
.ui-prv__key[data-expired] .ui-prv__expires { color: var(--tc-status-danger-fg); }

/* ---------- The path: your app → endpoint → credential → model, each hop with its health ---------- */
.ui-prv__path { display: flex; align-items: stretch; margin: 0; padding: var(--tc-space-4); list-style: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-prv__path { padding-top: var(--tc-space-1); }
.ui-prv__origin { display: flex; flex: none; flex-direction: column; align-items: center; justify-content: center; gap: var(--tc-space-1); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); white-space: nowrap; }
.ui-prv__origin-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--tc-surface-raised); box-shadow: inset 0 0 0 2px var(--tc-icon-muted); }
.ui-prv__hop { display: flex; flex: 1 1 0; align-items: stretch; min-width: 0; }
/* The link into a hop: a line in the hop's tone, the latency over the first */
.ui-prv__link { position: relative; flex: none; align-self: center; width: var(--tc-space-5); height: 2px; border-radius: var(--tc-radius-full); background: var(--tc-border-strong); }
.ui-prv__hop[data-hop="endpoint"] .ui-prv__link { width: var(--tc-space-12); }
.ui-prv__hop[data-state="ok"] .ui-prv__link { background: var(--tc-status-success-solid); }
.ui-prv__hop[data-tone="danger"] .ui-prv__link { background: var(--tc-status-danger-solid); }
.ui-prv__hop[data-tone="warning"] .ui-prv__link { background: var(--tc-status-warning-solid); }
.ui-prv__hop[data-state="unknown"] .ui-prv__link { background: repeating-linear-gradient(90deg, var(--tc-border-strong) 0 3px, transparent 3px 6px); }
.ui-prv__hop[data-state="pending"] .ui-prv__link { background: var(--tc-status-info-solid); animation: ui-prv-pulse var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; }
.ui-prv__latency { position: absolute; bottom: var(--tc-space-1-5); left: 50%; transform: translateX(-50%); color: var(--tc-text-muted); font-size: var(--tc-font-size-2xs); white-space: nowrap; font-variant-numeric: tabular-nums; }
/* A hop is a button: it opens the fields at that hop */
.ui-prv__node { display: grid; flex: 1; align-content: start; gap: var(--tc-space-0-5); min-width: 0; margin: 0; padding: var(--tc-space-2) var(--tc-space-2-5); border: 0; border-radius: var(--tc-radius-lg); background: var(--tc-fill-subtle); color: inherit; font: inherit; text-align: left; cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-prv__node { border-radius: var(--tc-radius-md); background: none; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-prv__node:hover:not(:disabled) { background: var(--tc-fill-hover); }
.ui-prv__node:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-prv__node:disabled { cursor: not-allowed; opacity: 0.55; }
/* The hop that failed is the one the eye goes to */
.ui-prv__hop[data-tone="danger"] .ui-prv__node { background: var(--tc-status-danger-bg); box-shadow: inset 0 0 0 1px var(--tc-status-danger-border); }
.ui-prv__hop[data-tone="warning"] .ui-prv__node { background: var(--tc-status-warning-bg); box-shadow: inset 0 0 0 1px var(--tc-status-warning-border); }
.ui-prv__node-kind { overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); text-overflow: ellipsis; white-space: nowrap; }
.ui-prv__node-value { overflow: hidden; color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); text-overflow: ellipsis; white-space: nowrap; }
:where([data-look="standard"], [data-look="standard"] *).ui-prv__node-value { font-weight: var(--tc-font-weight-medium); }
.ui-prv__node-value--mono { font-family: var(--tc-font-mono); font-weight: var(--tc-font-weight-regular) !important; }
.ui-prv__node-sub { overflow: hidden; color: var(--tc-text-muted); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); text-overflow: ellipsis; white-space: nowrap; }
.ui-prv__node-state { display: flex; align-items: center; gap: var(--tc-space-1); margin-top: var(--tc-space-0-5); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); }
.ui-prv__node-mark { flex: none; width: 6px; height: 6px; border-radius: 50%; background: var(--tc-icon-muted); }
.ui-prv__hop[data-state="ok"] .ui-prv__node-state { color: var(--tc-status-success-fg); }
.ui-prv__hop[data-state="ok"] .ui-prv__node-mark { background: var(--tc-status-success-solid); }
.ui-prv__hop[data-tone="danger"] .ui-prv__node-state { color: var(--tc-status-danger-fg); }
.ui-prv__hop[data-tone="danger"] .ui-prv__node-mark { background: var(--tc-status-danger-solid); }
.ui-prv__hop[data-tone="warning"] .ui-prv__node-state { color: var(--tc-status-warning-fg); }
.ui-prv__hop[data-tone="warning"] .ui-prv__node-mark { background: var(--tc-status-warning-solid); }
.ui-prv__hop[data-state="pending"] .ui-prv__node-state { color: var(--tc-status-info-fg); }
.ui-prv__hop[data-state="pending"] .ui-prv__node-mark { background: var(--tc-status-info-solid); animation: ui-prv-pulse var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; }
.ui-prv__hop[data-state="unknown"] .ui-prv__node-mark { background: none; box-shadow: inset 0 0 0 1px var(--tc-icon-muted); }

/* ---------- The fields, while editing ---------- */
.ui-prv__editor { display: grid; gap: var(--tc-space-3); margin: 0 var(--tc-space-4) var(--tc-space-4); padding: var(--tc-space-3); border-radius: var(--tc-radius-lg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); animation: ui-prv-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-prv__editor[hidden] { display: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-prv__editor { margin: 0; padding: var(--tc-space-3-5) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); border-radius: 0; box-shadow: none; }

/* ---------- Health: what the last test found, and the test ---------- */
.ui-prv__health { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: start; gap: var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-prv__health { margin: 0 var(--tc-space-3) var(--tc-space-3); padding: var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-fill-subtle); }
:where([data-look="clean"], [data-look="clean"] *).ui-prv__health { padding: var(--tc-space-3-5) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-prv__health-icon { display: grid; place-items: center; width: 28px; height: 28px; border-radius: var(--tc-radius-md); color: var(--tc-icon-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-prv__health-icon { background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); }
.ui-prv__health[data-tone="info"] .ui-prv__health-icon { color: var(--tc-status-info-fg); }
.ui-prv__health[data-tone="success"] .ui-prv__health-icon { color: var(--tc-status-success-fg); }
.ui-prv__health[data-tone="warning"] .ui-prv__health-icon { color: var(--tc-status-warning-fg); }
.ui-prv__health[data-tone="danger"] .ui-prv__health-icon { color: var(--tc-status-danger-fg); }
.ui-prv__spin { transform-origin: 12px 12px; animation: ui-prv-spin var(--tc-duration-slowest) linear infinite; }
.ui-prv__health-text { display: grid; gap: var(--tc-space-0-5); min-width: 0; padding-top: var(--tc-space-0-5); }
.ui-prv__health-title { color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); }
:where([data-look="standard"], [data-look="standard"] *).ui-prv__health-title { font-weight: var(--tc-font-weight-medium); }
.ui-prv__health-detail { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); overflow-wrap: anywhere; }
.ui-prv__meta { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); font-variant-numeric: tabular-nums; }
.ui-prv__actions { display: flex; align-items: center; gap: var(--tc-space-1-5); }

/* Buttons: the control and action recipes, small */
.ui-prv__btn { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); margin: 0; padding: 0 var(--tc-control-px-sm); border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: inherit; font: inherit; font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-quick) var(--tc-ease-standard); }
.ui-prv__btn:active:not(:disabled) { transform: scale(0.98); }
.ui-prv__btn:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-prv__btn:disabled { cursor: not-allowed; opacity: 0.55; }
.ui-prv__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-prv__btn--primary:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); }
.ui-prv__btn--secondary { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
.ui-prv__btn--secondary:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-prv__btn--ghost { color: var(--tc-action-ghost-fg); }
.ui-prv__btn--ghost:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); }

/* ---------- Models the endpoint reports, as chips ---------- */
.ui-prv__models { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); transition: opacity var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="standard"], [data-look="standard"] *).ui-prv__models { border-top: 0; padding-top: 0; }
.ui-prv__models[data-dim] { opacity: 0.5; }
.ui-prv__models-head { display: flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-caption-color); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); }
.ui-prv__count { display: grid; place-items: center; min-width: 18px; height: 18px; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-badge); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; letter-spacing: var(--tc-tracking-normal); }
.ui-prv__chips { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); max-height: 9rem; overflow: auto; }
.ui-prv__chip { display: inline-flex; align-items: baseline; gap: var(--tc-space-1-5); max-width: 100%; padding: var(--tc-space-1) var(--tc-space-2-5); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
:where([data-look="clean"], [data-look="clean"] *).ui-prv__chip { background: none; box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-prv__chip-label { color: var(--tc-text-primary); white-space: nowrap; }
.ui-prv__chip-id { overflow: hidden; color: var(--tc-text-secondary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); text-overflow: ellipsis; white-space: nowrap; }
.ui-prv__chip-note { color: var(--tc-status-success-fg); font-size: var(--tc-font-size-xs); white-space: nowrap; }
.ui-prv__chip[data-current] { background: var(--tc-status-success-bg); box-shadow: inset 0 0 0 1px var(--tc-status-success-border); }
.ui-prv__chip[data-missing] { background: var(--tc-status-warning-bg); box-shadow: inset 0 0 0 1px var(--tc-status-warning-border); }
.ui-prv__chip[data-missing] .ui-prv__chip-id { color: var(--tc-text-primary); text-decoration: line-through; text-decoration-color: var(--tc-status-warning-fg); }
.ui-prv__chip[data-missing] .ui-prv__chip-note { color: var(--tc-status-warning-fg); }
.ui-prv__empty { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }

@keyframes ui-prv-spin { to { transform: rotate(360deg); } }
@keyframes ui-prv-pulse { 50% { opacity: 0.35; } }
@keyframes ui-prv-in { from { opacity: 0; transform: translateY(-3px); } }
/* Narrow: the path runs down, labels sit above their fields, the buttons share a row under the health */
@container (max-width: 480px) {
  .ui-prv__path { flex-direction: column; align-items: stretch; padding-left: var(--tc-space-3); padding-right: var(--tc-space-3); }
  .ui-prv__origin { flex-direction: row; justify-content: flex-start; gap: var(--tc-space-2); padding-left: var(--tc-space-2-5); }
  .ui-prv__hop { flex-direction: column; align-items: stretch; }
  .ui-prv__hop[data-hop="endpoint"] .ui-prv__link { width: 2px; height: var(--tc-space-5); }
  .ui-prv__link { width: 2px; height: var(--tc-space-3); align-self: flex-start; margin-left: calc(var(--tc-space-2-5) + var(--tc-space-1)); }
  .ui-prv__hop[data-state="unknown"] .ui-prv__link { background: repeating-linear-gradient(180deg, var(--tc-border-strong) 0 3px, transparent 3px 6px); }
  .ui-prv__latency { bottom: auto; top: 50%; left: var(--tc-space-3); transform: translateY(-50%); }
  .ui-prv__row { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-1); }
  .ui-prv__label { min-height: 0; }
  .ui-prv__editor { margin-left: var(--tc-space-3); margin-right: var(--tc-space-3); }
  .ui-prv__health { grid-template-columns: auto minmax(0, 1fr); }
  .ui-prv__actions { grid-column: 1 / -1; justify-content: flex-end; }
  .ui-prv__test { flex: 1; }
  .ui-prv__models { padding-left: var(--tc-space-3); padding-right: var(--tc-space-3); }
  :where([data-look="clean"], [data-look="clean"] *).ui-prv__health, :where([data-look="clean"], [data-look="clean"] *).ui-prv__editor { padding-left: var(--tc-space-3); padding-right: var(--tc-space-3); }
  .ui-prv__select { max-width: none; }
}
@media (pointer: coarse) {
  .ui-prv__input, .ui-prv__btn { height: 40px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="prv"] *, [data-ui="prv"] *::before, [data-ui="prv"] *::after { animation: none !important; transition: none !important; }
}
[data-ui="prv"][data-disabled] .ui-prv__health-detail { color: var(--tc-text-muted); }
`;
}

if (!customElements.get("tc-provider-connection")) customElements.define("tc-provider-connection", TcProviderConnection);

declare global {
  interface HTMLElementTagNameMap {
    "tc-provider-connection": TcProviderConnection;
  }
}
