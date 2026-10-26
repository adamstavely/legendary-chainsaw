import type { ContractSpec } from "../contract.test";

const root = {
  id: "lead",
  name: "Lead",
  task: "Plan the launch",
  status: "running",
  children: [{ id: "a", name: "Writer", task: "Draft", status: "running", children: [{ id: "a1", name: "Search", task: "Find sources", status: "done" }] }],
};

export const spec: ContractSpec = {
  component: "AgentTree",
  props: { root, now: Date.UTC(2026, 9, 24) },
  ref: "root",
  controlled: [
    {
      prop: "collapsed",
      values: [[], ["a"]],
      // Only "a" can be folded here (the lead's own toggle stays open): a closed toggle means ["a"]
      read: (root) => (root.querySelector('.ui-agt__fold[aria-expanded="false"]') ? ["a"] : []),
    },
  ],
};
