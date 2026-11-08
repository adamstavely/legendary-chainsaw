import { html, nothing } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import "./change-list";
import "./environment-list";
import "./icon-rail";
import "./meter-row";
import "./panel-card";
import "./subagent-list";
import type { ChangeItem, ChangeRowAction } from "./change-list";
import type { EnvironmentItem, EnvironmentTogglesChange } from "./environment-list";
import type { IconRailItem, IconRailMoreItem } from "./icon-rail";
import type { PanelCardExpandedChange } from "./panel-card";
import type { Subagent, SubagentSelectedChange } from "./subagent-list";

/*
 * <tc-session-panel> – the side panel of a working session: a rail of tools, where the session runs, how full its context
 * is, its connectors, outputs, the subagents it started and its background tasks, and the changes it has made. The block
 * composes tc-icon-rail, tc-panel-card, tc-environment-list, tc-meter-row, tc-subagent-list and tc-change-list, whose own
 * events bubble from here – except the subagent list's choice, which the panel turns into tc-subagent-change so it isn't
 * mistaken for the rail's tc-selected-change. Environment, Subagents and Changes fold; the other sections are rows that
 * fire tc-section-open, so the page opens whatever it uses for the details, such as tc-context-map, tc-artifact-panel or
 * tc-background-tasks. A section with nothing to show is left out.
 *
 *   <tc-session-panel .tools=${tools} .environment=${where} .context=${0.17} connectors="14 to reconnect" outputs="51"
 *     background="4 running" .changes=${changes}></tc-session-panel>
 */

export type SessionPanelSection = "environment" | "context" | "connectors" | "outputs" | "subagents" | "changes" | "background";
/** Which sections are open, and the one that just changed */
export type SessionPanelSectionsChange = { sections: SessionPanelSection[]; section: SessionPanelSection; expanded: boolean };
/** A row that opens details elsewhere was pressed */
export type SessionPanelSectionOpen = { section: SessionPanelSection };
/** A subagent was chosen in the Subagents section: its id, and the agent */
export type SessionPanelSubagentChange = { subagent: string | null; agent: Subagent | null };
/** The words it uses; `subagentsActive` is the Subagents value while any run, {count} the number */
export type SessionPanelLabels = Record<SessionPanelSection | "tools" | "subagentsActive", string>;

export const defaultSessionPanelLabels: SessionPanelLabels = {
  tools: "Session tools",
  environment: "Environment",
  context: "Context",
  connectors: "Connectors",
  outputs: "Outputs",
  subagents: "Subagents",
  subagentsActive: "{count} active",
  changes: "Changes",
  background: "Background tasks",
};

/**
 * The side panel of a working session: tools, environment, context, connectors, outputs, subagents, changes and background tasks.
 * @tag tc-session-panel
 * @fires tc-sections-change - A section folded open or shut ({ sections, section, expanded }: SessionPanelSectionsChange); cancelable – prevented, `sections` stays as it was
 * @fires tc-section-open - A row that opens details elsewhere was pressed ({ section }: SessionPanelSectionOpen)
 * @fires tc-subagent-change - A subagent was chosen ({ subagent, agent }: SessionPanelSubagentChange); cancelable – prevented, `subagent` stays as it was
 */
export class TcSessionPanel extends TcElement {
  static override ui = "ssp";

  /** The tool buttons at the top; without any, the rail is left out */
  @property({ attribute: false }) accessor tools: IconRailItem[] = [];
  /** The id of the chosen tool. Changed by the user unless a tc-selected-change listener calls preventDefault() */
  @property() accessor tool: string | null = null;
  /** The rail's More menu */
  @property({ attribute: false }) accessor moreTools: IconRailMoreItem[] = [];
  /** Where the session runs */
  @property({ attribute: false }) accessor environment: EnvironmentItem[] = [];
  /** The environment rows' switches. Changed by the user unless a tc-toggles-change listener calls preventDefault() */
  @property({ attribute: false }) accessor toggles: Record<string, boolean> = {};
  /** How full the context is, from 0 to 1; without it, the row is left out */
  @property({ type: Number }) accessor context: number | undefined = undefined;
  /** The Connectors row's value, such as "14 to reconnect"; without it, the row is left out */
  @property() accessor connectors: string | undefined = undefined;
  /** The Outputs row's value, such as "51"; without it, the row is left out */
  @property() accessor outputs: string | undefined = undefined;
  /** The subagents the session started; without any, the section is left out */
  @property({ attribute: false }) accessor subagents: Subagent[] = [];
  /** The id of the chosen subagent. Changed by the user unless a tc-subagent-change listener calls preventDefault() */
  @property() accessor subagent: string | null = null;
  /** The time now for the subagents' clocks, epoch ms; by default the list's own clock, which ticks */
  @property({ type: Number }) accessor now: number | undefined = undefined;
  /** The changes the session has made */
  @property({ attribute: false }) accessor changes: ChangeItem[] = [];
  /** The menu on each change */
  @property({ attribute: false }) accessor changeActions: ChangeRowAction[] = [];
  /** How many changes show before Show more */
  @property({ type: Number, attribute: "change-limit" }) accessor changeLimit = 5;
  /** The Background tasks row's value, such as "4 running"; without it, the row is left out */
  @property() accessor background: string | undefined = undefined;
  /** The sections folded open. Changed by the user unless a tc-sections-change listener calls preventDefault() */
  @property({ attribute: false }) accessor sections: SessionPanelSection[] = ["environment", "subagents", "changes"];
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<SessionPanelLabels> = {};

  private label(key: keyof SessionPanelLabels) {
    return this.labels[key] ?? defaultSessionPanelLabels[key];
  }

  /** The Subagents value: how many run, else how many there were */
  private subagentsValue() {
    const active = this.subagents.filter((a) => a.status === "running" || a.status === "waiting").length;
    return active ? this.label("subagentsActive").replace("{count}", String(active)) : String(this.subagents.length);
  }

  private onSubagent(e: CustomEvent<SubagentSelectedChange>) {
    // The list's tc-selected-change stops here, so a page listening for the rail's doesn't hear it
    e.stopPropagation();
    const { selected, agent } = e.detail;
    if (!this.emit<SessionPanelSubagentChange>("tc-subagent-change", { subagent: selected, agent }, { cancelable: true })) {
      e.preventDefault();
      return;
    }
    this.subagent = selected;
  }

  private onFold(section: SessionPanelSection, e: CustomEvent<PanelCardExpandedChange>) {
    // Show more's event bubbles through here untouched. The card's own stops: the page hears tc-sections-change
    if (e.target !== e.currentTarget) return;
    e.stopPropagation();
    const { expanded } = e.detail;
    const sections = expanded ? [...this.sections.filter((s) => s !== section), section] : this.sections.filter((s) => s !== section);
    if (!this.emit("tc-sections-change", { sections, section, expanded }, { cancelable: true })) {
      e.preventDefault();
      return;
    }
    this.sections = sections;
  }

  private onLink(section: SessionPanelSection, e: Event) {
    e.stopPropagation();
    this.emit("tc-section-open", { section });
  }

  private onTool(e: CustomEvent<{ selected: string | null }>) {
    // The page hears tc-selected-change first, on the way up
    queueMicrotask(() => {
      if (!e.defaultPrevented) this.tool = e.detail.selected;
    });
  }

  private onToggles(e: CustomEvent<EnvironmentTogglesChange>) {
    queueMicrotask(() => {
      if (!e.defaultPrevented) this.toggles = e.detail.toggles;
    });
  }

  private link(section: SessionPanelSection, value: string) {
    return html`<tc-panel-card class="ui-ssp__row" data-section=${section} mode="link" heading=${this.label(section)} value=${value} @tc-open=${(e: Event) => this.onLink(section, e)}></tc-panel-card>`;
  }

  protected override render() {
    const open = (section: SessionPanelSection) => this.sections.includes(section);
    const { context } = this;
    return html`<div class="ui-ssp__stack">
      ${this.tools.length
        ? html`<tc-icon-rail class="ui-ssp__rail" bare label=${this.label("tools")} .items=${this.tools} .selected=${this.tool} .moreItems=${this.moreTools} @tc-selected-change=${this.onTool}></tc-icon-rail>`
        : nothing}
      ${this.environment.length
        ? html`<tc-panel-card class="ui-ssp__section" data-section="environment" heading=${this.label("environment")} ?expanded=${open("environment")} @tc-expanded-change=${(e: CustomEvent<PanelCardExpandedChange>) => this.onFold("environment", e)}>
            <tc-environment-list bare .items=${this.environment} .toggles=${this.toggles} @tc-toggles-change=${this.onToggles}></tc-environment-list>
          </tc-panel-card>`
        : nothing}
      ${context !== undefined
        ? html`<tc-panel-card class="ui-ssp__row" data-section="context" mode="link" heading=${this.label("context")} @tc-open=${(e: Event) => this.onLink("context", e)}>
            <tc-meter-row slot="aside" compact bare label=${this.label("context")} .value=${context}></tc-meter-row>
          </tc-panel-card>`
        : nothing}
      ${this.connectors !== undefined ? this.link("connectors", this.connectors) : nothing}
      ${this.outputs !== undefined ? this.link("outputs", this.outputs) : nothing}
      ${this.subagents.length
        ? html`<tc-panel-card class="ui-ssp__section" data-section="subagents" heading=${this.label("subagents")} value=${this.subagentsValue()} ?expanded=${open("subagents")} @tc-expanded-change=${(e: CustomEvent<PanelCardExpandedChange>) => this.onFold("subagents", e)}>
            <tc-subagent-list bare heading="" .agents=${this.subagents} .selected=${this.subagent} .now=${this.now} @tc-selected-change=${this.onSubagent}></tc-subagent-list>
          </tc-panel-card>`
        : nothing}
      ${this.changes.length
        ? html`<tc-panel-card class="ui-ssp__section" data-section="changes" heading=${this.label("changes")} ?expanded=${open("changes")} @tc-expanded-change=${(e: CustomEvent<PanelCardExpandedChange>) => this.onFold("changes", e)}>
            <tc-change-list bare heading="" .items=${this.changes} .rowActions=${this.changeActions} limit=${this.changeLimit}></tc-change-list>
          </tc-panel-card>`
        : nothing}
      ${this.background !== undefined ? this.link("background", this.background) : nothing}
    </div>`;
  }

  static override css = /* css */ `
:where([data-look="standard"], [data-look="standard"] *)[data-ui="ssp"],
:where([data-look="clean"], [data-look="clean"] *)[data-ui="ssp"] {
  display: block;
  box-sizing: border-box;
  width: 100%;
  font-family: var(--tc-font-sans);
  font-size: var(--tc-font-size-sm);
  line-height: var(--tc-line-height-normal);
  color: var(--tc-text-primary);
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
[data-ui="ssp"] *, [data-ui="ssp"] *::before, [data-ui="ssp"] *::after { box-sizing: border-box; }
.ui-ssp__stack { display: grid; gap: var(--tc-space-3); min-width: 0; }
.ui-ssp__rail, .ui-ssp__section, .ui-ssp__row { min-width: 0; }
`;
}

if (!customElements.get("tc-session-panel")) customElements.define("tc-session-panel", TcSessionPanel);

declare global {
  interface HTMLElementTagNameMap {
    "tc-session-panel": TcSessionPanel;
  }
}
