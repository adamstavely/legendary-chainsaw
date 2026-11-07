import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, rescueFocus } from "./internal/controllers";
import { compact, dollars, duration } from "./internal/format";
import { safeUrl } from "./internal/safe-url";
import { initials } from "./internal/util";
import "./mention-picker";
import type { MentionPickerTrigger } from "./mention-picker";

/*
 * <tc-collaboration-stream> – what agents say to each other in a run, as a quiet chat. Every message says who it is
 * from and who it is for, in words ("Researcher → Orchestrator"), with its time.
 *   · handoffs and other run events ("Orchestrator started Researcher") are slim rows between the messages
 *   · a question for you is tagged "Needs you" and carries its own answer box
 *   · files are chips that open a preview under the message; every message can unfold a details card – model,
 *     tokens, cost, time and the tool calls it made, with their results
 *   · tabs filter the stream – Everyone, You, and one per agent – with counts
 *   · a message still being written shows a caret; a "Live" pill sits in the header while any is
 *   · the log stays pinned to the newest message unless you scrolled up – then a "New messages" pill takes you down
 *   · a composer at the bottom: @ names a participant (tc-mention-picker), "To" picks who it's for
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-collaboration-stream .participants=${people} .messages=${messages} .onSend=${(m) => api.post(m)}></tc-collaboration-stream>
 *
 * The page owns the messages: a sent message or an answer comes back as a new entry in `messages`. Streaming text
 * isn't announced letter by letter – a polite status says who is writing and when a message arrives.
 */

export type CollabParticipant = {
  id: string;
  name: string;
  /** A person or an agent – people get round avatars, agents square ones */
  kind: "person" | "agent";
  /** The agent's model, e.g. "Sonnet 5.5" */
  model?: string;
  /** A small picture or mark (cloned) – defaults to the initials */
  avatar?: Element;
  /** The initials to show when there's no avatar – defaults to the name's */
  initials?: string;
};

export type CollabFile = {
  id: string;
  name: string;
  /** What the preview shows: text (kept as written, in a monospace block) or an element (cloned) */
  preview?: string | Element;
};

export type CollabToolResult = { title: string; href?: string; text?: string };
export type CollabTool = {
  /** The tool's name, e.g. "web_search" */
  name: string;
  /** What the call did, e.g. "6 searches – station records 2016–2025" */
  summary: string;
  results?: CollabToolResult[];
};

export type CollabDetails = {
  model?: string;
  tokens?: number;
  /** In the currency `formatCost` writes */
  cost?: number;
  /** How long the message took, in ms */
  ms?: number;
  tools?: CollabTool[];
};

export type CollabMessageKind = "message" | "handoff" | "question" | "event";

export type CollabMessage = {
  id: string;
  /** A participant's id */
  from: string;
  /** A participant's id, or "everyone" */
  to: string;
  /** When it was sent, in epoch ms */
  at: number;
  text: string;
  /** "handoff" and "event" are slim rows; "question" to you is tagged "Needs you" and gets an answer box */
  kind?: CollabMessageKind;
  files?: CollabFile[];
  details?: CollabDetails;
  /** Still being written: a caret after the text */
  streaming?: boolean;
  /** A question that's been answered – the answer box goes */
  answered?: boolean;
};

/** "everyone", "you", or an agent's id */
export type CollabFilter = string;
export type CollabFilterChange = { filter: CollabFilter };
/** What was sent: the text, who it's for, the participants named with @, and the question it answers */
export type CollabSend = { text: string; to: string; mentions: string[]; replyTo?: string };

export const defaultCollabLabels = {
  everyone: "Everyone",
  you: "You",
  needsYou: "Needs you",
  answered: "Answered",
  live: "Live",
  writing: "Writing…",
  details: "Details",
  newMessages: "New messages",
  placeholder: "Write to the agents – @ to name one",
  send: "Send",
  answer: "Answer",
  to: "To",
};
export type CollabLabels = typeof defaultCollabLabels;

/* ---------- Icons: Lucide (ISC, lucide.dev) – messages-square, arrow-right, file, chevron-down, send, wrench,
   corner-down-right, arrow-down, x ---------- */

const headIcon = svg`<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z"></path><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"></path>`;
const icon = (body: TemplateResult, size = 12, width = 2) =>
  html`<svg width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=${width} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const arrowIcon = () => icon(svg`<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>`, 11);
const fileIcon = () => icon(svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path>`);
const chevronIcon = () => icon(svg`<path d="m6 9 6 6 6-6"></path>`);
const sendIcon = () => icon(svg`<path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path>`, 14);
const wrenchIcon = () => icon(svg`<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>`);
const handoffIcon = () => icon(svg`<polyline points="15 10 20 15 15 20"></polyline><path d="M4 4v7a4 4 0 0 0 4 4h12"></path>`);
const downIcon = () => icon(svg`<path d="M12 5v14"></path><path d="m19 12-7 7-7-7"></path>`);
const closeIcon = () => icon(svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);
const askIcon = () => icon(svg`<circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path>`);

/** How close to the bottom (px) still counts as reading the newest message */
const PINNED = 32;
const slim = (m: CollabMessage) => m.kind === "handoff" || m.kind === "event";

let instances = 0;

/**
 * What agents say to each other in a run: a quiet chat with who-to-whom, files, details and a composer.
 * @tag tc-collaboration-stream
 * @fires tc-filter-change - A filter tab was picked ({ filter }: CollabFilterChange); cancelable – prevented, `filter` stays as it was
 * @fires tc-send - A message or an answer was sent ({ text, to, mentions, replyTo }: CollabSend); cancelable – prevented, the text stays in the box
 */
export class TcCollaborationStream extends TcElement {
  static override ui = "cls";

  /** The heading */
  @property() accessor heading = "Collaboration";
  /** One line under the heading, e.g. the run's goal */
  @property() accessor description = "";
  /** Everyone in the run – people and agents */
  @property({ attribute: false }) accessor participants: CollabParticipant[] = [];
  /** The messages, oldest first */
  @property({ attribute: false }) accessor messages: CollabMessage[] = [];
  /** The tab on show: "everyone", "you", or an agent's id. Changed by the tabs unless tc-filter-change is prevented */
  @property() accessor filter: CollabFilter = "everyone";
  /** The id of the person reading – their messages read "You", and questions to them get an answer box */
  @property() accessor you = "you";
  /** Formats every cost – defaults to dollars, e.g. "$0.02" */
  @property({ attribute: false }) accessor formatCost: (amount: number) => string = dollars;
  /** Locale for times */
  @property() accessor locale: string | undefined = undefined;
  /** Time zone for times, e.g. "Europe/Berlin" – defaults to the reader's */
  @property({ attribute: "time-zone" }) accessor timeZone: string | undefined = undefined;
  /** Called with every message sent (as well as tc-send). May return a promise: the box waits, and keeps the text if it rejects */
  @property({ attribute: false }) accessor onSend: ((message: CollabSend) => void | Promise<unknown>) | undefined = undefined;
  /** Hides the composer – a read-only stream */
  @property({ type: Boolean, attribute: "hide-composer" }) accessor hideComposer = false;
  /** Words the page can rename, merged over defaultCollabLabels */
  @property({ attribute: false }) accessor labels: Partial<CollabLabels> = {};

  /** @internal Messages whose details are unfolded */
  @state() accessor openDetails: string[] = [];
  /** @internal The file preview on show, as "message id:file id" */
  @state() accessor openFile: string | null = null;
  /** @internal Who the composer writes to */
  @state() accessor to = "everyone";
  /** @internal What's in the composer */
  @state() accessor draft = "";
  /** @internal Answers being written, by question id */
  @state() accessor answers: Record<string, string> = {};
  /** @internal Sends on their way ("composer" or a question id) and ones that failed */
  @state() accessor sending: Record<string, "pending" | "error"> = {};
  /** @internal Questions answered here, before the page marks them */
  @state() accessor answeredHere: string[] = [];
  /** @internal The composer's textarea, once rendered – the mention picker attaches to it */
  @state() accessor field: HTMLTextAreaElement | null = null;
  /** @internal Messages arrived while scrolled up */
  @state() accessor unseen = false;

  private readonly uid = `tc-cls${++instances}`;
  private pinned = true;
  private seen = new Map<string, { streaming: boolean; length: number }>();
  private firstPaint = true;
  private fmt?: { key: string; f: Intl.DateTimeFormat };

  constructor() {
    super();
    new FocusRescueController(this, () => this.querySelector<HTMLElement>('.ui-cls__tab[tabindex="0"]'));
  }

  private get words(): CollabLabels {
    return { ...defaultCollabLabels, ...this.labels };
  }

  private person(id: string) {
    return this.participants.find((p) => p.id === id);
  }

  private nameOf(id: string) {
    if (id === "everyone") return this.words.everyone;
    if (id === this.you) return this.words.you;
    return this.person(id)?.name ?? id;
  }

  private time(at: number) {
    const key = `${this.locale}|${this.timeZone}`;
    if (this.fmt?.key !== key) this.fmt = { key, f: new Intl.DateTimeFormat(this.locale, { hour: "2-digit", minute: "2-digit", timeZone: this.timeZone }) };
    return this.fmt.f.format(at);
  }

  /** The filter in use – one that names an agent no longer in the run falls back to everyone */
  private get shownFilter(): CollabFilter {
    const f = this.filter;
    return f === "everyone" || f === "you" || this.participants.some((p) => p.id === f && p.kind === "agent") ? f : "everyone";
  }

  private inFilter(m: CollabMessage, filter: CollabFilter) {
    if (filter === "everyone") return true;
    const id = filter === "you" ? this.you : filter;
    return m.from === id || m.to === id || (filter === "you" && m.to === "everyone" && m.kind === "question");
  }

  private needsYou(m: CollabMessage) {
    return m.kind === "question" && m.to === this.you && !m.answered && !this.answeredHere.includes(m.id);
  }

  /* ---------- Tabs ---------- */

  private get tabs() {
    return [
      { id: "everyone", label: this.words.everyone },
      { id: "you", label: this.words.you },
      ...this.participants.filter((p) => p.kind === "agent").map((p) => ({ id: p.id, label: p.name })),
    ];
  }

  private setFilter(filter: CollabFilter) {
    if (filter === this.shownFilter) return;
    if (this.emit<CollabFilterChange>("tc-filter-change", { filter }, { cancelable: true })) this.filter = filter;
  }

  private onTabsKey(e: KeyboardEvent) {
    const tabs = [...this.querySelectorAll<HTMLElement>(".ui-cls__tab")];
    const at = tabs.indexOf(e.target as HTMLElement);
    if (at < 0) return;
    const to = e.key === "ArrowRight" ? (at + 1) % tabs.length : e.key === "ArrowLeft" ? (at - 1 + tabs.length) % tabs.length : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    this.setFilter(this.tabs[to].id);
    void this.updateComplete.then(() => this.querySelectorAll<HTMLElement>(".ui-cls__tab")[to]?.focus());
  }

  /* ---------- Sending ---------- */

  private async send(key: string, text: string, to: string, replyTo?: string) {
    const body = text.trim();
    if (!body || this.sending[key] === "pending") return false;
    const mentions = this.participants.filter((p) => body.includes(`@${p.name}`)).map((p) => p.id);
    const detail: CollabSend = { text: body, to, mentions, ...(replyTo ? { replyTo } : {}) };
    if (!this.emit<CollabSend>("tc-send", detail, { cancelable: true })) return false;
    const done = this.onSend?.(detail);
    const without = () => Object.fromEntries(Object.entries(this.sending).filter(([k]) => k !== key));
    if (done && typeof (done as Promise<unknown>).then === "function") {
      this.sending = { ...this.sending, [key]: "pending" };
      try {
        await done;
      } catch {
        if (this.isConnected) this.sending = { ...this.sending, [key]: "error" };
        return false;
      }
    }
    this.sending = without();
    return true;
  }

  private async sendDraft() {
    if (await this.send("composer", this.draft, this.to)) this.draft = "";
  }

  private async sendAnswer(m: CollabMessage) {
    const box = this.querySelector(`[data-msg="${CSS.escape(m.id)}"]`);
    if (await this.send(m.id, this.answers[m.id] ?? "", m.from, m.id)) {
      rescueFocus(box?.querySelector(".ui-cls__answer"), [this.querySelector(".ui-cls__field"), this.querySelector('.ui-cls__tab[tabindex="0"]')]);
      const { [m.id]: _sent, ...rest } = this.answers;
      this.answers = rest;
      this.answeredHere = [...this.answeredHere, m.id];
    }
  }

  private onDraftKey = (e: KeyboardEvent) => {
    if (e.key !== "Enter" || e.shiftKey || e.isComposing) return;
    e.preventDefault();
    void this.sendDraft();
  };

  /* ---------- Details and files ---------- */

  private toggleDetails(id: string) {
    this.openDetails = this.openDetails.includes(id) ? this.openDetails.filter((d) => d !== id) : [...this.openDetails, id];
  }

  private closeFile(e: Event) {
    const key = this.openFile;
    if (!key) return;
    const [msg] = key.split(":");
    rescueFocus(e.currentTarget as Element, [this.querySelector(`[data-file="${CSS.escape(key)}"]`), this.querySelector(`[data-msg="${CSS.escape(msg)}"] .ui-cls__chip`)]);
    this.openFile = null;
  }

  /* ---------- Scrolling and announcements ---------- */

  private onScroll = (e: Event) => {
    const log = e.currentTarget as HTMLElement;
    this.pinned = log.scrollHeight - log.scrollTop - log.clientHeight <= PINNED;
    if (this.pinned && this.unseen) this.unseen = false;
  };

  private toBottom() {
    const log = this.querySelector<HTMLElement>(".ui-cls__log");
    if (!log) return;
    log.scrollTop = log.scrollHeight;
    this.pinned = true;
    this.unseen = false;
  }

  protected override updated(changed: PropertyValues<this>) {
    const field = this.querySelector<HTMLTextAreaElement>(".ui-cls__field");
    if (field !== this.field) this.field = field;
    if (!changed.has("messages") && !changed.has("filter") && !this.firstPaint) return;
    const log = this.querySelector<HTMLElement>(".ui-cls__log");
    const said: string[] = [];
    let arrived = false;
    for (const m of this.messages) {
      const before = this.seen.get(m.id);
      const now = { streaming: !!m.streaming, length: m.text.length };
      if (!this.firstPaint) {
        if (!before) {
          arrived = true;
          if (m.streaming) said.push(`${this.nameOf(m.from)} is writing`);
          else said.push(slim(m) ? m.text : `${this.nameOf(m.from)} to ${this.nameOf(m.to)}: ${m.text}`);
        } else if (before.streaming && !m.streaming) said.push(`${this.nameOf(m.from)} to ${this.nameOf(m.to)}: ${m.text}`);
        else if (now.length !== before.length) arrived = true;
      }
      this.seen.set(m.id, now);
    }
    const ids = new Set(this.messages.map((m) => m.id));
    for (const id of [...this.seen.keys()]) if (!ids.has(id)) this.seen.delete(id);
    const status = this.querySelector(".ui-cls__status");
    if (status && said.length) status.textContent = said.slice(-2).join(". ");
    if (log && (this.firstPaint || changed.has("filter") || this.pinned)) log.scrollTop = log.scrollHeight;
    else if (arrived && !this.unseen) this.unseen = true;
    this.firstPaint = false;
  }

  /* ---------- Render ---------- */

  private avatar(id: string) {
    const p = this.person(id);
    const kind = p?.kind ?? (id === this.you ? "person" : "agent");
    return html`<span class="ui-cls__avatar" data-kind=${kind} aria-hidden="true"
      >${p?.avatar ? p.avatar.cloneNode(true) : (p?.initials ?? initials(this.nameOf(id)))}</span
    >`;
  }

  private details(m: CollabMessage, index: number) {
    const d = m.details;
    if (!d) return nothing;
    const open = this.openDetails.includes(m.id);
    const panel = `${this.uid}-d${index}`;
    const facts = [
      d.model ? ["Model", d.model] : null,
      d.tokens !== undefined ? ["Tokens", compact(d.tokens)] : null,
      d.cost !== undefined ? ["Cost", this.formatCost(d.cost)] : null,
      d.ms !== undefined ? ["Took", duration(d.ms)] : null,
    ].filter((f): f is string[] => !!f);
    return html`<button type="button" class="ui-cls__more" aria-expanded=${open ? "true" : "false"} aria-controls=${panel} @click=${() => this.toggleDetails(m.id)}>
        ${this.words.details}${d.tools?.length ? html`<span class="ui-cls__more-count">· ${d.tools.length === 1 ? "1 tool call" : `${d.tools.length} tool calls`}</span>` : nothing}${chevronIcon()}
      </button>
      <div class="ui-cls__details" id=${panel} ?hidden=${!open}>
        ${facts.length
          ? html`<dl class="ui-cls__facts">
              ${facts.map(([k, v]) => html`<div class="ui-cls__fact"><dt>${k}</dt><dd>${v}</dd></div>`)}
            </dl>`
          : nothing}
        ${d.tools?.length
          ? html`<ul class="ui-cls__tools" aria-label="Tool calls">
              ${d.tools.map(
                (t) => html`<li class="ui-cls__tool">
                  <span class="ui-cls__tool-head"><span class="ui-cls__tool-mark">${wrenchIcon()}</span><code class="ui-cls__tool-name">${t.name}</code><span class="ui-cls__tool-sum">${t.summary}</span></span>
                  ${t.results?.length
                    ? html`<ul class="ui-cls__results">
                        ${t.results.map((r) => {
                          const href = safeUrl(r.href);
                          return html`<li class="ui-cls__result">
                            ${href ? html`<a class="ui-cls__result-title" href=${href} target="_blank" rel="noopener noreferrer">${r.title}</a>` : html`<span class="ui-cls__result-title">${r.title}</span>`}
                            ${r.text ? html`<span class="ui-cls__result-text">${r.text}</span>` : nothing}
                          </li>`;
                        })}
                      </ul>`
                    : nothing}
                </li>`,
              )}
            </ul>`
          : nothing}
      </div>`;
  }

  private files(m: CollabMessage, index: number) {
    if (!m.files?.length) return nothing;
    const shown = m.files.find((f) => this.openFile === `${m.id}:${f.id}`);
    const panel = `${this.uid}-f${index}`;
    return html`<div class="ui-cls__files">
        ${m.files.map((f) => {
          const key = `${m.id}:${f.id}`;
          const open = this.openFile === key;
          return html`<button type="button" class="ui-cls__chip" data-file=${key} aria-expanded=${open ? "true" : "false"} aria-controls=${panel} @click=${() => (this.openFile = open ? null : key)}>
            ${fileIcon()}<span class="ui-cls__chip-name">${f.name}</span>
          </button>`;
        })}
      </div>
      <div class="ui-cls__preview" id=${panel} role="region" aria-label=${shown ? `Preview of ${shown.name}` : "Preview"} ?hidden=${!shown} @keydown=${(e: KeyboardEvent) => e.key === "Escape" && (e.stopPropagation(), this.closeFile(e))}>
        ${shown
          ? html`<div class="ui-cls__preview-head">
                ${fileIcon()}<span class="ui-cls__preview-name">${shown.name}</span>
                <button type="button" class="ui-cls__icon-btn" @click=${(e: Event) => this.closeFile(e)}>${closeIcon()}<span class="tc-sr-only">Close the preview</span></button>
              </div>
              ${shown.preview === undefined
                ? html`<p class="ui-cls__preview-empty">No preview</p>`
                : typeof shown.preview === "string"
                  ? html`<pre class="ui-cls__preview-text">${shown.preview}</pre>`
                  : html`<div class="ui-cls__preview-el">${shown.preview.cloneNode(true)}</div>`}`
          : nothing}
      </div>`;
  }

  private question(m: CollabMessage) {
    if (!this.needsYou(m)) return nothing;
    const state = this.sending[m.id];
    const value = this.answers[m.id] ?? "";
    return html`<form
      class="ui-cls__answer"
      aria-busy=${ifDefined(state === "pending" ? "true" : undefined)}
      @submit=${(e: Event) => {
        e.preventDefault();
        void this.sendAnswer(m);
      }}
    >
      <textarea
        class="ui-cls__answer-field"
        rows="1"
        aria-label=${`Answer ${this.nameOf(m.from)}`}
        placeholder=${`Answer ${this.nameOf(m.from)}…`}
        .value=${value}
        @input=${(e: Event) => (this.answers = { ...this.answers, [m.id]: (e.target as HTMLTextAreaElement).value })}
        @keydown=${(e: KeyboardEvent) => {
          if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
            e.preventDefault();
            void this.sendAnswer(m);
          }
        }}
      ></textarea>
      <button type="submit" class="ui-cls__btn ui-cls__btn--primary" ?disabled=${!value.trim() || state === "pending"}>${this.words.answer}</button>
      ${state === "error" ? html`<span class="ui-cls__error" role="alert">Didn't go through – try again</span>` : nothing}
    </form>`;
  }

  private message(m: CollabMessage, index: number) {
    const w = this.words;
    if (slim(m))
      return html`<li class="ui-cls__event" data-msg=${m.id} data-kind=${m.kind ?? "event"}>
        <span class="ui-cls__event-mark">${handoffIcon()}</span>
        <span class="ui-cls__event-text">${m.text}</span>
        <time class="ui-cls__time" datetime=${new Date(m.at).toISOString()}>${this.time(m.at)}</time>
      </li>`;
    const needs = this.needsYou(m);
    const answered = m.kind === "question" && !needs;
    const d = m.details;
    const meta = [d?.model, d?.cost !== undefined ? this.formatCost(d.cost) : undefined].filter(Boolean).join(" · ");
    return html`<li class="ui-cls__msg" data-msg=${m.id} data-kind=${m.kind ?? "message"} ?data-mine=${m.from === this.you} ?data-needs=${needs} aria-busy=${ifDefined(m.streaming ? "true" : undefined)}>
      ${this.avatar(m.from)}
      <div class="ui-cls__body">
        <div class="ui-cls__head">
          <span class="ui-cls__from">${this.nameOf(m.from)}</span>
          <span class="ui-cls__to"><span class="ui-cls__arrow">${arrowIcon()}</span><span class="tc-sr-only"> to </span>${this.nameOf(m.to)}</span>
          <time class="ui-cls__time" datetime=${new Date(m.at).toISOString()}>${this.time(m.at)}</time>
          ${needs ? html`<span class="ui-cls__tag" data-tone="warning">${askIcon()}${w.needsYou}</span>` : answered ? html`<span class="ui-cls__tag" data-tone="success">${w.answered}</span>` : nothing}
          ${meta ? html`<span class="ui-cls__meta">${meta}</span>` : nothing}
        </div>
        ${m.text || !m.streaming
          ? html`<p class="ui-cls__text">${m.text}${m.streaming ? html`<span class="ui-cls__caret" aria-hidden="true"></span>` : nothing}</p>`
          : html`<p class="ui-cls__text ui-cls__writing">${w.writing}<span class="ui-cls__caret" aria-hidden="true"></span></p>`}
        ${this.files(m, index)} ${this.question(m)} ${this.details(m, index)}
      </div>
    </li>`;
  }

  private composer() {
    if (this.hideComposer) return nothing;
    const w = this.words;
    const field = this.field;
    const state = this.sending.composer;
    const triggers: MentionPickerTrigger[] = [
      {
        char: "@",
        label: "People and agents",
        groups: [
          {
            id: "participants",
            label: "In this run",
            items: this.participants.filter((p) => p.id !== this.you).map((p) => ({ id: p.id, label: p.name, hint: p.model ?? (p.kind === "person" ? "Person" : "Agent"), avatar: true })),
          },
        ],
      },
    ];
    const toId = `${this.uid}-to`;
    return html`<form
      class="ui-cls__composer"
      aria-busy=${ifDefined(state === "pending" ? "true" : undefined)}
      @submit=${(e: Event) => {
        e.preventDefault();
        void this.sendDraft();
      }}
    >
      <textarea
        class="ui-cls__field"
        rows="2"
        aria-label="Message"
        placeholder=${w.placeholder}
        .value=${this.draft}
        @input=${(e: Event) => (this.draft = (e.target as HTMLTextAreaElement).value)}
        @keydown=${this.onDraftKey}
      ></textarea>
      ${field ? html`<tc-mention-picker look=${this.resolvedLook} .target=${field} .triggers=${triggers}></tc-mention-picker>` : nothing}
      <div class="ui-cls__compose-bar">
        <label class="ui-cls__to-label" for=${toId}>${w.to}</label>
        <select class="ui-cls__to-select" id=${toId} .value=${this.to} @change=${(e: Event) => (this.to = (e.target as HTMLSelectElement).value)}>
          <option value="everyone" ?selected=${this.to === "everyone"}>${w.everyone}</option>
          ${this.participants.filter((p) => p.id !== this.you).map((p) => html`<option value=${p.id} ?selected=${this.to === p.id}>${p.name}</option>`)}
        </select>
        ${state === "error" ? html`<span class="ui-cls__error" role="alert">Didn't go through – try again</span>` : nothing}
        <button type="submit" class="ui-cls__btn ui-cls__btn--primary ui-cls__send" ?disabled=${!this.draft.trim() || state === "pending"}>${sendIcon()}${w.send}</button>
      </div>
    </form>`;
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // The person picked to write to left the run: back to everyone
    if (changed.has("participants") && this.to !== "everyone" && !this.participants.some((p) => p.id === this.to)) this.to = "everyone";
  }


  protected override render() {
    const w = this.words;
    const filter = this.shownFilter;
    const shown = this.messages.filter((m) => this.inFilter(m, filter));
    const live = this.messages.some((m) => m.streaming);
    const needs = this.messages.filter((m) => this.needsYou(m)).length;
    const panel = `${this.uid}-log`;
    const tabs = this.tabs;
    const count = (id: string) => this.messages.filter((m) => this.inFilter(m, id)).length;
    return html`
      ${cardHead({
        icon: headIcon,
        title: this.heading,
        subtitle: this.description || undefined,
        aside: html`${needs ? html`<span class="ui-cls__tag" data-tone="warning">${needs} ${w.needsYou.toLowerCase()}</span>` : nothing}
        ${live ? html`<span class="ui-cls__live"><span class="ui-cls__live-dot" aria-hidden="true"></span>${w.live}</span>` : nothing}`,
      })}
      <div class="ui-cls__card">
        <div class="ui-cls__tabs" role="tablist" aria-label="Show messages for" @keydown=${this.onTabsKey}>
          ${tabs.map((t) => {
            const on = t.id === filter;
            return html`<button type="button" role="tab" class="ui-cls__tab" aria-selected=${on ? "true" : "false"} aria-controls=${panel} tabindex=${on ? 0 : -1} @click=${() => this.setFilter(t.id)}>
              ${t.label}<span class="tc-sr-only">, </span><span class="ui-cls__count">${count(t.id)}</span>
            </button>`;
          })}
        </div>
        <div class="ui-cls__log-wrap">
          <div class="ui-cls__log" id=${panel} role="tabpanel" tabindex="0" aria-label=${`Messages – ${tabs.find((t) => t.id === filter)?.label ?? w.everyone}`} @scroll=${this.onScroll}>
            <ol class="ui-cls__list">
            ${repeat(
              shown,
              (m) => m.id,
              (m) => this.message(m, this.messages.indexOf(m)),
            )}
            ${shown.length === 0 ? html`<li class="ui-cls__empty">No messages here yet</li>` : nothing}
            </ol>
          </div>
          ${this.unseen ? html`<button type="button" class="ui-cls__new" @click=${() => this.toBottom()}>${downIcon()}${w.newMessages}</button>` : nothing}
        </div>
        ${this.composer()}
      </div>
      <span class="ui-cls__status tc-sr-only" role="status"></span>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="cls"] {
  --tc-collaboration-stream-log-h: 420px;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  letter-spacing: var(--tc-tracking-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="cls"] {
  --tc-collaboration-stream-log-h: 420px;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="cls"] *, [data-ui="cls"] *::before, [data-ui="cls"] *::after { box-sizing: border-box; }
:where([data-ui="cls"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="cls"] :is(button, a, textarea, select, .ui-cls__log):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="cls"] :is(p, ul, ol, dl, dd, pre) { margin: 0; }
[data-ui="cls"] :is(ul, ol) { padding: 0; list-style: none; }
[data-ui="cls"] svg { display: block; flex: none; }
[data-ui="cls"] [hidden] { display: none !important; }
/* ----- The card under the header ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-cls__card { display: grid; min-width: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); overflow: hidden; }
:where([data-look="clean"], [data-look="clean"] *).ui-cls__card { display: grid; min-width: 0; border-top: var(--tc-hairline) solid var(--tc-divider); }
/* ----- Header: needs you, Live ----- */
.ui-cls__tag { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; }
.ui-cls__tag[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-cls__tag[data-tone="success"] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); }
.ui-cls__live { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-accent-subtle); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); color: var(--tc-accent-text); }
.ui-cls__live-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; animation: ui-cls-pulse var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; }
/* ----- Tabs: they scroll sideways when there isn't room ----- */
.ui-cls__tabs { display: flex; gap: var(--tc-space-1); min-width: 0; padding: var(--tc-space-2) var(--tc-space-3) 0; overflow-x: auto; scrollbar-width: none; border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-cls__tab { position: relative; display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-space-2); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); white-space: nowrap; transition: color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cls__tab:hover { color: var(--tc-text-primary); }
.ui-cls__tab[aria-selected="true"] { color: var(--tc-text-primary); }
.ui-cls__tab[aria-selected="true"]::after { content: ""; position: absolute; right: var(--tc-space-2); bottom: -1px; left: var(--tc-space-2); height: 2px; border-radius: var(--tc-radius-full); background: currentColor; }
[data-ui="cls"] .ui-cls__tab:focus-visible { outline-offset: calc(var(--tc-focus-ring-offset) * -1); }
.ui-cls__count { min-width: var(--tc-space-4); padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-full); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); text-align: center; font-variant-numeric: tabular-nums; }
/* ----- The log ----- */
.ui-cls__log-wrap { position: relative; min-width: 0; }
.ui-cls__log { max-height: var(--tc-collaboration-stream-log-h); padding: var(--tc-space-3); overflow-y: auto; overscroll-behavior: contain; }
.ui-cls__list { display: grid; align-content: start; gap: var(--tc-space-3); min-width: 0; }
.ui-cls__empty { padding: var(--tc-space-6) 0; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); text-align: center; }
.ui-cls__msg { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--tc-space-2-5); min-width: 0; animation: ui-cls-in var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-cls__avatar { display: grid; place-items: center; width: var(--tc-avatar-md); height: var(--tc-avatar-md); overflow: hidden; border-radius: var(--tc-avatar-radius-agent); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); font-size: var(--tc-avatar-font-size); font-weight: var(--tc-avatar-font-weight); color: var(--tc-text-secondary); }
.ui-cls__avatar[data-kind="person"] { border-radius: 50%; background: var(--tc-fill-strong); box-shadow: none; color: var(--tc-text-primary); }
.ui-cls__avatar > :is(svg, img) { width: 100%; height: 100%; object-fit: cover; }
.ui-cls__body { display: grid; gap: var(--tc-space-1-5); min-width: 0; }
.ui-cls__head { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-0-5) var(--tc-space-1-5); min-width: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-cls__from { font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-cls__from { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
.ui-cls__to { display: inline-flex; align-items: center; gap: var(--tc-space-1); color: var(--tc-text-muted); }
.ui-cls__arrow { color: var(--tc-text-disabled); }
.ui-cls__time { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-cls__meta { margin-left: auto; font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); white-space: nowrap; }
.ui-cls__text { font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); white-space: pre-wrap; overflow-wrap: anywhere; }
:where([data-look="clean"], [data-look="clean"] *).ui-cls__text { color: var(--tc-text-secondary); }
/* A question for you stands out with a warm rule beside it */
.ui-cls__msg[data-needs] .ui-cls__body { padding-left: var(--tc-space-2-5); border-left: 2px solid var(--tc-status-warning-solid); }
.ui-cls__writing { color: var(--tc-text-muted); }
.ui-cls__caret { display: inline-block; width: 2px; height: 1em; margin-left: var(--tc-space-0-5); vertical-align: text-bottom; border-radius: var(--tc-radius-full); background: var(--tc-accent-solid); animation: ui-cls-blink var(--tc-duration-shimmer) steps(2, jump-none) infinite; }
/* Handoffs and events: a slim row */
.ui-cls__event { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; padding: 0 var(--tc-space-1); font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); animation: ui-cls-in var(--tc-duration-slow) var(--tc-ease-move) both; }
.ui-cls__event-mark { display: grid; place-items: center; width: var(--tc-avatar-md); color: var(--tc-text-disabled); }
.ui-cls__event-text { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
/* Files as chips, the preview under them */
.ui-cls__files { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
.ui-cls__chip { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); max-width: 100%; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2-5); border-radius: var(--tc-radius-badge); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cls__chip:hover, .ui-cls__chip[aria-expanded="true"] { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-cls__chip > svg { color: var(--tc-text-muted); }
.ui-cls__chip-name { min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-cls__preview { display: grid; gap: var(--tc-space-2); min-width: 0; padding: var(--tc-space-2-5); border-radius: var(--tc-radius-lg); background: var(--tc-surface-sunken); animation: ui-cls-in var(--tc-duration-base) var(--tc-ease-move) both; }
.ui-cls__preview-head { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-cls__preview-name { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-cls__preview-text { max-height: 180px; overflow: auto; font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-secondary); white-space: pre; }
.ui-cls__preview-empty { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-cls__icon-btn { display: grid; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); margin: calc(var(--tc-space-1) * -1) 0; border-radius: var(--tc-control-radius-sm); color: var(--tc-text-muted); }
.ui-cls__icon-btn:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
/* Details: a quiet button, then the card – facts and tool calls */
.ui-cls__more { display: inline-flex; justify-self: start; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-1); margin-left: calc(var(--tc-space-1) * -1); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); }
.ui-cls__more:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-cls__more > svg { transition: transform var(--tc-duration-base) var(--tc-ease-move); }
.ui-cls__more[aria-expanded="true"] > svg { transform: rotate(180deg); }
.ui-cls__more-count { font-weight: var(--tc-font-weight-regular); }
.ui-cls__details { display: grid; gap: var(--tc-space-2-5); min-width: 0; padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-lg); background: var(--tc-surface-raised); box-shadow: var(--tc-shadow-raised); animation: ui-cls-in var(--tc-duration-base) var(--tc-ease-move) both; }
.ui-cls__facts { display: flex; flex-wrap: wrap; gap: var(--tc-space-2) var(--tc-space-5); }
.ui-cls__fact { display: grid; gap: var(--tc-space-0-5); }
.ui-cls__fact dt { font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-medium); letter-spacing: var(--tc-tracking-caps); text-transform: uppercase; color: var(--tc-text-muted); }
.ui-cls__fact dd { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-cls__tools { display: grid; gap: var(--tc-space-2); padding-top: var(--tc-space-2); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-cls__tool { display: grid; gap: var(--tc-space-1-5); min-width: 0; }
.ui-cls__tool-head { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; font-size: var(--tc-font-size-sm); }
.ui-cls__tool-mark { display: grid; place-items: center; width: var(--tc-space-5); height: var(--tc-space-5); border-radius: var(--tc-radius-xs); background: var(--tc-fill-default); color: var(--tc-text-muted); }
.ui-cls__tool-name { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); color: var(--tc-text-primary); }
.ui-cls__tool-sum { min-width: 0; overflow: hidden; color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
.ui-cls__results { display: grid; gap: var(--tc-space-1); padding-left: var(--tc-space-6); }
.ui-cls__result { display: grid; min-width: 0; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); }
.ui-cls__result-title { overflow: hidden; color: var(--tc-accent-text); white-space: nowrap; text-overflow: ellipsis; text-decoration: none; }
a.ui-cls__result-title:hover { text-decoration: underline; }
span.ui-cls__result-title { color: var(--tc-text-primary); }
.ui-cls__result-text { color: var(--tc-text-muted); }
/* Answer boxes and the composer: the field recipe */
.ui-cls__answer { display: flex; flex-wrap: wrap; align-items: flex-end; gap: var(--tc-space-2); }
.ui-cls__answer-field, .ui-cls__field { flex: 1 1 200px; min-width: 0; min-height: var(--tc-field-h); padding: var(--tc-space-2) var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); resize: vertical; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cls__answer-field:hover, .ui-cls__field:hover { box-shadow: var(--tc-field-shadow-hover); }
[data-ui="cls"] :is(.ui-cls__answer-field, .ui-cls__field):focus-visible { outline: none; box-shadow: var(--tc-field-shadow-focus); }
:is(.ui-cls__answer-field, .ui-cls__field)::placeholder { color: var(--tc-text-placeholder); }
.ui-cls__composer { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-cls__compose-bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); }
.ui-cls__to-label { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-cls__to-select { height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); }
.ui-cls__send { margin-left: auto; }
.ui-cls__error { font-size: var(--tc-font-size-xs); color: var(--tc-status-danger-fg); }
.ui-cls__btn { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-cls__btn--primary { background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); }
.ui-cls__btn--primary:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); }
.ui-cls__btn:disabled { opacity: 0.45; cursor: not-allowed; }
[aria-busy="true"] > .ui-cls__btn, [aria-busy="true"] .ui-cls__send { cursor: progress; }
/* "New messages" when you've scrolled up */
.ui-cls__new { position: absolute; bottom: var(--tc-space-3); left: 50%; display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-3); border-radius: var(--tc-radius-full); background: var(--tc-surface-inverse); box-shadow: var(--tc-shadow-overlay); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-on-inverse); transform: translateX(-50%); animation: ui-cls-in var(--tc-duration-base) var(--tc-ease-move) both; }
.ui-cls__new:hover { background: var(--tc-surface-inverse-hover); }
/* Narrow: the model and cost go behind Details */
@container (max-width: 480px) {
  .ui-cls__meta { display: none; }
  .ui-cls__log { padding: var(--tc-space-2-5); }
  .ui-cls__msg { gap: var(--tc-space-2); }
}
@keyframes ui-cls-in { from { opacity: 0; transform: translateY(4px); } }
@keyframes ui-cls-blink { 50% { opacity: 0; } }
@keyframes ui-cls-pulse { 50% { opacity: 0.35; } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="cls"] *, [data-ui="cls"] *::before, [data-ui="cls"] *::after { animation: none !important; transition: none !important; }
}
@media (forced-colors: active) {
  .ui-cls__tab[aria-selected="true"]::after, .ui-cls__caret, .ui-cls__live-dot { background: Highlight; }
  .ui-cls__chip, .ui-cls__details, .ui-cls__preview { border: 1px solid CanvasText; }
}
`;
}

if (!customElements.get("tc-collaboration-stream")) customElements.define("tc-collaboration-stream", TcCollaborationStream);

declare global {
  interface HTMLElementTagNameMap {
    "tc-collaboration-stream": TcCollaborationStream;
  }
}
