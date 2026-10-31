import { html, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { PopoverController } from "./internal/popover";
import { flagGlyph, flagGlyphCss, type TeamFlag } from "./internal/team-flag";

/*
 * <tc-team-flag-picker> – picks one of a team's flags for a file. A small button shows the flag's colour and name; it
 * opens a list of the team's flags, each with what it means, and No flag. The flags come from <tc-team-flag-editor>.
 * A file whose flag has since been removed says so, and keeps its value until someone picks again.
 * ↑ ↓ Home End move through the list, Enter or Space picks, Escape closes.
 * It's an inline control, the same in both looks except for the shared button and menu tokens.
 *
 *   <tc-team-flag-picker file-name="Q3 audit.pdf" .flags=${flags} value="review"></tc-team-flag-picker>
 */

export type { TeamFlag };
export type TeamFlagValueChange = { value: string | null; flag: TeamFlag | null };

/** The picker's words, every one renameable through `labels` */
export type TeamFlagPickerLabels = {
  /** On the button when no flag is set */
  add: string;
  /** The list's first option */
  none: string;
  /** On the button when the file's flag is no longer one of the team's */
  removed: string;
  /** Names the list; {file} is the file's name, when given */
  list: string;
  listNoFile: string;
  /** Instead of the list when the team has no flags */
  empty: string;
  /** The link to the team's flags, with `manageable` */
  manage: string;
  /** Announced after a pick */
  set: string;
  cleared: string;
};
export const defaultTeamFlagPickerLabels: TeamFlagPickerLabels = {
  add: "Add flag",
  none: "No flag",
  removed: "Removed flag",
  list: "Flag for {file}",
  listNoFile: "Flag",
  empty: "Your team hasn't set up any flags yet.",
  manage: "Manage team flags",
  set: "Flagged {flag}",
  cleared: "Flag removed",
};

let instances = 0;

/**
 * Picks one of a team's flags for a file.
 * @tag tc-team-flag-picker
 * @fires tc-value-change - A flag was picked or cleared ({ value, flag }: TeamFlagValueChange); cancelable – prevented, `value` stays as it was
 * @fires tc-manage - Manage team flags was pressed (detail: null)
 */
export class TcTeamFlagPicker extends TcElement {
  static override ui = "tfp";

  /** The team's flags, in the order they're offered */
  @property({ attribute: false }) accessor flags: TeamFlag[] = [];
  /** The id of the file's flag, or null for none. Changed by the user unless a tc-value-change listener calls preventDefault() */
  @property() accessor value: string | null = null;
  /** The file's name, so the control says which file it's for */
  @property({ attribute: "file-name" }) accessor fileName = "";
  /** Show a link to the team's flags at the foot of the list, for people who may edit them */
  @property({ type: Boolean }) accessor manageable = false;
  /** Show the flag without letting it change */
  @property({ type: Boolean, reflect: true }) accessor disabled = false;
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<TeamFlagPickerLabels> = {};

  @state() private accessor active = -1;
  @state() private accessor announce = "";
  private readonly uid = `tc-tfp-${++instances}`;

  private get trigger() {
    return this.querySelector<HTMLElement>(".ui-tfp__trigger");
  }
  private readonly pop = new PopoverController(this, {
    popover: () => this.querySelector<HTMLElement>(".ui-tfp__pop"),
    anchor: () => this.trigger,
    side: "bottom",
    align: "start",
    kind: "dialog",
    returnFocus: () => this.trigger,
    initialFocus: () => this.optionAt(this.active),
    tabBridge: true,
    closeOnFocusOut: true,
    onClose: () => this.requestUpdate(),
  });

  private get words(): TeamFlagPickerLabels {
    return { ...defaultTeamFlagPickerLabels, ...this.labels };
  }
  private get current() {
    return this.flags.find((f) => f.id === this.value) ?? null;
  }
  private optionAt(i: number) {
    return this.querySelectorAll<HTMLElement>(".ui-tfp__option")[i] ?? null;
  }

  private toggle() {
    if (this.pop.open) {
      this.pop.close();
      return;
    }
    // "No flag" is first, so a flag's option is one past its index
    this.active = Math.max(0, this.flags.findIndex((f) => f.id === this.value) + 1);
    this.pop.show({ focus: true });
    this.requestUpdate();
  }

  private pick(flag: TeamFlag | null) {
    const value = flag?.id ?? null;
    if (value !== this.value) {
      if (!this.emit<TeamFlagValueChange>("tc-value-change", { value, flag }, { cancelable: true })) {
        this.pop.close();
        return;
      }
      this.value = value;
      this.announce = flag ? this.words.set.replace("{flag}", flag.label) : this.words.cleared;
    }
    this.pop.close();
  }

  private onListKey(e: KeyboardEvent) {
    const last = this.flags.length;
    let next = this.active;
    if (e.key === "ArrowDown") next = Math.min(last, this.active + 1);
    else if (e.key === "ArrowUp") next = Math.max(0, this.active - 1);
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.pick(this.active === 0 ? null : (this.flags[this.active - 1] ?? null));
      return;
    } else return;
    e.preventDefault();
    this.active = next;
    this.updateComplete.then(() => this.optionAt(next)?.focus());
  }

  private renderOption(flag: TeamFlag | null, i: number) {
    const w = this.words;
    const selected = (flag?.id ?? null) === this.value;
    return html`<div class="ui-tfp__option" role="option" aria-selected=${selected ? "true" : "false"} tabindex=${i === this.active ? 0 : -1} @click=${() => this.pick(flag)}>
      ${flagGlyph(flag?.color)}
      <span class="ui-tfp__text"><span class="ui-tfp__name">${flag?.label ?? w.none}</span>${flag?.meaning ? html`<span class="ui-tfp__meaning">${flag.meaning}</span>` : nothing}</span>
      ${selected ? html`<svg class="ui-tfp__check" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>` : nothing}
    </div>`;
  }

  private renderPopover() {
    const w = this.words;
    const name = this.fileName ? w.list.replace("{file}", this.fileName) : w.listNoFile;
    return html`<div class="tc-pop ui-tfp__pop" id=${`${this.uid}-pop`} aria-label=${name}>
      ${this.flags.length
        ? html`<div class="ui-tfp__list" role="listbox" aria-label=${name} @keydown=${this.onListKey}>${[null, ...this.flags].map((f, i) => this.renderOption(f, i))}</div>`
        : html`<p class="ui-tfp__empty">${w.empty}</p>`}
      ${this.manageable
        ? html`<button
            type="button"
            class="ui-tfp__manage"
            @click=${() => {
              this.emit("tc-manage", null);
              this.pop.close();
            }}
          >
            ${w.manage}
          </button>`
        : nothing}
    </div>`;
  }

  protected override render() {
    const w = this.words;
    const flag = this.current;
    const gone = this.value !== null && !flag;
    const text = flag?.label ?? (gone ? w.removed : w.add);
    return html`<button
        type="button"
        class="ui-tfp__trigger"
        data-empty=${flag ? "false" : "true"}
        aria-haspopup="dialog"
        aria-expanded=${this.pop.open ? "true" : "false"}
        aria-controls=${ifDefined(this.pop.open ? `${this.uid}-pop` : undefined)}
        title=${ifDefined(flag?.meaning || undefined)}
        ?disabled=${this.disabled}
        @click=${this.toggle}
      >
        ${flagGlyph(flag?.color)}<span class="ui-tfp__label">${text}</span>${this.fileName ? html`<span class="tc-sr-only">, ${this.fileName}</span>` : nothing}
      </button>
      ${this.pop.open ? this.renderPopover() : nothing}
      <span class="tc-sr-only" role="status">${this.announce}</span>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="tfp"],
:where([data-look="clean"], [data-look="clean"] *)[data-ui="tfp"] {
  display: inline-block;
  max-width: 100%;
  min-width: 0;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-control-font-size);
  line-height: var(--tc-line-height-tight);
  color: var(--tc-text-primary);
  text-align: left;
  vertical-align: middle;
  -webkit-font-smoothing: antialiased;
}
/* The list's width – override it on the element */
[data-ui="tfp"] { --tc-tfp-list-width: 300px; }
[data-ui="tfp"] *, [data-ui="tfp"] *::before, [data-ui="tfp"] *::after { box-sizing: border-box; }
.ui-tfp__trigger { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); max-width: 100%; height: var(--tc-control-h-sm); padding: 0 var(--tc-control-px-sm); border: 0; border-radius: var(--tc-control-radius-sm); background: var(--tc-action-secondary-bg); box-shadow: var(--tc-action-secondary-shadow); color: var(--tc-action-secondary-fg); font: inherit; font-weight: var(--tc-control-font-weight); cursor: pointer; }
.ui-tfp__trigger:hover:not(:disabled) { box-shadow: var(--tc-action-secondary-shadow-hover); }
.ui-tfp__trigger:focus-visible, .ui-tfp__option:focus-visible, .ui-tfp__manage:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
.ui-tfp__trigger:disabled { background: var(--tc-fill-hover); box-shadow: none; color: var(--tc-text-secondary); cursor: default; }
.ui-tfp__trigger[data-empty="true"] { color: var(--tc-text-secondary); }
.ui-tfp__label { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.ui-tfp__pop { width: var(--tc-tfp-list-width); max-width: calc(100vw - var(--tc-space-4)); font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-tight); }
.ui-tfp__list { display: grid; gap: var(--tc-space-0-5); max-height: 320px; overflow-y: auto; }
.ui-tfp__option { display: flex; align-items: flex-start; gap: var(--tc-space-2); min-height: var(--tc-control-h-sm); padding: var(--tc-space-1-5) var(--tc-space-2); border-radius: var(--tc-control-radius-sm); color: var(--tc-text-primary); cursor: pointer; }
.ui-tfp__option:hover { background: var(--tc-fill-hover); }
.ui-tfp__option[aria-selected="true"] { background: var(--tc-fill-selected); }
.ui-tfp__text { display: grid; gap: var(--tc-space-0-5); flex: 1; min-width: 0; }
.ui-tfp__name { font-weight: var(--tc-font-weight-medium); overflow-wrap: anywhere; }
.ui-tfp__meaning { color: var(--tc-text-secondary); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-normal); overflow-wrap: anywhere; }
.ui-tfp__check { flex: none; width: var(--tc-icon-size-md, 16px); height: var(--tc-icon-size-md, 16px); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.ui-tfp__empty { margin: 0; padding: var(--tc-space-2); color: var(--tc-text-secondary); }
.ui-tfp__manage { display: block; width: 100%; min-height: var(--tc-control-h-sm); margin-top: var(--tc-space-1); padding: 0 var(--tc-space-2); border: 0; border-radius: var(--tc-control-radius-sm); background: none; color: var(--tc-text-secondary); font: inherit; text-align: left; cursor: pointer; }
.ui-tfp__manage:hover { background: var(--tc-fill-hover); color: var(--tc-text-primary); }
@media (forced-colors: active) {
  .ui-tfp__option[aria-selected="true"] { background: Highlight; color: HighlightText; forced-color-adjust: none; }
}
${flagGlyphCss}
`;
}

if (!customElements.get("tc-team-flag-picker")) customElements.define("tc-team-flag-picker", TcTeamFlagPicker);

declare global {
  interface HTMLElementTagNameMap {
    "tc-team-flag-picker": TcTeamFlagPicker;
  }
}
