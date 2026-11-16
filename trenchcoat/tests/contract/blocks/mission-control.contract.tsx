import type { ContractSpec } from "../../contract.test";

const root = { id: "lead", name: "Lead", task: "Notice", status: "running" as const };

// The block is <tc-mission-control> through trenchcoat/react. jsdom loads @lit/react's node build, which never sets an element's
// properties, so its controlled state is checked in a real browser (tests/elements/mission-control.test.ts)
export const spec: ContractSpec = {
  root: "tc-mission-control",
  component: "MissionControl",
  props: { root },
  ref: "root",
};
