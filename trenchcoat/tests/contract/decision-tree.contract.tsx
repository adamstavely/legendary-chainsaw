import type { ContractSpec } from "../contract.test";

const decisions = [
  { id: "d1", question: "Roll back the release?", agent: "Release agent", options: [{ label: "Roll back" }, { label: "Keep it live" }] },
  { id: "d2", question: "Refund the customer?", agent: "Billing agent", options: [{ label: "Refund" }, { label: "Ask first" }] },
];

// The root is the outer <div>; the ref is the documented imperative handle. The decision on show is controllable
export const spec: ContractSpec = {
  component: "DecisionTree",
  props: { decisions },
  ref: { handle: (h) => !!h && typeof (h as { choose?: unknown }).choose === "function" && !(h instanceof Element) },
  controlled: [
    {
      prop: "decision",
      values: ["d1", "d2"],
      read: (root) => (root.querySelector(".ui-dct__q")!.textContent === "Roll back the release?" ? "d1" : "d2"),
    },
  ],
};
