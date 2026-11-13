import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { safeMediaUrl } from "./internal/safe-media";
import { safeUrl } from "./internal/safe-url";
import { initials } from "./internal/util";

/*
 * <tc-embed-widget> – the chat a visitor opens on a website. A launcher button sits in a corner (right or left) with
 * an unread count; it opens a panel with the agent's name, picture and how fast it replies, a greeting, a few starter
 * questions, the conversation and a message field, and a line on privacy. The page owns the conversation: Send (or a
 * starter) fires tc-send with the text, and the page appends the visitor's message and the replies to `messages`.
 * A person taking over shows as a notice row ("Priya from the help desk joined"), and their messages carry their name.
 *
 *   <tc-embed-widget heading="Ask the Institute" greeting="Hi! How can I help?" .starters=${starters} .messages=${messages}></tc-embed-widget>
 *
 * The panel is a non-modal dialog: opening it moves focus to the message field, Escape closes it and puts focus back
 * on the launcher, and Tab can leave it for the page. Enter sends, Shift+Enter starts a new line. `theme` styles it
 * for the site – the accent, the corner radius, the side, the greeting and the title – and the text on the accent is
 * dark or light, whichever reads better (embedAccentText). By default it sits in the page's flow; `floating` pins it
 * to the corner of the window, as on a real site.
 * Standard: the header on a gray tray above the white conversation card. Clean: one white card, the header its first row.
 */

export type EmbedPosition = "right" | "left";
/** How the site styles the widget – every field optional */
export type EmbedTheme = {
  /** The accent as a hex colour, "#1f6feb" – the launcher, the visitor's messages and Send */
  accent?: string;
  /** The corner radius in px, 0–24 */
  radius?: number;
  /** Which corner the launcher sits in */
  position?: EmbedPosition;
  /** The first message, from the agent */
  greeting?: string;
  /** The agent's name in the header – overrides `heading` */
  title?: string;
  /** The launcher's words – overrides labels.launcher */
  launcherLabel?: string;
};
/** Who a message is from: the visitor, the AI assistant, a person who took over, or a notice that one joined */
export type EmbedMessageFrom = "visitor" | "assistant" | "human" | "handoff";
export type EmbedMessage = {
  id: string;
  from: EmbedMessageFrom;
  text: string;
  /** A person's name (from "human", or who joined for "handoff") */
  name?: string;
};
/** A starter question shown before the visitor has written */
export type EmbedStarter = { id: string; text: string; label?: string };

/** Details of the events */
export type EmbedSend = { text: string; starter: EmbedStarter | null };
export type EmbedOpenChange = { open: boolean };

/** The widget's words, every one renameable through `labels` */
export type EmbedWidgetLabels = {
  /** The launcher's words */
  launcher: string;
  /** The header's close button */
  close: string;
  /** The conversation's name for screen readers */
  conversation: string;
  /** The starters' group name */
  starters: string;
  /** The message field's label */
  message: string;
  placeholder: string;
  send: string;
  /** How the visitor's own messages are named for screen readers */
  you: string;
  /** "{name} is typing" */
  typing: string;
  /** "{n} new messages", after the launcher's words */
  unread: string;
  /** The privacy link's words */
  privacyLink: string;
};

export const defaultEmbedWidgetLabels: EmbedWidgetLabels = {
  launcher: "Chat with us",
  close: "Close chat",
  conversation: "Conversation",
  starters: "Suggested questions",
  message: "Message",
  placeholder: "Ask a question…",
  send: "Send",
  you: "You",
  typing: "{name} is typing",
  unread: "{n} new messages",
  privacyLink: "Privacy",
};

/* ---------- Colour ---------- */

/** A hex colour ("#abc" or "#aabbcc") as 0–255 channels, or null */
export function parseEmbedHex(text: string | null | undefined): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((text ?? "").trim());
  if (!m) return null;
  const h = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

const luminance = ([r, g, b]: [number, number, number]) => {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

/** The WCAG contrast ratio between two hex colours (1–21), or null when either isn't one */
export function embedContrast(a: string, b: string): number | null {
  const x = parseEmbedHex(a);
  const y = parseEmbedHex(b);
  if (!x || !y) return null;
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
}

/** The near-black and white the widget puts on its accent, for the contrast sums */
export const EMBED_DARK_TEXT = "#0a0a0b";
export const EMBED_LIGHT_TEXT = "#ffffff";

/** Which text reads better on the accent – "light" (white) or "dark" – and its contrast ratio */
export function embedAccentText(accent: string): { text: "light" | "dark"; ratio: number } | null {
  const light = embedContrast(accent, EMBED_LIGHT_TEXT);
  const dark = embedContrast(accent, EMBED_DARK_TEXT);
  if (light === null || dark === null) return null;
  return light >= dark ? { text: "light", ratio: light } : { text: "dark", ratio: dark };
}

/* ---------- Icons (after Lucide, ISC, lucide.dev): message-circle, x, arrow-up, user-round, chevron-down ---------- */

const ICON_CHAT = svg`<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>`;
const ICON_X = svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`;
const ICON_SEND = svg`<path d="m5 12 7-7 7 7"></path><path d="M12 19V5"></path>`;
const ICON_PERSON = svg`<circle cx="12" cy="8" r="5"></circle><path d="M20 21a8 8 0 0 0-16 0"></path>`;
const ICON_DOWN = svg`<path d="m6 9 6 6 6-6"></path>`;
const icon = (body: TemplateResult, cls = "ui-emw__icon") => html`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true">${body}</svg>`;

let instances = 0;

/**
 * The chat a visitor opens on a website: a corner launcher with an unread count, and a panel with a greeting,
 * starters, the conversation and a message field, styled by `theme`.
 * @tag tc-embed-widget
 * @fires tc-open-change - The launcher, Close or Escape opened or closed the panel ({ open }: EmbedOpenChange); cancelable – prevented, `open` stays as it was
 * @fires tc-send - The visitor sent a message or picked a starter ({ text, starter }: EmbedSend); cancelable – prevented, the field keeps the text. The page appends the messages
 */
export class TcEmbedWidget extends TcElement {
  static override ui = "emw";

  /** The agent's name in the header (theme.title overrides it) */
  @property() accessor heading = "Assistant";
  /** The line under the name, e.g. how fast it replies */
  @property() accessor subtitle = "Typically replies in a minute";
  /** The agent's picture – a URL; initials of the name when there's none */
  @property() accessor avatar: string | undefined = undefined;
  /** The first message, from the agent (theme.greeting overrides it) */
  @property() accessor greeting = "";
  /** Starter questions, shown until the visitor has written */
  @property({ attribute: false }) accessor starters: EmbedStarter[] = [];
  /** The conversation, oldest first – the page appends the visitor's messages and the replies */
  @property({ attribute: false }) accessor messages: EmbedMessage[] = [];
  /** The agent is writing a reply: dots at the end of the conversation */
  @property({ type: Boolean }) accessor typing = false;
  /** The panel is open */
  @property({ type: Boolean, reflect: true }) accessor open = false;
  /** Messages the visitor hasn't seen, as a count on the launcher while the panel is closed */
  @property({ type: Number }) accessor unread = 0;
  /** Pin the widget to the window's corner, as on a site; otherwise it sits in the page's flow */
  @property({ type: Boolean, reflect: true }) accessor floating = false;
  /** Which corner the launcher sits in (theme.position overrides it) */
  @property({ reflect: true }) accessor position: EmbedPosition = "right";
  /** How the site styles it: accent, radius, side, greeting, title and launcher words */
  @property({ attribute: false }) accessor theme: EmbedTheme = {};
  /** The privacy line under the message field; empty hides it */
  @property() accessor privacy = "AI answers can be wrong. Don't share passwords or payment details.";
  /** Where the privacy line's link goes; none hides the link */
  @property({ attribute: "privacy-href" }) accessor privacyHref: string | undefined = undefined;
  /** The widget's words, merged over defaultEmbedWidgetLabels */
  @property({ attribute: false }) accessor labels: Partial<EmbedWidgetLabels> = {};

  /** @internal What's in the message field */
  @state() accessor draft = "";

  private readonly uid = `tc-emw${++instances}`;
  private focusAfter: "field" | "launcher" | null = null;
  private lastCount = 0;

  private get l(): EmbedWidgetLabels {
    return { ...defaultEmbedWidgetLabels, ...this.labels };
  }
  private get name() {
    return this.theme.title || this.heading;
  }
  private get side(): EmbedPosition {
    return this.theme.position === "left" || this.theme.position === "right" ? this.theme.position : this.position === "left" ? "left" : "right";
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("theme")) {
      // The site's accent and radius become component tokens; anything that isn't a hex colour is ignored
      const accent = parseEmbedHex(this.theme.accent) ? `#${this.theme.accent!.trim().replace(/^#/, "")}` : "";
      const text = accent ? embedAccentText(accent) : null;
      if (accent) this.style.setProperty("--tc-emw-accent", accent);
      else this.style.removeProperty("--tc-emw-accent");
      if (text) this.style.setProperty("--tc-emw-on-accent", text.text === "dark" ? "var(--tc-gray-950)" : "var(--tc-text-on-accent)");
      else this.style.removeProperty("--tc-emw-on-accent");
      const r = this.theme.radius;
      if (typeof r === "number" && Number.isFinite(r)) this.style.setProperty("--tc-emw-radius", `${Math.max(0, Math.min(24, r))}px`);
      else this.style.removeProperty("--tc-emw-radius");
    }
    this.dataset.side = this.side;
    // New messages: keep the end of the conversation in view
    const count = this.messages.length + (this.typing ? 1 : 0);
    if (this.open && (count !== this.lastCount || changed.has("open"))) {
      const log = this.querySelector<HTMLElement>(".ui-emw__log");
      if (log) log.scrollTop = log.scrollHeight;
    }
    this.lastCount = count;
    if (this.focusAfter) {
      const target = this.focusAfter === "field" ? this.querySelector<HTMLElement>(".ui-emw__field") : this.querySelector<HTMLElement>(".ui-emw__launcher");
      this.focusAfter = null;
      target?.focus();
    }
  }

  /* ---------- Opening and closing ---------- */

  private setOpen(open: boolean, focus: "field" | "launcher" | null) {
    if (open === this.open) return;
    if (!this.emit<EmbedOpenChange>("tc-open-change", { open }, { cancelable: true })) return;
    this.open = open;
    this.focusAfter = focus;
  }

  private onPanelKey(e: KeyboardEvent) {
    if (e.key !== "Escape" || e.defaultPrevented) return;
    e.preventDefault();
    this.setOpen(false, "launcher");
  }

  /* ---------- Sending ---------- */

  private send(text: string, starter: EmbedStarter | null) {
    const t = text.trim();
    if (!t) return;
    if (!this.emit<EmbedSend>("tc-send", { text: t, starter }, { cancelable: true })) return;
    if (!starter) this.draft = "";
  }

  private onFieldKey(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      this.send(this.draft, null);
    }
  }

  /* ---------- Render ---------- */

  private avatarOf(name: string, src?: string) {
    const url = safeMediaUrl(src);
    return url ? html`<img class="ui-emw__avatar" src=${url} alt="" />` : html`<span class="ui-emw__avatar" aria-hidden="true">${initials(name)}</span>`;
  }

  private message(m: EmbedMessage) {
    if (m.from === "handoff")
      return html`<li class="ui-emw__notice" data-from="handoff">${icon(ICON_PERSON)}<span>${m.text}</span></li>`;
    const who = m.from === "visitor" ? this.l.you : m.from === "human" ? (m.name ?? "") : this.name;
    return html`<li class="ui-emw__msg" data-from=${m.from}>
      ${m.from === "human" && m.name ? html`<span class="ui-emw__by" aria-hidden="true">${m.name}</span>` : nothing}
      <span class="ui-emw__bubble"><span class="ui-emw__sr">${who}: </span>${m.text}</span>
    </li>`;
  }

  protected override render() {
    const l = this.l;
    const look = this.resolvedLook;
    const name = this.name;
    const panelId = `${this.uid}-panel`;
    const headId = `${this.uid}-head`;
    const fieldId = `${this.uid}-field`;
    const greeting = this.theme.greeting ?? this.greeting;
    const asked = this.messages.some((m) => m.from === "visitor");
    const launcher = this.theme.launcherLabel || l.launcher;
    const unread = !this.open && this.unread > 0 ? this.unread : 0;
    const privacyHref = safeUrl(this.privacyHref);
    const empty = !this.draft.trim();

    const head = html`<div class="ui-emw__head">
      ${this.avatarOf(name, this.avatar)}
      <div class="ui-emw__who">
        <h3 class="ui-emw__name" id=${headId}>${name}</h3>
        ${this.subtitle ? html`<p class="ui-emw__sub"><span class="ui-emw__dot" aria-hidden="true"></span>${this.subtitle}</p>` : nothing}
      </div>
      <button type="button" class="ui-emw__close" @click=${() => this.setOpen(false, "launcher")}>${icon(ICON_X)}<span class="ui-emw__sr">${l.close}</span></button>
    </div>`;

    const body = html`<div class="ui-emw__body">
      <div class="ui-emw__log" role="log" aria-label=${l.conversation} tabindex="0"><ol class="ui-emw__list">
        ${greeting ? html`<li class="ui-emw__msg" data-from="assistant"><span class="ui-emw__bubble"><span class="ui-emw__sr">${name}: </span>${greeting}</span></li>` : nothing}
        ${this.messages.map((m) => this.message(m))}
        ${this.typing
          ? html`<li class="ui-emw__msg ui-emw__typing" data-from="assistant">
              <span class="ui-emw__bubble"><span class="ui-emw__dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="ui-emw__sr">${l.typing.replace("{name}", name)}</span></span>
            </li>`
          : nothing}
      </ol></div>
      ${!asked && this.starters.length
        ? html`<div class="ui-emw__starters" role="group" aria-label=${l.starters}>
            ${this.starters.map((s) => html`<button type="button" class="ui-emw__starter" @click=${() => this.send(s.text, s)}>${s.label ?? s.text}</button>`)}
          </div>`
        : nothing}
      <form class="ui-emw__compose" @submit=${(e: Event) => (e.preventDefault(), this.send(this.draft, null))}>
        <label class="ui-emw__sr" for=${fieldId}>${l.message}</label>
        <textarea
          class="ui-emw__field"
          id=${fieldId}
          rows="1"
          placeholder=${l.placeholder}
          .value=${live(this.draft)}
          @input=${(e: Event) => (this.draft = (e.target as HTMLTextAreaElement).value)}
          @keydown=${this.onFieldKey}
        ></textarea>
        <button type="submit" class="ui-emw__send" aria-disabled=${empty ? "true" : "false"}>${icon(ICON_SEND)}<span class="ui-emw__sr">${l.send}</span></button>
      </form>
      ${this.privacy
        ? html`<p class="ui-emw__privacy">${this.privacy}${privacyHref ? html` <a href=${privacyHref} target="_blank" rel="noopener noreferrer">${l.privacyLink}</a>` : nothing}</p>`
        : nothing}
    </div>`;

    return html`<div
        class="ui-emw__panel"
        id=${panelId}
        role="dialog"
        aria-modal="false"
        aria-labelledby=${headId}
        ?hidden=${!this.open}
        @keydown=${this.onPanelKey}
      >
        ${look === "clean" ? html`<div class="ui-emw__card">${head}${body}</div>` : html`${head}<div class="ui-emw__card">${body}</div>`}
      </div>
      <button
        type="button"
        class="ui-emw__launcher"
        aria-expanded=${this.open ? "true" : "false"}
        aria-controls=${panelId}
        @click=${() => this.setOpen(!this.open, this.open ? null : "field")}
      >
        ${icon(this.open ? ICON_DOWN : ICON_CHAT)}<span class="ui-emw__launch-label">${launcher}</span>${unread
          ? html`<span class="ui-emw__badge" aria-hidden="true">${unread > 99 ? "99+" : unread}</span><span class="ui-emw__sr">, ${l.unread.replace("{n}", String(unread))}</span>`
          : nothing}
      </button>`;
  }

  static override css = /* css */ `
[data-ui="emw"] {
  --tc-emw-accent: var(--tc-accent);
  --tc-emw-on-accent: var(--tc-text-on-accent);
  --tc-emw-radius: var(--tc-radius-xl);
  --tc-emw-w: 360px;
  --tc-emw-h: 520px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--tc-space-3);
  max-width: 100%;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="emw"] *, [data-ui="emw"] *::before, [data-ui="emw"] *::after { box-sizing: border-box; }
[data-ui="emw"][data-side="left"] { align-items: flex-start; }
[data-ui="emw"][floating] { position: fixed; inset-block-end: var(--tc-space-5); inset-inline-end: var(--tc-space-5); z-index: var(--tc-z-popover); }
[data-ui="emw"][floating][data-side="left"] { inset-inline-end: auto; inset-inline-start: var(--tc-space-5); }
:where([data-ui="emw"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="emw"] :is(button, a, textarea, .ui-emw__log):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="emw"] p, [data-ui="emw"] h3, [data-ui="emw"] ol { margin: 0; padding: 0; }
.ui-emw__icon { display: block; flex: none; width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-emw__icon { stroke-width: 1.75; }
.ui-emw__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* ----- The panel ----- */
.ui-emw__panel {
  display: flex;
  flex-direction: column;
  width: min(var(--tc-emw-w), 100%);
  height: min(var(--tc-emw-h), 100%);
  min-height: 0;
  border-radius: var(--tc-emw-radius);
  box-shadow: var(--tc-shadow-overlay);
  overflow: hidden;
  animation: ui-emw-in var(--tc-duration-moderate) var(--tc-ease-move) both;
}
.ui-emw__panel[hidden] { display: none; }
[data-ui="emw"][floating] .ui-emw__panel { width: min(var(--tc-emw-w), calc(100vw - 2 * var(--tc-space-5))); height: min(var(--tc-emw-h), calc(100vh - var(--tc-control-h-lg) - 3 * var(--tc-space-5))); }
:where([data-look="standard"], [data-look="standard"] *).ui-emw__panel { padding: var(--tc-tray-inset); background: var(--tc-surface-tray); }
:where([data-look="clean"], [data-look="clean"] *).ui-emw__panel { background: var(--tc-surface-raised); }
.ui-emw__card { display: flex; flex: 1; flex-direction: column; min-height: 0; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-emw__card { border-radius: max(0px, calc(var(--tc-emw-radius) - var(--tc-tray-inset))); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-emw__body { display: flex; flex: 1; flex-direction: column; min-height: 0; }
/* The header: the agent's picture, name and reply time, and Close */
.ui-emw__head { display: flex; align-items: center; gap: var(--tc-space-2-5); padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2-5) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *) .ui-emw__head { padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-3) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-emw__avatar { display: grid; flex: none; place-items: center; width: var(--tc-avatar-md); height: var(--tc-avatar-md); border-radius: var(--tc-radius-full); background: var(--tc-emw-accent); color: var(--tc-emw-on-accent); font-size: var(--tc-avatar-font-size); font-weight: var(--tc-avatar-font-weight); object-fit: cover; }
.ui-emw__who { flex: 1; min-width: 0; }
.ui-emw__name { overflow: hidden; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-tight); white-space: nowrap; text-overflow: ellipsis; }
.ui-emw__sub { display: flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-emw__dot { flex: none; width: 6px; height: 6px; border-radius: var(--tc-radius-full); background: var(--tc-status-success-fg); }
.ui-emw__close { display: grid; flex: none; place-items: center; width: var(--tc-control-h-md); height: var(--tc-control-h-md); border-radius: var(--tc-control-radius-md); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-emw__close:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
/* The conversation */
.ui-emw__log { flex: 1; min-height: 0; padding: var(--tc-space-4); overflow-y: auto; overscroll-behavior: contain; }
.ui-emw__list { display: flex; flex-direction: column; gap: var(--tc-space-2); list-style: none; }
.ui-emw__msg { display: flex; flex-direction: column; align-items: flex-start; gap: var(--tc-space-0-5); max-width: 85%; }
.ui-emw__msg[data-from="visitor"] { align-self: flex-end; align-items: flex-end; }
.ui-emw__bubble { padding: var(--tc-space-2) var(--tc-space-3); border-radius: max(0px, calc(var(--tc-emw-radius) - var(--tc-space-1))); background: var(--tc-fill-default); color: var(--tc-text-primary); white-space: pre-wrap; overflow-wrap: anywhere; }
.ui-emw__msg[data-from="visitor"] .ui-emw__bubble { background: var(--tc-emw-accent); color: var(--tc-emw-on-accent); }
.ui-emw__msg[data-from="human"] .ui-emw__bubble { background: var(--tc-status-info-bg); }
.ui-emw__by { padding: 0 var(--tc-space-1); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-emw__notice { display: flex; align-items: center; justify-content: center; gap: var(--tc-space-1-5); align-self: stretch; padding: var(--tc-space-1) 0; font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); text-align: center; }
.ui-emw__notice .ui-emw__icon { width: 14px; height: 14px; }
.ui-emw__dots { display: inline-flex; gap: var(--tc-space-1); padding: var(--tc-space-1) 0; }
.ui-emw__dots > i { width: 6px; height: 6px; border-radius: var(--tc-radius-full); background: var(--tc-icon-muted); animation: ui-emw-dot var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; }
.ui-emw__dots > i:nth-child(2) { animation-delay: calc(var(--tc-duration-shimmer) / 6); }
.ui-emw__dots > i:nth-child(3) { animation-delay: calc(var(--tc-duration-shimmer) / 3); }
/* Starters */
.ui-emw__starters { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); padding: 0 var(--tc-space-4) var(--tc-space-3); }
.ui-emw__starter { min-height: var(--tc-control-h-sm); padding: var(--tc-space-1) var(--tc-space-3); border-radius: var(--tc-radius-full); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); text-align: left; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-emw__starter:hover { background: var(--tc-action-ghost-bg-hover); }
/* The message field */
.ui-emw__compose { display: flex; align-items: flex-end; gap: var(--tc-space-2); margin: 0 var(--tc-space-3); padding: var(--tc-space-1-5) var(--tc-space-1-5) var(--tc-space-1-5) var(--tc-space-3); border-radius: max(0px, calc(var(--tc-emw-radius) - var(--tc-space-1))); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); }
.ui-emw__compose:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-emw__field { flex: 1; min-width: 0; max-height: calc(5 * 1lh); margin: 0; padding: var(--tc-space-1) 0; border: 0; background: none; font: inherit; color: var(--tc-text-primary); resize: none; field-sizing: content; outline: none; }
.ui-emw__field:focus-visible { outline: none; }
.ui-emw__field::placeholder { color: var(--tc-text-placeholder); }
.ui-emw__send { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-radius-full); background: var(--tc-emw-accent); color: var(--tc-emw-on-accent); transition: opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-emw__send .ui-emw__icon { width: 16px; height: 16px; }
.ui-emw__send[aria-disabled="true"] { background: var(--tc-fill-default); color: var(--tc-text-disabled); cursor: default; }
.ui-emw__privacy { padding: var(--tc-space-2) var(--tc-space-4) var(--tc-space-3); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-align: center; }
.ui-emw__privacy a { color: var(--tc-accent-text); text-decoration: underline; text-underline-offset: var(--tc-space-0-5); }
/* ----- The launcher ----- */
.ui-emw__launcher { position: relative; display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-2); height: var(--tc-control-h-lg); padding: 0 var(--tc-control-px-lg); border-radius: var(--tc-radius-full); background: var(--tc-emw-accent); box-shadow: var(--tc-shadow-overlay); color: var(--tc-emw-on-accent); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: transform var(--tc-duration-quick) var(--tc-ease-standard); }
.ui-emw__launcher:active { transform: scale(0.97); }
.ui-emw__badge { position: absolute; inset-block-start: calc(-1 * var(--tc-space-1)); inset-inline-end: calc(-1 * var(--tc-space-1)); display: grid; place-items: center; min-width: var(--tc-space-5); height: var(--tc-space-5); padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-full); background: var(--tc-status-danger-solid, var(--tc-status-danger-fg)); box-shadow: 0 0 0 var(--tc-space-0-5) var(--tc-surface-base); color: var(--tc-text-on-accent); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); font-variant-numeric: tabular-nums; }
@keyframes ui-emw-in { from { opacity: 0; transform: translateY(var(--tc-space-2)) scale(0.98); } }
@keyframes ui-emw-dot { 0%, 60%, 100% { opacity: 0.35; transform: none; } 30% { opacity: 1; transform: translateY(-2px); } }
@media (forced-colors: active) {
  .ui-emw__launcher, .ui-emw__send, .ui-emw__bubble { border: 1px solid ButtonText; }
  .ui-emw__dot, .ui-emw__dots > i { background: CanvasText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="emw"] *, [data-ui="emw"] *::before, [data-ui="emw"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-embed-widget")) customElements.define("tc-embed-widget", TcEmbedWidget);

declare global {
  interface HTMLElementTagNameMap {
    "tc-embed-widget": TcEmbedWidget;
  }
}
