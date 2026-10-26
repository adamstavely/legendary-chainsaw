import type { ContractSpec } from "../contract.test";

const NOW = Date.UTC(2026, 9, 24, 12);
const tasks = [
  { id: "a", agentId: "ada", title: "Draft", status: "running", start: NOW - 60_000 },
  { id: "b", agentId: "ada", title: "Review", status: "done", start: NOW - 300_000, end: NOW - 120_000 },
];

export const spec: ContractSpec = {
  component: "AgentLanes",
  props: { agents: [{ id: "ada", name: "Ada" }], tasks, now: NOW },
  ref: "root",
  controlled: [
    {
      prop: "expanded",
      values: ["a", "b"],
      read: (root) => root.querySelector('[aria-expanded="true"]')?.getAttribute("data-task") ?? null,
    },
  ],
};
