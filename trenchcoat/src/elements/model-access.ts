import { html, nothing, svg, type PropertyValues } from "lit";
import { property, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { TcElement } from "./internal/base";
import { cardHead } from "./internal/card-head";
import { formatDate } from "./internal/util";

/*
 * <tc-model-access> – which models a workspace may use. Models are grouped by provider, each with what it can do
 * (vision, tools, long context), its price tier and where its data is kept, a switch that allows or blocks it and a
 * Require approval checkbox. Below: the default model, picked from the allowed ones, and the rule for models that
 * arrive later ("New models are blocked until an admin allows them"). A blocked model that agents still use says so in
 * words – "Policy Q&A uses large-1 – blocking it will stop that agent" – and who changed the policy last is in the footer.
 *   · every control is native: a switch button, a checkbox and a select, each named by the model
 *   · every change fires a cancelable tc-access-change with the whole access value
 * Standard: the header on a gray tray above a white card. Clean: one white card, the header its first row.
 *
 *   <tc-model-access .models=${models} .access=${access}></tc-model-access>
 */

/** What a model can do – the built-in ones have words, any other string is shown as it is */
export type ModelCapability = "vision" | "tools" | "long-context" | "audio" | "reasoning" | (string & {});
/** How much it costs, relative to the others */
export type ModelPriceTier = "low" | "medium" | "high";
export type ModelAccessModel = {
  id: string;
  /** Shown name, e.g. "large-1" */
  name: string;
  /** The group it's listed under, e.g. "Provider A" */
  provider: string;
  /** One quiet line, e.g. "Best for long reports" */
  description?: string;
  capabilities?: ModelCapability[];
  tier?: ModelPriceTier;
  /** Where its data is processed and kept, e.g. "EU" or "US, EU" */
  residency?: string;
  /** Agents that use it – a blocked model with agents gets a warning */
  usedBy?: string[];
  /** Arrived since the policy was last changed: marked New */
  isNew?: boolean;
};
/** One model's setting */
export type ModelAccessRule = {
  /** May be used */
  allowed: boolean;
  /** Each use waits for an admin's approval (only meaningful while allowed) */
  approval?: boolean;
};
/** The whole policy */
export type ModelAccessValue = {
  /** By model id; a model missing here is allowed unless `blockNew` and it's new */
  models: Record<string, ModelAccessRule>;
  /** The model agents and chats start with; must be an allowed one */
  defaultModel?: string;
  /** New models are blocked until an admin allows them */
  blockNew?: boolean;
};
/** Who changed the policy last */
export type ModelAccessEditor = { name: string; at?: number };
export type ModelAccessChangeCause =
  | { type: "allowed"; model: string; allowed: boolean }
  | { type: "approval"; model: string; approval: boolean }
  | { type: "default"; model: string }
  | { type: "block-new"; blockNew: boolean };
/** tc-access-change: the next policy and what changed */
export type ModelAccessChange = { access: ModelAccessValue; change: ModelAccessChangeCause };

export type ModelAccessLabels = {
  allowed: string;
  blocked: string;
  approval: string;
  defaultModel: string;
  noDefault: string;
  blockNew: string;
  blockNewHint: string;
  isNew: string;
  /** "{agents} uses {model} – blocking it will stop that agent"; {agents} is the agents' names, joined */
  usedBy: string;
  usedByMany: string;
  /** The default is blocked */
  defaultBlocked: string;
  changedBy: string;
  empty: string;
};
export const defaultModelAccessLabels: ModelAccessLabels = {
  allowed: "Allowed",
  blocked: "Blocked",
  approval: "Require approval",
  defaultModel: "Default model",
  noDefault: "Choose a model",
  blockNew: "New models are blocked until an admin allows them",
  blockNewHint: "Otherwise a model a provider adds is allowed straight away.",
  isNew: "New",
  usedBy: "{agents} uses {model} – blocking it will stop that agent",
  usedByMany: "{agents} use {model} – blocking it will stop those agents",
  defaultBlocked: "The default model is blocked – choose another",
  changedBy: "Last changed by {name}",
  empty: "No models to set up yet.",
};

const CAPABILITY: Record<string, string> = { vision: "Vision", tools: "Tools", "long-context": "Long context", audio: "Audio", reasoning: "Reasoning" };
const TIER: Record<ModelPriceTier, { mark: string; word: string }> = {
  low: { mark: "$", word: "Low cost" },
  medium: { mark: "$$", word: "Medium cost" },
  high: { mark: "$$$", word: "High cost" },
};

/** Whether a model may be used under a policy */
export function modelAllowed(model: ModelAccessModel, access: ModelAccessValue) {
  const rule = access.models[model.id];
  if (rule) return rule.allowed;
  return !(access.blockNew && model.isNew);
}

const joinNames = (names: string[]) => (names.length <= 2 ? names.join(" and ") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`);
const fill = (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? "");
let uidCount = 0;

/* After Lucide (ISC, lucide.dev): cpu – the header's icon; triangle-alert for a warning */
const headIcon = svg`<rect width="16" height="16" x="4" y="4" rx="2"></rect><rect width="6" height="6" x="9" y="9" rx="1"></rect><path d="M15 2v2"></path><path d="M15 20v2"></path><path d="M2 15h2"></path><path d="M2 9h2"></path><path d="M20 15h2"></path><path d="M20 9h2"></path><path d="M9 2v2"></path><path d="M9 20v2"></path>`;
const warnIcon = html`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>`;

/**
 * Which models a workspace may use – grouped by provider, each allowed or blocked with an optional approval step, a
 * default model and a rule for new models, and a warning when a blocked model is still used by agents.
 * @tag tc-model-access
 * @fires tc-access-change - A switch, a checkbox, the default or the new-model rule changed ({ access, change }: ModelAccessChange); cancelable – prevented, `access` stays as it was
 */
export class TcModelAccess extends TcElement {
  static override ui = "mac";

  /** The heading */
  @property() accessor heading = "Model access";
  /** One line under the heading */
  @property() accessor description: string | undefined = undefined;
  /** The models, listed under their provider in the order given */
  @property({ attribute: false }) accessor models: ModelAccessModel[] = [];
  /** The policy. Changed by the controls unless a tc-access-change listener calls preventDefault() */
  @property({ attribute: false }) accessor access: ModelAccessValue = { models: {} };
  /** Who changed the policy last, shown in the footer */
  @property({ attribute: false }) accessor changedBy: ModelAccessEditor | undefined = undefined;
  /** The words, merged over defaultModelAccessLabels */
  @property({ attribute: false }) accessor labels: Partial<ModelAccessLabels> = {};
  /** For the footer's date */
  @property() accessor locale: string | undefined = undefined;

  /** @internal The polite announcement */
  @state() accessor announce = "";

  private uid = `tc-mac-${++uidCount}`;

  private get words(): ModelAccessLabels {
    return { ...defaultModelAccessLabels, ...this.labels };
  }

  private get groups() {
    const out = new Map<string, ModelAccessModel[]>();
    for (const m of this.models) {
      const list = out.get(m.provider) ?? [];
      list.push(m);
      out.set(m.provider, list);
    }
    return [...out];
  }

  private rule(m: ModelAccessModel): ModelAccessRule {
    return { allowed: modelAllowed(m, this.access), approval: !!this.access.models[m.id]?.approval };
  }

  private commit(access: ModelAccessValue, change: ModelAccessChangeCause, say: string) {
    if (!this.emit<ModelAccessChange>("tc-access-change", { access, change }, { cancelable: true })) return;
    this.access = access;
    this.announce = say;
  }

  private setAllowed(m: ModelAccessModel, allowed: boolean) {
    const rule = { ...this.rule(m), allowed };
    const next: ModelAccessValue = { ...this.access, models: { ...this.access.models, [m.id]: rule } };
    const w = this.words;
    const used = !allowed && m.usedBy?.length ? `. ${this.usedWords(m)}` : "";
    this.commit(next, { type: "allowed", model: m.id, allowed }, `${m.name} ${(allowed ? w.allowed : w.blocked).toLowerCase()}${used}`);
  }

  private setApproval(m: ModelAccessModel, approval: boolean) {
    const next: ModelAccessValue = { ...this.access, models: { ...this.access.models, [m.id]: { ...this.rule(m), approval } } };
    this.commit(next, { type: "approval", model: m.id, approval }, `${m.name}: ${approval ? "approval required" : "no approval needed"}`);
  }

  private setDefault(id: string) {
    const m = this.models.find((x) => x.id === id);
    if (!m) return;
    this.commit({ ...this.access, defaultModel: id }, { type: "default", model: id }, `Default model: ${m.name}`);
  }

  private setBlockNew(blockNew: boolean) {
    this.commit({ ...this.access, blockNew }, { type: "block-new", blockNew }, blockNew ? "New models are blocked" : "New models are allowed");
  }

  private usedWords(m: ModelAccessModel) {
    const agents = m.usedBy ?? [];
    const w = this.words;
    return fill(agents.length > 1 ? w.usedByMany : w.usedBy, { agents: joinNames(agents), model: m.name });
  }

  protected override willUpdate(changed: PropertyValues) {
    super.willUpdate(changed);
    if (changed.has("access") && !this.access.models) this.access = { ...this.access, models: {} };
  }

  private renderModel(m: ModelAccessModel) {
    const w = this.words;
    const { allowed, approval } = this.rule(m);
    const id = `${this.uid}-${m.id}`;
    const warn = !allowed && !!m.usedBy?.length;
    const tier = m.tier ? TIER[m.tier] : undefined;
    return html`<li class="ui-mac__model" data-model=${m.id} ?data-blocked=${!allowed}>
      <div class="ui-mac__main">
        <span class="ui-mac__name-row">
          <span class="ui-mac__name" id=${`${id}-name`}>${m.name}</span>
          ${m.isNew ? html`<span class="ui-mac__new">${w.isNew}</span>` : nothing}
        </span>
        ${m.description ? html`<span class="ui-mac__desc">${m.description}</span>` : nothing}
        <span class="ui-mac__facts">
          ${(m.capabilities ?? []).map((c) => html`<span class="ui-mac__chip">${CAPABILITY[c] ?? c}</span>`)}
          ${tier ? html`<span class="ui-mac__tier" title=${tier.word}><span aria-hidden="true">${tier.mark}</span><span class="ui-mac__sr">${tier.word}</span></span>` : nothing}
          ${m.residency ? html`<span class="ui-mac__residency">Data in ${m.residency}</span>` : nothing}
        </span>
        ${warn ? html`<p class="ui-mac__warn" id=${`${id}-warn`}>${warnIcon}<span>${this.usedWords(m)}</span></p>` : nothing}
      </div>
      <div class="ui-mac__controls">
        <label class="ui-mac__approval" ?data-off=${!allowed}>
          <input type="checkbox" class="ui-mac__check" .checked=${!!approval && allowed} ?disabled=${!allowed} @change=${(e: Event) => this.setApproval(m, (e.target as HTMLInputElement).checked)} />
          <span>${w.approval}<span class="ui-mac__sr"> for ${m.name}</span></span>
        </label>
        <span class="ui-mac__toggle">
          <button
            type="button"
            role="switch"
            class="ui-mac__switch"
            aria-checked=${allowed ? "true" : "false"}
            aria-labelledby=${`${id}-name ${id}-what`}
            aria-describedby=${ifDefined(warn ? `${id}-warn` : undefined)}
            @click=${() => this.setAllowed(m, !allowed)}
          ><span></span></button>
          <span class="ui-mac__sr" id=${`${id}-what`}>${w.allowed.toLowerCase()}</span>
          <span class="ui-mac__state" aria-hidden="true">${allowed ? w.allowed : w.blocked}</span>
        </span>
      </div>
    </li>`;
  }

  private renderPolicy() {
    const w = this.words;
    const allowed = this.models.filter((m) => modelAllowed(m, this.access));
    const current = this.access.defaultModel;
    const defaultOk = !!current && allowed.some((m) => m.id === current);
    const blockNew = !!this.access.blockNew;
    const id = this.uid;
    return html`<div class="ui-mac__policy">
      <div class="ui-mac__field">
        <label class="ui-mac__label" for=${`${id}-default`}>${w.defaultModel}</label>
        <select
          id=${`${id}-default`}
          class="ui-mac__select"
          aria-invalid=${defaultOk ? "false" : "true"}
          aria-describedby=${ifDefined(defaultOk ? undefined : `${id}-default-warn`)}
          @change=${(e: Event) => this.setDefault((e.target as HTMLSelectElement).value)}
        >
          ${defaultOk ? nothing : html`<option value="" selected disabled>${w.noDefault}</option>`}
          ${allowed.map((m) => html`<option value=${m.id} ?selected=${m.id === current}>${m.name}</option>`)}
        </select>
        ${defaultOk ? nothing : html`<p class="ui-mac__warn" id=${`${id}-default-warn`}>${warnIcon}<span>${w.defaultBlocked}</span></p>`}
      </div>
      <div class="ui-mac__rule">
        <button type="button" role="switch" class="ui-mac__switch" aria-checked=${blockNew ? "true" : "false"} aria-labelledby=${`${id}-rule`} aria-describedby=${`${id}-rule-hint`} @click=${() => this.setBlockNew(!blockNew)}><span></span></button>
        <span class="ui-mac__rule-text">
          <span class="ui-mac__rule-label" id=${`${id}-rule`} @click=${() => this.setBlockNew(!blockNew)}>${w.blockNew}</span>
          <span class="ui-mac__rule-hint" id=${`${id}-rule-hint`}>${w.blockNewHint}</span>
        </span>
      </div>
    </div>`;
  }

  protected override render() {
    const w = this.words;
    const allowedCount = this.models.filter((m) => modelAllowed(m, this.access)).length;
    const clean = this.resolvedLook === "clean";
    const head = cardHead({
      icon: headIcon,
      title: this.heading,
      subtitle: this.description || undefined,
      id: `${this.uid}-title`,
      aside: this.models.length ? html`<span class="ui-mac__count">${allowedCount} of ${this.models.length} allowed</span>` : undefined,
    });
    const by = this.changedBy;
    return html`
      <span class="ui-mac__sr" role="status">${this.announce}</span>
      ${clean ? nothing : head}
      <div class="ui-mac__card">
        ${clean ? head : nothing}
        ${this.models.length
          ? html`${this.groups.map(
                ([provider, list], i) => html`<section class="ui-mac__group" aria-labelledby=${`${this.uid}-g${i}`}>
                  <h4 class="ui-mac__provider" id=${`${this.uid}-g${i}`}>${provider}</h4>
                  <ul class="ui-mac__models">${list.map((m) => this.renderModel(m))}</ul>
                </section>`,
              )}
              ${this.renderPolicy()}`
          : html`<p class="ui-mac__empty">${w.empty}</p>`}
        ${by
          ? html`<p class="ui-mac__footer">${fill(w.changedBy, { name: by.name })}${by.at != null ? html` · <time datetime=${new Date(by.at).toISOString()}>${formatDate(by.at, this.locale, { day: "numeric", month: "short", year: "numeric" })}</time>` : nothing}</p>`
          : nothing}
      </div>
    `;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="mac"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: var(--tc-tray-inset);
  border-radius: var(--tc-tray-radius);
  background: var(--tc-surface-tray);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-muted);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
:where([data-look="clean"], [data-look="clean"] *)[data-ui="mac"] {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
  border-radius: var(--tc-card-radius);
  background: var(--tc-surface-raised);
  box-shadow: var(--tc-card-shadow);
  container-type: inline-size;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-md);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-secondary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="mac"] *, [data-ui="mac"] *::before, [data-ui="mac"] *::after { box-sizing: border-box; }
:where([data-ui="mac"]) button { margin: 0; padding: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; }
[data-ui="mac"] button:focus-visible, [data-ui="mac"] input:focus-visible, [data-ui="mac"] select:focus-visible { outline: var(--tc-focus-outline); outline-offset: var(--tc-focus-ring-offset); }
[data-ui="mac"] ul { margin: 0; padding: 0; list-style: none; }
[data-ui="mac"] h4, [data-ui="mac"] p { margin: 0; }
[data-ui="mac"] svg { display: block; flex: none; }
.ui-mac__sr { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
:where([data-look="standard"], [data-look="standard"] *).ui-mac__card { overflow: hidden; border-radius: var(--tc-card-radius); background: var(--tc-surface-on-tray); box-shadow: var(--tc-card-shadow); }
.ui-mac__count { font-size: var(--tc-font-size-sm); color: var(--tc-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
/* A provider: its name over its models */
.ui-mac__group + .ui-mac__group { border-top: var(--tc-hairline) solid var(--tc-divider); }
:where([data-look="clean"], [data-look="clean"] *).ui-mac__group:first-of-type { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-mac__provider { padding: var(--tc-space-3) var(--tc-space-4) var(--tc-space-1); color: var(--tc-caption-color); font-size: var(--tc-caption-font-size); font-weight: var(--tc-caption-font-weight); line-height: var(--tc-caption-line-height); letter-spacing: var(--tc-caption-tracking); text-transform: var(--tc-caption-transform); }
.ui-mac__model { display: flex; align-items: flex-start; gap: var(--tc-space-3); padding: var(--tc-space-2-5) var(--tc-space-4); }
.ui-mac__model + .ui-mac__model { border-top: var(--tc-hairline) solid var(--tc-divider); }
.ui-mac__main { display: grid; flex: 1; gap: var(--tc-space-1); min-width: 0; }
.ui-mac__name-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1-5); }
.ui-mac__name { font-weight: var(--tc-font-weight-medium); line-height: var(--tc-line-height-snug); color: var(--tc-text-primary); }
.ui-mac__model[data-blocked] .ui-mac__name { color: var(--tc-text-muted); }
.ui-mac__new { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-accent-subtle); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); line-height: var(--tc-line-height-tight); color: var(--tc-accent-text); }
.ui-mac__desc { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-mac__facts { display: flex; flex-wrap: wrap; align-items: center; gap: var(--tc-space-1) var(--tc-space-1-5); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
.ui-mac__chip { display: inline-flex; align-items: center; height: var(--tc-pill-h); padding: 0 var(--tc-pill-px); border-radius: var(--tc-pill-radius); background: var(--tc-fill-default); font-size: var(--tc-pill-font-size); font-weight: var(--tc-pill-font-weight); color: var(--tc-text-secondary); }
.ui-mac__tier { font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); font-variant-numeric: tabular-nums; }
.ui-mac__warn { display: flex; align-items: flex-start; gap: var(--tc-space-1-5); margin-top: var(--tc-space-0-5) !important; font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-status-warning-fg); }
.ui-mac__warn > svg { margin-top: var(--tc-space-0-5); }
/* Require approval, then the switch with its word */
.ui-mac__controls { display: flex; flex: none; align-items: center; gap: var(--tc-space-4); min-height: var(--tc-control-h-sm); }
.ui-mac__approval { display: inline-flex; align-items: center; gap: var(--tc-space-1-5); font-size: var(--tc-font-size-sm); color: var(--tc-text-secondary); cursor: pointer; white-space: nowrap; }
.ui-mac__approval[data-off] { color: var(--tc-text-disabled); cursor: default; }
.ui-mac__check { width: 14px; height: 14px; margin: 0; accent-color: var(--tc-accent); cursor: inherit; }
.ui-mac__toggle { display: inline-flex; align-items: center; gap: var(--tc-space-2); }
.ui-mac__state { min-width: 4.5em; font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-secondary); }
.ui-mac__model[data-blocked] .ui-mac__state { color: var(--tc-status-danger-fg); }
.ui-mac__switch { position: relative; flex: none; width: var(--tc-switch-w); height: var(--tc-switch-h); border-radius: var(--tc-switch-radius); background: var(--tc-switch-off) !important; transition: background-color var(--tc-duration-base) var(--tc-ease-standard); }
.ui-mac__switch[aria-checked="true"] { background: var(--tc-switch-on) !important; }
.ui-mac__switch span { position: absolute; top: var(--tc-space-0-5); left: var(--tc-space-0-5); width: var(--tc-switch-knob); height: var(--tc-switch-knob); border-radius: calc(var(--tc-switch-radius) - var(--tc-space-0-5)); background: var(--tc-switch-knob-bg); box-shadow: var(--tc-shadow-control); transition: transform var(--tc-duration-moderate) var(--tc-ease-move); }
.ui-mac__switch[aria-checked="true"] span { transform: translateX(calc(var(--tc-switch-w) - var(--tc-switch-h))); }
/* The default model and the rule for new models */
.ui-mac__policy { display: grid; gap: var(--tc-space-3); padding: var(--tc-space-3-5) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); background: var(--tc-fill-subtle); }
.ui-mac__field { display: grid; gap: var(--tc-space-1); justify-items: start; }
.ui-mac__label { font-size: var(--tc-font-size-sm); font-weight: var(--tc-font-weight-medium); color: var(--tc-text-primary); }
.ui-mac__select { min-width: 12em; height: var(--tc-field-h-sm); padding: 0 var(--tc-field-px); border: 0; border-radius: var(--tc-field-radius); background: var(--tc-field-bg); box-shadow: var(--tc-field-shadow); font: inherit; font-size: var(--tc-field-font-size); color: var(--tc-text-primary); }
.ui-mac__select[aria-invalid="true"] { box-shadow: var(--tc-field-shadow-invalid); }
.ui-mac__rule { display: flex; align-items: flex-start; gap: var(--tc-space-2-5); }
.ui-mac__rule > .ui-mac__switch { margin-top: var(--tc-space-0-5); }
.ui-mac__rule-text { display: grid; gap: var(--tc-space-0-5); }
.ui-mac__rule-label { color: var(--tc-text-primary); line-height: var(--tc-line-height-snug); cursor: pointer; }
.ui-mac__rule-hint { font-size: var(--tc-font-size-sm); line-height: var(--tc-line-height-snug); color: var(--tc-text-muted); }
.ui-mac__empty { padding: var(--tc-space-6) var(--tc-space-4); text-align: center; color: var(--tc-text-muted); }
.ui-mac__footer { padding: var(--tc-space-2-5) var(--tc-space-4); border-top: var(--tc-hairline) solid var(--tc-divider); font-size: var(--tc-font-size-xs); line-height: var(--tc-line-height-tight); color: var(--tc-text-muted); }
/* Narrow: the controls go under the model */
@container (max-width: 520px) {
  .ui-mac__model { flex-wrap: wrap; }
  .ui-mac__controls { width: 100%; justify-content: space-between; }
}
@media (pointer: coarse) { .ui-mac__check { width: 20px; height: 20px; } }
@media (prefers-reduced-motion: reduce) {
  [data-ui="mac"] *, [data-ui="mac"] *::before, [data-ui="mac"] *::after { animation: none !important; transition: none !important; }
}
@media (forced-colors: active) { .ui-mac__switch { border: 1px solid CanvasText; } .ui-mac__switch[aria-checked="true"] span { background: Highlight; } }
`;
}

if (!customElements.get("tc-model-access")) customElements.define("tc-model-access", TcModelAccess);

declare global {
  interface HTMLElementTagNameMap {
    "tc-model-access": TcModelAccess;
  }
}
