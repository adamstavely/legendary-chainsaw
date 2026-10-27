import { html, nothing, svg, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import type { Look } from "./internal/look";

/*
 * <tc-profile-menu> – the Lit port of src/components/profile-menu.tsx: an account card with the signed-in user, menu
 * actions and profile setup progress. Clean has no tray – one white menu card with hairline shadows, smaller rows and
 * thinner icons; the setup progress is its last row under a hairline instead of sitting in the tray.
 *
 *   <tc-profile-menu name="Ada" email="ada@example.com" .setup=${{ done: 2, total: 5, next: "Verify your email" }}>
 *   </tc-profile-menu>
 *
 * The actions are a named group of plain buttons (always visible, so not an ARIA menu); ↑ ↓ Home End move between
 * them as a convenience. Picking one fires `tc-item-select` ({ id }) and calls the item's `onSelect`; the setup's
 * "Next" button fires `tc-setup-continue` and calls `setup.onContinue`. The progress bar fills once the card is seen.
 */

export type ProfileMenuItem = {
  id: string;
  label: string;
  /** An icon element (cloned) */
  icon?: Element;
  /** Small pill on the right, e.g. "New" */
  badge?: string;
  onSelect?: () => void;
};

export type ProfileSetup = {
  /** Steps finished so far */
  done: number;
  total: number;
  /** The next open step, shown as a shortcut under the bar */
  next?: string;
  onContinue?: () => void;
};

export type ProfileMenuIconName = "settings" | "language" | "docs" | "apps" | "logout";

/** The icons' shapes; the stroke follows the menu's look through --tc-profile-menu-icon-stroke */
const iconShapes: Record<ProfileMenuIconName, string> = {
  settings:
    '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle>',
  language: '<path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"></path>',
  docs: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8M10 9H8"></path>',
  apps: '<rect x="3" y="3" width="7" height="7" rx="1.5"></rect><rect x="3" y="14" width="7" height="7" rx="1.5"></rect><rect x="14" y="14" width="7" height="7" rx="1.5"></rect><path d="M17.5 3v7M14 6.5h7"></path>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"></path>',
};

/** One of the menu's icons as an element, to put in `items` */
export function profileMenuIcon(name: ProfileMenuIconName): Element {
  const t = document.createElement("template");
  t.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" style="stroke-width: var(--tc-profile-menu-icon-stroke, 1.5)" aria-hidden="true">${iconShapes[name]}</svg>`;
  return t.content.firstElementChild!;
}

/** The actions when `items` is unset */
export function profileMenuDefaultItems(): ProfileMenuItem[] {
  return [
    { id: "settings", label: "Settings", icon: profileMenuIcon("settings") },
    { id: "docs", label: "Docs", icon: profileMenuIcon("docs") },
    { id: "apps", label: "Apps", icon: profileMenuIcon("apps"), badge: "New" },
    { id: "logout", label: "Logout", icon: profileMenuIcon("logout") },
  ];
}

/** Default avatar: a person icon centered on a soft blue disc */
const defaultAvatar = html`<svg viewBox="0 0 40 40" aria-hidden="true">${svg`<circle cx="20" cy="20" r="20" fill="currentColor" opacity="0.1"></circle><circle cx="20" cy="16" r="4.75" fill="currentColor"></circle><path d="M11.5 28.25c.9-4 4.3-6.75 8.5-6.75s7.6 2.75 8.5 6.75c.15.7-.4 1.25-1.1 1.25H12.6c-.7 0-1.25-.55-1.1-1.25Z" fill="currentColor"></path>`}</svg>`;

const arrowIcon = (look: Look) =>
  html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=${look === "clean" ? "1.1" : "1.6"} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d="M5 12h14M13 6l6 6-6 6"></path>`}</svg>`;

/**
 * An account card: the signed-in user, actions and profile setup progress.
 * @tag tc-profile-menu
 * @fires tc-item-select - An action was picked; detail `{ id: string }`.
 * @fires tc-setup-continue - The setup's next step was picked; detail `{ next: string }`.
 */
export class TcProfileMenu extends TcElement {
  static override ui = "pm";

  /** The signed-in person's name, at the top of the card */
  @property() accessor name = "";
  /** The signed-in person's email address, under the name */
  @property() accessor email = "";
  /** Replaces the default avatar (cloned) */
  @property({ attribute: false }) accessor avatar: Element | undefined = undefined;
  /** The actions; unset shows Settings, Docs, Apps and Logout */
  @property({ attribute: false }) accessor items: ProfileMenuItem[] | undefined = undefined;
  /** Profile setup progress under the actions – leave unset to hide */
  @property({ attribute: false }) accessor setup: ProfileSetup | undefined = undefined;

  /** The progress bar fills up once the card is on screen */
  @state() private accessor filled = false;
  private io?: IntersectionObserver;
  private defaults?: ProfileMenuItem[];

  override connectedCallback() {
    super.connectedCallback();
    if (this.filled || typeof IntersectionObserver !== "function") return;
    this.io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        this.filled = true;
        this.io?.disconnect();
      },
      { threshold: 0.3 },
    );
    this.io.observe(this);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.io?.disconnect();
    this.io = undefined;
  }

  protected override updated() {
    this.toggleAttribute("data-filled", this.filled);
  }

  // Arrow keys move between the actions as a convenience; each action is also a plain button in the tab order
  private onKey(e: KeyboardEvent) {
    const buttons = [...(e.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>("button")];
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      e.key === "ArrowDown" ? (i + 1) % buttons.length
      : e.key === "ArrowUp" ? (i - 1 + buttons.length) % buttons.length
      : e.key === "Home" ? 0
      : e.key === "End" ? buttons.length - 1
      : null;
    if (next === null) return;
    e.preventDefault();
    buttons[next]?.focus();
  }

  private select(item: ProfileMenuItem) {
    item.onSelect?.();
    this.emit("tc-item-select", { id: item.id });
  }

  private continueSetup(setup: ProfileSetup) {
    setup.onContinue?.();
    this.emit("tc-setup-continue", { next: setup.next ?? "" });
  }

  /** Compact setup progress in the gray extension (Clean: the last row of the card) */
  private renderSetup(setup: ProfileSetup, look: Look): TemplateResult {
    const { done, total, next } = setup;
    const ratio = total > 0 ? Math.min(1, Math.max(0, done / total)) : 0;
    const percent = Math.round(ratio * 100);
    const open = next && done < total;
    const shown = Math.min(done, total);
    return html`<div class="ui-pm__setup">
      <div class="ui-pm__setup-head">
        <span class="ui-pm__setup-title">Profile setup</span>
        <span class="ui-pm__setup-count">${shown}/${total}</span>
      </div>
      <span
        class="ui-pm__track"
        role="progressbar"
        aria-label="Profile setup"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow=${percent}
        aria-valuetext=${`${shown} of ${total} steps done`}
        ><span class="ui-pm__fill" style=${styleMap({ transform: `scaleX(${ratio})` })}></span
      ></span>
      ${open
        ? html`<button type="button" class="ui-pm__next" @click=${() => this.continueSetup(setup)}>
            <span class="ui-pm__next-label" title=${`Next: ${next}`}><span class="ui-pm__next-hint">Next:</span> ${next}</span>
            ${arrowIcon(look)}
          </button>`
        : nothing}
    </div>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const items = this.items ?? (this.defaults ??= profileMenuDefaultItems());
    const setup = this.setup;
    return html`
      <div class="ui-pm__card">
        <header class="ui-pm__user">
          <span class="ui-pm__avatar">${this.avatar ? this.avatar.cloneNode(true) : defaultAvatar}</span>
          <span class="ui-pm__who">
            <span class="ui-pm__name" title=${this.name}>${this.name}</span>
            <span class="ui-pm__email" title=${this.email}>${this.email}</span>
          </span>
        </header>
        <div class="ui-pm__items" role="group" aria-label="Account" @keydown=${this.onKey}>
          ${repeat(
            items,
            (item) => item.id,
            (item) => html`<button type="button" class="ui-pm__item" @click=${() => this.select(item)}>
              <span class="ui-pm__icon">${item.icon ? item.icon.cloneNode(true) : nothing}</span>
              <span class="ui-pm__label" title=${item.label}>${item.label}</span>
              ${item.badge ? html`<span class="ui-pm__badge">${item.badge}</span>` : nothing}
            </button>`,
          )}
        </div>
        ${setup && look === "clean" ? this.renderSetup(setup, look) : nothing}
      </div>
      ${setup && look !== "clean" ? this.renderSetup(setup, look) : nothing}
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="pm"] {
  /* Stroke width of the menu icons */
  --tc-profile-menu-icon-stroke: 1.5;
  box-sizing: border-box;
  width: 100%;
  max-width: 320px;
  /* Like the Chat Composer: the white menu card sits on a gray tray, the setup progress lives in the tray below */
  background: var(--tc-surface-tray);
  /* The gray tray frames the white card on every side */
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  font-family: var(--tc-font-sans);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
/* Colors and motion as variables – override them on [data-ui="pm"] */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="pm"] {
  /* Stroke width of the menu icons */
  --tc-profile-menu-icon-stroke: 1.1;
  /* Strokes are shadows: a 0.5px hairline plus a soft lift, like a popover */
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 260px;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
[data-ui="pm"] *, [data-ui="pm"] *::before, [data-ui="pm"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *).ui-pm__card {
  padding: var(--tc-space-4) var(--tc-space-2) var(--tc-space-2);
  background: var(--tc-surface-on-tray);
  border: 1px solid var(--tc-border-default);
  border-radius: var(--tc-card-radius);
  box-shadow: var(--tc-shadow-control);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__user {
  display: flex;
  align-items: center;
  gap: var(--tc-space-3-5);
  padding: 0 var(--tc-space-2-5) var(--tc-space-3);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__avatar {
  flex: none;
  width: 42px;
  height: 42px;
  overflow: hidden;
  border-radius: var(--tc-radius-full);
  color: var(--tc-accent);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__avatar > * { display: block; width: 100%; height: 100%; object-fit: cover; }
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="pm"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: left; cursor: pointer; }
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="pm"]) svg { display: block; flex: none; }
/* One white menu card – the edge is a shadow, not a border */
:where([data-look="clean"], [data-look="clean"] *).ui-pm__card {
  padding: var(--tc-menu-padding);
  border-radius: var(--tc-menu-radius);
  background: var(--tc-menu-bg);
  box-shadow: var(--tc-menu-shadow);
}
/* The signed-in user, separated from the actions by a hairline */
:where([data-look="clean"], [data-look="clean"] *).ui-pm__user {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  margin: 0 -4px var(--tc-space-1);
  padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-2-5);
  border-bottom: var(--tc-hairline) solid var(--tc-divider);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pm__avatar {
  flex: none;
  width: 32px;
  height: 32px;
  overflow: hidden;
  border-radius: var(--tc-radius-full);
  color: var(--tc-accent);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pm__avatar > * { display: block; width: 100%; height: 100%; object-fit: cover; }
.ui-pm__who {
  display: grid;
  min-width: 0;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__name {
  overflow: hidden;
  font-size: var(--tc-title-font-size);
  font-weight: var(--tc-title-font-weight);
  line-height: var(--tc-title-line-height);
  letter-spacing: var(--tc-title-tracking);
  color: var(--tc-title-color);
  white-space: nowrap;
  text-overflow: ellipsis;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__email {
  overflow: hidden;
  font-size: var(--tc-subtitle-font-size);
  line-height: var(--tc-subtitle-line-height);
  color: var(--tc-subtitle-color);
  white-space: nowrap;
  text-overflow: ellipsis;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__items {
  display: grid;
  gap: var(--tc-space-0-5);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__item {
  display: flex;
  align-items: center;
  gap: var(--tc-space-3);
  width: 100%;
  min-height: 36px;
  margin: 0;
  padding: 0 var(--tc-space-3);
  border: 0;
  border-radius: var(--tc-radius-xl);
  background: transparent;
  font: inherit;
  text-align: left;
  color: var(--tc-text-secondary);
  cursor: pointer;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__item:hover,
:where([data-look="standard"], [data-look="standard"] *).ui-pm__item:focus-visible {
  background: var(--tc-menu-item-hover);
  color: var(--tc-text-primary);
}
/* Focus: the ring, not only the faint fill (2.4.7) */
.ui-pm__item:focus-visible,
.ui-pm__next:focus-visible {
  outline: var(--tc-focus-outline);
  outline-offset: var(--tc-focus-ring-offset);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pm__name {
  overflow: hidden;
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-text-strong);
  white-space: nowrap;
  text-overflow: ellipsis;
}
:where([data-look="clean"], [data-look="clean"] *).ui-pm__email {
  overflow: hidden;
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-text-muted);
  white-space: nowrap;
  text-overflow: ellipsis;
}
/* Actions: quiet rows, a subtle fill on hover that fades out again */
:where([data-look="clean"], [data-look="clean"] *).ui-pm__items { display: grid; gap: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-pm__item {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2-5);
  width: 100%;
  min-height: var(--tc-menu-item-h);
  padding: 0 var(--tc-menu-item-px);
  border-radius: var(--tc-menu-item-radius);
  color: var(--tc-text-primary);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pm__item:hover { background: var(--tc-menu-item-hover); transition-duration: var(--tc-duration-instant); }
:where([data-look="clean"], [data-look="clean"] *).ui-pm__item:focus-visible { background: var(--tc-menu-item-hover); }
.ui-pm__item:active { background: var(--tc-fill-strong); }
.ui-pm__icon {
  display: grid;
  place-items: center;
  flex: none;
  color: var(--tc-icon-muted);
  transition: color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__icon { width: 20px; height: 20px; }
:where([data-look="standard"], [data-look="standard"] *).ui-pm__icon svg { width: 20px; height: 20px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pm__icon { width: 16px; height: 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pm__icon svg { width: 16px; height: 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pm__icon svg * { vector-effect: non-scaling-stroke; }
.ui-pm__item:hover .ui-pm__icon,
.ui-pm__item:focus-visible .ui-pm__icon { color: var(--tc-text-primary); }
.ui-pm__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__label {
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-normal);
}
/* The "New" tag: a pill in the rose tone */
.ui-pm__badge {
  display: inline-flex;
  align-items: center;
  flex: none;
  height: var(--tc-pill-h);
  padding: 0 var(--tc-pill-px);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-tone-rose-bg);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-pill-font-weight);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-tone-rose-fg);
}
/* Profile setup in the gray extension – kept to two short lines and a bar */
:where([data-look="standard"], [data-look="standard"] *).ui-pm__setup {
  padding: var(--tc-space-2-5) var(--tc-space-4-5) var(--tc-space-3);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__setup-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-snug);
}
/* Profile setup: the last row of the card, under a hairline */
:where([data-look="clean"], [data-look="clean"] *).ui-pm__setup {
  margin: var(--tc-space-1) -4px -4px;
  padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-3);
  border-top: var(--tc-hairline) solid var(--tc-divider);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pm__setup:has(.ui-pm__next) { padding-bottom: var(--tc-space-1-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-pm__setup-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--tc-space-2);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-tight);
}
.ui-pm__setup-title { color: var(--tc-text-secondary); font-weight: var(--tc-font-weight-medium); }
.ui-pm__setup-count {
  font-variant-numeric: tabular-nums;
  color: var(--tc-text-muted);
}
.ui-pm__track {
  display: block;
  height: var(--tc-meter-h);
  overflow: hidden;
  border-radius: var(--tc-meter-radius);
  background: var(--tc-meter-track);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__track { margin-top: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-pm__track { margin-top: var(--tc-space-2); }
.ui-pm__fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--tc-meter-fill);
  transform-origin: left center;
  scale: 0 1;
  transition: scale var(--tc-duration-reveal-slow) var(--tc-ease-move) var(--tc-duration-fast);
}
[data-ui="pm"][data-filled] .ui-pm__fill { scale: 1 1; }
.ui-pm__next {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  width: calc(100% + 16px);
  margin: var(--tc-space-1-5) -8px 0;
  padding: 0 var(--tc-space-2);
  color: var(--tc-text-primary);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__next {
  min-height: 26px;
  padding-block: var(--tc-space-1);
  border: 0;
  border-radius: var(--tc-radius-md);
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__next:hover,
:where([data-look="standard"], [data-look="standard"] *).ui-pm__next:focus-visible {
  background: var(--tc-menu-item-hover);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__next-label {
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pm__next {
  min-height: 28px;
  border-radius: var(--tc-radius-sm);
}
:where([data-look="clean"], [data-look="clean"] *).ui-pm__next:hover { background: var(--tc-fill-subtle); }
.ui-pm__next-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ui-pm__next-hint { color: var(--tc-text-muted); }
.ui-pm__next svg {
  flex: none;
  color: var(--tc-icon-muted);
  transition: transform var(--tc-duration-base) var(--tc-ease-move), color var(--tc-duration-fast) var(--tc-ease-standard);
}
:where([data-look="standard"], [data-look="standard"] *).ui-pm__next svg { width: 14px; height: 14px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pm__next svg { width: 16px; height: 16px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pm__next svg * { vector-effect: non-scaling-stroke; }
.ui-pm__next:hover svg { transform: translateX(2px); color: var(--tc-text-primary); }
/* Touch screens: taller rows */
@media (hover: none) and (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-pm__item { min-height: 40px; }
:where([data-look="clean"], [data-look="clean"] *).ui-pm__next { min-height: 36px; }
}
@media (prefers-reduced-motion: reduce) {
  .ui-pm__item, .ui-pm__icon, .ui-pm__fill, .ui-pm__next, .ui-pm__next svg { transition: none; }
}
`;
}

if (!customElements.get("tc-profile-menu")) customElements.define("tc-profile-menu", TcProfileMenu);

declare global {
  interface HTMLElementTagNameMap {
    "tc-profile-menu": TcProfileMenu;
  }
}
