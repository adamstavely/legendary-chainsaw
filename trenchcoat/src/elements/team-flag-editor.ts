import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { live } from "lit/directives/live.js";
import { repeat } from "lit/directives/repeat.js";
import { styleMap } from "lit/directives/style-map.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { flagGlyph, flagGlyphCss, type TeamFlag } from "./internal/team-flag";

/*
 * <tc-team-flag-editor> – where a team decides what its flags mean: each flag's colour, name and meaning, and their
 * order, which is the order <tc-team-flag-picker> offers them in. Colour comes from a row of swatches (arrow keys move
 * through them) or a custom colour. Names commit when the field loses focus or on Enter; an empty name or one already
 * taken is refused with a reason. With `usage`, removing a flag that's on files asks first and says how many.
 * `readonly` shows the flags and their meanings to people who can't change them.
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-team-flag-editor .flags=${flags} .usage=${{ review: 12 }}></tc-team-flag-editor>
 */

export type { TeamFlag };
export type TeamFlagsChangeKind = "add" | "edit" | "remove" | "move";
export type TeamFlagsChange = { flags: TeamFlag[]; change: TeamFlagsChangeKind; flag: TeamFlag };

/** The editor's words, every one renameable through `labels` */
export type TeamFlagEditorLabels = {
  name: string;
  meaning: string;
  meaningPlaceholder: string;
  color: string;
  custom: string;
  add: string;
  remove: string;
  moveUp: string;
  moveDown: string;
  keep: string;
  empty: string;
  /** "{n} files" */
  usedOn: string;
  usedOnOne: string;
  /** Asked before removing a flag that's on files; {n} is how many */
  confirm: string;
  confirmOne: string;
  needsName: string;
  /** {name} is the name that's taken */
  nameTaken: string;
  /** {flag} is the flag that already has this colour */
  sameColor: string;
  /** Announced; {flag} is the flag's name */
  added: string;
  removed: string;
  moved: string;
};
export const defaultTeamFlagEditorLabels: TeamFlagEditorLabels = {
  name: "Name",
  meaning: "Meaning",
  meaningPlaceholder: "When should someone use this flag?",
  color: "Colour",
  custom: "Custom colour",
  add: "Add flag",
  remove: "Remove",
  moveUp: "Move up",
  moveDown: "Move down",
  keep: "Keep",
  empty: "No flags yet. Add one to give your team a shared way to mark files.",
  usedOn: "{n} files",
  usedOnOne: "1 file",
  confirm: "{n} files will lose this flag.",
  confirmOne: "1 file will lose this flag.",
  needsName: "A flag needs a name.",
  nameTaken: "There's already a flag called {name}.",
  sameColor: "Same colour as {flag}, so only the name tells them apart.",
  added: "Added {flag}",
  removed: "Removed {flag}",
  moved: "Moved {flag}",
};

/** The swatches when `palette` isn't set: eight hues that stay apart from each other */
export const defaultTeamFlagPalette = ["#DC2626", "#EA580C", "#CA8A04", "#16A34A", "#0D9488", "#2563EB", "#7C3AED", "#DB2777"];

const FLAG_ICON = svg`<path d="M4 22V15"></path><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>`;
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
let instances = 0;

/**
 * Lets a team set each flag's colour, name, meaning and order.
 * @tag tc-team-flag-editor
 * @fires tc-flags-change - A flag was added, edited, removed or moved ({ flags, change, flag }: TeamFlagsChange); cancelable – prevented, `flags` stays as it was
 */
export class TcTeamFlagEditor extends TcElement {
  static override ui = "tfe";

  /** The heading */
  @property() accessor heading = "Team flags";
  /** A line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The team's flags, in the order they're offered. Changed by the user unless a tc-flags-change listener calls preventDefault() */
  @property({ attribute: false }) accessor flags: TeamFlag[] = [];
  /** How many files each flag is on, by id */
  @property({ attribute: false }) accessor usage: Record<string, number> = {};
  /** The colours offered as swatches */
  @property({ attribute: false }) accessor palette: string[] = defaultTeamFlagPalette;
  /** Show the flags and what they mean without letting them change */
  @property({ type: Boolean, reflect: true }) accessor readonly = false;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<TeamFlagEditorLabels> = {};

  /** A flag being added, not part of `flags` until it has a name */
  @state() private accessor draft: TeamFlag | null = null;
  @state() private accessor errors: Record<string, string> = {};
  @state() private accessor confirming: string | null = null;
  @state() private accessor announce = "";
  private readonly uid = `tc-tfe-${++instances}`;
  private nextId = 1;

  private get words(): TeamFlagEditorLabels {
    return { ...defaultTeamFlagEditorLabels, ...this.labels };
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("flags") && this.confirming && !this.flags.some((f) => f.id === this.confirming)) this.confirming = null;
  }

  private commit(flags: TeamFlag[], change: TeamFlagsChangeKind, flag: TeamFlag) {
    if (!this.emit<TeamFlagsChange>("tc-flags-change", { flags, change, flag }, { cancelable: true })) {
      this.requestUpdate();
      return false;
    }
    this.flags = flags;
    return true;
  }

  private nameProblem(name: string, id: string) {
    const w = this.words;
    if (!name.trim()) return w.needsName;
    const taken = this.flags.find((f) => f.id !== id && same(f.label, name));
    return taken ? w.nameTaken.replace("{name}", taken.label) : "";
  }

  private setError(id: string, message: string) {
    const { [id]: _, ...rest } = this.errors;
    this.errors = message ? { ...rest, [id]: message } : rest;
  }

  private newId() {
    let id: string;
    do id = `flag-${this.nextId++}`;
    while (this.flags.some((f) => f.id === id));
    return id;
  }

  private startAdd() {
    if (this.draft) {
      this.focusName(this.draft.id);
      return;
    }
    const used = new Set(this.flags.map((f) => f.color.toLowerCase()));
    const color = this.palette.find((c) => !used.has(c.toLowerCase())) ?? this.palette[0] ?? "#2563EB";
    const draft = { id: this.newId(), label: "", meaning: "", color };
    this.draft = draft;
    this.focusName(draft.id);
  }

  private focusName(id: string) {
    this.updateComplete.then(() => this.querySelector<HTMLInputElement>(`[data-flag="${CSS.escape(id)}"] .ui-tfe__name`)?.focus());
  }

  private patchFlag(flag: TeamFlag, patch: Partial<TeamFlag>) {
    const next = { ...flag, ...patch };
    if (flag.id === this.draft?.id) {
      this.draft = next;
      return;
    }
    this.commit(
      this.flags.map((f) => (f.id === flag.id ? next : f)),
      "edit",
      next,
    );
  }

  private commitName(flag: TeamFlag, input: HTMLInputElement) {
    const name = input.value.trim();
    const isDraft = flag.id === this.draft?.id;
    // A new flag left blank isn't a mistake yet: it just hasn't been named
    if (isDraft && !name) {
      this.setError(flag.id, "");
      return;
    }
    const problem = this.nameProblem(name, flag.id);
    this.setError(flag.id, problem);
    if (problem) return;
    if (isDraft) {
      const next = { ...this.draft!, label: name };
      if (this.commit([...this.flags, next], "add", next)) {
        this.draft = null;
        this.announce = this.words.added.replace("{flag}", name);
      }
      return;
    }
    if (name !== flag.label) this.patchFlag(flag, { label: name });
  }

  private askRemove(flag: TeamFlag) {
    if (flag.id === this.draft?.id) {
      this.draft = null;
      this.setError(flag.id, "");
      this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-tfe__add")?.focus());
      return;
    }
    if ((this.usage[flag.id] ?? 0) > 0) {
      this.confirming = flag.id;
      this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-flag="${CSS.escape(flag.id)}"] .ui-tfe__keep`)?.focus());
      return;
    }
    this.removeFlag(flag);
  }

  private removeFlag(flag: TeamFlag) {
    this.confirming = null;
    if (this.commit(this.flags.filter((f) => f.id !== flag.id), "remove", flag)) {
      this.setError(flag.id, "");
      this.announce = this.words.removed.replace("{flag}", flag.label);
      this.updateComplete.then(() => this.querySelector<HTMLElement>(".ui-tfe__add")?.focus());
    }
  }

  private move(flag: TeamFlag, by: -1 | 1, button: "up" | "down") {
    const i = this.flags.findIndex((f) => f.id === flag.id);
    const j = i + by;
    if (i < 0 || j < 0 || j >= this.flags.length) return;
    const flags = [...this.flags];
    [flags[i], flags[j]] = [flags[j]!, flags[i]!];
    if (this.commit(flags, "move", flag)) {
      this.announce = this.words.moved.replace("{flag}", flag.label);
      this.updateComplete.then(() => {
        const row = this.querySelector(`[data-flag="${CSS.escape(flag.id)}"]`);
        // At the end of the list that button has gone quiet, so focus goes to the one that still works
        const wanted = row?.querySelector<HTMLButtonElement>(`[data-move="${button}"]`);
        (wanted && !wanted.disabled ? wanted : row?.querySelector<HTMLButtonElement>("[data-move]:not(:disabled)"))?.focus();
      });
    }
  }

  private onSwatchKey(e: KeyboardEvent, flag: TeamFlag, swatches: string[]) {
    const i = swatches.findIndex((c) => same(c, flag.color));
    const n = swatches.length;
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % n;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    if (next < 0) return;
    e.preventDefault();
    const row = (e.currentTarget as HTMLElement).closest("[data-flag]");
    this.patchFlag(flag, { color: swatches[next]! });
    this.updateComplete.then(() => row?.querySelector<HTMLElement>('.ui-tfe__swatch[tabindex="0"]')?.focus());
  }

  private usedOn(id: string) {
    const n = this.usage[id] ?? 0;
    if (!n) return "";
    return n === 1 ? this.words.usedOnOne : this.words.usedOn.replace("{n}", String(n));
  }

  private renderReadonly(flag: TeamFlag) {
    const used = this.usedOn(flag.id);
    return html`<li class="ui-tfe__row ui-tfe__row--read" data-flag=${flag.id}>
      ${flagGlyph(flag.color)}
      <div class="ui-tfe__read"><span class="ui-tfe__read-name">${flag.label}</span>${flag.meaning ? html`<span class="ui-tfe__read-meaning">${flag.meaning}</span>` : nothing}</div>
      ${used ? html`<span class="ui-tfe__used">${used}</span>` : nothing}
    </li>`;
  }

  private renderRow(flag: TeamFlag, index: number) {
    const w = this.words;
    const isDraft = flag.id === this.draft?.id;
    const id = `${this.uid}-${flag.id}`;
    const error = this.errors[flag.id];
    const twin = this.flags.find((f) => f.id !== flag.id && same(f.color, flag.color));
    const known = this.palette.some((c) => same(c, flag.color));
    const swatches = known ? this.palette : [...this.palette, flag.color];
    const used = this.usedOn(flag.id);
    const n = this.usage[flag.id] ?? 0;
    return html`<li class="ui-tfe__row" data-flag=${flag.id}>
      <div class="ui-tfe__fields">
        <div class="ui-tfe__field">
          <label class="ui-tfe__label" for=${`${id}-name`}>${w.name}</label>
          <span class="ui-tfe__input-wrap" data-invalid=${error ? "true" : "false"}>
            ${flagGlyph(flag.color)}
            <input
              id=${`${id}-name`}
              class="ui-tfe__name ui-tfe__input"
              .value=${live(flag.label)}
              aria-invalid=${error ? "true" : "false"}
              aria-describedby=${error ? `${id}-error` : nothing}
              @change=${(e: Event) => this.commitName(flag, e.target as HTMLInputElement)}
              @keydown=${(e: KeyboardEvent) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  this.commitName(flag, e.target as HTMLInputElement);
                }
              }}
            />
          </span>
          ${error ? html`<p class="ui-tfe__error" id=${`${id}-error`}>${error}</p>` : nothing}
        </div>
        <div class="ui-tfe__field">
          <label class="ui-tfe__label" for=${`${id}-meaning`}>${w.meaning}</label>
          <span class="ui-tfe__input-wrap">
            <input
              id=${`${id}-meaning`}
              class="ui-tfe__meaning ui-tfe__input"
              .value=${live(flag.meaning ?? "")}
              placeholder=${w.meaningPlaceholder}
              @change=${(e: Event) => this.patchFlag(flag, { meaning: (e.target as HTMLInputElement).value.trim() })}
            />
          </span>
        </div>
      </div>
      <div class="ui-tfe__color">
        <div class="ui-tfe__swatches" role="radiogroup" aria-label=${`${w.color}, ${flag.label || w.add}`} @keydown=${(e: KeyboardEvent) => this.onSwatchKey(e, flag, swatches)}>
          ${swatches.map((c) => {
            const on = same(c, flag.color);
            return html`<button
              type="button"
              class="ui-tfe__swatch"
              role="radio"
              aria-checked=${on ? "true" : "false"}
              aria-label=${c}
              tabindex=${on ? 0 : -1}
              style=${styleMap({ "--tc-tfe-swatch": c })}
              @click=${() => this.patchFlag(flag, { color: c })}
            ></button>`;
          })}
        </div>
        <label class="ui-tfe__custom">
          <input type="color" class="ui-tfe__custom-input" .value=${live(flag.color.toLowerCase())} @change=${(e: Event) => this.patchFlag(flag, { color: (e.target as HTMLInputElement).value })} />
          <span>${w.custom}</span>
        </label>
        ${twin ? html`<p class="ui-tfe__hint">${w.sameColor.replace("{flag}", twin.label)}</p>` : nothing}
      </div>
      <div class="ui-tfe__actions">
        ${used ? html`<span class="ui-tfe__used">${used}</span>` : nothing}
        ${isDraft
          ? nothing
          : html`<button type="button" class="ui-tfe__action" data-move="up" ?disabled=${index === 0} @click=${() => this.move(flag, -1, "up")}>${w.moveUp}<span class="tc-sr-only">, ${flag.label}</span></button>
              <button type="button" class="ui-tfe__action" data-move="down" ?disabled=${index === this.flags.length - 1} @click=${() => this.move(flag, 1, "down")}>${w.moveDown}<span class="tc-sr-only">, ${flag.label}</span></button>`}
        <button type="button" class="ui-tfe__action ui-tfe__remove" @click=${() => this.askRemove(flag)}>${w.remove}<span class="tc-sr-only">, ${flag.label || w.add}</span></button>
      </div>
      ${this.confirming === flag.id
        ? html`<div class="ui-tfe__confirm" role="group" aria-label=${`${w.remove}, ${flag.label}`}>
            <span>${n === 1 ? w.confirmOne : w.confirm.replace("{n}", String(n))}</span>
            <button
              type="button"
              class="ui-tfe__action ui-tfe__keep"
              @click=${() => {
                this.confirming = null;
                this.updateComplete.then(() => this.querySelector<HTMLElement>(`[data-flag="${CSS.escape(flag.id)}"] .ui-tfe__remove`)?.focus());
              }}
            >
              ${w.keep}
            </button>
            <button type="button" class="ui-tfe__action ui-tfe__confirm-remove" @click=${() => this.removeFlag(flag)}>${w.remove}<span class="tc-sr-only">, ${flag.label}</span></button>
          </div>`
        : nothing}
    </li>`;
  }

  protected override render() {
    const w = this.words;
    const rows = this.draft ? [...this.flags, this.draft] : this.flags;
    return html`${cardHead({ icon: FLAG_ICON, title: this.heading, subtitle: this.description, id: `${this.uid}-title`, aside: html`<span class="ui-tfe__count">${this.flags.length}</span>` })}
      <div class="ui-tfe__card">
        ${rows.length
          ? html`<ul class="ui-tfe__list" aria-labelledby=${`${this.uid}-title`}>
              ${repeat(
                rows,
                (f) => f.id,
                (f, i) => (this.readonly ? this.renderReadonly(f) : this.renderRow(f, i)),
              )}
            </ul>`
          : html`<p class="ui-tfe__empty">${w.empty}</p>`}
        ${this.readonly ? nothing : html`<div class="ui-tfe__foot"><button type="button" class="ui-tfe__add" @click=${this.startAdd}>${w.add}</button></div>`}
      </div>
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="tfe"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tfe"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* A swatch's size – override it on the element */
[data-ui="tfe"] { --tc-tfe-swatch-size: 24px; }
[data-ui="tfe"] *, [data-ui="tfe"] *::before, [data-ui="tfe"] *::after { box-sizing: border-box; }
[data-ui="tfe"] p { margin: 0; }
:where([data-look="standard"], [data-look="standard"] *)[data-ui="tfe"] .ui-tfe__card { border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-tfe__count { color: var(--tc-text-muted); font-variant-numeric: tabular-nums; }
.ui-tfe__list { display: grid; margin: 0; padding: 0; list-style: none; }
.ui-tfe__row { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-4); box-shadow: inset 0 calc(-1 * var(--tc-hairline)) var(--tc-border-subtle); }
.ui-tfe__row--read { display: flex; align-items: flex-start; gap: var(--tc-space-2); padding: var(--tc-space-3) var(--tc-space-4); }
.ui-tfe__read { display: grid; flex: 1; min-width: 0; gap: var(--tc-space-0-5); }
.ui-tfe__read-name { font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-tfe__read-meaning { color: var(--tc-text-secondary); overflow-wrap: anywhere; }
.ui-tfe__fields { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: var(--tc-space-3); }
.ui-tfe__field { display: grid; gap: var(--tc-space-1); align-content: start; min-width: 0; }
.ui-tfe__label { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-weight: var(--tc-font-weight-medium); }
.ui-tfe__input-wrap { display: flex; align-items: center; gap: var(--tc-space-1-5); height: var(--tc-field-h); padding: 0 var(--tc-field-px); border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); }
.ui-tfe__input-wrap:hover { box-shadow: var(--tc-field-shadow-hover); }
.ui-tfe__input-wrap:focus-within { box-shadow: var(--tc-field-shadow-focus); }
.ui-tfe__input-wrap[data-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-tfe__input { flex: 1; width: 100%; min-width: 0; padding: 0; border: 0; outline: 0; background: none; color: var(--tc-text-primary); font: inherit; font-size: var(--tc-field-font-size); }
.ui-tfe__input::placeholder { color: var(--tc-text-muted); }
.ui-tfe__error { color: var(--tc-status-danger-fg); font-size: var(--tc-font-size-xs); }
.ui-tfe__hint { flex-basis: 100%; color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); }
.ui-tfe__color { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2) var(--tc-space-3); }
.ui-tfe__swatches { display: flex; flex-wrap: wrap; gap: var(--tc-space-1); }
.ui-tfe__swatch { width: var(--tc-tfe-swatch-size); height: var(--tc-tfe-swatch-size); padding: 0; border: 0; border-radius: var(--tc-radius-full); background: var(--tc-tfe-swatch); box-shadow: inset 0 0 0 var(--tc-hairline) var(--tc-border-subtle); cursor: pointer; }
.ui-tfe__swatch[aria-checked="true"] { box-shadow: 0 0 0 2px var(--tc-surface-raised), 0 0 0 4px var(--tc-text-primary); }
.ui-tfe__swatch:focus-visible { outline: var(--tc-focus-outline); outline-offset: 5px; }
.ui-tfe__custom { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); min-height: var(--tc-tfe-swatch-size); color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); cursor: pointer; }
.ui-tfe__custom-input { width: var(--tc-tfe-swatch-size); height: var(--tc-tfe-swatch-size); padding: 0; border: 0; background: none; cursor: pointer; }
.ui-tfe__custom-input:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-tfe__actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: var(--tc-space-1); }
.ui-tfe__used { margin-right: auto; color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); font-variant-numeric: tabular-nums; white-space: nowrap; }
.ui-tfe__row--read .ui-tfe__used { margin: 0; }
.ui-tfe__action, .ui-tfe__add { height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: var(--tc-text-secondary); font: inherit; font-size: var(--tc-font-size-xs); font-weight: var(--tc-control-font-weight); cursor: pointer; }
.ui-tfe__action:hover:not(:disabled) { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
.ui-tfe__action:disabled { color: var(--tc-text-muted); cursor: default; }
.ui-tfe__action:focus-visible, .ui-tfe__add:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-tfe__remove, .ui-tfe__confirm-remove { color: var(--tc-status-danger-fg); }
.ui-tfe__confirm { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-2); padding: var(--tc-space-2) var(--tc-space-3); border-radius: var(--tc-control-radius-md); background: var(--tc-fill-hover); }
.ui-tfe__confirm > span { flex: 1 1 12em; }
.ui-tfe__keep { margin-left: auto; }
.ui-tfe__foot { padding: var(--tc-space-3) var(--tc-space-4); }
.ui-tfe__add { height: var(--tc-control-h-md); padding: 0 var(--tc-control-px-md); border-radius: var(--tc-control-radius-md); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); font-size: var(--tc-control-font-size); }
.ui-tfe__add:hover { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-tfe__empty { padding: var(--tc-space-6) var(--tc-space-4); color: var(--tc-text-secondary); text-align: center; }
@container (max-width: 480px) {
  .ui-tfe__fields { grid-template-columns: minmax(0, 1fr); }
}
@media (forced-colors: active) {
  .ui-tfe__swatch { forced-color-adjust: none; }
  .ui-tfe__swatch[aria-checked="true"] { outline: 2px solid Highlight; outline-offset: 2px; }
}
${flagGlyphCss}
`;
}

if (!customElements.get("tc-team-flag-editor")) customElements.define("tc-team-flag-editor", TcTeamFlagEditor);

declare global {
  interface HTMLElementTagNameMap {
    "tc-team-flag-editor": TcTeamFlagEditor;
  }
}
