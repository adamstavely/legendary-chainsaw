import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { safeMediaUrl } from "./internal/safe-media";
import "./mention-picker";
import type { MentionPickerItem, MentionPickerPick, MentionPickerTrigger } from "./mention-picker";

/*
 * <tc-multiplayer-thread> – one chat thread shared by several people and one model. Each message shows who wrote it;
 * a run of messages from one person groups under one name. Joins and leaves are quiet rows in the conversation, and a
 * presence strip above it shows who's here and who's typing. The model answers only when someone @-mentions it, or
 * every message when the mode switch says so; its reply says whose message it answers ("Replying to Priya").
 * Standard: the header and presence strip on a gray tray, the conversation in a white card, the composer on the tray.
 * Clean: one white card, the header its first row.
 *
 * The page owns the conversation: `items` is the source of truth. Sending fires a cancelable tc-send with the text,
 * the ids it mentions and whether the model will answer; the field clears unless the listener prevents it, and the
 * page adds the message to `items`. The list is a `log` (new messages are read politely); typing is announced in a
 * separate status region.
 *
 *   <tc-multiplayer-thread .people=${team} .model=${{ name: "Assistant" }} current-user="ana" .items=${items}
 *     .present=${["ana", "priya"]} .typing=${["priya"]}></tc-multiplayer-thread>
 */

/** The model's id in `items`, `typing`, `present` and mentions */
export const MULTIPLAYER_MODEL_ID = "model";

export type MultiplayerPerson = {
  id: string;
  name: string;
  /** An image URL, or an element cloned per message; unset shows initials */
  avatar?: string | Element;
  /** A word after the name – "Lead", "Reviewer" */
  role?: string;
};

export type MultiplayerModel = {
  name: string;
  /** An element cloned per message (the model's mark); unset shows a sparkle */
  avatar?: Element;
};

export type MultiplayerMessage = {
  id: string;
  kind?: "message";
  /** A person's id, or MULTIPLAYER_MODEL_ID ("model") */
  authorId: string;
  /** Epoch ms */
  at: number;
  text: string;
  /** On the model's messages: the id of the person whose message it answers */
  replyTo?: string;
};

export type MultiplayerPresence = {
  id: string;
  kind: "join" | "leave";
  personId: string;
  /** Epoch ms */
  at: number;
};

export type MultiplayerItem = MultiplayerMessage | MultiplayerPresence;

/** When the model answers: only when @-mentioned, or every message */
export type MultiplayerMode = "mentions" | "every";
/** tc-send: the text, the ids it @-mentions, and whether the model will answer it */
export type MultiplayerSend = { text: string; mentions: string[]; modelAnswers: boolean };
/** tc-mode-change: the new mode */
export type MultiplayerModeChange = { mode: MultiplayerMode };

export type MultiplayerThreadLabels = {
  messages: string;
  here: string;
  modeLegend: string;
  every: string;
  mentions: string;
  replyingTo: string;
  joined: string;
  left: string;
  answering: string;
  typingOne: string;
  typingTwo: string;
  typingMany: string;
  placeholder: string;
  send: string;
  hintMentions: string;
  hintEvery: string;
  empty: string;
  you: string;
};

export const defaultMultiplayerThreadLabels: MultiplayerThreadLabels = {
  messages: "Messages",
  here: "here",
  modeLegend: "{model} answers",
  every: "Every message",
  mentions: "When mentioned",
  replyingTo: "Replying to {name}",
  joined: "{name} joined",
  left: "{name} left",
  answering: "{name} is answering…",
  typingOne: "{name} is typing…",
  typingTwo: "{a} and {b} are typing…",
  typingMany: "{count} people are typing…",
  placeholder: "Message the thread…",
  send: "Send message",
  hintMentions: "Mention @{model} to ask it",
  hintEvery: "{model} answers every message",
  empty: "No messages yet",
  you: "you",
};

const fill = (text: string, values: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (all, k: string) => (k in values ? String(values[k]) : all));

/** Messages from one author this close together group under one name */
const GROUP_GAP = 5 * 60_000;

let uidCount = 0;

/** Clones an icon; ids inside it get a fresh suffix so copies don't point at each other */
function cloneIcon(el: Element) {
  const copy = el.cloneNode(true) as Element;
  const withId = [copy, ...copy.querySelectorAll("[id]")].filter((n) => n.id);
  if (!withId.length) return copy;
  const suffix = `-m${++uidCount}`;
  const ids = new Map(withId.map((n) => [n.id, n.id + suffix]));
  for (const n of [copy, ...copy.querySelectorAll("*")]) {
    for (const a of [...n.attributes]) {
      if (a.name === "id" && ids.has(a.value)) n.setAttribute("id", ids.get(a.value)!);
      else if (a.value.includes("url(#")) n.setAttribute(a.name, a.value.replace(/url\(#([^)]+)\)/g, (all, id: string) => (ids.has(id) ? `url(#${ids.get(id)})` : all)));
    }
  }
  return copy;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The ids a text @-mentions, in the order they appear – the longest name wins, so "@Ana Ruiz" beats "@Ana" */
export function mentionsIn(text: string, names: { id: string; name: string }[]) {
  const sorted = [...names].sort((a, b) => b.name.length - a.name.length);
  if (!sorted.length) return [];
  const byName = new Map(sorted.map((n) => [n.name.toLowerCase(), n.id]));
  const re = new RegExp(`(?:^|[^\\w@])@(${sorted.map((n) => escapeRe(n.name)).join("|")})(?![\\w])`, "gi");
  const found: string[] = [];
  for (const match of text.matchAll(re)) {
    const id = byName.get(match[1].toLowerCase());
    if (id && !found.includes(id)) found.push(id);
  }
  return found;
}

// The header icon: people (Lucide "users", ISC)
const usersIcon = svg`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>`;
// The model's default mark (Lucide "sparkles", ISC)
const sparkle = svg`<path d="M9.94 14.06 4 20M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"></path>`;
// Send (Lucide "arrow-up", ISC)
const arrowUp = svg`<path d="m5 12 7-7 7 7"></path><path d="M12 19V5"></path>`;

/**
 * One chat thread with several people and one model – presence, typing, grouped messages and @-mentions.
 * @tag tc-multiplayer-thread
 * @fires tc-send - A message was sent ({ text, mentions, modelAnswers }: MultiplayerSend); cancelable – prevented, the text stays in the field
 * @fires tc-mode-change - When the model answers changed ({ mode }: MultiplayerModeChange); cancelable – prevented, the mode stays
 */
export class TcMultiplayerThread extends TcElement {
  static override ui = "mpt";

  /** The heading, and the region's name */
  @property() accessor heading = "Thread";
  /** Everyone who can be in the thread */
  @property({ attribute: false }) accessor people: MultiplayerPerson[] = [];
  /** The model in the thread */
  @property({ attribute: false }) accessor model: MultiplayerModel = { name: "Assistant" };
  /** Messages, joins and leaves, oldest first – the source of truth */
  @property({ attribute: false }) accessor items: MultiplayerItem[] = [];
  /** The id of the person using this view – their messages are theirs, and they aren't offered as a mention */
  @property({ attribute: "current-user" }) accessor currentUser = "";
  /** Ids of who's here now (MULTIPLAYER_MODEL_ID for the model) */
  @property({ attribute: false }) accessor present: string[] = [];
  /** Ids of who's typing now; MULTIPLAYER_MODEL_ID while the model is answering */
  @property({ attribute: false }) accessor typing: string[] = [];
  /** When the model answers: only when @-mentioned, or every message */
  @property() accessor mode: MultiplayerMode = "mentions";
  /** Hides the mode switch – the page decides when the model answers */
  @property({ type: Boolean, attribute: "hide-mode" }) accessor hideMode = false;
  /** The locale for times */
  @property() accessor locale: string | undefined = undefined;
  /** Words the page can rename, merged over defaultMultiplayerThreadLabels */
  @property({ attribute: false }) accessor labels: Partial<MultiplayerThreadLabels> = {};

  /** @internal */
  @state() accessor draft = "";
  /** @internal The composer field, once rendered – the mention picker attaches to it */
  @state() accessor field: HTMLTextAreaElement | null = null;
  /** @internal What the typing status says */
  @state() accessor typingSaid = "";

  private uid = `tc-mpt-${++uidCount}`;
  private lastLength = -1;
  private ownName = false;

  private get words(): MultiplayerThreadLabels {
    return { ...defaultMultiplayerThreadLabels, ...this.labels };
  }

  private get list() {
    return this.querySelector<HTMLElement>(".ui-mpt__log");
  }

  private person(id: string): MultiplayerPerson | undefined {
    return this.people.find((p) => p.id === id);
  }

  private nameOf(id: string) {
    return id === MULTIPLAYER_MODEL_ID ? this.model.name : (this.person(id)?.name ?? id);
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "region");
    this.ownName ||= (this.hasAttribute("aria-label") && this.getAttribute("aria-label") !== this.heading) || this.hasAttribute("aria-labelledby");
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("typing") || changed.has("people") || changed.has("labels") || changed.has("model")) this.typingSaid = this.typingText();
  }

  protected override firstUpdated() {
    this.field = this.querySelector<HTMLTextAreaElement>(".ui-mpt__input");
  }

  protected override updated() {
    if (!this.ownName) this.setAttribute("aria-label", this.heading);
    // Follow the conversation as it grows
    const length = this.items.length + this.typing.length;
    if (length !== this.lastLength) {
      this.lastLength = length;
      const list = this.list;
      list?.scrollTo?.({ top: list.scrollHeight });
    }
  }

  /** Puts focus in the composer */
  override focus(options?: FocusOptions) {
    this.field?.focus(options);
  }

  /** "Priya is typing…", "Priya and Tom are typing…", "3 people are typing…" – the model's answer first */
  private typingText() {
    const w = this.words;
    const ids = this.typing.filter((id) => id !== this.currentUser);
    const parts: string[] = [];
    if (ids.includes(MULTIPLAYER_MODEL_ID)) parts.push(fill(w.answering, { name: this.model.name }));
    const people = ids.filter((id) => id !== MULTIPLAYER_MODEL_ID).map((id) => this.nameOf(id));
    if (people.length === 1) parts.push(fill(w.typingOne, { name: people[0] }));
    else if (people.length === 2) parts.push(fill(w.typingTwo, { a: people[0], b: people[1] }));
    else if (people.length > 2) parts.push(fill(w.typingMany, { count: people.length }));
    return parts.join(" ");
  }

  private setMode(mode: MultiplayerMode) {
    if (mode === this.mode) return;
    if (this.emit<MultiplayerModeChange>("tc-mode-change", { mode }, { cancelable: true })) this.mode = mode;
    else this.requestUpdate();
  }

  private mentionables() {
    return [{ id: MULTIPLAYER_MODEL_ID, name: this.model.name }, ...this.people.filter((p) => p.id !== this.currentUser).map((p) => ({ id: p.id, name: p.name }))];
  }

  private send() {
    const text = this.draft.trim();
    if (!text) return;
    const mentions = mentionsIn(text, this.mentionables());
    const modelAnswers = this.mode === "every" || mentions.includes(MULTIPLAYER_MODEL_ID);
    if (!this.emit<MultiplayerSend>("tc-send", { text, mentions, modelAnswers }, { cancelable: true })) return;
    this.draft = "";
  }

  private get triggers(): MentionPickerTrigger[] {
    const people = this.people.filter((p) => p.id !== this.currentUser);
    const item = (p: MultiplayerPerson): MentionPickerItem => ({ id: p.id, label: p.name, hint: p.role, avatar: typeof p.avatar === "string" ? p.avatar : true });
    return [
      {
        char: "@",
        label: "People and the model",
        groups: [
          { id: "model", label: "Model", items: [{ id: MULTIPLAYER_MODEL_ID, label: this.model.name, hint: "answers in the thread", avatar: true }] },
          ...(people.length ? [{ id: "people", label: "People", items: people.map(item) }] : []),
        ],
      },
    ];
  }

  private avatar(id: string, size: "sm" | "md" = "md"): TemplateResult {
    const cls = `ui-mpt__avatar ui-mpt__avatar--${size}`;
    if (id === MULTIPLAYER_MODEL_ID) {
      const mark = this.model.avatar;
      return mark
        ? html`<span class=${`${cls} ui-mpt__avatar--model`} aria-hidden="true">${cloneIcon(mark)}</span>`
        : html`<span class=${`${cls} ui-mpt__avatar--model`} aria-hidden="true"
            ><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${sparkle}</svg></span
          >`;
    }
    const p = this.person(id);
    if (p?.avatar && typeof p.avatar !== "string") return html`<span class=${cls} aria-hidden="true">${cloneIcon(p.avatar)}</span>`;
    if (typeof p?.avatar === "string") return html`<img class=${cls} src=${ifDefined(safeMediaUrl(p.avatar))} alt="" loading="lazy" />`;
    const initials = (p?.name ?? id)
      .split(/\s+/)
      .map((w) => w[0] ?? "")
      .slice(0, 2)
      .join("")
      .toUpperCase();
    return html`<span class=${`${cls} ui-mpt__avatar--initials`} aria-hidden="true">${initials}</span>`;
  }

  /** The text with @-mentions marked */
  private text(text: string) {
    const names = this.mentionables()
      .concat(this.people.filter((p) => p.id === this.currentUser).map((p) => ({ id: p.id, name: p.name })))
      .map((n) => n.name)
      .sort((a, b) => b.length - a.length);
    if (!names.length) return text;
    const re = new RegExp(`(@(?:${names.map(escapeRe).join("|")}))(?![\\w])`, "gi");
    const parts = text.split(re);
    return parts.map((part, i) => (i % 2 ? html`<span class="ui-mpt__mention">${part}</span>` : part));
  }

  private time(at: number) {
    return new Intl.DateTimeFormat(this.locale, { hour: "numeric", minute: "2-digit" }).format(at);
  }

  private renderItem(item: MultiplayerItem, prev: MultiplayerItem | undefined) {
    const w = this.words;
    if (item.kind === "join" || item.kind === "leave") {
      return html`<div class="ui-mpt__event" role="listitem" data-kind=${item.kind}>
        <span>${fill(item.kind === "join" ? w.joined : w.left, { name: this.nameOf(item.personId) })}</span>
        <time datetime=${new Date(item.at).toISOString()}>${this.time(item.at)}</time>
      </div>`;
    }
    const m = item as MultiplayerMessage;
    const model = m.authorId === MULTIPLAYER_MODEL_ID;
    const mine = m.authorId === this.currentUser;
    const grouped =
      !!prev && (prev.kind === undefined || prev.kind === "message") && (prev as MultiplayerMessage).authorId === m.authorId && m.at - prev.at < GROUP_GAP && !(model && m.replyTo);
    const name = this.nameOf(m.authorId);
    const role = model ? undefined : this.person(m.authorId)?.role;
    return html`<div class="ui-mpt__msg" role="listitem" ?data-grouped=${grouped} ?data-model=${model} ?data-mine=${mine}>
      ${grouped ? html`<span class="ui-mpt__gutter" aria-hidden="true"></span>` : this.avatar(m.authorId)}
      <div class="ui-mpt__body">
        ${model && m.replyTo ? html`<p class="ui-mpt__reply-to">${fill(w.replyingTo, { name: this.nameOf(m.replyTo) })}</p>` : nothing}
        ${grouped
          ? nothing
          : html`<div class="ui-mpt__meta">
              <span class="ui-mpt__name">${name}${mine ? html` <span class="ui-mpt__you">(${w.you})</span>` : nothing}</span>
              ${role ? html`<span class="ui-mpt__role">${role}</span>` : nothing}
              <time class="ui-mpt__time" datetime=${new Date(m.at).toISOString()}>${this.time(m.at)}</time>
            </div>`}
        <p class="ui-mpt__text">${grouped ? html`<span class="ui-mpt__sr">${name}: </span>` : nothing}${this.text(m.text)}</p>
      </div>
    </div>`;
  }

  private renderPresence() {
    const w = this.words;
    const here = this.present;
    const shown = here.slice(0, 5);
    return html`<div class="ui-mpt__presence">
      <span class="ui-mpt__faces" aria-hidden="true">
        ${shown.map((id) => html`<span class="ui-mpt__face" ?data-typing=${this.typing.includes(id)}>${this.avatar(id, "sm")}</span>`)}
        ${here.length > shown.length ? html`<span class="ui-mpt__more">+${here.length - shown.length}</span>` : nothing}
      </span>
      <span class="ui-mpt__here">${here.length} ${w.here}<span class="ui-mpt__sr">: ${here.map((id) => this.nameOf(id)).join(", ")}</span></span>
      ${this.hideMode
        ? nothing
        : html`<fieldset class="ui-mpt__mode">
            <legend class="ui-mpt__sr">${fill(w.modeLegend, { model: this.model.name })}</legend>
            ${(["mentions", "every"] as const).map(
              (mode) => html`<label class="ui-mpt__mode-opt">
                <input
                  type="radio"
                  name=${`${this.uid}-mode`}
                  value=${mode}
                  .checked=${live(this.mode === mode)}
                  @change=${() => this.setMode(mode)}
                />
                <span>${mode === "every" ? w.every : w.mentions}</span>
              </label>`,
            )}
          </fieldset>`}
    </div>`;
  }

  protected override render() {
    const w = this.words;
    const clean = this.resolvedLook === "clean";
    const items = this.items;
    const typingNames = this.typing.filter((id) => id !== this.currentUser);
    const conversation = html`<div class="ui-mpt__log" role="log" aria-label=${w.messages} tabindex="0">
      ${items.length
        ? html`<div role="list" class="ui-mpt__list">${repeat(
            items,
            (it) => it.id,
            (it, i) => this.renderItem(it, items[i - 1]),
          )}</div>`
        : html`<p class="ui-mpt__empty">${w.empty}</p>`}
      ${typingNames.length
        ? html`<div class="ui-mpt__typing" aria-hidden="true">
            <span class="ui-mpt__dots"><span></span><span></span><span></span></span>
            <span>${this.typingSaid}</span>
          </div>`
        : nothing}
    </div>`;
    return html`
      ${cardHead({ icon: usersIcon, title: this.heading })}
      ${clean ? nothing : this.renderPresence()}
      <div class="ui-mpt__card">
        ${clean ? this.renderPresence() : nothing}
        ${conversation}
        ${clean ? this.renderComposer() : nothing}
      </div>
      ${clean ? nothing : this.renderComposer()}
      <span class="ui-mpt__sr" role="status">${this.typingSaid}</span>
      <tc-mention-picker
        look=${this.resolvedLook}
        .target=${this.field}
        .triggers=${this.triggers}
        @tc-pick=${(e: CustomEvent<MentionPickerPick>) => e.stopPropagation()}
        @tc-open-change=${(e: Event) => e.stopPropagation()}
        @tc-query-change=${(e: Event) => e.stopPropagation()}
      ></tc-mention-picker>
    `;
  }

  private renderComposer() {
    const w = this.words;
    const hint = fill(this.mode === "every" ? w.hintEvery : w.hintMentions, { model: this.model.name });
    return html`<form
      class="ui-mpt__composer"
      @submit=${(e: Event) => {
        e.preventDefault();
        this.send();
      }}
    >
      <div class="ui-mpt__row">
        <textarea
          class="ui-mpt__input"
          rows="1"
          .value=${live(this.draft)}
          placeholder=${w.placeholder}
          aria-label=${w.placeholder}
          aria-describedby=${`${this.uid}-hint`}
          @input=${(e: Event) => (this.draft = (e.target as HTMLTextAreaElement).value)}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
              e.preventDefault();
              this.send();
            }
          }}
        ></textarea>
        <button type="submit" class="ui-mpt__send" aria-label=${w.send} ?disabled=${!this.draft.trim()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${arrowUp}</svg>
        </button>
      </div>
      <p class="ui-mpt__hint" id=${`${this.uid}-hint`}>${hint}</p>
    </form>`;
  }

  static override css = /* css */ `
[data-ui="mpt"] {
  --tc-mpt-max-height: 380px;
  --tc-mpt-gutter: var(--tc-avatar-md);
  /* The typing dots: how far apart they bounce, and their size and gap */
  --tc-mpt-dot-step: 160ms;
  --tc-mpt-dot: 5px;
  --tc-mpt-dot-gap: 3px;
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 560px;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  -webkit-font-smoothing: antialiased;
  container-type: inline-size;
}
[data-ui="mpt"] *, [data-ui="mpt"] *::before, [data-ui="mpt"] *::after { box-sizing: border-box; }
:where([data-ui="mpt"]) button { appearance: none; margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
[data-ui="mpt"] button:focus-visible, .ui-mpt__log:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-mpt__log:focus-visible { outline-offset: calc(var(--tc-focus-ring-width) * -1); }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="mpt"] {
  gap: var(--tc-space-2);
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
:where([data-look="standard"], [data-look="standard"] *).ui-mpt__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="mpt"] {
  --tc-mpt-gutter: var(--tc-avatar-sm);
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
:where([data-look="clean"], [data-look="clean"] *).ui-mpt__card { border-top: var(--tc-hairline) solid var(--tc-divider); }
/* ---------- Presence ---------- */
.ui-mpt__presence { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); padding: 0 var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-mpt__presence { padding: var(--tc-space-2-5) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-mpt__faces { display: flex; align-items: center; }
.ui-mpt__face { position: relative; display: grid; margin-left: calc(var(--tc-space-1-5) * -1); border-radius: 50%; box-shadow: 0 0 0 2px var(--tc-surface-tray); }
:where([data-look="clean"], [data-look="clean"] *).ui-mpt__face { box-shadow: 0 0 0 2px var(--tc-surface-raised); }
.ui-mpt__face:first-child { margin-left: 0; }
/* Typing: a small accent dot on the face */
.ui-mpt__face[data-typing]::after {
  content: "";
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--tc-accent);
  box-shadow: 0 0 0 2px var(--tc-surface-tray);
  animation: ui-mpt-pulse var(--tc-duration-shimmer) var(--tc-ease-standard) infinite;
}
.ui-mpt__more { margin-left: var(--tc-space-1-5); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-mpt__here { font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
/* The mode switch: two radios drawn as a small segmented control */
.ui-mpt__mode { display: inline-flex; gap: var(--tc-space-0-5); margin: 0 0 0 auto; padding: var(--tc-space-0-5); border: 0; border-radius: var(--tc-control-radius-md); background: var(--tc-fill-default); }
.ui-mpt__mode-opt { position: relative; display: inline-grid; }
.ui-mpt__mode-opt input { position: absolute; inset: 0; margin: 0; opacity: 0; cursor: pointer; }
.ui-mpt__mode-opt span {
  display: inline-flex;
  align-items: center;
  min-height: var(--tc-control-h-sm);
  padding: 0 var(--tc-space-2-5);
  border-radius: var(--tc-control-radius-sm);
  font-size: var(--tc-font-size-sm);
  font-weight: var(--tc-font-weight-medium);
  color: var(--tc-text-secondary);
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-mpt__mode-opt input:checked + span { background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); color: var(--tc-text-primary); }
.ui-mpt__mode-opt input:focus-visible + span { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
/* ---------- The conversation ---------- */
.ui-mpt__log {
  display: grid;
  align-content: start;
  gap: var(--tc-space-1);
  max-height: var(--tc-mpt-max-height);
  padding: var(--tc-space-3) var(--tc-space-4);
  overflow-y: auto;
  scrollbar-width: thin;
  border-radius: inherit;
}
.ui-mpt__list { display: grid; gap: var(--tc-space-1); }
.ui-mpt__empty { margin: 0; padding: var(--tc-space-4) 0; text-align: center; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-mpt__msg { display: grid; grid-template-columns: var(--tc-mpt-gutter) minmax(0, 1fr); gap: var(--tc-space-2-5); margin-top: var(--tc-space-2); animation: ui-mpt-in var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-mpt__msg[data-grouped] { margin-top: 0; }
.ui-mpt__list > :first-child { margin-top: 0; }
.ui-mpt__avatar { display: grid; place-items: center; width: var(--tc-avatar-md); height: var(--tc-avatar-md); border-radius: 50%; object-fit: cover; overflow: hidden; }
.ui-mpt__avatar--sm { width: var(--tc-avatar-sm); height: var(--tc-avatar-sm); }
:where([data-look="clean"], [data-look="clean"] *).ui-mpt__msg > .ui-mpt__avatar { width: var(--tc-avatar-sm); height: var(--tc-avatar-sm); }
.ui-mpt__avatar svg { width: 62%; height: 62%; }
.ui-mpt__avatar--initials { background: var(--tc-accent-subtle); font-size: var(--tc-avatar-font-size); font-weight: var(--tc-avatar-font-weight); line-height: var(--tc-line-height-none); color: var(--tc-accent-text); }
:where([data-look="clean"], [data-look="clean"] *).ui-mpt__avatar--initials { background: var(--tc-fill-default); color: var(--tc-text-secondary); }
.ui-mpt__avatar--model { background: var(--tc-surface-inverse); color: var(--tc-text-inverse); }
.ui-mpt__body { min-width: 0; }
.ui-mpt__reply-to { margin: 0 0 var(--tc-space-0-5); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-mpt__reply-to::before { content: "↳ "; content: "↳ " / ""; }
.ui-mpt__meta { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 var(--tc-space-2); min-width: 0; }
.ui-mpt__name { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-strong); }
.ui-mpt__you { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-mpt__role, .ui-mpt__time { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-mpt__text { margin: var(--tc-space-0-5) 0 0; font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); overflow-wrap: anywhere; white-space: pre-wrap; }
.ui-mpt__msg[data-grouped] .ui-mpt__text { margin-top: 0; }
.ui-mpt__mention { padding: 0 var(--tc-space-0-5); border-radius: var(--tc-radius-xs); background: var(--tc-accent-subtle); font-weight: var(--tc-font-weight-medium); color: var(--tc-accent-text); }
.ui-mpt__event { display: flex; justify-content: center; gap: var(--tc-space-1-5); margin: var(--tc-space-2) 0; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-mpt__typing { display: flex; align-items: center; gap: var(--tc-space-2); margin-top: var(--tc-space-2); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-mpt__dots { display: inline-flex; gap: var(--tc-mpt-dot-gap); }
.ui-mpt__dots span { width: var(--tc-mpt-dot); height: var(--tc-mpt-dot); border-radius: 50%; background: var(--tc-icon-muted); animation: ui-mpt-dot var(--tc-duration-shimmer) var(--tc-ease-standard) infinite; }
.ui-mpt__dots span:nth-child(2) { animation-delay: var(--tc-mpt-dot-step); }
.ui-mpt__dots span:nth-child(3) { animation-delay: calc(var(--tc-mpt-dot-step) * 2); }
/* ---------- Composer ---------- */
.ui-mpt__composer { display: grid; gap: var(--tc-space-1); }
:where([data-look="clean"], [data-look="clean"] *).ui-mpt__composer { padding: var(--tc-space-2) var(--tc-space-3) var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-mpt__row { display: flex; align-items: flex-end; gap: var(--tc-space-2); padding: var(--tc-space-1-5) var(--tc-space-1-5) var(--tc-space-1-5) var(--tc-space-3); border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); }
.ui-mpt__row:has(.ui-mpt__input:focus-visible) { box-shadow: var(--tc-field-shadow-focus); }
.ui-mpt__input {
  flex: 1;
  min-width: 0;
  min-height: var(--tc-control-h-sm);
  max-height: 8lh;
  margin: 0;
  padding: var(--tc-space-1) 0;
  border: 0;
  outline: none;
  resize: none;
  field-sizing: content;
  background: transparent;
  font: inherit;
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  caret-color: var(--tc-accent);
}
.ui-mpt__input::placeholder { color: var(--tc-text-placeholder); opacity: 1; }
.ui-mpt__send {
  display: grid;
  place-items: center;
  flex: none;
  width: var(--tc-control-h-sm);
  height: var(--tc-control-h-sm);
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-action-primary-bg);
  box-shadow: var(--tc-action-primary-shadow);
  color: var(--tc-action-primary-fg);
}
.ui-mpt__send svg { width: 16px; height: 16px; }
.ui-mpt__send:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); }
.ui-mpt__send:disabled { background: var(--tc-fill-default); box-shadow: none; color: var(--tc-text-disabled); cursor: default; }
.ui-mpt__hint { margin: 0; padding: 0 var(--tc-space-1); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
.ui-mpt__sr { position: absolute; width: 1px; height: 1px; margin: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes ui-mpt-in { from { opacity: 0; transform: translateY(4px); } }
@keyframes ui-mpt-dot { 0%, 60%, 100% { transform: none; } 30% { transform: translateY(-3px); } }
@keyframes ui-mpt-pulse { 50% { transform: scale(0.75); } }
@container (max-width: 380px) {
.ui-mpt__mode { margin-left: 0; }
.ui-mpt__log { padding-left: var(--tc-space-3); padding-right: var(--tc-space-3); }
}
@media (prefers-reduced-motion: reduce) {
.ui-mpt__msg, .ui-mpt__dots span, .ui-mpt__face[data-typing]::after { animation: none; }
.ui-mpt__mode-opt span { transition: none; }
}
@media (forced-colors: active) {
.ui-mpt__mode-opt input:checked + span { outline: 2px solid Highlight; }
.ui-mpt__face[data-typing]::after, .ui-mpt__dots span { background: CanvasText; }
}
[data-ui="mpt"] textarea:focus-visible { outline: none; }
`;
}

if (!customElements.get("tc-multiplayer-thread")) customElements.define("tc-multiplayer-thread", TcMultiplayerThread);

declare global {
  interface HTMLElementTagNameMap {
    "tc-multiplayer-thread": TcMultiplayerThread;
  }
}
