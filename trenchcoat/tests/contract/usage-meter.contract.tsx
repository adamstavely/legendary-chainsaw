import type { ContractSpec } from "../contract.test";

// UsageMeter's root is a <section>; the chosen period is controllable (period / defaultPeriod / onPeriodChange)
export const spec: ContractSpec = {
  component: "UsageMeter",
  props: {
    total: 100,
    used: [{ label: "Chat", value: 40 }],
    periods: [
      { id: "now", label: "This month" },
      { id: "last", label: "Last month" },
    ],
  },
  ref: "root",
  controlled: [
    {
      prop: "period",
      values: ["now", "last"],
      read: (root) => root.querySelector('[role="radio"][aria-checked="true"]')?.textContent === "This month" ? "now" : "last",
    },
  ],
};
