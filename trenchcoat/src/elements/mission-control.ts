import { html } from "lit";
import { property } from "lit/decorators.js";
import type { AgentTreeResolution, TreeAgent } from "./agent-tree";
import { dollars } from "./internal/format";
import { TcMissionBase, missionCss, type MissionFilter } from "./internal/mission";
import "./agent-tree";

/*
 * <tc-mission-control> – the home of an agent product: every agent at a glance. On top, "Since you looked" – a small
 * chart of the period stacked by done, failed and needs you, with the totals in words; in the middle, who runs under
 * whom, in the library's Agent Tree; on the side, what needs you, in the library's Decision Inbox. One filter at the
 * top – All, Running, Waiting, Failed – applies to all three: the tree keeps the agents with that status (and the
 * agents above them, so the way down stays), and the events and decisions keep the ones whose `agentId` it kept.
 * Narrow, it stacks with what needs you first. A page section, not a card: the tree and the inbox carry the look.
 *
 *   <tc-mission-control .root=${orchestrator} .events=${since} .decisions=${waiting} .since=${lastVisit}></tc-mission-control>
 *
 * The tree's and the inbox's own events (tc-select, tc-resolve, tc-collapsed-change, tc-answers-change, tc-decide)
 * bubble from here unchanged.
 */

export type { MissionDecision, MissionEvent, MissionFilter, MissionFilterChange, MissionLabels } from "./internal/mission";
export { defaultMissionLabels } from "./internal/mission";
/** An agent of the tree – the Agent Tree's TreeAgent, with element avatars and tool marks */
export type MissionAgent = TreeAgent;

/** The agents of `root` with the filter's status, and every agent above one of them */
export function filterAgentTree(root: TreeAgent, filter: MissionFilter): TreeAgent {
  if (filter === "all") return root;
  const walk = (a: TreeAgent): TreeAgent | null => {
    const children = (a.children ?? []).map(walk).filter((c): c is TreeAgent => c !== null);
    return a.status === filter || children.length ? { ...a, children } : null;
  };
  return walk(root) ?? { ...root, children: [] };
}

/**
 * The home of an agent product – what happened since you looked, who runs under whom, and what needs you, under one
 * status filter.
 * @tag tc-mission-control
 * @fires tc-filter-change - The status filter changed ({ filter }: MissionFilterChange); cancelable – prevented, `filter` stays as it was
 */
export class TcMissionControl extends TcMissionBase {
  static override ui = "mctl";
  static override css = missionCss("mctl");

  /** The orchestrator, with its sub-agents as `children` – the Agent Tree's `root` */
  @property({ attribute: false }) accessor root: TreeAgent = { id: "", name: "", task: "", status: "queued" };
  /** Agent cards are buttons that fire tc-select */
  @property({ type: Boolean }) accessor selectable = false;
  /** Answers from the tree's "needs you" and "failed" windows; it may return a promise – the Agent Tree's `resolver` */
  @property({ attribute: false }) accessor resolver: ((agent: TreeAgent, action: AgentTreeResolution) => void | Promise<unknown>) | undefined = undefined;
  /** Formats every cost – dollars by default, e.g. "$0.42" */
  @property({ attribute: false }) accessor formatCost: (amount: number) => string = dollars;

  constructor() {
    super();
    this.heading = "Mission control";
  }

  protected agentStatuses() {
    const map = new Map<string, string>();
    const walk = (a: TreeAgent) => {
      if (a.id) map.set(a.id, a.status);
      (a.children ?? []).forEach(walk);
    };
    if (this.root) walk(this.root);
    return map;
  }

  protected renderAgents(filter: MissionFilter) {
    const root = this.root ?? { id: "", name: "", task: "", status: "queued" };
    return html`<tc-agent-tree
      look=${this.resolvedLook}
      heading=${this.l.agents}
      .root=${filterAgentTree(root, filter)}
      .now=${this.now}
      ?selectable=${this.selectable}
      .resolver=${this.resolver}
      .formatCost=${this.formatCost}
    ></tc-agent-tree>`;
  }
}

if (!customElements.get("tc-mission-control")) customElements.define("tc-mission-control", TcMissionControl);

declare global {
  interface HTMLElementTagNameMap {
    "tc-mission-control": TcMissionControl;
  }
}
