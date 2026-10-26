import type { ContractSpec } from "../contract.test";

const models = [
  { id: "fast", name: "Swift", speed: 5, quality: 2, cost: 1 },
  { id: "deep", name: "Deep", speed: 2, quality: 5, cost: 4 },
];

const trigger = (root: HTMLElement) => root.querySelector(".ui-mdp__trigger")!;

export const spec: ContractSpec = {
  component: "ModelPicker",
  props: { models },
  ref: "root",
  controlled: [
    {
      prop: "value",
      values: ["fast", "deep"],
      read: (root) => (trigger(root).textContent!.includes("Deep") ? "deep" : "fast"),
    },
    { prop: "open", values: [false, true], read: (root) => trigger(root).getAttribute("aria-expanded") === "true" },
    {
      prop: "thinking",
      values: [false, true],
      read: (root) => trigger(root).textContent!.includes("extended thinking"),
    },
    {
      prop: "webSearch",
      values: [false, true],
      read: (root) => root.querySelectorAll('[role="switch"]')[1]!.getAttribute("aria-checked") === "true",
    },
    {
      prop: "effort",
      values: ["low", "high"],
      read: (root) => root.querySelector<HTMLElement>('[data-effort][aria-checked="true"]')?.dataset.effort,
    },
  ],
};
