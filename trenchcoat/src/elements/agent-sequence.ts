import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { reducedMotion } from "../internal/reduced-motion";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { duration as took } from "./internal/format";

/*
 * <tc-agent-sequence> – one agent run as a sequence diagram: who said what to whom, message by message. A column (a
 * lifeline) for you, every agent and every tool; each message an arrow from one lifeline to the next, in order down the
 * page – calls solid, replies dashed, failures in the danger tone with the word "Failed" on them. A bar on a lifeline
 * shows a participant at work, from the call it got to the reply it sent (to the bottom while it hasn't answered), and
 * labelled frames gather messages that ran in parallel or were retried.
 *   · live: a new message draws itself across, with a light at its tip; the diagram follows the newest one unless
 *     you've scrolled up to read (reduced motion: they just appear)
 *   · click a participant or a message (or Enter / Space on it) for a details card under the diagram – input, output,
 *     time and tokens for a message; what it sent, got and how many failed for a participant
 *   · two tab stops: the participants (← → move) and the messages (↑ ↓ or ← → move, Home / End go to the ends)
 *   · narrow, the columns keep their width and the diagram scrolls sideways; the participants' heads stay on top
 *     while it scrolls down
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-agent-sequence .participants=${[…]} .messages=${[{ id: "m1", from: "you", to: "planner", kind: "call", label: "Draft the report" }]}>
 *   </tc-agent-sequence>
 */

export type SequenceParticipantKind = "user" | "agent" | "tool";
export type SequenceParticipant = {
  id: string;
  name: string;
  kind: SequenceParticipantKind;
  /** A few muted words under the name – the model, the role, the service */
  detail?: string;
  /** A small mark element (cloned) – the tool's or the agent's logo; defaults to a mark for its kind */
  icon?: Element;
};
export type SequenceMessageKind = "call" | "reply" | "error";
export type SequenceMessage = {
  id: string;
  /** Id of the participant that sent it */
  from: string;
  /** Id of the participant it went to – the same as `from` for a note to itself */
  to: string;
  kind: SequenceMessageKind;
  /** What it said, in a few words – the tag on its line */
  label: string;
  /** When it was sent, in ms from the start of the run */
  start?: number;
  /** When the answer to it came, in ms from the start of the run */
  end?: number;
  /** Id of the frame it belongs to (a parallel or retried group) */
  group?: string;
  /** What went in and what came out – short previews for the details */
  input?: string;
  output?: string;
  /** Tokens it used, if it was a model call */
  tokens?: number;
};
export type SequenceGroupKind = "parallel" | "retry";
export type SequenceGroup = { id: string; kind: SequenceGroupKind; label?: string };
export type AgentSequenceOpenChange = { openId: string | null; message?: SequenceMessage; participant?: SequenceParticipant };
export type AgentSequenceLabels = Record<SequenceParticipantKind | SequenceMessageKind | SequenceGroupKind, string> &
  Record<
    | "participants"
    | "messages"
    | "to"
    | "failed"
    | "working"
    | "sent"
    | "received"
    | "failures"
    | "at"
    | "took"
    | "tokens"
    | "input"
    | "output"
    | "close"
    | "empty"
    | "count"
    | "keys"
    | "newest",
    string
  >;
export const defaultAgentSequenceLabels: AgentSequenceLabels = {
  user: "You",
  agent: "Agent",
  tool: "Tool",
  call: "Call",
  reply: "Reply",
  error: "Failed",
  parallel: "Parallel",
  retry: "Retry",
  participants: "Participants",
  messages: "Messages",
  to: "to",
  failed: "Failed",
  working: "Working",
  sent: "Sent",
  received: "Received",
  failures: "Failed",
  at: "Sent at",
  took: "Took",
  tokens: "Tokens",
  input: "Input",
  output: "Output",
  close: "Close details",
  empty: "No messages yet",
  count: "messages",
  keys: "Arrow keys move between messages; Enter or Space shows a message's details.",
  newest: "New message",
};

/** A participant's work on its lifeline: from the call it got to its answer (or the bottom, while it hasn't answered) */
export type SequenceActivation = { participant: string; from: number; to: number; open: boolean; depth: number };

/** The bars on the lifelines: one per call, from the call's row to the row of the answer it got */
export function sequenceActivations(messages: SequenceMessage[]): SequenceActivation[] {
  const out: SequenceActivation[] = [];
  messages.forEach((m, i) => {
    if (m.kind !== "call" || m.from === m.to) return;
    const j = messages.findIndex((r, k) => k > i && r.from === m.to && r.to === m.from && r.kind !== "call");
    const to = j < 0 ? messages.length - 1 : j;
    const depth = out.filter((a) => a.participant === m.to && a.from <= i && a.to >= i).length;
    out.push({ participant: m.to, from: i, to, open: j < 0, depth });
  });
  return out;
}

/* After Lucide: arrow-left-right (ISC licence) – the header's icon; user, bot and wrench for the kinds; x for Close */
const headIcon = svg`<path d="M8 3 4 7l4 4"></path><path d="M4 7h16"></path><path d="m16 21 4-4-4-4"></path><path d="M20 17H4"></path>`;
const icon = (paths: TemplateResult) => html`<svg class="ui-aseq__glyph" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
const KIND_ICON: Record<SequenceParticipantKind, TemplateResult> = {
  user: icon(svg`<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>`),
  agent: icon(svg`<path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path>`),
  tool: icon(
    svg`<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>`,
  ),
};
const closeIcon = icon(svg`<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`);
const failMark = html`<svg class="ui-aseq__fail" viewBox="0 0 12 12" aria-hidden="true">${svg`<path d="M3 3l6 6M9 3 3 9"></path>`}</svg>`;

let instances = 0;

/**
 * One agent run as a sequence diagram: a lifeline per participant and each message an arrow between them.
 * @tag tc-agent-sequence
 * @fires tc-open-change - A message's or a participant's details opened or closed ({ openId, message, participant }: AgentSequenceOpenChange); cancelable – prevented, `openId` stays as it was
 */
export class TcAgentSequence extends TcElement {
  static override ui = "aseq";

  /** The heading; empty leaves the header out */
  @property() accessor heading = "Agent sequence";
  /** A line under the heading – the run or the task */
  @property() accessor subtitle = "";
  /** The lifelines, left to right: you, the agents and the tools */
  @property({ attribute: false }) accessor participants: SequenceParticipant[] = [];
  /** The messages, in the order they were sent */
  @property({ attribute: false }) accessor messages: SequenceMessage[] = [];
  /** Frames around messages that ran in parallel or were retried */
  @property({ attribute: false }) accessor groups: SequenceGroup[] = [];
  /** Id of the message or participant whose details are open */
  @property({ attribute: "open-id" }) accessor openId: string | null = null;
  /** A live run: new messages draw themselves across and the diagram follows the newest */
  @property({ type: Boolean }) accessor live = false;
  /** Renames the words it uses */
  @property({ attribute: false }) accessor labels: Partial<AgentSequenceLabels> = {};

  /** @internal The message in the tab order */
  @state() private accessor activeMessage: string | null = null;
  /** @internal The participant in the tab order */
  @state() private accessor activeParticipant: string | null = null;
  /** @internal What the status region says */
  @state() private accessor message = "";

  private uid = `tc-aseq-${++instances}`;
  /** Messages already drawn – anything else is new and draws itself in */
  private seen: Set<string> | null = null;
  private fresh = new Set<string>();
  /** Follows the newest message until the reader scrolls away from the bottom */
  private following = true;

  private get words() {
    return { ...defaultAgentSequenceLabels, ...this.labels };
  }

  private nameOf(id: string) {
    return this.participants.find((p) => p.id === id)?.name ?? id;
  }

  private setOpen(openId: string | null) {
    const message = openId ? this.messages.find((m) => m.id === openId) : undefined;
    const participant = openId && !message ? this.participants.find((p) => p.id === openId) : undefined;
    if (this.emit<AgentSequenceOpenChange>("tc-open-change", { openId, message, participant }, { cancelable: true })) this.openId = openId;
  }
  private toggle(id: string) {
    this.setOpen(this.openId === id ? null : id);
  }
  private close() {
    const was = this.openId;
    this.setOpen(null);
    if (this.openId === null && was)
      void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-id="${CSS.escape(was)}"]`)?.focus());
  }

  private onListKey(e: KeyboardEvent, ids: string[], current: string | null, set: (id: string) => void, vertical: boolean) {
    const i = ids.indexOf(current ?? "");
    const fwd = e.key === "ArrowRight" || (vertical && e.key === "ArrowDown");
    const back = e.key === "ArrowLeft" || (vertical && e.key === "ArrowUp");
    let next = -1;
    if (fwd) next = Math.min(ids.length - 1, i + 1);
    else if (back) next = Math.max(0, i - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = ids.length - 1;
    else if (e.key === "Escape" && this.openId) {
      e.preventDefault();
      this.close();
      return;
    } else return;
    e.preventDefault();
    set(ids[next]);
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-id="${CSS.escape(ids[next])}"]`)?.focus());
  }

  private onScroll(e: Event) {
    const el = e.currentTarget as HTMLElement;
    this.following = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("messages")) {
      const ids = this.messages.map((m) => m.id);
      this.fresh = this.seen && this.live ? new Set(ids.filter((id) => !this.seen!.has(id))) : new Set();
      this.seen = new Set(ids);
      const last = this.messages.at(-1);
      if (this.fresh.size && last) this.message = `${this.words.newest}: ${this.nameOf(last.from)} ${this.words.to} ${this.nameOf(last.to)}, ${last.label}`;
    }
    if (this.openId && !this.messages.some((m) => m.id === this.openId) && !this.participants.some((p) => p.id === this.openId)) this.openId = null;
  }

  protected override updated() {
    if (!this.fresh.size || !this.following) return;
    const scroller = this.querySelector<HTMLElement>(".ui-aseq__scroll");
    scroller?.scrollTo({ top: scroller.scrollHeight, behavior: reducedMotion() ? "auto" : "smooth" });
  }

  private messageDetails(m: SequenceMessage) {
    const words = this.words;
    const kind = words[m.kind] ?? words.call;
    return html`<p class="ui-aseq__detail-sub">${this.nameOf(m.from)} → ${this.nameOf(m.to)} · ${kind}</p>
      <dl class="ui-aseq__facts">
        ${m.start !== undefined ? html`<div><dt>${words.at}</dt><dd>${took(m.start)}</dd></div>` : nothing}
        ${m.start !== undefined && m.end !== undefined ? html`<div><dt>${words.took}</dt><dd>${took(m.end - m.start)}</dd></div>` : nothing}
        ${m.tokens !== undefined ? html`<div><dt>${words.tokens}</dt><dd>${new Intl.NumberFormat().format(m.tokens)}</dd></div>` : nothing}
      </dl>
      ${m.input ? html`<p class="ui-aseq__io"><span class="ui-aseq__io-label">${words.input}</span>${m.input}</p>` : nothing}
      ${m.output ? html`<p class="ui-aseq__io" ?data-failed=${m.kind === "error"}><span class="ui-aseq__io-label">${words.output}</span>${m.output}</p>` : nothing}`;
  }

  private participantDetails(p: SequenceParticipant) {
    const words = this.words;
    const sent = this.messages.filter((m) => m.from === p.id).length;
    const received = this.messages.filter((m) => m.to === p.id).length;
    const failed = this.messages.filter((m) => m.from === p.id && m.kind === "error").length;
    return html`<p class="ui-aseq__detail-sub">${words[p.kind] ?? words.agent}${p.detail ? html` · ${p.detail}` : nothing}</p>
      <dl class="ui-aseq__facts">
        <div><dt>${words.sent}</dt><dd>${sent}</dd></div>
        <div><dt>${words.received}</dt><dd>${received}</dd></div>
        <div><dt>${words.failures}</dt><dd>${failed}</dd></div>
      </dl>`;
  }

  protected override render() {
    const words = this.words;
    const cols = this.participants;
    const n = Math.max(1, cols.length);
    const colOf = new Map(cols.map((p, i) => [p.id, i]));
    const msgs = this.messages.filter((m) => colOf.has(m.from) && colOf.has(m.to));
    const ids = msgs.map((m) => m.id);
    const pids = cols.map((p) => p.id);
    const activeMsg = this.activeMessage && ids.includes(this.activeMessage) ? this.activeMessage : (ids[0] ?? null);
    const activeP = this.activeParticipant && pids.includes(this.activeParticipant) ? this.activeParticipant : (pids[0] ?? null);
    const bars = sequenceActivations(msgs);
    const frames = this.groups
      .map((g) => {
        const rows = msgs.flatMap((m, i) => (m.group === g.id ? [i] : []));
        if (!rows.length) return null;
        const inside = msgs.filter((m) => m.group === g.id).flatMap((m) => [colOf.get(m.from)!, colOf.get(m.to)!]);
        return { g, from: Math.min(...rows), to: Math.max(...rows), left: Math.min(...inside), right: Math.max(...inside) };
      })
      .filter((f) => f !== null);
    const open = this.openId ? (msgs.find((m) => m.id === this.openId) ?? cols.find((p) => p.id === this.openId) ?? null) : null;
    const working = new Set(bars.filter((b) => b.open).map((b) => b.participant));
    const aside = html`<span class="ui-aseq__count">${msgs.length} ${words.count}</span>`;
    return html`${this.heading ? cardHead({ icon: headIcon, title: this.heading, subtitle: this.subtitle, id: `${this.uid}-title`, aside }) : nothing}
      <div class="ui-aseq__card">
        <div class="ui-aseq__scroll" @scroll=${this.onScroll}>
          <div class="ui-aseq__grid" style=${styleMap({ "--tc-aseq-n": String(n) })}>
            <div class="ui-aseq__heads" role="toolbar" aria-label=${words.participants} @keydown=${(e: KeyboardEvent) => this.onListKey(e, pids, activeP, (id) => (this.activeParticipant = id), false)}>
              ${cols.map(
                (p) => html`<button
                  type="button"
                  class="ui-aseq__head"
                  data-id=${p.id}
                  data-kind=${p.kind}
                  ?data-working=${working.has(p.id)}
                  tabindex=${p.id === activeP ? 0 : -1}
                  aria-expanded=${this.openId === p.id ? "true" : "false"}
                  aria-controls=${`${this.uid}-detail`}
                  @click=${() => this.toggle(p.id)}
                  @focus=${() => (this.activeParticipant = p.id)}
                >
                  <span class="ui-aseq__avatar">${p.icon ? p.icon.cloneNode(true) : (KIND_ICON[p.kind] ?? KIND_ICON.agent)}</span>
                  <span class="ui-aseq__who">
                    <span class="ui-aseq__name">${p.name}</span>
                    <span class="ui-aseq__role">${working.has(p.id) ? words.working : (p.detail ?? words[p.kind] ?? "")}</span>
                  </span>
                </button>`,
              )}
            </div>
            <div class="ui-aseq__body" style=${styleMap({ "--tc-aseq-rows": String(msgs.length) })}>
              <div class="ui-aseq__lanes" aria-hidden="true">
                ${cols.map(
                  (p) => html`<div class="ui-aseq__lane">
                    ${bars
                      .filter((b) => b.participant === p.id)
                      .map(
                        (b) =>
                          html`<span
                            class="ui-aseq__active"
                            ?data-open=${b.open}
                            style=${styleMap({ "--tc-aseq-from": String(b.from), "--tc-aseq-span": String(b.to - b.from), "--tc-aseq-depth": String(b.depth) })}
                          ></span>`,
                      )}
                  </div>`,
                )}
              </div>
              ${frames.map(
                (f) => html`<div
                  class="ui-aseq__frame"
                  data-kind=${f.g.kind}
                  aria-hidden="true"
                  style=${styleMap({ "--tc-aseq-from": String(f.from), "--tc-aseq-span": String(f.to - f.from + 1), "--tc-aseq-left": String(f.left), "--tc-aseq-cols": String(f.right - f.left + 1) })}
                >
                  <span class="ui-aseq__frame-tag">${words[f.g.kind] ?? f.g.kind}${f.g.label ? html` · ${f.g.label}` : nothing}</span>
                </div>`,
              )}
              ${msgs.length
                ? html`<ol class="ui-aseq__msgs" aria-label=${words.messages} aria-describedby=${`${this.uid}-keys`} @keydown=${(e: KeyboardEvent) => this.onListKey(e, ids, activeMsg, (id) => (this.activeMessage = id), true)}>
                    ${msgs.map((m) => {
                      const a = colOf.get(m.from)!;
                      const b = colOf.get(m.to)!;
                      const self = a === b;
                      const lo = Math.min(a, b);
                      const span = Math.abs(b - a) + 1;
                      const kind = m.kind === "reply" || m.kind === "error" ? m.kind : "call";
                      const group = m.group ? this.groups.find((g) => g.id === m.group) : undefined;
                      return html`<li class="ui-aseq__row" data-kind=${kind} ?data-new=${this.fresh.has(m.id) && !reducedMotion()}>
                        <button
                          type="button"
                          class="ui-aseq__msg"
                          data-id=${m.id}
                          tabindex=${m.id === activeMsg ? 0 : -1}
                          aria-expanded=${this.openId === m.id ? "true" : "false"}
                          aria-controls=${`${this.uid}-detail`}
                          @click=${() => this.toggle(m.id)}
                          @focus=${() => (this.activeMessage = m.id)}
                        >
                          <span
                            class="ui-aseq__arrow"
                            data-dir=${self ? "self" : b > a ? "right" : "left"}
                            style=${styleMap({ "grid-column": `${lo + 1} / span ${span}`, "--tc-aseq-span-cols": String(span) })}
                          >
                            <span class="ui-aseq__line" aria-hidden="true"></span>
                            <span class="ui-aseq__label">${kind === "error" ? html`${failMark}<span class="ui-aseq__failed">${words.failed}</span> · ` : nothing}${m.label}</span>
                          </span>
                          <span class="tc-sr-only">, ${this.nameOf(m.from)} ${words.to} ${this.nameOf(m.to)}, ${words[kind]}${group ? `, ${words[group.kind]}${group.label ? ` ${group.label}` : ""}` : ""}</span>
                        </button>
                      </li>`;
                    })}
                  </ol>`
                : html`<p class="ui-aseq__empty">${words.empty}</p>`}
            </div>
          </div>
        </div>
        <div class="ui-aseq__detail" id=${`${this.uid}-detail`} ?hidden=${!open} role="region" aria-labelledby=${`${this.uid}-detail-title`}>
          ${open
            ? html`<div class="ui-aseq__detail-head">
                  <h4 class="ui-aseq__detail-title" id=${`${this.uid}-detail-title`}>${"label" in open ? open.label : open.name}</h4>
                  <button type="button" class="ui-aseq__close" @click=${() => this.close()}>${closeIcon}<span class="tc-sr-only">${words.close}</span></button>
                </div>
                ${"label" in open ? this.messageDetails(open) : this.participantDetails(open)}`
            : nothing}
        </div>
        <span class="tc-sr-only" id=${`${this.uid}-keys`}>${words.keys}</span>
        <span class="tc-sr-only" role="status">${this.message}</span>
      </div>`;
  }

  static override css = /* css */ `
[data-ui="aseq"] {
  box-sizing: border-box;
  display: block;
  min-width: 0;
  width: 100%;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  -webkit-font-smoothing: antialiased;
  container-type: inline-size;
  --tc-aseq-col: 9rem;
  --tc-aseq-row: 44px;
  --tc-aseq-max-h: 30rem;
  --tc-aseq-bar-w: 8px;
  --tc-aseq-nest: 4px;
  --tc-aseq-line-y: 30px;
  --tc-aseq-head: 4px;
  --tc-aseq-call: var(--tc-text-primary);
  --tc-aseq-reply: var(--tc-text-muted);
  --tc-aseq-error: var(--tc-status-danger-fg);
  --tc-aseq-lifeline: var(--tc-border-default);
  --tc-aseq-activation: light-dark(color-mix(in oklab, var(--tc-accent) 22%, var(--tc-surface-raised)), color-mix(in oklab, var(--tc-accent) 38%, var(--tc-surface-raised)));
}
[data-ui="aseq"] *, [data-ui="aseq"] *::before, [data-ui="aseq"] *::after { box-sizing: border-box; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="aseq"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
:where([data-look="standard"], [data-look="standard"] *)[data-ui="aseq"] .ui-aseq__card {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
  --tc-aseq-surface: var(--tc-surface-on-tray);
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="aseq"] {
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
.ui-aseq__card { --tc-aseq-surface: var(--tc-surface-raised); overflow: hidden; }
.ui-aseq__count { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); font-variant-numeric: tabular-nums; }
.ui-aseq__scroll { max-height: var(--tc-aseq-max-h); overflow: auto; overscroll-behavior: contain; }
.ui-aseq__grid { position: relative; min-width: calc(var(--tc-aseq-n) * var(--tc-aseq-col)); padding-bottom: var(--tc-space-3); }
.ui-aseq__heads {
  position: sticky;
  top: 0;
  z-index: 3;
  display: grid;
  grid-template-columns: repeat(var(--tc-aseq-n), minmax(0, 1fr));
  border-bottom: var(--tc-hairline) solid var(--tc-divider);
  background: var(--tc-aseq-surface);
}
.ui-aseq__head {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--tc-space-1-5);
  min-width: 0;
  min-height: var(--tc-control-h-lg);
  margin: 0;
  padding: var(--tc-space-2) var(--tc-space-1-5);
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.ui-aseq__head:hover { background: var(--tc-fill-hover); }
.ui-aseq__head:focus-visible, .ui-aseq__msg:focus-visible, .ui-aseq__close:focus-visible { outline: var(--tc-focus-outline); outline-offset: calc(var(--tc-focus-ring-width) * -1); }
.ui-aseq__head[aria-expanded="true"] { background: var(--tc-fill-selected); }
.ui-aseq__avatar { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); border-radius: var(--tc-radius-md); background: var(--tc-fill-default); color: var(--tc-icon-muted); }
.ui-aseq__head[data-kind="agent"] .ui-aseq__avatar { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-aseq__head[data-kind="user"] .ui-aseq__avatar { border-radius: 50%; }
.ui-aseq__avatar > :is(svg, img) { width: var(--tc-space-4); height: var(--tc-space-4); }
.ui-aseq__glyph { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-aseq__who { display: grid; min-width: 0; }
.ui-aseq__name { overflow: hidden; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); text-overflow: ellipsis; white-space: nowrap; }
.ui-aseq__role { overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); text-overflow: ellipsis; white-space: nowrap; }
.ui-aseq__head[data-working] .ui-aseq__role { color: var(--tc-status-info-fg); }
.ui-aseq__body { position: relative; min-height: calc(max(var(--tc-aseq-rows), 2) * var(--tc-aseq-row)); padding-top: var(--tc-space-2); }
.ui-aseq__lanes { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(var(--tc-aseq-n), minmax(0, 1fr)); pointer-events: none; }
.ui-aseq__lane { position: relative; }
.ui-aseq__lane::before { content: ""; position: absolute; inset-block: 0; left: 50%; border-left: var(--tc-hairline) dashed var(--tc-aseq-lifeline); }
.ui-aseq__active {
  position: absolute;
  top: calc(var(--tc-space-2) + var(--tc-aseq-from) * var(--tc-aseq-row) + var(--tc-aseq-line-y));
  left: calc(50% - var(--tc-aseq-bar-w) / 2 + var(--tc-aseq-depth) * var(--tc-aseq-nest));
  width: var(--tc-aseq-bar-w);
  height: calc(var(--tc-aseq-span) * var(--tc-aseq-row));
  min-height: var(--tc-space-2);
  border: var(--tc-hairline) solid var(--tc-accent);
  border-radius: var(--tc-radius-2xs);
  background: var(--tc-aseq-activation);
}
.ui-aseq__active[data-open] { border-bottom-style: dashed; }
.ui-aseq__frame {
  position: absolute;
  top: calc(var(--tc-space-2) + var(--tc-aseq-from) * var(--tc-aseq-row) + var(--tc-space-0-5));
  left: calc(var(--tc-aseq-left) / var(--tc-aseq-n) * 100% + var(--tc-space-2));
  width: calc(var(--tc-aseq-cols) / var(--tc-aseq-n) * 100% - var(--tc-space-4));
  height: calc(var(--tc-aseq-span) * var(--tc-aseq-row) - var(--tc-space-1));
  border: var(--tc-hairline) solid var(--tc-border-strong);
  border-radius: var(--tc-radius-md);
  pointer-events: none;
}
.ui-aseq__frame[data-kind="retry"] { border-color: var(--tc-status-warning-border); border-style: dashed; }
.ui-aseq__frame-tag {
  position: absolute;
  top: 0;
  left: 0;
  padding: 0 var(--tc-space-1-5);
  border-right: var(--tc-hairline) solid var(--tc-border-strong);
  border-bottom: var(--tc-hairline) solid var(--tc-border-strong);
  border-radius: var(--tc-radius-md) 0 var(--tc-radius-sm) 0;
  background: var(--tc-aseq-surface);
  color: var(--tc-text-secondary);
  font-size: var(--tc-font-size-2xs);
  font-weight: var(--tc-font-weight-medium);
  white-space: nowrap;
}
.ui-aseq__frame[data-kind="retry"] .ui-aseq__frame-tag { border-color: var(--tc-status-warning-border); color: var(--tc-status-warning-fg); }
.ui-aseq__msgs { position: relative; z-index: 1; margin: 0; padding: 0; list-style: none; }
.ui-aseq__row { display: block; }
.ui-aseq__msg {
  display: grid;
  grid-template-columns: repeat(var(--tc-aseq-n), minmax(0, 1fr));
  width: 100%;
  height: var(--tc-aseq-row);
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: var(--tc-radius-sm);
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
.ui-aseq__msg:hover { background: var(--tc-fill-subtle); }
.ui-aseq__msg[aria-expanded="true"] { background: var(--tc-fill-selected); }
.ui-aseq__row[data-kind="call"] { --tc-aseq-ink: var(--tc-aseq-call); }
.ui-aseq__row[data-kind="reply"] { --tc-aseq-ink: var(--tc-aseq-reply); }
.ui-aseq__row[data-kind="error"] { --tc-aseq-ink: var(--tc-aseq-error); }
.ui-aseq__arrow { position: relative; display: block; min-width: 0; height: 100%; margin-inline: calc(50% / var(--tc-aseq-span-cols)); }
.ui-aseq__arrow[data-dir="self"] { margin-inline: 50% 0; }
.ui-aseq__line { position: absolute; top: var(--tc-aseq-line-y); left: 0; right: 0; border-top: var(--tc-hairline) solid var(--tc-aseq-ink); color: var(--tc-aseq-ink); }
.ui-aseq__row[data-kind="reply"] .ui-aseq__line { border-top-style: dashed; }
/* The head: two short strokes meeting at the end the message goes to */
.ui-aseq__line::after { content: ""; position: absolute; top: calc(var(--tc-aseq-head) * -1 - 0.5px); width: calc(var(--tc-aseq-head) * 2); height: calc(var(--tc-aseq-head) * 2); border-top: var(--tc-hairline) solid currentColor; border-right: var(--tc-hairline) solid currentColor; }
.ui-aseq__arrow[data-dir="right"] .ui-aseq__line::after { right: 0; transform: translateX(-1px) rotate(45deg); }
.ui-aseq__arrow[data-dir="left"] .ui-aseq__line::after { left: 0; transform: translateX(1px) rotate(-135deg); }
.ui-aseq__arrow[data-dir="self"] .ui-aseq__line { top: calc(var(--tc-aseq-line-y) - var(--tc-space-3)); right: 40%; height: var(--tc-space-3); border: var(--tc-hairline) solid var(--tc-aseq-ink); border-left: 0; border-radius: 0 var(--tc-radius-sm) var(--tc-radius-sm) 0; }
.ui-aseq__arrow[data-dir="self"] .ui-aseq__line::after { top: auto; bottom: calc(var(--tc-aseq-head) * -1 - 0.5px); left: 0; transform: translateX(1px) rotate(-135deg); }
.ui-aseq__label {
  position: absolute;
  bottom: calc(var(--tc-aseq-row) - var(--tc-aseq-line-y) + var(--tc-space-1));
  left: 50%;
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1);
  max-width: calc(100% - var(--tc-space-2));
  overflow: hidden;
  padding: 0 var(--tc-space-1-5);
  border: var(--tc-hairline) solid color-mix(in oklab, var(--tc-aseq-ink) 35%, transparent);
  border-radius: var(--tc-radius-badge);
  background: var(--tc-aseq-surface);
  color: var(--tc-aseq-ink);
  font-size: var(--tc-font-size-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
  transform: translateX(-50%);
}
.ui-aseq__arrow[data-dir="self"] .ui-aseq__label { left: 0; transform: none; bottom: calc(var(--tc-aseq-row) - var(--tc-aseq-line-y) + var(--tc-space-3) + var(--tc-space-1)); }
.ui-aseq__row[data-kind="reply"] .ui-aseq__label { color: var(--tc-text-secondary); }
.ui-aseq__fail { flex: none; width: var(--tc-space-2-5); height: var(--tc-space-2-5); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
.ui-aseq__failed { font-weight: var(--tc-font-weight-medium); }
/* A new message draws across from its sender, with a light at the tip, and its tag follows */
.ui-aseq__row[data-new] .ui-aseq__line { animation: tc-aseq-draw var(--tc-duration-slow) var(--tc-ease-out) both; }
.ui-aseq__arrow[data-dir="right"] .ui-aseq__line { transform-origin: left center; }
.ui-aseq__arrow[data-dir="left"] .ui-aseq__line { transform-origin: right center; }
.ui-aseq__row[data-new] .ui-aseq__line::before {
  content: "";
  position: absolute;
  top: calc(var(--tc-space-1) * -1);
  width: var(--tc-space-2);
  height: var(--tc-space-2);
  border-radius: 50%;
  background: var(--tc-accent);
  box-shadow: 0 0 var(--tc-space-2) var(--tc-accent);
  animation: tc-aseq-tip var(--tc-duration-slow) var(--tc-ease-out) both;
}
.ui-aseq__arrow[data-dir="right"] .ui-aseq__line::before { right: calc(var(--tc-space-1) * -1); }
.ui-aseq__arrow[data-dir="left"] .ui-aseq__line::before { left: calc(var(--tc-space-1) * -1); }
.ui-aseq__row[data-new] .ui-aseq__label { animation: tc-aseq-tag var(--tc-duration-slow) var(--tc-ease-out) both; }
@keyframes tc-aseq-draw { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes tc-aseq-tip { 0% { opacity: 1; } 70% { opacity: 1; } 100% { opacity: 0; } }
@keyframes tc-aseq-tag { from { opacity: 0; } to { opacity: 1; } }
.ui-aseq__empty { margin: 0; padding: var(--tc-space-6) var(--tc-space-3); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); text-align: center; }
.ui-aseq__detail { margin: 0 var(--tc-space-3) var(--tc-space-3); padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-surface-sunken); font-size: var(--tc-font-size-sm); }
.ui-aseq__detail[hidden] { display: none; }
.ui-aseq__detail-head { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--tc-space-2); }
.ui-aseq__detail-title { margin: 0; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-semibold); overflow-wrap: anywhere; }
.ui-aseq__detail-sub { margin: var(--tc-space-0-5) 0 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-aseq__close { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); margin: calc(var(--tc-space-1) * -1) calc(var(--tc-space-1) * -1) 0 0; padding: 0; border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: var(--tc-icon-muted); cursor: pointer; }
.ui-aseq__close:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-aseq__close svg { width: var(--tc-space-4); height: var(--tc-space-4); }
.ui-aseq__facts { display: grid; grid-template-columns: repeat(auto-fill, minmax(6.5rem, 1fr)); gap: var(--tc-space-1) var(--tc-space-3); margin: var(--tc-space-2) 0 0; }
.ui-aseq__facts div { display: grid; min-width: 0; }
.ui-aseq__facts dt { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-aseq__facts dd { margin: 0; font-variant-numeric: tabular-nums; }
.ui-aseq__io { margin: var(--tc-space-2) 0 0; color: var(--tc-text-secondary); overflow-wrap: anywhere; }
.ui-aseq__io[data-failed] { color: var(--tc-status-danger-fg); }
.ui-aseq__io-label { display: block; color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
@media (prefers-reduced-motion: reduce) {
  .ui-aseq__row[data-new] .ui-aseq__line, .ui-aseq__row[data-new] .ui-aseq__line::before, .ui-aseq__row[data-new] .ui-aseq__label { animation: none; }
}
@media (forced-colors: active) {
  .ui-aseq__line { border-top-color: CanvasText; color: CanvasText; }
  .ui-aseq__active { border-color: Highlight; background: Canvas; }
  .ui-aseq__label { border-color: CanvasText; }
}
`;
}

if (!customElements.get("tc-agent-sequence")) customElements.define("tc-agent-sequence", TcAgentSequence);
declare global {
  interface HTMLElementTagNameMap {
    "tc-agent-sequence": TcAgentSequence;
  }
}
