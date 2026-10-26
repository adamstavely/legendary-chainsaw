import type { ContractSpec } from "../contract.test";

export const spec: ContractSpec = {
  component: "AgentGraph",
  props: {
    nodes: [
      { id: "lead", name: "Lead", kind: "agent", lead: true },
      { id: "search", name: "Search", kind: "tool" },
    ],
    edges: [["lead", "search"]],
    now: 0,
  },
  ref: "root",
  controlled: [
    {
      prop: "selected",
      values: ["lead", "search"],
      // The open card is labelled with its node's name
      read: (root) => ({ Lead: "lead", Search: "search" })[root.querySelector('[role="dialog"]')?.getAttribute("aria-label") ?? ""] ?? null,
    },
  ],
};
