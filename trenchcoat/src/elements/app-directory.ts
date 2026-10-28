import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { safeMediaUrl } from "./internal/safe-media";
import { safeUrl } from "./internal/safe-url";
import "./button";

/*
 * <tc-app-directory> – browse, search and connect integrations: categories on the left, a grid of app cards on the
 * right, a search field and a filter menu (All apps / Connected / Not connected). Connecting shows a short
 * Connecting… state, or waits for the promise `onToggle` returns (an OAuth round trip) and leaves the app as it was,
 * with an error to retry from, when it rejects. The Lit port of blocks/app-directory.tsx.
 * One look for both looks, as the block had: a gray tray with a slim title bar holding a white card.
 * Keyboard: Tab through the controls; the filter menu follows the menu pattern (arrows, Home/End, Escape returns to
 * its trigger). When a card or the empty state goes away under focus (a filter, Clear search, View all), focus moves
 * to the next card's button or the control that replaced it – never to <body>.
 *
 *   <tc-app-directory .apps=${[…]} .onToggle=${(app, on) => authorize(app)}></tc-app-directory>
 */

/** A logo or icon: a DOM node (cloned where it shows), a Lit template, or an image URL */
export type DirectoryLogo = Element | TemplateResult | string | null | undefined;

export type DirectoryApp = {
  id: string;
  name: string;
  /** Who builds the integration, shown under the name */
  vendor: string;
  description: string;
  categories: string[];
  logo?: DirectoryLogo;
  /** Brand colour behind the logo – leave empty for a white tile with a thin edge */
  tile?: string;
  /** Shown in the Essentials section */
  essential?: boolean;
  /** Connected at the start, when `connected` isn't set */
  connected?: boolean;
};

export type DirectoryCategory = { id: string; label: string; icon?: DirectoryLogo };

/** Which apps the filter menu shows */
export type DirectoryStatus = "all" | "connected" | "available";

/** Detail of tc-connected-change: the new list, and the app that was connected (`on`) or disconnected */
export type DirectoryConnectedChange = { connected: string[]; app: DirectoryApp; on: boolean };

/** Connects or disconnects an app – may return a promise the card waits for; a rejection keeps the app as it was */
export type DirectoryToggle = (app: DirectoryApp, connected: boolean) => void | Promise<unknown>;

const STATUS_LABELS: Record<DirectoryStatus, string> = { all: "All apps", connected: "Connected", available: "Not connected" };
let uid = 0;

/**
 * Browse, search and connect integrations – categories, a filter menu and app cards with a connect flow.
 * @tag tc-app-directory
 * @fires tc-connected-change - An app was connected or disconnected (`{ connected, app, on }`: DirectoryConnectedChange); cancelable – prevented, `connected` stays as it was
 * @fires tc-learn-more - "Learn more" was pressed (detail: null); cancelable – prevented, the link doesn't open
 */
export class TcAppDirectory extends TcElement {
  static override ui = "adir";

  /** The heading, and the region's name */
  @property() accessor heading = "Integrations";
  /** The line under the heading */
  @property() accessor subtitle = "Connect the tools your team already works in.";
  /** Where "Learn more" goes; unset, the link only fires tc-learn-more */
  @property({ attribute: "learn-more-href" }) accessor learnMoreHref = "";
  /** The apps */
  @property({ attribute: false }) accessor apps: DirectoryApp[] = defaultDirectoryApps;
  /** The categories in the side list – "essentials" (apps marked essential) and "all" are built in */
  @property({ attribute: false }) accessor categories: DirectoryCategory[] = defaultDirectoryCategories;
  /** Ids of the connected apps; unset, it starts from each app's `connected` */
  @property({ attribute: false }) accessor connected: string[] | undefined = undefined;
  /** Connects or disconnects an app. Return a promise for the real work: the card shows Connecting… until it settles,
   *  and a rejection leaves the app as it was with its message to retry from. Without a promise, connecting shows a
   *  short Connecting… state first */
  @property({ attribute: false }) accessor onToggle: DirectoryToggle | undefined = undefined;

  @state() private accessor category = "essentials";
  @state() private accessor query = "";
  @state() private accessor status: DirectoryStatus = "all";
  @state() private accessor menu = false;
  @state() private accessor busy = new Set<string>();
  @state() private accessor failed: Record<string, string> = {};
  @state() private accessor announcement = "";

  readonly #searchId = `tc-adir-search-${++uid}`;
  /** The aria-label this element set from the heading (a page's own label is left alone) */
  #label: string | null = null;
  readonly #timers = new Set<ReturnType<typeof setTimeout>>();
  #frames: number[] = [];
  #focusNext: string | null = null;
  #lastFocus: { el: Element; index: number } | null = null;
  #ro: ResizeObserver | null = null;
  #observed = new Set<Element>();
  /** Logos are DOM nodes from the page: one clone per place they show, kept across renders */
  #clones = new WeakMap<Element, Map<string, Node>>();

  /** The connected ids in effect */
  get connectedIds(): string[] {
    return this.connected ?? this.apps.filter((a) => a.connected).map((a) => a.id);
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener("focusin", this.#rememberFocus);
    if (typeof ResizeObserver !== "undefined")
      this.#ro = new ResizeObserver(() => {
        this.#syncConnect();
        this.#syncMorph();
      });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("focusin", this.#rememberFocus);
    window.removeEventListener("pointerdown", this.#away);
    for (const t of this.#timers) clearTimeout(t);
    this.#timers.clear();
    for (const f of this.#frames) cancelAnimationFrame(f);
    this.#frames = [];
    this.#ro?.disconnect();
    this.#ro = null;
    this.#observed.clear();
    // Work still pending when it comes back starts over from what it shows
    this.busy = new Set();
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // The host is the region, named by the heading (the block's <section aria-label>) – unless the page named it
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    if (changed.has("heading") && (!this.hasAttribute("aria-label") || this.getAttribute("aria-label") === this.#label)) {
      this.setAttribute("aria-label", this.heading);
      this.#label = this.heading;
    }
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("menu")) {
      if (this.menu) {
        window.addEventListener("pointerdown", this.#away);
        // Opening moves focus to the checked option
        this.querySelector<HTMLElement>(".ui-adir__menu [aria-checked='true']")?.focus({ preventScroll: true });
      } else window.removeEventListener("pointerdown", this.#away);
    }
    this.#restoreFocus();
    // Observe what this render added: the connect labels (their buttons' widths follow them) and the main column
    if (this.#ro) {
      for (const el of this.querySelectorAll(".ui-adir__connect-label, .ui-adir__main")) {
        if (!this.#observed.has(el)) {
          this.#observed.add(el);
          this.#ro.observe(el);
        }
      }
      for (const el of this.#observed) if (!el.isConnected) this.#observed.delete(el);
    }
    this.#syncConnect();
    this.#syncMorph();
  }

  /* ---------- Focus: never drops to <body> ---------- */

  #rememberFocus = (e: FocusEvent) => {
    const el = e.target as HTMLElement;
    this.#lastFocus = { el, index: [...this.querySelectorAll(".ui-adir__connect")].indexOf(el) };
  };

  #restoreFocus() {
    const selector = this.#focusNext;
    this.#focusNext = null;
    const gone = this.#lastFocus && !this.#lastFocus.el.isConnected ? this.#lastFocus : null;
    // Only right after the removal – a stale entry never pulls focus later
    if (gone) this.#lastFocus = null;
    const active = this.ownerDocument.activeElement;
    const lost = gone && (active === this.ownerDocument.body || !active);
    if (!selector && !lost) return;
    const buttons = this.querySelectorAll<HTMLElement>(".ui-adir__connect");
    const target =
      (selector && this.querySelector<HTMLElement>(selector)) ||
      (lost && gone && gone.index >= 0 ? buttons[Math.min(gone.index, buttons.length - 1)] : null) ||
      this.querySelector<HTMLElement>(".ui-adir__heading");
    target?.focus({ preventScroll: true });
  }

  /* ---------- Motion: connect widths and the results' height glide ---------- */

  #syncConnect() {
    for (const b of this.querySelectorAll<HTMLElement>(".ui-adir__connect")) {
      const label = b.firstElementChild as HTMLElement | null;
      if (!label) continue;
      const cs = getComputedStyle(b);
      const width = `${label.offsetWidth + parseFloat(cs.paddingLeft || "0") + parseFloat(cs.paddingRight || "0")}px`;
      if (b.style.width !== width) b.style.width = width;
      // Transitions switch on after the first measurement, so the first render doesn't animate
      if (!b.hasAttribute("data-smooth")) this.#frame(() => b.setAttribute("data-smooth", ""));
    }
  }

  #syncMorph() {
    const outer = this.querySelector<HTMLElement>(".ui-adir__morph");
    const inner = this.querySelector<HTMLElement>(".ui-adir__main");
    if (!outer || !inner) return;
    const height = `${inner.offsetHeight}px`;
    if (outer.style.height !== height) outer.style.height = height;
    if (!outer.hasAttribute("data-smooth")) this.#frame(() => outer.setAttribute("data-smooth", ""));
  }

  #frame(fn: () => void) {
    const id = requestAnimationFrame(() => {
      this.#frames = this.#frames.filter((f) => f !== id);
      fn();
    });
    this.#frames.push(id);
  }

  /* ---------- The filter menu ---------- */

  #away = (e: PointerEvent) => {
    if (!this.querySelector(".ui-adir__filter")?.contains(e.target as Node)) this.menu = false;
  };

  #trigger() {
    return this.querySelector<HTMLElement>(".ui-adir__filter-btn button");
  }

  /** Close the filter menu; focus goes back to its trigger when it was inside the menu */
  #closeMenu() {
    if (this.querySelector(".ui-adir__menu")?.contains(this.ownerDocument.activeElement)) this.#trigger()?.focus();
    this.menu = false;
  }

  #onMenuKey = (e: KeyboardEvent) => {
    const list = [...(e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>("[role='menuitemradio']")];
    const at = list.indexOf(this.ownerDocument.activeElement as HTMLElement);
    const go = (i: number) => {
      e.preventDefault();
      list[(i + list.length) % list.length]?.focus();
    };
    if (e.key === "ArrowDown") go(at + 1);
    else if (e.key === "ArrowUp") go(at - 1);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(list.length - 1);
    else if (e.key === "Escape") {
      e.preventDefault();
      this.#closeMenu();
    } else if (e.key === "Tab") this.menu = false;
  };

  #pick(s: DirectoryStatus) {
    this.status = s;
    this.#closeMenu();
  }

  /* ---------- Connecting ---------- */

  #setBusy(id: string, on: boolean) {
    const next = new Set(this.busy);
    if (on) next.add(id);
    else next.delete(id);
    this.busy = next;
  }

  #apply(app: DirectoryApp, on: boolean) {
    const ids = this.connectedIds;
    const connected = on ? [...ids.filter((x) => x !== app.id), app.id] : ids.filter((x) => x !== app.id);
    this.announcement = `${app.name} ${on ? "connected" : "disconnected"}`;
    if (this.emit<DirectoryConnectedChange>("tc-connected-change", { connected, app, on }, { cancelable: true })) this.connected = connected;
  }

  #toggle(app: DirectoryApp) {
    if (this.busy.has(app.id)) return;
    const on = !this.connectedIds.includes(app.id);
    const { [app.id]: _, ...others } = this.failed;
    this.failed = others;
    let result: unknown;
    try {
      result = this.onToggle?.(app, on);
    } catch (error) {
      result = Promise.reject(error);
    }
    if (result instanceof Promise) {
      // The real work: pending until it settles, and nothing changes if it fails
      this.#setBusy(app.id, true);
      result.then(
        () => {
          if (!this.isConnected || !this.busy.has(app.id)) return;
          this.#setBusy(app.id, false);
          this.#apply(app, on);
        },
        (error: unknown) => {
          if (!this.isConnected || !this.busy.has(app.id)) return;
          this.#setBusy(app.id, false);
          this.failed = { ...this.failed, [app.id]: error instanceof Error && error.message ? error.message : on ? "Couldn't connect." : "Couldn't disconnect." };
        },
      );
      return;
    }
    if (!on) return this.#apply(app, false);
    // A short "connecting" state, like a real authorization round trip
    this.#setBusy(app.id, true);
    const timer = setTimeout(() => {
      this.#timers.delete(timer);
      this.#setBusy(app.id, false);
      this.#apply(app, true);
    }, 900);
    this.#timers.add(timer);
  }

  #learnMore = (e: MouseEvent) => {
    if (!this.emit("tc-learn-more", null, { cancelable: true }) || !safeUrl(this.learnMoreHref)) e.preventDefault();
  };

  /* ---------- Rendering ---------- */

  #inCategory(app: DirectoryApp, id: string) {
    return id === "all" ? true : id === "essentials" ? !!app.essential : app.categories.includes(id);
  }

  #logo(logo: DirectoryLogo, place: string): unknown {
    if (logo == null || logo === "") return nothing;
    if (typeof logo === "string") {
      const src = safeMediaUrl(logo);
      return src ? html`<img src=${src} alt="" />` : nothing;
    }
    if (typeof Element !== "undefined" && logo instanceof Element) {
      let byPlace = this.#clones.get(logo);
      if (!byPlace) this.#clones.set(logo, (byPlace = new Map()));
      let clone = byPlace.get(place);
      if (!clone) byPlace.set(place, (clone = logo.cloneNode(true)));
      return clone;
    }
    return logo;
  }

  #tile(app: DirectoryApp, place: string) {
    return html`<span class="ui-adir__tile" ?data-filled=${!!app.tile} style=${ifDefined(app.tile ? `background: ${app.tile}` : undefined)}>${this.#logo(app.logo, place)}</span>`;
  }

  #connect(app: DirectoryApp, state: "off" | "busy" | "on") {
    // The name is the visible label plus the app (hidden); a connected app shows Disconnect on hover and focus
    return html`<button type="button" class="ui-adir__connect" data-state=${state} aria-disabled=${ifDefined(state === "busy" ? "true" : undefined)} @click=${() => this.#toggle(app)}>
      <span class="ui-adir__connect-label"
        >${state === "busy"
          ? html`<span class="ui-adir__spinner" aria-hidden="true"></span> Connecting…`
          : state === "on"
            ? html`${linkIcon()} <span class="ui-adir__on-label">Connected</span><span class="ui-adir__off-label">Disconnect</span>`
            : "Connect"}<span class="ui-adir__sr"> ${app.name}</span></span
      >
    </button>`;
  }

  protected override render() {
    const connected = new Set(this.connectedIds);
    const q = this.query.trim().toLowerCase();
    const shown = this.apps.filter((a) => {
      if (q && !`${a.name} ${a.vendor} ${a.description}`.toLowerCase().includes(q)) return false;
      if (!q && !this.#inCategory(a, this.category)) return false;
      if (this.status === "connected" && !connected.has(a.id)) return false;
      if (this.status === "available" && connected.has(a.id)) return false;
      return true;
    });
    const heading = q ? `Results for “${this.query.trim()}”` : (this.categories.find((c) => c.id === this.category)?.label ?? "Apps");
    const more = this.apps.filter((a) => !a.essential);
    const showDiscover = !q && this.category === "essentials" && this.status === "all" && more.length > 0;
    const href = safeUrl(this.learnMoreHref);

    return html`
      <header class="ui-adir__bar">
        <span class="ui-adir__bar-title">Apps</span>
        <span class="ui-adir__bar-meta">${connected.size} connected</span>
      </header>
      <div class="ui-adir__card">
        <div class="ui-adir__intro">
          <h2 class="ui-adir__title">${this.heading}</h2>
          <p class="ui-adir__subtitle">${this.subtitle} <a href=${href ?? "#"} class="ui-adir__link" @click=${this.#learnMore}>Learn more ${arrowIcon()}</a></p>
        </div>
        <div class="ui-adir__tools">
          <label class="ui-adir__search" for=${this.#searchId}>
            ${searchIcon()}
            <input
              id=${this.#searchId}
              type="search"
              placeholder="Search apps"
              autocomplete="off"
              .value=${this.query}
              @input=${(e: Event) => (this.query = (e.target as HTMLInputElement).value)}
              @change=${(e: Event) => (this.query = (e.target as HTMLInputElement).value)}
            />
          </label>
          <div class="ui-adir__filter">
            <tc-button
              variant="secondary"
              class="ui-adir__filter-btn"
              label=${this.status === "all" ? "Filter" : STATUS_LABELS[this.status]}
              aria-haspopup="menu"
              aria-expanded=${this.menu ? "true" : "false"}
              ?data-active=${this.status !== "all"}
              @click=${() => (this.menu ? this.#closeMenu() : (this.menu = true))}
              >${filterIcon()}</tc-button
            >
            ${this.menu
              ? html`<div class="ui-adir__menu" role="menu" aria-label="Show" @keydown=${this.#onMenuKey}>
                  ${(["all", "connected", "available"] as DirectoryStatus[]).map(
                    (s) => html`<button type="button" role="menuitemradio" tabindex="-1" aria-checked=${this.status === s ? "true" : "false"} class="ui-adir__menu-item" @click=${() => this.#pick(s)}>
                      ${STATUS_LABELS[s]}${this.status === s ? checkIcon() : nothing}
                    </button>`,
                  )}
                </div>`
              : nothing}
          </div>
        </div>
        <div class="ui-adir__layout">
          <nav class="ui-adir__nav" aria-label="Categories">
            ${repeat(
              this.categories,
              (c) => c.id,
              (c) => {
                const count = this.apps.filter((a) => this.#inCategory(a, c.id)).length;
                const current = !q && this.category === c.id;
                return html`<button
                  type="button"
                  class="ui-adir__nav-item"
                  aria-current=${ifDefined(current ? "true" : undefined)}
                  data-category=${c.id}
                  @click=${() => {
                    this.category = c.id;
                    this.query = "";
                  }}
                >
                  <span class="ui-adir__nav-icon">${this.#logo(c.icon, "nav")}</span>
                  <span class="ui-adir__nav-label">${c.label}</span>
                  <span class="ui-adir__nav-count">${count}</span>
                </button>`;
              },
            )}
          </nav>
          <div class="ui-adir__morph">
            <div class="ui-adir__main">
              <h3 class="ui-adir__heading" tabindex="-1">${heading}<span>${shown.length}</span></h3>
              ${shown.length === 0
                ? html`<div class="ui-adir__empty">
                    <p>No apps match.</p>
                    <tc-button
                      variant="secondary"
                      class="ui-adir__clear"
                      label="Clear search"
                      @click=${() => {
                        this.#focusNext = `[id="${this.#searchId}"]`;
                        this.query = "";
                        this.status = "all";
                      }}
                    ></tc-button>
                  </div>`
                : html`<ul class="ui-adir__grid">
                    ${repeat(
                      shown,
                      (app) => app.id,
                      (app, i) => {
                        const isOn = connected.has(app.id);
                        return html`<li class="ui-adir__app" ?data-connected=${isOn} style=${`animation-delay: ${i * 30}ms`}>
                          <div class="ui-adir__app-head">
                            ${this.#tile(app, "card")}
                            <span class="ui-adir__app-name">
                              <span class="ui-adir__name">${app.name}${verifiedIcon()}</span>
                              <span class="ui-adir__vendor">By ${app.vendor}</span>
                            </span>
                          </div>
                          <p class="ui-adir__desc">${app.description}</p>
                          ${this.failed[app.id] ? html`<p class="ui-adir__error" role="alert">${this.failed[app.id]}</p>` : nothing}
                          ${this.#connect(app, this.busy.has(app.id) ? "busy" : isOn ? "on" : "off")}
                        </li>`;
                      },
                    )}
                    ${showDiscover
                      ? html`<li class="ui-adir__app ui-adir__discover">
                          <div class="ui-adir__discover-head">
                            <span>
                              <span class="ui-adir__name">Discover more</span>
                              <span class="ui-adir__vendor">+${more.length} apps</span>
                            </span>
                            <span class="ui-adir__stack" aria-hidden="true">${more.slice(0, 3).map((a) => this.#tile(a, "stack"))}</span>
                          </div>
                          <tc-button
                            variant="secondary"
                            size="sm"
                            class="ui-adir__view-all"
                            label="View all"
                            @click=${() => {
                              this.#focusNext = '[data-category="all"]';
                              this.category = "all";
                            }}
                          ></tc-button>
                        </li>`
                      : nothing}
                  </ul>`}
            </div>
          </div>
        </div>
      </div>
      <p class="ui-adir__sr" role="status">${this.announcement}</p>
    `;
  }

  static override css = /* css */ `
[data-ui="adir"] {
  --tc-adir-space-1px: 1px;
  --tc-adir-space-11px: 11px;
  --tc-adir-space-44px: 44px;
  --tc-adir-space-5px: 5px;
  --tc-adir-space-7px: 7px;
  --tc-app-directory-tile-filled-ring: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.1));
  --tc-app-directory-discover-bg: light-dark(#fcfcfc, #1c1c1f);
  box-sizing: border-box;
  width: 100%;
  container-type: inline-size;
  /* A tray with a slim title bar; the card sits on top of it */
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="adir"] *, [data-ui="adir"] *::before, [data-ui="adir"] *::after { box-sizing: border-box; }
[data-ui="adir"] :where(button[class^="ui-adir__"]) { margin: 0; font: inherit; color: inherit; cursor: pointer; }
[data-ui="adir"] button:focus-visible,
[data-ui="adir"] a:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-adir__sr { position: absolute; width: 1px; height: 1px; margin: calc(var(--tc-adir-space-1px) * -1); padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

.ui-adir__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--tc-adir-space-11px) var(--tc-space-5) var(--tc-space-2-5);
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
}
.ui-adir__bar-title { font-weight: var(--tc-font-weight-medium); }
.ui-adir__bar-meta { font-size: var(--tc-font-size-md); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }

.ui-adir__card {
  padding: var(--tc-space-10) var(--tc-space-10) var(--tc-adir-space-44px);
  background: var(--tc-surface-on-tray);
  border-radius: var(--tc-card-radius);
  box-shadow: var(--tc-card-shadow);
}
.ui-adir__title {
  margin: 0;
  font-size: var(--tc-font-size-3xl);
  font-weight: var(--tc-font-weight-semibold);
  line-height: var(--tc-line-height-display);
  letter-spacing: var(--tc-tracking-tight);
}
.ui-adir__subtitle {
  margin: var(--tc-space-1-5) 0 0;
  font-size: var(--tc-font-size-lg-plus);
  line-height: var(--tc-line-height-relaxed);
  color: var(--tc-text-muted);
}
.ui-adir__link {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-0-5);
  color: var(--tc-text-secondary);
  text-decoration: underline;
  text-decoration-color: var(--tc-border-strong);
  text-underline-offset: 3px;
}
.ui-adir__link:hover { color: var(--tc-text-primary); text-decoration-color: currentColor; }

.ui-adir__tools {
  display: flex;
  gap: var(--tc-space-2-5);
  margin-top: var(--tc-space-7);
}
/* Search: the field pattern */
.ui-adir__search {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  gap: var(--tc-space-2);
  height: var(--tc-field-h);
  padding: 0 var(--tc-field-px);
  border-radius: var(--tc-field-radius);
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  color: var(--tc-text-muted);
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-adir__search:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-adir__search:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-adir__search input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: var(--tc-field-font-size);
  color: var(--tc-text-primary);
}
.ui-adir__search input::placeholder { color: var(--tc-text-placeholder); }
.ui-adir__search input::-webkit-search-cancel-button { display: none; }

/* The filter trigger is a secondary Button at the field's height; a filter in use shows the selected ring */
[data-ui="adir"] .ui-adir__filter-btn { --tc-button-h: var(--tc-field-h); }
[data-ui="adir"] .ui-adir__filter-btn[data-active] { --tc-button-fg: var(--tc-accent-text); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-selected), var(--tc-shadow-control); }
.ui-adir__filter { position: relative; }
.ui-adir__menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: var(--tc-z-dropdown);
  display: grid;
  gap: var(--tc-space-0-5);
  min-width: 180px;
  padding: var(--tc-menu-padding);
  border-radius: var(--tc-menu-radius);
  background: var(--tc-menu-bg);
  box-shadow: var(--tc-menu-shadow);
  animation: ui-adir-drop var(--tc-duration-base) var(--tc-ease-move);
}
[data-ui="adir"] .ui-adir__menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--tc-menu-item-h);
  padding: 0 var(--tc-menu-item-px);
  border: 0;
  border-radius: var(--tc-menu-item-radius);
  background: transparent;
  font-size: var(--tc-menu-item-font-size);
  text-align: left;
}
[data-ui="adir"] .ui-adir__menu-item:is(:hover, :focus-visible) { background: var(--tc-menu-item-hover); }
[data-ui="adir"] .ui-adir__menu-item:focus-visible { outline-offset: calc(var(--tc-focus-ring-width) * -1); }
[data-ui="adir"] .ui-adir__menu-item[aria-checked="true"] { color: var(--tc-menu-item-selected-fg); font-weight: var(--tc-font-weight-medium); }

.ui-adir__layout {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: var(--tc-space-8);
  margin-top: var(--tc-space-7);
}
.ui-adir__nav {
  display: flex;
  flex-direction: column;
  gap: var(--tc-space-0-5);
}
[data-ui="adir"] .ui-adir__nav-item {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  min-height: var(--tc-menu-item-h);
  padding: 0 var(--tc-space-2-5);
  border: 0;
  border-radius: var(--tc-radius-md);
  background: transparent;
  font-size: var(--tc-font-size-lg);
  text-align: left;
  color: var(--tc-text-secondary);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
[data-ui="adir"] .ui-adir__nav-item:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
[data-ui="adir"] .ui-adir__nav-item[aria-current] { background: var(--tc-fill-default); color: var(--tc-text-primary); font-weight: var(--tc-font-weight-medium); }
.ui-adir__nav-icon { display: grid; color: var(--tc-text-muted); }
.ui-adir__nav-item[aria-current] .ui-adir__nav-icon { color: var(--tc-text-primary); }
.ui-adir__nav-label { flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-adir__nav-count { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-regular); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); }

.ui-adir__heading {
  display: flex;
  align-items: baseline;
  gap: var(--tc-space-2);
  margin: var(--tc-space-1) 0 var(--tc-space-3-5);
  font-size: var(--tc-font-size-xl);
  font-weight: var(--tc-font-weight-semibold);
  line-height: var(--tc-line-height-loose);
}
.ui-adir__heading:focus { outline: none; }
.ui-adir__heading span { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }

.ui-adir__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--tc-space-3-5);
  margin: 0;
  padding: 0;
  list-style: none;
}
.ui-adir__app {
  display: flex;
  flex-direction: column;
  padding: var(--tc-space-4);
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  animation: ui-adir-in var(--tc-duration-slower) var(--tc-ease-move) both;
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-adir__app:hover { box-shadow: var(--tc-card-shadow-hover); }
.ui-adir__app-head { display: flex; align-items: center; gap: var(--tc-space-3); }
.ui-adir__tile {
  display: grid;
  place-items: center;
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: var(--tc-radius-lg);
  background: var(--tc-surface-overlay);
  box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default);
}
.ui-adir__tile[data-filled] { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-app-directory-tile-filled-ring); }
.ui-adir__tile svg { width: 21px; height: 21px; }
.ui-adir__app-name { display: grid; min-width: 0; }
.ui-adir__name {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-adir-space-5px);
  font-size: var(--tc-font-size-lg-plus);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-normal);
}
.ui-adir__verified { flex: none; color: var(--tc-accent-text); }
.ui-adir__vendor { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
/* Two lines at most – keeps every card the same compact height */
.ui-adir__desc {
  display: -webkit-box;
  flex: 1;
  margin: var(--tc-space-2-5) 0 var(--tc-space-3-5);
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  min-height: 2lh;
  color: var(--tc-text-muted);
}
.ui-adir__error { margin: calc(var(--tc-space-2) * -1) 0 var(--tc-space-2-5); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-status-danger-fg); }

/* Connect: a small secondary button whose width glides between its labels */
[data-ui="adir"] .ui-adir__connect {
  display: inline-flex;
  align-items: center;
  overflow: hidden;
  white-space: nowrap;
  align-self: flex-start;
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-control-px-sm);
  border: 0;
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  color: var(--tc-action-secondary-fg);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
[data-ui="adir"] .ui-adir__connect[data-smooth] {
  transition: width var(--tc-duration-slow) var(--tc-ease-move), background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-adir__connect-label { display: inline-flex; flex: none; align-items: center; gap: var(--tc-adir-space-7px); }
[data-ui="adir"] .ui-adir__connect:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
[data-ui="adir"] .ui-adir__connect[data-state="busy"] { color: var(--tc-text-muted); cursor: progress; }
[data-ui="adir"] .ui-adir__connect[data-state="on"] { color: var(--tc-status-success-fg); background: var(--tc-status-success-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-success-border); }
.ui-adir__off-label { display: none; }
/* Connected: hover or keyboard focus shows what pressing does */
[data-ui="adir"] .ui-adir__connect[data-state="on"]:is(:hover, :focus-visible) { color: var(--tc-status-danger-fg); background: var(--tc-status-danger-bg); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-danger-border); }
.ui-adir__connect[data-state="on"]:is(:hover, :focus-visible) .ui-adir__on-label { display: none; }
.ui-adir__connect[data-state="on"]:is(:hover, :focus-visible) .ui-adir__off-label { display: inline; }
.ui-adir__spinner {
  width: 12px;
  height: 12px;
  border: 1.5px solid var(--tc-border-strong);
  border-top-color: var(--tc-text-primary);
  border-radius: 50%;
  animation: ui-adir-spin var(--tc-duration-reveal) linear infinite;
}

.ui-adir__discover {
  justify-content: space-between;
  box-shadow: none;
  outline: var(--tc-hairline) dashed var(--tc-border-strong);
  outline-offset: calc(var(--tc-hairline) * -1);
  background: var(--tc-app-directory-discover-bg);
}
.ui-adir__discover:hover { box-shadow: none; }
.ui-adir__discover-head { display: flex; justify-content: space-between; gap: var(--tc-space-3); }
.ui-adir__discover-head > span:first-child { display: grid; }
.ui-adir__view-all { align-self: flex-start; margin-top: var(--tc-space-4-5); }
.ui-adir__stack { display: flex; }
.ui-adir__stack .ui-adir__tile { width: 34px; height: 34px; border-radius: var(--tc-radius-lg); box-shadow: 0 0 0 2px var(--tc-app-directory-discover-bg), inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-adir__stack .ui-adir__tile + .ui-adir__tile { margin-left: calc(var(--tc-space-2-5) * -1); }
.ui-adir__stack .ui-adir__tile svg { width: 17px; height: 17px; }

.ui-adir__empty {
  display: grid;
  justify-items: center;
  gap: var(--tc-space-3);
  padding: var(--tc-space-12) 0;
  border: var(--tc-hairline) dashed var(--tc-border-strong);
  border-radius: var(--tc-radius-2xl);
  font-size: var(--tc-font-size-lg);
  color: var(--tc-text-muted);
}
.ui-adir__empty p { margin: 0; }

/* Narrower containers: categories turn into a row of chips, the grid gets fewer columns */
@container (max-width: 820px) {
  .ui-adir__layout { grid-template-columns: minmax(0, 1fr); gap: var(--tc-space-4-5); }
  .ui-adir__nav { flex-direction: row; overflow-x: auto; scrollbar-width: none; }
  [data-ui="adir"] .ui-adir__nav-item { flex: none; }
  .ui-adir__nav-count { display: none; }
  .ui-adir__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@container (max-width: 560px) {
  .ui-adir__card { padding: var(--tc-space-6) var(--tc-space-4-5) var(--tc-space-7); }
  .ui-adir__grid { grid-template-columns: minmax(0, 1fr); }
}

@keyframes ui-adir-in { from { opacity: 0; transform: translateY(4px); } }
@keyframes ui-adir-drop { from { opacity: 0; transform: translateY(-4px) scale(0.98); } }
@keyframes ui-adir-spin { to { transform: rotate(360deg); } }

@media (prefers-reduced-motion: reduce) {
  .ui-adir__app, .ui-adir__menu { animation: none; }
}

/* Height changes glide instead of jumping */
.ui-adir__morph { overflow: hidden; margin: calc(var(--tc-space-1-5) * -1); }
/* Room inside the clipping, so card hover shadows aren't cut */
.ui-adir__main { padding: var(--tc-space-1-5); }
.ui-adir__morph[data-smooth] { transition: height var(--tc-duration-slower) var(--tc-ease-move); }
@media (prefers-reduced-motion: reduce) {
  .ui-adir__morph[data-smooth], [data-ui="adir"] .ui-adir__connect[data-smooth] { transition: none; }
}

/* The search field shows its focus with the field ring (above), not a second outline – also against global
   :focus-visible rules of the host page */
[data-ui="adir"] .ui-adir__search input:focus-visible { outline: none; }
`;
}

/* ---------- Icons (Lucide-style strokes) ---------- */

const line = (d: string, size = 16, slot?: string) =>
  svg`<svg viewBox="0 0 16 16" width=${size} height=${size} fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" slot=${slot ?? nothing}><path d=${d} /></svg>`;
const searchIcon = () => line("M7 12.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM11 11l3.5 3.5");
const filterIcon = () => line("M2.5 4.5h11M4.5 8h7M6.5 11.5h3", 16, "icon");
const arrowIcon = () => line("M5 11 11 5M6 5h5v5", 12);
const checkIcon = () => line("m3.5 8.5 3 3 6-7", 14);
const linkIcon = () => line("M6.5 9.5l3-3M7.3 4.7l.9-.9a2.5 2.5 0 0 1 3.5 3.5l-.9.9M8.7 11.3l-.9.9a2.5 2.5 0 0 1-3.5-3.5l.9-.9", 14);
/** Verified seal: 12 even points around the center, softened by a round stroke, with a centered tick */
const verifiedIcon = () =>
  svg`<svg class="ui-adir__verified" viewBox="0 0 16 16" width="15" height="15" role="img" aria-label="Verified"><path d="M8.00 0.80 L9.55 2.20 L11.60 1.76 L12.24 3.76 L14.24 4.40 L13.80 6.45 L15.20 8.00 L13.80 9.55 L14.24 11.60 L12.24 12.24 L11.60 14.24 L9.55 13.80 L8.00 15.20 L6.45 13.80 L4.40 14.24 L3.76 12.24 L1.76 11.60 L2.20 9.55 L0.80 8.00 L2.20 6.45 L1.76 4.40 L3.76 3.76 L4.40 1.76 L6.45 2.20Z" fill="currentColor" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" /><path d="m5.3 8.1 1.8 1.8 3.6-3.7" fill="none" stroke="var(--tc-text-on-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>`;

/** The category icons the default categories use */
export const directoryCategoryIcons = {
  essentials: line("m8 1.8 1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6Z"),
  all: line("M2.5 2.5h4v4h-4zM9.5 2.5h4v4h-4zM2.5 9.5h4v4h-4zM9.5 9.5h4v4h-4z"),
  analytics: line("M2.5 2.5h11v11h-11zM5.5 10.5v-2M8 10.5v-5M10.5 10.5V7"),
  automation: line("M9 1.5 3.5 9H8l-1 5.5L12.5 7H8Z"),
  billing: line("M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM10 5.8C9.6 5.2 8.9 5 8 5c-1.1 0-2 .6-2 1.5S6.9 7.8 8 8s2 .6 2 1.5S9.1 11 8 11c-.9 0-1.7-.3-2.1-1M8 3.8V5M8 11v1.2"),
  communication: line("M2.5 3.5h11v7.5H7l-3 2.5V11H2.5Z"),
  crm: line("M6 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.5 13.5c.6-2.3 2.3-3.5 4.5-3.5s3.9 1.2 4.5 3.5M10.5 2.7a2.5 2.5 0 0 1 0 4.6M12.5 10.3c1 .6 1.7 1.6 2 3.2"),
  design: line("M10.5 2.5 13.5 5.5 6 13H3v-3ZM9 4l3 3"),
  development: line("M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5"),
  docs: line("M4 1.5h5.5l3 3v10H4zM9.5 1.5v3h3M6 8h4.5M6 10.5h4.5"),
  product: line("M2.5 2.5h3v11h-3zM6.5 2.5h3v7h-3zM10.5 2.5h3v4h-3z"),
  scheduling: line("M2.5 3.5h11v10h-11zM2.5 6.5h11M5.5 1.5v3M10.5 1.5v3"),
  storage: line("M2.5 4c0-1.1 2.5-2 5.5-2s5.5.9 5.5 2-2.5 2-5.5 2-5.5-.9-5.5-2ZM2.5 4v8c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2V4M2.5 8c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2"),
};

/* Brand marks: Simple Icons (CC0); Slack and Figma in their own colours; black marks use currentColor so they turn
   light in dark mode */
const mark = (d: string, color: string) => svg`<svg viewBox="0 0 24 24" fill=${color} aria-hidden="true"><path d=${d} /></svg>`;

const slackLogo = () => svg`<svg viewBox="0 0 24 24" aria-hidden="true">
  <path fill="#E01E5A" d="M5.04 15.17a2.53 2.53 0 0 1-2.52 2.52A2.53 2.53 0 0 1 0 15.17a2.53 2.53 0 0 1 2.52-2.53h2.52zm1.27 0a2.53 2.53 0 0 1 2.53-2.53 2.53 2.53 0 0 1 2.52 2.53v6.31A2.53 2.53 0 0 1 8.84 24a2.53 2.53 0 0 1-2.53-2.52z" />
  <path fill="#36C5F0" d="M8.84 5.04a2.53 2.53 0 0 1-2.53-2.52A2.53 2.53 0 0 1 8.84 0a2.53 2.53 0 0 1 2.52 2.52v2.52zm0 1.27a2.53 2.53 0 0 1 2.52 2.53 2.53 2.53 0 0 1-2.52 2.52H2.52A2.53 2.53 0 0 1 0 8.84a2.53 2.53 0 0 1 2.52-2.53z" />
  <path fill="#2EB67D" d="M18.96 8.84a2.53 2.53 0 0 1 2.52-2.53A2.53 2.53 0 0 1 24 8.84a2.53 2.53 0 0 1-2.52 2.52h-2.52zm-1.27 0a2.53 2.53 0 0 1-2.53 2.52 2.53 2.53 0 0 1-2.52-2.52V2.52A2.53 2.53 0 0 1 15.16 0a2.53 2.53 0 0 1 2.53 2.52z" />
  <path fill="#ECB22E" d="M15.16 18.96a2.53 2.53 0 0 1 2.53 2.52A2.53 2.53 0 0 1 15.16 24a2.53 2.53 0 0 1-2.52-2.52v-2.52zm0-1.27a2.53 2.53 0 0 1-2.52-2.53 2.53 2.53 0 0 1 2.52-2.52h6.32A2.53 2.53 0 0 1 24 15.16a2.53 2.53 0 0 1-2.52 2.53z" />
</svg>`;

const figmaLogo = () => svg`<svg viewBox="0 0 38 57" aria-hidden="true">
  <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0Z" fill="#1ABCFE" />
  <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0Z" fill="#0ACF83" />
  <path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19Z" fill="#FF7262" />
  <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5Z" fill="#F24E1E" />
  <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5Z" fill="#A259FF" />
</svg>`;

/** The default categories: Essentials, All apps and eleven kinds */
export const defaultDirectoryCategories: DirectoryCategory[] = [
  { id: "essentials", label: "Essentials", icon: directoryCategoryIcons.essentials },
  { id: "all", label: "All apps", icon: directoryCategoryIcons.all },
  { id: "analytics", label: "Analytics", icon: directoryCategoryIcons.analytics },
  { id: "automation", label: "Automation", icon: directoryCategoryIcons.automation },
  { id: "billing", label: "Billing", icon: directoryCategoryIcons.billing },
  { id: "communication", label: "Communication", icon: directoryCategoryIcons.communication },
  { id: "crm", label: "CRM", icon: directoryCategoryIcons.crm },
  { id: "design", label: "Design", icon: directoryCategoryIcons.design },
  { id: "development", label: "Development", icon: directoryCategoryIcons.development },
  { id: "docs", label: "Docs", icon: directoryCategoryIcons.docs },
  { id: "product", label: "Product", icon: directoryCategoryIcons.product },
  { id: "scheduling", label: "Scheduling", icon: directoryCategoryIcons.scheduling },
  { id: "storage", label: "Storage", icon: directoryCategoryIcons.storage },
];

/** The default apps: twenty-odd popular integrations */
export const defaultDirectoryApps: DirectoryApp[] = [
  { id: "slack", connected: true, name: "Slack", vendor: "Slack", description: "Get alerts in your channels and act on them without leaving the conversation.", categories: ["communication"], logo: slackLogo(), essential: true },
  { id: "notion", name: "Notion", vendor: "Notion", description: "Turn records into pages and keep project docs in sync both ways.", categories: ["docs"], logo: mark("M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z", "currentColor"), essential: true },
  { id: "linear", name: "Linear", vendor: "Linear", description: "Create issues from customer feedback and track them to release.", categories: ["product"], logo: mark("M2.886 4.18A11.982 11.982 0 0 1 11.99 0C18.624 0 24 5.376 24 12.009c0 3.64-1.62 6.903-4.18 9.105L2.887 4.18ZM1.817 5.626l16.556 16.556c-.524.33-1.075.62-1.65.866L.951 7.277c.247-.575.537-1.126.866-1.65ZM.322 9.163l14.515 14.515c-.71.172-1.443.282-2.195.322L0 11.358a12 12 0 0 1 .322-2.195Zm-.17 4.862 9.823 9.824a12.02 12.02 0 0 1-9.824-9.824Z", "#ffffff"), tile: "#5E6AD2", essential: true },
  { id: "figma", name: "Figma", vendor: "Figma", description: "Preview designs inline and link frames to the work they belong to.", categories: ["design"], logo: figmaLogo(), essential: true },
  { id: "github", name: "GitHub", vendor: "GitHub", description: "Link pull requests and see deploy status next to every task.", categories: ["development"], logo: mark("M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12", "#ffffff"), tile: "#171717", essential: true },
  { id: "stripe", name: "Stripe", vendor: "Stripe", description: "Sync customers, invoices and subscriptions in real time.", categories: ["billing"], logo: mark("M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z", "#ffffff"), tile: "#635BFF", essential: true },
  { id: "zapier", name: "Zapier", vendor: "Zapier", description: "Connect 6,000 apps with no-code workflows and triggers.", categories: ["automation"], logo: mark("M4.157 0A4.151 4.151 0 0 0 0 4.161v15.678A4.151 4.151 0 0 0 4.157 24h15.682A4.152 4.152 0 0 0 24 19.839V4.161A4.152 4.152 0 0 0 19.839 0H4.157Zm10.61 8.761h.03a.577.577 0 0 1 .23.038.585.585 0 0 1 .201.124.63.63 0 0 1 .162.431.612.612 0 0 1-.162.435.58.58 0 0 1-.201.128.58.58 0 0 1-.23.042.529.529 0 0 1-.235-.042.585.585 0 0 1-.332-.328.559.559 0 0 1-.038-.235.613.613 0 0 1 .17-.431.59.59 0 0 1 .405-.162Zm2.853 1.572c.03.004.061.004.095.004.325-.011.646.064.937.219.238.144.431.355.552.609.128.279.189.582.185.888v.193a2 2 0 0 1 0 .219h-2.498c.003.227.075.45.204.642a.78.78 0 0 0 .646.265.714.714 0 0 0 .484-.136.642.642 0 0 0 .23-.318l.915.257a1.398 1.398 0 0 1-.28.537c-.14.159-.321.284-.521.355a2.234 2.234 0 0 1-.836.136 1.923 1.923 0 0 1-1.001-.245 1.618 1.618 0 0 1-.665-.703 2.221 2.221 0 0 1-.227-1.036 1.95 1.95 0 0 1 .48-1.398 1.9 1.9 0 0 1 1.3-.488Zm-9.607.023c.162.004.325.026.48.079.207.065.4.174.563.314.26.302.393.692.366 1.088v2.276H8.53l-.109-.711h-.065c-.064.163-.155.31-.272.439a1.122 1.122 0 0 1-.374.264 1.023 1.023 0 0 1-.453.083 1.334 1.334 0 0 1-.866-.264.965.965 0 0 1-.329-.801.993.993 0 0 1 .076-.431 1.02 1.02 0 0 1 .242-.363 1.478 1.478 0 0 1 1.043-.303h.952v-.181a.696.696 0 0 0-.136-.454.553.553 0 0 0-.438-.154.695.695 0 0 0-.378.086.48.48 0 0 0-.193.254l-.99-.144a1.26 1.26 0 0 1 .257-.563c.14-.174.321-.302.533-.378.261-.091.54-.136.82-.129.053-.003.106-.007.163-.007Zm4.384.007c.174 0 .347.038.506.114.182.083.34.211.458.374.257.423.377.911.351 1.406a2.53 2.53 0 0 1-.355 1.448 1.148 1.148 0 0 1-1.009.517c-.204 0-.401-.045-.582-.136a1.052 1.052 0 0 1-.48-.457 1.298 1.298 0 0 1-.114-.234h-.045l.004 1.784h-1.059v-4.713h.904l.117.805h.057c.068-.208.177-.401.328-.56a1.129 1.129 0 0 1 .843-.344h.076v-.004Zm7.559.084h.903l.113.805h.053a1.37 1.37 0 0 1 .235-.484.813.813 0 0 1 .313-.242.82.82 0 0 1 .39-.076h.234v1.051h-.401a.662.662 0 0 0-.313.008.623.623 0 0 0-.272.155.663.663 0 0 0-.174.26.683.683 0 0 0-.027.314v1.875h-1.054v-3.666Zm-17.515.003h3.262v.896L3.73 13.104l.034.113h1.973l.042.9H2.4v-.9l1.931-1.754-.045-.117H2.441v-.896Zm11.815 0h1.055v3.659h-1.055V10.45Zm3.443.684.019.016a.69.69 0 0 0-.351.045.756.756 0 0 0-.287.204c-.11.155-.174.336-.189.522h1.545c-.034-.526-.257-.787-.74-.787h.003Zm-5.718.163c-.026 0-.057 0-.083.004a.78.78 0 0 0-.31.053.746.746 0 0 0-.257.189 1.016 1.016 0 0 0-.204.695v.064c-.015.257.057.507.204.711a.634.634 0 0 0 .253.196.638.638 0 0 0 .314.061.644.644 0 0 0 .578-.265c.14-.223.204-.48.189-.74a1.216 1.216 0 0 0-.181-.711.677.677 0 0 0-.503-.257Zm-4.509 1.266a.464.464 0 0 0-.268.102.373.373 0 0 0-.114.276c0 .053.008.106.027.155a.375.375 0 0 0 .087.132.576.576 0 0 0 .397.11v.004a.863.863 0 0 0 .563-.182.573.573 0 0 0 .211-.457v-.14h-.903Z", "#ffffff"), tile: "#FF4F00", essential: true },
  { id: "hubspot", name: "HubSpot", vendor: "HubSpot", description: "Keep contacts, companies and deals matched across both tools.", categories: ["crm"], logo: mark("M18.164 7.93V5.084a2.198 2.198 0 001.267-1.978v-.067A2.2 2.2 0 0017.238.845h-.067a2.2 2.2 0 00-2.193 2.193v.067a2.196 2.196 0 001.252 1.973l.013.006v2.852a6.22 6.22 0 00-2.969 1.31l.012-.01-7.828-6.095A2.497 2.497 0 104.3 4.656l-.012.006 7.697 5.991a6.176 6.176 0 00-1.038 3.446c0 1.343.425 2.588 1.147 3.607l-.013-.02-2.342 2.343a1.968 1.968 0 00-.58-.095h-.002a2.033 2.033 0 102.033 2.033 1.978 1.978 0 00-.1-.595l.005.014 2.317-2.317a6.247 6.247 0 104.782-11.134l-.036-.005zm-.964 9.378a3.206 3.206 0 113.215-3.207v.002a3.206 3.206 0 01-3.207 3.207z", "#FF7A59"), essential: true },
  { id: "zoom", name: "Zoom", vendor: "Zoom", description: "Start meetings from any record and save the recording link.", categories: ["communication", "scheduling"], logo: mark("M5.033 14.649H.743a.74.74 0 0 1-.686-.458.74.74 0 0 1 .16-.808L3.19 10.41H1.06A1.06 1.06 0 0 1 0 9.35h3.957c.301 0 .57.18.686.458a.74.74 0 0 1-.161.808L1.51 13.59h2.464c.585 0 1.06.475 1.06 1.06zM24 11.338c0-1.14-.927-2.066-2.066-2.066-.61 0-1.158.265-1.537.686a2.061 2.061 0 0 0-1.536-.686c-1.14 0-2.066.926-2.066 2.066v3.311a1.06 1.06 0 0 0 1.06-1.06v-2.251a1.004 1.004 0 0 1 2.013 0v2.251c0 .586.474 1.06 1.06 1.06v-3.311a1.004 1.004 0 0 1 2.012 0v2.251c0 .586.475 1.06 1.06 1.06zM16.265 12a2.728 2.728 0 1 1-5.457 0 2.728 2.728 0 0 1 5.457 0zm-1.06 0a1.669 1.669 0 1 0-3.338 0 1.669 1.669 0 0 0 3.338 0zm-4.82 0a2.728 2.728 0 1 1-5.458 0 2.728 2.728 0 0 1 5.457 0zm-1.06 0a1.669 1.669 0 1 0-3.338 0 1.669 1.669 0 0 0 3.338 0z", "#ffffff"), tile: "#0B5CFF" },
  { id: "discord", name: "Discord", vendor: "Discord", description: "Post updates to community channels when something ships.", categories: ["communication"], logo: mark("M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z", "#ffffff"), tile: "#5865F2" },
  { id: "calendly", name: "Calendly", vendor: "Calendly", description: "Log booked meetings and the answers people gave when booking.", categories: ["scheduling"], logo: mark("M19.655 14.262c.281 0 .557.023.828.064 0 .005-.005.01-.005.014-.105.267-.234.534-.381.786l-1.219 2.106c-1.112 1.936-3.177 3.127-5.411 3.127h-2.432c-2.23 0-4.294-1.191-5.412-3.127l-1.218-2.106a6.251 6.251 0 0 1 0-6.252l1.218-2.106C6.736 4.832 8.8 3.641 11.035 3.641h2.432c2.23 0 4.294 1.191 5.411 3.127l1.219 2.106c.147.252.271.519.381.786 0 .004.005.009.005.014-.267.041-.543.064-.828.064-1.816 0-2.501-.607-3.291-1.306-.764-.676-1.711-1.517-3.44-1.517h-1.029c-1.251 0-2.387.455-3.2 1.278-.796.805-1.233 1.904-1.233 3.099v1.411c0 1.196.437 2.295 1.233 3.099.813.823 1.949 1.278 3.2 1.278h1.034c1.729 0 2.676-.841 3.439-1.517.791-.703 1.471-1.306 3.287-1.301Zm.005-3.237c.399 0 .794-.036 1.179-.11-.002-.004-.002-.01-.002-.014-.073-.414-.193-.823-.349-1.218.731-.12 1.407-.396 1.986-.819 0-.004-.005-.013-.005-.018-.331-1.085-.832-2.101-1.489-3.03-.649-.915-1.435-1.719-2.331-2.395-1.867-1.398-4.088-2.138-6.428-2.138-1.448 0-2.855.28-4.175.841-1.273.543-2.423 1.315-3.407 2.299S2.878 6.552 2.341 7.83c-.557 1.324-.842 2.726-.842 4.175 0 1.448.281 2.855.842 4.174.542 1.274 1.314 2.423 2.298 3.407s2.129 1.761 3.407 2.299c1.324.556 2.727.841 4.175.841 2.34 0 4.561-.74 6.428-2.137a10.815 10.815 0 0 0 2.331-2.396c.652-.929 1.158-1.949 1.489-3.03 0-.004.005-.014.005-.018-.579-.423-1.255-.699-1.986-.819.161-.395.276-.804.349-1.218.005-.009.005-.014.005-.023.869.166 1.692.506 2.404 1.035.685.505.552 1.075.446 1.416C22.184 20.437 17.619 24 12.221 24c-6.625 0-12-5.375-12-12s5.37-12 12-12c5.398 0 9.963 3.563 11.471 8.464.106.341.239.915-.446 1.421-.717.529-1.535.873-2.404 1.034.128.716.128 1.45 0 2.166-.387-.074-.782-.11-1.182-.11-4.184 0-3.968 2.823-6.736 2.823h-1.029c-1.899 0-3.15-1.357-3.15-3.095v-1.411c0-1.738 1.251-3.094 3.15-3.094h1.034c2.768 0 2.552 2.823 6.731 2.827Z", "#ffffff"), tile: "#006BFF" },
  { id: "google-calendar", name: "Google Calendar", vendor: "Google", description: "See upcoming meetings with every contact in one timeline.", categories: ["scheduling"], logo: mark("M18.316 5.684H24v12.632h-5.684V5.684zM5.684 24h12.632v-5.684H5.684V24zM18.316 5.684V0H1.895A1.894 1.894 0 0 0 0 1.895v16.421h5.684V5.684h12.632zm-7.207 6.25v-.065c.272-.144.5-.349.687-.617s.279-.595.279-.982c0-.379-.099-.72-.3-1.025a2.05 2.05 0 0 0-.832-.714 2.703 2.703 0 0 0-1.197-.257c-.6 0-1.094.156-1.481.467-.386.311-.65.671-.793 1.078l1.085.452c.086-.249.224-.461.413-.633.189-.172.445-.257.767-.257.33 0 .602.088.816.264a.86.86 0 0 1 .322.703c0 .33-.12.589-.36.778-.24.19-.535.284-.886.284h-.567v1.085h.633c.407 0 .748.109 1.02.327.272.218.407.499.407.843 0 .336-.129.614-.387.832s-.565.327-.924.327c-.351 0-.651-.103-.897-.311-.248-.208-.422-.502-.521-.881l-1.096.452c.178.616.505 1.082.977 1.401.472.319.984.478 1.538.477a2.84 2.84 0 0 0 1.293-.291c.382-.193.684-.458.902-.794.218-.336.327-.72.327-1.149 0-.429-.115-.797-.344-1.105a2.067 2.067 0 0 0-.881-.689zm2.093-1.931l.602.913L15 10.045v5.744h1.187V8.446h-.827l-2.158 1.557zM22.105 0h-3.289v5.184H24V1.895A1.894 1.894 0 0 0 22.105 0zm-3.289 23.5l4.684-4.684h-4.684V23.5zM0 22.105C0 23.152.848 24 1.895 24h3.289v-5.184H0v3.289z", "#4285F4") },
  { id: "make", name: "Make", vendor: "Make", description: "Build visual multi-step automations with branches and filters.", categories: ["automation"], logo: mark("M13.38 3.498c-.27 0-.511.19-.566.465L9.85 18.986a.578.578 0 0 0 .453.678l4.095.826a.58.58 0 0 0 .682-.455l2.963-15.021a.578.578 0 0 0-.453-.678l-4.096-.826a.589.589 0 0 0-.113-.012zm-5.876.098a.576.576 0 0 0-.516.318L.062 17.697a.575.575 0 0 0 .256.774l3.733 1.877a.578.578 0 0 0 .775-.258l6.926-13.781a.577.577 0 0 0-.256-.776L7.762 3.658a.571.571 0 0 0-.258-.062zm11.74.115a.576.576 0 0 0-.576.576v15.426c0 .318.258.578.576.578h4.178a.58.58 0 0 0 .578-.578V4.287a.578.578 0 0 0-.578-.576Z", "#ffffff"), tile: "#6D00CC" },
  { id: "mixpanel", name: "Mixpanel", vendor: "Mixpanel", description: "Send product events and build reports from real usage.", categories: ["analytics"], logo: mark("M6.967 9.996h3.053c-.763-.477-1.048-1.145-1.431-2.384L7.443 3.366C6.919 1.458 6.49.551 4.39.551H.004v1.145h.621c1.286 0 1.431.477 1.814 1.908L3.44 7.326c.524 1.814 1.337 2.67 3.53 2.67h-.003Zm7.06 0h3.053c2.194 0 2.956-.86 3.484-2.67l1.001-3.722c.382-1.431.57-1.908 1.814-1.908H24V.551h-4.34c-2.146 0-2.576.86-3.053 2.815l-1.145 4.246c-.384 1.286-.673 1.907-1.435 2.384Zm-4.007 4.008h4.007V9.996H10.02v4.008ZM0 23.449h4.39c2.1 0 2.529-.907 3.053-2.815l1.146-4.246c.383-1.239.668-1.907 1.431-2.384H6.967c-2.194 0-3.007.86-3.531 2.67l-1.001 3.722c-.383 1.431-.524 1.907-1.814 1.907H0v1.146Zm19.65 0h4.343v-1.146h-.622c-1.239 0-1.431-.476-1.814-1.907l-1.001-3.722c-.524-1.814-1.286-2.67-3.483-2.67h-3.046c.762.477 1.041 1.098 1.424 2.384l1.145 4.246c.477 1.955.907 2.815 3.054 2.815Z", "#ffffff"), tile: "#7856FF" },
  { id: "google-analytics", name: "Google Analytics", vendor: "Google", description: "Attribute signups to the campaigns and pages that brought them.", categories: ["analytics"], logo: mark("M22.84 2.9982v17.9987c.0086 1.6473-1.3197 2.9897-2.967 2.9984a2.9808 2.9808 0 01-.3677-.0208c-1.528-.226-2.6477-1.5558-2.6105-3.1V3.1204c-.0369-1.5458 1.0856-2.8762 2.6157-3.1 1.6361-.1915 3.1178.9796 3.3093 2.6158.014.1201.0208.241.0202.3619zM4.1326 18.0548c-1.6417 0-2.9726 1.331-2.9726 2.9726C1.16 22.6691 2.4909 24 4.1326 24s2.9726-1.3309 2.9726-2.9726-1.331-2.9726-2.9726-2.9726zm7.8728-9.0098c-.0171 0-.0342 0-.0513.0003-1.6495.0904-2.9293 1.474-2.891 3.1256v7.9846c0 2.167.9535 3.4825 2.3505 3.763 1.6118.3266 3.1832-.7152 3.5098-2.327.04-.1974.06-.3983.0593-.5998v-8.9585c.003-1.6474-1.33-2.9852-2.9773-2.9882z", "#E37400") },
  { id: "paddle", name: "Paddle", vendor: "Paddle", description: "Handle checkout, tax and subscriptions as merchant of record.", categories: ["billing"], logo: mark("M2.363 7.904v.849a3.95 3.95 0 0 1 3.65 2.425c.198.476.3.987.299 1.502h.791c0-1.04.416-2.037 1.157-2.772a3.962 3.962 0 0 1 2.792-1.149V7.91a3.959 3.959 0 0 1-3.65-2.425 3.893 3.893 0 0 1-.299-1.502h-.791c0 1.04-.416 2.037-1.157 2.772a3.96 3.96 0 0 1-2.792 1.149M13.105 2.51H6.312V0h6.793c4.772 0 8.532 3.735 8.532 8.314 0 4.58-3.76 8.314-8.532 8.314H9.156V24H6.312v-9.882h6.793c3.319 0 5.688-2.352 5.688-5.804 0-3.451-2.37-5.804-5.688-5.804", "#ffffff"), tile: "#FDDD35" },
  { id: "dropbox", name: "Dropbox", vendor: "Dropbox", description: "Attach files from Dropbox and keep shared folders linked.", categories: ["storage"], logo: mark("M6 1.807L0 5.629l6 3.822 6.001-3.822L6 1.807zM18 1.807l-6 3.822 6 3.822 6-3.822-6-3.822zM0 13.274l6 3.822 6.001-3.822L6 9.452l-6 3.822zM18 9.452l-6 3.822 6 3.822 6-3.822-6-3.822zM6 18.371l6.001 3.822 6-3.822-6-3.822L6 18.371z", "#0061FF") },
  { id: "google-drive", name: "Google Drive", vendor: "Google", description: "Pick files from Drive and preview them without downloading.", categories: ["storage", "docs"], logo: mark("M12.01 1.485c-2.082 0-3.754.02-3.743.047.01.02 1.708 3.001 3.774 6.62l3.76 6.574h3.76c2.081 0 3.753-.02 3.742-.047-.005-.02-1.708-3.001-3.775-6.62l-3.76-6.574zm-4.76 1.73a789.828 789.861 0 0 0-3.63 6.319L0 15.868l1.89 3.298 1.885 3.297 3.62-6.335 3.618-6.33-1.88-3.287C8.1 4.704 7.255 3.22 7.25 3.214zm2.259 12.653-.203.348c-.114.198-.96 1.672-1.88 3.287a423.93 423.948 0 0 1-1.698 2.97c-.01.026 3.24.042 7.222.042h7.244l1.796-3.157c.992-1.734 1.85-3.23 1.906-3.323l.104-.167h-7.249z", "#1FA463") },
  { id: "typeform", name: "Typeform", vendor: "Typeform", description: "Create records from form answers the moment they come in.", categories: ["product"], logo: mark("M15.502 13.035c-.5 0-.756-.411-.756-.917 0-.505.252-.894.756-.894.513 0 .756.407.756.894-.004.515-.261.917-.756.917Zm-4.888-1.81c.292 0 .414.17.414.317 0 .357-.365.514-1.126.536 0-.442.253-.854.712-.854Zm-3.241 1.81c-.473 0-.67-.384-.67-.917 0-.527.202-.894.67-.894.477 0 .702.38.702.894 0 .537-.234.917-.702.917Zm-3.997-2.334h-.738l1.224 2.808c-.234.519-.36.648-.522.648-.171 0-.333-.138-.45-.259l-.324.43c.22.232.522.366.832.366.387 0 .685-.224.856-.626l1.413-3.371h-.725l-.738 2.012-.828-2.008Zm19.553.523c.36 0 .432.246.432.823v1.516H24v-1.914c0-.689-.473-.988-.91-.988-.386 0-.742.241-.94.688a.901.901 0 0 0-.891-.688c-.365 0-.73.232-.927.666v-.626h-.64v2.857h.64v-1.22c0-.617.324-1.114.765-1.114.36 0 .427.246.427.823v1.516h.64l-.005-1.225c0-.617.329-1.114.77-1.114Zm-5.1-.523h-.324v2.857h.639v-1.095c0-.693.306-1.163.76-1.163.118 0 .217.005.325.05l.099-.676c-.081-.009-.153-.018-.225-.018-.45 0-.774.309-.964.707V10.7h-.31Zm-2.327-.045c-.846 0-1.418.644-1.418 1.458 0 .845.58 1.475 1.418 1.475.85 0 1.431-.648 1.431-1.475-.004-.818-.594-1.458-1.431-1.458Zm-4.852 2.38c-.333 0-.581-.17-.685-.515.847-.036 1.675-.242 1.675-.988 0-.43-.423-.872-1.03-.872-.82 0-1.374.666-1.374 1.457 0 .828.545 1.476 1.36 1.476.567 0 .927-.228 1.21-.559l-.31-.42c-.329.335-.531.42-.846.42Zm-3.151-2.38c-.324 0-.648.188-.774.483v-.438h-.64v3.98h.64v-1.422c.135.205.445.34.72.34.85 0 1.3-.631 1.3-1.48-.004-.841-.445-1.463-1.246-1.463Zm-4.483-1.1H0v.622h1.18v3.38h.67v-3.38h1.166v-.622Zm9.502 1.145h-.383v.572h.383v2.285h.639v-2.285h.621v-.572h-.621v-.447c0-.286.117-.385.382-.385.1 0 .19.027.311.068l.144-.537c-.117-.067-.351-.094-.504-.094-.612 0-.972.367-.972 1.002v.393Z", "#ffffff"), tile: "#262627" },
  { id: "jira", name: "Jira", vendor: "Atlassian", description: "Sync issues, statuses and assignees with your Jira projects.", categories: ["product", "development"], logo: mark("M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.001 1.001 0 0 0 23.013 0Z", "#0052CC") },
  { id: "intercom", name: "Intercom", vendor: "Intercom", description: "See conversations next to the customer and reply from one place.", categories: ["communication", "crm"], logo: mark("M21 0H3C1.343 0 0 1.343 0 3v18c0 1.658 1.343 3 3 3h18c1.658 0 3-1.342 3-3V3c0-1.657-1.342-3-3-3zm-5.801 4.399c0-.44.36-.8.802-.8.44 0 .8.36.8.8v10.688c0 .442-.36.801-.8.801-.443 0-.802-.359-.802-.801V4.399zM11.2 3.994c0-.44.357-.799.8-.799s.8.359.8.799v11.602c0 .44-.357.8-.8.8s-.8-.36-.8-.8V3.994zm-4 .405c0-.44.359-.8.799-.8.443 0 .802.36.802.8v10.688c0 .442-.36.801-.802.801-.44 0-.799-.359-.799-.801V4.399zM3.199 6c0-.442.36-.8.802-.8.44 0 .799.358.799.8v7.195c0 .441-.359.8-.799.8-.443 0-.802-.36-.802-.8V6zM20.52 18.202c-.123.105-3.086 2.593-8.52 2.593-5.433 0-8.397-2.486-8.521-2.593-.335-.288-.375-.792-.086-1.128.285-.334.79-.375 1.125-.09.047.041 2.693 2.211 7.481 2.211 4.848 0 7.456-2.186 7.479-2.207.334-.289.839-.25 1.128.086.289.336.25.84-.086 1.128zm.281-5.007c0 .441-.36.8-.801.8-.441 0-.801-.36-.801-.8V6c0-.442.361-.8.801-.8.441 0 .801.357.801.8v7.195z", "#ffffff"), tile: "#1F8DED" },
  { id: "airtable", name: "Airtable", vendor: "Airtable", description: "Mirror bases as tables and keep fields in sync automatically.", categories: ["storage"], logo: mark("M11.992 1.966c-.434 0-.87.086-1.28.257L1.779 5.917c-.503.208-.49.908.012 1.116l8.982 3.558a3.266 3.266 0 0 0 2.454 0l8.982-3.558c.503-.196.503-.908.012-1.116l-8.957-3.694a3.255 3.255 0 0 0-1.272-.257zM23.4 8.056a.589.589 0 0 0-.222.045l-10.012 3.877a.612.612 0 0 0-.38.564v8.896a.6.6 0 0 0 .821.552L23.62 18.1a.583.583 0 0 0 .38-.551V8.653a.6.6 0 0 0-.6-.596zM.676 8.095a.644.644 0 0 0-.48.19C.086 8.396 0 8.53 0 8.69v8.355c0 .442.515.737.908.54l6.27-3.006.307-.147 2.969-1.436c.466-.22.43-.908-.061-1.092L.883 8.138a.57.57 0 0 0-.207-.044z", "#18BFFF") },
];

if (!customElements.get("tc-app-directory")) customElements.define("tc-app-directory", TcAppDirectory);
declare global {
  interface HTMLElementTagNameMap {
    "tc-app-directory": TcAppDirectory;
  }
}
