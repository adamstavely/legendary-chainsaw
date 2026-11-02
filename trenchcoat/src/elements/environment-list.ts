import { html, nothing, svg, type TemplateResult } from "lit";
import { property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import "./switch";

/*
 * <tc-environment-list> – where a session runs, as rows: the machine, its folders, the repository and branch, and any
 * settings that go with them. A row can have a small action, such as Save, or a switch. Most rows are only information,
 * so only the actions and switches take focus.
 *   · long paths end in an ellipsis, and the whole text is in the row's title
 *   · `bare` drops the tray and card, for a place that already has one
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-environment-list .items=${[{ id: "repo", kind: "repo", label: "institute/sample-tracker" }]}></tc-environment-list>
 */

export type EnvironmentKind = "computer" | "folder" | "repo" | "branch" | "custom";
export type EnvironmentItem = {
  id: string;
  kind: EnvironmentKind;
  /** SVG path data for a 24×24 icon, for a custom row */
  icon?: string;
  label: string;
  /** Quieter text after the label, cut off at its end when there isn't room */
  detail?: string;
  /** A small button at the row's end */
  action?: { id: string; label: string };
  /** Draws a switch at the row's end, named by the label */
  toggle?: boolean;
};

/** Details of the events */
export type EnvironmentAction = { id: string; itemId: string; item: EnvironmentItem };
export type EnvironmentTogglesChange = { toggles: Record<string, boolean>; id: string; value: boolean };

/* The kinds' icons and the header's: Lucide (ISC, lucide.dev) */
const ICON: Record<Exclude<EnvironmentKind, "custom">, TemplateResult> = {
  computer: svg`<rect width="18" height="12" x="3" y="4" rx="2"></rect><path d="M2 20h20"></path>`,
  folder: svg`<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"></path>`,
  repo: svg`<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"></path>`,
  branch: svg`<path d="M6 3v12"></path><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path>`,
};
const CUSTOM = svg`<circle cx="12" cy="12" r="9"></circle>`;

/**
 * Where a session runs, as rows of machine, folders, repository and branch, each with an optional small action or a switch.
 * @tag tc-environment-list
 * @fires tc-action - A row's action was pressed ({ id, itemId, item }: EnvironmentAction)
 * @fires tc-toggles-change - A row's switch was changed ({ toggles, id, value }: EnvironmentTogglesChange); cancelable – prevented, the switch stays as it was
 */
export class TcEnvironmentList extends TcElement {
  static override ui = "enl";

  /** The heading; empty draws no header */
  @property() accessor heading = "";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The rows, in order */
  @property({ attribute: false }) accessor items: EnvironmentItem[] = [];
  /** The switches' values by row id. Changed by the user unless a tc-toggles-change listener calls preventDefault() */
  @property({ attribute: false }) accessor toggles: Record<string, boolean> = {};
  /** Drops the tray and card */
  @property({ type: Boolean, reflect: true }) accessor bare = false;

  private onToggle(item: EnvironmentItem, e: CustomEvent<{ value: boolean }>) {
    // The list's own event replaces the switch's
    e.stopPropagation();
    const value = e.detail.value;
    const toggles = { ...this.toggles, [item.id]: value };
    if (!this.emit<EnvironmentTogglesChange>("tc-toggles-change", { toggles, id: item.id, value }, { cancelable: true })) {
      e.preventDefault();
      return;
    }
    this.toggles = toggles;
  }

  private icon(item: EnvironmentItem) {
    if (item.kind !== "custom") return ICON[item.kind];
    return item.icon ? svg`<path d=${item.icon}></path>` : CUSTOM;
  }

  private renderRow(item: EnvironmentItem) {
    return html`<li class="ui-enl__row" data-id=${item.id} data-kind=${item.kind}>
      <svg class="ui-enl__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${this.icon(item)}</svg>
      <span class="ui-enl__text" title=${item.detail ? `${item.label} · ${item.detail}` : item.label}>
        <span class="ui-enl__label">${item.label}</span>
        ${item.detail ? html`<span class="ui-enl__detail">${item.detail}</span>` : nothing}
      </span>
      ${item.action
        ? html`<button
            type="button"
            class="ui-enl__action"
            aria-label=${`${item.action.label} ${item.label}`}
            @click=${() => this.emit<EnvironmentAction>("tc-action", { id: item.action!.id, itemId: item.id, item })}
          >${item.action.label}</button>`
        : nothing}
      ${item.toggle
        ? html`<tc-switch class="ui-enl__switch" .label=${item.label} .value=${!!this.toggles[item.id]} @tc-value-change=${(e: CustomEvent<{ value: boolean }>) => this.onToggle(item, e)}></tc-switch>`
        : nothing}
    </li>`;
  }

  protected override render() {
    return html`${this.heading ? cardHead({ icon: ICON.computer, title: this.heading, subtitle: this.description }) : nothing}
      <div class="ui-enl__card">
        ${this.items.length
          ? html`<ul class="ui-enl__list" aria-label=${this.heading || "Environment"}>${repeat(this.items, (i) => i.id, (i) => this.renderRow(i))}</ul>`
          : html`<p class="ui-enl__empty">Nothing to show</p>`}
      </div>`;
  }

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="enl"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="enl"] {
  position: relative;
  display: block;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="enl"][bare] { padding: 0; overflow: visible; border-radius: 0; background: none; box-shadow: none; }
[data-ui="enl"] *, [data-ui="enl"] *::before, [data-ui="enl"] *::after { box-sizing: border-box; }
:where([data-ui="enl"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
[data-ui="enl"] button:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="enl"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="enl"] svg { display: block; flex: none; }
:where([data-look="standard"], [data-look="standard"] *).ui-enl__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
[data-ui="enl"][bare] .ui-enl__card { border-radius: 0; background: none; box-shadow: none; }
.ui-enl__list { display: grid; gap: var(--tc-space-1); padding: var(--tc-space-2) var(--tc-space-3); }
.ui-enl__row { display: flex; align-items: center; gap: var(--tc-space-3); min-width: 0; min-height: var(--tc-control-h-sm); }
.ui-enl__icon { color: var(--tc-icon-muted); }
.ui-enl__text { flex: 1 1 0; display: flex; align-items: baseline; gap: var(--tc-space-2); min-width: 0; line-height: var(--tc-line-height-snug); white-space: nowrap; }
.ui-enl__label { flex: 0 1 auto; min-width: 0; overflow: hidden; color: var(--tc-text-primary); text-overflow: ellipsis; }
.ui-enl__detail { flex: 1 1 0; min-width: 0; overflow: hidden; color: var(--tc-text-muted); font-size: var(--tc-font-size-sm); text-overflow: ellipsis; }
.ui-enl__action { flex: none; min-height: var(--tc-control-h-sm); padding: 0 var(--tc-space-2); border-radius: var(--tc-radius-md); color: var(--tc-accent-text); font-size: var(--tc-font-size-sm); }
.ui-enl__action:hover { background: var(--tc-fill-hover); }
.ui-enl__switch { flex: none; width: auto; }
/* The row's label names the switch, so its own stays for screen readers only */
.ui-enl__switch .tc-settings-row > span { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.ui-enl__empty { margin: 0; padding: var(--tc-space-4); color: var(--tc-text-muted); text-align: center; }
@media (forced-colors: active) { .ui-enl__icon { color: CanvasText; } }
`;
}

if (!customElements.get("tc-environment-list")) customElements.define("tc-environment-list", TcEnvironmentList);
declare global {
  interface HTMLElementTagNameMap {
    "tc-environment-list": TcEnvironmentList;
  }
}
