import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";

/*
 * <tc-preview-frame> – a browser pane around a page the app supplies: back, forward and reload, an address field, a
 * phone / tablet / desktop switch, a console count and a button to open the page in a new window, with optional tabs.
 * By default it shows `src` in a sandboxed iframe (http, https and about:blank only). Any children the page puts in
 * the element are shown instead – a mock page, a canvas, a screenshot – and stay where the page put them.
 *   · the address takes Enter: tc-navigate fires, and unless it's prevented the address and `src` change
 *   · phone and tablet widths are drawn at their own size and zoomed down to fit, centred, with the size shown
 *   · `loading`, `error` and the empty state ("No preview running", with an optional Start) are the page's to set
 *   · the viewport switch is a radio group and the tabs a tab list, each one tab stop moved with the arrow keys
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-preview-frame src="http://localhost:5173/" viewport="phone"></tc-preview-frame>
 */

export type PreviewViewport = "phone" | "tablet" | "desktop";
export type PreviewTab = { id: string; title: string; url?: string };
export type PreviewConsole = { errors?: number; warnings?: number };
export type PreviewFrameLabels = {
  back: string;
  forward: string;
  reload: string;
  address: string;
  viewport: string;
  phone: string;
  tablet: string;
  desktop: string;
  openExternal: string;
  console: string;
  errors: string;
  error: string;
  warnings: string;
  warning: string;
  newTab: string;
  closeTab: string;
  tabs: string;
  empty: string;
  emptyHint: string;
  start: string;
  couldNotLoad: string;
  badScheme: string;
  retry: string;
  secure: string;
  local: string;
  insecure: string;
  loading: string;
};

/** Details of the events */
export type PreviewNavigate = { url: string };
export type PreviewViewportChange = { viewport: PreviewViewport };
export type PreviewActiveChange = { active: string; tab: PreviewTab };
export type PreviewTabEvent = { id: string; tab: PreviewTab };
export type PreviewExternal = { url: string };

/** The words used when the page gives none */
export const defaultPreviewFrameLabels: PreviewFrameLabels = {
  back: "Back",
  forward: "Forward",
  reload: "Reload",
  address: "Address",
  viewport: "Viewport",
  phone: "Phone",
  tablet: "Tablet",
  desktop: "Desktop",
  openExternal: "Open in a new window",
  console: "Console",
  errors: "errors",
  error: "error",
  warnings: "warnings",
  warning: "warning",
  newTab: "New tab",
  closeTab: "Close",
  tabs: "Pages",
  empty: "No preview running",
  emptyHint: "Start the dev server to see the page here.",
  start: "Start",
  couldNotLoad: "Couldn't load",
  badScheme: "Only http and https addresses can be shown.",
  retry: "Retry",
  secure: "Secure",
  local: "Local",
  insecure: "Not secure",
  loading: "Loading",
};

/** The widths phone and tablet are drawn at, in CSS px */
export const PREVIEW_WIDTHS: Record<Exclude<PreviewViewport, "desktop">, number> = { phone: 375, tablet: 768 };
const VIEWPORTS: PreviewViewport[] = ["phone", "tablet", "desktop"];
const LOCAL = /^(localhost|127(?:\.\d+){3}|\[::1\]|0\.0\.0\.0|.+\.localhost)$/i;

/* Icons: Lucide (ISC, lucide.dev) – app-window, arrow-left, arrow-right, rotate-cw, lock, house, triangle-alert,
   smartphone, tablet, monitor, external-link, circle-x, x, plus */
const ICON = {
  head: svg`<rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M10 4v4"></path><path d="M2 8h20"></path><path d="M6 4v4"></path>`,
  back: svg`<path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path>`,
  forward: svg`<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>`,
  reload: svg`<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"></path><path d="M21 3v5h-5"></path>`,
  secure: svg`<rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>`,
  local: svg`<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>`,
  insecure: svg`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path>`,
  phone: svg`<rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect><path d="M12 18h.01"></path>`,
  tablet: svg`<rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><line x1="12" x2="12.01" y1="18" y2="18"></line>`,
  desktop: svg`<rect width="20" height="14" x="2" y="3" rx="2"></rect><line x1="8" x2="16" y1="21" y2="21"></line><line x1="12" x2="12" y1="17" y2="21"></line>`,
  external: svg`<path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>`,
  error: svg`<circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path>`,
  close: svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`,
  plus: svg`<path d="M5 12h14"></path><path d="M12 5v14"></path>`,
};
const glyph = (body: TemplateResult, cls = "ui-pvf__glyph") =>
  html`<svg class=${cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

/** Adds a scheme to a typed address: http for local hosts, https for the rest */
export function normalizePreviewUrl(typed: string) {
  const text = typed.trim();
  if (!text) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(text) && !/^[^/:]+:\d+([/?#]|$)/.test(text)) return text;
  const host = text.split(/[/:?#]/)[0];
  return `${LOCAL.test(host) ? "http" : "https"}://${text}`;
}

/** The address's kind, for its icon: "secure", "local", "insecure" or "" for anything else */
export function previewSecurity(url: string): "secure" | "local" | "insecure" | "" {
  try {
    const u = new URL(url);
    if (u.protocol === "https:") return "secure";
    if (u.protocol === "http:") return LOCAL.test(u.hostname) || u.hostname === "[::1]" ? "local" : "insecure";
  } catch {
    // Not an address yet
  }
  return "";
}

/** An address an iframe may load: http(s) or about:blank */
const frameable = (url: string) => {
  if (url === "about:blank") return true;
  try {
    const p = new URL(url).protocol;
    return p === "http:" || p === "https:";
  } catch {
    return false;
  }
};
/** An address that may leave the frame for a new window: http(s) only, so a `javascript:` tab url never reaches window.open */
const openable = (url: string) => frameable(url) && url !== "about:blank";
/** "localhost:5173" for the error line */
const hostOf = (url: string) => {
  try {
    return new URL(url).host || url;
  } catch {
    return url;
  }
};

let instances = 0;

/**
 * A browser pane around a page the app supplies, with an address field, back, forward and reload, phone, tablet and desktop widths, a console count and tabs.
 * @tag tc-preview-frame
 * @fires tc-navigate - Enter was pressed in the address ({ url }: PreviewNavigate); cancelable – prevented, the address and `src` stay as they were
 * @fires tc-viewport-change - A width was chosen ({ viewport }: PreviewViewportChange); cancelable – prevented, `viewport` stays as it was
 * @fires tc-active-change - A tab was chosen ({ active, tab }: PreviewActiveChange); cancelable – prevented, `active` stays as it was
 * @fires tc-close - A tab's close button or Delete was pressed ({ id, tab }: PreviewTabEvent); cancelable – prevented, the tab stays
 * @fires tc-new-tab - New tab was pressed (detail: null)
 * @fires tc-back - Back was pressed (detail: null)
 * @fires tc-forward - Forward was pressed (detail: null)
 * @fires tc-reload - Reload or Retry was pressed (detail: null)
 * @fires tc-start - Start was pressed in the empty state (detail: null)
 * @fires tc-open-external - Open in a new window was pressed ({ url }: PreviewExternal)
 * @fires tc-console - The console count was pressed (detail: null)
 */
export class TcPreviewFrame extends TcElement {
  static override ui = "pvf";

  /** The heading; empty draws no header */
  @property() accessor heading = "Preview";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The page the iframe loads: http, https or about:blank. Children, when there are any, show instead */
  @property() accessor src = "";
  /** The address shown; by default the active tab's url, else `src` */
  @property() accessor url = "";
  /** The iframe's sandbox attribute */
  @property() accessor sandbox = "allow-scripts allow-forms allow-same-origin";
  /** The width the page is drawn at. Changed by the switch unless a tc-viewport-change listener calls preventDefault() */
  @property({ reflect: true }) accessor viewport: PreviewViewport = "desktop";
  /** The page area's height in px */
  @property({ type: Number }) accessor height = 420;
  /** The page is loading: a bar runs and Reload spins */
  @property({ type: Boolean, reflect: true }) accessor loading = false;
  /** Why the page couldn't load; set, the error state shows instead of the page */
  @property() accessor error = "";
  /** Shows the Start button in the empty state */
  @property({ type: Boolean }) accessor startable = false;
  /** Back can be pressed */
  @property({ type: Boolean, attribute: "can-go-back" }) accessor canGoBack = false;
  /** Forward can be pressed */
  @property({ type: Boolean, attribute: "can-go-forward" }) accessor canGoForward = false;
  /** The console's counts; unset hides the badge */
  @property({ attribute: false }) accessor consoleCount: PreviewConsole | undefined = undefined;
  /** Open pages; with none there's no tab row */
  @property({ attribute: false }) accessor tabs: PreviewTab[] = [];
  /** The active tab's id. Changed by choosing a tab unless a tc-active-change listener calls preventDefault() */
  @property() accessor active: string | null = null;
  /** Hides the New tab button */
  @property({ type: Boolean, attribute: "no-new-tab" }) accessor noNewTab = false;
  /** Rename any of the words, over the defaults */
  @property({ attribute: false }) accessor labels: Partial<PreviewFrameLabels> = {};
  /** Drops the tray and card */
  @property({ type: Boolean, reflect: true }) accessor bare = false;

  /** What's typed in the address, until Enter or Escape */
  @state() private accessor draft: string | null = null;
  @state() private accessor hasContent = false;
  @state() private accessor zoom = 1;
  @state() private accessor announcement = "";

  /** Where the user went from the address, per tab id ("" without tabs) – kept here, not in `src` or `url`, so a React
   * re-render that sets them again doesn't undo it */
  @state() private accessor navigations = new Map<string, { base: string | undefined; url: string }>();
  private readonly uid = `tc-pvf${++instances}`;
  private children$?: MutationObserver;
  private sizer?: ResizeObserver;

  private word<K extends keyof PreviewFrameLabels>(key: K) {
    return this.labels[key] ?? defaultPreviewFrameLabels[key];
  }
  private get activeTab() {
    return this.tabs.find((t) => t.id === this.active) ?? this.tabs[0];
  }
  /** The address shown */
  get address() {
    return this.navigation || this.url || this.activeTab?.url || this.src;
  }
  private get frameSrc() {
    return this.navigation || this.src || this.activeTab?.url || "";
  }
  private get navigation() {
    const tab = this.activeTab;
    if (!tab) return this.navigations.get("")?.url;
    const visited = this.navigations.get(tab.id);
    return visited && visited.base === tab.url ? visited.url : undefined;
  }
  private get width() {
    return this.viewport === "desktop" ? 0 : PREVIEW_WIDTHS[this.viewport];
  }

  override connectedCallback() {
    super.connectedCallback();
    this.children$ = new MutationObserver(() => this.readChildren());
    this.children$.observe(this, { childList: true });
    this.readChildren();
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.children$?.disconnect();
    this.sizer?.disconnect();
    this.sizer = undefined;
  }

  /** The page's own children: anything that isn't one of the element's parts */
  private get pageChildren() {
    return [...this.children].filter((c) => !c.classList.contains("tc-head") && ![...c.classList].some((n) => n.startsWith("ui-pvf__")));
  }
  private readChildren() {
    const has = this.pageChildren.length > 0;
    if (has !== this.hasContent) this.hasContent = has;
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("url") || changed.has("src") || changed.has("active")) this.draft = null;
    // Explicit application updates take precedence; removed/revised tabs discard their old local navigation.
    if (changed.has("url") || changed.has("src")) this.navigations = new Map();
    else if (changed.has("tabs")) this.navigations = new Map([...this.navigations].filter(([id, visit]) => (id === "" && !this.tabs.length) || this.tabs.some((tab) => tab.id === id && tab.url === visit.base)));
    if (changed.has("loading") && this.hasUpdated) this.announcement = this.loading ? this.word("loading") : "";
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    // The toolbar spans the card, so its width is the room the page has – measuring the page would feed back
    if (!this.sizer) {
      const bar = this.querySelector<HTMLElement>(".ui-pvf__bar");
      if (bar) {
        this.sizer = new ResizeObserver(() => this.fit());
        this.sizer.observe(bar);
      }
    }
    if (changed.has("viewport")) this.fit();
    // The page's children sit in the stage's grid cell but aren't inside it, so the stage's sizes are given to them here
    for (const child of this.pageChildren) {
      if (!(child instanceof HTMLElement || child instanceof SVGElement)) continue;
      for (const [name, value] of Object.entries(this.sizes())) child.style.setProperty(name, value);
    }
  }

  /** The page area's sizes, as the custom properties its CSS reads */
  private sizes() {
    const w = this.width;
    return { "--tc-pvf-stage-h": `${this.height}px`, "--tc-pvf-zoom": String(this.zoom), "--tc-pvf-w": w ? `${w}px` : "100%" };
  }

  private fit() {
    const bar = this.querySelector<HTMLElement>(".ui-pvf__bar");
    const room = bar?.clientWidth ?? 0;
    const w = this.width;
    const zoom = w && room ? Math.min(1, Math.max(0.1, (room - 2 * this.inset()) / w)) : 1;
    if (Math.abs(zoom - this.zoom) > 0.001) this.zoom = zoom;
  }
  /** The stage's padding around a phone or tablet, from its CSS */
  private inset() {
    const stage = this.querySelector<HTMLElement>(".ui-pvf__stage");
    return stage ? parseFloat(getComputedStyle(stage).paddingLeft) || 0 : 0;
  }

  /* ---------- Toolbar ---------- */

  private navigate() {
    if (this.draft === null) return;
    const url = normalizePreviewUrl(this.draft);
    if (!url) return;
    // Only an address the frame can show is passed on: a typed `javascript:` never reaches tc-navigate
    if (!frameable(url)) {
      this.announcement = this.word("badScheme");
      return;
    }
    if (!this.emit<PreviewNavigate>("tc-navigate", { url }, { cancelable: true })) return;
    const tab = this.activeTab;
    this.navigations = new Map(this.navigations).set(tab?.id ?? "", { base: tab?.url, url });
    this.draft = null;
  }
  private onAddressKey = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      this.navigate();
    } else if (e.key === "Escape" && this.draft !== null) {
      e.preventDefault();
      this.draft = null;
      (e.target as HTMLInputElement).select();
    }
  };

  private setViewport(viewport: PreviewViewport, focus = false) {
    if (viewport !== this.viewport) {
      if (!this.emit<PreviewViewportChange>("tc-viewport-change", { viewport }, { cancelable: true })) return;
      this.viewport = viewport;
    }
    if (focus) void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-pvf__vp[data-vp="${viewport}"]`)?.focus());
  }
  private onViewportKey = (e: KeyboardEvent) => {
    const i = VIEWPORTS.indexOf(this.viewport);
    const to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: VIEWPORTS.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    this.setViewport(VIEWPORTS[(to + VIEWPORTS.length) % VIEWPORTS.length], true);
  };

  /* ---------- Tabs ---------- */

  private choose(tab: PreviewTab, focus = false) {
    if (tab.id !== this.activeTab?.id) {
      if (!this.emit<PreviewActiveChange>("tc-active-change", { active: tab.id, tab }, { cancelable: true })) return;
      this.active = tab.id;
    }
    if (focus) void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-pvf__tab[data-id="${CSS.escape(tab.id)}"]`)?.focus());
  }
  private close(tab: PreviewTab) {
    if (!this.emit<PreviewTabEvent>("tc-close", { id: tab.id, tab }, { cancelable: true })) return;
    const i = this.tabs.findIndex((t) => t.id === tab.id);
    const wasActive = this.activeTab?.id === tab.id;
    const tabs = this.tabs.filter((t) => t.id !== tab.id);
    this.tabs = tabs;
    this.announcement = `${this.word("closeTab")} ${tab.title}`;
    if (wasActive && tabs.length) {
      // The neighbour becomes active the same way a chosen tab does: cancelable, and a controlled page is told
      const next = tabs[Math.min(i, tabs.length - 1)];
      if (this.emit<PreviewActiveChange>("tc-active-change", { active: next.id, tab: next }, { cancelable: true })) this.active = next.id;
      void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-pvf__tab[aria-selected="true"]`)?.focus());
    }
  }
  private onTabKey = (e: KeyboardEvent) => {
    const tabs = this.tabs;
    const i = tabs.findIndex((t) => t.id === this.activeTab?.id);
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      if (tabs[i]) this.close(tabs[i]);
      return;
    }
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (to === undefined || !tabs.length) return;
    e.preventDefault();
    this.choose(tabs[(to + tabs.length) % tabs.length], true);
  };

  /**
   * The iframe, made once per address and sandbox: its sandbox has to be set before it loads, and a template can't bind
   * a multi-token sandbox (lit-analyzer types it as one token)
   */
  private frame: HTMLIFrameElement | undefined;
  private frameFor(src: string, title: string) {
    if (!this.frame || this.frame.dataset.src !== src || this.frame.dataset.sandbox !== this.sandbox) {
      const f = document.createElement("iframe");
      f.className = "ui-pvf__frame";
      f.setAttribute("sandbox", this.sandbox);
      f.loading = "lazy";
      f.referrerPolicy = "no-referrer";
      f.dataset.src = src;
      f.dataset.sandbox = this.sandbox;
      f.src = src;
      this.frame = f;
    }
    this.frame.title = title;
    return this.frame;
  }

  /* ---------- Rendering ---------- */

  private toolButton(name: "back" | "forward" | "reload", disabled: boolean, event: string) {
    return html`<button type="button" class="ui-pvf__tool" data-tool=${name} title=${this.word(name)} ?disabled=${disabled} @click=${() => this.emit(event, null)}>
      ${glyph(ICON[name])}<span class="ui-pvf__sr">${this.word(name)}</span>
    </button>`;
  }

  private renderTabs() {
    if (!this.tabs.length) return nothing;
    const current = this.activeTab?.id;
    return html`<div class="ui-pvf__tabs">
      <div class="ui-pvf__tablist" role="tablist" aria-label=${this.word("tabs")} @keydown=${this.onTabKey}>
        ${repeat(
          this.tabs,
          (t) => t.id,
          (t) => html`<div class="ui-pvf__tabwrap" role="presentation" ?data-active=${t.id === current}>
            <button type="button" role="tab" class="ui-pvf__tab" data-id=${t.id} id=${`${this.uid}-tab-${t.id}`} aria-selected=${t.id === current ? "true" : "false"} tabindex=${t.id === current ? 0 : -1} title=${t.url ?? t.title} @click=${() => this.choose(t)}>
              <span class="ui-pvf__tabtitle">${t.title}</span>
            </button>
            <button type="button" class="ui-pvf__tabclose" tabindex="-1" aria-hidden="true" title=${`${this.word("closeTab")} ${t.title}`} @click=${() => this.close(t)}>${glyph(ICON.close)}</button>
          </div>`,
        )}
      </div>
      ${this.noNewTab
        ? nothing
        : html`<button type="button" class="ui-pvf__tool ui-pvf__newtab" title=${this.word("newTab")} @click=${() => this.emit("tc-new-tab", null)}>${glyph(ICON.plus)}<span class="ui-pvf__sr">${this.word("newTab")}</span></button>`}
    </div>`;
  }

  private renderConsole() {
    const c = this.consoleCount;
    if (!c) return nothing;
    const errors = c.errors ?? 0;
    const warnings = c.warnings ?? 0;
    return html`<button type="button" class="ui-pvf__console" ?data-errors=${errors > 0} ?data-warnings=${warnings > 0} title=${this.word("console")} @click=${() => this.emit("tc-console", null)}>
      <span class="ui-pvf__count" data-kind="error">${glyph(ICON.error)}${errors}<span class="ui-pvf__sr"> ${this.word(errors === 1 ? "error" : "errors")},</span></span>
      <span class="ui-pvf__count" data-kind="warning">${glyph(ICON.insecure)}${warnings}<span class="ui-pvf__sr"> ${this.word(warnings === 1 ? "warning" : "warnings")}</span></span>
    </button>`;
  }

  private renderBar() {
    const address = this.draft ?? this.address;
    const kind = previewSecurity(this.address);
    const inputId = `${this.uid}-address`;
    return html`<div class="ui-pvf__bar">
      <div class="ui-pvf__nav">
        ${this.toolButton("back", !this.canGoBack, "tc-back")} ${this.toolButton("forward", !this.canGoForward, "tc-forward")}
        <span class="ui-pvf__reload" ?data-spin=${this.loading}>${this.toolButton("reload", false, "tc-reload")}</span>
      </div>
      <div class="ui-pvf__address" data-kind=${kind || "none"}>
        ${kind ? html`<span class="ui-pvf__lock" title=${this.word(kind)}>${glyph(ICON[kind])}<span class="ui-pvf__sr">${this.word(kind)}</span></span>` : nothing}
        <label class="ui-pvf__sr" for=${inputId}>${this.word("address")}</label>
        <input
          id=${inputId}
          class="ui-pvf__input"
          type="text"
          inputmode="url"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          .value=${live(address)}
          @input=${(e: Event) => {
            this.draft = (e.target as HTMLInputElement).value;
          }}
          @keydown=${this.onAddressKey}
          @focus=${(e: Event) => (e.target as HTMLInputElement).select()}
        />
      </div>
      <div class="ui-pvf__end">
        <div class="ui-pvf__vps" role="radiogroup" aria-label=${this.word("viewport")} @keydown=${this.onViewportKey}>
          ${VIEWPORTS.map(
            (v) => html`<button type="button" role="radio" class="ui-pvf__vp" data-vp=${v} aria-checked=${v === this.viewport ? "true" : "false"} tabindex=${v === this.viewport ? 0 : -1} title=${this.word(v)} @click=${() => this.setViewport(v)}>
              ${glyph(ICON[v])}<span class="ui-pvf__sr">${this.word(v)}</span>
            </button>`,
          )}
        </div>
        ${this.renderConsole()}
        <button
          type="button"
          class="ui-pvf__tool"
          data-tool="external"
          title=${this.word("openExternal")}
          ?disabled=${!openable(this.address)}
          @click=${() => {
            if (openable(this.address)) this.emit<PreviewExternal>("tc-open-external", { url: this.address });
          }}
        >
          ${glyph(ICON.external)}<span class="ui-pvf__sr">${this.word("openExternal")}</span>
        </button>
      </div>
    </div>`;
  }

  private renderStage() {
    const src = this.frameSrc;
    const bad = !this.hasContent && !!src && !frameable(src);
    const failed = !!this.error || bad;
    const empty = !failed && !this.hasContent && !src;
    const w = this.width;
    const title = this.activeTab?.title || this.heading || "Preview";
    let body: TemplateResult | typeof nothing = nothing;
    if (failed) {
      body = html`<div class="ui-pvf__notice" role="alert">
        ${glyph(ICON.error, "ui-pvf__notice-icon")}
        <p class="ui-pvf__notice-title">${this.word("couldNotLoad")} ${hostOf(this.address || src)}</p>
        <p class="ui-pvf__notice-text">${this.error || this.word("badScheme")}</p>
        <button type="button" class="ui-pvf__btn" @click=${() => this.emit("tc-reload", null)}>${this.word("retry")}</button>
      </div>`;
    } else if (empty) {
      body = html`<div class="ui-pvf__notice">
        ${glyph(ICON.desktop, "ui-pvf__notice-icon")}
        <p class="ui-pvf__notice-title">${this.word("empty")}</p>
        <p class="ui-pvf__notice-text">${this.word("emptyHint")}</p>
        ${this.startable ? html`<button type="button" class="ui-pvf__btn" @click=${() => this.emit("tc-start", null)}>${this.word("start")}</button>` : nothing}
      </div>`;
    } else if (!this.hasContent) {
      body = html`${this.frameFor(src, title)}`;
    }
    const pct = Math.round(this.zoom * 100);
    return html`<div
        class="ui-pvf__stage"
        ?data-device=${!!w}
        ?data-children=${this.hasContent && !failed && !empty}
        aria-busy=${this.loading ? "true" : "false"}
        style=${styleMap(this.sizes())}
      >
        ${this.loading ? html`<span class="ui-pvf__progress" aria-hidden="true"></span>` : nothing} ${body}
      </div>
      ${w ? html`<p class="ui-pvf__size">${this.word(this.viewport)} · ${w} px${pct < 100 ? html` · ${pct}%` : nothing}</p>` : nothing}`;
  }

  protected override render() {
    return html`${this.heading ? cardHead({ icon: ICON.head, title: this.heading, subtitle: this.description }) : nothing}
      <div class="ui-pvf__card" aria-hidden="true"></div>
      ${this.renderTabs()} ${this.renderBar()} ${this.renderStage()}
      <span class="ui-pvf__sr ui-pvf__status" role="status">${this.announcement}</span>`;
  }

  static override css = /* css */ `
[data-ui="pvf"] {
  /* The gap around a phone or tablet in the page area */
  --tc-pvf-inset: var(--tc-space-4);
  /* The page area's backdrop behind a phone or tablet */
  --tc-pvf-backdrop: var(--tc-surface-sunken);
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="pvf"] *, [data-ui="pvf"] *::before, [data-ui="pvf"] *::after { box-sizing: border-box; }
/* Standard: a gray tray holding a white card. The card is drawn behind the rows, as the page's children are the host's own */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pvf"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pvf"]:not([bare]) > .ui-pvf__card {
  grid-row: 2 / 6;
  grid-column: 1;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="pvf"] { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
[data-ui="pvf"][bare] { padding: 0; overflow: visible; border-radius: 0; background: none; box-shadow: none; }
:where([data-ui="pvf"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="pvf"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
[data-ui="pvf"] button:disabled { cursor: default; color: var(--tc-text-disabled); }
[data-ui="pvf"] svg { display: block; flex: none; }
.ui-pvf__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.ui-pvf__glyph { width: var(--tc-space-4); height: var(--tc-space-4); }

/* Rows: header, tabs, toolbar, page area, size */
[data-ui="pvf"] > .tc-head { grid-row: 1; }
.ui-pvf__card { grid-row: 2 / 6; grid-column: 1; }
.ui-pvf__tabs { grid-row: 2; grid-column: 1; position: relative; display: flex; align-items: end; gap: var(--tc-space-1); min-width: 0; padding: var(--tc-space-1-5) var(--tc-space-2) 0; border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-pvf__bar { grid-row: 3; grid-column: 1; position: relative; display: flex; align-items: center; gap: var(--tc-space-1); min-width: 0; padding: var(--tc-space-1-5) var(--tc-space-2); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-pvf__stage { grid-row: 4; grid-column: 1; }
[data-ui="pvf"] > :not(.tc-head, [class^="ui-pvf__"], [class*=" ui-pvf__"]) { grid-row: 4; grid-column: 1; }
.ui-pvf__size { grid-row: 5; grid-column: 1; }
.ui-pvf__status { grid-row: 6; }

.ui-pvf__tablist { display: flex; align-items: end; gap: var(--tc-space-0-5); min-width: 0; overflow-x: auto; scrollbar-width: none; }
.ui-pvf__tabwrap { position: relative; display: flex; align-items: center; flex: 0 1 12rem; min-width: 6rem; border-radius: var(--tc-radius-md) var(--tc-radius-md) 0 0; }
.ui-pvf__tabwrap:hover { background: var(--tc-fill-hover); }
.ui-pvf__tabwrap[data-active] { background: var(--tc-fill-selected); box-shadow: inset 0 calc(var(--tc-hairline) * -2) 0 var(--tc-accent); }
.ui-pvf__tab { flex: 1 1 0; min-width: 0; min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1) 0 var(--tc-space-2-5); color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); text-align: left; }
.ui-pvf__tabwrap[data-active] .ui-pvf__tab { color: var(--tc-text-primary); }
.ui-pvf__tabtitle { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ui-pvf__tabclose { display: grid; place-items: center; flex: none; width: var(--tc-space-5); height: var(--tc-space-5); margin-inline-end: var(--tc-space-1); border-radius: var(--tc-radius-sm); color: var(--tc-icon-muted); }
.ui-pvf__tabclose:hover { background: var(--tc-fill-strong); color: var(--tc-text-primary); }
.ui-pvf__tabclose .ui-pvf__glyph { width: var(--tc-space-3); height: var(--tc-space-3); }

.ui-pvf__nav, .ui-pvf__end { display: flex; align-items: center; gap: var(--tc-space-0-5); flex: none; }
.ui-pvf__tool { display: grid; place-items: center; flex: none; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-pvf__tool:hover:not(:disabled) { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-pvf__newtab { margin-bottom: var(--tc-space-0-5); }
.ui-pvf__reload[data-spin] .ui-pvf__glyph { animation: ui-pvf-turn var(--tc-duration-reveal-slow) linear infinite; }
@keyframes ui-pvf-turn { to { transform: rotate(360deg); } }

.ui-pvf__address {
  display: flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  flex: 1 1 10rem;
  min-width: 0;
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-space-2-5);
  border-radius: var(--tc-radius-full);
  background: var(--tc-fill-default);
}
.ui-pvf__address:focus-within { box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); background: var(--tc-surface-control); }
.ui-pvf__lock { display: grid; place-items: center; color: var(--tc-icon-muted); }
.ui-pvf__lock .ui-pvf__glyph { width: var(--tc-space-3-5); height: var(--tc-space-3-5); }
.ui-pvf__address[data-kind="secure"] .ui-pvf__lock { color: var(--tc-status-success-fg); }
.ui-pvf__address[data-kind="insecure"] .ui-pvf__lock { color: var(--tc-status-warning-fg); }
.ui-pvf__input { flex: 1; min-width: 0; height: 100%; margin: 0; padding: 0; border: 0; outline: 0; background: none; color: var(--tc-text-primary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); text-overflow: ellipsis; }

.ui-pvf__vps { display: flex; gap: var(--tc-space-0-5); padding: var(--tc-space-0-5); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-pvf__vp { display: grid; place-items: center; width: var(--tc-control-h-sm); height: calc(var(--tc-control-h-sm) - var(--tc-space-1)); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); }
.ui-pvf__vp:hover { color: var(--tc-text-primary); }
.ui-pvf__vp[aria-checked="true"] { background: var(--tc-surface-control); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-text-primary); }
.ui-pvf__vp .ui-pvf__glyph { width: var(--tc-space-3-5); height: var(--tc-space-3-5); }
.ui-pvf__console { display: inline-flex; align-items: center; gap: var(--tc-space-2); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-pvf__console:hover { background: var(--tc-fill-hover); }
.ui-pvf__count { display: inline-flex; align-items: center; gap: var(--tc-space-1); }
.ui-pvf__count .ui-pvf__glyph { width: var(--tc-space-3); height: var(--tc-space-3); }
.ui-pvf__console[data-errors] [data-kind="error"] { color: var(--tc-status-danger-fg); }
.ui-pvf__console[data-warnings] [data-kind="warning"] { color: var(--tc-status-warning-fg); }

/* The page area: fills at desktop; a phone or tablet is drawn at its width, zoomed to fit and centred */
.ui-pvf__stage { position: relative; display: grid; place-items: start center; height: var(--tc-pvf-stage-h); min-width: 0; overflow: hidden; }
.ui-pvf__stage[data-device] { padding: var(--tc-pvf-inset); background: var(--tc-pvf-backdrop); }
[data-ui="pvf"][viewport="desktop"] .ui-pvf__stage { place-items: stretch; }
.ui-pvf__frame,
[data-ui="pvf"] > :not(.tc-head, [class^="ui-pvf__"], [class*=" ui-pvf__"]) {
  position: relative;
  z-index: 1;
  display: block;
  justify-self: center;
  align-self: start;
  width: var(--tc-pvf-w, 100%);
  height: var(--tc-pvf-stage-h);
  max-width: none;
  margin: 0;
  overflow: auto;
  border: 0;
  background: var(--tc-surface-base);
  zoom: var(--tc-pvf-zoom, 1);
}
/* A phone or tablet: drawn at its own size, zoomed, with a gap all round. Zoom scales the box, so the sizes are divided by it */
[data-ui="pvf"]:not([viewport="desktop"]) .ui-pvf__frame,
[data-ui="pvf"]:not([viewport="desktop"]) > :not(.tc-head, [class^="ui-pvf__"], [class*=" ui-pvf__"]) {
  height: calc((var(--tc-pvf-stage-h) - 2 * var(--tc-pvf-inset)) / var(--tc-pvf-zoom, 1));
  border-radius: var(--tc-radius-xl);
  box-shadow: var(--tc-card-shadow);
}
/* Children share the stage's grid cell without its padding */
[data-ui="pvf"]:not([viewport="desktop"]) > :not(.tc-head, [class^="ui-pvf__"], [class*=" ui-pvf__"]) { margin-top: calc(var(--tc-pvf-inset) / var(--tc-pvf-zoom, 1)); }
/* At desktop the page area is the card's last row */
[data-ui="pvf"][viewport="desktop"] .ui-pvf__stage,
[data-ui="pvf"][viewport="desktop"] > :not(.tc-head, [class^="ui-pvf__"], [class*=" ui-pvf__"]) { border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); }
/* Children are hidden while the stage shows its own notice */
[data-ui="pvf"]:has(.ui-pvf__notice) > :not(.tc-head, [class^="ui-pvf__"], [class*=" ui-pvf__"]) { display: none; }

.ui-pvf__progress { position: absolute; z-index: 2; inset: 0 0 auto; height: var(--tc-space-0-5); overflow: hidden; background: var(--tc-accent-subtle); }
.ui-pvf__progress::after { content: ""; position: absolute; inset: 0 auto 0 0; width: 40%; background: var(--tc-accent-solid); animation: ui-pvf-run var(--tc-duration-reveal-slow) var(--tc-ease-in-out) infinite; }
@keyframes ui-pvf-run { from { transform: translateX(-100%); } to { transform: translateX(250%); } }

.ui-pvf__notice { align-self: center; justify-self: center; display: grid; justify-items: center; gap: var(--tc-space-1-5); max-width: 22rem; padding: var(--tc-space-6) var(--tc-space-4); text-align: center; }
.ui-pvf__notice-icon { width: var(--tc-space-6); height: var(--tc-space-6); color: var(--tc-icon-muted); }
.ui-pvf__notice[role="alert"] .ui-pvf__notice-icon { color: var(--tc-status-danger-fg); }
.ui-pvf__notice-title { margin: 0; color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-pvf__notice-text { margin: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-pvf__btn { margin-top: var(--tc-space-2); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-3); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); }
.ui-pvf__btn:hover { background: var(--tc-fill-hover); }
.ui-pvf__size { position: relative; margin: 0; padding: var(--tc-space-1-5) var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; text-align: center; }

/* Narrow, as in a side panel: the address takes its own line under the buttons */
@container (max-width: 30rem) {
  .ui-pvf__bar { flex-wrap: wrap; row-gap: var(--tc-space-1-5); }
  .ui-pvf__end { margin-inline-start: auto; }
  .ui-pvf__address { order: 3; flex-basis: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-pvf__reload[data-spin] .ui-pvf__glyph, .ui-pvf__progress::after { animation: none; }
  .ui-pvf__progress::after { width: 100%; }
  .ui-pvf__tool { transition: none; }
}
@media (forced-colors: active) {
  .ui-pvf__vp[aria-checked="true"], .ui-pvf__tabwrap[data-active] { outline: var(--tc-hairline) solid Highlight; }
  .ui-pvf__progress::after { background: Highlight; }
}
`;
}

if (!customElements.get("tc-preview-frame")) customElements.define("tc-preview-frame", TcPreviewFrame);
declare global {
  interface HTMLElementTagNameMap {
    "tc-preview-frame": TcPreviewFrame;
  }
}
