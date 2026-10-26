import type { ContractSpec } from "../contract.test";

const FILTERS: Record<string, string> = { All: "all", "High risk": "high", Unsure: "unsure" };

// The ref is the documented imperative handle (approve, reject, undo …), not the root element
export const spec: ContractSpec = {
  component: "ReviewCenter",
  props: { items: [], now: 0 },
  ref: { handle: (v) => !!v && typeof (v as { approve?: unknown }).approve === "function" && typeof (v as { undo?: unknown }).undo === "function" },
  controlled: [
    {
      prop: "filter",
      values: ["all", "high"],
      read: (root) => {
        const on = root.querySelector('.ui-rvc__filter[aria-pressed="true"]');
        return on ? FILTERS[on.childNodes[0]?.textContent ?? ""] : undefined;
      },
    },
  ],
};
