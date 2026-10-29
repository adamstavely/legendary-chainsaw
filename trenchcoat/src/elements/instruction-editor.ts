import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { isMac } from "./internal/util";
import { diffWords, type DiffSegment } from "./inline-diff";
import "./segmented-control";
import type { SegmentValueChange } from "./segmented-control";

/*
 * <tc-instruction-editor> – the system or developer instructions a model works from, with their versions:
 *   · Editor – the text, with every {{variable}} highlighted in place (a mirror behind a native textarea, so typing,
 *     selection and undo are the browser's own); an unknown variable is highlighted as a problem
 *   · Variables – the ones the app defines (`variables`), each with how often the text uses it and Insert; a variable
 *     the text uses but the app doesn't define is "Not defined", one it defines but the text never uses is "Not used"
 *   · Tokens – the count the app supplies (`tokenCount`, `tokenLimit`); the element never counts tokens itself
 *   · Compare – a word diff (inline-diff's diffWords) between the text and a chosen version, with Restore
 *   · Save as a new version – an optional note, then tc-save, cancelable; ⌘S / Ctrl+S in the editor does the same
 *
 *   <tc-instruction-editor .value=${{ role: "system", text }} .variables=${vars} .versions=${versions} token-count="412"></tc-instruction-editor>
 *
 * Every edit fires a cancelable tc-value-change ({ value }) – call preventDefault() to control `value`. With `name` it's
 * a form control that submits the text. Standard is a white card on a gray tray, variables on violet chips and the diff
 * in filled colours. Clean is one white card with hairline dividers, accent-tinted variables and a quieter diff.
 */

export type InstructionRole = { id: string; label: string };
export type InstructionEditorValue = {
  /** Which instructions these are – a role id, "system" or "developer" by default */
  role: string;
  text: string;
};
/** A variable the app fills in at run time */
export type InstructionVariable = {
  /** As written between the braces: {{customer_name}} */
  name: string;
  /** What it holds */
  description?: string;
};
/** A saved version */
export type InstructionVersion = {
  id: string;
  /** Short: "v3" */
  label: string;
  value: InstructionEditorValue;
  /** What changed, in the author's words */
  note?: string;
  /** Who saved it */
  by?: string;
  /** When, as text: "Yesterday 16:20" */
  at?: string;
};
/** tc-value-change */
export type InstructionEditorChange = { value: InstructionEditorValue };
/** tc-save: the version to add and the list with it added */
export type InstructionSaveEvent = { version: InstructionVersion; versions: InstructionVersion[] };
/** A variable as the text uses it */
export type InstructionVariableUse = { name: string; count: number; status: "ok" | "missing" | "unused"; description?: string };

export const defaultInstructionRoles: InstructionRole[] = [
  { id: "system", label: "System" },
  { id: "developer", label: "Developer" },
];
const VAR = /\{\{\s*([A-Za-z_][\w.-]*)\s*\}\}/g;
const DEFAULT_VALUE: InstructionEditorValue = { role: "system", text: "" };
let instances = 0;

/** The variables a text uses, by name, with how often */
export function instructionVariables(text: string): Map<string, number> {
  const out = new Map<string, number>();
  for (const m of text.matchAll(VAR)) out.set(m[1], (out.get(m[1]) ?? 0) + 1);
  return out;
}

/* file-text, braces, git-compare, save, rotate-ccw: Lucide (ISC, lucide.dev) */
const lucide = (cls: string, body: ReturnType<typeof svg>) =>
  html`<svg class=${cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const docIcon = svg`<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path>`;
const saveIcon = () =>
  lucide("ui-ied__icon", svg`<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path><path d="M7 3v4a1 1 0 0 0 1 1h7"></path>`);
const restoreIcon = () => lucide("ui-ied__icon", svg`<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path>`);

/**
 * System and developer instructions with highlighted variables, missing and unused variable warnings, an
 * app-supplied token count, a diff against a chosen version and Save as a new version.
 * @tag tc-instruction-editor
 * @fires tc-value-change - The text or the role changed, or a version was restored ({ value: InstructionEditorValue }); cancelable – prevent it to control `value`
 * @fires tc-save - Save as a new version was pressed ({ version, versions }: InstructionSaveEvent); cancelable – prevented, `versions` stays as it was
 */
export class TcInstructionEditor extends TcElement {
  static override ui = "ied";
  static formAssociated = true;

  /** The heading, and the group's name */
  @property() accessor heading = "Instructions";
  /** The role and the text. Changed by the user unless tc-value-change is prevented */
  @property({ attribute: false }) accessor value: InstructionEditorValue = DEFAULT_VALUE;
  /** Which instructions these can be; fewer than two hides the switch */
  @property({ attribute: false }) accessor roles: InstructionRole[] = defaultInstructionRoles;
  /** The variables the app fills in; the text is checked against them */
  @property({ attribute: false }) accessor variables: InstructionVariable[] = [];
  /** Saved versions, oldest first. Grows when Save isn't prevented */
  @property({ attribute: false }) accessor versions: InstructionVersion[] = [];
  /** The id of the version the text is compared with; unset compares with the latest */
  @property({ attribute: "compare-to" }) accessor compareTo: string | undefined = undefined;
  /** The text's length in tokens, as the app counts it; unset shows no count */
  @property({ type: Number, attribute: "token-count" }) accessor tokenCount: number | undefined = undefined;
  /** The most tokens the instructions should use; past it the count turns red */
  @property({ type: Number, attribute: "token-limit" }) accessor tokenLimit: number | undefined = undefined;
  /** The app is counting the tokens for the latest text */
  @property({ type: Boolean }) accessor counting = false;
  /** Placeholder in the empty editor */
  @property() accessor placeholder = "Say who the model is working for, what it should do and what it must not do. Use {{name}} for what the app fills in.";
  /** Submitted with the form: the text */
  @property({ reflect: true }) accessor name = "";
  /** Shows everything but nothing can be changed */
  @property({ type: Boolean, reflect: true }) accessor readonly = false;

  @state() private accessor note = "";
  @state() private accessor view: "edit" | "changes" = "edit";
  @state() private accessor announcement = "";

  private readonly internals: ElementInternals;
  private readonly uid = `tc-ied${++instances}`;
  private initialValue: InstructionEditorValue | null = null;

  constructor() {
    super();
    this.internals = this.attachInternals();
  }

  override connectedCallback() {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "group");
  }

  formResetCallback() {
    const value = this.initialValue ?? DEFAULT_VALUE;
    // Through tc-value-change like any edit, so a controlled wrapper hears of it and keeps the value until it agrees
    if (this.emit<InstructionEditorChange>("tc-value-change", { value }, { cancelable: true })) this.value = value;
    else this.requestUpdate();
  }

  /* ---------- The model ---------- */

  /** Every variable the text uses or the app defines, with its status */
  get variableUses(): InstructionVariableUse[] {
    const used = instructionVariables(this.value.text);
    const out: InstructionVariableUse[] = this.variables.map((v) => ({ name: v.name, description: v.description, count: used.get(v.name) ?? 0, status: used.has(v.name) ? "ok" : "unused" }));
    for (const [name, count] of used) if (!this.variables.some((v) => v.name === name)) out.push({ name, count, status: "missing" });
    return out;
  }

  /** The version the text is compared with */
  get comparedVersion(): InstructionVersion | undefined {
    return this.versions.find((v) => v.id === this.compareTo) ?? this.versions[this.versions.length - 1];
  }

  /** The text differs from the latest version (or there is none yet and the text isn't empty) */
  get dirty(): boolean {
    const latest = this.versions[this.versions.length - 1];
    return latest ? latest.value.text !== this.value.text || latest.value.role !== this.value.role : !!this.value.text.trim();
  }

  private commit(next: InstructionEditorValue, say = "") {
    if (this.readonly) return false;
    if (this.emit<InstructionEditorChange>("tc-value-change", { value: next }, { cancelable: true })) {
      this.value = next;
      if (say) this.announcement = say;
      return true;
    }
    this.requestUpdate();
    return false;
  }

  /** Inserts {{name}} at the caret, or in place of the selection */
  insertVariable(name: string) {
    const field = this.querySelector<HTMLTextAreaElement>(".ui-ied__input");
    const text = this.value.text;
    const start = field?.selectionStart ?? text.length;
    const end = field?.selectionEnd ?? text.length;
    const token = `{{${name}}}`;
    if (!this.commit({ ...this.value, text: text.slice(0, start) + token + text.slice(end) }, `Inserted ${token}`)) return;
    void this.updateComplete.then(() => {
      if (!field) return;
      field.focus();
      field.setSelectionRange(start + token.length, start + token.length);
    });
  }

  /** Saves the text as a new version: fires tc-save and, unless it's prevented, adds the version */
  save() {
    if (this.readonly || !this.dirty) return;
    const n = this.versions.length + 1;
    const note = this.note.trim();
    const version: InstructionVersion = { id: `${this.uid}-v${n}`, label: `v${n}`, value: { ...this.value }, ...(note ? { note } : {}) };
    const versions = [...this.versions, version];
    if (!this.emit<InstructionSaveEvent>("tc-save", { version, versions }, { cancelable: true })) return;
    this.versions = versions;
    this.announcement = `Saved as ${version.label}`;
  }

  private restore(v: InstructionVersion) {
    this.commit({ ...v.value }, `Restored ${v.label}`);
  }

  /* ---------- Editing ---------- */

  private onInput(e: Event) {
    const field = e.target as HTMLTextAreaElement;
    this.commit({ ...this.value, text: field.value });
    this.syncScroll();
  }

  private onKeyDown(e: KeyboardEvent) {
    if (e.key.toLowerCase() === "s" && (isMac() ? e.metaKey : e.ctrlKey) && !e.altKey && !e.shiftKey) {
      e.preventDefault();
      this.save();
    }
  }

  private syncScroll = () => {
    const field = this.querySelector<HTMLTextAreaElement>(".ui-ied__input");
    const mirror = this.querySelector<HTMLElement>(".ui-ied__mirror");
    if (field && mirror) {
      mirror.scrollTop = field.scrollTop;
      mirror.scrollLeft = field.scrollLeft;
    }
  };

  /* ---------- Updates ---------- */

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    // The reset baseline is what the first render shows, so props a framework sets after connecting (React does) count
    if (!this.hasUpdated) this.initialValue = this.value;
    this.toggleAttribute("data-readonly", this.readonly);
    // A new version (saved here, or passed back by the app): start the next note fresh and compare with it
    const before = changed.get("versions") as InstructionVersion[] | undefined;
    if (before && this.versions.length > before.length) {
      this.note = "";
      this.compareTo = undefined;
    }
  }

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (!this.hasAttribute("aria-labelledby")) this.setAttribute("aria-labelledby", `${this.uid}-h`);
    if (typeof this.internals.setFormValue === "function") this.internals.setFormValue(this.name ? this.value.text : null);
    this.syncScroll();
  }

  /* ---------- Rendering ---------- */

  /** The text as lines, its variables as chips, for the mirror under the textarea: the textarea's own text is
   *  transparent, so this is what shows – the caret, selection and typing stay the browser's */
  private marked(text: string) {
    const known = new Set(this.variables.map((v) => v.name));
    return text.split("\n").map((line) => {
      const parts: unknown[] = [];
      let at = 0;
      for (const m of line.matchAll(VAR)) {
        parts.push(line.slice(at, m.index));
        const inner = m[0].slice(2, -2);
        parts.push(html`<span class="ui-ied__chip" ?data-missing=${!known.has(m[1])}><span class="ui-ied__brace">{{</span>${inner}<span class="ui-ied__brace">}}</span></span>`);
        at = m.index + m[0].length;
      }
      // An empty line needs a character, or it has no height
      parts.push(line.slice(at) || "\u200b");
      return html`<div class="ui-ied__line">${parts}</div>`;
    });
  }

  private renderTokens() {
    const n = this.tokenCount;
    if (this.counting) return html`<span class="ui-ied__tokens" data-state="counting">Counting tokens…</span>`;
    if (n === undefined || !Number.isFinite(n)) return nothing;
    const limit = this.tokenLimit;
    const over = limit !== undefined && n > limit;
    return html`<span class="ui-ied__tokens" data-state=${over ? "over" : "ok"}>
      ${limit !== undefined
        ? html`<span class="ui-ied__meter" aria-hidden="true"><span class="ui-ied__meter-fill" style=${styleMap({ inlineSize: `${Math.min(100, (n / Math.max(1, limit)) * 100)}%` })}></span></span>`
        : nothing}
      <span>${n.toLocaleString("en-US")}${limit !== undefined ? ` of ${limit.toLocaleString("en-US")}` : ""} tokens${over ? " – over the limit" : ""}</span>
    </span>`;
  }

  private renderVariables() {
    const id = this.uid;
    const uses = this.variableUses;
    const missing = uses.filter((u) => u.status === "missing").length;
    const unused = uses.filter((u) => u.status === "unused").length;
    return html`<section class="ui-ied__vars-section" aria-labelledby=${`${id}-vars`}>
      <span class="ui-ied__section-label" id=${`${id}-vars`}>Variables</span>
      ${uses.length
        ? html`<ul class="ui-ied__vars">
            ${repeat(
              uses,
              (u) => u.name,
              (u) => {
                const state = u.status === "missing" ? "not defined" : u.status === "unused" ? "not used" : `${u.count}×`;
                const body = html`<code class="ui-ied__var-name">{{${u.name}}}</code><span class="ui-ied__var-status">${state}</span>${u.description
                    ? html`<span class="ui-ied__sr">, ${u.description}</span>`
                    : nothing}`;
                return html`<li class="ui-ied__var" data-status=${u.status}>
                  ${u.status !== "missing" && !this.readonly
                    ? html`<button type="button" class="ui-ied__var-btn" title=${ifDefined(u.description)} @click=${() => this.insertVariable(u.name)}><span class="ui-ied__sr">Insert </span>${body}</button>`
                    : html`<span class="ui-ied__var-btn" title=${ifDefined(u.description)}>${body}</span>`}
                </li>`;
              },
            )}
          </ul>`
        : html`<p class="ui-ied__none">None yet. Write <code class="ui-ied__code">{{name}}</code> where the app should fill something in.</p>`}
      ${missing || unused
        ? html`<p class="ui-ied__warn" data-tone=${missing ? "danger" : "warning"}>
            ${[missing ? `${missing === 1 ? "1 variable isn't" : `${missing} variables aren't`} defined – the app can't fill ${missing === 1 ? "it" : "them"} in` : "", unused ? `${unused === 1 ? "1 defined variable isn't" : `${unused} defined variables aren't`} used` : ""]
              .filter(Boolean)
              .join(" · ")}.
          </p>`
        : nothing}
    </section>`;
  }

  /** How the text differs from a version, word by word */
  private diff(v: InstructionVersion) {
    const parts: DiffSegment[] = diffWords(v.value.text, this.value.text);
    const words = (t: string) => t.match(/\S+/g)?.length ?? 0;
    const added = parts.reduce((n, p) => n + (p.type === "change" ? words(p.insert) : 0), 0);
    const removed = parts.reduce((n, p) => n + (p.type === "change" ? words(p.remove) : 0), 0);
    return { parts, added, removed, same: !added && !removed && v.value.role === this.value.role };
  }

  private renderChanges(v: InstructionVersion | undefined) {
    if (!v) return nothing;
    const { parts, same } = this.diff(v);
    const roleName = (r: string) => this.roles.find((x) => x.id === r)?.label ?? r;
    return html`<div class="ui-ied__diff" tabindex="0" role="region" aria-label=${`Changes since ${v.label}`}>${same
          ? html`<p class="ui-ied__same">No changes since ${v.label}.</p>`
          : html`${v.value.role !== this.value.role ? html`<p class="ui-ied__role-change">${roleName(v.value.role)} → ${roleName(this.value.role)}</p>` : nothing}${parts.map((p) =>
              p.type === "equal"
                ? p.text
                : html`${p.remove ? html`<del class="ui-ied__del"><span class="ui-ied__sr">removed: </span>${p.remove}</del>` : nothing}${p.insert
                    ? html`<ins class="ui-ied__ins"><span class="ui-ied__sr">added: </span>${p.insert}</ins>`
                    : nothing}`,
            )}`}</div>
      ${!same && !this.readonly
        ? html`<div class="ui-ied__changes-foot"><button type="button" class="ui-ied__ghost ui-ied__restore" @click=${() => this.restore(v)}>${restoreIcon()}Restore ${v.label}</button></div>`
        : nothing}`;
  }

  private onTabKey(e: KeyboardEvent) {
    const tabs = [...this.querySelectorAll<HTMLButtonElement>(".ui-ied__tab")];
    const at = tabs.indexOf(e.target as HTMLButtonElement);
    if (at < 0) return;
    const to = e.key === "ArrowRight" ? (at + 1) % tabs.length : e.key === "ArrowLeft" ? (at - 1 + tabs.length) % tabs.length : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    this.view = tabs[to].dataset.view as "edit" | "changes";
    tabs[to].focus();
  }

  private onRailKey(e: KeyboardEvent) {
    const radios = [...this.querySelectorAll<HTMLElement>(".ui-ied__version")];
    const at = radios.indexOf(e.target as HTMLElement);
    if (at < 0) return;
    const to = ["ArrowDown", "ArrowRight"].includes(e.key) ? (at + 1) % radios.length : ["ArrowUp", "ArrowLeft"].includes(e.key) ? (at - 1 + radios.length) % radios.length : e.key === "Home" ? 0 : e.key === "End" ? radios.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    this.pick(radios[to].dataset.id!);
    void this.updateComplete.then(() => this.querySelector<HTMLElement>(`.ui-ied__version[data-id="${CSS.escape(radios[to].dataset.id!)}"]`)?.focus());
  }

  /** Compares with a version and shows the changes */
  private pick(id: string) {
    this.compareTo = id;
    this.view = "changes";
  }

  private renderRail() {
    const id = this.uid;
    const compared = this.comparedVersion;
    const dirty = this.dirty;
    const latest = this.versions[this.versions.length - 1];
    const n = this.versions.length + 1;
    return html`<aside class="ui-ied__rail" aria-labelledby=${`${id}-versions`}>
      <span class="ui-ied__section-label" id=${`${id}-versions`}>Versions</span>
      <div class="ui-ied__node ui-ied__draft" ?data-dirty=${dirty}>
        <span class="ui-ied__dot" aria-hidden="true"></span>
        <div class="ui-ied__node-body">
          <span class="ui-ied__node-title">Working copy</span>
          <span class="ui-ied__node-meta" id=${`${id}-saved`}>${dirty ? (latest ? `Changed since ${latest.label}` : "Not saved yet") : latest ? `Same as ${latest.label}` : "Empty"}</span>
          ${this.readonly
            ? nothing
            : html`<label class="ui-ied__sr" for=${`${id}-note`}>What changed</label>
                <input
                  id=${`${id}-note`}
                  class="ui-ied__note"
                  type="text"
                  placeholder="What changed?"
                  .value=${live(this.note)}
                  ?disabled=${!dirty}
                  @input=${(e: Event) => (this.note = (e.target as HTMLInputElement).value)}
                  @keydown=${(e: KeyboardEvent) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      this.save();
                    }
                  }}
                />
                <button type="button" class="ui-ied__primary" aria-disabled=${dirty ? "false" : "true"} aria-describedby=${ifDefined(dirty ? undefined : `${id}-saved`)} @click=${() => this.save()}>
                  ${saveIcon()}Save as v${n}
                </button>`}
        </div>
      </div>
      ${this.versions.length
        ? html`<div class="ui-ied__versions" role="radiogroup" aria-label="Compare with" @keydown=${this.onRailKey}>
            ${repeat(
              [...this.versions].reverse(),
              (v) => v.id,
              (v) => {
                const on = v.id === compared?.id;
                return html`<div
                  class="ui-ied__node ui-ied__version"
                  role="radio"
                  data-id=${v.id}
                  aria-checked=${on ? "true" : "false"}
                  tabindex=${on ? "0" : "-1"}
                  @click=${() => this.pick(v.id)}
                >
                  <span class="ui-ied__dot" aria-hidden="true"></span>
                  <span class="ui-ied__node-body">
                    <span class="ui-ied__node-title">${v.label}${v === latest ? html` <span class="ui-ied__latest">Latest</span>` : nothing}</span>
                    ${v.note ? html`<span class="ui-ied__node-note">${v.note}</span>` : nothing}
                    ${v.by || v.at ? html`<span class="ui-ied__node-meta">${[v.by, v.at].filter(Boolean).join(" · ")}</span>` : nothing}
                  </span>
                </div>`;
              },
            )}
          </div>`
        : nothing}
    </aside>`;
  }

  protected override render() {
    const look = this.resolvedLook;
    const clean = look === "clean";
    const id = this.uid;
    const v = this.value;
    const uses = this.variableUses;
    const missing = uses.filter((u) => u.status === "missing");
    const compared = this.comparedVersion;
    const view = compared ? this.view : "edit";
    const stats = compared ? this.diff(compared) : null;
    const lines = v.text ? v.text.split("\n").length : 0;
    // The header (.tc-head): on the tray above the card in Standard, the card's first row in Clean
    const head = cardHead({
      icon: docIcon,
      title: this.heading,
      id: `${id}-h`,
      subtitle: this.versions.length ? `${this.dirty ? "Edited since" : "Saved as"} ${this.versions[this.versions.length - 1].label}` : "Not saved yet",
    });
    const body = html`
      <div class="ui-ied__body">
        <div class="ui-ied__main">
          <div class="ui-ied__frame">
            <div class="ui-ied__bar">
              ${compared
                ? html`<div class="ui-ied__tabs" role="tablist" aria-label="View" @keydown=${this.onTabKey}>
                    <button type="button" role="tab" class="ui-ied__tab" data-view="edit" id=${`${id}-tab-edit`} aria-controls=${`${id}-edit`} aria-selected=${view === "edit" ? "true" : "false"} tabindex=${view === "edit" ? "0" : "-1"} @click=${() => (this.view = "edit")}>Edit</button>
                    <button type="button" role="tab" class="ui-ied__tab" data-view="changes" id=${`${id}-tab-changes`} aria-controls=${`${id}-changes`} aria-selected=${view === "changes" ? "true" : "false"} tabindex=${view === "changes" ? "0" : "-1"} @click=${() => (this.view = "changes")}>
                      Changes since ${compared.label}${stats && !stats.same
                        ? html` <span class="ui-ied__stats">${stats.added ? html`<span class="ui-ied__plus">+${stats.added}</span>` : nothing}${stats.removed ? html`${stats.added ? " " : ""}<span class="ui-ied__minus">−${stats.removed}</span>` : nothing}<span class="ui-ied__sr"> words</span></span>`
                        : nothing}
                    </button>
                  </div>`
                : html`<span class="ui-ied__file">Instructions</span>`}
              ${this.roles.length > 1
                ? html`<span class="ui-ied__sr" id=${`${id}-role`}>Instructions for</span>
                    <tc-segmented-control
                      class="ui-ied__roles"
                      look=${look}
                      size="sm"
                      aria-labelledby=${`${id}-role`}
                      .options=${this.roles.map((r) => ({ value: r.id, label: r.label }))}
                      .value=${v.role}
                      ?disabled=${this.readonly}
                      @tc-value-change=${(e: CustomEvent<SegmentValueChange>) => {
                        // The inner control's event stops here: the page hears this element's tc-value-change only
                        e.stopPropagation();
                        e.preventDefault();
                        this.commit({ ...this.value, role: e.detail.value });
                      }}
                    ></tc-segmented-control>`
                : nothing}
            </div>
            <div class="ui-ied__panel" id=${`${id}-edit`} role=${ifDefined(compared ? "tabpanel" : undefined)} aria-labelledby=${ifDefined(compared ? `${id}-tab-edit` : undefined)} ?hidden=${view !== "edit"}>
              <div class="ui-ied__editor">
                <div class="ui-ied__mirror" aria-hidden="true">${this.marked(v.text)}</div>
                <textarea
                  class="ui-ied__input"
                  aria-labelledby=${`${id}-h`}
                  aria-describedby=${ifDefined(missing.length ? `${id}-missing` : undefined)}
                  aria-invalid=${missing.length ? "true" : "false"}
                  spellcheck="true"
                  placeholder=${this.placeholder}
                  .value=${live(v.text)}
                  ?readonly=${this.readonly}
                  @input=${this.onInput}
                  @keydown=${this.onKeyDown}
                  @scroll=${this.syncScroll}
                ></textarea>
              </div>
            </div>
            ${compared
              ? html`<div class="ui-ied__panel" id=${`${id}-changes`} role="tabpanel" aria-labelledby=${`${id}-tab-changes`} ?hidden=${view !== "changes"}>${this.renderChanges(compared)}</div>`
              : nothing}
            <div class="ui-ied__status">
              <span>${lines === 1 ? "1 line" : `${lines} lines`} · ${uses.filter((u) => u.status !== "unused").length === 1 ? "1 variable" : `${uses.filter((u) => u.status !== "unused").length} variables`}</span>
              ${this.renderTokens()}
            </div>
          </div>
          ${missing.length ? html`<p class="ui-ied__sr" id=${`${id}-missing`}>Uses variables the app doesn't define: ${missing.map((u) => u.name).join(", ")}</p>` : nothing}
          ${this.renderVariables()}
        </div>
        ${this.renderRail()}
      </div>
    `;
    return html`<span class="ui-ied__sr" role="status">${this.announcement}</span>${head}${clean ? body : html`<div class="ui-ied__card">${body}</div>`}`;
  }

  static override css = /* css */ `
[data-ui="ied"] {
  display: flow-root;
  box-sizing: border-box;
  container-type: inline-size;
  width: 100%;
  max-width: 880px;
  min-width: 0;
  color: var(--tc-text-primary);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="ied"] *, [data-ui="ied"] *::before, [data-ui="ied"] *::after { box-sizing: border-box; }
:where([data-ui="ied"]) :is(p, ul) { margin: 0; padding: 0; }
:where([data-ui="ied"]) ul { list-style: none; }
:where([data-ui="ied"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="ied"] :is(button, .ui-ied__version, .ui-ied__diff):focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="ied"] button[aria-disabled="true"] { cursor: not-allowed; opacity: 0.55; }
[data-ui="ied"] [hidden] { display: none !important; }
/* Standard: a gray tray around a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ied"] { padding: var(--tc-tray-inset); border-radius: var(--tc-tray-radius); background: var(--tc-surface-tray); }
.ui-ied__card { display: flow-root; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
/* Clean: one white card with hairline shadows */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ied"] { border-radius: var(--tc-card-radius); background: var(--tc-surface-raised); box-shadow: var(--tc-card-shadow); }
.ui-ied__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.ui-ied__icon { flex: none; width: 14px; height: 14px; stroke-width: 1.75; }
:where([data-look="clean"], [data-look="clean"] *) .ui-ied__icon { stroke-width: 1.5; }

.ui-ied__section-label { color: var(--tc-caption-color); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); }

/* ---------- Layout: the editor, the version rail beside it ---------- */
.ui-ied__body { display: grid; grid-template-columns: minmax(0, 1fr) 13rem; gap: var(--tc-space-4); padding: var(--tc-space-4); }
/* Clean: the header row above already leaves the gap */
:where([data-look="clean"], [data-look="clean"] *).ui-ied__body { padding-top: var(--tc-space-1); }
.ui-ied__main { display: grid; align-content: start; gap: var(--tc-space-3); min-width: 0; }

/* ---------- The editor frame: a tab bar, a code surface with a line gutter, a status bar ---------- */
.ui-ied__frame { --ied-gutter: var(--tc-space-10); display: grid; overflow: hidden; border-radius: var(--tc-radius-lg); background: var(--tc-surface-well); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-default); }
:where([data-look="clean"], [data-look="clean"] *).ui-ied__frame { border-radius: var(--tc-radius-md); background: var(--tc-surface-raised); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-strong); }
.ui-ied__frame:has(.ui-ied__input:focus-visible) { box-shadow: var(--tc-field-shadow-focus); }
.ui-ied__bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-2); min-height: var(--tc-control-h-lg); padding: var(--tc-space-1) var(--tc-space-1-5) 0 var(--tc-space-1); border-bottom: var(--tc-hairline) solid var(--tc-divider); }
.ui-ied__file { padding: 0 var(--tc-space-2); color: var(--tc-text-secondary); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); }
.ui-ied__tabs { display: flex; align-self: stretch; }
.ui-ied__tab { position: relative; display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-sm); color: var(--tc-text-muted); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; }
.ui-ied__tab:hover { color: var(--tc-text-primary); }
.ui-ied__tab[aria-selected="true"] { color: var(--tc-text-primary); }
.ui-ied__tab[aria-selected="true"]::after { content: ""; position: absolute; right: var(--tc-space-2); bottom: 0; left: var(--tc-space-2); height: 2px; border-radius: var(--tc-radius-full); background: var(--tc-text-primary); }
:where([data-look="clean"], [data-look="clean"] *).ui-ied__tab[aria-selected="true"]::after { background: var(--tc-accent); }
.ui-ied__stats { display: inline-flex; gap: var(--tc-space-1); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-ied__plus { color: var(--tc-status-success-fg); }
.ui-ied__minus { color: var(--tc-status-danger-fg); }
.ui-ied__roles { margin-bottom: var(--tc-space-1); }
.ui-ied__panel { position: relative; min-width: 0; }
/* The code surface: a mirror that shows the text, under a transparent native textarea that takes the typing */
.ui-ied__editor { position: relative; display: grid; counter-reset: ied-line; }
.ui-ied__editor::before { content: ""; position: absolute; top: 0; bottom: 0; left: 0; width: var(--ied-gutter); border-right: var(--tc-hairline) solid var(--tc-divider); pointer-events: none; }
.ui-ied__mirror, .ui-ied__input {
  grid-area: 1 / 1;
  min-height: 11rem;
  max-height: 26rem;
  margin: 0;
  padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-3) calc(var(--ied-gutter) + var(--tc-space-3));
  border: 0;
  font-family: var(--tc-font-mono);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-relaxed);
  white-space: pre-wrap;
  overflow-wrap: break-word;
  word-break: normal;
  tab-size: 2;
  scrollbar-gutter: stable;
}
.ui-ied__mirror { overflow: hidden; color: var(--tc-syntax-text); pointer-events: none; }
.ui-ied__line { position: relative; counter-increment: ied-line; }
.ui-ied__line::before { content: counter(ied-line); position: absolute; top: 0; left: calc(-1 * (var(--ied-gutter) + var(--tc-space-3))); width: calc(var(--ied-gutter) - var(--tc-space-2)); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); text-align: right; font-variant-numeric: tabular-nums; }
.ui-ied__input { position: relative; width: 100%; overflow: auto; outline: 0; background: transparent; color: transparent; caret-color: var(--tc-text-primary); resize: vertical; field-sizing: content; }
.ui-ied__input::selection { background: var(--tc-accent-highlight); color: transparent; }
.ui-ied__input::placeholder { color: var(--tc-text-placeholder); font-family: var(--tc-font-sans); }
/* A variable: a chip drawn without padding, so the text stays where the textarea has it */
.ui-ied__chip { border-radius: var(--tc-radius-xs); background: var(--tc-tone-violet-bg); box-shadow: 0 0 0 2px var(--tc-tone-violet-bg); color: var(--tc-tone-violet-fg); font-weight: var(--tc-font-weight-medium); }
:where([data-look="clean"], [data-look="clean"] *) .ui-ied__chip { background: var(--tc-accent-subtle); box-shadow: 0 0 0 2px var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-ied__chip[data-missing] { background: var(--tc-status-danger-bg) !important; box-shadow: 0 0 0 2px var(--tc-status-danger-bg) !important; color: var(--tc-status-danger-fg) !important; text-decoration: underline wavy var(--tc-status-danger-solid); text-decoration-thickness: 1px; text-underline-offset: 3px; }
.ui-ied__brace { opacity: 0.6; font-weight: var(--tc-font-weight-regular); }
/* The changes view: the same surface, the diff inline */
.ui-ied__diff { min-height: 11rem; max-height: 26rem; overflow: auto; padding: var(--tc-space-3) var(--tc-space-3) var(--tc-space-3) calc(var(--ied-gutter) + var(--tc-space-3)); color: var(--tc-syntax-text); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-relaxed); white-space: pre-wrap; overflow-wrap: break-word; }
.ui-ied__same, .ui-ied__role-change { margin-bottom: var(--tc-space-2) !important; color: var(--tc-text-muted); font-family: var(--tc-font-sans); }
.ui-ied__del, .ui-ied__ins { padding: 0 var(--tc-space-0-5); border-radius: var(--tc-radius-xs); -webkit-box-decoration-break: clone; box-decoration-break: clone; }
.ui-ied__del { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); text-decoration: line-through; text-decoration-thickness: 1px; }
.ui-ied__ins { background: var(--tc-status-success-bg); color: var(--tc-status-success-fg); text-decoration: none; }
:where([data-look="clean"], [data-look="clean"] *).ui-ied__del { background: none; color: var(--tc-text-muted); }
:where([data-look="clean"], [data-look="clean"] *).ui-ied__ins { color: var(--tc-text-primary); text-decoration: underline; text-decoration-color: var(--tc-status-success-solid); text-underline-offset: 3px; }
.ui-ied__changes-foot { display: flex; justify-content: flex-end; padding: 0 var(--tc-space-2) var(--tc-space-2); }
.ui-ied__status { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tc-space-1) var(--tc-space-3); min-height: var(--tc-control-h-sm); padding: var(--tc-space-1) var(--tc-space-3); border-top: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; }
.ui-ied__tokens { display: inline-flex; align-items: center; gap: var(--tc-space-2); white-space: nowrap; }
.ui-ied__tokens[data-state="over"] { color: var(--tc-status-danger-fg); font-weight: var(--tc-font-weight-medium); }
.ui-ied__meter { display: block; width: 48px; height: var(--tc-meter-h); overflow: hidden; border-radius: var(--tc-meter-radius); background: var(--tc-meter-track); }
.ui-ied__meter-fill { display: block; height: 100%; border-radius: inherit; background: var(--tc-meter-fill); }
:where([data-look="clean"], [data-look="clean"] *).ui-ied__meter-fill { background: var(--tc-accent); }
.ui-ied__tokens[data-state="over"] .ui-ied__meter-fill { background: var(--tc-status-danger-solid); }

/* ---------- Variables: chips that insert ---------- */
.ui-ied__vars-section { display: grid; gap: var(--tc-space-2); }
.ui-ied__vars { display: flex; flex-wrap: wrap; gap: var(--tc-space-1-5); }
.ui-ied__var-btn { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2) 0 var(--tc-space-1); border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); font-size: var(--tc-control-font-size); transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard); }
button.ui-ied__var-btn:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-ied__var-name { padding: 0 var(--tc-space-1); border-radius: var(--tc-radius-xs); background: var(--tc-tone-violet-bg); color: var(--tc-tone-violet-fg); font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); white-space: nowrap; }
:where([data-look="clean"], [data-look="clean"] *).ui-ied__var-name { background: var(--tc-accent-subtle); color: var(--tc-accent-text); }
.ui-ied__var-status { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-ied__var[data-status="missing"] .ui-ied__var-btn { background: var(--tc-status-danger-bg); box-shadow: none; }
.ui-ied__var[data-status="missing"] .ui-ied__var-name { background: none; color: var(--tc-status-danger-fg); }
.ui-ied__var[data-status="missing"] .ui-ied__var-status { color: var(--tc-status-danger-fg); }
.ui-ied__var[data-status="unused"] .ui-ied__var-status { color: var(--tc-status-warning-fg); }
.ui-ied__none { color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-ied__code { font-family: var(--tc-font-mono); font-size: var(--tc-font-size-xs); }
.ui-ied__warn { padding: var(--tc-space-2) var(--tc-space-2-5); border-radius: var(--tc-radius-md); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-ied__warn[data-tone="danger"] { background: var(--tc-status-danger-bg); color: var(--tc-status-danger-fg); }
.ui-ied__warn[data-tone="warning"] { background: var(--tc-status-warning-bg); color: var(--tc-status-warning-fg); }

/* ---------- The version rail: the working copy on top, saved versions down a line ---------- */
.ui-ied__rail { display: grid; align-content: start; gap: var(--tc-space-2); min-width: 0; }
.ui-ied__versions { display: grid; }
.ui-ied__node { position: relative; display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--tc-space-2-5); padding: var(--tc-space-2) var(--tc-space-2) var(--tc-space-2) var(--tc-space-1); border-radius: var(--tc-radius-md); }
.ui-ied__node::before { content: ""; position: absolute; top: 0; bottom: 0; left: calc(var(--tc-space-1) + 5px); width: 2px; transform: translateX(-50%); background: var(--tc-border-default); }
.ui-ied__draft::before { top: var(--tc-space-3); }
.ui-ied__versions .ui-ied__node:last-child::before { bottom: calc(100% - var(--tc-space-3)); }
.ui-ied__dot { position: relative; z-index: 1; width: 10px; height: 10px; margin-top: var(--tc-space-1); border-radius: 50%; background: var(--tc-surface-raised); box-shadow: inset 0 0 0 2px var(--tc-border-strong); }
.ui-ied__draft[data-dirty] .ui-ied__dot { background: var(--tc-status-warning-solid); box-shadow: none; }
.ui-ied__node-body { display: grid; gap: var(--tc-space-1); min-width: 0; }
.ui-ied__node-title { display: flex; align-items: center; gap: var(--tc-space-1-5); color: var(--tc-text-primary); font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); }
.ui-ied__node-note { color: var(--tc-text-secondary); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); }
.ui-ied__node-meta { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-snug); }
.ui-ied__latest { color: var(--tc-text-muted); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-regular); }
.ui-ied__version { cursor: pointer; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-ied__version:hover { background: var(--tc-fill-hover); }
.ui-ied__version[aria-checked="true"] { background: var(--tc-fill-selected); }
:where([data-look="clean"], [data-look="clean"] *).ui-ied__version[aria-checked="true"] { background: var(--tc-accent-subtle); }
.ui-ied__version[aria-checked="true"] :is(.ui-ied__latest, .ui-ied__node-meta) { color: var(--tc-text-secondary); }
.ui-ied__version[aria-checked="true"] .ui-ied__dot { box-shadow: inset 0 0 0 3px var(--tc-accent); }
.ui-ied__note {
  width: 100%;
  height: var(--tc-field-h);
  margin: 0;
  padding: 0 var(--tc-field-px);
  border: 0;
  border-radius: var(--tc-field-radius);
  outline: 0;
  background: var(--tc-field-bg);
  box-shadow: var(--tc-field-shadow);
  color: var(--tc-text-primary);
  font: inherit;
  font-size: var(--tc-field-font-size);
  transition: box-shadow var(--tc-duration-fast) var(--tc-ease-standard);
}
.ui-ied__note:hover:not(:disabled) { box-shadow: var(--tc-field-shadow-hover); }
.ui-ied__note:focus-visible { box-shadow: var(--tc-field-shadow-focus); }
.ui-ied__note::placeholder { color: var(--tc-text-placeholder); }
.ui-ied__note:disabled { opacity: 0.55; }
.ui-ied__primary { display: inline-flex; align-items: center; justify-content: center; gap: var(--tc-space-1-5); height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-primary-bg); box-shadow: var(--tc-action-primary-shadow); color: var(--tc-action-primary-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-ied__primary:hover:not([aria-disabled="true"]) { background: var(--tc-action-primary-bg-hover); }
.ui-ied__ghost { display: inline-flex; align-items: center; gap: var(--tc-space-1); height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border-radius: var(--tc-control-radius-sm); color: var(--tc-action-ghost-fg); font-size: var(--tc-control-font-size); font-weight: var(--tc-control-font-weight); white-space: nowrap; transition: background-color var(--tc-duration-fast) var(--tc-ease-standard); }
.ui-ied__ghost:hover { background: var(--tc-action-ghost-bg-hover); color: var(--tc-text-primary); }

/* Narrow: the rail goes under the editor */
@container (max-width: 640px) {
  .ui-ied__body { grid-template-columns: minmax(0, 1fr); }
}
@container (max-width: 480px) {
  .ui-ied__body { padding-left: var(--tc-space-3); padding-right: var(--tc-space-3); }
  .ui-ied__frame { --ied-gutter: var(--tc-space-7); }
  .ui-ied__tab { padding: 0 var(--tc-space-2); }
}
@media (pointer: coarse) {
  .ui-ied__ghost, .ui-ied__var-btn { height: 40px; }
}
@media (prefers-reduced-motion: reduce) {
  [data-ui="ied"] *, [data-ui="ied"] *::before, [data-ui="ied"] *::after { animation: none !important; transition: none !important; }
}
`;
}

if (!customElements.get("tc-instruction-editor")) customElements.define("tc-instruction-editor", TcInstructionEditor);

declare global {
  interface HTMLElementTagNameMap {
    "tc-instruction-editor": TcInstructionEditor;
  }
}
