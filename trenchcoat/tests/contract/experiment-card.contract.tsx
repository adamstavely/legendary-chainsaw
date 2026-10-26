import type { ContractSpec } from "../contract.test";

const variants = [
  { id: "a", key: "A", name: "Current", control: true, values: { cr: 3.1 } },
  { id: "b", key: "B", name: "One-page", values: { cr: 3.6 } },
];
const metrics = [
  { id: "cr", label: "Conversion" },
  { id: "aov", label: "Order value" },
];
const metricIds: Record<string, string> = { Conversion: "cr", "Order value": "aov" };

export const spec: ContractSpec = {
  component: "ExperimentCard",
  props: { title: "Checkout", variants, metrics },
  ref: "root",
  controlled: [
    { prop: "open", values: [true, false], read: (root) => root.querySelector('[aria-expanded]')?.getAttribute("aria-expanded") === "true" },
    { prop: "metric", values: ["cr", "aov"], read: (root) => metricIds[root.querySelector('[aria-label="Metric"] [aria-checked="true"]')?.textContent ?? ""] },
    {
      prop: "winner",
      values: ["b", null],
      read: (root) => ({ "One-page": "b", Current: "a" })[root.querySelector('[aria-label="Winner"] [aria-pressed="true"] [class$="__label"]')?.textContent ?? ""] ?? null,
    },
  ],
};
