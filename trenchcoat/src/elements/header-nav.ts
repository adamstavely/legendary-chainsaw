import { html, nothing, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { PopoverController } from "./internal/popover";
import { safeMediaUrl } from "./internal/safe-media";
import "./profile-menu";
import { profileMenuIcon, type ProfileMenuItem, type ProfileSetup, type TcProfileMenu } from "./profile-menu";

/*
 * <tc-header-nav> – the right end of an app header (the Lit port of blocks/header-nav): the notifications bell, the
 * app picker and the signed-in person's avatar, in that order, with a hairline before the avatar. The bell and the
 * picker are the page's own <tc-notifications> and <tc-app-picker>, put inside it as children (leave one out to hide
 * it); the avatar is a round button – the person's photo, or their initials on a tone, with an optional presence dot
 * – that opens a <tc-profile-menu> account card in a popover under it, aligned to its end.
 * One popover is open at a time: opening one closes the others. Which one is open is `panel`, changed through the
 * cancelable tc-panel-change – the element applies it unless prevented (controlled use).
 *
 * The three triggers share one shape: a round ghost button at the control height, the same hover fill and focus ring.
 * The account popover is a non-modal dialog named "Account" in the top layer (fixed elsewhere), kept in the
 * viewport. Opening it moves focus to its first action; Escape or picking an action closes it with focus back on the
 * avatar; a pointer-down outside, or focus moving to anything else, closes it where focus is. Tab order is the visual
 * order: bell, picker, avatar, then the open popover.
 *
 *   <tc-header-nav .user=${{ name: "Ada Lovelace", email: "ada@example.com", presence: "online" }}>
 *     <tc-notifications .items=${…}></tc-notifications>
 *     <tc-app-picker .apps=${…}></tc-app-picker>
 *   </tc-header-nav>
 */

/** Presence: a dot on the avatar's bottom corner */
export type HeaderNavPresence = "online" | "away" | "busy" | "offline";
/** The tone behind initials when there's no image */
export type HeaderNavTone = "accent" | "teal" | "violet" | "amber" | "pink" | "rose";

export type HeaderNavUser = {
  /** Full name – the avatar's accessible name is "Account: <name>", and it heads the account card */
  name: string;
  /** Under the name in the account card */
  email: string;
  /** A photo URL; without one (or if it fails to load) the initials show */
  avatar?: string;
  /** The initials' tone; unset picks one from the name, the same every time */
  tone?: HeaderNavTone;
  /** Shows a presence dot, and says it after the avatar's name */
  presence?: HeaderNavPresence;
};

/** Which popover is open */
export type HeaderNavPanel = "notifications" | "apps" | "account";

export type HeaderNavPanelChange = { panel: HeaderNavPanel | null };
export type HeaderNavAccountSelect = { id: string };
export type HeaderNavSetupContinue = { next: string };

const PRESENCE: Record<HeaderNavPresence, string> = { online: "Online", away: "Away", busy: "Busy", offline: "Offline" };
const TONES: HeaderNavTone[] = ["teal", "violet", "amber", "pink", "rose"];
/** The children the element coordinates, and the panel each one is */
const KINDS: Record<string, HeaderNavPanel> = { "TC-NOTIFICATIONS": "notifications", "TC-APP-PICKER": "apps" };

/** One or two initials from a name: "Ada Lovelace" → "AL" */
export function headerNavInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}
/** The tone a name gets when the user has none – the same every time */
export const headerNavTone = (name: string): HeaderNavTone => TONES[[...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % TONES.length];

/** The account card's actions when `accountItems` is unset: Settings, Language, Docs and Sign out */
export function headerNavDefaultItems(): ProfileMenuItem[] {
  return [
    { id: "settings", label: "Settings", icon: profileMenuIcon("settings") },
    { id: "language", label: "Language", icon: profileMenuIcon("language") },
    { id: "docs", label: "Docs", icon: profileMenuIcon("docs") },
    { id: "sign-out", label: "Sign out", icon: profileMenuIcon("logout") },
  ];
}

let instances = 0;

/**
 * The right end of an app header: the page's bell and app picker, and the person's avatar with their account card.
 * @tag tc-header-nav
 * @slot - The page's <tc-notifications> and <tc-app-picker>, in that order
 * @fires tc-panel-change - A popover is opening or closing ({ panel }: HeaderNavPanelChange, null when none); cancelable – prevented, `panel` stays as it is (controlled use)
 * @fires tc-account-select - An account action was picked ({ id }: HeaderNavAccountSelect); cancelable – prevented, the card stays open
 * @fires tc-setup-continue - The setup's next step was picked in the account card ({ next }: HeaderNavSetupContinue); cancelable – prevented, the card stays open
 */
export class TcHeaderNav extends TcElement {
  static override ui = "hn";

  /** The signed-in person */
  @property({ attribute: false }) accessor user: HeaderNavUser = { name: "", email: "" };
  /** The account card's actions; unset shows Settings, Language, Docs and Sign out */
  @property({ attribute: false }) accessor accountItems: ProfileMenuItem[] | undefined = undefined;
  /** Profile setup progress in the account card – unset hides it */
  @property({ attribute: false }) accessor setup: ProfileSetup | undefined = undefined;
  /** The account popover's name, and the start of the avatar's ("Account") */
  @property({ attribute: "account-label" }) accessor accountLabel = "Account";
  /** The open popover, or null for none */
  @property() accessor panel: HeaderNavPanel | null = null;
  /** The hairline before the avatar (default true; separator="false" hides it) */
  @property({ type: Boolean, converter: { fromAttribute: (v) => v !== "false" } }) accessor separator = true;

  /** The photo that failed to load – initials show instead */
  @state() private accessor broken: string | null = null;
  /** There's a bell or a picker before the avatar */
  @state() private accessor hasBefore = false;

  private readonly uid = `tc-hn${++instances}`;
  private start?: Comment;
  private mo?: MutationObserver;
  private face?: HTMLElement;

  private readonly pop = new PopoverController(this, {
    popover: () => this.querySelector<HTMLElement>(".ui-hn__pop"),
    anchor: () => this.trigger,
    side: "bottom",
    align: "end",
    gap: 6,
    margin: 8,
    kind: "dialog",
    closeOnFocusOut: true,
    returnFocus: () => this.trigger,
    initialFocus: () => this.querySelector<HTMLElement>("tc-profile-menu button") ?? this.querySelector<HTMLElement>(".ui-hn__pop"),
    onClose: (reason) => {
      if (reason === "api" || this.panel !== "account") return;
      if (!this.request(null)) this.pop.show();
    },
  });

  private get trigger() {
    return this.querySelector<HTMLButtonElement>(".ui-hn__me");
  }
  /** The bell and the picker the page put in */
  private get panels() {
    return [...this.children].filter((c): c is HTMLElement & { open: boolean; look?: string } => c.tagName in KINDS);
  }

  /** Asks for `next` to be the open panel: true when nothing prevented it (then it's applied) */
  private request(next: HeaderNavPanel | null) {
    if (next === this.panel) return true;
    if (!this.emit<HeaderNavPanelChange>("tc-panel-change", { panel: next }, { cancelable: true })) return false;
    this.panel = next;
    return true;
  }

  protected override createRenderRoot() {
    const root = super.createRenderRoot();
    // Lit renders between this start marker and the base's end marker; children a framework adds later land after
    // the range, so it's moved back to the end (see reorder) and the avatar stays after the bell and the picker
    const end = this.renderOptions.renderBefore!;
    if (!this.start) {
      this.start = document.createComment("tc-hn");
      this.insertBefore(this.start, end);
    }
    return root;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener("tc-open-change", this.onChildOpen);
    this.addEventListener("tc-item-select", this.onItem);
    this.addEventListener("tc-setup-continue", this.onSetup);
    this.mo = new MutationObserver(() => this.sync());
    this.mo.observe(this, { childList: true });
    this.sync();
  }
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("tc-open-change", this.onChildOpen);
    this.removeEventListener("tc-item-select", this.onItem);
    this.removeEventListener("tc-setup-continue", this.onSetup);
    this.mo?.disconnect();
  }

  /** Children changed: the range goes back to the end, and the hairline follows whether there's anything before it */
  private sync() {
    this.reorder();
    const before = this.panels.length > 0;
    if (before !== this.hasBefore) this.hasBefore = before;
  }
  private reorder() {
    const end = this.renderOptions.renderBefore;
    const start = this.start;
    if (!end || !start || start.parentNode !== this) return;
    let after = end.nextSibling;
    while (after && after.nodeType !== Node.ELEMENT_NODE) after = after.nextSibling;
    if (!after) return;
    // Move Lit's own nodes – the whole range, markers included – so its parts stay consistent; focus stays put
    const active = document.activeElement;
    const nodes: Node[] = [];
    for (let n: Node | null = start; n; n = n.nextSibling) {
      nodes.push(n);
      if (n === end) break;
    }
    this.append(...nodes);
    if (active instanceof HTMLElement && active !== document.activeElement && this.contains(active)) active.focus({ preventScroll: true });
  }

  /** A bell or picker opening or closing on its own (not prevented by whoever controls it) */
  private onChildOpen = (e: Event) => {
    const child = e.target as HTMLElement;
    const kind = KINDS[child.tagName];
    if (!kind || child.parentElement !== this || e.defaultPrevented) return;
    const open = (e as CustomEvent<{ open: boolean }>).detail?.open;
    const next = open ? kind : this.panel === kind ? null : this.panel;
    if (!this.request(next)) e.preventDefault();
  };

  private onItem = (e: Event) => {
    if (!(e.target as Element).closest?.(".ui-hn__pop")) return;
    e.stopPropagation();
    if (this.emit<HeaderNavAccountSelect>("tc-account-select", { id: (e as CustomEvent<{ id: string }>).detail.id }, { cancelable: true })) this.closeAccount();
  };
  private onSetup = (e: Event) => {
    if (!(e.target as Element).closest?.(".ui-hn__pop")) return;
    e.stopPropagation();
    if (this.emit<HeaderNavSetupContinue>("tc-setup-continue", { next: (e as CustomEvent<{ next: string }>).detail.next }, { cancelable: true })) this.closeAccount();
  };
  private closeAccount() {
    if (this.request(null)) this.trigger?.focus({ preventScroll: true });
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("user")) this.broken = null;
    const wantOpen = this.panel === "account";
    if (wantOpen && !this.pop.open) this.pop.show({ focus: true });
    else if (!wantOpen && this.pop.open) this.pop.close("api");
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    // The bell and the picker follow `panel` and the look
    for (const child of this.panels) {
      const open = this.panel === KINDS[child.tagName];
      if (child.open !== open) child.open = open;
      if (this.look && child.look !== this.look) child.look = this.look;
    }
    if (changed.has("panel") && this.panel === "account") {
      // The card renders its buttons on its own update; focus the first one once it has
      const menu = this.querySelector<TcProfileMenu>(".ui-hn__pop tc-profile-menu");
      void menu?.updateComplete.then(() => {
        if (this.panel !== "account") return;
        const first = this.querySelector<HTMLElement>("tc-profile-menu button");
        if (first && !first.matches(":focus")) first.focus({ preventScroll: true });
      });
    }
  }

  /** The face as an element, for the account card's avatar (it clones nothing; a fresh one per render) */
  private faceElement() {
    const span = document.createElement("span");
    const u = this.user;
    const src = safeMediaUrl(u.avatar);
    if (src && this.broken !== src) {
      const img = document.createElement("img");
      img.className = "ui-hn__face";
      img.src = src;
      img.alt = "";
      img.draggable = false;
      return img;
    }
    span.className = "ui-hn__face";
    span.dataset.tone = u.tone ?? headerNavTone(u.name);
    span.dataset.initials = headerNavInitials(u.name);
    span.setAttribute("aria-hidden", "true");
    return span;
  }

  private renderFace() {
    const u = this.user;
    const src = safeMediaUrl(u.avatar);
    if (src && this.broken !== src)
      return html`<img class="ui-hn__face" src=${src} alt="" draggable="false" @error=${() => (this.broken = src)} />`;
    // The initials are drawn by CSS (::before), so the button's text is its name alone – "Account: Ada Lovelace"
    return html`<span class="ui-hn__face" data-tone=${u.tone ?? headerNavTone(u.name)} data-initials=${headerNavInitials(u.name)} aria-hidden="true"></span>`;
  }

  override render() {
    const u = this.user;
    const presence = u.presence ? PRESENCE[u.presence] : "";
    const open = this.panel === "account";
    if (open) this.face = this.faceElement();
    return html`${this.separator && this.hasBefore ? html`<span class="ui-hn__sep" aria-hidden="true"></span>` : nothing}<button
        type="button"
        class="ui-hn__me"
        aria-label=${`${this.accountLabel}: ${u.name}`}
        aria-describedby=${ifDefined(presence ? `${this.uid}-presence` : undefined)}
        aria-haspopup="dialog"
        aria-expanded=${open ? "true" : "false"}
        aria-controls=${ifDefined(open ? `${this.uid}-account` : undefined)}
        @click=${() => this.request(open ? null : "account")}
      >
        ${this.renderFace()}${u.presence ? html`<span class="ui-hn__dot" data-presence=${u.presence} aria-hidden="true"></span>` : nothing}${presence
          ? html`<span id=${`${this.uid}-presence`} class="ui-hn__sr">${presence}</span>`
          : nothing}
      </button>${open
        ? html`<div id=${`${this.uid}-account`} class="ui-hn__pop" role="dialog" aria-label=${this.accountLabel} tabindex="-1">
            <tc-profile-menu
              look=${this.resolvedLook}
              .name=${u.name}
              .email=${u.email}
              .avatar=${this.face}
              .items=${this.accountItems ?? headerNavDefaultItems()}
              .setup=${this.setup}
            ></tc-profile-menu>
          </div>`
        : nothing}`;
  }

  static override css = /* css */ `
[data-ui="hn"] {
  --tc-hn-ring: var(--tc-surface-raised);
  --tc-hn-dot: 8px;
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: var(--tc-space-1);
  min-width: 0;
  font-family: var(--tc-font-sans);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="hn"] > tc-notifications, [data-ui="hn"] > tc-app-picker { flex: none; }
.ui-hn__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

/* The hairline before the avatar */
.ui-hn__sep { flex: none; width: var(--tc-hairline); height: var(--tc-space-5); margin: 0 var(--tc-space-1); background: var(--tc-border-default); }

/* The avatar button: the same round ghost button as the bell and the picker */
.ui-hn__me {
  position: relative;
  display: inline-grid;
  flex: none;
  place-items: center;
  width: var(--tc-control-h-md);
  height: var(--tc-control-h-md);
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: var(--tc-radius-full);
  background: none;
  color: var(--tc-action-ghost-fg);
  font: inherit;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-hn__me:hover, .ui-hn__me[aria-expanded="true"] { background: var(--tc-action-ghost-bg-hover); }
.ui-hn__me:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }

/* The face: a photo, or initials on a tone */
.ui-hn__face {
  display: grid;
  place-items: center;
  box-sizing: border-box;
  width: var(--tc-control-h-sm);
  height: var(--tc-control-h-sm);
  overflow: hidden;
  border-radius: var(--tc-radius-full);
  background: var(--tc-tone-teal-bg);
  color: var(--tc-tone-teal-fg);
  font-size: var(--tc-font-size-xs);
  font-weight: var(--tc-font-weight-semibold);
  line-height: var(--tc-line-height-none);
  letter-spacing: 0;
  white-space: nowrap;
  user-select: none;
  object-fit: cover;
}
[data-ui="hn"][data-look="clean"] .ui-hn__face { font-weight: var(--tc-font-weight-medium); }
.ui-hn__face::before { content: attr(data-initials); content: attr(data-initials) / ""; }
img.ui-hn__face { display: block; }
.ui-hn__face[data-tone="accent"] { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-hn__face[data-tone="violet"] { background: var(--tc-tone-violet-bg); color: var(--tc-tone-violet-fg); }
.ui-hn__face[data-tone="amber"] { background: var(--tc-tone-amber-bg); color: var(--tc-tone-amber-fg); }
.ui-hn__face[data-tone="pink"] { background: var(--tc-tone-pink-bg); color: var(--tc-tone-pink-fg); }
.ui-hn__face[data-tone="rose"] { background: var(--tc-tone-rose-bg); color: var(--tc-tone-rose-fg); }
/* In the account card the face fills the card's avatar box */
tc-profile-menu .ui-hn__face { display: grid; width: 100%; height: 100%; font-size: var(--tc-font-size-lg); }
[data-ui="hn"][data-look="clean"] tc-profile-menu .ui-hn__face { font-weight: var(--tc-font-weight-medium); }

/* Presence: a dot on the avatar's bottom corner, ringed in the header's colour like the bell's badge */
.ui-hn__dot {
  position: absolute;
  right: 1px;
  bottom: 1px;
  width: var(--tc-hn-dot);
  height: var(--tc-hn-dot);
  border-radius: var(--tc-radius-full);
  background: var(--tc-status-success-solid);
  box-shadow: 0 0 0 2px var(--tc-hn-ring);
}
.ui-hn__dot[data-presence="away"] { background: var(--tc-status-warning-solid); }
.ui-hn__dot[data-presence="busy"] { background: var(--tc-status-danger-solid); }
.ui-hn__dot[data-presence="offline"] { background: var(--tc-surface-raised); box-shadow: inset 0 0 0 1.5px var(--tc-icon-muted), 0 0 0 2px var(--tc-hn-ring); }

/* The account popover: the card brings its own surface – Standard's gray tray, Clean's white menu card */
.ui-hn__pop {
  position: fixed;
  inset: auto;
  top: 0;
  left: 0;
  z-index: var(--tc-z-popover);
  box-sizing: border-box;
  width: min(300px, calc(100vw - 2 * var(--tc-space-2)));
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  overflow: visible;
  border-radius: var(--tc-tray-radius);
  background: transparent;
  box-shadow: var(--tc-shadow-overlay);
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
}
[data-ui="hn"][data-look="clean"] .ui-hn__pop { width: min(260px, calc(100vw - 2 * var(--tc-space-2))); border-radius: var(--tc-menu-radius); box-shadow: none; }
.ui-hn__pop:focus { outline: none; }
.ui-hn__pop:not([data-placed]) { visibility: hidden; }
.ui-hn__pop[data-placed] { animation: ui-hn-in var(--tc-duration-fast) var(--tc-ease-move) both; }
.ui-hn__pop[data-side="top"] { --tc-hn-from: translateY(4px); }
.ui-hn__pop[data-offscreen] { visibility: hidden; }
.ui-hn__pop > tc-profile-menu { display: block; max-width: none; }
@keyframes ui-hn-in { from { opacity: 0; transform: var(--tc-hn-from, translateY(-4px)) scale(0.98); } }

@media (prefers-reduced-motion: reduce) {
  .ui-hn__me { transition: none; }
  .ui-hn__pop[data-placed] { animation: none; }
}
@media (forced-colors: active) {
  .ui-hn__sep { background: CanvasText; }
  .ui-hn__dot { forced-color-adjust: none; background: CanvasText; box-shadow: none; }
  .ui-hn__pop { border: 1px solid CanvasText; border-radius: 0; }
}
`;
}

if (!customElements.get("tc-header-nav")) customElements.define("tc-header-nav", TcHeaderNav);
declare global {
  interface HTMLElementTagNameMap {
    "tc-header-nav": TcHeaderNav;
  }
}
