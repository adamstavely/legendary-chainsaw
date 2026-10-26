import type { ContractSpec } from "../contract.test";

const entries = [
  { id: "a", action: "Created product", system: "Stripe", at: 1000 },
  { id: "b", action: "Set price", system: "Stripe", at: 2000 },
];

export const spec: ContractSpec = {
  component: "AgentLedger",
  props: { entries, now: 5000 },
  ref: "root",
  controlled: [
    {
      prop: "undone",
      values: [["a"], ["b"]],
      read: (root) => [...root.querySelectorAll("li[data-undone] .ui-alg__action")].map((el) => ({ "Created product": "a", "Set price": "b" })[el.textContent ?? ""]),
    },
  ],
};
