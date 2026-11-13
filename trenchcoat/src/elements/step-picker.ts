import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { live } from "lit/directives/live.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { PopoverController } from "./internal/popover";
import { workflowKindIcon, type WorkflowKind, type WorkflowKindInfo } from "./workflow-canvas";

/*
 * <tc-step-picker> – what to add next to a workflow: a search field over step kinds and tools, grouped (Triggers, AI,
 * Tools, Logic, People, Output), each with its icon and one line on what it does. With nothing typed it leads with
 * Suggested ("Usually comes after Classify") and Recent.
 *   · the field is a combobox over a listbox: ↑ / ↓ move, Home / End jump, Enter adds the step, Escape clears the
 *     search – and, as a popover, closes it and returns focus to what opened it
 *   · inline (the default) it sits in the page; `layout="popover"` floats it by `anchor` while `open`
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-step-picker layout="popover" .anchor=${button} .open=${true} @tc-pick=${(e) => add(e.detail.kind, e.detail.tool)}></tc-step-picker>
 */

export type StepPickerItem = {
  id: string;
  /** The kind of step it adds – sets the icon (trigger, llm, tool, condition, approval, output, or your own) */
  kind: WorkflowKind;
  label: string;
  /** One line on what it does */
  description?: string;
  /** The group's id it's listed under */
  group: string;
  /** The tool or integration it uses, e.g. "Ledger API" – shown as a tag and sent with the pick */
  tool?: string;
  /** More words that should find it */
  keywords?: string;
};
export type StepPickerGroup = { id: string; label: string };
export type StepSuggestion = { id: string; reason?: string };
export type StepPickerLayout = "inline" | "popover";

/** Details of the events */
export type StepPick = { id: string; kind: WorkflowKind; tool?: string; item: StepPickerItem };
export type StepPickerQueryChange = { query: string };
export type StepPickerOpenChange = { open: boolean };

export const defaultStepGroups: StepPickerGroup[] = [
  { id: "triggers", label: "Triggers" },
  { id: "ai", label: "AI" },
  { id: "tools", label: "Tools" },
  { id: "logic", label: "Logic" },
  { id: "people", label: "People" },
  { id: "output", label: "Output" },
];

/** A starting catalogue – replace it with your own steps and tools */
export const defaultStepItems: StepPickerItem[] = [
  { id: "webhook", kind: "trigger", group: "triggers", label: "Webhook", description: "Starts when another system sends a request", keywords: "http api event" },
  { id: "schedule", kind: "trigger", group: "triggers", label: "Schedule", description: "Starts at set times, like every weekday at 9", keywords: "cron time recurring" },
  { id: "email-received", kind: "trigger", group: "triggers", label: "Email received", description: "Starts when a message arrives in a mailbox", keywords: "inbox mail" },
  { id: "classify", kind: "llm", group: "ai", label: "Classify", description: "Sorts the input into categories you name", keywords: "label categorise route" },
  { id: "extract", kind: "llm", group: "ai", label: "Extract fields", description: "Pulls named fields out of a document", keywords: "parse invoice ocr" },
  { id: "summarise", kind: "llm", group: "ai", label: "Summarise", description: "Writes a short summary of the input", keywords: "summary tldr" },
  { id: "http", kind: "tool", group: "tools", label: "HTTP request", description: "Calls any API and returns its response", keywords: "api rest fetch" },
  { id: "search-records", kind: "tool", group: "tools", label: "Search records", description: "Finds matching rows in a connected system", tool: "Records", keywords: "lookup find query" },
  { id: "update-record", kind: "tool", group: "tools", label: "Update record", description: "Changes fields on a record", tool: "Records", keywords: "write edit" },
  { id: "condition", kind: "condition", group: "logic", label: "Condition", description: "Takes one path or another by a rule", keywords: "if branch else" },
  { id: "wait", kind: "condition", group: "logic", label: "Wait", description: "Pauses for a time or until something happens", keywords: "delay sleep timer" },
  { id: "approval", kind: "approval", group: "people", label: "Approval", description: "Waits for a person to approve or reject", keywords: "review sign off human" },
  { id: "ask", kind: "approval", group: "people", label: "Ask a question", description: "Asks a person for missing information", keywords: "human input form" },
  { id: "send-email", kind: "output", group: "output", label: "Send email", description: "Sends a message to people you choose", keywords: "mail notify" },
  { id: "post-message", kind: "output", group: "output", label: "Post a message", description: "Posts to a team channel", keywords: "notify chat" },
];

/** A plus in a square: Lucide (ISC, lucide.dev) */
const pickerIcon = svg`<rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M8 12h8"></path><path d="M12 8v8"></path>`;
const searchIcon = html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>`;

/** The typed text, bold where it matches */
const highlight = (text: string, query: string) => {
  const i = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (i < 0) return text;
  return html`${text.slice(0, i)}<mark>${text.slice(i, i + query.length)}</mark>${text.slice(i + query.length)}`;
};

let uidCount = 0;

type Row = { key: string; item: StepPickerItem; section: string; reason?: string };

/**
 * Search step kinds and tools to add next to a workflow – grouped, with suggested and recent steps first.
 * @tag tc-step-picker
 * @fires tc-pick - A step was chosen ({ id, kind, tool, item }: StepPick); cancelable – prevented, a popover stays open
 * @fires tc-query-change - The search text changed ({ query }: StepPickerQueryChange); cancelable – prevented, `query` stays as it was
 * @fires tc-open-change - The popover opened or closed ({ open }: StepPickerOpenChange); cancelable – prevented, `open` stays as it was
 */
export class TcStepPicker extends TcElement {
  static override ui = "stp";

  /** The heading */
  @property() accessor heading = "Add a step";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** Every step that can be added */
  @property({ attribute: false }) accessor items: StepPickerItem[] = defaultStepItems;
  /** The groups, in order; an item whose group isn't here is left out */
  @property({ attribute: false }) accessor groups: StepPickerGroup[] = defaultStepGroups;
  /** Steps to suggest when nothing is typed, each with why ("Usually comes after Classify") */
  @property({ attribute: false }) accessor suggestions: StepSuggestion[] = [];
  /** Ids of recently added steps, newest first – shown when nothing is typed */
  @property({ attribute: false }) accessor recent: string[] = [];
  /** The search text. Changed by the user unless a tc-query-change listener calls preventDefault() */
  @property() accessor query = "";
  /** Placeholder text in the search field */
  @property() accessor placeholder = "Search steps and tools…";
  /** "inline" (the default) or "popover" – floated by `anchor` while `open` */
  @property({ reflect: true }) accessor layout: StepPickerLayout = "inline";
  /** In popover layout: whether it's showing. Closed by the user (Escape, outside, a pick) unless prevented */
  @property({ type: Boolean, reflect: true }) accessor open = false;
  /** In popover layout: the element it floats by, and where focus returns when it closes */
  @property({ attribute: false }) accessor anchor: HTMLElement | null = null;
  /** Labels and icons for kinds the page adds, merged over the workflow defaults */
  @property({ attribute: false }) accessor kinds: Record<string, Partial<WorkflowKindInfo>> = {};

  @state() private accessor activeKey: string | null = null;
  @state() private accessor announce = "";

  private uid = `tc-stp-${++uidCount}`;

  private readonly pop = new PopoverController(this, {
    popover: () => this.querySelector<HTMLElement>(".ui-stp__pop"),
    anchor: () => this.anchor,
    side: "bottom",
    align: "start",
    gap: 6,
    kind: "dialog",
    returnFocus: () => this.anchor,
    initialFocus: () => this.input,
    onClose: () => {
      if (!this.open) return;
      if (this.emit<StepPickerOpenChange>("tc-open-change", { open: false }, { cancelable: true })) this.open = false;
      else void this.updateComplete.then(() => this.pop.show({ focus: true }));
    },
  });

  private get input() {
    return this.querySelector<HTMLInputElement>(".ui-stp__input");
  }

  /* ---------- The model ---------- */

  private fits(item: StepPickerItem, q: string) {
    if (!q) return true;
    const hay = `${item.label} ${item.description ?? ""} ${item.tool ?? ""} ${item.keywords ?? ""}`.toLowerCase();
    return q
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .every((w) => hay.includes(w));
  }
  /** The listed rows: Suggested and Recent first when nothing is typed, then each group's matches */
  private sections(): { id: string; label: string; rows: Row[] }[] {
    const q = this.query.trim();
    const byId = new Map(this.items.map((i) => [i.id, i]));
    const out: { id: string; label: string; rows: Row[] }[] = [];
    if (!q) {
      const sug = this.suggestions.filter((s) => byId.has(s.id)).map((s) => ({ key: `suggested:${s.id}`, item: byId.get(s.id)!, section: "suggested", reason: s.reason }));
      if (sug.length) out.push({ id: "suggested", label: "Suggested", rows: sug });
      const rec = this.recent.filter((id) => byId.has(id)).slice(0, 4).map((id) => ({ key: `recent:${id}`, item: byId.get(id)!, section: "recent" }));
      if (rec.length) out.push({ id: "recent", label: "Recent", rows: rec });
    }
    for (const g of this.groups) {
      const rows = this.items.filter((i) => i.group === g.id && this.fits(i, q)).map((item) => ({ key: `${g.id}:${item.id}`, item, section: g.id }));
      if (rows.length) out.push({ id: g.id, label: g.label, rows });
    }
    return out;
  }
  private rows() {
    return this.sections().flatMap((s) => s.rows);
  }
  private get current() {
    const rows = this.rows();
    return rows.find((r) => r.key === this.activeKey) ?? rows[0];
  }
  private optionId(key: string) {
    return `${this.uid}-o-${key.replace(/[^\w-]/g, "_")}`;
  }

  /* ---------- Changes ---------- */

  private setQuery(query: string) {
    if (query === this.query) return;
    if (!this.emit<StepPickerQueryChange>("tc-query-change", { query }, { cancelable: true })) {
      this.requestUpdate();
      return;
    }
    this.query = query;
    this.activeKey = null;
    const n = this.rows().length;
    this.announce = query ? (n ? `${n} ${n === 1 ? "step" : "steps"}` : "No steps match") : "";
  }
  private pick(row: Row | undefined) {
    if (!row) return;
    const { item } = row;
    if (!this.emit<StepPick>("tc-pick", { id: item.id, kind: item.kind, tool: item.tool, item }, { cancelable: true })) return;
    this.announce = `Added ${item.label}`;
    if (this.layout === "popover") this.setOpen(false);
  }
  private setOpen(open: boolean) {
    if (open === this.open || !this.emit<StepPickerOpenChange>("tc-open-change", { open }, { cancelable: true })) return;
    this.open = open;
  }
  /** Moves the active row and keeps it in view */
  private move(to: Row | undefined) {
    if (!to) return;
    this.activeKey = to.key;
    void this.updateComplete.then(() => document.getElementById(this.optionId(to.key))?.scrollIntoView?.({ block: "nearest" }));
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.isComposing) return;
    const rows = this.rows();
    const i = Math.max(0, rows.findIndex((r) => r.key === this.current?.key));
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!rows.length) return;
      this.move(rows[(i + (e.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length]);
    } else if ((e.key === "Home" || e.key === "End") && (e.ctrlKey || !this.query)) {
      e.preventDefault();
      this.move(e.key === "Home" ? rows[0] : rows.at(-1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      this.pick(this.current);
    } else if (e.key === "Escape") {
      if (this.query) {
        // Clear first; a second Escape closes the popover
        e.preventDefault();
        e.stopPropagation();
        this.setQuery("");
      }
    }
  };

  /* ---------- Lifecycle ---------- */

  protected override updated(changed: PropertyValues) {
    super.updated(changed);
    if (this.layout !== "popover") return;
    if ((changed.has("open") || changed.has("layout") || changed.has("anchor")) && this.open && this.anchor && !this.pop.open) this.pop.show({ focus: true });
    if (changed.has("open") && !this.open && this.pop.open) this.pop.close();
  }

  /* ---------- Rendering ---------- */

  private renderPanel() {
    const id = this.uid;
    const sections = this.sections();
    const current = this.current;
    const q = this.query.trim();
    return html`
      ${cardHead({ icon: pickerIcon, title: this.heading, subtitle: this.description, id: `${id}-title` })}
      <div class="ui-stp__card">
        <div class="ui-stp__search">
          ${searchIcon}
          <input
            class="ui-stp__input"
            type="text"
            role="combobox"
            autocomplete="off"
            spellcheck="false"
            aria-label=${this.placeholder.replace(/…$/, "")}
            aria-expanded=${sections.length ? "true" : "false"}
            aria-controls=${ifDefined(sections.length ? `${id}-list` : undefined)}
            aria-autocomplete="list"
            aria-activedescendant=${ifDefined(current ? this.optionId(current.key) : undefined)}
            placeholder=${this.placeholder}
            .value=${live(this.query)}
            @input=${(e: Event) => this.setQuery((e.target as HTMLInputElement).value)}
            @keydown=${this.onKey}
          />
        </div>
        ${sections.length
          ? html`<div class="ui-stp__list" id=${`${id}-list`} role="listbox" aria-labelledby=${`${id}-title`}>
              ${sections.map(
                (s) => html`<div class="ui-stp__group" role="group" aria-labelledby=${`${id}-g-${s.id}`}>
                  <div class="ui-stp__group-label" id=${`${id}-g-${s.id}`} role="presentation">${s.label}</div>
                  ${s.rows.map((r) => {
                    const on = r.key === current?.key;
                    return html`<div
                      class="ui-stp__option"
                      id=${this.optionId(r.key)}
                      role="option"
                      data-kind=${r.item.kind}
                      data-id=${r.item.id}
                      aria-selected=${on ? "true" : "false"}
                      @pointermove=${() => {
                        if (this.activeKey !== r.key) this.activeKey = r.key;
                      }}
                      @mousedown=${(e: Event) => e.preventDefault()}
                      @click=${() => this.pick(r)}
                    >
                      <span class="ui-stp__icon" aria-hidden="true">${workflowKindIcon(r.item.kind, this.kinds)}</span>
                      <span class="ui-stp__text">
                        <span class="ui-stp__label">${highlight(r.item.label, q)}</span>
                        ${r.reason || r.item.description ? html`<span class="ui-stp__desc">${r.reason ?? r.item.description}</span>` : nothing}
                      </span>
                      ${r.item.tool ? html`<span class="ui-stp__tool">${r.item.tool}</span>` : nothing}
                    </div>`;
                  })}
                </div>`,
              )}
            </div>`
          : html`<p class="ui-stp__empty">No steps match “${q}”.</p>`}
      </div>
    `;
  }

  protected override render() {
    const status = html`<span class="ui-stp__sr" role="status">${this.announce}</span>`;
    if (this.layout === "popover")
      return html`${status}${this.open && this.anchor ? html`<div class="tc-pop ui-stp__pop" aria-labelledby=${`${this.uid}-title`} @keydown=${this.onPopKey}>${this.renderPanel()}</div>` : nothing}`;
    return html`${status}${this.renderPanel()}`;
  }
  private onPopKey = (e: KeyboardEvent) => {
    // Escape from the field with text clears it (onKey); otherwise the popover controller closes it
    if (e.key === "Tab") this.setOpen(false);
  };

  static override css = /* css */ `
/* Standard: a gray tray holding a white card */
:where([data-look="standard"], [data-look="standard"] *)[data-ui="stp"]:not([layout="popover"]), :where([data-look="standard"], [data-look="standard"] *)[data-ui="stp"] .ui-stp__pop {
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
}
/* Clean: one quiet white card */
:where([data-look="clean"], [data-look="clean"] *)[data-ui="stp"]:not([layout="popover"]), :where([data-look="clean"], [data-look="clean"] *)[data-ui="stp"] .ui-stp__pop {
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
}
[data-ui="stp"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: var(--tc-stp-w);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  font-weight: var(--tc-font-weight-regular);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
  --tc-stp-w: 420px;
  --tc-stp-h: 360px;
}
[data-ui="stp"][layout="popover"] { display: contents; }
[data-ui="stp"] .ui-stp__pop { box-sizing: border-box; width: min(var(--tc-stp-w), calc(100vw - var(--tc-space-4))); box-shadow: var(--tc-shadow-overlay); font-family: var(--tc-font-sans); font-size: var(--tc-font-size-md); line-height: var(--tc-line-height-normal); color: var(--tc-text-secondary); text-align: left; }
[data-ui="stp"] *, [data-ui="stp"] *::before, [data-ui="stp"] *::after { box-sizing: border-box; }
[data-ui="stp"] p { margin: 0; }
[data-ui="stp"] svg { display: block; flex: none; }
.ui-stp__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *) .ui-stp__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-stp__search { display: flex; align-items: center; gap: var(--tc-space-2); padding: 0 var(--tc-space-3); border-bottom: var(--tc-hairline) solid var(--tc-divider); color: var(--tc-icon-muted); }
.ui-stp__search svg { width: 16px; height: 16px; }
.ui-stp__input { flex: 1; min-width: 0; height: var(--tc-control-h-lg); padding: 0; border: 0; outline: none; background: none; font: inherit; font-size: var(--tc-font-size-sm); color: var(--tc-text-primary); }
.ui-stp__input::placeholder { color: var(--tc-text-placeholder); }
.ui-stp__search:focus-within { box-shadow: inset 0 -2px 0 var(--tc-accent); }
.ui-stp__list { max-height: var(--tc-stp-h); overflow: auto; padding: var(--tc-space-1-5) !important; scrollbar-width: thin; }
.ui-stp__group + .ui-stp__group { margin-top: var(--tc-space-1); }
.ui-stp__group-label { padding: var(--tc-space-1-5) var(--tc-space-2) var(--tc-space-1); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); color: var(--tc-caption-color); }
.ui-stp__option { display: flex; align-items: center; gap: var(--tc-space-2-5); min-height: var(--tc-control-h-md); padding: var(--tc-space-1-5) var(--tc-space-2); border-radius: var(--tc-menu-item-radius); cursor: pointer; }
.ui-stp__option[aria-selected="true"] { background: var(--tc-menu-item-hover); }
.ui-stp__icon { display: grid; place-items: center; width: 28px; height: 28px; border-radius: var(--tc-radius-md); background: var(--tc-fill-default); color: var(--tc-stp-kind, var(--tc-icon-muted)); }
.ui-stp__icon svg { width: 16px; height: 16px; }
[data-ui="stp"] [data-kind="trigger"] { --tc-stp-kind: var(--tc-tone-amber-solid); }
[data-ui="stp"] [data-kind="llm"] { --tc-stp-kind: var(--tc-tone-violet-solid); }
[data-ui="stp"] [data-kind="tool"] { --tc-stp-kind: var(--tc-chart-1); }
[data-ui="stp"] [data-kind="condition"] { --tc-stp-kind: var(--tc-tone-teal-solid); }
[data-ui="stp"] [data-kind="approval"] { --tc-stp-kind: var(--tc-tone-pink-solid); }
[data-ui="stp"] [data-kind="output"] { --tc-stp-kind: var(--tc-status-success-solid); }
.ui-stp__text { display: grid; flex: 1; min-width: 0; }
.ui-stp__label { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-stp__label mark { background: none; color: inherit; font-weight: var(--tc-font-weight-strong); }
.ui-stp__desc { overflow: hidden; font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); text-overflow: ellipsis; white-space: nowrap; }
.ui-stp__tool { flex: none; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); line-height: var(--tc-pill-h); color: var(--tc-text-secondary); white-space: nowrap; }
.ui-stp__empty { padding: var(--tc-space-6) var(--tc-space-3) !important; font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); text-align: center; }
@container (max-width: 360px) {
  .ui-stp__tool { display: none; }
}
@media (forced-colors: active) {
  .ui-stp__option[aria-selected="true"] { outline: 2px solid Highlight; }
}
`;
}

if (!customElements.get("tc-step-picker")) customElements.define("tc-step-picker", TcStepPicker);

declare global {
  interface HTMLElementTagNameMap {
    "tc-step-picker": TcStepPicker;
  }
}
