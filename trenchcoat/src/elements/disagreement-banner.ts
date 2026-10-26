import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import { diffWords, type DiffSegment } from "./inline-diff";

/*
 * <tc-disagreement-banner> – today's answer contradicts an earlier answer to the same question. The two sit side by
 * side, the earlier on the left, with the difference highlighted word by word (Inline Diff's diffWords, as in Run
 * Compare): words only the earlier answer had are struck through on red, words only today's has are underlined on
 * green, and pointing at one lights up its counterpart.
 *   · long answers show only the changes, with a few words of context around each; "Show full answers" opens both
 *   · "Open earlier session" (with `can-open`) and Dismiss (with `dismissible`) are events
 * Standard is a gray tray with the comparison on a white card; Clean is one white card with hairline dividers.
 * Narrow, the two answers stack: earlier above today's.
 *
 *   <tc-disagreement-banner question="Can we end the contract early?" .earlier=${a} .current=${b} dismissible></tc-disagreement-banner>
 *
 * `expanded` changes with a cancelable tc-expanded-change. Dismiss fires a cancelable tc-dismiss; unless prevented,
 * the banner sets `dismissed` and shows nothing.
 */

/** One of the two answers */
export type DisagreementAnswer = {
  /** The answer's text – diffed word by word against the other */
  text: string;
  /** What the column is called – defaults to "Earlier" and "Today" */
  label?: string;
  /** When it was given, ready to show, e.g. "Oct 12" */
  when?: string;
  /** The session it came from – passed back with tc-open-session */
  sessionId?: string;
};
export type DisagreementExpandedChange = { expanded: boolean };
/** The detail of tc-open-session: the earlier answer and its session */
export type DisagreementOpenSession = { sessionId: string | undefined; answer: DisagreementAnswer };

/** A run of shared words shortened to its ends: `context` words either side of a change, "…" between */
type Piece = { type: "equal"; text: string; cut: "none" | "start" | "end" | "middle"; head: string; tail: string } | { type: "change"; remove: string; insert: string };

/** Keeps `n` words at the ends of a run of shared text that touch a change; the rest becomes "…" */
function trim(seg: string, n: number, first: boolean, last: boolean): Piece {
  const toks = seg.split(/(\s+)/);
  const words = toks.filter((t) => t && !/^\s+$/.test(t)).length;
  if (first && last) return { type: "equal", text: seg, cut: "none", head: seg, tail: "" };
  const keepHead = first ? 0 : n;
  const keepTail = last ? 0 : n;
  if (words <= keepHead + keepTail + 2) return { type: "equal", text: seg, cut: "none", head: seg, tail: "" };
  const isWord = (t: string) => !!t && !/^\s+$/.test(t);
  const ends = (t: string) => /[.!?;:]["”’)]*$/.test(t);
  const take = (count: number, from: "start" | "end") => {
    const list = from === "start" ? toks : [...toks].reverse();
    let seen = 0;
    let i = 0;
    // Where a sentence ends inside the window, cut there – the excerpt reads as whole sentences
    let cut = -1;
    for (; i < list.length && seen < count; i++) {
      if (!isWord(list[i])) continue;
      seen++;
      if (from === "start" && ends(list[i])) {
        cut = i + 1;
        break;
      }
      if (from === "end" && seen < count && i + 2 < list.length && ends(list[i + 2])) cut = i + 1;
    }
    const part = list.slice(0, cut > 0 ? cut : i);
    return from === "start" ? part.join("") : part.reverse().join("");
  };
  const head = take(keepHead, "start");
  const tail = take(keepTail, "end");
  return { type: "equal", text: seg, cut: first ? "start" : last ? "end" : "middle", head, tail };
}

/** The diff with long shared runs shortened, so the changes stand out */
function excerpt(segs: DiffSegment[], n: number): Piece[] {
  return segs.map((s, i) => (s.type === "change" ? s : trim(s.text, n, i === 0, i === segs.length - 1)));
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
/* Two arrows parting – the answers went separate ways */
const splitMark = html`<svg class="ui-dsb__mark-svg" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M16 3h5v5M8 3H3v5M12 22v-8.3a4 4 0 0 0-1.17-2.83L3 3M15 9l6-6"></path>`}</svg>`;
const closeIcon = html`<svg class="ui-dsb__glyph" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M7 7l10 10M17 7 7 17"></path>`}</svg>`;
const historyIcon = html`<svg class="ui-dsb__glyph" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5M12 7v5l4 2"></path>`}</svg>`;
const chevron = html`<svg class="ui-dsb__glyph ui-dsb__chevron" viewBox="0 0 24 24" aria-hidden="true">${svg`<path d="m6 9 6 6 6-6"></path>`}</svg>`;

let instances = 0;

/**
 * Today's answer and an earlier answer to the same question side by side, the difference highlighted, with dismiss
 * and open-the-earlier-session.
 * @tag tc-disagreement-banner
 * @fires tc-expanded-change - "Show full answers" or "Show changes only" was pressed; detail `{ expanded }`: DisagreementExpandedChange. Cancelable.
 * @fires tc-dismiss - Dismiss was pressed (with `dismissible`); detail `null`. Cancelable: preventDefault() keeps the banner.
 * @fires tc-open-session - "Open earlier session" was pressed (with `can-open`); detail `{ sessionId, answer }`: DisagreementOpenSession.
 */
export class TcDisagreementBanner extends TcElement {
  static override ui = "dsb";

  /** The earlier answer – on the left */
  @property({ attribute: false }) accessor earlier: DisagreementAnswer | undefined = undefined;
  /** Today's answer – on the right */
  @property({ attribute: false }) accessor current: DisagreementAnswer | undefined = undefined;
  /** The question both answers were given to, shown under the heading */
  @property() accessor question = "";
  /** The heading */
  @property() accessor heading = "This answer differs from an earlier one";
  /** A line from your product on what changed, e.g. "The notice period went from 30 to 60 days" */
  @property() accessor summary = "";
  /** Shows both answers in full; unset, long answers show only the changes and the words around them */
  @property({ type: Boolean, reflect: true }) accessor expanded = false;
  /** How many shared words to keep either side of a change while not expanded */
  @property({ type: Number }) accessor context = 8;
  /** Shows Dismiss (fires tc-dismiss) */
  @property({ type: Boolean }) accessor dismissible = false;
  /** Shows "Open earlier session" (fires tc-open-session) */
  @property({ type: Boolean, attribute: "can-open" }) accessor canOpen = false;
  /** Dismissed: the banner shows nothing */
  @property({ type: Boolean, reflect: true }) accessor dismissed = false;

  /** @internal The change pointed at, by its index – both sides light up */
  @state() accessor hot: number | null = null;
  /** @internal What the status region says */
  @state() accessor announce = "";

  private readonly uid = `tc-dsb${++instances}`;
  private segs: DiffSegment[] = [];
  private ownName = false;

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    this.ownName ||= this.hasAttribute("aria-label") || (this.hasAttribute("aria-labelledby") && this.getAttribute("aria-labelledby") !== `${this.uid}-title`);
    if (!this.ownName) this.setAttribute("aria-labelledby", `${this.uid}-title`);
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    // Dismissed, the host has nothing to name: no group role, no pointer to a heading that's gone
    if (changed.has("dismissed") && !this.ownName) {
      if (this.dismissed) {
        this.removeAttribute("role");
        this.removeAttribute("aria-labelledby");
      } else {
        this.setAttribute("role", "group");
        this.setAttribute("aria-labelledby", `${this.uid}-title`);
      }
    }
    if (changed.has("earlier") || changed.has("current")) {
      this.segs = diffWords(this.earlier?.text ?? "", this.current?.text ?? "");
      this.hot = null;
    }
  }

  /** @internal How many places the answers differ */
  get changes() {
    return this.segs.reduce((k, s) => k + (s.type === "change" ? 1 : 0), 0);
  }

  /** @internal Whether shortening hides anything – only then is there a toggle */
  private get shortens() {
    return excerpt(this.segs, this.context).some((p) => p.type === "equal" && p.cut !== "none");
  }

  private toggle() {
    const next = !this.expanded;
    if (this.emit<DisagreementExpandedChange>("tc-expanded-change", { expanded: next }, { cancelable: true })) this.expanded = next;
  }

  private dismiss() {
    if (!this.emit("tc-dismiss", null, { cancelable: true })) return;
    const had = this.contains(document.activeElement);
    this.dismissed = true;
    this.announce = "Dismissed";
    // The banner empties: focus stays on it rather than dropping to the page
    if (had) {
      this.setAttribute("tabindex", "-1");
      this.focus({ preventScroll: true });
    }
  }

  /** @internal One side of the diff: shared words, plus what only this side has */
  private side(side: "earlier" | "current"): TemplateResult {
    const a = side === "earlier" ? this.earlier : this.current;
    if (!a?.text) return html`<p class="ui-dsb__text" data-empty>No answer</p>`;
    const pieces: Piece[] = this.expanded ? this.segs.map((s) => (s.type === "change" ? s : { type: "equal", text: s.text, cut: "none", head: s.text, tail: "" })) : excerpt(this.segs, this.context);
    const hot = this.hot;
    let ci = -1;
    return html`<p class="ui-dsb__text">${pieces.map((p) => {
      if (p.type === "equal") {
        if (p.cut === "none") return p.text;
        const gap = html`<span class="ui-dsb__gap"><span aria-hidden="true">…</span><span class="ui-dsb__sr">(shared words left out)</span></span>`;
        return p.cut === "start" ? html`${gap} ${p.tail.replace(/^\s+/, "")}` : p.cut === "end" ? html`${p.head.replace(/\s+$/, "")} ${gap}` : html`${p.head.replace(/\s+$/, "")} ${gap} ${p.tail.replace(/^\s+/, "")}`;
      }
      ci++;
      const i = ci;
      const text = side === "earlier" ? p.remove : p.insert;
      if (!text) return html`<span class="ui-dsb__hole" data-chg=${i} ?data-hot=${hot === i}></span>`;
      const enter = () => (this.hot = i);
      const leave = () => this.hot === i && (this.hot = null);
      return side === "earlier"
        ? html`<del class="ui-dsb__del" data-chg=${i} ?data-hot=${hot === i} @mouseenter=${enter} @mouseleave=${leave}>${text}</del>`
        : html`<ins class="ui-dsb__ins" data-chg=${i} ?data-hot=${hot === i} @mouseenter=${enter} @mouseleave=${leave}>${text}</ins>`;
    })}</p>`;
  }

  /** @internal A column's head: its label and when */
  private label(side: "earlier" | "current") {
    const a = side === "earlier" ? this.earlier : this.current;
    const name = a?.label ?? (side === "earlier" ? "Earlier" : "Today");
    return html`<span class="ui-dsb__side" data-side=${side}><span class="ui-dsb__dot" aria-hidden="true"></span><span class="ui-dsb__name">${name}</span>${a?.when ? html`<span class="ui-dsb__when">${a.when}</span>` : nothing}</span>`;
  }

  protected override render() {
    if (this.dismissed) return html`<span class="ui-dsb__sr" role="status">${this.announce}</span>`;
    const n = this.changes;
    const titleId = `${this.uid}-title`;
    const shortens = this.shortens;
    const openable = this.canOpen && !!this.earlier;
    return html`
      <div class="ui-dsb__bar">
        <span class="ui-dsb__mark">${splitMark}</span>
        <span class="ui-dsb__head">
          <span class="ui-dsb__title" id=${titleId}>${this.heading}</span>
          ${this.question ? html`<span class="ui-dsb__question"><span class="ui-dsb__sr">Question: </span>“${this.question}”</span>` : nothing}
        </span>
        <span class="ui-dsb__count">${n === 0 ? "Same answer" : plural(n, "difference")}</span>
        ${this.dismissible ? html`<button type="button" class="ui-dsb__icon" aria-label="Dismiss" title="Dismiss" @click=${() => this.dismiss()}>${closeIcon}</button>` : nothing}
      </div>
      <div class="ui-dsb__card">
        <div class="ui-dsb__pair" id=${`${this.uid}-pair`} @mouseleave=${() => (this.hot = null)}>
          <div class="ui-dsb__cell" data-side="earlier">${this.label("earlier")}${this.side("earlier")}</div>
          <div class="ui-dsb__cell" data-side="current">${this.label("current")}${this.side("current")}</div>
        </div>
        ${this.summary || shortens || openable
          ? html`<div class="ui-dsb__foot">
              ${this.summary ? html`<p class="ui-dsb__summary">${this.summary}</p>` : nothing}
              <span class="ui-dsb__acts">
                ${shortens
                  ? html`<button type="button" class="ui-dsb__btn ui-dsb__btn--ghost" aria-expanded=${this.expanded ? "true" : "false"} aria-controls=${`${this.uid}-pair`} @click=${() => this.toggle()}>
                      ${this.expanded ? "Show changes only" : "Show full answers"}${chevron}
                    </button>`
                  : nothing}
                ${openable
                  ? html`<button type="button" class="ui-dsb__btn ui-dsb__btn--secondary" @click=${() => this.emit<DisagreementOpenSession>("tc-open-session", { sessionId: this.earlier!.sessionId, answer: this.earlier! })}>
                      ${historyIcon}Open earlier session
                    </button>`
                  : nothing}
              </span>
            </div>`
          : nothing}
      </div>
      <span class="ui-dsb__sr" role="status">${this.announce}</span>
    `;
  }

  static override css = /* css */ `
[data-ui="dsb"] {
  /* Struck words and a pointed-at change: run-compare's colours */
  --tc-disagreement-banner-strike: light-dark(rgba(180, 35, 24, 0.55), rgba(255, 138, 128, 0.6));
  --tc-disagreement-banner-del-hot: light-dark(rgba(220, 60, 60, 0.2), rgba(240, 90, 90, 0.28));
  --tc-disagreement-banner-ins-hot: light-dark(rgba(34, 160, 90, 0.22), rgba(60, 200, 120, 0.28));
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  letter-spacing: -0.006em;
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  container: ui-dsb / inline-size;
  animation: ui-dsb-in var(--tc-duration-slow) var(--tc-ease-move) both;
}
/* Clean: no tray – one white card with hairline dividers */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="dsb"] {
  --tc-disagreement-banner-strike: light-dark(rgba(229, 72, 77, 0.6), rgba(255, 120, 120, 0.7));
  padding: 0;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  letter-spacing: normal;
}
/* Dismissed: nothing to see, only the status line for screen readers */
[data-ui="dsb"][dismissed] { padding: 0; background: none; box-shadow: none; animation: none; }
[data-ui="dsb"]:focus { outline: none; }
[data-ui="dsb"] *, [data-ui="dsb"] *::before, [data-ui="dsb"] *::after { box-sizing: border-box; }
[data-ui="dsb"] svg { display: block; flex: none; }
:where([data-ui="dsb"]) p { margin: 0; }
:where([data-ui="dsb"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; letter-spacing: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="dsb"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-dsb__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* ----- The header: the mark, the heading, the question, the count and Dismiss ----- */
.ui-dsb__bar { display: flex; align-items: flex-start; gap: var(--tc-space-2); min-width: 0; padding: var(--tc-space-2) var(--tc-space-1-5) var(--tc-space-2-5) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-dsb__bar { padding: var(--tc-space-3) var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-dsb__mark { display: grid; flex: none; place-items: center; width: 22px; height: 22px; border-radius: var(--tc-radius-sm); background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }
.ui-dsb__mark-svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-dsb__mark-svg { stroke-width: 1.7; }
.ui-dsb__head { display: grid; flex: 1; gap: var(--tc-space-0-5); min-width: 0; }
.ui-dsb__title { font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-strong); text-wrap: pretty; }
:where([data-look="clean"], [data-look="clean"] *).ui-dsb__title { font-weight: var(--tc-font-weight-medium); }
.ui-dsb__question { min-width: 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); overflow-wrap: anywhere; }
.ui-dsb__count { flex: none; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-status-warning-bg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); color: var(--tc-status-warning-fg); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-dsb__icon { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); margin-top: calc(-1 * var(--tc-space-1)); border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="dsb"] .ui-dsb__icon:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-dsb__glyph { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-dsb__glyph { stroke-width: 1.5; }
/* ----- The card: the two answers side by side ----- */
.ui-dsb__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-dsb__card { border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); background: none; box-shadow: none; }
.ui-dsb__pair { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
.ui-dsb__cell { display: grid; align-content: start; gap: var(--tc-space-1-5); min-width: 0; padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-3-5); }
.ui-dsb__cell + .ui-dsb__cell { border-left: var(--tc-hairline) solid var(--tc-divider); }
.ui-dsb__side { display: flex; align-items: center; gap: var(--tc-space-1-5); min-width: 0; font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-muted); white-space: nowrap; }
.ui-dsb__dot { flex: none; width: 6px; height: 6px; border-radius: var(--tc-radius-full); background: var(--tc-status-danger-solid); }
.ui-dsb__side[data-side="current"] .ui-dsb__dot { background: var(--tc-status-success-solid); }
.ui-dsb__name { color: var(--tc-text-secondary); }
.ui-dsb__when { overflow: hidden; text-overflow: ellipsis; }
.ui-dsb__when::before { content: "·"; margin-right: var(--tc-space-1-5); color: var(--tc-text-disabled); }
.ui-dsb__text { color: var(--tc-text-primary); line-height: var(--tc-line-height-relaxed); white-space: pre-line; overflow-wrap: anywhere; }
.ui-dsb__text[data-empty] { color: var(--tc-text-muted); }
.ui-dsb__gap { padding: 0 var(--tc-space-0-5); border-radius: var(--tc-radius-xs); background: var(--tc-fill-default); color: var(--tc-text-muted); }
/* Words only the earlier answer has: struck through on red; only today's: underlined on green – never colour alone */
.ui-dsb__del, .ui-dsb__ins { padding: 0 var(--tc-space-0-5); border-radius: var(--tc-radius-xs); -webkit-box-decoration-break: clone; box-decoration-break: clone; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-dsb__del { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); text-decoration: line-through; text-decoration-color: var(--tc-disagreement-banner-strike); text-decoration-thickness: 1px; }
.ui-dsb__ins { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); text-decoration: underline; text-decoration-color: var(--tc-status-success-solid); text-decoration-thickness: 1px; text-underline-offset: 3px; }
:where([data-look="clean"], [data-look="clean"] *).ui-dsb__del { color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-dsb__ins { color: var(--tc-text-primary); }
.ui-dsb__del[data-hot] { background: var(--tc-disagreement-banner-del-hot); }
.ui-dsb__ins[data-hot] { background: var(--tc-disagreement-banner-ins-hot); }
/* Where the other answer has words this one lacks: a thin mark, so the place shows */
.ui-dsb__hole { display: inline-block; width: 1.5px; height: 0.9em; margin: 0 var(--tc-space-0-5); border-radius: var(--tc-radius-2xs); background: var(--tc-border-default); vertical-align: -0.15em; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-dsb__hole[data-hot] { width: 2px; background: var(--tc-text-muted); }
/* ----- The foot: what changed, the toggle and Open earlier session ----- */
.ui-dsb__foot { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-2-5) var(--tc-space-3) var(--tc-space-2-5) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-dsb__summary { flex: 1 1 220px; min-width: 0; font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); text-wrap: pretty; }
.ui-dsb__acts { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); margin-left: auto; }
.ui-dsb__btn { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move); }
.ui-dsb__btn--ghost { color: var(--tc-action-ghost-fg); }
[data-ui="dsb"] .ui-dsb__btn--ghost:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-dsb__btn--secondary { background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); }
.ui-dsb__btn--secondary .ui-dsb__glyph { width: 14px; height: 14px; color: var(--tc-icon-muted); }
[data-ui="dsb"] .ui-dsb__btn--secondary:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-dsb__btn:active { transform: scale(0.97); }
.ui-dsb__chevron { width: 14px; height: 14px; transition: transform var(--tc-duration-base) var(--tc-ease-move); }
[data-ui="dsb"][expanded] .ui-dsb__chevron { transform: rotate(180deg); }
@keyframes ui-dsb-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
/* Narrow: the two answers stack, earlier above today's */
@container ui-dsb (max-width: 520px) {
  .ui-dsb__pair { grid-template-columns: minmax(0, 1fr); }
  .ui-dsb__cell + .ui-dsb__cell { border-top: var(--tc-hairline) solid var(--tc-divider); border-left: 0; }
  .ui-dsb__cell { padding-right: var(--tc-space-3-5); padding-left: var(--tc-space-3-5); }
  .ui-dsb__foot { padding-left: var(--tc-space-3-5); }
  .ui-dsb__acts { margin-left: 0; }
}
@media (pointer: coarse) {
  .ui-dsb__btn, .ui-dsb__icon { height: var(--tc-control-h-md); }
  .ui-dsb__icon { width: var(--tc-control-h-md); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="dsb"], [data-ui="dsb"] *, [data-ui="dsb"] *::before, [data-ui="dsb"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-disagreement-banner")) customElements.define("tc-disagreement-banner", TcDisagreementBanner);

declare global {
  interface HTMLElementTagNameMap {
    "tc-disagreement-banner": TcDisagreementBanner;
  }
}
