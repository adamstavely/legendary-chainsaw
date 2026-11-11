import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { OffScreenController } from "./internal/controllers";

/*
 * <tc-judge-bracket> – how an LLM judge picks the best of several attempts at one task, drawn as a single-elimination
 * tournament. The attempts are seeded in the order given: when their number isn't a power of two the first ones get
 * a bye, and every other first-round match pairs the next two. Rounds run left to right, each match a pair of small
 * cards joined to the match it feeds; the page streams the judge's verdicts in as `verdicts` (`matches` is taken by the DOM) and the bracket fills:
 * the winner moves on along its connector, the loser steps back, and the match being judged pulses gently. The
 * champion gets a card of its own with its summary and "Use this answer".
 *
 *   <tc-judge-bracket task="Summarise the audit's key findings" .attempts=${attempts} .verdicts=${verdicts}></tc-judge-bracket>
 *
 * A match is found by its round and its two attempts, whichever way round the page names them; one that doesn't fit
 * the bracket is ignored. Picking a match opens its comparison under the bracket – both summaries, the judge's reason
 * and how confident it was. Unlike Parallel Attempts (attempts racing, scored on their own) or Answer Arena (two
 * answers rated by a person), this shows the judge comparing two at a time.
 *
 * Keyboard. The matches are one tab stop: ↑ ↓ move within a round, → goes to the match it feeds, ← to the first match
 * that fed it, Home and End to a round's first and last; Enter or Space opens or closes the comparison, Escape closes
 * it. Narrow, the rounds stack as a list under a "Round 1 → Semi-final → Final" path and the connectors go.
 * Standard: the header on the gray tray above a white card. Clean: one white card, the header its first row.
 */

export type JudgeAttempt = {
  id: string;
  /** A short name – "Attempt C" */
  label: string;
  /** The model behind it, shown under the name */
  model?: string;
  /** What it answered, in a sentence or two – shown in the comparison and on the champion's card */
  summary: string;
  /** A score the judge or a grader gave it, if any */
  score?: number;
};

export type JudgeMatch = {
  /** 1 for the first round, counting up to the final */
  round: number;
  /** The two attempts' ids, in either order */
  a: string;
  b: string;
  /** The id of the attempt the judge preferred; left out while it's judging */
  winner?: string;
  /** Why, in the judge's words */
  reason?: string;
  /** How sure the judge was, 0–1 */
  confidence?: number;
};

export type JudgeBracketLabels = {
  round: (n: number) => string;
  final: string;
  semiFinal: string;
  quarterFinal: string;
  bye: string;
  waiting: string;
  upNext: string;
  judging: string;
  champion: string;
  championWaiting: string;
  use: string;
  inUse: string;
  picked: string;
  reason: string;
  close: string;
};

export const defaultJudgeBracketLabels: JudgeBracketLabels = {
  round: (n) => `Round ${n}`,
  final: "Final",
  semiFinal: "Semi-final",
  quarterFinal: "Quarter-final",
  bye: "Bye",
  waiting: "Waiting",
  upNext: "Up next",
  judging: "Judging…",
  champion: "Champion",
  championWaiting: "The best answer appears here once the final is judged",
  use: "Use this answer",
  inUse: "In use",
  picked: "Picked",
  reason: "The judge's reason",
  close: "Close",
};

/** tc-match-change: the match now open (its key, "<round>-<match>", both from 1), or null */
export type JudgeMatchChange = { match: string | null; item?: JudgeMatch };
/** tc-accept: the champion was chosen */
export type JudgeAccept = { id: string; attempt: JudgeAttempt };

export type JudgeSlotState = "bye" | "waiting" | "upcoming" | "judging" | "decided";

/** One place in the bracket, worked out from the attempts and the matches */
export type JudgeSlot = {
  /** "<round>-<match>", both from 1 */
  key: string;
  round: number;
  index: number;
  a: string | null;
  b: string | null;
  match?: JudgeMatch;
  winner: string | null;
  state: JudgeSlotState;
};

/** The bracket as rounds of slots: seeding, byes, who meets whom and who won, from the attempts and the matches */
export function buildBracket(attempts: readonly JudgeAttempt[], matches: readonly JudgeMatch[]): JudgeSlot[][] {
  const n = Math.min(16, attempts.length);
  if (n < 2) return [];
  const size = 2 ** Math.ceil(Math.log2(n));
  const rounds = Math.log2(size);
  const byes = size - n;
  const out: JudgeSlot[][] = [];
  const find = (round: number, a: string, b: string) =>
    matches.find((m) => m.round === round && ((m.a === a && m.b === b) || (m.a === b && m.b === a)));
  for (let r = 1; r <= rounds; r++) {
    const count = size / 2 ** r;
    const row: JudgeSlot[] = [];
    for (let i = 0; i < count; i++) {
      let a: string | null;
      let b: string | null;
      let bye = false;
      if (r === 1) {
        if (i < byes) {
          a = attempts[i].id;
          b = null;
          bye = true;
        } else {
          a = attempts[byes + 2 * (i - byes)].id;
          b = attempts[byes + 2 * (i - byes) + 1].id;
        }
      } else {
        a = out[r - 2][2 * i].winner;
        b = out[r - 2][2 * i + 1].winner;
      }
      const match = !bye && a && b ? find(r, a, b) : undefined;
      const winner = bye ? a : match?.winner && (match.winner === a || match.winner === b) ? match.winner : null;
      const state: JudgeSlotState = bye ? "bye" : !a || !b ? "waiting" : winner ? "decided" : match ? "judging" : "upcoming";
      row.push({ key: `${r}-${i + 1}`, round: r, index: i, a, b, match, winner, state });
    }
    out.push(row);
  }
  return out;
}

/* Geometry of the wide layout, px – the cards are one line of name and one of model, so their height is fixed */
const COL = 200;
const GAP = 48;
const CARD = 46;
const INNER = 4;
const MATCH = CARD * 2 + INNER;
const PITCH = MATCH + 20;
const HEAD = 30;
const CHAMP = 232;

/* trophy: Lucide (ISC, lucide.dev) */
const TROPHY = svg`<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>`;
/* check, x: Lucide (ISC, lucide.dev) */
const CHECK = svg`<path d="M20 6 9 17l-5-5"/>`;
const CLOSE = svg`<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`;
const glyph = (paths: TemplateResult, cls: string) =>
  html`<svg class=${cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

let instances = 0;

/**
 * An LLM judge picking the best of several attempts as a single-elimination bracket – rounds of matches that fill as
 * verdicts stream in, a comparison of any match with the judge's reason and confidence, and the champion to use.
 * @tag tc-judge-bracket
 * @fires tc-match-change - A match was opened or closed ({ match, item }: JudgeMatchChange); cancelable – prevented, `match` stays as it was
 * @fires tc-accept - "Use this answer" was chosen on the champion ({ id, attempt }: JudgeAccept); cancelable – prevented, `accepted` isn't set
 */
export class TcJudgeBracket extends TcElement {
  static override ui = "jbk";

  /** The heading */
  @property() accessor heading = "Judge's bracket";
  /** What every attempt tried to do – the quiet line under the heading */
  @property() accessor task = "";
  /** The attempts, 2 to 16, in seeding order – the first ones get the byes */
  @property({ attribute: false }) accessor attempts: JudgeAttempt[] = [];
  /** The judge's matches so far – one verdict per match – streamed in as they're judged (`matches` is the DOM's) */
  @property({ attribute: false }) accessor verdicts: JudgeMatch[] = [];
  /** The match whose comparison is open – its key, "<round>-<match>" (both from 1) – or null */
  @property() accessor match: string | null = null;
  /** The id of the attempt in use, once "Use this answer" was chosen */
  @property() accessor accepted: string | null = null;
  /** Words the page can rename, merged over defaultJudgeBracketLabels */
  @property({ attribute: false }) accessor labels: Partial<JudgeBracketLabels> = {};

  /** @internal The match that holds the tab stop */
  @state() accessor activeKey = "";
  /** @internal The polite status line */
  @state() accessor status = "";

  private readonly uid = `tc-jbk${++instances}`;
  /** Keys decided at the last update, to tell which were just decided (none on the first) */
  private decided: Set<string> | null = null;
  /** Keys decided by this update – they play the move-on */
  private fresh = new Set<string>();
  private focusAfter: string | null = null;

  constructor() {
    super();
    // The judging pulse pauses while the bracket is scrolled away
    new OffScreenController(this, () => this.slots.some((s) => s.state === "judging"));
  }

  private get words(): JudgeBracketLabels {
    return { ...defaultJudgeBracketLabels, ...this.labels };
  }

  private get rounds() {
    return buildBracket(this.attempts, this.verdicts);
  }

  private get slots() {
    return this.rounds.flat();
  }

  private attempt(id: string | null | undefined) {
    return id ? this.attempts.find((a) => a.id === id) : undefined;
  }

  private roundName(r: number, total: number) {
    const w = this.words;
    const fromEnd = total - r;
    return fromEnd === 0 ? w.final : fromEnd === 1 ? w.semiFinal : fromEnd === 2 && total > 3 ? w.quarterFinal : w.round(r);
  }

  private champion(rounds: JudgeSlot[][]) {
    return rounds.length ? rounds[rounds.length - 1][0].winner : null;
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("attempts") || changed.has("verdicts")) {
      const rounds = this.rounds;
      const slots = rounds.flat();
      const now = new Set(slots.filter((s) => s.state === "decided").map((s) => s.key));
      this.fresh = new Set();
      if (this.decided) {
        for (const k of now) if (!this.decided.has(k)) this.fresh.add(k);
        const news = slots.filter((s) => this.fresh.has(s.key));
        if (news.length) {
          const total = rounds.length;
          const lines = news.map((s) => {
            const win = this.attempt(s.winner)?.label ?? "";
            const lose = this.attempt(s.winner === s.a ? s.b : s.a)?.label ?? "";
            return s.round === total ? `${win} wins the bracket` : `${win} beats ${lose} in the ${this.roundName(s.round, total).toLowerCase()}`;
          });
          this.status = lines.join(". ");
        }
      }
      this.decided = now;
    }
    const keys = this.slots.map((s) => s.key);
    if (!keys.includes(this.activeKey)) this.activeKey = this.match && keys.includes(this.match) ? this.match : (keys[0] ?? "");
  }

  protected override updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (this.focusAfter !== null) {
      const key = this.focusAfter;
      this.focusAfter = null;
      (key === "champion" ? this.querySelector<HTMLElement>(".ui-jbk__use") : this.matchButton(key))?.focus();
    }
  }

  private matchButton(key: string) {
    return this.querySelector<HTMLButtonElement>(`.ui-jbk__match[data-key="${CSS.escape(key)}"]`);
  }

  /* ---------- Actions ---------- */

  private setMatch(next: string | null) {
    if (next === this.match) return;
    const item = next ? this.slots.find((s) => s.key === next)?.match : undefined;
    if (this.emit<JudgeMatchChange>("tc-match-change", { match: next, item }, { cancelable: true })) this.match = next;
  }

  private closePanel() {
    const key = this.match;
    this.setMatch(null);
    if (key && this.match === null) {
      this.activeKey = key;
      this.focusAfter = key;
    }
  }

  private accept() {
    const id = this.champion(this.rounds);
    const attempt = this.attempt(id);
    if (!id || !attempt || this.accepted === id) return;
    if (!this.emit<JudgeAccept>("tc-accept", { id, attempt }, { cancelable: true })) return;
    this.accepted = id;
    this.status = `Using ${attempt.label}`;
    this.focusAfter = "champion";
  }

  /* ---------- Keyboard ---------- */

  private onKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const from = (e.target as Element).closest<HTMLElement>(".ui-jbk__match");
    if (!from) return;
    if (e.key === "Escape" && this.match) {
      e.preventDefault();
      this.closePanel();
      return;
    }
    const rounds = this.rounds;
    const [r, i] = (from.dataset.key ?? "").split("-").map(Number);
    const row = rounds[r - 1];
    if (!row) return;
    let to: JudgeSlot | undefined;
    if (e.key === "ArrowDown") to = row[Math.min(row.length - 1, i)];
    else if (e.key === "ArrowUp") to = row[Math.max(0, i - 2)];
    else if (e.key === "Home") to = row[0];
    else if (e.key === "End") to = row[row.length - 1];
    else if (e.key === "ArrowRight") to = rounds[r]?.[Math.floor((i - 1) / 2)] ?? row[i - 1];
    else if (e.key === "ArrowLeft") to = rounds[r - 2]?.[(i - 1) * 2] ?? row[i - 1];
    else return;
    e.preventDefault();
    if (!to) return;
    this.activeKey = to.key;
    this.matchButton(to.key)?.focus();
  };

  private onFocus = (e: FocusEvent) => {
    const key = (e.target as Element).closest<HTMLElement>(".ui-jbk__match")?.dataset.key;
    if (key && key !== this.activeKey) this.activeKey = key;
  };

  /* ---------- Render ---------- */

  protected override render() {
    const rounds = this.rounds;
    const slots = rounds.flat();
    const real = slots.filter((s) => s.state !== "bye");
    const done = real.filter((s) => s.state === "decided").length;
    const total = rounds.length;
    const head = cardHead({
      icon: TROPHY,
      title: this.heading,
      subtitle: this.task || undefined,
      id: `${this.uid}-title`,
      aside: real.length ? html`<span class="ui-jbk__count"><b>${done}</b> of ${real.length} judged</span>` : nothing,
    });
    const live = html`<span class="ui-jbk__sr" role="status">${this.status}</span>`;
    if (!rounds.length) return html`${head}<div class="ui-jbk__card"><p class="ui-jbk__empty">Add two or more attempts to judge.</p></div>${live}`;

    const height = (rounds[0].length * PITCH) - (PITCH - MATCH);
    const top = (r: number, i: number): number => (r === 1 ? i * PITCH : (top(r - 1, 2 * i) + top(r - 1, 2 * i + 1)) / 2);
    const width = total * (COL + GAP) + CHAMP;
    const open = this.match ? slots.find((s) => s.key === this.match) : undefined;
    const champ = this.champion(rounds);

    return html`${head}
      <div class="ui-jbk__card">
        <ol class="ui-jbk__path" aria-hidden="true">
          ${rounds.map((_, r) => html`<li>${this.roundName(r + 1, total)}</li>`)}
        </ol>
        <div class="ui-jbk__scroll">
          <div
            class="ui-jbk__stage"
            role="group"
            aria-labelledby=${`${this.uid}-title`}
            aria-describedby=${`${this.uid}-keys`}
            style=${styleMap({ "--w": String(width), "--h": String(height + HEAD) })}
            @keydown=${this.onKey}
            @focusin=${this.onFocus}
          >
            ${this.renderWires(rounds, top)}
            ${rounds.map(
              (row, r) => html`<div class="ui-jbk__round" role="group" style=${styleMap({ "--x": String(r * (COL + GAP)) })} aria-labelledby=${`${this.uid}-r${r + 1}`}>
                <h4 class="ui-jbk__rname" id=${`${this.uid}-r${r + 1}`}>${this.roundName(r + 1, total)}</h4>
                <ol class="ui-jbk__matches">
                  ${row.map((s) => html`<li class="ui-jbk__slot" style=${styleMap({ "--y": String(top(r + 1, s.index)) })}>${this.renderMatch(s, total)}</li>`)}
                </ol>
              </div>`,
            )}
            ${this.renderChampion(champ, top(total, 0), total)}
          </div>
        </div>
        <span class="ui-jbk__sr" id=${`${this.uid}-keys`}>Arrow keys move between matches, right to the next round. Enter opens a match.</span>
        ${open ? this.renderPanel(open, total) : nothing}
      </div>
      ${live}`;
  }

  /** The connectors: each match to the one it feeds, from the winner's card once it's decided */
  private renderWires(rounds: JudgeSlot[][], top: (r: number, i: number) => number) {
    const total = rounds.length;
    const paths: TemplateResult[] = [];
    const cardY = (slotTop: number, which: "a" | "b") => HEAD + slotTop + (which === "a" ? CARD / 2 : CARD + INNER + CARD / 2);
    for (const row of rounds) {
      for (const s of row) {
        const x1 = (s.round - 1) * (COL + GAP) + COL;
        const t = top(s.round, s.index);
        const y1 = s.winner ? cardY(t, s.winner === s.a ? "a" : "b") : HEAD + t + MATCH / 2;
        let x2: number;
        let y2: number;
        if (s.round < total) {
          x2 = s.round * (COL + GAP);
          y2 = cardY(top(s.round + 1, Math.floor(s.index / 2)), s.index % 2 ? "b" : "a");
        } else {
          x2 = total * (COL + GAP);
          y2 = HEAD + t + MATCH / 2;
        }
        const xm = x1 + GAP / 2;
        const d = `M${x1} ${y1}H${xm}V${y2}H${x2}`;
        paths.push(svg`<path class="ui-jbk__wire" d=${d} pathLength="1" ?data-won=${!!s.winner} ?data-new=${this.fresh.has(s.key)}></path>`);
      }
    }
    return html`<svg class="ui-jbk__wires" aria-hidden="true" focusable="false">${paths}</svg>`;
  }

  private renderCard(id: string | null, s: JudgeSlot, total: number, side: "a" | "b") {
    const w = this.words;
    const at = this.attempt(id);
    if (!at) {
      const text = s.state === "bye" ? w.bye : w.waiting;
      return html`<span class="ui-jbk__entry" data-empty>${text}<span class="ui-jbk__sr">${s.state === "bye" ? "" : ` for the ${s.round > 1 ? `winner of ${this.roundName(s.round - 1, total).toLowerCase()} match ${s.index * 2 + (side === "a" ? 1 : 2)}` : "draw"}`}</span></span>`;
    }
    const outcome = s.winner ? (s.winner === id ? "won" : "lost") : undefined;
    // A winner arriving from the round before slides in, the first time it's decided
    const feeder = s.round > 1 ? `${s.round - 1}-${s.index * 2 + (side === "a" ? 1 : 2)}` : "";
    return html`<span class="ui-jbk__entry" data-outcome=${ifDefined(outcome)} ?data-new=${!!feeder && this.fresh.has(feeder)}>
      <span class="ui-jbk__who">
        <span class="ui-jbk__name">${at.label}</span>
        ${at.model ? html`<span class="ui-jbk__model">${at.model}</span>` : nothing}
      </span>
      ${at.score != null ? html`<span class="ui-jbk__score">${at.score}</span>` : nothing}
      ${outcome === "won" ? html`${glyph(CHECK, "ui-jbk__tick")}<span class="ui-jbk__sr"> (won)</span>` : nothing}
    </span>`;
  }

  private renderMatch(s: JudgeSlot, total: number) {
    const w = this.words;
    const open = this.match === s.key;
    const state =
      s.state === "judging" ? w.judging : s.state === "upcoming" ? w.upNext : s.state === "waiting" ? w.waiting : s.state === "bye" ? `${this.attempt(s.a)?.label ?? ""} moves on` : "";
    return html`<button
      type="button"
      class="ui-jbk__match"
      data-key=${s.key}
      data-state=${s.state}
      ?data-selected=${open}
      tabindex=${s.key === this.activeKey ? 0 : -1}
      aria-expanded=${open ? "true" : "false"}
      aria-controls=${ifDefined(open ? `${this.uid}-panel` : undefined)}
      @click=${() => this.setMatch(open ? null : s.key)}
    >
      <span class="ui-jbk__sr">${this.roundName(s.round, total)}, match ${s.index + 1}: </span>
      ${this.renderCard(s.a, s, total, "a")}
      <span class="ui-jbk__sr"> against </span>
      ${this.renderCard(s.b, s, total, "b")}
      ${state ? html`<span class="ui-jbk__sr">, ${state}</span>` : nothing}
    </button>`;
  }

  private renderChampion(id: string | null, slotTop: number, total: number) {
    const w = this.words;
    const at = this.attempt(id);
    const y = HEAD + slotTop + MATCH / 2;
    const x = total * (COL + GAP);
    const style = styleMap({ "--x": String(x), "--y": String(y) });
    if (!at) {
      return html`<div class="ui-jbk__champ" data-empty style=${style}>
        <span class="ui-jbk__cap">${w.champion}</span>
        <p class="ui-jbk__wait">${w.championWaiting}</p>
      </div>`;
    }
    const inUse = this.accepted === at.id;
    return html`<div class="ui-jbk__champ" style=${style} ?data-new=${this.fresh.has(`${total}-1`)} aria-labelledby=${`${this.uid}-champ`} role="group">
      <span class="ui-jbk__cap" id=${`${this.uid}-champ`}>${glyph(TROPHY, "ui-jbk__cup")}${w.champion}: ${at.label}</span>
      ${at.model ? html`<span class="ui-jbk__model">${at.model}${at.score != null ? html` · score ${at.score}` : nothing}</span>` : nothing}
      <p class="ui-jbk__summary">${at.summary}</p>
      ${inUse
        ? html`<span class="ui-jbk__use" data-on tabindex="-1">${glyph(CHECK, "ui-jbk__tick")}${w.inUse}</span>`
        : html`<button type="button" class="ui-jbk__use" @click=${() => this.accept()}>${w.use}</button>`}
    </div>`;
  }

  private renderPanel(s: JudgeSlot, total: number) {
    const w = this.words;
    const side = (id: string | null) => {
      const at = this.attempt(id);
      if (!at) return html`<div class="ui-jbk__side" data-empty><p class="ui-jbk__wait">${s.state === "bye" ? w.bye : w.waiting}</p></div>`;
      const won = s.winner === id;
      return html`<div class="ui-jbk__side" data-outcome=${ifDefined(s.winner ? (won ? "won" : "lost") : undefined)}>
        <div class="ui-jbk__side-head">
          <span class="ui-jbk__name">${at.label}</span>
          ${won ? html`<span class="ui-jbk__badge">${glyph(CHECK, "ui-jbk__tick")}${w.picked}</span>` : nothing}
        </div>
        ${at.model || at.score != null ? html`<span class="ui-jbk__model">${[at.model, at.score != null ? `score ${at.score}` : ""].filter(Boolean).join(" · ")}</span>` : nothing}
        <p class="ui-jbk__summary">${at.summary}</p>
      </div>`;
    };
    const conf = s.match?.confidence;
    const pct = conf == null ? null : Math.round(Math.max(0, Math.min(1, conf)) * 100);
    return html`<section class="ui-jbk__panel" id=${`${this.uid}-panel`} aria-labelledby=${`${this.uid}-ptitle`}>
      <div class="ui-jbk__panel-head">
        <h4 class="ui-jbk__ptitle" id=${`${this.uid}-ptitle`}>${this.roundName(s.round, total)} · match ${s.index + 1}</h4>
        <button type="button" class="ui-jbk__close" @click=${() => this.closePanel()}>${glyph(CLOSE, "ui-jbk__x")}${w.close}</button>
      </div>
      <div class="ui-jbk__sides">${side(s.a)}${side(s.b)}</div>
      ${s.state === "decided" && (s.match?.reason || pct != null)
        ? html`<div class="ui-jbk__verdict">
            ${s.match?.reason ? html`<p class="ui-jbk__reason"><span class="ui-jbk__cap">${w.reason}</span> ${s.match.reason}</p>` : nothing}
            ${pct != null
              ? html`<div class="ui-jbk__conf">
                  <span class="ui-jbk__conf-text">${pct}% confident</span>
                  <span class="ui-jbk__meter" aria-hidden="true"><span class="ui-jbk__meter-fill" style=${styleMap({ "--p": String(pct / 100) })}></span></span>
                </div>`
              : nothing}
          </div>`
        : s.state === "judging"
          ? html`<p class="ui-jbk__note">${w.judging}</p>`
          : s.state === "upcoming"
            ? html`<p class="ui-jbk__note">${w.upNext}</p>`
            : nothing}
    </section>`;
  }

  static override css = /* css */ `
[data-ui="jbk"] {
  --tc-jbk-wire: var(--tc-border-strong);
  --tc-jbk-wire-won: var(--tc-accent-solid);
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="jbk"] *, [data-ui="jbk"] *::before, [data-ui="jbk"] *::after { box-sizing: border-box; }
:where([data-ui="jbk"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; letter-spacing: inherit; color: inherit; text-align: inherit; cursor: pointer; }
[data-ui="jbk"] :is(button, [tabindex]):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-jbk__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-jbk__count { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-jbk__count b { font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); }

/* ---- Standard: the tray and its white card; Clean: one card ---- */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="jbk"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
:where([data-look="standard"], [data-look="standard"] *).ui-jbk__card { padding: var(--tc-space-4); border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *)[data-ui="jbk"] { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-jbk__card { padding: 0 var(--tc-space-4) var(--tc-space-4); }
.ui-jbk__empty { margin: 0; padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-muted); text-align: center; }

/* ---- The stage: rounds as columns placed from the bracket's maths ---- */
.ui-jbk__path { display: none; }
.ui-jbk__scroll { overflow-x: auto; overscroll-behavior-x: contain; }
.ui-jbk__stage { position: relative; width: calc(var(--w) * 1px); height: calc(var(--h) * 1px); }
.ui-jbk__wires { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.ui-jbk__wire { fill: none; stroke: var(--tc-jbk-wire); stroke-width: 1.25; stroke-dasharray: 1; stroke-dashoffset: 0; transition: stroke var(--tc-duration-slow) var(--tc-ease-standard); }
.ui-jbk__wire[data-won] { stroke: var(--tc-jbk-wire-won); stroke-width: 2; }
/* The winner moves on: its connector draws from the match to the next */
.ui-jbk__wire[data-new] { animation: ui-jbk-draw var(--tc-duration-slowest) var(--tc-ease-move) both; }
.ui-jbk__round { position: absolute; top: 0; left: calc(var(--x) * 1px); width: 200px; height: 100%; }
.ui-jbk__rname {
  margin: 0;
  height: 30px;
  font-size: var(--tc-caption-font-size);
  font-weight: var(--tc-caption-font-weight);
  line-height: var(--tc-caption-line-height);
  letter-spacing: var(--tc-caption-tracking);
  text-transform: var(--tc-caption-transform);
  color: var(--tc-caption-color);
}
.ui-jbk__matches { margin: 0; padding: 0; list-style: none; }
.ui-jbk__slot { position: absolute; left: 0; top: calc(30px + var(--y) * 1px); width: 100%; }

/* ---- A match: two cards, one button ---- */
.ui-jbk__match {
  display: grid;
  grid-template-rows: 46px 46px;
  row-gap: var(--tc-space-1);
  width: 100%;
  border-radius: var(--tc-radius-lg);
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-jbk__match[data-selected] { box-shadow: 0 0 0 2px var(--tc-border-selected); }
.ui-jbk__entry {
  display: flex;
  align-items: center;
  gap: var(--tc-space-2);
  min-width: 0;
  padding: 0 var(--tc-space-2-5);
  border-radius: var(--tc-radius-md);
  background: var(--tc-surface-raised);
  box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default);
  transition: background-color var(--tc-duration-slow) var(--tc-ease-standard), color var(--tc-duration-slow) var(--tc-ease-standard), box-shadow var(--tc-duration-slow) var(--tc-ease-standard);
}
:where([data-look="clean"], [data-look="clean"] *) .ui-jbk__entry { background: var(--tc-surface-base); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-jbk__match:hover .ui-jbk__entry:not([data-empty]) { box-shadow: inset 0 0 0 1px var(--tc-border-strong); }
.ui-jbk__entry[data-empty] { background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-jbk__entry[data-outcome="won"] { background: var(--tc-status-success-bg); box-shadow: inset 0 0 0 1px var(--tc-status-success-border); }
/* The loser steps back – quieter colours, never fainter than 4.5:1 */
.ui-jbk__entry[data-outcome="lost"] { background: var(--tc-fill-subtle); box-shadow: none; }
.ui-jbk__entry[data-outcome="lost"] :is(.ui-jbk__name, .ui-jbk__score) { color: var(--tc-text-muted); text-decoration: line-through; text-decoration-color: var(--tc-border-strong); }
.ui-jbk__entry[data-new] { animation: ui-jbk-in var(--tc-duration-slower) var(--tc-ease-move) var(--tc-duration-moderate) both; }
.ui-jbk__who { display: grid; flex: 1; min-width: 0; }
.ui-jbk__name { overflow: hidden; font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); white-space: nowrap; text-overflow: ellipsis; }
.ui-jbk__model { overflow: hidden; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
.ui-jbk__score { flex: none; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-jbk__tick { flex: none; width: 14px; height: 14px; color: var(--tc-status-success-fg); }
/* The match being judged: a soft pulse round both cards */
.ui-jbk__match[data-state="judging"] { animation: ui-jbk-pulse var(--tc-duration-shimmer) var(--tc-ease-in-out) infinite; }
[data-offscreen] .ui-jbk__match[data-state="judging"] { animation-play-state: paused; }

/* ---- The champion ---- */
.ui-jbk__champ {
  position: absolute;
  left: calc(var(--x) * 1px);
  top: calc(var(--y) * 1px);
  display: grid;
  gap: var(--tc-space-1-5);
  width: 232px;
  padding: var(--tc-space-3) var(--tc-space-3-5);
  border-radius: var(--tc-radius-lg);
  background: var(--tc-accent-subtle);
  box-shadow: inset 0 0 0 1px var(--tc-border-selected);
  transform: translateY(-50%);
}
.ui-jbk__champ[data-empty] { background: var(--tc-fill-subtle); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); }
.ui-jbk__champ[data-new] { animation: ui-jbk-champ var(--tc-duration-slowest) var(--tc-ease-spring) var(--tc-duration-moderate) both; }
.ui-jbk__cap {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1-5);
  font-size: var(--tc-caption-font-size);
  font-weight: var(--tc-caption-font-weight);
  line-height: var(--tc-caption-line-height);
  letter-spacing: var(--tc-caption-tracking);
  text-transform: var(--tc-caption-transform);
  color: var(--tc-caption-color);
}
.ui-jbk__champ:not([data-empty]) > .ui-jbk__cap { color: var(--tc-accent-text); }
.ui-jbk__cup { width: 14px; height: 14px; }
.ui-jbk__summary { display: -webkit-box; margin: 0; overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); -webkit-box-orient: vertical; -webkit-line-clamp: 4; }
.ui-jbk__wait { margin: 0; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-jbk__use {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: var(--tc-space-1);
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-control-px-sm);
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-action-primary-bg);
  color: var(--tc-action-primary-fg);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  white-space: nowrap;
}
.ui-jbk__use:not([data-on]):hover { background: var(--tc-action-primary-bg-hover); }
.ui-jbk__use[data-on] { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); cursor: default; }

/* ---- The comparison ---- */
.ui-jbk__panel { display: grid; gap: var(--tc-space-3); margin-top: var(--tc-space-4); padding-top: var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-border-subtle); }
.ui-jbk__panel-head { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2); }
.ui-jbk__ptitle { margin: 0; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); }
.ui-jbk__close { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); font-size: var(--tc-control-font-size); }
.ui-jbk__close:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-jbk__x { width: 14px; height: 14px; }
.ui-jbk__sides { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--tc-space-3); }
.ui-jbk__side { display: grid; align-content: start; gap: var(--tc-space-1); padding: var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
.ui-jbk__side[data-outcome="won"] { background: var(--tc-status-success-bg); box-shadow: inset 0 0 0 1px var(--tc-status-success-border); }
.ui-jbk__side[data-outcome="lost"] { background: var(--tc-fill-subtle); box-shadow: none; }
.ui-jbk__side .ui-jbk__summary { -webkit-line-clamp: unset; }
.ui-jbk__side-head { display: flex; align-items: center; justify-content: space-between; gap: var(--tc-space-2); }
.ui-jbk__badge { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-surface-raised); color: var(--tc-status-success-fg); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); }
.ui-jbk__verdict { display: grid; gap: var(--tc-space-2); }
.ui-jbk__reason { display: grid; gap: var(--tc-space-1); margin: 0; color: var(--tc-text-secondary); }
.ui-jbk__conf { display: flex; align-items: center; gap: var(--tc-space-3); }
.ui-jbk__conf-text { flex: none; font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-jbk__meter { position: relative; flex: 1; max-width: 240px; height: var(--tc-meter-h); border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); overflow: hidden; }
.ui-jbk__meter-fill { position: absolute; inset: 0; border-radius: inherit; background: var(--tc-meter-fill); transform: scaleX(var(--p)); transform-origin: 0 50%; }
.ui-jbk__note { margin: 0; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }

/* ---- Narrow: the rounds as a list, under a "Round 1 → Semi-final → Final" path ---- */
@container (max-width: 560px) {
  .ui-jbk__path { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); margin: 0 0 var(--tc-space-3); padding: 0; list-style: none; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
  .ui-jbk__path li + li::before { content: "→"; margin-right: var(--tc-space-1-5); color: var(--tc-text-disabled); }
  .ui-jbk__scroll { overflow: visible; }
  .ui-jbk__stage { width: auto; height: auto; display: grid; gap: var(--tc-space-4); }
  .ui-jbk__wires { display: none; }
  .ui-jbk__round { position: static; width: auto; height: auto; }
  .ui-jbk__rname { height: auto; margin-bottom: var(--tc-space-2); }
  .ui-jbk__matches { display: grid; gap: var(--tc-space-3); }
  .ui-jbk__slot { position: static; }
  .ui-jbk__champ { position: static; width: auto; transform: none; }
  .ui-jbk__sides { grid-template-columns: minmax(0, 1fr); }
}

@keyframes ui-jbk-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes ui-jbk-in { from { opacity: 0; transform: translateX(-12px); } }
@keyframes ui-jbk-champ { from { opacity: 0; transform: translateY(-50%) scale(0.94); } }
@keyframes ui-jbk-pulse { 0%, 100% { box-shadow: 0 0 0 0 var(--tc-focus-halo); } 50% { box-shadow: 0 0 0 4px var(--tc-focus-halo); } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="jbk"] *, [data-ui="jbk"] *::before, [data-ui="jbk"] *::after { animation: none !important; transition: none !important; }
}
@media (forced-colors: active) {
  .ui-jbk__wire { stroke: CanvasText; }
  .ui-jbk__wire[data-won] { stroke: Highlight; }
  .ui-jbk__entry, .ui-jbk__champ, .ui-jbk__side { border: 1px solid CanvasText; }
  .ui-jbk__meter-fill { background: Highlight; }
}
`;
}

if (!customElements.get("tc-judge-bracket")) customElements.define("tc-judge-bracket", TcJudgeBracket);

declare global {
  interface HTMLElementTagNameMap {
    "tc-judge-bracket": TcJudgeBracket;
  }
}
