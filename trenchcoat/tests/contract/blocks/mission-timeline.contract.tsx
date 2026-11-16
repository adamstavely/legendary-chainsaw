import type { ContractSpec } from "../../contract.test";

const agents = [{ id: "a", name: "Planner" }];
const tasks = [{ id: "t", agentId: "a", title: "List stops", status: "done" as const, start: 0, end: 1000 }];

// The block is <tc-mission-timeline> through trenchcoat/react. jsdom loads @lit/react's node build, which never sets an element's
// properties, so its controlled state is checked in a real browser (tests/elements/mission-timeline.test.ts)
export const spec: ContractSpec = {
  root: "tc-mission-timeline",
  component: "MissionTimeline",
  props: { agents, tasks },
  ref: "root",
};
