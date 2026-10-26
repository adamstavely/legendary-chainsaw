import type { ContractSpec } from "../contract.test";

const tasks = [
  { id: "t1", label: "northwind.io", status: "done", start: 0, end: 1200 },
  { id: "t2", label: "acme.dev", status: "failed", start: 0, end: 900 },
];

// The root is the outer <div>; the filter shows as the pressed legend key, the selection as the pinned cell
export const spec: ContractSpec = {
  component: "FanoutGrid",
  props: { tasks, now: 2000 },
  controlled: [
    {
      prop: "filter",
      values: ["done", "failed"],
      read: (root) => root.querySelector('.ui-fog__key[aria-pressed="true"]')?.getAttribute("data-status") ?? null,
    },
    {
      prop: "selected",
      values: ["t1", "t2"],
      read: (root) => ([...root.querySelectorAll(".ui-fog__cell")].findIndex((c) => c.hasAttribute("data-pinned")) === 0 ? "t1" : "t2"),
    },
  ],
};
