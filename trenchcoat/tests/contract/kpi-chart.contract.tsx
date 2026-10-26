import type { ContractSpec } from "../contract.test";

const labels = ["Mar 3", "Mar 4", "Mar 5"];

export const spec: ContractSpec = {
  component: "KpiChart",
  props: { title: "Revenue", value: "$9k", labels, series: [{ label: "Subscriptions", color: "#2f6bff", values: [3, 5, 4] }] },
  ref: "root",
  controlled: [
    {
      prop: "index",
      values: [0, 2],
      // The tooltip header names the highlighted point
      read: (root) => labels.indexOf(root.querySelector('[class$="__date"]')?.textContent ?? ""),
    },
  ],
};
