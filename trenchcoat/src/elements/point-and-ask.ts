import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { safeMediaUrl } from "./internal/safe-media";

/*
 * <tc-point-and-ask> – point at part of an image, then ask about it. A click drops a numbered pin, a drag draws a box;
 * each mark gets its own short question, and one question can cover them all. Ask hands the page every mark with its
 * question, in fractions of the image, and the page streams answers back – one per mark under it, and one overall.
 *   · marks are listed beside the image (below it when narrow): the number button there selects and focuses the mark
 *     on the image, where the arrow keys nudge it (Shift for 10 px), Alt + arrows resize a box, and Delete removes it
 *   · "Add pin" and "Add box" drop a mark in the middle, so the whole task works from the keyboard
 *   · marks can be dragged to move them; the list is controllable (`marks`, tc-marks-change)
 *   · `busy` holds everything while the page answers
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-point-and-ask src="report-page.png" alt="Page 4 of the annual report"></tc-point-and-ask>
 */

/** A mark on the image: a pin at (x, y) or a box from (x, y), w wide and h tall – all fractions (0–1) of the image */
export type PointMark = { id: string; kind: "pin" | "box"; x: number; y: number; w?: number; h?: number; question?: string };
/** Detail of tc-marks-change */
export type PointMarksChange = { marks: PointMark[]; reason: "add" | "move" | "resize" | "remove" | "question" | "clear"; id?: string };
/** Detail of tc-question-change */
export type PointQuestionChange = { question: string };
/** Detail of tc-ask: every mark with its question, and the question over all of them */
export type PointAsk = { marks: (PointMark & { question: string })[]; question: string };

/** The words on the element; a page can rename any of them */
export const defaultPointAndAskLabels = {
  marks: "Marks on the image",
  list: "Marks",
  pin: "Pin",
  box: "Box",
  addPin: "Add pin",
  addBox: "Add box",
  clearAll: "Clear all",
  remove: "Remove",
  markQuestion: "Ask about this",
  noQuestion: "no question yet",
  question: "Your question",
  placeholder: "What do these parts show?",
  ask: "Ask",
  asking: "Asking…",
  answer: "Answer",
  empty: "Click the image to drop a pin, or drag to draw a box.",
  keys: "Arrow keys move the mark, Shift + arrow keys move it further, Alt + arrow keys resize a box, Delete removes it, Enter goes to its question.",
  added: "added",
  removed: "removed",
  cleared: "All marks removed",
  ready: "Answers ready",
  needsSomething: "Mark part of the image or write a question first.",
};
export type PointAndAskLabels = typeof defaultPointAndAskLabels;

const MIN_BOX = 0.02;
const DRAG = 4;
const round4 = (n: number) => Math.round(n * 10000) / 10000;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

const ico = (paths: ReturnType<typeof svg>) => html`<svg class="ui-paq__ico" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;
// Lucide icons (ISC): scan-search, map-pin, square-dashed, x
const ICONS = {
  head: svg`<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/><path d="m16 16-1.9-1.9"/>`,
  pin: svg`<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>`,
  box: svg`<path d="M5 3a2 2 0 0 0-2 2"/><path d="M19 3a2 2 0 0 1 2 2"/><path d="M21 19a2 2 0 0 1-2 2"/><path d="M5 21a2 2 0 0 1-2-2"/><path d="M9 3h1"/><path d="M9 21h1"/><path d="M14 3h1"/><path d="M14 21h1"/><path d="M3 9v1"/><path d="M21 9v1"/><path d="M3 14v1"/><path d="M21 14v1"/>`,
  remove: svg`<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`,
};

let instances = 0;

/**
 * Pin or box parts of an image, ask about each and about all of them – marks you can move, resize and remove from the
 * keyboard, and answers streamed back per mark.
 * @tag tc-point-and-ask
 * @fires tc-marks-change - A mark was added, moved, resized, removed or given a question ({ marks, reason, id }: PointMarksChange); cancelable – prevented, the marks stay as they were
 * @fires tc-question-change - The overall question was edited ({ question }: PointQuestionChange); cancelable – prevented, the text goes back
 * @fires tc-ask - Ask was pressed ({ marks, question }: PointAsk); cancelable – not prevented, the element turns `busy` until the page clears it
 */
export class TcPointAndAsk extends TcElement {
  static override ui = "paq";

  /** The title above the image */
  @property() accessor heading = "Ask about the image";
  /** One line under the title */
  @property() accessor description: string | undefined = undefined;
  /** The image */
  @property() accessor src = "";
  /** What the image shows, for screen readers */
  @property() accessor alt = "";
  /** The marks, in order; their numbers follow it */
  @property({ attribute: false }) accessor marks: PointMark[] = [];
  /** The question over all the marks */
  @property() accessor question = "";
  /** Answers by mark id, shown under each mark (update it as the text streams in) */
  @property({ attribute: false }) accessor answers: Record<string, string> = {};
  /** The answer to the overall question */
  @property() accessor answer = "";
  /** Holds everything while the page answers; Ask turns it on unless tc-ask is prevented */
  @property({ type: Boolean, reflect: true }) accessor busy = false;
  /** Words the page can rename (merged over defaultPointAndAskLabels) */
  @property({ attribute: false }) accessor labels: Partial<PointAndAskLabels> = {};

  /** @internal The image's width over its height, once loaded */
  @state() accessor aspect = 4 / 3;
  /** @internal The mark with focus on the image */
  @state() accessor selected: string | null = null;
  /** @internal A box being drawn, or a mark being dragged, in fractions */
  @state() accessor draft: PointMark | null = null;
  /** @internal Why Ask can't run yet */
  @state() accessor hint = "";
  /** @internal The live region's text */
  @state() accessor announce = "";

  private readonly uid = `tc-paq${++instances}`;
  private seq = 0;
  private press: { id: number; rect: DOMRect; x: number; y: number; cx: number; cy: number; mark?: PointMark; moved: boolean } | null = null;

  private get words(): PointAndAskLabels {
    return { ...defaultPointAndAskLabels, ...this.labels };
  }
  private kindWord(m: PointMark) {
    return m.kind === "pin" ? this.words.pin : this.words.box;
  }
  private name(m: PointMark) {
    return `${this.kindWord(m)} ${this.marks.findIndex((x) => x.id === m.id) + 1}`;
  }

  /* ---------- Lifecycle ---------- */

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("marks") && this.selected && !this.marks.some((m) => m.id === this.selected)) this.selected = this.marks[0]?.id ?? null;
    if (changed.has("busy") && changed.get("busy") === true && !this.busy) this.say(this.words.ready);
    if ((changed.has("marks") && this.marks.length) || (changed.has("question") && this.question.trim())) this.hint = "";
  }

  /* ---------- Changes ---------- */

  private propose(marks: PointMark[], reason: PointMarksChange["reason"], id?: string, say?: string) {
    if (!this.emit<PointMarksChange>("tc-marks-change", { marks, reason, id }, { cancelable: true })) {
      this.requestUpdate();
      return false;
    }
    this.marks = marks;
    if (say) this.say(say);
    return true;
  }
  private say(text: string) {
    this.announce = this.announce === text ? `${text} ` : text;
  }
  private nextId() {
    let id: string;
    do id = `m${++this.seq}`;
    while (this.marks.some((m) => m.id === id));
    return id;
  }

  /** Adds a mark (a pin in the middle, or a box around it, by default) and selects it */
  addMark(kind: "pin" | "box", at?: Partial<PointMark>) {
    if (this.busy) return;
    const mark: PointMark =
      kind === "pin"
        ? { id: this.nextId(), kind, x: round4(at?.x ?? 0.5), y: round4(at?.y ?? 0.5), question: "" }
        : { id: this.nextId(), kind, x: round4(at?.x ?? 0.35), y: round4(at?.y ?? 0.35), w: round4(at?.w ?? 0.3), h: round4(at?.h ?? 0.3), question: "" };
    const marks = [...this.marks, mark];
    if (this.propose(marks, "add", mark.id, `${this.kindWord(mark)} ${marks.length} ${this.words.added}`)) this.selected = mark.id;
  }
  /** Removes a mark */
  removeMark(id: string) {
    if (this.busy) return;
    const i = this.marks.findIndex((m) => m.id === id);
    if (i < 0) return;
    const name = this.name(this.marks[i]);
    const marks = this.marks.filter((m) => m.id !== id);
    if (!this.propose(marks, "remove", id, `${name} ${this.words.removed}`)) return;
    this.selected = marks[Math.min(i, marks.length - 1)]?.id ?? null;
  }
  private clearAll() {
    if (this.busy || !this.marks.length) return;
    if (this.propose([], "clear", undefined, this.words.cleared)) this.selected = null;
  }
  private update1(id: string, patch: Partial<PointMark>, reason: PointMarksChange["reason"]) {
    const marks = this.marks.map((m) => (m.id === id ? { ...m, ...patch } : m));
    return this.propose(marks, reason, id);
  }

  /* ---------- Pointer ---------- */

  private frac(e: PointerEvent, rect: DOMRect) {
    return { x: clamp((e.clientX - rect.left) / (rect.width || 1), 0, 1), y: clamp((e.clientY - rect.top) / (rect.height || 1), 0, 1) };
  }
  private onDown = (e: PointerEvent) => {
    if (this.busy || this.press) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const surface = this.querySelector<HTMLElement>(".ui-paq__surface");
    if (!surface) return;
    const markEl = (e.target as Element).closest<HTMLElement>(".ui-paq__mark");
    const mark = markEl ? this.marks.find((m) => m.id === markEl.dataset.id) : undefined;
    e.preventDefault();
    try {
      surface.setPointerCapture(e.pointerId);
    } catch {
      // A synthetic or vanished pointer can't be captured; its pointerup still ends the press
    }
    const rect = surface.getBoundingClientRect();
    const p = this.frac(e, rect);
    this.press = { id: e.pointerId, rect, x: p.x, y: p.y, cx: e.clientX, cy: e.clientY, mark, moved: false };
    if (mark) {
      this.selected = mark.id;
      markEl?.focus();
    }
  };
  private onMove = (e: PointerEvent) => {
    const pr = this.press;
    if (!pr || e.pointerId !== pr.id) return;
    if (!pr.moved && Math.hypot(e.clientX - pr.cx, e.clientY - pr.cy) < DRAG) return;
    pr.moved = true;
    const p = this.frac(e, pr.rect);
    if (pr.mark) {
      const m = pr.mark;
      const w = m.w ?? 0;
      const h = m.h ?? 0;
      this.draft = { ...m, x: round4(clamp(m.x + p.x - pr.x, 0, 1 - w)), y: round4(clamp(m.y + p.y - pr.y, 0, 1 - h)) };
    } else {
      this.draft = { id: "", kind: "box", x: round4(Math.min(pr.x, p.x)), y: round4(Math.min(pr.y, p.y)), w: round4(Math.abs(p.x - pr.x)), h: round4(Math.abs(p.y - pr.y)) };
    }
  };
  private onUp = (e: PointerEvent) => {
    const pr = this.press;
    if (!pr || e.pointerId !== pr.id) return;
    this.press = null;
    const d = this.draft;
    this.draft = null;
    if (e.type === "pointercancel") return;
    if (pr.mark) {
      if (pr.moved && d) this.update1(pr.mark.id, { x: d.x, y: d.y }, "move");
      return;
    }
    if (pr.moved && d && (d.w ?? 0) >= MIN_BOX && (d.h ?? 0) >= MIN_BOX) this.addMark("box", d);
    else if (!pr.moved) this.addMark("pin", { x: pr.x, y: pr.y });
  };

  /* ---------- Keyboard ---------- */

  private onMarkKey = (e: KeyboardEvent, m: PointMark) => {
    if (this.busy) return;
    const rect = this.querySelector<HTMLElement>(".ui-paq__surface")?.getBoundingClientRect();
    const px = 1 / (rect?.width || 400);
    const py = 1 / (rect?.height || 300);
    const n = e.shiftKey ? 10 : 1;
    const dirs: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const dir = dirs[e.key];
    if (dir) {
      e.preventDefault();
      if (e.altKey && m.kind === "box") {
        const w = round4(clamp((m.w ?? 0) + dir[0] * n * px, MIN_BOX, 1 - m.x));
        const h = round4(clamp((m.h ?? 0) + dir[1] * n * py, MIN_BOX, 1 - m.y));
        this.update1(m.id, { w, h }, "resize");
      } else {
        const x = round4(clamp(m.x + dir[0] * n * px, 0, 1 - (m.w ?? 0)));
        const y = round4(clamp(m.y + dir[1] * n * py, 0, 1 - (m.h ?? 0)));
        this.update1(m.id, { x, y }, "move");
      }
      return;
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      this.removeMark(m.id);
      void this.updateComplete.then(() => (this.selected ? this.focusMark(this.selected) : this.querySelector<HTMLElement>(".ui-paq__add-pin")?.focus()));
    } else if (e.key === "Enter") {
      e.preventDefault();
      this.querySelector<HTMLInputElement>(`.ui-paq__item[data-id="${CSS.escape(m.id)}"] .ui-paq__q`)?.focus();
    }
  };
  private focusMark(id: string) {
    this.selected = id;
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-paq__mark[data-id="${CSS.escape(id)}"]`)?.focus());
  }

  /* ---------- Ask ---------- */

  private ask() {
    if (this.busy) return;
    const question = this.question.trim();
    if (!this.marks.length && !question) {
      this.hint = this.words.needsSomething;
      this.say(this.hint);
      return;
    }
    const detail: PointAsk = { marks: this.marks.map((m) => ({ ...m, question: (m.question ?? "").trim() })), question };
    if (this.emit<PointAsk>("tc-ask", detail, { cancelable: true })) this.busy = true;
  }
  private onQuestion = (e: Event) => {
    const input = e.target as HTMLTextAreaElement;
    const question = input.value;
    if (!this.emit<PointQuestionChange>("tc-question-change", { question }, { cancelable: true })) {
      input.value = this.question;
      return;
    }
    this.question = question;
  };
  private onMarkQuestion = (e: Event, m: PointMark) => {
    const input = e.target as HTMLInputElement;
    if (!this.update1(m.id, { question: input.value }, "question")) input.value = m.question ?? "";
  };
  private onLoad = (e: Event) => {
    const img = e.target as HTMLImageElement;
    if (img.naturalWidth && img.naturalHeight) this.aspect = img.naturalWidth / img.naturalHeight;
  };

  /* ---------- Render ---------- */

  private renderMark(m: PointMark, i: number) {
    const shown = this.draft && this.draft.id === m.id ? this.draft : m;
    const sel = this.selected ? this.selected === m.id : i === 0;
    const q = (m.question ?? "").trim();
    const style =
      m.kind === "pin" ? `left: ${shown.x * 100}%; top: ${shown.y * 100}%` : `left: ${shown.x * 100}%; top: ${shown.y * 100}%; width: ${(shown.w ?? 0) * 100}%; height: ${(shown.h ?? 0) * 100}%`;
    return html`<button
      type="button"
      class="ui-paq__mark"
      data-kind=${m.kind}
      data-id=${m.id}
      ?data-selected=${this.selected === m.id}
      tabindex=${sel ? "0" : "-1"}
      style=${style}
      aria-describedby=${`${this.uid}-keys`}
      @keydown=${(e: KeyboardEvent) => this.onMarkKey(e, m)}
      @focus=${() => (this.selected = m.id)}
    >
      <span class="ui-paq__num" aria-hidden="true">${i + 1}</span>
      <span class="tc-sr-only">${this.kindWord(m)} ${i + 1}: ${q || this.words.noQuestion}</span>
    </button>`;
  }

  private renderItem(m: PointMark, i: number) {
    const w = this.words;
    const id = `${this.uid}-${m.id}`;
    const answer = this.answers[m.id];
    return html`<li class="ui-paq__item" data-id=${m.id} ?data-selected=${this.selected === m.id}>
      <button type="button" class="ui-paq__which" @click=${() => this.focusMark(m.id)}>
        <span class="ui-paq__num" aria-hidden="true">${i + 1}</span>${ico(m.kind === "pin" ? ICONS.pin : ICONS.box)}<span>${this.kindWord(m)}<span class="tc-sr-only"> ${i + 1}</span></span>
      </button>
      <input
        class="ui-paq__q"
        type="text"
        .value=${live(m.question ?? "")}
        placeholder=${w.markQuestion}
        aria-label=${`${w.markQuestion}: ${this.kindWord(m)} ${i + 1}`}
        ?disabled=${this.busy}
        @focus=${() => (this.selected = m.id)}
        @input=${(e: Event) => this.onMarkQuestion(e, m)}
      />
      <button type="button" class="ui-paq__remove" ?disabled=${this.busy} @click=${() => this.removeMark(m.id)}>
        ${ico(ICONS.remove)}<span class="tc-sr-only">${w.remove} ${this.kindWord(m)} ${i + 1}</span>
      </button>
      ${answer ? html`<p class="ui-paq__answer" id=${id}>${answer}</p>` : nothing}
    </li>`;
  }

  protected override render() {
    const w = this.words;
    const id = this.uid;
    const busy = this.busy;
    const src = safeMediaUrl(this.src);
    const d = this.draft;
    const head = cardHead({ icon: ICONS.head, title: this.heading, subtitle: this.description, id: `${id}-title`, aside: this.marks.length ? html`<span class="ui-paq__count">${this.marks.length}</span>` : undefined });
    const body = html`<div class="ui-paq__card" aria-busy=${busy ? "true" : "false"}>
      <div class="ui-paq__layout">
        <div class="ui-paq__media">
          <div class="ui-paq__stage" style=${`aspect-ratio: ${round4(this.aspect)}`}>
            <div class="ui-paq__surface" ?data-busy=${busy} @pointerdown=${this.onDown} @pointermove=${this.onMove} @pointerup=${this.onUp} @pointercancel=${this.onUp}>
              ${src ? html`<img class="ui-paq__img" src=${src} alt=${this.alt} draggable="false" @load=${this.onLoad} />` : html`<div class="ui-paq__img ui-paq__img--empty" role="img" aria-label=${this.alt}></div>`}
              <div class="ui-paq__marks" role="group" aria-label=${w.marks}>${this.marks.map((m, i) => this.renderMark(m, i))}</div>
              ${d && !d.id ? html`<div class="ui-paq__draft" aria-hidden="true" style=${`left: ${d.x * 100}%; top: ${d.y * 100}%; width: ${(d.w ?? 0) * 100}%; height: ${(d.h ?? 0) * 100}%`}></div>` : nothing}
            </div>
          </div>
          <div class="ui-paq__adds">
            <button type="button" class="tc-btn-sm ui-paq__add-pin" ?disabled=${busy} @click=${() => this.addMark("pin")}>${ico(ICONS.pin)}<span>${w.addPin}</span></button>
            <button type="button" class="tc-btn-sm ui-paq__add-box" ?disabled=${busy} @click=${() => this.addMark("box")}>${ico(ICONS.box)}<span>${w.addBox}</span></button>
            <button type="button" class="tc-btn-sm ui-paq__clear" ?disabled=${busy || !this.marks.length} @click=${() => this.clearAll()}>${w.clearAll}</button>
          </div>
        </div>
        <div class="ui-paq__side">
          <h4 class="ui-paq__list-title" id=${`${id}-list`}>${w.list}</h4>
          ${this.marks.length
            ? html`<ol class="ui-paq__list" aria-labelledby=${`${id}-list`}>${this.marks.map((m, i) => this.renderItem(m, i))}</ol>`
            : html`<p class="ui-paq__empty">${w.empty}</p>`}
          <label class="ui-paq__field">
            <span class="ui-paq__label">${w.question}</span>
            <textarea
              class="ui-paq__input"
              rows="2"
              .value=${live(this.question)}
              placeholder=${w.placeholder}
              ?disabled=${busy}
              aria-describedby=${ifDefined(this.hint ? `${id}-hint` : undefined)}
              @input=${this.onQuestion}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  this.ask();
                }
              }}
            ></textarea>
          </label>
          <div class="ui-paq__actions">
            ${this.hint ? html`<p class="ui-paq__hint" id=${`${id}-hint`}>${this.hint}</p>` : nothing}
            <button type="button" class="ui-paq__ask" aria-disabled=${busy ? "true" : "false"} @click=${() => this.ask()}>${busy ? w.asking : w.ask}</button>
          </div>
          ${this.answer
            ? html`<section class="ui-paq__overall" aria-labelledby=${`${id}-answer`}>
                <h4 class="ui-paq__overall-title" id=${`${id}-answer`}>${w.answer}</h4>
                <p class="ui-paq__overall-text">${this.answer}</p>
              </section>`
            : nothing}
        </div>
      </div>
      <span class="tc-sr-only" id=${`${id}-keys`}>${w.keys}</span>
      <span class="tc-sr-only" role="status">${this.announce}</span>
    </div>`;
    return html`${head}${body}`;
  }

  static override css = /* css */ `
[data-ui="paq"] {
  --tc-paq-pin: var(--tc-space-6);
  --tc-paq-side-min: 260px;
}
/* Standard: the header on a gray tray, above a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="paq"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one white card, the header its first row */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="paq"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="paq"] *, [data-ui="paq"] *::before, [data-ui="paq"] *::after { box-sizing: border-box; }
[data-ui="paq"] p, [data-ui="paq"] h4, [data-ui="paq"] ol { margin: 0; }
.ui-paq__card { padding: var(--tc-space-4); }
:where([data-look="standard"], [data-look="standard"] *).ui-paq__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-paq__card { padding-top: 0; }
.ui-paq__ico { width: var(--tc-space-4); height: var(--tc-space-4); flex: none; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-paq__count { display: inline-flex; align-items: center; justify-content: center; min-width: var(--tc-space-6); height: var(--tc-space-6); padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-full); background: var(--tc-surface-sunken); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); font-variant-numeric: tabular-nums; }
.ui-paq__layout { display: grid; gap: var(--tc-space-4); }
@container (min-width: 640px) {
  .ui-paq__layout { grid-template-columns: minmax(0, 3fr) minmax(var(--tc-paq-side-min), 2fr); align-items: start; }
}
.ui-paq__media { display: grid; gap: var(--tc-space-2); }
/* ----- The image and its marks ----- */
.ui-paq__stage { position: relative; width: 100%; border-radius: var(--tc-field-radius); background: var(--tc-surface-sunken); box-shadow: var(--tc-field-shadow); }
.ui-paq__surface { position: absolute; inset: 0; touch-action: none; user-select: none; -webkit-user-select: none; cursor: crosshair; }
.ui-paq__surface[data-busy] { cursor: progress; }
.ui-paq__img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: contain; border-radius: var(--tc-field-radius); pointer-events: none; }
.ui-paq__img--empty { background: var(--tc-surface-sunken); }
.ui-paq__marks { position: absolute; inset: 0; }
.ui-paq__mark { position: absolute; margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: grab; }
.ui-paq__mark:active { cursor: grabbing; }
.ui-paq__mark[data-kind="pin"] { width: var(--tc-paq-pin); height: var(--tc-paq-pin); transform: translate(-50%, -50%); }
.ui-paq__mark[data-kind="box"] { border: var(--tc-focus-ring-width) solid var(--tc-accent); border-radius: var(--tc-radius-xs); background: var(--tc-accent-subtle); }
.ui-paq__mark .ui-paq__num { position: absolute; }
.ui-paq__mark[data-kind="pin"] .ui-paq__num { inset: 0; }
.ui-paq__mark[data-kind="box"] .ui-paq__num { top: 0; left: 0; transform: translate(-40%, -40%); }
.ui-paq__num { display: inline-flex; align-items: center; justify-content: center; min-width: var(--tc-paq-pin); height: var(--tc-paq-pin); padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-full); background: var(--tc-accent-solid); box-shadow: var(--tc-card-shadow); color: var(--tc-text-on-accent); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-semibold); font-variant-numeric: tabular-nums; line-height: var(--tc-line-height-tight); }
.ui-paq__mark[data-selected] .ui-paq__num { outline: var(--tc-focus-ring-width) solid var(--tc-surface-raised); }
.ui-paq__mark[data-selected][data-kind="box"] { border-style: dashed; }
.ui-paq__mark:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-paq__draft { position: absolute; border: var(--tc-focus-ring-width) dashed var(--tc-accent); border-radius: var(--tc-radius-xs); background: var(--tc-accent-subtle); pointer-events: none; }
.ui-paq__adds { display: flex; flex-wrap: wrap; gap: var(--tc-space-2); }
.ui-paq__clear { margin-left: auto; }
/* ----- The side: marks, the question, answers ----- */
.ui-paq__side { display: grid; gap: var(--tc-space-3); align-content: start; }
.ui-paq__list-title, .ui-paq__overall-title { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-paq__list { display: grid; gap: var(--tc-space-2); padding: 0; list-style: none; }
.ui-paq__item { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); padding: var(--tc-space-2); border-radius: var(--tc-radius-md); background: var(--tc-surface-sunken); }
.ui-paq__item[data-selected] { box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-selected); }
.ui-paq__which { display: inline-flex; align-items: center; gap: var(--tc-space-1); min-height: var(--tc-control-h-sm); margin: 0; padding: 0 var(--tc-space-1); border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: var(--tc-text-secondary); font: inherit; font-size: var(--tc-font-size-sm); cursor: pointer; }
.ui-paq__which:hover { color: var(--tc-text-primary); }
.ui-paq__which:focus-visible, .ui-paq__remove:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-paq__which .ui-paq__num { min-width: var(--tc-space-5); height: var(--tc-space-5); }
.ui-paq__q, .ui-paq__input { width: 100%; margin: 0; border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); }
.ui-paq__q { height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); }
.ui-paq__input { min-height: var(--tc-field-h); padding: var(--tc-space-2) var(--tc-field-px); resize: vertical; }
.ui-paq__q::placeholder, .ui-paq__input::placeholder { color: var(--tc-text-placeholder); }
.ui-paq__q:hover, .ui-paq__input:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-paq__q:focus-visible, .ui-paq__input:focus-visible { outline: none; box-shadow: var(--tc-field-shadow-focus); }
.ui-paq__q:disabled, .ui-paq__input:disabled { background: var(--tc-surface-sunken); color: var(--tc-text-muted); }
.ui-paq__remove { display: inline-flex; align-items: center; justify-content: center; width: var(--tc-control-h-sm); height: var(--tc-control-h-sm); margin: 0; padding: 0; border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: var(--tc-text-muted); cursor: pointer; }
.ui-paq__remove:hover { background: var(--tc-surface-raised); color: var(--tc-text-primary); }
.ui-paq__remove:disabled { cursor: not-allowed; }
.ui-paq__answer { grid-column: 1 / -1; padding: var(--tc-space-1) var(--tc-space-1) 0; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); white-space: pre-wrap; }
.ui-paq__empty { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-paq__field { display: grid; gap: var(--tc-space-1); }
.ui-paq__label { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-paq__actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-2) var(--tc-space-3); }
.ui-paq__hint { margin-right: auto; font-size: var(--tc-font-size-sm); color: var(--tc-status-danger-fg); }
.ui-paq__ask { display: inline-flex; align-items: center; justify-content: center; height: var(--tc-control-h-md); margin: 0; padding: 0 var(--tc-control-px-md); border: 0; border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); font: inherit; font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-paq__ask:hover { background: var(--tc-action-primary-bg-hover); }
.ui-paq__ask:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-paq__ask[aria-disabled="true"] { cursor: progress; }
.ui-paq__overall { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-3); border-radius: var(--tc-radius-md); background: var(--tc-surface-sunken); }
.ui-paq__overall-text { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); white-space: pre-wrap; }
@media (forced-colors: active) {
  .ui-paq__num { border: 1px solid CanvasText; }
  .ui-paq__mark[data-kind="box"], .ui-paq__draft { border-color: Highlight; }
  .ui-paq__ask { border: 1px solid ButtonText; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="paq"] *, [data-ui="paq"] *::before, [data-ui="paq"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-point-and-ask")) customElements.define("tc-point-and-ask", TcPointAndAsk);

declare global {
  interface HTMLElementTagNameMap {
    "tc-point-and-ask": TcPointAndAsk;
  }
}
