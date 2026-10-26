import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { FocusRescueController, rescueFocus } from "./internal/controllers";

/*
 * <tc-synthesis-notes> – the person's own conclusions, assumptions and things still to verify, written apart from
 * the model's output (the header says so) and exported with where they came from.
 *   · each list adds in place: "Add a conclusion" opens a field; Enter adds and keeps it open for the next
 *   · each note edits in place (Enter saves, Escape cancels) and is removed with Undo on the tray for a few seconds
 *   · the grip on each note reorders it from the keyboard: ↑ ↓ within its list, ← → to the list before or after,
 *     Home / End to the top or bottom; Alt + ↑ ↓ does the same from the note's other buttons
 *   · Export fires tc-export with the notes, the session id, the author and a Markdown copy
 * Standard is a gray tray with the lists on a white card and the provenance line on the tray; Clean is one white card
 * with that line in its last row.
 *
 *   <tc-synthesis-notes author="Maya Chen" .sessionId=${session} .notes=${notes}></tc-synthesis-notes>
 *
 * Every change to the notes fires a cancelable tc-notes-change with the whole list, applied unless prevented.
 */

/** One of the lists – conclusions, assumptions, things to verify, or your own */
export type SynthesisSection = {
  id: string;
  /** The list's heading, e.g. "Assumptions" */
  label: string;
  /** The add button and the new field's name, e.g. "Add an assumption" */
  addLabel?: string;
  /** What an empty list says, e.g. "No assumptions yet" */
  empty?: string;
};
/** One note: its list (a section id) and its text */
export type SynthesisNote = { id: string; kind: string; text: string };
export type SynthesisNotesChange = { notes: SynthesisNote[] };
/** The detail of tc-export: the notes with their provenance, and a Markdown copy */
export type SynthesisExport = {
  notes: SynthesisNote[];
  sections: SynthesisSection[];
  sessionId: string;
  author: string;
  heading: string;
  markdown: string;
};

export const DEFAULT_SYNTHESIS_SECTIONS: SynthesisSection[] = [
  { id: "conclusions", label: "Conclusions", addLabel: "Add a conclusion", empty: "No conclusions yet" },
  { id: "assumptions", label: "Assumptions", addLabel: "Add an assumption", empty: "No assumptions yet" },
  { id: "verify", label: "Still to verify", addLabel: "Add something to verify", empty: "Nothing to verify yet" },
];

/** The notes as Markdown: a heading, the provenance line, one list per section (empty ones left out) */
export function synthesisMarkdown(notes: SynthesisNote[], sections: SynthesisSection[] = DEFAULT_SYNTHESIS_SECTIONS, meta: { heading?: string; sessionId?: string; author?: string } = {}) {
  const lines = [`# ${meta.heading || "Notes"}`];
  const by = [meta.author && `Written by ${meta.author}`, meta.sessionId && `session ${meta.sessionId}`].filter(Boolean).join(", ");
  lines.push("", `_${by ? `${by} – ` : ""}the person's own notes, not model output._`);
  for (const s of sections) {
    const list = notes.filter((n) => n.kind === s.id);
    if (!list.length) continue;
    lines.push("", `## ${s.label}`, "", ...list.map((n) => `- ${n.text.replace(/\s*\n\s*/g, " ")}`));
  }
  return lines.join("\n");
}

const clean = (t: string) => t.trim().replace(/[ \t]+/g, " ");
const short = (t: string) => (t.length > 48 ? `${t.slice(0, 47).trimEnd()}…` : t);

/* ---------- Icons (Lucide, ISC – lucide.dev) ---------- */
const icon = (paths: string, cls = "ui-syn__glyph") => html`<svg class=${cls} viewBox="0 0 24 24" aria-hidden="true">${svg`<path d=${paths}></path>`}</svg>`;
const pen = icon("M12 20h9M16.4 3.6a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z", "ui-syn__mark-svg");
const grip = html`<svg class="ui-syn__glyph" viewBox="0 0 24 24" aria-hidden="true">${svg`<circle cx="9" cy="6" r="1.4"></circle><circle cx="15" cy="6" r="1.4"></circle><circle cx="9" cy="12" r="1.4"></circle><circle cx="15" cy="12" r="1.4"></circle><circle cx="9" cy="18" r="1.4"></circle><circle cx="15" cy="18" r="1.4"></circle>`}</svg>`;
const editIcon = icon("M16.4 3.6a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4ZM14 6l4 4");
const removeIcon = icon("M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 6l1 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-14");
const plus = icon("M12 5v14M5 12h14");
const undoIcon = icon("M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11");
const exportIcon = icon("M12 3v12M7 10l5 5 5-5M5 21h14");

let instances = 0;
let made = 0;

/**
 * The person's own conclusions, assumptions and things to verify – editable, reorderable from the keyboard,
 * removable with Undo, and exported with provenance.
 * @tag tc-synthesis-notes
 * @fires tc-notes-change - A note was added, edited, moved, removed or brought back; detail `{ notes }`: SynthesisNotesChange. Cancelable: preventDefault() keeps the change out until the app passes the list back.
 * @fires tc-export - Export was pressed; detail `{ notes, sections, sessionId, author, heading, markdown }`: SynthesisExport.
 */
export class TcSynthesisNotes extends TcElement {
  static override ui = "syn";

  /** The notes, each in the list its `kind` names */
  @property({ attribute: false }) accessor notes: SynthesisNote[] = [];
  /** The lists, in order – by default Conclusions, Assumptions and Still to verify */
  @property({ attribute: false }) accessor sections: SynthesisSection[] = DEFAULT_SYNTHESIS_SECTIONS;
  /** The heading, and the group's name */
  @property() accessor heading = "Your notes";
  /** The tag that sets the notes apart from the model's output */
  @property({ attribute: "own-label" }) accessor ownLabel = "Written by you";
  /** The session the notes belong to – shown on the tray and exported with them */
  @property({ attribute: "session-id" }) accessor sessionId = "";
  /** Who wrote the notes – shown on the tray and exported with them */
  @property() accessor author = "";
  /** How long Undo stays after a removal, in ms; it waits while the pointer or focus is on it. `Infinity` keeps it until the next removal */
  @property({ type: Number, attribute: "undo-for" }) accessor undoFor = 5000;
  /** Hides Export */
  @property({ type: Boolean, attribute: "no-export" }) accessor noExport = false;

  /** @internal The note being edited */
  @state() accessor editing: string | null = null;
  /** @internal Its draft */
  @state() accessor draft = "";
  /** @internal The list with its add field open */
  @state() accessor adding: string | null = null;
  /** @internal The new note's draft */
  @state() accessor newText = "";
  /** @internal The last removal, for Undo */
  @state() accessor removed: { note: SynthesisNote; index: number; key: number } | null = null;
  /** @internal Undo waits while the pointer or focus is on the tray line */
  @state() accessor hold = { hover: false, focus: false };
  /** @internal What the status region says */
  @state() accessor announce = "";
  /** @internal Notes that just arrived – they fade in */
  @state() accessor fresh: string | null = null;

  private readonly uid = `tc-syn${++instances}`;
  /** The list as last committed – the property, or a change not passed back yet */
  private latest: SynthesisNote[] = [];
  private removals = 0;
  private undoTimer = 0;
  private undoTimerFor = "";
  /** Where focus goes after the next update */
  private focusTo: string | null = null;
  private ownName = false;

  constructor() {
    super();
    // Whatever takes the focused control away – focus goes to the first Add button
    new FocusRescueController(this, () => this.querySelector(".ui-syn__add"));
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
    this.ownName ||= this.hasAttribute("aria-label") || (this.hasAttribute("aria-labelledby") && this.getAttribute("aria-labelledby") !== `${this.uid}-title`);
    if (!this.ownName) this.setAttribute("aria-labelledby", `${this.uid}-title`);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.clearTimeout(this.undoTimer);
    this.undoTimerFor = "";
  }

  protected override willUpdate(changed: PropertyValues<this>) {
    super.willUpdate(changed);
    if (changed.has("notes")) this.latest = this.notes;
  }

  protected override updated() {
    const to = this.focusTo;
    this.focusTo = null;
    if (to) this.querySelector<HTMLElement>(to)?.focus({ preventScroll: false });
    for (const t of this.querySelectorAll<HTMLTextAreaElement>("textarea.ui-syn__edit")) {
      t.style.height = "auto";
      t.style.height = `${t.scrollHeight}px`;
    }
    // Undo stays for `undoFor` – the clock stops while the tray line is held, and starts over after
    const held = this.hold.hover || this.hold.focus;
    const want = this.removed && !held && Number.isFinite(this.undoFor) ? `${this.removed.key}:${this.undoFor}` : "";
    if (want !== this.undoTimerFor) {
      window.clearTimeout(this.undoTimer);
      this.undoTimerFor = want;
      if (want) this.undoTimer = window.setTimeout(() => (this.removed = null), this.undoFor);
    }
  }

  /* ---------- Changes ---------- */

  private commit(next: SynthesisNote[]) {
    this.latest = next;
    if (this.emit<SynthesisNotesChange>("tc-notes-change", { notes: next }, { cancelable: true })) this.notes = next;
  }

  private section(id: string) {
    return this.sections.find((s) => s.id === id);
  }
  private sel(id: string, part: string) {
    return `[data-note="${CSS.escape(id)}"] ${part}`;
  }

  private add(kind: string) {
    const text = clean(this.newText);
    if (!text) return;
    const note: SynthesisNote = { id: `${this.uid}-n${++made}`, kind, text };
    this.newText = "";
    this.fresh = note.id;
    this.commit([...this.latest, note]);
    this.announce = `Added to ${this.section(kind)?.label ?? kind}`;
  }

  private openAdd(kind: string) {
    this.editing = null;
    this.newText = "";
    this.adding = kind;
    this.focusTo = `[data-section="${CSS.escape(kind)}"] .ui-syn__new`;
  }
  private closeAdd() {
    const kind = this.adding;
    this.adding = null;
    this.newText = "";
    if (kind) this.focusTo = `[data-section="${CSS.escape(kind)}"] .ui-syn__add`;
  }

  private startEdit(n: SynthesisNote) {
    this.adding = null;
    this.draft = n.text;
    this.editing = n.id;
    this.focusTo = this.sel(n.id, ".ui-syn__edit");
  }
  private saveEdit() {
    const id = this.editing;
    if (!id) return;
    const text = clean(this.draft);
    this.editing = null;
    this.focusTo = this.sel(id, '[data-act="edit"]');
    const before = this.latest.find((n) => n.id === id);
    if (!before || !text || text === before.text) return;
    this.commit(this.latest.map((n) => (n.id === id ? { ...n, text } : n)));
    this.announce = "Saved";
  }
  private cancelEdit() {
    const id = this.editing;
    this.editing = null;
    if (id) this.focusTo = this.sel(id, '[data-act="edit"]');
  }

  private removeNote(n: SynthesisNote) {
    const same = this.latest.filter((x) => x.kind === n.kind);
    const at = same.findIndex((x) => x.id === n.id);
    const handleOf = (x?: SynthesisNote) => (x ? this.querySelector(this.sel(x.id, ".ui-syn__handle")) : null);
    rescueFocus(this.querySelector(`[data-note="${CSS.escape(n.id)}"]`), [
      handleOf(same[at + 1]),
      handleOf(same[at - 1]),
      this.querySelector(`[data-section="${CSS.escape(n.kind)}"] .ui-syn__add`),
    ]);
    if (this.editing === n.id) this.editing = null;
    const index = this.latest.findIndex((x) => x.id === n.id);
    this.removed = { note: n, index, key: ++this.removals };
    this.commit(this.latest.filter((x) => x.id !== n.id));
    this.announce = `Removed “${short(n.text)}”. Undo is on the tray.`;
  }

  private undo() {
    const r = this.removed;
    if (!r) return;
    const next = [...this.latest];
    next.splice(Math.max(0, Math.min(r.index, next.length)), 0, r.note);
    this.removed = null;
    this.fresh = r.note.id;
    this.commit(next);
    this.focusTo = this.sel(r.note.id, ".ui-syn__handle");
    this.announce = `Brought back “${short(r.note.text)}”`;
  }

  /**
   * Moves a note: `by` places within its list (-1 up, 1 down, ±Infinity to the top or bottom), or `toSection` steps
   * to the list before or after (it lands at the end)
   */
  private move(n: SynthesisNote, by: number, toSection = 0) {
    const list = this.latest;
    const order = this.sections.map((s) => s.id);
    let kind = n.kind;
    if (toSection) {
      const at = order.indexOf(kind);
      const to = at + toSection;
      if (at < 0 || to < 0 || to >= order.length) return;
      kind = order[to];
    }
    const rest = list.filter((x) => x.id !== n.id);
    const peers = rest.filter((x) => x.kind === kind);
    const from = toSection ? peers.length : list.filter((x) => x.kind === kind).findIndex((x) => x.id === n.id);
    const place = toSection ? peers.length : Math.max(0, Math.min(peers.length, from + (Number.isFinite(by) ? by : by > 0 ? peers.length : -peers.length)));
    if (!toSection && place === from) return;
    const moved = { ...n, kind };
    // Insert before the peer now at `place`, else after the last peer, else at the end
    const before = peers[place];
    const next = [...rest];
    const at = before ? next.indexOf(before) : peers.length ? next.indexOf(peers[peers.length - 1]) + 1 : next.length;
    next.splice(at, 0, moved);
    this.commit(next);
    this.focusTo = this.sel(n.id, ".ui-syn__handle");
    this.announce = `Moved to ${toSection ? `${this.section(kind)?.label ?? kind}, ` : ""}position ${place + 1} of ${peers.length + 1}`;
  }

  private exportNotes() {
    const notes = this.latest;
    this.emit<SynthesisExport>("tc-export", {
      notes,
      sections: this.sections,
      sessionId: this.sessionId,
      author: this.author,
      heading: this.heading,
      markdown: synthesisMarkdown(notes, this.sections, { heading: this.heading, sessionId: this.sessionId, author: this.author }),
    });
    this.announce = `Exported ${notes.length} ${notes.length === 1 ? "note" : "notes"}`;
  }

  /** The grip: arrows move the note; Delete removes it */
  private onHandleKey(e: KeyboardEvent, n: SynthesisNote) {
    const keys: Record<string, () => void> = {
      ArrowUp: () => this.move(n, -1),
      ArrowDown: () => this.move(n, 1),
      ArrowLeft: () => this.move(n, 0, -1),
      ArrowRight: () => this.move(n, 0, 1),
      Home: () => this.move(n, -Infinity),
      End: () => this.move(n, Infinity),
      Delete: () => this.removeNote(n),
      Backspace: () => this.removeNote(n),
    };
    if (e.altKey || e.metaKey || e.ctrlKey || !keys[e.key]) return;
    e.preventDefault();
    keys[e.key]();
  }

  /** Alt + ↑ ↓ from the note's other buttons */
  private onRowKey(e: KeyboardEvent, n: SynthesisNote) {
    if (!e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown") || (e.target as HTMLElement).localName === "textarea") return;
    e.preventDefault();
    this.move(n, e.key === "ArrowUp" ? -1 : 1);
  }

  /* ---------- Parts ---------- */

  private item(n: SynthesisNote) {
    const editing = this.editing === n.id;
    return html`<li class="ui-syn__item" data-note=${n.id} ?data-editing=${editing} ?data-fresh=${this.fresh === n.id} @keydown=${(e: KeyboardEvent) => this.onRowKey(e, n)}>
      <button type="button" class="ui-syn__handle" data-focus-key="handle" aria-label=${`Move “${short(n.text)}”`} aria-describedby=${`${this.uid}-hint`} @keydown=${(e: KeyboardEvent) => this.onHandleKey(e, n)}>${grip}</button>
      ${editing
        ? html`<div class="ui-syn__field">
            <textarea
              class="ui-syn__edit"
              rows="1"
              aria-label="Edit note"
              .value=${live(this.draft)}
              @input=${(e: Event) => {
                this.draft = (e.target as HTMLTextAreaElement).value;
              }}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
                  e.preventDefault();
                  this.saveEdit();
                } else if (e.key === "Escape") {
                  e.stopPropagation();
                  this.cancelEdit();
                }
              }}
            ></textarea>
            <span class="ui-syn__edit-acts">
              <button type="button" class="ui-syn__text-btn" @click=${() => this.cancelEdit()}>Cancel</button>
              <button type="button" class="ui-syn__text-btn ui-syn__text-btn--main" @click=${() => this.saveEdit()}>Save</button>
            </span>
          </div>`
        : html`<p class="ui-syn__text">${n.text}</p>
            <span class="ui-syn__acts">
              <button type="button" class="ui-syn__icon" data-act="edit" aria-label=${`Edit “${short(n.text)}”`} title="Edit" @click=${() => this.startEdit(n)}>${editIcon}</button>
              <button type="button" class="ui-syn__icon ui-syn__icon--remove" data-act="remove" aria-label=${`Remove “${short(n.text)}”`} title="Remove" @click=${() => this.removeNote(n)}>${removeIcon}</button>
            </span>`}
    </li>`;
  }

  private sectionPart(s: SynthesisSection, index: number) {
    const notes = this.notes.filter((n) => n.kind === s.id);
    const adding = this.adding === s.id;
    const headId = `${this.uid}-s${index}`;
    const addLabel = s.addLabel ?? `Add to ${s.label}`;
    return html`<section class="ui-syn__section" data-section=${s.id} data-tone=${index % 4} aria-labelledby=${headId}>
      <h3 class="ui-syn__heading" id=${headId}><span class="ui-syn__dot" aria-hidden="true"></span><span class="ui-syn__label">${s.label}</span><span class="ui-syn__count"><span class="ui-syn__sr">, </span>${notes.length}<span class="ui-syn__sr"> ${notes.length === 1 ? "note" : "notes"}</span></span></h3>
      ${notes.length
        ? html`<ol class="ui-syn__list">${repeat(notes, (n) => n.id, (n) => this.item(n))}</ol>`
        : adding
          ? nothing
          : html`<p class="ui-syn__empty">${s.empty ?? "Nothing here yet"}</p>`}
      ${adding
        ? html`<div class="ui-syn__new-row">
            <textarea
              class="ui-syn__edit ui-syn__new"
              rows="1"
              aria-label=${addLabel}
              placeholder=${`${addLabel}…`}
              .value=${live(this.newText)}
              @input=${(e: Event) => {
                this.newText = (e.target as HTMLTextAreaElement).value;
              }}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
                  e.preventDefault();
                  this.add(s.id);
                } else if (e.key === "Escape") {
                  e.stopPropagation();
                  this.closeAdd();
                }
              }}
            ></textarea>
            <span class="ui-syn__edit-acts">
              <button type="button" class="ui-syn__text-btn" @click=${() => this.closeAdd()}>Done</button>
              <button type="button" class="ui-syn__text-btn ui-syn__text-btn--main" ?disabled=${!this.newText.trim()} @click=${() => this.add(s.id)}>Add</button>
            </span>
          </div>`
        : html`<button type="button" class="ui-syn__add" @click=${() => this.openAdd(s.id)}>${plus}${addLabel}</button>`}
    </section>`;
  }

  protected override render() {
    const cleanLook = this.resolvedLook === "clean";
    const total = this.notes.length;
    const r = this.removed;
    const setHold = (h: Partial<{ hover: boolean; focus: boolean }>) => (this.hold = { ...this.hold, ...h });
    const provenance = [this.sessionId && `Session ${this.sessionId}`, this.author && `by ${this.author}`, `${total} ${total === 1 ? "note" : "notes"}`].filter(Boolean).join(" · ");
    const foot = html`<div
      class="ui-syn__foot"
      @pointerenter=${() => setHold({ hover: true })}
      @pointerleave=${() => setHold({ hover: false })}
      @focusin=${() => setHold({ focus: true })}
      @focusout=${(e: FocusEvent) => !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null) && setHold({ focus: false })}
    >
      ${r
        ? html`<span class="ui-syn__line ui-syn__line--removed"><span class="ui-syn__flat">Removed “</span><b class="ui-syn__quote">${r.note.text}</b><span class="ui-syn__flat">”</span></span>
            <button type="button" class="ui-syn__btn ui-syn__btn--undo" @click=${() => this.undo()}>${undoIcon}Undo</button>`
        : html`<span class="ui-syn__line">${provenance}</span>`}
    </div>`;
    return html`
      <div class="ui-syn__bar">
        <span class="ui-syn__mark">${pen}</span>
        <span class="ui-syn__title" id=${`${this.uid}-title`}>${this.heading}</span>
        ${this.ownLabel ? html`<span class="ui-syn__own">${this.ownLabel}</span>` : nothing}
        ${this.noExport
          ? nothing
          : html`<button type="button" class="ui-syn__btn ui-syn__btn--export" ?disabled=${!total} @click=${() => this.exportNotes()}>${exportIcon}Export</button>`}
      </div>
      <div class="ui-syn__card">
        ${this.sections.map((s, i) => this.sectionPart(s, i))}
        ${cleanLook ? foot : nothing}
      </div>
      ${cleanLook ? nothing : foot}
      <span class="ui-syn__sr" id=${`${this.uid}-hint`}>Up and down arrows move it in its list, left and right to the list before or after, Delete removes it.</span>
      <span class="ui-syn__sr" role="status">${this.announce}</span>
    `;
  }

  static override css = /* css */ `
[data-ui="syn"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 560px;
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
  container: ui-syn / inline-size;
}
/* Clean: no tray – one white card, the provenance line in its last row */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="syn"] {
  padding: 0;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  letter-spacing: normal;
}
[data-ui="syn"] *, [data-ui="syn"] *::before, [data-ui="syn"] *::after { box-sizing: border-box; }
[data-ui="syn"] svg { display: block; flex: none; }
:where([data-ui="syn"]) :is(p, h3, ol) { margin: 0; }
:where([data-ui="syn"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; letter-spacing: inherit; text-align: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="syn"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-syn__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
/* ----- The header: the mark, the heading, "Written by you" and Export ----- */
.ui-syn__bar { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-2); min-width: 0; padding: var(--tc-space-1-5) var(--tc-space-1) var(--tc-space-2) var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-syn__bar { padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-4); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-syn__mark { display: grid; flex: none; place-items: center; width: 16px; color: var(--tc-accent-text); }
.ui-syn__mark-svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-syn__mark-svg { stroke-width: 1.5; }
.ui-syn__title { min-width: 0; overflow: hidden; font-weight: var(--tc-font-weight-semibold); color: var(--tc-text-strong); white-space: nowrap; text-overflow: ellipsis; }
:where([data-look="clean"], [data-look="clean"] *).ui-syn__title { font-weight: var(--tc-font-weight-medium); }
/* Set apart from the model's output: the person's own words */
.ui-syn__own { flex: none; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-accent-subtle); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-pill-h); color: var(--tc-accent-text); white-space: nowrap; }
.ui-syn__btn { display: inline-flex; flex: none; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-secondary-fg); white-space: nowrap; transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard), transform var(--tc-duration-fast) var(--tc-ease-move), opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-syn__btn .ui-syn__glyph { width: 14px; height: 14px; color: var(--tc-icon-muted); }
[data-ui="syn"] .ui-syn__btn:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-syn__btn:active:not(:disabled) { transform: scale(0.97); }
.ui-syn__btn:disabled { cursor: default; opacity: 0.45; }
.ui-syn__btn--export { margin-left: auto; }
/* ----- The card: one section per list, under hairlines ----- */
.ui-syn__card { display: grid; min-width: 0; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
:where([data-look="clean"], [data-look="clean"] *).ui-syn__card { border-radius: 0 0 var(--tc-card-radius) var(--tc-card-radius); background: none; box-shadow: none; }
.ui-syn__section { display: grid; gap: var(--tc-space-1); min-width: 0; padding: var(--tc-space-3) var(--tc-space-2) var(--tc-space-2); }
.ui-syn__section + .ui-syn__section { border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-syn__section { padding: var(--tc-space-3) var(--tc-space-2-5) var(--tc-space-2); }
.ui-syn__heading { display: flex; align-items: center; gap: var(--tc-space-1-5); padding: 0 var(--tc-space-2); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-secondary); }
.ui-syn__dot { flex: none; width: 6px; height: 6px; border-radius: var(--tc-radius-full); background: var(--tc-accent); }
.ui-syn__section[data-tone="1"] .ui-syn__dot { background: var(--tc-tone-amber-solid); }
.ui-syn__section[data-tone="2"] .ui-syn__dot { background: var(--tc-tone-teal-solid); }
.ui-syn__section[data-tone="3"] .ui-syn__dot { background: var(--tc-tone-violet-solid); }
.ui-syn__count { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-syn__list { display: grid; padding: 0; list-style: none; }
/* A note: the grip, the text, and Edit and Remove on hover or focus */
.ui-syn__item { display: flex; align-items: flex-start; gap: var(--tc-space-1); min-width: 0; padding: var(--tc-space-1) var(--tc-space-1) var(--tc-space-1) 0; border-radius: var(--tc-radius-lg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
:where([data-look="clean"], [data-look="clean"] *).ui-syn__item { border-radius: var(--tc-radius-md); transition-duration: var(--tc-duration-instant); }
.ui-syn__item:hover, .ui-syn__item:focus-within, .ui-syn__item[data-editing] { background: var(--tc-fill-subtle); }
.ui-syn__item[data-fresh] { animation: ui-syn-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-syn__handle { display: grid; flex: none; place-items: center; width: 24px; height: 24px; border-radius: var(--tc-radius-sm); color: var(--tc-icon-muted); cursor: grab; transition: color var(--tc-duration-fast) var(--tc-ease-standard), background-color var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="syn"] .ui-syn__handle:hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
.ui-syn__handle .ui-syn__glyph { width: 14px; height: 14px; fill: currentColor; stroke: none; }
.ui-syn__text { flex: 1; min-width: 0; padding: var(--tc-space-0-5) 0; color: var(--tc-text-primary); white-space: pre-line; overflow-wrap: anywhere; }
.ui-syn__acts { display: inline-flex; flex: none; gap: var(--tc-space-0-5); opacity: 0; transition: opacity var(--tc-duration-base) var(--tc-ease-standard); }
.ui-syn__item:is(:hover, :focus-within) .ui-syn__acts { opacity: 1; }
.ui-syn__icon { display: grid; flex: none; place-items: center; width: 24px; height: 24px; border-radius: var(--tc-radius-sm); color: var(--tc-icon-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
[data-ui="syn"] .ui-syn__icon:hover { background: var(--tc-fill-default); color: var(--tc-text-primary); }
[data-ui="syn"] .ui-syn__icon--remove:hover { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-syn__glyph { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
:where([data-look="clean"], [data-look="clean"] *).ui-syn__glyph { stroke-width: 1.5; }
/* Editing in place, and the new note's field */
.ui-syn__field { display: grid; flex: 1; gap: var(--tc-space-1-5); min-width: 0; }
.ui-syn__edit { display: block; width: 100%; min-height: 24px; margin: 0; padding: var(--tc-space-0-5) 0; border: 0; outline: none; background: none; font: inherit; color: var(--tc-text-primary); caret-color: var(--tc-accent); resize: none; overflow: hidden; }
.ui-syn__edit::placeholder { color: var(--tc-text-placeholder); opacity: 1; }
.ui-syn__item[data-editing] { box-shadow: var(--tc-field-shadow-focus); background: var(--tc-field-bg); }
.ui-syn__edit-acts { display: flex; justify-content: flex-end; gap: var(--tc-space-1); }
.ui-syn__text-btn { display: inline-flex; align-items: center; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); color: var(--tc-action-ghost-fg); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), opacity var(--tc-duration-base) var(--tc-ease-standard); }
[data-ui="syn"] .ui-syn__text-btn:hover:not(:disabled) { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }
[data-ui="syn"] .ui-syn__text-btn--main { background: var(--tc-action-primary-bg); color: var(--tc-action-primary-fg); }
[data-ui="syn"] .ui-syn__text-btn--main:hover:not(:disabled) { background: var(--tc-action-primary-bg-hover); color: var(--tc-action-primary-fg); }
.ui-syn__text-btn:disabled { cursor: default; opacity: 0.4; }
.ui-syn__new-row { display: grid; gap: var(--tc-space-1-5); padding: var(--tc-space-1-5) var(--tc-space-2) var(--tc-space-1-5) var(--tc-space-2-5); border-radius: var(--tc-radius-lg); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow-focus); animation: ui-syn-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
:where([data-look="clean"], [data-look="clean"] *).ui-syn__new-row { border-radius: var(--tc-radius-md); }
.ui-syn__empty { padding: var(--tc-space-1) var(--tc-space-2); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); }
.ui-syn__add { display: flex; align-items: center; gap: var(--tc-space-1-5); justify-self: start; height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border-radius: var(--tc-control-radius-sm); font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); transition: background-color var(--tc-duration-fast) var(--tc-ease-standard), color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-syn__add .ui-syn__glyph { width: 14px; height: 14px; }
[data-ui="syn"] .ui-syn__add:hover { background: var(--tc-fill-subtle); color: var(--tc-text-primary); }
/* ----- The tray line: the provenance, or Undo after a removal ----- */
.ui-syn__foot { display: flex; align-items: center; gap: var(--tc-space-2); min-width: 0; min-height: calc(var(--tc-control-h-sm) + var(--tc-space-2)); padding: var(--tc-space-1) var(--tc-space-1) 0 var(--tc-space-3); }
:where([data-look="clean"], [data-look="clean"] *).ui-syn__foot { min-height: calc(var(--tc-control-h-sm) + var(--tc-space-4)); padding: 0 var(--tc-space-2) 0 var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-syn__line { flex: 1; min-width: 0; overflow: hidden; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); white-space: nowrap; text-overflow: ellipsis; font-variant-numeric: tabular-nums; animation: ui-syn-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
.ui-syn__line--removed { display: flex; min-width: 0; }
.ui-syn__flat { flex: none; }
.ui-syn__quote { min-width: 0; overflow: hidden; font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); text-overflow: ellipsis; }
.ui-syn__btn--undo { animation: ui-syn-in var(--tc-duration-moderate) var(--tc-ease-move) both; }
@keyframes ui-syn-in { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }
@media (pointer: coarse) {
  .ui-syn__acts { opacity: 1; }
  .ui-syn__handle, .ui-syn__icon { width: 32px; height: 32px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="syn"] *, [data-ui="syn"] *::before, [data-ui="syn"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-synthesis-notes")) customElements.define("tc-synthesis-notes", TcSynthesisNotes);

declare global {
  interface HTMLElementTagNameMap {
    "tc-synthesis-notes": TcSynthesisNotes;
  }
}
