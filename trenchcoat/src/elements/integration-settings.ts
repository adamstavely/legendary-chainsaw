import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import type { Look } from "./internal/look";
import { FocusRescueController, rescueFocus } from "./internal/controllers";

/*
 * <tc-integration-settings> – the Lit port of src/components/integration-settings.tsx: the settings card of one
 * connected service. Switch it on and off, generate and copy an API key, set the site address with validation and
 * pick a time zone. Changes collect in a save bar.
 * Clean is one white card: the header with the switch on top, the settings in hairline-separated sections below, and
 * the save bar as the card's last row; icons are finer, the time zone search carries a magnifier and "Generating…"
 * shimmers instead of showing a spinner.
 *
 *   <tc-integration-settings name="Shopify" .logo=${logo} .values=${{ siteUrl: "shop.com" }}></tc-integration-settings>
 *
 * The host is the region (role="region", named "<name> settings").
 */

export type IntegrationValues = { enabled: boolean; siteUrl: string; timeZone: string; apiKey: string | null };
/** Creates a key – returns it, or a promise of it; a rejection shows an error and keeps the old key */
export type IntegrationKeyGenerator = (options: { signal: AbortSignal }) => string | Promise<string>;
/** Saves the values; a rejection keeps the changes unsaved and shows an error */
export type IntegrationSaver = (values: IntegrationValues, options: { signal: AbortSignal }) => void | Promise<void>;
/** Switches the service on or off; a promise keeps the switch pending, a rejection leaves it as it was */
export type IntegrationToggler = (enabled: boolean, options: { signal: AbortSignal }) => void | Promise<unknown>;

const defaultZones = [
  "(GMT −08:00) Los Angeles",
  "(GMT −05:00) New York",
  "(GMT −03:00) São Paulo",
  "(GMT +00:00) London",
  "(GMT +01:00) Berlin",
  "(GMT +01:00) Amsterdam",
  "(GMT +01:00) Warsaw",
  "(GMT +02:00) Athens",
  "(GMT +04:00) Dubai",
  "(GMT +05:30) Mumbai",
  "(GMT +08:00) Singapore",
  "(GMT +09:00) Tokyo",
  "(GMT +10:00) Sydney",
];

// Warns once per page (not per instance) when a key is made up because generateKey is missing
let warnedDemoKey = false;
const warnDemoKey = () => {
  if (warnedDemoKey) return;
  warnedDemoKey = true;
  console.warn(
    "IntegrationSettings: no onGenerateKey handler – simulating key generation. Pass `demo` to keep the simulation, or `onGenerateKey` to wire it up. The simulation will be off by default in the next major version.",
  );
};

const KEYS = ["enabled", "siteUrl", "timeZone", "apiKey"] as const;
const sameValues = (a: IntegrationValues, b: IntegrationValues) => KEYS.every((k) => a[k] === b[k]);
/** The draft on new saved values: fields that weren't edited (still equal the old saved value) take the new one */
const rebase = (draft: IntegrationValues, from: IntegrationValues, to: IntegrationValues): IntegrationValues => {
  const out = { ...draft };
  for (const k of KEYS) if (draft[k] === from[k]) (out as Record<string, unknown>)[k] = to[k];
  return out;
};
const INTEGER = new Intl.NumberFormat("en-US");
const DOMAIN = /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i;
const tidy = (v: string) => v.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
let uidCount = 0;

const icon = (d: string, look: Look, size = 16) =>
  html`<svg class="ui-is__glyph" viewBox="0 0 16 16" width=${size} height=${size} fill="none" stroke="currentColor" stroke-width=${look === "clean" ? "1.2" : "1.4"} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;
const keyIcon = () =>
  html`<svg class="ui-is__glyph-solid" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">${svg`<path d="M10.5 1.5a4 4 0 0 0-3.86 5.05L1.8 11.4a1 1 0 0 0-.3.7v1.9a.5.5 0 0 0 .5.5h1.9a.5.5 0 0 0 .5-.5V13h1v-1h1v-1l.95-.95A4 4 0 1 0 10.5 1.5Zm1 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path>`}</svg>`;
/** Standard: a filled clock face · Clean: a line clock */
const clockIcon = (look: Look) =>
  look === "clean"
    ? icon("M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM8 4.5V8l2.5 1.5", look)
    : html`<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">${svg`<circle cx="8" cy="8" r="6.5" fill="var(--tc-text-muted)"></circle><path d="M8 4.5V8h3" fill="none" stroke="var(--tc-surface-raised)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>`}</svg>`;

/**
 * The settings card of one connected service: a switch, an API key, the site address and a time zone, with a save bar.
 * @tag tc-integration-settings
 * @fires tc-values-change - The saved values changed: after a save, or when the switch flipped ({ values: IntegrationValues }); cancelable
 */
export class TcIntegrationSettings extends TcElement {
  static override ui = "is";

  /** The service's name, e.g. "Shopify" */
  @property() accessor name = "";
  /** The service's logo (cloned) */
  @property({ attribute: false }) accessor logo: Element | undefined = undefined;
  /** Small number next to the name, e.g. synced orders */
  @property({ type: Number }) accessor count: number | undefined = undefined;
  /** Line under the name, e.g. when it was connected */
  @property() accessor meta: string | undefined = undefined;
  /** The saved values. Edits collect in the save bar; fields that weren't edited follow new values right away */
  @property({ attribute: false }) accessor values: Partial<IntegrationValues> = {};
  /** Helper text under the address field */
  @property({ attribute: "site-hint" }) accessor siteHint = "Your store's primary domain, without https://";
  /** The time zones the picker offers, as labels like "(GMT +01:00) Berlin" – the first is the default */
  @property({ attribute: false }) accessor timeZones: string[] = defaultZones;
  /** Creates a key; without it a random `sk_demo_…` key is made up (and warns once, unless `demo` is set) */
  @property({ attribute: false }) accessor generateKey: IntegrationKeyGenerator | undefined = undefined;
  /** Called with all values when Save is pressed */
  @property({ attribute: false }) accessor saveValues: IntegrationSaver | undefined = undefined;
  /** Called when the switch flips */
  @property({ attribute: false }) accessor toggleEnabled: IntegrationToggler | undefined = undefined;
  /** Demo mode: keys are made up silently when generateKey is missing */
  @property({ type: Boolean }) accessor demo = false;

  @state() private accessor draft: IntegrationValues = this.full({});
  @state() private accessor keyBusy = false;
  @state() private accessor toggling = false;
  @state() private accessor toggleError = "";
  @state() private accessor revealed = false;
  @state() private accessor copied = false;
  @state() private accessor saving = false;
  @state() private accessor keyError = "";
  @state() private accessor saveError = "";
  @state() private accessor announce = "";
  @state() private accessor showUrlError = false;
  @state() private accessor zoneOpen = false;
  @state() private accessor zoneQuery = "";
  @state() private accessor zoneActive = 0;

  private base: IntegrationValues | null = null;
  private latestSaved: IntegrationValues | null = null;
  private uid = `tc-is-${++uidCount}`;
  private timers: number[] = [];
  private controller: AbortController | null = null;
  private ownName = false;

  constructor() {
    super();
    // Focus never drops to <body>: Generate ↔ Regenerate share a focus key; a closing save bar hands focus to the field
    new FocusRescueController(this, () => this.focusField() ?? this.querySelector<HTMLElement>(".ui-is__switch"));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    this.ownName ||= this.hasAttribute("aria-label") || this.hasAttribute("aria-labelledby");
    this.controller = new AbortController();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    // Running work is aborted, and results that arrive later are ignored
    this.controller?.abort();
    this.controller = null;
    this.timers.forEach(clearTimeout);
    this.timers = [];
    window.removeEventListener("pointerdown", this.away);
  }

  private full(v: Partial<IntegrationValues> | undefined): IntegrationValues {
    return { enabled: true, siteUrl: "", timeZone: (this.timeZones ?? defaultZones)[0], apiKey: null, ...v };
  }
  private get saved() {
    return this.full(this.values);
  }
  private signal() {
    return (this.controller ??= new AbortController()).signal;
  }
  private focusField = () => this.querySelector<HTMLElement>(".ui-is__field input");
  private set(patch: Partial<IntegrationValues>) {
    this.draft = { ...this.draft, ...patch };
  }
  private setSaved(next: IntegrationValues) {
    this.latestSaved = next;
    if (this.emit("tc-values-change", { values: next }, { cancelable: true })) this.values = next;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // The draft follows new saved values: fields that weren't edited take them
    const saved = this.saved;
    if (!this.base) {
      this.draft = saved;
      this.base = saved;
    } else if (!sameValues(saved, this.base)) {
      this.draft = rebase(this.draft, this.base, saved);
      this.base = saved;
    }
    this.latestSaved = saved;
    this.toggleAttribute("data-off", !this.draft.enabled);
  }

  protected override updated(changed: PropertyValues) {
    if (!this.ownName) this.setAttribute("aria-label", `${this.name} settings`);
    if (changed.has("zoneOpen")) {
      if (this.zoneOpen) {
        window.addEventListener("pointerdown", this.away);
        this.querySelector<HTMLInputElement>(".ui-is__menu-search input")?.focus();
      } else window.removeEventListener("pointerdown", this.away);
    }
    if (this.zoneOpen) {
      const at = this.zoneAt();
      if (at >= 0) document.getElementById(this.optionId(at))?.scrollIntoView?.({ block: "nearest" });
    }
  }

  /* ---------- Actions ---------- */

  private async generate() {
    if (this.keyBusy) return;
    this.keyBusy = true;
    this.keyError = "";
    if (!this.generateKey && !this.demo) warnDemoKey();
    try {
      // The made-up key says it's a demo, so it can't pass for a live one
      const key = await (this.generateKey
        ? this.generateKey({ signal: this.signal() })
        : new Promise<string>((r) =>
            this.timers.push(
              window.setTimeout(() => r(`sk_demo_${Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("")}`), 700),
            ),
          ));
      if (!this.isConnected) return;
      this.set({ apiKey: key });
      this.revealed = true;
      this.copied = false;
      this.announce = "New key generated. Copy it now – it is shown in full only once.";
    } catch {
      if (this.isConnected) this.keyError = "The key couldn't be generated. Try again.";
    } finally {
      if (this.isConnected) this.keyBusy = false;
    }
  }

  private async copy() {
    if (!this.draft.apiKey) return;
    try {
      await navigator.clipboard.writeText(this.draft.apiKey);
    } catch {
      // Denied, or no clipboard at all (insecure page)
      if (this.isConnected) this.keyError = "Couldn't copy the key – select it and copy it by hand.";
      return;
    }
    if (!this.isConnected) return;
    this.keyError = "";
    this.copied = true;
    this.announce = "Key copied to the clipboard.";
    this.timers.push(window.setTimeout(() => (this.copied = false), 1400));
  }

  private async saveChanges() {
    const url = tidy(this.draft.siteUrl);
    if (!(url === "" || DOMAIN.test(url)) || this.saving) return;
    this.saving = true;
    this.saveError = "";
    const next = { ...this.draft, siteUrl: url };
    try {
      await this.saveValues?.(next, { signal: this.signal() });
      if (!this.isConnected) return;
      // The save bar closes (inert): focus goes to the address field first
      rescueFocus(this.querySelector(".ui-is__save"), [this.focusField()]);
      this.draft = next;
      this.base = next;
      this.setSaved(next);
      this.announce = "Changes saved.";
    } catch {
      if (this.isConnected) this.saveError = "Couldn't save – try again.";
    } finally {
      if (this.isConnected) this.saving = false;
    }
  }

  private async toggle() {
    if (this.toggling) return;
    const enabled = !this.draft.enabled;
    this.toggleError = "";
    const result = this.toggleEnabled?.(enabled, { signal: this.signal() });
    if (result instanceof Promise) {
      this.toggling = true;
      try {
        await result;
      } catch {
        if (this.isConnected) {
          this.toggling = false;
          this.toggleError = enabled ? `Couldn't switch ${this.name} on – try again.` : `Couldn't pause ${this.name} – try again.`;
        }
        return;
      }
      if (!this.isConnected) return;
      this.toggling = false;
    }
    // The switch saves at once: the draft and the saved values both flip
    this.set({ enabled });
    this.base = { ...(this.base ?? this.saved), enabled };
    this.setSaved({ ...(this.latestSaved ?? this.saved), enabled });
  }

  private discard() {
    rescueFocus(this.querySelector(".ui-is__save"), [this.focusField()]);
    this.draft = this.saved;
    this.saveError = "";
    this.showUrlError = false;
    this.announce = "Changes discarded.";
  }

  /* ---------- The time zone picker: a combobox search over a listbox (APG) ---------- */

  private optionId = (i: number) => `${this.uid}-o${i}`;
  private zoneList() {
    const q = this.zoneQuery.trim().toLowerCase();
    return this.timeZones.filter((z) => z.toLowerCase().includes(q));
  }
  private zoneAt() {
    return Math.min(this.zoneActive, this.zoneList().length - 1);
  }
  private away = (e: PointerEvent) => {
    if (!this.querySelector(".ui-is__zone")?.contains(e.target as Node)) this.zoneOpen = false;
  };
  // Focus moves to the trigger before the menu goes, so it never drops to <body>
  private closeZones() {
    this.querySelector<HTMLElement>(".ui-is__zone-btn")?.focus({ preventScroll: true });
    this.zoneOpen = false;
  }
  private pickZone(z: string) {
    this.set({ timeZone: z });
    this.closeZones();
  }
  private openZones() {
    this.zoneQuery = "";
    this.zoneActive = Math.max(0, this.timeZones.indexOf(this.draft.timeZone));
    this.zoneOpen = true;
  }
  private onSearchKey(e: KeyboardEvent) {
    if (e.isComposing) return;
    const list = this.zoneList();
    const at = this.zoneAt();
    const last = list.length - 1;
    const move = (i: number) => {
      e.preventDefault();
      this.zoneActive = Math.max(0, Math.min(last, i));
    };
    if (e.key === "ArrowDown") move(at + 1);
    else if (e.key === "ArrowUp") move(at - 1);
    else if (e.key === "Home" && e.ctrlKey) move(0);
    else if (e.key === "End" && e.ctrlKey) move(last);
    else if (e.key === "Enter") {
      e.preventDefault();
      if (list[at]) this.pickZone(list[at]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      this.closeZones();
    } else if (e.key === "Tab") this.zoneOpen = false;
  }

  private renderZones(look: Look, labelledBy: string) {
    const clean = look === "clean";
    const value = this.draft.timeZone;
    const id = this.uid;
    const list = this.zoneList();
    const at = this.zoneAt();
    return html`<div
      class="ui-is__zone"
      @focusout=${(e: FocusEvent) => {
        // Focus left the picker (Tab, or a click elsewhere): close
        if (this.zoneOpen && !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)) this.zoneOpen = false;
      }}
    >
      <button
        id=${`${id}-trigger`}
        type="button"
        class="ui-is__field ui-is__zone-btn"
        aria-haspopup="listbox"
        aria-expanded=${this.zoneOpen ? "true" : "false"}
        aria-labelledby=${`${labelledBy} ${id}-trigger`}
        @click=${() => (this.zoneOpen ? (this.zoneOpen = false) : this.openZones())}
        @keydown=${(e: KeyboardEvent) => {
          if (!this.zoneOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            this.openZones();
          }
        }}
      >
        <span class="ui-is__zone-value">${value}</span>${clockIcon(look)}
      </button>
      ${this.zoneOpen
        ? html`<div class="ui-is__menu">
            <div class="ui-is__menu-search">
              ${clean ? icon("M7 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM13.5 13.5 10.6 10.6", look) : nothing}<input
                role="combobox"
                aria-expanded="true"
                aria-controls=${`${id}-list`}
                aria-autocomplete="list"
                aria-activedescendant=${ifDefined(at >= 0 ? this.optionId(at) : undefined)}
                .value=${live(this.zoneQuery)}
                @input=${(e: InputEvent) => {
                  this.zoneQuery = (e.target as HTMLInputElement).value;
                  this.zoneActive = 0;
                }}
                @keydown=${this.onSearchKey}
                placeholder="Search city or offset"
                aria-label="Search time zones"
              />
            </div>
            ${list.length === 0 ? html`<p class="ui-is__menu-empty">No time zone matches.</p>` : nothing}
            <div class="ui-is__menu-list" id=${`${id}-list`} role="listbox" aria-labelledby=${labelledBy}>
              ${repeat(
                list,
                (z) => z,
                (z, i) => html`<div
                  id=${this.optionId(i)}
                  role="option"
                  aria-selected=${z === value ? "true" : "false"}
                  ?data-active=${i === at}
                  class="ui-is__option"
                  @pointerdown=${(e: PointerEvent) => e.preventDefault()}
                  @pointermove=${() => (this.zoneActive = i)}
                  @click=${() => this.pickZone(z)}
                >
                  ${z}${z === value ? icon("m3.5 8.5 3 3 6-7", look, clean ? 16 : 14) : nothing}
                </div>`,
              )}
            </div>
          </div>`
        : nothing}
    </div>`;
  }

  /* ---------- Rendering ---------- */

  private renderKey(look: Look) {
    const clean = look === "clean";
    const { apiKey } = this.draft;
    const busy = this.keyBusy;
    const revealed = this.revealed;
    const masked = apiKey ? `${apiKey.slice(0, 8)}${"•".repeat(14)}${apiKey.slice(-4)}` : "";
    const size = clean ? 16 : 15;
    const onGenerate = () => !busy && this.generate();
    return html`<div class="ui-is__section">
      ${clean ? html`<span class="ui-is__label">API key</span>` : nothing}
      ${apiKey
        ? html`<div class="ui-is__key" data-new=${ifDefined(revealed ? "true" : undefined)}>
            <code>${revealed ? apiKey : masked}</code>
            <button type="button" class="ui-is__mini" aria-label=${revealed ? "Hide key" : "Show key"} @click=${() => (this.revealed = !this.revealed)}>
              ${icon(revealed ? "M2 8s2.2-4.5 6-4.5S14 8 14 8s-2.2 4.5-6 4.5S2 8 2 8ZM2.5 2.5l11 11" : "M2 8s2.2-4.5 6-4.5S14 8 14 8s-2.2 4.5-6 4.5S2 8 2 8ZM8 9.8a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z", look, size)}
            </button>
            <button type="button" class="ui-is__mini" aria-label="Copy key" @click=${this.copy}>
              ${icon(this.copied ? "m3.5 8.5 3 3 6-7" : "M5.5 5.5V3.5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M3.5 5.5h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Z", look, size)}
            </button>
            <button type="button" class="ui-is__regen" data-focus-key="key" @click=${onGenerate} .ariaDisabled=${busy ? "true" : null}>
              ${busy ? html`<span class="ui-is__spinner" aria-hidden="true"></span><span class="ui-is__sr">Regenerating…</span>` : "Regenerate"}
            </button>
          </div>`
        : html`<button type="button" class="ui-is__generate" data-focus-key="key" @click=${onGenerate} .ariaDisabled=${busy ? "true" : null}>
            ${clean
              ? html`${busy
                  ? html`<span class="ui-is__shimmer">Generating…<span class="ui-is__shine" aria-hidden="true"><span>Generating…</span></span></span>`
                  : html`<span>Generate a new API key</span>`}${keyIcon()}`
              : html`<span>${busy ? "Generating…" : "Generate a new API key"}</span>${busy ? html`<span class="ui-is__spinner" aria-hidden="true"></span>` : keyIcon()}`}
          </button>`}
      ${this.keyError ? html`<p class="ui-is__note" data-error="" role="alert">${this.keyError}</p>` : nothing}
      ${apiKey && revealed && !this.keyError ? html`<p class="ui-is__note">${this.copied ? "Copied to the clipboard." : "Copy it now – it is shown in full only once."}</p>` : nothing}
    </div>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const clean = look === "clean";
    const values = this.draft;
    const saved = this.saved;
    const url = tidy(values.siteUrl);
    const urlValid = url === "" || DOMAIN.test(url);
    const urlError = this.showUrlError && !urlValid;
    const dirty = values.siteUrl !== saved.siteUrl || values.timeZone !== saved.timeZone || values.apiKey !== saved.apiKey;
    const urlId = `${this.uid}-url`;
    const hintId = `${this.uid}-hint`;

    const sections = html`
      ${this.renderKey(look)}
      <div class="ui-is__section">
        <label class="ui-is__label" for=${urlId}>Site address</label>
        <div class="ui-is__field" data-invalid=${ifDefined(urlError ? "true" : undefined)}>
          <span class="ui-is__prefix">https://</span>
          <input
            id=${urlId}
            .value=${live(values.siteUrl)}
            @input=${(e: InputEvent) => {
              const next = (e.target as HTMLInputElement).value.replace(/^https?:\/\//i, "");
              this.set({ siteUrl: next });
              // A shown error clears as soon as the address is fixed
              const v = tidy(next);
              if (v === "" || DOMAIN.test(v)) this.showUrlError = false;
            }}
            @blur=${() => {
              const v = tidy(this.draft.siteUrl);
              this.showUrlError = !(v === "" || DOMAIN.test(v));
            }}
            placeholder="yourstore.com"
            inputmode="url"
            autocomplete="off"
            spellcheck="false"
            aria-invalid=${urlError ? "true" : "false"}
            aria-describedby=${hintId}
          />
          ${url && urlValid ? html`<span class="ui-is__ok" aria-hidden="true">${icon("m3.5 8.5 3 3 6-7", look, clean ? 16 : 14)}</span>` : nothing}
        </div>
        <p class="ui-is__hint" id=${hintId} data-error=${ifDefined(urlError ? "true" : undefined)} aria-live="polite">
          ${urlError ? "That doesn't look like a domain – try something like yourstore.com" : this.siteHint}
        </p>
      </div>
      <div class="ui-is__section">
        <span class="ui-is__label" id=${`${urlId}-tz`}>Time zone</span>
        ${this.renderZones(look, `${urlId}-tz`)}
      </div>
    `;

    const saveBar = html`<div class="ui-is__save" data-open=${ifDefined(dirty ? "true" : undefined)} .inert=${!dirty}>
      <div class="ui-is__save-inner">
        ${this.saveError
          ? html`<span class=${clean ? "ui-is__save-text" : "ui-is__save-error"} data-error=${ifDefined(clean ? "" : undefined)} role="alert">${this.saveError}</span>`
          : clean
            ? html`<span class="ui-is__save-text">Unsaved changes</span>`
            : html`<span>Unsaved changes</span>`}
        <div class="ui-is__save-actions">
          <button type="button" class="ui-is__btn" @click=${this.discard}>Discard</button>
          <button type="button" class="ui-is__btn ui-is__btn--primary" @click=${this.saveChanges} ?disabled=${!urlValid || this.saving}>${this.saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>`;

    return html`
      <header class="ui-is__head">
        <span class="ui-is__logo">${this.logo ? this.logo.cloneNode(true) : nothing}</span>
        <span class="ui-is__who">
          <span class="ui-is__name">
            <span class="ui-is__name-text">${this.name}</span>
            ${this.count !== undefined && this.count !== null ? html`<span class="ui-is__count">${INTEGER.format(this.count)}</span>` : nothing}
          </span>
          <span class="ui-is__meta" data-error=${ifDefined(this.toggleError ? "" : undefined)} role=${ifDefined(this.toggleError ? "alert" : undefined)}>
            ${this.toggleError || (values.enabled ? (this.meta ?? "") : "Paused – no data is synced")}
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked=${values.enabled ? "true" : "false"}
          .ariaBusy=${this.toggling ? "true" : null}
          aria-label=${`${this.name} sync`}
          class="ui-is__switch"
          data-pending=${ifDefined(this.toggling ? "true" : undefined)}
          @click=${this.toggle}
        >
          <span></span>
        </button>
      </header>
      <div class="ui-is__fold" data-open=${ifDefined(values.enabled ? "true" : undefined)} .inert=${!values.enabled}>
        <div class="ui-is__fold-inner">${clean ? sections : html`<div class="ui-is__card">${sections}</div>`}${saveBar}</div>
      </div>
      <span class="ui-is__sr" role="status">${this.announce}</span>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="is"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 560px;
  /* The tray pattern: the header lives on the tray, the settings in the card on top of it */
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="is"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="is"] {
  /* Strokes are shadows: a 0.5px hairline plus a soft lift */
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 560px;
  /* One white card – the edge is a shadow, not a border */
  border-radius: var(--tc-radius-lg);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="is"] *, [data-ui="is"] *::before, [data-ui="is"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="is"] button { margin: 0; font: inherit; color: inherit; cursor: pointer; }
[data-ui="is"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__head { display: flex; align-items: center; gap: var(--tc-space-3-5); padding: var(--tc-space-3-5) var(--tc-space-4) var(--tc-space-3-5) var(--tc-space-3-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__logo {
  display: grid;
  place-items: center;
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: var(--tc-radius-xl);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
}
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="is"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="is"]) svg { display: block; flex: none; }
/* Header: logo tile, name with count, meta line and the switch */
:where([data-look="clean"], [data-look="clean"] *).ui-is__head { display: flex; align-items: center; gap: var(--tc-space-3); padding: var(--tc-space-4); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__logo {
  display: grid;
  place-items: center;
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: var(--tc-radius-md);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
}
.ui-is__logo svg { width: 22px; height: 22px; }
.ui-is__who { display: grid; flex: 1; min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-is__name { display: inline-flex; align-items: center; gap: var(--tc-space-2); font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-relaxed); }
/* Count: the pill pattern */
.ui-is__count {
  display: inline-flex;
  align-items: center;
  flex: none;
  height: var(--tc-pill-h);
  padding: 0 var(--tc-pill-px);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-fill-default);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-pill-font-weight);
  line-height: var(--tc-line-height-tight);
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-secondary);
}
:where([data-look="standard"], [data-look="standard"] *).ui-is__meta { overflow: hidden; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); white-space: nowrap; text-overflow: ellipsis; color: var(--tc-text-muted); }
/* The switch pattern; the off track is --tc-switch-off (≥ 3:1), on is the accent */
.ui-is__switch {
  position: relative;
  flex: none;
  width: var(--tc-switch-w);
  height: var(--tc-switch-h);
  padding: 0;
  border: 0;
  border-radius: var(--tc-switch-radius);
  background: var(--tc-switch-off) !important;
  transition: background-color var(--tc-duration-base) var(--tc-ease-standard);
}
.ui-is__switch[aria-checked="true"] { background: var(--tc-switch-on) !important; }
.ui-is__switch span {
  position: absolute;
  top: var(--tc-space-0-5);
  left: var(--tc-space-0-5);
  width: var(--tc-switch-knob);
  height: var(--tc-switch-knob);
  /* the track radius less the 2px inset */
  border-radius: calc(var(--tc-switch-radius) - var(--tc-space-0-5));
  background: var(--tc-switch-knob-bg);
  box-shadow: var(--tc-shadow-control);
  transition: transform var(--tc-duration-moderate) var(--tc-ease-move);
}
.ui-is__switch[aria-checked="true"] span { transform: translateX(calc(var(--tc-switch-w) - var(--tc-switch-h))); }
/* A hit area of at least 24 × 24 around the small switch */
.ui-is__switch::after { content: ""; position: absolute; inset: -8px -6px; }
/* Switching off folds the settings away */
:where([data-look="standard"], [data-look="standard"] *).ui-is__fold { display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-moderate) var(--tc-ease-standard); opacity: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__name { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; font-size: var(--tc-font-size-lg-plus); line-height: var(--tc-line-height-loose); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__name-text { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__meta { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); white-space: nowrap; text-overflow: ellipsis; color: var(--tc-text-muted); }
/* A small switch: 28×16, white knob with the card shadow */
/* Switching off folds the settings away – only this part animates, the header stays */
:where([data-look="clean"], [data-look="clean"] *).ui-is__fold { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-slower) var(--tc-ease-move), opacity var(--tc-duration-moderate) var(--tc-ease-standard); }
.ui-is__fold[data-open] { grid-template-rows: 1fr; opacity: 1; }
:where([data-look="standard"], [data-look="standard"] *).ui-is__fold-inner { min-height: 0; overflow: hidden; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__fold-inner { min-width: 0; min-height: 0; overflow: hidden; }
.ui-is__fold[data-open] .ui-is__fold-inner { overflow: visible; }
:where([data-look="standard"], [data-look="standard"] *).ui-is__card {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="standard"], [data-look="standard"] *).ui-is__section { padding: var(--tc-space-4) var(--tc-space-4-5) var(--tc-space-4-5); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__section + .ui-is__section { border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__label { display: block; margin-bottom: var(--tc-space-2); font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__generate {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: var(--tc-field-h);
  padding: 0 var(--tc-field-px);
  border: 0;
  border-radius: var(--tc-field-radius);
  background: var(--tc-fill-default);
  font-size: var(--tc-font-size-lg) !important;
  color: var(--tc-text-muted) !important;
  text-align: left;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-is__generate:hover:not([aria-disabled="true"]) { background: var(--tc-fill-strong); color: var(--tc-text-primary) !important; }
/* Sections sit right in the card, split by hairlines */
:where([data-look="clean"], [data-look="clean"] *).ui-is__section { padding: var(--tc-space-3-5) var(--tc-space-4) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__label { display: block; margin: 0 0 var(--tc-space-1-5); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
/* No key yet: a quiet full-width slot */
:where([data-look="clean"], [data-look="clean"] *).ui-is__generate {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2);
  width: 100%;
  height: 32px;
  padding: 0 var(--tc-space-2) 0 var(--tc-space-2-5) !important;
  border-radius: var(--tc-radius-md);
  background: var(--tc-fill-subtle) !important;
  box-shadow: inset 0 0 0 0.5px var(--tc-border-default);
  color: var(--tc-text-secondary) !important;
  text-align: left;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-is__generate svg { color: var(--tc-icon-muted); transition: color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__generate:hover:not([aria-disabled="true"]) { background: var(--tc-fill-default) !important; color: var(--tc-text-primary) !important; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__generate:hover:not([aria-disabled="true"]) svg { color: var(--tc-text-primary); }
.ui-is__generate[aria-disabled="true"] { cursor: progress; }
:where([data-look="standard"], [data-look="standard"] *).ui-is__key {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1);
  height: var(--tc-field-h);
  padding: 0 6px 0 var(--tc-field-px);
  border-radius: var(--tc-field-radius);
  background: var(--tc-fill-default);
  animation: ui-is-in var(--tc-duration-slow) var(--tc-ease-move);
}
:where([data-look="standard"], [data-look="standard"] *).ui-is__key[data-new] { background: var(--tc-status-success-bg); box-shadow: inset 0 0 0 1px var(--tc-status-success-border); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__key code {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--tc-font-size-sm);
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--tc-text-secondary);
}
:where([data-look="standard"], [data-look="standard"] *).ui-is__mini {
  display: grid;
  place-items: center;
  flex: none;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 0;
  border-radius: var(--tc-radius-md);
  background: transparent;
  color: var(--tc-text-muted) !important;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-is__mini:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary) !important; }
/* Regenerate: looks exactly like a small Button secondary */
.ui-is__regen {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  min-width: 88px;
  height: var(--tc-control-h-sm);
  margin-left: var(--tc-space-0-5);
  padding: 0 var(--tc-control-px-sm) !important;
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-action-secondary-bg) !important;
  box-shadow: var(--tc-action-secondary-shadow);
  font-size: var(--tc-control-font-size) !important;
  font-weight: var(--tc-control-font-weight);
  color: var(--tc-action-secondary-fg) !important;
  transition: box-shadow var(--tc-duration-quick) var(--tc-ease-standard);
}
.ui-is__regen:hover:not([aria-disabled="true"]) { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-is__regen[aria-disabled="true"] { cursor: progress; }
:where([data-look="standard"], [data-look="standard"] *).ui-is__note { margin: var(--tc-space-2) 0 0; font-size: var(--tc-font-size-sm); color: var(--tc-status-success-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__note[data-error] { color: var(--tc-status-danger-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__save-error { color: var(--tc-status-danger-fg); }
/* The key: a field-like row with ghost buttons; a fresh key gets a light green fill */
:where([data-look="clean"], [data-look="clean"] *).ui-is__key {
  display: flex;
  align-items: center;
  gap: var(--tc-space-0-5);
  height: 36px;
  padding: 0 var(--tc-space-1) 0 var(--tc-space-2-5);
  border-radius: var(--tc-radius-md);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-shadow-raised);
  transition: background-color var(--tc-duration-moderate) var(--tc-ease-standard);
  animation: ui-is-in var(--tc-duration-slow) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-is__key[data-new] { background: var(--tc-status-success-bg); box-shadow: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__key code {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--tc-text-primary);
}
:where([data-look="clean"], [data-look="clean"] *).ui-is__mini {
  display: grid;
  place-items: center;
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: var(--tc-radius-sm);
  color: var(--tc-icon-muted) !important;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-is__mini:hover { background: var(--tc-fill-subtle) !important; color: var(--tc-text-primary) !important; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__key[data-new] .ui-is__mini:hover { background: var(--tc-fill-default) !important; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__note { margin: var(--tc-space-1-5) 0 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-status-success-fg); animation: ui-is-in var(--tc-duration-moderate) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__note[data-error] { color: var(--tc-status-danger-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__save-text[data-error] { color: var(--tc-status-danger-fg); }
.ui-is__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--tc-border-strong);
  border-top-color: var(--tc-text-primary);
  border-radius: 50%;
  animation: ui-is-spin var(--tc-duration-reveal) linear infinite;
}
/* Fields: the field pattern – border-control ring (≥ 3:1), focus ring + halo on the wrapper, red ring when invalid */
.ui-is__field {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1);
  width: 100%;
  height: var(--tc-field-h);
  padding: 0 var(--tc-field-px) !important;
  border: 0;
  border-radius: var(--tc-field-radius);
  background: var(--tc-field-bg) !important;
  box-shadow: var(--tc-field-shadow);
  font-size: var(--tc-field-font-size) !important;
  color: var(--tc-text-primary) !important;
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-is__field:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-is__field:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-is__field.ui-is__zone-btn:focus-visible { outline: none; }
.ui-is__field[data-invalid] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-is__field[data-invalid]:focus-within { box-shadow: var(--tc-field-shadow-invalid), 0 0 0 var(--tc-focus-halo-width) color-mix(in srgb, var(--tc-status-danger-solid) 24%, transparent); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__prefix { color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__field input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  background: transparent;
  font: inherit;
  color: var(--tc-text-primary);
}
/* Fields: white with the hairline shadow; invalid gets a light red fill */
:where([data-look="clean"], [data-look="clean"] *).ui-is__prefix { flex: none; color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__field input {
  flex: 1;
  min-width: 0;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  color: var(--tc-text-primary);
}
.ui-is__field input::placeholder,
.ui-is__menu-search input::placeholder { color: var(--tc-text-placeholder); opacity: 1; }
/* The wrapper shows the focus ring (field pattern) */
.ui-is__field input:focus,
.ui-is__menu-search input:focus { outline: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-is__ok { display: grid; color: var(--tc-status-success-fg); animation: ui-is-in var(--tc-duration-moderate) var(--tc-ease-move); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__hint { margin: var(--tc-space-2) 0 0; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__hint[data-error] { color: var(--tc-status-danger-fg); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__ok { display: grid; flex: none; color: var(--tc-status-success-fg); animation: ui-is-in var(--tc-duration-moderate) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__hint { margin: var(--tc-space-1-5) 0 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__hint[data-error] { color: var(--tc-status-danger-fg); }
.ui-is__zone { position: relative; }
.ui-is__zone-btn { justify-content: space-between; gap: var(--tc-space-2); text-align: left; }
/* Zone menu: the menu pattern */
.ui-is__menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: var(--tc-z-dropdown);
  padding: var(--tc-menu-padding);
  border-radius: var(--tc-menu-radius);
  background: var(--tc-menu-bg);
  box-shadow: var(--tc-menu-shadow);
  transform-origin: top center;
  animation: ui-is-drop var(--tc-duration-base) var(--tc-ease-move);
}
/* Search inside the menu: a sunken field with the field ring */
.ui-is__menu-search {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  height: var(--tc-control-h-md);
  margin: 0 0 var(--tc-space-1);
  padding: 0 var(--tc-menu-item-px);
  border-radius: calc(var(--tc-menu-radius) - var(--tc-menu-padding));
  background: var(--tc-field-bg-sunken);
  box-shadow: var(--tc-field-shadow);
  color: var(--tc-icon-muted);
}
.ui-is__menu-search:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-is__menu-search input {
  flex: 1;
  min-width: 0;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  font: inherit;
  font-size: var(--tc-menu-item-font-size);
  color: var(--tc-text-primary);
}
.ui-is__menu-list { display: grid; gap: var(--tc-space-0-5); max-height: 200px; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; }
.ui-is__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2);
  min-height: var(--tc-menu-item-h);
  padding: 0 var(--tc-menu-item-px);
  border-radius: var(--tc-menu-item-radius);
  font-size: var(--tc-menu-item-font-size);
  color: var(--tc-text-primary);
  cursor: pointer;
  transition: background-color var(--tc-duration-instant) var(--tc-ease-decelerate);
}
/* The active option (keyboard or pointer) – focus stays in the search field, so the ring marks it */
.ui-is__option[data-active] { background: var(--tc-menu-item-hover); }
.ui-is__menu:has(.ui-is__menu-search:focus-within) .ui-is__option[data-active] { box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
.ui-is__option[aria-selected="true"] { color: var(--tc-menu-item-selected-fg); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__menu-empty { margin: 0; padding: var(--tc-space-3) var(--tc-space-2-5); font-size: var(--tc-font-size-md); color: var(--tc-text-muted); }
/* Save bar in the gray extension, slides open when something changed */
:where([data-look="standard"], [data-look="standard"] *).ui-is__save { display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--tc-duration-slow) var(--tc-ease-move); }
.ui-is__zone-value { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__zone-btn svg { color: var(--tc-icon-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__option svg { animation: ui-is-pop var(--tc-duration-moderate) var(--tc-ease-move); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__menu-empty { margin: 0; padding: var(--tc-space-2-5) var(--tc-space-2); text-align: center; color: var(--tc-text-muted); }
/* Save bar: the card's last row under a hairline, slides open when something changed */
:where([data-look="clean"], [data-look="clean"] *).ui-is__save { display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: 0fr; transition: grid-template-rows var(--tc-duration-slow) var(--tc-ease-move); }
.ui-is__save[data-open] { grid-template-rows: 1fr; }
:where([data-look="standard"], [data-look="standard"] *).ui-is__save-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3);
  min-height: 0;
  overflow: hidden;
  padding: 0 var(--tc-space-2) 0 var(--tc-space-4-5);
  font-size: var(--tc-font-size-md);
  color: var(--tc-text-secondary);
}
:where([data-look="standard"], [data-look="standard"] *).ui-is__save[data-open] .ui-is__save-inner { padding-top: var(--tc-space-2); padding-bottom: var(--tc-space-2); }
:where([data-look="standard"], [data-look="standard"] *).ui-is__save-actions { display: flex; gap: var(--tc-space-1-5); }
/* Discard and Save look exactly like Button secondary / primary */
.ui-is__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-control-px-md) !important;
  border: 0;
  border-radius: var(--tc-control-radius-md);
  background: var(--tc-action-secondary-bg) !important;
  box-shadow: var(--tc-action-secondary-shadow);
  font-size: var(--tc-control-font-size) !important;
  font-weight: var(--tc-control-font-weight);
  line-height: var(--tc-line-height-normal);
  white-space: nowrap;
  color: var(--tc-action-secondary-fg) !important;
  transition: box-shadow var(--tc-duration-quick) var(--tc-ease-standard), background-color var(--tc-duration-quick) var(--tc-ease-standard);
}
.ui-is__btn:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-is__btn--primary { min-width: 56px; background: var(--tc-action-primary-bg) !important; box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg) !important; }
.ui-is__btn--primary:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover) !important; box-shadow: var(--tc-action-primary-shadow); }
.ui-is__btn--primary:active:not(:disabled) { background: var(--tc-action-primary-bg-active) !important; }
.ui-is__btn--primary:disabled { opacity: 0.4; cursor: default; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__save-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-3);
  min-height: 0;
  overflow: hidden;
  padding: 0 var(--tc-space-3) 0 var(--tc-space-4);
  border-top: var(--tc-hairline) solid var(--tc-divider);
  color: var(--tc-text-secondary);
}
:where([data-look="clean"], [data-look="clean"] *).ui-is__save[data-open] .ui-is__save-inner { padding-top: var(--tc-space-2-5); padding-bottom: var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__save-text { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__save-actions { display: flex; flex: none; gap: var(--tc-space-1-5); }
/* Shimmer over the working label: a window and the full-colour copy inside it move in opposite directions, so the
   copy stays on the label – transform only, three passes and done */
:where([data-look="clean"], [data-look="clean"] *).ui-is__shimmer { position: relative; display: inline-block; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__shine {
  position: absolute;
  inset: 0 auto 0 0;
  width: 40%;
  overflow: hidden;
  pointer-events: none;
  animation: ui-is-window var(--tc-duration-shimmer) linear 3 both;
}
:where([data-look="clean"], [data-look="clean"] *).ui-is__shine > span { display: block; white-space: nowrap; color: var(--tc-text-primary); animation: ui-is-window-copy var(--tc-duration-shimmer) linear 3 both; }
@keyframes ui-is-in { from { opacity: 0; transform: translateY(2px); } }
@keyframes ui-is-drop { from { opacity: 0; transform: translateY(-4px) scale(0.98); } }
@keyframes ui-is-pop { from { opacity: 0; transform: scale(0.5); } }
@keyframes ui-is-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
:where([data-look="standard"], [data-look="standard"] *).ui-is__fold,
:where([data-look="standard"], [data-look="standard"] *).ui-is__save,
:where([data-look="standard"], [data-look="standard"] *).ui-is__switch,
:where([data-look="standard"], [data-look="standard"] *).ui-is__switch span,
:where([data-look="standard"], [data-look="standard"] *).ui-is__generate { transition: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-is__key,
:where([data-look="standard"], [data-look="standard"] *).ui-is__menu,
:where([data-look="standard"], [data-look="standard"] *).ui-is__ok { animation: none; }
}
@keyframes ui-is-window { from { transform: translateX(-100%); } to { transform: translateX(250%); } }
@keyframes ui-is-window-copy { from { transform: translateX(40%); } to { transform: translateX(-100%); } }
/* Narrow (phones): tighter padding, the key row keeps its buttons */
@container (max-width: 400px) {
:where([data-look="clean"], [data-look="clean"] *).ui-is__head { gap: var(--tc-space-2-5); padding: var(--tc-space-3-5) var(--tc-space-3-5) var(--tc-space-3-5) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__logo { width: 36px; height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__logo svg { width: 20px; height: 20px; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__section { padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-3-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__regen { min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__save-inner { padding: 0 var(--tc-space-2-5) 0 var(--tc-space-3); }
}
/* Touch screens: bigger targets; 16px text in fields so iOS doesn't zoom in */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-is__field,
:where([data-look="clean"], [data-look="clean"] *).ui-is__generate { height: 40px; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__field input,
:where([data-look="clean"], [data-look="clean"] *).ui-is__menu-search input { font-size: var(--tc-font-size-xl); }
:where([data-look="clean"], [data-look="clean"] *).ui-is__key { height: 44px; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__mini { width: 36px; height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__regen,
:where([data-look="clean"], [data-look="clean"] *).ui-is__btn { height: 36px; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__menu-search { height: 40px; }
:where([data-look="clean"], [data-look="clean"] *).ui-is__option { min-height: 44px; }
}
@media (prefers-reduced-motion: reduce) {
:where([data-look="clean"], [data-look="clean"] *)[data-ui="is"] *,
:where([data-look="clean"], [data-look="clean"] *)[data-ui="is"] *::before,
:where([data-look="clean"], [data-look="clean"] *)[data-ui="is"] *::after { animation: none !important; transition: none !important; }
}
/* Announcements for screen readers only */
.ui-is__sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.ui-is__switch[data-pending] { opacity: 0.6; cursor: progress; }
.ui-is__meta[data-error] { color: var(--tc-status-danger-fg); }
`;
}

if (!customElements.get("tc-integration-settings")) customElements.define("tc-integration-settings", TcIntegrationSettings);

declare global {
  interface HTMLElementTagNameMap {
    "tc-integration-settings": TcIntegrationSettings;
  }
}
