import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, rescueFocus, SmoothHeightController } from "./internal/controllers";
import type { Look } from "./internal/look";

/*
 * <tc-comment-thread> – the Lit port of src/components/comment-thread.tsx: one comment with its replies, including an
 * assistant that reports what it did. Assistant replies can fold open to show the details; replying shows a thinking
 * state while an async answer comes back; if it fails, the thread says so and offers to try again.
 *
 *   <tc-comment-thread heading="Pricing" .messages=${messages} .currentUser=${{ name: "You" }} .onReply=${ask}>
 *   </tc-comment-thread>
 *
 * `messages` stays the source of truth: when it changes the thread follows it, keyed by id. A reply posted here fires
 * a cancelable `tc-messages-change` with the whole list and shows at once unless the listener prevents it; pass the
 * list back (same ids) and the replies are simply yours. The host is the region, named by the heading. New answers and
 * a failed reply are announced once, in a small status region – the conversation itself isn't live.
 */

export type ThreadAuthor = {
  name: string;
  /** An element (cloned) or an image URL; unset shows initials */
  avatar?: Element | string;
  assistant?: boolean;
};

export type ThreadMessage = {
  id: string;
  author: ThreadAuthor;
  createdAt: Date | number;
  text: string;
  /** Assistant replies: a short status line that folds open to show these details */
  status?: string;
  details?: string[];
};

/** What `onReply` may return: a message (or a promise of one) for the assistant's answer, or nothing */
export type ThreadReplyResult = ThreadMessage | Promise<ThreadMessage | void> | void;

function ago(time: number, now: number) {
  const s = Math.max(0, Math.round((now - time) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

let uidCount = 0;

/** Clones an icon; ids inside it (SVG gradients) get a fresh suffix so copies don't point at each other */
function cloneIcon(el: Element) {
  const copy = el.cloneNode(true) as Element;
  const withId = [copy, ...copy.querySelectorAll("[id]")].filter((n) => n.id);
  if (!withId.length) return copy;
  const suffix = `-c${++uidCount}`;
  const ids = new Map(withId.map((n) => [n.id, n.id + suffix]));
  for (const n of [copy, ...copy.querySelectorAll("*")]) {
    for (const a of [...n.attributes]) {
      if (a.name === "id" && ids.has(a.value)) n.setAttribute("id", ids.get(a.value)!);
      else if (a.value.includes("url(#")) n.setAttribute(a.name, a.value.replace(/url\(#([^)]+)\)/g, (all, id: string) => (ids.has(id) ? `url(#${ids.get(id)})` : all)));
      else if ((a.name === "href" || a.name === "xlink:href") && a.value.startsWith("#") && ids.has(a.value.slice(1))) n.setAttribute(a.name, `#${ids.get(a.value.slice(1))}`);
    }
  }
  return copy;
}

/** Standard: lines drawn by attributes at the given size. Clean: 16px icons with thin, round lines (.ui-ct__glyph) */
const icon = (look: Look, d: string, size = 16) =>
  look === "clean"
    ? html`<svg viewBox="0 0 16 16" class="ui-ct__glyph" aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`
    : html`<svg viewBox="0 0 16 16" width=${size} height=${size} fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg`<path d=${d}></path>`}</svg>`;

/**
 * One comment with its replies, an assistant's status lines and a reply field.
 * @tag tc-comment-thread
 * @fires tc-messages-change - A reply was posted here or the assistant answered; detail `{ messages: ThreadMessage[] }`
 *   is the whole thread. Cancelable: preventDefault() keeps the new message out until the app passes it back.
 * @fires tc-close - The close button was pressed (shown with `closable`)
 */
export class TcCommentThread extends TcElement {
  static override ui = "ct";

  /** The heading, and the region's name */
  @property() accessor heading = "Comment";
  @property({ attribute: false }) accessor messages: ThreadMessage[] = [];
  @property({ attribute: false }) accessor currentUser: ThreadAuthor = { name: "You" };
  /** The assistant that answers – used for the thinking state */
  @property({ attribute: false }) accessor assistant: ThreadAuthor | undefined = undefined;
  /**
   * Called with every new reply. Return a message (or a promise of one) to let the assistant answer; return nothing
   * to just post the reply.
   */
  @property({ attribute: false }) accessor onReply: ((text: string) => ThreadReplyResult) | undefined = undefined;
  /** Shows a close button, which fires tc-close */
  @property({ type: Boolean }) accessor closable = false;

  /** @internal Posted here and not in `messages` yet (matched by id) */
  @state() accessor local: ThreadMessage[] = [];
  /** @internal */
  @state() accessor open = new Set<string>();
  /** @internal */
  @state() accessor draft = "";
  /** @internal */
  @state() accessor thinking = false;
  /** @internal A reply the assistant couldn't answer – shown with Try again */
  @state() accessor failed: string | null = null;
  /** @internal Relative times count from the newest message until connected, then from the real clock */
  @state() accessor now = 0;
  /** @internal What the status region says */
  @state() accessor announce = "";

  private uid = `tc-ct-${++uidCount}`;
  private count = 0;
  private firstIds: Set<string> | null = null;
  private seen: Set<string> | null = null;
  private timer = 0;
  private lastLength = -1;
  private lastThinking = false;
  private ownName = false;

  constructor() {
    super();
    // Send disables itself and Try again goes away once used: focus moves to the reply field, never to <body>
    new FocusRescueController(this, () => this.input);
    new SmoothHeightController(this, () => this.querySelector<HTMLElement>(".ui-ct__morph"), () => this.list);
  }

  private get input() {
    return this.querySelector<HTMLInputElement>(".ui-ct__input");
  }
  private get list() {
    return this.querySelector<HTMLElement>(".ui-ct__scroll");
  }

  /** @internal The thread: the property, plus what was posted here and isn't in it yet */
  get thread(): ThreadMessage[] {
    const ids = new Set(this.messages.map((m) => m.id));
    return [...this.messages, ...this.local.filter((m) => !ids.has(m.id))];
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    this.ownName ||= (this.hasAttribute("aria-label") && this.getAttribute("aria-label") !== this.heading) || this.hasAttribute("aria-labelledby");
    const read = () => (this.now = Date.now());
    read();
    this.timer = window.setInterval(read, 30_000);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.clearInterval(this.timer);
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    const list = this.thread;
    // Assistant replies that are there from the start come in a beat after the comment above them
    if (!this.firstIds) this.firstIds = new Set(this.messages.filter((m) => m.author.assistant).map((m) => m.id));
    if (!this.now) this.now = Math.max(0, ...this.messages.map((m) => +m.createdAt));
    // Announce the latest message from someone else that wasn't there before
    if (this.seen) {
      const fresh = list.filter((m) => !this.seen!.has(m.id) && m.author.name !== this.currentUser.name);
      const last = fresh[fresh.length - 1];
      if (last) this.announce = `${last.author.name}: ${[last.text, last.status].filter(Boolean).join(". ")}`;
    }
    this.seen = new Set(list.map((m) => m.id));
  }

  protected override updated() {
    // The heading names the region unless the page gave it a name of its own
    if (!this.ownName) this.setAttribute("aria-label", this.heading);
    // Follow the conversation as it grows
    const length = this.thread.length;
    if (length !== this.lastLength || this.thinking !== this.lastThinking) {
      this.lastLength = length;
      this.lastThinking = this.thinking;
      const list = this.list;
      list?.scrollTo?.({ top: list.scrollHeight, behavior: "smooth" });
    }
  }

  private post(m: ThreadMessage) {
    const next = [...this.thread.filter((x) => x.id !== m.id), m];
    if (this.emit("tc-messages-change", { messages: next }, { cancelable: true })) this.local = [...this.local.filter((x) => x.id !== m.id), m];
  }

  private send() {
    const text = this.draft.trim();
    if (!text || this.thinking) return;
    // Sent with the button: it is about to be disabled, so the reply field takes focus for the next one
    rescueFocus(this.querySelector(".ui-ct__send"), [this.input]);
    this.draft = "";
    const at = Date.now();
    this.now = at;
    this.lockHeight(true);
    this.post({ id: `${this.uid}-${++this.count}`, author: this.currentUser, createdAt: at, text });
    void this.answer(text);
  }

  /** Ask for the assistant's answer – again with Try again when it failed */
  private async answer(text: string) {
    this.failed = null;
    let reply: ThreadReplyResult;
    const fail = () => {
      this.failed = text;
      this.announce = this.assistant ? `${this.assistant.name} couldn't answer.` : "Couldn't post the reply.";
    };
    try {
      reply = this.onReply?.(text);
    } catch {
      fail();
      return;
    }
    if (!reply) return;
    this.thinking = true;
    try {
      const message = await reply;
      if (!this.isConnected) return;
      const at = Date.now();
      if (message) this.post({ ...message, createdAt: at });
      this.now = at;
    } catch {
      if (this.isConnected) fail();
    } finally {
      this.thinking = false;
    }
  }

  /** New messages keep the card at its height and the conversation scrolls up; folding details lets it grow again */
  private lockHeight(on: boolean) {
    const list = this.list;
    if (list) list.style.maxHeight = on ? `${list.offsetHeight}px` : "";
  }

  private toggle(id: string) {
    this.lockHeight(false);
    const next = new Set(this.open);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.open = next;
  }

  private avatar(author: ThreadAuthor, look: Look) {
    const size = look === "clean" ? 20 : 24;
    if (author.avatar && typeof author.avatar !== "string") return html`<span class="ui-ct__avatar">${cloneIcon(author.avatar)}</span>`;
    if (typeof author.avatar === "string") return html`<img class="ui-ct__avatar" src=${author.avatar} alt="" width=${size} height=${size} loading="lazy" />`;
    const initials = author.name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("");
    return html`<span class="ui-ct__avatar ui-ct__avatar--initials" aria-hidden="true">${initials}</span>`;
  }

  private message(m: ThreadMessage, look: Look) {
    const clean = look === "clean";
    const isOpen = this.open.has(m.id);
    const command = /^\/edit\b/i.test(m.text.trim());
    const hasDetails = !!m.details?.length;
    return html`<article class="ui-ct__msg" ?data-delayed=${this.firstIds?.has(m.id)}>
      <div class="ui-ct__meta">
        ${this.avatar(m.author, look)}
        <span class="ui-ct__name">${m.author.name}</span>
        <time class="ui-ct__time" datetime=${new Date(m.createdAt).toISOString()}>${ago(+m.createdAt, this.now)}</time>
      </div>
      ${m.text
        ? html`<p class="ui-ct__text">${command ? html`<span class="ui-ct__command">${clean ? "/edit" : "/Edit"}</span> ${m.text.trim().replace(/^\/edit\s*/i, "")}` : m.text}</p>`
        : nothing}
      ${m.status
        ? html`<div class="ui-ct__status">
            <button type="button" class="ui-ct__status-btn" aria-expanded=${isOpen ? "true" : "false"} ?disabled=${!hasDetails} @click=${() => this.toggle(m.id)}>
              ${clean
                ? html`<svg viewBox="0 0 16 16" class="ui-ct__check" aria-hidden="true">${svg`<path d="M1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Zm8.9-1.2a.5.5 0 0 0-.8-.6L7.44 9.23 6.35 8.15a.5.5 0 1 0-.7.7l1.5 1.5a.5.5 0 0 0 .76-.06l2.5-3.5Z"></path>`}</svg>
                    <span class="ui-ct__status-text">${m.status}</span>`
                : html`<span class="ui-ct__check">${icon(look, "m4 8.3 2.6 2.6L12 5.4", 12)}</span>${m.status}`}
              ${hasDetails ? html`<span class="ui-ct__chevron">${icon(look, clean ? "m5 6.5 3 3 3-3" : "m4.5 6.25 3.5 3.5 3.5-3.5", 14)}</span>` : nothing}
            </button>
            ${hasDetails
              ? html`<div class="ui-ct__details" ?data-open=${isOpen} .inert=${!isOpen}>
                  <ul>
                    ${m.details!.map((d, i) => html`<li style=${styleMap({ "--i": String(i) })}>${d}</li>`)}
                  </ul>
                </div>`
              : nothing}
          </div>`
        : nothing}
    </article>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const clean = look === "clean";
    const messages = this.thread;
    const assistant = this.assistant;
    return html`
      <header class="ui-ct__head">
        <h3 class="ui-ct__title">${this.heading}</h3>
        <span class="ui-ct__count">${messages.length} ${messages.length === 1 ? "message" : "messages"}</span>
        ${this.closable
          ? html`<button type="button" class="ui-ct__icon-btn" aria-label="Close comment" @click=${() => this.emit("tc-close", null)}>
              ${icon(look, clean ? "m4.5 4.5 7 7M11.5 4.5l-7 7" : "m4 4 8 8M12 4l-8 8")}
            </button>`
          : nothing}
      </header>
      <div class=${clean ? "ui-ct__morph" : "ui-ct__card ui-ct__morph"}>
        <div class="ui-ct__scroll" role="region" aria-label="Messages" tabindex="0">
          ${messages.map((m) => this.message(m, look))}
          ${this.failed !== null && !this.thinking
            ? html`<article class="ui-ct__msg ui-ct__failed">
                <p class="ui-ct__text">
                  ${assistant ? `${assistant.name} couldn't answer.` : "Couldn't post the reply."}
                  <button type="button" class="ui-ct__retry" @click=${() => void this.answer(this.failed!)}>Try again</button>
                </p>
              </article>`
            : nothing}
          ${this.thinking && assistant
            ? html`<article class="ui-ct__msg" aria-label=${`${assistant.name} is thinking`}>
                <div class="ui-ct__meta">${this.avatar(assistant, look)}<span class="ui-ct__name">${assistant.name}</span></div>
                ${clean ? html`<p class="ui-ct__text"><span class="ui-ct__thinking" data-text="Thinking…">Thinking…</span></p>` : html`<p class="ui-ct__thinking">Thinking…</p>`}
              </article>`
            : nothing}
        </div>
      </div>
      <form
        class="ui-ct__composer"
        @submit=${(e: Event) => {
          e.preventDefault();
          this.send();
        }}
      >
        <input
          class="ui-ct__input"
          .value=${this.draft}
          @input=${(e: Event) => (this.draft = (e.target as HTMLInputElement).value)}
          @keydown=${(e: KeyboardEvent) => {
            // Enter that confirms an IME composition doesn't send
            if (e.key === "Enter" && e.isComposing) e.preventDefault();
          }}
          placeholder=${assistant ? `Reply, or ask @${assistant.name}…` : "Add comment…"}
          aria-label="Reply"
        />
        <button type="submit" class="ui-ct__send" aria-label="Send reply" ?disabled=${!this.draft.trim() || this.thinking}>
          ${clean ? html`<svg viewBox="0 0 16 16" aria-hidden="true">${svg`<path d="M8 12.5v-9M4.25 7.25 8 3.5l3.75 3.75"></path>`}</svg>` : icon(look, "M8 13V3M3.5 7.5 8 3l4.5 4.5", 14)}
        </button>
      </form>
      <p class="ui-ct__live" role="status">${this.announce}</p>
    `;
  }

  static override css = /* css */ `
/* Colors and motion as variables – override them on [data-ui="ct"] */
[data-ui="ct"] {
  --tc-comment-thread-avatar-ring: light-dark(rgba(0, 0, 0, 0.06), rgba(255, 255, 255, 0.08));
  /* Each message builds up piece by piece – this far apart */
  --tc-comment-thread-step: 60ms;
  box-sizing: border-box;
  width: 100%;
  max-width: 420px;
  color: var(--tc-text-primary);
  -webkit-font-smoothing: antialiased;
}
/* Standard: like the Chat Composer – a tray with heading and reply field, the card sits on top of it */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ct"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
/* Clean: no tray – one card with hairline shadows */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ct"] {
  /* the shimmer band over the label: brighter than --tc-shimmer, so it reads on light text in dark mode */
  --tc-comment-thread-shimmer: light-dark(rgba(255, 255, 255, 0.82), #ffffff);
  --tc-comment-thread-avatar-ring: light-dark(rgba(0, 0, 0, 0.08), rgba(255, 255, 255, 0.1));
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  -webkit-tap-highlight-color: transparent;
}
[data-ui="ct"] *, [data-ui="ct"] *::before, [data-ui="ct"] *::after { box-sizing: border-box; }
:where([data-ui="ct"]) button { appearance: none; margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="ct"] button:focus-visible, .ui-ct__scroll:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* The conversation scrolls inside its card: its ring sits just inside */
.ui-ct__scroll:focus-visible { outline-offset: calc(var(--tc-focus-ring-width) * -1); }
:where([data-look="clean"], [data-look="clean"] *):where([data-ui="ct"]) svg { display: block; flex: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__glyph { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.1; stroke-linecap: round; stroke-linejoin: round; }
/* ---------- Header ---------- */
.ui-ct__head { display: flex; align-items: center; gap: var(--tc-space-2-5); min-height: 46px; padding: var(--tc-space-1-5) var(--tc-space-2-5) var(--tc-space-1-5) var(--tc-space-4-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__head { gap: var(--tc-space-2); min-height: 48px; padding: var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-ct__title { margin: 0; font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-relaxed); }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__title { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-strong); }
.ui-ct__count { margin-right: auto; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__count { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
/* Close: a ghost icon button */
.ui-ct__icon-btn { display: grid; place-items: center; flex: none; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__icon-btn { width: var(--tc-control-h-md); height: var(--tc-control-h-md); border-radius: var(--tc-control-radius-md); }
.ui-ct__icon-btn:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
/* ---------- The conversation ---------- */
:where([data-look="standard"], [data-look="standard"] *).ui-ct__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-ct__scroll {
  display: grid;
  gap: var(--tc-space-4-5);
  align-content: start;
  min-height: var(--tc-comment-thread-min-height, 0px);
  max-height: var(--tc-comment-thread-max-height, 340px);
  padding: var(--tc-space-4) var(--tc-space-4-5) var(--tc-space-4-5);
  overflow-y: auto;
  scrollbar-width: thin;
  border-radius: inherit;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ct__scroll {
  gap: var(--tc-space-4);
  padding: var(--tc-space-4) var(--tc-space-4) var(--tc-space-3);
  scrollbar-width: none;
  /* Soft edges at the top and towards the reply row, so nothing ends in a hard cut */
  -webkit-mask-image: linear-gradient(transparent, #000 12px, #000 calc(100% - 10px), transparent);
  mask-image: linear-gradient(transparent, #000 12px, #000 calc(100% - 10px), transparent);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ct__scroll::-webkit-scrollbar { display: none; }
/* Each message builds up piece by piece: name row, text, status – the assistant's first reply a beat later */
.ui-ct__msg { --tc-comment-thread-d: 0ms; min-width: 0; }
.ui-ct__msg[data-delayed] { --tc-comment-thread-d: var(--tc-duration-reveal); }
.ui-ct__msg > * { animation: ui-ct-in var(--tc-duration-slower) var(--tc-ease-move) both; animation-delay: var(--tc-comment-thread-d); }
.ui-ct__msg > :nth-child(2) { animation-delay: calc(var(--tc-comment-thread-d) + var(--tc-duration-instant)); }
.ui-ct__msg > :nth-child(3) { animation-delay: calc(var(--tc-comment-thread-d) + var(--tc-duration-instant) * 2); }
.ui-ct__meta { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__meta { gap: var(--tc-space-2); }
.ui-ct__avatar { display: grid; place-items: center; flex: none; width: var(--tc-avatar-md); height: var(--tc-avatar-md); border-radius: 50%; object-fit: cover; overflow: hidden; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__avatar { width: var(--tc-avatar-sm); height: var(--tc-avatar-sm); }
img.ui-ct__avatar { box-shadow: 0 0 0 var(--tc-hairline) var(--tc-comment-thread-avatar-ring); }
.ui-ct__avatar svg { width: 100%; height: 100%; }
.ui-ct__avatar--initials { background: var(--tc-accent-subtle); font-size: var(--tc-avatar-font-size); font-weight: var(--tc-avatar-font-weight); line-height: var(--tc-line-height-none); color: var(--tc-accent-text); }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__avatar--initials { background: var(--tc-fill-default); color: var(--tc-text-secondary); }
.ui-ct__name { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-lg); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__name { font-size: var(--tc-font-size-md); color: var(--tc-text-strong); }
.ui-ct__time { flex: none; margin-left: auto; font-size: var(--tc-font-size-sm); white-space: nowrap; color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__time { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-ct__text { margin: var(--tc-space-2) 0 0; font-size: var(--tc-font-size-lg); line-height: var(--tc-line-height-normal); overflow-wrap: break-word; color: var(--tc-text-secondary); }
/* Clean: text and status line up with the name, not the avatar */
:where([data-look="clean"], [data-look="clean"] *).ui-ct__text { margin: var(--tc-space-1) 0 0 var(--tc-space-7); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); }
.ui-ct__command { color: var(--tc-text-muted); }
/* Clean "/edit": a small gray tag */
:where([data-look="clean"], [data-look="clean"] *).ui-ct__command {
  display: inline-block;
  margin-right: 1px;
  padding: 0 var(--tc-space-1);
  border-radius: var(--tc-radius-badge);
  background: var(--tc-fill-default);
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
  line-height: var(--tc-line-height-snug);
  color: var(--tc-text-secondary);
}
/* Status: a ghost row – a green check, the line, and a chevron to fold the details open */
.ui-ct__status { margin-top: var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__status { margin: var(--tc-space-1) 0 0 22px; }
.ui-ct__status-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-2);
  max-width: 100%;
  height: 26px;
  padding: 0 var(--tc-space-1-5) 0 var(--tc-space-2);
  border-radius: var(--tc-radius-md);
  font-size: var(--tc-font-size-lg);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
/* The button reset sets margin: 0 – shift the row so the check icon sits centered under the avatars */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ct"] .ui-ct__status-btn { margin-left: -4px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__status-btn { gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-space-1) 0 var(--tc-space-1-5); border-radius: var(--tc-radius-sm); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); }
.ui-ct__status-btn:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); }
.ui-ct__status-btn:disabled { cursor: default; }
:where([data-look="standard"], [data-look="standard"] *).ui-ct__check { display: grid; place-items: center; width: 16px; height: 16px; border-radius: 50%; background: var(--tc-status-success-solid); color: #fff; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__status-text { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__check { width: 16px; height: 16px; fill: var(--tc-status-success-solid); }
.ui-ct__chevron { display: grid; color: var(--tc-icon-muted); transition: transform var(--tc-duration-moderate) var(--tc-ease-move), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-ct__status-btn:hover .ui-ct__chevron { color: var(--tc-text-primary); }
.ui-ct__status-btn[aria-expanded="true"] .ui-ct__chevron { transform: rotate(180deg); }
.ui-ct__details { display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--tc-duration-slow) var(--tc-ease-move); }
.ui-ct__details[data-open] { grid-template-rows: 1fr; }
.ui-ct__details ul { min-height: 0; overflow: hidden; margin: 0; padding: 0 0 0 var(--tc-space-7); list-style: none; }
.ui-ct__details li {
  position: relative;
  margin-top: var(--tc-space-1-5);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  /* Closing: lines fade out quickly while the box folds */
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-base) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ct__details li { margin-top: var(--tc-space-1); color: var(--tc-text-secondary); }
/* Opening: lines come in one after another */
.ui-ct__details[data-open] li {
  opacity: 1;
  transform: none;
  transition-duration: var(--tc-duration-slow), var(--tc-duration-slower);
  transition-delay: calc(var(--tc-comment-thread-step) * (1 + var(--i, 0)));
}
/* Tree lines instead of dots: each line gets its own corner – down on the axis of the check icon, then a rounded turn right */
:where([data-look="standard"], [data-look="standard"] *).ui-ct__details li:first-child { margin-top: var(--tc-space-1); }
.ui-ct__details li::before {
  content: "";
  position: absolute;
  left: -16.625px;
  top: -3px;
  width: 10.5px;
  height: 13px;
  border-left: 1.25px solid var(--tc-border-strong);
  border-bottom: 1.25px solid var(--tc-border-strong);
  border-bottom-left-radius: var(--tc-radius-xs);
}
/* The first branch starts with a small gap under the check icon */
:where([data-look="standard"], [data-look="standard"] *).ui-ct__details li:first-child::before { top: -5px; height: 15px; }
/* Clean: thin tree lines */
:where([data-look="clean"], [data-look="clean"] *).ui-ct__details li:first-child { margin-top: var(--tc-space-0-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__details li::before { left: -14.5px; width: 9px; height: 13.5px; border-left-width: 1px; border-bottom-width: 1px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__details li:first-child::before { top: -6px; height: 16.5px; }
/* "Thinking…": a lighter band sweeps across the gray text – a few times, then it holds still (WCAG 2.2.2).
   The band is clipped to the letters (background-clip: text), which a transform can't move */
:where([data-look="standard"], [data-look="standard"] *).ui-ct__thinking {
  display: inline-block;
  margin: var(--tc-space-2) 0 0;
  font-size: var(--tc-font-size-lg);
  background: linear-gradient(90deg, var(--tc-text-muted) 0%, var(--tc-text-muted) 35%, rgba(255, 255, 255, 0.9) 50%, var(--tc-text-muted) 65%, var(--tc-text-muted) 100%);
  background-size: 300% 100%;
  background-position: 0% 0;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ui-ct-shine var(--tc-duration-shimmer) linear 3;
}
:where([data-look="clean"], [data-look="clean"] *).ui-ct__thinking { position: relative; display: inline-block; color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__thinking::after {
  content: attr(data-text);
  content: attr(data-text) / "";
  position: absolute;
  inset: 0;
  white-space: nowrap;
  color: transparent;
  background: linear-gradient(90deg, transparent 38%, var(--tc-comment-thread-shimmer) 50%, transparent 62%) 0% 0 / 300% 100% no-repeat;
  -webkit-background-clip: text;
  background-clip: text;
  animation: ui-ct-shine var(--tc-duration-shimmer) linear 3;
  pointer-events: none;
}
/* ---------- Reply row ---------- */
.ui-ct__composer { display: flex; align-items: center; gap: var(--tc-space-2-5); padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-4-5); border-radius: var(--tc-card-radius); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
/* Clean: lies right in the card as its last row */
:where([data-look="clean"], [data-look="clean"] *).ui-ct__composer { flex: none; gap: var(--tc-space-2); margin: 0; padding: var(--tc-space-1) var(--tc-space-2-5) var(--tc-space-2-5) var(--tc-space-4); border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); }
/* Typing: the reply row shows the field focus ring (the field itself is borderless) */
.ui-ct__composer:has(.ui-ct__input:focus-visible) { box-shadow: inset 0 0 0 var(--tc-focus-ring-width) var(--tc-focus-ring); }
.ui-ct__input {
  flex: 1;
  min-width: 0;
  height: 32px;
  margin: 0;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: var(--tc-font-size-lg);
  color: var(--tc-text-primary);
  caret-color: var(--tc-accent);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ct__input { height: 28px; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-strong); }
.ui-ct__input::placeholder { color: var(--tc-text-placeholder); opacity: 1; }
/* Send: the primary action as an icon-only button, like Button – flat ink */
.ui-ct__send {
  display: grid;
  place-items: center;
  flex: none;
  width: var(--tc-control-h-sm);
  height: var(--tc-control-h-sm);
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-action-primary-bg);
  box-shadow: var(--tc-action-primary-shadow);
  color: var(--tc-action-primary-fg);
  transition: background-color var(--tc-duration-base) var(--tc-ease-standard), color var(--tc-duration-base) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move);
}
:where([data-look="clean"], [data-look="clean"] *).ui-ct__send { width: var(--tc-control-h-md); height: var(--tc-control-h-md); border-radius: var(--tc-control-radius-md); }
.ui-ct__send:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); }
.ui-ct__send:not(:disabled):active { background: var(--tc-action-primary-bg-active); transform: scale(0.94); }
.ui-ct__send:disabled { opacity: 0.3; cursor: default; }
/* Clean: a quiet gray tile until there is something to send */
:where([data-look="clean"], [data-look="clean"] *).ui-ct__send:disabled { opacity: 1; background: var(--tc-fill-default); box-shadow: none; color: var(--tc-text-disabled); }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__send svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
@keyframes ui-ct-in { from { opacity: 0; transform: translateY(4px); } }
@keyframes ui-ct-shine { from { background-position: 100% 0; } to { background-position: 0% 0; } }
/* A reply the assistant couldn't answer, with Try again */
.ui-ct__failed .ui-ct__text { color: var(--tc-status-danger-fg); }
.ui-ct__retry { margin: 0; padding: 0; border: 0; background: none; font: inherit; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }
/* The status region: read out, not shown */
.ui-ct__live { position: absolute; width: 1px; height: 1px; margin: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
[data-ui="ct"] { position: relative; }
/* Height changes glide instead of jumping */
.ui-ct__morph { overflow: hidden; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__morph { flex: none; }
.ui-ct__morph[data-smooth] { transition: height var(--tc-duration-slower) var(--tc-ease-move); }
/* Narrow containers: a little less padding */
@container (max-width: 340px) {
:where([data-look="clean"], [data-look="clean"] *).ui-ct__head { padding-left: var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__scroll { padding-left: var(--tc-space-3); padding-right: var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__composer { padding-left: var(--tc-space-3); }
}
/* Touch screens: taller hit targets */
@media (pointer: coarse) {
:where([data-look="clean"], [data-look="clean"] *).ui-ct__icon-btn,
:where([data-look="clean"], [data-look="clean"] *).ui-ct__send { width: 34px; height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__status-btn { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__input { height: 34px; }
:where([data-look="clean"], [data-look="clean"] *).ui-ct__details li:first-child::before { top: -9px; height: 19.5px; }
}
@media (prefers-reduced-motion: reduce) {
.ui-ct__msg > *, .ui-ct__thinking, .ui-ct__thinking::after { animation: none; }
.ui-ct__details, .ui-ct__details li, .ui-ct__chevron, .ui-ct__morph[data-smooth] { transition: none; }
}
/* Text fields: the reply row carries the focus ring – also against global :focus-visible rules of the host page */
[data-ui="ct"] input:not([type="checkbox"]):not([type="radio"]):focus-visible,
[data-ui="ct"] textarea:focus-visible,
[data-ui="ct"] [contenteditable]:focus-visible { outline: none; }
`;
}

if (!customElements.get("tc-comment-thread")) customElements.define("tc-comment-thread", TcCommentThread);

declare global {
  interface HTMLElementTagNameMap {
    "tc-comment-thread": TcCommentThread;
  }
}
