import type { ContractSpec } from "../../contract.test";

// The period switch is the library SegmentedControl (a radiogroup)
const pressed = (root: HTMLElement, group: string) => root.querySelector(`[aria-label="${group}"] [aria-checked="true"] .ui-seg__text`)?.textContent;

export const spec: ContractSpec = {
  component: "MetricsDashboard",
  props: { now: Date.UTC(2026, 9, 24, 12) },
  ref: "root",
  controlled: [
    { prop: "range", values: ["7d", "90d"], read: (root) => ({ Week: "7d", Month: "30d", Quarter: "90d" })[pressed(root, "Period") ?? ""] },
    {
      prop: "metric",
      values: ["revenue", "orders"],
      read: (root) =>
        ({ Revenue: "revenue", Orders: "orders" })[root.querySelector('[role="tab"][aria-selected="true"] .ui-md__kpi-label')?.textContent ?? ""],
    },
  ],
};
