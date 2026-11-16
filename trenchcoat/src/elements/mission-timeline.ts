import { html } from "lit";
import { property } from "lit/decorators.js";
import type { LaneAgent, LaneTask, LaneTaskHandler } from "./agent-lanes";
import { TcMissionBase, missionCss, type MissionFilter } from "./internal/mission";
import "./agent-lanes";

/*
 * <tc-mission-timeline> – the home of an agent product on one clock. The same frame as Mission Control – "Since you
 * looked" on top, what needs you on the side, one status filter for all three – but the middle is every agent on its
 * own lane of a live timeline, in the library's Agent Lanes. An agent's status is read from its tasks: running while
 * any task runs, else waiting while any waits, else failed when its latest task failed, else done. The filter keeps
 * the lanes of the agents with that status, and the events and decisions whose `agentId` it kept. Narrow, it stacks
 * with what needs you first.
 *
 *   <tc-mission-timeline .agents=${agents} .tasks=${tasks} .events=${since} .decisions=${waiting}></tc-mission-timeline>
 *
 * The lanes' and the inbox's own events (tc-expanded-change, tc-paused-change, tc-open, tc-answers-change, tc-decide)
 * bubble from here unchanged.
 */


/** A lane – Agent Lanes' LaneAgent, with an element avatar */
export type MissionLaneAgent = LaneAgent;
/** A task on a lane – Agent Lanes' LaneTask, with element tool marks */
export type MissionLaneTask = LaneTask;

const at = (t: number | Date | undefined) => (t instanceof Date ? t.getTime() : (t ?? 0));

/** Each agent's status from its tasks: running, waiting, failed (its latest task) or done */
export function laneAgentStatuses(agents: LaneAgent[], tasks: LaneTask[]) {
  const map = new Map<string, string>();
  for (const a of agents) {
    const own = tasks.filter((t) => t.agentId === a.id);
    if (!own.length) continue;
    const latest = own.reduce((x, y) => (at(y.end ?? y.start) >= at(x.end ?? x.start) ? y : x));
    map.set(
      a.id,
      own.some((t) => t.status === "running") ? "running" : own.some((t) => t.status === "waiting") ? "waiting" : latest.status === "failed" ? "failed" : "done",
    );
  }
  return map;
}

/**
 * The home of an agent product on one clock – what happened since you looked, every agent on its own lane, and what
 * needs you, under one status filter.
 * @tag tc-mission-timeline
 * @fires tc-filter-change - The status filter changed ({ filter }: MissionFilterChange); cancelable – prevented, `filter` stays as it was
 */
export class TcMissionTimeline extends TcMissionBase {
  static override ui = "mtl";
  static override css = missionCss("mtl");

  /** One lane per agent – Agent Lanes' `agents` */
  @property({ attribute: false }) accessor agents: LaneAgent[] = [];
  /** The agents' tasks – Agent Lanes' `tasks` */
  @property({ attribute: false }) accessor tasks: LaneTask[] = [];
  /** How much time the timeline shows, in ms – 30 minutes by default */
  @property({ type: Number }) accessor span = 30 * 60_000;
  /** How fast the timeline's clock runs against real time, for demos – Agent Lanes' `rate` */
  @property({ type: Number }) accessor rate: number | undefined = undefined;
  /** Approve on a waiting task; it may return a promise */
  @property({ attribute: false }) accessor onApprove: LaneTaskHandler | undefined = undefined;
  /** Reject on a waiting task; it may return a promise */
  @property({ attribute: false }) accessor onReject: LaneTaskHandler | undefined = undefined;
  /** A task's details show Open, which fires tc-open */
  @property({ type: Boolean }) accessor openable = false;

  constructor() {
    super();
    this.heading = "Mission timeline";
  }

  protected agentStatuses() {
    return laneAgentStatuses(this.agents ?? [], this.tasks ?? []);
  }

  protected renderAgents(filter: MissionFilter) {
    const statuses = this.agentStatuses();
    const agents = (this.agents ?? []).filter((a) => this.keeps(a.id, filter, statuses));
    const ids = new Set(agents.map((a) => a.id));
    const tasks = (this.tasks ?? []).filter((t) => ids.has(t.agentId));
    return html`<tc-agent-lanes
      look=${this.resolvedLook}
      heading=${this.l.agents}
      .agents=${agents}
      .tasks=${tasks}
      .span=${this.span}
      .now=${this.now}
      .rate=${this.rate}
      .onApprove=${this.onApprove}
      .onReject=${this.onReject}
      ?openable=${this.openable}
    ></tc-agent-lanes>`;
  }
}

if (!customElements.get("tc-mission-timeline")) customElements.define("tc-mission-timeline", TcMissionTimeline);

declare global {
  interface HTMLElementTagNameMap {
    "tc-mission-timeline": TcMissionTimeline;
  }
}
