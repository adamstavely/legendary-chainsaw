import { html, nothing, svg, type PropertyValues, type TemplateResult } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { PopoverController } from "./internal/popover";
import { segments } from "./internal/selection";

/*
 * <tc-reasoning-flags> – an answer's text with inline markers where its reasoning looks weak: circular reasoning, a
 * hedge followed by a confident conclusion, a self-contradiction, or more certainty than the evidence supports (and
 * any kind the app defines). Each flagged span gets a subtle dotted underline and a small flag marker after it;
 * hovering the span or the marker (after a short pause), or focusing the marker, opens a card that names the pattern,
 * explains it in plain words and, when the app wants it, offers "Ask the model to reconsider". A summary chip
 * ("2 reasoning flags") leads to the first one. The flags are advisory – the card says they're detected automatically.
 *
 *   <tc-reasoning-flags .text=${answer} .flags=${[{ start: 120, end: 188, kind: "hedge-then-certain", explanation: "…" }]}
 *     reconsider @tc-reconsider=${(e) => ask(e.detail.flag)}></tc-reasoning-flags>
 *
 * The app finds the flags; the component only shows them. `flags` is `{ id?, start, end, kind, explanation }[]` with
 * UTF-16 offsets into `text` (`end` exclusive). `kinds` names each kind (built-in: circular, hedge-then-certain,
 * self-contradiction, overconfidence) – add your own, or rename these, by key.
 *
 * Keyboard. The summary chip and each marker are in the tab order. The chip moves focus to the first marker. Focus on
 * a marker opens its card; with "Ask the model to reconsider" on, Tab or Enter moves into the card, Shift + Tab goes
 * back to the marker and Tab from the button moves on to the next marker. Esc closes the card (focus returns to the
 * marker). The pointer can move from the span or marker into the card without it closing. Without the button the card
 * is a tooltip that describes its marker.
 *
 * It's inline, not a card: no header or tray in either look. Standard gives each marker a small filled badge and the
 * chip a tinted fill; Clean draws the marker as a thin outlined flag and the chip with a hairline.
 */

/** One flagged span: UTF-16 offsets into `text` (`end` exclusive), the kind (a key of `kinds`) and a plain-language explanation */
export type ReasoningFlag = { id?: string; start: number; end: number; kind: string; explanation: string };
/** How a kind is named, and what the pattern means in general */
export type ReasoningFlagKind = { label: string; description?: string };
/** tc-reconsider: the flag the person wants the model to look at again, and its index in `flags` */
export type ReasoningReconsiderDetail = { flag: ReasoningFlag; index: number };
/** tc-open-change: the flag whose card opened, or null when it closed */
export type ReasoningOpenChange = { flag: ReasoningFlag | null; index: number };

/** The built-in kinds */
export const REASONING_KINDS: Record<string, ReasoningFlagKind> = {
  circular: { label: "Circular reasoning", description: "The conclusion restates what it set out to show, so it adds no support of its own." },
  "hedge-then-certain": { label: "Hedged, then certain", description: "It opens with uncertainty, then states a conclusion more firmly than the hedge allows." },
  "self-contradiction": { label: "Self-contradiction", description: "It says one thing here and the opposite elsewhere in the same answer." },
  overconfidence: { label: "More certain than the evidence", description: "The conclusion is stated more confidently than the evidence behind it supports." },
};

/** "hedge-then-certain" → "Hedge then certain", for kinds with no label */
const humanize = (kind: string) => {
  const s = kind.replace(/[-_]+/g, " ").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : "Reasoning flag";
};
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
const glyph = (d: TemplateResult, cls: string) => html`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const flagIcon = svg`<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><path d="M4 22v-7"></path>`;
const askIcon = svg`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path>`;
const checkIcon = svg`<path d="M20 6 9 17l-5-5"></path>`;

let instances = 0;

/**
 * Inline markers for weak reasoning in an answer, each opening a plain explanation.
 * @tag tc-reasoning-flags
 * @fires tc-reconsider - "Ask the model to reconsider" was pressed on a flag ({ flag, index }: ReasoningReconsiderDetail)
 * @fires tc-open-change - A flag's card opened or closed ({ flag, index }: ReasoningOpenChange; flag null when closed)
 */
export class TcReasoningFlags extends TcElement {
  static override ui = "rfl";

  /** The answer's text: plain text, shown as written (line breaks kept). Flags' offsets index into it */
  @property() accessor text = "";
  /** The flagged spans, from the app: `{ id?, start, end, kind, explanation }[]` */
  @property({ attribute: false }) accessor flags: ReasoningFlag[] = [];
  /** Names and descriptions by kind, merged over the built-in ones */
  @property({ attribute: false }) accessor kinds: Record<string, ReasoningFlagKind> = {};
  /** Offer "Ask the model to reconsider" in each card (fires tc-reconsider) */
  @property({ type: Boolean }) accessor reconsider = false;
  /** The reconsider button's text */
  @property({ attribute: "reconsider-label" }) accessor reconsiderLabel = "Ask the model to reconsider";
  /** Hide the summary chip ("2 reasoning flags") */
  @property({ type: Boolean, attribute: "no-summary" }) accessor noSummary = false;
  /** The line at the foot of each card – that the flags are automatic and advisory */
  @property() accessor note = "Detected automatically – it may be wrong.";
  /** How long the pointer rests on a span or marker before its card opens, ms */
  @property({ type: Number, attribute: "hover-delay" }) accessor hoverDelay = 300;

  /** @internal The open card's flag (index into `shown`), or -1 */
  @state() accessor openAt = -1;
  /** @internal The flag whose span is under the pointer */
  @state() accessor hotAt = -1;
  /** @internal Flags already sent back to the model (by key) */
  @state() accessor asked: ReadonlySet<string> = new Set();
  /** @internal What the status region says */
  @state() accessor said = "";

  private readonly uid = `tc-rfl${++instances}`;
  private openFlag: ReasoningFlag | null = null;

  private readonly pop = new PopoverController(this, {
    popover: () => this.querySelector<HTMLElement>(".ui-rfl__pop"),
    anchor: () => {
      const m = this.markerAt(this.openAt);
      return m?.isConnected ? m : null;
    },
    side: "bottom",
    align: "center",
    returnFocus: () => this.markerAt(this.openAt),
    inside: () => [...this.querySelectorAll(`.ui-rfl__span[data-i~="${this.openAt}"]`)],
    hover: { delay: () => this.hoverDelay },
    tabBridge: true,
    closeOnFocusOut: true,
    onClose: () => this.closed(),
  });

  /** @internal The flags that point at real text, in reading order */
  get shown(): ReasoningFlag[] {
    const n = this.text.length;
    return (this.flags ?? [])
      .filter((f) => f && Number.isInteger(f.start) && Number.isInteger(f.end) && f.start >= 0 && f.end > f.start && f.end <= n)
      .sort((a, b) => a.start - b.start || a.end - b.end);
  }

  private kindOf(f: ReasoningFlag): ReasoningFlagKind {
    const k = this.kinds?.[f.kind] ?? REASONING_KINDS[f.kind];
    return { label: k?.label || humanize(f.kind), description: k?.description };
  }
  private keyOf(f: ReasoningFlag, i: number) {
    return f.id ?? `${i}:${f.start}:${f.end}:${f.kind}`;
  }

  /** Opens the card for the flag at `index` in reading order (sorted by start), pinned open; focus stays where it is */
  openCard(index = 0) {
    this.open(index, { pin: true });
  }

  /** Closes the open card, if any */
  closeCard() {
    this.close();
  }

  /* ---------- Opening and closing ---------- */

  private markerAt(i: number) {
    return i < 0 ? null : this.querySelector<HTMLElement>(`.ui-rfl__marker[data-i="${i}"]`);
  }

  private open(i: number, how: { pin?: boolean; focus?: boolean } = {}) {
    const f = this.shown[i];
    if (!f) return;
    if (this.openAt !== i) {
      if (this.openAt >= 0) this.pop.pinned = false;
      this.openAt = i;
      this.openFlag = f;
      this.emit<ReasoningOpenChange>("tc-open-change", { flag: f, index: this.flags.indexOf(f) });
    }
    this.pop.show({ focus: !!how.focus && this.reconsider, pin: !!how.pin });
  }

  private close() {
    if (this.pop.open) this.pop.close();
    else this.closed();
  }

  private closed() {
    if (this.openAt < 0) return;
    this.openAt = -1;
    this.openFlag = null;
    this.emit<ReasoningOpenChange>("tc-open-change", { flag: null, index: -1 });
  }

  private onMarkerClick(e: MouseEvent, i: number) {
    if (e.detail === 0) this.open(i, { pin: true, focus: true });
    else if (this.openAt === i && this.pop.pinned) this.close();
    else this.open(i, { pin: true });
  }

  /** The summary chip: to the first flag */
  private goFirst() {
    const m = this.querySelector<HTMLElement>(".ui-rfl__marker");
    if (!m) return;
    m.focus();
    m.scrollIntoView?.({ block: "nearest" });
    this.open(Number(m.dataset.i), { pin: true });
  }

  private ask(f: ReasoningFlag, i: number) {
    const key = this.keyOf(f, i);
    if (this.asked.has(key)) return;
    this.emit<ReasoningReconsiderDetail>("tc-reconsider", { flag: f, index: this.flags.indexOf(f) });
    this.asked = new Set([...this.asked, key]);
    this.say(`Asked the model to reconsider: ${this.kindOf(f).label.toLowerCase()}`);
  }

  private say(text: string) {
    this.said = this.said === text ? `${text} ` : text;
  }

  /* ---------- Render ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (!changed.has("flags") && !changed.has("text")) return;
    const list = this.shown;
    // The open card follows its flag to its new place, or closes if it's gone
    const was = this.openFlag;
    if (this.openAt >= 0 && was) {
      const same = (f: ReasoningFlag) => f === was || (was.id !== undefined ? f.id === was.id : f.start === was.start && f.end === was.end && f.kind === was.kind);
      const at = list.findIndex(same);
      if (at >= 0) {
        this.openAt = at;
        this.openFlag = list[at];
      } else {
        this.openAt = -1;
        this.openFlag = null;
        if (this.pop.open) this.pop.close("anchor-gone");
      }
    }
    // Forget "asked" for flags that went away
    const keys = new Set(list.map((f, i) => this.keyOf(f, i)));
    if ([...this.asked].some((k) => !keys.has(k))) this.asked = new Set([...this.asked].filter((k) => keys.has(k)));
  }

  private renderText(list: ReasoningFlag[]) {
    const ranges = list.map((f, i) => ({ start: f.start, end: f.end, i }));
    return segments(this.text, ranges).map((seg) => {
      if (!seg.ranges.length) return seg.text;
      const top = seg.ranges[0].i;
      const ids = seg.ranges.map((r) => r.i).join(" ");
      const hot = seg.ranges.some((r) => r.i === this.openAt || r.i === this.hotAt);
      // Flags ending here: the inner one (started later) first, so markers nest like the spans
      const ending = seg.ranges.filter((r) => r.end === seg.end).sort((a, b) => b.start - a.start || a.i - b.i);
      return html`<span
          class="ui-rfl__span"
          data-i=${ids}
          data-kind=${list[top].kind}
          ?data-hot=${hot}
          ?data-multi=${seg.ranges.length > 1}
          @pointerenter=${(e: PointerEvent) => {
            this.hotAt = top;
            this.pop.hoverEnter(e, () => this.open(top));
          }}
          @pointerleave=${(e: PointerEvent) => {
            this.hotAt = -1;
            this.pop.hoverLeave(e);
          }}
          >${seg.text}</span
        >${ending.map((r) => this.renderMarker(list[r.i], r.i))}`;
    });
  }

  private renderMarker(f: ReasoningFlag, i: number) {
    const open = this.openAt === i && this.pop.open;
    const label = this.kindOf(f).label;
    return html`<button
      type="button"
      class="ui-rfl__marker"
      data-i=${i}
      data-kind=${f.kind}
      aria-label=${`Reasoning flag: ${label}`}
      aria-haspopup=${ifDefined(this.reconsider ? "dialog" : undefined)}
      aria-expanded=${open ? "true" : "false"}
      aria-describedby=${ifDefined(open ? `${this.uid}-why` : undefined)}
      title=${ifDefined(open ? undefined : label)}
      ?data-open=${open}
      @pointerenter=${(e: PointerEvent) => this.pop.hoverEnter(e, () => this.open(i))}
      @pointerleave=${this.pop.hoverLeave}
      @click=${(e: MouseEvent) => this.onMarkerClick(e, i)}
      @focus=${() => (this.openAt !== i || !this.pop.open) && this.open(i)}
    >
      ${glyph(flagIcon, "ui-rfl__flag")}
    </button>`;
  }

  private renderCard(list: ReasoningFlag[]) {
    const f = list[this.openAt];
    if (!this.pop.open || !f) return nothing;
    const k = this.kindOf(f);
    const done = this.asked.has(this.keyOf(f, this.openAt));
    const i = this.openAt;
    return html`<div
      class="tc-pop ui-rfl__pop"
      role=${this.reconsider ? "dialog" : "tooltip"}
      id=${`${this.uid}-card`}
      aria-labelledby=${`${this.uid}-kind`}
      data-kind=${f.kind}
    >
      <p class="ui-rfl__kind" id=${`${this.uid}-kind`}>${glyph(flagIcon, "ui-rfl__kind-icon")}<span>${k.label}</span></p>
      <p class="ui-rfl__why" id=${`${this.uid}-why`}>${f.explanation}</p>
      ${k.description ? html`<p class="ui-rfl__about">${k.description}</p>` : nothing}
      <div class="ui-rfl__foot">
        <p class="ui-rfl__note">${this.note}</p>
        ${this.reconsider
          ? html`<button type="button" class="ui-rfl__ask" aria-disabled=${done ? "true" : "false"} ?data-done=${done} @click=${() => this.ask(f, i)}>
              ${glyph(done ? checkIcon : askIcon, "ui-rfl__glyph")}<span>${done ? "Asked to reconsider" : this.reconsiderLabel}</span>
            </button>`
          : nothing}
      </div>
    </div>`;
  }

  protected override render() {
    const list = this.shown;
    return html`${!this.noSummary && list.length
        ? html`<div class="ui-rfl__summary">
            <button type="button" class="ui-rfl__chip" @click=${() => this.goFirst()}>${glyph(flagIcon, "ui-rfl__glyph")}<span>${plural(list.length, "reasoning flag")}</span></button>
          </div>`
        : nothing}
      <div class="ui-rfl__text">${this.renderText(list)}</div>
      ${this.renderCard(list)}<span class="ui-rfl__sr" role="status">${this.said}</span>`;
  }

  static override css = /* css */ `
[data-ui="rfl"] {
  position: relative;
  box-sizing: border-box;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-lg);
  line-height: var(--tc-line-height-relaxed);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  --rfl-ink: var(--tc-status-warning-fg);
  --rfl-line: color-mix(in srgb, var(--tc-status-warning-solid) 70%, transparent);
}
[data-ui="rfl"] *, .ui-rfl__pop *, .ui-rfl__pop *::before, .ui-rfl__pop *::after { box-sizing: border-box; }
:where([data-ui="rfl"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; letter-spacing: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
:where([data-ui="rfl"]) p { margin: 0; padding: 0; }
[data-ui="rfl"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-rfl__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-rfl__glyph { display: block; flex: none; width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
:where([data-look="clean"], [data-look="clean"] *).ui-rfl__glyph { stroke-width: 1.4; }
/* ----- The summary chip ----- */
.ui-rfl__summary { margin-bottom: var(--tc-space-2); }
.ui-rfl__chip { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-pill-h-lg); padding: 0 var(--tc-pill-px-lg); border-radius: var(--tc-pill-radius); color: var(--rfl-ink); font-size: var(--tc-pill-font-size-lg); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-rfl__chip .ui-rfl__glyph { width: 12px; height: 12px; }
:where([data-look="standard"], [data-look="standard"] *).ui-rfl__chip { background: var(--tc-status-warning-bg); }
:where([data-look="standard"], [data-look="standard"] *).ui-rfl__chip:hover { box-shadow: inset 0 0 0 1px var(--tc-status-warning-border); }
:where([data-look="clean"], [data-look="clean"] *).ui-rfl__chip { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); color: var(--tc-text-secondary); }
:where([data-look="clean"], [data-look="clean"] *).ui-rfl__chip .ui-rfl__glyph { color: var(--rfl-ink); }
:where([data-look="clean"], [data-look="clean"] *).ui-rfl__chip:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
/* ----- The text: flagged spans and their markers ----- */
.ui-rfl__text { white-space: pre-wrap; overflow-wrap: break-word; }
:where([data-look="clean"], [data-look="clean"] *).ui-rfl__text { color: var(--tc-text-secondary); }
.ui-rfl__span { text-decoration: underline dotted var(--rfl-line); text-decoration-thickness: 2px; text-underline-offset: 4px; text-decoration-skip-ink: none; border-radius: var(--tc-radius-2xs); box-decoration-break: clone; -webkit-box-decoration-break: clone; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-rfl__span { text-decoration-thickness: 1.5px; }
.ui-rfl__span[data-multi] { text-decoration-style: solid; }
.ui-rfl__span[data-hot] { background: var(--tc-status-warning-bg); text-decoration-color: var(--tc-status-warning-solid); color: var(--tc-text-primary); }
.ui-rfl__marker { display: inline-grid; place-items: center; width: 18px; height: 18px; margin: 0 var(--tc-space-0-5); border-radius: 50%; color: var(--rfl-ink); vertical-align: -3px; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
/* A bigger target than it looks */
.ui-rfl__marker { position: relative; }
.ui-rfl__marker::after { content: ""; position: absolute; inset: -3px; }
.ui-rfl__flag { width: 11px; height: 11px; fill: none; stroke: currentColor; stroke-linecap: round; stroke-linejoin: round; stroke-width: 2.2; }
:where([data-look="standard"], [data-look="standard"] *).ui-rfl__marker { background: var(--tc-status-warning-bg); box-shadow: inset 0 0 0 1px var(--tc-status-warning-border); }
:where([data-look="standard"], [data-look="standard"] *).ui-rfl__marker:is(:hover, [data-open]) { background: var(--tc-status-warning-solid); color: var(--tc-text-on-accent); box-shadow: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-rfl__flag { stroke-width: 1.8; width: 12px; height: 12px; }
:where([data-look="clean"], [data-look="clean"] *).ui-rfl__marker:is(:hover, [data-open]) { background: var(--tc-status-warning-bg); }
/* ----- The card (internal/popover.ts places it) ----- */
.tc-pop.ui-rfl__pop { display: grid; gap: var(--tc-space-1-5); width: 300px; padding: var(--tc-space-3); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-snug); text-align: left; -webkit-font-smoothing: antialiased; }
.ui-rfl__pop p { margin: 0; padding: 0; }
.ui-rfl__pop button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
.ui-rfl__pop button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-rfl__kind { display: flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-primary); font-size: var(--tc-font-size-md); font-weight: var(--tc-font-weight-strong); }
.ui-rfl__kind-icon { flex: none; width: 14px; height: 14px; fill: none; stroke: var(--tc-status-warning-fg); stroke-linecap: round; stroke-linejoin: round; stroke-width: 1.8; }
.ui-rfl__why { color: var(--tc-text-primary); overflow-wrap: anywhere; }
.ui-rfl__about { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); }
.ui-rfl__foot { display: grid; gap: var(--tc-space-2); margin-top: var(--tc-space-1); padding-top: var(--tc-space-2); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-rfl__note { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); }
.ui-rfl__ask { display: inline-flex; align-items: center; justify-self: start; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; }
.ui-rfl__ask:hover { background: var(--tc-fill-hover); }
.ui-rfl__ask[data-done] { background: none; box-shadow: none; padding: 0; color: var(--tc-status-success-fg); cursor: default; }
@media (forced-colors: active) {
  .ui-rfl__span { text-decoration-color: CanvasText; }
  .ui-rfl__span[data-hot] { forced-color-adjust: none; background: Mark; color: MarkText; }
  .ui-rfl__marker, .ui-rfl__chip { border: 1px solid ButtonText; }
}
@media (pointer: coarse) {
  .ui-rfl__marker::after { inset: -10px; }
  .ui-rfl__ask { height: var(--tc-control-h-md); }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="rfl"] *, .ui-rfl__pop, .ui-rfl__pop * { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-reasoning-flags")) customElements.define("tc-reasoning-flags", TcReasoningFlags);

declare global {
  interface HTMLElementTagNameMap {
    "tc-reasoning-flags": TcReasoningFlags;
  }
}
