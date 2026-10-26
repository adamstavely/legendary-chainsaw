import type { ContractSpec } from "../contract.test";

const actions = [
  { id: "read", label: "Read files", risk: "safe" },
  { id: "send", label: "Send email", risk: "risky" },
];

// The root is the outer <div>; the level shows as data-level, pins as pressed lock buttons
export const spec: ContractSpec = {
  component: "AutonomyDial",
  props: { actions },
  controlled: [
    { prop: "level", values: [0, 2], read: (root) => Number(root.getAttribute("data-level")) },
    {
      prop: "pinned",
      values: [["send"], ["read", "send"]],
      read: (root) =>
        [...root.querySelectorAll(".ui-ad__row")]
          .filter((r) => r.querySelector('[aria-pressed="true"]'))
          .map((r) => (r.textContent!.includes("Read files") ? "read" : "send"))
          .sort(),
    },
  ],
};
