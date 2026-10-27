import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, OffScreenController } from "./internal/controllers";
import type { Look } from "./internal/look";

/*
 * <tc-answer-arena> – two models answer the same prompt side by side, streaming together. Once both are done you
 * pick: A is better, B is better, or a tie – and then a reason. In blind mode the model names stay hidden ("Model A",
 * "Model B") until you've voted, so the vote is about the answers, not the brands. The panes stack on narrow widths.
 * Standard is two white cards on a gray tray with the vote on the tray; Clean is one white card split by a hairline.
 *
 *   <tc-answer-arena prompt="Explain RAG to a PM" .answers=${[{ model: "Atlas", answer: "…" }, { model: "Nova", answer: "…", streaming: true }]} blind></tc-answer-arena>
 *
 * The vote is `value` ({ winner: "a" | "b" | "tie", reason? } or null) with a cancelable tc-value-change. Answers are
 * plain text: blank lines make paragraphs, "- " makes a list, **bold**. Screen readers hear "Both answers are in" and
 * the vote – never the streaming words.
 *
 * Keyboard: the three vote buttons are a toolbar – Tab reaches it once, ← → Home End move, Enter or Space votes.
 */

// The header icon: a balance – two answers weighed against each other
const arenaIcon = svg`<path d="M12 4v16M8 20h8M5 7h14"></path><path d="M5 7l-2.5 6a2.5 2.5 0 0 0 5 0Z"></path><path d="M19 7l-2.5 6a2.5 2.5 0 0 0 5 0Z"></path>`;

/** One side of the arena */
export type ArenaAnswer = {
  /** The model's name – hidden until the vote in blind mode */
  model: string;
  /** A glyph in front of the name – an element that's cloned. Defaults to the name's first letter on a soft tile */
  icon?: Element;
  /** The answer so far – may grow while `streaming` is set */
  answer: string;
  /** More text is still coming */
  streaming?: boolean;
  /** A short line under the answer, e.g. "1.8s · 212 tokens" */
  meta?: string;
};
export type ArenaWinner = "a" | "b" | "tie";
/** The vote: which side won (or a tie) and, once picked, why */
export type ArenaVote = { winner: ArenaWinner; reason?: string };

let arenaSeq = 0;
const SIDES = ["a", "b"] as const;
const LETTER = { a: "A", b: "B" } as const;
const VOTES: { id: ArenaWinner; label: string }[] = [
  { id: "a", label: "A is better" },
  { id: "tie", label: "Tie" },
  { id: "b", label: "B is better" },
];

/* ---------- Text: paragraphs, "- " lists and **bold** ---------- */

type ArenaBlock = { kind: "p"; text: string; open: boolean } | { kind: "ul"; items: string[]; open: boolean };
function blocks(text: string): ArenaBlock[] {
  const out: ArenaBlock[] = [];
  for (const chunk of text.split(/\n\s*\n/)) {
    // Runs of "- " lines become a list; the other lines of the chunk a paragraph
    for (const line of chunk.split("\n").filter((l) => l.trim())) {
      const item = line.match(/^\s*[-*]\s(.*)$/);
      const last = out[out.length - 1];
      if (item) {
        if (last?.kind === "ul" && last.open) last.items.push(item[1]);
        else out.push({ kind: "ul", items: [item[1]], open: true });
      } else if (last?.kind === "p" && last.open) last.text += ` ${line.trim()}`;
      else out.push({ kind: "p", text: line.trim(), open: true });
    }
    const last = out[out.length - 1];
    if (last) last.open = false;
  }
  return out;
}
const inline = (s: string) => s.split(/(\*\*[^*]+\*\*)/).map((part) => (part.startsWith("**") && part.endsWith("**") && part.length > 4 ? html`<strong>${part.slice(2, -2)}</strong>` : part));

/* ---------- Icons ---------- */

const checkIcon = (look: Look) =>
  html`<svg class="ui-arena__check" viewBox=${look === "clean" ? "0 0 16 16" : "0 0 24 24"} aria-hidden="true">${look === "clean" ? svg`<path d="m4 8.4 2.6 2.6L12 5.4"></path>` : svg`<path d="M5 12.5l4.5 4.5L19 7.5"></path>`}</svg>`;

/**
 * Two models' answers to the same prompt side by side, with a vote: A is better, B is better or a tie, and a reason.
 * @tag tc-answer-arena
 * @fires tc-value-change - The vote changed (`{ value: ArenaVote | null }`); cancelable – prevent it to keep `value` (controlled use)
 */
export class TcAnswerArena extends TcElement {
  static override ui = "arena";

  /** The prompt both models answered */
  @property() accessor prompt = "";
  /** The two answers: A first, then B */
  @property({ attribute: false }) accessor answers: ArenaAnswer[] = [];
  /** The vote (null: none yet). Changed by the element unless a tc-value-change listener calls preventDefault() */
  @property({ attribute: false }) accessor value: ArenaVote | null = null;
  /** Hide the model names until there's a vote */
  @property({ type: Boolean, reflect: true }) accessor blind = false;
  /** The question over the vote */
  @property() accessor question = "Which answer is better?";
  /** Reasons offered after A or B wins */
  @property({ attribute: false }) accessor reasons = ["More accurate", "Easier to follow", "More complete", "Better tone"];
  /** Reasons offered after a tie */
  @property({ attribute: false }) accessor tieReasons = ["Both good", "Both wrong", "Too close to call"];

  /** @internal What screen readers hear */
  @state() accessor said = "";
  /** @internal The vote button that Tab lands on */
  @state() accessor voteIndex = 0;

  private wasStreaming = false;
  private uid = `tc-arena-${++arenaSeq}`;

  constructor() {
    super();
    // Reasons that fold away or change hand the focus back to the vote
    new FocusRescueController(this, () => this.querySelector<HTMLElement>('.ui-arena__vote[aria-pressed="true"]') ?? this.querySelector<HTMLElement>(".ui-arena__vote"));
    // The carets pulse while streaming – paused off screen
    new OffScreenController(this, () => this.streaming);
  }

  private get streaming() {
    return this.answers.some((a) => a.streaming);
  }
  private get ready() {
    return this.answers.length >= 2 && !this.streaming;
  }
  /** Names show when not blind, or once there's a vote */
  private get revealed() {
    return !this.blind || this.value !== null;
  }
  private side(s: "a" | "b") {
    return this.answers[s === "a" ? 0 : 1];
  }

  /* ---------- The vote ---------- */

  private setValue(next: ArenaVote | null) {
    if (this.emit("tc-value-change", { value: next }, { cancelable: true })) this.value = next;
  }
  private vote(winner: ArenaWinner) {
    if (!this.ready || this.value?.winner === winner) return;
    this.setValue({ winner });
  }
  private pickReason(reason: string) {
    if (!this.value) return;
    this.setValue(this.value.reason === reason ? { winner: this.value.winner } : { winner: this.value.winner, reason });
  }

  private onVoteKey = (e: KeyboardEvent) => {
    const buttons = [...this.querySelectorAll<HTMLButtonElement>(".ui-arena__vote")];
    const at = buttons.indexOf(e.target as HTMLButtonElement);
    if (at < 0) return;
    const to =
      e.key === "ArrowRight" ? (at + 1) % buttons.length
      : e.key === "ArrowLeft" ? (at - 1 + buttons.length) % buttons.length
      : e.key === "Home" ? 0
      : e.key === "End" ? buttons.length - 1
      : -1;
    if (to < 0) return;
    e.preventDefault();
    this.voteIndex = to;
    buttons[to].focus();
  };

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    const streaming = this.streaming;
    if (changed.has("answers")) {
      // Both done after streaming: say so once (not on the first render, and not word by word)
      if (this.hasUpdated && this.wasStreaming && !streaming && this.answers.length >= 2) this.said = "Both answers are in.";
      this.wasStreaming = streaming;
    }
    if (changed.has("value") && this.hasUpdated) {
      const prev = changed.get("value") as ArenaVote | null | undefined;
      const v = this.value;
      if (!v) this.said = "";
      else if (prev?.winner !== v.winner) {
        const label = VOTES.find((x) => x.id === v.winner)!.label;
        const names = this.blind && !prev ? ` A was ${this.side("a")?.model ?? "Model A"}, B was ${this.side("b")?.model ?? "Model B"}.` : "";
        this.said = `You voted: ${label}.${names}`;
      } else if (v.reason && v.reason !== prev?.reason) this.said = `Reason: ${v.reason}.`;
    }
    if (changed.has("value") && this.value) this.voteIndex = Math.max(0, VOTES.findIndex((x) => x.id === this.value!.winner));
    this.toggleAttribute("data-voted", this.value !== null);
  }

  /* ---------- Render ---------- */

  private renderPane(s: "a" | "b", look: Look) {
    const a = this.side(s);
    const revealed = this.revealed;
    const winner = this.value?.winner === s;
    const name = revealed && a ? a.model : `Model ${LETTER[s]}`;
    const glyph = revealed && a ? (a.icon ? a.icon.cloneNode(true) : a.model.trim().charAt(0).toUpperCase()) : LETTER[s];
    const text = blocks(a?.answer ?? "");
    const caret = a?.streaming ? html`<span class="ui-arena__caret" aria-hidden="true"></span>` : nothing;
    const last = text.length - 1;
    return html`<section class="ui-arena__pane" data-side=${s} ?data-winner=${winner} ?data-streaming=${!!a?.streaming} aria-label=${`Answer ${LETTER[s]}`} aria-busy=${a?.streaming ? "true" : "false"}>
      <header class="ui-arena__head">
        <span class="ui-arena__glyph" aria-hidden="true">${glyph}</span>
        ${keyed(revealed, html`<span class="ui-arena__model" ?data-revealed=${revealed && this.blind}>${name}</span>`)}
        ${winner
          ? html`<span class="ui-arena__pill" data-winner>${checkIcon(look)}Preferred</span>`
          : revealed
            ? html`<span class="ui-arena__pill"><span class="ui-arena__sr">Side </span>${LETTER[s]}</span>`
            : nothing}
      </header>
      <div class="ui-arena__answer">
        ${text.length
          ? text.map((b, i) =>
              b.kind === "p"
                ? html`<p>${inline(b.text)}${i === last ? caret : nothing}</p>`
                : html`<ul>${b.items.map((item, j) => html`<li>${inline(item)}${i === last && j === b.items.length - 1 ? caret : nothing}</li>`)}</ul>`,
            )
          : html`<p class="ui-arena__waiting">${a?.streaming ? html`Writing${caret}` : "No answer."}</p>`}
      </div>
      ${a?.meta && !a.streaming ? html`<p class="ui-arena__meta">${a.meta}</p>` : nothing}
    </section>`;
  }

  private renderVote(look: Look) {
    const v = this.value;
    const ready = this.ready;
    const reasons = v ? (v.winner === "tie" ? this.tieReasons : this.reasons) : [];
    const open = !!v && reasons.length > 0;
    return html`<div class="ui-arena__foot">
      <div class="ui-arena__ask">
        <p class="ui-arena__question" id=${`${this.uid}-q`} ?data-waiting=${!ready && !v}>${ready || v ? this.question : "Vote once both answers are done"}</p>
        <div class="ui-arena__votes" role="toolbar" aria-labelledby=${`${this.uid}-q`} @keydown=${this.onVoteKey}>
          ${VOTES.map(
            (x, i) => html`<button
              type="button"
              class="ui-arena__vote"
              data-vote=${x.id}
              aria-pressed=${v?.winner === x.id ? "true" : "false"}
              aria-disabled=${ready ? "false" : "true"}
              tabindex=${i === this.voteIndex ? 0 : -1}
              @focus=${() => (this.voteIndex = i)}
              @click=${() => this.vote(x.id)}
            >${v?.winner === x.id ? checkIcon(look) : nothing}${x.label}</button>`,
          )}
        </div>
      </div>
      <div class="ui-arena__reasons" data-open=${open ? "true" : "false"} .inert=${!open}>
        <div role="group" aria-label="Why?">
          <span class="ui-arena__why" aria-hidden="true">Why?</span>
          ${keyed(
            v?.winner === "tie" ? "tie" : "win",
            html`${reasons.map((r) => html`<button type="button" class="ui-arena__reason" aria-pressed=${v?.reason === r ? "true" : "false"} @click=${() => this.pickReason(r)}>${r}</button>`)}`,
          )}
        </div>
      </div>
    </div>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    // The prompt is the card's title; "Prompt" is said, the icon shows it
    const prompt = this.prompt ? cardHead({ icon: arenaIcon, title: html`<span class="ui-arena__sr">Prompt: </span>${this.prompt}` }) : nothing;
    const panes = html`<div class="ui-arena__panes" ?data-headed=${!!this.prompt}>${SIDES.map((s) => this.renderPane(s, look))}</div>`;
    return html`
      ${look === "clean" ? html`<div class="ui-arena__card">${prompt}${panes}${this.renderVote(look)}</div>` : html`${prompt}${panes}${this.renderVote(look)}`}
      <span class="ui-arena__sr" role="status">${this.said}</span>
    `;
  }

  static override css = /* css */ `
/* Theme: the tokens' light-dark() values follow color-scheme */
:where([data-tc-theme="system"]) { color-scheme: light dark; }
:where([data-theme="light"], [data-tc-theme="light"]) { color-scheme: light; }
:where(.dark, [data-theme="dark"], [data-tc-theme="dark"]) { color-scheme: dark; }

[data-ui="arena"] {
  position: relative;
  box-sizing: border-box;
  container-type: inline-size;
  display: grid;
  align-content: start;
  width: 100%;
  max-width: 880px;
  font-family: var(--tc-font-sans);
  -webkit-font-smoothing: antialiased;
}
/* Standard: two white cards on a gray tray; the prompt and the vote sit on the tray */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="arena"] {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-relaxed);
  color: var(--tc-text-secondary);
}
/* Clean: one white card with hairline shadows */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="arena"] {
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  font-weight: var(--tc-font-weight-regular);
  color: var(--tc-text-primary);
}
[data-ui="arena"] *, [data-ui="arena"] *::before, [data-ui="arena"] *::after { box-sizing: border-box; }
:where([data-ui="arena"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="arena"]) svg { display: block; flex: none; }
[data-ui="arena"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-arena__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-arena__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }

/* ----- The prompt ----- */
/* Clean: a hairline between the header row and the answers */
:where([data-look="clean"], [data-look="clean"] *).ui-arena__panes[data-headed] { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-arena__why { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }

/* ----- The two panes: side by side, stacked when narrow ----- */
.ui-arena__panes { display: grid; grid-template-columns: 1fr 1fr; align-content: start; }
:where([data-look="standard"], [data-look="standard"] *).ui-arena__panes { gap: var(--tc-tray-inset); }
.ui-arena__pane { display: flex; flex-direction: column; min-width: 0; margin: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-arena__pane {
  padding: var(--tc-space-4) var(--tc-space-5) var(--tc-space-4);
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-on-tray);
  box-shadow: var(--tc-card-shadow);
  transition: box-shadow var(--tc-duration-base) var(--tc-ease-standard);
}
/* The preferred answer: a ≥ 3:1 ring, not only a colour */
:where([data-look="standard"], [data-look="standard"] *).ui-arena__pane[data-winner] { box-shadow: var(--tc-card-shadow), 0 0 0 1.5px var(--tc-border-selected); }
:where([data-look="clean"], [data-look="clean"] *).ui-arena__pane { padding: var(--tc-space-4); transition: background-color var(--tc-duration-base) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-arena__pane + .ui-arena__pane { border-left: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-arena__pane[data-winner] { background: var(--tc-accent-subtle); }

.ui-arena__head { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-arena__head { margin-bottom: var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-arena__head { margin-bottom: var(--tc-space-2-5); }
/* The glyph: model-picker's small tile with a hairline */
.ui-arena__glyph { display: grid; flex: none; place-items: center; overflow: hidden; font-size: var(--tc-font-size-2xs); font-weight: var(--tc-avatar-font-weight); line-height: var(--tc-line-height-none); }
:where([data-look="standard"], [data-look="standard"] *).ui-arena__glyph { width: 22px; height: 22px; border-radius: var(--tc-radius-sm); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 1px var(--tc-border-default); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-arena__glyph { width: 20px; height: 20px; border-radius: var(--tc-avatar-radius-agent); background: var(--tc-surface-control); box-shadow: var(--tc-shadow-raised); color: var(--tc-text-strong); }
.ui-arena__glyph > svg, .ui-arena__glyph > img { width: 12px; height: 12px; }
.ui-arena__model { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="standard"], [data-look="standard"] *).ui-arena__model { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-arena__model { font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-text-strong); }
/* Blind: the name arrives out of a blur once the vote is in */
.ui-arena__model[data-revealed] { animation: ui-arena-reveal var(--tc-duration-slowest) var(--tc-ease-move) both; }
.ui-arena__pill {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: var(--tc-space-1);
  height: var(--tc-pill-h);
  padding: 0 var(--tc-pill-px);
  border-radius: var(--tc-pill-radius);
  background: var(--tc-fill-default);
  font-size: var(--tc-pill-font-size);
  font-weight: var(--tc-pill-font-weight);
  line-height: var(--tc-line-height-none);
  color: var(--tc-text-muted);
  white-space: nowrap;
}
.ui-arena__pill[data-winner] { background: var(--tc-accent-subtle); color: var(--tc-accent-text); animation: ui-arena-pop var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-arena__check { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-arena__check { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }

/* ----- The answer text ----- */
.ui-arena__answer { flex: 1; overflow-wrap: anywhere; }
:where([data-look="standard"], [data-look="standard"] *).ui-arena__answer { color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-arena__answer { color: var(--tc-text-primary); }
.ui-arena__answer p { margin: 0 0 var(--tc-space-2-5); }
.ui-arena__answer ul { margin: 0 0 var(--tc-space-2-5); padding: 0 0 0 var(--tc-space-5); }
.ui-arena__answer li { margin: 0 0 var(--tc-space-1); padding-left: var(--tc-space-0-5); }
.ui-arena__answer li::marker { color: var(--tc-text-disabled); }
.ui-arena__answer > :last-child { margin-bottom: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-arena__answer strong { font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-arena__answer strong { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-strong); }
.ui-arena__waiting { color: var(--tc-text-muted); }
.ui-arena__meta { margin: var(--tc-space-3) 0 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); font-variant-numeric: tabular-nums; color: var(--tc-text-muted); animation: ui-arena-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="standard"], [data-look="standard"] *).ui-arena__caret {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-left: var(--tc-space-1);
  border-radius: 50%;
  background: var(--tc-text-primary);
  vertical-align: 0.05em;
  animation: ui-arena-pulse var(--tc-duration-reveal-slow) var(--tc-ease-in-out) infinite;
}
:where([data-look="clean"], [data-look="clean"] *).ui-arena__caret {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-left: var(--tc-space-1);
  border-radius: var(--tc-radius-2xs);
  background: var(--tc-accent);
  vertical-align: 0.1em;
  animation: ui-arena-pulse-clean var(--tc-duration-reveal-slow) var(--tc-ease-in-out) infinite;
}
[data-ui="arena"][data-offscreen] .ui-arena__caret { animation-play-state: paused; }

/* ----- The vote ----- */
:where([data-look="standard"], [data-look="standard"] *).ui-arena__foot { padding: var(--tc-space-1) var(--tc-space-1) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-arena__foot { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-arena__ask { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2) var(--tc-space-3); }
:where([data-look="standard"], [data-look="standard"] *).ui-arena__ask { min-height: 48px; padding: var(--tc-space-1) 0 var(--tc-space-1) var(--tc-space-2); }
:where([data-look="clean"], [data-look="clean"] *).ui-arena__ask { min-height: 52px; padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-4); }
.ui-arena__question { margin: 0; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-normal); color: var(--tc-text-primary); }
.ui-arena__question[data-waiting] { font-weight: var(--tc-font-weight-regular); color: var(--tc-text-muted); }
.ui-arena__votes { display: flex; gap: var(--tc-space-1); }
.ui-arena__vote {
  display: inline-flex;
  align-items: center;
  gap: var(--tc-space-1);
  height: var(--tc-control-h-md);
  padding: 0 var(--tc-control-px-md);
  border-radius: var(--tc-control-radius-md);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  color: var(--tc-action-secondary-fg);
  white-space: nowrap;
  transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-arena__vote:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-arena__vote[aria-disabled="true"] { color: var(--tc-text-disabled); box-shadow: var(--tc-action-secondary-shadow); cursor: default; }
/* The vote you gave: the selected fill with a ≥ 3:1 ring and the accent */
.ui-arena__vote[aria-pressed="true"] { padding-left: var(--tc-control-px-sm); background: var(--tc-fill-selected); box-shadow: inset 0 0 0 1px var(--tc-border-selected); color: var(--tc-accent-text); }

/* Reasons fold out under the vote */
.ui-arena__reasons { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows var(--tc-duration-slow) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-arena__reasons[data-open="true"] { grid-template-rows: 1fr; opacity: 1; }
.ui-arena__reasons > div { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); min-height: 0; overflow: hidden; }
:where([data-look="standard"], [data-look="standard"] *).ui-arena__reasons > div { padding: var(--tc-space-1) var(--tc-space-2) 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-arena__reasons[data-open="true"] > div { padding-bottom: var(--tc-space-2-5); }
:where([data-look="clean"], [data-look="clean"] *).ui-arena__reasons > div { padding: var(--tc-space-1) var(--tc-space-4) 0; }
:where([data-look="clean"], [data-look="clean"] *).ui-arena__reasons[data-open="true"] > div { padding-bottom: var(--tc-space-3); }
.ui-arena__why { margin-right: var(--tc-space-1); }
.ui-arena__reason {
  height: var(--tc-control-h-sm);
  padding: 0 var(--tc-control-px-sm);
  border-radius: var(--tc-control-radius-sm);
  background: var(--tc-action-secondary-bg);
  box-shadow: var(--tc-action-secondary-shadow);
  font-size: var(--tc-control-font-size);
  font-weight: var(--tc-control-font-weight);
  color: var(--tc-action-secondary-fg);
  transition: color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-arena__reason:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-arena__reason[aria-pressed="true"] { background: var(--tc-fill-selected); box-shadow: inset 0 0 0 1px var(--tc-border-selected); color: var(--tc-accent-text); }

@keyframes ui-arena-in { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }
@keyframes ui-arena-reveal { from { opacity: 0; filter: blur(4px); } to { opacity: 1; filter: none; } }
@keyframes ui-arena-pop { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: none; } }
@keyframes ui-arena-pulse { 50% { transform: scale(0.6); opacity: 0.45; } }
@keyframes ui-arena-pulse-clean { 50% { opacity: 0.3; } }

/* Narrow: the answers stack; the vote takes the whole row */
@container (max-width: 560px) {
  .ui-arena__panes { grid-template-columns: 1fr; }
  :where([data-look="clean"], [data-look="clean"] *).ui-arena__pane + .ui-arena__pane { border-left: 0; border-top: var(--tc-hairline) solid var(--tc-divider); }
  :where([data-look="standard"], [data-look="standard"] *).ui-arena__pane { padding: var(--tc-space-4); }
}
@container (max-width: 400px) {
  .ui-arena__votes { flex: 1; }
  .ui-arena__vote { flex: 1 1 auto; justify-content: center; padding: 0 var(--tc-control-px-sm); }
}
@media (hover: none) and (pointer: coarse) {
  .ui-arena__vote { height: var(--tc-control-h-lg); }
  .ui-arena__reason { height: var(--tc-control-h-md); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="arena"] *, [data-ui="arena"] *::before, [data-ui="arena"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-answer-arena")) customElements.define("tc-answer-arena", TcAnswerArena);

declare global {
  interface HTMLElementTagNameMap {
    "tc-answer-arena": TcAnswerArena;
  }
}
