import type { ContractSpec } from "../contract.test";

const options = [
  { id: "inc", label: "Incremental sync", reason: "Only changed rows move.", signal: 3 },
  { id: "full", label: "Full sync", reason: "Copies everything again.", signal: 1 },
];

export const spec: ContractSpec = {
  component: "SmartRecommendation",
  props: { options },
  ref: "root",
  controlled: [
    { prop: "value", values: ["inc", "full"], read: (root) => (root.querySelector(".ui-sr__reason")!.textContent!.startsWith("Only") ? "inc" : "full") },
    { prop: "accepted", values: [null, "inc"], read: (root) => (root.hasAttribute("data-accepted") ? "inc" : null) },
    { prop: "open", values: [true, false], read: (root) => root.querySelector(".ui-sr__head")!.getAttribute("aria-expanded") === "true" },
  ],
};
