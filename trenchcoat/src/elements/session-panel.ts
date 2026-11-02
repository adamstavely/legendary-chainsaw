import { html, nothing } from "lit";
import { property } from "lit/decorators.js";
import { TcElement } from "./internal/base";
import "./change-list";
import "./environment-list";
import "./icon-rail";
import "./meter-row";
import "./panel-card";
import type { ChangeItem, ChangeRowAction } from "./change-list";
import type { EnvironmentItem, EnvironmentTogglesChange } from "./environment-list";
import type { IconRailItem, IconRailMoreItem } from "./icon-rail";
import type { PanelCardExpandedChange } from "./panel-card";

/*
 * <tc-session-panel> – the side panel of a working session: a rail of tools, where the session runs, how full its context
 * is, its connectors, outputs and background tasks, and the changes it has made. The block composes tc-icon-rail,
 * tc-panel-card, tc-environment-list, tc-meter-row and tc-change-list, whose own events bubble from here. Environment and
 * Changes fold; the other sections are rows that fire tc-section-open, so the page opens whatever it uses for the details,
 * such as tc-context-map, tc-artifact-panel or tc-background-tasks. A section with nothing to show is left out.
 *
 *   <tc-session-panel .tools=${tools} .environment=${where} .context=${0.17} connectors="14 to reconnect" outputs="51"
 *     background="4 running" .changes=${changes}></tc-session-panel>
 */

export type SessionPanelSection = "environment" | "context" | "connectors" | "outputs" | "changes" | "background";
/** Which sections are open, and the one that just changed */
export type SessionPanelSectionsChange = { sections: SessionPanelSection[]; section: SessionPanelSection; expanded: boolean };
/** A row that opens details elsewhere was pressed */
export type SessionPanelSectionOpen = { section: SessionPanelSection };
export type SessionPanelLabels = Record<SessionPanelSection | "tools", string>;

export const defaultSessionPanelLabels: SessionPanelLabels = {
  tools: "Session tools",
  environment: "Environment",
  context: "Context",
  connectors: "Connectors",
  outputs: "Outputs",
  changes: "Changes",
  background: "Background tasks",
};

/**
 * The side panel of a working session: tools, environment, context, connectors, outputs, changes and background tasks.
 * @tag tc-session-panel
 * @fires tc-sections-change - A section folded open or shut ({ sections, section, expanded }: SessionPanelSectionsChange); cancelable – prevented, `sections` stays as it was
 * @fires tc-section-open - A row that opens details elsewhere was pressed ({ section }: SessionPanelSectionOpen)
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
  /** The changes the session has made */
  @property({ attribute: false }) accessor changes: ChangeItem[] = [];
  /** The menu on each change */
  @property({ attribute: false }) accessor changeActions: ChangeRowAction[] = [];
  /** How many changes show before Show more */
  @property({ type: Number, attribute: "change-limit" }) accessor changeLimit = 5;
  /** The Background tasks row's value, such as "4 running"; without it, the row is left out */
  @property() accessor background: string | undefined = undefined;
  /** The sections folded open. Changed by the user unless a tc-sections-change listener calls preventDefault() */
  @property({ attribute: false }) accessor sections: SessionPanelSection[] = ["environment", "changes"];
  /** Rename any of the words */
  @property({ attribute: false }) accessor labels: Partial<SessionPanelLabels> = {};

  private label(key: keyof SessionPanelLabels) {
    return this.labels[key] ?? defaultSessionPanelLabels[key];
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
