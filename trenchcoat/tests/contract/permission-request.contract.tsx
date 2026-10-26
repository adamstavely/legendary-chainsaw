import type { ContractSpec } from "../contract.test";

const DENIED = { allow: false, scope: "once", at: 0 };

// The root is the tray; the ref is that element. Both the decision and the chosen scope can be controlled.
export const spec: ContractSpec = {
  component: "PermissionRequest",
  props: { agent: { name: "Coder" }, action: "push to main" },
  ref: "root",
  controlled: [
    {
      prop: "scope",
      values: ["once", "timed"],
      read: (root) => root.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]')?.dataset.scope,
    },
    {
      prop: "decision",
      values: [null, DENIED],
      read: (root) => (root.querySelector('.ui-pr__result[data-kind="denied"]') ? DENIED : root.querySelector('.ui-pr__card[role="group"]') ? null : "other"),
    },
  ],
};
