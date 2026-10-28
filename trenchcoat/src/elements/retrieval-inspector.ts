import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { FocusRescueController, RowWindowController } from "./internal/controllers";
import "./validity-badge";
import type { ValidityProfile, ValidityProfileName, ValidityTime } from "./validity-badge";
import { safeUrl } from "./internal/safe-url";

/*
 * <tc-retrieval-inspector> – what the model was given to answer with: every chunk retrieval returned for one query,
 * in rank order, with its score, its source document and where in it the chunk sits, how fresh the source is
 * (tc-validity-badge), and whether the answer used it – plus the misses the app reports (chunks that should have
 * come back and didn't). For debugging retrieval, one query at a time.
 *   · each row: rank, source and place, the start of the text, a score bar (with the cutoff marked, when there is
 *     one), freshness, and "Used" with the answer's citation marker
 *   · pick a row: the chunk opens in full – its place in the document, its score against the cutoff, the query's
 *     words marked in its text, and Open source
 *   · All / Used / Not used narrows the list; long lists render only the rows near the scroll position (10,000
 *     chunks stay fast)
 * Standard is a gray tray with the inspector on a white card; Clean is one white card with hairline dividers. Wide,
 * the open chunk sits beside the list; narrow, below it.
 *
 *   <tc-retrieval-inspector query="refund window" .chunks=${chunks} .misses=${misses} cutoff="0.5"></tc-retrieval-inspector>
 *
 * `show` and `selected` change on their own; preventDefault() on tc-show-change or tc-selected-change keeps control.
 */

export type RetrievalChunk = {
  id: string;
  /** The chunk's text, as it was given to the model */
  text: string;
  /** The retrieval score – higher is closer */
  score: number;
  /** The source document's title */
  source: string;
  /** Where in the source, in words: "p. 12 · §3.2" */
  location?: string;
  /** Its place among the document's chunks: { index: 3, count: 37 } is the fourth of 37 (index from 0) */
  position?: { index: number; count: number };
  /** Opens the source; with `open-handled` the app opens it instead */
  url?: string;
  /** When the source was published or last updated – sets the freshness band */
  observed?: ValidityTime;
  /** How fast this source goes stale – defaults to the inspector's `profile` */
  profile?: ValidityProfileName | ValidityProfile;
  /** Other evidence disputes the source */
  contested?: boolean;
  /** Something newer replaces the source */
  superseded?: boolean;
  /** The answer used it */
  used?: boolean;
  /** The marker the answer cites it with – "2" shows as [2] */
  citation?: string | number;
};

/** A chunk the app says should have been retrieved and wasn't – from eval labels, a reviewer, or a later check */
export type RetrievalMiss = {
  id: string;
  source: string;
  location?: string;
  /** The passage that was missed, or the start of it */
  text?: string;
  /** Why it counts as a miss, in a line */
  reason?: string;
  /** Its score, if the app scored it – often just under the cutoff */
  score?: number;
};

export type RetrievalShow = "all" | "used" | "unused";
export type RetrievalShowChange = { show: RetrievalShow };
export type RetrievalSelectedChange = { selected: string | null; chunk?: RetrievalChunk };
export type RetrievalOpenSource = { chunk: RetrievalChunk };

const SHOWS: Record<RetrievalShow, string> = { all: "All", used: "Used", unused: "Not used" };
const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
const twoPlaces = (n: number) => n.toFixed(2);
const STOP = new Set(["about", "after", "been", "could", "does", "from", "have", "into", "should", "that", "their", "them", "there", "they", "this", "what", "when", "where", "which", "will", "with", "would", "your"]);
/** Words of the query worth marking in a chunk – four letters or more, without the commonest ones */
const termsOf = (q: string) => [...new Set(q.toLowerCase().match(/[\p{L}\p{N}]{4,}/gu) ?? [])].filter((w) => !STOP.has(w));
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
const glyph = (d: TemplateResult, cls = "ui-rti__glyph") => html`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
/* A stack of pages with a magnifier – what was retrieved */
/* The header's icon: a page under a magnifier */
const mark = svg`<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4"></path><path d="M9 8h6M9 12h3"></path><circle cx="16.5" cy="16.5" r="3"></circle><path d="M18.7 18.7L21 21"></path>`;
const openIcon = glyph(svg`<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"></path>`);
const missIcon = glyph(svg`<circle cx="12" cy="12" r="8.5"></circle><path d="M8.5 12h7"></path>`);

const VIRTUAL_FROM = 60;
const OVERSCAN = 16;
const ROW = 56;
const PAGE = 8;

let instances = 0;

/**
 * The chunks retrieved for an answer – score, source and place, freshness, whether the answer used them – and the
 * misses the app reports.
 * @tag tc-retrieval-inspector
 * @fires tc-show-change - All, Used or Not used was picked ({ show }: RetrievalShowChange); cancelable
 * @fires tc-selected-change - A chunk was picked or the open one closed ({ selected, chunk }: RetrievalSelectedChange); cancelable
 * @fires tc-open-source - Open source was pressed, or Enter on a chunk with a source to open ({ chunk }: RetrievalOpenSource)
 */
export class TcRetrievalInspector extends TcElement {
  static override ui = "rti";

  /** The heading */
  @property() accessor heading = "Retrieval";
  /** The query the chunks were retrieved for */
  @property() accessor query = "";
  /** The chunks, in rank order – the first is the best match */
  @property({ attribute: false }) accessor chunks: RetrievalChunk[] = [];
  /** Chunks the app reports should have been retrieved and weren't */
  @property({ attribute: false }) accessor misses: RetrievalMiss[] = [];
  /** The score below which chunks are left out of the prompt – marked on every score bar; unset marks none */
  @property({ type: Number }) accessor cutoff: number | undefined = undefined;
  /** The top of the score scale – defaults to 1, or the highest score when that is higher */
  @property({ type: Number, attribute: "max-score" }) accessor maxScore: number | undefined = undefined;
  /** Which chunks show: "all", "used" (by the answer) or "unused" */
  @property() accessor show: RetrievalShow = "all";
  /** The id of the open chunk, or null */
  @property() accessor selected: string | null = null;
  /** How fast sources go stale, for chunks without their own `profile` – see tc-validity-badge */
  @property({ attribute: false }) accessor profile: ValidityProfileName | ValidityProfile = "standard";
  /** The moment freshness is counted to, in epoch ms – defaults to when each badge connected */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** Open source fires tc-open-source and the link doesn't navigate on its own; chunks without a url get the button */
  @property({ type: Boolean, attribute: "open-handled" }) accessor openHandled = false;
  /** The list's height before it scrolls, in px */
  @property({ type: Number, attribute: "max-height" }) accessor maxHeight = 392;
  /** Formats a score – defaults to two decimals, e.g. "0.82" */
  @property({ attribute: false }) accessor formatScore: (score: number) => string = twoPlaces;

  /** @internal The keyboard's place in the list (shown rows), or -1 */
  @state() accessor active = -1;
  /** @internal What the status region says after the filter changes */
  @state() accessor spoken = "";

  private readonly uid = `tc-rti${++instances}`;
  private view: RetrievalChunk[] = [];
  private rank = new Map<string, number>();
  private counts: Record<RetrievalShow, number> = { all: 0, used: 0, unused: 0 };
  private top = 1;
  private readonly window = new RowWindowController(this, {
    count: () => this.view.length,
    body: () => this.querySelector(".ui-rti__rows"),
    rowSelector: ".ui-rti__row",
    from: VIRTUAL_FROM,
    overscan: OVERSCAN,
    rowHeight: ROW,
  });

  constructor() {
    super();
    // Closing the open chunk never drops focus to <body>
    new FocusRescueController(this, () => this.list);
  }

  /** @internal */
  private get list() {
    return this.querySelector<HTMLElement>(".ui-rti__list");
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("chunks")) {
      this.rank = new Map(this.chunks.map((c, i) => [c.id, i + 1]));
      let top = 0;
      for (const c of this.chunks) if (c.score > top) top = c.score;
      this.top = top;
    }
    if (changed.has("chunks") || changed.has("show")) {
      const used = this.chunks.filter((c) => c.used);
      this.counts = { all: this.chunks.length, used: used.length, unused: this.chunks.length - used.length };
      this.view = this.show === "used" ? used : this.show === "unused" ? this.chunks.filter((c) => !c.used) : this.chunks;
      const at = this.selected ? this.view.findIndex((c) => c.id === this.selected) : -1;
      this.active = at >= 0 ? at : Math.min(this.active, this.view.length - 1);
    }
    this.window.compute();
  }

  /** @internal The open chunk */
  private get open() {
    return this.selected ? this.chunks.find((c) => c.id === this.selected) : undefined;
  }

  /** @internal The top of the score scale */
  private get scale() {
    return this.maxScore ?? Math.max(1, this.top);
  }

  /** @internal */
  private below(c: { score?: number }) {
    return this.cutoff !== undefined && c.score !== undefined && c.score < this.cutoff;
  }

  /** @internal */
  private setShow(show: RetrievalShow, focus = false) {
    if (show !== this.show && this.emit<RetrievalShowChange>("tc-show-change", { show }, { cancelable: true })) this.show = show;
    void this.updateComplete.then(() => {
      this.spoken = `${SHOWS[this.show]}: ${plural(this.view.length, "chunk")}`;
      if (focus) this.querySelector<HTMLElement>(`.ui-rti__show [aria-checked="true"]`)?.focus();
    });
  }

  /** @internal */
  private select(id: string | null) {
    if (id === this.selected) return;
    const chunk = id ? this.chunks.find((c) => c.id === id) : undefined;
    if (this.emit<RetrievalSelectedChange>("tc-selected-change", { selected: id, ...(chunk ? { chunk } : {}) }, { cancelable: true })) this.selected = id;
  }

  /** @internal */
  private openSource(chunk: RetrievalChunk, e?: Event) {
    this.emit<RetrievalOpenSource>("tc-open-source", { chunk });
    if (this.openHandled) e?.preventDefault();
  }

  /** @internal Scrolls the list so a row is in view, and moves the window there */
  private reveal(i: number) {
    const list = this.list;
    if (!list) return;
    const h = this.window.rowHeight;
    if (i * h < list.scrollTop) list.scrollTop = i * h;
    else if ((i + 1) * h > list.scrollTop + list.clientHeight) list.scrollTop = (i + 1) * h - list.clientHeight;
    this.window.reveal(i);
  }

  /** @internal APG listbox, selection follows focus: ↑ ↓ Home End Page Up / Down; Enter opens the source; Esc closes */
  private onListKey = (e: KeyboardEvent) => {
    const n = this.view.length;
    if (!n) return;
    if (e.key === "Escape") {
      if (this.selected) {
        e.preventDefault();
        this.select(null);
      }
      return;
    }
    if (e.key === "Enter") {
      const c = this.view[this.active];
      if (c && (safeUrl(c.url) || this.openHandled)) {
        e.preventDefault();
        this.openSource(c);
        const url = safeUrl(c.url);
        if (url && !this.openHandled) window.open(url, "_blank", "noopener");
      }
      return;
    }
    const at = this.active;
    const moves: Record<string, number> = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: n - 1, PageDown: at + PAGE, PageUp: at - PAGE };
    if (!(e.key in moves)) return;
    e.preventDefault();
    const next = at < 0 && e.key !== "End" ? 0 : Math.max(0, Math.min(n - 1, moves[e.key]));
    this.active = next;
    this.reveal(next);
    this.select(this.view[next].id);
  };

  /** @internal APG radio group: arrows move and pick */
  private onShowKey = (e: KeyboardEvent) => {
    const all = Object.keys(SHOWS) as RetrievalShow[];
    const at = all.indexOf(this.show);
    const step: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(e.key in step)) return;
    e.preventDefault();
    this.setShow(all[(at + step[e.key] + all.length) % all.length], true);
  };

  protected override updated() {
    // An option outside the rendered rows has no id to point at until the window reaches it
    if (this.active >= 0 && this.window.virtual && !this.querySelector(`#${this.uid}-o${this.active}`)) this.window.reveal(this.active);
  }

  /** @internal A score as a bar on the scale, the cutoff marked */
  private bar(score: number) {
    const scale = this.scale;
    const share = Math.max(0, Math.min(1, score / scale));
    const cut = this.cutoff !== undefined ? Math.max(0, Math.min(1, this.cutoff / scale)) : undefined;
    return html`<span class="ui-rti__bar" aria-hidden="true">
      <span class="ui-rti__fill" style=${styleMap({ width: `${share * 100}%` })}></span>
      ${cut !== undefined ? html`<span class="ui-rti__cut" style=${styleMap({ left: `${cut * 100}%` })}></span>` : nothing}
    </span>`;
  }

  /** @internal "Used" with the answer's marker */
  private used(c: RetrievalChunk) {
    if (!c.used) return nothing;
    return html`<span class="ui-rti__used">Used${c.citation !== undefined ? html`<span class="ui-rti__cite"><span class="ui-rti__sr"> as </span>${c.citation}</span>` : nothing}</span>`;
  }

  /** @internal */
  private badge(c: RetrievalChunk, compact: boolean) {
    if (c.observed === undefined && !c.contested && !c.superseded) return nothing;
    return html`<tc-validity-badge
      class="ui-rti__fresh"
      look=${this.resolvedLook}
      ?compact=${compact}
      .observed=${c.observed}
      .profile=${c.profile ?? this.profile}
      .now=${this.now}
      ?contested=${!!c.contested}
      ?superseded=${!!c.superseded}
      subject-label="source"
    ></tc-validity-badge>`;
  }

  /** @internal One chunk's row */
  private row(c: RetrievalChunk, i: number) {
    const rank = this.rank.get(c.id) ?? i + 1;
    const below = this.below(c);
    return html`<div
      class="ui-rti__row"
      role="option"
      id=${`${this.uid}-o${i}`}
      aria-selected=${c.id === this.selected ? "true" : "false"}
      aria-posinset=${i + 1}
      aria-setsize=${this.view.length}
      ?data-active=${i === this.active}
      ?data-used=${!!c.used}
      ?data-below=${below}
      @click=${() => {
        this.active = i;
        this.select(c.id);
      }}
    >
      <span class="ui-rti__rank"><span class="ui-rti__sr">Rank </span>${rank}<span class="ui-rti__sr">: </span></span><span class="ui-rti__head"><span class="ui-rti__source">${c.source}</span>${c.location
        ? html`<span class="ui-rti__loc"><span class="ui-rti__sr">, </span>${c.location}</span>`
        : nothing}</span><span class="ui-rti__score"><span class="ui-rti__sr">, score </span>${this.bar(c.score)}<span class="ui-rti__num">${this.formatScore(c.score)}</span>${below
        ? html`<span class="ui-rti__sr">, below the cutoff</span>`
        : nothing}</span><span class="ui-rti__excerpt"><span class="ui-rti__sr">. </span>${c.text}</span><span class="ui-rti__meta">${c.used ? html`<span class="ui-rti__sr"> </span>` : nothing}${this.used(c)}${this.badge(c, true)}</span>
    </div>`;
  }

  /** @internal The open chunk in full */
  private detail() {
    const c = this.open;
    if (!c) return nothing;
    const rank = this.rank.get(c.id);
    const titleId = `${this.uid}-chunk`;
    const below = this.below(c);
    const terms = termsOf(this.query);
    // Whole words that start with a query word: "return" marks "returned" too
    const parts = terms.length ? c.text.split(new RegExp(`((?<![\\p{L}\\p{N}])(?:${terms.map(escape).join("|")})[\\p{L}\\p{N}]*)`, "giu")) : [c.text];
    const canOpen = !!c.url || this.openHandled;
    const pos = c.position;
    return html`<section class="ui-rti__detail" aria-labelledby=${titleId} @keydown=${(e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      this.select(null);
      this.list?.focus();
    }}>
      <div class="ui-rti__detail-head">
        <span class="ui-rti__detail-rank" aria-hidden="true">${rank}</span>
        <h4 class="ui-rti__detail-title" id=${titleId}><span class="ui-rti__sr">Rank ${rank}: </span>${c.source}</h4>
        <button type="button" class="ui-rti__close" aria-label="Close chunk" title="Close" @click=${() => {
          this.select(null);
          this.list?.focus();
        }}>${glyph(svg`<path d="M7 7l10 10M17 7L7 17"></path>`)}</button>
      </div>
      <dl class="ui-rti__facts">
        <div class="ui-rti__fact">
          <dt>Score</dt>
          <dd><span class="ui-rti__num">${this.formatScore(c.score)}</span>${this.cutoff !== undefined
            ? html`${" "}<span class="ui-rti__vs" ?data-below=${below}>${below ? "below" : "above"} the ${this.formatScore(this.cutoff)} cutoff</span>`
            : nothing}</dd>
        </div>
        <div class="ui-rti__fact">
          <dt>In the answer</dt>
          <dd>${c.used ? (c.citation !== undefined ? html`Cited as <span class="ui-rti__cite">${c.citation}</span>` : "Used") : html`<span class="ui-rti__quiet">Not used</span>`}</dd>
        </div>
        ${c.location || pos
          ? html`<div class="ui-rti__fact" data-wide>
              <dt>Where</dt>
              <dd>${c.location ?? ""}${c.location && pos ? " · " : ""}${pos ? `chunk ${pos.index + 1} of ${pos.count}` : ""}${pos && pos.count > 0
                ? html`<span class="ui-rti__pos" aria-hidden="true"><span style=${styleMap({ left: `${(pos.index / pos.count) * 100}%`, width: `${Math.max(100 / pos.count, 2)}%` })}></span></span>`
                : nothing}</dd>
            </div>`
          : nothing}
        ${c.observed !== undefined || c.contested || c.superseded ? html`<div class="ui-rti__fact" data-wide><dt>Freshness</dt><dd>${this.badge(c, false)}</dd></div>` : nothing}
      </dl>
      <blockquote class="ui-rti__text">${parts.map((p, k) => (k % 2 ? html`<mark class="ui-rti__hit">${p}</mark>` : p))}</blockquote>
      ${canOpen
        ? safeUrl(c.url)
          ? html`<a class="ui-rti__open" href=${ifDefined(safeUrl(c.url))} target="_blank" rel="noopener noreferrer" @click=${(e: Event) => this.openSource(c, e)}>${openIcon}Open source</a>`
          : html`<button type="button" class="ui-rti__open" @click=${() => this.openSource(c)}>${openIcon}Open source</button>`
        : nothing}
    </section>`;
  }

  /** @internal The misses the app reports */
  private missed() {
    if (!this.misses.length) return nothing;
    const id = `${this.uid}-missed`;
    return html`<section class="ui-rti__misses" aria-labelledby=${id}>
      <h4 class="ui-rti__misses-title" id=${id}>${missIcon}Missed<span class="ui-rti__count"><span class="ui-rti__sr">, </span>${this.misses.length}</span></h4>
      <ul class="ui-rti__miss-list">
        ${this.misses.map(
          (m) => html`<li class="ui-rti__miss">
            <span class="ui-rti__head"><span class="ui-rti__source">${m.source}</span>${m.location ? html`<span class="ui-rti__loc"><span class="ui-rti__sr">, </span>${m.location}</span>` : nothing}</span>
            ${m.score !== undefined ? html`<span class="ui-rti__score"><span class="ui-rti__sr">, score </span>${this.bar(m.score)}<span class="ui-rti__num">${this.formatScore(m.score)}</span></span>` : nothing}
            ${m.reason ? html`<span class="ui-rti__reason">${m.reason}</span>` : nothing}
            ${m.text ? html`<span class="ui-rti__miss-text">${m.text}</span>` : nothing}
          </li>`,
        )}
      </ul>
    </section>`;
  }

  protected override render() {
    const view = this.view;
    const { start, end } = this.window;
    const h = this.window.rowHeight;
    const titleId = `${this.uid}-title`;
    const activeId = this.active >= start && this.active < end ? `${this.uid}-o${this.active}` : undefined;
    const below = this.cutoff !== undefined ? this.chunks.filter((c) => this.below(c)).length : 0;
    const shows = Object.keys(SHOWS) as RetrievalShow[];
    const stats: [string, string, string?][] = [
      ["Retrieved", String(this.chunks.length)],
      ["Used", String(this.counts.used)],
      ...(this.cutoff !== undefined ? ([["Below cutoff", String(below)]] as [string, string][]) : []),
      ["Missed", String(this.misses.length), this.misses.length ? "missed" : undefined],
    ];
    return html`
      ${/* The header (.tc-head): on the tray in Standard, the card's first row in Clean */ cardHead({
        icon: mark,
        title: this.heading,
        id: titleId,
        subtitle: this.query ? html`<span class="ui-rti__query" title=${this.query}>“${this.query}”</span>` : undefined,
      })}
      <div class="ui-rti__card">
        <dl class="ui-rti__stats">
          ${stats.map(([label, value, kind]) => html`<div class="ui-rti__stat" data-kind=${ifDefined(kind)}><dt>${label}</dt><dd>${value}</dd></div>`)}
        </dl>
        <div class="ui-rti__filters">
          <div class="ui-rti__show" role="radiogroup" aria-label="Show" @keydown=${this.onShowKey}>
            ${shows.map(
              (s) => html`<button type="button" role="radio" class="ui-rti__opt" aria-checked=${s === this.show ? "true" : "false"} tabindex=${s === this.show ? 0 : -1} @click=${() => this.setShow(s)}>
                ${SHOWS[s]}<span class="ui-rti__count"><span class="ui-rti__sr">, </span>${this.counts[s]}<span class="ui-rti__sr"> ${this.counts[s] === 1 ? "chunk" : "chunks"}</span></span>
              </button>`,
            )}
          </div>
          ${this.cutoff !== undefined ? html`<span class="ui-rti__legend"><span class="ui-rti__legend-cut" aria-hidden="true"></span>Cutoff ${this.formatScore(this.cutoff)}</span>` : nothing}
        </div>
        <div class="ui-rti__main" ?data-open=${!!this.open}>
          <div
            class="ui-rti__list"
            role=${ifDefined(view.length ? "listbox" : undefined)}
            aria-labelledby=${ifDefined(view.length ? titleId : undefined)}
            aria-activedescendant=${ifDefined(activeId)}
            tabindex=${ifDefined(view.length ? 0 : undefined)}
            style=${styleMap({ maxHeight: `${this.maxHeight}px` })}
            @keydown=${this.onListKey}
            @focus=${() => {
              if (this.active < 0 && view.length) this.active = 0;
            }}
          >
            <div class="ui-rti__rows">
              <div class="ui-rti__spacer" aria-hidden="true" style=${styleMap({ height: `${start * h}px` })}></div>
              ${repeat(view.slice(start, end), (c) => c.id, (c, k) => this.row(c, start + k))}
              <div class="ui-rti__spacer" aria-hidden="true" style=${styleMap({ height: `${(view.length - end) * h}px` })}></div>
            </div>
            ${view.length === 0 ? html`<p class="ui-rti__empty">${this.chunks.length ? `No ${this.show === "used" ? "used" : "unused"} chunks` : "Nothing was retrieved"}</p>` : nothing}
          </div>
          ${this.detail()}
        </div>
        ${this.missed()}
      </div>
      <span class="ui-rti__sr" role="status">${this.spoken}</span>
    `;
  }

  static override css = /* css */ `
/* Colours and sizes as variables – override them on [data-ui="rti"] */
[data-ui="rti"] {
  --tc-retrieval-inspector-row: 56px;
  --tc-retrieval-inspector-bar: 56px;
  --tc-retrieval-inspector-fill: var(--tc-accent);
  --tc-retrieval-inspector-cut: var(--tc-status-warning-solid);
  --tc-retrieval-inspector-side: 380px;
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
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  container: ui-rti / inline-size;
}
/* Clean: no tray – one white card with hairline dividers */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="rti"] {
  --tc-retrieval-inspector-row: 54px;
  padding: 0;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  letter-spacing: normal;
}
[data-ui="rti"] *, [data-ui="rti"] *::before, [data-ui="rti"] *::after { box-sizing: border-box; }
[data-ui="rti"] svg { display: block; flex: none; }
[data-ui="rti"] :is(p, h4, dl, dd, ul, blockquote) { margin: 0; }
:where([data-ui="rti"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; letter-spacing: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="rti"] :is(button, a):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-rti__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-rti__glyph { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *) .ui-rti__glyph { stroke-width: 1.6; }
/* ----- The header: what was asked, under the title on one line ----- */
.ui-rti__query { display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
/* ----- The card: the numbers, the filter, the list ----- */
.ui-rti__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-rti__card { border-top: var(--tc-hairline) solid var(--tc-divider); border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); background: none; box-shadow: none; }
.ui-rti__stats { display: grid; grid-auto-columns: minmax(0, 1fr); grid-auto-flow: column; padding: var(--tc-space-3) 0; border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-rti__stat { display: grid; gap: var(--tc-space-0-5); min-width: 0; padding: 0 var(--tc-space-4); }
.ui-rti__stat + .ui-rti__stat { border-left: var(--tc-hairline) solid var(--tc-divider); }
.ui-rti__stat dt { overflow: hidden; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
.ui-rti__stat dd { font-size: var(--tc-font-size-xl); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
:where([data-look="clean"], [data-look="clean"] *).ui-rti__stat dt { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
:where([data-look="clean"], [data-look="clean"] *).ui-rti__stat dd { font-size: var(--tc-font-size-lg-plus); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-loose); }
.ui-rti__stat[data-kind="missed"] dd { color: var(--tc-status-warning-fg); }
.ui-rti__filters { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); padding: var(--tc-space-2-5) var(--tc-space-3); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-rti__show { display: flex; flex: none; padding: var(--tc-seg-pad); border-radius: var(--tc-seg-track-radius); background: var(--tc-seg-track-bg); }
.ui-rti__opt { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: calc(var(--tc-control-h-sm) - 2 * var(--tc-seg-pad)); padding: 0 var(--tc-space-2-5); border-radius: calc(var(--tc-seg-track-radius) - var(--tc-seg-pad)); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-text-secondary); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="rti"] .ui-rti__opt:hover { color: var(--tc-text-primary); }
[data-ui="rti"] .ui-rti__opt[aria-checked="true"] { background: var(--tc-seg-thumb-bg); box-shadow: var(--tc-seg-thumb-shadow); color: var(--tc-text-primary); }
.ui-rti__count { color: var(--tc-text-muted); font-weight: var(--tc-font-weight-regular); font-variant-numeric: tabular-nums; }
.ui-rti__legend { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); margin-left: auto; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-rti__legend-cut { width: 2px; height: 12px; border-radius: var(--tc-radius-2xs); background: var(--tc-retrieval-inspector-cut); }
/* ----- The list and the open chunk beside it (below it when narrow) ----- */
.ui-rti__main { display: grid; grid-template-columns: minmax(0, 1fr); }
.ui-rti__list { position: relative; overflow: auto; overscroll-behavior: contain; overflow-anchor: none; outline: none; }
.ui-rti__list:focus-visible:not(:has([data-active])) { outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-rti__spacer { display: block; }
/* One chunk: rank · source and place · score on the first line; the text · used and freshness on the second */
.ui-rti__row { display: grid; grid-template-columns: 28px minmax(0, 1fr) auto; grid-template-rows: auto auto; align-content: center; column-gap: var(--tc-space-3); row-gap: var(--tc-space-0-5); height: var(--tc-retrieval-inspector-row); padding: 0 var(--tc-space-4) 0 var(--tc-space-2); border-bottom: var(--tc-hairline) solid var(--tc-border-subtle); cursor: pointer; }
[data-ui="rti"] .ui-rti__row:hover { background: var(--tc-fill-subtle); }
.ui-rti__row[aria-selected="true"] { background: var(--tc-fill-selected); }
/* On the selected tint the quiet text steps up, so it keeps 4.5:1 */
.ui-rti__row[aria-selected="true"] :is(.ui-rti__rank, .ui-rti__loc, .ui-rti__excerpt) { color: var(--tc-text-secondary); }
[data-ui="rti"] .ui-rti__row[aria-selected="true"]:hover { background: var(--tc-fill-selected); }
.ui-rti__list:focus-visible .ui-rti__row[data-active] { border-radius: var(--tc-radius-sm); outline: var(--tc-focus-outline); outline-offset: calc(-1 * var(--tc-focus-ring-width)); }
.ui-rti__rank { grid-row: 1 / 3; align-self: center; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); text-align: right; font-variant-numeric: tabular-nums; }
.ui-rti__head { display: flex; align-items: baseline; gap: var(--tc-space-1-5); min-width: 0; overflow: hidden; white-space: nowrap; }
.ui-rti__source { flex: none; max-width: 100%; overflow: hidden; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); text-overflow: ellipsis; }
.ui-rti__loc { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); text-overflow: ellipsis; }
.ui-rti__excerpt { min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
.ui-rti__score { display: inline-flex; align-items: center; justify-content: flex-end; gap: var(--tc-space-2); }
.ui-rti__num { min-width: 32px; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); text-align: right; font-variant-numeric: tabular-nums; }
.ui-rti__row[data-below] .ui-rti__num { color: var(--tc-text-muted); }
/* The score bar: trace-waterfall's bar look, the cutoff a short upright tick */
.ui-rti__bar { position: relative; width: var(--tc-retrieval-inspector-bar); height: 6px; border-radius: var(--tc-radius-full); background: var(--tc-fill-default); }
.ui-rti__fill { position: absolute; top: 0; bottom: 0; left: 0; border-radius: inherit; background: var(--tc-retrieval-inspector-fill); }
.ui-rti__row[data-below] .ui-rti__fill, .ui-rti__miss .ui-rti__fill { background: var(--tc-text-disabled); }
.ui-rti__cut { position: absolute; top: -3px; bottom: -3px; width: 2px; border-radius: var(--tc-radius-2xs); background: var(--tc-retrieval-inspector-cut); translate: -50% 0; }
.ui-rti__meta { display: inline-flex; align-items: center; justify-content: flex-end; gap: var(--tc-space-2); min-height: 18px; }
.ui-rti__used { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-accent-subtle); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); color: var(--tc-accent-text); white-space: nowrap; }
/* The answer's citation marker: cited-answer's small numbered tab */
.ui-rti__cite { display: inline-grid; place-items: center; min-width: 16px; height: 16px; padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); font-size: var(--tc-font-size-2xs); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-tight); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-rti__empty { padding: var(--tc-space-5) var(--tc-space-4); color: var(--tc-text-muted); text-align: center; }
/* ----- The open chunk ----- */
.ui-rti__detail { display: grid; align-content: start; gap: var(--tc-space-3); min-width: 0; padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rti__detail-head { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; }
.ui-rti__detail-rank { display: grid; flex: none; place-items: center; min-width: 22px; height: 22px; padding: 0 var(--tc-space-1); border-radius: var(--tc-avatar-radius-agent); background: var(--tc-fill-default); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-rti__detail-title { flex: 1; min-width: 0; font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-semibold); line-height: var(--tc-line-height-snug); color: var(--tc-text-strong); overflow-wrap: anywhere; }
:where([data-look="clean"], [data-look="clean"] *).ui-rti__detail-title { font-weight: var(--tc-font-weight-medium); }
.ui-rti__close { display: grid; flex: none; place-items: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); margin: calc(-1 * var(--tc-space-1)) calc(-1 * var(--tc-space-1-5)) calc(-1 * var(--tc-space-1)) 0; border-radius: var(--tc-control-radius-sm); color: var(--tc-icon-muted); }
[data-ui="rti"] .ui-rti__close:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
.ui-rti__facts { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--tc-space-2) var(--tc-space-4); }
.ui-rti__fact { display: grid; align-content: start; gap: var(--tc-space-0-5); min-width: 0; }
.ui-rti__fact[data-wide] { grid-column: 1 / -1; }
.ui-rti__fact dt { font-size: var(--tc-font-size-xs); color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *) .ui-rti__fact[data-wide] { grid-column: 1 / -1; }
.ui-rti__fact dt { font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-rti__fact dd { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-1-5); font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); }
.ui-rti__fact .ui-rti__num { min-width: 0; text-align: left; }
.ui-rti__vs { color: var(--tc-text-muted); }
.ui-rti__vs[data-below] { color: var(--tc-status-warning-fg); }
.ui-rti__quiet { color: var(--tc-text-muted); }
/* Where the chunk sits in its document: a thin track, the chunk a short bar on it */
.ui-rti__pos { position: relative; display: block; flex: 1 1 100%; height: 4px; margin-top: var(--tc-space-0-5); border-radius: var(--tc-radius-full); background: var(--tc-fill-default); }
.ui-rti__pos > span { position: absolute; top: 0; bottom: 0; border-radius: inherit; background: var(--tc-text-muted); }
.ui-rti__text { max-height: 240px; overflow: auto; padding: var(--tc-space-2-5) var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-surface-well); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-relaxed); color: var(--tc-text-primary); white-space: pre-line; overflow-wrap: anywhere; }
.ui-rti__hit { padding: 0 var(--tc-space-0-5); border-radius: var(--tc-radius-xs); background: var(--tc-accent-highlight); color: inherit; }
.ui-rti__open { display: inline-flex; align-items: center; justify-self: start; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); text-decoration: none; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="rti"] .ui-rti__open:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
/* ----- What the app says was missed ----- */
.ui-rti__misses { display: grid; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-3-5); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rti__misses-title { display: flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-status-warning-fg); }
.ui-rti__misses-title .ui-rti__count { color: var(--tc-text-muted); }
.ui-rti__miss-list { display: grid; gap: var(--tc-space-2); padding: 0; list-style: none; }
.ui-rti__miss { display: grid; grid-template-columns: minmax(0, 1fr) auto; column-gap: var(--tc-space-3); row-gap: var(--tc-space-0-5); padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-radius-md); box-shadow: inset 0 0 0 1px var(--tc-status-warning-border); }
:where([data-look="clean"], [data-look="clean"] *).ui-rti__miss { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-status-warning-border); }
.ui-rti__reason { grid-column: 1 / -1; font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); }
.ui-rti__miss-text { grid-column: 1 / -1; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; }
/* Wide: the open chunk beside the list */
@container ui-rti (min-width: 860px) {
  .ui-rti__main[data-open] { grid-template-columns: minmax(0, 1fr) var(--tc-retrieval-inspector-side); }
  .ui-rti__main[data-open] .ui-rti__detail { border-top: 0; border-left: var(--tc-hairline) solid var(--tc-divider); }
}
/* Narrow: the numbers wrap, the place in the source gives way */
@container ui-rti (max-width: 520px) {
  .ui-rti__stats { grid-auto-flow: row; grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: var(--tc-space-2-5); }
  .ui-rti__stat:nth-child(odd) { border-left: 0; }
  .ui-rti__loc { display: none; }
  .ui-rti__card { --tc-retrieval-inspector-bar: 36px; }
  .ui-rti__show { flex: 1 1 100%; }
  .ui-rti__opt { flex: 1; justify-content: center; }
  .ui-rti__legend { margin-left: 0; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="rti"] *, [data-ui="rti"] *::before, [data-ui="rti"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-retrieval-inspector")) customElements.define("tc-retrieval-inspector", TcRetrievalInspector);

declare global {
  interface HTMLElementTagNameMap {
    "tc-retrieval-inspector": TcRetrievalInspector;
  }
}
