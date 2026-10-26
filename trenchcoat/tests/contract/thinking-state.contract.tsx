import type { ContractSpec } from "../contract.test";

const steps = [
  { kind: "step", label: "Reading the brief" },
  { kind: "step", label: "Drafting the plan" },
];

export const spec: ContractSpec = {
  component: "ThinkingState",
  props: { steps },
  ref: "root",
  controlled: [
    { prop: "progress", values: [1, 2], read: (root) => root.querySelectorAll(".ui-think__item:not([data-kind='done'])").length },
    { prop: "done", values: [false, true], read: (root) => root.hasAttribute("data-done") },
    { prop: "open", values: [true, false], read: (root) => root.querySelector(".ui-think__head")!.getAttribute("aria-expanded") === "true" },
  ],
};
