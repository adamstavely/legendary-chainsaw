import type { ContractSpec } from "../contract.test";

const tasks = [
  { id: "a", title: "Write the brief", agent: "Opus", status: "waiting", startedAt: 0 },
  { id: "b", title: "Check the numbers", agent: "Opus", status: "done", elapsed: 4000 },
];

export const spec: ContractSpec = {
  component: "AgentInbox",
  props: { tasks },
  ref: "root",
  controlled: [
    { prop: "view", values: ["board", "list"], read: (root) => root.getAttribute("data-view") },
    {
      prop: "expanded",
      values: ["a", "b"],
      read: (root) => root.querySelector('[aria-expanded="true"]')?.closest("[data-id]")?.getAttribute("data-id") ?? null,
    },
  ],
};
