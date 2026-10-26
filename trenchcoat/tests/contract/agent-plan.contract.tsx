import type { ContractSpec } from "../contract.test";

const one = [{ id: "a", title: "Search the docs" }];
const two = [
  { id: "a", title: "Search the docs" },
  { id: "b", title: "Write the answer" },
];

export const spec: ContractSpec = {
  component: "AgentPlan",
  props: { defaultSteps: one },
  ref: "root",
  controlled: [
    {
      prop: "steps",
      values: [one, two],
      read: (root) => [...root.querySelectorAll(".ui-pl__name")].map((el) => ({ id: el.textContent === "Search the docs" ? "a" : "b", title: el.textContent })),
    },
    // status is controlled-only by design: the agent moves the plan from phase to phase
    { prop: "status", values: ["draft", "running"], read: (root) => root.getAttribute("data-status") },
  ],
};
