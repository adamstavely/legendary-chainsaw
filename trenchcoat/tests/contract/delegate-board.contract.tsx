import type { ContractSpec } from "../contract.test";

const agents = [{ id: "a1", name: "Research" }];
const tasks = [{ id: "t1", title: "Summarise the RFC", estimate: 12 }];

// The root is the outer <div>; the mode shows as the Auto switch
export const spec: ContractSpec = {
  component: "DelegateBoard",
  props: { agents, tasks, now: 0 },
  controlled: [
    {
      prop: "mode",
      values: ["manual", "auto"],
      read: (root) => (root.querySelector('[role="switch"]')!.getAttribute("aria-checked") === "true" ? "auto" : "manual"),
    },
  ],
};
